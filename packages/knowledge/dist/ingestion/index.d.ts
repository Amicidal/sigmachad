/**
 * High-Throughput Ingestion Pipeline Exports
 * Entry point for the ingestion pipeline components
 */
export { HighThroughputIngestionPipeline } from './pipeline.js';
export type { KnowledgeGraphServiceIntegration } from './pipeline.js';
export { QueueManager } from './queue-manager.js';
export type { QueueManagerConfig } from './queue-manager.js';
export { WorkerPool } from './worker-pool.js';
export type { WorkerPoolConfig, WorkerInstance, WorkerHandler } from './worker-pool.js';
export { HighThroughputBatchProcessor } from './batch-processor.js';
export type { BatchProcessor, BatchProcessorConfig } from './batch-processor.js';
export type { ChangeEvent, ChangeFragment, QueueConfig, QueueMetrics, TaskPayload, WorkerConfig, WorkerMetrics, WorkerResult, BatchConfig, BatchMetadata, BatchResult, PipelineConfig, PipelineMetrics, PipelineState, DependencyNode, DependencyDAG, StreamingWriteConfig, IdempotentBatch, EnrichmentTask, EnrichmentResult, IngestionTelemetry, AlertConfig, IngestionEvents } from './types.js';
export { IngestionError, BatchProcessingError, WorkerError, QueueOverflowError } from './types.js';
export declare const INGESTION_DEFAULTS: {
    readonly QUEUE: {
        readonly MAX_SIZE: 10000;
        readonly PARTITION_COUNT: 4;
        readonly BATCH_SIZE: 100;
        readonly BATCH_TIMEOUT: 1000;
        readonly RETRY_ATTEMPTS: 3;
        readonly RETRY_DELAY: 1000;
    };
    readonly WORKERS: {
        readonly MIN_WORKERS: 2;
        readonly MAX_WORKERS: 16;
        readonly WORKER_TIMEOUT: 30000;
        readonly HEALTH_CHECK_INTERVAL: 5000;
        readonly RESTART_THRESHOLD: 5;
    };
    readonly BATCHING: {
        readonly ENTITY_BATCH_SIZE: 100;
        readonly RELATIONSHIP_BATCH_SIZE: 200;
        readonly EMBEDDING_BATCH_SIZE: 50;
        readonly TIMEOUT_MS: 30000;
        readonly MAX_CONCURRENT_BATCHES: 4;
    };
    readonly MONITORING: {
        readonly METRICS_INTERVAL: 5000;
        readonly HEALTH_CHECK_INTERVAL: 10000;
        readonly ALERT_THRESHOLDS: {
            readonly QUEUE_DEPTH: 1000;
            readonly LATENCY: 5000;
            readonly ERROR_RATE: 0.1;
        };
    };
};
/**
 * Create a default pipeline configuration
 */
export declare function createDefaultPipelineConfig(): PipelineConfig;
/**
 * Create a high-throughput pipeline configuration for production use
 */
export declare function createHighThroughputPipelineConfig(): PipelineConfig;
/**
 * Create a development pipeline configuration with conservative settings
 */
export declare function createDevelopmentPipelineConfig(): PipelineConfig;
/**
 * Utility function to validate pipeline configuration
 */
export declare function validatePipelineConfig(config: PipelineConfig): string[];
/**
 * Create a mock change event for testing
 */
export declare function createMockChangeEvent(overrides?: Partial<ChangeEvent>): ChangeEvent;
/**
 * Create a mock change fragment for testing
 */
export declare function createMockChangeFragment(overrides?: Partial<ChangeFragment>): ChangeFragment;
//# sourceMappingURL=index.d.ts.map