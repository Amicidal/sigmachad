import crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  mergeEdgeEvidence,
  mergeEdgeLocations,
  normalizeSource,
  isCodeRelationship,
  canonicalTargetKeyFor,
  canonicalRelationshipId,
  normalizeCodeEdge,
} from '@/utils/codeEdges';
import { RelationshipType, type GraphRelationship } from '@/models/relationships';

const baseTimestamp = new Date('2024-01-01T00:00:00Z');

function makeRelationship(overrides: Partial<GraphRelationship> = {}): GraphRelationship {
  return {
    id: 'rel',
    fromEntityId: 'from-entity',
    toEntityId: 'to-entity',
    type: RelationshipType.CALLS,
    created: baseTimestamp,
    lastModified: baseTimestamp,
    version: 1,
    metadata: {},
    ...overrides,
  } as GraphRelationship;
}

describe('mergeEdgeEvidence', () => {
  it('deduplicates by key and prefers higher fidelity sources', () => {
    const result = mergeEdgeEvidence(
      [
        { source: 'heuristic', location: { path: 'file.ts', line: 30 } },
        { source: 'ast', location: { path: 'file.ts', line: 10 } },
      ],
      [
        { source: 'type-checker', location: { path: 'file.ts', line: 5 } },
        { source: 'ast', location: { path: 'file.ts', line: 10 } },
        { source: 'ast', location: { path: 'file.ts', line: 8 } },
      ],
      4,
    );

    expect(result).toEqual([
      { source: 'type-checker', location: { path: 'file.ts', line: 5 } },
      { source: 'ast', location: { path: 'file.ts', line: 8 } },
      { source: 'ast', location: { path: 'file.ts', line: 10 } },
      { source: 'heuristic', location: { path: 'file.ts', line: 30 } },
    ]);
  });

  it('enforces the evidence limit after sorting and deduplication', () => {
    const inputs = Array.from({ length: 30 }, (_, idx) => ({
      source: idx % 2 === 0 ? 'ast' : 'heuristic',
      location: { path: 'file.ts', line: idx + 1 },
    }));

    const result = mergeEdgeEvidence(inputs, [], 5);

    expect(result).toHaveLength(5);
    // AST entries outrank heuristic ones, so the first 5 AST observations remain.
    expect(result.map((entry) => entry.location?.line)).toEqual([1, 3, 5, 7, 9]);
    expect(result.every((entry) => entry.source === 'ast')).toBe(true);
  });
});

describe('mergeEdgeLocations', () => {
  it('removes duplicates and enforces limit ordering', () => {
    const result = mergeEdgeLocations(
      [
        { path: 'a.ts', line: 10, column: 1 },
        { path: 'b.ts', line: 1 },
      ],
      [
        { path: 'a.ts', line: 10, column: 1 },
        { path: 'c.ts' },
      ],
      3,
    );

    expect(result).toEqual([
      { path: 'a.ts', line: 10, column: 1 },
      { path: 'b.ts', line: 1 },
      { path: 'c.ts' },
    ]);
  });

  it('caps locations to the provided limit', () => {
    const many = Array.from({ length: 25 }, (_, idx) => ({ path: `file${idx}.ts`, line: idx }));

    const result = mergeEdgeLocations(many, [], 10);

    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ path: 'file0.ts', line: 0 });
    expect(result[9]).toEqual({ path: 'file9.ts', line: 9 });
  });
});

describe('normalizeSource', () => {
  it('maps known aliases and defaults to heuristic', () => {
    expect(normalizeSource('TS')).toBe('type-checker');
    expect(normalizeSource('ts-ast')).toBe('ast');
    expect(normalizeSource('language-server')).toBe('lsp');
    expect(normalizeSource('indexer')).toBe('index');
    expect(normalizeSource('runtime')).toBe('runtime');
    expect(normalizeSource(undefined)).toBeUndefined();
    expect(normalizeSource('something-else')).toBe('heuristic');
  });
});

