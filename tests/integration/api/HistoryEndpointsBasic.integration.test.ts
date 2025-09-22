/**
 * Basic integration tests for History and Time-Travel endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/core/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';
import { RelationshipType, type GraphRelationship } from '../../../src/models/relationships.js';

describe('History API (basic)', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) throw new Error('Database health check failed');
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
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

  it('exposes session timeline, impacts, and entity aggregations with filters', async () => {
    const sessionId = 'session:test-session-123';
    const sessionEntity = {
      id: sessionId,
      type: 'session' as const,
      startTime: new Date('2024-01-02T09:00:00Z'),
      endTime: new Date('2024-01-02T11:00:00Z'),
      agentType: 'cli',
      userId: 'tester',
      changes: [],
      specs: [],
      status: 'completed' as const,
      metadata: {},
    };

    const entityModified = {
      id: 'file:src/sessions/modified.ts',
      type: 'file' as const,
      path: 'src/sessions/modified.ts',
      language: 'typescript',
      hash: 'hash_mod',
      lastModified: new Date('2024-01-02T09:30:00Z'),
      created: new Date('2024-01-01T08:00:00Z'),
      size: 20,
      lines: 12,
      isTest: false,
      isConfig: false,
      dependencies: [],
    };

    const entityImpacted = {
      id: 'file:src/sessions/impacted.ts',
      type: 'file' as const,
      path: 'src/sessions/impacted.ts',
      language: 'typescript',
      hash: 'hash_imp',
      lastModified: new Date('2024-01-02T09:40:00Z'),
      created: new Date('2024-01-01T08:05:00Z'),
      size: 18,
      lines: 10,
      isTest: false,
      isConfig: false,
      dependencies: [],
    };

    await kgService.createEntity(sessionEntity, { skipEmbedding: true });
    await kgService.createEntity(entityModified, { skipEmbedding: true });
    await kgService.createEntity(entityImpacted, { skipEmbedding: true });

    const baseTime = new Date('2024-01-02T10:00:00Z');

    const relationships: GraphRelationship[] = [
      {
        id: 'rel-temp-session-modified',
        fromEntityId: sessionEntity.id,
        toEntityId: entityModified.id,
        type: RelationshipType.SESSION_MODIFIED,
        created: baseTime,
        lastModified: baseTime,
        version: 1,
        sessionId,
        timestamp: baseTime,
        sequenceNumber: 1,
        actor: 'agent-1',
        impactSeverity: 'high',
        stateTransitionTo: 'broken',
        changeInfo: {
          elementType: 'function',
          elementName: 'applyUpdate',
          operation: 'modified',
        },
        stateTransition: {
          from: 'working',
          to: 'broken',
          verifiedBy: 'test',
          confidence: 0.8,
        },
        impact: { severity: 'high' },
        metadata: {},
      },
      {
        id: 'rel-temp-session-impacted',
        fromEntityId: sessionEntity.id,
        toEntityId: entityImpacted.id,
        type: RelationshipType.SESSION_IMPACTED,
        created: new Date(baseTime.getTime() + 60_000),
        lastModified: new Date(baseTime.getTime() + 60_000),
        version: 1,
        sessionId,
        timestamp: new Date(baseTime.getTime() + 60_000),
        sequenceNumber: 2,
        actor: 'agent-1',
        impactSeverity: 'low',
        stateTransitionTo: 'working',
        stateTransition: {
          from: 'broken',
          to: 'working',
          verifiedBy: 'test',
          confidence: 0.9,
        },
        impact: {
          severity: 'low',
          testsFailed: ['tests/unit/sample.test.ts'],
        },
        metadata: {},
      },
    ];

    for (const rel of relationships) {
      await kgService.createRelationship(rel);
    }

    const timelineSeverityRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/sessions/${encodeURIComponent(sessionEntity.id)}/timeline?impactSeverity=high&limit=10`,
    });
    expect(timelineSeverityRes.statusCode).toBe(200);
    const timelineSeverityBody = JSON.parse(timelineSeverityRes.payload);
    expect(timelineSeverityBody.success).toBe(true);
    expect(timelineSeverityBody.data.events).toHaveLength(1);
    expect(timelineSeverityBody.data.events[0].impactSeverity).toBe('high');
    expect(timelineSeverityBody.data.events[0].stateTransitionTo).toBe('broken');

    const timelineStateRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/sessions/${encodeURIComponent(sessionEntity.id)}/timeline?stateTransitionTo=working`,
    });
    expect(timelineStateRes.statusCode).toBe(200);
    const timelineStateBody = JSON.parse(timelineStateRes.payload);
    expect(timelineStateBody.success).toBe(true);
    expect(timelineStateBody.data.events).toHaveLength(1);
    expect(timelineStateBody.data.events[0].stateTransitionTo).toBe('working');
    expect(timelineStateBody.data.events[0].impactSeverity).toBe('low');

    const impactsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/sessions/${encodeURIComponent(sessionEntity.id)}/impacts?impactSeverity=low`,
    });
    expect(impactsRes.statusCode).toBe(200);
    const impactsBody = JSON.parse(impactsRes.payload);
    expect(impactsBody.success).toBe(true);
    expect(impactsBody.data.impacts).toHaveLength(1);
    expect(impactsBody.data.impacts[0].latestSeverity).toBe('low');
    expect(impactsBody.data.impacts[0].relationshipIds.length).toBeGreaterThan(0);

    const entitySessionsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/history/entities/${encodeURIComponent(entityImpacted.id)}/sessions?impactSeverity=low`,
    });
    expect(entitySessionsRes.statusCode).toBe(200);
    const entitySessionsBody = JSON.parse(entitySessionsRes.payload);
    expect(entitySessionsBody.success).toBe(true);
    expect(entitySessionsBody.data.sessions).toHaveLength(1);
    expect(entitySessionsBody.data.sessions[0].severities.low).toBe(1);
    expect(entitySessionsBody.data.sessions[0].actors).toContain('agent-1');
  });
});
