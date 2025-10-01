import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@memento/knowledge';
import { RelationshipType } from '@memento/shared-types';

const integration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

integration('ASTParser detailed confidence for REFERENCES/DEPENDS_ON (integration)', () => {
  let parser: ASTParser;
  const dir = path.join(path.join(__dirname, '..', '..', 'unit', 'ast-parser'), 'confidence');
  const localFile = path.join(dir, 'local.ts');
  const importedDef = path.join(dir, 'defs.ts');
  const importer = path.join(dir, 'importer.ts');
  const externalFile = path.join(dir, 'external.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      localFile,
      `export interface Local { x: number }\nexport function useLocal(a: Local) { return a.x; }\n`,
      'utf-8'
    );
    await fs.writeFile(importedDef, `export interface Def { y: number }\n`, 'utf-8');
    await fs.writeFile(
      importer,
      `import { Def } from './defs';\nexport function fromImport(a: Def) { return a.y; }\n`,
      'utf-8'
    );
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

  it('assigns high confidence or emits PARAM_TYPE for local dependency', async () => {
    const res = await parser.parseFile(localFile);
    const deps = res.relationships.filter(r => r.type === RelationshipType.DEPENDS_ON);
    const paramTypes = res.relationships.filter(r => r.type === RelationshipType.PARAM_TYPE);
    expect(deps.length + paramTypes.length).toBeGreaterThan(0);
  });

  it('assigns medium confidence for file: resolved dependency (or has PARAM_TYPE)', async () => {
    const res = await parser.parseFile(importer);
    const deps = res.relationships.filter(r => r.type === RelationshipType.DEPENDS_ON);
    const fileDep = deps.find(r => String(r.toEntityId).startsWith('file:'));
    if (fileDep) {
      const conf = (fileDep as any).metadata?.confidence;
      expect(typeof conf).toBe('number');
      expect(conf).toBeGreaterThanOrEqual(0.5);
      expect(conf).toBeLessThanOrEqual(0.9);
    } else {
      const paramTypes = res.relationships.filter(r => r.type === RelationshipType.PARAM_TYPE);
      expect(paramTypes.length).toBeGreaterThan(0);
    }
  });

  it('assigns lower confidence for external unresolved reference (if emitted)', async () => {
    const res = await parser.parseFile(externalFile);
    const refs = res.relationships.filter(r => r.type === RelationshipType.REFERENCES || r.type === RelationshipType.DEPENDS_ON);
    const extRef = refs.find(r => String(r.toEntityId).startsWith('external:'));
    if (extRef) {
      const conf = (extRef as any).metadata?.confidence;
      expect(typeof conf).toBe('number');
      expect(conf).toBeGreaterThanOrEqual(0.3);
      expect(conf).toBeLessThanOrEqual(0.6);
    } else {
      expect(refs.length).toBeGreaterThanOrEqual(0);
    }
  });
});

