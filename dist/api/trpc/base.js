import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
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
    const required = (process.env.ADMIN_API_TOKEN || '').trim();
    if (!required) {
        return next(); // no auth required in development
    }
    const provided = (ctx.authToken || '').trim();
    if (provided !== required) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or missing API token' });
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