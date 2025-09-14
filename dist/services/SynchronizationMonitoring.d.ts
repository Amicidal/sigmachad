/**
 * Synchronization Monitoring Service
 * Comprehensive tracking and monitoring of graph synchronization operations
 */
import { EventEmitter } from 'events';
import { SyncOperation, SyncError, SyncConflict } from './SynchronizationCoordinator.js';
import { Conflict } from './ConflictResolution.js';
export interface SyncMetrics {
    operationsTotal: number;
    operationsSuccessful: number;
    operationsFailed: number;
    averageSyncTime: number;
    totalEntitiesProcessed: number;
    totalRelationshipsProcessed: number;
    errorRate: number;
    throughput: number;
}
export interface PerformanceMetrics {
    averageParseTime: number;
    averageGraphUpdateTime: number;
    averageEmbeddingTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    ioWaitTime: number;
}
export interface HealthMetrics {
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    lastSyncTime: Date;
    consecutiveFailures: number;
    queueDepth: number;
    activeOperations: number;
    systemLoad: number;
}
export interface MonitoringAlert {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    operationId?: string;
    resolved: boolean;
    resolution?: string;
}
export interface SyncLogEntry {
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    operationId: string;
    message: string;
    data?: any;
}
export declare class SynchronizationMonitoring extends EventEmitter {
    private operations;
    private metrics;
    private performanceMetrics;
    private alerts;
    private logs;
    private healthCheckInterval?;
    private opPhases;
    constructor();
    private setupEventHandlers;
    private startHealthMonitoring;
    stopHealthMonitoring(): void;
    recordOperationStart(operation: SyncOperation): void;
    recordOperationComplete(operation: SyncOperation): void;
    recordOperationFailed(operation: SyncOperation, error?: any): void;
    /**
     * Record in-progress phase updates for an operation
     */
    recordProgress(operation: SyncOperation, data: {
        phase: string;
        progress?: number;
    }): void;
    /**
     * Return current phases map for active operations
     */
    getOperationPhases(): Record<string, {
        phase: string;
        progress: number;
    }>;
    recordConflict(conflict: SyncConflict | Conflict): void;
    recordError(operationId: string, error: SyncError | string | unknown): void;
    private updateSyncMetrics;
    private updatePerformanceMetrics;
    getSyncMetrics(): SyncMetrics;
    getPerformanceMetrics(): PerformanceMetrics;
    getHealthMetrics(): HealthMetrics;
    private getLastSyncTime;
    private getConsecutiveFailures;
    private getQueueDepth;
    private getSystemLoad;
    getActiveOperations(): SyncOperation[];
    getOperationHistory(limit?: number): SyncOperation[];
    getAlerts(activeOnly?: boolean): MonitoringAlert[];
    resolveAlert(alertId: string, resolution?: string): boolean;
    private triggerAlert;
    private performHealthCheck;
    private handleOperationStarted;
    private handleOperationCompleted;
    private handleOperationFailed;
    private handleConflictDetected;
    private handleAlertTriggered;
    private log;
    getLogs(limit?: number): SyncLogEntry[];
    getLogsByOperation(operationId: string): SyncLogEntry[];
    generateReport(): {
        summary: SyncMetrics;
        performance: PerformanceMetrics;
        health: HealthMetrics;
        recentOperations: SyncOperation[];
        activeAlerts: MonitoringAlert[];
    };
    cleanup(maxAge?: number): void;
}
//# sourceMappingURL=SynchronizationMonitoring.d.ts.map