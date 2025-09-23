/**
 * Maintenance Service for Memento
 * Handles system maintenance tasks including cleanup, optimization, reindexing, and validation
 */
import { DatabaseService } from './DatabaseService.js';
import { KnowledgeGraphService } from '../knowledge/KnowledgeGraphService.js';
export interface MaintenanceTask {
    id: string;
    name: string;
    description: string;
    type: 'cleanup' | 'optimize' | 'reindex' | 'validate';
    estimatedDuration: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startTime?: Date;
    endTime?: Date;
    error?: string;
}
export interface MaintenanceResult {
    taskId: string;
    success: boolean;
    duration: number;
    changes: any[];
    statistics: Record<string, any>;
}
export declare class MaintenanceService {
    private dbService;
    private kgService;
    private activeTasks;
    private completedTasks;
    private readonly temporalValidator;
    constructor(dbService: DatabaseService, kgService: KnowledgeGraphService);
    runMaintenanceTask(taskType: string): Promise<MaintenanceResult>;
    private runCleanup;
    private runOptimization;
    private runReindexing;
    private runValidation;
    private findOrphanedEntities;
    private removeDanglingRelationships;
    private cleanupOldSyncRecords;
    private cleanupOrphanedEmbeddings;
    private validateDatabaseConnections;
    private isValidEntity;
    private getEntityIssues;
    private isValidRelationship;
    private getTaskName;
    private getTaskDescription;
    private getEstimatedDuration;
    getActiveTasks(): MaintenanceTask[];
    getTaskStatus(taskId: string): MaintenanceTask | undefined;
    getCompletedTask(taskId: string): MaintenanceTask | undefined;
    getCompletedTasks(): MaintenanceTask[];
    private ensureDependenciesReady;
}
//# sourceMappingURL=MaintenanceService.d.ts.map