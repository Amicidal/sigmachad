/**
 * Service Adapter
 * Ensures API consistency between OGM and legacy implementations
 */
import { EventEmitter } from 'events';
import { EntityService } from '../EntityService.js';
import { EntityServiceOGM } from './EntityServiceOGM.js';
import { RelationshipService } from '../RelationshipService.js';
import { RelationshipServiceOGM, IRelationshipService, BulkRelationshipOptions, RelationshipStats } from './RelationshipServiceOGM.js';
import { Entity } from '../../../models/entities.js';
import { GraphRelationship, RelationshipType, RelationshipQuery } from '../../../models/relationships.js';
export interface IEntityService extends EventEmitter {
    createEntity(entity: Entity): Promise<Entity>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    getEntity(id: string): Promise<Entity | null>;
    deleteEntity(id: string): Promise<void>;
    listEntities(options?: any): Promise<{
        items: Entity[];
        total: number;
    }>;
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    getEntitiesByType(type: string, limit?: number): Promise<Entity[]>;
    entityExists(id: string): Promise<boolean>;
    getEntityStats(): Promise<any>;
}
/**
 * Adapter that wraps both implementations and provides fallback capabilities
 */
export declare class EntityServiceAdapter extends EventEmitter implements IEntityService {
    private legacyService;
    private ogmService;
    private featureFlags;
    private tracker;
    private errorHandler;
    constructor(legacyService: EntityService, ogmService?: EntityServiceOGM);
    /**
     * Set up event forwarding from both implementations
     */
    private setupEventForwarding;
    /**
     * Determine which implementation to use
     */
    private shouldUseOGM;
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    private executeWithFallback;
    /**
     * Execute operation with performance comparison (if enabled)
     */
    private executeWithComparison;
    createEntity(entity: Entity): Promise<Entity>;
    updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
    getEntity(id: string): Promise<Entity | null>;
    deleteEntity(id: string): Promise<void>;
    listEntities(options?: any): Promise<{
        items: Entity[];
        total: number;
    }>;
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    getEntitiesByFile(filePath: string): Promise<Entity[]>;
    getEntitiesByType(type: string, limit?: number): Promise<Entity[]>;
    entityExists(id: string): Promise<boolean>;
    getEntityStats(): Promise<any>;
    updateEntityMetadata(id: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Get migration status for this adapter
     */
    getMigrationStatus(): {
        isUsingOGM: boolean;
        hasOGMService: boolean;
        fallbackEnabled: boolean;
        performanceComparisonEnabled: boolean;
        errorStats: any;
    };
    /**
     * Get error recommendations
     */
    getErrorRecommendations(): any;
    /**
     * Reset error tracking (for testing)
     */
    resetErrorTracking(): void;
    /**
     * Force switch to legacy implementation (for testing/debugging)
     */
    forceLegacy(): void;
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM(): void;
}
/**
 * Adapter that wraps relationship service implementations and provides fallback capabilities
 */
export declare class RelationshipServiceAdapter extends EventEmitter implements IRelationshipService {
    private legacyService;
    private ogmService;
    private featureFlags;
    private tracker;
    private errorHandler;
    constructor(legacyService: RelationshipService, ogmService?: RelationshipServiceOGM);
    /**
     * Set up event forwarding from both implementations
     */
    private setupEventForwarding;
    /**
     * Determine which implementation to use
     */
    private shouldUseOGM;
    /**
     * Execute operation with fallback support and comprehensive error handling
     */
    private executeWithFallback;
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: BulkRelationshipOptions): Promise<{
        created: number;
        updated: number;
        failed: number;
    }>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    deleteRelationship(fromId: string, toId: string, type: RelationshipType): Promise<void>;
    updateRelationshipAuxiliary(relId: string, rel: GraphRelationship): Promise<void>;
    mergeNormalizedDuplicates(): Promise<number>;
    getRelationshipStats(): Promise<RelationshipStats>;
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    upsertEdgeEvidenceBulk(updates: Array<{
        fromId: string;
        toId: string;
        type: RelationshipType;
        evidence: any[];
        locations?: any[];
    }>): Promise<void>;
    /**
     * Get migration status for this adapter
     */
    getMigrationStatus(): {
        isUsingOGM: boolean;
        hasOGMService: boolean;
        fallbackEnabled: boolean;
        performanceComparisonEnabled: boolean;
        errorStats: any;
    };
    /**
     * Get error recommendations
     */
    getErrorRecommendations(): any;
    /**
     * Reset error tracking (for testing)
     */
    resetErrorTracking(): void;
    /**
     * Force switch to legacy implementation (for testing/debugging)
     */
    forceLegacy(): void;
    /**
     * Force switch to OGM implementation (for testing/debugging)
     */
    forceOGM(): void;
}
//# sourceMappingURL=ServiceAdapter.d.ts.map