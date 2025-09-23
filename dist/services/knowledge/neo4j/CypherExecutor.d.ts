/**
 * Cypher Executor
 * Handles raw Cypher execution, transactions, and database operations
 */
import { EventEmitter } from "events";
export interface Neo4jConfig {
    uri: string;
    username: string;
    password: string;
    database?: string;
    maxConnectionPoolSize?: number;
}
export interface CypherQueryOptions {
    timeout?: number;
    database?: string;
}
export interface BenchmarkOptions {
    iterations?: number;
    queryCount?: number;
    includeMetrics?: boolean;
}
export declare class CypherExecutor extends EventEmitter {
    private driver;
    private database;
    private readonly defaultTimeout;
    constructor(config: Neo4jConfig);
    /**
     * Execute a Cypher query with parameters
     */
    executeCypher(query: string, params?: Record<string, any>, options?: CypherQueryOptions): Promise<any[]>;
    /**
     * Execute multiple queries in a transaction
     */
    executeTransaction(queries: Array<{
        query: string;
        params?: Record<string, any>;
    }>, options?: CypherQueryOptions): Promise<any[]>;
    /**
     * Call an APOC procedure
     */
    callApoc(procedure: string, params?: Record<string, any>, options?: CypherQueryOptions): Promise<any[]>;
    /**
     * Get database statistics
     */
    getStats(): Promise<any>;
    /**
     * Create common database indexes
     */
    createCommonIndexes(): Promise<void>;
    /**
     * Get index health information
     */
    getIndexHealth(): Promise<any>;
    /**
     * Ensure graph-specific indexes exist
     */
    ensureGraphIndexes(): Promise<void>;
    /**
     * Run benchmark operations
     */
    runBenchmarks(options?: BenchmarkOptions): Promise<any>;
    /**
     * Close the database connection
     */
    close(): Promise<void>;
    /**
     * Convert Neo4j values to JavaScript types
     */
    private convertNeo4jValue;
}
//# sourceMappingURL=CypherExecutor.d.ts.map