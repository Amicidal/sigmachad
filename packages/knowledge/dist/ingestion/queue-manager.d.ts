/**
 * Queue Manager for High-Throughput Ingestion Pipeline
 * Manages work distribution across partitioned queues with backpressure
 * Based on HighThroughputKnowledgeGraph.md event bus architecture
 */
import { EventEmitter } from 'events';
import { TaskPayload, QueueConfig, QueueMetrics, IngestionEvents } from './types.js';
export interface QueueManagerConfig extends QueueConfig {
    enableBackpressure: boolean;
    backpressureThreshold: number;
    partitionStrategy: 'round_robin' | 'hash' | 'priority';
    metricsInterval: number;
}
export declare class QueueManager extends EventEmitter<IngestionEvents> {
    private queues;
    private partitionMap;
    private metrics;
    private config;
    private running;
    private metricsTimer?;
    private nextPartitionIndex;
    private processedTasks;
    private failedTasks;
    private lastProcessedCount;
    private lastFailedCount;
    constructor(config: QueueManagerConfig);
    /**
     * Start the queue manager
     */
    start(): Promise<void>;
    /**
     * Stop the queue manager
     */
    stop(): Promise<void>;
    /**
     * Enqueue a task for processing
     */
    enqueue(task: TaskPayload, partitionKey?: string): Promise<void>;
    /**
     * Dequeue tasks from a specific partition
     */
    dequeue(partitionId: string, maxTasks?: number): Promise<TaskPayload[]>;
    /**
     * Dequeue tasks in batch mode for better throughput
     */
    dequeueBatch(partitionId?: string): Promise<TaskPayload[]>;
    /**
     * Get tasks from the highest priority queue first
     */
    dequeueByPriority(maxTasks?: number): Promise<TaskPayload[]>;
    /**
     * Requeue a failed task with retry logic
     */
    requeueTask(task: TaskPayload, error?: Error): Promise<void>;
    /**
     * Get current queue metrics
     */
    getMetrics(): QueueMetrics;
    /**
     * Get partition status
     */
    getPartitionStatus(): Record<string, {
        size: number;
        oldestTask?: Date;
    }>;
    /**
     * Check if the queue is experiencing backpressure
     */
    private isBackpressured;
    /**
     * Determine which partition a task should go to
     */
    private getPartition;
    /**
     * Insert task maintaining priority order
     */
    private insertTask;
    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay;
    /**
     * Simple string hash function
     */
    private hashString;
    /**
     * Update queue metrics
     */
    private updateMetrics;
    /**
     * Setup metrics collection
     */
    private setupMetricsCollection;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Stop metrics collection
     */
    private stopMetricsCollection;
    /**
     * Get tasks scheduled for future execution
     */
    getScheduledTasks(): TaskPayload[];
    /**
     * Process any scheduled tasks that are ready
     */
    processScheduledTasks(): TaskPayload[];
    /**
     * Record task completion
     */
    recordTaskCompletion(success: boolean): void;
    /**
     * Calculate throughput (tasks per second)
     */
    private calculateThroughput;
    /**
     * Calculate error rate (0.0 to 1.0)
     */
    private calculateErrorRate;
}
//# sourceMappingURL=queue-manager.d.ts.map