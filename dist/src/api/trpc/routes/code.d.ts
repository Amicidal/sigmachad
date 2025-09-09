/**
 * Code Analysis tRPC Routes
 * Type-safe procedures for code analysis and refactoring
 */
export declare const codeRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    analyze: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
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
    }, {
        file: string;
        lineRange: {
            start: number;
            end: number;
        };
        suggestions: any[];
    }>;
    refactor: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
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
    }>;
    parseFile: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
        _input_in: {
            filePath: string;
        };
        _input_out: {
            filePath: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("../../../services/ASTParser.js").ParseResult>;
    getSymbols: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../base.js").TRPCContext;
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
    }, import("../../../models/entities.js").Entity[]>;
}>;
//# sourceMappingURL=code.d.ts.map