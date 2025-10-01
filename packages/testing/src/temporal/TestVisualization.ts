/**
 * @file TestVisualization.ts
 * @description Visualization capabilities for temporal test tracking
 *
 * Provides timeline visualization, coverage heatmaps, flakiness trend charts,
 * and performance graphs for test evolution analysis.
 */

import {
  TestExecutionRecord,
  TestEvolutionEvent,
  TestRelationship,
  TrendDataPoint,
  TestConfiguration
} from './TestTypes.js';

export interface TimelineVisualizationConfig {
  /** Width of the visualization in pixels */
  width: number;
  /** Height of the visualization in pixels */
  height: number;
  /** Color scheme for the visualization */
  colorScheme: 'light' | 'dark' | 'auto';
  /** Show detailed tooltips */
  showTooltips: boolean;
  /** Animation duration in milliseconds */
  animationDuration: number;
  /** Date format for axis labels */
  dateFormat: string;
}

export interface CoverageHeatmapConfig extends TimelineVisualizationConfig {
  /** Grid resolution for the heatmap */
  gridSize: number;
  /** Coverage threshold for color coding */
  coverageThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface FlakinessChartConfig extends TimelineVisualizationConfig {
  /** Moving average window size */
  movingAverageWindow: number;
  /** Flakiness threshold line */
  flakinessThreshold: number;
  /** Show confidence intervals */
  showConfidenceIntervals: boolean;
}

export interface PerformanceGraphConfig extends TimelineVisualizationConfig {
  /** Y-axis scale type */
  yAxisScale: 'linear' | 'logarithmic';
  /** Show performance baselines */
  showBaselines: boolean;
  /** Performance metrics to display */
  metrics: string[];
}

export interface VisualizationDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
  color?: string;
  size?: number;
}

export interface TimelineData {
  events: Array<{
    timestamp: Date;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }>;
  relationships: Array<{
    timestamp: Date;
    action: 'added' | 'removed' | 'modified';
    relationshipType: string;
    confidence: number;
  }>;
  executions: Array<{
    timestamp: Date;
    status: 'pass' | 'fail' | 'skip';
    duration: number;
    coverage?: number;
  }>;
}

export interface HeatmapData {
  grid: Array<Array<{
    coverage: number;
    executions: number;
    timestamp: Date;
  }>>;
  xLabels: string[];
  yLabels: string[];
  statistics: {
    minCoverage: number;
    maxCoverage: number;
    avgCoverage: number;
    totalExecutions: number;
  };
}

