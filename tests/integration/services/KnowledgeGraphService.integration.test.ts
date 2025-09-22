/**
 * Integration tests for KnowledgeGraphService
 * Tests graph operations, vector embeddings, and entity relationships across databases
 */

import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService";
import { DatabaseService } from "../../../src/services/core/DatabaseService";
import {
  setupIsolatedServiceTest,
  cleanupIsolatedServiceTest,
  IsolatedTestSetup,
} from "../../test-utils/database-helpers";
import { CodebaseEntity, RelationshipType } from "../../../src/models/entities";
import { GraphRelationship } from "../../../src/models/relationships";
import { GraphSearchRequest } from "../../../src/models/types";
import { canonicalRelationshipId } from "../../../src/utils/codeEdges";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("KnowledgeGraphService Integration", () => {
  let testSetup: IsolatedTestSetup;
  let kgService: KnowledgeGraphService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    // Setup isolated test environment
    testSetup = await setupIsolatedServiceTest("KnowledgeGraphService", {
      silent: true,
    });

    kgService = testSetup.kgService;
    dbService = testSetup.dbService;
  }, 30000);

  afterAll(async () => {
    // Clean up isolated test environment
    await cleanupIsolatedServiceTest(testSetup, { silent: true });
  });

  beforeEach(async () => {
    // Each test gets a clean slate within the isolated context
    // The isolation context already provides separation, so minimal cleanup needed
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay for consistency
  });

  describe("Entity CRUD Operations", () => {
    it("should create and retrieve entities successfully", async () => {
      const rawId = "test-entity-1";
      const testEntity: CodebaseEntity = {
        id: rawId,
        path: "src/test.ts",
        hash: "abc123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(testEntity);
      const namespacedId = testEntity.id;
      const retrieved = await kgService.getEntity(namespacedId);
      const retrievedViaRawId = await kgService.getEntity(rawId);

      expect(retrieved).toEqual(expect.objectContaining({ id: testEntity.id }));
      expect(retrieved?.path).toBe(testEntity.path);
      expect(retrieved?.language).toBe(testEntity.language);
      expect(retrieved?.type).toBe("file");
      expect(retrievedViaRawId?.id).toBe(namespacedId);
    });

    it("should create entities with different types", async () => {
      const entities: CodebaseEntity[] = [
        {
          id: "function-entity",
          path: "src/utils/helper.ts",
          hash: "func123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          signature: "function helper(): void",
          startLine: 10,
          endLine: 15,
        },
        {
          id: "class-entity",
          path: "src/models/User.ts",
          hash: "class123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          signature: "class User",
          startLine: 1,
          endLine: 50,
        },
      ];

      for (const entity of entities) {
        await kgService.createEntity(entity);
        const retrieved = await kgService.getEntity(entity.id);
        expect(retrieved).toEqual(expect.any(Object));
        expect(retrieved?.type).toBe(entity.type);
      }
    });

    it("should update entities correctly", async () => {
      const originalEntity: CodebaseEntity = {
        id: "update-test-entity",
        path: "src/original.ts",
        hash: "orig123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 512,
        lines: 25,
      };

      await kgService.createEntity(originalEntity);

      // Update the entity
      const updates: Partial<CodebaseEntity> = {
        size: 2048,
        lines: 100,
        lastModified: new Date(),
      };

      await kgService.createOrUpdateEntity({ ...originalEntity, ...updates });

      // Add a small delay to ensure the update is committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await kgService.getEntity(originalEntity.id);
      expect(updated?.size).toBe(2048);
      expect(updated?.lines).toBe(100);
    });

    it("should delete entities and their relationships", async () => {
      const entity1: CodebaseEntity = {
        id: "delete-test-1",
        path: "src/delete1.ts",
        hash: "del123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      const entity2: CodebaseEntity = {
        id: "delete-test-2",
        path: "src/delete2.ts",
        hash: "del456",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      // Create relationship
      const relationship: GraphRelationship = {
        id: "delete-rel-1",
        fromEntityId: entity1.id,
        toEntityId: entity2.id,
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      await kgService.createRelationship(relationship);

      // Delete entity and check relationships are also deleted
      await kgService.deleteEntity(entity1.id);

      // Add a small delay to ensure the deletion is committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const deletedEntity = await kgService.getEntity(entity1.id);
      expect(deletedEntity).toBeNull();

      const remainingRelationships = await kgService.getRelationships({
        fromEntityId: entity1.id,
      });
      expect(remainingRelationships.length).toBe(0);
    });
  });

  describe("Relationship Operations", () => {
    const rawEntityIds = {
      from: "rel-entity-1",
      to: "rel-entity-2",
    } as const;
    let testEntities: CodebaseEntity[];

    beforeEach(async () => {
      const staleEntityIds = [rawEntityIds.from, rawEntityIds.to];
      for (const entityId of staleEntityIds) {
        try {
          await kgService.deleteEntity(entityId);
        } catch (error) {
          // Entity might not exist yet in a fresh run; ignore cleanup errors
        }
      }

      testEntities = [
        {
          id: rawEntityIds.from,
          path: "src/main.ts",
          hash: "main123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: rawEntityIds.to,
          path: "src/utils.ts",
          hash: "utils123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
      ];

      for (const entity of testEntities) {
        await kgService.createEntity(entity);
      }
    });

    it("should create and query relationships", async () => {
      const relationship: GraphRelationship = {
        id: "test-relationship-1",
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: "named" },
      };

      await kgService.createRelationship(relationship);

      const retrievedRelationships = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
        type: RelationshipType.IMPORTS,
      });

      expect(retrievedRelationships.length).toBe(1);
      expect(retrievedRelationships[0].type).toBe(RelationshipType.IMPORTS);
      expect(retrievedRelationships[0].fromEntityId).toBe(testEntities[0].id);
      expect(retrievedRelationships[0].toEntityId).toBe(testEntities[1].id);

      const retrievedViaRawId = await kgService.getRelationships({
        fromEntityId: rawEntityIds.from,
        type: RelationshipType.IMPORTS,
      });

      expect(retrievedViaRawId.length).toBe(1);
      expect(retrievedViaRawId[0].fromEntityId).toBe(testEntities[0].id);
      expect(retrievedViaRawId[0].toEntityId).toBe(testEntities[1].id);
    });

    it("should handle multiple relationship types", async () => {
      const relationships: GraphRelationship[] = [
        {
          id: "multi-rel-1",
          fromEntityId: testEntities[0].id,
          toEntityId: testEntities[1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "multi-rel-2",
          fromEntityId: testEntities[0].id,
          toEntityId: testEntities[1].id,
          type: RelationshipType.REFERENCES,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      for (const rel of relationships) {
        await kgService.createRelationship(rel);
      }

      const allRelationships = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
      });

      expect(allRelationships.length).toBe(2);
      const types = allRelationships.map((r) => r.type);
      expect(types).toContain(RelationshipType.CALLS);
      expect(types).toContain(RelationshipType.REFERENCES);
    });

    it("should query relationships by time range", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      const relationship: GraphRelationship = {
        id: "time-rel-1",
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.DEPENDS_ON,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      await kgService.createRelationship(relationship);

      const timeRangeResults = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
        since: pastDate,
        until: futureDate,
      });

      expect(timeRangeResults.length).toBe(1);
      // The system generates canonical IDs based on relationship content
      const prefix = testSetup.testContext.entityPrefix ?? "";
      const idPattern = new RegExp(
        `^${escapeRegex(prefix)}time-rel_[a-f0-9]{40}$`
      );
      expect(timeRangeResults[0].id).toMatch(idPattern);
      expect(timeRangeResults[0].fromEntityId).toBe(relationship.fromEntityId);
      expect(timeRangeResults[0].toEntityId).toBe(relationship.toEntityId);
      expect(timeRangeResults[0].type).toBe(relationship.type);
    });

    it("should persist structural metadata for import relationships", async () => {
      const created = new Date();
      const relationship: GraphRelationship = {
        id: "structural-import-meta",
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.IMPORTS,
        created,
        lastModified: created,
        version: 1,
        metadata: {
          importKind: "namespace",
          alias: "Utils",
          module: "../lib/utils/index.js",
          importDepth: 2,
          isNamespace: true,
          language: "JavaScript",
          symbolKind: "Module",
          resolutionState: "partial",
        },
      };

      await kgService.createRelationship(relationship);

      const retrievedRelationships = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
        type: RelationshipType.IMPORTS,
      });

      expect(retrievedRelationships.length).toBeGreaterThanOrEqual(1);
      const retrieved = retrievedRelationships.find((rel) => rel.id === relationship.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.importAlias).toBe("Utils");
      expect(retrieved?.importType).toBe("namespace");
      expect(retrieved?.isNamespace).toBe(true);
      expect(retrieved?.modulePath).toBe("../lib/utils/index.js");
      expect(retrieved?.language).toBe("javascript");
      expect(retrieved?.symbolKind).toBe("module");
      expect(retrieved?.metadata?.resolutionState).toBe("partial");
    });

    it("persists structural metadata for alternate language relationships", async () => {
      const pythonFile: CodebaseEntity = {
        id: "file:src/models/user.py",
        path: "src/models/user.py",
        hash: "userpy123",
        language: "python",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      } as CodebaseEntity;
      const pythonSymbol: CodebaseEntity = {
        id: "sym:src/models/user.py#User@dataclass",
        path: "src/models/user.py:User",
        hash: "usercls456",
        language: "python",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "class",
        signature: "@dataclass class User: ...",
      } as CodebaseEntity;

      await kgService.createEntity(pythonFile);
      await kgService.createEntity(pythonSymbol);

      const relationship: GraphRelationship = {
        id: "structural-python-contains",
        fromEntityId: pythonFile.id,
        toEntityId: pythonSymbol.id,
        type: RelationshipType.CONTAINS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: {
          language: "Python",
          symbolKind: "Class",
          modulePath: "models//user.py",
          languageSpecific: { decorator: "dataclass" },
        },
      };

      await kgService.createRelationship(relationship);

      const retrieved = await kgService.getRelationships({
        fromEntityId: pythonFile.id,
        type: RelationshipType.CONTAINS,
      });

      expect(retrieved.length).toBeGreaterThanOrEqual(1);
      const contains = retrieved.find((rel) => rel.id === relationship.id);
      expect(contains).toBeDefined();
      expect(contains?.language).toBe("python");
      expect(contains?.symbolKind).toBe("class");
      expect(contains?.modulePath).toBe("models/user.py");
      expect(contains?.metadata?.languageSpecific).toEqual({
        decorator: "dataclass",
      });
    });

    it("supports structural navigation helpers end-to-end", async () => {
      const moduleEntity: CodebaseEntity = {
        id: "nav-module-entity",
        path: "src/navigation/app.ts",
        hash: "nav-module",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };
      const childSymbol: CodebaseEntity = {
        id: "sym:src/navigation/app.ts#Component@1234",
        path: "src/navigation/app.ts:Component",
        hash: "component-hash",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "class",
        signature: "class Component {}",
        startLine: 5,
        endLine: 40,
      } as CodebaseEntity;
      const targetSymbol: CodebaseEntity = {
        id: "sym:src/navigation/utils.ts#helper@abcd",
        path: "src/navigation/utils.ts:helper",
        hash: "helper-hash",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "function",
        signature: "function helper(): void",
        startLine: 1,
        endLine: 10,
      } as CodebaseEntity;

      await kgService.createEntity(moduleEntity);
      await kgService.createEntity(childSymbol);
      await kgService.createEntity(targetSymbol);

      const containsRel: GraphRelationship = {
        id: "nav-contains-relationship",
        fromEntityId: moduleEntity.id,
        toEntityId: childSymbol.id,
        type: RelationshipType.CONTAINS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: {
          language: "typescript",
          symbolKind: "class",
        },
      };
      const importRel: GraphRelationship = {
        id: "nav-import-relationship",
        fromEntityId: moduleEntity.id,
        toEntityId: targetSymbol.id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: {
          importKind: "named",
          alias: "helper",
          module: "./utils",
          resolutionState: "resolved",
          language: "typescript",
        },
      };
      const definesRel: GraphRelationship = {
        id: "nav-defines-relationship",
        fromEntityId: moduleEntity.id,
        toEntityId: childSymbol.id,
        type: RelationshipType.DEFINES,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      await kgService.createRelationship(containsRel);
      await kgService.createRelationship(importRel);
      await kgService.createRelationship(definesRel);

      const moduleChildren = await kgService.listModuleChildren(moduleEntity.path, {
        includeFiles: false,
        includeSymbols: true,
        limit: 10,
      });

      expect(moduleChildren.parentId).toBe(moduleEntity.id);
      expect(moduleChildren.children).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            entity: expect.objectContaining({ id: childSymbol.id }),
            relationship: expect.objectContaining({ type: RelationshipType.CONTAINS }),
          }),
        ])
      );

      const imports = await kgService.listImports(moduleEntity.id, {
        resolvedOnly: true,
        language: "typescript",
        limit: 5,
      });

      expect(imports.entityId).toBe(moduleEntity.id);
      expect(imports.imports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relationship: expect.objectContaining({ type: RelationshipType.IMPORTS }),
            target: expect.objectContaining({ id: targetSymbol.id }),
          }),
        ])
      );

      const definition = await kgService.findDefinition(childSymbol.id);
      expect(definition.symbolId).toBe(childSymbol.id);
      expect(definition.relationship?.type).toBe(RelationshipType.DEFINES);
      expect(definition.source?.id).toBe(moduleEntity.id);
    });

    it("normalizes code edges when persisting relationships", async () => {
      const now = new Date();
      const fromSymbol = {
        id: "sym:src/foo.ts#useLocal@abc",
        path: "src/foo.ts",
        hash: "foo123",
        language: "typescript",
        lastModified: now,
        created: now,
        type: "symbol",
        kind: "function",
        signature: "function useLocal(): number",
        startLine: 5,
        endLine: 25,
        metadata: {},
        name: "useLocal",
      } as unknown as CodebaseEntity;

      const toSymbol = {
        id: "sym:src/bar.ts#Symbol@def",
        path: "src/bar.ts",
        hash: "bar123",
        language: "typescript",
        lastModified: now,
        created: now,
        type: "symbol",
        kind: "class",
        signature: "class Symbol {}",
        startLine: 1,
        endLine: 30,
        metadata: {},
        name: "Symbol",
      } as unknown as CodebaseEntity;

      await kgService.createEntity(fromSymbol);
      await kgService.createEntity(toSymbol);

      const codeEdge = {
        id: "code-edge-int-1",
        fromEntityId: fromSymbol.id,
        toEntityId: toSymbol.id,
        type: "USES" as unknown as RelationshipType,
        created: now,
        lastModified: now,
        version: 1,
        metadata: {
          path: "src/foo.ts",
          line: 7,
          column: 2,
          confidence: 0.7,
          source: "ts",
          evidence: [
            {
              source: "ast",
              location: { path: "src/foo.ts", line: 7, column: 3 },
              note: "Meta note",
              extractorVersion: "v42",
            },
            {
              source: "ast",
              location: { path: "src/foo.ts", line: 7, column: 3 },
            },
          ],
          toRef: {
            kind: "fileSymbol",
            file: "src/bar.ts",
            symbol: "Symbol",
            name: "Symbol",
          },
          fromRef: {
            kind: "fileSymbol",
            file: "src/foo.ts",
            symbol: "useLocal",
            name: "useLocal",
          },
          inferred: true,
        },
        evidence: [
          { source: "type-checker", location: { path: "src/foo.ts", line: 5 } },
          { source: "type-checker", location: { path: "src/foo.ts", line: 5 } },
          { source: "heuristic", location: { path: "src/foo.ts", line: 12 } },
        ],
        locations: [
          { path: "src/foo.ts", line: 5 },
          { path: "src/foo.ts", line: 5 },
          { path: "", line: Number.NaN },
        ],
        accessPath: "useLocal",
      } as unknown as GraphRelationship;

      await kgService.createRelationship(codeEdge);

      const results = await kgService.getRelationships({
        fromEntityId: fromSymbol.id,
      });
      expect(results.length).toBe(1);

      const stored = results[0];
      const expectedSiteIdBase = "src/foo.ts|7|2|useLocal";
      const expectedSiteId =
        "site_" +
        crypto
          .createHash("sha1")
          .update(expectedSiteIdBase)
          .digest("hex")
          .slice(0, 12);

      const prefix = testSetup.testContext.entityPrefix ?? "";
      expect(stored.id).toBe(
        `${prefix}${canonicalRelationshipId(stored.fromEntityId, stored)}`
      );
      expect(stored.type).toBe(RelationshipType.TYPE_USES);
      expect(stored.source).toBe("type-checker");
      expect(stored.confidence).toBeCloseTo(0.7, 5);
      expect(stored.context).toBe("src/foo.ts:7");
      expect(stored.location).toEqual({
        path: "src/foo.ts",
        line: 7,
        column: 2,
      });
      expect(stored.evidence).toEqual([
        { source: "type-checker", location: { path: "src/foo.ts", line: 5 } },
        {
          source: "ast",
          location: { path: "src/foo.ts", line: 7, column: 3 },
          note: "Meta note",
          extractorVersion: "v42",
        },
        { source: "heuristic", location: { path: "src/foo.ts", line: 12 } },
      ]);
      expect(Array.isArray(stored.locations)).toBe(true);
      expect(stored.locations).toEqual(
        expect.arrayContaining([{ path: "src/foo.ts", line: 5 }])
      );
      expect(stored.siteId).toBe(expectedSiteId);
      expect(stored.siteHash).toMatch(/^sh_[0-9a-f]{16}$/);
      expect(stored.accessPath).toBe("useLocal");
      expect(stored.to_ref_kind).toBe("fileSymbol");
      expect(stored.to_ref_file).toBe("src/bar.ts");
      expect(stored.to_ref_symbol).toBe("Symbol");
      expect(stored.metadata).toMatchObject({
        path: "src/foo.ts",
        line: 7,
        column: 2,
        confidence: 0.7,
        source: "ts",
        inferred: true,
        toRef: {
          kind: "fileSymbol",
          file: "src/bar.ts",
          symbol: "Symbol",
          name: "Symbol",
        },
        fromRef: {
          kind: "fileSymbol",
          file: "src/foo.ts",
          symbol: "useLocal",
          name: "useLocal",
        },
      });
      expect(Array.isArray(stored.evidence)).toBe(true);
      if (Array.isArray(stored.sites)) {
        expect(stored.sites).toContain(expectedSiteId);
      } else if (typeof stored.sites === "string") {
        expect(stored.sites).toContain(expectedSiteId);
      }
    });

    it("bulk merges code edges when using createRelationshipsBulk", async () => {
      const now = new Date();
      const fromSymbol = {
        id: "sym:src/bulkSource.ts#caller@hash",
        path: "src/bulkSource.ts",
        hash: "bulk-src-1",
        language: "typescript",
        lastModified: now,
        created: now,
        type: "symbol",
        kind: "function",
        signature: "function caller(): void",
        startLine: 1,
        endLine: 20,
        metadata: {},
        name: "caller",
      } as unknown as CodebaseEntity;

      const toSymbol = {
        id: "sym:src/bulkTarget.ts#BulkTarget@hash",
        path: "src/bulkTarget.ts",
        hash: "bulk-tgt-1",
        language: "typescript",
        lastModified: now,
        created: now,
        type: "symbol",
        kind: "class",
        signature: "class BulkTarget {}",
        startLine: 1,
        endLine: 50,
        metadata: {},
        name: "BulkTarget",
      } as unknown as CodebaseEntity;

      await kgService.createEntity(fromSymbol);
      await kgService.createEntity(toSymbol);

      const relationships: GraphRelationship[] = [
        {
          fromEntityId: fromSymbol.id,
          toEntityId: toSymbol.id,
          type: RelationshipType.CALLS,
          created: new Date("2024-05-01T00:00:00Z"),
          lastModified: new Date("2024-05-01T00:00:00Z"),
          version: 1,
          occurrencesScan: 1,
          accessPath: "useBulk",
          evidence: [
            {
              source: "type-checker",
              location: { path: "src/bulkSource.ts", line: 12 },
            },
          ] as any,
          locations: [{ path: "src/bulkSource.ts", line: 12 }],
          sites: ["seed_site"],
          metadata: {
            path: "src/bulkSource.ts",
            line: 12,
            scope: "imported",
            evidence: [
              {
                source: "ast",
                location: { path: "src/bulkSource.ts", line: 12, column: 2 },
              },
            ],
            toRef: {
              kind: "fileSymbol",
              file: "src/bulkTarget.ts",
              symbol: "BulkTarget",
              name: "BulkTarget",
            },
          },
        },
        {
          fromEntityId: fromSymbol.id,
          toEntityId: toSymbol.id,
          type: RelationshipType.CALLS,
          created: new Date("2024-05-03T00:00:00Z"),
          lastModified: new Date("2024-05-04T00:00:00Z"),
          version: 1,
          occurrencesScan: 2,
          resolved: true,
          evidence: [
            {
              source: "heuristic",
              location: { path: "src/bulkSource.ts", line: 18 },
            },
          ] as any,
          sites: ["another_site"],
          metadata: {
            path: "src/bulkSource.ts",
            line: 18,
            evidence: [
              {
                source: "type-checker",
                location: { path: "src/bulkSource.ts", line: 18 },
              },
            ],
            locations: [{ path: "src/bulkSource.ts", line: 18 }],
          },
        },
      ];

      await kgService.createRelationshipsBulk(relationships);

      const storedRelationships = await kgService.getRelationships({
        fromEntityId: fromSymbol.id,
      });

      expect(storedRelationships).toHaveLength(1);

      const stored = storedRelationships[0];
      const prefix = testSetup.testContext.entityPrefix ?? "";
      const expectedId = `${prefix}${canonicalRelationshipId(fromSymbol.id, {
        toEntityId: toSymbol.id,
        type: RelationshipType.CALLS,
      } as GraphRelationship)}`;

      expect(stored.id).toBe(expectedId);
      expect(stored.type).toBe(RelationshipType.CALLS);
      expect(stored.occurrencesScan).toBe(3);
      expect(stored.context).toBe("src/bulkSource.ts:12");
      expect(stored.to_ref_kind).toBe("fileSymbol");
      expect(stored.to_ref_file).toBe("src/bulkTarget.ts");
      expect(stored.to_ref_symbol).toBe("BulkTarget");
      expect(stored.confidence).toBe(1);
      expect(stored.resolved).toBe(true);

      expect(stored.evidence).toEqual(
        expect.arrayContaining([
          {
            source: "type-checker",
            location: { path: "src/bulkSource.ts", line: 12 },
          },
          {
            source: "type-checker",
            location: { path: "src/bulkSource.ts", line: 18 },
          },
          {
            source: "ast",
            location: { path: "src/bulkSource.ts", line: 12, column: 2 },
          },
          {
            source: "heuristic",
            location: { path: "src/bulkSource.ts", line: 18 },
          },
        ])
      );

      expect(stored.locations).toEqual(
        expect.arrayContaining([
          { path: "src/bulkSource.ts", line: 12 },
          { path: "src/bulkSource.ts", line: 18 },
        ])
      );

      const sites = Array.isArray(stored.sites)
        ? stored.sites
        : stored.sites
        ? [stored.sites]
        : [];
      expect(sites).toEqual(
        expect.arrayContaining(["seed_site", "another_site"])
      );
      expect(stored.siteId).toBeDefined();
      if (stored.siteId) {
        expect(sites).toContain(stored.siteId);
      }
      expect(stored.siteHash).toMatch(/^sh_[0-9a-f]{16}$/);
    });
  });

  describe("Structural history and indexing", () => {
    it("should ensure graph indexes idempotently without IF NOT EXISTS syntax", async () => {
      await expect(kgService.ensureGraphIndexes()).resolves.toBeUndefined();
      await expect(kgService.ensureGraphIndexes()).resolves.toBeUndefined();
      const firstEnsure = await kgService.ensureIndices();
      expect(firstEnsure).toMatchObject({
        status: expect.stringMatching(/completed|deferred|failed/),
        stats: expect.objectContaining({ created: expect.any(Number) }),
      });

      const secondEnsure = await kgService.ensureIndices();
      expect(secondEnsure).toMatchObject({
        status: expect.stringMatching(/completed|deferred|failed/),
        stats: expect.objectContaining({ created: expect.any(Number) }),
      });
    });

    it("should capture module history with confidence and scope metadata", async () => {
      const suffix = Date.now().toString(36);

      const moduleBase: CodebaseEntity = {
        id: `module-history-${suffix}`,
        path: `packages/history-${suffix}/package.json`,
        hash: `hash-module-${suffix}`,
        language: "node",
        lastModified: new Date(),
        created: new Date(),
        type: "module",
        name: `history-module-${suffix}`,
      } as any;
      await kgService.createEntity(moduleBase as CodebaseEntity);
      const moduleStored = await kgService.getEntity(moduleBase.id);
      expect(moduleStored).toBeTruthy();
      const moduleId = moduleStored!.id;
      const modulePathResolved = moduleStored!.path || moduleBase.path;
      expect(modulePathResolved).toBeTruthy();
      if (!moduleStored?.path) {
        // Debug helper to understand module path resolution when running in isolation
        // eslint-disable-next-line no-console
        console.log("moduleStored", moduleStored);
      }
      const navigationSummary = await kgService.listModuleChildren(
        modulePathResolved,
        { includeFiles: true, includeSymbols: true, limit: 5 }
      );
      expect(navigationSummary.parentId).toBe(moduleId);

      const fileABase: CodebaseEntity = {
        id: `module-history-fileA-${suffix}`,
        path: `src/history/${suffix}/fileA.ts`,
        hash: `hash-fileA-${suffix}`,
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        name: `fileA-${suffix}`,
      } as any;
      const fileBBase: CodebaseEntity = {
        id: `module-history-fileB-${suffix}`,
        path: `src/history/${suffix}/fileB.ts`,
        hash: `hash-fileB-${suffix}`,
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        name: `fileB-${suffix}`,
      } as any;

      await kgService.createEntity(fileABase as CodebaseEntity);
      await kgService.createEntity(fileBBase as CodebaseEntity);
      const fileAStored = await kgService.getEntity(fileABase.id);
      const fileBStored = await kgService.getEntity(fileBBase.id);
      expect(fileAStored).toBeTruthy();
      expect(fileBStored).toBeTruthy();
      const fileAId = fileAStored!.id;
      const fileBId = fileBStored!.id;

      const now = new Date();
      const edgeToA = {
        id: `struct-history-edge-${suffix}-a`,
        fromEntityId: moduleId,
        toEntityId: fileAId,
        type: RelationshipType.CONTAINS,
        created: now,
        lastModified: now,
        version: 1,
        confidence: 0.9,
        scope: "local",
        metadata: { language: "typescript", scope: "local" },
        firstSeenAt: now,
        lastSeenAt: now,
      } as unknown as GraphRelationship;
      await kgService.createRelationship(edgeToA);

      const beforeClose = await kgService.getRelationships({
        fromEntityId: moduleId,
        type: RelationshipType.CONTAINS,
      });
      expect(
        beforeClose.some((rel) => rel.toEntityId === fileAId)
      ).toBe(true);
      // eslint-disable-next-line no-console
      console.log(
        "beforeClose",
        beforeClose.map((rel) => ({ id: rel.id, to: rel.toEntityId }))
      );

      const closeAt = new Date(now.getTime() + 500);
      await kgService.closeEdge(
        moduleId,
        fileAId,
        RelationshipType.CONTAINS,
        closeAt
      );

      const later = new Date(now.getTime() + 1000);
      const edgeToB = {
        id: `struct-history-edge-${suffix}-b`,
        fromEntityId: moduleId,
        toEntityId: fileBId,
        type: RelationshipType.CONTAINS,
        created: later,
        lastModified: later,
        version: 1,
        confidence: 0.75,
        scope: "external",
        metadata: { language: "typescript", scope: "external" },
        firstSeenAt: later,
        lastSeenAt: later,
      } as unknown as GraphRelationship;
      await kgService.createRelationship(edgeToB);

      const relationships = await kgService.getRelationships({
        fromEntityId: moduleId,
        type: RelationshipType.CONTAINS,
      });
      const relToB = relationships.find((rel) => rel.toEntityId === fileBId);
      expect(relToB).toBeDefined();
      expect(relToB?.confidence).toBeCloseTo(0.75, 5);
      expect(relToB?.scope).toBe("external");

      const history = await kgService.getModuleHistory(modulePathResolved, {
        includeInactive: true,
        limit: 10,
      });

      // eslint-disable-next-line no-console
      console.log("moduleHistory", history);

      const rawRelationships = await (kgService as any).graphDbQuery(
        `MATCH (a {id: $fromId})-[r:CONTAINS]->(b)
         RETURN r.id AS id, r.active AS active, r.temporal AS temporal, b.id AS toId
         ORDER BY coalesce(r.lastModified, r.validFrom) DESC`,
        { fromId: moduleId }
      );
      // eslint-disable-next-line no-console
      console.log("rawRel", rawRelationships);

      expect(history.generatedAt).toBeInstanceOf(Date);
      expect(history.moduleId).toBe(moduleId);
      expect(history.relationships.length).toBeGreaterThanOrEqual(2);

      const closedRel = history.relationships.find(
        (rel) => rel.to.id === fileAId
      );
      expect(closedRel).toBeDefined();
      expect(closedRel?.active).toBe(false);
      expect(closedRel?.confidence).toBeCloseTo(0.9, 5);
      expect(closedRel?.scope).toBe("local");
      expect(
        closedRel?.segments.some((segment) => segment.closedAt instanceof Date)
      ).toBe(true);

      const activeRel = history.relationships.find(
        (rel) => rel.to.id === fileBId
      );
      expect(activeRel).toBeDefined();
      expect(activeRel?.active).toBe(true);
      expect(activeRel?.confidence).toBeCloseTo(0.75, 5);
      expect(activeRel?.scope).toBe("external");
      expect(activeRel?.current?.closedAt).toBeUndefined();
      expect(activeRel?.segments.length).toBeGreaterThan(0);
    });
  });

  describe("Search Operations", () => {
    let searchEntities: CodebaseEntity[];

    beforeEach(async () => {
      searchEntities = [
        {
          id: "search-entity-1",
          path: "src/components/Button.ts",
          hash: "button123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content: "export const Button = () => <button>Click me</button>;",
        },
        {
          id: "search-entity-2",
          path: "src/utils/helpers.ts",
          hash: "helpers123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content:
            "export const formatDate = (date: Date) => date.toISOString();",
        },
        {
          id: "search-entity-3",
          path: "src/models/User.ts",
          hash: "user123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content:
            "export interface User { id: string; name: string; email: string; }",
        },
      ];

      for (const entity of searchEntities) {
        await kgService.createEntity(entity);
      }
    });

    it("should perform structural search by entity type", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: ["file"],
      };

      const results = await kgService.search(searchRequest);
      expect(results.length).toBeGreaterThanOrEqual(3);
      results.forEach((result) => {
        expect(result.type).toBe("file");
      });
    });

    it("should perform structural search by language", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: ["file"],
        filters: {
          language: "typescript",
        },
      };

      const results = await kgService.search(searchRequest);
      expect(results.length).toBeGreaterThanOrEqual(3);
      results.forEach((result) => {
        expect(result.language).toBe("typescript");
      });
    });

    it("should perform structural search by path pattern", async () => {
      const searchRequest: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: ["file"],
        filters: {
          path: "components",
        },
      };

      const results = await kgService.search(searchRequest);
      expect(results.some((r) => r.path?.includes("components"))).toBe(true);
    });

    it("should find entities by type", async () => {
      const fileEntities = await kgService.findEntitiesByType("file");
      expect(fileEntities.length).toBeGreaterThanOrEqual(3);
      fileEntities.forEach((entity) => {
        expect(entity.type).toBe("file");
      });
    });
  });

  describe("Path Finding and Traversal", () => {
    let traversalEntities: CodebaseEntity[];

    beforeEach(async () => {
      traversalEntities = [
        {
          id: "traversal-1",
          path: "src/index.ts",
          hash: "idx123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "traversal-2",
          path: "src/components/App.ts",
          hash: "app123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "traversal-3",
          path: "src/utils/api.ts",
          hash: "api123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
      ];

      for (const entity of traversalEntities) {
        await kgService.createEntity(entity);
      }

      // Create relationships to form a graph
      const relationships: GraphRelationship[] = [
        {
          id: "traversal-rel-1",
          fromEntityId: traversalEntities[0].id,
          toEntityId: traversalEntities[1].id,
          type: RelationshipType.IMPORTS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "traversal-rel-2",
          fromEntityId: traversalEntities[1].id,
          toEntityId: traversalEntities[2].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      for (const rel of relationships) {
        await kgService.createRelationship(rel);
      }
    });

    it("should find paths between entities", async () => {
      const paths = await kgService.findPaths({
        startEntityId: traversalEntities[0].id,
        endEntityId: traversalEntities[2].id,
        maxDepth: 3,
      });

      expect(paths.length).toBeGreaterThan(0);
      // Paths should contain the connected entities
      expect(paths.some((path) => path.includes(traversalEntities[0].id))).toBe(
        true
      );
    });

    it("should traverse graph from starting entity", async () => {
      const connectedEntities = await kgService.traverseGraph({
        startEntityId: traversalEntities[0].id,
        maxDepth: 2,
      });

      expect(connectedEntities.length).toBeGreaterThan(0);
      const connectedIds = connectedEntities.map((e) => e.id);
      expect(connectedIds).toContain(traversalEntities[1].id);
    });

    it("should traverse graph with specific relationship types", async () => {
      const connectedEntities = await kgService.traverseGraph({
        startEntityId: traversalEntities[0].id,
        relationshipTypes: [RelationshipType.IMPORTS],
        maxDepth: 2,
      });

      expect(connectedEntities.length).toBeGreaterThan(0);
      const connectedIds = connectedEntities.map((e) => e.id);
      expect(connectedIds).toContain(traversalEntities[1].id);
      // Should not contain traversal-3 since it's connected via CALLS, not IMPORTS
      expect(connectedIds).not.toContain(traversalEntities[2].id);
    });
  });

  describe("Batch Operations and Performance", () => {
    it("should handle batch entity creation efficiently", async () => {
      const batchEntities: CodebaseEntity[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `batch-entity-${i}`,
          path: `src/batch/file${i}.ts`,
          hash: `batch${i}23`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          content: `export const func${i} = () => console.log('Batch ${i}');`,
        })
      );

      const startTime = Date.now();
      await kgService.createEmbeddingsBatch(batchEntities);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify all entities were created
      for (const entity of batchEntities) {
        const retrieved = await kgService.getEntity(entity.id);
        expect(retrieved).toEqual(expect.any(Object));
      }
    });

    it("should handle concurrent operations", async () => {
      const concurrentOperations = 5;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const entity: CodebaseEntity = {
          id: `concurrent-entity-${i}`,
          path: `src/concurrent/file${i}.ts`,
          hash: `conc${i}23`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        };

        promises.push(kgService.createEntity(entity));
      }

      await Promise.all(promises);

      // Verify all entities were created
      for (let i = 0; i < concurrentOperations; i++) {
        const retrieved = await kgService.getEntity(`concurrent-entity-${i}`);
        expect(retrieved).toEqual(expect.any(Object));
      }
    });
  });

  describe("Entity Dependencies and Analysis", () => {
    let dependencyEntities: CodebaseEntity[];

    beforeEach(async () => {
      dependencyEntities = [
        {
          id: "dep-main",
          path: "src/main.ts",
          hash: "main456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "dep-helper",
          path: "src/helpers.ts",
          hash: "help456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "dep-util",
          path: "src/utils.ts",
          hash: "util456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
      ];

      for (const entity of dependencyEntities) {
        await kgService.createEntity(entity);
      }

      // Create dependency relationships
      const depRelationships: GraphRelationship[] = [
        {
          id: "dep-rel-1",
          fromEntityId: dependencyEntities[0].id,
          toEntityId: dependencyEntities[1].id,
          type: RelationshipType.DEPENDS_ON,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
        {
          id: "dep-rel-2",
          fromEntityId: dependencyEntities[1].id,
          toEntityId: dependencyEntities[2].id,
          type: RelationshipType.TYPE_USES,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        },
      ];

      for (const rel of depRelationships) {
        await kgService.createRelationship(rel);
      }
    });

    it("should analyze entity dependencies", async () => {
      const analysis = await kgService.getEntityDependencies(
        dependencyEntities[0].id
      );

      expect(analysis).toEqual(expect.any(Object));
      expect(analysis.entityId).toBe(dependencyEntities[0].id);
      expect(analysis.directDependencies.length).toBeGreaterThan(0);
      expect(analysis.reverseDependencies.length).toBe(0); // No reverse deps in this setup
    });

    it("should generate entity examples", async () => {
      const examples = await kgService.getEntityExamples(
        dependencyEntities[0].id
      );

      expect(examples).toEqual(expect.any(Object));
      expect(examples.entityId).toBe(dependencyEntities[0].id);
      expect(typeof examples.signature).toBe("string");
      // Usage examples depend on relationships, may be empty in simple test
      expect(examples.usageExamples).toEqual(expect.any(Array));
    });
  });

  describe("List and Query Operations", () => {
    beforeEach(async () => {
      const listEntities: CodebaseEntity[] = [
        {
          id: "list-file-1",
          path: "src/components/Button.ts",
          hash: "list123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "list-file-2",
          path: "src/utils/helpers.ts",
          hash: "list456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
        {
          id: "list-file-3",
          path: "tests/unit/Button.test.ts",
          hash: "list789",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
        },
      ];

      for (const entity of listEntities) {
        await kgService.createEntity(entity);
      }
    });

    it("should list entities by type", async () => {
      const result = await kgService.listEntities({ type: "file" });

      expect(result.entities.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(3);
      result.entities.forEach((entity) => {
        expect(entity.type).toBe("file");
      });
    });

    it("should list entities by language", async () => {
      const result = await kgService.listEntities({ language: "typescript" });

      expect(result.entities.length).toBeGreaterThanOrEqual(3);
      result.entities.forEach((entity) => {
        expect(entity.language).toBe("typescript");
      });
    });

    it("should support pagination", async () => {
      const result = await kgService.listEntities({ limit: 2, offset: 1 });

      expect(result.entities.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it("should list relationships with pagination", async () => {
      const result = await kgService.listRelationships({ limit: 5 });

      expect(result.relationships.length).toBeLessThanOrEqual(5);
      expect(typeof result.total).toBe("number");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle non-existent entity retrieval gracefully", async () => {
      const result = await kgService.getEntity("non-existent-entity-123");
      expect(result).toBeNull();
    });

    it("should handle invalid relationship creation", async () => {
      const invalidRelationship: GraphRelationship = {
        id: "invalid-rel",
        fromEntityId: "non-existent-from",
        toEntityId: "non-existent-to",
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      };

      // Should not throw, but relationship may not be created if entities don't exist
      await expect(
        kgService.createRelationship(invalidRelationship)
      ).rejects.toThrow();
    });

    it("should handle search with invalid parameters", async () => {
      const invalidSearch: GraphSearchRequest = {
        query: "",
        searchType: "structural",
        entityTypes: ["invalid-type" as any],
      };

      const results = await kgService.search(invalidSearch);
      expect(results).toEqual(expect.any(Array));
      expect(results.length).toBe(0);
    });

    it("should handle empty search queries", async () => {
      const emptySearch: GraphSearchRequest = {
        query: "",
        searchType: "structural",
      };

      const results = await kgService.search(emptySearch);
      expect(results).toEqual(expect.any(Array));
    });

    it("should handle concurrent entity updates", async () => {
      const entity: CodebaseEntity = {
        id: "concurrent-update-test",
        path: "src/concurrent.ts",
        hash: "concur123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 100,
      };

      await kgService.createEntity(entity);

      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        kgService.createOrUpdateEntity({
          ...entity,
          size: entity.size! + i * 10,
        })
      );

      await Promise.allSettled(updatePromises);

      // Entity should exist and have been updated
      const updated = await kgService.getEntity(entity.id);
      expect(updated).toEqual(expect.any(Object));
    });
  });
});
