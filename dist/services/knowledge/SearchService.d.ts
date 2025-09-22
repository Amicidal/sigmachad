/**
 * Search Service
 * Handles structural and semantic search with caching
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Entity } from '../../models/entities.js';
import { GraphSearchRequest, GraphExamples } from '../../models/types.js';
export interface StructuralSearchOptions {
    fuzzy?: boolean;
    caseInsensitive?: boolean;
    limit?: number;
    offset?: number;
    filter?: Record<string, any>;
}
export interface SearchResult {
    entity: Entity;
    score: number;
    type: 'structural' | 'semantic' | 'hybrid';
    metadata?: Record<string, any>;
}
export declare class SearchService extends EventEmitter {
    private neo4j;
    private embeddingService;
    private searchCache;
    constructor(neo4j: Neo4jService, embeddingService: EmbeddingService);
    /**
     * Unified search combining structural and semantic
     */
    search(request: GraphSearchRequest): Promise<SearchResult[]>;
    /**
     * Structural search using Cypher and APOC
     */
    structuralSearch(query: string, options?: StructuralSearchOptions): Promise<SearchResult[]>;
    /**
     * Semantic search using embeddings
     */
    semanticSearch(query: string, options?: {
        limit?: number;
        minScore?: number;
        filter?: Record<string, any>;
    }): Promise<SearchResult[]>;
    /**
     * Hybrid search combining structural and semantic
     */
    hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;
    /**
     * Find symbols by name with fuzzy matching
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
     * Get entity examples with code snippets
     */
    getEntityExamples(entityId: string): Promise<GraphExamples>;
    /**
     * Advanced pattern search using APOC
     */
    patternSearch(pattern: string, options?: {
        type?: 'regex' | 'glob';
        limit?: number;
    }): Promise<Entity[]>;
    /**
     * Get search statistics
     */
    getSearchStats(): Promise<{
        cacheSize: number;
        cacheHitRate: number;
        topSearches: Array<{
            query: string;
            count: number;
        }>;
    }>;
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
//# sourceMappingURL=SearchService.d.ts.map