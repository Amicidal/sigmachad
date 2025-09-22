import * as fs from "fs/promises";
import { getInstrumentationDispatcher, } from "./logging/InstrumentationDispatcher.js";
import { FileSink } from "./logging/FileSink.js";
import { sanitizeData, serializeLogEntry } from "./logging/serialization.js";
const DEFAULT_MAX_LOGS_IN_MEMORY = 10000;
function normalizeOptions(input) {
    var _a, _b, _c;
    if (typeof input === "string") {
        return {
            logFilePath: input,
            maxLogsInMemory: DEFAULT_MAX_LOGS_IN_MEMORY,
            fileRotation: {},
            serialization: {},
        };
    }
    const options = input !== null && input !== void 0 ? input : {};
    return {
        logFilePath: options.logFile,
        maxLogsInMemory: (_a = options.maxLogsInMemory) !== null && _a !== void 0 ? _a : DEFAULT_MAX_LOGS_IN_MEMORY,
        fileRotation: (_b = options.fileRotation) !== null && _b !== void 0 ? _b : {},
        serialization: (_c = options.serialization) !== null && _c !== void 0 ? _c : {},
        fileSystem: options.fileSystem,
    };
}
function toSearchableString(value) {
    var _a;
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value);
    }
    catch (error) {
        return `[unserializable: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "error"}]`;
    }
}
function applyQueryFilters(logs, query) {
    let filteredLogs = [...logs];
    if (query.level) {
        filteredLogs = filteredLogs.filter((log) => log.level === query.level);
    }
    if (query.component) {
        filteredLogs = filteredLogs.filter((log) => log.component === query.component);
    }
    if (query.since) {
        filteredLogs = filteredLogs.filter((log) => log.timestamp >= query.since);
    }
    if (query.until) {
        filteredLogs = filteredLogs.filter((log) => log.timestamp <= query.until);
    }
    if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredLogs = filteredLogs.filter((log) => {
            const dataString = toSearchableString(log.data);
            return (log.message.toLowerCase().includes(searchTerm) ||
                dataString.toLowerCase().includes(searchTerm));
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
export class LoggingService {
    constructor(options) {
        this.logs = [];
        this.dispatcher = getInstrumentationDispatcher();
        this.disposed = false;
        this.droppedFromMemory = 0;
        this.options = normalizeOptions(options);
        this.subscription = this.dispatcher.register(this);
        this.consoleFallback = this.dispatcher.getOriginalConsole();
        this.maxLogsInMemory = this.options.maxLogsInMemory;
        this.logFilePath = this.options.logFilePath;
        if (this.logFilePath) {
            this.fileSink = new FileSink(this.logFilePath, this.consoleFallback, this.options.fileRotation, this.options.fileSystem);
        }
    }
    handleEvent(event) {
        var _a;
        if (this.disposed) {
            return;
        }
        const rawData = (_a = event.data) !== null && _a !== void 0 ? _a : (event.consoleArgs && event.consoleArgs.length > 0
            ? { consoleArgs: event.consoleArgs }
            : undefined);
        this.recordEntry({
            timestamp: new Date(),
            level: event.level,
            component: event.component,
            message: event.message,
            data: rawData !== undefined
                ? sanitizeData(rawData, this.options.serialization)
                : undefined,
        });
    }
    dispose() {
        var _a, _b;
        if (!this.disposed) {
            this.disposed = true;
            this.subscription.dispose();
        }
        return (_b = (_a = this.fileSink) === null || _a === void 0 ? void 0 : _a.flush()) !== null && _b !== void 0 ? _b : Promise.resolve();
    }
    log(level, component, message, data) {
        this.recordEntry(this.createEntry(level, component, message, data));
    }
    info(component, message, data) {
        this.log("info", component, message, data);
    }
    warn(component, message, data) {
        this.log("warn", component, message, data);
    }
    error(component, message, data) {
        this.log("error", component, message, data);
    }
    debug(component, message, data) {
        this.log("debug", component, message, data);
    }
    getLogs(query) {
        if (!query) {
            return [...this.logs];
        }
        return applyQueryFilters(this.logs, query);
    }
    async queryLogs(query) {
        return applyQueryFilters(this.logs, query);
    }
    async getLogsFromFile(query) {
        if (!this.logFilePath) {
            return [];
        }
        const files = await this.collectLogFiles();
        const entries = [];
        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, "utf-8");
                const lines = content
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        entries.push({
                            ...parsed,
                            timestamp: new Date(parsed.timestamp),
                        });
                    }
                    catch (parseError) {
                        this.consoleFallback.warn("LoggingService: skipping malformed log entry", line.slice(0, 120));
                    }
                }
            }
            catch (error) {
                this.consoleFallback.warn(`LoggingService: failed to read log file ${filePath}`, error);
            }
        }
        return applyQueryFilters(entries, query);
    }
    getLogStats() {
        const stats = {
            totalLogs: this.logs.length,
            logsByLevel: {},
            logsByComponent: {},
            byLevel: {},
            byComponent: {},
            oldestLog: undefined,
            newestLog: undefined,
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
    clearOldLogs(olderThanHours = 24) {
        const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        const initialCount = this.logs.length;
        this.logs = this.logs.filter((log) => log.timestamp >= cutoffTime);
        return initialCount - this.logs.length;
    }
    exportLogsInFormat(format) {
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
            const data = log.data !== undefined
                ? `"${toSearchableString(log.data).replace(/"/g, '""')}"`
                : "";
            return `${timestamp},${level},${component},${message},${data}`;
        })
            .join("\n");
        return headers + rows;
    }
    async exportLogsToFile(query, exportPath) {
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
    exportLogs(param1, param2) {
        if (typeof param1 === "string") {
            return this.exportLogsInFormat(param1);
        }
        if (!param2) {
            throw new Error("Export path is required for file export");
        }
        return this.exportLogsToFile(param1, param2);
    }
    getHealthMetrics() {
        var _a;
        const fileSinkMetrics = (_a = this.fileSink) === null || _a === void 0 ? void 0 : _a.getMetrics();
        return {
            dispatcher: this.dispatcher.getMetrics(),
            inMemoryLogCount: this.logs.length,
            maxLogsInMemory: this.maxLogsInMemory,
            droppedFromMemory: this.droppedFromMemory,
            fileSink: fileSinkMetrics
                ? { ...fileSinkMetrics, path: this.logFilePath }
                : undefined,
            logFilePath: this.logFilePath,
            disposed: this.disposed,
        };
    }
    createEntry(level, component, message, data) {
        return {
            timestamp: new Date(),
            level,
            component,
            message,
            data: data !== undefined
                ? sanitizeData(data, this.options.serialization)
                : undefined,
        };
    }
    recordEntry(entry) {
        this.logs.push(entry);
        if (this.logs.length > this.options.maxLogsInMemory) {
            this.logs.shift();
            this.droppedFromMemory += 1;
        }
        if (this.fileSink) {
            try {
                const serialized = `${serializeLogEntry(entry, this.options.serialization)}\n`;
                void this.fileSink.append(serialized);
            }
            catch (error) {
                this.consoleFallback.warn("LoggingService: failed to serialize log entry for file sink", error, entry);
            }
        }
    }
    async collectLogFiles() {
        var _a, _b, _c;
        const files = [];
        const basePath = this.logFilePath;
        if (!basePath) {
            return files;
        }
        try {
            await fs.stat(basePath);
            files.push(basePath);
        }
        catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
        const historyLimit = (_c = (_b = (_a = this.fileSink) === null || _a === void 0 ? void 0 : _a.getRotationHistoryLimit()) !== null && _b !== void 0 ? _b : this.options.fileRotation.maxHistory) !== null && _c !== void 0 ? _c : 0;
        for (let index = 1; index <= historyLimit; index += 1) {
            const rotated = `${basePath}.${index}`;
            try {
                await fs.stat(rotated);
                files.push(rotated);
            }
            catch (error) {
                if (error.code !== "ENOENT") {
                    throw error;
                }
            }
        }
        return files;
    }
}
//# sourceMappingURL=LoggingService.js.map