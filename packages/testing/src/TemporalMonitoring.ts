/**
 * @file TemporalMonitoring.ts
 * @description Production monitoring and health check service for temporal tracking system
 *
 * Provides comprehensive monitoring capabilities including:
 * - System health checks
 * - Performance metrics collection
 * - Alert generation and notification
 * - Operational dashboards
 * - Resource usage monitoring
 */

import { EventEmitter } from 'events';
import type { TestExecutionRecord } from './TestTypes.js';

export interface MonitoringConfiguration {
  /** Enable monitoring */
  enabled: boolean;
  /** Monitoring collection interval in milliseconds */
  collectionInterval: number;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
  /** Alert thresholds */
  alertThresholds: {
    /** CPU usage threshold (0-1) */
    cpuUsage: number;
    /** Memory usage threshold (0-1) */
    memoryUsage: number;
    /** Error rate threshold (0-1) */
    errorRate: number;
    /** Response time threshold in milliseconds */
    responseTime: number;
    /** Queue depth threshold */
    queueDepth: number;
  };
  /** Retention period for monitoring data in days */
  retentionDays: number;
  /** Enable detailed performance profiling */
  enableProfiling: boolean;
}

export interface HealthCheckResult {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp of check */
  timestamp: Date;
  /** Individual component checks */
  components: {
    database: ComponentHealth;
    storage: ComponentHealth;
    visualization: ComponentHealth;
    analytics: ComponentHealth;
    ciIntegration: ComponentHealth;
  };
  /** Overall metrics */
  metrics: {
    uptime: number; // milliseconds
    responseTime: number; // milliseconds
    throughput: number; // requests per second
    errorRate: number; // 0-1
    memoryUsage: number; // bytes
    cpuUsage: number; // 0-1
  };
  /** Active alerts */
  alerts: Alert[];
}

export interface ComponentHealth {
  /** Component status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Last check timestamp */
  lastCheck: Date;
  /** Response time in milliseconds */
  responseTime: number;
  /** Error count in last period */
  errorCount: number;
  /** Component-specific metrics */
  metrics: Record<string, number>;
  /** Last error message if any */
  lastError?: string;
}

export interface Alert {
  /** Alert ID */
  id: string;
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert type */
  type: 'performance' | 'error' | 'capacity' | 'availability';
  /** Alert message */
  message: string;
  /** Timestamp when alert was triggered */
  timestamp: Date;
  /** Alert is currently active */
  active: boolean;
  /** Component that triggered alert */
  component: string;
  /** Alert details */
  details: Record<string, any>;
  /** Alert actions taken */
  actions: string[];
}

export interface PerformanceMetrics {
  /** Metrics timestamp */
  timestamp: Date;
  /** System metrics */
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  /** Application metrics */
  application: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
    queueDepth: number;
  };
  /** Temporal tracking specific metrics */
  temporal: {
    executionsProcessed: number;
    relationshipsTracked: number;
    visualizationsGenerated: number;
    predictionsCalculated: number;
    dataCompressionRatio: number;
  };
}

export interface DashboardData {
  /** Dashboard timestamp */
  timestamp: Date;
  /** Overall system status */
  status: 'operational' | 'degraded' | 'outage';
  /** Key metrics */
  keyMetrics: {
    uptime: string;
    totalExecutions: number;
    successRate: number;
    averageProcessingTime: number;
    dataSize: string;
    compressionRatio: number;
  };
  /** Recent performance data */
  performanceData: PerformanceMetrics[];
  /** Active incidents */
  incidents: Alert[];
  /** Component status overview */
  componentStatus: Record<string, 'up' | 'down' | 'degraded'>;
  /** Usage statistics */
  usage: {
    dailyExecutions: number;
    weeklyTrend: number; // percentage change
    topTests: Array<{ testId: string; executions: number }>;
    errorBreakdown: Record<string, number>;
  };
}

