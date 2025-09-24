/**
 * Dependency Analysis Service
 * Handles entity dependency analysis, cycle detection, and tree building
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { DependencyAnalysis } from "../../../models/types.js";
export interface DependencyMetrics {
    directDependencies: number;
    transitiveDependencies: number;
    depth: number;
    fanIn: number;
    fanOut: number;
    centrality: number;
    cycles: string[][];
}
export interface DependencyTree {
    entity: Entity;
    children: DependencyTree[];
}
export interface CircularDependency {
    cycle: string[];
    severity: "warning" | "error" | "info";
}
export declare class DependencyAnalyzer extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Analyze entity dependencies
     */
    getEntityDependencies(entityId: string, options?: {
        depth?: number;
        includeTypes?: string[];
    }): Promise<DependencyAnalysis>;
    /**
     * Get direct dependencies
     */
    private getDirectDependencies;
    /**
     * Get transitive dependencies
     */
    private getTransitiveDependencies;
    /**
     * Calculate dependency metrics
     */
    private calculateDependencyMetrics;
    /**
     * Detect dependency cycles
     */
    private detectCycles;
    /**
     * Build dependency tree
     */
    buildDependencyTree(entityId: string, dependencies: Array<{
        entity: Entity;
        distance: number;
    }>): DependencyTree;
    /**
     * Find dependency chains (paths from entity to dependencies)
     */
    findDependencyChains(entityId: string, targetEntityId: string, maxDepth?: number): Promise<Array<{
        path: string[];
        length: number;
    }>>;
    /**
     * Analyze reverse dependencies (entities that depend on this one)
     */
    getReverseDependencies(entityId: string, depth?: number): Promise<Array<{
        entity: Entity;
        relationship: string;
        distance: number;
    }>>;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntity;
}
//# sourceMappingURL=DependencyAnalyzer.d.ts.map