/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 */

import { EventEmitter } from 'events';
import { Neo4jService, Neo4jConfig } from './Neo4jService.js';
import { EntityService } from './EntityService.js';
import { RelationshipService } from './RelationshipService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { SearchService } from './SearchService.js';
import { HistoryService } from './HistoryService.js';
import { AnalysisService } from './AnalysisService.js';

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
  private entities: EntityService;
  private relationships: RelationshipService;
  private embeddings: EmbeddingService;
  public search: SearchService;
  private history: HistoryService;
  private analysis: AnalysisService;

  constructor(config?: Neo4jConfig) {
    super();

    const neo4jConfig: Neo4jConfig = config || {
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
    this.initializeDatabase().catch(err =>
      console.error('Failed to initialize database:', err)
    );
  }

  /**
   * Initialize database with necessary indexes and constraints
   */
  private async initializeDatabase(): Promise<void> {
    await this.neo4j.createCommonIndexes();
    await this.embeddings.initializeVectorIndex();
    this.emit('database:initialized');
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

    // Forward relationship events
    this.relationships.on('relationship:created', (data) => {
      this.emit('relationship:created', data);
    });
    this.relationships.on('relationship:deleted', (data) => {
      this.emit('relationship:deleted', data);
    });

    // Forward search events
    this.search.on('search:completed', (data) =>
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
    if (updates.content || updates.name || updates.description) {
      this.embeddings.updateEmbedding(id).catch(err =>
        console.warn('Failed to update embedding:', err)
      );
    }

    return updated;
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

  async deleteRelationship(fromId: string, toId: string, type: any): Promise<void> {
    return this.relationships.deleteRelationship(fromId, toId, type);
  }

  // ========== Search Operations ==========

  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.search.search(request);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.search.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.search.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.search.findSymbolsByName(name, options);
  }

  async findNearbySymbols(filePath: string, position: any, options?: any): Promise<Entity[]> {
    return this.search.findNearbySymbols(filePath, position, options);
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
    this.search.clearCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    this.search.invalidateCache(pattern);
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

  // ========== Cleanup ==========

  async close(): Promise<void> {
    await this.neo4j.close();
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
    return this.search.getEntityExamples(entityId);
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

  // ========== Compatibility Methods for API ==========

  async findRecentEntityIds(limit?: number): Promise<string[]> {
    const result = await this.entities.listEntities({
      limit: limit || 100,
      orderBy: 'lastModified',
      orderDirection: 'DESC',
    });
    return result.items.map(e => e.id);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    const results = await this.search.search(request);
    return results.map(r => r.entity);
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
      fromId: moduleId,
      type: 'contains',
    });
    const childIds = relationships.map(r => r.toId);
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
      fromId: fileId,
      type: 'imports',
    });
    const importIds = relationships.map(r => r.toId);
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
      fromId: symbolId,
      type: 'defines',
    });
    if (relationships.length > 0) {
      return this.entities.getEntity(relationships[0].toId);
    }
    return null;
  }
}