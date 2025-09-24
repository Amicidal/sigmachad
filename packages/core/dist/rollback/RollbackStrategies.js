/**
 * Different rollback strategies for various scenarios
 */
import { EventEmitter } from 'events';
import { RollbackStrategy, ConflictStrategy, ConflictType, RollbackError, RollbackConflictError } from './RollbackTypes.js';
/**
 * Base class for rollback strategies
 */
class BaseRollbackStrategy extends EventEmitter {
    /**
     * Log a message during rollback execution
     */
    log(level, message, data) {
        const entry = {
            timestamp: new Date(),
            level,
            message,
            data
        };
        if (this.context.onLog) {
            this.context.onLog(entry);
        }
        this.emit('log', entry);
    }
    /**
     * Update progress during rollback execution
     */
    updateProgress(progress) {
        if (this.context.onProgress) {
            this.context.onProgress(Math.min(100, Math.max(0, progress)));
        }
        this.emit('progress', { progress });
    }
    /**
     * Handle conflicts during rollback
     */
    async handleConflicts(conflicts) {
        if (conflicts.length === 0)
            return;
        this.log('warn', `Detected ${conflicts.length} conflicts during rollback`, {
            conflictCount: conflicts.length,
            conflictTypes: conflicts.map(c => c.type)
        });
        switch (this.context.conflictResolution.strategy) {
            case ConflictStrategy.ABORT:
                throw new RollbackConflictError('Rollback aborted due to conflicts', conflicts);
            case ConflictStrategy.SKIP:
                this.log('info', 'Skipping conflicted changes');
                break;
            case ConflictStrategy.OVERWRITE:
                this.log('warn', 'Overwriting conflicted changes');
                break;
            case ConflictStrategy.ASK_USER:
                if (this.context.conflictResolution.resolver) {
                    for (const conflict of conflicts) {
                        await this.context.conflictResolution.resolver(conflict);
                    }
                }
                else {
                    throw new RollbackConflictError('User resolution required but no resolver provided', conflicts);
                }
                break;
            case ConflictStrategy.MERGE:
                this.log('info', 'Attempting to merge conflicted changes');
                await this.mergeConflicts(conflicts);
                break;
        }
    }
    /**
     * Attempt to merge conflicted changes
     */
    async mergeConflicts(conflicts) {
        // Simple merge strategy - can be enhanced for specific use cases
        for (const conflict of conflicts) {
            this.log('debug', `Merging conflict at path: ${conflict.path}`, {
                conflictType: conflict.type,
                currentValue: conflict.currentValue,
                rollbackValue: conflict.rollbackValue
            });
            // Default merge behavior based on conflict type
            switch (conflict.type) {
                case ConflictType.VALUE_MISMATCH:
                    // Prefer rollback value for value mismatches
                    break;
                case ConflictType.MISSING_TARGET:
                    // Skip if target is missing
                    continue;
                case ConflictType.TYPE_MISMATCH:
                    // Skip type mismatches to avoid errors
                    continue;
                default:
                    // Default to rollback value
                    break;
            }
        }
    }
}
/**
 * Immediate rollback strategy - applies all changes at once
 */
export class ImmediateRollbackStrategy extends BaseRollbackStrategy {
    async validate(context) {
        this.context = context;
        // Immediate strategy can handle most scenarios
        return true;
    }
    async estimateTime(context) {
        // Base time + time per change
        const baseTime = 1000; // 1 second base
        const timePerChange = 50; // 50ms per change
        return baseTime + (context.diff.length * timePerChange);
    }
    async execute(context) {
        this.context = context;
        this.log('info', 'Starting immediate rollback strategy');
        const totalChanges = context.diff.length;
        let processedChanges = 0;
        try {
            // Detect conflicts first
            const conflicts = await this.detectConflicts(context.diff);
            await this.handleConflicts(conflicts);
            // Apply all changes in order
            for (const change of context.diff) {
                await this.applyChange(change);
                processedChanges++;
                this.updateProgress((processedChanges / totalChanges) * 100);
            }
            this.log('info', 'Immediate rollback completed successfully', {
                totalChanges,
                processedChanges
            });
        }
        catch (error) {
            this.log('error', 'Immediate rollback failed', {
                error: error instanceof Error ? error.message : String(error),
                processedChanges,
                totalChanges
            });
            throw error;
        }
    }
    async detectConflicts(changes) {
        const conflicts = [];
        // Simple conflict detection - can be enhanced
        for (const change of changes) {
            // Check if the path still exists and matches expected state
            // This is a simplified implementation
            if (change.operation === 'update' && change.oldValue !== change.newValue) {
                // Simulate checking current state vs expected old value
                const currentMatches = true; // Placeholder for actual check
                if (!currentMatches) {
                    conflicts.push({
                        path: change.path,
                        type: ConflictType.VALUE_MISMATCH,
                        currentValue: 'current_state', // Placeholder
                        rollbackValue: change.oldValue,
                        context: { change }
                    });
                }
            }
        }
        return conflicts;
    }
    async applyChange(change) {
        this.log('debug', `Applying change: ${change.operation} at ${change.path}`);
        // Placeholder for actual change application
        // In a real implementation, this would interact with the appropriate services
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
    }
}
/**
 * Gradual rollback strategy - applies changes in batches with delays
 */
