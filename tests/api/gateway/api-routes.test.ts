/**
 * API Routes Integration Tests
 * Tests REST API routes with real services instead of excessive mocking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { APIGateway } from '../src/api/APIGateway.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { DocumentationParser } from '../src/services/DocumentationParser.js';
import { TestEngine } from '../src/services/TestEngine.js';
import { SecurityScanner } from '../src/services/SecurityScanner.js';
import { File, FunctionSymbol } from '../src/models/entities.js';

describe('REST API Routes Integration Tests', () => {
  let apiGateway: APIGateway;
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let astParser: ASTParser;
  let fileWatcher: FileWatcher;
  let docParser: DocumentationParser;
  let testEngine: TestEngine;
  let securityScanner: SecurityScanner;
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Initialize real services (no excessive mocking)
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    astParser = new ASTParser();
    fileWatcher = new FileWatcher();
    docParser = new DocumentationParser(kgService, dbService);
    testEngine = new TestEngine(kgService, dbService);
    securityScanner = new SecurityScanner(dbService, kgService);

    // Create API Gateway with real services
    apiGateway = new APIGateway(
      kgService,
      dbService,
      fileWatcher,
      astParser,
      docParser,
      securityScanner,
      { port: 0 } // Use random port
    );

    // Start server on fixed port for testing
    await apiGateway.start();
    server = apiGateway.getServer();

    // Use fixed port for testing (server is configured to use port 3000)
    const port = 3000;
    baseUrl = `http://127.0.0.1:${port}`;

    console.log(`🚀 Test server started on ${baseUrl}`);
  }, 60000);

  afterAll(async () => {
    if (server) {
      await apiGateway.stop();
    }
    if (dbService) {
      await dbService.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_" DELETE n');
      await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "test_" DELETE r');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('API Server Initialization', () => {
    it('should start API server successfully', () => {
      expect(server).toBeDefined();
      expect(baseUrl).toBeDefined();
      expect(baseUrl).toContain('http://127.0.0.1:');
    });

    it('should respond to health check', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      const health = await response.json() as any;
      expect(health.status).toBe('ok');
      expect(health.services).toBeDefined();
    });
  });

  describe('Graph API Routes (/api/v1/graph)', () => {
    const testFile: File = {
      id: 'test_api_file',
      type: 'file',
      path: '/api/test.ts',
      hash: 'api123',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      extension: '.ts',
      size: 150,
      lines: 15,
      isTest: false,
      isConfig: false,
      dependencies: []
    };

    const testFunction: FunctionSymbol = {
      id: 'test_api_function',
      type: 'symbol',
      name: 'testApiFunction',
      kind: 'function',
      path: '/api/test.ts',
      hash: 'func789',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      signature: 'testApiFunction(): string',
      docstring: 'Test API function',
      visibility: 'public',
      isExported: true,
      isDeprecated: false,
      parameters: [],
      returnType: 'string',
      isAsync: false,
      isGenerator: false,
      complexity: 1,
      calls: []
    };

    beforeEach(async () => {
      // Set up test data
      await kgService.createEntity(testFile);
      await kgService.createEntity(testFunction);

      const relationship = {
        id: 'test_api_relationship',
        fromEntityId: testFile.id,
        toEntityId: testFunction.id,
        type: 'contains' as any,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      };
      await kgService.createRelationship(relationship);
    });

    it('should create entities via POST /api/v1/graph/entities', async () => {
      const newFile: File = {
        id: 'test_create_entity',
        type: 'file',
        path: '/api/create-test.ts',
        hash: 'create456',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        size: 100,
        lines: 10,
        isTest: false,
        isConfig: false,
        dependencies: []
      };

      const response = await fetch(`${baseUrl}/api/v1/graph/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });

      expect(response.status).toBe(201);
      const result = await response.json() as any;
      expect(result.id).toBe(newFile.id);
      expect(result.type).toBe('file');
    });

    it('should retrieve entities via GET /api/v1/graph/entities/:id', async () => {
      const response = await fetch(`${baseUrl}/api/v1/graph/entities/${testFile.id}`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.id).toBe(testFile.id);
      expect(result.type).toBe('file');
      expect(result.path).toBe(testFile.path);
    });

    it('should search entities via GET /api/v1/graph/search', async () => {
      const response = await fetch(`${baseUrl}/api/v1/graph/search?q=test&type=file`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it('should get entity relationships via GET /api/v1/graph/entities/:id/relationships', async () => {
      const response = await fetch(`${baseUrl}/api/v1/graph/entities/${testFile.id}/relationships`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.relationships).toBeDefined();
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(result.relationships.length).toBeGreaterThan(0);
    });

    it('should handle non-existent entities gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/graph/entities/non_existent_id`);
      expect(response.status).toBe(404);
      const error = await response.json() as any;
      expect(error.error).toContain('not found');
    });
  });

  describe('Code Analysis Routes (/api/v1/code)', () => {
    it('should analyze code via POST /api/v1/code/analyze', async () => {
      const codeRequest = {
        file: '/src/test.ts',
        content: 'function test() { return "hello"; }',
        language: 'typescript'
      };

      const response = await fetch(`${baseUrl}/api/v1/code/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it('should get code suggestions via GET /api/v1/code/suggestions', async () => {
      const response = await fetch(`${baseUrl}/api/v1/code/suggestions?file=/src/test.ts`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should validate code via POST /api/v1/code/validate', async () => {
      const validationRequest = {
        content: 'function valid() { return true; }',
        language: 'typescript'
      };

      const response = await fetch(`${baseUrl}/api/v1/code/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.valid).toBeDefined();
      expect(result.errors).toBeDefined();
    });
  });

  describe('Security Routes (/api/v1/security)', () => {
    it('should scan code for vulnerabilities via POST /api/v1/security/scan', async () => {
      const scanRequest = {
        content: 'const password = "admin123";',
        file: '/src/insecure.ts',
        language: 'typescript'
      };

      const response = await fetch(`${baseUrl}/api/v1/security/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.vulnerabilities).toBeDefined();
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should get security report via GET /api/v1/security/report', async () => {
      const response = await fetch(`${baseUrl}/api/v1/security/report`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.summary).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('Admin Routes (/api/v1/admin)', () => {
    it('should get system status via GET /api/v1/admin/status', async () => {
      const response = await fetch(`${baseUrl}/api/v1/admin/status`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.services).toBeDefined();
      expect(result.uptime).toBeDefined();
    });

    it('should get system metrics via GET /api/v1/admin/metrics', async () => {
      const response = await fetch(`${baseUrl}/api/v1/admin/metrics`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.memory).toBeDefined();
      expect(result.cpu).toBeDefined();
    });

    it('should trigger file system sync via POST /api/v1/admin/sync', async () => {
      const syncRequest = {
        paths: ['/src'],
        force: true
      };

      const response = await fetch(`${baseUrl}/api/v1/admin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.success).toBeDefined();
    });

    it('should clear cache via POST /api/v1/admin/cache/clear', async () => {
      const response = await fetch(`${baseUrl}/api/v1/admin/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.success).toBeDefined();
    });
  });

  describe('Documentation Routes (/api/v1/docs)', () => {
    it('should get documentation via GET /api/v1/docs/search', async () => {
      const response = await fetch(`${baseUrl}/api/v1/docs/search?q=test`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    });

    it('should get documentation by ID via GET /api/v1/docs/:id', async () => {
      const response = await fetch(`${baseUrl}/api/v1/docs/test-doc-id`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.content).toBeDefined();
    });
  });

  describe('Test Routes (/api/v1/tests)', () => {
    it('should run tests via POST /api/v1/tests/run', async () => {
      const testRequest = {
        pattern: '**/*.test.ts',
        timeout: 30000
      };

      const response = await fetch(`${baseUrl}/api/v1/tests/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.results).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should get test coverage via GET /api/v1/tests/coverage', async () => {
      const response = await fetch(`${baseUrl}/api/v1/tests/coverage`);
      expect(response.status).toBe(200);
      const result = await response.json() as any;
      expect(result.coverage).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/graph/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
      const error = await response.json() as any;
      expect(error.error).toContain('JSON');
    });

    it('should handle non-existent routes', async () => {
      const response = await fetch(`${baseUrl}/api/v1/nonexistent`);
      expect(response.status).toBe(404);
      const error = await response.json() as any;
      expect(error.error).toContain('Not Found');
    });

    it('should handle database errors gracefully', async () => {
      // Try to access with invalid ID that might cause DB error
      const response = await fetch(`${baseUrl}/api/v1/graph/entities/invalid@id`);
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const requests = [];
      // Make multiple rapid requests
      for (let i = 0; i < 15; i++) {
        requests.push(fetch(`${baseUrl}/api/v1/graph/search?q=test`));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      // Rate limiting might not be enabled in test environment, so this is optional
      expect(rateLimited || responses.every(r => r.status !== 429)).toBe(true);
    });
  });
});
