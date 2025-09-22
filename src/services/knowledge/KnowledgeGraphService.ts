/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 * Now using only OGM implementations - legacy code removed
 */

import { EventEmitter } from 'events';
import { Neo4jService, Neo4jConfig } from './Neo4jService.js';
import { NeogmaService } from './ogm/NeogmaService.js';
import { EntityServiceOGM } from './ogm/EntityServiceOGM.js';
import { RelationshipServiceOGM } from './ogm/RelationshipServiceOGM.js';
import { SearchServiceOGM } from './ogm/SearchServiceOGM.js';
import { EmbeddingService } from './EmbeddingService.js';
import { HistoryService } from './HistoryService.js';
import { AnalysisService } from './AnalysisService.js';
import { RelationshipType } from '../../models/relationships.js';

interface KnowledgeGraphDependencies {
  neo4j?: Neo4jService;
  neogma?: NeogmaService;
  entityService?: EntityServiceOGM;
  relationshipService?: RelationshipServiceOGM;
  searchService?: SearchServiceOGM;
  embeddingService?: EmbeddingService;
  historyService?: HistoryService;
  analysisService?: AnalysisService;
}

// Import types
import { Entity } from '../../models/entities.js';
import {
  GraphRelationship,
  RelationshipQuery,
  PathQuery,
} from '../../models/relationships.js';
import {
  GraphSearchRequest,
  ImpactAnalysisRequest,
  ImpactAnalysis,
  DependencyAnalysis,
} from '../../models/types.js';

export class KnowledgeGraphService extends EventEmitter {
  private neo4j: Neo4jService;
  private neogma: NeogmaService;
  private entities: EntityServiceOGM;
  private relationships: RelationshipServiceOGM;
  private embeddings: EmbeddingService;
  private searchService: SearchServiceOGM;
  private history: HistoryService;
  private analysis: AnalysisService;

  constructor(config?: Neo4jConfig, overrides: KnowledgeGraphDependencies = {}) {
    super();

    const neo4jConfig: Neo4jConfig = {
      uri: config?.uri || process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: config?.username || process.env.NEO4J_USERNAME || 'neo4j',
      password: config?.password || process.env.NEO4J_PASSWORD || 'password',
      database: config?.database || process.env.NEO4J_DATABASE || 'neo4j',
      maxConnectionPoolSize: config?.maxConnectionPoolSize,
    };

    // Initialize services with OGM implementations only
    this.neo4j = overrides.neo4j ?? new Neo4jService(neo4jConfig);
    this.neogma = overrides.neogma ?? new NeogmaService(neo4jConfig);
    this.entities = overrides.entityService ?? new EntityServiceOGM(this.neogma);
    this.relationships = overrides.relationshipService ?? new RelationshipServiceOGM(this.neogma);
    this.embeddings = overrides.embeddingService ?? new EmbeddingService(this.neo4j);
    this.searchService = overrides.searchService ?? new SearchServiceOGM(this.neogma, this.embeddings);
    this.history = overrides.historyService ?? new HistoryService(this.neo4j);
    this.analysis = overrides.analysisService ?? new AnalysisService(this.neo4j);

    // Forward events from sub-services
    this.setupEventForwarding();

    // Initialize database indexes
    this.initializeDatabase().catch(err =>
      console.error('Failed to initialize database:', err)
    );

    console.log('[KnowledgeGraphService] Initialized with OGM services only');
  }


  /**
   * Initialize database with necessary indexes and constraints
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.neo4j.createCommonIndexes();
      await this.embeddings.initializeVectorIndex();

      // OGM models should handle their own indexes
      console.log('[KnowledgeGraphService] OGM database setup completed');

      this.emit('database:initialized');
    } catch (error) {
      console.error('[KnowledgeGraphService] Database initialization failed:', error);
      this.emit('database:error', error);
      throw error;
    }
  }


  /**
   * Setup event forwarding from sub-services
   */
  private setupEventForwarding(): void {
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
    this.searchService.on('search:completed', (data) =>
      this.emit('search:completed', data)
    );

    // Forward analysis events
    this.analysis.on('impact:analyzed', (data) =>
      this.emit('impact:analyzed', data)
    );
  }

  // ========== Entity Operations ==========

  async createEntity(entity: Entity, options?: { skipEmbedding?: boolean }): Promise<Entity> {
    const created = await this.entities.createEntity(entity);

    // Generate embedding asynchronously unless skipped
    if (!options?.skipEmbedding) {
      this.embeddings.generateAndStore(created).catch(err =>
        console.warn('Failed to generate embedding:', err)
      );
    }

    return created;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    const updated = await this.entities.updateEntity(id, updates);

    // Update embedding if content changed
    if (('content' in updates && updates.content) || ('name' in updates && updates.name) || ('description' in updates && updates.description)) {
      this.embeddings.updateEmbedding(id).catch(err =>
        console.warn('Failed to update embedding:', err)
      );
    }

    return updated;
  }

