/**
 * @file TestCIIntegration.ts
 * @description CI/CD integration for temporal test tracking
 *
 * Provides GitHub Actions integration, test history badges, trend reporting,
 * and automated alerts for temporal test data.
 */
import { TestExecutionRecord, TestEvolutionEvent, TestRelationship, TestConfiguration } from './TestTypes.js';
export interface GitHubActionsConfig {
    /** GitHub repository owner */
    owner: string;
    /** GitHub repository name */
    repo: string;
    /** GitHub token for API access */
    token: string;
    /** Workflow file name */
    workflowFile: string;
    /** Enable automatic badge updates */
    enableBadgeUpdates: boolean;
    /** Enable trend reporting */
    enableTrendReporting: boolean;
    /** Enable automated alerts */
    enableAutomatedAlerts: boolean;
}
export interface BadgeConfiguration {
    /** Badge style */
    style: 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';
    /** Badge color scheme */
    colorScheme: 'auto' | 'success' | 'warning' | 'critical' | 'info';
    /** Custom colors */
    customColors?: {
        passing: string;
        failing: string;
        flaky: string;
        unknown: string;
    };
    /** Badge format */
    format: 'svg' | 'json' | 'shields';
}
export interface TrendReportConfig {
    /** Report frequency */
    frequency: 'daily' | 'weekly' | 'monthly';
    /** Report format */
    format: 'markdown' | 'html' | 'json' | 'slack';
    /** Include visualizations */
    includeVisualizations: boolean;
    /** Report recipients */
    recipients: string[];
    /** Custom templates */
    customTemplate?: string;
}
export interface AlertConfiguration {
    /** Alert channels */
    channels: Array<{
        type: 'slack' | 'email' | 'webhook' | 'github_issue';
        endpoint: string;
        credentials?: Record<string, string>;
    }>;
    /** Alert thresholds */
    thresholds: {
        failureRate: number;
        flakinessScore: number;
        performanceRegression: number;
        coverageDecrease: number;
    };
    /** Alert frequency limits */
    rateLimits: {
        maxAlertsPerHour: number;
        cooldownPeriod: number;
    };
}
export interface TestBadge {
    /** Badge identifier */
    badgeId: string;
    /** Badge type */
    type: 'test_status' | 'coverage' | 'flakiness' | 'performance' | 'trend';
    /** Badge label */
    label: string;
    /** Badge message */
    message: string;
    /** Badge color */
    color: string;
    /** Badge URL */
    url: string;
    /** Last updated */
    lastUpdated: Date;
    /** Badge SVG content */
    svg: string;
}
export interface TrendReport {
    /** Report identifier */
    reportId: string;
    /** Report timestamp */
    timestamp: Date;
    /** Report period */
    period: {
        start: Date;
        end: Date;
    };
    /** Report format */
    format: string;
    /** Executive summary */
    summary: {
        totalTests: number;
        totalExecutions: number;
        successRate: number;
        averageCoverage: number;
        flakinessScore: number;
        performanceTrend: 'improving' | 'degrading' | 'stable';
        keyInsights: string[];
    };
    /** Detailed sections */
    sections: Array<{
        title: string;
        content: string;
        visualizations?: Array<{
            type: 'chart' | 'graph' | 'table';
            data: any;
            config: any;
        }>;
    }>;
    /** Report content */
    content: string;
}
export interface AlertEvent {
    /** Alert identifier */
    alertId: string;
    /** Alert timestamp */
    timestamp: Date;
    /** Alert type */
    type: 'failure_spike' | 'flakiness_increase' | 'performance_regression' | 'coverage_drop' | 'trend_change';
    /** Alert severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Alert message */
    message: string;
    /** Affected tests */
    affectedTests: Array<{
        testId: string;
        entityId: string;
        impact: string;
    }>;
    /** Alert details */
    details: {
        threshold: number;
        actualValue: number;
        trend: string;
        recommendations: string[];
    };
    /** Alert status */
    status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
}
export interface WorkflowIntegration {
    /** Workflow identifier */
    workflowId: string;
    /** Workflow name */
    name: string;
    /** Trigger conditions */
    triggers: Array<{
        event: string;
        conditions: Record<string, any>;
    }>;
    /** Workflow steps */
    steps: Array<{
        name: string;
        action: string;
        parameters: Record<string, any>;
    }>;
    /** Output handling */
    outputs: Array<{
        name: string;
        source: string;
        destination: string;
    }>;
}
export interface ITestCIIntegration {
    /**
     * Generate test status badge
     */
    generateTestBadge(testId?: string, entityId?: string, badgeType?: 'status' | 'coverage' | 'flakiness' | 'performance', config?: Partial<BadgeConfiguration>): Promise<TestBadge>;
    /**
     * Update GitHub repository badges
     */
    updateGitHubBadges(badges: TestBadge[]): Promise<void>;
    /**
     * Generate trend report
     */
    generateTrendReport(period: {
        start: Date;
        end: Date;
    }, config?: Partial<TrendReportConfig>): Promise<TrendReport>;
    /**
     * Send trend report
     */
    sendTrendReport(report: TrendReport, config: TrendReportConfig): Promise<void>;
    /**
     * Check for alert conditions
     */
    checkAlertConditions(config: AlertConfiguration): Promise<AlertEvent[]>;
    /**
     * Send alerts
     */
    sendAlerts(alerts: AlertEvent[], config: AlertConfiguration): Promise<void>;
    /**
     * Create GitHub Actions workflow
     */
    createGitHubWorkflow(workflow: WorkflowIntegration): Promise<string>;
    /**
     * Update workflow status
     */
    updateWorkflowStatus(workflowId: string, status: 'running' | 'success' | 'failure' | 'cancelled', details?: Record<string, any>): Promise<void>;
    /**
     * Get CI/CD metrics
     */
    getCIMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        workflowRuns: number;
        successRate: number;
        averageDuration: number;
        failureReasons: Array<{
            reason: string;
            count: number;
            percentage: number;
        }>;
        trends: Record<string, Array<{
            timestamp: Date;
            value: number;
        }>>;
    }>;
}
/**
 * CI/CD integration service for temporal test tracking
 */
