/**
 * Unit tests for MaintenanceService
 * Tests maintenance task execution, task management, and error handling with real functionality tests
 */

/// <reference types="node" />

// Declare globals for test environment
declare const process: any;

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import {
  MaintenanceService,
  MaintenanceTask,
  MaintenanceResult,
} from "../../../src/services/MaintenanceService";
import {
  DatabaseService,
  DatabaseConfig,
} from "../../../src/services/DatabaseService";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService";
import * as crypto from "crypto";

// Import realistic mocks
import {
  createLightweightDatabaseMocks,
  type LightweightDatabaseMocks,
} from "../../test-utils/realistic-mocks";

// Mock crypto
vi.mock("crypto");

// Mock console methods for cleaner test output
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe("MaintenanceService", () => {
  let maintenanceService: MaintenanceService;
  let mockDbService: DatabaseService;
  let mockKgService: KnowledgeGraphService;
  let dbMocks: LightweightDatabaseMocks;
  let testConfig: DatabaseConfig;

  beforeAll(() => {
    // Silence console output during tests
    console.warn = vi.fn();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterAll(() => {
    // Restore console output
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(async () => {
    // Mock crypto
    (crypto.createHash as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue("mock-checksum"),
    });

    // Setup test configuration
    testConfig = {
      falkordb: {
        url: "redis://localhost:6379",
        database: 0,
      },
      qdrant: {
        url: "http://localhost:6333",
        apiKey: "test-api-key",
      },
      postgresql: {
        connectionString: "postgresql://test:test@localhost:5432/test",
        max: 10,
        idleTimeoutMillis: 30000,
      },
      redis: {
        url: "redis://localhost:6379",
      },
    };

    dbMocks = createLightweightDatabaseMocks();

    mockDbService = new DatabaseService(testConfig, {
      falkorFactory: () => dbMocks.falkor,
      qdrantFactory: () => dbMocks.qdrant,
      postgresFactory: () => dbMocks.postgres,
      redisFactory: () => dbMocks.redis,
    });
    await mockDbService.initialize();

    // Default DB calls return empty structures unless overridden per test
    vi.spyOn(mockDbService, "falkordbQuery").mockResolvedValue([]);
    vi.spyOn(mockDbService, "postgresQuery").mockResolvedValue([]);

    // Create mock KnowledgeGraph service
    mockKgService = {
      deleteEntity: vi.fn().mockResolvedValue(undefined),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      listEntities: vi.fn().mockResolvedValue({
        entities: [
          {
            id: "entity1",
            type: "file",
            hash: "hash1",
            lastModified: new Date(),
          },
          {
            id: "entity2",
            type: "function",
            hash: "hash2",
            lastModified: new Date(),
          },
        ],
        total: 2,
      }),
      listRelationships: vi.fn().mockResolvedValue({
        relationships: [
          { id: "rel1", fromEntityId: "entity1", toEntityId: "entity2" },
          { id: "rel2", fromEntityId: "entity2", toEntityId: "entity1" },
        ],
        total: 2,
      }),
      getEntity: vi.fn().mockResolvedValue({
        id: "entity1",
        type: "file",
        hash: "hash1",
        lastModified: new Date(),
      }),
    } as any;

    // Create maintenance service
    maintenanceService = new MaintenanceService(mockDbService, mockKgService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Maintenance Task Execution", () => {
    describe("Cleanup Task", () => {
      it("should execute cleanup task successfully", async () => {
        // Mock orphaned entities query to return some entities
        (mockDbService as any).falkordbQuery
          .mockResolvedValueOnce([{ id: "orphan1" }, { id: "orphan2" }]) // findOrphanedEntities
          .mockResolvedValueOnce([{ id: "dangling1" }]); // findDanglingRelationships

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.any(Object));
        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.taskId).toMatch(/^cleanup_\d+$/);
        expect(result.changes).toEqual(expect.any(Object));
        expect(result.statistics).toEqual(expect.any(Object));
        expect(result.statistics.entitiesRemoved).toBe(2);
        expect(result.statistics.relationshipsRemoved).toBe(1);
        expect(mockKgService.deleteEntity).toHaveBeenCalledWith("orphan1");
        expect(mockKgService.deleteEntity).toHaveBeenCalledWith("orphan2");
        expect(mockKgService.deleteRelationship).toHaveBeenCalledWith(
          "dangling1"
        );
      });

      it("should handle cleanup task failures gracefully", async () => {
        // Mock database query to fail
        (mockDbService as any).falkordbQuery.mockRejectedValue(
          new Error("Database error")
        );

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.any(Object));
        expect(result).toEqual(expect.objectContaining({ success: true })); // Service continues despite some failures
        expect(result.statistics.entitiesRemoved).toBe(0);
        expect(result.statistics.relationshipsRemoved).toBe(0);
      });

      it("should handle empty cleanup results", async () => {
        // Mock no orphaned entities or relationships
        (mockDbService as any).falkordbQuery.mockResolvedValue([]);

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.entitiesRemoved).toBe(0);
        expect(result.statistics.relationshipsRemoved).toBe(0);
        expect(result.changes).toHaveLength(0);
      });
    });

    describe("Optimization Task", () => {
      it("should execute optimization task successfully", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }, { name: "collection2" }],
        });

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toBeDefined();
        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.taskId).toMatch(/^optimize_\d+$/);
        expect(result.statistics.optimizedCollections).toBe(2);
        expect(result.statistics.vacuumedTables).toBe(1);
        expect(mockQdrantClient.updateCollection).toHaveBeenCalledTimes(2);
        expect(mockDbService.postgresQuery).toHaveBeenCalledWith(
          "VACUUM ANALYZE"
        );
      });

      it("should handle Qdrant collection optimization failures", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }],
        });
        mockQdrantClient.updateCollection = vi
          .fn()
          .mockRejectedValue(new Error("Optimization failed"));

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true })); // Service continues despite failures
        expect(result.statistics.optimizedCollections).toBe(0); // No collections optimized due to failure
      });

      it("should handle PostgreSQL optimization failures", async () => {
        (mockDbService as any).postgresQuery.mockRejectedValue(
          new Error("VACUUM failed")
        );

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true })); // Service continues despite failures
        expect(result.statistics.vacuumedTables).toBe(0);
      });
    });

    describe("Reindexing Task", () => {
      it("should execute reindexing task successfully", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }, { name: "collection2" }],
        });
        mockQdrantClient.getCollection = vi
          .fn()
          .mockResolvedValue({ config: {} });

        // Mock PostgreSQL tables query
        (mockDbService as any).postgresQuery
          .mockResolvedValueOnce([
            { tablename: "users" },
            { tablename: "projects" },
          ])
          .mockResolvedValueOnce(undefined) // REINDEX TABLE users
          .mockResolvedValueOnce(undefined); // REINDEX TABLE projects

        // Mock FalkorDB command
        (mockDbService as any).falkordbQuery.mockResolvedValue(undefined);

        const result = await maintenanceService.runMaintenanceTask("reindex");

        expect(result).toBeDefined();
        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.taskId).toMatch(/^reindex_\d+$/);
        expect(result.statistics.collectionsReindexed).toBe(2);
        expect(result.statistics.tablesReindexed).toBe(2);
        expect(mockDbService.postgresQuery).toHaveBeenCalledWith(
          "REINDEX TABLE users"
        );
        expect(mockDbService.postgresQuery).toHaveBeenCalledWith(
          "REINDEX TABLE projects"
        );
      });

      it("should handle Qdrant reindexing failures", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }],
        });
        mockQdrantClient.getCollection = vi
          .fn()
          .mockRejectedValue(new Error("Reindex failed"));

        const result = await maintenanceService.runMaintenanceTask("reindex");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.collectionsReindexed).toBe(0);
      });

      it("should handle PostgreSQL reindexing failures", async () => {
        (mockDbService as any).postgresQuery
          .mockResolvedValueOnce([{ tablename: "users" }])
          .mockRejectedValueOnce(new Error("REINDEX failed"));

        const result = await maintenanceService.runMaintenanceTask("reindex");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.tablesReindexed).toBe(0);
      });
    });

    describe("Validation Task", () => {
      it("should execute validation task successfully", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }],
        });
        mockQdrantClient.getCollection = vi
          .fn()
          .mockResolvedValue({ points_count: 100 });

        // Mock valid entities and relationships
        mockKgService.listEntities = vi.fn().mockResolvedValue({
          entities: [
            {
              id: "entity1",
              type: "file",
              hash: "hash1",
              lastModified: new Date(),
            },
            {
              id: "entity2",
              type: "function",
              hash: "hash2",
              lastModified: new Date(),
            },
          ],
          total: 2,
        });

        mockKgService.listRelationships = vi.fn().mockResolvedValue({
          relationships: [
            { id: "rel1", fromEntityId: "entity1", toEntityId: "entity2" },
          ],
          total: 1,
        });

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result).toBeDefined();
        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.taskId).toMatch(/^validate_\d+$/);
        expect(result.statistics.invalidEntities).toBe(0);
        expect(result.statistics.invalidRelationships).toBe(0);
        expect(result.statistics.validatedCollections).toBe(1);
      });

      it("should detect invalid entities", async () => {
        mockKgService.listEntities = vi.fn().mockResolvedValue({
          entities: [
            { id: "invalid1", type: "", hash: "", lastModified: null }, // Invalid entity
            {
              id: "valid1",
              type: "file",
              hash: "hash1",
              lastModified: new Date(),
            }, // Valid entity
          ],
          total: 2,
        });

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result.statistics.invalidEntities).toBe(1);
        expect(result.changes).toContainEqual({
          type: "invalid_entity",
          id: "invalid1",
          issues: ["missing type", "missing hash", "missing lastModified"],
        });
      });

      it("should detect invalid relationships", async () => {
        mockKgService.listEntities = vi.fn().mockResolvedValue({
          entities: [
            {
              id: "entity1",
              type: "file",
              hash: "hash1",
              lastModified: new Date(),
            },
          ],
          total: 1,
        });

        mockKgService.listRelationships = vi.fn().mockResolvedValue({
          relationships: [
            { id: "rel1", fromEntityId: "entity1", toEntityId: "nonexistent" }, // Invalid relationship
          ],
          total: 1,
        });

        mockKgService.getEntity = vi
          .fn()
          .mockResolvedValueOnce({
            id: "entity1",
            type: "file",
            hash: "hash1",
            lastModified: new Date(),
          }) // fromEntity exists
          .mockResolvedValueOnce(null); // toEntity doesn't exist

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result.statistics.invalidRelationships).toBe(1);
        expect(result.changes).toContainEqual({
          type: "invalid_relationship",
          id: "rel1",
        });
      });

      it("should handle Qdrant validation failures", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }],
        });
        mockQdrantClient.getCollection = vi
          .fn()
          .mockRejectedValue(new Error("Validation failed"));

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.integrityIssues).toBe(1);
        expect(result.statistics.validatedCollections).toBe(0);
      });
    });

    describe("Unknown Task Type", () => {
      it("should throw error for unknown maintenance task type", async () => {
        await expect(
          maintenanceService.runMaintenanceTask("unknown")
        ).rejects.toThrow("Unknown maintenance task: unknown");
      });
    });
  });

  describe("Task Management", () => {
    describe("Active Tasks Tracking", () => {
      it("should track active maintenance tasks", async () => {
        // Start a cleanup task (async operation)
        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");

        // Check active tasks during execution
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks).toHaveLength(1);
        expect(activeTasks[0].name).toBe("Database Cleanup");
        expect(activeTasks[0].status).toBe("running");
        expect(activeTasks[0].type).toBe("cleanup");

        // Wait for completion
        await cleanupPromise;

        // Check that task is no longer active
        const activeTasksAfter = maintenanceService.getActiveTasks();
        expect(activeTasksAfter).toHaveLength(0);
      });

      it("should track task status correctly", async () => {
        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");

        // Get the task ID from active tasks
        const activeTasks = maintenanceService.getActiveTasks();
        const taskId = activeTasks[0].id;

        // Check task status during execution
        const taskStatus = maintenanceService.getTaskStatus(taskId);
        expect(taskStatus).toBeDefined();
        expect(taskStatus!.status).toBe("running");
        expect(taskStatus!.progress).toBe(0);

        // Wait for completion
        await cleanupPromise;

        // Task should be removed from active tasks after completion
        const taskStatusAfter = maintenanceService.getTaskStatus(taskId);
        expect(taskStatusAfter).toBeUndefined();
      });

      it("should handle multiple concurrent tasks", async () => {
        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");
        const optimizePromise =
          maintenanceService.runMaintenanceTask("optimize");

        // Check that both tasks are active
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks).toHaveLength(2);

        const taskTypes = activeTasks.map((task) => task.type);
        expect(taskTypes).toContain("cleanup");
        expect(taskTypes).toContain("optimize");

        // Wait for both to complete
        await Promise.all([cleanupPromise, optimizePromise]);

        // No active tasks should remain
        const activeTasksAfter = maintenanceService.getActiveTasks();
        expect(activeTasksAfter).toHaveLength(0);
      });
    });

    describe("Task Metadata", () => {
      it("should provide correct task names", () => {
        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");
        const activeTasks = maintenanceService.getActiveTasks();

        expect(activeTasks[0].name).toBe("Database Cleanup");
        expect(activeTasks[0].description).toContain(
          "Remove orphaned entities"
        );

        cleanupPromise.catch(() => {}); // Ignore promise rejection for test
      });

      it("should provide correct task descriptions", () => {
        const optimizePromise =
          maintenanceService.runMaintenanceTask("optimize");
        const activeTasks = maintenanceService.getActiveTasks();

        expect(activeTasks[0].name).toBe("Performance Optimization");
        expect(activeTasks[0].description).toContain(
          "Optimize database performance"
        );

        optimizePromise.catch(() => {}); // Ignore promise rejection for test
      });

      it("should provide correct estimated durations", () => {
        const reindexPromise = maintenanceService.runMaintenanceTask("reindex");
        const activeTasks = maintenanceService.getActiveTasks();

        expect(activeTasks[0].name).toBe("Index Rebuilding");
        expect(activeTasks[0].estimatedDuration).toBe("10-15 minutes");

        reindexPromise.catch(() => {}); // Ignore promise rejection for test
      });
    });
  });

  describe("Error Handling and Failure Scenarios", () => {
    describe("Task Execution Failures", () => {
      it("should handle task execution failures and update task status", async () => {
        // Mock database service to fail via public method spy
        vi.spyOn(mockDbService, "getQdrantClient").mockImplementation(() => {
          throw new Error("Qdrant connection failed");
        });

        try {
          await maintenanceService.runMaintenanceTask("optimize");
        } catch (error) {
          // Expected to throw
        }

        // Task should be marked as failed and removed from active tasks
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks).toHaveLength(0); // Task should be cleaned up
      });

      it("should propagate errors for critical failures", async () => {
        // Mock an unknown task type handling error
        const originalSwitch = (maintenanceService as any).runCleanup;
        (maintenanceService as any).runCleanup = vi
          .fn()
          .mockRejectedValue(new Error("Critical failure"));

        await expect(
          maintenanceService.runMaintenanceTask("cleanup")
        ).rejects.toThrow("Critical failure");

        // Restore original method
        (maintenanceService as any).runCleanup = originalSwitch;
      });

      it("should handle database connection failures gracefully", async () => {
        // Mock database service methods to throw initialization errors
        vi.spyOn(mockDbService, "falkordbQuery").mockImplementation(() => {
          throw new Error("Database not initialized");
        });

        // The maintenance service is designed to be resilient and continue despite failures
        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.objectContaining({ success: true })); // Service continues despite failures
        expect(result.statistics.entitiesRemoved).toBe(0); // No entities were removed due to failure
        expect(result.changes).toHaveLength(0); // No changes were recorded
      });
    });

    describe("Partial Failures", () => {
      it("should handle partial failures in cleanup operations", async () => {
        // Mock the first delete operation to fail
        let deleteCallCount = 0;
        mockKgService.deleteEntity = vi
          .fn()
          .mockImplementation(async (entityId: string) => {
            deleteCallCount++;
            if (entityId === "orphan1") {
              throw new Error("Delete failed for orphan1");
            }
            return Promise.resolve();
          });

        (mockDbService as any).falkordbQuery
          .mockResolvedValueOnce([{ id: "orphan1" }, { id: "orphan2" }])
          .mockResolvedValueOnce([]);

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.objectContaining({ success: true })); // Service continues despite failures (wrapped in try-catch)
        expect(result.statistics.entitiesRemoved).toBe(0); // No entities removed due to first failure stopping the loop
        expect(result.statistics.orphanedRecords).toBe(2); // Both were found as orphaned
        expect(deleteCallCount).toBe(1); // Only first delete operation was attempted (loop stopped)
      });

      it("should continue execution despite partial failures in optimization", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.updateCollection = vi
          .fn()
          .mockRejectedValueOnce(new Error("Collection 1 failed"))
          .mockResolvedValueOnce(undefined);

        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "collection1" }, { name: "collection2" }],
        });

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.optimizedCollections).toBe(1); // Only one succeeded
      });
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    describe("Empty Results", () => {
      it("should handle empty entity lists during validation", async () => {
        mockKgService.listEntities = vi.fn().mockResolvedValue({
          entities: [],
          total: 0,
        });
        mockKgService.listRelationships = vi.fn().mockResolvedValue({
          relationships: [],
          total: 0,
        });

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.invalidEntities).toBe(0);
        expect(result.statistics.invalidRelationships).toBe(0);
      });

      it("should handle empty collection lists during optimization", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [],
        });

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.optimizedCollections).toBe(0);
      });

      it("should handle empty table lists during reindexing", async () => {
        (mockDbService as any).postgresQuery.mockResolvedValue([]);

        const result = await maintenanceService.runMaintenanceTask("reindex");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.tablesReindexed).toBe(0);
      });
    });

    describe("Large Datasets", () => {
      it("should handle large numbers of orphaned entities", async () => {
        const largeOrphanedList = Array.from({ length: 150 }, (_, i) => ({
          id: `orphan${i}`,
        }));

        (mockDbService as any).falkordbQuery
          .mockResolvedValueOnce(largeOrphanedList)
          .mockResolvedValueOnce([]);

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.entitiesRemoved).toBe(150);
        expect(mockKgService.deleteEntity).toHaveBeenCalledTimes(150);
      });

      it("should handle large numbers of collections during optimization", async () => {
        const largeCollectionsList = Array.from({ length: 50 }, (_, i) => ({
          name: `collection${i}`,
        }));

        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: largeCollectionsList,
        });
        mockQdrantClient.updateCollection = vi.fn().mockResolvedValue({});

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.optimizedCollections).toBe(50);
        expect(mockQdrantClient.updateCollection).toHaveBeenCalledTimes(50);
      });
    });

    describe("Timing and Performance", () => {
      it("should calculate task duration correctly", async () => {
        const startTime = Date.now();
        const result = await maintenanceService.runMaintenanceTask("cleanup");
        const endTime = Date.now();

        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 100); // Allow some tolerance
      });

      it("should update task progress correctly", async () => {
        const taskPromise = maintenanceService.runMaintenanceTask("cleanup");

        // Check initial progress
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks[0].progress).toBe(0);

        await taskPromise;

        // After completion, task should be removed (progress would be 100 if still active)
        const activeTasksAfter = maintenanceService.getActiveTasks();
        expect(activeTasksAfter).toHaveLength(0);
      });
    });
  });

  describe("Integration Scenarios", () => {
    describe("End-to-End Task Execution", () => {
      it("should execute complete cleanup workflow", async () => {
        // Setup realistic data
        (mockDbService as any).falkordbQuery
          .mockResolvedValueOnce([{ id: "orphan1" }]) // Orphaned entities
          .mockResolvedValueOnce([{ id: "dangling1" }]); // Dangling relationships

        const result = await maintenanceService.runMaintenanceTask("cleanup");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.changes.length).toBeGreaterThan(0);
        expect(result.statistics.entitiesRemoved).toBe(1);
        expect(result.statistics.relationshipsRemoved).toBe(1);

        // Verify cleanup operations were called
        expect(mockKgService.deleteEntity).toHaveBeenCalledWith("orphan1");
        expect(mockKgService.deleteRelationship).toHaveBeenCalledWith(
          "dangling1"
        );
      });

      it("should execute complete optimization workflow", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "test-collection" }],
        });

        const result = await maintenanceService.runMaintenanceTask("optimize");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.optimizedCollections).toBe(1);
        expect(result.statistics.vacuumedTables).toBe(1);

        // Verify optimization operations
        expect(mockQdrantClient.updateCollection).toHaveBeenCalled();
        expect(mockDbService.postgresQuery).toHaveBeenCalledWith(
          "VACUUM ANALYZE"
        );
      });

      it("should execute complete validation workflow", async () => {
        const mockQdrantClient = mockDbService.getQdrantClient();
        mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
          collections: [{ name: "test-collection" }],
        });
        mockQdrantClient.getCollection = vi
          .fn()
          .mockResolvedValue({ points_count: 100 });

        const result = await maintenanceService.runMaintenanceTask("validate");

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.statistics.validatedCollections).toBe(1);
        expect(result.statistics.integrityIssues).toBe(0);
      });
    });

    describe("Concurrent Task Handling", () => {
      it("should handle multiple maintenance tasks running concurrently", async () => {
        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");
        const optimizePromise =
          maintenanceService.runMaintenanceTask("optimize");
        const validatePromise =
          maintenanceService.runMaintenanceTask("validate");

        // All tasks should be tracked as active
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks.length).toBe(3);

        // Wait for all tasks to complete
        const results = await Promise.all([
          cleanupPromise,
          optimizePromise,
          validatePromise,
        ]);

        // All results should be successful
        results.forEach((result) => {
          expect(result).toEqual(expect.objectContaining({ success: true }));
        });

        // No active tasks should remain
        const activeTasksAfter = maintenanceService.getActiveTasks();
        expect(activeTasksAfter).toHaveLength(0);
      });

      it("should handle task failures without affecting other concurrent tasks", async () => {
        // Mock one task to fail
        const originalOptimize = (maintenanceService as any).runOptimization;
        (maintenanceService as any).runOptimization = vi
          .fn()
          .mockRejectedValue(new Error("Optimization failed"));

        const cleanupPromise = maintenanceService.runMaintenanceTask("cleanup");
        const optimizePromise = maintenanceService
          .runMaintenanceTask("optimize")
          .catch(() => ({})); // Ignore error
        const validatePromise =
          maintenanceService.runMaintenanceTask("validate");

        // Wait for tasks to complete (optimize will fail but others should succeed)
        await Promise.allSettled([
          cleanupPromise,
          optimizePromise,
          validatePromise,
        ]);

        // Check final state
        const activeTasks = maintenanceService.getActiveTasks();
        expect(activeTasks).toHaveLength(0); // All tasks should be cleaned up
      });
    });
  });

  describe("Helper Methods", () => {
    describe("Entity Validation", () => {
      it("should validate valid entities correctly", () => {
        const validEntity = {
          id: "test-entity",
          type: "file",
          hash: "test-hash",
          lastModified: new Date(),
        };

        // Access private method through type assertion
        const maintenanceServiceAny = maintenanceService as any;
        const isValid = maintenanceServiceAny.isValidEntity(validEntity);
        expect(isValid).toBeTruthy(); // Method returns truthy value (Date object), not boolean true
      });

      it("should detect invalid entities", () => {
        const invalidEntity = {
          id: null,
          type: "",
          hash: "",
          lastModified: null,
        };

        // Access private method through type assertion
        const maintenanceServiceAny = maintenanceService as any;
        const isValid = maintenanceServiceAny.isValidEntity(invalidEntity);
        expect(isValid).toBeFalsy(); // Method returns falsy value (null), not boolean false

        const issues = maintenanceServiceAny.getEntityIssues(invalidEntity);
        expect(issues).toContain("missing id");
        expect(issues).toContain("missing type");
        expect(issues).toContain("missing hash");
        expect(issues).toContain("missing lastModified");
      });
    });

    describe("Relationship Validation", () => {
      it("should validate valid relationships", async () => {
        mockKgService.getEntity = vi
          .fn()
          .mockResolvedValueOnce({ id: "entity1" })
          .mockResolvedValueOnce({ id: "entity2" });

        const validRelationship = {
          id: "rel1",
          fromEntityId: "entity1",
          toEntityId: "entity2",
        };

        const isValid = await (maintenanceService as any).isValidRelationship(
          validRelationship
        );
        expect(isValid).toBe(true);
      });

      it("should detect invalid relationships", async () => {
        mockKgService.getEntity = vi
          .fn()
          .mockResolvedValueOnce({ id: "entity1" })
          .mockResolvedValueOnce(null); // toEntity doesn't exist

        const invalidRelationship = {
          id: "rel1",
          fromEntityId: "entity1",
          toEntityId: "nonexistent",
        };

        const isValid = await (maintenanceService as any).isValidRelationship(
          invalidRelationship
        );
        expect(isValid).toBe(false);
      });
    });

    describe("Database Connection Validation", () => {
      it("should validate database connections successfully", async () => {
        await expect(
          (maintenanceService as any).validateDatabaseConnections()
        ).resolves.toBeUndefined();
      });

      it("should handle database connection failures", async () => {
        (mockDbService as any).falkordbQuery.mockRejectedValue(
          new Error("Connection failed")
        );

        await expect(
          (maintenanceService as any).validateDatabaseConnections()
        ).rejects.toThrow("Database connection validation failed");
      });
    });
  });
});
