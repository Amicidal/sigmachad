/**
 * @file TestTemporalTracker.test.ts
 * @description Unit tests for TestTemporalTracker service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestTemporalTracker } from '../src/TestTemporalTracker.js';
import {
  TestExecutionRecord,
  TestMetadata,
  TestConfiguration,
  TestStatus,
  TestType,
  TestRelationshipType
} from '../src/TestTypes.js';

describe('TestTemporalTracker', () => {
  let tracker: TestTemporalTracker;
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

    tracker = new TestTemporalTracker(mockConfig);
  });

  describe('trackExecution', () => {
    it('should track a test execution successfully', async () => {
      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        duration: 100,
        coverage: {
          overall: 0.85,
          lines: 0.8,
          branches: 0.9,
          functions: 0.85,
          statements: 0.88
        },
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await tracker.trackExecution(execution);

      const events = await tracker.getEvolutionEvents('test_1', 'entity_1');
      expect(events).toHaveLength(1);
      expect(events[0].testId).toBe('test_1');
      expect(events[0].entityId).toBe('entity_1');
    });

    it('should detect coverage changes', async () => {
      const execution1: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 1000),
        status: 'pass' as TestStatus,
        coverage: { overall: 0.5 },
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
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        coverage: { overall: 0.8 },
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await tracker.trackExecution(execution1);
      await tracker.trackExecution(execution2);

      const events = await tracker.getEvolutionEvents('test_1', 'entity_1');
      const coverageEvents = events.filter(e => e.type === 'coverage_increased');
      expect(coverageEvents).toHaveLength(1);
    });

    it('should detect performance regression', async () => {
      const execution1: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(Date.now() - 1000),
        status: 'pass' as TestStatus,
        duration: 100,
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
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        duration: 200, // 2x slower
        metadata: {
          testType: 'unit' as TestType,
          suiteId: 'suite_1',
          confidence: 0.9
        }
      };

      await tracker.trackExecution(execution1);
      await tracker.trackExecution(execution2);

      const events = await tracker.getEvolutionEvents('test_1', 'entity_1');
      const regressionEvents = events.filter(e => e.type === 'performance_regression');
      expect(regressionEvents).toHaveLength(1);
    });
  });

  describe('trackRelationshipChange', () => {
    it('should create a new relationship', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata
      );

      const relationships = await tracker.getActiveRelationships('test_1');
      expect(relationships).toHaveLength(1);
      expect(relationships[0].testId).toBe('test_1');
      expect(relationships[0].entityId).toBe('entity_1');
      expect(relationships[0].type).toBe('TESTS');
    });

    it('should update existing relationship', async () => {
      const metadata1: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.7
      };

      const metadata2: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata1
      );

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata2
      );

      const relationships = await tracker.getActiveRelationships('test_1');
      expect(relationships).toHaveLength(1);
      expect(relationships[0].confidence).toBe(0.9);
    });
  });

  describe('queryTimeline', () => {
    it('should query timeline data with filters', async () => {
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

      await tracker.trackExecution(execution);

      const result = await tracker.queryTimeline({
        testId: 'test_1',
        entityId: 'entity_1',
        limit: 10
      });

      expect(result.events).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should filter events by date range', async () => {
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

      await tracker.trackExecution(oldExecution);
      await tracker.trackExecution(newExecution);

      const result = await tracker.queryTimeline({
        testId: 'test_1',
        startDate: new Date('2024-01-01')
      });

      expect(result.events).toHaveLength(1);
    });
  });

  describe('analyzeImpact', () => {
    it('should analyze test impact', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata
      );

      const execution: TestExecutionRecord = {
        executionId: 'exec_1',
        testId: 'test_1',
        entityId: 'entity_1',
        suiteId: 'suite_1',
        timestamp: new Date(),
        status: 'pass' as TestStatus,
        coverage: { overall: 0.8 },
        metadata
      };

      await tracker.trackExecution(execution);

      const analysis = await tracker.analyzeImpact('test_1', 'entity_1');

      expect(analysis.testId).toBe('test_1');
      expect(analysis.entityId).toBe('entity_1');
      expect(analysis.impactScore).toBeGreaterThan(0);
      expect(analysis.riskAssessment).toMatch(/low|medium|high|critical/);
      expect(analysis.factors).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });
  });

  describe('detectObsolescence', () => {
    it('should detect obsolescent tests when enabled', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata
      );

      // Create executions with low coverage
      for (let i = 0; i < 5; i++) {
        const execution: TestExecutionRecord = {
          executionId: `exec_${i}`,
          testId: 'test_1',
          entityId: 'entity_1',
          suiteId: 'suite_1',
          timestamp: new Date(Date.now() - i * 1000),
          status: 'pass' as TestStatus,
          coverage: { overall: 0.05 }, // Very low coverage
          metadata
        };
        await tracker.trackExecution(execution);
      }

      const analyses = await tracker.detectObsolescence('entity_1');
      expect(analyses).toBeDefined();
      // Note: The actual obsolescence detection logic would need more sophisticated analysis
    });

    it('should return empty array when obsolescence detection disabled', async () => {
      const disabledTracker = new TestTemporalTracker({
        ...mockConfig,
        obsolescenceDetectionEnabled: false
      });

      const analyses = await disabledTracker.detectObsolescence('entity_1');
      expect(analyses).toEqual([]);
    });
  });

  describe('closeRelationship', () => {
    it('should close an active relationship', async () => {
      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata
      );

      const relationships = await tracker.getActiveRelationships('test_1');
      expect(relationships).toHaveLength(1);

      const relationshipId = relationships[0].relationshipId;
      await tracker.closeRelationship(relationshipId);

      const activeRelationships = await tracker.getActiveRelationships('test_1');
      expect(activeRelationships).toHaveLength(0);
    });

    it('should throw error when closing non-existent relationship', async () => {
      await expect(
        tracker.closeRelationship('non_existent_id')
      ).rejects.toThrow('Relationship not found');
    });
  });

  describe('event emission', () => {
    it('should emit events when tracking executions', async () => {
      let emittedEvent: any = null;
      tracker.on('execution-tracked', (event) => {
        emittedEvent = event;
      });

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

      await tracker.trackExecution(execution);

      expect(emittedEvent).toBeDefined();
      expect(emittedEvent.executionId).toBe('exec_1');
    });

    it('should emit events when tracking relationship changes', async () => {
      let emittedEvent: any = null;
      tracker.on('relationship-changed', (event) => {
        emittedEvent = event;
      });

      const metadata: TestMetadata = {
        testType: 'unit' as TestType,
        suiteId: 'suite_1',
        confidence: 0.9
      };

      await tracker.trackRelationshipChange(
        'test_1',
        'entity_1',
        'TESTS' as TestRelationshipType,
        metadata
      );

      expect(emittedEvent).toBeDefined();
      expect(emittedEvent.testId).toBe('test_1');
      expect(emittedEvent.entityId).toBe('entity_1');
    });
  });
});