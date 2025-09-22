/**
 * Knowledge Graph Service
 * Facade that orchestrates all specialized graph services
 */
import { EventEmitter } from 'events';
import { Neo4jConfig } from './Neo4jService.js';
import { SearchService } from './SearchService.js';
import { Entity } from '../../models/entities.js';
import { GraphRelationship, RelationshipQuery, PathQuery } from '../../models/relationships.js';
import { GraphSearchRequest, ImpactAnalysisRequest, ImpactAnalysis, DependencyAnalysis } from '../../models/types.js';
export declare class KnowledgeGraphService extends EventEmitter {
    private neo4j;
    private neogma;
    private entities;
    private relationships;
    private embeddings;
    search: SearchService;
    private history;
    private analysis;
    private featureFlags;
    private tracker;
    constructor(config?: Neo4jConfig);
    /**
     * Initialize entity service with OGM support
     */
    private initializeEntityService;
    /**
     * Initialize database with necessary indexes and constraints
     */
    private initializeDatabase;
    /**
     * Log current migration status
     */
    private logMigrationStatus;
    /**
     * Setup event forwarding from sub-services
     */
    private setupEventForwarding;
    createEntity(entity: Entity, options?: {
        skipEmbedding?: boolean;
    }): Promise<Entity>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
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
    deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
    searchEntities(request: GraphSearchRequest): Promise<any[]>;
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
    /**
     * Get current migration status across all services
     */
    getMigrationStatus(): {
        featureFlags: any;
        migrationMetrics: any;
        services: {
            entity: any;
        };
    };
    /**
     * Get migration health summary
     */
    getMigrationHealth(): any;
    /**
     * Force switch to legacy implementation (for debugging)
     */
    forceLegacyMode(): void;
    /**
     * Force switch to OGM implementation (for debugging)
     */
    forceOGMMode(): void;
    /**
     * Reset migration metrics (for testing)
     */
    resetMigrationMetrics(): void;
    close(): Promise<void>;
    initialize(): Promise<void>;
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    getEntityExamples(entityId: string): Promise<any>;
    upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
    openEdge(fromId: string, toId: string, type: any, ts?: Date, changeSetId?: string): Promise<void>;
    closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
    findRecentEntityIds(limit?: number): Promise<string[]>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
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
}
//# sourceMappingURL=KnowledgeGraphService.d.ts.map