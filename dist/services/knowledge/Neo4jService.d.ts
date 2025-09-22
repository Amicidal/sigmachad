/**
 * Neo4j Base Service
 * Handles raw Neo4j interactions, APOC procedures, and GDS algorithms
 */
import { EventEmitter } from 'events';
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
export interface VectorSearchOptions {
    limit?: number;
    minScore?: number;
    filter?: Record<string, any>;
}
export interface GdsAlgorithmConfig {
    nodeProjection?: string;
    relationshipProjection?: string;
    writeProperty?: string;
    maxIterations?: number;
    dampingFactor?: number;
}
export declare class Neo4jService extends EventEmitter {
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
     * Run a GDS algorithm
     */
    runGdsAlgorithm(algorithm: string, config: GdsAlgorithmConfig & Record<string, any>, options?: CypherQueryOptions): Promise<any[]>;
    /**
     * Create or update a vector index
     */
    createVectorIndex(indexName: string, label: string, propertyKey: string, dimensions: number, similarity?: 'euclidean' | 'cosine'): Promise<void>;
    /**
     * Upsert vectors to Neo4j nodes
     */
    upsertVectors(label: string, vectors: Array<{
        id: string;
        vector: number[];
        properties?: Record<string, any>;
    }>): Promise<void>;
    /**
     * Search vectors using Neo4j's native vector similarity
     */
    searchVectors(indexName: string, queryVector: number[], options?: VectorSearchOptions): Promise<any[]>;
    /**
     * Run APOC text search (fuzzy, full-text)
     */
    apocTextSearch(label: string, property: string, searchText: string, options?: {
        fuzzy?: boolean;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Use APOC path expansion for traversals
     */
    apocPathExpand(startNodeId: string, relationshipFilter: string, maxDepth: number, options?: {
        labelFilter?: string;
        uniqueness?: string;
    }): Promise<any[]>;
    /**
     * Get database statistics
     */
    getStats(): Promise<any>;
    /**
     * Create indexes for common queries
     */
    createCommonIndexes(): Promise<void>;
    /**
     * Convert Neo4j values to JavaScript values
     */
    private convertNeo4jValue;
    private convertNode;
    private convertRelationship;
    private convertPath;
    private buildGdsConfigString;
    /**
     * Get index health status
     */
    getIndexHealth(): Promise<{
        indexes: Array<{
            name: string;
            status: string;
            type: string;
            labels: string[];
            properties: string[];
            populationPercent?: number;
        }>;
        summary: {
            total: number;
            online: number;
            failed: number;
            populating: number;
        };
    }>;
    /**
     * Ensure graph indexes are created
     */
    ensureGraphIndexes(): Promise<void>;
    /**
     * Run performance benchmarks
     */
    runBenchmarks(options?: {
        includeWrites?: boolean;
        sampleSize?: number;
        timeout?: number;
    }): Promise<{
        readPerformance: {
            simpleNodeQuery: {
                avgMs: number;
                operations: number;
            };
            relationshipTraversal: {
                avgMs: number;
                operations: number;
            };
            indexLookup: {
                avgMs: number;
                operations: number;
            };
            aggregationQuery: {
                avgMs: number;
                operations: number;
            };
        };
        writePerformance?: {
            nodeCreation: {
                avgMs: number;
                operations: number;
            };
            relationshipCreation: {
                avgMs: number;
                operations: number;
            };
            bulkInsert: {
                avgMs: number;
                operations: number;
            };
        };
        databaseStats: {
            nodeCount: number;
            relationshipCount: number;
            indexCount: number;
            memoryUsage?: string;
        };
    }>;
    /**
     * Close the driver connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=Neo4jService.d.ts.map