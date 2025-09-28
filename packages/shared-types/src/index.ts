export * from './entities.js';
export * from './relationships.js';
export * from './auth.js';
export * from './trpc.js';
export * from './security.js';
export * from './database-service.js';
export * from './knowledge-graph-service.js';
export * from './temporal-history-validator.js';
export * from './api-types.js';

// Export API key registry types
export type { ApiKeyRegistryProvider } from './api-types.js';

// Export API authentication types
export type { AuthErrorDetails } from './api-types.js';
export * from './database-types.js';
export * from './websocket-types.js';
export * from './parsing-types.js';

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
export * from './session-types.js';
export * from './agent-types.js';
export * from './ingestion-types.js';
export * from './scm-types.js';
export * from './rollback-types.js';

// Export common types that were extracted from core package
export type {
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
} from './entities.js';

// Export core-specific types that are not duplicated in other modules
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
  PerformanceSeverity,
  PerformanceTrend,
  PerformanceMetricSample,
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  PerformanceMetrics,
  ValidationRequest,
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
  SecurityScanRequest,
  SecurityScanResult,
  VulnerabilityReport,
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
  ConflictResolution,
  ConflictResolutionResult,
  OperationCancelledError,
  SessionSequenceTrackingState,
  ManualOverrideRecord,
  DiffMap,
  CommitValidation,
  FileChange,
  canonicalRelationshipId,
  // Sync monitoring types
  SyncMetrics,
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
  HandoffContext,
  CoordinationMetrics,
  DeadAgentConfig,
  // Session analytics types
  SessionAnalyticsConfig,
  SessionAnalyticsData,
  AgentCollaborationMetrics,
  SessionPerformanceMetrics,
  SessionTrendAnalysis,
  // Validation types
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Recommendation,
  EnvironmentValidation,
} from './core-types.js';
