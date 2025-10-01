/**
 * Integration tests for Docs routes with Fastify
 * Focus on schema validation (400 on missing/invalid input)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '@memento/api/APIGateway';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/database/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('Docs Routes Integration (schema)', () => {
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

  it('POST /api/v1/docs/sync should 400 without docsPath', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/docs/sync',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({})
    });
    expect(response.statusCode).toBe(400);
  });

  it('POST /api/v1/docs/parse should 400 without content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/docs/parse',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ format: 'markdown' })
    });
    expect(response.statusCode).toBe(400);
  });

  it('GET /api/v1/docs/search should 400 without query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/docs/search',
    });
    expect(response.statusCode).toBe(400);
  });

  it('POST /api/v1/docs/validate should 400 without files', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/docs/validate',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({})
    });
    expect(response.statusCode).toBe(400);
  });
});