  async createOrUpdateEntity(entity: Entity, options?: { skipEmbedding?: boolean }): Promise<Entity> {
    // Check if entity exists
    const existing = await this.entities.getEntity(entity.id);

    if (existing) {
      // Update existing entity
      return this.updateEntity(entity.id, entity);
    } else {
      // Create new entity
      return this.createEntity(entity, options);
    }
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entities.getEntity(id);
  }

  async deleteEntity(id: string): Promise<void> {
    await this.embeddings.deleteEmbedding(id);
    await this.entities.deleteEntity(id);
  }

  async listEntities(options?: any): Promise<{ entities?: Entity[]; items: Entity[]; total: number }> {
    const result = await this.entities.listEntities(options);
    return {
      items: result.items,
      entities: result.items, // For backward compatibility
      total: result.total,
    };
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    const result = await this.entities.createEntitiesBulk(entities, options);

    // Generate embeddings in background
    this.embeddings.batchEmbed(entities).catch(err =>
      console.warn('Failed to generate bulk embeddings:', err)
    );

    return result;
  }

  // ========== Relationship Operations ==========

  async createRelationship(relationship: GraphRelationship): Promise<GraphRelationship> {
    return this.relationships.createRelationship(relationship);
  }

  async createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any> {
    return this.relationships.createRelationshipsBulk(relationships, options);
  }

