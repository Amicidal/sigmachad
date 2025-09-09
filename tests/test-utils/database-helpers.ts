/**
 * Database test utilities and helpers
 * Provides common setup and teardown functions for database tests
 */

import {
  DatabaseService,
  DatabaseConfig,
} from "../../src/services/DatabaseService";
import { v4 as uuidv4 } from "uuid";

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
export async function setupTestDatabase(): Promise<DatabaseService> {
  console.log("🔧 Setting up test database...");
  const dbService = new DatabaseService(TEST_DATABASE_CONFIG);

  try {
    await dbService.initialize();
    console.log("✅ Database service initialized");
  } catch (error) {
    console.warn(
      "⚠️ Database initialization failed, but continuing for unit tests:",
      error
    );
    // Return service even if initialization fails for unit tests that don't require live connections
    return dbService;
  }

  // Only attempt schema setup if initialization succeeded and core services are healthy
  try {
    if (dbService.isInitialized()) {
      const health = await dbService.healthCheck();
      console.log("📊 Database health check:", health);

      const allCoreHealthy =
        health.falkordb?.status === "healthy" &&
        health.qdrant?.status === "healthy" &&
        health.postgresql?.status === "healthy";

      if (allCoreHealthy) {
        await dbService.setupDatabase();
        console.log("✅ Database schema setup complete");
      } else {
        console.warn(
          "⚠️ Some database services are not healthy, schema setup skipped"
        );
        console.warn("Health status:", health);
      }
    } else {
      console.warn("⚠️ Database service not initialized, schema setup skipped");
    }
  } catch (error) {
    console.warn("⚠️ Database schema setup failed, but continuing:", error);
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
export async function clearTestData(dbService: DatabaseService): Promise<void> {
  if (!dbService || !dbService.isInitialized()) {
    console.warn("Database service not initialized for test data cleanup");
    return;
  }

  console.log("🧹 Clearing test data...");

  // Clear PostgreSQL test data with better error handling
  const postgresTables = [
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

  for (const table of postgresTables) {
    try {
      await dbService.postgresQuery(`DELETE FROM ${table}`);
      console.log(`✅ Cleared ${table}`);
    } catch (error) {
      console.warn(`⚠️ Could not clear ${table}:`, error);
    }
  }

  // Clear FalkorDB graph data
  try {
    await dbService.falkordbCommand(
      "GRAPH.QUERY",
      "memento",
      "MATCH (n) DETACH DELETE n"
    );
    console.log("✅ Cleared FalkorDB graph data");
  } catch (error) {
    console.warn("⚠️ Could not clear FalkorDB graph data:", error);
  }

  // Clear Qdrant collections but preserve required collections
  try {
    const collections = await dbService.qdrant.getCollections();
    const requiredCollections = [
      "code_embeddings",
      "documentation_embeddings",
      "integration_test",
    ];

    let clearedCollections = 0;
    for (const collection of collections.collections || []) {
      // Don't delete required collections, but clear their data
      if (requiredCollections.includes(collection.name)) {
        try {
          // Clear the collection data by deleting all points
          await dbService.qdrant.delete(collection.name, {
            filter: {},
            wait: true,
          });
          console.log(`✅ Cleared data from ${collection.name}`);
        } catch (error) {
          // Collection might be empty already
        }
      } else {
        // Delete non-required collections
        try {
          await dbService.qdrant.deleteCollection(collection.name);
          clearedCollections++;
        } catch (error) {
          console.warn(
            `⚠️ Could not delete collection ${collection.name}:`,
            error
          );
        }
      }
    }
    console.log(`✅ Cleared ${clearedCollections} Qdrant collections`);

    // Ensure required collections exist
    const currentCollections = await dbService.qdrant.getCollections();
    const existingNames =
      currentCollections.collections?.map((c) => c.name) || [];

    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        try {
          // Create the missing collection with proper dimensions
          const vectorSize = 1536; // OpenAI embedding dimensions
          await dbService.qdrant.createCollection(collectionName, {
            vectors: {
              size: vectorSize,
              distance: "Cosine",
            },
          });
          console.log(`✅ Created required collection: ${collectionName}`);
        } catch (error) {
          console.warn(
            `⚠️ Could not create collection ${collectionName}:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not manage Qdrant collections:", error);
  }

  // Clear Redis keys
  if (dbService.getConfig().redis) {
    try {
      const redisClient = dbService.getFalkorDBClient();
      if (redisClient) {
        await redisClient.sendCommand(["FLUSHDB"]);
        console.log("✅ Cleared Redis keys");
      }
    } catch (error) {
      console.warn("⚠️ Could not clear Redis keys:", error);
    }
  }

  console.log("✅ Test data cleanup complete");
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
      type: "code",
      content: { language: "typescript", code: 'console.log("test");' },
      metadata: { file: "test.ts", author: "test" },
    },
    {
      type: "documentation",
      content: { title: "Test Doc", content: "Test documentation content" },
      metadata: { version: "1.0", author: "test" },
    },
  ],

  sessions: [
    {
      agent_type: "test_agent",
      user_id: "test_user",
      start_time: new Date(),
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
      timestamp: new Date(),
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
      timestamp: new Date(),
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
      timestamp: new Date(),
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
      timestamp: new Date(),
    },
  ],

  testPerformance: [
    {
      test_id: "test_1",
      memory_usage: 1024000,
      cpu_usage: 15,
      network_requests: 2,
      timestamp: new Date(),
    },
    {
      test_id: "test_2",
      memory_usage: 2048000,
      cpu_usage: 25,
      network_requests: 5,
      timestamp: new Date(),
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
        uuidv4(),
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

  // Insert flaky analyses
  for (const analysis of TEST_FIXTURES.flakyAnalyses) {
    await dbService.postgresQuery(
      `
      INSERT INTO flaky_test_analyses (test_id, test_name, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        analysis.testId,
        analysis.testName,
        analysis.flakyScore,
        analysis.totalRuns,
        analysis.failureRate,
        analysis.successRate,
        analysis.recentFailures,
        JSON.stringify(analysis.patterns),
        JSON.stringify(analysis.recommendations),
        new Date(),
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
        perf.memory_usage,
        perf.cpu_usage,
        perf.network_requests,
        perf.timestamp,
      ]
    );
  }

  // Insert FalkorDB entities for testing
  try {
    const falkorEntities = [
      {
        id: uuidv4(),
        type: "file",
        path: "test.ts",
        language: "typescript",
        lastModified: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        type: "file",
        path: "utils.js",
        language: "javascript",
        lastModified: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: uuidv4(),
        type: "file",
        path: "main.py",
        language: "python",
        lastModified: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: uuidv4(),
        type: "file",
        path: "server.go",
        language: "go",
        lastModified: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      },
      {
        id: uuidv4(),
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
