/**
 * Integration layer for connecting rollback system with SessionManager, audit logging, and other services
 */

import { EventEmitter } from 'events';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackResult,
  RollbackStatus,
  RollbackLogEntry,
  RollbackMetrics,
  RollbackError,
} from './RollbackTypes.js';
import { RollbackManager } from './RollbackManager.js';

/**
 * Session manager interface
 */
interface SessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<SessionData>;
  updateSessionData(
    sessionId: string,
    data: Partial<SessionData>
  ): Promise<void>;
  createSessionCheckpoint(
    sessionId: string,
    metadata: Record<string, any>
  ): Promise<string>;
  restoreSessionCheckpoint(
    sessionId: string,
    checkpointId: string
  ): Promise<void>;
  on(
    event: 'session:started' | 'session:ended' | 'checkpoint:created',
    listener: (...args: any[]) => void
  ): void;
}

interface SessionData {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
  rollbackPoints: string[];
  checkpoints: SessionCheckpoint[];
}

interface SessionCheckpoint {
  id: string;
  sessionId: string;
  timestamp: Date;
  rollbackPointId?: string;
  description: string;
  metadata: Record<string, any>;
}

/**
 * Audit logger interface
 */
interface AuditLogger {
  logRollbackCreation(
    rollbackPoint: RollbackPoint,
    context: AuditContext
  ): Promise<void>;
  logRollbackExecution(
    operation: RollbackOperation,
    result: RollbackResult,
    context: AuditContext
  ): Promise<void>;
  logConflictResolution(
    conflict: any,
    resolution: any,
    context: AuditContext
  ): Promise<void>;
  logSystemEvent(event: SystemEvent, context: AuditContext): Promise<void>;
  getAuditTrail(filters: AuditFilters): Promise<AuditEntry[]>;
}

interface AuditContext {
  sessionId?: string;
  userId?: string;
  operationId?: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface SystemEvent {
  type:
    | 'rollback_created'
    | 'rollback_executed'
    | 'rollback_failed'
    | 'cleanup_performed'
    | 'conflict_detected';
  severity: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  data?: Record<string, any>;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  operationId?: string;
  eventType: string;
  severity: string;
  message: string;
  data?: Record<string, any>;
  source: string;
}

interface AuditFilters {
  sessionId?: string;
  userId?: string;
  eventType?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Metrics collector interface
 */
interface MetricsCollector {
  recordRollbackCreation(rollbackPoint: RollbackPoint, duration: number): void;
  recordRollbackExecution(
    operation: RollbackOperation,
    result: RollbackResult,
    duration: number
  ): void;
  recordConflictResolution(
    conflicts: number,
    resolved: number,
    duration: number
  ): void;
  recordSystemMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
}

/**
 * Notification service interface
 */
interface NotificationService {
  notifyRollbackCreated(
    rollbackPoint: RollbackPoint,
    context: NotificationContext
  ): Promise<void>;
  notifyRollbackExecuted(
    operation: RollbackOperation,
    result: RollbackResult,
    context: NotificationContext
  ): Promise<void>;
  notifyRollbackFailed(
    operation: RollbackOperation,
    error: Error,
    context: NotificationContext
  ): Promise<void>;
  notifyCriticalConflict(
    conflicts: any[],
    context: NotificationContext
  ): Promise<void>;
}

interface NotificationContext {
  sessionId?: string;
  userId?: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  metadata?: Record<string, any>;
}

/**
 * Rollback integration configuration
 */
interface RollbackIntegrationConfig {
  sessionIntegration: {
    enabled: boolean;
    autoCreateCheckpoints: boolean;
    checkpointThreshold: number; // Number of rollback points before creating checkpoint
    sessionRollbackLimit: number; // Max rollback points per session
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'all';
    retentionDays: number;
    sensitiveDataMask: boolean;
  };
  metrics: {
    enabled: boolean;
    collectInterval: number;
    customMetrics: boolean;
  };
  notifications: {
    enabled: boolean;
    rollbackCreated: boolean;
    rollbackFailed: boolean;
    criticalConflicts: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  };
}

/**
 * Enhanced rollback manager with integrated services
 */
export class IntegratedRollbackManager extends EventEmitter {
  private rollbackManager: RollbackManager;
  private sessionManager?: SessionManager;
  private auditLogger?: AuditLogger;
  private metricsCollector?: MetricsCollector;
  private notificationService?: NotificationService;

