/**
 * Entity Service
 * Handles entity lifecycle and CRUD operations
 */
import { EventEmitter } from 'events';
export class EntityService extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Create or update a single entity
     */
    async createEntity(entity) {
        const normalized = this.normalizeEntity(entity);
        const labels = this.getEntityLabels(normalized);
        const properties = this.extractProperties(normalized);
        const query = `
      MERGE (n:Entity {id: $id})
      SET n:${labels.join(':')}
      SET n += $properties
      SET n.lastModified = datetime()
      RETURN n
    `;
        const result = await this.neo4j.executeCypher(query, {
            id: normalized.id,
            properties,
        });
        if (result.length === 0) {
            throw new Error(`Failed to create entity: ${normalized.id}`);
        }
        const created = this.parseEntityFromNeo4j(result[0].n);
        this.emit('entity:created', created);
        return created;
    }
    /**
     * Update an existing entity
     */
    async updateEntity(id, updates) {
        const properties = this.extractProperties(updates);
        delete properties.id; // Don't update the ID
        const query = `
      MATCH (n:Entity {id: $id})
      SET n += $properties
      SET n.lastModified = datetime()
      RETURN n
    `;
        const result = await this.neo4j.executeCypher(query, {
            id,
            properties,
        });
        if (result.length === 0) {
            throw new Error(`Entity not found: ${id}`);
        }
        const updated = this.parseEntityFromNeo4j(result[0].n);
        this.emit('entity:updated', updated);
        return updated;
    }
    /**
     * Get a single entity by ID
     */
    async getEntity(id) {
        const query = `
      MATCH (n:Entity {id: $id})
      RETURN n
    `;
        const result = await this.neo4j.executeCypher(query, { id });
        if (result.length === 0) {
            return null;
        }
        return this.parseEntityFromNeo4j(result[0].n);
    }
    /**
     * Delete an entity and its relationships
     */
    async deleteEntity(id) {
        const query = `
      MATCH (n:Entity {id: $id})
      DETACH DELETE n
    `;
        await this.neo4j.executeCypher(query, { id });
        this.emit('entity:deleted', { id });
    }
    /**
     * List entities with filtering and pagination
     */
    async listEntities(options = {}) {
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
        const orderBy = options.orderBy || 'lastModified';
        const orderDirection = options.orderDirection || 'DESC';
        const limit = options.limit || 100;
        const offset = options.offset || 0;
        // Count total
        const countQuery = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN count(n) as total
    `;
        const countResult = await this.neo4j.executeCypher(countQuery, params);
        const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Get items
        const query = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN n
      ORDER BY n.${orderBy} ${orderDirection}
      SKIP $offset
      LIMIT $limit
    `;
        params.offset = offset;
        params.limit = limit;
        const result = await this.neo4j.executeCypher(query, params);
        const items = result.map(row => this.parseEntityFromNeo4j(row.n));
        return { items, total };
    }
    /**
     * Create multiple entities in bulk
     */
    async createEntitiesBulk(entities, options = {}) {
        var _a;
        const normalized = entities.map(e => ({
            ...this.normalizeEntity(e),
            _labels: this.getEntityLabels(e),
        }));
        const operation = options.updateExisting ? 'MERGE' : 'CREATE';
        const skipClause = options.skipExisting ? 'WHERE NOT EXISTS((n:Entity {id: item.id}))' : '';
        const query = `
      UNWIND $entities AS item
      ${skipClause}
      ${operation} (n:Entity {id: item.id})
      SET n += item
      REMOVE n._labels
      WITH n, item._labels AS labels
      CALL apoc.create.addLabels(n, labels) YIELD node
      RETURN count(node) as count
    `;
        try {
            const result = await this.neo4j.executeCypher(query, {
                entities: normalized.map(e => ({
                    ...this.extractProperties(e),
                    _labels: e._labels,
                })),
            });
            const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            this.emit('entities:bulk:created', { count, total: entities.length });
            return {
                created: count,
                updated: options.updateExisting ? entities.length - count : 0,
                failed: entities.length - count,
            };
        }
        catch (error) {
            console.error('Bulk create failed:', error);
            return { created: 0, updated: 0, failed: entities.length };
        }
    }
    /**
     * Get entities by file path
     */
    async getEntitiesByFile(filePath) {
        const query = `
      MATCH (n:Entity {path: $path})
      RETURN n
      ORDER BY n.name
    `;
        const result = await this.neo4j.executeCypher(query, { path: filePath });
        return result.map(row => this.parseEntityFromNeo4j(row.n));
    }
    /**
     * Get entities by type
     */
    async getEntitiesByType(type, limit = 100) {
        const query = `
      MATCH (n:Entity {type: $type})
      RETURN n
      ORDER BY n.lastModified DESC
      LIMIT $limit
    `;
        const result = await this.neo4j.executeCypher(query, { type, limit });
        return result.map(row => this.parseEntityFromNeo4j(row.n));
    }
    /**
     * Check if an entity exists
     */
    async entityExists(id) {
        var _a;
        const query = `
      MATCH (n:Entity {id: $id})
      RETURN count(n) > 0 as exists
    `;
        const result = await this.neo4j.executeCypher(query, { id });
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.exists) || false;
    }
    /**
     * Update entity metadata
     */
    async updateEntityMetadata(id, metadata) {
        const query = `
      MATCH (n:Entity {id: $id})
      SET n.metadata = $metadata
      SET n.lastModified = datetime()
    `;
        await this.neo4j.executeCypher(query, {
            id,
            metadata: JSON.stringify(metadata),
        });
    }
    /**
     * Get entity statistics
     */
    async getEntityStats() {
        var _a, _b;
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
        const results = await Promise.all(queries.map(q => this.neo4j.executeCypher(q.query)));
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
    /**
     * Normalize an entity for storage
     */
    normalizeEntity(entity) {
        const normalized = { ...entity };
        // Ensure required fields
        if (!normalized.id) {
            throw new Error('Entity ID is required');
        }
        if (!normalized.type) {
            normalized.type = 'generic';
        }
        // Set timestamps
        const now = new Date();
        if (!normalized.created) {
            normalized.created = now;
        }
        if (!normalized.lastModified) {
            normalized.lastModified = now;
        }
        // Ensure dates are Date objects
        if (!(normalized.created instanceof Date)) {
            normalized.created = new Date(normalized.created);
        }
        if (!(normalized.lastModified instanceof Date)) {
            normalized.lastModified = new Date(normalized.lastModified);
        }
        return normalized;
    }
    /**
     * Get Neo4j labels for an entity based on its type
     */
    getEntityLabels(entity) {
        const labels = ['Entity'];
        if (entity.type) {
            // Map entity types to Neo4j labels
            const typeLabels = {
                'file': 'File',
                'function': 'Function',
                'class': 'Class',
                'module': 'Module',
                'package': 'Package',
                'spec': 'Specification',
                'test': 'Test',
                'change': 'Change',
                'session': 'Session',
                'symbol': 'Symbol',
            };
            const label = typeLabels[entity.type.toLowerCase()];
            if (label) {
                labels.push(label);
            }
        }
        // Add CodebaseEntity label if it has code properties
        if (this.hasCodebaseProperties(entity)) {
            labels.push('CodebaseEntity');
        }
        return labels;
    }
    /**
     * Check if entity has codebase properties
     */
    hasCodebaseProperties(entity) {
        return !!(entity.path ||
            entity.language ||
            entity.content ||
            entity.hash ||
            entity.size);
    }
    /**
     * Extract properties for Neo4j storage
     */
    extractProperties(entity) {
        const properties = {};
        // Copy scalar properties
        for (const [key, value] of Object.entries(entity)) {
            if (value === null || value === undefined) {
                continue;
            }
            if (value instanceof Date) {
                properties[key] = value.toISOString();
            }
            else if (typeof value === 'object') {
                // Store complex objects as JSON
                properties[key] = JSON.stringify(value);
            }
            else {
                properties[key] = value;
            }
        }
        return properties;
    }
    /**
     * Parse entity from Neo4j result
     */
    parseEntityFromNeo4j(node) {
        const properties = node.properties || node;
        const entity = {};
        for (const [key, value] of Object.entries(properties)) {
            if (value === null || value === undefined) {
                continue;
            }
            // Parse dates
            if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
                entity[key] = new Date(value);
            }
            // Parse JSON strings
            else if (typeof value === 'string' &&
                value.startsWith('[') ||
                value.startsWith('{')) {
                try {
                    entity[key] = JSON.parse(value);
                }
                catch (_a) {
                    entity[key] = value;
                }
            }
            else {
                entity[key] = value;
            }
        }
        return entity;
    }
}
//# sourceMappingURL=EntityService.js.map