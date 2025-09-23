/**
 * Statistics Collection Service
 * Handles edge statistics computation and storage
 */
import { EventEmitter } from "events";
import { buildEntityStatsQueries } from "./queries.js";
export class StatsCollector extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Compute and store edge statistics
     */
    async computeAndStoreEdgeStats(entityId) {
        const stats = await this.getEntityEdgeStats(entityId);
        const query = `
      MERGE (s:EdgeStats {id: $statsId})
      SET s.entityId = $entityId
      SET s.payload = $payload
      SET s.updatedAt = datetime()
    `;
        await this.neo4j.executeCypher(query, {
            statsId: `stats_${entityId}`,
            entityId,
            payload: JSON.stringify(stats),
        });
        this.emit("stats:computed", { entityId, stats });
    }
    /**
     * Get entity edge statistics
     */
    async getEntityEdgeStats(entityId) {
        var _a, _b;
        const queries = buildEntityStatsQueries(entityId);
        const results = await Promise.all([
            this.neo4j.executeCypher(queries.byType, { entityId }),
            this.neo4j.executeCypher(queries.topSymbols, { entityId }),
            this.neo4j.executeCypher(queries.inbound, { entityId }),
            this.neo4j.executeCypher(queries.outbound, { entityId }),
        ]);
        const byType = {};
        results[0].forEach((r) => {
            byType[r.type] = r.count;
        });
        const topSymbols = results[1].map((r) => ({
            symbol: r.symbol,
            count: r.count,
        }));
        const inbound = ((_a = results[2][0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        const outbound = ((_b = results[3][0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        return {
            byType,
            topSymbols,
            inbound,
            outbound,
            total: inbound + outbound,
            avgDegree: (inbound + outbound) / 2, // Simplified average degree
        };
    }
    /**
     * Get global statistics summary
     */
    async getGlobalStatsSummary() {
        var _a, _b;
        const queries = [
            {
                name: "entityCount",
                query: "MATCH (n:Entity) RETURN count(n) AS count",
            },
            {
                name: "relationshipCount",
                query: "MATCH ()-[r]->() RETURN count(r) AS count",
            },
            {
                name: "mostConnected",
                query: `
          MATCH (n:Entity)
          OPTIONAL MATCH (n)-[r]-()
          RETURN n.id AS id, count(r) AS relationshipCount
          ORDER BY relationshipCount DESC
          LIMIT 1
        `,
            },
            {
                name: "typeDistribution",
                query: `
          MATCH ()-[r]->()
          RETURN type(r) AS type, count(r) AS count
          ORDER BY count DESC
        `,
            },
        ];
        const results = await Promise.all(queries.map((q) => this.neo4j.executeCypher(q.query)));
        const totalEntities = ((_a = results[0][0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        const totalRelationships = ((_b = results[1][0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        const mostConnected = results[2][0] || { id: "", relationshipCount: 0 };
        const relationshipTypeDistribution = {};
        results[3].forEach((r) => {
            relationshipTypeDistribution[r.type] = r.count;
        });
        return {
            totalEntities,
            totalRelationships,
            avgRelationshipsPerEntity: totalEntities > 0 ? totalRelationships / totalEntities : 0,
            mostConnectedEntity: {
                id: mostConnected.id,
                relationshipCount: mostConnected.relationshipCount,
            },
            relationshipTypeDistribution,
        };
    }
    /**
     * Get cached statistics for an entity
     */
    async getCachedEntityStats(entityId) {
        const query = `
      MATCH (s:EdgeStats {id: $statsId})
      RETURN s.payload AS payload
    `;
        const result = await this.neo4j.executeCypher(query, {
            statsId: `stats_${entityId}`,
        });
        if (result.length === 0) {
            return null;
        }
        try {
            return JSON.parse(result[0].payload);
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Compute statistics for multiple entities in batch
     */
    async computeBatchStats(entityIds) {
        const stats = {};
        // Process in batches to avoid overwhelming the database
        const batchSize = 10;
        for (let i = 0; i < entityIds.length; i += batchSize) {
            const batch = entityIds.slice(i, i + batchSize);
            const batchPromises = batch.map((id) => this.getEntityEdgeStats(id));
            const batchResults = await Promise.all(batchPromises);
            batch.forEach((id, index) => {
                stats[id] = batchResults[index];
            });
        }
        return stats;
    }
    /**
     * Clean up old statistics
     */
    async cleanupOldStats(olderThanDays = 30) {
        var _a;
        const query = `
      MATCH (s:EdgeStats)
      WHERE s.updatedAt < datetime() - duration({days: $days})
      DETACH DELETE s
      RETURN count(s) AS deletedCount
    `;
        const result = await this.neo4j.executeCypher(query, {
            days: olderThanDays,
        });
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.deletedCount) || 0;
    }
    /**
     * Get statistics trends over time
     */
    async getStatsTrends(entityId, timeRange) {
        // This would require storing historical stats in a time series
        // For now, return current stats as a placeholder
        const currentStats = await this.getEntityEdgeStats(entityId);
        return [
            {
                timestamp: new Date(),
                stats: currentStats,
            },
        ];
    }
    /**
     * Analyze relationship patterns
     */
    async analyzeRelationshipPatterns() {
        var _a;
        // Most common relationship types
        const typeQuery = `
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
      LIMIT 10
    `;
        const typeResult = await this.neo4j.executeCypher(typeQuery);
        const totalRelationships = typeResult.reduce((sum, r) => sum + r.count, 0);
        const mostCommonTypes = typeResult.map((r) => ({
            type: r.type,
            count: r.count,
            percentage: (r.count / totalRelationships) * 100,
        }));
        // Connectivity distribution (simplified)
        const degreeQuery = `
      MATCH (n:Entity)
      OPTIONAL MATCH (n)-[r]-()
      WITH n, count(r) AS degree
      RETURN degree, count(n) AS entityCount
      ORDER BY degree
    `;
        const degreeResult = await this.neo4j.executeCypher(degreeQuery);
        const connectivityDistribution = degreeResult.map((r) => ({
            degree: r.degree,
            entityCount: r.entityCount,
        }));
        // Simplified clustering coefficient
        const clusterQuery = `
      MATCH (n:Entity)
      OPTIONAL MATCH (n)-[r1]-()-[r2]-(n)
      WHERE type(r1) = type(r2)
      WITH n, count(DISTINCT r1) AS triangles
      OPTIONAL MATCH (n)-[r]-()
      WITH n, triangles, count(r) AS degree
      WHERE degree > 1
      RETURN avg(toFloat(triangles) / (degree * (degree - 1))) AS averageClustering
    `;
        const clusterResult = await this.neo4j.executeCypher(clusterQuery);
        const averageClustering = ((_a = clusterResult[0]) === null || _a === void 0 ? void 0 : _a.averageClustering) || 0;
        return {
            mostCommonTypes,
            connectivityDistribution,
            clusterCoefficients: {
                average: averageClustering,
                global: 0, // Would need more complex calculation
            },
        };
    }
}
//# sourceMappingURL=StatsCollector.js.map