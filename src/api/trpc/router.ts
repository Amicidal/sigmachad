/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */

import { z } from 'zod';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';

// Create tRPC context
export const createTRPCContext = async (opts: {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
}) => {
  return {
    ...opts,
  } as const;
};

import { router, publicProcedure, t } from './base.js';

// Root router with minimal routes
export const appRouter = router({
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
