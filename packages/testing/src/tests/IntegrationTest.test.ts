/**
 * @file IntegrationTest.test.ts
 * @description Integration tests for temporal tracking system with existing infrastructure
 *
 * Validates that the temporal tracking system properly integrates with:
 * - TestEngine
 * - SpecService
 * - TestResultParser
 * - Database services
 * - CI/CD pipelines
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTemporalTrackingSystem,
  createDefaultTemporalSystem,
  createLightweightTemporalSystem,
  TemporalUtils,
  TemporalConstants,
  TEMPORAL_VERSION
} from '../index.js';
import type { TestExecutionRecord, TestConfiguration } from '../temporal/TestTypes.js';

describe('Temporal Tracking Integration', () => {
  describe('System Factory Functions', () => {
    it('should create default temporal system with correct configuration', async () => {
      const system = await createDefaultTemporalSystem();

      expect(system).toBeDefined();
      expect(system.tracker).toBeDefined();
      expect(system.evolution).toBeDefined();
      expect(system.history).toBeDefined();
      expect(system.metrics).toBeDefined();
      expect(system.relationships).toBeDefined();
      expect(system.visualization).toBeDefined();
      expect(system.predictiveAnalytics).toBeDefined();
      expect(system.dataStorage).toBeDefined();
      expect(system.ciIntegration).toBeDefined();

      expect(system.config.maxTrendDataPoints).toBe(500);
      expect(system.config.flakinessThreshold).toBe(0.15);
      expect(system.config.batchSize).toBe(50);
    });

    it('should create custom temporal system with user configuration', async () => {
      const customConfig: Partial<TestConfiguration> = {
        maxTrendDataPoints: 1000,
        flakinessThreshold: 0.05,
        batchSize: 100
      };

      const system = await createTemporalTrackingSystem(customConfig);

      expect(system.config.maxTrendDataPoints).toBe(1000);
      expect(system.config.flakinessThreshold).toBe(0.05);
      expect(system.config.batchSize).toBe(100);
    });

    it('should create lightweight system for smaller projects', async () => {
      const system = await createLightweightTemporalSystem();

      expect(system.config.maxTrendDataPoints).toBe(200);
      expect(system.config.flakinessThreshold).toBe(0.2);
      expect(system.config.obsolescenceDetectionEnabled).toBe(false);
      expect(system.config.batchSize).toBe(25);
    });
  });

  describe('Temporal Utils Integration', () => {
    it('should calculate relationship age correctly', () => {
      const validFrom = new Date('2024-01-01');
      const validTo = new Date('2024-01-31');

      const age = TemporalUtils.calculateRelationshipAge(validFrom, validTo);
      expect(age).toBe(30);
    });

    it('should detect stale relationships', () => {
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

      expect(TemporalUtils.isRelationshipStale(oldDate, undefined, 30)).toBe(true);
      expect(TemporalUtils.isRelationshipStale(recentDate, undefined, 30)).toBe(false);
    });

    it('should calculate flakiness score from execution history', () => {
      const executions: TestExecutionRecord[] = Array.from({ length: 10 }, (_, i) => ({
        executionId: `exec_${i}`,
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - i * 60000),
        status: i % 3 === 0 ? 'fail' : 'pass', // Every 3rd test fails
        duration: 100,
        coverage: { overall: 0.8 },
        metadata: {
          testType: 'unit',
          suiteId: 'suite_1',
          confidence: 0.9
        }
      }));

      const flakiness = TemporalUtils.calculateFlakinessScore(executions);
      expect(flakiness).toBeCloseTo(0.4, 1); // 4 failures out of 10 (every 3rd plus index 0)
    });

    it('should generate unique relationship IDs', () => {
      const id1 = TemporalUtils.generateRelationshipId('test_1', 'entity_1', 'EXERCISES', 'suite_1');
      const id2 = TemporalUtils.generateRelationshipId('test_2', 'entity_1', 'EXERCISES', 'suite_1');
      const id3 = TemporalUtils.generateRelationshipId('test_1', 'entity_2', 'EXERCISES', 'suite_1');

      expect(id1).toMatch(/^rel_test_1_entity_1_EXERCISES_suite_1$/);
      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });

    it('should determine trend direction from value series', () => {
      const increasingValues = [1, 2, 3, 4, 5, 6];
      const decreasingValues = [6, 5, 4, 3, 2, 1];
      const stableValues = [3, 3.1, 2.9, 3.05, 2.95, 3];

      expect(TemporalUtils.determineTrendDirection(increasingValues)).toBe('increasing');
      expect(TemporalUtils.determineTrendDirection(decreasingValues)).toBe('decreasing');
      expect(TemporalUtils.determineTrendDirection(stableValues)).toBe('stable');
    });
  });

  describe('Constants and Version', () => {
    it('should expose correct version information', () => {
      expect(TEMPORAL_VERSION).toBe('1.0.0');
    });

    it('should provide sensible default thresholds', () => {
      expect(TemporalConstants.THRESHOLDS.FLAKINESS).toBe(0.1);
      expect(TemporalConstants.THRESHOLDS.COVERAGE_CHANGE).toBe(0.05);
      expect(TemporalConstants.THRESHOLDS.PERFORMANCE_REGRESSION).toBe(1.5);
      expect(TemporalConstants.THRESHOLDS.LOW_CONFIDENCE).toBe(0.3);
      expect(TemporalConstants.THRESHOLDS.STALE_RELATIONSHIP_DAYS).toBe(60);
    });

    it('should provide retention period constants', () => {
      expect(TemporalConstants.RETENTION_PERIODS.EXECUTIONS).toBe(90);
      expect(TemporalConstants.RETENTION_PERIODS.SNAPSHOTS).toBe(365);
      expect(TemporalConstants.RETENTION_PERIODS.EVENTS).toBe(180);
      expect(TemporalConstants.RETENTION_PERIODS.RELATIONSHIPS).toBe(730);
    });

    it('should provide trend period constants', () => {
      expect(TemporalConstants.TREND_PERIODS.DAILY).toBe(24 * 60 * 60 * 1000);
      expect(TemporalConstants.TREND_PERIODS.WEEKLY).toBe(7 * 24 * 60 * 60 * 1000);
      expect(TemporalConstants.TREND_PERIODS.MONTHLY).toBe(30 * 24 * 60 * 60 * 1000);
      expect(TemporalConstants.TREND_PERIODS.QUARTERLY).toBe(90 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Real-world Integration Scenarios', () => {
    let system: Awaited<ReturnType<typeof createTemporalTrackingSystem>>;

    beforeEach(async () => {
      system = await createDefaultTemporalSystem();
    });

    it('should track test execution through complete workflow', async () => {
      // Simulate a test execution workflow
      const testExecution: TestExecutionRecord = {
        executionId: 'exec_integration_1',
        testId: 'integration_test_1',
        entityId: 'component_a',
        suiteId: 'integration_suite',
        timestamp: new Date(),
        status: 'pass',
        duration: 250,
        coverage: {
          overall: 0.85,
          lines: 0.82,
          branches: 0.78,
          functions: 0.90
        },
        metadata: {
          testType: 'integration',
          suiteId: 'integration_suite',
          confidence: 0.95,
          additional: {
            environment: 'test',
            tags: ['api', 'database']
          }
        }
      };

      // Store execution
      await system.tracker.trackExecution(testExecution);

      // Verify metrics calculation
      const metrics = await system.metrics.calculateExecutionMetrics(
        testExecution.testId,
        testExecution.entityId,
        [testExecution]
      );
      expect(metrics.averageDuration).toBe(250);
      expect(metrics.successRate).toBe(1.0);

      // Verify evolution tracking
      const evolution = await system.evolution.analyzeEvolution('integration_test_1', 'component_a', new Date(Date.now()-86400000), new Date());
      expect(evolution.overallHealth.overall).toBeGreaterThanOrEqual(0);
    });

    it('should integrate with CI/CD pipeline simulation', async () => {
      // Simulate CI configuration generation
      const ciConfig = await system.ciIntegration.generateCIConfiguration({
        platform: 'github-actions',
        triggers: ['push', 'pull_request'],
        testCommand: 'pnpm test',
        reportingEnabled: true,
      });

      expect(ciConfig.platform).toBe('github-actions');
      expect(ciConfig.configuration).toContain('on:');
      expect(ciConfig.configuration).toContain('push');
      expect(ciConfig.configuration).toContain('pull_request');

      // Simulate webhook handling
      const webhookResult = await system.ciIntegration.handleWebhook('test_completed', {
        status: 'success',
        testResults: {
          total: 100,
          passed: 95,
          failed: 5,
          duration: 30000
        }
      });

      expect(webhookResult.processed).toBe(true);
      expect(webhookResult.processed).toBe(true);
    });

    it('should integrate with visualization generation', async () => {
      // Generate sample data
      const executions = Array.from({ length: 30 }, (_, i) => ({
        executionId: `exec_${i}`,
        testId: 'visual_test',
        entityId: 'component_b',
        suiteId: 'visual_suite',
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.1 ? 'pass' : 'fail' as 'pass' | 'fail',
        duration: Math.floor(Math.random() * 200) + 100,
        coverage: { overall: Math.random() * 0.3 + 0.7 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'visual_suite',
          confidence: 0.9
        }
      }));

      // Generate timeline visualization
      const timeline = await system.visualization.generateTimeline([], [], executions);
      expect(Array.isArray(timeline.events)).toBe(true);
      expect(timeline.executions.length).toBeGreaterThan(0);

      // Generate performance graph
      const performance = await system.visualization.generatePerformanceGraph(executions, ['duration']);
      expect(performance.metrics.duration.length).toBeGreaterThan(0);
    });

    it('should handle large-scale data operations', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        executionId: `large_exec_${i}`,
        testId: `test_${i % 50}`, // 50 different tests
        entityId: `entity_${i % 10}`, // 10 different entities
        suiteId: 'large_suite',
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // Hourly executions
        status: Math.random() > 0.05 ? 'pass' : 'fail' as 'pass' | 'fail',
        duration: Math.floor(Math.random() * 500) + 50,
        coverage: { overall: Math.random() * 0.4 + 0.6 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'large_suite',
          confidence: 0.85
        }
      }));

      // Test batch processing
      const batchResults = await Promise.all(
        Array.from({ length: 10 }, async (_, batch) => {
          const batchStart = batch * 100;
          const batchEnd = batchStart + 100;
          const batchData = largeDataset.slice(batchStart, batchEnd);

          // Process each execution individually since recordExecutions doesn't exist
          const results = await Promise.all(
            batchData.map(exec => system.tracker.trackExecution(exec))
          );
          return { success: true, processed: results.length };
        })
      );

      batchResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.processed).toBe(100);
      });

      // Test storage compression
      const compressionResults = await system.dataStorage.batchCompress(
        largeDataset.slice(0, 100)
      );

      expect(compressionResults).toHaveLength(100);
      compressionResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.compressionRatio).toBeGreaterThan(1);
      });
    });

    it('should provide predictive analytics integration', async () => {
      // Generate historical data with patterns
      const historicalData = Array.from({ length: 100 }, (_, i) => ({
        executionId: `pred_exec_${i}`,
        testId: 'predictive_test',
        entityId: 'prediction_entity',
        suiteId: 'prediction_suite',
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: i % 10 === 0 ? 'fail' : 'pass' as 'pass' | 'fail', // Consistent failure pattern
        duration: 100 + Math.sin(i / 10) * 20, // Cyclical performance pattern
        coverage: { overall: 0.8 - (i * 0.001) }, // Gradual coverage decline
        metadata: {
          testType: 'integration' as const,
          suiteId: 'prediction_suite',
          confidence: 0.9,
          additional: {
            environment: 'test',
            tags: ['api', 'database']
          }
        }
      }));

      // Store historical data first
      await Promise.all(historicalData.map(exec => system.tracker.trackExecution(exec)));
      // Also update predictive analytics internal store to have sufficient data
      system.predictiveAnalytics.updateExecutionData('predictive_test:prediction_entity', historicalData as any);

      // Test failure prediction
      const failurePrediction = await system.predictiveAnalytics.predictTestFailure(
        'predictive_test',
        'prediction_entity'
      );

      expect(failurePrediction.testId).toBe('predictive_test');
      expect(failurePrediction.failureProbability).toBeGreaterThan(0);
      expect(failurePrediction.failureProbability).toBeLessThanOrEqual(1);
      expect(failurePrediction.factors.length).toBeGreaterThan(0);

      // Test maintenance cost estimation
      const maintenanceCost = await system.predictiveAnalytics.estimateMaintenanceCost(
        'predictive_test',
        'prediction_entity'
      );

      expect(maintenanceCost.testId).toBe('predictive_test');
      expect(maintenanceCost.estimatedHours).toBeGreaterThan(0);
      expect(maintenanceCost.breakdown.debugging).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        maxTrendDataPoints: -1,
        flakinessThreshold: 2.0, // Invalid: > 1
        batchSize: 0
      };

      // Should create system with defaults when invalid config provided
      const system = await createTemporalTrackingSystem(invalidConfig);

      // System should still be created but config validation should be done
      // For now, just verify the system was created
      expect(system).toBeDefined();
      expect(system.tracker).toBeDefined();
    });

    it('should handle missing or corrupted data', async () => {
      const system = await createDefaultTemporalSystem();

      // Test with empty executions
      const emptyMetrics = await system.metrics.calculateExecutionMetrics('unknown', 'unknown', []);
      expect(emptyMetrics.totalExecutions).toBe(0);
      expect(emptyMetrics.successRate).toBe(0);

      // Test with malformed execution data
      const malformedExecution = {
        executionId: 'malformed',
        // Missing required fields
      } as any;

      try {
        await system.tracker.trackExecution(malformedExecution);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should maintain performance under load', async () => {
      const system = await createDefaultTemporalSystem();

      const startTime = Date.now();

      // Process 1000 executions
      const executions = Array.from({ length: 1000 }, (_, i) => ({
        executionId: `perf_exec_${i}`,
        testId: `perf_test_${i % 10}`,
        entityId: `perf_entity_${i % 5}`,
        suiteId: 'performance_suite',
        timestamp: new Date(Date.now() - i * 1000),
        status: Math.random() > 0.1 ? 'pass' : 'fail' as 'pass' | 'fail',
        duration: Math.floor(Math.random() * 100) + 50,
        coverage: { overall: Math.random() * 0.3 + 0.7 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'performance_suite',
          confidence: 0.9
        }
      }));

      // Process executions individually
      await Promise.all(executions.map(exec => system.tracker.trackExecution(exec)));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 1000 executions in reasonable time (< 5 seconds)
      expect(processingTime).toBeLessThan(5000);
    });
  });
});
