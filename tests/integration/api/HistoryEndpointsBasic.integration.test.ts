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
});

