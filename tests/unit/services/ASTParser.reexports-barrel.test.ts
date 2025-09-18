import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { ASTParser } from '@/services/ASTParser';
import { RelationshipType } from '@/models/relationships';

describe('ASTParser barrel re-export resolution', () => {
  let parser: ASTParser;
  const dir = path.join(__dirname, 'ast-parser', 'reexp');
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

  it('resolves references through index.ts re-exports', async () => {
    const res = await parser.parseFile(fileConsumer);
    const rels = res.relationships.filter(r => r.type === RelationshipType.REFERENCES);
    const relStrs = rels.map(r => String(r.toEntityId));
    // Expect a reference pointing to the underlying a.ts:original via file: prefix
    const targetSuffix = path.join('tests', 'unit', 'services', 'ast-parser', 'reexp', 'a.ts') + ':original';
    const match = relStrs.find(s => s.startsWith('file:') && s.endsWith(':original') && s.includes('a.ts'));
    expect(match, `Expected file:*a.ts:original in ${JSON.stringify(relStrs)}`).toBeTruthy();
  });
});
