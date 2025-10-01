/**
 * Worker Thread Script for Task Processing
 * Handles different types of ingestion tasks in separate threads
 */

import { parentPort, workerData } from 'worker_threads';
import type {
  WorkerTaskMessage,
  WorkerTaskResult,
} from '@memento/shared-types';
import type { TaskPayload } from '../ingestion/types';

interface WorkerStartupConfig {
  workerId?: string;
  apiBaseUrl?: string;
  apiKey?: string;
}

type WorkerMessage = WorkerTaskMessage<TaskPayload>;

type WorkerResponse =
  | WorkerTaskResult<any>
  | { type: 'error'; taskId?: string; error: string }
  | { type: 'pong' }
  | { type: 'shutdown_complete' };

type FetchLike = (input: any, init?: any) => Promise<any>;

const fetchLike: FetchLike =
  typeof globalThis.fetch === 'function'
    ? (globalThis.fetch.bind(globalThis) as FetchLike)
    : (async () => {
        throw new Error('Fetch API is not available in this environment');
      });

class IngestionApiClient {
  private readonly baseUrl?: string;
  private readonly apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  get enabled(): boolean {
    return Boolean(this.baseUrl);
  }

  private resolveUrl(pathname: string): string {
    if (!this.baseUrl) {
      throw new Error('Ingestion API base URL is not configured');
    }

    return new URL(pathname, this.baseUrl).toString();
  }

  private prepareMetadata(
    metadata?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!metadata) {
      return undefined;
    }

    const { endpoint, ...rest } = metadata;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }

  private async post<T>(
    pathname: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const url = this.resolveUrl(pathname);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const response = await fetchLike(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Ingestion API request failed (${response.status} ${response.statusText}): ${
          errorText || 'no response body'
        }`
      );
    }

    const text = await response.text().catch(() => '');
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  async upsertEntities(
    entities: unknown[],
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const endpoint =
      (metadata?.endpoint as string | undefined) ||
      '/ingestion/entities/bulk';
    return this.post(endpoint, {
      entities,
      metadata: this.prepareMetadata(metadata),
    });
  }

  async upsertRelationships(
    relationships: unknown[],
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const endpoint =
      (metadata?.endpoint as string | undefined) ||
      '/ingestion/relationships/bulk';
    return this.post(endpoint, {
      relationships,
      metadata: this.prepareMetadata(metadata),
    });
  }

  async enqueueEmbeddings(
    entities: unknown[],
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const endpoint =
      (metadata?.endpoint as string | undefined) ||
      '/ingestion/embeddings/batch';
    return this.post(endpoint, {
      entities,
      metadata: this.prepareMetadata(metadata),
    });
  }
}

class TaskWorker {
  private processing = false;
  private workerId: string;
  private readonly apiClient: IngestionApiClient;
  private warnedAboutApi = false;

  constructor() {
    const startup: WorkerStartupConfig =
      (workerData as WorkerStartupConfig) || {};

    this.workerId = startup.workerId || `worker-${process.pid}`;
    this.apiClient = new IngestionApiClient(
      startup.apiBaseUrl,
      startup.apiKey
    );
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
    const payload = message.payload;

    if (!payload) {
      throw new Error('Task payload is required');
    }

    const taskId = message.taskId || payload.id;

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    if (!payload.type) {
      throw new Error('Task type is required');
    }

    if (this.processing) {
      throw new Error('Worker is already processing a task');
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      console.log(
        `[TaskWorker-${this.workerId}] Processing task ${taskId} of type ${payload.type}`
      );

      let result: unknown;

      switch (payload.type) {
        case 'entity_upsert':
          result = await this.processEntityUpsert(payload);
          break;

        case 'relationship_upsert':
          result = await this.processRelationshipUpsert(payload);
          break;

        case 'embedding':
          result = await this.processEmbedding(payload);
          break;

        case 'parse':
          result = await this.processParsing(payload);
          break;

        default:
          throw new Error(`Unknown task type: ${payload.type}`);
      }

      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId,
        success: true,
        result,
        duration,
      });

      console.log(
        `[TaskWorker-${this.workerId}] Completed task ${taskId} in ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      console.error(`[TaskWorker-${this.workerId}] Failed task ${taskId}:`, error);
    } finally {
      this.processing = false;
    }
  }

  private async processEntityUpsert(task: TaskPayload): Promise<any> {
    const entities = Array.isArray(task.data) ? task.data : [task.data];

    if (this.apiClient.enabled) {
      const response = await this.apiClient.upsertEntities(
        entities,
        task.metadata
      );
      return {
        processed: entities.filter(Boolean).length,
        type: 'entity',
        metadata: {
          workerId: this.workerId,
          mode: 'api',
        },
        response,
      };
    }

    this.warnAboutMissingApi();
    await new Promise((resolve) =>
      setTimeout(resolve, 10 + Math.random() * 20)
    );

    return {
      processed: entities.filter(Boolean).length,
      type: 'entity',
      metadata: {
        workerId: this.workerId,
        mode: 'simulated',
      },
    };
  }

  private async processRelationshipUpsert(task: TaskPayload): Promise<any> {
    const relationships = Array.isArray(task.data) ? task.data : [task.data];

    if (this.apiClient.enabled) {
      const response = await this.apiClient.upsertRelationships(
        relationships,
        task.metadata
      );
      return {
        processed: relationships.filter(Boolean).length,
        type: 'relationship',
        metadata: {
          workerId: this.workerId,
          mode: 'api',
        },
        response,
      };
    }

    this.warnAboutMissingApi();
    await new Promise((resolve) =>
      setTimeout(resolve, 5 + Math.random() * 15)
    );

    return {
      processed: relationships.filter(Boolean).length,
      type: 'relationship',
      metadata: {
        workerId: this.workerId,
        mode: 'simulated',
      },
    };
  }

  private async processEmbedding(task: TaskPayload): Promise<any> {
    const entities = Array.isArray(task.data) ? task.data : [task.data];

    if (this.apiClient.enabled) {
      const response = await this.apiClient.enqueueEmbeddings(
        entities,
        task.metadata
      );
      return {
        processed: entities.filter(Boolean).length,
        type: 'embedding',
        metadata: {
          workerId: this.workerId,
          mode: 'api',
        },
        response,
      };
    }

    this.warnAboutMissingApi();
    await new Promise((resolve) =>
      setTimeout(resolve, 50 + Math.random() * 100)
    );

    return {
      processed: entities.filter(Boolean).length,
      type: 'embedding',
      dimensions: 768,
      metadata: {
        workerId: this.workerId,
        mode: 'simulated',
      },
    };
  }

  private async processParsing(task: TaskPayload): Promise<any> {
    // Parsing remains local until API coverage exists
    await new Promise((resolve) =>
      setTimeout(resolve, 30 + Math.random() * 70)
    );

    return {
      processed: 1,
      type: 'parse',
      entities: Math.floor(Math.random() * 10) + 1,
      relationships: Math.floor(Math.random() * 15) + 1,
      metadata: {
        workerId: this.workerId,
        mode: this.apiClient.enabled ? 'hybrid' : 'simulated',
        filePath: task.metadata?.filePath,
      },
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

  private warnAboutMissingApi(): void {
    if (this.warnedAboutApi) {
      return;
    }

    console.warn(
      `[TaskWorker-${this.workerId}] Ingestion API base URL not configured; using simulated execution`
    );
    this.warnedAboutApi = true;
  }
}

// Start the worker
new TaskWorker();
