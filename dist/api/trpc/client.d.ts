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
                    types?: string[] | undefined;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                };
                _input_out: {
                    file: string;
                    types?: string[] | undefined;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, never>>;
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
            }, never>>;
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
                _output_in: {
                    issues: {
                        message: string;
                        field?: string | undefined;
                        file?: string | undefined;
                        suggestion?: string | undefined;
                        line?: number | undefined;
                        column?: number | undefined;
                        severity?: "info" | "error" | "warning" | undefined;
                        rule?: string | undefined;
                    }[];
                    isValid: boolean;
                    suggestions: string[];
                };
                _output_out: {
                    issues: {
                        message: string;
                        severity: "info" | "error" | "warning";
                        field?: string | undefined;
                        file?: string | undefined;
                        suggestion?: string | undefined;
                        line?: number | undefined;
                        column?: number | undefined;
                        rule?: string | undefined;
                    }[];
                    isValid: boolean;
                    suggestions: string[];
                };
            }, unknown>>;
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
                _output_in: {
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
                        testName: string;
                        covers: string[];
                    }[];
                };
                _output_out: {
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
                        testName: string;
                        covers: string[];
                    }[];
                };
            }, unknown>>;
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
                    description: string;
                    id: string;
                    title: string;
                    acceptanceCriteria: string[];
                    status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                    priority?: "high" | "medium" | "low" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    path?: string | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    lastModified?: string | Date | undefined;
                    created?: string | Date | undefined;
                    metadata?: Record<string, any> | undefined;
                    updated?: string | Date | undefined;
                };
                _input_out: {
                    description: string;
                    id: string;
                    title: string;
                    acceptanceCriteria: string[];
                    status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                    priority?: "high" | "medium" | "low" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    path?: string | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    lastModified?: string | Date | undefined;
                    created?: string | Date | undefined;
                    metadata?: Record<string, any> | undefined;
                    updated?: string | Date | undefined;
                };
                _output_in: {
                    spec: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    created: boolean;
                    success: true;
                };
                _output_out: {
                    spec: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    created: boolean;
                    success: true;
                };
            }, unknown>>;
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
                _output_in: {
                    spec: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    testCoverage: {
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
                            testName: string;
                            covers: string[];
                        }[];
                    };
                    relatedSpecs: {
                        type?: "spec" | undefined;
                        description?: string | undefined;
                        status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                        priority?: "high" | "medium" | "low" | "critical" | undefined;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        path?: string | undefined;
                        id?: string | undefined;
                        hash?: string | undefined;
                        language?: string | undefined;
                        lastModified?: Date | undefined;
                        created?: Date | undefined;
                        metadata?: Record<string, any> | undefined;
                        title?: string | undefined;
                        acceptanceCriteria?: string[] | undefined;
                        updated?: Date | undefined;
                    }[];
                    affectedEntities: any[];
                };
                _output_out: {
                    spec: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    testCoverage: {
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
                            testName: string;
                            covers: string[];
                        }[];
                    };
                    relatedSpecs: {
                        type?: "spec" | undefined;
                        description?: string | undefined;
                        status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                        priority?: "high" | "medium" | "low" | "critical" | undefined;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        path?: string | undefined;
                        id?: string | undefined;
                        hash?: string | undefined;
                        language?: string | undefined;
                        lastModified?: Date | undefined;
                        created?: Date | undefined;
                        metadata?: Record<string, any> | undefined;
                        title?: string | undefined;
                        acceptanceCriteria?: string[] | undefined;
                        updated?: Date | undefined;
                    }[];
                    affectedEntities: any[];
                };
            }, unknown>>;
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
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                    status?: ("deprecated" | "draft" | "approved" | "implemented")[] | undefined;
                    priority?: ("high" | "medium" | "low" | "critical")[] | undefined;
                    assignee?: string | undefined;
                    tags?: string[] | undefined;
                    sortBy?: "status" | "priority" | "created" | "title" | "updated" | undefined;
                    sortOrder?: "asc" | "desc" | undefined;
                } | undefined;
                _input_out: {
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                    status?: ("deprecated" | "draft" | "approved" | "implemented")[] | undefined;
                    priority?: ("high" | "medium" | "low" | "critical")[] | undefined;
                    assignee?: string | undefined;
                    tags?: string[] | undefined;
                    sortBy?: "status" | "priority" | "created" | "title" | "updated" | undefined;
                    sortOrder?: "asc" | "desc" | undefined;
                } | undefined;
                _output_in: {
                    items: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    }[];
                    pagination: {
                        total: number;
                        page: number;
                        pageSize: number;
                        hasMore: boolean;
                    };
                };
                _output_out: {
                    items: {
                        type: "spec";
                        description: string;
                        status: "deprecated" | "draft" | "approved" | "implemented";
                        priority: "high" | "medium" | "low" | "critical";
                        path: string;
                        id: string;
                        hash: string;
                        language: string;
                        lastModified: Date;
                        created: Date;
                        title: string;
                        acceptanceCriteria: string[];
                        updated: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    }[];
                    pagination: {
                        total: number;
                        page: number;
                        pageSize: number;
                        hasMore: boolean;
                    };
                };
            }, unknown>>;
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
                items: import("../../models/entities.js").Entity[];
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
            }, import("../../models/entities.js").Entity>>;
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
                    limit: number;
                    entityId: string;
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
                    limit?: number | undefined;
                    entityTypes?: ("function" | "test" | "class" | "file" | "directory" | "module" | "interface" | "spec" | "change" | "session")[] | undefined;
                    searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
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
                    searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
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
                items: import("../../models/entities.js").Entity[];
                total: number;
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
            }, import("../../models/types.js").DependencyAnalysis>>;
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
            }, import("../../models/entities.js").Entity[]>>;
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
            }, never>>;
        };
        timeTravel: {
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
                entities: import("../../models/entities.js").Entity[];
                relationships: import("../../models/relationships.js").GraphRelationship[];
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
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }, never>>;
        };
        getMetrics: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }, never>>;
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
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }, never>>;
        };
        getConfig: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }, never>>;
        };
        indexHealth: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
        ensureIndexes: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
        runBenchmarks: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
    };
    history: {
        createCheckpoint: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
        listCheckpoints: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
        getCheckpoint: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }, import("../../models/entities.js").Entity | null>>;
        };
        getCheckpointMembers: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
                items: import("../../models/entities.js").Entity[];
                total: number;
            }>>;
        };
        getCheckpointSummary: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            } | null>>;
        };
        exportCheckpoint: {
            query: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"query", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
                members: import("../../models/entities.js").Entity[];
                relationships?: import("../../models/relationships.js").GraphRelationship[];
            } | null>>;
        };
        importCheckpoint: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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
            }>>;
        };
        deleteCheckpoint: {
            mutate: import("@trpc/client").Resolver<import("@trpc/server").BuildProcedure<"mutation", {
                _config: import("@trpc/server").RootConfig<{
                    ctx: import("./base.js").TRPCContext;
                    meta: object;
                    errorShape: any;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: {
                    kgService: import("../../services/KnowledgeGraphService.js").KnowledgeGraphService;
                    dbService: import("../../services/DatabaseService.js").DatabaseService;
                    astParser: import("../../services/ASTParser.js").ASTParser;
                    fileWatcher: import("../../services/FileWatcher.js").FileWatcher;
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