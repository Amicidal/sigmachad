/**
 * History Service
 * Handles temporal versioning, checkpoints, and history pruning
 */

import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '../../models/entities.js';
import { RelationshipType } from '../../models/relationships.js';
import { TimeRangeParams, TraversalQuery } from '../../models/types.js';

export interface CheckpointOptions {
  reason: 'daily' | 'incident' | 'manual';
  hops?: number;
  window?: TimeRangeParams;
  description?: string;
}

export interface VersionInfo {
  id: string;
  entityId: string;
  hash: string;
  timestamp: Date;
  changeSetId?: string;
  path?: string;
  language?: string;
}

export interface CheckpointInfo {
  id: string;
  timestamp: Date;
  reason: string;
  seedEntities: string[];
  memberCount: number;
  metadata?: Record<string, any>;
}

export interface HistoryMetrics {
  versions: number;
  checkpoints: number;
  checkpointMembers: { avg: number; min: number; max: number };
  temporalEdges: { open: number; closed: number };
  lastPrune?: {
    retentionDays: number;
    cutoff: string;
    versions: number;
    closedEdges: number;
    checkpoints: number;
  };
}

export class HistoryService extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== 'false';
  }

  /**
   * Append a version for an entity
   */
  async appendVersion(
    entity: Entity,
    options?: { changeSetId?: string; timestamp?: Date }
  ): Promise<string> {
    if (!this.historyEnabled) {
      return `ver_disabled_${Date.now().toString(36)}`;
    }

    const entityId = entity.id;
    const timestamp = options?.timestamp || new Date();
    const hash = (entity as any).hash || Date.now().toString(36);
    const versionId = `ver_${entityId}_${hash}`;

    const query = `
      MATCH (e:Entity {id: $entityId})
      MERGE (v:Version {id: $versionId})
      SET v.entityId = $entityId
      SET v.hash = $hash
      SET v.timestamp = $timestamp
      SET v.type = 'version'
      SET v.path = $path
      SET v.language = $language
      SET v.changeSetId = $changeSetId
      MERGE (v)-[:VERSION_OF]->(e)
      WITH v
      OPTIONAL MATCH (e)<-[:VERSION_OF]-(prev:Version)
      WHERE prev.id <> v.id AND prev.timestamp < v.timestamp
      WITH v, prev
      ORDER BY prev.timestamp DESC
      LIMIT 1
      FOREACH (p IN CASE WHEN prev IS NOT NULL THEN [prev] ELSE [] END |
        MERGE (v)-[:PREVIOUS_VERSION]->(p)
      )
      RETURN v
    `;

    await this.neo4j.executeCypher(query, {
      entityId,
      versionId,
      hash,
      timestamp: timestamp.toISOString(),
      path: (entity as any).path || null,
      language: (entity as any).language || null,
      changeSetId: options?.changeSetId || null,
    });

    this.emit('version:created', { entityId, versionId, timestamp });
    return versionId;
  }

  /**
   * Create a checkpoint capturing a subgraph state
   */
  async createCheckpoint(
    seedEntities: string[],
    options: CheckpointOptions
  ): Promise<{ checkpointId: string; memberCount: number }> {
    if (!this.historyEnabled) {
      return {
        checkpointId: `chk_disabled_${Date.now().toString(36)}`,
        memberCount: 0,
      };
    }

    const checkpointId = `chk_${Date.now().toString(36)}`;
    const timestamp = new Date();
    const hops = Math.min(Math.max(1, options.hops || 2), 5);

    // Create checkpoint node
    await this.neo4j.executeCypher(
      `
      MERGE (c:Checkpoint {id: $id})
      SET c.timestamp = $timestamp
      SET c.reason = $reason
      SET c.seedEntities = $seeds
      SET c.description = $description
      SET c.metadata = $metadata
      `,
      {
        id: checkpointId,
        timestamp: timestamp.toISOString(),
        reason: options.reason,
        seeds: JSON.stringify(seedEntities),
        description: options.description || null,
        metadata: JSON.stringify(options.window || {}),
      }
    );

    // Collect neighborhood members
    const memberQuery = `
      UNWIND $seedIds AS seedId
      MATCH (seed:Entity {id: seedId})
      CALL apoc.path.expand(seed, null, null, 0, $hops, 'RELATIONSHIP_GLOBAL')
      YIELD path
      WITH last(nodes(path)) AS member
      RETURN DISTINCT member.id AS id
    `;

    const memberResult = await this.neo4j.executeCypher(memberQuery, {
      seedIds: seedEntities,
      hops,
    });

    const memberIds = memberResult.map(r => r.id).filter(Boolean);

    // Link members to checkpoint
    if (memberIds.length > 0) {
      await this.neo4j.executeCypher(
        `
        MATCH (c:Checkpoint {id: $checkpointId})
        UNWIND $memberIds AS memberId
        MATCH (m:Entity {id: memberId})
        MERGE (c)-[:INCLUDES]->(m)
        `,
        { checkpointId, memberIds }
      );
    }

    this.emit('checkpoint:created', {
      checkpointId,
      seedCount: seedEntities.length,
      memberCount: memberIds.length,
      reason: options.reason,
    });

    return { checkpointId, memberCount: memberIds.length };
  }

  /**
   * Open a temporal edge with validity period
   */
  async openEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date,
    changeSetId?: string
  ): Promise<void> {
    if (!this.historyEnabled) return;

    const at = timestamp || new Date();

    const query = `
      MATCH (from:Entity {id: $fromId})
      MATCH (to:Entity {id: $toId})
      MERGE (from)-[r:${type} {id: $relId}]->(to)
      SET r.validFrom = $at
      SET r.validTo = null
      SET r.active = true
      SET r.changeSetId = $changeSetId
      SET r.lastModified = $at
    `;

    await this.neo4j.executeCypher(query, {
      fromId,
      toId,
      relId: `rel_${fromId}_${toId}_${type}`,
      at: at.toISOString(),
      changeSetId: changeSetId || null,
    });

    this.emit('edge:opened', { fromId, toId, type, timestamp: at });
  }

  /**
   * Close a temporal edge
   */
  async closeEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date
  ): Promise<void> {
    if (!this.historyEnabled) return;

    const at = timestamp || new Date();

    const query = `
      MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
      SET r.validTo = coalesce(r.validTo, $at)
      SET r.active = false
      SET r.lastModified = $at
    `;

    await this.neo4j.executeCypher(query, {
      fromId,
      toId,
      at: at.toISOString(),
    });

    this.emit('edge:closed', { fromId, toId, type, timestamp: at });
  }

  /**
   * Prune old history data
   */
  async pruneHistory(
    retentionDays: number,
    options?: { dryRun?: boolean }
  ): Promise<{
    versionsDeleted: number;
    edgesClosed: number;
    checkpointsDeleted: number;
  }> {
    if (!this.historyEnabled) {
      return { versionsDeleted: 0, edgesClosed: 0, checkpointsDeleted: 0 };
    }

    const cutoff = new Date(
      Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000
    ).toISOString();

    const dryRun = !!options?.dryRun;

    // Delete old checkpoints
    const checkpointQuery = dryRun
      ? `MATCH (c:Checkpoint) WHERE c.timestamp < $cutoff RETURN count(c) as count`
      : `MATCH (c:Checkpoint) WHERE c.timestamp < $cutoff DETACH DELETE c RETURN count(*) as count`;

    const checkpointResult = await this.neo4j.executeCypher(checkpointQuery, { cutoff });
    const checkpointsDeleted = checkpointResult[0]?.count || 0;

    // Close old edges
    const edgeQuery = dryRun
      ? `MATCH ()-[r]->() WHERE r.validTo < $cutoff RETURN count(r) as count`
      : `MATCH ()-[r]->() WHERE r.validTo < $cutoff DELETE r RETURN count(*) as count`;

    const edgeResult = await this.neo4j.executeCypher(edgeQuery, { cutoff });
    const edgesClosed = edgeResult[0]?.count || 0;

    // Delete old versions
    const versionQuery = dryRun
      ? `MATCH (v:Version) WHERE v.timestamp < $cutoff AND NOT ((:Checkpoint)-[:INCLUDES]->(v)) RETURN count(v) as count`
      : `MATCH (v:Version) WHERE v.timestamp < $cutoff AND NOT ((:Checkpoint)-[:INCLUDES]->(v)) DETACH DELETE v RETURN count(*) as count`;

    const versionResult = await this.neo4j.executeCypher(versionQuery, { cutoff });
    const versionsDeleted = versionResult[0]?.count || 0;

    this.emit('history:pruned', {
      dryRun,
      retentionDays,
      cutoff,
      versionsDeleted,
      edgesClosed,
      checkpointsDeleted,
    });

    return { versionsDeleted, edgesClosed, checkpointsDeleted };
  }

  /**
   * Time-travel traversal
   */
  async timeTravelTraversal(query: TraversalQuery): Promise<{
    nodes: Entity[];
    edges: any[];
  }> {
    const until = query.until || new Date();
    const maxDepth = query.maxDepth || 3;

    const cypherQuery = `
      MATCH (start:Entity {id: $startId})
      CALL apoc.path.expand(
        start,
        $relationshipFilter,
        $labelFilter,
        0,
        $maxDepth,
        'RELATIONSHIP_GLOBAL'
      ) YIELD path
      WITH path, relationships(path) AS rels, nodes(path) AS nodes
      WHERE ALL(r IN rels WHERE
        coalesce(r.validFrom, datetime('1970-01-01')) <= $until AND
        coalesce(r.validTo, datetime('9999-12-31')) >= $until
      )
      RETURN nodes, rels
    `;

    const result = await this.neo4j.executeCypher(cypherQuery, {
      startId: query.startId,
      relationshipFilter: query.relationshipTypes?.join('|') || null,
      labelFilter: query.nodeLabels?.join('|') || null,
      maxDepth,
      until: until.toISOString(),
    });

    const allNodes = new Map<string, Entity>();
    const allEdges: any[] = [];

    result.forEach(row => {
      row.nodes?.forEach((node: any) => {
        if (node.properties?.id && !allNodes.has(node.properties.id)) {
          allNodes.set(node.properties.id, this.parseEntity(node));
        }
      });

      row.rels?.forEach((rel: any) => {
        allEdges.push(this.parseRelationship(rel));
      });
    });

    return {
      nodes: Array.from(allNodes.values()),
      edges: allEdges,
    };
  }

  /**
   * List checkpoints with filtering
   */
  async listCheckpoints(options?: {
    reason?: string;
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CheckpointInfo[]; total: number }> {
    const where: string[] = [];
    const params: Record<string, any> = {};

    if (options?.reason) {
      where.push('c.reason = $reason');
      params.reason = options.reason;
    }

    if (options?.since) {
      where.push('c.timestamp >= $since');
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push('c.timestamp <= $until');
      params.until = options.until.toISOString();
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count total
    const countQuery = `
      MATCH (c:Checkpoint)
      ${whereClause}
      RETURN count(c) as total
    `;

    const countResult = await this.neo4j.executeCypher(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get items with member count
    const query = `
      MATCH (c:Checkpoint)
      ${whereClause}
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
      ORDER BY c.timestamp DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = options?.offset || 0;
    params.limit = options?.limit || 50;

    const result = await this.neo4j.executeCypher(query, params);

    const items = result.map(row => ({
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || '[]'),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    }));

    return { items, total };
  }

  /**
   * Get history metrics
   */
  async getHistoryMetrics(): Promise<HistoryMetrics> {
    const queries = [
      { name: 'versions', query: 'MATCH (v:Version) RETURN count(v) as c' },
      { name: 'checkpoints', query: 'MATCH (c:Checkpoint) RETURN count(c) as c' },
      {
        name: 'openEdges',
        query: 'MATCH ()-[r]->() WHERE r.validTo IS NULL RETURN count(r) as c',
      },
      {
        name: 'closedEdges',
        query: 'MATCH ()-[r]->() WHERE r.validTo IS NOT NULL RETURN count(r) as c',
      },
      {
        name: 'checkpointMembers',
        query: `
          MATCH (c:Checkpoint)
          OPTIONAL MATCH (c)-[:INCLUDES]->(m)
          RETURN c.id as id, count(m) as memberCount
        `,
      },
    ];

    const results = await Promise.all(
      queries.map(q => this.neo4j.executeCypher(q.query))
    );

    const memberCounts = results[4].map(r => r.memberCount || 0);
    const avgMembers = memberCounts.length
      ? memberCounts.reduce((a, b) => a + b, 0) / memberCounts.length
      : 0;

    return {
      versions: results[0][0]?.c || 0,
      checkpoints: results[1][0]?.c || 0,
      checkpointMembers: {
        avg: avgMembers,
        min: memberCounts.length ? Math.min(...memberCounts) : 0,
        max: memberCounts.length ? Math.max(...memberCounts) : 0,
      },
      temporalEdges: {
        open: results[2][0]?.c || 0,
        closed: results[3][0]?.c || 0,
      },
    };
  }

  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
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

  private parseRelationship(rel: any): any {
    return {
      type: rel.type,
      properties: rel.properties,
      startNodeId: rel.start,
      endNodeId: rel.end,
    };
  }

  /**
   * Get checkpoint details
   */
  async getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || '[]'),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    };
  }

  /**
   * Get checkpoint members
   */
  async getCheckpointMembers(checkpointId: string): Promise<Entity[]> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      RETURN m
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    return result.map(row => this.parseEntity(row.m));
  }

  /**
   * Get checkpoint summary
   */
  async getCheckpointSummary(checkpointId: string): Promise<{
    checkpoint: CheckpointInfo;
    members: Entity[];
    stats: {
      entityTypes: Record<string, number>;
      totalRelationships: number;
      relationshipTypes: Record<string, number>;
    };
  } | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) return null;

    const members = await this.getCheckpointMembers(checkpointId);

    // Get stats
    const statsQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      OPTIONAL MATCH (m)-[r]->()
      RETURN
        m.type as entityType,
        type(r) as relType,
        count(r) as relCount
    `;

    const statsResult = await this.neo4j.executeCypher(statsQuery, { checkpointId });

    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};
    let totalRelationships = 0;

    statsResult.forEach(row => {
      if (row.entityType) {
        entityTypes[row.entityType] = (entityTypes[row.entityType] || 0) + 1;
      }
      if (row.relType && row.relCount > 0) {
        relationshipTypes[row.relType] = (relationshipTypes[row.relType] || 0) + row.relCount;
        totalRelationships += row.relCount;
      }
    });

    return {
      checkpoint,
      members,
      stats: {
        entityTypes,
        totalRelationships,
        relationshipTypes,
      },
    };
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(checkpointId: string): Promise<void> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      DETACH DELETE c
    `;

    await this.neo4j.executeCypher(query, { checkpointId });
    this.emit('checkpoint:deleted', { checkpointId });
  }

  /**
   * Export checkpoint data
   */
  async exportCheckpoint(checkpointId: string): Promise<{
    checkpoint: CheckpointInfo;
    entities: Entity[];
    relationships: any[];
  } | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) return null;

    const entities = await this.getCheckpointMembers(checkpointId);

    // Get relationships between checkpoint members
    const relQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(from:Entity)
      MATCH (c)-[:INCLUDES]->(to:Entity)
      MATCH (from)-[r]->(to)
      RETURN r, from.id as fromId, to.id as toId
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, { checkpointId });
    const relationships = relResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    return {
      checkpoint,
      entities,
      relationships,
    };
  }

  /**
   * Import checkpoint data
   */
  async importCheckpoint(checkpointData: {
    checkpoint: CheckpointInfo;
    entities: Entity[];
    relationships: any[];
  }): Promise<string> {
    const { checkpoint, entities, relationships } = checkpointData;

    // Import entities first
    for (const entity of entities) {
      const query = `
        MERGE (e:Entity {id: $id})
        SET e += $properties
      `;
      await this.neo4j.executeCypher(query, {
        id: entity.id,
        properties: entity,
      });
    }

    // Import relationships
    for (const rel of relationships) {
      const query = `
        MATCH (from:Entity {id: $fromId})
        MATCH (to:Entity {id: $toId})
        MERGE (from)-[r:${rel.type}]->(to)
        SET r += $properties
      `;
      await this.neo4j.executeCypher(query, {
        fromId: rel.fromId,
        toId: rel.toId,
        properties: rel.properties || {},
      });
    }

    // Create checkpoint node
    const checkpointId = `imported_${Date.now().toString(36)}`;
    await this.neo4j.executeCypher(
      `
      MERGE (c:Checkpoint {id: $id})
      SET c.timestamp = $timestamp
      SET c.reason = $reason
      SET c.seedEntities = $seeds
      SET c.description = $description
      SET c.metadata = $metadata
      SET c.imported = true
      `,
      {
        id: checkpointId,
        timestamp: checkpoint.timestamp.toISOString(),
        reason: checkpoint.reason,
        seeds: JSON.stringify(checkpoint.seedEntities),
        description: `Imported checkpoint from ${checkpoint.id}`,
        metadata: JSON.stringify(checkpoint.metadata || {}),
      }
    );

    // Link entities to checkpoint
    const entityIds = entities.map(e => e.id);
    if (entityIds.length > 0) {
      await this.neo4j.executeCypher(
        `
        MATCH (c:Checkpoint {id: $checkpointId})
        UNWIND $entityIds AS entityId
        MATCH (e:Entity {id: entityId})
        MERGE (c)-[:INCLUDES]->(e)
        `,
        { checkpointId, entityIds }
      );
    }

    this.emit('checkpoint:imported', { checkpointId, entityCount: entities.length });
    return checkpointId;
  }

  /**
   * Get entity timeline
   */
  async getEntityTimeline(
    entityId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    entity: Entity | null;
    versions: VersionInfo[];
    relationships: any[];
  }> {
    // Get entity
    const entityQuery = `MATCH (e:Entity {id: $entityId}) RETURN e`;
    const entityResult = await this.neo4j.executeCypher(entityQuery, { entityId });
    const entity = entityResult.length > 0 ? this.parseEntity(entityResult[0].e) : null;

    // Get versions
    const where: string[] = ['v.entityId = $entityId'];
    const params: Record<string, any> = { entityId };

    if (options?.since) {
      where.push('v.timestamp >= $since');
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push('v.timestamp <= $until');
      params.until = options.until.toISOString();
    }

    const versionQuery = `
      MATCH (v:Version)
      WHERE ${where.join(' AND ')}
      RETURN v
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const versionResult = await this.neo4j.executeCypher(versionQuery, params);
    const versions = versionResult.map(row => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));

    // Get relationship timeline
    const relQuery = `
      MATCH (e:Entity {id: $entityId})-[r]-()
      WHERE r.validFrom IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, { entityId, limit: params.limit });
    const relationships = relResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    return { entity, versions, relationships };
  }

  /**
   * Get relationship timeline
   */
  async getRelationshipTimeline(
    relationshipId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<any[]> {
    const where: string[] = ['r.id = $relationshipId'];
    const params: Record<string, any> = { relationshipId };

    if (options?.since) {
      where.push('r.validFrom >= $since');
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push('r.validTo <= $until');
      params.until = options.until.toISOString();
    }

    const query = `
      MATCH ()-[r]->()
      WHERE ${where.join(' AND ')}
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const result = await this.neo4j.executeCypher(query, params);
    return result.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));
  }

  /**
   * Get session timeline
   */
  async getSessionTimeline(
    sessionId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    versions: VersionInfo[];
    relationships: any[];
    checkpoints: CheckpointInfo[];
  }> {
    const where: string[] = [];
    const params: Record<string, any> = { sessionId };

    if (options?.since) {
      where.push('timestamp >= $since');
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push('timestamp <= $until');
      params.until = options.until.toISOString();
    }

    const whereClause = where.length > 0 ? `AND ${where.join(' AND ')}` : '';

    // Get versions for session
    const versionQuery = `
      MATCH (v:Version)
      WHERE v.changeSetId = $sessionId ${whereClause}
      RETURN v
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const versionResult = await this.neo4j.executeCypher(versionQuery, params);
    const versions = versionResult.map(row => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));

    // Get relationships for session
    const relQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId ${whereClause}
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, params);
    const relationships = relResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Get checkpoints (if any mention this session)
    const checkpointQuery = `
      MATCH (c:Checkpoint)
      WHERE c.metadata CONTAINS $sessionId ${whereClause}
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
      ORDER BY c.timestamp DESC
      LIMIT $limit
    `;

    const checkpointResult = await this.neo4j.executeCypher(checkpointQuery, params);
    const checkpoints = checkpointResult.map(row => ({
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || '[]'),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    }));

    return { versions, relationships, checkpoints };
  }

  /**
   * Get session impacts
   */
  async getSessionImpacts(sessionId: string): Promise<{
    entitiesModified: Entity[];
    relationshipsCreated: any[];
    relationshipsClosed: any[];
    metrics: {
      totalEntities: number;
      totalRelationships: number;
      timespan?: { start: Date; end: Date };
    };
  }> {
    // Get entities modified in session
    const entityQuery = `
      MATCH (v:Version {changeSetId: $sessionId})-[:VERSION_OF]->(e:Entity)
      RETURN DISTINCT e
    `;

    const entityResult = await this.neo4j.executeCypher(entityQuery, { sessionId });
    const entitiesModified = entityResult.map(row => this.parseEntity(row.e));

    // Get relationships created in session
    const createdQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId AND r.validFrom IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
    `;

    const createdResult = await this.neo4j.executeCypher(createdQuery, { sessionId });
    const relationshipsCreated = createdResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Get relationships closed in session (if any)
    const closedQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId AND r.validTo IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
    `;

    const closedResult = await this.neo4j.executeCypher(closedQuery, { sessionId });
    const relationshipsClosed = closedResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Calculate metrics
    const timestamps = [
      ...relationshipsCreated.map(r => r.properties?.validFrom).filter(Boolean),
      ...relationshipsClosed.map(r => r.properties?.validTo).filter(Boolean),
    ].map(t => new Date(t));

    const timespan = timestamps.length > 0 ? {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime()))),
    } : undefined;

    return {
      entitiesModified,
      relationshipsCreated,
      relationshipsClosed,
      metrics: {
        totalEntities: entitiesModified.length,
        totalRelationships: relationshipsCreated.length + relationshipsClosed.length,
        timespan,
      },
    };
  }

  /**
   * Get sessions affecting an entity
   */
  async getSessionsAffectingEntity(
    entityId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    sessions: string[];
    details: Array<{
      sessionId: string;
      versionCount: number;
      relationshipCount: number;
      timespan: { start: Date; end: Date };
    }>;
  }> {
    const where: string[] = ['v.entityId = $entityId'];
    const params: Record<string, any> = { entityId };

    if (options?.since) {
      where.push('v.timestamp >= $since');
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push('v.timestamp <= $until');
      params.until = options.until.toISOString();
    }

    const query = `
      MATCH (v:Version)
      WHERE ${where.join(' AND ')} AND v.changeSetId IS NOT NULL
      OPTIONAL MATCH (e:Entity {id: $entityId})-[r]->()
      WHERE r.changeSetId = v.changeSetId
      WITH v.changeSetId as sessionId,
           count(DISTINCT v) as versionCount,
           count(DISTINCT r) as relationshipCount,
           min(v.timestamp) as startTime,
           max(v.timestamp) as endTime
      RETURN sessionId, versionCount, relationshipCount, startTime, endTime
      ORDER BY startTime DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 50;

    const result = await this.neo4j.executeCypher(query, params);

    const details = result.map(row => ({
      sessionId: row.sessionId,
      versionCount: row.versionCount,
      relationshipCount: row.relationshipCount,
      timespan: {
        start: new Date(row.startTime),
        end: new Date(row.endTime),
      },
    }));

    const sessions = [...new Set(details.map(d => d.sessionId))];

    return { sessions, details };
  }

  /**
   * Get changes for a session
   */
  async getChangesForSession(
    sessionId: string,
    options?: { entityTypes?: string[]; relationshipTypes?: string[]; limit?: number }
  ): Promise<{
    versions: VersionInfo[];
    relationships: any[];
    summary: {
      entitiesAffected: number;
      relationshipsAffected: number;
      entityTypes: Record<string, number>;
      relationshipTypes: Record<string, number>;
    };
  }> {
    // Get versions
    const versionQuery = `
      MATCH (v:Version {changeSetId: $sessionId})
      MATCH (v)-[:VERSION_OF]->(e:Entity)
      ${options?.entityTypes ? 'WHERE e.type IN $entityTypes' : ''}
      RETURN v, e.type as entityType
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    const versionParams: any = { sessionId, limit: options?.limit || 100 };
    if (options?.entityTypes) {
      versionParams.entityTypes = options.entityTypes;
    }

    const versionResult = await this.neo4j.executeCypher(versionQuery, versionParams);
    const versions = versionResult.map(row => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));

    // Get relationships
    const relQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      ${options?.relationshipTypes ? 'AND type(r) IN $relationshipTypes' : ''}
      RETURN r, type(r) as relType, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relParams: any = { sessionId, limit: options?.limit || 100 };
    if (options?.relationshipTypes) {
      relParams.relationshipTypes = options.relationshipTypes;
    }

    const relResult = await this.neo4j.executeCypher(relQuery, relParams);
    const relationships = relResult.map(row => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Build summary
    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    versionResult.forEach(row => {
      if (row.entityType) {
        entityTypes[row.entityType] = (entityTypes[row.entityType] || 0) + 1;
      }
    });

    relResult.forEach(row => {
      if (row.relType) {
        relationshipTypes[row.relType] = (relationshipTypes[row.relType] || 0) + 1;
      }
    });

    return {
      versions,
      relationships,
      summary: {
        entitiesAffected: new Set(versions.map(v => v.entityId)).size,
        relationshipsAffected: relationships.length,
        entityTypes,
        relationshipTypes,
      },
    };
  }
}