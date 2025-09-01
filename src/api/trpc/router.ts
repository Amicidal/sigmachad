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

// Create tRPC context
export const createTRPCContext = async (opts: {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
}): Promise<TRPCContext> => {
  return {
    ...opts,
  };
};

// Import route procedures
import { codeRouter } from './routes/code.js';
import { designRouter } from './routes/design.js';
import { graphRouter } from './routes/graph.js';
import { adminRouter } from './routes/admin.js';

// Root router
export const appRouter = router({
  code: codeRouter,
  design: designRouter,
  graph: graphRouter,
  admin: adminRouter,
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
