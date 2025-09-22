import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService';
import { APIGateway } from '../../../src/api/APIGateway';
import type { DatabaseService } from '../../../src/services/core/DatabaseService';
import type { Entity } from '../../../src/models/entities';
import { RelationshipType } from '../../../src/models/relationships';

class MockDB implements Partial<DatabaseService> {
  public calls: Array<{ q: string; params: any }>[] = [] as any;
  public queries: Array<{ query: string; params: any }> = [];

  // Minimal falkordbQuery mock with conditional responses
  async falkordbQuery(query: string, params: Record<string, any> = {}): Promise<any[]> {
    this.queries.push({ query, params });

    if (query.includes('collect(prev) AS prevs')) {
      return [
        { prevId: null, prevTimestamp: null, futureCount: 0 },
      ] as any;
    }
    if (query.includes('RETURN pv.id AS id')) {
      // Previous version lookup
      return [];
    }
    if (query.includes('RETURN DISTINCT n.id AS id')) {
      // Members for checkpoint neighborhood
      return [{ id: 'node1' }, { id: 'node2' }];
    }
    if (query.includes('RETURN count(n) AS total')) {
      return [{ total: 1 }];
    }
    if (query.includes('RETURN 1 AS ok')) {
      return [{ ok: 1 } as any];
    }
    if (query.trim() === 'INFO') {
      return [];
    }
    // Entity fetch by ids
    if (query.includes('MATCH (n {id: id})')) {
      const ids = (params as any).ids || [];
      return ids.map((id: string) => ({ id, type: 'file', path: `/p/${id}`, hash: 'h' + id }));
    }
    // Relationship fetch among ids (return none for simplicity)
    if (query.includes('MATCH (a {id: idA})-[r]->(b)')) {
      return [];
    }
    return [];
  }
}

