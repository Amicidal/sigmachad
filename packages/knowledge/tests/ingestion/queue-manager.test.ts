/**
 * Unit tests for QueueManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueueManager, QueueManagerConfig } from '../../src/ingestion/queue-manager.js';
import { TaskPayload, QueueOverflowError } from '../../src/ingestion/types.js';

describe('QueueManager', () => {
  let queueManager: QueueManager;
  let config: QueueManagerConfig;

  beforeEach(() => {
    config = {
      maxSize: 100,
      partitionCount: 4,
      batchSize: 10,
      batchTimeout: 1000,
      retryAttempts: 3,
      retryDelay: 100,
      enableBackpressure: true,
      backpressureThreshold: 80,
      partitionStrategy: 'round_robin',
      metricsInterval: 1000
    };
    queueManager = new QueueManager(config);
  });

  afterEach(async () => {
    await queueManager.stop();
  });

  describe('start/stop', () => {
    it('should start successfully', async () => {
      await queueManager.start();
      const metrics = queueManager.getMetrics();
      expect(metrics.queueDepth).toBe(0);
    });

    it('should stop successfully', async () => {
      await queueManager.start();
      await queueManager.stop();
      // Should not throw
    });

    it('should throw if already running', async () => {
      await queueManager.start();
      await expect(queueManager.start()).rejects.toThrow('already running');
    });
  });

  describe('task enqueuing', () => {
    beforeEach(async () => {
      await queueManager.start();
    });

    it('should enqueue a task successfully', async () => {
      const task: TaskPayload = {
        id: 'test-task-1',
        type: 'parse',
        priority: 5,
        data: { test: 'data' },
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await queueManager.enqueue(task);
      const metrics = queueManager.getMetrics();
      expect(metrics.queueDepth).toBe(1);
    });

    it('should distribute tasks across partitions with round robin', async () => {
      const tasks: TaskPayload[] = [];
      for (let i = 0; i < 8; i++) {
        tasks.push({
          id: `test-task-${i}`,
          type: 'parse',
          priority: 5,
          data: { index: i },
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      for (const task of tasks) {
        await queueManager.enqueue(task);
      }

      const partitionStatus = queueManager.getPartitionStatus();
      const partitionSizes = Object.values(partitionStatus).map(p => p.size);

      // Each partition should have 2 tasks (8 tasks / 4 partitions)
      expect(partitionSizes.every(size => size === 2)).toBe(true);
    });

    it('should handle priority ordering correctly', async () => {
      const lowPriorityTask: TaskPayload = {
        id: 'low-priority',
        type: 'parse',
        priority: 1,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      const highPriorityTask: TaskPayload = {
        id: 'high-priority',
        type: 'parse',
        priority: 10,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await queueManager.enqueue(lowPriorityTask);
      await queueManager.enqueue(highPriorityTask);

      const tasks = await queueManager.dequeueByPriority(2);
      expect(tasks[0].id).toBe('high-priority');
      expect(tasks[1].id).toBe('low-priority');
    });

    it('should respect backpressure threshold', async () => {
      config.backpressureThreshold = 5;
      const smallQueueManager = new QueueManager(config);
      await smallQueueManager.start();

      try {
        // Fill up to threshold
        for (let i = 0; i < 5; i++) {
          await smallQueueManager.enqueue({
            id: `task-${i}`,
            type: 'parse',
            priority: 5,
            data: {},
            metadata: {},
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date()
          });
        }

        // Next enqueue should trigger backpressure
        await expect(smallQueueManager.enqueue({
          id: 'overflow-task',
          type: 'parse',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        })).rejects.toThrow(QueueOverflowError);
      } finally {
        await smallQueueManager.stop();
      }
    });
  });

  describe('task dequeuing', () => {
    beforeEach(async () => {
      await queueManager.start();
    });

    it('should dequeue tasks from specific partition', async () => {
      const task: TaskPayload = {
        id: 'test-task',
        type: 'parse',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await queueManager.enqueue(task, 'specific-key');
      const tasks = await queueManager.dequeue('partition-0', 1);

      // We can't guarantee which partition it went to without knowing the hash,
      // so we check total tasks dequeued
      const allTasks = await queueManager.dequeueBatch();
      expect(allTasks.length).toBe(0); // First dequeue should have taken it
    });

    it('should handle batch dequeuing', async () => {
      const tasks: TaskPayload[] = [];
      for (let i = 0; i < 15; i++) {
        tasks.push({
          id: `batch-task-${i}`,
          type: 'parse',
          priority: 5,
          data: { index: i },
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      for (const task of tasks) {
        await queueManager.enqueue(task);
      }

      const batchTasks = await queueManager.dequeueBatch();
      expect(batchTasks.length).toBe(Math.min(15, config.batchSize));
    });

    it('should return empty array when no tasks available', async () => {
      const tasks = await queueManager.dequeue('partition-0', 5);
      expect(tasks).toEqual([]);
    });
  });

  describe('task requeuing', () => {
    beforeEach(async () => {
      await queueManager.start();
    });

    it('should requeue failed task with incremented retry count', async () => {
      const task: TaskPayload = {
        id: 'retry-task',
        type: 'parse',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await queueManager.requeueTask(task, new Error('Test error'));

      const metrics = queueManager.getMetrics();
      expect(metrics.queueDepth).toBe(1);

      // Dequeue and check retry count was incremented
      const dequeuedTasks = await queueManager.dequeueBatch();
      expect(dequeuedTasks.length).toBe(1);
      expect(dequeuedTasks[0].retryCount).toBe(1);
    });

    it('should not requeue task that exceeded max retries', async () => {
      const task: TaskPayload = {
        id: 'max-retry-task',
        type: 'parse',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 3,
        maxRetries: 3,
        createdAt: new Date()
      };

      await queueManager.requeueTask(task, new Error('Test error'));

      const metrics = queueManager.getMetrics();
      expect(metrics.queueDepth).toBe(0);
    });
  });

  describe('scheduled tasks', () => {
    beforeEach(async () => {
      await queueManager.start();
    });

    it('should handle scheduled tasks correctly', async () => {
      const futureTime = new Date(Date.now() + 1000);
      const task: TaskPayload = {
        id: 'scheduled-task',
        type: 'parse',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        scheduledAt: futureTime
      };

      await queueManager.enqueue(task);

      // Should not be available immediately
      let readyTasks = queueManager.processScheduledTasks();
      expect(readyTasks.length).toBe(0);

      // Mock time passage
      vi.useFakeTimers();
      vi.advanceTimersByTime(1500);

      readyTasks = queueManager.processScheduledTasks();
      expect(readyTasks.length).toBe(1);
      expect(readyTasks[0].id).toBe('scheduled-task');

      vi.useRealTimers();
    });
  });

  describe('metrics', () => {
    beforeEach(async () => {
      await queueManager.start();
    });

    it('should track queue metrics correctly', async () => {
      const initialMetrics = queueManager.getMetrics();
      expect(initialMetrics.queueDepth).toBe(0);

      // Add some tasks
      for (let i = 0; i < 5; i++) {
        await queueManager.enqueue({
          id: `metrics-task-${i}`,
          type: 'parse',
          priority: 5,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      const updatedMetrics = queueManager.getMetrics();
      expect(updatedMetrics.queueDepth).toBe(5);
      expect(updatedMetrics.oldestEventAge).toBeGreaterThan(0);
    });

    it('should provide partition status', async () => {
      await queueManager.enqueue({
        id: 'status-task',
        type: 'parse',
        priority: 5,
        data: {},
        metadata: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      });

      const status = queueManager.getPartitionStatus();
      expect(Object.keys(status)).toHaveLength(4); // 4 partitions

      const totalTasks = Object.values(status).reduce((sum, partition) => sum + partition.size, 0);
      expect(totalTasks).toBe(1);
    });
  });

  describe('partitioning strategies', () => {
    it('should use hash-based partitioning when configured', async () => {
      const hashConfig = { ...config, partitionStrategy: 'hash' as const };
      const hashQueueManager = new QueueManager(hashConfig);
      await hashQueueManager.start();

      try {
        // Tasks with same partition key should go to same partition
        const partitionKey = 'same-module';

        for (let i = 0; i < 4; i++) {
          await hashQueueManager.enqueue({
            id: `hash-task-${i}`,
            type: 'parse',
            priority: 5,
            data: {},
            metadata: {},
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date()
          }, partitionKey);
        }

        const status = hashQueueManager.getPartitionStatus();
        const nonEmptyPartitions = Object.values(status).filter(p => p.size > 0);

        // All tasks should be in the same partition
        expect(nonEmptyPartitions).toHaveLength(1);
        expect(nonEmptyPartitions[0].size).toBe(4);
      } finally {
        await hashQueueManager.stop();
      }
    });

    it('should use priority-based partitioning when configured', async () => {
      const priorityConfig = { ...config, partitionStrategy: 'priority' as const };
      const priorityQueueManager = new QueueManager(priorityConfig);
      await priorityQueueManager.start();

      try {
        // High priority task
        await priorityQueueManager.enqueue({
          id: 'high-priority-task',
          type: 'parse',
          priority: 10,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });

        // Low priority task
        await priorityQueueManager.enqueue({
          id: 'low-priority-task',
          type: 'parse',
          priority: 1,
          data: {},
          metadata: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });

        const status = priorityQueueManager.getPartitionStatus();

        // Tasks should be distributed based on priority
        const totalTasks = Object.values(status).reduce((sum, p) => sum + p.size, 0);
        expect(totalTasks).toBe(2);
      } finally {
        await priorityQueueManager.stop();
      }
    });
  });
});