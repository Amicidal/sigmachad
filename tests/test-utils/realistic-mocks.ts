/**
 * Realistic mock implementations for testing
 * These mocks simulate real-world failure scenarios and edge cases
 */

import { vi } from "vitest";

import type {
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  IRedisService,
} from "../../src/services/database/interfaces";

interface MockConfig {
  failureRate?: number; // 0-100 percentage
  latencyMs?: number;
  connectionFailures?: boolean;
  transactionFailures?: boolean;
  dataCorruption?: boolean;
  seed?: number; // deterministic RNG seed
}

export interface LightweightDatabaseMocks {
  falkor: IFalkorDBService;
  qdrant: IQdrantService;
  postgres: IPostgreSQLService;
  redis: IRedisService;
  qdrantClient: {
    getCollections: ReturnType<typeof vi.fn>;
    updateCollection: ReturnType<typeof vi.fn>;
    createSnapshot: ReturnType<typeof vi.fn>;
    getCollection: ReturnType<typeof vi.fn>;
    scroll: ReturnType<typeof vi.fn>;
  };
}

/**
 * Lightweight deterministic mocks for unit tests that only need happy-path behaviour.
 */
export function createLightweightDatabaseMocks(): LightweightDatabaseMocks {
  const falkor = {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    query: vi.fn().mockResolvedValue([]),
    command: vi.fn().mockResolvedValue(undefined),
    setupGraph: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
  } satisfies IFalkorDBService;

  const qdrantClient = {
    getCollections: vi.fn().mockResolvedValue({ collections: [] }),
    updateCollection: vi.fn().mockResolvedValue(undefined),
    createSnapshot: vi.fn().mockResolvedValue(undefined),
    getCollection: vi.fn().mockResolvedValue({}),
    scroll: vi.fn().mockResolvedValue({ points: [] }),
  };

  const qdrant = {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    getClient: vi.fn().mockReturnValue(qdrantClient),
    setupCollections: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
  } satisfies IQdrantService;

  const postgres = {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    query: vi.fn().mockResolvedValue([]),
    bulkQuery: vi.fn().mockResolvedValue([]),
    getPool: vi.fn().mockReturnValue({}),
    healthCheck: vi.fn().mockResolvedValue(true),
  } satisfies IPostgreSQLService;

  const redis = {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    healthCheck: vi.fn().mockResolvedValue(true),
  } satisfies IRedisService;

  return {
    falkor,
    qdrant,
    postgres,
    redis,
    qdrantClient,
  };
}

/**
 * Realistic FalkorDB mock with configurable failure scenarios
 */
export class RealisticFalkorDBMock implements IFalkorDBService {
  private initialized = false;
  private config: MockConfig;
  private queryCount = 0;
  private failureCount = 0;
  private rngState: number;

  private rng(): number {
    // Simple LCG for deterministic pseudo-random numbers
    // https://en.wikipedia.org/wiki/Linear_congruential_generator
    this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
    return (this.rngState >>> 8) / 0x01000000; // [0,1)
  }

  constructor(config: MockConfig = {}) {
    this.config = {
      failureRate: config.failureRate ?? 0,
      latencyMs: config.latencyMs ?? 0,
      connectionFailures: config.connectionFailures ?? false,
      transactionFailures: config.transactionFailures ?? false,
      dataCorruption: config.dataCorruption ?? false,
    };
    this.rngState = (config.seed ?? 1) >>> 0;
  }

  async initialize(): Promise<void> {
    if (this.config.connectionFailures && this.rng() * 100 < 50) {
      throw new Error("FalkorDB connection failed: Connection refused");
    }

    await this.simulateLatency();
    this.initialized = true;
  }

  async close(): Promise<void> {
    await this.simulateLatency();
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): any {
    if (!this.initialized) {
      return undefined;
    }
    return {
      mockClient: true,
      queryCount: this.queryCount,
      sendCommand: vi.fn().mockResolvedValue("mock-command-result"),
    };
  }

