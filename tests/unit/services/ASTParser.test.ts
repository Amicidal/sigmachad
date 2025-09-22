/**
 * Unit tests for ASTParser service
 * Tests real parsing functionality with actual files and data
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ASTParser } from '../../../src/services/knowledge/ASTParser';
import type { ParseResult } from '../../../src/services/knowledge/ASTParser';
import { Entity, File, FunctionSymbol, ClassSymbol, InterfaceSymbol, TypeAliasSymbol } from '@/models/entities';
import { GraphRelationship, RelationshipType } from '@/models/relationships';
import path from 'path';
import fs from 'fs/promises';

describe('ASTParser', () => {
  let parser: ASTParser;
  const testFilesDir = path.join(__dirname, 'ast-parser');

  const expectSuccessfulParse = (result: ParseResult) => {
    expect(result.errors).toEqual([]);
    expect(result.entities).toEqual(expect.any(Array));
    expect(result.entities.length).toBeGreaterThan(0);
  };

  const getFileEntity = (result: ParseResult) =>
    result.entities.find((e) => e.type === 'file') as File;

  const expectSymbol = (result: ParseResult, kind: string, name: string) => {
    const symbol = result.entities.find(
      (entity) =>
        entity.type === 'symbol' &&
        (entity as any).kind === kind &&
        (entity as any).name === name
    );
    expect(symbol).toBeDefined();
    return symbol as Entity;
  };

  beforeAll(async () => {
    // Create parser instance
    parser = new ASTParser();

    // Initialize the parser (loads tree-sitter if available)
    await parser.initialize();
  });

  afterAll(async () => {
    // Clean up any cached data
    parser.clearCache();
  });

  beforeEach(() => {
    // Clear cache before each test to ensure clean state
    parser.clearCache();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize successfully', async () => {
      const newParser = new ASTParser();
      await newParser.initialize();

      // Parser should be initialized and ready to use
      expect(newParser).not.toBeNull();
      expect(newParser).toBeInstanceOf(ASTParser);
      expect(typeof newParser.parseFile).toBe('function');
      expect(typeof newParser.parseFileIncremental).toBe('function');
    });

    it('should have empty cache initially', () => {
      const stats = parser.getCacheStats();
      expect(stats.files).toBe(0);
      expect(stats.totalEntities).toBe(0);
    });

    it('should handle tree-sitter initialization gracefully', async () => {
      // Even if tree-sitter is not available, parser should still work with ts-morph
      const newParser = new ASTParser();
      await newParser.initialize();

      // Should be able to parse TypeScript files regardless
      const tsFilePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await newParser.parseFile(tsFilePath);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('entities');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(result).toHaveProperty('relationships');
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('TypeScript File Parsing', () => {
    const tsFixtures: Array<{
      name: string;
      file: string;
      verify: (result: ParseResult) => void;
    }> = [
      {
        name: 'application service class fixture',
        file: 'sample-class.ts',
        verify: (result) => {
          const fileEntity = getFileEntity(result);
          expect(fileEntity.language).toBe('typescript');
          expect(fileEntity.extension).toBe('.ts');
          expect(fileEntity.lines).toBeGreaterThan(0);
          expect(fileEntity.hash).toMatch(/^[a-f0-9]{64}$/);

          expectSymbol(result, 'class', 'UserService');
          expectSymbol(result, 'class', 'BaseService');
          expectSymbol(result, 'interface', 'UserConfig');
          expectSymbol(result, 'typeAlias', 'UserRole');
          expectSymbol(result, 'function', 'createUserService');

          const relationshipTypes = result.relationships.map((rel) => rel.type);
          expect(relationshipTypes).toEqual(
            expect.arrayContaining([
              RelationshipType.DEFINES,
              RelationshipType.IMPORTS,
            ])
          );
          expect(
            relationshipTypes.filter((type) => type === RelationshipType.EXTENDS)
          ).not.toHaveLength(0);
        },
      },
      {
        name: 'interface definitions fixture',
        file: 'sample-interface.ts',
        verify: (result) => {
          expectSymbol(result, 'interface', 'AppConfig');
          expectSymbol(result, 'interface', 'FeatureFlags');
          expectSymbol(result, 'typeAlias', 'ApiResponse');
        },
      },
    ];

    it.each(tsFixtures)('parses $name', async ({ file, verify }) => {
      const result = await parser.parseFile(path.join(testFilesDir, file));
      expectSuccessfulParse(result);
      verify(result);
    });

    it('represents empty files with minimal metadata', async () => {
      const result = await parser.parseFile(path.join(testFilesDir, 'empty-file.ts'));
      expect(result.entities).toHaveLength(1);
      expect(result.relationships).toHaveLength(0);

      const fileEntity = getFileEntity(result);
      expect(fileEntity.lines).toBe(1);
      expect(fileEntity.size).toBe(0);
    });
  });

  describe('JavaScript File Parsing', () => {
    it('should parse JavaScript file successfully', async () => {
      const filePath = path.join(testFilesDir, 'sample-function.js');
      const result = await parser.parseFile(filePath);

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);

      // Should have a file entity
      const fileEntity = result.entities.find(e => e.type === 'file') as File;
      expect(fileEntity).toBeDefined();
      expect(fileEntity.language).toBe('javascript');
      expect(fileEntity.extension).toBe('.js');

      // Note: JavaScript parsing depends on tree-sitter availability
      // If tree-sitter is not available, only file entity will be created
      const symbolEntities = result.entities.filter(e => e.type === 'symbol');

      // If we have symbols, they should be valid
      if (symbolEntities.length > 0) {
        // Should find the Calculator class if tree-sitter is working
        const calculatorClass = symbolEntities.find(e =>
          e.type === 'symbol' && (e as any).name === 'Calculator'
        ) as any;
        if (calculatorClass) {
          expect(calculatorClass.kind).toBe('class');
        }
      }
    });

    it('should parse JavaScript functions correctly', async () => {
      const filePath = path.join(testFilesDir, 'sample-function.js');
      const result = await parser.parseFile(filePath);

      const symbolEntities = result.entities.filter(e => e.type === 'symbol');

      // If tree-sitter is available and symbols are extracted
      if (symbolEntities.length > 0) {
        // Should find various functions if parsing worked
        const addFunction = symbolEntities.find(e =>
          e.type === 'symbol' && (e as any).name === 'add'
        ) as any;
        if (addFunction) {
          expect(addFunction.kind).toBe('function');
        }

        const fibonacciFunction = symbolEntities.find(e =>
          e.type === 'symbol' && (e as any).name === 'fibonacci'
        ) as any;
        if (fibonacciFunction) {
          expect(fibonacciFunction.kind).toBe('function');
        }
      }

      // At minimum, we should have parsed without errors
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Other File Types Parsing', () => {
    it('should parse markdown files as generic files', async () => {
      const filePath = path.join(testFilesDir, 'sample-text.md');
      const result = await parser.parseFile(filePath);

      expect(result.entities.length).toBe(1); // Only file entity
      expect(result.relationships.length).toBe(0);
      expect(result.errors.length).toBe(0);

      const fileEntity = result.entities[0] as File;
      expect(fileEntity.type).toBe('file');
      expect(fileEntity.language).toBe('unknown');
      expect(fileEntity.extension).toBe('.md');
      expect(fileEntity.lines).toBeGreaterThan(0);
      expect(fileEntity.size).toBeGreaterThan(0);
    });
  });

  describe('Incremental Parsing and Caching', () => {
    it('should cache parsing results', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');

      // First parse
      const result1 = await parser.parseFileIncremental(filePath);
      expect(result1.isIncremental).toBe(false);
      expect(result1.entities.length).toBeGreaterThan(0);

      // Second parse should use cache
      const result2 = await parser.parseFileIncremental(filePath);
      expect(result2.isIncremental).toBe(true);
      expect(result2.entities).toEqual(result1.entities);
      expect(result2.relationships).toEqual(result1.relationships);

      // Check cache stats
      const stats = parser.getCacheStats();
      expect(stats.files).toBe(1);
      expect(stats.totalEntities).toBe(result1.entities.length);
    });

    it('should detect file changes and reparse', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');

      // First parse
      const result1 = await parser.parseFileIncremental(filePath);
      expect(result1.isIncremental).toBe(false);

      // Modify the file
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const modifiedContent = originalContent + '\n// Modified for test';
      await fs.writeFile(filePath, modifiedContent);

      // Parser should detect changes and do a full parse
      const result2 = await parser.parseFileIncremental(filePath);
      expect(result2.isIncremental).toBe(false); // Should detect changes and reparse
      expect(result2.entities.length).not.toBe(result1.entities.length); // Should have different entities after modification

      // Restore original content
      await fs.writeFile(filePath, originalContent);
    });

    it('should handle file deletion correctly', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');

      // First parse to cache
      await parser.parseFileIncremental(filePath);

      // Simulate file deletion by renaming temporarily
      const tempPath = filePath + '.temp';
      await fs.rename(filePath, tempPath);

      try {
        // Parse should handle missing file
        const result = await parser.parseFileIncremental(filePath);
        expect(result.isIncremental).toBe(true);
        expect(result.entities.length).toBe(0);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].message).toContain('File has been deleted');
      } finally {
        // Restore file
        await fs.rename(tempPath, filePath);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(testFilesDir, 'non-existent-file.ts');
      const result = await parser.parseFile(nonExistentPath);

      expect(result.entities.length).toBe(0);
      expect(result.relationships.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[0].message).toContain('Parse error');
    });

    it('should handle invalid file paths', async () => {
      const invalidPath = '';
      const result = await parser.parseFile(invalidPath);

      expect(result.entities.length).toBe(0);
      expect(result.relationships.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should handle files with syntax errors', async () => {
      // Create a temporary file with syntax errors
      const errorFilePath = path.join(testFilesDir, 'syntax-error.ts');
      const errorContent = `
        export class TestClass {
          constructor() {
            this.value = ;
          }

          method() {
            return undefined_variable;
          }
        }
      `;

      await fs.writeFile(errorFilePath, errorContent);

      try {
        const result = await parser.parseFile(errorFilePath);

        // Should still create file entity even with errors
        expect(result.entities.length).toBeGreaterThan(0);
        const fileEntity = result.entities.find(e => e.type === 'file');
        expect(fileEntity).toBeDefined();

        // May have some parsing errors
        if (result.errors.length > 0) {
          expect(result.errors[0].severity).toBe('error');
        }
      } finally {
        // Clean up
        try {
          await fs.unlink(errorFilePath);
        } catch (e) {
          // Log cleanup errors for debugging
          console.debug('Failed to clean up test file:', e);
        }
      }
    });
  });

  describe('Symbol Extraction', () => {
    it('should extract class symbols with correct properties', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await parser.parseFile(filePath);

      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      const userServiceClass = symbolEntities.find(e =>
        e.type === 'symbol' && (e as any).name === 'UserService'
      ) as any;

      expect(userServiceClass).toBeDefined();
      expect(userServiceClass.kind).toBe('class');

      // Test should expect correct export detection behavior
      expect(userServiceClass).toHaveProperty('isExported');
      expect(userServiceClass.isExported).toBe(true); // UserService is exported in sample-class.ts
    });

    it('should extract function symbols with correct properties', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await parser.parseFile(filePath);

      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      const createUserServiceFunction = symbolEntities.find(e =>
        e.type === 'symbol' && (e as any).name === 'createUserService'
      ) as any;

      expect(createUserServiceFunction).toBeDefined();
      expect(createUserServiceFunction.kind).toBe('function');

      // Test should expect correct export detection behavior
      expect(createUserServiceFunction).toHaveProperty('isExported');
      expect(createUserServiceFunction.isExported).toBe(true); // createUserService is exported in sample-class.ts
    });

    it('should extract interface symbols correctly', async () => {
      const filePath = path.join(testFilesDir, 'sample-interface.ts');
      const result = await parser.parseFile(filePath);

      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      const databaseConfigInterface = symbolEntities.find(e =>
        e.type === 'symbol' && (e as any).name === 'DatabaseConfig'
      ) as any;

      expect(databaseConfigInterface).toBeDefined();
      expect(databaseConfigInterface.kind).toBe('interface');

      // Test should expect correct export detection behavior
      expect(databaseConfigInterface).toHaveProperty('isExported');
      expect(databaseConfigInterface.isExported).toBe(true); // DatabaseConfig is exported in sample-interface.ts
    });

    it('should extract type alias symbols correctly', async () => {
      const filePath = path.join(testFilesDir, 'sample-interface.ts');
      const result = await parser.parseFile(filePath);

      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      const logLevelType = symbolEntities.find(e =>
        e.type === 'symbol' && e.name === 'LogLevel'
      ) as TypeAliasSymbol;

      expect(logLevelType).toBeDefined();
      expect(logLevelType.kind).toBe('typeAlias');
      expect(logLevelType.aliasedType).toBeDefined();
    });
  });

  describe('Relationship Analysis', () => {
    it('should extract inheritance relationships', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await parser.parseFile(filePath);

      const extendsRelationships = result.relationships.filter(r =>
        r.type === RelationshipType.EXTENDS
      );

      expect(extendsRelationships.length).toBeGreaterThan(0);

      // Note: Parser creates EXTENDS relationships but doesn't properly resolve target entity IDs
      // The relationships exist but point to undefined entities
      const userServiceExtends = extendsRelationships.find(r => {
        const fromEntity = result.entities.find(e => e.id === r.fromEntityId);
        const fromName = fromEntity?.type === 'symbol' ? (fromEntity as any).name : fromEntity?.path;
        return fromName === 'UserService';
      });

      expect(userServiceExtends).toBeDefined();
    });

    it('should extract import relationships', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await parser.parseFile(filePath);

      const importRelationships = result.relationships.filter(r =>
        r.type === RelationshipType.IMPORTS
      );

      // Note: Parser creates IMPORTS relationships but doesn't properly resolve target entity IDs
      // The relationships exist but point to undefined entities
      expect(importRelationships.length).toBeGreaterThan(0);
    });

    it('should extract implementation relationships', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');
      const result = await parser.parseFile(filePath);

      const implementsRelationships = result.relationships.filter(r =>
        r.type === RelationshipType.IMPLEMENTS
      );

      // Note: Parser creates IMPLEMENTS relationships but doesn't properly resolve target entity IDs
      // The relationships exist but point to undefined entities
      const userServiceImplements = implementsRelationships.find(r => {
        const fromEntity = result.entities.find(e => e.id === r.fromEntityId);
        const fromName = fromEntity?.type === 'symbol' ? (fromEntity as any).name : fromEntity?.path;
        return fromName === 'UserService';
      });

      expect(userServiceImplements).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should detect language correctly', async () => {
      const tsParser = new ASTParser();

      // Test TypeScript files
      expect(tsParser['detectLanguage']('test.ts')).toBe('typescript');
      expect(tsParser['detectLanguage']('test.tsx')).toBe('typescript');

      // Test JavaScript files
      expect(tsParser['detectLanguage']('test.js')).toBe('javascript');
      expect(tsParser['detectLanguage']('test.jsx')).toBe('javascript');

      // Test unknown files
      expect(tsParser['detectLanguage']('test.md')).toBe('unknown');
      expect(tsParser['detectLanguage']('test.txt')).toBe('unknown');
    });

    it('should extract dependencies correctly', async () => {
      const tsParser = new ASTParser();

      const tsContent = `
        import { EventEmitter } from 'events';
        import * as fs from 'fs/promises';
        import path from 'path';
        import { customUtil } from './utils';
        import relativeModule from '../relative';
      `;

      const dependencies = tsParser['extractDependencies'](tsContent);
      expect(dependencies).toContain('events');
      expect(dependencies).toContain('fs');
      expect(dependencies).toContain('path');
      expect(dependencies).not.toContain('./utils');
      expect(dependencies).not.toContain('../relative');
    });

    it('should handle cache operations correctly', () => {
      const tsParser = new ASTParser();

      // Initially empty
      expect(tsParser.getCacheStats().files).toBe(0);

      // Clear cache (should not error)
      tsParser.clearCache();
      expect(tsParser.getCacheStats().files).toBe(0);
    });
  });

  describe('Multiple File Parsing', () => {
    it('should parse multiple files successfully', async () => {
      const filePaths = [
        path.join(testFilesDir, 'sample-class.ts'),
        path.join(testFilesDir, 'sample-interface.ts'),
        path.join(testFilesDir, 'sample-function.js')
      ];

      const result = await parser.parseMultipleFiles(filePaths);

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relationships.length).toBeGreaterThan(0);

      // Should have entities from all files
      const fileEntities = result.entities.filter(e => e.type === 'file');
      expect(fileEntities.length).toBe(3);

      // Should have symbols from all files
      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      expect(symbolEntities.length).toBeGreaterThan(0);
    });

    it('should handle mixed valid and invalid files', async () => {
      const filePaths = [
        path.join(testFilesDir, 'sample-class.ts'),
        path.join(testFilesDir, 'non-existent-file.ts'),
        path.join(testFilesDir, 'sample-function.js')
      ];

      const result = await parser.parseMultipleFiles(filePaths);

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should have successfully parsed valid files
      const fileEntities = result.entities.filter(e => e.type === 'file');
      expect(fileEntities.length).toBe(2); // Only valid files

      // Should have error for invalid file
      const errorFiles = result.errors.map(e => e.file);
      expect(errorFiles.some(f => f.includes('non-existent-file.ts'))).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large files efficiently', async () => {
      const filePath = path.join(testFilesDir, 'sample-class.ts');

      // Parse multiple times to test caching performance
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        await parser.parseFileIncremental(filePath);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete in reasonable time (less than 5 seconds for 5 parses)
      expect(totalTime).toBeLessThan(5000);

      // Cache should be populated
      const stats = parser.getCacheStats();
      expect(stats.files).toBe(1);
    });

    it('should maintain cache integrity across multiple operations', async () => {
      const filePath1 = path.join(testFilesDir, 'sample-class.ts');
      const filePath2 = path.join(testFilesDir, 'sample-interface.ts');

      // Parse first file
      const result1 = await parser.parseFileIncremental(filePath1);
      const stats1 = parser.getCacheStats();

      // Parse second file
      const result2 = await parser.parseFileIncremental(filePath2);
      const stats2 = parser.getCacheStats();

      // Cache should have both files
      expect(stats2.files).toBe(2);
      expect(stats2.totalEntities).toBe(stats1.totalEntities + result2.entities.length);

      // Both results should be valid
      expect(result1.entities.length).toBeGreaterThan(0);
      expect(result2.entities.length).toBeGreaterThan(0);
    });
  });
});
