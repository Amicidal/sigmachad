/**
 * Realistic KnowledgeGraph mock for route tests
 * Implements subset of KnowledgeGraphService with deterministic, in-memory behavior
 */
import { EventEmitter } from 'events';
import type { Entity } from '../../src/models/entities';
import type { GraphRelationship, RelationshipQuery } from '../../src/models/relationships';
type GraphSearchRequest = {
    query: string;
    entityTypes?: Array<'function' | 'class' | 'interface' | 'file' | 'module'>;
    searchType?: 'semantic' | 'structural' | 'usage' | 'dependency';
    filters?: {
        language?: string;
        path?: string;
        tags?: string[];
        lastModified?: {
            since?: Date;
            until?: Date;
        };
    };
    includeRelated?: boolean;
    limit?: number;
};
export declare class RealisticKnowledgeGraphMock extends EventEmitter {
    private entities;
    private relationships;
    constructor();
    clear(): void;
    createEntity(entity: Entity): Promise<void>;
    getEntity(id: string): Promise<Entity | null>;
    createRelationship(rel: GraphRelationship): Promise<void>;
    search(req: GraphSearchRequest): Promise<Entity[]>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    listEntities(opts: {
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
    listRelationships(opts: {
        fromEntity?: string;
        toEntity?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
    getEntityExamples(entityId: string): Promise<{
        entityId: string;
        signature: string;
        usageExamples: Array<{
            context: string;
            code: string;
            file: string;
            line: number;
        }>;
        testExamples: Array<{
            testId: string;
            testName: string;
            testCode: string;
            assertions: string[];
        }>;
        relatedPatterns: Array<{
            pattern: string;
            frequency: number;
            confidence: number;
        }>;
    }>;
    getEntityDependencies(entityId: string): Promise<{
        entityId: string;
        directDependencies: Array<{
            entity: any;
            relationship: string;
            strength: number;
        }>;
        indirectDependencies: Array<{
            entity: any;
            path: any[];
            relationship: string;
            distance: number;
        }>;
        reverseDependencies: Array<{
            entity: any;
            relationship: string;
            impact: 'high' | 'medium' | 'low';
        }>;
        circularDependencies: Array<{
            cycle: any[];
            severity: 'critical' | 'warning' | 'info';
        }>;
    }>;
}
export {};
//# sourceMappingURL=realistic-kg.d.ts.map