/**
 * Unit tests for EntityServiceOGM
 * Tests the Neogma OGM implementation of EntityService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityServiceOGM } from '../../../../src/services/knowledge/ogm/EntityServiceOGM';
import { NeogmaService } from '../../../../src/services/knowledge/ogm/NeogmaService';
import { File, FunctionSymbol, ClassSymbol } from '../../../../src/models/entities';

// Mock NeogmaService
vi.mock('../../../../src/services/knowledge/ogm/NeogmaService');

describe('EntityServiceOGM', () => {
  let entityService: EntityServiceOGM;
  let mockNeogmaService: any;
  let mockNeogmaInstance: any;
  let mockModel: any;

  beforeEach(() => {
    // Setup mock model
    mockModel = {
      findOrCreateOne: vi.fn(),
      findMany: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      name: 'MockModel',
    };

    // Setup mock Neogma instance
    mockNeogmaInstance = {
      model: vi.fn().mockReturnValue(mockModel),
      queryRunner: {
        run: vi.fn().mockResolvedValue({
          records: [{ get: vi.fn().mockReturnValue(1) }],
        }),
      },
    };

    // Setup mock NeogmaService
    mockNeogmaService = {
      getNeogmaInstance: vi.fn().mockReturnValue(mockNeogmaInstance),
      executeCypher: vi.fn(),
    };

    // Create service instance
    entityService = new EntityServiceOGM(mockNeogmaService);
  });

  describe('createEntity', () => {
    it('should create a file entity successfully', async () => {
      const file: File = {
        id: 'file-1',
        type: 'file',
        path: '/src/index.ts',
        hash: 'abc123',
        language: 'typescript',
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
        created: new Date(),
        lastModified: new Date(),
      };

      const mockInstance = {
        getDataValues: vi.fn().mockReturnValue(file),
      };

      mockModel.findOrCreateOne.mockResolvedValue(mockInstance);

      const result = await entityService.createEntity(file);

      expect(result).toEqual(file);
      expect(mockModel.findOrCreateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-1' },
        }),
        expect.any(Object)
      );
    });

    it('should create a function symbol entity successfully', async () => {
      const func: FunctionSymbol = {
        id: 'func-1',
        type: 'symbol',
        kind: 'function',
        path: '/src/utils.ts',
        hash: 'def456',
        language: 'typescript',
        name: 'calculateSum',
        signature: '(a: number, b: number) => number',
        docstring: 'Calculates the sum of two numbers',
        visibility: 'public',
        isExported: true,
        isDeprecated: false,
        parameters: [
          { name: 'a', type: 'number', optional: false },
          { name: 'b', type: 'number', optional: false },
        ],
        returnType: 'number',
        isAsync: false,
        isGenerator: false,
        complexity: 1,
        calls: [],
        created: new Date(),
        lastModified: new Date(),
      };

      const mockInstance = {
        getDataValues: vi.fn().mockReturnValue(func),
      };

      mockModel.findOrCreateOne.mockResolvedValue(mockInstance);

      const result = await entityService.createEntity(func);

      expect(result).toEqual(func);
      expect(mockModel.findOrCreateOne).toHaveBeenCalled();
    });

    it('should emit entity:created event', async () => {
      const entity = {
        id: 'test-1',
        type: 'file',
        path: '/test.ts',
        created: new Date(),
        lastModified: new Date(),
      };

      const mockInstance = {
        getDataValues: vi.fn().mockReturnValue(entity),
      };

      mockModel.findOrCreateOne.mockResolvedValue(mockInstance);

      const eventSpy = vi.fn();
      entityService.on('entity:created', eventSpy);

      await entityService.createEntity(entity);

      expect(eventSpy).toHaveBeenCalledWith(entity);
    });
  });

  describe('updateEntity', () => {
    it('should update an existing entity', async () => {
      const existingEntity = {
        id: 'entity-1',
        type: 'file',
        path: '/old.ts',
        created: new Date(),
        lastModified: new Date(),
      };

      const updates = {
        path: '/new.ts',
      };

      const updatedEntity = {
        ...existingEntity,
        ...updates,
        lastModified: new Date(),
      };

      // Mock getEntity to return existing
      mockModel.findMany.mockResolvedValue([
        { getDataValues: () => existingEntity },
      ]);

      // Mock update
      mockModel.update.mockResolvedValue([
        { getDataValues: () => updatedEntity },
      ]);

      const result = await entityService.updateEntity('entity-1', updates);

      expect(result.path).toBe('/new.ts');
      expect(mockModel.update).toHaveBeenCalledWith(
        { where: { id: 'entity-1' } },
        expect.objectContaining({
          properties: expect.objectContaining({
            path: '/new.ts',
          }),
        })
      );
    });

    it('should throw error if entity not found', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await expect(
        entityService.updateEntity('non-existent', { path: '/new.ts' })
      ).rejects.toThrow('Entity not found: non-existent');
    });
  });

  describe('getEntity', () => {
    it('should retrieve an entity by ID', async () => {
      const entity = {
        id: 'entity-1',
        type: 'file',
        path: '/test.ts',
        created: new Date(),
        lastModified: new Date(),
      };

      mockModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      const result = await entityService.getEntity('entity-1');

      expect(result).toEqual(entity);
      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        limit: 1,
      });
    });

    it('should return null if entity not found', async () => {
      mockModel.findMany.mockResolvedValue([]);

      const result = await entityService.getEntity('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteEntity', () => {
    it('should delete an entity with relationships', async () => {
      const entity = {
        id: 'entity-1',
        type: 'file',
        path: '/test.ts',
        created: new Date(),
        lastModified: new Date(),
      };

      mockModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      mockModel.delete.mockResolvedValue(true);

      await entityService.deleteEntity('entity-1');

      expect(mockModel.delete).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        detach: true,
      });
    });

    it('should emit entity:deleted event', async () => {
      const entity = {
        id: 'entity-1',
        type: 'file',
        path: '/test.ts',
        created: new Date(),
        lastModified: new Date(),
      };

      mockModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      mockModel.delete.mockResolvedValue(true);

      const eventSpy = vi.fn();
      entityService.on('entity:deleted', eventSpy);

      await entityService.deleteEntity('entity-1');

      expect(eventSpy).toHaveBeenCalledWith({ id: 'entity-1' });
    });

    it('should not throw if entity does not exist', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await expect(
        entityService.deleteEntity('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('listEntities', () => {
    it('should list entities with pagination', async () => {
      const entities = [
        {
          id: 'entity-1',
          type: 'file',
          path: '/test1.ts',
          created: new Date(),
          lastModified: new Date(),
        },
        {
          id: 'entity-2',
          type: 'file',
          path: '/test2.ts',
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      const mockInstances = entities.map(e => ({
        getDataValues: () => e,
      }));

      // Mock count query
      mockModel.findMany.mockResolvedValueOnce(mockInstances); // for count
      mockModel.findMany.mockResolvedValueOnce(mockInstances); // for data

      const result = await entityService.listEntities({
        type: 'file',
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by type', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await entityService.listEntities({ type: 'file' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'file' },
        })
      );
    });

    it('should use custom query for name contains filter', async () => {
      mockNeogmaService.executeCypher.mockResolvedValueOnce([{ total: 1 }]);
      mockNeogmaService.executeCypher.mockResolvedValueOnce([
        {
          n: {
            id: 'entity-1',
            type: 'file',
            name: 'testfile',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ]);

      const result = await entityService.listEntities({
        name: 'test',
      });

      expect(mockNeogmaService.executeCypher).toHaveBeenCalledTimes(2);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('createEntitiesBulk', () => {
    it('should bulk create entities', async () => {
      const entities = [
        {
          id: 'entity-1',
          type: 'file',
          path: '/test1.ts',
          created: new Date(),
          lastModified: new Date(),
        },
        {
          id: 'entity-2',
          type: 'file',
          path: '/test2.ts',
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      mockModel.createMany.mockResolvedValue(
        entities.map(e => ({ getDataValues: () => e }))
      );

      const result = await entityService.createEntitiesBulk(entities);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should skip existing entities when skipExisting is true', async () => {
      const entities = [
        {
          id: 'entity-1',
          type: 'file',
          path: '/test1.ts',
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      mockModel.createMany.mockResolvedValue([]);

      const result = await entityService.createEntitiesBulk(entities, {
        skipExisting: true,
      });

      expect(mockModel.createMany).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ validate: false })
      );
    });

    it('should update existing entities when updateExisting is true', async () => {
      const entities = [
        {
          id: 'entity-1',
          type: 'file',
          path: '/test1.ts',
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      mockModel.findOne.mockResolvedValue({ getDataValues: () => entities[0] });
      mockModel.update.mockResolvedValue([{ getDataValues: () => entities[0] }]);

      const result = await entityService.createEntitiesBulk(entities, {
        updateExisting: true,
      });

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  describe('findEntitiesByProperties', () => {
    it('should find entities matching properties', async () => {
      const properties = {
        type: 'file',
        extension: '.ts',
      };

      const entities = [
        {
          id: 'entity-1',
          type: 'file',
          extension: '.ts',
          path: '/test1.ts',
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      mockModel.findMany.mockResolvedValue(
        entities.map(e => ({ getDataValues: () => e }))
      );

      const result = await entityService.findEntitiesByProperties(properties);

      expect(result).toHaveLength(1);
      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: properties,
      });
    });
  });
});