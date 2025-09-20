/**
 * Integration tests for TestEngine
 * Tests test result processing, analysis, and database integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  TestEngine,
  TestResult,
  TestSuiteResult,
} from "../../../src/services/TestEngine";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService";
import { DatabaseService } from "../../../src/services/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  TEST_DATABASE_CONFIG,
} from "../../test-utils/database-helpers";
import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";

describe("TestEngine Integration", () => {
  let testEngine: TestEngine;
  let kgService: KnowledgeGraphService;
  let dbService: DatabaseService;
  let testDir: string;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
    testEngine = new TestEngine(kgService, dbService);

    // Create test directory
    testDir = path.join(tmpdir(), "test-engine-integration-tests");
    await fs.mkdir(testDir, { recursive: true });
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase(dbService);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up test directory:", error);
    }
  });

  beforeEach(async () => {
    await clearTestData(dbService);
  });

  describe("Test Result Parsing", () => {
    it("should parse JUnit XML format", async () => {
      const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="Unit Tests" tests="2" failures="0" time="0.5">
            <testcase classname="UserService" name="should create user" time="0.2">
              <properties>
                <property name="testId" value="user-create-test"/>
              </properties>
            </testcase>
            <testcase classname="UserService" name="should update user" time="0.3">
              <properties>
                <property name="testId" value="user-update-test"/>
              </properties>
            </testcase>
          </testsuite>
        </testsuites>`;

      const testFile = path.join(testDir, "junit-results.xml");
      await fs.writeFile(testFile, junitXml);

      const result = await testEngine.parseTestResults(testFile, "junit");

      expect(result).toEqual(
        expect.objectContaining({
          suiteName: expect.stringContaining('JUnit'),
          results: expect.any(Array),
          totalTests: expect.any(Number),
          passedTests: expect.any(Number),
          failedTests: expect.any(Number),
        })
      );
      expect(result.results.length).toBe(2);
      expect(result.totalTests).toBe(2);
      expect(result.passedTests).toBe(2);
      expect(result.failedTests).toBe(0);
    });

    it("should parse Jest JSON format", async () => {
      const jestJson = {
        testResults: [
          {
            testFilePath: "src/components/Button.test.js",
            testResults: [
              {
                title: "renders correctly",
                status: "passed",
                duration: 150,
              },
              {
                title: "handles click events",
                status: "passed",
                duration: 200,
              },
            ],
          },
        ],
        success: true,
      };

      const testFile = path.join(testDir, "jest-results.json");
      await fs.writeFile(testFile, JSON.stringify(jestJson));

      const result = await testEngine.parseTestResults(testFile, "jest");

      expect(result).toEqual(
        expect.objectContaining({
          suiteName: expect.stringContaining('Jest'),
          results: expect.any(Array),
          totalTests: expect.any(Number),
        })
      );
      expect(result.results.length).toBe(2);
      expect(result.totalTests).toBe(2);
      expect(result.passedTests).toBe(2);
    });

    it("should parse Vitest JSON format", async () => {
      const vitestJson = {
        testResults: [
          {
            name: "Button Component",
            filepath: "src/components/Button.test.ts",
            status: "pass",
            duration: 250,
          },
          {
            name: "Input Component",
            filepath: "src/components/Input.test.ts",
            status: "pass",
            duration: 180,
          },
        ],
      };

      const testFile = path.join(testDir, "vitest-results.json");
      await fs.writeFile(testFile, JSON.stringify(vitestJson));

      const result = await testEngine.parseTestResults(testFile, "vitest");

      expect(result).toEqual(
        expect.objectContaining({
          suiteName: expect.stringContaining('Vitest'),
          results: expect.any(Array),
          totalTests: expect.any(Number),
        })
      );
      expect(result.results.length).toBe(2);
      expect(result.totalTests).toBe(2);
    });

    it("should handle malformed test files gracefully", async () => {
      const malformedFile = path.join(testDir, "malformed.json");
      await fs.writeFile(malformedFile, "{ invalid json content }");

      await expect(
        testEngine.parseTestResults(malformedFile, "jest")
      ).rejects.toThrow();
    });
  });

  describe("Test Result Recording", () => {
    let sampleTestResults: TestResult[];

    beforeEach(() => {
      sampleTestResults = [
        {
          testId: "integration-test-1",
          testSuite: "IntegrationTests",
          testName: "should integrate with database",
          status: "passed",
          duration: 1500,
          coverage: {
            statements: 85,
            branches: 80,
            functions: 90,
            lines: 85,
          },
          performance: {
            memoryUsage: 1024000,
            cpuUsage: 15,
            networkRequests: 3,
          },
        },
        {
          testId: "integration-test-2",
          testSuite: "IntegrationTests",
          testName: "should handle errors gracefully",
          status: "passed",
          duration: 1200,
          coverage: {
            statements: 82,
            branches: 78,
            functions: 88,
            lines: 82,
          },
        },
        {
          testId: "unit-test-1",
          testSuite: "UnitTests",
          testName: "should validate input",
          status: "failed",
          duration: 100,
          errorMessage: "Expected true but received false",
          stackTrace:
            "Error: Expected true but received false\n    at test file:25:10",
        },
      ];
    });

    it("should record test suite results to database", async () => {
      const suiteResult: TestSuiteResult = {
        suiteName: "Integration Test Suite",
        timestamp: new Date(),
        results: sampleTestResults,
        framework: "jest",
        totalTests: 3,
        passedTests: 2,
        failedTests: 1,
        skippedTests: 0,
        duration: 2800,
      };

      await testEngine.recordTestResults(suiteResult);

      // Verify test entities were created in knowledge graph
      const testEntity1 = await kgService.getEntity("integration-test-1");
      const testEntity2 = await kgService.getEntity("integration-test-2");
      const testEntity3 = await kgService.getEntity("unit-test-1");

      expect(testEntity1).toEqual(expect.objectContaining({ id: 'integration-test-1', type: 'test' }));
      expect(testEntity2).toEqual(expect.objectContaining({ id: 'integration-test-2', type: 'test' }));
      expect(testEntity3).toEqual(expect.objectContaining({ id: 'unit-test-1', type: 'test' }));

      expect(testEntity1?.type).toBe("test");
      expect(testEntity2?.type).toBe("test");
      expect(testEntity3?.type).toBe("test");
    });

    it("should update performance metrics for existing test entities", async () => {
      // First ensure we have the test entity by recording initial results
      const initialSuiteResult: TestSuiteResult = {
        suiteName: "Initial Test Suite",
        timestamp: new Date(),
        results: [sampleTestResults[0]], // Use the test with performance data
        framework: "jest",
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        skippedTests: 0,
        duration: 1500,
      };

      await testEngine.recordTestResults(initialSuiteResult);

      // Now record additional results to update performance metrics
      const additionalSuiteResult: TestSuiteResult = {
        suiteName: "Performance Test Suite",
        timestamp: new Date(),
        results: [
          {
            ...sampleTestResults[0],
            duration: 1800, // Slightly different duration for variance
          },
        ],
        framework: "jest",
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        skippedTests: 0,
        duration: 1800,
      };

      await testEngine.recordTestResults(additionalSuiteResult);

      const performanceMetrics = await testEngine.getPerformanceMetrics(
        "integration-test-1"
      );
      expect(performanceMetrics).toEqual(
        expect.objectContaining({
          averageExecutionTime: expect.any(Number),
          successRate: expect.any(Number),
        })
      );
      expect(performanceMetrics.averageExecutionTime).toBeGreaterThan(0);
      expect(performanceMetrics.successRate).toBe(1); // 100% success rate
    });

    it("should handle failed test results", async () => {
      const suiteResult: TestSuiteResult = {
        suiteName: "Failing Test Suite",
        timestamp: new Date(),
        results: [sampleTestResults[2]], // Failed test
        framework: "jest",
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration: 100,
      };

      await testEngine.recordTestResults(suiteResult);

      const testEntity = await kgService.getEntity("unit-test-1");
      expect(testEntity).toEqual(expect.any(Object));

      // Check that failure information is recorded
      if (testEntity) {
        const executionHistory = (testEntity as any).executionHistory;
        expect(executionHistory).toEqual(expect.any(Array));
        expect(executionHistory.length).toBeGreaterThan(0);

        // Find the most recent failed execution
        const failedExecution = executionHistory
          .filter((exec: any) => exec.status === "failed")
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];

        expect(failedExecution).toEqual(expect.any(Object));
        expect(failedExecution.status).toBe("failed");
        expect(failedExecution.errorMessage).toBe(
          "Expected true but received false"
        );
      }
    });
  });

  describe("Flaky Test Analysis", () => {
    let flakyTestResults: TestResult[];

    beforeEach(() => {
      // Create alternating pass/fail pattern to simulate flaky behavior
      flakyTestResults = [];
      for (let i = 0; i < 10; i++) {
        flakyTestResults.push({
          testId: "flaky-test-1",
          testSuite: "FlakyTests",
          testName: "unstable test",
          status: i % 2 === 0 ? "passed" : "failed", // Alternate pass/fail
          duration: Math.floor(100 + Math.random() * 50),
          errorMessage: i % 2 === 1 ? "Intermittent failure" : undefined,
        });
      }
    });

    it("should detect flaky tests", async () => {
      const suiteResult: TestSuiteResult = {
        suiteName: "Flaky Test Suite",
        timestamp: new Date(),
        results: flakyTestResults,
        framework: "jest",
        totalTests: 10,
        passedTests: 5,
        failedTests: 5,
        skippedTests: 0,
        duration: 1000,
      };

      const analysisResults = await testEngine.analyzeFlakyTests(
        flakyTestResults
      );

      expect(analysisResults.length).toBe(1);
      const analysis = analysisResults[0];

      expect(analysis.testId).toBe("flaky-test-1");
      expect(analysis.flakyScore).toBeGreaterThan(0.3); // Should be considered flaky
      expect(analysis.totalRuns).toBe(10);
      expect(analysis.failureRate).toBe(0.5); // 50% failure rate
      expect(analysis.recentFailures).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it("should not flag stable tests as flaky", async () => {
      const stableResults: TestResult[] = Array.from({ length: 10 }, () => ({
        testId: "stable-test-1",
        testSuite: "StableTests",
        testName: "stable test",
        status: "passed" as const,
        duration: 100,
      }));

      const analysisResults = await testEngine.analyzeFlakyTests(stableResults);

      expect(analysisResults.length).toBe(0); // Should not be considered flaky
    });

    it("should generate appropriate recommendations for flaky tests", async () => {
      const suiteResult: TestSuiteResult = {
        suiteName: "High Failure Test Suite",
        timestamp: new Date(),
        results: flakyTestResults,
        framework: "jest",
        totalTests: 10,
        passedTests: 2,
        failedTests: 8,
        skippedTests: 0,
        duration: 1000,
      };

      const analysisResults = await testEngine.analyzeFlakyTests(
        flakyTestResults
      );

      const analysis = analysisResults[0];
      expect(analysis.recommendations).toContain(
        "Consider rewriting this test to be more deterministic"
      );
      expect(analysis.recommendations).toContain(
        "Check for race conditions or timing dependencies"
      );
    });
  });

  describe("Coverage Analysis", () => {
    let coverageTestResults: TestResult[];

    beforeEach(async () => {
      // Create test entities first
      const testEntity = {
        id: "coverage-test-entity",
        path: "src/utils/helpers.ts",
        hash: "cover123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
      };

      await kgService.createEntity(testEntity);

      coverageTestResults = [
        {
          testId: "coverage-test-1",
          testSuite: "CoverageTests",
          testName: "should cover helpers",
          status: "passed",
          duration: 200,
          coverage: {
            statements: 90,
            branches: 85,
            functions: 95,
            lines: 90,
          },
        },
        {
          testId: "coverage-test-2",
          testSuite: "CoverageTests",
          testName: "should cover edge cases",
          status: "passed",
          duration: 150,
          coverage: {
            statements: 88,
            branches: 82,
            functions: 92,
            lines: 88,
          },
        },
      ];
    });

    it("should analyze coverage for entities", async () => {
      const suiteResult: TestSuiteResult = {
        suiteName: "Coverage Test Suite",
        timestamp: new Date(),
        results: coverageTestResults,
        framework: "jest",
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        skippedTests: 0,
        duration: 350,
      };

      await testEngine.recordTestResults(suiteResult);

      // First verify the test entity exists
      const testEntity = await kgService.getEntity("coverage-test-1");
      expect(testEntity).toEqual(expect.objectContaining({ id: 'coverage-test-1' }));

      // Then get coverage analysis
      const coverageAnalysis = await testEngine.getCoverageAnalysis(
        "coverage-test-1"
      );

      expect(coverageAnalysis).toEqual(
        expect.objectContaining({ entityId: 'coverage-test-1', testCases: expect.any(Array), overallCoverage: expect.any(Object) })
      );

      // The coverage should be calculated from the test results
      if (coverageAnalysis.testCases.length > 0) {
        expect(coverageAnalysis.overallCoverage.statements).toBeGreaterThan(0);
      }
    });

    it("should aggregate coverage from multiple tests", async () => {
      // First ensure we have the test entity by recording initial results
      const initialSuiteResult: TestSuiteResult = {
        suiteName: "Initial Coverage Test Suite",
        timestamp: new Date(),
        results: [coverageTestResults[0]], // Just the first test
        framework: "jest",
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        skippedTests: 0,
        duration: 200,
      };

      await testEngine.recordTestResults(initialSuiteResult);

      // Now record additional results for aggregation
      const aggregationSuiteResult: TestSuiteResult = {
        suiteName: "Coverage Aggregation Test Suite",
        timestamp: new Date(),
        results: coverageTestResults, // Both tests
        framework: "jest",
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        skippedTests: 0,
        duration: 350,
      };

      await testEngine.recordTestResults(aggregationSuiteResult);

      const coverageAnalysis = await testEngine.getCoverageAnalysis(
        "coverage-test-1"
      );

      // Should aggregate coverage from both tests
      if (coverageAnalysis.testCases.length > 0) {
        expect(coverageAnalysis.overallCoverage.statements).toBeGreaterThan(0);
        expect(
          coverageAnalysis.testBreakdown.unitTests.statements
        ).toBeGreaterThan(85);
      }
    });
  });

  describe("Performance Snapshot Ingestion", () => {
    it("should bulk ingest high-volume performance snapshots and expose telemetry", async () => {
      const batchSize = 60;
      const testPrefix = "bulk-perf-snapshot";
      const metricId = "performance/bulk-fixture";
      const now = Date.now();

      const bulkQueries = Array.from({ length: batchSize }, (_, index) => {
        const detectedAt = new Date(now - index * 60_000);
        return {
          query: `
            INSERT INTO performance_metric_snapshots (
              test_id,
              target_id,
              metric_id,
              current_value,
              baseline_value,
              delta,
              percent_change,
              severity,
              trend,
              environment,
              unit,
              sample_size,
              detected_at,
              metadata
            )
            VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
          params: [
            `${testPrefix}-${index}`,
            metricId,
            150 + index,
            100,
            50 + index,
            0.2 * (index + 1),
            index % 4 === 0 ? "critical" : index % 3 === 0 ? "high" : "medium",
            index % 3 === 0 ? "regression" : "neutral",
            index % 2 === 0 ? "perf-lab" : "staging",
            "ms",
            10 + index,
            detectedAt,
            JSON.stringify({ source: "integration", batch: "high-volume" }),
          ],
        };
      });

      await dbService.postgresBulkQuery(bulkQueries);

      const metrics = dbService.getPostgresBulkWriterMetrics();

      expect(metrics.lastBatch).not.toBeNull();
      expect(metrics.lastBatch?.batchSize).toBe(batchSize);
      expect(metrics.lastBatch?.mode).toBe("transaction");
      expect(metrics.totalBatches).toBeGreaterThanOrEqual(1);
      expect(metrics.totalQueries).toBeGreaterThanOrEqual(batchSize);
      expect(metrics.maxBatchSize).toBeGreaterThanOrEqual(batchSize);
      expect(metrics.history.length).toBeGreaterThan(0);
      expect(
        metrics.slowBatches.some((entry) => entry.batchSize === batchSize)
      ).toBe(true);

      const history = await dbService.getPerformanceMetricsHistory(
        `${testPrefix}-0`,
        { limit: 5, metricId }
      );
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]?.metricId).toBe(metricId);

      const countResult = await dbService.postgresQuery(
        "SELECT COUNT(*)::int AS count FROM performance_metric_snapshots WHERE test_id LIKE $1",
        [`${testPrefix}-%`]
      );
      expect(countResult.rows?.[0]?.count).toBe(batchSize);

      await dbService.postgresQuery(
        "DELETE FROM performance_metric_snapshots WHERE test_id LIKE $1",
        [`${testPrefix}-%`]
      );
    });
  });

  describe("File-based Test Processing", () => {
    it("should parse and record test results from file", async () => {
      const jestResults = {
        testResults: [
          {
            testFilePath: "src/services/__tests__/UserService.test.js",
            testResults: [
              {
                title: "should create user successfully",
                status: "passed",
                duration: 120,
              },
              {
                title: "should handle invalid input",
                status: "passed",
                duration: 95,
              },
              {
                title: "should delete user",
                status: "failed",
                duration: 80,
                failureMessages: [
                  "Expected user to be deleted but user still exists",
                ],
              },
            ],
          },
        ],
        success: false,
      };

      const testFile = path.join(testDir, "file-based-results.json");
      await fs.writeFile(testFile, JSON.stringify(jestResults));

      await testEngine.parseAndRecordTestResults(testFile, "jest");

      // Verify results were recorded
      const test1 = await kgService.getEntity(
        "src/services/__tests__/UserService.test.js:should create user successfully"
      );
      const test2 = await kgService.getEntity(
        "src/services/__tests__/UserService.test.js:should handle invalid input"
      );
      const test3 = await kgService.getEntity(
        "src/services/__tests__/UserService.test.js:should delete user"
      );

      expect(test1).toEqual(expect.objectContaining({ id: expect.stringContaining('should create user successfully') }));
      expect(test2).toEqual(expect.objectContaining({ id: expect.stringContaining('should handle invalid input') }));
      expect(test3).toEqual(expect.objectContaining({ id: expect.stringContaining('should delete user') }));

      // Check status of failed test
      expect((test3 as any).status).toBe("failing");
    });

    it("should handle multiple test suites in one file", async () => {
      const multiSuiteResults = {
        testResults: [
          {
            testFilePath: "src/components/Button.test.js",
            testResults: [
              {
                title: "renders button",
                status: "passed",
                duration: 100,
              },
            ],
          },
          {
            testFilePath: "src/components/Input.test.js",
            testResults: [
              {
                title: "handles input changes",
                status: "passed",
                duration: 120,
              },
            ],
          },
        ],
      };

      const testFile = path.join(testDir, "multi-suite-results.json");
      await fs.writeFile(testFile, JSON.stringify(multiSuiteResults));

      await testEngine.parseAndRecordTestResults(testFile, "jest");

      const buttonTest = await kgService.getEntity(
        "src/components/Button.test.js:renders button"
      );
      const inputTest = await kgService.getEntity(
        "src/components/Input.test.js:handles input changes"
      );

      expect(buttonTest).toEqual(expect.objectContaining({ id: expect.stringContaining('Button.test.js:renders button') }));
      expect(inputTest).toEqual(expect.objectContaining({ id: expect.stringContaining('Input.test.js:handles input changes') }));
    });
  });

  describe("Performance and Load Testing", () => {
    it("should handle large test result sets efficiently", async () => {
      const largeTestResults: TestResult[] = Array.from(
        { length: 100 },
        (_, i) => ({
          testId: `performance-test-${i}`,
          testSuite: "PerformanceTests",
          testName: `performance test ${i}`,
          status: "passed",
          duration: Math.floor(50 + Math.random() * 100),
          coverage: {
            statements: 80 + Math.random() * 15,
            branches: 75 + Math.random() * 20,
            functions: 85 + Math.random() * 10,
            lines: 80 + Math.random() * 15,
          },
        })
      );

      const suiteResult: TestSuiteResult = {
        suiteName: "Large Performance Test Suite",
        timestamp: new Date(),
        results: largeTestResults,
        framework: "jest",
        totalTests: 100,
        passedTests: 100,
        failedTests: 0,
        skippedTests: 0,
        duration: 7500,
      };

      const startTime = Date.now();
      await testEngine.recordTestResults(suiteResult);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max

      // Verify all tests were recorded
      for (let i = 0; i < 10; i++) {
        // Check first 10
        const testEntity = await kgService.getEntity(`performance-test-${i}`);
        expect(testEntity).toEqual(expect.any(Object));
      }
    });

    it("should handle concurrent test result processing", async () => {
      const concurrentSuites: TestSuiteResult[] = Array.from(
        { length: 5 },
        (_, i) => ({
          suiteName: `Concurrent Suite ${i}`,
          timestamp: new Date(),
          results: [
            {
              testId: `concurrent-test-${i}`,
              testSuite: `ConcurrentSuite${i}`,
              testName: `concurrent test ${i}`,
              status: "passed",
              duration: 100,
            },
          ],
          framework: "jest",
          totalTests: 1,
          passedTests: 1,
          failedTests: 0,
          skippedTests: 0,
          duration: 100,
        })
      );

      const startTime = Date.now();
      await Promise.all(
        concurrentSuites.map((suite) => testEngine.recordTestResults(suite))
      );
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify all concurrent tests were recorded
      for (let i = 0; i < 5; i++) {
        const testEntity = await kgService.getEntity(`concurrent-test-${i}`);
        expect(testEntity).toEqual(
          expect.objectContaining({ id: `concurrent-test-${i}` })
        );
      }
    });
  });

  describe("Historical Analysis and Trends", () => {
    it("should track test performance over time", async () => {
      const baseTestResult: TestResult = {
        testId: "trend-test-1",
        testSuite: "TrendTests",
        testName: "performance trend test",
        status: "passed",
        duration: 100,
        coverage: {
          statements: 85,
          branches: 80,
          functions: 90,
          lines: 85,
        },
      };

      // Record multiple runs with varying performance
      const runs = [
        { duration: 100, status: "passed" },
        { duration: 95, status: "passed" },
        { duration: 110, status: "passed" },
        { duration: 90, status: "passed" },
        { duration: 105, status: "passed" },
      ];

      for (const run of runs) {
        const suiteResult: TestSuiteResult = {
          suiteName: "Trend Test Suite",
          timestamp: new Date(),
          results: [
            {
              ...baseTestResult,
              duration: run.duration,
              status: run.status as any,
            },
          ],
          framework: "jest",
          totalTests: 1,
          passedTests: run.status === "passed" ? 1 : 0,
          failedTests: run.status === "failed" ? 1 : 0,
          skippedTests: 0,
          duration: run.duration,
        };

        await testEngine.recordTestResults(suiteResult);
      }

      const performanceMetrics = await testEngine.getPerformanceMetrics(
        "trend-test-1"
      );

      expect(performanceMetrics.averageExecutionTime).toBeGreaterThan(0);
      expect(performanceMetrics.historicalData.length).toBeGreaterThan(0);
      expect(performanceMetrics.successRate).toBe(1); // All passed
    });

    it("should calculate performance trends", async () => {
      // Record test data for trend analysis
      const baseTestResult: TestResult = {
        testId: "trend-test-1",
        testSuite: "TrendTests",
        testName: "performance trend test",
        status: "passed",
        duration: 100,
        coverage: {
          statements: 85,
          branches: 80,
          functions: 90,
          lines: 85,
        },
      };

      // Record multiple runs with varying performance
      const runs = [
        { duration: 100, status: "passed" },
        { duration: 95, status: "passed" },
        { duration: 110, status: "passed" },
        { duration: 90, status: "passed" },
        { duration: 105, status: "passed" },
      ];

      for (const run of runs) {
        const suiteResult: TestSuiteResult = {
          suiteName: "Trend Test Suite",
          timestamp: new Date(),
          results: [
            {
              ...baseTestResult,
              duration: run.duration,
              status: run.status as any,
            },
          ],
          framework: "jest",
          totalTests: 1,
          passedTests: run.status === "passed" ? 1 : 0,
          failedTests: run.status === "failed" ? 1 : 0,
          skippedTests: 0,
          duration: run.duration,
        };

        await testEngine.recordTestResults(suiteResult);
      }

      const testEntity = await kgService.getEntity("trend-test-1");
      expect(testEntity).toEqual(
        expect.objectContaining({ id: "trend-test-1" })
      );

      const performanceMetrics = await testEngine.getPerformanceMetrics(
        "trend-test-1"
      );

      // Trend should be calculated (may be stable, improving, or degrading)
      expect(["stable", "improving", "degrading"]).toContain(
        performanceMetrics.trend
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty test results gracefully", async () => {
      const emptySuite: TestSuiteResult = {
        suiteName: "Empty Test Suite",
        timestamp: new Date(),
        results: [],
        framework: "jest",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
      };

      await expect(testEngine.recordTestResults(emptySuite)).rejects.toThrow();
    });

    it("should handle malformed test data", async () => {
      const malformedSuite: TestSuiteResult = {
        suiteName: "Malformed Test Suite",
        timestamp: new Date(),
        results: [
          {
            testId: "",
            testSuite: "",
            testName: "",
            status: "passed",
            duration: -100, // Invalid duration
          },
        ],
        framework: "jest",
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        skippedTests: 0,
        duration: -100,
      };

      await expect(
        testEngine.recordTestResults(malformedSuite)
      ).rejects.toThrow();
    });

    it("should handle database connection failures during recording", async () => {
      // Create a valid test suite
      const suiteResult: TestSuiteResult = {
        suiteName: "Database Failure Test Suite",
        timestamp: new Date(),
        results: [
          {
            testId: "db-failure-test",
            testSuite: "DBFailureTests",
            testName: "should handle db failure",
            status: "passed",
            duration: 100,
          },
        ],
        framework: "jest",
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        skippedTests: 0,
        duration: 100,
      };

      // Temporarily break the database connection
      const originalQuery = dbService.falkordbQuery;
      dbService.falkordbQuery = async () => {
        throw new Error("Database connection failed");
      };

      try {
        await expect(testEngine.recordTestResults(suiteResult)).rejects.toThrow(
          "Test result recording failed"
        );
      } finally {
        // Restore the database connection
        dbService.falkordbQuery = originalQuery;
      }
    });

    it("should handle coverage analysis for non-existent entities", async () => {
      await expect(
        testEngine.getCoverageAnalysis("non-existent-entity")
      ).rejects.toThrow("Test entity non-existent-entity not found");
    });

    it("should handle performance metrics for non-existent tests", async () => {
      await expect(
        testEngine.getPerformanceMetrics("non-existent-test")
      ).rejects.toThrow("Test entity non-existent-test not found");
    });

    it("should handle unsupported test formats", async () => {
      const unsupportedFile = path.join(testDir, "unsupported.txt");
      await fs.writeFile(unsupportedFile, "unsupported format content");

      await expect(
        testEngine.parseTestResults(unsupportedFile, "unsupported" as any)
      ).rejects.toThrow("Unsupported test format");
    });
  });
});
