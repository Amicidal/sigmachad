/**
 * Performance Measurement Utilities
 * Common patterns for measuring performance in the ingestion pipeline
 */
import { performance } from 'perf_hooks';
/**
 * Simple timer for measuring operation duration
 */
export class Timer {
    constructor() {
        this.startTime = performance.now();
    }
    /**
     * Stop the timer and return duration in milliseconds
     */
    stop() {
        this.endTime = performance.now();
        return this.endTime - this.startTime;
    }
    /**
     * Get elapsed time without stopping the timer
     */
    elapsed() {
        return performance.now() - this.startTime;
    }
    /**
     * Reset the timer
     */
    reset() {
        this.startTime = performance.now();
        this.endTime = undefined;
    }
}
/**
 * Decorator for measuring function execution time
 */
export function measureTime(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        const timer = new Timer();
        try {
            const result = await originalMethod.apply(this, args);
            const duration = timer.stop();
            console.log(`[Performance] ${propertyKey} took ${duration.toFixed(2)}ms`);
            return result;
        }
        catch (error) {
            const duration = timer.stop();
            console.log(`[Performance] ${propertyKey} failed after ${duration.toFixed(2)}ms`);
            throw error;
        }
    };
}
/**
 * Measure throughput over a period
 */
export class ThroughputMeter {
    constructor() {
        this.items = 0;
        this.startTime = performance.now();
    }
    /**
     * Increment the item count
     */
    increment(count = 1) {
        this.items += count;
    }
    /**
     * Get current throughput (items per second)
     */
    getThroughput() {
        const elapsed = (performance.now() - this.startTime) / 1000; // seconds
        return elapsed > 0 ? this.items / elapsed : 0;
    }
    /**
     * Get total items processed
     */
    getTotalItems() {
        return this.items;
    }
    /**
     * Reset the meter
     */
    reset() {
        this.items = 0;
        this.startTime = performance.now();
    }
}
/**
 * Track latency percentiles
 */
export class LatencyTracker {
    constructor(maxSamples = 1000) {
        this.samples = [];
        this.maxSamples = maxSamples;
    }
    /**
     * Add a latency sample
     */
    addSample(latencyMs) {
        this.samples.push(latencyMs);
        // Keep only the most recent samples
        if (this.samples.length > this.maxSamples) {
            this.samples = this.samples.slice(-this.maxSamples);
        }
    }
    /**
     * Get percentile value
     */
    getPercentile(percentile) {
        if (this.samples.length === 0)
            return 0;
        const sorted = [...this.samples].sort((a, b) => a - b);
        const index = Math.floor((percentile / 100) * sorted.length);
        return sorted[Math.min(index, sorted.length - 1)];
    }
    /**
     * Get common latency metrics
     */
    getMetrics() {
        if (this.samples.length === 0) {
            return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
        }
        const sorted = [...this.samples].sort((a, b) => a - b);
        const sum = this.samples.reduce((acc, val) => acc + val, 0);
        return {
            count: this.samples.length,
            avg: sum / this.samples.length,
            p50: this.getPercentile(50),
            p95: this.getPercentile(95),
            p99: this.getPercentile(99),
            min: sorted[0],
            max: sorted[sorted.length - 1]
        };
    }
    /**
     * Clear all samples
     */
    clear() {
        this.samples = [];
    }
}
/**
 * Memory usage tracker
 */
export class MemoryTracker {
    constructor() {
        this.baseline = process.memoryUsage();
    }
    /**
     * Get current memory usage
     */
    getCurrentUsage() {
        return process.memoryUsage();
    }
    /**
     * Get memory usage delta from baseline
     */
    getDelta() {
        const current = process.memoryUsage();
        return {
            rss: current.rss - this.baseline.rss,
            heapUsed: current.heapUsed - this.baseline.heapUsed,
            heapTotal: current.heapTotal - this.baseline.heapTotal,
            external: current.external - this.baseline.external
        };
    }
    /**
     * Format memory usage in MB
     */
    formatUsage(usage) {
        return {
            rssMB: usage.rss / 1024 / 1024,
            heapUsedMB: usage.heapUsed / 1024 / 1024,
            heapTotalMB: usage.heapTotal / 1024 / 1024,
            externalMB: usage.external / 1024 / 1024
        };
    }
    /**
     * Reset baseline
     */
    reset() {
        this.baseline = process.memoryUsage();
    }
}
/**
 * Batch performance tracker
 */
export class BatchTracker {
    constructor() {
        this.batches = [];
    }
    /**
     * Start tracking a batch
     */
    startBatch(id, size) {
        this.batches.push({
            id,
            size,
            startTime: performance.now(),
            success: false,
            errors: 0
        });
    }
    /**
     * Complete a batch
     */
    completeBatch(id, success = true, errors = 0) {
        const batch = this.batches.find(b => b.id === id);
        if (batch) {
            batch.endTime = performance.now();
            batch.success = success;
            batch.errors = errors;
        }
    }
    /**
     * Get batch statistics
     */
    getStats() {
        const completed = this.batches.filter(b => b.endTime !== undefined);
        const successful = completed.filter(b => b.success);
        const totalItems = this.batches.reduce((sum, b) => sum + b.size, 0);
        if (completed.length === 0) {
            return {
                totalBatches: this.batches.length,
                completedBatches: 0,
                successfulBatches: 0,
                totalItems,
                averageBatchSize: 0,
                averageLatency: 0,
                successRate: 0,
                throughput: 0
            };
        }
        const avgLatency = completed.reduce((sum, b) => sum + (b.endTime - b.startTime), 0) / completed.length;
        const avgBatchSize = totalItems / this.batches.length;
        const successRate = successful.length / completed.length;
        // Calculate throughput based on time span
        const firstBatch = completed[0];
        const lastBatch = completed[completed.length - 1];
        const timeSpanMs = lastBatch.endTime - firstBatch.startTime;
        const throughput = timeSpanMs > 0 ? (completed.length / timeSpanMs) * 1000 : 0;
        return {
            totalBatches: this.batches.length,
            completedBatches: completed.length,
            successfulBatches: successful.length,
            totalItems,
            averageBatchSize: avgBatchSize,
            averageLatency: avgLatency,
            successRate,
            throughput
        };
    }
    /**
     * Clear all batch data
     */
    clear() {
        this.batches = [];
    }
}
/**
 * Resource monitor for tracking CPU and memory over time
 */
