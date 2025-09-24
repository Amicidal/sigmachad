/**
 * Worker Thread Script for Task Processing
 * Handles different types of ingestion tasks in separate threads
 */

import { parentPort, workerData } from 'worker_threads';

interface WorkerMessage {
  type: 'task' | 'shutdown' | 'ping';
  taskId?: string;
  taskType?: string;
  data?: any;
  metadata?: Record<string, any>;
}

interface WorkerResponse {
  type: 'task_result' | 'error' | 'pong' | 'shutdown_complete';
  taskId?: string;
  success?: boolean;
  result?: any;
  error?: string;
  duration?: number;
}

class TaskWorker {
  private processing = false;
  private workerId: string;

  constructor() {
    this.workerId = workerData?.workerId || `worker-${process.pid}`;
    this.setupMessageHandler();
    this.sendMessage({ type: 'pong' }); // Signal ready
  }

  private setupMessageHandler(): void {
    if (!parentPort) {
      throw new Error('Worker script must be run in a worker thread');
    }

    parentPort.on('message', async (message: WorkerMessage) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        this.sendMessage({
          type: 'error',
          taskId: message.taskId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.sendMessage({
        type: 'error',
        error: `Uncaught exception: ${error.message}`
      });
    });

    process.on('unhandledRejection', (reason) => {
      this.sendMessage({
        type: 'error',
        error: `Unhandled rejection: ${reason}`
      });
    });
  }

  private async handleMessage(message: WorkerMessage): Promise<void> {
    switch (message.type) {
      case 'ping':
        this.sendMessage({ type: 'pong' });
        break;

      case 'task':
        await this.processTask(message);
        break;

      case 'shutdown':
        await this.shutdown();
        break;

      default:
        console.warn(`[TaskWorker] Unknown message type: ${(message as any).type}`);
    }
  }

  private async processTask(message: WorkerMessage): Promise<void> {
    if (!message.taskId || !message.taskType) {
      throw new Error('Task ID and type are required');
    }

    if (this.processing) {
      throw new Error('Worker is already processing a task');
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      console.log(`[TaskWorker-${this.workerId}] Processing task ${message.taskId} of type ${message.taskType}`);

      let result: any;

      switch (message.taskType) {
        case 'entity_upsert':
          result = await this.processEntityUpsert(message.data, message.metadata);
          break;

        case 'relationship_upsert':
          result = await this.processRelationshipUpsert(message.data, message.metadata);
          break;

        case 'embedding':
          result = await this.processEmbedding(message.data, message.metadata);
          break;

        case 'parse':
          result = await this.processParsing(message.data, message.metadata);
          break;

        default:
          throw new Error(`Unknown task type: ${message.taskType}`);
      }

      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId: message.taskId,
        success: true,
        result,
        duration
      });

      console.log(`[TaskWorker-${this.workerId}] Completed task ${message.taskId} in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId: message.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      console.error(`[TaskWorker-${this.workerId}] Failed task ${message.taskId}:`, error);

    } finally {
      this.processing = false;
    }
  }

  private async processEntityUpsert(data: any, metadata?: Record<string, any>): Promise<any> {
    // Simulate entity processing
    // In a real implementation, this would call the actual services
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'entity',
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processRelationshipUpsert(data: any, metadata?: Record<string, any>): Promise<any> {
    // Simulate relationship processing
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'relationship',
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processEmbedding(data: any, metadata?: Record<string, any>): Promise<any> {
    // Simulate embedding generation (slower operation)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'embedding',
      dimensions: 768,
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processParsing(data: any, metadata?: Record<string, any>): Promise<any> {
    // Simulate file parsing
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 70));

    return {
      processed: 1,
      type: 'parse',
      entities: Math.floor(Math.random() * 10) + 1,
      relationships: Math.floor(Math.random() * 15) + 1,
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async shutdown(): Promise<void> {
    console.log(`[TaskWorker-${this.workerId}] Shutting down...`);

    // Wait for current task to complete if processing
    while (this.processing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.sendMessage({ type: 'shutdown_complete' });
    process.exit(0);
  }

  private sendMessage(message: WorkerResponse): void {
    if (parentPort) {
      parentPort.postMessage(message);
    }
  }
}

// Start the worker
new TaskWorker();