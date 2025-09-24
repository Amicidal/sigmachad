/**
 * In-memory storage with optional persistence for rollback data
 */
import { EventEmitter } from 'events';
import { RollbackPoint, RollbackOperation, RollbackStoreOptions, RollbackConfig, RollbackMetrics } from './RollbackTypes.js';
/**
 * In-memory storage for rollback data with optional persistence
 */
export declare class RollbackStore extends EventEmitter {
    private config;
    private options;
    private rollbackPoints;
    private operations;
    private expiryTimers;
    private cleanupTimer?;
    private metrics;
    constructor(config: RollbackConfig, options: RollbackStoreOptions);
    /**
     * Store a rollback point
     */
    storeRollbackPoint(rollbackPoint: RollbackPoint): Promise<void>;
    /**
     * Retrieve a rollback point by ID
     */
    getRollbackPoint(id: string): Promise<RollbackPoint | null>;
    /**
     * Get all rollback points
     */
    getAllRollbackPoints(): Promise<RollbackPoint[]>;
    /**
     * Get rollback points for a specific session
     */
    getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]>;
    /**
     * Remove a rollback point
     */
    removeRollbackPoint(id: string): Promise<boolean>;
    /**
     * Store a rollback operation
     */
    storeOperation(operation: RollbackOperation): Promise<void>;
    /**
     * Retrieve a rollback operation
     */
    getOperation(id: string): Promise<RollbackOperation | null>;
    /**
     * Update a rollback operation
     */
    updateOperation(operation: RollbackOperation): Promise<void>;
    /**
     * Remove a rollback operation
     */
    removeOperation(id: string): Promise<boolean>;
    /**
     * Get all operations
     */
    getAllOperations(): Promise<RollbackOperation[]>;
    /**
     * Get operations by status
     */
    getOperationsByStatus(status: string): Promise<RollbackOperation[]>;
    /**
     * Clean up expired rollback points and completed operations
     */
    cleanup(): Promise<{
        removedPoints: number;
        removedOperations: number;
    }>;
    /**
     * Get current metrics
     */
    getMetrics(): RollbackMetrics;
    /**
     * Clear all data
     */
    clear(): Promise<void>;
    /**
     * Shutdown the store
     */
    shutdown(): Promise<void>;
    /**
     * Expire a rollback point
     */
    private expireRollbackPoint;
    /**
     * Start the cleanup timer
     */
    private startCleanupTimer;
    /**
     * Update memory usage metrics
     */
    private updateMemoryUsage;
    /**
     * Update average rollback time
     */
    private updateAverageRollbackTime;
    /**
     * Persist rollback point to external storage (placeholder for future implementation)
     */
    private persistRollbackPoint;
    /**
     * Remove rollback point from external storage (placeholder for future implementation)
     */
    private unpersistRollbackPoint;
}
//# sourceMappingURL=RollbackStore.d.ts.map