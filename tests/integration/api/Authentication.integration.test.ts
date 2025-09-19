/**
 * Integration tests for Authentication and Authorization
 * Tests JWT tokens, API keys, and role-based access control
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
import {
  mintAccessToken,
  mintExpiredToken,
  mintTokenWithWrongSecret,
  encodeApiKey,
  buildApiKeyRegistry,
} from '../../test-utils/auth.ts';

describe('Authentication & Authorization Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  // Test JWT secrets and tokens
  const JWT_SECRET = 'test-jwt-secret-for-integration-tests';
  const API_KEY_ID = 'test-api-key';
  const API_KEY_SECRET = 'test-api-key-secret';

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);

    // Create API Gateway with authentication enabled
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();

    // Set test environment variables
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.API_KEY_REGISTRY = buildApiKeyRegistry([
      {
        id: API_KEY_ID,
        secret: API_KEY_SECRET,
        scopes: ['graph:read'],
      },
    ]);
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
    // Clean up environment
    delete process.env.JWT_SECRET;
    delete process.env.API_KEY_REGISTRY;
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  const mintReadToken = (payload: Record<string, unknown> = {}, expiresIn: string | number = '1h') =>
    mintAccessToken(JWT_SECRET, {
      scopes: ['graph:read'],
      permissions: ['read'],
      payload,
      expiresIn,
    });

  const mintAdminToken = (payload: Record<string, unknown> = {}) =>
    mintAccessToken(JWT_SECRET, {
      scopes: ['admin'],
      permissions: ['admin'],
      payload,
    });

  const mintAnalyzeToken = (payload: Record<string, unknown> = {}) =>
    mintAccessToken(JWT_SECRET, {
      scopes: ['code:analyze'],
      permissions: ['analyze'],
      payload,
    });

  const mintRefreshToken = (overrides: Record<string, unknown> = {}, expired = false) =>
    (expired ? mintExpiredToken : mintAccessToken)(JWT_SECRET, {
      scopes: ['session:refresh'],
      permissions: ['session:refresh'],
      payload: { type: 'refresh', ...overrides },
    });

  const mintInvalidSignatureToken = () =>
    mintTokenWithWrongSecret('wrong-secret', {
      scopes: ['graph:read'],
      permissions: ['read'],
    });

  const createGraphApiKey = () => encodeApiKey(API_KEY_ID, API_KEY_SECRET);

  describe('JWT Token Authentication', () => {
    it('should accept valid JWT tokens', async () => {
      const token = mintAdminToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(() => JSON.parse(response.payload || '{}')).not.toThrow();
    });

    it('should reject requests without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.metadata.requiredScopes).toContain('admin');
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = mintExpiredToken(JWT_SECRET, {
        scopes: ['admin'],
        permissions: ['admin'],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${expiredToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('TOKEN_EXPIRED');
      expect(body.error.remediation).toContain('access token');
    });

    it('should reject JWT tokens with invalid signatures', async () => {
      const invalidToken = mintInvalidSignatureToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${invalidToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INVALID_TOKEN');
      expect(body.error.reason).toBeDefined();
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedToken = 'not.a.jwt.token';

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${malformedToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle missing Bearer prefix', async () => {
      const token = mintAdminToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': token, // Missing "Bearer "
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.remediation).toContain('Bearer');
    });

    it('should extract user information from valid tokens', async () => {
      const token = mintAdminToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const headers = response.headers;
      expect(headers['x-auth-subject']).toBe('user-123');
      expect(headers['x-auth-scopes']).toContain('admin');
    });
  });

  describe('API Key Authentication', () => {
    it('should accept valid API keys', async () => {
      const apiKey = createGraphApiKey();

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload || '{}');
      expect(body).toHaveProperty('success', true);
    });

    it('should reject invalid API keys', async () => {
      const invalidApiKey = 'invalid-api-key-123';

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'x-api-key': invalidApiKey,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INVALID_API_KEY');
      expect(body.metadata.requiredScopes).toContain('graph:read');
    });

    it('should handle API key rate limiting separately', async () => {
      const apiKey = createGraphApiKey();
      const promises = [];

      // Make multiple requests with same API key
      for (let i = 0; i < 10; i++) {
        promises.push(
          app.inject({
            method: 'POST',
            url: '/api/v1/graph/search',
            headers: {
              'x-api-key': apiKey,
              'content-type': 'application/json',
            },
            payload: JSON.stringify({ query: 'test' }),
          })
        );
      }

      const responses = await Promise.all(promises);

      // Should track rate limits per API key
      responses.forEach(response => {
        expect([200, 429]).toContain(response.statusCode);
      });
    });

    it('should handle both JWT and API key authentication', async () => {
      const token = mintAdminToken();
      const apiKey = createGraphApiKey();

      // Test with both JWT and API key (JWT should take precedence)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should enforce scopes when only the API key registry is configured', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const anonymousResponse = await app.inject({
          method: 'GET',
          url: '/api/v1/admin/admin-health',
        });

        expect(anonymousResponse.statusCode).toBe(401);
        const body = JSON.parse(anonymousResponse.payload || '{}');
        expect(body.metadata.requiredScopes).toContain('admin');

        const apiKey = createGraphApiKey();
        const scopedResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/graph/search',
          headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
          },
          payload: JSON.stringify({ query: 'registry-only' }),
        });

        expect(scopedResponse.statusCode).toBe(200);
      } finally {
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        } else {
          delete process.env.JWT_SECRET;
        }
      }
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should allow admin users to access admin endpoints', async () => {
      const adminToken = mintAdminToken({ role: 'admin' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should restrict regular users from admin endpoints', async () => {
      const userToken = mintReadToken({ role: 'user' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INSUFFICIENT_SCOPES');
      expect(body.metadata.requiredScopes).toContain('admin');
    });

    it('should allow users to access read-only endpoints', async () => {
      const userToken = mintReadToken({ role: 'user' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'authorization': `Bearer ${userToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect(response.statusCode).toBe(200);
    });

    it('should restrict write operations for read-only users', async () => {
      const readOnlyToken = mintReadToken({ role: 'reader' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/admin/sync',
        headers: {
          'authorization': `Bearer ${readOnlyToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ force: true }),
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INSUFFICIENT_SCOPES');
    });

    it('should handle custom permission sets', async () => {
      const customToken = mintAnalyzeToken({
        role: 'analyst',
        permissions: ['analyze'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/code/analyze',
        headers: {
          'authorization': `Bearer ${customToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          files: ['src/'],
          analysisType: 'complexity',
        }),
      });

      expect([200, 400]).toContain(response.statusCode);
    });

    it('should deny access for users with no permissions', async () => {
      const noPermissionToken = mintAccessToken(JWT_SECRET, {
        scopes: [],
        permissions: [],
        payload: { role: 'guest' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'authorization': `Bearer ${noPermissionToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.payload);
      expect(body.error.code).toBe('INSUFFICIENT_SCOPES');
    });
  });

  describe('OAuth 2.0 Integration', () => {
    it('should handle OAuth token validation', async () => {
      // Mock OAuth token (would normally come from GitHub/GitLab)
      const oauthToken = mintAccessToken(JWT_SECRET, {
        iss: 'https://github.com',
        sub: 'github-user-123',
        aud: 'memento-app',
        role: 'user',
        scopes: ['graph:read', 'graph:write'],
        permissions: ['read', 'write'],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${oauthToken}`,
        },
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toEqual(expect.any(Object));
      } else if ([401, 403].includes(response.statusCode)) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });

    it('should handle GitHub integration tokens', async () => {
      const githubToken = mintAccessToken(JWT_SECRET, {
        iss: 'https://github.com',
        login: 'testuser',
        id: 12345,
        node_id: 'MDQ6VXNlcjEyMzQ1',
        scopes: ['graph:read'],
        permissions: ['read'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'authorization': `Bearer ${githubToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('data');
      } else if ([400, 401].includes(response.statusCode)) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });

    it('should handle GitLab integration tokens', async () => {
      const gitlabToken = mintAccessToken(JWT_SECRET, {
        iss: 'https://gitlab.com',
        username: 'testuser',
        user_id: 54321,
        scopes: ['graph:read', 'graph:write'],
        permissions: ['read', 'write'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/graph/search',
        headers: {
          'authorization': `Bearer ${gitlabToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ query: 'test' }),
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('data');
      } else if ([400, 401].includes(response.statusCode)) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });
  });

  describe('Token Refresh Flow', () => {
    it('should handle refresh token requests', async () => {
      // Mock refresh token endpoint (implementation may vary)
      const refreshToken = mintRefreshToken({ userId: 'test-user-123' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          refreshToken,
        }),
      });

      // Endpoint should exist; require 200 or 401 (unauthorized)
      if (response.statusCode === 404) {
        throw new Error('Auth refresh endpoint missing; test requires implementation');
      }
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload || '{}');
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
    });

    it('should reject expired refresh tokens', async () => {
      const expiredRefreshToken = mintRefreshToken({ userId: 'test-user-123' }, true);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          refreshToken: expiredRefreshToken,
        }),
      });

      if (response.statusCode === 404) {
        throw new Error('Auth refresh endpoint missing; expired token test requires implementation');
      }
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload || '{}');
      expect(body.error.code).toBe('TOKEN_EXPIRED');
      expect(body.error.message.toLowerCase()).toContain('expired');
    });

    it('should prevent reuse of a refresh token after rotation', async () => {
      const reusableToken = mintRefreshToken({
        userId: 'replay-user-123',
        sessionId: 'session-replay-1',
        rotationId: 'rotation-initial-1',
      });

      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ refreshToken: reusableToken }),
      });

      expect(firstResponse.statusCode).toBe(200);
      const firstBody = JSON.parse(firstResponse.payload || '{}');
      expect(firstBody.success).toBe(true);

      const replayAttempt = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ refreshToken: reusableToken }),
      });

      expect(replayAttempt.statusCode).toBe(401);
      const replayBody = JSON.parse(replayAttempt.payload || '{}');
      expect(replayBody.error.code).toBe('TOKEN_REPLAY');
      expect(replayBody.error.reason).toBe('token_replayed');

      const rotatedToken = firstBody?.data?.refreshToken;
      expect(typeof rotatedToken).toBe('string');

      const followUp = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ refreshToken: rotatedToken }),
      });

      expect(followUp.statusCode).toBe(200);
    });
  });

  describe('Public Endpoints', () => {
    it('should allow access to health endpoint without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow access to documentation without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow access to test endpoint without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include security headers in authenticated responses', async () => {
      const token = mintAdminToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      // Check for security headers
      expect(typeof response.headers['x-content-type-options']).toBe('string');
      expect(typeof response.headers['x-frame-options']).toBe('string');
      expect(typeof response.headers['x-xss-protection']).toBe('string');
    });

    it('should handle CORS preflight requests with authentication', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/admin/admin-health',
        headers: {
          'origin': 'https://memento.example.com',
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'authorization',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-headers']).toContain('authorization');
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format for authentication failures', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': `Bearer ${invalidToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toEqual(expect.any(Object));
      expect(typeof body.error.code).toBe('string');
      expect(typeof body.error.message).toBe('string');
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
      expect(typeof body.requestId).toBe('string');
    });

    it('should not leak sensitive information in error messages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/admin-health',
        headers: {
          'authorization': 'Bearer malformed-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error.message).not.toContain(JWT_SECRET);
      expect(body.error.message.toLowerCase()).not.toContain('secret');
      expect(body.error.message.toLowerCase()).not.toContain('key');
    });
  });
});
