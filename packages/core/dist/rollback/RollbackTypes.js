/**
 * TypeScript interfaces and types for rollback capabilities
 */
export var SnapshotType;
(function (SnapshotType) {
    SnapshotType["ENTITY"] = "entity";
    SnapshotType["RELATIONSHIP"] = "relationship";
    SnapshotType["FILE"] = "file";
    SnapshotType["CONFIGURATION"] = "configuration";
    SnapshotType["SESSION_STATE"] = "session_state";
    SnapshotType["METADATA"] = "metadata";
})(SnapshotType || (SnapshotType = {}));
export var DiffOperation;
(function (DiffOperation) {
    DiffOperation["CREATE"] = "create";
    DiffOperation["UPDATE"] = "update";
    DiffOperation["DELETE"] = "delete";
    DiffOperation["MOVE"] = "move";
})(DiffOperation || (DiffOperation = {}));
export var RollbackOperationType;
(function (RollbackOperationType) {
    RollbackOperationType["FULL"] = "full";
    RollbackOperationType["PARTIAL"] = "partial";
    RollbackOperationType["SELECTIVE"] = "selective";
    RollbackOperationType["DRY_RUN"] = "dry_run";
})(RollbackOperationType || (RollbackOperationType = {}));
export var RollbackStatus;
(function (RollbackStatus) {
    RollbackStatus["PENDING"] = "pending";
    RollbackStatus["IN_PROGRESS"] = "in_progress";
    RollbackStatus["COMPLETED"] = "completed";
    RollbackStatus["FAILED"] = "failed";
    RollbackStatus["CANCELLED"] = "cancelled";
})(RollbackStatus || (RollbackStatus = {}));
export var RollbackStrategy;
(function (RollbackStrategy) {
    RollbackStrategy["IMMEDIATE"] = "immediate";
    RollbackStrategy["GRADUAL"] = "gradual";
    RollbackStrategy["SAFE"] = "safe";
    RollbackStrategy["FORCE"] = "force";
})(RollbackStrategy || (RollbackStrategy = {}));
export var ConflictStrategy;
(function (ConflictStrategy) {
    ConflictStrategy["ABORT"] = "abort";
    ConflictStrategy["SKIP"] = "skip";
    ConflictStrategy["OVERWRITE"] = "overwrite";
    ConflictStrategy["MERGE"] = "merge";
    ConflictStrategy["ASK_USER"] = "ask_user";
})(ConflictStrategy || (ConflictStrategy = {}));
export var ConflictType;
(function (ConflictType) {
    ConflictType["VALUE_MISMATCH"] = "value_mismatch";
    ConflictType["MISSING_TARGET"] = "missing_target";
    ConflictType["TYPE_MISMATCH"] = "type_mismatch";
    ConflictType["PERMISSION_DENIED"] = "permission_denied";
    ConflictType["DEPENDENCY_CONFLICT"] = "dependency_conflict";
})(ConflictType || (ConflictType = {}));
/**
 * Error types for rollback operations
 */
export class RollbackError extends Error {
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'RollbackError';
    }
}
export class RollbackConflictError extends RollbackError {
    constructor(message, conflicts) {
        super(message, 'ROLLBACK_CONFLICT');
        this.conflicts = conflicts;
        this.name = 'RollbackConflictError';
    }
}
export class RollbackNotFoundError extends RollbackError {
    constructor(rollbackPointId) {
        super(`Rollback point not found: ${rollbackPointId}`, 'ROLLBACK_NOT_FOUND');
        this.name = 'RollbackNotFoundError';
    }
}
export class RollbackExpiredError extends RollbackError {
    constructor(rollbackPointId) {
        super(`Rollback point has expired: ${rollbackPointId}`, 'ROLLBACK_EXPIRED');
        this.name = 'RollbackExpiredError';
    }
}
export class DatabaseNotReadyError extends RollbackError {
    constructor() {
        super('Database service is not ready for rollback operations', 'DATABASE_NOT_READY');
        this.name = 'DatabaseNotReadyError';
    }
}
//# sourceMappingURL=RollbackTypes.js.map