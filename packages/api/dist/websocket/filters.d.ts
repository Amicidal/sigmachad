import type { ConnectionSubscription, NormalizedSubscriptionFilter, WebSocketEvent, WebSocketFilter } from "./types.js";
export declare const normalizeFilter: (filter?: WebSocketFilter) => NormalizedSubscriptionFilter | undefined;
export declare const matchesEvent: (subscription: ConnectionSubscription, event: WebSocketEvent) => boolean;
//# sourceMappingURL=filters.d.ts.map