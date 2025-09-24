# Package: jobs
Generated: 2025-09-23 07:07:26 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 81 | ⚠️ |
| Critical Issues | 0 | ✅ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 0 | ✅ |
| Antipatterns | 3 | 🔍 |

### Notable Issues

#### ⚠️ Warnings (2)
Issues that should be addressed but aren't critical:

- `SessionCheckpointJob.ts:41` - Direct console.log in class - use proper logging abstraction
- `SessionCheckpointJob.ts:44` - Direct console.log in class - use proper logging abstraction

#### 🔍 Code Antipatterns (3)
Design and architecture issues that should be refactored:

- `SessionCheckpointJob.ts:41` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionCheckpointJob.ts:44` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionCheckpointJob.ts:560` - **Event type using raw string - consider using enum or const** [weak-event-types]

#### ℹ️ Informational
79 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
persistence/
  PostgresSessionCheckpointJobStore.ts
index.ts
SessionCheckpointJob.ts
SessionCheckpointTypes.ts
TemporalHistoryValidator.ts

================================================================
Files
================================================================

================
File: persistence/PostgresSessionCheckpointJobStore.ts
================
import type { IPostgreSQLService } from "@memento/database";
import type {
  SessionCheckpointJobPersistence,
  SessionCheckpointJobRuntimeStatus,
  SessionCheckpointJobSnapshot,
} from "../SessionCheckpointTypes.js";

const TABLE_NAME = "session_checkpoint_jobs";
const PENDING_STATUSES: SessionCheckpointJobRuntimeStatus[] = [
  "queued",
  "pending",
  "running",
];
const DEAD_LETTER_STATUSES: SessionCheckpointJobRuntimeStatus[] = [
  "manual_intervention",
];

