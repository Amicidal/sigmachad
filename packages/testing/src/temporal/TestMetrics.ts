/**
 * @file TestMetrics.ts
 * @description Temporal metrics and trends service for test analysis
 *
 * Provides comprehensive metrics calculation, trend analysis, and statistical
 * operations for test temporal data including time-series analysis and predictions.
 */

import {
  TestExecutionRecord,
  TestTrend,
  TestTrendMetric,
  TrendPeriod,
  TrendDirection,
  TrendDataPoint,
  TestConfiguration,
  TestExecutionMetrics,
  CoverageData
} from './TestTypes.js';

export interface ITestMetrics {
  /**
   * Calculate execution metrics for a test
   */
  calculateExecutionMetrics(
    testId: string,
    entityId: string,
    executions: TestExecutionRecord[]
  ): Promise<TestExecutionMetrics>;

  /**
   * Calculate trend for a specific metric
   */
  calculateTrend(
    testId: string,
    entityId: string,
    metric: TestTrendMetric,
    period: TrendPeriod,
    executions: TestExecutionRecord[]
  ): Promise<TestTrend | null>;

  /**
   * Calculate multiple trends at once
   */
  calculateAllTrends(
    testId: string,
    entityId: string,
    period: TrendPeriod,
    executions: TestExecutionRecord[]
  ): Promise<TestTrend[]>;

  /**
   * Get time-series data for a metric
   */
  getTimeSeriesData(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric,
    aggregationPeriod: 'hour' | 'day' | 'week' | 'month'
  ): Promise<TimeSeriesData>;

  /**
   * Calculate statistical summary for a metric
   */
  calculateStatistics(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric
  ): Promise<StatisticalSummary>;

  /**
   * Predict future trend
   */
  predictTrend(
    trend: TestTrend,
    periodsAhead: number
  ): Promise<TrendPrediction>;

  /**
   * Calculate correlation between metrics
   */
  calculateCorrelation(
    executions: TestExecutionRecord[],
    metric1: TestTrendMetric,
    metric2: TestTrendMetric
  ): Promise<CorrelationAnalysis>;

  /**
   * Detect anomalies in metrics
   */
  detectAnomalies(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric,
    sensitivity: number
  ): Promise<AnomalyDetection>;
}

export interface TimeSeriesData {
  metric: TestTrendMetric;
  aggregationPeriod: 'hour' | 'day' | 'week' | 'month';
  dataPoints: AggregatedDataPoint[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
  };
}

export interface AggregatedDataPoint {
  timestamp: Date;
  value: number;
  count: number; // Number of data points aggregated
  min: number;
  max: number;
  variance: number;
}

export interface StatisticalSummary {
  metric: TestTrendMetric;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode?: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface TrendPrediction {
  trendId: string;
  metric: TestTrendMetric;
  predictions: PredictionPoint[];
  confidence: number;
  methodology: 'linear' | 'polynomial' | 'exponential' | 'moving_average';
  accuracy: number; // Based on historical validation
}

export interface PredictionPoint {
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface CorrelationAnalysis {
  metric1: TestTrendMetric;
  metric2: TestTrendMetric;
  correlationCoefficient: number;
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  direction: 'positive' | 'negative' | 'none';
  significance: number; // p-value
  dataPoints: number;
}

export interface AnomalyDetection {
  metric: TestTrendMetric;
  anomalies: Anomaly[];
  method: 'zscore' | 'iqr' | 'isolation_forest' | 'statistical';
  threshold: number;
  sensitivity: number;
}

export interface Anomaly {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviationScore: number;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface MetricThreshold {
  metric: TestTrendMetric;
  warningThreshold: number;
  criticalThreshold: number;
  direction: 'above' | 'below' | 'change';
}

export interface PerformanceBaseline {
  metric: TestTrendMetric;
  baselineValue: number;
  baselinePeriod: { start: Date; end: Date };
  confidence: number;
  sampleSize: number;
}

/**
 * Temporal metrics and trends service
 */
export class TestMetrics implements ITestMetrics {
  private readonly config: TestConfiguration;
  private readonly thresholds: Map<TestTrendMetric, MetricThreshold>;
  private readonly baselines: Map<string, PerformanceBaseline>;

