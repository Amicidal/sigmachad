/**
 * Database Service for Memento
 * Orchestrates specialized database services for FalkorDB, Qdrant, PostgreSQL, and Redis
 */
import { QdrantClient } from '@qdrant/js-client-rest';
import { DatabaseConfig, IFalkorDBService, IQdrantService, IPostgreSQLService, IRedisService, IDatabaseHealthCheck } from './database';
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
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    timestamp: Date;
    testResults: TestResult[];
}
export interface TestResult {
    id?: string;
    name: string;
    status: 'passed' | 'failed' | 'skipped';
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
export declare class DatabaseService {
    private config;
    private falkorDBService;
    private qdrantService;
    private postgresqlService;
    private redisService?;
    private initialized;
    private initializing;
    private initializationPromise?;
    constructor(config: DatabaseConfig);
    getConfig(): DatabaseConfig;
    getFalkorDBService(): IFalkorDBService;
    getQdrantService(): IQdrantService;
    getPostgreSQLService(): IPostgreSQLService;
    getRedisService(): IRedisService | undefined;
    getFalkorDBClient(): any;
    getQdrantClient(): QdrantClient;
    getPostgresPool(): any;
    initialize(): Promise<void>;
    private _initialize;
    close(): Promise<void>;
    falkordbQuery(query: string, params?: Record<string, any>): Promise<any>;
    falkordbCommand(...args: any[]): Promise<FalkorDBQueryResult>;
    get qdrant(): QdrantClient;
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
    /**
     * Get test execution history for an entity
     */
    getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
    /**
     * Get performance metrics history
     */
    getPerformanceMetricsHistory(entityId: string, days?: number): Promise<any[]>;
    /**
     * Get coverage history
     */
    getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
}
export { DatabaseConfig } from './database';
export declare function getDatabaseService(config?: DatabaseConfig): DatabaseService;
export declare function createDatabaseConfig(): DatabaseConfig;
export declare function createTestDatabaseConfig(): DatabaseConfig;
//# sourceMappingURL=DatabaseService.d.ts.map