/**
 * Service Adapter
 * Ensures API consistency between OGM and legacy implementations
 */
import { EventEmitter } from 'events';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';
import { getMigrationErrorHandler } from './ErrorHandler.js';
/**
 * Adapter that wraps both implementations and provides fallback capabilities
 */
export class EntityServiceAdapter extends EventEmitter {
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
        this.legacyService.on('entity:created', data => this.emit('entity:created', data));
        this.legacyService.on('entity:updated', data => this.emit('entity:updated', data));
        this.legacyService.on('entity:deleted', data => this.emit('entity:deleted', data));
        this.legacyService.on('entities:bulk:created', data => this.emit('entities:bulk:created', data));
        // Forward OGM events if available
        if (this.ogmService) {
            this.ogmService.on('entity:created', data => this.emit('entity:created', data));
            this.ogmService.on('entity:updated', data => this.emit('entity:updated', data));
            this.ogmService.on('entity:deleted', data => this.emit('entity:deleted', data));
            this.ogmService.on('entities:bulk:created', data => this.emit('entities:bulk:created', data));
            this.ogmService.on('error', data => this.emit('ogm:error', data));
        }
    }
    /**
     * Determine which implementation to use
     */
    shouldUseOGM() {
        return this.featureFlags.isOGMEnabledForService('useOGMEntityService') && this.ogmService !== null;
    }
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    async executeWithFallback(operationName, ogmOperation, legacyOperation, entityData) {
        const useOGM = this.shouldUseOGM();
        const implementationType = useOGM ? 'ogm' : 'legacy';
        if (useOGM && this.ogmService) {
            try {
                return await this.tracker.trackOperation('EntityService', operationName, 'ogm', ogmOperation);
            }
            catch (error) {
                // Handle error through the error handler
                const errorContext = {
                    serviceName: 'EntityService',
                    operationName,
                    implementationType: 'ogm',
                    entity: entityData,
                    timestamp: new Date(),
                };
                const { shouldFallback } = await this.errorHandler.handleError(error, errorContext);
                this.emit('ogm:error', { operation: operationName, error, context: errorContext });
                // Fallback to legacy if recommended by error handler
                if (shouldFallback) {
                    console.warn(`[EntityServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
                    return await this.tracker.trackOperation('EntityService', operationName, 'legacy', legacyOperation);
                }
                throw error;
            }
        }
        else {
            return await this.tracker.trackOperation('EntityService', operationName, 'legacy', legacyOperation);
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
            this.tracker.trackOperation('EntityService', `${operationName}_ogm`, 'ogm', ogmOperation),
            this.tracker.trackOperation('EntityService', `${operationName}_legacy`, 'legacy', legacyOperation),
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
    // IEntityService implementation
    async createEntity(entity) {
        return this.executeWithFallback('createEntity', () => this.ogmService.createEntity(entity), () => this.legacyService.createEntity(entity), entity);
    }
    async updateEntity(id, updates) {
        return this.executeWithFallback('updateEntity', () => this.ogmService.updateEntity(id, updates), () => this.legacyService.updateEntity(id, updates), { id, updates });
    }
    async getEntity(id) {
        return this.executeWithFallback('getEntity', () => this.ogmService.getEntity(id), () => this.legacyService.getEntity(id));
    }
    async deleteEntity(id) {
        return this.executeWithFallback('deleteEntity', () => this.ogmService.deleteEntity(id), () => this.legacyService.deleteEntity(id));
    }
    async listEntities(options) {
        return this.executeWithFallback('listEntities', () => this.ogmService.listEntities(options), () => this.legacyService.listEntities(options));
    }
    async createEntitiesBulk(entities, options) {
        return this.executeWithFallback('createEntitiesBulk', () => this.ogmService.createEntitiesBulk(entities, options), () => this.legacyService.createEntitiesBulk(entities, options), { entityCount: entities.length, options });
    }
    async getEntitiesByFile(filePath) {
        return this.executeWithFallback('getEntitiesByFile', async () => {
            // OGM implementation needs to be added to EntityServiceOGM
            const result = await this.ogmService.listEntities({ path: filePath });
            return result.items;
        }, () => this.legacyService.getEntitiesByFile(filePath));
    }
    async getEntitiesByType(type, limit = 100) {
        return this.executeWithFallback('getEntitiesByType', async () => {
            const result = await this.ogmService.listEntities({ type, limit });
            return result.items;
        }, () => this.legacyService.getEntitiesByType(type, limit));
    }
    async entityExists(id) {
        return this.executeWithFallback('entityExists', async () => {
            const entity = await this.ogmService.getEntity(id);
            return entity !== null;
        }, () => this.legacyService.entityExists(id));
    }
    async getEntityStats() {
        return this.executeWithFallback('getEntityStats', async () => {
            // This method needs to be implemented in EntityServiceOGM
            // For now, fallback to legacy
            return this.legacyService.getEntityStats();
        }, () => this.legacyService.getEntityStats());
    }
    // Additional methods for compatibility
    async updateEntityMetadata(id, metadata) {
        return this.executeWithFallback('updateEntityMetadata', async () => {
            // Convert to update operation for OGM
            await this.ogmService.updateEntity(id, { metadata });
        }, () => this.legacyService.updateEntityMetadata(id, metadata));
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
        this.featureFlags.updateConfig({ useOGMEntityService: false });
    }
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM() {
        if (!this.ogmService) {
            throw new Error('OGM service not available');
        }
        this.featureFlags.updateConfig({ useOGMEntityService: true });
    }
}
/**
 * Adapter that wraps relationship service implementations and provides fallback capabilities
 */
export class RelationshipServiceAdapter extends EventEmitter {
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
        this.legacyService.on('relationship:created', data => this.emit('relationship:created', data));
        this.legacyService.on('relationship:deleted', data => this.emit('relationship:deleted', data));
        this.legacyService.on('relationships:bulk:created', data => this.emit('relationships:bulk:created', data));
        this.legacyService.on('relationships:marked:inactive', data => this.emit('relationships:marked:inactive', data));
        this.legacyService.on('relationships:merged', data => this.emit('relationships:merged', data));
        // Forward OGM events if available
        if (this.ogmService) {
            this.ogmService.on('relationship:created', data => this.emit('relationship:created', data));
            this.ogmService.on('relationship:deleted', data => this.emit('relationship:deleted', data));
            this.ogmService.on('relationships:bulk:created', data => this.emit('relationships:bulk:created', data));
            this.ogmService.on('relationships:marked:inactive', data => this.emit('relationships:marked:inactive', data));
            this.ogmService.on('relationships:merged', data => this.emit('relationships:merged', data));
            this.ogmService.on('error', data => this.emit('ogm:error', data));
        }
    }
    /**
     * Determine which implementation to use
     */
    shouldUseOGM() {
        return this.featureFlags.isOGMEnabledForService('useOGMRelationshipService') && this.ogmService !== null;
    }
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    async executeWithFallback(operationName, ogmOperation, legacyOperation, relationshipData) {
        const useOGM = this.shouldUseOGM();
        const implementationType = useOGM ? 'ogm' : 'legacy';
        if (useOGM && this.ogmService) {
            try {
                return await this.tracker.trackOperation('RelationshipService', operationName, 'ogm', ogmOperation);
            }
            catch (error) {
                // Handle error through the error handler
                const errorContext = {
                    serviceName: 'RelationshipService',
                    operationName,
                    implementationType: 'ogm',
                    relationship: relationshipData,
                    timestamp: new Date(),
                };
                const { shouldFallback } = await this.errorHandler.handleError(error, errorContext);
                this.emit('ogm:error', { operation: operationName, error, context: errorContext });
                // Fallback to legacy if recommended by error handler
                if (shouldFallback) {
                    console.warn(`[RelationshipServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
                    return await this.tracker.trackOperation('RelationshipService', operationName, 'legacy', legacyOperation);
                }
                throw error;
            }
        }
        else {
            return await this.tracker.trackOperation('RelationshipService', operationName, 'legacy', legacyOperation);
        }
    }
    // IRelationshipService implementation
    async createRelationship(relationship) {
        return this.executeWithFallback('createRelationship', () => this.ogmService.createRelationship(relationship), () => this.legacyService.createRelationship(relationship), relationship);
    }
    async createRelationshipsBulk(relationships, options = {}) {
        return this.executeWithFallback('createRelationshipsBulk', () => this.ogmService.createRelationshipsBulk(relationships, options), () => this.legacyService.createRelationshipsBulk(relationships, options), { relationshipCount: relationships.length, options });
    }
    async getRelationships(query) {
        return this.executeWithFallback('getRelationships', () => this.ogmService.getRelationships(query), () => this.legacyService.getRelationships(query));
    }
    async deleteRelationship(fromId, toId, type) {
        return this.executeWithFallback('deleteRelationship', () => this.ogmService.deleteRelationship(fromId, toId, type), () => this.legacyService.deleteRelationship(fromId, toId, type));
    }
    async updateRelationshipAuxiliary(relId, rel) {
        return this.executeWithFallback('updateRelationshipAuxiliary', () => this.ogmService.updateRelationshipAuxiliary(relId, rel), () => this.legacyService.updateRelationshipAuxiliary(relId, rel));
    }
    async mergeNormalizedDuplicates() {
        return this.executeWithFallback('mergeNormalizedDuplicates', () => this.ogmService.mergeNormalizedDuplicates(), () => this.legacyService.mergeNormalizedDuplicates());
    }
    async getRelationshipStats() {
        return this.executeWithFallback('getRelationshipStats', () => this.ogmService.getRelationshipStats(), () => this.legacyService.getRelationshipStats());
    }
    async markInactiveEdgesNotSeenSince(since) {
        return this.executeWithFallback('markInactiveEdgesNotSeenSince', () => this.ogmService.markInactiveEdgesNotSeenSince(since), () => this.legacyService.markInactiveEdgesNotSeenSince(since));
    }
    async upsertEdgeEvidenceBulk(updates) {
        return this.executeWithFallback('upsertEdgeEvidenceBulk', () => this.ogmService.upsertEdgeEvidenceBulk(updates), () => this.legacyService.upsertEdgeEvidenceBulk(updates));
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
        this.featureFlags.updateConfig({ useOGMRelationshipService: false });
    }
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM() {
        if (!this.ogmService) {
            throw new Error('OGM service not available');
        }
        this.featureFlags.updateConfig({ useOGMRelationshipService: true });
    }
}
//# sourceMappingURL=ServiceAdapter.js.map