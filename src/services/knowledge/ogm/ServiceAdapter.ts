/**
 * Service Adapter
 * Ensures API consistency between OGM and legacy implementations
 */

import { EventEmitter } from 'events';
import { EntityService } from '../EntityService.js';
import { EntityServiceOGM } from './EntityServiceOGM.js';
import { RelationshipService } from '../RelationshipService.js';
import { RelationshipServiceOGM, IRelationshipService, BulkRelationshipOptions, RelationshipStats } from './RelationshipServiceOGM.js';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';
import { getMigrationErrorHandler } from './ErrorHandler.js';
import { Entity } from '../../../models/entities.js';
import { GraphRelationship, RelationshipType, RelationshipQuery } from '../../../models/relationships.js';

// Common interface that both implementations should follow
export interface IEntityService extends EventEmitter {
  createEntity(entity: Entity): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  getEntity(id: string): Promise<Entity | null>;
  deleteEntity(id: string): Promise<void>;
  listEntities(options?: any): Promise<{ items: Entity[]; total: number }>;
  createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
  getEntitiesByFile(filePath: string): Promise<Entity[]>;
  getEntitiesByType(type: string, limit?: number): Promise<Entity[]>;
  entityExists(id: string): Promise<boolean>;
  getEntityStats(): Promise<any>;
}

/**
 * Adapter that wraps both implementations and provides fallback capabilities
 */
export class EntityServiceAdapter extends EventEmitter implements IEntityService {
  private legacyService: EntityService;
  private ogmService: EntityServiceOGM | null = null;
  private featureFlags = getFeatureFlagService();
  private tracker = getMigrationTracker();
  private errorHandler = getMigrationErrorHandler();

