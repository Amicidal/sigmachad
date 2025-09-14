/**
 * Configuration Service for Memento
 * Manages system configuration, feature detection, and health monitoring
 */
import { DatabaseService } from "./DatabaseService.js";
import { SynchronizationCoordinator } from "./SynchronizationCoordinator.js";
export interface SystemConfiguration {
    version: string;
    environment: string;
    databases: {
        falkordb: "configured" | "error" | "unavailable";
        qdrant: "configured" | "error" | "unavailable";
        postgres: "configured" | "error" | "unavailable";
    };
    features: {
        websocket: boolean;
        graphSearch: boolean;
        vectorSearch: boolean;
        securityScanning: boolean;
        mcpServer: boolean;
        syncCoordinator: boolean;
        history: boolean;
    };
    performance: {
        maxConcurrentSync: number;
        cacheSize: number;
        requestTimeout: number;
    };
    security: {
        rateLimiting: boolean;
        authentication: boolean;
        auditLogging: boolean;
    };
    system: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage?: any;
        platform: string;
        nodeVersion: string;
    };
}
export declare class ConfigurationService {
    private dbService;
    private syncCoordinator?;
    private testWorkingDir?;
    constructor(dbService: DatabaseService, syncCoordinator?: SynchronizationCoordinator | undefined, testWorkingDir?: string | undefined);
    getSystemConfiguration(): Promise<SystemConfiguration>;
    getHistoryConfig(): {
        enabled: boolean;
        retentionDays: number;
        checkpoint: {
            hops: number;
            embedVersions: boolean;
        };
        incident: {
            enabled: boolean;
            hops: number;
        };
        schedule: {
            pruneIntervalHours: number;
            checkpointIntervalHours: number;
        };
    };
    updateHistoryConfig(updates: Partial<{
        enabled: boolean;
        retentionDays: number;
        checkpoint: {
            hops: number;
            embedVersions: boolean;
        };
        incident: {
            enabled: boolean;
            hops: number;
        };
        schedule: {
            pruneIntervalHours: number;
            checkpointIntervalHours: number;
        };
    }>): {
        enabled: boolean;
        retentionDays: number;
        checkpoint: {
            hops: number;
            embedVersions: boolean;
        };
        incident: {
            enabled: boolean;
            hops: number;
        };
        schedule: {
            pruneIntervalHours: number;
            checkpointIntervalHours: number;
        };
    };
    private getVersion;
    private checkDatabaseStatus;
    private checkFeatureStatus;
    private getPerformanceConfig;
    private getSecurityConfig;
    private getSystemInfo;
    updateConfiguration(updates: Partial<SystemConfiguration>): Promise<void>;
    getDatabaseHealth(): Promise<{
        falkordb: any;
        qdrant: any;
        postgres: any;
    }>;
    getEnvironmentInfo(): Promise<{
        nodeVersion: string;
        platform: string;
        environment: string;
        timezone: string;
        locale: string;
        memory: {
            total: number;
            free: number;
            used: number;
        };
        disk?: {
            total: number;
            free: number;
            used: number;
        };
    }>;
    validateConfiguration(): Promise<{
        isValid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
}
//# sourceMappingURL=ConfigurationService.d.ts.map