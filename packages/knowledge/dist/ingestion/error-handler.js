/**
 * Error Handling and Retry Logic for High-Throughput Ingestion Pipeline
 * Provides comprehensive error handling, retry mechanisms, and circuit breaker patterns
 */
import { EventEmitter } from 'events';
import { IngestionError, BatchProcessingError, WorkerError, QueueOverflowError } from './types.js';
/**
 * Circuit breaker implementation for preventing cascade failures
 */
class CircuitBreaker extends EventEmitter {
    constructor(config) {
        super();
        this.state = 'closed';
        this.failures = 0;
        this.lastFailureTime = 0;
        this.successCount = 0;
        this.config = config;
    }
    async execute(operation) {
        if (this.state === 'open') {
            const now = Date.now();
            if (now - this.lastFailureTime < this.config.resetTimeout) {
                throw new IngestionError('Circuit breaker is open', 'CIRCUIT_BREAKER_OPEN', false);
            }
            this.state = 'half-open';
            this.successCount = 0;
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= 3) { // Require 3 successes to close
                this.state = 'closed';
                this.emit('closed');
            }
        }
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.config.failureThreshold) {
            this.state = 'open';
            this.emit('opened');
        }
    }
    getState() {
        return this.state;
    }
    getMetrics() {
        return {
            state: this.state,
            failures: this.failures,
            successCount: this.successCount
        };
    }
}
/**
 * Retry mechanism with exponential backoff and jitter
 */
