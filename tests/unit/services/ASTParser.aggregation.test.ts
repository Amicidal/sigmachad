import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@/services/ASTParser';
import { RelationshipType } from '@/models/relationships';

describe('ASTParser code edge aggregation', () => {
  let parser: ASTParser;
  const dir = path.join(__dirname, 'ast-parser', 'aggregation');
  const helperFile = path.join(dir, 'helper.ts');
  const callerFile = path.join(dir, 'caller.ts');
  const readsFile = path.join(dir, 'reads.ts');

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

  it('aggregates repeated CALLS edges and emits dependency edges for imported targets', async () => {
    await fs.writeFile(helperFile, `export function helper() { return 1; }\n`, 'utf-8');
    await fs.writeFile(
      callerFile,
      `import { helper } from './helper';\nexport function use() {\n  helper();\n  helper();\n}\n`,
      'utf-8'
    );

    await parser.parseFile(helperFile);
    const result = await parser.parseFile(callerFile);

    const callEdges = result.relationships.filter(
      (rel) => rel.type === RelationshipType.CALLS && String(rel.toEntityId).includes('helper'),
    );
    expect(callEdges).toHaveLength(1);

    const callEdge = callEdges[0] as any;
    expect(callEdge.metadata?.occurrencesScan).toBe(2);
    expect(callEdge.metadata?.scope).toBe('imported');

    const dependencyEdge = result.relationships.find(
      (rel) =>
        rel.type === RelationshipType.DEPENDS_ON &&
        rel.fromEntityId === callEdge.fromEntityId &&
        rel.toEntityId === callEdge.toEntityId,
    ) as any;
    expect(dependencyEdge).toBeDefined();
    expect(dependencyEdge.metadata?.kind).toBe('dependency');
  });

  it('aggregates repeated identifier reads into a single edge with occurrences metadata', async () => {
    await fs.writeFile(
      readsFile,
      `export function aggregate(value: number) {\n  const doubled = value + value;\n  return doubled;\n}\n`,
      'utf-8'
    );

    const result = await parser.parseFile(readsFile);

    const aggregated = result.relationships.filter(
      (rel) =>
        (rel.type === RelationshipType.READS || rel.type === RelationshipType.REFERENCES) &&
        (rel as any).metadata?.occurrencesScan === 2,
    );

    expect(aggregated.length).toBeGreaterThan(0);
    expect((aggregated[0] as any).metadata?.occurrencesScan).toBe(2);
  });
});
