import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '../../../src/services/knowledge/ASTParser';
import { RelationshipType } from '@/models/relationships';

describe('ASTParser detailed confidence for REFERENCES/DEPENDS_ON', () => {
  let parser: ASTParser;
  const dir = path.join(path.join(__dirname, '..', 'ast-parser'), 'confidence');
  const localFile = path.join(dir, 'local.ts');
  const importedDef = path.join(dir, 'defs.ts');
  const importer = path.join(dir, 'importer.ts');
  const externalFile = path.join(dir, 'external.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    await fs.mkdir(dir, { recursive: true });

    // Local dependency (concrete id) -> expect confidence 0.9
    await fs.writeFile(
      localFile,
      `export interface Local { x: number }\nexport function useLocal(a: Local) { return a.x; }\n`,
      'utf-8'
    );

    // Imported dependency resolved to file: -> expect confidence 0.6
    await fs.writeFile(importedDef, `export interface Def { y: number }\n`, 'utf-8');
    await fs.writeFile(
      importer,
      `import { Def } from './defs';\nexport function fromImport(a: Def) { return a.y; }\n`,
      'utf-8'
    );

    // External unresolved -> expect external: with confidence 0.4
    await fs.writeFile(
      externalFile,
      `export function ext() { return maybeGlobal + 1; }\n`,
      'utf-8'
    );
  });

  afterAll(async () => {
    for (const f of [localFile, importedDef, importer, externalFile]) {
      try { await fs.unlink(f); } catch {}
    }
    try { await fs.rmdir(dir); } catch {}
  });

  it('assigns 0.9 for local concrete id dependency', async () => {
    const res = await parser.parseFile(localFile);
    const deps = res.relationships.filter(r => r.type === RelationshipType.DEPENDS_ON);
    expect(deps.length).toBeGreaterThan(0);
    const localDep = deps.find(r => !(String(r.toEntityId).startsWith('file:') || String(r.toEntityId).startsWith('external:')));
    expect(localDep).toBeTruthy();
    expect((localDep as any).metadata?.confidence).toBe(0.9);
  });

  it('assigns 0.6 for file: resolved dependency', async () => {
    const res = await parser.parseFile(importer);
    const deps = res.relationships.filter(r => r.type === RelationshipType.DEPENDS_ON);
    expect(deps.length).toBeGreaterThan(0);
    const fileDep = deps.find(r => String(r.toEntityId).startsWith('file:'));
    expect(fileDep).toBeTruthy();
    expect((fileDep as any).metadata?.confidence).toBe(0.6);
  });

  it('assigns 0.4 for external unresolved reference', async () => {
    const res = await parser.parseFile(externalFile);
    const refs = res.relationships.filter(r => r.type === RelationshipType.REFERENCES || r.type === RelationshipType.DEPENDS_ON);
    const extRef = refs.find(r => String(r.toEntityId).startsWith('external:'));
    expect(extRef).toBeTruthy();
    expect((extRef as any).metadata?.confidence).toBe(0.4);
  });
});

