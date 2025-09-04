#!/usr/bin/env node
/**
 * Health Check Script for Memento
 * Used by Docker health checks and monitoring systems
 */
import { IDatabaseHealthCheck } from './services/database/interfaces.js';
export interface HealthCheckResult {
    healthy: boolean;
    databases: IDatabaseHealthCheck;
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