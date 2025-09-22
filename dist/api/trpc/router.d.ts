/**
 * tRPC Router for Memento
 * Provides type-safe API endpoints with automatic OpenAPI generation
 */
import { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/core/DatabaseService.js';
import { ASTParser } from '../../services/knowledge/ASTParser.js';
import { FileWatcher } from '../../services/core/FileWatcher.js';
import { TRPCContext } from './base.js';
import type { FastifyRequest } from 'fastify';
import { type AuthContext } from '../middleware/authentication.js';
export declare const createTRPCContext: (opts: {
    kgService: KnowledgeGraphService;
    dbService: DatabaseService;
    astParser: ASTParser;
    fileWatcher: FileWatcher;
    req?: FastifyRequest;
}) => Promise<TRPCContext>;
export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    code: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof import("superjson").default;
    }>, {
        analyze: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
        }, never>;
        refactor: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
        }, never>;
        parseFile: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                filePath: string;
            };
            _input_out: {
                filePath: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../../services/knowledge/ASTParser.js").ParseResult>;
        getSymbols: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
        }, import("../../models/entities.js").Entity[]>;
    }>;
    design: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof import("superjson").default;
    }>, {
        validateSpec: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
                    file?: string | undefined;
                    suggestion?: string | undefined;
                    line?: number | undefined;
                    column?: number | undefined;
                    severity?: "info" | "error" | "warning" | undefined;
                    field?: string | undefined;
                    rule?: string | undefined;
                }[];
                isValid: boolean;
                suggestions: string[];
            };
            _output_out: {
                issues: {
                    message: string;
                    severity: "info" | "error" | "warning";
                    file?: string | undefined;
                    suggestion?: string | undefined;
                    line?: number | undefined;
                    column?: number | undefined;
                    field?: string | undefined;
                    rule?: string | undefined;
                }[];
                isValid: boolean;
                suggestions: string[];
            };
        }, unknown>;
        getTestCoverage: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
        }, unknown>;
        upsertSpec: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                id: string;
                title: string;
                description: string;
                acceptanceCriteria: string[];
                status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                priority?: "high" | "medium" | "low" | "critical" | undefined;
                assignee?: string | null | undefined;
                tags?: string[] | undefined;
                updated?: string | Date | undefined;
                path?: string | undefined;
                hash?: string | undefined;
                language?: string | undefined;
                lastModified?: string | Date | undefined;
                created?: string | Date | undefined;
                metadata?: Record<string, any> | undefined;
            };
            _input_out: {
                id: string;
                title: string;
                description: string;
                acceptanceCriteria: string[];
                status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                priority?: "high" | "medium" | "low" | "critical" | undefined;
                assignee?: string | null | undefined;
                tags?: string[] | undefined;
                updated?: string | Date | undefined;
                path?: string | undefined;
                hash?: string | undefined;
                language?: string | undefined;
                lastModified?: string | Date | undefined;
                created?: string | Date | undefined;
                metadata?: Record<string, any> | undefined;
            };
            _output_in: {
                spec: {
                    type: "spec";
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
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
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    metadata?: Record<string, any> | undefined;
                };
                created: boolean;
                success: true;
            };
        }, unknown>;
        getSpec: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: {
                spec: {
                    type: "spec";
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
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
                    status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                    priority?: "high" | "medium" | "low" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    id?: string | undefined;
                    title?: string | undefined;
                    description?: string | undefined;
                    acceptanceCriteria?: string[] | undefined;
                    updated?: Date | undefined;
                    path?: string | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    lastModified?: Date | undefined;
                    created?: Date | undefined;
                    metadata?: Record<string, any> | undefined;
                }[];
                affectedEntities: any[];
            };
            _output_out: {
                spec: {
                    type: "spec";
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
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
                    status?: "deprecated" | "draft" | "approved" | "implemented" | undefined;
                    priority?: "high" | "medium" | "low" | "critical" | undefined;
                    assignee?: string | null | undefined;
                    tags?: string[] | undefined;
                    id?: string | undefined;
                    title?: string | undefined;
                    description?: string | undefined;
                    acceptanceCriteria?: string[] | undefined;
                    updated?: Date | undefined;
                    path?: string | undefined;
                    hash?: string | undefined;
                    language?: string | undefined;
                    lastModified?: Date | undefined;
                    created?: Date | undefined;
                    metadata?: Record<string, any> | undefined;
                }[];
                affectedEntities: any[];
            };
        }, unknown>;
        listSpecs: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                status?: ("deprecated" | "draft" | "approved" | "implemented")[] | undefined;
                priority?: ("high" | "medium" | "low" | "critical")[] | undefined;
                assignee?: string | undefined;
                tags?: string[] | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
                sortBy?: "status" | "priority" | "title" | "updated" | "created" | undefined;
                sortOrder?: "asc" | "desc" | undefined;
            } | undefined;
            _input_out: {
                status?: ("deprecated" | "draft" | "approved" | "implemented")[] | undefined;
                priority?: ("high" | "medium" | "low" | "critical")[] | undefined;
                assignee?: string | undefined;
                tags?: string[] | undefined;
                search?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
                sortBy?: "status" | "priority" | "title" | "updated" | "created" | undefined;
                sortOrder?: "asc" | "desc" | undefined;
            } | undefined;
            _output_in: {
                items: {
                    type: "spec";
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
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
                    status: "deprecated" | "draft" | "approved" | "implemented";
                    priority: "high" | "medium" | "low" | "critical";
                    id: string;
                    title: string;
                    description: string;
                    acceptanceCriteria: string[];
                    updated: Date;
                    path: string;
                    hash: string;
                    language: string;
                    lastModified: Date;
                    created: Date;
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
        }, unknown>;
    }>;
    graph: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof import("superjson").default;
    }>, {
        getEntities: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
            items: import("../../models/entities.js").Entity[] | undefined;
            total: number;
            limit: number;
            offset: number;
        }>;
        getEntity: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../../models/entities.js").Entity>;
        getRelationships: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                query: string;
                limit?: number | undefined;
                entityTypes?: ("function" | "class" | "test" | "file" | "directory" | "module" | "interface" | "spec" | "change" | "session")[] | undefined;
                searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
                filters?: {
                    tags?: string[] | undefined;
                    path?: string | undefined;
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
                entityTypes?: ("function" | "class" | "test" | "file" | "directory" | "module" | "interface" | "spec" | "change" | "session")[] | undefined;
                searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
                filters?: {
                    tags?: string[] | undefined;
                    path?: string | undefined;
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
            items: import("../../models/entities.js").Entity[];
            total: number;
        }>;
        getDependencies: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                entityId: string;
                depth?: number | undefined;
            };
            _input_out: {
                depth: number;
                entityId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../../models/types.js").DependencyAnalysis>;
        getClusters: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
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
        }, import("../../models/entities.js").Entity[]>;
        analyzeImpact: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                changeType: "delete" | "modify" | "refactor";
                entityId: string;
            };
            _input_out: {
                changeType: "delete" | "modify" | "refactor";
                entityId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, never>;
        timeTravel: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: TRPCContext;
            _input_in: {
                startId: string;
                types?: string[] | undefined;
                maxDepth?: number | undefined;
                since?: Date | undefined;
                until?: Date | undefined;
                atTime?: Date | undefined;
            };
            _input_out: {
                startId: string;
                types?: string[] | undefined;
                maxDepth?: number | undefined;
                since?: Date | undefined;
                until?: Date | undefined;
                atTime?: Date | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, any>;
    }>;
    admin: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof import("superjson").default;
    }>, {
        getLogs: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
            };
            _input_in: {
                type?: "search" | "relationships" | "entities" | "all" | undefined;
            };
            _input_out: {
                type: "search" | "relationships" | "entities" | "all";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, never>;
        getConfig: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, any>;
        ensureIndexes: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
    history: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: TRPCContext;
        meta: object;
        errorShape: any;
        transformer: typeof import("superjson").default;
    }>, {
        createCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
            checkpointId: any;
        }>;
        listCheckpoints: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
            items: any;
            total: any;
        }>;
        getCheckpoint: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
        }, any>;
        deleteCheckpoint: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: TRPCContext;
                meta: object;
                errorShape: any;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                kgService: KnowledgeGraphService;
                dbService: DatabaseService;
                astParser: ASTParser;
                fileWatcher: FileWatcher;
                authToken: string | undefined;
                authContext: AuthContext | undefined;
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
    health: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _ctx_out: TRPCContext;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        status: string;
        timestamp: string;
        services: import("../../services/index.js").IDatabaseHealthCheck;
    }>;
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=router.d.ts.map