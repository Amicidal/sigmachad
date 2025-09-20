/**
 * Integration tests for Admin Restore endpoints
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

const JSON_HEADERS = { 'content-type': 'application/json' } as const;
const RESTORE_PREVIEW_ROUTE = '/api/v1/admin/restore/preview';
const RESTORE_CONFIRM_ROUTE = '/api/v1/admin/restore/confirm';
const BACKUP_ROUTE = '/api/v1/admin/backup';
const BACKUP_ROOT = path.join(process.cwd(), 'backups', 'admin-restore-tests');

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

describe('Admin Restore Endpoints', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;
  const createdBackupIds: string[] = [];

  beforeAll(async () => {
    await ensureDir(BACKUP_ROOT);

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
    try {
      if (createdBackupIds.length > 0) {
        await dbService.postgresQuery(
          'DELETE FROM maintenance_backups WHERE id = ANY($1::text[])',
          [createdBackupIds]
        );
      }
    } catch (error) {
      console.warn('Failed to clean maintenance_backups records:', error);
    }

    try {
      await fs.rm(BACKUP_ROOT, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to remove backup directory:', error);
    }

    if (apiGateway) {
      await apiGateway.stop();
    }

    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  const createTestBackup = async () => {
    const destination = path.join(
      BACKUP_ROOT,
      `run-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    await ensureDir(destination);

    const response = await app.inject({
      method: 'POST',
      url: BACKUP_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({
        type: 'full',
        includeData: false,
        includeConfig: true,
        compression: false,
        destination,
      }),
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.objectContaining({ id: expect.any(String) }));

    const backupId = body.data.id as string;
    createdBackupIds.push(backupId);

    return { backupId, destination };
  };

  it('registers restore preview and confirm routes with admin aliases', () => {
    expect(app.hasRoute('POST', RESTORE_PREVIEW_ROUTE)).toBe(true);
    expect(app.hasRoute('POST', RESTORE_CONFIRM_ROUTE)).toBe(true);
  });

  it('returns 400 when preview request omits backupId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: RESTORE_PREVIEW_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({}),
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'FST_ERR_VALIDATION',
        message: expect.stringContaining("backupId"),
      })
    );
  });

  it('returns 409 and NOT_FOUND when previewing an unknown backup', async () => {
    const response = await app.inject({
      method: 'POST',
      url: RESTORE_PREVIEW_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({ backupId: 'non-existent-backup', validateIntegrity: false }),
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.data).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      })
    );
  });

  it('issues a restore preview token for a valid backup', async () => {
    const { backupId } = await createTestBackup();

    const response = await app.inject({
      method: 'POST',
      url: RESTORE_PREVIEW_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({ backupId, validateIntegrity: false }),
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        backupId,
        success: true,
        status: 'dry_run_completed',
        token: expect.any(String),
        changes: expect.any(Array),
      })
    );
    expect(body.metadata).toEqual(
      expect.objectContaining({
        status: 'dry_run_completed',
        tokenExpiresAt: expect.any(String),
        requiresApproval: false,
      })
    );
  });

  it('requires a restore token when confirming a restore', async () => {
    const response = await app.inject({
      method: 'POST',
      url: RESTORE_CONFIRM_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({ backupId: 'some-backup' }),
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'FST_ERR_VALIDATION',
        message: expect.stringContaining('restoreToken'),
      })
    );
  });

  it('executes restore workflow when confirming with a valid token', async () => {
    const { backupId } = await createTestBackup();

    const previewResponse = await app.inject({
      method: 'POST',
      url: RESTORE_PREVIEW_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({ backupId, validateIntegrity: false }),
    });

    expect(previewResponse.statusCode).toBe(200);
    const previewBody = JSON.parse(previewResponse.payload);
    const restoreToken = previewBody.data.token as string;
    expect(typeof restoreToken).toBe('string');

    const confirmResponse = await app.inject({
      method: 'POST',
      url: RESTORE_CONFIRM_ROUTE,
      headers: JSON_HEADERS,
      payload: JSON.stringify({
        backupId,
        restoreToken,
        validateIntegrity: false,
      }),
    });

    expect(confirmResponse.statusCode).toBe(200);
    const confirmBody = JSON.parse(confirmResponse.payload);
    expect(confirmBody.success).toBe(true);
    expect(confirmBody.data).toEqual(
      expect.objectContaining({
        backupId,
        success: true,
        status: 'completed',
        changes: expect.any(Array),
      })
    );
  });
});
