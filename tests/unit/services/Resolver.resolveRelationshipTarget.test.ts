/**
 * Unit tests for resolveRelationshipTarget helper on SynchronizationCoordinator
 */

import { describe, it, expect } from "vitest";
import { SynchronizationCoordinator } from "@memento/sync/synchronization/SynchronizationCoordinator";

class KGMock {
  async getEntity(id: string) {
    return null;
  }
  async findSymbolInFile(file: string, name: string) {
    if (file.endsWith("sample.ts") && name === "Foo") {
      return { id: "sym:file:sample.ts#Foo@deadbeef" } as any;
    }
    return null;
  }
  async findNearbySymbols() {
    return [];
  }
  async findSymbolsByName() {
    return [];
  }
  async findSymbolByKindAndName() {
    return [];
  }
}

class ASTMock {}
class DBMock {}

describe("resolveRelationshipTarget (toRef fileSymbol)", () => {
  it("resolves a fileSymbol to an entity id without redeclaration issues", async () => {
    const kg = new KGMock() as any;
    const coord = new SynchronizationCoordinator(
      kg,
      new ASTMock() as any,
      new DBMock() as any,
      {
        detectConflicts: async () => [],
        resolveConflictsAuto: async () => [],
      } as any
    );
    const rel: any = {
      fromEntityId: "sym:caller",
      toEntityId: "file:src/sample.ts:Foo", // placeholder string
      type: "CALLS",
      // structured toRef should take precedence
      toRef: { kind: "fileSymbol", file: "src/sample.ts", name: "Foo" },
    };
    const resolved = await (coord as any).resolveRelationshipTarget(rel);
    expect(resolved.id).toBe("sym:file:sample.ts#Foo@deadbeef");
    expect(resolved.resolutionPath).toBe("fileSymbol");
  });
});
