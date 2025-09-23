/**
 * SearchManager - Handles all search operations and caching
 * Moved from KnowledgeGraphService.ts during refactoring
 */
export class SearchManager {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async searchEntities(request) {
        return this.searchService.search(request);
    }
    async search(request) {
        const results = await this.searchService.search(request);
        return results.map((r) => r.entity);
    }
    async semanticSearch(query, options) {
        return this.searchService.semanticSearch(query, options);
    }
    async structuralSearch(query, options) {
        return this.searchService.structuralSearch(query, options);
    }
    async findSymbolsByName(name, options) {
        return this.searchService.findSymbolsByName(name, options);
    }
    async findNearbySymbols(filePath, position, options) {
        return this.searchService.findNearbySymbols(filePath, position, options);
    }
    async getEntityExamples(entityId) {
        return this.searchService.getEntityExamples(entityId);
    }
    async clearSearchCache() {
        this.searchService.clearCache();
    }
    async invalidateSearchCache(pattern) {
        this.searchService.invalidateCache(pattern);
    }
}
//# sourceMappingURL=SearchManager.js.map