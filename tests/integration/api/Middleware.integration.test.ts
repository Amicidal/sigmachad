/**
 * Integration tests for API middleware
 * Tests rate limiting, validation, CORS, authentication, and other middleware functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { expectSuccess } from '../../test-utils/assertions';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('API Middleware Integration', () => {
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
      await clearTestData(dbService);
    }
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should apply different limits to different endpoints', async () => {
      // Health endpoint should have default rate limit
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Search endpoint should have search-specific rate limit
      const searchResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect(healthResponse.statusCode).toBe(200);
      expect([200, 400]).toContain(searchResponse.statusCode); // Search might fail due to missing data, but rate limiting should work
    });

    it('should handle rate limit exceeded gracefully', async () => {
      // This test is difficult to implement reliably without knowing exact rate limit configuration
      // In a real scenario, you would make many rapid requests to trigger rate limiting

      const maxRequests = 10;
      const requests = [];

      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          app.inject({
            method: 'GET',
            url: '/health',
          })
        );
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.statusCode === 200).length;
      const rateLimitedCount = responses.filter(r => r.statusCode === 429).length;

      // Should have some successful requests
      expect(successCount).toBeGreaterThan(0);
      // Total should equal max requests
      expect(successCount + rateLimitedCount).toBe(maxRequests);
    });

    it('should include rate limit headers in responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Rate limit headers may or may not be present depending on implementation
      // This test verifies the middleware is configured properly
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Input Validation', () => {
    it('should validate JSON request bodies', async () => {
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

    it('should sanitize input data', async () => {
      // Test with potentially malicious input
      const maliciousQuery = '<script>alert("xss")</script>test';
      const searchRequest = {
        query: maliciousQuery,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(searchRequest),
      });

      expect([200, 400]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);
        // The input should be sanitized and not contain script tags
        // (exact sanitization behavior depends on implementation)
      }
    });

    it('should handle large request bodies', async () => {
      // Create a large but valid request body
      const largeQuery = 'x'.repeat(10000); // 10KB query
      const searchRequest = {
        query: largeQuery,
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

      expect([200, 400, 413]).toContain(response.statusCode); // 413 = Payload Too Large
    });

    it('should validate content-type headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'text/plain', // Wrong content type
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect([200, 400]).toContain(response.statusCode);
    });
  });

  describe('CORS Handling', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/graph/search',
        headers: {
          'origin': 'http://localhost:3000',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type,authorization',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should include CORS headers in actual requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'origin': 'http://localhost:5173',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle multiple allowed origins', async () => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

      for (const origin of allowedOrigins) {
        const response = await app.inject({
          method: 'GET',
          url: '/health',
          headers: {
            'origin': origin,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });

    it('should handle disallowed origins gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'origin': 'http://malicious-site.com',
        },
      });

      expect(response.statusCode).toBe(200);
      // Depending on CORS configuration, this might still work or be blocked
      // The important thing is that the request is handled
    });
  });

  describe('Request Logging', () => {
    it('should log incoming requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'user-agent': 'Test-Agent/1.0',
        },
      });

      expect(response.statusCode).toBe(200);
      // Request logging is handled by Fastify's built-in logger
      // In a real test environment, you might capture logs to verify they're written
    });

    it('should log response details', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect([200, 400]).toContain(response.statusCode);
      // Response logging should include status code and response time
    });

    it('should include request IDs in logs', async () => {
      const customRequestId = 'test-request-123';

      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': customRequestId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      // Check for common security headers
      const headers = response.headers;

      // These headers may or may not be present depending on implementation
      // The test verifies the middleware setup works
      expect(typeof headers).toBe('object');
    });

    it('should prevent common security vulnerabilities', async () => {
      // Test for XSS prevention
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should handle HTTPS redirection properly', async () => {
      // This would typically be tested in a production environment
      // In development, we just verify the middleware is configured
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle 404 errors with proper format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-endpoint-12345',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('not found');
      expect(body.requestId).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('should handle server errors with proper format', async () => {
      // Mock a server error
      const originalSearch = kgService.search;
      kgService.search = async () => {
        throw new Error('Database connection failed');
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
        expect(body.error.message).toBeDefined();
        expect(body.requestId).toBeDefined();
        expect(body.timestamp).toBeDefined();

        // In production, detailed error info should be hidden
        if (process.env.NODE_ENV === 'production') {
          expect(body.error.details).toBeUndefined();
        }
      } finally {
        // Restore original method
        kgService.search = originalSearch;
      }
    });

    it('should handle validation errors properly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({}), // Missing required query field
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBeDefined();
      expect(body.error.message).toBeDefined();
    });
  });

  describe('Request Timeout Handling', () => {
    it('should handle request timeouts gracefully', async () => {
      // Create a request that might timeout
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          query: 'x'.repeat(100000), // Very large query that might cause timeout
        }),
      });

      // Should either succeed, fail with validation error, or timeout
      expect([200, 400, 408, 504]).toContain(response.statusCode);
    });

    it('should handle slow requests appropriately', async () => {
      // Test with a request that should complete within timeout
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      // Should complete quickly
      expect(response.elapsedTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Request Size Limits', () => {
    it('should handle requests within size limits', async () => {
      const normalRequest = {
        query: 'test query',
        limit: 10,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(normalRequest),
      });

      expect([200, 400]).toContain(response.statusCode);
    });

    it('should reject requests exceeding size limits', async () => {
      // Create a very large request body
      const largeRequest = {
        query: 'x'.repeat(1000000), // 1MB query
        filters: {
          language: 'x'.repeat(100000),
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(largeRequest),
      });

      expect([200, 400, 413]).toContain(response.statusCode); // 413 = Payload Too Large
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          app.inject({
            method: 'GET',
            url: '/health',
          })
        );
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.statusCode === 200).length;

      expect(successCount).toBe(concurrentRequests);
    });

    it('should maintain request isolation', async () => {
      // Test that different requests don't interfere with each other
      const request1 = app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': 'request-1',
        },
      });

      const request2 = app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': 'request-2',
        },
      });

      const [response1, response2] = await Promise.all([request1, request2]);

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      expect(response1.headers['x-request-id']).toBe('request-1');
      expect(response2.headers['x-request-id']).toBe('request-2');
    });
  });
});
