/**
 * @file TestMetrics.test.ts
 * @description Unit tests for TestMetrics service
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TestMetrics } from '../TestMetrics.js';
describe('TestMetrics', () => {
    let metrics;
    let mockConfig;
    beforeEach(() => {
        mockConfig = {
            maxTrendDataPoints: 100,
            flakinessThreshold: 0.1,
            coverageChangeThreshold: 0.05,
            performanceRegressionThreshold: 1.5,
            obsolescenceDetectionEnabled: true,
            trendAnalysisPeriod: 'weekly',
            batchSize: 50
        };
        metrics = new TestMetrics(mockConfig);
    });
    describe('calculateExecutionMetrics', () => {
        it('should calculate basic execution metrics', async () => {
            const executions = [
                {
                    executionId: 'exec_1',
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - 3000),
                    status: 'pass',
                    duration: 100,
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                },
                {
                    executionId: 'exec_2',
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - 2000),
                    status: 'fail',
                    duration: 150,
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                },
                {
                    executionId: 'exec_3',
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - 1000),
                    status: 'pass',
                    duration: 120,
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                }
            ];
            const result = await metrics.calculateExecutionMetrics('test_1', 'entity_1', executions);
            expect(result.totalExecutions).toBe(3);
            expect(result.passedExecutions).toBe(2);
            expect(result.failedExecutions).toBe(1);
            expect(result.skippedExecutions).toBe(0);
            expect(result.successRate).toBeCloseTo(2 / 3);
            expect(result.averageDuration).toBeCloseTo(123.33, 1);
            expect(result.flakinessScore).toBeGreaterThan(0);
        });
        it('should handle empty executions', async () => {
            const result = await metrics.calculateExecutionMetrics('test_1', 'entity_1', []);
            expect(result.totalExecutions).toBe(0);
            expect(result.passedExecutions).toBe(0);
            expect(result.failedExecutions).toBe(0);
            expect(result.successRate).toBe(0);
            expect(result.averageDuration).toBeUndefined();
            expect(result.flakinessScore).toBe(0);
        });
        it('should calculate flakiness score correctly', async () => {
            // Create 20 executions with mixed results
            const executions = [];
            for (let i = 0; i < 20; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - i * 1000),
                    status: i % 4 === 0 ? 'fail' : 'pass', // 25% failure rate
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            const result = await metrics.calculateExecutionMetrics('test_1', 'entity_1', executions);
            expect(result.flakinessScore).toBeCloseTo(0.25, 1);
        });
    });
    describe('calculateTrend', () => {
        it('should calculate coverage trend', async () => {
            const executions = [];
            for (let i = 0; i < 10; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000), // Daily executions
                    status: 'pass',
                    coverage: {
                        overall: 0.5 + (i * 0.05) // Increasing coverage from 0.5 to 0.95
                    },
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            const trend = await metrics.calculateTrend('test_1', 'entity_1', 'coverage', 'weekly', executions);
            expect(trend).toBeDefined();
            expect(trend.metric).toBe('coverage');
            expect(trend.direction).toBe('increasing');
            expect(trend.magnitude).toBeGreaterThan(0);
            expect(trend.confidence).toBeGreaterThan(0.5);
        });
        it('should return null for insufficient data', async () => {
            const executions = [
                {
                    executionId: 'exec_1',
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(),
                    status: 'pass',
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                }
            ];
            const trend = await metrics.calculateTrend('test_1', 'entity_1', 'coverage', 'weekly', executions);
            expect(trend).toBeNull();
        });
        it('should detect stable trend', async () => {
            const executions = [];
            for (let i = 0; i < 10; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
                    status: 'pass',
                    duration: 100, // Stable duration
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            const trend = await metrics.calculateTrend('test_1', 'entity_1', 'execution_time', 'weekly', executions);
            expect(trend).toBeDefined();
            expect(trend.direction).toBe('stable');
        });
    });
    describe('getTimeSeriesData', () => {
        it('should aggregate data by day', async () => {
            const executions = [];
            const baseDate = new Date('2024-01-01');
            // Create executions across multiple days
            for (let day = 0; day < 5; day++) {
                for (let exec = 0; exec < 3; exec++) {
                    executions.push({
                        executionId: `exec_${day}_${exec}`,
                        testId: 'test_1',
                        entityId: 'entity_1',
                        suiteId: 'suite_1',
                        timestamp: new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000 + exec * 60 * 60 * 1000),
                        status: 'pass',
                        duration: 100 + day * 10, // Increasing duration
                        metadata: {
                            testType: 'unit',
                            suiteId: 'suite_1',
                            confidence: 0.9
                        }
                    });
                }
            }
            const timeSeries = await metrics.getTimeSeriesData(executions, 'execution_time', 'day');
            expect(timeSeries.metric).toBe('execution_time');
            expect(timeSeries.aggregationPeriod).toBe('day');
            expect(timeSeries.dataPoints).toHaveLength(5); // 5 days
            expect(timeSeries.statistics).toBeDefined();
            expect(timeSeries.statistics.mean).toBeGreaterThan(0);
        });
    });
    describe('calculateStatistics', () => {
        it('should calculate comprehensive statistics', async () => {
            const executions = [];
            for (let i = 0; i < 100; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - i * 1000),
                    status: 'pass',
                    duration: 50 + Math.random() * 100, // Random duration between 50-150
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            const stats = await metrics.calculateStatistics(executions, 'execution_time');
            expect(stats.metric).toBe('execution_time');
            expect(stats.count).toBe(100);
            expect(stats.min).toBeGreaterThanOrEqual(50);
            expect(stats.max).toBeLessThanOrEqual(150);
            expect(stats.mean).toBeGreaterThan(50);
            expect(stats.mean).toBeLessThan(150);
            expect(stats.median).toBeGreaterThan(0);
            expect(stats.standardDeviation).toBeGreaterThan(0);
            expect(stats.percentiles.p50).toBe(stats.median);
            expect(stats.percentiles.p25).toBeLessThan(stats.percentiles.p75);
        });
        it('should handle empty data', async () => {
            const stats = await metrics.calculateStatistics([], 'coverage');
            expect(stats.metric).toBe('coverage');
            expect(stats.count).toBe(0);
            expect(stats.min).toBe(0);
            expect(stats.max).toBe(0);
            expect(stats.mean).toBe(0);
            expect(stats.standardDeviation).toBe(0);
        });
    });
    describe('calculateCorrelation', () => {
        it('should calculate correlation between metrics', async () => {
            const executions = [];
            for (let i = 0; i < 20; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - i * 1000),
                    status: 'pass',
                    duration: 100 + i * 5, // Increasing duration
                    coverage: {
                        overall: 0.5 + i * 0.02 // Increasing coverage
                    },
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            const correlation = await metrics.calculateCorrelation(executions, 'execution_time', 'coverage');
            expect(correlation.metric1).toBe('execution_time');
            expect(correlation.metric2).toBe('coverage');
            expect(correlation.correlationCoefficient).toBeGreaterThan(0.5); // Should be positive correlation
            expect(correlation.direction).toBe('positive');
            expect(correlation.strength).toMatch(/weak|moderate|strong|very_strong/);
        });
    });
    describe('detectAnomalies', () => {
        it('should detect anomalies using Z-score method', async () => {
            const executions = [];
            // Create mostly normal durations
            for (let i = 0; i < 18; i++) {
                executions.push({
                    executionId: `exec_${i}`,
                    testId: 'test_1',
                    entityId: 'entity_1',
                    suiteId: 'suite_1',
                    timestamp: new Date(Date.now() - i * 1000),
                    status: 'pass',
                    duration: 100 + Math.random() * 10, // Normal range: 100-110
                    metadata: {
                        testType: 'unit',
                        suiteId: 'suite_1',
                        confidence: 0.9
                    }
                });
            }
            // Add outliers
            executions.push({
                executionId: 'exec_outlier1',
                testId: 'test_1',
                entityId: 'entity_1',
                suiteId: 'suite_1',
                timestamp: new Date(),
                status: 'pass',
                duration: 500, // Outlier
                metadata: {
                    testType: 'unit',
                    suiteId: 'suite_1',
                    confidence: 0.9
                }
            });
            executions.push({
                executionId: 'exec_outlier2',
                testId: 'test_1',
                entityId: 'entity_1',
                suiteId: 'suite_1',
                timestamp: new Date(),
                status: 'pass',
                duration: 10, // Outlier
                metadata: {
                    testType: 'unit',
                    suiteId: 'suite_1',
                    confidence: 0.9
                }
            });
            const anomalyDetection = await metrics.detectAnomalies(executions, 'execution_time', 2.0);
            expect(anomalyDetection.metric).toBe('execution_time');
            expect(anomalyDetection.method).toBe('zscore');
            expect(anomalyDetection.anomalies.length).toBeGreaterThan(0);
            const severities = anomalyDetection.anomalies.map(a => a.severity);
            expect(severities).toContain('mild');
        });
    });
    describe('predictTrend', () => {
        it('should predict future trend values', async () => {
            const trend = {
                trendId: 'trend_1',
                testId: 'test_1',
                entityId: 'entity_1',
                metric: 'coverage',
                period: 'weekly',
                direction: 'increasing',
                magnitude: 0.05,
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                confidence: 0.8,
                dataPoints: [
                    { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), value: 0.7 },
                    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), value: 0.75 },
                    { timestamp: new Date(), value: 0.8 }
                ]
            };
            const prediction = await metrics.predictTrend(trend, 3);
            expect(prediction.trendId).toBe('trend_1');
            expect(prediction.metric).toBe('coverage');
            expect(prediction.predictions).toHaveLength(3);
            expect(prediction.confidence).toBeGreaterThan(0);
            expect(prediction.methodology).toMatch(/linear|polynomial|exponential|moving_average/);
            for (const pred of prediction.predictions) {
                expect(pred.timestamp).toBeDefined();
                expect(pred.predictedValue).toBeGreaterThan(0);
                expect(pred.confidenceInterval.lower).toBeLessThanOrEqual(pred.predictedValue);
                expect(pred.confidenceInterval.upper).toBeGreaterThanOrEqual(pred.predictedValue);
            }
        });
    });
});
//# sourceMappingURL=TestMetrics.test.js.map