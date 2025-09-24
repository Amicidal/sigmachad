/**
 * @file TestTemporalTracker.ts
 * @description Main temporal tracking service for test relationships
 *
 * Coordinates temporal tracking of test-to-code relationships, managing lifecycle
 * events, persistence, and providing high-level APIs for temporal queries.
 */
import { EventEmitter } from 'events';
import { TestExecutionRecord, TestRelationship, TestEvolutionEvent, TestMetadata, TestTimelineQuery, TestTemporalQueryResult, TestConfiguration, TestImpactAnalysis, TestObsolescenceAnalysis, TestRelationshipType } from './TestTypes.js';
export interface ITestTemporalTracker {
    /**
     * Track a test execution event
     */
    trackExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Track a test relationship change
     */
    trackRelationshipChange(testId: string, entityId: string, type: TestRelationshipType, metadata: TestMetadata, changeSetId?: string): Promise<void>;
    /**
     * Query temporal test data
     */
    queryTimeline(query: TestTimelineQuery): Promise<TestTemporalQueryResult>;
    /**
     * Get active relationships for a test or entity
     */
    getActiveRelationships(testId?: string, entityId?: string): Promise<TestRelationship[]>;
    /**
     * Analyze test impact
     */
    analyzeImpact(testId: string, entityId: string): Promise<TestImpactAnalysis>;
    /**
     * Detect obsolescent tests
     */
    detectObsolescence(entityId?: string): Promise<TestObsolescenceAnalysis[]>;
    /**
     * Close relationship (mark as inactive)
     */
    closeRelationship(relationshipId: string, timestamp?: Date): Promise<void>;
    /**
     * Get test evolution events
     */
    getEvolutionEvents(testId: string, entityId?: string): Promise<TestEvolutionEvent[]>;
}
/**
 * Main temporal tracking service for test relationships
 */
export declare class TestTemporalTracker extends EventEmitter implements ITestTemporalTracker {
    private readonly config;
    private readonly relationships;
    private readonly executionHistory;
    private readonly evolutionEvents;
    constructor(config?: Partial<TestConfiguration>);
    /**
     * Track a test execution event
     */
    trackExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Track a test relationship change
     */
    trackRelationshipChange(testId: string, entityId: string, type: TestRelationshipType, metadata: TestMetadata, changeSetId?: string): Promise<void>;
    /**
     * Query temporal test data
     */
    queryTimeline(query: TestTimelineQuery): Promise<TestTemporalQueryResult>;
    /**
     * Get active relationships for a test or entity
     */
    getActiveRelationships(testId?: string, entityId?: string): Promise<TestRelationship[]>;
    /**
     * Analyze test impact
     */
    analyzeImpact(testId: string, entityId: string): Promise<TestImpactAnalysis>;
    /**
     * Detect obsolescent tests
     */
    detectObsolescence(entityId?: string): Promise<TestObsolescenceAnalysis[]>;
    /**
     * Close relationship (mark as inactive)
     */
    closeRelationship(relationshipId: string, timestamp?: Date): Promise<void>;
    /**
     * Get test evolution events
     */
    getEvolutionEvents(testId: string, entityId?: string): Promise<TestEvolutionEvent[]>;
    private generateRelationshipId;
    private getEvolutionEventType;
    private recordEvolutionEvent;
    private analyzeExecutionChanges;
    private checkFlakiness;
    private getFilteredEvents;
    private getFilteredRelationships;
    private calculateImpactScore;
    private assessRisk;
    private calculateImpactFactors;
    private generateRecommendations;
    private analyzeTestObsolescence;
}
//# sourceMappingURL=TestTemporalTracker.d.ts.map