/**
 * @file TestEvolution.ts
 * @description Test evolution analysis service for detecting and analyzing changes in test behavior over time
 *
 * Provides sophisticated analysis of test evolution patterns, including coverage trends,
 * performance changes, flakiness detection, and relationship evolution.
 */
/**
 * Test evolution analysis service
 */
export class TestEvolution {
    constructor(config) {
        this.executionCache = new Map();
        this.eventCache = new Map();
        this.config = config;
    }
    /**
     * Analyze test evolution over a time period
     */
    async analyzeEvolution(testId, entityId, startDate, endDate) {
        const executions = await this.getExecutions(testId, entityId, startDate, endDate);
        const events = await this.getEvents(testId, entityId, startDate, endDate);
        const coverageEvolution = await this.analyzeCoverageEvolution(testId, entityId, 'weekly');
        const performanceEvolution = this.analyzePerformanceEvolution(executions);
        const flakinessEvolution = await this.analyzeFlakinessEvolution(executions);
        const trends = await this.detectAllTrends(testId, entityId, executions);
        const healthScore = this.calculateHealthScore(executions, coverageEvolution, performanceEvolution, flakinessEvolution);
        const recommendations = this.generateEvolutionRecommendations(healthScore, coverageEvolution, performanceEvolution, flakinessEvolution);
        return {
            testId,
            entityId,
            period: { start: startDate, end: endDate },
            overallHealth: healthScore,
            trends,
            significantEvents: this.filterSignificantEvents(events),
            coverageEvolution,
            performanceEvolution,
            flakinessEvolution,
            recommendations
        };
    }
    /**
     * Detect trends in test metrics
     */
    async detectTrends(testId, entityId, metric, period) {
        const endDate = new Date();
        const startDate = this.getStartDateForPeriod(endDate, period);
        const executions = await this.getExecutions(testId, entityId, startDate, endDate);
        return this.calculateTrendsForMetric(testId, entityId, metric, period, executions);
    }
    /**
     * Analyze coverage evolution
     */
    async analyzeCoverageEvolution(testId, entityId, period) {
        const endDate = new Date();
        const startDate = this.getStartDateForPeriod(endDate, period);
        const executions = await this.getExecutions(testId, entityId, startDate, endDate);
        const coverageData = executions
            .filter(exec => exec.coverage)
            .map(exec => exec.coverage.overall);
        if (coverageData.length === 0) {
            return {
                currentCoverage: 0,
                averageCoverage: 0,
                coverageTrend: 'stable',
                significantChanges: [],
                volatility: 0
            };
        }
        const currentCoverage = coverageData[coverageData.length - 1];
        const averageCoverage = coverageData.reduce((sum, cov) => sum + cov, 0) / coverageData.length;
        const volatility = this.calculateStandardDeviation(coverageData);
        const coverageTrend = this.determineTrend(coverageData);
        const significantChanges = this.detectCoverageChanges(executions);
        return {
            currentCoverage,
            averageCoverage,
            coverageTrend,
            significantChanges,
            volatility
        };
    }
    /**
     * Detect performance regressions
     */
    async detectPerformanceRegressions(testId, entityId, baselineWindow = 10) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
        const executions = await this.getExecutions(testId, entityId, startDate, endDate);
        return this.findPerformanceRegressions(executions, baselineWindow);
    }
    /**
     * Analyze flakiness patterns
     */
    async analyzeFlakinessPatterns(testId, entityId) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days
        const executions = await this.getExecutions(testId, entityId, startDate, endDate);
        return this.analyzeFlakinessEvolution(executions);
    }
    /**
     * Compare test evolution between entities
     */
    async compareEvolution(testId, entityId1, entityId2, period) {
        const endDate = new Date();
        const startDate = this.getStartDateForPeriod(endDate, period);
        const executions1 = await this.getExecutions(testId, entityId1, startDate, endDate);
        const executions2 = await this.getExecutions(testId, entityId2, startDate, endDate);
        const similarities = this.findSimilarities(executions1, executions2);
        const differences = this.findDifferences(executions1, executions2);
        const recommendations = this.generateComparisonRecommendations(similarities, differences);
        return {
            testId,
            entity1: entityId1,
            entity2: entityId2,
            period,
            similarities,
            differences,
            recommendations
        };
    }
    // Private helper methods
    async getExecutions(testId, entityId, startDate, endDate) {
        const key = `${testId}:${entityId}`;
        const cached = this.executionCache.get(key) || [];
        return cached.filter(exec => exec.timestamp >= startDate && exec.timestamp <= endDate);
    }
    async getEvents(testId, entityId, startDate, endDate) {
        const key = `${testId}:${entityId}`;
        const cached = this.eventCache.get(key) || [];
        return cached.filter(event => event.timestamp >= startDate && event.timestamp <= endDate);
    }
    getStartDateForPeriod(endDate, period) {
        const days = {
            daily: 7,
            weekly: 30,
            monthly: 90,
            quarterly: 270
        };
        return new Date(endDate.getTime() - days[period] * 24 * 60 * 60 * 1000);
    }
    async detectAllTrends(testId, entityId, executions) {
        const trends = [];
        const metrics = ['coverage', 'success_rate', 'execution_time', 'flakiness'];
        for (const metric of metrics) {
            const metricTrends = this.calculateTrendsForMetric(testId, entityId, metric, 'weekly', executions);
            trends.push(...metricTrends);
        }
        return trends;
    }
    calculateTrendsForMetric(testId, entityId, metric, period, executions) {
        const dataPoints = this.extractMetricDataPoints(executions, metric);
        if (dataPoints.length < 3)
            return [];
        const trend = this.analyzeTrendInDataPoints(dataPoints);
        if (!trend)
            return [];
        return [{
                trendId: `trend_${testId}_${entityId}_${metric}_${Date.now()}`,
                testId,
                entityId,
                metric,
                period,
                direction: trend.direction,
                magnitude: trend.magnitude,
                startDate: dataPoints[0].timestamp,
                endDate: dataPoints[dataPoints.length - 1].timestamp,
                confidence: trend.confidence,
                dataPoints
            }];
    }
    extractMetricDataPoints(executions, metric) {
        return executions.map(exec => {
            let value = 0;
            switch (metric) {
                case 'coverage':
                    value = exec.coverage?.overall || 0;
                    break;
                case 'success_rate':
                    value = exec.status === 'pass' ? 1 : 0;
                    break;
                case 'execution_time':
                    value = exec.duration || 0;
                    break;
                case 'flakiness':
                    // This would need more sophisticated calculation
                    value = exec.status === 'fail' ? 1 : 0;
                    break;
            }
            return {
                timestamp: exec.timestamp,
                value,
                metadata: { executionId: exec.executionId }
            };
        });
    }
    analyzeTrendInDataPoints(dataPoints) {
        if (dataPoints.length < 3)
            return null;
        // Simple linear regression
        const n = dataPoints.length;
        const x = dataPoints.map((_, i) => i);
        const y = dataPoints.map(dp => dp.value);
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const confidence = Math.min(Math.abs(slope) * 10, 1); // Simplified confidence
        let direction = 'stable';
        if (Math.abs(slope) > 0.01) {
            direction = slope > 0 ? 'increasing' : 'decreasing';
        }
        return {
            direction,
            magnitude: Math.abs(slope),
            confidence
        };
    }
    analyzePerformanceEvolution(executions) {
        const durations = executions
            .filter(exec => exec.duration)
            .map(exec => exec.duration);
        if (durations.length === 0) {
            return {
                currentPerformance: 0,
                baselinePerformance: 0,
                performanceTrend: 'stable',
                regressions: [],
                improvements: [],
                volatility: 0
            };
        }
        const currentPerformance = durations[durations.length - 1];
        const baselinePerformance = durations.slice(0, Math.min(10, durations.length))
            .reduce((sum, d) => sum + d, 0) / Math.min(10, durations.length);
        const performanceTrend = this.determineTrend(durations);
        const regressions = this.findPerformanceRegressions(executions, 10);
        const improvements = this.findPerformanceImprovements(executions);
        const volatility = this.calculateStandardDeviation(durations);
        return {
            currentPerformance,
            baselinePerformance,
            performanceTrend,
            regressions,
            improvements,
            volatility
        };
    }
    async analyzeFlakinessEvolution(executions) {
        const currentFlakinessScore = this.calculateCurrentFlakinessScore(executions);
        const flakinessPattern = this.detectFlakinessPattern(executions);
        const flakyPeriods = this.identifyFlakyPeriods(executions);
        const stabilizationEvents = this.findStabilizationEvents(executions);
        const rootCauseAnalysis = this.analyzeRootCauses(executions);
        return {
            currentFlakinessScore,
            flakinessPattern,
            flakyPeriods,
            stabilizationEvents,
            rootCauseAnalysis
        };
    }
    calculateHealthScore(executions, coverageEvolution, performanceEvolution, flakinessEvolution) {
        const coverage = coverageEvolution.currentCoverage;
        const performance = performanceEvolution.currentPerformance > 0 ?
            Math.max(0, 1 - (performanceEvolution.currentPerformance / performanceEvolution.baselinePerformance - 1)) : 1;
        const stability = 1 - flakinessEvolution.currentFlakinessScore;
        const overall = (coverage * 0.4 + performance * 0.3 + stability * 0.3);
        const trend = this.determineOverallTrend(coverageEvolution, performanceEvolution, flakinessEvolution);
        return { overall, coverage, performance, stability, trend };
    }
    determineOverallTrend(coverageEvolution, performanceEvolution, flakinessEvolution) {
        const trends = [coverageEvolution.coverageTrend, performanceEvolution.performanceTrend];
        const increasing = trends.filter(t => t === 'increasing').length;
        const decreasing = trends.filter(t => t === 'decreasing').length;
        if (increasing > decreasing)
            return 'increasing';
        if (decreasing > increasing)
            return 'decreasing';
        return 'stable';
    }
    // Additional helper methods...
    determineTrend(values) {
        if (values.length < 3)
            return 'stable';
        const first = values.slice(0, Math.floor(values.length / 3)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length / 3);
        const last = values.slice(-Math.floor(values.length / 3)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length / 3);
        const change = (last - first) / first;
        if (Math.abs(change) < 0.05)
            return 'stable';
        return change > 0 ? 'increasing' : 'decreasing';
    }
    calculateStandardDeviation(values) {
        if (values.length < 2)
            return 0;
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    detectCoverageChanges(executions) {
        const changes = [];
        for (let i = 1; i < executions.length; i++) {
            const current = executions[i];
            const previous = executions[i - 1];
            if (!current.coverage || !previous.coverage)
                continue;
            const changePercent = (current.coverage.overall - previous.coverage.overall) / previous.coverage.overall;
            if (Math.abs(changePercent) > this.config.coverageChangeThreshold) {
                changes.push({
                    timestamp: current.timestamp,
                    previousCoverage: previous.coverage.overall,
                    newCoverage: current.coverage.overall,
                    changePercent,
                    significance: Math.abs(changePercent) > 0.2 ? 'major' :
                        Math.abs(changePercent) > 0.1 ? 'moderate' : 'minor'
                });
            }
        }
        return changes;
    }
    findPerformanceRegressions(executions, baselineWindow) {
        const regressions = [];
        for (let i = baselineWindow; i < executions.length; i++) {
            const current = executions[i];
            if (!current.duration)
                continue;
            const baseline = executions.slice(Math.max(0, i - baselineWindow), i)
                .filter(exec => exec.duration)
                .map(exec => exec.duration);
            if (baseline.length === 0)
                continue;
            const avgBaseline = baseline.reduce((sum, d) => sum + d, 0) / baseline.length;
            const regressionFactor = current.duration / avgBaseline;
            if (regressionFactor > this.config.performanceRegressionThreshold) {
                regressions.push({
                    timestamp: current.timestamp,
                    previousDuration: avgBaseline,
                    newDuration: current.duration,
                    regressionFactor,
                    severity: regressionFactor > 3 ? 'severe' :
                        regressionFactor > 2 ? 'moderate' : 'minor',
                    confidence: Math.min(regressionFactor / 2, 1)
                });
            }
        }
        return regressions;
    }
    findPerformanceImprovements(executions) {
        // Similar logic to regressions but looking for improvements
        return [];
    }
    calculateCurrentFlakinessScore(executions) {
        if (executions.length < 10)
            return 0;
        const recent = executions.slice(-20);
        const failures = recent.filter(exec => exec.status === 'fail').length;
        return failures / recent.length;
    }
    detectFlakinessPattern(executions) {
        // Simplified pattern detection
        const failures = executions.filter(exec => exec.status === 'fail');
        const failureRate = failures.length / executions.length;
        if (failureRate < 0.1) {
            return {
                type: 'random',
                confidence: 0.8,
                description: 'Low failure rate with random occurrences'
            };
        }
        return {
            type: 'random',
            confidence: 0.5,
            description: 'Pattern analysis needs more data'
        };
    }
    identifyFlakyPeriods(executions) {
        // Implementation for identifying periods of high flakiness
        return [];
    }
    findStabilizationEvents(executions) {
        // Implementation for finding stabilization events
        return [];
    }
    analyzeRootCauses(executions) {
        // Implementation for root cause analysis
        return [];
    }
    filterSignificantEvents(events) {
        return events.filter(event => event.type === 'coverage_increased' ||
            event.type === 'coverage_decreased' ||
            event.type === 'performance_regression' ||
            event.type === 'flakiness_detected');
    }
    findSimilarities(executions1, executions2) {
        // Implementation for finding similarities between test executions
        return [];
    }
    findDifferences(executions1, executions2) {
        // Implementation for finding differences between test executions
        return [];
    }
    generateEvolutionRecommendations(healthScore, coverageEvolution, performanceEvolution, flakinessEvolution) {
        const recommendations = [];
        if (healthScore.coverage < 0.7) {
            recommendations.push({
                category: 'coverage',
                priority: 'high',
                description: 'Test coverage is below recommended threshold',
                actionItems: ['Add more test cases', 'Review uncovered code paths'],
                estimatedEffort: 'medium'
            });
        }
        if (healthScore.stability < 0.8) {
            recommendations.push({
                category: 'stability',
                priority: 'high',
                description: 'Test shows signs of flakiness',
                actionItems: ['Investigate root causes', 'Add proper wait conditions', 'Review test data setup'],
                estimatedEffort: 'high'
            });
        }
        return recommendations;
    }
    generateComparisonRecommendations(similarities, differences) {
        // Implementation for generating comparison recommendations
        return [];
    }
}
//# sourceMappingURL=TestEvolution.js.map