/**
 * Entity Service OGM Implementation
 * Migrated version using Neogma OGM instead of custom Cypher queries
 */
import { EventEmitter } from 'events';
import { createEntityModels } from '../../../models/ogm/EntityModels.js';
import { modelToEntity, entityToModelProps, BatchOperationHelper, } from '../../../models/ogm/BaseModels.js';
export class EntityServiceOGM extends EventEmitter {
    constructor(neogmaService) {
        super();
        this.neogmaService = neogmaService;
        const neogma = this.neogmaService.getNeogmaInstance();
        this.models = createEntityModels(neogma);
        this.batchHelper = new BatchOperationHelper(100);
        // Forward NeogmaService events
        this.neogmaService.on('error', (data) => {
            this.emit('error', { source: 'neogma', ...data });
        });
    }
    /**
     * Get the appropriate model based on entity type
     */
    getModelForEntity(entity) {
        if ('extension' in entity && entity.type === 'file') {
            return this.models.FileModel;
        }
        if ('children' in entity && entity.type === 'directory') {
            return this.models.DirectoryModel;
        }
        if ('packageJson' in entity && entity.type === 'module') {
            return this.models.ModuleModel;
        }
        if ('kind' in entity) {
            const symbolEntity = entity;
            if (symbolEntity.kind === 'function') {
                return this.models.FunctionSymbolModel;
            }
            if (symbolEntity.kind === 'class') {
                return this.models.ClassSymbolModel;
            }
            if (symbolEntity.kind === 'interface') {
                return this.models.InterfaceSymbolModel;
            }
            return this.models.SymbolModel;
        }
        if ('testType' in entity) {
            return this.models.TestModel;
        }
        if ('priority' in entity && entity.type === 'spec') {
            return this.models.SpecificationModel;
        }
        if ('title' in entity && entity.type === 'documentation') {
            return this.models.DocumentationModel;
        }
        // Fallback to generic entity model
        return this.models.EntityModel;
    }
    /**
     * Create or update a single entity using Neogma
     */
    async createEntity(entity) {
        try {
            const Model = this.getModelForEntity(entity);
            const props = entityToModelProps(entity);
            // Try to find existing entity first, then create if not found
            let instance;
            try {
                const instances = await Model.findMany({ where: { id: entity.id }, limit: 1 });
                if (instances.length === 0) {
                    instance = await Model.createOne(props);
                }
                else {
                    instance = instances[0];
                }
            }
            catch (error) {
                // If find fails, try to create
                instance = await Model.createOne(props);
            }
            const created = modelToEntity(instance);
            this.emit('entity:created', created);
            return created;
        }
        catch (error) {
            this.emit('error', { operation: 'createEntity', entity, error });
            throw error;
        }
    }
    /**
     * Update an existing entity using Neogma
     */
    async updateEntity(id, updates) {
        try {
            // Find the entity first to determine its type
            const existing = await this.getEntity(id);
            if (!existing) {
                throw new Error(`Entity not found: ${id}`);
            }
            const Model = this.getModelForEntity(existing);
            const props = entityToModelProps({ ...existing, ...updates });
            delete props.id; // Don't update the ID
            // Update using Neogma
            const instances = await Model.update({ ...props, lastModified: new Date().toISOString() }, { where: { id } });
            const instance = Array.isArray(instances) ? instances[0] : instances;
            if (!instance) {
                throw new Error(`Failed to update entity: ${id}`);
            }
            const updated = modelToEntity(Array.isArray(instance) ? instance[0] : instance);
            this.emit('entity:updated', updated);
            return updated;
        }
        catch (error) {
            this.emit('error', { operation: 'updateEntity', id, updates, error });
            throw error;
        }
    }
    /**
     * Get a single entity by ID using Neogma
     */
    async getEntity(id) {
        try {
            // Try each model until we find the entity
            const models = Object.values(this.models);
            for (const Model of models) {
                const instances = await Model.findMany({
                    where: { id },
                    limit: 1,
                });
                if (instances && instances.length > 0) {
                    return modelToEntity(instances[0]);
                }
            }
            return null;
        }
        catch (error) {
            this.emit('error', { operation: 'getEntity', id, error });
            throw error;
        }
    }
    /**
     * Delete an entity and its relationships using Neogma
     */
    async deleteEntity(id) {
        try {
            const existing = await this.getEntity(id);
            if (!existing) {
                return; // Entity doesn't exist, nothing to delete
            }
            const Model = this.getModelForEntity(existing);
            // Delete with relationships (DETACH DELETE equivalent)
            await Model.delete({
                where: { id },
                detach: true, // This removes relationships too
            });
            this.emit('entity:deleted', { id });
        }
        catch (error) {
            this.emit('error', { operation: 'deleteEntity', id, error });
            throw error;
        }
    }
    /**
     * List entities with filtering and pagination using Neogma
     */
    async listEntities(options = {}) {
        try {
            const where = {};
            if (options.type) {
                where.type = options.type;
            }
            if (options.path) {
                where.path = options.path;
            }
            if (options.name) {
                // For contains, we'll need to use a custom query
                // Neogma doesn't have built-in CONTAINS operator
                return this.listEntitiesWithCustomQuery(options);
            }
            // Determine which model to use based on type
            let Model = this.models.EntityModel;
            if (options.type === 'file') {
                Model = this.models.FileModel;
            }
            else if (options.type === 'directory') {
                Model = this.models.DirectoryModel;
            }
            else if (options.type === 'module') {
                Model = this.models.ModuleModel;
            }
            // Get count for pagination
            const countResult = await Model.findMany({
                where,
            });
            const total = countResult.length;
            // Get paginated results
            const instances = await Model.findMany({
                where,
                limit: options.limit || 100,
                skip: options.offset || 0,
                order: options.orderBy
                    ? [[options.orderBy, options.orderDirection || 'ASC']]
                    : undefined,
            });
            const items = instances.map(instance => modelToEntity(instance));
            return { items, total };
        }
        catch (error) {
            this.emit('error', { operation: 'listEntities', options, error });
            throw error;
        }
    }
    /**
     * List entities with custom query for complex filters
     * Fallback for operations not supported by Neogma's query builder
     */
    async listEntitiesWithCustomQuery(options) {
        var _a;
        const where = ['n:Entity'];
        const params = {};
        if (options.type) {
            where.push('n.type = $type');
            params.type = options.type;
        }
        if (options.path) {
            where.push('n.path = $path');
            params.path = options.path;
        }
        if (options.name) {
            where.push('n.name CONTAINS $name');
            params.name = options.name;
        }
        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const orderClause = options.orderBy
            ? `ORDER BY n.${options.orderBy} ${options.orderDirection || 'ASC'}`
            : 'ORDER BY n.created DESC';
        // Count query
        const countQuery = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN count(n) as total
    `;
        const countResult = await this.neogmaService.executeCypher(countQuery, params);
        const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Data query
        const dataQuery = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN n
      ${orderClause}
      SKIP ${options.offset || 0}
      LIMIT ${options.limit || 100}
    `;
        const result = await this.neogmaService.executeCypher(dataQuery, params);
        const items = result.map(row => this.parseEntityFromNeo4j(row.n));
        return { items, total };
    }
    /**
     * Bulk create entities using Neogma
     */
    async createEntitiesBulk(entities, options = {}) {
        let created = 0;
        let updated = 0;
        let failed = 0;
        try {
            // Group entities by type for efficient batch operations
            const entitiesByType = this.groupEntitiesByType(entities);
            for (const [modelKey, entityGroup] of entitiesByType) {
                const Model = this.models[modelKey];
                const results = await this.batchHelper.executeBatched(entityGroup, async (batch) => {
                    const props = batch.map(e => entityToModelProps(e));
                    if (options.skipExisting) {
                        // Create only if not exists
                        const createdInstances = [];
                        for (const p of props) {
                            try {
                                const existing = await Model.findMany({ where: { id: p.id }, limit: 1 });
                                if (existing.length === 0) {
                                    const newInstance = await Model.createOne(p);
                                    createdInstances.push(newInstance);
                                    created++;
                                }
                            }
                            catch (error) {
                                failed++;
                            }
                        }
                        return createdInstances;
                    }
                    else if (options.updateExisting) {
                        // Upsert behavior
                        const upserted = [];
                        for (const p of props) {
                            try {
                                const existing = await Model.findMany({ where: { id: p.id }, limit: 1 });
                                if (existing.length > 0) {
                                    await Model.update(p, { where: { id: p.id } });
                                    updated++;
                                }
                                else {
                                    const newInstance = await Model.createOne(p);
                                    upserted.push(newInstance);
                                    created++;
                                }
                            }
                            catch (error) {
                                failed++;
                            }
                        }
                        return upserted;
                    }
                    else {
                        // Create all (may fail on duplicates)
                        const createdInstances = [];
                        for (const p of props) {
                            try {
                                const newInstance = await Model.createOne(p);
                                createdInstances.push(newInstance);
                                created++;
                            }
                            catch (error) {
                                failed++;
                            }
                        }
                        return createdInstances;
                    }
                });
            }
            this.emit('entities:bulk:created', {
                created,
                updated,
                failed,
                total: entities.length,
            });
            return { created, updated, failed };
        }
        catch (error) {
            this.emit('error', { operation: 'createEntitiesBulk', error });
            throw error;
        }
    }
    /**
     * Find entities by properties using Neogma
     */
    async findEntitiesByProperties(properties) {
        try {
            // Determine model based on properties
            const Model = this.getModelForEntity(properties);
            const instances = await Model.findMany({
                where: properties,
            });
            return instances.map(instance => modelToEntity(instance));
        }
        catch (error) {
            this.emit('error', {
                operation: 'findEntitiesByProperties',
                properties,
                error,
            });
            throw error;
        }
    }
    /**
     * Group entities by their model type for batch operations
     */
    groupEntitiesByType(entities) {
        const groups = new Map();
        for (const entity of entities) {
            const Model = this.getModelForEntity(entity);
            const modelName = Model.name || 'EntityModel';
            if (!groups.has(modelName)) {
                groups.set(modelName, []);
            }
            groups.get(modelName).push(entity);
        }
        return groups;
    }
    /**
     * Get entities by file path (for API compatibility)
     */
    async getEntitiesByFile(filePath) {
        try {
            const result = await this.listEntities({ path: filePath });
            return result.items;
        }
        catch (error) {
            this.emit('error', { operation: 'getEntitiesByFile', filePath, error });
            throw error;
        }
    }
    /**
     * Get entities by type (for API compatibility)
     */
    async getEntitiesByType(type, limit = 100) {
        try {
            const result = await this.listEntities({ type, limit });
            return result.items;
        }
        catch (error) {
            this.emit('error', { operation: 'getEntitiesByType', type, error });
            throw error;
        }
    }
    /**
     * Check if an entity exists (for API compatibility)
     */
    async entityExists(id) {
        try {
            const entity = await this.getEntity(id);
            return entity !== null;
        }
        catch (error) {
            this.emit('error', { operation: 'entityExists', id, error });
            throw error;
        }
    }
    /**
     * Update entity metadata (for API compatibility)
     */
    async updateEntityMetadata(id, metadata) {
        try {
            await this.updateEntity(id, { metadata });
        }
        catch (error) {
            this.emit('error', { operation: 'updateEntityMetadata', id, metadata, error });
            throw error;
        }
    }
    /**
     * Get entity statistics using Neogma
     */
    async getEntityStats() {
        var _a, _b;
        try {
            // Use raw Cypher queries for statistics since Neogma doesn't have aggregation helpers
            const queries = [
                {
                    name: 'total',
                    query: 'MATCH (n:Entity) RETURN count(n) as count',
                },
                {
                    name: 'byType',
                    query: `
            MATCH (n:Entity)
            RETURN n.type as type, count(n) as count
            ORDER BY count DESC
          `,
                },
                {
                    name: 'recent',
                    query: `
            MATCH (n:Entity)
            WHERE n.lastModified > datetime() - duration('P7D')
            RETURN count(n) as count
          `,
                },
            ];
            const results = await Promise.all(queries.map(q => this.neogmaService.executeCypher(q.query)));
            const byType = {};
            results[1].forEach((row) => {
                if (row.type) {
                    byType[row.type] = row.count;
                }
            });
            return {
                total: ((_a = results[0][0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                byType,
                recentlyModified: ((_b = results[2][0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
            };
        }
        catch (error) {
            this.emit('error', { operation: 'getEntityStats', error });
            throw error;
        }
    }
    /**
     * Parse entity from Neo4j result (fallback for custom queries)
     */
    parseEntityFromNeo4j(node) {
        const props = node.properties || node;
        // Convert Neo4j types
        if (props.created) {
            props.created = new Date(props.created);
        }
        if (props.lastModified) {
            props.lastModified = new Date(props.lastModified);
        }
        return props;
    }
}
//# sourceMappingURL=EntityServiceOGM.js.map