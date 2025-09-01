/**
 * File and Directory Entity Tests
 * Tests for File and Directory entity types and related functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  File,
  Directory,
  isFile,
  isDirectory,
} from '../src/models/entities.js';

describe('File and Directory Entities', () => {
  describe('File Entity', () => {
    it('should create a valid File entity', () => {
      const file: File = {
        id: 'file_1',
        type: 'file',
        path: '/src/components/Button.tsx',
        hash: 'abc123def456',
        language: 'typescript',
        size: 2048,
        lines: 45,
        extension: '.tsx',
        isTest: false,
        isConfig: false,
        dependencies: ['React', 'ButtonProps'],
        lastModified: new Date('2024-01-15T10:30:00Z'),
        created: new Date('2024-01-10T09:00:00Z')
      };

      expect(file.type).toBe('file');
      expect(file.language).toBe('typescript');
      expect(file.extension).toBe('.tsx');
      expect(file.isTest).toBe(false);
      expect(file.isConfig).toBe(false);
      expect(file.size).toBe(2048);
      expect(file.lines).toBe(45);
    });

    it('should support test files', () => {
      const testFile: File = {
        id: 'test_file_1',
        type: 'file',
        path: '/src/components/Button.test.tsx',
        hash: 'test123',
        language: 'typescript',
        size: 1024,
        lines: 25,
        extension: '.test.tsx',
        isTest: true,
        isConfig: false,
        dependencies: ['React', 'render', 'Button'],
        lastModified: new Date(),
        created: new Date()
      };

      expect(testFile.isTest).toBe(true);
      expect(testFile.path).toContain('.test.');
    });

    it('should support configuration files', () => {
      const configFile: File = {
        id: 'config_file_1',
        type: 'file',
        path: '/webpack.config.js',
        hash: 'config456',
        language: 'javascript',
        size: 512,
        lines: 30,
        extension: '.js',
        isTest: false,
        isConfig: true,
        dependencies: ['webpack', 'path'],
        lastModified: new Date(),
        created: new Date()
      };

      expect(configFile.isConfig).toBe(true);
      expect(configFile.language).toBe('javascript');
    });

    it('should support different file extensions', () => {
      const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp'];

      extensions.forEach(ext => {
        const file: File = {
          id: `file_${ext}`,
          type: 'file',
          path: `/src/file${ext}`,
          hash: 'hash123',
          language: ext.replace('.', ''),
          size: 100,
          lines: 10,
          extension: ext,
          isTest: false,
          isConfig: false,
          dependencies: [],
          lastModified: new Date(),
          created: new Date()
        };

        expect(file.extension).toBe(ext);
      });
    });

    it('should track file dependencies', () => {
      const file: File = {
        id: 'dependent_file',
        type: 'file',
        path: '/src/service.ts',
        hash: 'dep123',
        language: 'typescript',
        size: 1500,
        lines: 60,
        extension: '.ts',
        isTest: false,
        isConfig: false,
        dependencies: ['DatabaseService', 'Logger', 'UserModel'],
        lastModified: new Date(),
        created: new Date()
      };

      expect(file.dependencies).toHaveLength(3);
      expect(file.dependencies).toContain('DatabaseService');
      expect(file.dependencies).toContain('Logger');
      expect(file.dependencies).toContain('UserModel');
    });
  });

  describe('Directory Entity', () => {
    it('should create a valid Directory entity', () => {
      const directory: Directory = {
        id: 'dir_1',
        type: 'directory',
        path: '/src/components',
        name: 'components',
        children: ['Button.tsx', 'Input.tsx', 'Modal.tsx'],
        fileCount: 3,
        directoryCount: 0,
        totalSize: 6144,
        lastModified: new Date('2024-01-15T10:30:00Z'),
        created: new Date('2024-01-10T09:00:00Z')
      };

      expect(directory.type).toBe('directory');
      expect(directory.name).toBe('components');
      expect(directory.children).toHaveLength(3);
      expect(directory.fileCount).toBe(3);
      expect(directory.directoryCount).toBe(0);
      expect(directory.totalSize).toBe(6144);
    });

    it('should support nested directories', () => {
      const nestedDir: Directory = {
        id: 'nested_dir',
        type: 'directory',
        path: '/src/components/forms',
        name: 'forms',
        children: ['LoginForm.tsx', 'RegisterForm.tsx', 'inputs'],
        fileCount: 2,
        directoryCount: 1,
        totalSize: 4096,
        lastModified: new Date(),
        created: new Date()
      };

      expect(nestedDir.directoryCount).toBe(1);
      expect(nestedDir.children).toContain('inputs');
    });

    it('should track directory statistics', () => {
      const statsDir: Directory = {
        id: 'stats_dir',
        type: 'directory',
        path: '/src/utils',
        name: 'utils',
        children: ['helpers.ts', 'constants.ts', 'types.ts', 'validation'],
        fileCount: 3,
        directoryCount: 1,
        totalSize: 8192,
        lastModified: new Date(),
        created: new Date()
      };

      expect(statsDir.fileCount).toBe(3);
      expect(statsDir.directoryCount).toBe(1);
      expect(statsDir.children).toHaveLength(4);
      expect(statsDir.totalSize).toBe(8192);
    });
  });

  describe('Type Guards', () => {
    it('should identify file entities', () => {
      const file: File = {
        id: 'file_1',
        type: 'file',
        path: '/test.ts',
        hash: 'hash123',
        language: 'typescript',
        size: 100,
        lines: 10,
        extension: '.ts',
        isTest: false,
        isConfig: false,
        dependencies: [],
        lastModified: new Date(),
        created: new Date()
      };

      expect(isFile(file)).toBe(true);
      expect(isDirectory(file)).toBe(false);
    });

    it('should identify directory entities', () => {
      const directory: Directory = {
        id: 'dir_1',
        type: 'directory',
        path: '/src',
        name: 'src',
        children: ['index.ts'],
        fileCount: 1,
        directoryCount: 0,
        totalSize: 100,
        lastModified: new Date(),
        created: new Date()
      };

      expect(isDirectory(directory)).toBe(true);
      expect(isFile(directory)).toBe(false);
    });

    it('should handle edge cases', () => {
      const nullEntity = null as any;
      const undefinedEntity = undefined as any;
      const stringEntity = 'not an entity' as any;

      expect(isFile(nullEntity)).toBe(false);
      expect(isFile(undefinedEntity)).toBe(false);
      expect(isFile(stringEntity)).toBe(false);
      expect(isDirectory(nullEntity)).toBe(false);
      expect(isDirectory(undefinedEntity)).toBe(false);
      expect(isDirectory(stringEntity)).toBe(false);
    });
  });

  describe('Entity Relationships', () => {
    it('should link files to their containing directories', () => {
      const directory: Directory = {
        id: 'components_dir',
        type: 'directory',
        path: '/src/components',
        name: 'components',
        children: ['Button.tsx', 'Input.tsx'],
        fileCount: 2,
        directoryCount: 0,
        totalSize: 3072,
        lastModified: new Date(),
        created: new Date()
      };

      const file: File = {
        id: 'button_file',
        type: 'file',
        path: '/src/components/Button.tsx',
        hash: 'button123',
        language: 'typescript',
        size: 1024,
        lines: 30,
        extension: '.tsx',
        isTest: false,
        isConfig: false,
        dependencies: ['React'],
        lastModified: new Date(),
        created: new Date()
      };

      // The file path should indicate it's within the directory
      expect(file.path).toContain(directory.path);
      expect(directory.children).toContain('Button.tsx');
    });

    it('should support different directory structures', () => {
      const structures = [
        { path: '/src', name: 'src' },
        { path: '/src/components', name: 'components' },
        { path: '/src/components/ui', name: 'ui' },
        { path: '/tests', name: 'tests' },
        { path: '/tests/unit', name: 'unit' }
      ];

      structures.forEach(struct => {
        const directory: Directory = {
          id: `dir_${struct.name}`,
          type: 'directory',
          path: struct.path,
          name: struct.name,
          children: [],
          fileCount: 0,
          directoryCount: 0,
          totalSize: 0,
          lastModified: new Date(),
          created: new Date()
        };

        expect(directory.path).toBe(struct.path);
        expect(directory.name).toBe(struct.name);
      });
    });
  });
});
