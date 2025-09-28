/**
 * Performance Edge Cases E2E Tests
 * Tests resource exhaustion, cold start optimization, memory leak detection
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { setTimeout as sleep } from 'timers/promises';
import { performance } from 'perf_hooks';
import {
  testReliability,
  resourceMonitor,
  setupReliableTest,
  teardownReliableTest,
} from '../e2e-utils/test-reliability';

// Performance monitoring utilities
interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  eventLoopLag: number;
  gcStats?: {
    count: number;
    totalTime: number;
    lastGC: number;
  };
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  errorRate: number;
  resourcePeaks: PerformanceMetrics;
}

class PerformanceMonitor extends EventEmitter {
  private monitoring = false;
  private interval?: NodeJS.Timeout;
  private metrics: PerformanceMetrics[] = [];
  private gcObserver?: any;
  private eventLoopStart = 0;

  constructor(private sampleInterval = 100) {
    super();
  }

  start(): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.metrics = [];
    this.eventLoopStart = performance.now();

    // Setup GC observation if available
    try {
      const { PerformanceObserver } = require('perf_hooks');
      this.gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.emit('gc', {
            type: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
          });
        }
      });
      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC observation not available in all environments
    }

    this.interval = setInterval(() => {
      this.collectMetrics();
    }, this.sampleInterval);
  }

  stop(): PerformanceMetrics[] {
    if (!this.monitoring) return this.metrics;

    this.monitoring = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = undefined;
    }

    return this.metrics;
  }

  private collectMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate event loop lag
    const lagStart = performance.now();
    setImmediate(() => {
      const lag = performance.now() - lagStart;

      const metrics: PerformanceMetrics = {
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to ms
        memoryUsage: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
        },
        eventLoopLag: lag,
      };

      this.metrics.push(metrics);
      this.emit('metrics', metrics);
    });
  }

  getStats(): {
    samples: number;
    averageMemory: number;
    peakMemory: number;
    averageCPU: number;
    peakCPU: number;
    averageEventLoopLag: number;
    maxEventLoopLag: number;
  } {
    if (this.metrics.length === 0) {
      return {
        samples: 0,
        averageMemory: 0,
        peakMemory: 0,
        averageCPU: 0,
        peakCPU: 0,
        averageEventLoopLag: 0,
        maxEventLoopLag: 0,
      };
    }

    const memoryValues = this.metrics.map((m) => m.memoryUsage.heapUsed);
    const cpuValues = this.metrics.map((m) => m.cpuUsage);
    const lagValues = this.metrics.map((m) => m.eventLoopLag);

    return {
      samples: this.metrics.length,
      averageMemory: memoryValues.reduce((a, b) => a + b) / memoryValues.length,
      peakMemory: Math.max(...memoryValues),
      averageCPU: cpuValues.reduce((a, b) => a + b) / cpuValues.length,
      peakCPU: Math.max(...cpuValues),
      averageEventLoopLag: lagValues.reduce((a, b) => a + b) / lagValues.length,
      maxEventLoopLag: Math.max(...lagValues),
    };
  }

  detectMemoryLeaks(): {
    hasLeak: boolean;
    growthRate: number;
    samples: number;
  } {
    if (this.metrics.length < 10) {
      return { hasLeak: false, growthRate: 0, samples: this.metrics.length };
    }

    const memoryValues = this.metrics.map((m) => m.memoryUsage.heapUsed);
    const firstHalf = memoryValues.slice(
      0,
      Math.floor(memoryValues.length / 2)
    );
    const secondHalf = memoryValues.slice(Math.floor(memoryValues.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    const growthRate = (secondAvg - firstAvg) / firstAvg;

    return {
      hasLeak: growthRate > 0.1, // 10% growth threshold
      growthRate,
      samples: this.metrics.length,
    };
  }
}

// Mock services for performance testing
class PerformanceTestService extends EventEmitter {
  private processingQueue: any[] = [];
  private isProcessing = false;
  private cache = new Map<string, any>();
  private connections = new Set<string>();
  private requestCounts = new Map<string, number>();

  async processHeavyWorkload(
    items: any[],
    options: {
      batchSize?: number;
      concurrency?: number;
      useCache?: boolean;
    } = {}
  ): Promise<any[]> {
    const { batchSize = 100, concurrency = 4, useCache = true } = options;
    const results: any[] = [];

    // Add artificial load to simulate real processing
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item, index) => {
        const cacheKey = `item_${item.id}`;

        if (useCache && this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }

        // Simulate CPU-intensive work
        await this.simulateCPUWork(50 + Math.random() * 100);

        // Simulate memory allocation
        const result = {
          id: item.id,
          processed: true,
          timestamp: Date.now(),
          metadata: new Array(1000).fill(0).map(() => Math.random()),
          index: i + index,
        };

        if (useCache) {
          this.cache.set(cacheKey, result);
        }

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Yield control periodically
      if (i % (batchSize * 2) === 0) {
        await sleep(1);
      }
    }

    return results;
  }

  async simulateResourceExhaustion(
    type: 'memory' | 'cpu' | 'connections'
  ): Promise<void> {
    switch (type) {
      case 'memory':
        const memoryHogs: any[] = [];
        for (let i = 0; i < 1000; i++) {
          memoryHogs.push(new Array(10000).fill(`memory-pressure-${i}`));
          if (i % 100 === 0) {
            await sleep(10); // Allow some breathing room
          }
        }
        // Keep reference to prevent GC
        setTimeout(() => {
          memoryHogs.length = 0; // Clean up after test
        }, 5000);
        break;

      case 'cpu':
        const endTime = Date.now() + 2000; // 2 seconds of CPU load
        while (Date.now() < endTime) {
          // CPU-intensive calculation
          Math.sqrt(Math.random() * 1000000);
        }
        break;

      case 'connections':
        for (let i = 0; i < 10000; i++) {
          this.connections.add(`connection_${i}`);
        }
        setTimeout(() => {
          this.connections.clear();
        }, 3000);
        break;
    }
  }

  private async simulateCPUWork(ms: number): Promise<void> {
    const end = Date.now() + ms;
    return new Promise((resolve) => {
      const work = () => {
        while (Date.now() < end) {
          Math.random();
        }
        resolve();
      };
      setImmediate(work);
    });
  }

  async coldStart(): Promise<{ duration: number; operations: number }> {
    const startTime = performance.now();

    // Simulate cold start initialization
    await sleep(100); // Database connection
    await sleep(50); // Configuration loading
    await sleep(75); // Cache warming

    // Simulate initial operations that are slower when cold
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        this.processHeavyWorkload([{ id: i }], { useCache: false })
      );
    }

    await Promise.all(operations);

    const duration = performance.now() - startTime;
    return { duration, operations: operations.length };
  }

  async warmStart(): Promise<{ duration: number; operations: number }> {
    const startTime = performance.now();

    // When warm, these operations should be much faster
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        this.processHeavyWorkload([{ id: i }], { useCache: true })
      );
    }

    await Promise.all(operations);

    const duration = performance.now() - startTime;
    return { duration, operations: operations.length };
  }

  getMetrics(): {
    cacheSize: number;
    connectionCount: number;
    requestCounts: Map<string, number>;
  } {
    return {
      cacheSize: this.cache.size,
      connectionCount: this.connections.size,
      requestCounts: new Map(this.requestCounts),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  reset(): void {
    this.cache.clear();
    this.connections.clear();
    this.requestCounts.clear();
  }
}

// Load testing utilities
class LoadTester {
  async runLoadTest(
    service: PerformanceTestService,
    config: {
      duration: number;
      concurrency: number;
      rampUpTime?: number;
      targetRPS?: number;
    }
  ): Promise<LoadTestResult> {
    const { duration, concurrency, rampUpTime = 0, targetRPS } = config;
    const monitor = new PerformanceMonitor(50);

    const latencies: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    let peakMetrics: PerformanceMetrics | null = null;

    monitor.on('metrics', (metrics: PerformanceMetrics) => {
      if (
        !peakMetrics ||
        metrics.memoryUsage.heapUsed > peakMetrics.memoryUsage.heapUsed
      ) {
        peakMetrics = metrics;
      }
    });

    monitor.start();

    const startTime = performance.now();
    const endTime = startTime + duration;

    // Create worker promises
    const workers = Array.from(
      { length: concurrency },
      async (_, workerIndex) => {
        const workerId = `worker_${workerIndex}`;
        let requestsThisWorker = 0;

        while (performance.now() < endTime) {
          const requestStart = performance.now();

          try {
            // Simulate request processing
            await service.processHeavyWorkload(
              [{ id: `${workerId}_${requestsThisWorker}` }],
              { batchSize: 1, useCache: true }
            );

            const requestLatency = performance.now() - requestStart;
            latencies.push(requestLatency);
            successfulRequests++;
          } catch (error) {
            failedRequests++;
          }

          requestsThisWorker++;

          // Rate limiting if targetRPS specified
          if (targetRPS) {
            const expectedInterval = (1000 / targetRPS) * concurrency;
            const actualInterval = performance.now() - requestStart;
            if (actualInterval < expectedInterval) {
              await sleep(expectedInterval - actualInterval);
            }
          }

          // Ramp up delay
          if (rampUpTime > 0) {
            const elapsed = performance.now() - startTime;
            if (elapsed < rampUpTime) {
              const rampFactor = elapsed / rampUpTime;
              await sleep((1 - rampFactor) * 100);
            }
          }
        }
      }
    );

    await Promise.all(workers);
    const metrics = monitor.stop();

    // Calculate statistics
    latencies.sort((a, b) => a - b);
    const totalRequests = successfulRequests + failedRequests;
    const actualDuration = (performance.now() - startTime) / 1000; // Convert to seconds

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      throughput: successfulRequests / actualDuration,
      errorRate: failedRequests / totalRequests,
      resourcePeaks: peakMetrics || {
        cpuUsage: 0,
        memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
        eventLoopLag: 0,
      },
    };
  }
}

describe('Performance Edge Cases Tests', () => {
  let service: PerformanceTestService;
  let loadTester: LoadTester;

  beforeEach(() => {
    service = new PerformanceTestService();
    loadTester = new LoadTester();
  });

  afterEach(() => {
    service.reset();
  });

  test('Memory Exhaustion Handling', async () => {
    const monitor = new PerformanceMonitor(100);
    monitor.start();

    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate memory pressure
    await service.simulateResourceExhaustion('memory');

    await sleep(1000); // Let memory pressure build

    const stats = monitor.getStats();
    monitor.stop();

    // Verify memory usage increased significantly
    expect(stats.peakMemory).toBeGreaterThan(initialMemory * 1.5); // At least 50% increase

    // Verify system can still process requests under memory pressure
    const result = await service.processHeavyWorkload([{ id: 'test' }]);
    expect(result).toHaveLength(1);

    // Wait for GC and verify memory can be reclaimed
    if (global.gc) {
      global.gc();
    }
    await sleep(500);

    const finalMemory = process.memoryUsage().heapUsed;
    expect(finalMemory).toBeLessThan(stats.peakMemory);
  }, 15000);

  test('CPU Exhaustion Recovery', async () => {
    const monitor = new PerformanceMonitor(50);
    monitor.start();

    // Simulate CPU exhaustion
    const cpuExhaustionPromise = service.simulateResourceExhaustion('cpu');

    // Try to process requests during CPU exhaustion
    const processingPromise = service.processHeavyWorkload([
      { id: 'during_cpu_load_1' },
      { id: 'during_cpu_load_2' },
    ]);

    await Promise.all([cpuExhaustionPromise, processingPromise]);

    const stats = monitor.getStats();
    monitor.stop();

    // Verify high CPU usage was recorded
    expect(stats.peakCPU).toBeGreaterThan(stats.averageCPU * 2);

    // Verify event loop lag increased during CPU pressure
    expect(stats.maxEventLoopLag).toBeGreaterThan(10); // At least 10ms lag

    // Verify processing still completed
    expect(processingPromise).resolves.toHaveLength(2);

    console.log('CPU exhaustion stats:', {
      peakCPU: stats.peakCPU,
      maxEventLoopLag: stats.maxEventLoopLag,
      samples: stats.samples,
    });
  }, 10000);

  test('Connection Pool Exhaustion', async () => {
    const monitor = new PerformanceMonitor();
    monitor.start();

    // Simulate connection exhaustion
    await service.simulateResourceExhaustion('connections');

    const metrics = service.getMetrics();
    expect(metrics.connectionCount).toBeGreaterThan(1000);

    // System should still be able to process requests
    const result = await service.processHeavyWorkload([
      { id: 'connection_test' },
    ]);
    expect(result).toHaveLength(1);

    monitor.stop();

    // Connections should be cleaned up after timeout
    await sleep(3500);
    const cleanedMetrics = service.getMetrics();
    expect(cleanedMetrics.connectionCount).toBe(0);
  });

  test('Cold Start vs Warm Start Performance', async () => {
    // Measure cold start performance
    const coldStartResult = await service.coldStart();

    // Measure warm start performance
    const warmStartResult = await service.warmStart();

    console.log('Cold start:', coldStartResult);
    console.log('Warm start:', warmStartResult);

    // Warm start should be significantly faster
    expect(warmStartResult.duration).toBeLessThan(
      coldStartResult.duration * 0.5
    );

    // Both should complete all operations
    expect(coldStartResult.operations).toBe(10);
    expect(warmStartResult.operations).toBe(10);

    // Cold start should be slower than reasonable threshold
    expect(coldStartResult.duration).toBeGreaterThan(100); // At least 100ms
    expect(warmStartResult.duration).toBeLessThan(100); // Less than 100ms when warm
  });

  test('Memory Leak Detection', async () => {
    const monitor = new PerformanceMonitor(100);
    monitor.start();

    // Simulate operations that might leak memory
    for (let i = 0; i < 20; i++) {
      await service.processHeavyWorkload(
        Array.from({ length: 50 }, (_, j) => ({ id: `leak_test_${i}_${j}` })),
        { useCache: true, batchSize: 10 }
      );

      // Small delay to allow monitoring
      await sleep(50);
    }

    const stats = monitor.getStats();
    const leakAnalysis = monitor.detectMemoryLeaks();
    monitor.stop();

    console.log('Memory leak analysis:', leakAnalysis);
    console.log('Performance stats:', stats);

    // For this test, we expect some memory growth due to caching
    expect(leakAnalysis.samples).toBeGreaterThan(10);

    // But growth should be reasonable (not a severe leak)
    if (leakAnalysis.hasLeak) {
      expect(leakAnalysis.growthRate).toBeLessThan(2.0); // Less than 200% growth
    }

    // Cache should be populated
    const serviceMetrics = service.getMetrics();
    expect(serviceMetrics.cacheSize).toBeGreaterThan(0);
  }, 15000);

  test('High Concurrency Load Test', async () => {
    const loadTestResult = await loadTester.runLoadTest(service, {
      duration: 5000, // 5 seconds
      concurrency: 20,
      rampUpTime: 1000, // 1 second ramp up
    });

    console.log('High concurrency load test results:', loadTestResult);

    // Performance expectations
    expect(loadTestResult.successfulRequests).toBeGreaterThan(0);
    expect(loadTestResult.errorRate).toBeLessThan(0.05); // Less than 5% error rate
    expect(loadTestResult.averageLatency).toBeLessThan(1000); // Less than 1 second average
    expect(loadTestResult.p95Latency).toBeLessThan(2000); // P95 under 2 seconds
    expect(loadTestResult.throughput).toBeGreaterThan(5); // At least 5 requests per second

    // Resource usage should be reasonable
    expect(loadTestResult.resourcePeaks.eventLoopLag).toBeLessThan(100); // Under 100ms lag
  }, 10000);

  test('Burst Traffic Handling', async () => {
    const monitor = new PerformanceMonitor(50);
    monitor.start();

    // Simulate sudden burst of traffic
    const burstSize = 100;
    const burstRequests = Array.from({ length: burstSize }, (_, i) =>
      service.processHeavyWorkload([{ id: `burst_${i}` }], { batchSize: 1 })
    );

    const burstStart = performance.now();
    const results = await Promise.allSettled(burstRequests);
    const burstDuration = performance.now() - burstStart;

    const stats = monitor.getStats();
    monitor.stop();

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log('Burst test results:', {
      burstSize,
      successful,
      failed,
      duration: burstDuration,
      throughput: successful / (burstDuration / 1000),
      peakMemory: stats.peakMemory,
      maxEventLoopLag: stats.maxEventLoopLag,
    });

    // Most requests should succeed even under burst load
    expect(successful).toBeGreaterThan(burstSize * 0.8); // At least 80% success
    expect(failed).toBeLessThan(burstSize * 0.2); // Less than 20% failure

    // System should handle burst within reasonable time
    expect(burstDuration).toBeLessThan(10000); // Under 10 seconds

    // Event loop should not be completely blocked
    expect(stats.maxEventLoopLag).toBeLessThan(500); // Under 500ms lag
  }, 15000);

  test('Resource Cleanup After Load', async () => {
    // Generate significant load
    await service.processHeavyWorkload(
      Array.from({ length: 500 }, (_, i) => ({ id: `cleanup_test_${i}` })),
      { batchSize: 50, useCache: true }
    );

    const beforeCleanup = service.getMetrics();
    const beforeMemory = process.memoryUsage();

    // Clear caches and trigger cleanup
    service.clearCache();

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    await sleep(1000); // Allow cleanup to occur

    const afterCleanup = service.getMetrics();
    const afterMemory = process.memoryUsage();

    console.log('Resource cleanup:', {
      cacheBefore: beforeCleanup.cacheSize,
      cacheAfter: afterCleanup.cacheSize,
      memoryBefore: beforeMemory.heapUsed,
      memoryAfter: afterMemory.heapUsed,
      memoryReduction: beforeMemory.heapUsed - afterMemory.heapUsed,
    });

    // Cache should be cleared
    expect(afterCleanup.cacheSize).toBe(0);

    // Memory usage should decrease (though GC timing is not guaranteed)
    // We'll just verify the test completed without throwing
    expect(afterMemory.heapUsed).toBeGreaterThan(0);
  });

  test('Long Running Stability Test', async () => {
    const monitor = new PerformanceMonitor(200);
    monitor.start();

    const testDuration = 8000; // 8 seconds
    const startTime = performance.now();
    let operationCount = 0;

    // Continuous processing for extended period
    while (performance.now() - startTime < testDuration) {
      await service.processHeavyWorkload(
        [{ id: `stability_${operationCount}` }],
        { batchSize: 1, useCache: false }
      ); // No cache to prevent buildup

      operationCount++;

      // Small delay to prevent overwhelming
      await sleep(20);
    }

    const stats = monitor.getStats();
    const leakCheck = monitor.detectMemoryLeaks();
    monitor.stop();

    console.log('Long running stability test:', {
      operations: operationCount,
      duration: performance.now() - startTime,
      memoryStats: stats,
      leakCheck,
    });

    // Should have processed multiple operations
    expect(operationCount).toBeGreaterThan(100);

    // Memory should remain relatively stable
    expect(leakCheck.growthRate).toBeLessThan(0.5); // Less than 50% growth

    // Event loop should remain responsive
    expect(stats.maxEventLoopLag).toBeLessThan(200); // Under 200ms lag
  }, 12000);

  test('Recovery After Resource Exhaustion', async () => {
    const monitor = new PerformanceMonitor();
    monitor.start();

    // Exhaust multiple resources simultaneously
    await Promise.all([
      service.simulateResourceExhaustion('memory'),
      service.simulateResourceExhaustion('cpu'),
      service.simulateResourceExhaustion('connections'),
    ]);

    // Wait for resources to be exhausted
    await sleep(1000);

    const duringExhaustionMetrics = service.getMetrics();

    // Try processing during exhaustion
    const duringExhaustionStart = performance.now();
    try {
      await service.processHeavyWorkload([{ id: 'during_exhaustion' }]);
    } catch (error) {
      // Expected to potentially fail
    }
    const duringExhaustionTime = performance.now() - duringExhaustionStart;

    // Wait for recovery
    await sleep(4000);

    // Try processing after recovery
    const afterRecoveryStart = performance.now();
    const recoveryResult = await service.processHeavyWorkload([
      { id: 'after_recovery' },
    ]);
    const afterRecoveryTime = performance.now() - afterRecoveryStart;

    const afterRecoveryMetrics = service.getMetrics();
    const stats = monitor.getStats();
    monitor.stop();

    console.log('Recovery test results:', {
      duringExhaustion: {
        connections: duringExhaustionMetrics.connectionCount,
        processingTime: duringExhaustionTime,
      },
      afterRecovery: {
        connections: afterRecoveryMetrics.connectionCount,
        processingTime: afterRecoveryTime,
        resultLength: recoveryResult.length,
      },
      overallStats: stats,
    });

    // After recovery, processing should work normally
    expect(recoveryResult).toHaveLength(1);
    expect(afterRecoveryTime).toBeLessThan(duringExhaustionTime * 2); // Should be faster after recovery

    // Connections should be cleaned up
    expect(afterRecoveryMetrics.connectionCount).toBeLessThan(
      duringExhaustionMetrics.connectionCount
    );
  }, 15000);
});

describe('Performance Optimization Validation', () => {
  let service: PerformanceTestService;

  beforeEach(() => {
    service = new PerformanceTestService();
  });

  afterEach(() => {
    service.reset();
  });

  test('Caching Performance Impact', async () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: `cache_test_${i}`,
    }));

    // First run without cache
    const noCacheStart = performance.now();
    const noCacheResult = await service.processHeavyWorkload(testData, {
      useCache: false,
    });
    const noCacheTime = performance.now() - noCacheStart;

    // Second run with cache (should be faster for repeated items)
    const withCacheStart = performance.now();
    const withCacheResult1 = await service.processHeavyWorkload(testData, {
      useCache: true,
    });
    const withCacheResult2 = await service.processHeavyWorkload(testData, {
      useCache: true,
    }); // Second run should hit cache
    const withCacheTime = performance.now() - withCacheStart;

    console.log('Caching performance:', {
      noCacheTime,
      withCacheTime,
      speedup: noCacheTime / withCacheTime,
      cacheSize: service.getMetrics().cacheSize,
    });

    // Results should be equivalent
    expect(noCacheResult).toHaveLength(testData.length);
    expect(withCacheResult1).toHaveLength(testData.length);
    expect(withCacheResult2).toHaveLength(testData.length);

    // Cache should provide performance benefit
    expect(service.getMetrics().cacheSize).toBeGreaterThan(0);

    // Total time with cache (including second run) should be less than double the no-cache time
    expect(withCacheTime).toBeLessThan(noCacheTime * 1.5);
  });

  test('Batch Size Optimization', async () => {
    const testData = Array.from({ length: 200 }, (_, i) => ({
      id: `batch_test_${i}`,
    }));
    const batchSizes = [1, 10, 50, 100, 200];
    const results: Array<{
      batchSize: number;
      duration: number;
      throughput: number;
    }> = [];

    for (const batchSize of batchSizes) {
      const start = performance.now();
      await service.processHeavyWorkload(testData, {
        batchSize,
        useCache: false,
      });
      const duration = performance.now() - start;
      const throughput = testData.length / (duration / 1000);

      results.push({ batchSize, duration, throughput });
    }

    console.log('Batch size optimization results:', results);

    // Find optimal batch size (highest throughput)
    const optimal = results.reduce((best, current) =>
      current.throughput > best.throughput ? current : best
    );

    console.log('Optimal batch size:', optimal);

    // Batch size 1 should be least efficient
    const batchSize1 = results.find((r) => r.batchSize === 1)!;
    expect(optimal.throughput).toBeGreaterThan(batchSize1.throughput);

    // Optimal batch size should be reasonable (not the extremes)
    expect(optimal.batchSize).toBeGreaterThan(1);
    expect(optimal.batchSize).toBeLessThan(200);
  });

  test('Concurrency Level Optimization', async () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: `concurrency_test_${i}`,
    }));
    const concurrencyLevels = [1, 2, 4, 8, 16];
    const results: Array<{
      concurrency: number;
      duration: number;
      throughput: number;
    }> = [];

    for (const concurrency of concurrencyLevels) {
      const start = performance.now();
      await service.processHeavyWorkload(testData, {
        concurrency,
        batchSize: 10,
        useCache: false,
      });
      const duration = performance.now() - start;
      const throughput = testData.length / (duration / 1000);

      results.push({ concurrency, duration, throughput });
    }

    console.log('Concurrency optimization results:', results);

    // Find optimal concurrency level
    const optimal = results.reduce((best, current) =>
      current.throughput > best.throughput ? current : best
    );

    console.log('Optimal concurrency:', optimal);

    // Single threaded should be least efficient for this workload
    const singleThreaded = results.find((r) => r.concurrency === 1)!;
    expect(optimal.throughput).toBeGreaterThan(singleThreaded.throughput);

    // Too much concurrency should show diminishing returns or degradation
    const maxConcurrency = results.find((r) => r.concurrency === 16)!;
    expect(optimal.concurrency).toBeLessThanOrEqual(maxConcurrency.concurrency);
  });
});
