import { Pool } from 'pg';
import { IPostgreSQLService } from './interfaces';
export declare class PostgreSQLService implements IPostgreSQLService {
    private postgresPool;
    private initialized;
    private config;
    constructor(config: {
        connectionString: string;
        max?: number;
        idleTimeoutMillis?: number;
        connectionTimeoutMillis?: number;
    });
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getPool(): Pool;
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
}
//# sourceMappingURL=PostgreSQLService.d.ts.map