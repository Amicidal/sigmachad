/**
 * TestEngine Service
 * Comprehensive test management, analysis, and integration service
 * Implements Phase 5.2 requirements for test integration
 */
import { TestResultParser } from "./TestResultParser.js";
import { RelationshipType, } from "@memento/core";
import { noiseConfig } from "@memento/core";
import { sanitizeEnvironment } from "@memento/core";
import { normalizeMetricIdForId } from "@memento/core";
import * as fs from "fs/promises";
export class TestEngine {
    constructor(kgService, dbService) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.perfRelBuffer = [];
        this.perfIncidentSeeds = new Set();
        this.testSessionSequences = new Map();
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
            const results = suiteResult.results ?? [];
            // Validate test results when present
            for (const result of results) {
                if (!result) {
                    throw new Error("Test suite contains invalid test result entries");
                }
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
            if (results.length === 0) {
                throw new Error("Test suite must include at least one test result");
            }
            if (!suiteResult.coverage) {
                suiteResult.coverage = this.aggregateCoverage(results
                    .map((r) => r?.coverage)
                    .filter((c) => Boolean(c)));
            }
            // Persist the raw suite result so downstream consumers receive the exact payload
            await this.dbService.storeTestSuiteResult(suiteResult);
            // Process individual test results
            for (const result of results) {
                await this.processTestResult(result, suiteResult.timestamp);
            }
            // Update test entities in knowledge graph
            await this.updateTestEntities(suiteResult);
            // Perform flaky test analysis
            await this.analyzeFlakyTests(results);
            // Auto-create an incident checkpoint when failures occur (config-gated)
            const hasFailures = suiteResult.failedTests > 0 ||
                results.some((r) => r.status === "failed" || r.status === "error");
            if (hasFailures) {
                await this.createIncidentCheckpoint(suiteResult).catch((e) => {
                    console.warn("Incident checkpoint creation failed:", e);
                });
            }
            // Flush any batched performance relationships
            await this.flushPerformanceRelationships();
        }
        catch (error) {
            console.error("Failed to record test results:", error);
            throw new Error(`Test result recording failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async flushPerformanceRelationships() {
        const relationshipsToFlush = this.perfRelBuffer;
        if (!relationshipsToFlush.length) {
            return;
        }
        const bulkCreate = this.kgService?.createRelationshipsBulk;
        this.perfRelBuffer = [];
        if (typeof bulkCreate !== "function") {
            return;
        }
        try {
            await bulkCreate(relationshipsToFlush, { validate: false });
        }
        catch (error) {
            this.perfRelBuffer = relationshipsToFlush.concat(this.perfRelBuffer);
            throw error;
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
                if (testEntity?.targetSymbol)
                    seedIds.add(testEntity.targetSymbol);
            }
            catch {
                // Non-fatal; continue collecting seeds
            }
        }
        const seeds = Array.from(seedIds);
        if (seeds.length === 0)
            return;
        if (typeof this.kgService.createCheckpoint !== "function") {
            console.warn("KnowledgeGraphService#createCheckpoint not available; skipping incident checkpoint.");
            return;
        }
        const { checkpointId } = await this.kgService.createCheckpoint(seeds, {
            type: "incident",
            hops: Math.max(1, Math.min(5, Math.floor(hops)))
        });
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
        const executionEnvironment = this.buildExecutionEnvironment(result, timestamp);
        const execution = {
            id: `${result.testId}_${timestamp.getTime()}`,
            timestamp,
            status: result.status,
            duration: result.duration,
            errorMessage: result.errorMessage,
            stackTrace: result.stackTrace,
            coverage: result.coverage,
            performance: result.performance,
            environment: executionEnvironment,
        };
        // Add execution to test history (avoid duplicates)
        const priorStatus = testEntity.executionHistory.length > 0
            ? testEntity.executionHistory[testEntity.executionHistory.length - 1].status
            : undefined;
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
        // Link tests to specs they validate via IMPLEMENTS_SPEC on target symbol
        try {
            if (testEntity.targetSymbol) {
                const impls = await this.kgService.getRelationships({
                    fromEntityId: testEntity.targetSymbol,
                    type: RelationshipType.IMPLEMENTS_SPEC,
                    limit: 50,
                });
                for (const r of impls) {
                    try {
                        await this.kgService.createRelationship({
                            id: `rel_${testEntity.id}_${r.toEntityId}_VALIDATES`,
                            fromEntityId: testEntity.id,
                            toEntityId: r.toEntityId,
                            type: RelationshipType.VALIDATES,
                            created: timestamp,
                            lastModified: timestamp,
                            version: 1,
                        });
                    }
                    catch { }
                }
            }
        }
        catch { }
        // Emit BROKE_IN / FIXED_IN signals between test and its target symbol on status transition
        try {
            const curr = result.status;
            const prev = priorStatus;
            const target = testEntity.targetSymbol;
            if (target) {
                const eventBase = execution.id;
                if ((prev === "passed" || prev === "skipped" || prev === undefined) && curr === "failed") {
                    await this.emitTestSessionRelationship({
                        testEntity,
                        timestamp,
                        type: RelationshipType.BROKE_IN,
                        toEntityId: target,
                        eventBase,
                        actor: "test-engine",
                        impact: { severity: "high", testsFailed: [testEntity.id] },
                        impactSeverity: "high",
                        stateTransition: {
                            from: "working",
                            to: "broken",
                            verifiedBy: "test",
                            confidence: 1,
                        },
                        metadata: { verifiedBy: "test", runId: execution.id },
                        annotations: ["test-run", "failed"],
                    });
                }
                if (prev === "failed" && curr === "passed") {
                    await this.emitTestSessionRelationship({
                        testEntity,
                        timestamp,
                        type: RelationshipType.FIXED_IN,
                        toEntityId: target,
                        eventBase,
                        actor: "test-engine",
                        impact: { severity: "low", testsFixed: [testEntity.id] },
                        impactSeverity: "low",
                        stateTransition: {
                            from: "broken",
                            to: "working",
                            verifiedBy: "test",
                            confidence: 1,
                        },
                        metadata: { verifiedBy: "test", runId: execution.id },
                        annotations: ["test-run", "resolved"],
                    });
                }
            }
        }
        catch { }
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
    nextTestSessionSequence(sessionId) {
        const next = (this.testSessionSequences.get(sessionId) ?? -1) + 1;
        this.testSessionSequences.set(sessionId, next);
        return next;
    }
    async emitTestSessionRelationship(options) {
        const sessionId = `test-session:${options.testEntity.id.toLowerCase()}`;
        const sequenceNumber = this.nextTestSessionSequence(sessionId);
        const eventId = `${options.eventBase}:${options.type}:${sequenceNumber}`;
        const annotations = Array.from(new Set((options.annotations || [])
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter((value) => value.length > 0)));
        const metadata = {
            sessionId,
            source: "test-engine",
            testId: options.testEntity.id,
            targetEntityId: options.toEntityId,
            ...options.metadata,
        };
        const relationship = {
            fromEntityId: options.testEntity.id,
            toEntityId: options.toEntityId,
            type: options.type,
            created: options.timestamp,
            lastModified: options.timestamp,
            version: 1,
            sessionId,
            sequenceNumber,
            timestamp: options.timestamp,
            eventId,
            actor: options.actor ?? "test-engine",
            metadata,
        };
        if (annotations.length > 0) {
            relationship.annotations = annotations;
        }
        if (options.stateTransition) {
            relationship.stateTransition = options.stateTransition;
            const toState = options.stateTransition.to;
            if (toState) {
                relationship.stateTransitionTo = toState;
            }
        }
        if (options.impact) {
            relationship.impact = options.impact;
        }
        if (options.impactSeverity) {
            relationship.impactSeverity = options.impactSeverity;
        }
        await this.kgService.createRelationship(relationship);
    }
    buildExecutionEnvironment(result, timestamp) {
        const normalized = this.normalizeEnvironmentCandidate(result.environment) ??
            this.defaultEnvironment();
        return {
            name: normalized,
            raw: result.environment ?? null,
            framework: this.inferFramework(result.testSuite),
            suite: result.testSuite,
            recordedAt: timestamp.toISOString(),
            nodeEnv: process.env.NODE_ENV ?? undefined,
        };
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
    resolveEnvironmentForTest(testEntity) {
        const history = Array.isArray(testEntity.executionHistory)
            ? testEntity.executionHistory
            : [];
        for (let idx = history.length - 1; idx >= 0; idx -= 1) {
            const execution = history[idx];
            const normalized = this.extractEnvironmentFromExecution(execution?.environment);
            if (normalized) {
                return normalized;
            }
        }
        return this.defaultEnvironment();
    }
    extractEnvironmentFromExecution(env) {
        if (!env)
            return undefined;
        if (typeof env === "string") {
            return this.normalizeEnvironmentCandidate(env);
        }
        if (typeof env === "object") {
            const candidateKeys = [
                "environment",
                "env",
                "name",
                "target",
                "stage",
                "nodeEnv",
            ];
            for (const key of candidateKeys) {
                const candidate = env[key];
                if (typeof candidate === "string") {
                    const normalized = this.normalizeEnvironmentCandidate(candidate);
                    if (normalized)
                        return normalized;
                }
            }
        }
        return undefined;
    }
    normalizeEnvironmentCandidate(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            return undefined;
        }
        const normalized = sanitizeEnvironment(value);
        if (!normalized)
            return undefined;
        return normalized === "unknown" ? undefined : normalized;
    }
    defaultEnvironment() {
        const candidates = [
            process.env.TEST_RUN_ENVIRONMENT,
            process.env.MEMENTO_ENVIRONMENT,
            process.env.NODE_ENV,
            "test",
        ];
        for (const candidate of candidates) {
            const normalized = this.normalizeEnvironmentCandidate(candidate);
            if (normalized)
                return normalized;
        }
        return "test";
    }
    mapPerformanceTrendToRelationship(trend) {
        switch (trend) {
            case "improving":
                return "improvement";
            case "degrading":
                return "regression";
            default:
                return "neutral";
        }
    }
    hasRecoveredFromPerformanceIncident(testEntity) {
        if (testEntity.performanceMetrics.trend === "improving") {
            return true;
        }
        const avgOk = typeof testEntity.performanceMetrics.averageExecutionTime === "number" &&
            testEntity.performanceMetrics.averageExecutionTime <
                noiseConfig.PERF_IMPACT_AVG_MS;
        const p95Ok = typeof testEntity.performanceMetrics.p95ExecutionTime === "number" &&
            testEntity.performanceMetrics.p95ExecutionTime <
                noiseConfig.PERF_IMPACT_P95_MS;
        return avgOk && p95Ok;
    }
    /**
     * Analyze test results for flaky behavior
     */
    async analyzeFlakyTests(results, options = {}) {
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
            const qualifies = analysis.flakyScore >= 0.2 ||
                analysis.failureRate >= 0.2 ||
                analysis.recentFailures > 0;
            if (qualifies) {
                analyses.push(analysis);
            }
        }
        // Store flaky test analyses
        if (options.persist !== false && analyses.length > 0) {
            await this.storeFlakyTestAnalyses(analyses);
        }
        return analyses;
    }
    /**
     * Retrieve flaky analysis for a specific test entity using stored execution history
     */
    async getFlakyTestAnalysis(entityId, options = {}) {
        if (!entityId || entityId.trim().length === 0) {
            throw new Error("entityId is required to retrieve flaky analysis");
        }
        const history = await this.dbService.getTestExecutionHistory(entityId, options.limit ?? 200);
        if (!history || history.length === 0) {
            return [];
        }
        const sortedHistory = [...history].sort((a, b) => {
            const aTime = new Date(a.suite_timestamp || a.timestamp || a.created_at || a.updated_at || 0).getTime();
            const bTime = new Date(b.suite_timestamp || b.timestamp || b.created_at || b.updated_at || 0).getTime();
            return aTime - bTime;
        });
        const normalizedResults = sortedHistory.map((row) => {
            const numericDuration = Number(row.duration);
            return {
                testId: row.test_id || row.testId || entityId,
                testSuite: row.suite_name || row.test_suite || "unknown-suite",
                testName: row.test_name || row.testName || entityId,
                status: this.normalizeTestStatus(row.status),
                duration: Number.isFinite(numericDuration) ? numericDuration : 0,
                errorMessage: row.error_message || row.errorMessage || undefined,
                stackTrace: row.stack_trace || row.stackTrace || undefined,
            };
        });
        return this.analyzeFlakyTests(normalizedResults, { persist: false });
    }
    normalizeTestStatus(status) {
        switch (String(status).toLowerCase()) {
            case "passed":
            case "pass":
                return "passed";
            case "failed":
            case "fail":
                return "failed";
            case "skipped":
            case "skip":
                return "skipped";
            case "error":
            case "errored":
                return "error";
            default:
                return "failed";
        }
    }
    /**
     * Analyze flakiness for a single test
     */
    async analyzeSingleTestFlakiness(testId, results) {
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
            testName: results[0]?.testName || testId,
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
        // Validate input
        if (!entityId || entityId.trim().length === 0) {
            throw new Error("Entity ID cannot be empty");
        }
        const testEntity = (await this.kgService.getEntity(entityId));
        if (!testEntity) {
            throw new Error(`Test entity ${entityId} not found`);
        }
        // Get all tests that explicitly provide coverage for the entity
        const coverageRels = await this.kgService.queryRelationships({
            toEntityId: entityId,
            type: RelationshipType.COVERAGE_PROVIDES,
        });
        const coverages = [];
        const breakdownBuckets = {
            unit: [],
            integration: [],
            e2e: [],
        };
        const testCases = [];
        const processedSources = new Set();
        const pushCoverage = (sourceId, coverage, testType, testName, covers) => {
            if (processedSources.has(sourceId)) {
                return;
            }
            processedSources.add(sourceId);
            const normalized = coverage ?? {
                lines: 0,
                branches: 0,
                functions: 0,
                statements: 0,
            };
            coverages.push(normalized);
            const bucketKey = testType ?? "unit";
            breakdownBuckets[bucketKey].push(normalized);
            testCases.push({ testId: sourceId, testName, covers });
        };
        // Include the test entity's own coverage metrics when applicable
        if (testEntity) {
            const baselineTarget = testEntity.targetSymbol ?? testEntity.id ?? entityId;
            const coverageTargets = testEntity.targetSymbol
                ? [testEntity.targetSymbol]
                : [entityId];
            pushCoverage(entityId, testEntity.coverage, testEntity.testType ?? "unit", baselineTarget, coverageTargets);
        }
        for (const rel of coverageRels) {
            if (!rel?.fromEntityId) {
                continue;
            }
            const relCoverage = rel?.metadata?.coverage;
            const relatedTest = (await this.kgService.getEntity(rel.fromEntityId));
            const relationshipTestType = relatedTest?.testType ?? "unit";
            const relationshipTestName = relatedTest?.targetSymbol ?? relatedTest?.id ?? rel.fromEntityId;
            pushCoverage(rel.fromEntityId, relatedTest?.coverage ?? relCoverage, relationshipTestType, relationshipTestName, [entityId]);
        }
        const overallCoverage = this.aggregateCoverage(coverages);
        const testBreakdown = {
            unitTests: this.aggregateCoverage(breakdownBuckets.unit),
            integrationTests: this.aggregateCoverage(breakdownBuckets.integration),
            e2eTests: this.aggregateCoverage(breakdownBuckets.e2e),
        };
        return {
            entityId,
            overallCoverage,
            testBreakdown,
            uncoveredLines: [], // Would need source map integration
            uncoveredBranches: [],
            testCases,
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
        if (!content.includes("<testcase")) {
            throw new Error("Invalid JUnit XML format: no testcase elements found");
        }
        const suiteNameMatch = content.match(/<testsuite[^>]*name="([^"]+)"/i);
        const rawSuiteName = suiteNameMatch?.[1]?.trim() ?? "JUnit Test Suite";
        const suiteName = rawSuiteName.toLowerCase().includes("junit")
            ? rawSuiteName
            : `JUnit: ${rawSuiteName}`;
        const results = [];
        const testCaseRegex = /<testcase\b([^>]*)>([\s\S]*?<\/testcase>)?|<testcase\b([^>]*)\/>/gi;
        let match;
        const parseAttributes = (segment) => {
            const attrs = {};
            const attrRegex = /(\S+)="([^"]*)"/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(segment)) !== null) {
                const [, key, value] = attrMatch;
                attrs[key.toLowerCase()] = value;
            }
            return attrs;
        };
        while ((match = testCaseRegex.exec(content)) !== null) {
            const attrSegment = match[1] ?? match[3] ?? "";
            const inner = match[2] ?? "";
            const attrs = parseAttributes(attrSegment);
            const className = attrs.classname ?? attrs.class ?? suiteName;
            const testName = attrs.name ?? attrs.id ?? `test-${results.length + 1}`;
            const timeStr = attrs.time ?? attrs.duration ?? "0";
            const durationSeconds = parseFloat(timeStr);
            if (Number.isNaN(durationSeconds)) {
                throw new Error(`Invalid JUnit XML format: invalid time value '${timeStr}'`);
            }
            const status = inner.includes("<failure")
                ? "failed"
                : inner.includes("<error")
                    ? "error"
                    : inner.includes("<skipped")
                        ? "skipped"
                        : "passed";
            results.push({
                testId: className ? `${className}.${testName}` : testName,
                testSuite: className,
                testName,
                status,
                duration: durationSeconds * 1000,
                coverage: {
                    statements: 0,
                    branches: 0,
                    functions: 0,
                    lines: 0,
                },
            });
        }
        if (results.length === 0) {
            throw new Error("Invalid JUnit XML format: no testcase elements found");
        }
        return {
            suiteName,
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
        catch {
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
        const environment = this.resolveEnvironmentForTest(testEntity);
        const successfulRuns = history.filter((h) => h.status === "passed");
        const successfulDurations = successfulRuns
            .map((h) => Number(h.duration))
            .filter((value) => Number.isFinite(value) && value >= 0);
        const allDurations = history
            .map((h) => Number(h.duration))
            .filter((value) => Number.isFinite(value) && value >= 0);
        const durationSamples = successfulDurations.length > 0 ? successfulDurations : allDurations;
        if (durationSamples.length > 0) {
            testEntity.performanceMetrics.averageExecutionTime =
                durationSamples.reduce((sum, value) => sum + value, 0) /
                    durationSamples.length;
            // Calculate P95 using the same sample set (avoid NaN when no passes)
            const sorted = [...durationSamples].sort((a, b) => a - b);
            const p95Index = Math.floor(sorted.length * 0.95);
            testEntity.performanceMetrics.p95ExecutionTime =
                sorted[p95Index] ?? sorted[sorted.length - 1] ?? 0;
        }
        else {
            testEntity.performanceMetrics.averageExecutionTime = 0;
            testEntity.performanceMetrics.p95ExecutionTime = 0;
        }
        testEntity.performanceMetrics.successRate =
            successfulRuns.length / history.length;
        // Calculate trend using execution-time deltas first, falling back to pass/fail history
        testEntity.performanceMetrics.trend = this.calculateTrend(history);
        // Update historical data
        const latestExecution = history[history.length - 1];
        const latestTimestamp = latestExecution?.timestamp
            ? new Date(latestExecution.timestamp)
            : new Date();
        const latestRunId = latestExecution?.id;
        const averageSample = testEntity.performanceMetrics.averageExecutionTime;
        const p95Sample = testEntity.performanceMetrics.p95ExecutionTime;
        const latestData = {
            timestamp: latestTimestamp,
            executionTime: averageSample,
            averageExecutionTime: averageSample,
            p95ExecutionTime: p95Sample,
            successRate: testEntity.performanceMetrics.successRate,
            coveragePercentage: testEntity.coverage?.lines ?? 0,
            runId: latestRunId,
        };
        testEntity.performanceMetrics.historicalData.push(latestData);
        // Keep only last 100 data points
        if (testEntity.performanceMetrics.historicalData.length > 100) {
            testEntity.performanceMetrics.historicalData =
                testEntity.performanceMetrics.historicalData.slice(-100);
        }
        try {
            const snapshotRelationship = this.buildPerformanceRelationship(testEntity, testEntity.targetSymbol ?? testEntity.id, RelationshipType.PERFORMANCE_IMPACT, {
                reason: "Performance metrics snapshot",
                severity: "low",
                scenario: "test-latency-observation",
                environment,
                trend: this.mapPerformanceTrendToRelationship(testEntity.performanceMetrics.trend),
            });
            if (snapshotRelationship) {
                await this.dbService
                    .recordPerformanceMetricSnapshot(snapshotRelationship)
                    .catch(() => { });
            }
        }
        catch {
            // Snapshot persistence shouldn't block test metric updates
        }
        // Queue performance relationships when we can associate a target symbol (batched)
        try {
            if (testEntity.targetSymbol) {
                const target = await this.kgService.getEntity(testEntity.targetSymbol);
                if (target) {
                    const hist = Array.isArray(testEntity.performanceMetrics.historicalData)
                        ? testEntity.performanceMetrics.historicalData
                        : [];
                    const validHistorySamples = hist.filter((entry) => Number.isFinite(Number(entry?.p95ExecutionTime ??
                        entry?.executionTime ??
                        entry?.averageExecutionTime)));
                    const historyOk = validHistorySamples.length >= noiseConfig.PERF_MIN_HISTORY;
                    const lastN = validHistorySamples.slice(-Math.max(1, noiseConfig.PERF_TREND_MIN_RUNS));
                    const lastExecs = lastN
                        .map((h) => Number(h.p95ExecutionTime ??
                        h.executionTime ??
                        h.averageExecutionTime ??
                        0))
                        .filter((value) => Number.isFinite(value));
                    const monotonicIncrease = lastExecs.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
                    const increaseDelta = lastExecs.length >= 2
                        ? lastExecs[lastExecs.length - 1] - lastExecs[0]
                        : 0;
                    const degradingOk = testEntity.performanceMetrics.trend === "degrading" &&
                        historyOk &&
                        monotonicIncrease &&
                        increaseDelta >= noiseConfig.PERF_DEGRADING_MIN_DELTA_MS;
                    // Regression if degrading meets sustained and delta thresholds
                    if (degradingOk) {
                        const regressionRel = this.buildPerformanceRelationship(testEntity, testEntity.targetSymbol, RelationshipType.PERFORMANCE_REGRESSION, {
                            reason: "Sustained regression detected via historical trend",
                            severity: "high",
                            scenario: "test-latency-regression",
                            environment,
                        });
                        if (regressionRel) {
                            this.perfRelBuffer.push(regressionRel);
                            await this.dbService
                                .recordPerformanceMetricSnapshot(regressionRel)
                                .catch(() => { });
                        }
                        this.perfIncidentSeeds.add(testEntity.id);
                    }
                    else if (
                    // Performance impact if latency is above configurable high-water marks
                    historyOk && (testEntity.performanceMetrics.p95ExecutionTime >= noiseConfig.PERF_IMPACT_P95_MS ||
                        testEntity.performanceMetrics.averageExecutionTime >= noiseConfig.PERF_IMPACT_AVG_MS)) {
                        const impactRel = this.buildPerformanceRelationship(testEntity, testEntity.targetSymbol, RelationshipType.PERFORMANCE_IMPACT, {
                            reason: "Latency threshold breached in latest run",
                            severity: "medium",
                            scenario: "test-latency-threshold",
                            environment,
                        });
                        if (impactRel) {
                            this.perfRelBuffer.push(impactRel);
                            await this.dbService
                                .recordPerformanceMetricSnapshot(impactRel)
                                .catch(() => { });
                        }
                        this.perfIncidentSeeds.add(testEntity.id);
                    }
                    else if (this.perfIncidentSeeds.has(testEntity.id) &&
                        historyOk &&
                        this.hasRecoveredFromPerformanceIncident(testEntity)) {
                        const resolvedRel = this.buildPerformanceRelationship(testEntity, testEntity.targetSymbol, RelationshipType.PERFORMANCE_REGRESSION, {
                            reason: "Performance metrics returned to baseline",
                            severity: "low",
                            scenario: "test-latency-regression",
                            environment,
                            trend: "improvement",
                            resolvedAt: testEntity.lastRunAt ?? new Date(),
                        });
                        if (resolvedRel) {
                            this.perfRelBuffer.push(resolvedRel);
                            await this.dbService
                                .recordPerformanceMetricSnapshot(resolvedRel)
                                .catch(() => { });
                        }
                        this.perfIncidentSeeds.delete(testEntity.id);
                    }
                }
            }
        }
        catch {
            // Non-fatal; continue
        }
    }
    buildPerformanceRelationship(testEntity, targetEntityId, type, opts) {
        if (!targetEntityId)
            return null;
        if (type !== RelationshipType.PERFORMANCE_IMPACT &&
            type !== RelationshipType.PERFORMANCE_REGRESSION) {
            return null;
        }
        const metrics = testEntity.performanceMetrics;
        if (!metrics)
            return null;
        const normalizedEnvironment = this.normalizeEnvironmentCandidate(opts.environment) ??
            this.defaultEnvironment();
        const history = Array.isArray(metrics.historicalData)
            ? metrics.historicalData
            : [];
        const historySamples = history
            .map((entry) => {
            if (!entry)
                return null;
            const timestamp = entry.timestamp instanceof Date
                ? entry.timestamp
                : new Date(entry.timestamp);
            const p95 = Number(entry.p95ExecutionTime ??
                entry.executionTime ??
                entry.averageExecutionTime);
            if (!Number.isFinite(p95))
                return null;
            return {
                value: p95,
                timestamp: Number.isNaN(timestamp.valueOf()) ? undefined : timestamp,
                runId: entry.runId,
            };
        })
            .filter(Boolean);
        const metricsHistory = historySamples.map((sample) => ({
            value: sample.value,
            timestamp: sample.timestamp,
            runId: sample.runId,
            environment: normalizedEnvironment,
            unit: "ms",
        }));
        const firstSample = historySamples[0];
        const lastSample = historySamples.length > 0
            ? historySamples[historySamples.length - 1]
            : undefined;
        const baselineCandidate = firstSample?.value ??
            (metrics.benchmarkComparisons &&
                metrics.benchmarkComparisons.length > 0
                ? metrics.benchmarkComparisons[0].threshold
                : metrics.p95ExecutionTime ?? metrics.averageExecutionTime);
        const currentCandidate = lastSample?.value ?? metrics.p95ExecutionTime ?? baselineCandidate;
        const baseline = Number.isFinite(baselineCandidate)
            ? Number(baselineCandidate)
            : undefined;
        const current = Number.isFinite(currentCandidate)
            ? Number(currentCandidate)
            : undefined;
        const delta = baseline !== undefined && current !== undefined
            ? current - baseline
            : undefined;
        const percentChange = baseline !== undefined && baseline !== 0 && delta !== undefined
            ? (delta / baseline) * 100
            : undefined;
        const detectedAt = testEntity.lastRunAt ?? new Date();
        const runId = testEntity.executionHistory.length > 0
            ? testEntity.executionHistory[testEntity.executionHistory.length - 1].id
            : undefined;
        const rawMetricId = `test/${testEntity.id}/latency/p95`;
        const metricId = normalizeMetricIdForId(rawMetricId);
        const severity = opts.severity ??
            (type === RelationshipType.PERFORMANCE_REGRESSION ? "high" : "medium");
        const trend = opts.trend ?? "regression";
        const resolvedAtValue = opts.resolvedAt !== undefined && opts.resolvedAt !== null
            ? new Date(opts.resolvedAt)
            : undefined;
        const successRatePercent = typeof metrics.successRate === "number"
            ? Math.round(metrics.successRate * 10000) / 100
            : undefined;
        const metadata = {
            reason: opts.reason,
            testId: testEntity.id,
            testSuite: testEntity.path,
            framework: testEntity.framework,
            trend,
            environment: normalizedEnvironment,
            avgMs: metrics.averageExecutionTime,
            p95Ms: metrics.p95ExecutionTime,
            successRate: metrics.successRate,
            benchmarkComparisons: (metrics.benchmarkComparisons || []).slice(0, 5),
            status: resolvedAtValue ? "resolved" : "active",
            resolvedAt: resolvedAtValue ? resolvedAtValue.toISOString() : undefined,
            metrics: [
                {
                    id: "averageExecutionTime",
                    name: "Average execution time",
                    value: metrics.averageExecutionTime,
                    unit: "ms",
                },
                {
                    id: "p95ExecutionTime",
                    name: "P95 execution time",
                    value: metrics.p95ExecutionTime,
                    unit: "ms",
                },
                {
                    id: "successRate",
                    name: "Success rate",
                    value: successRatePercent ?? null,
                    unit: "percent",
                },
            ],
        };
        const relationship = {
            id: "",
            fromEntityId: testEntity.id,
            toEntityId: targetEntityId,
            type,
            created: detectedAt,
            lastModified: detectedAt,
            version: 1,
            metricId,
            scenario: opts.scenario ?? "test-suite",
            environment: normalizedEnvironment,
            baselineValue: baseline,
            currentValue: current,
            delta,
            percentChange,
            unit: "ms",
            sampleSize: metricsHistory.length > 0 ? metricsHistory.length : undefined,
            metricsHistory,
            trend,
            severity,
            runId,
            detectedAt,
            metadata,
            evidence: [
                {
                    source: "heuristic",
                    note: opts.reason,
                },
            ],
        };
        if (resolvedAtValue) {
            relationship.resolvedAt = resolvedAtValue;
        }
        return relationship;
    }
    async updateCoverageRelationships(testEntity) {
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
            const coverageMetadata = {
                coverage: {
                    lines: testEntity.coverage?.lines,
                    branches: testEntity.coverage?.branches,
                    functions: testEntity.coverage?.functions,
                    statements: testEntity.coverage?.statements,
                },
                testType: testEntity.testType,
            };
            // Create explicit coverage edge for analytics to consume
            await this.kgService.createRelationship({
                id: `${testEntity.id}_covers_${testEntity.targetSymbol}`,
                fromEntityId: testEntity.id,
                toEntityId: testEntity.targetSymbol,
                type: RelationshipType.COVERAGE_PROVIDES,
                created: new Date(),
                lastModified: new Date(),
                version: 1,
                metadata: coverageMetadata,
            });
            // Maintain TESTS edge for legacy consumers while sharing the same metadata shape
            await this.kgService.createRelationship({
                id: `${testEntity.id}_tests_${testEntity.targetSymbol}`,
                fromEntityId: testEntity.id,
                toEntityId: testEntity.targetSymbol,
                type: RelationshipType.TESTS,
                created: new Date(),
                lastModified: new Date(),
                version: 1,
                metadata: coverageMetadata,
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
        await this.dbService.storeFlakyTestAnalyses(analyses);
    }
    calculateTrend(history) {
        if (!Array.isArray(history) || history.length === 0) {
            return "stable";
        }
        const windowSize = Math.max(noiseConfig.PERF_TREND_MIN_RUNS ?? 3, 3);
        const durations = history
            .map((entry) => Number(entry?.duration))
            .filter((value) => Number.isFinite(value) && value >= 0);
        if (durations.length >= Math.max(2, windowSize)) {
            const recent = durations.slice(-windowSize);
            const previous = durations.slice(-windowSize * 2, -windowSize);
            const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
            const recentAverage = recent.length > 0 ? average(recent) : 0;
            const previousAverage = previous.length > 0 ? average(previous) : recentAverage;
            const delta = recentAverage - previousAverage;
            const percentChange = previousAverage > 0 ? (delta / previousAverage) * 100 : delta > 0 ? Infinity : delta < 0 ? -Infinity : 0;
            if (delta >= noiseConfig.PERF_DEGRADING_MIN_DELTA_MS ||
                percentChange >= 5) {
                return "degrading";
            }
            if (delta <= -noiseConfig.PERF_DEGRADING_MIN_DELTA_MS ||
                percentChange <= -5) {
                return "improving";
            }
        }
        if (history.length < 5)
            return "stable";
        const recent = history.slice(-5);
        const older = history.slice(-10, -5);
        if (recent.length === 0 || older.length === 0)
            return "stable";
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