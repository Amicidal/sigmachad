/**
 * TestEngine Service
 * Comprehensive test management, analysis, and integration service
 * Implements Phase 5.2 requirements for test integration
 */
import { TestResultParser } from './TestResultParser.js';
import { RelationshipType } from '../models/relationships.js';
import * as fs from 'fs/promises';
export class TestEngine {
    kgService;
    dbService;
    parser;
    constructor(kgService, dbService) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.parser = new TestResultParser();
    }
    /**
     * Parse test results from a file and record them
     */
    async parseAndRecordTestResults(filePath, format) {
        const suiteResult = await this.parser.parseFile(filePath, format);
        await this.recordTestResults(suiteResult);
    }
    /**
     * Parse and store test execution results from various formats
     */
    async recordTestResults(suiteResult) {
        try {
            // Store the test suite result
            await this.dbService.storeTestSuiteResult(suiteResult);
            // Process individual test results
            for (const result of suiteResult.results) {
                await this.processTestResult(result, suiteResult.timestamp);
            }
            // Update test entities in knowledge graph
            await this.updateTestEntities(suiteResult);
            // Perform flaky test analysis
            await this.analyzeFlakyTests(suiteResult.results);
        }
        catch (error) {
            console.error('Failed to record test results:', error);
            throw new Error(`Test result recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Process individual test result and update knowledge graph
     */
    async processTestResult(result, timestamp) {
        // Find or create test entity
        let testEntity = await this.findTestEntity(result.testId);
        if (!testEntity) {
            testEntity = await this.createTestEntity(result);
        }
        // Create test execution record
        const execution = {
            id: `${result.testId}_${timestamp.getTime()}`,
            timestamp,
            status: result.status,
            duration: result.duration,
            errorMessage: result.errorMessage,
            stackTrace: result.stackTrace,
            coverage: result.coverage,
            performance: result.performance,
            environment: {
                framework: result.testSuite,
                timestamp: timestamp.toISOString()
            }
        };
        // Add execution to test history
        testEntity.executionHistory.push(execution);
        testEntity.lastRunAt = timestamp;
        testEntity.lastDuration = result.duration;
        testEntity.status = this.mapStatus(result.status);
        // Update performance metrics
        await this.updatePerformanceMetrics(testEntity);
        // Update coverage if provided
        if (result.coverage) {
            testEntity.coverage = result.coverage;
            await this.updateCoverageRelationships(testEntity);
        }
        // Save updated test entity
        await this.kgService.createOrUpdateEntity(testEntity);
    }
    /**
     * Create new test entity from test result
     */
    async createTestEntity(result) {
        // Determine test type from suite name or file path
        const testType = this.inferTestType(result.testSuite, result.testName);
        // Find target symbol this test is testing
        const targetSymbol = await this.findTargetSymbol(result.testName, result.testSuite);
        const testEntity = {
            id: result.testId,
            path: result.testSuite,
            hash: this.generateHash(result.testId),
            language: 'typescript', // Default, could be inferred
            lastModified: new Date(),
            created: new Date(),
            type: 'test',
            testType,
            targetSymbol,
            framework: this.inferFramework(result.testSuite),
            coverage: result.coverage || { lines: 0, branches: 0, functions: 0, statements: 0 },
            status: this.mapStatus(result.status),
            flakyScore: 0,
            executionHistory: [],
            performanceMetrics: {
                averageExecutionTime: 0,
                p95ExecutionTime: 0,
                successRate: 0,
                trend: 'stable',
                benchmarkComparisons: [],
                historicalData: []
            },
            dependencies: [],
            tags: this.extractTags(result.testName)
        };
        return testEntity;
    }
    /**
     * Analyze test results for flaky behavior
     */
    async analyzeFlakyTests(results) {
        const analyses = [];
        // Group results by test
        const testGroups = new Map();
        for (const result of results) {
            if (!testGroups.has(result.testId)) {
                testGroups.set(result.testId, []);
            }
            testGroups.get(result.testId).push(result);
        }
        for (const [testId, testResults] of testGroups) {
            const analysis = await this.analyzeSingleTestFlakiness(testId, testResults);
            if (analysis.flakyScore > 0.3) { // Only include potentially flaky tests
                analyses.push(analysis);
            }
        }
        // Store flaky test analyses
        await this.storeFlakyTestAnalyses(analyses);
        return analyses;
    }
    /**
     * Analyze flakiness for a single test
     */
    async analyzeSingleTestFlakiness(testId, results) {
        const totalRuns = results.length;
        const failures = results.filter(r => r.status === 'failed').length;
        const failureRate = failures / totalRuns;
        const successRate = 1 - failureRate;
        // Calculate flaky score based on multiple factors
        let flakyScore = 0;
        // High failure rate in recent runs
        const recentRuns = results.slice(-10);
        const recentFailures = recentRuns.filter(r => r.status === 'failed').length;
        const recentFailureRate = recentFailures / recentRuns.length;
        flakyScore += recentFailureRate * 0.4;
        // Inconsistent results (alternating pass/fail)
        const alternatingPattern = this.detectAlternatingPattern(results);
        flakyScore += alternatingPattern * 0.3;
        // Duration variability (longer tests tend to be more flaky)
        const durationVariability = this.calculateDurationVariability(results);
        flakyScore += Math.min(durationVariability / 1000, 1) * 0.3; // Cap at 1
        const patterns = this.identifyFailurePatterns(results);
        return {
            testId,
            testName: results[0]?.testName || testId,
            flakyScore: Math.min(flakyScore, 1),
            totalRuns,
            failureRate,
            successRate,
            recentFailures,
            patterns,
            recommendations: this.generateFlakyTestRecommendations(flakyScore, patterns)
        };
    }
    /**
     * Get performance metrics for a test entity
     */
    async getPerformanceMetrics(entityId) {
        const testEntity = await this.kgService.getEntity(entityId);
        if (!testEntity) {
            throw new Error(`Test entity ${entityId} not found`);
        }
        return testEntity.performanceMetrics;
    }
    /**
     * Get coverage analysis for an entity
     */
    async getCoverageAnalysis(entityId) {
        const testEntity = await this.kgService.getEntity(entityId);
        if (!testEntity) {
            throw new Error(`Test entity ${entityId} not found`);
        }
        // Get all tests that cover this entity
        const coveringTests = await this.kgService.queryRelationships({
            toEntityId: entityId,
            type: RelationshipType.COVERAGE_PROVIDES
        });
        const testEntities = await Promise.all(coveringTests.map(rel => this.kgService.getEntity(rel.fromEntityId)));
        return {
            entityId,
            overallCoverage: this.aggregateCoverage(testEntities.map(t => t.coverage)),
            testBreakdown: {
                unitTests: this.aggregateCoverage(testEntities.filter(t => t.testType === 'unit').map(t => t.coverage)),
                integrationTests: this.aggregateCoverage(testEntities.filter(t => t.testType === 'integration').map(t => t.coverage)),
                e2eTests: this.aggregateCoverage(testEntities.filter(t => t.testType === 'e2e').map(t => t.coverage))
            },
            uncoveredLines: [], // Would need source map integration
            uncoveredBranches: [],
            testCases: testEntities.map(test => ({
                testId: test.id,
                testName: test.path,
                covers: [entityId]
            }))
        };
    }
    /**
     * Parse test results from different formats
     */
    async parseTestResults(filePath, format) {
        const content = await fs.readFile(filePath, 'utf-8');
        switch (format) {
            case 'junit':
                return this.parseJUnitXML(content);
            case 'jest':
                return this.parseJestJSON(content);
            case 'mocha':
                return this.parseMochaJSON(content);
            case 'vitest':
                return this.parseVitestJSON(content);
            default:
                throw new Error(`Unsupported test format: ${format}`);
        }
    }
    // Private helper methods
    async findTestEntity(testId) {
        try {
            const entity = await this.kgService.getEntity(testId);
            return entity && entity.type === 'test' ? entity : null;
        }
        catch {
            return null;
        }
    }
    mapStatus(status) {
        switch (status) {
            case 'passed': return 'passing';
            case 'failed': return 'failing';
            case 'skipped': return 'skipped';
            default: return 'unknown';
        }
    }
    inferTestType(suiteName, testName) {
        const name = `${suiteName} ${testName}`.toLowerCase();
        if (name.includes('e2e') || name.includes('end-to-end'))
            return 'e2e';
        if (name.includes('integration') || name.includes('int'))
            return 'integration';
        return 'unit';
    }
    async findTargetSymbol(testName, suiteName) {
        // This would use the AST parser to find what the test is testing
        // For now, return a placeholder
        return `${suiteName}#${testName}`;
    }
    inferFramework(suiteName) {
        if (suiteName.toLowerCase().includes('jest'))
            return 'jest';
        if (suiteName.toLowerCase().includes('mocha'))
            return 'mocha';
        if (suiteName.toLowerCase().includes('vitest'))
            return 'vitest';
        return 'unknown';
    }
    extractTags(testName) {
        const tags = [];
        const lowerName = testName.toLowerCase();
        if (lowerName.includes('slow'))
            tags.push('slow');
        if (lowerName.includes('fast'))
            tags.push('fast');
        if (lowerName.includes('flaky'))
            tags.push('flaky');
        if (lowerName.includes('critical'))
            tags.push('critical');
        return tags;
    }
    generateHash(input) {
        // Simple hash for now
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    async updatePerformanceMetrics(testEntity) {
        const history = testEntity.executionHistory;
        if (history.length === 0)
            return;
        const successfulRuns = history.filter(h => h.status === 'passed');
        const executionTimes = successfulRuns.map(h => h.duration);
        testEntity.performanceMetrics.averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        testEntity.performanceMetrics.successRate = successfulRuns.length / history.length;
        // Calculate P95
        const sorted = [...executionTimes].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        testEntity.performanceMetrics.p95ExecutionTime = sorted[p95Index] || 0;
        // Calculate trend
        testEntity.performanceMetrics.trend = this.calculateTrend(history);
        // Update historical data
        const latestData = {
            timestamp: new Date(),
            executionTime: testEntity.performanceMetrics.averageExecutionTime,
            successRate: testEntity.performanceMetrics.successRate,
            coveragePercentage: testEntity.coverage.lines
        };
        testEntity.performanceMetrics.historicalData.push(latestData);
        // Keep only last 100 data points
        if (testEntity.performanceMetrics.historicalData.length > 100) {
            testEntity.performanceMetrics.historicalData = testEntity.performanceMetrics.historicalData.slice(-100);
        }
    }
    async updateCoverageRelationships(testEntity) {
        // Create coverage relationship with target symbol
        await this.kgService.createRelationship({
            id: `${testEntity.id}_covers_${testEntity.targetSymbol}`,
            fromEntityId: testEntity.id,
            toEntityId: testEntity.targetSymbol,
            type: RelationshipType.COVERAGE_PROVIDES,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
            coveragePercentage: testEntity.coverage.lines
        });
    }
    async updateTestEntities(suiteResult) {
        // Update flaky scores based on recent results
        for (const result of suiteResult.results) {
            const testEntity = await this.findTestEntity(result.testId);
            if (testEntity) {
                const recentResults = testEntity.executionHistory.slice(-20);
                testEntity.flakyScore = this.calculateFlakyScore(recentResults);
                await this.kgService.createOrUpdateEntity(testEntity);
            }
        }
    }
    detectAlternatingPattern(results) {
        if (results.length < 3)
            return 0;
        let alternations = 0;
        for (let i = 1; i < results.length; i++) {
            if (results[i].status !== results[i - 1].status) {
                alternations++;
            }
        }
        return alternations / (results.length - 1);
    }
    calculateDurationVariability(results) {
        const durations = results.map(r => r.duration);
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / durations.length;
        return Math.sqrt(variance);
    }
    identifyFailurePatterns(results) {
        // Simple pattern identification
        return {
            timeOfDay: 'various',
            environment: 'unknown'
        };
    }
    generateFlakyTestRecommendations(score, patterns) {
        const recommendations = [];
        if (score > 0.7) {
            recommendations.push('Consider rewriting this test to be more deterministic');
            recommendations.push('Check for race conditions or timing dependencies');
        }
        if (score > 0.5) {
            recommendations.push('Run this test in isolation to identify external dependencies');
            recommendations.push('Add retry logic if the failure is intermittent');
        }
        recommendations.push('Monitor this test closely in future runs');
        return recommendations;
    }
    async storeFlakyTestAnalyses(analyses) {
        // Store analyses in database for historical tracking
        await this.dbService.storeFlakyTestAnalyses(analyses);
    }
    calculateTrend(history) {
        if (history.length < 5)
            return 'stable';
        const recent = history.slice(-5);
        const older = history.slice(-10, -5);
        const recentSuccessRate = recent.filter(h => h.status === 'passed').length / recent.length;
        const olderSuccessRate = older.filter(h => h.status === 'passed').length / older.length;
        const diff = recentSuccessRate - olderSuccessRate;
        if (diff > 0.1)
            return 'improving';
        if (diff < -0.1)
            return 'degrading';
        return 'stable';
    }
    aggregateCoverage(coverages) {
        if (coverages.length === 0) {
            return { lines: 0, branches: 0, functions: 0, statements: 0 };
        }
        return {
            lines: coverages.reduce((sum, c) => sum + c.lines, 0) / coverages.length,
            branches: coverages.reduce((sum, c) => sum + c.branches, 0) / coverages.length,
            functions: coverages.reduce((sum, c) => sum + c.functions, 0) / coverages.length,
            statements: coverages.reduce((sum, c) => sum + c.statements, 0) / coverages.length
        };
    }
    calculateFlakyScore(history) {
        if (history.length < 3)
            return 0;
        const failures = history.filter(h => h.status === 'failed').length;
        const failureRate = failures / history.length;
        // Weight recent failures more heavily
        const recent = history.slice(-5);
        const recentFailures = recent.filter(h => h.status === 'failed').length;
        const recentFailureRate = recentFailures / recent.length;
        return (failureRate * 0.6) + (recentFailureRate * 0.4);
    }
}
//# sourceMappingURL=TestEngine.js.map