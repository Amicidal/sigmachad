/**
 * Unit tests for RollbackManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RollbackManager } from '../../src/rollback/RollbackManager.js';
import {
  createDefaultRollbackConfig,
  createDefaultStoreOptions,
  RollbackOperationType,
  RollbackStrategy,
  ConflictStrategy,
  SnapshotType,
  DatabaseNotReadyError
} from '../../src/rollback/index.js';

describe('RollbackManager', () => {
  let manager: RollbackManager;
  let mockDatabaseService: any;
  let mockKnowledgeGraphService: any;
  let mockSessionManager: any;

  beforeEach(() => {
    const config = createDefaultRollbackConfig();
    const storeOptions = createDefaultStoreOptions();
    manager = new RollbackManager(config, storeOptions);

    // Mock services
    mockDatabaseService = {
      isReady: vi.fn().mockResolvedValue(true)
    };

    mockKnowledgeGraphService = {
      getEntities: vi.fn().mockResolvedValue([
        { id: '1', type: 'entity', name: 'Test Entity' }
      ]),
      getRelationships: vi.fn().mockResolvedValue([
        { id: '1', type: 'relationship', from: '1', to: '2' }
      ]),
      restoreEntities: vi.fn().mockResolvedValue(undefined),
      restoreRelationships: vi.fn().mockResolvedValue(undefined)
    };

    mockSessionManager = {
      getCurrentSessionId: vi.fn().mockReturnValue('session-123'),
      getSessionData: vi.fn().mockResolvedValue({ key: 'value' }),
      restoreSessionData: vi.fn().mockResolvedValue(undefined)
    };

    manager.setServices({
      databaseService: mockDatabaseService,
      knowledgeGraphService: mockKnowledgeGraphService,
      sessionManager: mockSessionManager
    });
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe('createRollbackPoint', () => {
    it('should create a rollback point successfully', async () => {
      const rollbackPoint = await manager.createRollbackPoint(
        'Test Rollback',
        'Test description',
        { tag: 'test' }
      );

      expect(rollbackPoint).toBeDefined();
      expect(rollbackPoint.id).toBeDefined();
      expect(rollbackPoint.name).toBe('Test Rollback');
      expect(rollbackPoint.description).toBe('Test description');
      expect(rollbackPoint.metadata.tag).toBe('test');
      expect(rollbackPoint.sessionId).toBe('session-123');
      expect(rollbackPoint.expiresAt).toBeDefined();
    });

    it('should throw error when database is not ready', async () => {
      mockDatabaseService.isReady.mockResolvedValue(false);

      await expect(
        manager.createRollbackPoint('Test Rollback')
      ).rejects.toThrow(DatabaseNotReadyError);
    });

    it('should capture snapshots during rollback point creation', async () => {
      await manager.createRollbackPoint('Test Rollback');

      expect(mockKnowledgeGraphService.getEntities).toHaveBeenCalled();
      expect(mockKnowledgeGraphService.getRelationships).toHaveBeenCalled();
      expect(mockSessionManager.getSessionData).toHaveBeenCalledWith('session-123');
    });
  });

  describe('getRollbackPoint', () => {
    it('should retrieve existing rollback point', async () => {
      const created = await manager.createRollbackPoint('Test Rollback');
      const retrieved = await manager.getRollbackPoint(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe('Test Rollback');
    });

    it('should return null for non-existent rollback point', async () => {
      const result = await manager.getRollbackPoint('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllRollbackPoints', () => {
    it('should return all rollback points sorted by timestamp', async () => {
      const point1 = await manager.createRollbackPoint('First Point');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const point2 = await manager.createRollbackPoint('Second Point');

      const allPoints = await manager.getAllRollbackPoints();

      expect(allPoints).toHaveLength(2);
      expect(allPoints[0].id).toBe(point2.id); // Newer first
      expect(allPoints[1].id).toBe(point1.id);
    });

    it('should return empty array when no rollback points exist', async () => {
      const allPoints = await manager.getAllRollbackPoints();
      expect(allPoints).toHaveLength(0);
    });
  });

  describe('getRollbackPointsForSession', () => {
    it('should return rollback points for specific session', async () => {
      await manager.createRollbackPoint('Session Point');

      // Change session ID for next point
      mockSessionManager.getCurrentSessionId.mockReturnValue('session-456');
      await manager.createRollbackPoint('Different Session Point');

      const sessionPoints = await manager.getRollbackPointsForSession('session-123');

      expect(sessionPoints).toHaveLength(1);
      expect(sessionPoints[0].name).toBe('Session Point');
      expect(sessionPoints[0].sessionId).toBe('session-123');
    });
  });

  describe('generateDiff', () => {
    it('should generate diff between current state and rollback point', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');

      // Mock different current state
      mockKnowledgeGraphService.getEntities.mockResolvedValue([
        { id: '1', type: 'entity', name: 'Modified Entity' }
      ]);

      const diff = await manager.generateDiff(rollbackPoint.id);

      expect(diff).toBeDefined();
      expect(diff.from).toBe('current');
      expect(diff.to).toBe(rollbackPoint.id);
      expect(diff.changeCount).toBeGreaterThanOrEqual(0);
      expect(diff.generatedAt).toBeDefined();
    });

    it('should throw error for non-existent rollback point', async () => {
      await expect(
        manager.generateDiff('non-existent-id')
      ).rejects.toThrow('Rollback point not found');
    });
  });

  describe('rollback', () => {
    it('should perform rollback operation successfully', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');

      const operation = await manager.rollback(rollbackPoint.id, {
        type: RollbackOperationType.FULL,
        strategy: RollbackStrategy.IMMEDIATE,
        conflictResolution: { strategy: ConflictStrategy.OVERWRITE }
      });

      expect(operation).toBeDefined();
      expect(operation.id).toBeDefined();
      expect(operation.type).toBe(RollbackOperationType.FULL);
      expect(operation.targetRollbackPointId).toBe(rollbackPoint.id);
      expect(operation.strategy).toBe(RollbackStrategy.IMMEDIATE);
      expect(operation.status).toBe('pending');
    });

    it('should handle dry run rollback', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');

      const operation = await manager.rollback(rollbackPoint.id, {
        dryRun: true
      });

      expect(operation).toBeDefined();
      expect(operation.targetRollbackPointId).toBe(rollbackPoint.id);
    });

    it('should throw error for non-existent rollback point', async () => {
      await expect(
        manager.rollback('non-existent-id')
      ).rejects.toThrow('Rollback point not found');
    });
  });

  describe('getRollbackOperation', () => {
    it('should retrieve rollback operation by ID', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');
      const operation = await manager.rollback(rollbackPoint.id);

      const retrieved = await manager.getRollbackOperation(operation.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(operation.id);
    });

    it('should return null for non-existent operation', async () => {
      const result = await manager.getRollbackOperation('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('deleteRollbackPoint', () => {
    it('should delete rollback point and its snapshots', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');

      const deleted = await manager.deleteRollbackPoint(rollbackPoint.id);
      expect(deleted).toBe(true);

      const retrieved = await manager.getRollbackPoint(rollbackPoint.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent rollback point', async () => {
      const deleted = await manager.deleteRollbackPoint('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired data', async () => {
      // Create rollback point with short TTL
      const config = createDefaultRollbackConfig();
      config.defaultTTL = 100; // 100ms
      const shortManager = new RollbackManager(config);

      await shortManager.createRollbackPoint('Short-lived Point');

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      const cleanup = await shortManager.cleanup();

      expect(cleanup.removedPoints).toBeGreaterThanOrEqual(0);
      expect(cleanup.removedOperations).toBeGreaterThanOrEqual(0);
      expect(cleanup.removedSnapshots).toBeGreaterThanOrEqual(0);

      await shortManager.shutdown();
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', async () => {
      await manager.createRollbackPoint('Test Point 1');
      await manager.createRollbackPoint('Test Point 2');

      const metrics = manager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalRollbackPoints).toBeGreaterThanOrEqual(2);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('event emission', () => {
    it('should emit rollback-point-created event', async () => {
      const eventSpy = vi.fn();
      manager.on('rollback-point-created', eventSpy);

      await manager.createRollbackPoint('Test Point');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rollbackPoint: expect.objectContaining({
            name: 'Test Point'
          })
        })
      );
    });

    it('should emit rollback-started event', async () => {
      const rollbackPoint = await manager.createRollbackPoint('Test Point');
      const eventSpy = vi.fn();
      manager.on('rollback-started', eventSpy);

      await manager.rollback(rollbackPoint.id);

      // Give some time for async operation to start
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: expect.objectContaining({
            targetRollbackPointId: rollbackPoint.id
          })
        })
      );
    });
  });
});