/**
 * tRPC Client for Memento
 * Type-safe client for interacting with the tRPC API
 */
import superjson from 'superjson';
export declare const createTRPCClient: (baseUrl: string) => {
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
            services: {
                falkordb: boolean;
                qdrant: boolean;
                postgresql: boolean;
                redis?: boolean;
            };
        }>>;
    };
};
//# sourceMappingURL=client.d.ts.map