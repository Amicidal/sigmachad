/**
 * HistoryManager - Handles all temporal and history operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */
export class HistoryManager {
    constructor(historyService, neo4jService) {
        this.historyService = historyService;
        this.neo4jService = neo4jService;
    }
    async appendVersion(entity, options) {
        return this.historyService.appendVersion(entity, options);
    }
    async createCheckpoint(seedEntities, options) {
        return this.historyService.createCheckpoint(seedEntities, options);
    }
    async pruneHistory(retentionDays, options) {
        return this.historyService.pruneHistory(retentionDays, options);
    }
    async listCheckpoints(options) {
        return this.historyService.listCheckpoints(options);
    }
    async getHistoryMetrics() {
        return this.historyService.getHistoryMetrics();
    }
    async timeTravelTraversal(query) {
        return this.historyService.timeTravelTraversal(query);
    }
    async exportCheckpoint(checkpointId) {
        return this.historyService.exportCheckpoint(checkpointId);
    }
    async importCheckpoint(checkpointData) {
        return this.historyService.importCheckpoint(checkpointData);
    }
    async getCheckpoint(checkpointId) {
        return this.historyService.getCheckpoint(checkpointId);
    }
    async getCheckpointMembers(checkpointId) {
        return this.historyService.getCheckpointMembers(checkpointId);
    }
    async getCheckpointSummary(checkpointId) {
        return this.historyService.getCheckpointSummary(checkpointId);
    }
    async deleteCheckpoint(checkpointId) {
        return this.historyService.deleteCheckpoint(checkpointId);
    }
    async getEntityTimeline(entityId, options) {
        return this.historyService.getEntityTimeline(entityId, options);
    }
    async getRelationshipTimeline(relationshipId, options) {
        return this.historyService.getRelationshipTimeline(relationshipId, options);
    }
    async getSessionTimeline(sessionId, options) {
        return this.historyService.getSessionTimeline(sessionId, options);
    }
    async getSessionImpacts(sessionId) {
        return this.historyService.getSessionImpacts(sessionId);
    }
    async getSessionsAffectingEntity(entityId, options) {
        return this.historyService.getSessionsAffectingEntity(entityId, options);
    }
    async getChangesForSession(sessionId, options) {
        return this.historyService.getChangesForSession(sessionId, options);
    }
    async openEdge(fromId, toId, type, ts, changeSetId) {
        return this.historyService.openEdge(fromId, toId, type, ts, changeSetId);
    }
    async closeEdge(fromId, toId, type, ts) {
        return this.historyService.closeEdge(fromId, toId, type, ts);
    }
    async repairPreviousVersionLink(versionId) {
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
    async annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId, relationshipIds, timestamp) {
        // This is a compatibility method for session checkpoint management
        // It links relationships created in a session to a specific checkpoint
        const at = timestamp || new Date();
        let query;
        let params;
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
        }
        else {
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
    async createSessionCheckpointLink(sessionId, checkpointId, metadata) {
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
//# sourceMappingURL=HistoryManager.js.map