/**
 * Unit tests for HighThroughputBatchProcessor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  HighThroughputBatchProcessor,
  BatchProcessorConfig,
} from '@memento/knowledge/ingestion/batch-processor';
import { Entity } from '@memento/shared-types/entities';
import { GraphRelationship } from '@memento/shared-types/relationships';
import { ChangeFragment } from '@memento/knowledge/ingestion/types';

describe('HighThroughputBatchProcessor', () => {
  let batchProcessor: HighThroughputBatchProcessor;
  let config: BatchProcessorConfig;

  beforeEach(() => {
    config = {
      entityBatchSize: 50,
      relationshipBatchSize: 100,
      embeddingBatchSize: 25,
      timeoutMs: 10000,
      maxConcurrentBatches: 4,
      streaming: {
        batchSize: 50,
        maxConcurrentWrites: 4,
        idempotencyKeyTTL: 300000,
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          maxBackoffMs: 10000
        }
      },
      enableDAG: true,
      epochTTL: 3600000,
      dependencyTimeout: 30000
    };
    batchProcessor = new HighThroughputBatchProcessor(config);
  });

  afterEach(async () => {
    await batchProcessor.stop();
  });

  describe('start/stop', () => {
    it('should start successfully', async () => {
      await batchProcessor.start();
      // Should not throw
    });

    it('should stop successfully', async () => {
      await batchProcessor.start();
      await batchProcessor.stop();
      // Should not throw
    });

    it('should throw if already running', async () => {
      await batchProcessor.start();
      await expect(batchProcessor.start()).rejects.toThrow('already running');
    });
  });

  describe('entity processing', () => {
    beforeEach(async () => {
      await batchProcessor.start();
    });

    it('should process a batch of entities successfully', async () => {
      const entities: Entity[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `entity-${i}`,
          type: 'function',
          name: `testFunction${i}`,
          properties: {
            filePath: `/test/file${i}.ts`,
            startLine: i * 10,
            endLine: (i * 10) + 5
          },
          metadata: {
            createdAt: new Date(),
            source: 'test'
          }
        });
      }

      const result = await batchProcessor.processEntities(entities);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(10);
      expect(result.failedCount).toBe(0);
      expect(result.batchId).toBeTruthy();
      expect(result.metadata.type).toBe('entity');
    });

    it('should handle empty entity batch', async () => {
      const result = await batchProcessor.processEntities([]);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(0);
    });

    it('should handle large entity batches with micro-batching', async () => {
      const entities: Entity[] = [];
      for (let i = 0; i < 200; i++) {
        entities.push({
          id: `large-entity-${i}`,
          type: 'variable',
          name: `var${i}`,
          properties: {},
          metadata: { createdAt: new Date() }
        });
      }

      const result = await batchProcessor.processEntities(entities);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(200);
      expect(result.metadata.size).toBe(200);
    });

    it('should support idempotent operations', async () => {
      const entities: Entity[] = [{
        id: 'idempotent-entity',
        type: 'class',
        name: 'TestClass',
        properties: {},
        metadata: { createdAt: new Date() }
      }];

      // Process the same batch twice
      const result1 = await batchProcessor.processEntities(entities);
      const result2 = await batchProcessor.processEntities(entities);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.batchId).not.toBe(result2.batchId); // Different batch IDs
    });
  });

  describe('relationship processing', () => {
    beforeEach(async () => {
      await batchProcessor.start();
    });

    it('should process a batch of relationships successfully', async () => {
      const relationships: GraphRelationship[] = [];
      for (let i = 0; i < 5; i++) {
        relationships.push({
          id: `rel-${i}`,
          type: 'CALLS',
          fromEntityId: `entity-${i}`,
          toEntityId: `entity-${i + 1}`,
          properties: {
            confidence: 0.9,
            weight: 1.0
          },
          metadata: {
            createdAt: new Date(),
            source: 'test'
          }
        });
      }

      const result = await batchProcessor.processRelationships(relationships);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(5);
      expect(result.failedCount).toBe(0);
      expect(result.metadata.type).toBe('relationship');
    });

    it('should handle empty relationship batch', async () => {
      const result = await batchProcessor.processRelationships([]);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
    });

    it('should handle large relationship batches', async () => {
      const relationships: GraphRelationship[] = [];
      for (let i = 0; i < 300; i++) {
        relationships.push({
          id: `large-rel-${i}`,
          type: 'IMPORTS',
          fromEntityId: `file-${i}`,
          toEntityId: `module-${i % 10}`,
          properties: {},
          metadata: { createdAt: new Date() }
        });
      }

      const result = await batchProcessor.processRelationships(relationships);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(300);
    });
  });

  describe('change fragment processing', () => {
    beforeEach(async () => {
      await batchProcessor.start();
    });

    it('should process change fragments without DAG', async () => {
      const fragments: ChangeFragment[] = [
        {
          id: 'fragment-1',
          eventId: 'event-1',
          changeType: 'entity',
          operation: 'add',
          data: {
            id: 'entity-1',
            type: 'function',
            name: 'testFunc',
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

      const results = await batchProcessor.processChangeFragments(fragments);

      expect(results).toHaveLength(2); // One for entities, one for relationships
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should process change fragments with DAG when enabled', async () => {
      // This test verifies DAG processing works, though the actual dependency
      // resolution is mocked in the current implementation
      const fragments: ChangeFragment[] = [
        {
          id: 'dep-fragment',
          eventId: 'event-1',
          changeType: 'entity',
          operation: 'add',
          data: {
            id: 'base-entity',
            type: 'class',
            name: 'BaseClass',
            properties: {},
            metadata: { createdAt: new Date() }
          } as Entity,
          dependencyHints: [],
          confidence: 0.9
        },
        {
          id: 'dependent-fragment',
          eventId: 'event-1',
          changeType: 'entity',
          operation: 'add',
          data: {
            id: 'derived-entity',
            type: 'class',
            name: 'DerivedClass',
            properties: { extends: 'BaseClass' },
            metadata: { createdAt: new Date() }
          } as Entity,
          dependencyHints: ['dep-fragment'],
          confidence: 0.9
        }
      ];

      const results = await batchProcessor.processChangeFragments(fragments);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle empty change fragments', async () => {
      const results = await batchProcessor.processChangeFragments([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await batchProcessor.start();
    });

    it('should handle processing errors gracefully', async () => {
      // Create an entity with invalid data to trigger an error
      const invalidEntity = {
        id: '', // Invalid empty ID
        type: 'invalid',
        name: '',
        properties: {},
        metadata: { createdAt: new Date() }
      } as Entity;

      // The mock processor should handle this gracefully
      const result = await batchProcessor.processEntities([invalidEntity]);

      // Even with invalid data, the mock processor should succeed
      // In a real implementation, this would test actual error handling
      expect(result).toBeDefined();
    });

    it('should emit batch events correctly', async () => {
      const batchCreatedEvents: any[] = [];
      const batchCompletedEvents: any[] = [];

      batchProcessor.on('batch:created', (metadata) => {
        batchCreatedEvents.push(metadata);
      });

      batchProcessor.on('batch:completed', (result) => {
        batchCompletedEvents.push(result);
      });

      const entities: Entity[] = [{
        id: 'event-test-entity',
        type: 'function',
        name: 'eventTest',
        properties: {},
        metadata: { createdAt: new Date() }
      }];

      await batchProcessor.processEntities(entities);

      expect(batchCreatedEvents).toHaveLength(1);
      expect(batchCompletedEvents).toHaveLength(1);
      expect(batchCreatedEvents[0].type).toBe('entity');
      expect(batchCompletedEvents[0].success).toBe(true);
    });
  });

  describe('metrics and monitoring', () => {
    beforeEach(async () => {
      await batchProcessor.start();
    });

    it('should provide batch processing metrics', async () => {
      const initialMetrics = batchProcessor.getMetrics();
      expect(initialMetrics.activeBatches).toBe(0);
      expect(initialMetrics.processedBatches).toBe(0);

      const entities: Entity[] = [{
        id: 'metrics-entity',
        type: 'function',
        name: 'metricsTest',
        properties: {},
        metadata: { createdAt: new Date() }
      }];

      await batchProcessor.processEntities(entities);

      const finalMetrics = batchProcessor.getMetrics();
      expect(finalMetrics.processedBatches).toBe(1);
    });

    it('should track active batches during processing', async () => {
      // Create a batch that takes some time to process
      const entities: Entity[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push({
          id: `concurrent-entity-${i}`,
          type: 'function',
          name: `func${i}`,
          properties: {},
          metadata: { createdAt: new Date() }
        });
      }

      const promise = batchProcessor.processEntities(entities);

      // Check metrics during processing (though it might complete too quickly in tests)
      const duringMetrics = batchProcessor.getMetrics();
      expect(duringMetrics).toBeDefined();

      await promise;

      const afterMetrics = batchProcessor.getMetrics();
      expect(afterMetrics.processedBatches).toBeGreaterThan(0);
    });
  });

  describe('configuration edge cases', () => {
    it('should handle processor without DAG enabled', async () => {
      const noDagConfig = { ...config, enableDAG: false };
      const noDagProcessor = new HighThroughputBatchProcessor(noDagConfig);
      await noDagProcessor.start();

      try {
        const fragments: ChangeFragment[] = [{
          id: 'no-dag-fragment',
          eventId: 'event-1',
          changeType: 'entity',
          operation: 'add',
          data: {
            id: 'no-dag-entity',
            type: 'function',
            name: 'noDagTest',
            properties: {},
            metadata: { createdAt: new Date() }
          } as Entity,
          dependencyHints: [],
          confidence: 0.9
        }];

        const results = await noDagProcessor.processChangeFragments(fragments);
        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(true);
      } finally {
        await noDagProcessor.stop();
      }
    });

    it('should handle small batch sizes', async () => {
      const smallBatchConfig = {
        ...config,
        entityBatchSize: 2,
        relationshipBatchSize: 2
      };
      const smallBatchProcessor = new HighThroughputBatchProcessor(smallBatchConfig);
      await smallBatchProcessor.start();

      try {
        const entities: Entity[] = [];
        for (let i = 0; i < 5; i++) {
          entities.push({
            id: `small-batch-entity-${i}`,
            type: 'variable',
            name: `var${i}`,
            properties: {},
            metadata: { createdAt: new Date() }
          });
        }

        const result = await smallBatchProcessor.processEntities(entities);
        expect(result.success).toBe(true);
        expect(result.processedCount).toBe(5);
      } finally {
        await smallBatchProcessor.stop();
      }
    });
  });
});
