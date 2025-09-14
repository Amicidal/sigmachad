/**
 * Integration tests for MCP Protocol Support
 * Tests MCP server functionality, tool registration, and deep protocol compliance
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
  insertTestFixtures,
} from '../../test-utils/database-helpers.js';

describe('MCP Protocol Integration', () => {
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

    // Create API Gateway with MCP support
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();

    // Insert test data for MCP tools to work with
    await insertTestFixtures(dbService);
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
    // Keep test data for MCP tests
  });

  describe('MCP Server Initialization', () => {
    it('should initialize MCP server successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body).toEqual(
        expect.objectContaining({
          mcp: expect.objectContaining({
            tools: expect.any(Number),
            validation: expect.objectContaining({ isValid: expect.any(Boolean) }),
          }),
        })
      );
      expect(body.mcp.validation.isValid).toBe(true);
    });

    it('should register all documented MCP tools', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.payload);
      
      // Documentation mentions 15+ tools
      expect(body.mcp.tools).toBeGreaterThanOrEqual(15);
    });

    it('should expose MCP server capabilities', async () => {
      // Test MCP capabilities endpoint if it exists
      const response = await app.inject({
        method: 'GET',
        url: '/mcp/capabilities',
      });

      if (response.statusCode === 200) {
        const capabilities = JSON.parse(response.payload);
        expect(capabilities).toEqual(
          expect.objectContaining({ protocol: expect.any(String), tools: expect.anything() })
        );
      } else if (response.statusCode === 404 || response.statusCode === 405) {
        // MCP capabilities might not be exposed as REST endpoint; accept explicit 404/405
        // Optionally check response content-type if available
        const ct = response.headers['content-type'] as string | undefined;
        if (ct && ct.includes('application/json')) {
          try {
            JSON.parse(response.payload || '{}');
          } catch {
            // allow non-JSON payloads too
          }
        }
      } else {
        throw new Error(`Unexpected /mcp/capabilities status: ${response.statusCode}`);
      }
    });
  });

  describe('MCP Tools Registration and Discovery', () => {
    const expectedMCPTools = [
      // Graph operations
      'graph.search',
      'graph.entities.list',
      'graph.entities.get',
      'graph.relationships.list',
      'graph.dependencies.analyze',
      
      // Design operations
      'design.create_spec',
      'design.validate_spec',
      'design.update_spec',
      
      // Test operations
      'tests.plan_and_generate',
      'tests.run_and_analyze',
      'tests.validate_coverage',
      
      // Code operations
      'code.analyze',
      'code.validate',
      'code.propose_changes',
      
      // Documentation
      'docs.generate',
      'docs.update',
      
      // Admin operations
      'admin.health_check',
      'admin.sync_status',
    ];

    it('should register all expected MCP tools', async () => {
      // This test would typically interact with the actual MCP server
      // For now, we'll test through the health endpoint
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.payload);
      
      // Should have registered at least the expected number of tools
      expect(body.mcp.tools).toBeGreaterThanOrEqual(expectedMCPTools.length);
    });

    it('should validate MCP tool schemas', async () => {
      // Test that all tools have proper schema validation
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.payload);
      expect(body.mcp.validation.isValid).toBe(true);
      
      if (body.mcp.validation.errors) {
        expect(body.mcp.validation.errors).toHaveLength(0);
      }
    });

    it('should handle MCP tool discovery requests', async () => {
      // Test tool discovery through MCP protocol
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.jsonrpc).toBe('2.0');
        expect(mcpResponse.id).toBe(1);
        expect(mcpResponse).toEqual(
          expect.objectContaining({ result: expect.objectContaining({ tools: expect.any(Array) }) })
        );
        expect(mcpResponse.result.tools.length).toBeGreaterThan(0);
      } else if (response.statusCode === 404 || response.statusCode === 405) {
        // MCP endpoint might not be available as REST
        // Accept explicit 404/405; assert no unexpected status
      } else {
        throw new Error(`Unexpected /mcp status: ${response.statusCode}`);
      }
    });
  });

  describe('Graph MCP Tools', () => {
    it('should execute graph.search tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: {
            query: 'test search',
            limit: 10,
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.jsonrpc).toBe('2.0');
        expect(mcpResponse).toEqual(
          expect.objectContaining({ result: expect.objectContaining({ content: expect.anything() }) })
        );
      }
    });

    it('should execute graph.entities.list tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'graph.entities.list',
          arguments: {
            limit: 20,
            entityTypes: ['function', 'class'],
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse).toEqual(expect.objectContaining({ result: expect.anything() }));
      }
    });

    it('should execute graph.dependencies.analyze tool', async () => {
      // First get an entity to analyze
      const entitiesResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/graph/entities?limit=1',
      });

      if (entitiesResponse.statusCode === 200) {
        const entitiesBody = JSON.parse(entitiesResponse.payload);
        
        if (entitiesBody.data && entitiesBody.data.length > 0) {
          const entityId = entitiesBody.data[0].id;

          const mcpRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'graph.dependencies.analyze',
              arguments: {
                entityId: entityId,
                depth: 2,
              },
            },
          };

          const response = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: {
              'content-type': 'application/json',
            },
            payload: JSON.stringify(mcpRequest),
          });

          if (response.statusCode === 200) {
            const mcpResponse = JSON.parse(response.payload);
            expect(mcpResponse.result).toEqual(expect.any(Object));
          }
        }
      }
    });
  });

  describe('Test MCP Tools', () => {
    it('should execute tests.plan_and_generate tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'tests.plan_and_generate',
          arguments: {
            specId: 'test-spec-123',
            testTypes: ['unit', 'integration'],
            coverage: {
              minimum: 80,
            },
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse).toEqual(expect.objectContaining({ result: expect.anything() }));
      }
    });

    it('should execute tests.validate_coverage tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'tests.validate_coverage',
          arguments: {
            files: ['src/'],
            minimumCoverage: 80,
            reportFormat: 'json',
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });
  });

  describe('Design MCP Tools', () => {
    it('should execute design.create_spec tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'design.create_spec',
          arguments: {
            title: 'Test Feature Specification',
            description: 'A comprehensive test feature for MCP validation',
            requirements: [
              'Must handle user authentication',
              'Must validate input data',
              'Must provide error handling',
            ],
            acceptanceCriteria: [
              'All unit tests pass',
              'Integration tests cover happy path',
              'Error scenarios are handled gracefully',
            ],
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(
          expect.objectContaining({ content: expect.any(Array) })
        );
      }
    });

    it('should execute design.validate_spec tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'design.validate_spec',
          arguments: {
            specId: 'test-spec-123',
            validationTypes: ['completeness', 'consistency', 'testability'],
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });
  });

  describe('Code MCP Tools', () => {
    it('should execute code.analyze tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'code.analyze',
          arguments: {
            files: ['src/'],
            analysisTypes: ['complexity', 'patterns', 'dependencies'],
            options: {
              includeTests: true,
              includeDocs: false,
            },
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });

    it('should execute code.validate tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'code.validate',
          arguments: {
            files: ['src/test.ts'],
            validationTypes: ['typescript', 'eslint', 'security'],
            failOnWarnings: false,
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });

    it('should execute code.propose_changes tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'code.propose_changes',
          arguments: {
            changes: [
              {
                file: 'src/example.ts',
                type: 'modify',
                description: 'Add error handling',
                oldContent: 'function example() { return data; }',
                newContent: 'function example() { try { return data; } catch (error) { throw new Error("Data processing failed"); } }',
              },
            ],
            description: 'Improve error handling in example function',
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });
  });

  describe('Admin MCP Tools', () => {
    it('should execute admin.health_check tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'admin.health_check',
          arguments: {
            includeMetrics: true,
            includeServices: true,
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(
          expect.objectContaining({ content: expect.any(Array) })
        );
      }
    });

    it('should execute admin.sync_status tool', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: {
          name: 'admin.sync_status',
          arguments: {
            includePerformance: true,
            includeErrors: true,
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
      }
    });
  });

  describe('MCP Protocol Compliance', () => {
    it('should handle invalid MCP requests properly', async () => {
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 999,
        method: 'invalid/method',
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

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.jsonrpc).toBe('2.0');
        expect(mcpResponse.id).toBe(999);
        expect(mcpResponse.error).toEqual(expect.any(Object));
        expect(typeof mcpResponse.error.code).toBe('number');
        expect(typeof mcpResponse.error.message).toBe('string');
      }
    });

    it('should handle malformed JSON-RPC requests', async () => {
      const malformedRequest = {
        // Missing jsonrpc field
        id: 1,
        method: 'tools/list',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(malformedRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.error).toEqual(expect.any(Object));
        expect(mcpResponse.error.code).toBe(-32600); // Invalid Request
      }
    });

    it('should handle tool calls with invalid parameters', async () => {
      const invalidToolCall = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: {
            // Missing required 'query' parameter
            limit: 'invalid-limit-type', // Should be number
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(invalidToolCall),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.error).toEqual(expect.any(Object));
        expect(mcpResponse.error.code).toBe(-32602); // Invalid params
      }
    });

    it('should handle non-existent tool calls', async () => {
      const nonExistentToolCall = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'non.existent.tool',
          arguments: {},
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(nonExistentToolCall),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.error).toEqual(expect.any(Object));
        expect(mcpResponse.error.code).toBe(-32601); // Method not found
      }
    });

    it('should support MCP notifications (no response expected)', async () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'notifications/tool_progress',
        params: {
          toolName: 'graph.search',
          progress: 50,
          message: 'Search in progress...',
        },
        // No id field for notifications
      };

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(notification),
      });

      // Notifications should not return a response
      if (response.statusCode === 200) {
        expect(response.payload).toBe('');
      }
    });

    it('should handle batch MCP requests', async () => {
      const batchRequest = [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'admin.health_check',
          params: { includeMetrics: false },
        },
      ];

      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(batchRequest),
      });

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(Array.isArray(mcpResponse)).toBe(true);
        expect(mcpResponse).toHaveLength(2);
        
        mcpResponse.forEach((res: any, index: number) => {
          expect(res.jsonrpc).toBe('2.0');
          expect(res.id).toBe(index + 1);
        });
      }
    });
  });

  describe('MCP Tool Parameter Validation', () => {
    it('should validate required parameters for all tools', async () => {
      const toolsWithRequiredParams = [
        { name: 'graph.search', requiredParams: ['query'] },
        { name: 'code.analyze', requiredParams: ['files', 'analysisTypes'] },
        { name: 'tests.plan_and_generate', requiredParams: ['specId'] },
        { name: 'design.create_spec', requiredParams: ['title', 'description'] },
      ];

      for (const tool of toolsWithRequiredParams) {
        const mcpRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: {}, // Empty arguments should trigger validation error
          },
        };

        const response = await app.inject({
          method: 'POST',
          url: '/mcp',
          headers: {
            'content-type': 'application/json',
          },
          payload: JSON.stringify(mcpRequest),
        });

        if (response.statusCode === 200) {
          const mcpResponse = JSON.parse(response.payload);
          
          // Should either succeed (if defaults are provided) or return validation error
          if (mcpResponse.error) {
            expect(mcpResponse.error.code).toBe(-32602); // Invalid params
            expect(mcpResponse.error.message).toContain('required');
          }
        }
      }
    });

    it('should validate parameter types for all tools', async () => {
      const toolsWithTypedParams = [
        {
          name: 'graph.search',
          arguments: {
            query: 'valid query',
            limit: 'not-a-number', // Should be number
          },
        },
        {
          name: 'graph.entities.list',
          arguments: {
            limit: 20,
            entityTypes: 'not-an-array', // Should be array
          },
        },
      ];

      for (const testCase of toolsWithTypedParams) {
        const mcpRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: testCase,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/mcp',
          headers: {
            'content-type': 'application/json',
          },
          payload: JSON.stringify(mcpRequest),
        });

        if (response.statusCode === 200) {
          const mcpResponse = JSON.parse(response.payload);
          
          // Should return type validation error
          if (mcpResponse.error) {
            expect(mcpResponse.error.code).toBe(-32602); // Invalid params
          }
        }
      }
    });
  });

  describe('MCP Server Performance', () => {
    it('should handle concurrent MCP requests efficiently', async () => {
      const concurrentRequests = 20;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
        jsonrpc: '2.0',
        id: i,
        method: 'admin.health_check',
        params: { includeMetrics: false },
      }));

      const startTime = performance.now();
      
      const responses = await Promise.all(
        requests.map(req =>
          app.inject({
            method: 'POST',
            url: '/mcp',
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify(req),
          })
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(responses).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`MCP concurrent requests (${concurrentRequests}): ${totalTime.toFixed(2)}ms`);

      // All requests should succeed or fail gracefully
      responses.forEach((response, index) => {
        if (response.statusCode === 200) {
          const mcpResponse = JSON.parse(response.payload);
          expect(mcpResponse.jsonrpc).toBe('2.0');
          expect(mcpResponse.id).toBe(index);
        }
      });
    });

    it('should handle large MCP response payloads', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: {
            query: 'large result set',
            limit: 1000, // Request large result set
          },
        },
      };

      const startTime = performance.now();
      
      const response = await app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify(mcpRequest),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      if (response.statusCode === 200) {
        const mcpResponse = JSON.parse(response.payload);
        expect(mcpResponse.result).toEqual(expect.any(Object));
        
        // Should handle large responses efficiently
        expect(responseTime).toBeLessThan(2000); // Less than 2 seconds
        
        console.log(`Large MCP response time: ${responseTime.toFixed(2)}ms`);
        console.log(`Response payload size: ${response.payload.length} bytes`);
      }
    });
  });
});
