/**
 * tRPC Client for Memento
 * Type-safe client for interacting with the tRPC API
 */
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
export const createTRPCClient = (baseUrl) => {
    return createTRPCProxyClient({
        transformer: superjson,
        links: [
            httpBatchLink({
                url: `${baseUrl}/api/trpc`,
                // You can add authentication headers here
                headers: () => ({
                    'Content-Type': 'application/json',
                }),
            }),
        ],
    });
};
// Usage example:
/*
const client = createTRPCClient('http://localhost:3000');

// Type-safe API calls
const health = await client.health.query();
const entities = await client.graph.getEntities.query({ limit: 10 });
const suggestions = await client.code.analyze.query({
  file: 'src/index.ts',
  lineStart: 1,
  lineEnd: 50
});
*/
//# sourceMappingURL=client.js.map