/**
 * @file TestMetrics.ts
 * @description Temporal metrics and trends service for test analysis
 *
 * Provides comprehensive metrics calculation, trend analysis, and statistical
 * operations for test temporal data including time-series analysis and predictions.
 */
/**
 * Temporal metrics and trends service
 */
export class TestMetrics {
    constructor(config) {
        this.config = config;
        this.thresholds = new Map();
        this.baselines = new Map();
        this.initializeDefaultThresholds();
    }
    /**
     * Calculate execution metrics for a test
     */
    async calculateExecutionMetrics(testId, entityId, executions) {
        const totalExecutions = executions.length;
        const passedExecutions = executions.filter(exec => exec.status === 'pass').length;
        const failedExecutions = executions.filter(exec => exec.status === 'fail').length;
        const skippedExecutions = executions.filter(exec => exec.status === 'skip').length;
        const successRate = totalExecutions > 0 ? passedExecutions / totalExecutions : 0;
        // Calculate average duration
        const durations = executions.filter(exec => exec.duration).map(exec => exec.duration);
        const averageDuration = durations.length > 0 ?
            durations.reduce((sum, d) => sum + d, 0) / durations.length : undefined;
        // Calculate flakiness score
        const flakinessScore = this.calculateFlakinessScore(executions);
        // Find timestamps
        const lastExecutionAt = executions.length > 0 ?
            executions[executions.length - 1].timestamp : undefined;
        const lastPassedAt = executions.reverse().find(exec => exec.status === 'pass')?.timestamp;
        const lastFailedAt = executions.reverse().find(exec => exec.status === 'fail')?.timestamp;
        return {
            totalExecutions,
            passedExecutions,
            failedExecutions,
            skippedExecutions,
            successRate,
            averageDuration,
            flakinessScore,
            lastExecutionAt,
            lastPassedAt,
            lastFailedAt
        };
    }
    /**
     * Calculate trend for a specific metric
     */
    async calculateTrend(testId, entityId, metric, period, executions) {
        const dataPoints = this.extractMetricValues(executions, metric);
        if (dataPoints.length < 3)
            return null;
        const trendAnalysis = this.performTrendAnalysis(dataPoints);
        if (!trendAnalysis)
            return null;
        return {
            trendId: `trend_${testId}_${entityId}_${metric}_${Date.now()}`,
            testId,
            entityId,
            metric,
            period,
            direction: trendAnalysis.direction,
            magnitude: trendAnalysis.magnitude,
            startDate: dataPoints[0].timestamp,
            endDate: dataPoints[dataPoints.length - 1].timestamp,
            confidence: trendAnalysis.confidence,
            dataPoints
        };
    }
    /**
     * Calculate multiple trends at once
     */
    async calculateAllTrends(testId, entityId, period, executions) {
        const metrics = ['coverage', 'success_rate', 'execution_time', 'flakiness'];
        const trends = [];
        for (const metric of metrics) {
            const trend = await this.calculateTrend(testId, entityId, metric, period, executions);
            if (trend) {
                trends.push(trend);
            }
        }
        return trends;
    }
    /**
     * Get time-series data for a metric
     */
    async getTimeSeriesData(executions, metric, aggregationPeriod) {
        const dataPoints = this.extractMetricValues(executions, metric);
        const aggregatedPoints = this.aggregateDataPoints(dataPoints, aggregationPeriod);
        const statistics = this.calculateTimeSeriesStatistics(aggregatedPoints);
        return {
            metric,
            aggregationPeriod,
            dataPoints: aggregatedPoints,
            statistics
        };
    }
    /**
     * Calculate statistical summary for a metric
     */
    async calculateStatistics(executions, metric) {
        const values = this.extractMetricValues(executions, metric).map(dp => dp.value);
        if (values.length === 0) {
            return this.getEmptyStatistics(metric);
        }
        const sortedValues = [...values].sort((a, b) => a - b);
        const count = values.length;
        const min = sortedValues[0];
        const max = sortedValues[count - 1];
        const mean = values.reduce((sum, v) => sum + v, 0) / count;
        const median = this.calculateMedian(sortedValues);
        const mode = this.calculateMode(values);
        const variance = this.calculateVariance(values, mean);
        const standardDeviation = Math.sqrt(variance);
        const skewness = this.calculateSkewness(values, mean, standardDeviation);
        const kurtosis = this.calculateKurtosis(values, mean, standardDeviation);
        const percentiles = {
            p25: this.calculatePercentile(sortedValues, 25),
            p50: median,
            p75: this.calculatePercentile(sortedValues, 75),
            p90: this.calculatePercentile(sortedValues, 90),
            p95: this.calculatePercentile(sortedValues, 95),
            p99: this.calculatePercentile(sortedValues, 99)
        };
        return {
            metric,
            count,
            min,
            max,
            mean,
            median,
            mode,
            standardDeviation,
            variance,
            skewness,
            kurtosis,
            percentiles
        };
    }
    /**
     * Predict future trend
     */
    async predictTrend(trend, periodsAhead) {
        const methodology = this.selectPredictionMethodology(trend);
        const predictions = this.generatePredictions(trend, periodsAhead, methodology);
        const confidence = this.calculatePredictionConfidence(trend, methodology);
        const accuracy = this.validatePredictionAccuracy(trend, methodology);
        return {
            trendId: trend.trendId,
            metric: trend.metric,
            predictions,
            confidence,
            methodology,
            accuracy
        };
    }
    /**
     * Calculate correlation between metrics
     */
    async calculateCorrelation(executions, metric1, metric2) {
        const values1 = this.extractMetricValues(executions, metric1).map(dp => dp.value);
        const values2 = this.extractMetricValues(executions, metric2).map(dp => dp.value);
        const minLength = Math.min(values1.length, values2.length);
        const x = values1.slice(0, minLength);
        const y = values2.slice(0, minLength);
        const correlationCoefficient = this.calculatePearsonCorrelation(x, y);
        const strength = this.interpretCorrelationStrength(Math.abs(correlationCoefficient));
        const direction = correlationCoefficient > 0 ? 'positive' :
            correlationCoefficient < 0 ? 'negative' : 'none';
        const significance = this.calculateCorrelationSignificance(correlationCoefficient, minLength);
        return {
            metric1,
            metric2,
            correlationCoefficient,
            strength,
            direction,
            significance,
            dataPoints: minLength
        };
    }
    /**
     * Detect anomalies in metrics
     */
    async detectAnomalies(executions, metric, sensitivity = 2.0) {
        const dataPoints = this.extractMetricValues(executions, metric);
        const method = 'zscore'; // Using Z-score method for simplicity
        const anomalies = this.detectZScoreAnomalies(dataPoints, sensitivity);
        return {
            metric,
            anomalies,
            method,
            threshold: sensitivity,
            sensitivity
        };
    }
    // Private helper methods
    initializeDefaultThresholds() {
        this.thresholds.set('coverage', {
            metric: 'coverage',
            warningThreshold: 0.7,
            criticalThreshold: 0.5,
            direction: 'below'
        });
        this.thresholds.set('success_rate', {
            metric: 'success_rate',
            warningThreshold: 0.95,
            criticalThreshold: 0.9,
            direction: 'below'
        });
        this.thresholds.set('execution_time', {
            metric: 'execution_time',
            warningThreshold: 1.5,
            criticalThreshold: 2.0,
            direction: 'change'
        });
        this.thresholds.set('flakiness', {
            metric: 'flakiness',
            warningThreshold: 0.1,
            criticalThreshold: 0.2,
            direction: 'above'
        });
    }
    calculateFlakinessScore(executions) {
        if (executions.length < 10)
            return 0;
        const recentExecutions = executions.slice(-20);
        const failures = recentExecutions.filter(exec => exec.status === 'fail').length;
        return failures / recentExecutions.length;
    }
    extractMetricValues(executions, metric) {
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
                    value = exec.status === 'fail' ? 1 : 0;
                    break;
                case 'failure_rate':
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
    performTrendAnalysis(dataPoints) {
        if (dataPoints.length < 3)
            return null;
        // Linear regression to find trend
        const n = dataPoints.length;
        const x = dataPoints.map((_, i) => i);
        const y = dataPoints.map(dp => dp.value);
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        // Calculate R-squared for confidence
        const predictions = x.map(xi => slope * xi + intercept);
        const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - sumY / n, 2), 0);
        const residualSumSquares = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        let direction = 'stable';
        if (Math.abs(slope) > 0.001) {
            direction = slope > 0 ? 'increasing' : 'decreasing';
        }
        return {
            direction,
            magnitude: Math.abs(slope),
            confidence: Math.max(0, Math.min(1, rSquared))
        };
    }
    aggregateDataPoints(dataPoints, period) {
        const groups = this.groupDataPointsByPeriod(dataPoints, period);
        const aggregated = [];
        for (const [timestamp, points] of groups.entries()) {
            const values = points.map(p => p.value);
            const count = values.length;
            const sum = values.reduce((s, v) => s + v, 0);
            const mean = sum / count;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = this.calculateVariance(values, mean);
            aggregated.push({
                timestamp: new Date(timestamp),
                value: mean,
                count,
                min,
                max,
                variance
            });
        }
        return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    groupDataPointsByPeriod(dataPoints, period) {
        const groups = new Map();
        for (const point of dataPoints) {
            const key = this.getPeriodKey(point.timestamp, period);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(point);
        }
        return groups;
    }
    getPeriodKey(date, period) {
        const d = new Date(date);
        switch (period) {
            case 'hour':
                return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
            case 'day':
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            case 'week':
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
            case 'month':
                return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        }
    }
    calculateTimeSeriesStatistics(dataPoints) {
        const values = dataPoints.map(dp => dp.value);
        if (values.length === 0) {
            return { min: 0, max: 0, mean: 0, median: 0, standardDeviation: 0 };
        }
        const sortedValues = [...values].sort((a, b) => a - b);
        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const median = this.calculateMedian(sortedValues);
        const standardDeviation = Math.sqrt(this.calculateVariance(values, mean));
        return { min, max, mean, median, standardDeviation };
    }
    calculateMedian(sortedValues) {
        const n = sortedValues.length;
        if (n % 2 === 0) {
            return (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2;
        }
        return sortedValues[Math.floor(n / 2)];
    }
    calculateMode(values) {
        const frequency = new Map();
        for (const value of values) {
            frequency.set(value, (frequency.get(value) || 0) + 1);
        }
        let mode;
        let maxFreq = 0;
        for (const [value, freq] of frequency.entries()) {
            if (freq > maxFreq) {
                maxFreq = freq;
                mode = value;
            }
        }
        return maxFreq > 1 ? mode : undefined;
    }
    calculateVariance(values, mean) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    }
    calculateSkewness(values, mean, stdDev) {
        if (values.length === 0 || stdDev === 0)
            return 0;
        const n = values.length;
        const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }
    calculateKurtosis(values, mean, stdDev) {
        if (values.length === 0 || stdDev === 0)
            return 0;
        const n = values.length;
        const sum = values.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }
    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    getEmptyStatistics(metric) {
        return {
            metric,
            count: 0,
            min: 0,
            max: 0,
            mean: 0,
            median: 0,
            standardDeviation: 0,
            variance: 0,
            skewness: 0,
            kurtosis: 0,
            percentiles: {
                p25: 0,
                p50: 0,
                p75: 0,
                p90: 0,
                p95: 0,
                p99: 0
            }
        };
    }
    selectPredictionMethodology(trend) {
        // Simple methodology selection based on trend characteristics
        if (trend.confidence > 0.8 && trend.direction !== 'stable') {
            return 'linear';
        }
        return 'moving_average';
    }
    generatePredictions(trend, periodsAhead, methodology) {
        const predictions = [];
        const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
        const periodMs = this.getPeriodMilliseconds(trend.period);
        for (let i = 1; i <= periodsAhead; i++) {
            const timestamp = new Date(lastPoint.timestamp.getTime() + i * periodMs);
            let predictedValue = lastPoint.value;
            if (methodology === 'linear') {
                predictedValue = this.linearPredict(trend, i);
            }
            else if (methodology === 'moving_average') {
                predictedValue = this.movingAveragePredict(trend);
            }
            const confidenceInterval = this.calculateConfidenceInterval(trend, predictedValue);
            predictions.push({
                timestamp,
                predictedValue,
                confidenceInterval
            });
        }
        return predictions;
    }
    getPeriodMilliseconds(period) {
        switch (period) {
            case 'daily': return 24 * 60 * 60 * 1000;
            case 'weekly': return 7 * 24 * 60 * 60 * 1000;
            case 'monthly': return 30 * 24 * 60 * 60 * 1000;
            case 'quarterly': return 90 * 24 * 60 * 60 * 1000;
        }
    }
    linearPredict(trend, periodsAhead) {
        // Simple linear prediction based on trend magnitude and direction
        const lastValue = trend.dataPoints[trend.dataPoints.length - 1].value;
        const change = trend.magnitude * periodsAhead;
        if (trend.direction === 'increasing') {
            return lastValue + change;
        }
        else if (trend.direction === 'decreasing') {
            return Math.max(0, lastValue - change);
        }
        return lastValue;
    }
    movingAveragePredict(trend) {
        const recentPoints = trend.dataPoints.slice(-5);
        return recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
    }
    calculateConfidenceInterval(trend, predictedValue) {
        const variance = this.calculatePredictionVariance(trend);
        const margin = 1.96 * Math.sqrt(variance); // 95% confidence interval
        return {
            lower: Math.max(0, predictedValue - margin),
            upper: predictedValue + margin
        };
    }
    calculatePredictionVariance(trend) {
        const values = trend.dataPoints.map(p => p.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        return this.calculateVariance(values, mean);
    }
    calculatePredictionConfidence(trend, methodology) {
        // Simplified confidence calculation
        const baseConfidence = trend.confidence;
        const methodologyBonus = methodology === 'linear' ? 0.1 : 0;
        return Math.min(1, baseConfidence + methodologyBonus);
    }
    validatePredictionAccuracy(trend, methodology) {
        // Simplified accuracy validation
        return trend.confidence * 0.8; // Placeholder
    }
    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        if (n === 0)
            return 0;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    interpretCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs < 0.2)
            return 'very_weak';
        if (abs < 0.4)
            return 'weak';
        if (abs < 0.6)
            return 'moderate';
        if (abs < 0.8)
            return 'strong';
        return 'very_strong';
    }
    calculateCorrelationSignificance(correlation, n) {
        // Simplified p-value calculation for correlation
        const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
        // This is a simplified approximation
        return Math.max(0, 1 - Math.abs(t) / 10);
    }
    detectZScoreAnomalies(dataPoints, threshold) {
        const values = dataPoints.map(dp => dp.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const stdDev = Math.sqrt(this.calculateVariance(values, mean));
        const anomalies = [];
        for (const point of dataPoints) {
            const zScore = Math.abs(point.value - mean) / stdDev;
            if (zScore > threshold) {
                anomalies.push({
                    timestamp: point.timestamp,
                    value: point.value,
                    expectedValue: mean,
                    deviationScore: zScore,
                    severity: zScore > threshold * 2 ? 'severe' :
                        zScore > threshold * 1.5 ? 'moderate' : 'mild',
                    description: `Value ${point.value.toFixed(3)} deviates ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(3)}`
                });
            }
        }
        return anomalies;
    }
}
//# sourceMappingURL=TestMetrics.js.map