  constructor(
    rollbackManager: RollbackManager,
    private config: RollbackIntegrationConfig
  ) {
    super();
    this.rollbackManager = rollbackManager;
    this.setupEventHandlers();
  }

  /**
   * Initialize integrations with external services
   */
  setIntegrations(integrations: {
    sessionManager?: SessionManager;
    auditLogger?: AuditLogger;
    metricsCollector?: MetricsCollector;
    notificationService?: NotificationService;
  }): void {
    this.sessionManager = integrations.sessionManager;
    this.auditLogger = integrations.auditLogger;
    this.metricsCollector = integrations.metricsCollector;
    this.notificationService = integrations.notificationService;

    this.setupSessionIntegration();
  }

  /**
   * Create rollback point with session and audit integration
   */
  async createRollbackPoint(
    name: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<RollbackPoint> {
    const startTime = Date.now();

    try {
      // Create base rollback point
      const rollbackPoint = await this.rollbackManager.createRollbackPoint(
        name,
        description,
        metadata
      );

      // Session integration
      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.integrateWithSession(rollbackPoint);
      }

      // Audit logging
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logRollbackCreation(rollbackPoint, {
          sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
          source: 'rollback-manager',
          timestamp: new Date(),
        });
      }

      // Metrics collection
      if (this.config.metrics.enabled && this.metricsCollector) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordRollbackCreation(rollbackPoint, duration);
        this.metricsCollector.incrementCounter('rollback_points_created', {
          session_id: rollbackPoint.sessionId || 'none', // Compatibility prop
        });
      }

      // Notifications
      if (
        this.config.notifications.enabled &&
        this.config.notifications.rollbackCreated &&
        this.notificationService
      ) {
        await this.notificationService.notifyRollbackCreated(rollbackPoint, {
          sessionId: rollbackPoint.sessionId,
          severity: 'info',
          channels: this.config.notifications.channels,
        });
      }

      this.emit('rollback-point-created', rollbackPoint);
      return rollbackPoint;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log error
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent(
          {
            type: 'rollback_created',
            severity: 'error',
            message: `Failed to create rollback point: ${errorMessage}`,
            data: { name, description, metadata },
          },
          {
            sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
            source: 'rollback-manager',
            timestamp: new Date(),
          }
        );
      }

