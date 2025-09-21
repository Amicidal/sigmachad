/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */

import { EventEmitter } from "events";
import crypto from "crypto";
import { KnowledgeGraphService } from "./KnowledgeGraphService.js";
import { ASTParser } from "./ASTParser.js";
import { DatabaseService } from "./DatabaseService.js";
import { FileChange } from "./FileWatcher.js";
import {
  GraphRelationship,
  RelationshipType,
} from "../models/relationships.js";
import { TimeRangeParams } from "../models/types.js";
import { GitService } from "./GitService.js";
import {
  ConflictResolution as ConflictResolutionService,
  Conflict,
} from "./ConflictResolution.js";
import { RollbackCapabilities } from "./RollbackCapabilities.js";
import {
  SessionCheckpointJobRunner,
  type SessionCheckpointJobMetrics,
  type SessionCheckpointJobSnapshot,
} from "../jobs/SessionCheckpointJob.js";
import type { SessionCheckpointJobOptions } from "../jobs/SessionCheckpointJob.js";
import { PostgresSessionCheckpointJobStore } from "../jobs/persistence/PostgresSessionCheckpointJobStore.js";
import { canonicalRelationshipId } from "../utils/codeEdges.js";

export interface SyncOperation {
  id: string;
  type: "full" | "incremental" | "partial";
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  startTime: Date;
  endTime?: Date;
  filesProcessed: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  entitiesDeleted: number;
  relationshipsCreated: number;
  relationshipsUpdated: number;
  relationshipsDeleted: number;
  errors: SyncError[];
  conflicts: Conflict[];
  rollbackPoint?: string;
}

export interface SyncError {
  file: string;
  type:
    | "parse"
    | "database"
    | "conflict"
    | "unknown"
    | "rollback"
    | "cancelled"
    | "capability";
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export type SyncConflict = Conflict;

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  rollbackOnError?: boolean;
  conflictResolution?: "overwrite" | "merge" | "skip" | "manual";
  batchSize?: number;
}

export type SessionEventKind =
  | "session_started"
  | "session_keepalive"
  | "session_relationships"
  | "session_checkpoint"
  | "session_teardown";

export interface SessionStreamPayload {
  changeId?: string;
  relationships?: Array<{
    id: string;
    type: string;
    fromEntityId?: string;
    toEntityId?: string;
    metadata?: Record<string, unknown> | null;
  }>;
  checkpointId?: string;
  seeds?: string[];
  status?:
    | SyncOperation["status"]
    | "failed"
    | "cancelled"
    | "queued"
    | "manual_intervention";
  errors?: SyncError[];
  processedChanges?: number;
  totalChanges?: number;
  details?: Record<string, unknown>;
}

export interface SessionStreamEvent {
  type: SessionEventKind;
  sessionId: string;
  operationId: string;
  timestamp: string;
  payload?: SessionStreamPayload;
}

export interface CheckpointMetricsSnapshot {
  event: string;
  metrics: SessionCheckpointJobMetrics;
  deadLetters: SessionCheckpointJobSnapshot[];
  context?: Record<string, unknown>;
  timestamp: string;
}

class OperationCancelledError extends Error {
  constructor(operationId: string) {
    super(`Operation ${operationId} cancelled`);
    this.name = "OperationCancelledError";
  }
}

interface SessionSequenceTrackingState {
  lastSequence: number | null;
  lastType: RelationshipType | null;
  perType: Map<RelationshipType | string, number>;
}

export class SynchronizationCoordinator extends EventEmitter {
  private activeOperations = new Map<string, SyncOperation>();
  private completedOperations = new Map<string, SyncOperation>();
  private operationQueue: SyncOperation[] = [];
  private isProcessing = false;
  private paused = false;
  private resumeWaiters: Array<() => void> = [];
  private retryQueue = new Map<
    string,
    { operation: SyncOperation; attempts: number }
  >();
  private maxRetryAttempts = 3;
  private retryDelay = 5000; // 5 seconds
  private operationCounter = 0;
  private cancelledOperations = new Set<string>();

  // Collect relationships that couldn't be resolved during per-file processing
  private unresolvedRelationships: Array<{
    relationship: import("../models/relationships.js").GraphRelationship;
    sourceFilePath?: string;
  }> = [];

  // Session stream bookkeeping for WebSocket adapters
  private sessionKeepaliveTimers = new Map<string, NodeJS.Timeout>();
  private activeSessionIds = new Map<string, string>();

  // Runtime tuning knobs per operation (can be updated during sync)
  private tuning = new Map<
    string,
    { maxConcurrency?: number; batchSize?: number }
  >();

  // Local symbol index to speed up same-file relationship resolution
  private localSymbolIndex: Map<string, string> = new Map();

  private sessionSequenceState: Map<string, SessionSequenceTrackingState> =
    new Map();

  private sessionSequence = new Map<string, number>();

  private checkpointJobRunner: SessionCheckpointJobRunner;

  private anomalyResolutionMode = (
    process.env.ANOMALY_RESOLUTION_MODE ?? "warn"
  ).toLowerCase() as "skip" | "warn" | "process";

  constructor(
    private kgService: KnowledgeGraphService,
    private astParser: ASTParser,
    private dbService: DatabaseService,
    private conflictResolution: ConflictResolutionService,
    private rollbackCapabilities?: RollbackCapabilities,
    checkpointJobRunner?: SessionCheckpointJobRunner
  ) {
    super();
    if (checkpointJobRunner) {
      this.checkpointJobRunner = checkpointJobRunner;
    } else {
      const checkpointOptions = this.createCheckpointJobOptions();
      this.checkpointJobRunner = new SessionCheckpointJobRunner(
        this.kgService,
        this.rollbackCapabilities,
        checkpointOptions
      );
    }
    this.bindCheckpointJobEvents();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on("operationCompleted", this.handleOperationCompleted.bind(this));
    this.on("operationFailed", this.handleOperationFailed.bind(this));
    this.on("conflictDetected", this.handleConflictDetected.bind(this));
  }

  private nextSessionSequence(sessionId: string): number {
    const current = this.sessionSequence.get(sessionId) ?? 0;
    const next = current + 1;
    this.sessionSequence.set(sessionId, next);
    return next;
  }

