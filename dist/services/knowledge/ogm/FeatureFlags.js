/**
 * Feature Flag Service for OGM Migration
 * Controls which implementation to use during the transition period
 */
import { EventEmitter } from 'events';
export class FeatureFlagService extends EventEmitter {
    constructor() {
        super();
        this.config = this.loadConfiguration();
    }
    /**
     * Load feature flag configuration from environment variables
     */
    loadConfiguration() {
        const useOGM = this.getBooleanEnv('NEO4J_USE_OGM', false);
        return {
            useOGM,
            // Service-specific flags default to main flag unless explicitly set
            useOGMEntityService: this.getBooleanEnv('NEO4J_USE_OGM_ENTITY_SERVICE', useOGM),
            useOGMRelationshipService: this.getBooleanEnv('NEO4J_USE_OGM_RELATIONSHIP_SERVICE', false), // Not implemented yet
            useOGMEmbeddingService: this.getBooleanEnv('NEO4J_USE_OGM_EMBEDDING_SERVICE', false), // Not implemented yet
            useOGMSearchService: this.getBooleanEnv('NEO4J_USE_OGM_SEARCH_SERVICE', useOGM), // Implemented in Phase 4
            useOGMHistoryService: this.getBooleanEnv('NEO4J_USE_OGM_HISTORY_SERVICE', false), // Not implemented yet
            useOGMAnalysisService: this.getBooleanEnv('NEO4J_USE_OGM_ANALYSIS_SERVICE', false), // Not implemented yet
            // Migration control
            enableOGMFallback: this.getBooleanEnv('NEO4J_OGM_ENABLE_FALLBACK', true),
            logMigrationMetrics: this.getBooleanEnv('NEO4J_LOG_MIGRATION_METRICS', false),
            enablePerformanceComparison: this.getBooleanEnv('NEO4J_ENABLE_PERFORMANCE_COMPARISON', false),
        };
    }
    /**
     * Get boolean value from environment variable with default
     */
    getBooleanEnv(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined)
            return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }
    /**
     * Check if OGM should be used globally
     */
    isOGMEnabled() {
        return this.config.useOGM;
    }
    /**
     * Check if OGM should be used for a specific service
     */
    isOGMEnabledForService(serviceName) {
        return this.config[serviceName];
    }
    /**
     * Check if fallback to legacy implementation is enabled
     */
    isFallbackEnabled() {
        return this.config.enableOGMFallback;
    }
    /**
     * Check if migration metrics should be logged
     */
    shouldLogMetrics() {
        return this.config.logMigrationMetrics;
    }
    /**
     * Check if performance comparison is enabled
     */
    isPerformanceComparisonEnabled() {
        return this.config.enablePerformanceComparison;
    }
    /**
     * Get full configuration (for debugging)
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration (for testing purposes)
     */
    updateConfig(updates) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...updates };
        this.emit('config:updated', { old: oldConfig, new: this.config });
    }
    /**
     * Get migration status summary
     */
    getMigrationStatus() {
        const serviceFlags = [
            'useOGMEntityService',
            'useOGMRelationshipService',
            'useOGMEmbeddingService',
            'useOGMSearchService',
            'useOGMHistoryService',
            'useOGMAnalysisService',
        ];
        const servicesUsingOGM = [];
        const servicesUsingLegacy = [];
        serviceFlags.forEach(flag => {
            const serviceName = flag.replace('useOGM', '').replace('Service', '');
            if (this.config[flag]) {
                servicesUsingOGM.push(serviceName);
            }
            else {
                servicesUsingLegacy.push(serviceName);
            }
        });
        return {
            ogmEnabled: this.config.useOGM,
            servicesUsingOGM,
            servicesUsingLegacy,
            fallbackEnabled: this.config.enableOGMFallback,
        };
    }
}
// Singleton instance
let featureFlagService = null;
export function getFeatureFlagService() {
    if (!featureFlagService) {
        featureFlagService = new FeatureFlagService();
    }
    return featureFlagService;
}
//# sourceMappingURL=FeatureFlags.js.map