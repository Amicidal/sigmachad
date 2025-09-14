/**
 * Integration tests for Admin Restore endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('Admin Restore Endpoint', () => {
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

    kgService = new KnowledgeGraphService(dbService);
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();
    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) await apiGateway.stop();
    if (dbService && dbService.isInitialized()) await cleanupTestDatabase(dbService);
  }, 10000);

  it('route exists at POST /api/v1/admin/restore', () => {
    expect(app.hasRoute('POST', '/api/v1/admin/restore')).toBe(true);
  });

  it('POST /api/v1/admin/restore should 400 without backupId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/restore',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({})
    });
    expect(response.statusCode).toBe(400);
  });

  it('POST /api/v1/admin/restore should dry-run restore when metadata exists', async () => {
    // Arrange: create minimal backup metadata file in default backup directory
    const backupId = 'test-backup-id';
    const backupsDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupsDir, { recursive: true });
    const metadataPath = path.join(backupsDir, `${backupId}_metadata.json`);
    const metadata = {
      id: backupId,
      type: 'full',
      timestamp: new Date().toISOString(),
      size: 0,
      checksum: 'dummy',
      components: { falkordb: true, qdrant: true, postgres: true, config: true },
      status: 'completed',
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Act: call restore with dryRun=true
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/restore',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ backupId, dryRun: true }),
    });

    // Assert: HTTP 200 with success and validation changes
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.any(Object));
    expect(body.data.success).toBe(true);
    expect(body.data.status).toBe('dry_run_completed');
    expect(Array.isArray(body.data.changes)).toBe(true);
    expect(body.data.changes.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/admin/restore should report not-found for unknown backupId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/restore',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ backupId: 'non-existent-id', dryRun: true }),
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.any(Object));
    expect(body.data.success).toBe(false);
    expect(String(body.data.error || '')).toContain('not found');
  });
});
