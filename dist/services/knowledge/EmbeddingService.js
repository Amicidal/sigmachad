/**
 * Embedding Service
 * Handles vector generation, storage, and search using Neo4j's native vector support
 */
import { EventEmitter } from 'events';
import { embeddingService } from '../../utils/embedding.js';
// Simple cache for embedding results
class EmbeddingCache {
    constructor(maxSize = 500, ttl = 300000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.vector;
    }
    set(key, vector) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        this.cache.set(key, {
            vector,
            timestamp: Date.now(),
        });
    }
    clear() {
        this.cache.clear();
    }
}
export class EmbeddingService extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
        this.defaultIndexName = 'entity_vectors';
        this.defaultDimensions = 768;
        this.cache = new EmbeddingCache();
        this.initializeVectorIndex().catch(err => console.warn('Failed to initialize vector index:', err));
    }
    /**
     * Initialize the default vector index
     */
    async initializeVectorIndex(options = {}) {
        const indexName = options.indexName || this.defaultIndexName;
        const dimensions = options.dimensions || this.defaultDimensions;
        const similarity = options.similarity || 'cosine';
        await this.neo4j.createVectorIndex(indexName, 'Entity', 'embedding', dimensions, similarity);
        this.emit('index:initialized', { indexName, dimensions, similarity });
    }
    /**
     * Generate and store embeddings for a single entity
     */
    async generateAndStore(entity, options = {}) {
        const content = this.extractEntityContent(entity);
        const vector = await this.generateEmbedding(content);
        await this.storeEmbedding(entity.id, vector, options);
        this.cache.set(entity.id, vector);
        this.emit('embedding:created', { entityId: entity.id });
        return {
            entityId: entity.id,
            vector,
            metadata: options.checkpointId ? { checkpointId: options.checkpointId } : undefined,
        };
    }
    /**
     * Batch generate and store embeddings
     */
    async batchEmbed(entities, options = {}) {
        const batchSize = options.batchSize || 10;
        const results = [];
        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            const embeddings = await Promise.all(batch.map(async (entity) => {
                const content = this.extractEntityContent(entity);
                const vector = await this.generateEmbedding(content);
                return {
                    id: entity.id,
                    vector,
                    properties: options.checkpointId
                        ? { checkpointId: options.checkpointId }
                        : {},
                };
            }));
            await this.neo4j.upsertVectors('Entity', embeddings);
            embeddings.forEach(e => {
                this.cache.set(e.id, e.vector);
                results.push({
                    entityId: e.id,
                    vector: e.vector,
                    metadata: e.properties,
                });
            });
            this.emit('embeddings:batch:created', {
                count: embeddings.length,
                total: entities.length,
                progress: Math.min((i + batchSize) / entities.length, 1),
            });
        }
        return results;
    }
    /**
     * Search for similar entities using vector similarity
     */
    async search(query, options = {}) {
        const queryVector = await this.generateEmbedding(query);
        return this.searchByVector(queryVector, options);
    }
    /**
     * Search using a pre-computed vector
     */
    async searchByVector(queryVector, options = {}) {
        const indexName = this.defaultIndexName;
        const results = await this.neo4j.searchVectors(indexName, queryVector, {
            limit: options.limit || 10,
            minScore: options.minScore || 0.5,
            filter: options.filter,
        });
        return results.map(result => ({
            entity: this.parseEntity(result.node),
            score: result.score,
            metadata: options.includeMetadata
                ? this.extractMetadata(result.node)
                : undefined,
        }));
    }
    /**
     * Update embedding for an existing entity
     */
    async updateEmbedding(entityId, content, options = {}) {
        let vector;
        if (content) {
            vector = await this.generateEmbedding(content);
        }
        else {
            // Fetch entity and regenerate
            const query = `MATCH (n:Entity {id: $id}) RETURN n`;
            const result = await this.neo4j.executeCypher(query, { id: entityId });
            if (result.length === 0) {
                throw new Error(`Entity not found: ${entityId}`);
            }
            const entity = this.parseEntity(result[0].n);
            const entityContent = this.extractEntityContent(entity);
            vector = await this.generateEmbedding(entityContent);
        }
        await this.storeEmbedding(entityId, vector, options);
        this.cache.set(entityId, vector);
        this.emit('embedding:updated', { entityId });
    }
    /**
     * Delete embedding for an entity
     */
    async deleteEmbedding(entityId) {
        const query = `
      MATCH (n:Entity {id: $id})
      REMOVE n.embedding
      RETURN n
    `;
        await this.neo4j.executeCypher(query, { id: entityId });
        this.cache.clear();
        this.emit('embedding:deleted', { entityId });
    }
    /**
     * Get embedding statistics
     */
    async getEmbeddingStats() {
        var _a, _b;
        const queries = [
            {
                name: 'total',
                query: 'MATCH (n:Entity) RETURN count(n) as count',
            },
            {
                name: 'indexed',
                query: 'MATCH (n:Entity) WHERE n.embedding IS NOT NULL RETURN count(n) as count',
            },
            {
                name: 'sample',
                query: `
          MATCH (n:Entity)
          WHERE n.embedding IS NOT NULL
          RETURN n.embedding as embedding
          LIMIT 100
        `,
            },
        ];
        const [totalResult, indexedResult, sampleResult] = await Promise.all(queries.map(q => this.neo4j.executeCypher(q.query)));
        const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        const indexed = ((_b = indexedResult[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        let dimensions = this.defaultDimensions;
        let avgMagnitude = 0;
        if (sampleResult.length > 0) {
            const samples = sampleResult
                .map(r => r.embedding)
                .filter(e => Array.isArray(e));
            if (samples.length > 0) {
                dimensions = samples[0].length;
                const magnitudes = samples.map(vector => Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)));
                avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
            }
        }
        return {
            total,
            indexed,
            dimensions,
            avgMagnitude,
        };
    }
    /**
     * Find similar entities to a given entity
     */
    async findSimilar(entityId, options = {}) {
        // Try cache first
        let vector = this.cache.get(entityId);
        if (!vector) {
            // Fetch from database
            const query = `
        MATCH (n:Entity {id: $id})
        WHERE n.embedding IS NOT NULL
        RETURN n.embedding as embedding
      `;
            const result = await this.neo4j.executeCypher(query, { id: entityId });
            if (result.length === 0 || !result[0].embedding) {
                throw new Error(`No embedding found for entity: ${entityId}`);
            }
            vector = result[0].embedding;
            if (!vector) {
                throw new Error(`Invalid embedding for entity: ${entityId}`);
            }
            this.cache.set(entityId, vector);
        }
        if (!vector) {
            throw new Error(`No valid embedding found for entity: ${entityId}`);
        }
        // Exclude the source entity from results
        const filter = { ...options.filter, 'id': { $ne: entityId } };
        return this.searchByVector(vector, { ...options, filter });
    }
    /**
     * Generate embedding for content
     */
    async generateEmbedding(content) {
        if (!content || content.trim().length === 0) {
            // Return zero vector for empty content
            return new Array(this.defaultDimensions).fill(0);
        }
        try {
            const result = await embeddingService.generateEmbedding(content);
            return result.embedding;
        }
        catch (error) {
            console.error('Failed to generate embedding:', error);
            // Return random unit vector as fallback
            const vector = new Array(this.defaultDimensions)
                .fill(0)
                .map(() => Math.random() - 0.5);
            const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
            return vector.map(v => v / magnitude);
        }
    }
    /**
     * Store embedding in Neo4j
     */
    async storeEmbedding(entityId, vector, options = {}) {
        const properties = {
            embeddingVersion: process.env.EMBEDDING_MODEL_VERSION || 'default',
            embeddingUpdatedAt: new Date().toISOString(),
        };
        if (options.checkpointId) {
            properties.checkpointId = options.checkpointId;
        }
        await this.neo4j.upsertVectors('Entity', [{
                id: entityId,
                vector,
                properties,
            }]);
    }
    /**
     * Extract content from entity for embedding
     */
    extractEntityContent(entity) {
        const parts = [];
        // Add name and type
        if ('name' in entity && entity.name)
            parts.push(`Name: ${entity.name}`);
        if (entity.type)
            parts.push(`Type: ${entity.type}`);
        // Add description if available
        if (entity.description) {
            parts.push(`Description: ${entity.description}`);
        }
        // Add content if available (for code entities)
        if (entity.content) {
            const content = entity.content;
            // Truncate very long content
            const maxLength = 5000;
            if (content.length > maxLength) {
                parts.push(content.substring(0, maxLength) + '...');
            }
            else {
                parts.push(content);
            }
        }
        // Add path if available
        if (entity.path) {
            parts.push(`Path: ${entity.path}`);
        }
        // Add metadata if available
        if ('metadata' in entity && entity.metadata) {
            parts.push(`Metadata: ${JSON.stringify(entity.metadata)}`);
        }
        return parts.join('\n');
    }
    /**
     * Parse entity from Neo4j node
     */
    parseEntity(node) {
        const properties = node.properties || node;
        const entity = {};
        for (const [key, value] of Object.entries(properties)) {
            if (key === 'embedding')
                continue; // Skip embedding vector
            if (value === null || value === undefined)
                continue;
            if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
                entity[key] = new Date(value);
            }
            else if (typeof value === 'string' &&
                (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    entity[key] = JSON.parse(value);
                }
                catch (_a) {
                    entity[key] = value;
                }
            }
            else {
                entity[key] = value;
            }
        }
        return entity;
    }
    /**
     * Extract metadata from Neo4j node
     */
    extractMetadata(node) {
        const properties = node.properties || node;
        const metadata = {};
        const metadataKeys = [
            'embeddingVersion',
            'embeddingUpdatedAt',
            'checkpointId',
            'confidence',
            'source',
        ];
        for (const key of metadataKeys) {
            if (properties[key]) {
                metadata[key] = properties[key];
            }
        }
        return metadata;
    }
}
//# sourceMappingURL=EmbeddingService.js.map