  async query(query: string, params?: Record<string, any>): Promise<any> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      this.failureCount++;
      const errors = [
        "Query timeout exceeded",
        "Connection lost during query execution",
        "Constraint violation: duplicate key",
        "Syntax error in Cypher query",
      ];
      throw new Error(errors[Math.floor(this.rng() * errors.length)]);
    }

    this.queryCount++;

    // Simulate data corruption
    if (this.config.dataCorruption && this.rng() < 0.1) {
      return {
        corrupted: true,
        error: "Data integrity check failed",
        originalQuery: query,
      };
    }

    // Return realistic results based on query type
    if (query.includes("MATCH")) {
      return this.generateRealisticMatchResults();
    } else if (query.includes("CREATE")) {
      return { created: 1, properties: params };
    } else if (query.includes("DELETE")) {
      return { deleted: Math.floor(this.rng() * 10) };
    }

    return { query, params, result: "success" };
  }

  async command(...args: any[]): Promise<any> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error("Command execution failed");
    }

    return { args, result: "command-success" };
  }

  async setupGraph(): Promise<void> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }
    await this.simulateLatency();
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    // Simulate intermittent health check failures
    if (this.config.connectionFailures && this.rng() < 0.2) {
      return false;
    }

    return true;
  }

  // Helper methods for testing
  getQueryCount(): number {
    return this.queryCount;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.latencyMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.latencyMs)
      );
    }
  }

  private shouldFail(): boolean {
    return this.rng() * 100 < (this.config.failureRate ?? 0);
  }

  private generateRealisticMatchResults(): any[] {
    const count = Math.floor(this.rng() * 5);
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push({
        id: `node-${i}`,
        type: ["file", "function", "class"][Math.floor(this.rng() * 3)],
        properties: {
          name: `Entity${i}`,
          created: new Date().toISOString(),
        },
      });
    }
    return results;
  }
}

/**
 * Realistic Qdrant mock with vector search simulation
 */
export class RealisticQdrantMock implements IQdrantService {
  private initialized = false;
  private config: MockConfig;
  private collections: Map<string, any[]> = new Map();
  private rngState: number;

  private rng(): number {
    this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
    return (this.rngState >>> 8) / 0x01000000;
  }

  constructor(config: MockConfig = {}) {
    this.config = {
      failureRate: config.failureRate ?? 0,
      latencyMs: config.latencyMs ?? 0,
      connectionFailures: config.connectionFailures ?? false,
      transactionFailures: config.transactionFailures ?? false,
      dataCorruption: config.dataCorruption ?? false,
    };
    this.rngState = (config.seed ?? 1) >>> 0;
  }

  async initialize(): Promise<void> {
    if (this.config.connectionFailures && this.rng() < 0.3) {
      throw new Error("Qdrant connection failed: Service unavailable");
    }

    await this.simulateLatency();
    this.initialized = true;
  }

  async close(): Promise<void> {
    await this.simulateLatency();
    this.initialized = false;
    this.collections.clear();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): any {
    if (!this.initialized) {
      return undefined;
    }

    return {
      search: async (collection: string, params: any) => {
        if (this.shouldFail()) {
          throw new Error("Vector search failed: Index corrupted");
        }

        await this.simulateLatency();

        // Return realistic search results
        return {
          points: [
            {
              id: "vec-1",
              score: 0.95,
              payload: { type: "document", content: "test" },
            },
            {
              id: "vec-2",
              score: 0.87,
              payload: { type: "code", language: "typescript" },
            },
          ],
        };
      },

      upsert: async (collection: string, data: any) => {
        if (this.shouldFail()) {
          throw new Error("Upsert failed: Collection locked");
        }

        await this.simulateLatency();

        if (!this.collections.has(collection)) {
          this.collections.set(collection, []);
        }
        this.collections.get(collection)!.push(data);

        return { status: "completed" };
      },

      createCollection: async (name: string, config: any) => {
        await this.simulateLatency();
        this.collections.set(name, []);
        return { status: "created" };
      },

      deleteCollection: async (name: string) => {
        await this.simulateLatency();
        this.collections.delete(name);
        return { status: "deleted" };
      },

      getCollections: async () => {
        await this.simulateLatency();
        return {
          collections: Array.from(this.collections.keys()).map((name) => ({
            name,
          })),
        };
      },

      createSnapshot: async (collectionName: string) => {
        await this.simulateLatency();
        return {
          name: `${collectionName}_snapshot_${Date.now()}`,
          collection: collectionName,
          created_at: new Date().toISOString(),
        };
      },

      scroll: async (collection: string, params: any) => {
        await this.simulateLatency();
        const data = this.collections.get(collection) || [];
        return { points: data.slice(0, params?.limit || 10) };
      },
    };
  }

  async setupCollections(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }
    await this.simulateLatency();
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized && this.rng() > 0.1;
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.latencyMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.latencyMs)
      );
    }
  }

  private shouldFail(): boolean {
    return this.rng() * 100 < (this.config.failureRate ?? 0);
  }
}

