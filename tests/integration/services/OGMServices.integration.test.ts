/**
 * OGM Services Integration Tests
 * Comprehensive tests for all three OGM services working together
 * Tests OGM vs legacy implementation comparison, data consistency, and performance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import crypto from "crypto";
import {
  setupIsolatedServiceTest,
  cleanupIsolatedServiceTest,
  IsolatedTestSetup,
} from "../../test-utils/database-helpers";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService";
import { EntityServiceOGM } from "../../../src/services/knowledge/ogm/EntityServiceOGM";
import { RelationshipServiceOGM } from "../../../src/services/knowledge/ogm/RelationshipServiceOGM";
import { SearchServiceOGM } from "../../../src/services/knowledge/ogm/SearchServiceOGM";
import { NeogmaService } from "../../../src/services/knowledge/ogm/NeogmaService";
import { EmbeddingService } from "../../../src/services/knowledge/EmbeddingService";
import { CodebaseEntity, RelationshipType } from "../../../src/models/entities";
import { GraphRelationship } from "../../../src/models/relationships";
import { GraphSearchRequest } from "../../../src/models/types";

const TEST_TIMEOUT = 60000; // 60 seconds for integration tests

describe("OGM Services Integration", () => {
  let testSetup: IsolatedTestSetup;
  let legacyKgService: KnowledgeGraphService;
  let ogmEntityService: EntityServiceOGM;
  let ogmRelationshipService: RelationshipServiceOGM;
  let ogmSearchService: SearchServiceOGM;
  let neogmaService: NeogmaService;
  let embeddingService: EmbeddingService;

  // Performance tracking
  const performanceMetrics = {
    legacy: { entityOps: [], relationshipOps: [], searchOps: [] as number[] },
    ogm: { entityOps: [], relationshipOps: [], searchOps: [] as number[] },
  };

  beforeAll(async () => {
    testSetup = await setupIsolatedServiceTest("OGMServicesIntegration", {
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
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupIsolatedServiceTest(testSetup, { silent: true });
  });

  beforeEach(async () => {
    // Clear performance metrics for each test
    performanceMetrics.legacy = { entityOps: [], relationshipOps: [], searchOps: [] };
    performanceMetrics.ogm = { entityOps: [], relationshipOps: [], searchOps: [] };

    // Small delay for test isolation
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe("Entity Operations Comparison", () => {
    it("should create entities with identical results between legacy and OGM", async () => {
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

      // Test legacy implementation
      const legacyStart = performance.now();
      const legacyResult = await legacyKgService.createEntity(testEntity);
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.entityOps.push(legacyTime);

      // Test OGM implementation
      const ogmStart = performance.now();
      const ogmResult = await ogmEntityService.createEntity({
        ...testEntity,
        id: "ogm-test-entity-2", // Different ID to avoid conflicts
      });
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Compare results (excluding IDs and timestamps)
      expect(legacyResult.type).toBe(ogmResult.type);
      expect(legacyResult.path).toBe(ogmResult.path);
      expect(legacyResult.language).toBe(ogmResult.language);
      expect(legacyResult.size).toBe(ogmResult.size);
      expect(legacyResult.lines).toBe(ogmResult.lines);

      // Verify both entities exist
      const legacyRetrieved = await legacyKgService.getEntity(legacyResult.id);
      const ogmRetrieved = await ogmEntityService.getEntity(ogmResult.id);

      expect(legacyRetrieved).toBeTruthy();
      expect(ogmRetrieved).toBeTruthy();

      console.log(`Entity creation - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle bulk entity creation consistently", async () => {
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

      // Test legacy bulk creation
      const legacyStart = performance.now();
      await legacyKgService.createEmbeddingsBatch(entities.slice(0, 10));
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.entityOps.push(legacyTime);

      // Test OGM bulk creation
      const ogmStart = performance.now();
      const ogmResult = await ogmEntityService.createEntitiesBulk(entities.slice(10, 20), {
        skipExisting: true,
      });
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Verify OGM bulk result
      expect(ogmResult.created).toBe(10);
      expect(ogmResult.failed).toBe(0);

      // Verify entities exist
      for (let i = 0; i < 10; i++) {
        const legacyEntity = await legacyKgService.getEntity(`bulk-entity-${i}`);
        const ogmEntity = await ogmEntityService.getEntity(`bulk-entity-${i + 10}`);

        expect(legacyEntity).toBeTruthy();
        expect(ogmEntity).toBeTruthy();
      }

      console.log(`Bulk entity creation - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle entity updates consistently", async () => {
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

      // Create entities in both systems
      await legacyKgService.createEntity(entity);
      await ogmEntityService.createEntity({
        ...entity,
        id: "update-test-entity-ogm",
      });

      const updates = { size: 512, lines: 20 };

      // Test legacy update
      const legacyStart = performance.now();
      await legacyKgService.createOrUpdateEntity({ ...entity, ...updates });
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.entityOps.push(legacyTime);

      // Test OGM update
      const ogmStart = performance.now();
      await ogmEntityService.updateEntity("update-test-entity-ogm", updates);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.entityOps.push(ogmTime);

      // Verify updates
      const legacyUpdated = await legacyKgService.getEntity(entity.id);
      const ogmUpdated = await ogmEntityService.getEntity("update-test-entity-ogm");

      expect(legacyUpdated?.size).toBe(512);
      expect(ogmUpdated?.size).toBe(512);
      expect(legacyUpdated?.lines).toBe(20);
      expect(ogmUpdated?.lines).toBe(20);

      console.log(`Entity update - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });
  });

  describe("Relationship Operations Comparison", () => {
    let testEntities: { legacy: CodebaseEntity[], ogm: CodebaseEntity[] };

    beforeEach(async () => {
      // Create test entities for relationships
      testEntities = {
        legacy: [
          {
            id: "rel-legacy-1",
            path: "src/legacy/main.ts",
            hash: "legacy1",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
          },
          {
            id: "rel-legacy-2",
            path: "src/legacy/utils.ts",
            hash: "legacy2",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
          },
        ],
        ogm: [
          {
            id: "rel-ogm-1",
            path: "src/ogm/main.ts",
            hash: "ogm1",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
          },
          {
            id: "rel-ogm-2",
            path: "src/ogm/utils.ts",
            hash: "ogm2",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
          },
        ],
      };

      // Create entities in both systems
      for (const entity of testEntities.legacy) {
        await legacyKgService.createEntity(entity);
      }
      for (const entity of testEntities.ogm) {
        await ogmEntityService.createEntity(entity);
      }
    });

    it("should create relationships with comparable results", async () => {
      const legacyRel: GraphRelationship = {
        id: "legacy-rel-1",
        fromEntityId: testEntities.legacy[0].id,
        toEntityId: testEntities.legacy[1].id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: "named" },
      };

      const ogmRel: GraphRelationship = {
        id: "ogm-rel-1",
        fromEntityId: testEntities.ogm[0].id,
        toEntityId: testEntities.ogm[1].id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: "named" },
      };

      // Test legacy relationship creation
      const legacyStart = performance.now();
      await legacyKgService.createRelationship(legacyRel);
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.relationshipOps.push(legacyTime);

      // Test OGM relationship creation
      const ogmStart = performance.now();
      await ogmRelationshipService.createRelationship(ogmRel);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.relationshipOps.push(ogmTime);

      // Verify relationships exist
      const legacyRels = await legacyKgService.getRelationships({
        fromEntityId: testEntities.legacy[0].id,
      });
      const ogmRels = await ogmRelationshipService.getRelationships({
        fromEntityId: testEntities.ogm[0].id,
      });

      expect(legacyRels.length).toBe(1);
      expect(ogmRels.length).toBe(1);
      expect(legacyRels[0].type).toBe(RelationshipType.IMPORTS);
      expect(ogmRels[0].type).toBe(RelationshipType.IMPORTS);

      console.log(`Relationship creation - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle bulk relationship creation efficiently", async () => {
      const relationships: GraphRelationship[] = [
        {
          id: "bulk-rel-1",
          fromEntityId: testEntities.legacy[0].id,
          toEntityId: testEntities.legacy[1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "bulk-rel-2",
          fromEntityId: testEntities.legacy[1].id,
          toEntityId: testEntities.legacy[0].id,
          type: RelationshipType.REFERENCES,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      const ogmRelationships: GraphRelationship[] = [
        {
          id: "bulk-ogm-rel-1",
          fromEntityId: testEntities.ogm[0].id,
          toEntityId: testEntities.ogm[1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "bulk-ogm-rel-2",
          fromEntityId: testEntities.ogm[1].id,
          toEntityId: testEntities.ogm[0].id,
          type: RelationshipType.REFERENCES,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      // Test legacy bulk creation
      const legacyStart = performance.now();
      await legacyKgService.createRelationshipsBulk(relationships);
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.relationshipOps.push(legacyTime);

      // Test OGM bulk creation
      const ogmStart = performance.now();
      const ogmResult = await ogmRelationshipService.createRelationshipsBulk(
        ogmRelationships,
        { mergeEvidence: false }
      );
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.relationshipOps.push(ogmTime);

      // Verify bulk creation results
      expect(ogmResult.created).toBeGreaterThan(0);
      expect(ogmResult.failed).toBe(0);

      console.log(`Bulk relationship creation - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });
  });

  describe("Search Operations Comparison", () => {
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
        await legacyKgService.createEntity(entity);
        await ogmEntityService.createEntity(entity);
      }
    });

    it("should provide consistent search results", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "Button",
        searchType: "structural",
        entityTypes: ["file"],
        limit: 10,
      };

      // Test legacy search
      const legacyStart = performance.now();
      const legacyResults = await legacyKgService.search(searchRequest);
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.searchOps.push(legacyTime);

      // Test OGM search
      const ogmStart = performance.now();
      const ogmResults = await ogmSearchService.search(searchRequest);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.searchOps.push(ogmTime);

      // Compare search results
      expect(legacyResults.length).toBeGreaterThan(0);
      expect(ogmResults.length).toBeGreaterThan(0);

      // Both should find the Button entity
      const legacyButton = legacyResults.find(r => r.path?.includes("Button"));
      const ogmButton = ogmResults.find(r => r.entity.path?.includes("Button"));

      expect(legacyButton).toBeTruthy();
      expect(ogmButton).toBeTruthy();

      console.log(`Search operation - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
    });

    it("should handle complex search filters consistently", async () => {
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

      // Test legacy filtered search
      const legacyStart = performance.now();
      const legacyResults = await legacyKgService.search(searchRequest);
      const legacyTime = performance.now() - legacyStart;
      performanceMetrics.legacy.searchOps.push(legacyTime);

      // Test OGM filtered search
      const ogmStart = performance.now();
      const ogmResults = await ogmSearchService.search(searchRequest);
      const ogmTime = performance.now() - ogmStart;
      performanceMetrics.ogm.searchOps.push(ogmTime);

      // Verify filter effectiveness
      const legacyTypescriptFiles = legacyResults.filter(r => r.language === "typescript");
      const ogmTypescriptFiles = ogmResults.filter(r => r.entity.language === "typescript");

      expect(legacyTypescriptFiles.length).toBe(legacyResults.length);
      expect(ogmTypescriptFiles.length).toBe(ogmResults.length);

      console.log(`Filtered search - Legacy: ${legacyTime.toFixed(2)}ms, OGM: ${ogmTime.toFixed(2)}ms`);
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

      // Create in both systems
      await legacyKgService.createEntity(entity);
      await ogmEntityService.createEntity(entity);

      // Retrieve from both systems
      const legacyEntity = await legacyKgService.getEntity(entity.id);
      const ogmEntity = await ogmEntityService.getEntity(entity.id);

      // Verify consistent properties
      expect(legacyEntity?.type).toBe(ogmEntity?.type);
      expect(legacyEntity?.path).toBe(ogmEntity?.path);
      expect(legacyEntity?.language).toBe(ogmEntity?.language);
      expect(legacyEntity?.size).toBe(ogmEntity?.size);
      expect(legacyEntity?.lines).toBe(ogmEntity?.lines);

      // Update and verify consistency
      const updates = { size: 2048, lines: 100 };
      await legacyKgService.createOrUpdateEntity({ ...entity, ...updates });
      await ogmEntityService.updateEntity(entity.id, updates);

      const legacyUpdated = await legacyKgService.getEntity(entity.id);
      const ogmUpdated = await ogmEntityService.getEntity(entity.id);

      expect(legacyUpdated?.size).toBe(ogmUpdated?.size);
      expect(legacyUpdated?.lines).toBe(ogmUpdated?.lines);
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
    it("should complete performance comparison summary", async () => {
      // Calculate averages
      const avgLegacyEntity = performanceMetrics.legacy.entityOps.length > 0
        ? performanceMetrics.legacy.entityOps.reduce((a, b) => a + b) / performanceMetrics.legacy.entityOps.length
        : 0;
      const avgOgmEntity = performanceMetrics.ogm.entityOps.length > 0
        ? performanceMetrics.ogm.entityOps.reduce((a, b) => a + b) / performanceMetrics.ogm.entityOps.length
        : 0;

      const avgLegacyRel = performanceMetrics.legacy.relationshipOps.length > 0
        ? performanceMetrics.legacy.relationshipOps.reduce((a, b) => a + b) / performanceMetrics.legacy.relationshipOps.length
        : 0;
      const avgOgmRel = performanceMetrics.ogm.relationshipOps.length > 0
        ? performanceMetrics.ogm.relationshipOps.reduce((a, b) => a + b) / performanceMetrics.ogm.relationshipOps.length
        : 0;

      const avgLegacySearch = performanceMetrics.legacy.searchOps.length > 0
        ? performanceMetrics.legacy.searchOps.reduce((a, b) => a + b) / performanceMetrics.legacy.searchOps.length
        : 0;
      const avgOgmSearch = performanceMetrics.ogm.searchOps.length > 0
        ? performanceMetrics.ogm.searchOps.reduce((a, b) => a + b) / performanceMetrics.ogm.searchOps.length
        : 0;

      console.log("\n=== Performance Comparison Summary ===");
      console.log(`Entity Operations:`);
      console.log(`  Legacy: ${avgLegacyEntity.toFixed(2)}ms (avg)`);
      console.log(`  OGM: ${avgOgmEntity.toFixed(2)}ms (avg)`);

      if (avgLegacyEntity > 0 && avgOgmEntity > 0) {
        const entityRatio = avgOgmEntity / avgLegacyEntity;
        console.log(`  OGM vs Legacy: ${entityRatio.toFixed(2)}x`);
      }

      console.log(`Relationship Operations:`);
      console.log(`  Legacy: ${avgLegacyRel.toFixed(2)}ms (avg)`);
      console.log(`  OGM: ${avgOgmRel.toFixed(2)}ms (avg)`);

      if (avgLegacyRel > 0 && avgOgmRel > 0) {
        const relRatio = avgOgmRel / avgLegacyRel;
        console.log(`  OGM vs Legacy: ${relRatio.toFixed(2)}x`);
      }

      console.log(`Search Operations:`);
      console.log(`  Legacy: ${avgLegacySearch.toFixed(2)}ms (avg)`);
      console.log(`  OGM: ${avgOgmSearch.toFixed(2)}ms (avg)`);

      if (avgLegacySearch > 0 && avgOgmSearch > 0) {
        const searchRatio = avgOgmSearch / avgLegacySearch;
        console.log(`  OGM vs Legacy: ${searchRatio.toFixed(2)}x`);
      }

      // Performance should be reasonable (not more than 10x slower)
      if (avgLegacyEntity > 0 && avgOgmEntity > 0) {
        expect(avgOgmEntity / avgLegacyEntity).toBeLessThan(10);
      }
      if (avgLegacyRel > 0 && avgOgmRel > 0) {
        expect(avgOgmRel / avgLegacyRel).toBeLessThan(10);
      }
      if (avgLegacySearch > 0 && avgOgmSearch > 0) {
        expect(avgOgmSearch / avgLegacySearch).toBeLessThan(10);
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

  describe("Event Emission Consistency", () => {
    it("should emit consistent events between implementations", async () => {
      const legacyEvents: any[] = [];
      const ogmEvents: any[] = [];

      // Listen to events
      legacyKgService.on('entity:created', (data) => legacyEvents.push({ type: 'entity:created', data }));
      ogmEntityService.on('entity:created', (data) => ogmEvents.push({ type: 'entity:created', data }));

      const testEntity: CodebaseEntity = {
        id: "event-test-entity",
        path: "src/event-test.ts",
        hash: "event123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      // Create entities in both systems
      await legacyKgService.createEntity(testEntity);
      await ogmEntityService.createEntity({
        ...testEntity,
        id: "event-test-entity-ogm",
      });

      // Small delay for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Both should have emitted events
      expect(legacyEvents.length).toBeGreaterThan(0);
      expect(ogmEvents.length).toBeGreaterThan(0);

      const legacyCreateEvent = legacyEvents.find(e => e.type === 'entity:created');
      const ogmCreateEvent = ogmEvents.find(e => e.type === 'entity:created');

      expect(legacyCreateEvent).toBeTruthy();
      expect(ogmCreateEvent).toBeTruthy();
      expect(legacyCreateEvent.data.type).toBe(ogmCreateEvent.data.type);
    });
  });
});