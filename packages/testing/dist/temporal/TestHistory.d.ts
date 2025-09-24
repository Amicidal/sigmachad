/**
 * @file TestHistory.ts
 * @description Historical test data management service
 *
 * Provides comprehensive management of historical test data including snapshots,
 * time-series storage, efficient queries, and data retention policies.
 */
import { TestExecutionRecord, TestHistorySnapshot, TestTimelineQuery, TestTemporalQueryResult, TestConfiguration, TestMetadata } from './TestTypes.js';
export interface ITestHistory {
    /**
     * Store test execution record
     */
    storeExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Create historical snapshot
     */
    createSnapshot(testId: string, entityId: string, metadata: TestMetadata): Promise<TestHistorySnapshot>;
    /**
     * Query historical data
     */
    queryHistory(query: TestTimelineQuery): Promise<TestTemporalQueryResult>;
    /**
     * Get execution history for a test
     */
    getExecutionHistory(testId: string, entityId: string, limit?: number): Promise<TestExecutionRecord[]>;
    /**
     * Get snapshots for a time period
     */
    getSnapshots(testId: string, entityId: string, startDate: Date, endDate: Date): Promise<TestHistorySnapshot[]>;
    /**
     * Cleanup old data according to retention policy
     */
    cleanup(retentionPeriod: number): Promise<number>;
    /**
     * Export historical data
     */
    exportData(testId?: string, entityId?: string, format?: 'json' | 'csv'): Promise<string>;
    /**
     * Import historical data
     */
    importData(data: string, format?: 'json' | 'csv'): Promise<number>;
    /**
     * Get data statistics
     */
    getStatistics(): Promise<HistoryStatistics>;
}
export interface HistoryStatistics {
    totalExecutions: number;
    totalSnapshots: number;
    totalEvents: number;
    oldestRecord: Date;
    newestRecord: Date;
    averageExecutionsPerDay: number;
    dataSize: number;
    retentionCompliance: boolean;
}
export interface HistoryQuery {
    testId?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string[];
    limit?: number;
    offset?: number;
    orderBy?: 'timestamp' | 'duration' | 'coverage';
    orderDirection?: 'asc' | 'desc';
}
export interface SnapshotConfig {
    frequency: 'daily' | 'weekly' | 'monthly';
    includeMetrics: boolean;
    includeRelationships: boolean;
    compressionLevel: number;
}
export interface RetentionPolicy {
    executionRetentionDays: number;
    snapshotRetentionDays: number;
    eventRetentionDays: number;
    archiveBeforeDelete: boolean;
    compressionThreshold: number;
}
/**
 * Historical test data management service
 */
export declare class TestHistory implements ITestHistory {
    private readonly config;
    private readonly retentionPolicy;
    private readonly snapshotConfig;
    private readonly executions;
    private readonly snapshots;
    private readonly events;
    private readonly relationships;
    constructor(config: TestConfiguration, retentionPolicy?: Partial<RetentionPolicy>, snapshotConfig?: Partial<SnapshotConfig>);
    /**
     * Store test execution record
     */
    storeExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Create historical snapshot
     */
    createSnapshot(testId: string, entityId: string, metadata: TestMetadata): Promise<TestHistorySnapshot>;
    /**
     * Query historical data
     */
    queryHistory(query: TestTimelineQuery): Promise<TestTemporalQueryResult>;
    /**
     * Get execution history for a test
     */
    getExecutionHistory(testId: string, entityId: string, limit?: number): Promise<TestExecutionRecord[]>;
    /**
     * Get snapshots for a time period
     */
    getSnapshots(testId: string, entityId: string, startDate: Date, endDate: Date): Promise<TestHistorySnapshot[]>;
    /**
     * Cleanup old data according to retention policy
     */
    cleanup(retentionPeriod?: number): Promise<number>;
    /**
     * Export historical data
     */
    exportData(testId?: string, entityId?: string, format?: string): Promise<string>;
    /**
     * Import historical data
     */
    importData(data: string, format?: string): Promise<number>;
    /**
     * Get data statistics
     */
    getStatistics(): Promise<HistoryStatistics>;
    private calculateExecutionMetrics;
    private checkSnapshotCreation;
    private applyRetentionPolicy;
    private queryExecutions;
    private queryEvents;
    private queryRelationships;
    private querySnapshots;
    private getFilteredExecutions;
    private getFilteredSnapshots;
    private getFilteredEvents;
    private getFilteredRelationships;
    private convertToCSV;
    private parseCSV;
    private calculateDataSize;
    private checkRetentionCompliance;
}
//# sourceMappingURL=TestHistory.d.ts.map