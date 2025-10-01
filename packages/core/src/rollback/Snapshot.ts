// TODO(2025-09-30.35): Tighten snapshot property access and validation.
/**
 * In-memory snapshot management for rollback capabilities
 */

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import {
  Snapshot,
  SnapshotType,
  RollbackError,
  RollbackConfig
} from './RollbackTypes.js';

/**
 * Manages in-memory snapshots for rollback operations
 */
export class SnapshotManager {
  private snapshots = new Map<string, Snapshot>();
  private snapshotsByRollbackPoint = new Map<string, Set<string>>();
  private totalSize = 0;

  constructor(private config: RollbackConfig) {}

  /**
   * Create a new snapshot
   */
  async createSnapshot(
    rollbackPointId: string,
    type: SnapshotType,
    data: any,
    metadata?: Record<string, any>
  ): Promise<Snapshot> {
    const serializedData = this.serializeData(data);
    const size = this.calculateSize(serializedData);

    // Check size limits
    if (size > this.config.maxSnapshotSize) {
      throw new RollbackError(
        `Snapshot size ${size} exceeds maximum allowed size ${this.config.maxSnapshotSize}`,
        'SNAPSHOT_TOO_LARGE',
        { size, maxSize: this.config.maxSnapshotSize, type }
      );
    }

    const snapshot: Snapshot = {
      id: uuidv4(),
      rollbackPointId,
      type,
      data: serializedData,
      size,
      createdAt: new Date(),
      checksum: this.generateChecksum(serializedData)
    };

    // Store snapshot
    this.snapshots.set(snapshot.id, snapshot);
    this.totalSize += size;

    // Track by rollback point
    if (!this.snapshotsByRollbackPoint.has(rollbackPointId)) {
      this.snapshotsByRollbackPoint.set(rollbackPointId, new Set());
    }
    this.snapshotsByRollbackPoint.get(rollbackPointId)!.add(snapshot.id);

    return snapshot;
  }

  /**
   * Get a snapshot by ID
   */
  getSnapshot(snapshotId: string): Snapshot | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }

    // Verify data integrity
    if (snapshot.checksum && !this.verifyChecksum(snapshot.data, snapshot.checksum)) {
      throw new RollbackError(
        `Snapshot data corruption detected for snapshot ${snapshotId}`,
        'SNAPSHOT_CORRUPTED',
        { snapshotId }
      );
    }

    return snapshot;
  }

  /**
   * Get all snapshots for a rollback point
   */
  getSnapshotsForRollbackPoint(rollbackPointId: string): Snapshot[] {
    const snapshotIds = this.snapshotsByRollbackPoint.get(rollbackPointId);
    if (!snapshotIds) {
      return [];
    }

    const snapshots: Snapshot[] = [];
    for (const snapshotId of Array.from(snapshotIds)) {
      const snapshot = this.getSnapshot(snapshotId);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get snapshots by type
   */
  getSnapshotsByType(type: SnapshotType): Snapshot[] {
    const snapshots: Snapshot[] = [];
    for (const snapshot of Array.from(this.snapshots.values())) {
      if (snapshot.type === type) {
        snapshots.push(snapshot);
      }
    }
    return snapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Restore data from a snapshot
   */
  async restoreFromSnapshot(snapshotId: string): Promise<any> {
    const snapshot = this.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new RollbackError(
        `Snapshot not found: ${snapshotId}`,
        'SNAPSHOT_NOT_FOUND',
        { snapshotId }
      );
    }

    return this.deserializeData(snapshot.data, snapshot.type);
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return false;
    }

    // Remove from main storage
    this.snapshots.delete(snapshotId);
    this.totalSize -= snapshot.size;

    // Remove from rollback point tracking
    const rollbackPointSnapshots = this.snapshotsByRollbackPoint.get(snapshot.rollbackPointId);
    if (rollbackPointSnapshots) {
      rollbackPointSnapshots.delete(snapshotId);
      if (rollbackPointSnapshots.size === 0) {
        this.snapshotsByRollbackPoint.delete(snapshot.rollbackPointId);
      }
    }

    return true;
  }

  /**
   * Delete all snapshots for a rollback point
   */
  deleteSnapshotsForRollbackPoint(rollbackPointId: string): number {
    const snapshotIds = this.snapshotsByRollbackPoint.get(rollbackPointId);
    if (!snapshotIds) {
      return 0;
    }

    let deletedCount = 0;
    for (const snapshotId of Array.from(snapshotIds)) {
      if (this.deleteSnapshot(snapshotId)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage(): {
    totalSnapshots: number;
    totalSize: number;
    averageSize: number;
    snapshotsByType: Record<string, number>;
  } {
    const snapshotsByType: Record<string, number> = {};

    for (const snapshot of Array.from(this.snapshots.values())) {
      snapshotsByType[snapshot.type] = (snapshotsByType[snapshot.type] || 0) + 1;
    }

    return {
      totalSnapshots: this.snapshots.size,
      totalSize: this.totalSize,
      averageSize: this.snapshots.size > 0 ? this.totalSize / this.snapshots.size : 0,
      snapshotsByType
    };
  }

  /**
   * Clean up expired or oversized snapshots
   */
  async cleanup(): Promise<number> {
    let cleanedCount = 0;

    // Clean up snapshots that are no longer referenced by any rollback point
    const referencedSnapshots = new Set<string>();
    for (const snapshotIds of Array.from(this.snapshotsByRollbackPoint.values())) {
      for (const snapshotId of Array.from(snapshotIds)) {
        referencedSnapshots.add(snapshotId);
      }
    }

    for (const snapshotId of Array.from(this.snapshots.keys())) {
      if (!referencedSnapshots.has(snapshotId)) {
        if (this.deleteSnapshot(snapshotId)) {
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
    this.snapshotsByRollbackPoint.clear();
    this.totalSize = 0;
  }

  /**
   * Create a deep clone of data for snapshotting
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj);
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of Array.from(obj.entries())) {
        cloned.set(key, this.deepClone(value));
      }
      return cloned;
    }

    if (obj instanceof Set) {
      const cloned = new Set();
      for (const value of Array.from(obj.values())) {
        cloned.add(this.deepClone(value));
      }
      return cloned;
    }

    const entries = Object.entries(obj).map(([k, v]) => [k, this.deepClone(v)]);
    return Object.fromEntries(entries);
  }

  /**
   * Serialize data for storage
   */
  private serializeData(data: any): any {
    // Create a deep clone to prevent mutations
    const cloned = this.deepClone(data);

    // Convert special types to serializable format
    return JSON.parse(JSON.stringify(cloned, (key, value) => {
      if (value instanceof Map) {
        return { __type: 'Map', data: Array.from(value.entries()) };
      }
      if (value instanceof Set) {
        return { __type: 'Set', data: Array.from(value.values()) };
      }
      if (value instanceof Date) {
        return { __type: 'Date', data: value.toISOString() };
      }
      return value;
    }));
  }

  /**
   * Deserialize data from storage
   */
  private deserializeData(data: any, type: SnapshotType): any {
    return JSON.parse(JSON.stringify(data), (key, value) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Map':
            return new Map(value.data);
          case 'Set':
            return new Set(value.data);
          case 'Date':
            return new Date(value.data);
        }
      }
      return value;
    });
  }

  /**
   * Calculate size of serialized data
   */
  private calculateSize(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const serialized = JSON.stringify(data);
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Verify data integrity using checksum
   */
  private verifyChecksum(data: any, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}
 
// TODO(2025-09-30.35): Tighten snapshot property access and validation.
