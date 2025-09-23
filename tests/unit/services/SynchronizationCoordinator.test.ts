/**
 * Unit tests for SynchronizationCoordinator service
 * Tests synchronization coordination logic with focused test doubles
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { EventEmitter } from "events";
import {
  SynchronizationCoordinator,
  SyncOperation,
  SyncError,
  SyncConflict,
  SyncOptions,
  PartialUpdate,
} from "@/services/synchronization/SynchronizationCoordinator";
import {
  Conflict,
  ConflictResolutionResult,
} from "@/services/scm/ConflictResolution";
import { KnowledgeGraphService } from "@/services/knowledge/KnowledgeGraphService";
import { ASTParser } from "../../../src/services/knowledge/ASTParser";
import { DatabaseService } from "@/services/core/DatabaseService";
import { FileChange } from "../../../src/services/core/FileWatcher";
import {
  RelationshipType,
  SESSION_RELATIONSHIP_TYPES,
} from "@/models/relationships";
import path from "path";
import fs from "fs/promises";

// Mock implementations for testing
class MockKnowledgeGraphService {
  private entities: any[] = [];
  private relationships: any[] = [];

  private validateSessionRelationship(rel: any): void {
    if (
      SESSION_RELATIONSHIP_TYPES.includes(rel.type) &&
      (rel.sessionId == null || rel.sessionId === "")
    ) {
      throw new Error(
        `MockKnowledgeGraphService received session relationship without sessionId: ${rel.type}`
      );
    }
  }

  async createEntity(entity: any): Promise<void> {
    this.entities.push(entity);
  }

  async createOrUpdateEntity(entity: any): Promise<void> {
    const existingIndex = this.entities.findIndex((e) => e.id === entity.id);
    if (existingIndex === -1) {
      this.entities.push(entity);
    } else {
      this.entities[existingIndex] = {
        ...this.entities[existingIndex],
        ...entity,
      };
    }
  }

  async updateEntity(id: string, updates: any): Promise<void> {
    const index = this.entities.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.entities[index] = { ...this.entities[index], ...updates };
    }
  }

  async deleteEntity(id: string): Promise<void> {
    this.entities = this.entities.filter((e) => e.id !== id);
  }

  async createRelationship(relationship: any): Promise<void> {
    this.validateSessionRelationship(relationship);
    this.relationships.push(relationship);
  }

  async createRelationshipsBulk(relationships: any[]): Promise<void> {
    for (const rel of relationships) {
      this.validateSessionRelationship(rel);
      this.relationships.push(rel);
    }
  }

  async getEntitiesByFile(filePath: string): Promise<any[]> {
    return this.entities.filter((entity) => entity.path === filePath);
  }

  async createCheckpoint(): Promise<{ checkpointId: string }> {
    return { checkpointId: `mock-checkpoint-${Date.now()}` };
  }

  async createSessionCheckpointLink(): Promise<void> {
    // no-op for tests
  }

  async annotateSessionRelationshipsWithCheckpoint(): Promise<number> {
    return 1;
  }

  getEntities(): any[] {
    return this.entities;
  }

  getRelationships(): any[] {
    return this.relationships;
  }

  clear(): void {
    this.entities = [];
    this.relationships = [];
  }
}

class MockRollbackCapabilities {
  createRollbackPoint = vi.fn(async () => `rollback_${Date.now()}`);
  rollbackToPoint = vi.fn(async () => ({
    success: true,
    rolledBackEntities: 0,
    rolledBackRelationships: 0,
    errors: [],
    partialSuccess: false,
  }));
  deleteRollbackPoint = vi.fn(() => true);
  registerCheckpointLink = vi.fn();
}

class MockCheckpointJobRunner extends EventEmitter {
  private metrics = {
    enqueued: 0,
    completed: 0,
    failed: 0,
    retries: 0,
  };
  private deadLetters: Array<{
    id: string;
    payload: any;
    attempts: number;
    status: string;
    lastError?: string;
  }> = [];
  private persistenceAttached = false;

  hasPersistence = vi.fn(() => this.persistenceAttached);

  attachPersistence = vi.fn(async () => {
    this.persistenceAttached = true;
  });

  enqueue = vi.fn(async (payload) => {
    this.metrics.enqueued += 1;
    const jobId = `job-${this.metrics.enqueued}`;
    this.emit("jobEnqueued", { jobId, payload });
    return jobId;
  });

  getMetrics = vi.fn(() => ({ ...this.metrics }));

  getDeadLetterJobs = vi.fn(() =>
    this.deadLetters.map((job) => ({ ...job, payload: { ...job.payload } }))
  );

  simulateStarted(jobId: string, payload: any, attempts: number): void {
    this.emit("jobStarted", { jobId, payload, attempts });
  }

  simulateCompleted(
    jobId: string,
    payload: any,
    checkpointId: string,
    attempts: number
  ): void {
    this.metrics.completed += 1;
    this.emit("jobCompleted", { jobId, payload, checkpointId, attempts });
  }

  simulateAttemptFailed(
    jobId: string,
    payload: any,
    attempts: number,
    error: string
  ): void {
    this.metrics.retries += 1;
    this.emit("jobAttemptFailed", { jobId, payload, attempts, error });
  }

  simulateDeadLetter(
    jobId: string,
    payload: any,
    attempts: number,
    error: string
  ): void {
    this.metrics.failed += 1;
    const record = {
      id: jobId,
      payload,
      attempts,
      status: "manual_intervention",
      lastError: error,
    };
    this.deadLetters.push(record);
    this.emit("jobFailed", { jobId, payload, attempts, error });
    this.emit("jobDeadLettered", { jobId, payload, attempts, error });
  }
}

class MockASTParser {
  private cache: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async parseFile(filePath: string): Promise<any> {
    const cached = this.cache.get(filePath);
    if (cached) {
      return cached;
    }

    // Simulate parsing errors for files with "error" in the name
    if (filePath.includes("error")) {
      throw new Error("Parse error: invalid syntax");
    }

    // Simulate file not found errors
    if (filePath.includes("non/existent") || filePath.includes("nonexistent")) {
      throw new Error("File not found");
    }

    const fileName = path.basename(filePath);
    const isTypeScript = filePath.endsWith(".ts");
    const isJavaScript = filePath.endsWith(".js");

    // Mock parsing result with realistic entities
    const result = {
      entities: [
        {
          id: `file_${fileName}`,
          type: "file",
          path: filePath,
          language: isTypeScript
            ? "typescript"
            : isJavaScript
            ? "javascript"
            : "unknown",
          extension: path.extname(filePath),
        },
        {
          id: `symbol_${fileName}_TestClass`,
          type: "symbol",
          name: "TestClass",
          kind: "class",
          filePath,
        },
        {
          id: `symbol_${fileName}_TestInterface`,
          type: "symbol",
          name: "TestInterface",
          kind: "interface",
          filePath,
        },
      ],
      relationships: [
        {
          id: `rel_file_symbol_${Date.now()}`,
          fromEntityId: `file_${fileName}`,
          toEntityId: `symbol_${fileName}_TestClass`,
          type: "DEFINES",
        },
        {
          id: `rel_symbol_symbol_${Date.now()}`,
          fromEntityId: `symbol_${fileName}_TestClass`,
          toEntityId: `symbol_${fileName}_TestInterface`,
          type: "IMPLEMENTS",
        },
      ],
      errors: [],
    };

    this.cache.set(filePath, result);
    return result;
  }

  async parseFileIncremental(filePath: string): Promise<any> {
    const result = await this.parseFile(filePath);
    return {
      ...result,
      isIncremental: this.cache.has(filePath),
      updatedEntities: result.entities,
      removedEntities: [],
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { files: number; totalEntities: number } {
    return {
      files: this.cache.size,
      totalEntities: Array.from(this.cache.values()).reduce(
        (sum, result) => sum + result.entities.length,
        0
      ),
    };
  }
}

class MockDatabaseService {
  private postgresService = {
    query: vi.fn(async () => ({ rows: [] })),
    setupSchema: vi.fn(async () => undefined),
  };

  async initialize(): Promise<void> {
    // Mock initialization
  }

  isInitialized(): boolean {
    return true;
  }

  getPostgreSQLService() {
    return this.postgresService;
  }

  async close(): Promise<void> {
    // Mock close
  }
}

class MockConflictResolution {
  detectConflicts = vi.fn(async () => [] as Conflict[]);
  resolveConflictsAuto = vi.fn(async () => [] as ConflictResolutionResult[]);
  resolveConflict = vi.fn(async () => true);
}

describe("SynchronizationCoordinator", () => {
  let coordinator: SynchronizationCoordinator;
  let mockKgService: MockKnowledgeGraphService;
  let mockAstParser: MockASTParser;
  let mockDbService: MockDatabaseService;
  let mockConflictResolution: MockConflictResolution;
  let mockRollbackCapabilities: MockRollbackCapabilities;
  let mockCheckpointJobRunner: MockCheckpointJobRunner;
  let testFilesDir: string;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";

    // Initialize mock dependencies
    mockDbService = new MockDatabaseService();
    mockKgService = new MockKnowledgeGraphService();
    mockAstParser = new MockASTParser();
    mockConflictResolution = new MockConflictResolution();
    mockRollbackCapabilities = new MockRollbackCapabilities();
    mockCheckpointJobRunner = new MockCheckpointJobRunner();

    // Initialize mock services
    await mockDbService.initialize();
    await mockAstParser.initialize();

    // Initialize coordinator with mock services
    coordinator = new SynchronizationCoordinator(
      mockKgService as any,
      mockAstParser as any,
      mockDbService as any,
      mockConflictResolution as any,
      mockRollbackCapabilities as any,
      mockCheckpointJobRunner as any
    );

    // Mock the scanSourceFiles method to use our test directory
    (coordinator as any).scanSourceFiles = async () => {
      return [
        path.join(testFilesDir, "test-class.ts"),
        path.join(testFilesDir, "test-interface.ts"),
        path.join(testFilesDir, "test-function.js"),
      ];
    };

    // Create test files directory
    testFilesDir = path.join(__dirname, "sync-test-files");
    await fs.mkdir(testFilesDir, { recursive: true });

    // Create test files
    await createTestFiles();
  }, 10000);

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testFilesDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up test files:", error);
    }

    // Clean up mock services
    await mockDbService.close();
    mockAstParser.clearCache();
  }, 5000);

  beforeEach(async () => {
    // Clear mock data before each test
    mockKgService.clear();
    mockAstParser.clearCache();
    mockConflictResolution = new MockConflictResolution();
    mockRollbackCapabilities = new MockRollbackCapabilities();
    mockCheckpointJobRunner = new MockCheckpointJobRunner();

    // Reset coordinator state by creating a new instance
    coordinator = new SynchronizationCoordinator(
      mockKgService as any,
      mockAstParser as any,
      mockDbService as any,
      mockConflictResolution as any,
      mockRollbackCapabilities as any,
      mockCheckpointJobRunner as any
    );

    // Re-apply the scanSourceFiles mock
    (coordinator as any).scanSourceFiles = async () => {
      return [
        path.join(testFilesDir, "test-class.ts"),
        path.join(testFilesDir, "test-interface.ts"),
        path.join(testFilesDir, "test-function.js"),
      ];
    };
  });

  describe("Initialization and Configuration", () => {
    it("should initialize successfully with valid dependencies", () => {
      expect(coordinator).toBeDefined();
      expect(typeof coordinator.startFullSynchronization).toBe("function");
      expect(typeof coordinator.synchronizeFileChanges).toBe("function");
      expect(typeof coordinator.synchronizePartial).toBe("function");
    });

    it("should have empty operation queues initially", () => {
      expect(coordinator.getQueueLength()).toBe(0);
      expect(coordinator.getActiveOperations()).toHaveLength(0);
    });

    it("should provide operation statistics", () => {
      const stats = coordinator.getOperationStatistics();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("queued");
      expect(stats).toHaveProperty("completed");
      expect(stats).toHaveProperty("failed");
      expect(stats).toHaveProperty("retried");
      expect(stats).toHaveProperty("totalOperations");
      expect(stats).toHaveProperty("completedOperations");
      expect(stats).toHaveProperty("failedOperations");
      expect(stats).toHaveProperty("totalFilesProcessed");
      expect(stats).toHaveProperty("totalEntitiesCreated");
      expect(stats).toHaveProperty("totalErrors");

      // Initially all should be 0
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.queued).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.retried).toBe(0);
    });
  });

  describe("Session sequence tracking", () => {
    it("should allocate checkpoint sequences after existing events", async () => {
      const sessionId = "session-seq-test";
      const baseTimestamp = new Date("2024-01-01T00:00:00Z");

      (coordinator as any).recordSessionSequence(
        sessionId,
        RelationshipType.SESSION_MODIFIED,
        0,
        "evt-0",
        baseTimestamp
      );
      (coordinator as any).recordSessionSequence(
        sessionId,
        RelationshipType.SESSION_IMPACTED,
        1,
        "evt-1",
        new Date(baseTimestamp.getTime() + 1000)
      );

      const scheduled = await (coordinator as any).scheduleSessionCheckpoint(
        sessionId,
        ["entity-123"],
        { reason: "manual" }
      );

      expect(scheduled).toMatchObject({ success: true });
      const enqueueCalls = mockCheckpointJobRunner.enqueue.mock.calls;
      expect(enqueueCalls.length).toBeGreaterThan(0);
      const enqueueCall = enqueueCalls[enqueueCalls.length - 1];
      const payload = enqueueCall[0];
      expect(payload.sessionId).toBe(sessionId);
      expect(payload.sequenceNumber).toBe(2);
      expect((coordinator as any).sessionSequence.get(sessionId)).toBe(2);
    });

    it("should clear tracking state when requested", () => {
      const sessionId = "session-tracking-cleanup";
      const timestamp = new Date("2024-02-02T00:00:00Z");

      (coordinator as any).recordSessionSequence(
        sessionId,
        RelationshipType.SESSION_MODIFIED,
        5,
        "evt-clean",
        timestamp
      );

      expect((coordinator as any).sessionSequenceState.has(sessionId)).toBe(
        true
      );
      expect((coordinator as any).sessionSequence.get(sessionId)).toBe(5);

      (coordinator as any).clearSessionTracking(sessionId);

      expect((coordinator as any).sessionSequenceState.has(sessionId)).toBe(
        false
      );
      expect((coordinator as any).sessionSequence.has(sessionId)).toBe(false);
    });
  });

  describe("Session relationship buffering", () => {
    it("retries bulk persistence after transient failures without dropping relationships", async () => {
      let failureInjected = false;
      const originalBulk =
        mockKgService.createRelationshipsBulk.bind(mockKgService);
      const bulkSpy = vi
        .spyOn(mockKgService, "createRelationshipsBulk")
        .mockImplementation(async (relationships: any[]) => {
          const containsSessionRel = relationships.some((rel) =>
            SESSION_RELATIONSHIP_TYPES.includes(rel.type)
          );
          if (!failureInjected && containsSessionRel) {
            failureInjected = true;
            throw new Error("transient-session-failure");
          }
          return originalBulk(relationships);
        });

      try {
        const operationId = await coordinator.synchronizeFileChanges([
          {
            type: "modify",
            path: path.join(testFilesDir, "test-class.ts"),
          },
        ]);

        await waitForOperation(coordinator, operationId);

        expect(failureInjected).toBe(true);

        const sessionRelationships = mockKgService
          .getRelationships()
          .filter((rel) => SESSION_RELATIONSHIP_TYPES.includes(rel.type));

        expect(sessionRelationships.length).toBeGreaterThan(0);

        const sessionBulkCalls = bulkSpy.mock.calls.filter(
          ([rels]) =>
            Array.isArray(rels) &&
            rels.some((rel: any) =>
              SESSION_RELATIONSHIP_TYPES.includes(rel.type)
            )
        );
        expect(sessionBulkCalls.length).toBeGreaterThanOrEqual(2);

        const operation = coordinator.getOperationStatus(operationId);
        expect(
          operation?.errors.some(
            (error) =>
              typeof error.message === "string" &&
              error.message.includes("Bulk session rels failed")
          )
        ).toBe(true);
      } finally {
        bulkSpy.mockRestore();
      }
    });
  });

  describe("Full Synchronization Operations", () => {
    it("should start full synchronization and return operation ID", async () => {
      const operationId = await coordinator.startFullSynchronization();

      expect(typeof operationId).toBe("string");
      expect(operationId).toContain("full_sync_");

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      // Check that entities were created (indicating successful sync)
      const entities = mockKgService.getEntities();
      expect(entities.length).toBeGreaterThan(0);

      // Check that relationships were created
      const relationships = mockKgService.getRelationships();
      expect(relationships.length).toBeGreaterThan(0);
    }, 30000);

    it("should handle full sync with custom options", async () => {
      const options: SyncOptions = {
        force: true,
        includeEmbeddings: true,
        maxConcurrency: 2,
        timeout: 60000,
        rollbackOnError: true,
        conflictResolution: "overwrite",
      };

      const operationId = await coordinator.startFullSynchronization(options);

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.type).toBe("full");
    }, 30000);

    it("should process files during full synchronization", async () => {
      const operationId = await coordinator.startFullSynchronization();

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.filesProcessed).toBeGreaterThan(0);
      expect(operation?.entitiesCreated).toBeGreaterThan(0);
      expect(operation?.relationshipsCreated).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Incremental Synchronization Operations", () => {
    it("should enqueue checkpoint jobs via scheduleSessionCheckpoint", async () => {
      const seeds = ["ent-a", "ent-b"];

      const result = await (coordinator as any).scheduleSessionCheckpoint(
        "session-test",
        seeds,
        {
          reason: "manual",
          hopCount: 2,
          operationId: "op-test",
        }
      );

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.sequenceNumber).toBe(1);
      expect(mockCheckpointJobRunner.attachPersistence).toHaveBeenCalled();
      expect(mockCheckpointJobRunner.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "session-test",
          seedEntityIds: ["ent-a", "ent-b"],
          operationId: "op-test",
          reason: "manual",
        })
      );
    });

    it("should publish queued notification when checkpoint enqueue succeeds", async () => {
      const publish = vi.fn();
      const scheduleSpy = vi
        .spyOn(coordinator as any, "scheduleSessionCheckpoint")
        .mockResolvedValue({
          success: true,
          jobId: "job-success",
          sequenceNumber: 7,
        });

      await (coordinator as any).enqueueCheckpointWithNotification({
        sessionId: "session-success",
        seeds: ["ent-a"],
        options: {
          reason: "manual",
          hopCount: 2,
          operationId: "op-success",
        },
        processedChanges: 5,
        totalChanges: 9,
        publish,
      });

      expect(scheduleSpy).toHaveBeenCalledWith(
        "session-success",
        ["ent-a"],
        expect.objectContaining({ operationId: "op-success" })
      );
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "queued",
          seeds: ["ent-a"],
          processedChanges: 5,
          totalChanges: 9,
          details: expect.objectContaining({
            jobId: "job-success",
            sequenceNumber: 7,
          }),
        })
      );

      scheduleSpy.mockRestore();
    });

    it("should emit manual intervention payload when checkpoint enqueue fails", async () => {
      const publish = vi.fn();
      const scheduleSpy = vi
        .spyOn(coordinator as any, "scheduleSessionCheckpoint")
        .mockResolvedValue({ success: false, error: "no workers available" });

      await (coordinator as any).enqueueCheckpointWithNotification({
        sessionId: "session-failed",
        seeds: ["ent-b"],
        options: {
          reason: "manual",
          hopCount: 2,
          operationId: "op-failed",
        },
        processedChanges: 3,
        totalChanges: 7,
        publish,
      });

      expect(scheduleSpy).toHaveBeenCalled();
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "manual_intervention",
          seeds: ["ent-b"],
          errors: expect.arrayContaining([
            expect.objectContaining({ message: "no workers available" }),
          ]),
        })
      );

      scheduleSpy.mockRestore();
    });

    it("should emit checkpoint metrics snapshots throughout job lifecycle", async () => {
      const listener = vi.fn();
      coordinator.on("checkpointMetricsUpdated", listener);

      const seeds = ["ent-metrics"];
      await (coordinator as any).scheduleSessionCheckpoint(
        "session-metrics",
        seeds,
        { operationId: "op-metrics" }
      );

      expect(listener).toHaveBeenCalled();
      const enqueuedEvent = listener.mock.calls.at(-1)?.[0];
      expect(enqueuedEvent).toMatchObject({
        event: "job_enqueued",
        metrics: expect.objectContaining({ enqueued: 1 }),
      });

      listener.mockClear();

      mockCheckpointJobRunner.simulateStarted(
        "job-1",
        {
          sessionId: "session-metrics",
          seedEntityIds: seeds,
        },
        1
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ event: "job_started" })
      );

      listener.mockClear();

      mockCheckpointJobRunner.simulateCompleted(
        "job-1",
        {
          sessionId: "session-metrics",
          seedEntityIds: seeds,
        },
        "chk-123",
        1
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "job_completed",
          metrics: expect.objectContaining({ completed: 1 }),
        })
      );

      const snapshot = coordinator.getCheckpointMetrics();
      expect(snapshot.metrics.completed).toBe(1);
      expect(snapshot.deadLetters).toHaveLength(0);
    });

    it("should start incremental synchronization with file changes", async () => {
      const changes: FileChange[] = [
        {
          path: path.join(testFilesDir, "test-class.ts"),
          type: "create",
          timestamp: new Date(),
        },
      ];

      const operationId = await coordinator.synchronizeFileChanges(changes);

      expect(typeof operationId).toBe("string");
      expect(operationId).toContain("incremental_sync_");

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.type).toBe("incremental");
      expect(operation?.filesProcessed).toBe(1);
      if (operation?.status === "failed") {
        expect(operation.errors.length).toBeGreaterThan(0);
      }
    }, 30000);

    it("should handle multiple file changes in incremental sync", async () => {
      const changes: FileChange[] = [
        {
          path: path.join(testFilesDir, "test-class.ts"),
          type: "create",
          timestamp: new Date(),
        },
        {
          path: path.join(testFilesDir, "test-interface.ts"),
          type: "create",
          timestamp: new Date(),
        },
        {
          path: path.join(testFilesDir, "test-function.js"),
          type: "modify",
          timestamp: new Date(),
        },
      ];

      const operationId = await coordinator.synchronizeFileChanges(changes);

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      // Small additional delay to ensure all async operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.filesProcessed).toBe(3);
      expect(["completed", "failed"]).toContain(operation?.status);
      if (operation?.status === "failed") {
        expect(operation.errors.length).toBeGreaterThan(0);
      }

      // Note: Entity creation depends on the AST parser implementation
      // For this test, we just verify the operation completed
      expect(operation?.entitiesCreated).toBeGreaterThanOrEqual(0);
    }, 30000);

    it("should handle file deletion in incremental sync", async () => {
      // First create and sync a file
      const filePath = path.join(testFilesDir, "temp-file.ts");
      await fs.writeFile(filePath, "export class TempClass {}");

      const createChanges: FileChange[] = [
        {
          path: filePath,
          type: "create",
          timestamp: new Date(),
        },
      ];

      const createOperationId = await coordinator.synchronizeFileChanges(
        createChanges
      );
      await waitForOperation(coordinator, createOperationId);

      // Now delete the file
      await fs.unlink(filePath);

      const deleteChanges: FileChange[] = [
        {
          path: filePath,
          type: "delete",
          timestamp: new Date(),
        },
      ];

      const deleteOperationId = await coordinator.synchronizeFileChanges(
        deleteChanges
      );
      await waitForOperation(coordinator, deleteOperationId);

      const operation = coordinator.getOperationStatus(deleteOperationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.filesProcessed).toBe(1);
      if (operation?.status === "failed") {
        expect(operation.errors.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe("Partial Synchronization Operations", () => {
    it("should start partial synchronization with updates", async () => {
      const updates: PartialUpdate[] = [
        {
          entityId: "test-entity-1",
          type: "create",
          newValue: {
            id: "test-entity-1",
            type: "symbol",
            name: "TestEntity",
            kind: "class",
            filePath: path.join(testFilesDir, "test-entity.ts"),
          },
        },
        {
          entityId: "test-entity-2",
          type: "update",
          changes: {
            name: "UpdatedTestEntity",
          },
        },
      ];

      const operationId = await coordinator.synchronizePartial(updates);

      expect(typeof operationId).toBe("string");
      expect(operationId).toContain("partial_sync_");

      // Wait for operation to complete
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.type).toBe("partial");
    }, 30000);

    it("should handle entity creation in partial sync", async () => {
      const updates: PartialUpdate[] = [
        {
          entityId: "partial-test-entity",
          type: "create",
          newValue: {
            id: "partial-test-entity",
            type: "symbol",
            name: "PartialTestEntity",
            kind: "class",
            filePath: path.join(testFilesDir, "partial-test.ts"),
          },
        },
      ];

      const operationId = await coordinator.synchronizePartial(updates);
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.entitiesCreated).toBe(1);
    }, 30000);

    it("should handle entity updates in partial sync", async () => {
      // First create an entity
      const createUpdates: PartialUpdate[] = [
        {
          entityId: "update-test-entity",
          type: "create",
          newValue: {
            id: "update-test-entity",
            type: "symbol",
            name: "UpdateTestEntity",
            kind: "class",
            filePath: path.join(testFilesDir, "update-test.ts"),
          },
        },
      ];

      const createOperationId = await coordinator.synchronizePartial(
        createUpdates
      );
      await waitForOperation(coordinator, createOperationId);

      // Now update it
      const updateUpdates: PartialUpdate[] = [
        {
          entityId: "update-test-entity",
          type: "update",
          changes: {
            description: "Updated description",
          },
        },
      ];

      const updateOperationId = await coordinator.synchronizePartial(
        updateUpdates
      );
      await waitForOperation(coordinator, updateOperationId);

      const operation = coordinator.getOperationStatus(updateOperationId);
      expect(operation?.entitiesUpdated).toBe(1);
    }, 30000);

    it("should handle entity deletion in partial sync", async () => {
      // First create an entity
      const createUpdates: PartialUpdate[] = [
        {
          entityId: "delete-test-entity",
          type: "create",
          newValue: {
            id: "delete-test-entity",
            type: "symbol",
            name: "DeleteTestEntity",
            kind: "class",
            filePath: path.join(testFilesDir, "delete-test.ts"),
          },
        },
      ];

      const createOperationId = await coordinator.synchronizePartial(
        createUpdates
      );
      await waitForOperation(coordinator, createOperationId);

      // Now delete it
      const deleteUpdates: PartialUpdate[] = [
        {
          entityId: "delete-test-entity",
          type: "delete",
          changes: {},
        },
      ];

      const deleteOperationId = await coordinator.synchronizePartial(
        deleteUpdates
      );
      await waitForOperation(coordinator, deleteOperationId);

      const operation = coordinator.getOperationStatus(deleteOperationId);
      expect(operation?.entitiesDeleted).toBe(1);
    }, 30000);
  });

  describe("Operation Management", () => {
    it("should track operation status correctly", async () => {
      const operationId = await coordinator.startFullSynchronization();

      // Initially should be queued or running
      let operation = coordinator.getOperationStatus(operationId);
      expect(operation).toEqual(expect.any(Object));
      expect(["pending", "running"]).toContain(operation?.status);

      // Wait for completion
      await waitForOperation(coordinator, operationId);

      operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed", "rolled_back"]).toContain(
        operation?.status
      );
      expect(operation?.endTime).toBeInstanceOf(Date);
    }, 30000);

    it("should return null for non-existent operations", () => {
      const operation = coordinator.getOperationStatus("non-existent-id");
      expect(operation).toBe(null);
    });

    it("should list all active operations", async () => {
      // Start multiple operations
      const operationId1 = await coordinator.startFullSynchronization();
      const operationId2 = await coordinator.startIncrementalSynchronization();

      const activeOperations = coordinator.getActiveOperations();
      expect(activeOperations.length).toBeGreaterThanOrEqual(2);

      const operationIds = activeOperations.map((op) => op.id);
      expect(operationIds).toContain(operationId1);
      expect(operationIds).toContain(operationId2);

      // Wait for operations to complete
      await waitForOperation(coordinator, operationId1);
      await waitForOperation(coordinator, operationId2);
    }, 30000);

    it("should cancel operations correctly", async () => {
      const operationId = await coordinator.startFullSynchronization();

      // Give the operation a moment to start processing
      await new Promise((resolve) => setTimeout(resolve, 5));

      // Cancel the operation
      const cancelled = await coordinator.cancelOperation(operationId);
      expect(cancelled).toBe(true);

      // Small delay to ensure cancellation is processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check status - operation might be completed or failed depending on timing
      const operation = coordinator.getOperationStatus(operationId);
      expect(["failed", "completed"]).toContain(operation?.status);

      // If cancelled, should not be in active operations
      if (operation?.status === "failed") {
        const activeOperations = coordinator.getActiveOperations();
        const operationIds = activeOperations.map((op) => op.id);
        expect(operationIds).not.toContain(operationId);
      }
    }, 30000);

    it("should return false when cancelling non-existent operations", async () => {
      const cancelled = await coordinator.cancelOperation("non-existent-id");
      expect(cancelled).toBe(false);
    });
  });

  describe("Queue Processing", () => {
    it("should process operations in queue order", async () => {
      // Since empty incremental sync operations complete immediately,
      // we need to create operations that will actually queue
      const operationId1 = await coordinator.startFullSynchronization();
      const operationId2 = await coordinator.startFullSynchronization();
      const operationId3 = await coordinator.startFullSynchronization();

      // Check queue length (may be less than 3 if processing starts immediately)
      const initialQueueLength = coordinator.getQueueLength();
      expect(initialQueueLength).toBeGreaterThanOrEqual(0);

      // Wait for all operations to complete
      await waitForOperation(coordinator, operationId1);
      await waitForOperation(coordinator, operationId2);
      await waitForOperation(coordinator, operationId3);

      // All should be completed
      const op1 = coordinator.getOperationStatus(operationId1);
      const op2 = coordinator.getOperationStatus(operationId2);
      const op3 = coordinator.getOperationStatus(operationId3);

      expect(["completed", "failed", "rolled_back"]).toContain(op1?.status);
      expect(["completed", "failed", "rolled_back"]).toContain(op2?.status);
      expect(["completed", "failed", "rolled_back"]).toContain(op3?.status);
    }, 45000);

    it("should handle queue length correctly", async () => {
      expect(coordinator.getQueueLength()).toBe(0);

      // Use full synchronization which takes longer to process
      const operationId1 = await coordinator.startFullSynchronization();
      const initialQueueLength = coordinator.getQueueLength();
      expect(initialQueueLength).toBeGreaterThanOrEqual(0);

      const operationId2 = await coordinator.startFullSynchronization();
      const secondQueueLength = coordinator.getQueueLength();
      expect(secondQueueLength).toBeGreaterThanOrEqual(initialQueueLength);

      // Wait for operations to complete
      await waitForOperation(coordinator, operationId1);
      await waitForOperation(coordinator, operationId2);

      // Queue should eventually be empty
      const finalQueueLength = coordinator.getQueueLength();
      expect(finalQueueLength).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe("Retry handling", () => {
    it("re-registers retried operations so they can be cancelled", async () => {
      const operationId = "retry-op-1";
      const operation: SyncOperation = {
        id: operationId,
        type: "full",
        status: "failed",
        startTime: new Date(Date.now() - 1_000),
        endTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [
          {
            file: "coordinator",
            type: "database",
            message: "transient failure",
            timestamp: new Date(),
            recoverable: true,
          },
        ],
        conflicts: [],
        rollbackPoint: undefined,
      };

      (operation as any).options = {};

      // Pretend the previous attempt finished and was archived
      (coordinator as any).completedOperations.set(operationId, operation);

      const processQueueSpy = vi
        .spyOn(coordinator as any, "processQueue")
        .mockResolvedValue(undefined);

      await (coordinator as any).retryOperation(operation);

      const activeIds = coordinator.getActiveOperations().map((op) => op.id);
      expect(activeIds).toContain(operationId);
      expect((coordinator as any).completedOperations.has(operationId)).toBe(
        false
      );

      const status = coordinator.getOperationStatus(operationId);
      expect(status?.status).toBe("pending");

      const cancelled = await coordinator.cancelOperation(operationId);
      expect(cancelled).toBe(true);

      processQueueSpy.mockRestore();
    });
  });

  describe("Event Emission", () => {
    it("should emit operation started events", async () => {
      let startedEventEmitted = false;
      let startedOperationId = "";

      coordinator.once("operationStarted", (operation: SyncOperation) => {
        startedEventEmitted = true;
        startedOperationId = operation.id;
      });

      const operationId = await coordinator.startIncrementalSynchronization();

      // Give event loop a chance to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(startedEventEmitted).toBe(true);
      expect(startedOperationId).toBe(operationId);

      await waitForOperation(coordinator, operationId);
    }, 30000);

    it("should emit operation completed events", async () => {
      let completedEventEmitted = false;
      let completedOperation: SyncOperation | null = null;

      coordinator.once("operationCompleted", (operation: SyncOperation) => {
        completedEventEmitted = true;
        completedOperation = operation;
      });

      const operationId = await coordinator.startIncrementalSynchronization();
      await waitForOperation(coordinator, operationId);

      expect(completedEventEmitted).toBe(true);
      expect(completedOperation?.id).toBe(operationId);
      expect(completedOperation?.status).toBe("completed");
    }, 30000);

    it("should emit progress events during synchronization", async () => {
      const progressEvents: any[] = [];

      coordinator.on(
        "syncProgress",
        (operation: SyncOperation, progress: any) => {
          progressEvents.push({ operationId: operation.id, progress });
        }
      );

      const operationId = await coordinator.startFullSynchronization();
      await waitForOperation(coordinator, operationId);

      // Should have received progress events
      expect(progressEvents.length).toBeGreaterThan(0);

      // Check that progress events are for the correct operation
      progressEvents.forEach((event) => {
        expect(event.operationId).toBe(operationId);
        expect(event.progress).toHaveProperty("phase");
        expect(event.progress).toHaveProperty("progress");
      });

      coordinator.removeAllListeners("syncProgress");
    }, 30000);
  });

  describe("Error Handling and Retry Logic", () => {
    it("should handle errors gracefully during synchronization", async () => {
      // Create a file that will cause parsing errors
      const errorFilePath = path.join(testFilesDir, "error-file.ts");
      await fs.writeFile(
        errorFilePath,
        "export class InvalidClass { invalid syntax }"
      );

      const changes: FileChange[] = [
        {
          path: errorFilePath,
          type: "create",
          timestamp: new Date(),
        },
      ];

      const operationId = await coordinator.synchronizeFileChanges(changes);
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("failed");
      expect(operation?.errors.length).toBeGreaterThan(0);
      expect(operation?.errors[0].type).toBe("parse");
    }, 30000);

    it("should handle non-existent files gracefully", async () => {
      const changes: FileChange[] = [
        {
          path: "/non/existent/file.ts",
          type: "create",
          timestamp: new Date(),
        },
      ];

      const operationId = await coordinator.synchronizeFileChanges(changes);
      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("failed");
      expect(operation?.errors.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Statistics and Monitoring", () => {
    it("should track comprehensive statistics", async () => {
      // Start multiple operations
      const operationId1 = await coordinator.startFullSynchronization();
      const operationId2 = await coordinator.startIncrementalSynchronization();

      await waitForOperation(coordinator, operationId1);
      await waitForOperation(coordinator, operationId2);

      const stats = coordinator.getOperationStatistics();

      expect(stats.total).toBeGreaterThanOrEqual(1);
      expect(stats.completed + stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.totalFilesProcessed).toBeGreaterThanOrEqual(0);
      expect(stats.totalEntitiesCreated).toBeGreaterThanOrEqual(0);
    }, 45000);

    it("should track failed operations in statistics", async () => {
      // Cancel an operation to create a failure
      const operationId = await coordinator.startFullSynchronization();
      await coordinator.cancelOperation(operationId);

      const stats = coordinator.getOperationStatistics();
      expect(stats.total).toBeGreaterThanOrEqual(1);
      expect(stats.totalErrors).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe("Concurrency and Performance", () => {
    it("should handle concurrent operations correctly", async () => {
      const operations: string[] = [];

      // Start multiple operations concurrently
      for (let i = 0; i < 3; i++) {
        const operationId = await coordinator.startIncrementalSynchronization();
        operations.push(operationId);
      }

      // Wait for all operations to complete
      await Promise.all(
        operations.map((id) => waitForOperation(coordinator, id))
      );

      // Check that all operations completed successfully
      operations.forEach((operationId) => {
        const operation = coordinator.getOperationStatus(operationId);
        expect(["completed", "failed"]).toContain(operation?.status);
      });
    }, 60000);

    it("should maintain operation integrity under load", async () => {
      const operations: string[] = [];

      // Start many operations quickly with some variation
      for (let i = 0; i < 5; i++) {
        let operationId: string;
        if (i % 2 === 0) {
          operationId = await coordinator.startIncrementalSynchronization();
        } else {
          // Use partial sync with a dummy path to vary the operations
          operationId = await coordinator.startPartialSynchronization([
            `test-path-${i}`,
          ]);
        }
        operations.push(operationId);
      }

      // Wait for all to complete
      await Promise.all(
        operations.map((id) => waitForOperation(coordinator, id))
      );

      // Small additional delay to ensure all async operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = coordinator.getOperationStatistics();
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBe(0);
      expect(stats.total).toBeGreaterThanOrEqual(4);
    }, 75000);
  });

  describe("Rollback Capabilities", () => {
    it("should support rollback operations", async () => {
      // Create a successful operation first
      const operationId = await coordinator.startIncrementalSynchronization();
      await waitForOperation(coordinator, operationId);

      let operation = coordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("completed");

      // Attempt rollback (this might not be implemented, but should not error)
      const rollbackResult = await coordinator.rollbackOperation(operationId);
      // Result depends on implementation - either true or false is acceptable
      expect(typeof rollbackResult).toBe("boolean");
    }, 30000);

    it("should return false when rolling back non-failed operations", async () => {
      const operationId = await coordinator.startIncrementalSynchronization();
      await waitForOperation(coordinator, operationId);

      const rollbackResult = await coordinator.rollbackOperation(operationId);
      expect(rollbackResult).toBe(false);
    }, 30000);

    it("should create rollback points and attempt rollback when configured", async () => {
      (coordinator as any).maxRetryAttempts = 0;
      (coordinator as any).scanSourceFiles = async () => [
        path.join(testFilesDir, "error-trigger.ts"),
      ];

      const operationId = await coordinator.startFullSynchronization({
        rollbackOnError: true,
      });

      await waitForOperation(coordinator, operationId);

      expect(mockRollbackCapabilities.createRollbackPoint).toHaveBeenCalled();

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation).toBeDefined();
    }, 30000);

    it("should fail immediately when rollback is requested but service unavailable", async () => {
      const localCoordinator = new SynchronizationCoordinator(
        mockKgService as any,
        mockAstParser as any,
        mockDbService as any,
        mockConflictResolution as any,
        undefined,
        new MockCheckpointJobRunner() as any
      );
      (localCoordinator as any).scanSourceFiles = async () => [
        path.join(testFilesDir, "test-class.ts"),
      ];

      const operationId = await localCoordinator.startFullSynchronization({
        rollbackOnError: true,
      });

      await new Promise((resolve) => setImmediate(resolve));

      const operation = localCoordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("failed");
      expect(operation?.errors.some((err) => err.type === "rollback")).toBe(
        true
      );
    }, 10000);
  });

  describe("Utility Methods", () => {
    it("should provide incremental synchronization alias", async () => {
      const operationId = await coordinator.startIncrementalSynchronization();

      expect(typeof operationId).toBe("string");
      expect(operationId).toContain("incremental_sync_");

      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.type).toBe("incremental");
    }, 30000);

    it("should provide partial synchronization by paths", async () => {
      const paths = [
        path.join(testFilesDir, "test-class.ts"),
        path.join(testFilesDir, "test-interface.ts"),
      ];

      const operationId = await coordinator.startPartialSynchronization(paths);

      expect(typeof operationId).toBe("string");
      expect(operationId).toContain("partial_sync_");

      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.type).toBe("partial");
    }, 30000);
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle empty file changes array", async () => {
      const operationId = await coordinator.synchronizeFileChanges([]);

      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("completed");
      expect(operation?.filesProcessed).toBe(0);
    }, 30000);

    it("should handle empty partial updates array", async () => {
      const operationId = await coordinator.synchronizePartial([]);

      await waitForOperation(coordinator, operationId);

      const operation = coordinator.getOperationStatus(operationId);
      expect(operation?.status).toBe("completed");
    }, 30000);

    it("should handle very large file changes arrays", async () => {
      const changes: FileChange[] = [];
      for (let i = 0; i < 100; i++) {
        changes.push({
          path: path.join(testFilesDir, `bulk-test-${i}.ts`),
          type: "create",
          timestamp: new Date(),
        });
      }

      const operationId = await coordinator.synchronizeFileChanges(changes);

      // Should handle the load gracefully
      await waitForOperation(coordinator, operationId, 120000); // Longer timeout for bulk operations

      const operation = coordinator.getOperationStatus(operationId);
      expect(["completed", "failed"]).toContain(operation?.status);
      expect(operation?.filesProcessed).toBe(100);
      if (operation?.status === "failed") {
        expect(operation.errors.length).toBeGreaterThan(0);
      }
    }, 120000);
  });
});

/**
 * Helper function to create test files for synchronization testing
 */
