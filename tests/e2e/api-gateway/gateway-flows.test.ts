import { describe, it, expect, beforeEach } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('API Gateway Flows E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;

  beforeEach(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;
  });

  describe('Rate Limiting', () => {
    it('should enforce global rate limits', async () => {
      // Create client without API key (should use global limits)
      const responses = [];

      // Make rapid requests to trigger rate limiting
      for (let i = 0; i < 25; i++) {
        const response = await client.get('/api/health');
        responses.push(response);
      }

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Rate limited responses should include proper headers
      for (const response of rateLimited) {
        assertions.assertRateLimited(response);
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      }
    });

    it('should enforce per-API-key rate limits', async () => {
      // Create API key with specific rate limits
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Rate Limited Key',
        permissions: ['read'],
        rateLimit: {
          requestsPerMinute: 10,
          burstLimit: 5,
        },
      });

      assertions.assertSuccessResponse(keyResponse, 201);
      client.setApiKey(keyResponse.body.apiKey);

      // Make requests up to burst limit
      const burstResponses = [];
      for (let i = 0; i < 8; i++) {
        const response = await client.get('/api/graph/entities');
        burstResponses.push(response);
      }

      // Some should succeed, some should be rate limited
      const successful = burstResponses.filter(r => r.statusCode === 200);
      const rateLimited = burstResponses.filter(r => r.statusCode === 429);

      expect(successful.length).toBeGreaterThan(0);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should respect rate limit windows and resets', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Window Test Key',
        permissions: ['read'],
        rateLimit: {
          requestsPerMinute: 5,
          windowSizeMs: 10000, // 10 second window for testing
        },
      });

      client.setApiKey(keyResponse.body.apiKey);

      // Exhaust rate limit
      const initialResponses = [];
      for (let i = 0; i < 8; i++) {
        const response = await client.get('/api/graph/entities');
        initialResponses.push(response);
      }

      // Should be rate limited
      const rateLimited = initialResponses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Wait for window reset
      await mockData.delay(11000);

      // Should be able to make requests again
      const afterResetResponse = await client.get('/api/graph/entities');
      expect(afterResetResponse.statusCode).toBe(200);
    });

    it('should handle different rate limits for different endpoints', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Endpoint Specific Key',
        permissions: ['read', 'write'],
        endpointLimits: {
          '/api/graph/parse': { requestsPerMinute: 2 },
          '/api/graph/entities': { requestsPerMinute: 10 },
        },
      });

      client.setApiKey(keyResponse.body.apiKey);

      // Test parse endpoint (lower limit)
      const parseResponses = [];
      for (let i = 0; i < 5; i++) {
        const response = await client.post('/api/graph/parse', {
          filePath: 'test.ts',
          content: 'export const test = 1;',
          language: 'typescript',
        });
        parseResponses.push(response);
      }

      const parseRateLimited = parseResponses.filter(r => r.statusCode === 429);
      expect(parseRateLimited.length).toBeGreaterThan(0);

      // Test entities endpoint (higher limit) - should still work
      const entitiesResponse = await client.get('/api/graph/entities');
      expect(entitiesResponse.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await client.get('/api/nonexistent/endpoint');

      assertions.assertNotFound(response);
      expect(response.body).toMatchObject({
        error: expect.any(String),
        statusCode: 404,
        timestamp: expect.any(String),
        path: '/api/nonexistent/endpoint',
      });
    });

    it('should handle 500 errors with proper error response', async () => {
      // Trigger a server error by sending malformed data
      const response = await client.post('/api/graph/entities', {
        // Missing required fields to trigger validation/server error
        invalidData: true,
      });

      expect([400, 500]).toContain(response.statusCode);
      expect(response.body).toMatchObject({
        error: expect.any(String),
        statusCode: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('should handle request timeout errors', async () => {
      // Create a request that will timeout
      const response = await client.post('/api/graph/process-directory', {
        directoryPath: '/nonexistent',
        files: Array.from({ length: 1000 }, () => mockData.generateCodeFile()), // Large dataset
        options: {
          timeout: 1, // Very short timeout
        },
      });

      expect([408, 504]).toContain(response.statusCode);
    });

    it('should validate request payloads and return proper errors', async () => {
      const invalidRequests = [
        {
          path: '/api/graph/entities',
          body: {}, // Missing required fields
        },
        {
          path: '/api/graph/relationships',
          body: {
            fromId: 'invalid-id',
            toId: 'another-invalid-id',
            // Missing type
          },
        },
        {
          path: '/api/graph/parse',
          body: {
            filePath: '', // Empty file path
            content: null, // Invalid content type
            language: 'unsupported-language',
          },
        },
      ];

      for (const request of invalidRequests) {
        const response = await client.post(request.path, request.body);
        assertions.assertValidationError(response);
        expect(response.body.error).toMatch(/validation|invalid|required/i);
      }
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await client.get('/api/health');

      assertions.assertSuccessResponse(response);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      // Make a preflight request
      const preflightResponse = await fetch(`${client['baseUrl']}/api/graph/entities`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers.get('access-control-allow-origin')).toBeDefined();
      expect(preflightResponse.headers.get('access-control-allow-methods')).toContain('POST');
    });

    it('should include security headers', async () => {
      const response = await client.get('/api/health');

      assertions.assertSuccessResponse(response);

      // Security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Content Negotiation', () => {
    it('should handle different content types', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Content Test Key',
        permissions: ['read'],
      });
      client.setApiKey(keyResponse.body.apiKey);

      // Test JSON response (default)
      const jsonResponse = await client.get('/api/graph/entities', undefined);
      expect(jsonResponse.headers['content-type']).toMatch(/application\/json/);

      // Test with explicit Accept header
      const explicitJsonResponse = await fetch(`${client['baseUrl']}/api/graph/entities`, {
        headers: {
          'X-API-Key': keyResponse.body.apiKey,
          'Accept': 'application/json',
        },
      });

      expect(explicitJsonResponse.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('should handle unsupported media types', async () => {
      const response = await fetch(`${client['baseUrl']}/api/graph/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml', // Unsupported
        },
        body: '<xml>invalid</xml>',
      });

      expect(response.status).toBe(415); // Unsupported Media Type
    });
  });

  describe('Request/Response Logging and Monitoring', () => {
    it('should include request correlation IDs', async () => {
      const response = await client.get('/api/health');

      assertions.assertSuccessResponse(response);
      expect(response.headers['x-request-id'] || response.headers['x-correlation-id']).toBeDefined();
    });

    it('should track response times in headers', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Performance Test Key',
        permissions: ['read'],
      });
      client.setApiKey(keyResponse.body.apiKey);

      const response = await client.get('/api/graph/entities');

      assertions.assertSuccessResponse(response);
      expect(response.headers['x-response-time']).toBeDefined();

      const responseTime = parseFloat(response.headers['x-response-time']);
      expect(responseTime).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(10000); // Should be less than 10 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Concurrency Test Key',
        permissions: ['read', 'write'],
      });
      client.setApiKey(keyResponse.body.apiKey);

      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        client.get('/api/health', { requestId: i })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      for (const response of responses) {
        assertions.assertSuccessResponse(response);
      }

      // Concurrent execution should be faster than sequential
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Health Checks and Monitoring', () => {
    it('should provide detailed health check information', async () => {
      const response = await client.get('/api/health');

      assertions.assertSuccessResponse(response);
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        services: expect.any(Object),
      });

      // Should include status of dependent services
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.redis).toBeDefined();
      expect(response.body.services.neo4j).toBeDefined();
      expect(response.body.services.qdrant).toBeDefined();
    });

    it('should provide metrics endpoint', async () => {
      const response = await client.get('/api/metrics');

      assertions.assertSuccessResponse(response);
      expect(response.body).toMatchObject({
        requests: expect.any(Object),
        response_times: expect.any(Object),
        errors: expect.any(Object),
        rate_limits: expect.any(Object),
      });
    });

    it('should handle readiness and liveness probes', async () => {
      // Readiness probe
      const readinessResponse = await client.get('/api/ready');
      expect([200, 503]).toContain(readinessResponse.statusCode);

      // Liveness probe
      const livenessResponse = await client.get('/api/alive');
      expect(livenessResponse.statusCode).toBe(200);
    });
  });

  describe('API Versioning', () => {
    it('should handle API version headers', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Version Test Key',
        permissions: ['read'],
      });

      // Test with version header
      const versionResponse = await fetch(`${client['baseUrl']}/api/graph/entities`, {
        headers: {
          'X-API-Key': keyResponse.body.apiKey,
          'X-API-Version': 'v1',
        },
      });

      expect(versionResponse.status).toBe(200);
      expect(versionResponse.headers.get('x-api-version')).toBeDefined();
    });

    it('should handle unsupported API versions gracefully', async () => {
      const response = await fetch(`${client['baseUrl']}/api/graph/entities`, {
        headers: {
          'X-API-Version': 'v999', // Unsupported version
        },
      });

      expect([400, 406]).toContain(response.status);
    });
  });

  describe('Caching and Performance', () => {
    it('should include appropriate cache headers', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'Cache Test Key',
        permissions: ['read'],
      });
      client.setApiKey(keyResponse.body.apiKey);

      // Test static endpoint that should be cacheable
      const response = await client.get('/api/health');

      assertions.assertSuccessResponse(response);

      // Should include cache control headers
      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['etag'] || response.headers['last-modified']).toBeDefined();
    });

    it('should handle conditional requests with ETags', async () => {
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'ETag Test Key',
        permissions: ['read'],
      });
      client.setApiKey(keyResponse.body.apiKey);

      // First request to get ETag
      const firstResponse = await client.get('/api/graph/entities');
      assertions.assertSuccessResponse(firstResponse);

      const etag = firstResponse.headers['etag'];
      if (etag) {
        // Conditional request with If-None-Match
        const conditionalResponse = await fetch(`${client['baseUrl']}/api/graph/entities`, {
          headers: {
            'X-API-Key': keyResponse.body.apiKey,
            'If-None-Match': etag,
          },
        });

        // Should return 304 Not Modified if content hasn't changed
        expect([200, 304]).toContain(conditionalResponse.status);
      }
    });
  });
});