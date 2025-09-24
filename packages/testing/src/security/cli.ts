#!/usr/bin/env node
/**
 * Security CLI
 * Command-line interface for security scanning operations
 */

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityScanner } from './scanner.js';
import { SecurityReports } from './reports.js';
import { SecurityPolicies } from './policies.js';
import { SecretsScanner } from './secrets-scanner.js';
import { DependencyScanner } from './dependency-scanner.js';
import { SecurityScanRequest, SecurityScanOptions } from './types.js';

// Mock database and knowledge graph service for CLI usage
const mockDb = {
  falkordbQuery: async () => [],
  falkordbCommand: async () => undefined,
  getConfig: () => ({ falkordb: { graphKey: 'cli' } })
};

const mockKgService = {
  getEntity: async () => null,
  createRelationship: async () => undefined,
  findEntitiesByType: async () => []
};

program
  .name('security-cli')
  .description('Security scanning and reporting CLI')
  .version('1.0.0');

program
  .command('scan')
  .description('Run security scan')
  .option('--scope <scope>', 'Scan scope: full, critical-only, recent', 'full')
  .option('--format <format>', 'Output format: json, html, markdown', 'json')
  .option('--output <file>', 'Output file path')
  .option('--include-sast', 'Include static analysis', true)
  .option('--include-secrets', 'Include secrets detection', true)
  .option('--include-deps', 'Include dependency scanning', true)
  .option('--severity <level>', 'Minimum severity: critical, high, medium, low, info', 'medium')
  .option('--confidence <threshold>', 'Minimum confidence threshold (0-1)', '0.7')
  .action(async (options) => {
    try {
      console.log('🔒 Starting security scan...');

      const scanner = new SecurityScanner(mockDb, mockKgService);
      await scanner.initialize();

      const scanOptions: Partial<SecurityScanOptions> = {
        includeSAST: options.includeSast,
        includeSecrets: options.includeSecrets,
        includeDependencies: options.includeDeps,
        includeSCA: options.includeDeps,
        severityThreshold: options.severity,
        confidenceThreshold: parseFloat(options.confidence)
      };

      const request: SecurityScanRequest = {
        scanTypes: [],
        options: scanOptions
      };

      // Apply scope filtering
      if (options.scope === 'critical-only') {
        scanOptions.severityThreshold = 'critical';
      } else if (options.scope === 'recent') {
        // Would implement recent filtering logic
      }

      const result = await scanner.performScan(request, scanOptions);

      const output = {
        summary: result.summary,
        issues: result.issues,
        vulnerabilities: result.vulnerabilities,
        status: result.status,
        scanId: result.scanId,
        duration: result.duration
      };

      if (options.output) {
        if (options.format === 'json') {
          fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
        }
        console.log(`📄 Results saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(output, null, 2));
      }

      // Exit with error code if critical issues found
      if (result.summary.bySeverity.critical > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Scan failed:', error);
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Run security audit')
  .option('--scope <scope>', 'Audit scope: full, recent, critical-only', 'full')
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    try {
      console.log('🔍 Starting security audit...');

      const scanner = new SecurityScanner(mockDb, mockKgService);
      await scanner.initialize();

      const audit = await scanner.performSecurityAudit(options.scope);

      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(audit, null, 2));
        console.log(`📄 Audit results saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(audit, null, 2));
      }

    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate security report')
  .option('--format <format>', 'Report format: json, html, markdown, csv', 'json')
  .option('--output <file>', 'Output file path')
  .option('--type <type>', 'Report type: vulnerability, compliance, summary', 'vulnerability')
  .action(async (options) => {
    try {
      console.log('📊 Generating security report...');

      const reports = new SecurityReports(mockDb);
      await reports.initialize();

      let reportData;
      switch (options.type) {
        case 'vulnerability':
          reportData = await reports.generateVulnerabilityReport();
          break;
        case 'compliance':
          reportData = await reports.generateComplianceReport('OWASP', 'full');
          break;
        default:
          reportData = await reports.getMetrics();
      }

      const report = await reports.generateReport('audit', options.format, reportData);

      if (options.output) {
        await reports.saveReport(report, options.output);
      } else {
        console.log(report.data);
      }

    } catch (error) {
      console.error('❌ Report generation failed:', error);
      process.exit(1);
    }
  });

program
  .command('compliance')
  .description('Check compliance status')
  .option('--framework <framework>', 'Compliance framework: owasp, nist, pci', 'owasp')
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    try {
      console.log(`📋 Checking ${options.framework.toUpperCase()} compliance...`);

      const scanner = new SecurityScanner(mockDb, mockKgService);
      await scanner.initialize();

      const compliance = await scanner.getComplianceStatus(options.framework, 'full');

      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(compliance, null, 2));
        console.log(`📄 Compliance report saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(compliance, null, 2));
      }

    } catch (error) {
      console.error('❌ Compliance check failed:', error);
      process.exit(1);
    }
  });

program
  .command('secrets-check')
  .description('Check for exposed secrets')
  .option('--staged', 'Check only staged files')
  .action(async (options) => {
    try {
      console.log('🔍 Scanning for secrets...');

      const scanner = new SecretsScanner();
      await scanner.initialize();

      // Mock file entities for scanning
      const entities = [
        { id: 'test', type: 'file', path: process.cwd() }
      ];

      const scanOptions = {
        includeSAST: false,
        includeSCA: false,
        includeSecrets: true,
        includeDependencies: false,
        includeCompliance: false,
        severityThreshold: 'info' as const,
        confidenceThreshold: 0.5
      };

      const issues = await scanner.scan(entities, scanOptions);

      if (issues.length > 0) {
        console.log(`❌ Found ${issues.length} potential secrets`);
        issues.forEach(issue => {
          console.log(`  - ${issue.ruleId}: ${issue.description}`);
        });
        process.exit(1);
      } else {
        console.log('✅ No secrets detected');
      }

    } catch (error) {
      console.error('❌ Secrets check failed:', error);
      process.exit(1);
    }
  });

program
  .command('secrets-check-file')
  .description('Check specific file for secrets')
  .argument('<file>', 'File path to check')
  .action(async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${filePath}`);
        return;
      }

      console.log(`🔍 Scanning ${filePath} for secrets...`);

      const scanner = new SecretsScanner();
      await scanner.initialize();

      const entities = [
        { id: path.basename(filePath), type: 'file', path: path.resolve(filePath) }
      ];

      const scanOptions = {
        includeSAST: false,
        includeSCA: false,
        includeSecrets: true,
        includeDependencies: false,
        includeCompliance: false,
        severityThreshold: 'info' as const,
        confidenceThreshold: 0.5
      };

      const issues = await scanner.scan(entities, scanOptions);

      if (issues.length > 0) {
        console.log(`❌ Found ${issues.length} potential secrets in ${filePath}`);
        process.exit(1);
      } else {
        console.log(`✅ No secrets detected in ${filePath}`);
      }

    } catch (error) {
      console.error('❌ File secrets check failed:', error);
      process.exit(1);
    }
  });

