/**
 * In-memory storage with optional persistence for rollback data
 */

import { EventEmitter } from 'events';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackStoreOptions,
  RollbackConfig,
  RollbackError,
  RollbackNotFoundError,
  RollbackExpiredError,
  RollbackMetrics
} from './RollbackTypes.js';

/**
 * LRU Cache implementation for rollback points
 */
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; lastAccessed: number }>();
  private accessOrder: K[] = [];

  constructor(private maxSize: number) {}

  set(key: K, value: V): void {
    const now = Date.now();

    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.set(key, { value, lastAccessed: now });
      this.updateAccessOrder(key);
    } else {
      // Add new entry
      if (this.cache.size >= this.maxSize) {
        this.evictLeastRecentlyUsed();
      }
      this.cache.set(key, { value, lastAccessed: now });
      this.accessOrder.push(key);
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      this.updateAccessOrder(key);
      return entry.value;
    }
    return undefined;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  private updateAccessOrder(key: K): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }
}

/**
 * In-memory storage for rollback data with optional persistence
 */
export class RollbackStore extends EventEmitter {
  private rollbackPoints: LRUCache<string, RollbackPoint>;
  private operations = new Map<string, RollbackOperation>();
  private expiryTimers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: RollbackMetrics;

  constructor(
    private config: RollbackConfig,
    private options: RollbackStoreOptions
  ) {
    super();

    this.rollbackPoints = new LRUCache(options.maxItems);
    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    if (config.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Store a rollback point
   */
  async storeRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {
    // Check if we're at capacity and need to evict
    if (this.rollbackPoints.size() >= this.options.maxItems) {
      this.emit('capacity-reached', { currentSize: this.rollbackPoints.size(), maxSize: this.options.maxItems });
    }

    // Store the rollback point
    this.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
    this.metrics.totalRollbackPoints++;

    // Set up expiry timer if specified
    if (rollbackPoint.expiresAt) {
      const now = Date.now();
      const expiryTime = rollbackPoint.expiresAt.getTime();
      if (expiryTime > now) {
        const timeout = setTimeout(() => {
          this.expireRollbackPoint(rollbackPoint.id);
        }, expiryTime - now);
        this.expiryTimers.set(rollbackPoint.id, timeout);
      }
    }

    // Persist if enabled
    if (this.options.enablePersistence) {
      await this.persistRollbackPoint(rollbackPoint);
    }

    this.updateMemoryUsage();
    this.emit('rollback-point-stored', { rollbackPoint });
  }

  /**
   * Retrieve a rollback point by ID
   */
  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {
    const rollbackPoint = this.rollbackPoints.get(id);
    if (!rollbackPoint) {
      return null;
    }

    // Check if expired
    if (rollbackPoint.expiresAt && rollbackPoint.expiresAt < new Date()) {
      await this.removeRollbackPoint(id);
      throw new RollbackExpiredError(id);
    }

    return rollbackPoint;
  }

  /**
   * Get all rollback points
   */
  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    const points = this.rollbackPoints.values();
    const validPoints: RollbackPoint[] = [];

    for (const point of points) {
      if (!point.expiresAt || point.expiresAt >= new Date()) {
        validPoints.push(point);
      }
    }

    return validPoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get rollback points for a specific session
   */
  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    const allPoints = await this.getAllRollbackPoints();
    return allPoints.filter(point => point.sessionId === sessionId);
  }

  /**
   * Remove a rollback point
   */
  async removeRollbackPoint(id: string): Promise<boolean> {
    const rollbackPoint = this.rollbackPoints.get(id);
    if (!rollbackPoint) {
      return false;
    }

    // Remove from cache
    this.rollbackPoints.delete(id);

    // Clear expiry timer
    const timer = this.expiryTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(id);
    }

    // Remove from persistence if enabled
    if (this.options.enablePersistence) {
      await this.unpersistRollbackPoint(id);
    }

    this.updateMemoryUsage();
    this.emit('rollback-point-removed', { rollbackPointId: id });

    return true;
  }

  /**
   * Store a rollback operation
   */
  async storeOperation(operation: RollbackOperation): Promise<void> {
    this.operations.set(operation.id, operation);
    this.emit('operation-stored', { operation });
  }

  /**
   * Retrieve a rollback operation
   */
  async getOperation(id: string): Promise<RollbackOperation | null> {
    return this.operations.get(id) || null;
  }

