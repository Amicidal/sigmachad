/**
 * Search Service Adapter
 * Ensures API consistency between OGM and legacy search implementations
 */

import { EventEmitter } from 'events';
import { SearchService } from '../SearchService.js';
import { SearchServiceOGM } from './SearchServiceOGM.js';
import { ISearchService, StructuralSearchOptions, SearchResult, SemanticSearchOptions, PatternSearchOptions, SearchStats } from './ISearchService.js';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';
import { getMigrationErrorHandler } from './ErrorHandler.js';
import { Entity } from '../../../models/entities.js';
import { GraphSearchRequest, GraphExamples } from '../../../models/types.js';

/**
 * Adapter that wraps both search implementations and provides fallback capabilities
 */
export class SearchServiceAdapter extends EventEmitter implements ISearchService {
  private legacyService: SearchService;
  private ogmService: SearchServiceOGM | null = null;
  private featureFlags = getFeatureFlagService();
  private tracker = getMigrationTracker();
  private errorHandler = getMigrationErrorHandler();

  constructor(legacyService: SearchService, ogmService?: SearchServiceOGM) {
    super();
    this.legacyService = legacyService;
    this.ogmService = ogmService || null;

    // Forward events from both services
    this.setupEventForwarding();
  }

  /**
   * Set up event forwarding from both implementations
   */
  private setupEventForwarding(): void {
    // Forward legacy events
    this.legacyService.on('search:cache:hit', data => this.emit('search:cache:hit', data));
    this.legacyService.on('search:completed', data => this.emit('search:completed', data));
    this.legacyService.on('cache:cleared', data => this.emit('cache:cleared', data));
    this.legacyService.on('cache:invalidated', data => this.emit('cache:invalidated', data));

    // Forward OGM events if available
    if (this.ogmService) {
      this.ogmService.on('search:cache:hit', data => this.emit('search:cache:hit', data));
      this.ogmService.on('search:completed', data => this.emit('search:completed', data));
      this.ogmService.on('cache:cleared', data => this.emit('cache:cleared', data));
      this.ogmService.on('cache:invalidated', data => this.emit('cache:invalidated', data));
      this.ogmService.on('error', data => this.emit('ogm:error', data));
    }
  }

  /**
   * Determine which implementation to use
   */
  private shouldUseOGM(): boolean {
    return this.featureFlags.isOGMEnabledForService('useOGMSearchService') && this.ogmService !== null;
  }

