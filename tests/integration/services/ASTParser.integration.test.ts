/**
 * Integration tests for ASTParser service
 * Tests real file parsing, caching, and incremental parsing capabilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ASTParser, ParseResult, IncrementalParseResult } from '../../../src/services/ASTParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ASTParser Integration', () => {
  let parser: ASTParser;
  let testDir: string;

  beforeAll(async () => {
    parser = new ASTParser();
    await parser.initialize();

    // Create a temporary directory for test files
    testDir = path.join(tmpdir(), 'ast-parser-integration-tests');
    await fs.mkdir(testDir, { recursive: true });
  }, 10000);

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    parser.clearCache();

    // Clean up any existing test files
    try {
      const files = await fs.readdir(testDir);
      await Promise.all(files.map(file => fs.unlink(path.join(testDir, file))));
    } catch (error) {
      // Directory might not exist yet, that's okay
    }
  });

  describe('File Parsing Integration', () => {
    it('should parse a complete TypeScript class file successfully', async () => {
      const tsFilePath = path.join(testDir, 'test-class.ts');
      const tsContent = `
        import { Component } from '@angular/core';
        import { Injectable } from '@angular/core';

        /**
         * Test service for integration testing
         */
        @Injectable({
          providedIn: 'root'
        })
        export class TestService {
          private data: string[] = [];

          constructor() {
            this.initializeData();
          }

          /**
           * Initialize test data
           */
          private initializeData(): void {
            this.data = ['test1', 'test2', 'test3'];
          }

          /**
           * Get all data
           */
          public getAllData(): string[] {
            return [...this.data];
          }

          /**
           * Add new data item
           */
          public addData(item: string): void {
            this.data.push(item);
          }

          /**
           * Get data count
           */
          public getCount(): number {
            return this.data.length;
          }
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(tsFilePath);

      // Tighten existence-only assertions with concrete type/shape checks
      expect(result.entities).toEqual(expect.any(Array));
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relationships).toEqual(expect.any(Array));
      expect(result.errors).toEqual(expect.any(Array));
      expect(result.errors.length).toBe(0); // Should parse without errors

      // Verify file entity
      const fileEntity = result.entities.find(e => e.type === 'file');
      expect(fileEntity).toEqual(expect.any(Object));
      expect(fileEntity?.path).toContain('test-class.ts');
      expect(fileEntity?.language).toBe('typescript');

      // Verify class entity
      const classEntity = result.entities.find(e =>
        e.type === 'symbol' && (e as any).kind === 'class'
      );
      expect(classEntity).toEqual(expect.any(Object));
      expect((classEntity as any).name).toBe('TestService');
      expect((classEntity as any).isExported).toBe(true);

      // Verify method entities
      const methods = result.entities.filter(e =>
        e.type === 'symbol' && (e as any).kind === 'function'
      );
      expect(methods.length).toBeGreaterThan(0);

      const methodNames = methods.map(m => (m as any).name);
      expect(methodNames).toContain('getAllData');
      expect(methodNames).toContain('addData');
      expect(methodNames).toContain('getCount');

      // Verify relationships
      const definesRelationships = result.relationships.filter(r => r.type === 'DEFINES');
      expect(definesRelationships.length).toBeGreaterThan(0);
    });

    it('should parse a TypeScript interface file successfully', async () => {
      const tsFilePath = path.join(testDir, 'test-interface.ts');
      const tsContent = `
        import { Observable } from 'rxjs';

        /**
         * Configuration interface for the application
         */
        export interface AppConfig {
          apiUrl: string;
          timeout: number;
          retryAttempts: number;
          features: FeatureFlags;
        }

        /**
         * Feature flags interface
         */
        export interface FeatureFlags {
          enableLogging: boolean;
          enableMetrics: boolean;
          enableCache: boolean;
        }

        /**
         * Service interface
         */
        export interface DataService {
          getData(): Observable<any[]>;
          saveData(data: any): Promise<void>;
          deleteData(id: string): Observable<boolean>;
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(tsFilePath);

      expect(result.entities).toEqual(expect.any(Array));
      expect(result.errors.length).toBe(0);

      // Verify interfaces are parsed
      const interfaces = result.entities.filter(e =>
        e.type === 'symbol' && (e as any).kind === 'interface'
      );
      expect(interfaces.length).toBe(3);

      const interfaceNames = interfaces.map(i => (i as any).name);
      expect(interfaceNames).toContain('AppConfig');
      expect(interfaceNames).toContain('FeatureFlags');
      expect(interfaceNames).toContain('DataService');
    });

    it('should parse JavaScript files when tree-sitter is available', async () => {
      const jsFilePath = path.join(testDir, 'test-module.js');
      const jsContent = `
        const express = require('express');
        const fs = require('fs').promises;

        /**
         * Simple Express server
         */
        class Server {
          constructor(port = 3000) {
            this.port = port;
            this.app = express();
            this.setupRoutes();
          }

          setupRoutes() {
            this.app.get('/', (req, res) => {
              res.json({ message: 'Hello World' });
            });

            this.app.get('/health', (req, res) => {
              res.json({ status: 'ok' });
            });
          }

          start() {
            return new Promise((resolve) => {
              this.server = this.app.listen(this.port, () => {
                console.log(\`Server running on port \${this.port}\`);
                resolve();
              });
            });
          }

          stop() {
            if (this.server) {
              this.server.close();
            }
          }
        }

        module.exports = { Server };
      `;

      await fs.writeFile(jsFilePath, jsContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(jsFilePath);

      expect(result.entities).toEqual(expect.any(Array));

      // Verify file entity
      const fileEntity = result.entities.find(e => e.type === 'file');
      expect(fileEntity).toEqual(expect.any(Object));
      expect(fileEntity?.language).toBe('javascript');

      // Note: JavaScript parsing might fall back to basic file parsing if tree-sitter is not available
      // The important thing is that it doesn't crash and returns a valid result
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidFilePath = path.join(testDir, 'invalid-syntax.ts');
      const invalidContent = `
        export class InvalidClass {
          constructor() {
            // Missing closing brace
            this.property = "test";
          // Missing closing brace for class
      `;

      await fs.writeFile(invalidFilePath, invalidContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(invalidFilePath);

      // Should return a result even with syntax errors
      expect(result).toEqual(
        expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
          errors: expect.any(Array),
        })
      );

      // Should still create a file entity
      const fileEntity = result.entities.find(e => e.type === 'file');
      expect(fileEntity).toEqual(expect.any(Object));
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(testDir, 'does-not-exist.ts');

      await expect(parser.parseFile(nonExistentPath)).rejects.toThrow();
    });
  });

  describe('Incremental Parsing Integration', () => {
    it('should perform incremental parsing on unchanged files', async () => {
      const tsFilePath = path.join(testDir, 'incremental-test.ts');
      const tsContent = `
        export class TestClass {
          public method1(): string {
            return "test";
          }
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');

      // First parse
      const firstResult: IncrementalParseResult = await parser.parseFileIncremental(tsFilePath);
      expect(firstResult.isIncremental).toBe(false);
      expect(firstResult.addedEntities.length).toBeGreaterThan(0);

      // Second parse (should be incremental with no changes)
      const secondResult: IncrementalParseResult = await parser.parseFileIncremental(tsFilePath);
      expect(secondResult.isIncremental).toBe(true);
      expect(secondResult.addedEntities.length).toBe(0);
      expect(secondResult.removedEntities.length).toBe(0);
      expect(secondResult.updatedEntities.length).toBe(0);
    });

    it('should detect changes in incrementally parsed files', async () => {
      const tsFilePath = path.join(testDir, 'change-detection.ts');
      const originalContent = `
        export class ChangeDetection {
          public method1(): string {
            return "original";
          }
        }
      `;

      await fs.writeFile(tsFilePath, originalContent, 'utf-8');

      // First parse
      await parser.parseFileIncremental(tsFilePath);

      // Modify file
      const modifiedContent = `
        export class ChangeDetection {
          public method1(): string {
            return "modified";
          }

          public method2(): number {
            return 42;
          }
        }
      `;

      await fs.writeFile(tsFilePath, modifiedContent, 'utf-8');

      // Incremental parse should detect changes
      const incrementalResult: IncrementalParseResult = await parser.parseFileIncremental(tsFilePath);
      expect(incrementalResult.isIncremental).toBe(true);

      // Should have some changes (either added, removed, or updated entities)
      const totalChanges = incrementalResult.addedEntities.length +
                          incrementalResult.removedEntities.length +
                          incrementalResult.updatedEntities.length;
      expect(totalChanges).toBeGreaterThan(0);
    });

    it('should handle file deletion in incremental parsing', async () => {
      const tsFilePath = path.join(testDir, 'deletion-test.ts');
      const tsContent = `
        export class DeletionTest {
          public testMethod(): void {
            console.log("test");
          }
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');

      // First parse
      await parser.parseFileIncremental(tsFilePath);

      // Delete file
      await fs.unlink(tsFilePath);

      // Incremental parse should handle deletion
      const result: IncrementalParseResult = await parser.parseFileIncremental(tsFilePath);
      expect(result.isIncremental).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('deleted');
    });
  });

  describe('Cache Management Integration', () => {
    it('should maintain and utilize file cache effectively', async () => {
      const tsFilePath = path.join(testDir, 'cache-test.ts');
      const tsContent = `
        export interface CacheTest {
          id: string;
          name: string;
        }

        export class CacheService {
          private data: CacheTest[] = [];

          public add(item: CacheTest): void {
            this.data.push(item);
          }

          public getAll(): CacheTest[] {
            return [...this.data];
          }
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');

      // Parse file multiple times
      await parser.parseFile(tsFilePath);
      await parser.parseFile(tsFilePath);
      await parser.parseFile(tsFilePath);

      // Check cache stats
      const stats = parser.getCacheStats();
      expect(stats.files).toBeGreaterThanOrEqual(1);
      expect(stats.totalEntities).toBeGreaterThan(0);
    });

    it('should clear cache when requested', async () => {
      const tsFilePath = path.join(testDir, 'clear-cache-test.ts');
      const tsContent = `
        export class ClearCacheTest {
          public test(): string {
            return "cached";
          }
        }
      `;

      await fs.writeFile(tsFilePath, tsContent, 'utf-8');

      // Parse and cache
      await parser.parseFile(tsFilePath);
      let stats = parser.getCacheStats();
      expect(stats.files).toBeGreaterThan(0);

      // Clear cache
      parser.clearCache();
      stats = parser.getCacheStats();
      expect(stats.files).toBe(0);
      expect(stats.totalEntities).toBe(0);
    });
  });

  describe('Multiple File Parsing Integration', () => {
    it('should parse multiple files concurrently', async () => {
      const files = [
        {
          name: 'multi1.ts',
          content: `
            export class MultiClass1 {
              public method(): string {
                return "multi1";
              }
            }
          `
        },
        {
          name: 'multi2.ts',
          content: `
            export interface MultiInterface2 {
              id: string;
              data: any;
            }
          `
        },
        {
          name: 'multi3.js',
          content: `
            class MultiClass3 {
              constructor() {
                this.value = "multi3";
              }
            }

            module.exports = { MultiClass3 };
          `
        }
      ];

      // Create files
      const filePaths: string[] = [];
      for (const file of files) {
        const filePath = path.join(testDir, file.name);
        await fs.writeFile(filePath, file.content, 'utf-8');
        filePaths.push(filePath);
      }

      // Parse multiple files
      const results: ParseResult[] = await parser.parseMultipleFiles(filePaths);

      expect(results).toEqual(expect.any(Array));
      expect(results.length).toBe(3);

      // Each result should have entities
      results.forEach(result => {
        expect(result.entities.length).toBeGreaterThan(0);
        expect(result.entities.some(e => e.type === 'file')).toBe(true);
      });
    });

    it('should handle mixed success and failure in multiple file parsing', async () => {
      const files = [
        {
          name: 'valid.ts',
          content: 'export class ValidClass {}'
        },
        {
          name: 'invalid.ts',
          content: 'export class InvalidClass { // missing closing brace'
        },
        {
          name: 'another-valid.ts',
          content: 'export interface ValidInterface {}'
        }
      ];

      const filePaths: string[] = [];
      for (const file of files) {
        const filePath = path.join(testDir, file.name);
        await fs.writeFile(filePath, file.content, 'utf-8');
        filePaths.push(filePath);
      }

      // Parse multiple files
      const results: ParseResult[] = await parser.parseMultipleFiles(filePaths);

      expect(results).toEqual(expect.any(Array));
      expect(results.length).toBe(3);

      // At least the valid files should have entities
      const validResults = results.filter(r => r.errors.length === 0);
      expect(validResults.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle parsing large files efficiently', async () => {
      const largeFilePath = path.join(testDir, 'large-file.ts');

      // Create a large TypeScript file with many classes and methods
      let largeContent = '';
      for (let i = 0; i < 100; i++) {
        largeContent += `
          export class LargeClass${i} {
            private data${i}: string;

            constructor() {
              this.data${i} = "data${i}";
            }

            public method${i}(): string {
              return this.data${i};
            }

            public async asyncMethod${i}(): Promise<void> {
              await new Promise(resolve => setTimeout(resolve, 1));
            }
          }
        `;
      }

      await fs.writeFile(largeFilePath, largeContent, 'utf-8');

      const startTime = Date.now();
      const result: ParseResult = await parser.parseFile(largeFilePath);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(result.entities.length).toBeGreaterThan(100); // Should have many entities
      expect(result.errors.length).toBe(0); // Should parse without errors
    });

    it('should handle concurrent parsing of multiple files efficiently', async () => {
      const concurrentFiles = 10;
      const filePaths: string[] = [];

      // Create multiple files
      for (let i = 0; i < concurrentFiles; i++) {
        const filePath = path.join(testDir, `concurrent-${i}.ts`);
        const content = `
          export class ConcurrentClass${i} {
            public method${i}(): number {
              return ${i};
            }
          }

          export interface ConcurrentInterface${i} {
            id${i}: string;
            value${i}: number;
          }
        `;

        await fs.writeFile(filePath, content, 'utf-8');
        filePaths.push(filePath);
      }

      const startTime = Date.now();
      const results: ParseResult[] = await parser.parseMultipleFiles(filePaths);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for 10 concurrent files
      expect(results.length).toBe(concurrentFiles);

      // All should succeed
      results.forEach(result => {
        expect(result.errors.length).toBe(0);
        expect(result.entities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle files with syntax errors gracefully', async () => {
      const errorFilePath = path.join(testDir, 'syntax-error.ts');
      const errorContent = `
        export class SyntaxErrorClass {
          constructor() {
            this.property = "test";
            // Missing closing brace for constructor
          // Missing closing brace for class
      `;

      await fs.writeFile(errorFilePath, errorContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(errorFilePath);

      // Should not crash
      expect(result).toEqual(
        expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
          errors: expect.any(Array),
        })
      );

      // Should still extract some information
      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should handle empty files gracefully', async () => {
      const emptyFilePath = path.join(testDir, 'empty.ts');
      await fs.writeFile(emptyFilePath, '', 'utf-8');

      const result: ParseResult = await parser.parseFile(emptyFilePath);

      expect(result).toEqual(
        expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
          errors: expect.any(Array),
        })
      );
      expect(result.entities.length).toBeGreaterThan(0); // Should at least have file entity
      expect(result.errors.length).toBe(0);
    });

    it('should handle files with only comments', async () => {
      const commentFilePath = path.join(testDir, 'comments-only.ts');
      const commentContent = `
        /**
         * This file contains only comments
         * and documentation
         */

        // Single line comment
        /* Multi-line
           comment */

        /**
         * @deprecated This is deprecated
         */
      `;

      await fs.writeFile(commentFilePath, commentContent, 'utf-8');
      const result: ParseResult = await parser.parseFile(commentFilePath);

      expect(result).toEqual(
        expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
          errors: expect.any(Array),
        })
      );
      expect(result.entities.length).toBeGreaterThan(0); // Should have file entity
      expect(result.errors.length).toBe(0);
    });

    it('should handle very long file paths', async () => {
      // Create a file with a long path
      const longName = 'a'.repeat(200) + '.ts';
      const longPath = path.join(testDir, longName);
      const content = 'export class LongPathClass {}';

      await fs.writeFile(longPath, content, 'utf-8');
      const result: ParseResult = await parser.parseFile(longPath);

      expect(result).toEqual(
        expect.objectContaining({
          entities: expect.any(Array),
          relationships: expect.any(Array),
          errors: expect.any(Array),
        })
      );
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Partial Update Integration', () => {
    it('should apply partial updates to files', async () => {
      const updateFilePath = path.join(testDir, 'partial-update.ts');
      const originalContent = `
        export class PartialUpdate {
          public method1(): string {
            return "original";
          }
        }
      `;

      await fs.writeFile(updateFilePath, originalContent, 'utf-8');

      // Parse original file
      await parser.parseFileIncremental(updateFilePath);

      // Apply partial update
      const changes = [
        {
          start: originalContent.indexOf('method1(): string'),
          end: originalContent.indexOf('return "original";') + 'return "original";'.length,
          content: 'method1(): string {\n            return "updated";\n          }'
        }
      ];

      const result: IncrementalParseResult = await parser.applyPartialUpdate(
        updateFilePath,
        changes,
        originalContent
      );

      expect(result).toEqual(
        expect.objectContaining({
          isIncremental: expect.any(Boolean),
          addedEntities: expect.any(Array),
          removedEntities: expect.any(Array),
          updatedEntities: expect.any(Array),
        })
      );
      expect(result.isIncremental).toBe(true);
    });
  });
});