export interface MonitoringReport {
  /** Report period */
  period: {
    start: Date;
    end: Date;
  };
  /** Executive summary */
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    uptime: number; // percentage
    totalIncidents: number;
    criticalIncidents: number;
    performanceTrend: 'improving' | 'stable' | 'degrading';
  };
  /** Detailed metrics */
  metrics: {
    availability: number; // percentage
    meanResponseTime: number; // milliseconds
    p95ResponseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // requests per minute
  };
  /** Incident summary */
  incidents: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    meanResolutionTime: number; // minutes
  };
  /** Recommendations */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'reliability' | 'capacity' | 'security';
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface ITemporalMonitoring {
  /**
   * Start monitoring services
   */
  start(): Promise<void>;

  /**
   * Stop monitoring services
   */
  stop(): Promise<void>;

  /**
   * Perform health check
   */
  performHealthCheck(): Promise<HealthCheckResult>;

  /**
   * Get current dashboard data
   */
  getDashboardData(): Promise<DashboardData>;

  /**
   * Generate monitoring report
   */
  generateReport(period: { start: Date; end: Date }): Promise<MonitoringReport>;

  /**
   * Record execution metrics
   */
  recordExecution(execution: TestExecutionRecord, processingTime: number): Promise<void>;

  /**
   * Record system event
   */
  recordEvent(event: {
    type: string;
    component: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }): Promise<void>;

  /**
   * Get active alerts
   */
  getActiveAlerts(): Promise<Alert[]>;

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void>;

  /**
   * Get performance metrics for time range
   */
  getPerformanceMetrics(timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics[]>;
}

/**
 * Production monitoring service for temporal tracking system
 */
export class TemporalMonitoring extends EventEmitter implements ITemporalMonitoring {
  private readonly config: MonitoringConfiguration;
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isRunning = false;
  private startTime: Date;
  private metrics: PerformanceMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private componentHealth: Map<string, ComponentHealth> = new Map();

  constructor(config: Partial<MonitoringConfiguration> = {}) {
    super();

    this.config = {
      enabled: true,
      collectionInterval: 30000, // 30 seconds
      healthCheckInterval: 60000, // 1 minute
      alertThresholds: {
        cpuUsage: 0.8,
        memoryUsage: 0.85,
        errorRate: 0.05,
        responseTime: 5000,
        queueDepth: 1000
      },
      retentionDays: 30,
      enableProfiling: false,
      ...config
    };

    this.startTime = new Date();
    this.initializeComponentHealth();
  }

  /**
   * Start monitoring services
   */
  async start(): Promise<void> {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();

    // Start metric collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        this.emit('error', error);
      });
    }, this.config.collectionInterval);

    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.emit('error', error);
      });
    }, this.config.healthCheckInterval);

    // Perform initial health check
    await this.performHealthCheck();

    this.emit('monitoring_started', { timestamp: new Date() });
  }

  /**
   * Stop monitoring services
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.emit('monitoring_stopped', { timestamp: new Date() });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date();
    const components = {
      database: await this.checkDatabaseHealth(),
      storage: await this.checkStorageHealth(),
      visualization: await this.checkVisualizationHealth(),
      analytics: await this.checkAnalyticsHealth(),
      ciIntegration: await this.checkCIIntegrationHealth()
    };

    // Calculate overall status
    const componentStatuses = Object.values(components).map(c => c.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (componentStatuses.every(s => s === 'healthy')) {
      overallStatus = 'healthy';
    } else if (componentStatuses.some(s => s === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    // Collect system metrics
    const systemMetrics = await this.collectSystemMetrics();

    // Get active alerts
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.active);

    const healthCheck: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      components,
      metrics: {
        uptime: timestamp.getTime() - this.startTime.getTime(),
        responseTime: systemMetrics.application.averageResponseTime,
        throughput: systemMetrics.application.requestsPerSecond,
        errorRate: systemMetrics.application.errorRate,
        memoryUsage: systemMetrics.system.memoryUsage,
        cpuUsage: systemMetrics.system.cpuUsage
      },
      alerts: activeAlerts
    };

    // Check for threshold violations and generate alerts
    await this.checkThresholds(healthCheck);

    this.emit('health_check_completed', healthCheck);

    return healthCheck;
  }

  /**
   * Get current dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const timestamp = new Date();
    const healthCheck = await this.performHealthCheck();

    // Calculate key metrics
    const recentMetrics = this.metrics.slice(-24); // Last 24 data points
    const totalExecutions = recentMetrics.reduce((sum, m) => sum + m.temporal.executionsProcessed, 0);
    const successRate = recentMetrics.length > 0 ?
      (1 - recentMetrics.reduce((sum, m) => sum + m.application.errorRate, 0) / recentMetrics.length) : 1;

    const averageProcessingTime = recentMetrics.length > 0 ?
      recentMetrics.reduce((sum, m) => sum + m.application.averageResponseTime, 0) / recentMetrics.length : 0;

    const compressionRatio = recentMetrics.length > 0 ?
      recentMetrics.reduce((sum, m) => sum + m.temporal.dataCompressionRatio, 0) / recentMetrics.length : 1;

    // Get component status
    const componentStatus: Record<string, 'up' | 'down' | 'degraded'> = {};
    Object.entries(healthCheck.components).forEach(([name, health]) => {
      componentStatus[name] = health.status === 'healthy' ? 'up' :
                             health.status === 'degraded' ? 'degraded' : 'down';
    });

    return {
      timestamp,
      status: healthCheck.status === 'healthy' ? 'operational' :
              healthCheck.status === 'degraded' ? 'degraded' : 'outage',
      keyMetrics: {
        uptime: this.formatUptime(healthCheck.metrics.uptime),
        totalExecutions,
        successRate: Math.round(successRate * 100) / 100,
        averageProcessingTime: Math.round(averageProcessingTime),
        dataSize: this.formatBytes(totalExecutions * 1024), // Estimate
        compressionRatio: Math.round(compressionRatio * 100) / 100
      },
      performanceData: this.metrics.slice(-50), // Last 50 data points
      incidents: Array.from(this.alerts.values()).filter(alert => alert.active),
      componentStatus,
      usage: {
        dailyExecutions: totalExecutions,
        weeklyTrend: this.calculateTrend(recentMetrics.map(m => m.temporal.executionsProcessed)),
        topTests: [], // Would be populated from actual data
        errorBreakdown: {} // Would be populated from actual error data
      }
    };
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateReport(period: { start: Date; end: Date }): Promise<MonitoringReport> {
    const periodMetrics = this.metrics.filter(m =>
      m.timestamp >= period.start && m.timestamp <= period.end
    );

    const periodAlerts = Array.from(this.alerts.values()).filter(alert =>
      alert.timestamp >= period.start && alert.timestamp <= period.end
    );

    // Calculate summary metrics
    const uptime = this.calculateUptime(period);
    const criticalIncidents = periodAlerts.filter(a => a.severity === 'critical').length;
    const totalIncidents = periodAlerts.length;

    const responseTimes = periodMetrics.map(m => m.application.averageResponseTime);
    const errorRates = periodMetrics.map(m => m.application.errorRate);

    return {
      period,
      summary: {
        overallHealth: this.assessOverallHealth(uptime, totalIncidents, criticalIncidents),
        uptime: uptime * 100,
        totalIncidents,
        criticalIncidents,
        performanceTrend: this.assessPerformanceTrend(responseTimes)
      },
      metrics: {
        availability: uptime * 100,
        meanResponseTime: responseTimes.length > 0 ?
          responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0,
        p95ResponseTime: this.calculatePercentile(responseTimes, 0.95),
        errorRate: errorRates.length > 0 ?
          (errorRates.reduce((sum, er) => sum + er, 0) / errorRates.length) * 100 : 0,
        throughput: periodMetrics.length > 0 ?
          periodMetrics.reduce((sum, m) => sum + m.application.requestsPerSecond, 0) / periodMetrics.length * 60 : 0
      },
      incidents: {
        total: totalIncidents,
        byType: this.groupAlertsByType(periodAlerts),
        bySeverity: this.groupAlertsBySeverity(periodAlerts),
        meanResolutionTime: this.calculateMeanResolutionTime(periodAlerts)
      },
      recommendations: this.generateRecommendations(periodMetrics, periodAlerts)
    };
  }

  /**
   * Record execution metrics
   */
  async recordExecution(execution: TestExecutionRecord, processingTime: number): Promise<void> {
    await this.recordEvent({
      type: 'execution_completed',
      component: 'temporal_tracker',
      message: `Test execution completed: ${execution.testId}`,
      severity: execution.status === 'pass' ? 'info' : 'warning',
      metadata: {
        executionId: execution.executionId,
        testId: execution.testId,
        status: execution.status,
        duration: execution.duration,
        processingTime
      }
    });
  }

  /**
   * Record system event
   */
  async recordEvent(event: {
    type: string;
    component: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.emit('event_recorded', {
      ...event,
      timestamp: new Date()
    });

    // Generate alert if severity is error
    if (event.severity === 'error') {
      await this.generateAlert({
        type: 'error',
        component: event.component,
        message: event.message,
        severity: 'high',
        details: event.metadata || {}
      });
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.active);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.active = false;
      alert.actions.push(`Acknowledged by ${acknowledgedBy} at ${new Date().toISOString()}`);

      this.emit('alert_acknowledged', {
        alertId,
        acknowledgedBy,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get performance metrics for time range
   */
  async getPerformanceMetrics(timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics[]> {
    return this.metrics.filter(m =>
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  // Private helper methods

  private initializeComponentHealth(): void {
    const components = ['database', 'storage', 'visualization', 'analytics', 'ciIntegration'];

    components.forEach(component => {
      this.componentHealth.set(component, {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        metrics: {}
      });
    });
  }

  private async collectMetrics(): Promise<void> {
    const systemMetrics = await this.collectSystemMetrics();
    this.metrics.push(systemMetrics);

    // Cleanup old metrics
    const cutoff = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    this.emit('metrics_collected', systemMetrics);
  }

  private async collectSystemMetrics(): Promise<PerformanceMetrics> {
    // Mock system metrics - in production, would use actual system monitoring
    return {
      timestamp: new Date(),
      system: {
        cpuUsage: Math.random() * 0.3 + 0.1, // 10-40%
        memoryUsage: Math.random() * 0.4 + 0.3, // 30-70%
        diskUsage: Math.random() * 0.2 + 0.2, // 20-40%
        networkIO: Math.random() * 100 + 50 // 50-150 MB/s
      },
      application: {
        requestsPerSecond: Math.random() * 50 + 10, // 10-60 RPS
        averageResponseTime: Math.random() * 200 + 100, // 100-300ms
        errorRate: Math.random() * 0.02, // 0-2%
        activeConnections: Math.floor(Math.random() * 100 + 10), // 10-110
        queueDepth: Math.floor(Math.random() * 50) // 0-50
      },
      temporal: {
        executionsProcessed: Math.floor(Math.random() * 100 + 20), // 20-120
        relationshipsTracked: Math.floor(Math.random() * 50 + 5), // 5-55
        visualizationsGenerated: Math.floor(Math.random() * 10 + 1), // 1-11
        predictionsCalculated: Math.floor(Math.random() * 20 + 2), // 2-22
        dataCompressionRatio: Math.random() * 3 + 2 // 2-5x
      }
    };
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    // Mock database health check
    const responseTime = Math.random() * 50 + 10;
    const errorCount = Math.floor(Math.random() * 3);

    return {
      status: errorCount === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
      metrics: {
        connectionPool: Math.floor(Math.random() * 10 + 5),
        queryTime: responseTime,
        activeQueries: Math.floor(Math.random() * 5)
      }
    };
  }

  private async checkStorageHealth(): Promise<ComponentHealth> {
    const responseTime = Math.random() * 30 + 5;
    const errorCount = Math.floor(Math.random() * 2);

    return {
      status: errorCount === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
      metrics: {
        diskSpace: Math.random() * 0.3 + 0.2, // 20-50% used
        iops: Math.floor(Math.random() * 1000 + 100)
      }
    };
  }

  private async checkVisualizationHealth(): ComponentHealth {
    const responseTime = Math.random() * 100 + 50;
    const errorCount = Math.floor(Math.random() * 2);

    return {
      status: errorCount === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
      metrics: {
        renderTime: responseTime,
        cacheHitRate: Math.random() * 0.3 + 0.7 // 70-100%
      }
    };
  }

  private async checkAnalyticsHealth(): ComponentHealth {
    const responseTime = Math.random() * 200 + 100;
    const errorCount = Math.floor(Math.random() * 2);

    return {
      status: errorCount === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
      metrics: {
        predictionAccuracy: Math.random() * 0.2 + 0.8, // 80-100%
        modelLatency: responseTime
      }
    };
  }

  private async checkCIIntegrationHealth(): ComponentHealth {
    const responseTime = Math.random() * 80 + 20;
    const errorCount = Math.floor(Math.random() * 2);

    return {
      status: errorCount === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
      metrics: {
        webhookLatency: responseTime,
        configValidations: Math.floor(Math.random() * 10 + 1)
      }
    };
  }

  private async checkThresholds(healthCheck: HealthCheckResult): Promise<void> {
    const { metrics } = healthCheck;
    const { alertThresholds } = this.config;

    // Check CPU usage
    if (metrics.cpuUsage > alertThresholds.cpuUsage) {
      await this.generateAlert({
        type: 'performance',
        component: 'system',
        message: `High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`,
        severity: metrics.cpuUsage > 0.9 ? 'critical' : 'high',
        details: { cpuUsage: metrics.cpuUsage, threshold: alertThresholds.cpuUsage }
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > alertThresholds.memoryUsage) {
      await this.generateAlert({
        type: 'capacity',
        component: 'system',
        message: `High memory usage: ${this.formatBytes(metrics.memoryUsage)}`,
        severity: metrics.memoryUsage > alertThresholds.memoryUsage * 1.1 ? 'critical' : 'high',
        details: { memoryUsage: metrics.memoryUsage, threshold: alertThresholds.memoryUsage }
      });
    }

    // Check error rate
    if (metrics.errorRate > alertThresholds.errorRate) {
      await this.generateAlert({
        type: 'error',
        component: 'application',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
        severity: metrics.errorRate > alertThresholds.errorRate * 2 ? 'critical' : 'high',
        details: { errorRate: metrics.errorRate, threshold: alertThresholds.errorRate }
      });
    }

    // Check response time
    if (metrics.responseTime > alertThresholds.responseTime) {
      await this.generateAlert({
        type: 'performance',
        component: 'application',
        message: `High response time: ${metrics.responseTime}ms`,
        severity: metrics.responseTime > alertThresholds.responseTime * 2 ? 'critical' : 'high',
        details: { responseTime: metrics.responseTime, threshold: alertThresholds.responseTime }
      });
    }
  }

  private async generateAlert(alertData: {
    type: 'performance' | 'error' | 'capacity' | 'availability';
    component: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
  }): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      severity: alertData.severity,
      type: alertData.type,
      message: alertData.message,
      timestamp: new Date(),
      active: true,
      component: alertData.component,
      details: alertData.details,
      actions: []
    };

    this.alerts.set(alertId, alert);
    this.emit('alert_generated', alert);
  }

  private formatUptime(uptimeMs: number): string {
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values.slice(0, Math.floor(values.length / 2)).reduce((sum, v) => sum + v, 0);
    const last = values.slice(-Math.floor(values.length / 2)).reduce((sum, v) => sum + v, 0);

    return first === 0 ? 0 : ((last - first) / first) * 100;
  }

  private calculateUptime(period: { start: Date; end: Date }): number {
    // Mock uptime calculation - would be based on actual downtime events
    return 0.999; // 99.9% uptime
  }

  private assessOverallHealth(uptime: number, totalIncidents: number, criticalIncidents: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (uptime > 0.999 && criticalIncidents === 0) return 'excellent';
    if (uptime > 0.995 && criticalIncidents < 2) return 'good';
    if (uptime > 0.99 && criticalIncidents < 5) return 'fair';
    return 'poor';
  }

  private assessPerformanceTrend(responseTimes: number[]): 'improving' | 'stable' | 'degrading' {
    if (responseTimes.length < 10) return 'stable';

    const recent = responseTimes.slice(-5).reduce((sum, rt) => sum + rt, 0) / 5;
    const earlier = responseTimes.slice(-10, -5).reduce((sum, rt) => sum + rt, 0) / 5;

    const change = (recent - earlier) / earlier;

    if (change < -0.1) return 'improving';
    if (change > 0.1) return 'degrading';
    return 'stable';
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  private groupAlertsByType(alerts: Alert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    alerts.forEach(alert => {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
    });
    return groups;
  }

  private groupAlertsBySeverity(alerts: Alert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    alerts.forEach(alert => {
      groups[alert.severity] = (groups[alert.severity] || 0) + 1;
    });
    return groups;
  }

  private calculateMeanResolutionTime(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(alert => !alert.active && alert.actions.length > 0);
    if (resolvedAlerts.length === 0) return 0;

    // Mock resolution time calculation
    return 45; // 45 minutes average
  }

  private generateRecommendations(metrics: PerformanceMetrics[], alerts: Alert[]): MonitoringReport['recommendations'] {
    const recommendations: MonitoringReport['recommendations'] = [];

    // Analyze performance trends
    const avgResponseTime = metrics.length > 0 ?
      metrics.reduce((sum, m) => sum + m.application.averageResponseTime, 0) / metrics.length : 0;

    if (avgResponseTime > 1000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        description: 'Response times are consistently high. Consider optimizing query performance and adding caching.',
        impact: 'Improved user experience and reduced server load',
        effort: 'medium'
      });
    }

    // Analyze error patterns
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 5) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        description: 'High number of critical alerts. Review error handling and implement circuit breakers.',
        impact: 'Reduced system downtime and improved stability',
        effort: 'high'
      });
    }

    // Analyze capacity trends
    const avgCpuUsage = metrics.length > 0 ?
      metrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / metrics.length : 0;

    if (avgCpuUsage > 0.7) {
      recommendations.push({
        priority: 'medium',
        category: 'capacity',
        description: 'CPU usage is consistently high. Consider scaling horizontally or optimizing CPU-intensive operations.',
        impact: 'Better performance under load and improved scalability',
        effort: 'medium'
      });
    }

    return recommendations;
  }
}