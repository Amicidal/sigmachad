/**
 * Admin API Integration Tests
 * Tests admin functionality with real services following FalkorDB test patterns
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { APIGateway } from '../src/api/APIGateway.js';

describe('Admin API Integration Tests', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let astParser: ASTParser;
  let fileWatcher: FileWatcher;
  let apiGateway: APIGateway;
  let baseUrl: string;

  beforeAll(async () => {
    // Use real services following FalkorDB test pattern
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    astParser = new ASTParser();
    fileWatcher = new FileWatcher();

    // Create API Gateway with real services
    apiGateway = new APIGateway(
      kgService,
      dbService,
      fileWatcher,
      astParser,
      undefined, // docParser
      undefined, // securityScanner
      { port: 0 } // Use random port
    );

    // Start server
    await apiGateway.start();
    // Access the Fastify server directly
    const server = (apiGateway as any).app.server;
    const address = server.address();
    const port = typeof address === 'object' ? address?.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService) {
      await dbService.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data following FalkorDB pattern
    await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "admin_test_" DELETE n').catch(() => {});
    await dbService.postgresQuery('DELETE FROM test_results WHERE test_id LIKE $1', ['admin_test_%']).catch(() => {});
  });

  describe('System Status', () => {
    it('should get system health via API', async () => {
      const response = await fetch(`${baseUrl}/api/v1/admin-health`);
      expect(response.status).toBe(200);

      const result = await response.json() as any;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.overall).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.data.overall);
    });

    it('should get system configuration via API', async () => {
      const response = await fetch(`${baseUrl}/api/v1/config`);
      expect(response.status).toBe(200);

      const result = await response.json() as any;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.version).toBeDefined();
      expect(result.data.environment).toBeDefined();
      expect(result.data.features).toBeDefined();
    });
  });

  describe('Synchronization', () => {
    it('should get sync status via API', async () => {
      const response = await fetch(`${baseUrl}/api/v1/sync-status`);
      expect(response.status).toBe(200);

      const result = await response.json() as any;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data.isActive).toBe('boolean');
    });

    it('should trigger synchronization via API', async () => {
      const response = await fetch(`${baseUrl}/api/v1/admin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: false,
          includeEmbeddings: true
        })
      });

      // The sync coordinator might not be available, so accept both success and service unavailable
      expect([200, 503]).toContain(response.status);

      const result = await response.json() as any;
      expect(result).toBeDefined();

      if (response.status === 200) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.jobId).toBeDefined();
      } else {
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('SYNC_UNAVAILABLE');
      }
    });
  });

  describe('Analytics', () => {
    it('should get system analytics via API', async () => {
      const response = await fetch(`${baseUrl}/api/v1/analytics`);
      expect(response.status).toBe(200);

      const result = await response.json() as any;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.usage).toBeDefined();
      expect(result.data.performance).toBeDefined();
      expect(result.data.content).toBeDefined();
    });
  });
});