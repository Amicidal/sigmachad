/**
 * Migration Tracker
 * Monitors and tracks the status of OGM migration across services
 */
import { EventEmitter } from 'events';
import { getFeatureFlagService } from './FeatureFlags.js';
export class MigrationTracker extends EventEmitter {
    constructor() {
        super();
        this.operations = [];
        this.maxOperationHistory = 1000;
        this.metrics = {
            services: {},
            globalStats: {
                totalOGMOperations: 0,
                totalLegacyOperations: 0,
                ogmSuccessRate: 0,
                legacySuccessRate: 0,
                ogmAverageResponseTime: 0,
                legacyAverageResponseTime: 0,
            },
            lastUpdated: new Date(),
        };
    }
    /**
     * Record the start of an operation
     */
    startOperation(serviceName, operationName, implementationType) {
        const operationId = `${serviceName}-${operationName}-${Date.now()}`;
        const operation = {
            serviceName,
            operationName,
            implementationType,
            startTime: new Date(),
        };
        this.operations.push(operation);
        // Maintain operation history limit
        if (this.operations.length > this.maxOperationHistory) {
            this.operations = this.operations.slice(-this.maxOperationHistory);
        }
        return operationId;
    }
    /**
     * Record the completion of an operation
     */
    completeOperation(operationId, success, error) {
        const operationIndex = this.operations.findIndex(op => `${op.serviceName}-${op.operationName}-${op.startTime.getTime()}` === operationId);
        if (operationIndex === -1) {
            console.warn(`Operation not found: ${operationId}`);
            return;
        }
        const operation = this.operations[operationIndex];
        operation.endTime = new Date();
        operation.success = success;
        operation.error = error;
        operation.responseTime = operation.endTime.getTime() - operation.startTime.getTime();
        this.updateMetrics(operation);
        this.emit('operation:completed', operation);
        // Log metrics if enabled
        const featureFlags = getFeatureFlagService();
        if (featureFlags.shouldLogMetrics()) {
            console.log(`[MigrationTracker] ${operation.serviceName}:${operation.operationName} - ${operation.implementationType} - ${success ? 'SUCCESS' : 'FAILED'} - ${operation.responseTime}ms`);
        }
    }
    /**
     * Record an operation with automatic timing
     */
    async trackOperation(serviceName, operationName, implementationType, operation) {
        const operationId = this.startOperation(serviceName, operationName, implementationType);
        try {
            const result = await operation();
            this.completeOperation(operationId, true);
            return result;
        }
        catch (error) {
            this.completeOperation(operationId, false, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Update metrics based on completed operation
     */
    updateMetrics(operation) {
        const { serviceName, implementationType, success, responseTime } = operation;
        // Initialize service metrics if not exists
        if (!this.metrics.services[serviceName]) {
            this.metrics.services[serviceName] = {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageResponseTime: 0,
                lastOperationTime: new Date(),
                implementationType,
            };
        }
        const serviceMetrics = this.metrics.services[serviceName];
        // Update service metrics
        serviceMetrics.totalOperations++;
        serviceMetrics.lastOperationTime = new Date();
        if (success) {
            serviceMetrics.successfulOperations++;
        }
        else {
            serviceMetrics.failedOperations++;
        }
        if (responseTime !== undefined) {
            // Calculate running average
            const totalResponseTime = serviceMetrics.averageResponseTime * (serviceMetrics.totalOperations - 1);
            serviceMetrics.averageResponseTime = (totalResponseTime + responseTime) / serviceMetrics.totalOperations;
        }
        // Update global stats
        if (implementationType === 'ogm') {
            this.metrics.globalStats.totalOGMOperations++;
        }
        else {
            this.metrics.globalStats.totalLegacyOperations++;
        }
        this.recalculateGlobalStats();
        this.metrics.lastUpdated = new Date();
    }
    /**
     * Recalculate global statistics
     */
    recalculateGlobalStats() {
        const ogmOperations = this.operations.filter(op => op.implementationType === 'ogm' && op.success !== undefined);
        const legacyOperations = this.operations.filter(op => op.implementationType === 'legacy' && op.success !== undefined);
        // Calculate success rates
        if (ogmOperations.length > 0) {
            const ogmSuccessful = ogmOperations.filter(op => op.success).length;
            this.metrics.globalStats.ogmSuccessRate = (ogmSuccessful / ogmOperations.length) * 100;
            const ogmResponseTimes = ogmOperations.filter(op => op.responseTime !== undefined).map(op => op.responseTime);
            if (ogmResponseTimes.length > 0) {
                this.metrics.globalStats.ogmAverageResponseTime = ogmResponseTimes.reduce((a, b) => a + b, 0) / ogmResponseTimes.length;
            }
        }
        if (legacyOperations.length > 0) {
            const legacySuccessful = legacyOperations.filter(op => op.success).length;
            this.metrics.globalStats.legacySuccessRate = (legacySuccessful / legacyOperations.length) * 100;
            const legacyResponseTimes = legacyOperations.filter(op => op.responseTime !== undefined).map(op => op.responseTime);
            if (legacyResponseTimes.length > 0) {
                this.metrics.globalStats.legacyAverageResponseTime = legacyResponseTimes.reduce((a, b) => a + b, 0) / legacyResponseTimes.length;
            }
        }
    }
    /**
     * Get current migration metrics
     */
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }
    /**
     * Get recent operations
     */
    getRecentOperations(limit = 50) {
        return this.operations
            .slice(-limit)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }
    /**
     * Get service-specific metrics
     */
    getServiceMetrics(serviceName) {
        return this.metrics.services[serviceName] || null;
    }
    /**
     * Get migration health summary
     */
    getMigrationHealth() {
        const issues = [];
        const recommendations = [];
        // Check success rates
        if (this.metrics.globalStats.ogmSuccessRate < 95 && this.metrics.globalStats.totalOGMOperations > 10) {
            issues.push(`OGM success rate is ${this.metrics.globalStats.ogmSuccessRate.toFixed(2)}% (below 95%)`);
            recommendations.push('Investigate OGM failures and consider enabling fallback');
        }
        // Check performance
        if (this.metrics.globalStats.ogmAverageResponseTime > this.metrics.globalStats.legacyAverageResponseTime * 1.5) {
            issues.push('OGM performance is significantly slower than legacy implementation');
            recommendations.push('Profile OGM queries and optimize model relationships');
        }
        // Calculate migration progress
        const totalOperations = this.metrics.globalStats.totalOGMOperations + this.metrics.globalStats.totalLegacyOperations;
        const migrationProgress = totalOperations > 0 ? (this.metrics.globalStats.totalOGMOperations / totalOperations) * 100 : 0;
        // Determine overall health
        let overallHealth;
        if (issues.length === 0) {
            overallHealth = 'healthy';
        }
        else if (issues.length <= 2) {
            overallHealth = 'warning';
        }
        else {
            overallHealth = 'critical';
        }
        return {
            overallHealth,
            issues,
            recommendations,
            migrationProgress,
        };
    }
    /**
     * Reset metrics (for testing)
     */
    reset() {
        this.metrics = {
            services: {},
            globalStats: {
                totalOGMOperations: 0,
                totalLegacyOperations: 0,
                ogmSuccessRate: 0,
                legacySuccessRate: 0,
                ogmAverageResponseTime: 0,
                legacyAverageResponseTime: 0,
            },
            lastUpdated: new Date(),
        };
        this.operations = [];
        this.emit('metrics:reset');
    }
}
// Singleton instance
let migrationTracker = null;
export function getMigrationTracker() {
    if (!migrationTracker) {
        migrationTracker = new MigrationTracker();
    }
    return migrationTracker;
}
//# sourceMappingURL=MigrationTracker.js.map