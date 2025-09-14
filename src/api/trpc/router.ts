/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */

import { z } from 'zod';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';
import { router, publicProcedure, TRPCContext } from './base.js';
import type { FastifyRequest } from 'fastify';

// Create tRPC context
export const createTRPCContext = async (opts: {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
  req?: FastifyRequest;
}): Promise<TRPCContext> => {
  // Extract auth token from headers if available
  let authToken: string | undefined;
  try {
    const hdrs = (opts.req as any)?.headers || {};
    const headerKey = (hdrs['x-api-key'] as string | undefined) || '';
    const authz = (hdrs['authorization'] as string | undefined) || '';
    const bearer = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : authz;
    authToken = headerKey || bearer || undefined;
  } catch {
    authToken = undefined;
  }
  const { req, ...rest } = opts as any;
  return {
    ...rest,
    authToken,
  } as TRPCContext;
};

// Import route procedures
import { codeRouter } from './routes/code.js';
import { designRouter } from './routes/design.js';
import { graphRouter } from './routes/graph.js';
import { adminRouter } from './routes/admin.js';
import { historyRouter } from './routes/history.js';

// Root router
export const appRouter = router({
  code: codeRouter,
  design: designRouter,
  graph: graphRouter,
  admin: adminRouter,
  history: historyRouter,
  health: publicProcedure
    .query(async ({ ctx }) => {
      const health = await ctx.dbService.healthCheck();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: health,
      };
    }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
