/**
 * @file TestRelationships.ts
 * @description Test-to-code relationship tracking service
 *
 * Manages the creation, tracking, and analysis of relationships between tests and code entities
 * over time, including relationship lifecycle, evidence collection, and impact analysis.
 */
/**
 * Test-to-code relationship tracking service
 */
export class TestRelationships {
    constructor(config) {
        this.relationships = new Map();
        this.relationshipHistory = new Map();
        this.evidenceStore = new Map();
        this.config = config;
    }
    /**
     * Create a new test relationship
     */
    async createRelationship(testId, entityId, type, metadata, evidence = []) {
        const relationshipId = this.generateRelationshipId(testId, entityId, type, metadata.suiteId);
        const now = new Date();
        // Check for existing relationship
        const existing = this.relationships.get(relationshipId);
        if (existing && existing.active) {
            throw new Error(`Active relationship already exists: ${relationshipId}`);
        }
        const relationship = {
            relationshipId,
            testId,
            entityId,
            type,
            validFrom: now,
            validTo: null,
            active: true,
            confidence: metadata.confidence,
            metadata,
            evidence: [...evidence]
        };
        this.relationships.set(relationshipId, relationship);
        // Store in history
        const historyKey = `${testId}:${entityId}`;
        if (!this.relationshipHistory.has(historyKey)) {
            this.relationshipHistory.set(historyKey, []);
        }
        this.relationshipHistory.get(historyKey).push(relationship);
        // Store evidence
        if (evidence.length > 0) {
            this.evidenceStore.set(relationshipId, [...evidence]);
        }
        return relationship;
    }
    /**
     * Update existing relationship
     */
    async updateRelationship(relationshipId, metadata, evidence = []) {
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
            throw new Error(`Relationship not found: ${relationshipId}`);
        }
        // Update metadata
        relationship.metadata = { ...relationship.metadata, ...metadata };
        if (metadata.confidence !== undefined) {
            relationship.confidence = metadata.confidence;
        }
        // Add evidence
        if (evidence.length > 0) {
            relationship.evidence = relationship.evidence || [];
            relationship.evidence.push(...evidence);
            // Store in evidence store
            const existingEvidence = this.evidenceStore.get(relationshipId) || [];
            this.evidenceStore.set(relationshipId, [...existingEvidence, ...evidence]);
        }
        return relationship;
    }
    /**
     * Close/deactivate relationship
     */
    async closeRelationship(relationshipId, reason, timestamp = new Date()) {
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
            throw new Error(`Relationship not found: ${relationshipId}`);
        }
        relationship.active = false;
        relationship.validTo = timestamp;
        // Add closure evidence
        const closureEvidence = {
            type: 'manual',
            description: `Relationship closed: ${reason}`,
            timestamp,
            data: { reason }
        };
        await this.addEvidence(relationshipId, closureEvidence);
    }
    /**
     * Get active relationships for test or entity
     */
    async getActiveRelationships(testId, entityId) {
        const results = [];
        for (const relationship of this.relationships.values()) {
            if (!relationship.active)
                continue;
            if (testId && relationship.testId !== testId)
                continue;
            if (entityId && relationship.entityId !== entityId)
                continue;
            results.push(relationship);
        }
        return results;
    }
    /**
     * Get relationship history
     */
    async getRelationshipHistory(testId, entityId) {
        const historyKey = `${testId}:${entityId}`;
        return this.relationshipHistory.get(historyKey) || [];
    }
    /**
     * Add evidence to relationship
     */
    async addEvidence(relationshipId, evidence) {
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
            throw new Error(`Relationship not found: ${relationshipId}`);
        }
        // Add to relationship
        relationship.evidence = relationship.evidence || [];
        relationship.evidence.push(evidence);
        // Store in evidence store
        const existingEvidence = this.evidenceStore.get(relationshipId) || [];
        this.evidenceStore.set(relationshipId, [...existingEvidence, evidence]);
        // Update confidence based on evidence quality
        await this.updateConfidenceFromEvidence(relationshipId);
    }
    /**
     * Analyze relationship impact
     */
    async analyzeRelationshipImpact(relationshipId) {
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
            throw new Error(`Relationship not found: ${relationshipId}`);
        }
        const relatedRelationships = await this.getRelatedRelationships(relationship);
        const impactScore = this.calculateRelationshipImpactScore(relationship, relatedRelationships);
        const riskAssessment = this.assessRelationshipRisk(impactScore, relationship);
        const factors = this.calculateRelationshipImpactFactors(relationship, relatedRelationships);
        return {
            analysisId: `impact_${relationshipId}_${Date.now()}`,
            testId: relationship.testId,
            entityId: relationship.entityId,
            timestamp: new Date(),
            impactScore,
            affectedEntities: relatedRelationships.map(r => r.entityId),
            affectedTests: relatedRelationships.map(r => r.testId),
            riskAssessment,
            factors,
            recommendations: this.generateImpactRecommendations(impactScore, relationship)
        };
    }
    /**
     * Detect relationship changes
     */
    async detectRelationshipChanges(testId, entityId, newMetadata) {
        const activeRelationships = await this.getActiveRelationships(testId, entityId);
        const changes = [];
        for (const relationship of activeRelationships) {
            const changes_detected = this.compareMetadata(relationship.metadata, newMetadata);
            if (changes_detected.length > 0) {
                changes.push({
                    type: 'updated',
                    relationshipId: relationship.relationshipId,
                    timestamp: new Date(),
                    previousState: relationship.metadata,
                    newState: newMetadata,
                    confidence: this.calculateChangeConfidence(changes_detected)
                });
            }
        }
        return changes;
    }
    /**
     * Validate relationship consistency
     */
    async validateRelationshipConsistency() {
        const results = [];
        for (const relationship of this.relationships.values()) {
            const issues = await this.validateSingleRelationship(relationship);
            if (issues.length > 0) {
                const severity = this.determineSeverity(issues);
                const recommendation = this.generateValidationRecommendation(issues);
                results.push({
                    relationshipId: relationship.relationshipId,
                    testId: relationship.testId,
                    entityId: relationship.entityId,
                    issues,
                    severity,
                    recommendation
                });
            }
        }
        return results;
    }
    /**
     * Get relationship statistics
     */
    async getRelationshipStatistics() {
        const totalRelationships = this.relationships.size;
        const activeRelationships = Array.from(this.relationships.values()).filter(r => r.active).length;
        const relationshipsByType = {
            TESTS: 0,
            VALIDATES: 0,
            COVERS: 0,
            EXERCISES: 0,
            VERIFIES: 0
        };
        let totalConfidence = 0;
        let totalEvidence = 0;
        let lowConfidenceCount = 0;
        let staleCount = 0;
        const testActivity = new Map();
        const entityCoverage = new Map();
        const now = new Date();
        const staleThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
        for (const relationship of this.relationships.values()) {
            if (relationship.active) {
                relationshipsByType[relationship.type]++;
                totalConfidence += relationship.confidence;
                totalEvidence += relationship.evidence?.length || 0;
                if (relationship.confidence < 0.5) {
                    lowConfidenceCount++;
                }
                const timeSinceValid = now.getTime() - relationship.validFrom.getTime();
                if (timeSinceValid > staleThreshold) {
                    staleCount++;
                }
                // Track test activity
                const testCount = testActivity.get(relationship.testId) || 0;
                testActivity.set(relationship.testId, testCount + 1);
                // Track entity coverage
                const entityCount = entityCoverage.get(relationship.entityId) || 0;
                entityCoverage.set(relationship.entityId, entityCount + 1);
            }
        }
        const averageConfidence = activeRelationships > 0 ? totalConfidence / activeRelationships : 0;
        const averageEvidence = activeRelationships > 0 ? totalEvidence / activeRelationships : 0;
        // Get most active tests and covered entities
        const mostActiveTests = Array.from(testActivity.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);
        const mostCoveredEntities = Array.from(entityCoverage.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);
        return {
            totalRelationships,
            activeRelationships,
            relationshipsByType,
            averageConfidence,
            averageEvidence,
            relationshipsWithLowConfidence: lowConfidenceCount,
            staleRelationships: staleCount,
            mostActiveTests,
            mostCoveredEntities
        };
    }
    // Private helper methods
    generateRelationshipId(testId, entityId, type, suiteId) {
        return `rel_${testId}_${entityId}_${type}_${suiteId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    async updateConfidenceFromEvidence(relationshipId) {
        const relationship = this.relationships.get(relationshipId);
        const evidence = this.evidenceStore.get(relationshipId) || [];
        if (!relationship || evidence.length === 0)
            return;
        // Calculate confidence based on evidence types and quality
        const evidenceScore = this.calculateEvidenceScore(evidence);
        const newConfidence = Math.min(1, relationship.confidence * 0.7 + evidenceScore * 0.3);
        relationship.confidence = newConfidence;
    }
    calculateEvidenceScore(evidence) {
        if (evidence.length === 0)
            return 0;
        const typeWeights = {
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
    }
    async getRelatedRelationships(relationship) {
        const related = [];
        for (const other of this.relationships.values()) {
            if (other.relationshipId === relationship.relationshipId)
                continue;
            if (!other.active)
                continue;
            // Related if same test or same entity
            if (other.testId === relationship.testId || other.entityId === relationship.entityId) {
                related.push(other);
            }
        }
        return related;
    }
    calculateRelationshipImpactScore(relationship, relatedRelationships) {
        let score = 0;
        // Base score from confidence
        score += relationship.confidence * 0.3;
        // Score from evidence quality
        const evidenceScore = this.calculateEvidenceScore(relationship.evidence || []);
        score += evidenceScore * 0.2;
        // Score from related relationships
        const relatedScore = Math.min(1, relatedRelationships.length / 10);
        score += relatedScore * 0.3;
        // Score from relationship type importance
        const typeScore = this.getRelationshipTypeScore(relationship.type);
        score += typeScore * 0.2;
        return Math.min(1, score);
    }
    getRelationshipTypeScore(type) {
        const scores = {
            TESTS: 0.9,
            VALIDATES: 0.85,
            COVERS: 0.8,
            EXERCISES: 0.7,
            VERIFIES: 0.75
        };
        return scores[type] || 0.5;
    }
    assessRelationshipRisk(impactScore, relationship) {
        let risk = 'low';
        if (impactScore > 0.8)
            risk = 'critical';
        else if (impactScore > 0.6)
            risk = 'high';
        else if (impactScore > 0.4)
            risk = 'medium';
        // Adjust for low confidence
        if (relationship.confidence < 0.5 && risk !== 'low') {
            const riskLevels = ['low', 'medium', 'high', 'critical'];
            const currentIndex = riskLevels.indexOf(risk);
            risk = riskLevels[Math.min(riskLevels.length - 1, currentIndex + 1)];
        }
        return risk;
    }
    calculateRelationshipImpactFactors(relationship, relatedRelationships) {
        const factors = [];
        // Confidence factor
        factors.push({
            type: 'relationship_change',
            description: `Relationship confidence: ${(relationship.confidence * 100).toFixed(1)}%`,
            weight: 0.4,
            value: relationship.confidence
        });
        // Coverage factor (if available in metadata)
        if (relationship.metadata.coverage !== undefined && relationship.metadata.coverage !== null) {
            factors.push({
                type: 'coverage_change',
                description: `Test coverage: ${(relationship.metadata.coverage * 100).toFixed(1)}%`,
                weight: 0.3,
                value: relationship.metadata.coverage
            });
        }
        // Related relationships factor
        factors.push({
            type: 'dependency_change',
            description: `${relatedRelationships.length} related relationships`,
            weight: 0.3,
            value: Math.min(1, relatedRelationships.length / 10)
        });
        return factors;
    }
    generateImpactRecommendations(impactScore, relationship) {
        const recommendations = [];
        if (impactScore > 0.7) {
            recommendations.push('High impact relationship - monitor changes carefully');
        }
        if (relationship.confidence < 0.5) {
            recommendations.push('Low confidence relationship - review and add evidence');
        }
        if (!relationship.evidence || relationship.evidence.length < 2) {
            recommendations.push('Limited evidence - consider adding more evidence sources');
        }
        if (relationship.metadata.flaky) {
            recommendations.push('Flaky test detected - investigate and stabilize');
        }
        return recommendations;
    }
    compareMetadata(oldMetadata, newMetadata) {
        const changes = [];
        if (oldMetadata.testType !== newMetadata.testType) {
            changes.push('testType');
        }
        if (oldMetadata.coverage !== newMetadata.coverage) {
            changes.push('coverage');
        }
        if (oldMetadata.confidence !== newMetadata.confidence) {
            changes.push('confidence');
        }
        if (oldMetadata.flaky !== newMetadata.flaky) {
            changes.push('flaky');
        }
        return changes;
    }
    calculateChangeConfidence(changes) {
        // Simplified confidence calculation based on number and type of changes
        const weights = {
            testType: 0.9,
            coverage: 0.8,
            confidence: 0.7,
            flaky: 0.85
        };
        let totalWeight = 0;
        for (const change of changes) {
            totalWeight += weights[change] || 0.5;
        }
        return Math.min(1, totalWeight / changes.length);
    }
    async validateSingleRelationship(relationship) {
        const issues = [];
        // Check for missing evidence
        if (!relationship.evidence || relationship.evidence.length === 0) {
            issues.push({
                type: 'missing_evidence',
                description: 'Relationship has no supporting evidence',
                severity: 'warning',
                suggestedAction: 'Add evidence to support this relationship'
            });
        }
        // Check for low confidence
        if (relationship.confidence < 0.3) {
            issues.push({
                type: 'low_confidence',
                description: `Low confidence score: ${(relationship.confidence * 100).toFixed(1)}%`,
                severity: 'warning',
                suggestedAction: 'Review relationship accuracy and add evidence'
            });
        }
        // Check for stale relationships
        const now = new Date();
        const age = now.getTime() - relationship.validFrom.getTime();
        const staleThreshold = 60 * 24 * 60 * 60 * 1000; // 60 days
        if (age > staleThreshold && relationship.active) {
            issues.push({
                type: 'stale_relationship',
                description: `Relationship is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old`,
                severity: 'info',
                suggestedAction: 'Verify relationship is still valid'
            });
        }
        return issues;
    }
    determineSeverity(issues) {
        const hasError = issues.some(issue => issue.severity === 'error');
        const hasWarning = issues.some(issue => issue.severity === 'warning');
        if (hasError)
            return 'error';
        if (hasWarning)
            return 'warning';
        return 'info';
    }
    generateValidationRecommendation(issues) {
        const highPriorityIssues = issues.filter(issue => issue.severity === 'error' || issue.severity === 'warning');
        if (highPriorityIssues.length === 0) {
            return 'Relationship appears healthy, continue monitoring';
        }
        const actions = highPriorityIssues.map(issue => issue.suggestedAction);
        return `Address the following: ${actions.join(', ')}`;
    }
}
//# sourceMappingURL=TestRelationships.js.map