/**
 * OGM Test Utilities
 * Helper functions specifically for testing OGM services and migration
 */

import { DatabaseService } from "@memento/database";
import { NeogmaService } from "@memento/knowledge/graph/NeogmaService";
import { EntityServiceOGM } from "@memento/knowledge/graph/EntityServiceOGM";
import { RelationshipServiceOGM } from "@memento/knowledge/graph/RelationshipServiceOGM";
import { SearchServiceOGM } from "@memento/knowledge/graph/SearchServiceOGM";
import { EmbeddingService } from "@memento/knowledge/embeddings/EmbeddingService";
import { KnowledgeGraphService } from "@memento/knowledge/orchestration/KnowledgeGraphService";
import { CodebaseEntity, RelationshipType, GraphRelationship } from "@memento/shared-types";
import { TestIsolationContext } from "./database-helpers";

export interface OGMTestSetup {
  neogmaService: NeogmaService;
  entityService: EntityServiceOGM;
  relationshipService: RelationshipServiceOGM;
  searchService: SearchServiceOGM;
  embeddingService: EmbeddingService;
}

// @deprecated Legacy comparison interface - no longer needed after OGM migration
export interface ComparisonTestSetup extends OGMTestSetup {
  legacyKgService: KnowledgeGraphService;
}

/**
 * Initialize OGM services for testing
 */
export async function setupOGMServices(
  dbService: DatabaseService,
  _testContext?: TestIsolationContext
): Promise<OGMTestSetup> {
  // Initialize NeogmaService
  const neogmaService = new NeogmaService(dbService.getConfig().neo4j);
  await neogmaService.initialize();

  // Initialize EmbeddingService
  const embeddingService = new EmbeddingService({
    openai: { apiKey: "test-key" },
    qdrant: dbService.qdrant,
  });

  // Initialize OGM services
  const entityService = new EntityServiceOGM(neogmaService);
  const relationshipService = new RelationshipServiceOGM(neogmaService);
  const searchService = new SearchServiceOGM(neogmaService, embeddingService);

  return {
    neogmaService,
    entityService,
    relationshipService,
    searchService,
    embeddingService,
  };
}

/**
 * Initialize both OGM and legacy services for comparison testing
 * @deprecated Use setupOGMServices instead - legacy comparison no longer needed
 */
export async function setupComparisonServices(
  dbService: DatabaseService,
  testContext?: TestIsolationContext
): Promise<ComparisonTestSetup> {
  const ogmServices = await setupOGMServices(dbService, testContext);

  // Initialize legacy KnowledgeGraphService
  const legacyKgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
  await legacyKgService.initialize();

  return {
    ...ogmServices,
    legacyKgService,
  };
}

/**
 * Generate test entity data with consistent patterns
 */
export function generateTestEntity(
  id: string,
  options: {
    type?: string;
    language?: string;
    size?: number;
    lines?: number;
    path?: string;
    hash?: string;
    isTest?: boolean;
    metadata?: Record<string, any>;
  } = {}
): CodebaseEntity {
  const timestamp = new Date();

  return {
    id,
    path: options.path || `src/test/${id}.ts`,
    hash: options.hash || `hash-${id}`,
    language: options.language || "typescript",
    lastModified: timestamp,
    created: timestamp,
    type: options.type || "file",
    size: options.size || 1024,
    lines: options.lines || 50,
    isTest: options.isTest || false,
    isConfig: false,
    metadata: options.metadata || {},
    ...options,
  } as CodebaseEntity;
}

/**
 * Generate test relationship data
 */
export function generateTestRelationship(
  id: string,
  fromEntityId: string,
  toEntityId: string,
  options: {
    type?: RelationshipType;
    metadata?: Record<string, any>;
    evidence?: any[];
    locations?: any[];
    confidence?: number;
  } = {}
): GraphRelationship {
  const timestamp = new Date();

  return {
    id,
    fromEntityId,
    toEntityId,
    type: options.type || RelationshipType.CALLS,
    created: timestamp,
    lastModified: timestamp,
    version: 1,
    metadata: options.metadata || {},
    evidence: options.evidence || [],
    locations: options.locations || [],
    confidence: options.confidence || 1.0,
    active: true,
    ...options,
  };
}

/**
 * Generate batch of test entities
 */
export function generateTestEntitiesBatch(
  count: number,
  baseId: string,
  options: Parameters<typeof generateTestEntity>[1] = {}
): CodebaseEntity[] {
  return Array.from({ length: count }, (_, i) =>
    generateTestEntity(`${baseId}-${i}`, {
      ...options,
      path: options.path || `src/batch/${baseId}/file${i}.ts`,
      hash: options.hash || `${baseId}-${i}-hash`,
      size: (options.size || 512) + i * 10,
      lines: (options.lines || 25) + i * 2,
    })
  );
}

