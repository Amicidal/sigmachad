/**
 * Unit tests for SnapshotManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnapshotManager } from '../../src/rollback/Snapshot.js';
import { SnapshotType, createDefaultRollbackConfig } from '../../src/rollback/index.js';

describe('SnapshotManager', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    const config = createDefaultRollbackConfig();
    manager = new SnapshotManager(config);
  });

  describe('createSnapshot', () => {
    it('should create a snapshot successfully', async () => {
      const data = { id: '1', name: 'Test Entity', value: 42 };
      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.rollbackPointId).toBe('rollback-1');
      expect(snapshot.type).toBe(SnapshotType.ENTITY);
      expect(snapshot.size).toBeGreaterThan(0);
      expect(snapshot.createdAt).toBeDefined();
      expect(snapshot.checksum).toBeDefined();
    });

    it('should handle complex nested data structures', async () => {
      const complexData = {
        entities: [
          { id: '1', properties: { name: 'Entity 1', tags: ['tag1', 'tag2'] } },
          { id: '2', properties: { name: 'Entity 2', tags: ['tag3'] } }
        ],
        relationships: new Map([
          ['rel1', { from: '1', to: '2', type: 'CONNECTS' }]
        ]),
        metadata: {
          timestamp: new Date(),
          session: 'session-123'
        }
      };

      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        complexData
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.size).toBeGreaterThan(0);
    });

    it('should throw error when snapshot exceeds size limit', async () => {
      const config = createDefaultRollbackConfig();
      config.maxSnapshotSize = 100; // Very small limit
      const limitedManager = new SnapshotManager(config);

      const largeData = {
        data: 'x'.repeat(1000) // Large string
      };

      await expect(
        limitedManager.createSnapshot('rollback-1', SnapshotType.ENTITY, largeData)
      ).rejects.toThrow('Snapshot size');
    });
  });

  describe('getSnapshot', () => {
    it('should retrieve existing snapshot', async () => {
      const data = { id: '1', name: 'Test Entity' };
      const created = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      const retrieved = manager.getSnapshot(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.type).toBe(SnapshotType.ENTITY);
      expect(retrieved!.rollbackPointId).toBe('rollback-1');
    });

    it('should return null for non-existent snapshot', () => {
      const result = manager.getSnapshot('non-existent-id');
      expect(result).toBeNull();
    });

    it('should verify data integrity using checksum', async () => {
      const data = { id: '1', name: 'Test Entity' };
      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      // Should not throw for valid snapshot
      const retrieved = manager.getSnapshot(snapshot.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('getSnapshotsForRollbackPoint', () => {
    it('should return all snapshots for a rollback point', async () => {
      const data1 = { id: '1', type: 'entity' };
      const data2 = { id: '1', type: 'relationship' };

      await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data1);
      await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data2);
      await manager.createSnapshot('rollback-2', SnapshotType.ENTITY, data1);

      const snapshots = manager.getSnapshotsForRollbackPoint('rollback-1');

      expect(snapshots).toHaveLength(2);
      expect(snapshots.every(s => s.rollbackPointId === 'rollback-1')).toBe(true);
      expect(snapshots.map(s => s.type)).toContain(SnapshotType.ENTITY);
      expect(snapshots.map(s => s.type)).toContain(SnapshotType.RELATIONSHIP);
    });

    it('should return empty array for non-existent rollback point', () => {
      const snapshots = manager.getSnapshotsForRollbackPoint('non-existent');
      expect(snapshots).toHaveLength(0);
    });

    it('should return snapshots sorted by creation time', async () => {
      const data = { id: '1' };

      const snapshot1 = await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data);
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      const snapshot2 = await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data);

      const snapshots = manager.getSnapshotsForRollbackPoint('rollback-1');

      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].id).toBe(snapshot1.id); // Earlier first
      expect(snapshots[1].id).toBe(snapshot2.id);
    });
  });

  describe('getSnapshotsByType', () => {
    it('should return snapshots filtered by type', async () => {
      const data = { id: '1' };

      await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data);
      await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data);
      await manager.createSnapshot('rollback-2', SnapshotType.ENTITY, data);

      const entitySnapshots = manager.getSnapshotsByType(SnapshotType.ENTITY);
      const relationshipSnapshots = manager.getSnapshotsByType(SnapshotType.RELATIONSHIP);

      expect(entitySnapshots).toHaveLength(2);
      expect(entitySnapshots.every(s => s.type === SnapshotType.ENTITY)).toBe(true);

      expect(relationshipSnapshots).toHaveLength(1);
      expect(relationshipSnapshots[0].type).toBe(SnapshotType.RELATIONSHIP);
    });
  });

  describe('restoreFromSnapshot', () => {
    it('should restore original data from snapshot', async () => {
      const originalData = {
        id: '1',
        name: 'Test Entity',
        properties: { value: 42, tags: ['tag1', 'tag2'] },
        timestamp: new Date('2023-01-01T00:00:00Z'),
        map: new Map([['key1', 'value1'], ['key2', 'value2']]),
        set: new Set(['item1', 'item2'])
      };

      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        originalData
      );

      const restoredData = await manager.restoreFromSnapshot(snapshot.id);

      // Compare manually since Date serialization changes the type
      expect(restoredData.id).toBe(originalData.id);
      expect(restoredData.name).toBe(originalData.name);
      expect(restoredData.properties).toEqual(originalData.properties);
      expect(restoredData.map).toBeInstanceOf(Map);
      expect(restoredData.set).toBeInstanceOf(Set);
      // Date gets serialized to string - just verify it exists and is the correct value
      expect(restoredData.timestamp).toBeDefined();
      expect(new Date(restoredData.timestamp).getTime()).toBe(originalData.timestamp.getTime());
    });

    it('should throw error for non-existent snapshot', async () => {
      await expect(
        manager.restoreFromSnapshot('non-existent-id')
      ).rejects.toThrow('Snapshot not found');
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete existing snapshot', async () => {
      const data = { id: '1' };
      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      const deleted = manager.deleteSnapshot(snapshot.id);
      expect(deleted).toBe(true);

      const retrieved = manager.getSnapshot(snapshot.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent snapshot', () => {
      const deleted = manager.deleteSnapshot('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should update rollback point tracking when deleting snapshot', async () => {
      const data = { id: '1' };
      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      manager.deleteSnapshot(snapshot.id);

      const snapshots = manager.getSnapshotsForRollbackPoint('rollback-1');
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('deleteSnapshotsForRollbackPoint', () => {
    it('should delete all snapshots for a rollback point', async () => {
      const data = { id: '1' };

      await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data);
      await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data);
      await manager.createSnapshot('rollback-2', SnapshotType.ENTITY, data);

      const deletedCount = manager.deleteSnapshotsForRollbackPoint('rollback-1');

      expect(deletedCount).toBe(2);

      const snapshots = manager.getSnapshotsForRollbackPoint('rollback-1');
      expect(snapshots).toHaveLength(0);

      // Should not affect other rollback points
      const otherSnapshots = manager.getSnapshotsForRollbackPoint('rollback-2');
      expect(otherSnapshots).toHaveLength(1);
    });

    it('should return 0 for non-existent rollback point', () => {
      const deletedCount = manager.deleteSnapshotsForRollbackPoint('non-existent');
      expect(deletedCount).toBe(0);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage statistics', async () => {
      const data1 = { id: '1', type: 'entity' };
      const data2 = { id: '2', type: 'relationship' };

      await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data1);
      await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data2);

      const usage = manager.getMemoryUsage();

      expect(usage.totalSnapshots).toBe(2);
      expect(usage.totalSize).toBeGreaterThan(0);
      expect(usage.averageSize).toBeGreaterThan(0);
      expect(usage.snapshotsByType[SnapshotType.ENTITY]).toBe(1);
      expect(usage.snapshotsByType[SnapshotType.RELATIONSHIP]).toBe(1);
    });

    it('should return zero usage when no snapshots exist', () => {
      const usage = manager.getMemoryUsage();

      expect(usage.totalSnapshots).toBe(0);
      expect(usage.totalSize).toBe(0);
      expect(usage.averageSize).toBe(0);
      expect(Object.keys(usage.snapshotsByType)).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up orphaned snapshots', async () => {
      const data = { id: '1' };
      const snapshot = await manager.createSnapshot(
        'rollback-1',
        SnapshotType.ENTITY,
        data
      );

      // Manually clear rollback point tracking to simulate orphaned snapshot
      const snapshots = (manager as any).snapshotsByRollbackPoint;
      snapshots.clear();

      const cleanedCount = await manager.cleanup();

      expect(cleanedCount).toBe(1);
      expect(manager.getSnapshot(snapshot.id)).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all snapshots and reset state', async () => {
      const data = { id: '1' };

      await manager.createSnapshot('rollback-1', SnapshotType.ENTITY, data);
      await manager.createSnapshot('rollback-1', SnapshotType.RELATIONSHIP, data);

      manager.clear();

      const usage = manager.getMemoryUsage();
      expect(usage.totalSnapshots).toBe(0);
      expect(usage.totalSize).toBe(0);
    });
  });
});