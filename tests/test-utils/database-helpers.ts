/**
 * Database test utilities and helpers
 * Provides common setup and teardown functions for database tests
 */

import {
  DatabaseService,
  DatabaseConfig,
} from "../../src/services/core/DatabaseService";
import { v4 as uuidv4 } from "uuid";
import { KnowledgeGraphService } from "../../src/services/knowledge/KnowledgeGraphService.js";
import { RelationshipType } from "../../src/models/relationships.js";
import { setupOGMServices, ComparisonTestSetup, OGMTestSetup } from "./ogm-helpers.js";

// Integration test utilities for services that need to use database isolation
export interface IsolatedTestSetup {
  dbService: DatabaseService;
  testContext: TestIsolationContext;
  kgService: KnowledgeGraphService;
}

// Extended setup with OGM services for comprehensive testing
export interface IsolatedOGMTestSetup extends IsolatedTestSetup {
  ogmServices: OGMTestSetup;
}

// Legacy comparison setup - deprecated since OGM migration
// @deprecated Use IsolatedOGMTestSetup instead
export interface IsolatedComparisonTestSetup extends IsolatedTestSetup {
  comparisonServices: ComparisonTestSetup;
}

/**
 * Setup isolated test environment for a service test
 * Provides clean database isolation for each test suite
 */
export async function setupIsolatedServiceTest(
  serviceName: string,
  options: { silent?: boolean } = {}
): Promise<IsolatedTestSetup> {
  const dbService = await initializeSharedTestDatabase(options);
  const testContext = await createTestIsolationContext(dbService, {
    name: serviceName,
    silent: options.silent,
  });

  const kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
  await kgService.initialize();

  return { dbService, testContext, kgService };
}

/**
 * Cleanup isolated test environment
 */
export async function cleanupIsolatedServiceTest(
  setup: IsolatedTestSetup,
  options: { silent?: boolean } = {}
): Promise<void> {
  await cleanupTestIsolationContext(
    setup.dbService,
    setup.testContext,
    options
  );
}

/**
 * Setup isolated test environment with OGM services
 */
export async function setupIsolatedOGMTest(
  serviceName: string,
  options: { silent?: boolean } = {}
): Promise<IsolatedOGMTestSetup> {
  const baseSetup = await setupIsolatedServiceTest(serviceName, options);
  const ogmServices = await setupOGMServices(baseSetup.dbService, baseSetup.testContext);

  return {
    ...baseSetup,
    ogmServices,
  };
}

/**
 * Setup isolated test environment with both legacy and OGM services for comparison
 * @deprecated Use setupIsolatedOGMTest instead - legacy comparison no longer needed
 */
export async function setupIsolatedComparisonTest(
  serviceName: string,
  options: { silent?: boolean } = {}
): Promise<IsolatedComparisonTestSetup> {
  const baseSetup = await setupIsolatedServiceTest(serviceName, options);

  // Setup OGM services
  const ogmServices = await setupOGMServices(baseSetup.dbService, baseSetup.testContext);

  const comparisonServices: ComparisonTestSetup = {
    ...ogmServices,
    legacyKgService: baseSetup.kgService,
  };

  return {
    ...baseSetup,
    comparisonServices,
  };
}

/**
 * Cleanup isolated OGM test environment
 */
export async function cleanupIsolatedOGMTest(
  setup: IsolatedOGMTestSetup,
  options: { silent?: boolean } = {}
): Promise<void> {
  // Close OGM services if they have cleanup methods
  if (setup.ogmServices.neogmaService && typeof setup.ogmServices.neogmaService.close === 'function') {
    await setup.ogmServices.neogmaService.close();
  }

  await cleanupIsolatedServiceTest(setup, options);
}

/**
 * Cleanup isolated comparison test environment
 * @deprecated Use cleanupIsolatedOGMTest instead
 */
export async function cleanupIsolatedComparisonTest(
  setup: IsolatedComparisonTestSetup,
  options: { silent?: boolean } = {}
): Promise<void> {
  // Close OGM services if they have cleanup methods
  if (setup.comparisonServices.neogmaService && typeof setup.comparisonServices.neogmaService.close === 'function') {
    await setup.comparisonServices.neogmaService.close();
  }

  await cleanupIsolatedServiceTest(setup, options);
}

