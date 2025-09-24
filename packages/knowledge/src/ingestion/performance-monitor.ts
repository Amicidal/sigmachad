/**
 * Performance Monitoring Utilities for High-Throughput Ingestion Pipeline
 * Provides real-time metrics collection, P95 latency tracking, and performance alerts
 */

import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  // Throughput metrics
  throughput: {
    filesPerSecond: number;
    entitiesPerSecond: number;
    relationshipsPerSecond: number;
    locPerMinute: number;
    bytesPerSecond: number;
  };

  // Latency metrics
  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };

  // Resource metrics
  resources: {
    memoryUsageMB: number;
    cpuUsagePercent: number;
    heapUsedMB: number;
    heapTotalMB: number;
    gcPausesMs: number[];
  };

  // Queue metrics
  queues: {
    depth: number;
    processingRate: number;
    errorRate: number;
    oldestItemAge: number;
  };

  // Worker metrics
  workers: {
    activeWorkers: number;
    idleWorkers: number;
    busyWorkers: number;
    erroringWorkers: number;
    averageTasksPerWorker: number;
  };

  // Error metrics
  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{ timestamp: Date; error: string; context?: any }>;
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
  // Measurement intervals
  metricsInterval: number; // How often to calculate metrics (ms)
  latencyBufferSize: number; // Number of latency samples to keep

  // Alert thresholds
  thresholds: {
    latencyP95Ms: number;
    memoryUsageMB: number;
    errorRate: number;
    queueDepth: number;
    throughputLOCPerMin: number;
  };

  // Data retention
  retentionPeriod: number; // How long to keep historical data (ms)
  maxErrorHistory: number; // Max number of errors to track
}

interface LatencySample {
  timestamp: number;
  latency: number;
  operation: string;
  context?: any;
}

interface ThroughputSample {
  timestamp: number;
  files: number;
  entities: number;
  relationships: number;
  loc: number;
  bytes: number;
}

