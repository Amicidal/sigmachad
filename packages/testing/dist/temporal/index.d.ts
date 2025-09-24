/**
 * @file index.ts
 * @description Main export file for temporal test tracking functionality
 *
 * Provides comprehensive temporal tracking capabilities for test relationships,
 * including evolution analysis, historical data management, metrics calculation,
 * and relationship tracking over time.
 */
export * from './TestTypes.js';
export { TestTemporalTracker, type ITestTemporalTracker } from './TestTemporalTracker.js';
export { TestEvolution, type ITestEvolution } from './TestEvolution.js';
export { TestHistory, type ITestHistory } from './TestHistory.js';
export { TestMetrics, type ITestMetrics } from './TestMetrics.js';
export { TestRelationships, type ITestRelationships } from './TestRelationships.js';
export { TestVisualization, type ITestVisualization } from './TestVisualization.js';
export { TestPredictiveAnalytics, type ITestPredictiveAnalytics } from './TestPredictiveAnalytics.js';
export { TestDataStorage, type ITestDataStorage } from './TestDataStorage.js';
export { TestCIIntegration, type ITestCIIntegration } from './TestCIIntegration.js';
export type { TestEvolutionAnalysis, HealthScore, CoverageEvolutionAnalysis, PerformanceEvolutionAnalysis, FlakinessEvolutionAnalysis, EvolutionComparison, EvolutionRecommendation, FlakinessAnalysis } from './TestEvolution.js';
export type { HistoryStatistics, HistoryQuery, SnapshotConfig, RetentionPolicy } from './TestHistory.js';
export type { TimeSeriesData, AggregatedDataPoint, StatisticalSummary, TrendPrediction, PredictionPoint, CorrelationAnalysis, AnomalyDetection, Anomaly, MetricThreshold, PerformanceBaseline } from './TestMetrics.js';
export type { RelationshipChange, ValidationResult, ValidationIssue, RelationshipStatistics, RelationshipGraph, RelationshipNode, RelationshipEdge, RelationshipCluster } from './TestRelationships.js';
/**
 * Factory function to create a complete temporal tracking system
 * with all services properly configured and interconnected.
 */
export declare function createTemporalTrackingSystem(config?: Partial<import('./TestTypes.js').TestConfiguration>): Promise<{
    tracker: import("./TestTemporalTracker.js").TestTemporalTracker;
    evolution: import("./TestEvolution.js").TestEvolution;
    history: import("./TestHistory.js").TestHistory;
    metrics: import("./TestMetrics.js").TestMetrics;
    relationships: import("./TestRelationships.js").TestRelationships;
    visualization: import("./TestVisualization.js").TestVisualization;
    predictiveAnalytics: import("./TestPredictiveAnalytics.js").TestPredictiveAnalytics;
    dataStorage: import("./TestDataStorage.js").TestDataStorage;
    ciIntegration: import("./TestCIIntegration.js").TestCIIntegration;
    config: import("./TestTypes.js").TestConfiguration;
}>;
/**
 * Pre-configured temporal tracking system with sensible defaults
 * for most use cases.
 */
export declare function createDefaultTemporalSystem(): Promise<{
    tracker: import("./TestTemporalTracker.js").TestTemporalTracker;
    evolution: import("./TestEvolution.js").TestEvolution;
    history: import("./TestHistory.js").TestHistory;
    metrics: import("./TestMetrics.js").TestMetrics;
    relationships: import("./TestRelationships.js").TestRelationships;
    visualization: import("./TestVisualization.js").TestVisualization;
    predictiveAnalytics: import("./TestPredictiveAnalytics.js").TestPredictiveAnalytics;
    dataStorage: import("./TestDataStorage.js").TestDataStorage;
    ciIntegration: import("./TestCIIntegration.js").TestCIIntegration;
    config: import("./TestTypes.js").TestConfiguration;
}>;
/**
 * High-performance temporal tracking system optimized for large-scale
 * test suites with high execution frequency.
 */
