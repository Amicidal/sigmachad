/**
 * Database Service for Memento
 * Orchestrates specialized database services for FalkorDB, Qdrant, PostgreSQL, and Redis
 */
import { DatabaseConfig, INeo4jService, IPostgreSQLService, IRedisService, IDatabaseHealthCheck } from "../database/index.js";
import type { BulkQueryMetrics } from "../database/index.js";
import type { PerformanceHistoryOptions, PerformanceHistoryRecord, SCMCommitRecord } from "../models/types.js";
import type { PerformanceRelationship } from "../models/relationships.js";
export type { DatabaseConfig } from "../database/index.js";
export interface DatabaseQueryResult {
    rows?: any[];
    rowCount?: number;
    fields?: any[];
}
export interface FalkorDBQueryResult {
    headers?: any[];
    data?: any[];
    statistics?: any;
}
export interface TestSuiteResult {
    id?: string;
    name: string;
    status: "passed" | "failed" | "skipped";
    duration: number;
    timestamp: Date;
    testResults: TestResult[];
}
export interface TestResult {
    id?: string;
    name: string;
    status: "passed" | "failed" | "skipped";
    duration: number;
    error?: string;
}
export interface FlakyTestAnalysis {
    testId: string;
    testName: string;
    failureCount: number;
    totalRuns: number;
    lastFailure: Date;
    failurePatterns: string[];
}
export type DatabaseServiceDeps = {
    neo4jFactory?: (cfg: DatabaseConfig["neo4j"]) => INeo4jService;
    postgresFactory?: (cfg: DatabaseConfig["postgresql"]) => IPostgreSQLService;
    redisFactory?: (cfg: NonNullable<DatabaseConfig["redis"]>) => IRedisService;
};
export declare class DatabaseService {
    private config;
    private neo4jService;
    private postgresqlService;
    private redisService?;
    private initialized;
    private initializing;
    private initializationPromise?;
    private readonly neo4jFactory?;
    private readonly postgresFactory?;
    private readonly redisFactory?;
    constructor(config: DatabaseConfig, deps?: DatabaseServiceDeps);
    getConfig(): DatabaseConfig;
    getNeo4jService(): INeo4jService;
    getPostgreSQLService(): IPostgreSQLService;
    getRedisService(): IRedisService | undefined;
    getNeo4jDriver(): any;
    getPostgresPool(): any;
    initialize(): Promise<void>;
    private _initialize;
    close(): Promise<void>;
    falkordbQuery(query: string, params?: Record<string, any>, options?: {
        graph?: string;
    }): Promise<any>;
    falkordbCommand(...args: any[]): Promise<FalkorDBQueryResult>;
    upsertVector(collection: string, id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    searchVector(collection: string, vector: number[], limit?: number, filter?: Record<string, any>): Promise<Array<{
        id: string;
        score: number;
        metadata?: any;
    }>>;
    scrollVectors(collection: string, limit?: number, offset?: number): Promise<{
        points: Array<{
            id: string;
            vector: number[];
            metadata?: any;
        }>;
        total: number;
    }>;
    get qdrant(): any;
    postgresQuery(query: string, params?: any[], options?: {
        timeout?: number;
    }): Promise<DatabaseQueryResult>;
    postgresTransaction<T>(callback: (client: any) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
    redisGet(key: string): Promise<string | null>;
    redisSet(key: string, value: string, ttl?: number): Promise<void>;
    redisDel(key: string): Promise<number>;
    redisFlushDb(): Promise<void>;
    healthCheck(): Promise<IDatabaseHealthCheck>;
    setupDatabase(): Promise<void>;
    isInitialized(): boolean;
    /**
     * Store test suite execution results
     */
    storeTestSuiteResult(suiteResult: TestSuiteResult): Promise<void>;
    /**
     * Store flaky test analyses
     */
    storeFlakyTestAnalyses(analyses: FlakyTestAnalysis[]): Promise<void>;
    /**
     * Execute bulk PostgreSQL operations efficiently
     */
    postgresBulkQuery(queries: Array<{
        query: string;
        params: any[];
    }>, options?: {
        continueOnError?: boolean;
    }): Promise<DatabaseQueryResult[]>;
    getPostgresBulkWriterMetrics(): BulkQueryMetrics;
    /**
     * Get test execution history for an entity
     */
    getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
    /**
     * Get performance metrics history
     */
    getPerformanceMetricsHistory(entityId: string, options?: number | PerformanceHistoryOptions): Promise<PerformanceHistoryRecord[]>;
    recordPerformanceMetricSnapshot(snapshot: PerformanceRelationship): Promise<void>;
    recordSCMCommit(commit: SCMCommitRecord): Promise<void>;
    getSCMCommitByHash(commitHash: string): Promise<SCMCommitRecord | null>;
    listSCMCommits(limit?: number): Promise<SCMCommitRecord[]>;
    /**
     * Get coverage history
     */
    getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
}
export declare function getDatabaseService(config?: DatabaseConfig): DatabaseService;
export declare function createDatabaseConfig(): DatabaseConfig;
export declare function createTestDatabaseConfig(): DatabaseConfig;
//# sourceMappingURL=DatabaseService.d.ts.map