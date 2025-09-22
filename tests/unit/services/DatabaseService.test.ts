/**
 * Focused unit tests for DatabaseService
 * Exercises initialization orchestration, failure handling, and query routing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DatabaseService,
  DatabaseConfig,
} from '../../../src/services/core/DatabaseService';

interface ServiceMocks {
  initialize: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  query?: ReturnType<typeof vi.fn>;
  command?: ReturnType<typeof vi.fn>;
  getClient?: ReturnType<typeof vi.fn>;
  getPool?: ReturnType<typeof vi.fn>;
  setupSchema?: ReturnType<typeof vi.fn>;
  setupGraph?: ReturnType<typeof vi.fn>;
  setupCollections?: ReturnType<typeof vi.fn>;
  isInitialized?: ReturnType<typeof vi.fn>;
  bulkQuery?: ReturnType<typeof vi.fn>;
  storeTestSuiteResult?: ReturnType<typeof vi.fn>;
  storeFlakyTestAnalyses?: ReturnType<typeof vi.fn>;
  getTestExecutionHistory?: ReturnType<typeof vi.fn>;
  getPerformanceMetricsHistory?: ReturnType<typeof vi.fn>;
  getBulkWriterMetrics?: ReturnType<typeof vi.fn>;
}

const baseConfig: DatabaseConfig = {
  falkordb: {
    url: 'redis://localhost:6379',
    database: 0,
  },
  qdrant: {
    url: 'http://localhost:6333',
  },
  postgresql: {
    connectionString: 'postgresql://test:test@localhost:5432/test',
    max: 10,
    idleTimeoutMillis: 1000,
  },
  redis: {
    url: 'redis://localhost:6379',
  },
};

function createServiceMocks() {
  const makeCommon = (): ServiceMocks => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
  });

  const falkor = {
    ...makeCommon(),
    query: vi.fn().mockResolvedValue({ ok: true }),
    command: vi.fn().mockResolvedValue({ ok: true }),
    getClient: vi.fn().mockReturnValue({ client: 'falkor' }),
    setupGraph: vi.fn().mockResolvedValue(undefined),
  };

  const qdrant = {
    ...makeCommon(),
    getClient: vi.fn().mockReturnValue({ client: 'qdrant' }),
    setupCollections: vi.fn().mockResolvedValue(undefined),
  };

  const postgres = {
    ...makeCommon(),
    query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
    getPool: vi.fn().mockReturnValue({ pool: true }),
    setupSchema: vi.fn().mockResolvedValue(undefined),
    bulkQuery: vi.fn().mockResolvedValue([{ rows: [] }]),
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
  };

  const redis = {
    ...makeCommon(),
  };

  return { falkor, qdrant, postgres, redis };
}

function buildDatabaseService(overrides?: {
  failOn?: 'falkor' | 'qdrant' | 'postgres' | 'redis';
}) {
  const mocks = createServiceMocks();

  if (overrides?.failOn) {
    mocks[overrides.failOn].initialize.mockRejectedValueOnce(
      new Error(`${overrides.failOn} init failed`),
    );
  }

  const service = new DatabaseService(baseConfig, {
    falkorFactory: () => mocks.falkor as any,
    qdrantFactory: () => mocks.qdrant as any,
    postgresFactory: () => mocks.postgres as any,
    redisFactory: () => mocks.redis as any,
  });

  return { service, mocks };
}

describe('DatabaseService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes each dependency exactly once and exposes clients', async () => {
    const { service, mocks } = buildDatabaseService();

    await service.initialize();

    expect(mocks.falkor.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.qdrant.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.redis.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.qdrant.setupCollections).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(true);

    // Accessors should return underlying clients/pools
    expect(service.getFalkorDBClient()).toEqual({ client: 'falkor' });
    expect(service.getQdrantClient()).toEqual({ client: 'qdrant' });
    expect(service.getPostgresPool()).toEqual({ pool: true });
    expect(service.getRedisService()).toBeDefined();
  });

  it('coalesces concurrent initialize calls into a single underlying run', async () => {
    const { service, mocks } = buildDatabaseService();

    await Promise.all([service.initialize(), service.initialize()]);

    expect(mocks.falkor.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.qdrant.initialize).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(true);
  });

  it('cleans up initialized services if a later dependency fails', async () => {
    const { service, mocks } = buildDatabaseService({ failOn: 'postgres' });

    await service.initialize();

    expect(mocks.falkor.close).toHaveBeenCalledTimes(1);
    expect(mocks.qdrant.close).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(false);

    // After partial failure the getters should refuse usage
    expect(() => service.getFalkorDBService()).toThrow('Database not initialized');
  });

  it('proxies database operations to the underlying services', async () => {
    const { service, mocks } = buildDatabaseService();
    await service.initialize();

    await service.falkordbQuery('MATCH (n) RETURN n', { limit: 1 });
    await service.falkordbCommand('GRAPH.QUERY', 'foo', 'MATCH (n)');
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

    expect(mocks.falkor.query).toHaveBeenCalledWith('MATCH (n) RETURN n', {
      limit: 1,
    });
    expect(mocks.falkor.command).toHaveBeenCalledWith(
      'GRAPH.QUERY',
      'foo',
      'MATCH (n)',
    );
    expect(mocks.postgres.query).toHaveBeenCalledWith('SELECT 1', [], {});
    expect(mocks.postgres.bulkQuery).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.storeTestSuiteResult).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.storeFlakyTestAnalyses).toHaveBeenCalledTimes(1);
  });

  it('closes initialized services and resets state', async () => {
    const { service, mocks } = buildDatabaseService();
    await service.initialize();

    await service.close();

    expect(mocks.falkor.close).toHaveBeenCalledTimes(1);
    expect(mocks.qdrant.close).toHaveBeenCalledTimes(1);
    expect(mocks.postgres.close).toHaveBeenCalledTimes(1);
    expect(mocks.redis.close).toHaveBeenCalledTimes(1);
    expect(service.isInitialized()).toBe(false);
    await service.close(); // idempotent second close
    expect(mocks.falkor.close).toHaveBeenCalledTimes(1);
  });
});
