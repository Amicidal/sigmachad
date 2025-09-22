/**
 * Admin tRPC Routes
 * Type-safe procedures for administrative operations
 */
export declare const adminRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    getLogs: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            limit?: number | undefined;
            since?: string | undefined;
            level?: "info" | "error" | "warn" | "debug" | undefined;
            component?: string | undefined;
        };
        _input_out: {
            limit: number;
            since?: string | undefined;
            level?: "info" | "error" | "warn" | "debug" | undefined;
            component?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, never>;
    getMetrics: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        graph: any;
        history: {
            versions: any;
            checkpoints: any;
            checkpointMembers: any;
            temporalEdges: any;
            lastPrune: any;
        };
        process: {
            uptime: number;
            memory: NodeJS.MemoryUsage;
        };
        timestamp: string;
    }>;
    syncFilesystem: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            paths?: string[] | undefined;
            force?: boolean | undefined;
        };
        _input_out: {
            force: boolean;
            paths?: string[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, never>;
    clearCache: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            type?: "search" | "relationships" | "entities" | "all" | undefined;
        };
        _input_out: {
            type: "search" | "relationships" | "entities" | "all";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, never>;
    getConfig: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        version: string;
        environment: string;
        features: {
            websocket: boolean;
            graphSearch: boolean;
            history: boolean;
        };
    }>;
    updateConfig: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            key: string;
            value?: any;
        };
        _input_out: {
            key: string;
            value?: any;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, never>;
    indexHealth: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    ensureIndexes: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        ensured: boolean;
        health: any;
    }>;
    runBenchmarks: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/index.js").KnowledgeGraphService;
            dbService: import("../../../services/index.js").DatabaseService;
            astParser: import("../../../services/index.js").ASTParser;
            fileWatcher: import("../../../services/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            mode?: "quick" | "full" | undefined;
        } | undefined;
        _input_out: {
            mode?: "quick" | "full" | undefined;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
}>;
//# sourceMappingURL=admin.d.ts.map