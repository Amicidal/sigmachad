/**
 * Graph Data Science Service
 * Handles GDS algorithms, path expansion, and graph analytics
 */
import { EventEmitter } from "events";
import { CypherExecutor } from "./CypherExecutor.js";
export interface GdsAlgorithmConfig {
    nodeProjection?: string;
    relationshipProjection?: string;
    writeProperty?: string;
    maxIterations?: number;
    dampingFactor?: number;
    similarityCutoff?: number;
    topK?: number;
    topN?: number;
}
export interface PathExpandConfig {
    startNode: string;
    relationshipFilter?: string;
    labelFilter?: string;
    minLevel?: number;
    maxLevel?: number;
    limit?: number;
}
export declare class GdsService extends EventEmitter {
    private executor;
    constructor(executor: CypherExecutor);
    /**
     * Run a GDS algorithm
     */
    runGdsAlgorithm(algorithm: string, config: GdsAlgorithmConfig, parameters?: Record<string, any>): Promise<any>;
    /**
     * Run PageRank algorithm
     */
    runPageRank(config?: {
        maxIterations?: number;
        dampingFactor?: number;
        writeProperty?: string;
    }): Promise<any>;
    /**
     * Run community detection (Louvain)
     */
    runCommunityDetection(config?: {
        maxIterations?: number;
        writeProperty?: string;
    }): Promise<any>;
    /**
     * Run node similarity algorithm
     */
    runNodeSimilarity(config?: {
        similarityCutoff?: number;
        topK?: number;
        writeProperty?: string;
    }): Promise<any>;
    /**
     * Expand paths from a starting node using APOC
     */
    apocPathExpand(config: PathExpandConfig): Promise<any[]>;
    /**
     * Find shortest paths between nodes
     */
    findShortestPaths(startNodeId: string, endNodeId: string, config?: {
        maxDepth?: number;
        relationshipTypes?: string[];
        algorithm?: "dijkstra" | "astar";
    }): Promise<any[]>;
    /**
     * Calculate centrality measures
     */
    calculateCentrality(algorithm?: "degree" | "betweenness" | "closeness"): Promise<any>;
    /**
     * Find strongly connected components
     */
    findStronglyConnectedComponents(): Promise<any>;
    /**
     * Run triangle count algorithm
     */
    runTriangleCount(): Promise<any>;
    /**
     * Get graph statistics and metrics
     */
    getGraphMetrics(): Promise<{
        nodeCount: number;
        relationshipCount: number;
        averageDegree: number;
        density: number;
        components: number;
        triangles: number;
    }>;
    /**
     * Create a named graph for GDS operations
     */
    createNamedGraph(graphName: string, nodeQuery?: string, relationshipQuery?: string): Promise<void>;
    /**
     * Drop a named graph
     */
    dropNamedGraph(graphName: string): Promise<void>;
    /**
     * List available named graphs
     */
    listNamedGraphs(): Promise<string[]>;
}
//# sourceMappingURL=GdsService.d.ts.map