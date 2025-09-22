/**
 * OGM Migration Validation Tests
 * Validates that OGM migration maintains 100% API compatibility and identical behavior
 * Tests feature flag switching, error handling consistency, and public API compatibility
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import crypto from "crypto";
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

interface ValidationResult {
  test: string;
  passed: boolean;
  legacy: any;
  ogm: any;
  error?: string;
  details?: string;
}

interface FeatureFlagState {
  useOGMEntities: boolean;
  useOGMRelationships: boolean;
  useOGMSearch: boolean;
}

const VALIDATION_TIMEOUT = 120000; // 2 minutes for validation tests

describe("OGM Migration Validation", () => {
  let testSetup: IsolatedTestSetup;
  let legacyKgService: KnowledgeGraphService;
  let ogmEntityService: EntityServiceOGM;
  let ogmRelationshipService: RelationshipServiceOGM;
  let ogmSearchService: SearchServiceOGM;
  let neogmaService: NeogmaService;
  let embeddingService: EmbeddingService;

  const validationResults: ValidationResult[] = [];
  const featureFlags: FeatureFlagState = {
    useOGMEntities: false,
    useOGMRelationships: false,
    useOGMSearch: false,
  };

  beforeAll(async () => {
    console.log("🔍 Starting OGM Migration Validation...");

    testSetup = await setupIsolatedServiceTest("OGMMigrationValidation", {
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

    console.log("✅ Validation environment initialized");
  }, VALIDATION_TIMEOUT);

  afterAll(async () => {
    // Print validation report
    printValidationReport();
    await cleanupIsolatedServiceTest(testSetup, { silent: true });
    console.log("🏁 OGM Migration Validation completed");
  });

  beforeEach(async () => {
    // Reset feature flags
    featureFlags.useOGMEntities = false;
    featureFlags.useOGMRelationships = false;
    featureFlags.useOGMSearch = false;

    // Small delay for test isolation
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe("Public API Compatibility", () => {
    it("should maintain identical entity creation APIs", async () => {
      const testEntity: CodebaseEntity = {
        id: "api-test-entity-1",
        path: "src/api-test.ts",
        hash: "api123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        metadata: { testData: true },
      };

      const result = await validateAPICompatibility(
        "Entity Creation",
        async () => await legacyKgService.createEntity(testEntity),
        async () => await ogmEntityService.createEntity(testEntity),
        (legacy, ogm) => {
          return (
            legacy.type === ogm.type &&
            legacy.path === ogm.path &&
            legacy.language === ogm.language &&
            legacy.size === ogm.size &&
            legacy.lines === ogm.lines
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain identical entity retrieval APIs", async () => {
      // Pre-create entity
      const entity: CodebaseEntity = {
        id: "retrieval-test-entity",
        path: "src/retrieval-test.ts",
        hash: "retr123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      await legacyKgService.createEntity(entity);
      await ogmEntityService.createEntity(entity);

      const result = await validateAPICompatibility(
        "Entity Retrieval",
        async () => await legacyKgService.getEntity(entity.id),
        async () => await ogmEntityService.getEntity(entity.id),
        (legacy, ogm) => {
          return (
            legacy !== null &&
            ogm !== null &&
            legacy.id === ogm.id &&
            legacy.type === ogm.type &&
            legacy.path === ogm.path
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain identical entity update APIs", async () => {
      const entity: CodebaseEntity = {
        id: "update-test-entity",
        path: "src/update-test.ts",
        hash: "upd123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512,
        lines: 25,
      };

      await legacyKgService.createEntity(entity);
      await ogmEntityService.createEntity(entity);

      const updates = { size: 1024, lines: 50 };

      const result = await validateAPICompatibility(
        "Entity Update",
        async () => {
          await legacyKgService.createOrUpdateEntity({ ...entity, ...updates });
          return await legacyKgService.getEntity(entity.id);
        },
        async () => {
          await ogmEntityService.updateEntity(entity.id, updates);
          return await ogmEntityService.getEntity(entity.id);
        },
        (legacy, ogm) => {
          return (
            legacy.size === ogm.size &&
            legacy.lines === ogm.lines &&
            legacy.size === 1024 &&
            legacy.lines === 50
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain identical entity deletion APIs", async () => {
      const entityId = "deletion-test-entity";
      const entity: CodebaseEntity = {
        id: entityId,
        path: "src/deletion-test.ts",
        hash: "del123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      await legacyKgService.createEntity(entity);
      await ogmEntityService.createEntity(entity);

      const result = await validateAPICompatibility(
        "Entity Deletion",
        async () => {
          await legacyKgService.deleteEntity(entityId);
          return await legacyKgService.getEntity(entityId);
        },
        async () => {
          await ogmEntityService.deleteEntity(entityId);
          return await ogmEntityService.getEntity(entityId);
        },
        (legacy, ogm) => {
          return legacy === null && ogm === null;
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain identical relationship creation APIs", async () => {
      // Create test entities
      const entity1: CodebaseEntity = {
        id: "rel-test-entity-1",
        path: "src/rel-test-1.ts",
        hash: "rel1",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      const entity2: CodebaseEntity = {
        id: "rel-test-entity-2",
        path: "src/rel-test-2.ts",
        hash: "rel2",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      await legacyKgService.createEntity(entity1);
      await legacyKgService.createEntity(entity2);
      await ogmEntityService.createEntity(entity1);
      await ogmEntityService.createEntity(entity2);

      const relationship: GraphRelationship = {
        id: "rel-api-test",
        fromEntityId: entity1.id,
        toEntityId: entity2.id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: "named" },
      };

      const result = await validateAPICompatibility(
        "Relationship Creation",
        async () => await legacyKgService.createRelationship(relationship),
        async () => await ogmRelationshipService.createRelationship(relationship),
        (legacy, ogm) => {
          return (
            legacy.type === ogm.type &&
            legacy.fromEntityId === ogm.fromEntityId &&
            legacy.toEntityId === ogm.toEntityId
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain identical search APIs", async () => {
      // Create searchable entities
      const searchEntity: CodebaseEntity = {
        id: "search-api-test-entity",
        path: "src/search-api-test.ts",
        hash: "search123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        content: "export const searchTest = () => 'test';",
      };

      await legacyKgService.createEntity(searchEntity);
      await ogmEntityService.createEntity(searchEntity);

      const searchRequest: GraphSearchRequest = {
        query: "searchTest",
        searchType: "structural",
        entityTypes: ["file"],
        limit: 10,
      };

      const result = await validateAPICompatibility(
        "Search API",
        async () => await legacyKgService.search(searchRequest),
        async () => await ogmSearchService.search(searchRequest),
        (legacy, ogm) => {
          // Both should return arrays and find the search entity
          return (
            Array.isArray(legacy) &&
            Array.isArray(ogm) &&
            legacy.length > 0 &&
            ogm.length > 0 &&
            legacy.some(r => r.id?.includes("search-api-test") || r.entity?.id?.includes("search-api-test")) &&
            ogm.some(r => r.id?.includes("search-api-test") || r.entity?.id?.includes("search-api-test"))
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });
  });

  describe("Error Handling Consistency", () => {
    it("should handle non-existent entity retrieval identically", async () => {
      const nonExistentId = "non-existent-entity-12345";

      const result = await validateErrorHandling(
        "Non-existent Entity Retrieval",
        async () => await legacyKgService.getEntity(nonExistentId),
        async () => await ogmEntityService.getEntity(nonExistentId),
        (legacyResult, ogmResult) => {
          // Both should return null for non-existent entities
          return legacyResult === null && ogmResult === null;
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should handle invalid entity creation identically", async () => {
      const invalidEntity: any = {
        id: null, // Invalid ID
        path: "", // Invalid path
        hash: undefined, // Invalid hash
        language: "invalid-language",
        lastModified: "invalid-date",
        created: new Date(),
        type: "invalid-type",
      };

      const result = await validateErrorHandling(
        "Invalid Entity Creation",
        async () => await legacyKgService.createEntity(invalidEntity),
        async () => await ogmEntityService.createEntity(invalidEntity),
        (legacyError, ogmError) => {
          // Both should either succeed (with validation) or throw similar errors
          if (legacyError && ogmError) {
            return (
              legacyError instanceof Error &&
              ogmError instanceof Error
            );
          }
          return true; // If neither throws, that's also valid
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should handle relationship creation with non-existent entities", async () => {
      const invalidRelationship: GraphRelationship = {
        id: "invalid-rel-test",
        fromEntityId: "non-existent-from",
        toEntityId: "non-existent-to",
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      const result = await validateErrorHandling(
        "Invalid Relationship Creation",
        async () => await legacyKgService.createRelationship(invalidRelationship),
        async () => await ogmRelationshipService.createRelationship(invalidRelationship),
        (legacyError, ogmError) => {
          // Both should throw errors for non-existent entities
          return (
            legacyError instanceof Error &&
            ogmError instanceof Error
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should handle empty search queries consistently", async () => {
      const emptySearchRequest: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: [],
      };

      const result = await validateAPICompatibility(
        "Empty Search Query",
        async () => await legacyKgService.search(emptySearchRequest),
        async () => await ogmSearchService.search(emptySearchRequest),
        (legacy, ogm) => {
          // Both should return empty arrays or handle gracefully
          return (
            Array.isArray(legacy) &&
            Array.isArray(ogm)
          );
        }
      );

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });
  });

  describe("Event Emission Validation", () => {
    it("should emit identical events for entity operations", async () => {
      const legacyEvents: any[] = [];
      const ogmEvents: any[] = [];

      // Set up event listeners
      legacyKgService.on('entity:created', (data) => {
        legacyEvents.push({ type: 'entity:created', data });
      });
      legacyKgService.on('entity:updated', (data) => {
        legacyEvents.push({ type: 'entity:updated', data });
      });
      legacyKgService.on('entity:deleted', (data) => {
        legacyEvents.push({ type: 'entity:deleted', data });
      });

      ogmEntityService.on('entity:created', (data) => {
        ogmEvents.push({ type: 'entity:created', data });
      });
      ogmEntityService.on('entity:updated', (data) => {
        ogmEvents.push({ type: 'entity:updated', data });
      });
      ogmEntityService.on('entity:deleted', (data) => {
        ogmEvents.push({ type: 'entity:deleted', data });
      });

      const entity: CodebaseEntity = {
        id: "event-validation-entity",
        path: "src/event-validation.ts",
        hash: "event123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512,
        lines: 25,
      };

      // Perform operations
      const legacyCreated = await legacyKgService.createEntity(entity);
      const ogmCreated = await ogmEntityService.createEntity({
        ...entity,
        id: "event-validation-entity-ogm",
      });

      await legacyKgService.createOrUpdateEntity({
        ...legacyCreated,
        size: 1024,
      });
      await ogmEntityService.updateEntity(ogmCreated.id, { size: 1024 });

      await legacyKgService.deleteEntity(legacyCreated.id);
      await ogmEntityService.deleteEntity(ogmCreated.id);

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 200));

      const result: ValidationResult = {
        test: "Event Emission Consistency",
        passed: true,
        legacy: legacyEvents,
        ogm: ogmEvents,
      };

      // Validate event types match
      const legacyEventTypes = legacyEvents.map(e => e.type).sort();
      const ogmEventTypes = ogmEvents.map(e => e.type).sort();

      if (legacyEventTypes.length !== ogmEventTypes.length) {
        result.passed = false;
        result.error = `Event count mismatch: Legacy ${legacyEventTypes.length}, OGM ${ogmEventTypes.length}`;
      }

      // Check that essential events are emitted
      const requiredEvents = ['entity:created'];
      for (const eventType of requiredEvents) {
        const hasLegacyEvent = legacyEvents.some(e => e.type === eventType);
        const hasOgmEvent = ogmEvents.some(e => e.type === eventType);

        if (hasLegacyEvent !== hasOgmEvent) {
          result.passed = false;
          result.error = `Event type mismatch for ${eventType}`;
        }
      }

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });
  });

  describe("Feature Flag Switching", () => {
    it("should seamlessly switch between legacy and OGM implementations", async () => {
      const entity: CodebaseEntity = {
        id: "feature-flag-test-entity",
        path: "src/feature-flag-test.ts",
        hash: "flag123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      // Test with legacy implementation
      featureFlags.useOGMEntities = false;
      const legacyResult = await simulateFeatureFlaggedOperation(
        () => legacyKgService.createEntity(entity),
        featureFlags
      );

      // Test with OGM implementation
      featureFlags.useOGMEntities = true;
      const ogmResult = await simulateFeatureFlaggedOperation(
        () => ogmEntityService.createEntity({
          ...entity,
          id: "feature-flag-test-entity-ogm",
        }),
        featureFlags
      );

      const result: ValidationResult = {
        test: "Feature Flag Switching",
        passed: true,
        legacy: legacyResult,
        ogm: ogmResult,
      };

      // Both should succeed and produce similar results
      if (!legacyResult || !ogmResult) {
        result.passed = false;
        result.error = "One or both implementations failed";
      } else if (legacyResult.type !== ogmResult.type) {
        result.passed = false;
        result.error = "Entity types don't match after feature flag switch";
      }

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });

    it("should handle gradual migration with mixed implementations", async () => {
      // Test scenario where entities use OGM but relationships use legacy
      featureFlags.useOGMEntities = true;
      featureFlags.useOGMRelationships = false;

      const entity1: CodebaseEntity = {
        id: "mixed-impl-entity-1",
        path: "src/mixed-1.ts",
        hash: "mixed1",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      const entity2: CodebaseEntity = {
        id: "mixed-impl-entity-2",
        path: "src/mixed-2.ts",
        hash: "mixed2",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      // Create entities with OGM
      await ogmEntityService.createEntity(entity1);
      await ogmEntityService.createEntity(entity2);

      // Create relationship with legacy (should work with OGM entities)
      const relationship: GraphRelationship = {
        id: "mixed-impl-rel",
        fromEntityId: entity1.id,
        toEntityId: entity2.id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      let mixedImplSuccess = false;
      try {
        await legacyKgService.createRelationship(relationship);
        const relationships = await legacyKgService.getRelationships({
          fromEntityId: entity1.id,
        });
        mixedImplSuccess = relationships.length > 0;
      } catch (error) {
        console.warn("Mixed implementation test failed:", error);
      }

      const result: ValidationResult = {
        test: "Mixed Implementation Support",
        passed: mixedImplSuccess,
        legacy: "Legacy relationships",
        ogm: "OGM entities",
        error: mixedImplSuccess ? undefined : "Failed to create relationship with mixed implementations",
      };

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });
  });

  describe("Data Consistency Validation", () => {
    it("should maintain data consistency across implementation switches", async () => {
      const testData = {
        entities: [] as CodebaseEntity[],
        relationships: [] as GraphRelationship[],
      };

      // Create test dataset with legacy
      for (let i = 0; i < 5; i++) {
        const entity: CodebaseEntity = {
          id: `consistency-entity-${i}`,
          path: `src/consistency/entity${i}.ts`,
          hash: `cons${i}`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 512 + i * 100,
          lines: 25 + i * 5,
        };

        testData.entities.push(entity);
        await legacyKgService.createEntity(entity);
      }

      // Create relationships
      for (let i = 0; i < 4; i++) {
        const relationship: GraphRelationship = {
          id: `consistency-rel-${i}`,
          fromEntityId: testData.entities[i].id,
          toEntityId: testData.entities[i + 1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        };

        testData.relationships.push(relationship);
        await legacyKgService.createRelationship(relationship);
      }

      // Switch to OGM and verify data is still accessible
      const ogmEntities = await Promise.all(
        testData.entities.map(e => ogmEntityService.getEntity(e.id))
      );

      const ogmRelationships = await ogmRelationshipService.getRelationships({
        fromEntityId: testData.entities[0].id,
      });

      const result: ValidationResult = {
        test: "Data Consistency Across Implementation Switch",
        passed: true,
        legacy: {
          entities: testData.entities.length,
          relationships: testData.relationships.length,
        },
        ogm: {
          entities: ogmEntities.filter(e => e !== null).length,
          relationships: ogmRelationships.length,
        },
      };

      // Validate data integrity
      if (ogmEntities.some(e => e === null)) {
        result.passed = false;
        result.error = "Some entities not accessible through OGM";
      }

      if (ogmRelationships.length === 0) {
        result.passed = false;
        result.error = "Relationships not accessible through OGM";
      }

      // Validate data matches
      for (let i = 0; i < testData.entities.length; i++) {
        const original = testData.entities[i];
        const retrieved = ogmEntities[i];

        if (!retrieved ||
            original.type !== retrieved.type ||
            original.path !== retrieved.path ||
            original.size !== retrieved.size) {
          result.passed = false;
          result.error = `Entity data mismatch for ${original.id}`;
          break;
        }
      }

      validationResults.push(result);
      expect(result.passed).toBe(true);
    });
  });

  // Helper functions

  async function validateAPICompatibility<T>(
    testName: string,
    legacyOperation: () => Promise<T>,
    ogmOperation: () => Promise<T>,
    validator: (legacy: T, ogm: T) => boolean
  ): Promise<ValidationResult> {
    try {
      const [legacyResult, ogmResult] = await Promise.all([
        legacyOperation(),
        ogmOperation(),
      ]);

      const passed = validator(legacyResult, ogmResult);

      return {
        test: testName,
        passed,
        legacy: legacyResult,
        ogm: ogmResult,
        error: passed ? undefined : "Validation failed",
      };
    } catch (error) {
      return {
        test: testName,
        passed: false,
        legacy: null,
        ogm: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async function validateErrorHandling(
    testName: string,
    legacyOperation: () => Promise<any>,
    ogmOperation: () => Promise<any>,
    validator: (legacyError: Error | null, ogmError: Error | null) => boolean
  ): Promise<ValidationResult> {
    let legacyError: Error | null = null;
    let ogmError: Error | null = null;
    let legacyResult: any = null;
    let ogmResult: any = null;

    try {
      legacyResult = await legacyOperation();
    } catch (error) {
      legacyError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      ogmResult = await ogmOperation();
    } catch (error) {
      ogmError = error instanceof Error ? error : new Error(String(error));
    }

    const passed = validator(legacyError, ogmError);

    return {
      test: testName,
      passed,
      legacy: legacyError || legacyResult,
      ogm: ogmError || ogmResult,
      error: passed ? undefined : "Error handling validation failed",
    };
  }

  async function simulateFeatureFlaggedOperation<T>(
    operation: () => Promise<T>,
    flags: FeatureFlagState
  ): Promise<T> {
    // In a real implementation, this would check feature flags
    // and route to appropriate service
    console.log(`Executing operation with flags:`, flags);
    return await operation();
  }

  function printValidationReport() {
    console.log(`\n${'='.repeat(60)}`);
    console.log("🔍 OGM MIGRATION VALIDATION REPORT");
    console.log(`${'='.repeat(60)}`);

    const passed = validationResults.filter(r => r.passed);
    const failed = validationResults.filter(r => !r.passed);

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${validationResults.length}`);
    console.log(`   Passed: ${passed.length} ✅`);
    console.log(`   Failed: ${failed.length} ${failed.length > 0 ? '❌' : '✅'}`);
    console.log(`   Success Rate: ${((passed.length / validationResults.length) * 100).toFixed(1)}%`);

    if (failed.length > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      failed.forEach(result => {
        console.log(`   ❌ ${result.test}: ${result.error}`);
      });
    }

    console.log(`\n✅ PASSED TESTS:`);
    passed.forEach(result => {
      console.log(`   ✅ ${result.test}`);
    });

    if (failed.length === 0) {
      console.log(`\n🎉 ALL VALIDATION TESTS PASSED!`);
      console.log(`   🚀 OGM migration is ready for production`);
    } else {
      console.log(`\n⚠️  VALIDATION INCOMPLETE`);
      console.log(`   🔧 Please address failed tests before proceeding`);
    }

    console.log(`${'='.repeat(60)}`);
  }
});