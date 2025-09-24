/**
 * In-memory snapshot management for rollback capabilities
 */
import { Snapshot, SnapshotType, RollbackConfig } from './RollbackTypes.js';
/**
 * Manages in-memory snapshots for rollback operations
 */
export declare class SnapshotManager {
    private config;
    private snapshots;
    private snapshotsByRollbackPoint;
    private totalSize;
    constructor(config: RollbackConfig);
    /**
     * Create a new snapshot
     */
    createSnapshot(rollbackPointId: string, type: SnapshotType, data: any, metadata?: Record<string, any>): Promise<Snapshot>;
    /**
     * Get a snapshot by ID
     */
    getSnapshot(snapshotId: string): Snapshot | null;
    /**
     * Get all snapshots for a rollback point
     */
    getSnapshotsForRollbackPoint(rollbackPointId: string): Snapshot[];
    /**
     * Get snapshots by type
     */
    getSnapshotsByType(type: SnapshotType): Snapshot[];
    /**
     * Restore data from a snapshot
     */
    restoreFromSnapshot(snapshotId: string): Promise<any>;
    /**
     * Delete a snapshot
     */
    deleteSnapshot(snapshotId: string): boolean;
    /**
     * Delete all snapshots for a rollback point
     */
    deleteSnapshotsForRollbackPoint(rollbackPointId: string): number;
    /**
     * Get current memory usage statistics
     */
    getMemoryUsage(): {
        totalSnapshots: number;
        totalSize: number;
        averageSize: number;
        snapshotsByType: Record<string, number>;
    };
    /**
     * Clean up expired or oversized snapshots
     */
    cleanup(): Promise<number>;
    /**
     * Clear all snapshots
     */
    clear(): void;
    /**
     * Create a deep clone of data for snapshotting
     */
    private deepClone;
    /**
     * Serialize data for storage
     */
    private serializeData;
    /**
     * Deserialize data from storage
     */
    private deserializeData;
    /**
     * Calculate size of serialized data
     */
    private calculateSize;
    /**
     * Generate checksum for data integrity
     */
    private generateChecksum;
    /**
     * Verify data integrity using checksum
     */
    private verifyChecksum;
}
//# sourceMappingURL=Snapshot.d.ts.map