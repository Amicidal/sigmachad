/**
 * Statistics Collection Service
 * Handles edge statistics computation and storage
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
export interface EntityEdgeStats {
    byType: Record<string, number>;
    topSymbols: Array<{
        symbol: string;
        count: number;
    }>;
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
export declare class StatsCollector extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Compute and store edge statistics
     */
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
    /**
     * Get entity edge statistics
     */
    getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats>;
    /**
     * Get global statistics summary
     */
    getGlobalStatsSummary(): Promise<StatsSummary>;
    /**
     * Get cached statistics for an entity
     */
    getCachedEntityStats(entityId: string): Promise<EntityEdgeStats | null>;
    /**
     * Compute statistics for multiple entities in batch
     */
    computeBatchStats(entityIds: string[]): Promise<Record<string, EntityEdgeStats>>;
    /**
     * Clean up old statistics
     */
    cleanupOldStats(olderThanDays?: number): Promise<number>;
    /**
     * Get statistics trends over time
     */
    getStatsTrends(entityId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<Array<{
        timestamp: Date;
        stats: EntityEdgeStats;
    }>>;
    /**
     * Analyze relationship patterns
     */
    analyzeRelationshipPatterns(): Promise<{
        mostCommonTypes: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
        connectivityDistribution: Array<{
            degree: number;
            entityCount: number;
        }>;
        clusterCoefficients: {
            average: number;
            global: number;
        };
    }>;
}
//# sourceMappingURL=StatsCollector.d.ts.map