describe('KnowledgeGraphService history operations', () => {
  let db: MockDB;
  let kg: KnowledgeGraphService;
  let runTransactionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    db = new MockDB();
    // @ts-expect-error partial mock is sufficient for these unit tests
    kg = new KnowledgeGraphService(db as DatabaseService);
    process.env.HISTORY_ENABLED = 'true';
    runTransactionSpy = vi
      .spyOn(kg as any, 'runTemporalTransaction')
      .mockImplementation(async (steps: any[]) =>
        steps.map(() => ({ data: [{ ok: true }], headers: [] }))
      );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appendVersion: creates version and OF link when enabled', async () => {
    const entity: Entity = {
      id: 'e1',
      type: 'file',
      path: 'src/a.ts',
      hash: 'abc123',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      size: 1,
      lines: 1,
      isTest: false,
      isConfig: false,
      dependencies: [],
    } as any;

    const vid = await kg.appendVersion(entity);
    expect(vid).toBe(`ver_${entity.id}_${entity.hash}`);
    expect(runTransactionSpy).toHaveBeenCalledTimes(1);
    const steps = runTransactionSpy.mock.calls[0][0] as Array<{ query: string }>;
    expect(steps[0].query).toContain('MERGE (v:version');
    expect(steps[0].query).toContain('MERGE (v)-[of:OF');
    expect((steps[0] as any).params.prevId).toBeNull();
    expect(db.queries[0]?.query).toContain('collect(prev) AS prevs');
  });

  it('openEdge: merges edge with validFrom and resets validTo', async () => {
    await kg.openEdge('a', 'b', RelationshipType.CALLS, new Date('2024-01-01T00:00:00Z'));
    expect(db.queries.length).toBe(1);
    expect(db.queries[0].query).toContain('MATCH (a {id: $fromId})-[r:CALLS { id: $id }]->(b {id: $toId})');
    expect(runTransactionSpy).toHaveBeenCalled();
    const steps = runTransactionSpy.mock.calls[0][0] as Array<{ query: string; params: any }>;
    expect(steps[0].query).toContain('MERGE (a)-[r:CALLS { id: $id }]->(b)');
    expect(steps[0].params.segmentId).toBeTypeOf('string');
  });

  it('closeEdge: sets validTo on existing relationship', async () => {
    const original = db.falkordbQuery.bind(db);
    vi.spyOn(db, 'falkordbQuery').mockImplementation(async (query: string, params?: any) => {
      db.queries.push({ query, params });
      if (query.includes('RETURN r.id AS id') && query.includes('LIMIT 1')) {
        return [
          {
            validFrom: '2024-01-01T00:00:00Z',
            validTo: null,
            temporal: JSON.stringify({ segments: [], events: [] }),
            segmentId: 'seg_existing',
            lastChangeSetId: 'change_prev',
            version: 2,
            lastModified: '2024-01-01T00:00:00Z',
          },
        ];
      }
      return original(query, params);
    });

    await kg.closeEdge('a', 'b', RelationshipType.IMPORTS, new Date('2024-01-02T00:00:00Z'), 'change_current');
    expect(runTransactionSpy).toHaveBeenCalled();
    const steps = runTransactionSpy.mock.calls[0][0] as Array<{ query: string; params: any }>;
    expect(steps[0].query).toContain('SET r.validTo = coalesce');
    expect(steps[0].params.changeSetId).toBe('change_current');
  });

  it('repairPreviousVersionLink: returns true when transaction succeeds', async () => {
    runTransactionSpy.mockResolvedValueOnce([
      { data: [{ id: 'rel_prev' }], headers: ['id'] },
    ]);
    const repaired = await kg.repairPreviousVersionLink(
      'entity1',
      'ver_entity1_hash2',
      'ver_entity1_hash1'
    );
    expect(repaired).toBe(true);
    expect(runTransactionSpy).toHaveBeenCalled();
    const steps = runTransactionSpy.mock.calls[0][0] as Array<{
      query: string;
      params: Record<string, any>;
    }>;
    expect(steps[0].query).toContain('MERGE (current)-[r:PREVIOUS_VERSION');
    expect(steps[0].params.relId).toBeTruthy();
  });

  it('repairPreviousVersionLink: returns false when guard prevents link', async () => {
    runTransactionSpy.mockResolvedValueOnce([
      { data: [], headers: [] },
    ]);
    const repaired = await kg.repairPreviousVersionLink(
      'entity1',
      'ver_entity1_hash3',
      'ver_entity1_hash2'
    );
    expect(repaired).toBe(false);
  });

  it('createCheckpoint: creates checkpoint and includes members', async () => {
    const { checkpointId } = await kg.createCheckpoint(['seed1', 'seed2'], 'daily', 2);
    expect(checkpointId).toMatch(/^chk_/);
    // Should create checkpoint, query members, and create include edges
    const qstr = db.queries.map(q => q.query).join('\n');
    expect(qstr).toContain('MERGE (c:checkpoint');
    expect(qstr).toContain('RETURN DISTINCT n.id AS id');
    expect(qstr).toContain('MERGE (c)-[r:CHECKPOINT_INCLUDES');
  });

  it('getEntityTimeline: returns versions, linked changes, and relationships', async () => {
    let call = 0;
    vi.spyOn(db, 'falkordbQuery').mockImplementation(async (query: string, params?: any) => {
      db.queries.push({ query, params });
      switch (call++) {
        case 0:
          return [
            {
              id: 'ver_a_hash',
              hash: 'hash',
              timestamp: '2024-01-01T00:00:00Z',
              path: 'src/a.ts',
              language: 'ts',
              changeSetId: 'change123',
              previousId: null,
            },
          ];
        case 1:
          return [
            {
              versionId: 'ver_a_hash',
              relType: 'MODIFIED_IN',
              metadata: JSON.stringify({ scope: 'unit' }),
              changeId: 'change123',
              change: {
                id: 'change123',
                type: 'change',
                timestamp: '2024-01-01T00:00:00Z',
                changeSetKey: 'change123',
              },
            },
          ];
        case 2:
          return [
            {
              id: 'rel_foo',
              type: 'CALLS',
              fromId: params?.entityId ?? 'a',
              toId: 'b',
              validFrom: '2024-01-01T00:00:00Z',
              validTo: null,
              active: true,
              lastModified: '2024-01-01T01:00:00Z',
              temporal: JSON.stringify({ segments: [], events: [] }),
              segmentId: 'seg_open',
              lastChangeSetId: 'change123',
            },
          ];
        default:
          return [];
      }
    });

    const timeline = await kg.getEntityTimeline('a', { includeRelationships: true, limit: 5 });
    expect(timeline.entityId).toBe('a');
    expect(timeline.versions).toHaveLength(1);
    expect(timeline.versions[0].changes[0]?.changeId).toBe('change123');
    expect(timeline.relationships?.[0]?.relationshipId).toBe('rel_foo');
  });

  it('getRelationshipTimeline: composes segments from temporal metadata', async () => {
    vi.spyOn(db, 'falkordbQuery').mockImplementation(async (query: string, params?: any) => {
      db.queries.push({ query, params });
      if (query.includes('MATCH (a)-[r { id: $id }]->(b)')) {
        return [
          {
            id: params?.id,
            type: 'CALLS',
            fromId: 'a',
            toId: 'b',
            validFrom: '2024-01-01T00:00:00Z',
            validTo: '2024-01-02T00:00:00Z',
            active: false,
            lastModified: '2024-01-02T00:00:00Z',
            temporal: JSON.stringify({
              changeSetId: 'change123',
              segments: [
                {
                  segmentId: 'seg1',
                  openedAt: '2024-01-01T00:00:00Z',
                  closedAt: '2024-01-01T12:00:00Z',
                  changeSetId: 'change111',
                },
              ],
              events: [
                {
                  type: 'closed',
                  at: '2024-01-01T12:00:00Z',
                  changeSetId: 'change111',
                  segmentId: 'seg1',
                },
              ],
            }),
            segmentId: 'seg2',
            lastChangeSetId: 'change123',
          },
        ];
      }
      return [];
    });

    const relTimeline = await kg.getRelationshipTimeline('rel_hash');
    expect(relTimeline).not.toBeNull();
    expect(relTimeline?.active).toBe(false);
    expect(relTimeline?.segments.length).toBeGreaterThan(0);
  });

  it('getChangesForSession: aggregates change provenance details', async () => {
    let call = 0;
    vi.spyOn(db, 'falkordbQuery').mockImplementation(async (query: string, params?: any) => {
      db.queries.push({ query, params });
      switch (call++) {
        case 0:
          return [{ total: 1 }];
        case 1:
          return [
            {
              c: { id: 'change123', type: 'change', timestamp: '2024-01-01T00:00:00Z' },
              timestamp: '2024-01-01T00:00:00Z',
            },
          ];
        case 2:
          return [
            {
              changeId: 'change123',
              relType: 'MODIFIED_IN',
              relId: 'rel_change_entity',
              fromId: 'entityA',
              toId: 'change123',
            },
          ];
        case 3:
          return [
            {
              changeId: 'change123',
              versionId: 'ver_entity_hash',
              entityId: 'entityA',
              relType: 'MODIFIED_IN',
            },
          ];
        default:
          return [];
      }
    });

    const result = await kg.getChangesForSession('session_1', { limit: 5 });
    expect(result.total).toBe(1);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].relationships[0].entityId).toBe('entityA');
    expect(result.changes[0].versions[0].versionId).toBe('ver_entity_hash');
  });

  it('pruneHistory: returns deletion counts', async () => {
    // Customize responses for prune queries
    const original = db.falkordbQuery.bind(db);
    vi.spyOn(db, 'falkordbQuery').mockImplementation(async (query: string, params?: any) => {
      if (query.includes('MATCH (c:checkpoint)')) return [{ count: 3 }];
      if (query.includes('MATCH ()-[r]-()')) return [{ count: 5 }];
      if (query.includes('MATCH (v:version)')) return [{ count: 7 }];
      return original(query, params);
    });

    const res = await kg.pruneHistory(30);
    expect(res).toEqual({ versionsDeleted: 7, edgesClosed: 5, checkpointsDeleted: 3 });
  });

  it('timeTravelTraversal: returns entities and no relationships when none match', async () => {
    // First query returns reachable node ids
    vi.spyOn(db, 'falkordbQuery').mockImplementationOnce(async () => (
      [{ id: 'B' }]
    ))
    // Entities fetch
    .mockImplementationOnce(async (_q: string, params: any) => {
      const ids = params.ids as string[];
      return ids.map((id) => ({ id, type: 'file', path: `/p/${id}`, hash: 'h' + id }));
    })
    // Relationships fetch (empty)
    .mockImplementationOnce(async () => []);

    const { entities, relationships } = await kg.timeTravelTraversal({ startId: 'A', atTime: new Date() });
    const ids = entities.map((e: any) => e.id).sort();
    expect(ids).toEqual(['A', 'B']);
    expect(relationships).toEqual([]);
  });
});

