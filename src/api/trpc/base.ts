import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';

// tRPC context type shared across router and routes
export type TRPCContext = {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
};

// Shared tRPC base used by router and route modules to avoid circular imports
export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    } as any;
  },
});

// Export router and publicProcedure for use in route files
export const router = t.router;
export const publicProcedure = t.procedure;


