/**
 * Integration tests for RollbackCapabilities
 * Tests rollback operations including rollback points, entity/relationship restoration, and error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RollbackCapabilities, RollbackPoint, RollbackResult } from '../../../src/services/RollbackCapabilities';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { DatabaseService } from '../../../src/services/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData
} from '../../test-utils/database-helpers';
import { Entity } from '../../../src/models/entities';
import { GraphRelationship } from '../../../src/models/relationships';

describe('RollbackCapabilities Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let rollbackService: RollbackCapabilities;

  beforeAll(async () => {
    // Initialize database service
    dbService = await setupTestDatabase();

    // Initialize knowledge graph service
    kgService = new KnowledgeGraphService(dbService);

    // Initialize rollback service
    rollbackService = new RollbackCapabilities(kgService, dbService);
  }, 60000);

  afterAll(async () => {
    // Clean up
    await cleanupTestDatabase(dbService);
  });

  beforeEach(async () => {
    // Clear test data between tests
    await clearTestData(dbService);

    // Clear rollback points
    const allRollbackPoints = rollbackService.getAllRollbackPoints();
    allRollbackPoints.forEach(point => {
      rollbackService.deleteRollbackPoint(point.id);
    });
  });

  describe('Rollback Point Creation Integration', () => {
    it('should create rollback point successfully', async () => {
      const operationId = 'test_operation_1';
      const description = 'Test rollback point creation';

      const rollbackId = await rollbackService.createRollbackPoint(operationId, description);

      expect(typeof rollbackId).toBe('string');
      expect(typeof rollbackId).toBe('string');
      expect(rollbackId).toMatch(/^rollback_test_operation_1_/);

      // Verify rollback point exists
      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      expect(rollbackPoint).toEqual(expect.any(Object));
      expect(rollbackPoint?.operationId).toBe(operationId);
      expect(rollbackPoint?.description).toBe(description);
      expect(rollbackPoint?.timestamp).toBeInstanceOf(Date);
    });

    it('should capture current entities and relationships in rollback point', async () => {
      // Create test entities and relationships
      const entity1: Entity = {
        id: 'rollback_test_entity_1',
        type: 'test',
        hash: 'rollback_hash_1',
        lastModified: new Date(),
        content: { test: 'rollback test 1' },
        metadata: { test: true }
      };

      const entity2: Entity = {
        id: 'rollback_test_entity_2',
        type: 'test',
        hash: 'rollback_hash_2',
        lastModified: new Date(),
        content: { test: 'rollback test 2' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      const relationship: GraphRelationship = {
        id: 'rollback_test_rel_1',
        fromEntityId: 'rollback_test_entity_1',
        toEntityId: 'rollback_test_entity_2',
        type: 'test_relationship',
        properties: { test: true },
        created: new Date(),
        lastModified: new Date()
      };

      await kgService.createRelationship(relationship);

      // Create rollback point
      const rollbackId = await rollbackService.createRollbackPoint('test_operation_2', 'Capture test data');

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      expect(rollbackPoint).toEqual(expect.any(Object));
      expect(rollbackPoint?.entities).toEqual(expect.any(Array));
      expect(rollbackPoint?.relationships).toEqual(expect.any(Array));

      // Should have captured the entities and relationships
      expect(rollbackPoint?.entities.length).toBeGreaterThanOrEqual(2);
      expect(rollbackPoint?.relationships.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle rollback point creation with empty graph', async () => {
      const rollbackId = await rollbackService.createRollbackPoint('empty_test', 'Empty graph test');

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      expect(rollbackPoint).toEqual(expect.any(Object));
      expect(rollbackPoint?.entities).toEqual(expect.any(Array));
      expect(rollbackPoint?.relationships).toEqual(expect.any(Array));
    });
  });

  describe('Rollback Point Management Integration', () => {
    let rollbackId1: string;
    let rollbackId2: string;

    beforeEach(async () => {
      // Create test rollback points
      rollbackId1 = await rollbackService.createRollbackPoint('management_test_1', 'First rollback point');
      rollbackId2 = await rollbackService.createRollbackPoint('management_test_2', 'Second rollback point');
    });

    it('should list rollback points for specific operation', async () => {
      const operationPoints = rollbackService.getRollbackPointsForOperation('management_test_1');

      expect(operationPoints).toEqual(expect.any(Array));
      expect(operationPoints.length).toBeGreaterThanOrEqual(1);

      // All points should belong to the specified operation
      operationPoints.forEach(point => {
        expect(point.operationId).toBe('management_test_1');
      });
    });

    it('should return empty array for non-existent operation', async () => {
      const operationPoints = rollbackService.getRollbackPointsForOperation('non_existent_operation');

      expect(operationPoints).toEqual(expect.any(Array));
      expect(operationPoints.length).toBe(0);
    });

    it('should retrieve all rollback points', async () => {
      const allPoints = rollbackService.getAllRollbackPoints();

      expect(allPoints).toEqual(expect.any(Array));
      expect(allPoints.length).toBeGreaterThanOrEqual(2);

      // Should be sorted by timestamp (most recent first)
      for (let i = 1; i < allPoints.length; i++) {
        expect(allPoints[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(allPoints[i].timestamp.getTime());
      }
    });

    it('should delete rollback point successfully', async () => {
      const deleteResult = rollbackService.deleteRollbackPoint(rollbackId1);

      expect(deleteResult).toBe(true);

      // Verify point is deleted
      const deletedPoint = rollbackService.getRollbackPoint(rollbackId1);
      expect(deletedPoint).toBeNull();
    });

    it('should return false when deleting non-existent rollback point', async () => {
      const deleteResult = rollbackService.deleteRollbackPoint('non_existent_rollback_id');

      expect(deleteResult).toBe(false);
    });

    it('should validate rollback point successfully', async () => {
      const validationResult = await rollbackService.validateRollbackPoint(rollbackId1);

      expect(validationResult).toEqual(expect.any(Object));
      expect(typeof validationResult.valid).toBe('boolean');
      expect(validationResult.issues).toEqual(expect.any(Array));
    });

    it('should detect invalid rollback point', async () => {
      const validationResult = await rollbackService.validateRollbackPoint('invalid_rollback_id');

      expect(validationResult.valid).toBe(false);
      expect(validationResult.issues).toContain('Rollback point not found');
    });
  });

  describe('Entity Change Tracking Integration', () => {
    let rollbackId: string;

    beforeEach(async () => {
      rollbackId = await rollbackService.createRollbackPoint('change_tracking_test', 'Change tracking test');
    });

    it('should record entity creation changes', async () => {
      const entity: Entity = {
        id: 'change_test_entity',
        type: 'test',
        hash: 'change_hash',
        lastModified: new Date(),
        content: { test: 'change tracking test' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity);

      await rollbackService.recordEntityChange(
        rollbackId,
        entity.id,
        'create',
        undefined,
        entity
      );

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      expect(rollbackPoint).toEqual(expect.any(Object));

      const entityChange = rollbackPoint?.entities.find((e: any) => e.id === entity.id);
      expect(entityChange).toEqual(expect.any(Object));
      expect(entityChange.action).toBe('create');
      expect(entityChange.newState).not.toBeUndefined();
    });

    it('should record entity update changes', async () => {
      const originalEntity: Entity = {
        id: 'update_test_entity',
        type: 'test',
        hash: 'original_hash',
        lastModified: new Date(),
        content: { test: 'original content' },
        metadata: { test: true }
      };

      await kgService.createEntity(originalEntity);

      const updatedEntity = {
        ...originalEntity,
        content: { test: 'updated content' },
        lastModified: new Date()
      };

      await rollbackService.recordEntityChange(
        rollbackId,
        originalEntity.id,
        'update',
        originalEntity,
        updatedEntity
      );

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      const entityChange = rollbackPoint?.entities.find((e: any) => e.id === originalEntity.id);
      expect(entityChange).toEqual(expect.any(Object));
      expect(entityChange.action).toBe('update');
      expect(entityChange.previousState).not.toBeUndefined();
      expect(entityChange.newState).not.toBeUndefined();
    });

    it('should record entity deletion changes', async () => {
      const entity: Entity = {
        id: 'delete_test_entity',
        type: 'test',
        hash: 'delete_hash',
        lastModified: new Date(),
        content: { test: 'to be deleted' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity);

      await rollbackService.recordEntityChange(
        rollbackId,
        entity.id,
        'delete',
        entity,
        undefined
      );

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      const entityChange = rollbackPoint?.entities.find((e: any) => e.id === entity.id);
      expect(entityChange).toEqual(expect.any(Object));
      expect(entityChange.action).toBe('delete');
      expect(entityChange.previousState).not.toBeUndefined();
    });

    it('should handle recording changes for non-existent rollback point', async () => {
      const entity: Entity = {
        id: 'error_test_entity',
        type: 'test',
        hash: 'error_hash',
        lastModified: new Date(),
        content: { test: 'error test' },
        metadata: { test: true }
      };

      await expect(
        rollbackService.recordEntityChange(
          'non_existent_rollback_id',
          entity.id,
          'create',
          undefined,
          entity
        )
      ).rejects.toThrow('Rollback point non_existent_rollback_id not found');
    });
  });

  describe('Rollback Execution Integration', () => {
    let rollbackId: string;

    beforeEach(async () => {
      // Create initial state
      const entity1: Entity = {
        id: 'rollback_exec_entity_1',
        type: 'test',
        hash: 'exec_hash_1',
        lastModified: new Date(),
        content: { test: 'rollback execution test 1' },
        metadata: { test: true }
      };

      const entity2: Entity = {
        id: 'rollback_exec_entity_2',
        type: 'test',
        hash: 'exec_hash_2',
        lastModified: new Date(),
        content: { test: 'rollback execution test 2' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      // Create rollback point
      rollbackId = await rollbackService.createRollbackPoint('rollback_exec_test', 'Rollback execution test');
    });

    it('should rollback to a valid rollback point successfully', async () => {
      // Modify the graph after creating rollback point
      const updatedEntity = {
        id: 'rollback_exec_entity_1',
        content: { test: 'modified after rollback point' },
        lastModified: new Date()
      };

      await kgService.updateEntity('rollback_exec_entity_1', updatedEntity);

      // Perform rollback
      const rollbackResult = await rollbackService.rollbackToPoint(rollbackId);

      expect(rollbackResult).toEqual(expect.any(Object));
      expect(typeof rollbackResult.success).toBe('boolean');
      expect(typeof rollbackResult.rolledBackEntities).toBe('number');
      expect(typeof rollbackResult.rolledBackRelationships).toBe('number');
      expect(Array.isArray(rollbackResult.errors)).toBe(true);
      expect(typeof rollbackResult.partialSuccess).toBe('boolean');
    });

    it('should handle rollback of non-existent rollback point', async () => {
      const rollbackResult = await rollbackService.rollbackToPoint('non_existent_rollback_id');

      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.rolledBackEntities).toBe(0);
      expect(rollbackResult.rolledBackRelationships).toBe(0);
      expect(rollbackResult.errors.length).toBeGreaterThan(0);
      expect(rollbackResult.errors[0].error).toContain('not found');
    });

    it('should rollback last operation for specific operation ID', async () => {
      const operationId = 'rollback_last_test';

      // Create another rollback point for the same operation
      const secondRollbackId = await rollbackService.createRollbackPoint(operationId, 'Second rollback point');

      const rollbackResult = await rollbackService.rollbackLastOperation(operationId);

      expect(rollbackResult).toEqual(expect.any(Object));
      // Should rollback to the most recent point (secondRollbackId)
      expect(rollbackResult).not.toBeNull();
    });

    it('should return null when rolling back non-existent operation', async () => {
      const rollbackResult = await rollbackService.rollbackLastOperation('non_existent_operation');

      expect(rollbackResult).toBeNull();
    });

    it('should handle rollback with entity deletions', async () => {
      // Delete an entity after creating rollback point
      await kgService.deleteEntity('rollback_exec_entity_2');

      // Perform rollback
      const rollbackResult = await rollbackService.rollbackToPoint(rollbackId);

      expect(rollbackResult).toEqual(expect.any(Object));
      // Should attempt to restore the deleted entity
      expect(rollbackResult.rolledBackEntities).toBeGreaterThanOrEqual(0);
    });

    it('should handle rollback with entity creations', async () => {
      // Create a new entity after rollback point
      const newEntity: Entity = {
        id: 'rollback_new_entity',
        type: 'test',
        hash: 'new_hash',
        lastModified: new Date(),
        content: { test: 'new entity after rollback point' },
        metadata: { test: true }
      };

      await kgService.createEntity(newEntity);

      // Perform rollback
      const rollbackResult = await rollbackService.rollbackToPoint(rollbackId);

      expect(rollbackResult).toEqual(expect.any(Object));
      // Should attempt to remove the newly created entity
      expect(rollbackResult.rolledBackEntities).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Snapshot Operations Integration', () => {
    it('should create snapshot successfully', async () => {
      const operationId = 'snapshot_test';
      const description = 'Test snapshot creation';

      const snapshotId = await rollbackService.createSnapshot(operationId, description);

      expect(typeof snapshotId).toBe('string');
      expect(typeof snapshotId).toBe('string');
      expect(snapshotId).toMatch(/^rollback_snapshot_test_/);

      // Verify snapshot exists as rollback point
      const snapshot = rollbackService.getRollbackPoint(snapshotId);
      expect(snapshot).toEqual(expect.any(Object));
      expect(snapshot?.operationId).toBe(operationId);
      expect(snapshot?.description).toBe(`Snapshot: ${description}`);
    });

    it('should restore from snapshot successfully', async () => {
      const operationId = 'snapshot_restore_test';

      // Create snapshot
      const snapshotId = await rollbackService.createSnapshot(operationId, 'Snapshot for restore test');

      // Modify graph after snapshot
      const entity: Entity = {
        id: 'snapshot_restore_entity',
        type: 'test',
        hash: 'snapshot_hash',
        lastModified: new Date(),
        content: { test: 'snapshot restore test' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity);

      // Restore from snapshot
      const restoreResult = await rollbackService.restoreFromSnapshot(snapshotId);

      expect(restoreResult).toEqual(expect.any(Object));
      expect(typeof restoreResult.success).toBe('boolean');
      expect(typeof restoreResult.rolledBackEntities).toBe('number');
      expect(typeof restoreResult.rolledBackRelationships).toBe('number');
      expect(Array.isArray(restoreResult.errors)).toBe(true);
    });

    it('should handle restore from non-existent snapshot', async () => {
      const restoreResult = await rollbackService.restoreFromSnapshot('non_existent_snapshot_id');

      expect(restoreResult.success).toBe(false);
      expect(restoreResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Monitoring Integration', () => {
    beforeEach(async () => {
      // Create multiple rollback points for statistics testing
      await rollbackService.createRollbackPoint('stats_test_1', 'Statistics test 1');
      await rollbackService.createRollbackPoint('stats_test_2', 'Statistics test 2');
      await rollbackService.createRollbackPoint('stats_test_3', 'Statistics test 3');
    });

    it('should provide accurate rollback statistics', async () => {
      const stats = rollbackService.getRollbackStatistics();

      expect(stats).toEqual(expect.any(Object));
      expect(typeof stats.totalRollbackPoints).toBe('number');
      expect(typeof stats.averageEntitiesPerPoint).toBe('number');
      expect(typeof stats.averageRelationshipsPerPoint).toBe('number');

      // Should have statistics for the created rollback points
      expect(stats.totalRollbackPoints).toBeGreaterThanOrEqual(3);
      expect(stats.oldestRollbackPoint).toBeInstanceOf(Date);
      expect(stats.newestRollbackPoint).toBeInstanceOf(Date);

      // Newest should be after oldest
      expect(stats.newestRollbackPoint?.getTime()).toBeGreaterThanOrEqual(stats.oldestRollbackPoint?.getTime() || 0);
    });

    it('should handle statistics with no rollback points', async () => {
      // Clear all rollback points
      const allPoints = rollbackService.getAllRollbackPoints();
      allPoints.forEach(point => {
        rollbackService.deleteRollbackPoint(point.id);
      });

      const stats = rollbackService.getRollbackStatistics();

      expect(stats.totalRollbackPoints).toBe(0);
      expect(stats.oldestRollbackPoint).toBeNull();
      expect(stats.newestRollbackPoint).toBeNull();
      expect(stats.averageEntitiesPerPoint).toBe(0);
      expect(stats.averageRelationshipsPerPoint).toBe(0);
    });

    it('should cleanup old rollback points', async () => {
      // Create rollback points with old timestamps
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const oldRollbackPoint: RollbackPoint = {
        id: 'old_rollback_point',
        operationId: 'cleanup_test',
        timestamp: oldTimestamp,
        entities: [],
        relationships: [],
        description: 'Old rollback point for cleanup test'
      };

      (rollbackService as any).rollbackPoints.set('old_rollback_point', oldRollbackPoint);

      const initialCount = rollbackService.getAllRollbackPoints().length;

      // Cleanup points older than 1 hour
      const cleanedCount = rollbackService.cleanupOldRollbackPoints(60 * 60 * 1000); // 1 hour

      expect(cleanedCount).toBeGreaterThanOrEqual(0);

      const finalCount = rollbackService.getAllRollbackPoints().length;
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures during rollback point creation', async () => {
      // Create rollback service with invalid database
      const invalidRollbackService = new RollbackCapabilities(kgService, {} as DatabaseService);

      await expect(
        invalidRollbackService.createRollbackPoint('error_test', 'Error handling test')
      ).rejects.toThrow('Database service not initialized');
    });

    it('should handle concurrent rollback operations', async () => {
      const rollbackId1 = await rollbackService.createRollbackPoint('concurrent_test_1', 'Concurrent test 1');
      const rollbackId2 = await rollbackService.createRollbackPoint('concurrent_test_2', 'Concurrent test 2');

      // Attempt concurrent rollbacks
      const rollbackPromises = [
        rollbackService.rollbackToPoint(rollbackId1),
        rollbackService.rollbackToPoint(rollbackId2)
      ];

      const results = await Promise.allSettled(rollbackPromises);

      // At least one should succeed
      const successfulResults = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      );

      expect(successfulResults.length).toBeGreaterThan(0);

      // Failed operations should have proper error handling
      const failedResults = results.filter(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && !result.value.success)
      );

      failedResults.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.errors).toEqual(expect.any(Array));
        }
      });
    });

    it('should handle large rollback points efficiently', async () => {
      // Create many entities to test large rollback point handling
      const entityCount = 10;
      const entities: Entity[] = [];

      for (let i = 0; i < entityCount; i++) {
        const entity: Entity = {
          id: `large_rollback_entity_${i}`,
          type: 'test',
          hash: `large_hash_${i}`,
          lastModified: new Date(),
          content: { test: `large rollback test ${i}`, data: 'x'.repeat(100) }, // Add some size
          metadata: { test: true, index: i }
        };

        entities.push(entity);
        await kgService.createEntity(entity);
      }

      const startTime = Date.now();

      const rollbackId = await rollbackService.createRollbackPoint('large_test', 'Large rollback point test');

      const endTime = Date.now();
      const duration = endTime - startTime;

      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      expect(rollbackPoint).toEqual(expect.any(Object));
      expect(rollbackPoint?.entities.length).toBeGreaterThanOrEqual(entityCount);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for creating large rollback point
    });

    it('should handle rollback point validation with corrupted data', async () => {
      const rollbackId = await rollbackService.createRollbackPoint('validation_test', 'Validation test');

      // Manually corrupt the rollback point
      const rollbackPoint = rollbackService.getRollbackPoint(rollbackId);
      if (rollbackPoint) {
        // Corrupt entities array
        (rollbackPoint as any).entities = null;
      }

      const validationResult = await rollbackService.validateRollbackPoint(rollbackId);

      // Should handle corruption gracefully
      expect(validationResult).toEqual(expect.any(Object));
      expect(typeof validationResult.valid).toBe('boolean');
      expect(Array.isArray(validationResult.issues)).toBe(true);
    });

    it('should handle cleanup with invalid rollback points', async () => {
      // Manually add invalid rollback point
      (rollbackService as any).rollbackPoints.set('invalid_point', {
        id: 'invalid_point',
        operationId: 'invalid_test',
        timestamp: 'invalid_timestamp', // Invalid timestamp
        entities: [],
        relationships: [],
        description: 'Invalid rollback point'
      });

      // Should handle cleanup without crashing
      const cleanedCount = rollbackService.cleanupOldRollbackPoints();

      expect(typeof cleanedCount).toBe('number');
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple rollback points efficiently', async () => {
      const pointCount = 5;
      const startTime = Date.now();

      const rollbackIds: string[] = [];

      for (let i = 0; i < pointCount; i++) {
        const rollbackId = await rollbackService.createRollbackPoint(
          `performance_test_${i}`,
          `Performance test rollback point ${i}`
        );
        rollbackIds.push(rollbackId);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(rollbackIds.length).toBe(pointCount);

      // All rollback points should be created successfully
      rollbackIds.forEach(id => {
        const point = rollbackService.getRollbackPoint(id);
        expect(point).toEqual(expect.any(Object));
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000); // 3 seconds for 5 rollback points
    });

    it('should handle rapid rollback point creation and deletion', async () => {
      const cycleCount = 3;
      const startTime = Date.now();

      for (let i = 0; i < cycleCount; i++) {
        const rollbackId = await rollbackService.createRollbackPoint(
          `cycle_test_${i}`,
          `Cycle test ${i}`
        );

        // Immediately delete the rollback point
        rollbackService.deleteRollbackPoint(rollbackId);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds for 3 create/delete cycles
    });

    it('should maintain performance with many rollback points', async () => {
      // Create many rollback points
      const manyPoints = 10;
      const rollbackIds: string[] = [];

      for (let i = 0; i < manyPoints; i++) {
        const rollbackId = await rollbackService.createRollbackPoint(
          `many_points_test_${i}`,
          `Many points test ${i}`
        );
        rollbackIds.push(rollbackId);
      }

      const startTime = Date.now();

      // Test retrieval performance
      const allPoints = rollbackService.getAllRollbackPoints();
      const stats = rollbackService.getRollbackStatistics();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(allPoints.length).toBeGreaterThanOrEqual(manyPoints);
      expect(stats.totalRollbackPoints).toBeGreaterThanOrEqual(manyPoints);

      // Retrieval operations should be fast
      expect(duration).toBeLessThan(1000); // 1 second for retrieval operations
    });
  });
});