  async getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    return this.relationships.getRelationships(query);
  }

  async queryRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    // Alias for getRelationships for backwards compatibility
    return this.getRelationships(query);
  }

  async deleteRelationship(fromId: string, toId: string, type: any): Promise<void> {
    return this.relationships.deleteRelationship(fromId, toId, type);
  }

  // ========== Search Operations ==========

  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.searchService.search(request);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    const results = await this.searchService.search(request);
    return results.map(r => r.entity);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.searchService.findSymbolsByName(name, options);
  }

  async findNearbySymbols(filePath: string, position: any, options?: any): Promise<Entity[]> {
    return this.searchService.findNearbySymbols(filePath, position, options);
  }


  // ========== Analysis Operations ==========

  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.analysis.analyzeImpact(request);
  }

  async getEntityDependencies(entityId: string, options?: any): Promise<DependencyAnalysis> {
    return this.analysis.getEntityDependencies(entityId, options);
  }

  async findPaths(query: PathQuery): Promise<any> {
    return this.analysis.findPaths(query);
  }

  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.analysis.computeAndStoreEdgeStats(entityId);
  }

  // ========== History Operations ==========

  async appendVersion(entity: Entity, options?: any): Promise<string> {
    return this.history.appendVersion(entity, options);
  }

  async createCheckpoint(seedEntities: string[], options: any): Promise<any> {
    return this.history.createCheckpoint(seedEntities, options);
  }

  async pruneHistory(retentionDays: number, options?: any): Promise<any> {
    return this.history.pruneHistory(retentionDays, options);
  }

  async listCheckpoints(options?: any): Promise<any> {
    return this.history.listCheckpoints(options);
  }

  async getHistoryMetrics(): Promise<any> {
    return this.history.getHistoryMetrics();
  }

  async timeTravelTraversal(query: any): Promise<any> {
    return this.history.timeTravelTraversal(query);
  }

  async exportCheckpoint(checkpointId: string): Promise<any> {
    return this.history.exportCheckpoint(checkpointId);
  }

  async importCheckpoint(checkpointData: any): Promise<any> {
    return this.history.importCheckpoint(checkpointData);
  }

  async getCheckpoint(checkpointId: string): Promise<any> {
    return this.history.getCheckpoint(checkpointId);
  }

  async getCheckpointMembers(checkpointId: string): Promise<any> {
    return this.history.getCheckpointMembers(checkpointId);
  }

  async getCheckpointSummary(checkpointId: string): Promise<any> {
    return this.history.getCheckpointSummary(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    return this.history.deleteCheckpoint(checkpointId);
  }

  async getEntityTimeline(entityId: string, options?: any): Promise<any> {
    return this.history.getEntityTimeline(entityId, options);
  }

  async getRelationshipTimeline(relationshipId: string, options?: any): Promise<any> {
    return this.history.getRelationshipTimeline(relationshipId, options);
  }

  async getSessionTimeline(sessionId: string, options?: any): Promise<any> {
    return this.history.getSessionTimeline(sessionId, options);
  }

  async getSessionImpacts(sessionId: string): Promise<any> {
    return this.history.getSessionImpacts(sessionId);
  }

  async getSessionsAffectingEntity(entityId: string, options?: any): Promise<any> {
    return this.history.getSessionsAffectingEntity(entityId, options);
  }

  async getChangesForSession(sessionId: string, options?: any): Promise<any> {
    return this.history.getChangesForSession(sessionId, options);
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
    this.searchService.clearCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    this.searchService.invalidateCache(pattern);
  }

  async ensureIndices(): Promise<void> {
    await this.neo4j.createCommonIndexes();
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.relationships.mergeNormalizedDuplicates();
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.relationships.markInactiveEdgesNotSeenSince(since);
  }

  async getIndexHealth(): Promise<any> {
    return this.neo4j.getIndexHealth();
  }

  async ensureGraphIndexes(): Promise<void> {
    await this.neo4j.ensureGraphIndexes();
  }

  async runBenchmarks(options?: any): Promise<any> {
    return this.neo4j.runBenchmarks(options);
  }


  // ========== Cleanup ==========

  async close(): Promise<void> {
    await this.neo4j.close();
    if (typeof this.neogma.close === 'function') {
      await this.neogma.close();
    }
    this.emit('service:closed');
  }

  // ========== Additional Utility Methods ==========

  async initialize(): Promise<void> {
    await this.initializeDatabase();
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.entities.getEntitiesByFile(filePath);
  }

  async getEntityExamples(entityId: string): Promise<any> {
    return this.searchService.getEntityExamples(entityId);
  }

  async upsertEdgeEvidenceBulk(updates: any[]): Promise<void> {
    return this.relationships.upsertEdgeEvidenceBulk(updates);
  }

  async openEdge(fromId: string, toId: string, type: any, ts?: Date, changeSetId?: string): Promise<void> {
    return this.history.openEdge(fromId, toId, type, ts, changeSetId);
  }

  async closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void> {
    return this.history.closeEdge(fromId, toId, type, ts);
  }

  // ========== Session Management Methods ==========

  async annotateSessionRelationshipsWithCheckpoint(
    sessionId: string,
    checkpointId: string,
    relationshipIds?: string[],
    timestamp?: Date
  ): Promise<void> {
    // This is a compatibility method for session checkpoint management
    // It links relationships created in a session to a specific checkpoint
    const at = timestamp || new Date();

    let query: string;
    let params: any;

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
    } else {
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

  async createSessionCheckpointLink(
    sessionId: string,
    checkpointId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
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

  async findRecentEntityIds(limit?: number): Promise<string[]> {
    const result = await this.entities.listEntities({
      limit: limit || 100,
      orderBy: 'lastModified',
      orderDirection: 'DESC',
    });
    return result.items.map(e => e.id);
  }

  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    return this.entities.getEntitiesByType(entityType);
  }

  async listRelationships(query: RelationshipQuery): Promise<{ relationships: GraphRelationship[]; total: number }> {
    const relationships = await this.relationships.getRelationships(query);
    return {
      relationships,
      total: relationships.length,
    };
  }

  async listModuleChildren(moduleId: string, options?: any): Promise<{ children: Entity[]; modulePath?: string }> {
    // Stub implementation - delegate to relationships or implement later
    const relationships = await this.relationships.getRelationships({
      fromEntityId: moduleId,
      type: RelationshipType.CONTAINS,
    });
    const childIds = relationships.map(r => (r as any).toEntityId || (r as any).to?.id);
    const children = await Promise.all(
      childIds.map(id => this.entities.getEntity(id))
    );
    return {
      children: children.filter((e): e is Entity => e !== null),
      modulePath: moduleId,
    };
  }

  async listImports(fileId: string, options?: any): Promise<{ imports: Entity[]; entityId?: string }> {
    // Stub implementation - delegate to relationships or implement later
    const relationships = await this.relationships.getRelationships({
      fromEntityId: fileId,
      type: RelationshipType.IMPORTS,
    });
    const importIds = relationships.map(r => (r as any).toEntityId || (r as any).to?.id);
    const imports = await Promise.all(
      importIds.map(id => this.entities.getEntity(id))
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
      const toId = (relationships[0] as any).toEntityId || (relationships[0] as any).to?.id;
      return toId ? this.entities.getEntity(toId) : null;
    }
    return null;
  }

  // ========== Missing Relationship Delegation Methods ==========

  async getRelationshipById(relationshipId: string): Promise<GraphRelationship | null> {
    return this.relationships.getRelationshipById(relationshipId);
  }

  async getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationships.getEdgeEvidenceNodes(relationshipId, limit);
  }

  async getEdgeSites(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationships.getEdgeSites(relationshipId, limit);
  }

  async getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationships.getEdgeCandidates(relationshipId, limit);
  }

  // ========== History Repair Methods ==========

  async repairPreviousVersionLink(versionId: string): Promise<void> {
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
