/**
 * Unit tests for RollbackStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RollbackStore } from '../../src/rollback/RollbackStore.js';
import {
  createDefaultRollbackConfig,
  createDefaultStoreOptions,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy
} from '../../src/rollback/index.js';

describe('RollbackStore', () => {
  let store: RollbackStore;

  beforeEach(() => {
    const config = createDefaultRollbackConfig();
    const options = createDefaultStoreOptions();
    store = new RollbackStore(config, options);
  });

  afterEach(async () => {
    await store.shutdown();
  });

  describe('rollback point operations', () => {
    it('should store and retrieve rollback points', async () => {
      const rollbackPoint = {
        id: 'point-1',
        name: 'Test Point',
        description: 'Test description',
        timestamp: new Date(),
        metadata: { tag: 'test' },
        sessionId: 'session-123'
      };

      await store.storeRollbackPoint(rollbackPoint);
      const retrieved = await store.getRollbackPoint('point-1');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('point-1');
      expect(retrieved!.name).toBe('Test Point');
      expect(retrieved!.description).toBe('Test description');
      expect(retrieved!.metadata.tag).toBe('test');
      expect(retrieved!.sessionId).toBe('session-123');
    });

    it('should return null for non-existent rollback point', async () => {
      const result = await store.getRollbackPoint('non-existent');
      expect(result).toBeNull();
    });

    it('should handle rollback point expiry', async () => {
      const rollbackPoint = {
        id: 'point-1',
        name: 'Expiring Point',
        timestamp: new Date(),
        metadata: {},
        expiresAt: new Date(Date.now() + 100) // Expires in 100ms
      };

      await store.storeRollbackPoint(rollbackPoint);

      // Should be available immediately
      let retrieved = await store.getRollbackPoint('point-1');
      expect(retrieved).toBeDefined();

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired and throw error
      await expect(
        store.getRollbackPoint('point-1')
      ).rejects.toThrow('Rollback point has expired');
    });

    it('should emit events when storing rollback points', async () => {
      const eventSpy = vi.fn();
      store.on('rollback-point-stored', eventSpy);

      const rollbackPoint = {
        id: 'point-1',
        name: 'Test Point',
        timestamp: new Date(),
        metadata: {}
      };

      await store.storeRollbackPoint(rollbackPoint);

      expect(eventSpy).toHaveBeenCalledWith({
        rollbackPoint: expect.objectContaining({ id: 'point-1' })
      });
    });

    it('should remove rollback points', async () => {
      const rollbackPoint = {
        id: 'point-1',
        name: 'Test Point',
        timestamp: new Date(),
        metadata: {}
      };

      await store.storeRollbackPoint(rollbackPoint);
      expect(await store.getRollbackPoint('point-1')).toBeDefined();

      const removed = await store.removeRollbackPoint('point-1');
      expect(removed).toBe(true);
      expect(await store.getRollbackPoint('point-1')).toBeNull();
    });

    it('should return false when removing non-existent rollback point', async () => {
      const removed = await store.removeRollbackPoint('non-existent');
      expect(removed).toBe(false);
    });

    it('should get all rollback points sorted by timestamp', async () => {
      const point1 = {
        id: 'point-1',
        name: 'First Point',
        timestamp: new Date('2023-01-01'),
        metadata: {}
      };

      const point2 = {
        id: 'point-2',
        name: 'Second Point',
        timestamp: new Date('2023-01-02'),
        metadata: {}
      };

      await store.storeRollbackPoint(point1);
      await store.storeRollbackPoint(point2);

      const allPoints = await store.getAllRollbackPoints();

      expect(allPoints).toHaveLength(2);
      expect(allPoints[0].id).toBe('point-2'); // Newer first
      expect(allPoints[1].id).toBe('point-1');
    });

    it('should filter rollback points by session', async () => {
      const point1 = {
        id: 'point-1',
        name: 'Session 1 Point',
        timestamp: new Date(),
        metadata: {},
        sessionId: 'session-1'
      };

      const point2 = {
        id: 'point-2',
        name: 'Session 2 Point',
        timestamp: new Date(),
        metadata: {},
        sessionId: 'session-2'
      };

      await store.storeRollbackPoint(point1);
      await store.storeRollbackPoint(point2);

      const session1Points = await store.getRollbackPointsForSession('session-1');
      const session2Points = await store.getRollbackPointsForSession('session-2');

      expect(session1Points).toHaveLength(1);
      expect(session1Points[0].id).toBe('point-1');

      expect(session2Points).toHaveLength(1);
      expect(session2Points[0].id).toBe('point-2');
    });
  });

  describe('operation management', () => {
    it('should store and retrieve operations', async () => {
      const operation = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.PENDING,
        progress: 0,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(operation);
      const retrieved = await store.getOperation('op-1');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('op-1');
      expect(retrieved!.type).toBe(RollbackOperationType.FULL);
      expect(retrieved!.status).toBe(RollbackStatus.PENDING);
    });

    it('should update existing operations', async () => {
      const operation = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.PENDING,
        progress: 0,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(operation);

      operation.status = RollbackStatus.IN_PROGRESS;
      operation.progress = 50;
      operation.completedAt = new Date();

      await store.updateOperation(operation);

      const retrieved = await store.getOperation('op-1');
      expect(retrieved!.status).toBe(RollbackStatus.IN_PROGRESS);
      expect(retrieved!.progress).toBe(50);
      expect(retrieved!.completedAt).toBeDefined();
    });

    it('should throw error when updating non-existent operation', async () => {
      const operation = {
        id: 'non-existent',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.PENDING,
        progress: 0,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await expect(
        store.updateOperation(operation)
      ).rejects.toThrow('Rollback point not found');
    });

    it('should remove operations', async () => {
      const operation = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.PENDING,
        progress: 0,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(operation);
      expect(await store.getOperation('op-1')).toBeDefined();

      const removed = await store.removeOperation('op-1');
      expect(removed).toBe(true);
      expect(await store.getOperation('op-1')).toBeNull();
    });

    it('should get all operations', async () => {
      const operation1 = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      const operation2 = {
        id: 'op-2',
        type: RollbackOperationType.PARTIAL,
        targetRollbackPointId: 'point-2',
        status: RollbackStatus.FAILED,
        progress: 25,
        startedAt: new Date(),
        strategy: RollbackStrategy.SAFE,
        log: []
      };

      await store.storeOperation(operation1);
      await store.storeOperation(operation2);

      const allOperations = await store.getAllOperations();
      expect(allOperations).toHaveLength(2);
    });

    it('should filter operations by status', async () => {
      const operation1 = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      const operation2 = {
        id: 'op-2',
        type: RollbackOperationType.PARTIAL,
        targetRollbackPointId: 'point-2',
        status: RollbackStatus.FAILED,
        progress: 25,
        startedAt: new Date(),
        strategy: RollbackStrategy.SAFE,
        log: []
      };

      await store.storeOperation(operation1);
      await store.storeOperation(operation2);

      const completedOps = await store.getOperationsByStatus('completed');
      const failedOps = await store.getOperationsByStatus('failed');

      expect(completedOps).toHaveLength(1);
      expect(completedOps[0].id).toBe('op-1');

      expect(failedOps).toHaveLength(1);
      expect(failedOps[0].id).toBe('op-2');
    });
  });

  describe('LRU cache behavior', () => {
    it('should evict least recently used items when at capacity', async () => {
      // Create store with small capacity
      const config = createDefaultRollbackConfig();
      const options = { ...createDefaultStoreOptions(), maxItems: 2 };
      const smallStore = new RollbackStore(config, options);

      try {
        // Add items up to capacity
        await smallStore.storeRollbackPoint({
          id: 'point-1',
          name: 'Point 1',
          timestamp: new Date(),
          metadata: {}
        });

        await smallStore.storeRollbackPoint({
          id: 'point-2',
          name: 'Point 2',
          timestamp: new Date(),
          metadata: {}
        });

        // Access point-1 to make it recently used
        await smallStore.getRollbackPoint('point-1');

        // Add third item, should evict point-2 (least recently used)
        await smallStore.storeRollbackPoint({
          id: 'point-3',
          name: 'Point 3',
          timestamp: new Date(),
          metadata: {}
        });

        expect(await smallStore.getRollbackPoint('point-1')).toBeDefined();
        expect(await smallStore.getRollbackPoint('point-2')).toBeNull();
        expect(await smallStore.getRollbackPoint('point-3')).toBeDefined();
      } finally {
        await smallStore.shutdown();
      }
    });
  });

  describe('cleanup operations', () => {
    it('should clean up expired rollback points', async () => {
      // Create points with different expiry times
      const expiredPoint = {
        id: 'expired-point',
        name: 'Expired Point',
        timestamp: new Date(),
        metadata: {},
        expiresAt: new Date(Date.now() - 1000) // Already expired
      };

      const validPoint = {
        id: 'valid-point',
        name: 'Valid Point',
        timestamp: new Date(),
        metadata: {},
        expiresAt: new Date(Date.now() + 10000) // Expires in future
      };

      await store.storeRollbackPoint(expiredPoint);
      await store.storeRollbackPoint(validPoint);

      const cleanup = await store.cleanup();

      expect(cleanup.removedPoints).toBe(1);
      expect(await store.getRollbackPoint('expired-point')).toBeNull();
      expect(await store.getRollbackPoint('valid-point')).toBeDefined();
    });

    it('should clean up old completed operations', async () => {
      const oldOperation = {
        id: 'old-op',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      const recentOperation = {
        id: 'recent-op',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-2',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(),
        completedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(oldOperation);
      await store.storeOperation(recentOperation);

      const cleanup = await store.cleanup();

      expect(cleanup.removedOperations).toBe(1);
      expect(await store.getOperation('old-op')).toBeNull();
      expect(await store.getOperation('recent-op')).toBeDefined();
    });
  });

  describe('metrics', () => {
    it('should track and return metrics', async () => {
      // Add some data
      await store.storeRollbackPoint({
        id: 'point-1',
        name: 'Point 1',
        timestamp: new Date(),
        metadata: {}
      });

      const operation = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(Date.now() - 1000),
        completedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(operation);
      await store.updateOperation(operation); // This should update metrics

      const metrics = store.getMetrics();

      expect(metrics.totalRollbackPoints).toBe(1);
      expect(metrics.successfulRollbacks).toBe(1);
      expect(metrics.failedRollbacks).toBe(0);
      expect(metrics.averageRollbackTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });

    it('should update average rollback time correctly', async () => {
      const operation1 = {
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(Date.now() - 1000),
        completedAt: new Date(Date.now() - 500),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      const operation2 = {
        id: 'op-2',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-2',
        status: RollbackStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(Date.now() - 1500),
        completedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      };

      await store.storeOperation(operation1);
      await store.updateOperation(operation1);

      const metrics1 = store.getMetrics();
      expect(metrics1.averageRollbackTime).toBe(500);

      await store.storeOperation(operation2);
      await store.updateOperation(operation2);

      const metrics2 = store.getMetrics();
      expect(metrics2.averageRollbackTime).toBe(1000); // Average of 500 and 1500
    });
  });

  describe('event emission', () => {
    it('should emit appropriate events', async () => {
      const storedSpy = vi.fn();
      const removedSpy = vi.fn();
      const clearedSpy = vi.fn();

      store.on('rollback-point-stored', storedSpy);
      store.on('rollback-point-removed', removedSpy);
      store.on('store-cleared', clearedSpy);

      const rollbackPoint = {
        id: 'point-1',
        name: 'Test Point',
        timestamp: new Date(),
        metadata: {}
      };

      await store.storeRollbackPoint(rollbackPoint);
      expect(storedSpy).toHaveBeenCalled();

      await store.removeRollbackPoint('point-1');
      expect(removedSpy).toHaveBeenCalledWith({ rollbackPointId: 'point-1' });

      await store.clear();
      expect(clearedSpy).toHaveBeenCalled();
    });
  });

  describe('clear and shutdown', () => {
    it('should clear all data', async () => {
      await store.storeRollbackPoint({
        id: 'point-1',
        name: 'Test Point',
        timestamp: new Date(),
        metadata: {}
      });

      await store.storeOperation({
        id: 'op-1',
        type: RollbackOperationType.FULL,
        targetRollbackPointId: 'point-1',
        status: RollbackStatus.PENDING,
        progress: 0,
        startedAt: new Date(),
        strategy: RollbackStrategy.IMMEDIATE,
        log: []
      });

      await store.clear();

      expect(await store.getRollbackPoint('point-1')).toBeNull();
      expect(await store.getOperation('op-1')).toBeNull();

      const metrics = store.getMetrics();
      expect(metrics.totalRollbackPoints).toBe(0);
    });

    it('should emit shutdown event', async () => {
      const shutdownSpy = vi.fn();
      store.on('store-shutdown', shutdownSpy);

      await store.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });
});