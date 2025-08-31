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
        _ctx_out: import("../base.js").TRPCContext;
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
    }, {
        items: any[];
        total: number;
        limit: number;
    }>;
    getMetrics: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: NodeJS.CpuUsage;
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
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            force?: boolean | undefined;
            paths?: string[] | undefined;
        };
        _input_out: {
            force: boolean;
            paths?: string[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        syncedPaths: string[];
        timestamp: string;
    }>;
    clearCache: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            type?: "search" | "all" | "entities" | "relationships" | undefined;
        };
        _input_out: {
            type: "search" | "all" | "entities" | "relationships";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        clearedType: "search" | "all" | "entities" | "relationships";
        timestamp: string;
    }>;
    getConfig: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        version: string;
        environment: string;
        features: {
            websocket: boolean;
            graphAnalysis: boolean;
            codeParsing: boolean;
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
        _ctx_out: import("../base.js").TRPCContext;
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
        updated: string;
    }>;
}>;
//# sourceMappingURL=admin.d.ts.map