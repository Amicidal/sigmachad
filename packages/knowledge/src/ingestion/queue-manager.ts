/**
 * Queue Manager for High-Throughput Ingestion Pipeline
 * Manages work distribution across partitioned queues with backpressure
 * Based on HighThroughputKnowledgeGraph.md event bus architecture
 */

import { EventEmitter } from 'events';
import {
  TaskPayload,
  QueueConfig,
  QueueMetrics,
  ChangeEvent,
  IngestionError,
  QueueOverflowError,
  IngestionEvents
} from './types.js';

export interface QueueManagerConfig extends QueueConfig {
  enableBackpressure: boolean;
  backpressureThreshold: number;
  partitionStrategy: 'round_robin' | 'hash' | 'priority';
  metricsInterval: number;
}

export class QueueManager extends EventEmitter<IngestionEvents> {
  private queues: Map<string, TaskPayload[]> = new Map();
  private partitionMap: Map<string, string> = new Map();
  private metrics: QueueMetrics;
  private config: QueueManagerConfig;
  private running = false;
  private metricsTimer?: NodeJS.Timeout;
  private nextPartitionIndex = 0;

  // Performance tracking
  private processedTasks = 0;
  private failedTasks = 0;
  private lastProcessedCount = 0;
  private lastFailedCount = 0;

  constructor(config: QueueManagerConfig) {
    super();
    this.config = config;
    this.metrics = {
      queueDepth: 0,
      oldestEventAge: 0,
      partitionLag: {},
      throughputPerSecond: 0,
      errorRate: 0
    };

    // Initialize partitions
    for (let i = 0; i < config.partitionCount; i++) {
      const partitionId = `partition-${i}`;
      this.queues.set(partitionId, []);
      this.metrics.partitionLag[partitionId] = 0;
    }

    this.setupMetricsCollection();
  }

  /**
   * Start the queue manager
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError('Queue manager already running', 'ALREADY_RUNNING');
    }

    this.running = true;
    this.startMetricsCollection();
    console.log(`[QueueManager] Started with ${this.config.partitionCount} partitions`);
  }

  /**
   * Stop the queue manager
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.stopMetricsCollection();

    // Clear all queues
    this.queues.clear();
    this.partitionMap.clear();

    console.log('[QueueManager] Stopped');
  }

  /**
   * Enqueue a task for processing
   */
  async enqueue(task: TaskPayload, partitionKey?: string): Promise<void> {
    if (!this.running) {
      throw new IngestionError('Queue manager not running', 'NOT_RUNNING');
    }

    // Check backpressure
    if (this.config.enableBackpressure && this.isBackpressured()) {
      throw new QueueOverflowError(
        'Queue backpressure threshold exceeded',
        'global',
        this.metrics.queueDepth,
        this.config.backpressureThreshold
      );
    }

    // Determine partition
    const partitionId = this.getPartition(task, partitionKey);
    const queue = this.queues.get(partitionId);

    if (!queue) {
      throw new IngestionError(`Partition ${partitionId} not found`, 'PARTITION_NOT_FOUND');
    }

    // Check partition size limit
    if (queue.length >= this.config.maxSize) {
      throw new QueueOverflowError(
        `Partition ${partitionId} at capacity`,
        partitionId,
        queue.length,
        this.config.maxSize
      );
    }

    // Add task to queue (maintain priority order)
    this.insertTask(queue, task);
    this.updateMetrics();

    this.emit('event:received', task as any);
  }

  /**
   * Dequeue tasks from a specific partition
   */
  async dequeue(partitionId: string, maxTasks: number = 1): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    const queue = this.queues.get(partitionId);
    if (!queue || queue.length === 0) {
      return [];
    }

    // Take up to maxTasks from the front of the queue
    const tasks = queue.splice(0, Math.min(maxTasks, queue.length));
    this.updateMetrics();

