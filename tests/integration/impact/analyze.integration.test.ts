import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { v4 as uuid } from 'uuid';
import { registerImpactRoutes } from '../../../src/api/routes/impact.js';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import { RelationshipType } from '../../../src/models/relationships.js';
import type { CodebaseEntity, DocumentationNode, Spec, Test } from '../../../src/models/entities.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
} from '../../test-utils/database-helpers.js';
import type { DatabaseService } from '../../../src/services/core/DatabaseService.js';

const now = () => new Date();

const createFunctionEntity = (id: string, name: string, path: string): CodebaseEntity & {
  type: 'symbol';
  kind: 'function';
  signature: string;
  docstring: string;
  visibility: 'public';
  isExported: boolean;
  isDeprecated: boolean;
} => ({
  id,
  type: 'symbol',
  kind: 'function',
  name,
  path,
  hash: `${id}-hash`,
  language: 'typescript',
  lastModified: now(),
  created: now(),
  signature: `function ${name}()`,
  docstring: '',
  visibility: 'public',
  isExported: true,
  isDeprecated: false,
});

const createTransitiveEntity = (id: string, name: string): CodebaseEntity & {
  type: 'symbol';
  kind: 'function';
  signature: string;
  docstring: string;
  visibility: 'public';
  isExported: boolean;
  isDeprecated: boolean;
} =>
  createFunctionEntity(id, name, `src/${name}.ts`);

const createTestEntity = (id: string, targetSymbol: string): Test => ({
  id,
  type: 'test',
  path: `tests/${id}.spec.ts`,
  hash: `${id}-hash`,
  language: 'typescript',
  lastModified: now(),
  created: now(),
  testType: 'unit',
  targetSymbol,
  framework: 'vitest',
  coverage: { lines: 85, branches: 80, functions: 82, statements: 84 },
  status: 'passing',
  flakyScore: 0.1,
  executionHistory: [],
  performanceMetrics: {
    averageExecutionTime: 90,
    p95ExecutionTime: 120,
    successRate: 1,
    trend: 'stable',
    benchmarkComparisons: [],
    historicalData: [],
  },
  dependencies: [],
  tags: [],
});

const createDocumentationEntity = (id: string, title: string): DocumentationNode => ({
  id,
  type: 'documentation',
  title,
  content: '# Impact Guide',
  docType: 'api-docs',
  businessDomains: [],
  stakeholders: [],
  technologies: [],
  status: 'deprecated',
  docVersion: '1.0.0',
  docHash: `${id}-hash`,
  docIntent: 'ai-context',
  docSource: 'manual',
  path: `docs/${title.replace(/\s+/g, '-').toLowerCase()}.md`,
  hash: `${id}-hash`,
  language: 'markdown',
  lastModified: now(),
  created: now(),
});

const createSpecEntity = (id: string): Spec => ({
  id,
  type: 'spec',
  title: 'Critical Graph Propagation',
  description: 'Ensure cascading impact analysis updates downstream specs.',
  acceptanceCriteria: ['AC-1: Update dependent entities'],
  status: 'approved',
  priority: 'critical',
  assignee: 'team-alpha',
  tags: ['impact'],
  updated: now(),
  path: 'docs/specs/impact.md',
  name: 'Critical Graph Propagation',
  hash: `${id}-hash`,
  language: 'markdown',
  lastModified: now(),
  created: now(),
});

