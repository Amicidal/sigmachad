/**
 * Admin tRPC Routes
 * Type-safe procedures for administrative operations
 */

import { z } from 'zod';
import { router, adminProcedure } from '../trpc/base.js';
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
      try {
        // Mock log retrieval - in production this would integrate with actual logging service
        const logs = [];
        const now = new Date();
        const sinceDate = input.since ? new Date(input.since) : new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Generate sample logs based on request
        const levels = ['error', 'warn', 'info', 'debug'];
        const components = ['api', 'knowledge', 'database', 'sync', 'websocket'];

        for (let i = 0; i < Math.min(input.limit, 50); i++) {
          const level = input.level || levels[Math.floor(Math.random() * levels.length)];
          const component = input.component || components[Math.floor(Math.random() * components.length)];
          const timestamp = new Date(sinceDate.getTime() + Math.random() * (now.getTime() - sinceDate.getTime()));

          logs.push({
            id: `log_${timestamp.getTime()}_${i}`,
            timestamp: timestamp.toISOString(),
            level,
            component,
            message: `${level.toUpperCase()}: Sample ${component} log message ${i + 1}`,
            metadata: {
              requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              duration: Math.floor(Math.random() * 1000),
            }
          });
        }

        // Sort by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
          logs: logs.slice(0, input.limit),
          total: logs.length,
          filters: {
            level: input.level,
            component: input.component,
            since: input.since,
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to retrieve logs: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
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
      try {
        const startTime = Date.now();
        const syncResults = [];

        const pathsToSync = input.paths || [process.cwd()];

        for (const path of pathsToSync) {
          try {
            // Mock filesystem sync - in production this would trigger actual sync
            const result = {
              path,
              status: 'synced',
              filesProcessed: Math.floor(Math.random() * 100) + 10,
              entitiesCreated: Math.floor(Math.random() * 20),
              entitiesUpdated: Math.floor(Math.random() * 50),
              relationshipsCreated: Math.floor(Math.random() * 100),
              errors: input.force ? 0 : Math.floor(Math.random() * 3),
              duration: Math.floor(Math.random() * 5000) + 1000,
            };
            syncResults.push(result);
          } catch (error) {
            syncResults.push({
              path,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              filesProcessed: 0,
              entitiesCreated: 0,
              entitiesUpdated: 0,
              relationshipsCreated: 0,
              errors: 1,
              duration: 0,
            });
          }
        }

        const totalDuration = Date.now() - startTime;
        const summary = {
          totalPaths: pathsToSync.length,
          successfulPaths: syncResults.filter(r => r.status === 'synced').length,
          totalFilesProcessed: syncResults.reduce((sum, r) => sum + r.filesProcessed, 0),
          totalEntitiesCreated: syncResults.reduce((sum, r) => sum + r.entitiesCreated, 0),
          totalEntitiesUpdated: syncResults.reduce((sum, r) => sum + r.entitiesUpdated, 0),
          totalRelationshipsCreated: syncResults.reduce((sum, r) => sum + r.relationshipsCreated, 0),
          totalErrors: syncResults.reduce((sum, r) => sum + r.errors, 0),
          totalDuration,
        };

        return {
          success: true,
          summary,
          results: syncResults,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to sync filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  // Clear cache
  clearCache: adminProcedure
    .input(z.object({
      type: z.enum(['entities', 'relationships', 'search', 'all']).default('all'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const clearedCaches = [];
        const startTime = Date.now();

        // Mock cache clearing operations
        if (input.type === 'entities' || input.type === 'all') {
          clearedCaches.push({
            type: 'entities',
            itemsCleared: Math.floor(Math.random() * 1000) + 100,
            sizeFreed: Math.floor(Math.random() * 10) + 5, // MB
          });
        }

        if (input.type === 'relationships' || input.type === 'all') {
          clearedCaches.push({
            type: 'relationships',
            itemsCleared: Math.floor(Math.random() * 2000) + 200,
            sizeFreed: Math.floor(Math.random() * 15) + 3, // MB
          });
        }

        if (input.type === 'search' || input.type === 'all') {
          clearedCaches.push({
            type: 'search',
            itemsCleared: Math.floor(Math.random() * 500) + 50,
            sizeFreed: Math.floor(Math.random() * 5) + 1, // MB
          });
        }

        const totalDuration = Date.now() - startTime;
        const totalItemsCleared = clearedCaches.reduce((sum, cache) => sum + cache.itemsCleared, 0);
        const totalSizeFreed = clearedCaches.reduce((sum, cache) => sum + cache.sizeFreed, 0);

        return {
          success: true,
          type: input.type,
          caches: clearedCaches,
          summary: {
            totalItemsCleared,
            totalSizeFreed,
            duration: totalDuration,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
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
      try {
        // Mock configuration update - in production this would update actual config
        const allowedKeys = [
          'features.websocket',
          'features.graphSearch',
          'features.history',
          'performance.cacheSize',
          'performance.maxConnections',
          'logging.level',
          'logging.components',
        ];

        if (!allowedKeys.includes(input.key)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Configuration key '${input.key}' is not allowed to be updated`,
          });
        }

        // Validate value based on key
        const validatedValue = input.value;
        if (input.key.startsWith('features.') && typeof input.value !== 'boolean') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Feature flags must be boolean values`,
          });
        }

        if (input.key.startsWith('performance.') && typeof input.value !== 'number') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Performance settings must be numeric values`,
          });
        }

        if (input.key === 'logging.level' && !['error', 'warn', 'info', 'debug'].includes(input.value)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Logging level must be one of: error, warn, info, debug`,
          });
        }

        const previousValue = input.key === 'features.websocket' ? true :
                             input.key === 'features.graphSearch' ? true :
                             input.key === 'features.history' ? true :
                             input.key === 'performance.cacheSize' ? 1000 :
                             input.key === 'performance.maxConnections' ? 100 :
                             input.key === 'logging.level' ? 'info' :
                             null;

        return {
          success: true,
          key: input.key,
          previousValue,
          newValue: validatedValue,
          appliedAt: new Date().toISOString(),
          requiresRestart: ['performance.cacheSize', 'performance.maxConnections'].includes(input.key),
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
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
