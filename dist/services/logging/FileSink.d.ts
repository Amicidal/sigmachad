import * as fs from "fs/promises";
import { OriginalConsoleMethods } from "./InstrumentationDispatcher.js";
export interface FileSystemFacade {
    appendFile(path: string, data: string, encoding?: BufferEncoding): Promise<void>;
    mkdir(path: string, options: fs.MakeDirectoryOptions & {
        recursive: boolean;
    }): Promise<void>;
    stat(path: string): Promise<fs.Stats>;
    rm(path: string, options: fs.RmOptions): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    truncate(path: string, len?: number): Promise<void>;
}
export interface FileSinkOptions {
    maxFileSizeBytes?: number;
    maxFileAgeMs?: number;
    maxHistory?: number;
    maxWriteErrors?: number;
}
export interface FileSinkMetrics {
    bytesWritten: number;
    failedWrites: number;
    suppressedWrites: number;
    rotations: number;
    lastError?: string;
}
export declare class FileSink {
    private readonly targetFile;
    private readonly options;
    private readonly consoleFallback;
    private readonly fileSystem;
    private queue;
    private initialized;
    private suppressed;
    private consecutiveFailures;
    private currentFileSize;
    private lastRotationAt;
    private readonly metrics;
    constructor(targetFile: string, consoleFallback: OriginalConsoleMethods, options?: FileSinkOptions, fileSystem?: FileSystemFacade);
    append(line: string): Promise<void>;
    flush(): Promise<void>;
    getMetrics(): FileSinkMetrics;
    getRotationHistoryLimit(): number;
    private performAppend;
    private ensureInitialized;
    private rotateIfNeeded;
    private rotateFiles;
}
//# sourceMappingURL=FileSink.d.ts.map