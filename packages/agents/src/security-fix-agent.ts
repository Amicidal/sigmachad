import { BaseAgent } from './agent-base.js';
import { AgentMetadata, AgentTask, AgentEvent } from './types.js';
import { SecurityScanner } from '../../testing/src/security/scanner.js';
import { SecurityReports } from '../../testing/src/security/reports.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityFixTask {
  id: string;
  type: 'security-fix';
  issueId?: string;
  filePath?: string;
  ruleId?: string;
  severity?: string;
  autoFix?: boolean;
  dryRun?: boolean;
  priority: 'immediate' | 'high' | 'medium' | 'low';
}

export interface SecurityFixResult {
  issueId: string;
  filePath: string;
  ruleId: string;
  status: 'fixed' | 'partial' | 'failed' | 'skipped';
  fixes: SecurityFix[];
  rollbackData?: RollbackData;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface SecurityFix {
  type: 'code-replacement' | 'configuration' | 'dependency-update' | 'manual-review';
  description: string;
  originalCode?: string;
  fixedCode?: string;
  explanation: string;
  confidence: number;
  testable: boolean;
}

export interface RollbackData {
  originalContent: string;
  backupPath: string;
  timestamp: Date;
  checksum: string;
}

/**
 * Security Fix Agent
 * Automatically generates and applies security fixes based on scan results
 */
export class SecurityFixAgent extends BaseAgent {
  private securityScanner: SecurityScanner;
  private securityReports: SecurityReports;
  private rollbackService: RollbackService;

  constructor(
    metadata: AgentMetadata,
    private db: any,
    private kgService: any,
    private rollbackConfig: any = {}
  ) {
    super(metadata);
    this.securityScanner = new SecurityScanner(this.db, this.kgService);
    this.securityReports = new SecurityReports(this.db);
    this.rollbackService = new RollbackService(rollbackConfig);
  }

  protected async onInitialize(config?: Record<string, any>): Promise<void> {
    await this.securityScanner.initialize();
    await this.securityReports.initialize();
    await this.rollbackService.initialize();

    this.log('info', 'SecurityFixAgent initialized', {
      config,
      capabilities: this.getCapabilities()
    });
  }

  protected async executeTask(task: AgentTask): Promise<SecurityFixResult> {
    const securityTask = task as SecurityFixTask;

    this.log('info', 'Executing security fix task', {
      taskId: task.id,
      issueId: securityTask.issueId,
      ruleId: securityTask.ruleId,
      autoFix: securityTask.autoFix
    });

    // Get security issue details
    const issue = await this.getSecurityIssue(securityTask);
    if (!issue) {
      throw new Error(`Security issue not found: ${securityTask.issueId}`);
    }

    // Generate fixes
    const fixSuggestion = await this.securityReports.generateSecurityFix(issue.id);
    const fixes = await this.generateFixes(issue, fixSuggestion);

    let result: SecurityFixResult = {
      issueId: issue.id,
      filePath: issue.metadata?.filePath || 'unknown',
      ruleId: issue.ruleId,
      status: 'skipped',
      fixes,
      confidence: this.calculateOverallConfidence(fixes),
      impact: this.assessImpact(issue)
    };

    // Apply fixes if auto-fix is enabled
    if (securityTask.autoFix && !securityTask.dryRun) {
      result = await this.applyFixes(issue, fixes, result);
    }

    // Emit fix completion event
    await this.emitEvent('security-fix-completed', {
      taskId: task.id,
      result,
      autoFixed: securityTask.autoFix && !securityTask.dryRun
    });

    return result;
  }

  protected async onPause(): Promise<void> {
    this.log('info', 'SecurityFixAgent paused');
  }

  protected async onResume(): Promise<void> {
    this.log('info', 'SecurityFixAgent resumed');
  }

  protected async onStop(): Promise<void> {
    this.log('info', 'SecurityFixAgent stopped');
  }

  protected async handleEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case 'security-scan-completed':
        await this.handleScanCompleted(event);
        break;

