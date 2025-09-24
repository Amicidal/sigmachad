/**
 * @file TestTemporalTracker.ts
 * @description Main temporal tracking service for test relationships
 *
 * Coordinates temporal tracking of test-to-code relationships, managing lifecycle
 * events, persistence, and providing high-level APIs for temporal queries.
 */
import { EventEmitter } from 'events';
/**
 * Main temporal tracking service for test relationships
 */
export class TestTemporalTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        this.relationships = new Map();
        this.executionHistory = new Map();
        this.evolutionEvents = new Map();
        this.config = {
            maxTrendDataPoints: 1000,
            flakinessThreshold: 0.1,
            coverageChangeThreshold: 0.05,
            performanceRegressionThreshold: 1.5,
            obsolescenceDetectionEnabled: true,
            trendAnalysisPeriod: 'weekly',
            batchSize: 100,
            ...config
        };
    }
    /**
     * Track a test execution event
     */
    async trackExecution(execution) {
        // Store execution record
        const testKey = `${execution.testId}:${execution.entityId}`;
        if (!this.executionHistory.has(testKey)) {
            this.executionHistory.set(testKey, []);
        }
        this.executionHistory.get(testKey).push(execution);
        // Create evolution event
        const evolutionEvent = {
            eventId: `evt_${execution.executionId}`,
            testId: execution.testId,
            entityId: execution.entityId,
            timestamp: execution.timestamp,
            type: this.getEvolutionEventType(execution),
            description: `Test ${execution.status}: ${execution.testId}`,
            newState: {
                status: execution.status,
                duration: execution.duration,
                coverage: execution.coverage
            },
            changeSetId: execution.runId,
            metadata: {
                executionId: execution.executionId,
                suiteId: execution.suiteId,
                runId: execution.runId
            }
        };
        await this.recordEvolutionEvent(evolutionEvent);
        // Check for significant changes
        await this.analyzeExecutionChanges(execution);
        // Emit event
        this.emit('execution-tracked', execution);
    }
    /**
     * Track a test relationship change
     */
    async trackRelationshipChange(testId, entityId, type, metadata, changeSetId) {
        const relationshipId = this.generateRelationshipId(testId, entityId, type, metadata.suiteId);
        const now = new Date();
        // Check if relationship exists
        const existing = this.relationships.get(relationshipId);
        if (existing && existing.active) {
            // Update existing relationship
            existing.metadata = metadata;
            existing.confidence = metadata.confidence;
            const evolutionEvent = {
                eventId: `evt_${relationshipId}_${now.getTime()}`,
                testId,
                entityId,
                timestamp: now,
                type: 'relationship_added',
                description: `Test relationship updated: ${testId} ${type} ${entityId}`,
                previousState: { metadata: existing.metadata },
                newState: { metadata },
                changeSetId,
                metadata: { relationshipId, type }
            };
            await this.recordEvolutionEvent(evolutionEvent);
        }
        else {
            // Create new relationship
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
                evidence: []
            };
            this.relationships.set(relationshipId, relationship);
            const evolutionEvent = {
                eventId: `evt_${relationshipId}_${now.getTime()}`,
                testId,
                entityId,
                timestamp: now,
                type: 'relationship_added',
                description: `Test relationship created: ${testId} ${type} ${entityId}`,
                newState: { relationship },
                changeSetId,
                metadata: { relationshipId, type }
            };
            await this.recordEvolutionEvent(evolutionEvent);
        }
        // Emit event
        this.emit('relationship-changed', { testId, entityId, type, metadata });
    }
    /**
     * Query temporal test data
     */
    async queryTimeline(query) {
        const events = await this.getFilteredEvents(query);
        const relationships = await this.getFilteredRelationships(query);
        const snapshots = []; // TODO: Implement snapshot retrieval
        const trends = []; // TODO: Implement trend retrieval
        return {
            events,
            relationships,
            snapshots,
            trends,
            totalCount: events.length
        };
    }
    /**
     * Get active relationships for a test or entity
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
     * Analyze test impact
     */
    async analyzeImpact(testId, entityId) {
        const relationships = await this.getActiveRelationships(testId, entityId);
        const executions = this.executionHistory.get(`${testId}:${entityId}`) || [];
        // Calculate impact score based on various factors
        const impactScore = this.calculateImpactScore(relationships, executions);
        // Get affected entities and tests
        const affectedEntities = new Set();
        const affectedTests = new Set();
        for (const rel of relationships) {
            affectedEntities.add(rel.entityId);
            affectedTests.add(rel.testId);
        }
        return {
            analysisId: `impact_${testId}_${entityId}_${Date.now()}`,
            testId,
            entityId,
            timestamp: new Date(),
            impactScore,
            affectedEntities: Array.from(affectedEntities),
            affectedTests: Array.from(affectedTests),
            riskAssessment: this.assessRisk(impactScore),
            factors: this.calculateImpactFactors(relationships, executions),
            recommendations: this.generateRecommendations(impactScore, relationships, executions)
        };
    }
    /**
     * Detect obsolescent tests
     */
    async detectObsolescence(entityId) {
        if (!this.config.obsolescenceDetectionEnabled) {
            return [];
        }
        const analyses = [];
        const relationships = await this.getActiveRelationships(undefined, entityId);
        for (const relationship of relationships) {
            const executions = this.executionHistory.get(`${relationship.testId}:${relationship.entityId}`) || [];
            const analysis = await this.analyzeTestObsolescence(relationship, executions);
            if (analysis) {
                analyses.push(analysis);
            }
        }
        return analyses;
    }
    /**
     * Close relationship (mark as inactive)
     */
    async closeRelationship(relationshipId, timestamp = new Date()) {
        const relationship = this.relationships.get(relationshipId);
        if (!relationship) {
            throw new Error(`Relationship not found: ${relationshipId}`);
        }
        relationship.active = false;
        relationship.validTo = timestamp;
        const evolutionEvent = {
            eventId: `evt_${relationshipId}_closed_${timestamp.getTime()}`,
            testId: relationship.testId,
            entityId: relationship.entityId,
            timestamp,
            type: 'relationship_removed',
            description: `Test relationship closed: ${relationship.testId} ${relationship.type} ${relationship.entityId}`,
            previousState: { active: true },
            newState: { active: false, validTo: timestamp },
            metadata: { relationshipId, type: relationship.type }
        };
        await this.recordEvolutionEvent(evolutionEvent);
        // Emit event
        this.emit('relationship-closed', { relationshipId, timestamp });
    }
    /**
     * Get test evolution events
     */
    async getEvolutionEvents(testId, entityId) {
        const key = entityId ? `${testId}:${entityId}` : testId;
        const events = this.evolutionEvents.get(key) || [];
        if (entityId) {
            return events.filter(event => event.entityId === entityId);
        }
        return events;
    }
    // Private helper methods
    generateRelationshipId(testId, entityId, type, suiteId) {
        return `rel_${testId}_${entityId}_${type}_${suiteId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    getEvolutionEventType(execution) {
        switch (execution.status) {
            case 'pass':
                return 'test_modified'; // Could be more specific based on previous state
            case 'fail':
                return 'test_modified';
            default:
                return 'test_modified';
        }
    }
    async recordEvolutionEvent(event) {
        const key = `${event.testId}:${event.entityId}`;
        if (!this.evolutionEvents.has(key)) {
            this.evolutionEvents.set(key, []);
        }
        this.evolutionEvents.get(key).push(event);
        // Emit event
        this.emit('evolution-event', event);
    }
    async analyzeExecutionChanges(execution) {
        const testKey = `${execution.testId}:${execution.entityId}`;
        const history = this.executionHistory.get(testKey) || [];
        if (history.length < 2)
            return;
        const previous = history[history.length - 2];
        // Check for coverage changes
        if (execution.coverage && previous.coverage) {
            const coverageChange = Math.abs(execution.coverage.overall - previous.coverage.overall);
            if (coverageChange > this.config.coverageChangeThreshold) {
                const eventType = execution.coverage.overall > previous.coverage.overall
                    ? 'coverage_increased'
                    : 'coverage_decreased';
                const event = {
                    eventId: `evt_coverage_${execution.executionId}`,
                    testId: execution.testId,
                    entityId: execution.entityId,
                    timestamp: execution.timestamp,
                    type: eventType,
                    description: `Coverage ${eventType.split('_')[1]}: ${previous.coverage.overall.toFixed(3)} → ${execution.coverage.overall.toFixed(3)}`,
                    previousState: { coverage: previous.coverage },
                    newState: { coverage: execution.coverage },
                    metadata: { coverageChange }
                };
                await this.recordEvolutionEvent(event);
            }
        }
        // Check for performance regression
        if (execution.duration && previous.duration) {
            const performanceRatio = execution.duration / previous.duration;
            if (performanceRatio > this.config.performanceRegressionThreshold) {
                const event = {
                    eventId: `evt_perf_regression_${execution.executionId}`,
                    testId: execution.testId,
                    entityId: execution.entityId,
                    timestamp: execution.timestamp,
                    type: 'performance_regression',
                    description: `Performance regression: ${previous.duration}ms → ${execution.duration}ms`,
                    previousState: { duration: previous.duration },
                    newState: { duration: execution.duration },
                    metadata: { performanceRatio }
                };
                await this.recordEvolutionEvent(event);
            }
        }
        // Check for flakiness
        await this.checkFlakiness(execution, history);
    }
    async checkFlakiness(execution, history) {
        if (history.length < 10)
            return; // Need enough history
        const recentHistory = history.slice(-10);
        const failures = recentHistory.filter(h => h.status === 'fail').length;
        const flakinessScore = failures / recentHistory.length;
        if (flakinessScore > this.config.flakinessThreshold) {
            const event = {
                eventId: `evt_flaky_${execution.executionId}`,
                testId: execution.testId,
                entityId: execution.entityId,
                timestamp: execution.timestamp,
                type: 'flakiness_detected',
                description: `Flakiness detected: ${flakinessScore.toFixed(3)} failure rate`,
                newState: { flakinessScore },
                metadata: { recentFailures: failures, totalRecent: recentHistory.length }
            };
            await this.recordEvolutionEvent(event);
        }
    }
    async getFilteredEvents(query) {
        const results = [];
        for (const events of this.evolutionEvents.values()) {
            for (const event of events) {
                if (query.testId && event.testId !== query.testId)
                    continue;
                if (query.entityId && event.entityId !== query.entityId)
                    continue;
                if (query.startDate && event.timestamp < query.startDate)
                    continue;
                if (query.endDate && event.timestamp > query.endDate)
                    continue;
                if (query.eventTypes && !query.eventTypes.includes(event.type))
                    continue;
                results.push(event);
            }
        }
        // Sort by timestamp and apply limit/offset
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const offset = query.offset || 0;
        const limit = query.limit || results.length;
        return results.slice(offset, offset + limit);
    }
    async getFilteredRelationships(query) {
        if (!query.includeRelationships)
            return [];
        const results = [];
        for (const relationship of this.relationships.values()) {
            if (query.testId && relationship.testId !== query.testId)
                continue;
            if (query.entityId && relationship.entityId !== query.entityId)
                continue;
            if (query.startDate && relationship.validFrom < query.startDate)
                continue;
            if (query.endDate && relationship.validTo && relationship.validTo > query.endDate)
                continue;
            results.push(relationship);
        }
        return results;
    }
    calculateImpactScore(relationships, executions) {
        if (relationships.length === 0)
            return 0;
        let score = 0;
        let factors = 0;
        // Factor 1: Number of relationships
        score += Math.min(relationships.length / 10, 1) * 0.3;
        factors++;
        // Factor 2: Relationship confidence
        const avgConfidence = relationships.reduce((sum, rel) => sum + rel.confidence, 0) / relationships.length;
        score += avgConfidence * 0.2;
        factors++;
        // Factor 3: Execution frequency
        if (executions.length > 0) {
            const recentExecutions = executions.filter(ex => ex.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
            score += Math.min(recentExecutions / 100, 1) * 0.3;
            factors++;
        }
        // Factor 4: Coverage
        const avgCoverage = executions
            .filter(ex => ex.coverage)
            .reduce((sum, ex) => sum + ex.coverage.overall, 0) /
            executions.filter(ex => ex.coverage).length || 0;
        score += avgCoverage * 0.2;
        factors++;
        return factors > 0 ? score / factors : 0;
    }
    assessRisk(impactScore) {
        if (impactScore < 0.3)
            return 'low';
        if (impactScore < 0.6)
            return 'medium';
        if (impactScore < 0.8)
            return 'high';
        return 'critical';
    }
    calculateImpactFactors(relationships, executions) {
        const factors = [];
        // Coverage factor
        if (executions.length > 0) {
            const coverages = executions.filter(ex => ex.coverage).map(ex => ex.coverage.overall);
            if (coverages.length > 0) {
                const avgCoverage = coverages.reduce((sum, cov) => sum + cov, 0) / coverages.length;
                factors.push({
                    type: 'coverage_change',
                    description: `Average coverage: ${(avgCoverage * 100).toFixed(1)}%`,
                    weight: 0.4,
                    value: avgCoverage
                });
            }
        }
        // Relationship factor
        factors.push({
            type: 'relationship_change',
            description: `${relationships.length} active relationships`,
            weight: 0.3,
            value: Math.min(relationships.length / 10, 1)
        });
        return factors;
    }
    generateRecommendations(impactScore, relationships, executions) {
        const recommendations = [];
        if (impactScore > 0.7) {
            recommendations.push('High impact detected - review test changes carefully');
        }
        if (relationships.some(rel => rel.confidence < 0.5)) {
            recommendations.push('Some relationships have low confidence - review test mapping');
        }
        const recentFailures = executions.filter(ex => ex.status === 'fail' && ex.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        if (recentFailures > 3) {
            recommendations.push('Recent test failures detected - investigate test stability');
        }
        return recommendations;
    }
    async analyzeTestObsolescence(relationship, executions) {
        let obsolescenceScore = 0;
        const reasons = [];
        // Check execution frequency
        const recentExecutions = executions.filter(ex => ex.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        if (recentExecutions.length === 0) {
            obsolescenceScore += 0.4;
            reasons.push('entity_removed');
        }
        // Check coverage
        const avgCoverage = recentExecutions
            .filter(ex => ex.coverage)
            .reduce((sum, ex) => sum + ex.coverage.overall, 0) /
            recentExecutions.filter(ex => ex.coverage).length || 0;
        if (avgCoverage < 0.1) {
            obsolescenceScore += 0.3;
            reasons.push('low_coverage');
        }
        // Check pass rate
        const passRate = recentExecutions.filter(ex => ex.status === 'pass').length /
            Math.max(recentExecutions.length, 1);
        if (passRate > 0.95 && recentExecutions.length > 10) {
            obsolescenceScore += 0.2;
            reasons.push('consistently_passing');
        }
        if (obsolescenceScore < 0.3)
            return null;
        return {
            analysisId: `obsolescence_${relationship.relationshipId}_${Date.now()}`,
            testId: relationship.testId,
            entityId: relationship.entityId,
            timestamp: new Date(),
            obsolescenceScore,
            reasons,
            recommendation: obsolescenceScore > 0.7 ? 'remove' :
                obsolescenceScore > 0.5 ? 'investigate' : 'update',
            lastMeaningfulExecution: recentExecutions.length > 0 ?
                recentExecutions[recentExecutions.length - 1].timestamp : undefined
        };
    }
}
//# sourceMappingURL=TestTemporalTracker.js.map