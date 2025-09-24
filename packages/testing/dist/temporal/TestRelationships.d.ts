/**
 * @file TestRelationships.ts
 * @description Test-to-code relationship tracking service
 *
 * Manages the creation, tracking, and analysis of relationships between tests and code entities
 * over time, including relationship lifecycle, evidence collection, and impact analysis.
 */
import { TestRelationship, TestRelationshipType, TestEvidence, TestMetadata, TestImpactAnalysis, TestConfiguration } from './TestTypes.js';
export interface ITestRelationships {
    /**
     * Create a new test relationship
     */
    createRelationship(testId: string, entityId: string, type: TestRelationshipType, metadata: TestMetadata, evidence?: TestEvidence[]): Promise<TestRelationship>;
    /**
     * Update existing relationship
     */
    updateRelationship(relationshipId: string, metadata: Partial<TestMetadata>, evidence?: TestEvidence[]): Promise<TestRelationship>;
    /**
     * Close/deactivate relationship
     */
    closeRelationship(relationshipId: string, reason: string, timestamp?: Date): Promise<void>;
    /**
     * Get active relationships for test or entity
     */
    getActiveRelationships(testId?: string, entityId?: string): Promise<TestRelationship[]>;
    /**
     * Get relationship history
     */
    getRelationshipHistory(testId: string, entityId: string): Promise<TestRelationship[]>;
    /**
     * Add evidence to relationship
     */
    addEvidence(relationshipId: string, evidence: TestEvidence): Promise<void>;
    /**
     * Analyze relationship impact
     */
    analyzeRelationshipImpact(relationshipId: string): Promise<TestImpactAnalysis>;
    /**
     * Detect relationship changes
     */
    detectRelationshipChanges(testId: string, entityId: string, newMetadata: TestMetadata): Promise<RelationshipChange[]>;
    /**
     * Validate relationship consistency
     */
    validateRelationshipConsistency(): Promise<ValidationResult[]>;
    /**
     * Get relationship statistics
     */
    getRelationshipStatistics(): Promise<RelationshipStatistics>;
}
export interface RelationshipChange {
    type: 'created' | 'updated' | 'closed' | 'evidence_added';
    relationshipId: string;
    timestamp: Date;
    previousState?: any;
    newState?: any;
    reason?: string;
    confidence: number;
}
export interface ValidationResult {
    relationshipId: string;
    testId: string;
    entityId: string;
    issues: ValidationIssue[];
    severity: 'info' | 'warning' | 'error';
    recommendation: string;
}
export interface ValidationIssue {
    type: 'missing_evidence' | 'low_confidence' | 'stale_relationship' | 'conflicting_evidence' | 'inconsistent_metadata';
    description: string;
    severity: 'info' | 'warning' | 'error';
    suggestedAction: string;
}
export interface RelationshipStatistics {
    totalRelationships: number;
    activeRelationships: number;
    relationshipsByType: Record<TestRelationshipType, number>;
    averageConfidence: number;
    averageEvidence: number;
    relationshipsWithLowConfidence: number;
    staleRelationships: number;
    mostActiveTests: string[];
    mostCoveredEntities: string[];
}
export interface RelationshipGraph {
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
    clusters: RelationshipCluster[];
}
export interface RelationshipNode {
    id: string;
    type: 'test' | 'entity';
    label: string;
    metadata: any;
    metrics: {
        incomingRelationships: number;
        outgoingRelationships: number;
        averageConfidence: number;
    };
}
export interface RelationshipEdge {
    id: string;
    source: string;
    target: string;
    type: TestRelationshipType;
    confidence: number;
    evidence: number;
    active: boolean;
}
export interface RelationshipCluster {
    id: string;
    nodes: string[];
    type: 'test_suite' | 'component' | 'feature';
    cohesion: number;
    description: string;
}
/**
 * Test-to-code relationship tracking service
 */
export declare class TestRelationships implements ITestRelationships {
    private readonly config;
    private readonly relationships;
    private readonly relationshipHistory;
    private readonly evidenceStore;
    constructor(config: TestConfiguration);
    /**
     * Create a new test relationship
     */
    createRelationship(testId: string, entityId: string, type: TestRelationshipType, metadata: TestMetadata, evidence?: TestEvidence[]): Promise<TestRelationship>;
    /**
     * Update existing relationship
     */
    updateRelationship(relationshipId: string, metadata: Partial<TestMetadata>, evidence?: TestEvidence[]): Promise<TestRelationship>;
    /**
     * Close/deactivate relationship
     */
    closeRelationship(relationshipId: string, reason: string, timestamp?: Date): Promise<void>;
    /**
     * Get active relationships for test or entity
     */
    getActiveRelationships(testId?: string, entityId?: string): Promise<TestRelationship[]>;
    /**
     * Get relationship history
     */
    getRelationshipHistory(testId: string, entityId: string): Promise<TestRelationship[]>;
    /**
     * Add evidence to relationship
     */
    addEvidence(relationshipId: string, evidence: TestEvidence): Promise<void>;
    /**
     * Analyze relationship impact
     */
    analyzeRelationshipImpact(relationshipId: string): Promise<TestImpactAnalysis>;
    /**
     * Detect relationship changes
     */
    detectRelationshipChanges(testId: string, entityId: string, newMetadata: TestMetadata): Promise<RelationshipChange[]>;
    /**
     * Validate relationship consistency
     */
    validateRelationshipConsistency(): Promise<ValidationResult[]>;
    /**
     * Get relationship statistics
     */
    getRelationshipStatistics(): Promise<RelationshipStatistics>;
    private generateRelationshipId;
    private updateConfidenceFromEvidence;
    private calculateEvidenceScore;
    private getRelatedRelationships;
    private calculateRelationshipImpactScore;
    private getRelationshipTypeScore;
    private assessRelationshipRisk;
    private calculateRelationshipImpactFactors;
    private generateImpactRecommendations;
    private compareMetadata;
    private calculateChangeConfidence;
    private validateSingleRelationship;
    private determineSeverity;
    private generateValidationRecommendation;
}
//# sourceMappingURL=TestRelationships.d.ts.map