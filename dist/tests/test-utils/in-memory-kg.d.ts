/**
 * In-memory Knowledge Graph mock for tests
 * Provides deterministic, side-effect-free behavior for CRUD and listing.
 */
import { EventEmitter } from 'events';
import type { Entity } from '../../src/models/entities';
import type { GraphRelationship } from '../../src/models/relationships';
type ListEntitiesOpts = {
    type?: string;
    language?: string;
    path?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
};
type ListRelationshipsOpts = {
    fromEntity?: string;
    toEntity?: string;
    type?: string;
    limit?: number;
    offset?: number;
};
export declare class InMemoryKnowledgeGraphMock extends EventEmitter {
    private entities;
    private relationships;
    constructor();
    initialize(): Promise<void>;
    clear(): void;
    createEntity(entity: Entity): Promise<void>;
    getEntity(id: string): Promise<Entity | null>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<void>;
    deleteEntity(id: string): Promise<void>;
    listEntities(opts?: ListEntitiesOpts): Promise<{
        entities: Entity[];
        total: number;
    }>;
    createRelationship(relationship: GraphRelationship): Promise<void>;
    deleteRelationship(relationshipId: string): Promise<void>;
    listRelationships(opts?: ListRelationshipsOpts): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
}
export {};
//# sourceMappingURL=in-memory-kg.d.ts.map