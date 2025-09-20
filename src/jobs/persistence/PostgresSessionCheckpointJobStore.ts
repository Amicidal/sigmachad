import type { IPostgreSQLService } from "../../services/database/interfaces.js";
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
