import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionCheckpointJobRunner } from "@memento/jobs/SessionCheckpointJob";

const noop = () => undefined;

const createKgService = () => ({
  createCheckpoint: vi.fn().mockResolvedValue({ checkpointId: "chk-1" }),
  createSessionCheckpointLink: vi.fn().mockResolvedValue(undefined),
  annotateSessionRelationshipsWithCheckpoint: vi.fn().mockResolvedValue(1),
  deleteCheckpoint: vi.fn().mockResolvedValue(true),
});

const createRollbackCapabilities = () => ({
  registerCheckpointLink: vi.fn(),
});

const createPersistence = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  loadPending: vi.fn().mockResolvedValue([]),
  upsert: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  loadDeadLetters: vi.fn().mockResolvedValue([]),
});

describe("SessionCheckpointJobRunner", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("processes a checkpoint job successfully", async () => {
    const kg = createKgService();
    const rollback = createRollbackCapabilities();
    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
    });

    await runner.enqueue({
      sessionId: "session-1",
      seedEntityIds: ["entity-1", "entity-2"],
      reason: "manual",
      hopCount: 2,
    });

    await runner.idle();

    expect(kg.createCheckpoint).toHaveBeenCalledWith(["entity-1", "entity-2"], {
      reason: "manual",
      hops: 2,
      window: undefined,
    });
    expect(kg.createSessionCheckpointLink).toHaveBeenCalledTimes(1);
    expect(kg.annotateSessionRelationshipsWithCheckpoint).toHaveBeenCalledWith(
      "session-1",
      "chk-1"
    );
    expect(rollback.registerCheckpointLink).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ checkpointId: "chk-1" })
    );
    expect(runner.getMetrics()).toMatchObject({
      enqueued: 1,
      completed: 1,
      failed: 0,
      retries: 0,
    });
  });

  it("treats listener exceptions as non-fatal", async () => {
    const kg = createKgService();
    const rollback = createRollbackCapabilities();
    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
    });

    runner.on("jobCompleted", () => {
      throw new Error("listener boom");
    });

    await runner.enqueue({
      sessionId: "session-listener",
      seedEntityIds: ["entity-listener"],
      reason: "manual",
      hopCount: 2,
    });

    await runner.idle();

    expect(runner.getMetrics()).toMatchObject({
      enqueued: 1,
      completed: 1,
      failed: 0,
    });
    expect(runner.getDeadLetterJobs()).toHaveLength(0);
  });

  it("retries on failure before succeeding", async () => {
    const kg = createKgService();
    kg.createCheckpoint
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce({ checkpointId: "chk-2" });

    const rollback = createRollbackCapabilities();
    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
    });

    await runner.enqueue({
      sessionId: "session-2",
      seedEntityIds: ["entity-3"],
      reason: "manual",
      hopCount: 2,
    });

    await runner.idle(200);

    expect(kg.createCheckpoint).toHaveBeenCalledTimes(2);
    expect(kg.annotateSessionRelationshipsWithCheckpoint).toHaveBeenCalledWith(
      "session-2",
      "chk-2"
    );
    expect(runner.getMetrics()).toMatchObject({
      enqueued: 1,
      retries: 1,
      completed: 1,
      failed: 0,
    });
  });

  it("marks manual intervention after exhausting retries", async () => {
    const kg = createKgService();
    kg.createCheckpoint.mockRejectedValue(new Error("boom"));
    const rollback = createRollbackCapabilities();
    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
      maxAttempts: 2,
    });

    await runner.enqueue({
      sessionId: "session-3",
      seedEntityIds: ["entity-4"],
      reason: "manual",
      hopCount: 2,
    });

    await runner.idle(200);

    const calls =
      kg.annotateSessionRelationshipsWithCheckpoint.mock.calls.filter(
        ([sessionId, checkpointId]) =>
          sessionId === "session-3" && checkpointId === "manual_intervention"
      );
    expect(calls.length).toBe(1);
    expect(runner.getMetrics()).toMatchObject({
      enqueued: 1,
      retries: 1,
      completed: 0,
      failed: 1,
    });
    expect(rollback.registerCheckpointLink).not.toHaveBeenCalled();

    const deadLetters = runner.getDeadLetterJobs();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0]).toMatchObject({
      status: "manual_intervention",
      lastError: "boom",
      payload: expect.objectContaining({ sessionId: "session-3" }),
    });
  });

  it("cleans up checkpoint artifacts when link creation fails", async () => {
    const kg = createKgService();
    kg.createSessionCheckpointLink.mockRejectedValue(new Error("link failed"));
    const rollback = createRollbackCapabilities();

    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
      maxAttempts: 1,
    });

    await runner.enqueue({
      sessionId: "session-link",
      seedEntityIds: ["entity-link"],
      reason: "manual",
      hopCount: 2,
    });

    await runner.idle(200);

    const annotateCalls =
      kg.annotateSessionRelationshipsWithCheckpoint.mock.calls;
    expect(annotateCalls.length).toBeGreaterThanOrEqual(3);
    const checkpointCall = annotateCalls.find(
      ([, checkpointId]) => checkpointId === "chk-1"
    );
    expect(checkpointCall).toBeDefined();

    expect(kg.deleteCheckpoint).toHaveBeenCalledWith("chk-1");

    const deadLetters = runner.getDeadLetterJobs();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0]).toMatchObject({
      status: "manual_intervention",
      lastError: "link failed",
      payload: expect.objectContaining({ sessionId: "session-link" }),
    });
  });

  it("persists jobs via configured store", async () => {
    const kg = createKgService();
    const persistence = createPersistence();

    const runner = new SessionCheckpointJobRunner(kg as any, null as any, {
      retryDelayMs: 5,
      persistence: persistence as any,
    });

    await runner.enqueue({
      sessionId: "session-persist",
      seedEntityIds: ["entity-9"],
      reason: "manual",
      hopCount: 2,
    });

    expect(persistence.initialize).toHaveBeenCalledTimes(1);
    expect(persistence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^checkpoint_job_/),
        status: "queued",
        payload: expect.objectContaining({ sessionId: "session-persist" }),
      })
    );
  });

  it("attaches persistence after construction", async () => {
    const kg = createKgService();
    const persistence = createPersistence();
    const runner = new SessionCheckpointJobRunner(kg as any, null as any, {
      retryDelayMs: 5,
    });

    await runner.attachPersistence(persistence as any);

    expect(persistence.initialize).toHaveBeenCalled();

    await runner.enqueue({
      sessionId: "session-upgrade",
      seedEntityIds: ["entity-upgrade"],
      reason: "manual",
      hopCount: 2,
    });

    expect(persistence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ sessionId: "session-upgrade" }),
      })
    );
  });

  it("rehydrates pending jobs from persistence", async () => {
    const kg = createKgService();
    const rollback = createRollbackCapabilities();
    const persistence = createPersistence();
    const pendingJob = {
      id: "job-prev",
      payload: {
        sessionId: "session-old",
        seedEntityIds: ["entity-old"],
        reason: "manual" as const,
        hopCount: 2,
      },
      attempts: 1,
      status: "running" as const,
      lastError: "boom",
    };
    persistence.loadPending.mockResolvedValueOnce([pendingJob]);

    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
      persistence: persistence as any,
    });

    await runner.idle(300);

    expect(kg.createCheckpoint).toHaveBeenCalledWith(["entity-old"], {
      reason: "manual",
      hops: 2,
      window: undefined,
    });

    const upsertCalls = persistence.upsert.mock.calls.filter(
      ([snapshot]) => snapshot.id === "job-prev"
    );
    expect(upsertCalls.length).toBeGreaterThanOrEqual(2);
    const completedCall = upsertCalls.find(
      ([snapshot]) => snapshot.status === "completed"
    );
    expect(completedCall).toBeDefined();
    expect(rollback.registerCheckpointLink).toHaveBeenCalledWith(
      "session-old",
      expect.objectContaining({ checkpointId: "chk-1" })
    );
  });

  it("hydrates dead-letter jobs for inspection", async () => {
    const kg = createKgService();
    const rollback = createRollbackCapabilities();
    const persistence = createPersistence();
    const deadLetterJob = {
      id: "job-dead",
      payload: {
        sessionId: "session-dead",
        seedEntityIds: ["entity-z"],
        reason: "manual" as const,
        hopCount: 2,
      },
      attempts: 3,
      status: "manual_intervention" as const,
      lastError: "boom",
      queuedAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    };
    persistence.loadPending.mockResolvedValueOnce([]);
    persistence.loadDeadLetters.mockResolvedValueOnce([deadLetterJob]);

    const runner = new SessionCheckpointJobRunner(kg as any, rollback as any, {
      retryDelayMs: 5,
      persistence: persistence as any,
    });

    await runner.idle(200);

    expect(persistence.loadDeadLetters).toHaveBeenCalled();
    const deadLetters = runner.getDeadLetterJobs();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0]).toMatchObject({
      id: "job-dead",
      status: "manual_intervention",
      payload: expect.objectContaining({ sessionId: "session-dead" }),
      lastError: "boom",
    });
  });
});
