/**
 * tRPC Client for Memento
 * Type-safe client for interacting with the tRPC API
 */
import superjson from 'superjson';
export declare const createTRPCClient: (baseUrl: string) => {
    code: {
        analyze: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    file: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                    types?: string[] | undefined;
                };
                _input_out: {
                    file: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                    types?: string[] | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                file: string;
                lineRange: {
                    start: number;
                    end: number;
                };
                suggestions: any[];
            }>>;
        };
        refactor: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    files: string[];
                    refactorType: string;
                    options?: Record<string, any> | undefined;
                };
                _input_out: {
                    files: string[];
                    refactorType: string;
                    options?: Record<string, any> | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                refactorType: string;
                files: string[];
                suggestedRefactorings: any[];
            }>>;
        };
        parseFile: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    filePath: string;
                };
                _input_out: {
                    filePath: string;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, import("../../services/ASTParser.js").ParseResult>>;
        };
        getSymbols: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    filePath: string;
                    symbolType?: "function" | "class" | "interface" | "typeAlias" | undefined;
                };
                _input_out: {
                    filePath: string;
                    symbolType?: "function" | "class" | "interface" | "typeAlias" | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, import("../../models/entities.js").Entity[]>>;
        };
    };
    design: {
        validateSpec: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
                    severity: "error" | "warning";
                    message: string;
                    file?: string | undefined;
                    line?: number | undefined;
                    column?: number | undefined;
                    rule?: string | undefined;
                }[];
                suggestions: string[];
                isValid: boolean;
            }>>;
        };
        getTestCoverage: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
        upsertSpec: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    type: "feature" | "component" | "page" | "system";
                    name: string;
                    description: string;
                    status: "draft" | "approved" | "implemented" | "deprecated" | "review";
                    tags: string[];
                    created: Date;
                    id: string;
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
                    created: Date;
                    id: string;
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
                    created: Date;
                    id: string;
                    dependencies: string[];
                    updated: Date;
                    author: string;
                    requirements: string[];
                    reviewers: string[];
                };
            }>>;
        };
        getSpec: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    id: string;
                };
                _input_out: {
                    id: string;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, null>>;
        };
        listSpecs: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    type?: "feature" | "component" | "page" | "system" | undefined;
                    status?: "draft" | "approved" | "implemented" | "deprecated" | "review" | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
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
            }>>;
        };
    };
    graph: {
        getEntities: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
        getEntity: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    id: string;
                };
                _input_out: {
                    id: string;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, null>>;
        };
        getRelationships: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    entityId: string;
                    type?: string | undefined;
                    limit?: number | undefined;
                    direction?: "outgoing" | "incoming" | "both" | undefined;
                };
                _input_out: {
                    entityId: string;
                    limit: number;
                    direction: "outgoing" | "incoming" | "both";
                    type?: string | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, any[]>>;
        };
        searchEntities: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    query: string;
                    type?: string | undefined;
                    limit?: number | undefined;
                };
                _input_out: {
                    query: string;
                    limit: number;
                    type?: string | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                items: never[];
                total: number;
                query: string;
            }>>;
        };
        getDependencies: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
        getClusters: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }, any[]>>;
        };
        analyzeImpact: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
    };
    admin: {
        getLogs: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
                _input_in: {
                    limit?: number | undefined;
                    since?: string | undefined;
                    component?: string | undefined;
                    level?: "info" | "error" | "warn" | "debug" | undefined;
                };
                _input_out: {
                    limit: number;
                    since?: string | undefined;
                    component?: string | undefined;
                    level?: "info" | "error" | "warn" | "debug" | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                items: any[];
                total: number;
                limit: number;
            }>>;
        };
        getMetrics: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
        syncFilesystem: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
                syncedPaths: string[];
                timestamp: string;
            }>>;
        };
        clearCache: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
                clearedType: "search" | "entities" | "relationships" | "all";
                timestamp: string;
            }>>;
        };
        getConfig: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
        updateConfig: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: import("./base.js").TRPCContext;
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
            }>>;
        };
    };
    health: {
        query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("./base.js").TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof superjson;
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
            services: import("../../services/database/interfaces.js").IDatabaseHealthCheck;
        }>>;
    };
};
//# sourceMappingURL=client.d.ts.map