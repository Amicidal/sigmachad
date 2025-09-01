/**
 * Symbol Entity Tests
 * Tests for Symbol-related entity types and type guards
 */

import { describe, it, expect } from '@jest/globals';
import {
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  isSymbol,
  isFunction,
  isClass,
  isInterface,
  FunctionParameter,
} from '../src/models/entities.js';

describe('Symbol Entities', () => {
  describe('FunctionSymbol', () => {
    it('should create a valid FunctionSymbol', () => {
      const funcSymbol: FunctionSymbol = {
        id: 'func_1',
        type: 'symbol',
        name: 'calculateTotal',
        kind: 'function',
        language: 'typescript',
        path: '/src/utils.ts',
        line: 10,
        column: 5,
        signature: 'calculateTotal(a: number, b: number): number',
        parameters: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' }
        ],
        returnType: 'number',
        isExported: true,
        isAsync: false,
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'abc123'
      };

      expect(funcSymbol).toBeDefined();
      expect(funcSymbol.kind).toBe('function');
      expect(funcSymbol.parameters).toHaveLength(2);
      expect(funcSymbol.returnType).toBe('number');
    });

    it('should support async functions', () => {
      const asyncFunc: FunctionSymbol = {
        id: 'async_func',
        type: 'symbol',
        name: 'fetchData',
        kind: 'function',
        language: 'typescript',
        path: '/src/api.ts',
        line: 15,
        column: 10,
        signature: 'fetchData(): Promise<Data>',
        parameters: [],
        returnType: 'Promise<Data>',
        isExported: true,
        isAsync: true,
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'def456'
      };

      expect(asyncFunc.isAsync).toBe(true);
      expect(asyncFunc.returnType).toContain('Promise');
    });

    it('should handle function parameters correctly', () => {
      const param: FunctionParameter = {
        name: 'userId',
        type: 'string',
        optional: false
      };

      expect(param.name).toBe('userId');
      expect(param.type).toBe('string');
      expect(param.optional).toBe(false);
    });

    it('should support optional parameters', () => {
      const optionalParam: FunctionParameter = {
        name: 'options',
        type: 'object',
        optional: true
      };

      expect(optionalParam.optional).toBe(true);
    });
  });

  describe('ClassSymbol', () => {
    it('should create a valid ClassSymbol', () => {
      const classSymbol: ClassSymbol = {
        id: 'class_1',
        type: 'symbol',
        name: 'UserService',
        kind: 'class',
        language: 'typescript',
        path: '/src/services.ts',
        line: 20,
        column: 1,
        signature: 'class UserService',
        isExported: true,
        isAbstract: false,
        extends: null,
        implements: [],
        methods: ['getUser', 'createUser'],
        properties: ['db'],
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'ghi789'
      };

      expect(classSymbol.kind).toBe('class');
      expect(classSymbol.methods).toContain('getUser');
      expect(classSymbol.properties).toContain('db');
      expect(classSymbol.isAbstract).toBe(false);
    });

    it('should support abstract classes', () => {
      const abstractClass: ClassSymbol = {
        id: 'abstract_class',
        type: 'symbol',
        name: 'BaseService',
        kind: 'class',
        language: 'typescript',
        path: '/src/base.ts',
        line: 1,
        column: 1,
        signature: 'abstract class BaseService',
        isExported: true,
        isAbstract: true,
        extends: null,
        implements: [],
        methods: ['initialize'],
        properties: [],
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'jkl012'
      };

      expect(abstractClass.isAbstract).toBe(true);
    });

    it('should support inheritance', () => {
      const childClass: ClassSymbol = {
        id: 'child_class',
        type: 'symbol',
        name: 'ExtendedService',
        kind: 'class',
        language: 'typescript',
        path: '/src/extended.ts',
        line: 25,
        column: 1,
        signature: 'class ExtendedService extends BaseService',
        isExported: true,
        isAbstract: false,
        extends: 'BaseService',
        implements: [],
        methods: ['processData'],
        properties: [],
        dependencies: ['BaseService'],
        lastModified: new Date(),
        created: new Date(),
        hash: 'mno345'
      };

      expect(childClass.extends).toBe('BaseService');
      expect(childClass.dependencies).toContain('BaseService');
    });
  });

  describe('InterfaceSymbol', () => {
    it('should create a valid InterfaceSymbol', () => {
      const interfaceSymbol: InterfaceSymbol = {
        id: 'interface_1',
        type: 'symbol',
        name: 'User',
        kind: 'interface',
        language: 'typescript',
        path: '/src/types.ts',
        line: 5,
        column: 1,
        signature: 'interface User',
        isExported: true,
        extends: [],
        properties: [
          { name: 'id', type: 'number', optional: false },
          { name: 'name', type: 'string', optional: false },
          { name: 'email', type: 'string', optional: true }
        ],
        methods: [],
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'pqr678'
      };

      expect(interfaceSymbol.kind).toBe('interface');
      expect(interfaceSymbol.properties).toHaveLength(3);
      expect(interfaceSymbol.methods).toHaveLength(0);
    });

    it('should support interface extension', () => {
      const extendedInterface: InterfaceSymbol = {
        id: 'extended_interface',
        type: 'symbol',
        name: 'AdminUser',
        kind: 'interface',
        language: 'typescript',
        path: '/src/admin.ts',
        line: 10,
        column: 1,
        signature: 'interface AdminUser extends User',
        isExported: true,
        extends: ['User'],
        properties: [
          { name: 'role', type: 'string', optional: false }
        ],
        methods: ['hasPermission'],
        dependencies: ['User'],
        lastModified: new Date(),
        created: new Date(),
        hash: 'stu901'
      };

      expect(extendedInterface.extends).toContain('User');
      expect(extendedInterface.methods).toContain('hasPermission');
      expect(extendedInterface.dependencies).toContain('User');
    });
  });

  describe('TypeAliasSymbol', () => {
    it('should create a valid TypeAliasSymbol', () => {
      const typeAliasSymbol: TypeAliasSymbol = {
        id: 'type_alias_1',
        type: 'symbol',
        name: 'UserId',
        kind: 'typeAlias',
        language: 'typescript',
        path: '/src/types.ts',
        line: 15,
        column: 1,
        signature: 'type UserId = string | number',
        isExported: true,
        typeDefinition: 'string | number',
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'vwx234'
      };

      expect(typeAliasSymbol.kind).toBe('typeAlias');
      expect(typeAliasSymbol.typeDefinition).toBe('string | number');
    });

    it('should support complex type definitions', () => {
      const complexTypeAlias: TypeAliasSymbol = {
        id: 'complex_type',
        type: 'symbol',
        name: 'ApiResponse',
        kind: 'typeAlias',
        language: 'typescript',
        path: '/src/api.ts',
        line: 20,
        column: 1,
        signature: 'type ApiResponse<T> = { success: boolean; data: T }',
        isExported: true,
        typeDefinition: '{ success: boolean; data: T }',
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'yz567'
      };

      expect(complexTypeAlias.typeDefinition).toContain('success: boolean');
      expect(complexTypeAlias.typeDefinition).toContain('data: T');
    });
  });

  describe('Type Guards', () => {
    it('should identify symbol entities', () => {
      const funcSymbol: FunctionSymbol = {
        id: 'func_1',
        type: 'symbol',
        name: 'testFunc',
        kind: 'function',
        language: 'typescript',
        path: '/test.ts',
        line: 1,
        column: 1,
        signature: 'testFunc()',
        parameters: [],
        returnType: 'void',
        isExported: false,
        isAsync: false,
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'test'
      };

      expect(isSymbol(funcSymbol)).toBe(true);
    });

    it('should identify function symbols', () => {
      const funcSymbol: FunctionSymbol = {
        id: 'func_1',
        type: 'symbol',
        name: 'testFunc',
        kind: 'function',
        language: 'typescript',
        path: '/test.ts',
        line: 1,
        column: 1,
        signature: 'testFunc()',
        parameters: [],
        returnType: 'void',
        isExported: false,
        isAsync: false,
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'test'
      };

      expect(isFunction(funcSymbol)).toBe(true);
      expect(isClass(funcSymbol)).toBe(false);
      expect(isInterface(funcSymbol)).toBe(false);
    });

    it('should identify class symbols', () => {
      const classSymbol: ClassSymbol = {
        id: 'class_1',
        type: 'symbol',
        name: 'TestClass',
        kind: 'class',
        language: 'typescript',
        path: '/test.ts',
        line: 1,
        column: 1,
        signature: 'class TestClass',
        isExported: false,
        isAbstract: false,
        extends: null,
        implements: [],
        methods: [],
        properties: [],
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'test'
      };

      expect(isClass(classSymbol)).toBe(true);
      expect(isFunction(classSymbol)).toBe(false);
      expect(isInterface(classSymbol)).toBe(false);
    });

    it('should identify interface symbols', () => {
      const interfaceSymbol: InterfaceSymbol = {
        id: 'interface_1',
        type: 'symbol',
        name: 'TestInterface',
        kind: 'interface',
        language: 'typescript',
        path: '/test.ts',
        line: 1,
        column: 1,
        signature: 'interface TestInterface',
        isExported: false,
        extends: [],
        properties: [],
        methods: [],
        dependencies: [],
        lastModified: new Date(),
        created: new Date(),
        hash: 'test'
      };

      expect(isInterface(interfaceSymbol)).toBe(true);
      expect(isFunction(interfaceSymbol)).toBe(false);
      expect(isClass(interfaceSymbol)).toBe(false);
    });
  });
});
