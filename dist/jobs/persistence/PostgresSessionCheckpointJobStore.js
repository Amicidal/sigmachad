const TABLE_NAME = "session_checkpoint_jobs";
const PENDING_STATUSES = [
    "queued",
    "pending",
    "running",
];
const DEAD_LETTER_STATUSES = [
    "manual_intervention",
];
export class PostgresSessionCheckpointJobStore {
    constructor(postgres) {
        this.postgres = postgres;
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        await this.postgres.query(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
         job_id TEXT PRIMARY KEY,
         session_id TEXT NOT NULL,
         payload JSONB NOT NULL,
         status TEXT NOT NULL,
         attempts INTEGER NOT NULL DEFAULT 0,
         last_error TEXT NULL,
         queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`);
        await this.postgres.query(`CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_status_idx
         ON ${TABLE_NAME} (status, queued_at)`);
        this.initialized = true;
    }
    async loadPending() {
        await this.ensureInitialized();
        const result = await this.postgres.query(`SELECT job_id, payload, status, attempts, last_error, queued_at, updated_at
         FROM ${TABLE_NAME}
        WHERE status = ANY($1)
        ORDER BY queued_at ASC`, [PENDING_STATUSES]);
        const rows = Array.isArray(result === null || result === void 0 ? void 0 : result.rows) ? result.rows : [];
        return rows.map((row) => this.mapRow(row));
    }
    async upsert(job) {
        var _a;
        await this.ensureInitialized();
        const payload = this.normalizePayload(job.payload);
        const queuedAt = job.queuedAt instanceof Date ? job.queuedAt.toISOString() : null;
        const attempts = Number.isFinite(job.attempts)
            ? Math.max(0, Math.floor(job.attempts))
            : 0;
        await this.postgres.query(`INSERT INTO ${TABLE_NAME} (job_id, session_id, payload, status, attempts, last_error, queued_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, COALESCE($7, NOW()), NOW())
         ON CONFLICT (job_id) DO UPDATE SET
           payload = EXCLUDED.payload,
           status = EXCLUDED.status,
           attempts = EXCLUDED.attempts,
           last_error = EXCLUDED.last_error,
           updated_at = NOW(),
           queued_at = COALESCE(${TABLE_NAME}.queued_at, EXCLUDED.queued_at)`, [
            job.id,
            job.payload.sessionId,
            JSON.stringify(payload),
            job.status,
            attempts,
            (_a = job.lastError) !== null && _a !== void 0 ? _a : null,
            queuedAt,
        ]);
    }
    async delete(jobId) {
        await this.ensureInitialized();
        await this.postgres.query(`DELETE FROM ${TABLE_NAME} WHERE job_id = $1`, [jobId]);
    }
    async loadDeadLetters() {
        await this.ensureInitialized();
        const result = await this.postgres.query(`SELECT job_id, payload, status, attempts, last_error, queued_at, updated_at
         FROM ${TABLE_NAME}
        WHERE status = ANY($1)
        ORDER BY updated_at DESC`, [DEAD_LETTER_STATUSES]);
        const rows = Array.isArray(result === null || result === void 0 ? void 0 : result.rows) ? result.rows : [];
        return rows.map((row) => this.mapRow(row));
    }
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }
    mapRow(row) {
        var _a;
        const payloadRaw = row === null || row === void 0 ? void 0 : row.payload;
        const payloadValue = typeof payloadRaw === "string"
            ? this.safeParseJson(payloadRaw)
            : payloadRaw;
        const payload = this.normalizePayload(payloadValue);
        const queuedAt = (row === null || row === void 0 ? void 0 : row.queued_at) ? new Date(row.queued_at) : undefined;
        const updatedAt = (row === null || row === void 0 ? void 0 : row.updated_at) ? new Date(row.updated_at) : undefined;
        const attemptsValue = Number(row === null || row === void 0 ? void 0 : row.attempts);
        return {
            id: String((_a = row === null || row === void 0 ? void 0 : row.job_id) !== null && _a !== void 0 ? _a : ""),
            payload,
            attempts: Number.isFinite(attemptsValue) ? attemptsValue : 0,
            status: this.normalizeStatus(row === null || row === void 0 ? void 0 : row.status),
            lastError: (row === null || row === void 0 ? void 0 : row.last_error) ? String(row.last_error) : undefined,
            queuedAt,
            updatedAt,
        };
    }
    normalizePayload(payload) {
        const dedupedSeeds = Array.from(new Set((payload.seedEntityIds || []).filter((value) => typeof value === "string" && value.length > 0)));
        return {
            ...payload,
            seedEntityIds: dedupedSeeds,
        };
    }
    normalizeStatus(input) {
        const raw = typeof input === "string" ? input.toLowerCase() : "";
        if (PENDING_STATUSES.includes(raw)) {
            return raw;
        }
        if (["completed", "failed", "manual_intervention"].includes(raw)) {
            return raw;
        }
        return "queued";
    }
    safeParseJson(value) {
        try {
            return JSON.parse(value);
        }
        catch (_a) {
            return {};
        }
    }
}
//# sourceMappingURL=PostgresSessionCheckpointJobStore.js.map