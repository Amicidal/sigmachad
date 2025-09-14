/**
 * Design System tRPC Routes
 * Type-safe procedures for design system operations
 */
export declare const designRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    validateSpec: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            spec: Record<string, any>;
            rules?: string[] | undefined;
        };
        _input_out: {
            spec: Record<string, any>;
            rules?: string[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        issues: {
            field: string;
            message: string;
            severity: "error" | "warning";
            file?: string | undefined;
            line?: number | undefined;
            column?: number | undefined;
            rule?: string | undefined;
        }[];
        suggestions: string[];
        isValid: boolean;
    }>;
    getTestCoverage: import("@trpc/server").BuildProcedure<"query", {
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
            includeTestCases?: boolean | undefined;
        };
        _input_out: {
            entityId: string;
            includeTestCases?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        entityId: string;
        overallCoverage: {
            functions: number;
            lines: number;
            statements: number;
            branches: number;
        };
        testBreakdown: {
            unitTests: {
                functions: number;
                lines: number;
                statements: number;
                branches: number;
            };
            integrationTests: {
                functions: number;
                lines: number;
                statements: number;
                branches: number;
            };
            e2eTests: {
                functions: number;
                lines: number;
                statements: number;
                branches: number;
            };
        };
        uncoveredLines: number[];
        uncoveredBranches: number[];
        testCases: {
            testId: string;
            testCode: string;
            testName: string;
            assertions: string[];
        }[];
    }>;
    upsertSpec: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            type: "feature" | "component" | "page" | "system";
            name: string;
            description: string;
            status: "draft" | "approved" | "implemented" | "deprecated" | "review";
            tags: string[];
            id: string;
            created: Date;
            dependencies: string[];
            updated: Date;
            author: string;
            requirements: string[];
            reviewers: string[];
        };
        _input_out: {
            type: "feature" | "component" | "page" | "system";
            name: string;
            description: string;
            status: "draft" | "approved" | "implemented" | "deprecated" | "review";
            tags: string[];
            id: string;
            created: Date;
            dependencies: string[];
            updated: Date;
            author: string;
            requirements: string[];
            reviewers: string[];
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: {
            type: "feature" | "component" | "page" | "system";
            name: string;
            description: string;
            status: "draft" | "approved" | "implemented" | "deprecated" | "review";
            tags: string[];
            id: string;
            created: Date;
            dependencies: string[];
            updated: Date;
            author: string;
            requirements: string[];
            reviewers: string[];
        };
    }>;
    getSpec: import("@trpc/server").BuildProcedure<"query", {
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
    listSpecs: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            type?: "feature" | "component" | "page" | "system" | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
            status?: "draft" | "approved" | "implemented" | "deprecated" | "review" | undefined;
        };
        _input_out: {
            limit: number;
            offset: number;
            type?: "feature" | "component" | "page" | "system" | undefined;
            status?: "draft" | "approved" | "implemented" | "deprecated" | "review" | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        items: never[];
        total: number;
        limit: number;
        offset: number;
    }>;
}>;
//# sourceMappingURL=design.d.ts.map