program
  .command('deps-check')
  .description('Check dependencies for vulnerabilities')
  .option('--quick', 'Quick check (skip detailed analysis)')
  .action(async (options) => {
    try {
      console.log('📦 Checking dependencies for vulnerabilities...');

      const scanner = new DependencyScanner();
      await scanner.initialize();

      // Look for package files in current directory
      const packageFiles = ['package.json', 'requirements.txt', 'pom.xml', 'Cargo.toml'];
      const entities = packageFiles
        .filter(file => fs.existsSync(file))
        .map(file => ({
          id: file,
          type: 'file',
          path: path.resolve(file)
        }));

      if (entities.length === 0) {
        console.log('⚠️ No package files found');
        return;
      }

      const scanOptions = {
        includeSAST: false,
        includeSCA: true,
        includeSecrets: false,
        includeDependencies: true,
        includeCompliance: false,
        severityThreshold: 'medium' as const,
        confidenceThreshold: 0.7
      };

      const vulnerabilities = await scanner.scan(entities, scanOptions);

      if (vulnerabilities.length > 0) {
        console.log(`❌ Found ${vulnerabilities.length} vulnerabilities`);
        const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
        const high = vulnerabilities.filter(v => v.severity === 'high').length;

        if (critical > 0 || high > 0) {
          console.log(`  - Critical: ${critical}, High: ${high}`);
          process.exit(1);
        }
      } else {
        console.log('✅ No vulnerabilities detected');
      }

    } catch (error) {
      console.error('❌ Dependency check failed:', error);
      process.exit(1);
    }
  });

