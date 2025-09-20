/**
 * Unit tests for ConflictResolution service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ConflictResolution,
  Conflict,
  ConflictResolutionResult,
} from "../../../src/services/ConflictResolution";
import { Entity } from "../../../src/models/entities";
import { GraphRelationship, RelationshipType } from "../../../src/models/relationships";
import { canonicalRelationshipId } from "../../../src/utils/codeEdges";

class MockKnowledgeGraphService {
  entities = new Map<string, Entity>();
  relationships = new Map<string, GraphRelationship>();
  private readonly namespacePrefix = "ns:";

  private applyPrefix(id: string): string {
    if (!id) return id;
    return id.startsWith(this.namespacePrefix)
      ? id
      : `${this.namespacePrefix}${id}`;
  }

  async getEntity(entityId: string): Promise<Entity | null> {
    return this.entities.get(entityId) ?? null;
  }

  async updateEntity(entityId: string, updates: Partial<Entity>): Promise<void> {
    const existing = this.entities.get(entityId) ?? ({} as Entity);
    this.entities.set(entityId, { ...existing, ...updates });
  }

  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    const prefixed = this.applyPrefix(relationshipId);
    return (
      this.relationships.get(prefixed) ??
      this.relationships.get(relationshipId) ??
      null
    );
  }

  async upsertRelationship(relationship: GraphRelationship): Promise<void> {
    const canonical = this.canonicalizeRelationship(relationship);
    this.relationships.set(canonical.id, { ...canonical });
  }

  setEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  setRelationship(relationship: GraphRelationship): void {
    const canonical = this.canonicalizeRelationship(relationship);
    this.relationships.set(canonical.id, canonical);
  }

  canonicalizeRelationship(relationship: GraphRelationship): GraphRelationship {
    const normalized = { ...(relationship as any) } as GraphRelationship;

    if (normalized.fromEntityId) {
      normalized.fromEntityId = this.applyPrefix(normalized.fromEntityId);
    }
    if (normalized.toEntityId) {
      normalized.toEntityId = this.applyPrefix(normalized.toEntityId);
    }

    if (normalized.fromEntityId && normalized.toEntityId && normalized.type) {
      const baseId = canonicalRelationshipId(
        normalized.fromEntityId,
        normalized
      );
      normalized.id = this.applyPrefix(baseId);
    }

    return normalized;
  }
}

describe("ConflictResolution", () => {
  let kgService: MockKnowledgeGraphService;
  let conflictResolution: ConflictResolution;

  beforeEach(() => {
    kgService = new MockKnowledgeGraphService();
    conflictResolution = new ConflictResolution(kgService as any);
  });

  describe("detectConflicts", () => {
    it("returns deterministic conflicts when entity values differ", async () => {
      const existing: Entity = {
        id: "entity-1",
        type: "file",
        path: "index.ts",
        hash: "hash-old",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      kgService.setEntity(existing);

      const incoming: Entity = {
        ...existing,
        hash: "hash-new",
        metadata: { purpose: "refactor" },
        lastModified: new Date("2024-01-05T00:00:00Z"),
      };

      const conflicts = await conflictResolution.detectConflicts(
        [incoming],
        []
      );

      expect(conflicts).toHaveLength(1);
      const conflict = conflicts[0];
      expect(conflict.id).toMatch(/^conflict_entity_version_[a-f0-9]{40}$/);
      expect(conflict.diff).toMatchObject({
        hash: { current: "hash-old", incoming: "hash-new" },
      });
    });

    it("suppresses repeated conflicts when manual override matches", async () => {
      const existing: Entity = {
        id: "entity-override",
        type: "file",
        path: "override.ts",
        hash: "hash-a",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      kgService.setEntity(existing);

      const incoming: Entity = {
        ...existing,
        hash: "hash-b",
        lastModified: new Date("2024-01-02T00:00:00Z"),
      };

      const conflicts = await conflictResolution.detectConflicts(
        [incoming],
        []
      );
      const conflict = conflicts[0];

      const manualResolution = {
        strategy: "manual" as const,
        manualResolution: "Keep canonical version",
        timestamp: new Date(),
        resolvedBy: "reviewer",
      };

      const resolved = await conflictResolution.resolveConflict(
        conflict.id,
        manualResolution
      );
      expect(resolved).toBe(true);

      const secondPass = await conflictResolution.detectConflicts(
        [incoming],
        []
      );
      expect(secondPass).toHaveLength(0);
    });

    it("compares relationship metadata before emitting conflicts", async () => {
      const relationship: GraphRelationship = {
        id: "rel-x",
        type: RelationshipType.DEPENDS_ON,
        fromEntityId: "a",
        toEntityId: "b",
        metadata: { strength: 0.5 },
        created: new Date("2024-01-01T00:00:00Z"),
        lastModified: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      } as any;

      kgService.setRelationship(relationship);

      const incoming: GraphRelationship = {
        ...relationship,
        metadata: { strength: 0.9 },
        lastModified: new Date("2024-01-03T00:00:00Z"),
      } as any;

      const conflicts = await conflictResolution.detectConflicts(
        [],
        [incoming]
      );

      expect(conflicts).toHaveLength(1);
      const conflict = conflicts[0];
      expect(conflict.type).toBe("relationship_conflict");
      const canonicalIncoming = kgService.canonicalizeRelationship(
        incoming as GraphRelationship
      );
      expect(conflict.relationshipId).toBe(canonicalIncoming.id);
      expect(conflict.diff).toHaveProperty("metadata.strength");
    });
  });

  describe("resolution flows", () => {
    it("runs overwrite auto resolution and updates entity via KnowledgeGraphService", async () => {
      const existing: Entity = {
        id: "entity-auto",
        type: "file",
        path: "auto.ts",
        hash: "old",
        language: "typescript",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        created: new Date("2024-01-01T00:00:00Z"),
        status: "active",
      };

      kgService.setEntity(existing);
      const updateSpy = vi.spyOn(kgService, "updateEntity");

      const incoming: Entity = {
        ...existing,
        hash: "new",
        lastModified: new Date("2024-01-03T00:00:00Z"),
      };

      const conflicts = await conflictResolution.detectConflicts(
        [incoming],
        []
      );

      const resolutions = await conflictResolution.resolveConflictsAuto(conflicts);
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].strategy).toBe("overwrite");
      expect(updateSpy).toHaveBeenCalledWith("entity-auto", expect.any(Object));
    });

    it("updates relationships when applying overwrite resolutions", async () => {
      const baseline: GraphRelationship = {
        id: "rel-merge",
        type: RelationshipType.IMPORTS,
        fromEntityId: "from",
        toEntityId: "to",
        metadata: { strength: 0.1 },
        created: new Date("2024-01-01T00:00:00Z"),
        lastModified: new Date("2024-01-01T00:00:00Z"),
        version: 1,
      } as any;

      const canonicalBaseline = kgService.canonicalizeRelationship(
        baseline as GraphRelationship
      );
      kgService.setRelationship(baseline);

      const incoming: GraphRelationship = {
        ...baseline,
        metadata: { strength: 0.7 },
      } as any;

      const conflicts = await conflictResolution.detectConflicts(
        [],
        [incoming]
      );

      const conflict = conflicts[0];
      const overwrite = {
        strategy: "overwrite" as const,
        resolvedValue: incoming,
        timestamp: new Date(),
        resolvedBy: "system",
      };

      const result = await conflictResolution.resolveConflict(
        conflict.id,
        overwrite
      );
      expect(result).toBe(true);

      const stored = await kgService.getRelationshipById(canonicalBaseline.id);
      expect(stored?.metadata).toMatchObject({ strength: 0.7 });
    });
  });
});
