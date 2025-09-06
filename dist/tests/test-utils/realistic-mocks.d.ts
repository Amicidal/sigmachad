/**
 * Realistic mock implementations for testing
 * These mocks simulate real-world failure scenarios and edge cases
 */
import type { IFalkorDBService, IQdrantService, IPostgreSQLService, IRedisService } from '../../src/services/database/interfaces';
interface MockConfig {
    failureRate?: number;
    latencyMs?: number;
    connectionFailures?: boolean;
    transactionFailures?: boolean;
    dataCorruption?: boolean;
    seed?: number;
}
/**
 * Realistic FalkorDB mock with configurable failure scenarios
 */
export declare class RealisticFalkorDBMock implements IFalkorDBService {
    private initialized;
    private config;
    private queryCount;
    private failureCount;
    private rngState;
    private rng;
    constructor(config?: MockConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getClient(): any;
    query(query: string, params?: Record<string, any>): Promise<any>;
    command(...args: any[]): Promise<any>;
    setupGraph(): Promise<void>;
    healthCheck(): Promise<boolean>;
    getQueryCount(): number;
    getFailureCount(): number;
    private simulateLatency;
    private shouldFail;
    private generateRealisticMatchResults;
}
/**
 * Realistic Qdrant mock with vector search simulation
 */
export declare class RealisticQdrantMock implements IQdrantService {
    private initialized;
    private config;
    private collections;
    private rngState;
    private rng;
    constructor(config?: MockConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getClient(): any;
    setupCollections(): Promise<void>;
    healthCheck(): Promise<boolean>;
    private simulateLatency;
    private shouldFail;
}
/**
 * Realistic PostgreSQL mock with transaction simulation
 */
export declare class RealisticPostgreSQLMock implements IPostgreSQLService {
    private initialized;
    private config;
    private transactionCount;
    private queryLog;
    private rngState;
    private rng;
    constructor(config?: MockConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getPool(): any;
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
    setupSchema(): Promise<void>;
    healthCheck(): Promise<boolean>;
    storeTestSuiteResult(suiteResult: any): Promise<void>;
    storeFlakyTestAnalyses(analyses: any[]): Promise<void>;
    getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
    getPerformanceMetricsHistory(entityId: string, days?: number): Promise<any[]>;
    getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
    getTransactionCount(): number;
    getQueryLog(): string[];
    private simulateLatency;
    private shouldFail;
    private generateRealisticRows;
}
/**
 * Realistic Redis mock with TTL and memory simulation
 */
export declare class RealisticRedisMock implements IRedisService {
    private initialized;
    private config;
    private store;
    private rngState;
    private rng;
    constructor(config?: MockConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<number>;
    healthCheck(): Promise<boolean>;
    getStoreSize(): number;
    private simulateLatency;
    private shouldFail;
}
export {};
//# sourceMappingURL=realistic-mocks.d.ts.map