/**
 * Version Manager
 * Handles version creation, pruning, and entity timeline operations
 */
import { EventEmitter } from "events";
export class VersionManager extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
        this.historyEnabled = process.env.HISTORY_ENABLED !== "false";
    }
    /**
     * Append a version for an entity
     */
    async appendVersion(entity, options) {
        if (!this.historyEnabled) {
            return `ver_disabled_${Date.now().toString(36)}`;
        }
        const entityId = entity.id;
        const timestamp = (options === null || options === void 0 ? void 0 : options.timestamp) || new Date();
        const hash = entity.hash || Date.now().toString(36);
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
            path: entity.path || null,
            language: entity.language || null,
            changeSetId: (options === null || options === void 0 ? void 0 : options.changeSetId) || null,
        });
        this.emit("version:created", { entityId, versionId, timestamp });
        return versionId;
    }
    /**
     * Prune old history data
     */
    async pruneHistory(retentionDays, options) {
        var _a, _b, _c;
        if (!this.historyEnabled) {
            return { versions: 0, closedEdges: 0, checkpoints: 0 };
        }
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);
        const batchSize = (options === null || options === void 0 ? void 0 : options.batchSize) || 1000;
        let totalVersions = 0;
        let totalEdges = 0;
        let totalCheckpoints = 0;
        if (!(options === null || options === void 0 ? void 0 : options.dryRun)) {
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
            totalVersions = ((_a = versionResult[0]) === null || _a === void 0 ? void 0 : _a.deleted) || 0;
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
            totalEdges = ((_b = edgeResult[0]) === null || _b === void 0 ? void 0 : _b.closed) || 0;
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
            totalCheckpoints = ((_c = checkpointResult[0]) === null || _c === void 0 ? void 0 : _c.deleted) || 0;
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
    async getEntityTimeline(entityId, options) {
        var _a, _b;
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
            startTime: ((_a = options === null || options === void 0 ? void 0 : options.startTime) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
            endTime: ((_b = options === null || options === void 0 ? void 0 : options.endTime) === null || _b === void 0 ? void 0 : _b.toISOString()) || null,
            limit: (options === null || options === void 0 ? void 0 : options.limit) || 100,
        });
        return result.map((r) => ({
            ...r.version,
            timestamp: new Date(r.version.timestamp),
        }));
    }
}
//# sourceMappingURL=VersionManager.js.map