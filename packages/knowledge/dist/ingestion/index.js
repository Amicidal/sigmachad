/**
 * High-Throughput Ingestion Pipeline Exports
 * Entry point for the ingestion pipeline components
 */
// Main pipeline orchestrator
export { HighThroughputIngestionPipeline } from './pipeline.js';
// Core components
export { QueueManager } from './queue-manager.js';
export { WorkerPool } from './worker-pool.js';
export { HighThroughputBatchProcessor } from './batch-processor.js';
// Error classes
export { IngestionError, BatchProcessingError, WorkerError, QueueOverflowError } from './types.js';
// Utility functions and constants
export const INGESTION_DEFAULTS = {
    QUEUE: {
        MAX_SIZE: 10000,
        PARTITION_COUNT: 4,
        BATCH_SIZE: 100,
        BATCH_TIMEOUT: 1000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    WORKERS: {
        MIN_WORKERS: 2,
        MAX_WORKERS: 16,
        WORKER_TIMEOUT: 30000,
        HEALTH_CHECK_INTERVAL: 5000,
        RESTART_THRESHOLD: 5
    },
    BATCHING: {
        ENTITY_BATCH_SIZE: 100,
        RELATIONSHIP_BATCH_SIZE: 200,
        EMBEDDING_BATCH_SIZE: 50,
        TIMEOUT_MS: 30000,
        MAX_CONCURRENT_BATCHES: 4
    },
    MONITORING: {
        METRICS_INTERVAL: 5000,
        HEALTH_CHECK_INTERVAL: 10000,
        ALERT_THRESHOLDS: {
            QUEUE_DEPTH: 1000,
            LATENCY: 5000,
            ERROR_RATE: 0.1
        }
    }
};
/**
 * Create a default pipeline configuration
 */
export function createDefaultPipelineConfig() {
    return {
        eventBus: {
            type: 'memory',
            partitions: INGESTION_DEFAULTS.QUEUE.PARTITION_COUNT
        },
        workers: {
            parsers: 4,
            entityWorkers: 4,
            relationshipWorkers: 4,
            embeddingWorkers: 2
        },
        batching: {
            entityBatchSize: INGESTION_DEFAULTS.BATCHING.ENTITY_BATCH_SIZE,
            relationshipBatchSize: INGESTION_DEFAULTS.BATCHING.RELATIONSHIP_BATCH_SIZE,
            embeddingBatchSize: INGESTION_DEFAULTS.BATCHING.EMBEDDING_BATCH_SIZE,
            timeoutMs: INGESTION_DEFAULTS.BATCHING.TIMEOUT_MS,
            maxConcurrentBatches: INGESTION_DEFAULTS.BATCHING.MAX_CONCURRENT_BATCHES
        },
        queues: {
            maxSize: INGESTION_DEFAULTS.QUEUE.MAX_SIZE,
            partitionCount: INGESTION_DEFAULTS.QUEUE.PARTITION_COUNT,
            batchSize: INGESTION_DEFAULTS.QUEUE.BATCH_SIZE,
            batchTimeout: INGESTION_DEFAULTS.QUEUE.BATCH_TIMEOUT,
            retryAttempts: INGESTION_DEFAULTS.QUEUE.RETRY_ATTEMPTS,
            retryDelay: INGESTION_DEFAULTS.QUEUE.RETRY_DELAY
        },
        monitoring: {
            metricsInterval: INGESTION_DEFAULTS.MONITORING.METRICS_INTERVAL,
            healthCheckInterval: INGESTION_DEFAULTS.MONITORING.HEALTH_CHECK_INTERVAL,
            alertThresholds: {
                queueDepth: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.QUEUE_DEPTH,
                latency: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.LATENCY,
                errorRate: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.ERROR_RATE
            }
        }
    };
}
/**
 * Create a high-throughput pipeline configuration for production use
 */
export function createHighThroughputPipelineConfig() {
    const config = createDefaultPipelineConfig();
    // Scale up for high throughput
    config.workers.parsers = 8;
    config.workers.entityWorkers = 8;
    config.workers.relationshipWorkers = 8;
    config.workers.embeddingWorkers = 4;
    // Increase batch sizes
    config.batching.entityBatchSize = 500;
    config.batching.relationshipBatchSize = 1000;
    config.batching.embeddingBatchSize = 200;
    config.batching.maxConcurrentBatches = 8;
    // Scale queues
    config.queues.maxSize = 50000;
    config.queues.partitionCount = 8;
    config.queues.batchSize = 500;
    // Adjust monitoring for higher load
    config.monitoring.alertThresholds.queueDepth = 10000;
    config.monitoring.alertThresholds.latency = 2000;
    return config;
}
/**
 * Create a development pipeline configuration with conservative settings
 */
export function createDevelopmentPipelineConfig() {
    const config = createDefaultPipelineConfig();
    // Scale down for development
    config.workers.parsers = 2;
    config.workers.entityWorkers = 2;
    config.workers.relationshipWorkers = 2;
    config.workers.embeddingWorkers = 1;
    // Smaller batches
    config.batching.entityBatchSize = 50;
    config.batching.relationshipBatchSize = 100;
    config.batching.embeddingBatchSize = 25;
    config.batching.maxConcurrentBatches = 2;
    // Smaller queues
    config.queues.maxSize = 1000;
    config.queues.partitionCount = 2;
    config.queues.batchSize = 50;
    // More frequent monitoring
    config.monitoring.metricsInterval = 2000;
    config.monitoring.healthCheckInterval = 5000;
    return config;
}
/**
 * Utility function to validate pipeline configuration
 */
export function validatePipelineConfig(config) {
    const errors = [];
    // Validate worker counts
    if (config.workers.parsers < 1) {
        errors.push('At least 1 parser worker is required');
    }
    if (config.workers.entityWorkers < 1) {
        errors.push('At least 1 entity worker is required');
    }
    if (config.workers.relationshipWorkers < 1) {
        errors.push('At least 1 relationship worker is required');
    }
    // Validate batch sizes
    if (config.batching.entityBatchSize < 1) {
        errors.push('Entity batch size must be at least 1');
    }
    if (config.batching.relationshipBatchSize < 1) {
        errors.push('Relationship batch size must be at least 1');
    }
    if (config.batching.maxConcurrentBatches < 1) {
        errors.push('Max concurrent batches must be at least 1');
    }
    // Validate queue settings
    if (config.queues.maxSize < 100) {
        errors.push('Queue max size should be at least 100');
    }
    if (config.queues.partitionCount < 1) {
        errors.push('At least 1 queue partition is required');
    }
    // Validate monitoring settings
    if (config.monitoring.metricsInterval < 1000) {
        errors.push('Metrics interval should be at least 1000ms');
    }
    if (config.monitoring.healthCheckInterval < 1000) {
        errors.push('Health check interval should be at least 1000ms');
    }
    return errors;
}
/**
 * Create a mock change event for testing
 */
export function createMockChangeEvent(overrides = {}) {
    return {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        namespace: 'test',
        module: 'test-module',
        filePath: '/test/file.ts',
        eventType: 'modified',
        timestamp: new Date(),
        size: 1000,
        diffHash: 'abc123',
        metadata: {},
        ...overrides
    };
}
/**
 * Create a mock change fragment for testing
 */
export function createMockChangeFragment(overrides = {}) {
    return {
        id: `fragment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        eventId: 'test-event',
        changeType: 'entity',
        operation: 'add',
        data: {
            id: 'test-entity',
            type: 'function',
            name: 'testFunction',
            properties: {},
            metadata: { createdAt: new Date() }
        },
        dependencyHints: [],
        confidence: 0.9,
        ...overrides
    };
}
//# sourceMappingURL=index.js.map