export interface FlakinessChartData {
  dataPoints: Array<{
    timestamp: Date;
    flakinessScore: number;
    executionCount: number;
    confidenceInterval?: {
      lower: number;
      upper: number;
    };
  }>;
  movingAverage: Array<{
    timestamp: Date;
    average: number;
  }>;
  threshold: number;
  annotations: Array<{
    timestamp: Date;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export interface PerformanceGraphData {
  metrics: Record<string, Array<{
    timestamp: Date;
    value: number;
    baseline?: number;
    trend?: 'improving' | 'degrading' | 'stable';
  }>>;
  baselines: Record<string, number>;
  annotations: Array<{
    timestamp: Date;
    metric: string;
    message: string;
    type: 'milestone' | 'regression' | 'improvement';
  }>;
}

export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'json' | 'csv';
  resolution?: number;
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ITestVisualization {
  /**
   * Generate timeline visualization data
   */
  generateTimeline(
    events: TestEvolutionEvent[],
    relationships: TestRelationship[],
    executions: TestExecutionRecord[],
    config?: Partial<TimelineVisualizationConfig>
  ): Promise<TimelineData>;

  /**
   * Generate coverage heatmap data
   */
  generateCoverageHeatmap(
    executions: TestExecutionRecord[],
    timeWindow: { start: Date; end: Date },
    config?: Partial<CoverageHeatmapConfig>
  ): Promise<HeatmapData>;

  /**
   * Generate flakiness trend chart data
   */
  generateFlakinessChart(
    executions: TestExecutionRecord[],
    config?: Partial<FlakinessChartConfig>
  ): Promise<FlakinessChartData>;

  /**
   * Generate performance graph data
   */
  generatePerformanceGraph(
    executions: TestExecutionRecord[],
    metrics: string[],
    config?: Partial<PerformanceGraphConfig>
  ): Promise<PerformanceGraphData>;

  /**
   * Export visualization data
   */
  exportVisualization(
    data: any,
    options: ExportOptions
  ): Promise<Buffer | string>;

  /**
   * Generate dashboard summary
   */
  generateDashboard(
    testId?: string,
    entityId?: string,
    timeWindow?: { start: Date; end: Date }
  ): Promise<{
    timeline: TimelineData;
    coverageHeatmap: HeatmapData;
    flakinessChart: FlakinessChartData;
    performanceGraph: PerformanceGraphData;
    summary: {
      totalExecutions: number;
      successRate: number;
      avgCoverage: number;
      flakinessScore: number;
      performanceTrend: 'improving' | 'degrading' | 'stable';
    };
  }>;
}

/**
 * Comprehensive visualization service for temporal test tracking
 */
export class TestVisualization implements ITestVisualization {
  private readonly config: TestConfiguration;

  constructor(
    config: Partial<TestConfiguration> = {},
    private executionData: Map<string, TestExecutionRecord[]> = new Map(),
    private eventData: Map<string, TestEvolutionEvent[]> = new Map(),
    private relationshipData: Map<string, TestRelationship[]> = new Map()
  ) {
    this.config = {
      maxTrendDataPoints: 1000,
      flakinessThreshold: 0.1,
      coverageChangeThreshold: 0.05,
      performanceRegressionThreshold: 1.5,
      obsolescenceDetectionEnabled: true,
      trendAnalysisPeriod: 'weekly',
      batchSize: 100,
      ...config
    };
  }

  /**
   * Generate timeline visualization data
   */
  async generateTimeline(
    events: TestEvolutionEvent[],
    relationships: TestRelationship[],
    executions: TestExecutionRecord[],
    config: Partial<TimelineVisualizationConfig> = {}
  ): Promise<TimelineData> {
    const defaultConfig: TimelineVisualizationConfig = {
      width: 1200,
      height: 600,
      colorScheme: 'auto',
      showTooltips: true,
      animationDuration: 300,
      dateFormat: 'YYYY-MM-DD HH:mm',
      ...config
    };

    // Process events
    const processedEvents = events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      description: event.description,
      severity: this.determineSeverity(event),
      metadata: event.metadata
    }));

    // Process relationships
    const processedRelationships: Array<{
      timestamp: Date;
      action: 'added' | 'modified' | 'removed';
      relationshipType: string;
      confidence: number;
    }> = relationships.map(rel => ({
      timestamp: rel.validFrom,
      action: 'added',
      relationshipType: String(rel.type),
      confidence: (rel as any).confidence ?? 1,
    }));

    // Add relationship end events
    relationships
      .filter(rel => rel.validTo)
      .forEach(rel => {
        processedRelationships.push({
          timestamp: rel.validTo!,
          action: 'removed',
          relationshipType: rel.type,
          confidence: rel.confidence
        });
      });

    // Process executions
    const processedExecutions = executions.map(exec => ({
      timestamp: exec.timestamp,
      status: exec.status as 'pass' | 'fail' | 'skip',
      duration: exec.duration || 0,
      coverage: exec.coverage?.overall
    }));

