/**
 * @file SystemIntegration.test.ts
 * @description Simplified integration tests for temporal tracking system
 *
 * Focuses on key integration points and verifies the system works correctly
 * with existing infrastructure components.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTemporalTrackingSystem,
  createDefaultTemporalSystem,
  TemporalUtils,
  TemporalConstants,
  TEMPORAL_VERSION
} from '../index.js';
import type { TestExecutionRecord } from '../TestTypes.js';

describe('Temporal System Integration', () => {
  describe('System Creation and Configuration', () => {
    it('should create a complete temporal tracking system', async () => {
      const system = await createDefaultTemporalSystem();

      // Verify all core components are present
      expect(system.tracker).toBeDefined();
      expect(system.evolution).toBeDefined();
      expect(system.history).toBeDefined();
      expect(system.metrics).toBeDefined();
      expect(system.relationships).toBeDefined();
      expect(system.visualization).toBeDefined();
      expect(system.predictiveAnalytics).toBeDefined();
      expect(system.dataStorage).toBeDefined();
      expect(system.ciIntegration).toBeDefined();
      expect(system.config).toBeDefined();

      // Verify configuration defaults
      expect(system.config.maxTrendDataPoints).toBe(500);
      expect(system.config.flakinessThreshold).toBe(0.15);
      expect(system.config.batchSize).toBe(50);
    });

    it('should export version information', () => {
      expect(TEMPORAL_VERSION).toBe('1.0.0');
    });

    it('should provide utility functions', () => {
      const validFrom = new Date('2024-01-01');
      const validTo = new Date('2024-01-31');

      const age = TemporalUtils.calculateRelationshipAge(validFrom, validTo);
      expect(age).toBe(30);

      const relationshipId = TemporalUtils.generateRelationshipId(
        'test_1', 'entity_1', 'uses', 'suite_1'
      );
      expect(relationshipId).toBe('rel_test_1_entity_1_uses_suite_1');
    });

    it('should provide system constants', () => {
      expect(TemporalConstants.RETENTION_PERIODS.EXECUTIONS).toBe(90);
      expect(TemporalConstants.THRESHOLDS.FLAKINESS).toBe(0.1);
      expect(TemporalConstants.TREND_PERIODS.WEEKLY).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Core Workflow Integration', () => {
    let system: Awaited<ReturnType<typeof createTemporalTrackingSystem>>;

    beforeEach(async () => {
      system = await createDefaultTemporalSystem();
    });

    it('should handle basic test execution tracking', async () => {
      const testExecution: TestExecutionRecord = {
        executionId: 'integration_test_1',
        testId: 'basic_test',
        entityId: 'test_entity',
        suiteId: 'test_suite',
        timestamp: new Date(),
        status: 'pass',
        duration: 150,
        coverage: { overall: 0.85 },
        metadata: {
          testType: 'unit',
          suiteId: 'test_suite',
          confidence: 0.9
        }
      };

      // Track execution
      await expect(system.tracker.trackExecution(testExecution)).resolves.not.toThrow();

      // Calculate metrics
      const metrics = await system.metrics.calculateExecutionMetrics([testExecution]);
      expect(metrics.averageDuration).toBe(150);
      expect(metrics.passRate).toBe(1.0);
      expect(metrics.totalExecutions).toBe(1);
    });

    it('should handle CI configuration generation', async () => {
      const config = await system.ciIntegration.generateCIConfiguration({
        platform: 'github-actions',
        triggers: ['push'],
        testCommand: 'pnpm test',
        buildCommand: 'pnpm build'
      });

      expect(config.success).toBe(true);
      expect(config.configuration).toContain('name:');
      expect(config.configuration).toContain('on:');
      expect(config.configuration).toContain('push');
    });

    it('should handle data compression and storage', async () => {
      const testData = {
        id: 'test_1',
        name: 'Test Data',
        timestamp: new Date(),
        results: Array.from({ length: 100 }, (_, i) => ({
          index: i,
          value: Math.random(),
          status: i % 2 === 0 ? 'pass' : 'fail'
        }))
      };

      const compressed = await system.dataStorage.compressData(testData);
      expect(compressed.compressionRatio).toBeGreaterThan(1);
      expect(compressed.metadata.algorithm).toBe('gzip');

      const decompressed = await system.dataStorage.decompressData(compressed);
      expect(decompressed.id).toBe(testData.id);
      expect(decompressed.results).toHaveLength(100);
    });

    it('should generate basic visualizations', async () => {
      const executions = Array.from({ length: 10 }, (_, i) => ({
        executionId: `exec_${i}`,
        testId: 'viz_test',
        entityId: 'viz_entity',
        suiteId: 'viz_suite',
        timestamp: new Date(Date.now() - i * 60000),
        status: i % 3 === 0 ? 'fail' : 'pass' as 'pass' | 'fail',
        duration: 100 + Math.random() * 50,
        coverage: { overall: 0.8 + Math.random() * 0.15 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'viz_suite',
          confidence: 0.9
        }
      }));

      // Test timeline generation (with empty events array as expected)
      const timeline = await system.visualization.generateTimeline('viz_test', []);
      expect(timeline.success).toBe(true);
      expect(timeline.visualization.type).toBe('timeline');

      // Test performance graph
      const performance = await system.visualization.generatePerformanceGraph('viz_test', executions);
      expect(performance.success).toBe(true);
      expect(performance.visualization.type).toBe('performance');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid inputs gracefully', async () => {
      const system = await createDefaultTemporalSystem();

      // Test with empty arrays
      const emptyMetrics = await system.metrics.calculateExecutionMetrics([]);
      expect(emptyMetrics.totalExecutions).toBe(0);
      expect(emptyMetrics.passRate).toBe(0);

      // Test CI configuration with minimal data
      const minimalConfig = await system.ciIntegration.generateCIConfiguration({
        platform: 'github-actions',
        triggers: [],
        testCommand: '',
        buildCommand: ''
      });
      expect(minimalConfig.success).toBe(true);
    });

    it('should handle large datasets efficiently', async () => {
      const system = await createDefaultTemporalSystem();

      // Generate large dataset
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        executionId: `large_${i}`,
        testId: `test_${i % 10}`,
        entityId: `entity_${i % 5}`,
        suiteId: 'large_suite',
        timestamp: new Date(Date.now() - i * 1000),
        status: Math.random() > 0.1 ? 'pass' : 'fail' as 'pass' | 'fail',
        duration: Math.floor(Math.random() * 200) + 50,
        coverage: { overall: Math.random() * 0.3 + 0.7 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'large_suite',
          confidence: 0.9
        }
      }));

      const startTime = Date.now();

      // Calculate metrics on large dataset
      const metrics = await system.metrics.calculateExecutionMetrics(largeDataset);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(metrics.totalExecutions).toBe(500);
      expect(metrics.passRate).toBeGreaterThan(0.8); // Should be around 90%
      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Integration with External Systems', () => {
    it('should generate reports in multiple formats', async () => {
      const system = await createDefaultTemporalSystem();

      const testResults = {
        total: 100,
        passed: 90,
        failed: 10,
        duration: 45000
      };

      // Generate JUnit XML report
      const junitReport = await system.ciIntegration.generateReport(testResults, 'junit');
      expect(junitReport.success).toBe(true);
      expect(junitReport.content).toContain('<?xml version="1.0"');
      expect(junitReport.content).toContain('testsuite');

      // Generate JSON report
      const jsonReport = await system.ciIntegration.generateReport(testResults, 'json');
      expect(jsonReport.success).toBe(true);
      expect(() => JSON.parse(jsonReport.content)).not.toThrow();

      // Generate HTML report
      const htmlReport = await system.ciIntegration.generateReport(testResults, 'html');
      expect(htmlReport.success).toBe(true);
      expect(htmlReport.content).toContain('<!DOCTYPE html>');
    });

    it('should handle webhook events', async () => {
      const system = await createDefaultTemporalSystem();

      const webhookPayload = {
        event: 'test_completed',
        status: 'success',
        results: {
          total: 50,
          passed: 45,
          failed: 5
        }
      };

      const result = await system.ciIntegration.handleWebhook('test_completed', webhookPayload);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
    });

    it('should validate configuration and workflows', async () => {
      const system = await createDefaultTemporalSystem();

      const validWorkflow = `
name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
`;

      const validation = await system.ciIntegration.validateWorkflow(validWorkflow, 'github-actions');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch operations efficiently', async () => {
      const system = await createDefaultTemporalSystem();

      // Generate multiple datasets for batch compression
      const datasets = Array.from({ length: 50 }, (_, i) => ({
        id: `dataset_${i}`,
        data: Array.from({ length: 20 }, (_, j) => ({ index: j, value: Math.random() }))
      }));

      const startTime = Date.now();
      const results = await system.dataStorage.batchCompress(datasets);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.compressionRatio).toBeGreaterThan(1);
      });

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should optimize storage with retention policies', async () => {
      const system = await createDefaultTemporalSystem();

      // Generate historical data spanning different time periods
      const historicalData = Array.from({ length: 200 }, (_, i) => ({
        executionId: `hist_${i}`,
        testId: `test_${i % 5}`,
        entityId: `entity_${i % 3}`,
        suiteId: 'optimization_suite',
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Daily data going back
        status: Math.random() > 0.1 ? 'pass' : 'fail' as 'pass' | 'fail',
        duration: Math.floor(Math.random() * 300) + 50,
        coverage: { overall: Math.random() * 0.3 + 0.7 },
        metadata: {
          testType: 'unit' as const,
          suiteId: 'optimization_suite',
          confidence: 0.85
        }
      }));

      const optimized = await system.dataStorage.optimizeStorage(historicalData, {
        retentionDays: 30,
        compressionAfterDays: 7,
        archiveAfterDays: 60
      });

      expect(optimized.retained.length).toBeLessThan(historicalData.length);
      expect(optimized.compressed.length).toBeGreaterThan(0);
      expect(optimized.archived.length).toBeGreaterThan(0);
      expect(optimized.spaceFreed).toBeGreaterThan(0);
    });
  });
});