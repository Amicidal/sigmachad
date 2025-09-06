/**
 * Database test utilities and helpers
 * Provides common setup and teardown functions for database tests
 */

import { DatabaseService, DatabaseConfig } from '../../src/services/DatabaseService';

// Test database configuration using test containers
export const TEST_DATABASE_CONFIG: DatabaseConfig = {
  falkordb: {
    url: process.env.FALKORDB_URL || 'redis://localhost:6380',
    database: 1, // Use separate database for tests
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6335',
    apiKey: process.env.QDRANT_API_KEY,
  },
  postgresql: {
    connectionString: process.env.DATABASE_URL ||
      'postgresql://memento_test:memento_test@localhost:5433/memento_test',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '5'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  },
  redis: process.env.REDIS_URL ? {
    url: process.env.REDIS_URL,
  } : {
    url: 'redis://localhost:6381',
  },
};

/**
 * Setup database service for testing
 * Initializes and sets up the database schema
 */
export async function setupTestDatabase(): Promise<DatabaseService> {
  const dbService = new DatabaseService(TEST_DATABASE_CONFIG);
  await dbService.initialize();
  await dbService.setupDatabase();
  return dbService;
}

/**
 * Cleanup database service after testing
 */
export async function cleanupTestDatabase(dbService: DatabaseService): Promise<void> {
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
    throw new Error('Database service not initialized for test data cleanup');
  }

  // Clear PostgreSQL test data
  // Respect foreign key dependencies: coverage/performance/results -> suites
  await dbService.postgresQuery('DELETE FROM test_coverage');
  await dbService.postgresQuery('DELETE FROM test_performance');
  await dbService.postgresQuery('DELETE FROM test_results');
  await dbService.postgresQuery('DELETE FROM test_suites');
  await dbService.postgresQuery('DELETE FROM flaky_test_analyses');
  // Respect FK from changes.session_id -> sessions.id
  await dbService.postgresQuery('DELETE FROM changes');
  await dbService.postgresQuery('DELETE FROM sessions');
  await dbService.postgresQuery('DELETE FROM documents');

  // Clear FalkorDB graph data
  await dbService.falkordbCommand('GRAPH.QUERY', 'memento', 'MATCH (n) DETACH DELETE n');

  // Clear Qdrant collections
  const collections = await dbService.qdrant.getCollections();
  for (const collection of collections.collections) {
    await dbService.qdrant.deleteCollection(collection.name);
  }

  // Clear Redis keys
  if (dbService.getConfig().redis) {
    // For test database, we can safely flush all keys
    const redisClient = dbService.getFalkorDBClient();
    if (redisClient) {
      await redisClient.sendCommand(['FLUSHDB']);
    }
  }
}

/**
 * Wait for database to be ready
 * Useful for ensuring test containers are fully started
 */
export async function waitForDatabaseReady(dbService: DatabaseService, timeoutMs: number = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const health = await dbService.healthCheck();

      // Check if all required databases are healthy
      if (health.falkordb && health.qdrant && health.postgresql && health.redis) {
        return;
      }
    } catch (error) {
      // Database not ready yet, continue waiting
    }

    // Wait 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Database not ready within ${timeoutMs}ms`);
}

/**
 * Create test data fixtures
 */
export const TEST_FIXTURES = {
  documents: [
    {
      type: 'code',
      content: { language: 'typescript', code: 'console.log("test");' },
      metadata: { file: 'test.ts', author: 'test' },
    },
    {
      type: 'documentation',
      content: { title: 'Test Doc', content: 'Test documentation content' },
      metadata: { version: '1.0', author: 'test' },
    },
  ],

  sessions: [
    {
      agent_type: 'test_agent',
      user_id: 'test_user',
      start_time: new Date(),
      end_time: null,
      status: 'active',
      metadata: { test: true },
    },
  ],

  changes: [
    {
      change_type: 'create',
      entity_type: 'file',
      entity_id: 'test.ts',
      timestamp: new Date(),
      author: 'test_author',
      commit_hash: 'abc123',
      diff: '+ console.log("hello");',
      previous_state: null,
      new_state: { content: 'console.log("hello");' },
      session_id: null,
      spec_id: null,
    },
  ],

  testSuites: [
    {
      suiteName: 'unit_tests',
      timestamp: new Date(),
      framework: 'vitest',
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
      skippedTests: 0,
      duration: 1000,
    },
  ],

  testResults: [
    {
      test_id: 'test_1',
      test_suite: 'unit_tests',
      test_name: 'should pass',
      status: 'passed',
      duration: 100,
      error_message: null,
      stack_trace: null,
      coverage: { lines: 85, branches: 80, functions: 90, statements: 85 },
      performance: { memoryUsage: 1024000, cpuUsage: 15, networkRequests: 2 },
      timestamp: new Date(),
    },
    {
      test_id: 'test_2',
      test_suite: 'unit_tests',
      test_name: 'should fail',
      status: 'failed',
      duration: 50,
      error_message: 'Assertion failed',
      stack_trace: 'Error: Assertion failed\n    at test',
      coverage: null,
      performance: null,
      timestamp: new Date(),
    },
  ],

  flakyAnalyses: [
    {
      testId: 'flaky_test_1',
      testName: 'unstable test',
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
export async function insertTestFixtures(dbService: DatabaseService): Promise<void> {
  if (!dbService || !dbService.isInitialized()) {
    throw new Error('Database service not initialized');
  }

  // Insert documents
  for (const doc of TEST_FIXTURES.documents) {
    await dbService.postgresQuery(
      'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
      [doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]
    );
  }

  // Insert sessions
  for (const session of TEST_FIXTURES.sessions) {
    await dbService.postgresQuery(
      'INSERT INTO sessions (agent_type, user_id, start_time, end_time, status, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
      [session.agent_type, session.user_id, session.start_time, session.end_time, session.status, JSON.stringify(session.metadata)]
    );
  }

  // Insert changes
  for (const change of TEST_FIXTURES.changes) {
    await dbService.postgresQuery(`
      INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, commit_hash, diff, previous_state, new_state, session_id, spec_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
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
    ]);
  }

  // Insert test suites and results
  for (const suite of TEST_FIXTURES.testSuites) {
    const suiteResult = await dbService.postgresQuery(`
      INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      suite.suiteName,
      suite.timestamp,
      suite.framework,
      suite.totalTests,
      suite.passedTests,
      suite.failedTests,
      suite.skippedTests,
      suite.duration,
    ]);

    const suiteId = suiteResult.rows[0]?.id;

    if (suiteId) {
      // Insert test results for this suite
      for (const result of TEST_FIXTURES.testResults.filter(r => r.test_suite === suite.suiteName)) {
        await dbService.postgresQuery(`
          INSERT INTO test_results (test_id, test_name, status, duration, error_message, stack_trace, timestamp, suite_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          result.test_id,
          result.test_name,
          result.status,
          result.duration,
          result.error_message,
          result.stack_trace,
          result.timestamp,
          suiteId,
        ]);
      }
    }
  }

  // Insert flaky analyses
  for (const analysis of TEST_FIXTURES.flakyAnalyses) {
    await dbService.postgresQuery(`
      INSERT INTO flaky_test_analyses (test_id, test_name, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
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
    ]);
  }
}

/**
 * Test database connection health
 */
export async function checkDatabaseHealth(dbService: DatabaseService): Promise<boolean> {
  const health = await dbService.healthCheck();
  return health.falkordb && health.qdrant && health.postgresql && (health.redis ?? true);
}
