/**
 * SearchManager - Handles all search operations and caching
 * Moved from KnowledgeGraphService.ts during refactoring
 */

import { Entity } from './entities.js';
import { GraphSearchRequest } from '@memento/core';

interface SearchService {
  search(request: GraphSearchRequest): Promise<any[]>;
  semanticSearch(query: string, options?: any): Promise<any[]>;
  structuralSearch(query: string, options?: any): Promise<any[]>;
  findSymbolsByName(name: string, options?: any): Promise<Entity[]>;
  findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]>;
  getEntityExamples(entityId: string): Promise<any>;
  clearCache(): void;
  invalidateCache(pattern?: any): void;
}

export class SearchManager {
  private searchService: SearchService;

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.searchService.search(request);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    const results = await this.searchService.search(request);
    return results.map((r) => r.entity);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.searchService.findSymbolsByName(name, options);
  }

  async findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]> {
    return this.searchService.findNearbySymbols(filePath, position, options);
  }

  async getEntityExamples(entityId: string): Promise<any> {
    return this.searchService.getEntityExamples(entityId);
  }

  async clearSearchCache(): Promise<void> {
    this.searchService.clearCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    this.searchService.invalidateCache(pattern);
  }
}
