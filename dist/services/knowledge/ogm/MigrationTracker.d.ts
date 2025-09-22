/**
 * Migration Tracker
 * Monitors and tracks the status of OGM migration across services
 */
import { EventEmitter } from 'events';
export interface ServiceMetrics {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
    lastOperationTime: Date;
    implementationType: 'ogm' | 'legacy';
}
export interface MigrationMetrics {
    services: Record<string, ServiceMetrics>;
    globalStats: {
        totalOGMOperations: number;
        totalLegacyOperations: number;
        ogmSuccessRate: number;
        legacySuccessRate: number;
        ogmAverageResponseTime: number;
        legacyAverageResponseTime: number;
    };
    lastUpdated: Date;
}
export interface OperationRecord {
    serviceName: string;
    operationName: string;
    implementationType: 'ogm' | 'legacy';
    startTime: Date;
    endTime?: Date;
    success?: boolean;
    error?: string;
    responseTime?: number;
}
export declare class MigrationTracker extends EventEmitter {
    private metrics;
    private operations;
    private maxOperationHistory;
    constructor();
    /**
     * Record the start of an operation
     */
    startOperation(serviceName: string, operationName: string, implementationType: 'ogm' | 'legacy'): string;
    /**
     * Record the completion of an operation
     */
    completeOperation(operationId: string, success: boolean, error?: string): void;
    /**
     * Record an operation with automatic timing
     */
    trackOperation<T>(serviceName: string, operationName: string, implementationType: 'ogm' | 'legacy', operation: () => Promise<T>): Promise<T>;
    /**
     * Update metrics based on completed operation
     */
    private updateMetrics;
    /**
     * Recalculate global statistics
     */
    private recalculateGlobalStats;
    /**
     * Get current migration metrics
     */
    getMetrics(): MigrationMetrics;
    /**
     * Get recent operations
     */
    getRecentOperations(limit?: number): OperationRecord[];
    /**
     * Get service-specific metrics
     */
    getServiceMetrics(serviceName: string): ServiceMetrics | null;
    /**
     * Get migration health summary
     */
    getMigrationHealth(): {
        overallHealth: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
        migrationProgress: number;
    };
    /**
     * Reset metrics (for testing)
     */
    reset(): void;
}
export declare function getMigrationTracker(): MigrationTracker;
//# sourceMappingURL=MigrationTracker.d.ts.map