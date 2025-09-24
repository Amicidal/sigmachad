/**
 * Knowledge Graph Service Adapter for Ingestion Pipeline
 * Bridges the high-throughput ingestion pipeline with the existing KnowledgeGraphService
 */
/**
 * Adapter that wraps the existing KnowledgeGraphService to provide
 * the interface expected by the ingestion pipeline
 */
export class KnowledgeGraphAdapter {
    constructor(knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }
    /**
     * Bulk create entities with high-throughput optimizations
     */
    async createEntitiesBulk(entities, options = {}) {
        try {
            // If the service already has bulk operations, use them
            if (this.knowledgeGraphService.createEntitiesBulk) {
                return await this.knowledgeGraphService.createEntitiesBulk(entities, {
                    ...options,
                    skipEmbedding: true, // Skip embeddings for bulk operations
                    batch: true
                });
            }
            // Fallback to individual creates if bulk not available
            console.log(`[KnowledgeGraphAdapter] Falling back to individual entity creates for ${entities.length} entities`);
            const results = [];
            const batchSize = options.batchSize || 50;
            for (let i = 0; i < entities.length; i += batchSize) {
                const batch = entities.slice(i, i + batchSize);
                const batchPromises = batch.map(entity => this.knowledgeGraphService.createOrUpdateEntity(entity, {
                    skipEmbedding: true,
                    ...options
                }));
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map((result, index) => ({
                    entity: batch[index],
                    success: result.status === 'fulfilled',
                    result: result.status === 'fulfilled' ? result.value : undefined,
                    error: result.status === 'rejected' ? result.reason : undefined
                })));
            }
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            return {
                success: failureCount === 0,
                processed: successCount,
                failed: failureCount,
                results,
                metadata: {
                    batchSize,
                    totalBatches: Math.ceil(entities.length / batchSize)
                }
            };
        }
        catch (error) {
            console.error('[KnowledgeGraphAdapter] Entity bulk creation failed:', error);
            throw error;
        }
    }
    /**
     * Bulk create relationships with high-throughput optimizations
     */
    async createRelationshipsBulk(relationships, options = {}) {
        try {
            // If the service already has bulk operations, use them
            if (this.knowledgeGraphService.createRelationshipsBulk) {
                return await this.knowledgeGraphService.createRelationshipsBulk(relationships, {
                    ...options,
                    batch: true
                });
            }
            // Fallback to individual creates if bulk not available
            console.log(`[KnowledgeGraphAdapter] Falling back to individual relationship creates for ${relationships.length} relationships`);
            const results = [];
            const batchSize = options.batchSize || 100;
            for (let i = 0; i < relationships.length; i += batchSize) {
                const batch = relationships.slice(i, i + batchSize);
                const batchPromises = batch.map(relationship => this.knowledgeGraphService.createRelationship(relationship));
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map((result, index) => ({
                    relationship: batch[index],
                    success: result.status === 'fulfilled',
                    result: result.status === 'fulfilled' ? result.value : undefined,
                    error: result.status === 'rejected' ? result.reason : undefined
                })));
            }
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            return {
                success: failureCount === 0,
                processed: successCount,
                failed: failureCount,
                results,
                metadata: {
                    batchSize,
                    totalBatches: Math.ceil(relationships.length / batchSize)
                }
            };
        }
        catch (error) {
            console.error('[KnowledgeGraphAdapter] Relationship bulk creation failed:', error);
            throw error;
        }
    }
    /**
     * Batch create embeddings with async processing
     */
    async createEmbeddingsBatch(entities, options = {}) {
        try {
            // If the service already has batch embeddings, use them
            if (this.knowledgeGraphService.createEmbeddingsBatch) {
                return await this.knowledgeGraphService.createEmbeddingsBatch(entities, {
                    ...options,
                    async: true, // Process embeddings asynchronously
                    batch: true
                });
            }
            // Fallback to individual embedding creation
            console.log(`[KnowledgeGraphAdapter] Falling back to individual embedding creates for ${entities.length} entities`);
            const results = [];
            const batchSize = options.batchSize || 25; // Smaller batches for embeddings
            for (let i = 0; i < entities.length; i += batchSize) {
                const batch = entities.slice(i, i + batchSize);
                // Process embeddings with some delay to avoid overwhelming the service
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                const batchPromises = batch.map(entity => this.knowledgeGraphService.createEmbedding(entity));
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map((result, index) => ({
                    entity: batch[index],
                    success: result.status === 'fulfilled',
                    result: result.status === 'fulfilled' ? result.value : undefined,
                    error: result.status === 'rejected' ? result.reason : undefined
                })));
            }
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            return {
                success: failureCount === 0,
                processed: successCount,
                failed: failureCount,
                results,
                metadata: {
                    batchSize,
                    totalBatches: Math.ceil(entities.length / batchSize),
                    async: true
                }
            };
        }
        catch (error) {
            console.error('[KnowledgeGraphAdapter] Embedding batch creation failed:', error);
            throw error;
        }
    }
}
/**
 * Factory function to create a KnowledgeGraphAdapter from an existing service
 */
export function createKnowledgeGraphAdapter(knowledgeGraphService) {
    return new KnowledgeGraphAdapter(knowledgeGraphService);
}
/**
 * Enhanced adapter with additional optimization features
 */
