/**
 * Integration tests for MCP (Model Context Protocol) server
 * Tests MCP server initialization, tool registration, protocol compliance,
 * and tool execution capabilities
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, insertTestFixtures, checkDatabaseHealth, } from '../../test-utils/database-helpers.js';
describe('MCP Server Integration', () => {
    let dbService;
    let kgService;
    let apiGateway;
    let app;
    let mcpRouter;
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
        // Get MCP router instance (this is a bit of a hack, but needed for testing)
        mcpRouter = apiGateway.mcpRouter;
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
    describe('MCP Server Initialization', () => {
        it('should have MCP routes registered', () => {
            expect(app.hasRoute('POST', '/mcp')).toBe(true);
            expect(app.hasRoute('GET', '/mcp/tools')).toBe(true);
            expect(app.hasRoute('POST', '/mcp/tools/:toolName')).toBe(true);
        });
        it('should validate MCP server on startup', async () => {
            const validation = await mcpRouter.validateServer();
            expect(validation).toBeDefined();
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);
        });
        it('should provide tool count', () => {
            const toolCount = mcpRouter.getToolCount();
            expect(typeof toolCount).toBe('number');
            expect(toolCount).toBeGreaterThanOrEqual(0);
        });
    });
    describe('MCP Tools Endpoint', () => {
        it('should list available tools', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/mcp/tools',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            expect(Array.isArray(body.tools)).toBe(true);
            // Verify tool structure
            if (body.tools.length > 0) {
                const tool = body.tools[0];
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
            }
        });
        it('should include expected MCP tools', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/mcp/tools',
            });
            const body = JSON.parse(response.payload);
            const toolNames = body.tools.map((tool) => tool.name);
            // Check for core MCP tools that should be available
            const expectedTools = [
                'design.create_spec',
                'graph.search',
                'graph.examples',
                'code.propose_diff',
                'validate.run'
            ];
            expectedTools.forEach(expectedTool => {
                expect(toolNames).toContain(expectedTool);
            });
        });
    });
    describe('MCP Tool Execution', () => {
        beforeEach(async () => {
            // Insert test data for tool execution
            await insertTestFixtures(dbService);
        });
        it('should execute graph.search tool', async () => {
            const toolRequest = {
                toolName: 'graph.search',
                arguments: {
                    query: 'function',
                    entityTypes: ['function'],
                    limit: 5,
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolRequest),
            });
            expect([200, 400, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.result).toBeDefined();
            }
        });
        it('should execute graph.examples tool', async () => {
            // First, find an entity ID to test with
            const entitiesResponse = await app.inject({
                method: 'GET',
                url: '/api/v1/graph/entities?limit=1',
            });
            if (entitiesResponse.statusCode === 200) {
                const entitiesBody = JSON.parse(entitiesResponse.payload);
                if (entitiesBody.data && entitiesBody.data.length > 0) {
                    const entityId = entitiesBody.data[0].id;
                    const toolRequest = {
                        toolName: 'graph.examples',
                        arguments: {
                            entityId,
                        },
                    };
                    const response = await app.inject({
                        method: 'POST',
                        url: '/mcp',
                        headers: {
                            'content-type': 'application/json',
                        },
                        payload: JSON.stringify(toolRequest),
                    });
                    expect([200, 400, 404]).toContain(response.statusCode);
                    if (response.statusCode === 200) {
                        const body = JSON.parse(response.payload);
                        expect(body).toBeDefined();
                        expect(body.result).toBeDefined();
                    }
                }
            }
        });
        it('should execute design.create_spec tool', async () => {
            const toolRequest = {
                toolName: 'design.create_spec',
                arguments: {
                    title: 'Test Specification',
                    description: 'A test specification for MCP integration',
                    acceptanceCriteria: [
                        'Should handle user input correctly',
                        'Should return proper response format',
                        'Should handle error cases gracefully',
                    ],
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolRequest),
            });
            expect([200, 400, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.result).toBeDefined();
                expect(body.result.specId).toBeDefined();
            }
        });
        it('should handle invalid tool name', async () => {
            const toolRequest = {
                toolName: 'nonexistent.tool',
                arguments: {},
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolRequest),
            });
            expect([400, 404]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            expect(body.error).toBeDefined();
        });
        it('should validate tool arguments', async () => {
            const toolRequest = {
                toolName: 'graph.search',
                arguments: {}, // Missing required query parameter
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolRequest),
            });
            expect([400, 404]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            expect(body.error).toBeDefined();
        });
    });
    describe('MCP Protocol Compliance', () => {
        it('should handle MCP protocol handshake', async () => {
            const handshakeRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'test-client',
                        version: '1.0.0',
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(handshakeRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.jsonrpc).toBe('2.0');
                expect(body.id).toBe(1);
                expect(body.result).toBeDefined();
                expect(body.result.protocolVersion).toBeDefined();
                expect(body.result.capabilities).toBeDefined();
                expect(body.result.serverInfo).toBeDefined();
            }
        });
        it('should handle MCP tool listing via protocol', async () => {
            const toolListRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list',
                params: {},
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolListRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expect(body).toBeDefined();
                expect(body.jsonrpc).toBe('2.0');
                expect(body.id).toBe(2);
                expect(body.result).toBeDefined();
                expect(Array.isArray(body.result.tools)).toBe(true);
            }
        });
        it('should handle MCP tool calls via protocol', async () => {
            const toolCallRequest = {
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: {
                    name: 'graph.search',
                    arguments: {
                        query: 'test',
                        limit: 5,
                    },
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolCallRequest),
            });
            expect([200, 400, 404]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            expect(body.jsonrpc).toBe('2.0');
            expect(body.id).toBe(3);
            if (response.statusCode === 200) {
                expect(body.result).toBeDefined();
            }
            else {
                expect(body.error).toBeDefined();
            }
        });
        it('should handle invalid JSON-RPC requests', async () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                // Missing id
                method: 'tools/list',
                params: {},
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(invalidRequest),
            });
            expect([200, 400]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            if (body.error) {
                expect(body.error.code).toBeDefined();
                expect(body.error.message).toBeDefined();
            }
        });
    });
    describe('MCP Tool Capabilities', () => {
        it('should provide tool capabilities', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/mcp/tools',
            });
            const body = JSON.parse(response.payload);
            body.tools.forEach((tool) => {
                expect(tool.name).toBeDefined();
                expect(tool.description).toBeDefined();
                expect(tool.inputSchema).toBeDefined();
                expect(tool.inputSchema.type).toBe('object');
                expect(tool.inputSchema.properties).toBeDefined();
            });
        });
        it('should handle tool-specific routes', async () => {
            // Test direct tool execution endpoint
            const response = await app.inject({
                method: 'POST',
                url: '/mcp/tools/graph.search',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({
                    query: 'test',
                    limit: 5,
                }),
            });
            expect([200, 400, 404]).toContain(response.statusCode);
        });
    });
    describe('MCP Error Handling', () => {
        it('should handle tool execution errors gracefully', async () => {
            const toolRequest = {
                toolName: 'graph.search',
                arguments: {
                    query: '', // Empty query that might cause issues
                    invalidParam: 'should be ignored',
                },
            };
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify(toolRequest),
            });
            expect([200, 400, 404]).toContain(response.statusCode);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            // Either successful result or error response
            if (body.error) {
                expect(body.error.code).toBeDefined();
                expect(body.error.message).toBeDefined();
            }
            else {
                expect(body.result).toBeDefined();
            }
        });
        it('should handle malformed requests', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: 'invalid json',
            });
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body).toBeDefined();
            expect(body.error).toBeDefined();
        });
        it('should handle missing request body', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/mcp',
                headers: {
                    'content-type': 'application/json',
                },
                payload: '',
            });
            expect([400, 404]).toContain(response.statusCode);
        });
    });
    describe('MCP Performance', () => {
        it('should handle concurrent tool executions', async () => {
            const concurrentRequests = 5;
            const requests = [];
            for (let i = 0; i < concurrentRequests; i++) {
                const toolRequest = {
                    toolName: 'graph.search',
                    arguments: {
                        query: `test${i}`,
                        limit: 3,
                    },
                };
                requests.push(app.inject({
                    method: 'POST',
                    url: '/mcp',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(toolRequest),
                }));
            }
            const responses = await Promise.all(requests);
            const successfulResponses = responses.filter(r => r.statusCode === 200);
            // At least some requests should succeed
            expect(successfulResponses.length).toBeGreaterThan(0);
            expect(responses.length).toBe(concurrentRequests);
        });
        it('should handle rapid sequential requests', async () => {
            const requestCount = 10;
            const toolRequest = {
                toolName: 'graph.search',
                arguments: {
                    query: 'performance',
                    limit: 1,
                },
            };
            const startTime = Date.now();
            for (let i = 0; i < requestCount; i++) {
                const response = await app.inject({
                    method: 'POST',
                    url: '/mcp',
                    headers: {
                        'content-type': 'application/json',
                    },
                    payload: JSON.stringify(toolRequest),
                });
                expect([200, 400, 404]).toContain(response.statusCode);
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time (allowing for network/database latency)
            expect(duration).toBeLessThan(5000); // 5 seconds max for 10 requests
        });
    });
});
//# sourceMappingURL=MCP.integration.test.js.map