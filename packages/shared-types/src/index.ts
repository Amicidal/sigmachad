// Simple explicit exports
export * from './entities.js';
export * from './relationships.js';
// Explicit exports for auth and related modules
export * from './auth.js';
export * from './database-service.js';
export * from './knowledge-graph-service.js';
export * from './security.js';
export * from './temporal-history-validator.js';
export * from './trpc.js';

// Export API gateway + auth + registry types
export type {
  // API Gateway configuration
  APIGatewayConfig,
  // Synchronization service wiring for the gateway
  SynchronizationServices,
  // Synchronization event bus interfaces (minimal EventEmitter-like contracts)
  ISynchronizationCoordinator,
  ISynchronizationMonitoring,
  IConflictResolution,
  IRollbackCapabilities,
  SyncEventListener,
  // API key registry domain
  ApiKeyRecord,
  ApiKeyRegistry,
  ApiKeyVerification,
  ApiKeyRegistryProvider,
  ScopeRequirement,
  ScopeRule,
  // API authentication error shape
  AuthErrorDetails,
  // Standardized error response contracts
  ErrorContext,
  ErrorMetadata,
  StandardErrorResponse,
  // Common API time range params
  TimeRangeParams,
} from './api-types.js';
// Explicit exports for database and related modules
export * from './database-types.js';
export * from './parsing-types.js';
export * from './websocket-types.js';

// Export parser builder types
export type {
  RelationshipBuilderOptions,
  TypeRelationshipBuilderOptions,
  ReferenceRelationshipBuilderOptions,
  ImportExportBuilderOptions,
} from './parsing-types.js';
export * from './testing-types.js';

// Export maintenance metrics types
export type {
  BackupMetricParams,
  RestoreMetricParams,
  MaintenanceTaskMetricParams,
  RestoreApprovalMetricParams,
} from './testing-types.js';
export * from './search-types.js';
// Simple session types export
export * from './session-types.js';
// These modules don't need explicit exports as they don't conflict
export * from './agent-types.js';
export * from './ingestion-types.js';
export * from './rollback-types.js';
export type { TypedEventEmitter } from './typed-event-emitter.js';

// Export rollback domain types and runtime helpers
export type {
  RollbackPoint,
  RollbackEntity,
  RollbackRelationship,
  SessionCheckpointRecord,
  RollbackResult,
  RollbackIssue,
  RollbackPointCore,
  Snapshot,
  DiffEntry,
  RollbackDiff,
  RollbackOperation,
  RollbackLogEntry,
  RollbackConfig,
  ConflictResolution,
  RollbackConflict,
  RollbackMetrics,
  RollbackEvents,
} from './rollback-types.js';

// Export sync-specific ConflictResolution under disambiguated name to avoid collision
export type { ConflictResolution as SyncConflictResolution } from './core-types.js';

export {
  RollbackError,
  RollbackConflictError,
  RollbackNotFoundError,
  RollbackExpiredError,
  DatabaseNotReadyError,
  SnapshotType,
  DiffOperation,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy,
  ConflictStrategy,
} from './rollback-types.js';

export * from './scm-types.js';

// Export common types that were extracted from core package
export type {
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
  CodebaseEntity,
  Entity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Test,
  Spec,
  Change,
  Session,
  Version,
  Checkpoint,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssueEntity,
  Vulnerability,
  SecurityIssue,
  CoverageMetrics,
} from './entities.js';

// Handoff context definitions live with session types and are re-exported above

// Export relationship types and functions
export type {
  Relationship,
  StructuralRelationship,
  CodeRelationship,
  TestRelationship,
  SpecRelationship,
  TemporalRelationship,
  DocumentationRelationship,
  SecurityRelationship,
  PerformanceRelationship,
  SessionRelationship,
  GraphRelationship,
  RelationshipQuery,
  RelationshipFilter,
  PathQuery,
  PathResult,
  GraphTraversalQuery,
  TraversalResult,
  ImpactQuery,
  ImpactResult,
  StructuralImportType,
  CodeEdgeSource,
  CodeEdgeKind,
  CodeRelationshipType,
  DocumentationRelationshipType,
  DocumentationSource,
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationStatus,
  DocumentationCoverageScope,
  DocumentationQuality,
  DocumentationPolicyType,
  EdgeEvidence,
  CodeResolution,
  CodeScope,
  PerformanceConfidenceInterval,
  SessionRelationshipType,
  PerformanceRelationshipType,
} from './relationships.js';

export {
  isStructuralRelationshipType,
  isPerformanceRelationshipType,
  isSessionRelationshipType,
  isDocumentationRelationshipType,
  RelationshipType,
  STRUCTURAL_RELATIONSHIP_TYPE_SET,
  PERFORMANCE_RELATIONSHIP_TYPES,
  SESSION_RELATIONSHIP_TYPES,
  CODE_RELATIONSHIP_TYPES,
  DOCUMENTATION_RELATIONSHIP_TYPES,
} from './relationships.js';

