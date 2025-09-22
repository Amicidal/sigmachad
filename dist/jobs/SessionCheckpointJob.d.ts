import { EventEmitter } from "events";
import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
import { RollbackCapabilities } from "../services/scm/RollbackCapabilities.js";
import { SessionCheckpointJobPayload, SessionCheckpointJobPersistence, SessionCheckpointJobSnapshot } from "./SessionCheckpointTypes.js";
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
export declare class SessionCheckpointJobRunner extends EventEmitter {
    private readonly kgService;
    private readonly rollbackCapabilities?;
    private readonly queue;
    private readonly pendingRetryHandles;
    private readonly metrics;
    private readonly deadLetters;
    private running;
    private jobCounter;
    private readonly concurrency;
    private readonly retryDelayMs;
    private readonly maxAttempts;
    private readonly logger;
    private persistence?;
    private hydrated;
    private hydrationPromise?;
    constructor(kgService: KnowledgeGraphService, rollbackCapabilities?: RollbackCapabilities | undefined, options?: SessionCheckpointJobOptions);
    hasPersistence(): boolean;
    attachPersistence(persistence: SessionCheckpointJobPersistence): Promise<void>;
    getMetrics(): SessionCheckpointJobMetrics;
    getDeadLetterJobs(): SessionCheckpointJobSnapshot[];
    idle(timeoutMs?: number): Promise<void>;
    enqueue(payload: SessionCheckpointJobPayload): Promise<string>;
    private hydrateFromPersistence;
    private drainQueue;
    private nextJobId;
    private persistJob;
    private deletePersistedJob;
    private runJob;
    private handleCheckpointFailureCleanup;
    private toSnapshot;
    private safeEmit;
}
//# sourceMappingURL=SessionCheckpointJob.d.ts.map