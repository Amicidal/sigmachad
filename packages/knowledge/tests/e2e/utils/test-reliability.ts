/**
 * Test Reliability Utilities
 * Provides retry mechanisms, error handling, and test stability features
 */

import { setTimeout as sleep } from 'timers/promises';

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  exponentialBackoff: boolean;
  timeout?: number;
  shouldRetry?: (error: Error) => boolean;
}

export interface TestTimeoutOptions {
  operation: string;
  timeout: number;
  cleanupFn?: () => Promise<void>;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringInterval: number;
}

export class TestReliabilityManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private testMetrics: Map<string, TestMetrics> = new Map();

  /**
   * Execute an operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      delay: 1000,
      exponentialBackoff: true,
      shouldRetry: (error) => !this.isNonRetryableError(error),
      ...options,
    };

    let lastError: Error;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        if (config.timeout) {
          return await this.withTimeout(operation, {
            operation: `Retry attempt ${attempt + 1}`,
            timeout: config.timeout,
          });
        }
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt >= config.maxAttempts) {
          break;
        }

        if (config.shouldRetry && !config.shouldRetry(lastError)) {
          throw lastError;
        }

        const delay = config.exponentialBackoff
          ? config.delay * Math.pow(2, attempt - 1)
          : config.delay;

        console.log(
          `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );

        await sleep(delay);
      }
    }

    throw new Error(
      `Operation failed after ${config.maxAttempts} attempts. Last error: ${lastError.message}`
    );
  }

  /**
   * Execute an operation with timeout
   */
  async withTimeout<T>(
    operation: () => Promise<T>,
    options: TestTimeoutOptions
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    let completed = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(async () => {
        if (!completed && options.cleanupFn) {
          try {
            await options.cleanupFn();
          } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError);
          }
        }
        reject(
          new Error(
            `Operation "${options.operation}" timed out after ${options.timeout}ms`
          )
        );
      }, options.timeout);
    });

    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      completed = true;
      clearTimeout(timeoutHandle);
      return result;
    } catch (error) {
      completed = true;
      clearTimeout(timeoutHandle);
      throw error;
    }
  }

  /**
   * Execute operation with circuit breaker pattern
   */
  async withCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker(options));
    }

    const circuitBreaker = this.circuitBreakers.get(key)!;
    return circuitBreaker.execute(operation);
  }

  /**
   * Wait for a condition to be true with timeout
   */
  async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    options: {
      timeout?: number;
      interval?: number;
      description?: string;
    } = {}
  ): Promise<void> {
    const config = {
      timeout: 30000,
      interval: 1000,
      description: 'condition',
      ...options,
    };

    const startTime = Date.now();

    while (Date.now() - startTime < config.timeout) {
      try {
        const result = await condition();
        if (result) {
          return;
        }
      } catch (error) {
        console.log(`Condition check failed: ${error.message}`);
      }

      await sleep(config.interval);
    }

    throw new Error(
      `Timeout waiting for ${config.description} after ${config.timeout}ms`
    );
  }

  /**
   * Record test metrics
   */
  recordTestMetric(testName: string, metric: Partial<TestMetric>): void {
    if (!this.testMetrics.has(testName)) {
      this.testMetrics.set(testName, new TestMetrics());
    }

    const metrics = this.testMetrics.get(testName)!;
    metrics.addMetric(metric);
  }

  /**
   * Get aggregated test metrics
   */
  getTestMetrics(testName?: string): Record<string, any> {
    if (testName) {
      return this.testMetrics.get(testName)?.getSummary() || {};
    }

    const allMetrics: Record<string, any> = {};
    for (const [name, metrics] of this.testMetrics) {
      allMetrics[name] = metrics.getSummary();
    }
    return allMetrics;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      /authentication/i,
      /authorization/i,
      /permission/i,
      /invalid.*argument/i,
      /bad.*request/i,
      /not.*found/i,
      /validation.*error/i,
    ];

    return nonRetryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.cleanup();
    }
    this.circuitBreakers.clear();
    this.testMetrics.clear();
  }
}

/**
 * Circuit Breaker implementation for handling cascading failures
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringInterval: 5000,
      ...options,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  cleanup(): void {
    // Circuit breaker cleanup if needed
  }
}

/**
 * Test metrics collection
 */
interface TestMetric {
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
  memoryUsage?: number;
  cpuUsage?: number;
  customMetrics?: Record<string, any>;
}

class TestMetrics {
  private metrics: TestMetric[] = [];

  addMetric(metric: Partial<TestMetric>): void {
    this.metrics.push({
      timestamp: Date.now(),
      success: true,
      ...metric,
    });
  }

