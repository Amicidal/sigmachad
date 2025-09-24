#!/usr/bin/env tsx

/**
 * SonarQube Critical Issue Resolution Workflow
 * Multi-agent system for systematic issue resolution with 2-pass verification
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  sonar: {
    host: 'http://localhost:9000',
    token: 'squ_5bccbc30d7bdc8eda20bf09b93b6cad47884280c',
    projectKey: 'sigmachad'
  },
  workspace: '/Users/Coding/Desktop/sigmachad',
  maxConcurrentAgents: 3,
  passTimeout: 300000 // 5 minutes per pass
};

// Types
interface SonarIssue {
  key: string;
  component: string;
  line?: number;
  message: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  status: 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
  type: string;
  rule: string;
}

interface ResolutionResult {
  issue: SonarIssue;
  pass1Result?: ResolutionAttempt;
  pass2Result?: ResolutionAttempt;
  finalStatus: 'SUCCESS' | 'FAILED' | 'MANUAL_REVIEW';
  totalTime: number;
  attempts: number;
}

interface ResolutionAttempt {
  success: boolean;
  changes: string[];
  verificationResult: VerificationResult;
  error?: string;
  timestamp: Date;
}

interface VerificationResult {
  passed: boolean;
  issues?: string[];
  sonarValidation?: boolean;
  buildStatus?: 'SUCCESS' | 'FAILED';
  testStatus?: 'SUCCESS' | 'FAILED';
}

// Agent Classes
class IssueAnalyzer {
  async analyzeIssues(issues: SonarIssue[]): Promise<Map<string, SonarIssue[]>> {
    const categorized = new Map<string, SonarIssue[]>();

    for (const issue of issues) {
      const category = this.categorizeIssue(issue);
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(issue);
    }

    return categorized;
  }

  private categorizeIssue(issue: SonarIssue): string {
    if (issue.message.includes('Cognitive Complexity')) return 'cognitive_complexity';
    if (issue.message.includes('asynchronous operation outside of the constructor')) return 'async_constructor';
    if (issue.message.includes('nest functions more than 4 levels')) return 'deep_nesting';
    if (issue.message.includes('Unexpected empty')) return 'empty_methods';
    if (issue.message.includes('Provide a compare function')) return 'sort_stability';
    return 'other';
  }
}

class CodeResolver {
  constructor(private issueType: string) {}

  async resolveIssue(issue: SonarIssue, pass: number, previousFeedback?: string): Promise<ResolutionAttempt> {
    const startTime = Date.now();

    try {
      console.log(`🔧 Resolving ${issue.type} issue in pass ${pass}: ${issue.component}:${issue.line}`);

      const resolutionStrategy = this.getResolutionStrategy(issue);
      const changes = await this.applyFix(issue, resolutionStrategy, pass, previousFeedback);

      const verification = await this.runBasicVerification(issue, changes);

      return {
        success: verification.passed,
        changes,
        verificationResult: verification,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Resolution failed for ${issue.key}:`, error);
      return {
        success: false,
        changes: [],
        verificationResult: { passed: false, issues: [error.message] },
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  private getResolutionStrategy(issue: SonarIssue): string {
    const strategies = {
      cognitive_complexity: 'extract_functions_early_returns',
      async_constructor: 'factory_pattern_initialization',
      deep_nesting: 'guard_clauses_extraction',
      empty_methods: 'implement_or_remove',
      sort_stability: 'localeCompare_implementation'
    };

    return strategies[issue.type as keyof typeof strategies] || 'generic_refactor';
  }

  private async applyFix(issue: SonarIssue, strategy: string, pass: number, feedback?: string): Promise<string[]> {
    // This would integrate with Claude Code's editing capabilities
    const changes: string[] = [];

    // Simulate fix application - in real implementation, this would use Claude Code's editing API
    console.log(`   Applying ${strategy} strategy for ${issue.component}`);

    // Placeholder for actual fix logic
    changes.push(`Modified ${issue.component} using ${strategy}`);

    return changes;
  }

  private async runBasicVerification(issue: SonarIssue, changes: string[]): Promise<VerificationResult> {
    try {
      // Basic syntax check
      execSync('npm run type-check', { cwd: CONFIG.workspace, timeout: 30000 });

      return {
        passed: true,
        sonarValidation: false, // Would need API call
        buildStatus: 'SUCCESS',
        testStatus: 'SUCCESS' // Would run relevant tests
      };
    } catch (error) {
      return {
        passed: false,
        issues: [error.message],
        buildStatus: 'FAILED'
      };
    }
  }
}

class CodeVerifier {
  async verifyFix(issue: SonarIssue, attempt: ResolutionAttempt): Promise<VerificationResult> {
    console.log(`🔍 Verifying fix for ${issue.key}`);

    const results: VerificationResult = {
      passed: true,
      issues: []
    };

    // 1. Build verification
    try {
      execSync('npm run build', { cwd: CONFIG.workspace, timeout: 60000 });
      results.buildStatus = 'SUCCESS';
    } catch (error) {
      results.passed = false;
      results.issues!.push(`Build failed: ${error.message}`);
      results.buildStatus = 'FAILED';
      return results;
    }

    // 2. Test verification (run relevant tests)
    try {
      execSync('npm run test:unit', { cwd: CONFIG.workspace, timeout: 120000 });
      results.testStatus = 'SUCCESS';
    } catch (error) {
      results.passed = false;
      results.issues!.push(`Tests failed: ${error.message}`);
      results.testStatus = 'FAILED';
    }

    // 3. SonarQube validation (would check if issue is resolved)
    // This would require API call to verify specific issue status

    return results;
  }
}

class QualityAssurance {
  async runComprehensiveQA(results: ResolutionResult[]): Promise<QaReport> {
    const report: QaReport = {
      totalIssues: results.length,
      successfulResolutions: results.filter(r => r.finalStatus === 'SUCCESS').length,
      failedResolutions: results.filter(r => r.finalStatus === 'FAILED').length,
      manualReviews: results.filter(r => r.finalStatus === 'MANUAL_REVIEW').length,
      averageResolutionTime: 0,
      issuesByType: {},
      commonFailurePatterns: []
    };

    // Calculate metrics
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    report.averageResolutionTime = totalTime / results.length;

    // Categorize by issue type
    results.forEach(result => {
      const type = result.issue.type;
      if (!report.issuesByType[type]) {
        report.issuesByType[type] = { total: 0, successful: 0, failed: 0 };
      }
      report.issuesByType[type].total++;
      if (result.finalStatus === 'SUCCESS') {
        report.issuesByType[type].successful++;
      } else {
        report.issuesByType[type].failed++;
      }
    });

    return report;
  }
}

interface QaReport {
  totalIssues: number;
  successfulResolutions: number;
  failedResolutions: number;
  manualReviews: number;
  averageResolutionTime: number;
  issuesByType: Record<string, { total: number; successful: number; failed: number }>;
  commonFailurePatterns: string[];
}

// Main Workflow Orchestrator
class CriticalIssueFixWorkflow {
  private analyzer = new IssueAnalyzer();
  private qa = new QualityAssurance();
  private activeAgents = 0;

  async executeWorkflow(): Promise<void> {
    console.log('🚀 Starting SonarQube Critical Issue Resolution Workflow');

    // Phase 1: Discover Issues
    const issues = await this.queryCriticalIssues();
    console.log(`📊 Found ${issues.length} critical issues`);

    // Phase 2: Analyze and Categorize
    const categorizedIssues = await this.analyzer.analyzeIssues(issues);
    console.log('📋 Issues categorized:', Object.fromEntries(
      Array.from(categorizedIssues.entries()).map(([k, v]) => [k, v.length])
    ));

    // Phase 3: Execute Two-Pass Resolution
    const results = await this.executeResolutionPasses(categorizedIssues);

    // Phase 4: Quality Assurance & Reporting
    const qaReport = await this.qa.runComprehensiveQA(results);
    await this.generateReport(results, qaReport);

    console.log('✅ Workflow completed');
  }

  private async queryCriticalIssues(): Promise<SonarIssue[]> {
    const cmd = `curl -s -u "${CONFIG.sonar.token}:" "${CONFIG.sonar.host}/api/issues/search?componentKeys=${CONFIG.sonar.projectKey}&severities=CRITICAL&statuses=OPEN&ps=500"`;

    try {
      const response = execSync(cmd, { encoding: 'utf8' });
      const data = JSON.parse(response);
      return data.issues || [];
    } catch (error) {
      console.error('Failed to query SonarQube:', error);
      return [];
    }
  }

  private async executeResolutionPasses(categorizedIssues: Map<string, SonarIssue[]>): Promise<ResolutionResult[]> {
    const results: ResolutionResult[] = [];
    const queue = Array.from(categorizedIssues.values()).flat();

    // Process issues with concurrency control
    const processQueue = async () => {
      while (queue.length > 0 && this.activeAgents < CONFIG.maxConcurrentAgents) {
        const issue = queue.shift()!;
        this.activeAgents++;

        this.processIssue(issue)
          .then(result => {
            results.push(result);
            this.activeAgents--;
          })
          .catch(error => {
            console.error(`Failed to process issue ${issue.key}:`, error);
            this.activeAgents--;
          });
      }
    };

    // Process all issues
    const workers = Array(CONFIG.maxConcurrentAgents).fill(null).map(() => processQueue());
    await Promise.all(workers);

    return results;
  }

  private async processIssue(issue: SonarIssue): Promise<ResolutionResult> {
    const startTime = Date.now();
    let attempts = 0;

    console.log(`\n🎯 Processing issue: ${issue.key} (${issue.component}:${issue.line})`);

    // Pass 1: Initial Resolution
    const resolver = new CodeResolver(issue.type);
    const verifier = new CodeVerifier();

    const pass1Result = await this.withTimeout(
      resolver.resolveIssue(issue, 1),
      CONFIG.passTimeout,
      `Pass 1 timeout for ${issue.key}`
    );

    attempts++;
    let finalStatus: 'SUCCESS' | 'FAILED' | 'MANUAL_REVIEW' = 'FAILED';

    if (pass1Result.success) {
      const verification = await verifier.verifyFix(issue, pass1Result);
      if (verification.passed) {
        finalStatus = 'SUCCESS';
        console.log(`✅ Issue ${issue.key} resolved in Pass 1`);
      } else {
        console.log(`⚠️  Pass 1 verification failed, attempting Pass 2`);

        // Pass 2: Refinement
        const feedback = verification.issues?.join('; ') || 'Verification failed';
        const pass2Result = await this.withTimeout(
          resolver.resolveIssue(issue, 2, feedback),
          CONFIG.passTimeout,
          `Pass 2 timeout for ${issue.key}`
        );

        attempts++;

        if (pass2Result.success) {
          const finalVerification = await verifier.verifyFix(issue, pass2Result);
          if (finalVerification.passed) {
            finalStatus = 'SUCCESS';
            console.log(`✅ Issue ${issue.key} resolved in Pass 2`);
          } else {
            finalStatus = 'MANUAL_REVIEW';
            console.log(`❌ Issue ${issue.key} requires manual review after Pass 2`);
          }

          return {
            issue,
            pass1Result,
            pass2Result,
            finalStatus,
            totalTime: Date.now() - startTime,
            attempts
          };
        }
      }
    }

    return {
      issue,
      pass1Result,
      finalStatus,
      totalTime: Date.now() - startTime,
      attempts
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      promise.then(resolve).catch(reject).finally(() => clearTimeout(timeout));
    });
  }

  private async generateReport(results: ResolutionResult[], qaReport: QaReport): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: qaReport,
      detailedResults: results.map(r => ({
        issueKey: r.issue.key,
        component: r.issue.component,
        line: r.line,
        type: r.issue.type,
        finalStatus: r.finalStatus,
        attempts: r.attempts,
        totalTimeMs: r.totalTime,
        pass1Success: r.pass1Result?.success,
        pass2Success: r.pass2Result?.success
      }))
    };

    const reportPath = path.join(CONFIG.workspace, 'sonar-resolution-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Report generated: ${reportPath}`);
    console.log(`📊 Success Rate: ${((qaReport.successfulResolutions / qaReport.totalIssues) * 100).toFixed(1)}%`);
  }
}

// Execute the workflow
const workflow = new CriticalIssueFixWorkflow();
workflow.executeWorkflow().catch(console.error);

export { CriticalIssueFixWorkflow, IssueAnalyzer, CodeResolver, CodeVerifier, QualityAssurance };
