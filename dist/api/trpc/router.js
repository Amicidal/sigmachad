/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { router, publicProcedure } from './base.js';
import { authenticateRequest, authenticateHeaders, } from '../middleware/authentication.js';
// Create tRPC context
export const createTRPCContext = async (opts) => {
    var _a;
    // Derive authentication context from the inbound request headers
    let authToken;
    let authContext = undefined;
    try {
        if (opts.req) {
            authContext = authenticateRequest(opts.req);
        }
        else {
            const hdrs = ((_a = opts === null || opts === void 0 ? void 0 : opts.req) === null || _a === void 0 ? void 0 : _a.headers) || {};
            authContext = authenticateHeaders(hdrs);
        }
        authToken = authContext === null || authContext === void 0 ? void 0 : authContext.rawToken;
    }
    catch (_b) {
        authToken = undefined;
    }
    const { req, ...rest } = opts;
    return {
        ...rest,
        authToken,
        authContext,
    };
};
// Import route procedures
import { codeRouter } from '../routes/trpc-code.js';
import { designRouter } from '../routes/trpc-design.js';
import { graphRouter } from '../routes/trpc-graph.js';
import { adminRouter } from '../routes/trpc-admin.js';
import { historyRouter } from '../routes/trpc-history.js';
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