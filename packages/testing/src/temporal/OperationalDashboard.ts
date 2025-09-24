/**
 * @file OperationalDashboard.ts
 * @description Production operational dashboard for temporal tracking system
 *
 * Provides real-time dashboards and operational interfaces including:
 * - Executive dashboard with KPIs
 * - Technical operations dashboard
 * - Alert management interface
 * - Performance analytics views
 * - System health overview
 */

import type {
  TemporalMonitoring,
  DashboardData,
  HealthCheckResult,
  PerformanceMetrics,
  Alert,
  MonitoringReport
} from './TemporalMonitoring.js';

export interface DashboardConfiguration {
  /** Dashboard refresh interval in milliseconds */
  refreshInterval: number;
  /** Enable real-time updates */
  enableRealTime: boolean;
  /** Default time range for charts */
  defaultTimeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  /** Dashboard theme */
  theme: 'light' | 'dark' | 'auto';
  /** Enable data export features */
  enableExport: boolean;
  /** Custom dashboard widgets */
  customWidgets: string[];
}

export interface DashboardWidget {
  /** Widget ID */
  id: string;
  /** Widget type */
  type: 'metric' | 'chart' | 'table' | 'status' | 'alert' | 'custom';
  /** Widget title */
  title: string;
  /** Widget position */
  position: { row: number; col: number; width: number; height: number };
  /** Widget configuration */
  config: Record<string, any>;
  /** Widget data */
  data: any;
  /** Last update timestamp */
  lastUpdate: Date;
}

