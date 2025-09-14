import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { APIGateway } from '../../../src/api/APIGateway';
import type { DatabaseService } from '../../../src/services/DatabaseService';
import type { Entity } from '../../../src/models/entities';
import { RelationshipType } from '../../../src/models/relationships';

class MockDB implements Partial<DatabaseService> {
  public calls: Array<{ q: string; params: any }>[] = [] as any;
  public queries: Array<{ query: string; params: any }> = [];

  // Minimal falkordbQuery mock with conditional responses
  async falkordbQuery(query: string, params: Record<string, any> = {}): Promise<any[]> {
    this.queries.push({ query, params });

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

  beforeEach(() => {
    db = new MockDB();
    // @ts-expect-error partial mock is sufficient for these unit tests
    kg = new KnowledgeGraphService(db as DatabaseService);
    process.env.HISTORY_ENABLED = 'true';
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
    // Two queries: create version+OF, then previous lookup
    expect(db.queries.length).toBeGreaterThanOrEqual(2);
    expect(db.queries[0].query).toContain('MERGE (v:version');
    expect(db.queries[0].query).toContain('MERGE (v)-[of:OF');
  });

  it('openEdge: merges edge with validFrom and resets validTo', async () => {
    await kg.openEdge('a', 'b', RelationshipType.CALLS, new Date('2024-01-01T00:00:00Z'));
    expect(db.queries.length).toBe(1);
    expect(db.queries[0].query).toContain('MERGE (a)-[r:CALLS { id: $id }]->(b)');
    expect(db.queries[0].query).toContain('validFrom');
  });

  it('closeEdge: sets validTo on existing relationship', async () => {
    await kg.closeEdge('a', 'b', RelationshipType.IMPORTS, new Date('2024-01-02T00:00:00Z'));
    expect(db.queries.length).toBe(1);
    expect(db.queries[0].query).toContain('SET r.validTo = coalesce(r.validTo, $at)');
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