export declare function createHighPerformanceTemporalSystem(): Promise<{
    tracker: import("./TestTemporalTracker.js").TestTemporalTracker;
    evolution: import("./TestEvolution.js").TestEvolution;
    history: import("./TestHistory.js").TestHistory;
    metrics: import("./TestMetrics.js").TestMetrics;
    relationships: import("./TestRelationships.js").TestRelationships;
    visualization: import("./TestVisualization.js").TestVisualization;
    predictiveAnalytics: import("./TestPredictiveAnalytics.js").TestPredictiveAnalytics;
    dataStorage: import("./TestDataStorage.js").TestDataStorage;
    ciIntegration: import("./TestCIIntegration.js").TestCIIntegration;
    config: import("./TestTypes.js").TestConfiguration;
}>;
/**
 * Lightweight temporal tracking system for smaller projects
 * with less frequent test executions.
 */
export declare function createLightweightTemporalSystem(): Promise<{
    tracker: import("./TestTemporalTracker.js").TestTemporalTracker;
    evolution: import("./TestEvolution.js").TestEvolution;
    history: import("./TestHistory.js").TestHistory;
    metrics: import("./TestMetrics.js").TestMetrics;
    relationships: import("./TestRelationships.js").TestRelationships;
    visualization: import("./TestVisualization.js").TestVisualization;
    predictiveAnalytics: import("./TestPredictiveAnalytics.js").TestPredictiveAnalytics;
    dataStorage: import("./TestDataStorage.js").TestDataStorage;
    ciIntegration: import("./TestCIIntegration.js").TestCIIntegration;
    config: import("./TestTypes.js").TestConfiguration;
}>;
/**
 * Utility functions for common temporal analysis tasks
 */
export declare const TemporalUtils: {
    /**
     * Calculate the age of a test relationship in days
     */
    calculateRelationshipAge(validFrom: Date, validTo?: Date | null): number;
    /**
     * Determine if a test relationship is stale based on age and activity
     */
    isRelationshipStale(validFrom: Date, lastActivity?: Date, staleThresholdDays?: number): boolean;
    /**
     * Calculate flakiness score from execution history
     */
    calculateFlakinessScore(executions: import("./TestTypes.js").TestExecutionRecord[]): number;
    /**
     * Generate a unique identifier for a test relationship
     */
    generateRelationshipId(testId: string, entityId: string, type: import("./TestTypes.js").TestRelationshipType, suiteId: string): string;
    /**
     * Calculate confidence score from evidence collection
     */
    calculateConfidenceFromEvidence(evidence: import("./TestTypes.js").TestEvidence[]): number;
    /**
     * Determine trend direction from a series of values
     */
    determineTrendDirection(values: number[]): import("./TestTypes.js").TrendDirection;
    /**
     * Format temporal data for visualization
     */
    formatForVisualization(data: import("./TestTypes.js").TrendDataPoint[]): Array<{
        x: string;
        y: number;
    }>;
};
/**
 * Constants used throughout the temporal tracking system
 */
export declare const TemporalConstants: {
    /** Default retention periods in days */
    readonly RETENTION_PERIODS: {
        readonly EXECUTIONS: 90;
        readonly SNAPSHOTS: 365;
        readonly EVENTS: 180;
        readonly RELATIONSHIPS: 730;
    };
    /** Default thresholds for various detections */
    readonly THRESHOLDS: {
        readonly FLAKINESS: 0.1;
        readonly COVERAGE_CHANGE: 0.05;
        readonly PERFORMANCE_REGRESSION: 1.5;
        readonly LOW_CONFIDENCE: 0.3;
        readonly STALE_RELATIONSHIP_DAYS: 60;
    };
    /** Trend analysis periods in milliseconds */
    readonly TREND_PERIODS: {
        readonly DAILY: number;
        readonly WEEKLY: number;
        readonly MONTHLY: number;
        readonly QUARTERLY: number;
    };
    /** Risk level thresholds */
    readonly RISK_THRESHOLDS: {
        readonly LOW: 0.3;
        readonly MEDIUM: 0.6;
        readonly HIGH: 0.8;
    };
};
/**
 * Version information for the temporal tracking system
 */
export declare const TEMPORAL_VERSION: "1.0.0";
//# sourceMappingURL=index.d.ts.map