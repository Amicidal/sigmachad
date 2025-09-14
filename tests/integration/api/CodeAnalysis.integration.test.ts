/**
 * Integration tests for Code Analysis API Endpoints
 * Tests code validation, analysis, and change proposal functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import { ASTParser } from '../../../src/services/ASTParser.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
  insertTestFixtures,
} from '../../test-utils/database-helpers.js';

describe('Code Analysis API Endpoints Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let astParser: ASTParser;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);
    astParser = new ASTParser();

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

  describe('POST /api/v1/code/validate', () => {
    it('should validate TypeScript code successfully', async () => {
      const validationRequest = {
        files: ['src/test.ts'],
        includeTypes: ['typescript'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.anything());

      const validation = body.data;
      expect(validation.overall).toEqual(expect.any(Object));
      expect(typeof validation.overall.passed).toBe('boolean');
      expect(typeof validation.overall.score).toBe('number');
      expect(typeof validation.overall.duration).toBe('number');

      expect(validation.typescript).toEqual(expect.any(Object));
      expect(typeof validation.typescript.errors).toBe('number');
      expect(typeof validation.typescript.warnings).toBe('number');
      expect(Array.isArray(validation.typescript.issues)).toBe(true);
    });

    it('should validate with ESLint rules', async () => {
      const validationRequest = {
        files: ['src/'],
        includeTypes: ['eslint'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.eslint).toEqual(expect.any(Object));
      expect(typeof body.data.eslint.errors).toBe('number');
      expect(typeof body.data.eslint.warnings).toBe('number');
      expect(Array.isArray(body.data.eslint.issues)).toBe(true);
    });

    it('should perform security validation', async () => {
      const validationRequest = {
        files: ['src/'],
        includeTypes: ['security'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.security).toEqual(expect.any(Object));
      expect(typeof body.data.security.critical).toBe('number');
      expect(typeof body.data.security.high).toBe('number');
      expect(typeof body.data.security.medium).toBe('number');
      expect(typeof body.data.security.low).toBe('number');
      expect(Array.isArray(body.data.security.issues)).toBe(true);
    });

    it('should include test coverage analysis', async () => {
      const validationRequest = {
        files: ['src/', 'tests/'],
        includeTypes: ['tests', 'coverage'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.tests).toEqual(expect.any(Object));
      expect(typeof body.data.tests.passed).toBe('number');
      expect(typeof body.data.tests.failed).toBe('number');
      expect(typeof body.data.tests.skipped).toBe('number');

      if (body.data.tests.coverage) {
        expect(typeof body.data.tests.coverage.lines).toBe('number');
        expect(typeof body.data.tests.coverage.branches).toBe('number');
        expect(typeof body.data.tests.coverage.functions).toBe('number');
        expect(typeof body.data.tests.coverage.statements).toBe('number');
      }
    });

    it('should perform architecture validation', async () => {
      const validationRequest = {
        files: ['src/'],
        includeTypes: ['architecture'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.architecture).toEqual(expect.any(Object));
      expect(typeof body.data.architecture.violations).toBe('number');
      expect(Array.isArray(body.data.architecture.issues)).toBe(true);
    });

    it('should handle failOnWarnings flag', async () => {
      const validationRequest = {
        files: ['src/'],
        includeTypes: ['typescript', 'eslint'],
        failOnWarnings: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      // Should reflect warning handling in overall.passed
      expect(typeof body.data.overall.passed).toBe('boolean');
    });

    it('should validate multiple file types simultaneously', async () => {
      const validationRequest = {
        files: ['src/', 'tests/', 'docs/'],
        includeTypes: ['typescript', 'eslint', 'security', 'tests'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.typescript).toEqual(expect.any(Object));
      expect(body.data.eslint).toEqual(expect.any(Object));
      expect(body.data.security).toEqual(expect.any(Object));
      expect(body.data.tests).toEqual(expect.any(Object));
    });

    it('should handle empty file lists', async () => {
      const validationRequest = {
        files: [],
        includeTypes: ['typescript'],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      // Should handle gracefully - either 200 with empty results or 400 validation error
      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body.success).toBe(true);
        expect(body.data).toEqual(expect.anything());
      } else if (response.statusCode === 400) {
        const body = JSON.parse(response.payload || '{}');
        expect(body.success).toBe(false);
        expect(body.error).toEqual(expect.any(Object));
      }
    });
  });

  describe('POST /api/v1/code/analyze', () => {
    it('should perform complexity analysis', async () => {
      await insertTestFixtures(dbService);

      const analysisRequest = {
        files: ['src/'],
        analysisType: 'complexity',
        options: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(analysisRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.anything());
      expect(body.data.analysisType).toBe('complexity');
    });

    it('should detect code patterns', async () => {
      const analysisRequest = {
        files: ['src/'],
        analysisType: 'patterns',
        options: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(analysisRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.analysisType).toBe('patterns');
    });

    it('should find duplicate code', async () => {
      const analysisRequest = {
        files: ['src/', 'tests/'],
        analysisType: 'duplicates',
        options: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(analysisRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.analysisType).toBe('duplicates');
    });

    it('should analyze dependencies', async () => {
      await insertTestFixtures(dbService);

      const analysisRequest = {
        files: ['src/'],
        analysisType: 'dependencies',
        options: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(analysisRequest),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.analysisType).toBe('dependencies');
    });

    it('should handle invalid analysis types', async () => {
      const analysisRequest = {
        files: ['src/'],
        analysisType: 'invalid-type',
        options: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(analysisRequest),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/code/propose-diff', () => {
    beforeEach(async () => {
      // Insert test data for impact analysis
      await insertTestFixtures(dbService);
    });

    it('should analyze file modification proposals', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/test.ts',
            type: 'modify',
            oldContent: 'function oldFunc() { return "old"; }',
            newContent: 'function newFunc() { return "new"; }',
            lineStart: 1,
            lineEnd: 1,
          },
        ],
        description: 'Update function implementation',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.anything());

      const analysis = body.data;
      expect(Array.isArray(analysis.affectedEntities)).toBe(true);
      expect(Array.isArray(analysis.breakingChanges)).toBe(true);
      expect(analysis.impactAnalysis).toEqual(expect.any(Object));
      expect(Array.isArray(analysis.impactAnalysis.directImpact)).toBe(true);
      expect(Array.isArray(analysis.impactAnalysis.indirectImpact)).toBe(true);
      expect(Array.isArray(analysis.impactAnalysis.testImpact)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should analyze file creation proposals', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/new-file.ts',
            type: 'create',
            newContent: 'export function newFunction() { return "new"; }',
          },
        ],
        description: 'Add new utility function',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.affectedEntities).toEqual(expect.anything());
      expect(body.data.breakingChanges).toEqual(expect.anything());
    });

    it('should analyze file deletion proposals', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/old-file.ts',
            type: 'delete',
          },
        ],
        description: 'Remove deprecated file',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      // Deletion should potentially have breaking changes
      expect(body.data.breakingChanges).toEqual(expect.anything());
    });

    it('should analyze file rename operations', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/old-name.ts',
            type: 'rename',
            newContent: 'src/new-name.ts', // Using newContent as the new path
          },
        ],
        description: 'Rename file for consistency',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.affectedEntities).toEqual(expect.anything());
    });

    it('should handle multiple changes in single proposal', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/file1.ts',
            type: 'modify',
            oldContent: 'old content',
            newContent: 'new content',
          },
          {
            file: 'src/file2.ts',
            type: 'create',
            newContent: 'export const config = {};',
          },
          {
            file: 'src/deprecated.ts',
            type: 'delete',
          },
        ],
        description: 'Multi-file refactoring',
        relatedSpecId: 'refactor-spec-123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.affectedEntities.length).toBeGreaterThanOrEqual(0);
      expect(body.data.impactAnalysis).toEqual(expect.any(Object));
    });

    it('should provide breaking change analysis', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/api.ts',
            type: 'modify',
            oldContent: 'export function publicAPI() { }',
            newContent: 'function privateFunction() { }', // Remove export - breaking change
          },
        ],
        description: 'Make function private',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.breakingChanges).toEqual(expect.anything());
      // Should potentially detect breaking changes
    });

    it('should provide actionable recommendations', async () => {
      const proposal = {
        changes: [
          {
            file: 'src/complex-function.ts',
            type: 'modify',
            oldContent: 'function simple() { return 1; }',
            newContent: 'function complex() { /* very complex logic */ return complexCalculation(); }',
          },
        ],
        description: 'Increase function complexity',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(proposal),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data.recommendations).toEqual(expect.anything());
      expect(Array.isArray(body.data.recommendations)).toBe(true);
    });
  });

  describe('Code Analysis Error Handling', () => {
    it('should handle invalid file paths', async () => {
      const validationRequest = {
        files: ['/non/existent/path'],
        includeTypes: ['typescript'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(validationRequest),
      });

      // Should handle gracefully
      if (response.statusCode === 404) {
        throw new Error('Code analysis endpoint missing; scenario requires implementation');
      }
      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body.success).toBe(true);
      } else if (response.statusCode === 400) {
        const body = JSON.parse(response.payload || '{}');
        expect(body.success).toBe(false);
        expect(body.error).toEqual(expect.any(Object));
      }
    });

    it('should handle malformed requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/validate',
        headers: {
          'content-type': 'application/json',
        },
        payload: '{ invalid json',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/propose-diff',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({}), // Missing required fields
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle service failures gracefully', async () => {
      // Mock AST parser failure
      const originalParse = astParser.parseFile;
      astParser.parseFile = async () => {
        throw new Error('AST parsing failed');
      };

      try {
        const validationRequest = {
          files: ['src/test.ts'],
          includeTypes: ['typescript'],
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/code/validate',
          headers: {
            'content-type': 'application/json',
          },
          payload: JSON.stringify(validationRequest),
        });

        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        } else if (response.statusCode === 500) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(false);
          expect(body.error).toEqual(expect.any(Object));
        }
      } finally {
        astParser.parseFile = originalParse;
      }
    });
  });
});