    return tasks;
  }

  /**
   * Dequeue tasks in batch mode for better throughput
   */
  async dequeueBatch(partitionId?: string): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    if (partitionId) {
      return this.dequeue(partitionId, this.config.batchSize);
    }

    // Round-robin across all partitions
    const allTasks: TaskPayload[] = [];
    const partitionIds = Array.from(this.queues.keys());

    for (const pId of partitionIds) {
      const tasks = await this.dequeue(pId, this.config.batchSize);
      allTasks.push(...tasks);

      if (allTasks.length >= this.config.batchSize) {
        break;
      }
    }

    return allTasks.slice(0, this.config.batchSize);
  }

  /**
   * Get tasks from the highest priority queue first
   */
  async dequeueByPriority(maxTasks: number = this.config.batchSize): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    const allTasks: TaskPayload[] = [];

    // Collect all tasks from all partitions
    for (const queue of this.queues.values()) {
      allTasks.push(...queue);
    }

    if (allTasks.length === 0) {
      return [];
    }

    // Sort by priority (higher priority first)
    allTasks.sort((a, b) => b.priority - a.priority);

    // Take the top tasks
    const selectedTasks = allTasks.slice(0, maxTasks);

    // Remove selected tasks from their respective queues
    for (const task of selectedTasks) {
      const partitionId = this.getPartition(task);
      const queue = this.queues.get(partitionId);
      if (queue) {
        const index = queue.findIndex(t => t.id === task.id);
        if (index >= 0) {
          queue.splice(index, 1);
        }
      }
    }

    this.updateMetrics();
    return selectedTasks;
  }

  /**
   * Requeue a failed task with retry logic
   */
  async requeueTask(task: TaskPayload, error?: Error): Promise<void> {
    if (task.retryCount >= task.maxRetries) {
      console.error(`[QueueManager] Task ${task.id} exceeded max retries (${task.maxRetries})`);
      return;
    }

    // Increment retry count and add delay
    const retryTask: TaskPayload = {
      ...task,
      retryCount: task.retryCount + 1,
      scheduledAt: new Date(Date.now() + this.calculateRetryDelay(task.retryCount)),
      metadata: {
        ...task.metadata,
        lastError: error?.message,
        lastRetryAt: new Date()
      }
    };

    await this.enqueue(retryTask);
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  /**
   * Get partition status
   */
  getPartitionStatus(): Record<string, { size: number; oldestTask?: Date }> {
    const status: Record<string, { size: number; oldestTask?: Date }> = {};

    for (const [partitionId, queue] of this.queues) {
      const oldestTask = queue.length > 0 ? queue[0].createdAt : undefined;
      status[partitionId] = {
        size: queue.length,
        oldestTask
      };
    }

    return status;
  }

  /**
   * Check if the queue is experiencing backpressure
   */
  private isBackpressured(): boolean {
    return this.metrics.queueDepth >= this.config.backpressureThreshold;
  }

  /**
   * Determine which partition a task should go to
   */
  private getPartition(task: TaskPayload, partitionKey?: string): string {
    // Use explicit partition key if provided
    if (partitionKey) {
      const cached = this.partitionMap.get(partitionKey);
      if (cached) {
        return cached;
      }

      // Hash the partition key to a partition
      const hash = this.hashString(partitionKey);
      const partitionIndex = hash % this.config.partitionCount;
      const partitionId = `partition-${partitionIndex}`;
      this.partitionMap.set(partitionKey, partitionId);
      return partitionId;
    }

    // Apply partitioning strategy
    switch (this.config.partitionStrategy) {
      case 'hash':
        const hash = this.hashString(task.id);
        const partitionIndex = hash % this.config.partitionCount;
        return `partition-${partitionIndex}`;

      case 'priority':
        // High priority tasks go to earlier partitions
        const priorityIndex = Math.min(
          Math.floor((10 - task.priority) / 2),
          this.config.partitionCount - 1
        );
        return `partition-${priorityIndex}`;

      case 'round_robin':
      default:
        const rrIndex = this.nextPartitionIndex % this.config.partitionCount;
        this.nextPartitionIndex++;
        return `partition-${rrIndex}`;
    }
  }

  /**
   * Insert task maintaining priority order
   */
  private insertTask(queue: TaskPayload[], task: TaskPayload): void {
    // For now, simple FIFO - but maintain priority order
    const insertIndex = queue.findIndex(t => t.priority < task.priority);
    if (insertIndex === -1) {
      queue.push(task);
    } else {
      queue.splice(insertIndex, 0, task);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelay;
    const maxDelay = 60000; // 1 minute max
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update queue metrics
   */
  private updateMetrics(): void {
    let totalSize = 0;
    let oldestTimestamp = Date.now();

    for (const [partitionId, queue] of this.queues) {
      totalSize += queue.length;
      this.metrics.partitionLag[partitionId] = queue.length;

      if (queue.length > 0) {
        const oldest = queue[0].createdAt.getTime();
        oldestTimestamp = Math.min(oldestTimestamp, oldest);
      }
    }

    this.metrics.queueDepth = totalSize;
    this.metrics.oldestEventAge = totalSize > 0 ? Date.now() - oldestTimestamp : 0;
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    const lastProcessedCount = 0;
    const lastErrorCount = 0;
    let lastUpdateTime = Date.now();

    this.metricsTimer = setInterval(() => {
      const now = Date.now();
      const timeDelta = (now - lastUpdateTime) / 1000; // seconds

      // Calculate throughput based on processed tasks
      this.metrics.throughputPerSecond = this.calculateThroughput(timeDelta);

      // Calculate error rate based on failed tasks
      this.metrics.errorRate = this.calculateErrorRate();

      lastUpdateTime = now;
      this.emit('metrics:updated', this.metrics);
    }, this.config.metricsInterval);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Metrics collection is set up in constructor
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }
  }

  /**
   * Get tasks scheduled for future execution
   */
  getScheduledTasks(): TaskPayload[] {
    const now = new Date();
    const scheduled: TaskPayload[] = [];

    for (const queue of this.queues.values()) {
      for (const task of queue) {
        if (task.scheduledAt && task.scheduledAt > now) {
          scheduled.push(task);
        }
      }
    }

    return scheduled.sort((a, b) =>
      (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0)
    );
  }

  /**
   * Process any scheduled tasks that are ready
   */
  processScheduledTasks(): TaskPayload[] {
    const now = new Date();
    const readyTasks: TaskPayload[] = [];

    for (const [partitionId, queue] of this.queues) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const task = queue[i];
        if (task.scheduledAt && task.scheduledAt <= now) {
          // Remove scheduled time and move to front
          task.scheduledAt = undefined;
          queue.splice(i, 1);
          this.insertTask(queue, task);
          readyTasks.push(task);
        }
      }
    }

    if (readyTasks.length > 0) {
      this.updateMetrics();
    }

    return readyTasks;
  }

  // ========== Performance Tracking Methods ==========

  /**
   * Record task completion
   */
  recordTaskCompletion(success: boolean): void {
    if (success) {
      this.processedTasks++;
    } else {
      this.failedTasks++;
    }
  }

  /**
   * Calculate throughput (tasks per second)
   */
  private calculateThroughput(timeDelta: number): number {
    if (timeDelta <= 0) return 0;

    const newProcessed = this.processedTasks - this.lastProcessedCount;
    this.lastProcessedCount = this.processedTasks;

    return newProcessed / timeDelta;
  }

  /**
   * Calculate error rate (0.0 to 1.0)
   */
  private calculateErrorRate(): number {
    const totalTasks = this.processedTasks + this.failedTasks;
    if (totalTasks === 0) return 0;

    return this.failedTasks / totalTasks;
  }
}