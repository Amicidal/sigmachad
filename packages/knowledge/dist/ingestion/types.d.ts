/**
 * High-Throughput Ingestion Pipeline Types
 * Based on HighThroughputKnowledgeGraph.md architecture
 */
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
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
export interface QueueConfig {
    maxSize: number;
    partitionCount: number;
    batchSize: number;
    batchTimeout: number;
    retryAttempts: number;
    retryDelay: number;
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
export interface BatchConfig {
    entityBatchSize: number;
    relationshipBatchSize: number;
    embeddingBatchSize: number;
    timeoutMs: number;
    maxConcurrentBatches: number;
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
    status: 'starting' | 'running' | 'pausing' | 'paused' | 'stopping' | 'stopped' | 'error';
    startedAt?: Date;
    lastActivity?: Date;
    processedEvents: number;
    errorCount: number;
    currentLoad: number;
}
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
    operation: 'entity_upsert' | 'relationship_upsert' | 'entity_delete' | 'relationship_delete';
    data: (Entity | GraphRelationship)[];
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface EnrichmentTask {
    id: string;
    type: 'embedding' | 'impact_analysis' | 'documentation' | 'security';
    entityId: string;
    priority: number;
    data: any;
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
export declare class IngestionError extends Error {
    code: string;
    retryable: boolean;
    metadata: Record<string, any>;
    constructor(message: string, code: string, retryable?: boolean, metadata?: Record<string, any>);
}
export declare class BatchProcessingError extends IngestionError {
    batchId: string;
    failedItems: any[];
    constructor(message: string, batchId: string, failedItems?: any[], retryable?: boolean);
}
export declare class WorkerError extends IngestionError {
    workerId: string;
    taskId?: string | undefined;
    constructor(message: string, workerId: string, taskId?: string | undefined, retryable?: boolean);
}
export declare class QueueOverflowError extends IngestionError {
    queueName: string;
    currentSize: number;
    maxSize: number;
    constructor(message: string, queueName: string, currentSize: number, maxSize: number);
}
export interface IngestionEvents {
    'pipeline:started': () => void;
    'pipeline:stopped': () => void;
    'pipeline:error': (error: Error) => void;
    'event:received': (event: ChangeEvent) => void;
    'event:processed': (event: ChangeEvent, duration: number) => void;
    'batch:created': (batch: BatchMetadata) => void;
    'batch:completed': (result: BatchResult) => void;
    'batch:failed': (error: BatchProcessingError) => void;
    'worker:started': (workerId: string) => void;
    'worker:stopped': (workerId: string) => void;
    'worker:error': (error: WorkerError) => void;
    'queue:overflow': (error: QueueOverflowError) => void;
    'metrics:updated': (metrics: PipelineMetrics) => void;
    'alert:triggered': (alert: AlertConfig, value: number) => void;
}
//# sourceMappingURL=types.d.ts.map