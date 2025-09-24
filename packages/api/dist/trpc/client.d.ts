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
                entities: Entity[];
                relationships: import("@memento/core/models/relationships.js").GraphRelationship[];
                symbols: Entity[];
                suggestions: string[];
                metrics: {
                    complexity: number;
                    dependencies: number;
                    exports: number;
                };
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
                suggestions: never[];
                timestamp: string;
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
            }, import("packages/knowledge/dist/parsing/ASTParser.js").ParseResult>>;
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
            }, Entity[]>>;
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
                        severity?: "error" | "warning" | "info" | undefined;
                        rule?: string | undefined;
                        file?: string | undefined;
                        line?: number | undefined;
                        column?: number | undefined;
                        suggestion?: string | undefined;
                        field?: string | undefined;
                    }[];
                    isValid: boolean;
                    suggestions: string[];
                };
                _output_out: {
                    issues: {
                        message: string;
                        severity: "error" | "warning" | "info";
                        rule?: string | undefined;
                        file?: string | undefined;
                        line?: number | undefined;
                        column?: number | undefined;
                        suggestion?: string | undefined;
                        field?: string | undefined;
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
                        lines: number;
                        branches: number;
                        functions: number;
                        statements: number;
                    };
                    testBreakdown: {
                        unitTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        integrationTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        e2eTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
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
                        lines: number;
                        branches: number;
                        functions: number;
                        statements: number;
                    };
                    testBreakdown: {
                        unitTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        integrationTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        e2eTests: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
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
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    path?: string | undefined;
                    status?: "draft" | "approved" | "implemented" | "deprecated" | undefined;
                    priority?: "low" | "medium" | "high" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    metadata?: Record<string, any> | undefined;
                    created?: string | Date | undefined;
                    updated?: string | Date | undefined;
                    lastModified?: string | Date | undefined;
                };
                _input_out: {
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    path?: string | undefined;
                    status?: "draft" | "approved" | "implemented" | "deprecated" | undefined;
                    priority?: "low" | "medium" | "high" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    metadata?: Record<string, any> | undefined;
                    created?: string | Date | undefined;
                    updated?: string | Date | undefined;
                    lastModified?: string | Date | undefined;
                };
                _output_in: {
                    spec: {
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    created: boolean;
                    success: true;
                };
                _output_out: {
                    spec: {
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
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
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    relatedSpecs: {
                        path?: string | undefined;
                        type?: "spec" | undefined;
                        status?: "draft" | "approved" | "implemented" | "deprecated" | undefined;
                        id?: string | undefined;
                        title?: string | undefined;
                        description?: string | undefined;
                        acceptanceCriteria?: string[] | undefined;
                        priority?: "low" | "medium" | "high" | "critical" | undefined;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        hash?: string | undefined;
                        language?: string | undefined;
                        metadata?: Record<string, any> | undefined;
                        created?: Date | undefined;
                        updated?: Date | undefined;
                        lastModified?: Date | undefined;
                    }[];
                    affectedEntities: any[];
                    testCoverage: {
                        entityId: string;
                        overallCoverage: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        testBreakdown: {
                            unitTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
                            };
                            integrationTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
                            };
                            e2eTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
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
                };
                _output_out: {
                    spec: {
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    };
                    relatedSpecs: {
                        path?: string | undefined;
                        type?: "spec" | undefined;
                        status?: "draft" | "approved" | "implemented" | "deprecated" | undefined;
                        id?: string | undefined;
                        title?: string | undefined;
                        description?: string | undefined;
                        acceptanceCriteria?: string[] | undefined;
                        priority?: "low" | "medium" | "high" | "critical" | undefined;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        hash?: string | undefined;
                        language?: string | undefined;
                        metadata?: Record<string, any> | undefined;
                        created?: Date | undefined;
                        updated?: Date | undefined;
                        lastModified?: Date | undefined;
                    }[];
                    affectedEntities: any[];
                    testCoverage: {
                        entityId: string;
                        overallCoverage: {
                            lines: number;
                            branches: number;
                            functions: number;
                            statements: number;
                        };
                        testBreakdown: {
                            unitTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
                            };
                            integrationTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
                            };
                            e2eTests: {
                                lines: number;
                                branches: number;
                                functions: number;
                                statements: number;
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
                    status?: ("draft" | "approved" | "implemented" | "deprecated")[] | undefined;
                    priority?: ("low" | "medium" | "high" | "critical")[] | undefined;
                    assignee?: string | undefined;
                    tags?: string[] | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                    sortBy?: "status" | "title" | "priority" | "created" | "updated" | undefined;
                    sortOrder?: "asc" | "desc" | undefined;
                } | undefined;
                _input_out: {
                    status?: ("draft" | "approved" | "implemented" | "deprecated")[] | undefined;
                    priority?: ("low" | "medium" | "high" | "critical")[] | undefined;
                    assignee?: string | undefined;
                    tags?: string[] | undefined;
                    search?: string | undefined;
                    limit?: number | undefined;
                    offset?: number | undefined;
                    sortBy?: "status" | "title" | "priority" | "created" | "updated" | undefined;
                    sortOrder?: "asc" | "desc" | undefined;
                } | undefined;
                _output_in: {
                    items: {
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    }[];
                    pagination: {
                        page: number;
                        pageSize: number;
                        total: number;
                        hasMore: boolean;
                    };
                };
                _output_out: {
                    items: {
                        path: string;
                        type: "spec";
                        status: "draft" | "approved" | "implemented" | "deprecated";
                        id: string;
                        title: string;
                        description: string;
                        acceptanceCriteria: string[];
                        priority: "low" | "medium" | "high" | "critical";
                        hash: string;
                        language: string;
                        created: Date;
                        updated: Date;
                        lastModified: Date;
                        assignee?: string | null | undefined;
                        tags?: string[] | undefined;
                        metadata?: Record<string, any> | undefined;
                    }[];
                    pagination: {
                        page: number;
                        pageSize: number;
                        total: number;
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
                items: Entity[] | undefined;
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
            }, any>>;
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
                    direction?: "incoming" | "outgoing" | "both" | undefined;
                };
                _input_out: {
                    entityId: string;
                    limit: number;
                    direction: "incoming" | "outgoing" | "both";
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
                    entityTypes?: ("function" | "spec" | "file" | "class" | "interface" | "module" | "test" | "change" | "session" | "directory")[] | undefined;
                    searchType?: "semantic" | "structural" | "usage" | "dependency" | undefined;
                    filters?: {
                        path?: string | undefined;
                        tags?: string[] | undefined;
                        language?: string | undefined;
                        lastModified?: {
                            since?: Date | undefined;
                            until?: Date | undefined;
                        } | undefined;
                        checkpointId?: string | undefined;
                    } | undefined;
                    includeRelated?: boolean | undefined;
                };
                _input_out: {
                    query: string;
                    limit: number;
                    entityTypes?: ("function" | "spec" | "file" | "class" | "interface" | "module" | "test" | "change" | "session" | "directory")[] | undefined;
                    searchType?: "semantic" | "structural" | "usage" | "dependency" | undefined;
                    filters?: {
                        path?: string | undefined;
                        tags?: string[] | undefined;
                        language?: string | undefined;
                        lastModified?: {
                            since?: Date | undefined;
                            until?: Date | undefined;
                        } | undefined;
                        checkpointId?: string | undefined;
                    } | undefined;
                    includeRelated?: boolean | undefined;
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                items: Entity[];
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
            }, any>>;
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
            }, Entity[]>>;
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
                    changeType: "refactor" | "modify" | "delete";
                };
                _input_out: {
                    entityId: string;
                    changeType: "refactor" | "modify" | "delete";
                };
                _output_in: typeof import("@trpc/server").unsetMarker;
                _output_out: typeof import("@trpc/server").unsetMarker;
            }, {
                entityId: string;
                entityType: any;
                changeType: "refactor" | "modify" | "delete";
                impactScore: number;
                riskLevel: string;
                directlyImpacted: number;
                totalRelationships: number;
                impactedEntities: string[];
                highRiskChanges: never[];
                warnings: never[];
                recommendations: string[];
                timestamp: string;
            }>>;
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
            }, any>>;
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
            }>>;
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
            }, any>>;
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
            }, any>>;
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
            }, any>>;
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
            }, any>>;
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
            }, any>>;
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
            }, any>>;
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
            services: any;
        }>>;
    };
};
//# sourceMappingURL=client.d.ts.map