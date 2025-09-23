/**
 * Database Service for Memento
 * Orchestrates specialized database services for FalkorDB, Qdrant, PostgreSQL, and Redis
 */

import {
  DatabaseConfig,
  INeo4jService,
  IPostgreSQLService,
  IRedisService,
  IDatabaseHealthCheck,
} from "../database/index.js";
import type { BulkQueryMetrics } from "../database/index.js";
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
} from "../../models/types.js";
import type { PerformanceRelationship } from "../../models/relationships.js";
import { Neo4jService } from "../database/Neo4jService.js";
import { PostgreSQLService } from "../database/PostgreSQLService.js";
import { RedisService } from "../database/RedisService.js";
export type { DatabaseConfig } from "../database/index.js";

// Type definitions for better type safety
export interface DatabaseQueryResult {
  rows?: any[];
  rowCount?: number;
  fields?: any[];
}

export interface FalkorDBQueryResult {
  headers?: any[];
  data?: any[];
  statistics?: any;
}

export interface TestSuiteResult {
  id?: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: Date;
  testResults: TestResult[];
}

export interface TestResult {
  id?: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

export interface FlakyTestAnalysis {
  testId: string;
  testName: string;
  failureCount: number;
  totalRuns: number;
  lastFailure: Date;
  failurePatterns: string[];
}

export type DatabaseServiceDeps = {
  neo4jFactory?: (cfg: DatabaseConfig["neo4j"]) => INeo4jService;
  postgresFactory?: (cfg: DatabaseConfig["postgresql"]) => IPostgreSQLService;
  redisFactory?: (cfg: NonNullable<DatabaseConfig["redis"]>) => IRedisService;
};

export class DatabaseService {
  private neo4jService!: INeo4jService;
  private postgresqlService!: IPostgreSQLService;
  private redisService?: IRedisService;
  private initialized = false;
  private initializing = false;
  private initializationPromise?: Promise<void>;

  // Optional factories for dependency injection (testing and customization)
  private readonly neo4jFactory?: DatabaseServiceDeps["neo4jFactory"];
  private readonly postgresFactory?: DatabaseServiceDeps["postgresFactory"];
  private readonly redisFactory?: DatabaseServiceDeps["redisFactory"];

  constructor(private config: DatabaseConfig, deps: DatabaseServiceDeps = {}) {
    this.neo4jFactory = deps.neo4jFactory;
    this.postgresFactory = deps.postgresFactory;
    this.redisFactory = deps.redisFactory;
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }

  getNeo4jService(): INeo4jService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService;
  }

