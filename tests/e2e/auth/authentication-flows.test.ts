import { describe, it, expect, beforeEach } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('Authentication Flows E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;

  beforeEach(() => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;
  });

  describe('API Key Authentication', () => {
    it('should create and validate API key', async () => {
      // Create a new API key
      const createResponse = await client.post('/api/auth/api-keys', {
        name: 'Test API Key',
        permissions: ['read', 'write'],
      });

      assertions.assertSuccessResponse(createResponse, 201);
      assertions.assertValidApiKey(createResponse.body.apiKey);

      // Use the API key to make authenticated request
      client.setApiKey(createResponse.body.apiKey);
      const testResponse = await client.get('/api/auth/me');

      assertions.assertSuccessResponse(testResponse);
      expect(testResponse.body).toMatchObject({
        type: 'api_key',
        permissions: ['read', 'write'],
      });
    });

    it('should reject invalid API key', async () => {
      client.setApiKey('invalid-key');
      const response = await client.get('/api/auth/me');

      assertions.assertUnauthorized(response);
    });

    it('should handle API key with limited permissions', async () => {
      // Create read-only API key
      const createResponse = await client.post('/api/auth/api-keys', {
        name: 'Read Only Key',
        permissions: ['read'],
      });

      assertions.assertSuccessResponse(createResponse, 201);
      client.setApiKey(createResponse.body.apiKey);

      // Should allow read operations
      const readResponse = await client.get('/api/graph/entities');
      assertions.assertSuccessResponse(readResponse);

      // Should reject write operations
      const writeResponse = await client.post('/api/graph/entities', {
        name: 'Test Entity',
        type: 'function',
      });
      assertions.assertForbidden(writeResponse);
    });

    it('should revoke API key', async () => {
      // Create API key
      const createResponse = await client.post('/api/auth/api-keys', {
        name: 'Temporary Key',
        permissions: ['read'],
      });

      assertions.assertSuccessResponse(createResponse, 201);
      const apiKey = createResponse.body.apiKey;
      const keyId = createResponse.body.id;

      // Verify key works
      client.setApiKey(apiKey);
      let testResponse = await client.get('/api/auth/me');
      assertions.assertSuccessResponse(testResponse);

      // Revoke the key
      client.clearAuth(); // Use admin privileges for revocation
      const revokeResponse = await client.delete(`/api/auth/api-keys/${keyId}`);
      assertions.assertSuccessResponse(revokeResponse);

      // Verify key no longer works
      client.setApiKey(apiKey);
      testResponse = await client.get('/api/auth/me');
      assertions.assertUnauthorized(testResponse);
    });
  });

  describe('JWT Token Authentication', () => {
    it('should authenticate with valid JWT token', async () => {
      // Generate a test token (in real app, this would come from OAuth/login)
      const tokenResponse = await client.post('/api/auth/tokens', {
        user: mockData.generateUser(),
        expiresIn: '1h',
      });

      assertions.assertSuccessResponse(tokenResponse, 201);
      assertions.assertValidAuthToken(tokenResponse.body.token);

      // Use token for authentication
      client.setAuthToken(tokenResponse.body.token);
      const meResponse = await client.get('/api/auth/me');

      assertions.assertSuccessResponse(meResponse);
      expect(meResponse.body).toMatchObject({
        type: 'jwt',
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
        }),
      });
    });

    it('should reject expired JWT token', async () => {
      // Generate token with short expiration
      const tokenResponse = await client.post('/api/auth/tokens', {
        user: mockData.generateUser(),
        expiresIn: '1ms', // Expires immediately
      });

      assertions.assertSuccessResponse(tokenResponse, 201);

      // Wait for token to expire
      await mockData.delay(10);

      // Try to use expired token
      client.setAuthToken(tokenResponse.body.token);
      const response = await client.get('/api/auth/me');

      assertions.assertUnauthorized(response);
    });

    it('should refresh JWT token', async () => {
      // Create initial token
      const tokenResponse = await client.post('/api/auth/tokens', {
        user: mockData.generateUser(),
        expiresIn: '1h',
      });

      assertions.assertSuccessResponse(tokenResponse, 201);
      const originalToken = tokenResponse.body.token;

      // Refresh the token
      client.setAuthToken(originalToken);
      const refreshResponse = await client.post('/api/auth/refresh');

      assertions.assertSuccessResponse(refreshResponse);
      assertions.assertValidAuthToken(refreshResponse.body.token);
      expect(refreshResponse.body.token).not.toBe(originalToken);

      // Verify new token works
      client.setAuthToken(refreshResponse.body.token);
      const meResponse = await client.get('/api/auth/me');
      assertions.assertSuccessResponse(meResponse);
    });
  });

  describe('Session Management', () => {
    it('should create and manage user session', async () => {
      const user = mockData.generateUser();

      // Start session
      const sessionResponse = await client.post('/api/auth/sessions', {
        user,
        ttl: 3600, // 1 hour
      });

      assertions.assertSuccessResponse(sessionResponse, 201);
      expect(sessionResponse.body).toMatchObject({
        sessionId: expect.any(String),
        expiresAt: expect.any(String),
      });

      const sessionId = sessionResponse.body.sessionId;

      // Verify session exists
      const getSessionResponse = await client.get(`/api/auth/sessions/${sessionId}`);
      assertions.assertSuccessResponse(getSessionResponse);
      expect(getSessionResponse.body).toMatchObject({
        id: sessionId,
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      });

      // End session
      const endResponse = await client.delete(`/api/auth/sessions/${sessionId}`);
      assertions.assertSuccessResponse(endResponse);

      // Verify session no longer exists
      const getAfterEndResponse = await client.get(`/api/auth/sessions/${sessionId}`);
      assertions.assertNotFound(getAfterEndResponse);
    });

    it('should handle session expiration', async () => {
      const user = mockData.generateUser();

      // Create session with short TTL
      const sessionResponse = await client.post('/api/auth/sessions', {
        user,
        ttl: 1, // 1 second
      });

      assertions.assertSuccessResponse(sessionResponse, 201);
      const sessionId = sessionResponse.body.sessionId;

      // Wait for session to expire
      await mockData.delay(1500);

      // Try to access expired session
      const getResponse = await client.get(`/api/auth/sessions/${sessionId}`);
      assertions.assertNotFound(getResponse);
    });
  });

  describe('Multi-Agent Session Handoffs', () => {
    it('should handle agent session handoff via Redis pub-sub', async () => {
      const user = mockData.generateUser();

      // Agent A creates session
      const sessionResponse = await client.post('/api/auth/sessions', {
        user,
        agentId: 'agent-a',
        capabilities: ['parse', 'analyze'],
      });

      assertions.assertSuccessResponse(sessionResponse, 201);
      const sessionId = sessionResponse.body.sessionId;

      // Agent A publishes handoff event
      const handoffResponse = await client.post(`/api/auth/sessions/${sessionId}/handoff`, {
        targetAgent: 'agent-b',
        context: {
          currentTask: 'code-analysis',
          progress: 0.5,
        },
      });

      assertions.assertSuccessResponse(handoffResponse);

      // Agent B accepts handoff
      const acceptResponse = await client.post(`/api/auth/sessions/${sessionId}/accept`, {
        agentId: 'agent-b',
        capabilities: ['test', 'deploy'],
      });

      assertions.assertSuccessResponse(acceptResponse);

      // Verify session ownership transferred
      const sessionCheck = await client.get(`/api/auth/sessions/${sessionId}`);
      assertions.assertSuccessResponse(sessionCheck);
      expect(sessionCheck.body).toMatchObject({
        currentAgent: 'agent-b',
        capabilities: ['test', 'deploy'],
        context: {
          currentTask: 'code-analysis',
          progress: 0.5,
        },
      });
    });

    it('should handle concurrent handoff conflicts', async () => {
      const user = mockData.generateUser();

      // Create session
      const sessionResponse = await client.post('/api/auth/sessions', {
        user,
        agentId: 'agent-a',
      });

      assertions.assertSuccessResponse(sessionResponse, 201);
      const sessionId = sessionResponse.body.sessionId;

      // Multiple agents try to accept handoff simultaneously
      const client2 = globalThis.testEnvironment.createTestClient();

      const [accept1, accept2] = await Promise.allSettled([
        client.post(`/api/auth/sessions/${sessionId}/accept`, {
          agentId: 'agent-b',
        }),
        client2.post(`/api/auth/sessions/${sessionId}/accept`, {
          agentId: 'agent-c',
        }),
      ]);

      // One should succeed, one should fail
      const results = [accept1, accept2];
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 200);
      const failed = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 409);

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const client = globalThis.testEnvironment.createTestClient();

      // Make rapid authentication attempts
      const promises = Array.from({ length: 20 }, () =>
        client.post('/api/auth/api-keys', {
          name: 'Test Key',
          permissions: ['read'],
        })
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Rate limited responses should include retry-after header
      for (const response of rateLimited) {
        assertions.assertRateLimited(response);
      }
    });

    it('should reset rate limits after timeout', async () => {
      // Trigger rate limit
      const promises = Array.from({ length: 10 }, () =>
        client.post('/api/auth/api-keys', {
          name: 'Test Key',
          permissions: ['read'],
        })
      );

      await Promise.all(promises);

      // Wait for rate limit reset (shorter timeout for testing)
      await mockData.delay(2000);

      // Should be able to make requests again
      const response = await client.post('/api/auth/api-keys', {
        name: 'After Reset Key',
        permissions: ['read'],
      });

      // Should succeed (not be rate limited)
      expect(response.statusCode).not.toBe(429);
    });
  });
});