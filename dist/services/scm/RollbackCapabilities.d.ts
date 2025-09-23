/**
 * Rollback Capabilities Service
 * Handles reverting changes when synchronization operations fail
 */
import { KnowledgeGraphService } from "../knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../core/DatabaseService.js";
import { Entity } from "../../models/entities.js";
import { GraphRelationship } from "../../models/relationships.js";
export interface RollbackPoint {
    id: string;
    operationId: string;
    timestamp: Date;
    entities: RollbackEntity[];
    relationships: RollbackRelationship[];
    description: string;
}
export interface RollbackEntity {
    id: string;
    action: "create" | "update" | "delete";
    previousState?: Entity;
    newState?: Entity;
}
export interface RollbackRelationship {
    id: string;
    action: "create" | "update" | "delete";
    fromEntityId?: string;
    toEntityId?: string;
    type?: GraphRelationship["type"];
    previousState?: GraphRelationship;
    newState?: GraphRelationship;
}
export interface SessionCheckpointRecord {
    checkpointId: string;
    sessionId: string;
    reason: "daily" | "incident" | "manual";
    hopCount: number;
    attempts: number;
    seedEntityIds: string[];
    jobId?: string;
    recordedAt: Date;
}
export interface RollbackResult {
    success: boolean;
    rolledBackEntities: number;
    rolledBackRelationships: number;
    errors: RollbackError[];
    partialSuccess: boolean;
}
export interface RollbackError {
    type: "entity" | "relationship";
    id: string;
    action: string;
    error: string;
    recoverable: boolean;
}
export declare class RollbackCapabilities {
    private kgService;
    private dbService;
    private rollbackPoints;
    private maxRollbackPoints;
    private sessionCheckpointLinks;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService);
    private ensureDatabaseReady;
    /**
     * Create a rollback point before making changes
     */
    createRollbackPoint(operationId: string, description: string): Promise<string>;
    registerCheckpointLink(sessionId: string, record: {
        checkpointId: string;
        reason: "daily" | "incident" | "manual";
        hopCount: number;
        attempts: number;
        seedEntityIds?: string[];
        jobId?: string;
        timestamp?: Date;
    }): void;
    getSessionCheckpointHistory(sessionId: string, options?: {
        limit?: number;
    }): SessionCheckpointRecord[];
    getLatestSessionCheckpoint(sessionId: string): SessionCheckpointRecord | undefined;
    /**
     * List all rollback points for a given entity
     */
    listRollbackPoints(entityId: string): Promise<RollbackPoint[]>;
    /**
     * Capture all current entities in the graph
     */
    private captureCurrentEntities;
    /**
     * Capture all current relationships in the graph
     */
    private captureCurrentRelationships;
    private collectAllEntities;
    private collectAllRelationships;
    /**
     * Record an entity change for potential rollback
     */
    recordEntityChange(rollbackId: string, entityId: string, action: "create" | "update" | "delete", previousState?: Entity, newState?: Entity): Promise<void>;
    /**
     * Record a relationship change for potential rollback
     */
    recordRelationshipChange(rollbackId: string, relationshipId: string, action: "create" | "update" | "delete", previousState?: GraphRelationship, newState?: GraphRelationship): void;
    /**
     * Perform a rollback to a specific point
     */
    rollbackToPoint(rollbackId: string): Promise<RollbackResult>;
    /**
     * Rollback a single entity change
     */
    private rollbackEntityChange;
    /**
     * Rollback a single relationship change
     */
    private rollbackRelationshipChange;
    /**
     * Rollback the last operation for a given operation ID
     */
    rollbackLastOperation(operationId: string): Promise<RollbackResult | null>;
    /**
     * Get rollback points for an operation
     */
    getRollbackPointsForOperation(operationId: string): RollbackPoint[];
    /**
     * Get all rollback points
     */
    getAllRollbackPoints(): RollbackPoint[];
    /**
     * Delete a rollback point
     */
    deleteRollbackPoint(rollbackId: string): boolean;
    /**
     * Get rollback point details
     */
    getRollbackPoint(rollbackId: string): RollbackPoint | null;
    /**
     * Clean up old rollback points to prevent memory issues
     */
    cleanupOldRollbackPoints(maxAgeMs?: number): number;
    /**
     * Validate a rollback point for consistency
     */
    validateRollbackPoint(rollbackId: string): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Create a backup snapshot for complex operations
     */
    createSnapshot(operationId: string, description: string): Promise<string>;
    /**
     * Restore from a snapshot
     */
    restoreFromSnapshot(snapshotId: string): Promise<RollbackResult>;
    /**
     * Get rollback statistics
     */
    getRollbackStatistics(): {
        totalRollbackPoints: number;
        oldestRollbackPoint: Date | null;
        newestRollbackPoint: Date | null;
        averageEntitiesPerPoint: number;
        averageRelationshipsPerPoint: number;
    };
}
//# sourceMappingURL=RollbackCapabilities.d.ts.map