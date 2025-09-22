/**
 * Search Service Adapter
 * Ensures API consistency between OGM and legacy search implementations
 */
import { EventEmitter } from 'events';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';
import { getMigrationErrorHandler } from './ErrorHandler.js';
/**
 * Adapter that wraps both search implementations and provides fallback capabilities
 */
export class SearchServiceAdapter extends EventEmitter {
    constructor(legacyService, ogmService) {
        super();
        this.ogmService = null;
        this.featureFlags = getFeatureFlagService();
        this.tracker = getMigrationTracker();
        this.errorHandler = getMigrationErrorHandler();
        this.legacyService = legacyService;
        this.ogmService = ogmService || null;
        // Forward events from both services
        this.setupEventForwarding();
    }
    /**
     * Set up event forwarding from both implementations
     */
    setupEventForwarding() {
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
    shouldUseOGM() {
        return this.featureFlags.isOGMEnabledForService('useOGMSearchService') && this.ogmService !== null;
    }
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    async executeWithFallback(operationName, ogmOperation, legacyOperation, searchData) {
        const useOGM = this.shouldUseOGM();
        const implementationType = useOGM ? 'ogm' : 'legacy';
        if (useOGM && this.ogmService) {
            try {
                return await this.tracker.trackOperation('SearchService', operationName, 'ogm', ogmOperation);
            }
            catch (error) {
                // Handle error through the error handler
                const errorContext = {
                    serviceName: 'SearchService',
                    operationName,
                    implementationType: 'ogm',
                    searchData,
                    timestamp: new Date(),
                };
                const { shouldFallback } = await this.errorHandler.handleError(error, errorContext);
                this.emit('ogm:error', { operation: operationName, error, context: errorContext });
                // Fallback to legacy if recommended by error handler
                if (shouldFallback) {
                    console.warn(`[SearchServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
                    return await this.tracker.trackOperation('SearchService', operationName, 'legacy', legacyOperation);
                }
                throw error;
            }
        }
        else {
            return await this.tracker.trackOperation('SearchService', operationName, 'legacy', legacyOperation);
        }
    }
    /**
     * Execute operation with performance comparison (if enabled)
     */
    async executeWithComparison(operationName, ogmOperation, legacyOperation) {
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
        }
        else if (ogmResult.status === 'fulfilled') {
            console.log(`[Performance Comparison] ${operationName} - Only OGM succeeded`);
            return ogmResult.value;
        }
        else if (legacyResult.status === 'fulfilled') {
            console.log(`[Performance Comparison] ${operationName} - Only legacy succeeded`);
            return legacyResult.value;
        }
        else {
            console.error(`[Performance Comparison] ${operationName} - Both implementations failed`);
            throw ogmResult.reason;
        }
    }
    // ISearchService implementation
    async search(request) {
        return this.executeWithFallback('search', () => this.ogmService.search(request), () => this.legacyService.search(request), request);
    }
    async structuralSearch(query, options = {}) {
        return this.executeWithFallback('structuralSearch', () => this.ogmService.structuralSearch(query, options), () => this.legacyService.structuralSearch(query, options), { query, options });
    }
    async semanticSearch(query, options = {}) {
        return this.executeWithFallback('semanticSearch', () => this.ogmService.semanticSearch(query, options), () => this.legacyService.semanticSearch(query, options), { query, options });
    }
    async hybridSearch(request) {
        return this.executeWithFallback('hybridSearch', () => this.ogmService.hybridSearch(request), () => this.legacyService.hybridSearch(request), request);
    }
    async findSymbolsByName(name, options = {}) {
        return this.executeWithFallback('findSymbolsByName', () => this.ogmService.findSymbolsByName(name, options), () => this.legacyService.findSymbolsByName(name, options), { name, options });
    }
    async findNearbySymbols(filePath, position, options = {}) {
        return this.executeWithFallback('findNearbySymbols', () => this.ogmService.findNearbySymbols(filePath, position, options), () => this.legacyService.findNearbySymbols(filePath, position, options), { filePath, position, options });
    }
    async patternSearch(pattern, options = {}) {
        return this.executeWithFallback('patternSearch', () => this.ogmService.patternSearch(pattern, options), () => this.legacyService.patternSearch(pattern, options), { pattern, options });
    }
    async getEntityExamples(entityId) {
        return this.executeWithFallback('getEntityExamples', () => this.ogmService.getEntityExamples(entityId), () => this.legacyService.getEntityExamples(entityId), { entityId });
    }
    async getSearchStats() {
        return this.executeWithFallback('getSearchStats', () => this.ogmService.getSearchStats(), () => this.legacyService.getSearchStats());
    }
    clearCache() {
        if (this.shouldUseOGM() && this.ogmService) {
            this.ogmService.clearCache();
        }
        else {
            this.legacyService.clearCache();
        }
    }
    invalidateCache(pattern) {
        if (this.shouldUseOGM() && this.ogmService) {
            this.ogmService.invalidateCache(pattern);
        }
        else {
            this.legacyService.invalidateCache(pattern);
        }
    }
    /**
     * Get migration status for this adapter
     */
    getMigrationStatus() {
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
    getErrorRecommendations() {
        return this.errorHandler.getThresholdRecommendations();
    }
    /**
     * Reset error tracking (for testing)
     */
    resetErrorTracking() {
        this.errorHandler.reset();
    }
    /**
     * Force switch to legacy implementation (for testing/debugging)
     */
    forceLegacy() {
        this.featureFlags.updateConfig({ useOGMSearchService: false });
    }
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM() {
        if (!this.ogmService) {
            throw new Error('OGM service not available');
        }
        this.featureFlags.updateConfig({ useOGMSearchService: true });
    }
}
//# sourceMappingURL=SearchServiceAdapter.js.map