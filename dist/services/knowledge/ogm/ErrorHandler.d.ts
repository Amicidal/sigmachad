/**
 * Error Handler for OGM Migration
 * Provides comprehensive error handling and recovery during the transition period
 */
import { EventEmitter } from 'events';
export interface ErrorContext {
    serviceName: string;
    operationName: string;
    implementationType: 'ogm' | 'legacy';
    entity?: any;
    parameters?: any;
    stackTrace?: string;
    timestamp: Date;
}
export interface ErrorHandlingStrategy {
    shouldFallback: boolean;
    shouldRetry: boolean;
    maxRetries: number;
    retryDelay: number;
    shouldLog: boolean;
    shouldAlert: boolean;
}
export declare class MigrationErrorHandler extends EventEmitter {
    private featureFlags;
    private tracker;
    private errorCounts;
    private lastErrors;
    constructor();
    /**
     * Handle an error during migration operations
     */
    handleError(error: Error, context: ErrorContext): Promise<{
        shouldFallback: boolean;
        shouldRetry: boolean;
        strategy: ErrorHandlingStrategy;
    }>;
    /**
     * Determine error handling strategy based on error type and context
     */
    private determineStrategy;
    /**
     * Classify error type for appropriate handling
     */
    private classifyError;
    /**
     * Increment error count for tracking
     */
    private incrementErrorCount;
    /**
     * Log error with appropriate level and details
     */
    private logError;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByService: Record<string, number>;
        errorsByType: Record<string, number>;
        recentErrors: Array<{
            key: string;
            count: number;
            lastSeen: Date;
        }>;
    };
    /**
     * Reset error tracking (for testing)
     */
    reset(): void;
    /**
     * Get error threshold recommendations
     */
    getThresholdRecommendations(): {
        shouldDisableOGM: boolean;
        shouldEnableFallback: boolean;
        criticalServices: string[];
        recommendations: string[];
    };
}
export declare function getMigrationErrorHandler(): MigrationErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map