export class GradualRollbackStrategy extends BaseRollbackStrategy {
    constructor(options) {
        var _a, _b;
        super();
        this.batchSize = 10;
        this.delayBetweenBatches = 1000; // 1 second
        if (options) {
            this.batchSize = (_a = options.batchSize) !== null && _a !== void 0 ? _a : this.batchSize;
            this.delayBetweenBatches = (_b = options.delayBetweenBatches) !== null && _b !== void 0 ? _b : this.delayBetweenBatches;
        }
    }
    async validate(context) {
        this.context = context;
        // Gradual strategy is suitable for large rollbacks
        return context.diff.length > 5;
    }
    async estimateTime(context) {
        const batches = Math.ceil(context.diff.length / this.batchSize);
        const baseTime = 1000; // 1 second base
        const timePerBatch = 500; // 500ms per batch
        const delayTime = (batches - 1) * this.delayBetweenBatches;
        return baseTime + (batches * timePerBatch) + delayTime;
    }
    async execute(context) {
        this.context = context;
        this.log('info', 'Starting gradual rollback strategy', {
            totalChanges: context.diff.length,
            batchSize: this.batchSize,
            delayBetweenBatches: this.delayBetweenBatches
        });
        const totalChanges = context.diff.length;
        const batches = this.createBatches(context.diff);
        let processedChanges = 0;
        try {
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                this.log('debug', `Processing batch ${i + 1} of ${batches.length}`, {
                    batchSize: batch.length
                });
                // Detect conflicts for this batch
                const conflicts = await this.detectBatchConflicts(batch);
                await this.handleConflicts(conflicts);
                // Apply changes in this batch
                for (const change of batch) {
                    await this.applyChange(change);
                    processedChanges++;
                    this.updateProgress((processedChanges / totalChanges) * 100);
                }
                // Delay before next batch (except for last batch)
                if (i < batches.length - 1) {
                    this.log('debug', `Waiting ${this.delayBetweenBatches}ms before next batch`);
                    await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
                }
            }
            this.log('info', 'Gradual rollback completed successfully', {
                totalChanges,
                batchesProcessed: batches.length
            });
        }
        catch (error) {
            this.log('error', 'Gradual rollback failed', {
                error: error instanceof Error ? error.message : String(error),
                processedChanges,
                totalChanges
            });
            throw error;
        }
    }
    createBatches(changes) {
        const batches = [];
        for (let i = 0; i < changes.length; i += this.batchSize) {
            batches.push(changes.slice(i, i + this.batchSize));
        }
        return batches;
    }
    async detectBatchConflicts(batch) {
        // Simplified conflict detection for batch
        return [];
    }
    async applyChange(change) {
        this.log('debug', `Applying change: ${change.operation} at ${change.path}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
    }
}
/**
 * Safe rollback strategy - includes extensive validation and backup
 */
export class SafeRollbackStrategy extends BaseRollbackStrategy {
    async validate(context) {
        this.context = context;
        // Perform extensive validation
        this.log('info', 'Performing safety validation');
        // Check if all snapshots are available and valid
        for (const snapshot of context.snapshots) {
            if (!snapshot.checksum) {
                this.log('warn', 'Snapshot missing checksum - may be unsafe', {
                    snapshotId: snapshot.id
                });
            }
        }
        // Check if rollback point is not too old
        const age = Date.now() - context.targetRollbackPoint.timestamp.getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (age > maxAge) {
            this.log('warn', 'Rollback point is very old - may be unsafe', {
                ageInDays: age / (24 * 60 * 60 * 1000)
            });
            return false;
        }
        return true;
    }
    async estimateTime(context) {
        // Safe strategy takes longer due to validation and backup
        const baseTime = 5000; // 5 seconds base
        const timePerChange = 100; // 100ms per change
        const validationTime = 2000; // 2 seconds validation
        return baseTime + (context.diff.length * timePerChange) + validationTime;
    }
    async execute(context) {
        this.context = context;
        this.log('info', 'Starting safe rollback strategy');
        const totalChanges = context.diff.length;
        let processedChanges = 0;
        try {
            // Step 1: Create safety backup
            this.log('info', 'Creating safety backup');
            await this.createSafetyBackup();
            this.updateProgress(10);
            // Step 2: Validate all changes
            this.log('info', 'Validating all changes');
            await this.validateAllChanges(context.diff);
            this.updateProgress(20);
            // Step 3: Detect and resolve conflicts
            this.log('info', 'Detecting conflicts');
            const conflicts = await this.detectConflicts(context.diff);
            await this.handleConflicts(conflicts);
            this.updateProgress(30);
            // Step 4: Apply changes with verification
            this.log('info', 'Applying changes with verification');
            for (const change of context.diff) {
                await this.applyChangeWithVerification(change);
                processedChanges++;
                const progress = 30 + ((processedChanges / totalChanges) * 60);
                this.updateProgress(progress);
            }
            // Step 5: Final verification
            this.log('info', 'Performing final verification');
            await this.performFinalVerification();
            this.updateProgress(100);
            this.log('info', 'Safe rollback completed successfully', {
                totalChanges,
                processedChanges
            });
        }
        catch (error) {
            this.log('error', 'Safe rollback failed - attempting to restore safety backup', {
                error: error instanceof Error ? error.message : String(error)
            });
            try {
                await this.restoreSafetyBackup();
                this.log('info', 'Safety backup restored successfully');
            }
            catch (restoreError) {
                this.log('error', 'Failed to restore safety backup', {
                    restoreError: restoreError instanceof Error ? restoreError.message : String(restoreError)
                });
            }
            throw error;
        }
    }
    async createSafetyBackup() {
        // Placeholder for creating a safety backup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    async validateAllChanges(changes) {
        // Validate each change before applying
        for (const change of changes) {
            await this.validateChange(change);
        }
    }
    async validateChange(change) {
        // Placeholder for change validation
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    async detectConflicts(changes) {
        // Enhanced conflict detection for safe strategy
        return [];
    }
    async applyChangeWithVerification(change) {
        // Apply change
        await this.applyChange(change);
        // Verify change was applied correctly
        await this.verifyChange(change);
    }
    async applyChange(change) {
        this.log('debug', `Safely applying change: ${change.operation} at ${change.path}`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    async verifyChange(change) {
        // Placeholder for change verification
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    async performFinalVerification() {
        // Placeholder for final system verification
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    async restoreSafetyBackup() {
        // Placeholder for restoring safety backup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
/**
 * Force rollback strategy - applies changes without safety checks
 */
export class ForceRollbackStrategy extends BaseRollbackStrategy {
    async validate(context) {
        this.context = context;
        // Force strategy always validates (it ignores safety)
        this.log('warn', 'Force rollback strategy bypasses safety checks');
        return true;
    }
    async estimateTime(context) {
        // Force strategy is fastest
        const baseTime = 500; // 0.5 seconds base
        const timePerChange = 20; // 20ms per change
        return baseTime + (context.diff.length * timePerChange);
    }
    async execute(context) {
        this.context = context;
        this.log('warn', 'Starting force rollback strategy - safety checks disabled');
        const totalChanges = context.diff.length;
        let processedChanges = 0;
        try {
            // Apply all changes without conflict detection or validation
            for (const change of context.diff) {
                await this.forceApplyChange(change);
                processedChanges++;
                this.updateProgress((processedChanges / totalChanges) * 100);
            }
            this.log('info', 'Force rollback completed', {
                totalChanges,
                processedChanges,
                warning: 'No safety validations were performed'
            });
        }
        catch (error) {
            this.log('error', 'Force rollback failed', {
                error: error instanceof Error ? error.message : String(error),
                processedChanges,
                totalChanges,
                warning: 'System may be in inconsistent state'
            });
            throw error;
        }
    }
    async forceApplyChange(change) {
        this.log('debug', `Force applying change: ${change.operation} at ${change.path}`);
        // Apply change without any safety checks
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}
/**
 * Factory for creating rollback strategies
 */
export class RollbackStrategyFactory {
    /**
     * Create a rollback strategy instance
     */
    static createStrategy(strategy, options) {
        const factory = this.strategies.get(strategy);
        if (!factory) {
            throw new RollbackError(`Unknown rollback strategy: ${strategy}`, 'UNKNOWN_STRATEGY', { strategy });
        }
        const instance = factory();
        // Apply options if provided
        if (options && strategy === RollbackStrategy.GRADUAL) {
            return new GradualRollbackStrategy(options);
        }
        return instance;
    }
    /**
     * Get recommended strategy based on rollback context
     */
    static getRecommendedStrategy(context) {
        const changeCount = context.diff.length;
        const rollbackAge = Date.now() - context.targetRollbackPoint.timestamp.getTime();
        const dayInMs = 24 * 60 * 60 * 1000;
        // If very few changes, use immediate
        if (changeCount <= 5) {
            return RollbackStrategy.IMMEDIATE;
        }
        // If rollback point is old, use safe strategy
        if (rollbackAge > dayInMs) {
            return RollbackStrategy.SAFE;
        }
        // If many changes, use gradual
        if (changeCount > 50) {
            return RollbackStrategy.GRADUAL;
        }
        // Default to immediate for moderate changes
        return RollbackStrategy.IMMEDIATE;
    }
}
RollbackStrategyFactory.strategies = new Map([
    [RollbackStrategy.IMMEDIATE, () => new ImmediateRollbackStrategy()],
    [RollbackStrategy.GRADUAL, () => new GradualRollbackStrategy()],
    [RollbackStrategy.SAFE, () => new SafeRollbackStrategy()],
    [RollbackStrategy.FORCE, () => new ForceRollbackStrategy()]
]);
//# sourceMappingURL=RollbackStrategies.js.map