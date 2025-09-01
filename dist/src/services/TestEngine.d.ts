/**
 * TestEngine Service
 * Comprehensive test management, analysis, and integration service
 * Implements Phase 5.2 requirements for test integration
 */
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { DatabaseService } from './DatabaseService.js';
import { TestPerformanceMetrics, CoverageMetrics } from '../models/entities.js';
export interface TestResult {
    testId: string;
    testSuite: string;
    testName: string;
    status: 'passed' | 'failed' | 'skipped' | 'error';
    duration: number;
    errorMessage?: string;
    stackTrace?: string;
    coverage?: CoverageMetrics;
    performance?: {
        memoryUsage?: number;
        cpuUsage?: number;
        networkRequests?: number;
    };
}
export interface TestSuiteResult {
    suiteName: string;
    timestamp: Date;
    results: TestResult[];
    framework: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    coverage?: CoverageMetrics;
}
export interface TestCoverageAnalysis {
    entityId: string;
    overallCoverage: CoverageMetrics;
    testBreakdown: {
        unitTests: CoverageMetrics;
        integrationTests: CoverageMetrics;
        e2eTests: CoverageMetrics;
    };
    uncoveredLines: number[];
    uncoveredBranches: number[];
    testCases: {
        testId: string;
        testName: string;
        covers: string[];
    }[];
}
export interface FlakyTestAnalysis {
    testId: string;
    testName: string;
    flakyScore: number;
    totalRuns: number;
    failureRate: number;
    successRate: number;
    recentFailures: number;
    patterns: {
        timeOfDay?: string;
        environment?: string;
        duration?: string;
    };
    recommendations: string[];
}
export declare class TestEngine {
    private kgService;
    private dbService;
    private parser;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService);
    /**
     * Parse test results from a file and record them
     */
    parseAndRecordTestResults(filePath: string, format: 'junit' | 'jest' | 'mocha' | 'vitest' | 'cypress' | 'playwright'): Promise<void>;
    /**
     * Parse and store test execution results from various formats
     */
    recordTestResults(suiteResult: TestSuiteResult): Promise<void>;
    /**
     * Process individual test result and update knowledge graph
     */
    private processTestResult;
    /**
     * Create new test entity from test result
     */
    private createTestEntity;
    /**
     * Analyze test results for flaky behavior
     */
    analyzeFlakyTests(results: TestResult[]): Promise<FlakyTestAnalysis[]>;
    /**
     * Analyze flakiness for a single test
     */
    private analyzeSingleTestFlakiness;
    /**
     * Get performance metrics for a test entity
     */
    getPerformanceMetrics(entityId: string): Promise<TestPerformanceMetrics>;
    /**
     * Get coverage analysis for an entity
     */
    getCoverageAnalysis(entityId: string): Promise<TestCoverageAnalysis>;
    /**
     * Parse test results from different formats
     */
    parseTestResults(filePath: string, format: 'junit' | 'jest' | 'mocha' | 'vitest'): Promise<TestSuiteResult>;
    private parseJUnitXML;
    private parseJestJSON;
    private parseMochaJSON;
    private parseVitestJSON;
    private findTestEntity;
    private mapStatus;
    private inferTestType;
    private findTargetSymbol;
    private inferFramework;
    private extractTags;
    private generateHash;
    private updatePerformanceMetrics;
    private updateCoverageRelationships;
    private updateTestEntities;
    private detectAlternatingPattern;
    private calculateDurationVariability;
    private identifyFailurePatterns;
    private generateFlakyTestRecommendations;
    private storeFlakyTestAnalyses;
    private calculateTrend;
    private aggregateCoverage;
    private calculateFlakyScore;
}
//# sourceMappingURL=TestEngine.d.ts.map