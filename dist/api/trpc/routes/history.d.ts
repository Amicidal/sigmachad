/**
 * History tRPC Routes
 * Type-safe procedures for history and checkpoints
 */
export declare const historyRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    createCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            reason?: "manual" | "daily" | "incident" | undefined;
            hops?: number | undefined;
            seedEntities?: string[] | undefined;
            window?: {
                since?: Date | undefined;
                until?: Date | undefined;
                timeRange?: "1h" | "24h" | "7d" | "30d" | "90d" | undefined;
            } | undefined;
        };
        _input_out: {
            reason: "manual" | "daily" | "incident";
            seedEntities: string[];
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
        checkpointId: string;
    }>;
    listCheckpoints: import("@trpc/server").BuildProcedure<"query", {
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
            offset?: number | undefined;
            reason?: string | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
        } | undefined;
        _input_out: {
            limit?: number | undefined;
            offset?: number | undefined;
            reason?: string | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: any[];
        total: number;
    }>;
    getCheckpoint: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("../../../models/entities.js").Entity | null>;
    getCheckpointMembers: import("@trpc/server").BuildProcedure<"query", {
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
        items: import("../../../models/entities.js").Entity[];
        total: number;
    }>;
    getCheckpointSummary: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        totalMembers: number;
        entityTypeCounts: Array<{
            type: string;
            count: number;
        }>;
        relationshipTypeCounts: Array<{
            type: string;
            count: number;
        }>;
    } | null>;
    exportCheckpoint: import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
            includeRelationships?: boolean | undefined;
        };
        _input_out: {
            id: string;
            includeRelationships?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        checkpoint: any;
        members: import("../../../models/entities.js").Entity[];
        relationships?: import("../../../models/relationships.js").GraphRelationship[];
    } | null>;
    importCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            members: any[];
            checkpoint?: any;
            relationships?: any[] | undefined;
            useOriginalId?: boolean | undefined;
        };
        _input_out: {
            members: any[];
            checkpoint?: any;
            relationships?: any[] | undefined;
            useOriginalId?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        checkpointId: string;
        linked: number;
        missing: number;
    }>;
    deleteCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
}>;
//# sourceMappingURL=history.d.ts.map