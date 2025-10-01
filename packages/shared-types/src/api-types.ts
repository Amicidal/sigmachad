/**
 * API Types and Interfaces for Memento
 * Common API response types and utilities used across packages
 */

// Base API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    executionTime: number;
  };
}

export interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// Common query parameters
export interface BaseQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
}

export interface TimeRangeParams {
  since?: Date;
  until?: Date;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
}

// Error handling
export interface APIError {
  code:
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'INTERNAL_ERROR'
    | 'RATE_LIMITED';
  message: string;
  details?: any;
  requestId: string;
  timestamp: Date;
}

// Rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// Authentication types
export interface AuthenticatedRequest {
  headers: {
    Authorization: `Bearer ${string}`;
    'X-API-Key'?: string;
    'X-Request-ID'?: string;
  };
}

// WebSocket and real-time types
export interface WebhookConfig {
  url: string;
  events: ('sync.completed' | 'validation.failed' | 'security.alert')[];
  secret: string;
}

export interface RealTimeSubscription {
  event: string;
  filter?: any;
  callback: (event: any) => void;
}

// MCP Types (Model Context Protocol)
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export interface MCPRequest {
  method: string;
  params: any;
  id?: string;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id?: string;
}

// System health and monitoring
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    graphDatabase: ComponentHealth;
    vectorDatabase: ComponentHealth;
    fileWatcher: ComponentHealth;
    apiServer: ComponentHealth;
  };
  metrics: {
    uptime: number;
    totalEntities: number;
    totalRelationships: number;
    syncLatency: number;
    errorRate: number;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorRate?: number;
  lastCheck: Date;
  message?: string;
}

export type { ValidationResult, ValidationIssue } from './core-types.js';

// API Gateway and Middleware Types
export interface APIGatewayConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  auth?: {
    scopeRules?: ScopeRule[];
  };
}

export interface SynchronizationServices {
  syncCoordinator?: ISynchronizationCoordinator;
  syncMonitor?: ISynchronizationMonitoring;
  conflictResolver?: IConflictResolution;
  rollbackCapabilities?: IRollbackCapabilities;
}

export interface ErrorContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  timestamp: string;
  duration?: number;
}

export interface ErrorMetadata {
  code: string;
  statusCode: number;
  category:
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'rate_limit'
    | 'not_found'
    | 'server_error'
    | 'service_unavailable';
  retryable: boolean;
  details?: Record<string, any>;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: string;
    retryable: boolean;
    details?: Record<string, any>;
  };
  context: ErrorContext;
}

export interface ApiKeyRecord {
  id: string;
  secretHash: string;
  algorithm?: 'sha256' | 'sha512';
  scopes: string[];
  lastRotatedAt?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyRegistry {
  version?: string;
  updatedAt?: string;
  keys: ApiKeyRecord[];
}

interface VerificationFailure {
  ok: false;
  errorCode: 'INVALID_API_KEY' | 'CHECKSUM_MISMATCH';
  message: string;
}

interface VerificationSuccess {
  ok: true;
  record: ApiKeyRecord;
  scopes: string[];
}

export type ApiKeyVerification = VerificationFailure | VerificationSuccess;

export interface ScopeRequirement {
  scopes: string[];
  mode?: 'all' | 'any';
  description?: string;
}

export interface ScopeRule {
  matcher: RegExp;
  method?: string;
  scopes: string[];
  description?: string;
}

// Synchronization Event Bus Interfaces
// Minimal EventEmitter-like interfaces to avoid circular dependencies with @memento/sync

/**
 * Event listener function type for synchronization events
 */
export type SyncEventListener = (...args: any[]) => void;

/**
 * Minimal EventEmitter interface for synchronization coordinator
 * Extends the EventEmitter contract used by SynchronizationCoordinator
 */
export interface ISynchronizationCoordinator {
  // EventEmitter methods (structural subset)
  on(event: string | symbol, listener: SyncEventListener): this;
  addListener?(event: string | symbol, listener: SyncEventListener): this;
  once?(event: string | symbol, listener: SyncEventListener): this;
  off?(event: string | symbol, listener: SyncEventListener): this;
  removeListener(event: string | symbol, listener: SyncEventListener): this;
  removeAllListeners?(event?: string | symbol): this;
  emit?(event: string | symbol, ...args: any[]): boolean;
  setMaxListeners?(n: number): this;
  getMaxListeners?(): number;
  listenerCount?(event: string | symbol): number;
  listeners?(event: string | symbol): Function[];

  // Coordinator-specific methods
  getCheckpointMetrics?(): {
    metrics: any;
    deadLetters: any[];
  };
  getQueueLength?(): number;
  startFullSynchronization?(options: Record<string, unknown>): Promise<string>;
}

/**
 * Minimal interface for synchronization monitoring service
 */
export interface ISynchronizationMonitoring {
  getCheckpointMetricsSnapshot?(): {
    event: string;
    metrics: any;
    deadLetters: any[];
    context?: Record<string, unknown>;
    timestamp: Date;
  } | null;
  getSyncMetrics?(): any;
  getHealthMetrics?(): any;
  getActiveOperations?(): any[];
}

/**
 * Minimal interface for conflict resolution service
 */
export interface IConflictResolution {
  // Align with service methods
  resolveConflict?(conflictId: string, resolution: any): Promise<boolean>;
  detectConflicts?(
    incomingEntities: any[],
    incomingRelationships: any[]
  ): Promise<any[]>;
}

/**
 * Minimal interface for rollback capabilities
 */
export interface IRollbackCapabilities {
  createRollbackPoint?(operationId: string, description: string): Promise<string>;
  listRollbackPoints?(entityId: string): Promise<any[]>;
  getSessionCheckpointHistory?(sessionId: string, options?: { limit?: number }): any[];
}

// API Key Registry Types
export type ApiKeyRegistryProvider = () => ApiKeyRegistry | null;

// API Authentication Types
export interface AuthErrorDetails {
  reason?: string;
  detail?: string;
  remediation?: string;
  tokenType?: string;
  expiresAt?: number;
  requiredScopes?: string[];
  providedScopes?: string[];
}
