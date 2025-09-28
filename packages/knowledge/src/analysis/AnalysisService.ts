/**
 * Analysis Service
 * Unified interface for various analysis operations
 * Delegates to specialized analyzers for specific concerns
 */

import { EventEmitter } from 'events';
import { ImpactAnalyzer } from './ImpactAnalyzer.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { PathAnalyzer, type PathResult } from './PathAnalyzer.js';

// Type definitions (temporarily local until @memento/core is available)
export interface ImpactAnalysis {
  impactScore: number;
  affectedEntities: string[];
  cascadePath: string[];
  recommendations: string[];
}

export interface ImpactAnalysisRequest {
  entityId: string;
  changeType: 'modification' | 'deletion' | 'addition';
  scope?: 'direct' | 'transitive' | 'global';
}

export interface DependencyAnalysis {
  dependencies: string[];
  dependents: string[];
  couplingScore: number;
}

export interface PathQuery {
  startEntityId: string;
  endEntityId?: string;
  relationshipTypes?: string[];
  maxDepth?: number;
}

// Type definitions
export interface EntityEdgeStats {
  entities: number;
  relationships: number;
  avgDegree: number;
}

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
  private statsCollector: EntityEdgeStats;

  constructor() {
    super();

    // Initialize specialized analyzers (simplified for now)
    this.impactAnalyzer = new ImpactAnalyzer();
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.pathAnalyzer = new PathAnalyzer();
    this.statsCollector = { entities: 0, relationships: 0, avgDegree: 0 };
  }

  private setupEventForwarding(): void {
    this.impactAnalyzer.on('impact:analyzed', (data) =>
      this.emit('impact:analyzed', data)
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
    // Simplified implementation
    return Promise.resolve();
  }

  /**
   * Get entity edge statistics
   */
  async getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats> {
    // Simplified implementation
    return Promise.resolve(this.statsCollector);
  }
}
