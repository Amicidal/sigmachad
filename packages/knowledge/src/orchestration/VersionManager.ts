/**
 * Version Manager
 * Handles version creation, pruning, and entity timeline operations
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { TimeRangeParams } from "../../../models/types.js";

export interface VersionInfo {
  id: string;
  entityId: string;
  hash: string;
  timestamp: Date;
  changeSetId?: string;
  path?: string;
  language?: string;
}

export class VersionManager extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== "false";
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

    this.emit("version:created", { entityId, versionId, timestamp });
    return versionId;
  }

  /**
   * Prune old history data
   */
  async pruneHistory(
    retentionDays: number,
    options?: { dryRun?: boolean; batchSize?: number }
  ): Promise<{ versions: number; closedEdges: number; checkpoints: number }> {
    if (!this.historyEnabled) {
      return { versions: 0, closedEdges: 0, checkpoints: 0 };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const batchSize = options?.batchSize || 1000;

    let totalVersions = 0;
    let totalEdges = 0;
    let totalCheckpoints = 0;

    if (!options?.dryRun) {
      // Prune old versions
      const versionQuery = `
        MATCH (v:Version)
        WHERE v.timestamp < $cutoff
        WITH v LIMIT $batchSize
        DETACH DELETE v
        RETURN count(v) as deleted
      `;

      const versionResult = await this.neo4j.executeCypher(versionQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalVersions = versionResult[0]?.deleted || 0;

      // Close old temporal edges
      const edgeQuery = `
        MATCH ()-[r]->()
        WHERE r.validTo IS NULL AND r.validFrom < $cutoff
        WITH r LIMIT $batchSize
        SET r.validTo = $cutoff
        SET r.active = false
        RETURN count(r) as closed
      `;

      const edgeResult = await this.neo4j.executeCypher(edgeQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalEdges = edgeResult[0]?.closed || 0;

      // Clean up old checkpoints
      const checkpointQuery = `
        MATCH (c:Checkpoint)
        WHERE c.timestamp < $cutoff AND size((c)-[:INCLUDES]->()) = 0
        WITH c LIMIT $batchSize
        DELETE c
        RETURN count(c) as deleted
      `;

      const checkpointResult = await this.neo4j.executeCypher(checkpointQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalCheckpoints = checkpointResult[0]?.deleted || 0;
    }

    this.emit("history:pruned", {
      retentionDays,
      cutoff,
      versions: totalVersions,
      closedEdges: totalEdges,
      checkpoints: totalCheckpoints,
    });

    return {
      versions: totalVersions,
      closedEdges: totalEdges,
      checkpoints: totalCheckpoints,
    };
  }

  /**
   * Get entity timeline
   */
  async getEntityTimeline(
    entityId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      includeContent?: boolean;
    }
  ): Promise<VersionInfo[]> {
    const query = `
      MATCH (e:Entity {id: $entityId})<-[:VERSION_OF]-(v:Version)
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN v {
        .id,
        .entityId,
        .hash,
        .timestamp,
        .changeSetId,
        .path,
        .language
      } as version
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityId,
      startTime: options?.startTime?.toISOString() || null,
      endTime: options?.endTime?.toISOString() || null,
      limit: options?.limit || 100,
    });

    return result.map((r) => ({
      ...r.version,
      timestamp: new Date(r.version.timestamp),
    }));
  }
}
