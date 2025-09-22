/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { EntityService } from './EntityService.js';
import { RelationshipService } from './RelationshipService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { SearchService } from './SearchService.js';
import { HistoryService } from './HistoryService.js';
import { AnalysisService } from './AnalysisService.js';
export class KnowledgeGraphService extends EventEmitter {
    constructor(config) {
        super();
        const neo4jConfig = config || {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            username: process.env.NEO4J_USERNAME || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'password',
            database: process.env.NEO4J_DATABASE || 'neo4j',
        };
        // Initialize services
        this.neo4j = new Neo4jService(neo4jConfig);
        this.entities = new EntityService(this.neo4j);
        this.relationships = new RelationshipService(this.neo4j);
        this.embeddings = new EmbeddingService(this.neo4j);
        this.search = new SearchService(this.neo4j, this.embeddings);
        this.history = new HistoryService(this.neo4j);
        this.analysis = new AnalysisService(this.neo4j);
        // Forward events from sub-services
        this.setupEventForwarding();
        // Initialize database indexes
        this.initializeDatabase().catch(err => console.error('Failed to initialize database:', err));
    }
    /**
     * Initialize database with necessary indexes and constraints
     */
    async initializeDatabase() {
        await this.neo4j.createCommonIndexes();
        await this.embeddings.initializeVectorIndex();
        this.emit('database:initialized');
    }
    /**
     * Setup event forwarding from sub-services
     */
    setupEventForwarding() {
        // Forward entity events
        this.entities.on('entity:created', (data) => {
            this.emit('entity:created', data);
        });
        this.entities.on('entity:updated', (data) => {
            this.emit('entity:updated', data);
        });
        this.entities.on('entity:deleted', (data) => {
            this.emit('entity:deleted', data);
        });
        // Forward relationship events
        this.relationships.on('relationship:created', (data) => {
            this.emit('relationship:created', data);
        });
        this.relationships.on('relationship:deleted', (data) => {
            this.emit('relationship:deleted', data);
        });
        // Forward search events
        this.search.on('search:completed', (data) => this.emit('search:completed', data));
        // Forward analysis events
        this.analysis.on('impact:analyzed', (data) => this.emit('impact:analyzed', data));
    }
    // ========== Entity Operations ==========
    async createEntity(entity, options) {
        const created = await this.entities.createEntity(entity);
        // Generate embedding asynchronously unless skipped
        if (!(options === null || options === void 0 ? void 0 : options.skipEmbedding)) {
            this.embeddings.generateAndStore(created).catch(err => console.warn('Failed to generate embedding:', err));
        }
        return created;
    }
    async updateEntity(id, updates) {
        const updated = await this.entities.updateEntity(id, updates);
        // Update embedding if content changed
        if (updates.content || updates.name || updates.description) {
            this.embeddings.updateEmbedding(id).catch(err => console.warn('Failed to update embedding:', err));
        }
        return updated;
    }
    async getEntity(id) {
        return this.entities.getEntity(id);
    }
    async deleteEntity(id) {
        await this.embeddings.deleteEmbedding(id);
        await this.entities.deleteEntity(id);
    }
    async listEntities(options) {
        const result = await this.entities.listEntities(options);
        return {
            items: result.items,
            entities: result.items, // For backward compatibility
            total: result.total,
        };
    }
    async createEntitiesBulk(entities, options) {
        const result = await this.entities.createEntitiesBulk(entities, options);
        // Generate embeddings in background
        this.embeddings.batchEmbed(entities).catch(err => console.warn('Failed to generate bulk embeddings:', err));
        return result;
    }
    // ========== Relationship Operations ==========
    async createRelationship(relationship) {
        return this.relationships.createRelationship(relationship);
    }
    async createRelationshipsBulk(relationships, options) {
        return this.relationships.createRelationshipsBulk(relationships, options);
    }
    async getRelationships(query) {
        return this.relationships.getRelationships(query);
    }
    async deleteRelationship(fromId, toId, type) {
        return this.relationships.deleteRelationship(fromId, toId, type);
    }
    // ========== Search Operations ==========
    async searchEntities(request) {
        return this.search.search(request);
    }
    async semanticSearch(query, options) {
        return this.search.semanticSearch(query, options);
    }
    async structuralSearch(query, options) {
        return this.search.structuralSearch(query, options);
    }
    async findSymbolsByName(name, options) {
        return this.search.findSymbolsByName(name, options);
    }
    async findNearbySymbols(filePath, position, options) {
        return this.search.findNearbySymbols(filePath, position, options);
    }
    // ========== Analysis Operations ==========
    async analyzeImpact(request) {
        return this.analysis.analyzeImpact(request);
    }
    async getEntityDependencies(entityId, options) {
        return this.analysis.getEntityDependencies(entityId, options);
    }
    async findPaths(query) {
        return this.analysis.findPaths(query);
    }
    async computeAndStoreEdgeStats(entityId) {
        return this.analysis.computeAndStoreEdgeStats(entityId);
    }
    // ========== History Operations ==========
    async appendVersion(entity, options) {
        return this.history.appendVersion(entity, options);
    }
    async createCheckpoint(seedEntities, options) {
        return this.history.createCheckpoint(seedEntities, options);
    }
    async pruneHistory(retentionDays, options) {
        return this.history.pruneHistory(retentionDays, options);
    }
    async listCheckpoints(options) {
        return this.history.listCheckpoints(options);
    }
    async getHistoryMetrics() {
        return this.history.getHistoryMetrics();
    }
    async timeTravelTraversal(query) {
        return this.history.timeTravelTraversal(query);
    }
    // ========== Embedding Operations ==========
    async createEmbedding(entity) {
        return this.embeddings.generateAndStore(entity);
    }
    async updateEmbedding(entityId, content) {
        return this.embeddings.updateEmbedding(entityId, content);
    }
    async deleteEmbedding(entityId) {
        return this.embeddings.deleteEmbedding(entityId);
    }
    async createEmbeddingsBatch(entities, options) {
        return this.embeddings.batchEmbed(entities, options);
    }
    async findSimilar(entityId, options) {
        return this.embeddings.findSimilar(entityId, options);
    }
    // ========== Admin Operations ==========
    async getStats() {
        const [dbStats, entityStats, relStats, embeddingStats] = await Promise.all([
            this.neo4j.getStats(),
            this.entities.getEntityStats(),
            this.relationships.getRelationshipStats(),
            this.embeddings.getEmbeddingStats(),
        ]);
        return {
            database: dbStats,
            entities: entityStats,
            relationships: relStats,
            embeddings: embeddingStats,
        };
    }
    async clearSearchCache() {
        this.search.clearCache();
    }
    async invalidateSearchCache(pattern) {
        this.search.invalidateCache(pattern);
    }
    async ensureIndices() {
        await this.neo4j.createCommonIndexes();
    }
    async mergeNormalizedDuplicates() {
        return this.relationships.mergeNormalizedDuplicates();
    }
    async markInactiveEdgesNotSeenSince(since) {
        return this.relationships.markInactiveEdgesNotSeenSince(since);
    }
    // ========== Cleanup ==========
    async close() {
        await this.neo4j.close();
        this.emit('service:closed');
    }
    // ========== Additional Utility Methods ==========
    async initialize() {
        await this.initializeDatabase();
    }
    async getEntitiesByFile(filePath) {
        return this.entities.getEntitiesByFile(filePath);
    }
    async getEntityExamples(entityId) {
        return this.search.getEntityExamples(entityId);
    }
    async upsertEdgeEvidenceBulk(updates) {
        return this.relationships.upsertEdgeEvidenceBulk(updates);
    }
    async openEdge(fromId, toId, type, ts, changeSetId) {
        return this.history.openEdge(fromId, toId, type, ts, changeSetId);
    }
    async closeEdge(fromId, toId, type, ts) {
        return this.history.closeEdge(fromId, toId, type, ts);
    }
    // ========== Compatibility Methods for API ==========
    async findRecentEntityIds(limit) {
        const result = await this.entities.listEntities({
            limit: limit || 100,
            orderBy: 'lastModified',
            orderDirection: 'DESC',
        });
        return result.items.map(e => e.id);
    }
    async search(request) {
        const results = await this.search.search(request);
        return results.map(r => r.entity);
    }
    async findEntitiesByType(entityType) {
        return this.entities.getEntitiesByType(entityType);
    }
    async listRelationships(query) {
        return this.relationships.getRelationships(query);
    }
    async listModuleChildren(moduleId) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromId: moduleId,
            type: 'contains',
        });
        const childIds = relationships.map(r => r.toId);
        const children = await Promise.all(childIds.map(id => this.entities.getEntity(id)));
        return children.filter((e) => e !== null);
    }
    async listImports(fileId) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromId: fileId,
            type: 'imports',
        });
        const importIds = relationships.map(r => r.toId);
        const imports = await Promise.all(importIds.map(id => this.entities.getEntity(id)));
        return imports.filter((e) => e !== null);
    }
    async findDefinition(symbolId) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromId: symbolId,
            type: 'defines',
        });
        if (relationships.length > 0) {
            return this.entities.getEntity(relationships[0].toId);
        }
        return null;
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map