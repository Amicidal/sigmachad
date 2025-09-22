/**
 * Search Service
 * Handles structural and semantic search with caching
 */

import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Entity } from '../../models/entities.js';
import {
  GraphSearchRequest,
  GraphExamples,
} from '../../models/types.js';

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

// Simple cache for search results
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
}

export class SearchService extends EventEmitter {
  private searchCache: SearchCache;

  constructor(
    private neo4j: Neo4jService,
    private embeddingService: EmbeddingService
  ) {
    super();
    this.searchCache = new SearchCache(500, 300000); // 5 min TTL
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
          filter: request.filter,
          fuzzy: request.fuzzy,
        });
        break;

      case 'semantic':
        results = await this.semanticSearch(request.query, {
          limit: request.limit,
          filter: request.filter,
          minScore: request.minScore,
        });
        break;

      case 'hybrid':
        results = await this.hybridSearch(request);
        break;
    }

    // Apply post-processing
    if (request.sortBy) {
      results = this.sortResults(results, request.sortBy);
    }

    if (request.groupBy) {
      results = this.groupResults(results, request.groupBy);
    }

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
   * Structural search using Cypher and APOC
   */
  async structuralSearch(
    query: string,
    options: StructuralSearchOptions = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 50;

    let cypherQuery: string;
    let params: Record<string, any> = { query, limit };

    if (options.fuzzy) {
      // Use APOC fuzzy search
      cypherQuery = `
        MATCH (n:Entity)
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
    } else {
      // Exact or contains search
      const operator = options.caseInsensitive ? 'CONTAINS' : '=';
      cypherQuery = `
        MATCH (n:Entity)
        WHERE n.name ${operator} $query
           OR n.path ${operator} $query
           OR n.id ${operator} $query
        ${this.buildFilterClause(options.filter)}
        RETURN n, 1.0 AS score
        LIMIT $limit
      `;
    }

    // Add filter parameters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params[`filter_${key}`] = value;
      });
    }

    const results = await this.neo4j.executeCypher(cypherQuery, params);

    return results.map(row => ({
      entity: this.parseEntity(row.n),
      score: row.score,
      type: 'structural' as const,
    }));
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      minScore?: number;
      filter?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    const results = await this.embeddingService.search(query, options);

    return results.map(result => ({
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
        filter: request.filter,
        fuzzy: request.fuzzy,
      }),
      this.semanticSearch(request.query, {
        limit: request.limit ? Math.ceil(request.limit / 2) : 25,
        filter: request.filter,
        minScore: request.minScore,
      }),
    ]);

    // Merge and deduplicate results
    const merged = new Map<string, SearchResult>();

    // Add structural results with boost
    structural.forEach(result => {
      merged.set(result.entity.id, {
        ...result,
        score: result.score * 1.2, // Boost structural matches
        type: 'hybrid' as const,
      });
    });

    // Add or merge semantic results
    semantic.forEach(result => {
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
   * Find symbols by name with fuzzy matching
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

    return results.map(r => r.entity);
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

    const results = await this.neo4j.executeCypher(query, params);
    return results.map(row => this.parseEntity(row.n));
  }

  /**
   * Get entity examples with code snippets
   */
  async getEntityExamples(entityId: string): Promise<GraphExamples> {
    // First get the entity
    const entityQuery = `
      MATCH (n:Entity {id: $id})
      RETURN n
    `;

    const entityResult = await this.neo4j.executeCypher(entityQuery, {
      id: entityId,
    });

    if (entityResult.length === 0) {
      return { examples: [], total: 0 };
    }

    const entity = this.parseEntity(entityResult[0].n);

    // Find usage examples through relationships
    const usageQuery = `
      MATCH (n:Entity {id: $id})<-[:CALLS|REFERENCES|USES]-(caller)
      RETURN caller
      LIMIT 5
    `;

    const usageResults = await this.neo4j.executeCypher(usageQuery, {
      id: entityId,
    });

    const examples = usageResults.map(row => {
      const caller = this.parseEntity(row.caller);
      return {
        id: caller.id,
        title: caller.name || 'Usage Example',
        description: `Used in ${caller.type}: ${caller.name}`,
        code: (caller as any).content || '',
        language: (caller as any).language || 'unknown',
        source: (caller as any).path || 'unknown',
      };
    });

    return {
      examples,
      total: examples.length,
    };
  }

  /**
   * Advanced pattern search using APOC
   */
  async patternSearch(
    pattern: string,
    options: { type?: 'regex' | 'glob'; limit?: number } = {}
  ): Promise<Entity[]> {
    const limit = options.limit || 50;
    let query: string;
    let params: Record<string, any> = { pattern, limit };

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
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      query = `
        MATCH (n:Entity)
        WHERE n.name =~ $regexPattern
           OR n.path =~ $regexPattern
        RETURN n
        LIMIT $limit
      `;
      params.regexPattern = regexPattern;
    }

    const results = await this.neo4j.executeCypher(query, params);
    return results.map(row => this.parseEntity(row.n));
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{
    cacheSize: number;
    cacheHitRate: number;
    topSearches: Array<{ query: string; count: number }>;
  }> {
    // This would normally track actual metrics
    // For now, return mock data
    return {
      cacheSize: this.searchCache['cache'].size,
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
    if (request.filter && Object.keys(request.filter).length > 2) {
      return 'structural';
    }

    // If semantic is explicitly disabled
    if (request.semantic === false) {
      return 'structural';
    }

    // If both are requested or query is natural language
    if (request.semantic === true && request.structural !== false) {
      return 'hybrid';
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
   * Sort search results
   */
  private sortResults(
    results: SearchResult[],
    sortBy: string
  ): SearchResult[] {
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

    results.forEach(result => {
      const key = (result.entity as any)[groupBy] || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    });

    // Flatten groups, keeping best from each
    const flattened: SearchResult[] = [];
    grouped.forEach(group => {
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