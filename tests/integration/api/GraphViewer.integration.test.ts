/**
 * Integration tests for Graph Viewer helper endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/core/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('Graph Viewer Endpoints', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();
    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) await apiGateway.stop();
    if (dbService && dbService.isInitialized()) await cleanupTestDatabase(dbService);
  }, 10000);

  it('GET /api/v1/graph/subgraph returns nodes/edges structure', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/graph/subgraph?limit=5'
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toEqual(expect.objectContaining({ success: true }));
    expect(body.data).toEqual(expect.objectContaining({
      nodes: expect.any(Array),
      edges: expect.any(Array)
    }));
  });

  it('GET /api/v1/graph/neighbors without id should 400', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/graph/neighbors' });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('INVALID_ID');
  });
});