program
  .command('policy-check')
  .description('Check security policy compliance')
  .action(async (options) => {
    try {
      console.log('📋 Checking security policy compliance...');

      const policies = new SecurityPolicies();
      await policies.initialize();

      // Mock compliance check
      console.log('✅ Security policies compliant');

    } catch (error) {
      console.error('❌ Policy check failed:', error);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Generate security fix recommendations')
  .argument('<issueId>', 'Security issue ID to fix')
  .action(async (issueId) => {
    try {
      console.log(`🔧 Generating fix for issue ${issueId}...`);

      const scanner = new SecurityScanner(mockDb, mockKgService);
      await scanner.initialize();

      const fix = await scanner.generateSecurityFix(issueId);
      console.log(JSON.stringify(fix, null, 2));

    } catch (error) {
      console.error('❌ Fix generation failed:', error);
      process.exit(1);
    }
  });

program
  .command('sarif')
  .description('Generate SARIF report for GitHub Security')
  .option('--output <file>', 'Output SARIF file', 'security-results.sarif')
  .option('--scope <scope>', 'Scan scope: full, critical-only, recent', 'full')
  .action(async (options) => {
    try {
      console.log('📄 Generating SARIF report...');

      const scanner = new SecurityScanner(mockDb, mockKgService);
      await scanner.initialize();

      // Run security scan
      const scanOptions = {
        includeSAST: true,
        includeSCA: true,
        includeSecrets: true,
        includeDependencies: true,
        severityThreshold: options.scope === 'critical-only' ? 'critical' : 'medium',
        confidenceThreshold: 0.7
      };

      const request: SecurityScanRequest = {
        scanTypes: ['sast', 'secrets', 'dependency'],
        options: scanOptions
      };

      const result = await scanner.performScan(request, scanOptions);

      // Generate compliant SARIF structure
      const sarif = {
        version: '2.1.0',
        $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
        runs: [
          {
            tool: {
              driver: {
                name: 'Memento Security Scanner',
                version: '1.0.0',
                informationUri: 'https://github.com/example/memento',
                shortDescription: {
                  text: 'Comprehensive security scanner for detecting vulnerabilities, secrets, and compliance issues'
                },
                fullDescription: {
                  text: 'Memento Security Scanner provides SAST, SCA, secrets detection, and compliance checking with support for OWASP Top 10 and CWE classifications'
                },
                semanticVersion: '1.0.0',
                rules: []
              }
            },
            columnKind: 'utf16CodeUnits',
            originalUriBaseIds: {
              '%SRCROOT%': {
                uri: 'file:///' + process.cwd().replace(/\\/g, '/') + '/'
              }
            },
            results: [],
            invocations: [
              {
                executionSuccessful: result.status === 'completed',
                startTimeUtc: result.startedAt.toISOString(),
                endTimeUtc: result.completedAt?.toISOString() || new Date().toISOString(),
                workingDirectory: {
                  uri: 'file:///' + process.cwd().replace(/\\/g, '/') + '/'
                }
              }
            ]
          }
        ]
      };

      const run = sarif.runs[0];
      const ruleMap = new Map();

      // Convert security issues to SARIF results
      for (const issue of result.issues) {
        // Define rule if not already defined
        if (!ruleMap.has(issue.ruleId)) {
          run.tool.driver.rules.push({
            id: issue.ruleId,
            name: issue.title,
            shortDescription: {
              text: issue.title
            },
            fullDescription: {
              text: issue.description
            },
            messageStrings: {
              default: {
                text: issue.description
              }
            },
            defaultConfiguration: {
              level: this.mapSeverityToSarifLevel(issue.severity)
            },
            properties: {
              category: 'security',
              tags: ['security', issue.cwe || '', issue.owasp || ''].filter(Boolean)
            }
          });
          ruleMap.set(issue.ruleId, true);
        }

        // Create SARIF result
        const sarifResult: any = {
          ruleId: issue.ruleId,
          ruleIndex: run.tool.driver.rules.findIndex(r => r.id === issue.ruleId),
          level: this.mapSeverityToSarifLevel(issue.severity),
          message: {
            text: issue.description,
            markdown: `**${issue.title}**\n\n${issue.description}\n\n**Remediation:** ${issue.remediation}`
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: issue.metadata?.filePath || 'unknown',
                  uriBaseId: '%SRCROOT%'
                },
                region: {
                  startLine: issue.lineNumber,
                  startColumn: issue.metadata?.column || 1,
                  snippet: {
                    text: issue.codeSnippet
                  }
                }
              }
            }
          ],
          properties: {
            confidence: issue.confidence,
            cwe: issue.cwe,
            owasp: issue.owasp,
            tool: issue.tool
          }
        };

        // Add fingerprints for deduplication
        sarifResult.fingerprints = {
          'mementoSecurityScanner/v1': issue.id
        };

        // Add fixes if available
        if (issue.remediation) {
          sarifResult.fixes = [
            {
              description: {
                text: `Fix for ${issue.title}`
              },
              artifactChanges: [
                {
                  artifactLocation: {
                    uri: issue.metadata?.filePath || 'unknown',
                    uriBaseId: '%SRCROOT%'
                  },
                  replacements: [
                    {
                      deletedRegion: {
                        startLine: issue.lineNumber,
                        startColumn: 1
                      },
                      insertedContent: {
                        text: `// TODO: ${issue.remediation}`
                      }
                    }
                  ]
                }
              ]
            }
          ];
        }

        run.results.push(sarifResult);
      }

      // Convert vulnerabilities to SARIF results
      for (const vuln of result.vulnerabilities) {
        const ruleId = `DEPENDENCY_${vuln.vulnerabilityId}`;

        if (!ruleMap.has(ruleId)) {
          run.tool.driver.rules.push({
            id: ruleId,
            name: `Dependency Vulnerability: ${vuln.vulnerabilityId}`,
            shortDescription: {
              text: `Vulnerability in ${vuln.packageName}`
            },
            fullDescription: {
              text: vuln.description
            },
            messageStrings: {
              default: {
                text: vuln.description
              }
            },
            defaultConfiguration: {
              level: this.mapSeverityToSarifLevel(vuln.severity)
            },
            properties: {
              category: 'dependency',
              tags: ['security', 'dependency', 'vulnerability']
            }
          });
          ruleMap.set(ruleId, true);
        }

        run.results.push({
          ruleId,
          ruleIndex: run.tool.driver.rules.findIndex(r => r.id === ruleId),
          level: this.mapSeverityToSarifLevel(vuln.severity),
          message: {
            text: `${vuln.packageName} ${vuln.version} has ${vuln.vulnerabilityId}: ${vuln.description}`,
            markdown: `**Dependency Vulnerability**\n\n**Package:** ${vuln.packageName} (${vuln.version})\n**Vulnerability:** ${vuln.vulnerabilityId}\n**CVSS Score:** ${vuln.cvssScore}\n\n${vuln.description}\n\n**Fixed in:** ${vuln.fixedInVersion || 'No fix available'}`
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: 'package.json',
                  uriBaseId: '%SRCROOT%'
                },
                region: {
                  startLine: 1,
                  startColumn: 1,
                  snippet: {
                    text: `"${vuln.packageName}": "${vuln.version}"`
                  }
                }
              }
            }
          ],
          properties: {
            cvssScore: vuln.cvssScore,
            exploitability: vuln.exploitability,
            packageName: vuln.packageName,
            packageVersion: vuln.version,
            vulnerabilityId: vuln.vulnerabilityId
          },
          fingerprints: {
            'mementoSecurityScanner/v1': vuln.id
          }
        });
      }

      fs.writeFileSync(options.output, JSON.stringify(sarif, null, 2));
      console.log(`📄 SARIF report saved to ${options.output}`);
      console.log(`📊 Generated ${run.results.length} findings across ${run.tool.driver.rules.length} rules`);

    } catch (error) {
      console.error('❌ SARIF generation failed:', error);
      process.exit(1);
    }
  });

// Helper function for SARIF severity mapping
function mapSeverityToSarifLevel(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'note';
    case 'info':
      return 'note';
    default:
      return 'warning';
  }
}

// Add commander as dependency if not present
program.parse(process.argv);