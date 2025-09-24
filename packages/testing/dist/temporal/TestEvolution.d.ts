/**
 * @file TestEvolution.ts
 * @description Test evolution analysis service for detecting and analyzing changes in test behavior over time
 *
 * Provides sophisticated analysis of test evolution patterns, including coverage trends,
 * performance changes, flakiness detection, and relationship evolution.
 */
import { TestEvolutionEvent, TestTrend, TestTrendMetric, TrendPeriod, TrendDirection, TestConfiguration } from './TestTypes.js';
export interface ITestEvolution {
    /**
     * Analyze test evolution over a time period
     */
    analyzeEvolution(testId: string, entityId: string, startDate: Date, endDate: Date): Promise<TestEvolutionAnalysis>;
    /**
     * Detect trends in test metrics
     */
    detectTrends(testId: string, entityId: string, metric: TestTrendMetric, period: TrendPeriod): Promise<TestTrend[]>;
    /**
     * Analyze coverage evolution
     */
    analyzeCoverageEvolution(testId: string, entityId: string, period: TrendPeriod): Promise<CoverageEvolutionAnalysis>;
    /**
     * Detect performance regressions
     */
    detectPerformanceRegressions(testId: string, entityId: string, baselineWindow: number): Promise<PerformanceRegression[]>;
    /**
     * Analyze flakiness patterns
     */
    analyzeFlakinessPatterns(testId: string, entityId: string): Promise<FlakinessAnalysis>;
    /**
     * Compare test evolution between entities
     */
    compareEvolution(testId: string, entityId1: string, entityId2: string, period: TrendPeriod): Promise<EvolutionComparison>;
}
export interface TestEvolutionAnalysis {
    testId: string;
    entityId: string;
    period: {
        start: Date;
        end: Date;
    };
    overallHealth: HealthScore;
    trends: TestTrend[];
    significantEvents: TestEvolutionEvent[];
    coverageEvolution: CoverageEvolutionAnalysis;
    performanceEvolution: PerformanceEvolutionAnalysis;
    flakinessEvolution: FlakinessEvolutionAnalysis;
    recommendations: EvolutionRecommendation[];
}
export interface HealthScore {
    overall: number;
    coverage: number;
    performance: number;
    stability: number;
    trend: TrendDirection;
}
export interface CoverageEvolutionAnalysis {
    currentCoverage: number;
    averageCoverage: number;
    coverageTrend: TrendDirection;
    significantChanges: CoverageChange[];
    volatility: number;
}
export interface CoverageChange {
    timestamp: Date;
    previousCoverage: number;
    newCoverage: number;
    changePercent: number;
    significance: 'minor' | 'moderate' | 'major';
    context?: string;
}
export interface PerformanceEvolutionAnalysis {
    currentPerformance: number;
    baselinePerformance: number;
    performanceTrend: TrendDirection;
    regressions: PerformanceRegression[];
    improvements: PerformanceImprovement[];
    volatility: number;
}
export interface PerformanceRegression {
    timestamp: Date;
    previousDuration: number;
    newDuration: number;
    regressionFactor: number;
    severity: 'minor' | 'moderate' | 'severe';
    confidence: number;
}
export interface PerformanceImprovement {
    timestamp: Date;
    previousDuration: number;
    newDuration: number;
    improvementFactor: number;
    confidence: number;
}
export interface FlakinessEvolutionAnalysis {
    currentFlakinessScore: number;
    flakinessPattern: FlakinessPattern;
    flakyPeriods: FlakyPeriod[];
    stabilizationEvents: StabilizationEvent[];
    rootCauseAnalysis: FlakinessRootCause[];
}
export interface FlakinessPattern {
    type: 'random' | 'periodic' | 'environmental' | 'load-dependent' | 'time-dependent';
    confidence: number;
    description: string;
}
export interface FlakyPeriod {
    startDate: Date;
    endDate: Date;
    flakinessScore: number;
    failureCount: number;
    totalExecutions: number;
    possibleCauses: string[];
}
export interface StabilizationEvent {
    timestamp: Date;
    description: string;
    beforeFlakinessScore: number;
    afterFlakinessScore: number;
    changeType: 'fix' | 'improvement' | 'unknown';
}
export interface FlakinessRootCause {
    category: 'timing' | 'environment' | 'dependency' | 'data' | 'concurrency' | 'infrastructure';
    description: string;
    confidence: number;
    evidence: string[];
}
export interface EvolutionComparison {
    testId: string;
    entity1: string;
    entity2: string;
    period: TrendPeriod;
    similarities: ComparisonSimilarity[];
    differences: ComparisonDifference[];
    recommendations: string[];
}
export interface ComparisonSimilarity {
    aspect: 'coverage' | 'performance' | 'stability';
    description: string;
    similarity: number;
}
export interface ComparisonDifference {
    aspect: 'coverage' | 'performance' | 'stability';
    description: string;
    magnitude: number;
    significance: 'minor' | 'moderate' | 'major';
}
export interface EvolutionRecommendation {
    category: 'coverage' | 'performance' | 'stability' | 'maintenance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    actionItems: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
}
/**
 * Test evolution analysis service
 */
export declare class TestEvolution implements ITestEvolution {
    private readonly config;
    private readonly executionCache;
    private readonly eventCache;
    constructor(config: TestConfiguration);
    /**
     * Analyze test evolution over a time period
     */
    analyzeEvolution(testId: string, entityId: string, startDate: Date, endDate: Date): Promise<TestEvolutionAnalysis>;
    /**
     * Detect trends in test metrics
     */
    detectTrends(testId: string, entityId: string, metric: TestTrendMetric, period: TrendPeriod): Promise<TestTrend[]>;
    /**
     * Analyze coverage evolution
     */
    analyzeCoverageEvolution(testId: string, entityId: string, period: TrendPeriod): Promise<CoverageEvolutionAnalysis>;
    /**
     * Detect performance regressions
     */
    detectPerformanceRegressions(testId: string, entityId: string, baselineWindow?: number): Promise<PerformanceRegression[]>;
    /**
     * Analyze flakiness patterns
     */
    analyzeFlakinessPatterns(testId: string, entityId: string): Promise<FlakinessAnalysis>;
    /**
     * Compare test evolution between entities
     */
    compareEvolution(testId: string, entityId1: string, entityId2: string, period: TrendPeriod): Promise<EvolutionComparison>;
    private getExecutions;
    private getEvents;
    private getStartDateForPeriod;
    private detectAllTrends;
    private calculateTrendsForMetric;
    private extractMetricDataPoints;
    private analyzeTrendInDataPoints;
    private analyzePerformanceEvolution;
    private analyzeFlakinessEvolution;
    private calculateHealthScore;
    private determineOverallTrend;
    private determineTrend;
    private calculateStandardDeviation;
    private detectCoverageChanges;
    private findPerformanceRegressions;
    private findPerformanceImprovements;
    private calculateCurrentFlakinessScore;
    private detectFlakinessPattern;
    private identifyFlakyPeriods;
    private findStabilizationEvents;
    private analyzeRootCauses;
    private filterSignificantEvents;
    private findSimilarities;
    private findDifferences;
    private generateEvolutionRecommendations;
    private generateComparisonRecommendations;
}
export type FlakinessAnalysis = FlakinessEvolutionAnalysis;
//# sourceMappingURL=TestEvolution.d.ts.map