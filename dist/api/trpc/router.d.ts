/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/core/DatabaseService.js';
import { ASTParser } from '../../services/knowledge/ASTParser.js';
import { FileWatcher } from '../../services/core/FileWatcher.js';
import { TRPCContext } from './base.js';
import type { FastifyRequest } from 'fastify';
export declare const createTRPCContext: (opts: {
    kgService: KnowledgeGraphService;
    dbService: DatabaseService;
    astParser: ASTParser;
    fileWatcher: FileWatcher;
    req?: FastifyRequest;
}) => Promise<TRPCContext>;
export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    code: any;
    design: any;
    graph: any;
    admin: any;
    history: any;
    health: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _ctx_out: TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        status: string;
        timestamp: string;
        services: import("../../services/index.js").IDatabaseHealthCheck;
    }>;
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=router.d.ts.map