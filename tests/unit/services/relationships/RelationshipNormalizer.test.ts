import { describe, it, expect } from "vitest";
import { normalizeStructuralRelationship } from "../../../../src/services/relationships/RelationshipNormalizer";
import { RelationshipType } from "../../../../src/models/relationships.js";

const timestamp = new Date("2024-07-04T10:00:00Z");

describe("RelationshipNormalizer.normalizeStructuralRelationship", () => {
  it("normalizes TypeScript import edges with canonical ids and metadata", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/app.ts:module",
      toEntityId: "import:../lib/utils/index.js:*",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        importKind: "Namespace",
        alias: "Utils",
        module: "../lib/utils/index.js",
      },
    } as any);

    expect(relationship.importAlias).toBe("Utils");
    expect(relationship.importType).toBe("namespace");
    expect(relationship.isNamespace).toBe(true);
    expect(relationship.language).toBe("typescript");
    expect(relationship.symbolKind).toBe("module");
    expect(relationship.id).toMatch(/^time-rel_[0-9a-f]{40}$/);
    expect(relationship.resolutionState).toBe("unresolved");
    expect(relationship.resolved).toBe(false);
    expect(relationship.confidence).toBeCloseTo(0.4, 5);
    expect(relationship.metadata?.modulePath).toBe("../lib/utils/index.js");
  });

  it("marks resolved imports when the target entity is known", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_resolved",
      fromEntityId: "file:src/app.ts:module",
      toEntityId: "file:src/lib/utils.ts:default",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        importKind: "default",
        alias: "Utils",
        module: "./lib/utils.ts",
      },
      toRef: {
        kind: "fileSymbol",
        file: "src/lib/utils.ts",
        symbol: "default",
      },
    } as any);

    expect(relationship.resolutionState).toBe("resolved");
    expect(relationship.resolved).toBe(true);
    expect(relationship.confidence).toBeCloseTo(0.9, 5);
  });

  it("derives resolution defaults when metadata declares resolution state", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:lodash:default",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        resolutionState: "resolved",
        module: "lodash",
      },
    } as any);

    expect(relationship.resolutionState).toBe("resolved");
    expect(relationship.resolved).toBe(true);
    expect(relationship.confidence).toBeCloseTo(0.9, 5);
  });

  it("normalizes redundant path separators in module paths", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:../pkg/sub:file",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "../pkg//sub///file.ts",
      },
    } as any);

    expect(relationship.modulePath).toBe("../pkg/sub/file.ts");
    expect(relationship.metadata?.modulePath).toBe("../pkg/sub/file.ts");
  });

  it("collapses repeated separators to a single root slash", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/root.ts:module",
      toEntityId: "import:root",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "////",
      },
    } as any);

    expect(relationship.modulePath).toBe("/");
    expect(relationship.metadata?.modulePath).toBe("/");
  });

  it("infers language from file extensions for python modules", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/models/user.py:module",
      toEntityId: "import:django:models",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        importKind: "named",
        alias: "models",
      },
    } as any);

    expect(relationship.language).toBe("python");
    expect(relationship.metadata?.language).toBe("python");
  });

  it("detects go language from path hints", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:pkg/service/main.go:module",
      toEntityId: "import:context",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "context",
      },
    } as any);

    expect(relationship.language).toBe("go");
    expect(relationship.metadata?.language).toBe("go");
  });

  it("does not force a typescript fallback when language is unknown", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/Main.java:module",
      toEntityId: "import:com.example.service:Foo",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "com/example/service/Foo",
      },
    } as any);

    expect(relationship.language).toBeUndefined();
    expect(relationship.metadata?.language).toBeUndefined();
    expect(relationship.resolutionState).toBe("unresolved");
    expect(relationship.resolved).toBe(false);
  });

  it("propagates resolved metadata and preserves producer confidence", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:lodash:default",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "lodash",
        resolved: true,
        confidence: 0.82,
      },
    } as any);

    expect(relationship.resolved).toBe(true);
    expect(relationship.resolutionState).toBe("resolved");
    expect(relationship.confidence).toBeCloseTo(0.82, 5);
    expect(relationship.metadata?.confidence).toBeCloseTo(0.82, 5);
  });

  it("promotes metadata resolutionState without overriding flags", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:pkg:member",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "pkg",
        resolutionState: "partial",
      },
    } as any);

    expect(relationship.resolutionState).toBe("partial");
    expect(relationship.metadata?.resolutionState).toBe("partial");
    expect(relationship.resolved).toBeUndefined();
  });

  it("reconciles conflicting resolved flags and resolutionState", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_conflict",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:pkg:member",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      resolved: true,
      metadata: {
        module: "pkg",
        resolutionState: "unresolved",
        resolved: true,
      },
    } as any);

    expect(relationship.resolutionState).toBe("unresolved");
    expect(relationship.resolved).toBe(false);
    expect(relationship.metadata?.resolved).toBe(false);
  });

  it("removes legacy structural metadata keys after normalization", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_legacy",
      fromEntityId: "file:src/app.ts:module",
      toEntityId: "import:../lib/utils/index.js:*",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        alias: "Utils",
        importKind: "Namespace",
        module: "../lib/utils/index.js",
        moduleSpecifier: "../lib/utils/index.js",
        sourceModule: "../lib/utils/index.js",
        lang: "TS",
        languageId: "ts",
        language_id: "ts",
        reExport: false,
      },
    } as any);

    expect(relationship.importAlias).toBe("Utils");
    expect(relationship.importType).toBe("namespace");
    expect(relationship.metadata?.importAlias).toBe("Utils");
    expect(relationship.metadata?.importType).toBe("namespace");
    expect(relationship.metadata?.modulePath).toBe("../lib/utils/index.js");
    const metadata = relationship.metadata ?? {};
    expect("alias" in metadata).toBe(false);
    expect("module" in metadata).toBe(false);
    expect("moduleSpecifier" in metadata).toBe(false);
    expect("sourceModule" in metadata).toBe(false);
    expect("importKind" in metadata).toBe(false);
    expect("lang" in metadata).toBe(false);
    expect("languageId" in metadata).toBe(false);
    expect("language_id" in metadata).toBe(false);
    expect("reExport" in metadata).toBe(false);
  });

  it("keeps sanitized confidence when only metadata provides it", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_input",
      fromEntityId: "file:src/foo.ts:module",
      toEntityId: "import:pkg:member",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        module: "pkg",
        confidence: 1.4,
      },
    } as any);

    expect(relationship.confidence).toBe(1);
    expect(relationship.metadata?.confidence).toBe(1);
  });

  it("infers re-export flags when a target is provided", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_export",
      fromEntityId: "file:src/index.ts:module",
      toEntityId: "export:lib/helpers",
      type: RelationshipType.EXPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        reExportTarget: "./helpers.ts",
      },
    } as any);

    expect(relationship.isReExport).toBe(true);
    expect(relationship.reExportTarget).toBe("./helpers.ts");
    expect(relationship.metadata?.isReExport).toBe(true);
    expect(relationship.metadata?.reExportTarget).toBe("./helpers.ts");
  });

  it("preserves languageSpecific syntax hints for TSX modules", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_tsx",
      fromEntityId: "file:src/App.tsx:module",
      toEntityId: "import:./Button",
      type: RelationshipType.IMPORTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      modulePath: "./Button.tsx",
      metadata: {
        module: "./Button.tsx",
      },
    } as any);

    expect(relationship.language).toBe("typescript");
    expect(relationship.metadata?.languageSpecific?.syntax).toBe("tsx");
  });

  it("defaults CONTAINS relationships to resolved with high confidence", () => {
    const relationship = normalizeStructuralRelationship({
      id: "rel_contains",
      fromEntityId: "dir:src",
      toEntityId: "file:src/app.ts",
      type: RelationshipType.CONTAINS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
    } as any);

    expect(relationship.resolutionState).toBe("resolved");
    expect(relationship.resolved).toBe(true);
    expect(relationship.confidence).toBeCloseTo(0.95, 5);
  });
});
