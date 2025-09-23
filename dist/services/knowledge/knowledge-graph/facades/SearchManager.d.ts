/**
 * SearchManager - Handles all search operations and caching
 * Moved from KnowledgeGraphService.ts during refactoring
 */
import { Entity } from "../../../../models/entities.js";
import { GraphSearchRequest } from "../../../../models/types.js";
interface SearchService {
    search(request: GraphSearchRequest): Promise<any[]>;
    semanticSearch(query: string, options?: any): Promise<any[]>;
    structuralSearch(query: string, options?: any): Promise<any[]>;
    findSymbolsByName(name: string, options?: any): Promise<Entity[]>;
    findNearbySymbols(filePath: string, position: any, options?: any): Promise<Entity[]>;
    getEntityExamples(entityId: string): Promise<any>;
    clearCache(): void;
    invalidateCache(pattern?: any): void;
}
export declare class SearchManager {
    private searchService;
    constructor(searchService: SearchService);
    searchEntities(request: GraphSearchRequest): Promise<any[]>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
    semanticSearch(query: string, options?: any): Promise<any[]>;
    structuralSearch(query: string, options?: any): Promise<any[]>;
    findSymbolsByName(name: string, options?: any): Promise<Entity[]>;
    findNearbySymbols(filePath: string, position: any, options?: any): Promise<Entity[]>;
    getEntityExamples(entityId: string): Promise<any>;
    clearSearchCache(): Promise<void>;
    invalidateSearchCache(pattern?: any): Promise<void>;
}
export {};
//# sourceMappingURL=SearchManager.d.ts.map