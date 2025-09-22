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
}