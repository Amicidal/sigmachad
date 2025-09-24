/**
 * Rollback capabilities module exports
 *
 * This module provides comprehensive rollback functionality including:
 * - In-memory snapshot management
 * - Change detection and diff generation
 * - Multiple rollback strategies (immediate, gradual, safe, force)
 * - Conflict resolution
 * - Integration with external services
 */
export * from './RollbackTypes.js';
export { RollbackManager } from './RollbackManager.js';
export { SnapshotManager } from './Snapshot.js';
export { DiffEngine } from './DiffEngine.js';
export { RollbackStore } from './RollbackStore.js';
export { RollbackStrategyFactory, ImmediateRollbackStrategy, GradualRollbackStrategy, SafeRollbackStrategy, ForceRollbackStrategy } from './RollbackStrategies.js';
export declare function createDefaultRollbackConfig(): RollbackConfig;
export declare function createDefaultStoreOptions(): RollbackStoreOptions;
export declare function createAbortOnConflictResolution(): ConflictResolution;
export declare function createOverwriteConflictResolution(): ConflictResolution;
export declare function createSkipConflictResolution(): ConflictResolution;
export declare function createMergeConflictResolution(): ConflictResolution;
import { RollbackConfig, RollbackStoreOptions, ConflictResolution } from './RollbackTypes.js';
//# sourceMappingURL=index.d.ts.map