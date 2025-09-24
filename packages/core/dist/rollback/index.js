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
// Core types and interfaces
export * from './RollbackTypes.js';
// Main components
export { RollbackManager } from './RollbackManager.js';
export { SnapshotManager } from './Snapshot.js';
export { DiffEngine } from './DiffEngine.js';
export { RollbackStore } from './RollbackStore.js';
// Rollback strategies
export { RollbackStrategyFactory, ImmediateRollbackStrategy, GradualRollbackStrategy, SafeRollbackStrategy, ForceRollbackStrategy } from './RollbackStrategies.js';
// Default configuration factory
export function createDefaultRollbackConfig() {
    return {
        maxRollbackPoints: 50,
        defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
        autoCleanup: true,
        cleanupInterval: 5 * 60 * 1000, // 5 minutes
        maxSnapshotSize: 10 * 1024 * 1024, // 10MB
        enablePersistence: false,
        persistenceType: 'memory',
        requireDatabaseReady: true
    };
}
// Store options factory
export function createDefaultStoreOptions() {
    return {
        maxItems: 50,
        defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
        enableLRU: true,
        enablePersistence: false
    };
}
// Conflict resolution presets
export function createAbortOnConflictResolution() {
    return {
        strategy: ConflictStrategy.ABORT
    };
}
export function createOverwriteConflictResolution() {
    return {
        strategy: ConflictStrategy.OVERWRITE
    };
}
export function createSkipConflictResolution() {
    return {
        strategy: ConflictStrategy.SKIP
    };
}
export function createMergeConflictResolution() {
    return {
        strategy: ConflictStrategy.MERGE
    };
}
// Re-export specific types for convenience
import { ConflictStrategy } from './RollbackTypes.js';
//# sourceMappingURL=index.js.map