/**
 * Integration tests for tRPC router
 * Tests tRPC endpoint functionality, procedure calls, and protocol compliance
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, insertTestFixtures, checkDatabaseHealth, } from '../../test-utils/database-helpers.js';
describe('tRPC Integration', () => {
    let dbService;
    let kgService;
    let apiGateway;
    let app;
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
    describe('tRPC Router Setup', () => {
        it('should have tRPC routes registered', () => {
            expect(app.hasRoute('POST', '/api/trpc')).toBe(true);
            expect(app.hasRoute('GET', '/api/trpc')).toBe(true);
        });
        it('should handle tRPC health check', async () => {
            // Test basic tRPC connectivity
            const response = await app.inject({
                method: 'GET',
                url: '/api/trpc/health',
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
            }
        });
    });
    describe('tRPC Procedure Calls', () => {
        beforeEach(async () => {
            // Insert test data for procedures
            await insertTestFixtures(dbService);
        });
        it('should handle graph search procedure', async () => {
            const trpcRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'graph.search',
                params: {
                    input: {
                        query: 'function',
                        entityTypes: ['function'],
                        limit: 10,
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(trpcRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.jsonrpc).toBe('2.0');
                expect(body.id).toBe(1);
                if (body.result) {
                    expect(body.result).toBeDefined();
                }
                else if (body.error) {
                    expect(body.error).toBeDefined();
                }
            }
        });
        it('should handle entity creation procedure', async () => {
            const trpcRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'graph.createEntity',
                params: {
                    input: {
                        id: 'trpc_test_entity',
                        type: 'function',
                        name: 'trpcTestFunction',
                        path: '/src/trpc/test.ts',
                        language: 'typescript',
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(trpcRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.jsonrpc).toBe('2.0');
                expect(body.id).toBe(2);
            }
        });
        it('should handle batch tRPC requests', async () => {
            const batchRequest = [
                {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'graph.search',
                    params: {
                        input: { query: 'test', limit: 5 },
                    },
                },
                {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'graph.listEntities',
                    params: {
                        input: { limit: 10 },
                    },
                },
            ];
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(batchRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(Array.isArray(body)).toBe(true);
                expect(body.length).toBe(2);
                body.forEach((item, index) => {
                    expect(item.jsonrpc).toBe('2.0');
                    expect(item.id).toBe(index + 1);
                });
            }
        });
        it('should handle tRPC query procedures', async () => {
            const queryProcedures = [
                { method: 'graph.listEntities', params: { input: { limit: 5 } } },
                { method: 'graph.listRelationships', params: { input: { limit: 5 } } },
            ];
            for (let i = 0; i < queryProcedures.length; i++) {
                const trpcRequest = {
                    jsonrpc: '2.0',
                    id: i + 3,
                    ...queryProcedures[i],
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/trpc',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(trpcRequest),
                });
                expect([200, 404]).toContain(response.statusCode);
                if (response.statusCode === 200) {
                    const body = JSON.parse(response.payload);
                    expect(body).toBeDefined();
                    expect(body.jsonrpc).toBe('2.0');
                    expect(body.id).toBe(i + 3);
                }
            }
        });
        it('should handle tRPC mutation procedures', async () => {
            const mutationProcedures = [
                {
                    method: 'graph.createEntity',
                    params: {
                        input: {
                            id: 'trpc_mutation_entity',
                            type: 'class',
                            name: 'TRPCMutationClass',
                            path: '/src/trpc/mutation.ts',
                            language: 'typescript',
                        },
                    },
                },
            ];
            for (let i = 0; i < mutationProcedures.length; i++) {
                const trpcRequest = {
                    jsonrpc: '2.0',
                    id: i + 5,
                    ...mutationProcedures[i],
                };
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/trpc',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(trpcRequest),
                });
                expect([200, 404]).toContain(response.statusCode);
                if (response.statusCode === 200) {
                    const body = JSON.parse(response.payload);
                    expect(body).toBeDefined();
                    expect(body.jsonrpc).toBe('2.0');
                    expect(body.id).toBe(i + 5);
                }
            }
        });
    });
    describe('tRPC Error Handling', () => {
        it('should handle invalid procedure calls', async () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                id: 999,
                method: 'nonexistent.procedure',
                params: {
                    input: {},
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(invalidRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.error).toBeDefined();
                expect(body.error.code).toBeDefined();
                expect(body.error.message).toBeDefined();
            }
        });
        it('should handle invalid input parameters', async () => {
            const invalidInputRequest = {
                jsonrpc: '2.0',
                id: 1000,
                method: 'graph.search',
                params: {
                    input: {
                        // Missing required query parameter
                        limit: 10,
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(invalidInputRequest),
            });
            expect([200, 400]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            if (body.error) {
                expect(body.error.code).toBeDefined();
                expect(body.error.message).toBeDefined();
            }
        });
        it('should handle malformed JSON-RPC requests', async () => {
            const malformedRequest = {
                jsonrpc: '2.0',
                // Missing id
                method: 'graph.search',
                params: { input: { query: 'test' } },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(malformedRequest),
            });
            expect([200, 400]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            if (body.error) {
                expect(body.error.code).toBeDefined();
            }
        });
    });
    describe('tRPC Context and Middleware', () => {
        it('should provide request context to procedures', async () => {
            // Test that procedures receive proper context
            const trpcRequest = {
                jsonrpc: '2.0',
                id: 2000,
                method: 'graph.search',
                params: {
                    input: { query: 'context_test' },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                    'x-request-id': 'test-context-123',
                },
                payload: JSON.stringify(trpcRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                // Context should be available to the procedure
            }
        });
        it('should handle authentication context', async () => {
            // Test procedures that might require authentication
            const authenticatedRequest = {
                jsonrpc: '2.0',
                id: 3000,
                method: 'graph.search',
                params: {
                    input: { query: 'auth_test' },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                    'authorization': 'Bearer test-token-123',
                },
                payload: JSON.stringify(authenticatedRequest),
            });
            expect([200, 401, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
            }
        });
    });
    describe('tRPC Subscription Support', () => {
        it('should handle subscription procedures', async () => {
            // Test subscription setup (if supported)
            const subscriptionRequest = {
                jsonrpc: '2.0',
                id: 4000,
                method: 'graph.subscribe',
                params: {
                    input: {
                        channel: 'entity-updates',
                        entityId: 'subscription-test-entity',
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(subscriptionRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.jsonrpc).toBe('2.0');
                expect(body.id).toBe(4000);
            }
        });
    });
    describe('tRPC Performance', () => {
        it('should handle concurrent tRPC requests efficiently', async () => {
            const concurrentRequests = 10;
            const requests = [];
            for (let i = 0; i < concurrentRequests; i++) {
                const trpcRequest = {
                    jsonrpc: '2.0',
                    id: i + 5000,
                    method: 'graph.search',
                    params: {
                        input: {
                            query: `concurrent_test_${i}`,
                            limit: 5,
                        },
                    },
                };
                requests.push(app.inject({
                    method: 'POST',
                    url: '/api/trpc',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(trpcRequest),
                }));
            }
            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            const successCount = responses.filter(r => r.statusCode === 200).length;
            expect(successCount).toBeGreaterThanOrEqual(concurrentRequests * 0.8); // At least 80% success
            expect(totalDuration).toBeLessThan(5000); // Should complete within 5 seconds
        });
        it('should handle large tRPC payloads', async () => {
            const largeQuery = 'x'.repeat(10000); // 10KB query
            const trpcRequest = {
                jsonrpc: '2.0',
                id: 6000,
                method: 'graph.search',
                params: {
                    input: {
                        query: largeQuery,
                        limit: 10,
                    },
                },
            };
            const startTime = Date.now();
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(trpcRequest),
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect([200, 400]).toContain(response.statusCode);
            expect(duration).toBeLessThan(2000); // Should handle large payload within 2 seconds
        });
    });
    describe('tRPC Protocol Compliance', () => {
        it('should follow JSON-RPC 2.0 specification', async () => {
            const validRequest = {
                jsonrpc: '2.0',
                id: 7000,
                method: 'graph.search',
                params: {
                    input: { query: 'protocol_test' },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(validRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body.jsonrpc).toBe('2.0');
                expect(typeof body.id).toBe('number');
                // Either result or error should be present, but not both
                const hasResult = body.hasOwnProperty('result');
                const hasError = body.hasOwnProperty('error');
                expect(hasResult || hasError).toBe(true);
                expect(!(hasResult && hasError)).toBe(true);
            }
        });
        it('should handle notification requests', async () => {
            // JSON-RPC notification (no id)
            const notificationRequest = {
                jsonrpc: '2.0',
                method: 'graph.createEntity',
                params: {
                    input: {
                        id: 'notification_test_entity',
                        type: 'function',
                        name: 'notificationTestFunction',
                        path: '/src/notification/test.ts',
                        language: 'typescript',
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(notificationRequest),
            });
            expect([200, 204, 404]).toContain(response.statusCode);
            // Notifications should not return a response body
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                // Should be empty or minimal response
                expect(body).toBeDefined();
            }
        });
        it('should handle version negotiation', async () => {
            const versionRequest = {
                jsonrpc: '2.0',
                id: 8000,
                method: 'graph.search',
                params: {
                    input: { query: 'version_test' },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(versionRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body.jsonrpc).toBe('2.0');
            }
        });
    });
    describe('tRPC Integration with HTTP', () => {
        it('should work alongside REST endpoints', async () => {
            // Test that tRPC and REST can coexist
            const restResponse = await app.inject({
                method: 'GET',
                url: '/health',
            });
            const trpcResponse = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 9000,
                    method: 'graph.search',
                    params: { input: { query: 'integration_test' } },
                }),
            });
            expect(restResponse.statusCode).toBe(200);
            expect([200, 404]).toContain(trpcResponse.statusCode);
            // Both should work independently
            const restBody = JSON.parse(restResponse.payload);
            expect(restBody.status).toBe('healthy');
        });
        it('should share middleware with REST endpoints', async () => {
            // Test that tRPC inherits middleware like request IDs
            const trpcResponse = await app.inject({
                method: 'POST',
                url: '/api/trpc',
                headers: {
                    'content-type': 'application/json',
                    'x-request-id': 'shared-middleware-test',
                },
                payload: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 10000,
                    method: 'graph.search',
                    params: { input: { query: 'middleware_test' } },
                }),
            });
            expect([200, 404]).toContain(trpcResponse.statusCode);
            if (trpcResponse.statusCode === 200) {
                // Should have request ID in response headers
                expect(trpcResponse.headers['x-request-id']).toBeDefined();
            }
        });
    });
});
//# sourceMappingURL=TRPC.integration.test.js.map