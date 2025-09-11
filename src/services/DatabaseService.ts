/**
 * Database Service for Memento
 * Orchestrates specialized database services for FalkorDB, Qdrant, PostgreSQL, and Redis
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import {
  DatabaseConfig,
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  IRedisService,
  IDatabaseHealthCheck,
} from "./database";
import { FalkorDBService } from "./database/FalkorDBService.js";
import { QdrantService } from "./database/QdrantService.js";
import { PostgreSQLService } from "./database/PostgreSQLService.js";
import { RedisService } from "./database/RedisService.js";

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
  falkorFactory?: (cfg: DatabaseConfig["falkordb"]) => IFalkorDBService;
  qdrantFactory?: (cfg: DatabaseConfig["qdrant"]) => IQdrantService;
  postgresFactory?: (cfg: DatabaseConfig["postgresql"]) => IPostgreSQLService;
  redisFactory?: (cfg: NonNullable<DatabaseConfig["redis"]>) => IRedisService;
};

export class DatabaseService {
  private falkorDBService!: IFalkorDBService;
  private qdrantService!: IQdrantService;
  private postgresqlService!: IPostgreSQLService;
  private redisService?: IRedisService;
  private initialized = false;
  private initializing = false;
  private initializationPromise?: Promise<void>;

  // Optional factories for dependency injection (testing and customization)
  private readonly falkorFactory?: DatabaseServiceDeps["falkorFactory"];
  private readonly qdrantFactory?: DatabaseServiceDeps["qdrantFactory"];
  private readonly postgresFactory?: DatabaseServiceDeps["postgresFactory"];
  private readonly redisFactory?: DatabaseServiceDeps["redisFactory"];

  constructor(private config: DatabaseConfig, deps: DatabaseServiceDeps = {}) {
    this.falkorFactory = deps.falkorFactory;
    this.qdrantFactory = deps.qdrantFactory;
    this.postgresFactory = deps.postgresFactory;
    this.redisFactory = deps.redisFactory;
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }

  getFalkorDBService(): IFalkorDBService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.falkorDBService;
  }

  getQdrantService(): IQdrantService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.qdrantService;
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

  // Direct client/pool getters for convenience
  getFalkorDBClient(): any {
    if (!this.initialized) {
      return undefined;
    }
    return this.falkorDBService.getClient();
  }

  getQdrantClient(): QdrantClient {
    if (!this.initialized) {
      return undefined as any;
    }
    return this.qdrantService.getClient();
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
        | IFalkorDBService
        | IQdrantService
        | IPostgreSQLService
        | IRedisService;
      close: () => Promise<void>;
    }> = [];

    try {
      // Initialize specialized services
      this.falkorDBService = this.falkorFactory
        ? this.falkorFactory(this.config.falkordb)
        : new FalkorDBService(this.config.falkordb);
      this.qdrantService = this.qdrantFactory
        ? this.qdrantFactory(this.config.qdrant)
        : new QdrantService(this.config.qdrant);
      this.postgresqlService = this.postgresFactory
        ? this.postgresFactory(this.config.postgresql)
        : new PostgreSQLService(this.config.postgresql);

      // Initialize each service and track successful initializations
      if (typeof (this.falkorDBService as any)?.initialize === "function") {
        await this.falkorDBService.initialize();
      }
      if (typeof (this.falkorDBService as any)?.close === "function") {
        initializedServices.push({
          service: this.falkorDBService,
          close: () => this.falkorDBService.close(),
        });
      }

      if (typeof (this.qdrantService as any)?.initialize === "function") {
        await this.qdrantService.initialize();
        // Initialize Qdrant collections after service is ready
        if (
          typeof (this.qdrantService as any)?.setupCollections === "function"
        ) {
          await this.qdrantService.setupCollections();
        }
      }
      if (typeof (this.qdrantService as any)?.close === "function") {
        initializedServices.push({
          service: this.qdrantService,
          close: () => this.qdrantService.close(),
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
          initializedServices.push({
            service: this.redisService,
            close: () => this.redisService.close(),
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
      this.falkorDBService = undefined as any;
      this.qdrantService = undefined as any;
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
      this.falkorDBService &&
      typeof (this.falkorDBService as any).isInitialized === "function" &&
      this.falkorDBService.isInitialized()
    ) {
      closePromises.push(
        this.falkorDBService
          .close()
          .catch((error) =>
            console.error("❌ Error closing FalkorDB service:", error)
          )
      );
    }

    if (
      this.qdrantService &&
      typeof (this.qdrantService as any).isInitialized === "function" &&
      this.qdrantService.isInitialized()
    ) {
      closePromises.push(
        this.qdrantService
          .close()
          .catch((error) =>
            console.error("❌ Error closing Qdrant service:", error)
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
    this.falkorDBService = undefined as any;
    this.qdrantService = undefined as any;
    this.postgresqlService = undefined as any;
    this.redisService = undefined;

    // Clear singleton instance if this is the singleton
    if (typeof databaseService !== "undefined" && databaseService === this) {
      databaseService = null as any;
    }

    console.log("✅ All database connections closed");
  }

  // FalkorDB operations
  async falkordbQuery(
    query: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.falkorDBService.query(query, params);
  }

  async falkordbCommand(...args: any[]): Promise<FalkorDBQueryResult> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.falkorDBService.command(...args);
  }

  // Qdrant operations
  get qdrant(): QdrantClient {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.qdrantService.getClient();
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

  // Health checks
  async healthCheck(): Promise<IDatabaseHealthCheck> {
    // Return early if not initialized
    if (!this.initialized) {
      return {
        falkordb: { status: "unhealthy" },
        qdrant: { status: "unhealthy" },
        postgresql: { status: "unhealthy" },
        redis: undefined,
      };
    }

    // Run all health checks in parallel for better performance
    const healthCheckPromises = [
      this.falkorDBService.healthCheck().catch(() => false),
      this.qdrantService.healthCheck().catch(() => false),
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
      falkordb: toStatus(
        settledResults[0].status === "fulfilled"
          ? settledResults[0].value
          : false
      ),
      qdrant: toStatus(
        settledResults[1].status === "fulfilled"
          ? settledResults[1].value
          : false
      ),
      postgresql: toStatus(
        settledResults[2].status === "fulfilled"
          ? settledResults[2].value
          : false
      ),
      redis:
        settledResults[3].status === "fulfilled"
          ? toStatus(settledResults[3].value)
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
      this.falkorDBService.setupGraph(),
      this.qdrantService.setupCollections(),
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
    days: number = 30
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getPerformanceMetricsHistory(entityId, days);
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
    falkordb: {
      url:
        process.env.FALKORDB_URL ||
        (isTest ? "redis://localhost:6380" : "redis://localhost:6379"),
      database: isTest ? 1 : 0, // Use different database for tests
    },
    qdrant: {
      url:
        process.env.QDRANT_URL ||
        (isTest ? "http://localhost:6335" : "http://localhost:6333"),
      apiKey: process.env.QDRANT_API_KEY,
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
    falkordb: {
      url: "redis://localhost:6380",
      database: 1,
    },
    qdrant: {
      url: "http://localhost:6335",
      apiKey: undefined,
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
