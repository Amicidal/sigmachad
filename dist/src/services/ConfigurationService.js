/**
 * Configuration Service for Memento
 * Manages system configuration, feature detection, and health monitoring
 */
import * as fs from "fs/promises";
import * as path from "path";
export class ConfigurationService {
    dbService;
    syncCoordinator;
    testWorkingDir;
    constructor(dbService, syncCoordinator, testWorkingDir) {
        this.dbService = dbService;
        this.syncCoordinator = syncCoordinator;
        this.testWorkingDir = testWorkingDir;
    }
    async getSystemConfiguration() {
        const config = {
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
    async getVersion() {
        try {
            // Read version from package.json
            const workingDir = this.testWorkingDir || process.cwd();
            const packageJsonPath = path.join(workingDir, "package.json");
            const packageJson = await fs.readFile(packageJsonPath, "utf-8");
            const pkg = JSON.parse(packageJson);
            return pkg.version || "0.1.0";
        }
        catch (error) {
            console.warn("Could not read package.json for version:", error);
            return "0.1.0";
        }
    }
    async checkDatabaseStatus() {
        const status = {
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
        }
        catch (error) {
            console.warn("FalkorDB connection check failed:", error);
            status.falkordb = "error";
        }
        try {
            // Check Qdrant
            const qdrantClient = this.dbService.getQdrantClient();
            await qdrantClient.getCollections();
            status.qdrant = "configured";
        }
        catch (error) {
            console.warn("Qdrant connection check failed:", error);
            status.qdrant = "error";
        }
        try {
            // Check PostgreSQL
            await this.dbService.postgresQuery("SELECT 1");
            status.postgres = "configured";
        }
        catch (error) {
            console.warn("PostgreSQL connection check failed:", error);
            status.postgres = "error";
        }
        return status;
    }
    async checkFeatureStatus() {
        const features = {
            websocket: true, // Always available in current implementation
            graphSearch: false,
            vectorSearch: false,
            securityScanning: false,
            mcpServer: true, // Always available
            syncCoordinator: !!this.syncCoordinator,
        };
        try {
            // Check graph search capability
            const testQuery = await this.dbService.falkordbQuery("MATCH (n) RETURN count(n) LIMIT 1");
            features.graphSearch = Array.isArray(testQuery);
        }
        catch (error) {
            features.graphSearch = false;
        }
        try {
            // Check vector search capability
            const qdrantClient = this.dbService.getQdrantClient();
            const collections = await qdrantClient.getCollections();
            features.vectorSearch =
                collections.collections && collections.collections.length >= 0;
        }
        catch (error) {
            features.vectorSearch = false;
        }
        // Check security scanning (would need SecurityScanner service)
        try {
            // This would check if SecurityScanner is available and functional
            features.securityScanning = false; // Placeholder
        }
        catch (error) {
            features.securityScanning = false;
        }
        return features;
    }
    async getPerformanceConfig() {
        return {
            maxConcurrentSync: parseInt(process.env.MAX_CONCURRENT_SYNC || "") ||
                (this.syncCoordinator ? 5 : 1),
            cacheSize: parseInt(process.env.CACHE_SIZE || "") || 1000,
            requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "") || 30000,
        };
    }
    async getSecurityConfig() {
        return {
            rateLimiting: process.env.ENABLE_RATE_LIMITING === "true",
            authentication: process.env.ENABLE_AUTHENTICATION === "true",
            auditLogging: process.env.ENABLE_AUDIT_LOGGING === "true",
        };
    }
    async getSystemInfo() {
        let memUsage;
        let cpuUsage;
        try {
            memUsage = process.memoryUsage();
        }
        catch (error) {
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
        }
        catch (error) {
            cpuUsage = { user: 0, system: 0 };
        }
        return {
            uptime: process.uptime(),
            memoryUsage: memUsage,
            cpuUsage,
            platform: process.platform,
            nodeVersion: process.version,
        };
    }
    async updateConfiguration(updates) {
        // Validate updates
        if (updates.performance) {
            if (updates.performance.maxConcurrentSync &&
                updates.performance.maxConcurrentSync < 1) {
                throw new Error("maxConcurrentSync must be at least 1");
            }
            if (updates.performance.cacheSize && updates.performance.cacheSize < 0) {
                throw new Error("cacheSize cannot be negative");
            }
            if (updates.performance.requestTimeout &&
                updates.performance.requestTimeout < 1000) {
                throw new Error("requestTimeout must be at least 1000ms");
            }
        }
        // For now, we'll just validate and log the updates
        // In a production system, this would update environment variables or config files
        console.log("Configuration update requested:", JSON.stringify(updates, null, 2));
        // TODO: Implement actual configuration persistence
        // This could involve:
        // 1. Writing to environment files
        // 2. Updating database configuration
        // 3. Sending signals to other services to reload config
        throw new Error("Configuration updates not yet implemented - this is a placeholder");
    }
    async getDatabaseHealth() {
        const health = {
            falkordb: null,
            qdrant: null,
            postgres: null,
        };
        try {
            // Get FalkorDB stats
            const falkordbStats = await this.dbService.falkordbQuery("INFO");
            health.falkordb = {
                status: "healthy",
                stats: falkordbStats,
            };
        }
        catch (error) {
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
        }
        catch (error) {
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
                tables: postgresStats.length,
            };
        }
        catch (error) {
            health.postgres = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
        return health;
    }
    async getEnvironmentInfo() {
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
        }
        catch (error) {
            // Disk info not available
        }
        let timezone;
        let locale;
        try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        catch (error) {
            timezone = "UTC"; // Fallback timezone
        }
        try {
            locale = Intl.DateTimeFormat().resolvedOptions().locale;
        }
        catch (error) {
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
    async validateConfiguration() {
        const issues = [];
        const recommendations = [];
        // Check database configurations
        const dbStatus = await this.checkDatabaseStatus();
        if (dbStatus.falkordb === "error") {
            issues.push("FalkorDB connection is failing");
            recommendations.push("Check FalkorDB server status and connection string");
        }
        if (dbStatus.qdrant === "error") {
            issues.push("Qdrant connection is failing");
            recommendations.push("Check Qdrant server status and API configuration");
        }
        if (dbStatus.postgres === "error") {
            issues.push("PostgreSQL connection is failing");
            recommendations.push("Check PostgreSQL server status and connection string");
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
            recommendations.push("Consider increasing memory limits or optimizing memory usage");
        }
        return {
            isValid: issues.length === 0,
            issues,
            recommendations,
        };
    }
}
//# sourceMappingURL=ConfigurationService.js.map