      throw error;
    }
  }

  /**
   * Execute rollback with full integration support
   */
  async rollback(
    rollbackPointId: string,
    options?: Parameters<RollbackManager['rollback']>[1]
  ): Promise<RollbackOperation> {
    const startTime = Date.now();

    try {
      // Get rollback point for context
      const rollbackPoint = await this.rollbackManager.getRollbackPoint(
        rollbackPointId
      );
      if (!rollbackPoint) {
        throw new RollbackError(
          'Rollback point not found',
          'ROLLBACK_NOT_FOUND',
          { rollbackPointId }
        );
      }

      // Create operation context
      const operationContext = await this.createOperationContext(rollbackPoint);

      // Execute rollback
      const operation = await this.rollbackManager.rollback(
        rollbackPointId,
        options
      );

      // Wait for completion and get result
      const result = await this.waitForCompletion(operation.id);

      // Session integration - update session state
      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.updateSessionAfterRollback(rollbackPoint, operation, result);
      }

      // Audit logging
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logRollbackExecution(
          operation,
          result,
          operationContext
        );
      }

      // Metrics collection
      if (this.config.metrics.enabled && this.metricsCollector) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordRollbackExecution(
          operation,
          result,
          duration
        );

        // Record detailed metrics
        if (result.success) {
          this.metricsCollector.incrementCounter('rollback_successes');
          this.metricsCollector.recordSystemMetric(
            'rollback_entities_processed',
            result.rolledBackEntities || 0
          );
          this.metricsCollector.recordSystemMetric(
            'rollback_relationships_processed',
            result.rolledBackRelationships || 0
          );
        } else {
          this.metricsCollector.incrementCounter('rollback_failures');
          this.metricsCollector.recordSystemMetric(
            'rollback_errors',
            result.errors?.length || 0
          );
        }
      }

      // Notifications
      if (this.config.notifications.enabled && this.notificationService) {
        if (result.success) {
          await this.notificationService.notifyRollbackExecuted(
            operation,
            result,
            {
              sessionId: rollbackPoint.sessionId,
              severity: 'info',
              channels: this.config.notifications.channels,
            }
          );
        } else if (this.config.notifications.rollbackFailed) {
          await this.notificationService.notifyRollbackFailed(
            operation,
            new Error(result.errors?.[0]?.error || 'Unknown error'),
            {
              sessionId: rollbackPoint.sessionId,
              severity: 'error',
              channels: this.config.notifications.channels,
            }
          );
        }
      }

      this.emit('rollback-executed', { operation, result });
      return operation;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log error
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent(
          {
            type: 'rollback_failed',
            severity: 'error',
            message: `Rollback execution failed: ${errorMessage}`,
            data: { rollbackPointId, options },
          },
          {
            sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
            source: 'rollback-manager',
            timestamp: new Date(),
          }
        );
      }

      // Error notification
      if (
        this.config.notifications.enabled &&
        this.config.notifications.rollbackFailed &&
        this.notificationService
      ) {
        const rollbackPoint = await this.rollbackManager.getRollbackPoint(
          rollbackPointId
        );
        await this.notificationService.notifyRollbackFailed(
          {
            id: 'unknown',
            rollbackPointId,
            status: RollbackStatus.FAILED,
          } as any,
          error instanceof Error ? error : new Error(errorMessage),
          {
            sessionId: rollbackPoint?.sessionId,
            severity: 'error',
            channels: this.config.notifications.channels,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Get enhanced rollback metrics with session data
   */
  async getEnhancedMetrics(): Promise<
    RollbackMetrics & {
      sessionMetrics?: {
        totalSessions: number;
        activeSessionsWithRollbacks: number;
        averageRollbacksPerSession: number;
        sessionsWithCheckpoints: number;
      };
      auditMetrics?: {
        totalAuditEntries: number;
        errorRate: number;
        lastAuditEntry?: Date;
      };
    }
  > {
    const baseMetrics = this.rollbackManager.getMetrics();
    const enhancedMetrics: typeof baseMetrics & {
      sessionMetrics?: any;
      auditMetrics?: any;
    } = { ...baseMetrics };

    // Add session metrics
    if (this.config.sessionIntegration.enabled && this.sessionManager) {
      enhancedMetrics.sessionMetrics = await this.collectSessionMetrics();
    }

    // Add audit metrics
    if (this.config.auditLogging.enabled && this.auditLogger) {
      enhancedMetrics.auditMetrics = await this.collectAuditMetrics();
    }

    return enhancedMetrics;
  }

  /**
   * Get rollback audit trail
   */
  async getAuditTrail(filters: AuditFilters = {}): Promise<AuditEntry[]> {
    if (!this.auditLogger) {
      throw new RollbackError(
        'Audit logger not configured',
        'AUDIT_NOT_CONFIGURED'
      );
    }

    return await this.auditLogger.getAuditTrail(filters);
  }

  /**
   * Get session rollback history
   */
  async getSessionRollbackHistory(sessionId: string): Promise<{
    rollbackPoints: RollbackPoint[];
    checkpoints: SessionCheckpoint[];
    operations: RollbackOperation[];
  }> {
    if (!this.sessionManager) {
      throw new RollbackError(
        'Session manager not configured',
        'SESSION_MANAGER_NOT_CONFIGURED'
      );
    }

    const sessionData = await this.sessionManager.getSessionData(sessionId);
    const rollbackPoints = (
      await Promise.all(
        sessionData.rollbackPoints.map((id) =>
          this.rollbackManager.getRollbackPoint(id)
        )
      )
    ).filter((point): point is RollbackPoint => point !== null);

    // Get operations related to these rollback points
    const operations: RollbackOperation[] = [];
    for (const point of rollbackPoints) {
      // This would need to be implemented in RollbackManager
      // const pointOperations = await this.rollbackManager.getOperationsForRollbackPoint(point.id);
      // operations.push(...pointOperations);
    }

    return {
      rollbackPoints,
      checkpoints: sessionData.checkpoints,
      operations,
    };
  }

  /**
   * Setup event handlers for the base rollback manager
   */
  private setupEventHandlers(): void {
    this.rollbackManager.on('rollback-point-created', async (rollbackPoint) => {
      // Handle cleanup based on session limits
      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.enforceSessionLimits(rollbackPoint.sessionId);
      }
    });

    this.rollbackManager.on('rollback-started', async (operation) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent(
          {
            type: 'rollback_executed',
            severity: 'info',
            message: `Rollback operation started: ${operation.id}`,
            data: {
              operationId: operation.id,
              targetRollbackPoint: operation.targetRollbackPointId,
            },
          },
          {
            operationId: operation.id,
            source: 'rollback-manager',
            timestamp: new Date(),
          }
        );
      }
    });

    this.rollbackManager.on('rollback-failed', async (operation, error) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent(
          {
            type: 'rollback_failed',
            severity: 'error',
            message: `Rollback operation failed: ${error.message}`,
            data: { operationId: operation.id, error: error.message },
          },
          {
            operationId: operation.id,
            source: 'rollback-manager',
            timestamp: new Date(),
          }
        );
      }
    });

    this.rollbackManager.on('conflict-detected', async (conflict) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logConflictResolution(conflict, null, {
          source: 'rollback-manager',
          timestamp: new Date(),
        });
      }

      // Notify on critical conflicts
      if (
        this.config.notifications.enabled &&
        this.config.notifications.criticalConflicts &&
        this.notificationService
      ) {
        if (
          conflict.type === 'DEPENDENCY_CONFLICT' ||
          conflict.severity === 'critical'
        ) {
          await this.notificationService.notifyCriticalConflict([conflict], {
            severity: 'critical',
            channels: this.config.notifications.channels,
          });
        }
      }
    });
  }

  /**
   * Setup session manager integration
   */
  private setupSessionIntegration(): void {
    if (!this.sessionManager || !this.config.sessionIntegration.enabled) return;

    // Listen for session events
    this.sessionManager.on('session:started', async (sessionData) => {
      // Initialize session rollback tracking
      await this.sessionManager!.updateSessionData(sessionData.id, {
        rollbackPoints: [],
        checkpoints: [],
      });
    });

    this.sessionManager.on('session:ended', async (sessionId) => {
      // Cleanup session-specific rollback points if needed
      await this.cleanupSessionRollbacks(sessionId);
    });

    this.sessionManager.on('checkpoint:created', async (checkpoint) => {
      // Link checkpoint to rollback points if configured
      if (this.config.sessionIntegration.autoCreateCheckpoints) {
        await this.linkCheckpointToRollback(checkpoint);
      }
    });
  }

  private async integrateWithSession(
    rollbackPoint: RollbackPoint
  ): Promise<void> {
    if (!this.sessionManager || !rollbackPoint.sessionId) return;

    try {
      // Add rollback point to session
      const sessionData = await this.sessionManager.getSessionData(
        rollbackPoint.sessionId
      );
      const updatedRollbackPoints = [
        ...sessionData.rollbackPoints,
        rollbackPoint.id,
      ];

      await this.sessionManager.updateSessionData(rollbackPoint.sessionId, {
        rollbackPoints: updatedRollbackPoints,
      });

      // Create checkpoint if threshold reached
      if (this.config.sessionIntegration.autoCreateCheckpoints) {
        if (
          updatedRollbackPoints.length %
            this.config.sessionIntegration.checkpointThreshold ===
          0
        ) {
          await this.sessionManager.createSessionCheckpoint(
            rollbackPoint.sessionId,
            {
              rollbackPointId: rollbackPoint.id,
              reason: 'automatic',
              rollbackPointCount: updatedRollbackPoints.length,
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to integrate rollback point with session:', error);
      // Don't throw - session integration failure shouldn't break rollback creation
    }
  }

  private async createOperationContext(
    rollbackPoint: RollbackPoint
  ): Promise<AuditContext> {
    return {
      sessionId: rollbackPoint.sessionId || undefined,
      operationId: `rollback_${rollbackPoint.id}_${Date.now()}`,
      source: 'rollback-manager',
      timestamp: new Date(),
      metadata: {
        rollbackPointId: rollbackPoint.id,
        rollbackPointName: rollbackPoint.name,
        rollbackPointTimestamp: rollbackPoint.timestamp,
      },
    };
  }

  private async waitForCompletion(
    operationId: string
  ): Promise<RollbackResult> {
    // Poll for operation completion
    let attempts = 0;
    const maxAttempts = 300; // 5 minutes with 1-second intervals

    while (attempts < maxAttempts) {
      const operation = await this.rollbackManager.getRollbackOperation(
        operationId
      );

      if (!operation) {
        throw new RollbackError('Operation not found', 'OPERATION_NOT_FOUND', {
          operationId,
        });
      }

      if (
        operation.status === RollbackStatus.COMPLETED ||
        operation.status === RollbackStatus.FAILED
      ) {
        // Convert operation to result format (simplified)
        return {
          success: operation.status === RollbackStatus.COMPLETED,
          rolledBackEntities: 0, // Would need to be tracked in operation
          rolledBackRelationships: 0,
          // Map operation-level error into structured RollbackIssue
          errors: operation.error
            ? [
                {
                  type: 'entity',
                  id: operation.id,
                  action: 'rollback',
                  error: operation.error,
                  recoverable: false,
                },
              ]
            : [],
          partialSuccess:
            operation.status === RollbackStatus.COMPLETED && !!operation.error,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new RollbackError('Operation timeout', 'OPERATION_TIMEOUT', {
      operationId,
    });
  }

  private async updateSessionAfterRollback(
    rollbackPoint: RollbackPoint,
    operation: RollbackOperation,
    result: RollbackResult
  ): Promise<void> {
    if (!this.sessionManager || !rollbackPoint.sessionId) return;

    try {
      // Update session metadata with rollback result
      await this.sessionManager.updateSessionData(rollbackPoint.sessionId, {
        metadata: {
          lastRollback: {
            rollbackPointId: rollbackPoint.id,
            operationId: operation.id,
            timestamp: new Date(),
            success: result.success,
            entitiesProcessed: result.rolledBackEntities,
            relationshipsProcessed: result.rolledBackRelationships,
          },
        },
      });
    } catch (error) {
      console.warn('Failed to update session after rollback:', error);
    }
  }

  private async enforceSessionLimits(sessionId?: string): Promise<void> {
    if (!sessionId || !this.sessionManager) return;

    try {
      const sessionData = await this.sessionManager.getSessionData(sessionId);

      if (
        sessionData.rollbackPoints.length >
        this.config.sessionIntegration.sessionRollbackLimit
      ) {
        // Remove oldest rollback points
        const excess =
          sessionData.rollbackPoints.length -
          this.config.sessionIntegration.sessionRollbackLimit;
        const toRemove = sessionData.rollbackPoints.slice(0, excess);

        // Delete the rollback points
        for (const rollbackPointId of toRemove) {
          await this.rollbackManager.deleteRollbackPoint(rollbackPointId);
        }

        // Update session
        await this.sessionManager.updateSessionData(sessionId, {
          rollbackPoints: sessionData.rollbackPoints.slice(excess),
        });
      }
    } catch (error) {
      console.warn('Failed to enforce session rollback limits:', error);
    }
  }

  private async cleanupSessionRollbacks(sessionId: string): Promise<void> {
    // Implementation would clean up session-specific rollback data
    console.log(`Cleaning up rollback data for session: ${sessionId}`);
  }

  private async linkCheckpointToRollback(
    checkpoint: SessionCheckpoint
  ): Promise<void> {
    // Implementation would link session checkpoint to rollback point
    console.log(`Linking checkpoint ${checkpoint.id} to rollback data`);
  }

  private async collectSessionMetrics() {
    // Implementation would collect session-related rollback metrics
    return {
      totalSessions: 0,
      activeSessionsWithRollbacks: 0,
      averageRollbacksPerSession: 0,
      sessionsWithCheckpoints: 0,
    };
  }

  private async collectAuditMetrics() {
    // Implementation would collect audit-related metrics
    return {
      totalAuditEntries: 0,
      errorRate: 0,
      lastAuditEntry: new Date(),
    };
  }
}

// Export types for external use
export type {
  SessionManager,
  SessionData,
  SessionCheckpoint,
  AuditLogger,
  AuditContext,
  AuditEntry,
  AuditFilters,
  MetricsCollector,
  NotificationService,
  NotificationContext,
  RollbackIntegrationConfig,
  SystemEvent,
};