/**
 * Realistic PostgreSQL mock with transaction simulation
 */
export class RealisticPostgreSQLMock implements IPostgreSQLService {
  private initialized = false;
  private config: MockConfig;
  private transactionCount = 0;
  private queryLog: string[] = [];
  private rngState: number;

  private rng(): number {
    this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
    return (this.rngState >>> 8) / 0x01000000;
  }

  constructor(config: MockConfig = {}) {
    // Enforce realistic defaults for testing
    this.config = {
      failureRate: config.failureRate ?? 0,
      latencyMs: config.latencyMs ?? 0,
      connectionFailures: config.connectionFailures ?? false,
      transactionFailures: config.transactionFailures ?? false,
      dataCorruption: config.dataCorruption ?? false,
    };
    this.rngState = (config.seed ?? 1) >>> 0;
  }

  async initialize(): Promise<void> {
    if (this.config.connectionFailures && this.rng() < 0.25) {
      throw new Error("PostgreSQL connection failed: Max connections reached");
    }

    await this.simulateLatency();
    this.initialized = true;
  }

  async close(): Promise<void> {
    await this.simulateLatency();
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPool(): any {
    if (!this.initialized) {
      return undefined;
    }
    return {
      totalCount: 10,
      idleCount: 5,
      waitingCount: 0,
    };
  }

  async query(
    query: string,
    params?: any[],
    options?: { timeout?: number }
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    // Simulate timeout
    if (
      options?.timeout &&
      this.config.latencyMs &&
      this.config.latencyMs > options.timeout
    ) {
      throw new Error(`Query timeout after ${options.timeout}ms`);
    }

    await this.simulateLatency();
    this.queryLog.push(query);

    if (this.shouldFail()) {
      const errors = [
        "duplicate key value violates unique constraint",
        "deadlock detected",
        "connection terminated unexpectedly",
        "invalid input syntax for type",
      ];
      throw new Error(errors[Math.floor(this.rng() * errors.length)]);
    }

    // Return realistic query results
    if (query.toLowerCase().includes("select")) {
      return {
        rows: this.generateRealisticRows(),
        rowCount: Math.floor(this.rng() * 100),
      };
    } else if (query.toLowerCase().includes("insert")) {
      return {
        rows: [{ id: Math.floor(this.rng() * 1000) }],
        rowCount: 1,
      };
    } else if (query.toLowerCase().includes("update")) {
      return {
        rowCount: Math.floor(this.rng() * 10),
      };
    }

    return { query, params, options, result: "success" };
  }

  async transaction<T>(
    callback: (client: any) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    this.transactionCount++;

    // Simulate transaction failures
    if (this.config.transactionFailures && this.rng() < 0.3) {
      const txErrors = [
        "deadlock detected",
        "could not serialize access due to concurrent update",
        "current transaction is aborted",
        "unique constraint violation",
      ];
      throw new Error(txErrors[Math.floor(this.rng() * txErrors.length)]);
    }

    const mockClient = {
      query: async (q: string, p?: any[]) => {
        this.queryLog.push(`TX: ${q}`);
        return this.query(q, p);
      },
    };

    await this.simulateLatency();
    return callback(mockClient);
  }

  async bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options?: { continueOnError?: boolean }
  ): Promise<any[]> {
    const results = [];

    for (const q of queries) {
      try {
        const result = await this.query(q.query, q.params);
        results.push(result);
      } catch (error) {
        if (options?.continueOnError) {
          results.push({ error: (error as Error).message });
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  async setupSchema(): Promise<void> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }
    await this.simulateLatency();
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized && this.rng() > 0.05;
  }

  async storeTestSuiteResult(suiteResult: any): Promise<void> {
    await this.query(
      "INSERT INTO test_suites (name, status, duration) VALUES ($1, $2, $3)",
      [suiteResult.name, suiteResult.status, suiteResult.duration]
    );
  }

  async storeFlakyTestAnalyses(analyses: any[]): Promise<void> {
    for (const analysis of analyses) {
      await this.query(
        "INSERT INTO flaky_test_analyses (test_id, failure_count) VALUES ($1, $2)",
        [analysis.testId, analysis.failureCount]
      );
    }
  }

  async getTestExecutionHistory(
    entityId: string,
    limit?: number
  ): Promise<any[]> {
    await this.simulateLatency();

    const history = [];
    const count = Math.min(limit || 10, 5);

    for (let i = 0; i < count; i++) {
      history.push({
        test_id: `test-${entityId}-${i}`,
        test_name: `Test ${i}`,
        status: this.rng() > 0.3 ? "passed" : "failed",
        duration: Math.floor(this.rng() * 1000),
        timestamp: new Date(Date.now() - i * 86400000),
      });
    }

    return history;
  }

  async getPerformanceMetricsHistory(
    entityId: string,
    days?: number
  ): Promise<any[]> {
    await this.simulateLatency();

    const metrics = [];
    const count = days || 7;

    for (let i = 0; i < count; i++) {
      metrics.push({
        entity_id: entityId,
        metric_type: "response_time",
        value: 50 + this.rng() * 200,
        timestamp: new Date(Date.now() - i * 86400000),
      });
    }

    return metrics;
  }

  async getCoverageHistory(entityId: string, days?: number): Promise<any[]> {
    await this.simulateLatency();

    const coverage = [];
    const count = days || 7;

    for (let i = 0; i < count; i++) {
      const total = 1000 + Math.floor(this.rng() * 500);
      const covered = Math.floor(total * (0.6 + this.rng() * 0.35));

      coverage.push({
        entity_id: entityId,
        percentage: (covered / total) * 100,
        lines_covered: covered,
        lines_total: total,
        timestamp: new Date(Date.now() - i * 86400000),
      });
    }

    return coverage;
  }

  // Test helper methods
  getTransactionCount(): number {
    return this.transactionCount;
  }

  getQueryLog(): string[] {
    return this.queryLog;
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.latencyMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.latencyMs)
      );
    }
  }

  private shouldFail(): boolean {
    return this.rng() * 100 < (this.config.failureRate ?? 0);
  }

  private generateRealisticRows(): any[] {
    const count = Math.floor(this.rng() * 10);
    const rows = [];

    for (let i = 0; i < count; i++) {
      rows.push({
        id: i + 1,
        name: `Item ${i}`,
        timestamp: new Date(),
        created_at: new Date(),
        metadata: { index: i },
      });
    }

    return rows;
  }
}

