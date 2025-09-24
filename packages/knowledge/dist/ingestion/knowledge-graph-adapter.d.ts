/**
 * Knowledge Graph Service Adapter for Ingestion Pipeline
 * Bridges the high-throughput ingestion pipeline with the existing KnowledgeGraphService
 */
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import { KnowledgeGraphServiceIntegration } from './pipeline.js';
export interface KnowledgeGraphServiceLike {
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
    createOrUpdateEntity(entity: Entity, options?: any): Promise<Entity>;
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createEmbedding(entity: Entity): Promise<any>;
}
/**
 * Adapter that wraps the existing KnowledgeGraphService to provide
 * the interface expected by the ingestion pipeline
 */
export declare class KnowledgeGraphAdapter implements KnowledgeGraphServiceIntegration {
    private knowledgeGraphService;
    constructor(knowledgeGraphService: KnowledgeGraphServiceLike);
    /**
     * Bulk create entities with high-throughput optimizations
     */
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    /**
     * Bulk create relationships with high-throughput optimizations
     */
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    /**
     * Batch create embeddings with async processing
     */
    createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
}
/**
 * Factory function to create a KnowledgeGraphAdapter from an existing service
 */
export declare function createKnowledgeGraphAdapter(knowledgeGraphService: KnowledgeGraphServiceLike): KnowledgeGraphServiceIntegration;
/**
 * Enhanced adapter with additional optimization features
 */
export declare class OptimizedKnowledgeGraphAdapter extends KnowledgeGraphAdapter {
    private optimizationOptions;
    private entityCache;
    private relationshipCache;
    private batchingBuffer;
    private flushTimer?;
    private readonly FLUSH_INTERVAL;
    private readonly MAX_BUFFER_SIZE;
    constructor(knowledgeGraphService: KnowledgeGraphServiceLike, optimizationOptions?: {
        enableCaching?: boolean;
        enableBuffering?: boolean;
        flushInterval?: number;
        maxBufferSize?: number;
    });
    /**
     * Enhanced entity creation with caching and buffering
     */
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    /**
     * Enhanced relationship creation with caching and buffering
     */
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    /**
     * Flush all buffers
     */
    flushAll(): Promise<void>;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Get current buffer statistics
     */
    getBufferStats(): {
        entities: number;
        relationships: number;
        embeddings: number;
    };
    /**
     * Stop the adapter and flush all pending data
     */
    stop(): Promise<void>;
    private startBufferFlushing;
    private flushEntityBuffer;
    private flushRelationshipBuffer;
    private flushEmbeddingBuffer;
    private getRelationshipId;
}
/**
 * Factory function to create an optimized adapter
 */
export declare function createOptimizedKnowledgeGraphAdapter(knowledgeGraphService: KnowledgeGraphServiceLike, options?: {
    enableCaching?: boolean;
    enableBuffering?: boolean;
    flushInterval?: number;
    maxBufferSize?: number;
}): OptimizedKnowledgeGraphAdapter;
//# sourceMappingURL=knowledge-graph-adapter.d.ts.map