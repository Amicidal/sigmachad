/**
 * Rollback domain types consolidated from sync and core packages
 */

// Sync package rollback types
export interface RollbackPoint {
  id: string;
  operationId: string;
  timestamp: Date;
  entities: RollbackEntity[];
  relationships: RollbackRelationship[];
  description: string;
}

export interface RollbackEntity {
  id: string;
  action: 'create' | 'update' | 'delete';
  previousState?: any;
  newState?: any;
}

export interface RollbackRelationship {
  id: string;
  action: 'create' | 'update' | 'delete';
  fromEntityId?: string;
  toEntityId?: string;
  type?: string;
  previousState?: any;
  newState?: any;
}

export interface SessionCheckpointRecord {
  checkpointId: string;
  sessionId: string;
  reason: 'daily' | 'incident' | 'manual';
  hopCount: number;
  attempts: number;
  seedEntityIds: string[];
  jobId?: string;
  recordedAt: Date;
}

export interface RollbackResult {
  success: boolean;
  rolledBackEntities: number;
  rolledBackRelationships: number;
  errors: RollbackError[];
  partialSuccess: boolean;
}

export interface RollbackError {
  type: 'entity' | 'relationship';
  id: string;
  action: string;
  error: string;
  recoverable: boolean;
}

// Core package rollback types (consolidated)
export interface RollbackPointCore {
  /** Unique identifier for this rollback point */
  id: string;
  /** Human-readable name for this rollback point */
  name: string;
  /** Timestamp when this rollback point was created */
  timestamp: Date;
  /** Optional description of what this rollback point represents */
  description?: string;
  /** Metadata associated with this rollback point */
  metadata: Record<string, any>;
  /** Session ID if this rollback point is session-aware */
  sessionId?: string;
  /** Expiry time for automatic cleanup */
  expiresAt?: Date;
}

export interface Snapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** Reference to the rollback point this snapshot belongs to */
  rollbackPointId: string;
  /** Type of data stored in this snapshot */
  type: SnapshotType;
  /** The actual snapshot data */
  data: any;
  /** Size of the snapshot data in bytes */
  size: number;
  /** Timestamp when snapshot was created */
  createdAt: Date;
  /** Checksum for data integrity verification */
  checksum?: string;
}

export enum SnapshotType {
  ENTITY = 'entity',
  RELATIONSHIP = 'relationship',
  FILE = 'file',
  CONFIGURATION = 'configuration',
  SESSION_STATE = 'session_state',
  METADATA = 'metadata',
}

export interface DiffEntry {
  /** Path or identifier of the changed item */
  path: string;
  /** Type of change */
  operation: DiffOperation;
  /** Previous value (null for additions) */
  oldValue: any;
  /** New value (null for deletions) */
  newValue: any;
  /** Metadata about the change */
  metadata?: Record<string, any>;
}

export enum DiffOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MOVE = 'move',
}

export interface RollbackDiff {
  /** Source rollback point */
  from: string;
  /** Target rollback point */
  to: string;
  /** List of changes between the two points */
  changes: DiffEntry[];
  /** Total number of changes */
  changeCount: number;
  /** Timestamp when diff was generated */
  generatedAt: Date;
}

export interface RollbackOperation {
  /** Unique identifier for this operation */
  id: string;
  /** Type of rollback operation */
  type: RollbackOperationType;
  /** Target rollback point to restore to */
  targetRollbackPointId: string;
  /** Current status of the operation */
  status: RollbackStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if operation failed */
  error?: string;
  /** Timestamp when operation started */
  startedAt: Date;
  /** Timestamp when operation completed */
  completedAt?: Date;
  /** Strategy used for this rollback */
  strategy: RollbackStrategy;
  /** Detailed log of actions taken */
  log: RollbackLogEntry[];
}

export enum RollbackOperationType {
  FULL = 'full',
  PARTIAL = 'partial',
  SELECTIVE = 'selective',
  DRY_RUN = 'dry_run',
}

export enum RollbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RollbackStrategy {
  IMMEDIATE = 'immediate',
  GRADUAL = 'gradual',
  SAFE = 'safe',
  FORCE = 'force',
}

