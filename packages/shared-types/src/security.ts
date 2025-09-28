/**
 * Security-related type definitions for Memento
 */

// Base security types
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SecurityCategory =
  | 'sast'
  | 'secrets'
  | 'dependency'
  | 'configuration'
  | 'compliance';
export type ScanStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type IssueStatus =
  | 'open'
  | 'closed'
  | 'in_progress'
  | 'resolved'
  | 'suppressed';

// Security scanning options
export interface SecurityScanOptions {
  includeSAST: boolean;
  includeSCA: boolean;
  includeSecrets: boolean;
  includeDependencies: boolean;
  includeCompliance: boolean;
  severityThreshold: SecuritySeverity;
  confidenceThreshold: number;
  maxIssues?: number;
  timeout?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

// Security issue interface
export interface SecurityIssue {
  id: string;
  type: 'securityIssue';
  tool: string;
  ruleId: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  cwe?: string;
  owasp?: string;
  affectedEntityId: string;
  lineNumber: number;
  codeSnippet: string;
  remediation: string;
  status: IssueStatus;
  discoveredAt: Date;
  lastScanned: Date;
  confidence: number;
  fingerprint?: string;
  metadata?: Record<string, any>;
}

// Vulnerability interface
export interface Vulnerability {
  id: string;
  type: 'vulnerability';
  packageName: string;
  version: string;
  vulnerabilityId: string;
  severity: SecuritySeverity;
  description: string;
  cvssScore: number;
  affectedVersions: string;
  fixedInVersion: string;
  publishedAt: Date;
  lastUpdated: Date;
  exploitability: 'low' | 'medium' | 'high';
  references?: string[];
  metadata?: Record<string, any>;
}

// Security scan result
export interface SecurityScanResult {
  scanId?: string;
  status: ScanStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  issues: SecurityIssue[];
  vulnerabilities: Vulnerability[];
  summary: SecurityScanSummary;
  metadata?: Record<string, any>;
}

// Security scan summary
export interface SecurityScanSummary {
  totalIssues: number;
  totalVulnerabilities: number;
  bySeverity: Record<SecuritySeverity, number>;
  byCategory: Record<SecurityCategory, number>;
  byStatus: Record<IssueStatus, number>;
  filesScanned: number;
  linesAnalyzed: number;
  scanDuration: number;
}

// Security rule definition
export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: SecuritySeverity;
  cwe?: string;
  owasp?: string;
  pattern: RegExp;
  category: SecurityCategory;
  remediation: string;
  confidence?: number;
  tags?: string[];
}

// Secret match interface
export interface SecretMatch {
  type: string;
  value: string;
  filePath: string;
  lineNumber: number;
  column: number;
  entropy?: number;
  verified?: boolean;
}

// Security metrics
export interface SecurityMetrics {
  scanMetrics: {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    averageScanTime: number;
  };
  issueMetrics: {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
  };
  vulnerabilityMetrics: {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    patchableVulnerabilities: number;
  };
  trendMetrics: {
    issuesTrend: 'improving' | 'degrading' | 'stable';
    vulnerabilitiesTrend: 'improving' | 'degrading' | 'stable';
    securityScoreTrend: 'improving' | 'degrading' | 'stable';
  };
}

// Security suppression rule
export interface SecuritySuppressionRule {
  id: string;
  type: 'vulnerability' | 'issue';
  target: {
    package?: string;
    vulnerabilityId?: string;
    ruleId?: string;
    path?: string;
  };
  until?: string; // ISO date
  reason: string;
  createdBy: string;
  createdAt: Date;
}

// Security audit result
export interface SecurityAuditResult {
  scope: 'full' | 'recent' | 'critical-only';
  startTime: Date;
  endTime?: Date;
  findings: SecurityFinding[];
  recommendations: string[];
  score: number;
  complianceStatus?: ComplianceStatus;
  trends?: SecurityTrends;
}

// Security finding
export interface SecurityFinding {
  type:
    | 'common-issue'
    | 'severity-alert'
    | 'trend-alert'
    | 'compliance-gap'
    | 'error';
  rule?: string;
  count?: number;
  severity: SecuritySeverity;
  description: string;
  impact?: string;
  recommendation?: string;
}

// Compliance status
export interface ComplianceStatus {
  framework: string;
  scope: string;
  overallScore: number;
  requirements: ComplianceRequirement[];
  gaps: string[];
  recommendations: string[];
}

// Compliance requirement
export interface ComplianceRequirement {
  id: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  description: string;
  evidence?: string[];
  gaps?: string[];
}

// Security trends
export interface SecurityTrends {
  period: string;
  newIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  securityScore: {
    current: number;
    previous: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
}

// Security policy
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  enforcement: 'blocking' | 'warning' | 'informational';
  scope: string[];
  metadata?: Record<string, any>;
}

// Security policy set
export interface SecurityPolicySet {
  id: string;
  name: string;
  description: string;
  policies: SecurityPolicy[];
  defaultSeverityThreshold: SecuritySeverity;
  defaultConfidenceThreshold: number;
  metadata?: Record<string, any>;
}

// Security monitoring configuration
export interface SecurityMonitoringConfig {
  enabled: boolean;
  schedule: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  alerts: SecurityAlert[];
  notifications: NotificationChannel[];
  retention: {
    scanResults: number; // days
    issues: number; // days
    vulnerabilities: number; // days
  };
}

// Security alert
export interface SecurityAlert {
  type: string;
  severity: SecuritySeverity;
  threshold: number;
  channels: string[];
  conditions: AlertCondition[];
}

// Alert condition
export interface AlertCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'regex';
  value: any;
}

// Notification channel
export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'github' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

// Security report
export interface SecurityReport {
  id: string;
  type: 'scan' | 'audit' | 'compliance' | 'trend';
  format: 'json' | 'html' | 'markdown' | 'pdf' | 'csv';
  // eslint-disable-next-line security/detect-object-injection
  data: any;
  generatedAt: Date;
  metadata?: Record<string, any>;
}

// Dependency information
export interface DependencyInfo {
  name: string;
  version: string;
  ecosystem: string;
  scope?: 'runtime' | 'development' | 'optional';
  path?: string;
  direct: boolean;
  licenses?: string[];
  metadata?: Record<string, any>;
}

// Code security issue (extends SecurityIssue with code-specific fields)
export interface CodeSecurityIssue extends SecurityIssue {
  filePath: string;
  column?: number;
  endLine?: number;
  endColumn?: number;
  context?: {
    before: string[];
    after: string[];
  };
}

// Vulnerability report
export interface VulnerabilityReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  vulnerabilities: Vulnerability[];
  byPackage: Record<string, Vulnerability[]>;
  remediation: {
    immediate: string[];
    planned: string[];
    monitoring: string[];
  };
  trends?: {
    newVulnerabilities: number;
    resolvedVulnerabilities: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
}
