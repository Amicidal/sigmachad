/**
 * Vector Service
 * Handles vector operations, embeddings, and similarity search
 */
import { EventEmitter } from "events";
import { CypherExecutor } from "./CypherExecutor.js";
export interface VectorSearchOptions {
    limit?: number;
    minScore?: number;
    filter?: Record<string, any>;
}
export interface VectorIndexConfig {
    name: string;
    nodeLabel: string;
    propertyKey: string;
    dimensions: number;
    similarityFunction?: "cosine" | "euclidean";
}
export declare class VectorService extends EventEmitter {
    private executor;
    constructor(executor: CypherExecutor);
    /**
     * Create a vector index for embeddings
     */
    createVectorIndex(config: VectorIndexConfig): Promise<void>;
    /**
     * Upsert vectors (embeddings) for entities
     */
    upsertVectors(vectors: Array<{
        entityId: string;
        vector: number[];
        metadata?: Record<string, any>;
    }>): Promise<void>;
    /**
     * Search for similar vectors using vector similarity
     */
    searchVectors(queryVector: number[], options?: VectorSearchOptions & {
        indexName?: string;
        nodeLabel?: string;
    }): Promise<Array<{
        entityId: string;
        score: number;
        metadata?: Record<string, any>;
    }>>;
    /**
     * Find similar entities by embedding
     */
    findSimilar(entityId: string, options?: VectorSearchOptions): Promise<Array<{
        entityId: string;
        score: number;
        entity?: any;
    }>>;
    /**
     * Batch embed multiple entities
     */
    batchEmbed(entities: Array<{
        id: string;
        content: string;
        [key: string]: any;
    }>, options?: {
        batchSize?: number;
        skipExisting?: boolean;
    }): Promise<Array<{
        entityId: string;
        vector: number[];
        success: boolean;
        error?: string;
    }>>;
    /**
     * Update embedding for a specific entity
     */
    updateEmbedding(entityId: string, content?: string): Promise<void>;
    /**
     * Delete embedding for an entity
     */
    deleteEmbedding(entityId: string): Promise<void>;
    /**
     * Get embedding statistics
     */
    getEmbeddingStats(): Promise<{
        totalEmbeddings: number;
        averageDimensions: number;
        lastUpdated?: Date;
    }>;
    /**
     * Fallback similarity search when vector search is not available
     */
    private fallbackSimilaritySearch;
    /**
     * Generate embeddings for a batch of texts (placeholder implementation)
     */
    private generateEmbeddingsBatch;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
}
//# sourceMappingURL=VectorService.d.ts.map