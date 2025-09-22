/**
 * Feature Flag Service for OGM Migration
 * Controls which implementation to use during the transition period
 */
import { EventEmitter } from 'events';
export interface FeatureFlagConfig {
    useOGM: boolean;
    useOGMEntityService: boolean;
    useOGMRelationshipService: boolean;
    useOGMEmbeddingService: boolean;
    useOGMSearchService: boolean;
    useOGMHistoryService: boolean;
    useOGMAnalysisService: boolean;
    enableOGMFallback: boolean;
    logMigrationMetrics: boolean;
    enablePerformanceComparison: boolean;
}
export declare class FeatureFlagService extends EventEmitter {
    private config;
    constructor();
    /**
     * Load feature flag configuration from environment variables
     */
    private loadConfiguration;
    /**
     * Get boolean value from environment variable with default
     */
    private getBooleanEnv;
    /**
     * Check if OGM should be used globally
     */
    isOGMEnabled(): boolean;
    /**
     * Check if OGM should be used for a specific service
     */
    isOGMEnabledForService(serviceName: keyof FeatureFlagConfig): boolean;
    /**
     * Check if fallback to legacy implementation is enabled
     */
    isFallbackEnabled(): boolean;
    /**
     * Check if migration metrics should be logged
     */
    shouldLogMetrics(): boolean;
    /**
     * Check if performance comparison is enabled
     */
    isPerformanceComparisonEnabled(): boolean;
    /**
     * Get full configuration (for debugging)
     */
    getConfig(): FeatureFlagConfig;
    /**
     * Update configuration (for testing purposes)
     */
    updateConfig(updates: Partial<FeatureFlagConfig>): void;
    /**
     * Get migration status summary
     */
    getMigrationStatus(): {
        ogmEnabled: boolean;
        servicesUsingOGM: string[];
        servicesUsingLegacy: string[];
        fallbackEnabled: boolean;
    };
}
export declare function getFeatureFlagService(): FeatureFlagService;
//# sourceMappingURL=FeatureFlags.d.ts.map