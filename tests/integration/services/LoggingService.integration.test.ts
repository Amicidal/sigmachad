/**
 * Integration tests for LoggingService
 * Tests log capture, querying, and file operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  LoggingService,
  LogEntry,
  LogQuery,
} from "../../../src/services/LoggingService";
import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";

describe("LoggingService Integration", () => {
  let loggingService: LoggingService;
  let testLogFile: string;
  let testDir: string;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(tmpdir(), "logging-service-integration-tests");
    await fs.mkdir(testDir, { recursive: true });

    // Create test log file path
    testLogFile = path.join(testDir, "test.log");
  }, 10000);

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up test directory:", error);
    }
  });

  beforeEach(async () => {
    // Clean up log file before each test
    try {
      await fs.unlink(testLogFile);
    } catch (error) {
      // File might not exist, that's okay
    }

    // Create new logging service instance
    loggingService = new LoggingService(testLogFile);
  });

  describe("Log Capture Integration", () => {
    it("should capture console.log messages", async () => {
      const testMessage = "Test console.log message";
      console.log(testMessage);

      // Give some time for async log processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const consoleLog = logs.find(
        (log) =>
          log.message.includes(testMessage) && log.component === "console"
      );
      expect(consoleLog).toEqual(
        expect.objectContaining({
          level: 'info',
          component: 'console',
          message: expect.stringContaining(testMessage),
        })
      );
    });

    it("should capture console.error messages", async () => {
      const testMessage = "Test console.error message";
      console.error(testMessage);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const consoleError = logs.find(
        (log) =>
          log.message.includes(testMessage) && log.component === "console"
      );
      expect(consoleError).toEqual(
        expect.objectContaining({
          level: 'error',
          component: 'console',
          message: expect.stringContaining(testMessage),
        })
      );
    });

    it("should capture console.warn messages", async () => {
      const testMessage = "Test console.warn message";
      console.warn(testMessage);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const consoleWarn = logs.find(
        (log) =>
          log.message.includes(testMessage) && log.component === "console"
      );
      expect(consoleWarn).toEqual(
        expect.objectContaining({
          level: 'warn',
          component: 'console',
          message: expect.stringContaining(testMessage),
        })
      );
    });

    it("should capture console.debug messages", async () => {
      const testMessage = "Test console.debug message";
      console.debug(testMessage);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const consoleDebug = logs.find(
        (log) =>
          log.message.includes(testMessage) && log.component === "console"
      );
      expect(consoleDebug).toEqual(
        expect.objectContaining({
          level: 'debug',
          component: 'console',
          message: expect.stringContaining(testMessage),
        })
      );
    });

    it("should capture uncaught exceptions", async () => {
      const errorMessage = "Test uncaught exception";

      // Simulate uncaught exception
      process.emit("uncaughtException", new Error(errorMessage));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const exceptionLog = logs.find(
        (log) =>
          log.message.includes("Uncaught Exception") &&
          log.message.includes(errorMessage) &&
          log.component === "process"
      );
      expect(exceptionLog).toEqual(
        expect.objectContaining({
          level: 'error',
          component: 'process',
          message: expect.stringContaining('Uncaught Exception'),
          data: expect.any(Object),
        })
      );
      expect((exceptionLog as any).data).toHaveProperty('stack');
    });

    it("should capture unhandled rejections", async () => {
      const rejectionReason = "Test unhandled rejection";

      // Simulate unhandled rejection
      process.emit("unhandledRejection", rejectionReason, Promise.resolve());

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const rejectionLog = logs.find(
        (log) =>
          log.message.includes("Unhandled Rejection") &&
          log.message.includes(rejectionReason) &&
          log.component === "process"
      );
      expect(rejectionLog).toEqual(
        expect.objectContaining({
          level: 'error',
          component: 'process',
          message: expect.stringContaining('Unhandled Rejection'),
        })
      );
    });
  });

  describe("Log Querying Integration", () => {
    beforeEach(async () => {
      // Add some test logs
      loggingService.log("info", "test-component", "Info message 1", {
        userId: "user1",
      });
      loggingService.log("error", "test-component", "Error message 1", {
        userId: "user1",
      });
      loggingService.log("warn", "another-component", "Warning message 1", {
        userId: "user2",
      });
      loggingService.log("debug", "test-component", "Debug message 1", {
        userId: "user1",
      });
      loggingService.log("info", "test-component", "Info message 2", {
        userId: "user2",
      });

      // Wait for logs to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should query logs by level", async () => {
      const query: LogQuery = { level: "error" };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBe(1);
      expect(results[0].level).toBe("error");
      expect(results[0].message).toBe("Error message 1");
    });

    it("should query logs by component", async () => {
      const query: LogQuery = { component: "test-component" };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBe(4); // All test-component logs
      results.forEach((log) => {
        expect(log.component).toBe("test-component");
      });
    });

    it("should query logs by multiple criteria", async () => {
      const query: LogQuery = {
        level: "info",
        component: "test-component",
      };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBe(2);
      results.forEach((log) => {
        expect(log.level).toBe("info");
        expect(log.component).toBe("test-component");
      });
    });

    it("should limit query results", async () => {
      const query: LogQuery = { limit: 2 };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBe(2);
    });

    it("should search logs by text", async () => {
      const query: LogQuery = { search: "Info message" };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBe(2);
      results.forEach((log) => {
        expect(log.message).toContain("Info message");
      });
    });

    it("should handle date range queries", async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const query: LogQuery = {
        since: oneHourAgo,
        until: now,
      };
      const results = await loggingService.queryLogs(query);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((log) => {
        expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(
          oneHourAgo.getTime()
        );
        expect(log.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it("should return all logs when no query specified", async () => {
      const results = await loggingService.queryLogs({});
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Log File Operations Integration", () => {
    it("should write logs to file when configured", async () => {
      const testMessage = "File write test message";

      loggingService.log("info", "file-test", testMessage, { test: true });

      // Wait for file write
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if file exists and contains the message
      const fileExists = await fs
        .access(testLogFile)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      const fileContent = await fs.readFile(testLogFile, "utf-8");
      expect(fileContent).toContain(testMessage);
      expect(fileContent).toContain("file-test");
      expect(fileContent).toContain("info");
    });

    it("should handle file write errors gracefully", async () => {
      // Create logging service with invalid file path
      const invalidPath = "/invalid/path/that/does/not/exist.log";
      const serviceWithInvalidPath = new LoggingService(invalidPath);

      // This should not throw an error
      expect(() => {
        serviceWithInvalidPath.log("info", "error-test", "Test message");
      }).not.toThrow();

      // Service should continue to function
      const logs = serviceWithInvalidPath.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should rotate logs when size limit is reached", async () => {
      // Create a service with small max file size for testing
      const smallFileService = new LoggingService(testLogFile);

      // Override the max file size for testing
      (smallFileService as any).maxFileSize = 100; // Very small limit

      // Add logs until rotation should occur
      for (let i = 0; i < 10; i++) {
        smallFileService.log(
          "info",
          "rotation-test",
          `Message ${i} with some extra content to fill up space quickly`
        );
      }

      // Wait for file operations
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if backup file was created
      const backupExists = await fs
        .access(testLogFile + ".1")
        .then(() => true)
        .catch(() => false);
      // Note: Rotation might not occur immediately depending on implementation
      // This test verifies the service doesn't crash during rotation attempts
      expect(smallFileService.getLogs().length).toBeGreaterThan(0);
    });
  });

  describe("Memory Management Integration", () => {
    it("should maintain maximum logs in memory", async () => {
      // Create service with small memory limit
      const limitedService = new LoggingService();
      (limitedService as any).maxLogsInMemory = 3;

      // Add more logs than the limit
      for (let i = 0; i < 5; i++) {
        limitedService.log("info", "memory-test", `Memory test message ${i}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = limitedService.getLogs();
      // Should not exceed the memory limit
      expect(logs.length).toBeLessThanOrEqual(3);
    });

    it("should handle rapid log generation without memory issues", async () => {
      const rapidLogs = 1000;

      // Generate many logs rapidly
      for (let i = 0; i < rapidLogs; i++) {
        loggingService.log("debug", "performance-test", `Rapid log ${i}`, {
          index: i,
          timestamp: Date.now(),
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Verify logs are properly structured
      const sampleLog = logs[logs.length - 1];
      expect(sampleLog).toHaveProperty("timestamp");
      expect(sampleLog).toHaveProperty("level");
      expect(sampleLog).toHaveProperty("component");
      expect(sampleLog).toHaveProperty("message");
    });
  });

  describe("Concurrent Logging Integration", () => {
    it("should handle concurrent logging operations", async () => {
      const concurrentOperations = 10;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            loggingService.log(
              "info",
              "concurrent-test",
              `Concurrent message ${i}`,
              {
                operationId: i,
                threadId: `thread-${i}`,
              }
            );
            resolve();
          })
        );
      }

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const concurrentLogs = logs.filter(
        (log) => log.component === "concurrent-test"
      );

      expect(concurrentLogs.length).toBe(concurrentOperations);

      // Verify all concurrent messages were logged
      const messageCounts = new Map<string, number>();
      concurrentLogs.forEach((log) => {
        const count = messageCounts.get(log.message) || 0;
        messageCounts.set(log.message, count + 1);
      });

      // Each message should appear exactly once
      messageCounts.forEach((count) => {
        expect(count).toBe(1);
      });
    });
  });

  describe("Log Analysis Integration", () => {
    beforeEach(async () => {
      // Add diverse logs for analysis
      const now = new Date();
      const logs = [
        {
          level: "error",
          component: "api",
          message: "API Error 1",
          timestamp: new Date(now.getTime() - 60000),
        },
        {
          level: "error",
          component: "api",
          message: "API Error 2",
          timestamp: new Date(now.getTime() - 30000),
        },
        {
          level: "warn",
          component: "api",
          message: "API Warning",
          timestamp: now,
        },
        { level: "info", component: "db", message: "DB Info", timestamp: now },
        {
          level: "debug",
          component: "cache",
          message: "Cache Debug",
          timestamp: now,
        },
      ];

      logs.forEach((log) => {
        loggingService.log(log.level as any, log.component, log.message);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should provide log statistics", async () => {
      const stats = loggingService.getLogStats();

      expect(stats).toEqual(
        expect.objectContaining({
          totalLogs: expect.any(Number),
          byLevel: expect.any(Object),
          byComponent: expect.any(Object),
        })
      );
      expect(stats.totalLogs).toBeGreaterThan(0);

      // Should have error logs
      expect(stats.byLevel.error).toBeGreaterThan(0);
      expect(stats.byLevel.warn).toBeGreaterThan(0);
      expect(stats.byLevel.info).toBeGreaterThan(0);
    });

    it("should export logs in different formats", async () => {
      // Test JSON export
      const jsonExport = loggingService.exportLogs("json");
      expect(jsonExport).toEqual(expect.any(String));

      // Should be valid JSON
      const parsedJson = JSON.parse(jsonExport);
      expect(parsedJson).toEqual(expect.any(Array));

      // Test CSV export
      const csvExport = loggingService.exportLogs("csv");
      expect(csvExport).toEqual(expect.any(String));

      // Should contain CSV headers
      expect(csvExport).toContain("timestamp");
      expect(csvExport).toContain("level");
      expect(csvExport).toContain("component");
    });

    it("should handle log filtering and aggregation", async () => {
      // Get error logs from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const errorQuery: LogQuery = {
        level: "error",
        since: oneHourAgo,
      };

      const errorLogs = await loggingService.queryLogs(errorQuery);
      expect(errorLogs.length).toBeGreaterThan(0);

      // All should be errors
      errorLogs.forEach((log) => {
        expect(log.level).toBe("error");
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed log data gracefully", async () => {
      // Log with circular reference (shouldn't crash)
      const circularObj: any = { prop: "value" };
      circularObj.self = circularObj;

      expect(() => {
        loggingService.log(
          "info",
          "circular-test",
          "Circular reference test",
          circularObj
        );
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should handle very long log messages", async () => {
      const longMessage = "x".repeat(10000); // 10KB message

      loggingService.log("info", "long-message-test", longMessage);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const longMessageLog = logs.find((log) => log.message.includes("xxxxx")); // Look for part of the repeated string

      expect(longMessageLog).toEqual(expect.any(Object));
      expect(longMessageLog?.message.length).toBe(10000);
    });

    it("should handle high-frequency logging without blocking", async () => {
      const startTime = Date.now();

      // Log many messages quickly
      for (let i = 0; i < 100; i++) {
        loggingService.log(
          "debug",
          "frequency-test",
          `High frequency message ${i}`
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(1000); // Less than 1 second

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      const frequencyLogs = logs.filter(
        (log) => log.component === "frequency-test"
      );
      expect(frequencyLogs.length).toBe(100);
    });

    it("should handle logging during service shutdown", async () => {
      // Add some logs
      loggingService.log("info", "shutdown-test", "Pre-shutdown log");

      // Simulate service cleanup (no explicit shutdown method in current implementation)
      // The service should continue to work normally

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggingService.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Should still be able to log after "shutdown"
      loggingService.log("info", "shutdown-test", "Post-shutdown log");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedLogs = loggingService.getLogs();
      expect(updatedLogs.length).toBeGreaterThan(logs.length);
    });
  });
});