class RetryHandler {
    constructor(config) {
        this.config = config;
    }
    async execute(operation, context = 'unknown') {
        let lastError;
        let attempt = 0;
        while (attempt < this.config.maxAttempts) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                attempt++;
                if (!this.isRetryable(error) || attempt >= this.config.maxAttempts) {
                    throw error;
                }
                const delay = this.calculateDelay(attempt);
                console.log(`[RetryHandler] Attempt ${attempt} failed for ${context}, retrying in ${delay}ms:`, error);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    isRetryable(error) {
        if (error instanceof IngestionError) {
            return error.retryable;
        }
        // Check against retryable error patterns
        const errorMessage = error.message.toLowerCase();
        return this.config.retryableErrors.some(pattern => errorMessage.includes(pattern.toLowerCase()));
    }
    calculateDelay(attempt) {
        const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
        const clampedDelay = Math.min(exponentialDelay, this.config.maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = clampedDelay * this.config.jitterFactor * (Math.random() - 0.5);
        return Math.max(clampedDelay + jitter, this.config.baseDelay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Dead letter queue for failed tasks
 */
class DeadLetterQueue {
    constructor(config) {
        this.queue = [];
        this.config = config;
        // Start cleanup timer
        setInterval(() => this.cleanup(), 60000); // Every minute
    }
    add(task, error, attempts) {
        if (!this.config.enabled) {
            return;
        }
        if (this.queue.length >= this.config.maxSize) {
            // Remove oldest item
            this.queue.shift();
        }
        this.queue.push({
            task,
            error,
            timestamp: new Date(),
            attempts
        });
    }
    getAll() {
        return [...this.queue];
    }
    remove(taskId) {
        const index = this.queue.findIndex(item => item.task.id === taskId);
        if (index >= 0) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }
    size() {
        return this.queue.length;
    }
    cleanup() {
        const cutoff = new Date(Date.now() - this.config.retentionTime);
        this.queue = this.queue.filter(item => item.timestamp > cutoff);
    }
}
/**
 * Main error handler for the ingestion pipeline
 */
export class IngestionErrorHandler extends EventEmitter {
    constructor(config) {
        super();
        // Metrics
        this.metrics = {
            totalErrors: 0,
            errorsByType: {},
            retryCount: 0,
            circuitBreakerTrips: 0,
            deadLetterQueueSize: 0,
            errorRate: 0
        };
        // Error rate limiting
        this.errorCountWindow = [];
        this.lastErrorRateCheck = Date.now();
        // Custom error handlers
        this.errorHandlers = new Map();
        this.config = config;
        this.retryHandler = new RetryHandler(config.retry);
        this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
        this.deadLetterQueue = new DeadLetterQueue(config.deadLetterQueue);
        this.setupCircuitBreakerEvents();
        this.startMetricsCollection();
    }
    /**
     * Execute an operation with full error handling (retry + circuit breaker)
     */
    async executeWithErrorHandling(operation, context = 'unknown', skipCircuitBreaker = false) {
        const executeOperation = skipCircuitBreaker
            ? operation
            : () => this.circuitBreaker.execute(operation);
        try {
            return await this.retryHandler.execute(executeOperation, context);
        }
        catch (error) {
            await this.handleError(error, { context, operation: 'execute' });
            throw error;
        }
    }
    /**
     * Handle a failed task with retry logic
     */
    async handleTaskFailure(task, error, requeueCallback) {
        this.recordError(error);
        // Check if task should be retried
        if (task.retryCount < task.maxRetries && this.isRetryable(error)) {
            this.metrics.retryCount++;
            await requeueCallback(task, error);
            return;
        }
        // Task has exceeded retries, move to dead letter queue
        this.deadLetterQueue.add(task, error, task.retryCount);
        this.metrics.deadLetterQueueSize = this.deadLetterQueue.size();
        console.error(`[ErrorHandler] Task ${task.id} failed permanently after ${task.retryCount} retries:`, error);
    }
    /**
     * Handle batch processing errors
     */
    async handleBatchError(batchError, retryCallback) {
        this.recordError(batchError);
        // Try to process failed items individually if possible
        if (batchError.failedItems.length > 0 && batchError.failedItems.length < 10) {
            console.log(`[ErrorHandler] Attempting individual processing for ${batchError.failedItems.length} failed items`);
            for (const item of batchError.failedItems) {
                try {
                    // This would be handled by the calling code
                    console.log(`[ErrorHandler] Individual retry needed for item:`, item);
                }
                catch (itemError) {
                    console.error(`[ErrorHandler] Individual item retry failed:`, itemError);
                }
            }
        }
        // If retry callback provided and error is retryable, attempt batch retry
        if (retryCallback && this.isRetryable(batchError)) {
            try {
                await retryCallback(batchError.batchId);
            }
            catch (retryError) {
                console.error(`[ErrorHandler] Batch retry failed for ${batchError.batchId}:`, retryError);
            }
        }
    }
    /**
     * Handle worker errors
     */
    async handleWorkerError(workerError) {
        var _a;
        this.recordError(workerError);
        // If worker is consistently failing, it might need restart
        if (((_a = workerError.metadata) === null || _a === void 0 ? void 0 : _a.errorCount) && workerError.metadata.errorCount > 5) {
            console.warn(`[ErrorHandler] Worker ${workerError.workerId} has high error count, restart recommended`);
        }
    }
    /**
     * Register a custom error handler for specific error types
     */
    registerErrorHandler(errorType, handler) {
        this.errorHandlers.set(errorType, handler);
    }
    /**
     * Get current error metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get dead letter queue contents
     */
    getDeadLetterQueue() {
        return this.deadLetterQueue.getAll();
    }
    /**
     * Retry a task from the dead letter queue
     */
    async retryFromDeadLetterQueue(taskId, requeueCallback) {
        const items = this.deadLetterQueue.getAll();
        const item = items.find(i => i.task.id === taskId);
        if (!item) {
            return false;
        }
        // Reset retry count and requeue
        item.task.retryCount = 0;
        await requeueCallback(item.task);
        this.deadLetterQueue.remove(taskId);
        this.metrics.deadLetterQueueSize = this.deadLetterQueue.size();
        return true;
    }
    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus() {
        return this.circuitBreaker.getMetrics();
    }
    /**
     * Record an error for metrics and analysis
     */
    async handleError(error, context = {}) {
        this.recordError(error);
        // Try custom error handlers first
        const errorType = error.constructor.name;
        const customHandler = this.errorHandlers.get(errorType);
        if (customHandler) {
            try {
                const handled = await customHandler(error, context);
                if (handled) {
                    return;
                }
            }
            catch (handlerError) {
                console.error('[ErrorHandler] Custom error handler failed:', handlerError);
            }
        }
        // Default error handling
        if (error instanceof QueueOverflowError) {
            console.error('[ErrorHandler] Queue overflow detected, applying backpressure');
            this.emit('queue:overflow', error);
        }
        else if (error instanceof BatchProcessingError) {
            await this.handleBatchError(error);
        }
        else if (error instanceof WorkerError) {
            await this.handleWorkerError(error);
        }
        // Check if we should report this error
        if (this.shouldReportError(error)) {
            this.reportError(error, context);
        }
    }
    recordError(error) {
        this.metrics.totalErrors++;
        const errorType = error.constructor.name;
        this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
        // Update error rate tracking
        this.errorCountWindow.push(Date.now());
        this.updateErrorRate();
    }
    isRetryable(error) {
        if (error instanceof IngestionError) {
            return error.retryable;
        }
        // Network errors are generally retryable
        if (error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('ENOTFOUND')) {
            return true;
        }
        // Database timeout errors
        if (error.message.includes('timeout') ||
            error.message.includes('connection')) {
            return true;
        }
        return false;
    }
    setupCircuitBreakerEvents() {
        this.circuitBreaker.on('opened', () => {
            this.metrics.circuitBreakerTrips++;
            console.warn('[ErrorHandler] Circuit breaker opened');
        });
        this.circuitBreaker.on('closed', () => {
            console.log('[ErrorHandler] Circuit breaker closed');
        });
    }
    startMetricsCollection() {
        setInterval(() => {
            this.updateErrorRate();
            this.emit('metrics:updated', this.metrics);
        }, 10000); // Every 10 seconds
    }
    updateErrorRate() {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        // Remove old error timestamps
        this.errorCountWindow = this.errorCountWindow.filter(timestamp => timestamp > windowStart);
        // Calculate error rate (errors per minute)
        this.metrics.errorRate = this.errorCountWindow.length;
    }
    shouldReportError(error) {
        if (!this.config.errorReporting.enabled) {
            return false;
        }
        // Sample errors based on configured rate
        if (Math.random() > this.config.errorReporting.sampleRate) {
            return false;
        }
        // Don't report if we've exceeded max errors per minute
        if (this.metrics.errorRate > this.config.errorReporting.maxErrorsPerMinute) {
            return false;
        }
        return true;
    }
    reportError(error, context) {
        // This would integrate with external error reporting services
        console.error('[ErrorHandler] Reporting error:', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            metrics: this.metrics
        });
    }
}
/**
 * Create default error handling configuration
 */
export function createDefaultErrorHandlingConfig() {
    return {
        retry: {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            jitterFactor: 0.1,
            retryableErrors: [
                'timeout',
                'connection',
                'network',
                'temporary',
                'rate limit',
                'service unavailable'
            ]
        },
        circuitBreaker: {
            failureThreshold: 5,
            timeoutThreshold: 30000,
            resetTimeout: 60000,
            monitoringWindow: 60000
        },
        deadLetterQueue: {
            enabled: true,
            maxSize: 1000,
            retentionTime: 3600000 // 1 hour
        },
        errorReporting: {
            enabled: true,
            sampleRate: 0.1, // Report 10% of errors
            maxErrorsPerMinute: 100
        }
    };
}
//# sourceMappingURL=error-handler.js.map