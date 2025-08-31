/**
 * Synchronization Monitoring Service
 * Comprehensive tracking and monitoring of graph synchronization operations
 */
import { EventEmitter } from 'events';
export class SynchronizationMonitoring extends EventEmitter {
    operations = new Map();
    metrics;
    performanceMetrics;
    alerts = [];
    logs = [];
    healthCheckInterval;
    constructor() {
        super();
        this.metrics = {
            operationsTotal: 0,
            operationsSuccessful: 0,
            operationsFailed: 0,
            averageSyncTime: 0,
            totalEntitiesProcessed: 0,
            totalRelationshipsProcessed: 0,
            errorRate: 0,
            throughput: 0,
        };
        this.performanceMetrics = {
            averageParseTime: 0,
            averageGraphUpdateTime: 0,
            averageEmbeddingTime: 0,
            memoryUsage: 0,
            cacheHitRate: 0,
            ioWaitTime: 0,
        };
        this.setupEventHandlers();
        this.startHealthMonitoring();
    }
    setupEventHandlers() {
        this.on('operationStarted', this.handleOperationStarted.bind(this));
        this.on('operationCompleted', this.handleOperationCompleted.bind(this));
        this.on('operationFailed', this.handleOperationFailed.bind(this));
        this.on('conflictDetected', this.handleConflictDetected.bind(this));
        this.on('alertTriggered', this.handleAlertTriggered.bind(this));
    }
    startHealthMonitoring() {
        // Health check every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
        }
    }
    recordOperationStart(operation) {
        this.operations.set(operation.id, operation);
        this.metrics.operationsTotal++;
        this.log('info', operation.id, 'Operation started', {
            type: operation.type,
            filesToProcess: operation.filesProcessed,
        });
        this.emit('operationStarted', operation);
    }
    recordOperationComplete(operation) {
        const op = this.operations.get(operation.id);
        if (op) {
            op.status = 'completed';
            op.endTime = new Date();
            this.metrics.operationsSuccessful++;
            // Update metrics
            this.updateSyncMetrics(operation);
            this.updatePerformanceMetrics(operation);
            this.log('info', operation.id, 'Operation completed successfully', {
                duration: op.endTime.getTime() - op.startTime.getTime(),
                entitiesProcessed: operation.entitiesCreated + operation.entitiesUpdated,
                relationshipsProcessed: operation.relationshipsCreated + operation.relationshipsUpdated,
                errors: operation.errors.length,
            });
            this.emit('operationCompleted', operation);
        }
    }
    recordOperationFailed(operation, error) {
        const op = this.operations.get(operation.id);
        if (op) {
            op.status = 'failed';
            op.endTime = new Date();
            this.metrics.operationsFailed++;
            this.updateSyncMetrics(operation);
            this.log('error', operation.id, 'Operation failed', {
                error: error.message,
                duration: op.endTime.getTime() - op.startTime.getTime(),
                errors: operation.errors.length,
            });
            // Trigger alert for failed operations
            this.triggerAlert({
                type: 'error',
                message: `Sync operation ${operation.id} failed: ${error.message}`,
                operationId: operation.id,
            });
            this.emit('operationFailed', operation, error);
        }
    }
    recordConflict(conflict) {
        this.log('warn', conflict.id, 'Conflict detected', {
            type: 'sync_conflict',
            entityId: 'entityId' in conflict ? conflict.entityId : undefined,
            description: conflict.description,
        });
        this.emit('conflictDetected', conflict);
    }
    recordError(operationId, error) {
        this.log('error', operationId, 'Sync error occurred', {
            file: error.file,
            type: error.type,
            message: error.message,
            recoverable: error.recoverable,
        });
        // Trigger alert for non-recoverable errors
        if (!error.recoverable) {
            this.triggerAlert({
                type: 'error',
                message: `Non-recoverable error in ${error.file}: ${error.message}`,
                operationId,
            });
        }
    }
    updateSyncMetrics(operation) {
        const duration = operation.endTime ?
            operation.endTime.getTime() - operation.startTime.getTime() : 0;
        // Update average sync time
        const totalDuration = this.metrics.averageSyncTime * (this.metrics.operationsTotal - 1) + duration;
        this.metrics.averageSyncTime = totalDuration / this.metrics.operationsTotal;
        // Update entity and relationship counts
        this.metrics.totalEntitiesProcessed +=
            operation.entitiesCreated + operation.entitiesUpdated + operation.entitiesDeleted;
        this.metrics.totalRelationshipsProcessed +=
            operation.relationshipsCreated + operation.relationshipsUpdated + operation.relationshipsDeleted;
        // Update error rate
        this.metrics.errorRate = this.metrics.operationsFailed / this.metrics.operationsTotal;
        // Update throughput (operations per minute)
        const timeWindow = 5 * 60 * 1000; // 5 minutes
        const recentOps = Array.from(this.operations.values())
            .filter(op => op.endTime && Date.now() - op.endTime.getTime() < timeWindow)
            .length;
        this.metrics.throughput = (recentOps / 5); // operations per minute
    }
    updatePerformanceMetrics(operation) {
        // This would be populated with actual performance measurements
        // For now, using placeholder values
        this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed;
    }
    getSyncMetrics() {
        return { ...this.metrics };
    }
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    getHealthMetrics() {
        const lastSyncTime = this.getLastSyncTime();
        const consecutiveFailures = this.getConsecutiveFailures();
        const activeOperations = Array.from(this.operations.values())
            .filter(op => op.status === 'running' || op.status === 'pending').length;
        let overallHealth = 'healthy';
        if (consecutiveFailures > 3) {
            overallHealth = 'unhealthy';
        }
        else if (consecutiveFailures > 0 || this.metrics.errorRate > 0.1) {
            overallHealth = 'degraded';
        }
        return {
            overallHealth,
            lastSyncTime,
            consecutiveFailures,
            queueDepth: this.getQueueDepth(),
            activeOperations,
            systemLoad: this.getSystemLoad(),
        };
    }
    getLastSyncTime() {
        const completedOps = Array.from(this.operations.values())
            .filter(op => op.endTime && op.status === 'completed')
            .sort((a, b) => (b.endTime.getTime() - a.endTime.getTime()));
        return completedOps.length > 0 ? completedOps[0].endTime : new Date(0);
    }
    getConsecutiveFailures() {
        const recentOps = Array.from(this.operations.values())
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, 10);
        let consecutiveFailures = 0;
        for (const op of recentOps) {
            if (op.status === 'failed') {
                consecutiveFailures++;
            }
            else {
                break;
            }
        }
        return consecutiveFailures;
    }
    getQueueDepth() {
        // This would need to be integrated with the actual queue system
        return 0; // Placeholder
    }
    getSystemLoad() {
        // Return system load average
        return 0; // Placeholder - would use os.loadavg() in real implementation
    }
    getActiveOperations() {
        return Array.from(this.operations.values())
            .filter(op => op.status === 'running' || op.status === 'pending');
    }
    getOperationHistory(limit = 50) {
        return Array.from(this.operations.values())
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    }
    getAlerts(activeOnly = false) {
        if (activeOnly) {
            return this.alerts.filter(alert => !alert.resolved);
        }
        return [...this.alerts];
    }
    resolveAlert(alertId, resolution) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolution = resolution;
            this.log('info', alert.operationId || 'system', 'Alert resolved', {
                alertId,
                resolution,
            });
            return true;
        }
        return false;
    }
    triggerAlert(alert) {
        const fullAlert = {
            ...alert,
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            resolved: false,
        };
        this.alerts.push(fullAlert);
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        this.log('warn', alert.operationId || 'system', 'Alert triggered', {
            type: alert.type,
            message: alert.message,
        });
        this.emit('alertTriggered', fullAlert);
    }
    performHealthCheck() {
        const health = this.getHealthMetrics();
        if (health.overallHealth === 'unhealthy') {
            this.triggerAlert({
                type: 'error',
                message: 'System health is unhealthy',
            });
        }
        else if (health.overallHealth === 'degraded') {
            this.triggerAlert({
                type: 'warning',
                message: 'System health is degraded',
            });
        }
        this.emit('healthCheck', health);
    }
    handleOperationStarted(operation) {
        // Additional handling for operation start
    }
    handleOperationCompleted(operation) {
        // Additional handling for operation completion
    }
    handleOperationFailed(operation, error) {
        // Additional handling for operation failure
    }
    handleConflictDetected(conflict) {
        // Additional handling for conflicts
    }
    handleAlertTriggered(alert) {
        // Additional handling for alerts
    }
    log(level, operationId, message, data) {
        const entry = {
            timestamp: new Date(),
            level,
            operationId,
            message,
            data,
        };
        this.logs.push(entry);
        // Keep only last 1000 log entries
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        // Emit log entry
        this.emit('logEntry', entry);
    }
    getLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
    getLogsByOperation(operationId) {
        return this.logs.filter(log => log.operationId === operationId);
    }
    generateReport() {
        return {
            summary: this.getSyncMetrics(),
            performance: this.getPerformanceMetrics(),
            health: this.getHealthMetrics(),
            recentOperations: this.getOperationHistory(10),
            activeAlerts: this.getAlerts(true),
        };
    }
    // Cleanup old data to prevent memory leaks
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoffTime = Date.now() - maxAge;
        // Remove old operations
        for (const [id, operation] of this.operations) {
            if (operation.endTime && operation.endTime.getTime() < cutoffTime) {
                this.operations.delete(id);
            }
        }
        // Remove old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > cutoffTime || !alert.resolved);
        // Remove old logs
        this.logs = this.logs.filter(log => log.timestamp.getTime() > cutoffTime);
    }
}
//# sourceMappingURL=SynchronizationMonitoring.js.map