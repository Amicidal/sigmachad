/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */
import { EventEmitter } from "events";
import { KnowledgeGraphService } from "./knowledge/KnowledgeGraphService.js";
import { ASTParser } from "./knowledge/ASTParser.js";
import { DatabaseService } from "./core/DatabaseService.js";
import { FileChange } from "./core/FileWatcher.js";
import { GraphRelationship } from "../models/relationships.js";
import { ConflictResolution as ConflictResolutionService, Conflict } from "./scm/ConflictResolution.js";
import { RollbackCapabilities } from "./scm/RollbackCapabilities.js";
import { SessionCheckpointJobRunner, type SessionCheckpointJobMetrics, type SessionCheckpointJobSnapshot } from "../jobs/SessionCheckpointJob.js";
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
    type: "parse" | "database" | "conflict" | "unknown" | "rollback" | "cancelled" | "capability";
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
export type SessionEventKind = "session_started" | "session_keepalive" | "session_relationships" | "session_checkpoint" | "session_teardown";
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
    status?: SyncOperation["status"] | "failed" | "cancelled" | "queued" | "manual_intervention";
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
export declare class SynchronizationCoordinator extends EventEmitter {
    private kgService;
    private astParser;
    private dbService;
    private conflictResolution;
    private rollbackCapabilities?;
    private activeOperations;
    private completedOperations;
    private operationQueue;
    private isProcessing;
    private paused;
    private resumeWaiters;
    private retryQueue;
    private maxRetryAttempts;
    private retryDelay;
    private operationCounter;
    private cancelledOperations;
    private unresolvedRelationships;
    private sessionKeepaliveTimers;
    private activeSessionIds;
    private tuning;
    private localSymbolIndex;
    private sessionSequenceState;
    private sessionSequence;
    private checkpointJobRunner;
    private anomalyResolutionMode;
    constructor(kgService: KnowledgeGraphService, astParser: ASTParser, dbService: DatabaseService, conflictResolution: ConflictResolutionService, rollbackCapabilities?: RollbackCapabilities, checkpointJobRunner?: SessionCheckpointJobRunner);
    private setupEventHandlers;
    private nextSessionSequence;
    private createCheckpointJobOptions;
    private ensureCheckpointPersistence;
    private scheduleSessionCheckpoint;
    private enqueueCheckpointWithNotification;
    private bindCheckpointJobEvents;
    updateTuning(operationId: string, tuning: {
        maxConcurrency?: number;
        batchSize?: number;
    }): boolean;
    private nextOperationId;
    private ensureNotCancelled;
    private ensureDatabaseReady;
    private recordSessionSequence;
    private clearSessionTracking;
    private toIsoTimestamp;
    private serializeSessionRelationship;
    private emitSessionEvent;
    getCheckpointMetrics(): {
        metrics: SessionCheckpointJobMetrics;
        deadLetters: SessionCheckpointJobSnapshot[];
    };
    private emitCheckpointMetrics;
    startSync(): Promise<string>;
    stopSync(): Promise<void>;
    stop(): Promise<void>;
    startFullSynchronization(options?: SyncOptions): Promise<string>;
    synchronizeFileChanges(changes: FileChange[], options?: SyncOptions): Promise<string>;
    synchronizePartial(updates: PartialUpdate[], options?: SyncOptions): Promise<string>;
    private processQueue;
    private operationHasBlockingErrors;
    private finalizeSuccessfulOperation;
    private finalizeFailedOperation;
    private attemptRollback;
    pauseSync(): void;
    resumeSync(): void;
    isPaused(): boolean;
    private performFullSync;
    private performIncrementalSync;
    private performPartialSync;
    private scanSourceFiles;
    private logConflicts;
    private detectConflicts;
    rollbackOperation(operationId: string): Promise<boolean>;
    getOperationStatus(operationId: string): SyncOperation | null;
    getActiveOperations(): SyncOperation[];
    getQueueLength(): number;
    startIncrementalSynchronization(options?: SyncOptions): Promise<string>;
    startPartialSynchronization(paths: string[], options?: SyncOptions): Promise<string>;
    cancelOperation(operationId: string): Promise<boolean>;
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
    };
    private handleOperationCompleted;
    private handleOperationFailed;
    private retryOperation;
    private handleConflictDetected;
    private runPostResolution;
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
declare module "./synchronization/SynchronizationCoordinator.js" {
    interface SynchronizationCoordinator {
        resolveAndCreateRelationship(relationship: GraphRelationship, sourceFilePath?: string): Promise<boolean>;
        resolveRelationshipTarget(relationship: GraphRelationship, sourceFilePath?: string): Promise<string | null>;
    }
}
//# sourceMappingURL=SynchronizationCoordinator.d.ts.map