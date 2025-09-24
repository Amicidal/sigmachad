/**
 * Change detection and diff generation for rollback operations
 */
import { DiffEntry, DiffOperation, RollbackDiff, Snapshot } from './RollbackTypes.js';
/**
 * Options for diff generation
 */
interface DiffOptions {
    /** Maximum depth to traverse when diffing nested objects */
    maxDepth?: number;
    /** Properties to ignore during diffing */
    ignoreProperties?: string[];
    /** Whether to include metadata in diff entries */
    includeMetadata?: boolean;
    /** Custom comparison function for specific properties */
    customComparators?: Map<string, (a: any, b: any) => boolean>;
}
/**
 * Engine for generating diffs between different states
 */
export declare class DiffEngine {
    private defaultOptions;
    /**
     * Generate diff between two snapshots
     */
    generateSnapshotDiff(fromSnapshot: Snapshot, toSnapshot: Snapshot, options?: DiffOptions): Promise<RollbackDiff>;
    /**
     * Generate diff between two arbitrary objects
     */
    generateObjectDiff(fromObject: any, toObject: any, options?: DiffOptions): Promise<DiffEntry[]>;
    /**
     * Generate diff between two arrays
     */
    generateArrayDiff(fromArray: any[], toArray: any[], options?: DiffOptions): Promise<DiffEntry[]>;
    /**
     * Apply a diff to recreate target state
     */
    applyDiff(sourceObject: any, diff: DiffEntry[]): Promise<any>;
    /**
     * Check if two objects are equal using deep comparison
     */
    deepEquals(obj1: any, obj2: any, options?: DiffOptions): boolean;
    /**
     * Generate a summary of changes in a diff
     */
    summarizeDiff(diff: RollbackDiff): {
        totalChanges: number;
        changesByOperation: Record<DiffOperation, number>;
        affectedPaths: string[];
        estimatedComplexity: 'low' | 'medium' | 'high';
    };
    /**
     * Diff two objects recursively
     */
    private diffObjects;
    /**
     * Diff two arrays using LCS-based algorithm
     */
    private diffArrays;
    /**
     * Apply a single change to an object
     */
    private applyChange;
    /**
     * Check if two values are equal
     */
    private areEqual;
    /**
     * Check if a property should be ignored during diffing
     */
    private shouldIgnoreProperty;
    /**
     * Create a deep clone of an object
     */
    private deepClone;
}
export {};
//# sourceMappingURL=DiffEngine.d.ts.map