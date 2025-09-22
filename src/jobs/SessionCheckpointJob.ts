import { EventEmitter } from "events";
import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
import { RollbackCapabilities } from "../services/scm/RollbackCapabilities.js";
import {
  SessionCheckpointJobPayload,
  SessionCheckpointJobPersistence,
  SessionCheckpointJobRuntimeStatus,
  SessionCheckpointJobSnapshot,
  SessionCheckpointStatus,
} from "./SessionCheckpointTypes.js";

export type { SessionCheckpointStatus, SessionCheckpointJobPayload } from "./SessionCheckpointTypes.js";
export type { SessionCheckpointJobPersistence, SessionCheckpointJobSnapshot } from "./SessionCheckpointTypes.js";

export interface SessionCheckpointJobOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  concurrency?: number;
  logger?: (event: string, context?: Record<string, unknown>) => void;
  persistence?: SessionCheckpointJobPersistence;
}

export interface SessionCheckpointJobMetrics {
  enqueued: number;
  completed: number;
  failed: number;
  retries: number;
}

interface InternalSessionCheckpointJob extends SessionCheckpointJobSnapshot {
  status: SessionCheckpointJobRuntimeStatus;
  queuedAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_RETRY_DELAY_MS = 5_000;
const DEFAULT_MAX_ATTEMPTS = 3;

const defaultLogger = (event: string, context?: Record<string, unknown>) => {
  if (context && Object.keys(context).length > 0) {
    console.log(`[SessionCheckpointJob] ${event}`, context);
    return;
  }
  console.log(`[SessionCheckpointJob] ${event}`);
};

export class SessionCheckpointJobRunner extends EventEmitter {
  private readonly queue: InternalSessionCheckpointJob[] = [];
  private readonly pendingRetryHandles = new Set<NodeJS.Timeout>();
  private readonly metrics: SessionCheckpointJobMetrics = {
    enqueued: 0,
    completed: 0,
    failed: 0,
    retries: 0,
  };
  private readonly deadLetters = new Map<string, InternalSessionCheckpointJob>();
  private running = 0;
  private jobCounter = 0;
  private readonly concurrency: number;
  private readonly retryDelayMs: number;
  private readonly maxAttempts: number;
  private readonly logger: (event: string, context?: Record<string, unknown>) => void;
  private persistence?: SessionCheckpointJobPersistence;
  private hydrated = false;
  private hydrationPromise?: Promise<void>;

