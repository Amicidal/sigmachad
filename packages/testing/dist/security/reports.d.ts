/**
 * Security Reports Generation
 * Generates various security reports in different formats
 */
import { SecurityReport, VulnerabilityReport, SecurityAuditResult, ComplianceStatus, SecurityMetrics } from "./types.js";
export declare class SecurityReports {
    private db;
    private reportsCache;
    constructor(db?: any);
    initialize(): Promise<void>;
    generateVulnerabilityReport(): Promise<VulnerabilityReport>;
    generateAuditReport(scope?: "full" | "recent" | "critical-only"): Promise<SecurityAuditResult>;
    generateComplianceReport(framework: string, scope: string): Promise<ComplianceStatus>;
    generateSecurityFix(issueId: string): Promise<any>;
    generateReport(type: "scan" | "audit" | "compliance" | "trend", format: "json" | "html" | "markdown" | "pdf" | "csv", data: any): Promise<SecurityReport>;
    saveReport(report: SecurityReport, filePath: string): Promise<void>;
    getMetrics(): Promise<SecurityMetrics>;
    private getVulnerabilitiesFromDB;
    private getSecurityIssuesFromDB;
    private getSecurityIssueById;
    private categorizeRemediation;
    private addMockVulnerabilityData;
    private analyzeFindings;
    private generateRecommendations;
    private calculateSecurityScore;
    private calculateVulnerabilityTrends;
    private calculateSecurityTrends;
    private generateFixForIssue;
    private getFixPriority;
    private getFixEffort;
    private assessFixImpact;
    private formatAsHTML;
    private formatAsMarkdown;
    private formatAsCSV;
    private mapVulnerabilityResult;
    private mapSecurityIssueResult;
    private extractData;
}
//# sourceMappingURL=reports.d.ts.map