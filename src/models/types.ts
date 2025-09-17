/**
 * API Types and Interfaces for Memento
 * Based on the comprehensive API design
 */

import {
  Entity,
  Spec,
  Test,
  SecurityIssue,
  Vulnerability,
  CoverageMetrics,
} from "./entities.js";
import { GraphRelationship, RelationshipType } from "./relationships.js";

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

export interface PaginatedResponse<T> extends APIResponse<T[]> {
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
  sortOrder?: "asc" | "desc";
  includeMetadata?: boolean;
}

export interface TimeRangeParams {
  since?: Date;
  until?: Date;
  timeRange?: "1h" | "24h" | "7d" | "30d" | "90d";
}

// History/Checkpoint configuration
export interface HistoryConfig {
  enabled?: boolean;
  retentionDays?: number; // e.g., 30
  checkpoint?: {
    hops?: number;            // K-hop neighborhood size
    embedVersions?: boolean;  // whether to embed version nodes
  };
}

export type CheckpointReason = "daily" | "incident" | "manual";

export interface CheckpointCreateRequest {
  seedEntities: string[];
  reason: CheckpointReason;
  hops?: number;
  window?: TimeRangeParams;
}

export interface TemporalGraphQuery {
  startId: string;
  atTime?: Date;
  since?: Date;
  until?: Date;
  maxDepth?: number;
}

// Design & Specification Management Types
export interface CreateSpecRequest {
  title: string;
  description: string;
  goals: string[];
  acceptanceCriteria: string[];
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  dependencies?: string[];
}

export interface CreateSpecResponse {
  specId: string;
  spec: Spec;
  validationResults: {
    isValid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
  };
}

export interface GetSpecResponse {
  spec: Spec;
  relatedSpecs: Spec[];
  affectedEntities: Entity[];
  testCoverage: TestCoverage;
}

export interface UpdateSpecRequest {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  status?: "draft" | "approved" | "implemented" | "deprecated";
  priority?: "low" | "medium" | "high" | "critical";
}

export interface ListSpecsParams extends BaseQueryParams {
  status?: string[];
  priority?: string[];
  assignee?: string;
  tags?: string[];
  search?: string;
}

// Test Management Types
export interface TestPlanRequest {
  specId: string;
  testTypes?: ("unit" | "integration" | "e2e")[];
  coverage?: {
    minLines?: number;
    minBranches?: number;
    minFunctions?: number;
  };
  includePerformanceTests?: boolean;
  includeSecurityTests?: boolean;
}

export interface TestPlanResponse {
  testPlan: {
    unitTests: TestSpec[];
    integrationTests: TestSpec[];
    e2eTests: TestSpec[];
    performanceTests: TestSpec[];
  };
  estimatedCoverage: CoverageMetrics;
  changedFiles: string[];
}

export interface TestSpec {
  name: string;
  description: string;
  type: "unit" | "integration" | "e2e" | "performance";
  targetFunction?: string;
  assertions: string[];
  dataRequirements?: string[];
}

export interface TestExecutionResult {
  testId: string;
  testSuite: string;
  testName: string;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
}

export interface PerformanceMetrics {
  entityId: string;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: "above" | "below" | "at";
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    successRate: number;
  }[];
}

export interface TestCoverage {
  entityId: string;
  overallCoverage: CoverageMetrics;
  testBreakdown: {
    unitTests: CoverageMetrics;
    integrationTests: CoverageMetrics;
    e2eTests: CoverageMetrics;
  };
  uncoveredLines: number[];
  uncoveredBranches: number[];
  testCases: {
    testId: string;
    testName: string;
    covers: string[];
  }[];
}

// Graph Operations Types
export interface GraphSearchRequest {
  query: string;
  entityTypes?: (
    | "function"
    | "class"
    | "interface"
    | "file"
    | "module"
    | "spec"
    | "test"
    | "change"
    | "session"
    | "directory"
  )[];
  searchType?: "semantic" | "structural" | "usage" | "dependency";
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: TimeRangeParams;
    checkpointId?: string;
  };
  includeRelated?: boolean;
  limit?: number;
}

export interface GraphSearchResult {
  entities: Entity[];
  relationships: GraphRelationship[];
  clusters: any[];
  relevanceScore: number;
}

export interface GraphExamples {
  entityId: string;
  signature: string;
  usageExamples: {
    context: string;
    code: string;
    file: string;
    line: number;
  }[];
  testExamples: {
    testId: string;
    testName: string;
    testCode: string;
    assertions: string[];
  }[];
  relatedPatterns: {
    pattern: string;
    frequency: number;
    confidence: number;
  }[];
}

export interface DependencyAnalysis {
  entityId: string;
  directDependencies: {
    entity: Entity;
    relationship: RelationshipType;
    confidence: number;
  }[];
  indirectDependencies: {
    entity: Entity;
    path: Entity[];
    relationship: RelationshipType;
    distance: number;
  }[];
  reverseDependencies: {
    entity: Entity;
    relationship: RelationshipType;
    impact: "high" | "medium" | "low";
  }[];
  circularDependencies: {
    cycle: Entity[];
    severity: "critical" | "warning" | "info";
  }[];
}