  constructor(
    private readonly kgService: KnowledgeGraphService,
    private readonly rollbackCapabilities?: RollbackCapabilities,
    options: SessionCheckpointJobOptions = {}
  ) {
    super();
    this.concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
    this.retryDelayMs = Math.max(100, Math.floor(options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS));
    this.maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
    this.logger = options.logger ?? defaultLogger;
    this.persistence = options.persistence;

    if (this.persistence) {
      void this.hydrateFromPersistence()
        .then(() => this.drainQueue())
        .catch((error) => {
          this.logger("initial_hydration_failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }
  }

  hasPersistence(): boolean {
    return !!this.persistence;
  }

  async attachPersistence(persistence: SessionCheckpointJobPersistence): Promise<void> {
    if (!persistence) {
      return;
    }

    if (this.persistence === persistence && this.hydrated) {
      return;
    }

    this.persistence = persistence;
    this.hydrated = false;
    this.hydrationPromise = undefined;

    try {
      await this.persistence.initialize();
    } catch (error) {
      this.logger("persistence_initialize_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    const queuedJobsSnapshot = [...this.queue];
    for (const job of queuedJobsSnapshot) {
      await this.persistJob(job, "attach_queue");
    }

    for (const job of this.deadLetters.values()) {
      await this.persistJob(job, "attach_dead_letter");
    }

    await this.hydrateFromPersistence();
    this.drainQueue();
  }

  getMetrics(): SessionCheckpointJobMetrics {
    return { ...this.metrics };
  }

  getDeadLetterJobs(): SessionCheckpointJobSnapshot[] {
    return Array.from(this.deadLetters.values()).map((job) => this.toSnapshot(job));
  }

  async idle(timeoutMs = 30_000): Promise<void> {
    await this.hydrateFromPersistence();

    const start = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        const queueEmpty = this.queue.length === 0;
        const noRunning = this.running === 0;
        const noRetries = this.pendingRetryHandles.size === 0;
        if (queueEmpty && noRunning && noRetries) {
          resolve();
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error("SessionCheckpointJobRunner idle timeout"));
          return;
        }
        setTimeout(check, 25);
      };
      check();
    });
  }

  async enqueue(payload: SessionCheckpointJobPayload): Promise<string> {
    await this.hydrateFromPersistence();

    const seedIds = Array.from(
      new Set(
        (payload.seedEntityIds || []).filter(
          (value): value is string => typeof value === "string" && value.length > 0
        )
      )
    );
    const job: InternalSessionCheckpointJob = {
      id: this.nextJobId(),
      payload: { ...payload, seedEntityIds: seedIds },
      attempts: 0,
      status: "queued",
      queuedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.persistJob(job, "enqueue", { throwOnError: true });

    this.metrics.enqueued += 1;
    this.queue.push(job);
    this.logger("enqueued", {
      jobId: job.id,
      sessionId: payload.sessionId,
      seeds: seedIds.length,
    });
    this.safeEmit("jobEnqueued", { jobId: job.id, payload: job.payload });

    void this.kgService
      .annotateSessionRelationshipsWithCheckpoint(payload.sessionId, seedIds, {
        status: "pending",
        reason: payload.reason,
        hopCount: payload.hopCount,
        seedEntityIds: seedIds,
        triggeredBy: payload.triggeredBy,
      })
      .catch((error) => {
        this.logger("pending_annotation_failed", {
          jobId: job.id,
          sessionId: payload.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    this.drainQueue();
    return job.id;
  }

  private async hydrateFromPersistence(): Promise<void> {
    if (!this.persistence) {
      return;
    }

    if (this.hydrated) {
      return;
    }

    if (!this.hydrationPromise) {
      this.hydrationPromise = (async () => {
        await this.persistence!.initialize();
        const records = await this.persistence!.loadPending();
        const existing = new Set(this.queue.map((job) => job.id));
        const rehydrated: InternalSessionCheckpointJob[] = [];
        for (const record of records) {
          if (existing.has(record.id)) {
            continue;
          }
          const attempts = Number.isFinite(record.attempts)
            ? Math.max(0, Math.floor(record.attempts))
            : 0;
          const job: InternalSessionCheckpointJob = {
            id: record.id,
            payload: record.payload,
            attempts,
            status: "queued",
            lastError: record.lastError,
            queuedAt: record.queuedAt instanceof Date ? record.queuedAt : undefined,
            updatedAt: new Date(),
          };
          rehydrated.push(job);
        }

        for (const job of rehydrated) {
          this.queue.push(job);
          await this.persistJob(job, "rehydrate");
        }

        if (rehydrated.length > 0) {
          this.metrics.enqueued += rehydrated.length;
          this.logger("rehydrated", { count: rehydrated.length });
        }

        const deadLetters = await this.persistence!.loadDeadLetters();
        this.deadLetters.clear();
        for (const snapshot of deadLetters) {
          const job: InternalSessionCheckpointJob = {
            ...snapshot,
            status: snapshot.status,
            queuedAt: snapshot.queuedAt,
            updatedAt: snapshot.updatedAt,
          };
          this.deadLetters.set(job.id, job);
        }

        this.hydrated = true;
      })()
        .catch((error) => {
          this.logger("rehydration_failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          this.hydrated = false;
          throw error;
        })
        .finally(() => {
          this.hydrationPromise = undefined;
        });
    }

    return this.hydrationPromise ?? Promise.resolve();
  }

  private drainQueue(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }
      this.running += 1;
      this.runJob(job)
        .catch((error) => {
          this.logger("job_unhandled_error", {
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          this.running = Math.max(0, this.running - 1);
          setImmediate(() => this.drainQueue());
        });
    }
  }

  private nextJobId(): string {
    this.jobCounter += 1;
    return `checkpoint_job_${Date.now()}_${this.jobCounter}`;
  }

  private async persistJob(
    job: InternalSessionCheckpointJob,
    stage: string,
    options: { throwOnError?: boolean } = {}
  ): Promise<void> {
    if (!this.persistence) {
      return;
    }
    try {
      job.updatedAt = new Date();
      await this.persistence.upsert({
        id: job.id,
        payload: job.payload,
        attempts: job.attempts,
        status: job.status,
        lastError: job.lastError,
        queuedAt: job.queuedAt,
        updatedAt: job.updatedAt,
      });
    } catch (error) {
      this.logger("persistence_upsert_failed", {
        stage,
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (options.throwOnError) {
        throw error;
      }
    }
  }

  private async deletePersistedJob(jobId: string, stage: string): Promise<void> {
    if (!this.persistence) {
      return;
    }
    try {
      await this.persistence.delete(jobId);
    } catch (error) {
      this.logger("persistence_delete_failed", {
        stage,
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async runJob(job: InternalSessionCheckpointJob): Promise<void> {
    job.status = "running";
    job.attempts += 1;
    await this.persistJob(job, "start");
    this.safeEmit("jobStarted", { jobId: job.id, attempts: job.attempts, payload: job.payload });

    let checkpointId: string | undefined;
    let checkpointLinkCreated = false;

    try {
      const checkpoint = await this.kgService.createCheckpoint(
        job.payload.seedEntityIds,
        job.payload.reason,
        job.payload.hopCount,
        job.payload.window
      );
      checkpointId = checkpoint?.checkpointId;

      if (!checkpointId) {
        throw new Error("Checkpoint creation returned empty identifier");
      }

      await this.kgService.annotateSessionRelationshipsWithCheckpoint(
        job.payload.sessionId,
        job.payload.seedEntityIds,
        {
          status: "completed",
          checkpointId,
          reason: job.payload.reason,
          hopCount: job.payload.hopCount,
          attempts: job.attempts,
          seedEntityIds: job.payload.seedEntityIds,
          jobId: job.id,
          triggeredBy: job.payload.triggeredBy,
        }
      );

      if (this.rollbackCapabilities && typeof this.rollbackCapabilities.registerCheckpointLink === "function") {
        this.rollbackCapabilities.registerCheckpointLink(job.payload.sessionId, {
          checkpointId,
          reason: job.payload.reason,
          hopCount: job.payload.hopCount,
          attempts: job.attempts,
          seedEntityIds: job.payload.seedEntityIds,
          jobId: job.id,
          timestamp: new Date(),
        });
      }

      await this.kgService.createSessionCheckpointLink(job.payload.sessionId, checkpointId, {
        reason: job.payload.reason,
        hopCount: job.payload.hopCount,
        status: "completed",
        sequenceNumber: job.payload.sequenceNumber,
        eventId: job.payload.eventId,
        actor: job.payload.actor,
        annotations: job.payload.annotations,
        jobId: job.id,
        attempts: job.attempts,
        seedEntityIds: job.payload.seedEntityIds,
        triggeredBy: job.payload.triggeredBy,
      });
      checkpointLinkCreated = true;

      this.metrics.completed += 1;
      job.status = "completed";
      job.lastError = undefined;
      await this.persistJob(job, "completed");
      await this.deletePersistedJob(job.id, "completed_cleanup");
      this.safeEmit("jobCompleted", {
        jobId: job.id,
        attempts: job.attempts,
        checkpointId,
        payload: job.payload,
      });
      this.logger("completed", {
        jobId: job.id,
        sessionId: job.payload.sessionId,
        checkpointId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      job.lastError = errorMessage;
      const shouldRetry = job.attempts < this.maxAttempts;
      this.logger("attempt_failed", {
        jobId: job.id,
        sessionId: job.payload.sessionId,
        attempt: job.attempts,
        maxAttempts: this.maxAttempts,
        retrying: shouldRetry,
        error: errorMessage,
      });
      this.safeEmit("jobAttemptFailed", {
        jobId: job.id,
        attempts: job.attempts,
        error: errorMessage,
        payload: job.payload,
      });

      if (shouldRetry) {
        job.status = "pending";
        this.metrics.retries += 1;
        await this.persistJob(job, "retry_pending");
        const handle = setTimeout(() => {
          this.pendingRetryHandles.delete(handle);
          job.status = "queued";
          void this.persistJob(job, "retry_queued");
          this.queue.push(job);
          this.drainQueue();
        }, this.retryDelayMs);
        this.pendingRetryHandles.add(handle);
        return;
      }

      job.status = "manual_intervention";
      this.metrics.failed += 1;
      await this.persistJob(job, "failed_final");
      this.safeEmit("jobFailed", {
        jobId: job.id,
        attempts: job.attempts,
        error: errorMessage,
        payload: job.payload,
      });

      await this.handleCheckpointFailureCleanup({
        job,
        checkpointId,
        checkpointLinkCreated,
        errorMessage,
      });

      this.deadLetters.set(job.id, { ...job });
      this.safeEmit("jobDeadLettered", {
        jobId: job.id,
        attempts: job.attempts,
        error: errorMessage,
        payload: job.payload,
      });
    }
  }

  private async handleCheckpointFailureCleanup(params: {
    job: InternalSessionCheckpointJob;
    checkpointId?: string;
    checkpointLinkCreated: boolean;
    errorMessage: string;
  }): Promise<void> {
    const { job, checkpointId, checkpointLinkCreated, errorMessage } = params;
    const { sessionId, seedEntityIds, reason, hopCount, triggeredBy } = job.payload;

    if (seedEntityIds.length > 0) {
      try {
        await this.kgService.annotateSessionRelationshipsWithCheckpoint(sessionId, seedEntityIds, {
          status: "manual_intervention",
          checkpointId,
          reason,
          hopCount,
          attempts: job.attempts,
          seedEntityIds,
          jobId: job.id,
          error: errorMessage,
          triggeredBy,
        });
      } catch (annotationError) {
        this.logger("manual_annotation_failed", {
          jobId: job.id,
          sessionId,
          error:
            annotationError instanceof Error
              ? annotationError.message
              : String(annotationError),
        });
      }
    }

    if (checkpointId) {
      if (checkpointLinkCreated) {
        try {
          await this.kgService.createSessionCheckpointLink(sessionId, checkpointId, {
            reason,
            hopCount,
            status: "manual_intervention",
            sequenceNumber: job.payload.sequenceNumber,
            eventId: job.payload.eventId,
            actor: job.payload.actor,
            annotations: job.payload.annotations,
            jobId: job.id,
            attempts: job.attempts,
            seedEntityIds,
            error: errorMessage,
            triggeredBy,
          });
        } catch (linkError) {
          this.logger("checkpoint_link_downgrade_failed", {
            jobId: job.id,
            sessionId,
            checkpointId,
            error: linkError instanceof Error ? linkError.message : String(linkError),
          });
        }
      } else {
        try {
          await this.kgService.deleteCheckpoint(checkpointId);
        } catch (deleteError) {
          this.logger("checkpoint_cleanup_failed", {
            jobId: job.id,
            sessionId,
            checkpointId,
            error: deleteError instanceof Error ? deleteError.message : String(deleteError),
          });
        }
      }
    }
  }

  private toSnapshot(job: InternalSessionCheckpointJob): SessionCheckpointJobSnapshot {
    return {
      id: job.id,
      payload: job.payload,
      attempts: job.attempts,
      status: job.status,
      lastError: job.lastError,
      queuedAt: job.queuedAt,
      updatedAt: job.updatedAt,
    };
  }

  private safeEmit(event: string, payload?: unknown): void {
    try {
      this.emit(event, payload);
    } catch (error) {
      this.logger("listener_error", {
        event,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
