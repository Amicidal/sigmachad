/**
 * Unit tests for Graph Routes
 * Tests graph search, entity examples, dependency analysis, and listing endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { registerGraphRoutes } from '../../../../src/api/routes/graph.js';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../../test-utils.js';
import type { Entity, FunctionSymbol, ClassSymbol } from '../../../../src/models/entities.js';
import type { GraphRelationship } from '../../../../src/models/relationships.js';
import { RealisticKnowledgeGraphMock } from '../../../test-utils/realistic-kg';

// Use realistic KG mock instead of simple vi.fn object mocks

// Helper functions to create mock entities
function createMockFunctionSymbol(overrides: Partial<FunctionSymbol> = {}): FunctionSymbol {
  return {
    id: overrides.id || 'mock-function-id',
    type: 'symbol',
    path: overrides.path || 'test.ts:mockFunc',
    hash: overrides.hash || 'mock-hash',
    language: overrides.language || 'typescript',
    lastModified: overrides.lastModified || new Date(),
    created: overrides.created || new Date(),
    metadata: overrides.metadata || {},
    name: overrides.name || 'mockFunc',
    kind: 'function',
    signature: overrides.signature || 'function mockFunc()',
    docstring: overrides.docstring || '',
    visibility: overrides.visibility || 'public',
    isExported: overrides.isExported ?? true,
    isDeprecated: overrides.isDeprecated ?? false,
    parameters: overrides.parameters || [],
    returnType: overrides.returnType || 'void',
    isAsync: overrides.isAsync ?? false,
    isGenerator: overrides.isGenerator ?? false,
    complexity: overrides.complexity || 1,
    calls: overrides.calls || [],
    ...overrides
  };
}

function createMockClassSymbol(overrides: Partial<ClassSymbol> = {}): ClassSymbol {
  return {
    id: overrides.id || 'mock-class-id',
    type: 'symbol',
    path: overrides.path || 'test.ts:MockClass',
    hash: overrides.hash || 'mock-hash',
    language: overrides.language || 'typescript',
    lastModified: overrides.lastModified || new Date(),
    created: overrides.created || new Date(),
    metadata: overrides.metadata || {},
    name: overrides.name || 'MockClass',
    kind: 'class',
    signature: overrides.signature || 'class MockClass',
    docstring: overrides.docstring || '',
    visibility: overrides.visibility || 'public',
    isExported: overrides.isExported ?? true,
    isDeprecated: overrides.isDeprecated ?? false,
    extends: overrides.extends || [],
    implements: overrides.implements || [],
    methods: overrides.methods || [],
    properties: overrides.properties || [],
    isAbstract: overrides.isAbstract ?? false,
    ...overrides
  };
}

function createMockEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: overrides.id || 'mock-entity-id',
    type: overrides.type || 'function',
    ...overrides
  };
}

function createMockRelationship(overrides: Partial<GraphRelationship> = {}): GraphRelationship {
  return {
    id: overrides.id || 'mock-relationship-id',
    type: overrides.type || 'CALLS',
    fromEntityId: overrides.fromEntityId || 'entity-1',
    toEntityId: overrides.toEntityId || 'entity-2',
    properties: overrides.properties || {},
    created: overrides.created || new Date(),
    lastModified: overrides.lastModified || new Date(),
    ...overrides
  };
}

describe('Graph Routes', () => {
  let mockApp: any;
  let mockKgService: RealisticKnowledgeGraphMock;
  let mockDbService: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  // Create a properly mocked Fastify app that tracks registered routes
  const createMockApp = () => {
    const routes = new Map<string, Function>();

    const registerRoute = (method: string, path: string, handler: Function, _options?: any) => {
      const key = `${method}:${path}`;
      routes.set(key, handler);
    };

    return {
      get: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('get', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('get', path, handler);
        }
      }),
      post: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('post', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('post', path, handler);
        }
      }),
      getRegisteredRoutes: () => routes
    };
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockApp = createMockApp();

    mockKgService = new RealisticKnowledgeGraphMock();

    // Minimal DB service stub (unused in handlers but passed for signature)
    mockDbService = {
      query: vi.fn(),
      execute: vi.fn()
    };

    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Reset all mocks
    vi.clearAllMocks();

    // default request/reply per test
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Route Registration', () => {
    it('should register all graph routes correctly', async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);

      const routes = mockApp.getRegisteredRoutes();
      expect(routes.has('post:/graph/search')).toBe(true);
      expect(routes.has('get:/graph/examples/:entityId')).toBe(true);
      expect(routes.has('get:/graph/dependencies/:entityId')).toBe(true);
      expect(routes.has('get:/graph/entities')).toBe(true);
      expect(routes.has('get:/graph/relationships')).toBe(true);
    });

    it('should call registerGraphRoutes with correct dependencies', async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);

      expect(mockApp.post).toHaveBeenCalled();
      expect(mockApp.get).toHaveBeenCalled();
    });
  });

  describe('POST /api/graph/search', () => {
    let searchHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      searchHandler = routes.get('post:/graph/search');
    });

    it('should perform semantic search successfully', async () => {
      const func = createMockFunctionSymbol({ id: 'func-1', name: 'searchFunc', path: 'src/a.ts:searchFunc' });
      const clazz = createMockClassSymbol({ id: 'class-1', name: 'SearchClass', path: 'src/b.ts:SearchClass' });
      await mockKgService.createEntity(func as any);
      await mockKgService.createEntity(clazz as any);
      const rel = createMockRelationship({ id: 'rel-1', fromEntityId: 'func-1', toEntityId: 'class-1', type: 'CALLS' as any });
      await mockKgService.createRelationship(rel);

      mockRequest.body = {
        query: 'search',
        searchType: 'semantic',
        includeRelated: true,
        limit: 10
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: expect.arrayContaining([expect.objectContaining({ id: 'func-1' }), expect.objectContaining({ id: 'class-1' })]),
          relationships: expect.arrayContaining([expect.objectContaining({ id: 'rel-1' })]),
          clusters: [],
          relevanceScore: expect.any(Number)
        })
      });
    });

    it('should perform structural search with filters', async () => {
      const ent = createMockFunctionSymbol({
        id: 'func-1',
        name: 'filteredFunc',
        language: 'typescript',
        path: 'src/utils/filtered.ts:filteredFunc',
        metadata: { tags: ['utility', 'helper'] } as any
      });
      await mockKgService.createEntity(ent as any);

      mockRequest.body = {
        query: 'filtered',
        entityTypes: ['function'],
        searchType: 'structural',
        filters: {
          language: 'typescript',
          path: 'src/',
          tags: ['utility'],
          lastModified: {
            since: new Date('2024-01-01'),
            until: new Date('2024-12-31')
          }
        },
        limit: 5
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: expect.arrayContaining([expect.objectContaining({ id: 'func-1' })]),
          relationships: [],
          relevanceScore: expect.any(Number)
        })
      });
    });

    it('should handle search without includeRelated', async () => {
      await mockKgService.createEntity(createMockEntity({ id: 'entity-1', type: 'function' }) as any);

      mockRequest.body = {
        query: 'entity-1',
        includeRelated: false
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: expect.arrayContaining([expect.objectContaining({ id: 'entity-1' })]),
          relationships: [],
          relevanceScore: expect.any(Number)
        })
      });
    });

    it('should handle empty search results', async () => {
      mockRequest.body = {
        query: 'nonexistent',
        includeRelated: true
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: [],
          relationships: [],
          relevanceScore: 0
        })
      });
    });

    it('should handle search with all entity types', async () => {
      const mockEntities = [
        createMockFunctionSymbol({ id: 'func-1' }),
        createMockClassSymbol({ id: 'class-1' }),
        createMockEntity({ id: 'file-1', type: 'file' }),
        createMockEntity({ id: 'module-1', type: 'module' })
      ];

      vi.spyOn(mockKgService as any, 'search').mockResolvedValue(mockEntities as any);

      mockRequest.body = {
        query: 'all types',
        entityTypes: ['function', 'class', 'interface', 'file', 'module']
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockKgService.search).toHaveBeenCalledWith({
        query: 'all types',
        entityTypes: ['function', 'class', 'interface', 'file', 'module']
      });
    });

    it('should handle search errors gracefully', async () => {
      vi.spyOn(mockKgService as any, 'search').mockRejectedValue(new Error('Search service failed'));

      mockRequest.body = {
        query: 'error query'
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GRAPH_SEARCH_FAILED',
            message: 'Failed to perform graph search',
            details: 'Search service failed'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should validate required query parameter', async () => {
      mockRequest.body = {}; // Missing required 'query' field

      await searchHandler(mockRequest, mockReply);

      // The handler should still process but may not find results
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle complex search with multiple relationships', async () => {
      for (let i = 0; i < 5; i++) {
        await mockKgService.createEntity(createMockFunctionSymbol({ id: `func-${i}`, name: `func${i}`, path: `src/f${i}.ts:func${i}` }) as any);
      }
      for (let i = 0; i < 10; i++) {
        await mockKgService.createRelationship(
          createMockRelationship({
            id: `rel-${i}`,
            fromEntityId: `func-${i % 5}`,
            toEntityId: `func-${(i + 1) % 5}`,
            type: 'CALLS' as any,
          })
        );
      }

      mockRequest.body = {
        query: 'func',
        includeRelated: true,
        limit: 20
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: expect.arrayContaining([expect.objectContaining({ id: 'func-0' })]),
          relationships: expect.any(Array),
          relevanceScore: expect.any(Number)
        })
      });
    });

    it('should remove duplicate relationships', async () => {
      await mockKgService.createEntity(createMockEntity({ id: 'entity-1', type: 'function' }) as any);
      await mockKgService.createEntity(createMockEntity({ id: 'entity-2', type: 'function' }) as any);
      await mockKgService.createEntity(createMockEntity({ id: 'entity-3', type: 'function' }) as any);

      // Seed relationships (note: underlying store de-dupes by id)
      await mockKgService.createRelationship(createMockRelationship({ id: 'rel-1', fromEntityId: 'entity-1', toEntityId: 'entity-2', type: 'CALLS' as any }));
      await mockKgService.createRelationship(createMockRelationship({ id: 'rel-1', fromEntityId: 'entity-1', toEntityId: 'entity-2', type: 'CALLS' as any })); // duplicate id
      await mockKgService.createRelationship(createMockRelationship({ id: 'rel-2', fromEntityId: 'entity-1', toEntityId: 'entity-3', type: 'TYPE_USES' as any }));

      mockRequest.body = {
        query: 'entity-1',
        includeRelated: true
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          relationships: expect.any(Array)
        })
      });
    });
  });

  describe('GET /api/graph/examples/{entityId}', () => {
    let examplesHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      examplesHandler = routes.get('get:/graph/examples/:entityId');
    });

    it('should retrieve usage examples successfully', async () => {
      const target = createMockFunctionSymbol({ id: 'func-123', name: 'processData', path: 'service.ts:processData' });
      await mockKgService.createEntity(target as any);
      // Seed two incoming relationships to generate usage examples
      await mockKgService.createEntity(createMockFunctionSymbol({ id: 'caller-1', name: 'caller1', path: 'svc.ts:caller1' }) as any);
      await mockKgService.createEntity(createMockFunctionSymbol({ id: 'caller-2', name: 'caller2', path: 'ctl.ts:caller2' }) as any);
      await mockKgService.createRelationship(createMockRelationship({ id: 'r1', fromEntityId: 'caller-1', toEntityId: 'func-123', type: 'CALLS' as any }));
      await mockKgService.createRelationship(createMockRelationship({ id: 'r2', fromEntityId: 'caller-2', toEntityId: 'func-123', type: 'TYPE_USES' as any }));

      mockRequest.params = { entityId: 'func-123' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'func-123',
          usageExamples: expect.arrayContaining([
            expect.objectContaining({ file: expect.stringContaining('service.ts') }),
          ]),
        })
      });
    });

    it('should handle entity with no examples', async () => {
      await mockKgService.createEntity(createMockFunctionSymbol({ id: 'empty-entity', name: 'emptyFunc', path: 'empty.ts:emptyFunc' }) as any);

      mockRequest.params = { entityId: 'empty-entity' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          usageExamples: [],
          testExamples: [],
          relatedPatterns: []
        })
      });
    });

    it('should handle examples retrieval errors', async () => {
      vi.spyOn(mockKgService as any, 'getEntityExamples').mockRejectedValue(new Error('Examples service failed'));

      mockRequest.params = { entityId: 'error-entity' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'EXAMPLES_RETRIEVAL_FAILED',
            message: 'Failed to retrieve usage examples',
            details: 'Examples service failed'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle complex examples with multiple patterns', async () => {
      const mockExamples = {
        entityId: 'complex-func',
        signature: 'function complexFunc<T>(data: T[]): Promise<T[]>',
        usageExamples: Array.from({ length: 10 }, (_, i) => ({
          context: `Usage context ${i}`,
          code: `complexFunc(data${i});`,
          file: `file${i}.ts`,
          line: i * 10
        })),
        testExamples: Array.from({ length: 5 }, (_, i) => ({
          testId: `test-${i}`,
          testName: `Test case ${i}`,
          testCode: `expect(complexFunc(testData${i})).toEqual(expected${i});`,
          assertions: [`should handle case ${i}`, `should return correct result ${i}`]
        })),
        relatedPatterns: Array.from({ length: 3 }, (_, i) => ({
          pattern: `Pattern ${i}`,
          frequency: i + 1,
          confidence: 0.7 + (i * 0.1)
        }))
      };

      vi.spyOn(mockKgService as any, 'getEntityExamples').mockResolvedValue(mockExamples as any);

      mockRequest.params = { entityId: 'complex-func' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          usageExamples: expect.any(Array),
          testExamples: expect.any(Array),
          relatedPatterns: expect.any(Array)
        })
      });
    });

    it('should handle invalid entityId parameter', async () => {
      mockRequest.params = { entityId: '' };

      await examplesHandler(mockRequest, mockReply);

      // Should still process and respond (error or empty data)
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle examples with special characters in code', async () => {
      const mockExamples = {
        entityId: 'special-func',
        signature: 'function specialFunc(data: string): string',
        usageExamples: [
          {
            context: 'String processing',
            code: 'const result = specialFunc("hello \\"world\\" with quotes");',
            file: 'utils.ts',
            line: 15
          }
        ],
        testExamples: [],
        relatedPatterns: []
      };

      vi.spyOn(mockKgService as any, 'getEntityExamples').mockResolvedValue(mockExamples as any);

      mockRequest.params = { entityId: 'special-func' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockExamples
      });
    });
  });

  describe('GET /api/graph/dependencies/{entityId}', () => {
    let dependenciesHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      dependenciesHandler = routes.get('get:/graph/dependencies/:entityId');
    });

    it('should analyze dependencies successfully', async () => {
      const mockAnalysis = {
        entityId: 'service-123',
        directDependencies: [
          {
            entity: createMockEntity({ id: 'util-1', type: 'function' }),
            relationship: 'CALLS',
            confidence: 0.9
          },
          {
            entity: createMockEntity({ id: 'config-1', type: 'class' }),
            relationship: 'TYPE_USES',
            confidence: 0.7
          }
        ],
        indirectDependencies: [
          {
            entity: createMockEntity({ id: 'helper-1', type: 'function' }),
            path: [createMockEntity({ id: 'util-1' }), createMockEntity({ id: 'helper-1' })],
            relationship: 'CALLS',
            distance: 2
          }
        ],
        reverseDependencies: [
          {
            entity: createMockEntity({ id: 'controller-1', type: 'class' }),
            relationship: 'TYPE_USES',
            impact: 'high'
          }
        ],
        circularDependencies: []
      };

      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(mockAnalysis as any);

      mockRequest.params = { entityId: 'service-123' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockKgService.getEntityDependencies).toHaveBeenCalledWith('service-123');

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis
      });
    });

    it('should handle entity with no dependencies', async () => {
      const mockAnalysis = {
        entityId: 'isolated-entity',
        directDependencies: [],
        indirectDependencies: [],
        reverseDependencies: [],
        circularDependencies: []
      };

      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(mockAnalysis as any);

      mockRequest.params = { entityId: 'isolated-entity' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          directDependencies: [],
          indirectDependencies: [],
          reverseDependencies: [],
          circularDependencies: []
        })
      });
    });

    it('should handle circular dependencies', async () => {
      const mockAnalysis = {
        entityId: 'circular-entity',
        directDependencies: [
          {
            entity: createMockEntity({ id: 'dep-1' }),
            relationship: 'CALLS',
            confidence: 0.8
          }
        ],
        indirectDependencies: [],
        reverseDependencies: [],
        circularDependencies: [
          {
            cycle: [
              createMockEntity({ id: 'circular-entity' }),
              createMockEntity({ id: 'dep-1' }),
              createMockEntity({ id: 'circular-entity' })
            ],
            severity: 'critical'
          }
        ]
      };

      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(mockAnalysis as any);

      mockRequest.params = { entityId: 'circular-entity' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          circularDependencies: expect.arrayContaining([
            expect.objectContaining({
              cycle: expect.any(Array),
              severity: 'critical'
            })
          ])
        })
      });
    });

    it('should handle dependency analysis errors', async () => {
      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockRejectedValue(new Error('Dependency analysis failed'));

      mockRequest.params = { entityId: 'error-entity' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DEPENDENCY_ANALYSIS_FAILED',
            message: 'Failed to analyze dependencies',
            details: 'Dependency analysis failed'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle complex dependency graphs', async () => {
      const mockAnalysis = {
        entityId: 'complex-entity',
        directDependencies: Array.from({ length: 5 }, (_, i) => ({
          entity: createMockEntity({ id: `direct-${i}` }),
          relationship: 'CALLS',
          confidence: 0.5 + (i * 0.1)
        })),
        indirectDependencies: Array.from({ length: 3 }, (_, i) => ({
          entity: createMockEntity({ id: `indirect-${i}` }),
          path: Array.from({ length: i + 2 }, (_, j) => createMockEntity({ id: `path-${i}-${j}` })),
          relationship: 'TYPE_USES',
          distance: i + 2
        })),
        reverseDependencies: Array.from({ length: 4 }, (_, i) => ({
          entity: createMockEntity({ id: `reverse-${i}` }),
          relationship: 'IMPORTS',
          impact: ['high', 'medium', 'low', 'low'][i]
        })),
        circularDependencies: []
      };

      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(mockAnalysis as any);

      mockRequest.params = { entityId: 'complex-entity' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          directDependencies: expect.any(Array),
          indirectDependencies: expect.any(Array),
          reverseDependencies: expect.any(Array)
        })
      });
    });

    it('should handle dependency analysis with different impact levels', async () => {
      const mockAnalysis = {
        entityId: 'impact-test-entity',
        directDependencies: [],
        indirectDependencies: [],
        reverseDependencies: [
          {
            entity: createMockEntity({ id: 'high-impact' }),
            relationship: 'CALLS',
            impact: 'high'
          },
          {
            entity: createMockEntity({ id: 'medium-impact' }),
            relationship: 'TYPE_USES',
            impact: 'medium'
          },
          {
            entity: createMockEntity({ id: 'low-impact' }),
            relationship: 'IMPORTS',
            impact: 'low'
          }
        ],
        circularDependencies: []
      };

      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(mockAnalysis as any);

      mockRequest.params = { entityId: 'impact-test-entity' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          reverseDependencies: expect.arrayContaining([
            expect.objectContaining({ impact: 'high' }),
            expect.objectContaining({ impact: 'medium' }),
            expect.objectContaining({ impact: 'low' })
          ])
        })
      });
    });
  });

  describe('GET /api/graph/entities', () => {
    let entitiesHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      entitiesHandler = routes.get('get:/graph/entities');
    });

    it('should list entities successfully with pagination', async () => {
      const mockEntities = [
        createMockFunctionSymbol({ id: 'func-1', name: 'func1' }),
        createMockClassSymbol({ id: 'class-1', name: 'Class1' }),
        createMockEntity({ id: 'file-1', type: 'file' })
      ];

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: mockEntities,
        total: 150
      } as any);

      mockRequest.query = {
        type: 'function',
        language: 'typescript',
        path: 'src/',
        tags: 'utility,helper',
        limit: 10,
        offset: 20
      };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({
        type: 'symbol',
        kind: 'function',
        language: 'typescript',
        path: 'src/',
        tags: ['utility', 'helper'],
        limit: 10,
        offset: 20
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockEntities,
        pagination: {
          page: 3,
          pageSize: 10,
          total: 150,
          hasMore: true
        }
      });
    });

    it('should handle empty entity list', async () => {
      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: [],
        total: 0
      } as any);

      mockRequest.query = {};

      await entitiesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          hasMore: false
        }
      });
    });

    it('should handle filtering by multiple tags', async () => {
      const mockEntities = [createMockFunctionSymbol({ id: 'tagged-func' })];

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: mockEntities,
        total: 1
      } as any);

      mockRequest.query = {
        tags: 'tag1,tag2,tag3'
      };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({
        tags: ['tag1', 'tag2', 'tag3'],
        type: undefined,
        language: undefined,
        path: undefined,
        limit: undefined,
        offset: undefined
      });
    });

    it('should handle entities listing errors', async () => {
      vi.spyOn(mockKgService as any, 'listEntities').mockRejectedValue(new Error('List entities failed'));

      mockRequest.query = { type: 'function' };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'ENTITIES_LIST_FAILED',
            message: 'Failed to list entities',
            details: 'List entities failed'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle large entity sets with pagination', async () => {
      const mockEntities = Array.from({ length: 100 }, (_, i) =>
        createMockEntity({ id: `entity-${i}`, type: 'function' })
      );

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: mockEntities,
        total: 1000
      } as any);

      mockRequest.query = {
        limit: 100,
        offset: 900
      };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockEntities,
        pagination: {
          page: 10,
          pageSize: 100,
          total: 1000,
          hasMore: false
        }
      });
    });

    it('should handle default pagination values', async () => {
      const mockEntities = [createMockEntity({ id: 'default-test' })];

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: mockEntities,
        total: 1
      } as any);

      mockRequest.query = {}; // No pagination parameters

      await entitiesHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({
        type: undefined,
        language: undefined,
        path: undefined,
        tags: undefined,
        limit: undefined,
        offset: undefined
      });
    });

    it('should handle empty tags parameter', async () => {
      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: [],
        total: 0
      } as any);

      mockRequest.query = { tags: '' };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({
        type: undefined,
        language: undefined,
        path: undefined,
        tags: undefined,
        limit: undefined,
        offset: undefined
      });
    });
  });

  describe('GET /api/graph/relationships', () => {
    let relationshipsHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      relationshipsHandler = routes.get('get:/graph/relationships');
    });

    it('should list relationships successfully with filtering', async () => {
      const mockRelationships = [
        createMockRelationship({
          id: 'rel-1',
          type: 'CALLS',
          fromEntityId: 'func-1',
          toEntityId: 'func-2'
        }),
        createMockRelationship({
          id: 'rel-2',
          type: 'TYPE_USES',
          fromEntityId: 'class-1',
          toEntityId: 'util-1'
        })
      ];

      vi.spyOn(mockKgService as any, 'listRelationships').mockResolvedValue({
        relationships: mockRelationships,
        total: 75
      } as any);

      mockRequest.query = {
        fromEntity: 'func-1',
        toEntity: 'func-2',
        type: 'CALLS',
        limit: 25,
        offset: 50
      };

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockKgService.listRelationships).toHaveBeenCalledWith({
        fromEntity: 'func-1',
        toEntity: 'func-2',
        type: 'CALLS',
        limit: 25,
        offset: 50
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockRelationships,
        pagination: {
          page: 3,
          pageSize: 25,
          total: 75,
          hasMore: false
        }
      });
    });

    it('should handle empty relationships list', async () => {
      vi.spyOn(mockKgService as any, 'listRelationships').mockResolvedValue({
        relationships: [],
        total: 0
      } as any);

      mockRequest.query = {};

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          hasMore: false
        }
      });
    });

    it('should handle relationships with complex queries', async () => {
      const mockRelationships = Array.from({ length: 10 }, (_, i) =>
        createMockRelationship({
          id: `rel-${i}`,
          type: ['CALLS', 'TYPE_USES', 'IMPORTS', 'EXTENDS'][i % 4],
          fromEntityId: `entity-${i}`,
          toEntityId: `target-${i}`
        })
      );

      vi.spyOn(mockKgService as any, 'listRelationships').mockResolvedValue({
        relationships: mockRelationships,
        total: 200
      } as any);

      mockRequest.query = {
        type: 'CALLS',
        limit: 10,
        offset: 0
      };

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockRelationships,
        pagination: expect.objectContaining({
          total: 200,
          hasMore: true
        })
      });
    });

    it('should handle relationships listing errors', async () => {
      vi.spyOn(mockKgService as any, 'listRelationships').mockRejectedValue(new Error('List relationships failed'));

      mockRequest.query = { type: 'CALLS' };

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RELATIONSHIPS_LIST_FAILED',
            message: 'Failed to list relationships',
            details: 'List relationships failed'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle unidirectional relationship queries', async () => {
      const mockRelationships = [
        createMockRelationship({
          fromEntityId: 'source-entity',
          toEntityId: 'target-1'
        }),
        createMockRelationship({
          fromEntityId: 'source-entity',
          toEntityId: 'target-2'
        })
      ];

      vi.spyOn(mockKgService as any, 'listRelationships').mockResolvedValue({
        relationships: mockRelationships,
        total: 2
      } as any);

      mockRequest.query = {
        fromEntity: 'source-entity'
      };

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockKgService.listRelationships).toHaveBeenCalledWith({
        fromEntity: 'source-entity',
        toEntity: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined
      });
    });

    it('should handle default pagination for relationships', async () => {
      vi.spyOn(mockKgService as any, 'listRelationships').mockResolvedValue({
        relationships: [],
        total: 0
      } as any);

      mockRequest.query = {}; // No parameters

      await relationshipsHandler(mockRequest, mockReply);

      expect(mockKgService.listRelationships).toHaveBeenCalledWith({
        fromEntity: undefined,
        toEntity: undefined,
        type: undefined,
        limit: undefined,
        offset: undefined
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let searchHandler: Function;
    let examplesHandler: Function;
    let dependenciesHandler: Function;
    let entitiesHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      searchHandler = routes.get('post:/graph/search');
      examplesHandler = routes.get('get:/graph/examples/:entityId');
      dependenciesHandler = routes.get('get:/graph/dependencies/:entityId');
      entitiesHandler = routes.get('get:/graph/entities');
    });

    it('should handle null request body gracefully', async () => {
      mockRequest.body = null;

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle malformed request parameters', async () => {
      mockRequest.params = { entityId: null };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle service unavailability', async () => {
      vi.spyOn(mockKgService as any, 'search').mockRejectedValue(new Error('Service unavailable'));

      mockRequest.body = { query: 'test' };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });

    it('should handle extremely large result sets conceptually', async () => {
      const largeEntities = Array.from({ length: 1000 }, (_, i) =>
        createMockEntity({ id: `entity-${i}` })
      );

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: largeEntities,
        total: 10000
      } as any);

      mockRequest.query = { limit: 1000, offset: 9000 };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: largeEntities,
        pagination: {
          page: 10,
          pageSize: 1000,
          total: 10000,
          hasMore: false
        }
      });
    });

    it('should handle concurrent requests without interference', async () => {
      const request1 = createMockRequest();
      const request2 = createMockRequest();
      const reply1 = createMockReply();
      const reply2 = createMockReply();

      request1.body = { query: 'test1' };
      request2.body = { query: 'test2' };

      vi.spyOn(mockKgService as any, 'search')
        .mockResolvedValueOnce([createMockEntity({ id: 'result1' })])
        .mockResolvedValueOnce([createMockEntity({ id: 'result2' })]);

      await Promise.all([
        searchHandler(request1, reply1),
        searchHandler(request2, reply2)
      ]);

      expect(reply1.send).toHaveBeenCalled();
      expect(reply2.send).toHaveBeenCalled();
    });

    it('should handle network-like errors in service calls', async () => {
      vi.spyOn(mockKgService as any, 'getEntityExamples').mockRejectedValue(new Error('Network timeout'));

      mockRequest.params = { entityId: 'timeout-test' };

      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: 'Network timeout'
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle malformed JSON in request body', async () => {
      // Simulate malformed request body
      mockRequest.body = { query: undefined, invalid: 'data' };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle empty string parameters', async () => {
      mockRequest.params = { entityId: '' };

      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle negative pagination values', async () => {
      mockRequest.query = { limit: -1, offset: -10 };

      const spy = vi.spyOn(mockKgService as any, 'listEntities');
      await entitiesHandler(mockRequest, mockReply);

      expect(spy).toHaveBeenCalledWith({
        type: undefined,
        language: undefined,
        path: undefined,
        tags: undefined,
        limit: -1,
        offset: -10
      });
    });

    it('should handle extremely long parameter values', async () => {
      const longQuery = 'a'.repeat(10000);
      mockRequest.body = { query: longQuery };

      const spy = vi.spyOn(mockKgService as any, 'search');
      await searchHandler(mockRequest, mockReply);

      expect(spy).toHaveBeenCalledWith({
        query: longQuery
      });
    });

    it('should handle special characters in parameters', async () => {
      const specialQuery = 'test with "quotes" and \'apostrophes\' and <tags>';
      mockRequest.body = { query: specialQuery };

      const spy = vi.spyOn(mockKgService as any, 'search');
      await searchHandler(mockRequest, mockReply);

      expect(spy).toHaveBeenCalledWith({
        query: specialQuery
      });
    });
  });

  describe('Integration Scenarios', () => {
    let searchHandler: Function;
    let examplesHandler: Function;
    let dependenciesHandler: Function;
    let entitiesHandler: Function;

    beforeEach(async () => {
      await registerGraphRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      searchHandler = routes.get('post:/graph/search');
      examplesHandler = routes.get('get:/graph/examples/:entityId');
      dependenciesHandler = routes.get('get:/graph/dependencies/:entityId');
      entitiesHandler = routes.get('get:/graph/entities');

    });

    it('should handle complex search with examples and dependencies', async () => {
      // Mock search results
      const searchEntities = [createMockFunctionSymbol({ id: 'complex-func', name: 'complexFunc' })];
      vi.spyOn(mockKgService as any, 'search').mockResolvedValue(searchEntities as any);

      // Mock examples
      const examples = {
        entityId: 'complex-func',
        signature: 'function complexFunc<T>(data: T): Promise<T>',
        usageExamples: [
          {
            context: 'Complex processing',
            code: 'const result = await complexFunc(input);',
            file: 'processor.ts',
            line: 25
          }
        ],
        testExamples: [
          {
            testId: 'complex-test',
            testName: 'should handle complex data',
            testCode: 'expect(complexFunc(complexData)).resolves.toEqual(expected);',
            assertions: ['should process complex data', 'should return correct result']
          }
        ],
        relatedPatterns: [
          {
            pattern: 'async data transformation',
            frequency: 8,
            confidence: 0.92
          }
        ]
      };
      vi.spyOn(mockKgService as any, 'getEntityExamples').mockResolvedValue(examples as any);

      // Mock dependencies
      const dependencies = {
        entityId: 'complex-func',
        directDependencies: [
          {
            entity: createMockEntity({ id: 'validator', type: 'function' }),
            relationship: 'CALLS',
            confidence: 0.85
          },
          {
            entity: createMockEntity({ id: 'transformer', type: 'function' }),
            relationship: 'TYPE_USES',
            confidence: 0.75
          }
        ],
        indirectDependencies: [
          {
            entity: createMockEntity({ id: 'logger', type: 'class' }),
            path: [createMockEntity({ id: 'validator' }), createMockEntity({ id: 'logger' })],
            relationship: 'CALLS',
            distance: 2
          }
        ],
        reverseDependencies: [
          {
            entity: createMockEntity({ id: 'api-controller', type: 'class' }),
            relationship: 'CALLS',
            impact: 'high'
          }
        ],
        circularDependencies: []
      };
      vi.spyOn(mockKgService as any, 'getEntityDependencies').mockResolvedValue(dependencies as any);

      // Test search
      mockRequest.body = { query: 'complex function', includeRelated: true };
      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: searchEntities
        })
      });

      // Reset reply mock for next test
      vi.clearAllMocks();
      mockReply = createMockReply();

      // Test examples
      mockRequest.params = { entityId: 'complex-func' };
      await examplesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: examples
      });

      // Reset reply mock for next test
      vi.clearAllMocks();
      mockReply = createMockReply();

      // Test dependencies
      await dependenciesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: dependencies
      });
    });

    it('should handle multiple entity types in search results', async () => {
      const mixedEntities = [
        createMockFunctionSymbol({ id: 'func-1', name: 'processData' }),
        createMockClassSymbol({ id: 'class-1', name: 'DataProcessor' }),
        createMockEntity({ id: 'file-1', type: 'file', path: 'src/processor.ts' }),
        createMockEntity({ id: 'module-1', type: 'module', path: 'src/processor' }),
        createMockEntity({ id: 'interface-1', type: 'interface', path: 'src/types.ts:DataInterface' })
      ];

      vi.spyOn(mockKgService as any, 'search').mockResolvedValue(mixedEntities as any);

      mockRequest.body = {
        query: 'processor',
        entityTypes: ['function', 'class', 'interface', 'file', 'module'],
        includeRelated: false
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: mixedEntities,
          relationships: [],
          relevanceScore: expect.any(Number)
        })
      });
    });

    it('should handle complex filtering scenarios', async () => {
      const filteredEntities = [
        createMockFunctionSymbol({
          id: 'filtered-func',
          name: 'filteredFunction',
          language: 'typescript',
          path: 'src/utils/filtered.ts:filteredFunction'
        })
      ];

      vi.spyOn(mockKgService as any, 'listEntities').mockResolvedValue({
        entities: filteredEntities,
        total: 1
      } as any);

      mockRequest.query = {
        type: 'function',
        language: 'typescript',
        path: 'src/utils/',
        tags: 'utility,filter,typescript',
        limit: 20,
        offset: 0
      };

      await entitiesHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({
        type: 'symbol',
        kind: 'function',
        language: 'typescript',
        path: 'src/utils/',
        tags: ['utility', 'filter', 'typescript'],
        limit: 20,
        offset: 0
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: filteredEntities,
        pagination: expect.objectContaining({
          page: 1,
          pageSize: 20,
          total: 1,
          hasMore: false
        })
      });
    });
  });
});
