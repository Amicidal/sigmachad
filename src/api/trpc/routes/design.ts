/**
 * Design System tRPC Routes
 * Type-safe procedures for design specification workflows
 */

import { z } from 'zod';
import { router, publicProcedure, type TRPCContext } from '../base.js';
import { SpecService } from '../../../services/testing/SpecService.js';
import type { Spec } from '../../../models/entities.js';
import type { ListSpecsParams } from '../../../models/types.js';

const ValidationIssueSchema = z.object({
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']).default('warning'),
  rule: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  suggestion: z.string().optional(),
  field: z.string().optional(),
});

const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  suggestions: z.array(z.string()),
});

const CoverageMetricsSchema = z.object({
  lines: z.number(),
  branches: z.number(),
  functions: z.number(),
  statements: z.number(),
});

const TestCoverageSchema = z.object({
  entityId: z.string(),
  overallCoverage: CoverageMetricsSchema,
  testBreakdown: z.object({
    unitTests: CoverageMetricsSchema,
    integrationTests: CoverageMetricsSchema,
    e2eTests: CoverageMetricsSchema,
  }),
  uncoveredLines: z.array(z.number()),
  uncoveredBranches: z.array(z.number()),
  testCases: z.array(
    z.object({
      testId: z.string(),
      testName: z.string(),
      covers: z.array(z.string()),
    })
  ),
});

const SpecOutputSchema = z.object({
  id: z.string(),
  type: z.literal('spec'),
  path: z.string(),
  hash: z.string(),
  language: z.string(),
  created: z.date(),
  updated: z.date(),
  lastModified: z.date(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  status: z.enum(['draft', 'approved', 'implemented', 'deprecated']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const SpecInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  status: z.enum(['draft', 'approved', 'implemented', 'deprecated']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  path: z.string().optional(),
  hash: z.string().optional(),
  language: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created: z.union([z.date(), z.string()]).optional(),
  updated: z.union([z.date(), z.string()]).optional(),
  lastModified: z.union([z.date(), z.string()]).optional(),
});

const ListSpecsInputSchema = z.object({
  status: z.array(z.enum(['draft', 'approved', 'implemented', 'deprecated'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['created', 'updated', 'priority', 'status', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const SpecListResponseSchema = z.object({
  items: z.array(SpecOutputSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

const SpecDetailSchema = z.object({
  spec: SpecOutputSchema,
  relatedSpecs: z.array(SpecOutputSchema.partial()),
  affectedEntities: z.array(z.any()),
  testCoverage: TestCoverageSchema,
});

const ensureSpecService = (ctx: TRPCContext): SpecService => {
  const contextWithCache = ctx as TRPCContext & { __specService?: SpecService };
  if (!contextWithCache.__specService) {
    contextWithCache.__specService = new SpecService(ctx.kgService, ctx.dbService);
  }
  return contextWithCache.__specService;
};

const coerceDate = (value?: Date | string): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const buildSpecEntity = (input: z.infer<typeof SpecInputSchema>): Spec => {
  const now = new Date();
  return {
    id: input.id,
    type: 'spec',
    path: input.path ?? `specs/${input.id}`,
    hash: input.hash ?? '',
    language: input.language ?? 'text',
    created: coerceDate(input.created) ?? now,
    updated: coerceDate(input.updated) ?? now,
    lastModified: coerceDate(input.lastModified) ?? now,
    title: input.title,
    description: input.description,
    acceptanceCriteria: input.acceptanceCriteria,
    status: input.status ?? 'draft',
    priority: input.priority ?? 'medium',
    assignee: input.assignee ?? undefined,
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
  };
};

export const designRouter = router({
  validateSpec: publicProcedure
    .input(z.object({
      spec: z.record(z.any()),
      rules: z.array(z.string()).optional(),
    }))
    .output(ValidationResultSchema)
    .query(async ({ input, ctx }) => {
      const specService = ensureSpecService(ctx);
      const result = specService.validateDraft(input.spec);
      return {
        isValid: result.isValid,
        issues: result.issues.map((issue) => ({
          ...issue,
          field: issue.rule,
        })),
        suggestions: result.suggestions,
      };
    }),

  getTestCoverage: publicProcedure
    .input(z.object({
      entityId: z.string(),
      includeTestCases: z.boolean().optional(),
    }))
    .output(TestCoverageSchema)
    .query(async ({ input, ctx }) => {
      const specService = ensureSpecService(ctx);
      const { testCoverage } = await specService.getSpec(input.entityId);
      if (input.includeTestCases !== true) {
        return { ...testCoverage, testCases: [] };
      }
      return testCoverage;
    }),

  upsertSpec: publicProcedure
    .input(SpecInputSchema)
    .output(z.object({
      success: z.literal(true),
      created: z.boolean(),
      spec: SpecOutputSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const specService = ensureSpecService(ctx);
      const entity = buildSpecEntity(input);
      const { spec, created } = await specService.upsertSpec(entity);
      return {
        success: true,
        created,
        spec,
      };
    }),

  getSpec: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(SpecDetailSchema)
    .query(async ({ input, ctx }) => {
      const specService = ensureSpecService(ctx);
      return specService.getSpec(input.id);
    }),

  listSpecs: publicProcedure
    .input(ListSpecsInputSchema.optional())
    .output(SpecListResponseSchema)
    .query(async ({ input, ctx }) => {
      const specService = ensureSpecService(ctx);
      const params: ListSpecsParams = {
        ...(input ?? {}),
      } as ListSpecsParams;
      const result = await specService.listSpecs(params);
      return {
        items: result.specs,
        pagination: result.pagination,
      };
    }),
});

