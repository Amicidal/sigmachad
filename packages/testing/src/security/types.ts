/**
 * TypeScript interfaces for security scanning components
 * Note: Security types are now imported from @memento/shared-types
 */

// Re-export security types from shared-types
export type {
  SecurityRule,
  SecuritySeverity,
  SecurityCategory,
  ScanStatus,
  IssueStatus,
  SecurityScanOptions,
  SecurityIssue,
  Vulnerability,
  SecurityScanResult,
  SecurityScanSummary,
  VulnerabilityReport,
  SecurityPolicy,
  SecurityPolicySet,
  SecurityMonitoringConfig,
  SecurityAlert,
  AlertCondition,
  NotificationChannel,
  SecurityAuditResult,
  SecurityFinding,
  ComplianceStatus,
  ComplianceRequirement,
  SecurityTrends,
  SecuritySuppressionRule,
  SecurityReport,
  DependencyInfo,
  CodeSecurityIssue,
  SecretMatch,
  SecurityMetrics,
} from '@memento/shared-types';

export type { SecurityScanRequest };
