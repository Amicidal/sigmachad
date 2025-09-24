/**
 * In-memory storage with optional persistence for rollback data
 */
import { EventEmitter } from 'events';
import { RollbackNotFoundError, RollbackExpiredError } from './RollbackTypes.js';
/**
 * LRU Cache implementation for rollback points
 */
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
    }
    set(key, value) {
        const now = Date.now();
        if (this.cache.has(key)) {
            // Update existing entry
            this.cache.set(key, { value, lastAccessed: now });
            this.updateAccessOrder(key);
        }
        else {
            // Add new entry
            if (this.cache.size >= this.maxSize) {
                this.evictLeastRecentlyUsed();
            }
            this.cache.set(key, { value, lastAccessed: now });
            this.accessOrder.push(key);
        }
    }
    get(key) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.lastAccessed = Date.now();
            this.updateAccessOrder(key);
            return entry.value;
        }
        return undefined;
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.accessOrder = this.accessOrder.filter(k => k !== key);
        }
        return deleted;
    }
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    size() {
        return this.cache.size;
    }
    keys() {
        return this.cache.keys();
    }
    values() {
        return Array.from(this.cache.values()).map(entry => entry.value);
    }
    updateAccessOrder(key) {
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        this.accessOrder.push(key);
    }
    evictLeastRecentlyUsed() {
        if (this.accessOrder.length > 0) {
            const lruKey = this.accessOrder.shift();
            this.cache.delete(lruKey);
        }
    }
}
/**
 * In-memory storage for rollback data with optional persistence
 */
export class RollbackStore extends EventEmitter {
    constructor(config, options) {
        super();
        this.config = config;
        this.options = options;
        this.operations = new Map();
        this.expiryTimers = new Map();
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
    async storeRollbackPoint(rollbackPoint) {
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
    async getRollbackPoint(id) {
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
    async getAllRollbackPoints() {
        const points = this.rollbackPoints.values();
        const validPoints = [];
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
    async getRollbackPointsForSession(sessionId) {
        const allPoints = await this.getAllRollbackPoints();
        return allPoints.filter(point => point.sessionId === sessionId);
    }
    /**
     * Remove a rollback point
     */
    async removeRollbackPoint(id) {
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
    async storeOperation(operation) {
        this.operations.set(operation.id, operation);
        this.emit('operation-stored', { operation });
    }
    /**
     * Retrieve a rollback operation
     */
    async getOperation(id) {
        return this.operations.get(id) || null;
    }
    /**
     * Update a rollback operation
     */
    async updateOperation(operation) {
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
        }
        else if (operation.status === 'failed') {
            this.metrics.failedRollbacks++;
        }
    }
    /**
     * Remove a rollback operation
     */
    async removeOperation(id) {
        const removed = this.operations.delete(id);
        if (removed) {
            this.emit('operation-removed', { operationId: id });
        }
        return removed;
    }
    /**
     * Get all operations
     */
    async getAllOperations() {
        return Array.from(this.operations.values());
    }
    /**
     * Get operations by status
     */
    async getOperationsByStatus(status) {
        return Array.from(this.operations.values()).filter(op => op.status === status);
    }
    /**
     * Clean up expired rollback points and completed operations
     */
    async cleanup() {
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
            if ((operation.status === 'completed' || operation.status === 'failed') &&
                operation.completedAt &&
                operation.completedAt < cutoffTime) {
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
    getMetrics() {
        this.updateMemoryUsage();
        return { ...this.metrics };
    }
    /**
     * Clear all data
     */
    async clear() {
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
    async shutdown() {
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
    async expireRollbackPoint(id) {
        await this.removeRollbackPoint(id);
        this.emit('rollback-point-expired', { rollbackPointId: id });
    }
    /**
     * Start the cleanup timer
     */
    startCleanupTimer() {
        const interval = this.config.cleanupInterval || 5 * 60 * 1000; // 5 minutes default
        this.cleanupTimer = setInterval(async () => {
            try {
                await this.cleanup();
            }
            catch (error) {
                this.emit('cleanup-error', { error });
            }
        }, interval);
    }
    /**
     * Update memory usage metrics
     */
    updateMemoryUsage() {
        // Rough estimation of memory usage
        const pointsSize = this.rollbackPoints.size() * 1024; // Estimate 1KB per point
        const operationsSize = this.operations.size * 512; // Estimate 512B per operation
        this.metrics.memoryUsage = pointsSize + operationsSize;
    }
    /**
     * Update average rollback time
     */
    updateAverageRollbackTime(newTime) {
        const currentAvg = this.metrics.averageRollbackTime;
        const count = this.metrics.successfulRollbacks;
        this.metrics.averageRollbackTime = ((currentAvg * (count - 1)) + newTime) / count;
    }
    /**
     * Persist rollback point to external storage (placeholder for future implementation)
     */
    async persistRollbackPoint(rollbackPoint) {
        // TODO: Implement persistence to PostgreSQL/Redis when needed
        // For now, this is a no-op since we're focusing on in-memory storage
    }
    /**
     * Remove rollback point from external storage (placeholder for future implementation)
     */
    async unpersistRollbackPoint(id) {
        // TODO: Implement persistence removal when needed
        // For now, this is a no-op since we're focusing on in-memory storage
    }
}
//# sourceMappingURL=RollbackStore.js.map