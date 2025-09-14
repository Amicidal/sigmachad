/**
 * Configuration Service for Memento
 * Manages system configuration, feature detection, and health monitoring
 */

import { DatabaseService } from "./DatabaseService.js";
import { SynchronizationCoordinator } from "./SynchronizationCoordinator.js";
import * as fs from "fs/promises";
import * as path from "path";

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

export class ConfigurationService {
  constructor(
    private dbService: DatabaseService,
    private syncCoordinator?: SynchronizationCoordinator,
    private testWorkingDir?: string
  ) {}

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    const config: SystemConfiguration = {
      version: await this.getVersion(),
      environment: process.env.NODE_ENV || "development",
      databases: await this.checkDatabaseStatus(),
      features: await this.checkFeatureStatus(),
      performance: await this.getPerformanceConfig(),
      security: await this.getSecurityConfig(),
      system: await this.getSystemInfo(),
    };

    return config;
  }

  // History configuration derived from environment variables
  getHistoryConfig(): {
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  } {
    const enabled = (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false';
    const retentionDays = parseInt(process.env.HISTORY_RETENTION_DAYS || '', 10);
    const hops = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || '', 10);
    const embedVersions = (process.env.HISTORY_EMBED_VERSIONS || 'false').toLowerCase() === 'true';
    const incidentEnabled = (process.env.HISTORY_INCIDENT_ENABLED || 'true').toLowerCase() !== 'false';
    const incidentHops = parseInt(process.env.HISTORY_INCIDENT_HOPS || '', 10);
    const pruneHours = parseInt(process.env.HISTORY_PRUNE_INTERVAL_HOURS || '', 10);
    const checkpointHours = parseInt(process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS || '', 10);
    return {
      enabled,
      retentionDays: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 30,
      checkpoint: {
        hops: Number.isFinite(hops) && hops > 0 ? Math.min(hops, 5) : 2,
        embedVersions,
      },
      incident: {
        enabled: incidentEnabled,
        hops: Number.isFinite(incidentHops) && incidentHops > 0 ? Math.min(incidentHops, 5) : (Number.isFinite(hops) && hops > 0 ? Math.min(hops, 5) : 2),
      },
      schedule: {
        pruneIntervalHours: Number.isFinite(pruneHours) && pruneHours > 0 ? pruneHours : 24,
        checkpointIntervalHours: Number.isFinite(checkpointHours) && checkpointHours > 0 ? checkpointHours : 24,
      },
    };
  }

  // Update history configuration at runtime (process.env backed)
  updateHistoryConfig(updates: Partial<{
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  }>): {
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  } {
    if (updates.enabled !== undefined) {
      process.env.HISTORY_ENABLED = String(!!updates.enabled);
    }
    if (typeof updates.retentionDays === 'number') {
      const v = Math.max(1, Math.floor(updates.retentionDays));
      process.env.HISTORY_RETENTION_DAYS = String(v);
    }
    if (updates.checkpoint) {
      if (typeof updates.checkpoint.hops === 'number') {
        const h = Math.max(1, Math.min(5, Math.floor(updates.checkpoint.hops)));
        process.env.HISTORY_CHECKPOINT_HOPS = String(h);
      }
      if (updates.checkpoint.embedVersions !== undefined) {
        process.env.HISTORY_EMBED_VERSIONS = String(!!updates.checkpoint.embedVersions);
      }
    }
    if (updates.incident) {
      if (typeof updates.incident.enabled === 'boolean') {
        process.env.HISTORY_INCIDENT_ENABLED = String(!!updates.incident.enabled);
      }
      if (typeof updates.incident.hops === 'number') {
        const ih = Math.max(1, Math.min(5, Math.floor(updates.incident.hops)));
        process.env.HISTORY_INCIDENT_HOPS = String(ih);
      }
    }
    if (updates.schedule) {
      if (typeof updates.schedule.pruneIntervalHours === 'number') {
        const ph = Math.max(1, Math.floor(updates.schedule.pruneIntervalHours));
        process.env.HISTORY_PRUNE_INTERVAL_HOURS = String(ph);
      }
      if (typeof updates.schedule.checkpointIntervalHours === 'number') {
        const ch = Math.max(1, Math.floor(updates.schedule.checkpointIntervalHours));
        process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS = String(ch);
      }
    }
    return this.getHistoryConfig();
  }

  private async getVersion(): Promise<string> {
    try {
      // Read version from package.json
      const workingDir = this.testWorkingDir || process.cwd();
      const packageJsonPath = path.join(workingDir, "package.json");
      const packageJson = await fs.readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(packageJson);
      return pkg.version || "0.1.0";
    } catch (error) {
      console.warn("Could not read package.json for version:", error);
      return "0.1.0";
    }
  }

  private async checkDatabaseStatus(): Promise<
    SystemConfiguration["databases"]
  > {
    const status: SystemConfiguration["databases"] = {
      falkordb: "unavailable",
      qdrant: "unavailable",
      postgres: "unavailable",
    };

    // If database service is not available, return unavailable status
    if (!this.dbService) {
      return status;
    }

    try {
      // Check FalkorDB
      await this.dbService.falkordbQuery("MATCH (n) RETURN count(n) LIMIT 1");
      status.falkordb = "configured";
    } catch (error) {
      console.warn("FalkorDB connection check failed:", error);
      status.falkordb = "error";
    }

    try {
      // Check Qdrant
      const qdrantClient = this.dbService.getQdrantClient();
      await qdrantClient.getCollections();
      status.qdrant = "configured";
    } catch (error) {
      console.warn("Qdrant connection check failed:", error);
      status.qdrant = "error";
    }

    try {
      // Check PostgreSQL
      await this.dbService.postgresQuery("SELECT 1");
      status.postgres = "configured";
    } catch (error) {
      console.warn("PostgreSQL connection check failed:", error);
      status.postgres = "error";
    }

    return status;
  }

  private async checkFeatureStatus(): Promise<SystemConfiguration["features"]> {
    const features = {
      websocket: true, // Always available in current implementation
      graphSearch: false,
      vectorSearch: false,
      securityScanning: false,
      mcpServer: true, // Always available
      syncCoordinator: !!this.syncCoordinator,
      history: (process.env.HISTORY_ENABLED || "true").toLowerCase() !== "false",
    };

    try {
      // Check graph search capability
      const testQuery = await this.dbService.falkordbQuery(
        "MATCH (n) RETURN count(n) LIMIT 1"
      );
      features.graphSearch = Array.isArray(testQuery);
    } catch (error) {
      features.graphSearch = false;
    }

    try {
      // Check vector search capability
      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      features.vectorSearch =
        collections.collections && collections.collections.length >= 0;
    } catch (error) {
      features.vectorSearch = false;
    }

    // Check security scanning (would need SecurityScanner service)
    try {
      // This would check if SecurityScanner is available and functional
      features.securityScanning = false; // Placeholder
    } catch (error) {
      features.securityScanning = false;
    }

    return features;
  }

  private async getPerformanceConfig(): Promise<
    SystemConfiguration["performance"]
  > {
    return {
      maxConcurrentSync:
        parseInt(process.env.MAX_CONCURRENT_SYNC || "") ||
        (this.syncCoordinator ? 5 : 1),
      cacheSize: parseInt(process.env.CACHE_SIZE || "") || 1000,
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "") || 30000,
    };
  }

  private async getSecurityConfig(): Promise<SystemConfiguration["security"]> {
    return {
      rateLimiting: process.env.ENABLE_RATE_LIMITING === "true",
      authentication: process.env.ENABLE_AUTHENTICATION === "true",
      auditLogging: process.env.ENABLE_AUDIT_LOGGING === "true",
    };
  }

  private async getSystemInfo(): Promise<SystemConfiguration["system"]> {
    let memUsage: NodeJS.MemoryUsage | undefined;
    let cpuUsage;

    try {
      memUsage = process.memoryUsage();
    } catch (error) {
      // If memory usage is unavailable, set to undefined
      memUsage = undefined;
    }

    try {
      // Get CPU usage (simplified)
      const startUsage = process.cpuUsage();
      // Wait a short moment
      await new Promise((resolve) => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);
      cpuUsage = {
        user: endUsage.user / 1000, // Convert to milliseconds
        system: endUsage.system / 1000,
      };
    } catch (error) {
      cpuUsage = { user: 0, system: 0 };
    }

    return {
      uptime: process.uptime(),
      memoryUsage:
        memUsage ||
        ({
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          arrayBuffers: 0,
        } as NodeJS.MemoryUsage),
      cpuUsage,
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  async updateConfiguration(
    updates: Partial<SystemConfiguration>
  ): Promise<void> {
    // Validate updates
    if (updates.performance) {
      if (
        updates.performance.maxConcurrentSync &&
        updates.performance.maxConcurrentSync < 1
      ) {
        throw new Error("maxConcurrentSync must be at least 1");
      }
      if (updates.performance.cacheSize && updates.performance.cacheSize < 0) {
        throw new Error("cacheSize cannot be negative");
      }
      if (
        updates.performance.requestTimeout &&
        updates.performance.requestTimeout < 1000
      ) {
        throw new Error("requestTimeout must be at least 1000ms");
      }
    }

    // For now, we'll just validate and log the updates
    // In a production system, this would update environment variables or config files
    console.log(
      "Configuration update requested:",
      JSON.stringify(updates, null, 2)
    );

    // TODO: Implement actual configuration persistence
    // This could involve:
    // 1. Writing to environment files
    // 2. Updating database configuration
    // 3. Sending signals to other services to reload config

    throw new Error(
      "Configuration updates not yet implemented - this is a placeholder"
    );
  }

  async getDatabaseHealth(): Promise<{
    falkordb: any;
    qdrant: any;
    postgres: any;
  }> {
    const health = {
      falkordb: null as any,
      qdrant: null as any,
      postgres: null as any,
    };

    try {
      // Get FalkorDB stats
      const falkordbStats = await this.dbService.falkordbQuery("INFO");
      health.falkordb = {
        status: "healthy",
        stats: falkordbStats,
      };
    } catch (error) {
      health.falkordb = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    try {
      // Get Qdrant health
      const qdrantClient = this.dbService.getQdrantClient();
      const qdrantHealth = await qdrantClient.getCollections();
      health.qdrant = {
        status: "healthy",
        collections: qdrantHealth.collections?.length || 0,
      };
    } catch (error) {
      health.qdrant = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    try {
      // Get PostgreSQL stats
      const postgresStats = await this.dbService.postgresQuery(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        LIMIT 10
      `);
      health.postgres = {
        status: "healthy",
        tables: ((postgresStats as any)?.rows ?? []).length,
      };
    } catch (error) {
      health.postgres = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return health;
  }

  async getEnvironmentInfo(): Promise<{
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
  }> {
    const os = await import("os");

    let diskInfo;
    try {
      // Try to get disk information (may not be available on all platforms)
      const fsModule = await import("fs/promises");
      // This is a simplified disk check - in production you'd use a proper disk library
      diskInfo = {
        total: 0,
        free: 0,
        used: 0,
      };
    } catch (error) {
      // Disk info not available
    }

    let timezone: string;
    let locale: string;

    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      timezone = "UTC"; // Fallback timezone
    }

    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (error) {
      locale = "en-US"; // Fallback locale
    }

    return {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      timezone,
      locale,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      disk: diskInfo,
    };
  }

  // Validate configuration integrity
  async validateConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check database configurations
    const dbStatus = await this.checkDatabaseStatus();

    if (dbStatus.falkordb === "error") {
      issues.push("FalkorDB connection is failing");
      recommendations.push(
        "Check FalkorDB server status and connection string"
      );
    }

    if (dbStatus.qdrant === "error") {
      issues.push("Qdrant connection is failing");
      recommendations.push("Check Qdrant server status and API configuration");
    }

    if (dbStatus.postgres === "error") {
      issues.push("PostgreSQL connection is failing");
      recommendations.push(
        "Check PostgreSQL server status and connection string"
      );
    }

    // Check environment variables
    const requiredEnvVars = ["NODE_ENV"];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        issues.push(`Required environment variable ${envVar} is not set`);
      }
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memUsagePercent > 90) {
      issues.push("High memory usage detected");
      recommendations.push(
        "Consider increasing memory limits or optimizing memory usage"
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
