/**
 * Search Service OGM Implementation
 * Uses Neogma for structural searches while keeping embedding service for semantic search
 */
import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Entity } from '../../models/entities.js';
import { GraphSearchRequest, GraphExamples } from '../../models/types.js';
import { ISearchService, StructuralSearchOptions, SearchResult, SemanticSearchOptions, PatternSearchOptions, SearchStats } from './ISearchService.js';
export declare class SearchServiceOGM extends EventEmitter implements ISearchService {
    private neogmaService;
    private embeddingService;
    private models;
    private searchCache;
    constructor(neogmaService: NeogmaService, embeddingService: EmbeddingService);
    /**
     * Unified search combining structural and semantic
     */
    search(request: GraphSearchRequest): Promise<SearchResult[]>;
    /**
     * Structural search using Neogma query builder
     */
    structuralSearch(query: string, options?: StructuralSearchOptions): Promise<SearchResult[]>;
    /**
     * Search within a specific Neogma model
     */
    private searchInModel;
    /**
     * Fuzzy search using raw Cypher with APOC (fallback when Neogma doesn't support it)
     */
    private fuzzySearchInModel;
    /**
     * Semantic search using embeddings
     */
    semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]>;
    /**
     * Hybrid search combining structural and semantic
     */
    hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;
    /**
     * Find symbols by name using Neogma models
     */
    findSymbolsByName(name: string, options?: {
        fuzzy?: boolean;
        limit?: number;
    }): Promise<Entity[]>;
    /**
     * Find nearby symbols in the same file
     */
    findNearbySymbols(filePath: string, position: {
        line: number;
        column?: number;
    }, options?: {
        range?: number;
        limit?: number;
    }): Promise<Entity[]>;
    /**
     * Advanced pattern search using regex or glob patterns
     */
    patternSearch(pattern: string, options?: PatternSearchOptions): Promise<Entity[]>;
    /**
     * Get entity examples with code snippets
     */
    getEntityExamples(entityId: string): Promise<GraphExamples>;
    /**
     * Get search statistics
     */
    getSearchStats(): Promise<SearchStats>;
    /**
     * Clear search cache
     */
    clearCache(): void;
    /**
     * Invalidate cache entries matching a pattern
     */
    invalidateCache(pattern?: (key: string) => boolean): void;
    /**
     * Determine optimal search strategy
     */
    private determineSearchStrategy;
    /**
     * Build filter clause for Cypher queries
     */
    private buildFilterClause;
    /**
     * Build filter parameters for Cypher queries
     */
    private buildFilterParams;
    /**
     * Sort search results
     */
    private sortResults;
    /**
     * Group search results
     */
    private groupResults;
    /**
     * Parse entity from Neo4j result
     */
    private parseEntity;
}
//# sourceMappingURL=SearchServiceOGM.d.ts.map