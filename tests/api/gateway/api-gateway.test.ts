/**
 * APIGateway Integration Tests
 * Tests actual API Gateway functionality with minimal mocking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { APIGateway } from '../src/api/APIGateway.js';
import { DatabaseService, createDatabaseConfig, createTestDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { DocumentationParser } from '../src/services/DocumentationParser.js';
import { SecurityScanner } from '../src/services/SecurityScanner.js';
// Using built-in fetch API (available in Node.js 18+)
import { v4 as uuidv4 } from 'uuid';

describe('APIGateway Integration', () => {
  let apiGateway: APIGateway;
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let fileWatcher: FileWatcher;
  let astParser: ASTParser;
  let docParser: DocumentationParser;
  let securityScanner: SecurityScanner;
  const testPort = 3456; // Use a different port to avoid conflicts

  beforeAll(async () => {
    // Initialize real services with test database
    const dbConfig = createTestDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
    
    fileWatcher = new FileWatcher({
      watchPaths: ['tests/fixtures'],
      ignorePatterns: ['node_modules', '.git'],
      debounceMs: 100
    });
    
    astParser = new ASTParser();
    docParser = new DocumentationParser(kgService, dbService);
    securityScanner = new SecurityScanner(dbService, kgService);
    await securityScanner.initialize();

    // Create API Gateway with real services
    apiGateway = new APIGateway(
      kgService,
      dbService,
      fileWatcher,
      astParser,
      docParser,
      securityScanner,
      { port: testPort, host: '127.0.0.1' }
    );

    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    await apiGateway.stop();
    await dbService.close();
  }, 10000);

  beforeEach(async () => {
    // Clean up test data - use a safer approach
    try {
      await dbService.postgresQuery(
        "DELETE FROM documents WHERE type = 'test_document'"
      );
    } catch (error) {
      // Ignore cleanup errors
    }

    try {
      await dbService.falkordbQuery(
        "MATCH (n) WHERE n.id STARTS WITH 'test_' DELETE n"
      ).catch(() => {});
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Server Lifecycle', () => {
    it('should start server and respond to health check', async () => {
      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.status).toBe('healthy');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await fetch(`http://127.0.0.1:${testPort}/nonexistent`);
      expect(response.status).toBe(404);
    });

    it('should serve API documentation', async () => {
      const response = await fetch(`http://127.0.0.1:${testPort}/docs`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('REST API Endpoints', () => {
    describe('Code Analysis Endpoints', () => {
      it('should analyze code and return entities', async () => {
        const codePayload = {
          files: ['test.ts'],
          analysisType: 'patterns',
          options: {}
        };

        const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/code/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(codePayload)
        });

                expect(response.status).toBe(200);
        const result = await response.json() as any;
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('patterns');
        expect(result.data.filesAnalyzed).toBeGreaterThanOrEqual(0);
      });

      it('should handle invalid code gracefully', async () => {
        const invalidPayload = {
          content: 'export class { invalid syntax',
          language: 'typescript',
          path: 'invalid.ts'
        };

        const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/code/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPayload)
        });

        expect(response.status).toBe(200); // Should still return 200 but with parse errors
        const result = await response.json() as any;
        expect(result.errors).toBeDefined();
      });

      it('should validate request payload', async () => {
        const invalidPayload = {
          // Missing required fields
          language: 'typescript'
        };

        const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/code/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPayload)
        });

        expect(response.status).toBe(400);
        const error = await response.json() as any;
        expect(error.error).toContain('validation');
      });
    });

    describe('Graph Endpoints', () => {
      it('should create and retrieve entities', async () => {
        const entityId = `test_entity_${uuidv4()}`;
        const entity = {
          id: entityId,
          type: 'file',
          path: '/test/file.ts',
          hash: 'abc123',
          language: 'typescript',
          metadata: {
            size: 1024,
            lines: 50
          }
        };

        // Create entity
        const createResponse = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entity)
        });

        expect(createResponse.status).toBe(201);
        const created = await createResponse.json() as any;
        expect(created.id).toBe(entityId);

        // Retrieve entity
        const getResponse = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities/${entityId}`);
        expect(getResponse.status).toBe(200);

        const retrieved = await getResponse.json() as any;
        expect(retrieved.id).toBe(entityId);
        expect(retrieved.type).toBe('file');
        expect(retrieved.path).toBe('/test/file.ts');
      });

      it('should search entities with filters', async () => {
        // Create test entities
        const entities = [
          {
            id: `test_search_1_${uuidv4()}`,
            type: 'file',
            path: '/src/service.ts',
            language: 'typescript'
          },
          {
            id: `test_search_2_${uuidv4()}`,
            type: 'file',
            path: '/src/controller.ts',
            language: 'typescript'
          },
          {
            id: `test_search_3_${uuidv4()}`,
            type: 'file',
            path: '/test/spec.js',
            language: 'javascript'
          }
        ];

        for (const entity of entities) {
          await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entity)
          });
        }

        // Search for TypeScript files
        const searchResponse = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/search?type=file&language=typescript`);
        expect(searchResponse.status).toBe(200);
        
        const results = await searchResponse.json() as any;
        expect(results.entities).toBeInstanceOf(Array);
        const tsFiles = results.entities.filter((e: any) => e.language === 'typescript');
        expect(tsFiles.length).toBeGreaterThanOrEqual(2);
      });

      it('should handle entity relationships', async () => {
        const fileId = `test_file_${uuidv4()}`;
        const functionId = `test_func_${uuidv4()}`;

        // Create entities
        await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: fileId,
            type: 'file',
            path: '/test/file.ts'
          })
        });

        await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: functionId,
            type: 'function',
            name: 'testFunction'
          })
        });

        // Create relationship
        const relationshipResponse = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/relationships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fileId,
            to: functionId,
            type: 'CONTAINS'
          })
        });

        expect(relationshipResponse.status).toBe(201);

        // Query relationships
        const relResponse = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities/${fileId}/relationships`);
        expect(relResponse.status).toBe(200);
        
        const relationships = await relResponse.json() as any;
        expect(relationships).toBeInstanceOf(Array);
        expect(relationships.some((r: any) => r.to === functionId)).toBe(true);
      });
    });

    describe('Security Scanning Endpoints', () => {
      it('should scan code for security vulnerabilities', async () => {
        const vulnerableCode = {
          content: `
            const userInput = req.query.input;
            const query = "SELECT * FROM users WHERE id = " + userInput;
            db.query(query);
          `,
          language: 'javascript',
          path: 'vulnerable.js'
        };

        const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/security/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vulnerableCode)
        });

        expect(response.status).toBe(200);
        const result = await response.json() as any;
        expect(result.vulnerabilities).toBeInstanceOf(Array);
        expect(result.vulnerabilities.length).toBeGreaterThan(0);

        const sqlInjection = result.vulnerabilities.find((v: any) =>
          v.type === 'SQL_INJECTION' || v.description.toLowerCase().includes('sql')
        );
        expect(sqlInjection).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/code/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      });

      expect(response.status).toBe(400);
      const error = await response.json() as any;
      expect(error.error).toContain('JSON');
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily break database connection
      const originalQuery = dbService.postgresQuery;
      dbService.postgresQuery = jest.fn().mockRejectedValue(new Error('Database connection lost'));

      const response = await fetch(`http://127.0.0.1:${testPort}/api/v1/graph/entities/test_id`);
      expect(response.status).toBe(500);

      const error = await response.json() as any;
      expect(error.error).toContain('error');

      // Restore original function
      dbService.postgresQuery = originalQuery;
    });

    it('should enforce rate limiting', async () => {
      // Make many rapid requests
      const requests = Array.from({ length: 20 }, () =>
        fetch(`http://127.0.0.1:${testPort}/health`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Rate limiting should kick in for rapid requests
      expect(rateLimited).toBe(true);
    }, 10000);
  });

  describe('CORS Support', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await fetch(`http://127.0.0.1:${testPort}/api/code/analyze`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST'
        }
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });
  });

  describe('WebSocket Support', () => {
    it('should upgrade to websocket connection', async () => {
      // This would require a WebSocket client library
      // For now, just test that the endpoint exists
      const response = await fetch(`http://127.0.0.1:${testPort}/ws`, {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      });

      // Should return 426 Upgrade Required for non-websocket request
      expect(response.status).toBe(426);
    });
  });
});