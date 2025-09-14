/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { router, publicProcedure } from './base.js';
// Create tRPC context
export const createTRPCContext = async (opts) => {
    var _a;
    // Extract auth token from headers if available
    let authToken;
    try {
        const hdrs = ((_a = opts.req) === null || _a === void 0 ? void 0 : _a.headers) || {};
        const headerKey = hdrs['x-api-key'] || '';
        const authz = hdrs['authorization'] || '';
        const bearer = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7) : authz;
        authToken = headerKey || bearer || undefined;
    }
    catch (_b) {
        authToken = undefined;
    }
    const { req, ...rest } = opts;
    return {
        ...rest,
        authToken,
    };
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
//# sourceMappingURL=router.js.map