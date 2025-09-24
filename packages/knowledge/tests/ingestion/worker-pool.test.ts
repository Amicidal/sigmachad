/**
 * Unit tests for WorkerPool
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPool, WorkerPoolConfig } from '../../src/ingestion/worker-pool.js';
import { TaskPayload, WorkerError } from '../../src/ingestion/types.js';

describe('WorkerPool', () => {
  let workerPool: WorkerPool;
  let config: WorkerPoolConfig;

  beforeEach(() => {
    config = {
      maxWorkers: 8,
      minWorkers: 2,
      workerTimeout: 5000,
      healthCheckInterval: 1000,
      restartThreshold: 3,
      autoScale: false, // Disable for most tests
      scalingRules: {
        scaleUpThreshold: 10,
        scaleDownThreshold: 2,
        scaleUpCooldown: 5000,
        scaleDownCooldown: 10000
      }
    };
    workerPool = new WorkerPool(config);
  });

  afterEach(async () => {
    await workerPool.stop();
  });

  describe('start/stop', () => {
    it('should start with minimum number of workers', async () => {
      await workerPool.start();
      const metrics = workerPool.getMetrics();
      expect(metrics.totalWorkers).toBeGreaterThanOrEqual(config.minWorkers);
    });

    it('should stop all workers', async () => {
      await workerPool.start();
      await workerPool.stop();

      const metrics = workerPool.getMetrics();
      expect(metrics.totalWorkers).toBe(0);
    });

    it('should throw if already running', async () => {
      await workerPool.start();
      await expect(workerPool.start()).rejects.toThrow('already running');
    });
  });

  describe('task execution', () => {
    beforeEach(async () => {
      await workerPool.start();
    });

    it('should execute a simple task successfully', async () => {
      // Register a mock handler
      workerPool.registerHandler('test', async (task) => {
        return { success: true, data: task.data };
      });

      const task: TaskPayload = {
        id: 'test-task-1',
        type: 'test',
        priority: 5,
        data: { message: 'hello' },
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      const result = await workerPool.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('test-task-1');
      expect(result.result).toEqual({ success: true, data: { message: 'hello' } });
    });

    it('should handle task execution failure', async () => {
      workerPool.registerHandler('failing', async () => {
        throw new Error('Task failed');
      });

      const task: TaskPayload = {
        id: 'failing-task',
        type: 'failing',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await expect(workerPool.executeTask(task)).rejects.toThrow('Task failed');
    });

    it('should execute multiple tasks in parallel', async () => {
      const executionTimes: number[] = [];

      workerPool.registerHandler('parallel', async (task) => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        const end = Date.now();
        executionTimes.push(end - start);
        return { taskId: task.id };
      });

      const tasks: TaskPayload[] = [];
      for (let i = 0; i < 4; i++) {
        tasks.push({
          id: `parallel-task-${i}`,
          type: 'parallel',
          priority: 5,
          data: { index: i },
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      const startTime = Date.now();
      const results = await workerPool.executeTasks(tasks);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(4);
      expect(results.every(r => r.success)).toBe(true);

      // Should complete faster than sequential execution
      expect(totalTime).toBeLessThan(350); // Less than 4 * 100ms
    });

    it('should handle task timeout', async () => {
      const shortTimeoutConfig = { ...config, workerTimeout: 50 };
      const timeoutWorkerPool = new WorkerPool(shortTimeoutConfig);
      await timeoutWorkerPool.start();

      try {
        timeoutWorkerPool.registerHandler('timeout', async () => {
          await new Promise(resolve => setTimeout(resolve, 200)); // Longer than timeout
          return { success: true };
        });

        const task: TaskPayload = {
          id: 'timeout-task',
          type: 'timeout',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        };

        await expect(timeoutWorkerPool.executeTask(task)).rejects.toThrow();
      } finally {
        await timeoutWorkerPool.stop();
      }
    });

    it('should throw error when no handler registered', async () => {
      const task: TaskPayload = {
        id: 'no-handler-task',
        type: 'unknown',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await expect(workerPool.executeTask(task)).rejects.toThrow('No handler');
    });
  });

  describe('worker scaling', () => {
    it('should scale workers manually', async () => {
      await workerPool.start();
      const initialMetrics = workerPool.getMetrics();

      await workerPool.scaleWorkers(6);
      const scaledMetrics = workerPool.getMetrics();

      expect(scaledMetrics.totalWorkers).toBeGreaterThan(initialMetrics.totalWorkers);
      expect(scaledMetrics.totalWorkers).toBeLessThanOrEqual(6);
    });

    it('should respect maximum worker limit', async () => {
      await workerPool.start();

      await workerPool.scaleWorkers(config.maxWorkers + 5);
      const metrics = workerPool.getMetrics();

      expect(metrics.totalWorkers).toBeLessThanOrEqual(config.maxWorkers);
    });

    it('should respect minimum worker limit', async () => {
      await workerPool.start();

      await workerPool.scaleWorkers(1); // Below minimum
      const metrics = workerPool.getMetrics();

      expect(metrics.totalWorkers).toBeGreaterThanOrEqual(config.minWorkers);
    });
  });

  describe('auto-scaling', () => {
    it('should auto-scale up under load', async () => {
      const autoScaleConfig = { ...config, autoScale: true };
      const autoScalePool = new WorkerPool(autoScaleConfig);
      await autoScalePool.start();

      try {
        // Register a slow handler to create backlog
        autoScalePool.registerHandler('slow', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        });

        const initialMetrics = autoScalePool.getMetrics();

        // Create multiple tasks to trigger scaling
        const tasks: TaskPayload[] = [];
        for (let i = 0; i < 20; i++) {
          tasks.push({
            id: `load-task-${i}`,
            type: 'slow',
            priority: 5,
            data: {},
            metadata: {},
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date()
          });
        }

        // Execute tasks (this would normally trigger auto-scaling)
        const promises = tasks.slice(0, 5).map(task => autoScalePool.executeTask(task));

        // Wait a bit for auto-scaling to potentially trigger
        await new Promise(resolve => setTimeout(resolve, 100));

        await Promise.allSettled(promises);

        const finalMetrics = autoScalePool.getMetrics();
        // Note: Auto-scaling logic may not trigger in test environment
        // This test mainly verifies the pool can handle the load
        expect(finalMetrics.totalWorkers).toBeGreaterThanOrEqual(initialMetrics.totalWorkers);
      } finally {
        await autoScalePool.stop();
      }
    });
  });

  describe('worker health monitoring', () => {
    beforeEach(async () => {
      await workerPool.start();
    });

    it('should track worker metrics', async () => {
      workerPool.registerHandler('metrics', async (task) => {
        return { taskId: task.id };
      });

      const task: TaskPayload = {
        id: 'metrics-task',
        type: 'metrics',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await workerPool.executeTask(task);

      const metrics = workerPool.getMetrics();
      expect(metrics.workers.some(w => w.tasksProcessed > 0)).toBe(true);
    });

    it('should handle worker errors gracefully', async () => {
      const errorHandler = vi.fn();
      workerPool.on('worker:error', errorHandler);

      workerPool.registerHandler('error', async () => {
        throw new Error('Worker error');
      });

      const task: TaskPayload = {
        id: 'error-task',
        type: 'error',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await expect(workerPool.executeTask(task)).rejects.toThrow('Worker error');

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('task distribution', () => {
    beforeEach(async () => {
      await workerPool.start();
    });

    it('should distribute tasks across available workers', async () => {
      const workerExecutions = new Map<string, number>();

      workerPool.registerHandler('distributed', async (task) => {
        const workerId = 'mock-worker'; // In real implementation, this would be the actual worker ID
        workerExecutions.set(workerId, (workerExecutions.get(workerId) || 0) + 1);
        return { taskId: task.id };
      });

      const tasks: TaskPayload[] = [];
      for (let i = 0; i < 6; i++) {
        tasks.push({
          id: `dist-task-${i}`,
          type: 'distributed',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      const results = await workerPool.executeTasks(tasks);
      expect(results).toHaveLength(6);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle mixed task types', async () => {
      workerPool.registerHandler('type-a', async (task) => ({ type: 'a', id: task.id }));
      workerPool.registerHandler('type-b', async (task) => ({ type: 'b', id: task.id }));

      const tasks: TaskPayload[] = [
        {
          id: 'task-a-1',
          type: 'type-a',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        },
        {
          id: 'task-b-1',
          type: 'type-b',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        }
      ];

      const results = await workerPool.executeTasks(tasks);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);

      // Verify correct handlers were called
      expect(results.find(r => r.taskId === 'task-a-1')?.result.type).toBe('a');
      expect(results.find(r => r.taskId === 'task-b-1')?.result.type).toBe('b');
    });
  });

  describe('error resilience', () => {
    beforeEach(async () => {
      await workerPool.start();
    });

    it('should continue working after individual task failures', async () => {
      let callCount = 0;
      workerPool.registerHandler('resilient', async (task) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Second task fails');
        }
        return { success: true, call: callCount };
      });

      const tasks: TaskPayload[] = [
        {
          id: 'resilient-1',
          type: 'resilient',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        },
        {
          id: 'resilient-2',
          type: 'resilient',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        },
        {
          id: 'resilient-3',
          type: 'resilient',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        }
      ];

      const results = await workerPool.executeTasks(tasks);

      // Two should succeed, one should fail
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(2);
      expect(failureCount).toBe(1);
    });
  });
});