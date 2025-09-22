/**
 * Entity Service
 * Handles entity lifecycle and CRUD operations
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '../../models/entities.js';
export interface ListEntitiesOptions {
    type?: string;
    path?: string;
    name?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export interface BulkCreateOptions {
    skipExisting?: boolean;
    updateExisting?: boolean;
}
export declare class EntityService extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Create or update a single entity
     */
    createEntity(entity: Entity): Promise<Entity>;
    /**
     * Update an existing entity
     */
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    /**
     * Get a single entity by ID
     */
    getEntity(id: string): Promise<Entity | null>;
    /**
     * Delete an entity and its relationships
     */
    deleteEntity(id: string): Promise<void>;
    /**
     * List entities with filtering and pagination
     */
    listEntities(options?: ListEntitiesOptions): Promise<{
        items: Entity[];
        total: number;
    }>;
    /**
     * Create multiple entities in bulk
     */
    createEntitiesBulk(entities: Entity[], options?: BulkCreateOptions): Promise<{
        created: number;
        updated: number;
        failed: number;
    }>;
    /**
     * Get entities by file path
     */
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    /**
     * Get entities by type
     */
    getEntitiesByType(type: string, limit?: number): Promise<Entity[]>;
    /**
     * Check if an entity exists
     */
    entityExists(id: string): Promise<boolean>;
    /**
     * Update entity metadata
     */
    updateEntityMetadata(id: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Get entity statistics
     */
    getEntityStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        recentlyModified: number;
    }>;
    /**
     * Normalize an entity for storage
     */
    private normalizeEntity;
    /**
     * Get Neo4j labels for an entity based on its type
     */
    private getEntityLabels;
    /**
     * Check if entity has codebase properties
     */
    private hasCodebaseProperties;
    /**
     * Extract properties for Neo4j storage
     */
    private extractProperties;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntityFromNeo4j;
}
//# sourceMappingURL=EntityService.d.ts.map