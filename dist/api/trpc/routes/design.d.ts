/**
 * Design System tRPC Routes
 * Type-safe procedures for design specification workflows
 */
import { type TRPCContext } from '../base.js';
export declare const designRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
    }, unknown>;
}>;
//# sourceMappingURL=design.d.ts.map