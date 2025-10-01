import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TestPlanningService,
  SpecNotFoundError,
  TestPlanningValidationError,
} from '@memento/testing/TestPlanningService';
import { RelationshipType, type GraphRelationship } from '@memento/shared-types';
import type { Spec, Test, Symbol } from '@memento/shared-types';
import type { TestPlanRequest } from '@memento/shared-types';

describe('TestPlanningService', () => {
  const now = new Date('2024-03-20T12:00:00Z');
  let kgServiceMock: {
    getEntity: ReturnType<typeof vi.fn>;
    getRelationships: ReturnType<typeof vi.fn>;
  };
  let service: TestPlanningService;

  beforeEach(() => {
    kgServiceMock = {
      getEntity: vi.fn(),
      getRelationships: vi.fn(),
    };
    service = new TestPlanningService(kgServiceMock as any);
  });

  it('builds spec-aware plan using relationships and existing tests', async () => {
    const spec: Spec = {
      id: 'spec-checkout',
      type: 'spec',
      title: 'Checkout Workflow',
      description: 'Ensure checkout flow handles success and failure paths.',
      acceptanceCriteria: [
        'AC-1: Order succeeds with valid payment',
        'AC-2: Order fails with declined card',
      ],
      status: 'approved',
      priority: 'high',
      assignee: 'team-payments',
      tags: ['checkout', 'payments'],
      updated: now,
      path: 'Docs/checkout.md',
      hash: 'spec-hash',
      language: 'markdown',
      lastModified: now,
      created: now,
      metadata: {},
    } as Spec;

    const symbolEntity: Symbol = {
      id: 'symbol-charge',
      type: 'symbol',
      name: 'chargeCustomer',
      kind: 'function',
      signature: 'async function chargeCustomer(order: Order)',
      docstring: 'Charges a customer for an order',
      visibility: 'public',
      isExported: true,
      isDeprecated: false,
      path: 'src/services/payments.ts',
      hash: 'symbol-hash',
      language: 'typescript',
      lastModified: now,
      created: now,
      metadata: {},
    } as unknown as Symbol;

    const testEntity: Test = {
      id: 'test-checkout',
      type: 'test',
      path: 'tests/integration/checkout.test.ts',
      hash: 'test-hash',
      language: 'typescript',
      lastModified: now,
      created: now,
      testType: 'integration',
      targetSymbol: 'symbol-charge',
      framework: 'vitest',
      coverage: { lines: 68, branches: 54, functions: 60, statements: 62 },
      status: 'passing',
      flakyScore: 0.15,
      lastRunAt: now,
      lastDuration: 145,
      executionHistory: [],
      performanceMetrics: {
        averageExecutionTime: 145,
        p95ExecutionTime: 210,
        successRate: 1,
        trend: 'stable',
        benchmarkComparisons: [],
        historicalData: [],
      },
      dependencies: ['symbol-charge'],
      tags: ['checkout'],
      metadata: {},
    } as Test;

    const specRelationship: GraphRelationship = {
      id: 'rel-spec-symbol',
      fromEntityId: spec.id,
      toEntityId: symbolEntity.id,
      type: RelationshipType.IMPLEMENTS_SPEC,
      created: now,
      lastModified: now,
      version: 1,
      metadata: {
        acceptanceCriteriaId: 'AC-1',
        priority: 'high',
        impactLevel: 'critical',
        rationale: 'chargeCustomer implements payment success path',
      },
    };

    const testRelationship: GraphRelationship = {
      id: 'rel-test-spec',
      fromEntityId: testEntity.id,
      toEntityId: spec.id,
      type: RelationshipType.VALIDATES,
      created: now,
      lastModified: now,
      version: 1,
      metadata: {
        acceptanceCriteriaIds: ['AC-1'],
      },
    };

    kgServiceMock.getEntity.mockImplementation(async (id: string) => {
      if (id === spec.id) return spec;
      if (id === symbolEntity.id) return symbolEntity;
      if (id === testEntity.id) return testEntity;
      return null;
    });

    kgServiceMock.getRelationships.mockImplementation(async (query: any) => {
      if (query.fromEntityId === spec.id) {
        return [specRelationship];
      }
      if (query.toEntityId === spec.id && query.type === RelationshipType.VALIDATES) {
        return [testRelationship];
      }
      return [];
    });

    const request: TestPlanRequest = {
      specId: spec.id,
      includePerformanceTests: true,
      includeSecurityTests: true,
    };

    const result = await service.planTests(request);

    expect(result.changedFiles).toEqual([
      'src/services/payments.ts',
      'tests/integration/checkout.test.ts',
    ]);
    expect(result.estimatedCoverage.lines).toBeGreaterThan(70);
    expect(result.testPlan.unitTests).toHaveLength(2);
    expect(result.testPlan.unitTests[0].name).toContain('[AC-1]');
    expect(result.testPlan.integrationTests.some((spec) =>
      spec.name.toLowerCase().includes('security')
    )).toBe(true);
    expect(result.testPlan.performanceTests).toHaveLength(1);
  });

  it('throws SpecNotFoundError when specification is missing', async () => {
    kgServiceMock.getEntity.mockResolvedValue(null);

    await expect(
      service.planTests({ specId: 'missing-spec' })
    ).rejects.toBeInstanceOf(SpecNotFoundError);
  });

  it('validates that specId is provided', async () => {
    await expect(
      service.planTests({ specId: '' } as TestPlanRequest)
    ).rejects.toBeInstanceOf(TestPlanningValidationError);
  });
});
