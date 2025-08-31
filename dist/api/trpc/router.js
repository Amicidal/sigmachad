/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
// Create tRPC context
export const createTRPCContext = async (opts) => {
    return {
        ...opts,
    };
};
import { router, publicProcedure } from './base.js';
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
//# sourceMappingURL=router.js.map