// TODO(2025-09-30.35): Validate config keys and avoid dynamic indexing.
/**
 * Configuration Service for Memento
 * Manages system configuration, feature detection, and health monitoring
 */

import type { IDatabaseService, INeo4jService, ISynchronizationCoordinator } from '@memento/shared-types';
import * as fs from 'fs/promises';
import * as path from 'path';

const SYSTEM_CONFIG_DOCUMENT_ID = '00000000-0000-4000-8000-00000000c0f1';
const SYSTEM_CONFIG_DOCUMENT_TYPE = 'system_config';

type DatabaseComponentStatus = 'configured' | 'error' | 'unavailable';

export interface SystemConfiguration {
  version: string;
  environment: string;
  databases: {
    neo4j: DatabaseComponentStatus;
    qdrant: DatabaseComponentStatus;
    postgres: DatabaseComponentStatus;
    /** @deprecated Retained for backwards compatibility until consumers migrate */
    falkordb?: DatabaseComponentStatus;
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
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: any;
    platform: string;
    nodeVersion: string;
  };
}

export class ConfigurationService {
  constructor(
    private readonly dbService?: IDatabaseService,
    private readonly syncCoordinator?: ISynchronizationCoordinator,
    private readonly testWorkingDir?: string
  ) {}

  private cachedConfig: Partial<SystemConfiguration> = {};
  private configLoaded = false;

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    await this.ensureConfigLoaded();

    const config: SystemConfiguration = {
      version: await this.getVersion(),
      environment: process.env.NODE_ENV || 'development',
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
    const enabled =
      (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false';
    const retentionDays = parseInt(
      process.env.HISTORY_RETENTION_DAYS || '',
      10
    );
    const hops = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || '', 10);
    const embedVersions =
      (process.env.HISTORY_EMBED_VERSIONS || 'false').toLowerCase() === 'true';
    const incidentEnabled =
      (process.env.HISTORY_INCIDENT_ENABLED || 'true').toLowerCase() !==
      'false';
    const incidentHops = parseInt(process.env.HISTORY_INCIDENT_HOPS || '', 10);
    const pruneHours = parseInt(
      process.env.HISTORY_PRUNE_INTERVAL_HOURS || '',
      10
    );
    const checkpointHours = parseInt(
      process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS || '',
      10
    );
    return {
      enabled,
      retentionDays:
        Number.isFinite(retentionDays) && retentionDays > 0
          ? retentionDays
          : 30,
      checkpoint: {
        hops: Number.isFinite(hops) && hops > 0 ? Math.min(hops, 5) : 2,
        embedVersions,
      },
      incident: {
        enabled: incidentEnabled,
        hops:
          Number.isFinite(incidentHops) && incidentHops > 0
            ? Math.min(incidentHops, 5)
            : Number.isFinite(hops) && hops > 0
            ? Math.min(hops, 5)
            : 2,
      },
      schedule: {
        pruneIntervalHours:
          Number.isFinite(pruneHours) && pruneHours > 0 ? pruneHours : 24,
        checkpointIntervalHours:
          Number.isFinite(checkpointHours) && checkpointHours > 0
            ? checkpointHours
            : 24,
      },
    };
  }