  /**
   * Execute operation with fallback support and comprehensive error handling
   */
  private async executeWithFallback<T>(
    operationName: string,
    ogmOperation: () => Promise<T>,
    legacyOperation: () => Promise<T>,
    searchData?: any
  ): Promise<T> {
    const useOGM = this.shouldUseOGM();
    const implementationType = useOGM ? 'ogm' : 'legacy';

    if (useOGM && this.ogmService) {
      try {
        return await this.tracker.trackOperation(
          'SearchService',
          operationName,
          'ogm',
          ogmOperation
        );
      } catch (error) {
        // Handle error through the error handler
        const errorContext = {
          serviceName: 'SearchService',
          operationName,
          implementationType: 'ogm',
          searchData,
          timestamp: new Date(),
        };

        const { shouldFallback } = await this.errorHandler.handleError(
          error as Error,
          errorContext
        );

        this.emit('ogm:error', { operation: operationName, error, context: errorContext });

        // Fallback to legacy if recommended by error handler
        if (shouldFallback) {
          console.warn(`[SearchServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
          return await this.tracker.trackOperation(
            'SearchService',
            operationName,
            'legacy',
            legacyOperation
          );
        }
        throw error;
      }
    } else {
      return await this.tracker.trackOperation(
        'SearchService',
        operationName,
        'legacy',
        legacyOperation
      );
    }
  }

  /**
   * Execute operation with performance comparison (if enabled)
   */
  private async executeWithComparison<T>(
    operationName: string,
    ogmOperation: () => Promise<T>,
    legacyOperation: () => Promise<T>
  ): Promise<T> {
    if (!this.featureFlags.isPerformanceComparisonEnabled() || !this.ogmService) {
      return this.executeWithFallback(operationName, ogmOperation, legacyOperation);
    }

    // Run both implementations and compare
    const [ogmResult, legacyResult] = await Promise.allSettled([
      this.tracker.trackOperation('SearchService', `${operationName}_ogm`, 'ogm', ogmOperation),
      this.tracker.trackOperation('SearchService', `${operationName}_legacy`, 'legacy', legacyOperation),
    ]);

    // Log comparison results
    if (ogmResult.status === 'fulfilled' && legacyResult.status === 'fulfilled') {
      console.log(`[Performance Comparison] ${operationName} - Both implementations succeeded`);
      // Return OGM result if configured to use it, otherwise legacy
      return this.shouldUseOGM() ? ogmResult.value : legacyResult.value;
    } else if (ogmResult.status === 'fulfilled') {
      console.log(`[Performance Comparison] ${operationName} - Only OGM succeeded`);
      return ogmResult.value;
    } else if (legacyResult.status === 'fulfilled') {
      console.log(`[Performance Comparison] ${operationName} - Only legacy succeeded`);
      return legacyResult.value;
    } else {
      console.error(`[Performance Comparison] ${operationName} - Both implementations failed`);
      throw ogmResult.reason;
    }
  }

  // ISearchService implementation

  async search(request: GraphSearchRequest): Promise<SearchResult[]> {
    return this.executeWithFallback(
      'search',
      () => this.ogmService!.search(request),
      () => this.legacyService.search(request),
      request
    );
  }

  async structuralSearch(
    query: string,
    options: StructuralSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.executeWithFallback(
      'structuralSearch',
      () => this.ogmService!.structuralSearch(query, options),
      () => this.legacyService.structuralSearch(query, options),
      { query, options }
    );
  }

  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.executeWithFallback(
      'semanticSearch',
      () => this.ogmService!.semanticSearch(query, options),
      () => this.legacyService.semanticSearch(query, options),
      { query, options }
    );
  }

  async hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]> {
    return this.executeWithFallback(
      'hybridSearch',
      () => this.ogmService!.hybridSearch(request),
      () => this.legacyService.hybridSearch(request),
      request
    );
  }

  async findSymbolsByName(
    name: string,
    options: { fuzzy?: boolean; limit?: number } = {}
  ): Promise<Entity[]> {
    return this.executeWithFallback(
      'findSymbolsByName',
      () => this.ogmService!.findSymbolsByName(name, options),
      () => this.legacyService.findSymbolsByName(name, options),
      { name, options }
    );
  }

  async findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options: { range?: number; limit?: number } = {}
  ): Promise<Entity[]> {
    return this.executeWithFallback(
      'findNearbySymbols',
      () => this.ogmService!.findNearbySymbols(filePath, position, options),
      () => this.legacyService.findNearbySymbols(filePath, position, options),
      { filePath, position, options }
    );
  }

  async patternSearch(
    pattern: string,
    options: PatternSearchOptions = {}
  ): Promise<Entity[]> {
    return this.executeWithFallback(
      'patternSearch',
      () => this.ogmService!.patternSearch(pattern, options),
      () => this.legacyService.patternSearch(pattern, options),
      { pattern, options }
    );
  }

  async getEntityExamples(entityId: string): Promise<GraphExamples> {
    return this.executeWithFallback(
      'getEntityExamples',
      () => this.ogmService!.getEntityExamples(entityId),
      () => this.legacyService.getEntityExamples(entityId),
      { entityId }
    );
  }

  async getSearchStats(): Promise<SearchStats> {
    return this.executeWithFallback(
      'getSearchStats',
      () => this.ogmService!.getSearchStats(),
      () => this.legacyService.getSearchStats()
    );
  }

  clearCache(): void {
    if (this.shouldUseOGM() && this.ogmService) {
      this.ogmService.clearCache();
    } else {
      this.legacyService.clearCache();
    }
  }

  invalidateCache(pattern?: (key: string) => boolean): void {
    if (this.shouldUseOGM() && this.ogmService) {
      this.ogmService.invalidateCache(pattern);
    } else {
      this.legacyService.invalidateCache(pattern);
    }
  }

  /**
   * Get migration status for this adapter
   */
  getMigrationStatus(): {
    isUsingOGM: boolean;
    hasOGMService: boolean;
    fallbackEnabled: boolean;
    performanceComparisonEnabled: boolean;
    errorStats: any;
  } {
    return {
      isUsingOGM: this.shouldUseOGM(),
      hasOGMService: this.ogmService !== null,
      fallbackEnabled: this.featureFlags.isFallbackEnabled(),
      performanceComparisonEnabled: this.featureFlags.isPerformanceComparisonEnabled(),
      errorStats: this.errorHandler.getErrorStats(),
    };
  }

  /**
   * Get error recommendations
   */
  getErrorRecommendations(): any {
    return this.errorHandler.getThresholdRecommendations();
  }

  /**
   * Reset error tracking (for testing)
   */
  resetErrorTracking(): void {
    this.errorHandler.reset();
  }

  /**
   * Force switch to legacy implementation (for testing/debugging)
   */
  forceLegacy(): void {
    this.featureFlags.updateConfig({ useOGMSearchService: false });
  }

  /**
   * Force switch to OGM implementation (for testing/debugging)
   */
  forceOGM(): void {
    if (!this.ogmService) {
      throw new Error('OGM service not available');
    }
    this.featureFlags.updateConfig({ useOGMSearchService: true });
  }
}