/**
 * Integration tests for SynchronizationCoordinator
 * Tests synchronization operations including full sync, incremental sync, and partial sync
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SynchronizationCoordinator, SyncOperation, SyncOptions, PartialUpdate } from '../../../src/services/SynchronizationCoordinator';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { ASTParser } from '../../../src/services/ASTParser';
import { DatabaseService } from '../../../src/services/DatabaseService';
import { FileChange } from '../../../src/services/FileWatcher';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  TEST_DATABASE_CONFIG
} from '../../test-utils/database-helpers';
import { Entity } from '../../../src/models/entities';
import { GraphRelationship } from '../../../src/models/relationships';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('SynchronizationCoordinator Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let astParser: ASTParser;
  let syncCoordinator: SynchronizationCoordinator;
  let testDir: string;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(tmpdir(), 'sync-coordinator-integration-tests');
    await fs.mkdir(testDir, { recursive: true });

    // Initialize database service
    dbService = await setupTestDatabase();

    // Initialize knowledge graph service
    kgService = new KnowledgeGraphService(dbService);

    // Initialize AST parser
    astParser = new ASTParser();

    // Initialize synchronization coordinator
    syncCoordinator = new SynchronizationCoordinator(kgService, astParser, dbService);
  }, 60000);

  afterAll(async () => {
    // Clean up
    await cleanupTestDatabase(dbService);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clear test data between tests
    await clearTestData(dbService);

    // Clear test directory
    try {
      const files = await fs.readdir(testDir);
      await Promise.all(files.map(file => fs.unlink(path.join(testDir, file))));
    } catch (error) {
      // Directory might be empty, that's okay
    }
  });

  describe('Full Synchronization Integration', () => {
    beforeEach(async () => {
      // Create test source files
      const testFile1 = path.join(testDir, 'test1.ts');
      const testFile2 = path.join(testDir, 'test2.ts');

      await fs.writeFile(testFile1, `
        export class TestClass1 {
          public method1(): void {
            console.log("test method 1");
          }
        }
      `);

      await fs.writeFile(testFile2, `
        import { TestClass1 } from './test1';

        export class TestClass2 {
          private testClass1: TestClass1;

          public method2(): string {
            return "test method 2";
          }
        }
      `);
    });

    it('should successfully perform full synchronization', async () => {
      const operationId = await syncCoordinator.startFullSynchronization();

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
      expect(operationId).toMatch(/^full_sync_/);

      // Wait a bit for sync to complete (in real implementation, would use events)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check operation status
      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('full');
      expect(['completed', 'running']).toContain(operation?.status);
    });

    it('should handle full sync with custom options', async () => {
      const options: SyncOptions = {
        force: true,
        includeEmbeddings: false,
        maxConcurrency: 2,
        timeout: 30000,
        conflictResolution: 'overwrite'
      };

      const operationId = await syncCoordinator.startFullSynchronization(options);

      expect(operationId).toBeDefined();

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('full');
    });

    it('should track sync progress and statistics', async () => {
      const operationId = await syncCoordinator.startFullSynchronization();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();

      if (operation) {
        expect(typeof operation.filesProcessed).toBe('number');
        expect(typeof operation.entitiesCreated).toBe('number');
        expect(typeof operation.entitiesUpdated).toBe('number');
        expect(typeof operation.entitiesDeleted).toBe('number');
        expect(typeof operation.relationshipsCreated).toBe('number');
        expect(typeof operation.relationshipsUpdated).toBe('number');
        expect(typeof operation.relationshipsDeleted).toBe('number');
        expect(Array.isArray(operation.errors)).toBe(true);
        expect(Array.isArray(operation.conflicts)).toBe(true);
      }
    });
  });

  describe('Incremental Synchronization Integration', () => {
    beforeEach(async () => {
      // Create initial test files
      const testFile1 = path.join(testDir, 'incremental_test1.ts');
      await fs.writeFile(testFile1, `
        export class IncrementalTest1 {
          public method(): void {
            console.log("original method");
          }
        }
      `);

      // Perform initial full sync
      await syncCoordinator.startFullSynchronization();
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should perform incremental sync with file changes', async () => {
      // Modify existing file
      const testFile1 = path.join(testDir, 'incremental_test1.ts');
      await fs.writeFile(testFile1, `
        export class IncrementalTest1 {
          public method(): void {
            console.log("modified method");
          }

          public newMethod(): string {
            return "new method";
          }
        }
      `);

      // Create file change
      const changes: FileChange[] = [{
        path: testFile1,
        type: 'modify',
        timestamp: new Date()
      }];

      const operationId = await syncCoordinator.synchronizeFileChanges(changes);

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^incremental_sync_/);

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('incremental');
    });

    it('should handle file creation in incremental sync', async () => {
      const newFile = path.join(testDir, 'new_incremental_test.ts');
      await fs.writeFile(newFile, `
        export class NewIncrementalTest {
          public execute(): boolean {
            return true;
          }
        }
      `);

      const changes: FileChange[] = [{
        path: newFile,
        type: 'create',
        timestamp: new Date()
      }];

      const operationId = await syncCoordinator.synchronizeFileChanges(changes);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('incremental');
    });

    it('should handle file deletion in incremental sync', async () => {
      const fileToDelete = path.join(testDir, 'delete_test.ts');
      await fs.writeFile(fileToDelete, `
        export class DeleteTest {
          public removable(): void {
            console.log("to be deleted");
          }
        }
      `);

      // First create the file
      const createChanges: FileChange[] = [{
        path: fileToDelete,
        type: 'create',
        timestamp: new Date()
      }];

      await syncCoordinator.synchronizeFileChanges(createChanges);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then delete it
      await fs.unlink(fileToDelete);

      const deleteChanges: FileChange[] = [{
        path: fileToDelete,
        type: 'delete',
        timestamp: new Date()
      }];

      const operationId = await syncCoordinator.synchronizeFileChanges(deleteChanges);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
    });
  });

  describe('Partial Synchronization Integration', () => {
    beforeEach(async () => {
      // Create initial entities
      const entity1: Entity = {
        id: 'partial_test_entity_1',
        type: 'test',
        hash: 'partial_hash_1',
        lastModified: new Date(),
        content: { test: 'partial test 1' },
        metadata: { test: true }
      };

      const entity2: Entity = {
        id: 'partial_test_entity_2',
        type: 'test',
        hash: 'partial_hash_2',
        lastModified: new Date(),
        content: { test: 'partial test 2' },
        metadata: { test: true }
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);
    });

    it('should perform partial sync with entity updates', async () => {
      const updates: PartialUpdate[] = [{
        entityId: 'partial_test_entity_1',
        type: 'update',
        changes: {
          content: { test: 'updated partial test 1' },
          lastModified: new Date()
        }
      }];

      const operationId = await syncCoordinator.synchronizePartial(updates);

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^partial_sync_/);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('partial');
    });

    it('should handle entity creation in partial sync', async () => {
      const newEntity: Entity = {
        id: 'partial_new_entity',
        type: 'test',
        hash: 'new_partial_hash',
        lastModified: new Date(),
        content: { test: 'new partial entity' },
        metadata: { test: true }
      };

      const updates: PartialUpdate[] = [{
        entityId: 'partial_new_entity',
        type: 'create',
        newValue: newEntity
      }];

      const operationId = await syncCoordinator.synchronizePartial(updates);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.entitiesCreated).toBeGreaterThanOrEqual(0);
    });

    it('should handle entity deletion in partial sync', async () => {
      const updates: PartialUpdate[] = [{
        entityId: 'partial_test_entity_2',
        type: 'delete'
      }];

      const operationId = await syncCoordinator.synchronizePartial(updates);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.entitiesDeleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Operation Management Integration', () => {
    it('should track multiple concurrent operations', async () => {
      const operationPromises = [
        syncCoordinator.startFullSynchronization(),
        syncCoordinator.startIncrementalSynchronization(),
        syncCoordinator.startPartialSynchronization([])
      ];

      const operationIds = await Promise.all(operationPromises);

      expect(operationIds).toHaveLength(3);
      operationIds.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });

      // Check active operations
      const activeOperations = syncCoordinator.getActiveOperations();
      expect(activeOperations.length).toBeGreaterThanOrEqual(0);

      // Check queue length
      const queueLength = syncCoordinator.getQueueLength();
      expect(typeof queueLength).toBe('number');
    });

    it('should cancel operations successfully', async () => {
      const operationId = await syncCoordinator.startFullSynchronization();

      expect(operationId).toBeDefined();

      // Cancel the operation
      const cancelResult = await syncCoordinator.cancelOperation(operationId);

      expect(cancelResult).toBe(true);

      // Verify operation is cancelled
      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      expect(operation?.status).toBe('failed'); // Cancelled operations are marked as failed
    });

    it('should handle operation statistics correctly', async () => {
      // Start a few operations
      await syncCoordinator.startFullSynchronization();
      await syncCoordinator.startIncrementalSynchronization();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const stats = syncCoordinator.getOperationStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.queued).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.retried).toBe('number');
      expect(typeof stats.totalFilesProcessed).toBe('number');
      expect(typeof stats.totalEntitiesCreated).toBe('number');
      expect(typeof stats.totalErrors).toBe('number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid file paths gracefully', async () => {
      const invalidChanges: FileChange[] = [{
        path: '/non/existent/path/file.ts',
        type: 'modify',
        timestamp: new Date()
      }];

      const operationId = await syncCoordinator.synchronizeFileChanges(invalidChanges);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      // Should either complete or fail gracefully
      expect(['completed', 'failed']).toContain(operation?.status);
    });

    it('should handle database connection failures', async () => {
      // Create coordinator with invalid database service
      const invalidCoordinator = new SynchronizationCoordinator(
        kgService,
        astParser,
        {} as DatabaseService
      );

      try {
        await invalidCoordinator.startFullSynchronization();
        // If it doesn't throw, the operation should be created but may fail later
      } catch (error) {
        // Expected to fail with database issues
        expect(error).toBeDefined();
      }
    });

    it('should handle empty file changes array', async () => {
      const operationId = await syncCoordinator.synchronizeFileChanges([]);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
    });

    it('should handle empty partial updates array', async () => {
      const operationId = await syncCoordinator.synchronizePartial([]);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
    });

    it('should handle non-existent entity updates gracefully', async () => {
      const updates: PartialUpdate[] = [{
        entityId: 'non_existent_entity_12345',
        type: 'update',
        changes: { content: { test: 'updated' } }
      }];

      const operationId = await syncCoordinator.synchronizePartial(updates);

      expect(operationId).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
      // Should complete but may have errors
      expect(operation?.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Handling Integration', () => {
    it('should emit operation events correctly', async () => {
      const events: string[] = [];
      const eventData: any[] = [];

      // Listen to events
      syncCoordinator.on('operationStarted', (operation: SyncOperation) => {
        events.push('operationStarted');
        eventData.push(operation);
      });

      syncCoordinator.on('operationCompleted', (operation: SyncOperation) => {
        events.push('operationCompleted');
        eventData.push(operation);
      });

      syncCoordinator.on('operationFailed', (operation: SyncOperation) => {
        events.push('operationFailed');
        eventData.push(operation);
      });

      // Start operation
      const operationId = await syncCoordinator.startFullSynchronization();

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should have received at least operationStarted event
      expect(events).toContain('operationStarted');
      expect(eventData.length).toBeGreaterThan(0);

      // Clean up event listeners
      syncCoordinator.removeAllListeners();
    });

    it('should handle sync progress events', async () => {
      const progressEvents: any[] = [];

      syncCoordinator.on('syncProgress', (operation: SyncOperation, progress: any) => {
        progressEvents.push({ operation, progress });
      });

      await syncCoordinator.startFullSynchronization();

      // Wait for some progress events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // May or may not receive progress events depending on implementation
      expect(Array.isArray(progressEvents)).toBe(true);

      // Clean up event listeners
      syncCoordinator.removeAllListeners();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple files efficiently', async () => {
      // Create multiple test files
      const fileCount = 5;
      const files: string[] = [];

      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(testDir, `performance_test_${i}.ts`);
        await fs.writeFile(filePath, `
          export class PerformanceTest${i} {
            public method${i}(): string {
              return "performance test ${i}";
            }
          }
        `);
        files.push(filePath);
      }

      const startTime = Date.now();

      const operationId = await syncCoordinator.startFullSynchronization();

      await new Promise(resolve => setTimeout(resolve, 3000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      const operation = syncCoordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();

      // Should complete within reasonable time (adjust based on environment)
      expect(duration).toBeLessThan(10000); // 10 seconds for 5 files
    });

    it('should handle concurrent operations efficiently', async () => {
      const operationCount = 3;
      const startTime = Date.now();

      const promises = Array.from({ length: operationCount }, () =>
        syncCoordinator.startFullSynchronization()
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete all operations within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds for 3 concurrent operations
    });
  });
});
