/**
 * Base Entity Tests
 * Tests for CodebaseEntity interface and basic entity functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  CodebaseEntity,
  Entity,
} from '../src/models/entities.js';

describe('Base Entity Types', () => {
  describe('CodebaseEntity Interface', () => {
    it('should support basic CodebaseEntity properties', () => {
      const entity: CodebaseEntity = {
        id: 'test-entity',
        type: 'file',
        path: '/src/test.ts',
        hash: 'abc123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date()
      };

      expect(entity.id).toBe('test-entity');
      expect(entity.type).toBe('file');
      expect(entity.path).toBe('/src/test.ts');
      expect(entity.hash).toBe('abc123');
      expect(entity.language).toBe('typescript');
      expect(entity.lastModified).toBeInstanceOf(Date);
      expect(entity.created).toBeInstanceOf(Date);
    });

    it('should support different entity types', () => {
      const types = ['file', 'directory', 'symbol', 'module', 'test', 'spec'] as const;

      types.forEach(type => {
        const entity: CodebaseEntity = {
          id: `${type}_entity`,
          type,
          path: `/src/${type}`,
          hash: 'hash123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date()
        };

        expect(entity.type).toBe(type);
      });
    });
  });

  describe('Entity Union Type', () => {
    it('should accept different entity types', () => {
      const entities: Entity[] = [
        {
          id: 'file_1',
          type: 'file' as const,
          path: '/src/file.ts',
          hash: 'file123',
          language: 'typescript',
          size: 100,
          lines: 10,
          extension: '.ts',
          isTest: false,
          isConfig: false,
          dependencies: [],
          lastModified: new Date(),
          created: new Date()
        },
        {
          id: 'dir_1',
          type: 'directory' as const,
          path: '/src',
          name: 'src',
          children: ['file.ts'],
          fileCount: 1,
          directoryCount: 0,
          totalSize: 100,
          lastModified: new Date(),
          created: new Date()
        }
      ];

      expect(entities).toHaveLength(2);
      expect(entities[0].type).toBe('file');
      expect(entities[1].type).toBe('directory');
    });
  });
});
