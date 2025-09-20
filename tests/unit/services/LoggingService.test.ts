import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LoggingService } from "../../../src/services/LoggingService";
import type { FileSystemFacade } from "../../../src/services/logging/FileSink";
import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";

const ORIGINAL_CONSOLE = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

describe("LoggingService", () => {
  let service: LoggingService | undefined;
  let tempDir: string;
  let logPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "logging-service-unit-"));
    logPath = path.join(tempDir, "memento.log");
  });

  afterEach(async () => {
    if (service) {
      await service.dispose();
      service = undefined;
    }

    console.log = ORIGINAL_CONSOLE.log;
    console.error = ORIGINAL_CONSOLE.error;
    console.warn = ORIGINAL_CONSOLE.warn;
    console.debug = ORIGINAL_CONSOLE.debug;

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("captures manual logs and enforces the in-memory cap", () => {
    service = new LoggingService({ maxLogsInMemory: 2 });

    service.info("Component", "message-1");
    service.info("Component", "message-2");
    service.info("Component", "message-3");

    const logs = service.getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe("message-2");
    expect(logs[1].message).toBe("message-3");

    const metrics = service.getHealthMetrics();
    expect(metrics.droppedFromMemory).toBe(1);
    expect(metrics.inMemoryLogCount).toBe(2);
  });

  it("captures console output via the dispatcher", () => {
    service = new LoggingService();

    const payload = { user: "alice" };
    console.log("hello world", payload);

    const logs = service.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: "info",
      component: "console",
      message: expect.stringContaining("hello world"),
    });
    expect(logs[0].data).toEqual({ consoleArgs: ["hello world", { user: "alice" }] });
  });

  it("preserves error details when logging Error instances via console", () => {
    service = new LoggingService();

    const err = new Error("boom");
    console.error("failure", err);

    const errorLogs = service.getLogs().filter((entry) => entry.level === "error");
    expect(errorLogs).not.toHaveLength(0);
    expect(errorLogs[0].message).toContain("failure");
    expect(errorLogs[0].message).toContain("boom");
  });

  it("sanitises circular data structures", () => {
    service = new LoggingService();

    const circular: any = { name: "node" };
    circular.self = circular;

    service.error("Serializer", "failed", { payload: circular });

    const [entry] = service.getLogs();
    expect(entry.data).toEqual({ payload: { name: "node", self: "[Circular]" } });
  });

  it("writes logs to disk and rotates when exceeding size thresholds", async () => {
    service = new LoggingService({
      logFile: logPath,
      fileRotation: {
        maxFileSizeBytes: 200,
        maxHistory: 2,
        maxFileAgeMs: Number.MAX_SAFE_INTEGER,
      },
    });

    for (let index = 0; index < 20; index += 1) {
      service.info("Rotation", `entry-${index}`, { index });
    }

    await service.dispose();
    const baseContent = await fs.readFile(logPath, "utf-8");
    const rotatedContent = await fs.readFile(`${logPath}.1`, "utf-8");

    expect(baseContent.length).toBeGreaterThan(0);
    expect(rotatedContent.length).toBeGreaterThan(0);

    const metrics = service.getHealthMetrics();
    expect(metrics.fileSink?.rotations).toBeGreaterThan(0);
  });

  it("suppresses file writes after repeated failures", async () => {
    const failingFs: FileSystemFacade = {
      appendFile: () => Promise.reject(new Error("append failure")),
      mkdir: (...args) => fs.mkdir(...args),
      stat: (...args) => fs.stat(...args),
      rm: (...args) => fs.rm(...args),
      rename: (...args) => fs.rename(...args),
      truncate: (...args) => fs.truncate(...args),
    };

    service = new LoggingService({
      logFile: logPath,
      fileRotation: { maxWriteErrors: 2 },
      fileSystem: failingFs,
    });

    service.warn("Persistence", "first failure");
    service.warn("Persistence", "second failure");
    service.warn("Persistence", "third failure");

    await service.dispose();

    const metrics = service.getHealthMetrics();
    expect(metrics.fileSink?.failedWrites).toBeGreaterThanOrEqual(2);
    expect(metrics.fileSink?.suppressedWrites).toBeGreaterThan(0);
  });

  it("exposes dispatcher metrics and restores console overrides after dispose", async () => {
    service = new LoggingService();
    const activeMetrics = service.getHealthMetrics();

    expect(activeMetrics.dispatcher.consoleOverridesActive).toBe(true);
    expect(activeMetrics.dispatcher.registeredConsumers).toBeGreaterThan(0);

    await service.dispose();

    const postMetrics = service.getHealthMetrics();
    expect(postMetrics.dispatcher.consoleOverridesActive).toBe(false);
    expect(postMetrics.dispatcher.registeredConsumers).toBe(0);
  });

  it("loads persisted logs from rotated files", async () => {
    service = new LoggingService({
      logFile: logPath,
      fileRotation: {
        maxFileSizeBytes: 150,
        maxHistory: 1,
        maxFileAgeMs: Number.MAX_SAFE_INTEGER,
      },
    });

    for (let index = 0; index < 10; index += 1) {
      service.info("Loader", `entry-${index}`);
    }

    await service.dispose();
    const logsFromFile = await service.getLogsFromFile({ limit: 50 });

    expect(logsFromFile.length).toBeGreaterThan(0);
    expect(logsFromFile[0].timestamp).toBeInstanceOf(Date);
  });

  it("reads rotated log history with default rotation settings", async () => {
    service = new LoggingService({
      logFile: logPath,
      fileRotation: {
        maxFileSizeBytes: 200,
        maxFileAgeMs: Number.MAX_SAFE_INTEGER,
      },
    });

    const totalEntries = 6;
    for (let index = 0; index < totalEntries; index += 1) {
      service.info("History", `rotated-${index}`);
    }

    await service.dispose();

    await expect(fs.stat(`${logPath}.1`)).resolves.toBeDefined();

    const logsFromFile = await service.getLogsFromFile({ limit: 100 });
    const messages = logsFromFile.map((log) => log.message);

    expect(logsFromFile).toHaveLength(totalEntries);
    expect(messages).toContain("rotated-0");
    expect(messages).toContain(`rotated-${totalEntries - 1}`);
  });
});
