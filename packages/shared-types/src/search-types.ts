/**
 * Search Types and Interfaces for Memento
 * Common search and query types used across packages
 */

import { Entity } from './entities.js';
import { GraphRelationship } from './relationships.js';
import { TimeRangeParams } from './api-types.js';

/**
 * Options for structural search operations
 */
export interface StructuralSearchOptions {
  fuzzy?: boolean;
  caseInsensitive?: boolean;
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
}

/**
 * Result of a search operation
 */
export interface SearchResult {
  entity: Entity;
  score: number;
  type: 'structural' | 'semantic' | 'hybrid';
  metadata?: Record<string, any>;
}

/**
 * Options for semantic search operations
 */
export interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

/**
 * Options for pattern-based search operations
 */
export interface PatternSearchOptions {
  type?: 'regex' | 'glob';
  limit?: number;
}

/**
 * Statistics about search operations and cache performance
 */
export interface SearchStats {
  cacheSize: number;
  cacheHitRate: number;
  topSearches: Array<{ query: string; count: number }>;
}

/**
 * Options for finding symbols by name
 */
export interface SymbolSearchOptions {
  fuzzy?: boolean;
  limit?: number;
}

/**
 * Options for finding symbols near a specific position
 */
export interface NearbySymbolsOptions {
  range?: number;
  limit?: number;
}

/**
 * Common interface that search service implementations should follow
 */
export interface ISearchService {
  // Main search operations
  search(request: GraphSearchRequest): Promise<SearchResult[]>;
  structuralSearch(
    query: string,
    options?: StructuralSearchOptions
  ): Promise<SearchResult[]>;
  semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult[]>;
  hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;

  // Symbol-specific searches
  findSymbolsByName(
    name: string,
    options?: SymbolSearchOptions
  ): Promise<Entity[]>;
  findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options?: NearbySymbolsOptions
  ): Promise<Entity[]>;

  // Pattern and example searches
  patternSearch(
    pattern: string,
    options?: PatternSearchOptions
  ): Promise<Entity[]>;
  getEntityExamples(entityId: string): Promise<GraphExamples>;

  // Cache management
  getSearchStats(): Promise<SearchStats>;
  clearCache(): void;
  invalidateCache(pattern?: (key: string) => boolean): void;
}

/**
 * Search query builder interface for fluent API
 */
export interface SearchQueryBuilder {
  where(condition: Record<string, any>): SearchQueryBuilder;
  limit(count: number): SearchQueryBuilder;
  offset(count: number): SearchQueryBuilder;
  orderBy(field: string, direction?: 'asc' | 'desc'): SearchQueryBuilder;
  execute(): Promise<SearchResult[]>;
}

/**
 * Search filter interface for advanced filtering
 */
export interface SearchFilter {
  entityTypes?: string[];
  filePatterns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  confidence?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

/**
 * Graph search request configuration
 */
export interface GraphSearchRequest {
  query: string;
  entityTypes?: (
    | 'function'
    | 'class'
    | 'interface'
    | 'file'
    | 'module'
    | 'spec'
    | 'test'
    | 'change'
    | 'session'
    | 'directory'
  )[];
  searchType?: 'semantic' | 'structural' | 'usage' | 'dependency';
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: TimeRangeParams;
    checkpointId?: string;
  };
  includeRelated?: boolean;
  limit?: number;
}

/**
 * Graph search result
 */
export interface GraphSearchResult {
  entities: Entity[];
  relationships: GraphRelationship[];
  query: GraphSearchRequest;
  executionTime: number;
  totalMatches: number;
  clusters: any[];
  relevanceScore: number;
}

/**
 * Examples for a graph entity
 */
export interface GraphExamples {
  entityId: string;
  signature: string;
  usageExamples: {
    context: string;
    code: string;
    file: string;
    line: number;
  }[];
  testExamples: {
    testId: string;
    testName: string;
    file: string;
    assertions: string[];
  }[];
  documentationExamples: {
    section: string;
    content: string;
    source: string;
  }[];
}