export declare class TestCIIntegration implements ITestCIIntegration {
    private executionData;
    private eventData;
    private relationshipData;
    private readonly config;
    private readonly githubConfig?;
    private badgeCache;
    private alertHistory;
    constructor(config?: Partial<TestConfiguration>, githubConfig?: GitHubActionsConfig, executionData?: Map<string, TestExecutionRecord[]>, eventData?: Map<string, TestEvolutionEvent[]>, relationshipData?: Map<string, TestRelationship[]>);
    /**
     * Generate test status badge
     */
    generateTestBadge(testId?: string, entityId?: string, badgeType?: 'status' | 'coverage' | 'flakiness' | 'performance', config?: Partial<BadgeConfiguration>): Promise<TestBadge>;
    /**
     * Update GitHub repository badges
     */
    updateGitHubBadges(badges: TestBadge[]): Promise<void>;
    /**
     * Generate trend report
     */
    generateTrendReport(period: {
        start: Date;
        end: Date;
    }, config?: Partial<TrendReportConfig>): Promise<TrendReport>;
    /**
     * Send trend report
     */
    sendTrendReport(report: TrendReport, config: TrendReportConfig): Promise<void>;
    /**
     * Check for alert conditions
     */
    checkAlertConditions(config: AlertConfiguration): Promise<AlertEvent[]>;
    /**
     * Send alerts
     */
    sendAlerts(alerts: AlertEvent[], config: AlertConfiguration): Promise<void>;
    /**
     * Create GitHub Actions workflow
     */
    createGitHubWorkflow(workflow: WorkflowIntegration): Promise<string>;
    /**
     * Update workflow status
     */
    updateWorkflowStatus(workflowId: string, status: 'running' | 'success' | 'failure' | 'cancelled', details?: Record<string, any>): Promise<void>;
    /**
     * Get CI/CD metrics
     */
    getCIMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        workflowRuns: number;
        successRate: number;
        averageDuration: number;
        failureReasons: Array<{
            reason: string;
            count: number;
            percentage: number;
        }>;
        trends: Record<string, Array<{
            timestamp: Date;
            value: number;
        }>>;
    }>;
    private generateBadgeSVG;
    private generateBadgeURL;
    private generateExecutiveSummary;
    private generateExecutionTrendsSection;
    private generateCoverageSection;
    private generateFlakinessSection;
    private generatePerformanceSection;
    private generateMarkdownReport;
    private generateHTMLReport;
    private prepareExecutionChartData;
    private prepareCoverageChartData;
    private groupExecutionsByDay;
    private findPeakExecutionDay;
    private calculateAverageDailyExecutions;
    private findMostStableDay;
    private getAffectedTests;
    private applyRateLimits;
    private sendAlertToChannel;
    private formatAlertMessage;
    private generateWorkflowYAML;
    private analyzeFailureReasons;
    private generateCITrends;
    /**
     * Update internal data stores
     */
    updateExecutionData(key: string, executions: TestExecutionRecord[]): void;
    updateEventData(key: string, events: TestEvolutionEvent[]): void;
    updateRelationshipData(key: string, relationships: TestRelationship[]): void;
}
//# sourceMappingURL=TestCIIntegration.d.ts.map