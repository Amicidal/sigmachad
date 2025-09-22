/**
 * ISearchService Interface
 * Defines the contract that both legacy and OGM search services must implement
 */

import { EventEmitter } from 'events';
import { Entity } from '../../../models/entities.js';
import {
  GraphSearchRequest,
  GraphExamples,
} from '../../../models/types.js';

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

export interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface PatternSearchOptions {
  type?: 'regex' | 'glob';
  limit?: number;
}

export interface SearchStats {
  cacheSize: number;
  cacheHitRate: number;
  topSearches: Array<{ query: string; count: number }>;
}

/**
 * Common interface that both SearchService implementations should follow
 */
export interface ISearchService extends EventEmitter {
  // Main search operations
  search(request: GraphSearchRequest): Promise<SearchResult[]>;
  structuralSearch(query: string, options?: StructuralSearchOptions): Promise<SearchResult[]>;
  semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]>;
  hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;

  // Symbol-specific searches
  findSymbolsByName(name: string, options?: { fuzzy?: boolean; limit?: number }): Promise<Entity[]>;
  findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options?: { range?: number; limit?: number }
  ): Promise<Entity[]>;

  // Pattern and example searches
  patternSearch(pattern: string, options?: PatternSearchOptions): Promise<Entity[]>;
  getEntityExamples(entityId: string): Promise<GraphExamples>;

  // Cache management
  getSearchStats(): Promise<SearchStats>;
  clearCache(): void;
  invalidateCache(pattern?: (key: string) => boolean): void;
}