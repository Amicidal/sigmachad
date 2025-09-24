/**
 * Design System tRPC Routes
 * Type-safe procedures for design specification workflows
 */
import { type TRPCContext } from '../trpc/base.js';
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
    }, unknown>;
}>;
//# sourceMappingURL=trpc-design.d.ts.map