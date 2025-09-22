/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 * Now using only OGM implementations - legacy code removed
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { NeogmaService } from './ogm/NeogmaService.js';
import { EntityServiceOGM } from './ogm/EntityServiceOGM.js';
import { RelationshipServiceOGM } from './ogm/RelationshipServiceOGM.js';
import { SearchServiceOGM } from './ogm/SearchServiceOGM.js';
import { EmbeddingService } from './EmbeddingService.js';
import { HistoryService } from './HistoryService.js';
import { AnalysisService } from './AnalysisService.js';
export class KnowledgeGraphService extends EventEmitter {
    constructor(config, overrides = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        super();
        const neo4jConfig = {
            uri: (config === null || config === void 0 ? void 0 : config.uri) || process.env.NEO4J_URI || 'bolt://localhost:7687',
            username: (config === null || config === void 0 ? void 0 : config.username) || process.env.NEO4J_USERNAME || 'neo4j',
            password: (config === null || config === void 0 ? void 0 : config.password) || process.env.NEO4J_PASSWORD || 'password',
            database: (config === null || config === void 0 ? void 0 : config.database) || process.env.NEO4J_DATABASE || 'neo4j',
            maxConnectionPoolSize: config === null || config === void 0 ? void 0 : config.maxConnectionPoolSize,
        };
        // Initialize services with OGM implementations only
        this.neo4j = (_a = overrides.neo4j) !== null && _a !== void 0 ? _a : new Neo4jService(neo4jConfig);
        this.neogma = (_b = overrides.neogma) !== null && _b !== void 0 ? _b : new NeogmaService(neo4jConfig);
        this.entities = (_c = overrides.entityService) !== null && _c !== void 0 ? _c : new EntityServiceOGM(this.neogma);
        this.relationships = (_d = overrides.relationshipService) !== null && _d !== void 0 ? _d : new RelationshipServiceOGM(this.neogma);
        this.embeddings = (_e = overrides.embeddingService) !== null && _e !== void 0 ? _e : new EmbeddingService(this.neo4j);
        this.searchService = (_f = overrides.searchService) !== null && _f !== void 0 ? _f : new SearchServiceOGM(this.neogma, this.embeddings);
        this.history = (_g = overrides.historyService) !== null && _g !== void 0 ? _g : new HistoryService(this.neo4j);
        this.analysis = (_h = overrides.analysisService) !== null && _h !== void 0 ? _h : new AnalysisService(this.neo4j);
        // Forward events from sub-services
        this.setupEventForwarding();
        // Initialize database indexes
        this.initializeDatabase().catch(err => console.error('Failed to initialize database:', err));
        console.log('[KnowledgeGraphService] Initialized with OGM services only');
    }
    /**
     * Initialize database with necessary indexes and constraints
     */
    async initializeDatabase() {
        try {
            await this.neo4j.createCommonIndexes();
            await this.embeddings.initializeVectorIndex();
            // OGM models should handle their own indexes
            console.log('[KnowledgeGraphService] OGM database setup completed');
            this.emit('database:initialized');
        }
        catch (error) {
            console.error('[KnowledgeGraphService] Database initialization failed:', error);
            this.emit('database:error', error);
            throw error;
        }
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
        this.entities.on('entities:bulk:created', (data) => {
            this.emit('entities:bulk:created', data);
        });
        // Forward relationship events
        this.relationships.on('relationship:created', (data) => {
            this.emit('relationship:created', data);
        });
        this.relationships.on('relationship:deleted', (data) => {
            this.emit('relationship:deleted', data);
        });
        // Forward search events
        this.searchService.on('search:completed', (data) => this.emit('search:completed', data));
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
    async createOrUpdateEntity(entity, options) {
        // Check if entity exists
        const existing = await this.entities.getEntity(entity.id);
        if (existing) {
            // Update existing entity
            return this.updateEntity(entity.id, entity);
        }
        else {
            // Create new entity
            return this.createEntity(entity, options);
        }
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
    async queryRelationships(query) {
        // Alias for getRelationships for backwards compatibility
        return this.getRelationships(query);
    }
    async deleteRelationship(fromId, toId, type) {
        return this.relationships.deleteRelationship(fromId, toId, type);
    }
    // ========== Search Operations ==========
    async searchEntities(request) {
        return this.searchService.search(request);
    }
    async search(request) {
        const results = await this.searchService.search(request);
        return results.map(r => r.entity);
    }
    async semanticSearch(query, options) {
        return this.searchService.semanticSearch(query, options);
    }
    async structuralSearch(query, options) {
        return this.searchService.structuralSearch(query, options);
    }
    async findSymbolsByName(name, options) {
        return this.searchService.findSymbolsByName(name, options);
    }
    async findNearbySymbols(filePath, position, options) {
        return this.searchService.findNearbySymbols(filePath, position, options);
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
    async exportCheckpoint(checkpointId) {
        return this.history.exportCheckpoint(checkpointId);
    }
    async importCheckpoint(checkpointData) {
        return this.history.importCheckpoint(checkpointData);
    }
    async getCheckpoint(checkpointId) {
        return this.history.getCheckpoint(checkpointId);
    }
    async getCheckpointMembers(checkpointId) {
        return this.history.getCheckpointMembers(checkpointId);
    }
    async getCheckpointSummary(checkpointId) {
        return this.history.getCheckpointSummary(checkpointId);
    }
    async deleteCheckpoint(checkpointId) {
        return this.history.deleteCheckpoint(checkpointId);
    }
    async getEntityTimeline(entityId, options) {
        return this.history.getEntityTimeline(entityId, options);
    }
    async getRelationshipTimeline(relationshipId, options) {
        return this.history.getRelationshipTimeline(relationshipId, options);
    }
    async getSessionTimeline(sessionId, options) {
        return this.history.getSessionTimeline(sessionId, options);
    }
    async getSessionImpacts(sessionId) {
        return this.history.getSessionImpacts(sessionId);
    }
    async getSessionsAffectingEntity(entityId, options) {
        return this.history.getSessionsAffectingEntity(entityId, options);
    }
    async getChangesForSession(sessionId, options) {
        return this.history.getChangesForSession(sessionId, options);
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
        this.searchService.clearCache();
    }
    async invalidateSearchCache(pattern) {
        this.searchService.invalidateCache(pattern);
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
    async getIndexHealth() {
        return this.neo4j.getIndexHealth();
    }
    async ensureGraphIndexes() {
        await this.neo4j.ensureGraphIndexes();
    }
    async runBenchmarks(options) {
        return this.neo4j.runBenchmarks(options);
    }
    // ========== Cleanup ==========
    async close() {
        await this.neo4j.close();
        if (typeof this.neogma.close === 'function') {
            await this.neogma.close();
        }
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
        return this.searchService.getEntityExamples(entityId);
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
    // ========== Session Management Methods ==========
    async annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId, relationshipIds, timestamp) {
        // This is a compatibility method for session checkpoint management
        // It links relationships created in a session to a specific checkpoint
        const at = timestamp || new Date();
        let query;
        let params;
        if (relationshipIds && relationshipIds.length > 0) {
            // Annotate specific relationships
            query = `
        UNWIND $relationshipIds AS relId
        MATCH ()-[r]->()
        WHERE r.id = relId OR elementId(r) = relId
        SET r.checkpointId = $checkpointId
        SET r.sessionId = $sessionId
        SET r.annotatedAt = $timestamp
      `;
            params = { relationshipIds, checkpointId, sessionId, timestamp: at.toISOString() };
        }
        else {
            // Annotate all relationships for the session
            query = `
        MATCH ()-[r]->()
        WHERE r.changeSetId = $sessionId
        SET r.checkpointId = $checkpointId
        SET r.annotatedAt = $timestamp
      `;
            params = { sessionId, checkpointId, timestamp: at.toISOString() };
        }
        await this.neo4j.executeCypher(query, params);
    }
    async createSessionCheckpointLink(sessionId, checkpointId, metadata) {
        // Create a direct link between session and checkpoint entities
        const query = `
      MERGE (s:Session {id: $sessionId})
      ON CREATE SET s.created = $timestamp
      MERGE (c:Checkpoint {id: $checkpointId})
      MERGE (s)-[r:CREATED_CHECKPOINT]->(c)
      SET r.linked = $timestamp
      SET r.metadata = $metadata
    `;
        await this.neo4j.executeCypher(query, {
            sessionId,
            checkpointId,
            timestamp: new Date().toISOString(),
            metadata: JSON.stringify(metadata || {}),
        });
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
    async findEntitiesByType(entityType) {
        return this.entities.getEntitiesByType(entityType);
    }
    async listRelationships(query) {
        const relationships = await this.relationships.getRelationships(query);
        return {
            relationships,
            total: relationships.length,
        };
    }
    async listModuleChildren(moduleId, options) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromId: moduleId,
            type: 'contains',
        });
        const childIds = relationships.map(r => r.toId);
        const children = await Promise.all(childIds.map(id => this.entities.getEntity(id)));
        return {
            children: children.filter((e) => e !== null),
            modulePath: moduleId,
        };
    }
    async listImports(fileId, options) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromId: fileId,
            type: 'imports',
        });
        const importIds = relationships.map(r => r.toId);
        const imports = await Promise.all(importIds.map(id => this.entities.getEntity(id)));
        return {
            imports: imports.filter((e) => e !== null),
            entityId: fileId,
        };
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
    // ========== Missing Relationship Delegation Methods ==========
    async getRelationshipById(relationshipId) {
        return this.relationships.getRelationshipById(relationshipId);
    }
    async getEdgeEvidenceNodes(relationshipId, limit) {
        return this.relationships.getEdgeEvidenceNodes(relationshipId, limit);
    }
    async getEdgeSites(relationshipId, limit) {
        return this.relationships.getEdgeSites(relationshipId, limit);
    }
    async getEdgeCandidates(relationshipId, limit) {
        return this.relationships.getEdgeCandidates(relationshipId, limit);
    }
    // ========== History Repair Methods ==========
    async repairPreviousVersionLink(versionId) {
        // This method repairs broken previous version links in the version chain
        // It's used by the TemporalHistoryValidator
        const query = `
      MATCH (v:Version {id: $versionId})-[:VERSION_OF]->(e:Entity)
      MATCH (e)<-[:VERSION_OF]-(other:Version)
      WHERE other.id <> v.id AND other.timestamp < v.timestamp
      AND NOT (v)-[:PREVIOUS_VERSION]->(:Version)
      WITH v, other
      ORDER BY other.timestamp DESC
      LIMIT 1
      CREATE (v)-[:PREVIOUS_VERSION]->(other)
    `;
        await this.neo4j.executeCypher(query, { versionId });
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map