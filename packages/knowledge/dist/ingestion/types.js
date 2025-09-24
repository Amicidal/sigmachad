/**
 * High-Throughput Ingestion Pipeline Types
 * Based on HighThroughputKnowledgeGraph.md architecture
 */
// ========== Error Handling ==========
export class IngestionError extends Error {
    constructor(message, code, retryable = false, metadata = {}) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.metadata = metadata;
        this.name = 'IngestionError';
    }
}
export class BatchProcessingError extends IngestionError {
    constructor(message, batchId, failedItems = [], retryable = true) {
        super(message, 'BATCH_PROCESSING_ERROR', retryable, { batchId, failedItems });
        this.batchId = batchId;
        this.failedItems = failedItems;
        this.name = 'BatchProcessingError';
    }
}
export class WorkerError extends IngestionError {
    constructor(message, workerId, taskId, retryable = true) {
        super(message, 'WORKER_ERROR', retryable, { workerId, taskId });
        this.workerId = workerId;
        this.taskId = taskId;
        this.name = 'WorkerError';
    }
}
export class QueueOverflowError extends IngestionError {
    constructor(message, queueName, currentSize, maxSize) {
        super(message, 'QUEUE_OVERFLOW', false, { queueName, currentSize, maxSize });
        this.queueName = queueName;
        this.currentSize = currentSize;
        this.maxSize = maxSize;
        this.name = 'QueueOverflowError';
    }
}
//# sourceMappingURL=types.js.map