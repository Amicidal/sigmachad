/**
 * @file EnhancedFeatures.test.ts
 * @description Comprehensive validation tests for enhanced temporal tracking features
 *
 * Tests visualization generation, predictive analytics accuracy, data storage compression,
 * and CI/CD integration functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestVisualization } from '../src/temporal/TestVisualization.js';
import { TestPredictiveAnalytics } from '../src/temporal/TestPredictiveAnalytics.js';
import { TestDataStorage } from '../src/temporal/TestDataStorage.js';
import { TestCIIntegration } from '../src/temporal/TestCIIntegration.js';
import {
  TestExecutionRecord,
  TestEvolutionEvent,
  TestRelationship,
  TestConfiguration,
  TestStatus,
  TestType,
  TestRelationshipType
} from '../src/temporal/TestTypes.js';

describe('Enhanced Temporal Tracking Features', () => {
  let config: TestConfiguration;
  let mockExecutions: TestExecutionRecord[];
  let mockEvents: TestEvolutionEvent[];
  let mockRelationships: TestRelationship[];

  beforeEach(() => {
    config = {
      maxTrendDataPoints: 1000,
      flakinessThreshold: 0.1,
      coverageChangeThreshold: 0.05,
      performanceRegressionThreshold: 1.5,
      obsolescenceDetectionEnabled: true,
      trendAnalysisPeriod: 'weekly',
      batchSize: 100
    };

    // Create comprehensive mock data
    mockExecutions = generateMockExecutions(100);
    mockEvents = generateMockEvents(50);
    mockRelationships = generateMockRelationships(25);
  });

  afterEach(() => {
    // Cleanup any resources
  });

  describe('Visualization Generation', () => {
    let visualization: TestVisualization;

    beforeEach(() => {
      visualization = new TestVisualization(config);

      // Update visualization with mock data
      visualization.updateExecutionData('test_1:entity_1', mockExecutions);
      visualization.updateEventData('test_1:entity_1', mockEvents);
      visualization.updateRelationshipData('test_1:entity_1', mockRelationships);
    });

    it('should generate timeline visualization correctly', async () => {
      const timeline = await visualization.generateTimeline(
        mockEvents,
        mockRelationships,
        mockExecutions
      );

      expect(timeline).toBeDefined();
      expect(timeline.events).toHaveLength(mockEvents.length);
      expect(timeline.relationships.length).toBeGreaterThan(0);
      expect(timeline.executions).toHaveLength(mockExecutions.length);

      // Validate timeline data structure
      expect(timeline.events[0]).toHaveProperty('timestamp');
      expect(timeline.events[0]).toHaveProperty('type');
      expect(timeline.events[0]).toHaveProperty('description');
      expect(timeline.events[0]).toHaveProperty('severity');

      // Validate events are sorted by timestamp
      for (let i = 1; i < timeline.events.length; i++) {
        expect(timeline.events[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          timeline.events[i - 1].timestamp.getTime()
        );
      }
    });

    it('should generate coverage heatmap with proper grid structure', async () => {
      const timeWindow = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const heatmap = await visualization.generateCoverageHeatmap(
        mockExecutions,
        timeWindow,
        { gridSize: 10 }
      );

      expect(heatmap).toBeDefined();
      expect(heatmap.grid).toHaveLength(10); // Should match gridSize
      expect(heatmap.grid[0]).toHaveLength(10);
      expect(heatmap.xLabels).toHaveLength(10);
      expect(heatmap.yLabels.length).toBeGreaterThan(0);

      // Validate statistics
      expect(heatmap.statistics).toHaveProperty('minCoverage');
      expect(heatmap.statistics).toHaveProperty('maxCoverage');
      expect(heatmap.statistics).toHaveProperty('avgCoverage');
      expect(heatmap.statistics.avgCoverage).toBeGreaterThanOrEqual(0);
      expect(heatmap.statistics.avgCoverage).toBeLessThanOrEqual(1);

      // Validate grid cell structure
      const cell = heatmap.grid[0][0];
      expect(cell).toHaveProperty('coverage');
      expect(cell).toHaveProperty('executions');
      expect(cell).toHaveProperty('timestamp');
    });

    it('should generate flakiness chart with trend analysis', async () => {
      const flakinessChart = await visualization.generateFlakinessChart(
        mockExecutions,
        { movingAverageWindow: 5 }
      );

      expect(flakinessChart).toBeDefined();
      expect(flakinessChart.dataPoints.length).toBeGreaterThan(0);
      expect(flakinessChart.movingAverage.length).toBeGreaterThan(0);
      expect(flakinessChart.threshold).toBe(config.flakinessThreshold);

      // Validate data point structure
      const dataPoint = flakinessChart.dataPoints[0];
      expect(dataPoint).toHaveProperty('timestamp');
      expect(dataPoint).toHaveProperty('flakinessScore');
      expect(dataPoint).toHaveProperty('executionCount');
      expect(dataPoint.flakinessScore).toBeGreaterThanOrEqual(0);
      expect(dataPoint.flakinessScore).toBeLessThanOrEqual(1);

      // Validate confidence intervals if present
      if (dataPoint.confidenceInterval) {
        expect(dataPoint.confidenceInterval.lower).toBeLessThanOrEqual(dataPoint.flakinessScore);
        expect(dataPoint.confidenceInterval.upper).toBeGreaterThanOrEqual(dataPoint.flakinessScore);
      }

      // Validate annotations
      flakinessChart.annotations.forEach(annotation => {
        expect(annotation).toHaveProperty('timestamp');
        expect(annotation).toHaveProperty('message');
        expect(['info', 'warning', 'error']).toContain(annotation.severity);
      });
    });

    it('should generate performance graph with baseline comparison', async () => {
      const performanceGraph = await visualization.generatePerformanceGraph(
        mockExecutions,
        ['duration', 'coverage'],
        { showBaselines: true }
      );

      expect(performanceGraph).toBeDefined();
      expect(performanceGraph.metrics).toHaveProperty('duration');
      expect(performanceGraph.metrics).toHaveProperty('coverage');
      expect(performanceGraph.baselines).toHaveProperty('duration');
      expect(performanceGraph.baselines).toHaveProperty('coverage');

      // Validate metric data points
      const durationPoints = performanceGraph.metrics.duration;
      expect(durationPoints.length).toBeGreaterThan(0);

      const point = durationPoints[0];
      expect(point).toHaveProperty('timestamp');
      expect(point).toHaveProperty('value');
      expect(point).toHaveProperty('baseline');
      expect(['improving', 'degrading', 'stable']).toContain(point.trend || 'stable');

      // Validate annotations
      performanceGraph.annotations.forEach(annotation => {
        expect(annotation).toHaveProperty('timestamp');
        expect(annotation).toHaveProperty('metric');
        expect(annotation).toHaveProperty('message');
        expect(['milestone', 'regression', 'improvement']).toContain(annotation.type);
      });
    });

    it('should export visualization data in multiple formats', async () => {
      const timeline = await visualization.generateTimeline(
        mockEvents,
        mockRelationships,
        mockExecutions
      );

      // Test JSON export
      const jsonExport = await visualization.exportVisualization(timeline, {
        format: 'json',
        includeMetadata: true
      });
      expect(typeof jsonExport).toBe('string');
      expect(() => JSON.parse(jsonExport as string)).not.toThrow();

      // Test CSV export
      const csvExport = await visualization.exportVisualization(timeline.events, {
        format: 'csv'
      });
      expect(typeof csvExport).toBe('string');
      expect((csvExport as string).includes(',')).toBe(true);

      // Test compressed export
      const compressedExport = await visualization.exportVisualization(timeline, {
        format: 'json',
        compression: true
      });
      expect(typeof compressedExport).toBe('string');
      expect((compressedExport as string).length).toBeLessThan((jsonExport as string).length);
    });

    it('should generate comprehensive dashboard', async () => {
      const dashboard = await visualization.generateDashboard(
        'test_1',
        'entity_1',
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      );

      expect(dashboard).toBeDefined();
      expect(dashboard).toHaveProperty('timeline');
      expect(dashboard).toHaveProperty('coverageHeatmap');
      expect(dashboard).toHaveProperty('flakinessChart');
      expect(dashboard).toHaveProperty('performanceGraph');
      expect(dashboard).toHaveProperty('summary');

      // Validate summary statistics
      const summary = dashboard.summary;
      expect(summary.totalExecutions).toBeGreaterThan(0);
      expect(summary.successRate).toBeGreaterThanOrEqual(0);
      expect(summary.successRate).toBeLessThanOrEqual(1);
      expect(summary.avgCoverage).toBeGreaterThanOrEqual(0);
      expect(summary.avgCoverage).toBeLessThanOrEqual(1);
      expect(['improving', 'degrading', 'stable']).toContain(summary.performanceTrend);
    });
  });

  describe('Predictive Analytics Accuracy', () => {
    let analytics: TestPredictiveAnalytics;

    beforeEach(() => {
      analytics = new TestPredictiveAnalytics({
        enableFailurePrediction: true,
        enableObsolescencePrediction: true,
        enableMaintenanceCostEstimation: true,
        enableTestPriorityScoring: true,
        minDataPoints: 20,
        confidenceThreshold: 0.7
      });

      // Update analytics with mock data
      analytics.updateExecutionData('test_1:entity_1', mockExecutions);
      analytics.updateEventData('test_1:entity_1', mockEvents);
      analytics.updateRelationshipData('test_1:entity_1', mockRelationships);
    });

    it('should predict test failure with reasonable accuracy', async () => {
      const prediction = await analytics.predictTestFailure('test_1', 'entity_1', 7);

      expect(prediction).toBeDefined();
      expect(prediction.predictionId).toMatch(/^failure_/);
      expect(prediction.testId).toBe('test_1');
      expect(prediction.entityId).toBe('entity_1');
      expect(prediction.failureProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.failureProbability).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(prediction.riskLevel);

      // Validate factors
      expect(prediction.factors.length).toBeGreaterThan(0);
      prediction.factors.forEach(factor => {
        expect(factor).toHaveProperty('factor');
        expect(factor).toHaveProperty('importance');
        expect(factor).toHaveProperty('value');
        expect(factor).toHaveProperty('description');
        expect(factor.importance).toBeGreaterThan(0);
        expect(factor.importance).toBeLessThanOrEqual(1);
      });

      // Validate recommendations
      expect(Array.isArray(prediction.recommendations)).toBe(true);
      expect(prediction.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should predict test obsolescence with trend analysis', async () => {
      const prediction = await analytics.predictTestObsolescence('test_1', 'entity_1');

      expect(prediction).toBeDefined();
      expect(prediction.predictionId).toMatch(/^obsolescence_/);
      expect(prediction.obsolescenceProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.obsolescenceProbability).toBeLessThanOrEqual(1);
      expect(prediction.estimatedDaysToObsolescence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);

      // Validate factors with trends
      expect(prediction.factors.length).toBeGreaterThan(0);
      prediction.factors.forEach(factor => {
        expect(factor).toHaveProperty('factor');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('value');
        expect(factor).toHaveProperty('trend');
        expect(['increasing', 'decreasing', 'stable']).toContain(factor.trend);
      });
    });

    it('should estimate maintenance costs with breakdown', async () => {
      const estimate = await analytics.estimateMaintenanceCost('test_1', 'entity_1', 30);

      expect(estimate).toBeDefined();
      expect(estimate.estimateId).toMatch(/^maintenance_/);
      expect(estimate.estimatedHours).toBeGreaterThan(0);
      expect(['increasing', 'decreasing', 'stable']).toContain(estimate.trend);

      // Validate cost breakdown
      const breakdown = estimate.breakdown;
      expect(breakdown).toHaveProperty('debugging');
      expect(breakdown).toHaveProperty('flakiness');
      expect(breakdown).toHaveProperty('updating');
      expect(breakdown).toHaveProperty('refactoring');
      expect(breakdown).toHaveProperty('obsolescence');

      Object.values(breakdown).forEach(cost => {
        expect(cost).toBeGreaterThanOrEqual(0);
      });

      // Validate optimizations
      expect(Array.isArray(estimate.optimizations)).toBe(true);
      estimate.optimizations.forEach(optimization => {
        expect(optimization).toHaveProperty('action');
        expect(optimization).toHaveProperty('expectedSavings');
        expect(optimization).toHaveProperty('effort');
        expect(optimization).toHaveProperty('impact');
        expect(['low', 'medium', 'high']).toContain(optimization.effort);
        expect(['low', 'medium', 'high']).toContain(optimization.impact);
        expect(optimization.expectedSavings).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate test priority scores with component breakdown', async () => {
      const priority = await analytics.calculateTestPriority('test_1', 'entity_1');

      expect(priority).toBeDefined();
      expect(priority.testId).toBe('test_1');
      expect(priority.entityId).toBe('entity_1');
      expect(priority.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priority.priorityScore).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(priority.priorityLevel);

      // Validate component scores
      const components = priority.components;
      expect(components).toHaveProperty('businessValue');
      expect(components).toHaveProperty('technicalRisk');
      expect(components).toHaveProperty('maintenanceCost');
      expect(components).toHaveProperty('coverage');
      expect(components).toHaveProperty('stability');
      expect(components).toHaveProperty('frequency');

      Object.values(components).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });

      // Validate factors
      expect(priority.factors.length).toBeGreaterThan(0);
      priority.factors.forEach(factor => {
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('score');
        expect(factor).toHaveProperty('justification');
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should perform batch predictions efficiently', async () => {
      const testIds = [
        { testId: 'test_1', entityId: 'entity_1' },
        { testId: 'test_2', entityId: 'entity_2' },
        { testId: 'test_3', entityId: 'entity_3' }
      ];

      // Add data for additional tests
      testIds.forEach(({ testId, entityId }) => {
        analytics.updateExecutionData(`${testId}:${entityId}`, mockExecutions);
        analytics.updateEventData(`${testId}:${entityId}`, mockEvents);
        analytics.updateRelationshipData(`${testId}:${entityId}`, mockRelationships);
      });

      const startTime = Date.now();
      const results = await analytics.batchPredict(
        testIds,
        ['failure', 'obsolescence', 'maintenance', 'priority']
      );
      const endTime = Date.now();

      // Validate performance (should complete within reasonable time)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Validate results structure
      expect(results).toHaveProperty('failures');
      expect(results).toHaveProperty('obsolescence');
      expect(results).toHaveProperty('maintenance');
      expect(results).toHaveProperty('priorities');

      // Should have predictions for at least some tests
      expect(results.failures.length).toBeGreaterThan(0);
      expect(results.obsolescence.length).toBeGreaterThan(0);
      expect(results.maintenance.length).toBeGreaterThan(0);
      expect(results.priorities.length).toBeGreaterThan(0);
    });

    it('should train models and provide performance metrics', async () => {
      const models = await analytics.trainModels();

      expect(models).toHaveProperty('failureModel');
      expect(models).toHaveProperty('obsolescenceModel');
      expect(models).toHaveProperty('maintenanceModel');

      // Validate model structure
      Object.values(models).forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('version');
        expect(model).toHaveProperty('trainingDataSize');
        expect(model).toHaveProperty('accuracy');
        expect(model).toHaveProperty('lastTrained');
        expect(model).toHaveProperty('featureImportance');

        // Validate accuracy metrics
        const accuracy = model.accuracy;
        expect(accuracy).toHaveProperty('precision');
        expect(accuracy).toHaveProperty('recall');
        expect(accuracy).toHaveProperty('f1Score');
        expect(accuracy).toHaveProperty('auc');

        Object.values(accuracy).forEach(metric => {
          expect(metric).toBeGreaterThanOrEqual(0);
          expect(metric).toBeLessThanOrEqual(1);
        });
      });

      // Get model metrics
      const metrics = await analytics.getModelMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });
  });

  describe('Data Storage Compression', () => {
    let dataStorage: TestDataStorage;

    beforeEach(() => {
      dataStorage = new TestDataStorage({
        enableCompression: true,
        compressionLevel: 6,
        enableEncryption: false
      });
    });

    it('should compress execution data efficiently', async () => {
      const largeDataset = generateMockExecutions(1000);

      const uncompressedSize = JSON.stringify(largeDataset).length;
      const compressed = await dataStorage.compressData(largeDataset);

      expect(compressed.size).toBeLessThan(uncompressedSize);
      expect(compressed.compressionRatio).toBeGreaterThan(1);
      expect(compressed.metadata).toHaveProperty('originalSize');
      expect(compressed.metadata).toHaveProperty('compressedSize');
      expect(compressed.metadata).toHaveProperty('algorithm');
    });

    it('should decompress data without loss', async () => {
      const originalData = generateMockExecutions(100);

      const compressed = await dataStorage.compressData(originalData);
      const decompressed = await dataStorage.decompressData(compressed);

      expect(decompressed).toEqual(originalData);
    });

    it('should handle batch compression operations', async () => {
      const batches = [
        generateMockExecutions(100),
        generateMockEvents(50),
        generateMockRelationships(25)
      ];

      const results = await dataStorage.batchCompress(batches);

      expect(results.length).toBe(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.compressionRatio).toBeGreaterThan(1);
        expect(result.originalSize).toBeGreaterThan(0);
      });
    });

    it('should optimize storage with retention policies', async () => {
      const historicalData = generateHistoricalExecutions(365); // 1 year of data

      const optimized = await dataStorage.optimizeStorage(historicalData, {
        retentionDays: 90,
        compressionAfterDays: 30,
        archiveAfterDays: 180
      });

      expect(optimized.retained.length).toBeLessThan(historicalData.length);
      expect(optimized.compressed.length).toBeGreaterThan(0);
      expect(optimized.archived.length).toBeGreaterThan(0);
      expect(optimized.spaceFreed).toBeGreaterThan(0);
    });
  });

  describe('CI/CD Integration', () => {
    let ciIntegration: TestCIIntegration;

    beforeEach(() => {
      ciIntegration = new TestCIIntegration(config);
    });

    it('should generate CI configuration correctly', async () => {
      const ciConfig = await ciIntegration.generateCIConfiguration({
        platform: 'github-actions',
        triggers: ['push', 'pull_request'],
        testCommand: 'pnpm test',
        reportingEnabled: true
      });

      expect(ciConfig).toBeDefined();
      expect(ciConfig.platform).toBe('github-actions');
      expect(ciConfig.configuration).toContain('name:');
      expect(ciConfig.configuration).toContain('on:');
      expect(ciConfig.configuration).toContain('jobs:');
      expect(ciConfig.steps.length).toBeGreaterThan(0);
    });

    it('should validate CI workflow files', async () => {
      const validWorkflow = `
name: Test Temporal Tracking
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: pnpm test
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: logs/
`;

      const validation = await ciIntegration.validateWorkflow(validWorkflow, 'github-actions');

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0);
      expect(validation.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle webhook events correctly', async () => {
      const webhookPayload = {
        repository: { name: 'test-repo' },
        head_commit: { id: 'abc123', message: 'Test commit' },
        pusher: { name: 'test-user' }
      };

      const result = await ciIntegration.handleWebhook('push', webhookPayload);

      expect(result.processed).toBe(true);
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('repository');
      expect(result.metadata).toHaveProperty('commit');
    });

    it('should generate test reports in multiple formats', async () => {
      const testResults = {
        passed: 85,
        failed: 5,
        skipped: 10,
        total: 100,
        coverage: 0.87,
        duration: 45000,
        details: mockExecutions.slice(0, 10)
      };

      // Test JUnit XML format
      const junitReport = await ciIntegration.generateReport(testResults, 'junit');
      expect(junitReport.format).toBe('junit');
      expect(junitReport.content).toContain('<?xml version="1.0"');
      expect(junitReport.content).toContain('<testsuite');

      // Test JSON format
      const jsonReport = await ciIntegration.generateReport(testResults, 'json');
      expect(jsonReport.format).toBe('json');
      expect(() => JSON.parse(jsonReport.content)).not.toThrow();

      // Test HTML format
      const htmlReport = await ciIntegration.generateReport(testResults, 'html');
      expect(htmlReport.format).toBe('html');
      expect(htmlReport.content).toContain('<html');
      expect(htmlReport.content).toContain('Test Results');
    });

    it('should integrate with notification systems', async () => {
      const alertConfig = {
        channels: ['slack', 'email'],
        thresholds: {
          failureRate: 0.1,
          coverageChange: 0.05,
          performanceRegression: 1.5
        },
        recipients: ['team@example.com']
      };

      const testResults = {
        passed: 70,
        failed: 30,
        total: 100,
        coverage: 0.65, // Significant drop
        previousCoverage: 0.85
      };

      const notifications = await ciIntegration.sendNotifications(testResults, alertConfig);

      expect(notifications.sent.length).toBeGreaterThan(0);
      expect(notifications.failed.length).toBe(0);

      notifications.sent.forEach(notification => {
        expect(notification).toHaveProperty('channel');
        expect(notification).toHaveProperty('recipient');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('severity');
        expect(['info', 'warning', 'error', 'critical']).toContain(notification.severity);
      });
    });
  });
});

// Helper functions for generating mock data

function generateMockExecutions(count: number): TestExecutionRecord[] {
  const executions: TestExecutionRecord[] = [];
  const statuses: TestStatus[] = ['pass', 'fail', 'skip'];

  for (let i = 0; i < count; i++) {
    executions.push({
      executionId: `exec_${i}`,
      testId: `test_${Math.floor(i / 10) + 1}`,
      entityId: `entity_${Math.floor(i / 5) + 1}`,
      suiteId: `suite_${Math.floor(i / 20) + 1}`,
      timestamp: new Date(Date.now() - (count - i) * 60000), // Spread over time
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration: Math.floor(Math.random() * 1000) + 50,
      coverage: {
        overall: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        lines: Math.random() * 0.3 + 0.7,
        branches: Math.random() * 0.4 + 0.6,
        functions: Math.random() * 0.2 + 0.8,
        statements: Math.random() * 0.3 + 0.7
      },
      performance: {
        memory: Math.floor(Math.random() * 100) + 50,
        cpu: Math.random() * 50 + 10
      },
      metadata: {
        testType: 'unit' as TestType,
        suiteId: `suite_${Math.floor(i / 20) + 1}`,
        confidence: Math.random() * 0.3 + 0.7
      }
    });
  }

  return executions;
}

function generateMockEvents(count: number): TestEvolutionEvent[] {
  const events: TestEvolutionEvent[] = [];
  const eventTypes = [
    'test_added', 'test_modified', 'test_removed',
    'coverage_increased', 'coverage_decreased',
    'performance_regression', 'flakiness_detected',
    'relationship_added', 'relationship_removed'
  ];

  for (let i = 0; i < count; i++) {
    events.push({
      eventId: `event_${i}`,
      testId: `test_${Math.floor(i / 5) + 1}`,
      entityId: `entity_${Math.floor(i / 3) + 1}`,
      timestamp: new Date(Date.now() - (count - i) * 120000),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
      description: `Test event ${i}`,
      metadata: {
        eventIndex: i,
        randomValue: Math.random()
      }
    });
  }

  return events;
}

function generateMockRelationships(count: number): TestRelationship[] {
  const relationships: TestRelationship[] = [];
  const relationshipTypes: TestRelationshipType[] = ['TESTS', 'IMPORTS', 'CALLS', 'DEPENDS_ON'];

  for (let i = 0; i < count; i++) {
    relationships.push({
      relationshipId: `rel_${i}`,
      testId: `test_${Math.floor(i / 3) + 1}`,
      entityId: `entity_${Math.floor(i / 2) + 1}`,
      type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
      validFrom: new Date(Date.now() - (count - i) * 86400000), // Days ago
      validTo: null,
      active: Math.random() > 0.1, // 90% active
      confidence: Math.random() * 0.3 + 0.7,
      metadata: {
        testType: 'unit' as TestType,
        suiteId: `suite_1`,
        confidence: Math.random() * 0.3 + 0.7
      },
      evidence: []
    });
  }

  return relationships;
}

function generateHistoricalExecutions(days: number): TestExecutionRecord[] {
  const executions: TestExecutionRecord[] = [];
  const executionsPerDay = 10;

  for (let day = 0; day < days; day++) {
    for (let exec = 0; exec < executionsPerDay; exec++) {
      const executionIndex = day * executionsPerDay + exec;
      executions.push({
        executionId: `hist_exec_${executionIndex}`,
        testId: `test_${exec % 5 + 1}`,
        entityId: `entity_${exec % 3 + 1}`,
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.1 ? 'pass' : 'fail',
        duration: Math.floor(Math.random() * 500) + 100,
        coverage: {
          overall: Math.random() * 0.3 + 0.7
        },
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      });
    }
  }

  return executions;
}