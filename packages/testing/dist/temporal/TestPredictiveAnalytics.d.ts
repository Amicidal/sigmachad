/**
 * @file TestPredictiveAnalytics.ts
 * @description Predictive analytics for temporal test tracking
 *
 * Implements test failure prediction, obsolescence prediction, maintenance cost estimation,
 * and test priority scoring using historical data and machine learning techniques.
 */
import { TestExecutionRecord, TestEvolutionEvent, TestRelationship } from './TestTypes.js';
export interface PredictionModel {
    /** Model identifier */
    id: string;
    /** Model name */
    name: string;
    /** Model version */
    version: string;
    /** Training data size */
    trainingDataSize: number;
    /** Model accuracy metrics */
    accuracy: {
        precision: number;
        recall: number;
        f1Score: number;
        auc: number;
    };
    /** Last training timestamp */
    lastTrained: Date;
    /** Feature importance scores */
    featureImportance: Record<string, number>;
}
export interface FailurePrediction {
    /** Prediction identifier */
    predictionId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Prediction timestamp */
    timestamp: Date;
    /** Probability of failure (0-1) */
    failureProbability: number;
    /** Confidence in prediction (0-1) */
    confidence: number;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Contributing factors */
    factors: Array<{
        factor: string;
        importance: number;
        value: number;
        description: string;
    }>;
    /** Recommended actions */
    recommendations: string[];
    /** Prediction expiry */
    expiresAt: Date;
}
export interface ObsolescencePrediction {
    /** Prediction identifier */
    predictionId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Prediction timestamp */
    timestamp: Date;
    /** Probability of obsolescence (0-1) */
    obsolescenceProbability: number;
    /** Estimated time to obsolescence (days) */
    estimatedDaysToObsolescence: number;
    /** Confidence in prediction (0-1) */
    confidence: number;
    /** Obsolescence factors */
    factors: Array<{
        factor: string;
        weight: number;
        value: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    /** Recommended actions */
    recommendations: string[];
}
export interface MaintenanceCostEstimate {
    /** Estimate identifier */
    estimateId: string;
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Estimation timestamp */
    timestamp: Date;
    /** Estimated maintenance cost (in hours) */
    estimatedHours: number;
    /** Cost breakdown */
    breakdown: {
        debugging: number;
        flakiness: number;
        updating: number;
        refactoring: number;
        obsolescence: number;
    };
    /** Cost trend */
    trend: 'increasing' | 'decreasing' | 'stable';
    /** Confidence in estimate (0-1) */
    confidence: number;
    /** Cost optimization suggestions */
    optimizations: Array<{
        action: string;
        expectedSavings: number;
        effort: 'low' | 'medium' | 'high';
        impact: 'low' | 'medium' | 'high';
    }>;
}
export interface TestPriorityScore {
    /** Test identifier */
    testId: string;
    /** Entity identifier */
    entityId: string;
    /** Overall priority score (0-1) */
    priorityScore: number;
    /** Priority level */
    priorityLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Component scores */
    components: {
        businessValue: number;
        technicalRisk: number;
        maintenanceCost: number;
        coverage: number;
        stability: number;
        frequency: number;
    };
    /** Scoring factors */
    factors: Array<{
        name: string;
        weight: number;
        score: number;
        justification: string;
    }>;
    /** Priority recommendations */
    recommendations: string[];
    /** Last updated */
    lastUpdated: Date;
}
export interface PredictiveAnalyticsConfig {
    /** Enable failure prediction */
    enableFailurePrediction: boolean;
    /** Enable obsolescence prediction */
    enableObsolescencePrediction: boolean;
    /** Enable maintenance cost estimation */
    enableMaintenanceCostEstimation: boolean;
    /** Enable test priority scoring */
    enableTestPriorityScoring: boolean;
    /** Minimum data points required for predictions */
    minDataPoints: number;
    /** Model retraining frequency (days) */
    modelRetrainingFrequency: number;
    /** Prediction confidence threshold */
    confidenceThreshold: number;
    /** Maximum prediction horizon (days) */
    maxPredictionHorizon: number;
}
export interface ITestPredictiveAnalytics {
    /**
     * Predict test failure probability
     */
    predictTestFailure(testId: string, entityId: string, horizon?: number): Promise<FailurePrediction>;
    /**
     * Predict test obsolescence
     */
    predictTestObsolescence(testId: string, entityId: string): Promise<ObsolescencePrediction>;
    /**
     * Estimate maintenance cost
     */
    estimateMaintenanceCost(testId: string, entityId: string, timeFrame?: number): Promise<MaintenanceCostEstimate>;
    /**
     * Calculate test priority score
     */
    calculateTestPriority(testId: string, entityId: string): Promise<TestPriorityScore>;
    /**
     * Batch prediction for multiple tests
     */
    batchPredict(testIds: Array<{
        testId: string;
        entityId: string;
    }>, predictionTypes: Array<'failure' | 'obsolescence' | 'maintenance' | 'priority'>): Promise<{
        failures: FailurePrediction[];
        obsolescence: ObsolescencePrediction[];
        maintenance: MaintenanceCostEstimate[];
        priorities: TestPriorityScore[];
    }>;
    /**
     * Train prediction models
     */
    trainModels(): Promise<{
        failureModel: PredictionModel;
        obsolescenceModel: PredictionModel;
        maintenanceModel: PredictionModel;
    }>;
    /**
     * Get model performance metrics
     */
    getModelMetrics(): Promise<Record<string, PredictionModel>>;
}
/**
 * Predictive analytics service for temporal test tracking
 */
export declare class TestPredictiveAnalytics implements ITestPredictiveAnalytics {
    private executionData;
    private eventData;
    private relationshipData;
    private readonly config;
    private models;
    constructor(config?: Partial<PredictiveAnalyticsConfig>, executionData?: Map<string, TestExecutionRecord[]>, eventData?: Map<string, TestEvolutionEvent[]>, relationshipData?: Map<string, TestRelationship[]>);
    /**
     * Predict test failure probability
     */
    predictTestFailure(testId: string, entityId: string, horizon?: number): Promise<FailurePrediction>;
    /**
     * Predict test obsolescence
     */
    predictTestObsolescence(testId: string, entityId: string): Promise<ObsolescencePrediction>;
    /**
     * Estimate maintenance cost
     */
    estimateMaintenanceCost(testId: string, entityId: string, timeFrame?: number): Promise<MaintenanceCostEstimate>;
    /**
     * Calculate test priority score
     */
    calculateTestPriority(testId: string, entityId: string): Promise<TestPriorityScore>;
    /**
     * Batch prediction for multiple tests
     */
    batchPredict(testIds: Array<{
        testId: string;
        entityId: string;
    }>, predictionTypes: Array<'failure' | 'obsolescence' | 'maintenance' | 'priority'>): Promise<{
        failures: FailurePrediction[];
        obsolescence: ObsolescencePrediction[];
        maintenance: MaintenanceCostEstimate[];
        priorities: TestPriorityScore[];
    }>;
    /**
     * Train prediction models
     */
    trainModels(): Promise<{
        failureModel: PredictionModel;
        obsolescenceModel: PredictionModel;
        maintenanceModel: PredictionModel;
    }>;
    /**
     * Get model performance metrics
     */
    getModelMetrics(): Promise<Record<string, PredictionModel>>;
    private extractFailureFeatures;
    private extractObsolescenceFeatures;
    private extractMaintenanceFeatures;
    private extractPriorityFeatures;
    private calculateFailureProbability;
    private calculateObsolescenceProbability;
    private estimateDaysToObsolescence;
    private calculateMaintenanceCosts;
    private calculatePriorityComponents;
    private calculateOverallPriority;
    private calculatePredictionConfidence;
    private determineRiskLevel;
    private determinePriorityLevel;
    private determineMaintenanceTrend;
    private generateFailureRecommendations;
    private generateObsolescenceRecommendations;
    private generateMaintenanceOptimizations;
    private generatePriorityRecommendations;
    /**
     * Update internal data stores
     */
    updateExecutionData(key: string, executions: TestExecutionRecord[]): void;
    updateEventData(key: string, events: TestEvolutionEvent[]): void;
    updateRelationshipData(key: string, relationships: TestRelationship[]): void;
}
//# sourceMappingURL=TestPredictiveAnalytics.d.ts.map