export interface ClearTestDataOptions {
  includePostgres?: boolean;
  includeGraph?: boolean;
  includeVector?: boolean;
  includeCache?: boolean;
  postgresTables?: string[];
  silent?: boolean;
}

const DEFAULT_POSTGRES_TABLES = [
  "test_coverage",
  "test_performance",
  "test_results",
  "test_suites",
  "flaky_test_analyses",
  "changes",
  "scm_commits",
  "sessions",
  "documents",
  "performance_metric_snapshots",
  "coverage_history",
];

const POSTGRES_FIXTURE_LOCK_KEY = 0xc0def11;

export const TEST_FIXTURE_IDS = {
  documents: {
    code: "00000000-0000-4000-8000-000000000001",
    documentation: "00000000-0000-4000-8000-000000000002",
  },
  falkorEntities: {
    typescriptFile: "00000000-0000-4000-8000-000000000101",
    javascriptFile: "00000000-0000-4000-8000-000000000102",
    pythonFile: "00000000-0000-4000-8000-000000000103",
    goFile: "00000000-0000-4000-8000-000000000104",
    rustFile: "00000000-0000-4000-8000-000000000105",
    typescriptFunction: "00000000-0000-4000-8000-000000000201",
  },
};

// Test database configuration using test containers
export const TEST_DATABASE_CONFIG: DatabaseConfig = {
  falkordb: {
    url: process.env.FALKORDB_URL || "redis://localhost:6380",
    database: 1, // Use separate database for tests
  },
  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6335",
    apiKey: process.env.QDRANT_API_KEY,
  },
  postgresql: {
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://memento_test:memento_test@localhost:5433/memento_test",
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "5"),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
  },
  redis: process.env.REDIS_URL
    ? {
        url: process.env.REDIS_URL,
      }
    : {
        url: "redis://localhost:6381",
      },
};

// Test isolation context for shared database approach
export interface TestIsolationContext {
  id: string;
  postgresSchema: string;
  falkorGraph: string;
  qdrantPrefix: string;
  redisPrefix: string;
  entityPrefix: string;
  created: Date;
}

// Global shared database service instance
let SHARED_DATABASE_SERVICE: DatabaseService | null = null;
let SHARED_DATABASE_INITIALIZED = false;

// Track active test contexts for cleanup
const ACTIVE_TEST_CONTEXTS = new Map<string, TestIsolationContext>();

// Global setup for integration tests
let GLOBAL_SETUP_COMPLETE = false;

/**
 * Global setup for all integration tests
 * Should be called once at the beginning of the test run
 */
export async function setupGlobalIntegrationTests(
  options: { silent?: boolean } = {}
): Promise<void> {
  if (GLOBAL_SETUP_COMPLETE) {
    return;
  }

  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;

  log("🚀 Setting up global integration test environment...");

  // Initialize shared database
  await initializeSharedTestDatabase({ silent });

  GLOBAL_SETUP_COMPLETE = true;
  log("✅ Global integration test setup complete");
}

/**
 * Global teardown for all integration tests
 * Should be called once at the end of the test run
 */
export async function teardownGlobalIntegrationTests(
  options: { silent?: boolean } = {}
): Promise<void> {
  if (!GLOBAL_SETUP_COMPLETE) {
    return;
  }

  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;

  log("🛑 Tearing down global integration test environment...");

  // Clean up all active contexts
  await cleanupAllTestContexts({ silent });

  // Shutdown shared database
  await shutdownSharedTestDatabase();

  GLOBAL_SETUP_COMPLETE = false;
  log("✅ Global integration test teardown complete");
}

/**
 * Generate unique test context ID
 */
export function generateTestContextId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

/**
 * Create isolated test context within shared database
 */
