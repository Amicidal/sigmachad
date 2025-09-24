/**
 * Path Analysis Service
 * Handles path finding and graph traversal algorithms
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { PathQuery } from "../../../models/relationships.js";
export interface PathResult {
    paths: Array<{
        nodes: Entity[];
        relationships: any[];
        length: number;
        weight: number;
    }>;
    shortestLength: number;
    totalPaths: number;
}
export interface CriticalPathResult {
    path: string[];
    criticality: number;
    bottleneckNodes: string[];
}
export declare class PathAnalyzer extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Find shortest paths between entities
     */
    findPaths(query: PathQuery): Promise<PathResult>;
    /**
     * Find all paths between entities (up to a limit)
     */
    findAllPaths(startEntityId: string, endEntityId: string, options?: {
        maxDepth?: number;
        maxPaths?: number;
        relationshipTypes?: string[];
    }): Promise<PathResult>;
    /**
     * Find critical paths in the dependency graph
     */
    findCriticalPaths(startEntityIds: string[], targetTypes?: string[], maxDepth?: number): Promise<CriticalPathResult[]>;
    /**
     * Analyze path characteristics
     */
    analyzePathCharacteristics(startEntityId: string, endEntityId: string): Promise<{
        averagePathLength: number;
        minPathLength: number;
        maxPathLength: number;
        totalPaths: number;
        pathDiversity: number;
    }>;
    /**
     * Find bottleneck nodes in paths
     */
    findBottleneckNodes(entityIds: string[], threshold?: number): Promise<Array<{
        nodeId: string;
        pathCount: number;
        centrality: number;
    }>>;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntity;
}
//# sourceMappingURL=PathAnalyzer.d.ts.map