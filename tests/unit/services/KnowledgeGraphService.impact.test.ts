import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { RelationshipType, type GraphRelationship } from '../../../src/models/relationships.js';

const now = new Date();

const makeGraphRelationship = (
  overrides: Partial<GraphRelationship>,
): GraphRelationship => ({
  id: overrides.id ?? 'rel-' + Math.random().toString(36).slice(2),
  fromEntityId: overrides.fromEntityId ?? 'from',
  toEntityId: overrides.toEntityId ?? 'to',
  type: overrides.type ?? RelationshipType.CALLS,
  created: overrides.created ?? now,
  lastModified: overrides.lastModified ?? now,
  version: overrides.version ?? 1,
  metadata: overrides.metadata ?? {},
});

describe('KnowledgeGraphService.analyzeImpact', () => {
  let service: KnowledgeGraphService;

  const symbolEntity = {
    id: 'symbol-1',
    type: 'symbol' as const,
    name: 'calculateImpact',
    path: 'src/calc.ts',
    hash: 'hash',
    language: 'typescript',
    lastModified: now,
    created: now,
    signature: '() => void',
    docstring: '',
    visibility: 'public' as const,
    isExported: true,
    isDeprecated: false,
    kind: 'function' as const,
  };

  const dependentEntity = {
    id: 'symbol-2',
    type: 'symbol' as const,
    name: 'dependsOnCalculateImpact',
    path: 'src/dep.ts',
    hash: 'hash2',
    language: 'typescript',
    lastModified: now,
    created: now,
    signature: '() => void',
    docstring: '',
    visibility: 'public' as const,
    isExported: true,
    isDeprecated: false,
    kind: 'function' as const,
  };

  const cascadingEntity = {
    id: 'symbol-3',
    type: 'symbol' as const,
    name: 'transitiveConsumer',
    path: 'src/transitive.ts',
    hash: 'hash3',
    language: 'typescript',
    lastModified: now,
    created: now,
    signature: '() => void',
    docstring: '',
    visibility: 'public' as const,
    isExported: true,
    isDeprecated: false,
    kind: 'function' as const,
  };

  const testEntity = {
    id: 'test-1',
    type: 'test' as const,
    path: 'tests/test-calc.spec.ts',
    hash: 'hash4',
    language: 'typescript',
    lastModified: now,
    created: now,
    testType: 'unit' as const,
    targetSymbol: 'symbol-1',
    framework: 'vitest',
    coverage: { lines: 85, branches: 80, functions: 82, statements: 84 },
    status: 'passing' as const,
    flakyScore: 0.1,
    executionHistory: [],
    performanceMetrics: {
      averageExecutionTime: 120,
      p95ExecutionTime: 180,
      successRate: 1,
      trend: 'stable' as const,
      benchmarkComparisons: [],
      historicalData: [],
    },
    dependencies: [],
    tags: [],
  };

  const documentationEntity = {
    id: 'doc-1',
    type: 'documentation' as const,
    title: 'API Guide',
    content: '...',
    docType: 'api-docs' as const,
    businessDomains: [],
    stakeholders: [],
    technologies: [],
    status: 'deprecated' as const,
    docVersion: '1.0',
    docHash: 'doc-hash',
    docIntent: 'ai-context' as const,
    docSource: 'manual' as const,
    path: 'docs/api.md',
    hash: 'doc-hash',
    language: 'markdown',
    lastModified: now,
    created: now,
  };

  const specEntity = {
    id: 'spec-1',
    type: 'spec' as const,
    title: 'Critical Workflow Spec',
    description: 'Defines acceptance criteria for calculateImpact',
    acceptanceCriteria: ['AC-1: Update cascading graph'],
    status: 'approved' as const,
    priority: 'critical' as const,
    assignee: 'team-alpha',
    tags: ['impact', 'graph'],
    updated: now,
  };

  beforeEach(() => {
    service = new KnowledgeGraphService({} as any);
  });

  it('aggregates direct, cascading, test, and documentation impact', async () => {
    const getEntitySpy = vi
      .spyOn(service, 'getEntity')
      .mockImplementation(async (id: string) => {
        switch (id) {
          case 'symbol-1':
            return symbolEntity as any;
          case 'symbol-2':
            return dependentEntity as any;
          case 'symbol-3':
            return cascadingEntity as any;
          case 'test-1':
            return testEntity as any;
          case 'doc-1':
            return documentationEntity as any;
          case 'spec-1':
            return specEntity as any;
          default:
            return null;
        }
      });

    const getRelationshipsSpy = vi
      .spyOn(service as any, 'getRelationships')
      .mockImplementation(async (query: any) => {
        if (query.toEntityId === 'symbol-1' && Array.isArray(query.type)) {
          if (query.type.includes(RelationshipType.TESTS)) {
            return [
              makeGraphRelationship({
                id: 'test-rel',
                fromEntityId: 'test-1',
                toEntityId: 'symbol-1',
                type: RelationshipType.TESTS,
                metadata: { coverage: 90 },
              }),
            ];
          }
          if (query.type.includes(RelationshipType.DOCUMENTED_BY)) {
            return [
              makeGraphRelationship({
                id: 'doc-rel',
                fromEntityId: 'doc-1',
                toEntityId: 'symbol-1',
                type: RelationshipType.DOCUMENTED_BY,
                metadata: { stalenessScore: 0.8 },
              }),
            ];
          }
          if (query.type.includes(RelationshipType.CALLS)) {
            return [
              makeGraphRelationship({
                id: 'direct-rel',
                fromEntityId: 'symbol-2',
                toEntityId: 'symbol-1',
                type: RelationshipType.CALLS,
              }),
            ];
          }
        }

        if (
          query.toEntityId === 'symbol-1' &&
          Array.isArray(query.type) &&
          query.type.includes(RelationshipType.REQUIRES)
        ) {
          return [
            makeGraphRelationship({
              id: 'spec-rel',
              fromEntityId: 'spec-1',
              toEntityId: 'symbol-1',
              type: RelationshipType.REQUIRES,
              metadata: {
                priority: 'critical',
                impactLevel: 'high',
                acceptanceCriteriaId: 'AC-1',
                ownerTeam: 'team-alpha',
                rationale: 'Spec requires calculateImpact to propagate changes',
                status: 'approved',
              },
            }),
          ];
        }

        if (query.toEntityId === 'symbol-2' && Array.isArray(query.type) && query.type.includes(RelationshipType.CALLS)) {
          return [
            makeGraphRelationship({
              id: 'cascade-rel',
              fromEntityId: 'symbol-3',
              toEntityId: 'symbol-2',
              type: RelationshipType.CALLS,
            }),
          ];
        }

        return [];
      });

    const result = await service.analyzeImpact(
      [
        {
          entityId: 'symbol-1',
          changeType: 'modify',
          signatureChange: true,
        },
      ],
      { includeIndirect: true, maxDepth: 4 },
    );

    expect(getEntitySpy).toHaveBeenCalled();
    expect(getRelationshipsSpy).toHaveBeenCalled();

    expect(result.directImpact.length).toBeGreaterThan(0);
    expect(result.directImpact[0].entities[0]?.id).toBe('symbol-2');
    expect(result.testImpact.affectedTests.map((t) => t.id)).toContain('test-1');
    expect(result.documentationImpact.staleDocs.length).toBe(1);
    expect(result.cascadingImpact.some((entry) => entry.entities.some((entity) => entity.id === 'symbol-3'))).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.deploymentGate.stats.missingDocs).toBe(0);
    expect(result.specImpact.relatedSpecs[0]?.specId).toBe('spec-1');
    expect(result.specImpact.summary.byPriority.critical).toBeGreaterThan(0);
    expect(result.specImpact.requiredUpdates.length).toBeGreaterThan(0);
    expect(
      result.recommendations.some((rec) => /spec/i.test(rec.description)),
    ).toBe(true);
  });

  it('returns empty structure when no valid changes provided', async () => {
    const result = await service.analyzeImpact([], { includeIndirect: false });
    expect(result.directImpact).toHaveLength(0);
    expect(result.testImpact.affectedTests).toHaveLength(0);
    expect(result.documentationImpact.freshnessPenalty).toBe(0);
    expect(result.specImpact.summary.pendingSpecs).toBe(0);
    expect(result.specImpact.relatedSpecs).toHaveLength(0);
  });
});