/**
 * Generate batch of test relationships
 */
export function generateTestRelationshipsBatch(
  entities: CodebaseEntity[],
  baseId: string,
  options: Parameters<typeof generateTestRelationship>[3] = {}
): GraphRelationship[] {
  const relationships: GraphRelationship[] = [];

  for (let i = 0; i < entities.length - 1; i++) {
    relationships.push(
      generateTestRelationship(
        `${baseId}-rel-${i}`,
        entities[i].id,
        entities[i + 1].id,
        {
          ...options,
          type: i % 2 === 0 ? RelationshipType.CALLS : RelationshipType.REFERENCES,
        }
      )
    );
  }

  return relationships;
}

/**
 * Performance measurement utilities
 */
export interface PerformanceMetric {
  operation: string;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  success: boolean;
  error?: string;
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];

  async measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const memoryBefore = process.memoryUsage();
    const start = performance.now();

    let result: T;
    let success = true;
    let error: string | undefined;

    try {
      result = await fn();
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      const duration = performance.now() - start;
      const memoryAfter = process.memoryUsage();

      const metric: PerformanceMetric = {
        operation,
        duration,
        memoryBefore,
        memoryAfter,
        success,
        error,
      };

      this.metrics.push(metric);
    }

    return { result: result!, metric: this.metrics[this.metrics.length - 1] };
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsForOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  getAveragePerformance(operation: string): {
    avgDuration: number;
    avgMemoryDelta: number;
    successRate: number;
    operationCount: number;
  } {
    const operationMetrics = this.getMetricsForOperation(operation);

    if (operationMetrics.length === 0) {
      return {
        avgDuration: 0,
        avgMemoryDelta: 0,
        successRate: 0,
        operationCount: 0,
      };
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalMemoryDelta = operationMetrics.reduce(
      (sum, m) => sum + (m.memoryAfter.heapUsed - m.memoryBefore.heapUsed),
      0
    );
    const successCount = operationMetrics.filter(m => m.success).length;

    return {
      avgDuration: totalDuration / operationMetrics.length,
      avgMemoryDelta: totalMemoryDelta / operationMetrics.length,
      successRate: successCount / operationMetrics.length,
      operationCount: operationMetrics.length,
    };
  }

  clear(): void {
    this.metrics = [];
  }

  generateReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];

    let report = "\n=== Performance Tracker Report ===\n";

    operations.forEach(operation => {
      const perf = this.getAveragePerformance(operation);
      report += `\n${operation}:\n`;
      report += `  Operations: ${perf.operationCount}\n`;
      report += `  Avg Duration: ${perf.avgDuration.toFixed(2)}ms\n`;
      report += `  Avg Memory Delta: ${(perf.avgMemoryDelta / 1024 / 1024).toFixed(2)}MB\n`;
      report += `  Success Rate: ${(perf.successRate * 100).toFixed(1)}%\n`;
    });

    report += "\n================================\n";
    return report;
  }
}

/**
 * Compare operation results between legacy and OGM implementations
 * @deprecated Legacy comparison function - no longer needed after OGM migration
 */