  getPostgreSQLService(): IPostgreSQLService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService;
  }

  getRedisService(): IRedisService | undefined {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.redisService;
  }

  // Backward compatibility methods for migration
  getFalkorDBService(): INeo4jService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService;
  }

  getQdrantService(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    // Return a compatibility wrapper that provides a getClient() method
    return {
      getClient: () => this.qdrant,
    };
  }

  getQdrantClient(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.qdrant;
  }

  // Direct client/pool getters for convenience
  getNeo4jDriver(): any {
    if (!this.initialized) {
      return undefined;
    }
    return this.neo4jService.getDriver();
  }

  getPostgresPool(): any {
    if (!this.initialized) {
      return undefined;
    }
    return this.postgresqlService.getPool();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Prevent concurrent initialization
    if (this.initializing) {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
      throw new Error("Initialization already in progress");
    }

    // Create the promise first, then set the flag
    this.initializationPromise = this._initialize();
    this.initializing = true;

    try {
      await this.initializationPromise;
    } finally {
      this.initializing = false;
      this.initializationPromise = undefined;
    }
  }

  private async _initialize(): Promise<void> {
    // Track initialized services for cleanup on failure
    const initializedServices: Array<{
      service:
        | INeo4jService
        | IPostgreSQLService
        | IRedisService;
      close: () => Promise<void>;
    }> = [];

    try {
      // Initialize specialized services
      this.neo4jService = this.neo4jFactory
        ? this.neo4jFactory(this.config.neo4j)
        : new Neo4jService(this.config.neo4j);
      this.postgresqlService = this.postgresFactory
        ? this.postgresFactory(this.config.postgresql)
        : new PostgreSQLService(this.config.postgresql);

      // Initialize Neo4j service and track successful initializations
      if (typeof (this.neo4jService as any)?.initialize === "function") {
        await this.neo4jService.initialize();
        // Setup graph constraints and vector indexes after service is ready
        if (typeof (this.neo4jService as any)?.setupGraph === "function") {
          await this.neo4jService.setupGraph();
        }
        if (typeof (this.neo4jService as any)?.setupVectorIndexes === "function") {
          await this.neo4jService.setupVectorIndexes();
        }
      }
      if (typeof (this.neo4jService as any)?.close === "function") {
        initializedServices.push({
          service: this.neo4jService,
          close: () => this.neo4jService.close(),
        });
      }

      if (typeof (this.postgresqlService as any)?.initialize === "function") {
        await this.postgresqlService.initialize();
      }
      if (typeof (this.postgresqlService as any)?.close === "function") {
        initializedServices.push({
          service: this.postgresqlService,
          close: () => this.postgresqlService.close(),
        });
      }

      // Initialize Redis (optional, for caching)
      if (this.config.redis) {
        this.redisService = this.redisFactory
          ? this.redisFactory(this.config.redis)
          : new RedisService(this.config.redis);
        if (typeof (this.redisService as any)?.initialize === "function") {
          await this.redisService.initialize();
        }
        if (typeof (this.redisService as any)?.close === "function") {
          const redisRef = this.redisService;
          initializedServices.push({
            service: redisRef as any,
            close: () => (redisRef as any).close(),
          });
        }
      }

      this.initialized = true;
      console.log("✅ All database connections established");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);

      // Cleanup already initialized services
      const cleanupPromises = initializedServices.map(({ close }) =>
        close().catch((cleanupError) =>
          console.error("❌ Error during cleanup:", cleanupError)
        )
      );

      await Promise.allSettled(cleanupPromises);

      // Reset service references
      this.neo4jService = undefined as any;
      this.postgresqlService = undefined as any;
      this.redisService = undefined;

      // In test environments, allow initialization to proceed for offline tests
      if (process.env.NODE_ENV === "test") {
        console.warn(
          "⚠️ Test environment: continuing despite initialization failure"
        );
        return; // resolve without throwing to allow unit tests that don't require live connections
      }

      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Collect all close operations
    const closePromises: Promise<void>[] = [];

    if (
      this.neo4jService &&
      typeof (this.neo4jService as any).isInitialized === "function" &&
      this.neo4jService.isInitialized()
    ) {
      closePromises.push(
        this.neo4jService
          .close()
          .catch((error) =>
            console.error("❌ Error closing Neo4j service:", error)
          )
      );
    }

    if (
      this.postgresqlService &&
      typeof (this.postgresqlService as any).isInitialized === "function" &&
      this.postgresqlService.isInitialized()
    ) {
      closePromises.push(
        this.postgresqlService
          .close()
          .catch((error) =>
            console.error("❌ Error closing PostgreSQL service:", error)
          )
      );
    }

    if (
      this.redisService &&
      typeof (this.redisService as any).isInitialized === "function" &&
      this.redisService.isInitialized()
    ) {
      closePromises.push(
        this.redisService
          .close()
          .catch((error) =>
            console.error("❌ Error closing Redis service:", error)
          )
      );
    }

    // Wait for all close operations to complete (or fail)
    await Promise.allSettled(closePromises);

    // Reset state
    this.initialized = false;
    this.neo4jService = undefined as any;
    this.postgresqlService = undefined as any;
    this.redisService = undefined;

    // Clear singleton instance if this is the singleton
    if (typeof databaseService !== "undefined" && databaseService === this) {
      databaseService = null as any;
    }

    console.log("✅ All database connections closed");
  }

  // Neo4j graph operations (backwards compatible with FalkorDB interface)
  async falkordbQuery(
    query: string,
    params: Record<string, any> = {},
    options: { graph?: string } = {}
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    const result = await this.neo4jService.query(query, params, { database: options.graph });
    // Convert Neo4j result to FalkorDB format
    return {
      headers: result.records.length > 0 ? Object.keys(result.records[0].toObject()) : [],
      data: result.records.map(r => Object.values(r.toObject())),
      statistics: result.summary,
    };
  }

  async falkordbCommand(...args: any[]): Promise<FalkorDBQueryResult> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.command(...args);
  }

  // Neo4j vector operations (replaces Qdrant)
  async upsertVector(
    collection: string,
    id: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.upsertVector(collection, id, vector, metadata);
  }

  async searchVector(
    collection: string,
    vector: number[],
    limit?: number,
    filter?: Record<string, any>
  ): Promise<Array<{ id: string; score: number; metadata?: any }>> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.searchVector(collection, vector, limit, filter);
  }

  async scrollVectors(
    collection: string,
    limit?: number,
    offset?: number
  ): Promise<{ points: Array<{ id: string; vector: number[]; metadata?: any }>; total: number }> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.scrollVectors(collection, limit, offset);
  }

  // Qdrant compatibility shim
  get qdrant(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    // Return a compatibility wrapper for Qdrant operations
    return {
      upsert: async (collection: string, data: any) => {
        const { points } = data;
        for (const point of points) {
          await this.neo4jService.upsertVector(
            collection,
            point.id,
            point.vector,
            point.payload
          );
        }
      },
      search: async (collection: string, params: any) => {
        return this.neo4jService.searchVector(
          collection,
          params.vector,
          params.limit,
          params.filter
        );
      },
      scroll: async (collection: string, params: any) => {
        return this.neo4jService.scrollVectors(
          collection,
          params.limit,
          params.offset
        );
      },
      delete: async (collection: string, params: any) => {
        const ids = params.points || [];
        for (const id of ids) {
          await this.neo4jService.deleteVector(collection, id);
        }
      },
      getCollections: async () => {
        // Return standard collections
        return {
          collections: [
            { name: "code_embeddings" },
            { name: "documentation_embeddings" },
            { name: "integration_test" },
          ],
        };
      },
    };
  }

  // PostgreSQL operations
  async postgresQuery(
    query: string,
    params: any[] = [],
    options: { timeout?: number } = {}
  ): Promise<DatabaseQueryResult> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.query(query, params, options);
  }

  async postgresTransaction<T>(
    callback: (client: any) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.transaction(callback, options);
  }

  // Redis operations (optional caching)
  async redisGet(key: string): Promise<string | null> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.get(key);
  }

  async redisSet(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.set(key, value, ttl);
  }

  async redisDel(key: string): Promise<number> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.del(key);
  }

  async redisFlushDb(): Promise<void> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    await this.redisService.flushDb();
  }

  // Health checks
  async healthCheck(): Promise<IDatabaseHealthCheck> {
    // Return early if not initialized
    if (!this.initialized) {
      return {
        neo4j: { status: "unhealthy" },
        postgresql: { status: "unhealthy" },
        redis: undefined,
      };
    }

    // Run all health checks in parallel for better performance
    const healthCheckPromises = [
      this.neo4jService.healthCheck().catch(() => false),
      this.postgresqlService.healthCheck().catch(() => false),
      this.redisService?.healthCheck().catch(() => undefined) ??
        Promise.resolve(undefined),
    ];

    const settledResults = await Promise.allSettled(healthCheckPromises);

    const toStatus = (v: any) =>
      v === true
        ? { status: "healthy" as const }
        : v === false
        ? { status: "unhealthy" as const }
        : { status: "unknown" as const };

    return {
      neo4j: toStatus(
        settledResults[0].status === "fulfilled"
          ? settledResults[0].value
          : false
      ),
      postgresql: toStatus(
        settledResults[1].status === "fulfilled"
          ? settledResults[1].value
          : false
      ),
      redis:
        settledResults[2].status === "fulfilled"
          ? toStatus(settledResults[2].value)
          : undefined,
    };
  }

  // Database setup and migrations
  async setupDatabase(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    console.log("🔧 Setting up database schema...");

    // Setup each database service
    await Promise.all([
      this.postgresqlService.setupSchema(),
      this.neo4jService.setupGraph(),
      this.neo4jService.setupVectorIndexes(),
    ]);

    console.log("✅ Database schema setup complete");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Store test suite execution results
   */
  async storeTestSuiteResult(suiteResult: TestSuiteResult): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.storeTestSuiteResult(suiteResult);
  }

  /**
   * Store flaky test analyses
   */
  async storeFlakyTestAnalyses(analyses: FlakyTestAnalysis[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.storeFlakyTestAnalyses(analyses);
  }

  /**
   * Execute bulk PostgreSQL operations efficiently
   */
  async postgresBulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options: { continueOnError?: boolean } = {}
  ): Promise<DatabaseQueryResult[]> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.bulkQuery(queries, options);
  }

  getPostgresBulkWriterMetrics(): BulkQueryMetrics {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    const metrics = this.postgresqlService.getBulkWriterMetrics();
    return {
      ...metrics,
      lastBatch: metrics.lastBatch ? { ...metrics.lastBatch } : null,
      history: metrics.history.map((entry) => ({ ...entry })),
      slowBatches: metrics.slowBatches.map((entry) => ({ ...entry })),
    };
  }

  /**
   * Get test execution history for an entity
   */
  async getTestExecutionHistory(
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getTestExecutionHistory(entityId, limit);
  }

  /**
   * Get performance metrics history
   */
  async getPerformanceMetricsHistory(
    entityId: string,
    options?: number | PerformanceHistoryOptions
  ): Promise<PerformanceHistoryRecord[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getPerformanceMetricsHistory(
      entityId,
      options
    );
  }

  async recordPerformanceMetricSnapshot(
    snapshot: PerformanceRelationship
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    await this.postgresqlService.recordPerformanceMetricSnapshot(snapshot);
  }

  async recordSCMCommit(commit: SCMCommitRecord): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.recordSCMCommit) {
      throw new Error("PostgreSQL service does not implement recordSCMCommit");
    }
    await this.postgresqlService.recordSCMCommit(commit);
  }

  async getSCMCommitByHash(
    commitHash: string
  ): Promise<SCMCommitRecord | null> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.getSCMCommitByHash) {
      throw new Error(
        "PostgreSQL service does not implement getSCMCommitByHash"
      );
    }
    return this.postgresqlService.getSCMCommitByHash(commitHash);
  }

  async listSCMCommits(limit: number = 50): Promise<SCMCommitRecord[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.listSCMCommits) {
      throw new Error(
        "PostgreSQL service does not implement listSCMCommits"
      );
    }
    return this.postgresqlService.listSCMCommits(limit);
  }

  /**
   * Get coverage history
   */
  async getCoverageHistory(
    entityId: string,
    days: number = 30
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getCoverageHistory(entityId, days);
  }
}

