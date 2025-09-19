import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';
import type { AuthContext } from '../middleware/authentication.js';
import { scopesSatisfyRequirement } from '../middleware/authentication.js';

// tRPC context type shared across router and routes
export type TRPCContext = {
  kgService: KnowledgeGraphService;
  dbService: DatabaseService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
  authToken?: string;
  authContext?: AuthContext;
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
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const required = ['admin'];
  const context = ctx.authContext;
  if (!context) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication is required' });
  }
  if (!scopesSatisfyRequirement(context.scopes, required)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin scope is required' });
  }
  return next();
});

// Create context helper for testing
export const createTestContext = (opts: Partial<TRPCContext> = {}): TRPCContext => {
  // This will be overridden by tests with real services
  const defaultContext: TRPCContext = {
    kgService: {} as any,
    dbService: {} as any,
    astParser: {} as any,
    fileWatcher: {} as any,
    ...opts,
  };
  return defaultContext;
};