describe('isCodeRelationship', () => {
  it('reflects membership in code relationship type list', () => {
    expect(isCodeRelationship(RelationshipType.CALLS)).toBe(true);
    expect(isCodeRelationship(RelationshipType.CONTAINS)).toBe(false);
  });
});

describe('canonicalTargetKeyFor', () => {
  it('prefers structured toRef objects when available', () => {
    const rel = makeRelationship({
      toEntityId: 'file:src/example.ts:Name',
      toRef: { kind: 'fileSymbol', file: 'src/example.ts', symbol: 'Name' },
    });
    expect(canonicalTargetKeyFor(rel)).toBe('FS:src/example.ts:Name');
  });

  it('prefers entity and external toRef metadata over ids', () => {
    const entityRel = makeRelationship({
      toEntityId: 'file:src/a.ts:Fallback',
      toRef: { kind: 'entity', id: 'sym:src/a.ts#actual', name: 'Actual' },
    });
    expect(canonicalTargetKeyFor(entityRel)).toBe('ENT:sym:src/a.ts#actual');

    const externalRel = makeRelationship({
      toEntityId: 'file:src/a.ts:Fallback',
      toRef: { kind: 'external', name: 'lib-name' },
    });
    expect(canonicalTargetKeyFor(externalRel)).toBe('EXT:lib-name');
  });

  it('derives keys from fallback ids', () => {
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'sym:src/a.ts#foo@hash' })) ).toBe('ENT:sym:src/a.ts#foo@hash');
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'file:src/a.ts:Foo' })) ).toBe('FS:src/a.ts:Foo');
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'external:lib' })) ).toBe('EXT:lib');
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'class:Foo' })) ).toBe('KIND:class:Foo');
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'import:pkg:Name' })) ).toBe('IMP:pkg:Name');
    expect(canonicalTargetKeyFor(makeRelationship({ toEntityId: 'unknown' })) ).toBe('RAW:unknown');
  });
});

describe('canonicalRelationshipId', () => {
  it('produces stable ids for canonical targets', () => {
    const relA = makeRelationship({
      fromEntityId: 'from1',
      toEntityId: 'file:src/a.ts:Foo',
      type: RelationshipType.CALLS,
    });
    const relB = makeRelationship({
      fromEntityId: 'from1',
      toEntityId: 'raw',
      type: RelationshipType.CALLS,
      toRef: { kind: 'fileSymbol', file: 'src/a.ts', symbol: 'Foo' },
    });

    expect(canonicalRelationshipId('from1', relA)).toBe(canonicalRelationshipId('from1', relB));
  });

  it('falls back to raw ids for non-code relationships', () => {
    const rel = makeRelationship({ type: RelationshipType.CONTAINS, toEntityId: 'file:src/a.ts' });
    expect(canonicalRelationshipId('from1', rel)).toMatch(/^time-rel_[0-9a-f]{40}$/);
  });
});

