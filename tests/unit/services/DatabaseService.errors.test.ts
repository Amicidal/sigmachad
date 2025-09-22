/**
 * Targeted error-path coverage for DatabaseService.
 * Uses deterministic realistic mocks so failures surface the same way every run.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  DatabaseService,
  createTestDatabaseConfig,
} from '../../../src/services/core/DatabaseService';
import {
  RealisticFalkorDBMock,
  RealisticPostgreSQLMock,
  RealisticQdrantMock,
  RealisticRedisMock,
} from '../../test-utils/realistic-mocks';

type MockToggles = {
  falkor?: Partial<MockConfig>;
  qdrant?: Partial<MockConfig>;
  postgres?: Partial<MockConfig>;
  redis?: Partial<MockConfig>;
};

type MockConfig = {
  failureRate: number;
  latencyMs: number;
  connectionFailures: boolean;
  transactionFailures: boolean;
  dataCorruption: boolean;
  seed: number;
};

function createService(overrides: MockToggles = {}) {
  const config = createTestDatabaseConfig();

  const falkor = new RealisticFalkorDBMock({ seed: 11, failureRate: 0, ...overrides.falkor });
  const qdrant = new RealisticQdrantMock({ seed: 29, failureRate: 0, ...overrides.qdrant });
  const postgres = new RealisticPostgreSQLMock({
    seed: 47,
    failureRate: 0,
    transactionFailures: false,
    ...overrides.postgres,
  });
  const redis = new RealisticRedisMock({ seed: 73, failureRate: 0, ...overrides.redis });

  const service = new DatabaseService(config, {
    falkorFactory: () => falkor as any,
    qdrantFactory: () => qdrant as any,
    postgresFactory: () => postgres as any,
    redisFactory: () => redis as any,
  });

  return { service, mocks: { falkor, qdrant, postgres, redis } };
}

describe('DatabaseService Error Scenarios', () => {
  it('cleans up earlier services when a later dependency fails to initialize', async () => {
    const { service, mocks } = createService();

    const falkorInit = vi
      .spyOn(mocks.falkor, 'initialize')
      .mockResolvedValueOnce();
    const falkorClose = vi.spyOn(mocks.falkor, 'close').mockResolvedValueOnce();
    vi.spyOn(mocks.qdrant, 'initialize').mockRejectedValueOnce(
      new Error('qdrant init failed'),
    );

    await service.initialize();

    expect(falkorInit).toHaveBeenCalledTimes(1);
    expect(falkorClose).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(false);
  });

  it('propagates underlying query/setup failures with informative errors', async () => {
    const { service, mocks } = createService();
    await service.initialize();

    const falkorError = new Error('Cypher syntax error');
    const postgresError = new Error('duplicate key value violates unique constraint');
    const setupError = new Error('Schema migration failed');

    vi.spyOn(mocks.falkor, 'query').mockRejectedValueOnce(falkorError);
    vi.spyOn(mocks.postgres, 'query').mockRejectedValueOnce(postgresError);
    vi.spyOn(mocks.postgres, 'setupSchema').mockRejectedValueOnce(setupError);

    const results = await Promise.allSettled([
      service.falkordbQuery('MATCH (n) RETURN n'),
      service.postgresQuery('SELECT 1'),
      service.setupDatabase(),
    ]);

    expect(results[0]).toMatchObject({ status: 'rejected', reason: falkorError });
    expect(results[1]).toMatchObject({ status: 'rejected', reason: postgresError });
    expect(results[2]).toMatchObject({ status: 'rejected', reason: setupError });
  });

  it('rethrows transactional failures while ensuring the transaction wrapper ran', async () => {
    const { service, mocks } = createService();
    await service.initialize();

    const transactionError = new Error('deadlock detected');
    const clientQuery = vi.fn();

    vi.spyOn(mocks.postgres, 'transaction').mockImplementation(async (callback) => {
      const client = { query: clientQuery };
      await callback(client);
      throw transactionError;
    });

    await expect(
      service.postgresTransaction(async (client) => {
        await client.query('INSERT INTO demo VALUES ($1)', ['value']);
      }),
    ).rejects.toThrow(transactionError.message);

    expect(clientQuery).toHaveBeenCalledWith('INSERT INTO demo VALUES ($1)', ['value']);
  });

  it('continues bulk queries when continueOnError=true and records the failure detail', async () => {
    const { service, mocks } = createService();
    await service.initialize();

    vi.spyOn(mocks.postgres, 'bulkQuery').mockImplementation(
      async (queries, options) => {
        const results: any[] = [];
        for (const item of queries) {
          if (item.query.includes('INVALID')) {
            if (options?.continueOnError) {
              results.push({ error: 'syntax error at or near "INVALID"' });
              continue;
            }
            throw new Error('syntax error at or near "INVALID"');
          }
          results.push({ rows: [{ ok: true }] });
        }
        return results;
      },
    );

    const results = await service.postgresBulkQuery(
      [
        { query: 'SELECT 1', params: [] },
        { query: 'INVALID SQL', params: [] },
        { query: 'SELECT 2', params: [] },
      ],
      { continueOnError: true },
    );

    expect(results).toEqual([
      { rows: [{ ok: true }] },
      { error: 'syntax error at or near "INVALID"' },
      { rows: [{ ok: true }] },
    ]);
  });

  it('surfaces corrupted data from downstream services through health checks', async () => {
    const { service, mocks } = createService({
      falkor: { dataCorruption: true },
      postgres: { failureRate: 0 },
    });

    await service.initialize();

    vi.spyOn(mocks.falkor, 'healthCheck').mockResolvedValueOnce(false);
    vi.spyOn(mocks.qdrant, 'healthCheck').mockResolvedValueOnce(true);
    vi.spyOn(mocks.postgres, 'healthCheck').mockResolvedValueOnce(true);
    vi.spyOn(mocks.redis, 'healthCheck').mockResolvedValueOnce(true);

    const health = await service.healthCheck();

    expect(health.falkordb?.status).toBe('unhealthy');
    expect(health.qdrant?.status).toBe('healthy');
    expect(health.postgresql?.status).toBe('healthy');
    expect(health.redis?.status).toBe('healthy');
  });
});

