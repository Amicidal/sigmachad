/**
 * Session Metrics and Monitoring Service
 *
 * Provides comprehensive monitoring, alerting, and observability for Redis sessions
 * with Prometheus metrics, distributed tracing, and health dashboards
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionError,
} from './SessionTypes.js';

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
  value?: number;
  buckets?: number[];
}

export interface MetricsConfig {
  enablePrometheus: boolean;
  enableTracing: boolean;
  enableAlerting: boolean;
  metricsPort: number;
  metricsPath: string;
  collectionInterval: number; // milliseconds
  retentionDays: number;
  alertRules: AlertRule[];
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  metadata: Record<string, any>;
}

export interface SessionMetricsSnapshot {
  timestamp: string;
  activeSessions: number;
  totalEvents: number;
  eventRate: number; // events per second
  sessionCreationRate: number; // sessions per second
  averageSessionDuration: number;
  connectionPoolStats: {
    totalConnections: number;
    activeConnections: number;
    queuedRequests: number;
    averageLatency: number;
  };
  agentMetrics: {
    totalAgents: number;
    activeAgents: number;
    deadAgents: number;
    averageLoad: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    redisMemory: number;
    diskUsage: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    fields?: Record<string, any>;
  }>;
  status: 'ok' | 'error' | 'timeout';
}

export interface DashboardData {
  overview: {
    totalSessions: number;
    activeSessions: number;
    totalEvents: number;
    systemHealth: 'healthy' | 'degraded' | 'critical';
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
  agents: {
    total: number;
    active: number;
    busy: number;
    dead: number;
    loadDistribution: number[];
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
    recent: Array<{
      rule: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
  };
}

export class SessionMetrics extends EventEmitter {
  private redis: RedisClientType;
  private config: MetricsConfig;
  private metrics = new Map<string, PrometheusMetric>();
  private activeSpans = new Map<string, TraceSpan>();
  private alertStates = new Map<string, any>();
  private metricsHistory: SessionMetricsSnapshot[] = [];
  private collectionTimer?: NodeJS.Timeout;
  private alertTimer?: NodeJS.Timeout;
  private httpServer?: any;

  constructor(redis: RedisClientType, config: Partial<MetricsConfig> = {}) {
    super();
    this.redis = redis;
    this.config = {
      enablePrometheus: config.enablePrometheus ?? true,
      enableTracing: config.enableTracing ?? true,
      enableAlerting: config.enableAlerting ?? true,
      metricsPort: config.metricsPort ?? 9090,
      metricsPath: config.metricsPath ?? '/metrics',
      collectionInterval: config.collectionInterval ?? 10000, // 10 seconds
      retentionDays: config.retentionDays ?? 7,
      alertRules: config.alertRules ?? this.getDefaultAlertRules(),
    };

    this.initializeMetrics();
    this.startCollection();

    if (this.config.enablePrometheus) {
      this.startPrometheusServer();
    }

    if (this.config.enableAlerting) {
      this.startAlerting();
    }
  }

  /**
   * Initialize Prometheus metrics
   */
  private initializeMetrics(): void {
    const metrics: PrometheusMetric[] = [
      {
        name: 'session_total',
        type: 'counter',
        help: 'Total number of sessions created',
        labels: ['status'],
      },
      {
        name: 'session_active',
        type: 'gauge',
        help: 'Number of currently active sessions',
      },
      {
        name: 'session_duration_seconds',
        type: 'histogram',
        help: 'Session duration in seconds',
        buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
      },
      {
        name: 'session_events_total',
        type: 'counter',
        help: 'Total number of session events',
        labels: ['type', 'agent'],
      },
      {
        name: 'session_operation_duration_seconds',
        type: 'histogram',
        help: 'Duration of session operations',
        labels: ['operation'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      },
      {
        name: 'redis_connections_active',
        type: 'gauge',
        help: 'Number of active Redis connections',
      },
      {
        name: 'redis_operations_total',
        type: 'counter',
        help: 'Total Redis operations',
        labels: ['operation', 'status'],
      },
      {
        name: 'redis_operation_duration_seconds',
        type: 'histogram',
        help: 'Redis operation duration',
        labels: ['operation'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      },
      {
        name: 'agent_total',
        type: 'gauge',
        help: 'Total number of agents',
        labels: ['status'],
      },
      {
        name: 'agent_load',
        type: 'gauge',
        help: 'Current agent load',
        labels: ['agent_id'],
      },
      {
        name: 'task_queue_size',
        type: 'gauge',
        help: 'Number of tasks in queue',
        labels: ['priority'],
      },
      {
        name: 'handoff_total',
        type: 'counter',
        help: 'Total number of agent handoffs',
        labels: ['from_agent', 'to_agent', 'reason'],
      },
      {
        name: 'errors_total',
        type: 'counter',
        help: 'Total number of errors',
        labels: ['type', 'operation'],
      },
      {
        name: 'system_memory_bytes',
        type: 'gauge',
        help: 'System memory usage in bytes',
      },
      {
        name: 'system_cpu_percent',
        type: 'gauge',
        help: 'System CPU usage percentage',
      },
    ];

    metrics.forEach(metric => {
      this.metrics.set(metric.name, metric);
    });
  }

  /**
   * Record a counter metric
   */
  recordCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      this.emit('metrics:error', { error: `Counter metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'counter',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      this.emit('metrics:error', { error: `Gauge metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'gauge',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a histogram observation
   */
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      this.emit('metrics:error', { error: `Histogram metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'histogram',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Start a distributed trace span
   */
  startSpan(operationName: string, parentSpanId?: string, tags: Record<string, any> = {}): string {
    const traceId = parentSpanId ? this.getTraceIdFromSpan(parentSpanId) : this.generateId();
    const spanId = this.generateId();

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags,
      logs: [],
      status: 'ok',
    };

    this.activeSpans.set(spanId, span);

    this.emit('trace:span:started', {
      traceId,
      spanId,
      operationName,
      parentSpanId,
    });

    return spanId;
  }

  /**
   * Finish a trace span
   */
  finishSpan(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok', tags: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.emit('metrics:error', { error: `Span ${spanId} not found` });
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.tags = { ...span.tags, ...tags };

    this.activeSpans.delete(spanId);

    // Record operation duration
    this.recordHistogram('session_operation_duration_seconds', span.duration / 1000, {
      operation: span.operationName,
    });

    this.emit('trace:span:finished', {
      traceId: span.traceId,
      spanId,
      duration: span.duration,
      status,
    });
  }

  /**
   * Add log to span
   */
  addSpanLog(spanId: string, level: string, message: string, fields: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields,
    });
  }

  /**
   * Record session creation
   */
  recordSessionCreated(sessionId: string, agentId: string): void {
    this.recordCounter('session_total', 1, { status: 'created' });
    void this.updateGaugeFromPromise('session_active', this.getCurrentActiveSessions());

    const spanId = this.startSpan('session.create', undefined, {
      'session.id': sessionId,
      'agent.id': agentId,
    });

    setTimeout(() => {
      this.finishSpan(spanId);
    }, 0);
  }

  /**
   * Record session event
   */
  recordSessionEvent(sessionId: string, event: SessionEvent): void {
    this.recordCounter('session_events_total', 1, {
      type: event.type,
      actor: event.actor,
    });

    const spanId = this.startSpan('session.event', undefined, {
      'session.id': sessionId,
      'event.type': event.type,
      'event.seq': event.seq.toString(),
    });

    setTimeout(() => {
      this.finishSpan(spanId);
    }, 0);
  }

  /**
   * Record Redis operation
   */
  recordRedisOperation(operation: string, duration: number, success: boolean): void {
    this.recordCounter('redis_operations_total', 1, {
      operation,
      status: success ? 'success' : 'error',
    });

    this.recordHistogram('redis_operation_duration_seconds', duration / 1000, {
      operation,
    });
  }

  /**
   * Record agent metrics
   */
  recordAgentMetrics(agentId: string, load: number, status: string): void {
    this.setGauge('agent_load', load, { agent_id: agentId });
    void this.updateGaugeFromPromise('agent_total', this.getCurrentAgentCount(), { status });
  }

  /**
   * Record handoff
   */
  recordHandoff(fromAgent: string, toAgent: string, reason: string): void {
    this.recordCounter('handoff_total', 1, {
      from_agent: fromAgent,
      to_agent: toAgent,
      reason,
    });
  }

  /**
   * Record error
   */
  recordError(errorType: string, operation: string): void {
    this.recordCounter('errors_total', 1, {
      type: errorType,
      operation,
    });
  }

  /**
   * Collect comprehensive metrics snapshot
   */
  async collectMetricsSnapshot(): Promise<SessionMetricsSnapshot> {
    const timestamp = new Date().toISOString();

    // Collect session metrics
    const activeSessions = await this.getCurrentActiveSessions();
    const totalEvents = await this.getTotalEvents();

    // Calculate rates (events/sessions per second)
    const eventRate = this.calculateEventRate();
    const sessionCreationRate = this.calculateSessionCreationRate();

    // System metrics
    const systemMetrics = await this.collectSystemMetrics();

    const snapshot: SessionMetricsSnapshot = {
      timestamp,
      activeSessions,
      totalEvents,
      eventRate,
      sessionCreationRate,
      averageSessionDuration: await this.getAverageSessionDuration(),
      connectionPoolStats: {
        totalConnections: 0, // Would be provided by connection pool
        activeConnections: 0,
        queuedRequests: 0,
        averageLatency: 0,
      },
      agentMetrics: {
        totalAgents: await this.getCurrentAgentCount(),
        activeAgents: await this.getActiveAgentCount(),
        deadAgents: await this.getDeadAgentCount(),
        averageLoad: await this.getAverageAgentLoad(),
      },
      systemMetrics,
      errorMetrics: {
        totalErrors: await this.getTotalErrors(),
        errorRate: this.calculateErrorRate(),
        errorsByType: await this.getErrorsByType(),
      },
    };

    // Store in history
    this.metricsHistory.push(snapshot);

    // Keep only recent history
    const maxHistory = (this.config.retentionDays * 24 * 60 * 60 * 1000) / this.config.collectionInterval;
    if (this.metricsHistory.length > maxHistory) {
      this.metricsHistory = this.metricsHistory.slice(-maxHistory);
    }

    this.emit('metrics:collected', snapshot);
    return snapshot;
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): DashboardData {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) {
      return this.getEmptyDashboardData();
    }

    const systemHealth = this.determineSystemHealth(latest);

    return {
      overview: {
        totalSessions: latest.activeSessions,
        activeSessions: latest.activeSessions,
        totalEvents: latest.totalEvents,
        systemHealth,
      },
      performance: {
        averageLatency: latest.connectionPoolStats.averageLatency,
        p95Latency: 0, // Would need percentile calculation
        p99Latency: 0,
        throughput: latest.eventRate,
      },
      agents: {
        total: latest.agentMetrics.totalAgents,
        active: latest.agentMetrics.activeAgents,
        busy: 0, // Would need to be calculated
        dead: latest.agentMetrics.deadAgents,
        loadDistribution: [], // Would need distribution data
      },
      errors: {
        totalErrors: latest.errorMetrics.totalErrors,
        errorRate: latest.errorMetrics.errorRate,
        topErrors: Object.entries(latest.errorMetrics.errorsByType)
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      alerts: {
        active: this.getActiveAlertCount(),
        critical: this.getCriticalAlertCount(),
        warning: this.getWarningAlertCount(),
        recent: this.getRecentAlerts(),
      },
    };
  }

  /**
   * Get Prometheus metrics export
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      // Add metric help
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      // This would need to be implemented with actual metric values
      // For now, this is a placeholder structure
      lines.push(`${metric.name} 0`);
    }

    return lines.join('\n');
  }

  /**
   * Check alert rules
   */
  private async checkAlertRules(): Promise<void> {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) return;

    for (const rule of this.config.alertRules) {
      if (!rule.enabled) continue;

      const alertKey = rule.name;
      const isTriggered = this.evaluateAlertCondition(rule, latest);

      const currentState = this.alertStates.get(alertKey);

      if (isTriggered && !currentState?.active) {
        // New alert
        const alert = {
          active: true,
          triggeredAt: Date.now(),
          rule: rule.name,
          severity: rule.severity,
          threshold: rule.threshold,
          currentValue: this.getAlertValue(rule, latest),
        };

        this.alertStates.set(alertKey, alert);
        this.emit('alert:triggered', alert);
      } else if (!isTriggered && currentState?.active) {
        // Alert resolved
        currentState.active = false;
        currentState.resolvedAt = Date.now();
        this.emit('alert:resolved', currentState);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(rule: AlertRule, snapshot: SessionMetricsSnapshot): boolean {
    const value = this.getAlertValue(rule, snapshot);

    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equals':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Get value for alert rule
   */
  private getAlertValue(rule: AlertRule, snapshot: SessionMetricsSnapshot): number {
    // This would need to be implemented based on the rule's target metric
    // For now, return a placeholder
    return 0;
  }

  /**
   * Helper methods for collecting metrics
   */
  private async updateGaugeFromPromise(
    name: string,
    valuePromise: Promise<number>,
    labels: Record<string, string> = {}
  ): Promise<void> {
    try {
      const value = await valuePromise;
      this.setGauge(name, value, labels);
    } catch (error) {
      this.emit('metrics:error', {
        error: `Failed to update gauge ${name}`,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async getCurrentActiveSessions(): Promise<number> {
    try {
      const keys = await this.redis.keys('session:*');
      return keys.length;
    } catch {
      return 0;
    }
  }

  private async getTotalEvents(): Promise<number> {
    // This would need to aggregate event counts across all sessions
    return 0;
  }

  private calculateEventRate(): number {
    if (this.metricsHistory.length < 2) return 0;

    const current = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];

    const timeDiff = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000;
    const eventDiff = current.totalEvents - previous.totalEvents;

    return timeDiff > 0 ? eventDiff / timeDiff : 0;
  }

  private calculateSessionCreationRate(): number {
    // Similar to event rate calculation
    return 0;
  }

  private async getAverageSessionDuration(): Promise<number> {
    // Would need to calculate from session data
    return 0;
  }

  private async getCurrentAgentCount(): Promise<number> {
    // Would get from agent registry
    return 0;
  }

  private async getActiveAgentCount(): Promise<number> {
    return 0;
  }

  private async getDeadAgentCount(): Promise<number> {
    return 0;
  }

  private async getAverageAgentLoad(): Promise<number> {
    return 0;
  }

  private async collectSystemMetrics(): Promise<SessionMetricsSnapshot['systemMetrics']> {
    const memoryUsage = process.memoryUsage();

    return {
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: 0, // Would need to implement CPU monitoring
      redisMemory: 0, // Would get from Redis INFO command
      diskUsage: 0, // Would need to implement disk monitoring
    };
  }

  private async getTotalErrors(): Promise<number> {
    return 0;
  }

  private calculateErrorRate(): number {
    return 0;
  }

  private async getErrorsByType(): Promise<Record<string, number>> {
    return {};
  }

  private determineSystemHealth(snapshot: SessionMetricsSnapshot): 'healthy' | 'degraded' | 'critical' {
    const criticalAlerts = this.getCriticalAlertCount();
    if (criticalAlerts > 0) return 'critical';

    const warningAlerts = this.getWarningAlertCount();
    if (warningAlerts > 3) return 'degraded';

    return 'healthy';
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      overview: { totalSessions: 0, activeSessions: 0, totalEvents: 0, systemHealth: 'healthy' },
      performance: { averageLatency: 0, p95Latency: 0, p99Latency: 0, throughput: 0 },
      agents: { total: 0, active: 0, busy: 0, dead: 0, loadDistribution: [] },
      errors: { totalErrors: 0, errorRate: 0, topErrors: [] },
      alerts: { active: 0, critical: 0, warning: 0, recent: [] },
    };
  }

  private getActiveAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active).length;
  }

  private getCriticalAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active && a.severity === 'critical').length;
  }

  private getWarningAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active && a.severity === 'warning').length;
  }

  private getRecentAlerts(): Array<{ rule: string; severity: string; message: string; timestamp: string }> {
    return Array.from(this.alertStates.values())
      .filter(a => a.active)
      .slice(-10)
      .map(a => ({
        rule: a.rule,
        severity: a.severity,
        message: `Alert triggered: ${a.rule}`,
        timestamp: new Date(a.triggeredAt).toISOString(),
      }));
  }

  /**
   * Start metrics collection timer
   */
  private startCollection(): void {
    this.collectionTimer = setInterval(() => {
      this.collectMetricsSnapshot().catch(error => {
        this.emit('error', error);
      });
    }, this.config.collectionInterval);
  }

  /**
   * Start alerting timer
   */
  private startAlerting(): void {
    this.alertTimer = setInterval(() => {
      this.checkAlertRules().catch(error => {
        this.emit('error', error);
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start Prometheus HTTP server
   */
  private async startPrometheusServer(): Promise<void> {
    try {
      const http = await import('http');

      this.httpServer = http.createServer((req, res) => {
        if (req.url === this.config.metricsPath) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(this.exportPrometheusMetrics());
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.httpServer.listen(this.config.metricsPort, () => {
        this.emit('prometheus:started', { port: this.config.metricsPort });
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Get default alert rules
   */
  private getDefaultAlertRules(): AlertRule[] {
    return [
      {
        name: 'high_session_count',
        condition: 'greater_than',
        threshold: 1000,
        duration: 300,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'active_sessions' },
      },
      {
        name: 'high_error_rate',
        condition: 'greater_than',
        threshold: 0.05, // 5% error rate
        duration: 60,
        severity: 'critical',
        enabled: true,
        metadata: { metric: 'error_rate' },
      },
      {
        name: 'dead_agents',
        condition: 'greater_than',
        threshold: 0,
        duration: 60,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'dead_agents' },
      },
      {
        name: 'high_latency',
        condition: 'greater_than',
        threshold: 1000, // 1 second
        duration: 300,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'average_latency' },
      },
    ];
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private getTraceIdFromSpan(spanId: string): string {
    const span = this.activeSpans.get(spanId);
    return span?.traceId || this.generateId();
  }

  /**
   * Shutdown metrics service
   */
  async shutdown(): Promise<void> {
    // Clear timers
    if (this.collectionTimer) clearInterval(this.collectionTimer);
    if (this.alertTimer) clearInterval(this.alertTimer);

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close();
    }

    // Finish all active spans
    for (const spanId of this.activeSpans.keys()) {
      this.finishSpan(spanId, 'timeout');
    }

    this.emit('shutdown');
  }
}