describe('KnowledgeGraphService temporal transactions', () => {
  class CommandMockDB implements Partial<DatabaseService> {
    public log: string[] = [];
    public execResponses: any[] = [];
    private multiCount = 0;
    private execCount = 0;

    async falkordbCommand(...args: any[]): Promise<any> {
      const command = args[0];
      if (command === 'MULTI') {
        this.multiCount += 1;
        this.log.push(`MULTI#${this.multiCount}`);
        return 'OK';
      }
      if (command === 'GRAPH.QUERY') {
        const query = String(args[2] ?? '');
        this.log.push(`GRAPH.QUERY#${query}`);
        if (query.includes('slow')) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return 'QUEUED';
      }
      if (command === 'EXEC') {
        this.execCount += 1;
        this.log.push(`EXEC#${this.execCount}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        const response = this.execResponses.shift();
        return response ?? [{ data: [], headers: [] }];
      }
      if (command === 'DISCARD') {
        this.log.push('DISCARD');
        return 'OK';
      }
      this.log.push(String(command));
      return 'OK';
    }
  }

  it('serializes overlapping runTemporalTransaction calls', async () => {
    const db = new CommandMockDB();
    db.execResponses = [
      [{ data: [{ value: 'tx1' }], headers: ['value'] }],
      [{ data: [{ value: 'tx2' }], headers: ['value'] }],
    ];

    // @ts-expect-error minimal mock shapes
    const kg = new KnowledgeGraphService(db as DatabaseService);
    const tx1Promise = (kg as any).runTemporalTransaction([
      { query: 'RETURN 1 AS tx1', params: {} },
    ]);
    const tx2Promise = (kg as any).runTemporalTransaction([
      { query: 'RETURN 2 AS tx2 slow', params: {} },
    ]);

    const [tx1Result, tx2Result] = await Promise.all([tx1Promise, tx2Promise]);

    expect(tx1Result[0]?.data?.[0]?.value).toBe('tx1');
    expect(tx2Result[0]?.data?.[0]?.value).toBe('tx2');

    const secondMultiIndex = db.log.indexOf('MULTI#2');
    const firstExecIndex = db.log.indexOf('EXEC#1');
    expect(secondMultiIndex).toBeGreaterThan(firstExecIndex);
    expect(db.log.filter((entry) => entry.startsWith('MULTI'))).toEqual([
      'MULTI#1',
      'MULTI#2',
    ]);
    expect(db.log.filter((entry) => entry.startsWith('EXEC'))).toEqual([
      'EXEC#1',
      'EXEC#2',
    ]);
  });
});

describe('APIGateway history schedulers', () => {
  it('starts and registers prune/checkpoint intervals when enabled', async () => {
    process.env.HISTORY_ENABLED = 'true';
    process.env.HISTORY_RETENTION_DAYS = '30';
    process.env.HISTORY_CHECKPOINT_HOPS = '2';
    process.env.HISTORY_PRUNE_INTERVAL_HOURS = '24';
    process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS = '24';

    const db = new MockDB();
    // @ts-expect-error partial mock is sufficient
    const kg = new KnowledgeGraphService(db as DatabaseService);
    // Provide a minimal dbService for APIGateway constructor that exposes getConfig
    const minimalDb: any = {
      getConfig: () => ({
        falkordb: { url: 'redis://localhost:0' },
        qdrant: { url: 'http://localhost:0' },
        postgresql: { connectionString: 'postgres://localhost/db' },
      }),
    };
    // Avoid doing heavy route/plugin work by constructing APIGateway and calling private method directly
    // @ts-expect-error minimal constructor params; other services are created internally
    const gw = new APIGateway(kg, minimalDb);

    // Access private method via any for unit test
    // Should not throw and should set intervals
    await (gw as any).startHistorySchedulers();
    const intervals = (gw as any)._historyIntervals;
    expect(intervals.prune).toBeDefined();
    expect(intervals.checkpoint).toBeDefined();

    // Cleanup timers to avoid leaking handles
    if (intervals.prune) clearInterval(intervals.prune);
    if (intervals.checkpoint) clearInterval(intervals.checkpoint);
  });
});
