/**
 * Database Service for Memento
 * Manages connections to FalkorDB, Qdrant, and PostgreSQL
 */
import { QdrantClient } from '@qdrant/js-client-rest';
export interface DatabaseConfig {
    falkordb: {
        url: string;
        database?: number;
    };
    qdrant: {
        url: string;
        apiKey?: string;
    };
    postgresql: {
        connectionString: string;
        max?: number;
        idleTimeoutMillis?: number;
    };
    redis?: {
        url: string;
    };
}
export declare class DatabaseService {
    private config;
    private falkordbClient;
    private qdrantClient;
    private postgresPool;
    private redisClient?;
    private initialized;
    constructor(config: DatabaseConfig);
    initialize(): Promise<void>;
    close(): Promise<void>;
    falkordbQuery(query: string, params?: Record<string, any>): Promise<any>;
    private objectToCypherProperties;
    falkordbCommand(...args: any[]): Promise<any>;
    get qdrant(): QdrantClient;
    postgresQuery(query: string, params?: any[]): Promise<any>;
    postgresTransaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
    redisGet(key: string): Promise<string | null>;
    redisSet(key: string, value: string, ttl?: number): Promise<void>;
    redisDel(key: string): Promise<number>;
    healthCheck(): Promise<{
        falkordb: boolean;
        qdrant: boolean;
        postgresql: boolean;
        redis?: boolean;
    }>;
    setupDatabase(): Promise<void>;
    isInitialized(): boolean;
}
export declare function getDatabaseService(config?: DatabaseConfig): DatabaseService;
export declare function createDatabaseConfig(): DatabaseConfig;
//# sourceMappingURL=DatabaseService.d.ts.map