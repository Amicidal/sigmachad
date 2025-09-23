/**
 * Analysis Service
 * Unified interface for various analysis operations
 * Delegates to specialized analyzers for specific concerns
 */
import { EventEmitter } from "events";
import { Neo4jService } from "./Neo4jService.js";
import { ImpactAnalysis, ImpactAnalysisRequest, DependencyAnalysis } from "../../models/types.js";
import { PathQuery } from "../../models/relationships.js";
import { type EntityEdgeStats, type PathResult } from "./analysis/index.js";
export interface ImpactMetrics {
    directImpact: number;
    transitiveImpact: number;
    cascadeDepth: number;
    affectedTests: number;
    affectedSpecs: number;
    affectedDocs: number;
    criticalPaths: number;
    riskScore: number;
}
export interface DependencyMetrics {
    directDependencies: number;
    transitiveDependencies: number;
    depth: number;
    fanIn: number;
    fanOut: number;
    centrality: number;
    cycles: string[][];
}
export declare class AnalysisService extends EventEmitter {
    private neo4j;
    private impactAnalyzer;
    private dependencyAnalyzer;
    private pathAnalyzer;
    private statsCollector;
    constructor(neo4j: Neo4jService);
    private setupEventForwarding;
    /**
     * Analyze impact of changes
     */
    analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
    /**
     * Analyze entity dependencies
     */
    getEntityDependencies(entityId: string, options?: {
        depth?: number;
        includeTypes?: string[];
    }): Promise<DependencyAnalysis>;
    /**
     * Find shortest paths between entities
     */
    findPaths(query: PathQuery): Promise<PathResult>;
    /**
     * Compute and store edge statistics
     */
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
    /**
     * Get entity edge statistics
     */
    getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats>;
}
//# sourceMappingURL=AnalysisService.d.ts.map