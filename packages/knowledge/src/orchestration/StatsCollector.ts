/**
 * Statistics Collection Service
 * Handles edge statistics computation and storage
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { buildEntityStatsQueries } from "./queries.js";

export interface EntityEdgeStats {
  byType: Record<string, number>;
  topSymbols: Array<{ symbol: string; count: number }>;
  inbound: number;
  outbound: number;
  total: number;
  avgDegree: number;
}

export interface StatsSummary {
  totalEntities: number;
  totalRelationships: number;
  avgRelationshipsPerEntity: number;
  mostConnectedEntity: {
    id: string;
    relationshipCount: number;
  };
  relationshipTypeDistribution: Record<string, number>;
}

export class StatsCollector extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }

  /**
   * Compute and store edge statistics
   */
  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
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
  async getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats> {
    const queries = buildEntityStatsQueries(entityId);

    const results = await Promise.all([
      this.neo4j.executeCypher(queries.byType, { entityId }),
      this.neo4j.executeCypher(queries.topSymbols, { entityId }),
      this.neo4j.executeCypher(queries.inbound, { entityId }),
      this.neo4j.executeCypher(queries.outbound, { entityId }),
    ]);

    const byType: Record<string, number> = {};
    results[0].forEach((r: any) => {
      byType[r.type] = r.count;
    });

    const topSymbols = results[1].map((r: any) => ({
      symbol: r.symbol,
      count: r.count,
    }));

    const inbound = results[2][0]?.count || 0;
    const outbound = results[3][0]?.count || 0;

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
  async getGlobalStatsSummary(): Promise<StatsSummary> {
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

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q.query))
    );

    const totalEntities = results[0][0]?.count || 0;
    const totalRelationships = results[1][0]?.count || 0;
    const mostConnected = results[2][0] || { id: "", relationshipCount: 0 };

    const relationshipTypeDistribution: Record<string, number> = {};
    results[3].forEach((r: any) => {
      relationshipTypeDistribution[r.type] = r.count;
    });

    return {
      totalEntities,
      totalRelationships,
      avgRelationshipsPerEntity:
        totalEntities > 0 ? totalRelationships / totalEntities : 0,
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
  async getCachedEntityStats(
    entityId: string
  ): Promise<EntityEdgeStats | null> {
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
    } catch {
      return null;
    }
  }

  /**
   * Compute statistics for multiple entities in batch
   */
  async computeBatchStats(
    entityIds: string[]
  ): Promise<Record<string, EntityEdgeStats>> {
    const stats: Record<string, EntityEdgeStats> = {};

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
  async cleanupOldStats(olderThanDays: number = 30): Promise<number> {
    const query = `
      MATCH (s:EdgeStats)
      WHERE s.updatedAt < datetime() - duration({days: $days})
      DETACH DELETE s
      RETURN count(s) AS deletedCount
    `;

    const result = await this.neo4j.executeCypher(query, {
      days: olderThanDays,
    });

    return result[0]?.deletedCount || 0;
  }

  /**
   * Get statistics trends over time
   */
  async getStatsTrends(
    entityId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{ timestamp: Date; stats: EntityEdgeStats }>> {
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
  async analyzeRelationshipPatterns(): Promise<{
    mostCommonTypes: Array<{ type: string; count: number; percentage: number }>;
    connectivityDistribution: Array<{ degree: number; entityCount: number }>;
    clusterCoefficients: { average: number; global: number };
  }> {
    // Most common relationship types
    const typeQuery = `
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
      LIMIT 10
    `;

    const typeResult = await this.neo4j.executeCypher(typeQuery);
    const totalRelationships = typeResult.reduce(
      (sum, r: any) => sum + r.count,
      0
    );

    const mostCommonTypes = typeResult.map((r: any) => ({
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
    const connectivityDistribution = degreeResult.map((r: any) => ({
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
    const averageClustering = clusterResult[0]?.averageClustering || 0;

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
