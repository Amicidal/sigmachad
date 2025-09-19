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
import {
  authenticateRequest,
  authenticateHeaders,
} from '../middleware/authentication.js';

// Create tRPC context
export const createTRPCContext = async (opts: {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
  req?: FastifyRequest;
}): Promise<TRPCContext> => {
  // Derive authentication context from the inbound request headers
  let authToken: string | undefined;
  let authContext = undefined;
  try {
    if (opts.req) {
      authContext = authenticateRequest(opts.req);
    } else {
      const hdrs = (opts as any)?.req?.headers || {};
      authContext = authenticateHeaders(hdrs);
    }
    authToken = authContext?.rawToken;
  } catch {
    authToken = undefined;
  }

  const { req, ...rest } = opts as any;
  return {
    ...rest,
    authToken,
    authContext,
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
