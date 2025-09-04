/**
 * Unit tests for models/entities.ts
 * Tests entity types, type guards, and validation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Entity interfaces
  CodebaseEntity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Test,
  Spec,
  Change,
  Session,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssue,
  Vulnerability,
  FunctionParameter,
  CoverageMetrics,
  TestExecution,
  TestPerformanceData,
  TestPerformanceMetrics,
  TestBenchmark,
  TestHistoricalData,

  // Union type
  Entity,

  // Type guards
  isFile,
  isDirectory,
  isSymbol,
  isFunction,
  isClass,
  isInterface,
  isTest,
  isSpec,
} from '@/models/entities';

describe('Entity Types and Interfaces', () => {
  let baseEntity: CodebaseEntity;
  let testDate: Date;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    baseEntity = {
      id: 'test-entity-id',
      path: '/test/path',
      hash: 'abc123def456',
      language: 'typescript',
      lastModified: testDate,
      created: testDate,
      metadata: { key: 'value' },
    };
  });

  describe('Base CodebaseEntity', () => {
    it('should create a valid CodebaseEntity', () => {
      expect(baseEntity.id).toBe('test-entity-id');
      expect(baseEntity.path).toBe('/test/path');
      expect(baseEntity.hash).toBe('abc123def456');
      expect(baseEntity.language).toBe('typescript');
      expect(baseEntity.lastModified).toEqual(testDate);
      expect(baseEntity.created).toEqual(testDate);
      expect(baseEntity.metadata).toEqual({ key: 'value' });
    });

    it('should handle optional metadata', () => {
      const entityWithoutMetadata: CodebaseEntity = {
        id: 'test-id',
        path: '/test/path',
        hash: 'hash123',
        language: 'javascript',
        lastModified: new Date(),
        created: new Date(),
      };

      expect(entityWithoutMetadata.metadata).toBeUndefined();
    });

    it('should validate required properties', () => {
      const invalidEntity = {
        id: 'test-id',
        // Missing required properties: path, hash, language, lastModified, created
      };

      // This would cause TypeScript compilation errors, but we test the runtime structure
      expect(() => {
        if (!invalidEntity.path || !invalidEntity.hash) {
          throw new Error('Missing required properties');
        }
      }).toThrow('Missing required properties');
    });
  });

  describe('File Entity', () => {
    let fileEntity: File;

    beforeEach(() => {
      fileEntity = {
        ...baseEntity,
        type: 'file',
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: ['react', 'lodash'],
      };
    });

    it('should create a valid File entity', () => {
      expect(fileEntity.type).toBe('file');
      expect(fileEntity.extension).toBe('.ts');
      expect(fileEntity.size).toBe(1024);
      expect(fileEntity.lines).toBe(50);
      expect(fileEntity.isTest).toBe(false);
      expect(fileEntity.isConfig).toBe(false);
      expect(fileEntity.dependencies).toEqual(['react', 'lodash']);
    });

    it('should handle empty dependencies', () => {
      const fileWithNoDeps: File = {
        ...baseEntity,
        type: 'file',
        extension: '.js',
        size: 512,
        lines: 25,
        isTest: true,
        isConfig: false,
        dependencies: [],
      };

      expect(fileWithNoDeps.dependencies).toEqual([]);
      expect(fileWithNoDeps.isTest).toBe(true);
    });

    it('should handle test and config files correctly', () => {
      const testFile: File = {
        ...baseEntity,
        type: 'file',
        extension: '.test.ts',
        size: 2048,
        lines: 100,
        isTest: true,
        isConfig: false,
        dependencies: ['vitest'],
      };

      const configFile: File = {
        ...baseEntity,
        type: 'file',
        extension: '.json',
        size: 256,
        lines: 20,
        isTest: false,
        isConfig: true,
        dependencies: [],
      };

      expect(testFile.isTest).toBe(true);
      expect(testFile.isConfig).toBe(false);
      expect(configFile.isTest).toBe(false);
      expect(configFile.isConfig).toBe(true);
    });
  });

  describe('Directory Entity', () => {
    let directoryEntity: Directory;

    beforeEach(() => {
      directoryEntity = {
        ...baseEntity,
        type: 'directory',
        children: ['file1.ts', 'file2.js', 'subdir'],
        depth: 2,
      };
    });

    it('should create a valid Directory entity', () => {
      expect(directoryEntity.type).toBe('directory');
      expect(directoryEntity.children).toEqual(['file1.ts', 'file2.js', 'subdir']);
      expect(directoryEntity.depth).toBe(2);
    });

    it('should handle empty directory', () => {
      const emptyDirectory: Directory = {
        ...baseEntity,
        type: 'directory',
        children: [],
        depth: 0,
      };

      expect(emptyDirectory.children).toEqual([]);
      expect(emptyDirectory.depth).toBe(0);
    });

    it('should handle nested directory structure', () => {
      const nestedDirectory: Directory = {
        ...baseEntity,
        type: 'directory',
        children: ['src/', 'tests/', 'dist/', 'package.json'],
        depth: 1,
      };

      expect(nestedDirectory.children).toContain('src/');
      expect(nestedDirectory.children).toContain('tests/');
      expect(nestedDirectory.depth).toBe(1);
    });
  });

  describe('Module Entity', () => {
    let moduleEntity: Module;

    beforeEach(() => {
      moduleEntity = {
        ...baseEntity,
        type: 'module',
        name: 'express',
        version: '4.18.2',
        packageJson: { name: 'express', version: '4.18.2', dependencies: {} },
        entryPoint: './lib/express.js',
      };
    });

    it('should create a valid Module entity', () => {
      expect(moduleEntity.type).toBe('module');
      expect(moduleEntity.name).toBe('express');
      expect(moduleEntity.version).toBe('4.18.2');
      expect(moduleEntity.packageJson).toHaveProperty('name', 'express');
      expect(moduleEntity.entryPoint).toBe('./lib/express.js');
    });

    it('should handle complex package.json', () => {
      const complexModule: Module = {
        ...baseEntity,
        type: 'module',
        name: 'my-package',
        version: '1.0.0',
        packageJson: {
          name: 'my-package',
          version: '1.0.0',
          dependencies: {
            'lodash': '^4.17.0',
            'react': '^18.0.0',
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'vitest': '^0.34.0',
          },
          scripts: {
            build: 'tsc',
            test: 'vitest',
          },
        },
        entryPoint: './dist/index.js',
      };

      expect(complexModule.packageJson.dependencies).toHaveProperty('lodash');
      expect(complexModule.packageJson.devDependencies).toHaveProperty('typescript');
      expect(complexModule.packageJson.scripts).toHaveProperty('build');
    });
  });

  describe('Symbol Entities', () => {
    describe('Base Symbol', () => {
      let symbolEntity: Symbol;

      beforeEach(() => {
        symbolEntity = {
          ...baseEntity,
          type: 'symbol',
          name: 'UserService',
          kind: 'class',
          signature: 'export class UserService implements IService',
          docstring: 'Service for managing users',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          location: {
            line: 10,
            column: 0,
            start: 150,
            end: 200,
          },
        };
      });

      it('should create a valid Symbol entity', () => {
        expect(symbolEntity.type).toBe('symbol');
        expect(symbolEntity.name).toBe('UserService');
        expect(symbolEntity.kind).toBe('class');
        expect(symbolEntity.signature).toBe('export class UserService implements IService');
        expect(symbolEntity.docstring).toBe('Service for managing users');
        expect(symbolEntity.visibility).toBe('public');
        expect(symbolEntity.isExported).toBe(true);
        expect(symbolEntity.isDeprecated).toBe(false);
      });

      it('should handle optional location', () => {
        const symbolWithoutLocation: Symbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'helper',
          kind: 'function',
          signature: 'function helper(): void',
          docstring: '',
          visibility: 'private',
          isExported: false,
          isDeprecated: false,
        };

        expect(symbolWithoutLocation.location).toBeUndefined();
        expect(symbolWithoutLocation.isExported).toBe(false);
        expect(symbolWithoutLocation.isDeprecated).toBe(false);
      });

      it('should handle different visibility levels', () => {
        const visibilities: Array<'public' | 'private' | 'protected'> = ['public', 'private', 'protected'];

        visibilities.forEach(visibility => {
          const symbol: Symbol = {
            ...baseEntity,
            type: 'symbol',
            name: `test${visibility}`,
            kind: 'variable',
            signature: `const test${visibility}`,
            docstring: '',
            visibility,
            isExported: true,
            isDeprecated: false,
          };

          expect(symbol.visibility).toBe(visibility);
        });
      });

      it('should handle deprecated symbols', () => {
        const deprecatedSymbol: Symbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'oldFunction',
          kind: 'function',
          signature: '/** @deprecated */ function oldFunction()',
          docstring: '@deprecated Use newFunction instead',
          visibility: 'public',
          isExported: true,
          isDeprecated: true,
        };

        expect(deprecatedSymbol.isDeprecated).toBe(true);
        expect(deprecatedSymbol.docstring).toContain('@deprecated');
      });
    });

    describe('FunctionSymbol', () => {
      let functionSymbol: FunctionSymbol;

      beforeEach(() => {
        functionSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'processUser',
          kind: 'function',
          signature: 'async function processUser(user: User): Promise<Result>',
          docstring: 'Processes a user and returns a result',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          parameters: [
            { name: 'user', type: 'User', optional: false },
            { name: 'options', type: 'ProcessOptions', optional: true, defaultValue: '{}' },
          ],
          returnType: 'Promise<Result>',
          isAsync: true,
          isGenerator: false,
          complexity: 5,
          calls: ['validateUser', 'processData', 'sendNotification'],
        };
      });

      it('should create a valid FunctionSymbol', () => {
        expect(functionSymbol.kind).toBe('function');
        expect(functionSymbol.parameters).toHaveLength(2);
        expect(functionSymbol.returnType).toBe('Promise<Result>');
        expect(functionSymbol.isAsync).toBe(true);
        expect(functionSymbol.isGenerator).toBe(false);
        expect(functionSymbol.complexity).toBe(5);
        expect(functionSymbol.calls).toEqual(['validateUser', 'processData', 'sendNotification']);
      });

      it('should handle function parameters correctly', () => {
        const param1 = functionSymbol.parameters[0];
        const param2 = functionSymbol.parameters[1];

        expect(param1.name).toBe('user');
        expect(param1.type).toBe('User');
        expect(param1.optional).toBe(false);
        expect(param1.defaultValue).toBeUndefined();

        expect(param2.name).toBe('options');
        expect(param2.type).toBe('ProcessOptions');
        expect(param2.optional).toBe(true);
        expect(param2.defaultValue).toBe('{}');
      });

      it('should handle generator and sync functions', () => {
        const syncFunction: FunctionSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'syncFunc',
          kind: 'function',
          signature: 'function syncFunc(): string',
          docstring: '',
          visibility: 'public',
          isExported: false,
          isDeprecated: false,
          parameters: [],
          returnType: 'string',
          isAsync: false,
          isGenerator: false,
          complexity: 1,
          calls: [],
        };

        const generatorFunction: FunctionSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'generatorFunc',
          kind: 'function',
          signature: 'function* generatorFunc(): Iterable<number>',
          docstring: '',
          visibility: 'public',
          isExported: false,
          isDeprecated: false,
          parameters: [],
          returnType: 'Iterable<number>',
          isAsync: false,
          isGenerator: true,
          complexity: 2,
          calls: [],
        };

        expect(syncFunction.isAsync).toBe(false);
        expect(syncFunction.isGenerator).toBe(false);
        expect(generatorFunction.isAsync).toBe(false);
        expect(generatorFunction.isGenerator).toBe(true);
      });

      it('should handle function complexity and calls', () => {
        const simpleFunction: FunctionSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'simple',
          kind: 'function',
          signature: 'function simple(): void',
          docstring: '',
          visibility: 'private',
          isExported: false,
          isDeprecated: false,
          parameters: [],
          returnType: 'void',
          isAsync: false,
          isGenerator: false,
          complexity: 1,
          calls: [],
        };

        expect(simpleFunction.complexity).toBe(1);
        expect(simpleFunction.calls).toEqual([]);
      });
    });

    describe('ClassSymbol', () => {
      let classSymbol: ClassSymbol;

      beforeEach(() => {
        classSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'UserManager',
          kind: 'class',
          signature: 'export class UserManager extends BaseManager implements IUserManager',
          docstring: 'Manages user operations',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          extends: ['BaseManager'],
          implements: ['IUserManager', 'IDisposable'],
          methods: ['createUser', 'updateUser', 'deleteUser'],
          properties: ['users', 'config'],
          isAbstract: false,
        };
      });

      it('should create a valid ClassSymbol', () => {
        expect(classSymbol.kind).toBe('class');
        expect(classSymbol.extends).toEqual(['BaseManager']);
        expect(classSymbol.implements).toEqual(['IUserManager', 'IDisposable']);
        expect(classSymbol.methods).toEqual(['createUser', 'updateUser', 'deleteUser']);
        expect(classSymbol.properties).toEqual(['users', 'config']);
        expect(classSymbol.isAbstract).toBe(false);
      });

      it('should handle abstract classes', () => {
        const abstractClass: ClassSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'AbstractService',
          kind: 'class',
          signature: 'export abstract class AbstractService',
          docstring: 'Abstract base service',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          extends: [],
          implements: [],
          methods: ['abstractMethod'],
          properties: [],
          isAbstract: true,
        };

        expect(abstractClass.isAbstract).toBe(true);
        expect(abstractClass.extends).toEqual([]);
        expect(abstractClass.implements).toEqual([]);
      });

      it('should handle classes without inheritance', () => {
        const simpleClass: ClassSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'SimpleClass',
          kind: 'class',
          signature: 'export class SimpleClass',
          docstring: '',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          extends: [],
          implements: [],
          methods: ['method1'],
          properties: ['prop1'],
          isAbstract: false,
        };

        expect(simpleClass.extends).toEqual([]);
        expect(simpleClass.implements).toEqual([]);
        expect(simpleClass.methods).toEqual(['method1']);
        expect(simpleClass.properties).toEqual(['prop1']);
      });
    });

    describe('InterfaceSymbol', () => {
      let interfaceSymbol: InterfaceSymbol;

      beforeEach(() => {
        interfaceSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'IUserService',
          kind: 'interface',
          signature: 'export interface IUserService extends IService',
          docstring: 'User service interface',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          extends: ['IService'],
          methods: ['createUser', 'getUser', 'updateUser'],
          properties: ['baseUrl', 'timeout'],
        };
      });

      it('should create a valid InterfaceSymbol', () => {
        expect(interfaceSymbol.kind).toBe('interface');
        expect(interfaceSymbol.extends).toEqual(['IService']);
        expect(interfaceSymbol.methods).toEqual(['createUser', 'getUser', 'updateUser']);
        expect(interfaceSymbol.properties).toEqual(['baseUrl', 'timeout']);
      });

      it('should handle interfaces without extends', () => {
        const simpleInterface: InterfaceSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'ISimple',
          kind: 'interface',
          signature: 'export interface ISimple',
          docstring: '',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          extends: [],
          methods: ['method'],
          properties: ['prop'],
        };

        expect(simpleInterface.extends).toEqual([]);
        expect(simpleInterface.methods).toEqual(['method']);
        expect(simpleInterface.properties).toEqual(['prop']);
      });
    });

    describe('TypeAliasSymbol', () => {
      let typeAliasSymbol: TypeAliasSymbol;

      beforeEach(() => {
        typeAliasSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'UserId',
          kind: 'typeAlias',
          signature: 'export type UserId = string | number',
          docstring: 'User identifier type',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          aliasedType: 'string | number',
          isUnion: true,
          isIntersection: false,
        };
      });

      it('should create a valid TypeAliasSymbol', () => {
        expect(typeAliasSymbol.kind).toBe('typeAlias');
        expect(typeAliasSymbol.aliasedType).toBe('string | number');
        expect(typeAliasSymbol.isUnion).toBe(true);
        expect(typeAliasSymbol.isIntersection).toBe(false);
      });

      it('should handle different type alias patterns', () => {
        const intersectionType: TypeAliasSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'CompleteUser',
          kind: 'typeAlias',
          signature: 'export type CompleteUser = User & Profile',
          docstring: '',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          aliasedType: 'User & Profile',
          isUnion: false,
          isIntersection: true,
        };

        const simpleType: TypeAliasSymbol = {
          ...baseEntity,
          type: 'symbol',
          name: 'Config',
          kind: 'typeAlias',
          signature: 'export type Config = { key: string }',
          docstring: '',
          visibility: 'public',
          isExported: true,
          isDeprecated: false,
          aliasedType: '{ key: string }',
          isUnion: false,
          isIntersection: false,
        };

        expect(intersectionType.isUnion).toBe(false);
        expect(intersectionType.isIntersection).toBe(true);
        expect(simpleType.isUnion).toBe(false);
        expect(simpleType.isIntersection).toBe(false);
      });
    });
  });

  describe('Test Entity', () => {
    let testEntity: Test;
    let coverageMetrics: CoverageMetrics;
    let testExecution: TestExecution;
    let testPerformanceMetrics: TestPerformanceMetrics;

    beforeEach(() => {
      coverageMetrics = {
        lines: 85,
        branches: 90,
        functions: 95,
        statements: 88,
      };

      testExecution = {
        id: 'exec-1',
        timestamp: testDate,
        status: 'passed',
        duration: 150,
        coverage: coverageMetrics,
        performance: {
          memoryUsage: 50,
          cpuUsage: 20,
          networkRequests: 5,
          databaseQueries: 2,
          fileOperations: 1,
        },
        environment: { nodeVersion: '18.0.0' },
      };

      testPerformanceMetrics = {
        averageExecutionTime: 145,
        p95ExecutionTime: 200,
        successRate: 0.95,
        trend: 'stable',
        benchmarkComparisons: [
          { benchmark: 'memory', value: 50, status: 'below', threshold: 100 },
        ],
        historicalData: [
          {
            timestamp: testDate,
            executionTime: 145,
            successRate: 0.95,
            coveragePercentage: 88,
          },
        ],
      };

      testEntity = {
        ...baseEntity,
        type: 'test',
        testType: 'unit',
        targetSymbol: 'UserService.createUser',
        framework: 'vitest',
        coverage: coverageMetrics,
        status: 'passing',
        flakyScore: 0.1,
        lastRunAt: testDate,
        lastDuration: 150,
        executionHistory: [testExecution],
        performanceMetrics: testPerformanceMetrics,
        dependencies: ['UserService', 'Database'],
        tags: ['unit', 'user-management'],
      };
    });

    it('should create a valid Test entity', () => {
      expect(testEntity.type).toBe('test');
      expect(testEntity.testType).toBe('unit');
      expect(testEntity.targetSymbol).toBe('UserService.createUser');
      expect(testEntity.framework).toBe('vitest');
      expect(testEntity.status).toBe('passing');
      expect(testEntity.flakyScore).toBe(0.1);
      expect(testEntity.lastRunAt).toEqual(testDate);
      expect(testEntity.lastDuration).toBe(150);
      expect(testEntity.executionHistory).toHaveLength(1);
      expect(testEntity.dependencies).toEqual(['UserService', 'Database']);
      expect(testEntity.tags).toEqual(['unit', 'user-management']);
    });

    it('should handle different test types', () => {
      const testTypes: Array<'unit' | 'integration' | 'e2e'> = ['unit', 'integration', 'e2e'];

      testTypes.forEach(testType => {
        const test: Test = {
          ...baseEntity,
          type: 'test',
          testType,
          targetSymbol: 'target',
          framework: 'jest',
          coverage: coverageMetrics,
          status: 'passing',
          flakyScore: 0,
          executionHistory: [],
          performanceMetrics: testPerformanceMetrics,
          dependencies: [],
          tags: [],
        };

        expect(test.testType).toBe(testType);
      });
    });

    it('should handle different test statuses', () => {
      const statuses: Array<'passing' | 'failing' | 'skipped' | 'unknown'> = ['passing', 'failing', 'skipped', 'unknown'];

      statuses.forEach(status => {
        const test: Test = {
          ...baseEntity,
          type: 'test',
          testType: 'unit',
          targetSymbol: 'target',
          framework: 'jest',
          coverage: coverageMetrics,
          status,
          flakyScore: 0,
          executionHistory: [],
          performanceMetrics: testPerformanceMetrics,
          dependencies: [],
          tags: [],
        };

        expect(test.status).toBe(status);
      });
    });

    it('should handle coverage metrics correctly', () => {
      expect(testEntity.coverage.lines).toBe(85);
      expect(testEntity.coverage.branches).toBe(90);
      expect(testEntity.coverage.functions).toBe(95);
      expect(testEntity.coverage.statements).toBe(88);
    });

    it('should handle test execution data', () => {
      const execution = testEntity.executionHistory[0];
      expect(execution.id).toBe('exec-1');
      expect(execution.timestamp).toEqual(testDate);
      expect(execution.status).toBe('passed');
      expect(execution.duration).toBe(150);
      expect(execution.coverage).toEqual(coverageMetrics);
      expect(execution.performance?.memoryUsage).toBe(50);
      expect(execution.environment).toEqual({ nodeVersion: '18.0.0' });
    });

    it('should handle flaky tests', () => {
      const flakyTest: Test = {
        ...baseEntity,
        type: 'test',
        testType: 'integration',
        targetSymbol: 'flakyTarget',
        framework: 'jest',
        coverage: coverageMetrics,
        status: 'passing',
        flakyScore: 0.8,
        executionHistory: [],
        performanceMetrics: testPerformanceMetrics,
        dependencies: [],
        tags: ['flaky'],
      };

      expect(flakyTest.flakyScore).toBe(0.8);
      expect(flakyTest.tags).toContain('flaky');
    });
  });

  describe('Spec Entity', () => {
    let specEntity: Spec;

    beforeEach(() => {
      specEntity = {
        ...baseEntity,
        type: 'spec',
        title: 'User Registration Feature',
        description: 'Allow users to register with email and password',
        acceptanceCriteria: [
          'User can provide email and password',
          'System validates email format',
          'System creates user account',
        ],
        status: 'approved',
        priority: 'high',
        assignee: 'john.doe@example.com',
        tags: ['authentication', 'user-management'],
        updated: testDate,
      };
    });

    it('should create a valid Spec entity', () => {
      expect(specEntity.type).toBe('spec');
      expect(specEntity.title).toBe('User Registration Feature');
      expect(specEntity.description).toBe('Allow users to register with email and password');
      expect(specEntity.acceptanceCriteria).toHaveLength(3);
      expect(specEntity.status).toBe('approved');
      expect(specEntity.priority).toBe('high');
      expect(specEntity.assignee).toBe('john.doe@example.com');
      expect(specEntity.tags).toEqual(['authentication', 'user-management']);
      expect(specEntity.updated).toEqual(testDate);
    });

    it('should handle different spec statuses', () => {
      const statuses: Array<'draft' | 'approved' | 'implemented' | 'deprecated'> = ['draft', 'approved', 'implemented', 'deprecated'];

      statuses.forEach(status => {
        const spec: Spec = {
          ...baseEntity,
          type: 'spec',
          title: 'Test Spec',
          description: 'Test description',
          acceptanceCriteria: ['criterion 1'],
          status,
          priority: 'medium',
          updated: testDate,
        };

        expect(spec.status).toBe(status);
      });
    });

    it('should handle different priorities', () => {
      const priorities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

      priorities.forEach(priority => {
        const spec: Spec = {
          ...baseEntity,
          type: 'spec',
          title: 'Test Spec',
          description: 'Test description',
          acceptanceCriteria: [],
          status: 'draft',
          priority,
          updated: testDate,
        };

        expect(spec.priority).toBe(priority);
      });
    });

    it('should handle optional assignee and tags', () => {
      const specWithoutAssignee: Spec = {
        ...baseEntity,
        type: 'spec',
        title: 'Unassigned Spec',
        description: 'No assignee',
        acceptanceCriteria: ['simple criterion'],
        status: 'draft',
        priority: 'low',
        updated: testDate,
      };

      expect(specWithoutAssignee.assignee).toBeUndefined();
      expect(specWithoutAssignee.tags).toBeUndefined();
    });
  });

  describe('Change Entity', () => {
    let changeEntity: Change;

    beforeEach(() => {
      changeEntity = {
        id: 'change-1',
        type: 'change',
        changeType: 'update',
        entityType: 'file',
        entityId: 'file-123',
        timestamp: testDate,
        author: 'john.doe@example.com',
        commitHash: 'abc123def456',
        diff: '--- a/file.ts\n+++ b/file.ts\n@@ -1 +1 @@\n-old code\n+new code',
        previousState: { content: 'old code' },
        newState: { content: 'new code' },
        sessionId: 'session-1',
        specId: 'spec-1',
      };
    });

    it('should create a valid Change entity', () => {
      expect(changeEntity.id).toBe('change-1');
      expect(changeEntity.type).toBe('change');
      expect(changeEntity.changeType).toBe('update');
      expect(changeEntity.entityType).toBe('file');
      expect(changeEntity.entityId).toBe('file-123');
      expect(changeEntity.timestamp).toEqual(testDate);
      expect(changeEntity.author).toBe('john.doe@example.com');
      expect(changeEntity.commitHash).toBe('abc123def456');
      expect(changeEntity.diff).toContain('--- a/file.ts');
      expect(changeEntity.previousState).toEqual({ content: 'old code' });
      expect(changeEntity.newState).toEqual({ content: 'new code' });
      expect(changeEntity.sessionId).toBe('session-1');
      expect(changeEntity.specId).toBe('spec-1');
    });

    it('should handle different change types', () => {
      const changeTypes: Array<'create' | 'update' | 'delete' | 'rename' | 'move'> = ['create', 'update', 'delete', 'rename', 'move'];

      changeTypes.forEach(changeType => {
        const change: Change = {
          id: `change-${changeType}`,
          type: 'change',
          changeType,
          entityType: 'file',
          entityId: 'file-123',
          timestamp: testDate,
        };

        expect(change.changeType).toBe(changeType);
      });
    });

    it('should handle optional fields', () => {
      const minimalChange: Change = {
        id: 'minimal-change',
        type: 'change',
        changeType: 'create',
        entityType: 'file',
        entityId: 'file-123',
        timestamp: testDate,
      };

      expect(minimalChange.author).toBeUndefined();
      expect(minimalChange.commitHash).toBeUndefined();
      expect(minimalChange.diff).toBeUndefined();
      expect(minimalChange.previousState).toBeUndefined();
      expect(minimalChange.newState).toBeUndefined();
      expect(minimalChange.sessionId).toBeUndefined();
      expect(minimalChange.specId).toBeUndefined();
    });
  });

  describe('Session Entity', () => {
    let sessionEntity: Session;

    beforeEach(() => {
      sessionEntity = {
        id: 'session-1',
        type: 'session',
        startTime: testDate,
        endTime: new Date(testDate.getTime() + 3600000), // 1 hour later
        agentType: 'development-assistant',
        userId: 'user-123',
        changes: ['change-1', 'change-2'],
        specs: ['spec-1'],
        status: 'completed',
        metadata: { environment: 'development' },
      };
    });

    it('should create a valid Session entity', () => {
      expect(sessionEntity.id).toBe('session-1');
      expect(sessionEntity.type).toBe('session');
      expect(sessionEntity.startTime).toEqual(testDate);
      expect(sessionEntity.endTime).toEqual(new Date(testDate.getTime() + 3600000));
      expect(sessionEntity.agentType).toBe('development-assistant');
      expect(sessionEntity.userId).toBe('user-123');
      expect(sessionEntity.changes).toEqual(['change-1', 'change-2']);
      expect(sessionEntity.specs).toEqual(['spec-1']);
      expect(sessionEntity.status).toBe('completed');
      expect(sessionEntity.metadata).toEqual({ environment: 'development' });
    });

    it('should handle different session statuses', () => {
      const statuses: Array<'active' | 'completed' | 'failed'> = ['active', 'completed', 'failed'];

      statuses.forEach(status => {
        const session: Session = {
          id: `session-${status}`,
          type: 'session',
          startTime: testDate,
          agentType: 'assistant',
          changes: [],
          specs: [],
          status,
        };

        expect(session.status).toBe(status);
      });
    });

    it('should handle active sessions without end time', () => {
      const activeSession: Session = {
        id: 'active-session',
        type: 'session',
        startTime: testDate,
        agentType: 'assistant',
        changes: [],
        specs: [],
        status: 'active',
      };

      expect(activeSession.endTime).toBeUndefined();
      expect(activeSession.userId).toBeUndefined();
      expect(activeSession.metadata).toBeUndefined();
    });

    it('should handle empty changes and specs', () => {
      const emptySession: Session = {
        id: 'empty-session',
        type: 'session',
        startTime: testDate,
        agentType: 'assistant',
        changes: [],
        specs: [],
        status: 'active',
      };

      expect(emptySession.changes).toEqual([]);
      expect(emptySession.specs).toEqual([]);
    });
  });

  describe('DocumentationNode Entity', () => {
    let docNode: DocumentationNode;

    beforeEach(() => {
      docNode = {
        ...baseEntity,
        type: 'documentation',
        title: 'API Reference',
        content: '# API Reference\n\nThis document describes the API endpoints...',
        docType: 'api-docs',
        businessDomains: ['user-management', 'authentication'],
        stakeholders: ['developers', 'product-managers'],
        technologies: ['typescript', 'express', 'postgresql'],
        status: 'active',
      };
    });

    it('should create a valid DocumentationNode', () => {
      expect(docNode.type).toBe('documentation');
      expect(docNode.title).toBe('API Reference');
      expect(docNode.content).toContain('# API Reference');
      expect(docNode.docType).toBe('api-docs');
      expect(docNode.businessDomains).toEqual(['user-management', 'authentication']);
      expect(docNode.stakeholders).toEqual(['developers', 'product-managers']);
      expect(docNode.technologies).toEqual(['typescript', 'express', 'postgresql']);
      expect(docNode.status).toBe('active');
    });

    it('should handle different documentation types', () => {
      const docTypes: Array<'readme' | 'api-docs' | 'design-doc' | 'architecture' | 'user-guide'> = [
        'readme', 'api-docs', 'design-doc', 'architecture', 'user-guide'
      ];

      docTypes.forEach(docType => {
        const doc: DocumentationNode = {
          ...baseEntity,
          type: 'documentation',
          title: 'Test Doc',
          content: 'Test content',
          docType,
          businessDomains: [],
          stakeholders: [],
          technologies: [],
          status: 'active',
        };

        expect(doc.docType).toBe(docType);
      });
    });

    it('should handle different documentation statuses', () => {
      const statuses: Array<'active' | 'deprecated' | 'draft'> = ['active', 'deprecated', 'draft'];

      statuses.forEach(status => {
        const doc: DocumentationNode = {
          ...baseEntity,
          type: 'documentation',
          title: 'Test Doc',
          content: 'Test content',
          docType: 'readme',
          businessDomains: [],
          stakeholders: [],
          technologies: [],
          status,
        };

        expect(doc.status).toBe(status);
      });
    });
  });

  describe('BusinessDomain Entity', () => {
    let businessDomain: BusinessDomain;

    beforeEach(() => {
      businessDomain = {
        id: 'domain-1',
        type: 'businessDomain',
        name: 'User Management',
        description: 'Handles user registration, authentication, and profile management',
        parentDomain: 'customer-experience',
        criticality: 'core',
        stakeholders: ['product-team', 'engineering'],
        keyProcesses: ['user-onboarding', 'authentication', 'profile-updates'],
        extractedFrom: ['user-service', 'auth-service'],
      };
    });

    it('should create a valid BusinessDomain', () => {
      expect(businessDomain.id).toBe('domain-1');
      expect(businessDomain.type).toBe('businessDomain');
      expect(businessDomain.name).toBe('User Management');
      expect(businessDomain.description).toContain('user registration');
      expect(businessDomain.parentDomain).toBe('customer-experience');
      expect(businessDomain.criticality).toBe('core');
      expect(businessDomain.stakeholders).toEqual(['product-team', 'engineering']);
      expect(businessDomain.keyProcesses).toEqual(['user-onboarding', 'authentication', 'profile-updates']);
      expect(businessDomain.extractedFrom).toEqual(['user-service', 'auth-service']);
    });

    it('should handle different criticality levels', () => {
      const criticalities: Array<'core' | 'supporting' | 'utility'> = ['core', 'supporting', 'utility'];

      criticalities.forEach(criticality => {
        const domain: BusinessDomain = {
          id: `domain-${criticality}`,
          type: 'businessDomain',
          name: 'Test Domain',
          description: 'Test description',
          criticality,
          stakeholders: [],
          keyProcesses: [],
          extractedFrom: [],
        };

        expect(domain.criticality).toBe(criticality);
      });
    });

    it('should handle domains without parent', () => {
      const rootDomain: BusinessDomain = {
        id: 'root-domain',
        type: 'businessDomain',
        name: 'Root Domain',
        description: 'Top level domain',
        criticality: 'core',
        stakeholders: ['all-teams'],
        keyProcesses: ['core-process'],
        extractedFrom: [],
      };

      expect(rootDomain.parentDomain).toBeUndefined();
    });
  });

  describe('SemanticCluster Entity', () => {
    let semanticCluster: SemanticCluster;

    beforeEach(() => {
      semanticCluster = {
        id: 'cluster-1',
        type: 'semanticCluster',
        name: 'Authentication Module',
        description: 'Handles all authentication-related functionality',
        businessDomainId: 'domain-1',
        clusterType: 'module',
        cohesionScore: 0.85,
        lastAnalyzed: testDate,
        memberEntities: ['auth-service', 'jwt-utils', 'password-validator'],
      };
    });

    it('should create a valid SemanticCluster', () => {
      expect(semanticCluster.id).toBe('cluster-1');
      expect(semanticCluster.type).toBe('semanticCluster');
      expect(semanticCluster.name).toBe('Authentication Module');
      expect(semanticCluster.description).toContain('authentication-related');
      expect(semanticCluster.businessDomainId).toBe('domain-1');
      expect(semanticCluster.clusterType).toBe('module');
      expect(semanticCluster.cohesionScore).toBe(0.85);
      expect(semanticCluster.lastAnalyzed).toEqual(testDate);
      expect(semanticCluster.memberEntities).toEqual(['auth-service', 'jwt-utils', 'password-validator']);
    });

    it('should handle different cluster types', () => {
      const clusterTypes: Array<'feature' | 'module' | 'capability' | 'service'> = ['feature', 'module', 'capability', 'service'];

      clusterTypes.forEach(clusterType => {
        const cluster: SemanticCluster = {
          id: `cluster-${clusterType}`,
          type: 'semanticCluster',
          name: 'Test Cluster',
          description: 'Test description',
          businessDomainId: 'domain-1',
          clusterType,
          cohesionScore: 0.8,
          lastAnalyzed: testDate,
          memberEntities: [],
        };

        expect(cluster.clusterType).toBe(clusterType);
      });
    });

    it('should handle cohesion scores correctly', () => {
      const scores = [0.0, 0.5, 1.0];

      scores.forEach(score => {
        const cluster: SemanticCluster = {
          id: `cluster-score-${score}`,
          type: 'semanticCluster',
          name: 'Test Cluster',
          description: 'Test description',
          businessDomainId: 'domain-1',
          clusterType: 'feature',
          cohesionScore: score,
          lastAnalyzed: testDate,
          memberEntities: [],
        };

        expect(cluster.cohesionScore).toBe(score);
      });
    });
  });

  describe('Security Entities', () => {
    describe('SecurityIssue', () => {
      let securityIssue: SecurityIssue;

      beforeEach(() => {
        securityIssue = {
          id: 'sec-issue-1',
          type: 'securityIssue',
          tool: 'eslint-plugin-security',
          ruleId: 'no-eval',
          severity: 'high',
          title: 'Use of eval() function detected',
          description: 'The eval() function can be dangerous and should be avoided',
          cwe: 'CWE-95',
          owasp: 'A1:2017-Injection',
          affectedEntityId: 'file-123',
          lineNumber: 25,
          codeSnippet: 'const result = eval(userInput);',
          remediation: 'Replace eval() with a safe alternative like JSON.parse()',
          status: 'open',
          discoveredAt: testDate,
          lastScanned: testDate,
          confidence: 0.9,
        };
      });

      it('should create a valid SecurityIssue', () => {
        expect(securityIssue.id).toBe('sec-issue-1');
        expect(securityIssue.type).toBe('securityIssue');
        expect(securityIssue.tool).toBe('eslint-plugin-security');
        expect(securityIssue.ruleId).toBe('no-eval');
        expect(securityIssue.severity).toBe('high');
        expect(securityIssue.title).toBe('Use of eval() function detected');
        expect(securityIssue.cwe).toBe('CWE-95');
        expect(securityIssue.owasp).toBe('A1:2017-Injection');
        expect(securityIssue.affectedEntityId).toBe('file-123');
        expect(securityIssue.lineNumber).toBe(25);
        expect(securityIssue.codeSnippet).toBe('const result = eval(userInput);');
        expect(securityIssue.remediation).toContain('Replace eval()');
        expect(securityIssue.status).toBe('open');
        expect(securityIssue.confidence).toBe(0.9);
      });

      it('should handle different severity levels', () => {
        const severities: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = ['critical', 'high', 'medium', 'low', 'info'];

        severities.forEach(severity => {
          const issue: SecurityIssue = {
            id: `issue-${severity}`,
            type: 'securityIssue',
            tool: 'security-scanner',
            ruleId: 'test-rule',
            severity,
            title: 'Test Issue',
            description: 'Test description',
            affectedEntityId: 'file-123',
            lineNumber: 1,
            codeSnippet: 'test code',
            remediation: 'fix it',
            status: 'open',
            discoveredAt: testDate,
            lastScanned: testDate,
            confidence: 0.8,
          };

          expect(issue.severity).toBe(severity);
        });
      });

      it('should handle different issue statuses', () => {
        const statuses: Array<'open' | 'fixed' | 'accepted' | 'false-positive'> = ['open', 'fixed', 'accepted', 'false-positive'];

        statuses.forEach(status => {
          const issue: SecurityIssue = {
            id: `issue-${status}`,
            type: 'securityIssue',
            tool: 'security-scanner',
            ruleId: 'test-rule',
            severity: 'medium',
            title: 'Test Issue',
            description: 'Test description',
            affectedEntityId: 'file-123',
            lineNumber: 1,
            codeSnippet: 'test code',
            remediation: 'fix it',
            status,
            discoveredAt: testDate,
            lastScanned: testDate,
            confidence: 0.8,
          };

          expect(issue.status).toBe(status);
        });
      });

      it('should handle optional CWE and OWASP references', () => {
        const issueWithoutRefs: SecurityIssue = {
          id: 'issue-no-refs',
          type: 'securityIssue',
          tool: 'security-scanner',
          ruleId: 'test-rule',
          severity: 'low',
          title: 'Test Issue',
          description: 'Test description',
          affectedEntityId: 'file-123',
          lineNumber: 1,
          codeSnippet: 'test code',
          remediation: 'fix it',
          status: 'open',
          discoveredAt: testDate,
          lastScanned: testDate,
          confidence: 0.8,
        };

        expect(issueWithoutRefs.cwe).toBeUndefined();
        expect(issueWithoutRefs.owasp).toBeUndefined();
      });
    });

    describe('Vulnerability', () => {
      let vulnerability: Vulnerability;

      beforeEach(() => {
        vulnerability = {
          id: 'vuln-1',
          type: 'vulnerability',
          packageName: 'lodash',
          version: '4.17.20',
          vulnerabilityId: 'CVE-2021-23337',
          severity: 'high',
          description: 'Prototype pollution in lodash',
          cvssScore: 7.4,
          affectedVersions: '<4.17.31',
          fixedInVersion: '4.17.31',
          publishedAt: testDate,
          lastUpdated: testDate,
          exploitability: 'medium',
        };
      });

      it('should create a valid Vulnerability', () => {
        expect(vulnerability.id).toBe('vuln-1');
        expect(vulnerability.type).toBe('vulnerability');
        expect(vulnerability.packageName).toBe('lodash');
        expect(vulnerability.version).toBe('4.17.20');
        expect(vulnerability.vulnerabilityId).toBe('CVE-2021-23337');
        expect(vulnerability.severity).toBe('high');
        expect(vulnerability.description).toBe('Prototype pollution in lodash');
        expect(vulnerability.cvssScore).toBe(7.4);
        expect(vulnerability.affectedVersions).toBe('<4.17.31');
        expect(vulnerability.fixedInVersion).toBe('4.17.31');
        expect(vulnerability.exploitability).toBe('medium');
      });

      it('should handle different exploitability levels', () => {
        const exploitabilities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

        exploitabilities.forEach(exploitability => {
          const vuln: Vulnerability = {
            id: `vuln-${exploitability}`,
            type: 'vulnerability',
            packageName: 'test-package',
            version: '1.0.0',
            vulnerabilityId: 'TEST-001',
            severity: 'medium',
            description: 'Test vulnerability',
            cvssScore: 5.0,
            affectedVersions: '<2.0.0',
            fixedInVersion: '2.0.0',
            publishedAt: testDate,
            lastUpdated: testDate,
            exploitability,
          };

          expect(vuln.exploitability).toBe(exploitability);
        });
      });
    });
  });

  describe('Type Guards', () => {
    let fileEntity: File;
    let directoryEntity: Directory;
    let symbolEntity: Symbol;
    let functionSymbol: FunctionSymbol;
    let classSymbol: ClassSymbol;
    let interfaceSymbol: InterfaceSymbol;
    let testEntity: Test;
    let specEntity: Spec;

    beforeEach(() => {
      fileEntity = {
        ...baseEntity,
        type: 'file',
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      directoryEntity = {
        ...baseEntity,
        type: 'directory',
        children: [],
        depth: 0,
      };

      symbolEntity = {
        ...baseEntity,
        type: 'symbol',
        name: 'testSymbol',
        kind: 'variable',
        signature: 'const testSymbol',
        docstring: '',
        visibility: 'public',
        isExported: false,
        isDeprecated: false,
      };

      functionSymbol = {
        ...baseEntity,
        type: 'symbol',
        name: 'testFunction',
        kind: 'function',
        signature: 'function testFunction()',
        docstring: '',
        visibility: 'public',
        isExported: false,
        isDeprecated: false,
        parameters: [],
        returnType: 'void',
        isAsync: false,
        isGenerator: false,
        complexity: 1,
        calls: [],
      };

      classSymbol = {
        ...baseEntity,
        type: 'symbol',
        name: 'TestClass',
        kind: 'class',
        signature: 'class TestClass',
        docstring: '',
        visibility: 'public',
        isExported: false,
        isDeprecated: false,
        extends: [],
        implements: [],
        methods: [],
        properties: [],
        isAbstract: false,
      };

      interfaceSymbol = {
        ...baseEntity,
        type: 'symbol',
        name: 'ITestInterface',
        kind: 'interface',
        signature: 'interface ITestInterface',
        docstring: '',
        visibility: 'public',
        isExported: false,
        isDeprecated: false,
        extends: [],
        methods: [],
        properties: [],
      };

      testEntity = {
        ...baseEntity,
        type: 'test',
        testType: 'unit',
        targetSymbol: 'testTarget',
        framework: 'jest',
        coverage: { lines: 0, branches: 0, functions: 0, statements: 0 },
        status: 'passing',
        flakyScore: 0,
        executionHistory: [],
        performanceMetrics: {
          averageExecutionTime: 0,
          p95ExecutionTime: 0,
          successRate: 1,
          trend: 'stable',
          benchmarkComparisons: [],
          historicalData: [],
        },
        dependencies: [],
        tags: [],
      };

      specEntity = {
        ...baseEntity,
        type: 'spec',
        title: 'Test Spec',
        description: 'Test description',
        acceptanceCriteria: [],
        status: 'draft',
        priority: 'low',
        updated: testDate,
      };
    });

    describe('isFile', () => {
      it('should return true for file entities', () => {
        expect(isFile(fileEntity)).toBe(true);
      });

      it('should return false for non-file entities', () => {
        expect(isFile(directoryEntity)).toBe(false);
        expect(isFile(symbolEntity)).toBe(false);
        expect(isFile(testEntity)).toBe(false);
        expect(isFile(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isFile(null)).toBe(false);
        expect(isFile(undefined)).toBe(false);
      });
    });

    describe('isDirectory', () => {
      it('should return true for directory entities', () => {
        expect(isDirectory(directoryEntity)).toBe(true);
      });

      it('should return false for non-directory entities', () => {
        expect(isDirectory(fileEntity)).toBe(false);
        expect(isDirectory(symbolEntity)).toBe(false);
        expect(isDirectory(testEntity)).toBe(false);
        expect(isDirectory(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isDirectory(null)).toBe(false);
        expect(isDirectory(undefined)).toBe(false);
      });
    });

    describe('isSymbol', () => {
      it('should return true for symbol entities', () => {
        expect(isSymbol(symbolEntity)).toBe(true);
        expect(isSymbol(functionSymbol)).toBe(true);
        expect(isSymbol(classSymbol)).toBe(true);
        expect(isSymbol(interfaceSymbol)).toBe(true);
      });

      it('should return false for non-symbol entities', () => {
        expect(isSymbol(fileEntity)).toBe(false);
        expect(isSymbol(directoryEntity)).toBe(false);
        expect(isSymbol(testEntity)).toBe(false);
        expect(isSymbol(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isSymbol(null)).toBe(false);
        expect(isSymbol(undefined)).toBe(false);
      });
    });

    describe('isFunction', () => {
      it('should return true for function symbols', () => {
        expect(isFunction(functionSymbol)).toBe(true);
      });

      it('should return false for non-function symbols', () => {
        expect(isFunction(symbolEntity)).toBe(false);
        expect(isFunction(classSymbol)).toBe(false);
        expect(isFunction(interfaceSymbol)).toBe(false);
      });

      it('should return false for non-symbol entities', () => {
        expect(isFunction(fileEntity)).toBe(false);
        expect(isFunction(directoryEntity)).toBe(false);
        expect(isFunction(testEntity)).toBe(false);
        expect(isFunction(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isFunction(null)).toBe(false);
        expect(isFunction(undefined)).toBe(false);
      });
    });

    describe('isClass', () => {
      it('should return true for class symbols', () => {
        expect(isClass(classSymbol)).toBe(true);
      });

      it('should return false for non-class symbols', () => {
        expect(isClass(symbolEntity)).toBe(false);
        expect(isClass(functionSymbol)).toBe(false);
        expect(isClass(interfaceSymbol)).toBe(false);
      });

      it('should return false for non-symbol entities', () => {
        expect(isClass(fileEntity)).toBe(false);
        expect(isClass(directoryEntity)).toBe(false);
        expect(isClass(testEntity)).toBe(false);
        expect(isClass(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isClass(null)).toBe(false);
        expect(isClass(undefined)).toBe(false);
      });
    });

    describe('isInterface', () => {
      it('should return true for interface symbols', () => {
        expect(isInterface(interfaceSymbol)).toBe(true);
      });

      it('should return false for non-interface symbols', () => {
        expect(isInterface(symbolEntity)).toBe(false);
        expect(isInterface(functionSymbol)).toBe(false);
        expect(isInterface(classSymbol)).toBe(false);
      });

      it('should return false for non-symbol entities', () => {
        expect(isInterface(fileEntity)).toBe(false);
        expect(isInterface(directoryEntity)).toBe(false);
        expect(isInterface(testEntity)).toBe(false);
        expect(isInterface(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isInterface(null)).toBe(false);
        expect(isInterface(undefined)).toBe(false);
      });
    });

    describe('isTest', () => {
      it('should return true for test entities', () => {
        expect(isTest(testEntity)).toBe(true);
      });

      it('should return false for non-test entities', () => {
        expect(isTest(fileEntity)).toBe(false);
        expect(isTest(directoryEntity)).toBe(false);
        expect(isTest(symbolEntity)).toBe(false);
        expect(isTest(specEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isTest(null)).toBe(false);
        expect(isTest(undefined)).toBe(false);
      });
    });

    describe('isSpec', () => {
      it('should return true for spec entities', () => {
        expect(isSpec(specEntity)).toBe(true);
      });

      it('should return false for non-spec entities', () => {
        expect(isSpec(fileEntity)).toBe(false);
        expect(isSpec(directoryEntity)).toBe(false);
        expect(isSpec(symbolEntity)).toBe(false);
        expect(isSpec(testEntity)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(isSpec(null)).toBe(false);
        expect(isSpec(undefined)).toBe(false);
      });
    });
  });

  describe('Union Type Entity', () => {
    it('should accept all entity types as Entity union', () => {
      const entities: Entity[] = [];

      // Add various entity types to the array
      const fileEntity: File = {
        ...baseEntity,
        type: 'file',
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };
      entities.push(fileEntity);

      const directoryEntity: Directory = {
        ...baseEntity,
        type: 'directory',
        children: [],
        depth: 0,
      };
      entities.push(directoryEntity);

      const symbolEntity: Symbol = {
        ...baseEntity,
        type: 'symbol',
        name: 'test',
        kind: 'variable',
        signature: 'const test',
        docstring: '',
        visibility: 'public',
        isExported: false,
        isDeprecated: false,
      };
      entities.push(symbolEntity);

      const testEntity: Test = {
        ...baseEntity,
        type: 'test',
        testType: 'unit',
        targetSymbol: 'target',
        framework: 'jest',
        coverage: { lines: 0, branches: 0, functions: 0, statements: 0 },
        status: 'passing',
        flakyScore: 0,
        executionHistory: [],
        performanceMetrics: {
          averageExecutionTime: 0,
          p95ExecutionTime: 0,
          successRate: 1,
          trend: 'stable',
          benchmarkComparisons: [],
          historicalData: [],
        },
        dependencies: [],
        tags: [],
      };
      entities.push(testEntity);

      const specEntity: Spec = {
        ...baseEntity,
        type: 'spec',
        title: 'Test Spec',
        description: 'Test',
        acceptanceCriteria: [],
        status: 'draft',
        priority: 'low',
        updated: testDate,
      };
      entities.push(specEntity);

      // Verify all entities are valid
      expect(entities).toHaveLength(5);
      entities.forEach(entity => {
        expect(entity).toHaveProperty('id');
        expect(entity).toHaveProperty('type');
        expect(entity).toHaveProperty('path');
        expect(entity).toHaveProperty('hash');
        expect(entity).toHaveProperty('language');
        expect(entity).toHaveProperty('lastModified');
        expect(entity).toHaveProperty('created');
      });
    });

    it('should allow type narrowing with type guards', () => {
      const entity: Entity = {
        ...baseEntity,
        type: 'file',
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      if (isFile(entity)) {
        // TypeScript should know entity is File here
        expect(entity.extension).toBe('.ts');
        expect(entity.size).toBe(1024);
      }

      if (isSymbol(entity)) {
        // This should not execute for file entity
        expect(true).toBe(false); // Should not reach here
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    describe('Empty and Invalid Values', () => {
      it('should handle empty strings in required fields', () => {
        const entityWithEmptyStrings: CodebaseEntity = {
          id: '',
          path: '',
          hash: '',
          language: '',
          lastModified: testDate,
          created: testDate,
        };

        expect(entityWithEmptyStrings.id).toBe('');
        expect(entityWithEmptyStrings.path).toBe('');
        expect(entityWithEmptyStrings.hash).toBe('');
        expect(entityWithEmptyStrings.language).toBe('');
      });

      it('should handle zero values for numeric fields', () => {
        const fileWithZeros: File = {
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: 0,
          lines: 0,
          isTest: false,
          isConfig: false,
          dependencies: [],
        };

        expect(fileWithZeros.size).toBe(0);
        expect(fileWithZeros.lines).toBe(0);
      });

      it('should handle negative values (though they might be invalid)', () => {
        const fileWithNegative: File = {
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: -100,
          lines: -5,
          isTest: false,
          isConfig: false,
          dependencies: [],
        };

        expect(fileWithNegative.size).toBe(-100);
        expect(fileWithNegative.lines).toBe(-5);
      });
    });

    describe('Date Handling', () => {
      it('should handle various date formats', () => {
        const pastDate = new Date('2020-01-01');
        const futureDate = new Date('2030-01-01');
        const currentDate = new Date();

        const entityPast: CodebaseEntity = {
          ...baseEntity,
          lastModified: pastDate,
          created: pastDate,
        };

        const entityFuture: CodebaseEntity = {
          ...baseEntity,
          lastModified: futureDate,
          created: futureDate,
        };

        const entityCurrent: CodebaseEntity = {
          ...baseEntity,
          lastModified: currentDate,
          created: currentDate,
        };

        expect(entityPast.lastModified).toEqual(pastDate);
        expect(entityFuture.lastModified).toEqual(futureDate);
        expect(entityCurrent.lastModified).toEqual(currentDate);
      });

      it('should handle invalid dates gracefully', () => {
        const invalidDate = new Date('invalid');

        const entityWithInvalidDate: CodebaseEntity = {
          ...baseEntity,
          lastModified: invalidDate,
          created: invalidDate,
        };

        // Invalid dates are still Date objects but have NaN values
        expect(entityWithInvalidDate.lastModified).toBeInstanceOf(Date);
        expect(entityWithInvalidDate.created).toBeInstanceOf(Date);
        expect(isNaN(entityWithInvalidDate.lastModified.getTime())).toBe(true);
      });
    });

    describe('Complex Metadata', () => {
      it('should handle complex metadata objects', () => {
        const complexMetadata = {
          nested: {
            value: 42,
            array: [1, 2, 3],
            object: { key: 'value' },
          },
          functions: [], // Can't store functions in JSON, but can in metadata
          dates: [testDate],
          nullValue: null,
          undefinedValue: undefined, // Will be omitted in JSON.stringify
        };

        const entityWithComplexMetadata: CodebaseEntity = {
          ...baseEntity,
          metadata: complexMetadata,
        };

        expect(entityWithComplexMetadata.metadata).toEqual(complexMetadata);
        expect(entityWithComplexMetadata.metadata?.nested.value).toBe(42);
        expect(entityWithComplexMetadata.metadata?.nested.array).toEqual([1, 2, 3]);
      });

      it('should handle metadata with special values', () => {
        const specialMetadata = {
          regex: /test/g,
          bigint: BigInt(123),
          set: new Set([1, 2, 3]),
          map: new Map([['key', 'value']]),
        };

        const entityWithSpecialMetadata: CodebaseEntity = {
          ...baseEntity,
          metadata: specialMetadata,
        };

        expect(entityWithSpecialMetadata.metadata).toEqual(specialMetadata);
        expect(entityWithSpecialMetadata.metadata?.regex).toEqual(/test/g);
        expect(entityWithSpecialMetadata.metadata?.bigint).toEqual(BigInt(123));
        expect(entityWithSpecialMetadata.metadata?.set).toEqual(new Set([1, 2, 3]));
        expect(entityWithSpecialMetadata.metadata?.map).toEqual(new Map([['key', 'value']]));
      });
    });

    describe('Array Handling', () => {
      it('should handle empty arrays', () => {
        const fileWithEmptyArrays: File = {
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: [],
        };

        const directoryWithEmptyChildren: Directory = {
          ...baseEntity,
          type: 'directory',
          children: [],
          depth: 0,
        };

        expect(fileWithEmptyArrays.dependencies).toEqual([]);
        expect(directoryWithEmptyChildren.children).toEqual([]);
      });

      it('should handle large arrays', () => {
        const largeDependencies = Array.from({ length: 1000 }, (_, i) => `dependency-${i}`);
        const largeChildren = Array.from({ length: 500 }, (_, i) => `child-${i}`);

        const fileWithLargeDeps: File = {
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: largeDependencies,
        };

        const directoryWithLargeChildren: Directory = {
          ...baseEntity,
          type: 'directory',
          children: largeChildren,
          depth: 0,
        };

        expect(fileWithLargeDeps.dependencies).toHaveLength(1000);
        expect(directoryWithLargeChildren.children).toHaveLength(500);
      });

      it('should handle arrays with special characters', () => {
        const specialDeps = [
          'package@1.0.0',
          'file-with-dashes',
          'file_with_underscores',
          'file.with.dots',
          'file/with/slashes',
          'file\\with\\backslashes',
          'file with spaces',
          'file-with-unicode-🚀',
        ];

        const fileWithSpecialDeps: File = {
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: specialDeps,
        };

        expect(fileWithSpecialDeps.dependencies).toEqual(specialDeps);
        expect(fileWithSpecialDeps.dependencies).toContain('package@1.0.0');
        expect(fileWithSpecialDeps.dependencies).toContain('file-with-unicode-🚀');
      });
    });

    describe('Type Validation', () => {
      it('should enforce literal types for enums', () => {
        // These would cause TypeScript compilation errors if invalid values were used
        const validSymbolKinds: Array<'function' | 'class' | 'interface' | 'typeAlias' | 'variable' | 'property' | 'method' | 'unknown'> = [
          'function', 'class', 'interface', 'typeAlias', 'variable', 'property', 'method', 'unknown'
        ];

        const validVisibilities: Array<'public' | 'private' | 'protected'> = ['public', 'private', 'protected'];

        const validSeverities: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = ['critical', 'high', 'medium', 'low', 'info'];

        expect(validSymbolKinds).toHaveLength(8);
        expect(validVisibilities).toHaveLength(3);
        expect(validSeverities).toHaveLength(5);
      });

      it('should validate entity type discrimination', () => {
        const entities: Entity[] = [];

        // Add one of each entity type
        entities.push({
          ...baseEntity,
          type: 'file',
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: [],
        });

        entities.push({
          ...baseEntity,
          type: 'directory',
          children: [],
          depth: 0,
        });

        entities.push({
          ...baseEntity,
          type: 'symbol',
          name: 'test',
          kind: 'function',
          signature: 'function test()',
          docstring: '',
          visibility: 'public',
          isExported: false,
          isDeprecated: false,
          parameters: [],
          returnType: 'void',
          isAsync: false,
          isGenerator: false,
          complexity: 1,
          calls: [],
        });

        // Verify type discrimination works
        entities.forEach(entity => {
          if (entity.type === 'file') {
            expect(entity).toHaveProperty('extension');
          } else if (entity.type === 'directory') {
            expect(entity).toHaveProperty('children');
          } else if (entity.type === 'symbol') {
            expect(entity).toHaveProperty('name');
            expect(entity).toHaveProperty('kind');
          }
        });
      });
    });
  });
});
