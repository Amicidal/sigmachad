import * as fs from "fs/promises";
import {
  getInstrumentationDispatcher,
} from "./logging/InstrumentationDispatcher.js";
import type {
  InstrumentationConsumer,
  InstrumentationEvent,
  InstrumentationSubscription,
  DispatcherMetrics,
  OriginalConsoleMethods,
} from "./logging/InstrumentationDispatcher.js";
import { FileSink } from "./logging/FileSink.js";
import type {
  FileSinkOptions,
  FileSinkMetrics,
  FileSystemFacade,
} from "./logging/FileSink.js";
import { sanitizeData, serializeLogEntry } from "./logging/serialization.js";
import type { SerializationOptions } from "./logging/serialization.js";

export interface LogEntry {
  timestamp: Date;
  level: "error" | "warn" | "info" | "debug";
  component: string;
  message: string;
  data?: unknown;
  userId?: string;
  requestId?: string;
  ip?: string;
}

export interface LogQuery {
  level?: string;
  component?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  search?: string;
}

export interface LoggingServiceOptions {
  logFile?: string;
  maxLogsInMemory?: number;
  fileRotation?: FileSinkOptions;
  serialization?: SerializationOptions;
  /** Internal testing hook to override filesystem interactions. */
  fileSystem?: FileSystemFacade;
}

interface NormalizedOptions {
  logFilePath?: string;
  maxLogsInMemory: number;
  fileRotation: FileSinkOptions;
  serialization: SerializationOptions;
  fileSystem?: FileSystemFacade;
}

export interface LoggingHealthMetrics {
  dispatcher: DispatcherMetrics;
  inMemoryLogCount: number;
  maxLogsInMemory: number;
  droppedFromMemory: number;
  fileSink?: FileSinkMetrics & { path: string };
  logFilePath?: string;
  disposed: boolean;
}

const DEFAULT_MAX_LOGS_IN_MEMORY = 10_000;

function normalizeOptions(
  input?: string | LoggingServiceOptions
): NormalizedOptions {
  if (typeof input === "string") {
    return {
      logFilePath: input,
      maxLogsInMemory: DEFAULT_MAX_LOGS_IN_MEMORY,
      fileRotation: {},
      serialization: {},
    };
  }

  const options = input ?? {};

  return {
    logFilePath: options.logFile,
    maxLogsInMemory: options.maxLogsInMemory ?? DEFAULT_MAX_LOGS_IN_MEMORY,
    fileRotation: options.fileRotation ?? {},
    serialization: options.serialization ?? {},
    fileSystem: options.fileSystem,
  };
}

function toSearchableString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return `[unserializable: ${(error as Error)?.message ?? "error"}]`;
  }
}

function applyQueryFilters(logs: LogEntry[], query: LogQuery): LogEntry[] {
  let filteredLogs = [...logs];

  if (query.level) {
    filteredLogs = filteredLogs.filter((log) => log.level === query.level);
  }

  if (query.component) {
    filteredLogs = filteredLogs.filter(
      (log) => log.component === query.component
    );
  }

  if (query.since) {
    filteredLogs = filteredLogs.filter((log) => log.timestamp >= query.since!);
  }

  if (query.until) {
    filteredLogs = filteredLogs.filter((log) => log.timestamp <= query.until!);
  }

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filteredLogs = filteredLogs.filter((log) => {
      const dataString = toSearchableString(log.data);
      return (
        log.message.toLowerCase().includes(searchTerm) ||
        dataString.toLowerCase().includes(searchTerm)
      );
    });
  }

  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const hasExplicitLimit = Object.prototype.hasOwnProperty.call(query, "limit");

  if (!hasExplicitLimit) {
    return filteredLogs.slice(0, 100);
  }

  const limitValue = query.limit;
  if (limitValue === undefined || limitValue === null) {
    return filteredLogs;
  }

  if (typeof limitValue !== "number" || !Number.isFinite(limitValue)) {
    return filteredLogs;
  }

  return filteredLogs.slice(0, limitValue);
}

export class LoggingService implements InstrumentationConsumer {
  private logs: LogEntry[] = [];
  private readonly options: NormalizedOptions;
  private readonly dispatcher = getInstrumentationDispatcher();
  private readonly subscription: InstrumentationSubscription;
  private readonly consoleFallback: OriginalConsoleMethods;
  private readonly fileSink?: FileSink;
  private readonly maxLogsInMemory: number;
  private readonly logFilePath?: string;
  private disposed = false;
  private droppedFromMemory = 0;

  constructor(options?: string | LoggingServiceOptions) {
    this.options = normalizeOptions(options);
    this.subscription = this.dispatcher.register(this);
    this.consoleFallback = this.dispatcher.getOriginalConsole();
    this.maxLogsInMemory = this.options.maxLogsInMemory;
    this.logFilePath = this.options.logFilePath;

    if (this.logFilePath) {
      this.fileSink = new FileSink(
        this.logFilePath,
        this.consoleFallback,
        this.options.fileRotation,
        this.options.fileSystem
      );
    }
  }

  handleEvent(event: InstrumentationEvent): void {
    if (this.disposed) {
      return;
    }

    const rawData =
      event.data ??
      (event.consoleArgs && event.consoleArgs.length > 0
        ? { consoleArgs: event.consoleArgs }
        : undefined);

    this.recordEntry({
      timestamp: new Date(),
      level: event.level,
      component: event.component,
      message: event.message,
      data:
        rawData !== undefined
          ? sanitizeData(rawData, this.options.serialization)
          : undefined,
    });
  }

  dispose(): Promise<void> {
    if (!this.disposed) {
      this.disposed = true;
      this.subscription.dispose();
    }

    return this.fileSink?.flush() ?? Promise.resolve();
  }