/**
 * Realistic Redis mock with TTL and memory simulation
 */
export class RealisticRedisMock implements IRedisService {
  private initialized = false;
  private config: MockConfig;
  private store: Map<string, { value: string; ttl?: number; setAt: number }> =
    new Map();
  private rngState: number = 1 >>> 0;

  private rng(): number {
    this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
    return (this.rngState >>> 8) / 0x01000000;
  }

  constructor(config: MockConfig = {}) {
    this.config = {
      failureRate: config.failureRate ?? 0,
      latencyMs: config.latencyMs ?? 0,
      connectionFailures: config.connectionFailures ?? false,
      transactionFailures: config.transactionFailures ?? false,
      dataCorruption: config.dataCorruption ?? false,
    };
    if (typeof config.seed === "number") {
      this.rngState = config.seed >>> 0;
    }
  }

  async initialize(): Promise<void> {
    if (this.config.connectionFailures && this.rng() < 0.2) {
      throw new Error("Redis connection failed: Connection timeout");
    }

    await this.simulateLatency();
    this.initialized = true;
  }

  async close(): Promise<void> {
    await this.simulateLatency();
    this.initialized = false;
    this.store.clear();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async get(key: string): Promise<string | null> {
    if (!this.initialized) {
      throw new Error("Redis not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error("Redis GET failed: Connection reset");
    }

    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check TTL expiry
    if (item.ttl && Date.now() - item.setAt > item.ttl * 1000) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.initialized) {
      throw new Error("Redis not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error("Redis SET failed: Out of memory");
    }

    // Simulate memory limit
    if (this.store.size > 1000 && this.rng() < 0.1) {
      throw new Error("Redis memory limit exceeded");
    }

    this.store.set(key, {
      value,
      ttl,
      setAt: Date.now(),
    });
  }

  async del(key: string): Promise<number> {
    if (!this.initialized) {
      throw new Error("Redis not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error("Redis DEL failed: Command timeout");
    }

    const existed = this.store.has(key);
    this.store.delete(key);

    return existed ? 1 : 0;
  }

  async flushDb(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Redis not initialized");
    }

    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error("Redis FLUSH failed: Command timeout");
    }

    this.store.clear();
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized && this.rng() > 0.1;
  }

  // Test helper methods
  getStoreSize(): number {
    return this.store.size;
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.latencyMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.latencyMs)
      );
    }
  }

  private shouldFail(): boolean {
    return this.rng() * 100 < (this.config.failureRate ?? 0);
  }
}