// Export additional session types that need explicit export
export type {
  CheckpointOptions,
  IsolationResult,
  RedisSessionData,
  RedisEventData,
  SessionPubSubMessage,
  RedisConfig,
  SessionManagerConfig,
  ISessionStore,
  ISessionManager,
  ISessionBridge,
  SessionStats,
  SessionMetrics,
} from './session-types.js';

export {
  SessionError,
  SessionNotFoundError,
  SessionExpiredError,
} from './session-types.js';

// Export additional core types
export type {
  SessionConfig,
  SessionMetadata,
  SessionQueryOptions,
  SessionChangeSummary,
  SessionChangesResult,
  SessionTimelineEvent,
  SessionTimelineSummary,
  SessionTimelineResult,
  SessionImpactEntry,
  SessionImpactsResult,
  SessionsAffectingEntityEntry,
  SessionsAffectingEntityResult,
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  PerformanceMetrics,
  ValidationRequest,
  ValidationResult,
  ValidationIssue,
  ImpactAnalysisRequest,
  ImpactAnalysisSpecImpact,
  ImpactAnalysis,
  VectorSearchRequest,
  VectorSearchResult,
  SCMCommitRecord,
  SCMStatusSummary,
  SCMBranchInfo,
  SCMPushResult,
  SCMCommitLogEntry,
  SyncStatus,
  SyncOptions,
  SystemAnalytics,
  CreateSpecRequest,
  CreateSpecResponse,
  GetSpecResponse,
  UpdateSpecRequest,
  ListSpecsParams,
  TestCoverage,
  TestPlanRequest,
  TestPlanResponse,
  TestSpec,
  TestExecutionResult,
  CodeChangeProposal,
  CodeChangeAnalysis,
  TraversalQuery,
  EntityTimelineEntry,
  EntityTimelineResult,
  RelationshipTimelineSegment,
  RelationshipTimeline,
  StructuralNavigationEntry,
  ModuleChildrenResult,
  ModuleHistoryOptions,
  ModuleHistoryEntitySummary,
  ModuleHistoryRelationship,
  ModuleHistoryResult,
  ImportEntry,
  ListImportsResult,
  DefinitionLookupResult,
  DependencyAnalysis,
  CommitPRRequest,
  CommitPRResponse,
  EnhancedSessionConfig,
  BatchOperation,
  CacheEntry,
  SessionStorePerformanceMetrics,
  PoolConfig,
  GracefulShutdownConfig,
  ShutdownStatus,
  SessionStreamPayload,
  SessionStreamEvent,
  CheckpointMetricsSnapshot,
  RestoreOptions,
  RestorePreviewToken,
  RestorePreviewResult,
  RestoreApprovalPolicy,
  BackupServiceOptions,
  RestoreApprovalRequest,
  BackupStorageFactoryOptions,
  BackupStorageRegistry,
  CommitInfo,
  MergeStrategy,
  ShutdownOptions,
  RecoveryData,
  // Session checkpoint job types
  SessionCheckpointStatus,
  SessionCheckpointJobRuntimeStatus,
  SessionCheckpointJobPayload,
  SessionCheckpointJobSnapshot,
  SessionCheckpointJobPersistence,
  SecurityFixTask,
  SecurityFixResult,
  SecurityFix,
  RollbackData,
  SessionCheckpointJobOptions,
  SessionCheckpointJobMetrics,
  BackupOptions,
  BackupMetadata,
  BackupStorageProvider,
  BackupFileStat,
  BackupStorageWriteOptions,
  BackupStorageReadOptions,
  WorkerMessageType,
  WorkerResponseType,
  WorkerTaskMessage,
  WorkerTaskResult,
  SyncOperation,
  SyncError,
  SessionEventKind,
  Conflict,
  ConflictResolutionResult,
  SessionSequenceTrackingState,
  ManualOverrideRecord,
  DiffMap,
  CommitValidation,
  FileChange,
  // Sync monitoring types
  SyncMetrics,
  SyncPerformanceMetrics,
  HealthMetrics,
  MonitoringAlert,
  SyncLogEntry,
  SessionSequenceAnomaly,
  // Session replay types
  ReplayConfig,
  SessionSnapshot,
  ReplayFrame,
  ReplaySession,
  ReplayOptions,
  ReplayStats,
  // Agent coordination types
  AgentInfo,
  TaskInfo,
  LoadBalancingStrategy,
  CoordinationMetrics,
  DeadAgentConfig,
  // Session analytics types
  SessionAnalyticsConfig,
  SessionAnalyticsData,
  AgentCollaborationMetrics,
  SessionPerformanceMetrics,
  SessionTrendAnalysis,
  // Validation types
  ValidationError,
  ValidationWarning,
  Recommendation,
  EnvironmentValidation,
  ConfigValidationResult,
} from './core-types.js';

export {
  OperationCancelledError,
  canonicalRelationshipId,
} from './core-types.js';
