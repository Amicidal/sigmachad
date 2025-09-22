import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import { scopesSatisfyRequirement } from '../middleware/authentication.js';
// Shared tRPC base used by router and route modules to avoid circular imports
export const t = initTRPC.context().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
            },
        };
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
export const createTestContext = (opts = {}) => {
    // This will be overridden by tests with real services
    const defaultContext = {
        kgService: {},
        dbService: {},
        astParser: {},
        fileWatcher: {},
        ...opts,
    };
    return defaultContext;
};
//# sourceMappingURL=base.js.map