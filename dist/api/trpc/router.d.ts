/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';
export declare const createTRPCContext: (opts: {
    kgService: KnowledgeGraphService;
    dbService: DatabaseService;
    astParser: ASTParser;
    fileWatcher: FileWatcher;
}) => Promise<{
    readonly kgService: KnowledgeGraphService;
    readonly dbService: DatabaseService;
    readonly astParser: ASTParser;
    readonly fileWatcher: FileWatcher;
}>;
export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("./base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    health: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("./base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _ctx_out: import("./base.js").TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        status: string;
        timestamp: string;
        services: {
            falkordb: boolean;
            qdrant: boolean;
            postgresql: boolean;
            redis?: boolean;
        };
    }>;
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=router.d.ts.map