export class PostgresSessionCheckpointJobStore
  implements SessionCheckpointJobPersistence
{
  private initialized = false;

  constructor(private readonly postgres: IPostgreSQLService) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.postgres.query(
      `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
         job_id TEXT PRIMARY KEY,
         session_id TEXT NOT NULL,
         payload JSONB NOT NULL,
         status TEXT NOT NULL,
         attempts INTEGER NOT NULL DEFAULT 0,
         last_error TEXT NULL,
         queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    await this.postgres.query(
      `CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_status_idx
         ON ${TABLE_NAME} (status, queued_at)`
    );

    this.initialized = true;
  }

  async loadPending(): Promise<SessionCheckpointJobSnapshot[]> {
    await this.ensureInitialized();
    const result = await this.postgres.query(
      `SELECT job_id, payload, status, attempts, last_error, queued_at, updated_at
         FROM ${TABLE_NAME}
        WHERE status = ANY($1)
        ORDER BY queued_at ASC` as string,
      [PENDING_STATUSES]
    );

    const rows = Array.isArray(result?.rows) ? result.rows : [];
    return rows.map((row) => this.mapRow(row));
  }

  async upsert(job: SessionCheckpointJobSnapshot): Promise<void> {
    await this.ensureInitialized();

    const payload = this.normalizePayload(job.payload);
    const queuedAt = job.queuedAt instanceof Date ? job.queuedAt.toISOString() : null;
    const attempts = Number.isFinite(job.attempts)
      ? Math.max(0, Math.floor(job.attempts))
      : 0;

    await this.postgres.query(
      `INSERT INTO ${TABLE_NAME} (job_id, session_id, payload, status, attempts, last_error, queued_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, COALESCE($7, NOW()), NOW())
         ON CONFLICT (job_id) DO UPDATE SET
           payload = EXCLUDED.payload,
           status = EXCLUDED.status,
           attempts = EXCLUDED.attempts,
           last_error = EXCLUDED.last_error,
           updated_at = NOW(),
           queued_at = COALESCE(${TABLE_NAME}.queued_at, EXCLUDED.queued_at)` as string,
      [
        job.id,
        job.payload.sessionId,
        JSON.stringify(payload),
        job.status,
        attempts,
        job.lastError ?? null,
        queuedAt,
      ]
    );
  }

  async delete(jobId: string): Promise<void> {
    await this.ensureInitialized();
    await this.postgres.query(
      `DELETE FROM ${TABLE_NAME} WHERE job_id = $1` as string,
      [jobId]
    );
  }

  async loadDeadLetters(): Promise<SessionCheckpointJobSnapshot[]> {
    await this.ensureInitialized();
    const result = await this.postgres.query(
      `SELECT job_id, payload, status, attempts, last_error, queued_at, updated_at
         FROM ${TABLE_NAME}
        WHERE status = ANY($1)
        ORDER BY updated_at DESC` as string,
      [DEAD_LETTER_STATUSES]
    );

    const rows = Array.isArray(result?.rows) ? result.rows : [];
    return rows.map((row) => this.mapRow(row));
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private mapRow(row: any): SessionCheckpointJobSnapshot {
    const payloadRaw = row?.payload;
    const payloadValue =
      typeof payloadRaw === "string"
        ? this.safeParseJson(payloadRaw)
        : payloadRaw;

    const payload = this.normalizePayload(
      payloadValue as SessionCheckpointJobSnapshot["payload"]
    );

    const queuedAt = row?.queued_at ? new Date(row.queued_at) : undefined;
    const updatedAt = row?.updated_at ? new Date(row.updated_at) : undefined;
    const attemptsValue = Number(row?.attempts);

    return {
      id: String(row?.job_id ?? ""),
      payload,
      attempts: Number.isFinite(attemptsValue) ? attemptsValue : 0,
      status: this.normalizeStatus(row?.status),
      lastError: row?.last_error ? String(row.last_error) : undefined,
      queuedAt,
      updatedAt,
    };
  }

  private normalizePayload(payload: SessionCheckpointJobSnapshot["payload"]): SessionCheckpointJobSnapshot["payload"] {
    const dedupedSeeds = Array.from(
      new Set(
        (payload.seedEntityIds || []).filter(
          (value): value is string => typeof value === "string" && value.length > 0
        )
      )
    );
    return {
      ...payload,
      seedEntityIds: dedupedSeeds,
    };
  }

  private normalizeStatus(input: unknown): SessionCheckpointJobRuntimeStatus {
    const raw = typeof input === "string" ? input.toLowerCase() : "";
    if (PENDING_STATUSES.includes(raw as SessionCheckpointJobRuntimeStatus)) {
      return raw as SessionCheckpointJobRuntimeStatus;
    }
    if (["completed", "failed", "manual_intervention"].includes(raw)) {
      return raw as SessionCheckpointJobRuntimeStatus;
    }
    return "queued";
  }

  private safeParseJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
}

================
File: index.ts
================
export * from './SessionCheckpointJob.js';
export * from './SessionCheckpointTypes.js';
export * from './TemporalHistoryValidator.js';
export * from './persistence/PostgresSessionCheckpointJobStore.js';

================
File: SessionCheckpointJob.ts
================
import { EventEmitter } from "events";
import { KnowledgeGraphService } from "@memento/graph";
import { RollbackCapabilities } from "@memento/core";
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
      .annotateSessionRelationshipsWithCheckpoint(payload.sessionId, "pending")
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
        {
          reason: job.payload.reason,
          hops: job.payload.hopCount,
          window: job.payload.window
        }
      );
      checkpointId = checkpoint?.checkpointId;

      if (!checkpointId) {
        throw new Error("Checkpoint creation returned empty identifier");
      }

      await this.kgService.annotateSessionRelationshipsWithCheckpoint(
        job.payload.sessionId,
        checkpointId
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
        await this.kgService.annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId || "manual_intervention");
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

================
File: SessionCheckpointTypes.ts
================
import { TimeRangeParams } from "@memento/graph";

export type SessionCheckpointStatus =
  | "pending"
  | "completed"
  | "failed"
  | "manual_intervention";

export type SessionCheckpointJobRuntimeStatus =
  | SessionCheckpointStatus
  | "queued"
  | "running"
  | "pending";

export interface SessionCheckpointJobPayload {
  sessionId: string;
  seedEntityIds: string[];
  reason: "daily" | "incident" | "manual";
  hopCount: number;
  operationId?: string;
  sequenceNumber?: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  triggeredBy?: string;
  window?: TimeRangeParams;
}

export interface SessionCheckpointJobSnapshot {
  id: string;
  payload: SessionCheckpointJobPayload;
  attempts: number;
  status: SessionCheckpointJobRuntimeStatus;
  lastError?: string;
  queuedAt?: Date;
  updatedAt?: Date;
}

export interface SessionCheckpointJobPersistence {
  initialize(): Promise<void>;
  loadPending(): Promise<SessionCheckpointJobSnapshot[]>;
  upsert(job: SessionCheckpointJobSnapshot): Promise<void>;
  delete(jobId: string): Promise<void>;
  loadDeadLetters(): Promise<SessionCheckpointJobSnapshot[]>;
}

================
File: TemporalHistoryValidator.ts
================
import { KnowledgeGraphService } from "@memento/graph";
import type { EntityTimelineResult } from "@memento/graph";

export type TemporalValidationIssueType =
  | "missing_previous"
  | "misordered_previous"
  | "unexpected_head";

export interface TemporalValidationIssue {
  entityId: string;
  versionId: string;
  type: TemporalValidationIssueType;
  expectedPreviousId?: string;
  actualPreviousId?: string | null;
  message?: string;
  repaired?: boolean;
}

export interface TemporalValidationReport {
  scannedEntities: number;
  inspectedVersions: number;
  repairedLinks: number;
  issues: TemporalValidationIssue[];
}

export interface TemporalValidationOptions {
  batchSize?: number;
  maxEntities?: number;
  timelineLimit?: number;
  autoRepair?: boolean;
  dryRun?: boolean;
  logger?: (message: string, context?: Record<string, unknown>) => void;
}

export class TemporalHistoryValidator {
  constructor(private readonly kgService: KnowledgeGraphService) {}

  async validate(
    options: TemporalValidationOptions = {}
  ): Promise<TemporalValidationReport> {
    const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 25));
    const timelineLimit = Math.max(10, Math.min(200, options.timelineLimit ?? 200));
    const autoRepair = Boolean(options.autoRepair);
    const dryRun = Boolean(options.dryRun);
    const log = options.logger ?? (() => undefined);

    const issues: TemporalValidationIssue[] = [];
    let repairedLinks = 0;
    let inspectedVersions = 0;
    let scannedEntities = 0;
    let offset = 0;
    let totalEntities: number | undefined;

    while (true) {
      const { entities, total } = await this.kgService.listEntities({
        limit: batchSize,
        offset,
      });
      totalEntities = total;

      if (!entities || entities.length === 0) {
        break;
      }

      for (const entity of entities) {
        scannedEntities += 1;
        if (
          typeof options.maxEntities === "number" &&
          scannedEntities > options.maxEntities
        ) {
          return {
            scannedEntities: scannedEntities - 1,
            inspectedVersions,
            repairedLinks,
            issues,
          };
        }

        const timeline = await this.kgService.getEntityTimeline(entity.id, {
          limit: timelineLimit,
        });
        inspectedVersions += timeline.versions.length;
        this.evaluateTimeline(
          timeline,
          issues,
          autoRepair,
          dryRun,
          timelineLimit,
          () => {
            log("temporal_history_validator.missing_previous", {
              entityId: timeline.entityId,
              versionId: timeline.versions.length
                ? timeline.versions[timeline.versions.length - 1].versionId
                : undefined,
            });
          }
        );

        if (autoRepair && !dryRun) {
          const repairedIds = await this.repairMissingLinks(timeline);
          repairedLinks += repairedIds.length;
          if (repairedIds.length > 0) {
            for (const issue of issues) {
              if (
                issue.entityId === timeline.entityId &&
                issue.type === "missing_previous"
              ) {
                if (repairedIds.includes(issue.versionId)) {
                  issue.repaired = true;
                } else if (issue.repaired === undefined) {
                  issue.repaired = false;
                }
              }
            }
            log("temporal_history_validator.repaired", {
              entityId: timeline.entityId,
              repairs: repairedIds.length,
            });
          } else {
            for (const issue of issues) {
              if (
                issue.entityId === timeline.entityId &&
                issue.type === "missing_previous" &&
                issue.repaired === undefined
              ) {
                issue.repaired = false;
              }
            }
          }
        }
      }

      offset += batchSize;
      if (typeof totalEntities === "number" && offset >= totalEntities) {
        break;
      }
    }

    return { scannedEntities, inspectedVersions, repairedLinks, issues };
  }

  private evaluateTimeline(
    timeline: EntityTimelineResult,
    issues: TemporalValidationIssue[],
    autoRepair: boolean,
    dryRun: boolean,
    timelineLimit: number,
    onMissing?: () => void
  ): void {
    const versions = [...timeline.versions].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    if (versions.length === 0) {
      return;
    }

    const hasFullHistory = versions.length < timelineLimit;

    const first = versions[0];
    if (hasFullHistory && first.previousVersionId) {
      issues.push({
        entityId: timeline.entityId,
        versionId: first.versionId,
        type: "unexpected_head",
        actualPreviousId: first.previousVersionId,
        message: "Earliest version should not reference a previous version",
      });
    }

    for (let index = 1; index < versions.length; index += 1) {
      const prev = versions[index - 1];
      const current = versions[index];
      const expectedPrev = prev.versionId;
      const actualPrev = current.previousVersionId ?? null;

      if (!actualPrev) {
        onMissing?.();
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: "missing_previous",
          expectedPreviousId: expectedPrev,
          repaired: autoRepair && !dryRun ? undefined : false,
        });
        continue;
      }

      if (actualPrev !== expectedPrev) {
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: "misordered_previous",
          expectedPreviousId: expectedPrev,
          actualPreviousId: actualPrev,
        });
      } else if (current.timestamp.getTime() < prev.timestamp.getTime()) {
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: "misordered_previous",
          expectedPreviousId: expectedPrev,
          actualPreviousId: actualPrev,
          message: "Version timestamp is older than its predecessor",
        });
      }
    }
  }

  private async repairMissingLinks(
    timeline: EntityTimelineResult
  ): Promise<string[]> {
    const sorted = [...timeline.versions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const repairedVersionIds: string[] = [];

    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1];
      const current = sorted[index];
      if (current.previousVersionId) {
        continue;
      }
      await this.kgService.repairPreviousVersionLink(current.versionId);
      repairedVersionIds.push(current.versionId);
    }

    return repairedVersionIds;
  }
}



================================================================
End of Codebase
================================================================