  /**
   * Update a rollback operation
   */
  async updateOperation(operation: RollbackOperation): Promise<void> {
    if (!this.operations.has(operation.id)) {
      throw new RollbackNotFoundError(operation.id);
    }

    this.operations.set(operation.id, operation);
    this.emit('operation-updated', { operation });

    // Update metrics based on operation status
    if (operation.status === 'completed') {
      this.metrics.successfulRollbacks++;
      if (operation.startedAt && operation.completedAt) {
        const duration = operation.completedAt.getTime() - operation.startedAt.getTime();
        this.updateAverageRollbackTime(duration);
      }
    } else if (operation.status === 'failed') {
      this.metrics.failedRollbacks++;
    }
  }

  /**
   * Remove a rollback operation
   */
  async removeOperation(id: string): Promise<boolean> {
    const removed = this.operations.delete(id);
    if (removed) {
      this.emit('operation-removed', { operationId: id });
    }
    return removed;
  }

  /**
   * Get all operations
   */
  async getAllOperations(): Promise<RollbackOperation[]> {
    return Array.from(this.operations.values());
  }

  /**
   * Get operations by status
   */
  async getOperationsByStatus(status: string): Promise<RollbackOperation[]> {
    return Array.from(this.operations.values()).filter(op => op.status === status);
  }

  /**
   * Clean up expired rollback points and completed operations
   */
  async cleanup(): Promise<{ removedPoints: number; removedOperations: number }> {
    const now = new Date();
    let removedPoints = 0;
    let removedOperations = 0;

    // Clean up expired rollback points
    const allPoints = this.rollbackPoints.values();
    for (const point of allPoints) {
      if (point.expiresAt && point.expiresAt < now) {
        await this.removeRollbackPoint(point.id);
        removedPoints++;
      }
    }

    // Clean up old completed operations (keep only recent ones)
    const cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    for (const [id, operation] of Array.from(this.operations.entries())) {
      if (
        (operation.status === 'completed' || operation.status === 'failed') &&
        operation.completedAt &&
        operation.completedAt < cutoffTime
      ) {
        await this.removeOperation(id);
        removedOperations++;
      }
    }

    this.metrics.lastCleanup = new Date();
    this.updateMemoryUsage();

    this.emit('cleanup-completed', { removedPoints, removedOperations });

    return { removedPoints, removedOperations };
  }

  /**
   * Get current metrics
   */
  getMetrics(): RollbackMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    // Clear expiry timers
    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();

    // Clear data
    this.rollbackPoints.clear();
    this.operations.clear();

    // Reset metrics
    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    this.emit('store-cleared');
  }

  /**
   * Shutdown the store
   */
  async shutdown(): Promise<void> {
    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear all expiry timers
    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();

    this.emit('store-shutdown');
  }

  /**
   * Expire a rollback point
   */
  private async expireRollbackPoint(id: string): Promise<void> {
    await this.removeRollbackPoint(id);
    this.emit('rollback-point-expired', { rollbackPointId: id });
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    const interval = this.config.cleanupInterval || 5 * 60 * 1000; // 5 minutes default
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('cleanup-error', { error });
      }
    }, interval);
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    const pointsSize = this.rollbackPoints.size() * 1024; // Estimate 1KB per point
    const operationsSize = this.operations.size * 512; // Estimate 512B per operation
    this.metrics.memoryUsage = pointsSize + operationsSize;
  }

  /**
   * Update average rollback time
   */
  private updateAverageRollbackTime(newTime: number): void {
    const currentAvg = this.metrics.averageRollbackTime;
    const count = this.metrics.successfulRollbacks;
    this.metrics.averageRollbackTime = ((currentAvg * (count - 1)) + newTime) / count;
  }

  /**
   * Persist rollback point to external storage (placeholder for future implementation)
   */
  private async persistRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {
    // TODO: Implement persistence to PostgreSQL/Redis when needed
    // For now, this is a no-op since we're focusing on in-memory storage
  }

  /**
   * Remove rollback point from external storage (placeholder for future implementation)
   */
  private async unpersistRollbackPoint(id: string): Promise<void> {
    // TODO: Implement persistence removal when needed
    // For now, this is a no-op since we're focusing on in-memory storage
  }
}