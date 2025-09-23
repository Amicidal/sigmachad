/**
 * AnalysisManager - Handles impact analysis, dependency analysis, and path finding
 * Moved from KnowledgeGraphService.ts during refactoring
 */
export class AnalysisManager {
    constructor(analysisService) {
        this.analysisService = analysisService;
    }
    async analyzeImpact(request) {
        return this.analysisService.analyzeImpact(request);
    }
    async getEntityDependencies(entityId, options) {
        return this.analysisService.getEntityDependencies(entityId, options);
    }
    async findPaths(query) {
        return this.analysisService.findPaths(query);
    }
    async computeAndStoreEdgeStats(entityId) {
        return this.analysisService.computeAndStoreEdgeStats(entityId);
    }
}
//# sourceMappingURL=AnalysisManager.js.map