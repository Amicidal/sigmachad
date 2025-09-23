/**
 * Shared Cypher query utilities for analysis operations
 */
export interface TraversalOptions {
    startNodeId: string;
    relationshipTypes: string[];
    maxDepth: number;
    direction?: "OUTGOING" | "INCOMING" | "BOTH";
    nodeFilter?: string;
}
export interface PathExpansionOptions extends TraversalOptions {
    uniqueness?: "NODE_GLOBAL" | "RELATIONSHIP_GLOBAL";
}
/**
 * Build APOC path expansion query
 */
export declare function buildPathExpansionQuery(options: PathExpansionOptions): string;
/**
 * Build direct relationship query
 */
export declare function buildDirectRelationshipQuery(entityId: string, relationshipTypes: string[], direction?: "OUTGOING" | "INCOMING"): string;
/**
 * Build GDS graph projection query
 */
export declare function buildGdsProjectionQuery(graphName: string, nodeQuery: string, relationshipQuery: string): string;
/**
 * Build PageRank analysis query
 */
export declare function buildPageRankQuery(graphName: string, limit?: number): string;
/**
 * Build betweenness centrality query
 */
export declare function buildBetweennessQuery(nodeQuery: string, relationshipQuery: string): string;
/**
 * Build Dijkstra shortest path query
 */
export declare function buildDijkstraQuery(relationshipTypes: string[], weightProperty?: string, defaultWeight?: number): string;
/**
 * Build cycle detection query
 */
export declare function buildCycleDetectionQuery(maxDepth: number): string;
/**
 * Build entity statistics queries
 */
export declare function buildEntityStatsQueries(entityId: string): {
    byType: string;
    topSymbols: string;
    inbound: string;
    outbound: string;
};
/**
 * Build impact analysis queries
 */
export declare function buildImpactQueries(entityIds: string[], maxDepth: number): {
    directImpact: string;
    transitiveImpact: string;
    affectedTests: string;
    affectedSpecs: string;
    affectedDocs: string;
};
//# sourceMappingURL=queries.d.ts.map