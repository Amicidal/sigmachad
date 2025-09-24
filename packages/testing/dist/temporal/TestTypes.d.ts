/**
 * @file TestTypes.ts
 * @description TypeScript interfaces and types for temporal test tracking functionality
 *
 * Defines data structures for tracking test relationships, evolution, and metrics over time.
 * Based on the tests-relationships.md and temporal-relationships.md blueprints.
 */
export interface TestMetadata {
    /** Test type: unit, integration, e2e, snapshot, perf */
    testType: TestType;
    /** Stable identifier for test suite or group */
    suiteId: string;
    /** Optional reference to test run entity */
    runId?: string;
    /** Coverage percentage (0-1), null when unknown */
    coverage?: number | null;
    /** Whether test is flaky based on run history */
    flaky?: boolean;
    /** Quality of mapping between test and entity/spec (0-1) */
    confidence: number;
    /** Explanation of test relationship */
    why?: string;
    /** Additional language/framework specific metadata */
    additional?: Record<string, any>;
}
export type TestType = 'unit' | 'integration' | 'e2e' | 'snapshot' | 'perf' | 'manual' | 'unknown';
export type TestStatus = 'pass' | 'fail' | 'skip' | 'pending' | 'timeout' | 'error';
export interface TestExecutionRecord {
    /** Unique execution identifier */
    executionId: string;
    /** Test identifier */
    testId: string;
    /** Entity being tested */
    entityId: string;
    /** Suite this execution belongs to */
    suiteId: string;
    /** Run this execution belongs to */
    runId?: string;
    /** Execution timestamp */
    timestamp: Date;
    /** Test execution status */
    status: TestStatus;
    /** Execution duration in milliseconds */
    duration?: number;
    /** Error message if failed */
    errorMessage?: string;
    /** Stack trace if available */
    stackTrace?: string;
    /** Coverage data for this execution */
    coverage?: CoverageData;
    /** Test metadata */
    metadata: TestMetadata;
}
export interface CoverageData {
    /** Line coverage percentage (0-1) */
    lines?: number;
    /** Branch coverage percentage (0-1) */
    branches?: number;
    /** Function coverage percentage (0-1) */
    functions?: number;
    /** Statement coverage percentage (0-1) */
    statements?: number;
    /** Overall coverage percentage (0-1) */
    overall: number;
    /** Covered line numbers */
    coveredLines?: number[];
    /** Uncovered line numbers */
    uncoveredLines?: number[];
}
export interface TestRelationship {
    /** Unique relationship identifier */
    relationshipId: string;
    /** Source test identifier */
    testId: string;
    /** Target entity identifier */
    entityId: string;
    /** Relationship type */
    type: TestRelationshipType;
    /** When relationship was first established */
    validFrom: Date;
    /** When relationship was closed (null if active) */
    validTo?: Date | null;
    /** Whether relationship is currently active */
    active: boolean;
    /** Relationship confidence score (0-1) */
    confidence: number;
    /** Test metadata */
    metadata: TestMetadata;
    /** Evidence supporting this relationship */
    evidence?: TestEvidence[];
}
export type TestRelationshipType = 'TESTS' | 'VALIDATES' | 'COVERS' | 'EXERCISES' | 'VERIFIES';
export interface TestEvidence {
    /** Evidence type */
    type: TestEvidenceType;
    /** Evidence description */
    description: string;
    /** Evidence source (file path, line number, etc.) */
    source?: string;
    /** Evidence timestamp */
    timestamp: Date;
    /** Additional evidence data */
    data?: Record<string, any>;
}
export type TestEvidenceType = 'import' | 'call' | 'assertion' | 'coverage' | 'manual' | 'heuristic';
export interface TestEvolutionEvent {
    /** Event unique identifier */
    eventId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Event timestamp */
    timestamp: Date;
    /** Event type */
    type: TestEvolutionEventType;
    /** Event description */
    description: string;
    /** Previous state */
    previousState?: any;
    /** New state */
    newState?: any;
    /** Change set identifier */
    changeSetId?: string;
    /** Metadata about the change */
    metadata?: Record<string, any>;
}
export type TestEvolutionEventType = 'test_added' | 'test_removed' | 'test_modified' | 'coverage_increased' | 'coverage_decreased' | 'flakiness_detected' | 'flakiness_resolved' | 'relationship_added' | 'relationship_removed' | 'performance_regression' | 'performance_improvement';
export interface TestHistorySnapshot {
    /** Snapshot identifier */
    snapshotId: string;
    /** Snapshot timestamp */
    timestamp: Date;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Test status at snapshot time */
    status: TestStatus;
    /** Coverage data at snapshot time */
    coverage?: CoverageData;
    /** Test metadata at snapshot time */
    metadata: TestMetadata;
    /** Execution metrics at snapshot time */
    metrics: TestExecutionMetrics;
}
export interface TestExecutionMetrics {
    /** Total executions */
    totalExecutions: number;
    /** Passed executions */
    passedExecutions: number;
    /** Failed executions */
    failedExecutions: number;
    /** Skipped executions */
    skippedExecutions: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average execution duration in milliseconds */
    averageDuration?: number;
    /** Flakiness score (0-1) */
    flakinessScore: number;
    /** Last execution timestamp */
    lastExecutionAt?: Date;
    /** Last passed timestamp */
    lastPassedAt?: Date;
    /** Last failed timestamp */
    lastFailedAt?: Date;
}
export interface TestTrend {
    /** Trend identifier */
    trendId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Trend metric */
    metric: TestTrendMetric;
    /** Trend period */
    period: TrendPeriod;
    /** Trend direction */
    direction: TrendDirection;
    /** Trend magnitude */
    magnitude: number;
    /** Trend start date */
    startDate: Date;
    /** Trend end date */
    endDate: Date;
    /** Trend confidence (0-1) */
    confidence: number;
    /** Data points supporting trend */
    dataPoints: TrendDataPoint[];
}
export type TestTrendMetric = 'coverage' | 'success_rate' | 'execution_time' | 'flakiness' | 'failure_rate';
export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export interface TrendDataPoint {
    /** Data point timestamp */
    timestamp: Date;
    /** Data point value */
    value: number;
    /** Optional metadata */
    metadata?: Record<string, any>;
}
export interface TestImpactAnalysis {
    /** Analysis identifier */
    analysisId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Analysis timestamp */
    timestamp: Date;
    /** Impact score (0-1) */
    impactScore: number;
    /** Affected entities */
    affectedEntities: string[];
    /** Affected tests */
    affectedTests: string[];
    /** Risk assessment */
    riskAssessment: RiskLevel;
    /** Impact factors */
    factors: ImpactFactor[];
    /** Recommendations */
    recommendations: string[];
}
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export interface ImpactFactor {
    /** Factor type */
    type: ImpactFactorType;
    /** Factor description */
    description: string;
    /** Factor weight (0-1) */
    weight: number;
    /** Factor value */
    value: number;
}
export type ImpactFactorType = 'coverage_change' | 'flakiness_change' | 'performance_change' | 'relationship_change' | 'dependency_change';
export interface TestTimelineQuery {
    /** Test identifier filter */
    testId?: string;
    /** Entity identifier filter */
    entityId?: string;
    /** Suite identifier filter */
    suiteId?: string;
    /** Start date filter */
    startDate?: Date;
    /** End date filter */
    endDate?: Date;
    /** Event types filter */
    eventTypes?: TestEvolutionEventType[];
    /** Include relationships */
    includeRelationships?: boolean;
    /** Include metrics */
    includeMetrics?: boolean;
    /** Limit results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}
export interface TestTemporalQueryResult {
    /** Timeline events */
    events: TestEvolutionEvent[];
    /** Relationships at different points in time */
    relationships: TestRelationship[];
    /** Historical snapshots */
    snapshots: TestHistorySnapshot[];
    /** Trend analysis */
    trends: TestTrend[];
    /** Total count (for pagination) */
    totalCount: number;
}
export interface TestObsolescenceAnalysis {
    /** Analysis identifier */
    analysisId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Analysis timestamp */
    timestamp: Date;
    /** Obsolescence score (0-1) */
    obsolescenceScore: number;
    /** Reasons for obsolescence */
    reasons: ObsolescenceReason[];
    /** Recommendation */
    recommendation: ObsolescenceRecommendation;
    /** Last meaningful execution */
    lastMeaningfulExecution?: Date;
    /** Alternative tests */
    alternativeTests?: string[];
}
export type ObsolescenceReason = 'entity_removed' | 'low_coverage' | 'consistently_passing' | 'duplicate_coverage' | 'outdated_assertions' | 'dependency_removed';
export type ObsolescenceRecommendation = 'keep' | 'update' | 'merge' | 'remove' | 'investigate';
export interface TestConfiguration {
    /** Maximum trend data points to store */
    maxTrendDataPoints: number;
    /** Flakiness detection threshold */
    flakinessThreshold: number;
    /** Coverage change significance threshold */
    coverageChangeThreshold: number;
    /** Performance regression threshold (multiplier) */
    performanceRegressionThreshold: number;
    /** Obsolescence detection enabled */
    obsolescenceDetectionEnabled: boolean;
    /** Trend analysis period */
    trendAnalysisPeriod: TrendPeriod;
    /** Batch size for processing */
    batchSize: number;
}
//# sourceMappingURL=TestTypes.d.ts.map