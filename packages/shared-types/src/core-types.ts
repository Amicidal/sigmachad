/**
 * Core Types and Interfaces for Memento
 * Common types extracted from core package that are used across multiple packages
 */

// Note: Node.js types are imported from the global types
import type {
  SecurityIssue,
  Vulnerability,
  CoverageMetrics,
  Change,
  Spec,
  Test,
  Entity,
  RelationshipType as RelationshipTypeEnum,
  GraphRelationship,
  SessionRelationship,
  RedisConfig,
  SessionDocument,
  SessionState,
  TimeRangeParams,
} from './index.js';

// Note: Types are imported from individual modules for use within this file
// They are re-exported from the main index.ts file

export type {
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
} from './entities.js';

// Session Types
export interface SessionConfig {
  maxDuration?: number;
  maxInactiveTime?: number;
  refreshThreshold?: number;
  cleanupInterval?: number;
  maxConcurrentSessions?: number;
  sessionTimeout?: number;
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    ttl?: number;
  };
}

export interface SessionMetadata {
  id: string;
  userId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface SessionQueryOptions {
  userId?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'lastAccessedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionChangeSummary {
  sessionId: string;
  changes: number;
  additions: number;
  deletions: number;
  modifications: number;
  timestamp: Date;
}

export interface SessionChangesResult {
  sessionId: string;
  changes: SessionChangeSummary[];
  totalChanges: number;
  hasMore: boolean;
}

export interface SessionTimelineEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  eventType: 'created' | 'accessed' | 'extended' | 'expired' | 'terminated';
  metadata?: Record<string, any>;
}

export interface SessionTimelineSummary {
  sessionId: string;
  events: SessionTimelineEvent[];
  duration: number;
  totalEvents: number;
}

export interface SessionTimelineResult {
  sessions: SessionTimelineSummary[];
  totalSessions: number;
  hasMore: boolean;
}

export interface SessionImpactEntry {
  sessionId: string;
  impact: 'high' | 'medium' | 'low';
  affectedEntities: number;
  affectedTests: number;
  changes: number;
}

export interface SessionImpactsResult {
  sessions: SessionImpactEntry[];
  totalSessions: number;
  hasMore: boolean;
}

export interface SessionsAffectingEntityEntry {
  sessionId: string;
  impact: 'direct' | 'indirect';
  confidence: number;
  affectedEntities: string[];
}

export interface SessionsAffectingEntityResult {
  entityId: string;
  sessions: SessionsAffectingEntityEntry[];
  totalSessions: number;
  hasMore: boolean;
}

// Performance Types
export type PerformanceSeverity = 'critical' | 'high' | 'medium' | 'low';
export type PerformanceTrend = 'improving' | 'stable' | 'degrading';

export interface PerformanceMetricSample {
  timestamp?: Date;
  value: number;
  runId?: string;
  environment?: string;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceHistoryOptions {
  days?: number;
  metricId?: string;
  environment?: string;
  severity?: PerformanceSeverity;
  limit?: number;
}

export interface PerformanceHistoryRecord {
  id?: string;
  testId?: string;
  targetId?: string;
  metricId: string;
  scenario?: string;
  environment?: string;
  severity?: PerformanceSeverity;
  trend?: PerformanceTrend;
  unit?: string;
  baselineValue?: number | null;
  currentValue?: number | null;
  delta?: number | null;
  percentChange?: number | null;
  sampleSize?: number | null;
  riskScore?: number | null;
  runId?: string;
  detectedAt?: Date | null;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[] | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date | null;
  source?: 'snapshot';
}

export interface PerformanceMetrics {
  entityId: string;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: 'above' | 'below' | 'at';
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    averageExecutionTime: number;
    p95ExecutionTime: number;
    successRate: number;
    coveragePercentage?: number;
    runId?: string;
  }[];
}

