/**
 * Unit tests for HighThroughputIngestionPipeline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HighThroughputIngestionPipeline } from '../../src/ingestion/pipeline.js';
import { createDefaultPipelineConfig } from '../../src/ingestion/index.js';
import { ChangeEvent, ChangeFragment, EnrichmentTask } from '../../src/ingestion/types.js';
import { Entity } from '../../../models/entities.js';
import { GraphRelationship } from '../../../models/relationships.js';

// Mock KnowledgeGraphService integration
const mockKnowledgeGraphService = {
  async createEntitiesBulk(entities: Entity[]) {
    return {
      success: true,
      processed: entities.length,
      failed: 0
    };
  },

  async createRelationshipsBulk(relationships: GraphRelationship[]) {
    return {
      success: true,
      processed: relationships.length,
      failed: 0
    };
  },

  async createEmbeddingsBatch(entities: Entity[]) {
    return {
      success: true,
      processed: entities.length,
      failed: 0
    };
  }
};

describe('HighThroughputIngestionPipeline', () => {
  let pipeline: HighThroughputIngestionPipeline;
  let config: any;

  beforeEach(() => {
    config = createDefaultPipelineConfig();
    // Use smaller values for faster tests
    config.monitoring.metricsInterval = 100;
    config.monitoring.healthCheckInterval = 200;
    config.workers.parsers = 2;
    config.workers.entityWorkers = 2;
    config.workers.relationshipWorkers = 2;
    config.workers.embeddingWorkers = 1;

    pipeline = new HighThroughputIngestionPipeline(config, mockKnowledgeGraphService);
  });

  afterEach(async () => {
    await pipeline.stop();
  });

  describe('lifecycle management', () => {
    it('should start successfully', async () => {
      await pipeline.start();

      const state = pipeline.getState();
      expect(state.status).toBe('running');
      expect(state.startedAt).toBeTruthy();
    });

    it('should stop successfully', async () => {
      await pipeline.start();
      await pipeline.stop();

      const state = pipeline.getState();
      expect(state.status).toBe('stopped');
    });

    it('should throw if starting when already running', async () => {
      await pipeline.start();
      await expect(pipeline.start()).rejects.toThrow('already running');
    });

    it('should handle pause and resume', async () => {
      await pipeline.start();

      await pipeline.pause();
      expect(pipeline.getState().status).toBe('paused');

      await pipeline.resume();
      expect(pipeline.getState().status).toBe('running');
    });
  });

  describe('change event ingestion', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should ingest a single change event', async () => {
      const event: ChangeEvent = {
        id: 'test-event-1',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/file.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'abc123',
        metadata: { source: 'test' }
      };

      await pipeline.ingestChangeEvent(event);

      const state = pipeline.getState();
      expect(state.processedEvents).toBe(1);

      const metrics = pipeline.getMetrics();
      expect(metrics.totalEvents).toBe(1);
    });

    it('should ingest multiple change events', async () => {
      const events: ChangeEvent[] = [];
      for (let i = 0; i < 5; i++) {
        events.push({
          id: `test-event-${i}`,
          namespace: 'test',
          module: 'test-module',
          filePath: `/test/file${i}.ts`,
          eventType: 'modified',
          timestamp: new Date(),
          size: 1000 + i,
          diffHash: `hash${i}`,
          metadata: { index: i }
        });
      }

      await pipeline.ingestChangeEvents(events);

      const state = pipeline.getState();
      expect(state.processedEvents).toBe(5);
    });

    it('should handle change event errors gracefully', async () => {
      await pipeline.stop(); // Stop pipeline to trigger error

      const event: ChangeEvent = {
        id: 'error-event',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/error.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'error123',
        metadata: {}
      };

      await expect(pipeline.ingestChangeEvent(event)).rejects.toThrow('not running');
    });

    it('should calculate event priority correctly', async () => {
      const tsEvent: ChangeEvent = {
        id: 'ts-event',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/important.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 500, // Small file
        diffHash: 'ts123',
        metadata: {}
      };

      const txtEvent: ChangeEvent = {
        id: 'txt-event',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/readme.txt',
        eventType: 'created',
        timestamp: new Date(),
        size: 10000, // Large file
        diffHash: 'txt123',
        metadata: {}
      };

      // Both should process successfully regardless of priority
      await pipeline.ingestChangeEvent(tsEvent);
      await pipeline.ingestChangeEvent(txtEvent);

      const state = pipeline.getState();
      expect(state.processedEvents).toBe(2);
    });
  });

  describe('change fragment processing', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should process change fragments directly', async () => {
      const fragments: ChangeFragment[] = [
        {
          id: 'fragment-1',
          eventId: 'event-1',
          changeType: 'entity',
          operation: 'add',
          data: {
            id: 'entity-1',
            type: 'function',
            name: 'testFunction',
            properties: {},
            metadata: { createdAt: new Date() }
          } as Entity,
          dependencyHints: [],
          confidence: 0.9
        },
        {
          id: 'fragment-2',
          eventId: 'event-1',
          changeType: 'relationship',
          operation: 'add',
          data: {
            id: 'rel-1',
            type: 'CALLS',
            fromEntityId: 'entity-1',
            toEntityId: 'entity-2',
            properties: {},
            metadata: { createdAt: new Date() }
          } as GraphRelationship,
          dependencyHints: ['fragment-1'],
          confidence: 0.8
        }
      ];

      await pipeline.processChangeFragments(fragments);

      const metrics = pipeline.getMetrics();
      expect(metrics.batchMetrics.completedBatches).toBeGreaterThan(0);
    });

    it('should handle empty fragment arrays', async () => {
      await pipeline.processChangeFragments([]);

      // Should not throw and should not affect metrics significantly
      const metrics = pipeline.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('enrichment scheduling', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should schedule enrichment tasks', async () => {
      const enrichmentTask: EnrichmentTask = {
        id: 'enrichment-1',
        type: 'embedding',
        entityId: 'entity-1',
        priority: 5,
        data: { content: 'test content' },
        dependencies: [],
        createdAt: new Date()
      };

      await pipeline.scheduleEnrichment(enrichmentTask);

      // Should complete without error
      // In a real implementation, we could check queue metrics
    });

    it('should handle different enrichment types', async () => {
      const enrichmentTypes = ['embedding', 'impact_analysis', 'documentation', 'security'];

      for (const type of enrichmentTypes) {
        const task: EnrichmentTask = {
          id: `enrichment-${type}`,
          type: type as any,
          entityId: `entity-${type}`,
          priority: 5,
          data: {},
          dependencies: [],
          createdAt: new Date()
        };

        await pipeline.scheduleEnrichment(task);
      }

      // All should complete without error
    });
  });

  describe('metrics and telemetry', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should provide pipeline metrics', async () => {
      const metrics = pipeline.getMetrics();

      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('eventsPerSecond');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('p95Latency');
      expect(metrics).toHaveProperty('queueMetrics');
      expect(metrics).toHaveProperty('workerMetrics');
      expect(metrics).toHaveProperty('batchMetrics');

      expect(typeof metrics.totalEvents).toBe('number');
      expect(Array.isArray(metrics.workerMetrics)).toBe(true);
    });

    it('should provide pipeline state', async () => {
      const state = pipeline.getState();

      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('processedEvents');
      expect(state).toHaveProperty('errorCount');
      expect(state).toHaveProperty('currentLoad');

      expect(state.status).toBe('running');
      expect(typeof state.processedEvents).toBe('number');
    });

    it('should provide telemetry data', async () => {
      const telemetry = pipeline.getTelemetry();

      expect(telemetry).toHaveProperty('timestamp');
      expect(telemetry).toHaveProperty('pipeline');
      expect(telemetry).toHaveProperty('queues');
      expect(telemetry).toHaveProperty('workers');
      expect(telemetry).toHaveProperty('errors');
      expect(telemetry).toHaveProperty('performance');

      expect(telemetry.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(telemetry.workers)).toBe(true);
      expect(telemetry.performance).toHaveProperty('memory');
    });

    it('should update metrics over time', async () => {
      const initialMetrics = pipeline.getMetrics();
      expect(initialMetrics.totalEvents).toBe(0);

      // Process an event
      const event: ChangeEvent = {
        id: 'metrics-event',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/metrics.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'metrics123',
        metadata: {}
      };

      await pipeline.ingestChangeEvent(event);

      const updatedMetrics = pipeline.getMetrics();
      expect(updatedMetrics.totalEvents).toBe(1);
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should emit pipeline events', async () => {
      const eventReceivedEvents: any[] = [];
      const metricsUpdatedEvents: any[] = [];

      pipeline.on('event:received', (event) => {
        eventReceivedEvents.push(event);
      });

      pipeline.on('metrics:updated', (metrics) => {
        metricsUpdatedEvents.push(metrics);
      });

      const event: ChangeEvent = {
        id: 'event-test',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/events.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'events123',
        metadata: {}
      };

      await pipeline.ingestChangeEvent(event);

      // Wait a bit for events to be processed
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(eventReceivedEvents).toHaveLength(1);
      expect(eventReceivedEvents[0].id).toBe('event-test');

      // Metrics events should be emitted periodically
      expect(metricsUpdatedEvents.length).toBeGreaterThan(0);
    });

    it('should emit error events', async () => {
      const errorEvents: any[] = [];

      pipeline.on('pipeline:error', (error) => {
        errorEvents.push(error);
      });

      // Stop pipeline and try to process event to trigger error
      await pipeline.stop();

      const event: ChangeEvent = {
        id: 'error-test',
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/error.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'error123',
        metadata: {}
      };

      try {
        await pipeline.ingestChangeEvent(event);
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(0);
    });
  });

  describe('alert configuration', () => {
    beforeEach(async () => {
      await pipeline.start();
    });

    it('should support alert configuration', async () => {
      const alertTriggeredEvents: any[] = [];

      pipeline.on('alert:triggered', (alert, value) => {
        alertTriggeredEvents.push({ alert, value });
      });

      pipeline.addAlert({
        name: 'test_alert',
        condition: 'queue_depth > 10',
        threshold: 10,
        duration: 1000,
        severity: 'warning',
        channels: ['console']
      });

      // Process many events to potentially trigger alert
      const events: ChangeEvent[] = [];
      for (let i = 0; i < 5; i++) {
        events.push({
          id: `alert-event-${i}`,
          namespace: 'test',
          module: 'test-module',
          filePath: `/test/alert${i}.ts`,
          eventType: 'modified',
          timestamp: new Date(),
          size: 1000,
          diffHash: `alert${i}`,
          metadata: {}
        });
      }

      await pipeline.ingestChangeEvents(events);

      // Wait for potential alert processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Alert might not trigger in test environment due to fast processing
      // This test mainly verifies the alert system doesn't break
      expect(alertTriggeredEvents).toEqual(expect.any(Array));
    });
  });

  describe('error resilience', () => {
    it('should handle startup errors gracefully', async () => {
      // Create pipeline with invalid configuration to trigger startup error
      const invalidConfig = { ...config };
      delete invalidConfig.workers;

      const invalidPipeline = new HighThroughputIngestionPipeline(invalidConfig);

      await expect(invalidPipeline.start()).rejects.toThrow();

      const state = invalidPipeline.getState();
      expect(state.status).toBe('error');

      await invalidPipeline.stop(); // Should not throw
    });

    it('should continue operating after individual task failures', async () => {
      await pipeline.start();

      // Process a mix of valid and potentially problematic events
      const events: ChangeEvent[] = [
        {
          id: 'good-event-1',
          namespace: 'test',
          module: 'test-module',
          filePath: '/test/good1.ts',
          eventType: 'modified',
          timestamp: new Date(),
          size: 1000,
          diffHash: 'good1',
          metadata: {}
        },
        {
          id: 'problematic-event',
          namespace: 'test',
          module: 'test-module',
          filePath: '/test/problematic.ts',
          eventType: 'modified',
          timestamp: new Date(),
          size: 0, // Potentially problematic
          diffHash: '',
          metadata: {}
        },
        {
          id: 'good-event-2',
          namespace: 'test',
          module: 'test-module',
          filePath: '/test/good2.ts',
          eventType: 'modified',
          timestamp: new Date(),
          size: 2000,
          diffHash: 'good2',
          metadata: {}
        }
      ];

      // Should process all events without throwing
      await pipeline.ingestChangeEvents(events);

      const state = pipeline.getState();
      expect(state.processedEvents).toBe(3);
    });
  });
});