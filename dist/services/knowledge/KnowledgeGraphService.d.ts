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
import { Entity } from '../../models/entities.js';
import { GraphRelationship, RelationshipQuery, PathQuery } from '../../models/relationships.js';
import { GraphSearchRequest, ImpactAnalysisRequest, ImpactAnalysis, DependencyAnalysis } from '../../models/types.js';
export declare class KnowledgeGraphService extends EventEmitter {
    private neo4j;
    private neogma;
    private entities;
    private relationships;
    private embeddings;
    private searchService;
    private history;
    private analysis;
    constructor(config?: Neo4jConfig, overrides?: KnowledgeGraphDependencies);
    /**
     * Initialize database with necessary indexes and constraints
     */
    private initializeDatabase;
    /**
     * Setup event forwarding from sub-services
     */
    private setupEventForwarding;
    createEntity(entity: Entity, options?: {
        skipEmbedding?: boolean;
    }): Promise<Entity>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    createOrUpdateEntity(entity: Entity, options?: {
        skipEmbedding?: boolean;
    }): Promise<Entity>;
    getEntity(id: string): Promise<Entity | null>;
    deleteEntity(id: string): Promise<void>;
    listEntities(options?: any): Promise<{
        entities?: Entity[];
        items: Entity[];
        total: number;
    }>;
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    queryRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
    searchEntities(request: GraphSearchRequest): Promise<any[]>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
    semanticSearch(query: string, options?: any): Promise<any[]>;
    structuralSearch(query: string, options?: any): Promise<any[]>;
    findSymbolsByName(name: string, options?: any): Promise<Entity[]>;
    findNearbySymbols(filePath: string, position: any, options?: any): Promise<Entity[]>;
    analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
    getEntityDependencies(entityId: string, options?: any): Promise<DependencyAnalysis>;
    findPaths(query: PathQuery): Promise<any>;
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
    appendVersion(entity: Entity, options?: any): Promise<string>;
    createCheckpoint(seedEntities: string[], options: any): Promise<any>;
    pruneHistory(retentionDays: number, options?: any): Promise<any>;
    listCheckpoints(options?: any): Promise<any>;
    getHistoryMetrics(): Promise<any>;
    timeTravelTraversal(query: any): Promise<any>;
    exportCheckpoint(checkpointId: string): Promise<any>;
    importCheckpoint(checkpointData: any): Promise<any>;
    getCheckpoint(checkpointId: string): Promise<any>;
    getCheckpointMembers(checkpointId: string): Promise<any>;
    getCheckpointSummary(checkpointId: string): Promise<any>;
    deleteCheckpoint(checkpointId: string): Promise<void>;
    getEntityTimeline(entityId: string, options?: any): Promise<any>;
    getRelationshipTimeline(relationshipId: string, options?: any): Promise<any>;
    getSessionTimeline(sessionId: string, options?: any): Promise<any>;
    getSessionImpacts(sessionId: string): Promise<any>;
    getSessionsAffectingEntity(entityId: string, options?: any): Promise<any>;
    getChangesForSession(sessionId: string, options?: any): Promise<any>;
    createEmbedding(entity: Entity): Promise<any>;
    updateEmbedding(entityId: string, content?: string): Promise<void>;
    deleteEmbedding(entityId: string): Promise<void>;
    createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
    findSimilar(entityId: string, options?: any): Promise<any[]>;
    getStats(): Promise<any>;
    clearSearchCache(): Promise<void>;
    invalidateSearchCache(pattern?: any): Promise<void>;
    ensureIndices(): Promise<void>;
    mergeNormalizedDuplicates(): Promise<number>;
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    getIndexHealth(): Promise<any>;
    ensureGraphIndexes(): Promise<void>;
    runBenchmarks(options?: any): Promise<any>;
    close(): Promise<void>;
    initialize(): Promise<void>;
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    getEntityExamples(entityId: string): Promise<any>;
    upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
    openEdge(fromId: string, toId: string, type: any, ts?: Date, changeSetId?: string): Promise<void>;
    closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
    annotateSessionRelationshipsWithCheckpoint(sessionId: string, checkpointId: string, relationshipIds?: string[], timestamp?: Date): Promise<void>;
    createSessionCheckpointLink(sessionId: string, checkpointId: string, metadata?: Record<string, any>): Promise<void>;
    findRecentEntityIds(limit?: number): Promise<string[]>;
    findEntitiesByType(entityType: string): Promise<Entity[]>;
    listRelationships(query: RelationshipQuery): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
    listModuleChildren(moduleId: string, options?: any): Promise<{
        children: Entity[];
        modulePath?: string;
    }>;
    listImports(fileId: string, options?: any): Promise<{
        imports: Entity[];
        entityId?: string;
    }>;
    findDefinition(symbolId: string): Promise<Entity | null>;
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
    repairPreviousVersionLink(versionId: string): Promise<void>;
}
export {};
//# sourceMappingURL=KnowledgeGraphService.d.ts.map