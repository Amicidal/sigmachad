import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@memento/knowledge';
import { RelationshipType } from '@memento/shared-types';

const integration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

integration('ASTParser barrel re-export resolution (integration)', () => {
  let parser: ASTParser;
  const dir = path.join(path.join(__dirname, '..', '..', 'unit', 'ast-parser'), 'reexp');
  const fileA = path.join(dir, 'a.ts');
  const fileIndex = path.join(dir, 'index.ts');
  const fileConsumer = path.join(dir, 'consumer.ts');

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fileA, `export function original() { return 1 }\n`, 'utf-8');
    await fs.writeFile(fileIndex, `export { original as alias } from './a';\n`, 'utf-8');
    await fs.writeFile(fileConsumer, `import { alias } from './index';\nexport function use() { return alias(); }\n`, 'utf-8');
  });

  afterAll(async () => {
    try { await fs.unlink(fileConsumer); } catch {}
    try { await fs.unlink(fileIndex); } catch {}
    try { await fs.unlink(fileA); } catch {}
    try { await fs.rmdir(dir); } catch {}
  });

  it('resolves references or imports through index.ts re-exports', async () => {
    const res = await parser.parseFile(fileConsumer);
    const refs = res.relationships.filter(r => r.type === RelationshipType.REFERENCES);
    const relStrs = refs.map(r => String(r.toEntityId));
    const match = relStrs.find(s => s.startsWith('file:') && s.endsWith(':original') && s.includes('a.ts'));
    if (match) {
      expect(match).toBeTruthy();
    } else {
      // Fallback: ensure named IMPORT is resolved to a.ts:original via import relationships
      const imports = res.relationships.filter(r => r.type === RelationshipType.IMPORTS);
      const found = imports.some(r => String(r.toEntityId).startsWith('file:') && String(r.toEntityId).endsWith(':original'));
      expect(found).toBe(true);
    }
  });
});

