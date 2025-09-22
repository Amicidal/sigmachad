import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { registerHistoryRoutes } from '../../../src/api/routes/history.js';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { RelationshipType, type GraphRelationship } from '../../../src/models/relationships.js';
import type { DatabaseService } from '../../../src/services/core/DatabaseService.js';
import type { Entity, Session } from '../../../src/models/entities.js';
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

const createSessionEntity = (id: string, start: Date, agentType = 'human'): Session => ({
  id,
  type: 'session',
  startTime: start,
  endTime: new Date(start.getTime() + 5 * 60 * 1000),
  agentType,
  changes: [],
  specs: [],
  status: 'completed',
  metadata: { source: 'integration-test' },
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

  const seedSessionFixtures = async () => {
    const sessionOne = createSessionEntity(
      'session:history-demo-1',
      new Date('2024-02-01T10:00:00Z'),
      'analyst'
    );
    const sessionTwo = createSessionEntity(
      'session:history-demo-2',
      new Date('2024-02-02T08:00:00Z'),
      'automation'
    );

    await kgService.createEntity(sessionOne as any, { skipEmbedding: true });
    await kgService.createEntity(sessionTwo as any, { skipEmbedding: true });

    const primary = createFileEntity(
      'file:src/session/primary.ts',
      'src/session/primary.ts',
      'session-primary'
    );
    const secondary = createFileEntity(
      'file:src/session/secondary.ts',
      'src/session/secondary.ts',
      'session-secondary'
    );

    await kgService.createEntity(primary, { skipEmbedding: true });
    await kgService.createEntity(secondary, { skipEmbedding: true });

    const eventBase = new Date('2024-02-01T10:05:00Z');
    await kgService.createRelationship(
      {
        id: `rel_${sessionOne.id}_${primary.id}_SESSION_MODIFIED`,
        fromEntityId: sessionOne.id,
        toEntityId: primary.id,
        type: RelationshipType.SESSION_MODIFIED,
        created: eventBase,
        lastModified: eventBase,
        version: 1,
        sessionId: sessionOne.id,
        sequenceNumber: 0,
        actor: 'analyst@example.com',
        changeInfo: {
          elementType: 'function',
          elementName: 'processSession',
          operation: 'modified',
          semanticHash: 'hash-update',
          affectedLines: 12,
        },
        stateTransition: {
          from: 'broken',
          to: 'working',
          verifiedBy: 'manual',
          confidence: 0.9,
        },
      } as any,
      undefined,
      undefined,
      { validate: false }
    );

    await kgService.createRelationship(
      {
        id: `rel_${sessionOne.id}_${primary.id}_SESSION_IMPACTED_high`,
        fromEntityId: sessionOne.id,
        toEntityId: primary.id,
        type: RelationshipType.SESSION_IMPACTED,
        created: new Date('2024-02-01T10:10:00Z'),
        lastModified: new Date('2024-02-01T10:10:00Z'),
        version: 1,
        sessionId: sessionOne.id,
        timestamp: new Date('2024-02-01T10:10:00Z'),
        sequenceNumber: 1,
        actor: 'analyst@example.com',
        impactSeverity: 'high',
        impact: {
          severity: 'high',
          testsFailed: ['tests/session-impact.spec.ts'],
        },
      } as any,
      undefined,
      undefined,
      { validate: false }
    );

    await kgService.createRelationship(
      {
        id: `rel_${sessionOne.id}_${secondary.id}_SESSION_IMPACTED_low`,
        fromEntityId: sessionOne.id,
        toEntityId: secondary.id,
        type: RelationshipType.SESSION_IMPACTED,
        created: new Date('2024-02-01T10:18:00Z'),
        lastModified: new Date('2024-02-01T10:18:00Z'),
        version: 1,
        sessionId: sessionOne.id,
        timestamp: new Date('2024-02-01T10:18:00Z'),
        sequenceNumber: 2,
        actor: 'bot@example.com',
        impactSeverity: 'low',
        impact: {
          severity: 'low',
          testsFixed: ['tests/session-impact.spec.ts'],
        },
      } as any,
      undefined,
      undefined,
      { validate: false }
    );

    await kgService.createRelationship(
      {
        id: `rel_${sessionOne.id}_${primary.id}_SESSION_IMPACTED_medium`,
        fromEntityId: sessionOne.id,
        toEntityId: primary.id,
        type: RelationshipType.SESSION_IMPACTED,
        created: new Date('2024-02-01T10:24:00Z'),
        lastModified: new Date('2024-02-01T10:24:00Z'),
        version: 1,
        sessionId: sessionOne.id,
        timestamp: new Date('2024-02-01T10:24:00Z'),
        sequenceNumber: 3,
        actor: 'bot@example.com',
        impactSeverity: 'medium',
        impact: {
          severity: 'medium',
          testsFailed: ['tests/slow.spec.ts'],
        },
      } as any,
      undefined,
      undefined,
      { validate: false }
    );

    await kgService.createRelationship(
      {
        id: `rel_${sessionTwo.id}_${primary.id}_SESSION_IMPACTED_medium`,
        fromEntityId: sessionTwo.id,
        toEntityId: primary.id,
        type: RelationshipType.SESSION_IMPACTED,
        created: new Date('2024-02-02T08:05:00Z'),
        lastModified: new Date('2024-02-02T08:05:00Z'),
        version: 1,
        sessionId: sessionTwo.id,
        timestamp: new Date('2024-02-02T08:05:00Z'),
        sequenceNumber: 1,
        actor: 'automation@example.com',
        impactSeverity: 'medium',
        impact: {
          severity: 'medium',
          testsFailed: ['tests/automation.spec.ts'],
        },
      } as any,
      undefined,
      undefined,
      { validate: false }
    );

    return {
      sessionOneId: sessionOne.id,
      sessionTwoId: sessionTwo.id,
      primaryId: primary.id,
      secondaryId: secondary.id,
    };
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

  describe('session history endpoints', () => {
    it('returns session timelines with summaries and ordering', async () => {
      if (skipSuite) {
        console.warn('⏭️ session timeline tests skipped: database unavailable');
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId } = await seedSessionFixtures();

      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(sessionOneId)}/timeline?order=asc`,
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      const timeline = payload.data;
      expect(timeline.events).toHaveLength(4);
      const [firstEvent, secondEvent] = timeline.events;
      expect(firstEvent.type).toBe(RelationshipType.SESSION_MODIFIED);
      expect(firstEvent.actor).toBe('analyst@example.com');
      expect(new Date(firstEvent.timestamp).toISOString()).toBe(
        '2024-02-01T10:05:00.000Z'
      );
      expect(secondEvent.impactSeverity).toBe('high');
      expect(timeline.summary.totalEvents).toBe(4);
      expect(timeline.summary.byType.SESSION_IMPACTED).toBe(3);
      expect(timeline.summary.bySeverity.high).toBe(1);
      expect(timeline.summary.bySeverity.medium).toBe(1);
      expect(timeline.summary.bySeverity.low).toBe(1);
      const actorSummary = timeline.summary.actors.find(
        (entry: any) => entry.actor === 'analyst@example.com'
      );
      expect(actorSummary?.count).toBeGreaterThan(0);
    });

    it('supports filtering session timelines by severity and sequence range', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(
          sessionOneId
        )}/timeline?impactSeverity=medium&sequenceNumberMin=3`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.events).toHaveLength(1);
      const [onlyEvent] = payload.data.events as any[];
      expect(onlyEvent.sequenceNumber).toBe(3);
      expect(onlyEvent.impactSeverity).toBe('medium');
    });

    it('supports filtering session timelines with sequenceNumberRange objects', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(
          sessionOneId
        )}/timeline?order=asc&sequenceNumberRange%5Bfrom%5D=1&sequenceNumberRange%5Bto%5D=2`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      const events = payload.data.events as any[];
      expect(events).toHaveLength(2);
      expect(events.map((event) => event.sequenceNumber)).toEqual([1, 2]);
    });

    it('filters session timelines by timestamp window and actor', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(
          sessionOneId
        )}/timeline?timestampFrom=2024-02-01T10:15:00Z&timestampTo=2024-02-01T10:25:00Z&actor=bot@example.com`,
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.events).toHaveLength(2);
      for (const event of payload.data.events as any[]) {
        expect(event.actor).toBe('bot@example.com');
        const ts = new Date(event.timestamp).toISOString();
        expect(ts >= '2024-02-01T10:15:00.000Z').toBe(true);
        expect(ts <= '2024-02-01T10:25:00.000Z').toBe(true);
      }
    });

    it('supports timestampRange objects when filtering session timelines', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(
          sessionOneId
        )}/timeline?timestampRange%5Bfrom%5D=2024-02-01T10:15:00Z&timestampRange%5Bto%5D=2024-02-01T10:25:00Z`,
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      const events = payload.data.events as any[];
      expect(events).toHaveLength(2);
      for (const event of events) {
        const ts = new Date(event.timestamp).toISOString();
        expect(ts >= '2024-02-01T10:15:00.000Z').toBe(true);
        expect(ts <= '2024-02-01T10:25:00.000Z').toBe(true);
      }
    });

    it('filters entity session listings by state-transition target', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { primaryId, sessionOneId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/entities/${encodeURIComponent(
          primaryId
        )}/sessions?stateTransitionTo=working`,
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.totalSessions).toBe(1);
      expect(payload.data.sessions).toHaveLength(1);
      expect(payload.data.sessions[0].sessionId).toBe(sessionOneId);
      expect(payload.data.sessions[0].relationshipIds.length).toBeGreaterThan(0);
    });

    it('aggregates impacted entities for a session', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId, primaryId, secondaryId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(sessionOneId)}/impacts`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.totalEntities).toBe(2);
      const impacts = payload.data.impacts as any[];
      const primaryImpact = impacts.find((entry) => entry.entityId === primaryId);
      expect(primaryImpact).toBeTruthy();
      expect(primaryImpact.latestSeverity).toBe('medium');
      expect(primaryImpact.actors).toContain('bot@example.com');
      expect(primaryImpact.impactCount).toBe(2);
      const secondaryImpact = impacts.find(
        (entry) => entry.entityId === secondaryId
      );
      expect(secondaryImpact.latestSeverity).toBe('low');
      expect(payload.data.summary.bySeverity.medium).toBeGreaterThan(0);
    });

    it('filters session impacts by sequenceNumberRange object', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { sessionOneId, primaryId, secondaryId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/sessions/${encodeURIComponent(
          sessionOneId
        )}/impacts?sequenceNumberRange%5Bfrom%5D=2&sequenceNumberRange%5Bto%5D=3`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      const entities = payload.data.impacts as any[];
      const ids = entities.map((entry) => entry.entityId).sort();
      expect(ids).toEqual([primaryId, secondaryId].sort());
      for (const impact of entities) {
        expect(impact.relationshipIds.every((id: string) => id)).toBe(true);
        expect(impact.relationshipIds.length).toBeGreaterThan(0);
      }
    });

    it('lists sessions affecting an entity with severity breakdowns', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { primaryId, sessionOneId, sessionTwoId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/entities/${encodeURIComponent(primaryId)}/sessions`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.totalSessions).toBe(2);
      const sessions = payload.data.sessions as any[];
      const first = sessions.find((entry) => entry.sessionId === sessionOneId);
      const second = sessions.find((entry) => entry.sessionId === sessionTwoId);
      expect(first.severities.high).toBe(1);
      expect(first.severities.medium).toBe(1);
      expect(second.severities.medium).toBe(1);
      expect(payload.data.summary.totalRelationships).toBeGreaterThan(0);
    });

    it('filters sessions affecting an entity by sequenceNumberRange and timestampRange', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { primaryId, sessionOneId, sessionTwoId } = await seedSessionFixtures();
      const response = await app!.inject({
        method: 'GET',
        url: `/history/entities/${encodeURIComponent(
          primaryId
        )}/sessions?sequenceNumberRange%5Bfrom%5D=3&timestampRange%5Bfrom%5D=2024-02-01T10:20:00Z`,
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      const sessions = payload.data.sessions as any[];
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe(sessionOneId);
      const sessionIds = sessions.map((entry) => entry.sessionId);
      expect(sessionIds).not.toContain(sessionTwoId);
    });

    it('excludes non-session nodes from sessions affecting an entity', async () => {
      if (skipSuite) {
        expect(skipSuite).toBe(true);
        return;
      }

      const { primaryId, sessionOneId, sessionTwoId } = await seedSessionFixtures();

      const rogue = createFileEntity(
        'file:rogue/session-false-positive.ts',
        'src/rogue/session-false-positive.ts',
        'hash-rogue'
      );
      await kgService.createEntity(rogue, { skipEmbedding: true });

      await kgService.createRelationship(
        {
          id: `rel_${rogue.id}_${primaryId}_SESSION_IMPACTED_rogue`,
          fromEntityId: rogue.id,
          toEntityId: primaryId,
          type: RelationshipType.SESSION_IMPACTED,
          created: new Date('2024-02-03T09:00:00Z'),
          lastModified: new Date('2024-02-03T09:00:00Z'),
          version: 1,
          sessionId: 'session:rogue-agent',
          sequenceNumber: 4,
          timestamp: new Date('2024-02-03T09:00:00Z'),
          actor: 'rogue@example.com',
          impactSeverity: 'critical',
          impact: { severity: 'high' },
        } as any,
        undefined,
        undefined,
        { validate: false }
      );

      const response = await app!.inject({
        method: 'GET',
        url: `/history/entities/${encodeURIComponent(primaryId)}/sessions`,
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as any;
      expect(payload.success).toBe(true);
      expect(payload.data.totalSessions).toBe(2);
      const sessionIds = (payload.data.sessions as any[]).map(
        (entry) => entry.sessionId
      );
      expect(sessionIds).toContain(sessionOneId);
      expect(sessionIds).toContain(sessionTwoId);
      expect(sessionIds).not.toContain(rogue.id);
    });
  });
});
