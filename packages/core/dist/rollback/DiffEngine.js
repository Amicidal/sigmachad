/**
 * Change detection and diff generation for rollback operations
 */
import { DiffOperation, RollbackError } from './RollbackTypes.js';
/**
 * Engine for generating diffs between different states
 */
export class DiffEngine {
    constructor() {
        this.defaultOptions = {
            maxDepth: 10,
            ignoreProperties: ['__timestamp', '__version', '__metadata'],
            includeMetadata: true,
            customComparators: new Map()
        };
    }
    /**
     * Generate diff between two snapshots
     */
    async generateSnapshotDiff(fromSnapshot, toSnapshot, options) {
        if (fromSnapshot.type !== toSnapshot.type) {
            throw new RollbackError(`Cannot diff snapshots of different types: ${fromSnapshot.type} vs ${toSnapshot.type}`, 'SNAPSHOT_TYPE_MISMATCH', { fromType: fromSnapshot.type, toType: toSnapshot.type });
        }
        const mergedOptions = { ...this.defaultOptions, ...options };
        const changes = this.diffObjects(fromSnapshot.data, toSnapshot.data, '', mergedOptions);
        return {
            from: fromSnapshot.rollbackPointId,
            to: toSnapshot.rollbackPointId,
            changes,
            changeCount: changes.length,
            generatedAt: new Date()
        };
    }
    /**
     * Generate diff between two arbitrary objects
     */
    async generateObjectDiff(fromObject, toObject, options) {
        const mergedOptions = { ...this.defaultOptions, ...options };
        return this.diffObjects(fromObject, toObject, '', mergedOptions);
    }
    /**
     * Generate diff between two arrays
     */
    async generateArrayDiff(fromArray, toArray, options) {
        const mergedOptions = { ...this.defaultOptions, ...options };
        return this.diffArrays(fromArray, toArray, '', mergedOptions);
    }
    /**
     * Apply a diff to recreate target state
     */
    async applyDiff(sourceObject, diff) {
        // Create a deep clone to avoid mutating the original
        const result = this.deepClone(sourceObject);
        // Sort changes by operation priority: deletes first, then updates, then creates
        const sortedChanges = [...diff].sort((a, b) => {
            const priority = { delete: 0, update: 1, move: 2, create: 3 };
            return priority[a.operation] - priority[b.operation];
        });
        for (const change of sortedChanges) {
            this.applyChange(result, change);
        }
        return result;
    }
    /**
     * Check if two objects are equal using deep comparison
     */
    deepEquals(obj1, obj2, options) {
        const mergedOptions = { ...this.defaultOptions, ...options };
        return this.areEqual(obj1, obj2, mergedOptions);
    }
    /**
     * Generate a summary of changes in a diff
     */
    summarizeDiff(diff) {
        const changesByOperation = {
            [DiffOperation.CREATE]: 0,
            [DiffOperation.UPDATE]: 0,
            [DiffOperation.DELETE]: 0,
            [DiffOperation.MOVE]: 0
        };
        const affectedPaths = new Set();
        for (const change of diff.changes) {
            changesByOperation[change.operation]++;
            affectedPaths.add(change.path.split('.')[0]); // Root path
        }
        let estimatedComplexity = 'low';
        if (diff.changeCount > 100) {
            estimatedComplexity = 'high';
        }
        else if (diff.changeCount > 20) {
            estimatedComplexity = 'medium';
        }
        return {
            totalChanges: diff.changeCount,
            changesByOperation,
            affectedPaths: Array.from(affectedPaths),
            estimatedComplexity
        };
    }
    /**
     * Diff two objects recursively
     */
    diffObjects(obj1, obj2, path, options, depth = 0) {
        if (depth > (options.maxDepth || 10)) {
            return [];
        }
        const changes = [];
        // Handle null/undefined cases
        if (obj1 === null || obj1 === undefined) {
            if (obj2 !== null && obj2 !== undefined) {
                changes.push({
                    path,
                    operation: DiffOperation.CREATE,
                    oldValue: obj1,
                    newValue: obj2
                });
            }
            return changes;
        }
        if (obj2 === null || obj2 === undefined) {
            changes.push({
                path,
                operation: DiffOperation.DELETE,
                oldValue: obj1,
                newValue: obj2
            });
            return changes;
        }
        // Handle primitive types
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            if (!this.areEqual(obj1, obj2, options)) {
                changes.push({
                    path,
                    operation: DiffOperation.UPDATE,
                    oldValue: obj1,
                    newValue: obj2
                });
            }
            return changes;
        }
        // Handle arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            return this.diffArrays(obj1, obj2, path, options, depth);
        }
        // Handle objects
        const keys1 = new Set(Object.keys(obj1).filter(key => !this.shouldIgnoreProperty(key, options)));
        const keys2 = new Set(Object.keys(obj2).filter(key => !this.shouldIgnoreProperty(key, options)));
        const allKeys = new Set([...Array.from(keys1), ...Array.from(keys2)]);
        for (const key of Array.from(allKeys)) {
            const newPath = path ? `${path}.${key}` : key;
            if (keys1.has(key) && keys2.has(key)) {
                // Property exists in both objects
                changes.push(...this.diffObjects(obj1[key], obj2[key], newPath, options, depth + 1));
            }
            else if (keys1.has(key)) {
                // Property removed
                changes.push({
                    path: newPath,
                    operation: DiffOperation.DELETE,
                    oldValue: obj1[key],
                    newValue: undefined
                });
            }
            else {
                // Property added
                changes.push({
                    path: newPath,
                    operation: DiffOperation.CREATE,
                    oldValue: undefined,
                    newValue: obj2[key]
                });
            }
        }
        return changes;
    }
    /**
     * Diff two arrays using LCS-based algorithm
     */
    diffArrays(arr1, arr2, path, options, depth = 0) {
        const changes = [];
        // Simple approach: compare by index and detect insertions/deletions
        const maxLength = Math.max(arr1.length, arr2.length);
        for (let i = 0; i < maxLength; i++) {
            const newPath = `${path}[${i}]`;
            if (i < arr1.length && i < arr2.length) {
                // Both arrays have element at this index
                if (!this.areEqual(arr1[i], arr2[i], options)) {
                    if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') {
                        changes.push(...this.diffObjects(arr1[i], arr2[i], newPath, options, depth + 1));
                    }
                    else {
                        changes.push({
                            path: newPath,
                            operation: DiffOperation.UPDATE,
                            oldValue: arr1[i],
                            newValue: arr2[i]
                        });
                    }
                }
            }
            else if (i < arr1.length) {
                // Element removed
                changes.push({
                    path: newPath,
                    operation: DiffOperation.DELETE,
                    oldValue: arr1[i],
                    newValue: undefined
                });
            }
            else {
                // Element added
                changes.push({
                    path: newPath,
                    operation: DiffOperation.CREATE,
                    oldValue: undefined,
                    newValue: arr2[i]
                });
            }
        }
        return changes;
    }
    /**
     * Apply a single change to an object
     */
    applyChange(obj, change) {
        const pathParts = change.path.split('.');
        let current = obj;
        // Navigate to the parent object
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            const arrayMatch = part.match(/(.+)\[(\d+)\]/);
            if (arrayMatch) {
                const [, arrayName, index] = arrayMatch;
                if (!current[arrayName]) {
                    current[arrayName] = [];
                }
                current = current[arrayName];
                current = current[parseInt(index)];
            }
            else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        // Apply the change
        const lastPart = pathParts[pathParts.length - 1];
        const arrayMatch = lastPart.match(/(.+)\[(\d+)\]/);
        if (arrayMatch) {
            const [, arrayName, index] = arrayMatch;
            if (!current[arrayName]) {
                current[arrayName] = [];
            }
            const array = current[arrayName];
            const idx = parseInt(index);
            switch (change.operation) {
                case DiffOperation.CREATE:
                    array.splice(idx, 0, change.newValue);
                    break;
                case DiffOperation.UPDATE:
                    array[idx] = change.newValue;
                    break;
                case DiffOperation.DELETE:
                    array.splice(idx, 1);
                    break;
            }
        }
        else {
            switch (change.operation) {
                case DiffOperation.CREATE:
                case DiffOperation.UPDATE:
                    current[lastPart] = change.newValue;
                    break;
                case DiffOperation.DELETE:
                    delete current[lastPart];
                    break;
            }
        }
    }
    /**
     * Check if two values are equal
     */
    areEqual(val1, val2, options) {
        var _a;
        // Custom comparator check
        if (options.customComparators) {
            for (const [pattern, comparator] of Array.from(options.customComparators.entries())) {
                if (pattern === '*' || ((_a = val1 === null || val1 === void 0 ? void 0 : val1.constructor) === null || _a === void 0 ? void 0 : _a.name) === pattern) {
                    return comparator(val1, val2);
                }
            }
        }
        // Standard equality checks
        if (val1 === val2)
            return true;
        if (val1 == null || val2 == null)
            return val1 === val2;
        if (typeof val1 !== typeof val2)
            return false;
        // Date comparison
        if (val1 instanceof Date && val2 instanceof Date) {
            return val1.getTime() === val2.getTime();
        }
        // Array comparison
        if (Array.isArray(val1) && Array.isArray(val2)) {
            if (val1.length !== val2.length)
                return false;
            return val1.every((item, index) => this.areEqual(item, val2[index], options));
        }
        // Object comparison
        if (typeof val1 === 'object' && typeof val2 === 'object') {
            const keys1 = Object.keys(val1).filter(key => !this.shouldIgnoreProperty(key, options));
            const keys2 = Object.keys(val2).filter(key => !this.shouldIgnoreProperty(key, options));
            if (keys1.length !== keys2.length)
                return false;
            return keys1.every(key => keys2.includes(key) && this.areEqual(val1[key], val2[key], options));
        }
        return false;
    }
    /**
     * Check if a property should be ignored during diffing
     */
    shouldIgnoreProperty(property, options) {
        var _a;
        return ((_a = options.ignoreProperties) === null || _a === void 0 ? void 0 : _a.includes(property)) || false;
    }
    /**
     * Create a deep clone of an object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object')
            return obj;
        if (obj instanceof Date)
            return new Date(obj);
        if (Array.isArray(obj))
            return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const [key, value] of Object.entries(obj)) {
            cloned[key] = this.deepClone(value);
        }
        return cloned;
    }
}
//# sourceMappingURL=DiffEngine.js.map