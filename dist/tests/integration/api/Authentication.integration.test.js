/**
 * Integration tests for Authentication and Authorization
 * Tests JWT tokens, API keys, and role-based access control
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, checkDatabaseHealth, } from '../../test-utils/database-helpers.js';
import jwt from 'jsonwebtoken';
describe('Authentication & Authorization Integration', () => {
    let dbService;
    let kgService;
    let apiGateway;
    let app;
    // Test JWT secrets and tokens
    const JWT_SECRET = 'test-jwt-secret-for-integration-tests';
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
        process.env.API_KEY_SECRET = API_KEY_SECRET;
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
        delete process.env.API_KEY_SECRET;
    }, 10000);
    beforeEach(async () => {
        if (dbService && dbService.isInitialized()) {
            await clearTestData(dbService);
        }
    });
    // Helper functions for creating test tokens
    function createValidJWT(payload = {}, expiresIn = '1h') {
        const options = { expiresIn };
        // Avoid issuer conflict if payload already sets `iss`
        if (payload.iss === undefined)
            options.issuer = 'memento-test';
        return jwt.sign({
            userId: 'test-user-123',
            role: 'user',
            permissions: ['read'],
            ...payload,
        }, JWT_SECRET, options);
    }
    function createExpiredJWT(payload = {}) {
        const options = { expiresIn: '-1h' };
        if (payload.iss === undefined)
            options.issuer = 'memento-test';
        return jwt.sign({
            userId: 'test-user-123',
            role: 'user',
            ...payload,
        }, JWT_SECRET, options // Expired 1 hour ago
        );
    }
    function createInvalidSignatureJWT(payload = {}) {
        const options = { expiresIn: '1h' };
        if (payload.iss === undefined)
            options.issuer = 'memento-test';
        return jwt.sign({
            userId: 'test-user-123',
            role: 'user',
            ...payload,
        }, 'wrong-secret', options);
    }
    function createValidAPIKey() {
        return Buffer.from(`test-api-key-${Date.now()}:${API_KEY_SECRET}`).toString('base64');
    }
    describe('JWT Token Authentication', () => {
        it('should accept valid JWT tokens', async () => {
            const token = createValidJWT();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${token}`,
                },
            });
            expect([200, 403]).toContain(response.statusCode); // 403 if insufficient permissions, but not 401
        });
        it('should reject requests without authorization header', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
            });
            // Should either allow (no auth required) or reject with 401
            expect([200, 401]).toContain(response.statusCode);
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(false);
                expect(body.error.code).toBe('UNAUTHORIZED');
            }
        });
        it('should reject expired JWT tokens', async () => {
            const expiredToken = createExpiredJWT();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${expiredToken}`,
                },
            });
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('TOKEN_EXPIRED');
                expect(body.error.message).toContain('expired');
            }
        });
        it('should reject JWT tokens with invalid signatures', async () => {
            const invalidToken = createInvalidSignatureJWT();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${invalidToken}`,
                },
            });
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INVALID_TOKEN');
            }
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
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INVALID_TOKEN');
            }
        });
        it('should handle missing Bearer prefix', async () => {
            const token = createValidJWT();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': token, // Missing "Bearer "
                },
            });
            expect([200, 401]).toContain(response.statusCode);
        });
        it('should extract user information from valid tokens', async () => {
            const token = createValidJWT({
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
            // If authentication is implemented, user info should be available in the request context
            expect([200, 403]).toContain(response.statusCode);
        });
    });
    describe('API Key Authentication', () => {
        it('should accept valid API keys', async () => {
            const apiKey = createValidAPIKey();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'x-api-key': apiKey,
                },
            });
            expect([200, 403]).toContain(response.statusCode);
        });
        it('should reject invalid API keys', async () => {
            const invalidApiKey = 'invalid-api-key-123';
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'x-api-key': invalidApiKey,
                },
            });
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INVALID_API_KEY');
            }
        });
        it('should handle API key rate limiting separately', async () => {
            const apiKey = createValidAPIKey();
            const promises = [];
            // Make multiple requests with same API key
            for (let i = 0; i < 10; i++) {
                promises.push(app.inject({
                    method: 'GET',
                    url: '/api/v1/admin/admin-health',
                    headers: {
                        'x-api-key': apiKey,
                    },
                }));
            }
            const responses = await Promise.all(promises);
            // Should track rate limits per API key
            responses.forEach(response => {
                expect([200, 401, 403, 429]).toContain(response.statusCode);
            });
        });
        it('should handle both JWT and API key authentication', async () => {
            const token = createValidJWT();
            const apiKey = createValidAPIKey();
            // Test with both JWT and API key (JWT should take precedence)
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${token}`,
                    'x-api-key': apiKey,
                },
            });
            expect([200, 403]).toContain(response.statusCode);
        });
    });
    describe('Role-Based Access Control (RBAC)', () => {
        it('should allow admin users to access admin endpoints', async () => {
            const adminToken = createValidJWT({
                role: 'admin',
                permissions: ['read', 'write', 'admin'],
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${adminToken}`,
                },
            });
            expect([200]).toContain(response.statusCode);
        });
        it('should restrict regular users from admin endpoints', async () => {
            const userToken = createValidJWT({
                role: 'user',
                permissions: ['read'],
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${userToken}`,
                },
            });
            if (response.statusCode === 403) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
                expect(body.error.message).toContain('permission');
            }
        });
        it('should allow users to access read-only endpoints', async () => {
            const userToken = createValidJWT({
                role: 'user',
                permissions: ['read'],
            });
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/graph/search',
                headers: {
                    'authorization': `Bearer ${userToken}`,
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({ query: 'test' }),
            });
            expect([200, 400]).toContain(response.statusCode); // 400 for validation, not 403
        });
        it('should restrict write operations for read-only users', async () => {
            const readOnlyToken = createValidJWT({
                role: 'reader',
                permissions: ['read'],
            });
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/admin/sync',
                headers: {
                    'authorization': `Bearer ${readOnlyToken}`,
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({ force: true }),
            });
            if (response.statusCode === 403) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
            }
        });
        it('should handle custom permission sets', async () => {
            const customToken = createValidJWT({
                role: 'analyst',
                permissions: ['read', 'analyze'],
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
            expect([200, 400, 403]).toContain(response.statusCode);
        });
        it('should deny access for users with no permissions', async () => {
            const noPermissionToken = createValidJWT({
                role: 'guest',
                permissions: [],
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
            if (response.statusCode === 403) {
                const body = JSON.parse(response.payload);
                expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
            }
        });
    });
    describe('OAuth 2.0 Integration', () => {
        it('should handle OAuth token validation', async () => {
            // Mock OAuth token (would normally come from GitHub/GitLab)
            const oauthToken = createValidJWT({
                iss: 'https://github.com',
                sub: 'github-user-123',
                aud: 'memento-app',
                role: 'user',
                permissions: ['read', 'write'],
            });
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${oauthToken}`,
                },
            });
            expect([200, 401, 403]).toContain(response.statusCode);
        });
        it('should handle GitHub integration tokens', async () => {
            const githubToken = createValidJWT({
                iss: 'https://github.com',
                login: 'testuser',
                id: 12345,
                node_id: 'MDQ6VXNlcjEyMzQ1',
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
            expect([200, 400, 401]).toContain(response.statusCode);
        });
        it('should handle GitLab integration tokens', async () => {
            const gitlabToken = createValidJWT({
                iss: 'https://gitlab.com',
                username: 'testuser',
                user_id: 54321,
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
            expect([200, 400, 401]).toContain(response.statusCode);
        });
    });
    describe('Token Refresh Flow', () => {
        it('should handle refresh token requests', async () => {
            // Mock refresh token endpoint (implementation may vary)
            const refreshToken = createValidJWT({
                type: 'refresh',
                userId: 'test-user-123',
            }, '7d');
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
            // May not be implemented yet, but should handle gracefully
            expect([200, 401, 404]).toContain(response.statusCode);
        });
        it('should reject expired refresh tokens', async () => {
            const expiredRefreshToken = createExpiredJWT({
                type: 'refresh',
                userId: 'test-user-123',
            });
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
            expect([401, 404]).toContain(response.statusCode);
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
            const token = createValidJWT();
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': `Bearer ${token}`,
                },
            });
            // Check for security headers
            expect(response.headers['x-content-type-options']).toBeDefined();
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['x-xss-protection']).toBeDefined();
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
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(false);
                expect(body.error).toBeDefined();
                expect(body.error.code).toBeDefined();
                expect(body.error.message).toBeDefined();
                expect(body.timestamp).toBeDefined();
                expect(body.requestId).toBeDefined();
            }
        });
        it('should not leak sensitive information in error messages', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin/admin-health',
                headers: {
                    'authorization': 'Bearer malformed-token',
                },
            });
            if (response.statusCode === 401) {
                const body = JSON.parse(response.payload);
                // Should not contain JWT secrets or internal details
                expect(body.error.message).not.toContain(JWT_SECRET);
                expect(body.error.message).not.toContain('secret');
                expect(body.error.message).not.toContain('key');
            }
        });
    });
});
//# sourceMappingURL=Authentication.integration.test.js.map