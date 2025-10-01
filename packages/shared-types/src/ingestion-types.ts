/**
 * High-Throughput Ingestion Pipeline Types
 * Common types for ingestion pipeline operations across packages
 */

import { Entity } from './entities.js';
import { GraphRelationship } from './relationships.js';

// ========== Event Bus Types ==========

export interface ChangeEvent {
  id: string;
  namespace: string;
  module: string;
  filePath: string;
  eventType: 'created' | 'modified' | 'deleted';
  timestamp: Date;
  size: number;
  diffHash: string;
  metadata: Record<string, any>;
}

export interface ChangeFragment {
  id: string;
  eventId: string;
  changeType: 'entity' | 'relationship';
  operation: 'add' | 'update' | 'remove';
  data: Entity | GraphRelationship;
  dependencyHints: string[];
  confidence: number;
}

// ========== Queue Management ==========

export interface QueueConfig {
  maxSize: number;
  partitionCount: number;
  partitions?: number;
  batchSize: number;
  batchTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  persistenceConfig?: {
    enabled?: boolean;
    flushInterval?: number;
  };
}

export interface QueueMetrics {
  queueDepth: number;
  oldestEventAge: number;
  partitionLag: Record<string, number>;
  throughputPerSecond: number;
  errorRate: number;
}

export interface TaskPayload {
  id: string;
  type: 'parse' | 'entity_upsert' | 'relationship_upsert' | 'embedding';
  priority: number;
  data: any;
  metadata: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
}

// ========== Worker Pool Types ==========

export interface WorkerConfig {
  id: string;
  type: 'parser' | 'entity' | 'relationship' | 'embedding';
  concurrency: number;
  batchSize: number;
  timeout: number;
  healthCheck: boolean;
}

export interface WorkerMetrics {
  workerId: string;
  status: 'idle' | 'busy' | 'error' | 'shutdown';
  tasksProcessed: number;
  averageLatency: number;
  errorCount: number;
  lastActivity: Date;
}

export interface WorkerResult {
  taskId: string;
  workerId: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}

// ========== Batch Processing ==========

export interface BatchConfig {
  entityBatchSize: number;
  relationshipBatchSize: number;
  embeddingBatchSize: number;
  timeoutMs: number;
  maxConcurrentBatches: number;
  flushInterval?: number;
  idempotencyTTL?: number;
}

export interface BatchMetadata {
  id: string;
  type: 'entity' | 'relationship' | 'embedding';
  size: number;
  priority: number;
  createdAt: Date;
  epochId?: string;
  namespace?: string;
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  processedCount: number;
  failedCount: number;
  duration: number;
  errors: Error[];
  metadata: BatchMetadata;
}

// ========== Pipeline Orchestration ==========

export interface PipelineConfig {
  eventBus: {
    type: 'redis' | 'nats' | 'memory';
    url?: string;
    partitions: number;
  };
  workers: {
    parsers: number;
    entityWorkers: number;
    relationshipWorkers: number;
    embeddingWorkers: number;
  };
  batching: BatchConfig;
  queues: QueueConfig;
  monitoring: {
    metricsInterval: number;
    healthCheckInterval: number;
    alertThresholds: {
      queueDepth: number;
      latency: number;
      errorRate: number;
    };
  };
}

export interface PipelineMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  queueMetrics: QueueMetrics;
  workerMetrics: WorkerMetrics[];
  batchMetrics: {
    activeBatches: number;
    completedBatches: number;
    failedBatches: number;
  };
}

export interface PipelineState {
  status:
    | 'starting'
    | 'running'
    | 'pausing'
    | 'paused'
    | 'stopping'
    | 'stopped'
    | 'error';
  startedAt?: Date;
  lastActivity?: Date;
  processedEvents: number;
  errorCount: number;
  currentLoad: number;
}

// ========== Dependency DAG ==========

export interface DependencyNode {
  id: string;
  type: 'entity' | 'relationship';
  data: Entity | GraphRelationship;
  dependencies: string[];
  dependents: string[];
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DependencyDAG {
  nodes: Map<string, DependencyNode>;
  roots: string[];
  leaves: string[];
  cycles: string[][];
}

// ========== Streaming Graph Writes ==========

export interface StreamingWriteConfig {
  batchSize: number;
  maxConcurrentWrites: number;
  idempotencyKeyTTL: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
}

export interface IdempotentBatch {
  id: string;
  epochId: string;
  operation:
    | 'entity_upsert'
    | 'relationship_upsert'
    | 'entity_delete'
    | 'relationship_delete';
  data: (Entity | GraphRelationship)[];
  metadata: Record<string, any>;
  createdAt: Date;
}

// ========== Enrichment Pipeline ==========

export interface EnrichmentTask {
  id: string;
  type: 'embedding' | 'impact_analysis' | 'documentation' | 'security';
  entityId: string;
  priority: number;
  data: any;
  metadata?: Record<string, any>;
  dependencies: string[];
  createdAt: Date;
  sla?: number;
}

export interface EnrichmentResult {
  taskId: string;
  entityId: string;
  type: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}

// ========== Monitoring & Observability ==========

export interface IngestionTelemetry {
  timestamp: Date;
  pipeline: PipelineMetrics;
  queues: QueueMetrics;
  workers: WorkerMetrics[];
  errors: {
    count: number;
    types: Record<string, number>;
    samples: Error[];
  };
  performance: {
    cpu: number;
    memory: number;
    diskIO: number;
    networkIO: number;
  };
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
}

// ========== Error Handling ==========

export class IngestionError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'IngestionError';
  }
}

export class BatchProcessingError extends IngestionError {
  constructor(
    message: string,
    public batchId: string,
    public failedItems: any[] = [],
    retryable = true
  ) {
    super(message, 'BATCH_PROCESSING_ERROR', retryable, {
      batchId,
      failedItems,
    });
    this.name = 'BatchProcessingError';
  }
}

export class WorkerError extends IngestionError {
  constructor(
    message: string,
    public workerId: string,
    public taskId?: string,
    retryable = true
  ) {
    super(message, 'WORKER_ERROR', retryable, { workerId, taskId });
    this.name = 'WorkerError';
  }
}

export class QueueOverflowError extends IngestionError {
  constructor(
    message: string,
    public queueName: string,
    public currentSize: number,
    public maxSize: number
  ) {
    super(message, 'QUEUE_OVERFLOW', false, {
      queueName,
      currentSize,
      maxSize,
    });
    this.name = 'QueueOverflowError';
  }
}

// ========== Event Emitter Types ==========

export interface IngestionEvents {
  'pipeline:started': [];
  'pipeline:stopped': [];
  'pipeline:error': [error: Error];
  'event:received': [event: ChangeEvent];
  'event:processed': [event: ChangeEvent, duration: number];
  'batch:created': [batch: BatchMetadata];
  'batch:completed': [result: BatchResult];
  'batch:failed': [error: BatchProcessingError];
  'worker:started': [workerId: string];
  'worker:stopped': [workerId: string];
  'worker:error': [error: WorkerError];
  'queue:overflow': [error: QueueOverflowError];
  // Queue-level metrics (narrow payload for internal aggregation)
  'queue:metrics': [metrics: QueueMetrics];
  'metrics:updated': [metrics: PipelineMetrics];
  'alert:triggered': [alert: AlertConfig, value: number];
}
