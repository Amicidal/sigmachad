/**
 * Additional integration tests for Tests API endpoints
 * Covers parse-results and flaky-analysis endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('Tests API Additional Endpoints', () => {
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

  it('POST /api/v1/tests/parse-results parses a small JUnit file', async () => {
    const tmpPath = join(process.cwd(), 'logs', `junit-sample-${Date.now()}.xml`);
    const junit = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="SampleSuite" tests="2" failures="1" errors="0" skipped="0" time="0.02">
  <testcase classname="a.b" name="passes" time="0.01"/>
  <testcase classname="a.b" name="fails" time="0.01"><failure message="oops"/></testcase>
</testsuite>`;
    await fs.writeFile(tmpPath, junit, 'utf-8');

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tests/parse-results',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ filePath: tmpPath, format: 'junit' }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: true }));
  });

  it('GET /api/v1/tests/flaky-analysis/:entityId returns 404 when no analysis', async () => {
    const entityId = 'non-existent-entity-for-flaky-analysis';
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tests/flaky-analysis/${entityId}`,
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload);
    expect(body).toEqual(expect.objectContaining({ success: false }));
    expect(body.error?.code).toBe('ANALYSIS_NOT_FOUND');
  });
});

