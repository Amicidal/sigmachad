/**
 * @file index.ts
 * @description Main export file for temporal test tracking functionality
 *
 * Provides comprehensive temporal tracking capabilities for test relationships,
 * including evolution analysis, historical data management, metrics calculation,
 * and relationship tracking over time.
 */

// Core Types and Interfaces
export * from './TestTypes.js';

// Main Services
export { TestTemporalTracker, type ITestTemporalTracker } from './TestTemporalTracker.js';
export { TestEvolution, type ITestEvolution } from './TestEvolution.js';
export { TestHistory, type ITestHistory } from './TestHistory.js';
export { TestMetrics, type ITestMetrics } from './TestMetrics.js';
export { TestRelationships, type ITestRelationships } from './TestRelationships.js';
export { TestVisualization, type ITestVisualization } from './TestVisualization.js';
export { TestPredictiveAnalytics, type ITestPredictiveAnalytics } from './TestPredictiveAnalytics.js';
export { TestDataStorage, type ITestDataStorage } from './TestDataStorage.js';
export { TestCIIntegration, type ITestCIIntegration } from './TestCIIntegration.js';
export { TemporalMonitoring, type ITemporalMonitoring } from './TemporalMonitoring.js';
export { OperationalDashboard, type IOperationalDashboard } from './OperationalDashboard.js';
export { ProductionConfig, type IProductionConfig } from './ProductionConfig.js';

// Additional Types for specific services
export type {
  // Evolution-specific types
  TestEvolutionAnalysis,
  HealthScore,
  CoverageEvolutionAnalysis,
  PerformanceEvolutionAnalysis,
  FlakinessEvolutionAnalysis,
  EvolutionComparison,
  EvolutionRecommendation,
  FlakinessAnalysis
} from './TestEvolution.js';

export type {
  // History-specific types
  HistoryStatistics,
  HistoryQuery,
  SnapshotConfig,
  RetentionPolicy
} from './TestHistory.js';

export type {
  // Metrics-specific types
  TimeSeriesData,
  AggregatedDataPoint,
  StatisticalSummary,
  TrendPrediction,
  PredictionPoint,
  CorrelationAnalysis,
  AnomalyDetection,
  Anomaly,
  MetricThreshold,
  PerformanceBaseline
} from './TestMetrics.js';

export type {
  // Relationships-specific types
  RelationshipChange,
  ValidationResult,
  ValidationIssue,
  RelationshipStatistics,
  RelationshipGraph,
  RelationshipNode,
  RelationshipEdge,
  RelationshipCluster
} from './TestRelationships.js';

export type {
  // Production monitoring types
  MonitoringConfiguration,
  HealthCheckResult,
  ComponentHealth,
  Alert,
  PerformanceMetrics,
  DashboardData,
  MonitoringReport
} from './TemporalMonitoring.js';

export type {
  // Dashboard types
  DashboardConfiguration,
  DashboardWidget,
  ExecutiveDashboard,
  TechnicalDashboard,
  ChartData,
  AlertManagementView,
  PerformanceAnalyticsView
} from './OperationalDashboard.js';

export type {
  // Configuration types
  ProductionConfiguration,
  ConfigurationValidationResult,
  EnvironmentProfile,
  ConfigurationHistory
} from './ProductionConfig.js';

/**
 * Factory function to create a complete temporal tracking system
 * with all services properly configured and interconnected.
 */
export async function createTemporalTrackingSystem(config: Partial<import('./TestTypes.js').TestConfiguration> = {}) {
  const defaultConfig: import('./TestTypes.js').TestConfiguration = {
    maxTrendDataPoints: 1000,
    flakinessThreshold: 0.1,
    coverageChangeThreshold: 0.05,
    performanceRegressionThreshold: 1.5,
    obsolescenceDetectionEnabled: true,
    trendAnalysisPeriod: 'weekly',
    batchSize: 100,
    ...config
  };

  const { TestTemporalTracker } = await import('./TestTemporalTracker.js');
  const { TestEvolution } = await import('./TestEvolution.js');
  const { TestHistory } = await import('./TestHistory.js');
  const { TestMetrics } = await import('./TestMetrics.js');
  const { TestRelationships } = await import('./TestRelationships.js');
  const { TestVisualization } = await import('./TestVisualization.js');
  const { TestPredictiveAnalytics } = await import('./TestPredictiveAnalytics.js');
  const { TestDataStorage } = await import('./TestDataStorage.js');
  const { TestCIIntegration } = await import('./TestCIIntegration.js');
  const { TemporalMonitoring } = await import('./TemporalMonitoring.js');
  const { OperationalDashboard } = await import('./OperationalDashboard.js');
  const { ProductionConfig } = await import('./ProductionConfig.js');

  const tracker = new TestTemporalTracker(defaultConfig);
  const evolution = new TestEvolution(defaultConfig);
  const history = new TestHistory(defaultConfig);
  const metrics = new TestMetrics(defaultConfig);
  const relationships = new TestRelationships(defaultConfig);
  const visualization = new TestVisualization(defaultConfig);
  const predictiveAnalytics = new TestPredictiveAnalytics({});
  const dataStorage = new TestDataStorage({});
  const ciIntegration = new TestCIIntegration(defaultConfig);
  const monitoring = new TemporalMonitoring({});
  const dashboard = new OperationalDashboard(monitoring, {});
  const productionConfig = new ProductionConfig();

  return {
    tracker,
    evolution,
    history,
    metrics,
    relationships,
    visualization,
    predictiveAnalytics,
    dataStorage,
    ciIntegration,
    monitoring,
    dashboard,
    productionConfig,
    config: defaultConfig
  };
}