  constructor(config: TestConfiguration) {
    this.config = config;
    this.thresholds = new Map();
    this.baselines = new Map();

    this.initializeDefaultThresholds();
  }

  /**
   * Calculate execution metrics for a test
   */
  async calculateExecutionMetrics(
    testId: string,
    entityId: string,
    executions: TestExecutionRecord[]
  ): Promise<TestExecutionMetrics> {
    const totalExecutions = executions.length;
    const passedExecutions = executions.filter(exec => exec.status === 'pass').length;
    const failedExecutions = executions.filter(exec => exec.status === 'fail').length;
    const skippedExecutions = executions.filter(exec => exec.status === 'skip').length;

    const successRate = totalExecutions > 0 ? passedExecutions / totalExecutions : 0;

    // Calculate average duration
    const durations = executions.filter(exec => exec.duration).map(exec => exec.duration!);
    const averageDuration = durations.length > 0 ?
      durations.reduce((sum, d) => sum + d, 0) / durations.length : undefined;

    // Calculate flakiness score
    const flakinessScore = this.calculateFlakinessScore(executions);

    // Find timestamps
    const lastExecutionAt = executions.length > 0 ?
      executions[executions.length - 1].timestamp : undefined;
    const lastPassedAt = executions.reverse().find(exec => exec.status === 'pass')?.timestamp;
    const lastFailedAt = executions.reverse().find(exec => exec.status === 'fail')?.timestamp;

    return {
      totalExecutions,
      passedExecutions,
      failedExecutions,
      skippedExecutions,
      successRate,
      averageDuration,
      flakinessScore,
      lastExecutionAt,
      lastPassedAt,
      lastFailedAt
    };
  }

  /**
   * Calculate trend for a specific metric
   */
  async calculateTrend(
    testId: string,
    entityId: string,
    metric: TestTrendMetric,
    period: TrendPeriod,
    executions: TestExecutionRecord[]
  ): Promise<TestTrend | null> {
    const dataPoints = this.extractMetricValues(executions, metric);
    if (dataPoints.length < 3) return null;

    const trendAnalysis = this.performTrendAnalysis(dataPoints);
    if (!trendAnalysis) return null;

    return {
      trendId: `trend_${testId}_${entityId}_${metric}_${Date.now()}`,
      testId,
      entityId,
      metric,
      period,
      direction: trendAnalysis.direction,
      magnitude: trendAnalysis.magnitude,
      startDate: dataPoints[0].timestamp,
      endDate: dataPoints[dataPoints.length - 1].timestamp,
      confidence: trendAnalysis.confidence,
      dataPoints
    };
  }

  /**
   * Calculate multiple trends at once
   */
  async calculateAllTrends(
    testId: string,
    entityId: string,
    period: TrendPeriod,
    executions: TestExecutionRecord[]
  ): Promise<TestTrend[]> {
    const metrics: TestTrendMetric[] = ['coverage', 'success_rate', 'execution_time', 'flakiness'];
    const trends: TestTrend[] = [];

    for (const metric of metrics) {
      const trend = await this.calculateTrend(testId, entityId, metric, period, executions);
      if (trend) {
        trends.push(trend);
      }
    }

    return trends;
  }

  /**
   * Get time-series data for a metric
   */
  async getTimeSeriesData(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric,
    aggregationPeriod: 'hour' | 'day' | 'week' | 'month'
  ): Promise<TimeSeriesData> {
    const dataPoints = this.extractMetricValues(executions, metric);
    const aggregatedPoints = this.aggregateDataPoints(dataPoints, aggregationPeriod);
    const statistics = this.calculateTimeSeriesStatistics(aggregatedPoints);

    return {
      metric,
      aggregationPeriod,
      dataPoints: aggregatedPoints,
      statistics
    };
  }

