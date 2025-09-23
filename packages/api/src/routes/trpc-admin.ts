/**
 * Admin tRPC Routes
 * Type-safe procedures for administrative operations
 */

import { z } from 'zod';
import { router, adminProcedure } from '../base.js';
import { TRPCError } from '@trpc/server';

export const adminRouter = router({
  // Get system logs
  getLogs: adminProcedure
    .input(z.object({
      level: z.enum(['error', 'warn', 'info', 'debug']).optional(),
      component: z.string().optional(),
      since: z.string().optional(), // ISO date string
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ input, ctx }) => {
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Log retrieval is not available in this build.' });
    }),

  // Get consolidated metrics (graph/history/sync subset)
  getMetrics: adminProcedure
    .query(async ({ ctx }) => {
      const history = await ctx.kgService.getHistoryMetrics();
      return {
        graph: history.totals,
        history: {
          versions: history.versions,
          checkpoints: history.checkpoints,
          checkpointMembers: history.checkpointMembers,
          temporalEdges: history.temporalEdges,
          lastPrune: history.lastPrune || undefined,
        },
        process: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        timestamp: new Date().toISOString(),
      };
    }),

  // Trigger file system sync
  syncFilesystem: adminProcedure
    .input(z.object({
      paths: z.array(z.string()).optional(),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Filesystem synchronization is not available in this build.' });
    }),

  // Clear cache
  clearCache: adminProcedure
    .input(z.object({
      type: z.enum(['entities', 'relationships', 'search', 'all']).default('all'),
    }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Cache clearing is not available in this build.' });
    }),

  // Get system configuration
  getConfig: adminProcedure
    .query(async ({ ctx }) => {
      const cfg = ctx.dbService.getConfig?.();
      const cfgAny = cfg
        ? ((cfg as unknown) as Record<string, unknown>)
        : undefined;
      const version = typeof cfgAny?.version === 'string' ? (cfgAny.version as string) : 'unknown';
      return {
        version,
        environment: process.env.NODE_ENV || 'development',
        features: {
          websocket: true,
          graphSearch: true,
          history: (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false',
        },
      };
    }),

  // Update system configuration
  updateConfig: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Configuration updates are not available in this build.' });
    }),

  // Index health
  indexHealth: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.kgService.getIndexHealth();
    }),

  // Ensure indexes
  ensureIndexes: adminProcedure
    .mutation(async ({ ctx }) => {
      await ctx.kgService.ensureGraphIndexes();
      const health = await ctx.kgService.getIndexHealth();
      return { ensured: true, health };
    }),

  // Benchmarks
  runBenchmarks: adminProcedure
    .input(z.object({ mode: z.enum(['quick','full']).optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.kgService.runBenchmarks({ mode: (input?.mode || 'quick') as any });
    }),
});
