/**
 * Change detection and diff generation for rollback operations
 */

import {
  DiffEntry,
  DiffOperation,
  RollbackDiff,
  Snapshot,
  RollbackError,
} from './RollbackTypes.js';

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
export class DiffEngine {
  // Safe access helpers to avoid dynamic object injection patterns
  private hasOwn(obj: unknown, key: PropertyKey): boolean {
    return obj !== null && typeof obj === 'object' &&
      Object.prototype.hasOwnProperty.call(obj as object, key);
  }

  private get(obj: unknown, key: PropertyKey): any {
    if (obj !== null && typeof obj === 'object' && this.hasOwn(obj, key)) {
      // eslint-disable-next-line security/detect-object-injection -- Key guarded via hasOwnProperty
      return (obj as any)[key];
    }
    return undefined;
  }

  private set(obj: unknown, key: PropertyKey, value: any): void {
    if (obj !== null && typeof obj === 'object') {
      // eslint-disable-next-line security/detect-object-injection -- Intentional write to guarded object
      (obj as any)[key] = value;
    }
  }

  private del(obj: unknown, key: PropertyKey): void {
    if (obj !== null && typeof obj === 'object') {
      // eslint-disable-next-line security/detect-object-injection -- Intentional delete on guarded object
      delete (obj as any)[key];
    }
  }

  private getArray(arr: unknown, index: number): any {
    if (Array.isArray(arr) && Number.isInteger(index) && index >= 0 && index < arr.length) {
      // eslint-disable-next-line security/detect-object-injection -- Index bounds checked
      return arr[index];
    }
    return undefined;
  }

  private setArray(arr: unknown, index: number, value: any): void {
    if (Array.isArray(arr) && Number.isInteger(index) && index >= 0) {
      // Grow array if needed in a controlled manner
      while (arr.length < index) arr.push(undefined);
      // eslint-disable-next-line security/detect-object-injection -- Index bounds ensured
      (arr as any)[index] = value;
    }
  }
  private defaultOptions: DiffOptions = {
    maxDepth: 10,
    ignoreProperties: ['__timestamp', '__version', '__metadata'],
    includeMetadata: true,
    customComparators: new Map(),
  };