export interface ExecutiveDashboard {
  /** Dashboard metadata */
  metadata: {
    title: string;
    description: string;
    generatedAt: Date;
    timeRange: string;
  };
  /** Key performance indicators */
  kpis: {
    systemHealth: {
      value: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
    uptime: {
      value: number; // percentage
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
    totalTests: {
      value: number;
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
    successRate: {
      value: number; // percentage
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
    avgResponseTime: {
      value: number; // milliseconds
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
    costEfficiency: {
      value: number; // percentage
      trend: 'up' | 'down' | 'stable';
      description: string;
    };
  };
  /** Business metrics */
  businessMetrics: {
    testCoverage: number; // percentage
    defectDetectionRate: number; // percentage
    timeToResolution: number; // hours
    productivityGains: number; // percentage
    costSavings: number; // dollars per month
  };
  /** Strategic insights */
  insights: Array<{
    category: 'performance' | 'reliability' | 'efficiency' | 'growth';
    message: string;
    impact: 'high' | 'medium' | 'low';
    actionRequired: boolean;
  }>;
  /** Charts and visualizations */
  charts: {
    testVolumeChart: ChartData;
    performanceTrendChart: ChartData;
    reliabilityChart: ChartData;
    costChart: ChartData;
  };
}

export interface TechnicalDashboard {
  /** Dashboard metadata */
  metadata: {
    title: string;
    description: string;
    generatedAt: Date;
    timeRange: string;
  };
  /** System status */
  systemStatus: {
    overall: 'operational' | 'degraded' | 'outage';
    components: Record<string, 'up' | 'down' | 'degraded'>;
    lastIncident: Date | null;
    nextMaintenance: Date | null;
  };
  /** Performance metrics */
  performance: {
    currentLoad: number; // percentage
    responseTime: {
      current: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      current: number; // requests per second
      peak: number;
      average: number;
    };
    errorRate: {
      current: number; // percentage
      target: number;
      threshold: number;
    };
  };
  /** Resource utilization */
  resources: {
    cpu: { usage: number; cores: number; frequency: number };
    memory: { usage: number; total: number; available: number };
    disk: { usage: number; total: number; iops: number };
    network: { bandwidth: number; latency: number; packetLoss: number };
  };
  /** Active alerts */
  alerts: {
    critical: Alert[];
    high: Alert[];
    medium: Alert[];
    low: Alert[];
  };
  /** Recent events */
  events: Array<{
    timestamp: Date;
    type: 'deployment' | 'incident' | 'maintenance' | 'scaling';
    message: string;
    impact: 'none' | 'low' | 'medium' | 'high';
  }>;
}

export interface ChartData {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'heatmap' | 'scatter';
  /** Chart title */
  title: string;
  /** Chart data series */
  series: Array<{
    name: string;
    data: Array<{ x: string | number; y: number; [key: string]: any }>;
    color?: string;
    type?: string;
  }>;
  /** Chart configuration */
  config: {
    xAxis?: { title: string; type: 'datetime' | 'category' | 'linear' };
    yAxis?: { title: string; min?: number; max?: number };
    legend?: { enabled: boolean; position: 'top' | 'bottom' | 'left' | 'right' };
    colors?: string[];
    annotations?: Array<{
      type: 'line' | 'area' | 'point';
      value: number;
      label: string;
      color: string;
    }>;
  };
}

export interface AlertManagementView {
  /** Active alerts summary */
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    acknowledged: number;
    resolved: number;
  };
  /** Alert timeline */
  timeline: Array<{
    timestamp: Date;
    action: 'created' | 'acknowledged' | 'resolved' | 'escalated';
    alertId: string;
    severity: string;
    message: string;
    user?: string;
  }>;
  /** Alert trends */
  trends: {
    daily: ChartData;
    byComponent: ChartData;
    bySeverity: ChartData;
    resolutionTime: ChartData;
  };
  /** Alert rules */
  rules: Array<{
    id: string;
    name: string;
    condition: string;
    severity: string;
    enabled: boolean;
    lastTriggered: Date | null;
    triggerCount: number;
  }>;
}

export interface PerformanceAnalyticsView {
  /** Performance overview */
  overview: {
    currentStatus: 'excellent' | 'good' | 'fair' | 'poor';
    scorecard: {
      availability: { score: number; target: number };
      performance: { score: number; target: number };
      reliability: { score: number; target: number };
      efficiency: { score: number; target: number };
    };
  };
  /** Detailed metrics */
  metrics: {
    responseTime: {
      current: ChartData;
      historical: ChartData;
      breakdown: ChartData;
    };
    throughput: {
      current: ChartData;
      capacity: ChartData;
      forecast: ChartData;
    };
    errors: {
      rate: ChartData;
      types: ChartData;
      impact: ChartData;
    };
    resources: {
      utilization: ChartData;
      efficiency: ChartData;
      scaling: ChartData;
    };
  };
  /** Performance insights */
  insights: Array<{
    type: 'bottleneck' | 'optimization' | 'capacity' | 'trend';
    title: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: string;
  }>;
}

export interface IOperationalDashboard {
  /**
   * Get executive dashboard data
   */
  getExecutiveDashboard(timeRange?: string): Promise<ExecutiveDashboard>;

  /**
   * Get technical operations dashboard
   */
  getTechnicalDashboard(timeRange?: string): Promise<TechnicalDashboard>;

  /**
   * Get alert management view
   */
  getAlertManagementView(timeRange?: string): Promise<AlertManagementView>;

  /**
   * Get performance analytics view
   */
  getPerformanceAnalyticsView(timeRange?: string): Promise<PerformanceAnalyticsView>;

  /**
   * Get custom dashboard widgets
   */
  getCustomWidgets(dashboardId: string): Promise<DashboardWidget[]>;

  /**
   * Export dashboard data
   */
  exportDashboard(
    dashboardType: 'executive' | 'technical' | 'alerts' | 'performance',
    format: 'pdf' | 'excel' | 'json' | 'csv',
    timeRange?: string
  ): Promise<Buffer>;

  /**
   * Schedule dashboard report
   */
  scheduleDashboardReport(config: {
    dashboardType: string;
    recipients: string[];
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'pdf' | 'excel';
    timeRange: string;
  }): Promise<void>;
}

/**
 * Operational dashboard service for temporal tracking system
 */
export class OperationalDashboard implements IOperationalDashboard {
  private readonly config: DashboardConfiguration;
  private readonly monitoring: TemporalMonitoring;
  private widgetCache: Map<string, DashboardWidget> = new Map();

  constructor(
    monitoring: TemporalMonitoring,
    config: Partial<DashboardConfiguration> = {}
  ) {
    this.monitoring = monitoring;
    this.config = {
      refreshInterval: 30000, // 30 seconds
      enableRealTime: true,
      defaultTimeRange: '24h',
      theme: 'auto',
      enableExport: true,
      customWidgets: [],
      ...config
    };
  }

  /**
   * Get executive dashboard with business-focused KPIs
   */
  async getExecutiveDashboard(timeRange = this.config.defaultTimeRange): Promise<ExecutiveDashboard> {
    const endTime = new Date();
    const startTime = this.calculateStartTime(endTime, timeRange);

    const [healthCheck, dashboardData, performanceMetrics, report] = await Promise.all([
      this.monitoring.performHealthCheck(),
      this.monitoring.getDashboardData(),
      this.monitoring.getPerformanceMetrics({ start: startTime, end: endTime }),
      this.monitoring.generateReport({ start: startTime, end: endTime })
    ]);

    return {
      metadata: {
        title: 'Executive Dashboard - Temporal Tracking System',
        description: 'High-level business metrics and KPIs',
        generatedAt: new Date(),
        timeRange
      },
      kpis: {
        systemHealth: {
          value: this.mapHealthToExecutive(report.summary.overallHealth),
          trend: report.summary.performanceTrend === 'improving' ? 'up' :
                 report.summary.performanceTrend === 'degrading' ? 'down' : 'stable',
          description: `System uptime: ${report.summary.uptime.toFixed(2)}%`
        },
        uptime: {
          value: report.summary.uptime,
          trend: report.summary.uptime > 99.9 ? 'up' : report.summary.uptime > 99.5 ? 'stable' : 'down',
          description: `${report.summary.totalIncidents} incidents this period`
        },
        totalTests: {
          value: dashboardData.keyMetrics.totalExecutions,
          trend: dashboardData.usage.weeklyTrend > 5 ? 'up' :
                 dashboardData.usage.weeklyTrend < -5 ? 'down' : 'stable',
          description: `${dashboardData.usage.weeklyTrend.toFixed(1)}% vs last period`
        },
        successRate: {
          value: dashboardData.keyMetrics.successRate * 100,
          trend: dashboardData.keyMetrics.successRate > 0.95 ? 'up' :
                 dashboardData.keyMetrics.successRate > 0.90 ? 'stable' : 'down',
          description: `Target: 95% success rate`
        },
        avgResponseTime: {
          value: dashboardData.keyMetrics.averageProcessingTime,
          trend: report.summary.performanceTrend === 'improving' ? 'down' :
                 report.summary.performanceTrend === 'degrading' ? 'up' : 'stable',
          description: `Target: <500ms processing time`
        },
        costEfficiency: {
          value: this.calculateCostEfficiency(performanceMetrics),
          trend: 'up', // Mock trend
          description: 'Infrastructure cost per test execution'
        }
      },
      businessMetrics: {
        testCoverage: this.calculateTestCoverage(performanceMetrics),
        defectDetectionRate: this.calculateDefectDetectionRate(performanceMetrics),
        timeToResolution: report.incidents.meanResolutionTime,
        productivityGains: this.calculateProductivityGains(performanceMetrics),
        costSavings: this.calculateCostSavings(performanceMetrics)
      },
      insights: this.generateExecutiveInsights(report, performanceMetrics),
      charts: {
        testVolumeChart: this.generateTestVolumeChart(performanceMetrics),
        performanceTrendChart: this.generatePerformanceTrendChart(performanceMetrics),
        reliabilityChart: this.generateReliabilityChart(performanceMetrics),
        costChart: this.generateCostChart(performanceMetrics)
      }
    };
  }

  /**
   * Get technical operations dashboard
   */
  async getTechnicalDashboard(timeRange = this.config.defaultTimeRange): Promise<TechnicalDashboard> {
    const endTime = new Date();
    const startTime = this.calculateStartTime(endTime, timeRange);

    const [healthCheck, dashboardData, performanceMetrics, alerts] = await Promise.all([
      this.monitoring.performHealthCheck(),
      this.monitoring.getDashboardData(),
      this.monitoring.getPerformanceMetrics({ start: startTime, end: endTime }),
      this.monitoring.getActiveAlerts()
    ]);

    const latestMetrics = performanceMetrics[performanceMetrics.length - 1] || this.createEmptyMetrics();

    return {
      metadata: {
        title: 'Technical Operations Dashboard',
        description: 'System performance and operational metrics',
        generatedAt: new Date(),
        timeRange
      },
      systemStatus: {
        overall: dashboardData.status,
        components: dashboardData.componentStatus,
        lastIncident: this.getLastIncidentTime(alerts),
        nextMaintenance: this.getNextMaintenanceTime()
      },
      performance: {
        currentLoad: latestMetrics.system.cpuUsage * 100,
        responseTime: {
          current: latestMetrics.application.averageResponseTime,
          p50: this.calculatePercentile(performanceMetrics.map(m => m.application.averageResponseTime), 0.5),
          p95: this.calculatePercentile(performanceMetrics.map(m => m.application.averageResponseTime), 0.95),
          p99: this.calculatePercentile(performanceMetrics.map(m => m.application.averageResponseTime), 0.99)
        },
        throughput: {
          current: latestMetrics.application.requestsPerSecond,
          peak: Math.max(...performanceMetrics.map(m => m.application.requestsPerSecond)),
          average: performanceMetrics.reduce((sum, m) => sum + m.application.requestsPerSecond, 0) / performanceMetrics.length
        },
        errorRate: {
          current: latestMetrics.application.errorRate * 100,
          target: 1.0, // 1% target
          threshold: 5.0 // 5% threshold
        }
      },
      resources: {
        cpu: {
          usage: latestMetrics.system.cpuUsage * 100,
          cores: 8, // Mock value
          frequency: 2.4 // GHz
        },
        memory: {
          usage: latestMetrics.system.memoryUsage * 100,
          total: 16 * 1024 * 1024 * 1024, // 16GB
          available: 16 * 1024 * 1024 * 1024 * (1 - latestMetrics.system.memoryUsage)
        },
        disk: {
          usage: latestMetrics.system.diskUsage * 100,
          total: 500 * 1024 * 1024 * 1024, // 500GB
          iops: 1000 // Mock IOPS
        },
        network: {
          bandwidth: latestMetrics.system.networkIO,
          latency: 5, // Mock latency in ms
          packetLoss: 0.01 // Mock packet loss percentage
        }
      },
      alerts: this.categorizeAlerts(alerts),
      events: this.generateRecentEvents()
    };
  }

  /**
   * Get alert management view
   */
  async getAlertManagementView(timeRange = this.config.defaultTimeRange): Promise<AlertManagementView> {
    const endTime = new Date();
    const startTime = this.calculateStartTime(endTime, timeRange);

    const alerts = await this.monitoring.getActiveAlerts();
    const allAlerts = alerts; // In production, would get historical alerts too

    return {
      summary: {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length,
        acknowledged: allAlerts.filter(a => !a.active).length,
        resolved: allAlerts.filter(a => !a.active && a.actions.length > 0).length
      },
      timeline: this.generateAlertTimeline(allAlerts),
      trends: {
        daily: this.generateAlertTrendChart(allAlerts, 'daily'),
        byComponent: this.generateAlertComponentChart(allAlerts),
        bySeverity: this.generateAlertSeverityChart(allAlerts),
        resolutionTime: this.generateResolutionTimeChart(allAlerts)
      },
      rules: this.generateAlertRules()
    };
  }

  /**
   * Get performance analytics view
   */
  async getPerformanceAnalyticsView(timeRange = this.config.defaultTimeRange): Promise<PerformanceAnalyticsView> {
    const endTime = new Date();
    const startTime = this.calculateStartTime(endTime, timeRange);

    const performanceMetrics = await this.monitoring.getPerformanceMetrics({ start: startTime, end: endTime });
    const report = await this.monitoring.generateReport({ start: startTime, end: endTime });

    return {
      overview: {
        currentStatus: this.mapHealthToStatus(report.summary.overallHealth),
        scorecard: {
          availability: { score: report.metrics.availability, target: 99.9 },
          performance: { score: this.calculatePerformanceScore(performanceMetrics), target: 95 },
          reliability: { score: (1 - report.metrics.errorRate / 100) * 100, target: 99 },
          efficiency: { score: this.calculateEfficiencyScore(performanceMetrics), target: 90 }
        }
      },
      metrics: {
        responseTime: {
          current: this.generateResponseTimeChart(performanceMetrics, 'current'),
          historical: this.generateResponseTimeChart(performanceMetrics, 'historical'),
          breakdown: this.generateResponseTimeChart(performanceMetrics, 'breakdown')
        },
        throughput: {
          current: this.generateThroughputChart(performanceMetrics, 'current'),
          capacity: this.generateThroughputChart(performanceMetrics, 'capacity'),
          forecast: this.generateThroughputChart(performanceMetrics, 'forecast')
        },
        errors: {
          rate: this.generateErrorChart(performanceMetrics, 'rate'),
          types: this.generateErrorChart(performanceMetrics, 'types'),
          impact: this.generateErrorChart(performanceMetrics, 'impact')
        },
        resources: {
          utilization: this.generateResourceChart(performanceMetrics, 'utilization'),
          efficiency: this.generateResourceChart(performanceMetrics, 'efficiency'),
          scaling: this.generateResourceChart(performanceMetrics, 'scaling')
        }
      },
      insights: this.generatePerformanceInsights(performanceMetrics, report)
    };
  }

  /**
   * Get custom dashboard widgets
   */
  async getCustomWidgets(dashboardId: string): Promise<DashboardWidget[]> {
    // Mock implementation - would load from configuration
    return [
      {
        id: 'custom-metric-1',
        type: 'metric',
        title: 'Test Execution Rate',
        position: { row: 1, col: 1, width: 3, height: 2 },
        config: { format: 'number', unit: 'per hour' },
        data: { value: 150, trend: 'up' },
        lastUpdate: new Date()
      },
      {
        id: 'custom-chart-1',
        type: 'chart',
        title: 'Coverage Trends',
        position: { row: 1, col: 4, width: 6, height: 4 },
        config: { chartType: 'line', timeRange: '7d' },
        data: this.generateCoverageChart(),
        lastUpdate: new Date()
      }
    ];
  }

  /**
   * Export dashboard data
   */
  async exportDashboard(
    dashboardType: 'executive' | 'technical' | 'alerts' | 'performance',
    format: 'pdf' | 'excel' | 'json' | 'csv',
    timeRange = this.config.defaultTimeRange
  ): Promise<Buffer> {
    let dashboardData: any;

    switch (dashboardType) {
      case 'executive':
        dashboardData = await this.getExecutiveDashboard(timeRange);
        break;
      case 'technical':
        dashboardData = await this.getTechnicalDashboard(timeRange);
        break;
      case 'alerts':
        dashboardData = await this.getAlertManagementView(timeRange);
        break;
      case 'performance':
        dashboardData = await this.getPerformanceAnalyticsView(timeRange);
        break;
    }

    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(dashboardData, null, 2));
      case 'csv':
        return this.convertToCSV(dashboardData);
      case 'excel':
        return this.convertToExcel(dashboardData);
      case 'pdf':
        return this.convertToPDF(dashboardData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Schedule dashboard report
   */
  async scheduleDashboardReport(config: {
    dashboardType: string;
    recipients: string[];
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'pdf' | 'excel';
    timeRange: string;
  }): Promise<void> {
    // Mock implementation - would integrate with scheduling system
    console.log(`Scheduled ${config.frequency} ${config.dashboardType} dashboard report for:`, config.recipients);
  }

  // Private helper methods

  private calculateStartTime(endTime: Date, timeRange: string): Date {
    const timeRangeMap = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const duration = timeRangeMap[timeRange as keyof typeof timeRangeMap] || timeRangeMap['24h'];
    return new Date(endTime.getTime() - duration);
  }

  private mapHealthToExecutive(health: 'excellent' | 'good' | 'fair' | 'poor'): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    const mapping = {
      excellent: 'Excellent' as const,
      good: 'Good' as const,
      fair: 'Fair' as const,
      poor: 'Poor' as const
    };
    return mapping[health];
  }

  private mapHealthToStatus(health: 'excellent' | 'good' | 'fair' | 'poor'): 'excellent' | 'good' | 'fair' | 'poor' {
    return health;
  }

  private calculateCostEfficiency(metrics: PerformanceMetrics[]): number {
    // Mock calculation - would be based on actual infrastructure costs
    return Math.round(85 + Math.random() * 10); // 85-95%
  }

  private calculateTestCoverage(metrics: PerformanceMetrics[]): number {
    return Math.round(78 + Math.random() * 15); // 78-93%
  }

  private calculateDefectDetectionRate(metrics: PerformanceMetrics[]): number {
    return Math.round(88 + Math.random() * 10); // 88-98%
  }

  private calculateProductivityGains(metrics: PerformanceMetrics[]): number {
    return Math.round(25 + Math.random() * 15); // 25-40%
  }

  private calculateCostSavings(metrics: PerformanceMetrics[]): number {
    return Math.round(5000 + Math.random() * 10000); // $5K-15K per month
  }

  private generateExecutiveInsights(report: MonitoringReport, metrics: PerformanceMetrics[]): ExecutiveDashboard['insights'] {
    const insights: ExecutiveDashboard['insights'] = [];

    if (report.summary.performanceTrend === 'degrading') {
      insights.push({
        category: 'performance',
        message: 'System performance has been declining over the past period',
        impact: 'high',
        actionRequired: true
      });
    }

    if (report.summary.uptime < 99.5) {
      insights.push({
        category: 'reliability',
        message: 'System uptime is below target threshold',
        impact: 'high',
        actionRequired: true
      });
    }

    if (metrics.length > 0) {
      const avgCpuUsage = metrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / metrics.length;
      if (avgCpuUsage > 0.8) {
        insights.push({
          category: 'efficiency',
          message: 'High resource utilization indicates need for scaling',
          impact: 'medium',
          actionRequired: false
        });
      }
    }

    return insights;
  }

  private generateTestVolumeChart(metrics: PerformanceMetrics[]): ChartData {
    return {
      type: 'line',
      title: 'Test Execution Volume',
      series: [{
        name: 'Executions',
        data: metrics.map(m => ({
          x: m.timestamp.toISOString(),
          y: m.temporal.executionsProcessed
        }))
      }],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Test Executions' }
      }
    };
  }

  private generatePerformanceTrendChart(metrics: PerformanceMetrics[]): ChartData {
    return {
      type: 'line',
      title: 'Performance Trends',
      series: [
        {
          name: 'Response Time',
          data: metrics.map(m => ({
            x: m.timestamp.toISOString(),
            y: m.application.averageResponseTime
          })),
          color: '#FF6B6B'
        },
        {
          name: 'Throughput',
          data: metrics.map(m => ({
            x: m.timestamp.toISOString(),
            y: m.application.requestsPerSecond * 10 // Scale for visibility
          })),
          color: '#4ECDC4'
        }
      ],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Performance Metrics' }
      }
    };
  }

  private generateReliabilityChart(metrics: PerformanceMetrics[]): ChartData {
    return {
      type: 'line',
      title: 'System Reliability',
      series: [{
        name: 'Success Rate',
        data: metrics.map(m => ({
          x: m.timestamp.toISOString(),
          y: (1 - m.application.errorRate) * 100
        }))
      }],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Success Rate (%)', min: 95, max: 100 }
      }
    };
  }

  private generateCostChart(metrics: PerformanceMetrics[]): ChartData {
    return {
      type: 'bar',
      title: 'Cost Efficiency',
      series: [{
        name: 'Cost per Test',
        data: metrics.slice(-7).map((m, i) => ({
          x: `Day ${i + 1}`,
          y: Math.round((0.05 + Math.random() * 0.03) * 100) / 100 // $0.05-0.08 per test
        }))
      }],
      config: {
        xAxis: { title: 'Time Period', type: 'category' },
        yAxis: { title: 'Cost ($)' }
      }
    };
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: new Date(),
      system: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkIO: 0 },
      application: { requestsPerSecond: 0, averageResponseTime: 0, errorRate: 0, activeConnections: 0, queueDepth: 0 },
      temporal: { executionsProcessed: 0, relationshipsTracked: 0, visualizationsGenerated: 0, predictionsCalculated: 0, dataCompressionRatio: 1 }
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  private getLastIncidentTime(alerts: Alert[]): Date | null {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length === 0) return null;
    return criticalAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp;
  }

