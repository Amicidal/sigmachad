/**
 * Error Handling and Retry Logic for High-Throughput Ingestion Pipeline
 * Provides comprehensive error handling, retry mechanisms, and circuit breaker patterns
 */
import { EventEmitter } from 'events';
import { BatchProcessingError, WorkerError, TaskPayload, IngestionEvents } from './types.js';
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitterFactor: number;
    retryableErrors: string[];
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    timeoutThreshold: number;
    resetTimeout: number;
    monitoringWindow: number;
}
export interface ErrorHandlingConfig {
    retry: RetryConfig;
    circuitBreaker: CircuitBreakerConfig;
    deadLetterQueue: {
        enabled: boolean;
        maxSize: number;
        retentionTime: number;
    };
    errorReporting: {
        enabled: boolean;
        sampleRate: number;
        maxErrorsPerMinute: number;
    };
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByType: Record<string, number>;
    retryCount: number;
    circuitBreakerTrips: number;
    deadLetterQueueSize: number;
    errorRate: number;
}
export type ErrorHandler = (error: Error, context?: any) => Promise<boolean>;
/**
 * Main error handler for the ingestion pipeline
 */
export declare class IngestionErrorHandler extends EventEmitter<IngestionEvents> {
    private config;
    private retryHandler;
    private circuitBreaker;
    private deadLetterQueue;
    private metrics;
    private errorCountWindow;
    private lastErrorRateCheck;
    private errorHandlers;
    constructor(config: ErrorHandlingConfig);
    /**
     * Execute an operation with full error handling (retry + circuit breaker)
     */
    executeWithErrorHandling<T>(operation: () => Promise<T>, context?: string, skipCircuitBreaker?: boolean): Promise<T>;
    /**
     * Handle a failed task with retry logic
     */
    handleTaskFailure(task: TaskPayload, error: Error, requeueCallback: (task: TaskPayload, error: Error) => Promise<void>): Promise<void>;
    /**
     * Handle batch processing errors
     */
    handleBatchError(batchError: BatchProcessingError, retryCallback?: (batchId: string) => Promise<void>): Promise<void>;
    /**
     * Handle worker errors
     */
    handleWorkerError(workerError: WorkerError): Promise<void>;
    /**
     * Register a custom error handler for specific error types
     */
    registerErrorHandler(errorType: string, handler: ErrorHandler): void;
    /**
     * Get current error metrics
     */
    getMetrics(): ErrorMetrics;
    /**
     * Get dead letter queue contents
     */
    getDeadLetterQueue(): Array<{
        task: TaskPayload;
        error: Error;
        timestamp: Date;
        attempts: number;
    }>;
    /**
     * Retry a task from the dead letter queue
     */
    retryFromDeadLetterQueue(taskId: string, requeueCallback: (task: TaskPayload) => Promise<void>): Promise<boolean>;
    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus(): {
        state: string;
        failures: number;
        successCount: number;
    };
    /**
     * Record an error for metrics and analysis
     */
    private handleError;
    private recordError;
    private isRetryable;
    private setupCircuitBreakerEvents;
    private startMetricsCollection;
    private updateErrorRate;
    private shouldReportError;
    private reportError;
}
/**
 * Create default error handling configuration
 */
export declare function createDefaultErrorHandlingConfig(): ErrorHandlingConfig;
//# sourceMappingURL=error-handler.d.ts.map