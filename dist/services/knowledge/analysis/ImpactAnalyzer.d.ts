/**
 * Impact Analysis Service
 * Handles impact analysis, cascade detection, and impact metrics
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { ImpactAnalysis, ImpactAnalysisRequest } from "../../../models/types.js";
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
export interface CascadeInfo {
    depth: number;
    count: number;
    entities: Entity[];
}
export interface CriticalPath {
    path: string[];
    length: number;
}
export declare class ImpactAnalyzer extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Analyze impact of changes
     */
    analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
    /**
     * Get direct impact entities
     */
    private getDirectImpact;
    /**
     * Get transitive impact entities
     */
    private getTransitiveImpact;
    /**
     * Get affected tests
     */
    private getAffectedTests;
    /**
     * Get affected specifications
     */
    private getAffectedSpecs;
    /**
     * Get affected documentation
     */
    private getAffectedDocs;
    /**
     * Calculate impact metrics
     */
    private calculateImpactMetrics;
    /**
     * Identify cascades from impact analysis
     */
    identifyCascades(impacted: Array<{
        entity: Entity;
        depth: number;
    }>): CascadeInfo[];
    /**
     * Find critical paths
     */
    findCriticalPaths(entityIds: string[], maxDepth: number): Promise<CriticalPath[]>;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntity;
}
//# sourceMappingURL=ImpactAnalyzer.d.ts.map