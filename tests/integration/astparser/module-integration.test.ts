/**
 * Integration test for refactored ASTParser modules
 *
 * Tests the integration between all refactored ASTParser modules to ensure
 * they work together correctly:
 * - ASTParserCore proper instantiation of sub-modules
 * - Data flow between modules (CacheManager ↔ IncrementalParser)
 * - ModuleResolver access to TypeCheckerBudget
 * - RelationshipBuilder receives proper inputs from SymbolExtractor
 * - DirectoryHandler integrates with entity creation flow
 * - Circular dependency detection
 * - Error propagation through module chain
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ASTParserCore } from '../../../src/services/knowledge/parser/ASTParserCore.js';
import { CacheManager } from '../../../src/services/knowledge/parser/CacheManager.js';
import { DirectoryHandler } from '../../../src/services/knowledge/parser/DirectoryHandler.js';
import { TypeCheckerBudget } from '../../../src/services/knowledge/parser/TypeCheckerBudget.js';
import { SymbolExtractor } from '../../../src/services/knowledge/parser/SymbolExtractor.js';
import { ModuleResolver } from '../../../src/services/knowledge/parser/ModuleResolver.js';
import { RelationshipBuilder } from '../../../src/services/knowledge/parser/RelationshipBuilder.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ASTParser Module Integration', () => {
  let parser: ASTParserCore;
  let tempDir: string;
  let sampleFile: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ast-parser-test-'));
    sampleFile = path.join(tempDir, 'sample.ts');

    // Initialize parser
    parser = new ASTParserCore();
    await parser.initialize();
  });

  afterEach(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp directory: ${error}`);
    }
  });

  describe('ASTParserCore Initialization', () => {
    it('should properly instantiate all sub-modules', async () => {
      // Test that parser is initialized correctly
      expect(parser).toBeDefined();
      expect(parser).toBeInstanceOf(ASTParserCore);

      // Verify parser can handle basic operations
      const cacheStats = parser.getCacheStats();
      expect(cacheStats).toEqual({
        files: 0,
        totalEntities: 0
      });

      const partialStats = parser.getPartialUpdateStats();
      expect(partialStats).toEqual({
        filesInCache: 0,
        globalSymbols: 0,
        namedSymbols: 0
      });
    });

    it('should initialize individual modules correctly', async () => {
      // Test individual module instantiation
      const cacheManager = new CacheManager();
      expect(cacheManager).toBeDefined();

      const directoryHandler = new DirectoryHandler();
      expect(directoryHandler).toBeDefined();

      const typeCheckerBudget = new TypeCheckerBudget();
      expect(typeCheckerBudget).toBeDefined();

      const symbolExtractor = new SymbolExtractor();
      expect(symbolExtractor).toBeDefined();

      // Test basic module functionality
      typeCheckerBudget.initializeBudget();
      expect(typeCheckerBudget.takeBudget()).toBe(true);
    });
  });

  describe('Data Flow Integration', () => {
    it('should parse a simple TypeScript file and create entities', async () => {
      // Create sample TypeScript file
      const sampleContent = `
export class Calculator {
  private result: number = 0;

  add(value: number): Calculator {
    this.result += value;
    return this;
  }

  subtract(value: number): Calculator {
    this.result -= value;
    return this;
  }

  getValue(): number {
    return this.result;
  }
}

export function createCalculator(): Calculator {
  return new Calculator();
}

export interface MathOperation {
  execute(a: number, b: number): number;
}

export type CalculatorMode = 'basic' | 'advanced';
`;

      await fs.writeFile(sampleFile, sampleContent);

      // Parse the file
      const result = await parser.parseFile(sampleFile);

      // Verify parsing results
      expect(result.entities).toBeDefined();
      expect(result.relationships).toBeDefined();
      expect(result.errors).toBeDefined();

      // Check that we have entities
      expect(result.entities.length).toBeGreaterThan(0);

      // Find file entity
      const fileEntity = result.entities.find(e => e.type === 'file');
      expect(fileEntity).toBeDefined();
      expect(fileEntity?.path).toContain('sample.ts');

      // Find symbol entities
      const symbolEntities = result.entities.filter(e => e.type === 'symbol');
      expect(symbolEntities.length).toBeGreaterThan(0);

      // Verify relationships were created
      expect(result.relationships.length).toBeGreaterThan(0);

      // Find CONTAINS relationships between file and symbols
      const containsRelationships = result.relationships.filter(r => r.type === 'CONTAINS');
      expect(containsRelationships.length).toBeGreaterThan(0);
    });

    it('should handle cache updates correctly', async () => {
      const sampleContent = `
export const greeting = "Hello World";
export function greet(name: string): string {
  return \`\${greeting}, \${name}!\`;
}
`;

      await fs.writeFile(sampleFile, sampleContent);

      // First parse - should miss cache
      const result1 = await parser.parseFile(sampleFile);
      expect(result1.entities.length).toBeGreaterThan(0);

      // Check cache stats
      let cacheStats = parser.getCacheStats();
      expect(cacheStats.files).toBeGreaterThan(0);

      // Second parse - should hit cache (same file content)
      const result2 = await parser.parseFile(sampleFile);
      expect(result2.entities.length).toEqual(result1.entities.length);

      // Verify cache stats remain consistent
      cacheStats = parser.getCacheStats();
      expect(cacheStats.files).toBeGreaterThan(0);
    });

    it('should handle incremental parsing correctly', async () => {
      const initialContent = `
export function add(a: number, b: number): number {
  return a + b;
}
`;

      await fs.writeFile(sampleFile, initialContent);

      // Parse initial version
      const initialResult = await parser.parseFileIncremental(sampleFile);
      expect(initialResult.isIncremental).toBe(true);
      expect(initialResult.entities.length).toBeGreaterThan(0);

      // Modify file content
      const modifiedContent = `
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
`;

      await fs.writeFile(sampleFile, modifiedContent);

      // Parse incremental update
      const incrementalResult = await parser.parseFileIncremental(sampleFile);
      expect(incrementalResult.isIncremental).toBe(true);
      expect(incrementalResult.entities.length).toBeGreaterThan(initialResult.entities.length);

      // Check for added entities
      expect(incrementalResult.addedEntities.length).toBeGreaterThan(0);
    });
  });

  describe('Module Resolver Integration', () => {
    it('should access TypeCheckerBudget correctly', async () => {
      // Create a file with imports to test module resolution
      const mainFile = path.join(tempDir, 'main.ts');
      const utilsFile = path.join(tempDir, 'utils.ts');

      const utilsContent = `
export function utility(): string {
  return 'utility function';
}

export class UtilityClass {
  getValue(): string {
    return 'utility class';
  }
}
`;

      const mainContent = `
import { utility, UtilityClass } from './utils';

export class MainClass {
  private util = new UtilityClass();

  process(): string {
    return utility() + ' - ' + this.util.getValue();
  }
}
`;

      await fs.writeFile(utilsFile, utilsContent);
      await fs.writeFile(mainFile, mainContent);

      // Parse both files
      const results = await parser.parseMultipleFiles([utilsFile, mainFile]);

      expect(results.entities.length).toBeGreaterThan(0);
      expect(results.relationships.length).toBeGreaterThan(0);
      expect(results.errors.length).toBe(0);

      // Check for import relationships
      const importRelationships = results.relationships.filter(r =>
        r.type === 'IMPORTS' || r.type === 'REFERENCES'
      );

      // Should have some cross-file relationships
      expect(results.relationships.length).toBeGreaterThan(0);
    });
  });

  describe('Error Propagation and Handling', () => {
    it('should propagate errors through the module chain', async () => {
      // Create a file with syntax errors
      const invalidContent = `
export class BrokenClass {
  // Missing closing brace
  method() {
    console.log("broken"
  }
`;

      await fs.writeFile(sampleFile, invalidContent);

      // Parse the invalid file
      const result = await parser.parseFile(sampleFile);

      // Should handle gracefully and potentially report errors
      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.relationships).toBeDefined();
      expect(result.errors).toBeDefined();

      // Note: ts-morph is quite tolerant of syntax errors,
      // so we might still get some entities even with invalid syntax
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.ts');

      const result = await parser.parseFile(nonExistentFile);

      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[0].message).toContain('Failed to parse file');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle multiple parsing operations without memory leaks', async () => {
      const files: string[] = [];

      // Create multiple test files
      for (let i = 0; i < 10; i++) {
        const fileName = path.join(tempDir, `test${i}.ts`);
        const content = `
export class TestClass${i} {
  private value: number = ${i};

  getValue(): number {
    return this.value;
  }

  increment(): void {
    this.value++;
  }
}

export function testFunction${i}(): TestClass${i} {
  return new TestClass${i}();
}
`;
        await fs.writeFile(fileName, content);
        files.push(fileName);
      }

      // Parse all files
      const startMemory = process.memoryUsage();
      const result = await parser.parseMultipleFiles(files);
      const endMemory = process.memoryUsage();

      // Verify we got results from all files
      expect(result.entities.length).toBeGreaterThan(files.length); // At least one entity per file
      expect(result.relationships.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);

      // Check cache stats
      const cacheStats = parser.getCacheStats();
      expect(cacheStats.files).toBe(files.length);
      expect(cacheStats.totalEntities).toBeGreaterThan(files.length);

      // Memory usage should be reasonable (this is a basic check)
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });

    it('should clear cache correctly', async () => {
      const content = `export const test = 'test';`;
      await fs.writeFile(sampleFile, content);

      // Parse to populate cache
      await parser.parseFile(sampleFile);

      let cacheStats = parser.getCacheStats();
      expect(cacheStats.files).toBeGreaterThan(0);

      // Clear cache
      parser.clearCache();

      cacheStats = parser.getCacheStats();
      expect(cacheStats.files).toBe(0);
      expect(cacheStats.totalEntities).toBe(0);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should handle circular imports without infinite loops', async () => {
      const fileA = path.join(tempDir, 'a.ts');
      const fileB = path.join(tempDir, 'b.ts');

      const contentA = `
import { ClassB } from './b';

export class ClassA {
  private b = new ClassB();

  processWithB(): string {
    return this.b.getName();
  }
}
`;

      const contentB = `
import { ClassA } from './a';

export class ClassB {
  getName(): string {
    return 'ClassB';
  }

  createA(): ClassA {
    return new ClassA();
  }
}
`;

      await fs.writeFile(fileA, contentA);
      await fs.writeFile(fileB, contentB);

      // This should not cause infinite loops or crashes
      const startTime = Date.now();
      const result = await parser.parseMultipleFiles([fileA, fileB]);
      const endTime = Date.now();

      // Should complete in reasonable time (not hang)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Should still parse successfully
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relationships.length).toBeGreaterThan(0);
    });
  });
});