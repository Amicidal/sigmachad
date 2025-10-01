/**
 * Worker Pool for High-Throughput Ingestion Pipeline
 * Manages parallel processing workers with health monitoring
 * Based on HighThroughputKnowledgeGraph.md distributed worker architecture
 */

import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorkerTaskMessage, isWorkerTaskResult } from '@memento/utils';
import {
  TaskPayload,
  WorkerConfig,
  WorkerMetrics,
  WorkerResult,
  WorkerError,
  IngestionError,
  IngestionEvents,
} from './types';
import type { TypedEventEmitter } from '@memento/shared-types';

export interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  workerTimeout: number;
  healthCheckInterval: number;
  restartThreshold: number;
  autoScale: boolean;
  apiBaseUrl?: string;
  apiKey?: string;
  scalingRules: {
    scaleUpThreshold: number; // Queue depth to scale up
    scaleDownThreshold: number; // Queue depth to scale down
    scaleUpCooldown: number; // ms between scale up operations
    scaleDownCooldown: number; // ms between scale down operations
  };
}

export interface WorkerInstance {
  id: string;
  config: WorkerConfig;
  worker?: Worker;
  status: 'starting' | 'idle' | 'busy' | 'error' | 'stopping' | 'stopped';
  currentTask?: TaskPayload;
  metrics: WorkerMetrics;
  lastHealthCheck: Date;
  errorCount: number;
  startedAt: Date;
  stoppedAt?: Date;
}

export type WorkerHandler = (task: TaskPayload) => Promise<any>;

export class WorkerPool extends EventEmitter implements TypedEventEmitter<IngestionEvents> {
  /**
   * Update worker status consistently across both status fields
   */
  private setWorkerStatus(
    worker: WorkerInstance,
    status: WorkerInstance['status']
  ): void {
    worker.status = status;
    const statusMap: Record<WorkerInstance['status'], WorkerMetrics['status']> =
      {
        starting: 'idle',
        idle: 'idle',
        busy: 'busy',
        error: 'error',
        stopping: 'shutdown',
        stopped: 'shutdown',
      };
    worker.metrics.status = statusMap[status];
  }
  private workers: Map<string, WorkerInstance> = new Map();
  private handlers: Map<string, WorkerHandler> = new Map();
  private config: WorkerPoolConfig;
  private running = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private autoScaleTimer?: NodeJS.Timeout;
  private lastScaleUp = 0;
  private lastScaleDown = 0;

  constructor(config: WorkerPoolConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the worker pool
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError(
        'Worker pool already running',
        'ALREADY_RUNNING'
      );
    }

    this.running = true;

    // Start minimum number of workers
    await this.scaleWorkers(this.config.minWorkers);

    // Start health monitoring
    this.startHealthMonitoring();

    // Start auto-scaling if enabled
    if (this.config.autoScale) {
      this.startAutoScaling();
    }

