/**
 * Unit tests for Impact routes
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerImpactRoutes } from '../../../../src/api/routes/impact.js';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply,
} from '../../../test-utils.js';
import type { ImpactAnalysis } from '../../../../src/models/types.js';
import { RelationshipType } from '../../../../src/models/relationships.js';

const baseEntity = {
  id: 'symbol-1',
  type: 'symbol',
  name: 'calculateImpact',
  path: 'src/calc.ts',
};

const highImpactAnalysis: ImpactAnalysis = {
  directImpact: [
    {
      entities: [
        {
          id: 'dep-1',
          type: 'symbol',
          name: 'dependentOne',
          path: 'src/dep.ts',
        } as any,
      ],
      severity: 'high',
      reason: 'High severity dependency',
    },
  ],
  cascadingImpact: [
    {
      level: 2,
      entities: [
        {
          id: 'cascade-1',
          type: 'symbol',
          name: 'cascadeEntity',
        } as any,
      ],
      relationship: RelationshipType.CALLS,
      confidence: 0.75,
    },
  ],
  testImpact: {
    affectedTests: [
      {
        id: 'test-1',
        type: 'test',
        path: 'tests/test-calc.spec.ts',
      } as any,
    ],
    requiredUpdates: ['Update impacted tests'],
    coverageImpact: 45,
  },
  documentationImpact: {
    staleDocs: [
      {
        docId: 'doc-1',
        title: 'API Guide',
        status: 'deprecated',
        relationship: 'DOCUMENTED_BY',
      },
    ],
    missingDocs: [],
    requiredUpdates: ['Refresh documentation'],
    freshnessPenalty: 2,
  },
  deploymentGate: {
    blocked: false,
    level: 'advisory',
    reasons: ['1 stale documentation artefact'],
    stats: { missingDocs: 0, staleDocs: 1, freshnessPenalty: 2 },
  },
  specImpact: {
    relatedSpecs: [
      {
        specId: 'spec-1',
        spec: {
          id: 'spec-1',
          title: 'Critical Spec',
          priority: 'critical',
          status: 'approved',
          assignee: 'team-alpha',
          tags: ['impact'],
        },
        priority: 'critical',
        impactLevel: 'high',
        status: 'approved',
        ownerTeams: ['team-alpha'],
        acceptanceCriteriaIds: ['AC-1'],
        relationships: [
          {
            type: RelationshipType.REQUIRES,
            impactLevel: 'high',
            priority: 'critical',
            acceptanceCriteriaId: 'AC-1',
            ownerTeam: 'team-alpha',
            confidence: 0.9,
            status: 'approved',
          },
        ],
      },
    ],
    requiredUpdates: ['Resolve critical spec Critical Spec (approved) before merging.'],
    summary: {
      byPriority: { critical: 1, high: 0, medium: 0, low: 0 },
      byImpactLevel: { critical: 0, high: 1, medium: 0, low: 0 },
      statuses: { draft: 0, approved: 1, implemented: 0, deprecated: 0, unknown: 0 },
      acceptanceCriteriaReferences: 1,
      pendingSpecs: 1,
    },
  },
  recommendations: [
    {
      priority: 'immediate',
      description: 'Resolve the high-risk dependency before merging.',
      effort: 'high',
      impact: 'breaking',
      type: 'warning',
      actions: ['dep-1'],
    },
  ],
};

const lowImpactAnalysis: ImpactAnalysis = {
  directImpact: [
    {
      entities: [
        {
          id: 'dep-low',
          type: 'symbol',
          name: 'lowDependent',
        } as any,
      ],
      severity: 'low',
      reason: 'Low severity change',
    },
  ],
  cascadingImpact: [],
  testImpact: {
    affectedTests: [],
    requiredUpdates: [],
    coverageImpact: 0,
  },
  documentationImpact: {
    staleDocs: [],
    missingDocs: [],
    requiredUpdates: [],
    freshnessPenalty: 0,
  },
  deploymentGate: {
    blocked: false,
    level: 'none',
    reasons: [],
    stats: { missingDocs: 0, staleDocs: 0, freshnessPenalty: 0 },
  },
  specImpact: {
    relatedSpecs: [],
    requiredUpdates: [],
    summary: {
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
      byImpactLevel: { critical: 0, high: 0, medium: 0, low: 0 },
      statuses: { draft: 0, approved: 0, implemented: 0, deprecated: 0, unknown: 0 },
      acceptanceCriteriaReferences: 0,
      pendingSpecs: 0,
    },
  },
  recommendations: [
    {
      priority: 'optional',
      description: 'Consider a follow-up cleanup.',
      effort: 'low',
      impact: 'cosmetic',
      type: 'suggestion',
      actions: [],
    },
  ],
};

const cloneAnalysis = (analysis: ImpactAnalysis): ImpactAnalysis =>
  JSON.parse(JSON.stringify(analysis));

describe('Impact Routes', () => {
  let mockApp: any;
  let mockKgService: {
    analyzeImpact: ReturnType<typeof vi.fn>;
    findRecentEntityIds: ReturnType<typeof vi.fn>;
    getEntity: ReturnType<typeof vi.fn>;
  };
  let mockDbService: { postgresQuery: ReturnType<typeof vi.fn> };
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  const createMockApp = () => {
    const routes = new Map<string, Function>();

    const registerRoute = (method: string, path: string, handler: Function) => {
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
      getRegisteredRoutes: () => routes,
    };
  };

  beforeEach(() => {
    mockApp = createMockApp();

    mockKgService = {
      analyzeImpact: vi.fn().mockResolvedValue(cloneAnalysis(lowImpactAnalysis)),
      findRecentEntityIds: vi.fn().mockResolvedValue([]),
      getEntity: vi.fn().mockResolvedValue(baseEntity),
    };

    mockDbService = {
      postgresQuery: vi.fn().mockResolvedValue({ rows: [] }),
    };

    mockRequest = createMockRequest();
    mockReply = createMockReply();

    vi.clearAllMocks();
  });

  describe('Route registration', () => {
    it('registers expected routes', async () => {
      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);

      const routes = mockApp.getRegisteredRoutes();
      expect(routes.has('post:/impact/analyze')).toBe(true);
      expect(routes.has('get:/impact/changes')).toBe(true);
      expect(routes.has('get:/impact/entity/:entityId')).toBe(true);
      expect(routes.has('post:/impact/simulate')).toBe(true);
      expect(routes.has('get:/impact/history/:entityId')).toBe(true);
    });
  });

  describe('POST /impact/analyze', () => {
    let handler: Function;

    beforeEach(async () => {
      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);
      handler = mockApp.getRegisteredRoutes().get('post:/impact/analyze');
    });

    it('returns analysis from knowledge graph service', async () => {
      const body = {
        changes: [
          {
            entityId: 'symbol-1',
            changeType: 'modify' as const,
          },
        ],
        includeIndirect: true,
        maxDepth: 12,
      };

      mockRequest.body = body;

      await handler(mockRequest, mockReply);

      expect(mockKgService.analyzeImpact).toHaveBeenCalledWith(body.changes, {
        includeIndirect: true,
        maxDepth: 8,
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: cloneAnalysis(lowImpactAnalysis),
      });
    });

    it('rejects empty change lists with 400', async () => {
      mockRequest.body = {
        changes: [],
      };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Changes array is required',
        },
      });
      expect(mockKgService.analyzeImpact).not.toHaveBeenCalled();
    });

    it('handles service errors gracefully', async () => {
      mockKgService.analyzeImpact.mockRejectedValueOnce(new Error('boom'));

      mockRequest.body = {
        changes: [
          {
            entityId: 'symbol-2',
            changeType: 'delete' as const,
          },
        ],
      };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'IMPACT_ANALYSIS_FAILED',
          message: 'Failed to analyze change impact',
        },
      });
    });
  });

  describe('GET /impact/changes', () => {
    let handler: Function;

    beforeEach(async () => {
      mockKgService.findRecentEntityIds.mockResolvedValue(['symbol-1', 'symbol-2']);
      mockKgService.analyzeImpact
        .mockResolvedValueOnce(cloneAnalysis(highImpactAnalysis))
        .mockResolvedValueOnce(cloneAnalysis(lowImpactAnalysis));
      mockKgService.getEntity.mockImplementation(async (id: string) => ({
        id,
        type: 'symbol',
        name: `${id}-name`,
        path: `src/${id}.ts`,
      }));

      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);
      handler = mockApp.getRegisteredRoutes().get('get:/impact/changes');
    });

    it('returns aggregated recent changes', async () => {
      mockRequest.query = {
        since: new Date().toISOString(),
        limit: 5,
        maxDepth: 12,
      };

      await handler(mockRequest, mockReply);

      expect(mockKgService.findRecentEntityIds).toHaveBeenCalled();
      expect(mockKgService.analyzeImpact).toHaveBeenCalledTimes(2);

      const payload = mockReply.send.mock.calls[0]?.[0];
      expect(payload).toEqual({
        success: true,
        data: expect.objectContaining({
          analyzedEntities: 2,
          riskSummary: {
            critical: 1,
            high: 0,
            medium: 0,
            low: 1,
          },
          records: expect.arrayContaining([
            expect.objectContaining({
              entity: expect.objectContaining({ id: 'symbol-1' }),
              riskLevel: 'critical',
            }),
            expect.objectContaining({
              entity: expect.objectContaining({ id: 'symbol-2' }),
              riskLevel: 'low',
            }),
          ]),
        }),
      });
    });

    it('rejects invalid date filters', async () => {
      mockRequest.query = { since: 'not-a-date' };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: "Query parameter 'since' must be a valid date-time",
        },
      });
    });
  });

  describe('GET /impact/entity/:entityId', () => {
    let handler: Function;

    beforeEach(async () => {
      mockKgService.analyzeImpact.mockResolvedValue(cloneAnalysis(highImpactAnalysis));
      mockKgService.getEntity.mockResolvedValue({ ...baseEntity });

      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);
      handler = mockApp.getRegisteredRoutes().get('get:/impact/entity/:entityId');
    });

    it('returns analysis details with metrics and risk level', async () => {
      mockRequest.params = { entityId: 'symbol-1' };
      mockRequest.query = {
        changeType: 'delete',
        includeIndirect: false,
        maxDepth: 11,
        signatureChange: true,
      };

      await handler(mockRequest, mockReply);

      expect(mockKgService.analyzeImpact).toHaveBeenCalledWith(
        [
          {
            entityId: 'symbol-1',
            changeType: 'delete',
            signatureChange: true,
          },
        ],
        {
          includeIndirect: false,
          maxDepth: 8,
        },
      );

      const payload = mockReply.send.mock.calls[0]?.[0];
      expect(payload.success).toBe(true);
      expect(payload.data).toEqual(
        expect.objectContaining({
          entity: expect.objectContaining({ id: 'symbol-1' }),
          riskLevel: 'critical',
          metrics: expect.objectContaining({
            directDependents: 1,
            cascadingDependents: 1,
            impactedTests: 1,
          }),
          deploymentGate: expect.objectContaining({ level: 'advisory' }),
        }),
      );
    });
  });

  describe('POST /impact/simulate', () => {
    let handler: Function;

    beforeEach(async () => {
      mockKgService.analyzeImpact
        .mockResolvedValueOnce(cloneAnalysis(highImpactAnalysis))
        .mockResolvedValueOnce(cloneAnalysis(lowImpactAnalysis));

      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);
      handler = mockApp.getRegisteredRoutes().get('post:/impact/simulate');
    });

    it('compares scenarios and surfaces highest risk', async () => {
      mockRequest.body = {
        scenarios: [
          {
            name: 'High risk change',
            changes: [
              {
                entityId: 'symbol-high',
                changeType: 'modify' as const,
                signatureChange: true,
              },
            ],
            maxDepth: 9,
          },
          {
            name: 'Low risk change',
            changes: [
              {
                entityId: 'symbol-low',
                changeType: 'rename' as const,
              },
            ],
            includeIndirect: false,
          },
        ],
      };

      await handler(mockRequest, mockReply);

      expect(mockKgService.analyzeImpact).toHaveBeenCalledTimes(2);

      const payload = mockReply.send.mock.calls[0]?.[0];
      expect(payload.success).toBe(true);
      expect(payload.data.summary.highestRiskScenario).toEqual({
        name: 'High risk change',
        riskLevel: 'critical',
      });
    });

    it('rejects empty scenarios', async () => {
      mockRequest.body = { scenarios: [] };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'At least one scenario must be provided',
        },
      });
    });

    it('rejects scenarios without changes', async () => {
      mockRequest.body = {
        scenarios: [
          {
            name: 'Empty scenario',
            changes: [],
          },
        ],
      };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Scenarios must include at least one valid change',
        },
      });
    });
  });

  describe('GET /impact/history/:entityId', () => {
    let handler: Function;

    beforeEach(async () => {
      mockDbService.postgresQuery.mockResolvedValue({
        rows: [
          {
            id: 'doc-1',
            content: JSON.stringify(highImpactAnalysis),
            metadata: JSON.stringify({
              entityId: 'symbol-1',
              changeType: 'modify',
              timestamp: '2024-01-02T00:00:00.000Z',
              directImpactCount: 1,
              cascadingImpactCount: 1,
            }),
            created_at: '2024-01-02T00:00:00.000Z',
          },
        ],
      });

      await registerImpactRoutes(mockApp, mockKgService as any, mockDbService as any);
      handler = mockApp.getRegisteredRoutes().get('get:/impact/history/:entityId');
    });

    it('returns historical impact records', async () => {
      mockRequest.params = { entityId: 'symbol-1' };
      mockRequest.query = { limit: 5 };

      await handler(mockRequest, mockReply);

      expect(mockDbService.postgresQuery).toHaveBeenCalled();
      const payload = mockReply.send.mock.calls[0]?.[0];
      expect(payload.success).toBe(true);
      expect(payload.data).toEqual(
        expect.objectContaining({
          entityId: 'symbol-1',
          totalRecords: 1,
          records: expect.arrayContaining([
            expect.objectContaining({
              id: 'doc-1',
              riskLevel: 'critical',
              metrics: expect.objectContaining({
                directDependents: 1,
                specSummary: expect.objectContaining({
                  byPriority: expect.objectContaining({ critical: expect.any(Number) }),
                }),
              }),
            }),
          ]),
        }),
      );
    });

    it('rejects invalid since filter', async () => {
      mockRequest.params = { entityId: 'symbol-1' };
      mockRequest.query = { since: 'bad-date' };

      await handler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: "Query parameter 'since' must be a valid date-time",
        },
      });
    });
  });
});