export class ResourceMonitor {
    constructor(sampleIntervalMs = 1000, maxSamples = 300) {
        this.samples = [];
        this.sampleInterval = sampleIntervalMs;
        this.maxSamples = maxSamples;
    }
    /**
     * Start monitoring
     */
    start() {
        if (this.interval)
            return;
        this.interval = setInterval(() => {
            this.samples.push({
                timestamp: Date.now(),
                memory: process.memoryUsage(),
                uptime: process.uptime()
            });
            // Keep only the most recent samples
            if (this.samples.length > this.maxSamples) {
                this.samples = this.samples.slice(-this.maxSamples);
            }
        }, this.sampleInterval);
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
    /**
     * Get resource trends
     */
    getTrends() {
        if (this.samples.length < 2) {
            return {
                memoryTrendMB: 0,
                peakMemoryMB: 0,
                averageMemoryMB: 0,
                sampleCount: this.samples.length
            };
        }
        const memoryValues = this.samples.map(s => s.memory.heapUsed / 1024 / 1024);
        const timeSpanMs = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;
        // Calculate memory trend (linear regression slope)
        const n = this.samples.length;
        const sumX = this.samples.reduce((sum, _, i) => sum + i, 0);
        const sumY = memoryValues.reduce((sum, val) => sum + val, 0);
        const sumXY = this.samples.reduce((sum, sample, i) => sum + (i * memoryValues[i]), 0);
        const sumXX = this.samples.reduce((sum, _, i) => sum + (i * i), 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const memoryTrendMB = (slope * (60000 / this.sampleInterval)); // MB per minute
        return {
            memoryTrendMB,
            peakMemoryMB: Math.max(...memoryValues),
            averageMemoryMB: sumY / n,
            sampleCount: n
        };
    }
    /**
     * Clear all samples
     */
    clear() {
        this.samples = [];
    }
}
/**
 * Utility function to run code with performance measurement
 */
export async function measureAsync(operation, label) {
    const timer = new Timer();
    const startMemory = process.memoryUsage().heapUsed;
    try {
        const result = await operation();
        const duration = timer.stop();
        const endMemory = process.memoryUsage().heapUsed;
        const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
        if (label) {
            console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms, memory: ${memoryDelta.toFixed(2)}MB`);
        }
        return { result, duration };
    }
    catch (error) {
        const duration = timer.stop();
        if (label) {
            console.log(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
        }
        throw error;
    }
}
/**
 * Utility function to run code with performance measurement (sync)
 */
export function measureSync(operation, label) {
    const timer = new Timer();
    const startMemory = process.memoryUsage().heapUsed;
    try {
        const result = operation();
        const duration = timer.stop();
        const endMemory = process.memoryUsage().heapUsed;
        const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
        if (label) {
            console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms, memory: ${memoryDelta.toFixed(2)}MB`);
        }
        return { result, duration };
    }
    catch (error) {
        const duration = timer.stop();
        if (label) {
            console.log(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
        }
        throw error;
    }
}
/**
 * Create a performance summary report
 */
export function createPerformanceReport(latencyTracker, throughputMeter, memoryTracker, batchTracker) {
    const latencyMetrics = latencyTracker.getMetrics();
    const batchStats = batchTracker.getStats();
    const memoryDelta = memoryTracker.getDelta();
    const formattedMemory = memoryTracker.formatUsage(memoryTracker.getCurrentUsage());
    return `
Performance Report
==================

Latency Metrics:
  Samples: ${latencyMetrics.count}
  Average: ${latencyMetrics.avg.toFixed(2)}ms
  P50: ${latencyMetrics.p50.toFixed(2)}ms
  P95: ${latencyMetrics.p95.toFixed(2)}ms
  P99: ${latencyMetrics.p99.toFixed(2)}ms
  Min: ${latencyMetrics.min.toFixed(2)}ms
  Max: ${latencyMetrics.max.toFixed(2)}ms

Throughput:
  Rate: ${throughputMeter.getThroughput().toFixed(2)} items/sec
  Total Items: ${throughputMeter.getTotalItems()}

Batch Processing:
  Total Batches: ${batchStats.totalBatches}
  Completed: ${batchStats.completedBatches}
  Success Rate: ${(batchStats.successRate * 100).toFixed(1)}%
  Avg Batch Size: ${batchStats.averageBatchSize.toFixed(1)}
  Avg Latency: ${batchStats.averageLatency.toFixed(2)}ms
  Throughput: ${batchStats.throughput.toFixed(2)} batches/sec

Memory Usage:
  RSS: ${formattedMemory.rssMB.toFixed(1)}MB (Δ${(memoryDelta.rss / 1024 / 1024).toFixed(1)}MB)
  Heap Used: ${formattedMemory.heapUsedMB.toFixed(1)}MB (Δ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(1)}MB)
  Heap Total: ${formattedMemory.heapTotalMB.toFixed(1)}MB (Δ${(memoryDelta.heapTotal / 1024 / 1024).toFixed(1)}MB)
`;
}
//# sourceMappingURL=performance-utils.js.map