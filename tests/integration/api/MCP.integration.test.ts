/**
 * Integration tests for MCP (Model Context Protocol) server
 * Tests MCP server initialization, tool registration, protocol compliance,
 * and tool execution capabilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/core/DatabaseService.js';
import { MCPRouter } from '../../../src/api/mcp-router.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  insertTestFixtures,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('MCP Server Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;
  let mcpRouter: MCPRouter;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Get MCP router instance (this is a bit of a hack, but needed for testing)
    mcpRouter = (apiGateway as any).mcpRouter;

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
      expect(validation).toEqual(
        expect.objectContaining({
          isValid: expect.any(Boolean),
          errors: expect.any(Array),
        })
      );
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
      expect(body).toEqual(
        expect.objectContaining({ tools: expect.any(Array) })
      );

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
      const toolNames = body.tools.map((tool: any) => tool.name);

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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; basic invocation requires implementation');
      }
      // Valid arguments should succeed deterministically
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));
      } else if (response.statusCode === 400) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
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

          if (response.statusCode === 404) {
            throw new Error('MCP endpoint missing; batch invocation requires implementation');
          }
          // With valid entityId, expect success
          expect(response.statusCode).toBe(200);

          if (response.statusCode === 200) {
            const body = JSON.parse(response.payload);
            expect(body).toEqual(
              expect.objectContaining({
                result: expect.anything(),
              })
            );
          } else if (response.statusCode === 400) {
            const body = JSON.parse(response.payload || '{}');
            expect(body).toHaveProperty('error');
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; invalid tool handling requires implementation');
      }
      // Valid spec creation should succeed
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(
          expect.objectContaining({
            result: expect.objectContaining({ specId: expect.any(String) }),
          })
        );
      } else if (response.statusCode === 400) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; invalid input test requires implementation');
      }
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; invalid structure test requires implementation');
      }
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; tool discovery requires implementation');
      }
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ jsonrpc: '2.0', id: 1 }));
        expect(body.result).toEqual(
          expect.objectContaining({
            protocolVersion: expect.any(String),
            capabilities: expect.any(Object),
            serverInfo: expect.any(Object),
          })
        );
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; tool info requires implementation');
      }
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.any(Object));
        expect(body.jsonrpc).toBe('2.0');
        expect(body.id).toBe(2);
        expect(body.result).toEqual(expect.any(Object));
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; execution error cases require implementation');
      }
      // Valid tool call should succeed
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(expect.any(Object));
      expect(body.jsonrpc).toBe('2.0');
      expect(body.id).toBe(3);

      if (response.statusCode === 200) {
        expect(body.result).toEqual(expect.any(Object));
      } else {
        expect(body.error).toEqual(expect.any(Object));
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

      // Invalid JSON-RPC should be rejected
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(expect.any(Object));

      if (body.error) {
        expect(body.error).toEqual(
          expect.objectContaining({ code: expect.any(Number), message: expect.any(String) })
        );
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

      body.tools.forEach((tool: any) => {
        expect(tool).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
            inputSchema: expect.objectContaining({
              type: 'object',
              properties: expect.any(Object),
            }),
          })
        );
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; streaming requires implementation');
      }
      // Valid direct tool call should succeed
      expect(response.statusCode).toBe(200);
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; auth scenarios require implementation');
      }
      // Invalid/edge arguments should be rejected with a client error
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(expect.any(Object));

      // Either successful result or error response
      if (body.error) {
        expect(body.error).toEqual(expect.objectContaining({ code: expect.anything(), message: expect.any(String) }));
      } else {
        expect(body.result).toEqual(expect.any(Object));
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
      expect(body).toEqual(expect.any(Object));
        expect(body.error).toEqual(expect.any(Object));
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

      if (response.statusCode === 404) {
        throw new Error('MCP endpoint missing; malformed request test requires implementation');
      }
      expect(response.statusCode).toBe(400);
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

        requests.push(
          app.inject({
            method: 'POST',
            url: '/mcp',
            headers: {
              'content-type': 'application/json',
            },
            payload: JSON.stringify(toolRequest),
          })
        );
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

        if (response.statusCode === 404) {
          throw new Error('MCP endpoint missing; concurrent requests require implementation');
        }
        expect(response.statusCode).toBe(200);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (allowing for network/database latency)
      expect(duration).toBeLessThan(5000); // 5 seconds max for 10 requests
    });
  });
});