// DatabaseConfig is already imported above and used throughout the file

// Singleton instance
let databaseService: DatabaseService | null = null;

export function getDatabaseService(config?: DatabaseConfig): DatabaseService {
  if (!databaseService) {
    if (!config) {
      throw new Error("Database config required for first initialization");
    }
    databaseService = new DatabaseService(config);
  }
  return databaseService;
}

export function createDatabaseConfig(): DatabaseConfig {
  // Check if we're in test environment
  const isTest = process.env.NODE_ENV === "test";

  return {
    neo4j: {
      uri:
        process.env.NEO4J_URI ||
        (isTest ? "bolt://localhost:7688" : "bolt://localhost:7687"),
      username: process.env.NEO4J_USER || "neo4j",
      password: process.env.NEO4J_PASSWORD || "memento123",
      database: process.env.NEO4J_DATABASE || (isTest ? "memento_test" : "neo4j"),
    },
    postgresql: {
      connectionString:
        process.env.DATABASE_URL ||
        (isTest
          ? "postgresql://memento_test:memento_test@localhost:5433/memento_test"
          : "postgresql://memento:memento@localhost:5432/memento"),
      max: parseInt(process.env.DB_MAX_CONNECTIONS || (isTest ? "10" : "30")), // Increased pool size for better concurrency
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "5000"
      ), // Add connection timeout
    },
    redis: process.env.REDIS_URL
      ? {
          url: process.env.REDIS_URL,
        }
      : isTest
      ? { url: "redis://localhost:6381" }
      : undefined,
  };
}

export function createTestDatabaseConfig(): DatabaseConfig {
  return {
    neo4j: {
      uri: "bolt://localhost:7688",
      username: "neo4j",
      password: "testpassword123",
      database: "memento_test",
    },
    postgresql: {
      connectionString:
        "postgresql://memento_test:memento_test@localhost:5433/memento_test",
      max: 10, // Increased for better performance test concurrency
      idleTimeoutMillis: 5000, // Reduced for tests
      connectionTimeoutMillis: 5000, // Add connection timeout
    },
    redis: {
      url: "redis://localhost:6381",
    },
  };
}
