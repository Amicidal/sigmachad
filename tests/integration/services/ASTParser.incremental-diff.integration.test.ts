/**
 * Integration test for ASTParser incremental relationship diffing
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { ASTParser, ParseResult, IncrementalParseResult } from '../../../src/services/ASTParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ASTParser incremental diff (relationships)', () => {
  let parser: ASTParser;
  let testDir: string;
  let filePath: string;

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    testDir = path.join(tmpdir(), 'astparser-incr-diff');
    await fs.mkdir(testDir, { recursive: true });
  }, 10000);

  afterAll(async () => {
    try { await fs.rm(testDir, { recursive: true, force: true }); } catch {}
  });

  beforeEach(async () => {
    parser.clearCache();
    filePath = path.join(testDir, 'diff-sample.ts');
  });

  it('detects removed CALLS edges between revisions', async () => {
    const v1 = `
      export function callee() { return 1; }
      export function caller() {
        return callee(); // call site
      }
    `;
    await fs.writeFile(filePath, v1, 'utf-8');
    const first: IncrementalParseResult = await parser.parseFileIncremental(filePath);
    // Expect at least one CALLS edge initially
    const callsV1 = first.relationships.filter(r => r.type === 'CALLS');
    expect(callsV1.length).toBeGreaterThan(0);

    // Remove the call in v2
    const v2 = `
      export function callee() { return 1; }
      export function caller() {
        return 42; // no call
      }
    `;
    await fs.writeFile(filePath, v2, 'utf-8');
    const second: IncrementalParseResult = await parser.parseFileIncremental(filePath);

    // Should report a removed CALLS relationship
    const removedCalls = (second.removedRelationships || []).filter(r => r.type === 'CALLS');
    expect(removedCalls.length).toBeGreaterThan(0);
  });
});

