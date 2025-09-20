import type { AuthContext } from "../middleware/authentication.js";

export interface WebSocketFilter {
  path?: string;
  paths?: string[];
  type?: string;
  types?: string[];
  changeType?: string;
  changeTypes?: string[];
  eventTypes?: string[];
  entityTypes?: string[];
  entityType?: string;
  relationshipTypes?: string[];
  relationshipType?: string;
  extensions?: string[];
  sessionId?: string;
  sessionIds?: string[];
  operationId?: string;
  operationIds?: string[];
  sessionEvents?: string[];
  sessionEdgeTypes?: string[];
}

export interface WebSocketMessage {
  type: string;
  id?: string;
  data?: any;
  filter?: WebSocketFilter;
  timestamp?: string;
}

export interface SubscriptionRequest {
  event: string;
  filter?: WebSocketFilter;
}

export interface WebSocketEvent {
  type:
    | "file_change"
    | "graph_update"
    | "entity_created"
    | "entity_updated"
    | "entity_deleted"
    | "relationship_created"
    | "relationship_deleted"
    | "sync_status"
    | "session_event";
  timestamp: string;
  data: any;
  source?: string;
}

export interface NormalizedSubscriptionFilter {
  paths: string[];
  absolutePaths: string[];
  extensions: string[];
  types: string[];
  eventTypes: string[];
  entityTypes: string[];
  relationshipTypes: string[];
  sessionIds: string[];
  operationIds: string[];
  sessionEvents: string[];
  sessionEdgeTypes: string[];
}

export interface ConnectionSubscription {
  id: string;
  event: string;
  rawFilter?: WebSocketFilter;
  normalizedFilter?: NormalizedSubscriptionFilter;
}

export interface WebSocketConnection {
  id: string;
  socket: any;
  subscriptions: Map<string, ConnectionSubscription>;
  lastActivity: Date;
  userAgent?: string;
  ip?: string;
  subscriptionCounter: number;
  auth?: AuthContext;
}

export interface BackpressureConfig {
  thresholdBytes: number;
  retryDelayMs: number;
  maxRetries: number;
}