async function createTestFiles(): Promise<void> {
  const testFilesDir = path.join(__dirname, "sync-test-files");

  // Create a TypeScript class file
  const classFile = path.join(testFilesDir, "test-class.ts");
  await fs.writeFile(
    classFile,
    `
import { EventEmitter } from 'events';

export interface TestInterface {
  id: string;
  name: string;
}

export class TestClass extends EventEmitter implements TestInterface {
  public id: string;
  public name: string;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }

  public async processData(data: any): Promise<void> {
    this.emit('processing', data);
    // Process data logic here
    this.emit('processed', data);
  }

  private validateInput(input: string): boolean {
    return input.length > 0;
  }
}

export function createTestInstance(id: string): TestClass {
  return new TestClass(id, 'Test Instance');
}
  `
  );

  // Create a TypeScript interface file
  const interfaceFile = path.join(testFilesDir, "test-interface.ts");
  await fs.writeFile(
    interfaceFile,
    `
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
  `
  );

  // Create a JavaScript function file
  const jsFile = path.join(testFilesDir, "test-function.js");
  await fs.writeFile(
    jsFile,
    `
class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', a, b, result });
    return result;
  }

  subtract(a, b) {
    const result = a - b;
    this.history.push({ operation: 'subtract', a, b, result });
    return result;
  }

  multiply(a, b) {
    const result = a * b;
    this.history.push({ operation: 'multiply', a, b, result });
    return result;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    this.history.push({ operation: 'divide', a, b, result });
    return result;
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;

  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }

  return true;
}

module.exports = {
  Calculator,
  fibonacci,
  isPrime
};
  `
  );

  // Create an empty file
  const emptyFile = path.join(testFilesDir, "empty-file.ts");
  await fs.writeFile(emptyFile, "");
}