  /**
   * Calculate statistical summary for a metric
   */
  async calculateStatistics(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric
  ): Promise<StatisticalSummary> {
    const values = this.extractMetricValues(executions, metric).map(dp => dp.value);

    if (values.length === 0) {
      return this.getEmptyStatistics(metric);
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const count = values.length;
    const min = sortedValues[0];
    const max = sortedValues[count - 1];
    const mean = values.reduce((sum, v) => sum + v, 0) / count;

    const median = this.calculateMedian(sortedValues);
    const mode = this.calculateMode(values);
    const variance = this.calculateVariance(values, mean);
    const standardDeviation = Math.sqrt(variance);
    const skewness = this.calculateSkewness(values, mean, standardDeviation);
    const kurtosis = this.calculateKurtosis(values, mean, standardDeviation);

    const percentiles = {
      p25: this.calculatePercentile(sortedValues, 25),
      p50: median,
      p75: this.calculatePercentile(sortedValues, 75),
      p90: this.calculatePercentile(sortedValues, 90),
      p95: this.calculatePercentile(sortedValues, 95),
      p99: this.calculatePercentile(sortedValues, 99)
    };

    return {
      metric,
      count,
      min,
      max,
      mean,
      median,
      mode,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      percentiles
    };
  }

  /**
   * Predict future trend
   */
  async predictTrend(
    trend: TestTrend,
    periodsAhead: number
  ): Promise<TrendPrediction> {
    const methodology = this.selectPredictionMethodology(trend);
    const predictions = this.generatePredictions(trend, periodsAhead, methodology);
    const confidence = this.calculatePredictionConfidence(trend, methodology);
    const accuracy = this.validatePredictionAccuracy(trend, methodology);

    return {
      trendId: trend.trendId,
      metric: trend.metric,
      predictions,
      confidence,
      methodology,
      accuracy
    };
  }

  /**
   * Calculate correlation between metrics
   */
  async calculateCorrelation(
    executions: TestExecutionRecord[],
    metric1: TestTrendMetric,
    metric2: TestTrendMetric
  ): Promise<CorrelationAnalysis> {
    const values1 = this.extractMetricValues(executions, metric1).map(dp => dp.value);
    const values2 = this.extractMetricValues(executions, metric2).map(dp => dp.value);

    const minLength = Math.min(values1.length, values2.length);
    const x = values1.slice(0, minLength);
    const y = values2.slice(0, minLength);

    const correlationCoefficient = this.calculatePearsonCorrelation(x, y);
    const strength = this.interpretCorrelationStrength(Math.abs(correlationCoefficient));
    const direction = correlationCoefficient > 0 ? 'positive' :
                     correlationCoefficient < 0 ? 'negative' : 'none';
    const significance = this.calculateCorrelationSignificance(correlationCoefficient, minLength);

    return {
      metric1,
      metric2,
      correlationCoefficient,
      strength,
      direction,
      significance,
      dataPoints: minLength
    };
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(
    executions: TestExecutionRecord[],
    metric: TestTrendMetric,
    sensitivity: number = 2.0
  ): Promise<AnomalyDetection> {
    const dataPoints = this.extractMetricValues(executions, metric);
    const method = 'zscore'; // Using Z-score method for simplicity
    const anomalies = this.detectZScoreAnomalies(dataPoints, sensitivity);

    return {
      metric,
      anomalies,
      method,
      threshold: sensitivity,
      sensitivity
    };
  }

  // Private helper methods

  private initializeDefaultThresholds(): void {
    this.thresholds.set('coverage', {
      metric: 'coverage',
      warningThreshold: 0.7,
      criticalThreshold: 0.5,
      direction: 'below'
    });

    this.thresholds.set('success_rate', {
      metric: 'success_rate',
      warningThreshold: 0.95,
      criticalThreshold: 0.9,
      direction: 'below'
    });

    this.thresholds.set('execution_time', {
      metric: 'execution_time',
      warningThreshold: 1.5,
      criticalThreshold: 2.0,
      direction: 'change'
    });

    this.thresholds.set('flakiness', {
      metric: 'flakiness',
      warningThreshold: 0.1,
      criticalThreshold: 0.2,
      direction: 'above'
    });
  }

  private calculateFlakinessScore(executions: TestExecutionRecord[]): number {
    if (executions.length < 10) return 0;

    const recentExecutions = executions.slice(-20);
    const failures = recentExecutions.filter(exec => exec.status === 'fail').length;
    return failures / recentExecutions.length;
  }

  private extractMetricValues(executions: TestExecutionRecord[], metric: TestTrendMetric): TrendDataPoint[] {
    return executions.map(exec => {
      let value = 0;

      switch (metric) {
        case 'coverage':
          value = exec.coverage?.overall || 0;
          break;
        case 'success_rate':
          value = exec.status === 'pass' ? 1 : 0;
          break;
        case 'execution_time':
          value = exec.duration || 0;
          break;
        case 'flakiness':
          value = exec.status === 'fail' ? 1 : 0;
          break;
        case 'failure_rate':
          value = exec.status === 'fail' ? 1 : 0;
          break;
      }

      return {
        timestamp: exec.timestamp,
        value,
        metadata: { executionId: exec.executionId }
      };
    });
  }

  private performTrendAnalysis(dataPoints: TrendDataPoint[]): {
    direction: TrendDirection;
    magnitude: number;
    confidence: number;
  } | null {
    if (dataPoints.length < 3) return null;

    // Linear regression to find trend
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(dp => dp.value);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const predictions = x.map(xi => slope * xi + intercept);
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - sumY / n, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    let direction: TrendDirection = 'stable';
    if (Math.abs(slope) > 0.001) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      magnitude: Math.abs(slope),
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  private aggregateDataPoints(
    dataPoints: TrendDataPoint[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): AggregatedDataPoint[] {
    const groups = this.groupDataPointsByPeriod(dataPoints, period);
    const aggregated: AggregatedDataPoint[] = [];

    for (const [timestamp, points] of groups.entries()) {
      const values = points.map(p => p.value);
      const count = values.length;
      const sum = values.reduce((s, v) => s + v, 0);
      const mean = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const variance = this.calculateVariance(values, mean);

      aggregated.push({
        timestamp: new Date(timestamp),
        value: mean,
        count,
        min,
        max,
        variance
      });
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private groupDataPointsByPeriod(
    dataPoints: TrendDataPoint[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): Map<number, TrendDataPoint[]> {
    const groups = new Map<number, TrendDataPoint[]>();

    for (const point of dataPoints) {
      const key = this.getPeriodKey(point.timestamp, period);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point);
    }

    return groups;
  }

  private getPeriodKey(date: Date, period: 'hour' | 'day' | 'week' | 'month'): number {
    const d = new Date(date);

    switch (period) {
      case 'hour':
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
      case 'day':
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      case 'week':
        {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        }
      case 'month':
        return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }
  }

  private calculateTimeSeriesStatistics(dataPoints: AggregatedDataPoint[]) {
    const values = dataPoints.map(dp => dp.value);
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, standardDeviation: 0 };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = this.calculateMedian(sortedValues);
    const standardDeviation = Math.sqrt(this.calculateVariance(values, mean));

    return { min, max, mean, median, standardDeviation };
  }

  private calculateMedian(sortedValues: number[]): number {
    const n = sortedValues.length;
    if (n % 2 === 0) {
      return (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2;
    }
    return sortedValues[Math.floor(n / 2)];
  }

  private calculateMode(values: number[]): number | undefined {
    const frequency = new Map<number, number>();
    for (const value of values) {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    }

    let mode: number | undefined;
    let maxFreq = 0;
    for (const [value, freq] of frequency.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = value;
      }
    }

    return maxFreq > 1 ? mode : undefined;
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    const n = values.length;
    const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    const n = values.length;
    const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private getEmptyStatistics(metric: TestTrendMetric): StatisticalSummary {
    return {
      metric,
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      skewness: 0,
      kurtosis: 0,
      percentiles: {
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0
      }
    };
  }

  private selectPredictionMethodology(trend: TestTrend): 'linear' | 'polynomial' | 'exponential' | 'moving_average' {
    // Simple methodology selection based on trend characteristics
    if (trend.confidence > 0.8 && trend.direction !== 'stable') {
      return 'linear';
    }
    return 'moving_average';
  }

  private generatePredictions(
    trend: TestTrend,
    periodsAhead: number,
    methodology: 'linear' | 'polynomial' | 'exponential' | 'moving_average'
  ): PredictionPoint[] {
    const predictions: PredictionPoint[] = [];
    const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
    const periodMs = this.getPeriodMilliseconds(trend.period);

    for (let i = 1; i <= periodsAhead; i++) {
      const timestamp = new Date(lastPoint.timestamp.getTime() + i * periodMs);
      let predictedValue = lastPoint.value;

      if (methodology === 'linear') {
        predictedValue = this.linearPredict(trend, i);
      } else if (methodology === 'moving_average') {
        predictedValue = this.movingAveragePredict(trend);
      }

      const confidenceInterval = this.calculateConfidenceInterval(trend, predictedValue);

      predictions.push({
        timestamp,
        predictedValue,
        confidenceInterval
      });
    }

    return predictions;
  }

  private getPeriodMilliseconds(period: TrendPeriod): number {
    switch (period) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      case 'quarterly': return 90 * 24 * 60 * 60 * 1000;
    }
  }

  private linearPredict(trend: TestTrend, periodsAhead: number): number {
    // Simple linear prediction based on trend magnitude and direction
    const lastValue = trend.dataPoints[trend.dataPoints.length - 1].value;
    const change = trend.magnitude * periodsAhead;

    if (trend.direction === 'increasing') {
      return lastValue + change;
    } else if (trend.direction === 'decreasing') {
      return Math.max(0, lastValue - change);
    }
    return lastValue;
  }

  private movingAveragePredict(trend: TestTrend): number {
    const recentPoints = trend.dataPoints.slice(-5);
    return recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
  }

  private calculateConfidenceInterval(trend: TestTrend, predictedValue: number): { lower: number; upper: number } {
    const variance = this.calculatePredictionVariance(trend);
    const margin = 1.96 * Math.sqrt(variance); // 95% confidence interval

    return {
      lower: Math.max(0, predictedValue - margin),
      upper: predictedValue + margin
    };
  }

  private calculatePredictionVariance(trend: TestTrend): number {
    const values = trend.dataPoints.map(p => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return this.calculateVariance(values, mean);
  }

  private calculatePredictionConfidence(
    trend: TestTrend,
    methodology: 'linear' | 'polynomial' | 'exponential' | 'moving_average'
  ): number {
    // Simplified confidence calculation
    const baseConfidence = trend.confidence;
    const methodologyBonus = methodology === 'linear' ? 0.1 : 0;
    return Math.min(1, baseConfidence + methodologyBonus);
  }

  private validatePredictionAccuracy(
    trend: TestTrend,
    methodology: 'linear' | 'polynomial' | 'exponential' | 'moving_average'
  ): number {
    // Simplified accuracy validation
    return trend.confidence * 0.8; // Placeholder
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private interpretCorrelationStrength(
    correlation: number
  ): 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong' {
    const abs = Math.abs(correlation);
    if (abs < 0.2) return 'very_weak';
    if (abs < 0.4) return 'weak';
    if (abs < 0.6) return 'moderate';
    if (abs < 0.8) return 'strong';
    return 'very_strong';
  }

  private calculateCorrelationSignificance(correlation: number, n: number): number {
    // Simplified p-value calculation for correlation
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    // This is a simplified approximation
    return Math.max(0, 1 - Math.abs(t) / 10);
  }

  private detectZScoreAnomalies(dataPoints: TrendDataPoint[], threshold: number): Anomaly[] {
    const values = dataPoints.map(dp => dp.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(this.calculateVariance(values, mean));

    const anomalies: Anomaly[] = [];

    for (const point of dataPoints) {
      const zScore = Math.abs(point.value - mean) / stdDev;
      if (zScore > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: mean,
          deviationScore: zScore,
          severity: zScore > threshold * 2 ? 'severe' :
                   zScore > threshold * 1.5 ? 'moderate' : 'mild',
          description: `Value ${point.value.toFixed(3)} deviates ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(3)}`
        });
      }
    }

    return anomalies;
  }
}
