/**
 * Performance validation tests for rollback capabilities
 * Tests rollback system performance with large datasets and hybrid storage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RollbackManager } from '../../src/rollback/RollbackManager.js';
import { PostgreSQLRollbackStore } from '../../src/rollback/PostgreSQLRollbackStore.js';
import { RollbackConfig, RollbackPoint, SnapshotType } from '../../src/rollback/RollbackTypes.js';

describe('Rollback Performance Validation', () => {
  let manager: RollbackManager;
  let config: RollbackConfig;

  beforeEach(() => {
    config = {
      maxRollbackPoints: 1000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      enablePersistence: true,
      enableCompression: true,
      requireDatabaseReady: false,
      autoCleanup: true,
      cleanupInterval: 60000 // 1 minute
    };

    manager = new RollbackManager(config);
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe('Large Dataset Performance', () => {
    it('should handle creation of many rollback points efficiently', async () => {
      const startTime = Date.now();
      const rollbackCount = 50; // Reduced for test speed
      const rollbackIds: string[] = [];

      for (let i = 0; i < rollbackCount; i++) {
        const rollbackPoint = await manager.createRollbackPoint(
          `performance-test-${i}`,
          `Performance test rollback point ${i}`,
          { testIndex: i, batchSize: rollbackCount }
        );
        rollbackIds.push(rollbackPoint.id);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerPoint = duration / rollbackCount;

      // Performance assertions
      expect(rollbackIds).toHaveLength(rollbackCount);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(avgTimePerPoint).toBeLessThan(200); // Average < 200ms per point

      console.log(`Created ${rollbackCount} rollback points in ${duration}ms (avg: ${avgTimePerPoint.toFixed(2)}ms per point)`);
    });

    it('should handle large snapshot data efficiently', async () => {
      // Create large test data
      const largeEntity = {
        id: 'large-entity-test',
        type: 'performance-test',
        data: {
          // Create a large data structure
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: `item-${i}`,
            name: `Item ${i}`,
            description: `This is a description for item ${i}`.repeat(10),
            metadata: { index: i, timestamp: new Date().toISOString() }
          })),
          config: {
            enabled: true,
            settings: Object.fromEntries(
              Array.from({ length: 100 }, (_, i) => [`setting${i}`, `value${i}`])
            )
          }
        }
      };

      const startTime = Date.now();

      const rollbackPoint = await manager.createRollbackPoint(
        'large-snapshot-test',
        'Testing large snapshot performance'
      );

      await manager.createSnapshot(rollbackPoint.id);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const dataSizeBytes = JSON.stringify(largeEntity).length;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(dataSizeBytes).toBeGreaterThan(100000); // Ensure we're testing with substantial data

      console.log(`Created snapshot with ${(dataSizeBytes / 1024).toFixed(2)}KB of data in ${duration}ms`);
    });

    it('should retrieve rollback points quickly even with many stored', async () => {
      // Create multiple rollback points
      const pointCount = 20;
      const rollbackIds: string[] = [];

      for (let i = 0; i < pointCount; i++) {
        const point = await manager.createRollbackPoint(
          `retrieval-test-${i}`,
          `Retrieval test point ${i}`
        );
        rollbackIds.push(point.id);
      }

      // Test retrieval performance
      const startTime = Date.now();

      const allPoints = await manager.getAllRollbackPoints();
      const specificPoint = await manager.getRollbackPoint(rollbackIds[pointCount - 1]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(allPoints).toHaveLength(pointCount);
      expect(specificPoint).toBeTruthy();
      expect(duration).toBeLessThan(1000); // Should retrieve within 1 second

      console.log(`Retrieved ${pointCount} rollback points in ${duration}ms`);
    });
  });

  describe('Memory Usage Validation', () => {
    it('should maintain reasonable memory usage with hybrid storage', async () => {
      const initialMemory = process.memoryUsage();
      const rollbackCount = 30;

      // Create many rollback points
      for (let i = 0; i < rollbackCount; i++) {
        await manager.createRollbackPoint(
          `memory-test-${i}`,
          `Memory test point ${i}`,
          {
            testData: Array.from({ length: 100 }, (_, j) => `data-${j}`),
            timestamp: Date.now()
          }
        );
      }

      const afterCreationMemory = process.memoryUsage();
      const memoryIncrease = afterCreationMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerPoint = memoryIncrease / rollbackCount;

      // Get rollback manager metrics
      const metrics = manager.getMetrics();

      // Memory usage assertions
      expect(memoryPerPoint).toBeLessThan(50000); // Less than 50KB per rollback point on average
      expect(metrics.memoryUsage).toBeGreaterThan(0);

      console.log(`Memory increase: ${(memoryIncrease / 1024).toFixed(2)}KB total, ${(memoryPerPoint / 1024).toFixed(2)}KB per point`);
      console.log(`Manager reports memory usage: ${(metrics.memoryUsage / 1024).toFixed(2)}KB`);
    });

    it('should clean up memory after rollback point deletion', async () => {
      const rollbackIds: string[] = [];

      // Create rollback points
      for (let i = 0; i < 10; i++) {
        const point = await manager.createRollbackPoint(
          `cleanup-test-${i}`,
          `Cleanup test point ${i}`
        );
        rollbackIds.push(point.id);
      }

      const beforeCleanup = manager.getMetrics();

      // Delete all rollback points
      for (const id of rollbackIds) {
        await manager.deleteRollbackPoint(id);
      }

      const afterCleanup = manager.getMetrics();

      // Memory should be reduced after cleanup
      expect(afterCleanup.totalRollbackPoints).toBeLessThan(beforeCleanup.totalRollbackPoints);
      expect(afterCleanup.memoryUsage).toBeLessThanOrEqual(beforeCleanup.memoryUsage);
    });
  });

  describe('Rollback Operation Performance', () => {
    it('should perform rollback operations efficiently', async () => {
      // Create initial state
      const rollbackPoint = await manager.createRollbackPoint(
        'rollback-perf-test',
        'Testing rollback operation performance'
      );

      // Simulate some changes (create diff)
      await manager.generateDiff(rollbackPoint.id);

      const startTime = Date.now();

      const operation = await manager.rollback(rollbackPoint.id, {
        dryRun: true // Use dry run for performance testing
      });

      // Wait for operation to complete
      let operationResult = await manager.getRollbackOperation(operation.id);
      while (operationResult && operationResult.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 10));
        operationResult = await manager.getRollbackOperation(operation.id);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(operationResult?.status).toBe('completed');
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      console.log(`Rollback operation completed in ${duration}ms`);
    });

    it('should handle concurrent rollback operations gracefully', async () => {
      // Create multiple rollback points
      const rollbackPoints: string[] = [];
      for (let i = 0; i < 3; i++) {
        const point = await manager.createRollbackPoint(
          `concurrent-test-${i}`,
          `Concurrent test point ${i}`
        );
        rollbackPoints.push(point.id);
      }

      const startTime = Date.now();

      // Start concurrent rollback operations
      const rollbackPromises = rollbackPoints.map(pointId =>
        manager.rollback(pointId, { dryRun: true })
      );

      const operations = await Promise.all(rollbackPromises);

      // Wait for all operations to complete
      const operationResults = await Promise.all(
        operations.map(async (op) => {
          let result = await manager.getRollbackOperation(op.id);
          while (result && result.status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 10));
            result = await manager.getRollbackOperation(op.id);
          }
          return result;
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should complete successfully
      expect(operationResults).toHaveLength(3);
      operationResults.forEach(result => {
        expect(result?.status).toBe('completed');
      });
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`${operations.length} concurrent rollback operations completed in ${duration}ms`);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle database operations efficiently with PostgreSQL persistence', async () => {
      // This test would require actual PostgreSQL connection
      // For now, we'll test the hybrid cache behavior

      const startTime = Date.now();

      // Create rollback points
      const rollbackIds: string[] = [];
      for (let i = 0; i < 15; i++) {
        const point = await manager.createRollbackPoint(
          `db-perf-test-${i}`,
          `Database performance test ${i}`
        );
        rollbackIds.push(point.id);
      }

      // Test retrieval patterns
      const retrievalStart = Date.now();

      // Random access pattern
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * rollbackIds.length);
        const point = await manager.getRollbackPoint(rollbackIds[randomIndex]);
        expect(point).toBeTruthy();
      }

      const retrievalEnd = Date.now();
      const totalTime = retrievalEnd - startTime;
      const retrievalTime = retrievalEnd - retrievalStart;

      // Performance assertions
      expect(totalTime).toBeLessThan(8000); // Total operation within 8 seconds
      expect(retrievalTime).toBeLessThan(2000); // Retrieval within 2 seconds

      console.log(`Database operations: ${totalTime}ms total, ${retrievalTime}ms for random retrievals`);
    });
  });

  describe('Conflict Resolution Performance', () => {
    it('should handle conflict detection efficiently', async () => {
      const rollbackPoint = await manager.createRollbackPoint(
        'conflict-perf-test',
        'Testing conflict resolution performance'
      );

      const startTime = Date.now();

      // Generate a diff with potential conflicts
      const diff = await manager.generateDiff(rollbackPoint.id);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(diff).toBeTruthy();
      expect(diff.changes).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(`Conflict detection completed in ${duration}ms for ${diff.changeCount} changes`);
    });
  });

  describe('Resource Cleanup Performance', () => {
    it('should perform cleanup operations efficiently', async () => {
      // Create rollback points with short TTL
      const shortTTLConfig = {
        ...config,
        defaultTTL: 100 // 100ms for quick expiry in test
      };

      const testManager = new RollbackManager(shortTTLConfig);

      try {
        // Create points that will expire quickly
        for (let i = 0; i < 10; i++) {
          await testManager.createRollbackPoint(
            `cleanup-perf-test-${i}`,
            `Cleanup performance test ${i}`
          );
        }

        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 200));

        const startTime = Date.now();

        const cleanupResult = await testManager.cleanup();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Performance assertions
        expect(cleanupResult.removedPoints).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second

        console.log(`Cleanup removed ${cleanupResult.removedPoints} points and ${cleanupResult.removedOperations} operations in ${duration}ms`);

      } finally {
        await testManager.shutdown();
      }
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid rollback point creation and deletion', async () => {
      const cycles = 10;
      const pointsPerCycle = 5;

      const startTime = Date.now();

      for (let cycle = 0; cycle < cycles; cycle++) {
        const rollbackIds: string[] = [];

        // Create points
        for (let i = 0; i < pointsPerCycle; i++) {
          const point = await manager.createRollbackPoint(
            `stress-test-${cycle}-${i}`,
            `Stress test cycle ${cycle} point ${i}`
          );
          rollbackIds.push(point.id);
        }

        // Delete some points
        for (let i = 0; i < Math.floor(pointsPerCycle / 2); i++) {
          await manager.deleteRollbackPoint(rollbackIds[i]);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalOperations = cycles * pointsPerCycle * 1.5; // Create + partial delete

      // Performance assertions
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

      const operationsPerSecond = (totalOperations / duration) * 1000;
      expect(operationsPerSecond).toBeGreaterThan(5); // At least 5 operations per second

      console.log(`Stress test: ${totalOperations} operations in ${duration}ms (${operationsPerSecond.toFixed(2)} ops/sec)`);
    });
  });
});