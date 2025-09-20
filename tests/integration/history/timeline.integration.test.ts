import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { registerHistoryRoutes } from '../../../src/api/routes/history.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { RelationshipType, type GraphRelationship } from '../../../src/models/relationships.js';
import type { DatabaseService } from '../../../src/services/DatabaseService.js';
import type { Entity } from '../../../src/models/entities.js';
import {
  cleanupTestDatabase,
  clearTestData,
  setupTestDatabase,
} from '../../test-utils/database-helpers.js';
import { canonicalRelationshipId } from '../../../src/utils/codeEdges.js';

const asDate = (iso: string): Date => new Date(iso);

const createFileEntity = (id: string, path: string, hash: string): Entity => ({
  id,
  type: 'file',
  name: path.split('/').pop() ?? path,
  path,
  hash,
  language: 'typescript',
  lastModified: new Date(),
  created: new Date(),
  size: 128,
  lines: 12,
  isTest: false,
  isConfig: false,
  dependencies: [],
});

describe('History routes (integration)', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let app: ReturnType<typeof Fastify> | undefined;
  let skipSuite = false;

  beforeAll(async () => {
    process.env.HISTORY_ENABLED = 'true';
    try {
      dbService = await setupTestDatabase({ silent: true });
    } catch (error) {
      skipSuite = true;
      console.warn('⚠️ history integration tests skipped: database unavailable');
      console.warn(error);
    }
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close().catch(() => {});
      app = undefined;
    }
    if (!skipSuite && dbService) {
      await cleanupTestDatabase(dbService);
    }
  });

  beforeEach(async () => {
    if (skipSuite) return;
    await clearTestData(dbService, { silent: true });
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    app = Fastify();
    await registerHistoryRoutes(app, kgService, dbService);
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  const seedTimelineFixtures = async () => {
    const primary = createFileEntity(
      'file:src/history/component.ts',
      'src/history/component.ts',
      'hash-initial'
    );
    const dependency = createFileEntity(
      'file:src/history/dependency.ts',
      'src/history/dependency.ts',
      'hash-dep'
    );

    await kgService.createEntity(primary, { skipEmbedding: true });
    await kgService.createEntity(dependency, { skipEmbedding: true });

    await kgService.appendVersion({ ...primary, hash: 'hash-v1' }, {
      changeSetId: 'change-1',
      timestamp: asDate('2024-01-01T00:00:00Z'),
    });
    await kgService.appendVersion({ ...primary, hash: 'hash-v2' }, {
      changeSetId: 'change-2',
      timestamp: asDate('2024-01-03T00:00:00Z'),
    });
    await kgService.appendVersion({ ...primary, hash: 'hash-v3' }, {
      changeSetId: 'change-3',
      timestamp: asDate('2024-01-05T00:00:00Z'),
    });

    await kgService.openEdge(
      primary.id,
      dependency.id,
      RelationshipType.CALLS,
      asDate('2024-01-02T00:00:00Z'),
      'edge-change-1'
    );
    await kgService.closeEdge(
      primary.id,
      dependency.id,
      RelationshipType.CALLS,
      asDate('2024-01-04T00:00:00Z'),
      'edge-change-2'
    );
    await kgService.openEdge(
      primary.id,
      dependency.id,
      RelationshipType.CALLS,
      asDate('2024-01-06T00:00:00Z'),
      'edge-change-3'
    );

    const relationshipId = canonicalRelationshipId(primary.id, {
      fromEntityId: primary.id,
      toEntityId: dependency.id,
      type: RelationshipType.CALLS,
    } as GraphRelationship);

    return { primary, dependency, relationshipId };
  };

  it('returns entity timelines with pagination and temporal filters', async () => {
    if (skipSuite) {
      console.warn('⏭️ history timeline tests skipped: database unavailable');
      expect(skipSuite).toBe(true);
      return;
    }

    const { primary } = await seedTimelineFixtures();

    const encodedId = encodeURIComponent(primary.id);

    const baseResponse = await app!.inject({
      method: 'GET',
      url: `/history/entities/${encodedId}/timeline?limit=2&includeRelationships=true`,
    });
    expect(baseResponse.statusCode).toBe(200);
    const basePayload = baseResponse.json() as any;
    expect(basePayload.success).toBe(true);
    const baseVersions = basePayload.data.versions as any[];
    expect(Array.isArray(baseVersions)).toBe(true);
    expect(baseVersions).toHaveLength(2);
    const [latest, previous] = baseVersions;
    expect(new Date(latest.timestamp).toISOString()).toBe('2024-01-05T00:00:00.000Z');
    expect(new Date(previous.timestamp).toISOString()).toBe('2024-01-03T00:00:00.000Z');
    expect(basePayload.data.relationships?.length).toBeGreaterThan(0);

    const pagedResponse = await app!.inject({
      method: 'GET',
      url: `/history/entities/${encodedId}/timeline?limit=1&offset=1`,
    });
    expect(pagedResponse.statusCode).toBe(200);
    const pagedPayload = pagedResponse.json() as any;
    expect(pagedPayload.success).toBe(true);
    expect(pagedPayload.data.versions).toHaveLength(1);
    expect(new Date(pagedPayload.data.versions[0].timestamp).toISOString()).toBe(
      '2024-01-03T00:00:00.000Z'
    );

    const filteredResponse = await app!.inject({
      method: 'GET',
      url: `/history/entities/${encodedId}/timeline?since=2024-01-03T00:00:00.000Z&until=2024-01-04T00:00:00.000Z`,
    });
    expect(filteredResponse.statusCode).toBe(200);
    const filteredPayload = filteredResponse.json() as any;
    expect(filteredPayload.success).toBe(true);
    expect(filteredPayload.data.versions).toHaveLength(1);
    expect(new Date(filteredPayload.data.versions[0].timestamp).toISOString()).toBe(
      '2024-01-03T00:00:00.000Z'
    );
  });

  it('returns relationship timeline segments for temporal edges', async () => {
    if (skipSuite) {
      console.warn('⏭️ history timeline tests skipped: database unavailable');
      expect(skipSuite).toBe(true);
      return;
    }

    const { primary, dependency, relationshipId } = await seedTimelineFixtures();

    const encodedRelId = encodeURIComponent(relationshipId);

    const response = await app!.inject({
      method: 'GET',
      url: `/history/relationships/${encodedRelId}/timeline`,
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json() as any;
    expect(payload.success).toBe(true);
    const data = payload.data;
    expect(data.relationshipId).toBe(relationshipId);
    expect(data.fromEntityId).toBe(primary.id);
    expect(data.toEntityId).toBe(dependency.id);
    expect(Array.isArray(data.segments)).toBe(true);
    expect(data.segments.length).toBeGreaterThanOrEqual(1);
    // ensure we captured a closed segment and the currently open segment metadata
    const closed = data.segments.find((segment: any) => segment.closedAt != null);
    expect(closed).toBeTruthy();
    expect(data.current).toBeTruthy();
  });
});
