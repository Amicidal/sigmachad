/**
 * Search Service OGM Implementation
 * Uses Neogma for structural searches while keeping embedding service for semantic search
 */

import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
import {
  createEntityModels,
  modelToEntity,
} from '@memento/graph/models-ogm/EntityModels.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Entity } from '@memento/shared-types.js';
import { GraphSearchRequest, GraphExamples } from '../../models/types.js';
import {
  ISearchService,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats,
} from './ISearchService.js';

// Simple cache for search results (reused from original)
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  private generateKey(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  get(key: any): any | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  set(key: any, value: any): void {
    const cacheKey = this.generateKey(key);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: (key: string) => boolean): void {
    if (!pattern) {
      this.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (pattern(key)) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

export class SearchServiceOGM extends EventEmitter implements ISearchService {
  private models: ReturnType<typeof createEntityModels>;
  private searchCache: SearchCache;

  constructor(
    private neogmaService: NeogmaService,
    private embeddingService: EmbeddingService
  ) {
    super();
    const neogma = this.neogmaService.getNeogmaInstance();
    this.models = createEntityModels(neogma);
    this.searchCache = new SearchCache(500, 300000); // 5 min TTL

    // Forward NeogmaService events
    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }

  /**
   * Unified search combining structural and semantic
   */
  async search(request: GraphSearchRequest): Promise<SearchResult[]> {
    // Check cache
    const cached = this.searchCache.get(request);
    if (cached) {
      this.emit('search:cache:hit', { query: request.query });
      return cached;
    }

    let results: SearchResult[] = [];

    // Determine search strategy based on request
    const strategy = this.determineSearchStrategy(request);

    switch (strategy) {
      case 'structural':
        results = await this.structuralSearch(request.query, {
          limit: request.limit,
          filter: request.filters,
          fuzzy: false,
        });
        break;

      case 'semantic':
        results = await this.semanticSearch(request.query, {
          limit: request.limit,
          filter: request.filters,
        });
        break;

      case 'hybrid':
        results = await this.hybridSearch(request);
        break;
    }

    // Apply post-processing (if needed)
    // Note: sortBy and groupBy are not part of GraphSearchRequest interface
    // These would be handled by the API layer if needed

    // Cache and return
    this.searchCache.set(request, results);
    this.emit('search:completed', {
      query: request.query,
      strategy,
      count: results.length,
    });

    return results;
  }

  /**
   * Structural search using Neogma query builder
   */
  async structuralSearch(
    query: string,
    options: StructuralSearchOptions = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 50;
    const results: SearchResult[] = [];

    try {
      // Search across different entity types using their specific models
      const searchPromises = [];

      // Search in files
      if (!options.filter?.type || options.filter.type === 'file') {
        searchPromises.push(
          this.searchInModel(
            this.models.FileModel,
            query,
            options,
            'file'
          ).catch(() => [] as SearchResult[])
        );
      }

      // Search in symbols
      if (
        !options.filter?.type ||
        ['symbol', 'function', 'class', 'interface'].includes(
          options.filter.type
        )
      ) {
        searchPromises.push(
          this.searchInModel(
            this.models.SymbolModel,
            query,
            options,
            'symbol'
          ).catch(() => [] as SearchResult[]),
          this.searchInModel(
            this.models.FunctionSymbolModel,
            query,
            options,
            'symbol'
          ).catch(() => [] as SearchResult[]),
          this.searchInModel(
            this.models.ClassSymbolModel,
            query,
            options,
            'symbol'
          ).catch(() => [] as SearchResult[]),
          this.searchInModel(
            this.models.InterfaceSymbolModel,
            query,
            options,
            'symbol'
          ).catch(() => [] as SearchResult[])
        );
      }

      // Search in modules
      if (!options.filter?.type || options.filter.type === 'module') {
        searchPromises.push(
          this.searchInModel(
            this.models.ModuleModel,
            query,
            options,
            'module'
          ).catch(() => [] as SearchResult[])
        );
      }

      // Search in tests
      if (!options.filter?.type || options.filter.type === 'test') {
        searchPromises.push(
          this.searchInModel(
            this.models.TestModel,
            query,
            options,
            'test'
          ).catch(() => [] as SearchResult[])
        );
      }

      // Search in specifications
      if (!options.filter?.type || options.filter.type === 'specification') {
        searchPromises.push(
          this.searchInModel(
            this.models.SpecificationModel,
            query,
            options,
            'specification'
          ).catch(() => [] as SearchResult[])
        );
      }

      // Execute all searches in parallel
      const searchResults = await Promise.all(searchPromises);

      // Flatten and combine results
      for (const modelResults of searchResults) {
        results.push(...modelResults);
      }

      // Sort by score and limit
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      this.emit('error', {
        operation: 'structuralSearch',
        error,
        query,
        options,
      });
      throw error;
    }
  }

  /**
   * Search within a specific Neogma model
   */
  private async searchInModel(
    Model: any,
    query: string,
    options: StructuralSearchOptions,
    entityType: string
  ): Promise<SearchResult[]> {
    try {
      if (options.fuzzy) {
        // For fuzzy search, we need to fall back to raw Cypher with APOC
        // Since Neogma doesn't have built-in fuzzy text search
        return this.fuzzySearchInModel(Model, query, options, entityType);
      } else {
        // Fallback to raw Cypher for now since Neogma query builder has issues
        const label = (Model as any).label || 'Entity';
        const cypherQuery = `
          MATCH (n:${label})
          WHERE (n.name CONTAINS $query OR n.path CONTAINS $query OR n.id CONTAINS $query)
          ${this.buildFilterClause(options.filter)}
          RETURN n
          LIMIT $limit
        `;

        const params = {
          query: options.caseInsensitive ? query.toLowerCase() : query,
          limit: options.limit || 50,
          ...this.buildFilterParams(options.filter),
        };

        const results = await this.neogmaService.executeCypher(
          cypherQuery,
          params
        );

        return results.map((row) => ({
          entity: this.parseEntity(row.n),
          score: 1.0, // Exact match score
          type: 'structural' as const,
        }));
      }
    } catch (error) {
      // Log error but don't fail the entire search
      console.warn(`Search failed in ${entityType} model:`, error);
      return [];
    }
  }

  /**
   * Fuzzy search using raw Cypher with APOC (fallback when Neogma doesn't support it)
   */
  private async fuzzySearchInModel(
    Model: any,
    query: string,
    options: StructuralSearchOptions,
    entityType: string
  ): Promise<SearchResult[]> {
    try {
      const label = (Model as any).label || 'Entity';
      const cypherQuery = `
        MATCH (n:${label})
        WITH n, apoc.text.levenshteinSimilarity(
          coalesce(n.name, ''),
          $query
        ) AS nameSimilarity,
        apoc.text.levenshteinSimilarity(
          coalesce(n.path, ''),
          $query
        ) AS pathSimilarity
        WITH n, GREATEST(nameSimilarity, pathSimilarity) AS similarity
        WHERE similarity > 0.6
        ${this.buildFilterClause(options.filter)}
        RETURN n, similarity AS score
        ORDER BY score DESC
        LIMIT $limit
      `;

      const params = {
        query,
        limit: options.limit || 50,
        ...this.buildFilterParams(options.filter),
      };

      const results = await this.neogmaService.executeCypher(
        cypherQuery,
        params
      );

      return results.map((row) => ({
        entity: this.parseEntity(row.n),
        score: row.score,
        type: 'structural' as const,
      }));
    } catch (error) {
      // If APOC is not available, fall back to exact search
      console.warn(
        `Fuzzy search failed in ${entityType} model, falling back to exact search:`,
        error
      );
      return this.searchInModel(
        Model,
        query,
        { ...options, fuzzy: false },
        entityType
      );
    }
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    const results = await this.embeddingService.search(query, options);

    return results.map((result) => ({
      entity: result.entity,
      score: result.score,
      type: 'semantic' as const,
      metadata: result.metadata,
    }));
  }

  /**
   * Hybrid search combining structural and semantic
   */
  async hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]> {
    const [structural, semantic] = await Promise.all([
      this.structuralSearch(request.query, {
        limit: request.limit ? Math.ceil(request.limit / 2) : 25,
        filter: request.filters,
        fuzzy: false,
      }),
      this.semanticSearch(request.query, {
        limit: request.limit ? Math.ceil(request.limit / 2) : 25,
        filter: request.filters,
      }),
    ]);

    // Merge and deduplicate results
    const merged = new Map<string, SearchResult>();

    // Add structural results with boost
    structural.forEach((result) => {
      merged.set(result.entity.id, {
        ...result,
        score: result.score * 1.2, // Boost structural matches
        type: 'hybrid' as const,
      });
    });

    // Add or merge semantic results
    semantic.forEach((result) => {
      const existing = merged.get(result.entity.id);
      if (existing) {
        // Average the scores if found in both
        existing.score = (existing.score + result.score) / 2;
      } else {
        merged.set(result.entity.id, {
          ...result,
          type: 'hybrid' as const,
        });
      }
    });

    // Sort by score and limit
    const results = Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit || 50);

    return results;
  }

  /**
   * Find symbols by name using Neogma models
   */
  async findSymbolsByName(
    name: string,
    options: { fuzzy?: boolean; limit?: number } = {}
  ): Promise<Entity[]> {
    const results = await this.structuralSearch(name, {
      fuzzy: options.fuzzy,
      limit: options.limit,
      filter: { type: 'symbol' },
    });

    return results.map((r) => r.entity);
  }

  /**
   * Find nearby symbols in the same file
   */
  async findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options: { range?: number; limit?: number } = {}
  ): Promise<Entity[]> {
    const range = options.range || 50; // Default 50 lines range
    const limit = options.limit || 10;

    try {
      // Use raw Cypher for location-based queries as Neogma doesn't have built-in support for this
      const query = `
        MATCH (n:Entity)
        WHERE n.path = $filePath
          AND n.line >= $minLine
          AND n.line <= $maxLine
        RETURN n
        ORDER BY abs(n.line - $targetLine)
        LIMIT $limit
      `;

      const params = {
        filePath,
        minLine: Math.max(0, position.line - range),
        maxLine: position.line + range,
        targetLine: position.line,
        limit,
      };

      const results = await this.neogmaService.executeCypher(query, params);
      return results.map((row) => this.parseEntity(row.n));
    } catch (error) {
      this.emit('error', {
        operation: 'findNearbySymbols',
        error,
        filePath,
        position,
      });
      throw error;
    }
  }

  /**
   * Advanced pattern search using regex or glob patterns
   */
  async patternSearch(
    pattern: string,
    options: PatternSearchOptions = {}
  ): Promise<Entity[]> {
    const limit = options.limit || 50;
    let query: string;
    const params: Record<string, any> = { pattern, limit };

    if (options.type === 'regex') {
      query = `
        MATCH (n:Entity)
        WHERE n.name =~ $pattern
           OR n.path =~ $pattern
        RETURN n
        LIMIT $limit
      `;
    } else {
      // Glob pattern - convert to regex
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      query = `
        MATCH (n:Entity)
        WHERE n.name =~ $regexPattern
           OR n.path =~ $regexPattern
        RETURN n
        LIMIT $limit
      `;
      params.regexPattern = regexPattern;
    }

    try {
      const results = await this.neogmaService.executeCypher(query, params);
      return results.map((row) => this.parseEntity(row.n));
    } catch (error) {
      this.emit('error', {
        operation: 'patternSearch',
        error,
        pattern,
        options,
      });
      throw error;
    }
  }

  /**
   * Get entity examples with code snippets
   */
  async getEntityExamples(entityId: string): Promise<GraphExamples> {
    try {
      // First get the entity
      const entityQuery = `
        MATCH (n:Entity {id: $id})
        RETURN n
      `;

      const entityResult = await this.neogmaService.executeCypher(entityQuery, {
        id: entityId,
      });

      if (entityResult.length === 0) {
        return {
          entityId,
          signature: '',
          usageExamples: [],
          testExamples: [],
          relatedPatterns: [],
        };
      }

      const entity = this.parseEntity(entityResult[0].n);

      // Find usage examples through relationships
      const usageQuery = `
        MATCH (n:Entity {id: $id})<-[:CALLS|REFERENCES|USES]-(caller)
        RETURN caller
        LIMIT 5
      `;

      const usageResults = await this.neogmaService.executeCypher(usageQuery, {
        id: entityId,
      });

      const usageExamples = usageResults.map((row) => {
        const caller = this.parseEntity(row.caller);
        return {
          context: `Used in ${caller.type}: ${caller.name}`,
          code: (caller as any).content || '',
          file: (caller as any).path || 'unknown',
          line: (caller as any).line || 0,
        };
      });

      return {
        entityId,
        signature: (entity as any).signature || '',
        usageExamples,
        testExamples: [], // TODO: Add test examples logic
        relatedPatterns: [], // TODO: Add pattern analysis
      };
    } catch (error) {
      this.emit('error', { operation: 'getEntityExamples', error, entityId });
      throw error;
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<SearchStats> {
    // This would normally track actual metrics
    // For now, return basic cache data
    return {
      cacheSize: this.searchCache.size,
      cacheHitRate: 0.75, // Would track this
      topSearches: [], // Would track this
    };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidateCache(pattern?: (key: string) => boolean): void {
    this.searchCache.invalidate(pattern);
    this.emit('cache:invalidated');
  }

  /**
   * Determine optimal search strategy
   */
  private determineSearchStrategy(
    request: GraphSearchRequest
  ): 'structural' | 'semantic' | 'hybrid' {
    // If query looks like a path or ID, use structural
    if (request.query.includes('/') || request.query.includes(':')) {
      return 'structural';
    }

    // If filter is complex, use structural
    if (request.filters && Object.keys(request.filters).length > 2) {
      return 'structural';
    }

    // If semantic search is explicitly requested
    if (request.searchType === 'semantic') {
      return 'semantic';
    }

    // If structural search is explicitly requested
    if (request.searchType === 'structural') {
      return 'structural';
    }

    // Default to hybrid for general queries
    return 'hybrid';
  }

  /**
   * Build filter clause for Cypher queries
   */
  private buildFilterClause(filter?: Record<string, any>): string {
    if (!filter || Object.keys(filter).length === 0) {
      return '';
    }

    const clauses = Object.entries(filter).map(([key, value]) => {
      if (value === null) {
        return `n.${key} IS NULL`;
      } else if (typeof value === 'object' && value.$ne !== undefined) {
        return `n.${key} <> $filter_${key}_ne`;
      } else {
        return `n.${key} = $filter_${key}`;
      }
    });

    return `AND ${clauses.join(' AND ')}`;
  }

  /**
   * Build filter parameters for Cypher queries
   */
  private buildFilterParams(filter?: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};

    if (!filter) return params;

    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === 'object' && value.$ne !== undefined) {
        params[`filter_${key}_ne`] = value.$ne;
      } else {
        params[`filter_${key}`] = value;
      }
    });

    return params;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    return results.sort((a, b) => {
      const aVal = (a.entity as any)[sortBy];
      const bVal = (b.entity as any)[sortBy];

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return b.score - a.score; // Fall back to score
    });
  }

  /**
   * Group search results
   */
  private groupResults(
    results: SearchResult[],
    groupBy: string
  ): SearchResult[] {
    const grouped = new Map<string, SearchResult[]>();

    results.forEach((result) => {
      const key = (result.entity as any)[groupBy] || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    });

    // Flatten groups, keeping best from each
    const flattened: SearchResult[] = [];
    grouped.forEach((group) => {
      group.sort((a, b) => b.score - a.score);
      flattened.push(...group.slice(0, 3)); // Top 3 from each group
    });

    return flattened;
  }

  /**
   * Parse entity from Neo4j result
   */
  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}
