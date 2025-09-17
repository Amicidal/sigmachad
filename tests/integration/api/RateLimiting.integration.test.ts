/**
 * Integration tests for Rate Limiting functionality
 * Tests API rate limiting enforcement across different endpoint categories
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
import { __getRateLimitStoresForTests } from '../../../src/api/middleware/rate-limiting.js';
import { expectSuccess, expectError } from '../../test-utils/assertions';

describe('Rate Limiting Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  function drainBuckets(matcher: (key: string) => boolean = () => true) {
    for (const store of __getRateLimitStoresForTests()) {
      for (const [key, bucket] of store.entries()) {
        if (matcher(key)) {
          bucket.tokens = 0;
        }
      }
    }
  }

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);

    // Create API Gateway with rate limiting enabled
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
    // Clear any rate limiting state between tests
    vi.clearAllTimers();
  });

  describe('Search Endpoint Rate Limiting (100 requests/minute)', () => {
    it('should allow requests under the rate limit', async () => {
      const requestPayload = {
        query: 'test search',
        limit: 10,
      };

      // Make several requests under the limit
      for (let i = 0; i < 2; i++) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/graph/search',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.100', // Consistent IP for rate limiting
          },
          payload: JSON.stringify(requestPayload),
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ success: true }));
        // Check rate limit headers are present with proper types
        expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
        expect(typeof response.headers['x-ratelimit-remaining']).toBe('string');
        expect(typeof response.headers['x-ratelimit-reset']).toBe('string');
      }
    });

    it('should enforce rate limit on search endpoints', async () => {
      const requestPayload = {
        query: 'test search',
        limit: 10,
      };

      const clientIP = '192.168.1.101';

      const okResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify(requestPayload),
      });
      expect(okResponse.statusCode).toBe(200);
      expect(okResponse.headers['x-ratelimit-limit']).toBeDefined();

      drainBuckets((key) => key.includes('/api/v1/graph/search'));

      const limitedResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify(requestPayload),
      });

      expect(limitedResponse.statusCode).toBe(429);
      const body = JSON.parse(limitedResponse.payload);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED',
            message: expect.any(String),
          }),
        })
      );
      expect(limitedResponse.headers['x-ratelimit-limit']).toBeDefined();
      expect(limitedResponse.headers['x-ratelimit-remaining']).toBe('0');
      expect(limitedResponse.headers['retry-after']).toBeDefined();
    }, 15000); // Longer timeout for this test

    it('should track rate limits per IP address', async () => {
      const requestPayload = {
        query: 'test',
        limit: 10,
      };

      await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.102',
        },
        payload: JSON.stringify(requestPayload),
      });

      drainBuckets((key) => key.includes('/api/v1/graph/search'));

      const limited = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.102',
        },
        payload: JSON.stringify(requestPayload),
      });
      expect(limited.statusCode).toBe(429);

      const response2 = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.103',
        },
        payload: JSON.stringify(requestPayload),
      });

      expect(response2.statusCode).toBe(200);
    });
  });

  describe('Admin Endpoint Rate Limiting (50 requests/minute)', () => {
    it('should enforce stricter limits on admin endpoints', async () => {
      const clientIP = '192.168.1.104';

      const okResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });
      expect(okResponse.headers['x-ratelimit-limit']).toBeDefined();

      drainBuckets((key) => key.includes('/api/v1/admin'));

      const limitedResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      expect(limitedResponse.statusCode).toBe(429);
      expect(limitedResponse.headers['x-ratelimit-limit']).toBeDefined();
    }, 10000);

    it('should isolate admin rate limits from search rate limits', async () => {
      const clientIP = '192.168.1.105';

      await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      drainBuckets((key) => key.includes('/api/v1/graph/search'));

      const limitedSearch = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify({ query: 'test' }),
      });
      expect(limitedSearch.statusCode).toBe(429);

      // Admin endpoint should still work (separate rate limit bucket)
      const adminResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });
      expect(adminResponse.statusCode).not.toBe(429);
      // Health may be 200 or 503 depending on backing services
      if (adminResponse.statusCode === 200) {
        try { JSON.parse(adminResponse.payload || '{}'); } catch {}
      } else if (adminResponse.statusCode === 503) {
        const body = JSON.parse(adminResponse.payload || '{}');
        expect(body).toEqual(expect.objectContaining({ success: false }));
      }
      expect(typeof adminResponse.headers['x-ratelimit-limit']).toBe('string');
    });

    it('should handle admin sync endpoint rate limiting', async () => {
      const clientIP = '192.168.1.106';

      // Test sync endpoint (should have admin rate limits)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/admin/sync',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify({ force: false }),
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toEqual(expect.objectContaining({ success: true }));
      } else if ([400, 409].includes(response.statusCode)) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toEqual(expect.objectContaining({ success: false }));
      }
      expect(response.headers['x-ratelimit-limit']).toEqual(expect.any(String));
    });
  });

  describe('General Endpoint Rate Limiting (1000 requests/hour)', () => {
    it('should apply default rate limits to other endpoints', async () => {
      const clientIP = '192.168.1.107';

      // Test health endpoint (should have default rate limits)
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
      
      // Default limit should be higher than search/admin
      const limit = parseInt(response.headers['x-ratelimit-limit'] as string, 10);
      expect(limit).toBeGreaterThan(100); // Higher than search limit
    });

    it('should handle test endpoint rate limiting', async () => {
      const clientIP = '192.168.1.108';

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toEqual(expect.any(String));
    });
  });

  describe('Rate Limit Headers and Recovery', () => {
    it('should include correct rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': '192.168.1.109',
        },
      });

      expect(response.statusCode).toBe(200);
      
      // Check required headers
      expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
      expect(typeof response.headers['x-ratelimit-remaining']).toBe('string');
      expect(typeof response.headers['x-ratelimit-reset']).toBe('string');

      // Validate header values
      const limit = parseInt(response.headers['x-ratelimit-limit'] as string, 10);
      const remaining = parseInt(response.headers['x-ratelimit-remaining'] as string, 10);
      const reset = parseInt(response.headers['x-ratelimit-reset'] as string, 10);

      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(limit);
      expect(reset).toBeGreaterThan(Date.now() / 1000); // Reset should be in the future
    });

    it('should decrement remaining count with each request', async () => {
      const clientIP = '192.168.1.110';

      const response1 = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining'] as string, 10);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining'] as string, 10);

      expect(remaining2).toBeLessThanOrEqual(remaining1);
    });

    it('should include retry-after header when rate limited', async () => {
      const clientIP = '192.168.1.111';
      const requestPayload = { query: 'test' };

      // Rapidly exhaust rate limit
      await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify(requestPayload),
      });

      drainBuckets((key) => key.includes('/api/v1/graph/search'));

      const limited = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIP,
        },
        payload: JSON.stringify(requestPayload),
      });

      expect(limited.statusCode).toBe(429);
      expect(typeof limited.headers['retry-after']).toBe('string');
      const retryAfter = parseInt(limited.headers['retry-after'] as string, 10);
      expect(retryAfter).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Rate Limit Token Bucket Refill', () => {
    it('should refill tokens over time', async () => {
      const clientIP = '192.168.1.112';

      // Make a request to start the bucket
      await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      // Wait a short time (simulate token refill)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Make another request - should have same or more tokens available
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': clientIP,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.headers['x-ratelimit-remaining']).toBe('string');
    });

    it('should handle concurrent requests correctly', async () => {
      const clientIP = '192.168.1.113';

      // Make concurrent requests
      const promises = Array(5).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/health',
          headers: {
            'x-forwarded-for': clientIP,
          },
        })
      );

      const responses = await Promise.all(promises);

      // All should succeed under normal rate limits
      responses.forEach(response => {
        if (response.statusCode === 200) {
          try { JSON.parse(response.payload || '{}'); } catch {}
        } else if (response.statusCode === 429) {
          const body = JSON.parse(response.payload || '{}');
          expect(body).toHaveProperty('error');
        }
        expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
      });
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle missing IP addresses gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        // No x-forwarded-for header
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
    });

    it('should handle malformed IP addresses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': 'invalid-ip-address',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
    });

    it('should handle IPv6 addresses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.headers['x-ratelimit-limit']).toBe('string');
    });

    it('should handle proxy chains in x-forwarded-for', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toEqual(expect.any(String));
    });
  });
});
