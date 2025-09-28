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

export interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  overall: {
    passed: boolean;
    score: number;
    duration: number;
  };
  typescript: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  eslint: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  security: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: any[];
  };
  tests: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: any;
  };
  coverage: any;
  architecture: {
    violations: number;
    issues: ValidationIssue[];
  };
}

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
  syncCoordinator?: SynchronizationCoordinator;
  syncMonitor?: SynchronizationMonitoring;
  conflictResolver?: ConflictResolution;
  rollbackCapabilities?: RollbackCapabilities;
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
  path: string;
  method: string;
  requiredScopes: string[];
}

export interface ScopeRule {
  pattern: string;
  scopes: string[];
  description?: string;
}

// Type definitions for synchronization services
interface SynchronizationCoordinator {
  startSync(sessionId: string): Promise<void>;
  stopSync(sessionId: string): Promise<void>;
  getSyncStatus(sessionId: string): Promise<any>;
}

interface SynchronizationMonitoring {
  getMetrics(): Promise<any>;
  getHealth(): Promise<any>;
}

interface ConflictResolution {
  resolveConflicts(conflicts: any[]): Promise<any>;
}

interface RollbackCapabilities {
  rollback(sessionId: string): Promise<void>;
  getRollbackStatus(sessionId: string): Promise<any>;
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
