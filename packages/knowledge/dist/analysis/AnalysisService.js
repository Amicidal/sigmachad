/**
 * Analysis Service
 * Unified interface for various analysis operations
 * Delegates to specialized analyzers for specific concerns
 */
import { EventEmitter } from "events";
import { ImpactAnalyzer } from "./ImpactAnalyzer.js";
import { DependencyAnalyzer } from "./DependencyAnalyzer.js";
import { PathAnalyzer } from "./PathAnalyzer.js";
import { StatsCollector } from "./StatsCollector.js";
export class AnalysisService extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
        // Initialize specialized analyzers
        this.impactAnalyzer = new ImpactAnalyzer(neo4j);
        this.dependencyAnalyzer = new DependencyAnalyzer(neo4j);
        this.pathAnalyzer = new PathAnalyzer(neo4j);
        this.statsCollector = new StatsCollector(neo4j);
        // Forward events from analyzers
        this.setupEventForwarding();
    }
    setupEventForwarding() {
        this.impactAnalyzer.on("impact:analyzed", (data) => this.emit("impact:analyzed", data));
        this.statsCollector.on("stats:computed", (data) => this.emit("stats:computed", data));
    }
    /**
     * Analyze impact of changes
     */
    async analyzeImpact(request) {
        return this.impactAnalyzer.analyzeImpact(request);
    }
    /**
     * Analyze entity dependencies
     */
    async getEntityDependencies(entityId, options) {
        return this.dependencyAnalyzer.getEntityDependencies(entityId, options);
    }
    /**
     * Find shortest paths between entities
     */
    async findPaths(query) {
        return this.pathAnalyzer.findPaths(query);
    }
    /**
     * Compute and store edge statistics
     */
    async computeAndStoreEdgeStats(entityId) {
        return this.statsCollector.computeAndStoreEdgeStats(entityId);
    }
    /**
     * Get entity edge statistics
     */
    async getEntityEdgeStats(entityId) {
        return this.statsCollector.getEntityEdgeStats(entityId);
    }
}
//# sourceMappingURL=AnalysisService.js.map