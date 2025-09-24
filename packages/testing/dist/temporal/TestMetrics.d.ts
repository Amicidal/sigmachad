/**
 * @file TestMetrics.ts
 * @description Temporal metrics and trends service for test analysis
 *
 * Provides comprehensive metrics calculation, trend analysis, and statistical
 * operations for test temporal data including time-series analysis and predictions.
 */
import { TestExecutionRecord, TestTrend, TestTrendMetric, TrendPeriod, TestConfiguration, TestExecutionMetrics } from './TestTypes.js';
export interface ITestMetrics {
    /**
     * Calculate execution metrics for a test
     */
    calculateExecutionMetrics(testId: string, entityId: string, executions: TestExecutionRecord[]): Promise<TestExecutionMetrics>;
    /**
     * Calculate trend for a specific metric
     */
    calculateTrend(testId: string, entityId: string, metric: TestTrendMetric, period: TrendPeriod, executions: TestExecutionRecord[]): Promise<TestTrend | null>;
    /**
     * Calculate multiple trends at once
     */
    calculateAllTrends(testId: string, entityId: string, period: TrendPeriod, executions: TestExecutionRecord[]): Promise<TestTrend[]>;
    /**
     * Get time-series data for a metric
     */
    getTimeSeriesData(executions: TestExecutionRecord[], metric: TestTrendMetric, aggregationPeriod: 'hour' | 'day' | 'week' | 'month'): Promise<TimeSeriesData>;
    /**
     * Calculate statistical summary for a metric
     */
    calculateStatistics(executions: TestExecutionRecord[], metric: TestTrendMetric): Promise<StatisticalSummary>;
    /**
     * Predict future trend
     */
    predictTrend(trend: TestTrend, periodsAhead: number): Promise<TrendPrediction>;
    /**
     * Calculate correlation between metrics
     */
    calculateCorrelation(executions: TestExecutionRecord[], metric1: TestTrendMetric, metric2: TestTrendMetric): Promise<CorrelationAnalysis>;
    /**
     * Detect anomalies in metrics
     */
    detectAnomalies(executions: TestExecutionRecord[], metric: TestTrendMetric, sensitivity: number): Promise<AnomalyDetection>;
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
    count: number;
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
    accuracy: number;
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
    significance: number;
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
    baselinePeriod: {
        start: Date;
        end: Date;
    };
    confidence: number;
    sampleSize: number;
}
/**
 * Temporal metrics and trends service
 */
export declare class TestMetrics implements ITestMetrics {
    private readonly config;
    private readonly thresholds;
    private readonly baselines;
    constructor(config: TestConfiguration);
    /**
     * Calculate execution metrics for a test
     */
    calculateExecutionMetrics(testId: string, entityId: string, executions: TestExecutionRecord[]): Promise<TestExecutionMetrics>;
    /**
     * Calculate trend for a specific metric
     */
    calculateTrend(testId: string, entityId: string, metric: TestTrendMetric, period: TrendPeriod, executions: TestExecutionRecord[]): Promise<TestTrend | null>;
    /**
     * Calculate multiple trends at once
     */
    calculateAllTrends(testId: string, entityId: string, period: TrendPeriod, executions: TestExecutionRecord[]): Promise<TestTrend[]>;
    /**
     * Get time-series data for a metric
     */
    getTimeSeriesData(executions: TestExecutionRecord[], metric: TestTrendMetric, aggregationPeriod: 'hour' | 'day' | 'week' | 'month'): Promise<TimeSeriesData>;
    /**
     * Calculate statistical summary for a metric
     */
    calculateStatistics(executions: TestExecutionRecord[], metric: TestTrendMetric): Promise<StatisticalSummary>;
    /**
     * Predict future trend
     */
    predictTrend(trend: TestTrend, periodsAhead: number): Promise<TrendPrediction>;
    /**
     * Calculate correlation between metrics
     */
    calculateCorrelation(executions: TestExecutionRecord[], metric1: TestTrendMetric, metric2: TestTrendMetric): Promise<CorrelationAnalysis>;
    /**
     * Detect anomalies in metrics
     */
    detectAnomalies(executions: TestExecutionRecord[], metric: TestTrendMetric, sensitivity?: number): Promise<AnomalyDetection>;
    private initializeDefaultThresholds;
    private calculateFlakinessScore;
    private extractMetricValues;
    private performTrendAnalysis;
    private aggregateDataPoints;
    private groupDataPointsByPeriod;
    private getPeriodKey;
    private calculateTimeSeriesStatistics;
    private calculateMedian;
    private calculateMode;
    private calculateVariance;
    private calculateSkewness;
    private calculateKurtosis;
    private calculatePercentile;
    private getEmptyStatistics;
    private selectPredictionMethodology;
    private generatePredictions;
    private getPeriodMilliseconds;
    private linearPredict;
    private movingAveragePredict;
    private calculateConfidenceInterval;
    private calculatePredictionVariance;
    private calculatePredictionConfidence;
    private validatePredictionAccuracy;
    private calculatePearsonCorrelation;
    private interpretCorrelationStrength;
    private calculateCorrelationSignificance;
    private detectZScoreAnomalies;
}
//# sourceMappingURL=TestMetrics.d.ts.map