  log(
    level: LogEntry["level"],
    component: string,
    message: string,
    data?: unknown
  ): void {
    this.recordEntry(
      this.createEntry(level, component, message, data)
    );
  }

  info(component: string, message: string, data?: unknown): void {
    this.log("info", component, message, data);
  }

  warn(component: string, message: string, data?: unknown): void {
    this.log("warn", component, message, data);
  }

  error(component: string, message: string, data?: unknown): void {
    this.log("error", component, message, data);
  }

  debug(component: string, message: string, data?: unknown): void {
    this.log("debug", component, message, data);
  }

  getLogs(query?: LogQuery): LogEntry[] {
    if (!query) {
      return [...this.logs];
    }
    return applyQueryFilters(this.logs, query);
  }

  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    return applyQueryFilters(this.logs, query);
  }

  async getLogsFromFile(query: LogQuery): Promise<LogEntry[]> {
    if (!this.logFilePath) {
      return [];
    }

    const files = await this.collectLogFiles();
    const entries: LogEntry[] = [];

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as LogEntry & { timestamp: string };
            entries.push({
              ...parsed,
              timestamp: new Date(parsed.timestamp),
            });
          } catch (parseError) {
            this.consoleFallback.warn(
              "LoggingService: skipping malformed log entry",
              line.slice(0, 120)
            );
          }
        }
      } catch (error) {
        this.consoleFallback.warn(
          `LoggingService: failed to read log file ${filePath}`,
          error
        );
      }
    }

    return applyQueryFilters(entries, query);
  }

  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByComponent: Record<string, number>;
    byLevel: Record<string, number>;
    byComponent: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      totalLogs: this.logs.length,
      logsByLevel: {} as Record<string, number>,
      logsByComponent: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      oldestLog: undefined as Date | undefined,
      newestLog: undefined as Date | undefined,
    };

    for (const log of this.logs) {
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
      stats.byLevel[log.level] = stats.logsByLevel[log.level];

      stats.logsByComponent[log.component] =
        (stats.logsByComponent[log.component] || 0) + 1;
      stats.byComponent[log.component] = stats.logsByComponent[log.component];

      if (!stats.oldestLog || log.timestamp < stats.oldestLog) {
        stats.oldestLog = log.timestamp;
      }
      if (!stats.newestLog || log.timestamp > stats.newestLog) {
        stats.newestLog = log.timestamp;
      }
    }

    return stats;
  }

  clearOldLogs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialCount = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp >= cutoffTime);

    return initialCount - this.logs.length;
  }

  exportLogsInFormat(format: "json" | "csv"): string {
    const logs = this.getLogs();

    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    }

    if (logs.length === 0) {
      return "timestamp,level,component,message,data\n";
    }

    const headers = "timestamp,level,component,message,data\n";
    const rows = logs
      .map((log) => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level;
        const component = log.component;
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const data =
          log.data !== undefined
            ? `"${toSearchableString(log.data).replace(/"/g, '""')}"`
            : "";
        return `${timestamp},${level},${component},${message},${data}`;
      })
      .join("\n");

    return headers + rows;
  }

  async exportLogsToFile(
    query: LogQuery,
    exportPath: string
  ): Promise<number> {
    const logs = await this.queryLogs({ ...query, limit: undefined });

    const exportData = {
      exportedAt: new Date().toISOString(),
      query,
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    return logs.length;
  }

  exportLogs(query: LogQuery, exportPath: string): Promise<number>;
  exportLogs(format: "json" | "csv"): string;
  exportLogs(
    param1: LogQuery | "json" | "csv",
    param2?: string
  ): Promise<number> | string {
    if (typeof param1 === "string") {
      return this.exportLogsInFormat(param1);
    }

    if (!param2) {
      throw new Error("Export path is required for file export");
    }

    return this.exportLogsToFile(param1, param2);
  }

  getHealthMetrics(): LoggingHealthMetrics {
    const fileSinkMetrics = this.fileSink?.getMetrics();

    return {
      dispatcher: this.dispatcher.getMetrics(),
      inMemoryLogCount: this.logs.length,
      maxLogsInMemory: this.maxLogsInMemory,
      droppedFromMemory: this.droppedFromMemory,
      fileSink: fileSinkMetrics
        ? { ...fileSinkMetrics, path: this.logFilePath! }
        : undefined,
      logFilePath: this.logFilePath,
      disposed: this.disposed,
    };
  }

  private createEntry(
    level: LogEntry["level"],
    component: string,
    message: string,
    data?: unknown
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      component,
      message,
      data:
        data !== undefined
          ? sanitizeData(data, this.options.serialization)
          : undefined,
    };
  }

  private recordEntry(entry: LogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.options.maxLogsInMemory) {
      this.logs.shift();
      this.droppedFromMemory += 1;
    }

    if (this.fileSink) {
      try {
        const serialized = `${serializeLogEntry(entry, this.options.serialization)}\n`;
        void this.fileSink.append(serialized);
      } catch (error) {
        this.consoleFallback.warn(
          "LoggingService: failed to serialize log entry for file sink",
          error,
          entry
        );
      }
    }
  }

  private async collectLogFiles(): Promise<string[]> {
    const files: string[] = [];
    const basePath = this.logFilePath;

    if (!basePath) {
      return files;
    }

    try {
      await fs.stat(basePath);
      files.push(basePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const historyLimit =
      this.fileSink?.getRotationHistoryLimit() ??
      this.options.fileRotation.maxHistory ??
      0;

    for (let index = 1; index <= historyLimit; index += 1) {
      const rotated = `${basePath}.${index}`;
      try {
        await fs.stat(rotated);
        files.push(rotated);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    }

    return files;
  }
}
