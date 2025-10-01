import { describe, it, expect } from 'vitest';
import { CacheManager } from '@memento/knowledge';
import type { CachedFileInfo, Symbol as SymbolEntity } from '@memento/shared-types';
import { RelationshipType } from '@memento/shared-types';

const makeSymbol = (overrides: Partial<SymbolEntity> = {}): SymbolEntity => ({
  id: overrides.id ?? `sym_${Math.random().toString(36).slice(2)}`,
  type: 'symbol',
  name: overrides.name ?? 'foo',
  kind: 'function',
  signature: overrides.signature ?? '() => void',
  docstring: overrides.docstring ?? '',
  visibility: 'public',
  isExported: true,
  isDeprecated: false,
  hash: overrides.hash ?? 'hash',
  language: 'ts',
  lastModified: overrides.lastModified ?? new Date(),
  path: overrides.path ?? 'src/foo.ts:foo',
});

const makeCached = (entities: SymbolEntity[]): CachedFileInfo => ({
  hash: 'h1',
  entities,
  relationships: [],
  lastModified: new Date(Date.now() - 1000),
  symbolMap: new Map<string, SymbolEntity>(
    entities.map((s) => [s.path!, s])
  ),
});

describe('CacheManager', () => {
  it('getCacheStats returns correct file and entity counts', () => {
    const cm = new CacheManager(100);
    const a = makeSymbol({ name: 'a', path: 'a.ts:a' });
    const b = makeSymbol({ name: 'b', path: 'b.ts:b' });
    const c = makeSymbol({ name: 'c', path: 'b.ts:c' });

    cm.setCachedFile('/abs/a.ts', makeCached([a]));
    cm.setCachedFile('/abs/b.ts', makeCached([b, c]));

    // Trigger a hit and a miss to exercise metrics path
    expect(cm.getCachedFile('/abs/a.ts')).toBeTruthy();
    expect(cm.getCachedFile('/abs/missing.ts')).toBeUndefined();

    const stats = cm.getCacheStats();
    expect(stats.files).toBe(2);
    expect(stats.totalEntities).toBe(3);
    expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
    expect(stats.cacheHitRate).toBeLessThanOrEqual(100);
    expect(typeof stats.memoryUsage.heapUsed).toBe('number');
  });

  it('updateCacheForFile updates symbolMap, hash, and indexes with strong types', () => {
    const cm = new CacheManager(100);
    const s1 = makeSymbol({ name: 'x', path: 'file.ts:x' });
    const initial = makeCached([s1]);
    cm.setCachedFile('/abs/file.ts', initial);

    const s2 = makeSymbol({ name: 'y', path: 'file.ts:y' });
    const newMap = new Map<string, SymbolEntity>([
      [s1.path!, s1],
      [s2.path!, s2],
    ]);
    const newContent = 'export const y = 1';

    cm.updateCacheForFile(
      '/abs/file.ts',
      'file.ts',
      newMap,
      newContent
    );

    const cached = cm.getCachedFile('/abs/file.ts')!;
    // Type-directed access to fields (ensures no unknown/any leak)
    expect(Array.from(cached.symbolMap.values()).length).toBe(2);
    expect(typeof cached.hash).toBe('string');
    expect(cached.lastModified).toBeInstanceOf(Date);

    // Indexes should include new symbols by name
    expect(cm.getSymbolsByName('x').some((s) => s.id === s1.id)).toBe(true);
    expect(cm.getSymbolsByName('y').some((s) => s.id === s2.id)).toBe(true);
  });
});

