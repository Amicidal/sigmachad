/**
 * Batch Processor for High-Throughput Ingestion Pipeline
 * Implements streaming batch processing with dependency DAG and idempotent operations
 * Based on HighThroughputKnowledgeGraph.md micro-batch architecture
 */
import { EventEmitter } from 'events';
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import { BatchConfig, BatchMetadata, BatchResult, ChangeFragment, StreamingWriteConfig, IngestionEvents } from './types.js';
import { KnowledgeGraphServiceIntegration } from './pipeline.js';
export interface BatchProcessorConfig extends BatchConfig {
    streaming: StreamingWriteConfig;
    enableDAG: boolean;
    epochTTL: number;
    dependencyTimeout: number;
}
export interface BatchProcessor {
    processEntities(entities: Entity[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
    processRelationships(relationships: GraphRelationship[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
    processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]>;
}
export declare class HighThroughputBatchProcessor extends EventEmitter<IngestionEvents> implements BatchProcessor {
    private config;
    private activeBatches;
    private processedBatches;
    private epochCounter;
    private dependencyDAG?;
    private running;
    private knowledgeGraphService?;
    private idempotencyKeys;
    constructor(config: BatchProcessorConfig, knowledgeGraphService?: KnowledgeGraphServiceIntegration);
    /**
     * Start the batch processor
     */
    start(): Promise<void>;
    /**
     * Stop the batch processor
     */
    stop(): Promise<void>;
    /**
     * Process a batch of entities with streaming writes
     */
    processEntities(entities: Entity[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
    /**
     * Process a batch of relationships with dependency resolution
     */
    processRelationships(relationships: GraphRelationship[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
    /**
     * Process change fragments with dependency DAG ordering
     */
    processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]>;
    /**
     * Process entity batch with streaming writes
     */
    private processEntityBatch;
    /**
     * Process relationship batch with endpoint resolution
     */
    private processRelationshipBatch;
    /**
     * Process fragments without dependency DAG (simple batching)
     */
    private processFragmentsSimple;
    /**
     * Build dependency DAG from change fragments
     */
    private buildDependencyDAG;
    /**
     * Process fragments using dependency DAG ordering
     */
    private processFragmentsWithDAG;
    /**
     * Create micro-batches from larger batch
     */
    private createMicroBatches;
    /**
     * Process a micro-batch with actual KnowledgeGraphService integration
     */
    private processMicroBatch;
    /**
     * Resolve relationship endpoints using cache/lookup
     */
    private resolveRelationshipEndpoints;
    /**
     * Generate unique batch ID
     */
    private generateBatchId;
    /**
     * Generate epoch ID for transaction versioning
     */
    private generateEpochId;
    /**
     * Generate idempotency key for batch
     */
    private generateIdempotencyKey;
    /**
     * Check if a batch has already been processed (idempotency)
     */
    private checkIdempotency;
    /**
     * Store idempotent result
     */
    private storeIdempotentResult;
    /**
     * Simple hash function for idempotency keys
     */
    private simpleHash;
    /**
     * Detect cycles in the dependency graph (simplified)
     */
    private detectCycles;
    /**
     * Wait for all active batches to complete
     */
    private waitForActiveBatches;
    /**
     * Cleanup expired idempotency keys
     */
    private cleanupExpiredKeys;
    /**
     * Get current batch processing metrics
     */
    getMetrics(): {
        activeBatches: number;
        processedBatches: number;
        idempotencyKeys: number;
    };
}
//# sourceMappingURL=batch-processor.d.ts.map