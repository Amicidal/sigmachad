/**
 * Database test utilities and helpers
 * Provides common setup and teardown functions for database tests
 */

import {
  DatabaseService,
  DatabaseConfig,
} from "../../src/services/DatabaseService";
import { v4 as uuidv4 } from "uuid";

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
  "sessions",
  "documents",
  "performance_metrics",
  "coverage_history",
];

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

/**
 * Setup database service for testing
 * Initializes and sets up the database schema
 */
export async function setupTestDatabase(
  options: { silent?: boolean } = {}
): Promise<DatabaseService> {
  const silent = options.silent === true || process.env.TEST_SILENT === "1";
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  log("🔧 Setting up test database...");
  const dbService = new DatabaseService(TEST_DATABASE_CONFIG);

  try {
    await dbService.initialize();
    log("✅ Database service initialized");
  } catch (error) {
    warn("⚠️ Database initialization failed:", error);
    throw (error instanceof Error ? error : new Error(String(error)));
  }

  // Only attempt schema setup if initialization succeeded and core services are healthy
  try {
    if (dbService.isInitialized()) {
      const health = await dbService.healthCheck();
      log("📊 Database health check:", health);

      const allCoreHealthy =
        health.falkordb?.status === "healthy" &&
        health.qdrant?.status === "healthy" &&
        health.postgresql?.status === "healthy";

      if (allCoreHealthy) {
        await dbService.setupDatabase();
        log("✅ Database schema setup complete");
      } else {
        warn("⚠️ Some database services are not healthy, schema setup skipped");
        warn("Health status:", health);
      }
    } else {
      warn("⚠️ Database service not initialized, schema setup skipped");
    }
  } catch (error) {
    warn("⚠️ Database schema setup failed, but continuing:", error);
  }

  return dbService;
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
          const truncateList = postgresTables
            .map((table) => `"${table}"`)
            .join(", ");
          await dbService.postgresQuery(
            `TRUNCATE TABLE IF EXISTS ${truncateList} RESTART IDENTITY CASCADE`
          );
          log("✅ Truncated PostgreSQL tables");
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

      const maintenanceTasks = existingCollections.map(async (collection) => {
        if (requiredCollections.has(collection.name)) {
          try {
            await qdrantClient.delete(collection.name, { filter: {}, wait: true });
          } catch {
            // Collection might already be empty or delete unsupported – ignore
          }
        } else {
          try {
            await qdrantClient.deleteCollection(collection.name);
          } catch (err) {
            warn(`⚠️ Could not delete collection ${collection.name}:`, err);
          }
        }
      });

      if (maintenanceTasks.length) {
        await Promise.all(maintenanceTasks);
      }

      const existingNames = new Set(
        (await qdrantClient.getCollections()).collections?.map((c) => c.name) ?? []
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
            warn(`⚠️ Could not create collection ${collectionName}:`, error);
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

  testPerformance: [
    {
      test_id: "test_1",
      memory_usage: 1024000,
      cpu_usage: 15,
      network_requests: 2,
      timestamp: new Date().toISOString(),
    },
    {
      test_id: "test_2",
      memory_usage: 2048000,
      cpu_usage: 25,
      network_requests: 5,
      timestamp: new Date().toISOString(),
    },
  ],

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

  // Insert documents
  for (let i = 0; i < TEST_FIXTURES.documents.length; i++) {
    const doc = TEST_FIXTURES.documents[i];
    await dbService.postgresQuery(
      "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
      [
        doc.id || uuidv4(),
        doc.type,
        JSON.stringify(doc.content),
        JSON.stringify(doc.metadata),
      ]
    );
  }

  // Insert sessions
  for (const session of TEST_FIXTURES.sessions) {
    await dbService.postgresQuery(
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
    await dbService.postgresQuery(
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
    const suiteResult = await dbService.postgresQuery(
      `
      INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        suite.suiteName,
        suite.timestamp,
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
        await dbService.postgresQuery(
          `
          INSERT INTO test_results (test_id, test_name, status, duration, error_message, stack_trace, timestamp, suite_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
    await dbService.postgresQuery(
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
        analysis.analyzedAt || analysis.analyzed_at || new Date().toISOString(),
      ]
    );
  }

  // Insert test performance data
  for (const perf of TEST_FIXTURES.testPerformance) {
    await dbService.postgresQuery(
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

  // Insert FalkorDB entities for testing
  try {
    const falkorEntities = [
      {
        id: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        type: "file",
        path: "test.ts",
        language: "typescript",
        lastModified: new Date().toISOString(),
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.javascriptFile,
        type: "file",
        path: "utils.js",
        language: "javascript",
        lastModified: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.pythonFile,
        type: "file",
        path: "main.py",
        language: "python",
        lastModified: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.goFile,
        type: "file",
        path: "server.go",
        language: "go",
        lastModified: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      },
      {
        id: TEST_FIXTURE_IDS.falkorEntities.rustFile,
        type: "file",
        path: "app.rs",
        language: "rust",
        lastModified: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      },
    ];

    for (const entity of falkorEntities) {
      await dbService.falkordbQuery(
        `
        CREATE (:Entity {
          id: $id,
          type: $type,
          path: $path,
          language: $language,
          lastModified: $lastModified
        })
      `,
        entity
      );
    }

    const relationshipFixtures = [
      {
        fromId: TEST_FIXTURE_IDS.falkorEntities.javascriptFile,
        toId: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        type: "CALLS",
        props: { line: 12 },
      },
      {
        fromId: TEST_FIXTURE_IDS.falkorEntities.typescriptFile,
        toId: TEST_FIXTURE_IDS.falkorEntities.pythonFile,
        type: "REFERENCES",
        props: { confidence: 0.9 },
      },
    ];

    for (const rel of relationshipFixtures) {
      await dbService.falkordbQuery(
        `
        MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
        MERGE (from)-[r:${rel.type}]->(to)
        SET r += $props
        RETURN r
      `,
        {
          fromId: rel.fromId,
          toId: rel.toId,
          props: rel.props ?? {},
        }
      );
    }
  } catch {
    // Failed to insert FalkorDB test fixtures, ignore errors
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
