import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import fs from "fs/promises";
import { ASTParser } from "@/services/ASTParser";
import { RelationshipType } from "@/models/relationships";
import { noiseConfig } from "@/config/noise";

describe("ASTParser code edge aggregation", () => {
  let parser: ASTParser;
  const dir = path.join(__dirname, "ast-parser", "aggregation");
  const helperFile = path.join(dir, "helper.ts");
  const callerFile = path.join(dir, "caller.ts");
  const readsFile = path.join(dir, "reads.ts");
  const storeFile = path.join(dir, "store.ts");
  const writerFile = path.join(dir, "writer.ts");
  const classFile = path.join(dir, "class.ts");
  const instantiatorFile = path.join(dir, "instantiator.ts");
  const gatingConsumerFile = path.join(dir, "gating-consumer.ts");

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    await fs.mkdir(dir, { recursive: true });
  });

  beforeEach(() => {
    parser.clearCache();
  });

  afterAll(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {}
  });

  it("aggregates repeated CALLS edges and emits dependency edges for imported targets", async () => {
    await fs.writeFile(
      helperFile,
      `export function helper() { return 1; }\n`,
      "utf-8"
    );
    await fs.writeFile(
      callerFile,
      `import { helper } from './helper';\nexport function use() {\n  helper();\n  helper();\n}\n`,
      "utf-8"
    );

    await parser.parseFile(helperFile);
    const result = await parser.parseFile(callerFile);

    const callEdges = result.relationships.filter(
      (rel) =>
        rel.type === RelationshipType.CALLS &&
        String(rel.toEntityId).includes("helper")
    );
    expect(callEdges).toHaveLength(1);

    const callEdge = callEdges[0] as any;
    expect(callEdge.metadata?.occurrencesScan).toBe(2);
    expect(callEdge.metadata?.scope).toBe("imported");

    const dependencyEdge = result.relationships.find(
      (rel) =>
        rel.type === RelationshipType.DEPENDS_ON &&
        rel.fromEntityId === callEdge.fromEntityId &&
        rel.toEntityId === callEdge.toEntityId
    ) as any;
    expect(dependencyEdge).toBeDefined();
    expect(dependencyEdge.metadata?.kind).toBe("dependency");
  });

  it("aggregates repeated identifier reads into a single edge with occurrences metadata", async () => {
    await fs.writeFile(
      readsFile,
      `export function aggregate(value: number) {\n  const doubled = value + value;\n  return doubled;\n}\n`,
      "utf-8"
    );

    const result = await parser.parseFile(readsFile);

    const aggregated = result.relationships.filter(
      (rel) =>
        (rel.type === RelationshipType.READS ||
          rel.type === RelationshipType.REFERENCES) &&
        (rel as any).metadata?.occurrencesScan === 2
    );

    expect(aggregated.length).toBeGreaterThan(0);
    expect((aggregated[0] as any).metadata?.occurrencesScan).toBe(2);
  });

  it("aggregates repeated writes to imported members and emits dependency edges", async () => {
    await fs.writeFile(
      storeFile,
      `export const store = { value: 0 };\n`,
      "utf-8"
    );
    await fs.writeFile(
      writerFile,
      `import { store } from './store';\nexport function setTwice() {\n  store.value = 1;\n  store.value = 2;\n}\n`,
      "utf-8"
    );

    await parser.parseFile(storeFile);
    const result = await parser.parseFile(writerFile);

    const writeEdges = result.relationships.filter(
      (rel) =>
        rel.type === RelationshipType.WRITES &&
        String(rel.toEntityId).includes("store.ts")
    );
    expect(writeEdges).toHaveLength(1);

    const writeEdge = writeEdges[0] as any;
    expect(writeEdge.metadata?.occurrencesScan).toBe(2);
    expect(writeEdge.metadata?.scope).toBe("imported");
    const writeFlowId =
      (writeEdge as any).dataFlowId ?? writeEdge.metadata?.dataFlowId;
    expect(typeof writeFlowId).toBe("string");
    expect(writeFlowId).toMatch(/^df_[0-9a-f]{12}$/);

    const dependency = result.relationships.find(
      (rel) =>
        rel.type === RelationshipType.DEPENDS_ON &&
        rel.fromEntityId === writeEdge.fromEntityId &&
        rel.toEntityId === writeEdge.toEntityId
    );
    expect(dependency).toBeDefined();
  });

  it("aggregates repeated constructor references and emits dependency edges", async () => {
    await fs.writeFile(
      classFile,
      `export class Foo {\n  value = 1;\n}\n`,
      "utf-8"
    );

    await parser.parseFile(classFile);

    await fs.writeFile(
      instantiatorFile,
      `import { Foo } from './class';\nexport function build() {\n  const first = new Foo();\n  const second = new Foo();\n  return second;\n}\n`,
      "utf-8"
    );

    const result = await parser.parseFile(instantiatorFile);

    const referenceEdges = result.relationships.filter(
      (rel) =>
        rel.type === RelationshipType.REFERENCES &&
        String(rel.toEntityId).includes("class.ts") &&
        (rel.metadata as any)?.scope === "imported"
    );

    expect(referenceEdges.length).toBeGreaterThan(0);
    expect(new Set(referenceEdges.map((rel) => rel.toEntityId)).size).toBe(1);
    referenceEdges.forEach((rel) => {
      const ref = rel as any;
      expect(ref.metadata?.occurrencesScan).toBe(2);
      expect(ref.to_ref_file).toContain(
        "tests/unit/services/ast-parser/aggregation/class.ts"
      );
      expect(ref.to_ref_kind).toBe("fileSymbol");
    });

    const dependencyEdges = result.relationships.filter(
      (rel) =>
        rel.type === RelationshipType.DEPENDS_ON &&
        rel.toEntityId === referenceEdges[0].toEntityId
    );

    expect(dependencyEdges.length).toBeGreaterThan(0);
    dependencyEdges.forEach((dep) => {
      expect((dep.metadata as any)?.kind).toBe("dependency");
    });
  });

  it("drops placeholder references that fall below the inferred confidence threshold", async () => {
    const originalThreshold = noiseConfig.MIN_INFERRED_CONFIDENCE;

    await fs.writeFile(
      gatingConsumerFile,
      `export function consume() {\n  return UnknownGlobal + UnknownGlobal;\n}\n`,
      "utf-8"
    );

    const lowThresholdParser = new ASTParser();
    await lowThresholdParser.initialize();

    try {
      noiseConfig.MIN_INFERRED_CONFIDENCE = 0.1;
      const baseline = await lowThresholdParser.parseFile(gatingConsumerFile);
      const baselineEdges = baseline.relationships.filter(
        (rel) =>
          rel.type === RelationshipType.REFERENCES &&
          String(rel.toEntityId).toLowerCase().includes("unknownglobal")
      );

      expect(baselineEdges.length).toBeGreaterThan(0);
      expect(
        baselineEdges.every((rel) =>
          String(rel.toEntityId).startsWith("external:")
        )
      ).toBe(true);

      noiseConfig.MIN_INFERRED_CONFIDENCE = 0.95;

      const highThresholdParser = new ASTParser();
      await highThresholdParser.initialize();
      const gated = await highThresholdParser.parseFile(gatingConsumerFile);
      const gatedEdges = gated.relationships.filter(
        (rel) =>
          rel.type === RelationshipType.REFERENCES &&
          String(rel.toEntityId).toLowerCase().includes("unknownglobal")
      );

      expect(gatedEdges).toHaveLength(0);
    } finally {
      noiseConfig.MIN_INFERRED_CONFIDENCE = originalThreshold;
    }
  });
});
