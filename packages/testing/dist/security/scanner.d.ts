/**
 * Main Security Scanner Service
 * Orchestrates all security scanning activities including SAST, SCA, secrets detection, and compliance checks
 */
import { EventEmitter } from "events";
import { SecurityScanOptions, SecurityScanRequest, SecurityScanResult, SecurityIssue, SecurityMonitoringConfig, SecuritySeverity } from "./types.js";
import { IncrementalScanResult } from "./incremental-scanner.js";
export interface SecurityScannerConfig {
    policies?: string;
    monitoring?: SecurityMonitoringConfig;
    suppressions?: string;
    timeout?: number;
    maxConcurrentScans?: number;
}
export declare class SecurityScanner extends EventEmitter {
    private db;
    private kgService;
    private config;
    private codeScanner;
    private dependencyScanner;
    private secretsScanner;
    private vulnerabilityDb;
    private policies;
    private reports;
    private incrementalScanner;
    private activeScan;
    private scanHistory;
    private monitoringConfig;
    constructor(db: any, kgService: any, config?: SecurityScannerConfig);
    initialize(): Promise<void>;
    performIncrementalScan(request: SecurityScanRequest & {
        baselineScanId?: string;
    }, options?: Partial<SecurityScanOptions>): Promise<IncrementalScanResult>;
    performScan(request: SecurityScanRequest, options?: Partial<SecurityScanOptions>): Promise<SecurityScanResult>;
    private performSequentialScan;
    private performParallelScan;
    private chunkArray;
    private mergeChunkResults;
    getScanResult(scanId: string): Promise<SecurityScanResult | null>;
    cancelScan(scanId: string): Promise<boolean>;
    getSecurityIssues(filters?: {
        severity?: SecuritySeverity[];
        status?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        issues: SecurityIssue[];
        total: number;
    }>;
    getVulnerabilityReport(): Promise<any>;
    performSecurityAudit(scope?: "full" | "recent" | "critical-only"): Promise<any>;
    generateSecurityFix(issueId: string): Promise<any>;
    setupMonitoring(config: SecurityMonitoringConfig): Promise<void>;
    getComplianceStatus(framework: string, scope: string): Promise<any>;
    getScanHistory(limit?: number): Promise<any[]>;
    private generateScanId;
    private createEmptySummary;
    private generateScanSummary;
    private getEntitiesToScan;
    private ensureSecuritySchema;
    private ensureUniqueConstraint;
    private loadMonitoringConfig;
    private storeScanResults;
    private storeSecurityIssue;
    private storeVulnerability;
    private validateSecurityIssue;
    private validateSeverity;
    private validateIssueStatus;
    private parseDate;
    private extractIssueData;
    private extractCountFromResult;
}
//# sourceMappingURL=scanner.d.ts.map