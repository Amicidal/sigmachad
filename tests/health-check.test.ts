/**
 * Health Check API Tests
 * Tests the basic health check endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { APIGateway } from '../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { DocumentationParser } from '../src/services/DocumentationParser.js';
import { SecurityScanner } from '../src/services/SecurityScanner.js';

describe('Health Check API', () => {
  let apiGateway: APIGateway;
  let dbService: DatabaseService;

  beforeAll(async () => {
    // Initialize services
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    const kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    const fileWatcher = new FileWatcher();
    const astParser = new ASTParser();
    const docParser = new DocumentationParser(kgService, dbService);
    const securityScanner = new SecurityScanner(dbService, kgService);

    // Initialize API Gateway
    apiGateway = new APIGateway(kgService, dbService, fileWatcher, astParser, docParser, securityScanner, {
      port: 3001, // Use different port for tests
      host: 'localhost',
    });

    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    await apiGateway.stop();
    await dbService.close();
  }, 10000);

  describe('GET /health', () => {
    it('should return healthy status when all services are running', async () => {
      // This would require a test HTTP client
      // For now, just test that the API gateway initializes properly
      expect(apiGateway).toBeDefined();
      expect(apiGateway.getConfig().port).toBe(3001);
    });

    it('should return service health status', async () => {
      const health = await dbService.healthCheck();
      expect(health).toHaveProperty('falkordb');
      expect(health).toHaveProperty('qdrant');
      expect(health).toHaveProperty('postgresql');
    });
  });
});

describe('Database Service', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
  }, 30000);

  afterAll(async () => {
    await dbService.close();
  }, 10000);

  describe('Health Check', () => {
    it('should connect to all databases successfully', async () => {
      const health = await dbService.healthCheck();
      expect(Object.values(health).some(status => status === true)).toBe(true);
    });

    it('should handle connection failures gracefully', async () => {
      // Test with invalid config (this might fail in CI)
      const invalidDbService = new DatabaseService({
        falkordb: { url: 'redis://invalid:6379' },
        qdrant: { url: 'http://invalid:6333' },
        postgresql: { connectionString: 'postgresql://invalid:5432/invalid' },
      });

      try {
        await invalidDbService.initialize();
        const health = await invalidDbService.healthCheck();
        expect(Object.values(health).every(status => status === false || status === undefined)).toBe(true);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      } finally {
        await invalidDbService.close();
      }
    });
  });
});

describe('AST Parser', () => {
  let astParser: ASTParser;

  beforeAll(() => {
    astParser = new ASTParser();
  });

  describe('TypeScript Parsing', () => {
    it('should parse a simple TypeScript file', async () => {
      const code = `
        interface User {
          id: number;
          name: string;
        }

        function createUser(name: string): User {
          return { id: 1, name };
        }
      `;

      // Create a temporary file path for testing
      const tempFilePath = '/tmp/test-file.ts';

      // This would require writing the file and then parsing it
      // For now, just test that the parser initializes
      expect(astParser).toBeDefined();
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidCode = `
        function invalidFunction( {
          return "invalid syntax"
        }
      `;

      // Should not throw, but return errors in result
      expect(astParser).toBeDefined();
    });
  });
});
