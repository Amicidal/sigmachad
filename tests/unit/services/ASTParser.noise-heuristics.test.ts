/**
 * Focused tests for ASTParser noise-reduction heuristics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '../../../src/services/knowledge/ASTParser';
import { RelationshipType } from '@/models/relationships';

describe('ASTParser noise heuristics', () => {
  let parser: ASTParser;
  const tmpFile = path.join(__dirname, 'ast-parser', 'noise-heuristics.temp.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
  });

  afterAll(async () => {
    parser.clearCache();
    try { await fs.unlink(tmpFile); } catch {}
  });

  it('skips CALLS to common globals and keeps concrete local CALLS', async () => {
    const content = `
      export function helper() { return 1; }
      export function use() {
        console.log('x');
        setTimeout(() => {}, 0);
        return helper();
      }
    `;
    await fs.writeFile(tmpFile, content, 'utf-8');

    const result = await parser.parseFile(tmpFile);
    const symbols = result.entities.filter(e => e.type === 'symbol') as any[];
    const use = symbols.find(s => s.name === 'use');
    const helper = symbols.find(s => s.name === 'helper');
    expect(use).toBeDefined();
    expect(helper).toBeDefined();

    // Find CALLS emitted from 'use'
    const callsFromUse = result.relationships.filter(r => r.fromEntityId === use.id && r.type === RelationshipType.CALLS);
    // Should include CALLS to concrete helper id
    expect(callsFromUse.some(r => r.toEntityId === helper.id)).toBe(true);
    // Should not include CALLS to external placeholders for console/setTimeout
    expect(callsFromUse.some(r => String(r.toEntityId).includes('external:'))).toBe(false);
    expect(callsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('console'))).toBe(false);
    expect(callsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('settimeout'))).toBe(false);

    // Also ensure no down-graded REFERENCES were emitted for those globals
    const refsFromUse = result.relationships.filter(r => r.fromEntityId === use.id && r.type === RelationshipType.REFERENCES);
    expect(refsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('console'))).toBe(false);
    expect(refsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('settimeout'))).toBe(false);
  });
});

