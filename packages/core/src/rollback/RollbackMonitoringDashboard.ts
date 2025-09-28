/**
 * Rollback monitoring dashboard with metrics collection and alerting
 */

import { EventEmitter } from 'events';
import { RollbackManager } from './RollbackManager.js';
import {
  RollbackMetrics,
  RollbackOperation,
  RollbackPoint,
} from './RollbackTypes.js';

export interface DashboardConfig {
  metricsInterval: number; // milliseconds
  alertThresholds: {
    maxFailureRate: number; // percentage
    maxAverageTime: number; // milliseconds
    maxMemoryUsage: number; // bytes
    maxPendingOperations: number;
  };
  retentionPeriod: number; // milliseconds
  enableAlerting: boolean;
}

export interface MetricSnapshot {
  timestamp: Date;
  metrics: RollbackMetrics;
  activeOperations: number;
  pendingOperations: number;
  recentFailures: number;
  memoryPressure: number; // 0-100 percentage
}

export interface Alert {
  id: string;
  type: 'failure_rate' | 'performance' | 'memory' | 'capacity';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DashboardSummary {
  uptime: number; // milliseconds
  totalRollbackPoints: number;
  totalOperations: number;
  successRate: number; // percentage
  averageOperationTime: number; // milliseconds
  currentMemoryUsage: number; // bytes
  activeAlerts: Alert[];
  recentMetrics: MetricSnapshot[];
  healthStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Real-time monitoring dashboard for rollback operations
 */
export class RollbackMonitoringDashboard extends EventEmitter {
  private manager: RollbackManager;
  private config: DashboardConfig;
  private metrics: MetricSnapshot[] = [];
  private alerts: Alert[] = [];
  private metricsTimer?: NodeJS.Timeout;
  private startTime: Date;
  private lastCleanup: Date;

  constructor(manager: RollbackManager, config: Partial<DashboardConfig> = {}) {
    super();

    this.manager = manager;
    this.config = {
      metricsInterval: 30000, // 30 seconds
      alertThresholds: {
        maxFailureRate: 10, // 10%
        maxAverageTime: 5000, // 5 seconds
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxPendingOperations: 50,
      },
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enableAlerting: true,
      ...config,
    };

    this.startTime = new Date();
    this.lastCleanup = new Date();

    this.setupEventListeners();
  }

  /**
   * Start monitoring and metrics collection
   */
  start(): void {
    // Collect initial metrics
    this.collectMetrics();

    // Start periodic metrics collection
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.cleanupOldData();
    }, this.config.metricsInterval);

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Get current dashboard summary
   */
  getSummary(): DashboardSummary {
    const currentMetrics = this.manager.getMetrics();
    const activeAlerts = this.alerts.filter((alert) => !alert.resolved);
    const uptime = Date.now() - this.startTime.getTime();

    // Calculate health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some((alert) => alert.severity === 'critical')) {
      healthStatus = 'critical';
    } else if (activeAlerts.length > 0) {
      healthStatus = 'warning';
    }

    // Get recent metrics (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= oneHourAgo);

    return {
      uptime,
      totalRollbackPoints: currentMetrics.totalRollbackPoints,
      totalOperations:
        currentMetrics.successfulRollbacks + currentMetrics.failedRollbacks,
      successRate: this.calculateSuccessRate(currentMetrics),
      averageOperationTime: currentMetrics.averageRollbackTime,
      currentMemoryUsage: currentMetrics.memoryUsage,
      activeAlerts,
      recentMetrics: recentMetrics.slice(-60), // Last 60 snapshots
      healthStatus,
    };
  }

