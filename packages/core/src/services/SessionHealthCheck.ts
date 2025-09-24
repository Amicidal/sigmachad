/**
 * Session Health Check Service
 *
 * Provides comprehensive health monitoring for Redis session coordination:
 * - Session Manager health status
 * - Redis connection health
 * - Performance metrics
 * - System resource monitoring
 * - Alerting and diagnostics
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionManager } from './SessionManager.js';
import { SessionStore } from './SessionStore.js';
import { SessionReplay } from './SessionReplay.js';
import { SessionMigration } from './SessionMigration.js';

export interface HealthCheckConfig {
  checkInterval: number; // milliseconds
  redisTimeoutThreshold: number; // milliseconds
  memoryThreshold: number; // bytes
  sessionCountThreshold: number;
  errorRateThreshold: number; // percentage
  enableDetailedMetrics: boolean;
  enableAlerts: boolean;
}

export interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    sessionManager: ComponentHealth;
    redis: ComponentHealth;
    sessionStore: ComponentHealth;
    sessionReplay?: ComponentHealth;
    sessionMigration?: ComponentHealth;
  };
  metrics: HealthMetrics;
  alerts?: Alert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  latency: number;
  errorRate: number;
  lastCheck: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  sessions: {
    active: number;
    total: number;
    averageAge: number;
    eventsPerSecond: number;
  };
  redis: {
    memoryUsage: number;
    connectedClients: number;
    commandsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
  };
}

export interface Alert {
  level: 'warning' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  value?: number;
  threshold?: number;
}

export interface HealthCheckEndpoint {
  path: string;
  handler: () => Promise<any>;
  description: string;
}

export class SessionHealthCheck extends EventEmitter {
  private config: HealthCheckConfig;
  private sessionManager?: SessionManager;
  private redis?: RedisClientType;
  private sessionStore?: SessionStore;
  private sessionReplay?: SessionReplay;
  private sessionMigration?: SessionMigration;

  private startTime: number;
  private healthTimer?: NodeJS.Timeout;
  private responseTimeBuffer: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;
  private lastMetrics?: HealthMetrics;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      redisTimeoutThreshold: config.redisTimeoutThreshold || 5000, // 5 seconds
      memoryThreshold: config.memoryThreshold || 512 * 1024 * 1024, // 512MB
      sessionCountThreshold: config.sessionCountThreshold || 10000,
      errorRateThreshold: config.errorRateThreshold || 5, // 5%
      enableDetailedMetrics: config.enableDetailedMetrics ?? true,
      enableAlerts: config.enableAlerts ?? true,
    };

    this.startTime = Date.now();
  }

  /**
   * Initialize health check service
   */
  async initialize(services: {
    sessionManager?: SessionManager;
    redis?: RedisClientType;
    sessionStore?: SessionStore;
    sessionReplay?: SessionReplay;
    sessionMigration?: SessionMigration;
  }): Promise<void> {
    this.sessionManager = services.sessionManager;
    this.redis = services.redis;
    this.sessionStore = services.sessionStore;
    this.sessionReplay = services.sessionReplay;
    this.sessionMigration = services.sessionMigration;

    // Start periodic health checks
    this.startHealthChecks();

    this.emit('initialized');
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    const [
      sessionManagerHealth,
      redisHealth,
      sessionStoreHealth,
      sessionReplayHealth,
      sessionMigrationHealth,
      metrics,
    ] = await Promise.allSettled([
      this.checkSessionManagerHealth(),
      this.checkRedisHealth(),
      this.checkSessionStoreHealth(),
      this.checkSessionReplayHealth(),
      this.checkSessionMigrationHealth(),
      this.collectMetrics(),
    ]);

    const components = {
      sessionManager: this.extractResult(sessionManagerHealth),
      redis: this.extractResult(redisHealth),
      sessionStore: this.extractResult(sessionStoreHealth),
      ...(sessionReplayHealth.status === 'fulfilled' && { sessionReplay: sessionReplayHealth.value }),
      ...(sessionMigrationHealth.status === 'fulfilled' && { sessionMigration: sessionMigrationHealth.value }),
    };

    const healthMetrics = metrics.status === 'fulfilled' ? metrics.value : this.getDefaultMetrics();
    const alerts = this.config.enableAlerts ? this.generateAlerts(components, healthMetrics) : undefined;

    const overall = this.calculateOverallHealth(components);

    return {
      overall,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      components,
      metrics: healthMetrics,
      alerts,
    };
  }

  /**
   * Get health check endpoints for HTTP server
   */
  getHealthCheckEndpoints(): HealthCheckEndpoint[] {
    return [
      {
        path: '/health',
        handler: async () => {
          const health = await this.getHealthStatus();
          return {
            status: health.overall,
            timestamp: health.timestamp,
            uptime: health.uptime,
          };
        },
        description: 'Basic health status',
      },
      {
        path: '/health/detailed',
        handler: async () => this.getHealthStatus(),
        description: 'Detailed health information',
      },
      {
        path: '/health/metrics',
        handler: async () => {
          const health = await this.getHealthStatus();
          return health.metrics;
        },
        description: 'Performance and system metrics',
      },
      {
        path: '/health/components',
        handler: async () => {
          const health = await this.getHealthStatus();
          return health.components;
        },
        description: 'Individual component health status',
      },
      {
        path: '/health/redis',
        handler: async () => this.checkRedisHealth(),
        description: 'Redis-specific health information',
      },
      {
        path: '/health/sessions',
        handler: async () => {
          if (!this.sessionManager) {
            throw new Error('SessionManager not initialized');
          }
          return this.sessionManager.getStats();
        },
        description: 'Session statistics',
      },
    ];
  }

  /**
   * Record response time for performance metrics
   */
  recordResponseTime(responseTime: number): void {
    this.responseTimeBuffer.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer.shift();
    }

    this.totalRequests++;
  }

  /**
   * Record error for error rate calculation
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthTimer = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        this.emit('health:check', health);

        // Emit alerts if any
        if (health.alerts && health.alerts.length > 0) {
          health.alerts.forEach(alert => {
            this.emit('health:alert', alert);
          });
        }

        // Store metrics for comparison
        this.lastMetrics = health.metrics;
      } catch (error) {
        this.emit('health:error', error);
      }
    }, this.config.checkInterval);
  }

  /**
   * Check Session Manager health
   */
  private async checkSessionManagerHealth(): Promise<ComponentHealth> {
    if (!this.sessionManager) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'SessionManager not initialized' },
      };
    }

    const startTime = Date.now();
    try {
      const health = await this.sessionManager.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'critical',
        latency,
        errorRate: this.calculateErrorRate(),
        lastCheck: new Date().toISOString(),
        details: {
          activeSessions: health.activeSessions,
          storeHealth: health.store,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: this.calculateErrorRate(),
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<ComponentHealth> {
    if (!this.redis) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'Redis client not initialized' },
      };
    }

    const startTime = Date.now();
    try {
      // Ping Redis
      await this.redis.ping();
      const latency = Date.now() - startTime;

      // Get Redis info
      const info = await this.redis.info();
      const parsedInfo = this.parseRedisInfo(info);

      const status = latency > this.config.redisTimeoutThreshold ? 'warning' : 'healthy';

      return {
        status,
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: {
          memoryUsage: parsedInfo.used_memory_human,
          connectedClients: parsedInfo.connected_clients,
          version: parsedInfo.redis_version,
          uptime: parsedInfo.uptime_in_seconds,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check Session Store health
   */
  private async checkSessionStoreHealth(): Promise<ComponentHealth> {
    if (!this.sessionStore) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'SessionStore not initialized' },
      };
    }

    const startTime = Date.now();
    try {
      const health = await this.sessionStore.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'critical',
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: health,
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check Session Replay health
   */
  private async checkSessionReplayHealth(): Promise<ComponentHealth | undefined> {
    if (!this.sessionReplay) {
      return undefined;
    }

    const startTime = Date.now();
    try {
      // Get replay stats as health indicator
      const stats = await this.sessionReplay.getReplayStats();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: {
          totalSessions: stats.totalSessions,
          totalFrames: stats.totalFrames,
          storageUsed: stats.storageUsed,
        },
      };
    } catch (error) {
      return {
        status: 'warning',
        latency: Date.now() - startTime,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check Session Migration health
   */
  private async checkSessionMigrationHealth(): Promise<ComponentHealth | undefined> {
    if (!this.sessionMigration) {
      return undefined;
    }

    return {
      status: 'healthy',
      latency: 0,
      errorRate: 0,
      lastCheck: new Date().toISOString(),
      details: {
        note: 'SessionMigration health monitoring not implemented',
      },
    };
  }

  /**
   * Collect comprehensive metrics
   */
  private async collectMetrics(): Promise<HealthMetrics> {
    const [sessionStats, redisMetrics] = await Promise.allSettled([
      this.collectSessionMetrics(),
      this.collectRedisMetrics(),
    ]);

    return {
      sessions: sessionStats.status === 'fulfilled' ? sessionStats.value : this.getDefaultSessionMetrics(),
      redis: redisMetrics.status === 'fulfilled' ? redisMetrics.value : this.getDefaultRedisMetrics(),
      system: this.collectSystemMetrics(),
      performance: this.collectPerformanceMetrics(),
    };
  }

  /**
   * Collect session metrics
   */
  private async collectSessionMetrics(): Promise<HealthMetrics['sessions']> {
    if (!this.sessionManager) {
      return this.getDefaultSessionMetrics();
    }

    try {
      const stats = await this.sessionManager.getStats();
      const activeSessions = await this.sessionManager.listActiveSessions();

      return {
        active: activeSessions.length,
        total: stats.activeSessions || 0,
        averageAge: 0, // Would need to calculate from session timestamps
        eventsPerSecond: this.calculateEventsPerSecond(),
      };
    } catch (error) {
      return this.getDefaultSessionMetrics();
    }
  }

  /**
   * Collect Redis metrics
   */
  private async collectRedisMetrics(): Promise<HealthMetrics['redis']> {
    if (!this.redis) {
      return this.getDefaultRedisMetrics();
    }

    try {
      const info = await this.redis.info();
      const parsedInfo = this.parseRedisInfo(info);

      return {
        memoryUsage: parseInt(parsedInfo.used_memory || '0'),
        connectedClients: parseInt(parsedInfo.connected_clients || '0'),
        commandsPerSecond: this.calculateCommandsPerSecond(parsedInfo),
        keyspaceHits: parseInt(parsedInfo.keyspace_hits || '0'),
        keyspaceMisses: parseInt(parsedInfo.keyspace_misses || '0'),
      };
    } catch (error) {
      return this.getDefaultRedisMetrics();
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): HealthMetrics['system'] {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): HealthMetrics['performance'] {
    if (this.responseTimeBuffer.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
      };
    }

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const average = this.responseTimeBuffer.reduce((a, b) => a + b, 0) / this.responseTimeBuffer.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      averageResponseTime: average,
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
      throughput: this.totalRequests / ((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Generate alerts based on thresholds
   */
  private generateAlerts(components: any, metrics: HealthMetrics): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = new Date().toISOString();

    // Memory usage alert
    if (metrics.system.memoryUsage.heapUsed > this.config.memoryThreshold) {
      alerts.push({
        level: 'warning',
        component: 'system',
        message: 'High memory usage detected',
        timestamp,
        value: metrics.system.memoryUsage.heapUsed,
        threshold: this.config.memoryThreshold,
      });
    }

    // Session count alert
    if (metrics.sessions.active > this.config.sessionCountThreshold) {
      alerts.push({
        level: 'warning',
        component: 'sessions',
        message: 'High number of active sessions',
        timestamp,
        value: metrics.sessions.active,
        threshold: this.config.sessionCountThreshold,
      });
    }

    // Error rate alert
    const errorRate = this.calculateErrorRate();
    if (errorRate > this.config.errorRateThreshold) {
      alerts.push({
        level: 'critical',
        component: 'performance',
        message: 'High error rate detected',
        timestamp,
        value: errorRate,
        threshold: this.config.errorRateThreshold,
      });
    }

    // Component-specific alerts
    Object.entries(components).forEach(([componentName, health]) => {
      if (health.status === 'critical') {
        alerts.push({
          level: 'critical',
          component: componentName,
          message: `Component ${componentName} is in critical state`,
          timestamp,
        });
      } else if (health.status === 'warning') {
        alerts.push({
          level: 'warning',
          component: componentName,
          message: `Component ${componentName} is experiencing issues`,
          timestamp,
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(components: Record<string, ComponentHealth>): HealthStatus['overall'] {
    const statuses = Object.values(components).map(c => c.status);

    if (statuses.includes('down')) return 'down';
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  /**
   * Calculate current error rate
   */
  private calculateErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.errorCount / this.totalRequests) * 100;
  }

  /**
   * Calculate events per second
   */
  private calculateEventsPerSecond(): number {
    // This would need to be implemented based on actual event tracking
    return 0;
  }

  /**
   * Calculate commands per second from Redis info
   */
  private calculateCommandsPerSecond(redisInfo: Record<string, string>): number {
    const totalCommands = parseInt(redisInfo.total_commands_processed || '0');
    const uptime = parseInt(redisInfo.uptime_in_seconds || '1');
    return totalCommands / uptime;
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Extract result from PromiseSettledResult
   */
  private extractResult(result: PromiseSettledResult<ComponentHealth>): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'critical',
      latency: 0,
      errorRate: 100,
      lastCheck: new Date().toISOString(),
      details: { error: result.reason?.message || 'Unknown error' },
    };
  }

  /**
   * Get default metrics when collection fails
   */
  private getDefaultMetrics(): HealthMetrics {
    return {
      sessions: this.getDefaultSessionMetrics(),
      redis: this.getDefaultRedisMetrics(),
      system: this.collectSystemMetrics(),
      performance: this.collectPerformanceMetrics(),
    };
  }

  private getDefaultSessionMetrics(): HealthMetrics['sessions'] {
    return {
      active: 0,
      total: 0,
      averageAge: 0,
      eventsPerSecond: 0,
    };
  }

  private getDefaultRedisMetrics(): HealthMetrics['redis'] {
    return {
      memoryUsage: 0,
      connectedClients: 0,
      commandsPerSecond: 0,
      keyspaceHits: 0,
      keyspaceMisses: 0,
    };
  }

  /**
   * Shutdown health check service
   */
  async shutdown(): Promise<void> {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = undefined;
    }

    this.emit('shutdown');
  }
}