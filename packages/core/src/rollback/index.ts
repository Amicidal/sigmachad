/**
 * Enhanced rollback capabilities module exports
 *
 * This module provides comprehensive rollback functionality including:
 * - In-memory and PostgreSQL persistence
 * - Change detection and diff generation
 * - Multiple rollback strategies (immediate, gradual, safe, force, partial, time-based)
 * - Advanced conflict resolution with visual diffs
 * - Integration with SessionManager, audit logging, and metrics
 */

// Core types and interfaces
export * from './RollbackTypes.js';

// Main components
export { RollbackManager } from './RollbackManager.js';
export { SnapshotManager } from './Snapshot.js';
export { DiffEngine } from './DiffEngine.js';
export { RollbackStore } from './RollbackStore.js';

// Enhanced persistence
export { PostgreSQLRollbackStore } from './PostgreSQLRollbackStore.js';

// Rollback strategies
export {
  RollbackStrategyFactory,
  ImmediateRollbackStrategy,
  GradualRollbackStrategy,
  SafeRollbackStrategy,
  ForceRollbackStrategy
} from './RollbackStrategies.js';

// Enhanced rollback strategies
export {
  PartialRollbackStrategy,
  TimebasedRollbackStrategy,
  DryRunRollbackStrategy
} from './EnhancedRollbackStrategies.js';

// Conflict resolution engine
export {
  ConflictResolutionEngine
} from './ConflictResolutionEngine.js';

// Integration layer
export {
  IntegratedRollbackManager
} from './RollbackIntegrationLayer.js';

// Default configuration factory
export function createDefaultRollbackConfig(): RollbackConfig {
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
export function createDefaultStoreOptions(): RollbackStoreOptions {
  return {
    maxItems: 50,
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    enableLRU: true,
    enablePersistence: false
  };
}

// Conflict resolution presets
export function createAbortOnConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.MANUAL,
    timestamp: new Date(),
    resolvedBy: 'default'
  };
}

export function createOverwriteConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.OVERWRITE,
    timestamp: new Date(),
    resolvedBy: 'default'
  };
}

export function createSkipConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.SKIP,
    timestamp: new Date(),
    resolvedBy: 'default'
  };
}

export function createMergeConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.MERGE,
    timestamp: new Date(),
    resolvedBy: 'default'
  };
}

// Re-export specific types for convenience
import {
  RollbackConfig,
  RollbackStoreOptions,
  ConflictResolution,
  ConflictStrategy
} from './RollbackTypes.js';
