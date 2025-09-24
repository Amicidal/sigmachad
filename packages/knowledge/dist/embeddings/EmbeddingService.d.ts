/**
 * Embedding Service
 * Handles vector generation, storage, and search using Neo4j's native vector support
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '../../models/entities.js';
export interface EmbeddingOptions {
    indexName?: string;
    dimensions?: number;
    similarity?: 'euclidean' | 'cosine';
    batchSize?: number;
    checkpointId?: string;
}
export interface SearchOptions {
    limit?: number;
    minScore?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
}
export interface EmbeddingResult {
    entityId: string;
    vector: number[];
    metadata?: Record<string, any>;
}
export interface SearchResult {
    entity: Entity;
    score: number;
    metadata?: Record<string, any>;
}
export declare class EmbeddingService extends EventEmitter {
    private neo4j;
    private cache;
    private readonly defaultIndexName;
    private readonly defaultDimensions;
    constructor(neo4j: Neo4jService);
    /**
     * Initialize the default vector index
     */
    initializeVectorIndex(options?: EmbeddingOptions): Promise<void>;
    /**
     * Generate and store embeddings for a single entity
     */
    generateAndStore(entity: Entity, options?: EmbeddingOptions): Promise<EmbeddingResult>;
    /**
     * Batch generate and store embeddings
     */
    batchEmbed(entities: Entity[], options?: EmbeddingOptions): Promise<EmbeddingResult[]>;
    /**
     * Search for similar entities using vector similarity
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search using a pre-computed vector
     */
    searchByVector(queryVector: number[], options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Update embedding for an existing entity
     */
    updateEmbedding(entityId: string, content?: string, options?: EmbeddingOptions): Promise<void>;
    /**
     * Delete embedding for an entity
     */
    deleteEmbedding(entityId: string): Promise<void>;
    /**
     * Get embedding statistics
     */
    getEmbeddingStats(): Promise<{
        total: number;
        indexed: number;
        dimensions: number;
        avgMagnitude: number;
    }>;
    /**
     * Find similar entities to a given entity
     */
    findSimilar(entityId: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Generate embedding for content
     */
    private generateEmbedding;
    /**
     * Store embedding in Neo4j
     */
    private storeEmbedding;
    /**
     * Extract content from entity for embedding
     */
    private extractEntityContent;
    /**
     * Parse entity from Neo4j node
     */
    private parseEntity;
    /**
     * Extract metadata from Neo4j node
     */
    private extractMetadata;
}
//# sourceMappingURL=EmbeddingService.d.ts.map