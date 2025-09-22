/**
 * Analysis Service
 * Handles impact analysis, dependencies, and graph algorithms
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { ImpactAnalysis, ImpactAnalysisRequest, DependencyAnalysis } from '../../models/types.js';
import { PathQuery } from '../../models/relationships.js';
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
    constructor(neo4j: Neo4jService);
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
    findPaths(query: PathQuery): Promise<{
        paths: any[];
        shortestLength: number;
    }>;
    /**
     * Compute and store edge statistics
     */
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
    /**
     * Get entity edge statistics
     */
    getEntityEdgeStats(entityId: string): Promise<{
        byType: Record<string, number>;
        topSymbols: Array<{
            symbol: string;
            count: number;
        }>;
        inbound: number;
        outbound: number;
    }>;
    /**
     * Calculate impact metrics
     */
    private calculateImpactMetrics;
    /**
     * Calculate dependency metrics
     */
    private calculateDependencyMetrics;
    /**
     * Detect dependency cycles
     */
    private detectCycles;
    /**
     * Identify cascades from impact analysis
     */
    private identifyCascades;
    /**
     * Find critical paths
     */
    private findCriticalPaths;
    /**
     * Build dependency tree
     */
    private buildDependencyTree;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntity;
}
//# sourceMappingURL=AnalysisService.d.ts.map