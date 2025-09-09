/**
 * Test Management Routes
 * Handles test planning, generation, execution recording, and coverage analysis
 */
export async function registerTestRoutes(app, kgService, dbService, testEngine) {
    // POST /api/tests/plan-and-generate - Plan and generate tests
    app.post("/tests/plan-and-generate", {
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
    }, async (request, reply) => {
        try {
            const params = request.body;
            // Validate required parameters
            if (!params.specId || params.specId.trim() === "") {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Specification ID is required and cannot be empty",
                    },
                    requestId: request.id,
                    timestamp: new Date().toISOString(),
                });
            }
            // Get the specification from knowledge graph
            const spec = await kgService.getEntity(params.specId);
            if (!spec || spec.type !== "spec") {
                return reply.status(404).send({
                    success: false,
                    error: {
                        code: "SPEC_NOT_FOUND",
                        message: "Specification not found or invalid",
                    },
                    requestId: request.id,
                    timestamp: new Date().toISOString(),
                });
            }
            // Generate test plan based on specification
            const testPlan = {
                unitTests: [],
                integrationTests: [],
                e2eTests: [],
                performanceTests: [],
            };
            // Generate unit tests for each acceptance criterion
            if (params.testTypes?.includes("unit") || !params.testTypes) {
                for (const criterion of spec.acceptanceCriteria) {
                    testPlan.unitTests.push({
                        name: `Unit test for: ${criterion.substring(0, 50)}...`,
                        description: `Test that ${criterion}`,
                        testCode: `describe('${spec.title}', () => {\n  it('should ${criterion}', () => {\n    // TODO: Implement test\n  });\n});`,
                        estimatedCoverage: {
                            lines: 80,
                            branches: 75,
                            functions: 85,
                            statements: 80,
                        },
                    });
                }
            }
            // Generate integration tests
            if (params.testTypes?.includes("integration") || !params.testTypes) {
                testPlan.integrationTests.push({
                    name: `Integration test for ${spec.title}`,
                    description: `Test integration of components for ${spec.title}`,
                    testCode: `describe('${spec.title} Integration', () => {\n  it('should integrate properly', () => {\n    // TODO: Implement integration test\n  });\n});`,
                    estimatedCoverage: {
                        lines: 60,
                        branches: 55,
                        functions: 65,
                        statements: 60,
                    },
                });
            }
            // Generate E2E tests
            if (params.testTypes?.includes("e2e") || !params.testTypes) {
                testPlan.e2eTests.push({
                    name: `E2E test for ${spec.title}`,
                    description: `End-to-end test for ${spec.title}`,
                    testCode: `describe('${spec.title} E2E', () => {\n  it('should work end-to-end', () => {\n    // TODO: Implement E2E test\n  });\n});`,
                    estimatedCoverage: {
                        lines: 40,
                        branches: 35,
                        functions: 45,
                        statements: 40,
                    },
                });
            }
            // Generate performance tests if requested
            if (params.includePerformanceTests) {
                testPlan.performanceTests.push({
                    name: `Performance test for ${spec.title}`,
                    description: `Performance test to ensure ${spec.title} meets requirements`,
                    testCode: `describe('${spec.title} Performance', () => {\n  it('should meet performance requirements', () => {\n    // TODO: Implement performance test\n  });\n});`,
                    estimatedCoverage: {
                        lines: 30,
                        branches: 25,
                        functions: 35,
                        statements: 30,
                    },
                });
            }
            // Calculate estimated coverage
            const totalTests = testPlan.unitTests.length +
                testPlan.integrationTests.length +
                testPlan.e2eTests.length +
                testPlan.performanceTests.length;
            const estimatedCoverage = {
                lines: Math.min(95, 70 + totalTests * 5),
                branches: Math.max(0, Math.min(95, 65 + totalTests * 4)),
                functions: Math.min(95, 75 + totalTests * 4),
                statements: Math.min(95, 70 + totalTests * 5),
            };
            const response = {
                testPlan,
                estimatedCoverage,
                changedFiles: [], // Would need to track changed files during development
            };
            reply.send({
                success: true,
                data: response,
            });
        }
        catch (error) {
            console.error("Test planning error:", error);
            reply.status(500).send({
                success: false,
                error: {
                    code: "TEST_PLANNING_FAILED",
                    message: "Failed to plan and generate tests",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                requestId: request.id,
                timestamp: new Date().toISOString(),
            });
        }
    });
    // POST /api/tests/record-execution - Record test execution results
    app.post("/tests/record-execution", {
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
    }, async (request, reply) => {
        try {
            const results = Array.isArray(request.body)
                ? request.body
                : [request.body];
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
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "TEST_RECORDING_FAILED",
                    message: "Failed to record test execution results",
                },
            });
        }
    });
    // POST /api/tests/parse-results - Parse and record test results from file
    app.post("/tests/parse-results", {
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
    }, async (request, reply) => {
        try {
            const { filePath, format } = request.body;
            // Use TestEngine to parse and record results
            await testEngine.parseAndRecordTestResults(filePath, format);
            reply.send({
                success: true,
                data: {
                    message: `Test results from ${filePath} parsed and recorded successfully`,
                },
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "TEST_PARSING_FAILED",
                    message: "Failed to parse test results",
                },
            });
        }
    });
    // GET /api/tests/performance/{entityId} - Get performance metrics
    app.get("/tests/performance/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: {
                    entityId: { type: "string" },
                },
                required: ["entityId"],
            },
        },
    }, async (request, reply) => {
        try {
            const { entityId } = request.params;
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
            const metrics = await testEngine.getPerformanceMetrics(entityId);
            reply.send({ success: true, data: metrics });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "METRICS_RETRIEVAL_FAILED",
                    message: "Failed to retrieve performance metrics",
                },
            });
        }
    });
    // GET /api/tests/coverage/{entityId} - Get test coverage
    app.get("/tests/coverage/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: {
                    entityId: { type: "string" },
                },
                required: ["entityId"],
            },
        },
    }, async (request, reply) => {
        try {
            const { entityId } = request.params;
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
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "COVERAGE_RETRIEVAL_FAILED",
                    message: "Failed to retrieve test coverage data",
                },
            });
        }
    });
    // GET /api/tests/flaky-analysis/{entityId} - Get flaky test analysis
    app.get("/tests/flaky-analysis/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: {
                    entityId: { type: "string" },
                },
                required: ["entityId"],
            },
        },
    }, async (request, reply) => {
        try {
            const { entityId } = request.params;
            // Get flaky test analysis for the specific entity from TestEngine
            // Prefer server-side filtering when supported
            const analyses = await testEngine.analyzeFlakyTests([entityId]);
            // Find analysis for specific entity
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
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "FLAKY_ANALYSIS_FAILED",
                    message: "Failed to retrieve flaky test analysis",
                },
            });
        }
    });
}
//# sourceMappingURL=tests.js.map