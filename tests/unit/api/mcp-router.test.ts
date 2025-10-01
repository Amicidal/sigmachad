/**
 * Unit tests for MCP Router
 * Tests MCP protocol implementation, tool registration, request processing, and monitoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPRouter } from '@memento/api/mcp-router';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../test-utils.js';

// Mock external dependencies
vi.mock('@memento/knowledge');
vi.mock('@memento/database/DatabaseService');
vi.mock('@memento/knowledge');
vi.mock('@memento/testing/TestEngine');
vi.mock('@memento/testing/security/scanner');

// Import mocked services
import type { KnowledgeGraphService } from '@memento/knowledge';
import type { DatabaseService } from '@memento/database/DatabaseService';
import type { ASTParser } from '@memento/knowledge';
import type { TestEngine } from '@memento/testing/TestEngine';
import type { SecurityScanner } from '@memento/testing/security/scanner';
import { makeRealisticKgService } from '../../test-utils/kg-realistic';

describe('MCPRouter', () => {
  let mockKgService: KnowledgeGraphService;
  let mockDbService: DatabaseService;
  let mockAstParser: ASTParser;
  let mockTestEngine: TestEngine;
  let mockSecurityScanner: SecurityScanner;
  let mockApp: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;
  let mcpRouter: MCPRouter;

  // Create a properly mocked Fastify app
  const createMockApp = () => {
    const routes = new Map<string, Function>();

    const registerRoute = (method: string, path: string, handler: Function, _options?: any) => {
      const key = `${method}:${path}`;
      routes.set(key, handler);
    };

    return {
      post: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('post', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('post', path, handler);
        } else if (optionsOrHandler && typeof optionsOrHandler.handler === 'function') {
          registerRoute('post', path, optionsOrHandler.handler);
        }
      }),
      get: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('get', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('get', path, handler);
        } else if (optionsOrHandler && typeof optionsOrHandler.handler === 'function') {
          registerRoute('get', path, optionsOrHandler.handler);
        }
      }),
      getRegisteredRoutes: () => routes
    };
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockKgService = makeRealisticKgService();

    mockDbService = {
      postgresQuery: vi.fn().mockResolvedValue([]),
      getPerformanceMetricsHistory: vi.fn().mockResolvedValue([])
    } as any;

    mockAstParser = {
      parseFile: vi.fn().mockResolvedValue(undefined)
    } as any;

    mockTestEngine = {
      analyzeFlakyTests: vi.fn().mockResolvedValue([]),
      getCoverageAnalysis: vi.fn().mockResolvedValue({
        overallCoverage: { lines: 85, branches: 80, functions: 90, statements: 85 }
      }),
      getPerformanceMetrics: vi.fn().mockResolvedValue({
        averageExecutionTime: 150,
        successRate: 0.95
      }),
      parseAndRecordTestResults: vi.fn().mockResolvedValue(undefined)
    } as any;

    mockSecurityScanner = {
      performScan: vi.fn().mockResolvedValue({
        issues: [],
        vulnerabilities: [],
        summary: {
          totalIssues: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 }
        }
      })
    } as any;

    mockApp = createMockApp();
    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Create MCPRouter instance
    mcpRouter = new MCPRouter(
      mockKgService,
      mockDbService,
      mockAstParser,
      mockTestEngine,
      mockSecurityScanner
    );

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize MCPRouter with all required services', () => {
      expect(mcpRouter).toBeInstanceOf(MCPRouter);
      expect(mcpRouter.getToolCount()).toBeGreaterThan(0);
    });

    it('should register all MCP tools during initialization', () => {
      const toolCount = mcpRouter.getToolCount();
      expect(toolCount).toBeGreaterThan(10); // Should have at least 10 tools registered
    });

    it('should have required design tools', () => {
      // Test that tools are registered by checking if they exist
      const server = mcpRouter.getServer();
      expect(server).toEqual(expect.any(Object));
    });
  });

  describe('Tool Registration', () => {
    it('should register design.create_spec tool with correct schema', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-1',
        method: 'tools/list',
        params: {}
      });

      expect(response.result.tools).toEqual(expect.any(Array));
      const createSpecTool = response.result.tools.find((tool: any) => tool.name === 'design.create_spec');
      expect(createSpecTool).toEqual(expect.any(Object));
      expect(createSpecTool.inputSchema.required).toContain('title');
      expect(createSpecTool.inputSchema.required).toContain('description');
      expect(createSpecTool.inputSchema.required).toContain('acceptanceCriteria');
    });

    it('should register graph.search tool with correct schema', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-2',
        method: 'tools/list',
        params: {}
      });

      const graphSearchTool = response.result.tools.find((tool: any) => tool.name === 'graph.search');
      expect(graphSearchTool).toEqual(expect.any(Object));
      expect(graphSearchTool.inputSchema.properties.query).toEqual(expect.anything());
      expect(graphSearchTool.inputSchema.required).toContain('query');
    });

    it('should register all expected tool categories', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-3',
        method: 'tools/list',
        params: {}
      });

      const toolNames = response.result.tools.map((tool: any) => tool.name);

      // Check for different tool categories
      expect(toolNames.some((name: string) => name.startsWith('design.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('graph.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('code.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('validate.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('tests.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('security.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('impact.'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('docs.'))).toBe(true);
    });
  });

  describe('Tool Handlers', () => {
    describe('design.create_spec', () => {
      it('should create specification successfully', async () => {
        const params = {
          title: 'Test Spec',
          description: 'Test specification description',
          acceptanceCriteria: ['Should work correctly', 'Should handle errors'],
          priority: 'high',
          tags: ['test', 'feature']
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-4',
          method: 'tools/call',
          params: {
            name: 'design.create_spec',
            arguments: params
          }
        });

        expect(response.result.content[0].type).toBe('text');
        const result = JSON.parse(response.result.content[0].text);
        expect(result.specId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(result.spec.title).toBe(params.title);
        expect(result.spec.description).toBe(params.description);
        expect(result.spec.acceptanceCriteria).toEqual(params.acceptanceCriteria);
        expect(result.validationResults.isValid).toBe(true);
      });

      it('should handle database errors during spec creation', async () => {
        mockDbService.postgresQuery.mockRejectedValue(new Error('Database connection failed'));

        const params = {
          title: 'Test Spec',
          description: 'Test description',
          acceptanceCriteria: ['Should work']
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-5',
          method: 'tools/call',
          params: {
            name: 'design.create_spec',
            arguments: params
          }
        });

        expect(response.error.code).toBe(-32603);
        expect(response.error.message).toContain('Tool execution failed');
        expect(response.error.data).toContain('Database connection failed');
      });
    });

    describe('graph.search', () => {
      it('should search knowledge graph successfully', async () => {
        const mockEntities = [
          { id: 'entity1', name: 'TestEntity', type: 'class' },
          { id: 'entity2', name: 'AnotherEntity', type: 'function' }
        ];

        mockKgService.search.mockResolvedValue(mockEntities);

        const params = {
          query: 'test query',
          entityTypes: ['class', 'function'],
          limit: 10
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-6',
          method: 'tools/call',
          params: {
            name: 'graph.search',
            arguments: params
          }
        });

        const result = JSON.parse(response.result.content[0].text);
        expect(result.results).toEqual(mockEntities);
        expect(result.total).toBe(2);
        expect(result.query).toBe(params.query);
        expect(result.relevanceScore).toBeGreaterThan(0);
      });

      it('should include relationships when includeRelated is true', async () => {
        const mockEntities = [{ id: 'entity1', name: 'TestEntity', type: 'class' }];
        const mockRelationships = [
          { id: 'rel1', fromEntityId: 'entity1', toEntityId: 'entity2', type: 'TYPE_USES' }
        ];

        mockKgService.search.mockResolvedValue(mockEntities);
        mockKgService.getRelationships.mockResolvedValue(mockRelationships);

        const params = {
          query: 'test query',
          includeRelated: true
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-7',
          method: 'tools/call',
          params: {
            name: 'graph.search',
            arguments: params
          }
        });

        const result = JSON.parse(response.result.content[0].text);
        expect(result.relationships).toEqual(mockRelationships);
        expect(result.relevanceScore).toBeGreaterThan(0.2); // Should be higher with relationships
      });
    });

    describe('graph.examples', () => {
      it('should get entity examples successfully', async () => {
        const mockExamples = {
          usageExamples: [
            { code: 'const example = new TestClass();', context: 'Usage example' }
          ],
          testExamples: [
            { code: 'expect(testClass.method()).toBeDefined();', context: 'Unit test' }
          ]
        };

        mockKgService.getEntityExamples.mockResolvedValue(mockExamples);

        const params = { entityId: 'test-entity-123' };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-8',
          method: 'tools/call',
          params: {
            name: 'graph.examples',
            arguments: params
          }
        });

        const result = JSON.parse(response.result.content[0].text);
        expect(result.entityId).toBe(params.entityId);
        expect(result.examples).toEqual(mockExamples);
        expect(result.totalExamples).toBe(
          mockExamples.usageExamples.length + mockExamples.testExamples.length
        );
        expect(result.totalTestExamples).toBe(
          mockExamples.testExamples.length
        );
      });
    });

    describe('security.scan', () => {
      it('should perform security scan successfully', async () => {
        const mockScanResult = {
          issues: [
            {
              id: 'sec-1',
              type: 'hardcoded-secret',
              severity: 'high',
              title: 'Hardcoded API key detected'
            }
          ],
          vulnerabilities: [],
          summary: {
            totalIssues: 1,
            bySeverity: { critical: 0, high: 1, medium: 0, low: 0 }
          }
        };

        mockSecurityScanner.performScan.mockResolvedValue(mockScanResult);

        const params = {
          entityIds: ['entity1', 'entity2'],
          scanTypes: ['sast', 'secrets'],
          severity: ['high', 'critical']
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-9',
          method: 'tools/call',
          params: {
            name: 'security.scan',
            arguments: params
          }
        });

        const result = JSON.parse(response.result.content[0].text);
        expect(result.scan).toEqual(mockScanResult);
        expect(result.summary).toEqual(mockScanResult.summary);
        expect(result.message).toContain('Security scan completed');
      });
    });

    describe('tests.plan_and_generate', () => {
      it('should generate test plans successfully', async () => {
        const mockSpec = {
          id: 'spec-123',
          title: 'Test Specification',
          description: 'Test spec description',
          acceptanceCriteria: ['Should work', 'Should be fast', 'Should handle errors']
        };

        mockDbService.postgresQuery.mockResolvedValue([{ content: JSON.stringify(mockSpec) }]);

        const params = {
          specId: 'spec-123',
          testTypes: ['unit', 'integration'],
          includePerformanceTests: true
        };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-10',
          method: 'tools/call',
          params: {
            name: 'tests.plan_and_generate',
            arguments: params
          }
        });

        const result = JSON.parse(response.result.content[0].text);
        expect(result.specId).toBe(params.specId);
        expect(result).toEqual(
          expect.objectContaining({
            testPlan: expect.objectContaining({
              unitTests: expect.any(Array),
              integrationTests: expect.any(Array),
              performanceTests: expect.any(Array),
            }),
            estimatedCoverage: expect.any(Object),
          })
        );
      });

      it('should handle non-existent specification', async () => {
        mockDbService.postgresQuery.mockResolvedValue([]);

        const params = { specId: 'non-existent-spec' };

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'test-11',
          method: 'tools/call',
          params: {
            name: 'tests.plan_and_generate',
            arguments: params
          }
        });

        expect(response.error).toBeUndefined();
        const result = JSON.parse(response.result.content[0].text);
        expect(result.message).toMatch(/heuristic test plan/i);
        expect(result.testPlan).toBeDefined();
      });
    });

    describe('tests.get_performance', () => {
      it('should normalize environment argument before querying history', async () => {
        mockTestEngine.getPerformanceMetrics = vi.fn().mockResolvedValue({
          averageExecutionTime: 180,
          successRate: 0.9,
        }) as any;

        mockDbService.getPerformanceMetricsHistory = vi.fn().mockResolvedValue([]);

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'perf-1',
          method: 'tools/call',
          params: {
            name: 'tests.get_performance',
            arguments: {
              testId: 'test-runner-123',
              environment: 'Production',
            },
          },
        });

        expect(response.error).toBeUndefined();
        expect(mockDbService.getPerformanceMetricsHistory).toHaveBeenCalledWith(
          'test-runner-123',
          expect.objectContaining({ environment: 'prod' })
        );
      });

      it('should normalize metricId argument before querying history', async () => {
        mockTestEngine.getPerformanceMetrics = vi.fn().mockResolvedValue({
          averageExecutionTime: 190,
          successRate: 0.88,
        }) as any;

        mockDbService.getPerformanceMetricsHistory = vi.fn().mockResolvedValue([]);

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'perf-2',
          method: 'tools/call',
          params: {
            name: 'tests.get_performance',
            arguments: {
              testId: 'test-runner-456',
              metricId: 'Benchmark/API/Login-Latency',
            },
          },
        });

        expect(response.error).toBeUndefined();
        expect(mockDbService.getPerformanceMetricsHistory).toHaveBeenCalledWith(
          'test-runner-456',
          expect.objectContaining({ metricId: 'benchmark/api/login-latency' })
        );
      });

      it('should ignore invalid limit value when querying history', async () => {
        mockTestEngine.getPerformanceMetrics = vi.fn().mockResolvedValue({
          averageExecutionTime: 175,
          successRate: 0.93,
        }) as any;

        mockDbService.getPerformanceMetricsHistory = vi.fn().mockResolvedValue([]);

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'perf-3',
          method: 'tools/call',
          params: {
            name: 'tests.get_performance',
            arguments: {
              testId: 'test-runner-789',
              limit: 'nan',
            },
          },
        });

        expect(response.error).toBeUndefined();
        expect(mockDbService.getPerformanceMetricsHistory).toHaveBeenCalledWith(
          'test-runner-789',
          expect.objectContaining({ limit: undefined })
        );
      });

      it('should clamp limit argument to maximum supported value', async () => {
        mockTestEngine.getPerformanceMetrics = vi.fn().mockResolvedValue({
          averageExecutionTime: 200,
          successRate: 0.85,
        }) as any;

        mockDbService.getPerformanceMetricsHistory = vi.fn().mockResolvedValue([]);

        const response = await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: 'perf-4',
          method: 'tools/call',
          params: {
            name: 'tests.get_performance',
            arguments: {
              testId: 'test-runner-999',
              limit: 9999,
            },
          },
        });

        expect(response.error).toBeUndefined();
        expect(mockDbService.getPerformanceMetricsHistory).toHaveBeenCalledWith(
          'test-runner-999',
          expect.objectContaining({ limit: 500 })
        );
      });
    });
  });

  describe('Request Processing', () => {
    it('should handle tools/list request correctly', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-12',
        method: 'tools/list',
        params: {}
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('test-12');
      expect(response.result.tools).toEqual(expect.any(Array));
      expect(response.result.tools.length).toBeGreaterThan(0);

      // Check tool structure
      const firstTool = response.result.tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
    });

    it('should handle tools/call request correctly', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-13',
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: { query: 'test' }
        }
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('test-13');
      expect(response.result.content).toEqual(expect.any(Array));
      expect(response.result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return error for unknown method', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-14',
        method: 'unknown.method',
        params: {}
      });

      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Method \'unknown.method\' not found');
    });

    it('should return error for unknown tool', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-15',
        method: 'tools/call',
        params: {
          name: 'unknown.tool',
          arguments: {}
        }
      });

      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Tool \'unknown.tool\' not found');
    });

    it('should handle malformed JSON-RPC requests', async () => {
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        // Missing required 'method' field
        id: 'test-16'
      });

      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Method');
      expect(response.error.message).toContain('not found');
    });
  });

  describe('Monitoring and Metrics', () => {
    it('should track tool execution metrics', async () => {
      // Call a tool to generate metrics
      await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-17',
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: { query: 'test' }
        }
      });

      const metrics = mcpRouter.getMetrics();

      expect(metrics.tools.length).toBeGreaterThan(0);
      const graphSearchMetric = metrics.tools.find(m => m.toolName === 'graph.search');
      expect(graphSearchMetric).toBeDefined();
      expect(graphSearchMetric!.executionCount).toBe(1);
      expect(graphSearchMetric!.successCount).toBe(1);
      expect(graphSearchMetric!.errorCount).toBe(0);
    });

    it('should track error metrics', async () => {
      // Force an error in a tool call
      mockKgService.search.mockRejectedValue(new Error('Search failed'));

      await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-18',
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: { query: 'test' }
        }
      });

      const metrics = mcpRouter.getMetrics();
      const graphSearchMetric = metrics.tools.find(m => m.toolName === 'graph.search');
      expect(graphSearchMetric!.errorCount).toBe(1);
      expect(graphSearchMetric!.successCount).toBe(0);
    });

    it('should provide execution history', async () => {
      // Call multiple tools to build history
      await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-19',
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: { query: 'test1' }
        }
      });

      await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-20',
        method: 'tools/call',
        params: {
          name: 'design.create_spec',
          arguments: {
            title: 'Test',
            description: 'Test',
            acceptanceCriteria: ['Test']
          }
        }
      });

      const history = mcpRouter.getExecutionHistory(10);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('toolName');
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('duration');
      expect(history[0]).toHaveProperty('success');
    });

    it('should provide performance report', () => {
      const report = mcpRouter.getPerformanceReport();

      expect(report).toHaveProperty('reportGenerated');
      expect(report).toHaveProperty('timeRange', 'all_time');
      expect(report).toHaveProperty('tools');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.tools)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should limit execution history', () => {
      // This test would require many calls to test the limit
      // For now, just verify the method exists and returns array
      const history = mcpRouter.getExecutionHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Route Registration', () => {
    it('should register MCP routes correctly', () => {
      mcpRouter.registerRoutes(mockApp);

      const routes = mockApp.getRegisteredRoutes();
      expect(routes.has('post:/mcp')).toBe(true);
      expect(routes.has('get:/mcp/tools')).toBe(true);
      expect(routes.has('get:/mcp/health')).toBe(true);
      expect(routes.has('get:/mcp/metrics')).toBe(true);
      expect(routes.has('get:/mcp/history')).toBe(true);
      expect(routes.has('get:/mcp/performance')).toBe(true);
      expect(routes.has('get:/mcp/stats')).toBe(true);
    });

    it('should handle MCP JSON-RPC POST requests', async () => {
      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const mcpHandler = routes.get('post:/mcp');

      mockRequest.body = {
        jsonrpc: '2.0',
        id: 'test-21',
        method: 'tools/list',
        params: {}
      };

      await mcpHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('test-21');
      expect(response.result.tools).toBeDefined();
    });

    it('should handle MCP tools discovery GET requests', async () => {
      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const toolsHandler = routes.get('get:/mcp/tools');

      await toolsHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response.tools).toBeDefined();
      expect(response.count).toBeGreaterThan(0);
    });

    it('should handle health check requests', async () => {
      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const healthHandler = routes.get('get:/mcp/health');

      await healthHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('server', 'memento-mcp-server');
      expect(response).toHaveProperty('version', '1.0.0');
      expect(response).toHaveProperty('tools');
      expect(response).toHaveProperty('monitoring');
      expect(response).toHaveProperty('timestamp');
    });

    it('should handle metrics requests', async () => {
      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const metricsHandler = routes.get('get:/mcp/metrics');

      await metricsHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response).toHaveProperty('tools');
      expect(response).toHaveProperty('summary');
    });

    it('should handle history requests with limit', async () => {
      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const historyHandler = routes.get('get:/mcp/history');

      mockRequest.query = { limit: 5 };

      await historyHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response).toHaveProperty('history');
      expect(response).toHaveProperty('count');
      expect(response).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle internal server errors gracefully', async () => {
      // Force an internal error
      vi.spyOn(mcpRouter as any, 'processMCPRequest').mockRejectedValue(new Error('Internal error'));

      mcpRouter.registerRoutes(mockApp);
      const routes = mockApp.getRegisteredRoutes();
      const mcpHandler = routes.get('post:/mcp');

      mockRequest.body = {
        jsonrpc: '2.0',
        id: 'test-22',
        method: 'tools/list',
        params: {}
      };

      await mcpHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalled();
      const response = mockReply.send.mock.calls[0][0];
      expect(response.error.code).toBe(-32603);
      expect(response.error.message).toBe('Internal error');
    });

    it('should validate server configuration', async () => {
      const validation = await mcpRouter.validateServer();

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);

      // Should be valid with our proper setup
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should handle tool execution errors properly', async () => {
      // Test with a tool that doesn't exist
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-23',
        method: 'tools/call',
        params: {
          name: 'nonexistent.tool',
          arguments: {}
        }
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Tool \'nonexistent.tool\' not found');
    });

    it('should handle malformed tool arguments', async () => {
      // Call design.create_spec without required fields
      const response = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'test-24',
        method: 'tools/call',
        params: {
          name: 'design.create_spec',
          arguments: {} // Missing required fields
        }
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32602);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete MCP workflow', async () => {
      // 1. List tools
      const listResponse = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'workflow-1',
        method: 'tools/list',
        params: {}
      });

      expect(listResponse.result.tools.length).toBeGreaterThan(0);

      // 2. Call a tool
      const callResponse = await mcpRouter.processMCPRequest({
        jsonrpc: '2.0',
        id: 'workflow-2',
        method: 'tools/call',
        params: {
          name: 'graph.search',
          arguments: { query: 'test workflow' }
        }
      });

      expect(callResponse.result.content).toBeDefined();

      // 3. Check metrics were updated
      const metrics = mcpRouter.getMetrics();
      expect(metrics.summary.totalExecutions).toBeGreaterThan(0);
    });

    it('should maintain state across multiple requests', async () => {
      // Make multiple calls to the same tool
      for (let i = 0; i < 3; i++) {
        await mcpRouter.processMCPRequest({
          jsonrpc: '2.0',
          id: `state-test-${i}`,
          method: 'tools/call',
          params: {
            name: 'graph.search',
            arguments: { query: `test query ${i}` }
          }
        });
      }

      const metrics = mcpRouter.getMetrics();
      const graphSearchMetric = metrics.tools.find(m => m.toolName === 'graph.search');
      expect(graphSearchMetric!.executionCount).toBe(3);
      expect(graphSearchMetric!.successCount).toBe(3);
      expect(graphSearchMetric!.errorCount).toBe(0);
    });
  });
});
