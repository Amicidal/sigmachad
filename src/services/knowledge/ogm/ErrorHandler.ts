/**
 * Error Handler for OGM Migration
 * Provides comprehensive error handling and recovery during the transition period
 */

import { EventEmitter } from 'events';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';

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

export class MigrationErrorHandler extends EventEmitter {
  private featureFlags = getFeatureFlagService();
  private tracker = getMigrationTracker();
  private errorCounts = new Map<string, number>();
  private lastErrors = new Map<string, Date>();

  constructor() {
    super();
  }

  /**
   * Handle an error during migration operations
   */
  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<{
    shouldFallback: boolean;
    shouldRetry: boolean;
    strategy: ErrorHandlingStrategy;
  }> {
    const errorKey = `${context.serviceName}:${context.operationName}:${context.implementationType}`;

    // Track error frequency
    this.incrementErrorCount(errorKey);

    // Determine handling strategy
    const strategy = this.determineStrategy(error, context);

    // Log error if needed
    if (strategy.shouldLog) {
      this.logError(error, context, strategy);
    }

    // Emit error event
    this.emit('migration:error', {
      error,
      context,
      strategy,
      errorCount: this.errorCounts.get(errorKey) || 0,
    });

    // Check if we should trigger alerts
    if (strategy.shouldAlert) {
      this.emit('migration:alert', {
        message: `High error rate detected for ${errorKey}`,
        error,
        context,
        errorCount: this.errorCounts.get(errorKey),
      });
    }

    return {
      shouldFallback: strategy.shouldFallback,
      shouldRetry: strategy.shouldRetry,
      strategy,
    };
  }

  /**
   * Determine error handling strategy based on error type and context
   */
  private determineStrategy(error: Error, context: ErrorContext): ErrorHandlingStrategy {
    const errorType = this.classifyError(error);
    const errorKey = `${context.serviceName}:${context.operationName}:${context.implementationType}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;

    // Base strategy
    let strategy: ErrorHandlingStrategy = {
      shouldFallback: false,
      shouldRetry: false,
      maxRetries: 0,
      retryDelay: 1000,
      shouldLog: true,
      shouldAlert: false,
    };

    // Adjust strategy based on error type
    switch (errorType) {
      case 'connection':
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled();
        strategy.shouldRetry = true;
        strategy.maxRetries = 3;
        strategy.retryDelay = 2000;
        strategy.shouldAlert = errorCount > 5;
        break;

      case 'validation':
        // Validation errors usually mean data incompatibility
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled();
        strategy.shouldRetry = false;
        strategy.shouldAlert = errorCount > 10;
        break;

      case 'constraint':
        // Constraint violations might be handled differently by implementations
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled();
        strategy.shouldRetry = false;
        strategy.shouldAlert = errorCount > 5;
        break;

      case 'timeout':
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled();
        strategy.shouldRetry = true;
        strategy.maxRetries = 2;
        strategy.retryDelay = 5000;
        strategy.shouldAlert = errorCount > 3;
        break;

      case 'not_found':
        // Not found errors shouldn't trigger fallback usually
        strategy.shouldFallback = false;
        strategy.shouldRetry = false;
        strategy.shouldLog = false; // Reduce noise
        break;

      case 'ogm_specific':
        // OGM-specific errors should fallback to legacy
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled() && context.implementationType === 'ogm';
        strategy.shouldRetry = false;
        strategy.shouldAlert = errorCount > 1;
        break;

      default:
        // Unknown errors - be conservative
        strategy.shouldFallback = this.featureFlags.isFallbackEnabled() && context.implementationType === 'ogm';
        strategy.shouldRetry = true;
        strategy.maxRetries = 1;
        strategy.shouldAlert = errorCount > 2;
    }

    // Disable fallback if we're already using legacy
    if (context.implementationType === 'legacy') {
      strategy.shouldFallback = false;
    }

    // Disable retries if error count is too high
    if (errorCount > 10) {
      strategy.shouldRetry = false;
      strategy.shouldAlert = true;
    }

    return strategy;
  }

  /**
   * Classify error type for appropriate handling
   */
  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Connection-related errors
    if (message.includes('connection') ||
        message.includes('network') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        name.includes('neo4jerror')) {
      return 'connection';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    // Validation errors
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        name.includes('validationerror')) {
      return 'validation';
    }

    // Constraint violations
    if (message.includes('constraint') ||
        message.includes('unique') ||
        message.includes('duplicate') ||
        message.includes('already exists')) {
      return 'constraint';
    }

    // Not found errors
    if (message.includes('not found') ||
        message.includes('does not exist') ||
        name.includes('notfounderror')) {
      return 'not_found';
    }

    // OGM-specific errors
    if (message.includes('neogma') ||
        message.includes('ogm') ||
        message.includes('model') ||
        name.includes('neogmaerror')) {
      return 'ogm_specific';
    }

    return 'unknown';
  }

  /**
   * Increment error count for tracking
   */
  private incrementErrorCount(errorKey: string): void {
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    this.lastErrors.set(errorKey, new Date());
  }

  /**
   * Log error with appropriate level and details
   */
  private logError(
    error: Error,
    context: ErrorContext,
    strategy: ErrorHandlingStrategy
  ): void {
    const errorKey = `${context.serviceName}:${context.operationName}:${context.implementationType}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;

    const logData = {
      message: error.message,
      errorType: this.classifyError(error),
      context: {
        service: context.serviceName,
        operation: context.operationName,
        implementation: context.implementationType,
        timestamp: context.timestamp,
      },
      strategy: {
        willFallback: strategy.shouldFallback,
        willRetry: strategy.shouldRetry,
        maxRetries: strategy.maxRetries,
      },
      metadata: {
        errorCount,
        errorKey,
        stackTrace: error.stack,
      },
    };

    // Log level based on severity
    if (strategy.shouldAlert || errorCount > 5) {
      console.error('[MigrationErrorHandler] CRITICAL:', logData);
    } else if (strategy.shouldFallback || errorCount > 2) {
      console.warn('[MigrationErrorHandler] WARNING:', logData);
    } else {
      console.log('[MigrationErrorHandler] INFO:', logData);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByService: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrors: Array<{ key: string; count: number; lastSeen: Date }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);

    const errorsByService: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    for (const [key, count] of this.errorCounts.entries()) {
      const [service] = key.split(':');
      errorsByService[service] = (errorsByService[service] || 0) + count;
    }

    const recentErrors = Array.from(this.errorCounts.entries())
      .map(([key, count]) => ({
        key,
        count,
        lastSeen: this.lastErrors.get(key) || new Date(),
      }))
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 20);

