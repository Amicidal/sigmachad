/**
 * Search Service Adapter
 * Ensures API consistency between OGM and legacy search implementations
 */
import { EventEmitter } from 'events';
import { SearchService } from '../SearchService.js';
import { SearchServiceOGM } from './SearchServiceOGM.js';
import { ISearchService, StructuralSearchOptions, SearchResult, SemanticSearchOptions, PatternSearchOptions, SearchStats } from './ISearchService.js';
import { Entity } from '../../../models/entities.js';
import { GraphSearchRequest, GraphExamples } from '../../../models/types.js';
/**
 * Adapter that wraps both search implementations and provides fallback capabilities
 */
export declare class SearchServiceAdapter extends EventEmitter implements ISearchService {
    private legacyService;
    private ogmService;
    private featureFlags;
    private tracker;
    private errorHandler;
    constructor(legacyService: SearchService, ogmService?: SearchServiceOGM);
    /**
     * Set up event forwarding from both implementations
     */
    private setupEventForwarding;
    /**
     * Determine which implementation to use
     */
    private shouldUseOGM;
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    private executeWithFallback;
    /**
     * Execute operation with performance comparison (if enabled)
     */
    private executeWithComparison;
    search(request: GraphSearchRequest): Promise<SearchResult[]>;
    structuralSearch(query: string, options?: StructuralSearchOptions): Promise<SearchResult[]>;
    semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]>;
    hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;
    findSymbolsByName(name: string, options?: {
        fuzzy?: boolean;
        limit?: number;
    }): Promise<Entity[]>;
    findNearbySymbols(filePath: string, position: {
        line: number;
        column?: number;
    }, options?: {
        range?: number;
        limit?: number;
    }): Promise<Entity[]>;
    patternSearch(pattern: string, options?: PatternSearchOptions): Promise<Entity[]>;
    getEntityExamples(entityId: string): Promise<GraphExamples>;
    getSearchStats(): Promise<SearchStats>;
    clearCache(): void;
    invalidateCache(pattern?: (key: string) => boolean): void;
    /**
     * Get migration status for this adapter
     */
    getMigrationStatus(): {
        isUsingOGM: boolean;
        hasOGMService: boolean;
        fallbackEnabled: boolean;
        performanceComparisonEnabled: boolean;
        errorStats: any;
    };
    /**
     * Get error recommendations
     */
    getErrorRecommendations(): any;
    /**
     * Reset error tracking (for testing)
     */
    resetErrorTracking(): void;
    /**
     * Force switch to legacy implementation (for testing/debugging)
     */
    forceLegacy(): void;
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM(): void;
}
//# sourceMappingURL=SearchServiceAdapter.d.ts.map