/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */
import { EventEmitter } from 'events';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { ASTParser } from './ASTParser.js';
import { DatabaseService } from './DatabaseService.js';
import { FileChange } from './FileWatcher.js';
export interface SyncOperation {
    id: string;
    type: 'full' | 'incremental' | 'partial';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
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
    conflicts: SyncConflict[];
    rollbackPoint?: string;
}
export interface SyncError {
    file: string;
    type: 'parse' | 'database' | 'conflict' | 'unknown';
    message: string;
    timestamp: Date;
    recoverable: boolean;
}
export interface SyncConflict {
    entityId: string;
    type: 'version_conflict' | 'deletion_conflict' | 'relationship_conflict';
    description: string;
    resolution?: 'overwrite' | 'merge' | 'skip';
    timestamp: Date;
}
export interface SyncOptions {
    force?: boolean;
    includeEmbeddings?: boolean;
    maxConcurrency?: number;
    timeout?: number;
    rollbackOnError?: boolean;
    conflictResolution?: 'overwrite' | 'merge' | 'skip' | 'manual';
}
export declare class SynchronizationCoordinator extends EventEmitter {
    private kgService;
    private astParser;
    private dbService;
    private activeOperations;
    private operationQueue;
    private isProcessing;
    private retryQueue;
    private maxRetryAttempts;
    private retryDelay;
    constructor(kgService: KnowledgeGraphService, astParser: ASTParser, dbService: DatabaseService);
    private setupEventHandlers;
    startFullSynchronization(options?: SyncOptions): Promise<string>;
    synchronizeFileChanges(changes: FileChange[]): Promise<string>;
    synchronizePartial(updates: PartialUpdate[]): Promise<string>;
    private processQueue;
    private performFullSync;
    private performIncrementalSync;
    private performPartialSync;
    private scanSourceFiles;
    private detectConflicts;
    rollbackOperation(operationId: string): Promise<boolean>;
    getOperationStatus(operationId: string): SyncOperation | null;
    getActiveOperations(): SyncOperation[];
    getQueueLength(): number;
    private handleOperationCompleted;
    private handleOperationFailed;
    private retryOperation;
    private handleConflictDetected;
}
interface PartialUpdate {
    entityId: string;
    changes: Record<string, any>;
    type: 'update' | 'delete' | 'create';
}
export {};
//# sourceMappingURL=SynchronizationCoordinator.d.ts.map