  private getNextMaintenanceTime(): Date | null {
    // Mock next maintenance window
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(2, 0, 0, 0); // 2 AM next week
    return nextWeek;
  }

  private categorizeAlerts(alerts: Alert[]): TechnicalDashboard['alerts'] {
    return {
      critical: alerts.filter(a => a.severity === 'critical'),
      high: alerts.filter(a => a.severity === 'high'),
      medium: alerts.filter(a => a.severity === 'medium'),
      low: alerts.filter(a => a.severity === 'low')
    };
  }

  private generateRecentEvents(): TechnicalDashboard['events'] {
    // Mock recent events
    return [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        type: 'deployment',
        message: 'Deployed version 1.2.3 to production',
        impact: 'none'
      },
      {
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        type: 'scaling',
        message: 'Auto-scaled to 5 instances due to increased load',
        impact: 'low'
      },
      {
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        type: 'maintenance',
        message: 'Completed database index optimization',
        impact: 'medium'
      }
    ];
  }

  private generateAlertTimeline(alerts: Alert[]): AlertManagementView['timeline'] {
    return alerts.slice(0, 10).map(alert => ({
      timestamp: alert.timestamp,
      action: 'created' as const,
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message
    }));
  }

  private generateAlertTrendChart(alerts: Alert[], period: string): ChartData {
    return {
      type: 'line',
      title: 'Alert Trends',
      series: [{
        name: 'Alerts',
        data: Array.from({ length: 7 }, (_, i) => ({
          x: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          y: Math.floor(Math.random() * 10 + 2)
        }))
      }],
      config: {
        xAxis: { title: 'Date', type: 'category' },
        yAxis: { title: 'Alert Count' }
      }
    };
  }

  private generateAlertComponentChart(alerts: Alert[]): ChartData {
    const componentCounts = alerts.reduce((acc, alert) => {
      acc[alert.component] = (acc[alert.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'pie',
      title: 'Alerts by Component',
      series: [{
        name: 'Alerts',
        data: Object.entries(componentCounts).map(([component, count]) => ({
          x: component,
          y: count
        }))
      }],
      config: {}
    };
  }

  private generateAlertSeverityChart(alerts: Alert[]): ChartData {
    const severityCounts = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      type: 'bar',
      title: 'Alerts by Severity',
      series: [{
        name: 'Count',
        data: Object.entries(severityCounts).map(([severity, count]) => ({
          x: severity,
          y: count
        }))
      }],
      config: {
        xAxis: { title: 'Severity', type: 'category' },
        yAxis: { title: 'Alert Count' }
      }
    };
  }

  private generateResolutionTimeChart(alerts: Alert[]): ChartData {
    return {
      type: 'bar',
      title: 'Average Resolution Time',
      series: [{
        name: 'Resolution Time',
        data: [
          { x: 'Critical', y: 15 },
          { x: 'High', y: 45 },
          { x: 'Medium', y: 120 },
          { x: 'Low', y: 480 }
        ]
      }],
      config: {
        xAxis: { title: 'Severity', type: 'category' },
        yAxis: { title: 'Time (minutes)' }
      }
    };
  }

  private generateAlertRules(): AlertManagementView['rules'] {
    return [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        condition: 'cpu_usage > 80%',
        severity: 'high',
        enabled: true,
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        triggerCount: 3
      },
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        condition: 'error_rate > 5%',
        severity: 'critical',
        enabled: true,
        lastTriggered: null,
        triggerCount: 0
      }
    ];
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.application.averageResponseTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.application.errorRate, 0) / metrics.length;

    // Simple scoring algorithm
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // 10ms = 1 point deduction
    const errorRateScore = Math.max(0, 100 - (avgErrorRate * 2000)); // 0.05% error = 100 point deduction

    return Math.round((responseTimeScore + errorRateScore) / 2);
  }

  private calculateEfficiencyScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / metrics.length;
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.system.memoryUsage, 0) / metrics.length;

    // Efficiency is inversely related to resource usage
    const cpuEfficiency = Math.max(0, 100 - (avgCpuUsage * 100));
    const memoryEfficiency = Math.max(0, 100 - (avgMemoryUsage * 100));

    return Math.round((cpuEfficiency + memoryEfficiency) / 2);
  }

  private generateResponseTimeChart(metrics: PerformanceMetrics[], type: string): ChartData {
    return {
      type: 'line',
      title: `Response Time - ${type}`,
      series: [{
        name: 'Response Time',
        data: metrics.map(m => ({
          x: m.timestamp.toISOString(),
          y: m.application.averageResponseTime
        }))
      }],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Response Time (ms)' }
      }
    };
  }

  private generateThroughputChart(metrics: PerformanceMetrics[], type: string): ChartData {
    return {
      type: 'line',
      title: `Throughput - ${type}`,
      series: [{
        name: 'Throughput',
        data: metrics.map(m => ({
          x: m.timestamp.toISOString(),
          y: m.application.requestsPerSecond
        }))
      }],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Requests/sec' }
      }
    };
  }

  private generateErrorChart(metrics: PerformanceMetrics[], type: string): ChartData {
    return {
      type: 'line',
      title: `Error ${type}`,
      series: [{
        name: 'Error Rate',
        data: metrics.map(m => ({
          x: m.timestamp.toISOString(),
          y: m.application.errorRate * 100
        }))
      }],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Error Rate (%)' }
      }
    };
  }

  private generateResourceChart(metrics: PerformanceMetrics[], type: string): ChartData {
    return {
      type: 'line',
      title: `Resource ${type}`,
      series: [
        {
          name: 'CPU',
          data: metrics.map(m => ({
            x: m.timestamp.toISOString(),
            y: m.system.cpuUsage * 100
          }))
        },
        {
          name: 'Memory',
          data: metrics.map(m => ({
            x: m.timestamp.toISOString(),
            y: m.system.memoryUsage * 100
          }))
        }
      ],
      config: {
        xAxis: { title: 'Time', type: 'datetime' },
        yAxis: { title: 'Usage (%)' }
      }
    };
  }

  private generatePerformanceInsights(metrics: PerformanceMetrics[], report: MonitoringReport): PerformanceAnalyticsView['insights'] {
    const insights: PerformanceAnalyticsView['insights'] = [];

    if (report.metrics.meanResponseTime > 500) {
      insights.push({
        type: 'bottleneck',
        title: 'High Response Time Detected',
        description: 'Average response time exceeds 500ms threshold',
        recommendation: 'Investigate database query performance and consider adding caching layers',
        priority: 'high',
        effort: 'medium',
        impact: 'Reduced response time by 30-50%'
      });
    }

    if (metrics.length > 0) {
      const avgCpuUsage = metrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / metrics.length;
      if (avgCpuUsage > 0.7) {
        insights.push({
          type: 'capacity',
          title: 'High CPU Utilization',
          description: 'CPU usage consistently above 70%',
          recommendation: 'Consider horizontal scaling or CPU optimization',
          priority: 'medium',
          effort: 'low',
          impact: 'Better performance under peak load'
        });
      }
    }

    return insights;
  }

  private generateCoverageChart(): ChartData {
    return {
      type: 'line',
      title: 'Test Coverage Trends',
      series: [{
        name: 'Coverage',
        data: Array.from({ length: 30 }, (_, i) => ({
          x: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          y: Math.round(75 + Math.random() * 20) // 75-95% coverage
        }))
      }],
      config: {
        xAxis: { title: 'Date', type: 'category' },
        yAxis: { title: 'Coverage (%)', min: 70, max: 100 }
      }
    };
  }

  private convertToCSV(data: any): Buffer {
    // Simple CSV conversion - would be more sophisticated in production
    const csv = 'Dashboard Data\n' + JSON.stringify(data, null, 2);
    return Buffer.from(csv);
  }

  private convertToExcel(data: any): Buffer {
    // Mock Excel conversion - would use a library like xlsx
    return Buffer.from('Excel export not implemented');
  }

  private convertToPDF(data: any): Buffer {
    // Mock PDF conversion - would use a library like puppeteer or jspdf
    return Buffer.from('PDF export not implemented');
  }
}