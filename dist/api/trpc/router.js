/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { router, publicProcedure } from './base.js';
// Create tRPC context
export const createTRPCContext = async (opts) => {
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
//# sourceMappingURL=router.js.map