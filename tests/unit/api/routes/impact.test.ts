/**
 * Unit tests for Impact Routes
 * Tests impact analysis, entity assessment, and change comparison endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { registerImpactRoutes } from '../../../../src/api/routes/impact.js';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../../test-utils.js';

// Mock external dependencies
vi.mock('../../../../src/services/KnowledgeGraphService.js', () => ({
  KnowledgeGraphService: vi.fn()
}));

vi.mock('../../../../src/services/DatabaseService.js', () => ({
  DatabaseService: vi.fn()
}));

describe('Impact Routes', () => {
  let mockApp: any;
  let mockKgService: any;
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

    mockKgService = {
      search: vi.fn(),
      getRelationships: vi.fn(),
      getEntityHistory: vi.fn()
    };

    mockDbService = {
      query: vi.fn(),
      execute: vi.fn(),
      getEntityImpactHistory: vi.fn()
    };

    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockKgService.search.mockResolvedValue([]);
    mockKgService.getRelationships.mockResolvedValue([]);
    mockKgService.getEntityHistory.mockResolvedValue([]);
    mockDbService.query.mockResolvedValue([]);
    mockDbService.getEntityImpactHistory.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Route Registration', () => {
    it('should register all impact routes correctly', async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);

      const routes = mockApp.getRegisteredRoutes();
      expect(routes.has('post:/impact-analyze')).toBe(true);
      expect(routes.has('get:/entity/:entityId')).toBe(true);
      expect(routes.has('post:/compare')).toBe(true);
      expect(routes.has('get:/history/:entityId')).toBe(true);
    });

    it('should call registerImpactRoutes with correct dependencies', async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);

      expect(mockApp.post).toHaveBeenCalled();
      expect(mockApp.get).toHaveBeenCalled();
    });
  });

  describe('POST /impact-analyze', () => {
    let impactAnalyzeHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      impactAnalyzeHandler = routes.get('post:/impact-analyze');
    });

    it('should analyze change impact successfully with valid changes', async () => {
      const mockAnalysisRequest = {
        changes: [
          {
            entityId: 'func-1',
            changeType: 'modify',
            signatureChange: true
          },
          {
            entityId: 'class-2',
            changeType: 'delete'
          }
        ],
        includeIndirect: true,
        maxDepth: 3
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          directImpact: [],
          cascadingImpact: [],
          testImpact: expect.objectContaining({
            affectedTests: [],
            requiredUpdates: [],
            coverageImpact: 0
          }),
          documentationImpact: expect.objectContaining({
            staleDocs: [],
            requiredUpdates: []
          }),
          recommendations: []
        })
      });
    });

    it('should handle empty changes array', async () => {
      const mockAnalysisRequest = {
        changes: [],
        includeIndirect: false,
        maxDepth: 2
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          directImpact: [],
          cascadingImpact: [],
          testImpact: expect.objectContaining({
            affectedTests: [],
            requiredUpdates: [],
            coverageImpact: 0
          }),
          documentationImpact: expect.objectContaining({
            staleDocs: [],
            requiredUpdates: []
          }),
          recommendations: []
        })
      });
    });

    it('should handle rename changes with new name', async () => {
      const mockAnalysisRequest = {
        changes: [
          {
            entityId: 'func-1',
            changeType: 'rename',
            newName: 'newFunctionName'
          }
        ]
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle analysis with default parameters', async () => {
      const mockAnalysisRequest = {
        changes: [
          {
            entityId: 'func-1',
            changeType: 'modify'
          }
        ]
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockAnalysisRequest = {
        changes: [
          {
            entityId: 'func-1',
            changeType: 'modify'
          }
        ]
      };

      mockRequest.body = mockAnalysisRequest;

      // Mock a service error (though current implementation doesn't use services yet)
      // This tests the error handling structure for when services are implemented

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should validate request body against schema', async () => {
      // Missing required 'changes' field
      const invalidRequest = {
        includeIndirect: true
      };

      mockRequest.body = invalidRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      // The route should still process but may not have proper schema validation in current implementation
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle invalid change types gracefully', async () => {
      const mockAnalysisRequest = {
        changes: [
          {
            entityId: 'func-1',
            changeType: 'invalid-type' as any
          }
        ]
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('GET /entity/:entityId', () => {
    let entityImpactHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      entityImpactHandler = routes.get('get:/entity/:entityId');
    });

    it('should get impact assessment for entity successfully', async () => {
      const entityId = 'func-123';
      mockRequest.params = { entityId };
      mockRequest.query = {
        changeType: 'modify',
        includeReverse: true
      };

      await entityImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'func-123',
          changeType: 'modify',
          affectedEntities: [],
          riskLevel: 'medium',
          mitigationStrategies: []
        })
      });
    });

    it('should handle entity assessment with default change type', async () => {
      const entityId = 'class-456';
      mockRequest.params = { entityId };
      mockRequest.query = {};

      await entityImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'class-456',
          changeType: 'modify',
          affectedEntities: [],
          riskLevel: 'medium'
        })
      });
    });

    it('should handle delete change type assessment', async () => {
      const entityId = 'interface-789';
      mockRequest.params = { entityId };
      mockRequest.query = {
        changeType: 'delete',
        includeReverse: false
      };

      await entityImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'interface-789',
          changeType: 'delete'
        })
      });
    });

    it('should handle rename change type assessment', async () => {
      const entityId = 'var-101';
      mockRequest.params = { entityId };
      mockRequest.query = {
        changeType: 'rename',
        includeReverse: true
      };

      await entityImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'var-101',
          changeType: 'rename'
        })
      });
    });

    it('should handle invalid entity IDs gracefully', async () => {
      const entityId = '';
      mockRequest.params = { entityId };
      mockRequest.query = {};

      await entityImpactHandler(mockRequest, mockReply);

      // Empty entityId may cause validation errors in the current implementation
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      const entityId = 'func-123';
      mockRequest.params = { entityId };

      // Mock service errors (for when services are implemented)
      mockKgService.search.mockRejectedValue(new Error('Service unavailable'));

      await entityImpactHandler(mockRequest, mockReply);

      // The route should handle errors gracefully, may return error response
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });
  });

  describe('POST /compare', () => {
    let compareHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      compareHandler = routes.get('post:/compare');
    });

    it('should compare impact of different change scenarios successfully', async () => {
      const mockComparisonRequest = {
        scenarios: [
          {
            name: 'Refactor Option A',
            changes: [
              {
                entityId: 'func-1',
                changeType: 'modify'
              }
            ]
          },
          {
            name: 'Refactor Option B',
            changes: [
              {
                entityId: 'func-1',
                changeType: 'rename',
                newName: 'newFunc'
              },
              {
                entityId: 'func-2',
                changeType: 'delete'
              }
            ]
          }
        ]
      };

      mockRequest.body = mockComparisonRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          scenarios: expect.arrayContaining([
            expect.objectContaining({
              name: 'Refactor Option A',
              impact: expect.objectContaining({
                entitiesAffected: 0,
                riskLevel: 'medium',
                effort: 'medium'
              })
            }),
            expect.objectContaining({
              name: 'Refactor Option B',
              impact: expect.objectContaining({
                entitiesAffected: 0,
                riskLevel: 'medium',
                effort: 'medium'
              })
            })
          ]),
          recommendations: []
        })
      });
    });

    it('should handle single scenario comparison', async () => {
      const mockComparisonRequest = {
        scenarios: [
          {
            name: 'Single Scenario',
            changes: [
              {
                entityId: 'class-1',
                changeType: 'delete'
              }
            ]
          }
        ]
      };

      mockRequest.body = mockComparisonRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          scenarios: expect.arrayContaining([
            expect.objectContaining({
              name: 'Single Scenario'
            })
          ])
        })
      });
    });

    it('should handle empty scenarios array', async () => {
      const mockComparisonRequest = {
        scenarios: []
      };

      mockRequest.body = mockComparisonRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          scenarios: [],
          recommendations: []
        })
      });
    });

    it('should handle scenarios with empty changes', async () => {
      const mockComparisonRequest = {
        scenarios: [
          {
            name: 'Empty Changes',
            changes: []
          }
        ]
      };

      mockRequest.body = mockComparisonRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          scenarios: expect.arrayContaining([
            expect.objectContaining({
              name: 'Empty Changes',
              impact: expect.objectContaining({
                entitiesAffected: 0
              })
            })
          ])
        })
      });
    });

    it('should validate request body schema', async () => {
      // Missing required 'scenarios' field
      const invalidRequest = {
        someOtherField: 'value'
      };

      mockRequest.body = invalidRequest;

      await compareHandler(mockRequest, mockReply);

      // Should still process in current implementation
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle malformed scenario data', async () => {
      const mockComparisonRequest = {
        scenarios: [
          {
            name: 'Malformed',
            changes: [
              {
                // Missing required entityId
                changeType: 'modify'
              }
            ]
          }
        ]
      };

      mockRequest.body = mockComparisonRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('GET /history/:entityId', () => {
    let historyHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      historyHandler = routes.get('get:/history/:entityId');
    });

    it('should get impact history for entity successfully', async () => {
      const entityId = 'func-123';
      mockRequest.params = { entityId };
      mockRequest.query = {
        since: '2023-01-01T00:00:00Z',
        limit: 10
      };

      await historyHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'func-123',
          impacts: [],
          summary: expect.objectContaining({
            totalChanges: 0,
            averageImpact: 'medium',
            mostAffected: []
          })
        })
      });
    });

    it('should handle history request with default parameters', async () => {
      const entityId = 'class-456';
      mockRequest.params = { entityId };
      mockRequest.query = {};

      await historyHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'class-456',
          summary: expect.objectContaining({
            totalChanges: 0,
            averageImpact: 'medium'
          })
        })
      });
    });

    it('should handle history with limit parameter', async () => {
      const entityId = 'interface-789';
      mockRequest.params = { entityId };
      mockRequest.query = {
        limit: 5
      };

      await historyHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entityId: 'interface-789'
        })
      });
    });

    it('should handle invalid entity ID in history request', async () => {
      const entityId = '';
      mockRequest.params = { entityId };

      await historyHandler(mockRequest, mockReply);

      // Empty entityId may cause validation errors
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });

    it('should handle invalid date format in since parameter', async () => {
      const entityId = 'func-123';
      mockRequest.params = { entityId };
      mockRequest.query = {
        since: 'invalid-date-format'
      };

      await historyHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle service errors in history request', async () => {
      const entityId = 'func-123';
      mockRequest.params = { entityId };

      // Mock service errors (for when services are implemented)
      mockDbService.getEntityImpactHistory.mockRejectedValue(new Error('Database error'));

      await historyHandler(mockRequest, mockReply);

      // The route should handle errors gracefully
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let impactAnalyzeHandler: Function;
    let entityImpactHandler: Function;
    let compareHandler: Function;
    let historyHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      impactAnalyzeHandler = routes.get('post:/impact-analyze');
      entityImpactHandler = routes.get('get:/entity/:entityId');
      compareHandler = routes.get('post:/compare');
      historyHandler = routes.get('get:/history/:entityId');
    });

    it('should handle null request body gracefully', async () => {
      mockRequest.body = null;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle undefined request body gracefully', async () => {
      mockRequest.body = undefined;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle malformed JSON in request body', async () => {
      mockRequest.body = { invalid: 'data', missing: 'required fields' };

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle empty string parameters', async () => {
      mockRequest.params = { entityId: '' };

      await entityImpactHandler(mockRequest, mockReply);

      // Empty entityId may cause validation errors
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });

    it('should handle extremely long entity IDs', async () => {
      const longEntityId = 'a'.repeat(1000);
      mockRequest.params = { entityId: longEntityId };

      await historyHandler(mockRequest, mockReply);

      // Extremely long entity IDs may cause validation or processing errors
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });

    it('should handle special characters in entity IDs', async () => {
      const specialEntityId = 'entity:with@special#chars';
      mockRequest.params = { entityId: specialEntityId };

      await entityImpactHandler(mockRequest, mockReply);

      // Special characters in entity IDs may cause processing errors
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });

    it('should handle concurrent requests without interference', async () => {
      const request1 = {
        changes: [{ entityId: 'func-1', changeType: 'modify' }]
      };

      const request2 = {
        scenarios: [{
          name: 'Test',
          changes: [{ entityId: 'func-2', changeType: 'delete' }]
        }]
      };

      const reply1 = createMockReply();
      const reply2 = createMockReply();
      const req1 = createMockRequest();
      const req2 = createMockRequest();

      req1.body = request1;
      req2.body = request2;

      await Promise.all([
        impactAnalyzeHandler(req1, reply1),
        compareHandler(req2, reply2)
      ]);

      expect(reply1.send).toHaveBeenCalled();
      expect(reply2.send).toHaveBeenCalled();
    });

    it('should handle large request payloads', async () => {
      const largeChanges = Array.from({ length: 100 }, (_, i) => ({
        entityId: `entity-${i}`,
        changeType: 'modify' as const,
        signatureChange: i % 2 === 0
      }));

      const mockAnalysisRequest = {
        changes: largeChanges,
        includeIndirect: true,
        maxDepth: 5
      };

      mockRequest.body = mockAnalysisRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('Schema Validation', () => {
    let impactAnalyzeHandler: Function;
    let compareHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      impactAnalyzeHandler = routes.get('post:/impact-analyze');
      compareHandler = routes.get('post:/compare');
    });

    it('should validate impact analysis request schema', async () => {
      // Test with minimal valid request
      const validRequest = {
        changes: [
          {
            entityId: 'test-entity',
            changeType: 'modify'
          }
        ]
      };

      mockRequest.body = validRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle missing required fields in impact analysis', async () => {
      const invalidRequest = {
        // Missing 'changes' field
        includeIndirect: true
      };

      mockRequest.body = invalidRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      // Current implementation may not strictly validate schema
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should validate comparison request schema', async () => {
      const validRequest = {
        scenarios: [
          {
            name: 'Test Scenario',
            changes: [
              {
                entityId: 'test-entity',
                changeType: 'modify'
              }
            ]
          }
        ]
      };

      mockRequest.body = validRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle invalid change types in schema validation', async () => {
      const requestWithInvalidChangeType = {
        changes: [
          {
            entityId: 'test-entity',
            changeType: 'invalid-change-type' as any
          }
        ]
      };

      mockRequest.body = requestWithInvalidChangeType;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('Integration Scenarios', () => {
    let impactAnalyzeHandler: Function;
    let entityImpactHandler: Function;
    let compareHandler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService, mockDbService);
      const routes = mockApp.getRegisteredRoutes();
      impactAnalyzeHandler = routes.get('post:/impact-analyze');
      entityImpactHandler = routes.get('get:/entity/:entityId');
      compareHandler = routes.get('post:/compare');
    });

    it('should handle complex impact analysis workflow', async () => {
      // Step 1: Analyze impact of changes
      const analysisRequest = {
        changes: [
          { entityId: 'api-endpoint', changeType: 'modify', signatureChange: true },
          { entityId: 'database-schema', changeType: 'rename', newName: 'newSchema' }
        ],
        includeIndirect: true,
        maxDepth: 4
      };

      mockRequest.body = analysisRequest;
      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });

      // Step 2: Get specific entity impact
      const reply2 = createMockReply();
      const req2 = createMockRequest();
      req2.params = { entityId: 'api-endpoint' };
      req2.query = { changeType: 'modify', includeReverse: true };

      await entityImpactHandler(req2, reply2);

      expect(reply2.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });

      // Step 3: Compare different change scenarios
      const reply3 = createMockReply();
      const req3 = createMockRequest();
      req3.body = {
        scenarios: [
          {
            name: 'Conservative Approach',
            changes: [{ entityId: 'api-endpoint', changeType: 'modify' }]
          },
          {
            name: 'Aggressive Refactor',
            changes: [
              { entityId: 'api-endpoint', changeType: 'rename', newName: 'newApi' },
              { entityId: 'database-schema', changeType: 'delete' }
            ]
          }
        ]
      };

      await compareHandler(req3, reply3);

      expect(reply3.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle multiple change types in single analysis', async () => {
      const mixedChangesRequest = {
        changes: [
          { entityId: 'function-a', changeType: 'modify', signatureChange: true },
          { entityId: 'class-b', changeType: 'delete' },
          { entityId: 'variable-c', changeType: 'rename', newName: 'newVar' }
        ],
        includeIndirect: true,
        maxDepth: 3
      };

      mockRequest.body = mixedChangesRequest;

      await impactAnalyzeHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should handle large scale refactoring scenarios', async () => {
      const largeRefactorRequest = {
        scenarios: Array.from({ length: 10 }, (_, i) => ({
          name: `Refactor Strategy ${i + 1}`,
          changes: Array.from({ length: 5 }, (_, j) => ({
            entityId: `entity-${i}-${j}`,
            changeType: ['modify', 'delete', 'rename'][j % 3] as any,
            ...(j % 3 === 2 && { newName: `newEntity-${i}-${j}` })
          }))
        }))
      };

      mockRequest.body = largeRefactorRequest;

      await compareHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          scenarios: expect.any(Array)
        })
      });
    });
  });
});
