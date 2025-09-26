/**
 * Analysis Service
 * Unified interface for various analysis operations
 * Delegates to specialized analyzers for specific concerns
 */

import { EventEmitter } from "events";
import { Neo4jService } from "./Neo4jService.js";
import { Entity } from '@memento/core';
import {
  ImpactAnalysis,
  ImpactAnalysisRequest,
  DependencyAnalysis,
} from "../../models/types.js";
import { PathQuery } from '@memento/core';
import { ImpactAnalyzer } from "./ImpactAnalyzer.js";
import { DependencyAnalyzer } from "./DependencyAnalyzer.js";
import { PathAnalyzer, type PathResult } from "./PathAnalyzer.js";
import { StatsCollector, type EntityEdgeStats } from "./StatsCollector.js";

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

export class AnalysisService extends EventEmitter {
  private impactAnalyzer: ImpactAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private pathAnalyzer: PathAnalyzer;
  private statsCollector: StatsCollector;

  constructor(private neo4j: Neo4jService) {
    super();

    // Initialize specialized analyzers
    this.impactAnalyzer = new ImpactAnalyzer(neo4j);
    this.dependencyAnalyzer = new DependencyAnalyzer(neo4j);
    this.pathAnalyzer = new PathAnalyzer(neo4j);
    this.statsCollector = new StatsCollector(neo4j);

    // Forward events from analyzers
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.impactAnalyzer.on("impact:analyzed", (data) =>
      this.emit("impact:analyzed", data)
    );
    this.statsCollector.on("stats:computed", (data) =>
      this.emit("stats:computed", data)
    );
  }

  /**
   * Analyze impact of changes
   */
  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.impactAnalyzer.analyzeImpact(request);
  }

  /**
   * Analyze entity dependencies
   */
  async getEntityDependencies(
    entityId: string,
    options?: { depth?: number; includeTypes?: string[] }
  ): Promise<DependencyAnalysis> {
    return this.dependencyAnalyzer.getEntityDependencies(entityId, options);
  }

  /**
   * Find shortest paths between entities
   */
  async findPaths(query: PathQuery): Promise<PathResult> {
    return this.pathAnalyzer.findPaths(query);
  }

  /**
   * Compute and store edge statistics
   */
  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.statsCollector.computeAndStoreEdgeStats(entityId);
  }

  /**
   * Get entity edge statistics
   */
  async getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats> {
    return this.statsCollector.getEntityEdgeStats(entityId);
  }
}
