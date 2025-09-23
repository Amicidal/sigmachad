/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 * Now using only OGM implementations - legacy code removed
 * Refactored into modular components for better maintainability
 */
import { EventEmitter } from "events";
import { RelationshipType } from "../../models/relationships.js";
import { ServiceRegistry } from "./knowledge-graph/ServiceRegistry.js";
import { EventOrchestrator } from "./knowledge-graph/EventOrchestrator.js";
import { GraphInitializer } from "./knowledge-graph/GraphInitializer.js";
import { EntityManager, RelationshipManager, SearchManager, HistoryManager, AnalysisManager, } from "../../facades/graph/index.js";
export class KnowledgeGraphService extends EventEmitter {
    // Convenience getters for backward compatibility
    get neo4j() {
        return this.registry.neo4jService;
    }
    get neogma() {
        return this.registry.neogmaService;
    }
    get entities() {
        return this.registry.entityService;
    }
    get relationships() {
        return this.registry.relationshipService;
    }
    get embeddings() {
        return this.registry.embeddingService;
    }
    get searchService() {
        return this.registry.searchService;
    }
    get history() {
        return this.registry.historyService;
    }
    get analysis() {
        return this.registry.analysisService;
    }
    constructor(config, overrides = {}) {
        super();
        // Initialize service registry
        this.registry = new ServiceRegistry(config, overrides);
        // Initialize sub-facades
        this.entityManager = new EntityManager(this.entities, this.embeddings);
        this.relationshipManager = new RelationshipManager(this.relationships);
        this.searchManager = new SearchManager(this.searchService);
        this.historyManager = new HistoryManager(this.history, this.neo4j);
        this.analysisManager = new AnalysisManager(this.analysis);
        // Initialize event orchestrator
        this.eventOrchestrator = new EventOrchestrator(this.entities, this.relationships, this.searchService, this.analysis);
        // Forward events from orchestrator
        this.eventOrchestrator.on("entity:created", (data) => this.emit("entity:created", data));
        this.eventOrchestrator.on("entity:updated", (data) => this.emit("entity:updated", data));
        this.eventOrchestrator.on("entity:deleted", (data) => this.emit("entity:deleted", data));
        this.eventOrchestrator.on("entities:bulk:created", (data) => this.emit("entities:bulk:created", data));
        this.eventOrchestrator.on("relationship:created", (data) => this.emit("relationship:created", data));
        this.eventOrchestrator.on("relationship:deleted", (data) => this.emit("relationship:deleted", data));
        this.eventOrchestrator.on("search:completed", (data) => this.emit("search:completed", data));
        this.eventOrchestrator.on("impact:analyzed", (data) => this.emit("impact:analyzed", data));
        // Initialize graph initializer
        this.initializer = new GraphInitializer(this.neo4j, this.embeddings);
        // Forward initializer events
        this.initializer.on("database:initialized", () => this.emit("database:initialized"));
        this.initializer.on("database:error", (error) => this.emit("database:error", error));
        // Initialize database indexes
        this.initializer
            .initializeDatabase()
            .catch((err) => console.error("Failed to initialize database:", err));
        console.log("[KnowledgeGraphService] Initialized with modular facades");
    }
    // ========== Entity Operations ==========
    async createEntity(entity, options) {
        return this.entityManager.createEntity(entity, options);
    }
    async updateEntity(id, updates) {
        return this.entityManager.updateEntity(id, updates);
    }
    async createOrUpdateEntity(entity, options) {
        return this.entityManager.createOrUpdateEntity(entity, options);
    }
    async getEntity(id) {
        return this.entityManager.getEntity(id);
    }
    async deleteEntity(id) {
        return this.entityManager.deleteEntity(id);
    }
    async listEntities(options) {
        return this.entityManager.listEntities(options);
    }
    async createEntitiesBulk(entities, options) {
        return this.entityManager.createEntitiesBulk(entities, options);
    }
    // ========== Relationship Operations ==========
    async createRelationship(relationship) {
        return this.relationshipManager.createRelationship(relationship);
    }
    async createRelationshipsBulk(relationships, options) {
        return this.relationshipManager.createRelationshipsBulk(relationships, options);
    }
    async getRelationships(query) {
        return this.relationshipManager.getRelationships(query);
    }
    async queryRelationships(query) {
        return this.relationshipManager.queryRelationships(query);
    }
    async deleteRelationship(fromId, toId, type) {
        return this.relationshipManager.deleteRelationship(fromId, toId, type);
    }
    // ========== Search Operations ==========
    async searchEntities(request) {
        return this.searchManager.searchEntities(request);
    }
    async search(request) {
        return this.searchManager.search(request);
    }
    async semanticSearch(query, options) {
        return this.searchManager.semanticSearch(query, options);
    }
    async structuralSearch(query, options) {
        return this.searchManager.structuralSearch(query, options);
    }
    async findSymbolsByName(name, options) {
        return this.searchManager.findSymbolsByName(name, options);
    }
    async findNearbySymbols(filePath, position, options) {
        return this.searchManager.findNearbySymbols(filePath, position, options);
    }
    // ========== Analysis Operations ==========
    async analyzeImpact(request) {
        return this.analysisManager.analyzeImpact(request);
    }
    async getEntityDependencies(entityId, options) {
        return this.analysisManager.getEntityDependencies(entityId, options);
    }
    async findPaths(query) {
        return this.analysisManager.findPaths(query);
    }
    async computeAndStoreEdgeStats(entityId) {
        return this.analysisManager.computeAndStoreEdgeStats(entityId);
    }
    // ========== History Operations ==========
    async appendVersion(entity, options) {
        return this.historyManager.appendVersion(entity, options);
    }
    async createCheckpoint(seedEntities, options) {
        return this.historyManager.createCheckpoint(seedEntities, options);
    }
    async pruneHistory(retentionDays, options) {
        return this.historyManager.pruneHistory(retentionDays, options);
    }
    async listCheckpoints(options) {
        return this.historyManager.listCheckpoints(options);
    }
    async getHistoryMetrics() {
        return this.historyManager.getHistoryMetrics();
    }
    async timeTravelTraversal(query) {
        return this.historyManager.timeTravelTraversal(query);
    }
    async exportCheckpoint(checkpointId) {
        return this.historyManager.exportCheckpoint(checkpointId);
    }
    async importCheckpoint(checkpointData) {
        return this.historyManager.importCheckpoint(checkpointData);
    }
    async getCheckpoint(checkpointId) {
        return this.historyManager.getCheckpoint(checkpointId);
    }
    async getCheckpointMembers(checkpointId) {
        return this.historyManager.getCheckpointMembers(checkpointId);
    }
    async getCheckpointSummary(checkpointId) {
        return this.historyManager.getCheckpointSummary(checkpointId);
    }
    async deleteCheckpoint(checkpointId) {
        return this.historyManager.deleteCheckpoint(checkpointId);
    }
    async getEntityTimeline(entityId, options) {
        return this.historyManager.getEntityTimeline(entityId, options);
    }
    async getRelationshipTimeline(relationshipId, options) {
        return this.historyManager.getRelationshipTimeline(relationshipId, options);
    }
    async getSessionTimeline(sessionId, options) {
        return this.historyManager.getSessionTimeline(sessionId, options);
    }
    async getSessionImpacts(sessionId) {
        return this.historyManager.getSessionImpacts(sessionId);
    }
    async getSessionsAffectingEntity(entityId, options) {
        return this.historyManager.getSessionsAffectingEntity(entityId, options);
    }
    async getChangesForSession(sessionId, options) {
        return this.historyManager.getChangesForSession(sessionId, options);
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
        return this.searchManager.clearSearchCache();
    }
    async invalidateSearchCache(pattern) {
        return this.searchManager.invalidateSearchCache(pattern);
    }
    async ensureIndices() {
        await this.initializer.ensureIndices();
    }
    async mergeNormalizedDuplicates() {
        return this.relationshipManager.mergeNormalizedDuplicates();
    }
    async markInactiveEdgesNotSeenSince(since) {
        return this.relationshipManager.markInactiveEdgesNotSeenSince(since);
    }
    async getIndexHealth() {
        return this.neo4j.getIndexHealth();
    }
    async ensureGraphIndexes() {
        await this.initializer.ensureGraphIndexes();
    }
    async runBenchmarks(options) {
        return this.initializer.runBenchmarks(options);
    }
    // ========== Cleanup ==========
    async close() {
        await this.registry.close();
        this.emit("service:closed");
    }
    // ========== Additional Utility Methods ==========
    async initialize() {
        await this.initializer.initializeDatabase();
    }
    async getEntitiesByFile(filePath) {
        return this.entityManager.getEntitiesByFile(filePath);
    }
    async getEntityExamples(entityId) {
        return this.searchManager.getEntityExamples(entityId);
    }
    async upsertEdgeEvidenceBulk(updates) {
        return this.relationshipManager.upsertEdgeEvidenceBulk(updates);
    }
    async openEdge(fromId, toId, type, ts, changeSetId) {
        return this.historyManager.openEdge(fromId, toId, type, ts, changeSetId);
    }
    async closeEdge(fromId, toId, type, ts) {
        return this.historyManager.closeEdge(fromId, toId, type, ts);
    }
    // ========== Session Management Methods ==========
    async annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId, relationshipIds, timestamp) {
        return this.historyManager.annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId, relationshipIds, timestamp);
    }
    async createSessionCheckpointLink(sessionId, checkpointId, metadata) {
        return this.historyManager.createSessionCheckpointLink(sessionId, checkpointId, metadata);
    }
    // ========== Compatibility Methods for API ==========
    async findRecentEntityIds(limit) {
        return this.entityManager.findRecentEntityIds(limit);
    }
    async findEntitiesByType(entityType) {
        return this.entityManager.findEntitiesByType(entityType);
    }
    async listRelationships(query) {
        return this.relationshipManager.listRelationships(query);
    }
    async listModuleChildren(moduleId, options) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromEntityId: moduleId,
            type: RelationshipType.CONTAINS,
        });
        const childIds = relationships.map((r) => { var _a; return r.toEntityId || ((_a = r.to) === null || _a === void 0 ? void 0 : _a.id); });
        const children = await Promise.all(childIds.map((id) => this.entities.getEntity(id)));
        return {
            children: children.filter((e) => e !== null),
            modulePath: moduleId,
        };
    }
    async listImports(fileId, options) {
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromEntityId: fileId,
            type: RelationshipType.IMPORTS,
        });
        const importIds = relationships.map((r) => { var _a; return r.toEntityId || ((_a = r.to) === null || _a === void 0 ? void 0 : _a.id); });
        const imports = await Promise.all(importIds.map((id) => this.entities.getEntity(id)));
        return {
            imports: imports.filter((e) => e !== null),
            entityId: fileId,
        };
    }
    async findDefinition(symbolId) {
        var _a;
        // Stub implementation - delegate to relationships or implement later
        const relationships = await this.relationships.getRelationships({
            fromEntityId: symbolId,
            type: RelationshipType.DEFINES,
        });
        if (relationships.length > 0) {
            const toId = relationships[0].toEntityId ||
                ((_a = relationships[0].to) === null || _a === void 0 ? void 0 : _a.id);
            return toId ? this.entities.getEntity(toId) : null;
        }
        return null;
    }
    // ========== Missing Relationship Delegation Methods ==========
    async getRelationshipById(relationshipId) {
        return this.relationshipManager.getRelationshipById(relationshipId);
    }
    async getEdgeEvidenceNodes(relationshipId, limit) {
        return this.relationshipManager.getEdgeEvidenceNodes(relationshipId, limit);
    }
    async getEdgeSites(relationshipId, limit) {
        return this.relationshipManager.getEdgeSites(relationshipId, limit);
    }
    async getEdgeCandidates(relationshipId, limit) {
        return this.relationshipManager.getEdgeCandidates(relationshipId, limit);
    }
    // ========== History Repair Methods ==========
    async repairPreviousVersionLink(versionId) {
        return this.historyManager.repairPreviousVersionLink(versionId);
    }
    // ========== Missing Methods for Compatibility ==========
    async upsertRelationship(relationship) {
        return this.relationshipManager.upsertRelationship(relationship);
    }
    async canonicalizeRelationship(relationship) {
        return this.relationshipManager.canonicalizeRelationship(relationship);
    }
    async finalizeScan(scanStart) {
        return this.relationshipManager.finalizeScan(scanStart);
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map