/**
 * Temporal Query Service
 * Handles temporal traversals, metrics, and complex time-based queries
 */

import { EventEmitter } from 'events';
import { Neo4jService } from '../Neo4jService.js';
import { RelationshipType } from '@memento/shared-types.js';
import { TimeRangeParams, TraversalQuery } from '../../../models/types.js';

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

export interface SessionImpact {
  sessionId: string;
  changes: number;
  entities: string[];
  relationships: number;
  timestamp: Date;
}

export class TemporalQueryService extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== 'false';
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
   * Time travel traversal - query relationships as they existed at a point in time
   */
  async timeTravelTraversal(query: TraversalQuery): Promise<any> {
    const {
      startId: startEntityId,
      until: atTime,
      maxDepth = 3,
      relationshipTypes,
    } = query;
    const direction = 'outgoing'; // Default direction

    const timeCondition = atTime
      ? `WHERE r.validFrom <= $atTime AND (r.validTo IS NULL OR r.validTo > $atTime)`
      : '';

    const relTypeFilter =
      relationshipTypes && relationshipTypes.length > 0
        ? `AND type(r) IN $relationshipTypes`
        : '';

    const traversalQuery = `
      MATCH (start:Entity {id: $startEntityId})
      CALL apoc.path.expandConfig(start, {
        relationshipFilter: '${
          direction === 'outgoing' ? '>' : '<'
        }${relTypeFilter}',
        minLevel: 1,
        maxLevel: $maxDepth,
        uniqueness: 'NODE_GLOBAL'
      })
      YIELD path
      MATCH (start)-[r*1..${maxDepth}]-(end:Entity)
      WHERE ALL(rel IN r ${timeCondition} ${relTypeFilter})
      RETURN path, length(path) as depth
      ORDER BY depth
      LIMIT 100
    `;

    const result = await this.neo4j.executeCypher(traversalQuery, {
      startEntityId,
      atTime: atTime?.toISOString(),
      maxDepth,
      relationshipTypes: relationshipTypes || [],
    });

    return result;
  }

  /**
   * Get comprehensive history metrics
   */
  async getHistoryMetrics(): Promise<HistoryMetrics> {
    const queries = [
      // Version counts
      `MATCH (v:Version) RETURN count(v) as versions`,

      // Checkpoint counts and member stats
      `
      MATCH (c:Checkpoint)
      OPTIONAL MATCH (c)-[:INCLUDES]->(m:Entity)
      RETURN count(DISTINCT c) as checkpoints,
             avg(size(collect(DISTINCT m))) as avgMembers,
             min(size(collect(DISTINCT m))) as minMembers,
             max(size(collect(DISTINCT m))) as maxMembers
      `,

      // Temporal edge counts
      `
      MATCH ()-[r]->()
      WHERE r.validFrom IS NOT NULL
      RETURN sum(CASE WHEN r.validTo IS NULL THEN 1 ELSE 0 END) as open,
             sum(CASE WHEN r.validTo IS NOT NULL THEN 1 ELSE 0 END) as closed
      `,
    ];

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q))
    );

    const [versionResult, checkpointResult, edgeResult] = results;

    return {
      versions: versionResult[0]?.versions || 0,
      checkpoints: checkpointResult[0]?.checkpoints || 0,
      checkpointMembers: {
        avg: checkpointResult[0]?.avgMembers || 0,
        min: checkpointResult[0]?.minMembers || 0,
        max: checkpointResult[0]?.maxMembers || 0,
      },
      temporalEdges: {
        open: edgeResult[0]?.open || 0,
        closed: edgeResult[0]?.closed || 0,
      },
    };
  }

  /**
   * Get relationship timeline
   */
  async getRelationshipTimeline(
    relationshipId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      includeVersions?: boolean;
    }
  ): Promise<any[]> {
    const query = `
      MATCH ()-[r]->()
      WHERE r.id = $relationshipId OR elementId(r) = $relationshipId
      OPTIONAL MATCH (r)-[:VERSION_OF]-(v:Version)
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN r {
        .id,
        .validFrom,
        .validTo,
        .active,
        .changeSetId,
        .lastModified,
        versions: collect(v {.id, .timestamp, .changeSetId})
      } as timeline
      ORDER BY r.validFrom
    `;

    const result = await this.neo4j.executeCypher(query, {
      relationshipId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
    });

    return result.map((r) => r.timeline);
  }

  /**
   * Get session timeline
   */
  async getSessionTimeline(
    sessionId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      includeRelationships?: boolean;
    }
  ): Promise<any[]> {
    const query = `
      MATCH (v:Version {changeSetId: $sessionId})
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      OPTIONAL MATCH (v)-[:VERSION_OF]->(e:Entity)
      OPTIONAL MATCH (e)-[r]-()
      WHERE r.changeSetId = $sessionId
      RETURN v {
        .id,
        .entityId,
        .timestamp,
        .hash,
        .path,
        .language,
        entity: e {.id, .name, .type},
        relationships: collect(DISTINCT r {.id, .type})
      } as sessionEntry
      ORDER BY v.timestamp
    `;

    const result = await this.neo4j.executeCypher(query, {
      sessionId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
    });

    return result.map((r) => r.sessionEntry);
  }

  /**
   * Get impacts of a session on the graph
   */
  async getSessionImpacts(sessionId: string): Promise<SessionImpact> {
    const query = `
      MATCH (v:Version {changeSetId: $sessionId})
      WITH collect(DISTINCT v.entityId) as entities, count(v) as versions
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      RETURN entities, versions, count(r) as relationships
    `;

    const result = await this.neo4j.executeCypher(query, { sessionId });

    if (result.length === 0) {
      return {
        sessionId,
        changes: 0,
        entities: [],
        relationships: 0,
        timestamp: new Date(),
      };
    }

    const record = result[0];

    return {
      sessionId,
      changes: record.versions + record.relationships,
      entities: record.entities,
      relationships: record.relationships,
      timestamp: new Date(), // Would need to get actual session timestamp
    };
  }

  /**
   * Get sessions that affected a specific entity
   */
  async getSessionsAffectingEntity(
    entityId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    }
  ): Promise<any[]> {
    const query = `
      MATCH (e:Entity {id: $entityId})<-[:VERSION_OF]-(v:Version)
      WHERE v.changeSetId IS NOT NULL
        AND ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN DISTINCT v.changeSetId as sessionId,
                      min(v.timestamp) as firstChange,
                      max(v.timestamp) as lastChange,
                      count(v) as changes
      ORDER BY lastChange DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
      limit: options?.limit || 50,
    });

    return result.map((r) => ({
      sessionId: r.sessionId,
      firstChange: new Date(r.firstChange),
      lastChange: new Date(r.lastChange),
      changes: r.changes,
    }));
  }

  /**
   * Get all changes for a specific session
   */
  async getChangesForSession(
    sessionId: string,
    options?: {
      includeRelationships?: boolean;
      includeEntityDetails?: boolean;
    }
  ): Promise<any> {
    const versionQuery = `
      MATCH (v:Version {changeSetId: $sessionId})
      OPTIONAL MATCH (v)-[:VERSION_OF]->(e:Entity)
      RETURN collect(v {
        .id,
        .entityId,
        .timestamp,
        .hash,
        .path,
        .language,
        entity: CASE WHEN $includeEntityDetails THEN e ELSE null END
      }) as versions
    `;

    const relationshipQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      RETURN collect(r {
        .id,
        .type,
        .validFrom,
        .validTo,
        .active,
        .lastModified
      }) as relationships
    `;

    const [versionResult, relationshipResult] = await Promise.all([
      this.neo4j.executeCypher(versionQuery, {
        sessionId,
        includeEntityDetails: options?.includeEntityDetails || false,
      }),
      options?.includeRelationships
        ? this.neo4j.executeCypher(relationshipQuery, { sessionId })
        : Promise.resolve([{ relationships: [] }]),
    ]);

    return {
      sessionId,
      versions: versionResult[0]?.versions || [],
      relationships: relationshipResult[0]?.relationships || [],
      totalChanges:
        (versionResult[0]?.versions?.length || 0) +
        (relationshipResult[0]?.relationships?.length || 0),
    };
  }
}
