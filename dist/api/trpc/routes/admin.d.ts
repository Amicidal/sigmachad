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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        graph: {
            nodes: number;
            relationships: number;
        };
        history: {
            versions: number;
            checkpoints: number;
            checkpointMembers: {
                avg: number;
                min: number;
                max: number;
            };
            temporalEdges: {
                open: number;
                closed: number;
            };
            lastPrune: {
                retentionDays: number;
                cutoff: string;
                versions: number;
                closedEdges: number;
                checkpoints: number;
                dryRun?: boolean;
            } | undefined;
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
        };
        _input_in: {
            type?: "search" | "entities" | "relationships" | "all" | undefined;
        };
        _input_out: {
            type: "search" | "entities" | "relationships" | "all";
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        supported: boolean;
        indexes?: any[];
        expected: {
            file_path: boolean;
            symbol_path: boolean;
            version_entity: boolean;
            checkpoint_id: boolean;
            rel_validFrom: boolean;
            rel_validTo: boolean;
        };
        notes?: string[];
    }>;
    ensureIndexes: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        ensured: boolean;
        health: {
            supported: boolean;
            indexes?: any[];
            expected: {
                file_path: boolean;
                symbol_path: boolean;
                version_entity: boolean;
                checkpoint_id: boolean;
                rel_validFrom: boolean;
                rel_validTo: boolean;
            };
            notes?: string[];
        };
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
            kgService: import("../../../services/KnowledgeGraphService.js").KnowledgeGraphService;
            dbService: import("../../../services/DatabaseService.js").DatabaseService;
            astParser: import("../../../services/ASTParser.js").ASTParser;
            fileWatcher: import("../../../services/FileWatcher.js").FileWatcher;
            authToken: string | undefined;
        };
        _input_in: {
            mode?: "quick" | "full" | undefined;
        } | undefined;
        _input_out: {
            mode?: "quick" | "full" | undefined;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        mode: "quick" | "full";
        totals: {
            nodes: number;
            edges: number;
        };
        timings: Record<string, number>;
        samples: Record<string, any>;
    }>;
}>;
//# sourceMappingURL=admin.d.ts.map