/**
 * Different rollback strategies for various scenarios
 */
import { EventEmitter } from 'events';
import { RollbackStrategy, RollbackOperation, RollbackPoint, Snapshot, DiffEntry, ConflictResolution, RollbackConflict, RollbackLogEntry } from './RollbackTypes.js';
/**
 * Context passed to rollback strategies
 */
interface RollbackContext {
    operation: RollbackOperation;
    targetRollbackPoint: RollbackPoint;
    snapshots: Snapshot[];
    diff: DiffEntry[];
    conflictResolution: ConflictResolution;
    onProgress?: (progress: number) => void;
    onLog?: (entry: RollbackLogEntry) => void;
}
/**
 * Base class for rollback strategies
 */
declare abstract class BaseRollbackStrategy extends EventEmitter {
    protected context: RollbackContext;
    /**
     * Execute the rollback strategy
     */
    abstract execute(context: RollbackContext): Promise<void>;
    /**
     * Validate if the strategy can be applied
     */
    abstract validate(context: RollbackContext): Promise<boolean>;
    /**
     * Estimate the time required for rollback
     */
    abstract estimateTime(context: RollbackContext): Promise<number>;
    /**
     * Log a message during rollback execution
     */
    protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void;
    /**
     * Update progress during rollback execution
     */
    protected updateProgress(progress: number): void;
    /**
     * Handle conflicts during rollback
     */
    protected handleConflicts(conflicts: RollbackConflict[]): Promise<void>;
    /**
     * Attempt to merge conflicted changes
     */
    protected mergeConflicts(conflicts: RollbackConflict[]): Promise<void>;
}
/**
 * Immediate rollback strategy - applies all changes at once
 */
export declare class ImmediateRollbackStrategy extends BaseRollbackStrategy {
    validate(context: RollbackContext): Promise<boolean>;
    estimateTime(context: RollbackContext): Promise<number>;
    execute(context: RollbackContext): Promise<void>;
    private detectConflicts;
    private applyChange;
}
/**
 * Gradual rollback strategy - applies changes in batches with delays
 */
export declare class GradualRollbackStrategy extends BaseRollbackStrategy {
    private batchSize;
    private delayBetweenBatches;
    constructor(options?: {
        batchSize?: number;
        delayBetweenBatches?: number;
    });
    validate(context: RollbackContext): Promise<boolean>;
    estimateTime(context: RollbackContext): Promise<number>;
    execute(context: RollbackContext): Promise<void>;
    private createBatches;
    private detectBatchConflicts;
    private applyChange;
}
/**
 * Safe rollback strategy - includes extensive validation and backup
 */
export declare class SafeRollbackStrategy extends BaseRollbackStrategy {
    validate(context: RollbackContext): Promise<boolean>;
    estimateTime(context: RollbackContext): Promise<number>;
    execute(context: RollbackContext): Promise<void>;
    private createSafetyBackup;
    private validateAllChanges;
    private validateChange;
    private detectConflicts;
    private applyChangeWithVerification;
    private applyChange;
    private verifyChange;
    private performFinalVerification;
    private restoreSafetyBackup;
}
/**
 * Force rollback strategy - applies changes without safety checks
 */
export declare class ForceRollbackStrategy extends BaseRollbackStrategy {
    validate(context: RollbackContext): Promise<boolean>;
    estimateTime(context: RollbackContext): Promise<number>;
    execute(context: RollbackContext): Promise<void>;
    private forceApplyChange;
}
/**
 * Factory for creating rollback strategies
 */
export declare class RollbackStrategyFactory {
    private static strategies;
    /**
     * Create a rollback strategy instance
     */
    static createStrategy(strategy: RollbackStrategy, options?: any): BaseRollbackStrategy;
    /**
     * Get recommended strategy based on rollback context
     */
    static getRecommendedStrategy(context: RollbackContext): RollbackStrategy;
}
export {};
//# sourceMappingURL=RollbackStrategies.d.ts.map