export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private latencyBuffer: LatencySample[] = [];
  private throughputBuffer: ThroughputSample[] = [];
  private errorHistory: Array<{ timestamp: Date; error: string; context?: any }> = [];
  private metricsTimer?: NodeJS.Timeout;
  private gcObserver?: any;

  // Current state tracking
  private currentMetrics: PerformanceMetrics;
  private lastMetricsTime = Date.now();
  private activeOperations = new Map<string, number>(); // operationId -> startTime

  // Counters
  private counters = {
    files: 0,
    entities: 0,
    relationships: 0,
    loc: 0,
    bytes: 0,
    errors: 0,
    totalOperations: 0
  };

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();

    this.config = {
      metricsInterval: 5000,
      latencyBufferSize: 1000,
      thresholds: {
        latencyP95Ms: 1000,
        memoryUsageMB: 1000,
        errorRate: 0.05,
        queueDepth: 1000,
        throughputLOCPerMin: 10000
      },
      retentionPeriod: 3600000, // 1 hour
      maxErrorHistory: 100,
      ...config
    };

    this.currentMetrics = this.createEmptyMetrics();
    this.setupGCMonitoring();
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.metricsTimer) {
      return; // Already started
    }

    console.log('[PerformanceMonitor] Starting performance monitoring');

    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, this.config.metricsInterval);

    this.emit('monitor:started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = undefined;
    }

    console.log('[PerformanceMonitor] Stopped performance monitoring');
    this.emit('monitor:stopped');
  }

  /**
   * Record the start of an operation
   */
  startOperation(operationId: string, operation: string, context?: any): void {
    this.activeOperations.set(operationId, Date.now());
    this.counters.totalOperations++;
  }

  /**
   * Record the completion of an operation
   */
  endOperation(operationId: string, operation: string, context?: any): void {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] Operation ${operationId} not found in active operations`);
      return;
    }

    const latency = Date.now() - startTime;
    this.activeOperations.delete(operationId);

    // Add to latency buffer
    this.latencyBuffer.push({
      timestamp: Date.now(),
      latency,
      operation,
      context
    });

    // Trim buffer if needed
    if (this.latencyBuffer.length > this.config.latencyBufferSize) {
      this.latencyBuffer = this.latencyBuffer.slice(-this.config.latencyBufferSize);
    }

    // Update counters based on operation type
    this.updateCountersFromOperation(operation, context);
  }

  /**
   * Record an error
   */
  recordError(error: string, context?: any): void {
    this.counters.errors++;

    const errorRecord = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorHistory.push(errorRecord);

    // Trim error history if needed
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }

    this.emit('error:recorded', errorRecord);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get performance summary for a time period
   */
  getSummary(periodMs: number = 60000): {
    metrics: PerformanceMetrics;
    period: string;
    sampleCount: number;
  } {
    const now = Date.now();
    const cutoff = now - periodMs;

    // Filter latency samples for the period
    const periodLatencies = this.latencyBuffer.filter(sample => sample.timestamp >= cutoff);

    // Filter throughput samples for the period
    const periodThroughput = this.throughputBuffer.filter(sample => sample.timestamp >= cutoff);

    // Calculate metrics for the period
    const metrics = this.calculateMetricsFromSamples(periodLatencies, periodThroughput);

    return {
      metrics,
      period: `${periodMs / 1000}s`,
      sampleCount: periodLatencies.length
    };
  }

  /**
   * Force a metrics update
   */
  updateMetrics(): void {
    this.currentMetrics = this.calculateCurrentMetrics();
    this.emit('metrics:updated', this.currentMetrics);
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      throughput: {
        filesPerSecond: 0,
        entitiesPerSecond: 0,
        relationshipsPerSecond: 0,
        locPerMinute: 0,
        bytesPerSecond: 0
      },
      latency: {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0
      },
      resources: {
        memoryUsageMB: 0,
        cpuUsagePercent: 0,
        heapUsedMB: 0,
        heapTotalMB: 0,
        gcPausesMs: []
      },
      queues: {
        depth: 0,
        processingRate: 0,
        errorRate: 0,
        oldestItemAge: 0
      },
      workers: {
        activeWorkers: 0,
        idleWorkers: 0,
        busyWorkers: 0,
        erroringWorkers: 0,
        averageTasksPerWorker: 0
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        errorsByType: {},
        recentErrors: []
      }
    };
  }

  /**
   * Calculate current metrics from all data
   */
  private calculateCurrentMetrics(): PerformanceMetrics {
    const now = Date.now();
    const timeSinceLastUpdate = (now - this.lastMetricsTime) / 1000; // seconds
    this.lastMetricsTime = now;

    // Calculate throughput
    const throughput = {
      filesPerSecond: this.counters.files / timeSinceLastUpdate,
      entitiesPerSecond: this.counters.entities / timeSinceLastUpdate,
      relationshipsPerSecond: this.counters.relationships / timeSinceLastUpdate,
      locPerMinute: (this.counters.loc / timeSinceLastUpdate) * 60,
      bytesPerSecond: this.counters.bytes / timeSinceLastUpdate
    };

    // Reset counters for next period
    this.resetCounters();

    // Calculate latency metrics
    const latency = this.calculateLatencyMetrics();

    // Get resource metrics
    const resources = this.getResourceMetrics();

    // Calculate error metrics
    const errors = this.calculateErrorMetrics();

    return {
      throughput,
      latency,
      resources,
      queues: this.currentMetrics.queues, // Updated externally
      workers: this.currentMetrics.workers, // Updated externally
      errors
    };
  }

  /**
   * Calculate metrics from specific samples
   */
  private calculateMetricsFromSamples(
    latencySamples: LatencySample[],
    throughputSamples: ThroughputSample[]
  ): PerformanceMetrics {
    // This is a simplified version - in practice you'd aggregate the samples
    const metrics = this.createEmptyMetrics();

    if (latencySamples.length > 0) {
      const latencies = latencySamples.map(s => s.latency).sort((a, b) => a - b);

      metrics.latency = {
        avg: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
        p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
        p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
        p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
        max: Math.max(...latencies),
        min: Math.min(...latencies)
      };
    }

    return metrics;
  }

  /**
   * Calculate latency metrics from current buffer
   */
  private calculateLatencyMetrics(): PerformanceMetrics['latency'] {
    if (this.latencyBuffer.length === 0) {
      return {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0
      };
    }

    const latencies = this.latencyBuffer.map(sample => sample.latency).sort((a, b) => a - b);

    return {
      avg: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
      max: Math.max(...latencies),
      min: Math.min(...latencies)
    };
  }

  /**
   * Get current resource metrics
   */
  private getResourceMetrics(): PerformanceMetrics['resources'] {
    const memUsage = process.memoryUsage();

    return {
      memoryUsageMB: memUsage.rss / 1024 / 1024,
      cpuUsagePercent: 0, // Would need external library to measure CPU
      heapUsedMB: memUsage.heapUsed / 1024 / 1024,
      heapTotalMB: memUsage.heapTotal / 1024 / 1024,
      gcPausesMs: [] // Updated by GC observer
    };
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(): PerformanceMetrics['errors'] {
    const recentErrors = this.errorHistory.slice(-10); // Last 10 errors
    const errorsByType: Record<string, number> = {};

    // Count errors by type
    for (const error of this.errorHistory) {
      const type = this.classifyError(error.error);
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    }

    const errorRate = this.counters.totalOperations > 0
      ? this.counters.errors / this.counters.totalOperations
      : 0;

    return {
      totalErrors: this.counters.errors,
      errorRate,
      errorsByType,
      recentErrors
    };
  }

  /**
   * Update counters based on operation type
   */
  private updateCountersFromOperation(operation: string, context?: any): void {
    switch (operation) {
      case 'file_parse':
        this.counters.files++;
        if (context?.loc) {
          this.counters.loc += context.loc;
        }
        if (context?.bytes) {
          this.counters.bytes += context.bytes;
        }
        break;

      case 'entity_create':
        this.counters.entities += context?.count || 1;
        break;

      case 'relationship_create':
        this.counters.relationships += context?.count || 1;
        break;
    }
  }

  /**
   * Reset throughput counters
   */
  private resetCounters(): void {
    this.counters.files = 0;
    this.counters.entities = 0;
    this.counters.relationships = 0;
    this.counters.loc = 0;
    this.counters.bytes = 0;
    // Don't reset errors and totalOperations - they're cumulative
  }

  /**
   * Check thresholds and emit alerts
   */
  private checkThresholds(): void {
    const metrics = this.currentMetrics;

    // Check P95 latency
    if (metrics.latency.p95 > this.config.thresholds.latencyP95Ms) {
      this.emitAlert('warning', 'latency.p95',
        `P95 latency (${metrics.latency.p95.toFixed(2)}ms) exceeds threshold`,
        metrics.latency.p95, this.config.thresholds.latencyP95Ms);
    }

    // Check memory usage
    if (metrics.resources.memoryUsageMB > this.config.thresholds.memoryUsageMB) {
      this.emitAlert('warning', 'resources.memory',
        `Memory usage (${metrics.resources.memoryUsageMB.toFixed(1)}MB) exceeds threshold`,
        metrics.resources.memoryUsageMB, this.config.thresholds.memoryUsageMB);
    }

    // Check error rate
    if (metrics.errors.errorRate > this.config.thresholds.errorRate) {
      this.emitAlert('error', 'errors.rate',
        `Error rate (${(metrics.errors.errorRate * 100).toFixed(2)}%) exceeds threshold`,
        metrics.errors.errorRate, this.config.thresholds.errorRate);
    }

    // Check throughput
    if (metrics.throughput.locPerMinute < this.config.thresholds.throughputLOCPerMin) {
      this.emitAlert('info', 'throughput.loc',
        `LOC/minute (${metrics.throughput.locPerMinute.toFixed(0)}) below target`,
        metrics.throughput.locPerMinute, this.config.thresholds.throughputLOCPerMin);
    }
  }

  /**
   * Emit a performance alert
   */
  private emitAlert(
    severity: PerformanceAlert['severity'],
    metric: string,
    message: string,
    value: number,
    threshold: number,
    context?: any
  ): void {
    const alert: PerformanceAlert = {
      severity,
      metric,
      message,
      value,
      threshold,
      timestamp: new Date(),
      context
    };

    this.emit('alert', alert);
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;

    // Clean latency buffer
    this.latencyBuffer = this.latencyBuffer.filter(sample => sample.timestamp >= cutoff);

    // Clean throughput buffer
    this.throughputBuffer = this.throughputBuffer.filter(sample => sample.timestamp >= cutoff);
  }

  /**
   * Setup GC monitoring
   */
  private setupGCMonitoring(): void {
    try {
      // This requires the --expose-gc flag or a GC monitoring library
      if (typeof global.gc === 'function') {
        const originalGC = global.gc;
        global.gc = () => {
          const start = Date.now();
          originalGC();
          const duration = Date.now() - start;

          if (!this.currentMetrics.resources.gcPausesMs) {
            this.currentMetrics.resources.gcPausesMs = [];
          }
          this.currentMetrics.resources.gcPausesMs.push(duration);
        };
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Could not setup GC monitoring:', error);
    }
  }

  /**
   * Classify error for categorization
   */
  private classifyError(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) return 'memory';
    if (errorMessage.includes('parse') || errorMessage.includes('syntax')) return 'parsing';
    if (errorMessage.includes('network') || errorMessage.includes('connection')) return 'network';
    if (errorMessage.includes('file') || errorMessage.includes('ENOENT')) return 'filesystem';
    return 'unknown';
  }

  /**
   * Update queue metrics (called externally by queue manager)
   */
  updateQueueMetrics(metrics: PerformanceMetrics['queues']): void {
    this.currentMetrics.queues = metrics;
  }

  /**
   * Update worker metrics (called externally by worker pool)
   */
  updateWorkerMetrics(metrics: PerformanceMetrics['workers']): void {
    this.currentMetrics.workers = metrics;
  }
}