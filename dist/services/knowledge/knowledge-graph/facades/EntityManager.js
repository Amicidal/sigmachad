/**
 * EntityManager - Handles all entity CRUD operations and embedding triggers
 * Moved from KnowledgeGraphService.ts during refactoring
 */
export class EntityManager {
    constructor(entityService, embeddingService) {
        this.entityService = entityService;
        this.embeddingService = embeddingService;
    }
    async createEntity(entity, options) {
        const created = await this.entityService.createEntity(entity);
        // Generate embedding asynchronously unless skipped
        if (!(options === null || options === void 0 ? void 0 : options.skipEmbedding)) {
            this.embeddingService
                .generateAndStore(created)
                .catch((err) => console.warn("Failed to generate embedding:", err));
        }
        return created;
    }
    async updateEntity(id, updates) {
        const updated = await this.entityService.updateEntity(id, updates);
        // Update embedding if content changed
        if (("content" in updates && updates.content) ||
            ("name" in updates && updates.name) ||
            ("description" in updates && updates.description)) {
            this.embeddingService
                .updateEmbedding(id)
                .catch((err) => console.warn("Failed to update embedding:", err));
        }
        return updated;
    }
    async createOrUpdateEntity(entity, options) {
        // Check if entity exists
        const existing = await this.entityService.getEntity(entity.id);
        if (existing) {
            // Update existing entity
            return this.updateEntity(entity.id, entity);
        }
        else {
            // Create new entity
            return this.createEntity(entity, options);
        }
    }
    async getEntity(id) {
        return this.entityService.getEntity(id);
    }
    async deleteEntity(id) {
        await this.embeddingService.deleteEmbedding(id);
        await this.entityService.deleteEntity(id);
    }
    async listEntities(options) {
        const result = await this.entityService.listEntities(options);
        return {
            items: result.items,
            entities: result.items, // For backward compatibility
            total: result.total,
        };
    }
    async createEntitiesBulk(entities, options) {
        const result = await this.entityService.createEntitiesBulk(entities, options);
        // Generate embeddings in background
        this.embeddingService
            .batchEmbed(entities)
            .catch((err) => console.warn("Failed to generate bulk embeddings:", err));
        return result;
    }
    async getEntitiesByFile(filePath) {
        return this.entityService.getEntitiesByFile(filePath);
    }
    async findRecentEntityIds(limit) {
        const result = await this.entityService.listEntities({
            limit: limit || 100,
            orderBy: "lastModified",
            orderDirection: "DESC",
        });
        return result.items.map((e) => e.id);
    }
    async findEntitiesByType(entityType) {
        return this.entityService.getEntitiesByType(entityType);
    }
}
//# sourceMappingURL=EntityManager.js.map