    return {
      totalErrors,
      errorsByService,
      errorsByType,
      recentErrors,
    };
  }

  /**
   * Reset error tracking (for testing)
   */
  reset(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    this.emit('errors:reset');
  }

  /**
   * Get error threshold recommendations
   */
  getThresholdRecommendations(): {
    shouldDisableOGM: boolean;
    shouldEnableFallback: boolean;
    criticalServices: string[];
    recommendations: string[];
  } {
    const stats = this.getErrorStats();
    const recommendations: string[] = [];
    const criticalServices: string[] = [];

    let shouldDisableOGM = false;
    let shouldEnableFallback = false;

    // Check service-specific error rates
    for (const [service, count] of Object.entries(stats.errorsByService)) {
      if (count > 50) {
        criticalServices.push(service);
        recommendations.push(`Consider disabling OGM for ${service} service`);
        shouldDisableOGM = true;
      } else if (count > 20) {
        recommendations.push(`Monitor ${service} service closely`);
        shouldEnableFallback = true;
      }
    }

    // Check overall error rate
    if (stats.totalErrors > 100) {
      recommendations.push('Consider rolling back OGM migration');
      shouldDisableOGM = true;
    } else if (stats.totalErrors > 50) {
      recommendations.push('Enable fallback mode for all services');
      shouldEnableFallback = true;
    }

    return {
      shouldDisableOGM,
      shouldEnableFallback,
      criticalServices,
      recommendations,
    };
  }
}

// Singleton instance
let errorHandler: MigrationErrorHandler | null = null;

export function getMigrationErrorHandler(): MigrationErrorHandler {
  if (!errorHandler) {
    errorHandler = new MigrationErrorHandler();
  }
  return errorHandler;
}