describe('Impact analyze route (integration)', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let app: ReturnType<typeof Fastify> | undefined;

  beforeAll(async () => {
    dbService = await setupTestDatabase({ silent: true });
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close().catch(() => {});
      app = undefined;
    }
    if (dbService) {
      await cleanupTestDatabase(dbService);
    }
  });

  beforeEach(async () => {
    await clearTestData(dbService, { silent: true });

    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
    await kgService.initialize();

    app = Fastify();
    await registerImpactRoutes(app, kgService, dbService);
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('returns graph-backed analysis derived from seeded knowledge graph data', async () => {
    const baseEntity = createFunctionEntity('symbol-base', 'calculateImpact', 'src/calc.ts');
    const dependentEntity = createFunctionEntity('symbol-dependent', 'dependentOne', 'src/dep.ts');
    const cascadingEntity = createTransitiveEntity('symbol-cascade', 'cascadingConsumer');
    const docEntity = createDocumentationEntity('doc-impact', 'Impact Guidelines');
    const testEntity = createTestEntity('test-impact', baseEntity.id);
    const specEntity = createSpecEntity('spec-impact');

    await kgService.createEntity(baseEntity, { skipEmbedding: true });
    await kgService.createEntity(dependentEntity, { skipEmbedding: true });
    await kgService.createEntity(cascadingEntity, { skipEmbedding: true });
    await kgService.createEntity(docEntity, { skipEmbedding: true });
    await kgService.createEntity(testEntity, { skipEmbedding: true });
    await kgService.createEntity(specEntity, { skipEmbedding: true });

    const timestamp = now();

    await kgService.createRelationship({
      id: uuid(),
      fromEntityId: dependentEntity.id,
      toEntityId: baseEntity.id,
      type: RelationshipType.CALLS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: { confidence: 0.9 },
    });

    await kgService.createRelationship({
      id: uuid(),
      fromEntityId: cascadingEntity.id,
      toEntityId: dependentEntity.id,
      type: RelationshipType.CALLS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: { confidence: 0.7 },
    });

    await kgService.createRelationship({
      id: uuid(),
      fromEntityId: testEntity.id,
      toEntityId: baseEntity.id,
      type: RelationshipType.TESTS,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: { coverage: 82 },
    });

    await kgService.createRelationship({
      id: uuid(),
      fromEntityId: docEntity.id,
      toEntityId: baseEntity.id,
      type: RelationshipType.DOCUMENTED_BY,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: { stalenessScore: 0.85 },
    });

    await kgService.createRelationship({
      id: uuid(),
      fromEntityId: specEntity.id,
      toEntityId: baseEntity.id,
      type: RelationshipType.REQUIRES,
      created: timestamp,
      lastModified: timestamp,
      version: 1,
      metadata: {
        priority: 'critical',
        impactLevel: 'high',
        acceptanceCriteriaId: 'AC-1',
        ownerTeam: 'team-alpha',
      },
    });

    if (!app) throw new Error('Fastify app not initialized');

    const response = await app.inject({
      method: 'POST',
      url: '/impact/analyze',
      payload: {
        changes: [
          {
            entityId: baseEntity.id,
            changeType: 'modify',
            signatureChange: true,
          },
        ],
        includeIndirect: true,
        maxDepth: 3,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);

    const directIds = body.data.directImpact.flatMap((entry: any) =>
      (entry.entities || []).map((entity: any) => entity.id),
    );
    expect(directIds).toContain(dependentEntity.id);

    const cascadingIds = body.data.cascadingImpact.flatMap((entry: any) =>
      (entry.entities || []).map((entity: any) => entity.id),
    );
    expect(cascadingIds).toContain(cascadingEntity.id);

    const affectedTests = (body.data.testImpact?.affectedTests || []).map(
      (entity: any) => entity.id,
    );
    expect(affectedTests).toContain(testEntity.id);
    expect(body.data.testImpact.coverageImpact).toBeGreaterThan(0);

    const staleDocs = (body.data.documentationImpact?.staleDocs || []).map(
      (doc: any) => doc.docId,
    );
    expect(staleDocs).toContain(docEntity.id);
    expect(body.data.documentationImpact.freshnessPenalty).toBeGreaterThan(0);

    expect(body.data.specImpact.relatedSpecs.map((spec: any) => spec.specId)).toContain(
      specEntity.id,
    );
    expect(body.data.specImpact.summary.byPriority.critical).toBeGreaterThan(0);

    expect(body.data.recommendations.length).toBeGreaterThan(0);
    expect(body.data.deploymentGate.level).toBe('advisory');
  });

  it('rejects invalid requests lacking entity identifiers', async () => {
    if (!app) throw new Error('Fastify app not initialized');

    const response = await app.inject({
      method: 'POST',
      url: '/impact/analyze',
      payload: {
        changes: [
          {
            changeType: 'modify',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'FST_ERR_VALIDATION',
      }),
    );
  });
});
