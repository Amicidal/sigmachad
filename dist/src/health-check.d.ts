#!/usr/bin/env node
/**
 * Health Check Script for Memento
 * Used by Docker health checks and monitoring systems
 */
export interface HealthCheckResult {
    healthy: boolean;
    databases: Record<string, boolean | undefined>;
    error?: string;
}
/**
 * Perform health check on all system components
 */
export declare function performHealthCheck(): Promise<HealthCheckResult>;
/**
 * CLI health check function
 */
export declare function healthCheck(): Promise<void>;
//# sourceMappingURL=health-check.d.ts.map