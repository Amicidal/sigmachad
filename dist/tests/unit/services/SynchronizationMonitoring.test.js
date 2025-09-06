/**
 * Unit tests for SynchronizationMonitoring service
 * Tests monitoring, metrics, and alerting functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SynchronizationMonitoring } from '@/services/SynchronizationMonitoring';
// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T12:00:00Z');
const mockDate2 = new Date('2024-01-01T12:01:00Z');
// Helper to create mock SyncOperation
function createMockSyncOperation(overrides = {}) {
    return {
        id: 'test-operation-1',
        type: 'full',
        status: 'pending',
        startTime: mockDate,
        endTime: mockDate2,
        filesProcessed: 10,
        entitiesCreated: 5,
        entitiesUpdated: 3,
        entitiesDeleted: 1,
        relationshipsCreated: 8,
        relationshipsUpdated: 2,
        relationshipsDeleted: 0,
        errors: [],
        conflicts: [],
        rollbackPoint: 'test-rollback',
        ...overrides
    };
}
// Helper to create mock SyncError
function createMockSyncError(overrides = {}) {
    return {
        file: '/path/to/file.ts',
        type: 'parse',
        message: 'Parse error occurred',
        timestamp: mockDate,
        recoverable: true,
        ...overrides
    };
}
// Helper to create mock SyncConflict
function createMockSyncConflict(overrides = {}) {
    return {
        entityId: 'entity-1',
        type: 'version_conflict',
        description: 'Version conflict detected',
        timestamp: mockDate,
        ...overrides
    };
}
// Helper to create mock Conflict
function createMockConflict(overrides = {}) {
    return {
        id: 'conflict-1',
        type: 'entity_version',
        entityId: 'entity-1',
        description: 'Entity version conflict',
        conflictingValues: {
            current: { version: 1 },
            incoming: { version: 2 }
        },
        timestamp: mockDate,
        resolved: false,
        ...overrides
    };
}
describe('SynchronizationMonitoring', () => {
    let monitoring;
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        monitoring = new SynchronizationMonitoring();
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        monitoring.stopHealthMonitoring();
    });
    describe('initialization', () => {
        it('should initialize with default metrics', () => {
            const metrics = monitoring.getSyncMetrics();
            expect(metrics).toEqual({
                operationsTotal: 0,
                operationsSuccessful: 0,
                operationsFailed: 0,
                averageSyncTime: 0,
                totalEntitiesProcessed: 0,
                totalRelationshipsProcessed: 0,
                errorRate: 0,
                throughput: 0,
            });
        });
        it('should initialize with default performance metrics', () => {
            const metrics = monitoring.getPerformanceMetrics();
            expect(metrics).toEqual({
                averageParseTime: 0,
                averageGraphUpdateTime: 0,
                averageEmbeddingTime: 0,
                memoryUsage: 0,
                cacheHitRate: 0,
                ioWaitTime: 0,
            });
        });
        it('should start health monitoring on initialization', () => {
            const healthSpy = vi.spyOn(monitoring, 'getHealthMetrics');
            // Advance time to trigger health check
            vi.advanceTimersByTime(30000);
            expect(healthSpy).toHaveBeenCalled();
        });
    });
    describe('operation recording', () => {
        it('should record operation start', () => {
            const operation = createMockSyncOperation();
            monitoring.recordOperationStart(operation);
            expect(monitoring.getSyncMetrics().operationsTotal).toBe(1);
            expect(monitoring.getActiveOperations()).toHaveLength(1);
        });
        it('should record operation completion', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const metrics = monitoring.getSyncMetrics();
            expect(metrics.operationsSuccessful).toBe(1);
            expect(metrics.totalEntitiesProcessed).toBe(9); // 5 + 3 + 1
            expect(metrics.totalRelationshipsProcessed).toBe(10); // 8 + 2 + 0
        });
        it('should record operation failure', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            const error = new Error('Test failure');
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, error);
            const metrics = monitoring.getSyncMetrics();
            expect(metrics.operationsFailed).toBe(1);
            expect(metrics.errorRate).toBe(1); // 1/1 = 1
        });
        it('should calculate average sync time correctly', () => {
            const operation1 = createMockSyncOperation({
                id: 'op1',
                status: 'running'
            });
            const operation2 = createMockSyncOperation({
                id: 'op2',
                status: 'running'
            });
            monitoring.recordOperationStart(operation1);
            // Advance time and complete first operation
            vi.advanceTimersByTime(1000);
            monitoring.recordOperationComplete(operation1);
            monitoring.recordOperationStart(operation2);
            // Advance time and complete second operation
            vi.advanceTimersByTime(1000);
            monitoring.recordOperationComplete(operation2);
            const metrics = monitoring.getSyncMetrics();
            // Should be approximately 1500ms (1000 + 2000) / 2
            expect(metrics.averageSyncTime).toBeGreaterThan(1400);
            expect(metrics.averageSyncTime).toBeLessThan(1600);
        });
        it('should calculate throughput correctly', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const metrics = monitoring.getSyncMetrics();
            // Throughput is calculated as: operations in last 5 minutes / 5
            // At completion time, there's 1 operation in the 5-minute window
            // So throughput = 1 / 5 = 0.2 operations per minute
            expect(metrics.throughput).toBe(0.2);
        });
    });
    describe('performance metrics', () => {
        it('should update performance metrics on operation completion', () => {
            const operation = createMockSyncOperation();
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const metrics = monitoring.getPerformanceMetrics();
            expect(metrics.averageParseTime).toBe(150);
            expect(metrics.averageGraphUpdateTime).toBe(200);
            expect(metrics.averageEmbeddingTime).toBe(100);
            expect(metrics.cacheHitRate).toBe(0.85);
            expect(metrics.ioWaitTime).toBe(50);
            expect(metrics.memoryUsage).toBeGreaterThan(0); // Should be actual memory usage
        });
    });
    describe('health monitoring', () => {
        it('should return healthy status when no failures', () => {
            const operation = createMockSyncOperation();
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const health = monitoring.getHealthMetrics();
            expect(health.overallHealth).toBe('healthy');
            expect(health.consecutiveFailures).toBe(0);
        });
        it('should return degraded status when there are failures', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            const error = new Error('Test failure');
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, error);
            const health = monitoring.getHealthMetrics();
            expect(health.overallHealth).toBe('degraded');
        });
        it('should return unhealthy status when consecutive failures exceed threshold', () => {
            // Create 4 failed operations
            for (let i = 0; i < 4; i++) {
                const operation = createMockSyncOperation({
                    id: `fail-op-${i}`,
                    status: 'running'
                });
                const error = new Error(`Test failure ${i}`);
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, error);
            }
            const health = monitoring.getHealthMetrics();
            expect(health.overallHealth).toBe('unhealthy');
            expect(health.consecutiveFailures).toBe(4);
        });
        it('should return correct active operations count', () => {
            const op1 = createMockSyncOperation({ id: 'op1', status: 'running' });
            const op2 = createMockSyncOperation({ id: 'op2', status: 'pending' });
            const op3 = createMockSyncOperation({ id: 'op3', status: 'completed' });
            monitoring.recordOperationStart(op1);
            monitoring.recordOperationStart(op2);
            monitoring.recordOperationStart(op3);
            monitoring.recordOperationComplete(op3);
            expect(monitoring.getActiveOperations()).toHaveLength(2);
        });
    });
    describe('conflict and error recording', () => {
        it('should record sync conflicts', () => {
            const conflict = createMockSyncConflict();
            monitoring.recordConflict(conflict);
            const logs = monitoring.getLogs();
            expect(logs.some(log => log.message.includes('Conflict detected'))).toBe(true);
        });
        it('should record conflicts with different interfaces', () => {
            const conflict = createMockConflict();
            monitoring.recordConflict(conflict);
            const logs = monitoring.getLogs();
            expect(logs.some(log => log.message.includes('Conflict detected'))).toBe(true);
        });
        it('should record sync errors', () => {
            const operationId = 'test-op';
            const error = createMockSyncError();
            monitoring.recordError(operationId, error);
            const logs = monitoring.getLogs();
            expect(logs.some(log => log.message.includes('Sync error occurred'))).toBe(true);
        });
        it('should trigger alerts for non-recoverable errors', () => {
            const operationId = 'test-op';
            const error = createMockSyncError({ recoverable: false });
            monitoring.recordError(operationId, error);
            const alerts = monitoring.getAlerts(true);
            expect(alerts.some(alert => alert.message.includes('Non-recoverable error'))).toBe(true);
        });
    });
    describe('alert system', () => {
        it('should trigger alerts for failed operations', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            const error = new Error('Test failure');
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, error);
            const alerts = monitoring.getAlerts(true);
            expect(alerts.some(alert => alert.message.includes('failed'))).toBe(true);
        });
        it('should resolve alerts', () => {
            const operation = createMockSyncOperation({ status: 'running' });
            const error = new Error('Test failure');
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, error);
            const alerts = monitoring.getAlerts(true);
            const alertId = alerts[0].id;
            const resolved = monitoring.resolveAlert(alertId, 'Issue fixed');
            expect(resolved).toBe(true);
            const activeAlerts = monitoring.getAlerts(true);
            expect(activeAlerts.find(a => a.id === alertId)).toBeUndefined();
        });
        it('should limit alerts to 100 entries', () => {
            // Trigger 101 alerts by recording failed operations
            for (let i = 0; i < 101; i++) {
                const operation = createMockSyncOperation({ id: `fail-${i}`, status: 'running' });
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, new Error(`Failure ${i}`));
            }
            const allAlerts = monitoring.getAlerts(false);
            expect(allAlerts).toHaveLength(100);
        });
    });
    describe('logging', () => {
        it('should log operation events', () => {
            const operation = createMockSyncOperation();
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const logs = monitoring.getLogs();
            expect(logs.some(log => log.message.includes('Operation started'))).toBe(true);
            expect(logs.some(log => log.message.includes('Operation completed'))).toBe(true);
        });
        it('should retrieve logs by operation ID', () => {
            const operation1 = createMockSyncOperation({ id: 'op1' });
            const operation2 = createMockSyncOperation({ id: 'op2' });
            monitoring.recordOperationStart(operation1);
            monitoring.recordOperationStart(operation2);
            const logsOp1 = monitoring.getLogsByOperation('op1');
            const logsOp2 = monitoring.getLogsByOperation('op2');
            expect(logsOp1.every(log => log.operationId === 'op1')).toBe(true);
            expect(logsOp2.every(log => log.operationId === 'op2')).toBe(true);
        });
        it('should limit logs to 1000 entries', () => {
            // Create 1001 log entries by starting operations (each start creates a log entry)
            for (let i = 0; i < 1001; i++) {
                monitoring.recordOperationStart(createMockSyncOperation({ id: `op-${i}` }));
            }
            expect(monitoring.getLogs(1000)).toHaveLength(1000);
        });
    });
    describe('report generation', () => {
        it('should generate comprehensive report', () => {
            const operation = createMockSyncOperation();
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            const report = monitoring.generateReport();
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('performance');
            expect(report).toHaveProperty('health');
            expect(report).toHaveProperty('recentOperations');
            expect(report).toHaveProperty('activeAlerts');
            expect(report.recentOperations).toHaveLength(1);
            expect(report.activeAlerts).toHaveLength(0);
        });
    });
    describe('cleanup functionality', () => {
        it('should cleanup old operations', () => {
            // Set fake timers to control time
            const pastTime = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago
            vi.setSystemTime(pastTime);
            const oldOperation = createMockSyncOperation({
                id: 'old-op',
                status: 'running'
            });
            monitoring.recordOperationStart(oldOperation);
            monitoring.recordOperationComplete(oldOperation);
            // Move to current time
            vi.setSystemTime(Date.now() + 48 * 60 * 60 * 1000);
            const newOperation = createMockSyncOperation({
                id: 'new-op',
                status: 'running'
            });
            monitoring.recordOperationStart(newOperation);
            monitoring.recordOperationComplete(newOperation);
            // Cleanup operations older than 24 hours
            monitoring.cleanup(24 * 60 * 60 * 1000);
            const history = monitoring.getOperationHistory(10);
            expect(history.find(op => op.id === 'old-op')).toBeUndefined();
            expect(history.find(op => op.id === 'new-op')).toBeDefined();
        });
        it('should cleanup old alerts', () => {
            // Create old resolved alert
            const oldAlert = {
                id: 'old-alert',
                type: 'error',
                message: 'Old error',
                timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
                operationId: 'test',
                resolved: true,
                resolution: 'Fixed'
            };
            // Access private alerts array for testing
            const alerts = monitoring.alerts;
            alerts.push(oldAlert);
            monitoring.cleanup(24 * 60 * 60 * 1000);
            expect(monitoring.getAlerts(false).find(a => a.id === 'old-alert')).toBeUndefined();
        });
        it('should cleanup old logs', () => {
            // Create old log entry
            const oldLog = {
                timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
                level: 'info',
                operationId: 'old-op',
                message: 'Old log message',
                data: {}
            };
            // Access private logs array for testing
            const logs = monitoring.logs;
            logs.push(oldLog);
            monitoring.cleanup(24 * 60 * 60 * 1000);
            expect(monitoring.getLogs().find(l => l.operationId === 'old-op')).toBeUndefined();
        });
        it('should preserve unresolved alerts during cleanup', () => {
            const unresolvedAlert = {
                id: 'unresolved-alert',
                type: 'error',
                message: 'Unresolved error',
                timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
                operationId: 'test',
                resolved: false
            };
            // Access private alerts array for testing
            const alerts = monitoring.alerts;
            alerts.push(unresolvedAlert);
            monitoring.cleanup(24 * 60 * 60 * 1000);
            expect(monitoring.getAlerts(false).find(a => a.id === 'unresolved-alert')).toBeDefined();
        });
    });
    describe('operation history', () => {
        it('should return operation history in correct order', () => {
            const operations = [
                createMockSyncOperation({ id: 'op1', startTime: new Date('2024-01-01T10:00:00Z') }),
                createMockSyncOperation({ id: 'op2', startTime: new Date('2024-01-01T11:00:00Z') }),
                createMockSyncOperation({ id: 'op3', startTime: new Date('2024-01-01T12:00:00Z') }),
            ];
            operations.forEach(op => monitoring.recordOperationStart(op));
            const history = monitoring.getOperationHistory();
            expect(history[0].id).toBe('op3'); // Most recent first
            expect(history[1].id).toBe('op2');
            expect(history[2].id).toBe('op1');
        });
        it('should limit operation history', () => {
            for (let i = 0; i < 15; i++) {
                const op = createMockSyncOperation({ id: `op${i}` });
                monitoring.recordOperationStart(op);
            }
            expect(monitoring.getOperationHistory(10)).toHaveLength(10);
        });
    });
    describe('event emission', () => {
        it('should emit events for operation lifecycle', () => {
            const operation = createMockSyncOperation();
            const eventSpy = vi.fn();
            monitoring.on('operationStarted', eventSpy);
            monitoring.on('operationCompleted', eventSpy);
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationComplete(operation);
            expect(eventSpy).toHaveBeenCalledTimes(2);
        });
        it('should emit events for conflicts and alerts', () => {
            const conflict = createMockSyncConflict();
            const conflictSpy = vi.fn();
            const operationFailedSpy = vi.fn();
            monitoring.on('conflictDetected', conflictSpy);
            monitoring.on('operationFailed', operationFailedSpy);
            monitoring.recordConflict(conflict);
            const operation = createMockSyncOperation({ id: 'fail-op', status: 'running' });
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, new Error('Test failure'));
            expect(conflictSpy).toHaveBeenCalledWith(conflict);
            expect(operationFailedSpy).toHaveBeenCalledWith(operation, expect.any(Error));
        });
        it('should emit health check events', () => {
            const healthSpy = vi.fn();
            monitoring.on('healthCheck', healthSpy);
            // Advance time to trigger health check
            vi.advanceTimersByTime(30000);
            expect(healthSpy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=SynchronizationMonitoring.test.js.map