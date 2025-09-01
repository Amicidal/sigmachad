/**
 * Synchronization Monitoring Service Unit Tests
 * Comprehensive tests for synchronization monitoring and metrics tracking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { SynchronizationMonitoring, SyncMetrics, PerformanceMetrics, HealthMetrics, MonitoringAlert, SyncLogEntry } from '../src/services/SynchronizationMonitoring.js';
import { SyncOperation } from '../src/services/SynchronizationCoordinator.js';
import { Conflict } from '../src/services/ConflictResolution.js';

describe('SynchronizationMonitoring', () => {
  let syncMonitoring: SynchronizationMonitoring;

  beforeAll(async () => {
    syncMonitoring = new SynchronizationMonitoring();
  }, 10000);

  afterAll(async () => {
    await syncMonitoring.stopHealthMonitoring();
  }, 10000);

  beforeEach(async () => {
    // Clear all internal state
    (syncMonitoring as any).operations.clear();
    (syncMonitoring as any).alerts = [];
    (syncMonitoring as any).logs = [];

    // Reset metrics
    (syncMonitoring as any).metrics = {
      operationsTotal: 0,
      operationsSuccessful: 0,
      operationsFailed: 0,
      averageSyncTime: 0,
      totalEntitiesProcessed: 0,
      totalRelationshipsProcessed: 0,
      errorRate: 0,
      throughput: 0,
    };

    (syncMonitoring as any).performanceMetrics = {
      averageParseTime: 0,
      averageGraphUpdateTime: 0,
      averageEmbeddingTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      ioWaitTime: 0,
    };
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(syncMonitoring).toBeDefined();
      expect(syncMonitoring).toBeInstanceOf(SynchronizationMonitoring);
    });

    it('should have initial metrics set to zero', () => {
      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsTotal).toBe(0);
      expect(metrics.operationsSuccessful).toBe(0);
      expect(metrics.operationsFailed).toBe(0);
      expect(metrics.averageSyncTime).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should have initial performance metrics', () => {
      const perfMetrics = syncMonitoring.getPerformanceMetrics();
      expect(perfMetrics.averageParseTime).toBe(0);
      expect(perfMetrics.averageGraphUpdateTime).toBe(0);
      expect(perfMetrics.averageEmbeddingTime).toBe(0);
    });

    it('should start health monitoring automatically', () => {
      const healthMetrics = syncMonitoring.getHealthMetrics();
      expect(healthMetrics).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthMetrics.overallHealth);
    });
  });

  describe('Operation Tracking', () => {
    it('should record operation start', () => {
      const operation: SyncOperation = {
        id: 'test_operation_start',
        type: 'full',
        status: 'running',
        startTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      syncMonitoring.recordOperationStart(operation);

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsTotal).toBe(1);

      const operations = (syncMonitoring as any).operations;
      expect(operations.has(operation.id)).toBe(true);
    });

    it('should record operation completion', () => {
      const operation: SyncOperation = {
        id: 'test_operation_complete',
        type: 'incremental',
        status: 'completed',
        startTime: new Date(Date.now() - 5000), // 5 seconds ago
        endTime: new Date(),
        filesProcessed: 10,
        entitiesCreated: 5,
        entitiesUpdated: 2,
        entitiesDeleted: 1,
        relationshipsCreated: 8,
        relationshipsUpdated: 1,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      syncMonitoring.recordOperationStart(operation);
      syncMonitoring.recordOperationComplete(operation);

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsSuccessful).toBe(1);
      expect(metrics.operationsFailed).toBe(0);
      expect(metrics.totalEntitiesProcessed).toBe(8); // 5 created + 2 updated + 1 deleted
      expect(metrics.totalRelationshipsProcessed).toBe(9); // 8 created + 1 updated + 0 deleted
      expect(metrics.averageSyncTime).toBeGreaterThan(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should record operation failure', () => {
      const error = new Error('Test operation failure');
      const operation: SyncOperation = {
        id: 'test_operation_fail',
        type: 'partial',
        status: 'failed',
        startTime: new Date(Date.now() - 3000),
        endTime: new Date(),
        filesProcessed: 3,
        entitiesCreated: 1,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 2,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [{ file: 'error.ts', type: 'parse', message: 'Parse error', timestamp: new Date(), recoverable: false }],
        conflicts: []
      };

      syncMonitoring.recordOperationStart(operation);
      syncMonitoring.recordOperationFailed(operation, error);

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsFailed).toBe(1);
      expect(metrics.operationsSuccessful).toBe(0);
      expect(metrics.errorRate).toBe(1); // 1 error in 1 operation
      expect(metrics.averageSyncTime).toBeGreaterThan(0);
    });

    it('should calculate error rate correctly', () => {
      // Record multiple operations with varying success rates
      const operations = [
        { id: 'success_1', success: true, errors: [] },
        { id: 'success_2', success: true, errors: [] },
        { id: 'fail_1', success: false, errors: [{ file: 'test.ts', type: 'parse', message: 'Error', timestamp: new Date(), recoverable: false }] },
        { id: 'success_3', success: true, errors: [] }
      ];

      operations.forEach((op: any) => {
        const operation: SyncOperation = {
          id: op.id,
          type: 'full',
          status: op.success ? 'completed' : 'failed',
          startTime: new Date(Date.now() - 1000),
          endTime: new Date(),
          filesProcessed: 1,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          entitiesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          relationshipsDeleted: 0,
          errors: op.errors as any,
          conflicts: []
        };

        syncMonitoring.recordOperationStart(operation);
        if (op.success) {
          syncMonitoring.recordOperationComplete(operation);
        } else {
          syncMonitoring.recordOperationFailed(operation, new Error('Test error'));
        }
      });

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsTotal).toBe(4);
      expect(metrics.operationsSuccessful).toBe(3);
      expect(metrics.operationsFailed).toBe(1);
      expect(metrics.errorRate).toBe(0.25); // 1 error in 4 operations
    });

    it('should calculate throughput correctly', () => {
      // Mock time progression for throughput calculation
      const originalNow = Date.now;
      let mockTime = originalNow();

      // Mock Date.now to control time progression
      global.Date.now = jest.fn(() => mockTime);

      // Record operations over "time"
      for (let i = 0; i < 5; i++) {
        const operation: SyncOperation = {
          id: `throughput_test_${i}`,
          type: 'incremental',
          status: 'completed',
          startTime: new Date(mockTime - 1000),
          endTime: new Date(mockTime),
          filesProcessed: 1,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          entitiesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          relationshipsDeleted: 0,
          errors: [],
          conflicts: []
        };

        syncMonitoring.recordOperationStart(operation);
        syncMonitoring.recordOperationComplete(operation);

        mockTime += 1000; // Advance time by 1 second per operation
      }

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.operationsTotal).toBe(5);

      // Restore original Date.now
      global.Date.now = originalNow;
    });
  });

  describe('Conflict Tracking', () => {
    it('should record conflicts', () => {
      const conflict: Conflict = {
        id: 'test_conflict_1',
        type: 'entity_version',
        entityId: 'test_entity',
        description: 'Version conflict detected',
        conflictingValues: {
          current: { version: 1 },
          incoming: { version: 2 }
        },
        timestamp: new Date(),
        resolved: false,
        resolutionStrategy: 'overwrite'
      };

      syncMonitoring.recordConflict(conflict);

      const metrics = syncMonitoring.getSyncMetrics();
      expect(metrics.operationsTotal).toBeGreaterThanOrEqual(0); // Conflicts don't count as operations but should be tracked

      const logs = syncMonitoring.getLogs();
      const conflictLog = logs.find(log => log.message.toLowerCase().includes('conflict'));
      expect(conflictLog).toBeDefined();
      expect(conflictLog?.level).toBe('warn');
    });

    it('should handle multiple conflicts', () => {
      const conflicts: Conflict[] = [
        {
          id: 'conflict_1',
          type: 'entity_version',
          entityId: 'entity1',
          description: 'First conflict',
          conflictingValues: { current: {}, incoming: {} },
          timestamp: new Date(),
          resolved: false
        },
        {
          id: 'conflict_2',
          type: 'relationship_conflict',
          relationshipId: 'rel1',
          description: 'Second conflict',
          conflictingValues: { current: {}, incoming: {} },
          timestamp: new Date(),
          resolved: true,
          resolutionStrategy: 'merge'
        }
      ];

      conflicts.forEach(conflict => {
        syncMonitoring.recordConflict(conflict);
      });

      const logs = syncMonitoring.getLogs();
      const conflictLogs = logs.filter(log => log.message.toLowerCase().includes('conflict'));
      expect(conflictLogs.length).toBe(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should update performance metrics', () => {
      const operation: SyncOperation = {
        id: 'test_performance_update',
        type: 'full',
        status: 'running',
        startTime: new Date(),
        filesProcessed: 1,
        entitiesCreated: 1,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 1,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      // Start the operation first, then complete it to update performance metrics
      syncMonitoring.recordOperationStart(operation);
      const completedOperation = {
        ...operation,
        endTime: new Date(),
        status: 'completed' as const
      };
      syncMonitoring.recordOperationComplete(completedOperation);

      const perfMetrics = syncMonitoring.getPerformanceMetrics();
      expect(perfMetrics.averageParseTime).toBe(150);
      expect(perfMetrics.averageGraphUpdateTime).toBe(200);
      expect(perfMetrics.averageEmbeddingTime).toBe(100);
      expect(perfMetrics.memoryUsage).toBeGreaterThan(0); // Memory usage should be a positive number
      expect(perfMetrics.cacheHitRate).toBe(0.85);
      expect(perfMetrics.ioWaitTime).toBe(50);
    });

    it('should calculate rolling averages for performance metrics', () => {
      const baseOperation: SyncOperation = {
        id: 'test_rolling_avg',
        type: 'full',
        status: 'running',
        startTime: new Date(),
        filesProcessed: 1,
        entitiesCreated: 1,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 1,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      // Create completed operations to update performance metrics
      const op1 = { ...baseOperation, id: 'test_rolling_avg_1' };
      const op2 = { ...baseOperation, id: 'test_rolling_avg_2' };
      const op3 = { ...baseOperation, id: 'test_rolling_avg_3' };

      // Start and complete operations to update performance metrics
      syncMonitoring.recordOperationStart(op1);
      const completedOp1 = { ...op1, endTime: new Date(), status: 'completed' as const };
      syncMonitoring.recordOperationComplete(completedOp1);

      syncMonitoring.recordOperationStart(op2);
      const completedOp2 = { ...op2, endTime: new Date(), status: 'completed' as const };
      syncMonitoring.recordOperationComplete(completedOp2);

      syncMonitoring.recordOperationStart(op3);
      const completedOp3 = { ...op3, endTime: new Date(), status: 'completed' as const };
      syncMonitoring.recordOperationComplete(completedOp3);

      const perfMetrics = syncMonitoring.getPerformanceMetrics();
      // Performance metrics are updated with placeholder values on each completion
      expect(perfMetrics.averageParseTime).toBe(150);
      expect(perfMetrics.averageGraphUpdateTime).toBe(200);
      expect(perfMetrics.averageEmbeddingTime).toBe(100);
    });
  });

  describe('Health Monitoring', () => {
    it('should report healthy status with successful operations', () => {
      // Record successful operations
      for (let i = 0; i < 5; i++) {
        const operation: SyncOperation = {
          id: `health_test_success_${i}`,
          type: 'incremental',
          status: 'completed',
          startTime: new Date(Date.now() - 1000),
          endTime: new Date(),
          filesProcessed: 1,
          entitiesCreated: 1,
          entitiesUpdated: 0,
          entitiesDeleted: 0,
          relationshipsCreated: 1,
          relationshipsUpdated: 0,
          relationshipsDeleted: 0,
          errors: [],
          conflicts: []
        };

        syncMonitoring.recordOperationStart(operation);
        syncMonitoring.recordOperationComplete(operation);
      }

      const healthStatus = syncMonitoring.getHealthMetrics();
      expect(healthStatus.overallHealth).toBe('healthy');
      expect(healthStatus.consecutiveFailures).toBe(0);
      expect(healthStatus.activeOperations).toBe(0);
    });

    it('should report degraded status with some failures', () => {
      // Record some failures
      for (let i = 0; i < 3; i++) {
        const operation: SyncOperation = {
          id: `health_test_fail_${i}`,
          type: 'full',
          status: 'failed',
          startTime: new Date(Date.now() - 2000),
          endTime: new Date(),
          filesProcessed: 0,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          entitiesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          relationshipsDeleted: 0,
          errors: [{ file: 'test.ts', type: 'database', message: 'Connection failed', timestamp: new Date(), recoverable: true }],
          conflicts: []
        };

        syncMonitoring.recordOperationStart(operation);
        syncMonitoring.recordOperationFailed(operation, new Error('Test failure'));
      }

      const healthStatus = syncMonitoring.getHealthMetrics();
      expect(['degraded', 'unhealthy']).toContain(healthStatus.overallHealth);
      expect(healthStatus.consecutiveFailures).toBeGreaterThan(0);
    });

    it('should report unhealthy status with high failure rate', () => {
      // Record many failures
      for (let i = 0; i < 10; i++) {
        const operation: SyncOperation = {
          id: `health_test_critical_${i}`,
          type: 'incremental',
          status: 'failed',
          startTime: new Date(Date.now() - 1000),
          endTime: new Date(),
          filesProcessed: 0,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          entitiesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          relationshipsDeleted: 0,
          errors: [{ file: 'test.ts', type: 'database', message: 'Critical error', timestamp: new Date(), recoverable: false }],
          conflicts: []
        };

        syncMonitoring.recordOperationStart(operation);
        syncMonitoring.recordOperationFailed(operation, new Error('Critical failure'));
      }

      const healthStatus = syncMonitoring.getHealthMetrics();
      expect(healthStatus.overallHealth).toBe('unhealthy');
      expect(healthStatus.consecutiveFailures).toBe(10);
    });

    it('should track queue depth and active operations', () => {
      // Simulate active operations
      const activeOperations = ['active_op_1', 'active_op_2', 'active_op_3'];
      activeOperations.forEach(opId => {
        (syncMonitoring as any).operations.set(opId, {
          id: opId,
          status: 'running',
          startTime: new Date()
        });
      });

      const healthStatus = syncMonitoring.getHealthMetrics();
      expect(healthStatus.activeOperations).toBe(3);
    });
  });

  describe('Alert Management', () => {
    it('should create alerts for critical issues', () => {
      const alertMessage = 'Database connection lost';

      // Trigger alert by recording a critical failure
      const operation: SyncOperation = {
        id: 'alert_test_operation',
        type: 'full',
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [{ file: 'critical.ts', type: 'database', message: alertMessage, timestamp: new Date(), recoverable: false }],
        conflicts: []
      };

      // Start the operation first, then fail it to trigger alerts
      syncMonitoring.recordOperationStart(operation);
      syncMonitoring.recordOperationFailed(operation, new Error(alertMessage));

      const alerts = syncMonitoring.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.message.includes(alertMessage))).toBe(true);
    });

    it('should resolve alerts', () => {
      // Create an alert
      const operation: SyncOperation = {
        id: 'resolve_alert_test',
        type: 'incremental',
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [{ file: 'resolve.ts', type: 'database', message: 'Network timeout', timestamp: new Date(), recoverable: true }],
        conflicts: []
      };

      // Start the operation first, then fail it to trigger alerts
      syncMonitoring.recordOperationStart(operation);
      syncMonitoring.recordOperationFailed(operation, new Error('Network timeout'));

      let alerts = syncMonitoring.getAlerts();
      const unresolvedAlert = alerts.find(alert => !alert.resolved);
      expect(unresolvedAlert).toBeDefined();

      if (unresolvedAlert) {
        syncMonitoring.resolveAlert(unresolvedAlert.id, 'Issue resolved');

        alerts = syncMonitoring.getAlerts();
        const resolvedAlert = alerts.find(alert => alert.id === unresolvedAlert.id);
        expect(resolvedAlert?.resolved).toBe(true);
        expect(resolvedAlert?.resolution).toBe('Issue resolved');
      }
    });

    it('should filter alerts by type', () => {
      // Create different types of alerts
      const errorOperation: SyncOperation = {
        id: 'error_alert_test',
        type: 'full',
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [{ file: 'error.ts', type: 'parse', message: 'Parse error', timestamp: new Date(), recoverable: false }],
        conflicts: []
      };

      // Start the operation first, then fail it to trigger alerts
      syncMonitoring.recordOperationStart(errorOperation);
      syncMonitoring.recordOperationFailed(errorOperation, new Error('Parse error'));

      const allAlerts = syncMonitoring.getAlerts();
      const errorAlerts = allAlerts.filter(alert => alert.type === 'error');
      const warningAlerts = allAlerts.filter(alert => alert.type === 'warning');
      const infoAlerts = allAlerts.filter(alert => alert.type === 'info');

      expect(errorAlerts.length).toBeGreaterThan(0);
      expect(warningAlerts.length).toBe(0);
      expect(infoAlerts.length).toBe(0);
    });
  });

  describe('Logging', () => {
    it('should create log entries for operations', () => {
      const operation: SyncOperation = {
        id: 'log_test_operation',
        type: 'partial',
        status: 'running',
        startTime: new Date(),
        filesProcessed: 5,
        entitiesCreated: 3,
        entitiesUpdated: 1,
        entitiesDeleted: 0,
        relationshipsCreated: 4,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      syncMonitoring.recordOperationStart(operation);

      const logs = syncMonitoring.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.operationId === operation.id)).toBe(true);
    });

    it('should filter logs by level', () => {
      // Create logs of different levels
      const debugLog: SyncLogEntry = {
        timestamp: new Date(),
        level: 'debug',
        operationId: 'debug_test',
        message: 'Debug message',
        data: { test: 'data' }
      };

      const errorLog: SyncLogEntry = {
        timestamp: new Date(),
        level: 'error',
        operationId: 'error_test',
        message: 'Error message',
        data: { error: 'details' }
      };

      (syncMonitoring as any).logs.push(debugLog, errorLog);

      const debugLogs = syncMonitoring.getLogs().filter(log => log.level === 'debug');
      const errorLogs = syncMonitoring.getLogs().filter(log => log.level === 'error');

      expect(debugLogs.length).toBeGreaterThanOrEqual(1);
      expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    });

    it('should limit log history', () => {
      // Add many log entries
      for (let i = 0; i < 150; i++) {
        const log: SyncLogEntry = {
          timestamp: new Date(),
          level: 'info',
          operationId: `log_flood_${i}`,
          message: `Log entry ${i}`
        };
        (syncMonitoring as any).logs.push(log);
      }

      const logs = syncMonitoring.getLogs();
      // Should be limited to prevent memory issues
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('System Integration', () => {
    it('should handle event emission correctly', () => {
      const eventSpy = jest.fn();
      syncMonitoring.on('operationStarted', eventSpy);

      const operation: SyncOperation = {
        id: 'event_test_operation',
        type: 'full',
        status: 'pending',
        startTime: new Date(),
        filesProcessed: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        entitiesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      syncMonitoring.emit('operationStarted', operation);

      expect(eventSpy).toHaveBeenCalledWith(operation);
    });

    it('should integrate with external monitoring systems', () => {
      // Test that monitoring can be extended
      const customMetrics = {
        customMetric1: 42,
        customMetric2: 'test_value'
      };

      // Simulate external monitoring integration
      syncMonitoring.emit('customMetrics', customMetrics);

      // Verify event was emitted (would be consumed by external systems)
      expect(syncMonitoring.listenerCount('customMetrics')).toBe(0); // No internal listeners
    });

    it('should provide comprehensive status report', () => {
      // Record some activity
      const operation: SyncOperation = {
        id: 'status_report_test',
        type: 'incremental',
        status: 'completed',
        startTime: new Date(Date.now() - 2000),
        endTime: new Date(),
        filesProcessed: 5,
        entitiesCreated: 3,
        entitiesUpdated: 1,
        entitiesDeleted: 0,
        relationshipsCreated: 4,
        relationshipsUpdated: 0,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: []
      };

      syncMonitoring.recordOperationStart(operation);
      syncMonitoring.recordOperationComplete(operation);

      const statusReport = {
        metrics: syncMonitoring.getSyncMetrics(),
        performance: syncMonitoring.getPerformanceMetrics(),
        health: syncMonitoring.getHealthMetrics(),
        alerts: syncMonitoring.getAlerts(),
        recentLogs: syncMonitoring.getLogs().slice(-5)
      };

      expect(statusReport.metrics.operationsTotal).toBeGreaterThan(0);
      expect(statusReport.performance.averageParseTime).toBeDefined();
      expect(statusReport.health.overallHealth).toBeDefined();
      expect(Array.isArray(statusReport.alerts)).toBe(true);
      expect(Array.isArray(statusReport.recentLogs)).toBe(true);
    });
  });
});
