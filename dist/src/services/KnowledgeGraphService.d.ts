/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { DatabaseService } from "./DatabaseService.js";
import { Entity } from "../models/entities.js";
import { GraphRelationship, RelationshipType, RelationshipQuery, PathQuery, TraversalQuery } from "../models/relationships.js";
import { GraphSearchRequest, GraphExamples, DependencyAnalysis } from "../models/types.js";
import { EventEmitter } from "events";
export declare class KnowledgeGraphService extends EventEmitter {
    private db;
    private searchCache;
    private entityCache;
    constructor(db: DatabaseService);
    initialize(): Promise<void>;
    private hasCodebaseProperties;
    createEntity(entity: Entity): Promise<void>;
    getEntity(entityId: string): Promise<Entity | null>;
    updateEntity(entityId: string, updates: Partial<Entity>): Promise<void>;
    createOrUpdateEntity(entity: Entity): Promise<void>;
    deleteEntity(entityId: string): Promise<void>;
    deleteRelationship(relationshipId: string): Promise<void>;
    createRelationship(relationship: GraphRelationship | string, toEntityId?: string, type?: RelationshipType): Promise<void>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    queryRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
    /**
     * Clear search cache
     */
    private clearSearchCache;
    /**
     * Invalidate cache entries related to an entity
     */
    private invalidateEntityCache;
    /**
     * Find entities by type
     */
    findEntitiesByType(entityType: string): Promise<Entity[]>;
    private semanticSearch;
    private structuralSearch;
    getEntityExamples(entityId: string): Promise<GraphExamples | null>;
    getEntityDependencies(entityId: string): Promise<DependencyAnalysis | null>;
    findPaths(query: PathQuery): Promise<any[]>;
    traverseGraph(query: TraversalQuery): Promise<Entity[]>;
    createEmbeddingsBatch(entities: Entity[]): Promise<void>;
    private createEmbedding;
    private updateEmbedding;
    private deleteEmbedding;
    private generateEmbedding;
    private getEntityLabels;
    private sanitizeProperties;
    private parseEntityFromGraph;
    private parseRelationshipFromGraph;
    private getEntityContentForEmbedding;
    private getEmbeddingCollection;
    private getEntitySignature;
    listEntities(options?: {
        type?: string;
        language?: string;
        path?: string;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        entities: Entity[];
        total: number;
    }>;
    listRelationships(options?: {
        fromEntity?: string;
        toEntity?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
    private stringToNumericId;
    private sanitizeParameterName;
}
//# sourceMappingURL=KnowledgeGraphService.d.ts.map