  constructor(legacyService: EntityService, ogmService?: EntityServiceOGM) {
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
  private shouldUseOGM(): boolean {
    return this.featureFlags.isOGMEnabledForService('useOGMEntityService') && this.ogmService !== null;
  }

  /**
   * Execute operation with fallback support and comprehensive error handling
   */
  private async executeWithFallback<T>(
    operationName: string,
    ogmOperation: () => Promise<T>,
    legacyOperation: () => Promise<T>,
    entityData?: any
  ): Promise<T> {
    const useOGM = this.shouldUseOGM();
    const implementationType = useOGM ? 'ogm' : 'legacy';

    if (useOGM && this.ogmService) {
      try {
        return await this.tracker.trackOperation(
          'EntityService',
          operationName,
          'ogm',
          ogmOperation
        );
      } catch (error) {
        // Handle error through the error handler
        const errorContext = {
          serviceName: 'EntityService',
          operationName,
          implementationType: 'ogm',
          entity: entityData,
          timestamp: new Date(),
        };

        const { shouldFallback } = await this.errorHandler.handleError(
          error as Error,
          errorContext
        );

        this.emit('ogm:error', { operation: operationName, error, context: errorContext });

        // Fallback to legacy if recommended by error handler
        if (shouldFallback) {
          console.warn(`[EntityServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
          return await this.tracker.trackOperation(
            'EntityService',
            operationName,
            'legacy',
            legacyOperation
          );
        }
        throw error;
      }
    } else {
      return await this.tracker.trackOperation(
        'EntityService',
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
      this.tracker.trackOperation('EntityService', `${operationName}_ogm`, 'ogm', ogmOperation),
      this.tracker.trackOperation('EntityService', `${operationName}_legacy`, 'legacy', legacyOperation),
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

  // IEntityService implementation

  async createEntity(entity: Entity): Promise<Entity> {
    return this.executeWithFallback(
      'createEntity',
      () => this.ogmService!.createEntity(entity),
      () => this.legacyService.createEntity(entity),
      entity
    );
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    return this.executeWithFallback(
      'updateEntity',
      () => this.ogmService!.updateEntity(id, updates),
      () => this.legacyService.updateEntity(id, updates),
      { id, updates }
    );
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.executeWithFallback(
      'getEntity',
      () => this.ogmService!.getEntity(id),
      () => this.legacyService.getEntity(id)
    );
  }

  async deleteEntity(id: string): Promise<void> {
    return this.executeWithFallback(
      'deleteEntity',
      () => this.ogmService!.deleteEntity(id),
      () => this.legacyService.deleteEntity(id)
    );
  }

  async listEntities(options?: any): Promise<{ items: Entity[]; total: number }> {
    return this.executeWithFallback(
      'listEntities',
      () => this.ogmService!.listEntities(options),
      () => this.legacyService.listEntities(options)
    );
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    return this.executeWithFallback(
      'createEntitiesBulk',
      () => this.ogmService!.createEntitiesBulk(entities, options),
      () => this.legacyService.createEntitiesBulk(entities, options),
      { entityCount: entities.length, options }
    );
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.executeWithFallback(
      'getEntitiesByFile',
      async () => {
        // OGM implementation needs to be added to EntityServiceOGM
        const result = await this.ogmService!.listEntities({ path: filePath });
        return result.items;
      },
      () => this.legacyService.getEntitiesByFile(filePath)
    );
  }

  async getEntitiesByType(type: string, limit = 100): Promise<Entity[]> {
    return this.executeWithFallback(
      'getEntitiesByType',
      async () => {
        const result = await this.ogmService!.listEntities({ type, limit });
        return result.items;
      },
      () => this.legacyService.getEntitiesByType(type, limit)
    );
  }

  async entityExists(id: string): Promise<boolean> {
    return this.executeWithFallback(
      'entityExists',
      async () => {
        const entity = await this.ogmService!.getEntity(id);
        return entity !== null;
      },
      () => this.legacyService.entityExists(id)
    );
  }

  async getEntityStats(): Promise<any> {
    return this.executeWithFallback(
      'getEntityStats',
      async () => {
        // This method needs to be implemented in EntityServiceOGM
        // For now, fallback to legacy
        return this.legacyService.getEntityStats();
      },
      () => this.legacyService.getEntityStats()
    );
  }

  // Additional methods for compatibility

  async updateEntityMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    return this.executeWithFallback(
      'updateEntityMetadata',
      async () => {
        // Convert to update operation for OGM
        await this.ogmService!.updateEntity(id, { metadata });
      },
      () => this.legacyService.updateEntityMetadata(id, metadata)
    );
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
    this.featureFlags.updateConfig({ useOGMEntityService: false });
  }

  /**
   * Force switch to OGM implementation (for testing/debugging)
   */
  forceOGM(): void {
    if (!this.ogmService) {
      throw new Error('OGM service not available');
    }
    this.featureFlags.updateConfig({ useOGMEntityService: true });
  }
}

/**
 * Adapter that wraps relationship service implementations and provides fallback capabilities
 */
export class RelationshipServiceAdapter extends EventEmitter implements IRelationshipService {
  private legacyService: RelationshipService;
  private ogmService: RelationshipServiceOGM | null = null;
  private featureFlags = getFeatureFlagService();
  private tracker = getMigrationTracker();
  private errorHandler = getMigrationErrorHandler();

  constructor(legacyService: RelationshipService, ogmService?: RelationshipServiceOGM) {
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
  private shouldUseOGM(): boolean {
    return this.featureFlags.isOGMEnabledForService('useOGMRelationshipService') && this.ogmService !== null;
  }

  /**
   * Execute operation with fallback support and comprehensive error handling
   */
  private async executeWithFallback<T>(
    operationName: string,
    ogmOperation: () => Promise<T>,
    legacyOperation: () => Promise<T>,
    relationshipData?: any
  ): Promise<T> {
    const useOGM = this.shouldUseOGM();
    const implementationType = useOGM ? 'ogm' : 'legacy';

    if (useOGM && this.ogmService) {
      try {
        return await this.tracker.trackOperation(
          'RelationshipService',
          operationName,
          'ogm',
          ogmOperation
        );
      } catch (error) {
        // Handle error through the error handler
        const errorContext = {
          serviceName: 'RelationshipService',
          operationName,
          implementationType: 'ogm',
          relationship: relationshipData,
          timestamp: new Date(),
        };

        const { shouldFallback } = await this.errorHandler.handleError(
          error as Error,
          errorContext
        );

        this.emit('ogm:error', { operation: operationName, error, context: errorContext });

        // Fallback to legacy if recommended by error handler
        if (shouldFallback) {
          console.warn(`[RelationshipServiceAdapter] OGM operation failed, falling back to legacy: ${operationName}`);
          return await this.tracker.trackOperation(
            'RelationshipService',
            operationName,
            'legacy',
            legacyOperation
          );
        }
        throw error;
      }
    } else {
      return await this.tracker.trackOperation(
        'RelationshipService',
        operationName,
        'legacy',
        legacyOperation
      );
    }
  }

  // IRelationshipService implementation

  async createRelationship(relationship: GraphRelationship): Promise<GraphRelationship> {
    return this.executeWithFallback(
      'createRelationship',
      () => this.ogmService!.createRelationship(relationship),
      () => this.legacyService.createRelationship(relationship),
      relationship
    );
  }

  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options: BulkRelationshipOptions = {}
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    return this.executeWithFallback(
      'createRelationshipsBulk',
      () => this.ogmService!.createRelationshipsBulk(relationships, options),
      () => this.legacyService.createRelationshipsBulk(relationships, options),
      { relationshipCount: relationships.length, options }
    );
  }

  async getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    return this.executeWithFallback(
      'getRelationships',
      () => this.ogmService!.getRelationships(query),
      () => this.legacyService.getRelationships(query)
    );
  }

  async deleteRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void> {
    return this.executeWithFallback(
      'deleteRelationship',
      () => this.ogmService!.deleteRelationship(fromId, toId, type),
      () => this.legacyService.deleteRelationship(fromId, toId, type)
    );
  }

  async updateRelationshipAuxiliary(
    relId: string,
    rel: GraphRelationship
  ): Promise<void> {
    return this.executeWithFallback(
      'updateRelationshipAuxiliary',
      () => this.ogmService!.updateRelationshipAuxiliary(relId, rel),
      () => this.legacyService.updateRelationshipAuxiliary(relId, rel)
    );
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.executeWithFallback(
      'mergeNormalizedDuplicates',
      () => this.ogmService!.mergeNormalizedDuplicates(),
      () => this.legacyService.mergeNormalizedDuplicates()
    );
  }

  async getRelationshipStats(): Promise<RelationshipStats> {
    return this.executeWithFallback(
      'getRelationshipStats',
      () => this.ogmService!.getRelationshipStats(),
      () => this.legacyService.getRelationshipStats()
    );
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.executeWithFallback(
      'markInactiveEdgesNotSeenSince',
      () => this.ogmService!.markInactiveEdgesNotSeenSince(since),
      () => this.legacyService.markInactiveEdgesNotSeenSince(since)
    );
  }

  async upsertEdgeEvidenceBulk(
    updates: Array<{
      fromId: string;
      toId: string;
      type: RelationshipType;
      evidence: any[];
      locations?: any[];
    }>
  ): Promise<void> {
    return this.executeWithFallback(
      'upsertEdgeEvidenceBulk',
      () => this.ogmService!.upsertEdgeEvidenceBulk(updates),
      () => this.legacyService.upsertEdgeEvidenceBulk(updates)
    );
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
    this.featureFlags.updateConfig({ useOGMRelationshipService: false });
  }

  /**
   * Force switch to OGM implementation (for testing/debugging)
   */
  forceOGM(): void {
    if (!this.ogmService) {
      throw new Error('OGM service not available');
    }
    this.featureFlags.updateConfig({ useOGMRelationshipService: true });
  }
}