  /**
   * Get detailed metrics for a time range
   */
  getMetricsForTimeRange(startTime: Date, endTime: Date): MetricSnapshot[] {
    return this.metrics.filter(
      (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Get all alerts with optional filtering
   */
  getAlerts(
    options: {
      type?: Alert['type'];
      severity?: Alert['severity'];
      resolved?: boolean;
      since?: Date;
    } = {}
  ): Alert[] {
    return this.alerts.filter((alert) => {
      if (options.type && alert.type !== options.type) return false;
      if (options.severity && alert.severity !== options.severity) return false;
      if (options.resolved !== undefined && alert.resolved !== options.resolved)
        return false;
      if (options.since && alert.timestamp < options.since) return false;
      return true;
    });
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert-resolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): {
    operationTimes: Array<{ timestamp: Date; averageTime: number }>;
    memoryUsage: Array<{ timestamp: Date; usage: number }>;
    successRates: Array<{ timestamp: Date; rate: number }>;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantMetrics = this.metrics.filter((m) => m.timestamp >= cutoff);

    return {
      operationTimes: relevantMetrics.map((m) => ({
        timestamp: m.timestamp,
        averageTime: m.metrics.averageRollbackTime,
      })),
      memoryUsage: relevantMetrics.map((m) => ({
        timestamp: m.timestamp,
        usage: m.metrics.memoryUsage,
      })),
      successRates: relevantMetrics.map((m) => ({
        timestamp: m.timestamp,
        rate: this.calculateSuccessRate(m.metrics),
      })),
    };
  }

  /**
   * Export dashboard data for external monitoring systems
   */
  exportMetrics(format: 'prometheus' | 'json' = 'json'): string {
    const summary = this.getSummary();

    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(summary);
    }

    return JSON.stringify(
      {
        dashboard_summary: summary,
        recent_metrics: this.metrics.slice(-10),
        active_alerts: this.alerts.filter((a) => !a.resolved),
      },
      null,
      2
    );
  }

  /**
   * Setup event listeners for rollback manager events
   */
  private setupEventListeners(): void {
    this.manager.on('rollback-point-created', () => {
      this.collectMetrics();
    });

    this.manager.on('rollback-completed', (operation: RollbackOperation) => {
      this.collectMetrics();
      this.checkOperationPerformance(operation);
    });

    this.manager.on('rollback-failed', (operation: RollbackOperation) => {
      this.collectMetrics();
      this.handleFailure(operation);
    });

    this.manager.on('cleanup-completed', () => {
      this.collectMetrics();
    });
  }

  /**
   * Collect current metrics snapshot
   */
  private async collectMetrics(): Promise<void> {
    try {
      const baseMetrics = this.manager.getMetrics();
      const allPoints = await this.manager.getAllRollbackPoints();

      // Count active operations (this would need to be exposed by RollbackManager)
      const activeOperations = 0; // Placeholder - would need to access active operations
      const pendingOperations = 0; // Placeholder

      // Calculate recent failures (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailures = this.alerts.filter(
        (alert) =>
          alert.type === 'failure_rate' && alert.timestamp >= oneHourAgo
      ).length;

      // Calculate memory pressure percentage
      const memoryPressure = Math.min(
        100,
        (baseMetrics.memoryUsage / this.config.alertThresholds.maxMemoryUsage) *
          100
      );

      const snapshot: MetricSnapshot = {
        timestamp: new Date(),
        metrics: baseMetrics,
        activeOperations,
        pendingOperations,
        recentFailures,
        memoryPressure,
      };

      this.metrics.push(snapshot);
      this.emit('metrics-collected', snapshot);
    } catch (error) {
      this.emit('metrics-collection-error', error);
    }
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    if (!this.config.enableAlerting) return;

    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    // Check failure rate
    const successRate = this.calculateSuccessRate(currentMetrics.metrics);
    const failureRate = 100 - successRate;
    if (failureRate > this.config.alertThresholds.maxFailureRate) {
      this.createAlert(
        'failure_rate',
        'critical',
        `High failure rate: ${failureRate.toFixed(1)}%`,
        { failureRate, threshold: this.config.alertThresholds.maxFailureRate }
      );
    }

    // Check average operation time
    if (
      currentMetrics.metrics.averageRollbackTime >
      this.config.alertThresholds.maxAverageTime
    ) {
      this.createAlert(
        'performance',
        'warning',
        `Slow rollback operations: ${currentMetrics.metrics.averageRollbackTime}ms average`,
        {
          averageTime: currentMetrics.metrics.averageRollbackTime,
          threshold: this.config.alertThresholds.maxAverageTime,
        }
      );
    }

    // Check memory usage
    if (
      currentMetrics.metrics.memoryUsage >
      this.config.alertThresholds.maxMemoryUsage
    ) {
      this.createAlert(
        'memory',
        'warning',
        `High memory usage: ${(
          currentMetrics.metrics.memoryUsage /
          1024 /
          1024
        ).toFixed(1)}MB`,
        {
          memoryUsage: currentMetrics.metrics.memoryUsage,
          threshold: this.config.alertThresholds.maxMemoryUsage,
        }
      );
    }

    // Check pending operations
    if (
      currentMetrics.pendingOperations >
      this.config.alertThresholds.maxPendingOperations
    ) {
      this.createAlert(
        'capacity',
        'critical',
        `Too many pending operations: ${currentMetrics.pendingOperations}`,
        {
          pendingOperations: currentMetrics.pendingOperations,
          threshold: this.config.alertThresholds.maxPendingOperations,
        }
      );
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    data: Record<string, any>
  ): void {
    // Check if similar alert already exists
    const existingSimilarAlert = this.alerts.find(
      (alert) =>
        !alert.resolved && alert.type === type && alert.severity === severity
    );

    if (existingSimilarAlert) {
      // Update existing alert data
      existingSimilarAlert.data = { ...existingSimilarAlert.data, ...data };
      return;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      data,
      resolved: false,
    };

    this.alerts.push(alert);
    this.emit('alert-created', alert);
  }

  /**
   * Handle operation failure
   */
  private handleFailure(operation: RollbackOperation): void {
    this.createAlert(
      'failure_rate',
      'warning',
      `Rollback operation failed: ${operation.error}`,
      { operationId: operation.id, error: operation.error }
    );
  }

  /**
   * Check individual operation performance
   */
  private checkOperationPerformance(operation: RollbackOperation): void {
    if (operation.startedAt && operation.completedAt) {
      const duration =
        operation.completedAt.getTime() - operation.startedAt.getTime();

      if (duration > this.config.alertThresholds.maxAverageTime * 2) {
        this.createAlert(
          'performance',
          'warning',
          `Slow rollback operation: ${duration}ms`,
          { operationId: operation.id, duration }
        );
      }
    }
  }

  /**
   * Calculate success rate from metrics
   */
  private calculateSuccessRate(metrics: RollbackMetrics): number {
    const total = metrics.successfulRollbacks + metrics.failedRollbacks;
    if (total === 0) return 100;
    return (metrics.successfulRollbacks / total) * 100;
  }

  /**
   * Clean up old metrics and resolved alerts
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const cutoff = new Date(now - this.config.retentionPeriod);

    // Clean up old metrics
    this.metrics = this.metrics.filter((metric) => metric.timestamp >= cutoff);

    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(
      (alert) =>
        !alert.resolved || (alert.resolvedAt && alert.resolvedAt >= cutoff)
    );

    this.lastCleanup = new Date();
  }

  /**
   * Format metrics for Prometheus exposition format
   */
  private formatPrometheusMetrics(summary: DashboardSummary): string {
    const lines: string[] = [];

    // Basic metrics
    lines.push(`# HELP rollback_total_points Total number of rollback points`);
    lines.push(`# TYPE rollback_total_points gauge`);
    lines.push(`rollback_total_points ${summary.totalRollbackPoints}`);

    lines.push(`# HELP rollback_success_rate Success rate percentage`);
    lines.push(`# TYPE rollback_success_rate gauge`);
    lines.push(`rollback_success_rate ${summary.successRate}`);

    lines.push(
      `# HELP rollback_average_time_ms Average operation time in milliseconds`
    );
    lines.push(`# TYPE rollback_average_time_ms gauge`);
    lines.push(`rollback_average_time_ms ${summary.averageOperationTime}`);

    lines.push(
      `# HELP rollback_memory_usage_bytes Current memory usage in bytes`
    );
    lines.push(`# TYPE rollback_memory_usage_bytes gauge`);
    lines.push(`rollback_memory_usage_bytes ${summary.currentMemoryUsage}`);

    lines.push(`# HELP rollback_active_alerts Number of active alerts`);
    lines.push(`# TYPE rollback_active_alerts gauge`);
    lines.push(`rollback_active_alerts ${summary.activeAlerts.length}`);

    lines.push(`# HELP rollback_uptime_seconds Uptime in seconds`);
    lines.push(`# TYPE rollback_uptime_seconds counter`);
    lines.push(`rollback_uptime_seconds ${Math.floor(summary.uptime / 1000)}`);

    return lines.join('\n') + '\n';
  }
}
