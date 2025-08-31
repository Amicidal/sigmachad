/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { DatabaseService } from './DatabaseService.js';
import { Entity } from '../models/entities.js';
import { GraphRelationship, RelationshipQuery, PathQuery, TraversalQuery } from '../models/relationships.js';
import { GraphSearchRequest, GraphExamples, DependencyAnalysis } from '../models/types.js';
export declare class KnowledgeGraphService {
    private db;
    constructor(db: DatabaseService);
    initialize(): Promise<void>;
    private hasCodebaseProperties;
    createEntity(entity: Entity): Promise<void>;
    getEntity(entityId: string): Promise<Entity | null>;
    updateEntity(entityId: string, updates: Partial<Entity>): Promise<void>;
    deleteEntity(entityId: string): Promise<void>;
    createRelationship(relationship: GraphRelationship): Promise<void>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
    private semanticSearch;
    private structuralSearch;
    getEntityExamples(entityId: string): Promise<GraphExamples>;
    getEntityDependencies(entityId: string): Promise<DependencyAnalysis>;
    findPaths(query: PathQuery): Promise<any[]>;
    traverseGraph(query: TraversalQuery): Promise<Entity[]>;
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
}
//# sourceMappingURL=KnowledgeGraphService.d.ts.map