describe('normalizeCodeEdge', () => {
  it('hoists metadata, sanitizes fields, and enriches context', () => {
    const normalized = normalizeCodeEdge({
      id: 'code-1',
      fromEntityId: 'sym:src/foo.ts#useLocal@abc',
      toEntityId: 'file:src/bar.ts:Symbol',
      type: 'USES' as RelationshipType,
      created: baseTimestamp,
      lastModified: baseTimestamp,
      version: 1,
      metadata: {
        path: 'src/foo.ts',
        line: 7,
        column: 2,
        confidence: 0.6,
        source: 'ts',
        evidence: [
          { source: 'ast', location: { path: 'src/foo.ts', line: 7, column: 3 }, note: 'Meta note', extractorVersion: 'v42' },
          { source: 'ast', location: { path: 'src/foo.ts', line: 7, column: 3 } },
        ],
        toRef: { kind: 'fileSymbol', file: 'src/bar.ts', symbol: 'Symbol', name: 'Symbol' },
        fromRef: { kind: 'fileSymbol', file: 'src/foo.ts', symbol: 'useLocal', name: 'useLocal' },
      },
      evidence: [
        { source: 'type-checker', location: { path: 'src/foo.ts', line: 5 } },
        { source: 'type-checker', location: { path: 'src/foo.ts', line: 5 } },
        { source: 'heuristic', location: { path: 'src/foo.ts', line: 12 }, note: '  ' },
      ],
      locations: [
        { path: 'src/foo.ts', line: 5 },
        { path: 'src/foo.ts', line: 5 },
        { path: '', line: NaN },
      ],
      accessPath: 'useLocal',
    } as GraphRelationship);

    expect(normalized.type).toBe(RelationshipType.TYPE_USES);
    expect(normalized.active).toBe(true);
    expect(normalized.source).toBe('type-checker');
    expect(normalized.confidence).toBe(0.6);
    expect(normalized.context).toBe('src/foo.ts:7');
    expect(normalized.location).toEqual({ path: 'src/foo.ts', line: 7, column: 2 });
    expect(normalized.locations).toEqual([
      { path: 'src/foo.ts', line: 5 },
      { path: 'src/foo.ts', line: 5 },
    ]);

    const expectedSiteIdBase = 'src/foo.ts|7|2|useLocal';
    const expectedSiteId = 'site_' + crypto.createHash('sha1').update(expectedSiteIdBase).digest('hex').slice(0, 12);
    expect(normalized.siteId).toBe(expectedSiteId);
    expect(normalized.sites).toEqual([expectedSiteId]);

    const expectedSiteHashPayload = JSON.stringify({
      p: 'src/foo.ts',
      a: 'useLocal',
      // At hash time, kind/paramName/callee/operator are still undefined.
      k: undefined,
      c: undefined,
      o: undefined,
      pm: undefined,
      t: RelationshipType.TYPE_USES,
      f: 'sym:src/foo.ts#useLocal@abc',
    });
    const expectedSiteHash =
      'sh_' + crypto.createHash('sha1').update(expectedSiteHashPayload).digest('hex').slice(0, 16);
    expect(normalized.siteHash).toBe(expectedSiteHash);

    expect(normalized.evidence).toEqual([
      { source: 'type-checker', location: { path: 'src/foo.ts', line: 5 } },
      { source: 'ast', location: { path: 'src/foo.ts', line: 7, column: 3 }, note: 'Meta note', extractorVersion: 'v42' },
      { source: 'heuristic', location: { path: 'src/foo.ts', line: 12 } },
    ]);

    expect(normalized.metadata).toMatchObject({
      path: 'src/foo.ts',
      line: 7,
      column: 2,
      confidence: 0.6,
      source: 'ts',
      toRef: { kind: 'fileSymbol', file: 'src/bar.ts', symbol: 'Symbol', name: 'Symbol' },
      fromRef: { kind: 'fileSymbol', file: 'src/foo.ts', symbol: 'useLocal', name: 'useLocal' },
    });
    expect((normalized.metadata as any).evidence).toBeUndefined();

    expect(normalized.to_ref_kind).toBe('fileSymbol');
    expect(normalized.to_ref_file).toBe('src/bar.ts');
    expect(normalized.to_ref_symbol).toBe('Symbol');
    expect((normalized as any).from_ref_kind).toBe('fileSymbol');
    expect((normalized as any).from_ref_file).toBe('src/foo.ts');
    expect((normalized as any).from_ref_symbol).toBe('useLocal');
  });

  it('maps legacy strength and clamps occurrence counters', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-2',
        fromEntityId: 'sym:src/foo.ts#fn@abc',
        toEntityId: 'external:pkg',
        type: RelationshipType.CALLS,
      }),
      strength: 2,
      occurrencesScan: -3,
      occurrencesTotal: '4.8',
      occurrencesRecent: '-1',
      metadata: {},
    } as GraphRelationship);

    expect(normalized.confidence).toBe(1);
    expect((normalized as any).strength).toBeUndefined();
    expect(normalized.occurrencesScan).toBe(0);
    expect(normalized.occurrencesTotal).toBe(4);
    expect(normalized.occurrencesRecent).toBe(0);
    expect(normalized.active).toBe(true);
    expect(normalized.to_ref_kind).toBe('external');
  });

  it('retains fractional occurrence counts when provided', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-fractional',
        fromEntityId: 'sym:src/foo.ts#caller@hash',
        toEntityId: 'file:src/bar.ts:Symbol',
        type: RelationshipType.CALLS,
      }),
      occurrencesScan: 5.9 as any,
      occurrencesTotal: '3.4' as any,
      occurrencesRecent: '0.42' as any,
      metadata: {
        occurrencesScan: '7.1',
      },
    } as GraphRelationship);

    expect(normalized.occurrencesScan).toBe(5);
    expect(normalized.occurrencesTotal).toBe(3);
    expect(normalized.occurrencesRecent).toBeCloseTo(0.42, 5);
  });

  it('falls back to synthesized evidence when merged list is empty', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-3',
        fromEntityId: 'sym:src/foo.ts#fn@abc',
        toEntityId: 'file:src/bar.ts:Symbol',
        type: RelationshipType.CALLS,
      }),
      source: 'ast',
      metadata: {
        path: 'src/foo.ts',
        line: 4,
        evidence: [],
      },
      evidence: [null as any, undefined as any],
    } as GraphRelationship);

    expect(normalized.evidence).toEqual([
      { source: 'ast', location: { path: 'src/foo.ts', line: 4 } },
    ]);
  });

  it('synthesizes fallback evidence with metadata annotations when available', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-3b',
        fromEntityId: 'sym:src/foo.ts#fn@abc',
        toEntityId: 'file:src/bar.ts:Symbol',
        type: RelationshipType.CALLS,
      }),
      metadata: {
        path: 'src/foo.ts',
        line: 8,
        note: 'Synthesized evidence note',
        extractorVersion: 'v100',
        confidence: 0.9,
        evidence: [],
      },
      evidence: [],
    } as GraphRelationship);

    expect(normalized.evidence).toHaveLength(1);
    const entry = normalized.evidence[0];
    expect(entry.source).toBe('ast');
    expect(entry.confidence).toBe(0.9);
    expect(entry.note).toBe('Synthesized evidence note');
    expect(entry.extractorVersion).toBe('v100');
    expect(entry.location).toEqual({ path: 'src/foo.ts', line: 8 });
  });

  it('clamps oversize evidence metadata fields', () => {
    const longNote = 'n'.repeat(2105);
    const longVersion = 'v'.repeat(250);
    const longPath = 'a'.repeat(4200);

    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-long',
        type: RelationshipType.CALLS,
      }),
      source: 'type-checker' as any,
      evidence: [
        {
          source: 'ast',
          note: longNote,
          extractorVersion: longVersion,
          location: { path: longPath, line: 3.4, column: 8.2 },
        },
      ] as any,
    } as GraphRelationship);

    expect(normalized.evidence).toHaveLength(1);
    const entry = normalized.evidence[0];
    expect(entry.note).toBeDefined();
    expect(entry.note!.length).toBe(2000);
    expect(entry.extractorVersion).toBeDefined();
    expect(entry.extractorVersion!.length).toBe(200);
    expect(entry.location?.path?.length).toBe(4096);
    expect(entry.location?.line).toBe(3);
    expect(entry.location?.column).toBe(8);
  });

  it('defaults evidence source when missing', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-missing-source',
        type: RelationshipType.CALLS,
      }),
      source: 'type-checker' as any,
      evidence: [
        {
          source: undefined,
          location: { path: 'src/foo.ts', line: 1 },
        },
      ] as any,
    } as GraphRelationship);

    const fallback = normalized.evidence.find((entry) => entry.location?.line === 1);
    expect(fallback?.source).toBe('type-checker');
  });

  it('omits generated site identifiers when no location information is present', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-no-location',
        type: RelationshipType.CALLS,
        metadata: {},
      }),
    } as GraphRelationship);

    expect(normalized.location).toBeUndefined();
    expect(normalized.siteId).toBeUndefined();
    expect(normalized.sites).toBeUndefined();
    expect(normalized.siteHash).toMatch(/^sh_[0-9a-f]{16}$/);
  });

  it('infers toRef and fromRef metadata from entity identifiers', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-4',
        fromEntityId: 'sym:src/source.ts#caller@hash',
        toEntityId: 'file:src/target.ts:Target',
        type: RelationshipType.CALLS,
      }),
      metadata: {},
    } as GraphRelationship);

    expect(normalized.to_ref_kind).toBe('fileSymbol');
    expect(normalized.to_ref_file).toBe('src/target.ts');
    expect(normalized.to_ref_symbol).toBe('Target');
    expect((normalized as any).from_ref_kind).toBe('fileSymbol');
    expect((normalized as any).from_ref_file).toBe('src/source.ts');
    expect((normalized as any).from_ref_symbol).toBe('caller');

    const externalNormalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-5',
        fromEntityId: 'external:pkg-source',
        toEntityId: 'external:pkg-target',
        type: RelationshipType.CALLS,
      }),
      metadata: {},
    } as GraphRelationship);

    expect(externalNormalized.to_ref_kind).toBe('external');
    expect(externalNormalized.to_ref_name).toBe('pkg-target');
    expect((externalNormalized as any).from_ref_kind).toBe('external');
    expect((externalNormalized as any).from_ref_name).toBe('pkg-source');
  });

  it('merges provided sites without duplication and retains generated identifiers', () => {
    const normalized = normalizeCodeEdge({
      id: 'code-sites',
      fromEntityId: 'sym:src/foo.ts#useLocal@abc',
      toEntityId: 'file:src/bar.ts:Symbol',
      type: RelationshipType.CALLS,
      accessPath: 'useLocal',
      metadata: {
        path: 'src/foo.ts',
        line: 10,
      },
      sites: ['existing_site', 'dup_site', 'existing_site'],
    } as unknown as GraphRelationship);

    const expectedSiteIdBase = 'src/foo.ts|10||useLocal';
    const expectedSiteId =
      'site_' + crypto.createHash('sha1').update(expectedSiteIdBase).digest('hex').slice(0, 12);

    expect(normalized.siteId).toBe(expectedSiteId);
    expect(normalized.sites).toEqual(['existing_site', 'dup_site', expectedSiteId]);
  });

  it('promotes entity and symbol references for toRef and fromRef metadata', () => {
    const withEntityRefs = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-entity',
        fromEntityId: 'ent:caller',
        toEntityId: 'ent:callee',
        type: RelationshipType.CALLS,
      }),
      toRef: { kind: 'entity', id: 'sym:src/file.ts#Resolved', name: 'Resolved' },
      metadata: { fromRef: { kind: 'entity', id: 'sym:src/file.ts#Caller', name: 'Caller' } },
    } as GraphRelationship);

    expect(withEntityRefs.to_ref_kind).toBe('entity');
    expect(withEntityRefs.to_ref_name).toBe('Resolved');
    expect((withEntityRefs as any).from_ref_kind).toBe('entity');
    expect((withEntityRefs as any).from_ref_name).toBe('Caller');

    const withSymFallback = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-sym',
        fromEntityId: 'sym:src/from.ts#fn@hash',
        toEntityId: 'sym:src/to.ts#target@hash',
        type: RelationshipType.CALLS,
      }),
      metadata: {},
    } as GraphRelationship);

    expect(withSymFallback.to_ref_kind).toBe('fileSymbol');
    expect(withSymFallback.to_ref_file).toBe('src/to.ts');
    expect(withSymFallback.to_ref_symbol).toBe('target');
    expect((withSymFallback as any).from_ref_kind).toBe('fileSymbol');
    expect((withSymFallback as any).from_ref_file).toBe('src/from.ts');
    expect((withSymFallback as any).from_ref_symbol).toBe('fn');
  });

  it('hoists advanced metadata fields to the normalized relationship', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-advanced',
        type: RelationshipType.CALLS,
      }),
      metadata: {
        dynamicDispatch: true,
        overloadIndex: 2,
        genericArguments: ['T', 'K'],
        ambiguous: true,
        candidateCount: 3,
        isMethod: false,
      },
    } as GraphRelationship);

    expect(normalized.dynamicDispatch).toBe(true);
    expect(normalized.overloadIndex).toBe(2);
    expect(normalized.genericArguments).toEqual(['T', 'K']);
    expect(normalized.ambiguous).toBe(true);
    expect(normalized.candidateCount).toBe(3);
    expect(normalized.isMethod).toBe(false);
  });

  it('hoists supplemental metadata (resolution, import depth, param name, checker usage)', () => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({
        id: 'code-hoist',
        type: RelationshipType.CALLS,
      }),
      metadata: {
        resolution: 'type-checker',
        scope: 'imported',
        importDepth: 2,
        usedTypeChecker: true,
        isExported: false,
        importAlias: 'aliasName',
        receiverType: 'SomeReceiver',
        arity: 2,
        awaited: true,
        operator: 'new',
        callee: 'makeThing',
        param: 'arg0',
      },
    } as GraphRelationship);

    expect(normalized.resolution).toBe('type-checker');
    expect(normalized.scope).toBe('imported');
    expect(normalized.importDepth).toBe(2);
    expect(normalized.usedTypeChecker).toBe(true);
    expect(normalized.isExported).toBe(false);
    expect(normalized.importAlias).toBe('aliasName');
    expect(normalized.receiverType).toBe('SomeReceiver');
    expect(normalized.arity).toBe(2);
    expect(normalized.awaited).toBe(true);
    expect(normalized.operator).toBe('new');
    expect(normalized.callee).toBe('makeThing');
    expect(normalized.paramName).toBe('arg0');
  });
});

