/**
 * Integration Tests for High-Throughput Ingestion Pipeline
 * Tests end-to-end file processing workflow with real and mock services
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

import { HighThroughputIngestionPipeline } from '../../src/ingestion/pipeline.js';
import { createKnowledgeGraphAdapter } from '../../src/ingestion/knowledge-graph-adapter.js';
import { PipelineConfig } from '../../src/ingestion/types.js';
import { Entity } from '../../../models/entities.js';
import { GraphRelationship } from '../../../models/relationships.js';

// Test utilities
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestFile {
  path: string;
  content: string;
  expectedEntities: number;
  expectedRelationships: number;
}

class MockKnowledgeGraphService {
  public createdEntities: Entity[] = [];
  public createdRelationships: GraphRelationship[] = [];
  public createdEmbeddings: any[] = [];
  public callHistory: Array<{ method: string; args: any[] }> = [];

  async createEntitiesBulk(entities: Entity[], options: any = {}): Promise<any> {
    this.callHistory.push({ method: 'createEntitiesBulk', args: [entities, options] });
    this.createdEntities.push(...entities);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

    return {
      success: true,
      processed: entities.length,
      failed: 0,
      results: entities.map(e => ({ entity: e, success: true }))
    };
  }

  async createRelationshipsBulk(relationships: GraphRelationship[], options: any = {}): Promise<any> {
    this.callHistory.push({ method: 'createRelationshipsBulk', args: [relationships, options] });
    this.createdRelationships.push(...relationships);

    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15));

    return {
      success: true,
      processed: relationships.length,
      failed: 0,
      results: relationships.map(r => ({ relationship: r, success: true }))
    };
  }

  async createEmbeddingsBatch(entities: Entity[], options: any = {}): Promise<any> {
    this.callHistory.push({ method: 'createEmbeddingsBatch', args: [entities, options] });
    this.createdEmbeddings.push(...entities);

    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));

    return {
      success: true,
      processed: entities.length,
      failed: 0,
      results: entities.map(e => ({
        entity: e,
        success: true,
        embedding: new Array(768).fill(0).map(() => Math.random())
      }))
    };
  }

  reset(): void {
    this.createdEntities = [];
    this.createdRelationships = [];
    this.createdEmbeddings = [];
    this.callHistory = [];
  }

  getStats(): any {
    return {
      entitiesCreated: this.createdEntities.length,
      relationshipsCreated: this.createdRelationships.length,
      embeddingsCreated: this.createdEmbeddings.length,
      methodCalls: this.callHistory.length
    };
  }
}

describe('Pipeline Integration Tests', () => {
  let testDir: string;
  let mockService: MockKnowledgeGraphService;
  let pipeline: HighThroughputIngestionPipeline;

  beforeEach(async () => {
    // Create temporary directory for test files
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'pipeline-test-'));

    // Reset mock service
    mockService = new MockKnowledgeGraphService();
  });

  afterEach(async () => {
    // Clean up pipeline
    if (pipeline) {
      await pipeline.stop();
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  const createTestPipeline = (config: Partial<PipelineConfig> = {}): HighThroughputIngestionPipeline => {
    const defaultConfig: PipelineConfig = {
      batchSize: 50,
      maxConcurrency: 2,
      workers: {
        parsers: 1,
        entityWorkers: 2,
        relationshipWorkers: 2,
        embeddingWorkers: 1
      },
      queues: {
        maxSize: 1000,
        partitions: 2,
        persistenceConfig: {
          enabled: false
        }
      },
      batching: {
        entityBatchSize: 25,
        relationshipBatchSize: 25,
        embeddingBatchSize: 10,
        maxConcurrentBatches: 2,
        flushInterval: 500,
        idempotencyTTL: 30000
      },
      enrichment: {
        enableEmbeddings: true,
        batchSize: 10,
        maxConcurrentEnrichments: 1
      },
      monitoring: {
        metricsInterval: 1000,
        healthCheckInterval: 5000,
        alertThresholds: {
          queueDepth: 500,
          errorRate: 0.1,
          latency: 5000
        }
      },
      ...config
    };

    const adapter = createKnowledgeGraphAdapter(mockService);
    return new HighThroughputIngestionPipeline(defaultConfig, adapter);
  };

  const createTestFiles = async (files: TestFile[]): Promise<string[]> => {
    const filePaths: string[] = [];

    for (const file of files) {
      const filePath = path.join(testDir, file.path);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file content
      await fs.writeFile(filePath, file.content, 'utf-8');
      filePaths.push(filePath);
    }

    return filePaths;
  };

  test('should process a single TypeScript file', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'test.ts',
        content: `
import { Component } from 'react';

export class TestComponent extends Component {
  private value: string = 'test';

  public getValue(): string {
    return this.value;
  }

  public setValue(newValue: string): void {
    this.value = newValue;
  }
}

export interface TestInterface {
  id: string;
  name: string;
}

export function testFunction(input: TestInterface): string {
  return input.name;
}
        `,
        expectedEntities: 6, // file, class, 2 methods, interface, function
        expectedRelationships: 5 // various relationships
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline();

    const events: any[] = [];
    pipeline.on('batch:completed', (data) => events.push({ type: 'batch:completed', data }));
    pipeline.on('error', (error) => events.push({ type: 'error', error }));

    await pipeline.start();

    // Process the file
    await pipeline.processFile(filePaths[0]);

    // Wait for processing to complete
    await pipeline.waitForCompletion();

    // Verify entities were created
    expect(mockService.createdEntities.length).toBeGreaterThan(0);
    console.log(`Created ${mockService.createdEntities.length} entities`);

    // Verify relationships were created
    expect(mockService.createdRelationships.length).toBeGreaterThan(0);
    console.log(`Created ${mockService.createdRelationships.length} relationships`);

    // Verify no errors occurred
    const errorEvents = events.filter(e => e.type === 'error');
    expect(errorEvents).toHaveLength(0);

    await pipeline.stop();
  });

  test('should process multiple files concurrently', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'module1.ts',
        content: `
export class Module1Class {
  public method1(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      },
      {
        path: 'module2.ts',
        content: `
import { Module1Class } from './module1';

export class Module2Class extends Module1Class {
  public method2(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 2
      },
      {
        path: 'utils.ts',
        content: `
export function utilityFunction(input: string): string {
  return input.toUpperCase();
}

export const CONSTANT_VALUE = 'test';
        `,
        expectedEntities: 3,
        expectedRelationships: 1
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline({ maxConcurrency: 3 });

    const events: any[] = [];
    pipeline.on('batch:completed', (data) => events.push({ type: 'batch:completed', data }));
    pipeline.on('parse:error', (error) => events.push({ type: 'parse:error', error }));

    await pipeline.start();

    // Process all files concurrently
    const processPromises = filePaths.map(filePath => pipeline.processFile(filePath));
    await Promise.all(processPromises);

    // Wait for processing to complete
    await pipeline.waitForCompletion();

    // Verify entities from all files were created
    expect(mockService.createdEntities.length).toBeGreaterThan(testFiles.length * 2);

    // Verify we processed all files
    const fileEntities = mockService.createdEntities.filter(e => e.type === 'file');
    expect(fileEntities).toHaveLength(testFiles.length);

    // Verify relationships were created
    expect(mockService.createdRelationships.length).toBeGreaterThan(0);

    await pipeline.stop();
  });

  test('should handle parsing errors gracefully', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'valid.ts',
        content: `
export class ValidClass {
  public method(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      },
      {
        path: 'invalid.ts',
        content: `
export class InvalidClass {
  public method(: void {}  // Syntax error
}
        `,
        expectedEntities: 0,
        expectedRelationships: 0
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline();

    const events: any[] = [];
    pipeline.on('batch:completed', (data) => events.push({ type: 'batch:completed', data }));
    pipeline.on('parse:error', (error) => events.push({ type: 'parse:error', error }));

    await pipeline.start();

    // Process both files
    for (const filePath of filePaths) {
      await pipeline.processFile(filePath);
    }

    await pipeline.waitForCompletion();

    // Should have some entities from the valid file
    expect(mockService.createdEntities.length).toBeGreaterThan(0);

    // Should have recorded parse errors
    const parseErrors = events.filter(e => e.type === 'parse:error');
    expect(parseErrors.length).toBeGreaterThan(0);

    await pipeline.stop();
  });

  test('should process files with embeddings enabled', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'with-embeddings.ts',
        content: `
export class ComponentWithDocs {
  /**
   * This is a well-documented method that does something important
   */
  public importantMethod(): void {
    console.log('Important functionality');
  }
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline({
      enrichment: {
        enableEmbeddings: true,
        batchSize: 5,
        maxConcurrentEnrichments: 1
      }
    });

    const events: any[] = [];
    pipeline.on('batch:completed', (data) => events.push({ type: 'batch:completed', data }));
    pipeline.on('embedding:completed', (data) => events.push({ type: 'embedding:completed', data }));

    await pipeline.start();

    await pipeline.processFile(filePaths[0]);
    await pipeline.waitForCompletion();

    // Should have created entities
    expect(mockService.createdEntities.length).toBeGreaterThan(0);

    // Should have processed embeddings
    expect(mockService.createdEmbeddings.length).toBeGreaterThan(0);

    // Should have embedding completion events
    const embeddingEvents = events.filter(e => e.type === 'embedding:completed');
    expect(embeddingEvents.length).toBeGreaterThan(0);

    await pipeline.stop();
  });

  test('should handle high throughput with batching', async () => {
    // Create many small files to test batching
    const testFiles: TestFile[] = [];
    for (let i = 0; i < 20; i++) {
      testFiles.push({
        path: `file${i}.ts`,
        content: `
export class Class${i} {
  public method${i}(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      });
    }

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline({
      batchSize: 100,
      maxConcurrency: 4,
      batching: {
        entityBatchSize: 10,
        relationshipBatchSize: 10,
        embeddingBatchSize: 5,
        maxConcurrentBatches: 2,
        flushInterval: 200,
        idempotencyTTL: 30000
      }
    });

    const startTime = Date.now();
    const events: any[] = [];
    pipeline.on('batch:completed', (data) => events.push({ type: 'batch:completed', data }));

    await pipeline.start();

    // Process all files
    const processPromises = filePaths.map(filePath => pipeline.processFile(filePath));
    await Promise.all(processPromises);

    await pipeline.waitForCompletion();
    const endTime = Date.now();

    const processingTime = endTime - startTime;
    console.log(`Processed ${testFiles.length} files in ${processingTime}ms`);

    // Verify all files were processed
    const fileEntities = mockService.createdEntities.filter(e => e.type === 'file');
    expect(fileEntities).toHaveLength(testFiles.length);

    // Verify batch processing was used
    expect(mockService.callHistory.some(call =>
      call.method === 'createEntitiesBulk' && call.args[0].length > 1
    )).toBe(true);

    // Performance expectation: should process files relatively quickly
    expect(processingTime).toBeLessThan(30000); // 30 seconds max

    await pipeline.stop();
  });

  test('should provide accurate metrics', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'metrics-test.ts',
        content: `
export class MetricsTest {
  public method1(): void {}
  public method2(): string { return 'test'; }
}

export interface TestInterface {
  prop1: string;
  prop2: number;
}
        `,
        expectedEntities: 4,
        expectedRelationships: 3
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline();

    const metrics: any[] = [];
    pipeline.on('metrics:updated', (data) => metrics.push(data));

    await pipeline.start();

    await pipeline.processFile(filePaths[0]);
    await pipeline.waitForCompletion();

    const finalMetrics = pipeline.getMetrics();

    // Verify metrics are populated
    expect(finalMetrics.totalEvents).toBeGreaterThan(0);
    expect(finalMetrics.eventsPerSecond).toBeGreaterThanOrEqual(0);
    expect(finalMetrics.averageLatency).toBeGreaterThanOrEqual(0);

    await pipeline.stop();
  });

  test('should handle pipeline shutdown gracefully', async () => {
    const testFiles: TestFile[] = [
      {
        path: 'shutdown-test.ts',
        content: `
export class ShutdownTest {
  public method(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    pipeline = createTestPipeline();

    await pipeline.start();

    // Start processing
    const processPromise = pipeline.processFile(filePaths[0]);

    // Stop pipeline before processing completes
    await pipeline.stop();

    // Process promise should still resolve/reject gracefully
    try {
      await processPromise;
    } catch (error) {
      // It's okay if processing was interrupted
    }

    // Pipeline should be in stopped state
    expect(pipeline.getState().status).toBe('stopped');
  });

  test('should retry failed operations', async () => {
    // Create a mock service that fails sometimes
    const flakyService = {
      ...mockService,
      createEntitiesBulk: vi.fn().mockImplementation(async (entities: Entity[], options: any = {}) => {
        // Fail 30% of the time
        if (Math.random() < 0.3) {
          throw new Error('Simulated service failure');
        }
        return mockService.createEntitiesBulk(entities, options);
      })
    };

    const testFiles: TestFile[] = [
      {
        path: 'retry-test.ts',
        content: `
export class RetryTest {
  public method(): void {}
}
        `,
        expectedEntities: 2,
        expectedRelationships: 1
      }
    ];

    const filePaths = await createTestFiles(testFiles);
    const adapter = createKnowledgeGraphAdapter(flakyService);

    pipeline = new HighThroughputIngestionPipeline({
      batchSize: 10,
      maxConcurrency: 1,
      workers: {
        parsers: 1,
        entityWorkers: 1,
        relationshipWorkers: 1,
        embeddingWorkers: 1
      },
      queues: {
        maxSize: 100,
        partitions: 1,
        persistenceConfig: { enabled: false }
      },
      batching: {
        entityBatchSize: 5,
        relationshipBatchSize: 5,
        embeddingBatchSize: 5,
        maxConcurrentBatches: 1,
        flushInterval: 1000,
        idempotencyTTL: 30000
      },
      enrichment: {
        enableEmbeddings: false,
        batchSize: 5,
        maxConcurrentEnrichments: 1
      },
      monitoring: {
        metricsInterval: 1000,
        healthCheckInterval: 5000,
        alertThresholds: {
          queueDepth: 50,
          errorRate: 0.5,
          latency: 5000
        }
      }
    }, adapter);

    const events: any[] = [];
    pipeline.on('error', (error) => events.push({ type: 'error', error }));

    await pipeline.start();

    try {
      await pipeline.processFile(filePaths[0]);
      await pipeline.waitForCompletion();

      // Should eventually succeed despite some failures
      expect(mockService.createdEntities.length).toBeGreaterThan(0);

    } finally {
      await pipeline.stop();
    }
  });
});

describe('Pipeline Performance Tests', () => {
  let testDir: string;
  let mockService: MockKnowledgeGraphService;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'pipeline-perf-test-'));
    mockService = new MockKnowledgeGraphService();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  test('should achieve target throughput for large files', async () => {
    // Create a larger file with many entities
    const largeFileContent = `
import { Component } from 'react';

${Array.from({ length: 50 }, (_, i) => `
export class Component${i} {
  private value${i}: string = 'test${i}';

  public getValue${i}(): string {
    return this.value${i};
  }

  public setValue${i}(newValue: string): void {
    this.value${i} = newValue;
  }
}

export interface Interface${i} {
  id${i}: string;
  name${i}: string;
}

export function function${i}(input: Interface${i}): string {
  return input.name${i};
}
`).join('\n')}
    `;

    const testFiles: TestFile[] = [
      {
        path: 'large-file.ts',
        content: largeFileContent,
        expectedEntities: 300, // 50 * 6 entities per iteration
        expectedRelationships: 200
      }
    ];

    const filePaths = await createTestFiles(testFiles);

    const pipeline = new HighThroughputIngestionPipeline({
      batchSize: 200,
      maxConcurrency: 4,
      workers: {
        parsers: 2,
        entityWorkers: 4,
        relationshipWorkers: 4,
        embeddingWorkers: 2
      },
      queues: {
        maxSize: 2000,
        partitions: 4,
        persistenceConfig: { enabled: false }
      },
      batching: {
        entityBatchSize: 50,
        relationshipBatchSize: 50,
        embeddingBatchSize: 25,
        maxConcurrentBatches: 4,
        flushInterval: 500,
        idempotencyTTL: 60000
      },
      enrichment: {
        enableEmbeddings: false, // Disable for performance test
        batchSize: 25,
        maxConcurrentEnrichments: 2
      },
      monitoring: {
        metricsInterval: 2000,
        healthCheckInterval: 10000,
        alertThresholds: {
          queueDepth: 1000,
          errorRate: 0.1,
          latency: 10000
        }
      }
    }, createKnowledgeGraphAdapter(mockService));

    const startTime = Date.now();

    await pipeline.start();
    await pipeline.processFile(filePaths[0]);
    await pipeline.waitForCompletion();

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    await pipeline.stop();

    // Calculate throughput
    const entitiesPerSecond = mockService.createdEntities.length / (processingTime / 1000);

    console.log(`Performance Test Results:`);
    console.log(`  Processing Time: ${processingTime}ms`);
    console.log(`  Entities Created: ${mockService.createdEntities.length}`);
    console.log(`  Relationships Created: ${mockService.createdRelationships.length}`);
    console.log(`  Entities/sec: ${entitiesPerSecond.toFixed(2)}`);

    // Performance expectations
    expect(mockService.createdEntities.length).toBeGreaterThan(200);
    expect(entitiesPerSecond).toBeGreaterThan(50); // At least 50 entities per second
    expect(processingTime).toBeLessThan(60000); // Complete within 60 seconds
  });
});