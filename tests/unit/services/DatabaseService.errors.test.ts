/**
 * Targeted error-path coverage for DatabaseService.
 * Uses deterministic realistic mocks so failures surface the same way every run.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  DatabaseService,
  createTestDatabaseConfig,
} from '@memento/database/DatabaseService';
import {
  RealisticNeo4jMock,
  RealisticPostgreSQLMock,
  RealisticRedisMock,
} from '../../test-utils/realistic-mocks';

interface MockConfig {
  failureRate: number;
  latencyMs: number;
  connectionFailures: boolean;
  transactionFailures: boolean;
  dataCorruption: boolean;
  seed: number;
}

type MockToggles = {
  neo4j?: Partial<MockConfig>;
  postgres?: Partial<MockConfig>;
  redis?: Partial<MockConfig>;
};

function createService(overrides: MockToggles = {}) {
  const config = createTestDatabaseConfig();

  const neo4j = new RealisticNeo4jMock({
    seed: 11,
    failureRate: 0,
    ...overrides.neo4j,
  });
  const postgres = new RealisticPostgreSQLMock({
    seed: 47,
    failureRate: 0,
    transactionFailures: false,
    ...overrides.postgres,
  });
  const redis = new RealisticRedisMock({
    seed: 73,
    failureRate: 0,
    ...overrides.redis,
  });

  const service = new DatabaseService(config, {
    neo4jFactory: () => neo4j as any,
    postgresFactory: () => postgres as any,
    redisFactory: () => redis as any,
  });

  return { service, mocks: { neo4j, postgres, redis } };
}

describe('DatabaseService Error Scenarios', () => {
  it('cleans up earlier services when a later dependency fails to initialize', async () => {
    const { service, mocks } = createService({
      postgres: { connectionFailures: true, failureRate: 100 },
    });

    const neo4jInit = vi.spyOn(mocks.neo4j, 'initialize');
    const neo4jClose = vi.spyOn(mocks.neo4j, 'close');
    const postgresInit = vi
      .spyOn(mocks.postgres, 'initialize')
      .mockRejectedValueOnce(new Error('postgres init failed'));
    const redisClose = vi.spyOn(mocks.redis, 'close');

    await service.initialize();

    expect(neo4jInit).toHaveBeenCalledTimes(1);
    expect(postgresInit).toHaveBeenCalledTimes(1);
    expect(neo4jClose).toHaveBeenCalledTimes(1);
    expect(redisClose).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(false);
  });

  it('propagates underlying query/setup failures with informative errors', async () => {
    const { service, mocks } = createService();
    await service.initialize();

    const graphError = new Error('Cypher syntax error');
    const postgresError = new Error('duplicate key value violates unique constraint');
    const setupError = new Error('Schema migration failed');

    vi.spyOn(mocks.neo4j, 'query').mockRejectedValueOnce(graphError);
    vi.spyOn(mocks.postgres, 'query').mockRejectedValueOnce(postgresError);
    vi.spyOn(mocks.postgres, 'setupSchema').mockRejectedValueOnce(setupError);

    const results = await Promise.allSettled([
      service.graphQuery('MATCH (n) RETURN n'),
      service.postgresQuery('SELECT 1'),
      service.setupDatabase(),
    ]);

    expect(results[0]).toMatchObject({ status: 'rejected', reason: graphError });
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
      neo4j: { dataCorruption: true },
      postgres: { failureRate: 0 },
    });

    await service.initialize();

    vi.spyOn(mocks.neo4j, 'healthCheck').mockResolvedValueOnce(false);
    vi.spyOn(mocks.postgres, 'healthCheck').mockResolvedValueOnce(true);
    vi.spyOn(mocks.redis, 'healthCheck').mockResolvedValueOnce(true);

    const health = await service.healthCheck();

    expect(health.neo4j.status).toBe('unhealthy');
    expect(health.postgresql.status).toBe('healthy');
    expect(health.redis?.status).toBe('healthy');
  });
});
