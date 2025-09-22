import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { ASTParser } from "../../../src/services/knowledge/ASTParser";
import { RelationshipType } from "@/models/relationships";
import { noiseConfig } from "@/config/noise";

describe("ASTParser confidence respects config overrides", () => {
  let parser: ASTParser;
  const dir = path.join(__dirname, "ast-parser", "conf-override");
  const defs = path.join(dir, "defs.ts");
  const importer = path.join(dir, "importer.ts");

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(defs, `export interface Conf { z: number }\n`, "utf-8");
    await fs.writeFile(
      importer,
      `import { Conf } from './defs';\nexport function k(a: Conf) { return a.z; }\n`,
      "utf-8"
    );
  });

  it("uses noiseConfig.AST_CONF_FILE for file: refs", async () => {
    const original = noiseConfig.AST_CONF_FILE;
    noiseConfig.AST_CONF_FILE = 0.75; // override for test
    try {
      const res = await parser.parseFile(importer);
      const deps = res.relationships.filter(
        (r) => r.type === RelationshipType.DEPENDS_ON
      );
      const fileDep = deps.find(
        (r) =>
          String(r.toEntityId).startsWith("file:") &&
          (r as any).metadata?.confidence === 0.75
      ) as any;
      expect(fileDep).toBeTruthy();
      expect(fileDep.metadata?.confidence).toBe(0.75);
    } finally {
      noiseConfig.AST_CONF_FILE = original;
    }
  });
});
