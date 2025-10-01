/**
 * Focused unit tests for DatabaseService
 * Exercises initialization orchestration, failure handling, and query routing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DatabaseService,
  createTestDatabaseConfig,
} from '@memento/database/DatabaseService';
import type {
  DatabaseConfig,
  DatabaseServiceDeps,
  INeo4jService,
  IPostgreSQLService,
  IRedisService,
} from '@memento/shared-types';

interface ServiceMocks {
  neo4j: INeo4jService & {
    initialize: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    getDriver: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    command: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
    setupGraph: ReturnType<typeof vi.fn>;
    setupVectorIndexes: ReturnType<typeof vi.fn>;
    upsertVector: ReturnType<typeof vi.fn>;
    searchVector: ReturnType<typeof vi.fn>;
    scrollVectors: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };
  postgres: IPostgreSQLService & {
    initialize: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    bulkQuery: ReturnType<typeof vi.fn>;
    getPool: ReturnType<typeof vi.fn>;
    setupSchema: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
    storeTestSuiteResult: ReturnType<typeof vi.fn>;
    storeFlakyTestAnalyses: ReturnType<typeof vi.fn>;
    getTestExecutionHistory: ReturnType<typeof vi.fn>;
    getPerformanceMetricsHistory: ReturnType<typeof vi.fn>;
    getBulkWriterMetrics: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };
  redis: IRedisService & {
    initialize: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };
}

const baseConfig: DatabaseConfig = {
  ...createTestDatabaseConfig(),
};

function createServiceMocks(): ServiceMocks {
  const makeCommon = () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    healthCheck: vi.fn().mockResolvedValue(true),
  });

  const neo4j = {
    ...makeCommon(),
    getDriver: vi.fn().mockReturnValue({ driver: 'neo4j-driver' }),
    query: vi.fn().mockResolvedValue({ records: [] }),
    command: vi.fn().mockResolvedValue({ result: 'ok' }),
    transaction: vi.fn().mockImplementation(async (callback) => {
      const run = vi.fn().mockResolvedValue({ records: [] });
      const tx = {
        run,
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
      };
      return callback(tx);
    }),
    setupGraph: vi.fn().mockResolvedValue(undefined),
    setupVectorIndexes: vi.fn().mockResolvedValue(undefined),
    upsertVector: vi.fn().mockResolvedValue(undefined),
    searchVector: vi.fn().mockResolvedValue([]),
    scrollVectors: vi.fn().mockResolvedValue({ points: [], total: 0 }),
  } as unknown as ServiceMocks['neo4j'];

  const postgres = {
    ...makeCommon(),
    query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
    bulkQuery: vi.fn().mockResolvedValue([{ rows: [] }]),
    getPool: vi.fn().mockReturnValue({ pool: true }),
    setupSchema: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn().mockImplementation(async (callback) => {
      const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
      return callback(client);
    }),
    storeTestSuiteResult: vi.fn().mockResolvedValue(undefined),
    storeFlakyTestAnalyses: vi.fn().mockResolvedValue(undefined),
    getTestExecutionHistory: vi.fn().mockResolvedValue([]),
    getPerformanceMetricsHistory: vi.fn().mockResolvedValue([]),
    getBulkWriterMetrics: vi.fn().mockReturnValue({
      activeBatches: 0,
      maxConcurrentBatches: 0,
      totalBatches: 0,
      totalQueries: 0,
      totalDurationMs: 0,
      maxBatchSize: 0,
      maxQueueDepth: 0,
      maxDurationMs: 0,
      averageDurationMs: 0,
      lastBatch: null,
      history: [],
      slowBatches: [],
    }),
  } as unknown as ServiceMocks['postgres'];

  const redis = {
    ...makeCommon(),
    healthCheck: vi.fn().mockResolvedValue(true),
  } as unknown as ServiceMocks['redis'];

  return { neo4j, postgres, redis };
}

function buildDatabaseService(overrides?: {
  failOn?: 'neo4j' | 'postgres' | 'redis';
}): { service: DatabaseService; mocks: ServiceMocks } {
  const mocks = createServiceMocks();

  if (overrides?.failOn) {
    mocks[overrides.failOn].initialize.mockRejectedValueOnce(
      new Error(`${overrides.failOn} init failed`),
    );
  }

  const deps: DatabaseServiceDeps = {
    neo4jFactory: () => mocks.neo4j,
    postgresFactory: () => mocks.postgres,
    redisFactory: () => mocks.redis,
  };

  const service = new DatabaseService(baseConfig, deps);

  return { service, mocks };
}

describe('DatabaseService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes each dependency exactly once and exposes clients', async () => {
    const { service, mocks } = buildDatabaseService();

    await service.initialize();

    expect(mocks.neo4j.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.redis.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.neo4j.setupGraph).toHaveBeenCalledTimes(1);
    expect(mocks.neo4j.setupVectorIndexes).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(true);

    expect(service.getNeo4jDriver()).toEqual({ driver: 'neo4j-driver' });
    expect(service.getPostgresPool()).toEqual({ pool: true });
    expect(service.getRedisService()).toBeDefined();
    expect(service.getGraphService()).toBe(mocks.neo4j);
  });

  it('coalesces concurrent initialize calls into a single underlying run', async () => {
    const { service, mocks } = buildDatabaseService();

    await Promise.all([service.initialize(), service.initialize()]);

    expect(mocks.neo4j.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.initialize).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(true);
  });

  it('cleans up initialized services if a later dependency fails', async () => {
    const { service, mocks } = buildDatabaseService({ failOn: 'postgres' });

    await service.initialize();

    expect(mocks.neo4j.close).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.close).toHaveBeenCalledTimes(1);
    expect(mocks.redis.close).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(false);

    expect(() => service.getGraphService()).toThrow('Database not initialized');
  });

  it('proxies database operations to the underlying services', async () => {
    const { service, mocks } = buildDatabaseService();
    await service.initialize();

    await service.graphQuery('MATCH (n) RETURN n', { limit: 1 });
    await service.graphCommand('GRAPH.PROFILE', 'MATCH (n) RETURN n');
    await service.postgresQuery('SELECT 1', []);
    await service.postgresBulkQuery([{ query: 'SELECT 1', params: [] }]);
    await service.storeTestSuiteResult({
      name: 'suite',
      status: 'passed',
      duration: 1,
      timestamp: new Date(),
      testResults: [],
    });
    await service.storeFlakyTestAnalyses([]);

    expect(mocks.neo4j.query).toHaveBeenCalledWith('MATCH (n) RETURN n', {
      limit: 1,
    });
    expect(mocks.neo4j.command).toHaveBeenCalledWith(
      'GRAPH.PROFILE',
      'MATCH (n) RETURN n',
    );
    expect(mocks.postgres.query).toHaveBeenCalledWith('SELECT 1', [], {});
    expect(mocks.postgres.bulkQuery).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.storeTestSuiteResult).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.storeFlakyTestAnalyses).toHaveBeenCalledTimes(1);
  });

  it('reports unhealthy components via healthCheck when dependencies fail', async () => {
    const { service, mocks } = buildDatabaseService();
    await service.initialize();

    mocks.neo4j.healthCheck.mockResolvedValueOnce(false);
    mocks.postgres.healthCheck.mockResolvedValueOnce(true);
    mocks.redis.healthCheck.mockResolvedValueOnce(undefined as any);

    const health = await service.healthCheck();

    expect(health.neo4j.status).toBe('unhealthy');
    expect(health.postgresql.status).toBe('healthy');
    expect(health.redis?.status).toBe('unknown');
  });

  it('surface postgres transaction failures while ensuring wrapper execution', async () => {
    const { service, mocks } = buildDatabaseService();
    await service.initialize();

    const transactionError = new Error('deadlock detected');
    const clientQuery = vi.fn();

    mocks.postgres.transaction.mockImplementationOnce(async (callback) => {
      const client = { query: clientQuery };
      await callback(client);
      throw transactionError;
    });

    await expect(
      service.postgresTransaction(async (client) => {
        await client.query('INSERT INTO demo VALUES ($1)', ['value']);
      }),
    ).rejects.toThrow(transactionError.message);

    expect(clientQuery).toHaveBeenCalledWith('INSERT INTO demo VALUES ($1)', [
      'value',
    ]);
  });
});
