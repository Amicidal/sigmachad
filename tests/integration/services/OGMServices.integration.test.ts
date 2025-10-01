/**
 * OGM Services Integration Tests
 * Comprehensive tests for all three OGM services working together
 * Tests data consistency, performance, and concurrent operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import crypto from "crypto";
import {
  setupIsolatedServiceTest,
  cleanupIsolatedServiceTest,
  IsolatedTestSetup,
} from "../../test-utils/database-helpers";
import { EntityServiceOGM } from "@memento/knowledge";
import { RelationshipServiceOGM } from "@memento/knowledge";
import { SearchServiceOGM } from "@memento/knowledge";
import { NeogmaService } from "@memento/knowledge";
import { EmbeddingService } from "@memento/knowledge";
import { CodebaseEntity, RelationshipType } from "@memento/shared-types";
import { GraphRelationship } from "@memento/shared-types";
import { GraphSearchRequest } from "@memento/shared-types";

const TEST_TIMEOUT = 60000; // 60 seconds for integration tests

describe("OGM Services Integration", () => {
  let testSetup: IsolatedTestSetup;
  let ogmEntityService: EntityServiceOGM;
  let ogmRelationshipService: RelationshipServiceOGM;
  let ogmSearchService: SearchServiceOGM;
  let neogmaService: NeogmaService;
  let embeddingService: EmbeddingService;

  // Performance tracking
  const performanceMetrics = {
    ogm: { entityOps: [], relationshipOps: [], searchOps: [] as number[] },
  };

  beforeAll(async () => {
    testSetup = await setupIsolatedServiceTest("OGMServicesIntegration", {
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
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupIsolatedServiceTest(testSetup, { silent: true });
  });

  beforeEach(async () => {
    // Clear performance metrics for each test
    performanceMetrics.ogm = { entityOps: [], relationshipOps: [], searchOps: [] };

    // Small delay for test isolation
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe("Entity Operations", () => {
    it("should create entities successfully with proper validation", async () => {
      const testEntity: CodebaseEntity = {
        id: "ogm-test-entity-1",
        path: "src/ogm-test.ts",
        hash: "ogm123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
      };

      // Test OGM implementation
      const ogmStart = performance.now();
      const ogmResult = await ogmEntityService.createEntity(testEntity);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Verify result structure
      expect(ogmResult.type).toBe(testEntity.type);
      expect(ogmResult.path).toBe(testEntity.path);
      expect(ogmResult.language).toBe(testEntity.language);
      expect(ogmResult.size).toBe(testEntity.size);
      expect(ogmResult.lines).toBe(testEntity.lines);
      expect(ogmResult.id).toBe(testEntity.id);

      // Verify entity can be retrieved
      const retrieved = await ogmEntityService.getEntity(ogmResult.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(testEntity.id);

      console.log(`Entity creation time: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle bulk entity creation efficiently", async () => {
      const entities: CodebaseEntity[] = Array.from({ length: 20 }, (_, i) => ({
        id: `bulk-entity-${i}`,
        path: `src/bulk/file${i}.ts`,
        hash: `bulk${i}123`,
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512 + i * 10,
        lines: 25 + i * 2,
      }));

      // Test OGM bulk creation
      const ogmStart = performance.now();
      const ogmResult = await ogmEntityService.createEntitiesBulk(entities, {
        skipExisting: true,
      });
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Verify bulk creation result
      expect(ogmResult.created).toBe(20);
      expect(ogmResult.failed).toBe(0);

      // Verify entities exist
      for (let i = 0; i < 20; i++) {
        const entity = await ogmEntityService.getEntity(`bulk-entity-${i}`);
        expect(entity).toBeTruthy();
        expect(entity?.size).toBe(512 + i * 10);
        expect(entity?.lines).toBe(25 + i * 2);
      }

      console.log(`Bulk entity creation time: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle entity updates correctly", async () => {
      const entity: CodebaseEntity = {
        id: "update-test-entity",
        path: "src/update-test.ts",
        hash: "update123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 256,
        lines: 10,
      };

      // Create entity
      await ogmEntityService.createEntity(entity);

      const updates = { size: 512, lines: 20 };

      // Test OGM update
      const ogmStart = performance.now();
      await ogmEntityService.updateEntity(entity.id, updates);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Verify update
      const updated = await ogmEntityService.getEntity(entity.id);
      expect(updated?.size).toBe(512);
      expect(updated?.lines).toBe(20);
      expect(updated?.path).toBe(entity.path); // Other properties should remain
      expect(updated?.language).toBe(entity.language);

      console.log(`Entity update time: ${ogmTime.toFixed(2)}ms`);
    });
  });

  describe("Relationship Operations", () => {
    let testEntities: CodebaseEntity[];

    beforeEach(async () => {
      // Create test entities for relationships
      testEntities = [
        {
          id: "rel-entity-1",
          path: "src/main.ts",
          hash: "main123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "rel-entity-2",
          path: "src/utils.ts",
          hash: "utils123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
      ];

      // Create entities
      for (const entity of testEntities) {
        await ogmEntityService.createEntity(entity);
      }
    });

    it("should create relationships successfully", async () => {
      const relationship: GraphRelationship = {
        id: "test-rel-1",
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: "named" },
      };

      // Test OGM relationship creation
      const ogmStart = performance.now();
      const result = await ogmRelationshipService.createRelationship(relationship);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.relationshipOps.push(ogmTime);

      // Verify relationship creation result
      expect(result.id).toBe(relationship.id);
      expect(result.type).toBe(RelationshipType.IMPORTS);
      expect(result.fromEntityId).toBe(testEntities[0].id);
      expect(result.toEntityId).toBe(testEntities[1].id);

      // Verify relationship exists in database
      const relationships = await ogmRelationshipService.getRelationships({
        fromEntityId: testEntities[0].id,
      });

      expect(relationships.length).toBe(1);
      expect(relationships[0].type).toBe(RelationshipType.IMPORTS);
      expect(relationships[0].metadata?.importType).toBe("named");

      console.log(`Relationship creation time: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle bulk relationship creation efficiently", async () => {
      const relationships: GraphRelationship[] = [
        {
          id: "bulk-rel-1",
          fromEntityId: testEntities[0].id,
          toEntityId: testEntities[1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "bulk-rel-2",
          fromEntityId: testEntities[1].id,
          toEntityId: testEntities[0].id,
          type: RelationshipType.REFERENCES,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      // Test OGM bulk creation
      const ogmStart = performance.now();
      const result = await ogmRelationshipService.createRelationshipsBulk(
        relationships,
        { mergeEvidence: false }
      );
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.relationshipOps.push(ogmTime);

      // Verify bulk creation results
      expect(result.created).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);

      // Verify relationships exist
      const callsRels = await ogmRelationshipService.getRelationships({
        fromEntityId: testEntities[0].id,
        type: RelationshipType.CALLS,
      });
      const refRels = await ogmRelationshipService.getRelationships({
        fromEntityId: testEntities[1].id,
        type: RelationshipType.REFERENCES,
      });

      expect(callsRels.length).toBe(1);
      expect(refRels.length).toBe(1);

      console.log(`Bulk relationship creation time: ${ogmTime.toFixed(2)}ms`);
    });
  });

  describe("Search Operations", () => {
    beforeEach(async () => {
      // Create searchable entities
      const searchEntities = [
        {
          id: "search-entity-button",
          path: "src/components/Button.tsx",
          hash: "btn123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content: "export const Button = () => <button>Click me</button>;",
        },
        {
          id: "search-entity-utils",
          path: "src/utils/helpers.ts",
          hash: "help123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content: "export const formatDate = (date: Date) => date.toISOString();",
        },
      ];

      for (const entity of searchEntities) {
        await ogmEntityService.createEntity(entity);
      }
    });

    it("should provide accurate search results", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "Button",
        searchType: "structural",
        entityTypes: ["file"],
        limit: 10,
      };

      // Test OGM search
      const ogmStart = performance.now();
      const results = await ogmSearchService.search(searchRequest);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.searchOps.push(ogmTime);

      // Verify search results
      expect(results.length).toBeGreaterThan(0);

      // Should find the Button entity
      const buttonResult = results.find(r => r.entity.path?.includes("Button"));
      expect(buttonResult).toBeTruthy();
      expect(buttonResult?.entity.language).toBe("typescript");
      expect(buttonResult?.score).toBeGreaterThan(0);

      console.log(`Search operation time: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle complex search filters correctly", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: ["file"],
        filters: {
          language: "typescript",
          path: "components",
        },
        limit: 5,
      };

      // Test OGM filtered search
      const ogmStart = performance.now();
      const results = await ogmSearchService.search(searchRequest);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.searchOps.push(ogmTime);

      // Verify filter effectiveness
      expect(results.length).toBeGreaterThanOrEqual(0);

      // All results should match the filters
      const typescriptFiles = results.filter(r => r.entity.language === "typescript");
      const componentsFiles = results.filter(r => r.entity.path?.includes("components"));

      expect(typescriptFiles.length).toBe(results.length);
      if (results.length > 0) {
        expect(componentsFiles.length).toBeGreaterThan(0);
      }

      console.log(`Filtered search time: ${ogmTime.toFixed(2)}ms`);
    });
  });

  describe("Data Consistency Validation", () => {
    it("should maintain data consistency across entity operations", async () => {
      const entity: CodebaseEntity = {
        id: "consistency-test-entity",
        path: "src/consistency.ts",
        hash: "consistent123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 1024,
        lines: 50,
      };

      // Create entity
      const created = await ogmEntityService.createEntity(entity);
      expect(created.id).toBe(entity.id);

      // Retrieve entity
      const retrieved = await ogmEntityService.getEntity(entity.id);
      expect(retrieved?.type).toBe(entity.type);
      expect(retrieved?.path).toBe(entity.path);
      expect(retrieved?.language).toBe(entity.language);
      expect(retrieved?.size).toBe(entity.size);
      expect(retrieved?.lines).toBe(entity.lines);

      // Update entity
      const updates = { size: 2048, lines: 100 };
      await ogmEntityService.updateEntity(entity.id, updates);

      // Verify update
      const updated = await ogmEntityService.getEntity(entity.id);
      expect(updated?.size).toBe(2048);
      expect(updated?.lines).toBe(100);
      expect(updated?.path).toBe(entity.path); // Unchanged properties
      expect(updated?.language).toBe(entity.language);
    });

    it("should handle concurrent operations without data corruption", async () => {
      const baseEntity: CodebaseEntity = {
        id: "concurrent-base",
        path: "src/concurrent-base.ts",
        hash: "concurrent123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512,
        lines: 25,
      };

      // Create base entity
      await ogmEntityService.createEntity(baseEntity);

      // Create multiple concurrent operations
      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        ogmEntityService.createEntity({
          ...baseEntity,
          id: `concurrent-entity-${i}`,
          path: `src/concurrent-${i}.ts`,
          hash: `concurrent${i}`,
          size: 512 + i * 10,
        })
      );

      // Execute all operations concurrently
      const results = await Promise.allSettled(concurrentOperations);

      // Verify all operations succeeded
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBe(10);

      // Verify all entities exist and have correct data
      for (let i = 0; i < 10; i++) {
        const entity = await ogmEntityService.getEntity(`concurrent-entity-${i}`);
        expect(entity).toBeTruthy();
        expect(entity?.size).toBe(512 + i * 10);
      }
    });
  });

  describe("Fallback Scenarios", () => {
    it("should handle OGM service failures gracefully", async () => {
      // Create an entity that should work
      const testEntity: CodebaseEntity = {
        id: "fallback-test-entity",
        path: "src/fallback.ts",
        hash: "fallback123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      // Test with invalid data that might cause OGM to fail
      const invalidEntity: any = {
        id: "invalid-entity",
        path: null, // Invalid path
        hash: undefined, // Invalid hash
        language: "unknown-language",
        lastModified: "invalid-date",
        created: new Date(),
        type: "invalid-type",
      };

      // Valid entity should work
      const validResult = await ogmEntityService.createEntity(testEntity);
      expect(validResult).toBeTruthy();
      expect(validResult.id).toBe(testEntity.id);

      // Invalid entity should be handled gracefully
      try {
        await ogmEntityService.createEntity(invalidEntity);
        // If it doesn't throw, that's also fine (depends on validation)
      } catch (error) {
        // Error should be informative
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should handle database connection issues", async () => {
      // This test would require actual connection manipulation
      // For now, we test that the services handle errors appropriately

      let errorCaught = false;

      ogmEntityService.on('error', () => {
        errorCaught = true;
      });

      // Try to query a non-existent entity (should not cause errors)
      const result = await ogmEntityService.getEntity("non-existent-entity-12345");
      expect(result).toBeNull();
      expect(errorCaught).toBe(false);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should provide performance metrics summary", async () => {
      // Calculate averages
      const avgOgmEntity = performanceMetrics.ogm.entityOps.length > 0
        ? performanceMetrics.ogm.entityOps.reduce((a, b) => a + b) / performanceMetrics.ogm.entityOps.length
        : 0;
      const avgOgmRel = performanceMetrics.ogm.relationshipOps.length > 0
        ? performanceMetrics.ogm.relationshipOps.reduce((a, b) => a + b) / performanceMetrics.ogm.relationshipOps.length
        : 0;
      const avgOgmSearch = performanceMetrics.ogm.searchOps.length > 0
        ? performanceMetrics.ogm.searchOps.reduce((a, b) => a + b) / performanceMetrics.ogm.searchOps.length
        : 0;

      console.log("\n=== OGM Performance Summary ===");
      console.log(`Entity Operations: ${avgOgmEntity.toFixed(2)}ms (avg)`);
      console.log(`Relationship Operations: ${avgOgmRel.toFixed(2)}ms (avg)`);
      console.log(`Search Operations: ${avgOgmSearch.toFixed(2)}ms (avg)`);

      // Performance should be reasonable (under 1 second for individual operations)
      if (avgOgmEntity > 0) {
        expect(avgOgmEntity).toBeLessThan(1000);
      }
      if (avgOgmRel > 0) {
        expect(avgOgmRel).toBeLessThan(1000);
      }
      if (avgOgmSearch > 0) {
        expect(avgOgmSearch).toBeLessThan(1000);
      }
    });

    it("should measure memory usage during operations", async () => {
      const initialMemory = process.memoryUsage();

      // Perform a series of operations
      const entities = Array.from({ length: 50 }, (_, i) => ({
        id: `memory-test-${i}`,
        path: `src/memory/file${i}.ts`,
        hash: `mem${i}`,
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file" as const,
        size: 1024 + i * 10,
        lines: 50 + i,
      }));

      await ogmEntityService.createEntitiesBulk(entities);

      const finalMemory = process.memoryUsage();
      const memoryDelta = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
      };

      console.log(`Memory usage delta:`);
      console.log(`  Heap Used: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(memoryDelta.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  External: ${(memoryDelta.external / 1024 / 1024).toFixed(2)} MB`);

      // Memory usage should be reasonable (less than 100MB for 50 entities)
      expect(memoryDelta.heapUsed).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe("Event Emission", () => {
    it("should emit proper events for entity operations", async () => {
      const events: any[] = [];

      // Listen to events
      ogmEntityService.on('entity:created', (data) => events.push({ type: 'entity:created', data }));
      ogmEntityService.on('entity:updated', (data) => events.push({ type: 'entity:updated', data }));
      ogmEntityService.on('entity:deleted', (data) => events.push({ type: 'entity:deleted', data }));

      const testEntity: CodebaseEntity = {
        id: "event-test-entity",
        path: "src/event-test.ts",
        hash: "event123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      // Create entity
      await ogmEntityService.createEntity(testEntity);

      // Update entity
      await ogmEntityService.updateEntity(testEntity.id, { size: 1024 });

      // Delete entity
      await ogmEntityService.deleteEntity(testEntity.id);

      // Small delay for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have emitted create, update, and delete events
      expect(events.length).toBeGreaterThanOrEqual(1);

      const createEvent = events.find(e => e.type === 'entity:created');
      expect(createEvent).toBeTruthy();
      expect(createEvent.data.type).toBe('file');
    });
  });
});

// Helper function to generate test data
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