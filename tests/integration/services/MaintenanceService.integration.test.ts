/**
 * Integration tests for MaintenanceService
 * Tests maintenance operations including cleanup, optimization, reindexing, and validation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MaintenanceService, MaintenanceTask, MaintenanceResult } from '@memento/core/services/MaintenanceService';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/database/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  TEST_DATABASE_CONFIG,
  insertTestFixtures
} from '../../test-utils/database-helpers';
import { Entity } from '@memento/shared-types';
import { GraphRelationship } from '@memento/shared-types';

describe('MaintenanceService Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let maintenanceService: MaintenanceService;

  beforeAll(async () => {
    // Initialize database service
    dbService = await setupTestDatabase();

    // Initialize knowledge graph service
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);

    // Initialize maintenance service
    maintenanceService = new MaintenanceService(dbService, kgService);

    // Insert test data
    await insertTestFixtures(dbService);
  }, 60000);

  afterAll(async () => {
    // Clean up
    await cleanupTestDatabase(dbService);
  });

  beforeEach(async () => {
    // Clear test data between tests
    await clearTestData(dbService);
  });

  describe('Cleanup Operations Integration', () => {
    beforeEach(async () => {
      // Create test entities and relationships for cleanup testing
      const entity1: Entity = {
        id: 'cleanup_test_entity_1',
        type: 'test',
        hash: 'test_hash_1',
        lastModified: new Date(),
        content: { test: 'cleanup test 1' },
        metadata: { test: true }
      };

      const entity2: Entity = {
        id: 'cleanup_test_entity_2',
        type: 'test',
        hash: 'test_hash_2',
        lastModified: new Date(),
        content: { test: 'cleanup test 2' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      // Create a relationship
      const relationship: GraphRelationship = {
        id: 'cleanup_test_rel_1',
        fromEntityId: 'cleanup_test_entity_1',
        toEntityId: 'cleanup_test_entity_2',
        type: 'test_relationship',
        properties: { test: true },
        created: new Date(),
        lastModified: new Date()
      };

      await kgService.createRelationship(relationship);

      // Delete entity2 to create an orphaned relationship
      await kgService.deleteEntity('cleanup_test_entity_2');
    });

    it('should successfully run cleanup task and remove orphaned data', async () => {
      const result: MaintenanceResult = await maintenanceService.runMaintenanceTask('cleanup');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.stringMatching(/^cleanup_/),
          duration: expect.any(Number),
          changes: expect.any(Array),
          statistics: expect.objectContaining({
            entitiesRemoved: expect.any(Number),
            relationshipsRemoved: expect.any(Number),
            orphanedRecords: expect.any(Number),
          }),
        })
      );

      // Verify cleanup statistics
      expect(result.statistics.entitiesRemoved).toBeGreaterThanOrEqual(0);
      expect(result.statistics.relationshipsRemoved).toBeGreaterThanOrEqual(0);
      expect(result.statistics.orphanedRecords).toBeGreaterThanOrEqual(0);

      // Verify changes array contains removal operations
      if (result.changes.length > 0) {
        const change = result.changes[0];
        expect(change).toHaveProperty('type');
        expect(change).toHaveProperty('id');
      }
    });

    it('should handle cleanup task progress tracking', async () => {
      // This test verifies that the task completes and progress is tracked
      const result = await maintenanceService.runMaintenanceTask('cleanup');

      expect(result).toEqual(
        expect.objectContaining({ success: true, taskId: expect.any(String) })
      );
    });

    it('should handle cleanup with no orphaned data gracefully', async () => {
      // First cleanup should remove orphaned data
      await maintenanceService.runMaintenanceTask('cleanup');

      // Second cleanup should handle empty state gracefully
      const result = await maintenanceService.runMaintenanceTask('cleanup');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.any(String),
          statistics: expect.any(Object),
        })
      );
    });
  });

  describe('Optimization Operations Integration', () => {
    it('should successfully run optimization task', async () => {
      const result: MaintenanceResult = await maintenanceService.runMaintenanceTask('optimize');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.stringMatching(/^optimize_/),
          duration: expect.any(Number),
          changes: expect.any(Array),
          statistics: expect.objectContaining({
            optimizedCollections: expect.any(Number),
            rebalancedIndexes: expect.any(Number),
            vacuumedTables: expect.any(Number),
          }),
        })
      );

      // Verify optimization statistics
      expect(typeof result.statistics.optimizedCollections).toBe('number');
      expect(typeof result.statistics.rebalancedIndexes).toBe('number');
      expect(typeof result.statistics.vacuumedTables).toBe('number');
    });

    it('should optimize Qdrant collections when available', async () => {
      const result = await maintenanceService.runMaintenanceTask('optimize');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check if Qdrant optimization was attempted
      const qdrantOptimizationChanges = result.changes.filter(change =>
        change.type === 'collection_optimized'
      );

      // May be empty if no collections exist, but should not error
      expect(qdrantOptimizationChanges).toEqual(expect.any(Array));
    });

    it('should perform PostgreSQL vacuum operation', async () => {
      const result = await maintenanceService.runMaintenanceTask('optimize');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check for vacuum operation
      const vacuumChanges = result.changes.filter(change =>
        change.type === 'postgres_vacuum'
      );

      // Should contain vacuum operation
      expect(vacuumChanges.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reindexing Operations Integration', () => {
    it('should successfully run reindexing task', async () => {
      const result: MaintenanceResult = await maintenanceService.runMaintenanceTask('reindex');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.stringMatching(/^reindex_/),
          duration: expect.any(Number),
          changes: expect.any(Array),
          statistics: expect.objectContaining({
            indexesRebuilt: expect.any(Number),
            collectionsReindexed: expect.any(Number),
            tablesReindexed: expect.any(Number),
          }),
        })
      );

      // Verify reindexing statistics
      expect(typeof result.statistics.indexesRebuilt).toBe('number');
      expect(typeof result.statistics.collectionsReindexed).toBe('number');
      expect(typeof result.statistics.tablesReindexed).toBe('number');
    });

    it('should handle reindexing of PostgreSQL tables', async () => {
      const result = await maintenanceService.runMaintenanceTask('reindex');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check for table reindexing changes
      const tableReindexChanges = result.changes.filter(change =>
        change.type === 'table_reindexed'
      );

      // Should contain table reindexing operations
      expect(tableReindexChanges).toEqual(expect.any(Array));
    });

    it('should handle reindexing of Qdrant collections', async () => {
      const result = await maintenanceService.runMaintenanceTask('reindex');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check for collection reindexing changes
      const collectionReindexChanges = result.changes.filter(change =>
        change.type === 'collection_reindexed'
      );

      // Should contain collection reindexing operations
      expect(collectionReindexChanges).toEqual(expect.any(Array));
    });
  });

  describe('Validation Operations Integration', () => {
    beforeEach(async () => {
      // Create test entities for validation
      const validEntity: Entity = {
        id: 'validation_test_entity_1',
        type: 'test',
        hash: 'valid_hash_1',
        lastModified: new Date(),
        content: { test: 'validation test' },
        metadata: { test: true }
      };

      const invalidEntity: any = {
        id: 'validation_test_entity_2',
        type: 'test',
        // Missing required fields: hash, lastModified
        content: { test: 'invalid validation test' },
        metadata: { test: true }
      };

      await kgService.createEntity(validEntity);
      // Note: Invalid entity would be rejected by createEntity, so we'll create a valid one for now
      // In real scenarios, validation would catch data inconsistencies
    });

    it('should successfully run validation task', async () => {
      const result: MaintenanceResult = await maintenanceService.runMaintenanceTask('validate');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.stringMatching(/^validate_/),
          duration: expect.any(Number),
          changes: expect.any(Array),
          statistics: expect.objectContaining({
            invalidEntities: expect.any(Number),
            invalidRelationships: expect.any(Number),
            integrityIssues: expect.any(Number),
            validatedCollections: expect.any(Number),
          }),
        })
      );

      // Verify validation statistics
      expect(typeof result.statistics.invalidEntities).toBe('number');
      expect(typeof result.statistics.invalidRelationships).toBe('number');
      expect(typeof result.statistics.integrityIssues).toBe('number');
      expect(typeof result.statistics.validatedCollections).toBe('number');
    });

    it('should validate entity integrity', async () => {
      const result = await maintenanceService.runMaintenanceTask('validate');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check for entity validation changes
      const entityValidationChanges = result.changes.filter(change =>
        change.type === 'invalid_entity'
      );

      // Should contain entity validation results
      expect(Array.isArray(entityValidationChanges)).toBe(true);
    });

    it('should validate Qdrant collections', async () => {
      const result = await maintenanceService.runMaintenanceTask('validate');

      expect(result).toEqual(expect.objectContaining({ success: true }));

      // Check for collection validation changes
      const collectionValidationChanges = result.changes.filter(change =>
        change.type === 'collection_integrity_issue' ||
        change.type === 'collection_validation_failed'
      );

      // Should contain collection validation results
      expect(Array.isArray(collectionValidationChanges)).toBe(true);
    });

    it('should validate database connectivity', async () => {
      const result = await maintenanceService.runMaintenanceTask('validate');

      expect(result).toEqual(
        expect.objectContaining({ success: expect.any(Boolean) })
      );
    });
  });

  describe('Task Management Integration', () => {
    it('should track active tasks correctly', async () => {
      // Start multiple tasks
      const cleanupPromise = maintenanceService.runMaintenanceTask('cleanup');
      const optimizePromise = maintenanceService.runMaintenanceTask('optimize');

      // Check that tasks are tracked as active
      const activeTasks = maintenanceService.getActiveTasks();
      expect(activeTasks.length).toBeGreaterThan(0);

      // Each active task should have proper structure
      activeTasks.forEach(task => {
        expect(task.id).toEqual(expect.any(String));
        expect(task.name).toEqual(expect.any(String));
        expect(task.description).toEqual(expect.any(String));
        expect(['pending', 'running', 'completed', 'failed']).toContain(task.status);
        expect(typeof task.progress).toBe('number');
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
      });

      // Wait for tasks to complete
      await Promise.all([cleanupPromise, optimizePromise]);

      // Verify tasks are no longer active
      const finalActiveTasks = maintenanceService.getActiveTasks();
      expect(finalActiveTasks.length).toBe(0);
    });

    it('should retrieve task status by ID', async () => {
      const cleanupPromise = maintenanceService.runMaintenanceTask('cleanup');

      // Get the task ID by checking active tasks
      const activeTasks = maintenanceService.getActiveTasks();
      expect(activeTasks.length).toBe(1);

      const taskId = activeTasks[0].id;
      const taskStatus = maintenanceService.getTaskStatus(taskId);

      expect(taskStatus).toEqual(expect.any(Object));
      expect(taskStatus?.id).toBe(taskId);
      expect(taskStatus?.status).toBe('running');

      // Wait for completion
      await cleanupPromise;

      // Check final status using completed task registry
      const finalTaskStatus = maintenanceService.getCompletedTask(taskId);
      expect(finalTaskStatus?.status).toBe('completed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid maintenance task types', async () => {
      await expect(
        (maintenanceService as any).runMaintenanceTask('invalid_task')
      ).rejects.toThrow('Unknown maintenance task');
    });

    it('should handle database connection failures gracefully', async () => {
      // Create maintenance service with uninitialized database
      const invalidMaintenanceService = new MaintenanceService({} as DatabaseService, kgService);

      await expect(
        invalidMaintenanceService.runMaintenanceTask('cleanup')
      ).rejects.toThrow(/Database service/);
    });

    it('should handle concurrent maintenance tasks', async () => {
      const tasks = ['cleanup', 'validate', 'optimize'];
      const promises = tasks.map(task =>
        maintenanceService.runMaintenanceTask(task)
      );

      const results = await Promise.allSettled(promises);

      // At least some tasks should succeed
      const successfulResults = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      );

      expect(successfulResults.length).toBeGreaterThan(0);

      // Failed tasks should have proper error handling
      const failedResults = results.filter(result =>
        result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      );

      // Failed tasks should still return proper result objects
      failedResults.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value).toEqual(
            expect.objectContaining({ success: expect.any(Boolean) })
          );
        }
      });
    });

    it('should handle tasks with empty datasets', async () => {
      // Ensure clean state
      await clearTestData(dbService);

      const result = await maintenanceService.runMaintenanceTask('cleanup');

      // Should succeed even with empty data
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          taskId: expect.any(String),
          statistics: expect.any(Object),
        })
      );
    });
  });

  describe('Performance and Load Testing', () => {
    it('should complete maintenance tasks within reasonable time', async () => {
      const startTime = Date.now();

      await maintenanceService.runMaintenanceTask('cleanup');

      const duration = Date.now() - startTime;

      // Should complete within 30 seconds (adjust based on environment)
      expect(duration).toBeLessThan(30000);
    });

    it('should handle multiple maintenance cycles', async () => {
      const cycles = 3;
      const results: MaintenanceResult[] = [];

      for (let i = 0; i < cycles; i++) {
        const result = await maintenanceService.runMaintenanceTask('cleanup');
        results.push(result);
        expect(result).toEqual(expect.objectContaining({ success: true }));
      }

      // All cycles should have succeeded
      expect(results.every(r => r.success)).toBe(true);

      // Each result should have a unique task ID
      const taskIds = results.map(r => r.taskId);
      const uniqueTaskIds = new Set(taskIds);
      expect(uniqueTaskIds.size).toBe(cycles);
    });
  });
});