// Validation Types
export interface ValidationRequest {
  files?: string[];
  specId?: string;
  includeTypes?: (
    | 'typescript'
    | 'eslint'
    | 'security'
    | 'tests'
    | 'coverage'
    | 'architecture'
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
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

// Impact Analysis Types
export interface ImpactAnalysisRequest {
  changes: {
    entityId: string;
    changeType: 'modify' | 'delete' | 'rename';
    newName?: string;
    signatureChange?: boolean;
  }[];
  includeIndirect?: boolean;
  maxDepth?: number;
}

export interface ImpactAnalysisSpecImpact {
  relatedSpecs: Array<{
    specId: string;
    spec?: Pick<
      Spec,
      'id' | 'title' | 'priority' | 'status' | 'assignee' | 'tags'
    >;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    impactLevel?: 'critical' | 'high' | 'medium' | 'low';
    status?: Spec['status'] | 'unknown';
    ownerTeams: string[];
    acceptanceCriteriaIds: string[];
    relationships: Array<{
      type: RelationshipTypeEnum;
      impactLevel?: 'critical' | 'high' | 'medium' | 'low';
      priority?: 'critical' | 'high' | 'medium' | 'low';
      acceptanceCriteriaId?: string;
      acceptanceCriteriaIds?: string[];
      rationale?: string;
      ownerTeam?: string;
      confidence?: number;
      status?: Spec['status'] | 'unknown';
    }>;
  }>;
  requiredUpdates: string[];
  summary: {
    byPriority: Record<'critical' | 'high' | 'medium' | 'low', number>;
    byImpactLevel: Record<'critical' | 'high' | 'medium' | 'low', number>;
    statuses: Record<
      'draft' | 'approved' | 'implemented' | 'deprecated' | 'unknown',
      number
    >;
    acceptanceCriteriaReferences: number;
    pendingSpecs: number;
  };
}

export interface ImpactAnalysis {
  directImpact: {
    entities: Entity[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: Entity[];
    relationship: RelationshipTypeEnum;
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
  specImpact: ImpactAnalysisSpecImpact;
  deploymentGate: {
    blocked: boolean;
    level: 'none' | 'advisory' | 'required';
    reasons: string[];
    stats: {
      missingDocs: number;
      staleDocs: number;
      freshnessPenalty: number;
    };
  };
  recommendations: {
    priority: 'immediate' | 'planned' | 'optional';
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'breaking' | 'functional' | 'cosmetic';
    type?: 'warning' | 'requirement' | 'suggestion';
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
    lastModified?: import('./api-types.js').TimeRangeParams;
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
export interface SCMCommitRecord {
  id?: string;
  commitHash: string;
  branch: string;
  title: string;
  description?: string;
  author?: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: any;
  prUrl?: string;
  provider?: string;
  status?: 'pending' | 'committed' | 'pushed' | 'merged' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SCMStatusSummary {
  branch: string;
  clean: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  lastCommit?: {
    hash: string;
    author: string;
    date?: string;
    title: string;
  } | null;
}

export interface SCMBranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote?: boolean;
  upstream?: string | null;
  lastCommit?: {
    hash: string;
    title: string;
    author?: string;
    date?: string;
  } | null;
}

export interface SCMPushResult {
  remote: string;
  branch: string;
  forced: boolean;
  pushed: boolean;
  commitHash?: string;
  provider?: string;
  url?: string;
  message?: string;
  timestamp: string;
}

export interface SCMCommitLogEntry {
  hash: string;
  author: string;
  email?: string;
  date: string;
  message: string;
  refs?: string[];
}

// Security Types
export interface SecurityScanRequest {
  entityIds?: string[];
  scanTypes?: ('sast' | 'sca' | 'secrets' | 'dependency')[];
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
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

export interface SystemAnalytics {
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
  since?: Date;
  until?: Date;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
}

// Design & Specification Management Types
export interface CreateSpecRequest {
  title: string;
  description: string;
  goals: string[];
  acceptanceCriteria: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
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
  status?: 'draft' | 'approved' | 'implemented' | 'deprecated';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ListSpecsParams {
  status?: string[];
  priority?: string[];
  assignee?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
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

// Test Management Types
export interface TestPlanRequest {
  specId: string;
  testTypes?: ('unit' | 'integration' | 'e2e')[];
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
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  targetFunction?: string;
  assertions: string[];
  dataRequirements?: string[];
}

export interface TestExecutionResult {
  testId: string;
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
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

// Code Operations Types
export interface CodeChangeProposal {
  changes: {
    file: string;
    type: 'create' | 'modify' | 'delete' | 'rename';
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
    severity: 'breaking' | 'potentially-breaking' | 'safe';
    description: string;
    affectedEntities: string[];
  }[];
  impactAnalysis: {
    directImpact: Entity[];
    indirectImpact: Entity[];
    testImpact: Test[];
  };
  recommendations: {
    type: 'warning' | 'suggestion' | 'requirement';
    message: string;
    actions: string[];
  }[];
}

// Graph Query Types
export interface TraversalQuery {
  startId: string;
  until?: Date;
  maxDepth?: number;
  relationshipTypes?: string[];
  nodeLabels?: string[];
}

export interface EntityTimelineEntry {
  versionId: string;
  timestamp: Date;
  hash?: string;
  path?: string;
  language?: string;
  changeSetId?: string;
  previousVersionId?: string | null;
  changes: Array<{
    changeId: string;
    type: RelationshipTypeEnum;
    metadata?: Record<string, any>;
    change?: Change;
  }>;
  metadata?: Record<string, any>;
}

export interface EntityTimelineResult {
  entityId: string;
  versions: EntityTimelineEntry[];
  relationships?: RelationshipTimeline[];
}

export interface RelationshipTimelineSegment {
  segmentId: string;
  openedAt: Date;
  closedAt?: Date | null;
  changeSetId?: string;
}

export interface RelationshipTimeline {
  relationshipId: string;
  type: RelationshipTypeEnum | string;
  fromEntityId: string;
  toEntityId: string;
  active: boolean;
  current?: RelationshipTimelineSegment;
  segments: RelationshipTimelineSegment[];
  lastModified?: Date;
  temporal?: Record<string, any>;
}

export interface StructuralNavigationEntry {
  entity: Entity;
  relationship: GraphRelationship;
}

export interface ModuleChildrenResult {
  modulePath: string;
  parentId?: string;
  children: StructuralNavigationEntry[];
}

export interface ModuleHistoryOptions {
  includeInactive?: boolean;
  limit?: number;
  versionLimit?: number;
}

export interface ModuleHistoryEntitySummary {
  id: string;
  type?: string;
  name?: string;
  path?: string;
  language?: string;
}

export interface ModuleHistoryRelationship {
  relationshipId: string;
  type: RelationshipTypeEnum | string;
  direction: 'outgoing' | 'incoming';
  from: ModuleHistoryEntitySummary;
  to: ModuleHistoryEntitySummary;
  active: boolean;
  current?: RelationshipTimelineSegment;
  segments: RelationshipTimelineSegment[];
  firstSeenAt?: Date | null;
  lastSeenAt?: Date | null;
  confidence?: number | null;
  scope?: string | null;
  metadata?: Record<string, any>;
  temporal?: Record<string, any>;
  lastModified?: Date;
}

export interface ModuleHistoryResult {
  moduleId?: string | null;
  modulePath: string;
  moduleType?: string;
  generatedAt: Date;
  versions: EntityTimelineEntry[];
  relationships: ModuleHistoryRelationship[];
}

export interface ImportEntry {
  relationship: GraphRelationship;
  target?: Entity | null;
}

export interface ListImportsResult {
  entityId: string;
  imports: ImportEntry[];
}

export interface DefinitionLookupResult {
  symbolId: string;
  relationship?: GraphRelationship | null;
  source?: Entity | null;
}

export interface DependencyAnalysis {
  entityId: string;
  directDependencies: {
    entity: Entity;
    relationship: RelationshipTypeEnum;
    confidence: number;
  }[];
  indirectDependencies: {
    entity: Entity;
    path: Entity[];
    relationship: RelationshipTypeEnum;
    distance: number;
  }[];
  reverseDependencies: {
    entity: Entity;
    relationship: RelationshipTypeEnum;
    impact: 'high' | 'medium' | 'low';
  }[];
  circularDependencies: {
    cycle: Entity[];
    severity: 'critical' | 'warning' | 'info';
  }[];
}

// Commit/PR Types
export interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: string | ValidationResult | Record<string, unknown>;
  createPR?: boolean;
  branchName?: string;
  labels?: string[];
}

export interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  status: 'committed' | 'pending' | 'failed';
  provider?: string;
  retryAttempts?: number;
  escalationRequired?: boolean;
  escalationMessage?: string;
  providerError?: {
    message: string;
    code?: string;
    lastAttempt?: number;
  };
  relatedArtifacts: {
    spec: Spec | null;
    tests: Test[];
    validation: ValidationResult | Record<string, unknown> | null;
  };
}

// Enhanced Session Store Types
export interface EnhancedSessionConfig {
  redis: RedisConfig;
  pool: Partial<PoolConfig>;
  enablePipelining: boolean;
  enableLazyLoading: boolean;
  enableCompression: boolean;
  enableLocalCache: boolean;
  localCacheSize: number;
  localCacheTTL: number; // milliseconds
  batchSize: number;
  pipelineTimeout: number; // milliseconds
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete' | 'addEvent';
  sessionId: string;
  data?: any;
  timestamp: number;
}

export interface CacheEntry {
  data: SessionDocument;
  timestamp: number;
  ttl: number;
}

export interface SessionStorePerformanceMetrics {
  totalOperations: number;
  averageLatency: number;
  cacheHitRate: number;
  pipelineOperations: number;
  compressionRatio: number;
  connectionPoolStats: any;
}

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number; // milliseconds
  idleTimeout: number; // milliseconds
  reapInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableHealthCheck: boolean;
  healthCheckInterval: number; // milliseconds
  enableLoadBalancing: boolean;
  preferWriteConnections: boolean;
}

// Graceful Shutdown Types
export interface GracefulShutdownConfig {
  gracePeriod: number; // milliseconds to wait for graceful shutdown
  forceCloseAfter: number; // milliseconds before forcing shutdown
  checkpointActiveSessions: boolean;
  preserveReplays: boolean;
  enableRecoveryData: boolean;
  shutdownSignals: string[];
}

export interface ShutdownStatus {
  phase:
    | 'initiated'
    | 'draining'
    | 'checkpointing'
    | 'cleanup'
    | 'complete'
    | 'forced';
  startTime: string;
  progress: {
    sessionsCheckpointed: number;
    totalSessions: number;
    connectionsClosedf: number;
    totalConnections: number;
    componentsShutdown: number;
    totalComponents: number;
  };
  errors: Array<{
    component: string;
    error: string;
    timestamp: string;
  }>;
  estimatedTimeRemaining?: number;
}

// Security Fix Types
export interface SecurityFixTask {
  id: string;
  type: 'security-fix';
  issueId?: string;
  filePath?: string;
  ruleId?: string;
  severity?: string;
  autoFix?: boolean;
  dryRun?: boolean;
  priority: 'immediate' | 'high' | 'medium' | 'low';
}

export interface SecurityFixResult {
  issueId: string;
  filePath: string;
  ruleId: string;
  status: 'fixed' | 'partial' | 'failed' | 'skipped';
  fixes: SecurityFix[];
  rollbackData?: RollbackData;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface SecurityFix {
  type:
    | 'code-replacement'
    | 'configuration'
    | 'dependency-update'
    | 'manual-review';
  description: string;
  originalCode?: string;
  fixedCode?: string;
  explanation: string;
  confidence: number;
  testable: boolean;
}

export interface RollbackData {
  originalContent: string;
  backupPath: string;
  timestamp: Date;
  checksum: string;
}

// Backup Types
export interface BackupOptions {
  type: 'full' | 'incremental';
  includeData: boolean;
  includeConfig: boolean;
  compression: boolean;
  destination?: string;
  storageProviderId?: string;
  labels?: string[];
}

export interface BackupMetadata {
  id: string;
  type: 'full' | 'incremental';
  timestamp: Date;
  size: number;
  checksum: string;
  components: {
    falkordb: boolean;
    qdrant: boolean;
    postgres: boolean;
    config: boolean;
  };
  status: 'completed' | 'failed' | 'in_progress';
}

export interface BackupFileStat {
  path: string;
  size: number;
  modifiedAt: Date;
}

export interface BackupStorageWriteOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface BackupStorageReadOptions {
  expectedContentType?: string;
}

// Worker Types
export type WorkerMessageType = 'task' | 'shutdown' | 'ping';
export type WorkerResponseType =
  | 'task_result'
  | 'error'
  | 'pong'
  | 'shutdown_complete';

export interface WorkerTaskMessage<TTask = unknown> {
  type: WorkerMessageType;
  payload?: TTask;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkerTaskResult<TResult = unknown> {
  type: 'task_result';
  taskId: string;
  success: boolean;
  result?: TResult;
  error?: string;
  duration: number;
}

// Synchronization Types
export interface SyncOperation {
  id: string;
  type: 'full' | 'incremental' | 'partial';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  filesProcessed: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  entitiesDeleted: number;
  relationshipsCreated: number;
  relationshipsUpdated: number;
  relationshipsDeleted: number;
  errors: SyncError[];
  conflicts: Conflict[];
  rollbackPoint?: string;
}

export interface SyncError {
  file: string;
  type:
    | 'parse'
    | 'database'
    | 'conflict'
    | 'unknown'
    | 'rollback'
    | 'cancelled'
    | 'capability';
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  rollbackOnError?: boolean;
  conflictResolution?: 'overwrite' | 'merge' | 'skip' | 'manual';
  batchSize?: number;
}

export type SessionEventKind =
  | 'session_started'
  | 'session_keepalive'
  | 'session_relationships'
  | 'session_checkpoint'
  | 'session_teardown';

// Conflict Resolution Types
export interface Conflict {
  id: string;
  type:
    | 'entity_version'
    | 'entity_deletion'
    | 'relationship_conflict'
    | 'concurrent_modification';
  entityId?: string;
  relationshipId?: string;
  description: string;
  conflictingValues: {
    current: any;
    incoming: any;
  };
  diff?: Record<string, { current: any; incoming: any }>;
  signature?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: ConflictResolutionResult;
  resolutionStrategy?: 'overwrite' | 'merge' | 'skip' | 'manual';
}

export interface ConflictResolution {
  strategy: 'overwrite' | 'merge' | 'skip' | 'manual';
  resolvedValue?: any;
  manualResolution?: string;
  timestamp: Date;
  resolvedBy: string;
}

export interface ConflictResolutionResult {
  strategy: 'overwrite' | 'merge' | 'skip' | 'manual';
  resolvedValue?: any;
}

// Sync-specific Types
export interface SessionStreamPayload {
  changeId?: string;
  relationships?: Array<{
    id: string;
    type: string;
    fromEntityId?: string;
    toEntityId?: string;
    metadata?: Record<string, unknown> | null;
  }>;
  checkpointId?: string;
  seeds?: string[];
  status?:
    | SyncOperation['status']
    | 'failed'
    | 'cancelled'
    | 'queued'
    | 'manual_intervention';
  errors?: SyncError[];
  processedChanges?: number;
  totalChanges?: number;
  details?: Record<string, unknown>;
}

export interface SessionStreamEvent {
  type: SessionEventKind;
  sessionId: string;
  operationId: string;
  timestamp: string;
  payload?: SessionStreamPayload;
}

export interface CheckpointMetricsSnapshot {
  event: string;
  metrics: Record<string, any>;
  deadLetters: SessionCheckpointJobSnapshot[];
  context?: Record<string, unknown>;
  timestamp: string;
}

// Jobs-specific Types
export type SessionCheckpointStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'manual_intervention';

export type SessionCheckpointJobRuntimeStatus =
  | SessionCheckpointStatus
  | 'queued'
  | 'running'
  | 'pending';

export interface SessionCheckpointJobPayload {
  sessionId: string;
  seedEntityIds: string[];
  reason: 'daily' | 'incident' | 'manual';
  hopCount: number;
  operationId?: string;
  sequenceNumber?: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  triggeredBy?: string;
  window?: TimeRangeParams;
}

export interface SessionCheckpointJobSnapshot {
  id: string;
  payload: SessionCheckpointJobPayload;
  attempts: number;
  status: SessionCheckpointJobRuntimeStatus;
  lastError?: string;
  queuedAt?: Date;
  updatedAt?: Date;
}

export interface SessionCheckpointJobPersistence {
  initialize(): Promise<void>;
  loadPending(): Promise<SessionCheckpointJobSnapshot[]>;
  upsert(job: SessionCheckpointJobSnapshot): Promise<void>;
  delete(jobId: string): Promise<void>;
  loadDeadLetters(): Promise<SessionCheckpointJobSnapshot[]>;
}

export interface SessionCheckpointJobOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  concurrency?: number;
  logger?: (event: string, context?: Record<string, unknown>) => void;
  persistence?: SessionCheckpointJobPersistence;
}

export interface SessionCheckpointJobMetrics {
  enqueued: number;
  completed: number;
  failed: number;
  retries: number;
}

// Backup-specific Types
export interface RestoreOptions {
  previewOnly: boolean;
  conflictResolution: 'overwrite' | 'merge' | 'skip' | 'manual';
  dryRun: boolean;
  parallelRestores: number;
  validateAfterRestore: boolean;
}

export interface RestorePreviewToken {
  token: string;
  expiresAt: Date;
  restoreOptions: RestoreOptions;
}

export interface RestorePreviewResult {
  conflicts: Array<{
    file: string;
    type: 'overwrite' | 'merge' | 'skip';
    description: string;
  }>;
  estimatedDuration: number;
  affectedFiles: string[];
  requiresApproval: boolean;
}

export interface RestoreApprovalPolicy {
  requireApprovalForConflicts: boolean;
  maxConflictsAllowed: number;
  autoApproveSafeRestores: boolean;
  approvalTimeout: number; // milliseconds
}

export interface BackupServiceOptions {
  defaultRetentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  parallelUploads: number;
  chunkSize: number;
}

export interface RestoreApprovalRequest {
  restoreId: string;
  conflicts: Array<{
    file: string;
    type: 'overwrite' | 'merge' | 'skip';
    description: string;
  }>;
  userId: string;
  reason: string;
}

// Backup Storage Types
export interface BackupStorageFactoryOptions {
  provider?: 'local' | 'memory' | 's3' | string;
  basePath?: string;
  config?: Record<string, unknown>;
}

export interface BackupStorageRegistry {
  register(id: string, provider: BackupStorageProvider): void;
  get(id: string): BackupStorageProvider | undefined;
  getDefault(): BackupStorageProvider;
}

// Sync SCM Types
export interface CommitInfo {
  hash: string;
  author: string;
  email?: string;
  date?: string;
}

export interface MergeStrategy {
  name: string;
  priority: number;
  canHandle: (conflict: Conflict) => boolean;
  resolve: (conflict: Conflict) => Promise<ConflictResolutionResult>;
}

// Core Session Types
export interface ShutdownOptions {
  reason: string;
  graceful: boolean;
  preserveData: boolean;
  timeout?: number;
}

export interface RecoveryData {
  timestamp: string;
  activeSessions: Array<{
    sessionId: string;
    agentIds: string[];
    state: string;
    lastActivity: string;
    eventCount: number;
  }>;
  configuration: any;
  statistics: any;
  errors: any[];
}

export interface BackupStorageProvider {
  readonly id: string;
  readonly supportsStreaming: boolean;

  ensureReady(): Promise<void>;
  writeFile(
    relativePath: string,
    data: string | any,
    options?: BackupStorageWriteOptions
  ): Promise<void>;
  readFile(
    relativePath: string,
    options?: BackupStorageReadOptions
  ): Promise<any>;
  removeFile(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<BackupFileStat | null>;
  list(prefix?: string): Promise<string[]>;

  createReadStream?: (
    relativePath: string,
    options?: BackupStorageReadOptions
  ) => any;
  createWriteStream?: (
    relativePath: string,
    options?: BackupStorageWriteOptions
  ) => any;
}

// Synchronization Error Types
export class OperationCancelledError extends Error {
  constructor(operationId: string) {
    super(`Operation ${operationId} cancelled`);
    this.name = 'OperationCancelledError';
  }
}

// Synchronization State Types
export interface SessionSequenceTrackingState {
  lastSequence: number | null;
  lastType: string | null;
  perType: Map<string, number>;
}

export interface ManualOverrideRecord {
  signature: string;
  conflictType: string;
  targetId: string;
  resolvedValue?: any;
  manualResolution?: string;
  resolvedBy: string;
  timestamp: Date;
}

export type DiffMap = Record<string, { current: any; incoming: any }>;

export type CommitValidation = {
  title: string;
  description: string;
  changes: string[];
};

export interface FileChange {
  path: string;
  absolutePath: string;
  type: 'create' | 'modify' | 'delete' | 'rename';
  oldPath?: string;
  stats?: {
    size: number;
    mtime: Date;
    isDirectory: boolean;
  };
  hash?: string;
}

// Note: crypto is available as a Node.js built-in module

// Relationship utility functions
export function canonicalRelationshipId(
  fromId: string,
  rel: GraphRelationship
): string {
  if (isStructuralRelationshipType(rel.type)) {
    const baseTarget = canonicalTargetKeyFor(rel);
    const base = `${fromId}|${baseTarget}|${rel.type}`;
    return (
      'time-rel_' +
      (globalThis as any).crypto.createHash('sha1').update(base).digest('hex')
    );
  }

  if (isSessionRelationshipType(rel.type)) {
    const anyRel: any = rel as any;
    const sessionIdSource =
      anyRel.sessionId ??
      anyRel.metadata?.sessionId ??
      (typeof rel.fromEntityId === 'string' && rel.fromEntityId
        ? rel.fromEntityId
        : '');
    const sessionId = String(sessionIdSource || '')
      .trim()
      .toLowerCase();
    const sequenceSource =
      anyRel.sequenceNumber ?? anyRel.metadata?.sequenceNumber ?? 0;
    const sequenceNumber = Number.isFinite(Number(sequenceSource))
      ? Math.max(0, Math.floor(Number(sequenceSource)))
      : 0;
    const base = `${sessionId}|${sequenceNumber}|${rel.type}`;
    return (
      'rel_session_' +
      (globalThis as any).crypto.createHash('sha1').update(base).digest('hex')
    );
  }

  if (isPerformanceRelationshipType(rel.type)) {
    const anyRel: any = rel as any;
    const metricId = anyRel.metricId ?? anyRel.metadata?.metricId ?? '';
    const environment =
      anyRel.environment ?? anyRel.metadata?.environment ?? '';
    const scenario = anyRel.scenario ?? anyRel.metadata?.scenario ?? '';
    const target = String(rel.toEntityId || '');
    const base = `${fromId}|${target}|${rel.type}|${metricId}|${environment}|${scenario}`;
    return (
      'rel_perf_' +
      (globalThis as any).crypto.createHash('sha1').update(base).digest('hex')
    );
  }

  const baseTarget = isCodeRelationship(rel.type)
    ? canonicalCodeTargetKey(rel)
    : String(rel.toEntityId || '');
  const base = `${fromId}|${baseTarget}|${rel.type}`;
  return (
    'rel_' +
    (globalThis as any).crypto.createHash('sha1').update(base).digest('hex')
  );
}

// Helper functions for canonicalRelationshipId
function isStructuralRelationshipType(type: string): boolean {
  return (
    type === 'TYPE_INHERITANCE' ||
    type === 'TYPE_IMPLEMENTATION' ||
    type === 'TYPE_COMPOSITION' ||
    type === 'TYPE_AGGREGATION' ||
    type === 'TYPE_ASSOCIATION' ||
    type === 'TYPE_DEPENDENCY' ||
    type === 'TYPE_REALIZATION' ||
    type === 'TYPE_GENERALIZATION'
  );
}

function isSessionRelationshipType(type: string): boolean {
  return (
    type === 'SESSION_EVENT' ||
    type === 'SESSION_STATE' ||
    type === 'SESSION_TRANSITION' ||
    type === 'SESSION_CONTEXT'
  );
}

function isPerformanceRelationshipType(type: string): boolean {
  return (
    type === 'PERFORMANCE_METRIC' ||
    type === 'PERFORMANCE_BENCHMARK' ||
    type === 'PERFORMANCE_PROFILE'
  );
}

function isDocumentationRelationshipType(type: string): boolean {
  return (
    type === 'DESCRIBES_DOMAIN' ||
    type === 'BELONGS_TO_DOMAIN' ||
    type === 'DOCUMENTS' ||
    type === 'DOCUMENTED_BY'
  );
}

function isCodeRelationship(type: string): boolean {
  // Handle legacy USES type by converting to equivalent type
  if ((type as string) === 'USES') return true;
  // Import from core package - we need to make this work without circular imports
  // For now, use a simplified check
  return (
    type === 'CALLS' ||
    type === 'REFERENCES' ||
    type === 'IMPLEMENTS' ||
    type === 'EXTENDS' ||
    type === 'DEPENDS_ON' ||
    type === 'TYPE_USES' ||
    type === 'RETURNS_TYPE' ||
    type === 'PARAM_TYPE'
  );
}

function canonicalTargetKeyFor(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const t = String(rel.toEntityId || '');
  const toRef = anyRel.toRef;

  // Prefer structured toRef
  if (toRef && typeof toRef === 'object') {
    if (
      toRef.kind === 'fileSymbol' &&
      (toRef.file || toRef.symbol || toRef.name)
    ) {
      const file = toRef.file || '';
      const sym = (toRef.symbol || toRef.name || '') as string;
      return `FS:${file}:${sym}`;
    }
    if (toRef.kind === 'external' && toRef.name) return `EXT:${toRef.name}`;
  }

  // Fallback to parsing toEntityId
  if (/^(sym:|file:[^:]+$)/.test(t)) return `ENT:${t}`;
  // File symbol placeholder: file:<relPath>:<name>
  {
    const m = t.match(/^file:(.+?):(.+)$/);
    if (m) return `FS:${m[1]}:${m[2]}`;
  }
  // External name
  {
    const m = t.match(/^external:(.+)$/);
    if (m) return `EXT:${m[1]}`;
  }
  // Kind-qualified placeholders
  {
    const m = t.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (m) return `KIND:${m[1]}:${m[2]}`;
  }
  // Import placeholder
  {
    const m = t.match(/^import:(.+?):(.+)$/);
    if (m) return `IMP:${m[1]}:${m[2]}`;
  }
  // Raw fallback
  return `RAW:${t}`;
}

function canonicalDocumentationTargetKey(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const md =
    anyRel.metadata && typeof anyRel.metadata === 'object'
      ? anyRel.metadata
      : {};
  const section = md.section || md.anchor || '';
  const target = String(rel.toEntityId || '');
  return section ? `DOC:${target}#${section}` : `DOC:${target}`;
}

function canonicalCodeTargetKey(rel: GraphRelationship): string {
  // This is a simplified version - in the original it was the same as canonicalTargetKeyFor
  return canonicalTargetKeyFor(rel);
}

// Sync monitoring and metrics types
export interface SyncMetrics {
  operationsTotal: number;
  operationsSuccessful: number;
  operationsFailed: number;
  averageSyncTime: number;
  totalEntitiesProcessed: number;
  totalRelationshipsProcessed: number;
  errorRate: number;
  throughput: number; // operations per minute
}

export interface PerformanceMetrics {
  averageParseTime: number;
  averageGraphUpdateTime: number;
  averageEmbeddingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  ioWaitTime: number;
}

export interface HealthMetrics {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  lastSyncTime: Date;
  consecutiveFailures: number;
  queueDepth: number;
  activeOperations: number;
  systemLoad: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  operationId?: string;
  resolved: boolean;
  resolution?: string;
}

export interface SyncLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  operationId: string;
  message: string;
  data?: any;
}

export interface SessionSequenceAnomaly {
  sessionId: string;
  type: RelationshipTypeEnum | string;
  sequenceNumber: number;
  previousSequence: number | null;
  reason: 'duplicate' | 'out_of_order';
  eventId?: string;
  timestamp?: Date;
  previousType?: RelationshipTypeEnum | string | null;
}

// Session replay types
export interface ReplayConfig {
  compressionEnabled: boolean;
  snapshotInterval: number; // seconds
  maxReplayDuration: number; // seconds
  enableStateValidation: boolean;
  enableDeltaCompression: boolean;
}

export interface SessionSnapshot {
  sessionId: string;
  timestamp: string;
  sequenceNumber: number;
  state: SessionState;
  agentIds: string[];
  eventCount: number;
  metadata?: Record<string, any>;
  checksum?: string;
}

export interface ReplayFrame {
  timestamp: string;
  sequenceNumber: number;
  event?: SessionEventKind;
  snapshot?: SessionSnapshot;
  deltaData?: Record<string, any>;
}

export interface ReplaySession {
  sessionId: string;
  originalSessionId: string;
  startTime: string;
  endTime?: string;
  frames: ReplayFrame[];
  metadata: {
    totalFrames: number;
    duration: number;
    compressionRatio?: number;
    validationPassed: boolean;
  };
}

export interface ReplayOptions {
  startFromSequence?: number;
  endAtSequence?: number;
  speed?: number; // playback speed multiplier
  includeSnapshots?: boolean;
  validationMode?: boolean;
  filterEventTypes?: string[];
}

export interface ReplayStats {
  totalFrames: number;
  duration: number;
  eventsProcessed: number;
  snapshotsGenerated: number;
  compressionRatio?: number;
  validationPassed: boolean;
  errors: string[];
}

// Agent coordination types
export interface AgentInfo {
  id: string;
  type: string;
  capabilities: string[];
  priority: number;
  load: number;
  maxLoad: number;
  status: 'active' | 'busy' | 'idle' | 'dead' | 'maintenance';
  lastHeartbeat: string;
  metadata: Record<string, any>;
  currentSessions: string[];
  totalTasksCompleted: number;
  averageTaskDuration: number;
  errorRate: number;
}

export interface TaskInfo {
  id: string;
  type: string;
  priority: number;
  sessionId: string;
  requiredCapabilities: string[];
  estimatedDuration: number;
  deadline?: string;
  assignedAgent?: string;
  status:
    | 'queued'
    | 'assigned'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  metadata: Record<string, any>;
}

export interface LoadBalancingStrategy {
  type:
    | 'round-robin'
    | 'least-loaded'
    | 'priority-based'
    | 'capability-weighted'
    | 'dynamic';
  config: Record<string, any>;
}

export interface HandoffContext {
  fromAgent: string;
  toAgent: string;
  taskId: string;
  sessionId: string;
  reason: string;
  state: Record<string, any>;
  timestamp: string;
}

export interface CoordinationMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskCompletionTime: number;
  loadDistribution: Record<string, number>;
  handoffCount: number;
  deadAgentCount: number;
}

export interface DeadAgentConfig {
  maxDeadTime: number; // minutes
  recoveryAttempts: number;
  recoveryInterval: number; // seconds
  autoRecovery: boolean;
}

// Session analytics types
export interface SessionAnalyticsConfig {
  enabled: boolean;
  retentionDays: number;
  sampleRate: number; // 0.0 to 1.0
  metricsInterval: number; // seconds
  enableRealTimeAnalytics: boolean;
}

export interface SessionAnalyticsData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  eventCount: number;
  entityCount: number;
  relationshipCount: number;
  agentCount: number;
  errorCount: number;
  performanceScore: number;
  userInteractions: number;
  metadata: Record<string, any>;
}

export interface AgentCollaborationMetrics {
  agentId: string;
  sessionsParticipated: number;
  totalInteractions: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  collaborationScore: number;
}

export interface SessionPerformanceMetrics {
  sessionId: string;
  timestamp: string;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  operationCount: number;
  averageOperationTime: number;
  errorRate: number;
  throughput: number;
}

export interface SessionTrendAnalysis {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: string;
  endTime: string;
  trends: {
    sessionCount: number;
    averageDuration: number;
    averageEventCount: number;
    errorRate: number;
    performanceScore: number;
  };
  patterns: Array<{
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  impact: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  category: 'performance' | 'security' | 'reliability' | 'cost';
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
}

export interface EnvironmentValidation {
  required: {
    nodeVersion: string;
    memory: number; // MB
    diskSpace: number; // GB
    network: boolean;
  };
  recommended: {
    cpuCores: number;
    concurrentSessions: number;
    cacheSize: number; // MB
  };
  warnings: Array<{
    type: 'performance' | 'security' | 'compatibility';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}
