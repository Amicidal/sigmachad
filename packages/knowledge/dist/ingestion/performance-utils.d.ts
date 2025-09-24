/**
 * Performance Measurement Utilities
 * Common patterns for measuring performance in the ingestion pipeline
 */
/**
 * Simple timer for measuring operation duration
 */
export declare class Timer {
    private startTime;
    private endTime?;
    constructor();
    /**
     * Stop the timer and return duration in milliseconds
     */
    stop(): number;
    /**
     * Get elapsed time without stopping the timer
     */
    elapsed(): number;
    /**
     * Reset the timer
     */
    reset(): void;
}
/**
 * Decorator for measuring function execution time
 */
export declare function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Measure throughput over a period
 */
export declare class ThroughputMeter {
    private items;
    private startTime;
    constructor();
    /**
     * Increment the item count
     */
    increment(count?: number): void;
    /**
     * Get current throughput (items per second)
     */
    getThroughput(): number;
    /**
     * Get total items processed
     */
    getTotalItems(): number;
    /**
     * Reset the meter
     */
    reset(): void;
}
/**
 * Track latency percentiles
 */
export declare class LatencyTracker {
    private samples;
    private maxSamples;
    constructor(maxSamples?: number);
    /**
     * Add a latency sample
     */
    addSample(latencyMs: number): void;
    /**
     * Get percentile value
     */
    getPercentile(percentile: number): number;
    /**
     * Get common latency metrics
     */
    getMetrics(): {
        count: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        min: number;
        max: number;
    };
    /**
     * Clear all samples
     */
    clear(): void;
}
/**
 * Memory usage tracker
 */
export declare class MemoryTracker {
    private baseline;
    constructor();
    /**
     * Get current memory usage
     */
    getCurrentUsage(): NodeJS.MemoryUsage;
    /**
     * Get memory usage delta from baseline
     */
    getDelta(): {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    /**
     * Format memory usage in MB
     */
    formatUsage(usage: NodeJS.MemoryUsage): {
        rssMB: number;
        heapUsedMB: number;
        heapTotalMB: number;
        externalMB: number;
    };
    /**
     * Reset baseline
     */
    reset(): void;
}
/**
 * Batch performance tracker
 */
export declare class BatchTracker {
    private batches;
    /**
     * Start tracking a batch
     */
    startBatch(id: string, size: number): void;
    /**
     * Complete a batch
     */
    completeBatch(id: string, success?: boolean, errors?: number): void;
    /**
     * Get batch statistics
     */
    getStats(): {
        totalBatches: number;
        completedBatches: number;
        successfulBatches: number;
        totalItems: number;
        averageBatchSize: number;
        averageLatency: number;
        successRate: number;
        throughput: number;
    };
    /**
     * Clear all batch data
     */
    clear(): void;
}
/**
 * Resource monitor for tracking CPU and memory over time
 */
export declare class ResourceMonitor {
    private samples;
    private interval?;
    private sampleInterval;
    private maxSamples;
    constructor(sampleIntervalMs?: number, maxSamples?: number);
    /**
     * Start monitoring
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Get resource trends
     */
    getTrends(): {
        memoryTrendMB: number;
        peakMemoryMB: number;
        averageMemoryMB: number;
        sampleCount: number;
    };
    /**
     * Clear all samples
     */
    clear(): void;
}
/**
 * Utility function to run code with performance measurement
 */
export declare function measureAsync<T>(operation: () => Promise<T>, label?: string): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Utility function to run code with performance measurement (sync)
 */
export declare function measureSync<T>(operation: () => T, label?: string): {
    result: T;
    duration: number;
};
/**
 * Create a performance summary report
 */
export declare function createPerformanceReport(latencyTracker: LatencyTracker, throughputMeter: ThroughputMeter, memoryTracker: MemoryTracker, batchTracker: BatchTracker): string;
//# sourceMappingURL=performance-utils.d.ts.map