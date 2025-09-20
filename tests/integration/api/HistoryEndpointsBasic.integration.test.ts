/**
 * Basic integration tests for History and Time-Travel endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';
import { RelationshipType } from '../../../src/models/relationships.js';

describe('History API (basic)', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) throw new Error('Database health check failed');
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();
    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) await apiGateway.stop();
    if (dbService && dbService.isInitialized()) await cleanupTestDatabase(dbService);
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) await clearTestData(dbService);
  });

  it('POST /api/v1/history/checkpoints returns a checkpoint id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/history/checkpoints',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ seedEntities: [], reason: 'manual', hops: 1 }),
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    expect(typeof body.data.checkpointId).toBe('string');
  });

  it('POST /api/v1/graph/time-travel returns structure even for unknown id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/graph/time-travel',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ startId: 'unknown-entity', maxDepth: 1 }),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true }));
    expect(Array.isArray(body.data?.entities)).toBe(true);
    expect(Array.isArray(body.data?.relationships)).toBe(true);
  });

  it('returns ordered timelines with provenance and relationship segments', async () => {
    const entityA = {
      id: 'file:src/history/entityA.ts',
      type: 'file',
      path: 'src/history/entityA.ts',
      language: 'typescript',
      hash: 'hash_v1',
      lastModified: new Date('2024-01-01T00:00:00Z'),
      created: new Date('2024-01-01T00:00:00Z'),
      size: 10,
      lines: 5,
      isTest: false,
      isConfig: false,
      dependencies: [],
    } as const;
    const entityB = {
      id: 'file:src/history/entityB.ts',
      type: 'file',
      path: 'src/history/entityB.ts',
      language: 'typescript',
      hash: 'hash_target',
      lastModified: new Date('2024-01-01T00:00:00Z'),
      created: new Date('2024-01-01T00:00:00Z'),
      size: 4,
      lines: 3,
      isTest: false,
      isConfig: false,
      dependencies: [],
    } as const;

    await kgService.createEntity({ ...entityA }, { skipEmbedding: true });
    await kgService.createEntity({ ...entityB }, { skipEmbedding: true });

    const v1 = await kgService.appendVersion({ ...entityA }, {
      changeSetId: 'change_v1',
      timestamp: new Date('2024-01-01T00:10:00Z'),
    });
    const v2 = await kgService.appendVersion({ ...entityA, hash: 'hash_v2' }, {
      changeSetId: 'change_v2',
      timestamp: new Date('2024-01-02T09:30:00Z'),
    });

    await kgService.openEdge(
      entityA.id,
      entityB.id,
      RelationshipType.CALLS,
      new Date('2024-01-02T09:35:00Z'),
      'change_v2'
    );
    await kgService.closeEdge(
      entityA.id,
      entityB.id,
      RelationshipType.CALLS,
      new Date('2024-01-03T12:00:00Z'),
      'change_close'
    );

    const timelineRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/entities/${encodeURIComponent(entityA.id)}/timeline?includeRelationships=true&limit=5`,
    });
    expect(timelineRes.statusCode).toBe(200);
    const timelineBody = JSON.parse(timelineRes.payload);
    expect(timelineBody.success).toBe(true);
    expect(timelineBody.data.entityId).toBe(entityA.id);
    expect(timelineBody.data.versions).toHaveLength(2);
    expect(timelineBody.data.versions[0].changeSetId).toBe('change_v2');
    expect(timelineBody.data.versions[0].previousVersionId).toBe(v1);
    expect(timelineBody.data.versions[0].changes.length).toBeGreaterThan(0);
    expect(Array.isArray(timelineBody.data.relationships)).toBe(true);
    expect(timelineBody.data.relationships[0]?.segments?.length).toBeGreaterThan(0);

    const relationshipId = timelineBody.data.relationships[0]?.relationshipId;
    expect(typeof relationshipId).toBe('string');

    const relationshipRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/relationships/${encodeURIComponent(relationshipId)}/timeline`,
    });
    expect(relationshipRes.statusCode).toBe(200);
    const relationshipBody = JSON.parse(relationshipRes.payload);
    expect(relationshipBody.success).toBe(true);
    expect(relationshipBody.data.active).toBe(false);
    expect(relationshipBody.data.segments.length).toBeGreaterThan(0);
    expect(relationshipBody.data.segments[0].changeSetId).toBe('change_close');
  });
});
