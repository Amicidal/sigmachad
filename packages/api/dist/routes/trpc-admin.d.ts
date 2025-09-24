/**
 * Admin tRPC Routes
 * Type-safe procedures for administrative operations
 */
export declare const adminRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../trpc/base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    getLogs: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            limit?: number | undefined;
            since?: string | undefined;
            level?: "error" | "info" | "warn" | "debug" | undefined;
            component?: string | undefined;
        };
        _input_out: {
            limit: number;
            since?: string | undefined;
            level?: "error" | "info" | "warn" | "debug" | undefined;
            component?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        logs: never[];
        total: number;
        filters: {
            level: "error" | "info" | "warn" | "debug" | undefined;
            component: string | undefined;
            since: string | undefined;
        };
        timestamp: string;
    }>;
    getMetrics: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
    }, {
        success: boolean;
        summary: {
            totalPaths: number;
            successfulPaths: number;
            totalFilesProcessed: number;
            totalEntitiesCreated: number;
            totalEntitiesUpdated: number;
            totalRelationshipsCreated: number;
            totalErrors: number;
            totalDuration: number;
        };
        results: never[];
        timestamp: string;
    }>;
    clearCache: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: {
            type?: "search" | "entities" | "relationships" | "all" | undefined;
        };
        _input_out: {
            type: "search" | "entities" | "relationships" | "all";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        type: "search" | "entities" | "relationships" | "all";
        caches: never[];
        summary: {
            totalItemsCleared: number;
            totalSizeFreed: number;
            duration: number;
        };
        timestamp: string;
    }>;
    getConfig: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
    }, {
        success: boolean;
        key: string;
        previousValue: string | number | boolean | null;
        newValue: any;
        appliedAt: string;
        requiresRestart: boolean;
        timestamp: string;
    }>;
    indexHealth: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    ensureIndexes: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("packages/knowledge/dist/index.js").KnowledgeGraphService;
            dbService: DatabaseService;
            astParser: import("packages/knowledge/dist/index.js").ASTParser;
            fileWatcher: import("packages/core/dist/index.js").FileWatcher;
            authToken: string | undefined;
            authContext: import("../middleware/authentication.js").AuthContext | undefined;
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
//# sourceMappingURL=trpc-admin.d.ts.map