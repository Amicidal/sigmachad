/**
 * @file TestHistory.test.ts
 * @description Unit tests for TestHistory service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestHistory } from '../src/temporal/TestHistory.js';
import {
  TestExecutionRecord,
  TestConfiguration,
  TestStatus,
  TestType,
  TestMetadata
} from '../src/temporal/TestTypes.js';

describe('TestHistory', () => {
  let history: TestHistory;
  let mockConfig: TestConfiguration;

  beforeEach(() => {
    mockConfig = {
      maxTrendDataPoints: 100,
      flakinessThreshold: 0.1,
      coverageChangeThreshold: 0.05,
      performanceRegressionThreshold: 1.5,
      obsolescenceDetectionEnabled: true,
      trendAnalysisPeriod: 'weekly',
      batchSize: 50
    };

    history = new TestHistory(mockConfig);
  });

  describe('storeExecution', () => {
    it('should store execution records', async () => {
      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        duration: 100,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution);

      const executions = await history.getExecutionHistory('test_1', 'entity_1');
      expect(executions).toHaveLength(1);
      expect(executions[0].executionId).toBe('exec_1');
    });

    it('should maintain chronological order', async () => {
      const execution1: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 2000),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      const execution2: TestExecutionRecord = {
        executionId: 'exec_2',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 1000),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution2);
      await history.storeExecution(execution1);

      const executions = await history.getExecutionHistory('test_1', 'entity_1');
      expect(executions[0].executionId).toBe('exec_2'); // Newest first
      expect(executions[1].executionId).toBe('exec_1');
    });
  });

  describe('createSnapshot', () => {
    it('should create historical snapshots', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      const snapshot = await history.createSnapshot('test_1', 'entity_1', metadata);

      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.testId).toBe('test_1');
      expect(snapshot.entityId).toBe('entity_1');
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.metadata).toBe(metadata);
      expect(snapshot.metrics).toBeDefined();
    });

    it('should include execution metrics in snapshots', async () => {
      // First add some executions
      const executions: TestExecutionRecord[] = [];
      for (let i = 0; i < 5; i++) {
        const execution: TestExecutionRecord = {
          executionId: `exec_${i}`,
          testId: 'test_1',
          entityId: 'entity_1',
          suiteId: 'suite_1',
          timestamp: new Date(Date.now() - i * 1000),
          status: i % 2 === 0 ? 'pass' as TestStatus : 'fail' as TestStatus,
          duration: 100 + i * 10,
          metadata: {
            testType: 'unit' as TestType,
            suiteId: 'suite_1',
            confidence: 0.9
          }
        };
        await history.storeExecution(execution);
        executions.push(execution);
      }

      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      const snapshot = await history.createSnapshot('test_1', 'entity_1', metadata);

      expect(snapshot.metrics.totalExecutions).toBe(5);
      expect(snapshot.metrics.passedExecutions).toBe(3);
      expect(snapshot.metrics.failedExecutions).toBe(2);
      expect(snapshot.metrics.successRate).toBeCloseTo(0.6);
    });
  });

  describe('queryHistory', () => {
    it('should query historical data with filters', async () => {
      // Add some test data
      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution);

      const result = await history.queryHistory({
        testId: 'test_1',
        entityId: 'entity_1',
        limit: 10
      });

      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.events).toBeDefined();
      expect(result.relationships).toBeDefined();
      expect(result.snapshots).toBeDefined();
    });

    it('should filter by date range', async () => {
      const oldExecution: TestExecutionRecord = {
        executionId: 'exec_old',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date('2023-01-01'),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      const newExecution: TestExecutionRecord = {
        executionId: 'exec_new',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(oldExecution);
      await history.storeExecution(newExecution);

      const result = await history.queryHistory({
        testId: 'test_1',
        startDate: new Date('2024-01-01')
      });

      expect(result.totalCount).toBe(1);
    });
  });

  describe('getSnapshots', () => {
    it('should retrieve snapshots for time period', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Create snapshot within range
      await history.createSnapshot('test_1', 'entity_1', metadata);

      const snapshots = await history.getSnapshots('test_1', 'entity_1', startDate, endDate);
      expect(snapshots).toHaveLength(1);
    });

    it('should filter snapshots by date range', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await history.createSnapshot('test_1', 'entity_1', metadata);

      const futureStart = new Date('2025-01-01');
      const futureEnd = new Date('2025-12-31');

      const snapshots = await history.getSnapshots('test_1', 'entity_1', futureStart, futureEnd);
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old data according to retention policy', async () => {
      const oldExecution: TestExecutionRecord = {
        executionId: 'exec_old',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days old
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      const newExecution: TestExecutionRecord = {
        executionId: 'exec_new',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(oldExecution);
      await history.storeExecution(newExecution);

      const deletedCount = await history.cleanup(90); // 90 day retention

      expect(deletedCount).toBeGreaterThan(0);

      const remaining = await history.getExecutionHistory('test_1', 'entity_1');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].executionId).toBe('exec_new');
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution);

      const jsonData = await history.exportData('test_1', 'entity_1', 'json');
      const parsed = JSON.parse(jsonData);

      expect(parsed.executions).toBeDefined();
      expect(parsed.executions).toHaveLength(1);
      expect(parsed.executions[0].executionId).toBe('exec_1');
      expect(parsed.exportTimestamp).toBeDefined();
    });

    it('should export data in CSV format', async () => {
      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        duration: 100,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution);

      const csvData = await history.exportData('test_1', 'entity_1', 'csv');

      expect(csvData).toContain('timestamp,testId,entityId,type,status,duration,coverage');
      expect(csvData).toContain('exec_1');
      expect(csvData).toContain('test_1');
      expect(csvData).toContain('entity_1');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        history.exportData('test_1', 'entity_1', 'xml' as any)
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('importData', () => {
    it('should import JSON data', async () => {
      const execution = {
        executionId: 'imported_exec',
        testId: 'imported_test',
        entityId: 'imported_entity',
        suiteId: 'imported_suite',
        timestamp: new Date().toISOString(),
        status: 'pass',
        metadata: {
          testType: 'unit',
          suiteId: 'imported_suite',
          confidence: 0.9
        }
      };

      const jsonData = JSON.stringify({
        executions: [execution]
      });

      const importedCount = await history.importData(jsonData, 'json');

      expect(importedCount).toBe(1);

      const executions = await history.getExecutionHistory('imported_test', 'imported_entity');
      expect(executions).toHaveLength(1);
      expect(executions[0].executionId).toBe('imported_exec');
    });

    it('should throw error for invalid JSON', async () => {
      const invalidJson = '{ invalid json }';

      await expect(
        history.importData(invalidJson, 'json')
      ).rejects.toThrow('Failed to parse json data');
    });
  });

  describe('getStatistics', () => {
    it('should calculate comprehensive statistics', async () => {
      // Add some test data
      for (let i = 0; i < 10; i++) {
        const execution: TestExecutionRecord = {
          executionId: `exec_${i}`,
          testId: 'test_1',
          entityId: 'entity_1',
          suiteId: 'suite_1',
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          status: 'pass' as TestStatus,
          metadata: {
            testType: 'unit' as TestType,
            suiteId: 'suite_1',
            confidence: 0.9
          }
        };
        await history.storeExecution(execution);
      }

      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await history.createSnapshot('test_1', 'entity_1', metadata);

      const stats = await history.getStatistics();

      expect(stats.totalExecutions).toBe(10);
      expect(stats.totalSnapshots).toBe(1);
      expect(stats.oldestRecord).toBeDefined();
      expect(stats.newestRecord).toBeDefined();
      expect(stats.averageExecutionsPerDay).toBeGreaterThan(0);
      expect(stats.dataSize).toBeGreaterThan(0);
      expect(stats.retentionCompliance).toBe(true);
    });

    it('should return zeros for empty history', async () => {
      const stats = await history.getStatistics();

      expect(stats.totalExecutions).toBe(0);
      expect(stats.totalSnapshots).toBe(0);
      expect(stats.averageExecutionsPerDay).toBe(0);
    });
  });

  describe('getExecutionHistory', () => {
    it('should limit results', async () => {
      // Add many executions
      for (let i = 0; i < 20; i++) {
        const execution: TestExecutionRecord = {
          executionId: `exec_${i}`,
          testId: 'test_1',
          entityId: 'entity_1',
          suiteId: 'suite_1',
          timestamp: new Date(Date.now() - i * 1000),
          status: 'pass' as TestStatus,
          metadata: {
            testType: 'unit' as TestType,
            suiteId: 'suite_1',
            confidence: 0.9
          }
        };
        await history.storeExecution(execution);
      }

      const executions = await history.getExecutionHistory('test_1', 'entity_1', 10);
      expect(executions).toHaveLength(10);
    });

    it('should return executions in reverse chronological order', async () => {
      const execution1: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 2000),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      const execution2: TestExecutionRecord = {
        executionId: 'exec_2',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 1000),
        status: 'pass' as TestStatus,
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await history.storeExecution(execution1);
      await history.storeExecution(execution2);

      const executions = await history.getExecutionHistory('test_1', 'entity_1');
      expect(executions[0].executionId).toBe('exec_2'); // Newest first
      expect(executions[1].executionId).toBe('exec_1');
    });
  });
});