    return {
      events: processedEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      relationships: processedRelationships.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      executions: processedExecutions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    };
  }

  /**
   * Generate coverage heatmap data
   */
  async generateCoverageHeatmap(
    executions: TestExecutionRecord[],
    timeWindow: { start: Date; end: Date },
    config: Partial<CoverageHeatmapConfig> = {}
  ): Promise<HeatmapData> {
    const defaultConfig: CoverageHeatmapConfig = {
      width: 800,
      height: 400,
      colorScheme: 'auto',
      showTooltips: true,
      animationDuration: 300,
      dateFormat: 'YYYY-MM-DD',
      gridSize: 20,
      coverageThresholds: {
        low: 0.3,
        medium: 0.7,
        high: 0.9
      },
      ...config
    };

    // Filter executions to time window
    const filteredExecutions = executions.filter(
      exec => exec.timestamp >= timeWindow.start && exec.timestamp <= timeWindow.end
    );

    // Create time buckets
    const timeRange = timeWindow.end.getTime() - timeWindow.start.getTime();
    const bucketSize = timeRange / defaultConfig.gridSize;
    const timeBuckets: Date[] = [];

    for (let i = 0; i < defaultConfig.gridSize; i++) {
      timeBuckets.push(new Date(timeWindow.start.getTime() + i * bucketSize));
    }

    // Group executions by test ID
    const testGroups = new Map<string, TestExecutionRecord[]>();
    filteredExecutions.forEach(exec => {
      const key = exec.testId;
      if (!testGroups.has(key)) {
        testGroups.set(key, []);
      }
      testGroups.get(key)!.push(exec);
    });

    const testIds = Array.from(testGroups.keys()).slice(0, defaultConfig.gridSize);

    // Generate grid data
    const grid: Array<Array<{ coverage: number; executions: number; timestamp: Date }>> = [];

    for (let y = 0; y < testIds.length; y++) {
      const row: Array<{ coverage: number; executions: number; timestamp: Date }> = [];
      const testExecs = testGroups.get(testIds[y]) || [];

      for (let x = 0; x < timeBuckets.length; x++) {
        const bucketStart = timeBuckets[x];
        const bucketEnd = new Date(bucketStart.getTime() + bucketSize);

        const bucketExecs = testExecs.filter(
          exec => exec.timestamp >= bucketStart && exec.timestamp < bucketEnd
        );

        const avgCoverage = bucketExecs.length > 0
          ? bucketExecs
              .filter(exec => exec.coverage)
              .reduce((sum, exec) => sum + exec.coverage!.overall, 0) /
            bucketExecs.filter(exec => exec.coverage).length
          : 0;

        row.push({
          coverage: avgCoverage || 0,
          executions: bucketExecs.length,
          timestamp: bucketStart
        });
      }
      grid.push(row);
    }

    // Calculate statistics
    const allCoverageValues = grid.flat().map(cell => cell.coverage).filter(c => c > 0);
    const statistics = {
      minCoverage: Math.min(...allCoverageValues, 0),
      maxCoverage: Math.max(...allCoverageValues, 0),
      avgCoverage: allCoverageValues.length > 0
        ? allCoverageValues.reduce((sum, c) => sum + c, 0) / allCoverageValues.length
        : 0,
      totalExecutions: grid.flat().reduce((sum, cell) => sum + cell.executions, 0)
    };

    return {
      grid,
      xLabels: timeBuckets.map(date => date.toISOString().split('T')[0]),
      yLabels: testIds,
      statistics
    };
  }

  /**
   * Generate flakiness trend chart data
   */
  async generateFlakinessChart(
    executions: TestExecutionRecord[],
    config: Partial<FlakinessChartConfig> = {}
  ): Promise<FlakinessChartData> {
    const defaultConfig: FlakinessChartConfig = {
      width: 1000,
      height: 400,
      colorScheme: 'auto',
      showTooltips: true,
      animationDuration: 300,
      dateFormat: 'YYYY-MM-DD',
      movingAverageWindow: 7,
      flakinessThreshold: this.config.flakinessThreshold,
      showConfidenceIntervals: true,
      ...config
    };

    // Sort executions by timestamp
    const sortedExecutions = executions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate flakiness scores over time
    const dataPoints: Array<{
      timestamp: Date;
      flakinessScore: number;
      executionCount: number;
      confidenceInterval?: { lower: number; upper: number };
    }> = [];

    const windowSize = 20; // Number of executions to consider for flakiness calculation

    for (let i = windowSize; i < sortedExecutions.length; i++) {
      const window = sortedExecutions.slice(i - windowSize, i);
      const failures = window.filter(exec => exec.status === 'fail').length;
      const flakinessScore = failures / window.length;

      // Calculate confidence interval using binomial distribution
      const n = window.length;
      const p = flakinessScore;
      const z = 1.96; // 95% confidence
      const margin = z * Math.sqrt((p * (1 - p)) / n);

      dataPoints.push({
        timestamp: sortedExecutions[i].timestamp,
        flakinessScore,
        executionCount: window.length,
        confidenceInterval: defaultConfig.showConfidenceIntervals ? {
          lower: Math.max(0, p - margin),
          upper: Math.min(1, p + margin)
        } : undefined
      });
    }

    // Calculate moving average
    const movingAverage: Array<{ timestamp: Date; average: number }> = [];
    const windowLen = defaultConfig.movingAverageWindow;

    for (let i = windowLen - 1; i < dataPoints.length; i++) {
      const window = dataPoints.slice(i - windowLen + 1, i + 1);
      const average = window.reduce((sum, point) => sum + point.flakinessScore, 0) / window.length;

      movingAverage.push({
        timestamp: dataPoints[i].timestamp,
        average
      });
    }

    // Generate annotations for significant events
    const annotations: Array<{
      timestamp: Date;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }> = [];

    for (let i = 1; i < dataPoints.length; i++) {
      const current = dataPoints[i];
      const previous = dataPoints[i - 1];

      if (current.flakinessScore > defaultConfig.flakinessThreshold &&
          previous.flakinessScore <= defaultConfig.flakinessThreshold) {
        annotations.push({
          timestamp: current.timestamp,
          message: `Flakiness threshold exceeded: ${(current.flakinessScore * 100).toFixed(1)}%`,
          severity: 'warning'
        });
      }

      if (current.flakinessScore > 0.5 && previous.flakinessScore <= 0.5) {
        annotations.push({
          timestamp: current.timestamp,
          message: `High flakiness detected: ${(current.flakinessScore * 100).toFixed(1)}%`,
          severity: 'error'
        });
      }
    }

    return {
      dataPoints,
      movingAverage,
      threshold: defaultConfig.flakinessThreshold,
      annotations
    };
  }

  /**
   * Generate performance graph data
   */
  async generatePerformanceGraph(
    executions: TestExecutionRecord[],
    metrics: string[] = ['duration'],
    config: Partial<PerformanceGraphConfig> = {}
  ): Promise<PerformanceGraphData> {
    const defaultConfig: PerformanceGraphConfig = {
      width: 1000,
      height: 400,
      colorScheme: 'auto',
      showTooltips: true,
      animationDuration: 300,
      dateFormat: 'YYYY-MM-DD',
      yAxisScale: 'linear',
      showBaselines: true,
      metrics: ['duration'],
      ...config
    };

    // Sort executions by timestamp
    const sortedExecutions = executions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Process each metric
    const metricsData: Record<string, Array<{
      timestamp: Date;
      value: number;
      baseline?: number;
      trend?: 'improving' | 'degrading' | 'stable';
    }>> = {};

    const baselines: Record<string, number> = {};

    for (const metricName of metrics) {
      const metricPoints: Array<{
        timestamp: Date;
        value: number;
        baseline?: number;
        trend?: 'improving' | 'degrading' | 'stable';
      }> = [];

      // Extract metric values
      const values: Array<{ timestamp: Date; value: number }> = [];

      for (const exec of sortedExecutions) {
        let value: number | undefined;
        const extraPerf = (exec as any)?.metadata?.additional?.performance as
          | Record<string, any>
          | undefined;

        switch (metricName) {
          case 'duration':
            value = exec.duration;
            break;
          case 'coverage':
            value = exec.coverage?.overall;
            break;
          case 'memory':
            value = (extraPerf?.memory ?? extraPerf?.memoryUsage) as number | undefined;
            break;
          case 'cpu':
            value = (extraPerf?.cpu ?? extraPerf?.cpuUsage) as number | undefined;
            break;
          default:
            value = typeof extraPerf?.[metricName] === 'number' ? (extraPerf?.[metricName] as number) : undefined;
        }

        if (value !== undefined) {
          values.push({ timestamp: exec.timestamp, value });
        }
      }

      if (values.length === 0) continue;

      // Calculate baseline (median of all values)
      const allValues = values.map(v => v.value).sort((a, b) => a - b);
      const median = allValues[Math.floor(allValues.length / 2)];
      baselines[metricName] = median;

      // Calculate trends using moving window
      const trendWindow = 10;

      for (let i = 0; i < values.length; i++) {
        const { timestamp, value } = values[i];

        let trend: 'improving' | 'degrading' | 'stable' = 'stable';

        if (i >= trendWindow) {
          const recentValues = values.slice(i - trendWindow + 1, i + 1).map(v => v.value);
          const oldValues = values.slice(Math.max(0, i - trendWindow * 2), i - trendWindow + 1).map(v => v.value);

          if (recentValues.length > 0 && oldValues.length > 0) {
            const recentAvg = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
            const oldAvg = oldValues.reduce((sum, v) => sum + v, 0) / oldValues.length;

            const change = (recentAvg - oldAvg) / oldAvg;

            if (Math.abs(change) > 0.1) {
              // For duration/performance metrics, lower is better
              if (metricName === 'duration' || metricName === 'memory' || metricName === 'cpu') {
                trend = change < 0 ? 'improving' : 'degrading';
              } else {
                // For coverage metrics, higher is better
                trend = change > 0 ? 'improving' : 'degrading';
              }
            }
          }
        }

        metricPoints.push({
          timestamp,
          value,
          baseline: defaultConfig.showBaselines ? median : undefined,
          trend
        });
      }

      metricsData[metricName] = metricPoints;
    }

    // Generate annotations for significant performance events
    const annotations: Array<{
      timestamp: Date;
      metric: string;
      message: string;
      type: 'milestone' | 'regression' | 'improvement';
    }> = [];

    for (const [metricName, points] of Object.entries(metricsData)) {
      const baseline = baselines[metricName];

      for (let i = 1; i < points.length; i++) {
        const current = points[i];
        const previous = points[i - 1];

        // Detect significant changes
        const changeRatio = Math.abs(current.value - previous.value) / previous.value;

        if (changeRatio > this.config.performanceRegressionThreshold - 1) {
          const isRegression = metricName === 'duration' ?
            current.value > previous.value :
            current.value < previous.value;

          annotations.push({
            timestamp: current.timestamp,
            metric: metricName,
            message: `${isRegression ? 'Performance regression' : 'Performance improvement'} detected: ${(changeRatio * 100).toFixed(1)}% change`,
            type: isRegression ? 'regression' : 'improvement'
          });
        }
      }
    }

    return {
      metrics: metricsData,
      baselines,
      annotations
    };
  }

  /**
   * Export visualization data
   */
  async exportVisualization(
    data: any,
    options: ExportOptions
  ): Promise<Buffer | string> {
    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, options.compression ? 0 : 2);

      case 'csv':
        return this.convertToCSV(data);

      case 'svg':
      case 'png':
      case 'pdf':
        // These would require a rendering library like D3.js or Chart.js
        // For now, return the data in JSON format with instructions
        return JSON.stringify({
          format: options.format,
          data,
          instructions: `To render this visualization, use a charting library that supports ${options.format} export.`
        }, null, 2);

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate dashboard summary
   */
  async generateDashboard(
    testId?: string,
    entityId?: string,
    timeWindow?: { start: Date; end: Date }
  ): Promise<{
    timeline: TimelineData;
    coverageHeatmap: HeatmapData;
    flakinessChart: FlakinessChartData;
    performanceGraph: PerformanceGraphData;
    summary: {
      totalExecutions: number;
      successRate: number;
      avgCoverage: number;
      flakinessScore: number;
      performanceTrend: 'improving' | 'degrading' | 'stable';
    };
  }> {
    // Get data for the specified filters
    let executions: TestExecutionRecord[] = [];
    let events: TestEvolutionEvent[] = [];
    let relationships: TestRelationship[] = [];

    // Collect data from all sources
    for (const [key, execs] of this.executionData.entries()) {
      if (testId && !key.includes(testId)) continue;
      if (entityId && !key.includes(entityId)) continue;
      executions.push(...execs);
    }

    for (const [key, evts] of this.eventData.entries()) {
      if (testId && !key.includes(testId)) continue;
      if (entityId && !key.includes(entityId)) continue;
      events.push(...evts);
    }

    for (const [key, rels] of this.relationshipData.entries()) {
      if (testId && !key.includes(testId)) continue;
      if (entityId && !key.includes(entityId)) continue;
      relationships.push(...rels);
    }

    // Apply time window filter
    if (timeWindow) {
      executions = executions.filter(
        exec => exec.timestamp >= timeWindow.start && exec.timestamp <= timeWindow.end
      );
      events = events.filter(
        event => event.timestamp >= timeWindow.start && event.timestamp <= timeWindow.end
      );
      relationships = relationships.filter(
        rel => rel.validFrom >= timeWindow.start && (!rel.validTo || rel.validTo <= timeWindow.end)
      );
    }

    // Use default time window if none provided
    const defaultTimeWindow = timeWindow || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    // Generate all visualizations
    const [timeline, coverageHeatmap, flakinessChart, performanceGraph] = await Promise.all([
      this.generateTimeline(events, relationships, executions),
      this.generateCoverageHeatmap(executions, defaultTimeWindow),
      this.generateFlakinessChart(executions),
      this.generatePerformanceGraph(executions, ['duration', 'coverage'])
    ]);

    // Calculate summary statistics
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(exec => exec.status === 'pass').length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    const coverageValues = executions
      .filter(exec => exec.coverage)
      .map(exec => exec.coverage!.overall);
    const avgCoverage = coverageValues.length > 0
      ? coverageValues.reduce((sum, c) => sum + c, 0) / coverageValues.length
      : 0;

    const flakinessScore = flakinessChart.dataPoints.length > 0
      ? flakinessChart.dataPoints[flakinessChart.dataPoints.length - 1].flakinessScore
      : 0;

    // Determine performance trend
    let performanceTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    const durationMetrics = performanceGraph.metrics.duration;
    if (durationMetrics && durationMetrics.length > 10) {
      const recent = durationMetrics.slice(-5);
      const older = durationMetrics.slice(-15, -10);

      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

        const change = (recentAvg - olderAvg) / olderAvg;
        if (Math.abs(change) > 0.1) {
          performanceTrend = change < 0 ? 'improving' : 'degrading';
        }
      }
    }

    return {
      timeline,
      coverageHeatmap,
      flakinessChart,
      performanceGraph,
      summary: {
        totalExecutions,
        successRate,
        avgCoverage,
        flakinessScore,
        performanceTrend
      }
    };
  }

  // Private helper methods

  private determineSeverity(event: TestEvolutionEvent): 'low' | 'medium' | 'high' | 'critical' {
    switch (event.type) {
      case 'flakiness_detected':
      case 'performance_regression':
        return 'high';
      case 'coverage_decreased':
        return 'medium';
      case 'coverage_increased':
        return 'low';
      case 'test_added':
      case 'test_removed':
        return 'medium';
      case 'relationship_added':
      case 'relationship_removed':
        return 'low';
      default:
        return 'low';
    }
  }

  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }

      return csvRows.join('\n');
    } else {
      // Convert object to key-value CSV
      const rows = ['Key,Value'];
      for (const [key, value] of Object.entries(data)) {
        rows.push(`"${key}","${value}"`);
      }
      return rows.join('\n');
    }
  }

  /**
   * Update internal data stores
   */
  public updateExecutionData(key: string, executions: TestExecutionRecord[]): void {
    this.executionData.set(key, executions);
  }

  public updateEventData(key: string, events: TestEvolutionEvent[]): void {
    this.eventData.set(key, events);
  }

  public updateRelationshipData(key: string, relationships: TestRelationship[]): void {
    this.relationshipData.set(key, relationships);
  }
}
