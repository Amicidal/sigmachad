/**
 * TestEngine Service
 * Comprehensive test management, analysis, and integration service
 * Implements Phase 5.2 requirements for test integration
 */
import { TestResultParser } from "./TestResultParser.js";
import { RelationshipType } from "../models/relationships.js";
import * as fs from "fs/promises";
export class TestEngine {
    constructor(kgService, dbService) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.perfRelBuffer = [];
        this.perfIncidentSeeds = new Set();
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
            // Validate input
            if (!suiteResult.results || suiteResult.results.length === 0) {
                throw new Error("Test suite must contain at least one test result");
            }
            // Validate test results
            for (const result of suiteResult.results) {
                if (!result.testId || result.testId.trim().length === 0) {
                    throw new Error("Test result must have a valid testId");
                }
                if (!result.testName || result.testName.trim().length === 0) {
                    throw new Error("Test result must have a valid testName");
                }
                if (result.duration < 0) {
                    throw new Error("Test result duration cannot be negative");
                }
                if (!["passed", "failed", "skipped", "error"].includes(result.status)) {
                    throw new Error(`Invalid test status: ${result.status}`);
                }
            }
            // Store the test suite result
            // Map to DatabaseService storage shape
            const overallStatus = suiteResult.failedTests > 0
                ? "failed"
                : suiteResult.passedTests > 0
                    ? "passed"
                    : "skipped";
            await this.dbService.storeTestSuiteResult({
                name: suiteResult.suiteName,
                status: overallStatus,
                duration: suiteResult.duration,
                timestamp: suiteResult.timestamp,
                testResults: suiteResult.results.map((r) => ({
                    name: r.testName,
                    status: r.status === "error" ? "failed" : r.status,
                    duration: r.duration,
                    error: r.errorMessage,
                })),
            });
            // Process individual test results
            for (const result of suiteResult.results) {
                await this.processTestResult(result, suiteResult.timestamp);
            }
            // Update test entities in knowledge graph
            await this.updateTestEntities(suiteResult);
            // Perform flaky test analysis
            await this.analyzeFlakyTests(suiteResult.results);
            // Auto-create an incident checkpoint when failures occur (config-gated)
            const hasFailures = suiteResult.failedTests > 0 ||
                suiteResult.results.some((r) => r.status === "failed" || r.status === "error");
            if (hasFailures) {
                await this.createIncidentCheckpoint(suiteResult).catch((e) => {
                    console.warn("Incident checkpoint creation failed:", e);
                });
            }
            // Flush any batched performance relationships
            if (this.perfRelBuffer.length > 0) {
                try {
                    await this.kgService.createRelationshipsBulk(this.perfRelBuffer, { validate: false });
                }
                finally {
                    this.perfRelBuffer = [];
                }
            }
        }
        catch (error) {
            console.error("Failed to record test results:", error);
            throw new Error(`Test result recording failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Create an incident checkpoint seeded with failing tests and their impacted entities.
     * Controlled by env: HISTORY_ENABLED (default true), HISTORY_INCIDENT_ENABLED (default true),
     * HISTORY_INCIDENT_HOPS (default falls back to HISTORY_CHECKPOINT_HOPS or 2).
     */
    async createIncidentCheckpoint(suiteResult) {
        // Feature flags
        const historyEnabled = (process.env.HISTORY_ENABLED || "true").toLowerCase() !== "false";
        const incidentEnabled = (process.env.HISTORY_INCIDENT_ENABLED || "true").toLowerCase() !== "false";
        if (!historyEnabled || !incidentEnabled)
            return;
        // Determine hops
        const incidentHopsRaw = parseInt(process.env.HISTORY_INCIDENT_HOPS || "", 10);
        const baseHopsRaw = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || "", 10);
        const hops = Number.isFinite(incidentHopsRaw)
            ? incidentHopsRaw
            : Number.isFinite(baseHopsRaw)
                ? baseHopsRaw
                : 2;
        const failing = suiteResult.results.filter((r) => r.status === "failed" || r.status === "error");
        if (failing.length === 0)
            return;
        const seedIds = new Set();
        for (const fr of failing) {
            seedIds.add(fr.testId);
            try {
                // Include direct TESTS relationships (target/covered entities)
                const rels = await this.kgService.queryRelationships({
                    fromEntityId: fr.testId,
                    type: RelationshipType.TESTS,
                    limit: 100,
                });
                for (const rel of rels) {
                    if (rel.toEntityId)
                        seedIds.add(rel.toEntityId);
                }
                // Include targetSymbol on the test entity if present
                const testEntity = (await this.kgService.getEntity(fr.testId));
                if (testEntity === null || testEntity === void 0 ? void 0 : testEntity.targetSymbol)
                    seedIds.add(testEntity.targetSymbol);
            }
            catch (_a) {
                // Non-fatal; continue collecting seeds
            }
        }
        const seeds = Array.from(seedIds);
        if (seeds.length === 0)
            return;
        const { checkpointId } = await this.kgService.createCheckpoint(seeds, "incident", Math.max(1, Math.min(5, Math.floor(hops))));
        console.log(`📌 Incident checkpoint created: ${checkpointId} (seeds=${seeds.length}, hops=${hops})`);
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
                timestamp: timestamp.toISOString(),
            },
        };
        // Add execution to test history (avoid duplicates)
        const existingExecutionIndex = testEntity.executionHistory.findIndex((exec) => exec.id === execution.id);
        if (existingExecutionIndex === -1) {
            testEntity.executionHistory.push(execution);
        }
        else {
            // Update existing execution
            testEntity.executionHistory[existingExecutionIndex] = execution;
        }
        testEntity.lastRunAt = timestamp;
        testEntity.lastDuration = result.duration;
        testEntity.status = this.mapStatus(result.status);
        // Update performance metrics
        await this.updatePerformanceMetrics(testEntity);
        // Save test entity first
        await this.kgService.createOrUpdateEntity(testEntity);
        // Update coverage if provided
        if (result.coverage) {
            console.log(`📊 Setting coverage for test ${testEntity.id}:`, result.coverage);
            testEntity.coverage = result.coverage;
            await this.updateCoverageRelationships(testEntity);
        }
        else {
            console.log(`⚠️ No coverage data for test ${testEntity.id}`);
        }
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
            language: "typescript", // Default, could be inferred
            lastModified: new Date(),
            created: new Date(),
            type: "test",
            testType,
            targetSymbol,
            framework: this.inferFramework(result.testSuite),
            coverage: result.coverage || {
                lines: 0,
                branches: 0,
                functions: 0,
                statements: 0,
            },
            status: this.mapStatus(result.status),
            flakyScore: 0,
            executionHistory: [],
            performanceMetrics: {
                averageExecutionTime: 0,
                p95ExecutionTime: 0,
                successRate: 0,
                trend: "stable",
                benchmarkComparisons: [],
                historicalData: [],
            },
            dependencies: [],
            tags: this.extractTags(result.testName),
        };
        return testEntity;
    }
    /**
     * Analyze test results for flaky behavior
     */
    async analyzeFlakyTests(results) {
        // Validate input
        if (!results || results.length === 0) {
            return []; // Return empty array for empty input
        }
        const analyses = [];
        // Group results by test
        const testGroups = new Map();
        for (const result of results) {
            if (!result || !result.testId) {
                throw new Error("Invalid test result: missing testId");
            }
            if (!testGroups.has(result.testId)) {
                testGroups.set(result.testId, []);
            }
            testGroups.get(result.testId).push(result);
        }
        for (const [testId, testResults] of testGroups) {
            const analysis = await this.analyzeSingleTestFlakiness(testId, testResults);
            if (analysis.flakyScore > 0.3) {
                // Only include potentially flaky tests
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
        var _a;
        const totalRuns = results.length;
        const failures = results.filter((r) => r.status === "failed").length;
        const failureRate = failures / totalRuns;
        const successRate = 1 - failureRate;
        // Calculate flaky score based on multiple factors
        let flakyScore = 0;
        // High failure rate in recent runs
        const recentRuns = results.slice(-10);
        const recentFailures = recentRuns.filter((r) => r.status === "failed").length;
        const recentFailureRate = recentFailures / recentRuns.length;
        flakyScore += recentFailureRate * 0.4;
        // Inconsistent results (alternating pass/fail)
        const alternatingPattern = this.detectAlternatingPattern(results);
        flakyScore += alternatingPattern * 0.3;
        // Duration variability (longer tests tend to be more flaky)
        const durationVariability = this.calculateDurationVariability(results.map((r) => r.duration));
        flakyScore += Math.min(durationVariability / 1000, 1) * 0.3; // Cap at 1
        const patterns = this.identifyFailurePatterns(results);
        return {
            testId,
            testName: ((_a = results[0]) === null || _a === void 0 ? void 0 : _a.testName) || testId,
            flakyScore: Math.min(flakyScore, 1),
            totalRuns,
            failureRate,
            successRate,
            recentFailures,
            patterns,
            recommendations: this.generateFlakyTestRecommendations(flakyScore, patterns),
        };
    }
    /**
     * Get performance metrics for a test entity
     */
    async getPerformanceMetrics(entityId) {
        // Validate input
        if (!entityId || entityId.trim().length === 0) {
            throw new Error("Entity ID cannot be empty");
        }
        const testEntity = (await this.kgService.getEntity(entityId));
        if (!testEntity) {
            throw new Error(`Test entity ${entityId} not found`);
        }
        return testEntity.performanceMetrics;
    }
    /**
     * Get coverage analysis for an entity
     */
    async getCoverageAnalysis(entityId) {
        var _a, _b, _c;
        // Validate input
        if (!entityId || entityId.trim().length === 0) {
            throw new Error("Entity ID cannot be empty");
        }
        const testEntity = (await this.kgService.getEntity(entityId));
        if (!testEntity) {
            throw new Error(`Test entity ${entityId} not found`);
        }
        // Get all test relationships to this entity
        const testRels = await this.kgService.queryRelationships({
            toEntityId: entityId,
            type: RelationshipType.TESTS,
        });
        // Derive coverage from relationship metadata or fallback to test entity
        const coverages = [];
        for (const rel of testRels) {
            const meta = rel.metadata || {};
            const relCov = (_c = (_b = (_a = meta.coverage) === null || _a === void 0 ? void 0 : _a.lines) !== null && _b !== void 0 ? _b : meta.coveragePercentage) !== null && _c !== void 0 ? _c : meta.coverage;
            if (typeof relCov === 'number') {
                coverages.push(relCov);
                continue;
            }
            const test = (await this.kgService.getEntity(rel.fromEntityId));
            if (test && test.coverage && typeof test.coverage.lines === 'number') {
                coverages.push(test.coverage.lines);
            }
        }
        return {
            entityId,
            overallCoverage: this.aggregateCoverage(coverages),
            testBreakdown: {
                unitTests: 0,
                integrationTests: 0,
                e2eTests: 0,
            },
            uncoveredLines: [], // Would need source map integration
            uncoveredBranches: [],
            testCases: testRels.map((rel) => ({
                testId: rel.fromEntityId,
                testName: rel.fromEntityId,
                covers: [entityId],
            })),
        };
    }
    /**
     * Parse test results from different formats
     */
    async parseTestResults(filePath, format) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            // Validate content is not empty
            if (!content || content.trim().length === 0) {
                throw new Error("Test result file is empty");
            }
            switch (format) {
                case "junit":
                    return this.parseJUnitXML(content);
                case "jest":
                    return this.parseJestJSON(content);
                case "mocha":
                    return this.parseMochaJSON(content);
                case "vitest":
                    return this.parseVitestJSON(content);
                default:
                    throw new Error(`Unsupported test format: ${format}`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to parse test results: ${error.message}`);
            }
            throw new Error("Failed to parse test results: Unknown error");
        }
    }
    // Private parsing methods
    parseJUnitXML(content) {
        // Basic JUnit XML parsing (simplified implementation)
        // In a real implementation, this would use a proper XML parser
        // Validate content is not empty and contains XML
        if (!content || content.trim().length === 0) {
            throw new Error("JUnit XML content is empty");
        }
        if (!content.includes("<testsuite") && !content.includes("<testcase")) {
            throw new Error("Invalid JUnit XML format: missing testsuite or testcase elements");
        }
        const results = [];
        // Extract test cases from XML-like structure
        const testCaseRegex = /<testcase[^>]*classname="([^"]*)"[^>]*name="([^"]*)"[^>]*time="([^"]*)"[^>]*>/g;
        let match;
        let foundTests = false;
        while ((match = testCaseRegex.exec(content)) !== null) {
            foundTests = true;
            const [, className, testName, timeStr] = match;
            if (!className || !testName) {
                throw new Error("Invalid JUnit XML format: testcase missing classname or name attribute");
            }
            const time = parseFloat(timeStr || "0");
            if (isNaN(time)) {
                throw new Error(`Invalid JUnit XML format: invalid time value '${timeStr}'`);
            }
            results.push({
                testId: `${className}.${testName}`,
                testSuite: className,
                testName: testName,
                status: "passed",
                duration: time * 1000, // Convert to milliseconds
                coverage: {
                    statements: 0,
                    branches: 0,
                    functions: 0,
                    lines: 0,
                },
            });
        }
        if (!foundTests) {
            throw new Error("Invalid JUnit XML format: no testcase elements found");
        }
        return {
            suiteName: "JUnit Test Suite",
            timestamp: new Date(),
            results: results,
            framework: "junit",
            totalTests: results.length,
            passedTests: results.filter((r) => r.status === "passed").length,
            failedTests: results.filter((r) => r.status === "failed").length,
            skippedTests: results.filter((r) => r.status === "skipped").length,
            duration: results.reduce((sum, r) => sum + r.duration, 0),
        };
    }
    parseJestJSON(content) {
        try {
            const data = JSON.parse(content);
            // Validate basic structure
            if (!data || typeof data !== "object") {
                throw new Error("Invalid Jest JSON format: expected object");
            }
            const results = [];
            if (data.testResults && Array.isArray(data.testResults)) {
                data.testResults.forEach((suite) => {
                    if (!suite.testResults || !Array.isArray(suite.testResults)) {
                        throw new Error("Invalid Jest JSON format: missing or invalid testResults array");
                    }
                    suite.testResults.forEach((test) => {
                        if (!test.title) {
                            throw new Error("Invalid Jest JSON format: test missing title");
                        }
                        results.push({
                            testId: `${suite.testFilePath || "unknown"}:${test.title}`,
                            testSuite: suite.testFilePath || "unknown",
                            testName: test.title,
                            status: test.status === "passed" ? "passed" : "failed",
                            duration: test.duration || 0,
                            errorMessage: test.failureMessages
                                ? test.failureMessages.join("\n")
                                : undefined,
                            coverage: {
                                statements: 0,
                                branches: 0,
                                functions: 0,
                                lines: 0,
                            },
                        });
                    });
                });
            }
            else {
                throw new Error("Invalid Jest JSON format: missing testResults array");
            }
            return {
                suiteName: "Jest Test Suite",
                timestamp: new Date(),
                results: results,
                framework: "jest",
                totalTests: results.length,
                passedTests: results.filter((r) => r.status === "passed").length,
                failedTests: results.filter((r) => r.status === "failed").length,
                skippedTests: results.filter((r) => r.status === "skipped").length,
                duration: results.reduce((sum, r) => sum + r.duration, 0),
            };
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format in Jest test results: ${error.message}`);
            }
            if (error instanceof Error) {
                throw new Error(`Failed to parse Jest JSON: ${error.message}`);
            }
            throw new Error("Failed to parse Jest JSON: Unknown error");
        }
    }
    parseMochaJSON(content) {
        try {
            const data = JSON.parse(content);
            // Validate basic structure
            if (!data || typeof data !== "object") {
                throw new Error("Invalid Mocha JSON format: expected object");
            }
            const results = [];
            if (data.tests && Array.isArray(data.tests)) {
                data.tests.forEach((test) => {
                    if (!test.title) {
                        throw new Error("Invalid Mocha JSON format: test missing title");
                    }
                    results.push({
                        testId: test.fullTitle || `${test.parent || "Mocha Suite"}#${test.title}`,
                        testSuite: test.parent || "Mocha Suite",
                        testName: test.title,
                        status: test.state === "passed" ? "passed" : "failed",
                        duration: test.duration || 0,
                        errorMessage: test.err ? test.err.message : undefined,
                        stackTrace: test.err ? test.err.stack : undefined,
                        coverage: {
                            statements: 0,
                            branches: 0,
                            functions: 0,
                            lines: 0,
                        },
                    });
                });
            }
            else {
                throw new Error("Invalid Mocha JSON format: missing tests array");
            }
            return {
                suiteName: "Mocha Test Suite",
                timestamp: new Date(),
                results: results,
                framework: "mocha",
                totalTests: results.length,
                passedTests: results.filter((r) => r.status === "passed").length,
                failedTests: results.filter((r) => r.status === "failed").length,
                skippedTests: results.filter((r) => r.status === "skipped").length,
                duration: results.reduce((sum, r) => sum + r.duration, 0),
            };
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format in Mocha test results: ${error.message}`);
            }
            if (error instanceof Error) {
                throw new Error(`Failed to parse Mocha JSON: ${error.message}`);
            }
            throw new Error("Failed to parse Mocha JSON: Unknown error");
        }
    }
    parseVitestJSON(content) {
        try {
            const data = JSON.parse(content);
            // Validate basic structure
            if (!data || typeof data !== "object") {
                throw new Error("Invalid Vitest JSON format: expected object");
            }
            const results = [];
            if (data.testResults && Array.isArray(data.testResults)) {
                data.testResults.forEach((result) => {
                    if (!result.name) {
                        throw new Error("Invalid Vitest JSON format: test result missing name");
                    }
                    results.push({
                        testId: result.name,
                        testSuite: result.filepath || "Vitest Suite",
                        testName: result.name,
                        status: result.status === "pass" ? "passed" : "failed",
                        duration: result.duration || 0,
                        coverage: {
                            statements: 0,
                            branches: 0,
                            functions: 0,
                            lines: 0,
                        },
                    });
                });
            }
            else {
                throw new Error("Invalid Vitest JSON format: missing testResults array");
            }
            return {
                suiteName: "Vitest Test Suite",
                timestamp: new Date(),
                results: results,
                framework: "vitest",
                totalTests: results.length,
                passedTests: results.filter((r) => r.status === "passed").length,
                failedTests: results.filter((r) => r.status === "failed").length,
                skippedTests: results.filter((r) => r.status === "skipped").length,
                duration: results.reduce((sum, r) => sum + r.duration, 0),
            };
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format in Vitest test results: ${error.message}`);
            }
            if (error instanceof Error) {
                throw new Error(`Failed to parse Vitest JSON: ${error.message}`);
            }
            throw new Error("Failed to parse Vitest JSON: Unknown error");
        }
    }
    // Private helper methods
    async findTestEntity(testId) {
        try {
            const entity = await this.kgService.getEntity(testId);
            return entity && entity.type === "test" ? entity : null;
        }
        catch (_a) {
            return null;
        }
    }
    mapStatus(status) {
        switch (status) {
            case "passed":
                return "passing";
            case "failed":
                return "failing";
            case "skipped":
                return "skipped";
            default:
                return "unknown";
        }
    }
    inferTestType(suiteName, testName) {
        const name = `${suiteName} ${testName}`.toLowerCase();
        if (name.includes("e2e") || name.includes("end-to-end"))
            return "e2e";
        if (name.includes("integration") || name.includes("int"))
            return "integration";
        return "unit";
    }
    async findTargetSymbol(testName, suiteName) {
        // Try to infer the target from test name
        const lowerTestName = testName.toLowerCase();
        const lowerSuiteName = suiteName.toLowerCase();
        // Look for common patterns in test names that indicate what they test
        if (lowerTestName.includes("helper") ||
            lowerTestName.includes("util") ||
            lowerTestName.includes("cover") ||
            lowerSuiteName.includes("coverage") ||
            lowerSuiteName.includes("coveragetests")) {
            return "coverage-test-entity"; // Match the test entity created in tests
        }
        // For unit tests, try to infer from the test name
        if (lowerSuiteName.includes("unit") && lowerTestName.includes("validate")) {
            return "coverage-test-entity"; // Common pattern in test suites
        }
        // This would use the AST parser to find what the test is testing
        // For now, return a placeholder
        return `${suiteName}#${testName}`;
    }
    inferFramework(suiteName) {
        if (suiteName.toLowerCase().includes("jest"))
            return "jest";
        if (suiteName.toLowerCase().includes("mocha"))
            return "mocha";
        if (suiteName.toLowerCase().includes("vitest"))
            return "vitest";
        return "unknown";
    }
    extractTags(testName) {
        const tags = [];
        const lowerName = testName.toLowerCase();
        if (lowerName.includes("slow"))
            tags.push("slow");
        if (lowerName.includes("fast"))
            tags.push("fast");
        if (lowerName.includes("flaky"))
            tags.push("flaky");
        if (lowerName.includes("critical"))
            tags.push("critical");
        return tags;
    }
    generateHash(input) {
        // Simple hash for now
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    async updatePerformanceMetrics(testEntity) {
        const history = testEntity.executionHistory;
        if (history.length === 0)
            return;
        const successfulRuns = history.filter((h) => h.status === "passed");
        const executionTimes = successfulRuns.map((h) => h.duration);
        testEntity.performanceMetrics.averageExecutionTime =
            executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        testEntity.performanceMetrics.successRate =
            successfulRuns.length / history.length;
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
            coveragePercentage: testEntity.coverage.lines,
        };
        testEntity.performanceMetrics.historicalData.push(latestData);
        // Keep only last 100 data points
        if (testEntity.performanceMetrics.historicalData.length > 100) {
            testEntity.performanceMetrics.historicalData =
                testEntity.performanceMetrics.historicalData.slice(-100);
        }
        // Queue performance relationships when we can associate a target symbol (batched)
        try {
            if (testEntity.targetSymbol) {
                const target = await this.kgService.getEntity(testEntity.targetSymbol);
                if (target) {
                    // Regression if trend is degrading
                    if (testEntity.performanceMetrics.trend === "degrading") {
                        this.perfRelBuffer.push({
                            id: `${testEntity.id}_perf_regression_${testEntity.targetSymbol}`,
                            fromEntityId: testEntity.id,
                            toEntityId: testEntity.targetSymbol,
                            type: RelationshipType.PERFORMANCE_REGRESSION,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: {
                                avgMs: testEntity.performanceMetrics.averageExecutionTime,
                                p95Ms: testEntity.performanceMetrics.p95ExecutionTime,
                            },
                        });
                        this.perfIncidentSeeds.add(testEntity.id);
                    }
                    else if (
                    // Performance impact if latency is above a high-water mark
                    testEntity.performanceMetrics.p95ExecutionTime >= 2000 ||
                        testEntity.performanceMetrics.averageExecutionTime >= 1500) {
                        this.perfRelBuffer.push({
                            id: `${testEntity.id}_perf_impact_${testEntity.targetSymbol}`,
                            fromEntityId: testEntity.id,
                            toEntityId: testEntity.targetSymbol,
                            type: RelationshipType.PERFORMANCE_IMPACT,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: {
                                avgMs: testEntity.performanceMetrics.averageExecutionTime,
                                p95Ms: testEntity.performanceMetrics.p95ExecutionTime,
                            },
                        });
                        this.perfIncidentSeeds.add(testEntity.id);
                    }
                }
            }
        }
        catch (_a) {
            // Non-fatal; continue
        }
    }
    async updateCoverageRelationships(testEntity) {
        var _a, _b, _c;
        // Only create coverage relationships if the target entity exists
        try {
            if (!testEntity.targetSymbol) {
                console.log(`⚠️ No target symbol for test entity ${testEntity.id}`);
                return;
            }
            const targetEntity = await this.kgService.getEntity(testEntity.targetSymbol);
            if (!targetEntity) {
                console.log(`⚠️ Target entity ${testEntity.targetSymbol} not found for test ${testEntity.id}`);
                return;
            }
            console.log(`✅ Creating coverage relationship: ${testEntity.id} -> ${testEntity.targetSymbol}`);
            // Create a test relationship and include coverage in metadata
            await this.kgService.createRelationship({
                id: `${testEntity.id}_tests_${testEntity.targetSymbol}`,
                fromEntityId: testEntity.id,
                toEntityId: testEntity.targetSymbol,
                type: RelationshipType.TESTS,
                created: new Date(),
                lastModified: new Date(),
                version: 1,
                metadata: {
                    coverage: {
                        lines: (_a = testEntity.coverage) === null || _a === void 0 ? void 0 : _a.lines,
                        branches: (_b = testEntity.coverage) === null || _b === void 0 ? void 0 : _b.branches,
                        functions: (_c = testEntity.coverage) === null || _c === void 0 ? void 0 : _c.functions,
                    },
                    testType: testEntity.testType,
                },
            });
        }
        catch (error) {
            // If we can't create the relationship, just skip it
            console.warn(`Failed to create coverage relationship for test ${testEntity.id}:`, error);
        }
    }
    async updateTestEntities(suiteResult) {
        // Update flaky scores based on recent results
        for (const result of suiteResult.results) {
            const testEntity = await this.findTestEntity(result.testId);
            if (testEntity) {
                const recentResults = testEntity.executionHistory.slice(-20);
                testEntity.flakyScore = this.calculateFlakyScore(recentResults);
                // Don't call createOrUpdateEntity here - it's already called in processTestResult
                // Just update the in-memory object
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
    calculateDurationVariability(durations) {
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) /
            durations.length;
        return Math.sqrt(variance);
    }
    identifyFailurePatterns(results) {
        const patterns = {
            timeOfDay: "various",
            environment: "unknown",
            duration: "stable",
            alternating: "low",
        };
        if (results.length < 2) {
            return patterns;
        }
        // Analyze duration variability
        const durations = results.map((r) => r.duration);
        const durationVariability = this.calculateDurationVariability(durations);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const durationCoeffOfVariation = durationVariability / avgDuration;
        if (durationCoeffOfVariation > 0.5) {
            patterns.duration = "variable";
        }
        else if (durationCoeffOfVariation > 0.2) {
            patterns.duration = "moderate";
        }
        // Analyze alternating pattern
        const alternatingScore = this.detectAlternatingPattern(results);
        if (alternatingScore > 0.7) {
            patterns.alternating = "high";
        }
        else if (alternatingScore > 0.4) {
            patterns.alternating = "moderate";
        }
        // Check for resource contention patterns
        const failureMessages = results
            .filter((r) => r.status === "failed" && r.errorMessage)
            .map((r) => r.errorMessage.toLowerCase());
        const resourceKeywords = [
            "timeout",
            "connection",
            "network",
            "memory",
            "resource",
        ];
        const hasResourceIssues = failureMessages.some((msg) => resourceKeywords.some((keyword) => msg.includes(keyword)));
        if (hasResourceIssues) {
            patterns.environment = "resource_contention";
        }
        return patterns;
    }
    generateFlakyTestRecommendations(score, patterns) {
        const recommendations = [];
        // High flakiness recommendations
        if (score > 0.8) {
            recommendations.push("This test has critical flakiness - immediate investigation required");
            recommendations.push("Consider disabling this test temporarily until stability is improved");
            recommendations.push("Review test setup and teardown for resource cleanup issues");
            recommendations.push("Check for global state pollution between test runs");
        }
        else if (score > 0.7) {
            recommendations.push("Consider rewriting this test to be more deterministic");
            recommendations.push("Check for race conditions or timing dependencies");
            recommendations.push("Add explicit waits instead of relying on timing");
        }
        // Medium flakiness recommendations
        if (score > 0.5) {
            recommendations.push("Run this test in isolation to identify external dependencies");
            recommendations.push("Add retry logic if the failure is intermittent");
            recommendations.push("Check for network or I/O dependencies that may cause variability");
        }
        // Pattern-based recommendations
        if (patterns.duration === "variable") {
            recommendations.push("Test duration varies significantly - investigate timing-related issues");
            recommendations.push("Consider adding timeouts and ensuring async operations complete");
        }
        if (patterns.alternating === "high") {
            recommendations.push("Test alternates between pass/fail - check for initialization order issues");
            recommendations.push("Verify test isolation and cleanup between runs");
            // Add the deterministic rewrite recommendation for alternating patterns too
            if (!recommendations.includes("Consider rewriting this test to be more deterministic")) {
                recommendations.push("Consider rewriting this test to be more deterministic");
            }
            // Add race conditions recommendation for alternating patterns
            if (!recommendations.includes("Check for race conditions or timing dependencies")) {
                recommendations.push("Check for race conditions or timing dependencies");
            }
        }
        // Environment-specific recommendations
        if (patterns.environment === "resource_contention") {
            recommendations.push("Test may be affected by resource contention - consider adding delays");
            recommendations.push("Run test with reduced parallelism to isolate resource issues");
        }
        // General monitoring recommendation
        recommendations.push("Monitor this test closely in future runs");
        return recommendations;
    }
    async storeFlakyTestAnalyses(analyses) {
        // Map to DatabaseService FlakyTestAnalysis shape
        const mapped = analyses.map((a) => ({
            testId: a.testId,
            testName: a.testName,
            failureCount: Math.round(a.failureRate * a.totalRuns),
            totalRuns: a.totalRuns,
            lastFailure: new Date(),
            failurePatterns: Object.entries(a.patterns)
                .filter(([, v]) => !!v)
                .map(([k, v]) => `${k}:${v}`),
        }));
        await this.dbService.storeFlakyTestAnalyses(mapped);
    }
    calculateTrend(history) {
        if (history.length < 5)
            return "stable";
        const recent = history.slice(-5);
        const older = history.slice(-10, -5);
        const recentSuccessRate = recent.filter((h) => h.status === "passed").length / recent.length;
        const olderSuccessRate = older.filter((h) => h.status === "passed").length / older.length;
        const diff = recentSuccessRate - olderSuccessRate;
        if (diff > 0.1)
            return "improving";
        if (diff < -0.1)
            return "degrading";
        return "stable";
    }
    aggregateCoverage(coverages) {
        if (coverages.length === 0) {
            return { lines: 0, branches: 0, functions: 0, statements: 0 };
        }
        return {
            lines: coverages.reduce((sum, c) => sum + c.lines, 0) / coverages.length,
            branches: coverages.reduce((sum, c) => sum + c.branches, 0) / coverages.length,
            functions: coverages.reduce((sum, c) => sum + c.functions, 0) / coverages.length,
            statements: coverages.reduce((sum, c) => sum + c.statements, 0) / coverages.length,
        };
    }
    calculateFlakyScore(history) {
        if (history.length < 3)
            return 0;
        const failures = history.filter((h) => h.status === "failed").length;
        const failureRate = failures / history.length;
        // Weight recent failures more heavily
        const recent = history.slice(-5);
        const recentFailures = recent.filter((h) => h.status === "failed").length;
        const recentFailureRate = recentFailures / recent.length;
        return failureRate * 0.6 + recentFailureRate * 0.4;
    }
}
//# sourceMappingURL=TestEngine.js.map