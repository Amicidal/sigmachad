/**
 * Additional integration tests for Security API endpoints
 * Covers audit, compliance, and monitor endpoints that were undocumented in tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '@memento/api/APIGateway';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/database/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('Security API Additional Endpoints', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) throw new Error('Database health check failed');
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
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

  it('POST /api/v1/security/audit executes a security audit', async () => {
    const payload = { scope: 'full', includeDevDependencies: false, includeTransitive: true };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/security/audit',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(payload),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
  });

  it('GET /api/v1/security/compliance returns compliance status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/security/compliance?framework=owasp&scope=full',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
  });

  it('POST /api/v1/security/monitor sets up monitoring configuration', async () => {
    const payload = {
      alerts: [
        { type: 'vuln.new', severity: 'high', threshold: 1, channels: ['console'] },
      ],
      schedule: 'daily',
    };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/security/monitor',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(payload),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    expect(body.data.status).toBe('active');
  });
});

