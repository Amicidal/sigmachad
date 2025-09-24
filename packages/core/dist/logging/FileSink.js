import * as fs from "fs/promises";
import * as path from "path";
const defaultFileSystem = {
    appendFile: (target, data, encoding) => fs.appendFile(target, data, encoding),
    mkdir: (target, options) => fs.mkdir(target, options),
    stat: (target) => fs.stat(target),
    rm: (target, options) => fs.rm(target, options),
    rename: (source, destination) => fs.rename(source, destination),
    truncate: (target, len) => fs.truncate(target, len),
};
const DEFAULT_OPTIONS = {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
    maxFileAgeMs: 24 * 60 * 60 * 1000, // 24h
    maxHistory: 5,
    maxWriteErrors: 3,
};
export class FileSink {
    constructor(targetFile, consoleFallback, options = {}, fileSystem = defaultFileSystem) {
        this.targetFile = targetFile;
        this.queue = Promise.resolve();
        this.initialized = false;
        this.suppressed = false;
        this.consecutiveFailures = 0;
        this.currentFileSize = 0;
        this.lastRotationAt = Date.now();
        this.metrics = {
            bytesWritten: 0,
            failedWrites: 0,
            suppressedWrites: 0,
            rotations: 0,
        };
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.consoleFallback = consoleFallback;
        this.fileSystem = fileSystem;
    }
    append(line) {
        this.queue = this.queue.then(() => this.performAppend(line));
        return this.queue;
    }
    flush() {
        return this.queue;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getRotationHistoryLimit() {
        return this.options.maxHistory;
    }
    async performAppend(line) {
        if (this.suppressed) {
            this.metrics.suppressedWrites += 1;
            return;
        }
        try {
            await this.ensureInitialized();
            await this.rotateIfNeeded(line);
            await this.fileSystem.appendFile(this.targetFile, line, "utf8");
            const lineSize = Buffer.byteLength(line, "utf8");
            this.currentFileSize += lineSize;
            this.metrics.bytesWritten += lineSize;
            this.consecutiveFailures = 0;
        }
        catch (error) {
            this.consecutiveFailures += 1;
            this.metrics.failedWrites += 1;
            this.metrics.lastError = error instanceof Error ? error.message : String(error);
            this.consoleFallback.warn("LoggingService: failed to append log entry to file", error);
            if (this.consecutiveFailures >= this.options.maxWriteErrors) {
                this.suppressed = true;
                this.consoleFallback.error(`LoggingService: suppressing further file writes after ${this.consecutiveFailures} consecutive failures`);
            }
        }
    }
    async ensureInitialized() {
        if (this.initialized) {
            return;
        }
        await this.fileSystem.mkdir(path.dirname(this.targetFile), {
            recursive: true,
        });
        try {
            const stats = await this.fileSystem.stat(this.targetFile);
            this.currentFileSize = stats.size;
            this.lastRotationAt = stats.mtimeMs;
        }
        catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
            this.currentFileSize = 0;
            this.lastRotationAt = Date.now();
        }
        this.initialized = true;
    }
    async rotateIfNeeded(line) {
        const lineSize = Buffer.byteLength(line, "utf8");
        const now = Date.now();
        const sizeThresholdExceeded = this.currentFileSize + lineSize > this.options.maxFileSizeBytes;
        const ageThresholdExceeded = now - this.lastRotationAt > this.options.maxFileAgeMs;
        if (!sizeThresholdExceeded && !ageThresholdExceeded) {
            return;
        }
        await this.rotateFiles();
        this.currentFileSize = 0;
        this.lastRotationAt = now;
        this.metrics.rotations += 1;
    }
    async rotateFiles() {
        const history = this.options.maxHistory;
        if (history <= 0) {
            try {
                await this.fileSystem.truncate(this.targetFile, 0);
            }
            catch (error) {
                if (error.code !== "ENOENT") {
                    throw error;
                }
            }
            return;
        }
        for (let index = history; index >= 1; index -= 1) {
            const source = index === 1
                ? this.targetFile
                : `${this.targetFile}.${index - 1}`;
            const destination = `${this.targetFile}.${index}`;
            try {
                await this.fileSystem.stat(source);
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    continue;
                }
                throw error;
            }
            if (index === history) {
                await this.fileSystem
                    .rm(destination, { force: true })
                    .catch(() => undefined);
            }
            await this.fileSystem.rename(source, destination);
        }
    }
}
//# sourceMappingURL=FileSink.js.map