  private createCheckpointJobOptions(): SessionCheckpointJobOptions {
    const options: SessionCheckpointJobOptions = {};
    if (!this.dbService || typeof this.dbService.isInitialized !== "function") {
      return options;
    }
    if (!this.dbService.isInitialized()) {
      return options;
    }
    try {
      const postgresService = this.dbService.getPostgreSQLService();
      if (postgresService && typeof postgresService.query === "function") {
        options.persistence = new PostgresSessionCheckpointJobStore(
          postgresService
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Unable to configure checkpoint persistence: ${message}`);
    }
    return options;
  }

  private async ensureCheckpointPersistence(): Promise<void> {
    if (
      !this.checkpointJobRunner ||
      this.checkpointJobRunner.hasPersistence()
    ) {
      return;
    }
    if (!this.dbService || typeof this.dbService.isInitialized !== "function") {
      return;
    }
    if (!this.dbService.isInitialized()) {
      return;
    }

    try {
      const postgresService = this.dbService.getPostgreSQLService();
      if (!postgresService || typeof postgresService.query !== "function") {
        return;
      }

      const store = new PostgresSessionCheckpointJobStore(postgresService);
      await this.checkpointJobRunner.attachPersistence(store);
      this.emitCheckpointMetrics("persistence_attached", {
        store: "postgres",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to attach checkpoint persistence: ${message}`);
    }
  }

  private async scheduleSessionCheckpoint(
    sessionId: string,
    seedEntityIds: string[],
    options?: {
      reason?: "daily" | "incident" | "manual";
      hopCount?: number;
      eventId?: string;
      actor?: string;
      annotations?: string[];
      operationId?: string;
      window?: TimeRangeParams;
    }
  ): Promise<
    | { success: true; jobId: string; sequenceNumber: number }
    | { success: false; error: string }
  > {
    if (!seedEntityIds || seedEntityIds.length === 0) {
      return { success: false, error: "No checkpoint seeds provided" };
    }

    const dedupedSeeds = Array.from(new Set(seedEntityIds.filter(Boolean)));
    if (dedupedSeeds.length === 0) {
      return { success: false, error: "No valid checkpoint seeds resolved" };
    }

    try {
      await this.ensureCheckpointPersistence();
      const sequenceNumber = this.nextSessionSequence(sessionId);
      const jobId = await this.checkpointJobRunner.enqueue({
        sessionId,
        seedEntityIds: dedupedSeeds,
        reason: options?.reason ?? "manual",
        hopCount: Math.max(1, Math.min(options?.hopCount ?? 2, 5)),
        sequenceNumber,
        operationId: options?.operationId,
        eventId: options?.eventId,
        actor: options?.actor,
        annotations: options?.annotations,
        triggeredBy: "SynchronizationCoordinator",
        window: options?.window,
      });
      this.emit("checkpointScheduled", {
        sessionId,
        sequenceNumber,
        seeds: dedupedSeeds.length,
        jobId,
      });
      return { success: true, jobId, sequenceNumber };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unknown error: ${String(error)}`;
      console.warn(
        `⚠️ Failed to enqueue session checkpoint job for ${sessionId}: ${message}`
      );
      this.emit("checkpointScheduleFailed", { sessionId, error: message });
      return { success: false, error: message };
    }
  }

  private async enqueueCheckpointWithNotification(params: {
    sessionId: string;
    seeds: string[];
    options?: {
      reason?: "daily" | "incident" | "manual";
      hopCount?: number;
      operationId?: string;
      eventId?: string;
      actor?: string;
      annotations?: string[];
      window?: TimeRangeParams;
    };
    publish: (payload: SessionStreamPayload) => void;
    processedChanges: number;
    totalChanges: number;
  }): Promise<void> {
    if (!params.seeds || params.seeds.length === 0) {
      return;
    }

    const checkpointResult = await this.scheduleSessionCheckpoint(
      params.sessionId,
      params.seeds,
      params.options
    );

    if (checkpointResult.success) {
      params.publish({
        status: "queued",
        checkpointId: undefined,
        seeds: params.seeds,
        processedChanges: params.processedChanges,
        totalChanges: params.totalChanges,
        details: {
          jobId: checkpointResult.jobId,
          sequenceNumber: checkpointResult.sequenceNumber,
        },
      });
      return;
    }

    const errorMessage =
      checkpointResult.error || "Failed to schedule checkpoint";
    try {
      await this.kgService.annotateSessionRelationshipsWithCheckpoint(
        params.sessionId,
        params.seeds,
        {
          status: "manual_intervention",
          reason: params.options?.reason,
          hopCount: params.options?.hopCount,
          seedEntityIds: params.seeds,
          jobId: undefined,
          error: errorMessage,
          triggeredBy: "SynchronizationCoordinator",
        }
      );
    } catch (error) {
      console.warn(
        "⚠️ Failed to annotate session relationships after checkpoint enqueue failure",
        error instanceof Error ? error.message : error
      );
    }
    params.publish({
      status: "manual_intervention",
      checkpointId: undefined,
      seeds: params.seeds,
      processedChanges: params.processedChanges,
      totalChanges: params.totalChanges,
      errors: [
        {
          file: params.sessionId,
          type: "checkpoint",
          message: errorMessage,
          timestamp: new Date(),
          recoverable: false,
        },
      ],
      details: {
        jobId: undefined,
        error: errorMessage,
      },
    });
  }

  private bindCheckpointJobEvents(): void {
    this.checkpointJobRunner.on("jobEnqueued", ({ jobId, payload }) => {
      this.emitCheckpointMetrics("job_enqueued", {
        jobId,
        sessionId: payload?.sessionId,
      });
    });

    this.checkpointJobRunner.on(
      "jobStarted",
      ({ jobId, attempts, payload }) => {
        this.emitCheckpointMetrics("job_started", {
          jobId,
          attempts,
          sessionId: payload?.sessionId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobAttemptFailed",
      ({ jobId, attempts, error, payload }) => {
        this.emitCheckpointMetrics("job_attempt_failed", {
          jobId,
          attempts,
          error,
          sessionId: payload?.sessionId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobCompleted",
      ({ payload, checkpointId, jobId, attempts }) => {
        const operationId = payload.operationId ?? payload.sessionId;
        this.emitSessionEvent({
          type: "session_checkpoint",
          sessionId: payload.sessionId,
          operationId,
          timestamp: new Date().toISOString(),
          payload: {
            checkpointId,
            seeds: payload.seedEntityIds,
            status: "completed",
            details: {
              jobId,
              attempts,
            },
          },
        });

        this.emitCheckpointMetrics("job_completed", {
          jobId,
          attempts,
          sessionId: payload.sessionId,
          checkpointId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobFailed",
      ({ payload, jobId, attempts, error }) => {
        const operationId = payload.operationId ?? payload.sessionId;
        this.emitSessionEvent({
          type: "session_checkpoint",
          sessionId: payload.sessionId,
          operationId,
          timestamp: new Date().toISOString(),
          payload: {
            checkpointId: undefined,
            seeds: payload.seedEntityIds,
            status: "manual_intervention",
            errors: [
              {
                file: payload.sessionId,
                type: "unknown",
                message: error,
                timestamp: new Date(),
                recoverable: false,
              },
            ],
            details: {
              jobId,
              attempts,
            },
          },
        });

        this.emitCheckpointMetrics("job_failed", {
          jobId,
          attempts,
          sessionId: payload.sessionId,
          error,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobDeadLettered",
      ({ jobId, attempts, error, payload }) => {
        this.emitCheckpointMetrics("job_dead_lettered", {
          jobId,
          attempts,
          error,
          sessionId: payload?.sessionId,
        });
      }
    );
  }

  // Update tuning for an active operation; applies on next batch boundary
  updateTuning(
    operationId: string,
    tuning: { maxConcurrency?: number; batchSize?: number }
  ): boolean {
    const op = this.activeOperations.get(operationId);
    if (!op) return false;
    const current = this.tuning.get(operationId) || {};
    const merged = { ...current } as {
      maxConcurrency?: number;
      batchSize?: number;
    };
    if (
      typeof tuning.maxConcurrency === "number" &&
      isFinite(tuning.maxConcurrency)
    ) {
      merged.maxConcurrency = Math.max(
        1,
        Math.min(Math.floor(tuning.maxConcurrency), 64)
      );
    }
    if (typeof tuning.batchSize === "number" && isFinite(tuning.batchSize)) {
      merged.batchSize = Math.max(
        1,
        Math.min(Math.floor(tuning.batchSize), 5000)
      );
    }
    this.tuning.set(operationId, merged);
    this.emit("syncProgress", op, { phase: "tuning_updated", progress: 0 });
    return true;
  }

  private nextOperationId(prefix: string): string {
    const counter = ++this.operationCounter;
    return `${prefix}_${Date.now()}_${counter}`;
  }

  private ensureNotCancelled(operation: SyncOperation): void {
    if (this.cancelledOperations.has(operation.id)) {
      throw new OperationCancelledError(operation.id);
    }
  }

  private ensureDatabaseReady(): void {
    const hasChecker =
      typeof (this.dbService as any)?.isInitialized === "function";
    if (!hasChecker || !this.dbService.isInitialized()) {
      throw new Error("Database not initialized");
    }
  }

  private recordSessionSequence(
    sessionId: string,
    type: RelationshipType,
    sequenceNumber: number,
    eventId: string,
    timestamp: Date
  ): { shouldSkip: boolean; reason?: string } {
    let state = this.sessionSequenceState.get(sessionId);
    if (!state) {
      state = {
        lastSequence: null,
        lastType: null,
        perType: new Map(),
      };
      this.sessionSequenceState.set(sessionId, state);
    }

    let reason: "duplicate" | "out_of_order" | null = null;
    let previousSequence: number | null = null;
    let previousType: RelationshipType | null = null;

    if (state.lastSequence !== null) {
      if (sequenceNumber === state.lastSequence) {
        reason = "duplicate";
        previousSequence = state.lastSequence;
        previousType = state.lastType;
      } else if (sequenceNumber < state.lastSequence) {
        reason = "out_of_order";
        previousSequence = state.lastSequence;
        previousType = state.lastType;
      }
    }

    const perTypePrevious = state.perType.get(type);
    if (!reason && typeof perTypePrevious === "number") {
      if (sequenceNumber === perTypePrevious) {
        reason = "duplicate";
        previousSequence = perTypePrevious;
        previousType = type;
      } else if (sequenceNumber < perTypePrevious) {
        reason = "out_of_order";
        previousSequence = perTypePrevious;
        previousType = type;
      }
    }

    if (reason) {
      this.emit("sessionSequenceAnomaly", {
        sessionId,
        type,
        sequenceNumber,
        previousSequence: previousSequence ?? null,
        reason,
        eventId,
        timestamp,
        previousType: previousType ?? null,
      });

      const skipModes = ["duplicate", "out_of_order"];
      if (this.anomalyResolutionMode === "skip" && skipModes.includes(reason)) {
        return { shouldSkip: true, reason };
      }
    }

    state.perType.set(type, sequenceNumber);
    if (state.lastSequence === null || sequenceNumber > state.lastSequence) {
      state.lastSequence = sequenceNumber;
      state.lastType = type;
    }

    const lastRecorded =
      state.lastSequence === null ? sequenceNumber : state.lastSequence;
    this.sessionSequence.set(sessionId, lastRecorded);

    return { shouldSkip: false };
  }

  private clearSessionTracking(sessionId: string): void {
    this.sessionSequenceState.delete(sessionId);
    this.sessionSequence.delete(sessionId);
  }

  private toIsoTimestamp(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    if (typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    return undefined;
  }

  private serializeSessionRelationship(
    rel: GraphRelationship
  ): Record<string, unknown> {
    const asAny = rel as Record<string, any>;
    const result: Record<string, unknown> = {
      id: asAny.id ?? null,
      type: String(rel.type),
      fromEntityId: rel.fromEntityId,
      toEntityId: rel.toEntityId,
      metadata: asAny.metadata ?? null,
    };

    if (asAny.sessionId) {
      result.sessionId = asAny.sessionId;
    }

    if (typeof asAny.sequenceNumber === "number") {
      result.sequenceNumber = asAny.sequenceNumber;
    }

    const timestampIso = this.toIsoTimestamp(asAny.timestamp ?? rel.created);
    if (timestampIso) {
      result.timestamp = timestampIso;
    }

    const createdIso = this.toIsoTimestamp(rel.created);
    if (createdIso) {
      result.created = createdIso;
    }

    const modifiedIso = this.toIsoTimestamp(rel.lastModified);
    if (modifiedIso) {
      result.lastModified = modifiedIso;
    }

    if (typeof asAny.eventId === "string") {
      result.eventId = asAny.eventId;
    }

    if (typeof asAny.actor === "string") {
      result.actor = asAny.actor;
    }

    if (Array.isArray(asAny.annotations) && asAny.annotations.length > 0) {
      result.annotations = asAny.annotations;
    }

    if (asAny.changeInfo) {
      result.changeInfo = asAny.changeInfo;
    }

    if (asAny.stateTransition) {
      result.stateTransition = asAny.stateTransition;
    }

    if (asAny.impact) {
      result.impact = asAny.impact;
    }

    return result;
  }

  private emitSessionEvent(event: SessionStreamEvent): void {
    try {
      this.emit("sessionEvent", event);
    } catch (error) {
      console.warn(
        "Failed to emit session event",
        error instanceof Error ? error.message : error
      );
    }
  }

  getCheckpointMetrics(): {
    metrics: SessionCheckpointJobMetrics;
    deadLetters: SessionCheckpointJobSnapshot[];
  } {
    return {
      metrics: this.checkpointJobRunner.getMetrics(),
      deadLetters: this.checkpointJobRunner.getDeadLetterJobs(),
    };
  }

  private emitCheckpointMetrics(
    event: string,
    context?: Record<string, unknown>
  ): void {
    const snapshot = this.getCheckpointMetrics();
    const payload: CheckpointMetricsSnapshot = {
      event,
      metrics: snapshot.metrics,
      deadLetters: snapshot.deadLetters,
      context,
      timestamp: new Date().toISOString(),
    };
    try {
      this.emit("checkpointMetricsUpdated", payload);
    } catch (error) {
      console.warn(
        "Failed to emit checkpoint metrics",
        error instanceof Error ? error.message : String(error)
      );
    }

    try {
      console.log("[session.checkpoint.metrics]", {
        event,
        enqueued: snapshot.metrics.enqueued,
        completed: snapshot.metrics.completed,
        failed: snapshot.metrics.failed,
        retries: snapshot.metrics.retries,
        deadLetters: snapshot.deadLetters.length,
        ...(context || {}),
      });
    } catch {}
  }

  // Convenience methods used by integration tests
  async startSync(): Promise<string> {
    return this.startFullSynchronization({});
  }

  async stopSync(): Promise<void> {
    // Halt processing of the queue
    this.isProcessing = false;
    // Mark all active operations as completed to simulate stop
    const now = new Date();
    for (const [id, op] of this.activeOperations.entries()) {
      if (op.status === "running" || op.status === "pending") {
        op.status = "completed";
        op.endTime = now;
        this.completedOperations.set(id, op);
        this.activeOperations.delete(id);
        this.emit("operationCompleted", op);
      }
    }
    // Clear queued operations
    this.operationQueue = [];
  }

  // Gracefully stop the coordinator (used by integration tests/cleanup)
  async stop(): Promise<void> {
    this.pauseSync();
    const waiters = this.resumeWaiters.splice(0);
    for (const waiter of waiters) {
      try {
        waiter();
      } catch {
        // ignore; we're shutting down
      }
    }
    await this.stopSync();
    this.removeAllListeners();
  }

  async startFullSynchronization(options: SyncOptions = {}): Promise<string> {
    this.ensureDatabaseReady();
    // Default: do not include embeddings during full sync; generate them in background later
    if (options.includeEmbeddings === undefined) {
      options.includeEmbeddings = false;
    }
    const operation: SyncOperation = {
      id: this.nextOperationId("full_sync"),
      type: "full",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };

    // Attach options to the operation so workers can consult them
    (operation as any).options = options;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Full synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  async synchronizeFileChanges(
    changes: FileChange[],
    options: SyncOptions = {}
  ): Promise<string> {
    this.ensureDatabaseReady();
    const operation: SyncOperation = {
      id: this.nextOperationId("incremental_sync"),
      type: "incremental",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };

    // Store options and changes for processing
    (operation as any).options = options;
    (operation as any).changes = changes;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Incremental synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  async synchronizePartial(
    updates: PartialUpdate[],
    options: SyncOptions = {}
  ): Promise<string> {
    this.ensureDatabaseReady();
    const operation: SyncOperation = {
      id: this.nextOperationId("partial_sync"),
      type: "partial",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };

    // Store updates for processing
    (operation as any).updates = updates;
    (operation as any).options = options;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Partial synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.operationQueue.length > 0) {
      // Respect paused state before starting the next operation
      if (this.paused) {
        await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
      }
      const operation = this.operationQueue.shift()!;
      operation.status = "running";

      if (this.cancelledOperations.has(operation.id)) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "cancelled",
          message: `Operation ${operation.id} cancelled before execution`,
          timestamp: new Date(),
          recoverable: true,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.cancelledOperations.delete(operation.id);
        this.emit("operationCancelled", operation);
        continue;
      }

      try {
        switch (operation.type) {
          case "full":
            await this.performFullSync(operation);
            break;
          case "incremental":
            await this.performIncrementalSync(operation);
            break;
          case "partial":
            await this.performPartialSync(operation);
            break;
        }

        if (this.operationHasBlockingErrors(operation)) {
          await this.finalizeFailedOperation(operation);
          continue;
        }

        this.finalizeSuccessfulOperation(operation);
      } catch (error) {
        const cancelled = error instanceof OperationCancelledError;
        operation.errors.push({
          file: "coordinator",
          type: cancelled ? "cancelled" : "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: cancelled,
        });

        await this.finalizeFailedOperation(operation, { cancelled });
        continue;
      }
    }

    this.isProcessing = false;
  }

  private operationHasBlockingErrors(operation: SyncOperation): boolean {
    if (!Array.isArray(operation.errors) || operation.errors.length === 0) {
      return false;
    }

    // Only treat non-recoverable errors as blocking so warnings don't fail the sync
    return operation.errors.some((error) => error.recoverable === false);
  }

  private finalizeSuccessfulOperation(operation: SyncOperation): void {
    operation.status = "completed";
    operation.endTime = new Date();
    if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {
        // best effort cleanup
      }
    }
    operation.rollbackPoint = undefined;
    this.activeOperations.delete(operation.id);
    this.completedOperations.set(operation.id, operation);
    this.cancelledOperations.delete(operation.id);
    this.emit("operationCompleted", operation);
  }

  private async finalizeFailedOperation(
    operation: SyncOperation,
    context: { cancelled?: boolean } = {}
  ): Promise<void> {
    const isCancelled = context.cancelled === true;

    if (!isCancelled) {
      await this.attemptRollback(operation);
    } else if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {
        // ignore cleanup failure
      }
      operation.rollbackPoint = undefined;
    }

    operation.status = "failed";
    operation.endTime = new Date();
    this.activeOperations.delete(operation.id);
    this.completedOperations.set(operation.id, operation);
    this.cancelledOperations.delete(operation.id);

    if (isCancelled) {
      this.emit("operationCancelled", operation);
    } else {
      this.emit("operationFailed", operation);
    }
  }

  private async attemptRollback(operation: SyncOperation): Promise<void> {
    const options = ((operation as any).options || {}) as SyncOptions;
    if (!options.rollbackOnError) {
      return;
    }

    if (!operation.rollbackPoint) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message: "Rollback requested but no rollback point was recorded",
        timestamp: new Date(),
        recoverable: false,
      });
      return;
    }

    if (!this.rollbackCapabilities) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message:
          "Rollback requested but rollback capabilities are not configured",
        timestamp: new Date(),
        recoverable: false,
      });
      return;
    }

    try {
      const result = await this.rollbackCapabilities.rollbackToPoint(
        operation.rollbackPoint
      );

      if (!result.success || result.errors.length > 0) {
        for (const rollbackError of result.errors) {
          operation.errors.push({
            file: "coordinator",
            type: "rollback",
            message: `Rollback ${rollbackError.action} failed for ${rollbackError.id}: ${rollbackError.error}`,
            timestamp: new Date(),
            recoverable: rollbackError.recoverable,
          });
        }
      }
    } catch (error) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message: `Rollback execution failed: ${
          error instanceof Error ? error.message : "unknown"
        }`,
        timestamp: new Date(),
        recoverable: false,
      });
    } finally {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {
        // ignore cleanup failures
      }
      operation.rollbackPoint = undefined;
    }
  }

  // Pause/resume controls
  pauseSync(): void {
    this.paused = true;
  }

  resumeSync(): void {
    if (!this.paused) return;
    this.paused = false;
    const waiters = this.resumeWaiters.splice(0);
    for (const w of waiters) {
      try {
        w();
      } catch {}
    }
    // If there are queued operations and not currently processing, resume processing
    if (!this.isProcessing && this.operationQueue.length > 0) {
      void this.processQueue();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  private async performFullSync(operation: SyncOperation): Promise<void> {
    // Implementation for full synchronization
    const scanStart = new Date();
    this.emit("syncProgress", operation, { phase: "scanning", progress: 0 });

    // Ensure a Module entity exists for the root package if applicable (best-effort)
    try {
      const { ModuleIndexer } = await import("./ModuleIndexer.js");
      const mi = new ModuleIndexer(this.kgService);
      await mi.indexRootPackage().catch(() => {});
    } catch {}

    // Scan all source files
    const files = await this.scanSourceFiles();
    this.ensureNotCancelled(operation);

    this.emit("syncProgress", operation, { phase: "parsing", progress: 0.2 });

    // Local helper to cooperatively pause execution between units of work
    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };

    // Process files in batches
    const opts = ((operation as any).options || {}) as SyncOptions;
    const includeEmbeddings = opts.includeEmbeddings === true; // default is false; only true when explicitly requested

    // Helper to process a single file
    const processFile = async (file: string) => {
      this.ensureNotCancelled(operation);
      try {
        const result = await this.astParser.parseFile(file);

        // Build local index for this file's symbols to avoid DB lookups
        for (const ent of result.entities) {
          if ((ent as any)?.type === "symbol") {
            const nm = (ent as any).name as string | undefined;
            const p = (ent as any).path as string | undefined;
            if (nm && p) {
              const filePath = p.includes(":") ? p.split(":")[0] : p;
              this.localSymbolIndex.set(`${filePath}:${nm}`, ent.id);
            }
          }
        }

        // Detect and handle conflicts before creating entities
        if (result.entities.length > 0 || result.relationships.length > 0) {
          try {
            const conflicts = await this.detectConflicts(
              result.entities,
              result.relationships,
              opts
            );
            if (conflicts.length > 0) {
              this.logConflicts(conflicts, operation, file, opts);
            }
          } catch (conflictError) {
            operation.errors.push({
              file,
              type: "conflict",
              message:
                conflictError instanceof Error
                  ? conflictError.message
                  : "Conflict detection failed",
              timestamp: new Date(),
              recoverable: true,
            });
          }
        }

        // Accumulate entities and relationships for batch processing
        (operation as any)._batchEntities = (
          (operation as any)._batchEntities || []
        ).concat(result.entities);
        const relsWithSource = result.relationships.map((r) => ({
          ...(r as any),
          __sourceFile: file,
        }));
        (operation as any)._batchRelationships = (
          (operation as any)._batchRelationships || []
        ).concat(relsWithSource as any);

        operation.filesProcessed++;
      } catch (error) {
        operation.errors.push({
          file,
          type: "parse",
          message: error instanceof Error ? error.message : "Parse error",
          timestamp: new Date(),
          recoverable: true,
        });
      }
    };

    for (let i = 0; i < files.length; ) {
      const tn = this.tuning.get(operation.id) || {};
      const bsRaw = tn.batchSize ?? (opts as any).batchSize ?? 60;
      const batchSize = Math.max(1, Math.min(Math.floor(bsRaw), 1000));
      const mcRaw = tn.maxConcurrency ?? opts.maxConcurrency ?? 12;
      const maxConcurrency = Math.max(
        1,
        Math.min(Math.floor(mcRaw), batchSize)
      );

      const batch = files.slice(i, i + batchSize);
      i += batchSize;

      // Run a simple worker pool to process this batch concurrently
      let idx = 0;
      const worker = async () => {
        while (idx < batch.length) {
          const current = idx++;
          await awaitIfPaused();
          this.ensureNotCancelled(operation);
          await processFile(batch[current]);
        }
      };
      const workers = Array.from(
        { length: Math.min(maxConcurrency, batch.length) },
        () => worker()
      );
      await Promise.allSettled(workers);

      // After parsing a batch of files, write entities in bulk, then relationships
      const batchEntities: any[] = (operation as any)._batchEntities || [];
      const batchRelationships: any[] =
        (operation as any)._batchRelationships || [];
      (operation as any)._batchEntities = [];
      (operation as any)._batchRelationships = [];
      this.ensureNotCancelled(operation);

      if (batchEntities.length > 0) {
        try {
          await this.kgService.createEntitiesBulk(batchEntities, {
            skipEmbedding: true,
          });
          operation.entitiesCreated += batchEntities.length;
        } catch (e) {
          // Fallback to per-entity creation
          for (const ent of batchEntities) {
            try {
              await this.kgService.createEntity(ent, { skipEmbedding: true });
              operation.entitiesCreated++;
            } catch (err) {
              operation.errors.push({
                file: (ent as any).path || "unknown",
                type: "database",
                message: `Entity create failed: ${
                  err instanceof Error ? err.message : "unknown"
                }`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
          }
        }
      }

      if (batchRelationships.length > 0) {
        // Resolve targets first, then create in bulk grouped by type
        const resolved: any[] = [];
        for (const relationship of batchRelationships) {
          try {
            // Fast path: if toEntityId points to an existing node, accept; else try to resolve
            const toEntity = await this.kgService.getEntity(
              (relationship as any).toEntityId
            );
            if (toEntity) {
              resolved.push(relationship);
              continue;
            }
          } catch {}
          try {
            const resolvedId = await (this as any).resolveRelationshipTarget(
              relationship,
              (relationship as any).__sourceFile || undefined
            );
            if (resolvedId) {
              resolved.push({
                ...(relationship as any),
                toEntityId: resolvedId,
              });
            } else if (relationship.toEntityId) {
              resolved.push({ ...(relationship as any) });
            } else {
              this.unresolvedRelationships.push({ relationship });
            }
          } catch (relationshipError) {
            operation.errors.push({
              file: "coordinator",
              type: "database",
              message: `Failed to resolve relationship: ${
                relationshipError instanceof Error
                  ? relationshipError.message
                  : "Unknown error"
              }`,
              timestamp: new Date(),
              recoverable: true,
            });
            this.unresolvedRelationships.push({ relationship });
          }
        }
        if (resolved.length > 0) {
          try {
            await this.kgService.createRelationshipsBulk(resolved as any, {
              validate: false,
            });
            operation.relationshipsCreated += resolved.length;
          } catch (e) {
            // Fallback to per-relationship creation if bulk fails
            for (const r of resolved) {
              try {
                await this.kgService.createRelationship(
                  r as any,
                  undefined,
                  undefined,
                  { validate: false }
                );
                operation.relationshipsCreated++;
              } catch (err) {
                operation.errors.push({
                  file: "coordinator",
                  type: "database",
                  message: `Failed to create relationship: ${
                    err instanceof Error ? err.message : "unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
          }
        }
      }

      // Batch embeddings after entities to avoid per-entity overhead
      if (includeEmbeddings && batchEntities.length > 0) {
        if (
          typeof (this.kgService as any).createEmbeddingsBatch === "function"
        ) {
          try {
            await this.kgService.createEmbeddingsBatch(batchEntities);
          } catch (e) {
            operation.errors.push({
              file: "coordinator",
              type: "database",
              message: `Batch embedding failed: ${
                e instanceof Error ? e.message : "unknown"
              }`,
              timestamp: new Date(),
              recoverable: true,
            });
          }
        } else {
          operation.errors.push({
            file: "coordinator",
            type: "capability",
            message:
              "Embedding batch API unavailable; skipping inline embedding",
            timestamp: new Date(),
            recoverable: true,
          });
        }
      } else if (!includeEmbeddings && batchEntities.length > 0) {
        // Accumulate for background embedding after sync completes
        (operation as any)._embedQueue = (
          (operation as any)._embedQueue || []
        ).concat(batchEntities);
      }

      const progress = 0.2 + (i / files.length) * 0.8;
      this.emit("syncProgress", operation, { phase: "parsing", progress });
    }

