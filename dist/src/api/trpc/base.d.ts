import superjson from 'superjson';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ASTParser } from '../../services/ASTParser.js';
import { FileWatcher } from '../../services/FileWatcher.js';
export type TRPCContext = {
    kgService: KnowledgeGraphService;
    dbService: DatabaseService;
    astParser: ASTParser;
    fileWatcher: FileWatcher;
};
export declare const t: {
    _config: import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof superjson;
    }>;
    procedure: import("@trpc/server").ProcedureBuilder<{
        _config: import("@trpc/server").RootConfig<{
            ctx: TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof superjson;
        }>;
        _ctx_out: TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }>;
    middleware: <TNewParams extends import("@trpc/server").ProcedureParams<import("@trpc/server").AnyRootConfig, unknown, unknown, unknown, unknown, unknown, unknown>>(fn: import("@trpc/server").MiddlewareFunction<{
        _config: import("@trpc/server").RootConfig<{
            ctx: TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof superjson;
        }>;
        _ctx_out: {};
        _input_out: typeof import("@trpc/server").unsetMarker;
        _input_in: unknown;
        _output_in: unknown;
        _output_out: unknown;
        _meta: object;
    }, TNewParams>) => import("@trpc/server").MiddlewareBuilder<{
        _config: import("@trpc/server").RootConfig<{
            ctx: TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof superjson;
        }>;
        _ctx_out: {};
        _input_out: typeof import("@trpc/server").unsetMarker;
        _input_in: unknown;
        _output_in: unknown;
        _output_out: unknown;
        _meta: object;
    }, TNewParams>;
    router: <TProcRouterRecord extends import("@trpc/server").ProcedureRouterRecord>(procedures: TProcRouterRecord) => import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof superjson;
    }>, TProcRouterRecord>;
    mergeRouters: typeof import("@trpc/server").mergeRouters;
    createCallerFactory: <TRouter extends import("@trpc/server").Router<import("@trpc/server").AnyRouterDef<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof superjson;
    }>, any>>>(router: TRouter) => import("@trpc/server").RouterCaller<TRouter["_def"]>;
};
export declare const router: <TProcRouterRecord extends import("@trpc/server").ProcedureRouterRecord>(procedures: TProcRouterRecord) => import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof superjson;
}>, TProcRouterRecord>;
export declare const publicProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof superjson;
    }>;
    _ctx_out: TRPCContext;
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
    _meta: object;
}>;
//# sourceMappingURL=base.d.ts.map