/**
 * Integration tests for REST API endpoints
 * Tests all REST API routes including graph operations, test management,
 * documentation, security, and other API endpoints
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { TestEngine } from '../../../src/services/TestEngine.js';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, insertTestFixtures, checkDatabaseHealth, } from '../../test-utils/database-helpers.js';
describe('REST API Endpoints Integration', () => {
    let dbService;
    let kgService;
    let testEngine;
    let apiGateway;
    let app;
    beforeAll(async () => {
        // Setup test database
        dbService = await setupTestDatabase();
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error('Database health check failed - cannot run integration tests');
        }
        // Create services
        kgService = new KnowledgeGraphService(dbService);
        testEngine = new TestEngine(kgService, dbService);
        // Create API Gateway
        apiGateway = new APIGateway(kgService, dbService);
        app = apiGateway.getApp();
        // Start the server
        await apiGateway.start();
    }, 30000);
    afterAll(async () => {
        if (apiGateway) {
            await apiGateway.stop();
        }
        if (dbService && dbService.isInitialized()) {
            await cleanupTestDatabase(dbService);
        }
    }, 10000);
    beforeEach(async () => {
        if (dbService && dbService.isInitialized()) {
            await clearTestData(dbService);
        }
    });
    describe('Graph API Endpoints', () => {
        describe('POST /api/v1/graph/search', () => {
            it('should perform semantic search successfully', async () => {
                // Insert test data first
                await insertTestFixtures(dbService);
                const searchRequest = {
                    query: 'function',
                    entityTypes: ['function'],
                    searchType: 'semantic',
                    limit: 10,
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/graph/search',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(searchRequest),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(Array.isArray(body.data.entities)).toBe(true);
                expect(Array.isArray(body.data.relationships)).toBe(true);
                expect(typeof body.data.relevanceScore).toBe('number');
            });
            it('should handle search with filters', async () => {
                const searchRequest = {
                    query: 'test',
                    filters: {
                        language: 'typescript',
                        tags: ['utility'],
                    },
                    includeRelated: true,
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/graph/search',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(searchRequest),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
            });
            it('should return empty results for non-existent queries', async () => {
                const searchRequest = {
                    query: 'nonexistententity12345',
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/graph/search',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(searchRequest),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data.entities.length).toBe(0);
            });
            it('should handle invalid search requests', async () => {
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/graph/search',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify({}), // Missing required query field
                });
                expect(response.statusCode).toBe(400);
            });
        });
        describe('GET /api/v1/graph/examples/:entityId', () => {
            it('should return usage examples for existing entity', async () => {
                // Insert test data first
                await insertTestFixtures(dbService);
                // First, let's find an entity to test with
                const entitiesResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/entities?limit=1',
                });
                if (entitiesResponse.statusCode === 200) {
                    const entitiesBody = JSON.parse(entitiesResponse.payload);
                    if (entitiesBody.data && entitiesBody.data.length > 0) {
                        const entityId = entitiesBody.data[0].id;
                        const response = await app.inject({
                            method: 'GET',
                            url: `/api/v1/graph/examples/${entityId}`,
                        });
                        expect([200, 404]).toContain(response.statusCode); // 404 if no examples found
                        if (response.statusCode === 200) {
                            const body = JSON.parse(response.payload);
                            expect(body.success).toBe(true);
                            expect(body.data).toBeDefined();
                        }
                    }
                }
            });
            it('should handle non-existent entity gracefully', async () => {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/examples/non-existent-entity-123',
                });
                expect([200, 404, 500]).toContain(response.statusCode);
            });
        });
        describe('GET /api/v1/graph/dependencies/:entityId', () => {
            it('should return dependency analysis for entity', async () => {
                // Insert test data first
                await insertTestFixtures(dbService);
                // Find an entity to test with
                const entitiesResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/entities?limit=1',
                });
                if (entitiesResponse.statusCode === 200) {
                    const entitiesBody = JSON.parse(entitiesResponse.payload);
                    if (entitiesBody.data && entitiesBody.data.length > 0) {
                        const entityId = entitiesBody.data[0].id;
                        const response = await app.inject({
                            method: 'GET',
                            url: `/api/v1/graph/dependencies/${entityId}`,
                        });
                        expect([200, 404]).toContain(response.statusCode);
                        if (response.statusCode === 200) {
                            const body = JSON.parse(response.payload);
                            expect(body.success).toBe(true);
                            expect(body.data).toBeDefined();
                        }
                    }
                }
            });
        });
        describe('GET /api/v1/graph/entities', () => {
            it('should return paginated list of entities', async () => {
                // Insert test data first
                await insertTestFixtures(dbService);
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/entities?limit=5&offset=0',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(Array.isArray(body.data)).toBe(true);
                expect(body.pagination).toBeDefined();
                expect(typeof body.pagination.page).toBe('number');
                expect(typeof body.pagination.pageSize).toBe('number');
                expect(typeof body.pagination.total).toBe('number');
                expect(typeof body.pagination.hasMore).toBe('boolean');
            });
            it('should handle filtering by type', async () => {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/entities?type=function',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(Array.isArray(body.data)).toBe(true);
            });
            it('should handle filtering by language', async () => {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/entities?language=typescript',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(Array.isArray(body.data)).toBe(true);
            });
        });
        describe('GET /api/v1/graph/relationships', () => {
            it('should return paginated list of relationships', async () => {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/relationships?limit=5&offset=0',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(Array.isArray(body.data)).toBe(true);
                expect(body.pagination).toBeDefined();
            });
            it('should handle filtering by relationship type', async () => {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/graph/relationships?type=depends_on',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(Array.isArray(body.data)).toBe(true);
            });
        });
    });
    describe('Test API Endpoints', () => {
        describe('POST /api/v1/tests/plan-and-generate', () => {
            it('should generate test plan for specification', async () => {
                // First, create a test specification in the graph
                const specId = 'test-spec-123';
                await kgService.createEntity({
                    id: specId,
                    type: 'spec',
                    name: 'Test Specification',
                    title: 'Test Spec for API',
                    acceptanceCriteria: [
                        'Should validate input parameters',
                        'Should return correct response format',
                        'Should handle error cases properly',
                    ],
                });
                const testPlanRequest = {
                    specId,
                    testTypes: ['unit', 'integration'],
                    includePerformanceTests: true,
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/tests/plan-and-generate',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(testPlanRequest),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.testPlan).toBeDefined();
                expect(body.data.estimatedCoverage).toBeDefined();
            });
            it('should handle non-existent specification', async () => {
                const testPlanRequest = {
                    specId: 'non-existent-spec-123',
                    testTypes: ['unit'],
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/tests/plan-and-generate',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(testPlanRequest),
                });
                expect(response.statusCode).toBe(404);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(false);
                expect(body.error).toBeDefined();
                expect(body.error.code).toBe('SPEC_NOT_FOUND');
            });
            it('should validate required fields', async () => {
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/tests/plan-and-generate',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify({}), // Missing specId
                });
                expect(response.statusCode).toBe(400);
            });
        });
        describe('POST /api/v1/tests/record-execution', () => {
            it('should record test execution results', async () => {
                const testResults = [
                    {
                        testId: 'test-1',
                        testSuite: 'unit-tests',
                        testName: 'should validate input',
                        status: 'passed',
                        duration: 150,
                    },
                    {
                        testId: 'test-2',
                        testSuite: 'unit-tests',
                        testName: 'should handle errors',
                        status: 'failed',
                        duration: 200,
                        errorMessage: 'Assertion failed',
                    },
                ];
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/tests/record-execution',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(testResults),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.recorded).toBe(2);
            });
            it('should handle single test result', async () => {
                const testResult = {
                    testId: 'single-test-1',
                    testSuite: 'integration-tests',
                    testName: 'should integrate properly',
                    status: 'passed',
                    duration: 300,
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/tests/record-execution',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(testResult),
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(true);
                expect(body.data.recorded).toBe(1);
            });
        });
        describe('GET /api/v1/tests/performance/:entityId', () => {
            it('should return performance metrics for entity', async () => {
                // Create test performance data
                const entityId = 'perf-test-entity';
                await dbService.postgresQuery(`
          INSERT INTO performance_metrics (entity_id, metric_type, value, timestamp)
          VALUES ($1, $2, $3, $4)
        `, [entityId, 'response_time', 150.5, new Date()]);
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/tests/performance/${entityId}`,
                });
                expect([200, 404]).toContain(response.statusCode);
                if (response.statusCode === 200) {
                    const body = JSON.parse(response.payload);
                    expect(body.success).toBe(true);
                    expect(body.data).toBeDefined();
                }
            });
        });
        describe('GET /api/v1/tests/coverage/:entityId', () => {
            it('should return coverage analysis for entity', async () => {
                // Create test coverage data
                const entityId = 'coverage-test-entity';
                await dbService.postgresQuery(`
          INSERT INTO coverage_history (entity_id, lines_covered, lines_total, percentage, timestamp)
          VALUES ($1, $2, $3, $4, $5)
        `, [entityId, 80, 100, 80.0, new Date()]);
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/tests/coverage/${entityId}`,
                });
                expect([200, 404]).toContain(response.statusCode);
                if (response.statusCode === 200) {
                    const body = JSON.parse(response.payload);
                    expect(body.success).toBe(true);
                    expect(body.data).toBeDefined();
                }
            });
        });
    });
    describe('Admin API Endpoints', () => {
        // Note: Admin endpoints would require authentication/authorization
        // These tests verify the routes exist and handle unauthorized access properly
        it('should have admin routes registered', () => {
            // Verify that admin routes are registered (this would typically require auth)
            expect(app.hasRoute('GET', '/api/v1/admin/health')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/admin/backup')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/admin/logs')).toBe(true);
        });
    });
    describe('Security API Endpoints', () => {
        it('should have security routes registered', () => {
            expect(app.hasRoute('POST', '/api/v1/security/scan')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/security/vulnerabilities')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/security/fix')).toBe(true);
        });
    });
    describe('Documentation API Endpoints', () => {
        it('should have documentation routes registered', () => {
            expect(app.hasRoute('GET', '/api/v1/docs/search')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/docs/:id')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/docs/parse')).toBe(true);
        });
    });
    describe('Source Control API Endpoints', () => {
        it('should have SCM routes registered', () => {
            expect(app.hasRoute('GET', '/api/v1/scm/changes')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/scm/commit')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/scm/branches')).toBe(true);
        });
    });
    describe('Code Analysis API Endpoints', () => {
        it('should have code routes registered', () => {
            expect(app.hasRoute('POST', '/api/v1/code/analyze')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/code/symbols')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/code/refactor')).toBe(true);
        });
    });
    describe('Design API Endpoints', () => {
        it('should have design routes registered', () => {
            expect(app.hasRoute('POST', '/api/v1/design/create-spec')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/design/specs')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/design/generate')).toBe(true);
        });
    });
    describe('Impact Analysis API Endpoints', () => {
        it('should have impact routes registered', () => {
            expect(app.hasRoute('POST', '/api/v1/impact/analyze')).toBe(true);
            expect(app.hasRoute('GET', '/api/v1/impact/changes')).toBe(true);
            expect(app.hasRoute('POST', '/api/v1/impact/simulate')).toBe(true);
        });
    });
});
//# sourceMappingURL=RESTEndpoints.integration.test.js.map