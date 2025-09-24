/**
 * Worker Pool for High-Throughput Ingestion Pipeline
 * Manages parallel processing workers with health monitoring
 * Based on HighThroughputKnowledgeGraph.md distributed worker architecture
 */
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { TaskPayload, WorkerConfig, WorkerMetrics, WorkerResult, IngestionEvents } from './types.js';
export interface WorkerPoolConfig {
    maxWorkers: number;
    minWorkers: number;
    workerTimeout: number;
    healthCheckInterval: number;
    restartThreshold: number;
    autoScale: boolean;
    scalingRules: {
        scaleUpThreshold: number;
        scaleDownThreshold: number;
        scaleUpCooldown: number;
        scaleDownCooldown: number;
    };
}
export interface WorkerInstance {
    id: string;
    config: WorkerConfig;
    worker?: Worker;
    status: 'starting' | 'idle' | 'busy' | 'error' | 'stopping' | 'stopped';
    currentTask?: TaskPayload;
    metrics: WorkerMetrics;
    lastHealthCheck: Date;
    errorCount: number;
    startedAt: Date;
    stoppedAt?: Date;
}
export type WorkerHandler = (task: TaskPayload) => Promise<any>;
export declare class WorkerPool extends EventEmitter<IngestionEvents> {
    private workers;
    private handlers;
    private config;
    private running;
    private healthCheckTimer?;
    private autoScaleTimer?;
    private lastScaleUp;
    private lastScaleDown;
    constructor(config: WorkerPoolConfig);
    /**
     * Start the worker pool
     */
    start(): Promise<void>;
    /**
     * Stop the worker pool
     */
    stop(): Promise<void>;
    /**
     * Register a task handler for a specific worker type
     */
    registerHandler(workerType: string, handler: WorkerHandler): void;
    /**
     * Execute a task using available workers
     */
    executeTask(task: TaskPayload): Promise<WorkerResult>;
    /**
     * Execute multiple tasks in parallel
     */
    executeTasks(tasks: TaskPayload[]): Promise<WorkerResult[]>;
    /**
     * Get worker pool metrics
     */
    getMetrics(): {
        totalWorkers: number;
        activeWorkers: number;
        idleWorkers: number;
        errorWorkers: number;
        workers: WorkerMetrics[];
    };
    /**
     * Scale workers to target count
     */
    scaleWorkers(targetCount: number): Promise<void>;
    /**
     * Get an available worker for a specific task type
     */
    private getAvailableWorker;
    /**
     * Execute a task on a specific worker
     */
    private executeTaskOnWorker;
    /**
     * Add new workers to the pool
     */
    private addWorkers;
    /**
     * Remove workers from the pool
     */
    private removeWorkers;
    /**
     * Create a new worker instance
     */
    private createWorker;
    /**
     * Get the path to the worker script
     */
    private getWorkerScriptPath;
    /**
     * Handle messages from worker threads
     */
    private handleWorkerMessage;
    /**
     * Handle task result from worker thread
     */
    private handleTaskResult;
    /**
     * Stop a specific worker
     */
    private stopWorker;
    /**
     * Stop all workers
     */
    private stopAllWorkers;
    /**
     * Update worker metrics after task completion
     */
    private updateWorkerMetrics;
    /**
     * Handle worker errors
     */
    private handleWorkerError;
    /**
     * Restart a failed worker
     */
    private restartWorker;
    /**
     * Group tasks by type for better allocation
     */
    private groupTasksByType;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring
     */
    private stopHealthMonitoring;
    /**
     * Perform health checks on all workers
     */
    private performHealthChecks;
    /**
     * Start auto-scaling
     */
    private startAutoScaling;
    /**
     * Stop auto-scaling
     */
    private stopAutoScaling;
    /**
     * Perform auto-scaling based on metrics
     */
    private performAutoScaling;
    /**
     * Estimate queue depth based on worker utilization
     * This is a heuristic until we have actual queue manager integration
     */
    private estimateQueueDepth;
}
//# sourceMappingURL=worker-pool.d.ts.map