export async function createTestIsolationContext(
  dbService: DatabaseService,
  options: { name?: string; silent?: boolean } = {}
): Promise<TestIsolationContext> {
  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  const contextId = generateTestContextId();
  const name = options.name || contextId;

  log(`🔧 Creating isolated test context: ${name}`);

  const context: TestIsolationContext = {
    id: contextId,
    postgresSchema: `test_${contextId}`,
    falkorGraph: `test_${contextId}`,
    qdrantPrefix: `test_${contextId}_`,
    redisPrefix: `test:${contextId}:`,
    entityPrefix: `test_${contextId}_`,
    created: new Date(),
  };

  try {
    // Create PostgreSQL schema for isolation
    await dbService.postgresTransaction(async (client) => {
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS ${context.postgresSchema}`
      );
      // Clone base schema structure if needed
      await client.query(`
        SET search_path TO ${context.postgresSchema};
        -- Create any test-specific tables or constraints here
      `);
    });

    // Create FalkorDB named graph
    await dbService.falkordbCommand(
      "GRAPH.QUERY",
      context.falkorGraph,
      "RETURN 1"
    );

    // Ensure Qdrant collections exist with prefix
    const requiredCollections = [
      `${context.qdrantPrefix}code_embeddings`,
      `${context.qdrantPrefix}documentation_embeddings`,
    ];

    for (const collectionName of requiredCollections) {
      try {
        await dbService.qdrant.createCollection(collectionName, {
          vectors: { size: 1536, distance: "Cosine" },
        });
      } catch (error) {
        // Collection might already exist, that's ok
        warn(`⚠️ Could not create Qdrant collection ${collectionName}:`, error);
      }
    }

    // Redis isolation is handled via key prefixes (no setup needed)

    ACTIVE_TEST_CONTEXTS.set(contextId, context);
    log(`✅ Test context ${name} created successfully`);
  } catch (error) {
    warn(`⚠️ Failed to create test context ${name}:`, error);
    throw error;
  }

  return context;
}

/**
 * Clean up isolated test context
 */
export async function cleanupTestIsolationContext(
  dbService: DatabaseService,
  context: TestIsolationContext,
  options: { silent?: boolean } = {}
): Promise<void> {
  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  log(`🧹 Cleaning up test context: ${context.id}`);

  try {
    // Drop PostgreSQL schema
    await dbService.postgresTransaction(async (client) => {
      await client.query(
        `DROP SCHEMA IF EXISTS ${context.postgresSchema} CASCADE`
      );
    });

    // Delete FalkorDB graph
    await dbService.falkordbCommand("GRAPH.DELETE", context.falkorGraph);

    // Delete Qdrant collections with prefix
    const collectionsResponse = await dbService.qdrant.getCollections();
    const collectionsToDelete =
      collectionsResponse.collections
        ?.filter((collection) =>
          collection.name.startsWith(context.qdrantPrefix)
        )
        ?.map((collection) => collection.name) || [];

    for (const collectionName of collectionsToDelete) {
      try {
        await dbService.qdrant.deleteCollection(collectionName);
      } catch (error) {
        warn(`⚠️ Could not delete Qdrant collection ${collectionName}:`, error);
      }
    }

    // Clear Redis keys with prefix
    if (dbService.getConfig().redis) {
      const redisKeys = await dbService.redisKeys(`${context.redisPrefix}*`);
      if (redisKeys.length > 0) {
        await dbService.redisDel(redisKeys);
      }
    }

    ACTIVE_TEST_CONTEXTS.delete(context.id);
    log(`✅ Test context ${context.id} cleaned up successfully`);
  } catch (error) {
    warn(`⚠️ Failed to cleanup test context ${context.id}:`, error);
  }
}

/**
 * Initialize shared database service for all tests
 * Called once at the beginning of test suite
 */
export async function initializeSharedTestDatabase(
  options: { silent?: boolean } = {}
): Promise<DatabaseService> {
  if (SHARED_DATABASE_SERVICE && SHARED_DATABASE_INITIALIZED) {
    return SHARED_DATABASE_SERVICE;
  }

  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  log("🚀 Initializing shared test database...");

  SHARED_DATABASE_SERVICE = new DatabaseService(TEST_DATABASE_CONFIG);

  try {
    await SHARED_DATABASE_SERVICE.initialize();
    log("✅ Shared database service initialized");

    const health = await SHARED_DATABASE_SERVICE.healthCheck();
    log("📊 Shared database health check:", health);

    const allCoreHealthy =
      health.falkordb?.status === "healthy" &&
      health.qdrant?.status === "healthy" &&
      health.postgresql?.status === "healthy";

    if (allCoreHealthy) {
      await SHARED_DATABASE_SERVICE.setupDatabase();
      log("✅ Shared database schema setup complete");
      SHARED_DATABASE_INITIALIZED = true;
    } else {
      warn("⚠️ Some database services are not healthy");
      warn("Health status:", health);
      throw new Error("Database services not healthy for shared testing");
    }
  } catch (error) {
    warn("❌ Shared database initialization failed:", error);
    SHARED_DATABASE_SERVICE = null;
    throw error instanceof Error ? error : new Error(String(error));
  }

  return SHARED_DATABASE_SERVICE;
}

/**
 * Get the shared database service instance
 */
export function getSharedTestDatabase(): DatabaseService {
  if (!SHARED_DATABASE_SERVICE || !SHARED_DATABASE_INITIALIZED) {
    throw new Error(
      "Shared test database not initialized. Call initializeSharedTestDatabase() first."
    );
  }
  return SHARED_DATABASE_SERVICE;
}

/**
 * Cleanup all active test contexts
 */
export async function cleanupAllTestContexts(
  options: { silent?: boolean } = {}
): Promise<void> {
  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  if (!SHARED_DATABASE_SERVICE) {
    return;
  }

  log(`🧹 Cleaning up ${ACTIVE_TEST_CONTEXTS.size} active test contexts...`);

  const cleanupPromises = Array.from(ACTIVE_TEST_CONTEXTS.values()).map(
    (context) =>
      cleanupTestIsolationContext(SHARED_DATABASE_SERVICE!, context, {
        silent: true,
      })
  );

  try {
    await Promise.allSettled(cleanupPromises);
    ACTIVE_TEST_CONTEXTS.clear();
    log("✅ All test contexts cleaned up");
  } catch (error) {
    warn("⚠️ Error during bulk cleanup:", error);
  }
}

/**
 * Shutdown shared database service
 */
export async function shutdownSharedTestDatabase(): Promise<void> {
  if (SHARED_DATABASE_SERVICE) {
    await cleanupAllTestContexts({ silent: true });

    if (SHARED_DATABASE_SERVICE.isInitialized()) {
      await SHARED_DATABASE_SERVICE.close();
    }

    SHARED_DATABASE_SERVICE = null;
    SHARED_DATABASE_INITIALIZED = false;
  }
}

/**
 * Setup database service for testing
 * Initializes and sets up the database schema
 * @deprecated Use initializeSharedTestDatabase() and createTestIsolationContext() instead
 */
export async function setupTestDatabase(
  options: { silent?: boolean } = {}
): Promise<DatabaseService> {
  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  log("🔧 Setting up test database...");

  // Initialize shared database if not already done
  if (!SHARED_DATABASE_SERVICE || !SHARED_DATABASE_INITIALIZED) {
    await initializeSharedTestDatabase({ silent });
  }

  // Return the shared database service
  return getSharedTestDatabase();
}

/**
 * Cleanup database service after testing
 */
export async function cleanupTestDatabase(
  dbService: DatabaseService
): Promise<void> {
  if (dbService && dbService.isInitialized()) {
    await dbService.close();
  }
}

/**
 * Clear all test data from databases
 * Useful for ensuring clean state between tests
 */
export async function clearTestData(
  dbService: DatabaseService,
  options: ClearTestDataOptions = {}
): Promise<void> {
  if (!dbService || !dbService.isInitialized()) {
    console.warn("Database service not initialized for test data cleanup");
    return;
  }

  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  log("🧹 Clearing test data...");

  const {
    includePostgres = true,
    includeGraph = true,
    includeVector = true,
    includeCache = true,
    postgresTables = DEFAULT_POSTGRES_TABLES,
  } = options;

  const cleanupTasks: Promise<void>[] = [];

  if (includePostgres && postgresTables.length) {
    cleanupTasks.push(
      (async () => {
        try {
          let truncatedTables: string[] | null = null;

          await dbService.postgresTransaction(async (client) => {
            await client.query("SELECT pg_advisory_xact_lock($1)", [
              POSTGRES_FIXTURE_LOCK_KEY,
            ]);

            const existing = await client.query(
              "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])",
              [postgresTables]
            );

            const existingTables = (existing.rows ?? [])
              .map((row) => row.tablename as string)
              .filter(Boolean);

            truncatedTables = existingTables;

            if (existingTables.length) {
              const truncateList = existingTables
                .map((table) => `"${table}"`)
                .join(", ");

              await client.query(
                `TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE`
              );
            }
          });

          if (truncatedTables && truncatedTables.length) {
            log("✅ Truncated PostgreSQL tables");
          } else {
            log("ℹ️ No PostgreSQL tables found to truncate");
          }
        } catch (error) {
          warn("⚠️ Could not truncate PostgreSQL tables:", error);
        }
      })()
    );
  }

  if (includeGraph) {
    cleanupTasks.push(
      (async () => {
        try {
          await dbService.falkordbCommand(
            "GRAPH.QUERY",
            "memento",
            "MATCH (n) DETACH DELETE n"
          );
          log("✅ Cleared FalkorDB graph data");
        } catch (error) {
          warn("⚠️ Could not clear FalkorDB graph data:", error);
        }
      })()
    );
  }

  if (includeVector) {
    cleanupTasks.push(
      (async () => {
        try {
          const qdrantClient = dbService.qdrant;
          const requiredCollections = new Set([
            "code_embeddings",
            "documentation_embeddings",
            "integration_test",
          ]);

          const collectionsResponse = await qdrantClient.getCollections();
          const existingCollections = collectionsResponse.collections ?? [];

          const maintenanceTasks = existingCollections.map(
            async (collection) => {
              if (requiredCollections.has(collection.name)) {
                try {
                  await qdrantClient.delete(collection.name, {
                    filter: {},
                    wait: true,
                  });
                } catch {
                  // Collection might already be empty or delete unsupported – ignore
                }
              } else {
                try {
                  await qdrantClient.deleteCollection(collection.name);
                } catch (err) {
                  warn(
                    `⚠️ Could not delete collection ${collection.name}:`,
                    err
                  );
                }
              }
            }
          );

          if (maintenanceTasks.length) {
            await Promise.all(maintenanceTasks);
          }

          const existingNames = new Set(
            (await qdrantClient.getCollections()).collections?.map(
              (c) => c.name
            ) ?? []
          );

          const ensureTasks = Array.from(requiredCollections)
            .filter((collectionName) => !existingNames.has(collectionName))
            .map(async (collectionName) => {
              try {
                await qdrantClient.createCollection(collectionName, {
                  vectors: {
                    size: 1536,
                    distance: "Cosine",
                  },
                });
                log(`✅ Created required collection: ${collectionName}`);
              } catch (error) {
                warn(
                  `⚠️ Could not create collection ${collectionName}:`,
                  error
                );
              }
            });

          if (ensureTasks.length) {
            await Promise.all(ensureTasks);
          }
        } catch (error) {
          warn("⚠️ Could not manage Qdrant collections:", error);
        }
      })()
    );
  }

  if (includeCache && dbService.getConfig().redis) {
    cleanupTasks.push(
      (async () => {
        try {
          await dbService.redisFlushDb();
          log("✅ Cleared Redis keys");
        } catch (error) {
          warn("⚠️ Could not clear Redis keys:", error);
        }
      })()
    );
  }

  if (cleanupTasks.length) {
    await Promise.all(cleanupTasks);
  }

  log("✅ Test data cleanup complete");
}

/**
 * Wait for database to be ready
 * Useful for ensuring test containers are fully started
 */
export async function waitForDatabaseReady(
  dbService: DatabaseService,
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const health = await dbService.healthCheck();

      // Check if all required databases are healthy
      if (
        health.falkordb &&
        health.qdrant &&
        health.postgresql &&
        health.redis
      ) {
        return;
      }
    } catch {
      // Database not ready yet, continue waiting
    }

    // Wait 1 second before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Database not ready within ${timeoutMs}ms`);
}

/**
 * Create test data fixtures
 */
export const TEST_FIXTURES = {
  documents: [
    {
      id: TEST_FIXTURE_IDS.documents.code,
      type: "code",
      content: { language: "typescript", code: 'console.log("test");' },
      metadata: { file: "test.ts", author: "test" },
    },
    {
      id: TEST_FIXTURE_IDS.documents.documentation,
      type: "documentation",
      content: { title: "Test Doc", content: "Test documentation content" },
      metadata: { version: "1.0", author: "test" },
    },
  ],

  sessions: [
    {
      agent_type: "test_agent",
      user_id: "test_user",
      start_time: new Date().toISOString(),
      end_time: null,
      status: "active",
      metadata: { test: true },
    },
  ],

  changes: [
    {
      change_type: "create",
      entity_type: "file",
      entity_id: "test.ts",
      timestamp: new Date().toISOString(),
      author: "test_author",
      commit_hash: "abc123",
      diff: '+ console.log("hello");',
      previous_state: null,
      new_state: { content: 'console.log("hello");' },
      session_id: null,
      spec_id: null,
    },
  ],

  testSuites: [
    {
      suiteName: "unit_tests",
      timestamp: new Date().toISOString(),
      framework: "vitest",
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
      skippedTests: 0,
      duration: 1000,
    },
  ],

  testResults: [
    {
      test_id: "test_1",
      test_suite: "unit_tests",
      test_name: "should pass",
      status: "passed",
      duration: 100,
      error_message: null,
      stack_trace: null,
      coverage: { lines: 85, branches: 80, functions: 90, statements: 85 },
      performance: { memoryUsage: 1024000, cpuUsage: 15, networkRequests: 2 },
      timestamp: new Date().toISOString(),
    },
    {
      test_id: "test_2",
      test_suite: "unit_tests",
      test_name: "should fail",
      status: "failed",
      duration: 50,
      error_message: "Assertion failed",
      stack_trace: "Error: Assertion failed\n    at test",
      coverage: null,
      performance: null,
      timestamp: new Date().toISOString(),
    },
  ],

  testPerformance: Array.from({ length: 60 }, (_, index) => ({
    test_id: `test_perf_${Math.floor(index / 3)}`,
    memory_usage: 1024000 + index * 2048,
    cpu_usage: 10 + (index % 6) * 5,
    network_requests: index % 7,
    timestamp: new Date(Date.now() - index * 60000).toISOString(),
  })),

  performanceSnapshots: Array.from({ length: 60 }, (_, index) => ({
    test_id: `perf_snapshot_test_${Math.floor(index / 4)}`,
    target_id: `entity_fixture_${index % 10}`,
    metric_id: index % 2 === 0 ? "fixtures/latency/p95" : "fixtures/latency/avg",
    scenario: index % 2 === 0 ? "load-test" : "regression-suite",
    environment: index % 3 === 0 ? "staging" : index % 3 === 1 ? "prod" : "dev",
    severity:
      index % 4 === 0
        ? "high"
        : index % 4 === 1
        ? "medium"
        : index % 4 === 2
        ? "low"
        : "critical",
    trend: index % 5 === 0 ? "regression" : index % 5 === 1 ? "improvement" : "neutral",
    unit: "ms",
    baseline_value: 100 + (index % 5) * 10,
    current_value: 130 + (index % 7) * 12,
    delta: 20 + (index % 6) * 3,
    percent_change: 10 + (index % 5) * 2,
    sample_size: 5 + (index % 8),
    risk_score: 0.5 + (index % 5) * 0.25,
    run_id: `snapshot-run-${index}`,
    detected_at: new Date(Date.now() - index * 3600000).toISOString(),
    resolved_at: index % 6 === 0 ? new Date(Date.now() - (index - 1) * 3600000).toISOString() : null,
    metadata: {
      source: "fixture",
      index,
    },
    metrics_history: [
      {
        value: 95 + index,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        environment: "staging",
        unit: "ms",
      },
      {
        value: 125 + index,
        timestamp: new Date(Date.now() - (index - 0.5) * 3600000).toISOString(),
        environment: "prod",
        unit: "ms",
      },
    ],
  })),

  flakyAnalyses: [
    {
      testId: "flaky_test_1",
      testName: "unstable test",
      flakyScore: 75.5,
      totalRuns: 100,
      failureRate: 25.0,
      successRate: 75.0,
      recentFailures: 5,
      patterns: { intermittent: true, timing_dependent: true },
      recommendations: { increase_timeout: true, add_retry: true },
    },
  ],
};

/**
 * Insert test fixtures into database
 */
export async function insertTestFixtures(
  dbService: DatabaseService
): Promise<void> {
  if (!dbService || !dbService.isInitialized()) {
    throw new Error("Database service not initialized");
  }

  await dbService.postgresTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [
      POSTGRES_FIXTURE_LOCK_KEY,
    ]);

    // Insert documents
    for (let i = 0; i < TEST_FIXTURES.documents.length; i++) {
      const doc = TEST_FIXTURES.documents[i];
      const docId = doc.id || uuidv4();
      await client.query(
        `
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `,
        [
          docId,
          doc.type,
          JSON.stringify(doc.content),
          JSON.stringify(doc.metadata),
        ]
      );
    }

    // Insert sessions
    for (const session of TEST_FIXTURES.sessions) {
      await client.query(
        "INSERT INTO sessions (agent_type, user_id, start_time, end_time, status, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          session.agent_type,
          session.user_id,
          session.start_time,
          session.end_time,
          session.status,
          JSON.stringify(session.metadata),
        ]
      );
    }

    // Insert changes
    for (const change of TEST_FIXTURES.changes) {
      await client.query(
        `
        INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, commit_hash, diff, previous_state, new_state, session_id, spec_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          change.change_type,
          change.entity_type,
          change.entity_id,
          change.timestamp,
          change.author,
          change.commit_hash,
          change.diff,
          JSON.stringify(change.previous_state),
          JSON.stringify(change.new_state),
          change.session_id,
          change.spec_id,
        ]
      );
    }

    // Insert test suites and results
    for (const suite of TEST_FIXTURES.testSuites) {
      const suiteTimestamp = new Date().toISOString();
      const suiteResult = await client.query(
        `
        INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (suite_name, timestamp) DO UPDATE SET
          framework = EXCLUDED.framework,
          total_tests = EXCLUDED.total_tests,
          passed_tests = EXCLUDED.passed_tests,
          failed_tests = EXCLUDED.failed_tests,
          skipped_tests = EXCLUDED.skipped_tests,
          duration = EXCLUDED.duration
        RETURNING id
      `,
        [
          suite.suiteName,
          suiteTimestamp,
          suite.framework,
          suite.totalTests,
          suite.passedTests,
          suite.failedTests,
          suite.skippedTests,
          suite.duration,
        ]
      );

      const suiteId = suiteResult.rows?.[0]?.id;

      if (suiteId) {
        // Insert test results for this suite
        for (const result of TEST_FIXTURES.testResults.filter(
          (r) => r.test_suite === suite.suiteName
        )) {
          await client.query(
            `
            INSERT INTO test_results (test_id, test_name, status, duration, error_message, stack_trace, timestamp, suite_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (test_id, suite_id) DO UPDATE SET
              status = EXCLUDED.status,
              duration = EXCLUDED.duration,
              error_message = EXCLUDED.error_message,
              stack_trace = EXCLUDED.stack_trace,
              timestamp = EXCLUDED.timestamp
          `,
            [
              result.test_id,
              result.test_name,
              result.status,
              result.duration,
              result.error_message,
              result.stack_trace,
              result.timestamp,
              suiteId,
            ]
          );
        }
      }
    }

    // Insert flaky analyses (idempotent to avoid unique constraint violations between runs)
    for (const analysis of TEST_FIXTURES.flakyAnalyses) {
      await client.query(
        `
        INSERT INTO flaky_test_analyses (test_id, test_name, failure_count, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (test_id) DO UPDATE SET
          test_name = EXCLUDED.test_name,
          failure_count = EXCLUDED.failure_count,
          flaky_score = EXCLUDED.flaky_score,
          total_runs = EXCLUDED.total_runs,
          failure_rate = EXCLUDED.failure_rate,
          success_rate = EXCLUDED.success_rate,
          recent_failures = EXCLUDED.recent_failures,
          patterns = EXCLUDED.patterns,
          recommendations = EXCLUDED.recommendations,
          analyzed_at = EXCLUDED.analyzed_at
      `,
        [
          analysis.testId,
          analysis.testName,
          Number(analysis.failureCount || analysis.failure_count || 0),
          Number(analysis.flakyScore || 0),
          Number(analysis.totalRuns || 0),
          Number(analysis.failureRate || 0),
          Number(analysis.successRate || 0),
          Number(analysis.recentFailures || 0),
          JSON.stringify(analysis.patterns || {}),
          JSON.stringify(analysis.recommendations || {}),
          analysis.analyzedAt ||
            analysis.analyzed_at ||
            new Date().toISOString(),
        ]
      );
    }

    // Insert test performance data
    for (const perf of TEST_FIXTURES.testPerformance) {
      await client.query(
        `
        INSERT INTO test_performance (test_id, memory_usage, cpu_usage, network_requests, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          perf.test_id,
          Number(perf.memory_usage || 0),
          Number(perf.cpu_usage || 0),
          Number(perf.network_requests || 0),
          perf.timestamp || new Date().toISOString(),
        ]
      );
    }

    for (const snapshot of TEST_FIXTURES.performanceSnapshots) {
      await client.query(
        `
        INSERT INTO performance_metric_snapshots (
          test_id,
          target_id,
          metric_id,
          scenario,
          environment,
          severity,
          trend,
          unit,
          baseline_value,
          current_value,
          delta,
          percent_change,
          sample_size,
          risk_score,
          run_id,
          detected_at,
          resolved_at,
          metadata,
          metrics_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `,
        [
          snapshot.test_id,
          snapshot.target_id,
          snapshot.metric_id,
          snapshot.scenario,
          snapshot.environment,
          snapshot.severity,
          snapshot.trend,
          snapshot.unit,
          snapshot.baseline_value,
          snapshot.current_value,
          snapshot.delta,
          snapshot.percent_change,
          snapshot.sample_size,
          snapshot.risk_score,
          snapshot.run_id,
          snapshot.detected_at ? new Date(snapshot.detected_at) : null,
          snapshot.resolved_at ? new Date(snapshot.resolved_at) : null,
          JSON.stringify(snapshot.metadata ?? {}),
          JSON.stringify(snapshot.metrics_history ?? []),
        ]
      );
    }
  });

  // Insert FalkorDB entities for testing
  try {
    const now = Date.now();
    const toIso = (offsetMs: number) => new Date(now - offsetMs).toISOString();
    const kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);

    const entities = [
      {
        id: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        type: "file",
        name: "test.ts",
        path: "test.ts",
        language: "typescript",
        hash: "hash-test-ts",
        created: toIso(0),
        lastModified: toIso(0),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.javascriptFile,
        type: "file",
        name: "utils.js",
        path: "utils.js",
        language: "javascript",
        hash: "hash-utils-js",
        created: toIso(3600000),
        lastModified: toIso(3600000),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.pythonFile,
        type: "file",
        name: "main.py",
        path: "main.py",
        language: "python",
        hash: "hash-main-py",
        created: toIso(7200000),
        lastModified: toIso(7200000),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.goFile,
        type: "file",
        name: "server.go",
        path: "server.go",
        language: "go",
        hash: "hash-server-go",
        created: toIso(10800000),
        lastModified: toIso(10800000),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.rustFile,
        type: "file",
        name: "app.rs",
        path: "app.rs",
        language: "rust",
        hash: "hash-app-rs",
        created: toIso(14400000),
        lastModified: toIso(14400000),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.typescriptFunction,
        type: "symbol",
        kind: "function",
        name: "testHelper",
        path: "test.ts",
        language: "typescript",
        hash: "hash-test-helper",
        created: toIso(0),
        lastModified: toIso(0),
      },
    ];

    for (const entity of entities) {
      await kgService.createEntity(entity as any, { skipEmbedding: true });
    }

    const relationshipFixtures = [
      {
        fromId: TEST_FIXTURE_IDS.falkorEntities.javascriptFile,
        toId: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        type: RelationshipType.CALLS,
        metadata: { line: 12 },
      },
      {
        fromId: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        toId: TEST_FIXTURE_IDS.falkorEntities.pythonFile,
        type: RelationshipType.REFERENCES,
        metadata: { confidence: 0.9 },
      },
    ];

    for (const rel of relationshipFixtures) {
      await kgService.createRelationship({
        fromEntityId: rel.fromId,
        toEntityId: rel.toId,
        type: rel.type,
        metadata: rel.metadata,
      } as any);
    }
  } catch (error) {
    console.warn("⚠️ Could not insert FalkorDB fixtures:", error);
  }
}

/**
 * Test database connection health
 */
export async function checkDatabaseHealth(
  dbService: DatabaseService
): Promise<boolean> {
  const health = await dbService.healthCheck();
  const falkorOk = health.falkordb?.status === "healthy";
  const qdrantOk = health.qdrant?.status === "healthy";
  const postgresOk = health.postgresql?.status === "healthy";
  // Redis is optional in tests; treat undefined as acceptable
  const redisOk = health.redis ? health.redis.status === "healthy" : true;
  return falkorOk && qdrantOk && postgresOk && redisOk;
}
