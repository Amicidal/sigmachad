/**
 * Unit tests for Test Routes
 * Tests test planning, execution recording, coverage analysis, and performance monitoring endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerTestRoutes } from '../../../../src/api/routes/tests.js';
import { createMockRequest, createMockReply } from '../../../test-utils.js';
// Mock services
vi.mock('../../../../src/services/KnowledgeGraphService.js', () => ({
    KnowledgeGraphService: vi.fn()
}));
vi.mock('../../../../src/services/DatabaseService.js', () => ({
    DatabaseService: vi.fn()
}));
vi.mock('../../../../src/services/TestEngine.js', () => ({
    TestEngine: vi.fn()
}));
describe('Test Routes', () => {
    let mockApp;
    let mockKgService;
    let mockDbService;
    let mockTestEngine;
    let mockRequest;
    let mockReply;
    // Create a properly mocked Fastify app that tracks registered routes
    const createMockApp = () => {
        const routes = new Map();
        const registerRoute = (method, path, handler, _options) => {
            const key = `${method}:${path}`;
            routes.set(key, handler);
        };
        return {
            get: vi.fn((path, optionsOrHandler, handler) => {
                if (typeof optionsOrHandler === 'function') {
                    registerRoute('get', path, optionsOrHandler);
                }
                else if (handler) {
                    registerRoute('get', path, handler);
                }
            }),
            post: vi.fn((path, optionsOrHandler, handler) => {
                if (typeof optionsOrHandler === 'function') {
                    registerRoute('post', path, optionsOrHandler);
                }
                else if (handler) {
                    registerRoute('post', path, handler);
                }
            }),
            getRegisteredRoutes: () => routes
        };
    };
    // Helper function to extract route handlers
    const getHandler = (method, path, app = mockApp) => {
        const routes = app.getRegisteredRoutes();
        const key = `${method}:${path}`;
        const handler = routes.get(key);
        if (!handler) {
            const availableRoutes = Array.from(routes.keys()).join(', ');
            throw new Error(`Route ${key} not found. Available routes: ${availableRoutes}`);
        }
        return handler;
    };
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();
        // Create mock services
        mockKgService = vi.fn();
        mockDbService = vi.fn();
        mockTestEngine = vi.fn();
        // Mock Fastify app - recreate it fresh for each test
        mockApp = createMockApp();
        // Create fresh mocks for each test
        mockRequest = createMockRequest();
        mockReply = createMockReply();
    });
    describe('registerTestRoutes', () => {
        it('should register all test routes with required services', async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            // Verify all routes are registered
            expect(mockApp.post).toHaveBeenCalledWith('/tests/plan-and-generate', expect.any(Object), expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/tests/record-execution', expect.any(Object), expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/tests/parse-results', expect.any(Object), expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/tests/performance/:entityId', expect.any(Object), expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/tests/coverage/:entityId', expect.any(Object), expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/tests/flaky-analysis/:entityId', expect.any(Object), expect.any(Function));
        });
        it('should register routes with minimal services', async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            // All routes should be registered
            expect(mockApp.post).toHaveBeenCalledTimes(3);
            expect(mockApp.get).toHaveBeenCalledTimes(3);
        });
    });
    describe('POST /tests/plan-and-generate', () => {
        let planHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            planHandler = getHandler('post', '/tests/plan-and-generate');
        });
        it('should generate test plan for unit tests only', async () => {
            const specId = 'spec-123';
            const mockSpec = {
                id: specId,
                type: 'spec',
                title: 'User Authentication',
                acceptanceCriteria: [
                    'User can log in with valid credentials',
                    'User cannot log in with invalid credentials',
                    'Password must be at least 8 characters'
                ]
            };
            mockRequest.body = {
                specId,
                testTypes: ['unit']
            };
            mockKgService.getEntity = vi.fn().mockResolvedValue(mockSpec);
            await planHandler(mockRequest, mockReply);
            expect(mockKgService.getEntity).toHaveBeenCalledWith(specId);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    testPlan: expect.objectContaining({
                        unitTests: expect.any(Array),
                        integrationTests: [],
                        e2eTests: [],
                        performanceTests: []
                    }),
                    estimatedCoverage: expect.any(Object),
                    changedFiles: []
                })
            });
            const responseData = mockReply.send.mock.calls[0][0].data;
            expect(responseData.testPlan.unitTests).toHaveLength(3);
            expect(responseData.testPlan.unitTests[0].name).toContain('Unit test for: User can log in');
            expect(responseData.testPlan.unitTests[0].description).toBe('Test that User can log in with valid credentials');
        });
        it('should generate test plan for all test types', async () => {
            const specId = 'spec-456';
            const mockSpec = {
                id: specId,
                type: 'spec',
                title: 'Shopping Cart',
                acceptanceCriteria: ['User can add items to cart']
            };
            mockRequest.body = {
                specId,
                testTypes: ['unit', 'integration', 'e2e'],
                includePerformanceTests: true
            };
            mockKgService.getEntity = vi.fn().mockResolvedValue(mockSpec);
            await planHandler(mockRequest, mockReply);
            const responseData = mockReply.send.mock.calls[0][0].data;
            expect(responseData.testPlan.unitTests).toHaveLength(1);
            expect(responseData.testPlan.integrationTests).toHaveLength(1);
            expect(responseData.testPlan.e2eTests).toHaveLength(1);
            expect(responseData.testPlan.performanceTests).toHaveLength(1);
        });
        it('should generate all test types when testTypes is not specified', async () => {
            const specId = 'spec-789';
            const mockSpec = {
                id: specId,
                type: 'spec',
                title: 'Payment Processing',
                acceptanceCriteria: ['Payment is processed successfully']
            };
            mockRequest.body = { specId };
            mockKgService.getEntity = vi.fn().mockResolvedValue(mockSpec);
            await planHandler(mockRequest, mockReply);
            const responseData = mockReply.send.mock.calls[0][0].data;
            expect(responseData.testPlan.unitTests).toHaveLength(1);
            expect(responseData.testPlan.integrationTests).toHaveLength(1);
            expect(responseData.testPlan.e2eTests).toHaveLength(1);
            expect(responseData.testPlan.performanceTests).toHaveLength(0); // Not included by default
        });
        it('should calculate estimated coverage based on test count', async () => {
            const specId = 'spec-coverage';
            const mockSpec = {
                id: specId,
                type: 'spec',
                title: 'Coverage Test',
                acceptanceCriteria: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5']
            };
            mockRequest.body = {
                specId,
                testTypes: ['unit'],
                includePerformanceTests: true
            };
            mockKgService.getEntity = vi.fn().mockResolvedValue(mockSpec);
            await planHandler(mockRequest, mockReply);
            const responseData = mockReply.send.mock.calls[0][0].data;
            expect(responseData.estimatedCoverage.lines).toBeGreaterThan(70);
            expect(responseData.estimatedCoverage.functions).toBeGreaterThan(75);
        });
        it('should return 404 when specification not found', async () => {
            mockRequest.body = { specId: 'non-existent-spec' };
            mockKgService.getEntity = vi.fn().mockResolvedValue(null);
            await planHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'SPEC_NOT_FOUND',
                    message: 'Specification not found'
                }
            });
        });
        it('should return 404 when entity is not a specification', async () => {
            const mockEntity = {
                id: 'file-123',
                type: 'file',
                path: '/src/components/Button.tsx'
            };
            mockRequest.body = { specId: 'file-123' };
            mockKgService.getEntity = vi.fn().mockResolvedValue(mockEntity);
            await planHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'SPEC_NOT_FOUND',
                    message: 'Specification not found'
                }
            });
        });
        it('should handle knowledge graph errors gracefully', async () => {
            mockRequest.body = { specId: 'spec-error' };
            mockKgService.getEntity = vi.fn().mockRejectedValue(new Error('Knowledge graph error'));
            await planHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'TEST_PLANNING_FAILED',
                    message: 'Failed to plan and generate tests'
                }
            });
        });
        it('should handle missing specId in request body', async () => {
            mockRequest.body = {};
            await planHandler(mockRequest, mockReply);
            // This should fail schema validation, but since we're mocking Fastify
            // the error will come from the knowledge graph service call
            expect(mockReply.status).toHaveBeenCalledWith(500);
        });
    });
    describe('POST /tests/record-execution', () => {
        let recordHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            recordHandler = getHandler('post', '/tests/record-execution');
        });
        it('should record single test execution result', async () => {
            const testResult = {
                testId: 'test-123',
                testSuite: 'AuthService',
                testName: 'should authenticate user',
                status: 'passed',
                duration: 150
            };
            mockRequest.body = testResult;
            mockTestEngine.recordTestResults = vi.fn().mockResolvedValue(undefined);
            await recordHandler(mockRequest, mockReply);
            expect(mockTestEngine.recordTestResults).toHaveBeenCalledWith({
                suiteName: 'API Recorded Tests',
                timestamp: expect.any(Date),
                framework: 'api',
                totalTests: 1,
                passedTests: 1,
                failedTests: 0,
                skippedTests: 0,
                duration: 150,
                results: [expect.objectContaining({
                        testId: 'test-123',
                        testSuite: 'AuthService',
                        testName: 'should authenticate user',
                        status: 'passed',
                        duration: 150
                    })]
            });
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: { recorded: 1 }
            });
        });
        it('should record multiple test execution results', async () => {
            const testResults = [
                {
                    testId: 'test-1',
                    testSuite: 'AuthService',
                    testName: 'should authenticate user',
                    status: 'passed',
                    duration: 150
                },
                {
                    testId: 'test-2',
                    testSuite: 'AuthService',
                    testName: 'should reject invalid credentials',
                    status: 'failed',
                    duration: 200,
                    errorMessage: 'Expected to throw but did not'
                },
                {
                    testId: 'test-3',
                    testSuite: 'AuthService',
                    testName: 'should handle network timeout',
                    status: 'skipped',
                    duration: 0
                }
            ];
            mockRequest.body = testResults;
            mockTestEngine.recordTestResults = vi.fn().mockResolvedValue(undefined);
            await recordHandler(mockRequest, mockReply);
            expect(mockTestEngine.recordTestResults).toHaveBeenCalledWith({
                suiteName: 'API Recorded Tests',
                timestamp: expect.any(Date),
                framework: 'api',
                totalTests: 3,
                passedTests: 1,
                failedTests: 1,
                skippedTests: 1,
                duration: 350,
                results: expect.any(Array)
            });
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: { recorded: 3 }
            });
        });
        it('should handle test results with coverage and performance data', async () => {
            const testResult = {
                testId: 'test-coverage',
                testSuite: 'ServiceTest',
                testName: 'should handle complex scenario',
                status: 'passed',
                duration: 500,
                coverage: {
                    lines: 85,
                    branches: 78,
                    functions: 90,
                    statements: 84
                },
                performance: {
                    memoryUsage: 25.5,
                    cpuUsage: 15.2,
                    networkRequests: 3
                }
            };
            mockRequest.body = testResult;
            mockTestEngine.recordTestResults = vi.fn().mockResolvedValue(undefined);
            await recordHandler(mockRequest, mockReply);
            const recordedSuite = mockTestEngine.recordTestResults.mock.calls[0][0];
            expect(recordedSuite.results[0].coverage).toEqual(testResult.coverage);
            expect(recordedSuite.results[0].performance).toEqual(testResult.performance);
        });
        it('should handle test engine errors', async () => {
            mockRequest.body = {
                testId: 'test-error',
                testSuite: 'ErrorSuite',
                testName: 'should handle errors',
                status: 'error',
                duration: 100
            };
            mockTestEngine.recordTestResults = vi.fn().mockRejectedValue(new Error('Database connection failed'));
            await recordHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'TEST_RECORDING_FAILED',
                    message: 'Failed to record test execution results'
                }
            });
        });
    });
    describe('POST /tests/parse-results', () => {
        let parseHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            parseHandler = getHandler('post', '/tests/parse-results');
        });
        it('should parse and record Jest test results', async () => {
            mockRequest.body = {
                filePath: '/tmp/jest-results.json',
                format: 'jest'
            };
            mockTestEngine.parseAndRecordTestResults = vi.fn().mockResolvedValue(undefined);
            await parseHandler(mockRequest, mockReply);
            expect(mockTestEngine.parseAndRecordTestResults).toHaveBeenCalledWith('/tmp/jest-results.json', 'jest');
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: {
                    message: 'Test results from /tmp/jest-results.json parsed and recorded successfully'
                }
            });
        });
        it('should parse and record JUnit test results', async () => {
            mockRequest.body = {
                filePath: '/tmp/junit-results.xml',
                format: 'junit'
            };
            mockTestEngine.parseAndRecordTestResults = vi.fn().mockResolvedValue(undefined);
            await parseHandler(mockRequest, mockReply);
            expect(mockTestEngine.parseAndRecordTestResults).toHaveBeenCalledWith('/tmp/junit-results.xml', 'junit');
        });
        it('should parse and record Vitest test results', async () => {
            mockRequest.body = {
                filePath: '/tmp/vitest-results.json',
                format: 'vitest'
            };
            mockTestEngine.parseAndRecordTestResults = vi.fn().mockResolvedValue(undefined);
            await parseHandler(mockRequest, mockReply);
            expect(mockTestEngine.parseAndRecordTestResults).toHaveBeenCalledWith('/tmp/vitest-results.json', 'vitest');
        });
        it('should handle parsing errors', async () => {
            mockRequest.body = {
                filePath: '/tmp/invalid-results.json',
                format: 'jest'
            };
            mockTestEngine.parseAndRecordTestResults = vi.fn().mockRejectedValue(new Error('Invalid JSON format'));
            await parseHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'TEST_PARSING_FAILED',
                    message: 'Failed to parse test results'
                }
            });
        });
    });
    describe('GET /tests/performance/:entityId', () => {
        let performanceHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            performanceHandler = getHandler('get', '/tests/performance/:entityId');
        });
        it('should return performance metrics for valid entity', async () => {
            const entityId = 'test-entity-123';
            const mockMetrics = {
                averageExecutionTime: 245.5,
                p95ExecutionTime: 320.0,
                successRate: 0.92,
                trend: 'improving',
                benchmarkComparisons: [
                    { benchmark: 'industry_avg', value: 280.0, status: 'above' }
                ],
                historicalData: [
                    { timestamp: new Date('2023-01-01'), executionTime: 250.0, successRate: 0.9 },
                    { timestamp: new Date('2023-01-02'), executionTime: 245.0, successRate: 0.92 }
                ]
            };
            mockRequest.params = { entityId };
            mockTestEngine.getPerformanceMetrics = vi.fn().mockResolvedValue(mockMetrics);
            await performanceHandler(mockRequest, mockReply);
            expect(mockTestEngine.getPerformanceMetrics).toHaveBeenCalledWith(entityId);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
        });
        it('should handle performance metrics retrieval errors', async () => {
            mockRequest.params = { entityId: 'non-existent-entity' };
            mockTestEngine.getPerformanceMetrics = vi.fn().mockRejectedValue(new Error('Entity not found'));
            await performanceHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'METRICS_RETRIEVAL_FAILED',
                    message: 'Failed to retrieve performance metrics'
                }
            });
        });
    });
    describe('GET /tests/coverage/:entityId', () => {
        let coverageHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            coverageHandler = getHandler('get', '/tests/coverage/:entityId');
        });
        it('should return coverage analysis for valid entity', async () => {
            const entityId = 'service-coverage-123';
            const mockCoverage = {
                entityId,
                overallCoverage: {
                    lines: 85.5,
                    branches: 78.2,
                    functions: 92.1,
                    statements: 84.8
                },
                testBreakdown: {
                    unitTests: {
                        lines: 88.0,
                        branches: 82.0,
                        functions: 95.0,
                        statements: 87.5
                    },
                    integrationTests: {
                        lines: 75.0,
                        branches: 68.0,
                        functions: 80.0,
                        statements: 74.0
                    },
                    e2eTests: {
                        lines: 60.0,
                        branches: 55.0,
                        functions: 65.0,
                        statements: 58.0
                    }
                },
                uncoveredLines: [15, 23, 67],
                uncoveredBranches: [12, 45],
                testCases: [
                    {
                        testId: 'unit-test-1',
                        testName: 'should handle valid input',
                        covers: ['service-coverage-123']
                    }
                ]
            };
            mockRequest.params = { entityId };
            mockTestEngine.getCoverageAnalysis = vi.fn().mockResolvedValue(mockCoverage);
            await coverageHandler(mockRequest, mockReply);
            expect(mockTestEngine.getCoverageAnalysis).toHaveBeenCalledWith(entityId);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: mockCoverage
            });
        });
        it('should handle coverage analysis errors', async () => {
            mockRequest.params = { entityId: 'invalid-entity' };
            mockTestEngine.getCoverageAnalysis = vi.fn().mockRejectedValue(new Error('Coverage data not available'));
            await coverageHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'COVERAGE_RETRIEVAL_FAILED',
                    message: 'Failed to retrieve test coverage data'
                }
            });
        });
    });
    describe('GET /tests/flaky-analysis/:entityId', () => {
        let flakyHandler;
        beforeEach(async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            flakyHandler = getHandler('get', '/tests/flaky-analysis/:entityId');
        });
        it('should return flaky test analysis for valid entity', async () => {
            const entityId = 'flaky-test-123';
            const mockAnalysis = {
                testId: entityId,
                testName: 'should handle network timeouts',
                flakyScore: 0.75,
                totalRuns: 100,
                failureRate: 0.15,
                successRate: 0.85,
                recentFailures: 5,
                patterns: {
                    timeOfDay: 'evening',
                    environment: 'staging',
                    duration: 'long-running'
                },
                recommendations: [
                    'Consider rewriting this test to be more deterministic',
                    'Check for race conditions or timing dependencies',
                    'Add retry logic if the failure is intermittent'
                ]
            };
            mockRequest.params = { entityId };
            mockTestEngine.analyzeFlakyTests = vi.fn().mockResolvedValue([mockAnalysis]);
            await flakyHandler(mockRequest, mockReply);
            expect(mockTestEngine.analyzeFlakyTests).toHaveBeenCalledWith([entityId]);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: mockAnalysis
            });
        });
        it('should return 404 when no analysis found for entity', async () => {
            const entityId = 'non-flaky-test';
            mockRequest.params = { entityId };
            mockTestEngine.analyzeFlakyTests = vi.fn().mockResolvedValue([]);
            await flakyHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'ANALYSIS_NOT_FOUND',
                    message: 'No flaky test analysis found for this entity'
                }
            });
        });
        it('should handle flaky analysis errors', async () => {
            mockRequest.params = { entityId: 'error-test' };
            mockTestEngine.analyzeFlakyTests = vi.fn().mockRejectedValue(new Error('Analysis service unavailable'));
            await flakyHandler(mockRequest, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'FLAKY_ANALYSIS_FAILED',
                    message: 'Failed to retrieve flaky test analysis'
                }
            });
        });
        it('should return analysis for specific test when found among multiple', async () => {
            const entityId = 'specific-flaky-test';
            const mockAnalyses = [
                {
                    testId: 'other-test-1',
                    testName: 'should validate input',
                    flakyScore: 0.2
                },
                {
                    testId: entityId,
                    testName: 'should handle specific scenario',
                    flakyScore: 0.8
                },
                {
                    testId: 'other-test-2',
                    testName: 'should process data',
                    flakyScore: 0.3
                }
            ];
            mockRequest.params = { entityId };
            mockTestEngine.analyzeFlakyTests = vi.fn().mockResolvedValue(mockAnalyses);
            await flakyHandler(mockRequest, mockReply);
            expect(mockTestEngine.analyzeFlakyTests).toHaveBeenCalledWith([entityId]);
            expect(mockReply.send).toHaveBeenCalledWith({
                success: true,
                data: mockAnalyses[1] // Should return the matching analysis
            });
        });
    });
    describe('Error handling and edge cases', () => {
        it('should handle missing parameters gracefully', async () => {
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            // Test handlers with missing parameters
            const performanceHandler = getHandler('get', '/tests/performance/:entityId');
            const coverageHandler = getHandler('get', '/tests/coverage/:entityId');
            const flakyHandler = getHandler('get', '/tests/flaky-analysis/:entityId');
            // These should still work but may return errors due to missing services
            // In a real scenario, Fastify would validate the parameters first
            expect(performanceHandler).toBeDefined();
            expect(coverageHandler).toBeDefined();
            expect(flakyHandler).toBeDefined();
        });
        it('should handle service unavailability', async () => {
            // Register routes without test engine
            const mockAppNoEngine = createMockApp();
            await registerTestRoutes(mockAppNoEngine, mockKgService, mockDbService
            // No test engine
            );
            // Routes should still be registered but handlers should handle missing services
            expect(mockAppNoEngine.post).toHaveBeenCalledTimes(3);
            expect(mockAppNoEngine.get).toHaveBeenCalledTimes(3);
        });
        it('should validate request body schemas', async () => {
            // This test verifies that the routes are registered with proper schemas
            // In a real Fastify app, these would be validated before reaching the handlers
            await registerTestRoutes(mockApp, mockKgService, mockDbService, mockTestEngine);
            // Check that POST routes have schema objects
            expect(mockApp.post).toHaveBeenCalledWith('/tests/plan-and-generate', expect.objectContaining({
                schema: expect.objectContaining({
                    body: expect.any(Object)
                })
            }), expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/tests/record-execution', expect.objectContaining({
                schema: expect.objectContaining({
                    body: expect.any(Object)
                })
            }), expect.any(Function));
        });
    });
    // Engine should be invoked with the specific entity ID
    expect(mockTestEngine.analyzeFlakyTests).toHaveBeenCalledWith([entityId]);
});
//# sourceMappingURL=tests.test.js.map