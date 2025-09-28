/**
 * EntityManager - Handles all entity CRUD operations and embedding triggers
 * Moved from KnowledgeGraphService.ts during refactoring
 */

import { Entity } from '@memento/core';

interface EntityService {
  createEntity(entity: Entity): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  getEntity(id: string): Promise<Entity | null>;
  deleteEntity(id: string): Promise<void>;
  listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }>;
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

export class EntityManager {
  private entityService: EntityService;
  private embeddingService: EmbeddingService;

  constructor(
    entityService: EntityService,
    embeddingService: EmbeddingService
  ) {
    this.entityService = entityService;
    this.embeddingService = embeddingService;
  }

  async createEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    const created = await this.entityService.createEntity(entity);

    // Generate embedding asynchronously unless skipped
    if (!options?.skipEmbedding) {
      this.embeddingService
        .generateAndStore(created)
        .catch((err) => console.warn('Failed to generate embedding:', err));
    }

    return created;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    const updated = await this.entityService.updateEntity(id, updates);

    // Update embedding if content changed
    if (
      ('content' in updates && updates.content) ||
      ('name' in updates && updates.name) ||
      ('description' in updates && updates.description)
    ) {
      this.embeddingService
        .updateEmbedding(id)
        .catch((err) => console.warn('Failed to update embedding:', err));
    }

    return updated;
  }

  async createOrUpdateEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    // Check if entity exists
    const existing = await this.entityService.getEntity(entity.id);

    if (existing) {
      // Update existing entity
      return this.updateEntity(entity.id, entity);
    } else {
      // Create new entity
      return this.createEntity(entity, options);
    }
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entityService.getEntity(id);
  }

  async deleteEntity(id: string): Promise<void> {
    await this.embeddingService.deleteEmbedding(id);
    await this.entityService.deleteEntity(id);
  }

  async listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }> {
    const result = await this.entityService.listEntities(options);
    return {
      items: result.items,
      entities: result.items, // For backward compatibility
      total: result.total,
    };
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    const result = await this.entityService.createEntitiesBulk(
      entities,
      options
    );

    // Generate embeddings in background
    this.embeddingService
      .batchEmbed(entities)
      .catch((err) => console.warn('Failed to generate bulk embeddings:', err));

    return result;
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.entityService.getEntitiesByFile(filePath);
  }

  async findRecentEntityIds(limit?: number): Promise<string[]> {
    const result = await this.entityService.listEntities({
      limit: limit || 100,
      orderBy: 'lastModified',
      orderDirection: 'DESC',
    });
    return result.items.map((e) => e.id);
  }

  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    return this.entityService.getEntitiesByType(entityType);
  }
}