    console.log(`[WorkerPool] Started with ${this.workers.size} workers`);
  }

  /**
   * Stop the worker pool
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Stop monitoring
    this.stopHealthMonitoring();
    this.stopAutoScaling();

    // Stop all workers
    await this.stopAllWorkers();

    console.log('[WorkerPool] Stopped');
  }

  /**
   * Register a task handler for a specific worker type
   */
  registerHandler(
    workerType: TaskPayload['type'],
    handler: WorkerHandler
  ): void {
    this.handlers.set(workerType, handler);
  }

  /**
   * Execute a task using available workers
   */
  async executeTask(task: TaskPayload): Promise<WorkerResult> {
    if (!this.running) {
      throw new IngestionError('Worker pool not running', 'NOT_RUNNING');
    }

    // Find an available worker for this task type
    const worker = await this.getAvailableWorker(task.type);
    if (!worker) {
      throw new WorkerError('No available workers', 'pool', task.id, true);
    }

    try {
      const result = await this.executeTaskOnWorker(worker, task);
      this.updateWorkerMetrics(worker, result);
      return result;
    } catch (error) {
      this.handleWorkerError(worker, error as Error, task);
      throw error;
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasks(tasks: TaskPayload[]): Promise<WorkerResult[]> {
    if (!this.running) {
      throw new IngestionError('Worker pool not running', 'NOT_RUNNING');
    }

    // Group tasks by type for better worker allocation
    const tasksByType = this.groupTasksByType(tasks);
    const promises: Promise<WorkerResult>[] = [];

    for (const [_workerType, typeTasks] of tasksByType) {
      for (const task of typeTasks) {
        promises.push(this.executeTask(task));
      }
    }

    return Promise.allSettled(promises).then((results) =>
      results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Return error result
          return {
            taskId: tasks[index].id,
            workerId: 'unknown',
            success: false,
            error: result.reason,
            duration: 0,
            metadata: {},
          };
        }
      })
    );
  }

  /**
   * Get worker pool metrics
   */
  getMetrics(): {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    errorWorkers: number;
    workers: WorkerMetrics[];
  } {
    const workers = Array.from(this.workers.values());
    const metrics = workers.map((w) => w.metrics);

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status === 'busy').length,
      idleWorkers: workers.filter((w) => w.status === 'idle').length,
      errorWorkers: workers.filter((w) => w.status === 'error').length,
      workers: metrics,
    };
  }

  /**
   * Scale workers to target count
   */
  async scaleWorkers(targetCount: number): Promise<void> {
    const currentCount = this.workers.size;

    if (targetCount > currentCount) {
      // Scale up
      const toAdd = Math.min(
        targetCount - currentCount,
        this.config.maxWorkers - currentCount
      );
      await this.addWorkers(toAdd);
    } else if (targetCount < currentCount) {
      // Scale down
      const toRemove = Math.min(
        currentCount - targetCount,
        currentCount - this.config.minWorkers
      );
      await this.removeWorkers(toRemove);
    }
  }

  /**
   * Get an available worker for a specific task type
   */
  private async getAvailableWorker(
    taskType: TaskPayload['type']
  ): Promise<WorkerInstance | null> {
    // First try to find an idle worker of the right type
    for (const worker of this.workers.values()) {
      if (worker.status === 'idle' && worker.config.type === taskType) {
        return worker;
      }
    }

    // If no specific type available, try any idle worker if handler exists
    if (this.handlers.has(taskType)) {
      for (const worker of this.workers.values()) {
        if (worker.status === 'idle') {
          return worker;
        }
      }
    }

    // Try to scale up if possible
    if (this.config.autoScale && this.workers.size < this.config.maxWorkers) {
      await this.addWorkers(1);
      // Recursively try again
      return this.getAvailableWorker(taskType);
    }

    return null;
  }

  /**
   * Execute a task on a specific worker
   */
  private async executeTaskOnWorker(
    worker: WorkerInstance,
    task: TaskPayload
  ): Promise<WorkerResult> {
    const startTime = Date.now();
    this.setWorkerStatus(worker, 'busy');
    worker.currentTask = task;

    try {
      let result: any;

      // Use worker thread if available, otherwise use in-process handler
      if (worker.worker) {
        result = await this.executeTaskInWorkerThread(worker.worker, task);
      } else {
        const handler = this.handlers.get(task.type);
        if (!handler) {
          throw new IngestionError(
            `No handler for task type: ${task.type}`,
            'NO_HANDLER'
          );
        }
        result = await handler(task);
      }

      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        workerId: worker.id,
        success: true,
        result,
        duration,
        metadata: {
          workerType: worker.config.type,
          taskType: task.type,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new WorkerError(
        `Task execution failed: ${(error as Error).message}`,
        worker.id,
        task.id
      );
    } finally {
      this.setWorkerStatus(worker, 'idle');
      worker.currentTask = undefined;
    }
  }

  

  /**
   * Add new workers to the pool
   */
  private async addWorkers(count: number): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      promises.push(this.createWorker());
    }

    await Promise.all(promises);
  }

  /**
   * Remove workers from the pool
   */
  private async removeWorkers(count: number): Promise<void> {
    const idleWorkers = Array.from(this.workers.values())
      .filter((w) => w.status === 'idle')
      .slice(0, count);

    const promises = idleWorkers.map((worker) => this.stopWorker(worker.id));
    await Promise.all(promises);
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(): Promise<void> {
    const workerId = `worker-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const config: WorkerConfig = {
      id: workerId,
      type: 'parser', // Initial type; tasks may drive behavior
      concurrency: 1,
      batchSize: 1,
      timeout: this.config.workerTimeout,
      healthCheck: true,
    };

    const worker: WorkerInstance = {
      id: workerId,
      config,
      status: 'starting', // Will be updated via setWorkerStatus after creation
      metrics: {
        workerId,
        status: 'idle', // Will be updated via setWorkerStatus
        tasksProcessed: 0,
        averageLatency: 0,
        errorCount: 0,
        lastActivity: new Date(),
      },
      lastHealthCheck: new Date(),
      errorCount: 0,
      startedAt: new Date(),
    };

    // Create actual worker thread for true parallelism
    try {
      const workerScript = this.getWorkerScriptPath();
      const workerThread = new Worker(workerScript, {
        workerData: {
          workerId,
          apiBaseUrl:
            this.config.apiBaseUrl || process.env.INGESTION_API_BASE_URL,
          apiKey: this.config.apiKey || process.env.INGESTION_API_KEY,
        },
      });

      // Set up worker message handling
      workerThread.on('message', (message) => {
        this.handleWorkerMessage(workerId, message);
      });

      workerThread.on('error', (error) => {
        this.handleWorkerError(worker, error);
      });

      workerThread.on('exit', (code) => {
        if (code !== 0) {
          console.error(
            `[WorkerPool] Worker ${workerId} exited with code ${code}`
          );
          this.handleWorkerError(
            worker,
            new Error(`Worker exited with code ${code}`)
          );
        }
      });

      worker.worker = workerThread;
      this.setWorkerStatus(worker, 'idle');

      console.log(`[WorkerPool] Created worker thread ${workerId}`);
    } catch (error) {
      console.error(
        `[WorkerPool] Failed to create worker thread ${workerId}:`,
        error
      );

      // Fallback to in-process mode
      console.log(
        `[WorkerPool] Falling back to in-process mode for worker ${workerId}`
      );
      this.setWorkerStatus(worker, 'idle');
    }

    this.workers.set(workerId, worker);
    this.emit('worker:started', workerId);

    console.log(`[WorkerPool] Created worker ${workerId}`);
  }

  /**
   * Get the path to the worker script
   */
  private getWorkerScriptPath(): string {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Path to the worker script
    return path.join(__dirname, '..', 'ingestion-workers', 'task-worker.js'); // .js because it will be compiled
  }

  /**
   * Handle messages from worker threads
   */
  private handleWorkerMessage(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.warn(
        `[WorkerPool] Received message from unknown worker ${workerId}`
      );
      return;
    }

    switch (message.type) {
      case 'pong':
        // Worker is alive and ready
        worker.lastHealthCheck = new Date();
        break;

      case 'task_result':
        this.handleTaskResult(workerId, message);
        break;

      case 'error':
        console.error(
          `[WorkerPool] Worker ${workerId} reported error:`,
          message.error
        );
        this.handleWorkerError(worker, new Error(message.error));
        break;

      case 'shutdown_complete':
        console.log(`[WorkerPool] Worker ${workerId} shutdown complete`);
        this.setWorkerStatus(worker, 'stopped');
        break;

      default:
        console.warn(
          `[WorkerPool] Unknown message type from worker ${workerId}:`,
          message.type
        );
    }
  }

  /**
   * Handle task result from worker thread
   */
  private handleTaskResult(workerId: string, message: any): void {
    // This would be called when a task completes
    // For now, just log the result
    console.log(
      `[WorkerPool] Task ${message.taskId} completed by worker ${workerId}: ${
        message.success ? 'success' : 'failed'
      }`
    );

    const worker = this.workers.get(workerId);
    if (worker) {
      this.setWorkerStatus(worker, 'idle');
      worker.metrics.tasksProcessed++;
      worker.metrics.lastActivity = new Date();

      if (message.duration) {
        // Update average latency
        const currentAvg = worker.metrics.averageLatency;
        const taskCount = worker.metrics.tasksProcessed;
        worker.metrics.averageLatency =
          (currentAvg * (taskCount - 1) + message.duration) / taskCount;
      }

      if (!message.success) {
        worker.metrics.errorCount++;
        worker.errorCount++;
      }
    }
  }

  /**
   * Execute a task in a worker thread
   */
  private async executeTaskInWorkerThread(
    worker: Worker,
    task: TaskPayload
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Task ${task.id} timed out after ${this.config.workerTimeout}ms`
          )
        );
      }, this.config.workerTimeout);

      // Set up one-time message listener for this task
      const messageHandler = (message: any) => {
        if (message.type === 'task_result' && message.taskId === task.id) {
          clearTimeout(timeout);
          worker.off('message', messageHandler);

          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error || 'Task failed'));
          }
        }
      };

      worker.on('message', messageHandler);

      // Send task to worker
      worker.postMessage(
        createWorkerTaskMessage(task.id, task, task.metadata || {})
      );
    });
  }

  /**
   * Stop a specific worker
   */
  private async stopWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    this.setWorkerStatus(worker, 'stopping');

    if (worker.worker) {
      try {
        // Send graceful shutdown message
        worker.worker.postMessage({ type: 'shutdown' });

        // Wait a bit for graceful shutdown
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Terminate the worker
        await worker.worker.terminate();
      } catch (error) {
        console.warn(`[WorkerPool] Error stopping worker ${workerId}:`, error);
        // Force terminate if graceful shutdown fails
        await worker.worker.terminate();
      }
    }

    this.setWorkerStatus(worker, 'stopped');
    worker.stoppedAt = new Date();

    this.workers.delete(workerId);
    this.emit('worker:stopped', workerId);

    console.log(`[WorkerPool] Stopped worker ${workerId}`);
  }

  /**
   * Stop all workers
   */
  private async stopAllWorkers(): Promise<void> {
    const promises = Array.from(this.workers.keys()).map((id) =>
      this.stopWorker(id)
    );
    await Promise.all(promises);
  }

  /**
   * Update worker metrics after task completion
   */
  private updateWorkerMetrics(
    worker: WorkerInstance,
    result: WorkerResult
  ): void {
    const metrics = worker.metrics;

    metrics.tasksProcessed++;
    metrics.lastActivity = new Date();

    // Update average latency
    const totalLatency =
      metrics.averageLatency * (metrics.tasksProcessed - 1) + result.duration;
    metrics.averageLatency = totalLatency / metrics.tasksProcessed;

    if (!result.success) {
      metrics.errorCount++;
      worker.errorCount++;
    }

    // Status already synchronized via setWorkerStatus calls
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(
    worker: WorkerInstance,
    error: Error,
    task?: TaskPayload
  ): void {
    this.setWorkerStatus(worker, 'error');
    worker.errorCount++;
    worker.metrics.errorCount++;

    const workerError = new WorkerError(
      `Worker ${worker.id} error: ${error.message}`,
      worker.id,
      task?.id
    );

    this.emit('worker:error', workerError);

    // Restart worker if error threshold exceeded
    if (worker.errorCount >= this.config.restartThreshold) {
      console.warn(
        `[WorkerPool] Restarting worker ${worker.id} due to excessive errors`
      );
      this.restartWorker(worker.id);
    }
  }

  /**
   * Restart a failed worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    await this.stopWorker(workerId);
    await this.createWorker();
  }

  /**
   * Group tasks by type for better allocation
   */
  private groupTasksByType(tasks: TaskPayload[]): Map<string, TaskPayload[]> {
    const groups = new Map<string, TaskPayload[]>();

    for (const task of tasks) {
      const existing = groups.get(task.type) || [];
      existing.push(task);
      groups.set(task.type, existing);
    }

    return groups;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Perform health checks on all workers
   */
  private performHealthChecks(): void {
    const now = new Date();

    for (const worker of this.workers.values()) {
      worker.lastHealthCheck = now;

      // Check for stuck workers
      if (worker.status === 'busy' && worker.currentTask) {
        const taskAge = now.getTime() - worker.currentTask.createdAt.getTime();
        if (taskAge > this.config.workerTimeout * 2) {
          console.warn(
            `[WorkerPool] Worker ${worker.id} appears stuck, restarting`
          );
          this.restartWorker(worker.id);
        }
      }
    }
  }

  /**
   * Start auto-scaling
   */
  private startAutoScaling(): void {
    this.autoScaleTimer = setInterval(() => {
      this.performAutoScaling();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop auto-scaling
   */
  private stopAutoScaling(): void {
    if (this.autoScaleTimer) {
      clearInterval(this.autoScaleTimer);
      this.autoScaleTimer = undefined;
    }
  }

  /**
   * Perform auto-scaling based on metrics
   */
  private performAutoScaling(): void {
    const now = Date.now();
    const metrics = this.getMetrics();
    const queueDepth = this.estimateQueueDepth(); // Estimate based on worker utilization

    // Scale up conditions
    if (
      queueDepth > this.config.scalingRules.scaleUpThreshold &&
      metrics.totalWorkers < this.config.maxWorkers &&
      now - this.lastScaleUp > this.config.scalingRules.scaleUpCooldown
    ) {
      const scaleUpBy = Math.min(
        2,
        this.config.maxWorkers - metrics.totalWorkers
      );
      console.log(
        `[WorkerPool] Auto-scaling up by ${scaleUpBy} workers (queue depth: ${queueDepth})`
      );
      this.addWorkers(scaleUpBy);
      this.lastScaleUp = now;
    }

    // Scale down conditions
    if (
      queueDepth < this.config.scalingRules.scaleDownThreshold &&
      metrics.totalWorkers > this.config.minWorkers &&
      metrics.idleWorkers > 2 &&
      now - this.lastScaleDown > this.config.scalingRules.scaleDownCooldown
    ) {
      const scaleDownBy = Math.min(
        metrics.idleWorkers - 1,
        metrics.totalWorkers - this.config.minWorkers
      );
      console.log(
        `[WorkerPool] Auto-scaling down by ${scaleDownBy} workers (queue depth: ${queueDepth})`
      );
      this.removeWorkers(scaleDownBy);
      this.lastScaleDown = now;
    }
  }

  // ========== Helper Methods ==========

  /**
   * Estimate queue depth based on worker utilization
   * This is a heuristic until we have actual queue manager integration
   */
  private estimateQueueDepth(): number {
    const metrics = this.getMetrics();

    // If all workers are busy, assume significant queue depth
    if (metrics.totalWorkers > 0 && metrics.idleWorkers === 0) {
      return this.config.scalingRules.scaleUpThreshold + 10;
    }

    // If most workers are busy, assume moderate queue depth
    const utilizationRatio =
      (metrics.totalWorkers - metrics.idleWorkers) / metrics.totalWorkers;
    if (utilizationRatio > 0.8) {
      return Math.floor(this.config.scalingRules.scaleUpThreshold * 0.7);
    }

    // Otherwise, assume low queue depth
    return Math.floor(this.config.scalingRules.scaleDownThreshold * 0.5);
  }
}
