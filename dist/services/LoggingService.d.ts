/**
 * Logging Service for Memento
 * Captures and manages system logs with querying capabilities
 */
export interface LogEntry {
    timestamp: Date;
    level: "error" | "warn" | "info" | "debug";
    component: string;
    message: string;
    data?: any;
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
export declare class LoggingService {
    private logs;
    private maxLogsInMemory;
    private logFile?;
    constructor(logFile?: string);
    private setupLogCapture;
    private captureLog;
    private writeToFile;
    /**
     * Get all logs from memory (simple method for tests)
     */
    getLogs(query?: LogQuery): LogEntry[];
    /**
     * Synchronous version of queryLogs for getLogs method
     */
    private queryLogsSync;
    queryLogs(query: LogQuery): Promise<LogEntry[]>;
    getLogsFromFile(query: LogQuery): Promise<LogEntry[]>;
    log(level: LogEntry["level"], component: string, message: string, data?: any): void;
    info(component: string, message: string, data?: any): void;
    warn(component: string, message: string, data?: any): void;
    error(component: string, message: string, data?: any): void;
    debug(component: string, message: string, data?: any): void;
    getLogStats(): {
        totalLogs: number;
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
}
//# sourceMappingURL=LoggingService.d.ts.map