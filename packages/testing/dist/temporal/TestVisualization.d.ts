/**
 * @file TestVisualization.ts
 * @description Visualization capabilities for temporal test tracking
 *
 * Provides timeline visualization, coverage heatmaps, flakiness trend charts,
 * and performance graphs for test evolution analysis.
 */
import { TestExecutionRecord, TestEvolutionEvent, TestRelationship, TestConfiguration } from './TestTypes.js';
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
    generateTimeline(events: TestEvolutionEvent[], relationships: TestRelationship[], executions: TestExecutionRecord[], config?: Partial<TimelineVisualizationConfig>): Promise<TimelineData>;
    /**
     * Generate coverage heatmap data
     */
    generateCoverageHeatmap(executions: TestExecutionRecord[], timeWindow: {
        start: Date;
        end: Date;
    }, config?: Partial<CoverageHeatmapConfig>): Promise<HeatmapData>;
    /**
     * Generate flakiness trend chart data
     */
    generateFlakinessChart(executions: TestExecutionRecord[], config?: Partial<FlakinessChartConfig>): Promise<FlakinessChartData>;
    /**
     * Generate performance graph data
     */
    generatePerformanceGraph(executions: TestExecutionRecord[], metrics: string[], config?: Partial<PerformanceGraphConfig>): Promise<PerformanceGraphData>;
    /**
     * Export visualization data
     */
    exportVisualization(data: any, options: ExportOptions): Promise<Buffer | string>;
    /**
     * Generate dashboard summary
     */
    generateDashboard(testId?: string, entityId?: string, timeWindow?: {
        start: Date;
        end: Date;
    }): Promise<{
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
export declare class TestVisualization implements ITestVisualization {
    private executionData;
    private eventData;
    private relationshipData;
    private readonly config;
    constructor(config?: Partial<TestConfiguration>, executionData?: Map<string, TestExecutionRecord[]>, eventData?: Map<string, TestEvolutionEvent[]>, relationshipData?: Map<string, TestRelationship[]>);
    /**
     * Generate timeline visualization data
     */
    generateTimeline(events: TestEvolutionEvent[], relationships: TestRelationship[], executions: TestExecutionRecord[], config?: Partial<TimelineVisualizationConfig>): Promise<TimelineData>;
    /**
     * Generate coverage heatmap data
     */
    generateCoverageHeatmap(executions: TestExecutionRecord[], timeWindow: {
        start: Date;
        end: Date;
    }, config?: Partial<CoverageHeatmapConfig>): Promise<HeatmapData>;
    /**
     * Generate flakiness trend chart data
     */
    generateFlakinessChart(executions: TestExecutionRecord[], config?: Partial<FlakinessChartConfig>): Promise<FlakinessChartData>;
    /**
     * Generate performance graph data
     */
    generatePerformanceGraph(executions: TestExecutionRecord[], metrics?: string[], config?: Partial<PerformanceGraphConfig>): Promise<PerformanceGraphData>;
    /**
     * Export visualization data
     */
    exportVisualization(data: any, options: ExportOptions): Promise<Buffer | string>;
    /**
     * Generate dashboard summary
     */
    generateDashboard(testId?: string, entityId?: string, timeWindow?: {
        start: Date;
        end: Date;
    }): Promise<{
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
    private determineSeverity;
    private convertToCSV;
    /**
     * Update internal data stores
     */
    updateExecutionData(key: string, executions: TestExecutionRecord[]): void;
    updateEventData(key: string, events: TestEvolutionEvent[]): void;
    updateRelationshipData(key: string, relationships: TestRelationship[]): void;
}
//# sourceMappingURL=TestVisualization.d.ts.map