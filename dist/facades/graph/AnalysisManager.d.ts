/**
 * AnalysisManager - Handles impact analysis, dependency analysis, and path finding
 * Moved from KnowledgeGraphService.ts during refactoring
 */
import { ImpactAnalysisRequest, ImpactAnalysis, DependencyAnalysis } from "../../models/types.js";
import { PathQuery } from "../../models/relationships.js";
interface AnalysisService {
    analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
    getEntityDependencies(entityId: string, options?: any): Promise<DependencyAnalysis>;
    findPaths(query: PathQuery): Promise<any>;
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
}
export declare class AnalysisManager {
    private analysisService;
    constructor(analysisService: AnalysisService);
    analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
    getEntityDependencies(entityId: string, options?: any): Promise<DependencyAnalysis>;
    findPaths(query: PathQuery): Promise<any>;
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
}
export {};
//# sourceMappingURL=AnalysisManager.d.ts.map