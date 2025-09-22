/**
 * OGM Performance Benchmark Suite
 * Comprehensive performance testing of OGM services vs legacy implementation
 * Includes CRUD operations, bulk operations, search performance, and memory usage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupIsolatedServiceTest,
  cleanupIsolatedServiceTest,
  IsolatedTestSetup,
} from "../test-utils/database-helpers";
import { KnowledgeGraphService } from "../../src/services/knowledge/KnowledgeGraphService";
import { EntityServiceOGM } from "../../src/services/knowledge/ogm/EntityServiceOGM";
import { RelationshipServiceOGM } from "../../src/services/knowledge/ogm/RelationshipServiceOGM";
import { SearchServiceOGM } from "../../src/services/knowledge/ogm/SearchServiceOGM";
import { NeogmaService } from "../../src/services/knowledge/ogm/NeogmaService";
import { EmbeddingService } from "../../src/services/knowledge/EmbeddingService";
import { CodebaseEntity, RelationshipType } from "../../src/models/entities";
import { GraphRelationship } from "../../src/models/relationships";
import { GraphSearchRequest } from "../../src/models/types";

interface BenchmarkResult {
  operation: string;
  legacy: {
    time: number;
    memory: NodeJS.MemoryUsage;
    operationsPerSecond: number;
  };
  ogm: {
    time: number;
    memory: NodeJS.MemoryUsage;
    operationsPerSecond: number;
  };
  improvement: number; // Negative = slower, Positive = faster
  memoryDelta: number; // Bytes difference
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  summary: {
    avgImprovement: number;
    avgMemoryDelta: number;
    totalOperations: number;
  };
}

const BENCHMARK_TIMEOUT = 300000; // 5 minutes for benchmarks
const WARMUP_ITERATIONS = 5;
const BENCHMARK_ITERATIONS = 10;

describe("OGM Performance Benchmarks", () => {
  let testSetup: IsolatedTestSetup;
  let legacyKgService: KnowledgeGraphService;
  let ogmEntityService: EntityServiceOGM;
  let ogmRelationshipService: RelationshipServiceOGM;
  let ogmSearchService: SearchServiceOGM;
  let neogmaService: NeogmaService;
  let embeddingService: EmbeddingService;

  const benchmarkResults: BenchmarkSuite[] = [];

  beforeAll(async () => {
    console.log("🚀 Starting OGM Performance Benchmarks...");

    testSetup = await setupIsolatedServiceTest("OGMPerformanceBenchmark", {
      silent: true,
    });

    // Initialize legacy service
    legacyKgService = testSetup.kgService;

    // Initialize OGM services
    neogmaService = new NeogmaService(testSetup.dbService);
    await neogmaService.initialize();

    embeddingService = new EmbeddingService({
      openai: { apiKey: "test-key" },
      qdrant: testSetup.dbService.qdrant,
    });

    ogmEntityService = new EntityServiceOGM(neogmaService);
    ogmRelationshipService = new RelationshipServiceOGM(neogmaService);
    ogmSearchService = new SearchServiceOGM(neogmaService, embeddingService);

    console.log("✅ Benchmark environment initialized");
  }, BENCHMARK_TIMEOUT);

  afterAll(async () => {
    // Print final benchmark report
    printBenchmarkReport();
    await cleanupIsolatedServiceTest(testSetup, { silent: true });
    console.log("🏁 OGM Performance Benchmarks completed");
  });

  beforeEach(async () => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Small delay for stabilization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe("Entity CRUD Performance", () => {
    it("should benchmark single entity creation", async () => {
      const results = await runBenchmarkComparison(
        "Single Entity Creation",
        async (iteration) => {
          const entity: CodebaseEntity = {
            id: `bench-entity-${iteration}-${Date.now()}`,
            path: `src/bench/entity${iteration}.ts`,
            hash: `bench${iteration}`,
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            size: 1024,
            lines: 50,
          };

          return { entity };
        },
        async ({ entity }) => {
          await legacyKgService.createEntity(entity);
        },
        async ({ entity }) => {
          await ogmEntityService.createEntity(entity);
        }
      );

      benchmarkResults.push({
        name: "Entity CRUD Performance",
        results: [results],
        summary: calculateSummary([results]),
      });

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      expect(results.legacy.operationsPerSecond).toBeGreaterThan(0);
    });

    it("should benchmark entity retrieval", async () => {
      // Pre-populate entities
      const entities: CodebaseEntity[] = [];
      for (let i = 0; i < 100; i++) {
        const entity: CodebaseEntity = {
          id: `retrieval-entity-${i}`,
          path: `src/retrieval/entity${i}.ts`,
          hash: `ret${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 512 + i * 10,
          lines: 25 + i,
        };
        entities.push(entity);
        await legacyKgService.createEntity(entity);
        await ogmEntityService.createEntity(entity);
      }

      const results = await runBenchmarkComparison(
        "Entity Retrieval",
        async (iteration) => {
          const entityId = `retrieval-entity-${iteration % 100}`;
          return { entityId };
        },
        async ({ entityId }) => {
          await legacyKgService.getEntity(entityId);
        },
        async ({ entityId }) => {
          await ogmEntityService.getEntity(entityId);
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
    });

    it("should benchmark entity updates", async () => {
      // Pre-create entities
      const baseEntity: CodebaseEntity = {
        id: "update-benchmark-entity",
        path: "src/update-benchmark.ts",
        hash: "update123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512,
        lines: 25,
      };

      await legacyKgService.createEntity(baseEntity);
      await ogmEntityService.createEntity(baseEntity);

      const results = await runBenchmarkComparison(
        "Entity Updates",
        async (iteration) => {
          const updates = {
            size: 512 + iteration * 10,
            lines: 25 + iteration,
            lastModified: new Date(),
          };
          return { updates };
        },
        async ({ updates }) => {
          await legacyKgService.createOrUpdateEntity({
            ...baseEntity,
            ...updates,
          });
        },
        async ({ updates }) => {
          await ogmEntityService.updateEntity(baseEntity.id, updates);
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
    });
  });

  describe("Bulk Operations Performance", () => {
    it("should benchmark bulk entity creation", async () => {
      const results = await runBenchmarkComparison(
        "Bulk Entity Creation (100 entities)",
        async (iteration) => {
          const entities: CodebaseEntity[] = Array.from(
            { length: 100 },
            (_, i) => ({
              id: `bulk-entity-${iteration}-${i}`,
              path: `src/bulk/batch${iteration}/file${i}.ts`,
              hash: `bulk${iteration}${i}`,
              language: "typescript",
              lastModified: new Date(),
              created: new Date(),
              type: "file",
              size: 512 + i * 5,
              lines: 25 + i,
            })
          );
          return { entities };
        },
        async ({ entities }) => {
          await legacyKgService.createEmbeddingsBatch(entities);
        },
        async ({ entities }) => {
          await ogmEntityService.createEntitiesBulk(entities, {
            skipExisting: true,
          });
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      console.log(`Bulk entity creation improvement: ${results.improvement.toFixed(2)}%`);
    });

    it("should benchmark bulk relationship creation", async () => {
      // Pre-create entities for relationships
      const baseEntities: CodebaseEntity[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: `rel-base-entity-${i}`,
          path: `src/rel-base/entity${i}.ts`,
          hash: `relbase${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        })
      );

      for (const entity of baseEntities) {
        await legacyKgService.createEntity(entity);
        await ogmEntityService.createEntity(entity);
      }

      const results = await runBenchmarkComparison(
        "Bulk Relationship Creation (50 relationships)",
        async (iteration) => {
          const relationships: GraphRelationship[] = Array.from(
            { length: 50 },
            (_, i) => ({
              id: `bulk-rel-${iteration}-${i}`,
              fromEntityId: baseEntities[i % 10].id,
              toEntityId: baseEntities[(i + 1) % 10].id,
              type: i % 2 === 0 ? RelationshipType.CALLS : RelationshipType.REFERENCES,
              created: new Date(),
              lastModified: new Date(),
              version: 1,
              metadata: { iteration, index: i },
            })
          );
          return { relationships };
        },
        async ({ relationships }) => {
          await legacyKgService.createRelationshipsBulk(relationships);
        },
        async ({ relationships }) => {
          await ogmRelationshipService.createRelationshipsBulk(relationships, {
            mergeEvidence: false,
          });
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      console.log(`Bulk relationship creation improvement: ${results.improvement.toFixed(2)}%`);
    });
  });

  describe("Search Performance", () => {
    beforeEach(async () => {
      // Create searchable dataset
      const searchEntities: CodebaseEntity[] = Array.from(
        { length: 200 },
        (_, i) => ({
          id: `search-entity-${i}`,
          path: `src/search/module${Math.floor(i / 10)}/file${i}.ts`,
          hash: `search${i}`,
          language: i % 3 === 0 ? "typescript" : i % 3 === 1 ? "javascript" : "python",
          lastModified: new Date(),
          created: new Date(),
          type: i % 20 === 0 ? "test" : "file",
          size: 512 + i * 10,
          lines: 25 + i,
          content: `export const func${i} = () => { return "test${i}"; };`,
        })
      );

      // Batch create for speed
      await legacyKgService.createEmbeddingsBatch(searchEntities.slice(0, 100));
      await ogmEntityService.createEntitiesBulk(searchEntities.slice(100, 200));
    });

    it("should benchmark structural search", async () => {
      const searchQueries = [
        "func",
        "test",
        "module",
        "file",
        "export",
        "typescript",
        "src/search",
      ];

      const results = await runBenchmarkComparison(
        "Structural Search",
        async (iteration) => {
          const query = searchQueries[iteration % searchQueries.length];
          const request: GraphSearchRequest = {
            query,
            searchType: "structural",
            entityTypes: ["file"],
            limit: 20,
          };
          return { request };
        },
        async ({ request }) => {
          await legacyKgService.search(request);
        },
        async ({ request }) => {
          await ogmSearchService.search(request);
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      console.log(`Structural search improvement: ${results.improvement.toFixed(2)}%`);
    });

    it("should benchmark filtered search", async () => {
      const results = await runBenchmarkComparison(
        "Filtered Search",
        async (iteration) => {
          const request: GraphSearchRequest = {
            query: "",
            searchType: "structural",
            entityTypes: ["file"],
            filters: {
              language: iteration % 2 === 0 ? "typescript" : "javascript",
              type: "file",
            },
            limit: 50,
          };
          return { request };
        },
        async ({ request }) => {
          await legacyKgService.search(request);
        },
        async ({ request }) => {
          await ogmSearchService.search(request);
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      console.log(`Filtered search improvement: ${results.improvement.toFixed(2)}%`);
    });

    it("should benchmark complex queries", async () => {
      const results = await runBenchmarkComparison(
        "Complex Entity Queries",
        async (iteration) => {
          const entityType = iteration % 2 === 0 ? "file" : "test";
          const limit = 25 + (iteration % 25);
          return { entityType, limit };
        },
        async ({ entityType, limit }) => {
          const result = await legacyKgService.listEntities({
            type: entityType,
            limit,
          });
          return result.entities;
        },
        async ({ entityType, limit }) => {
          const result = await ogmEntityService.listEntities({
            type: entityType,
            limit,
          });
          return result.items;
        }
      );

      expect(results.ogm.operationsPerSecond).toBeGreaterThan(0);
      console.log(`Complex queries improvement: ${results.improvement.toFixed(2)}%`);
    });
  });

  describe("Memory Usage Benchmarks", () => {
    it("should benchmark memory efficiency during bulk operations", async () => {
      const initialMemory = process.memoryUsage();

      // Legacy bulk operation
      const legacyMemoryStart = process.memoryUsage();
      const legacyEntities: CodebaseEntity[] = Array.from(
        { length: 500 },
        (_, i) => ({
          id: `memory-legacy-${i}`,
          path: `src/memory/legacy/file${i}.ts`,
          hash: `memlg${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 1024 + i * 2,
          lines: 50 + i,
        })
      );

      await legacyKgService.createEmbeddingsBatch(legacyEntities);
      const legacyMemoryEnd = process.memoryUsage();

      // Force GC if available
      if (global.gc) {
        global.gc();
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      // OGM bulk operation
      const ogmMemoryStart = process.memoryUsage();
      const ogmEntities: CodebaseEntity[] = Array.from(
        { length: 500 },
        (_, i) => ({
          id: `memory-ogm-${i}`,
          path: `src/memory/ogm/file${i}.ts`,
          hash: `memogm${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 1024 + i * 2,
          lines: 50 + i,
        })
      );

      await ogmEntityService.createEntitiesBulk(ogmEntities);
      const ogmMemoryEnd = process.memoryUsage();

      const legacyMemoryDelta = legacyMemoryEnd.heapUsed - legacyMemoryStart.heapUsed;
      const ogmMemoryDelta = ogmMemoryEnd.heapUsed - ogmMemoryStart.heapUsed;

      console.log(`\n=== Memory Usage Comparison ===`);
      console.log(`Legacy memory delta: ${(legacyMemoryDelta / 1024 / 1024).toFixed(2)} MB`);
      console.log(`OGM memory delta: ${(ogmMemoryDelta / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory efficiency: ${((legacyMemoryDelta - ogmMemoryDelta) / legacyMemoryDelta * 100).toFixed(2)}%`);

      // Memory usage should be reasonable
      expect(ogmMemoryDelta).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    });

    it("should benchmark memory leaks during repeated operations", async () => {
      const iterations = 50;
      const memorySnapshots: NodeJS.MemoryUsage[] = [];

      for (let i = 0; i < iterations; i++) {
        // Perform a small operation
        const entity: CodebaseEntity = {
          id: `leak-test-${i}`,
          path: `src/leak/test${i}.ts`,
          hash: `leak${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        };

        await ogmEntityService.createEntity(entity);

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          if (global.gc) global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
          memorySnapshots.push(process.memoryUsage());
        }
      }

      // Analyze memory growth
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
      const growthPerOperation = memoryGrowth / iterations;

      console.log(`\n=== Memory Leak Analysis ===`);
      console.log(`Total memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Growth per operation: ${(growthPerOperation / 1024).toFixed(2)} KB`);

      // Memory growth should be minimal (less than 10MB total)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Stress Testing", () => {
    it("should handle high concurrency operations", async () => {
      const concurrentOperations = 20;
      const operationsPerConcurrency = 10;

      const start = performance.now();

      // Create concurrent batches
      const promises = Array.from({ length: concurrentOperations }, async (_, batchIndex) => {
        const entities: CodebaseEntity[] = Array.from(
          { length: operationsPerConcurrency },
          (_, i) => ({
            id: `stress-entity-${batchIndex}-${i}`,
            path: `src/stress/batch${batchIndex}/file${i}.ts`,
            hash: `stress${batchIndex}${i}`,
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            size: 1024,
            lines: 50,
          })
        );

        return ogmEntityService.createEntitiesBulk(entities);
      });

      const results = await Promise.allSettled(promises);
      const totalTime = performance.now() - start;

      const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
      const totalEntities = successfulOperations * operationsPerConcurrency;
      const entitiesPerSecond = totalEntities / (totalTime / 1000);

      console.log(`\n=== Stress Test Results ===`);
      console.log(`Concurrent operations: ${concurrentOperations}`);
      console.log(`Successful operations: ${successfulOperations}`);
      console.log(`Total entities created: ${totalEntities}`);
      console.log(`Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`Entities per second: ${entitiesPerSecond.toFixed(2)}`);

      // Should handle reasonable concurrency
      expect(successfulOperations).toBeGreaterThanOrEqual(concurrentOperations * 0.8); // 80% success rate
      expect(entitiesPerSecond).toBeGreaterThan(10); // At least 10 entities per second
    });

    it("should maintain performance under load", async () => {
      const loadTestDuration = 30000; // 30 seconds
      const operationInterval = 100; // Every 100ms

      const performanceMetrics: number[] = [];
      const startTime = Date.now();

      while (Date.now() - startTime < loadTestDuration) {
        const operationStart = performance.now();

        const entity: CodebaseEntity = {
          id: `load-test-${Date.now()}-${Math.random()}`,
          path: `src/load/test-${Date.now()}.ts`,
          hash: `load${Date.now()}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        };

        await ogmEntityService.createEntity(entity);

        const operationTime = performance.now() - operationStart;
        performanceMetrics.push(operationTime);

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, operationInterval));
      }

      // Analyze performance degradation
      const firstHalf = performanceMetrics.slice(0, Math.floor(performanceMetrics.length / 2));
      const secondHalf = performanceMetrics.slice(Math.floor(performanceMetrics.length / 2));

      const avgFirstHalf = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      const degradation = ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100;

      console.log(`\n=== Load Test Results ===`);
      console.log(`Operations performed: ${performanceMetrics.length}`);
      console.log(`Average operation time (first half): ${avgFirstHalf.toFixed(2)}ms`);
      console.log(`Average operation time (second half): ${avgSecondHalf.toFixed(2)}ms`);
      console.log(`Performance degradation: ${degradation.toFixed(2)}%`);

      // Performance should not degrade significantly (less than 50%)
      expect(degradation).toBeLessThan(50);
    });
  });

  // Helper functions

  async function runBenchmarkComparison<T>(
    operationName: string,
    setupData: (iteration: number) => Promise<T>,
    legacyOperation: (data: T) => Promise<any>,
    ogmOperation: (data: T) => Promise<any>
  ): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking: ${operationName}`);

    // Warmup
    console.log("  🔥 Warming up...");
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      const data = await setupData(i);
      await legacyOperation(data);
      await ogmOperation(data);
    }

    // Force GC if available
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    // Benchmark Legacy
    console.log("  📈 Benchmarking Legacy implementation...");
    const legacyMemoryStart = process.memoryUsage();
    const legacyStart = performance.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const data = await setupData(i + WARMUP_ITERATIONS);
      await legacyOperation(data);
    }

    const legacyTime = performance.now() - legacyStart;
    const legacyMemoryEnd = process.memoryUsage();

    // Force GC if available
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    // Benchmark OGM
    console.log("  📈 Benchmarking OGM implementation...");
    const ogmMemoryStart = process.memoryUsage();
    const ogmStart = performance.now();

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const data = await setupData(i + WARMUP_ITERATIONS + BENCHMARK_ITERATIONS);
      await ogmOperation(data);
    }

    const ogmTime = performance.now() - ogmStart;
    const ogmMemoryEnd = process.memoryUsage();

    // Calculate metrics
    const legacyOpsPerSec = BENCHMARK_ITERATIONS / (legacyTime / 1000);
    const ogmOpsPerSec = BENCHMARK_ITERATIONS / (ogmTime / 1000);
    const improvement = ((legacyTime - ogmTime) / legacyTime) * 100;
    const memoryDelta = (ogmMemoryEnd.heapUsed - ogmMemoryStart.heapUsed) -
                       (legacyMemoryEnd.heapUsed - legacyMemoryStart.heapUsed);

    const result: BenchmarkResult = {
      operation: operationName,
      legacy: {
        time: legacyTime,
        memory: legacyMemoryEnd,
        operationsPerSecond: legacyOpsPerSec,
      },
      ogm: {
        time: ogmTime,
        memory: ogmMemoryEnd,
        operationsPerSecond: ogmOpsPerSec,
      },
      improvement,
      memoryDelta,
    };

    console.log(`  ✅ ${operationName} completed:`);
    console.log(`     Legacy: ${legacyTime.toFixed(2)}ms (${legacyOpsPerSec.toFixed(2)} ops/s)`);
    console.log(`     OGM: ${ogmTime.toFixed(2)}ms (${ogmOpsPerSec.toFixed(2)} ops/s)`);
    console.log(`     Improvement: ${improvement.toFixed(2)}%`);

    return result;
  }

  function calculateSummary(results: BenchmarkResult[]) {
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
    const avgMemoryDelta = results.reduce((sum, r) => sum + r.memoryDelta, 0) / results.length;
    const totalOperations = results.reduce((sum, r) => sum + BENCHMARK_ITERATIONS, 0);

    return {
      avgImprovement,
      avgMemoryDelta,
      totalOperations,
    };
  }

  function printBenchmarkReport() {
    console.log(`\n${'='.repeat(60)}`);
    console.log("📊 OGM PERFORMANCE BENCHMARK REPORT");
    console.log(`${'='.repeat(60)}`);

    let totalImprovement = 0;
    let totalMemoryDelta = 0;
    let totalOperations = 0;

    benchmarkResults.forEach(suite => {
      console.log(`\n📋 ${suite.name}:`);
      suite.results.forEach(result => {
        console.log(`  📈 ${result.operation}:`);
        console.log(`     Performance: ${result.improvement.toFixed(2)}% ${result.improvement > 0 ? '🚀' : '🐌'}`);
        console.log(`     Memory: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB ${result.memoryDelta < 0 ? '💚' : '🔴'}`);
        console.log(`     OGM ops/s: ${result.ogm.operationsPerSecond.toFixed(2)}`);
      });

      totalImprovement += suite.summary.avgImprovement;
      totalMemoryDelta += suite.summary.avgMemoryDelta;
      totalOperations += suite.summary.totalOperations;
    });

    const avgImprovement = totalImprovement / benchmarkResults.length;
    const avgMemoryDelta = totalMemoryDelta / benchmarkResults.length;

    console.log(`\n🎯 OVERALL SUMMARY:`);
    console.log(`   Average Performance Improvement: ${avgImprovement.toFixed(2)}%`);
    console.log(`   Average Memory Delta: ${(avgMemoryDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Total Operations Benchmarked: ${totalOperations}`);

    if (avgImprovement > 0) {
      console.log(`   🏆 OGM is faster on average!`);
    } else {
      console.log(`   ⚠️  OGM needs optimization`);
    }

    if (avgMemoryDelta < 0) {
      console.log(`   💚 OGM uses less memory on average!`);
    } else {
      console.log(`   🔴 OGM uses more memory on average`);
    }

    console.log(`${'='.repeat(60)}`);
  }
});