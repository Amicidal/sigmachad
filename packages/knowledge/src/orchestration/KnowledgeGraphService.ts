/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 * Now using only OGM implementations - legacy code removed
 * Refactored into modular components for better maintainability
 */

import { EventEmitter } from "events";
import { Neo4jConfig } from "./Neo4jService.js";
import { RelationshipType } from "../../models/relationships.js";
import { ServiceRegistry } from "./knowledge-graph/ServiceRegistry.js";
import { EventOrchestrator } from "./knowledge-graph/EventOrchestrator.js";
import { GraphInitializer } from "./knowledge-graph/GraphInitializer.js";
import {
  EntityManager,
  RelationshipManager,
  SearchManager,
  HistoryManager,
  AnalysisManager,
} from "../../facades/graph/index.js";

interface KnowledgeGraphDependencies {
  neo4j?: import("./Neo4jService.js").Neo4jService;
  neogma?: import("./ogm/NeogmaService.js").NeogmaService;
  entityService?: import("./ogm/EntityServiceOGM.js").EntityServiceOGM;
  relationshipService?: import("./ogm/RelationshipServiceOGM.js").RelationshipServiceOGM;
  searchService?: import("./ogm/SearchServiceOGM.js").SearchServiceOGM;
  embeddingService?: import("./EmbeddingService.js").EmbeddingService;
  historyService?: import("./HistoryService.js").HistoryService;
  analysisService?: import("./AnalysisService.js").AnalysisService;
}

// Import types
import { Entity } from "../../models/entities.js";
import {
  GraphRelationship,
  RelationshipQuery,
  PathQuery,
} from "../../models/relationships.js";
import {
  GraphSearchRequest,
  ImpactAnalysisRequest,
  ImpactAnalysis,
  DependencyAnalysis,
} from "../../models/types.js";

export class KnowledgeGraphService extends EventEmitter {
  private registry: ServiceRegistry;
  private eventOrchestrator: EventOrchestrator;
  private initializer: GraphInitializer;

  // Sub-facades for specific concerns
  private entityManager: EntityManager;
  private relationshipManager: RelationshipManager;
  private searchManager: SearchManager;
  private historyManager: HistoryManager;
  private analysisManager: AnalysisManager;

  // Convenience getters for backward compatibility
  private get neo4j() {
    return this.registry.neo4jService;
  }
  private get neogma() {
    return this.registry.neogmaService;
  }
  private get entities() {
    return this.registry.entityService;
  }
  private get relationships() {
    return this.registry.relationshipService;
  }
  private get embeddings() {
    return this.registry.embeddingService;
  }
  private get searchService() {
    return this.registry.searchService;
  }
  private get history() {
    return this.registry.historyService;
  }
  private get analysis() {
    return this.registry.analysisService;
  }

  constructor(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ) {
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
    this.eventOrchestrator = new EventOrchestrator(
      this.entities,
      this.relationships,
      this.searchService,
      this.analysis
    );

    // Forward events from orchestrator
    this.eventOrchestrator.on("entity:created", (data) =>
      this.emit("entity:created", data)
    );
    this.eventOrchestrator.on("entity:updated", (data) =>
      this.emit("entity:updated", data)
    );
    this.eventOrchestrator.on("entity:deleted", (data) =>
      this.emit("entity:deleted", data)
    );
    this.eventOrchestrator.on("entities:bulk:created", (data) =>
      this.emit("entities:bulk:created", data)
    );
    this.eventOrchestrator.on("relationship:created", (data) =>
      this.emit("relationship:created", data)
    );
    this.eventOrchestrator.on("relationship:deleted", (data) =>
      this.emit("relationship:deleted", data)
    );
    this.eventOrchestrator.on("search:completed", (data) =>
      this.emit("search:completed", data)
    );
    this.eventOrchestrator.on("impact:analyzed", (data) =>
      this.emit("impact:analyzed", data)
    );

    // Initialize graph initializer
    this.initializer = new GraphInitializer(this.neo4j, this.embeddings);

    // Forward initializer events
    this.initializer.on("database:initialized", () =>
      this.emit("database:initialized")
    );
    this.initializer.on("database:error", (error) =>
      this.emit("database:error", error)
    );

    // Initialize database indexes
    this.initializer
      .initializeDatabase()
      .catch((err) => console.error("Failed to initialize database:", err));

    console.log("[KnowledgeGraphService] Initialized with modular facades");
  }

  // ========== Entity Operations ==========

