import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { LoggingService } from "../../../src/services/LoggingService";
import type { LoggingServiceOptions } from "../../../src/services/LoggingService";
import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";

const activeServices: LoggingService[] = [];
let tempDir: string;
let logPath: string;

async function createService(options: LoggingServiceOptions = {}): Promise<LoggingService> {
  const service = new LoggingService({ logFile: logPath, ...options });
  activeServices.push(service);
  return service;
}

describe("LoggingService Integration", () => {
  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "logging-service-int-"));
    logPath = path.join(tempDir, "integration.log");
  });

  afterEach(async () => {
    while (activeServices.length > 0) {
      const instance = activeServices.pop();
      if (instance) {
        await instance.dispose();
      }
    }

    await fs.rm(logPath, { force: true });
    await fs.rm(`${logPath}.1`, { force: true });
    await fs.rm(`${logPath}.2`, { force: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("shares dispatcher instrumentation across instances", async () => {
    const primary = await createService({ fileRotation: { maxHistory: 1 } });
    const secondary = await createService();

    console.warn("shared-instance", { id: 1 });

    const primaryLogs = primary.getLogs();
    const secondaryLogs = secondary.getLogs();

    expect(primaryLogs).toHaveLength(1);
    expect(secondaryLogs).toHaveLength(1);
    expect(primaryLogs[0].message).toContain("shared-instance");

    const metrics = primary.getHealthMetrics();
    expect(metrics.dispatcher.registeredConsumers).toBe(2);
    expect(metrics.dispatcher.consoleOverridesActive).toBe(true);
  });

  it("captures process-level failures", async () => {
    const service = await createService();

    const error = new Error("integration-uncaught");
    process.emit("uncaughtException", error);

    const logs = service.getLogs();
    const captured = logs.find((log) => log.component === "process");

    expect(captured).toBeDefined();
    expect(captured?.message).toContain("integration-uncaught");
    expect(captured?.data).toMatchObject({
      stack: expect.stringContaining("integration-uncaught"),
      name: "Error",
    });
  });

  it("persists logs to disk and surfaces them via getLogsFromFile", async () => {
    const service = await createService({
      fileRotation: {
        maxFileSizeBytes: 256,
        maxHistory: 1,
        maxFileAgeMs: Number.MAX_SAFE_INTEGER,
      },
    });

    service.info("API", "user-created", { userId: "42" });
    service.warn("API", "rate-limit", { quota: 10 });

    await service.dispose();
    const fileLogs = await service.getLogsFromFile({ limit: 10 });

    expect(fileLogs).toHaveLength(2);
    expect(fileLogs[0].timestamp).toBeInstanceOf(Date);
    expect(fileLogs.map((log) => log.message)).toContain("rate-limit");
  });
});
