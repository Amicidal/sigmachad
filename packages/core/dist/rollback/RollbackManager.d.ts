/**
 * Main rollback orchestration manager
 */
import { EventEmitter } from 'events';
import { RollbackPoint, RollbackOperation, RollbackOperationType, RollbackStrategy, RollbackConfig, RollbackStoreOptions, ConflictResolution, RollbackDiff, RollbackMetrics } from './RollbackTypes.js';
/**
 * Integration interfaces for external services
 */
interface DatabaseService {
    isReady(): Promise<boolean>;
}
interface KnowledgeGraphService {
    getEntities(): Promise<any[]>;
    getRelationships(): Promise<any[]>;
    restoreEntities(entities: any[]): Promise<void>;
    restoreRelationships(relationships: any[]): Promise<void>;
}
interface FileSystemService {
    getFileContents(path: string): Promise<string>;
    writeFileContents(path: string, contents: string): Promise<void>;
    listFiles(directory: string): Promise<string[]>;
}
interface SessionManager {
    getCurrentSessionId(): string | null;
    getSessionData(sessionId: string): Promise<any>;
    restoreSessionData(sessionId: string, data: any): Promise<void>;
}
/**
 * Main rollback manager that orchestrates all rollback operations
 */
export declare class RollbackManager extends EventEmitter {
    private config;
    private snapshotManager;
    private diffEngine;
    private store;
    private activeOperations;
    private databaseService?;
    private knowledgeGraphService?;
    private fileSystemService?;
    private sessionManager?;
    constructor(config: RollbackConfig, storeOptions?: RollbackStoreOptions);
    /**
     * Set service integrations
     */
    setServices(services: {
        databaseService?: DatabaseService;
        knowledgeGraphService?: KnowledgeGraphService;
        fileSystemService?: FileSystemService;
        sessionManager?: SessionManager;
    }): void;
    /**
     * Create a new rollback point
     */
    createRollbackPoint(name: string, description?: string, metadata?: Record<string, any>): Promise<RollbackPoint>;
    /**
     * Get a rollback point by ID
     */
    getRollbackPoint(id: string): Promise<RollbackPoint | null>;
    /**
     * Get all rollback points
     */
    getAllRollbackPoints(): Promise<RollbackPoint[]>;
    /**
     * Get rollback points for a specific session
     */
    getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]>;
    /**
     * Create a snapshot at the current state
     */
    createSnapshot(rollbackPointId: string): Promise<void>;
    /**
     * Generate diff between current state and a rollback point
     */
    generateDiff(rollbackPointId: string): Promise<RollbackDiff>;
    /**
     * Perform a rollback operation
     */
    rollback(rollbackPointId: string, options?: {
        type?: RollbackOperationType;
        strategy?: RollbackStrategy;
        conflictResolution?: ConflictResolution;
        dryRun?: boolean;
    }): Promise<RollbackOperation>;
    /**
     * Get rollback operation status
     */
    getRollbackOperation(operationId: string): Promise<RollbackOperation | null>;
    /**
     * Cancel a rollback operation
     */
    cancelRollback(operationId: string): Promise<boolean>;
    /**
     * Delete a rollback point and its snapshots
     */
    deleteRollbackPoint(id: string): Promise<boolean>;
    /**
     * Clean up expired rollback points and operations
     */
    cleanup(): Promise<{
        removedPoints: number;
        removedOperations: number;
        removedSnapshots: number;
    }>;
    /**
     * Get current metrics
     */
    getMetrics(): RollbackMetrics;
    /**
     * Shutdown the rollback manager
     */
    shutdown(): Promise<void>;
    /**
     * Execute a rollback operation
     */
    private executeRollback;
    /**
     * Handle rollback operation errors
     */
    private handleRollbackError;
    /**
     * Capture snapshots of current state
     */
    private captureSnapshots;
}
export {};
//# sourceMappingURL=RollbackManager.d.ts.map