// Code Operations Types
export interface CodeChangeProposal {
  changes: {
    file: string;
    type: "create" | "modify" | "delete" | "rename";
    oldContent?: string;
    newContent?: string;
    lineStart?: number;
    lineEnd?: number;
  }[];
  description: string;
  relatedSpecId?: string;
}

export interface CodeChangeAnalysis {
  affectedEntities: Entity[];
  breakingChanges: {
    severity: "breaking" | "potentially-breaking" | "safe";
    description: string;
    affectedEntities: string[];
  }[];
  impactAnalysis: {
    directImpact: Entity[];
    indirectImpact: Entity[];
    testImpact: Test[];
  };
  recommendations: {
    type: "warning" | "suggestion" | "requirement";
    message: string;
    actions: string[];
  }[];
}

export interface ValidationRequest {
  files?: string[];
  specId?: string;
  includeTypes?: (
    | "typescript"
    | "eslint"
    | "security"
    | "tests"
    | "coverage"
    | "architecture"
  )[];
  failOnWarnings?: boolean;
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
    issues: SecurityIssue[];
  };
  tests: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: CoverageMetrics;
  };
  coverage: CoverageMetrics;
  architecture: {
    violations: number;
    issues: ValidationIssue[];
  };
}

export interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

// Impact Analysis Types
export interface ImpactAnalysisRequest {
  changes: {
    entityId: string;
    changeType: "modify" | "delete" | "rename";
    newName?: string;
    signatureChange?: boolean;
  }[];
  includeIndirect?: boolean;
  maxDepth?: number;
}

export interface ImpactAnalysis {
  directImpact: {
    entities: Entity[];
    severity: "high" | "medium" | "low";
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: Entity[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  testImpact: {
    affectedTests: Test[];
    requiredUpdates: string[];
    coverageImpact: number;
  };
  documentationImpact: {
    staleDocs: any[];
    missingDocs: any[];
    requiredUpdates: string[];
    freshnessPenalty: number;
  };
  deploymentGate: {
    blocked: boolean;
    level: "none" | "advisory" | "required";
    reasons: string[];
    stats: {
      missingDocs: number;
      staleDocs: number;
      freshnessPenalty: number;
    };
  };
  recommendations: {
    priority: "immediate" | "planned" | "optional";
    description: string;
    effort: "low" | "medium" | "high";
    impact: "breaking" | "functional" | "cosmetic";
    type?: "warning" | "requirement" | "suggestion";
    actions?: string[];
  }[];
}

// Vector Database Types
export interface VectorSearchRequest {
  query: string;
  entityTypes?: string[];
  similarity?: number;
  limit?: number;
  includeMetadata?: boolean;
  filters?: {
    language?: string;
    lastModified?: TimeRangeParams;
    tags?: string[];
  };
}

export interface VectorSearchResult {
  results: {
    entity: Entity;
    similarity: number;
    context: string;
    highlights: string[];
  }[];
  metadata: {
    totalResults: number;
    searchTime: number;
    indexSize: number;
  };
}

// Source Control Management Types
export interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: string;
  createPR?: boolean;
  branchName?: string;
  labels?: string[];
}

export interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  relatedArtifacts: {
    spec: Spec;
    tests: Test[];
    validation: ValidationResult;
  };
}

// Security Types
export interface SecurityScanRequest {
  entityIds?: string[];
  scanTypes?: ("sast" | "sca" | "secrets" | "dependency")[];
  severity?: ("critical" | "high" | "medium" | "low")[];
}

export interface SecurityScanResult {
  issues: SecurityIssue[];
  vulnerabilities: Vulnerability[];
  summary: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface VulnerabilityReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Vulnerability[];
  byPackage: Record<string, Vulnerability[]>;
  remediation: {
    immediate: string[];
    planned: string[];
    monitoring: string[];
  };
}

// Administration Types
export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
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
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  errorRate?: number;
  lastCheck: Date;
  message?: string;
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date;
  queueDepth: number;
  processingRate: number;
  errors: {
    count: number;
    recent: string[];
  };
  performance: {
    syncLatency: number;
    throughput: number;
    successRate: number;
  };
}

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  includeTests?: boolean;
  includeSecurity?: boolean;
}

export interface SystemAnalytics extends TimeRangeParams {
  usage: {
    apiCalls: number;
    uniqueUsers: number;
    popularEndpoints: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
  content: {
    totalEntities: number;
    totalRelationships: number;
    growthRate: number;
    mostActiveDomains: string[];
  };
}

// Error handling
export interface APIError {
  code:
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "PERMISSION_DENIED"
    | "INTERNAL_ERROR"
    | "RATE_LIMITED";
  message: string;
  details?: any;
  requestId: string;
  timestamp: Date;
}

// Authentication types
export interface AuthenticatedRequest {
  headers: {
    Authorization: `Bearer ${string}`;
    "X-API-Key"?: string;
    "X-Request-ID"?: string;
  };
}

// Rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// WebSocket and real-time types
export interface WebhookConfig {
  url: string;
  events: ("sync.completed" | "validation.failed" | "security.alert")[];
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
