import { EventEmitter } from "events";
const DEFAULT_RETRY_DELAY_MS = 5000;
const DEFAULT_MAX_ATTEMPTS = 3;
const defaultLogger = (event, context) => {
    if (context && Object.keys(context).length > 0) {
        console.log(`[SessionCheckpointJob] ${event}`, context);
        return;
    }
    console.log(`[SessionCheckpointJob] ${event}`);
};
export class SessionCheckpointJobRunner extends EventEmitter {
    constructor(kgService, rollbackCapabilities, options = {}) {
        var _a, _b, _c, _d;
        super();
        this.kgService = kgService;
        this.rollbackCapabilities = rollbackCapabilities;
        this.queue = [];
        this.pendingRetryHandles = new Set();
        this.metrics = {
            enqueued: 0,
            completed: 0,
            failed: 0,
            retries: 0,
        };
        this.deadLetters = new Map();
        this.running = 0;
        this.jobCounter = 0;
        this.hydrated = false;
        this.concurrency = Math.max(1, Math.floor((_a = options.concurrency) !== null && _a !== void 0 ? _a : 1));
        this.retryDelayMs = Math.max(100, Math.floor((_b = options.retryDelayMs) !== null && _b !== void 0 ? _b : DEFAULT_RETRY_DELAY_MS));
        this.maxAttempts = Math.max(1, Math.floor((_c = options.maxAttempts) !== null && _c !== void 0 ? _c : DEFAULT_MAX_ATTEMPTS));
        this.logger = (_d = options.logger) !== null && _d !== void 0 ? _d : defaultLogger;
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
    hasPersistence() {
        return !!this.persistence;
    }
    async attachPersistence(persistence) {
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
        }
        catch (error) {
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
    getMetrics() {
        return { ...this.metrics };
    }
    getDeadLetterJobs() {
        return Array.from(this.deadLetters.values()).map((job) => this.toSnapshot(job));
    }
    async idle(timeoutMs = 30000) {
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
    async enqueue(payload) {
        await this.hydrateFromPersistence();
        const seedIds = Array.from(new Set((payload.seedEntityIds || []).filter((value) => typeof value === "string" && value.length > 0)));
        const job = {
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
    async hydrateFromPersistence() {
        var _a;
        if (!this.persistence) {
            return;
        }
        if (this.hydrated) {
            return;
        }
        if (!this.hydrationPromise) {
            this.hydrationPromise = (async () => {
                await this.persistence.initialize();
                const records = await this.persistence.loadPending();
                const existing = new Set(this.queue.map((job) => job.id));
                const rehydrated = [];
                for (const record of records) {
                    if (existing.has(record.id)) {
                        continue;
                    }
                    const attempts = Number.isFinite(record.attempts)
                        ? Math.max(0, Math.floor(record.attempts))
                        : 0;
                    const job = {
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
                const deadLetters = await this.persistence.loadDeadLetters();
                this.deadLetters.clear();
                for (const snapshot of deadLetters) {
                    const job = {
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
        return (_a = this.hydrationPromise) !== null && _a !== void 0 ? _a : Promise.resolve();
    }
    drainQueue() {
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
    nextJobId() {
        this.jobCounter += 1;
        return `checkpoint_job_${Date.now()}_${this.jobCounter}`;
    }
    async persistJob(job, stage, options = {}) {
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
        }
        catch (error) {
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
    async deletePersistedJob(jobId, stage) {
        if (!this.persistence) {
            return;
        }
        try {
            await this.persistence.delete(jobId);
        }
        catch (error) {
            this.logger("persistence_delete_failed", {
                stage,
                jobId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async runJob(job) {
        job.status = "running";
        job.attempts += 1;
        await this.persistJob(job, "start");
        this.safeEmit("jobStarted", { jobId: job.id, attempts: job.attempts, payload: job.payload });
        let checkpointId;
        let checkpointLinkCreated = false;
        try {
            const checkpoint = await this.kgService.createCheckpoint(job.payload.seedEntityIds, {
                reason: job.payload.reason,
                hops: job.payload.hopCount,
                window: job.payload.window
            });
            checkpointId = checkpoint === null || checkpoint === void 0 ? void 0 : checkpoint.checkpointId;
            if (!checkpointId) {
                throw new Error("Checkpoint creation returned empty identifier");
            }
            await this.kgService.annotateSessionRelationshipsWithCheckpoint(job.payload.sessionId, checkpointId);
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
        }
        catch (error) {
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
    async handleCheckpointFailureCleanup(params) {
        const { job, checkpointId, checkpointLinkCreated, errorMessage } = params;
        const { sessionId, seedEntityIds, reason, hopCount, triggeredBy } = job.payload;
        if (seedEntityIds.length > 0) {
            try {
                await this.kgService.annotateSessionRelationshipsWithCheckpoint(sessionId, checkpointId || "manual_intervention");
            }
            catch (annotationError) {
                this.logger("manual_annotation_failed", {
                    jobId: job.id,
                    sessionId,
                    error: annotationError instanceof Error
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
                }
                catch (linkError) {
                    this.logger("checkpoint_link_downgrade_failed", {
                        jobId: job.id,
                        sessionId,
                        checkpointId,
                        error: linkError instanceof Error ? linkError.message : String(linkError),
                    });
                }
            }
            else {
                try {
                    await this.kgService.deleteCheckpoint(checkpointId);
                }
                catch (deleteError) {
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
    toSnapshot(job) {
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
    safeEmit(event, payload) {
        try {
            this.emit(event, payload);
        }
        catch (error) {
            this.logger("listener_error", {
                event,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}
//# sourceMappingURL=SessionCheckpointJob.js.map