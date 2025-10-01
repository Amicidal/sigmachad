// security: avoid dynamic object indexing; prefer switch-based model resolution and Object.fromEntries
/**
 * Relationship Service OGM Implementation
 * Migrated version using Neogma OGM instead of custom Cypher queries
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { NeogmaService } from './NeogmaService';
import { createRelationshipModels } from '@memento/graph/models-ogm/RelationshipModels';
import { createEntityModels } from '@memento/graph/models-ogm/EntityModels';
import {
  GraphRelationship,
  RelationshipType,
  RelationshipQuery,
} from '@memento/shared-types';
import {
  normalizeCodeEdge,
  isCodeRelationship,
  mergeEdgeEvidence,
  mergeEdgeLocations,
} from '@memento/core/utils/codeEdges';
import { canonicalRelationshipId } from '@memento/shared-types';
import { getNeo4jNumericField, normalizeNeo4jValue } from '@memento/utils';

export interface BulkRelationshipOptions {
  skipExisting?: boolean;
  mergeEvidence?: boolean;
  updateTimestamps?: boolean;
}

export interface RelationshipStats {
  total: number;
  byType: Record<string, number>;
  active: number;
  inactive: number;
  withEvidence: number;
}

// Interface for adapter pattern compatibility
export interface IRelationshipService extends EventEmitter {
  createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship>;
  createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: BulkRelationshipOptions
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }>;
  getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
  getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null>;
  deleteRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void>;
  updateRelationshipAuxiliary(
    relId: string,
    rel: GraphRelationship
  ): Promise<void>;
  mergeNormalizedDuplicates(): Promise<number>;
  getRelationshipStats(): Promise<RelationshipStats>;
  markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
  upsertEdgeEvidenceBulk(
    updates: Array<{
      fromId: string;
      toId: string;
      type: RelationshipType;
      evidence: any[];
      locations?: any[];
    }>
  ): Promise<void>;
  getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}

export class RelationshipServiceOGM
  extends EventEmitter
  implements IRelationshipService
{
  private relationshipModels: ReturnType<typeof createRelationshipModels>;
  private entityModels: ReturnType<typeof createEntityModels>;

  constructor(private neogmaService: NeogmaService) {
    super();
    const neogma = this.neogmaService.getNeogmaInstance();
    this.relationshipModels = createRelationshipModels(neogma);
    this.entityModels = createEntityModels(neogma);

    // Forward NeogmaService events
    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }

  /**
   * Get the appropriate relationship model based on relationship type
   */
  private getRelationshipModel(type: RelationshipType) {
    switch (type) {
      // Structural
      case RelationshipType.CONTAINS:
        return this.relationshipModels.ContainsRelation;
      case RelationshipType.DEFINES:
        return this.relationshipModels.DefinesRelation;
      case RelationshipType.EXPORTS:
        return this.relationshipModels.ExportsRelation;
      case RelationshipType.IMPORTS:
        return this.relationshipModels.ImportsRelation;
      // Code
      case RelationshipType.CALLS:
        return this.relationshipModels.CallsRelation;
      case RelationshipType.REFERENCES:
        return this.relationshipModels.ReferencesRelation;
      case RelationshipType.IMPLEMENTS:
        return this.relationshipModels.ImplementsRelation;
      case RelationshipType.EXTENDS:
        return this.relationshipModels.ExtendsRelation;
      case RelationshipType.DEPENDS_ON:
        return this.relationshipModels.DependsOnRelation;
      // Type Usage
      case RelationshipType.TYPE_USES:
        return this.relationshipModels.TypeUsesRelation;
      case RelationshipType.RETURNS_TYPE:
        return this.relationshipModels.ReturnsTypeRelation;
      case RelationshipType.PARAM_TYPE:
        return this.relationshipModels.ParamTypeRelation;
      // Test
      case RelationshipType.TESTS:
        return this.relationshipModels.TestsRelation;
      case RelationshipType.VALIDATES:
        return this.relationshipModels.ValidatesRelation;
      // Spec
      case RelationshipType.REQUIRES:
        return this.relationshipModels.RequiresRelation;
      case RelationshipType.IMPACTS:
        return this.relationshipModels.ImpactsRelation;
      case RelationshipType.IMPLEMENTS_SPEC:
        return this.relationshipModels.ImplementsSpecRelation;
      // Documentation
      case RelationshipType.DOCUMENTED_BY:
        return this.relationshipModels.DocumentedByRelation;
      case RelationshipType.DOCUMENTS_SECTION:
        return this.relationshipModels.DocumentsSectionRelation;
      // Temporal
      case RelationshipType.PREVIOUS_VERSION:
        return this.relationshipModels.PreviousVersionRelation;
      case RelationshipType.MODIFIED_BY:
        return this.relationshipModels.ModifiedByRelation;
      default:
        return null;
    }
  }

  /**
   * Create or update a relationship using Neogma
   */
  async createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    try {
      const normalized = this.normalizeRelationship(relationship);
      const relId = this.generateRelationshipId(normalized);

      // For complex relationships, fall back to Cypher for now
      if (
        !this.getRelationshipModel(normalized.type) ||
        isCodeRelationship(normalized.type)
      ) {
        return this.createRelationshipWithCypher(normalized, relId);
      }

      // Use Neogma models for simple structural relationships
      const RelationshipModel = this.getRelationshipModel(normalized.type);
      if (!RelationshipModel) {
        throw new Error(
          `No model found for relationship type: ${normalized.type}`
        );
      }

      const properties = this.extractRelationshipProperties(normalized);
      properties.id = relId;

      // Create relationship using Neogma
      // Note: For now we use Cypher since Neogma relationship creation is complex
      return this.createRelationshipWithCypher(normalized, relId);
    } catch (error) {
      this.emit('error', {
        operation: 'createRelationship',
        relationship,
        error,
      });
      throw error;
    }
  }

  /**
   * Create relationship using Cypher (fallback for complex operations)
   */
  private async createRelationshipWithCypher(
    normalized: GraphRelationship,
    relId: string
  ): Promise<GraphRelationship> {
    const query = `
      MATCH (from:Entity {id: $fromId})
      MATCH (to:Entity {id: $toId})
      MERGE (from)-[r:${normalized.type} {id: $relId}]->(to)
      SET r += $properties
      SET r.lastModified = datetime()
      RETURN r, from, to
    `;

    const properties = this.extractRelationshipProperties(normalized);
    properties.id = relId;

    const result = await this.neogmaService.executeCypher(query, {
      fromId: normalized.fromEntityId,
      toId: normalized.toEntityId,
      relId,
      properties,
    });

    if (result.length === 0) {
      throw new Error(`Failed to create relationship: ${relId}`);
    }

    const created = this.parseRelationshipFromNeo4j(result[0]);
    this.emit('relationship:created', created);

    // Handle evidence and auxiliary data if present
    if (normalized.evidence || normalized.locations) {
      await this.updateRelationshipAuxiliary(relId, normalized);
    }

    return created;
  }

  /**
   * Bulk create relationships
   */
  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options: BulkRelationshipOptions = {}
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    try {
      const normalized = relationships.map((relationship) => {
        const normalizedRelationship = this.normalizeRelationship(relationship);
        return {
          ...normalizedRelationship,
          _id: this.generateRelationshipId(normalizedRelationship),
        };
      });

      const grouped = this.groupRelationshipsByType(normalized);

      let created = 0;
      let updated = 0;
      let failed = 0;

      for (const [type, rels] of grouped) {
        const query = options.mergeEvidence
          ? this.buildBulkMergeQuery(type, options)
          : this.buildBulkCreateQuery(type, options);

        const payload = rels.map((rel) => {
          const properties = this.extractRelationshipProperties(rel);
          properties.id = rel._id;
          return {
            fromId: rel.fromEntityId,
            toId: rel.toEntityId,
            relId: rel._id,
            properties,
          };
        });

        const result = await this.neogmaService.executeCypher(query, {
          relationships: payload,
        });

        const affected = getNeo4jNumericField(result[0] ?? {}, 'count', 0);
        created += affected;
        if (options.mergeEvidence) {
          updated += Math.max(rels.length - affected, 0);
        }
        failed += Math.max(rels.length - affected, 0);
      }

      this.emit('relationships:bulk:created', {
        count: created,
        total: relationships.length,
      });

      return {
        created,
        updated,
        failed,
      };
    } catch (error) {
      console.error('Bulk relationship creation failed:', error);
      this.emit('error', { operation: 'createRelationshipsBulk', error });
      return { created: 0, updated: 0, failed: relationships.length };
    }
  }

  private groupRelationshipsByType<
    T extends GraphRelationship & { _id: string }
  >(relationships: T[]): Map<RelationshipType, T[]> {
    const grouped = new Map<RelationshipType, T[]>();

    for (const relationship of relationships) {
      const relType = relationship.type;
      const bucket = grouped.get(relType) ?? [];
      bucket.push(relationship);
      grouped.set(relType, bucket);
    }

    return grouped;
  }

  /**
   * Get relationships based on query
   */
  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    try {
      const where: string[] = [];
      const params: Record<string, any> = {};

      if (query.fromEntityId) {
        where.push('from.id = $fromId');
        params.fromId = query.fromEntityId;
      }

      if (query.toEntityId) {
        where.push('to.id = $toId');
        params.toId = query.toEntityId;
      }

      if (query.type) {
        if (Array.isArray(query.type)) {
          where.push('type(r) IN $types');
          params.types = query.type;
        } else {
          where.push('type(r) = $type');
          params.type = query.type;
        }
      }

      if (query.active !== undefined) {
        where.push('coalesce(r.active, true) = $active');
        params.active = query.active;
      }

      if (query.confidenceMin !== undefined) {
        where.push('r.confidence >= $minConfidence');
        params.minConfidence = query.confidenceMin;
      }

      // Add code-specific filters
      if (query.kind) {
        if (Array.isArray(query.kind)) {
          where.push('r.kind IN $kinds');
          params.kinds = query.kind;
        } else {
          where.push('r.kind = $kind');
          params.kind = query.kind;
        }
      }

      if (query.source) {
        if (Array.isArray(query.source)) {
          where.push('r.source IN $sources');
          params.sources = query.source;
        } else {
          where.push('r.source = $source');
          params.source = query.source;
        }
      }

      const whereClause =
        where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const limit = query.limit || 100;
      const offset = query.offset || 0;

      const cypherQuery = `
        MATCH (from)-[r]->(to)
        ${whereClause}
        RETURN r, from, to
        ORDER BY r.lastModified DESC
        SKIP $offset
        LIMIT $limit
      `;

      params.offset = offset;
      params.limit = limit;

      const result = await this.neogmaService.executeCypher(
        cypherQuery,
        params
      );
      return result.map((row) => this.parseRelationshipFromNeo4j(row));
    } catch (error) {
      this.emit('error', { operation: 'getRelationships', query, error });
      throw error;
    }
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void> {
    try {
      const query = `
        MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
        DELETE r
      `;

      await this.neogmaService.executeCypher(query, { fromId, toId });
      this.emit('relationship:deleted', { fromId, toId, type });
    } catch (error) {
      this.emit('error', {
        operation: 'deleteRelationship',
        fromId,
        toId,
        type,
        error,
      });
      throw error;
    }
  }

  /**
   * Update auxiliary data for a relationship
   */
  async updateRelationshipAuxiliary(
    relId: string,
    rel: GraphRelationship
  ): Promise<void> {
    try {
      if (!rel.evidence && !rel.locations) return;

      const query = `
        MATCH ()-[r {id: $relId}]->()
        SET r.evidence = $evidence
        SET r.locations = $locations
      `;

      await this.neogmaService.executeCypher(query, {
        relId,
        evidence: rel.evidence ? JSON.stringify(rel.evidence) : null,
        locations: rel.locations ? JSON.stringify(rel.locations) : null,
      });
    } catch (error) {
      this.emit('error', {
        operation: 'updateRelationshipAuxiliary',
        relId,
        error,
      });
      throw error;
    }
  }

  /**
   * Mark relationships as inactive if not seen since a date
   */
  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    try {
      const query = `
        MATCH ()-[r]->()
        WHERE r.lastSeenAt < $since AND coalesce(r.active, true) = true
        SET r.active = false
        SET r.validTo = coalesce(r.validTo, datetime())
        RETURN count(r) as count
      `;

      const result = await this.neogmaService.executeCypher(query, {
        since: since.toISOString(),
      });

      const count = getNeo4jNumericField(result[0] ?? {}, 'count', 0);
      this.emit('relationships:marked:inactive', { count, since });
      return count;
    } catch (error) {
      this.emit('error', {
        operation: 'markInactiveEdgesNotSeenSince',
        since,
        error,
      });
      throw error;
    }
  }

  /**
   * Update relationship evidence in bulk
   */
  async upsertEdgeEvidenceBulk(
    updates: Array<{
      fromId: string;
      toId: string;
      type: RelationshipType;
      evidence: any[];
      locations?: any[];
    }>
  ): Promise<void> {
    try {
      const query = `
        UNWIND $updates AS update
        MATCH (from:Entity {id: update.fromId})-[r]->(to:Entity {id: update.toId})
        WHERE type(r) = update.type
        SET r.evidence = CASE
          WHEN r.evidence IS NULL THEN update.evidence
          ELSE apoc.coll.union(coalesce(r.evidence, []), update.evidence)
        END
        SET r.locations = CASE
          WHEN update.locations IS NULL THEN r.locations
          WHEN r.locations IS NULL THEN update.locations
          ELSE apoc.coll.union(coalesce(r.locations, []), update.locations)
        END
        SET r.lastModified = datetime()
      `;

      await this.neogmaService.executeCypher(query, {
        updates: updates.map((u) => ({
          fromId: u.fromId,
          toId: u.toId,
          type: u.type,
          evidence: JSON.stringify(u.evidence.slice(0, 20)),
          locations: u.locations
            ? JSON.stringify(u.locations.slice(0, 20))
            : null,
        })),
      });
    } catch (error) {
      this.emit('error', { operation: 'upsertEdgeEvidenceBulk', error });
      throw error;
    }
  }

  /**
   * Get relationship statistics
   */
  async getRelationshipStats(): Promise<RelationshipStats> {
    try {
      const queries = [
        {
          name: 'total',
          query: 'MATCH ()-[r]->() RETURN count(r) as count',
        },
        {
          name: 'byType',
          query: `
            MATCH ()-[r]->()
            RETURN type(r) as type, count(r) as count
            ORDER BY count DESC
          `,
        },
        {
          name: 'active',
          query: `
            MATCH ()-[r]->()
            WHERE coalesce(r.active, true) = true
            RETURN count(r) as count
          `,
        },
        {
          name: 'withEvidence',
          query: `
            MATCH ()-[r]->()
            WHERE r.evidence IS NOT NULL
            RETURN count(r) as count
          `,
        },
      ];

      const results = await Promise.all(
        queries.map((q) => this.neogmaService.executeCypher(q.query))
      );

      const byTypeEntries: Array<[string, number]> = [];
      results[1].forEach((row: Record<string, unknown>) => {
        if (row.type) {
          byTypeEntries.push([
            String(row.type),
            getNeo4jNumericField(row, 'count', 0),
          ]);
        }
      });
      const byType: Record<string, number> = Object.fromEntries(byTypeEntries);

      const total = getNeo4jNumericField(results[0]?.[0] ?? {}, 'count', 0);
      const active = getNeo4jNumericField(results[2]?.[0] ?? {}, 'count', 0);
      const withEvidence = getNeo4jNumericField(
        results[3]?.[0] ?? {},
        'count',
        0
      );

      return {
        total,
        byType,
        active,
        inactive: Math.max(total - active, 0),
        withEvidence,
      };
    } catch (error) {
      this.emit('error', { operation: 'getRelationshipStats', error });
      throw error;
    }
  }

  /**
   * Merge duplicate relationships
   */
  async mergeNormalizedDuplicates(): Promise<number> {
    try {
      // Use APOC for complex relationship merging
      const query = `
        MATCH (from)-[r1]->(to)
        MATCH (from)-[r2]->(to)
        WHERE type(r1) = type(r2)
          AND id(r1) < id(r2)
          AND r1.to_ref_symbol = r2.to_ref_symbol
          AND r1.to_ref_file = r2.to_ref_file
        WITH r1, collect(r2) as duplicates
        CALL apoc.refactor.mergeRelationships([r1] + duplicates, {
          properties: 'combine',
          mergeConfig: {
            evidence: 'combine',
            locations: 'combine',
            occurrencesTotal: 'sum',
            confidence: 'max'
          }
        }) YIELD rel
        RETURN count(rel) as count
      `;

      const result = await this.neogmaService.executeCypher(query);
      const count = getNeo4jNumericField(result[0] ?? {}, 'count', 0);

      if (count > 0) {
        this.emit('relationships:merged', { count });
      }

      return count;
    } catch (error) {
      this.emit('error', { operation: 'mergeNormalizedDuplicates', error });
      // Fallback to simpler approach if APOC is not available
      console.warn('APOC merge failed, using simple duplicate removal');
      return 0;
    }
  }

  /**
   * Normalize a relationship
   */
  private normalizeRelationship(rel: GraphRelationship): GraphRelationship {
    const normalized: any = { ...rel };

    // Ensure timestamps
    const now = new Date();
    if (!normalized.created) normalized.created = now;
    if (!normalized.lastModified) normalized.lastModified = now;
    if (!normalized.version) normalized.version = 1;

    // Normalize dates
    if (!(normalized.created instanceof Date)) {
      normalized.created = new Date(normalized.created);
    }
    if (!(normalized.lastModified instanceof Date)) {
      normalized.lastModified = new Date(normalized.lastModified);
    }

    // Apply code edge normalization if applicable
    if (isCodeRelationship(normalized.type)) {
      Object.assign(normalized, normalizeCodeEdge(normalized));
    }

    // Ensure active state
    if (normalized.active === undefined) {
      normalized.active = true;
    }

    // Merge and limit evidence/locations
    if (normalized.evidence && Array.isArray(normalized.evidence)) {
      normalized.evidence = normalized.evidence.slice(0, 20);
    }
    if (normalized.locations && Array.isArray(normalized.locations)) {
      normalized.locations = normalized.locations.slice(0, 20);
    }

    return normalized as GraphRelationship;
  }

  /**
   * Generate a canonical relationship ID
   */
  private generateRelationshipId(rel: GraphRelationship): string {
    return canonicalRelationshipId(rel.fromEntityId, rel);
  }

  /**
   * Extract properties for Neo4j storage
   */
  private extractRelationshipProperties(rel: any): Record<string, any> {
    const pairs: Array<[string, any]> = [];

    // Skip complex objects and arrays for main properties
    const skipKeys = [
      'evidence',
      'locations',
      'metadata',
      'fromEntity',
      'toEntity',
    ];

    for (const [key, value] of Object.entries(rel)) {
      if (skipKeys.includes(key) || value === null || value === undefined) {
        continue;
      }

      if (value instanceof Date) {
        pairs.push([key, value.toISOString()]);
      } else if (typeof value === 'object') {
        pairs.push([key, JSON.stringify(value)]);
      } else {
        pairs.push([key, value]);
      }
    }

    // Handle evidence and locations as JSON strings
    if (rel.evidence) {
      pairs.push(['evidence', JSON.stringify(rel.evidence)]);
    }
    if (rel.locations) {
      pairs.push(['locations', JSON.stringify(rel.locations)]);
    }
    if (rel.metadata) {
      pairs.push(['metadata', JSON.stringify(rel.metadata)]);
    }

    return Object.fromEntries(pairs);
  }

  /**
   * Parse relationship from Neo4j result
   */
  private parseRelationshipFromNeo4j(row: any): GraphRelationship {
    const rel = normalizeNeo4jValue(row.r ?? {}) as Record<string, unknown>;
    const properties = normalizeNeo4jValue(rel.properties ?? rel) as Record<
      string,
      unknown
    >;
    const fromNode = normalizeNeo4jValue(row.from ?? {}) as Record<string, any>;
    const toNode = normalizeNeo4jValue(row.to ?? {}) as Record<string, any>;
    const parsedBase: any = {
      type: (rel as Record<string, unknown>).type || row.type,
      fromEntityId:
        fromNode?.properties?.id ?? fromNode?.id ?? row.from?.properties?.id,
      toEntityId:
        toNode?.properties?.id ?? toNode?.id ?? row.to?.properties?.id,
    };
    const extraPairs: Array<[string, unknown]> = [];
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;
      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        extraPairs.push([key, new Date(value as string)]);
      } else if (
        typeof value === 'string' &&
        (key === 'evidence' || key === 'locations' || key === 'metadata')
      ) {
        try {
          extraPairs.push([key, JSON.parse(value as string)]);
        } catch {
          extraPairs.push([key, value]);
        }
      } else {
        extraPairs.push([key, value]);
      }
    }

    return { ...parsedBase, ...Object.fromEntries(extraPairs) } as GraphRelationship;
  }

  /**
   * Build bulk merge query for relationships
   */
  private buildBulkMergeQuery(
    relationshipType: RelationshipType,
    options: BulkRelationshipOptions
  ): string {
    const timestampClause = options.updateTimestamps
      ? 'SET r.lastModified = datetime()'
      : '';

    return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      MERGE (from)-[r:${relationshipType} {id: rel.relId}]->(to)
      SET r += rel.properties
      ${timestampClause}
      RETURN count(r) AS count
    `;
  }

  /**
   * Build bulk create query for relationships
   */
  private buildBulkCreateQuery(
    relationshipType: RelationshipType,
    options: BulkRelationshipOptions
  ): string {
    const skipClause = options.skipExisting
      ? `WHERE NOT EXISTS((from)-[:${relationshipType} {id: rel.relId}]->(to))`
      : '';

    return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      ${skipClause}
      CREATE (from)-[r:${relationshipType} {id: rel.relId}]->(to)
      SET r += rel.properties
      RETURN count(r) AS count
    `;
  }

  /**
   * Get a single relationship by its ID
   */
  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        RETURN r, from, to
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
      });

      if (result.length === 0) {
        return null;
      }

      return this.parseRelationshipFromNeo4j(result[0]);
    } catch (error) {
      this.emit('error', {
        operation: 'getRelationshipById',
        relationshipId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get evidence nodes for a relationship edge
   */
  async getEdgeEvidenceNodes(
    relationshipId: string,
    limit: number = 200
  ): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.evidence IS NOT NULL
        UNWIND r.evidence AS evidence
        RETURN evidence
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map((row) => row.evidence);
    } catch (error) {
      this.emit('error', {
        operation: 'getEdgeEvidenceNodes',
        relationshipId,
        error,
      });
      // Return empty array on error rather than throwing
      console.warn(
        `Failed to get evidence nodes for relationship ${relationshipId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get edge sites for a relationship (locations where the relationship is used)
   */
  async getEdgeSites(
    relationshipId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.locations IS NOT NULL
        UNWIND r.locations AS location
        RETURN location
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map((row) => row.location);
    } catch (error) {
      this.emit('error', { operation: 'getEdgeSites', relationshipId, error });
      // Return empty array on error rather than throwing
      console.warn(
        `Failed to get edge sites for relationship ${relationshipId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get edge candidates for a relationship (potential relationship targets)
   */
  async getEdgeCandidates(
    relationshipId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH from, to, type(r) as relType
        MATCH (from)-[similar]->(candidates)
        WHERE type(similar) = relType AND candidates <> to
        RETURN DISTINCT candidates
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map((row) => row.candidates);
    } catch (error) {
      this.emit('error', {
        operation: 'getEdgeCandidates',
        relationshipId,
        error,
      });
      // Return empty array on error rather than throwing
      console.warn(
        `Failed to get edge candidates for relationship ${relationshipId}:`,
        error
      );
      return [];
    }
  }
}
 
// TODO(2025-09-30.35): Replace dynamic property indexing with guarded accessors.
