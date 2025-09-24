/**
 * Performance Measurement Utilities
 * Common patterns for measuring performance in the ingestion pipeline
 */

import { performance } from 'perf_hooks';

/**
 * Simple timer for measuring operation duration
 */
export class Timer {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and return duration in milliseconds
   */
  stop(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  /**
   * Get elapsed time without stopping the timer
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
  }
}

/**
 * Decorator for measuring function execution time
 */
export function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const timer = new Timer();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = timer.stop();
      console.log(`[Performance] ${propertyKey} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
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
  private items = 0;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Increment the item count
   */
  increment(count: number = 1): void {
    this.items += count;
  }

  /**
   * Get current throughput (items per second)
   */
  getThroughput(): number {
    const elapsed = (performance.now() - this.startTime) / 1000; // seconds
    return elapsed > 0 ? this.items / elapsed : 0;
  }

  /**
   * Get total items processed
   */
  getTotalItems(): number {
    return this.items;
  }

  /**
   * Reset the meter
   */
  reset(): void {
    this.items = 0;
    this.startTime = performance.now();
  }
}

/**
 * Track latency percentiles
 */
export class LatencyTracker {
  private samples: number[] = [];
  private maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;
  }

  /**
   * Add a latency sample
   */
  addSample(latencyMs: number): void {
    this.samples.push(latencyMs);

    // Keep only the most recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  /**
   * Get percentile value
   */
  getPercentile(percentile: number): number {
    if (this.samples.length === 0) return 0;

    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

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
  } {
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
  clear(): void {
    this.samples = [];
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private baseline: NodeJS.MemoryUsage;

  constructor() {
    this.baseline = process.memoryUsage();
  }

  /**
   * Get current memory usage
   */
  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get memory usage delta from baseline
   */
  getDelta(): {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
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
  formatUsage(usage: NodeJS.MemoryUsage): {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
  } {
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
  reset(): void {
    this.baseline = process.memoryUsage();
  }
}

/**
 * Batch performance tracker
 */
export class BatchTracker {
  private batches: Array<{
    id: string;
    size: number;
    startTime: number;
    endTime?: number;
    success: boolean;
    errors: number;
  }> = [];

  /**
   * Start tracking a batch
   */
  startBatch(id: string, size: number): void {
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
  completeBatch(id: string, success: boolean = true, errors: number = 0): void {
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
  getStats(): {
    totalBatches: number;
    completedBatches: number;
    successfulBatches: number;
    totalItems: number;
    averageBatchSize: number;
    averageLatency: number;
    successRate: number;
    throughput: number; // batches per second
  } {
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

    const avgLatency = completed.reduce((sum, b) => sum + (b.endTime! - b.startTime), 0) / completed.length;
    const avgBatchSize = totalItems / this.batches.length;
    const successRate = successful.length / completed.length;

    // Calculate throughput based on time span
    const firstBatch = completed[0];
    const lastBatch = completed[completed.length - 1];
    const timeSpanMs = lastBatch.endTime! - firstBatch.startTime;
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
  clear(): void {
    this.batches = [];
  }
}

/**
 * Resource monitor for tracking CPU and memory over time
 */
export class ResourceMonitor {
  private samples: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  }> = [];
  private interval?: NodeJS.Timeout;
  private sampleInterval: number;
  private maxSamples: number;

  constructor(sampleIntervalMs: number = 1000, maxSamples: number = 300) {
    this.sampleInterval = sampleIntervalMs;
    this.maxSamples = maxSamples;
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.interval) return;

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
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  /**
   * Get resource trends
   */
  getTrends(): {
    memoryTrendMB: number; // MB per minute
    peakMemoryMB: number;
    averageMemoryMB: number;
    sampleCount: number;
  } {
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
  clear(): void {
    this.samples = [];
  }
}

/**
 * Utility function to run code with performance measurement
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
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
  } catch (error) {
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
export function measureSync<T>(
  operation: () => T,
  label?: string
): { result: T; duration: number } {
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
  } catch (error) {
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
export function createPerformanceReport(
  latencyTracker: LatencyTracker,
  throughputMeter: ThroughputMeter,
  memoryTracker: MemoryTracker,
  batchTracker: BatchTracker
): string {
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