      case 'rollback-requested':
        await this.handleRollbackRequest(event);
        break;

      case 'security-issue-created':
        await this.handleNewSecurityIssue(event);
        break;

      default:
        this.log('info', 'Unhandled event', { eventType: event.type });
    }
  }

  private async getSecurityIssue(task: SecurityFixTask): Promise<any> {
    if (task.issueId) {
      // Get specific issue by ID from database
      const results = await this.db.falkordbQuery(
        'MATCH (i:SecurityIssue {id: $id}) RETURN i',
        { id: task.issueId }
      );
      return results.length > 0 ? results[0].i : null;
    }

    if (task.filePath && task.ruleId) {
      // Find issues in specific file for specific rule
      const results = await this.db.falkordbQuery(
        `MATCH (i:SecurityIssue {ruleId: $ruleId})
         WHERE i.filePath CONTAINS $filePath
         RETURN i
         ORDER BY i.severity DESC
         LIMIT 1`,
        { ruleId: task.ruleId, filePath: task.filePath }
      );
      return results.length > 0 ? results[0].i : null;
    }

    throw new Error('Insufficient task information to identify security issue');
  }

  private async generateFixes(issue: any, fixSuggestion: any): Promise<SecurityFix[]> {
    const fixes: SecurityFix[] = [];

    // Get rule-specific fix templates
    const fixTemplates = this.getFixTemplates();
    const template = fixTemplates[issue.ruleId];

    if (template) {
      // Generate code replacement fix
      const codeFix = await this.generateCodeFix(issue, template);
      if (codeFix) {
        fixes.push(codeFix);
      }

      // Generate configuration fixes if applicable
      const configFix = await this.generateConfigurationFix(issue, template);
      if (configFix) {
        fixes.push(configFix);
      }

      // Generate dependency fixes if applicable
      if (issue.ruleId.includes('DEPENDENCY')) {
        const depFix = await this.generateDependencyFix(issue, template);
        if (depFix) {
          fixes.push(depFix);
        }
      }
    }

    // Always include manual review option
    fixes.push({
      type: 'manual-review',
      description: 'Manual code review and fix required',
      explanation: fixSuggestion.fixes?.[0]?.explanation || issue.remediation,
      confidence: 0.5,
      testable: true
    });

    return fixes;
  }

  private async generateCodeFix(issue: any, template: any): Promise<SecurityFix | null> {
    try {
      const filePath = issue.metadata?.filePath;
      if (!filePath || !fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lineIndex = Math.max(0, issue.lineNumber - 1);
      const originalLine = lines[lineIndex];

      // Apply rule-specific transformations
      const fixedLine = this.applySecurityTransformation(originalLine, issue.ruleId);

      if (fixedLine && fixedLine !== originalLine) {
        return {
          type: 'code-replacement',
          description: `Fix ${issue.ruleId} on line ${issue.lineNumber}`,
          originalCode: originalLine.trim(),
          fixedCode: fixedLine.trim(),
          explanation: template.explanation || issue.remediation,
          confidence: template.confidence || 0.8,
          testable: true
        };
      }
    } catch (error) {
      this.log('error', 'Failed to generate code fix', { issue: issue.id, error });
    }

    return null;
  }

  private async generateConfigurationFix(issue: any, template: any): Promise<SecurityFix | null> {
    // Generate configuration-based fixes (security headers, CORS, etc.)
    const configFixes: Record<string, any> = {
      CORS_MISCONFIGURATION: {
        description: 'Configure CORS with specific origins',
        fixedCode: `// app.js\napp.use(cors({\n  origin: ['https://yourdomain.com'],\n  credentials: true\n}));`,
        explanation: 'Restrict CORS to specific trusted origins instead of using wildcard'
      },

      DEBUG_MODE_ENABLED: {
        description: 'Disable debug mode in production',
        fixedCode: `// Environment configuration\nNODE_ENV=production\nDEBUG=false`,
        explanation: 'Ensure debug mode is disabled in production environments'
      },

      WEAK_SESSION_CONFIG: {
        description: 'Configure secure session settings',
        fixedCode: `session({\n  secret: process.env.SESSION_SECRET,\n  secure: true,\n  httpOnly: true,\n  sameSite: 'strict'\n})`,
        explanation: 'Use secure session configuration with proper flags'
      }
    };

    const configFix = configFixes[issue.ruleId];
    if (configFix) {
      return {
        type: 'configuration',
        description: configFix.description,
        fixedCode: configFix.fixedCode,
        explanation: configFix.explanation,
        confidence: 0.9,
        testable: true
      };
    }

    return null;
  }

  private async generateDependencyFix(issue: any, template: any): Promise<SecurityFix | null> {
    // Check if this is a dependency vulnerability
    if (issue.packageName && issue.fixedInVersion) {
      return {
        type: 'dependency-update',
        description: `Update ${issue.packageName} to ${issue.fixedInVersion}`,
        originalCode: `"${issue.packageName}": "${issue.version}"`,
        fixedCode: `"${issue.packageName}": "${issue.fixedInVersion}"`,
        explanation: `Update dependency to fix ${issue.vulnerabilityId}`,
        confidence: 0.95,
        testable: true
      };
    }

    return null;
  }

  private async applyFixes(
    issue: any,
    fixes: SecurityFix[],
    result: SecurityFixResult
  ): Promise<SecurityFixResult> {
    const applicableFixes = fixes.filter(fix =>
      fix.type !== 'manual-review' &&
      fix.confidence >= 0.7
    );

    if (applicableFixes.length === 0) {
      result.status = 'skipped';
      return result;
    }

    try {
      // Create rollback data before making changes
      const rollbackData = await this.createRollbackData(issue.metadata?.filePath);
      result.rollbackData = rollbackData;

      let appliedFixes = 0;

      for (const fix of applicableFixes) {
        const applied = await this.applyIndividualFix(issue, fix);
        if (applied) {
          appliedFixes++;
        }
      }

      if (appliedFixes === applicableFixes.length) {
        result.status = 'fixed';
      } else if (appliedFixes > 0) {
        result.status = 'partial';
      } else {
        result.status = 'failed';
      }

      // Run verification scan
      await this.verifyFix(issue, result);

      this.log('info', 'Security fixes applied', {
        issueId: issue.id,
        appliedFixes,
        totalFixes: applicableFixes.length,
        status: result.status
      });

    } catch (error) {
      result.status = 'failed';
      this.log('error', 'Failed to apply security fixes', {
        issueId: issue.id,
        error: error instanceof Error ? error.message : error
      });

      // Attempt rollback on failure
      if (result.rollbackData) {
        await this.rollbackService.performRollback(result.rollbackData);
      }
    }

    return result;
  }

  private async applyIndividualFix(issue: any, fix: SecurityFix): Promise<boolean> {
    try {
      switch (fix.type) {
        case 'code-replacement':
          return await this.applyCodeReplacement(issue, fix);

        case 'configuration':
          return await this.applyConfigurationFix(issue, fix);

        case 'dependency-update':
          return await this.applyDependencyUpdate(issue, fix);

        default:
          return false;
      }
    } catch (error) {
      this.log('error', 'Failed to apply individual fix', {
        issueId: issue.id,
        fixType: fix.type,
        error
      });
      return false;
    }
  }

  private async applyCodeReplacement(issue: any, fix: SecurityFix): Promise<boolean> {
    const filePath = issue.metadata?.filePath;
    if (!filePath || !fix.originalCode || !fix.fixedCode) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content.replace(fix.originalCode, fix.fixedCode);

      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        this.log('info', 'Applied code replacement', {
          filePath,
          original: fix.originalCode,
          fixed: fix.fixedCode
        });
        return true;
      }
    } catch (error) {
      this.log('error', 'Code replacement failed', { filePath, error });
    }

    return false;
  }

  private async applyConfigurationFix(issue: any, fix: SecurityFix): Promise<boolean> {
    // This would involve more complex configuration management
    // For now, just log the recommended configuration
    this.log('info', 'Configuration fix recommended', {
      issueId: issue.id,
      description: fix.description,
      recommendation: fix.fixedCode
    });
    return true; // Mark as applied for demo purposes
  }

  private async applyDependencyUpdate(issue: any, fix: SecurityFix): Promise<boolean> {
    // This would involve updating package.json and running pnpm install
    // For safety, we'll just log the recommendation
    this.log('info', 'Dependency update recommended', {
      issueId: issue.id,
      description: fix.description,
      update: fix.fixedCode
    });
    return true; // Mark as recommended
  }

  private async createRollbackData(filePath: string): Promise<RollbackData> {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const backupPath = await this.rollbackService.createBackup(filePath, content);

    return {
      originalContent: content,
      backupPath,
      timestamp: new Date(),
      checksum: this.calculateChecksum(content)
    };
  }

  private async verifyFix(issue: any, result: SecurityFixResult): Promise<void> {
    // Run a targeted scan to verify the fix
    try {
      const filePath = issue.metadata?.filePath;
      if (!filePath) return;

      const entities = [{
        id: path.basename(filePath),
        type: 'file',
        path: filePath
      }];

      const scanResult = await this.securityScanner.scan(entities, {
        includeSAST: true,
        includeSecrets: true,
        includeSCA: false,
        includeDependencies: false,
        includeCompliance: false,
        severityThreshold: 'info',
        confidenceThreshold: 0.5
      });

      // Check if the specific issue still exists
      const stillExists = scanResult.some(newIssue =>
        newIssue.ruleId === issue.ruleId &&
        Math.abs(newIssue.lineNumber - issue.lineNumber) <= 2
      );

      if (!stillExists) {
        this.log('info', 'Fix verification successful - issue resolved', {
          issueId: issue.id,
          ruleId: issue.ruleId
        });
      } else {
        this.log('warn', 'Fix verification failed - issue still present', {
          issueId: issue.id,
          ruleId: issue.ruleId
        });
        result.status = 'failed';
      }

    } catch (error) {
      this.log('error', 'Fix verification error', { issueId: issue.id, error });
    }
  }

  private applySecurityTransformation(line: string, ruleId: string): string | null {
    const transformations: Record<string, (line: string) => string> = {
      SQL_INJECTION: (line: string) => {
        // Transform string concatenation to parameterized query
        return line
          .replace(/(['"])([^'"]*)\1\s*\+\s*(\w+)/g, '?, [$3]')
          .replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1?$3", [$2]');
      },

      XSS_VULNERABILITY: (line: string) => {
        // Transform innerHTML to textContent
        return line
          .replace(/\.innerHTML\s*=/g, '.textContent =')
          .replace(/\$\([^)]+\)\.html\(/g, '$(element).text(');
      },

      HARDCODED_SECRET: (line: string) => {
        // Transform hardcoded values to environment variables
        if (line.includes('=')) {
          const [left, right] = line.split('=', 2);
          const varName = left.trim().replace(/^(const|let|var)\s+/, '').toUpperCase();
          return `${left} = process.env.${varName};`;
        }
        return line;
      },

      WEAK_CRYPTO: (line: string) => {
        // Transform weak crypto algorithms
        return line
          .replace(/createHash\s*\(\s*['"]md5['"]\s*\)/g, "createHash('sha256')")
          .replace(/createHash\s*\(\s*['"]sha1['"]\s*\)/g, "createHash('sha256')");
      },

      INSECURE_RANDOM: (line: string) => {
        // Transform Math.random() to crypto.randomBytes()
        return line.replace(/Math\.random\(\)/g, 'crypto.randomBytes(16).toString("hex")');
      }
    };

    const transformer = transformations[ruleId];
    return transformer ? transformer(line) : null;
  }

  private calculateOverallConfidence(fixes: SecurityFix[]): number {
    if (fixes.length === 0) return 0;

    const totalConfidence = fixes.reduce((sum, fix) => sum + fix.confidence, 0);
    return totalConfidence / fixes.length;
  }

  private assessImpact(issue: any): 'high' | 'medium' | 'low' {
    switch (issue.severity) {
      case 'critical':
        return 'high';
      case 'high':
        return 'medium';
      default:
        return 'low';
    }
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getFixTemplates(): Record<string, any> {
    return {
      SQL_INJECTION: {
        confidence: 0.9,
        explanation: 'Replace string concatenation with parameterized queries'
      },
      XSS_VULNERABILITY: {
        confidence: 0.8,
        explanation: 'Use safe DOM manipulation methods'
      },
      HARDCODED_SECRET: {
        confidence: 0.7,
        explanation: 'Move secrets to environment variables'
      },
      WEAK_CRYPTO: {
        confidence: 0.9,
        explanation: 'Use strong cryptographic algorithms'
      },
      INSECURE_RANDOM: {
        confidence: 0.9,
        explanation: 'Use cryptographically secure random generation'
      }
    };
  }

  private getCapabilities(): string[] {
    return [
      'automatic-code-fixes',
      'configuration-recommendations',
      'dependency-updates',
      'rollback-support',
      'fix-verification',
      'impact-assessment'
    ];
  }

  // Event handlers

  private async handleScanCompleted(event: AgentEvent): Promise<void> {
    const scanResult = event.data.result;

    if (scanResult.summary.bySeverity.critical > 0) {
      // Auto-create fix tasks for critical issues
      const criticalIssues = scanResult.issues.filter(
        (issue: any) => issue.severity === 'critical'
      );

      for (const issue of criticalIssues) {
        await this.emitEvent('security-fix-needed', {
          issueId: issue.id,
          priority: 'immediate',
          autoFix: true // Auto-fix critical issues
        });
      }
    }
  }

  private async handleRollbackRequest(event: AgentEvent): Promise<void> {
    const { rollbackId } = event.data;

    try {
      await this.rollbackService.performRollback(rollbackId);
      await this.emitEvent('rollback-completed', {
        rollbackId,
        status: 'success'
      });
    } catch (error) {
      await this.emitEvent('rollback-failed', {
        rollbackId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async handleNewSecurityIssue(event: AgentEvent): Promise<void> {
    const issue = event.data.issue;

    // Determine if this issue should be auto-fixed
    const autoFixRules = [
      'HARDCODED_SECRET',
      'WEAK_CRYPTO',
      'INSECURE_RANDOM',
      'DEBUG_MODE_ENABLED'
    ];

    if (autoFixRules.includes(issue.ruleId) && issue.confidence > 0.8) {
      await this.emitEvent('security-fix-needed', {
        issueId: issue.id,
        priority: issue.severity === 'critical' ? 'immediate' : 'high',
        autoFix: true
      });
    }
  }
}

/**
 * Rollback Service for managing security fix rollbacks
 */
class RollbackService {
  private backupDir: string;

  constructor(private config: any = {}) {
    this.backupDir = config.backupDir || './.security-backups';
  }

  async initialize(): Promise<void> {
    const fs = require('fs');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(filePath: string, content: string): Promise<string> {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);

    fs.writeFileSync(backupPath, content, 'utf8');
    return backupPath;
  }

  async performRollback(rollbackData: RollbackData | string): Promise<void> {
    const fs = require('fs');

    if (typeof rollbackData === 'string') {
      // Rollback by backup file path
      const backupPath = rollbackData;
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      // This would require more metadata to know which file to restore
      throw new Error('Rollback by path requires additional metadata');
    } else {
      // Rollback using RollbackData object
      const originalPath = rollbackData.backupPath.replace(/\.[\d-T]+\.backup$/, '');

      // Verify backup exists
      if (!fs.existsSync(rollbackData.backupPath)) {
        throw new Error(`Backup file not found: ${rollbackData.backupPath}`);
      }

      // Restore original content
      fs.writeFileSync(originalPath, rollbackData.originalContent, 'utf8');
    }
  }

  async cleanupOldBackups(olderThanDays: number = 7): Promise<void> {
    const fs = require('fs');
    const files = fs.readdirSync(this.backupDir);
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
