/**
 * Performance Monitoring Utilities for High-Throughput Ingestion Pipeline
 * Provides real-time metrics collection, P95 latency tracking, and performance alerts
 */
import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    throughput: {
        filesPerSecond: number;
        entitiesPerSecond: number;
        relationshipsPerSecond: number;
        locPerMinute: number;
        bytesPerSecond: number;
    };
    latency: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        max: number;
        min: number;
    };
    resources: {
        memoryUsageMB: number;
        cpuUsagePercent: number;
        heapUsedMB: number;
        heapTotalMB: number;
        gcPausesMs: number[];
    };
    queues: {
        depth: number;
        processingRate: number;
        errorRate: number;
        oldestItemAge: number;
    };
    workers: {
        activeWorkers: number;
        idleWorkers: number;
        busyWorkers: number;
        erroringWorkers: number;
        averageTasksPerWorker: number;
    };
    errors: {
        totalErrors: number;
        errorRate: number;
        errorsByType: Record<string, number>;
        recentErrors: Array<{
            timestamp: Date;
            error: string;
            context?: any;
        }>;
    };
}
export interface PerformanceAlert {
    severity: 'info' | 'warning' | 'error' | 'critical';
    metric: string;
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    context?: any;
}
export interface PerformanceConfig {
    metricsInterval: number;
    latencyBufferSize: number;
    thresholds: {
        latencyP95Ms: number;
        memoryUsageMB: number;
        errorRate: number;
        queueDepth: number;
        throughputLOCPerMin: number;
    };
    retentionPeriod: number;
    maxErrorHistory: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private config;
    private latencyBuffer;
    private throughputBuffer;
    private errorHistory;
    private metricsTimer?;
    private gcObserver?;
    private currentMetrics;
    private lastMetricsTime;
    private activeOperations;
    private counters;
    constructor(config?: Partial<PerformanceConfig>);
    /**
     * Start performance monitoring
     */
    start(): void;
    /**
     * Stop performance monitoring
     */
    stop(): void;
    /**
     * Record the start of an operation
     */
    startOperation(operationId: string, operation: string, context?: any): void;
    /**
     * Record the completion of an operation
     */
    endOperation(operationId: string, operation: string, context?: any): void;
    /**
     * Record an error
     */
    recordError(error: string, context?: any): void;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get performance summary for a time period
     */
    getSummary(periodMs?: number): {
        metrics: PerformanceMetrics;
        period: string;
        sampleCount: number;
    };
    /**
     * Force a metrics update
     */
    updateMetrics(): void;
    /**
     * Create empty metrics object
     */
    private createEmptyMetrics;
    /**
     * Calculate current metrics from all data
     */
    private calculateCurrentMetrics;
    /**
     * Calculate metrics from specific samples
     */
    private calculateMetricsFromSamples;
    /**
     * Calculate latency metrics from current buffer
     */
    private calculateLatencyMetrics;
    /**
     * Get current resource metrics
     */
    private getResourceMetrics;
    /**
     * Calculate error metrics
     */
    private calculateErrorMetrics;
    /**
     * Update counters based on operation type
     */
    private updateCountersFromOperation;
    /**
     * Reset throughput counters
     */
    private resetCounters;
    /**
     * Check thresholds and emit alerts
     */
    private checkThresholds;
    /**
     * Emit a performance alert
     */
    private emitAlert;
    /**
     * Clean up old data to prevent memory leaks
     */
    private cleanupOldData;
    /**
     * Setup GC monitoring
     */
    private setupGCMonitoring;
    /**
     * Classify error for categorization
     */
    private classifyError;
    /**
     * Update queue metrics (called externally by queue manager)
     */
    updateQueueMetrics(metrics: PerformanceMetrics['queues']): void;
    /**
     * Update worker metrics (called externally by worker pool)
     */
    updateWorkerMetrics(metrics: PerformanceMetrics['workers']): void;
}
//# sourceMappingURL=performance-monitor.d.ts.map