export async function compareImplementations<T>(
  operationName: string,
  legacyOperation: () => Promise<T>,
  ogmOperation: () => Promise<T>,
  validator?: (legacy: T, ogm: T) => boolean | string
): Promise<{
  success: boolean;
  legacy: T | null;
  ogm: T | null;
  legacyError?: Error;
  ogmError?: Error;
  validationResult?: boolean | string;
  legacyDuration: number;
  ogmDuration: number;
}> {
  let legacy: T | null = null;
  let ogm: T | null = null;
  let legacyError: Error | undefined;
  let ogmError: Error | undefined;

  // Measure legacy operation
  const legacyStart = performance.now();
  try {
    legacy = await legacyOperation();
  } catch (error) {
    legacyError = error instanceof Error ? error : new Error(String(error));
  }
  const legacyDuration = performance.now() - legacyStart;

  // Measure OGM operation
  const ogmStart = performance.now();
  try {
    ogm = await ogmOperation();
  } catch (error) {
    ogmError = error instanceof Error ? error : new Error(String(error));
  }
  const ogmDuration = performance.now() - ogmStart;

  // Validate results if validator provided
  let validationResult: boolean | string | undefined;
  if (validator && legacy !== null && ogm !== null) {
    validationResult = validator(legacy, ogm);
  }

  const success = !legacyError && !ogmError && (!validator || validationResult === true);

  return {
    success,
    legacy,
    ogm,
    legacyError,
    ogmError,
    validationResult,
    legacyDuration,
    ogmDuration,
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Force garbage collection if available
 */
export function forceGC(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Generate realistic test data for performance testing
 */
export function generateRealisticTestData(scale: 'small' | 'medium' | 'large' = 'medium') {
  const scales = {
    small: { entities: 50, relationships: 100 },
    medium: { entities: 500, relationships: 1000 },
    large: { entities: 2000, relationships: 5000 },
  };

  const config = scales[scale];

  // Generate entities representing a realistic codebase
  const entities: CodebaseEntity[] = [];
  const relationships: GraphRelationship[] = [];

  // Files
  for (let i = 0; i < config.entities * 0.7; i++) {
    entities.push(generateTestEntity(`file-${i}`, {
      type: "file",
      language: i % 3 === 0 ? "typescript" : i % 3 === 1 ? "javascript" : "python",
      path: `src/${Math.floor(i / 10)}/file${i}.ts`,
      size: 500 + Math.random() * 2000,
      lines: 20 + Math.random() * 100,
    }));
  }

  // Symbols
  for (let i = 0; i < config.entities * 0.2; i++) {
    entities.push(generateTestEntity(`symbol-${i}`, {
      type: "symbol",
      kind: i % 2 === 0 ? "function" : "class",
      path: `src/symbols/symbol${i}.ts`,
      signature: i % 2 === 0 ? `function symbol${i}(): void` : `class Symbol${i}`,
    }));
  }

  // Tests
  for (let i = 0; i < config.entities * 0.1; i++) {
    entities.push(generateTestEntity(`test-${i}`, {
      type: "test",
      path: `tests/test${i}.test.ts`,
      isTest: true,
    }));
  }

  // Generate realistic relationships
  for (let i = 0; i < config.relationships; i++) {
    const fromEntity = entities[Math.floor(Math.random() * entities.length)];
    const toEntity = entities[Math.floor(Math.random() * entities.length)];

    if (fromEntity.id !== toEntity.id) {
      const relationshipTypes = [
        RelationshipType.CALLS,
        RelationshipType.REFERENCES,
        RelationshipType.IMPORTS,
        RelationshipType.CONTAINS,
        RelationshipType.DEPENDS_ON,
      ];

      relationships.push(generateTestRelationship(
        `realistic-rel-${i}`,
        fromEntity.id,
        toEntity.id,
        {
          type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
          confidence: 0.7 + Math.random() * 0.3,
          metadata: {
            source: "realistic-test-data",
            line: Math.floor(Math.random() * 100) + 1,
          },
        }
      ));
    }
  }

  return { entities, relationships };
}

/**
 * Cleanup test data
 * @deprecated Use OGM services directly for cleanup instead
 */
export async function cleanupTestData(
  services: Partial<ComparisonTestSetup>,
  entityIds: string[],
  relationshipIds: string[]
): Promise<void> {
  // Clean up entities with OGM services only (legacy service no longer used)
  for (const id of entityIds) {
    try {
      if (services.entityService) {
        await services.entityService.deleteEntity(id);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Relationships are typically deleted with entities, but clean up explicitly if needed
  for (const id of relationshipIds) {
    try {
      // Note: deleteRelationship requires fromId, toId, and type
      // In practice, relationships are usually cleaned up with entities
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Assert that two objects have equivalent properties
 */
export function assertEquivalent(
  actual: any,
  expected: any,
  path: string = "root"
): void {
  if (actual === expected) return;

  if (typeof actual !== typeof expected) {
    throw new Error(`Type mismatch at ${path}: ${typeof actual} !== ${typeof expected}`);
  }

  if (actual instanceof Date && expected instanceof Date) {
    if (Math.abs(actual.getTime() - expected.getTime()) > 1000) {
      throw new Error(`Date mismatch at ${path}: ${actual.toISOString()} !== ${expected.toISOString()}`);
    }
    return;
  }

  if (typeof actual === "object" && actual !== null && expected !== null) {
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);

    for (const key of expectedKeys) {
      if (!(key in actual)) {
        throw new Error(`Missing property at ${path}.${key}`);
      }
      assertEquivalent(actual[key], expected[key], `${path}.${key}`);
    }

    return;
  }

  if (actual !== expected) {
    throw new Error(`Value mismatch at ${path}: ${actual} !== ${expected}`);
  }
}
