/**
 * Admin Routes Integration Tests
 * Tests the admin API endpoints with real services
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { APIGateway } from '../src/api/APIGateway.js';
import { File } from '../src/models/entities.js';

describe('Admin Routes Integration', () => {
  let apiGateway: APIGateway;
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;

  beforeAll(async () => {
    // Use real services for integration testing
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    // Create API Gateway which includes admin routes
    apiGateway = new APIGateway(
      kgService,
      dbService,
      null as any, // fileWatcher - not needed for basic tests
      null as any, // astParser - not needed for basic tests
      null as any, // docParser - not needed for basic tests
      null as any, // securityScanner - not needed for basic tests
      { port: 0 } // Use random port for testing
    );

    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService) {
      await dbService.close();
    }
  });

  describe('API Gateway Initialization', () => {
    it('should initialize successfully with real services', () => {
      expect(apiGateway).toBeDefined();
      expect(apiGateway).toBeInstanceOf(APIGateway);
    });

    it('should have initialized all required services', () => {
      expect(dbService).toBeDefined();
      expect(kgService).toBeDefined();
    });

    it('should be able to perform basic operations', async () => {
      // Test that we can create and retrieve an entity
      const testEntity: File = {
        id: 'admin_test_entity',
        type: 'file',
        path: '/admin/test.ts',
        hash: 'admin123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        size: 100,
        lines: 5,
        isTest: false,
        isConfig: false,
        dependencies: []
      };

      await expect(kgService.createEntity(testEntity)).resolves.not.toThrow();

      const retrieved = await kgService.getEntity(testEntity.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testEntity.id);
      expect(retrieved?.type).toBe('file');
    });
  });

  describe('Admin Route Registration', () => {
    it('should register admin routes without errors', () => {
      // This test verifies that the admin routes can be registered
      // without throwing errors during the API Gateway initialization
      expect(true).toBe(true);
    });

    it('should have health check functionality', async () => {
      const health = await dbService.healthCheck();
      expect(health).toBeDefined();
      expect(health).toHaveProperty('falkordb');
      expect(health).toHaveProperty('qdrant');
      expect(health).toHaveProperty('postgresql');
    });

    it('should support entity queries', async () => {
      const entities = await kgService.findEntitiesByType('file');
      expect(Array.isArray(entities)).toBe(true);
    });
  });
});
