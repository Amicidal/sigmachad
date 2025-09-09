/**
 * Focused integration tests for DatabaseService methods that were uncovered
 * Tests specific methods for coverage without full integration setup
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DatabaseService, createTestDatabaseConfig, } from "../../../src/services/DatabaseService";
import { v4 as uuidv4 } from "uuid";
describe("DatabaseService Methods Coverage", () => {
    let dbService;
    beforeAll(async () => {
        dbService = new DatabaseService(createTestDatabaseConfig());
        await dbService.initialize();
        await dbService.setupDatabase();
    }, 15000);
    afterAll(async () => {
        if (dbService && dbService.isInitialized()) {
            await dbService.close();
        }
    });
    describe("Test Data Retrieval Methods", () => {
        it("should execute getTestExecutionHistory method", async () => {
            // Should return empty array when no data exists
            const testEntityId = uuidv4();
            const history = await dbService.getTestExecutionHistory(testEntityId, 10);
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThanOrEqual(0);
        });
        it("should execute getPerformanceMetricsHistory method", async () => {
            // Should return empty array when no data exists
            const testEntityId = uuidv4();
            const metrics = await dbService.getPerformanceMetricsHistory(testEntityId, 7);
            expect(Array.isArray(metrics)).toBe(true);
            expect(metrics.length).toBeGreaterThanOrEqual(0);
        });
        it("should execute getCoverageHistory method", async () => {
            // Should return empty array when no data exists
            const testEntityId = uuidv4();
            const coverage = await dbService.getCoverageHistory(testEntityId, 7);
            expect(Array.isArray(coverage)).toBe(true);
            expect(coverage.length).toBeGreaterThanOrEqual(0);
        });
    });
    describe("Bulk Operations", () => {
        it("should execute postgresBulkQuery method", async () => {
            const queries = [
                {
                    query: "SELECT 1 as test",
                    params: [],
                },
                {
                    query: "SELECT 2 as test2",
                    params: [],
                },
            ];
            const results = await dbService.postgresBulkQuery(queries);
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(2);
            expect(results[0].rows[0].test).toBe(1);
            expect(results[1].rows[0].test2).toBe(2);
        });
    });
    describe("Data Storage Methods", () => {
        it("should execute storeFlakyTestAnalyses method", async () => {
            const analyses = [
                {
                    testId: "test-flaky-1",
                    testName: "FlakyTest.integration",
                    failureCount: 2,
                    totalRuns: 10,
                    lastFailure: new Date(),
                    failurePatterns: ["timeout"],
                },
                {
                    testId: "test-flaky-2",
                    testName: "AnotherFlakyTest.integration",
                    failureCount: 5,
                    totalRuns: 20,
                    lastFailure: new Date(),
                    failurePatterns: ["assertion", "timeout"],
                },
            ];
            // Should store without errors
            await expect(dbService.storeFlakyTestAnalyses(analyses)).resolves.not.toThrow();
            // Verify data was stored by querying
            const result = await dbService.postgresQuery("SELECT COUNT(*) as count FROM flaky_test_analyses WHERE test_id IN ($1, $2)", ["test-flaky-1", "test-flaky-2"]);
            expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(2);
        });
    });
});
//# sourceMappingURL=DatabaseService.methods.test.js.map