/**
 * Integration tests for ConflictResolution service
 * Validates diff-based detection, deterministic identifiers, persistence and manual override flow
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  ConflictResolution,
  Conflict,
} from "../../../src/services/scm/ConflictResolution";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService";
import { DatabaseService } from "../../../src/services/core/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers";
import { Entity } from "../../../src/models/entities";
import { GraphRelationship, RelationshipType } from "../../../src/models/relationships";

describe("ConflictResolution Integration", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let conflictResolution: ConflictResolution;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
    conflictResolution = new ConflictResolution(kgService);

    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error("Database health check failed - cannot run integration tests");
    }
  }, 30000);

  afterAll(async () => {
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
      (conflictResolution as any).conflicts.clear();
    }
  });

  describe("Entity conflict detection", () => {
    it("detects conflicts only when canonical fields diverge", async () => {
      const baseEntity: Entity = {
        id: "entity-a",
        type: "file",
        path: "a.ts",
        hash: "hash-1",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      await kgService.createEntity(baseEntity);

      const identicalIncoming: Entity = { ...baseEntity };
      const noDiffConflicts = await conflictResolution.detectConflicts(
        [identicalIncoming],
        []
      );
      expect(noDiffConflicts).toHaveLength(0);

      const divergingIncoming: Entity = {
        ...baseEntity,
        hash: "hash-2",
        metadata: { purpose: "updated" },
        lastModified: new Date("2024-01-05T00:00:00Z"),
      };

      const conflicts = await conflictResolution.detectConflicts(
        [divergingIncoming],
        []
      );

      expect(conflicts).toHaveLength(1);
      const conflict = conflicts[0];
      expect(conflict.type).toBe("entity_version");
      expect(conflict.entityId).toBe("entity-a");
      expect(conflict.id.startsWith("conflict_entity_version_"));
      expect(conflict.diff).toMatchObject({
        hash: { current: "hash-1", incoming: "hash-2" },
      });
    });
  });

  describe("Relationship conflict detection", () => {
    it("surfaces diffs when an existing relationship diverges", async () => {
      const source: Entity = {
        id: "source-node",
        type: "function",
        path: "src.ts",
        hash: "s1",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      const target: Entity = {
        id: "target-node",
        type: "class",
        path: "t.ts",
        hash: "t1",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      await kgService.createEntity(source);
      await kgService.createEntity(target);

      const baselineRelationship: GraphRelationship = {
        id: "rel_1",
        type: RelationshipType.DEPENDS_ON,
        fromEntityId: source.id,
        toEntityId: target.id,
        metadata: { strength: 0.4 },
        created: new Date("2024-01-01T00:00:00Z"),
        lastModified: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      } as any;

      await kgService.createRelationship(baselineRelationship);

      const incomingRelationship: GraphRelationship = {
        ...baselineRelationship,
        metadata: { strength: 0.9 },
        lastModified: new Date("2024-01-02T00:00:00Z"),
      } as any;

      const conflicts = await conflictResolution.detectConflicts(
        [],
        [incomingRelationship]
      );

      expect(conflicts).toHaveLength(1);
      const conflict = conflicts[0];
      expect(conflict.type).toBe("relationship_conflict");
      const canonicalIncoming = kgService.canonicalizeRelationship(
        incomingRelationship as GraphRelationship
      );
      expect(conflict.relationshipId).toBe(canonicalIncoming.id);
      expect(conflict.diff).toMatchObject({
        "metadata.strength": { current: 0.4, incoming: 0.9 },
      });
    });
  });

  describe("Resolution flows", () => {
    it("persists overwrite strategy results via auto resolution", async () => {
      const existing: Entity = {
        id: "overwrite-entity",
        type: "file",
        path: "ow.ts",
        hash: "hash-old",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      await kgService.createEntity(existing);

      const incoming: Entity = {
        ...existing,
        hash: "hash-new",
        lastModified: new Date("2024-01-03T00:00:00Z"),
      };

      const conflicts = await conflictResolution.detectConflicts([incoming], []);
      expect(conflicts).toHaveLength(1);

      const resolutions = await conflictResolution.resolveConflictsAuto(conflicts);
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].strategy).toBe("overwrite");

      const updated = await kgService.getEntity(existing.id);
      expect(updated?.hash).toBe("hash-new");
    });

    it("stores manual overrides and prevents repeated detection", async () => {
      const baseEntity: Entity = {
        id: "manual-entity",
        type: "file",
        path: "manual.ts",
        hash: "hash-base",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      await kgService.createEntity(baseEntity);

      const incoming: Entity = {
        ...baseEntity,
        hash: "hash-diff",
        lastModified: new Date("2024-01-04T00:00:00Z"),
      };

      const firstConflicts = await conflictResolution.detectConflicts(
        [incoming],
        []
      );

      expect(firstConflicts).toHaveLength(1);
      const conflict = firstConflicts[0];

      const manualResolution = {
        strategy: "manual" as const,
        manualResolution: "Keep canonical hash",
        timestamp: new Date(),
        resolvedBy: "human-analyst",
      };

      const resolved = await conflictResolution.resolveConflict(
        conflict.id,
        manualResolution
      );
      expect(resolved).toBe(true);

      const repeatedConflicts = await conflictResolution.detectConflicts(
        [incoming],
        []
      );
      expect(repeatedConflicts).toHaveLength(0);
    });
  });
});