export interface RollbackLogEntry {
  /** Timestamp of log entry */
  timestamp: Date;
  /** Log level */
  level: 'info' | 'warn' | 'error' | 'debug';
  /** Log message */
  message: string;
  /** Additional context data */
  data?: Record<string, any>;
}

export interface RollbackConfig {
  /** Maximum number of rollback points to keep in memory */
  maxRollbackPoints: number;
  /** Default TTL for rollback points in milliseconds */
  defaultTTL: number;
  /** Whether to enable automatic cleanup */
  autoCleanup: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Maximum snapshot size in bytes */
  maxSnapshotSize: number;
  /** Whether to persist rollback data */
  enablePersistence: boolean;
  /** Persistence storage type */
  persistenceType: 'memory' | 'redis' | 'postgresql';
  /** Database service dependency check */
  requireDatabaseReady: boolean;
}

export interface ConflictResolution {
  /** Strategy for resolving conflicts */
  strategy: ConflictStrategy;
  /** Custom resolver function */
  resolver?: (conflict: RollbackConflict) => Promise<ConflictResolution>;
}

export enum ConflictStrategy {
  ABORT = 'abort',
  SKIP = 'skip',
  OVERWRITE = 'overwrite',
  MERGE = 'merge',
  ASK_USER = 'ask_user',
}

export interface RollbackConflict {
  /** Path or identifier where conflict occurred */
  path: string;
  /** Type of conflict */
  type: ConflictType;
  /** Current value in system */
  currentValue: any;
  /** Value from rollback point */
  rollbackValue: any;
  /** Additional context about the conflict */
  context?: Record<string, any>;
}

export enum ConflictType {
  VALUE_MISMATCH = 'value_mismatch',
  MISSING_TARGET = 'missing_target',
  TYPE_MISMATCH = 'type_mismatch',
  PERMISSION_DENIED = 'permission_denied',
  DEPENDENCY_CONFLICT = 'dependency_conflict',
}

export interface RollbackMetrics {
  /** Total number of rollback points created */
  totalRollbackPoints: number;
  /** Total number of successful rollbacks */
  successfulRollbacks: number;
  /** Total number of failed rollbacks */
  failedRollbacks: number;
  /** Average rollback time in milliseconds */
  averageRollbackTime: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Last cleanup timestamp */
  lastCleanup?: Date;
}

/**
 * Events emitted by rollback components
 */
export interface RollbackEvents {
  'rollback-point-created': {
    rollbackPoint: RollbackPoint | RollbackPointCore;
  };
  'rollback-point-expired': { rollbackPointId: string };
  'rollback-started': { operation: RollbackOperation };
  'rollback-progress': { operationId: string; progress: number };
  'rollback-completed': { operation: RollbackOperation };
  'rollback-failed': { operation: RollbackOperation; error: Error };
  'conflict-detected': { conflict: RollbackConflict };
  'cleanup-started': {};
  'cleanup-completed': { removedCount: number };
}

/**
 * Error types for rollback operations
 */
export class RollbackError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'RollbackError';
  }
}

export class RollbackConflictError extends RollbackError {
  constructor(message: string, public readonly conflicts: RollbackConflict[]) {
    super(message, 'ROLLBACK_CONFLICT');
    this.name = 'RollbackConflictError';
  }
}

export class RollbackNotFoundError extends RollbackError {
  constructor(rollbackPointId: string) {
    super(`Rollback point not found: ${rollbackPointId}`, 'ROLLBACK_NOT_FOUND');
    this.name = 'RollbackNotFoundError';
  }
}

export class RollbackExpiredError extends RollbackError {
  constructor(rollbackPointId: string) {
    super(`Rollback point has expired: ${rollbackPointId}`, 'ROLLBACK_EXPIRED');
    this.name = 'RollbackExpiredError';
  }
}

export class DatabaseNotReadyError extends RollbackError {
  constructor() {
    super(
      'Database service is not ready for rollback operations',
      'DATABASE_NOT_READY'
    );
    this.name = 'DatabaseNotReadyError';
  }
}
