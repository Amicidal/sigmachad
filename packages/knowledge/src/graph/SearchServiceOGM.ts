// security: avoid dynamic object indexing; use Object.fromEntries and guarded accessors
/**
 * Search Service OGM Implementation
 * Uses Neogma for structural searches while keeping embedding service for semantic search
 */

import { EventEmitter } from 'events';
import { NeogmaService } from '@memento/knowledge/graph/NeogmaService';
import { createEntityModels } from '@memento/graph/models-ogm/EntityModels';
import { modelToEntity } from '@memento/graph/models-ogm/BaseModels';
import { EmbeddingService } from '@memento/knowledge/embeddings/EmbeddingService';
import { Entity, GraphSearchRequest, GraphExamples } from '@memento/shared-types';
import {
  ISearchService,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats,
} from '@memento/knowledge/ISearchService';

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
  private totalSearches = 0;
  private totalResponseTimeMs = 0;
  private recentDurations: number[] = [];
  private recentWindow = 100;
  private cacheHits = 0;
  private cacheLookups = 0;
  private queryTally = new Map<string, number>();

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
    const t0 = Date.now();
    this.cacheLookups++;
    // Check cache
    const cached = this.searchCache.get(request);
    if (cached) {
      this.cacheHits++;
      const duration = Date.now() - t0;
      this.recordSearchMetrics(request.query, duration);
      this.emit('search:cache:hit', { query: request.query, duration });
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

    // Cache and return
    this.searchCache.set(request, results);

    const duration = Date.now() - t0;
    this.recordSearchMetrics(request.query, duration);

    this.emit('search:completed', {
      query: request.query,
      strategy,
      count: results.length,
      duration,
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
      const searchPromises: Array<Promise<SearchResult[]>> = [];

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
          documentationExamples: [],
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
        const callerName = (caller as any)?.name ?? (caller as any)?.id ?? 'unknown';
        return {
          context: `Used in ${caller.type}: ${callerName}`,
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
        documentationExamples: [], // TODO: Add documentation examples logic
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
    const recentAvg =
      this.recentDurations.length === 0
        ? 0
        : this.recentDurations.reduce((a, b) => a + b, 0) /
          this.recentDurations.length;

    // Compute top 5 searches by count
    const topSearches = Array.from(this.queryTally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    return {
      cacheSize: this.searchCache.size,
      cacheHitRate: this.cacheLookups > 0 ? this.cacheHits / this.cacheLookups : 0,
      topSearches,
      totalSearches: this.totalSearches,
      averageResponseTime: Math.round(recentAvg),
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
   * Record metrics for search execution
   */
  private recordSearchMetrics(query: string, durationMs: number) {
    this.totalSearches += 1;
    this.totalResponseTimeMs += durationMs;
    this.recentDurations.push(durationMs);
    if (this.recentDurations.length > this.recentWindow) {
      this.recentDurations.shift();
    }
    const prev = this.queryTally.get(query) ?? 0;
    this.queryTally.set(query, prev + 1);
  }

  /**
   * Build filter clause for Cypher queries
   */
  private buildFilterClause(filter?: Record<string, any>): string {
    if (!filter || Object.keys(filter).length === 0) {
      return '';
    }

    const clauses = Object.entries(filter).flatMap(([key, value]) => {
      if (!SearchServiceOGM.isSafePropertyName(key)) return [] as string[];
      if (value === null) {
        return [`n.${key} IS NULL`];
      } else if (typeof value === 'object' && value.$ne !== undefined) {
        return [`n.${key} <> $filter_${key}_ne`];
      } else {
        return [`n.${key} = $filter_${key}`];
      }
    });

    return `AND ${clauses.join(' AND ')}`;
  }

  /**
   * Build filter parameters for Cypher queries
   */
  private buildFilterParams(filter?: Record<string, any>): Record<string, any> {
    if (!filter) return {};
    const pairs: Array<[string, any]> = [];
    for (const [key, value] of Object.entries(filter)) {
      if (!SearchServiceOGM.isSafePropertyName(key)) continue;
      if (typeof value === 'object' && (value as any).$ne !== undefined) {
        pairs.push([`filter_${key}_ne`, (value as any).$ne]);
      } else {
        pairs.push([`filter_${key}`, value]);
      }
    }
    return Object.fromEntries(pairs);
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    return results.sort((a, b) => {
      const aVal = SearchServiceOGM.getEntityField(a.entity as any, sortBy);
      const bVal = SearchServiceOGM.getEntityField(b.entity as any, sortBy);
      if (aVal == null && bVal == null) return b.score - a.score;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
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
      const key =
        (SearchServiceOGM.getEntityField(result.entity as any, groupBy) as
          | string
          | undefined) || 'unknown';
      const bucket = grouped.get(key) ?? [];
      bucket.push(result);
      grouped.set(key, bucket);
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
    const entries: Array<[string, unknown]> = [];
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;
      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entries.push([key, new Date(value as string)]);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
      ) {
        try {
          entries.push([key, JSON.parse(value as string)]);
        } catch {
          entries.push([key, value]);
        }
      } else {
        entries.push([key, value]);
      }
    }
    return Object.fromEntries(entries) as unknown as Entity;
  }

  private static isSafePropertyName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
  }

  private static getEntityField(entity: any, key: string): any {
    switch (key) {
      case 'id':
        return entity.id;
      case 'name':
        return entity.name;
      case 'type':
        return entity.type;
      case 'path':
        return entity.path;
      case 'filePath':
        return entity.filePath ?? entity.path;
      case 'line':
        return entity.line;
      case 'created':
        return entity.created;
      case 'lastModified':
        return entity.lastModified;
      default:
        return undefined;
    }
  }
}
 
// TODO(2025-09-30.35): Audit dynamic cypher param access; funnel through safe helpers.
