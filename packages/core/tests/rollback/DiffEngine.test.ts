/**
 * Unit tests for DiffEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DiffEngine } from '../../src/rollback/DiffEngine.js';
import { DiffOperation, SnapshotType } from '../../src/rollback/index.js';

describe('DiffEngine', () => {
  let engine: DiffEngine;

  beforeEach(() => {
    engine = new DiffEngine();
  });

  describe('generateObjectDiff', () => {
    it('should detect added properties', async () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };

      const diff = await engine.generateObjectDiff(obj1, obj2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('b');
      expect(diff[0].operation).toBe(DiffOperation.CREATE);
      expect(diff[0].oldValue).toBeUndefined();
      expect(diff[0].newValue).toBe(2);
    });

    it('should detect removed properties', async () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1 };

      const diff = await engine.generateObjectDiff(obj1, obj2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('b');
      expect(diff[0].operation).toBe(DiffOperation.DELETE);
      expect(diff[0].oldValue).toBe(2);
      expect(diff[0].newValue).toBeUndefined();
    });

    it('should detect modified properties', async () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      const diff = await engine.generateObjectDiff(obj1, obj2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('b');
      expect(diff[0].operation).toBe(DiffOperation.UPDATE);
      expect(diff[0].oldValue).toBe(2);
      expect(diff[0].newValue).toBe(3);
    });

    it('should handle nested objects', async () => {
      const obj1 = {
        user: { id: 1, name: 'John', address: { city: 'NYC' } }
      };
      const obj2 = {
        user: { id: 1, name: 'Jane', address: { city: 'NYC', zip: '10001' } }
      };

      const diff = await engine.generateObjectDiff(obj1, obj2);

      expect(diff.length).toBeGreaterThanOrEqual(2);

      const nameChange = diff.find(d => d.path === 'user.name');
      expect(nameChange).toBeDefined();
      expect(nameChange!.operation).toBe(DiffOperation.UPDATE);
      expect(nameChange!.oldValue).toBe('John');
      expect(nameChange!.newValue).toBe('Jane');

      const zipChange = diff.find(d => d.path === 'user.address.zip');
      expect(zipChange).toBeDefined();
      expect(zipChange!.operation).toBe(DiffOperation.CREATE);
      expect(zipChange!.newValue).toBe('10001');
    });

    it('should ignore specified properties', async () => {
      const obj1 = { a: 1, __timestamp: '2023-01-01', __version: 1 };
      const obj2 = { a: 2, __timestamp: '2023-01-02', __version: 2 };

      const diff = await engine.generateObjectDiff(obj1, obj2, {
        ignoreProperties: ['__timestamp', '__version']
      });

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('a');
      expect(diff[0].operation).toBe(DiffOperation.UPDATE);
    });

    it('should handle null and undefined values', async () => {
      const obj1 = { a: null, b: undefined, c: 1 };
      const obj2 = { a: 1, b: 2, c: null };

      const diff = await engine.generateObjectDiff(obj1, obj2);

      expect(diff).toHaveLength(3);

      const aChange = diff.find(d => d.path === 'a');
      expect(aChange!.operation).toBe(DiffOperation.UPDATE);
      expect(aChange!.oldValue).toBeNull();
      expect(aChange!.newValue).toBe(1);

      const cChange = diff.find(d => d.path === 'c');
      expect(cChange!.operation).toBe(DiffOperation.UPDATE);
      expect(cChange!.oldValue).toBe(1);
      expect(cChange!.newValue).toBeNull();
    });

    it('should respect max depth option', async () => {
      const obj1 = {
        level1: {
          level2: {
            level3: {
              level4: { value: 1 }
            }
          }
        }
      };
      const obj2 = {
        level1: {
          level2: {
            level3: {
              level4: { value: 2 }
            }
          }
        }
      };

      const diff = await engine.generateObjectDiff(obj1, obj2, { maxDepth: 2 });

      // Should not detect changes beyond depth 2
      expect(diff).toHaveLength(0);
    });
  });

  describe('generateArrayDiff', () => {
    it('should detect added elements', async () => {
      const arr1 = [1, 2];
      const arr2 = [1, 2, 3];

      const diff = await engine.generateArrayDiff(arr1, arr2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('[2]');
      expect(diff[0].operation).toBe(DiffOperation.CREATE);
      expect(diff[0].newValue).toBe(3);
    });

    it('should detect removed elements', async () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2];

      const diff = await engine.generateArrayDiff(arr1, arr2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('[2]');
      expect(diff[0].operation).toBe(DiffOperation.DELETE);
      expect(diff[0].oldValue).toBe(3);
    });

    it('should detect modified elements', async () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 4, 3];

      const diff = await engine.generateArrayDiff(arr1, arr2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('[1]');
      expect(diff[0].operation).toBe(DiffOperation.UPDATE);
      expect(diff[0].oldValue).toBe(2);
      expect(diff[0].newValue).toBe(4);
    });

    it('should handle array of objects', async () => {
      const arr1 = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      const arr2 = [{ id: 1, name: 'A' }, { id: 2, name: 'C' }];

      const diff = await engine.generateArrayDiff(arr1, arr2);

      expect(diff).toHaveLength(1);
      expect(diff[0].path).toBe('[1].name');
      expect(diff[0].operation).toBe(DiffOperation.UPDATE);
      expect(diff[0].oldValue).toBe('B');
      expect(diff[0].newValue).toBe('C');
    });
  });

  describe('generateSnapshotDiff', () => {
    it('should generate diff between snapshots of same type', async () => {
      const snapshot1 = {
        id: 'snap1',
        rollbackPointId: 'point1',
        type: SnapshotType.ENTITY,
        data: { entities: [{ id: '1', name: 'Entity A' }] },
        size: 100,
        createdAt: new Date()
      };

      const snapshot2 = {
        id: 'snap2',
        rollbackPointId: 'point2',
        type: SnapshotType.ENTITY,
        data: { entities: [{ id: '1', name: 'Entity B' }] },
        size: 100,
        createdAt: new Date()
      };

      const diff = await engine.generateSnapshotDiff(snapshot1, snapshot2);

      expect(diff.from).toBe('point1');
      expect(diff.to).toBe('point2');
      expect(diff.changes.length).toBeGreaterThan(0);
      expect(diff.changeCount).toBe(diff.changes.length);
    });

    it('should throw error for snapshots of different types', async () => {
      const snapshot1 = {
        id: 'snap1',
        rollbackPointId: 'point1',
        type: SnapshotType.ENTITY,
        data: {},
        size: 100,
        createdAt: new Date()
      };

      const snapshot2 = {
        id: 'snap2',
        rollbackPointId: 'point2',
        type: SnapshotType.RELATIONSHIP,
        data: {},
        size: 100,
        createdAt: new Date()
      };

      await expect(
        engine.generateSnapshotDiff(snapshot1, snapshot2)
      ).rejects.toThrow('Cannot diff snapshots of different types');
    });
  });

  describe('applyDiff', () => {
    it('should apply create operations', async () => {
      const source = { a: 1 };
      const diff = [
        {
          path: 'b',
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: 2
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(source).toEqual({ a: 1 }); // Original should be unchanged
    });

    it('should apply update operations', async () => {
      const source = { a: 1, b: 2 };
      const diff = [
        {
          path: 'b',
          operation: DiffOperation.UPDATE,
          oldValue: 2,
          newValue: 3
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result).toEqual({ a: 1, b: 3 });
    });

    it('should apply delete operations', async () => {
      const source = { a: 1, b: 2 };
      const diff = [
        {
          path: 'b',
          operation: DiffOperation.DELETE,
          oldValue: 2,
          newValue: undefined
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result).toEqual({ a: 1 });
      // Avoid calling hasOwnProperty directly on the object under test
      expect(Object.hasOwn(result, 'b')).toBe(false);
    });

    it('should apply operations in correct order', async () => {
      const source = { a: 1, b: 2 };
      const diff = [
        {
          path: 'b',
          operation: DiffOperation.DELETE,
          oldValue: 2,
          newValue: undefined
        },
        {
          path: 'c',
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: 3
        },
        {
          path: 'a',
          operation: DiffOperation.UPDATE,
          oldValue: 1,
          newValue: 10
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result).toEqual({ a: 10, c: 3 });
    });

    it('should handle nested paths', async () => {
      const source = { user: { profile: { name: 'John' } } };
      const diff = [
        {
          path: 'user.profile.name',
          operation: DiffOperation.UPDATE,
          oldValue: 'John',
          newValue: 'Jane'
        },
        {
          path: 'user.profile.age',
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: 30
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result.user.profile.name).toBe('Jane');
      expect(result.user.profile.age).toBe(30);
    });

    it('should handle array paths', async () => {
      const source = { items: ['a', 'b', 'c'] };
      const diff = [
        {
          path: 'items[1]',
          operation: DiffOperation.UPDATE,
          oldValue: 'b',
          newValue: 'B'
        },
        {
          path: 'items[3]',
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: 'd'
        }
      ];

      const result = await engine.applyDiff(source, diff);

      expect(result.items[1]).toBe('B');
      expect(result.items[3]).toBe('d');
    });
  });

  describe('deepEquals', () => {
    it('should return true for identical primitives', () => {
      expect(engine.deepEquals(1, 1)).toBe(true);
      expect(engine.deepEquals('test', 'test')).toBe(true);
      expect(engine.deepEquals(true, true)).toBe(true);
      expect(engine.deepEquals(null, null)).toBe(true);
      expect(engine.deepEquals(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(engine.deepEquals(1, 2)).toBe(false);
      expect(engine.deepEquals('test', 'other')).toBe(false);
      expect(engine.deepEquals(true, false)).toBe(false);
      expect(engine.deepEquals(null, undefined)).toBe(false);
    });

    it('should compare objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(engine.deepEquals(obj1, obj2)).toBe(true);
      expect(engine.deepEquals(obj1, obj3)).toBe(false);
    });

    it('should compare arrays deeply', () => {
      const arr1 = [1, [2, 3], 4];
      const arr2 = [1, [2, 3], 4];
      const arr3 = [1, [2, 4], 4];

      expect(engine.deepEquals(arr1, arr2)).toBe(true);
      expect(engine.deepEquals(arr1, arr3)).toBe(false);
    });

    it('should compare dates', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(engine.deepEquals(date1, date2)).toBe(true);
      expect(engine.deepEquals(date1, date3)).toBe(false);
    });
  });

  describe('summarizeDiff', () => {
    it('should provide summary statistics', async () => {
      const diff = {
        from: 'point1',
        to: 'point2',
        changes: [
          { path: 'a', operation: DiffOperation.CREATE, oldValue: undefined, newValue: 1 },
          { path: 'b', operation: DiffOperation.UPDATE, oldValue: 1, newValue: 2 },
          { path: 'c', operation: DiffOperation.DELETE, oldValue: 3, newValue: undefined },
          { path: 'd.nested', operation: DiffOperation.UPDATE, oldValue: 4, newValue: 5 }
        ],
        changeCount: 4,
        generatedAt: new Date()
      };

      const summary = engine.summarizeDiff(diff);

      expect(summary.totalChanges).toBe(4);
      expect(summary.changesByOperation[DiffOperation.CREATE]).toBe(1);
      expect(summary.changesByOperation[DiffOperation.UPDATE]).toBe(2);
      expect(summary.changesByOperation[DiffOperation.DELETE]).toBe(1);
      expect(summary.changesByOperation[DiffOperation.MOVE]).toBe(0);
      expect(summary.affectedPaths).toContain('a');
      expect(summary.affectedPaths).toContain('b');
      expect(summary.affectedPaths).toContain('c');
      expect(summary.affectedPaths).toContain('d');
      expect(summary.estimatedComplexity).toBe('low');
    });

    it('should classify complexity levels correctly', async () => {
      const createDiff = (changeCount: number) => ({
        from: 'point1',
        to: 'point2',
        changes: Array(changeCount).fill(null).map((_, i) => ({
          path: `field${i}`,
          operation: DiffOperation.UPDATE,
          oldValue: i,
          newValue: i + 1
        })),
        changeCount,
        generatedAt: new Date()
      });

      expect(engine.summarizeDiff(createDiff(5)).estimatedComplexity).toBe('low');
      expect(engine.summarizeDiff(createDiff(50)).estimatedComplexity).toBe('medium');
      expect(engine.summarizeDiff(createDiff(150)).estimatedComplexity).toBe('high');
    });
  });
});
