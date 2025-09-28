/**
 * Checkpoint Service
 * Handles checkpoint creation, management, and member operations
 */

import { EventEmitter } from 'events';
import { Neo4jService } from '../Neo4jService.js';
import { Entity } from '@memento/shared-types.js';
import { TimeRangeParams } from '../../../models/types.js';

export interface CheckpointOptions {
  reason: 'daily' | 'incident' | 'manual';
  hops?: number;
  window?: TimeRangeParams;
  description?: string;
}

export interface CheckpointInfo {
  id: string;
  timestamp: Date;
  reason: string;
  seedEntities: string[];
  memberCount: number;
  metadata?: Record<string, any>;
}

export interface CheckpointSummary {
  checkpoint: CheckpointInfo;
  members: Entity[];
  relationships: number;
  lastActivity?: Date;
}

export class CheckpointService extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== 'false';
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

    const memberIds = memberResult.map((r) => r.id).filter(Boolean);

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
   * List checkpoints with optional filtering
   */
  async listCheckpoints(options?: {
    reason?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<CheckpointInfo[]> {
    const query = `
      MATCH (c:Checkpoint)
      WHERE ($reason IS NULL OR c.reason = $reason)
        AND ($startTime IS NULL OR c.timestamp >= $startTime)
        AND ($endTime IS NULL OR c.timestamp <= $endTime)
      RETURN c {
        .id,
        .timestamp,
        .reason,
        .seedEntities,
        .description,
        .metadata
      } as checkpoint
      ORDER BY c.timestamp DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      reason: options?.reason || null,
      startTime: options?.startTime?.toISOString() || null,
      endTime: options?.endTime?.toISOString() || null,
      limit: options?.limit || 50,
    });

    return result.map((r) => {
      const checkpoint = r.checkpoint;
      return {
        id: checkpoint.id,
        timestamp: new Date(checkpoint.timestamp),
        reason: checkpoint.reason,
        seedEntities: JSON.parse(checkpoint.seedEntities || '[]'),
        memberCount: 0, // Will be populated by getCheckpointMembers if needed
        metadata: JSON.parse(checkpoint.metadata || '{}'),
      };
    });
  }

  /**
   * Get checkpoint information
   */
  async getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      OPTIONAL MATCH (c)-[:INCLUDES]->(member:Entity)
      RETURN c {
        .id,
        .timestamp,
        .reason,
        .seedEntities,
        .description,
        .metadata
      } as checkpoint,
      count(member) as memberCount
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });

    if (result.length === 0) {
      return null;
    }

    const record = result[0];
    const checkpoint = record.checkpoint;

    return {
      id: checkpoint.id,
      timestamp: new Date(checkpoint.timestamp),
      reason: checkpoint.reason,
      seedEntities: JSON.parse(checkpoint.seedEntities || '[]'),
      memberCount: record.memberCount,
      metadata: JSON.parse(checkpoint.metadata || '{}'),
    };
  }

  /**
   * Get checkpoint members
   */
  async getCheckpointMembers(checkpointId: string): Promise<Entity[]> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(member:Entity)
      RETURN member
      ORDER BY member.id
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    return result.map((r) => r.member);
  }

  /**
   * Get checkpoint summary with members and relationships
   */
  async getCheckpointSummary(
    checkpointId: string
  ): Promise<CheckpointSummary | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) {
      return null;
    }

    const members = await this.getCheckpointMembers(checkpointId);

    // Count relationships between members
    const relationshipQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m1:Entity),
            (c)-[:INCLUDES]->(m2:Entity),
            (m1)-[r]->(m2)
      WHERE m1.id < m2.id
      RETURN count(r) as relationshipCount
    `;

    const relationshipResult = await this.neo4j.executeCypher(
      relationshipQuery,
      { checkpointId }
    );

    // Get last activity
    const activityQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      OPTIONAL MATCH (m)<-[:VERSION_OF]-(v:Version)
      RETURN max(v.timestamp) as lastActivity
    `;

    const activityResult = await this.neo4j.executeCypher(activityQuery, {
      checkpointId,
    });

    return {
      checkpoint,
      members,
      relationships: relationshipResult[0]?.relationshipCount || 0,
      lastActivity: activityResult[0]?.lastActivity
        ? new Date(activityResult[0].lastActivity)
        : undefined,
    };
  }

  /**
   * Delete a checkpoint
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
  async exportCheckpoint(checkpointId: string): Promise<any> {
    const summary = await this.getCheckpointSummary(checkpointId);
    if (!summary) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    return {
      checkpoint: summary.checkpoint,
      members: summary.members,
      relationships: summary.relationships,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import checkpoint data
   */
  async importCheckpoint(checkpointData: any): Promise<string> {
    const { checkpoint, members } = checkpointData;

    // Recreate the checkpoint
    const result = await this.createCheckpoint(checkpoint.seedEntities, {
      reason: checkpoint.reason,
      description: checkpoint.description,
      window: checkpoint.metadata,
    });

    // Note: In a full implementation, we'd need to restore the exact member relationships
    // This is a simplified version

    return result.checkpointId;
  }
}
