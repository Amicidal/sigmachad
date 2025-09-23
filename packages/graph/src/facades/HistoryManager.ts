/**
 * HistoryManager - Handles all temporal and history operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */

import { Entity } from "../models/entities.js";

interface HistoryService {
  appendVersion(entity: Entity, options?: any): Promise<string>;
  createCheckpoint(seedEntities: string[], options: any): Promise<any>;
  pruneHistory(retentionDays: number, options?: any): Promise<any>;
  listCheckpoints(options?: any): Promise<any>;
  getHistoryMetrics(): Promise<any>;
  timeTravelTraversal(query: any): Promise<any>;
  exportCheckpoint(checkpointId: string): Promise<any>;
  importCheckpoint(checkpointData: any): Promise<any>;
  getCheckpoint(checkpointId: string): Promise<any>;
  getCheckpointMembers(checkpointId: string): Promise<any>;
  getCheckpointSummary(checkpointId: string): Promise<any>;
  deleteCheckpoint(checkpointId: string): Promise<void>;
  getEntityTimeline(entityId: string, options?: any): Promise<any>;
  getRelationshipTimeline(relationshipId: string, options?: any): Promise<any>;
  getSessionTimeline(sessionId: string, options?: any): Promise<any>;
  getSessionImpacts(sessionId: string): Promise<any>;
  getSessionsAffectingEntity(entityId: string, options?: any): Promise<any>;
  getChangesForSession(sessionId: string, options?: any): Promise<any>;
  openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void>;
  closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
}

interface Neo4jService {
  executeCypher(query: string, params: any): Promise<any>;
}

export class HistoryManager {
  private historyService: HistoryService;
  private neo4jService: Neo4jService;

  constructor(historyService: HistoryService, neo4jService: Neo4jService) {
    this.historyService = historyService;
    this.neo4jService = neo4jService;
  }

  async appendVersion(entity: Entity, options?: any): Promise<string> {
    return this.historyService.appendVersion(entity, options);
  }

  async createCheckpoint(seedEntities: string[], options: any): Promise<any> {
    return this.historyService.createCheckpoint(seedEntities, options);
  }

  async pruneHistory(retentionDays: number, options?: any): Promise<any> {
    return this.historyService.pruneHistory(retentionDays, options);
  }

  async listCheckpoints(options?: any): Promise<any> {
    return this.historyService.listCheckpoints(options);
  }

  async getHistoryMetrics(): Promise<any> {
    return this.historyService.getHistoryMetrics();
  }

  async timeTravelTraversal(query: any): Promise<any> {
    return this.historyService.timeTravelTraversal(query);
  }

  async exportCheckpoint(checkpointId: string): Promise<any> {
    return this.historyService.exportCheckpoint(checkpointId);
  }

  async importCheckpoint(checkpointData: any): Promise<any> {
    return this.historyService.importCheckpoint(checkpointData);
  }

  async getCheckpoint(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpoint(checkpointId);
  }

  async getCheckpointMembers(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpointMembers(checkpointId);
  }

  async getCheckpointSummary(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpointSummary(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    return this.historyService.deleteCheckpoint(checkpointId);
  }

  async getEntityTimeline(entityId: string, options?: any): Promise<any> {
    return this.historyService.getEntityTimeline(entityId, options);
  }

  async getRelationshipTimeline(
    relationshipId: string,
    options?: any
  ): Promise<any> {
    return this.historyService.getRelationshipTimeline(relationshipId, options);
  }

  async getSessionTimeline(sessionId: string, options?: any): Promise<any> {
    return this.historyService.getSessionTimeline(sessionId, options);
  }

  async getSessionImpacts(sessionId: string): Promise<any> {
    return this.historyService.getSessionImpacts(sessionId);
  }

  async getSessionsAffectingEntity(
    entityId: string,
    options?: any
  ): Promise<any> {
    return this.historyService.getSessionsAffectingEntity(entityId, options);
  }

  async getChangesForSession(sessionId: string, options?: any): Promise<any> {
    return this.historyService.getChangesForSession(sessionId, options);
  }

  async openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    return this.historyService.openEdge(fromId, toId, type, ts, changeSetId);
  }

  async closeEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date
  ): Promise<void> {
    return this.historyService.closeEdge(fromId, toId, type, ts);
  }

  async repairPreviousVersionLink(versionId: string): Promise<void> {
    // This method repairs broken previous version links in the version chain
    // It's used by the TemporalHistoryValidator
    const query = `
      MATCH (v:Version {id: $versionId})-[:VERSION_OF]->(e:Entity)
      MATCH (e)<-[:VERSION_OF]-(other:Version)
      WHERE other.id <> v.id AND other.timestamp < v.timestamp
      AND NOT (v)-[:PREVIOUS_VERSION]->(:Version)
      WITH v, other
      ORDER BY other.timestamp DESC
      LIMIT 1
      CREATE (v)-[:PREVIOUS_VERSION]->(other)
    `;

    await this.neo4jService.executeCypher(query, { versionId });
  }

  // ========== Session Management Methods ==========

  async annotateSessionRelationshipsWithCheckpoint(
    sessionId: string,
    checkpointId: string,
    relationshipIds?: string[],
    timestamp?: Date
  ): Promise<void> {
    // This is a compatibility method for session checkpoint management
    // It links relationships created in a session to a specific checkpoint
    const at = timestamp || new Date();

    let query: string;
    let params: any;

    if (relationshipIds && relationshipIds.length > 0) {
      // Annotate specific relationships
      query = `
        UNWIND $relationshipIds AS relId
        MATCH ()-[r]->()
        WHERE r.id = relId OR elementId(r) = relId
        SET r.checkpointId = $checkpointId
        SET r.sessionId = $sessionId
        SET r.annotatedAt = $timestamp
      `;
      params = {
        relationshipIds,
        checkpointId,
        sessionId,
        timestamp: at.toISOString(),
      };
    } else {
      // Annotate all relationships for the session
      query = `
        MATCH ()-[r]->()
        WHERE r.changeSetId = $sessionId
        SET r.checkpointId = $checkpointId
        SET r.annotatedAt = $timestamp
      `;
      params = { sessionId, checkpointId, timestamp: at.toISOString() };
    }

    await this.neo4jService.executeCypher(query, params);
  }

  async createSessionCheckpointLink(
    sessionId: string,
    checkpointId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Create a direct link between session and checkpoint entities
    const query = `
      MERGE (s:Session {id: $sessionId})
      ON CREATE SET s.created = $timestamp
      MERGE (c:Checkpoint {id: $checkpointId})
      MERGE (s)-[r:CREATED_CHECKPOINT]->(c)
      SET r.linked = $timestamp
      SET r.metadata = $metadata
    `;

    await this.neo4jService.executeCypher(query, {
      sessionId,
      checkpointId,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(metadata || {}),
    });
  }
}
