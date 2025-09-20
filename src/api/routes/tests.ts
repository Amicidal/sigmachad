/**
 * Test Management Routes
 * Handles test planning, generation, execution recording, and coverage analysis
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
import { TestEngine } from "../../services/TestEngine.js";
import { TestPlanningService, SpecNotFoundError, TestPlanningValidationError } from "../../services/TestPlanningService.js";
import { RelationshipType } from "../../models/relationships.js";
import type { TestPerformanceMetrics } from "../../models/entities.js";
import type {
  TestPlanRequest,
  TestPlanResponse,
  TestExecutionResult,
  PerformanceHistoryOptions,
} from "../../models/types.js";
import { resolvePerformanceHistoryOptions } from "../../utils/performanceFilters.js";

const createEmptyPerformanceMetrics = (): TestPerformanceMetrics => ({
  averageExecutionTime: 0,
  p95ExecutionTime: 0,
  successRate: 0,
  trend: "stable",
  benchmarkComparisons: [],
  historicalData: [],
});

export const aggregatePerformanceMetrics = (
  metrics: TestPerformanceMetrics[]
): TestPerformanceMetrics => {
  if (metrics.length === 0) {
    return createEmptyPerformanceMetrics();
  }

  const total = metrics.length;
  const sum = metrics.reduce(
    (acc, item) => {
      acc.averageExecutionTime += item.averageExecutionTime ?? 0;
      acc.p95ExecutionTime += item.p95ExecutionTime ?? 0;
      acc.successRate += item.successRate ?? 0;
      if (item.trend === "degrading") {
        acc.trend.degrading += 1;
      } else if (item.trend === "improving") {
        acc.trend.improving += 1;
      } else {
        acc.trend.stable += 1;
      }
      if (Array.isArray(item.benchmarkComparisons)) {
        acc.benchmarkComparisons.push(...item.benchmarkComparisons);
      }
      if (Array.isArray(item.historicalData)) {
        acc.historicalData.push(...item.historicalData);
      }
      return acc;
    },
    {
      averageExecutionTime: 0,
      p95ExecutionTime: 0,
      successRate: 0,
      trend: { improving: 0, stable: 0, degrading: 0 },
      benchmarkComparisons: [] as TestPerformanceMetrics["benchmarkComparisons"],
      historicalData: [] as TestPerformanceMetrics["historicalData"],
    }
  );

  const trendPriority: Record<TestPerformanceMetrics["trend"], number> = {
    degrading: 0,
    improving: 1,
    stable: 2,
  };
  const dominantTrend = (Object.entries(sum.trend) as Array<
    [TestPerformanceMetrics["trend"], number]
  >).reduce(
    (best, [trend, count]) => {
      if (count > best.count) {
        return { trend, count };
      }
      if (count === best.count && trendPriority[trend] < trendPriority[best.trend]) {
        return { trend, count };
      }
      return best;
    },
    { trend: "stable" as TestPerformanceMetrics["trend"], count: -1 }
  ).trend;

  // Limit historical data to the most recent entries to avoid large payloads
  const historicalData = sum.historicalData
    .map((entry) => {
      const timestamp = (() => {
        if (entry.timestamp instanceof Date && !Number.isNaN(entry.timestamp.getTime())) {
          return entry.timestamp;
        }
        const parsed = new Date((entry as any).timestamp);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      })();

      const averageExecutionTime = typeof entry.averageExecutionTime === "number"
        ? entry.averageExecutionTime
        : typeof entry.executionTime === "number"
        ? entry.executionTime
        : 0;

      const p95ExecutionTime = typeof entry.p95ExecutionTime === "number"
        ? entry.p95ExecutionTime
        : averageExecutionTime;

      const executionTime = typeof entry.executionTime === "number"
        ? entry.executionTime
        : averageExecutionTime;

      return {
        ...entry,
        timestamp,
        averageExecutionTime,
        p95ExecutionTime,
        executionTime,
      };
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-100);

  return {
    averageExecutionTime: sum.averageExecutionTime / total,
    p95ExecutionTime: sum.p95ExecutionTime / total,
    successRate: sum.successRate / total,
    trend: dominantTrend,
    benchmarkComparisons: sum.benchmarkComparisons,
    historicalData,
  };
};

const extractSearchTokens = (
  input: string | string[] | undefined
): string[] => {
  if (!input) {
    return [];
  }
  const text = Array.isArray(input) ? input.join(" ") : input;
  const matches = text.match(/[A-Za-z][A-Za-z0-9_-]{4,}/g) || [];
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const match of matches) {
    const token = match.toLowerCase();
    if (token.length < 6) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
};

const generateTokenVariants = (token: string): string[] => {
  const variants = new Set<string>();
  const base = token.toLowerCase();
  if (base.length >= 6) {
    variants.add(base);
  }

  const addStem = (stem: string) => {
    if (stem.length >= 5) {
      variants.add(stem);
    }
  };

  if (base.endsWith("ies") && base.length > 3) {
    addStem(base.slice(0, -3) + "y");
  }
  if (base.endsWith("ing") && base.length > 5) {
    addStem(base.slice(0, -3));
  }
  if (base.endsWith("ed") && base.length > 4) {
    addStem(base.slice(0, -2));
  }
  if (base.endsWith("s") && base.length > 5) {
    addStem(base.slice(0, -1));
  }
  if (base.endsWith("ency") && base.length > 6) {
    addStem(base.slice(0, -4));
  }
  if (base.endsWith("ance") && base.length > 6) {
    addStem(base.slice(0, -4));
  }
  if ((base.endsWith("ent") || base.endsWith("ant")) && base.length > 5) {
    addStem(base.slice(0, -3));
  }
  if (base.endsWith("tion") && base.length > 6) {
    addStem(base.slice(0, -4));
  }

  return Array.from(variants);
};

interface TestCoverage {
  entityId: string;
  overallCoverage: any;
  testBreakdown: {
    unitTests: any;
    integrationTests: any;
    e2eTests: any;
  };
  uncoveredLines: number[];
  uncoveredBranches: number[];
  testCases: {
    testId: string;
    testName: string;
    covers: string[];
  }[];
}

interface PerformanceMetrics {
  entityId: string;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: "above" | "below" | "at";
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    successRate: number;
  }[];
}

export async function registerTestRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService,
  testEngine: TestEngine
): Promise<void> {
  const testPlanningService = new TestPlanningService(kgService);

  // POST /api/tests/plan-and-generate - Plan and generate tests
  app.post(
    "/tests/plan-and-generate",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            specId: { type: "string" },
            testTypes: {
              type: "array",
              items: { type: "string", enum: ["unit", "integration", "e2e"] },
            },
            coverage: {
              type: "object",
              properties: {
                minLines: { type: "number" },
                minBranches: { type: "number" },
                minFunctions: { type: "number" },
              },
            },
            includePerformanceTests: { type: "boolean" },
            includeSecurityTests: { type: "boolean" },
          },
          required: ["specId"],
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const params = request.body as TestPlanRequest;
        const planningResult = await testPlanningService.planTests(params);

        reply.send({
          success: true,
          data: planningResult satisfies TestPlanResponse,
        });
      } catch (error) {
        if (error instanceof TestPlanningValidationError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: error.code,
              message: error.message,
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        if (error instanceof SpecNotFoundError) {
          return reply.status(404).send({
            success: false,
            error: {
              code: error.code,
              message: "Specification not found",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        console.error("Test planning error:", error);
        reply.status(500).send({
          success: false,
          error: {
            code: "TEST_PLANNING_FAILED",
            message: "Failed to plan and generate tests",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          requestId: (request as any).id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // POST /api/tests/record-execution - Record test execution results
  app.post(
    "/tests/record-execution",
    {
      schema: {
        body: {
          // Accept either a single object or an array of objects
          oneOf: [
            {
              type: "object",
              properties: {
                testId: { type: "string" },
                testSuite: { type: "string" },
                testName: { type: "string" },
                status: {
                  type: "string",
                  enum: ["passed", "failed", "skipped", "error"],
                },
                duration: { type: "number" },
                errorMessage: { type: "string" },
                stackTrace: { type: "string" },
                coverage: {
                  type: "object",
                  properties: {
                    lines: { type: "number" },
                    branches: { type: "number" },
                    functions: { type: "number" },
                    statements: { type: "number" },
                  },
                },
                performance: {
                  type: "object",
                  properties: {
                    memoryUsage: { type: "number" },
                    cpuUsage: { type: "number" },
                    networkRequests: { type: "number" },
                  },
                },
              },
              required: [
                "testId",
                "testSuite",
                "testName",
                "status",
                "duration",
              ],
            },
            {
              type: "array",
              items: {
                type: "object",
                properties: {
                  testId: { type: "string" },
                  testSuite: { type: "string" },
                  testName: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["passed", "failed", "skipped", "error"],
                  },
                  duration: { type: "number" },
                  errorMessage: { type: "string" },
                  stackTrace: { type: "string" },
                  coverage: {
                    type: "object",
                    properties: {
                      lines: { type: "number" },
                      branches: { type: "number" },
                      functions: { type: "number" },
                      statements: { type: "number" },
                    },
                  },
                  performance: {
                    type: "object",
                    properties: {
                      memoryUsage: { type: "number" },
                      cpuUsage: { type: "number" },
                      networkRequests: { type: "number" },
                    },
                  },
                },
                required: [
                  "testId",
                  "testSuite",
                  "testName",
                  "status",
                  "duration",
                ],
              },
            },
          ],
        },
      },
    },
    async (request, reply) => {
      try {
        const results: TestExecutionResult[] = Array.isArray(request.body)
          ? (request.body as TestExecutionResult[])
          : [request.body as TestExecutionResult];

        // Convert to TestSuiteResult format
        const suiteResult = {
          suiteName: "API Recorded Tests",
          timestamp: new Date(),
          framework: "api",
          totalTests: results.length,
          passedTests: results.filter((r) => r.status === "passed").length,
          failedTests: results.filter((r) => r.status === "failed").length,
          skippedTests: results.filter((r) => r.status === "skipped").length,
          duration: results.reduce((sum, r) => sum + r.duration, 0),
          results: results.map((r) => ({
            testId: r.testId,
            testSuite: r.testSuite,
            testName: r.testName,
            status: r.status,
            duration: r.duration,
            errorMessage: r.errorMessage,
            stackTrace: r.stackTrace,
            coverage: r.coverage,
            performance: r.performance,
          })),
        };

        // Use TestEngine to record results
        await testEngine.recordTestResults(suiteResult);

        reply.send({
          success: true,
          data: { recorded: results.length },
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "TEST_RECORDING_FAILED",
            message: "Failed to record test execution results",
          },
        });
      }
    }
  );

  // POST /api/tests/parse-results - Parse and record test results from file
  app.post(
    "/tests/parse-results",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            filePath: { type: "string" },
            format: {
              type: "string",
              enum: [
                "junit",
                "jest",
                "mocha",
                "vitest",
                "cypress",
                "playwright",
              ],
            },
          },
          required: ["filePath", "format"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { filePath, format } = request.body as {
          filePath: string;
          format: string;
        };

        // Use TestEngine to parse and record results
        await testEngine.parseAndRecordTestResults(filePath, format as any);

        reply.send({
          success: true,
          data: {
            message: `Test results from ${filePath} parsed and recorded successfully`,
          },
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "TEST_PARSING_FAILED",
            message: "Failed to parse test results",
          },
        });
      }
    }
  );

  // GET /api/tests/performance/{entityId} - Get performance metrics
  app.get(
    "/tests/performance/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            entityId: { type: "string" },
          },
          required: ["entityId"],
        },
        querystring: {
          type: "object",
          properties: {
            metricId: { type: "string" },
            environment: { type: "string" },
            severity: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
            },
            limit: { type: "integer", minimum: 1, maximum: 500 },
            days: { type: "integer", minimum: 1, maximum: 365 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        const entity = await kgService.getEntity(entityId);
        if (!entity) {
          return reply
            .status(404)
            .send({
              success: false,
              error: { code: "NOT_FOUND", message: "Entity not found" },
            });
        }

        const queryParams = (request.query || {}) as Record<string, any>;
        const historyOptions = resolvePerformanceHistoryOptions(queryParams);

        const entityType = (entity as any)?.type;
        if (entityType === "test") {

          let metrics = (entity as any)?.performanceMetrics as
            | TestPerformanceMetrics
            | undefined;
          if (!metrics) {
            try {
              metrics = await testEngine.getPerformanceMetrics(entityId);
            } catch (error) {
              metrics = undefined;
            }
          }

          const history = await dbService.getPerformanceMetricsHistory(
            entityId,
            historyOptions
          );

          reply.send({
            success: true,
            data: {
              metrics: metrics ?? createEmptyPerformanceMetrics(),
              history,
            },
          });
          return;
        }

        const relatedEdges = await kgService.getRelationships({
          toEntityId: entityId,
          type: [RelationshipType.VALIDATES, RelationshipType.TESTS],
          limit: 50,
        });

        const relatedTestIds = new Set<string>();
        for (const edge of relatedEdges || []) {
          if (edge?.fromEntityId) {
            relatedTestIds.add(edge.fromEntityId);
          }
        }

        if (relatedTestIds.size === 0) {
          const specEdges = await kgService.getRelationships({
            fromEntityId: entityId,
            type: [RelationshipType.REQUIRES, RelationshipType.IMPACTS],
            limit: 50,
          });

          const candidateTargets = new Set<string>();
          for (const edge of specEdges || []) {
            if (edge?.toEntityId) {
              candidateTargets.add(edge.toEntityId);
            }
          }

          if (candidateTargets.size > 0) {
            const downstreamEdges = await Promise.all(
              Array.from(candidateTargets).map((targetId) =>
                kgService
                  .getRelationships({
                    toEntityId: targetId,
                    type: RelationshipType.TESTS,
                    limit: 50,
                  })
                  .catch(() => [])
              )
            );

            for (const edgeGroup of downstreamEdges) {
              for (const edge of edgeGroup || []) {
                if (edge?.fromEntityId) {
                  relatedTestIds.add(edge.fromEntityId);
                }
              }
            }
          }

          if (relatedTestIds.size === 0) {
            const acceptanceTokens = extractSearchTokens(
              (entity as any)?.acceptanceCriteria
            );
            const variantSet = new Set<string>();
            for (const token of acceptanceTokens) {
              for (const variant of generateTokenVariants(token)) {
                variantSet.add(variant);
              }
            }

            if (variantSet.size === 0) {
              const fallbackTokens = extractSearchTokens(
                (entity as any)?.description || (entity as any)?.title
              );
              for (const token of fallbackTokens) {
                for (const variant of generateTokenVariants(token)) {
                  variantSet.add(variant);
                }
              }
            }

            const tokenList = Array.from(variantSet).slice(0, 5);
            for (const token of tokenList) {
              try {
                const results = await kgService.search({
                  query: token,
                  entityTypes: ["test"],
                  searchType: "structural",
                  limit: 5,
                });
                for (const result of results) {
                  if ((result as any)?.type === "test" && result.id) {
                    relatedTestIds.add(result.id);
                  }
                }
              } catch (error) {
                // Ignore search failures and continue with other tokens
              }
            }

            if (relatedTestIds.size === 0) {
              return reply.status(404).send({
                success: false,
                error: {
                  code: "METRICS_NOT_FOUND",
                  message: "No performance metrics recorded for this entity",
                },
              });
            }
          }
        }

        const metricsResults = await Promise.all(
          Array.from(relatedTestIds).map(async (testId) => {
            try {
              const relatedEntity = await kgService.getEntity(testId);
              if (!relatedEntity || (relatedEntity as any).type !== "test") {
                return null;
              }
              const existing = (relatedEntity as any)
                .performanceMetrics as TestPerformanceMetrics | undefined;
              if (existing) {
                return existing;
              }
              return await testEngine.getPerformanceMetrics(testId).catch(() => null);
            } catch (error) {
              return null;
            }
          })
        );

        const aggregatedMetrics = metricsResults.filter(
          (item): item is TestPerformanceMetrics => item !== null && item !== undefined
        );

        if (aggregatedMetrics.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "METRICS_NOT_FOUND",
              message: "No performance metrics recorded for this entity",
            },
          });
        }

        const historyLimit = historyOptions.limit;
        const perTestLimit =
          historyLimit && relatedTestIds.size > 0
            ? Math.max(1, Math.ceil(historyLimit / relatedTestIds.size))
            : historyLimit;

        const historyBatches = await Promise.all(
          Array.from(relatedTestIds).map((testId) =>
            dbService
              .getPerformanceMetricsHistory(
                testId,
                perTestLimit !== undefined
                  ? { ...historyOptions, limit: perTestLimit }
                  : historyOptions
              )
              .catch(() => [])
          )
        );

        const combinedHistory = historyBatches
          .flat()
          .sort((a, b) => {
            const aTime = a.detectedAt?.getTime?.() ?? 0;
            const bTime = b.detectedAt?.getTime?.() ?? 0;
            return bTime - aTime;
          })
          .slice(0, historyLimit ?? 100);

        reply.send({
          success: true,
          data: {
            metrics: aggregatePerformanceMetrics(aggregatedMetrics),
            history: combinedHistory,
          },
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "METRICS_RETRIEVAL_FAILED",
            message: "Failed to retrieve performance metrics",
          },
        });
      }
    }
  );

  // GET /api/tests/coverage/{entityId} - Get test coverage
  app.get(
    "/tests/coverage/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            entityId: { type: "string" },
          },
          required: ["entityId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Return 404 if the entity doesn't exist in the KG
        const entity = await kgService.getEntity(entityId);
        if (!entity) {
          return reply
            .status(404)
            .send({
              success: false,
              error: { code: "NOT_FOUND", message: "Entity not found" },
            });
        }

        const coverage = await testEngine.getCoverageAnalysis(entityId);

        reply.send({ success: true, data: coverage });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "COVERAGE_RETRIEVAL_FAILED",
            message: "Failed to retrieve test coverage data",
          },
        });
      }
    }
  );

  // GET /api/tests/flaky-analysis/{entityId} - Get flaky test analysis
  app.get(
    "/tests/flaky-analysis/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            entityId: { type: "string" },
          },
          required: ["entityId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        const analyses = await testEngine.getFlakyTestAnalysis(entityId);

        const analysis = analyses.find((a) => a.testId === entityId);

        if (!analysis) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "ANALYSIS_NOT_FOUND",
              message: "No flaky test analysis found for this entity",
            },
          });
        }

        reply.send({
          success: true,
          data: analysis,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "FLAKY_ANALYSIS_FAILED",
            message: "Failed to retrieve flaky test analysis",
          },
        });
      }
    }
  );
}
