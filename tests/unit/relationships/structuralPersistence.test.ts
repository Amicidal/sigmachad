import { describe, expect, it } from "vitest";

import { RelationshipType } from "@memento/shared-types";
import {
  computeStructuralBackfillUpdate,
  extractStructuralPersistenceFields,
  type StructuralRelationshipSnapshot,
} from "@memento/graph/services/structuralPersistence";
import { normalizeStructuralRelationship } from "@memento/graph/services/RelationshipNormalizer";

const timestamp = new Date("2024-02-01T00:00:00Z");

describe("extractStructuralPersistenceFields", () => {
  it("prefers normalized top-level values and cleans module paths", () => {
    const topLevel = {
      importAlias: "Utils",
      importType: "namespace",
      isNamespace: true,
      isReExport: false,
      language: "typescript",
      symbolKind: "module",
      modulePath: "src/utils/index.ts/",
      resolutionState: "resolved",
      importDepth: 2,
    };

    const metadata = {
      importAlias: "ignored",
      modulePath: "ignored/path.ts",
    };

    const fields = extractStructuralPersistenceFields(topLevel, metadata);

    expect(fields).toEqual({
      importAlias: "Utils",
      importType: "namespace",
      isNamespace: true,
      isReExport: false,
      reExportTarget: null,
      language: "typescript",
      symbolKind: "module",
      modulePath: "src/utils/index.ts",
      resolutionState: "resolved",
      importDepth: 2,
      confidence: null,
      scope: null,
      firstSeenAt: null,
      lastSeenAt: null,
    });
  });

  it("falls back to metadata and normalizes casing", () => {
    const metadata = {
      alias: "Store",
      importKind: "DEFAULT",
      isNamespace: false,
      language: "Python",
      symbolKind: "CLASS",
      module: "models\\store.py",
      resolutionState: "PARTIAL",
      importDepth: 1,
      confidence: 0.65,
      scope: "IMPORTED",
      firstSeenAt: "2024-01-01T12:00:00Z",
      lastSeenAt: "2024-02-01T12:00:00Z",
    };

    const normalized = normalizeStructuralRelationship({
      id: "rel_meta",
      fromEntityId: "file:src/tools.py",
      toEntityId: "import:models/store",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata,
    } as any);

    const fields = extractStructuralPersistenceFields(
      normalized as any,
      (normalized.metadata ?? {}) as Record<string, any>
    );

    expect(fields).toEqual({
      importAlias: "Store",
      importType: "default",
      isNamespace: false,
      isReExport: null,
      reExportTarget: null,
      language: "python",
      symbolKind: "class",
      modulePath: "models/store.py",
      resolutionState: "partial",
      importDepth: 1,
      confidence: 0.65,
      scope: "imported",
      firstSeenAt: "2024-01-01T12:00:00.000Z",
      lastSeenAt: "2024-02-01T12:00:00.000Z",
    });
  });

  it("normalizes re-export targets to forward slashes", () => {
    const topLevel = {
      reExportTarget: "..\\widgets\\index.ts/",
    };

    const fields = extractStructuralPersistenceFields(topLevel, {});

    expect(fields.reExportTarget).toBe("../widgets/index.ts");
    expect(fields.confidence).toBeNull();
    expect(fields.scope).toBeNull();
  });
});

