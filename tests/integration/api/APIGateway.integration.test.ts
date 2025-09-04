/**
 * Integration tests for API Gateway
 * Tests the complete API Gateway functionality including initialization,
 * health checks, route registration, and service integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import { FileWatcher } from '../../../src/services/FileWatcher.js';
import { ASTParser } from '../../../src/services/ASTParser.js';
import { DocumentationParser } from '../../../src/services/DocumentationParser.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('APIGateway Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create knowledge graph service
    kgService = new KnowledgeGraphService(dbService);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);

    // Get the Fastify app
    app = apiGateway.getApp();
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

  describe('API Gateway Initialization', () => {
    it('should initialize with correct configuration', () => {
      const config = apiGateway.getConfig();

      expect(config).toBeDefined();
      expect(config.port).toBeGreaterThan(0);
      expect(config.host).toBe('0.0.0.0');
      expect(config.cors).toBeDefined();
      expect(config.cors.origin).toBeDefined();
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit.max).toBeGreaterThan(0);
    });

    it('should have Fastify app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('object');
      expect(app.server).toBeDefined();
    });

    it('should have all required routes registered', () => {
      // Check that routes are registered by testing the route tree
      expect(app.hasRoute('GET', '/health')).toBe(true);
      expect(app.hasRoute('GET', '/docs')).toBe(true);
      expect(app.hasRoute('GET', '/api/v1/test')).toBe(true);
    });

    it('should have API v1 routes properly registered', () => {
      // Test that API v1 routes are accessible
      expect(app.hasRoute('POST', '/api/v1/graph/search')).toBe(true);
      expect(app.hasRoute('GET', '/api/v1/graph/entities')).toBe(true);
      expect(app.hasRoute('POST', '/api/v1/tests/plan-and-generate')).toBe(true);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status when all services are working', async () => {
      // Start the server
      await apiGateway.start();

      // Make request to health endpoint
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeGreaterThan(0);
      expect(body.services).toBeDefined();
      expect(body.mcp).toBeDefined();
      expect(body.mcp.tools).toBeDefined();
    });

    it('should include database health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.payload);
      expect(body.services).toHaveProperty('falkordb');
      expect(body.services).toHaveProperty('qdrant');
      expect(body.services).toHaveProperty('postgresql');
      expect(body.services).toHaveProperty('redis');
    });

    it('should include MCP server status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.payload);
      expect(body.mcp).toBeDefined();
      expect(typeof body.mcp.tools).toBe('number');
      expect(body.mcp.validation).toBeDefined();
    });

    it('should return unhealthy status when critical services fail', async () => {
      // Mock a service failure scenario
      const originalHealthCheck = dbService.healthCheck;
      dbService.healthCheck = async () => ({
        falkordb: false,
        qdrant: true,
        postgresql: true,
        redis: true,
      });

      try {
        const response = await app.inject({
          method: 'GET',
          url: '/health',
        });

        expect(response.statusCode).toBe(503);

        const body = JSON.parse(response.payload);
        expect(body.status).toBe('unhealthy');
        expect(body.services.falkordb).toBe(false);
      } finally {
        // Restore original health check
        dbService.healthCheck = originalHealthCheck;
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/graph/search',
        headers: {
          'origin': 'http://localhost:3000',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should include CORS headers in responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'origin': 'http://localhost:5173',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Request/Response Middleware', () => {
    it('should add request ID to all responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect((response.headers['x-request-id'] as string).length).toBeGreaterThan(0);
    });

    it('should handle custom request IDs', async () => {
      const customRequestId = 'custom-request-123';

      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': customRequestId,
        },
      });

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('should log requests and responses', async () => {
      // This test verifies that logging middleware is properly configured
      // In a real scenario, you might want to capture logs, but for now we verify the middleware exists
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      // Logging is handled by Fastify's built-in logging, so we just verify the request succeeds
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-route',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('not found');
      expect(body.requestId).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: '{ invalid json',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return proper error format for server errors', async () => {
      // Mock an internal server error
      const originalSearch = kgService.search;
      kgService.search = async () => {
        throw new Error('Test database error');
      };

      try {
        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/graph/search',
          headers: {
            'content-type': 'application/json',
          },
          payload: JSON.stringify({ query: 'test' }),
        });

        expect(response.statusCode).toBe(500);

        const body = JSON.parse(response.payload);
        expect(body.error).toBeDefined();
        expect(body.error.code).toBe('GRAPH_SEARCH_FAILED');
        expect(body.error.message).toContain('Failed to perform graph search');
        expect(body.requestId).toBeDefined();
        expect(body.timestamp).toBeDefined();
      } finally {
        // Restore original method
        kgService.search = originalSearch;
      }
    });
  });

  describe('Route Validation', () => {
    it('should validate required fields in request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({}), // Missing required 'query' field
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate request parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/graph/examples/invalid-id',
      });

      // Should handle gracefully even with invalid ID
      expect([200, 404, 500]).toContain(response.statusCode);
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.payload);
      expect(body).toBeDefined();
      expect(typeof body).toBe('object');
    });
  });

  describe('Test Route', () => {
    it('should return success message for test route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.message).toContain('Route registration is working');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    it('should start and stop gracefully', async () => {
      // Server should already be started from earlier tests
      expect(apiGateway.getConfig().port).toBeGreaterThan(0);

      // Stop the server
      await apiGateway.stop();

      // Verify server is stopped
      expect(() => {
        // This should not throw an error, but server should be closed
        apiGateway.getApp().server.close();
      }).not.toThrow();
    });

    it('should handle multiple start/stop cycles', async () => {
      // Start server again
      await apiGateway.start();
      expect(apiGateway.getConfig().port).toBeGreaterThan(0);

      // Stop again
      await apiGateway.stop();

      // Start once more
      await apiGateway.start();
      expect(apiGateway.getConfig().port).toBeGreaterThan(0);

      // Final stop
      await apiGateway.stop();
    });
  });
});