  getSummary(): Record<string, any> {
    if (this.metrics.length === 0) {
      return {};
    }

    const successCount = this.metrics.filter(m => m.success).length;
    const failureCount = this.metrics.length - successCount;
    const durations = this.metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    return {
      totalTests: this.metrics.length,
      successCount,
      failureCount,
      successRate: successCount / this.metrics.length,
      averageDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      errors: this.metrics
        .filter(m => !m.success && m.error)
        .map(m => m.error),
    };
  }
}

/**
 * Test isolation utilities
 */
export class TestIsolationManager {
  private testStates: Map<string, any> = new Map();
  private cleanupFunctions: (() => Promise<void>)[] = [];

  /**
   * Save test state for cleanup
   */
  saveState(key: string, state: any): void {
    this.testStates.set(key, state);
  }

  /**
   * Restore test state
   */
  getState(key: string): any {
    return this.testStates.get(key);
  }

  /**
   * Register cleanup function
   */
  registerCleanup(cleanupFn: () => Promise<void>): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * Execute all cleanup functions
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];

    // Execute cleanup functions in reverse order
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      try {
        await cleanupFn();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    this.cleanupFunctions = [];
    this.testStates.clear();

    if (errors.length > 0) {
      throw new Error(
        `Cleanup failed with ${errors.length} errors: ${errors
          .map(e => e.message)
          .join(', ')}`
      );
    }
  }
}

/**
 * Resource monitoring utilities
 */
export class ResourceMonitor {
  private monitoring = false;
  private interval?: NodeJS.Timeout;
  private metrics: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  }> = [];

  start(intervalMs = 1000): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.metrics = [];

    this.interval = setInterval(() => {
      this.metrics.push({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      });
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.monitoring = false;
  }

  getMetrics(): {
    memoryTrend: any;
    cpuTrend: any;
    peakMemory: number;
    memoryGrowth: number;
  } {
    if (this.metrics.length === 0) {
      return {
        memoryTrend: {},
        cpuTrend: {},
        peakMemory: 0,
        memoryGrowth: 0,
      };
    }

    const memoryValues = this.metrics.map(m => m.memory.heapUsed);
    const peakMemory = Math.max(...memoryValues);
    const initialMemory = memoryValues[0];
    const memoryGrowth = (peakMemory - initialMemory) / initialMemory;

    return {
      memoryTrend: {
        initial: initialMemory,
        peak: peakMemory,
        final: memoryValues[memoryValues.length - 1],
        average: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
      },
      cpuTrend: {
        samples: this.metrics.length,
        totalUser: this.metrics.reduce((sum, m) => sum + m.cpuUsage.user, 0),
        totalSystem: this.metrics.reduce((sum, m) => sum + m.cpuUsage.system, 0),
      },
      peakMemory,
      memoryGrowth,
    };
  }

  cleanup(): void {
    this.stop();
    this.metrics = [];
  }
}

// Default instance for easy usage
export const testReliability = new TestReliabilityManager();
export const testIsolation = new TestIsolationManager();
export const resourceMonitor = new ResourceMonitor();

/**
 * Test setup and teardown helpers
 */
export async function setupReliableTest(
  testName: string,
  setupFn?: () => Promise<void>
): Promise<void> {
  console.log(`Setting up reliable test: ${testName}`);

  // Start resource monitoring
  resourceMonitor.start();

  // Record test start
  testReliability.recordTestMetric(testName, {
    timestamp: Date.now(),
    success: true,
  });

  if (setupFn) {
    await testReliability.withRetry(setupFn, {
      maxAttempts: 3,
      delay: 1000,
    });
  }
}

export async function teardownReliableTest(
  testName: string,
  teardownFn?: () => Promise<void>
): Promise<void> {
  try {
    if (teardownFn) {
      await teardownFn();
    }

    // Stop monitoring and record metrics
    resourceMonitor.stop();
    const resourceMetrics = resourceMonitor.getMetrics();

    testReliability.recordTestMetric(testName, {
      success: true,
      customMetrics: { resourceMetrics },
    });

    // Cleanup test isolation
    await testIsolation.cleanup();
  } catch (error) {
    testReliability.recordTestMetric(testName, {
      success: false,
      error: (error as Error).message,
    });
    throw error;
  } finally {
    resourceMonitor.cleanup();
  }

  console.log(`Teardown completed for test: ${testName}`);
}

/**
 * Deterministic test helpers
 */
export function createDeterministicRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function createStableTimestamp(): number {
  // Return a stable timestamp for deterministic tests
  return Math.floor(Date.now() / 1000) * 1000;
}

export async function ensureStableEnvironment(): Promise<void> {
  // Wait for system to stabilize
  await sleep(100);

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Additional stability measures can be added here
}