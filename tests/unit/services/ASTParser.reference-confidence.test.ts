import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@/services/ASTParser';
import { RelationshipType } from '@/models/relationships';
import { noiseConfig } from '@/config/noise';

describe('ASTParser reference confidence metadata', () => {
  let parser: ASTParser;
  const tmp = path.join(__dirname, 'ast-parser', 'ref-confidence.temp.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
  });

  it('emits confidence metadata for REFERENCES/DEPENDS_ON', async () => {
    const content = `
      export interface Foo {}
      export function bar(arg: Foo) { return 1; }
      export function baz() {
        // unresolved external reference
        return maybeGlobal + 1;
      }
    `;
    await fs.writeFile(tmp, content, 'utf-8');

    const result = await parser.parseFile(tmp);
    const refs = result.relationships.filter(r => r.type === RelationshipType.REFERENCES);
    const deps = result.relationships.filter(r => r.type === RelationshipType.DEPENDS_ON);

    // Should have at least one DEPENDS_ON for Foo type
    expect(deps.length).toBeGreaterThan(0);
    // Confidence metadata present
    expect(deps.some(r => (r as any).metadata && typeof (r as any).metadata.confidence === 'number')).toBe(true);

    // References include unresolved external with confidence
    const hasExternal = refs.some(r => String(r.toEntityId).startsWith('external:') && (r as any).metadata?.confidence === 0.4);
    // And concrete/file refs with >= 0.6
    const hasFileRef = refs.some(r => String(r.toEntityId).startsWith('file:') && (r as any).metadata?.confidence >= 0.6);
    expect(hasExternal || hasFileRef).toBe(true);
  });

  it('drops inferred placeholders when the confidence gate is raised', async () => {
    const original = noiseConfig.MIN_INFERRED_CONFIDENCE;
    noiseConfig.MIN_INFERRED_CONFIDENCE = 0.95;
    try {
      parser.clearCache();
      const content = `
        export function gated() {
          return maybeGlobal + 2;
        }
      `;
      await fs.writeFile(tmp, content, 'utf-8');

      const result = await parser.parseFile(tmp);
      const external = result.relationships.filter(r => r.type === RelationshipType.REFERENCES && String(r.toEntityId).startsWith('external:maybeGlobal'));
      expect(external).toHaveLength(0);
    } finally {
      noiseConfig.MIN_INFERRED_CONFIDENCE = original;
    }
  });
});