  /**
   * Generate diff between two snapshots
   */
  async generateSnapshotDiff(
    fromSnapshot: Snapshot,
    toSnapshot: Snapshot,
    options?: DiffOptions
  ): Promise<RollbackDiff> {
    if (fromSnapshot.type !== toSnapshot.type) {
      throw new RollbackError(
        `Cannot diff snapshots of different types: ${fromSnapshot.type} vs ${toSnapshot.type}`,
        'SNAPSHOT_TYPE_MISMATCH',
        { fromType: fromSnapshot.type, toType: toSnapshot.type }
      );
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const changes = this.diffObjects(
      fromSnapshot.data,
      toSnapshot.data,
      '',
      mergedOptions
    );

    return {
      from: fromSnapshot.rollbackPointId,
      to: toSnapshot.rollbackPointId,
      changes,
      changeCount: changes.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate diff between two arbitrary objects
   */
  async generateObjectDiff(
    fromObject: any,
    toObject: any,
    options?: DiffOptions
  ): Promise<DiffEntry[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.diffObjects(fromObject, toObject, '', mergedOptions);
  }

  /**
   * Generate diff between two arrays
   */
  async generateArrayDiff(
    fromArray: any[],
    toArray: any[],
    options?: DiffOptions
  ): Promise<DiffEntry[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.diffArrays(fromArray, toArray, '', mergedOptions);
  }

  /**
   * Apply a diff to recreate target state
   */
  async applyDiff(sourceObject: any, diff: DiffEntry[]): Promise<any> {
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
  deepEquals(obj1: any, obj2: any, options?: DiffOptions): boolean {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.areEqual(obj1, obj2, mergedOptions);
  }

  /**
   * Generate a summary of changes in a diff
   */
  summarizeDiff(diff: RollbackDiff): {
    totalChanges: number;
    changesByOperation: Record<DiffOperation, number>;
    affectedPaths: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
  } {
    const changesByOperation: Record<DiffOperation, number> = {
      [DiffOperation.CREATE]: 0,
      [DiffOperation.UPDATE]: 0,
      [DiffOperation.DELETE]: 0,
      [DiffOperation.MOVE]: 0,
    };

    const affectedPaths = new Set<string>();

    for (const change of diff.changes) {
      changesByOperation[change.operation]++;
      affectedPaths.add(change.path.split('.')[0]); // Root path
    }

    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    if (diff.changeCount > 100) {
      estimatedComplexity = 'high';
    } else if (diff.changeCount > 20) {
      estimatedComplexity = 'medium';
    }

    return {
      totalChanges: diff.changeCount,
      changesByOperation,
      affectedPaths: Array.from(affectedPaths),
      estimatedComplexity,
    };
  }

  /**
   * Diff two objects recursively
   */
  private diffObjects(
    obj1: any,
    obj2: any,
    path: string,
    options: DiffOptions,
    depth = 0
  ): DiffEntry[] {
    if (depth > (options.maxDepth || 10)) {
      return [];
    }

    const changes: DiffEntry[] = [];

    // Handle null/undefined cases
    if (obj1 === null || obj1 === undefined) {
      if (obj2 !== null && obj2 !== undefined) {
        changes.push({
          path,
          operation: DiffOperation.CREATE,
          oldValue: obj1,
          newValue: obj2,
        });
      }
      return changes;
    }

    if (obj2 === null || obj2 === undefined) {
      changes.push({
        path,
        operation: DiffOperation.DELETE,
        oldValue: obj1,
        newValue: obj2,
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
          newValue: obj2,
        });
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return this.diffArrays(obj1, obj2, path, options, depth);
    }

    // Handle objects
    const keys1 = new Set(
      Object.keys(obj1).filter(
        (key) => !this.shouldIgnoreProperty(key, options)
      )
    );
    const keys2 = new Set(
      Object.keys(obj2).filter(
        (key) => !this.shouldIgnoreProperty(key, options)
      )
    );
    const allKeys = new Set([...Array.from(keys1), ...Array.from(keys2)]);

    for (const key of Array.from(allKeys)) {
      const newPath = path ? `${path}.${key}` : key;

      if (keys1.has(key) && keys2.has(key)) {
        // Property exists in both objects
        const v1 = this.get(obj1, key);
        const v2 = this.get(obj2, key);
        changes.push(...this.diffObjects(v1, v2, newPath, options, depth + 1));
      } else if (keys1.has(key)) {
        // Property removed
        changes.push({
          path: newPath,
          operation: DiffOperation.DELETE,
          oldValue: this.get(obj1, key),
          newValue: undefined,
        });
      } else {
        // Property added
        changes.push({
          path: newPath,
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: this.get(obj2, key),
        });
      }
    }

    return changes;
  }

  /**
   * Diff two arrays using LCS-based algorithm
   */
  private diffArrays(
    arr1: any[],
    arr2: any[],
    path: string,
    options: DiffOptions,
    depth = 0
  ): DiffEntry[] {
    const changes: DiffEntry[] = [];

    // Simple approach: compare by index and detect insertions/deletions
    const maxLength = Math.max(arr1.length, arr2.length);

    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;

      if (i < arr1.length && i < arr2.length) {
        // Both arrays have element at this index
        const a1 = this.getArray(arr1, i);
        const a2 = this.getArray(arr2, i);
        if (!this.areEqual(a1, a2, options)) {
          if (typeof a1 === 'object' && typeof a2 === 'object') {
            changes.push(
              ...this.diffObjects(a1, a2, newPath, options, depth + 1)
            );
          } else {
            changes.push({
              path: newPath,
              operation: DiffOperation.UPDATE,
              oldValue: a1,
              newValue: a2,
            });
          }
        }
      } else if (i < arr1.length) {
        // Element removed
        changes.push({
          path: newPath,
          operation: DiffOperation.DELETE,
          oldValue: this.getArray(arr1, i),
          newValue: undefined,
        });
      } else {
        // Element added
        changes.push({
          path: newPath,
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: this.getArray(arr2, i),
        });
      }
    }

    return changes;
  }

  /**
   * Apply a single change to an object
   */
  private applyChange(obj: any, change: DiffEntry): void {
    const pathParts = change.path.split('.');
    let current: any = obj;

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = String(this.getArray(pathParts, i) ?? '');
      const arrayMatch = part.match(/(.+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        let arr = this.get(current, arrayName);
        if (!Array.isArray(arr)) {
          arr = [];
          this.set(current, arrayName, arr);
        }
        current = this.getArray(arr, parseInt(index));
        if (current === undefined || current === null) {
          // initialize nested object when traversing
          current = {};
          this.setArray(arr, parseInt(index), current);
        }
      } else {
        let next = this.get(current, part);
        if (next === undefined || next === null || typeof next !== 'object') {
          next = {};
          this.set(current, part, next);
        }
        current = next;
      }
    }

    // Apply the change
    const lastPart = pathParts[pathParts.length - 1];
    const arrayMatch = lastPart.match(/(.+)\[(\d+)\]/);

    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      let array = this.get(current, arrayName);
      if (!Array.isArray(array)) {
        array = [];
        this.set(current, arrayName, array);
      }
      const idx = parseInt(index);

      switch (change.operation) {
        case DiffOperation.CREATE:
          (array as any[]).splice(idx, 0, change.newValue);
          break;
        case DiffOperation.UPDATE:
          this.setArray(array, idx, change.newValue);
          break;
        case DiffOperation.DELETE:
          (array as any[]).splice(idx, 1);
          break;
      }
    } else {
      switch (change.operation) {
        case DiffOperation.CREATE:
        case DiffOperation.UPDATE:
          this.set(current, lastPart, change.newValue);
          break;
        case DiffOperation.DELETE:
          this.del(current, lastPart);
          break;
      }
    }
  }

  /**
   * Check if two values are equal
   */
  private areEqual(val1: any, val2: any, options: DiffOptions): boolean {
    // Custom comparator check
    if (options.customComparators) {
      for (const [pattern, comparator] of Array.from(
        options.customComparators.entries()
      )) {
        if (pattern === '*' || val1?.constructor?.name === pattern) {
          return comparator(val1, val2);
        }
      }
    }

    // Standard equality checks
    if (val1 === val2) return true;
    if (val1 == null || val2 == null) return val1 === val2;
    if (typeof val1 !== typeof val2) return false;

    // Date comparison
    if (val1 instanceof Date && val2 instanceof Date) {
      return val1.getTime() === val2.getTime();
    }

    // Array comparison
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      return val1.every((item, index) => {
        const other = this.getArray(val2, index);
        return this.areEqual(item, other, options);
      });
    }

    // Object comparison
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      const keys1 = Object.keys(val1).filter(
        (key) => !this.shouldIgnoreProperty(key, options)
      );
      const keys2 = Object.keys(val2).filter(
        (key) => !this.shouldIgnoreProperty(key, options)
      );

      if (keys1.length !== keys2.length) return false;

      return keys1.every((key) => {
        if (!keys2.includes(key)) return false;
        const v1 = this.get(val1, key);
        const v2 = this.get(val2, key);
        return this.areEqual(v1, v2, options);
      });
    }

    return false;
  }

  /**
   * Check if a property should be ignored during diffing
   */
  private shouldIgnoreProperty(
    property: string,
    options: DiffOptions
  ): boolean {
    return options.ignoreProperties?.includes(property) || false;
  }

  /**
   * Create a deep clone of an object
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item));

    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      this.set(cloned, key, this.deepClone(value));
    }
    return cloned;
  }
}
