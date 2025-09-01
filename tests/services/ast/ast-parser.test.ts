/**
 * ASTParser Integration Tests
 * Tests TypeScript/JavaScript code parsing functionality with real file operations
 * Following FalkorDB test pattern: real services, proper setup/teardown, comprehensive coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ASTParser, ParseResult, ParseError, IncrementalParseResult } from '../src/services/ASTParser.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('ASTParser Integration Tests', () => {
  let astParser: ASTParser;
  let tempDir: string;

  beforeAll(async () => {
    // Initialize real AST parser (no excessive mocking)
    astParser = new ASTParser();
    await astParser.initialize();
  }, 30000);

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = path.join(os.tmpdir(), `ast-parser-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  }, 10000);

  afterAll(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clear file cache between tests
    astParser.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newParser = new ASTParser();
      await expect(newParser.initialize()).resolves.not.toThrow();
      expect(newParser).toBeDefined();
    });

    it('should handle initialization without tree-sitter', async () => {
      // Mock tree-sitter import to fail
      jest.doMock('tree-sitter', () => {
        throw new Error('Module not found');
      });

      const newParser = new ASTParser();
      await expect(newParser.initialize()).resolves.not.toThrow();

      // Restore original import
      jest.restoreAllMocks();
    });
  });

  describe('File Parsing - TypeScript', () => {
    let testFilePath: string;

    beforeAll(async () => {
      // Create a test TypeScript file
      testFilePath = path.join(tempDir, 'test-class.ts');
      const testContent = `
        interface User {
          id: number;
          name: string;
          email: string;
        }

        class UserService {
          private users: User[] = [];

          constructor(private dbService: any) {}

          async getUser(id: number): Promise<User | null> {
            return this.users.find(user => user.id === id) || null;
          }

          async createUser(userData: Omit<User, 'id'>): Promise<User> {
            const user: User = {
              id: Date.now(),
              ...userData
            };
            this.users.push(user);
            return user;
          }

          async deleteUser(id: number): Promise<boolean> {
            const index = this.users.findIndex(user => user.id === id);
            if (index !== -1) {
              this.users.splice(index, 1);
              return true;
            }
            return false;
          }
        }

        type UserResponse = {
          success: boolean;
          data?: User;
          error?: string;
        };

        export { UserService, User, UserResponse };
      `;

      await fs.writeFile(testFilePath, testContent, 'utf-8');
    });

    it('should parse TypeScript file successfully', async () => {
      const result = await astParser.parseFile(testFilePath);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relationships).toBeDefined();
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should extract class entities', async () => {
      const result = await astParser.parseFile(testFilePath);
      const classes = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'class'
      );

      expect(classes.length).toBeGreaterThan(0);
      const userServiceClass = classes.find(c =>
        (c as any).name === 'UserService'
      );
      expect(userServiceClass).toBeDefined();
      expect((userServiceClass as any).name).toBe('UserService');
    });

    it('should extract interface entities', async () => {
      const result = await astParser.parseFile(testFilePath);
      const interfaces = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'interface'
      );

      expect(interfaces.length).toBeGreaterThan(0);
      const userInterface = interfaces.find(i =>
        (i as any).name === 'User'
      );
      expect(userInterface).toBeDefined();
      expect((userInterface as any).name).toBe('User');
    });

    it('should extract function entities', async () => {
      const result = await astParser.parseFile(testFilePath);
      const functions = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'function'
      );

      expect(functions.length).toBeGreaterThan(0);
      const methodNames = functions.map(f => (f as any).name);
      expect(methodNames).toContain('getUser');
      expect(methodNames).toContain('createUser');
      expect(methodNames).toContain('deleteUser');
    });

    it('should extract type alias entities', async () => {
      const result = await astParser.parseFile(testFilePath);
      const typeAliases = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'typeAlias'
      );

      expect(typeAliases.length).toBeGreaterThan(0);
      const responseType = typeAliases.find(t =>
        (t as any).name === 'UserResponse'
      );
      expect(responseType).toBeDefined();
      expect((responseType as any).name).toBe('UserResponse');
    });

    it('should extract file entity', async () => {
      const result = await astParser.parseFile(testFilePath);
      const files = result.entities.filter(entity => entity.type === 'file');

      expect(files.length).toBe(1);
      const fileEntity = files[0] as any;
      // AST parser converts to relative path
      const expectedRelativePath = path.relative(process.cwd(), testFilePath);
      expect(fileEntity.path).toBe(expectedRelativePath);
      expect(fileEntity.language).toBe('typescript');
      expect(fileEntity.extension).toBe('.ts');
    });

    it('should generate relationships between entities', async () => {
      const result = await astParser.parseFile(testFilePath);

      expect(result.relationships.length).toBeGreaterThan(0);

      // Should have CONTAINS relationships between file and symbols
      const containsRelationships = result.relationships.filter(rel =>
        rel.type === 'CONTAINS'
      );
      expect(containsRelationships.length).toBeGreaterThan(0);

      // Should have DEPENDS_ON relationships for type references
      const dependsRelationships = result.relationships.filter(rel =>
        rel.type === 'DEPENDS_ON'
      );
      expect(dependsRelationships.length).toBeGreaterThan(0);
    });
  });

  describe('File Parsing - JavaScript', () => {
    let jsFilePath: string;

    beforeAll(async () => {
      // Create a test JavaScript file
      jsFilePath = path.join(tempDir, 'test-module.js');
      const testContent = `
        class ProductService {
          constructor(database) {
            this.database = database;
            this.products = [];
          }

          async getProduct(id) {
            return this.products.find(product => product.id === id);
          }

          async createProduct(productData) {
            const product = {
              id: Date.now(),
              ...productData,
              createdAt: new Date()
            };
            this.products.push(product);
            return product;
          }

          validateProduct(product) {
            if (!product.name) {
              throw new Error('Product name is required');
            }
            if (!product.price || product.price <= 0) {
              throw new Error('Valid price is required');
            }
            return true;
          }
        }

        function calculateTotal(products) {
          return products.reduce((total, product) => total + product.price, 0);
        }

        module.exports = { ProductService, calculateTotal };
      `;

      await fs.writeFile(jsFilePath, testContent, 'utf-8');
    });

    it('should parse JavaScript file successfully', async () => {
      const result = await astParser.parseFile(jsFilePath);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should extract JavaScript class entities', async () => {
      const result = await astParser.parseFile(jsFilePath);
      const classes = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'class'
      );

      expect(classes.length).toBeGreaterThan(0);
      const productServiceClass = classes.find(c =>
        (c as any).name === 'ProductService'
      );
      expect(productServiceClass).toBeDefined();
    });

    it('should extract JavaScript function entities', async () => {
      const result = await astParser.parseFile(jsFilePath);
      const functions = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).kind === 'function'
      );

      expect(functions.length).toBeGreaterThan(0);
      const functionNames = functions.map(f => (f as any).name);
      expect(functionNames).toContain('calculateTotal');
      expect(functionNames).toContain('getProduct');
      expect(functionNames).toContain('createProduct');
      expect(functionNames).toContain('validateProduct');
    });
  });

  describe('Incremental Parsing', () => {
    let incrementalFilePath: string;

    beforeAll(async () => {
      incrementalFilePath = path.join(tempDir, 'incremental-test.ts');
      const initialContent = `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;
      await fs.writeFile(incrementalFilePath, initialContent, 'utf-8');
    });

    it('should perform incremental parsing', async () => {
      // Initial parse
      const initialResult = await astParser.parseFileIncremental(incrementalFilePath);

      expect(initialResult).toBeDefined();
      expect(initialResult.isIncremental).toBe(false); // First parse is not incremental

      // Modify file
      const updatedContent = `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }

          subtract(a: number, b: number): number {
            return a - b;
          }
        }
      `;
      await fs.writeFile(incrementalFilePath, updatedContent, 'utf-8');

      // Incremental parse
      const incrementalResult = await astParser.parseFileIncremental(incrementalFilePath);

      expect(incrementalResult).toBeDefined();
      expect(incrementalResult.isIncremental).toBe(true);

      // Should have added entities
      expect(incrementalResult.addedEntities.length).toBeGreaterThan(0);
    });

    it('should handle file deletion in incremental parsing', async () => {
      // First parse the file
      await astParser.parseFileIncremental(incrementalFilePath);

      // Delete the file
      await fs.unlink(incrementalFilePath);

      // Try to parse deleted file
      const result = await astParser.parseFileIncremental(incrementalFilePath);

      expect(result).toBeDefined();
      expect(result.isIncremental).toBe(true);
      expect(result.removedEntities.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.ts');

      const result = await astParser.parseFile(nonExistentPath);

      expect(result).toBeDefined();
      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should handle malformed TypeScript gracefully', async () => {
      const malformedFilePath = path.join(tempDir, 'malformed.ts');
      const malformedContent = `
        class MalformedClass {
          constructor() {
            // Missing closing brace and syntax error
            this.value = "test";
          // Missing closing brace here
      `;

      await fs.writeFile(malformedFilePath, malformedContent, 'utf-8');

      const result = await astParser.parseFile(malformedFilePath);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should handle empty files gracefully', async () => {
      const emptyFilePath = path.join(tempDir, 'empty.ts');
      await fs.writeFile(emptyFilePath, '', 'utf-8');

      const result = await astParser.parseFile(emptyFilePath);

      expect(result).toBeDefined();
      // Empty files still create file entities but with no symbols
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities[0].type).toBe('file');
      expect(result.relationships).toEqual([]);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Cache Management', () => {
    let cacheTestFilePath: string;

    beforeAll(async () => {
      cacheTestFilePath = path.join(tempDir, 'cache-test.ts');
      const content = `
        export function testFunction() {
          return 'cached';
        }
      `;
      await fs.writeFile(cacheTestFilePath, content, 'utf-8');
    });

    it('should use cache for unchanged files', async () => {
      // First parse
      const result1 = await astParser.parseFile(cacheTestFilePath);
      expect(result1.entities.length).toBeGreaterThan(0);

      // Second parse should use cache (no changes)
      const result2 = await astParser.parseFile(cacheTestFilePath);
      expect(result2.entities.length).toBe(result1.entities.length);
    });

    it('should invalidate cache when file changes', async () => {
      // First parse
      const result1 = await astParser.parseFile(cacheTestFilePath);

      // Modify file
      const updatedContent = `
        export function testFunction() {
          return 'cached and updated';
        }

        export function newFunction() {
          return 'new';
        }
      `;
      await fs.writeFile(cacheTestFilePath, updatedContent, 'utf-8');

      // Second parse should not use cache
      const result2 = await astParser.parseFile(cacheTestFilePath);
      expect(result2.entities.length).toBeGreaterThan(result1.entities.length);
    });

    it('should clear cache when requested', async () => {
      // Parse file to populate cache
      await astParser.parseFile(cacheTestFilePath);

      // Clear cache
      astParser.clearCache();

      // Verify cache is cleared
      const cacheSize = (astParser as any).fileCache.size;
      expect(cacheSize).toBe(0);
    });
  });

  describe('Performance and Large Files', () => {
    let largeFilePath: string;

    beforeAll(async () => {
      largeFilePath = path.join(tempDir, 'large-file.ts');

      // Create a large file with many entities
      let content = '';
      for (let i = 0; i < 100; i++) {
        content += `
          export class Class${i} {
            method${i}(): void {
              console.log('Method ${i}');
            }
          }

          export interface Interface${i} {
            property${i}: string;
          }

          export function function${i}(): string {
            return 'function ${i}';
          }
        `;
      }

      await fs.writeFile(largeFilePath, content, 'utf-8');
    });

    it('should handle large files efficiently', async () => {
      const startTime = Date.now();

      const result = await astParser.parseFile(largeFilePath);

      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(100); // Should have many entities
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Multi-file Parsing', () => {
    let file1Path: string;
    let file2Path: string;

    beforeAll(async () => {
      // Create file 1
      file1Path = path.join(tempDir, 'multi1.ts');
      const content1 = `
        export interface User {
          id: number;
          name: string;
        }

        export class UserManager {
          getUser(id: number): User | null {
            return null;
          }
        }
      `;
      await fs.writeFile(file1Path, content1, 'utf-8');

      // Create file 2 that imports from file 1
      file2Path = path.join(tempDir, 'multi2.ts');
      const content2 = `
        import { User, UserManager } from './multi1';

        export class UserService {
          constructor(private manager: UserManager) {}

          createUser(name: string): User {
            return { id: Date.now(), name };
          }
        }
      `;
      await fs.writeFile(file2Path, content2, 'utf-8');
    });

    it('should parse multiple related files', async () => {
      const result1 = await astParser.parseFile(file1Path);
      const result2 = await astParser.parseFile(file2Path);

      expect(result1.entities.length).toBeGreaterThan(0);
      expect(result2.entities.length).toBeGreaterThan(0);

      // Check for import relationships in file 2
      const importRelationships = result2.relationships.filter(rel =>
        rel.type === 'IMPORTS' || rel.type === 'DEPENDS_ON'
      );
      expect(importRelationships.length).toBeGreaterThan(0);
    });
  });

  describe('Symbol Resolution and Dependencies', () => {
    let dependencyFilePath: string;

    beforeAll(async () => {
      dependencyFilePath = path.join(tempDir, 'dependencies.ts');
      const content = `
        import { readFile } from 'fs/promises';
        import { join } from 'path';
        import type { Stats } from 'fs';

        interface FileProcessor {
          process(filePath: string): Promise<void>;
        }

        class AsyncFileProcessor implements FileProcessor {
          async process(filePath: string): Promise<void> {
            const fullPath = join(process.cwd(), filePath);
            const content = await readFile(fullPath, 'utf-8');
            console.log('Processing:', content.length, 'characters');

            const stats: Stats = await fs.promises.stat(fullPath);
            console.log('File size:', stats.size);
          }
        }

        export { FileProcessor, AsyncFileProcessor };
      `;
      await fs.writeFile(dependencyFilePath, content, 'utf-8');
    });

    it('should resolve external dependencies', async () => {
      const result = await astParser.parseFile(dependencyFilePath);

      // Should have IMPORTS relationships for external imports
      const importRelationships = result.relationships.filter(rel =>
        rel.type === 'IMPORTS'
      );

      expect(importRelationships.length).toBeGreaterThan(0);

      // Should identify Node.js built-in modules
      const externalImports = importRelationships.filter(rel =>
        (rel as any).moduleName?.includes('fs') ||
        (rel as any).moduleName?.includes('path')
      );
      expect(externalImports.length).toBeGreaterThan(0);
    });

    it('should identify type-only imports', async () => {
      const result = await astParser.parseFile(dependencyFilePath);

      // Should identify type-only imports (import type)
      const typeImports = result.entities.filter(entity =>
        entity.type === 'symbol' && (entity as any).isTypeOnlyImport
      );
      expect(typeImports.length).toBeGreaterThan(0);
    });
  });
});