/**
 * Pre-configured temporal tracking system with sensible defaults
 * for most use cases.
 */
export async function createDefaultTemporalSystem() {
  return await createTemporalTrackingSystem({
    maxTrendDataPoints: 500,
    flakinessThreshold: 0.15,
    coverageChangeThreshold: 0.1,
    performanceRegressionThreshold: 2.0,
    obsolescenceDetectionEnabled: true,
    trendAnalysisPeriod: 'weekly',
    batchSize: 50
  });
}

/**
 * High-performance temporal tracking system optimized for large-scale
 * test suites with high execution frequency.
 */
export async function createHighPerformanceTemporalSystem() {
  return await createTemporalTrackingSystem({
    maxTrendDataPoints: 2000,
    flakinessThreshold: 0.05,
    coverageChangeThreshold: 0.02,
    performanceRegressionThreshold: 1.2,
    obsolescenceDetectionEnabled: true,
    trendAnalysisPeriod: 'daily',
    batchSize: 200
  });
}

/**
 * Lightweight temporal tracking system for smaller projects
 * with less frequent test executions.
 */
export async function createLightweightTemporalSystem() {
  return await createTemporalTrackingSystem({
    maxTrendDataPoints: 200,
    flakinessThreshold: 0.2,
    coverageChangeThreshold: 0.15,
    performanceRegressionThreshold: 3.0,
    obsolescenceDetectionEnabled: false,
    trendAnalysisPeriod: 'monthly',
    batchSize: 25
  });
}

/**
 * Utility functions for common temporal analysis tasks
 */
export const TemporalUtils = {
  /**
   * Calculate the age of a test relationship in days
   */
  calculateRelationshipAge(validFrom: Date, validTo?: Date | null): number {
    const endDate = validTo || new Date();
    return Math.floor((endDate.getTime() - validFrom.getTime()) / (24 * 60 * 60 * 1000));
  },

  /**
   * Determine if a test relationship is stale based on age and activity
   */
  isRelationshipStale(
    validFrom: Date,
    lastActivity?: Date,
    staleThresholdDays: number = 30
  ): boolean {
    const referenceDate = lastActivity || validFrom;
    const age = this.calculateRelationshipAge(referenceDate);
    return age > staleThresholdDays;
  },

  /**
   * Calculate flakiness score from execution history
   */
  calculateFlakinessScore(executions: import('./TestTypes.js').TestExecutionRecord[]): number {
    if (executions.length < 5) return 0;

    const recentExecutions = executions.slice(-20);
    const failures = recentExecutions.filter(exec => exec.status === 'fail').length;
    return failures / recentExecutions.length;
  },

  /**
   * Generate a unique identifier for a test relationship
   */
  generateRelationshipId(
    testId: string,
    entityId: string,
    type: import('./TestTypes.js').TestRelationshipType,
    suiteId: string
  ): string {
    return `rel_${testId}_${entityId}_${type}_${suiteId}`.replace(/[^a-zA-Z0-9_]/g, '_');
  },

  /**
   * Calculate confidence score from evidence collection
   */
  calculateConfidenceFromEvidence(evidence: import('./TestTypes.js').TestEvidence[]): number {
    if (evidence.length === 0) return 0;

    const typeWeights: Record<import('./TestTypes.js').TestEvidenceType, number> = {
      import: 0.8,
      call: 0.9,
      assertion: 0.95,
      coverage: 0.85,
      manual: 0.6,
      heuristic: 0.4
    };

    let totalScore = 0;
    for (const ev of evidence) {
      totalScore += typeWeights[ev.type] || 0.5;
    }

    return Math.min(1, totalScore / evidence.length);
  },

  /**
   * Determine trend direction from a series of values
   */
  determineTrendDirection(values: number[]): import('./TestTypes.js').TrendDirection {
    if (values.length < 3) return 'stable';

    const first = values.slice(0, Math.floor(values.length / 3)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length / 3);
    const last = values.slice(-Math.floor(values.length / 3)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length / 3);

    const change = (last - first) / first;

    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  },

  /**
   * Format temporal data for visualization
   */
  formatForVisualization(
    data: import('./TestTypes.js').TrendDataPoint[]
  ): Array<{ x: string; y: number }> {
    return data.map(point => ({
      x: point.timestamp.toISOString(),
      y: point.value
    }));
  }
};

/**
 * Constants used throughout the temporal tracking system
 */
export const TemporalConstants = {
  /** Default retention periods in days */
  RETENTION_PERIODS: {
    EXECUTIONS: 90,
    SNAPSHOTS: 365,
    EVENTS: 180,
    RELATIONSHIPS: 730
  },

  /** Default thresholds for various detections */
  THRESHOLDS: {
    FLAKINESS: 0.1,
    COVERAGE_CHANGE: 0.05,
    PERFORMANCE_REGRESSION: 1.5,
    LOW_CONFIDENCE: 0.3,
    STALE_RELATIONSHIP_DAYS: 60
  },

  /** Trend analysis periods in milliseconds */
  TREND_PERIODS: {
    DAILY: 24 * 60 * 60 * 1000,
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
    MONTHLY: 30 * 24 * 60 * 60 * 1000,
    QUARTERLY: 90 * 24 * 60 * 60 * 1000
  },

  /** Risk level thresholds */
  RISK_THRESHOLDS: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8
  }
} as const;

/**
 * Version information for the temporal tracking system
 */
export const TEMPORAL_VERSION = '1.0.0' as const;