/**
 * TypeScript interfaces and types for rollback capabilities
 * Note: Core-specific rollback types have been moved to @memento/shared-types
 * This file now primarily contains core-specific implementations and extensions
 */

import {
  RollbackPoint as SharedRollbackPoint,
  RollbackEntity as SharedRollbackEntity,
  RollbackRelationship as SharedRollbackRelationship,
  SessionCheckpointRecord as SharedSessionCheckpointRecord,
  RollbackResult as SharedRollbackResult,
  RollbackError as SharedRollbackError,
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
  RollbackError as SharedRollbackErrorClass,
  RollbackConflictError,
  RollbackNotFoundError,
  RollbackExpiredError,
  DatabaseNotReadyError,
} from '@memento/shared-types';

// Import enum values for runtime usage
import {
  SnapshotType,
  DiffOperation,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy,
  ConflictStrategy,
  ConflictType,
} from '@memento/shared-types';

// Re-export shared types for backward compatibility
export type {
  RollbackPoint,
  RollbackEntity,
  RollbackRelationship,
  SessionCheckpointRecord,
  RollbackResult,
  RollbackError,
} from '@memento/shared-types';

// Re-export core-specific types
export type {
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
};

// Re-export error classes and enum values
export {
  RollbackError,
  RollbackConflictError,
  RollbackNotFoundError,
  RollbackExpiredError,
  DatabaseNotReadyError,
  // Re-export enum values
  SnapshotType,
  DiffOperation,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy,
  ConflictStrategy,
  ConflictType,
};

// Legacy interface for backward compatibility - maps to shared RollbackPoint
export interface RollbackPointLegacy {
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

