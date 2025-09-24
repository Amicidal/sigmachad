/**
 * Code Analysis tRPC Routes
 * Type-safe procedures for code analysis and refactoring
 */
export declare const codeRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../trpc/base.js").TRPCContext;
    meta: object;
    errorShape: any;
    transformer: typeof import("superjson").default;
}>, {
    analyze: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../trpc/base.js").TRPCContext;
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
    }>;
    refactor: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../trpc/base.js").TRPCContext;
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
    }>;
    parseFile: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../trpc/base.js").TRPCContext;
        _input_in: {
            filePath: string;
        };
        _input_out: {
            filePath: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("packages/knowledge/dist/parsing/ASTParser.js").ParseResult>;
    getSymbols: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc/base.js").TRPCContext;
            meta: object;
            errorShape: any;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: import("../trpc/base.js").TRPCContext;
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
    }, Entity[]>;
}>;
//# sourceMappingURL=trpc-code.d.ts.map