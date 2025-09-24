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
    // ========== High-Throughput Ingestion Pipeline Integration ==========
    /**
     * Process a directory using the high-throughput ingestion pipeline
     * This method bridges the existing KnowledgeGraphService with the new pipeline
     */
    async processDirectory(directoryPath, options = {}) {
        const startTime = Date.now();
        const errors = [];
        let processedFiles = 0;
        let processedEntities = 0;
        let processedRelationships = 0;
        try {
            // Import the pipeline components only when needed
            const { HighThroughputIngestionPipeline } = await import('../ingestion/pipeline.js');
            const { createKnowledgeGraphAdapter } = await import('../ingestion/knowledge-graph-adapter.js');
            // Create an adapter that bridges this service to the pipeline
            const adapter = createKnowledgeGraphAdapter(this);
            // Configure the pipeline
            const pipelineConfig = {
                batchSize: options.batchSize || 100,
                maxConcurrency: options.maxConcurrency || 4,
                queueConfig: {
                    maxSize: 10000,
                    partitions: 4,
                    persistenceConfig: {
                        enabled: false // In-memory for now
                    }
                },
                workerConfig: {
                    poolSize: options.maxConcurrency || 4,
                    taskTimeout: 30000
                },
                batchConfig: {
                    maxBatchSize: options.batchSize || 100,
                    flushInterval: 1000,
                    enableCompression: false
                },
                enrichmentConfig: {
                    enableEmbeddings: !options.skipEmbeddings,
                    batchSize: 25
                }
            };
            // Create and start the pipeline
            const pipeline = new HighThroughputIngestionPipeline(pipelineConfig, adapter, {
                embeddingService: this.embeddings
            });
            // Set up progress tracking
            pipeline.on('batch:completed', (data) => {
                processedEntities += data.entitiesProcessed || 0;
                processedRelationships += data.relationshipsProcessed || 0;
                if (options.progressCallback) {
                    options.progressCallback({
                        processed: processedFiles,
                        total: 0, // Will be updated as we discover files
                        errors: errors.length
                    });
                }
            });
            pipeline.on('error', (error) => {
                var _a;
                errors.push({
                    file: ((_a = error.context) === null || _a === void 0 ? void 0 : _a.filePath) || 'unknown',
                    error: error.message || 'Unknown error'
                });
            });
            await pipeline.start();
            try {
                // Process the directory
                await this.processDirectoryRecursively(directoryPath, pipeline, options.fileFilters, (filePath) => {
                    processedFiles++;
                    if (options.progressCallback) {
                        options.progressCallback({
                            processed: processedFiles,
                            total: 0, // We don't know total until we scan all files
                            errors: errors.length
                        });
                    }
                });
                // Wait for pipeline to complete processing
                await pipeline.waitForCompletion();
            }
            finally {
                await pipeline.stop();
            }
            const totalTimeMs = Date.now() - startTime;
            const entitiesPerSecond = processedEntities / (totalTimeMs / 1000);
            const filesPerSecond = processedFiles / (totalTimeMs / 1000);
            return {
                success: errors.length === 0,
                processedFiles,
                processedEntities,
                processedRelationships,
                errors,
                metrics: {
                    totalTimeMs,
                    entitiesPerSecond,
                    filesPerSecond
                }
            };
        }
        catch (error) {
            console.error('[KnowledgeGraphService] Directory processing failed:', error);
            errors.push({
                file: directoryPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            const totalTimeMs = Date.now() - startTime;
            return {
                success: false,
                processedFiles,
                processedEntities,
                processedRelationships,
                errors,
                metrics: {
                    totalTimeMs,
                    entitiesPerSecond: 0,
                    filesPerSecond: 0
                }
            };
        }
    }
    /**
     * Helper method to recursively process directories
     */
    async processDirectoryRecursively(dirPath, pipeline, fileFilters, onFileProcessed) {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Skip node_modules and other common directories
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                        continue;
                    }
                    await this.processDirectoryRecursively(fullPath, pipeline, fileFilters, onFileProcessed);
                }
                else if (entry.isFile()) {
                    // Apply file filters if provided
                    if (fileFilters && fileFilters.length > 0) {
                        const shouldProcess = fileFilters.some(filter => {
                            if (filter.startsWith('*.')) {
                                return fullPath.endsWith(filter.slice(1));
                            }
                            return fullPath.includes(filter);
                        });
                        if (!shouldProcess)
                            continue;
                    }
                    // Default to common source code files
                    const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h'];
                    const hasValidExtension = supportedExtensions.some(ext => fullPath.endsWith(ext));
                    if (hasValidExtension) {
                        await pipeline.processFile(fullPath);
                        onFileProcessed === null || onFileProcessed === void 0 ? void 0 : onFileProcessed(fullPath);
                    }
                }
            }
        }
        catch (error) {
            console.error(`[KnowledgeGraphService] Error processing directory ${dirPath}:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map