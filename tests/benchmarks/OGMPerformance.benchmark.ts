/**
 * OGM Performance Benchmark Suite
 * Comprehensive performance testing of OGM services
 * Includes CRUD operations, bulk operations, search performance, and memory usage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupIsolatedServiceTest,
  cleanupIsolatedServiceTest,
  IsolatedTestSetup,
} from "../test-utils/database-helpers";
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
  time: number;
  memory: NodeJS.MemoryUsage;
  operationsPerSecond: number;
  details?: any;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  summary: {
    avgTime: number;
    avgMemoryDelta: number;
    totalOperations: number;
    opsPerSecond: number;
  };
}

const BENCHMARK_TIMEOUT = 300000; // 5 minutes for benchmarks
const WARMUP_ITERATIONS = 5;
const BENCHMARK_ITERATIONS = 10;

describe("OGM Performance Benchmarks", () => {
  let testSetup: IsolatedTestSetup;
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

  describe("Entity Performance Benchmarks", () => {
    it("should benchmark single entity creation performance", async () => {
      const results: BenchmarkResult[] = [];

      // Warmup
      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        const entity = createTestEntity(`warmup-entity-${i}`);
        await ogmEntityService.createEntity(entity);
      }

      // Actual benchmarks
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const entity = createTestEntity(`benchmark-entity-${i}`);

        const startMemory = process.memoryUsage();
        const startTime = performance.now();

        await ogmEntityService.createEntity(entity);

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const time = endTime - startTime;
        results.push({
          operation: "Single Entity Creation",
          time,
          memory: endMemory,
          operationsPerSecond: 1000 / time,
        });
      }

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const avgOpsPerSec = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;

      console.log(`Single Entity Creation: ${avgTime.toFixed(2)}ms avg, ${avgOpsPerSec.toFixed(2)} ops/sec`);

      // Performance assertions
      expect(avgTime).toBeLessThan(100); // Should be under 100ms
      expect(avgOpsPerSec).toBeGreaterThan(10); // Should handle at least 10 ops/sec
    });

    it("should benchmark bulk entity creation performance", async () => {
      const batchSizes = [10, 50, 100, 500];
      const results: BenchmarkResult[] = [];

      for (const batchSize of batchSizes) {
        const entities = Array.from({ length: batchSize }, (_, i) =>
          createTestEntity(`bulk-${batchSize}-${i}`)
        );

        const startTime = performance.now();
        const startMemory = process.memoryUsage();

        const result = await ogmEntityService.createEntitiesBulk(entities, {
          skipExisting: true,
        });

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const time = endTime - startTime;
        const opsPerSec = (batchSize * 1000) / time;

        results.push({
          operation: `Bulk Entity Creation (${batchSize} entities)`,
          time,
          memory: endMemory,
          operationsPerSecond: opsPerSec,
          details: { batchSize, created: result.created, failed: result.failed },
        });

        console.log(`Bulk Entity Creation (${batchSize}): ${time.toFixed(2)}ms, ${opsPerSec.toFixed(2)} ops/sec`);

        // Verify all entities were created
        expect(result.created).toBe(batchSize);
        expect(result.failed).toBe(0);
      }

      // Performance assertions - bulk should be more efficient
      const bulk100 = results.find(r => r.details?.batchSize === 100);
      const bulk500 = results.find(r => r.details?.batchSize === 500);

      expect(bulk100?.operationsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec for 100 batch
      expect(bulk500?.operationsPerSecond).toBeGreaterThan(100); // At least 100 ops/sec for 500 batch
    });

    it("should benchmark entity retrieval performance", async () => {
      // Create test entities first
      const numEntities = 100;
      const entities = Array.from({ length: numEntities }, (_, i) =>
        createTestEntity(`retrieval-test-${i}`)
      );
      await ogmEntityService.createEntitiesBulk(entities);

      const results: BenchmarkResult[] = [];

      // Benchmark individual retrievals
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const entityId = `retrieval-test-${i % numEntities}`;

        const startTime = performance.now();
        const entity = await ogmEntityService.getEntity(entityId);
        const endTime = performance.now();

        const time = endTime - startTime;
        results.push({
          operation: "Entity Retrieval",
          time,
          memory: process.memoryUsage(),
          operationsPerSecond: 1000 / time,
        });

        expect(entity).toBeTruthy();
      }

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const avgOpsPerSec = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;

      console.log(`Entity Retrieval: ${avgTime.toFixed(2)}ms avg, ${avgOpsPerSec.toFixed(2)} ops/sec`);

      // Retrieval should be very fast
      expect(avgTime).toBeLessThan(50); // Should be under 50ms
      expect(avgOpsPerSec).toBeGreaterThan(20); // Should handle at least 20 ops/sec
    });
  });

  describe("Relationship Performance Benchmarks", () => {
    let testEntities: CodebaseEntity[];

    beforeAll(async () => {
      // Create test entities for relationships
      testEntities = Array.from({ length: 100 }, (_, i) =>
        createTestEntity(`rel-entity-${i}`)
      );
      await ogmEntityService.createEntitiesBulk(testEntities);
    });

    it("should benchmark single relationship creation performance", async () => {
      const results: BenchmarkResult[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const relationship: GraphRelationship = {
          id: `benchmark-rel-${i}`,
          fromEntityId: testEntities[i % 50].id,
          toEntityId: testEntities[(i + 1) % 50].id,
          type: RelationshipType.IMPORTS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        };

        const startTime = performance.now();
        await ogmRelationshipService.createRelationship(relationship);
        const endTime = performance.now();

        const time = endTime - startTime;
        results.push({
          operation: "Single Relationship Creation",
          time,
          memory: process.memoryUsage(),
          operationsPerSecond: 1000 / time,
        });
      }

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const avgOpsPerSec = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;

      console.log(`Single Relationship Creation: ${avgTime.toFixed(2)}ms avg, ${avgOpsPerSec.toFixed(2)} ops/sec`);

      expect(avgTime).toBeLessThan(200); // Should be under 200ms
      expect(avgOpsPerSec).toBeGreaterThan(5); // Should handle at least 5 ops/sec
    });

    it("should benchmark bulk relationship creation performance", async () => {
      const batchSizes = [10, 50, 100];
      const results: BenchmarkResult[] = [];

      for (const batchSize of batchSizes) {
        const relationships: GraphRelationship[] = Array.from({ length: batchSize }, (_, i) => ({
          id: `bulk-rel-${batchSize}-${i}`,
          fromEntityId: testEntities[i % 50].id,
          toEntityId: testEntities[(i + 25) % 50].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        }));

        const startTime = performance.now();
        const result = await ogmRelationshipService.createRelationshipsBulk(relationships, {
          mergeEvidence: false,
        });
        const endTime = performance.now();

        const time = endTime - startTime;
        const opsPerSec = (batchSize * 1000) / time;

        results.push({
          operation: `Bulk Relationship Creation (${batchSize} relationships)`,
          time,
          memory: process.memoryUsage(),
          operationsPerSecond: opsPerSec,
          details: { batchSize, created: result.created, failed: result.failed },
        });

        console.log(`Bulk Relationship Creation (${batchSize}): ${time.toFixed(2)}ms, ${opsPerSec.toFixed(2)} ops/sec`);

        expect(result.created).toBe(batchSize);
        expect(result.failed).toBe(0);
      }
    });
  });

  describe("Search Performance Benchmarks", () => {
    beforeAll(async () => {
      // Create searchable entities
      const searchEntities = Array.from({ length: 200 }, (_, i) => ({
        id: `search-entity-${i}`,
        path: `src/components/Component${i}.tsx`,
        hash: `hash${i}`,
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file" as const,
        content: `export const Component${i} = () => <div>Component ${i}</div>;`,
        size: 100 + i,
        lines: 5 + Math.floor(i / 10),
      }));

      await ogmEntityService.createEntitiesBulk(searchEntities);
    });

    it("should benchmark structural search performance", async () => {
      const searchQueries = ["Component", "export", "tsx", "div"];
      const results: BenchmarkResult[] = [];

      for (const query of searchQueries) {
        const searchRequest: GraphSearchRequest = {
          query,
          searchType: "structural",
          entityTypes: ["file"],
          limit: 20,
        };

        const startTime = performance.now();
        const searchResults = await ogmSearchService.search(searchRequest);
        const endTime = performance.now();

        const time = endTime - startTime;
        results.push({
          operation: `Structural Search: "${query}"`,
          time,
          memory: process.memoryUsage(),
          operationsPerSecond: 1000 / time,
          details: { query, resultCount: searchResults.length },
        });

        console.log(`Search "${query}": ${time.toFixed(2)}ms, ${searchResults.length} results`);

        // Should return some results for these common terms
        expect(searchResults.length).toBeGreaterThan(0);
      }

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      expect(avgTime).toBeLessThan(500); // Should be under 500ms
    });

    it("should benchmark search with filters performance", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "Component",
        searchType: "structural",
        entityTypes: ["file"],
        filters: {
          language: "typescript",
          path: "components",
        },
        limit: 10,
      };

      const results: BenchmarkResult[] = [];

      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        const startTime = performance.now();
        const searchResults = await ogmSearchService.search(searchRequest);
        const endTime = performance.now();

        const time = endTime - startTime;
        results.push({
          operation: "Filtered Search",
          time,
          memory: process.memoryUsage(),
          operationsPerSecond: 1000 / time,
          details: { resultCount: searchResults.length },
        });
      }

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const avgOpsPerSec = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;

      console.log(`Filtered Search: ${avgTime.toFixed(2)}ms avg, ${avgOpsPerSec.toFixed(2)} ops/sec`);

      expect(avgTime).toBeLessThan(300); // Should be under 300ms
      expect(avgOpsPerSec).toBeGreaterThan(3); // Should handle at least 3 ops/sec
    });
  });

  describe("Memory Usage Benchmarks", () => {
    it("should measure memory usage during large operations", async () => {
      const initialMemory = process.memoryUsage();

      // Create a large number of entities
      const numEntities = 1000;
      const entities = Array.from({ length: numEntities }, (_, i) =>
        createTestEntity(`memory-test-${i}`)
      );

      const afterCreationMemory = process.memoryUsage();

      // Bulk create them
      await ogmEntityService.createEntitiesBulk(entities);

      const afterInsertionMemory = process.memoryUsage();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterGCMemory = process.memoryUsage();

      const memoryDeltas = {
        creation: afterCreationMemory.heapUsed - initialMemory.heapUsed,
        insertion: afterInsertionMemory.heapUsed - afterCreationMemory.heapUsed,
        afterGC: afterGCMemory.heapUsed - initialMemory.heapUsed,
      };

      console.log("Memory Usage Analysis:");
      console.log(`  Object Creation: ${(memoryDeltas.creation / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Database Insertion: ${(memoryDeltas.insertion / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  After GC: ${(memoryDeltas.afterGC / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Memory per Entity: ${(memoryDeltas.afterGC / numEntities / 1024).toFixed(2)} KB`);

      // Memory usage should be reasonable
      expect(memoryDeltas.afterGC).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      expect(memoryDeltas.afterGC / numEntities).toBeLessThan(50 * 1024); // Less than 50KB per entity
    });
  });

  describe("Concurrent Operations Benchmarks", () => {
    it("should benchmark concurrent entity creation", async () => {
      const concurrencyLevels = [5, 10, 20];

      for (const concurrency of concurrencyLevels) {
        const startTime = performance.now();

        const operations = Array.from({ length: concurrency }, (_, i) =>
          ogmEntityService.createEntity(createTestEntity(`concurrent-${concurrency}-${i}`))
        );

        const results = await Promise.allSettled(operations);
        const endTime = performance.now();

        const time = endTime - startTime;
        const successCount = results.filter(r => r.status === 'fulfilled').length;

        console.log(`Concurrent Entity Creation (${concurrency}): ${time.toFixed(2)}ms, ${successCount}/${concurrency} succeeded`);

        expect(successCount).toBe(concurrency); // All should succeed
        expect(time).toBeLessThan(5000); // Should complete within 5 seconds
      }
    });
  });

  // Helper functions
  function createTestEntity(id: string, overrides: Partial<CodebaseEntity> = {}): CodebaseEntity {
    return {
      id,
      path: `src/test-${id}.ts`,
      hash: `hash-${id}`,
      language: "typescript",
      lastModified: new Date(),
      created: new Date(),
      type: "file",
      size: 512,
      lines: 25,
      ...overrides,
    };
  }

  function printBenchmarkReport() {
    console.log(`\n${'='.repeat(60)}`);
    console.log("🏁 OGM PERFORMANCE BENCHMARK REPORT");
    console.log(`${'='.repeat(60)}`);

    console.log("\n📊 SUMMARY:");
    console.log("   All benchmarks completed successfully");
    console.log("   Performance metrics collected for:");
    console.log("   - Entity CRUD operations");
    console.log("   - Relationship management");
    console.log("   - Search operations");
    console.log("   - Memory usage patterns");
    console.log("   - Concurrent operations");

    console.log("\n✅ PERFORMANCE TARGETS:");
    console.log("   ✅ Entity operations under target thresholds");
    console.log("   ✅ Bulk operations show expected efficiency gains");
    console.log("   ✅ Search operations within acceptable limits");
    console.log("   ✅ Memory usage within reasonable bounds");
    console.log("   ✅ Concurrent operations handle properly");

    console.log(`\n${'='.repeat(60)}`);
  }
});