export class OptimizedKnowledgeGraphAdapter extends KnowledgeGraphAdapter {
    constructor(knowledgeGraphService, optimizationOptions = {}) {
        super(knowledgeGraphService);
        this.optimizationOptions = optimizationOptions;
        this.entityCache = new Map();
        this.relationshipCache = new Map();
        this.batchingBuffer = {
            entities: [],
            relationships: [],
            embeddings: []
        };
        this.FLUSH_INTERVAL = 1000; // 1 second
        this.MAX_BUFFER_SIZE = 500;
        if (optimizationOptions.enableBuffering) {
            this.startBufferFlushing();
        }
    }
    /**
     * Enhanced entity creation with caching and buffering
     */
    async createEntitiesBulk(entities, options = {}) {
        if (this.optimizationOptions.enableCaching) {
            // Filter out already cached entities
            const newEntities = entities.filter(entity => {
                const cached = this.entityCache.get(entity.id);
                if (cached) {
                    console.log(`[OptimizedAdapter] Entity ${entity.id} already cached, skipping`);
                    return false;
                }
                return true;
            });
            if (newEntities.length < entities.length) {
                console.log(`[OptimizedAdapter] Filtered ${entities.length - newEntities.length} cached entities`);
            }
            entities = newEntities;
        }
        if (this.optimizationOptions.enableBuffering && !options.forceFlush) {
            // Add to buffer instead of immediate processing
            this.batchingBuffer.entities.push(...entities);
            // Flush if buffer is getting full
            if (this.batchingBuffer.entities.length >= (this.optimizationOptions.maxBufferSize || this.MAX_BUFFER_SIZE)) {
                await this.flushEntityBuffer();
            }
            return {
                success: true,
                processed: entities.length,
                buffered: true
            };
        }
        const result = await super.createEntitiesBulk(entities, options);
        // Cache successful entities
        if (this.optimizationOptions.enableCaching && result.success) {
            entities.forEach(entity => this.entityCache.set(entity.id, entity));
        }
        return result;
    }
    /**
     * Enhanced relationship creation with caching and buffering
     */
    async createRelationshipsBulk(relationships, options = {}) {
        if (this.optimizationOptions.enableCaching) {
            const newRelationships = relationships.filter(rel => {
                const relId = this.getRelationshipId(rel);
                const cached = this.relationshipCache.get(relId);
                if (cached) {
                    console.log(`[OptimizedAdapter] Relationship ${relId} already cached, skipping`);
                    return false;
                }
                return true;
            });
            relationships = newRelationships;
        }
        if (this.optimizationOptions.enableBuffering && !options.forceFlush) {
            this.batchingBuffer.relationships.push(...relationships);
            if (this.batchingBuffer.relationships.length >= (this.optimizationOptions.maxBufferSize || this.MAX_BUFFER_SIZE)) {
                await this.flushRelationshipBuffer();
            }
            return {
                success: true,
                processed: relationships.length,
                buffered: true
            };
        }
        const result = await super.createRelationshipsBulk(relationships, options);
        // Cache successful relationships
        if (this.optimizationOptions.enableCaching && result.success) {
            relationships.forEach(rel => {
                const relId = this.getRelationshipId(rel);
                this.relationshipCache.set(relId, rel);
            });
        }
        return result;
    }
    /**
     * Flush all buffers
     */
    async flushAll() {
        await Promise.all([
            this.flushEntityBuffer(),
            this.flushRelationshipBuffer(),
            this.flushEmbeddingBuffer()
        ]);
    }
    /**
     * Clear all caches
     */
    clearCaches() {
        this.entityCache.clear();
        this.relationshipCache.clear();
    }
    /**
     * Get current buffer statistics
     */
    getBufferStats() {
        return {
            entities: this.batchingBuffer.entities.length,
            relationships: this.batchingBuffer.relationships.length,
            embeddings: this.batchingBuffer.embeddings.length
        };
    }
    /**
     * Stop the adapter and flush all pending data
     */
    async stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        await this.flushAll();
    }
    startBufferFlushing() {
        const interval = this.optimizationOptions.flushInterval || this.FLUSH_INTERVAL;
        this.flushTimer = setInterval(async () => {
            try {
                await this.flushAll();
            }
            catch (error) {
                console.error('[OptimizedAdapter] Buffer flush error:', error);
            }
        }, interval);
    }
    async flushEntityBuffer() {
        if (this.batchingBuffer.entities.length === 0)
            return;
        const entities = [...this.batchingBuffer.entities];
        this.batchingBuffer.entities = [];
        console.log(`[OptimizedAdapter] Flushing ${entities.length} entities from buffer`);
        await super.createEntitiesBulk(entities, { forceFlush: true });
    }
    async flushRelationshipBuffer() {
        if (this.batchingBuffer.relationships.length === 0)
            return;
        const relationships = [...this.batchingBuffer.relationships];
        this.batchingBuffer.relationships = [];
        console.log(`[OptimizedAdapter] Flushing ${relationships.length} relationships from buffer`);
        await super.createRelationshipsBulk(relationships, { forceFlush: true });
    }
    async flushEmbeddingBuffer() {
        if (this.batchingBuffer.embeddings.length === 0)
            return;
        const embeddings = [...this.batchingBuffer.embeddings];
        this.batchingBuffer.embeddings = [];
        console.log(`[OptimizedAdapter] Flushing ${embeddings.length} embeddings from buffer`);
        await super.createEmbeddingsBatch(embeddings, { forceFlush: true });
    }
    getRelationshipId(relationship) {
        var _a, _b;
        return `${relationship.fromEntityId || ((_a = relationship.from) === null || _a === void 0 ? void 0 : _a.id)}-${relationship.type}-${relationship.toEntityId || ((_b = relationship.to) === null || _b === void 0 ? void 0 : _b.id)}`;
    }
}
/**
 * Factory function to create an optimized adapter
 */
export function createOptimizedKnowledgeGraphAdapter(knowledgeGraphService, options = {}) {
    return new OptimizedKnowledgeGraphAdapter(knowledgeGraphService, options);
}
//# sourceMappingURL=knowledge-graph-adapter.js.map