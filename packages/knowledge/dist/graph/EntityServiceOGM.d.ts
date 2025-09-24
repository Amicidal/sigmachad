/**
 * Entity Service OGM Implementation
 * Migrated version using Neogma OGM instead of custom Cypher queries
 */
import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
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
export declare class EntityServiceOGM extends EventEmitter {
    private neogmaService;
    private models;
    private batchHelper;
    constructor(neogmaService: NeogmaService);
    /**
     * Get the appropriate model based on entity type
     */
    private getModelForEntity;
    /**
     * Create or update a single entity using Neogma
     */
    createEntity(entity: Entity): Promise<Entity>;
    /**
     * Update an existing entity using Neogma
     */
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    /**
     * Get a single entity by ID using Neogma
     */
    getEntity(id: string): Promise<Entity | null>;
    /**
     * Delete an entity and its relationships using Neogma
     */
    deleteEntity(id: string): Promise<void>;
    /**
     * List entities with filtering and pagination using Neogma
     */
    listEntities(options?: ListEntitiesOptions): Promise<{
        items: Entity[];
        total: number;
    }>;
    /**
     * List entities with custom query for complex filters
     * Fallback for operations not supported by Neogma's query builder
     */
    private listEntitiesWithCustomQuery;
    /**
     * Bulk create entities using Neogma
     */
    createEntitiesBulk(entities: Entity[], options?: BulkCreateOptions): Promise<{
        created: number;
        updated: number;
        failed: number;
    }>;
    /**
     * Find entities by properties using Neogma
     */
    findEntitiesByProperties(properties: Partial<Entity>): Promise<Entity[]>;
    /**
     * Group entities by their model type for batch operations
     */
    private groupEntitiesByType;
    /**
     * Get entities by file path (for API compatibility)
     */
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    /**
     * Get entities by type (for API compatibility)
     */
    getEntitiesByType(type: string, limit?: number): Promise<Entity[]>;
    /**
     * Check if an entity exists (for API compatibility)
     */
    entityExists(id: string): Promise<boolean>;
    /**
     * Update entity metadata (for API compatibility)
     */
    updateEntityMetadata(id: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Get entity statistics using Neogma
     */
    getEntityStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        recentlyModified: number;
    }>;
    /**
     * Parse entity from Neo4j result (fallback for custom queries)
     */
    private parseEntityFromNeo4j;
}
//# sourceMappingURL=EntityServiceOGM.d.ts.map