describe("computeStructuralBackfillUpdate", () => {
  const baseSnapshot: StructuralRelationshipSnapshot = {
    id: "rel_struct",
    type: RelationshipType.IMPORTS,
    fromId: "file:src/app.ts",
    toId: "import:../lib/utils:Utils",
    created: new Date("2024-01-01T00:00:00Z").toISOString(),
    lastModified: new Date("2024-01-02T00:00:00Z").toISOString(),
    version: 1,
  };

  it("produces an update when metadata needs promotion", () => {
    const snapshot: StructuralRelationshipSnapshot = {
      ...baseSnapshot,
      metadata: {
        importKind: "Named",
        alias: "Utils",
        language: "TypeScript",
        module: "../lib\\utils/index.ts",
      },
    };

    const result = computeStructuralBackfillUpdate(snapshot);
    expect(result).not.toBeNull();

    expect(result?.payload).toMatchObject({
      importAlias: "Utils",
      importType: "named",
      language: "typescript",
      modulePath: "../lib/utils/index.ts",
    });
    expect(result?.changedFields).toEqual(
      expect.arrayContaining([
        "importAlias",
        "importType",
        "language",
        "modulePath",
        "metadata",
      ])
    );
  });

  it("returns null when no changes are required", () => {
    const normalized = normalizeStructuralRelationship({
      id: baseSnapshot.id,
      fromEntityId: baseSnapshot.fromId,
      toEntityId: baseSnapshot.toId,
      type: RelationshipType.IMPORTS,
      created: new Date(baseSnapshot.created ?? timestamp),
      lastModified: new Date(baseSnapshot.lastModified ?? timestamp),
      version: 1,
      metadata: {
        importAlias: "useThing",
        importType: "named",
        language: "typescript",
        modulePath: "./things.ts",
        resolutionState: "resolved",
        confidence: 0.7,
        scope: "local",
        firstSeenAt: "2024-01-05T00:00:00.000Z",
        lastSeenAt: "2024-01-06T00:00:00.000Z",
      },
      scope: "local",
      firstSeenAt: new Date("2024-01-05T00:00:00.000Z"),
      lastSeenAt: new Date("2024-01-06T00:00:00.000Z"),
    } as any);

    const snapshot: StructuralRelationshipSnapshot = {
      ...baseSnapshot,
      importAlias: (normalized as any).importAlias,
      importType: (normalized as any).importType,
      isNamespace: (normalized as any).isNamespace,
      language: (normalized as any).language,
      symbolKind: (normalized as any).symbolKind,
      modulePath: (normalized as any).modulePath,
      resolutionState: (normalized as any).resolutionState,
      confidence: (normalized as any).confidence,
      scope: (normalized as any).scope,
      firstSeenAt: "2024-01-05T00:00:00.000Z",
      lastSeenAt: "2024-01-06T00:00:00.000Z",
      metadata: normalized.metadata,
    };

    const result = computeStructuralBackfillUpdate(snapshot);
    expect(result).toBeNull();
  });

  it("parses stringified metadata and normalizes re-export targets", () => {
    const snapshot: StructuralRelationshipSnapshot = {
      ...baseSnapshot,
      type: RelationshipType.EXPORTS,
      metadata: JSON.stringify({
        alias: "Widget",
        importKind: "Named",
        reExportTarget: "..\\widgets\\index.ts",
        language: "TypeScript",
        reExport: true,
        confidence: "0.85",
        scope: "EXTERNAL",
        firstSeenAt: "2024-03-01T00:00:00Z",
        lastSeenAt: "2024-03-02T00:00:00Z",
      }),
    };

    const result = computeStructuralBackfillUpdate(snapshot);
    expect(result).not.toBeNull();
    expect(result?.payload.reExportTarget).toBe("../widgets/index.ts");
    expect(result?.payload.importAlias).toBe("Widget");
    expect(result?.payload.importType).toBe("named");
    expect(result?.payload.language).toBe("typescript");
    expect(result?.payload.confidence).toBeCloseTo(0.85, 5);
    expect(result?.payload.scope).toBe("external");
    expect(result?.payload.firstSeenAt).toBe("2024-03-01T00:00:00.000Z");
    expect(result?.payload.lastSeenAt).toBe("2024-03-02T00:00:00.000Z");
    expect(result?.changedFields).toEqual(
      expect.arrayContaining([
        "reExportTarget",
        "importAlias",
        "importType",
        "language",
        "confidence",
        "scope",
        "firstSeenAt",
        "lastSeenAt",
        "metadata",
      ])
    );
  });
});
