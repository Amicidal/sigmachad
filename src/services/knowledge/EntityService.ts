/**
 * Entity Service
 * Handles entity lifecycle and CRUD operations
 */

import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import {
  Entity,
  CodebaseEntity,
  File,
  FunctionSymbol,
  ClassSymbol,
} from '../../models/entities.js';

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

export class EntityService extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }

  /**
   * Create or update a single entity
   */
  async createEntity(entity: Entity): Promise<Entity> {
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
  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
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
  async getEntity(id: string): Promise<Entity | null> {
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
  async deleteEntity(id: string): Promise<void> {
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
  async listEntities(options: ListEntitiesOptions = {}): Promise<{
    items: Entity[];
    total: number;
  }> {
    const where: string[] = ['n:Entity'];
    const params: Record<string, any> = {};

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
    const total = countResult[0]?.total || 0;

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
  async createEntitiesBulk(
    entities: Entity[],
    options: BulkCreateOptions = {}
  ): Promise<{ created: number; updated: number; failed: number }> {
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

      const count = result[0]?.count || 0;
      this.emit('entities:bulk:created', { count, total: entities.length });

      return {
        created: count,
        updated: options.updateExisting ? entities.length - count : 0,
        failed: entities.length - count,
      };
    } catch (error) {
      console.error('Bulk create failed:', error);
      return { created: 0, updated: 0, failed: entities.length };
    }
  }

  /**
   * Get entities by file path
   */
  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
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
  async getEntitiesByType(type: string, limit = 100): Promise<Entity[]> {
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
  async entityExists(id: string): Promise<boolean> {
    const query = `
      MATCH (n:Entity {id: $id})
      RETURN count(n) > 0 as exists
    `;

    const result = await this.neo4j.executeCypher(query, { id });
    return result[0]?.exists || false;
  }

  /**
   * Update entity metadata
   */
  async updateEntityMetadata(
    id: string,
    metadata: Record<string, any>
  ): Promise<void> {
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
  async getEntityStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    recentlyModified: number;
  }> {
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

    const results = await Promise.all(
      queries.map(q => this.neo4j.executeCypher(q.query))
    );

    const byType: Record<string, number> = {};
    results[1].forEach((row: any) => {
      if (row.type) {
        byType[row.type] = row.count;
      }
    });

    return {
      total: results[0][0]?.count || 0,
      byType,
      recentlyModified: results[2][0]?.count || 0,
    };
  }

  /**
   * Normalize an entity for storage
   */
  private normalizeEntity(entity: Entity): Entity {
    const normalized: any = { ...entity };

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

    return normalized as Entity;
  }

  /**
   * Get Neo4j labels for an entity based on its type
   */
  private getEntityLabels(entity: Entity): string[] {
    const labels = ['Entity'];

    if (entity.type) {
      // Map entity types to Neo4j labels
      const typeLabels: Record<string, string> = {
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
  private hasCodebaseProperties(entity: any): boolean {
    return !!(
      entity.path ||
      entity.language ||
      entity.content ||
      entity.hash ||
      entity.size
    );
  }

  /**
   * Extract properties for Neo4j storage
   */
  private extractProperties(entity: any): Record<string, any> {
    const properties: Record<string, any> = {};

    // Copy scalar properties
    for (const [key, value] of Object.entries(entity)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (value instanceof Date) {
        properties[key] = value.toISOString();
      } else if (typeof value === 'object') {
        // Store complex objects as JSON
        properties[key] = JSON.stringify(value);
      } else {
        properties[key] = value;
      }
    }

    return properties;
  }

  /**
   * Parse entity from Neo4j result
   */
  private parseEntityFromNeo4j(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        continue;
      }

      // Parse dates
      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      }
      // Parse JSON strings
      else if (
        typeof value === 'string' &&
        (value as string).startsWith('[') ||
        (value as string).startsWith('{')
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}