  async createEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    return this.entityManager.createEntity(entity, options);
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    return this.entityManager.updateEntity(id, updates);
  }

  async createOrUpdateEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    return this.entityManager.createOrUpdateEntity(entity, options);
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entityManager.getEntity(id);
  }

  async deleteEntity(id: string): Promise<void> {
    return this.entityManager.deleteEntity(id);
  }

  async listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }> {
    return this.entityManager.listEntities(options);
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    return this.entityManager.createEntitiesBulk(entities, options);
  }

  // ========== Relationship Operations ==========

  async createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.createRelationship(relationship);
  }

  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any> {
    return this.relationshipManager.createRelationshipsBulk(
      relationships,
      options
    );
  }

  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipManager.getRelationships(query);
  }

  async queryRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipManager.queryRelationships(query);
  }

  async deleteRelationship(
    fromId: string,
    toId: string,
    type: any
  ): Promise<void> {
    return this.relationshipManager.deleteRelationship(fromId, toId, type);
  }

  // ========== Search Operations ==========

  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.searchManager.searchEntities(request);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    return this.searchManager.search(request);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.searchManager.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.searchManager.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.searchManager.findSymbolsByName(name, options);
  }

  async findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]> {
    return this.searchManager.findNearbySymbols(filePath, position, options);
  }

  // ========== Analysis Operations ==========

  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.analysisManager.analyzeImpact(request);
  }

  async getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis> {
    return this.analysisManager.getEntityDependencies(entityId, options);
  }

  async findPaths(query: PathQuery): Promise<any> {
    return this.analysisManager.findPaths(query);
  }

  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.analysisManager.computeAndStoreEdgeStats(entityId);
  }

  // ========== History Operations ==========

  async appendVersion(entity: Entity, options?: any): Promise<string> {
    return this.historyManager.appendVersion(entity, options);
  }

  async createCheckpoint(seedEntities: string[], options: any): Promise<any> {
    return this.historyManager.createCheckpoint(seedEntities, options);
  }

  async pruneHistory(retentionDays: number, options?: any): Promise<any> {
    return this.historyManager.pruneHistory(retentionDays, options);
  }

  async listCheckpoints(options?: any): Promise<any> {
    return this.historyManager.listCheckpoints(options);
  }

  async getHistoryMetrics(): Promise<any> {
    return this.historyManager.getHistoryMetrics();
  }

  async timeTravelTraversal(query: any): Promise<any> {
    return this.historyManager.timeTravelTraversal(query);
  }

  async exportCheckpoint(checkpointId: string): Promise<any> {
    return this.historyManager.exportCheckpoint(checkpointId);
  }

  async importCheckpoint(checkpointData: any): Promise<any> {
    return this.historyManager.importCheckpoint(checkpointData);
  }

  async getCheckpoint(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpoint(checkpointId);
  }

  async getCheckpointMembers(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpointMembers(checkpointId);
  }

  async getCheckpointSummary(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpointSummary(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    return this.historyManager.deleteCheckpoint(checkpointId);
  }

  async getEntityTimeline(entityId: string, options?: any): Promise<any> {
    return this.historyManager.getEntityTimeline(entityId, options);
  }

  async getRelationshipTimeline(
    relationshipId: string,
    options?: any
  ): Promise<any> {
    return this.historyManager.getRelationshipTimeline(relationshipId, options);
  }

  async getSessionTimeline(sessionId: string, options?: any): Promise<any> {
    return this.historyManager.getSessionTimeline(sessionId, options);
  }

  async getSessionImpacts(sessionId: string): Promise<any> {
    return this.historyManager.getSessionImpacts(sessionId);
  }

  async getSessionsAffectingEntity(
    entityId: string,
    options?: any
  ): Promise<any> {
    return this.historyManager.getSessionsAffectingEntity(entityId, options);
  }

  async getChangesForSession(sessionId: string, options?: any): Promise<any> {
    return this.historyManager.getChangesForSession(sessionId, options);
  }

  // ========== Embedding Operations ==========

  async createEmbedding(entity: Entity): Promise<any> {
    return this.embeddings.generateAndStore(entity);
  }

  async updateEmbedding(entityId: string, content?: string): Promise<void> {
    return this.embeddings.updateEmbedding(entityId, content);
  }

  async deleteEmbedding(entityId: string): Promise<void> {
    return this.embeddings.deleteEmbedding(entityId);
  }

  async createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any> {
    return this.embeddings.batchEmbed(entities, options);
  }

  async findSimilar(entityId: string, options?: any): Promise<any[]> {
    return this.embeddings.findSimilar(entityId, options);
  }

  // ========== Admin Operations ==========

  async getStats(): Promise<any> {
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

  async clearSearchCache(): Promise<void> {
    return this.searchManager.clearSearchCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    return this.searchManager.invalidateSearchCache(pattern);
  }

  async ensureIndices(): Promise<void> {
    await this.initializer.ensureIndices();
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.relationshipManager.mergeNormalizedDuplicates();
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.relationshipManager.markInactiveEdgesNotSeenSince(since);
  }

  async getIndexHealth(): Promise<any> {
    return this.neo4j.getIndexHealth();
  }

  async ensureGraphIndexes(): Promise<void> {
    await this.initializer.ensureGraphIndexes();
  }

  async runBenchmarks(options?: any): Promise<any> {
    return this.initializer.runBenchmarks(options);
  }

  // ========== Cleanup ==========

  async close(): Promise<void> {
    await this.registry.close();
    this.emit("service:closed");
  }

  // ========== Additional Utility Methods ==========

  async initialize(): Promise<void> {
    await this.initializer.initializeDatabase();
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.entityManager.getEntitiesByFile(filePath);
  }

  async getEntityExamples(entityId: string): Promise<any> {
    return this.searchManager.getEntityExamples(entityId);
  }

  async upsertEdgeEvidenceBulk(updates: any[]): Promise<void> {
    return this.relationshipManager.upsertEdgeEvidenceBulk(updates);
  }

  async openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    return this.historyManager.openEdge(fromId, toId, type, ts, changeSetId);
  }

  async closeEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date
  ): Promise<void> {
    return this.historyManager.closeEdge(fromId, toId, type, ts);
  }

  // ========== Session Management Methods ==========

  async annotateSessionRelationshipsWithCheckpoint(
    sessionId: string,
    checkpointId: string,
    relationshipIds?: string[],
    timestamp?: Date
  ): Promise<void> {
    return this.historyManager.annotateSessionRelationshipsWithCheckpoint(
      sessionId,
      checkpointId,
      relationshipIds,
      timestamp
    );
  }

  async createSessionCheckpointLink(
    sessionId: string,
    checkpointId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.historyManager.createSessionCheckpointLink(
      sessionId,
      checkpointId,
      metadata
    );
  }

  // ========== Compatibility Methods for API ==========

  async findRecentEntityIds(limit?: number): Promise<string[]> {
    return this.entityManager.findRecentEntityIds(limit);
  }

  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    return this.entityManager.findEntitiesByType(entityType);
  }

  async listRelationships(
    query: RelationshipQuery
  ): Promise<{ relationships: GraphRelationship[]; total: number }> {
    return this.relationshipManager.listRelationships(query);
  }

  async listModuleChildren(
    moduleId: string,
    options?: any
  ): Promise<{ children: Entity[]; modulePath?: string }> {
    // Stub implementation - delegate to relationships or implement later
    const relationships = await this.relationships.getRelationships({
      fromEntityId: moduleId,
      type: RelationshipType.CONTAINS,
    });
    const childIds = relationships.map(
      (r) => (r as any).toEntityId || (r as any).to?.id
    );
    const children = await Promise.all(
      childIds.map((id) => this.entities.getEntity(id))
    );
    return {
      children: children.filter((e): e is Entity => e !== null),
      modulePath: moduleId,
    };
  }

  async listImports(
    fileId: string,
    options?: any
  ): Promise<{ imports: Entity[]; entityId?: string }> {
    // Stub implementation - delegate to relationships or implement later
    const relationships = await this.relationships.getRelationships({
      fromEntityId: fileId,
      type: RelationshipType.IMPORTS,
    });
    const importIds = relationships.map(
      (r) => (r as any).toEntityId || (r as any).to?.id
    );
    const imports = await Promise.all(
      importIds.map((id) => this.entities.getEntity(id))
    );
    return {
      imports: imports.filter((e): e is Entity => e !== null),
      entityId: fileId,
    };
  }

  async findDefinition(symbolId: string): Promise<Entity | null> {
    // Stub implementation - delegate to relationships or implement later
    const relationships = await this.relationships.getRelationships({
      fromEntityId: symbolId,
      type: RelationshipType.DEFINES,
    });
    if (relationships.length > 0) {
      const toId =
        (relationships[0] as any).toEntityId ||
        (relationships[0] as any).to?.id;
      return toId ? this.entities.getEntity(toId) : null;
    }
    return null;
  }

  // ========== Missing Relationship Delegation Methods ==========

  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    return this.relationshipManager.getRelationshipById(relationshipId);
  }

  async getEdgeEvidenceNodes(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipManager.getEdgeEvidenceNodes(relationshipId, limit);
  }

  async getEdgeSites(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationshipManager.getEdgeSites(relationshipId, limit);
  }

  async getEdgeCandidates(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipManager.getEdgeCandidates(relationshipId, limit);
  }

  // ========== History Repair Methods ==========

  async repairPreviousVersionLink(versionId: string): Promise<void> {
    return this.historyManager.repairPreviousVersionLink(versionId);
  }

  // ========== Missing Methods for Compatibility ==========

  async upsertRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.upsertRelationship(relationship);
  }

  async canonicalizeRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.canonicalizeRelationship(relationship);
  }

  async finalizeScan(scanStart: Date): Promise<void> {
    return this.relationshipManager.finalizeScan(scanStart);
  }
}
