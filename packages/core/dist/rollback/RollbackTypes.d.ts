/**
 * TypeScript interfaces and types for rollback capabilities
 */
export interface RollbackPoint {
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
export declare enum SnapshotType {
    ENTITY = "entity",
    RELATIONSHIP = "relationship",
    FILE = "file",
    CONFIGURATION = "configuration",
    SESSION_STATE = "session_state",
    METADATA = "metadata"
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
export declare enum DiffOperation {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    MOVE = "move"
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
export declare enum RollbackOperationType {
    FULL = "full",
    PARTIAL = "partial",
    SELECTIVE = "selective",
    DRY_RUN = "dry_run"
}
export declare enum RollbackStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum RollbackStrategy {
    IMMEDIATE = "immediate",
    GRADUAL = "gradual",
    SAFE = "safe",
    FORCE = "force"
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
export interface RollbackStoreOptions {
    /** Maximum number of items to store */
    maxItems: number;
    /** TTL for stored items in milliseconds */
    defaultTTL: number;
    /** Whether to enable LRU eviction */
    enableLRU: boolean;
    /** Whether to persist to external storage */
    enablePersistence: boolean;
}
export interface ConflictResolution {
    /** Strategy for resolving conflicts */
    strategy: ConflictStrategy;
    /** Custom resolver function */
    resolver?: (conflict: RollbackConflict) => Promise<ConflictResolution>;
}
export declare enum ConflictStrategy {
    ABORT = "abort",
    SKIP = "skip",
    OVERWRITE = "overwrite",
    MERGE = "merge",
    ASK_USER = "ask_user"
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
export declare enum ConflictType {
    VALUE_MISMATCH = "value_mismatch",
    MISSING_TARGET = "missing_target",
    TYPE_MISMATCH = "type_mismatch",
    PERMISSION_DENIED = "permission_denied",
    DEPENDENCY_CONFLICT = "dependency_conflict"
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
        rollbackPoint: RollbackPoint;
    };
    'rollback-point-expired': {
        rollbackPointId: string;
    };
    'rollback-started': {
        operation: RollbackOperation;
    };
    'rollback-progress': {
        operationId: string;
        progress: number;
    };
    'rollback-completed': {
        operation: RollbackOperation;
    };
    'rollback-failed': {
        operation: RollbackOperation;
        error: Error;
    };
    'conflict-detected': {
        conflict: RollbackConflict;
    };
    'cleanup-started': {};
    'cleanup-completed': {
        removedCount: number;
    };
}
/**
 * Error types for rollback operations
 */
export declare class RollbackError extends Error {
    readonly code: string;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code: string, context?: Record<string, any> | undefined);
}
export declare class RollbackConflictError extends RollbackError {
    readonly conflicts: RollbackConflict[];
    constructor(message: string, conflicts: RollbackConflict[]);
}
export declare class RollbackNotFoundError extends RollbackError {
    constructor(rollbackPointId: string);
}
export declare class RollbackExpiredError extends RollbackError {
    constructor(rollbackPointId: string);
}
export declare class DatabaseNotReadyError extends RollbackError {
    constructor();
}
//# sourceMappingURL=RollbackTypes.d.ts.map