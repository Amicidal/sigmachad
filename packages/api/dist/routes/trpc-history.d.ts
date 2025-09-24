/**
 * History tRPC Routes
 * Type-safe procedures for history and checkpoints
 */
export declare const historyRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../trpc/base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    createCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            seedEntities?: string[] | undefined;
            reason?: "daily" | "incident" | "manual" | undefined;
            hops?: number | undefined;
            window?: {
                since?: Date | undefined;
                until?: Date | undefined;
                timeRange?: "1h" | "24h" | "7d" | "30d" | "90d" | undefined;
            } | undefined;
        };
        _input_out: {
            seedEntities: string[];
            reason: "daily" | "incident" | "manual";
            hops?: number | undefined;
            window?: {
                since?: Date | undefined;
                until?: Date | undefined;
                timeRange?: "1h" | "24h" | "7d" | "30d" | "90d" | undefined;
            } | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        checkpointId: any;
    }>;
    listCheckpoints: import("@trpc/server").BuildProcedure<"query", {
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
            offset?: number | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
            reason?: string | undefined;
        } | undefined;
        _input_out: {
            limit?: number | undefined;
            offset?: number | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
            reason?: string | undefined;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: any;
        total: any;
    }>;
    getCheckpoint: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    getCheckpointMembers: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        _input_out: {
            id: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: any;
        total: any;
    }>;
    getCheckpointSummary: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    exportCheckpoint: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
            includeRelationships?: boolean | undefined;
        };
        _input_out: {
            id: string;
            includeRelationships?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    importCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            members: any[];
            relationships?: any[] | undefined;
            checkpoint?: any;
            useOriginalId?: boolean | undefined;
        };
        _input_out: {
            members: any[];
            relationships?: any[] | undefined;
            checkpoint?: any;
            useOriginalId?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any>;
    deleteCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: void;
    }>;
}>;
//# sourceMappingURL=trpc-history.d.ts.map