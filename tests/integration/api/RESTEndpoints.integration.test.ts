/**
 * Integration tests for REST API endpoints
 * Tests all REST API routes including graph operations, test management,
 * documentation, security, and other API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { expectSuccess } from '../../test-utils/assertions';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  insertTestFixtures,
  checkDatabaseHealth,
  TEST_FIXTURE_IDS,
} from '../../test-utils/database-helpers.js';

describe('REST API Endpoints Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase({ silent: true });
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);
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
      await clearTestData(dbService, {
        includeVector: false,
        includeCache: false,
        silent: true,
      });
    }
  });

  describe('Graph API Endpoints', () => {
    beforeEach(async () => {
      await insertTestFixtures(dbService);
    });

    describe('POST /api/v1/graph/search', () => {
      it('should perform semantic search successfully', async () => {
        const searchRequest = {
          query: 'function',
          entityTypes: ['function'],
          searchType: 'semantic' as const,
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
        // Stronger assertions on structure
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(body.data).toEqual(expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
        }));
        expect(typeof body.data.relevanceScore).toBe('number');
        const entityPaths = (body.data.entities || []).map(
          (entity: any) => entity.path || entity.metadata?.path
        );
        expect(entityPaths).toContain('test.ts');
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
        expectSuccess(body);
        const everyEntityMatches = (body.data.entities || []).every(
          (entity: any) =>
            entity.language === 'typescript' ||
            entity.metadata?.language === 'typescript'
        );
        expect(everyEntityMatches).toBe(true);
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
        expectSuccess(body, { entities: expect.any(Array) });
        expect(body.data.entities).toEqual([]);
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
        const response = await app.inject({
          method: 'GET',
          url: `/api/v1/graph/examples/${TEST_FIXTURE_IDS.falkorEntities.typescriptFile}`,
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              usageExamples: expect.arrayContaining([expect.any(Object)]),
            }),
          })
        );
      });

      it('should handle non-existent entity gracefully', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/graph/examples/non-existent-entity-123',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({ code: 'ENTITY_NOT_FOUND' }),
          })
        );
      });
    });

    describe('GET /api/v1/graph/dependencies/:entityId', () => {
      it('should return dependency analysis for entity', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/api/v1/graph/dependencies/${TEST_FIXTURE_IDS.falkorEntities.typescriptFile}`,
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              directDependencies: expect.arrayContaining([expect.any(Object)]),
              reverseDependencies: expect.arrayContaining([expect.any(Object)]),
            }),
          })
        );
      });
    });

    describe('GET /api/v1/graph/entities', () => {
      it('should return paginated list of entities', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/graph/entities?limit=5&offset=0',
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({ success: true, data: expect.any(Array) })
        );
        expect(body.pagination).toEqual(expect.any(Object));
        expect(typeof body.pagination.page).toBe('number');
        expect(typeof body.pagination.pageSize).toBe('number');
        expect(typeof body.pagination.total).toBe('number');
        expect(typeof body.pagination.hasMore).toBe('boolean');
        const entityIds = (body.data as any[]).map((entity) => entity.id);
        expect(entityIds).toContain(TEST_FIXTURE_IDS.falkorEntities.typescriptFile);
      });

      it('should handle filtering by type', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/graph/entities?type=function',
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(Array.isArray(body.data)).toBe(true);
      });

      it('should handle filtering by language', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/graph/entities?language=typescript',
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(Array.isArray(body.data)).toBe(true);
        const everyTypeMatches = (body.data as any[]).every(
          (entity) => entity.language === 'typescript' || entity?.metadata?.language === 'typescript'
        );
        expect(everyTypeMatches).toBe(true);
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
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.pagination).toEqual(expect.any(Object));
        const relationshipTypes = (body.data as any[]).map((rel) => rel.type);
        expect(relationshipTypes).toEqual(expect.arrayContaining(['CALLS']));
        expect(relationshipTypes).toEqual(expect.arrayContaining(['REFERENCES']));
      });

      it('should handle filtering by relationship type', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/graph/relationships?type=depends_on',
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ success: true }));
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
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(body).toEqual(
          expect.objectContaining({
            data: expect.objectContaining({
              testPlan: expect.objectContaining({
                unitTests: expect.any(Array),
                integrationTests: expect.any(Array),
                e2eTests: expect.any(Array),
                performanceTests: expect.any(Array),
              }),
              estimatedCoverage: expect.objectContaining({
                lines: expect.any(Number),
                branches: expect.any(Number),
                functions: expect.any(Number),
                statements: expect.any(Number),
              }),
            }),
          })
        );
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
        expect(body).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({ code: 'SPEC_NOT_FOUND' })
          })
        );
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
            status: 'passed' as const,
            duration: 150,
          },
          {
            testId: 'test-2',
            testSuite: 'unit-tests',
            testName: 'should handle errors',
            status: 'failed' as const,
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
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({ recorded: 2 }),
          })
        );
      });

      it('should handle single test result', async () => {
        const testResult = {
          testId: 'single-test-1',
          testSuite: 'integration-tests',
          testName: 'should integrate properly',
          status: 'passed' as const,
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
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({ recorded: 1 }),
          })
        );
      });
    });

    describe('GET /api/v1/tests/performance/:entityId', () => {
      it('should return performance metrics for entity', async () => {
        // Create test performance data
        const entityId = uuidv4();
        await dbService.postgresQuery(`
          INSERT INTO performance_metrics (entity_id, metric_type, value, timestamp)
          VALUES ($1, $2, $3, $4)
        `, [entityId, 'response_time', 150.5, new Date()]);

        const response = await app.inject({
          method: 'GET',
          url: `/api/v1/tests/performance/${entityId}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.any(Object),
          })
        );
      });
    });

    describe('GET /api/v1/tests/coverage/:entityId', () => {
      it('should return coverage analysis for entity', async () => {
        // Create test coverage data
        const entityId = uuidv4();
        await dbService.postgresQuery(`
          INSERT INTO coverage_history (entity_id, lines_covered, lines_total, percentage, timestamp)
          VALUES ($1, $2, $3, $4, $5)
        `, [entityId, 80, 100, 80.0, new Date()]);

        const response = await app.inject({
          method: 'GET',
          url: `/api/v1/tests/coverage/${entityId}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            data: expect.any(Object),
          })
        );
      });
    });
  });

  describe('Admin API Endpoints', () => {
    it('GET /api/v1/admin/admin-health responds with status and metrics', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/admin-health' });
      const body = JSON.parse(res.payload || '{}');
      if (res.statusCode === 200) {
        expect(body).toEqual(
          expect.objectContaining({
            overall: expect.any(String),
            components: expect.any(Object),
            metrics: expect.any(Object),
          })
        );
      } else if (res.statusCode === 503) {
        expect(body).toEqual(expect.objectContaining({ success: false }));
      } else {
        throw new Error(`Unexpected /admin/admin-health status: ${res.statusCode}`);
      }
    });

    it('POST /api/v1/admin/backup returns success', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/backup', headers: { 'content-type': 'application/json' }, payload: JSON.stringify({}) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('GET /api/v1/admin/logs returns logs array', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/admin/logs?limit=10' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
    });
  });

  describe('Security API Endpoints', () => {
    it('POST /api/v1/security/scan returns a scan result', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/security/scan', headers: { 'content-type': 'application/json' }, payload: JSON.stringify({}) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('GET /api/v1/security/vulnerabilities returns report', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/security/vulnerabilities' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('POST /api/v1/security/fix requires id and returns 400', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/security/fix', headers: { 'content-type': 'application/json' }, payload: JSON.stringify({}) });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'MISSING_ID' }) }));
    });
  });

  describe('Documentation API Endpoints', () => {
    it('GET /api/v1/docs/search returns results', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/docs/search?query=test' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true }));
    });

    it('POST /api/v1/docs/parse parses content', async () => {
      const payload = { content: '# Title', format: 'markdown' };
      const res = await app.inject({ method: 'POST', url: '/api/v1/docs/parse', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('GET /api/v1/docs/:id returns 404 for unknown id', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/docs/non-existent-id' });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: false, error: expect.any(Object) }));
    });
  });

  describe('Source Control API Endpoints', () => {
    it('GET /api/v1/scm/changes returns array', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/scm/changes' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
    });

    it('POST /api/v1/scm/commit-pr accepts minimal valid payload', async () => {
      const payload = { title: 't', description: 'd', changes: ['README.md'] };
      const res = await app.inject({ method: 'POST', url: '/api/v1/scm/commit-pr', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.objectContaining({ commitHash: expect.any(String) }) }));
    });

    it('GET /api/v1/scm/branches returns list', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/scm/branches' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
    });
  });

  describe('Code Analysis API Endpoints', () => {
    it('GET /api/v1/code/symbols returns list', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/code/symbols' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Array) }));
    });

    it('POST /api/v1/code/refactor returns suggestions skeleton', async () => {
      const payload = { files: ['src/index.ts'], refactorType: 'rename' };
      const res = await app.inject({ method: 'POST', url: '/api/v1/code/refactor', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('POST /api/v1/code/analyze (complexity) executes with valid input', async () => {
      const payload = { files: ['src/index.ts'], analysisType: 'complexity' };
      const res = await app.inject({ method: 'POST', url: '/api/v1/code/analyze', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });
  });

  describe('Design API Endpoints', () => {
    it('POST /api/v1/design/create-spec creates spec', async () => {
      const payload = { title: 'A', description: 'B', acceptanceCriteria: ['C'] };
      const res = await app.inject({ method: 'POST', url: '/api/v1/design/create-spec', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('GET /api/v1/design/specs returns list', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/design/specs' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true }));
    });

    it('POST /api/v1/design/generate returns spec id', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/design/generate' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.objectContaining({ specId: expect.any(String) }) }));
    });
  });

  describe('Impact Analysis API Endpoints', () => {
    it('POST /api/v1/impact/analyze analyzes minimal change', async () => {
      const payload = { changes: [{ entityId: 'non-existent', changeType: 'modify' }] };
      const res = await app.inject({ method: 'POST', url: '/api/v1/impact/analyze', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });

    it('GET /api/v1/impact/changes returns summary', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/impact/changes' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true }));
    });

    it('POST /api/v1/impact/simulate compares scenarios', async () => {
      const payload = { scenarios: [{ name: 's1', changes: [{ entityId: 'e', changeType: 'modify' }] }] };
      const res = await app.inject({ method: 'POST', url: '/api/v1/impact/simulate', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(expect.objectContaining({ success: true, data: expect.any(Object) }));
    });
  });
});
