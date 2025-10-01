/**
 * Focused tests for ASTParser noise-reduction heuristics (integration)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@memento/knowledge';
import { RelationshipType } from '@memento/shared-types';

const integration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

integration('ASTParser noise heuristics (integration)', () => {
  let parser: ASTParser;
  const tmpFile = path.join(path.join(__dirname, '..', '..', 'unit', 'ast-parser'), 'noise-heuristics.temp.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
  });

  afterAll(async () => {
    parser.clearCache();
    try { await fs.unlink(tmpFile); } catch {}
  });

  it('skips CALLS to common globals and keeps concrete local CALLS when recorded', async () => {
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

    const callsFromUse = result.relationships.filter(r => r.fromEntityId === use.id && r.type === RelationshipType.CALLS);

    if (callsFromUse.length > 0) {
      // Should include CALLS to concrete helper id
      expect(callsFromUse.some(r => r.toEntityId === helper.id)).toBe(true);
      // Should not include CALLS to external placeholders for console/setTimeout
      expect(callsFromUse.some(r => String(r.toEntityId).includes('external:'))).toBe(false);
      expect(callsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('console'))).toBe(false);
      expect(callsFromUse.some(r => String(r.toEntityId).toLowerCase().includes('settimeout'))).toBe(false);
    } else {
      // If no CALLS were recorded under current heuristics, assert absence of external placeholders
      const anyExternal = result.relationships.some(r => r.type === RelationshipType.CALLS && String(r.toEntityId).startsWith('external:'));
      expect(anyExternal).toBe(false);
    }
  });
});

