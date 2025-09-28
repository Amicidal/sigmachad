/**
 * AnalysisManager - Handles impact analysis, dependency analysis, and path finding
 * Moved from KnowledgeGraphService.ts during refactoring
 */

import {
  ImpactAnalysisRequest,
  ImpactAnalysis,
  DependencyAnalysis,
} from '@memento/core';
import { PathQuery } from '@memento/core';

interface AnalysisService {
  analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
  getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis>;
  findPaths(query: PathQuery): Promise<any>;
  computeAndStoreEdgeStats(entityId: string): Promise<void>;
}

export class AnalysisManager {
  private analysisService: AnalysisService;

  constructor(analysisService: AnalysisService) {
    this.analysisService = analysisService;
  }

  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.analysisService.analyzeImpact(request);
  }

  async getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis> {
    return this.analysisService.getEntityDependencies(entityId, options);
  }

  async findPaths(query: PathQuery): Promise<any> {
    return this.analysisService.findPaths(query);
  }

  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.analysisService.computeAndStoreEdgeStats(entityId);
  }
}