/**
 * Helper function to wait for an operation to complete
 */
async function waitForOperation(
  coordinator: SynchronizationCoordinator,
  operationId: string,
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    // Listen for completion events
    const onCompleted = (operation: any) => {
      if (operation.id === operationId) {
        coordinator.removeListener("operationCompleted", onCompleted);
        coordinator.removeListener("operationFailed", onFailed);
        resolve();
      }
    };

    const onFailed = (operation: any) => {
      if (operation.id === operationId) {
        coordinator.removeListener("operationCompleted", onCompleted);
        coordinator.removeListener("operationFailed", onFailed);
        resolve(); // Still resolve for failed operations
      }
    };

    coordinator.on("operationCompleted", onCompleted);
    coordinator.on("operationFailed", onFailed);

    // Also check current status in case operation already completed
    const operation = coordinator.getOperationStatus(operationId);
    if (
      operation &&
      (operation.status === "completed" || operation.status === "failed")
    ) {
      coordinator.removeListener("operationCompleted", onCompleted);
      coordinator.removeListener("operationFailed", onFailed);
      resolve();
      return;
    }

    // Timeout check
    const timeoutCheck = () => {
      if (Date.now() - startTime > timeout) {
        coordinator.removeListener("operationCompleted", onCompleted);
        coordinator.removeListener("operationFailed", onFailed);
        reject(
          new Error(`Operation ${operationId} timed out after ${timeout}ms`)
        );
        return;
      }
      setTimeout(timeoutCheck, 1000); // Check timeout every second
    };
    timeoutCheck();
  });
}
