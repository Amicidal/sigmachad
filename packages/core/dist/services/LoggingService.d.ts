import type { InstrumentationConsumer, InstrumentationEvent, DispatcherMetrics } from "../logging/InstrumentationDispatcher.js";
import type { FileSinkOptions, FileSinkMetrics, FileSystemFacade } from "../logging/FileSink.js";
import type { SerializationOptions } from "../logging/serialization.js";
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
export interface LoggingHealthMetrics {
    dispatcher: DispatcherMetrics;
    inMemoryLogCount: number;
    maxLogsInMemory: number;
    droppedFromMemory: number;
    fileSink?: FileSinkMetrics & {
        path: string;
    };
    logFilePath?: string;
    disposed: boolean;
}
export declare class LoggingService implements InstrumentationConsumer {
    private logs;
    private readonly options;
    private readonly dispatcher;
    private readonly subscription;
    private readonly consoleFallback;
    private readonly fileSink?;
    private readonly maxLogsInMemory;
    private readonly logFilePath?;
    private disposed;
    private droppedFromMemory;
    constructor(options?: string | LoggingServiceOptions);
    handleEvent(event: InstrumentationEvent): void;
    dispose(): Promise<void>;
    log(level: LogEntry["level"], component: string, message: string, data?: unknown): void;
    info(component: string, message: string, data?: unknown): void;
    warn(component: string, message: string, data?: unknown): void;
    error(component: string, message: string, data?: unknown): void;
    debug(component: string, message: string, data?: unknown): void;
    getLogs(query?: LogQuery): LogEntry[];
    queryLogs(query: LogQuery): Promise<LogEntry[]>;
    getLogsFromFile(query: LogQuery): Promise<LogEntry[]>;
    getLogStats(): {
        totalLogs: number;
        logsByLevel: Record<string, number>;
        logsByComponent: Record<string, number>;
        byLevel: Record<string, number>;
        byComponent: Record<string, number>;
        oldestLog?: Date;
        newestLog?: Date;
    };
    clearOldLogs(olderThanHours?: number): number;
    exportLogsInFormat(format: "json" | "csv"): string;
    exportLogsToFile(query: LogQuery, exportPath: string): Promise<number>;
    exportLogs(query: LogQuery, exportPath: string): Promise<number>;
    exportLogs(format: "json" | "csv"): string;
    getHealthMetrics(): LoggingHealthMetrics;
    private createEntry;
    private recordEntry;
    private collectLogFiles;
}
//# sourceMappingURL=LoggingService.d.ts.map