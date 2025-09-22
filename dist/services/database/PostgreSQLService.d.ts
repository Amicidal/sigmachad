import type { Pool as PgPool } from "pg";
import { IPostgreSQLService, type BulkQueryInstrumentationConfig, type BulkQueryMetrics, type BulkQueryMetricsSnapshot, type BulkQueryTelemetryEntry } from "./interfaces.js";
import type { PerformanceHistoryOptions, PerformanceHistoryRecord, SCMCommitRecord } from "../../models/types.js";
import type { PerformanceRelationship } from "../../models/relationships.js";
interface BulkTelemetryListenerPayload {
    entry: BulkQueryTelemetryEntry;
    metrics: BulkQueryMetricsSnapshot;
}
interface PostgreSQLServiceOptions {
    poolFactory?: () => PgPool;
    bulkConfig?: Partial<BulkQueryInstrumentationConfig>;
    bulkTelemetryEmitter?: (payload: BulkTelemetryListenerPayload) => void;
}
export declare class PostgreSQLService implements IPostgreSQLService {
    private postgresPool;
    private initialized;
    private poolFactory?;
    private config;
    private bulkMetrics;
    private bulkInstrumentationConfig;
    private bulkTelemetryEmitter?;
    constructor(config: {
        connectionString: string;
        max?: number;
        idleTimeoutMillis?: number;
        connectionTimeoutMillis?: number;
    }, options?: PostgreSQLServiceOptions);
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getPool(): PgPool;
    private validateUuid;
    private validateQueryParams;
    query(query: string, params?: any[], options?: {
        timeout?: number;
    }): Promise<any>;
    transaction<T>(callback: (client: any) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
    bulkQuery(queries: Array<{
        query: string;
        params: any[];
    }>, options?: {
        continueOnError?: boolean;
    }): Promise<any[]>;
    private recordBulkOperationTelemetry;
    private appendTelemetryRecord;
    private createBulkTelemetrySnapshot;
    private emitBulkTelemetry;
    private logBulkTelemetry;
    getBulkWriterMetrics(): BulkQueryMetrics;
    setupSchema(): Promise<void>;
    healthCheck(): Promise<boolean>;
    storeTestSuiteResult(suiteResult: any): Promise<any>;
    storeFlakyTestAnalyses(analyses: any[]): Promise<any>;
    recordPerformanceMetricSnapshot(snapshot: PerformanceRelationship): Promise<void>;
    recordSCMCommit(commit: SCMCommitRecord): Promise<void>;
    getSCMCommitByHash(commitHash: string): Promise<SCMCommitRecord | null>;
    listSCMCommits(limit?: number): Promise<SCMCommitRecord[]>;
    getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
    getPerformanceMetricsHistory(entityId: string, options?: number | PerformanceHistoryOptions): Promise<PerformanceHistoryRecord[]>;
    getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
}
export {};
//# sourceMappingURL=PostgreSQLService.d.ts.map