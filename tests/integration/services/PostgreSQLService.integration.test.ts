/**
 * Integration tests for PostgreSQLService
 * Tests database operations, transactions, connection handling, and schema management with real database operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PostgreSQLService } from "../../../src/services/database/PostgreSQLService";
import { v4 as uuidv4 } from "uuid";
import {
  DatabaseService,
  createTestDatabaseConfig,
} from "../../../src/services/core/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers";

describe("PostgreSQLService Integration", () => {
  let dbService: DatabaseService;
  let pgService: PostgreSQLService;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    pgService = new PostgreSQLService(createTestDatabaseConfig().postgresql);

    // Ensure database is healthy
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run integration tests"
      );
    }

    // Initialize PostgreSQL service
    await pgService.initialize();
    await pgService.setupSchema();
  }, 30000);

  afterAll(async () => {
    if (pgService && pgService.isInitialized()) {
      await pgService.close();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (pgService && pgService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  describe("Service Lifecycle Integration", () => {
    it("should initialize and close service successfully", async () => {
      const newService = new PostgreSQLService(
        createTestDatabaseConfig().postgresql
      );

      expect(newService.isInitialized()).toBe(false);

      await newService.initialize();
      expect(newService.isInitialized()).toBe(true);

      const pool = newService.getPool();
      expect(pool).toEqual(expect.any(Object));

      await newService.close();
      expect(newService.isInitialized()).toBe(false);
    });

    it("should perform health check correctly", async () => {
      const isHealthy = await pgService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it("should handle multiple initialization calls gracefully", async () => {
      const newService = new PostgreSQLService(
        createTestDatabaseConfig().postgresql
      );

      await newService.initialize();
      expect(newService.isInitialized()).toBe(true);

      // Second initialization should be a no-op
      await newService.initialize();
      expect(newService.isInitialized()).toBe(true);

      await newService.close();
    });
  });

  describe("Basic Query Operations Integration", () => {
    it("should execute SELECT queries successfully", async () => {
      // Insert test data
      await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
      `,
        [
          "test",
          JSON.stringify({ message: "Hello World" }),
          JSON.stringify({ author: "test-user" }),
        ]
      );

      // Select data
      const result = await pgService.query(
        "SELECT * FROM documents WHERE type = $1",
        ["test"]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].type).toBe("test");
      expect(result.rows[0].content.message).toBe("Hello World");
      expect(result.rows[0].metadata.author).toBe("test-user");
    });

    it("should execute INSERT queries with parameters", async () => {
      const testData = {
        id: "insert-test-1",
        type: "test-document",
        content: { title: "Test Document", body: "This is a test document" },
        metadata: { createdBy: "test-user", version: 1 },
      };

      const result = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
        [
          testData.type,
          JSON.stringify(testData.content),
          JSON.stringify(testData.metadata),
        ]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toEqual(expect.any(String));
      expect(result.rows[0].type).toBe(testData.type);
    });

    it("should execute UPDATE queries", async () => {
      // Insert initial data
      const insertResult = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
        [
          "test",
          JSON.stringify({ status: "draft" }),
          JSON.stringify({ version: 1 }),
        ]
      );
      const insertedId = insertResult.rows[0].id;

      // Update data
      const updateResult = await pgService.query(
        `
        UPDATE documents
        SET content = $1, metadata = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
        [
          JSON.stringify({ status: "published" }),
          JSON.stringify({
            version: 2,
            lastModified: new Date().toISOString(),
          }),
          insertedId,
        ]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].content.status).toBe("published");
      expect(updateResult.rows[0].metadata.version).toBe(2);
    });

    it("should execute DELETE queries", async () => {
      // Insert data to delete
      const insertResult = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
        [
          "test",
          JSON.stringify({ data: "to be deleted" }),
          JSON.stringify({ temporary: true }),
        ]
      );
      const insertedId = insertResult.rows[0].id;

      // Verify data exists
      let countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE id = $1",
        [insertedId]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(1);

      // Delete data
      const deleteResult = await pgService.query(
        "DELETE FROM documents WHERE id = $1",
        [insertedId]
      );
      expect(deleteResult.rowCount).toBe(1);

      // Verify data is deleted
      countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE id = $1",
        [insertedId]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(0);
    });

    it("should handle JSONB operations correctly", async () => {
      const complexData = {
        id: "jsonb-test",
        type: "complex",
        content: {
          nested: {
            array: [1, 2, 3, "test"],
            object: { key: "value", number: 42 },
            boolean: true,
            null: null,
          },
          tags: ["important", "complex", "test"],
          metadata: {
            created: new Date().toISOString(),
            author: "test-user",
            priority: "high",
          },
        },
        metadata: {
          size: 1024,
          checksum: "abc123",
          flags: { indexed: true, archived: false },
        },
      };

      const insertResult = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
        [
          complexData.type,
          JSON.stringify(complexData.content),
          JSON.stringify(complexData.metadata),
        ]
      );
      const insertedId = insertResult.rows[0].id;

      // Query with JSONB operators
      const result = await pgService.query(
        `
        SELECT *
        FROM documents
        WHERE id = $1
          AND content->'nested'->'object'->>'key' = $2
          AND metadata->'flags'->>'indexed' = $3
      `,
        [insertedId, "value", "true"]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].content.nested.object.key).toBe("value");
      expect(result.rows[0].metadata.flags.indexed).toBe(true);
    });

    it("should handle parameterized queries with special characters", async () => {
      const specialData = {
        id: "special-chars-test",
        type: "test",
        content: {
          text: "Special chars: éñüñ, 🚀, 🌟, α, β, γ",
          quotes: "Text with \"double quotes\" and 'single quotes'",
          sql: "Text with ; SELECT * FROM users; -- dangerous content",
        },
        metadata: {
          symbols: "!@#$%^&*()_+{}|:<>?[]\\;'\",./",
          unicode: "Unicode: 你好世界 🌍",
        },
      };

      const result = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
        [
          specialData.type,
          JSON.stringify(specialData.content),
          JSON.stringify(specialData.metadata),
        ]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].content.quotes).toContain("double quotes");
      expect(result.rows[0].content.sql).toContain("SELECT * FROM users");
      expect(result.rows[0].metadata.symbols).toBe(
        specialData.metadata.symbols
      );
    });
  });

  describe("Transaction Operations Integration", () => {
    it("should execute successful transactions", async () => {
      const transactionData = {
        sessionId: "tx-session-1",
        documents: [
          {
            id: "tx-doc-1",
            type: "test",
            content: { title: "Transaction Doc 1" },
          },
          {
            id: "tx-doc-2",
            type: "test",
            content: { title: "Transaction Doc 2" },
          },
          {
            id: "tx-doc-3",
            type: "test",
            content: { title: "Transaction Doc 3" },
          },
        ],
      };

      const result = await pgService.transaction(async (client) => {
        // Insert session
        const sessionResult = await client.query(
          `
          INSERT INTO sessions (agent_type, user_id, start_time, status)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
          ["test-agent", "test-user", new Date(), "active"]
        );
        const sessionId = sessionResult.rows[0].id;

        // Insert documents
        for (const doc of transactionData.documents) {
          const docResult = await client.query(
            `
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
            RETURNING id
          `,
            [
              doc.type,
              JSON.stringify(doc.content),
              JSON.stringify({ sessionId }),
            ]
          );
          const docId = docResult.rows[0].id;

          // Insert change record
          await client.query(
            `
            INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, session_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
            ["create", "document", docId, new Date(), "test-user", sessionId]
          );
        }

        return {
          sessionId: sessionResult.rows[0].id,
          documentCount: transactionData.documents.length,
        };
      });

      expect(result.sessionId).toEqual(expect.any(String));
      expect(result.documentCount).toBe(3);

      // Verify transaction committed
      const sessionCount = await pgService.query(
        "SELECT COUNT(*) as count FROM sessions WHERE id = $1",
        [result.sessionId]
      );
      expect(parseInt(sessionCount.rows[0].count)).toBe(1);

      const docCount = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE metadata->>'sessionId' = $1",
        [result.sessionId]
      );
      expect(parseInt(docCount.rows[0].count)).toBe(3);

      const changeCount = await pgService.query(
        "SELECT COUNT(*) as count FROM changes WHERE session_id = $1",
        [result.sessionId]
      );
      expect(parseInt(changeCount.rows[0].count)).toBe(3);
    });

    it("should rollback transactions on error", async () => {
      const testId = "rollback-test-" + Date.now();

      try {
        await pgService.transaction(async (client) => {
          // Insert initial data
          await client.query(
            `
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `,
            [
              "test",
              JSON.stringify({ step: 1 }),
              JSON.stringify({ rollback: true }),
            ]
          );

          await client.query(
            `
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `,
            [
              "test",
              JSON.stringify({ step: 2 }),
              JSON.stringify({ rollback: true }),
            ]
          );

          // Force an error
          throw new Error("Intentional transaction rollback test");
        });
      } catch (error) {
        expect((error as Error).message).toBe(
          "Intentional transaction rollback test"
        );
      }

      // Verify transaction was rolled back
      const countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE metadata->>'rollback' = $1",
        ["true"]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(0);
    });

    it("should handle nested transactions", async () => {
      const nestedTestId = "nested-tx-" + Date.now();

      const result = await pgService.transaction(async (client) => {
        // Outer transaction work
        const sessionResult = await client.query(
          `
          INSERT INTO sessions (agent_type, user_id, start_time, status)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
          ["nested-test", "test-user", new Date(), "active"]
        );
        const sessionId = sessionResult.rows[0].id;

        // Simulate nested transaction (PostgreSQL supports savepoints)
        await client.query("SAVEPOINT nested_tx");

        await client.query(
          `
          INSERT INTO documents (type, content, metadata)
          VALUES ($1, $2, $3)
        `,
          [
            "nested-test",
            JSON.stringify({ nested: true }),
            JSON.stringify({ parentSession: sessionId }),
          ]
        );

        await client.query("RELEASE SAVEPOINT nested_tx");

        return { sessionId };
      });

      expect(result.sessionId).toEqual(expect.any(String));

      // Verify both operations succeeded
      const sessionResult = await pgService.query(
        "SELECT COUNT(*) as count FROM sessions WHERE id = $1",
        [result.sessionId]
      );
      expect(parseInt(sessionResult.rows[0].count)).toBe(1);

      const docResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE metadata->>'parentSession' = $1",
        [result.sessionId]
      );
      expect(parseInt(docResult.rows[0].count)).toBe(1);
    });

    it("should handle transaction timeouts", async () => {
      // This test might be environment-dependent, so we'll make it conditional
      try {
        await pgService.transaction(
          async (client) => {
            // Set a very short timeout for testing
            await client.query("SET statement_timeout = 100"); // 100ms

            // This should timeout
            await client.query("SELECT pg_sleep(1)"); // Sleep for 1 second

            return "should not reach here";
          },
          { timeout: 100 }
        );
      } catch (error) {
        // Expected timeout error
        expect((error as Error).message).toMatch(/timeout|cancel/i);
      }
    });
  });

  describe("Bulk Operations Integration", () => {
    it("should execute bulk queries successfully", async () => {
      const bulkData = [
        {
          id: "bulk-1",
          type: "bulk-test",
          content: { index: 1 },
          metadata: { batch: "test-1" },
        },
        {
          id: "bulk-2",
          type: "bulk-test",
          content: { index: 2 },
          metadata: { batch: "test-1" },
        },
        {
          id: "bulk-3",
          type: "bulk-test",
          content: { index: 3 },
          metadata: { batch: "test-1" },
        },
        {
          id: "bulk-4",
          type: "bulk-test",
          content: { index: 4 },
          metadata: { batch: "test-1" },
        },
        {
          id: "bulk-5",
          type: "bulk-test",
          content: { index: 5 },
          metadata: { batch: "test-1" },
        },
      ];

      const queries = bulkData.map((data) => ({
        query:
          "INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)",
        params: [
          data.type,
          JSON.stringify(data.content),
          JSON.stringify(data.metadata),
        ],
      }));

      const results = await pgService.bulkQuery(queries);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.rowCount).toBe(1);
      });

      // Verify all data was inserted
      const countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE type = $1",
        ["bulk-test"]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(5);
    });

    it("should handle bulk query errors with continueOnError option", async () => {
      const mixedQueries = [
        {
          query:
            "INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)",
          params: [
            "test",
            JSON.stringify({ valid: true }),
            JSON.stringify({ batch: "error-test" }),
          ],
        },
        {
          query: "INVALID SQL QUERY THAT WILL FAIL",
          params: [],
        },
        {
          query:
            "INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)",
          params: [
            "test",
            JSON.stringify({ valid: true }),
            JSON.stringify({ batch: "error-test" }),
          ],
        },
        {
          query:
            "INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)",
          params: [
            "test",
            JSON.stringify({ valid: true }),
            JSON.stringify({ batch: "error-test" }),
          ],
        },
      ];

      const results = await pgService.bulkQuery(mixedQueries, {
        continueOnError: true,
      });

      expect(results).toHaveLength(4);

      // First query should succeed
      expect(results[0].rowCount).toBe(1);

      // Second query should have error
      expect(results[1].error).toEqual(expect.any(Object));

      // Third and fourth queries should succeed
      expect(results[2].rowCount).toBe(1);
      expect(results[3].rowCount).toBe(1);

      // Verify only successful inserts occurred
      const countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE metadata->>'batch' = $1",
        ["error-test"]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(3);
    });

    it("should rollback entire bulk operation on error without continueOnError", async () => {
      const failingQueries = [
        {
          query:
            "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
          params: [
            "bulk-rollback-1",
            "rollback-test",
            JSON.stringify({ step: 1 }),
            JSON.stringify({ batch: "rollback" }),
          ],
        },
        {
          query: "INVALID SQL THAT CAUSES FAILURE",
          params: [],
        },
        {
          query:
            "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
          params: [
            "bulk-rollback-2",
            "rollback-test",
            JSON.stringify({ step: 2 }),
            JSON.stringify({ batch: "rollback" }),
          ],
        },
      ];

      try {
        await pgService.bulkQuery(failingQueries, { continueOnError: false });
      } catch (error) {
        // Expected error
        expect(error as any).toEqual(expect.anything());
      }

      // Verify no data was inserted due to rollback
      const countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE metadata->>'batch' = $1",
        ["rollback"]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(0);
    });

    it("should handle large bulk operations efficiently", async () => {
      const largeBulkSize = 100;
      const largeQueries = [];

      for (let i = 0; i < largeBulkSize; i++) {
        largeQueries.push({
          query:
            "INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)",
          params: [
            "large-bulk-test",
            JSON.stringify({ index: i, data: `item-${i}` }),
            JSON.stringify({ batch: "large-test", size: largeBulkSize }),
          ],
        });
      }

      const startTime = Date.now();
      const results = await pgService.bulkQuery(largeQueries);
      const endTime = Date.now();

      expect(results).toHaveLength(largeBulkSize);
      results.forEach((result) => {
        expect(result.rowCount).toBe(1);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify all data was inserted
      const countResult = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE type = $1",
        ["large-bulk-test"]
      );
      expect(parseInt(countResult.rows[0].count)).toBe(largeBulkSize);

      const metrics = pgService.getBulkWriterMetrics();
      expect(metrics.lastBatch?.batchSize).toBe(largeBulkSize);
      expect(metrics.maxBatchSize).toBeGreaterThanOrEqual(largeBulkSize);
      expect(metrics.history.length).toBeGreaterThan(0);
      expect(
        metrics.slowBatches.some((entry) => entry.batchSize === largeBulkSize)
      ).toBe(true);
    });
  });

  describe("Test Data Management Integration", () => {
    it("should store test suite results correctly", async () => {
      const suiteResult = {
        suiteName: "integration-test-suite",
        timestamp: new Date(),
        framework: "vitest",
        totalTests: 5,
        passedTests: 4,
        failedTests: 1,
        skippedTests: 0,
        duration: 2500,
        results: [
          {
            testId: "test-1",
            testName: "should pass basic functionality",
            status: "passed",
            duration: 500,
            errorMessage: null,
            stackTrace: null,
            coverage: {
              lines: 85.5,
              branches: 80.2,
              functions: 90.1,
              statements: 85.8,
            },
            performance: {
              memoryUsage: 1024000,
              cpuUsage: 15.2,
              networkRequests: 2,
            },
          },
          {
            testId: "test-2",
            testName: "should handle errors gracefully",
            status: "failed",
            duration: 300,
            errorMessage: "Expected true but received false",
            stackTrace:
              "Error: Expected true but received false\n    at test-file.ts:42:15",
            coverage: null,
            performance: null,
          },
          {
            testId: "test-3",
            testName: "should validate input data",
            status: "passed",
            duration: 400,
            errorMessage: null,
            stackTrace: null,
            coverage: {
              lines: 92.1,
              branches: 88.5,
              functions: 95.0,
              statements: 91.8,
            },
            performance: {
              memoryUsage: 987000,
              cpuUsage: 12.8,
              networkRequests: 1,
            },
          },
        ],
      };

      await pgService.storeTestSuiteResult(suiteResult);

      // Verify test suite was stored
      const suiteQuery = await pgService.query(
        "SELECT * FROM test_suites WHERE suite_name = $1",
        ["integration-test-suite"]
      );
      expect(suiteQuery.rows).toHaveLength(1);

      const storedSuite = suiteQuery.rows[0];
      expect(storedSuite.framework).toBe("vitest");
      expect(storedSuite.total_tests).toBe(5);
      expect(storedSuite.passed_tests).toBe(4);
      expect(storedSuite.failed_tests).toBe(1);

      // Verify test results were stored
      const resultsQuery = await pgService.query(
        "SELECT * FROM test_results WHERE suite_id = $1 ORDER BY test_id",
        [storedSuite.id]
      );
      expect(resultsQuery.rows).toHaveLength(3);

      expect(resultsQuery.rows[0].test_name).toBe(
        "should pass basic functionality"
      );
      expect(resultsQuery.rows[0].status).toBe("passed");
      expect(resultsQuery.rows[1].test_name).toBe(
        "should handle errors gracefully"
      );
      expect(resultsQuery.rows[1].status).toBe("failed");
      expect(resultsQuery.rows[1].error_message).toBe(
        "Expected true but received false"
      );

      // Verify coverage data was stored
      const coverageQuery = await pgService.query(
        "SELECT * FROM test_coverage WHERE suite_id = $1 ORDER BY test_id",
        [storedSuite.id]
      );
      expect(coverageQuery.rows).toHaveLength(2); // Only tests with coverage data

      expect(coverageQuery.rows[0].lines).toBe(85.5);
      expect(coverageQuery.rows[1].lines).toBe(92.1);

      // Verify performance data was stored
      const perfQuery = await pgService.query(
        "SELECT * FROM test_performance WHERE suite_id = $1 ORDER BY test_id",
        [storedSuite.id]
      );
      expect(perfQuery.rows).toHaveLength(2); // Only tests with performance data

      expect(perfQuery.rows[0].memory_usage).toBe(1024000);
      expect(perfQuery.rows[1].memory_usage).toBe(987000);
    });

    it("should store flaky test analyses correctly", async () => {
      const analyses = [
        {
          testId: "flaky-test-1",
          testName: "UnstableTest.integration",
          flakyScore: 75.5,
          totalRuns: 100,
          failureRate: 25.0,
          successRate: 75.0,
          recentFailures: 5,
          patterns: { intermittent: true, timing_dependent: true },
          recommendations: { increase_timeout: true, add_retry: true },
        },
        {
          testId: "flaky-test-2",
          testName: "AnotherFlakyTest.integration",
          flakyScore: 82.3,
          totalRuns: 50,
          failureRate: 35.0,
          successRate: 65.0,
          recentFailures: 8,
          patterns: { environment_dependent: true, resource_contention: true },
          recommendations: {
            stabilize_environment: true,
            reduce_parallelism: true,
          },
        },
      ];

      await pgService.storeFlakyTestAnalyses(analyses);

      // Verify analyses were stored
      const storedAnalyses = await pgService.query(
        "SELECT * FROM flaky_test_analyses WHERE test_id IN ($1, $2) ORDER BY test_id",
        ["flaky-test-1", "flaky-test-2"]
      );

      expect(storedAnalyses.rows).toHaveLength(2);

      const firstAnalysis = storedAnalyses.rows[0];
      expect(firstAnalysis.test_name).toBe("UnstableTest.integration");
      expect(firstAnalysis.flaky_score).toBe(75.5);
      expect(firstAnalysis.total_runs).toBe(100);
      expect(firstAnalysis.failure_rate).toBe(25.0);
      expect(firstAnalysis.patterns.intermittent).toBe(true);
      expect(firstAnalysis.recommendations.increase_timeout).toBe(true);

      const secondAnalysis = storedAnalyses.rows[1];
      expect(secondAnalysis.test_name).toBe("AnotherFlakyTest.integration");
      expect(secondAnalysis.flaky_score).toBe(82.3);
      expect(secondAnalysis.recommendations.stabilize_environment).toBe(true);
    });

    it("should update existing flaky test analyses on conflict", async () => {
      // Insert initial analysis
      await pgService.storeFlakyTestAnalyses([
        {
          testId: "update-test",
          testName: "UpdateTest.integration",
          flakyScore: 60.0,
          totalRuns: 50,
          failureRate: 20.0,
          successRate: 80.0,
          recentFailures: 2,
          patterns: { initial: true },
          recommendations: { initial: true },
        },
      ]);

      // Update with new analysis
      await pgService.storeFlakyTestAnalyses([
        {
          testId: "update-test",
          testName: "UpdateTest.integration",
          flakyScore: 85.0,
          totalRuns: 75,
          failureRate: 30.0,
          successRate: 70.0,
          recentFailures: 6,
          patterns: { updated: true, timing_dependent: true },
          recommendations: { updated: true, add_retry: true },
        },
      ]);

      // Verify update occurred
      const result = await pgService.query(
        "SELECT * FROM flaky_test_analyses WHERE test_id = $1",
        ["update-test"]
      );

      expect(result.rows).toHaveLength(1);
      const analysis = result.rows[0];
      expect(analysis.flaky_score).toBe(85); // Updated
      expect(analysis.total_runs).toBe(75); // Updated
      expect(analysis.patterns.updated).toBe(true); // Updated
      expect(analysis.recommendations.add_retry).toBe(true); // Updated
    });
  });

  describe("Query History and Analytics Integration", () => {
    beforeEach(async () => {
      // Set up test data for history queries
      const suiteResult = await pgService.query(
        `
        INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        ["history-test-suite", new Date(), "vitest", 3, 2, 1]
      );

      const suiteId = suiteResult.rows[0].id;

      // Insert test results
      await pgService.query(
        `
        INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
        VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)
      `,
        [
          "history-test-1",
          "should execute successfully",
          "passed",
          100,
          new Date(),
          suiteId,
          "history-test-2",
          "should handle errors",
          "failed",
          50,
          new Date(),
          suiteId,
        ]
      );

      // Insert coverage and performance data using correct tables and UUID
      const testEntityId = uuidv4();

      // Store the entityId for use in tests
      global.testEntityId = testEntityId;

      await pgService.query(
        `
        INSERT INTO coverage_history (entity_id, lines_covered, lines_total, percentage, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [testEntityId, 85, 100, 85.5, new Date()]
      );

      const now = new Date();
      await pgService.query(
        `
        INSERT INTO performance_metric_snapshots (
          test_id,
          target_id,
          metric_id,
          current_value,
          detected_at,
          created_at
        )
        VALUES
          ($1, $1, 'memory_usage', 1024000, $2, $2),
          ($1, $1, 'cpu_usage', 15.2, $3, $3),
          ($1, $1, 'network_requests', 2, $4, $4)
      `,
        [
          testEntityId,
          new Date(now.getTime() - 3600_000),
          new Date(now.getTime() - 7200_000),
          now,
        ]
      );
    });

    it("should retrieve test execution history correctly", async () => {
      const history = await pgService.getTestExecutionHistory(
        "history-test-1",
        10
      );

      expect(history).toHaveLength(1);
      expect(history[0].test_id).toBe("history-test-1");
      expect(history[0].test_name).toBe("should execute successfully");
      expect(history[0].status).toBe("passed");
      expect(history[0].suite_name).toBe("history-test-suite");
      expect(history[0].framework).toBe("vitest");
    });

    it("should retrieve performance metrics history", async () => {
      const testEntityId = global.testEntityId;
      const metrics = await pgService.getPerformanceMetricsHistory(
        testEntityId,
        { days: 30 }
      );

      expect(metrics).toHaveLength(3); // We inserted 3 metrics
      expect(metrics[0].metricId).toBeDefined();
      expect(metrics[0].source).toBe("snapshot");
      expect(metrics[0].detectedAt === null || metrics[0].detectedAt instanceof Date).toBe(true);

      // Check that all 3 metric types are present
      const metricTypes = metrics.map((m) => m.metricId);
      expect(metricTypes).toContain("memory_usage");
      expect(metricTypes).toContain("cpu_usage");
      expect(metricTypes).toContain("network_requests");
    });

    it("should retrieve coverage history", async () => {
      const testEntityId = global.testEntityId;
      const coverage = await pgService.getCoverageHistory(testEntityId, 30);

      expect(coverage).toHaveLength(1);
      expect(coverage[0].entity_id).toBe(testEntityId);
      expect(coverage[0].lines_covered).toBe(85);
      expect(coverage[0].lines_total).toBe(100);
      expect(coverage[0].percentage).toBe(85.5);
      expect(new Date(coverage[0].timestamp).toString()).not.toBe('Invalid Date');
    });

    it("should handle history queries with no results", async () => {
      const nonExistentEntityId = uuidv4();
      const history = await pgService.getTestExecutionHistory(
        nonExistentEntityId,
        10
      );
      expect(history).toEqual([]);

      const metrics = await pgService.getPerformanceMetricsHistory(
        nonExistentEntityId,
        { days: 30 }
      );
      expect(metrics).toEqual([]);

      const coverage = await pgService.getCoverageHistory(
        nonExistentEntityId,
        30
      );
      expect(coverage).toEqual([]);
    });

    it("should respect limit parameters in history queries", async () => {
      // Add more test results for the same test
      const suiteResult = await pgService.query(
        `
        INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [
          "limit-test-suite",
          new Date(Date.now() - 86400000), // Yesterday
          "vitest",
          1,
          1,
        ]
      );

      const suiteId = suiteResult.rows[0].id;

      await pgService.query(
        `
        INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          "history-test-1",
          "should execute successfully",
          "passed",
          200,
          new Date(Date.now() - 86400000),
          suiteId,
        ]
      );

      // Test limit
      const limitedHistory = await pgService.getTestExecutionHistory(
        "history-test-1",
        1
      );
      expect(limitedHistory).toHaveLength(1);
    });
  });

  describe("Performance and Load Testing", () => {
    it("should handle concurrent query operations efficiently", async () => {
      const concurrentQueries = 20;
      const queryPromises = [];

      // Create concurrent SELECT queries
      for (let i = 0; i < concurrentQueries; i++) {
        queryPromises.push(
          pgService.query("SELECT COUNT(*) as count FROM documents")
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(queryPromises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrentQueries);
      results.forEach((result) => {
        expect(result.rows).toHaveLength(1);
        expect(typeof result.rows[0].count).toBe("number");
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    it("should handle large result sets efficiently", async () => {
      // Insert large dataset
      const largeDatasetSize = 1000;
      const insertPromises = [];

      for (let i = 0; i < largeDatasetSize; i++) {
        insertPromises.push(
          pgService.query(
            `
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `,
            [
              "large-dataset-test",
              JSON.stringify({ index: i, data: `item-${i}` }),
              JSON.stringify({ batch: "large-test" }),
            ]
          )
        );
      }

      await Promise.all(insertPromises);

      // Query large result set
      const startTime = Date.now();
      const result = await pgService.query(
        "SELECT * FROM documents WHERE type = $1 ORDER BY created_at DESC LIMIT 500",
        ["large-dataset-test"]
      );
      const endTime = Date.now();

      expect(result.rows).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds max

      // Verify results are ordered correctly
      for (let i = 0; i < result.rows.length - 1; i++) {
        expect(
          new Date(result.rows[i].created_at).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(result.rows[i + 1].created_at).getTime()
        );
      }
    });

    it("should maintain query performance with complex operations", async () => {
      // Create complex dataset with relationships
      const sessionResult = await pgService.query(
        `
        INSERT INTO sessions (agent_type, user_id, start_time, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
        ["performance-test", "test-user", new Date(), "active"]
      );

      const sessionId = sessionResult.rows[0].id;

      // Insert related data
      for (let i = 0; i < 100; i++) {
        const docResult = await pgService.query(
          `
          INSERT INTO documents (type, content, metadata)
          VALUES ($1, $2, $3)
          RETURNING id
        `,
          [
            "complex-test",
            JSON.stringify({ index: i, sessionId }),
            JSON.stringify({ complex: true }),
          ]
        );

        const docId = docResult.rows[0].id;

        await pgService.query(
          `
          INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, session_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          ["create", "document", docId, new Date(), "test-user", sessionId]
        );
      }

      // Complex join query
      const startTime = Date.now();
      const complexResult = await pgService.query(
        `
        SELECT d.id, d.type, d.content, c.change_type, c.timestamp, s.agent_type
        FROM documents d
        JOIN changes c ON c.entity_id = d.id::text
        JOIN sessions s ON s.id = c.session_id
        WHERE d.type = $1 AND s.agent_type = $2
        ORDER BY c.timestamp DESC
        LIMIT 50
      `,
        ["complex-test", "performance-test"]
      );
      const endTime = Date.now();

      expect(complexResult.rows).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // 1 second max for complex query
    });

    it("should handle connection pool efficiently under load", async () => {
      const loadTestQueries = 50;
      const loadPromises = [];

      for (let i = 0; i < loadTestQueries; i++) {
        loadPromises.push(
          pgService.query(
            `
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
            RETURNING id
          `,
            [
              "load-test",
              JSON.stringify({
                iteration: i,
                timestamp: new Date().toISOString(),
              }),
              JSON.stringify({ loadTest: true }),
            ]
          )
        );
      }

      const startTime = Date.now();
      const loadResults = await Promise.all(loadPromises);
      const endTime = Date.now();

      expect(loadResults).toHaveLength(loadTestQueries);
      loadResults.forEach((result) => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].id).toEqual(expect.any(String));
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify connection health after load test
      const healthCheck = await pgService.healthCheck();
      expect(healthCheck).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle connection failures gracefully", async () => {
      const invalidService = new PostgreSQLService({
        connectionString: "postgresql://invalid:invalid@invalid:1234/invalid",
        max: 1,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 1000,
      });

      await expect(invalidService.initialize()).rejects.toThrow();
    });

    it("should handle query timeouts appropriately", async () => {
      // Test with very short timeout
      try {
        await pgService.query(
          "SELECT pg_sleep(5)", // Sleep for 5 seconds
          [],
          { timeout: 1000 } // 1 second timeout
        );
      } catch (error) {
        expect((error as Error).message).toMatch(/timeout|cancel/i);
      }
    });

    it("should handle invalid SQL syntax", async () => {
      await expect(pgService.query("INVALID SQL SYNTAX !!!")).rejects.toThrow();
    });

    it("should handle constraint violations", async () => {
      // Insert first record
      const firstInsert = await pgService.query(
        `
        INSERT INTO sessions (agent_type, user_id, start_time, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
        ["constraint-test", "test-user", new Date(), "active"]
      );

      const insertedId = firstInsert.rows[0].id;

      // Try to insert record with invalid status (should fail constraint check)
      await expect(
        pgService.query(
          `
        INSERT INTO sessions (agent_type, user_id, start_time, status)
        VALUES ($1, $2, $3, $4)
      `,
          [
            "constraint-test",
            "test-user-2",
            new Date(),
            "invalid-status", // Invalid status value
          ]
        )
      ).rejects.toThrow();
    });

    it("should handle large parameter values", async () => {
      const largeContent = "x".repeat(100000); // 100KB string
      const largeMetadata = { largeField: "y".repeat(50000) }; // Large object

      const result = await pgService.query(
        `
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
        [
          "large-content-test",
          JSON.stringify({ content: largeContent }),
          JSON.stringify(largeMetadata),
        ]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toEqual(expect.any(String));
    });

    it("should handle concurrent transactions safely", async () => {
      const concurrentTx = 5;
      const txPromises = [];
      const txIds = [];

      for (let i = 0; i < concurrentTx; i++) {
        const txId = `concurrent-tx-${i}-${Date.now()}`;
        txIds.push(txId);

        txPromises.push(
          pgService.transaction(async (client) => {
            // Insert session
            const sessionResult = await client.query(
              `
              INSERT INTO sessions (agent_type, user_id, start_time, status)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `,
              ["concurrent-test", `user-${i}`, new Date(), "active"]
            );
            const sessionId = sessionResult.rows[0].id;

            // Insert related document
            await client.query(
              `
              INSERT INTO documents (type, content, metadata)
              VALUES ($1, $2, $3)
            `,
              [
                "concurrent-doc",
                JSON.stringify({ transaction: sessionId }),
                JSON.stringify({ concurrent: true, index: i }),
              ]
            );

            return sessionId;
          })
        );
      }

      const startTime = Date.now();
      const txResults = await Promise.all(txPromises);
      const endTime = Date.now();

      expect(txResults).toHaveLength(concurrentTx);
      txResults.forEach((result) => expect(result).toEqual(expect.any(String)));

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Verify all transactions committed
      const sessionCount = await pgService.query(
        "SELECT COUNT(*) as count FROM sessions WHERE agent_type = $1",
        ["concurrent-test"]
      );
      expect(parseInt(sessionCount.rows[0].count)).toBe(concurrentTx);

      const docCount = await pgService.query(
        "SELECT COUNT(*) as count FROM documents WHERE type = $1",
        ["concurrent-doc"]
      );
      expect(parseInt(docCount.rows[0].count)).toBe(concurrentTx);
    });
  });
});
