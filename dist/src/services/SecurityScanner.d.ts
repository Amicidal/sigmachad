/**
 * Security Scanner Service for Memento
 * Performs security scanning, vulnerability detection, and security monitoring
 */
import { DatabaseService } from './DatabaseService.js';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { SecurityIssue } from '../models/entities.js';
import { SecurityScanRequest, SecurityScanResult, VulnerabilityReport } from '../models/types.js';
import { EventEmitter } from 'events';
export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    cwe?: string;
    owasp?: string;
    pattern: RegExp;
    category: 'sast' | 'secrets' | 'dependency' | 'configuration';
    remediation: string;
}
export interface SecurityScanOptions {
    includeSAST: boolean;
    includeSCA: boolean;
    includeSecrets: boolean;
    includeDependencies: boolean;
    severityThreshold: 'critical' | 'high' | 'medium' | 'low' | 'info';
    confidenceThreshold: number;
}
export interface SecurityMonitoringConfig {
    enabled: boolean;
    schedule: 'hourly' | 'daily' | 'weekly';
    alerts: {
        type: string;
        severity: string;
        threshold: number;
        channels: string[];
    }[];
}
export declare class SecurityScanner extends EventEmitter {
    private db;
    private kgService;
    private rules;
    private monitoringConfig;
    private scanHistory;
    constructor(db: DatabaseService, kgService: KnowledgeGraphService);
    initialize(): Promise<void>;
    private initializeSecurityRules;
    private ensureSecuritySchema;
    private loadMonitoringConfig;
    performScan(request: SecurityScanRequest, options?: Partial<SecurityScanOptions>): Promise<SecurityScanResult>;
    private getEntitiesToScan;
    private performSASTScan;
    private performSCAScan;
    private performSecretsScan;
    private performDependencyScan;
    private scanFileForIssues;
    private shouldIncludeRule;
    private getLineNumber;
    private getCodeSnippet;
    private readFileContent;
    private checkPackageVulnerabilities;
    private isVersionVulnerable;
    private generateScanSummary;
    private storeScanResults;
    getVulnerabilityReport(): Promise<VulnerabilityReport>;
    getSecurityIssues(filters?: {
        severity?: string[];
        status?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        issues: SecurityIssue[];
        total: number;
    }>;
    performSecurityAudit(scope?: 'full' | 'recent' | 'critical-only'): Promise<any>;
    private analyzeAuditFindings;
    private generateAuditRecommendations;
    private calculateSecurityScore;
    generateSecurityFix(issueId: string): Promise<any>;
    private generateFixForIssue;
    private getFixPriority;
    private getFixEffort;
    setupMonitoring(config: SecurityMonitoringConfig): Promise<void>;
    getComplianceStatus(framework: string, scope: string): Promise<any>;
    getScanHistory(limit?: number): Promise<any[]>;
}
//# sourceMappingURL=SecurityScanner.d.ts.map