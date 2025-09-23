/**
 * EntityManager - Handles all entity CRUD operations and embedding triggers
 * Moved from KnowledgeGraphService.ts during refactoring
 */
import { Entity } from "../../../../models/entities.js";
interface EntityService {
    createEntity(entity: Entity): Promise<Entity>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    getEntity(id: string): Promise<Entity | null>;
    deleteEntity(id: string): Promise<void>;
    listEntities(options?: any): Promise<{
        entities?: Entity[];
        items: Entity[];
        total: number;
    }>;
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    getEntitiesByType(entityType: string): Promise<Entity[]>;
}
interface EmbeddingService {
    generateAndStore(entity: Entity): Promise<any>;
    updateEmbedding(entityId: string, content?: string): Promise<void>;
    deleteEmbedding(entityId: string): Promise<void>;
    batchEmbed(entities: Entity[], options?: any): Promise<any>;
}
export declare class EntityManager {
    private entityService;
    private embeddingService;
    constructor(entityService: EntityService, embeddingService: EmbeddingService);
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
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    findRecentEntityIds(limit?: number): Promise<string[]>;
    findEntitiesByType(entityType: string): Promise<Entity[]>;
}
export {};
//# sourceMappingURL=EntityManager.d.ts.map