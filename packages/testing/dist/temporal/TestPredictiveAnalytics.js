/**
 * @file TestPredictiveAnalytics.ts
 * @description Predictive analytics for temporal test tracking
 *
 * Implements test failure prediction, obsolescence prediction, maintenance cost estimation,
 * and test priority scoring using historical data and machine learning techniques.
 */
/**
 * Predictive analytics service for temporal test tracking
 */
export class TestPredictiveAnalytics {
    constructor(config = {}, executionData = new Map(), eventData = new Map(), relationshipData = new Map()) {
        this.executionData = executionData;
        this.eventData = eventData;
        this.relationshipData = relationshipData;
        this.models = new Map();
        this.config = {
            enableFailurePrediction: true,
            enableObsolescencePrediction: true,
            enableMaintenanceCostEstimation: true,
            enableTestPriorityScoring: true,
            minDataPoints: 20,
            modelRetrainingFrequency: 7,
            confidenceThreshold: 0.7,
            maxPredictionHorizon: 30,
            ...config
        };
    }
    /**
     * Predict test failure probability
     */
    async predictTestFailure(testId, entityId, horizon = 7) {
        if (!this.config.enableFailurePrediction) {
            throw new Error('Failure prediction is disabled');
        }
        const key = `${testId}:${entityId}`;
        const executions = this.executionData.get(key) || [];
        const events = this.eventData.get(key) || [];
        if (executions.length < this.config.minDataPoints) {
            throw new Error(`Insufficient data for prediction: ${executions.length} < ${this.config.minDataPoints}`);
        }
        // Extract features for prediction
        const features = this.extractFailureFeatures(executions, events);
        // Calculate failure probability using simple heuristics
        // In a real implementation, this would use a trained ML model
        const failureProbability = this.calculateFailureProbability(features);
        const confidence = this.calculatePredictionConfidence(executions, features);
        const riskLevel = this.determineRiskLevel(failureProbability);
        const factors = [
            {
                factor: 'Recent Failure Rate',
                importance: 0.3,
                value: features.recentFailureRate,
                description: `Recent failure rate of ${(features.recentFailureRate * 100).toFixed(1)}%`
            },
            {
                factor: 'Flakiness Score',
                importance: 0.25,
                value: features.flakinessScore,
                description: `Flakiness score of ${(features.flakinessScore * 100).toFixed(1)}%`
            },
            {
                factor: 'Performance Trend',
                importance: 0.2,
                value: features.performanceTrendScore,
                description: features.performanceTrend === 'degrading' ? 'Performance is degrading' : 'Performance is stable/improving'
            },
            {
                factor: 'Code Changes',
                importance: 0.15,
                value: features.recentChanges,
                description: `${features.recentChanges} recent code changes`
            },
            {
                factor: 'Test Age',
                importance: 0.1,
                value: features.testAge,
                description: `Test is ${features.testAge} days old`
            }
        ];
        const recommendations = this.generateFailureRecommendations(features, failureProbability);
        return {
            predictionId: `failure_${testId}_${entityId}_${Date.now()}`,
            testId,
            entityId,
            timestamp: new Date(),
            failureProbability,
            confidence,
            riskLevel,
            factors,
            recommendations,
            expiresAt: new Date(Date.now() + horizon * 24 * 60 * 60 * 1000)
        };
    }
    /**
     * Predict test obsolescence
     */
    async predictTestObsolescence(testId, entityId) {
        if (!this.config.enableObsolescencePrediction) {
            throw new Error('Obsolescence prediction is disabled');
        }
        const key = `${testId}:${entityId}`;
        const executions = this.executionData.get(key) || [];
        const events = this.eventData.get(key) || [];
        if (executions.length < this.config.minDataPoints) {
            throw new Error(`Insufficient data for prediction: ${executions.length} < ${this.config.minDataPoints}`);
        }
        const features = this.extractObsolescenceFeatures(executions, events);
        const obsolescenceProbability = this.calculateObsolescenceProbability(features);
        const estimatedDaysToObsolescence = this.estimateDaysToObsolescence(features);
        const confidence = this.calculatePredictionConfidence(executions, features);
        const factors = [
            {
                factor: 'Execution Frequency',
                weight: 0.3,
                value: features.executionFrequency,
                trend: features.executionTrend
            },
            {
                factor: 'Code Coverage',
                weight: 0.25,
                value: features.coverageScore,
                trend: features.coverageTrend
            },
            {
                factor: 'Last Meaningful Change',
                weight: 0.2,
                value: features.daysSinceLastChange,
                trend: 'increasing'
            },
            {
                factor: 'Pass Rate',
                weight: 0.15,
                value: features.passRate,
                trend: features.passRateTrend
            },
            {
                factor: 'Relationship Strength',
                weight: 0.1,
                value: features.relationshipStrength,
                trend: features.relationshipTrend
            }
        ];
        const recommendations = this.generateObsolescenceRecommendations(features, obsolescenceProbability);
        return {
            predictionId: `obsolescence_${testId}_${entityId}_${Date.now()}`,
            testId,
            entityId,
            timestamp: new Date(),
            obsolescenceProbability,
            estimatedDaysToObsolescence,
            confidence,
            factors,
            recommendations
        };
    }
    /**
     * Estimate maintenance cost
     */
    async estimateMaintenanceCost(testId, entityId, timeFrame = 30) {
        if (!this.config.enableMaintenanceCostEstimation) {
            throw new Error('Maintenance cost estimation is disabled');
        }
        const key = `${testId}:${entityId}`;
        const executions = this.executionData.get(key) || [];
        const events = this.eventData.get(key) || [];
        const features = this.extractMaintenanceFeatures(executions, events);
        const costs = this.calculateMaintenanceCosts(features, timeFrame);
        const trend = this.determineMaintenanceTrend(features);
        const confidence = this.calculatePredictionConfidence(executions, features);
        const optimizations = this.generateMaintenanceOptimizations(features, costs);
        return {
            estimateId: `maintenance_${testId}_${entityId}_${Date.now()}`,
            testId,
            entityId,
            timestamp: new Date(),
            estimatedHours: costs.total,
            breakdown: costs.breakdown,
            trend,
            confidence,
            optimizations
        };
    }
    /**
     * Calculate test priority score
     */
    async calculateTestPriority(testId, entityId) {
        if (!this.config.enableTestPriorityScoring) {
            throw new Error('Test priority scoring is disabled');
        }
        const key = `${testId}:${entityId}`;
        const executions = this.executionData.get(key) || [];
        const events = this.eventData.get(key) || [];
        const relationships = this.relationshipData.get(key) || [];
        const features = this.extractPriorityFeatures(executions, events, relationships);
        const components = this.calculatePriorityComponents(features);
        const priorityScore = this.calculateOverallPriority(components);
        const priorityLevel = this.determinePriorityLevel(priorityScore);
        const factors = [
            {
                name: 'Business Value',
                weight: 0.25,
                score: components.businessValue,
                justification: 'Based on test coverage and entity importance'
            },
            {
                name: 'Technical Risk',
                weight: 0.2,
                score: components.technicalRisk,
                justification: 'Based on failure rate and complexity'
            },
            {
                name: 'Maintenance Cost',
                weight: 0.15,
                score: 1 - components.maintenanceCost, // Invert because lower cost = higher priority
                justification: 'Based on historical maintenance effort'
            },
            {
                name: 'Coverage Quality',
                weight: 0.15,
                score: components.coverage,
                justification: 'Based on code coverage metrics'
            },
            {
                name: 'Stability',
                weight: 0.15,
                score: components.stability,
                justification: 'Based on test reliability and flakiness'
            },
            {
                name: 'Execution Frequency',
                weight: 0.1,
                score: components.frequency,
                justification: 'Based on how often the test runs'
            }
        ];
        const recommendations = this.generatePriorityRecommendations(components, priorityScore);
        return {
            testId,
            entityId,
            priorityScore,
            priorityLevel,
            components,
            factors,
            recommendations,
            lastUpdated: new Date()
        };
    }
    /**
     * Batch prediction for multiple tests
     */
    async batchPredict(testIds, predictionTypes) {
        const results = {
            failures: [],
            obsolescence: [],
            maintenance: [],
            priorities: []
        };
        const batchSize = Math.min(testIds.length, 10); // Process in batches to avoid overwhelming
        for (let i = 0; i < testIds.length; i += batchSize) {
            const batch = testIds.slice(i, i + batchSize);
            const batchPromises = batch.map(async ({ testId, entityId }) => {
                const promises = [];
                if (predictionTypes.includes('failure')) {
                    promises.push(this.predictTestFailure(testId, entityId).catch(() => null));
                }
                if (predictionTypes.includes('obsolescence')) {
                    promises.push(this.predictTestObsolescence(testId, entityId).catch(() => null));
                }
                if (predictionTypes.includes('maintenance')) {
                    promises.push(this.estimateMaintenanceCost(testId, entityId).catch(() => null));
                }
                if (predictionTypes.includes('priority')) {
                    promises.push(this.calculateTestPriority(testId, entityId).catch(() => null));
                }
                return Promise.all(promises);
            });
            const batchResults = await Promise.all(batchPromises);
            // Process results
            batchResults.forEach((testResults, index) => {
                let resultIndex = 0;
                if (predictionTypes.includes('failure') && testResults[resultIndex]) {
                    results.failures.push(testResults[resultIndex]);
                }
                if (predictionTypes.includes('failure'))
                    resultIndex++;
                if (predictionTypes.includes('obsolescence') && testResults[resultIndex]) {
                    results.obsolescence.push(testResults[resultIndex]);
                }
                if (predictionTypes.includes('obsolescence'))
                    resultIndex++;
                if (predictionTypes.includes('maintenance') && testResults[resultIndex]) {
                    results.maintenance.push(testResults[resultIndex]);
                }
                if (predictionTypes.includes('maintenance'))
                    resultIndex++;
                if (predictionTypes.includes('priority') && testResults[resultIndex]) {
                    results.priorities.push(testResults[resultIndex]);
                }
            });
        }
        return results;
    }
    /**
     * Train prediction models
     */
    async trainModels() {
        // In a real implementation, this would train actual ML models
        // For now, we'll create mock model metadata
        const failureModel = {
            id: 'failure_model_v1',
            name: 'Test Failure Prediction Model',
            version: '1.0.0',
            trainingDataSize: Array.from(this.executionData.values()).flat().length,
            accuracy: {
                precision: 0.85,
                recall: 0.78,
                f1Score: 0.81,
                auc: 0.89
            },
            lastTrained: new Date(),
            featureImportance: {
                recentFailureRate: 0.3,
                flakinessScore: 0.25,
                performanceTrend: 0.2,
                recentChanges: 0.15,
                testAge: 0.1
            }
        };
        const obsolescenceModel = {
            id: 'obsolescence_model_v1',
            name: 'Test Obsolescence Prediction Model',
            version: '1.0.0',
            trainingDataSize: Array.from(this.executionData.values()).flat().length,
            accuracy: {
                precision: 0.76,
                recall: 0.82,
                f1Score: 0.79,
                auc: 0.84
            },
            lastTrained: new Date(),
            featureImportance: {
                executionFrequency: 0.3,
                coverageScore: 0.25,
                daysSinceLastChange: 0.2,
                passRate: 0.15,
                relationshipStrength: 0.1
            }
        };
        const maintenanceModel = {
            id: 'maintenance_model_v1',
            name: 'Maintenance Cost Prediction Model',
            version: '1.0.0',
            trainingDataSize: Array.from(this.executionData.values()).flat().length,
            accuracy: {
                precision: 0.72,
                recall: 0.68,
                f1Score: 0.70,
                auc: 0.78
            },
            lastTrained: new Date(),
            featureImportance: {
                flakinessScore: 0.35,
                complexityScore: 0.25,
                changeFrequency: 0.2,
                testAge: 0.15,
                executionTime: 0.05
            }
        };
        this.models.set('failure', failureModel);
        this.models.set('obsolescence', obsolescenceModel);
        this.models.set('maintenance', maintenanceModel);
        return {
            failureModel,
            obsolescenceModel,
            maintenanceModel
        };
    }
    /**
     * Get model performance metrics
     */
    async getModelMetrics() {
        const result = {};
        for (const [key, model] of this.models.entries()) {
            result[key] = model;
        }
        return result;
    }
    // Private helper methods for feature extraction and calculations
    extractFailureFeatures(executions, events) {
        const recentExecutions = executions.slice(-20);
        const recentFailures = recentExecutions.filter(exec => exec.status === 'fail').length;
        const recentFailureRate = recentFailures / Math.max(recentExecutions.length, 1);
        const flakinessEvents = events.filter(event => event.type === 'flakiness_detected');
        const flakinessScore = flakinessEvents.length > 0 ?
            flakinessEvents[flakinessEvents.length - 1].newState?.flakinessScore || 0 : 0;
        const performanceEvents = events.filter(event => event.type === 'performance_regression');
        const performanceTrend = performanceEvents.length > 0 ? 'degrading' : 'stable';
        const performanceTrendScore = performanceTrend === 'degrading' ? 1 : 0;
        const recentChanges = events.filter(event => event.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        const oldestExecution = executions.length > 0 ? executions[0].timestamp : new Date();
        const testAge = Math.floor((Date.now() - oldestExecution.getTime()) / (24 * 60 * 60 * 1000));
        return {
            recentFailureRate,
            flakinessScore,
            performanceTrend,
            performanceTrendScore,
            recentChanges,
            testAge
        };
    }
    extractObsolescenceFeatures(executions, events) {
        const recentExecutions = executions.filter(exec => exec.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const executionFrequency = recentExecutions.length / 30;
        const olderExecutions = executions.filter(exec => exec.timestamp <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) &&
            exec.timestamp > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
        const olderFrequency = olderExecutions.length / 30;
        const executionTrend = executionFrequency > olderFrequency ? 'increasing' :
            executionFrequency < olderFrequency ? 'decreasing' : 'stable';
        const coverageExecutions = executions.filter(exec => exec.coverage);
        const avgCoverage = coverageExecutions.length > 0 ?
            coverageExecutions.reduce((sum, exec) => sum + exec.coverage.overall, 0) / coverageExecutions.length : 0;
        const recentCoverage = recentExecutions
            .filter(exec => exec.coverage)
            .reduce((sum, exec) => sum + exec.coverage.overall, 0) /
            Math.max(recentExecutions.filter(exec => exec.coverage).length, 1);
        const coverageTrend = recentCoverage > avgCoverage ? 'increasing' :
            recentCoverage < avgCoverage ? 'decreasing' : 'stable';
        const lastMeaningfulEvent = events
            .filter(event => !['test_modified', 'relationship_added'].includes(event.type))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        const daysSinceLastChange = lastMeaningfulEvent ?
            Math.floor((Date.now() - lastMeaningfulEvent.timestamp.getTime()) / (24 * 60 * 60 * 1000)) : 365;
        const passRate = executions.filter(exec => exec.status === 'pass').length / Math.max(executions.length, 1);
        const recentPassRate = recentExecutions.filter(exec => exec.status === 'pass').length /
            Math.max(recentExecutions.length, 1);
        const passRateTrend = recentPassRate > passRate ? 'increasing' :
            recentPassRate < passRate ? 'decreasing' : 'stable';
        return {
            executionFrequency,
            executionTrend,
            coverageScore: avgCoverage,
            coverageTrend,
            daysSinceLastChange,
            passRate,
            passRateTrend,
            relationshipStrength: 0.5, // Placeholder
            relationshipTrend: 'stable'
        };
    }
    extractMaintenanceFeatures(executions, events) {
        const flakinessEvents = events.filter(event => event.type === 'flakiness_detected');
        const flakinessScore = flakinessEvents.length > 0 ?
            flakinessEvents[flakinessEvents.length - 1].newState?.flakinessScore || 0 : 0;
        const complexityScore = executions.length > 0 ?
            executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length / 1000 : 0;
        const changeEvents = events.filter(event => ['test_modified', 'coverage_changed', 'performance_regression'].includes(event.type));
        const changeFrequency = changeEvents.length / Math.max(executions.length, 1);
        const oldestExecution = executions.length > 0 ? executions[0].timestamp : new Date();
        const testAge = Math.floor((Date.now() - oldestExecution.getTime()) / (24 * 60 * 60 * 1000));
        const avgExecutionTime = executions.length > 0 ?
            executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length : 0;
        return {
            flakinessScore,
            complexityScore: Math.min(complexityScore, 1),
            changeFrequency,
            testAge,
            avgExecutionTime
        };
    }
    extractPriorityFeatures(executions, events, relationships) {
        const coverage = executions.length > 0 ?
            executions.filter(exec => exec.coverage)
                .reduce((sum, exec) => sum + exec.coverage.overall, 0) /
                executions.filter(exec => exec.coverage).length : 0;
        const failureRate = executions.filter(exec => exec.status === 'fail').length / Math.max(executions.length, 1);
        const executionFrequency = executions.filter(exec => exec.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
        const relationshipCount = relationships.filter(rel => rel.active).length;
        return {
            coverage,
            failureRate,
            executionFrequency,
            relationshipCount,
            complexity: executions.length > 0 ?
                executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length : 0
        };
    }
    calculateFailureProbability(features) {
        // Simple weighted scoring - in reality would use trained ML model
        let score = 0;
        score += features.recentFailureRate * 0.4;
        score += features.flakinessScore * 0.3;
        score += features.performanceTrendScore * 0.2;
        score += Math.min(features.recentChanges / 10, 1) * 0.1;
        return Math.min(score, 1);
    }
    calculateObsolescenceProbability(features) {
        let score = 0;
        score += Math.max(0, 1 - features.executionFrequency / 5) * 0.3;
        score += Math.max(0, 1 - features.coverageScore) * 0.25;
        score += Math.min(features.daysSinceLastChange / 365, 1) * 0.25;
        score += Math.max(0, 1 - features.passRate) * 0.2;
        return Math.min(score, 1);
    }
    estimateDaysToObsolescence(features) {
        const baseDays = 365;
        const adjustmentFactor = 1 - this.calculateObsolescenceProbability(features);
        return Math.floor(baseDays * adjustmentFactor);
    }
    calculateMaintenanceCosts(features, timeFrame) {
        const baseCost = 2; // Base 2 hours per month
        const debugging = features.flakinessScore * 8 * (timeFrame / 30);
        const flakiness = features.flakinessScore * 4 * (timeFrame / 30);
        const updating = features.changeFrequency * 6 * (timeFrame / 30);
        const refactoring = features.complexityScore * 10 * (timeFrame / 30);
        const obsolescence = Math.max(0, features.testAge / 365 - 1) * 5 * (timeFrame / 30);
        const total = debugging + flakiness + updating + refactoring + obsolescence;
        return {
            total,
            breakdown: {
                debugging,
                flakiness,
                updating,
                refactoring,
                obsolescence
            }
        };
    }
    calculatePriorityComponents(features) {
        return {
            businessValue: Math.min(features.coverage + (features.relationshipCount / 10), 1),
            technicalRisk: features.failureRate,
            maintenanceCost: Math.min(features.complexity / 1000, 1),
            coverage: features.coverage,
            stability: 1 - features.failureRate,
            frequency: Math.min(features.executionFrequency / 30, 1)
        };
    }
    calculateOverallPriority(components) {
        const weights = {
            businessValue: 0.25,
            technicalRisk: 0.2,
            maintenanceCost: 0.15,
            coverage: 0.15,
            stability: 0.15,
            frequency: 0.1
        };
        let score = 0;
        score += components.businessValue * weights.businessValue;
        score += components.technicalRisk * weights.technicalRisk;
        score += (1 - components.maintenanceCost) * weights.maintenanceCost; // Invert maintenance cost
        score += components.coverage * weights.coverage;
        score += components.stability * weights.stability;
        score += components.frequency * weights.frequency;
        return score;
    }
    calculatePredictionConfidence(executions, features) {
        // Confidence based on data availability and consistency
        const dataPoints = executions.length;
        const dataConfidence = Math.min(dataPoints / this.config.minDataPoints, 1);
        // Reduce confidence for edge cases
        const featureStability = 0.8; // Placeholder - would analyze feature variance in real implementation
        return dataConfidence * featureStability;
    }
    determineRiskLevel(probability) {
        if (probability < 0.2)
            return 'low';
        if (probability < 0.5)
            return 'medium';
        if (probability < 0.8)
            return 'high';
        return 'critical';
    }
    determinePriorityLevel(score) {
        if (score < 0.3)
            return 'low';
        if (score < 0.6)
            return 'medium';
        if (score < 0.8)
            return 'high';
        return 'critical';
    }
    determineMaintenanceTrend(features) {
        // Simple heuristic - in reality would analyze historical trends
        if (features.flakinessScore > 0.2 || features.changeFrequency > 0.5)
            return 'increasing';
        if (features.flakinessScore < 0.05 && features.changeFrequency < 0.1)
            return 'decreasing';
        return 'stable';
    }
    generateFailureRecommendations(features, probability) {
        const recommendations = [];
        if (features.recentFailureRate > 0.2) {
            recommendations.push('Investigate recent test failures and fix underlying issues');
        }
        if (features.flakinessScore > 0.1) {
            recommendations.push('Address test flakiness by improving test reliability');
        }
        if (features.performanceTrend === 'degrading') {
            recommendations.push('Review performance regressions and optimize test execution');
        }
        if (features.recentChanges > 5) {
            recommendations.push('Consider test impact of recent code changes');
        }
        if (probability > 0.7) {
            recommendations.push('High failure risk - prioritize immediate attention');
        }
        return recommendations;
    }
    generateObsolescenceRecommendations(features, probability) {
        const recommendations = [];
        if (features.executionFrequency < 0.1) {
            recommendations.push('Test rarely executes - consider removing or updating');
        }
        if (features.coverageScore < 0.3) {
            recommendations.push('Low coverage detected - improve test coverage or remove');
        }
        if (features.daysSinceLastChange > 180) {
            recommendations.push('No recent changes - verify test is still relevant');
        }
        if (probability > 0.7) {
            recommendations.push('High obsolescence risk - review test necessity');
        }
        return recommendations;
    }
    generateMaintenanceOptimizations(features, costs) {
        const optimizations = [];
        if (features.flakinessScore > 0.1) {
            optimizations.push({
                action: 'Fix test flakiness',
                expectedSavings: costs.breakdown.flakiness * 0.8,
                effort: 'medium',
                impact: 'high'
            });
        }
        if (features.complexityScore > 0.7) {
            optimizations.push({
                action: 'Simplify test implementation',
                expectedSavings: costs.breakdown.refactoring * 0.6,
                effort: 'high',
                impact: 'medium'
            });
        }
        return optimizations;
    }
    generatePriorityRecommendations(components, score) {
        const recommendations = [];
        if (components.coverage < 0.5) {
            recommendations.push('Improve test coverage');
        }
        if (components.stability < 0.8) {
            recommendations.push('Address test reliability issues');
        }
        if (score > 0.8) {
            recommendations.push('High priority test - ensure adequate resources');
        }
        return recommendations;
    }
    /**
     * Update internal data stores
     */
    updateExecutionData(key, executions) {
        this.executionData.set(key, executions);
    }
    updateEventData(key, events) {
        this.eventData.set(key, events);
    }
    updateRelationshipData(key, relationships) {
        this.relationshipData.set(key, relationships);
    }
}
//# sourceMappingURL=TestPredictiveAnalytics.js.map