it('leaves non-code relationships unchanged', () => {
  const rel = makeRelationship({
    type: RelationshipType.CONTAINS,
    metadata: { path: 'src/file.ts' },
  });

  const normalized = normalizeCodeEdge(rel);

  expect(normalized).toEqual(rel);
});

it('fills kind based on relationship type when missing', () => {
  const normalized = normalizeCodeEdge({
    ...makeRelationship({
      id: 'code-6',
      type: RelationshipType.WRITES,
      metadata: {},
    }),
    kind: undefined,
  } as GraphRelationship);

  expect(normalized.kind).toBe('write');
});

describe('normalizeCodeEdge kind inference', () => {
  const cases: Array<{ type: RelationshipType; expected: string }> = [
    { type: RelationshipType.CALLS, expected: 'call' },
    { type: RelationshipType.REFERENCES, expected: 'identifier' },
    { type: RelationshipType.EXTENDS, expected: 'inheritance' },
    { type: RelationshipType.IMPLEMENTS, expected: 'inheritance' },
    { type: RelationshipType.OVERRIDES, expected: 'override' },
    { type: RelationshipType.DEPENDS_ON, expected: 'dependency' },
    { type: RelationshipType.READS, expected: 'read' },
    { type: RelationshipType.WRITES, expected: 'write' },
    { type: RelationshipType.THROWS, expected: 'throw' },
    { type: RelationshipType.TYPE_USES, expected: 'type' },
    { type: RelationshipType.RETURNS_TYPE, expected: 'return' },
    { type: RelationshipType.PARAM_TYPE, expected: 'param' },
  ];

  it.each(cases)('infers %expected for %type relationships', ({ type, expected }) => {
    const normalized = normalizeCodeEdge({
      ...makeRelationship({ type, metadata: {} }),
      kind: undefined,
    } as GraphRelationship);

    expect(normalized.kind).toBe(expected);
  });
});
