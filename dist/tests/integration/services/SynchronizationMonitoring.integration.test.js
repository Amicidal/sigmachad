/**
 * Integration tests for SynchronizationMonitoring service
 * Tests comprehensive monitoring, metrics collection, and alerting functionality
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, } from "vitest";
import { SynchronizationMonitoring, } from "../../../src/services/SynchronizationMonitoring";
describe("SynchronizationMonitoring Integration", () => {
    let monitoring;
    beforeAll(async () => {
        // Use fake timers to avoid long real-time waits and reduce flakiness
        vi.useFakeTimers();
        monitoring = new SynchronizationMonitoring();
    });
    afterAll(async () => {
        monitoring.stopHealthMonitoring();
        vi.useRealTimers();
    });
    beforeEach(async () => {
        // Clear any existing state
        monitoring.cleanup();
    });
    describe("Operation Lifecycle Monitoring", () => {
        it("should track complete operation lifecycle from start to completion", async () => {
            const operationId = "test-operation-1";
            const operation = {
                id: operationId,
                type: "full_sync",
                status: "running",
                startTime: new Date(),
                filesProcessed: 10,
                entitiesCreated: 5,
                entitiesUpdated: 3,
                entitiesDeleted: 1,
                relationshipsCreated: 8,
                relationshipsUpdated: 2,
                relationshipsDeleted: 0,
                errors: [],
                conflicts: [],
            };
            // Record operation start
            monitoring.recordOperationStart(operation);
            // Verify operation is tracked
            const activeOps = monitoring.getActiveOperations();
            expect(activeOps).toContain(operation);
            // Simulate some processing time deterministically
            vi.advanceTimersByTime(100);
            // Record operation completion
            operation.endTime = new Date();
            monitoring.recordOperationComplete(operation);
            // Verify operation is no longer active
            const activeOpsAfter = monitoring.getActiveOperations();
            expect(activeOpsAfter).not.toContain(operation);
            // Check metrics were updated
            const metrics = monitoring.getSyncMetrics();
            expect(metrics.operationsTotal).toBe(1);
            expect(metrics.operationsSuccessful).toBe(1);
            expect(metrics.operationsFailed).toBe(0);
            expect(metrics.totalEntitiesProcessed).toBe(9); // 5 + 3 + 1
            expect(metrics.totalRelationshipsProcessed).toBe(10); // 8 + 2 + 0
        });
        it("should handle operation failures and update failure metrics", async () => {
            const operationId = "test-operation-failed";
            const operation = {
                id: operationId,
                type: "incremental_sync",
                status: "running",
                startTime: new Date(),
                filesProcessed: 5,
                entitiesCreated: 2,
                entitiesUpdated: 1,
                entitiesDeleted: 0,
                relationshipsCreated: 3,
                relationshipsUpdated: 1,
                relationshipsDeleted: 0,
                errors: [
                    {
                        type: "parse_error",
                        file: "test.ts",
                        message: "Syntax error",
                        recoverable: false,
                    },
                ],
                conflicts: [],
            };
            // Record operation start
            monitoring.recordOperationStart(operation);
            // Record operation failure
            const error = new Error("Test operation failure");
            monitoring.recordOperationFailed(operation, error);
            // Check metrics were updated
            const metrics = monitoring.getSyncMetrics();
            expect(metrics.operationsTotal).toBe(1);
            expect(metrics.operationsSuccessful).toBe(0);
            expect(metrics.operationsFailed).toBe(1);
            expect(metrics.errorRate).toBe(1.0); // 1/1 = 100% error rate
        });
        it("should track multiple concurrent operations", async () => {
            const operations = [];
            // Create multiple operations
            for (let i = 0; i < 3; i++) {
                const operation = {
                    id: `concurrent-op-${i}`,
                    type: "full_sync",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: i + 1,
                    entitiesCreated: i * 2,
                    entitiesUpdated: i,
                    entitiesDeleted: 0,
                    relationshipsCreated: i * 3,
                    relationshipsUpdated: i,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                operations.push(operation);
                monitoring.recordOperationStart(operation);
            }
            // Verify all operations are tracked
            const activeOps = monitoring.getActiveOperations();
            expect(activeOps.length).toBe(3);
            operations.forEach((op) => {
                expect(activeOps).toContain(op);
            });
            // Complete operations with some delay to simulate real processing
            for (const operation of operations) {
                vi.advanceTimersByTime(50);
                operation.endTime = new Date();
                monitoring.recordOperationComplete(operation);
            }
            // Verify all operations completed
            const activeOpsAfter = monitoring.getActiveOperations();
            expect(activeOpsAfter.length).toBe(0);
            // Check aggregate metrics
            const metrics = monitoring.getSyncMetrics();
            expect(metrics.operationsTotal).toBe(3);
            expect(metrics.operationsSuccessful).toBe(3);
            expect(metrics.totalEntitiesProcessed).toBe(9); // (0+0+0) + (2+1+0) + (4+2+0) = 0 + 3 + 6 = 9
            expect(metrics.totalRelationshipsProcessed).toBe(12); // (0+0+0) + (3+1+0) + (6+2+0) = 0 + 4 + 8 = 12
        });
    });
    describe("Performance Metrics Integration", () => {
        it("should collect and update performance metrics during operations", async () => {
            const operation = {
                id: "perf-test-op",
                type: "performance_test",
                status: "running",
                startTime: new Date(),
                filesProcessed: 1,
                entitiesCreated: 1,
                entitiesUpdated: 0,
                entitiesDeleted: 0,
                relationshipsCreated: 1,
                relationshipsUpdated: 0,
                relationshipsDeleted: 0,
                errors: [],
                conflicts: [],
            };
            // Record operation and complete it
            monitoring.recordOperationStart(operation);
            vi.advanceTimersByTime(200);
            operation.endTime = new Date();
            monitoring.recordOperationComplete(operation);
            // Check performance metrics
            const perfMetrics = monitoring.getPerformanceMetrics();
            expect(perfMetrics).toBeDefined();
            expect(typeof perfMetrics.averageParseTime).toBe("number");
            expect(typeof perfMetrics.averageGraphUpdateTime).toBe("number");
            expect(typeof perfMetrics.averageEmbeddingTime).toBe("number");
            expect(typeof perfMetrics.memoryUsage).toBe("number");
            expect(typeof perfMetrics.cacheHitRate).toBe("number");
            expect(typeof perfMetrics.ioWaitTime).toBe("number");
            // Memory usage should be a reasonable number
            expect(perfMetrics.memoryUsage).toBeGreaterThan(0);
            expect(perfMetrics.cacheHitRate).toBeGreaterThanOrEqual(0);
            expect(perfMetrics.cacheHitRate).toBeLessThanOrEqual(1);
        });
        it("should maintain performance metrics across multiple operations", async () => {
            // Run multiple operations to test metric aggregation
            for (let i = 0; i < 5; i++) {
                const operation = {
                    id: `perf-multi-${i}`,
                    type: "performance_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 1,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 1,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                vi.advanceTimersByTime(10);
                operation.endTime = new Date();
                monitoring.recordOperationComplete(operation);
            }
            const perfMetrics = monitoring.getPerformanceMetrics();
            expect(perfMetrics.memoryUsage).toBeGreaterThan(0);
            // Cache hit rate should be updated (set to 0.85 in the service)
            expect(perfMetrics.cacheHitRate).toBe(0.85);
        });
    });
    describe("Health Monitoring Integration", () => {
        it("should perform health checks and update health metrics", async () => {
            // Wait for a health check cycle
            vi.advanceTimersByTime(31000); // Fast-forward > 30 seconds
            const healthMetrics = monitoring.getHealthMetrics();
            expect(healthMetrics).toBeDefined();
            expect(["healthy", "degraded", "unhealthy"]).toContain(healthMetrics.overallHealth);
            expect(healthMetrics.lastSyncTime).toBeInstanceOf(Date);
            expect(typeof healthMetrics.consecutiveFailures).toBe("number");
            expect(typeof healthMetrics.queueDepth).toBe("number");
            expect(typeof healthMetrics.activeOperations).toBe("number");
            expect(typeof healthMetrics.systemLoad).toBe("number");
        });
        it("should handle health degradation based on error rates", async () => {
            // Create several failed operations to trigger health degradation
            for (let i = 0; i < 4; i++) {
                const operation = {
                    id: `health-fail-${i}`,
                    type: "test_sync",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 0,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 0,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [
                        {
                            type: "test_error",
                            file: "test.ts",
                            message: "Test failure",
                            recoverable: false,
                        },
                    ],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, new Error("Test failure"));
            }
            // Check health status
            const healthMetrics = monitoring.getHealthMetrics();
            expect(["degraded", "unhealthy"]).toContain(healthMetrics.overallHealth);
            expect(healthMetrics.consecutiveFailures).toBeGreaterThanOrEqual(4);
        });
        it("should recover health status after successful operations", async () => {
            // First create some failed operations
            for (let i = 0; i < 2; i++) {
                const operation = {
                    id: `recovery-fail-${i}`,
                    type: "test_sync",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 0,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 0,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [
                        {
                            type: "test_error",
                            file: "test.ts",
                            message: "Test failure",
                            recoverable: false,
                        },
                    ],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, new Error("Test failure"));
            }
            // Then create successful operations
            for (let i = 0; i < 3; i++) {
                const operation = {
                    id: `recovery-success-${i}`,
                    type: "test_sync",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 1,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 1,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                operation.endTime = new Date();
                monitoring.recordOperationComplete(operation);
            }
            const healthMetrics = monitoring.getHealthMetrics();
            // Health should improve with successful operations
            expect(["healthy", "degraded"]).toContain(healthMetrics.overallHealth);
        });
    });
    describe("Alert System Integration", () => {
        it("should trigger and manage alerts for operation failures", async () => {
            const operation = {
                id: "alert-test-op",
                type: "alert_test",
                status: "running",
                startTime: new Date(),
                filesProcessed: 1,
                entitiesCreated: 0,
                entitiesUpdated: 0,
                entitiesDeleted: 0,
                relationshipsCreated: 0,
                relationshipsUpdated: 0,
                relationshipsDeleted: 0,
                errors: [
                    {
                        type: "critical_error",
                        file: "critical.ts",
                        message: "Critical failure",
                        recoverable: false,
                    },
                ],
                conflicts: [],
            };
            // Record operation failure (this should trigger an alert internally)
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, new Error("Critical failure"));
            // Check for active alerts
            const activeAlerts = monitoring.getAlerts(true);
            expect(activeAlerts.length).toBeGreaterThanOrEqual(1);
            // Find the error alert
            const errorAlert = activeAlerts.find((alert) => alert.type === "error");
            expect(errorAlert).toBeDefined();
            expect(errorAlert?.message).toContain("failed");
            expect(errorAlert?.operationId).toBe("alert-test-op");
            expect(errorAlert?.resolved).toBe(false);
            // Resolve the alert
            const resolved = monitoring.resolveAlert(errorAlert.id, "Issue resolved");
            expect(resolved).toBe(true);
            // Verify alert is resolved
            const allAlertsAfter = monitoring.getAlerts(false); // Get all alerts including resolved ones
            const resolvedAlert = allAlertsAfter.find((alert) => alert.id === errorAlert.id);
            expect(resolvedAlert?.resolved).toBe(true);
            expect(resolvedAlert?.resolution).toBe("Issue resolved");
        });
        it("should trigger alerts for health degradation", async () => {
            // Create enough failures to trigger health alerts
            for (let i = 0; i < 5; i++) {
                const operation = {
                    id: `health-alert-${i}`,
                    type: "health_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 0,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 0,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [
                        {
                            type: "health_test_error",
                            file: "health.ts",
                            message: "Health test failure",
                            recoverable: false,
                        },
                    ],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, new Error("Health test failure"));
            }
            // Wait for health check to trigger alerts
            vi.advanceTimersByTime(31000);
            // Check for health-related alerts
            const allAlerts = monitoring.getAlerts();
            const healthAlerts = allAlerts.filter((alert) => alert.message.includes("health") ||
                alert.message.includes("unhealthy"));
            // Should have at least one health alert
            expect(healthAlerts.length).toBeGreaterThanOrEqual(1);
        });
        it("should maintain alert history and limit alert count", async () => {
            // Create many alerts to test the limit (service keeps last 100)
            for (let i = 0; i < 110; i++) {
                const operation = {
                    id: `limit-test-${i}`,
                    type: "limit_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 0,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 0,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [
                        {
                            type: "limit_test_error",
                            file: "limit.ts",
                            message: "Limit test failure",
                            recoverable: false,
                        },
                    ],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                monitoring.recordOperationFailed(operation, new Error("Limit test failure"));
            }
            // Check that alerts are limited
            const allAlerts = monitoring.getAlerts();
            expect(allAlerts.length).toBeLessThanOrEqual(100);
        });
    });
    describe("Logging Integration", () => {
        it("should maintain comprehensive operation logs", async () => {
            const operationId = "logging-test-op";
            const operation = {
                id: operationId,
                type: "logging_test",
                status: "running",
                startTime: new Date(),
                filesProcessed: 5,
                entitiesCreated: 3,
                entitiesUpdated: 2,
                entitiesDeleted: 0,
                relationshipsCreated: 4,
                relationshipsUpdated: 1,
                relationshipsDeleted: 0,
                errors: [],
                conflicts: [],
            };
            // Record operation lifecycle
            monitoring.recordOperationStart(operation);
            monitoring.recordError(operationId, {
                type: "test_error",
                file: "test.ts",
                message: "Test error message",
                recoverable: true,
            });
            operation.endTime = new Date();
            monitoring.recordOperationComplete(operation);
            // Check logs for this operation
            const operationLogs = monitoring.getLogsByOperation(operationId);
            expect(operationLogs.length).toBeGreaterThan(0);
            // Should have start, error, and completion logs
            const logLevels = operationLogs.map((log) => log.level);
            expect(logLevels).toContain("info"); // Start and completion logs
            expect(logLevels).toContain("error"); // Error log
            // Verify log content
            const errorLog = operationLogs.find((log) => log.level === "error");
            expect(errorLog?.message).toContain("Test error message");
            expect(errorLog?.data?.file).toBe("test.ts");
        });
        it("should limit log entries to prevent memory issues", async () => {
            // Create many log entries
            for (let i = 0; i < 1100; i++) {
                const operation = {
                    id: `log-limit-${i}`,
                    type: "log_limit_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 1,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 1,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                operation.endTime = new Date();
                monitoring.recordOperationComplete(operation);
            }
            // Check that logs are limited (service keeps last 1000)
            const allLogs = monitoring.getLogs();
            expect(allLogs.length).toBeLessThanOrEqual(1000);
        });
    });
    describe("Report Generation Integration", () => {
        it("should generate comprehensive monitoring reports", async () => {
            // Create some operations for the report
            for (let i = 0; i < 3; i++) {
                const operation = {
                    id: `report-op-${i}`,
                    type: "report_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: i + 1,
                    entitiesCreated: i * 2,
                    entitiesUpdated: i,
                    entitiesDeleted: 0,
                    relationshipsCreated: i * 3,
                    relationshipsUpdated: i,
                    relationshipsDeleted: 0,
                    errors: i === 2
                        ? [
                            {
                                type: "report_test_error",
                                file: "report.ts",
                                message: "Report test error",
                                recoverable: true,
                            },
                        ]
                        : [],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                if (i === 2) {
                    monitoring.recordOperationFailed(operation, new Error("Report test error"));
                }
                else {
                    operation.endTime = new Date();
                    monitoring.recordOperationComplete(operation);
                }
            }
            // Generate report
            const report = monitoring.generateReport();
            // Verify report structure
            expect(report).toBeDefined();
            expect(report.summary).toBeDefined();
            expect(report.performance).toBeDefined();
            expect(report.health).toBeDefined();
            expect(report.recentOperations).toBeDefined();
            expect(report.activeAlerts).toBeDefined();
            // Verify summary data
            expect(report.summary.operationsTotal).toBe(3);
            expect(report.summary.operationsSuccessful).toBe(2);
            expect(report.summary.operationsFailed).toBe(1);
            expect(typeof report.summary.averageSyncTime).toBe("number");
            expect(typeof report.summary.errorRate).toBe("number");
            expect(typeof report.summary.throughput).toBe("number");
            // Verify performance data
            expect(typeof report.performance.memoryUsage).toBe("number");
            expect(typeof report.performance.cacheHitRate).toBe("number");
            // Verify health data
            expect(["healthy", "degraded", "unhealthy"]).toContain(report.health.overallHealth);
            // Verify recent operations
            expect(report.recentOperations).toEqual(expect.any(Array));
            expect(report.recentOperations.length).toBeGreaterThan(0);
        });
    });
    describe("Data Cleanup Integration", () => {
        it("should clean up old data to prevent memory leaks", async () => {
            // Create operations with old timestamps
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
            for (let i = 0; i < 5; i++) {
                const operation = {
                    id: `old-op-${i}`,
                    type: "cleanup_test",
                    status: "completed",
                    startTime: oldDate,
                    endTime: new Date(oldDate.getTime() + 1000),
                    filesProcessed: 1,
                    entitiesCreated: 1,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 1,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                // Manually add old operations (simulating historical data)
                monitoring.operations.set(operation.id, operation);
            }
            // Create some recent operations
            for (let i = 0; i < 3; i++) {
                const operation = {
                    id: `recent-op-${i}`,
                    type: "cleanup_test",
                    status: "running",
                    startTime: new Date(),
                    filesProcessed: 1,
                    entitiesCreated: 1,
                    entitiesUpdated: 0,
                    entitiesDeleted: 0,
                    relationshipsCreated: 1,
                    relationshipsUpdated: 0,
                    relationshipsDeleted: 0,
                    errors: [],
                    conflicts: [],
                };
                monitoring.recordOperationStart(operation);
                operation.endTime = new Date();
                monitoring.recordOperationComplete(operation);
            }
            // Verify we have both old and new operations
            expect(monitoring.operations.size).toBeGreaterThan(5);
            // Clean up old data (24 hour default)
            monitoring.cleanup();
            // Verify old operations were cleaned up
            const remainingOps = Array.from(monitoring.operations.values());
            const oldOps = remainingOps.filter((op) => op.startTime.getTime() < Date.now() - 24 * 60 * 60 * 1000);
            expect(oldOps.length).toBe(0);
            // Recent operations should remain
            const recentOps = remainingOps.filter((op) => op.startTime.getTime() > Date.now() - 60 * 60 * 1000);
            expect(recentOps.length).toBeGreaterThan(0);
        });
        it("should clean up old logs and alerts", async () => {
            // Create old logs by directly adding them
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
            // Add old logs
            for (let i = 0; i < 10; i++) {
                const logEntry = {
                    timestamp: oldDate,
                    level: "info",
                    operationId: `old-log-op-${i}`,
                    message: `Old log message ${i}`,
                    data: { test: true },
                };
                monitoring.logs.push(logEntry);
            }
            // Add old alerts
            for (let i = 0; i < 5; i++) {
                const alert = {
                    id: `old-alert-${i}`,
                    type: "warning",
                    message: `Old alert ${i}`,
                    timestamp: oldDate,
                    resolved: false,
                };
                monitoring.alerts.push(alert);
            }
            // Verify old data exists
            expect(monitoring.logs.length).toBeGreaterThan(5);
            expect(monitoring.alerts.length).toBeGreaterThan(3);
            // Clean up
            monitoring.cleanup();
            // Verify old data was cleaned up
            const recentLogs = monitoring.logs.filter((log) => log.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000);
            expect(recentLogs.length).toBe(monitoring.logs.length); // All logs should be recent
            // Old unresolved alerts should be cleaned up
            const oldUnresolvedAlerts = monitoring.alerts.filter((alert) => alert.timestamp.getTime() < Date.now() - 24 * 60 * 60 * 1000 &&
                !alert.resolved);
            expect(oldUnresolvedAlerts.length).toBe(0);
        });
    });
    describe("Event Emission Integration", () => {
        it("should emit events for operation lifecycle", async () => {
            const events = [];
            const operationId = "event-test-op";
            // Listen for events
            monitoring.on("operationStarted", () => events.push("operationStarted"));
            monitoring.on("operationCompleted", () => events.push("operationCompleted"));
            const operation = {
                id: operationId,
                type: "event_test",
                status: "running",
                startTime: new Date(),
                filesProcessed: 1,
                entitiesCreated: 1,
                entitiesUpdated: 0,
                entitiesDeleted: 0,
                relationshipsCreated: 1,
                relationshipsUpdated: 0,
                relationshipsDeleted: 0,
                errors: [],
                conflicts: [],
            };
            // Trigger events
            monitoring.recordOperationStart(operation);
            operation.endTime = new Date();
            monitoring.recordOperationComplete(operation);
            // Verify events were emitted
            expect(events).toContain("operationStarted");
            expect(events).toContain("operationCompleted");
        });
        it("should emit alert and health events", async () => {
            const events = [];
            // Listen for events
            monitoring.on("alertTriggered", () => events.push("alertTriggered"));
            monitoring.on("healthCheck", () => events.push("healthCheck"));
            // Trigger alert
            const operation = {
                id: "alert-event-test",
                type: "alert_event_test",
                status: "running",
                startTime: new Date(),
                filesProcessed: 1,
                entitiesCreated: 0,
                entitiesUpdated: 0,
                entitiesDeleted: 0,
                relationshipsCreated: 0,
                relationshipsUpdated: 0,
                relationshipsDeleted: 0,
                errors: [
                    {
                        type: "event_test_error",
                        file: "event.ts",
                        message: "Event test error",
                        recoverable: false,
                    },
                ],
                conflicts: [],
            };
            monitoring.recordOperationStart(operation);
            monitoring.recordOperationFailed(operation, new Error("Event test error"));
            // Health check should trigger periodically
            vi.advanceTimersByTime(31000);
            // Verify events were emitted
            expect(events).toContain("alertTriggered");
            expect(events).toContain("healthCheck");
        });
    });
});
//# sourceMappingURL=SynchronizationMonitoring.integration.test.js.map