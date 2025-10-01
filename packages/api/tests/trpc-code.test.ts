/**
 * Unit tests for TRPC Code Analysis Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { codeRouter } from '../src/routes/trpc-code.js';
import { createTestContext } from '../src/trpc/base.js';
import { createMockASTParser } from './mock-factories.js';

describe('TRPC Code Router', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createTestContext({
      astParser: createMockASTParser(),
    });
  });

  describe('analyze procedure', () => {
    it('should analyze a file successfully', async () => {
      const mockResult = {
        entities: [
          { type: 'symbol', kind: 'function', name: 'testFunction', isExported: true },
          { type: 'symbol', kind: 'class', name: 'TestClass', isExported: false },
        ],
        relationships: [
          { type: 'calls', fromEntityId: 'fn1', toEntityId: 'fn2' },
        ],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.analyze({
        file: '/test/file.ts',
        types: ['function', 'class'],
      });

      expect(result).toMatchObject({
        file: '/test/file.ts',
        entities: mockResult.entities,
        relationships: mockResult.relationships,
        symbols: expect.arrayContaining([
          expect.objectContaining({ type: 'symbol', kind: 'function' }),
          expect.objectContaining({ type: 'symbol', kind: 'class' }),
        ]),
        metrics: {
          complexity: 2,
          dependencies: 1,
          exports: 1,
        },
        suggestions: expect.any(Array),
      });

      expect(mockContext.astParser.parseFile).toHaveBeenCalledWith('/test/file.ts');
    });

    it('should provide suggestions based on complexity', async () => {
      const mockResult = {
        entities: new Array(60).fill(0).map((_, i) => ({
          type: 'symbol',
          kind: 'function',
          name: `fn${i}`
        })),
        relationships: new Array(25).fill(0).map((_, i) => ({
          type: 'calls',
          fromEntityId: `fn${i}`,
          toEntityId: `fn${i+1}`
        })),
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.analyze({ file: '/complex/file.ts' });

      expect(result.suggestions).toContain('Consider splitting this file - it has high complexity');
      expect(result.suggestions).toContain('Consider reducing dependencies for better maintainability');
    });

    it('should handle parse errors gracefully', async () => {
      mockContext.astParser.parseFile.mockRejectedValue(new Error('Parse failed'));

      const caller = codeRouter.createCaller(mockContext);

      await expect(caller.analyze({ file: '/invalid/file.ts' }))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('refactor procedure', () => {
    it('should provide extract-function suggestions', async () => {
      const mockResult = {
        entities: [
          { type: 'symbol', kind: 'function', name: 'complexFunction' },
        ],
        relationships: [],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.refactor({
        files: ['/test/file.ts'],
        refactorType: 'extract-function',
      });

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          file: '/test/file.ts',
          type: 'extract-function',
          impact: 'medium',
        })
      );
    });

    it('should provide split-module suggestions for large files', async () => {
      const mockResult = {
        entities: new Array(40).fill(0).map((_, i) => ({
          type: 'symbol',
          name: `entity${i}`
        })),
        relationships: [],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.refactor({
        files: ['/large/file.ts'],
        refactorType: 'split-module',
      });

      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          file: '/large/file.ts',
          type: 'split-module',
          impact: 'high',
        })
      );
    });

    it('should handle multiple files', async () => {
      mockContext.astParser.parseFile.mockResolvedValue({
        entities: [{ type: 'symbol', name: 'test' }],
        relationships: [],
      });

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.refactor({
        files: ['/file1.ts', '/file2.ts'],
        refactorType: 'remove-duplication',
      });

      expect(result.suggestions).toHaveLength(2);
      expect(mockContext.astParser.parseFile).toHaveBeenCalledTimes(2);
    });

    it('should handle file parse errors gracefully', async () => {
      mockContext.astParser.parseFile
        .mockResolvedValueOnce({ entities: [], relationships: [] })
        .mockRejectedValueOnce(new Error('Parse failed'));

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.refactor({
        files: ['/valid/file.ts', '/invalid/file.ts'],
        refactorType: 'general',
      });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[1]).toMatchObject({
        file: '/invalid/file.ts',
        type: 'error',
        impact: 'low',
      });
    });
  });

  describe('parseFile procedure', () => {
    it('should parse a file and return result', async () => {
      const mockResult = {
        entities: [{ type: 'symbol', name: 'test' }],
        relationships: [],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.parseFile({ filePath: '/test/file.ts' });

      expect(result).toEqual(mockResult);
      expect(mockContext.astParser.parseFile).toHaveBeenCalledWith('/test/file.ts');
    });
  });

  describe('getSymbols procedure', () => {
    it('should filter symbols by type', async () => {
      const mockResult = {
        entities: [
          { type: 'symbol', kind: 'function', name: 'testFunction' },
          { type: 'symbol', kind: 'class', name: 'TestClass' },
          { type: 'file', name: 'test.ts' },
        ],
        relationships: [],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.getSymbols({
        filePath: '/test/file.ts',
        symbolType: 'function',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'symbol',
        kind: 'function',
        name: 'testFunction',
      });
    });

    it('should return all symbols when no type filter is provided', async () => {
      const mockResult = {
        entities: [
          { type: 'symbol', kind: 'function', name: 'testFunction' },
          { type: 'symbol', kind: 'class', name: 'TestClass' },
          { type: 'file', name: 'test.ts' },
        ],
        relationships: [],
      };

      mockContext.astParser.parseFile.mockResolvedValue(mockResult);

      const caller = codeRouter.createCaller(mockContext);
      const result = await caller.getSymbols({ filePath: '/test/file.ts' });

      expect(result).toHaveLength(2); // Only symbols, not files
    });
  });
});