  // Update history configuration at runtime (process.env backed)
  updateHistoryConfig(
    updates: Partial<{
      enabled: boolean;
      retentionDays: number;
      checkpoint: { hops: number; embedVersions: boolean };
      incident: { enabled: boolean; hops: number };
      schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
    }>
  ): {
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
        process.env.HISTORY_EMBED_VERSIONS = String(
          !!updates.checkpoint.embedVersions
        );
      }
    }
    if (updates.incident) {
      if (typeof updates.incident.enabled === 'boolean') {
        process.env.HISTORY_INCIDENT_ENABLED = String(
          !!updates.incident.enabled
        );
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
        const ch = Math.max(
          1,
          Math.floor(updates.schedule.checkpointIntervalHours)
        );
        process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS = String(ch);
      }
    }
    return this.getHistoryConfig();
  }

  private async getVersion(): Promise<string> {
    try {
      // Read version from package.json
      const workingDir = this.testWorkingDir || process.cwd();
      const packageJsonPath = path.join(workingDir, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(packageJson);
      return pkg.version || '0.1.0';
    } catch (error) {
      console.warn('Could not read package.json for version:', error);
      return '0.1.0';
    }
  }

  private async checkDatabaseStatus(): Promise<
    SystemConfiguration['databases']
  > {
    const status: SystemConfiguration['databases'] = {
      neo4j: 'unavailable',
      qdrant: 'unavailable',
      postgres: 'unavailable',
    };

    // If database service is not available, return unavailable status
    const dbService = this.dbService;
    if (!dbService) {
      status.falkordb = status.neo4j;
      return status;
    }

    try {
      // Check Neo4j graph database availability
      await dbService.graphQuery('MATCH (n) RETURN count(n) AS total LIMIT 1');
      status.neo4j = 'configured';
    } catch (error) {
      console.warn('Neo4j connection check failed:', error);
      status.neo4j = 'error';
    }

    try {
      // Check Qdrant
      const qdrantClient = dbService.getQdrantClient();
      await qdrantClient.getCollections();
      status.qdrant = 'configured';
    } catch (error) {
      console.warn('Qdrant connection check failed:', error);
      status.qdrant = 'error';
    }

    try {
      // Check PostgreSQL
      await dbService.postgresQuery('SELECT 1');
      status.postgres = 'configured';
    } catch (error) {
      console.warn('PostgreSQL connection check failed:', error);
      status.postgres = 'error';
    }

    // Maintain deprecated compatibility field during migration
    status.falkordb = status.neo4j;

    return status;
  }

  private async checkFeatureStatus(): Promise<SystemConfiguration['features']> {
    const features = {
      websocket: true, // Always available in current implementation
      graphSearch: false,
      vectorSearch: false,
      securityScanning: false,
      mcpServer: true, // Always available
      syncCoordinator: !!this.syncCoordinator,
      history:
        (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false',
    };

    const dbService = this.dbService;
    if (!dbService) {
      return features;
    }

    try {
      // Check graph search capability
      await dbService.graphQuery('MATCH (n) RETURN count(n) AS total LIMIT 1');
      // If query succeeds without throwing, graph search is available
      features.graphSearch = true;
    } catch (error) {
      features.graphSearch = false;
    }

    try {
      // Check vector search capability
      const qdrantClient = dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      features.vectorSearch = Array.isArray(collections?.collections)
        ? collections.collections.length > 0
        : false;
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
    SystemConfiguration['performance']
  > {
    await this.ensureConfigLoaded();

    const defaults = {
      maxConcurrentSync:
        parseInt(process.env.MAX_CONCURRENT_SYNC || '', 10) ||
        (this.syncCoordinator ? 5 : 1),
      cacheSize: parseInt(process.env.CACHE_SIZE || '', 10) || 1000,
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '', 10) || 30000,
    };

    const overrides = (this.cachedConfig.performance ?? {}) as Partial<
      SystemConfiguration['performance']
    >;
    const resolvedMaxConcurrentSync =
      typeof overrides.maxConcurrentSync === 'number' &&
      overrides.maxConcurrentSync >= 1
        ? overrides.maxConcurrentSync
        : defaults.maxConcurrentSync;

    const maxConcurrentSync = this.syncCoordinator
      ? resolvedMaxConcurrentSync
      : 1;

    return {
      maxConcurrentSync,
      cacheSize:
        typeof overrides.cacheSize === 'number' && overrides.cacheSize >= 0
          ? overrides.cacheSize
          : defaults.cacheSize,
      requestTimeout:
        typeof overrides.requestTimeout === 'number' &&
        overrides.requestTimeout >= 1000
          ? overrides.requestTimeout
          : defaults.requestTimeout,
    };
  }

  private async getSecurityConfig(): Promise<SystemConfiguration['security']> {
    await this.ensureConfigLoaded();

    const defaults = {
      rateLimiting:
        process.env.ENABLE_RATE_LIMITING === undefined
          ? true
          : process.env.ENABLE_RATE_LIMITING === 'true',
      authentication: process.env.ENABLE_AUTHENTICATION === 'true',
      auditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
    };

    const overrides = (this.cachedConfig.security ?? {}) as Partial<
      SystemConfiguration['security']
    >;

    return {
      rateLimiting:
        typeof overrides.rateLimiting === 'boolean'
          ? overrides.rateLimiting
          : defaults.rateLimiting,
      authentication:
        typeof overrides.authentication === 'boolean'
          ? overrides.authentication
          : defaults.authentication,
      auditLogging:
        typeof overrides.auditLogging === 'boolean'
          ? overrides.auditLogging
          : defaults.auditLogging,
    };
  }

  private async getSystemInfo(): Promise<SystemConfiguration['system']> {
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
      memoryUsage: memUsage,
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
      const { maxConcurrentSync, cacheSize, requestTimeout } =
        updates.performance;

      if (typeof maxConcurrentSync === 'number' && maxConcurrentSync < 1) {
        throw new Error('maxConcurrentSync must be at least 1');
      }
      if (typeof cacheSize === 'number' && cacheSize < 0) {
        throw new Error('cacheSize cannot be negative');
      }
      if (typeof requestTimeout === 'number' && requestTimeout < 1000) {
        throw new Error('requestTimeout must be at least 1000ms');
      }
    }

    console.log(
      'Configuration update requested:',
      JSON.stringify(updates, null, 2)
    );

    await this.ensureConfigLoaded();

    this.cachedConfig = this.deepMergeConfig(this.cachedConfig, updates);
    this.configLoaded = true;

    await this.persistConfiguration(this.cachedConfig).catch((error) => {
      console.warn(
        'Configuration persistence failed; continuing with in-memory overrides',
        error
      );
    });
  }

  private async ensureConfigLoaded(): Promise<void> {
    if (this.configLoaded) {
      return;
    }

    const dbService = this.dbService;
    if (!dbService || !dbService.isInitialized()) {
      this.configLoaded = true;
      return;
    }

    try {
      const result = await dbService.postgresQuery(
        `SELECT content FROM documents WHERE id = $1::uuid AND type = $2 LIMIT 1`,
        [SYSTEM_CONFIG_DOCUMENT_ID, SYSTEM_CONFIG_DOCUMENT_TYPE]
      );

      const rows: Array<{ content?: unknown }> = Array.isArray(
        (result as any)?.rows
      )
        ? ((result as any).rows as Array<{ content?: unknown }>)
        : [];

      if (rows.length > 0) {
        const rawContent = rows[0]?.content;
        const parsed: any =
          typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

        if (parsed && typeof parsed === 'object') {
          this.cachedConfig = this.deepMergeConfig(this.cachedConfig, parsed);
        }
      }
    } catch (error) {
      console.warn('Configuration load failed; using defaults', error);
    } finally {
      this.configLoaded = true;
    }
  }

  private deepMergeConfig<T extends Record<string, unknown>>(
    target: Partial<T>,
    source: Partial<T>
  ): Partial<T> {
    const base: Record<string, unknown> = { ...(target || {}) };

    if (!source || typeof source !== 'object') {
      return base as Partial<T>;
    }

    const mergedEntries: Array<[string, unknown]> = [];

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue;

      const current = Object.prototype.hasOwnProperty.call(base, key)
        ? Object.getOwnPropertyDescriptor(base, key)?.value
        : undefined;

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        const currentObject =
          current && typeof current === 'object' && !Array.isArray(current)
            ? (current as Record<string, unknown>)
            : {};
        mergedEntries.push([
          key,
          this.deepMergeConfig(currentObject, value as any),
        ]);
      } else {
        mergedEntries.push([key, value]);
      }
    }

    return { ...base, ...Object.fromEntries(mergedEntries) } as Partial<T>;
  }

  private async persistConfiguration(
    config: Partial<SystemConfiguration>
  ): Promise<void> {
    const dbService = this.dbService;
    if (!dbService || !dbService.isInitialized()) {
      return;
    }

    const now = new Date().toISOString();

    const payload = JSON.stringify(
      config,
      (_key, value) => (value instanceof Date ? value.toISOString() : value),
      2
    );

    await dbService.postgresQuery(
      `INSERT INTO documents (id, type, content, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::jsonb, $4, $4)
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at`,
      [SYSTEM_CONFIG_DOCUMENT_ID, SYSTEM_CONFIG_DOCUMENT_TYPE, payload, now]
    );
  }

  async getDatabaseHealth(): Promise<{
    neo4j: any;
    qdrant: any;
    postgres: any;
    falkordb?: any;
  }> {
    const dbService = this.dbService;
    if (!dbService) {
      const unavailable = {
        status: 'unavailable',
        error: 'Database service not configured',
      };
      return {
        neo4j: unavailable,
        qdrant: unavailable,
        postgres: unavailable,
        falkordb: unavailable,
      };
    }

    const health = {
      neo4j: null as any,
      qdrant: null as any,
      postgres: null as any,
    };

    try {
      // Prefer direct health check when exposed by the Neo4j service
      const graphService = dbService.getGraphService() as INeo4jService;
      const neo4jHealthy =
        typeof graphService.healthCheck === 'function'
          ? await graphService.healthCheck()
          : true;

      const countResult = await dbService.graphQuery(
        'MATCH (n) RETURN count(n) AS total LIMIT 1'
      );
      const nodeCount = countResult.data?.[0]?.[0] ?? 0;

      health.neo4j = neo4jHealthy
        ? {
            status: 'healthy',
            nodes: nodeCount,
            driver: graphService.getDriver?.(),
          }
        : {
            status: 'error',
            nodes: nodeCount,
            error: 'Neo4j health check returned false',
          };
    } catch (error) {
      health.neo4j = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    try {
      // Get Qdrant health
      const qdrantClient = dbService.getQdrantClient();
      const qdrantHealth = await qdrantClient.getCollections();
      health.qdrant = {
        status: 'healthy',
        collections: qdrantHealth.collections?.length || 0,
      };
    } catch (error) {
      health.qdrant = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    try {
      // Get PostgreSQL stats
      const postgresStats = await dbService.postgresQuery(`
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
        status: 'healthy',
        tables: ((postgresStats as any)?.rows ?? []).length,
      };
    } catch (error) {
      health.postgres = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Populate deprecated field for consumers awaiting migration
    return {
      ...health,
      falkordb: health.neo4j,
    };
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
    const os = await import('os');

    let diskInfo;
    try {
      // Try to get disk information (may not be available on all platforms)
      const fsModule = await import('fs/promises');
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
      timezone = 'UTC'; // Fallback timezone
    }

    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (error) {
      locale = 'en-US'; // Fallback locale
    }

    return {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
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

    if (dbStatus.neo4j === 'error') {
      issues.push('Neo4j connection is failing');
      recommendations.push('Check Neo4j server status and connection string');
    }

    if (dbStatus.qdrant === 'error') {
      issues.push('Qdrant connection is failing');
      recommendations.push('Check Qdrant server status and API configuration');
    }

    if (dbStatus.postgres === 'error') {
      issues.push('PostgreSQL connection is failing');
      recommendations.push(
        'Check PostgreSQL server status and connection string'
      );
    }

    // Check environment variables (avoid dynamic indexing)
    if (!process.env.NODE_ENV) {
      issues.push('Required environment variable NODE_ENV is not set');
    }

    // Check memory usage
    try {
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      if (memUsagePercent > 90) {
        issues.push('High memory usage detected');
        recommendations.push(
          'Consider increasing memory limits or optimizing memory usage'
        );
      }
    } catch (error) {
      recommendations.push('Could not determine memory usage');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
 
// TODO(2025-09-30.35): Validate config keys and avoid dynamic indexing.