    // Post-pass: attempt to resolve and create any deferred relationships now that all entities exist
    this.ensureNotCancelled(operation);
    await this.runPostResolution(operation);

    // Deactivate edges not seen during this scan window (best-effort)
    try {
      await this.kgService.finalizeScan(scanStart);
    } catch {}

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });

    // Fire-and-forget background embeddings if they were skipped during full sync
    const pendingToEmbed: any[] = (operation as any)._embedQueue || [];
    if (
      pendingToEmbed.length > 0 &&
      typeof (this.kgService as any).createEmbeddingsBatch === "function"
    ) {
      // Run in background without blocking completion
      const chunks: any[][] = [];
      const chunkSize = 200;
      for (let i = 0; i < pendingToEmbed.length; i += chunkSize) {
        chunks.push(pendingToEmbed.slice(i, i + chunkSize));
      }
      (async () => {
        for (const c of chunks) {
          try {
            await this.kgService.createEmbeddingsBatch(c);
          } catch (e) {
            // log and continue
            try {
              console.warn("Background embedding batch failed:", e);
            } catch {}
          }
        }
        try {
          console.log(
            `✅ Background embeddings created for ${pendingToEmbed.length} entities`
          );
        } catch {}
      })().catch(() => {});
    } else if (pendingToEmbed.length > 0) {
      operation.errors.push({
        file: "coordinator",
        type: "capability",
        message: "Embedding batch API unavailable; queued embeddings skipped",
        timestamp: new Date(),
        recoverable: true,
      });
    }
  }

  private async performIncrementalSync(
    operation: SyncOperation
  ): Promise<void> {
    // Implementation for incremental synchronization
    const scanStart = new Date();
    this.emit("syncProgress", operation, {
      phase: "processing_changes",
      progress: 0,
    });

    // Get changes from operation
    const changes = ((operation as any).changes as FileChange[]) || [];
    const syncOptions = ((operation as any).options || {}) as SyncOptions;

    if (changes.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalChanges = changes.length;
    let processedChanges = 0;

    // Local helper to cooperatively pause execution between units of work
    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };

    // Create or update a session entity for this incremental operation
    const sessionId = `session_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: sessionId,
        type: "session",
        startTime: operation.startTime,
        status: "active",
        agentType: "sync",
        changes: [],
        specs: [],
      } as any);
    } catch {}

    // Track entities to embed in batch and session relationships buffer
    const toEmbed: any[] = [];
    const sessionRelBuffer: Array<
      import("../models/relationships.js").GraphRelationship
    > = [];
    const sessionSequenceLocal = new Map<string, number>();
    const allocateSessionSequence = () => {
      const next = sessionSequenceLocal.get(sessionId) ?? 0;
      sessionSequenceLocal.set(sessionId, next + 1);
      return next;
    };
    const flushSessionRelationships = async () => {
      if (sessionRelBuffer.length === 0) {
        return;
      }

      const batch = sessionRelBuffer.slice();

      try {
        await this.kgService.createRelationshipsBulk(batch, {
          validate: false,
        });
        sessionRelBuffer.splice(0, batch.length);
        const relationships = batch.map((rel) =>
          this.serializeSessionRelationship(rel)
        );
        publishSessionEvent("session_relationships", {
          changeId,
          relationships,
          processedChanges,
          totalChanges,
        });
      } catch (e) {
        operation.errors.push({
          file: "coordinator",
          type: "database",
          message: `Bulk session rels failed: ${
            e instanceof Error ? e.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    };
    const enqueueSessionRelationship = (
      type: RelationshipType,
      toEntityId: string,
      options: {
        metadata?: Record<string, any>;
        changeInfo?: Record<string, any> | null;
        stateTransition?: Record<string, any> | null;
        impact?: Record<string, any> | null;
        annotations?: string[];
        actor?: string;
        timestamp?: Date;
      } = {}
    ) => {
      const timestamp = options.timestamp ?? new Date();
      const sequenceNumber = allocateSessionSequence();
      const eventId =
        "evt_" +
        crypto
          .createHash("sha1")
          .update(
            `${sessionId}|${sequenceNumber}|${type}|${toEntityId}|${timestamp.valueOf()}`
          )
          .digest("hex")
          .slice(0, 16);
      const sequenceCheck = this.recordSessionSequence(
        sessionId,
        type,
        sequenceNumber,
        eventId,
        timestamp
      );
      if (sequenceCheck.shouldSkip) {
        console.warn(
          `⚠️ Skipping session relationship due to sequence anomaly: ${sequenceCheck.reason} for ${sessionId}:${type}:${sequenceNumber}`
        );
        return { sequenceNumber, eventId, timestamp, skipped: true };
      }
      const metadata = { ...(options.metadata ?? {}) };
      if (metadata.source === undefined) metadata.source = "sync";
      if (metadata.sessionId === undefined) metadata.sessionId = sessionId;
      const relationship: any = {
        fromEntityId: sessionId,
        toEntityId,
        type,
        created: timestamp,
        lastModified: timestamp,
        version: 1,
        sessionId,
        sequenceNumber,
        timestamp,
        eventId,
        actor: options.actor ?? "sync-coordinator",
        annotations: options.annotations,
        changeInfo: options.changeInfo ?? undefined,
        stateTransition: options.stateTransition ?? undefined,
        impact: options.impact ?? undefined,
        metadata,
      };
      const graphRelationship = relationship as GraphRelationship;
      graphRelationship.id = canonicalRelationshipId(
        sessionId,
        graphRelationship
      );
      sessionRelBuffer.push(
        relationship as import("../models/relationships.js").GraphRelationship
      );
      this.recordSessionSequence(
        sessionId,
        type,
        sequenceNumber,
        eventId,
        timestamp
      );
      return { sequenceNumber, eventId, timestamp };
    };
    // Track changed entities for checkpointing and change metadata
    const changedSeeds = new Set<string>();
    // Create a Change entity to associate temporal edges for this batch
    const changeId = `change_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: changeId,
        type: "change",
        changeType: "update",
        entityType: "batch",
        entityId: operation.id,
        timestamp: new Date(),
        sessionId,
      } as any);
      // Link session to this change descriptor
      try {
        enqueueSessionRelationship(
          RelationshipType.DEPENDS_ON_CHANGE,
          changeId,
          {
            timestamp: new Date(),
            metadata: { changeId },
            stateTransition: {
              from: "working",
              to: "working",
              verifiedBy: "sync",
              confidence: 0.5,
            },
          }
        );
      } catch {}
    } catch {}

    this.activeSessionIds.set(operation.id, sessionId);

    const publishSessionEvent = (
      type: SessionEventKind,
      payload?: SessionStreamPayload
    ) => {
      this.emitSessionEvent({
        type,
        sessionId,
        operationId: operation.id,
        timestamp: new Date().toISOString(),
        payload,
      });
    };

    const sessionDetails: Record<string, unknown> = {
      totalChanges,
    };
    if (typeof syncOptions.batchSize === "number") {
      sessionDetails.batchSize = syncOptions.batchSize;
    }
    if (typeof syncOptions.maxConcurrency === "number") {
      sessionDetails.maxConcurrency = syncOptions.maxConcurrency;
    }

    publishSessionEvent("session_started", {
      totalChanges,
      processedChanges: 0,
      details: sessionDetails,
    });

    const keepaliveInterval = Math.min(
      Math.max(
        typeof syncOptions.timeout === "number"
          ? Math.floor(syncOptions.timeout / 6)
          : 5000,
        3000
      ),
      20000
    );

    let teardownSent = false;
    const sendTeardown = (payload: SessionStreamPayload) => {
      if (teardownSent) return;
      teardownSent = true;
      publishSessionEvent("session_teardown", payload);
    };

    const keepalive = () => {
      publishSessionEvent("session_keepalive", {
        processedChanges,
        totalChanges,
      });
    };

    keepalive();
    const keepaliveTimer = setInterval(keepalive, keepaliveInterval);
    this.sessionKeepaliveTimers.set(operation.id, keepaliveTimer);

    let teardownPayload: SessionStreamPayload = { status: "completed" };
    let runError: unknown;

    try {
      for (const change of changes) {
        await awaitIfPaused();
        this.ensureNotCancelled(operation);
        try {
          this.emit("syncProgress", operation, {
            phase: "processing_changes",
            progress: (processedChanges / totalChanges) * 0.8,
          });

          switch (change.type) {
            case "create":
            case "modify":
              // Parse the file and update graph
              let parseResult;
              try {
                parseResult = await this.astParser.parseFileIncremental(
                  change.path
                );
              } catch (error) {
                // Handle parsing errors (e.g., invalid file paths)
                operation.errors.push({
                  file: change.path,
                  type: "parse",
                  message: `Failed to parse file: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  timestamp: new Date(),
                  recoverable: false,
                });
                processedChanges++;
                continue; // Skip to next change
              }

              // Detect conflicts before applying changes
              if (
                parseResult.entities.length > 0 ||
                parseResult.relationships.length > 0
              ) {
                const conflicts = await this.detectConflicts(
                  parseResult.entities,
                  parseResult.relationships,
                  syncOptions
                );

                if (conflicts.length > 0) {
                  this.logConflicts(
                    conflicts,
                    operation,
                    change.path,
                    syncOptions
                  );
                }
              }

              // Apply entities
              for (const entity of parseResult.entities) {
                try {
                  if (
                    parseResult.isIncremental &&
                    parseResult.updatedEntities?.includes(entity)
                  ) {
                    await this.kgService.updateEntity(entity.id, entity, {
                      skipEmbedding: true,
                    });
                    operation.entitiesUpdated++;
                    toEmbed.push(entity);
                  } else {
                    await this.kgService.createEntity(entity, {
                      skipEmbedding: true,
                    });
                    operation.entitiesCreated++;
                    toEmbed.push(entity);
                  }
                } catch (error) {
                  operation.errors.push({
                    file: change.path,
                    type: "database",
                    message: `Failed to process entity ${entity.id}: ${
                      error instanceof Error ? error.message : "Unknown"
                    }`,
                    timestamp: new Date(),
                    recoverable: true,
                  });
                }
              }

              // Apply relationships (current layer). Keep for idempotency; uses MERGE semantics downstream.
              for (const relationship of parseResult.relationships) {
                try {
                  const created = await this.resolveAndCreateRelationship(
                    relationship,
                    change.path
                  );
                  if (created) {
                    operation.relationshipsCreated++;
                  } else {
                    this.unresolvedRelationships.push({
                      relationship,
                      sourceFilePath: change.path,
                    });
                  }
                } catch (error) {
                  operation.errors.push({
                    file: change.path,
                    type: "database",
                    message: `Failed to create relationship: ${
                      error instanceof Error ? error.message : "Unknown"
                    }`,
                    timestamp: new Date(),
                    recoverable: true,
                  });
                  // Defer for post-pass resolution
                  this.unresolvedRelationships.push({
                    relationship,
                    sourceFilePath: change.path,
                  });
                }
              }

              // Handle removed entities if incremental
              if (parseResult.isIncremental && parseResult.removedEntities) {
                for (const entity of parseResult.removedEntities) {
                  try {
                    // Before deletion, attach temporal relationship to change and session impact
                    const now2 = new Date();
                    try {
                      await this.kgService.createRelationship(
                        {
                          id: `rel_${entity.id}_${changeId}_REMOVED_IN`,
                          fromEntityId: entity.id,
                          toEntityId: changeId,
                          type: RelationshipType.REMOVED_IN as any,
                          created: now2,
                          lastModified: now2,
                          version: 1,
                        } as any,
                        undefined,
                        undefined,
                        { validate: false }
                      );
                    } catch {}
                    // Attach MODIFIED_BY with git metadata (best-effort)
                    try {
                      const git = new GitService();
                      const info = await git.getLastCommitInfo(change.path);
                      await this.kgService.createRelationship(
                        {
                          id: `rel_${entity.id}_${sessionId}_MODIFIED_BY`,
                          fromEntityId: entity.id,
                          toEntityId: sessionId,
                          type: RelationshipType.MODIFIED_BY as any,
                          created: now2,
                          lastModified: now2,
                          version: 1,
                          metadata: info
                            ? {
                                author: info.author,
                                email: info.email,
                                commitHash: info.hash,
                                date: info.date,
                              }
                            : { source: "sync" },
                        } as any,
                        undefined,
                        undefined,
                        { validate: false }
                      );
                    } catch {}
                    try {
                      enqueueSessionRelationship(
                        RelationshipType.SESSION_IMPACTED,
                        entity.id,
                        {
                          timestamp: now2,
                          metadata: { severity: "high", file: change.path },
                          impact: { severity: "high" },
                        }
                      );
                    } catch {}
                    changedSeeds.add(entity.id);
                    await this.kgService.deleteEntity(entity.id);
                    operation.entitiesDeleted++;
                  } catch (error) {
                    const label =
                      (entity as any).path ||
                      (entity as any).name ||
                      (entity as any).title ||
                      entity.id;
                    operation.errors.push({
                      file: change.path,
                      type: "database",
                      message: `Failed to delete entity ${label}: ${
                        error instanceof Error ? error.message : "Unknown"
                      }`,
                      timestamp: new Date(),
                      recoverable: true,
                    });
                  }
                }
              }

              // History layer (versions + validity intervals) when incremental
              if (parseResult.isIncremental) {
                const now = new Date();

                // Append versions for updated entities
                if (Array.isArray(parseResult.updatedEntities)) {
                  for (const ent of parseResult.updatedEntities) {
                    try {
                      await this.kgService.appendVersion(ent, {
                        timestamp: now,
                        changeSetId: changeId,
                      });
                      operation.entitiesUpdated++;
                      const operationKind =
                        change.type === "create"
                          ? "added"
                          : change.type === "delete"
                          ? "deleted"
                          : "modified";
                      const changeInfo = {
                        elementType: "file",
                        elementName: change.path,
                        operation: operationKind,
                      };
                      let stateTransition: Record<string, any> | undefined = {
                        from: "unknown",
                        to: "working",
                        verifiedBy: "manual",
                        confidence: 0.5,
                      };
                      try {
                        const git = new GitService();
                        const diff = await git.getUnifiedDiff(change.path, 3);
                        let beforeSnippet = "";
                        let afterSnippet = "";
                        if (diff) {
                          const lines = diff.split("\n");
                          for (const ln of lines) {
                            if (
                              ln.startsWith("---") ||
                              ln.startsWith("+++") ||
                              ln.startsWith("@@")
                            )
                              continue;
                            if (
                              ln.startsWith("-") &&
                              beforeSnippet.length < 400
                            )
                              beforeSnippet += ln.substring(1) + "\n";
                            if (ln.startsWith("+") && afterSnippet.length < 400)
                              afterSnippet += ln.substring(1) + "\n";
                            if (
                              beforeSnippet.length >= 400 &&
                              afterSnippet.length >= 400
                            )
                              break;
                          }
                        }
                        const criticalChange: Record<string, any> = {
                          entityId: ent.id,
                        };
                        if (beforeSnippet.trim())
                          criticalChange.beforeSnippet = beforeSnippet.trim();
                        if (afterSnippet.trim())
                          criticalChange.afterSnippet = afterSnippet.trim();
                        if (Object.keys(criticalChange).length > 1) {
                          stateTransition = {
                            ...stateTransition,
                            criticalChange,
                          };
                        }
                      } catch {
                        // best-effort; keep default stateTransition
                      }
                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_MODIFIED,
                          ent.id,
                          {
                            timestamp: now,
                            metadata: { file: change.path },
                            changeInfo,
                            stateTransition,
                          }
                        );
                      } catch {}
                      // Also mark session impacted and link entity to the change
                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_IMPACTED,
                          ent.id,
                          {
                            timestamp: now,
                            metadata: { severity: "medium", file: change.path },
                            impact: { severity: "medium" },
                          }
                        );
                      } catch {}

                      try {
                        await this.kgService.createRelationship(
                          {
                            id: `rel_${ent.id}_${changeId}_MODIFIED_IN`,
                            fromEntityId: ent.id,
                            toEntityId: changeId,
                            type: RelationshipType.MODIFIED_IN as any,
                            created: now,
                            lastModified: now,
                            version: 1,
                          } as any,
                          undefined,
                          undefined,
                          { validate: false }
                        );
                      } catch {}
                      // Attach MODIFIED_BY with git metadata (best-effort)
                      try {
                        const git = new GitService();
                        const info = await git.getLastCommitInfo(change.path);
                        await this.kgService.createRelationship(
                          {
                            id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                            fromEntityId: ent.id,
                            toEntityId: sessionId,
                            type: RelationshipType.MODIFIED_BY as any,
                            created: now,
                            lastModified: now,
                            version: 1,
                            metadata: info
                              ? {
                                  author: info.author,
                                  email: info.email,
                                  commitHash: info.hash,
                                  date: info.date,
                                }
                              : { source: "sync" },
                          } as any,
                          undefined,
                          undefined,
                          { validate: false }
                        );
                      } catch {}
                      changedSeeds.add(ent.id);
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `appendVersion failed for ${ent.id}: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }

                // Open edges for added relationships (with resolution)
                if (Array.isArray((parseResult as any).addedRelationships)) {
                  for (const rel of (parseResult as any)
                    .addedRelationships as GraphRelationship[]) {
                    try {
                      let toId = rel.toEntityId;
                      // Resolve placeholder targets like kind:name or import:module:symbol
                      if (!toId || String(toId).includes(":")) {
                        const resolved = await (
                          this as any
                        ).resolveRelationshipTarget(rel, change.path);
                        if (resolved) toId = resolved;
                      }
                      if (toId && rel.fromEntityId) {
                        await this.kgService.openEdge(
                          rel.fromEntityId,
                          toId as any,
                          rel.type,
                          now,
                          changeId
                        );
                        // Keep edge evidence/properties in sync during incremental updates
                        try {
                          const enriched = {
                            ...rel,
                            toEntityId: toId,
                          } as GraphRelationship;
                          await this.kgService.upsertEdgeEvidenceBulk([
                            enriched,
                          ]);
                        } catch {}
                        operation.relationshipsUpdated++;
                      }
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `openEdge failed: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }

                // Close edges for removed relationships (with resolution)
                if (Array.isArray((parseResult as any).removedRelationships)) {
                  for (const rel of (parseResult as any)
                    .removedRelationships as GraphRelationship[]) {
                    try {
                      let toId = rel.toEntityId;
                      if (!toId || String(toId).includes(":")) {
                        const resolved = await (
                          this as any
                        ).resolveRelationshipTarget(rel, change.path);
                        if (resolved) toId = resolved;
                      }
                      if (toId && rel.fromEntityId) {
                        await this.kgService.closeEdge(
                          rel.fromEntityId,
                          toId as any,
                          rel.type,
                          now,
                          changeId
                        );
                        operation.relationshipsUpdated++;
                      }
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `closeEdge failed: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }

                // Created entities: attach CREATED_IN and mark impacted
                if (Array.isArray((parseResult as any).addedEntities)) {
                  for (const ent of (parseResult as any)
                    .addedEntities as any[]) {
                    try {
                      const now3 = new Date();
                      await this.kgService.createRelationship(
                        {
                          id: `rel_${ent.id}_${changeId}_CREATED_IN`,
                          fromEntityId: ent.id,
                          toEntityId: changeId,
                          type: RelationshipType.CREATED_IN as any,
                          created: now3,
                          lastModified: now3,
                          version: 1,
                        } as any,
                        undefined,
                        undefined,
                        { validate: false }
                      );
                      // Also MODIFIED_BY with git metadata (best-effort)
                      try {
                        const git = new GitService();
                        const info = await git.getLastCommitInfo(change.path);
                        await this.kgService.createRelationship(
                          {
                            id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                            fromEntityId: ent.id,
                            toEntityId: sessionId,
                            type: RelationshipType.MODIFIED_BY as any,
                            created: now3,
                            lastModified: now3,
                            version: 1,
                            metadata: info
                              ? {
                                  author: info.author,
                                  email: info.email,
                                  commitHash: info.hash,
                                  date: info.date,
                                }
                              : { source: "sync" },
                          } as any,
                          undefined,
                          undefined,
                          { validate: false }
                        );
                      } catch {}
                      let stateTransitionNew: Record<string, any> | undefined =
                        {
                          from: "unknown",
                          to: "working",
                          verifiedBy: "manual",
                          confidence: 0.4,
                        };
                      try {
                        const git = new GitService();
                        const diff = await git.getUnifiedDiff(change.path, 2);
                        let afterSnippet = "";
                        if (diff) {
                          const lines = diff.split("\n");
                          for (const ln of lines) {
                            if (
                              ln.startsWith("+++") ||
                              ln.startsWith("---") ||
                              ln.startsWith("@@")
                            )
                              continue;
                            if (ln.startsWith("+") && afterSnippet.length < 300)
                              afterSnippet += ln.substring(1) + "\n";
                            if (afterSnippet.length >= 300) break;
                          }
                        }
                        if (afterSnippet.trim()) {
                          stateTransitionNew = {
                            ...stateTransitionNew,
                            criticalChange: {
                              entityId: ent.id,
                              afterSnippet: afterSnippet.trim(),
                            },
                          };
                        }
                      } catch {
                        // ignore diff errors
                      }
                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_IMPACTED,
                          ent.id,
                          {
                            timestamp: now3,
                            metadata: { severity: "low", file: change.path },
                            stateTransition: stateTransitionNew,
                            impact: { severity: "low" },
                          }
                        );
                      } catch {}
                      changedSeeds.add(ent.id);
                    } catch {}
                  }
                }
              }
              break;

            case "delete":
              // Handle file deletion
              try {
                const fileEntities = await this.kgService.getEntitiesByFile(
                  change.path,
                  { includeSymbols: true }
                );

                for (const entity of fileEntities) {
                  await this.kgService.deleteEntity(entity.id);
                  operation.entitiesDeleted++;
                }

                console.log(
                  `🗑️ Removed ${fileEntities.length} entities from deleted file ${change.path}`
                );
              } catch (error) {
                operation.errors.push({
                  file: change.path,
                  type: "database",
                  message: `Failed to handle file deletion: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: false,
                });
              }
              break;
          }

          operation.filesProcessed++;
          processedChanges++;
        } catch (error) {
          operation.errors.push({
            file: change.path,
            type: "parse",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date(),
            recoverable: true,
          });
        }

        await flushSessionRelationships();
      }

      // Post-pass for any unresolved relationships from this batch
      await this.runPostResolution(operation);

      // Bulk create session relationships
      await flushSessionRelationships();

      // Schedule checkpoint job for changed neighborhood
      const seeds = Array.from(changedSeeds);
      if (seeds.length > 0) {
        await this.enqueueCheckpointWithNotification({
          sessionId,
          seeds,
          options: {
            reason: "manual",
            hopCount: 2,
            operationId: operation.id,
          },
          processedChanges,
          totalChanges,
          publish: (payload) =>
            publishSessionEvent("session_checkpoint", payload),
        });
      }

      // Batch-generate embeddings for affected entities
      if (toEmbed.length > 0) {
        try {
          await this.kgService.createEmbeddingsBatch(toEmbed);
        } catch (e) {
          operation.errors.push({
            file: "coordinator",
            type: "database",
            message: `Batch embedding failed: ${
              e instanceof Error ? e.message : "unknown"
            }`,
            timestamp: new Date(),
            recoverable: true,
          });
        }
      }

      // Deactivate edges not seen during this scan window (best-effort)
      try {
        await this.kgService.finalizeScan(scanStart);
      } catch {}
    } catch (error) {
      runError = error;
      teardownPayload = {
        status: "failed",
        details: {
          message: error instanceof Error ? error.message : String(error),
        },
      };
      throw error;
    } finally {
      const timer = this.sessionKeepaliveTimers.get(operation.id);
      if (timer) {
        clearInterval(timer);
        this.sessionKeepaliveTimers.delete(operation.id);
      }
      this.activeSessionIds.delete(operation.id);
      this.clearSessionTracking(sessionId);

      const summaryPayload: SessionStreamPayload = {
        ...teardownPayload,
        processedChanges,
        totalChanges,
      };

      if (
        !summaryPayload.errors &&
        (summaryPayload.status === "failed" || operation.errors.length > 0)
      ) {
        summaryPayload.errors = operation.errors.slice(-5);
      }

      if (summaryPayload.status !== "failed" && runError) {
        summaryPayload.status = "failed";
      }

      if (
        summaryPayload.status !== "failed" &&
        operation.errors.some((err) => err.recoverable === false)
      ) {
        summaryPayload.status = "failed";
      }

      keepalive();
      sendTeardown(summaryPayload);
    }

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async performPartialSync(operation: SyncOperation): Promise<void> {
    // Implementation for partial synchronization
    this.emit("syncProgress", operation, {
      phase: "processing_partial",
      progress: 0,
    });

    // Get partial updates from operation
    const updates = ((operation as any).updates as PartialUpdate[]) || [];

    if (updates.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalUpdates = updates.length;
    let processedUpdates = 0;

    for (const update of updates) {
      this.ensureNotCancelled(operation);
      try {
        this.emit("syncProgress", operation, {
          phase: "processing_partial",
          progress: (processedUpdates / totalUpdates) * 0.9,
        });

        switch (update.type) {
          case "create":
            // Create new entity
            if (update.newValue) {
              try {
                await this.kgService.createEntity(update.newValue);
                operation.entitiesCreated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to create entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "update":
            // Update existing entity
            if (update.changes) {
              try {
                await this.kgService.updateEntity(
                  update.entityId,
                  update.changes
                );
                operation.entitiesUpdated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to update entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "delete":
            // Delete entity
            try {
              await this.kgService.deleteEntity(update.entityId);
              operation.entitiesDeleted++;
            } catch (error) {
              operation.errors.push({
                file: update.entityId,
                type: "database",
                message: `Failed to delete entity: ${
                  error instanceof Error ? error.message : "Unknown"
                }`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
            break;
        }

        processedUpdates++;
      } catch (error) {
        operation.errors.push({
          file: "partial_update",
          type: "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: false,
        });
      }
    }

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async scanSourceFiles(): Promise<string[]> {
    // Scan for source files in the project using fs
    const fs = await import("fs/promises");
    const path = await import("path");

    const files: string[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx"];

    // Directories to scan
    const directories = ["src", "lib", "packages", "tests"];

    // Exclude patterns
    const shouldExclude = (filePath: string): boolean => {
      return (
        filePath.includes("node_modules") ||
        filePath.includes("dist") ||
        filePath.includes("build") ||
        filePath.includes(".git") ||
        filePath.includes("coverage") ||
        filePath.endsWith(".d.ts") ||
        filePath.endsWith(".min.js")
      );
    };

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (shouldExclude(fullPath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (
            entry.isFile() &&
            extensions.some((ext) => fullPath.endsWith(ext))
          ) {
            files.push(path.resolve(fullPath));
          }
        }
      } catch (error) {
        // Directory might not exist, skip silently
      }
    };

    try {
      for (const dir of directories) {
        await scanDirectory(dir);
      }

      // Remove duplicates
      const uniqueFiles = Array.from(new Set(files));
      console.log(`📂 Found ${uniqueFiles.length} source files to scan`);

      return uniqueFiles;
    } catch (error) {
      console.error("Error scanning source files:", error);
      return [];
    }
  }

  private logConflicts(
    conflicts: Conflict[],
    operation: SyncOperation,
    source: string,
    options?: SyncOptions
  ): void {
    operation.conflicts.push(...conflicts);

    const unresolved = conflicts.filter((conflict) => !conflict.resolved);
    const resolvedCount = conflicts.length - unresolved.length;
    const resolutionMode = options?.conflictResolution ?? "manual";

    if (unresolved.length > 0) {
      console.warn(
        `⚠️ ${unresolved.length}/${conflicts.length} conflicts detected in ${source} (${resolutionMode} mode)`
      );
    } else {
      console.info(
        `✅ ${resolvedCount} conflicts auto-resolved for ${source} (${resolutionMode} mode)`
      );
    }

    for (const conflict of conflicts) {
      this.emit("conflictDetected", conflict);
    }
  }

  private async detectConflicts(
    entities: any[],
    relationships: any[],
    options?: SyncOptions
  ): Promise<Conflict[]> {
    if (entities.length === 0 && relationships.length === 0) {
      return [];
    }

    const conflicts = await this.conflictResolution.detectConflicts(
      entities,
      relationships
    );

    if (conflicts.length === 0) {
      return conflicts;
    }

    const resolutionMode = options?.conflictResolution;
    if (resolutionMode && resolutionMode !== "manual") {
      const results = await this.conflictResolution.resolveConflictsAuto(
        conflicts
      );

      const unresolved = conflicts.filter((conflict) => !conflict.resolved);
      if (results.length !== conflicts.length || unresolved.length > 0) {
        console.warn(
          `⚠️ Auto-resolution (${resolutionMode}) handled ${results.length}/${conflicts.length} conflicts; ${unresolved.length} remain unresolved.`
        );
      }
    }

    return conflicts;
  }

  async rollbackOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.status !== "failed") {
      return false;
    }

    try {
      // Implement rollback logic
      operation.status = "rolled_back";
      this.emit("operationRolledBack", operation);
      return true;
    } catch (error) {
      this.emit("rollbackFailed", operation, error);
      return false;
    }
  }

  getOperationStatus(operationId: string): SyncOperation | null {
    return (
      this.activeOperations.get(operationId) ||
      this.completedOperations.get(operationId) ||
      null
    );
  }

  getActiveOperations(): SyncOperation[] {
    return Array.from(this.activeOperations.values());
  }

  getQueueLength(): number {
    return this.operationQueue.length;
  }

  async startIncrementalSynchronization(
    options: SyncOptions = {}
  ): Promise<string> {
    // Alias for synchronizeFileChanges with empty changes
    return this.synchronizeFileChanges([], options);
  }

  async startPartialSynchronization(
    paths: string[],
    options: SyncOptions = {}
  ): Promise<string> {
    // Convert paths to partial updates
    const updates: PartialUpdate[] = paths.map((path) => ({
      entityId: path,
      type: "update" as const,
      changes: {},
    }));

    return this.synchronizePartial(updates, options);
  }

  async cancelOperation(operationId: string): Promise<boolean> {
    this.cancelledOperations.add(operationId);

    const active = this.activeOperations.get(operationId);
    if (active) {
      if (!active.errors.some((e) => e.type === "cancelled")) {
        active.errors.push({
          file: "coordinator",
          type: "cancelled",
          message: `Operation ${operationId} cancellation requested`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
      return true;
    }

    const queueIndex = this.operationQueue.findIndex(
      (op) => op.id === operationId
    );
    if (queueIndex !== -1) {
      const [operation] = this.operationQueue.splice(queueIndex, 1);
      operation.status = "failed";
      operation.endTime = new Date();
      operation.errors.push({
        file: "coordinator",
        type: "cancelled",
        message: `Operation ${operationId} cancelled before execution`,
        timestamp: new Date(),
        recoverable: true,
      });
      this.retryQueue.delete(operationId);
      this.completedOperations.set(operationId, operation);
      this.cancelledOperations.delete(operationId);
      this.emit("operationCancelled", operation);
      return true;
    }

    if (this.completedOperations.has(operationId)) {
      this.cancelledOperations.delete(operationId);
      return true; // Already finished; treat as no-op cancellation
    }

    if (this.retryQueue.has(operationId)) {
      this.retryQueue.delete(operationId);
      this.cancelledOperations.delete(operationId);
      return true;
    }

    this.cancelledOperations.delete(operationId);
    return false;
  }

  getOperationStatistics(): {
    total: number;
    active: number;
    queued: number;
    completed: number;
    failed: number;
    retried: number;
    totalOperations: number;
    completedOperations: number;
    failedOperations: number;
    totalFilesProcessed: number;
    totalEntitiesCreated: number;
    totalErrors: number;
  } {
    const activeOperations = Array.from(this.activeOperations.values());
    const completedOperations = Array.from(this.completedOperations.values());
    const retryOperations = Array.from(this.retryQueue.values());
    const allOperations = [...activeOperations, ...completedOperations];

    const totalFilesProcessed = allOperations.reduce(
      (sum, op) => sum + op.filesProcessed,
      0
    );
    const totalEntitiesCreated = allOperations.reduce(
      (sum, op) => sum + op.entitiesCreated,
      0
    );
    const totalErrors = allOperations.reduce(
      (sum, op) => sum + op.errors.length,
      0
    );

    return {
      total: allOperations.length + this.operationQueue.length,
      active: activeOperations.filter((op) => op.status === "running").length,
      queued: this.operationQueue.length,
      completed: allOperations.filter((op) => op.status === "completed").length,
      failed: allOperations.filter((op) => op.status === "failed").length,
      retried: retryOperations.length,
      totalOperations: allOperations.length + this.operationQueue.length,
      completedOperations: allOperations.filter(
        (op) => op.status === "completed"
      ).length,
      failedOperations: allOperations.filter((op) => op.status === "failed")
        .length,
      totalFilesProcessed,
      totalEntitiesCreated,
      totalErrors,
    };
  }

  private handleOperationCompleted(operation: SyncOperation): void {
    console.log(`✅ Sync operation ${operation.id} completed successfully`);

    // Clear from retry queue if it was a retry
    if (this.retryQueue.has(operation.id)) {
      const retryInfo = this.retryQueue.get(operation.id);
      console.log(
        `✅ Retry successful for operation ${operation.id} after ${retryInfo?.attempts} attempts`
      );
      this.retryQueue.delete(operation.id);
    }

    // Note: Keep completed operations in activeOperations so they can be queried
    // this.activeOperations.delete(operation.id);
  }

  private handleOperationFailed(operation: SyncOperation): void {
    try {
      const msg = operation.errors
        ?.map((e) => `${e.type}:${e.message}`)
        .join("; ");
      console.error(
        `❌ Sync operation ${operation.id} failed: ${msg || "unknown"}`
      );
    } catch {
      console.error(
        `❌ Sync operation ${operation.id} failed:`,
        operation.errors
      );
    }

    // Check if operation has recoverable errors
    const hasRecoverableErrors = operation.errors.some((e) => e.recoverable);

    if (hasRecoverableErrors) {
      // Check retry attempts
      const retryInfo = this.retryQueue.get(operation.id);
      const attempts = retryInfo ? retryInfo.attempts : 0;

      if (attempts < this.maxRetryAttempts) {
        console.log(
          `🔄 Scheduling retry ${attempts + 1}/${
            this.maxRetryAttempts
          } for operation ${operation.id}`
        );

        // Store retry info
        this.retryQueue.set(operation.id, {
          operation,
          attempts: attempts + 1,
        });

        // Schedule retry
        setTimeout(() => {
          this.retryOperation(operation);
        }, this.retryDelay * (attempts + 1)); // Exponential backoff
      } else {
        console.error(
          `❌ Max retry attempts reached for operation ${operation.id}`
        );
        this.retryQueue.delete(operation.id);
        this.emit("operationAbandoned", operation);
      }
    } else {
      console.error(
        `❌ Operation ${operation.id} has non-recoverable errors, not retrying`
      );
    }
  }

  private async retryOperation(operation: SyncOperation): Promise<void> {
    console.log(`🔄 Retrying operation ${operation.id}`);

    // Reset operation status
    operation.status = "pending";
    operation.startTime = new Date();
    operation.endTime = undefined;
    operation.errors = [];
    operation.conflicts = [];
    if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {
        // best effort cleanup before recreating
      }
      operation.rollbackPoint = undefined;
    }

    const options = ((operation as any).options || {}) as SyncOptions;
    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Retry rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point during retry: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return;
      }
    }

    // Re-register as active so cancellation and observers can see the retry
    this.activeOperations.set(operation.id, operation);
    this.completedOperations.delete(operation.id);
    this.cancelledOperations.delete(operation.id);

    // Re-add to queue
    this.operationQueue.push(operation);

    // Process if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private handleConflictDetected(conflict: Conflict): void {
    console.warn(`⚠️ Sync conflict detected:`, {
      id: conflict.id,
      type: conflict.type,
      entityId: conflict.entityId,
      relationshipId: conflict.relationshipId,
      resolved: conflict.resolved,
      strategy: conflict.resolutionStrategy,
    });
  }

  // Attempt to resolve and create deferred relationships
  private async runPostResolution(operation: SyncOperation): Promise<void> {
    if (this.unresolvedRelationships.length === 0) return;
    this.emit("syncProgress", operation, {
      phase: "resolving_relationships",
      progress: 0.95,
    });

    const pending = this.unresolvedRelationships.splice(0);
    let createdCount = 0;
    for (const item of pending) {
      try {
        const created = await (this as any).resolveAndCreateRelationship(
          item.relationship,
          item.sourceFilePath
        );
        if (created) createdCount++;
      } catch {
        // keep silent; will try in next sync if needed
      }
    }
    if (createdCount > 0) {
      operation.relationshipsCreated += createdCount;
    }
  }
}

export interface PartialUpdate {
  entityId: string;
  changes: Record<string, any>;
  type: "update" | "delete" | "create";
  newValue?: any;
}

export interface FileLikeEntity {
  path?: string;
}

declare module "./SynchronizationCoordinator.js" {
  interface SynchronizationCoordinator {
    resolveAndCreateRelationship(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<boolean>;
    resolveRelationshipTarget(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<string | null>;
  }
}

// Implement as prototype methods to avoid reordering class definitions
(SynchronizationCoordinator as any).prototype.resolveAndCreateRelationship =
  async function (
    this: SynchronizationCoordinator,
    relationship: GraphRelationship,
    sourceFilePath?: string
  ): Promise<boolean> {
    try {
      const toEntity = await (this as any).kgService.getEntity(
        relationship.toEntityId
      );
      if (toEntity) {
        await (this as any).kgService.createRelationship(
          relationship,
          undefined,
          undefined,
          { validate: false }
        );
        return true;
      }
    } catch {}

    const resolvedResult = await (this as any).resolveRelationshipTarget(
      relationship,
      sourceFilePath
    );
    const resolvedId =
      typeof resolvedResult === "string"
        ? resolvedResult
        : resolvedResult?.id || null;
    if (!resolvedId) return false;
    const enrichedMeta = { ...(relationship as any).metadata } as any;
    if (resolvedResult && typeof resolvedResult === "object") {
      if (
        Array.isArray((resolvedResult as any).candidates) &&
        (resolvedResult as any).candidates.length > 0
      ) {
        enrichedMeta.candidates = (resolvedResult as any).candidates.slice(
          0,
          5
        );
        (relationship as any).ambiguous =
          (resolvedResult as any).candidates.length > 1;
        (relationship as any).candidateCount = (
          resolvedResult as any
        ).candidates.length;
      }
      if ((resolvedResult as any).resolutionPath)
        enrichedMeta.resolutionPath = (resolvedResult as any).resolutionPath;
      enrichedMeta.resolvedTo = { kind: "entity", id: resolvedId };
    }
    const resolvedRel = {
      ...relationship,
      toEntityId: resolvedId,
      metadata: enrichedMeta,
    } as GraphRelationship;
    await (this as any).kgService.createRelationship(
      resolvedRel,
      undefined,
      undefined,
      { validate: false }
    );
    return true;
  };

(SynchronizationCoordinator as any).prototype.resolveRelationshipTarget =
  async function (
    this: SynchronizationCoordinator,
    relationship: GraphRelationship,
    sourceFilePath?: string
  ): Promise<
    | string
    | {
        id: string | null;
        candidates?: Array<{
          id: string;
          name?: string;
          path?: string;
          resolver?: string;
          score?: number;
        }>;
        resolutionPath?: string;
      }
    | null
  > {
    const to = (relationship.toEntityId as any) || "";

    // Prefer structured toRef when present to avoid brittle string parsing
    const toRef: any = (relationship as any).toRef;
    // Establish a currentFilePath context early using fromRef if provided
    let currentFilePath = sourceFilePath;
    const candidates: Array<{
      id: string;
      name?: string;
      path?: string;
      resolver?: string;
      score?: number;
    }> = [];
    try {
      const fromRef: any = (relationship as any).fromRef;
      if (!currentFilePath && fromRef && typeof fromRef === "object") {
        if (fromRef.kind === "fileSymbol" && fromRef.file) {
          currentFilePath = fromRef.file;
        } else if (fromRef.kind === "entity" && fromRef.id) {
          const ent = await (this as any).kgService.getEntity(fromRef.id);
          const p = (ent as any)?.path as string | undefined;
          if (p) currentFilePath = p.includes(":") ? p.split(":")[0] : p;
        }
      }
    } catch {}
    if (toRef && typeof toRef === "object") {
      try {
        if (toRef.kind === "entity" && toRef.id) {
          return { id: toRef.id, candidates, resolutionPath: "entity" };
        }
        if (
          toRef.kind === "fileSymbol" &&
          toRef.file &&
          (toRef.symbol || toRef.name)
        ) {
          const ent = await (this as any).kgService.findSymbolInFile(
            toRef.file,
            toRef.symbol || toRef.name
          );
          if (ent)
            return { id: ent.id, candidates, resolutionPath: "fileSymbol" };
        }
        if (toRef.kind === "external" && toRef.name) {
          const name = toRef.name as string;
          if (!currentFilePath) {
            try {
              const fromEntity = await (this as any).kgService.getEntity(
                relationship.fromEntityId
              );
              if (fromEntity && (fromEntity as any).path) {
                const p = (fromEntity as any).path as string;
                currentFilePath = p.includes(":") ? p.split(":")[0] : p;
              }
            } catch {}
          }
          if (currentFilePath) {
            const local = await (this as any).kgService.findSymbolInFile(
              currentFilePath,
              name
            );
            if (local) {
              candidates.push({
                id: local.id,
                name: (local as any).name,
                path: (local as any).path,
                resolver: "local",
                score: 1.0,
              });
            }
            const near = await (this as any).kgService.findNearbySymbols(
              currentFilePath,
              name,
              5
            );
            for (const n of near)
              candidates.push({
                id: n.id,
                name: (n as any).name,
                path: (n as any).path,
                resolver: "nearby",
              });
          }
          const global = await (this as any).kgService.findSymbolsByName(name);
          for (const g of global) {
            candidates.push({
              id: g.id,
              name: (g as any).name,
              path: (g as any).path,
              resolver: "name",
            });
          }
          if (candidates.length > 0) {
            const chosen = candidates[0];
            const resolutionPath =
              chosen.resolver === "local" ? "external-local" : "external-name";
            return { id: chosen.id, candidates, resolutionPath };
          }
        }
      } catch {}
    }

    // Explicit file placeholder: file:<relPath>:<name>
    {
      const fileMatch = to.match(/^file:(.+?):(.+)$/);
      if (fileMatch) {
        const relPath = fileMatch[1];
        const name = fileMatch[2];
        try {
          const ent = await (this as any).kgService.findSymbolInFile(
            relPath,
            name
          );
          if (ent)
            return {
              id: ent.id,
              candidates,
              resolutionPath: "file-placeholder",
            };
        } catch {}
        return null;
      }
    }

    // Ensure we still have a usable file context for subsequent heuristics
    // (do not redeclare currentFilePath; just populate if missing)
    if (!currentFilePath) {
      try {
        const fromEntity = await (this as any).kgService.getEntity(
          relationship.fromEntityId
        );
        if (fromEntity && (fromEntity as any).path) {
          const p = (fromEntity as any).path as string;
          currentFilePath = p.includes(":") ? p.split(":")[0] : p;
        }
      } catch {}
    }

    const kindMatch = to.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (kindMatch) {
      const kind = kindMatch[1];
      const name = kindMatch[2];
      if (currentFilePath) {
        // Use local index first to avoid DB roundtrips
        const key = `${currentFilePath}:${name}`;
        const localId = (this as any).localSymbolIndex?.get?.(key);
        if (localId)
          return { id: localId, candidates, resolutionPath: "local-index" };
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }
        // Prefer nearby directory symbols if available
        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          3
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const byKind = await (this as any).kgService.findSymbolByKindAndName(
        kind,
        name
      );
      for (const c of byKind)
        candidates.push({
          id: c.id,
          name: (c as any).name,
          path: (c as any).path,
          resolver: "kind-name",
        });
      if (candidates.length > 0)
        return {
          id: candidates[0].id,
          candidates,
          resolutionPath: "kind-name",
        };
      return null;
    }

    const importMatch = to.match(/^import:(.+?):(.+)$/);
    if (importMatch) {
      const name = importMatch[2];
      if (currentFilePath) {
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }
        // Prefer nearby directory symbols for imported names
        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          5
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const byName = await (this as any).kgService.findSymbolsByName(name);
      for (const c of byName) {
        candidates.push({
          id: c.id,
          name: (c as any).name,
          path: (c as any).path,
          resolver: "name",
        });
      }
      if (candidates.length > 0) {
        const chosen = candidates[0];
        const suffix = chosen.resolver === "local" ? "local" : "name";
        return {
          id: chosen.id,
          candidates,
          resolutionPath: `import-${suffix}`,
        };
      }
      return null;
    }

    const externalMatch = to.match(/^external:(.+)$/);
    if (externalMatch) {
      const name = externalMatch[1];
      if (currentFilePath) {
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }
        // Prefer nearby matches
        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          5
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const global = await (this as any).kgService.findSymbolsByName(name);
      for (const g of global) {
        candidates.push({
          id: g.id,
          name: (g as any).name,
          path: (g as any).path,
          resolver: "name",
        });
      }
      if (candidates.length > 0) {
        const chosen = candidates[0];
        const suffix = chosen.resolver === "local" ? "local" : "name";
        return {
          id: chosen.id,
          candidates,
          resolutionPath: `external-${suffix}`,
        };
      }
      return null;
    }

    return null;
  };
