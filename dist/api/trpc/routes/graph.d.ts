/**
 * Knowledge Graph tRPC Routes
 * Type-safe procedures for graph operations
 */
export declare const graphRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    getEntities: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            type?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        _input_out: {
            limit: number;
            offset: number;
            type?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getEntity: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, null>;
    getRelationships: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            entityId: string;
            type?: string | undefined;
            limit?: number | undefined;
            direction?: "outgoing" | "incoming" | "both" | undefined;
        };
        _input_out: {
            limit: number;
            entityId: string;
            direction: "outgoing" | "incoming" | "both";
            type?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any[]>;
    searchEntities: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            query: string;
            limit?: number | undefined;
            entityTypes?: ("function" | "test" | "class" | "file" | "directory" | "module" | "interface" | "spec" | "change" | "session")[] | undefined;
            searchType?: "semantic" | "structural" | "usage" | "dependency" | undefined;
            filters?: {
                tags?: string[] | undefined;
                path?: string | undefined;
                checkpointId?: string | undefined;
                language?: string | undefined;
                lastModified?: {
                    since?: Date | undefined;
                    until?: Date | undefined;
                } | undefined;
            } | undefined;
            includeRelated?: boolean | undefined;
        };
        _input_out: {
            query: string;
            limit: number;
            entityTypes?: ("function" | "test" | "class" | "file" | "directory" | "module" | "interface" | "spec" | "change" | "session")[] | undefined;
            searchType?: "semantic" | "structural" | "usage" | "dependency" | undefined;
            filters?: {
                tags?: string[] | undefined;
                path?: string | undefined;
                checkpointId?: string | undefined;
                language?: string | undefined;
                lastModified?: {
                    since?: Date | undefined;
                    until?: Date | undefined;
                } | undefined;
            } | undefined;
            includeRelated?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: import("../../../models/entities.js").Entity[];
        total: number;
    }>;
    getDependencies: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            entityId: string;
            depth?: number | undefined;
        };
        _input_out: {
            entityId: string;
            depth: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        entityId: string;
        dependencies: never[];
        dependents: never[];
        depth: number;
    }>;
    getClusters: import("@trpc/server").BuildProcedure<"query", {
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
            domain?: string | undefined;
            minSize?: number | undefined;
        };
        _input_out: {
            limit: number;
            minSize: number;
            domain?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, any[]>;
    analyzeImpact: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            entityId: string;
            changeType: "delete" | "modify" | "refactor";
        };
        _input_out: {
            entityId: string;
            changeType: "delete" | "modify" | "refactor";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        entityId: string;
        changeType: "delete" | "modify" | "refactor";
        affectedEntities: never[];
        riskLevel: "low";
        recommendations: never[];
    }>;
    timeTravel: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            startId: string;
            types?: string[] | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
            atTime?: Date | undefined;
            maxDepth?: number | undefined;
        };
        _input_out: {
            startId: string;
            types?: string[] | undefined;
            since?: Date | undefined;
            until?: Date | undefined;
            atTime?: Date | undefined;
            maxDepth?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        entities: import("../../../models/entities.js").Entity[];
        relationships: import("../../../models/relationships.js").GraphRelationship[];
    }>;
}>;
//# sourceMappingURL=graph.d.ts.map