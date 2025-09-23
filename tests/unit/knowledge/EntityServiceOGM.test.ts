/**
 * Unit tests for EntityServiceOGM
 * Tests the Neogma OGM implementation of EntityService
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EntityServiceOGM } from "../../../src/services/knowledge/ogm/EntityServiceOGM";
import {
  File,
  FunctionSymbol,
  ClassSymbol,
} from "../../../src/models/entities";

// Mock the models directly instead of trying to mock Neogma
vi.mock("../../../src/services/knowledge/ogm/models/EntityModels", () => ({
  createEntityModels: vi.fn(),
}));

describe("EntityServiceOGM", () => {
  let entityService: EntityServiceOGM;
  let mockModels: any;

  beforeEach(() => {
    // Setup mock models with all required methods
    mockModels = {
      FileModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "FileModel",
      },
      DirectoryModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "DirectoryModel",
      },
      ModuleModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "ModuleModel",
      },
      SymbolModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "SymbolModel",
      },
      FunctionSymbolModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "FunctionSymbolModel",
      },
      ClassSymbolModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "ClassSymbolModel",
      },
      InterfaceSymbolModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "InterfaceSymbolModel",
      },
      TestModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "TestModel",
      },
      SpecificationModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "SpecificationModel",
      },
      DocumentationModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "DocumentationModel",
      },
      EntityModel: {
        findOrCreateOne: vi.fn(),
        findMany: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        createOne: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        name: "EntityModel",
      },
    };

    // Mock NeogmaService to avoid instantiation issues
    const mockNeogmaService = {
      getNeogmaInstance: vi.fn(),
      executeCypher: vi.fn(),
      on: vi.fn(), // EventEmitter method
      emit: vi.fn(), // EventEmitter method
    };

    // Create service instance with mocked models
    entityService = new EntityServiceOGM(mockNeogmaService);
    // Override the models property directly
    (entityService as any).models = mockModels;
  });

  describe("createEntity", () => {
    it("should create a file entity successfully", async () => {
      const file: File = {
        id: "file-1",
        type: "file",
        path: "/src/index.ts",
        hash: "abc123",
        language: "typescript",
        extension: ".ts",
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

      mockModels.FileModel.findMany.mockResolvedValue([]); // No existing entity
      mockModels.FileModel.createOne.mockResolvedValue(mockInstance);

      const result = await entityService.createEntity(file);

      expect(result).toEqual(file);
      expect(mockModels.FileModel.findMany).toHaveBeenCalledWith({
        where: { id: "file-1" },
        limit: 1,
      });
      expect(mockModels.FileModel.createOne).toHaveBeenCalled();
    });

    it("should create a function symbol entity successfully", async () => {
      const func: FunctionSymbol = {
        id: "func-1",
        type: "symbol",
        kind: "function",
        path: "/src/utils.ts",
        hash: "def456",
        language: "typescript",
        name: "calculateSum",
        signature: "(a: number, b: number) => number",
        docstring: "Calculates the sum of two numbers",
        visibility: "public",
        isExported: true,
        isDeprecated: false,
        parameters: [
          { name: "a", type: "number", optional: false },
          { name: "b", type: "number", optional: false },
        ],
        returnType: "number",
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

      mockModels.FunctionSymbolModel.findMany.mockResolvedValue([]); // No existing entity
      mockModels.FunctionSymbolModel.createOne.mockResolvedValue(mockInstance);

      const result = await entityService.createEntity(func);

      expect(result).toEqual(func);
      expect(mockModels.FunctionSymbolModel.findMany).toHaveBeenCalledWith({
        where: { id: "func-1" },
        limit: 1,
      });
      expect(mockModels.FunctionSymbolModel.createOne).toHaveBeenCalled();
    });

    it("should emit entity:created event", async () => {
      const entity = {
        id: "test-1",
        type: "file",
        path: "/test.ts",
        created: new Date(),
        lastModified: new Date(),
      };

      const mockInstance = {
        getDataValues: vi.fn().mockReturnValue(entity),
      };

      mockModels.FileModel.findMany.mockResolvedValue([]); // No existing entity
      mockModels.FileModel.createOne.mockResolvedValue(mockInstance);

      const eventSpy = vi.fn();
      entityService.on("entity:created", eventSpy);

      const result = await entityService.createEntity(entity);

      expect(result).toEqual(entity);
      expect(eventSpy).toHaveBeenCalledWith(entity);
    });
  });

  describe("updateEntity", () => {
    it("should update an existing entity", async () => {
      const existingEntity = {
        id: "entity-1",
        type: "file",
        path: "/old.ts",
        created: new Date(),
        lastModified: new Date(),
      };

      const updates = {
        path: "/new.ts",
      };

      const updatedEntity = {
        ...existingEntity,
        ...updates,
        lastModified: new Date(),
      };

      // Mock getEntity to return existing
      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => existingEntity },
      ]);

      // Mock update
      mockModels.EntityModel.update.mockResolvedValue([
        { getDataValues: () => updatedEntity },
      ]);

      const result = await entityService.updateEntity("entity-1", updates);

      expect(result.path).toBe("/new.ts");
      expect(mockModels.EntityModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/new.ts",
          lastModified: expect.any(Date),
        }),
        { where: { id: "entity-1" } }
      );
    });

    it("should throw error if entity not found", async () => {
      mockModels.EntityModel.findMany.mockResolvedValue([]);

      await expect(
        entityService.updateEntity("non-existent", { path: "/new.ts" })
      ).rejects.toThrow("Entity not found: non-existent");
    });
  });

  describe("getEntity", () => {
    it("should retrieve an entity by ID", async () => {
      const entity = {
        id: "entity-1",
        type: "file",
        path: "/test.ts",
        created: new Date(),
        lastModified: new Date(),
      };

      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      const result = await entityService.getEntity("entity-1");

      expect(result).toEqual(entity);
      expect(mockModels.EntityModel.findMany).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        limit: 1,
      });
    });

    it("should return null if entity not found", async () => {
      mockModels.EntityModel.findMany.mockResolvedValue([]);

      const result = await entityService.getEntity("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("deleteEntity", () => {
    it("should delete an entity with relationships", async () => {
      const entity = {
        id: "entity-1",
        type: "file",
        path: "/test.ts",
        created: new Date(),
        lastModified: new Date(),
      };

      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      mockModels.EntityModel.delete.mockResolvedValue(true);

      await entityService.deleteEntity("entity-1");

      expect(mockModels.EntityModel.delete).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        detach: true,
      });
    });

    it("should emit entity:deleted event", async () => {
      const entity = {
        id: "entity-1",
        type: "file",
        path: "/test.ts",
        created: new Date(),
        lastModified: new Date(),
      };

      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => entity },
      ]);

      mockModels.EntityModel.delete.mockResolvedValue(true);

      const eventSpy = vi.fn();
      entityService.on("entity:deleted", eventSpy);

      await entityService.deleteEntity("entity-1");

      expect(eventSpy).toHaveBeenCalledWith({ id: "entity-1" });
    });

    it("should not throw if entity does not exist", async () => {
      mockModels.EntityModel.findMany.mockResolvedValue([]);

      await expect(
        entityService.deleteEntity("non-existent")
      ).resolves.not.toThrow();
    });
  });

  describe("listEntities", () => {
    it("should list entities with pagination", async () => {
      const entities = [
        {
          id: "entity-1",
          type: "file",
          path: "/test1.ts",
          created: new Date(),
          lastModified: new Date(),
        },
        {
          id: "entity-2",
          type: "file",
          path: "/test2.ts",
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      const mockInstances = entities.map((e) => ({
        getDataValues: () => e,
      }));

      // Mock count query
      mockModels.FileModel.findMany.mockResolvedValueOnce(mockInstances); // for count
      mockModels.FileModel.findMany.mockResolvedValueOnce(mockInstances); // for data

      const result = await entityService.listEntities({
        type: "file",
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by type", async () => {
      mockModels.FileModel.findMany.mockResolvedValue([]);

      await entityService.listEntities({ type: "file" });

      expect(mockModels.FileModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "file" },
        })
      );
    });

    it("should use custom query for name contains filter", async () => {
      // Mock NeogmaService for this specific test
      const mockNeogmaServiceLocal = {
        executeCypher: vi.fn(),
      };
      mockNeogmaServiceLocal.executeCypher.mockResolvedValueOnce([
        { total: 1 },
      ]);
      mockNeogmaServiceLocal.executeCypher.mockResolvedValueOnce([
        {
          n: {
            id: "entity-1",
            type: "file",
            name: "testfile",
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ]);

      // Temporarily override the service's neogmaService for this test
      (entityService as any).neogmaService = mockNeogmaServiceLocal;

      const result = await entityService.listEntities({
        name: "test",
      });

      expect(mockNeogmaServiceLocal.executeCypher).toHaveBeenCalledTimes(2);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("createEntitiesBulk", () => {
    it("should bulk create entities", async () => {
      const entities = [
        {
          id: "entity-1",
          type: "file",
          path: "/test1.ts",
          created: new Date(),
          lastModified: new Date(),
        },
        {
          id: "entity-2",
          type: "file",
          path: "/test2.ts",
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      // Mock createOne for each entity
      mockModels.EntityModel.findMany.mockResolvedValue([]); // No existing entities
      mockModels.EntityModel.createOne
        .mockResolvedValueOnce({ getDataValues: () => entities[0] })
        .mockResolvedValueOnce({ getDataValues: () => entities[1] });

      const result = await entityService.createEntitiesBulk(entities);

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockModels.EntityModel.createOne).toHaveBeenCalledTimes(2);
    });

    it("should skip existing entities when skipExisting is true", async () => {
      const entities = [
        {
          id: "entity-1",
          type: "file",
          path: "/test1.ts",
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      // Mock findMany to return existing entity
      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => entities[0] },
      ]);

      const result = await entityService.createEntitiesBulk(entities, {
        skipExisting: true,
      });

      expect(result.created).toBe(0); // Should skip existing
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockModels.EntityModel.findMany).toHaveBeenCalledWith({
        where: { id: entities[0].id },
        limit: 1,
      });
      expect(mockModels.EntityModel.createOne).not.toHaveBeenCalled();
    });

    it("should update existing entities when updateExisting is true", async () => {
      const entities = [
        {
          id: "entity-1",
          type: "file",
          path: "/test1.ts",
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      // Mock findMany to return existing entity
      mockModels.EntityModel.findMany.mockResolvedValue([
        { getDataValues: () => entities[0] },
      ]);
      mockModels.EntityModel.update.mockResolvedValue([
        { getDataValues: () => entities[0] },
      ]);

      const result = await entityService.createEntitiesBulk(entities, {
        updateExisting: true,
      });

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
      expect(mockModels.EntityModel.findMany).toHaveBeenCalledWith({
        where: { id: entities[0].id },
        limit: 1,
      });
      expect(mockModels.EntityModel.update).toHaveBeenCalled();
    });
  });

  describe("findEntitiesByProperties", () => {
    it("should find entities matching properties", async () => {
      const properties = {
        type: "file",
        extension: ".ts",
      };

      const entities = [
        {
          id: "entity-1",
          type: "file",
          extension: ".ts",
          path: "/test1.ts",
          created: new Date(),
          lastModified: new Date(),
        },
      ];

      const mockInstances = entities.map((e) => ({ getDataValues: () => e }));
      mockModels.EntityModel.findMany.mockResolvedValue(mockInstances);

      const result = await entityService.findEntitiesByProperties(properties);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entities[0]);
      expect(mockModels.EntityModel.findMany).toHaveBeenCalledWith({
        where: properties,
      });
    });
  });
});
