/**
 * File Watcher Service for Memento
 * Monitors filesystem changes and triggers graph updates
 */
import { EventEmitter } from 'events';
export interface FileChange {
    path: string;
    absolutePath: string;
    type: 'create' | 'modify' | 'delete' | 'rename';
    oldPath?: string;
    stats?: {
        size: number;
        mtime: Date;
        isDirectory: boolean;
    };
    hash?: string;
}
export interface WatcherConfig {
    watchPaths: string[];
    ignorePatterns: string[];
    debounceMs: number;
    maxConcurrent: number;
}
export declare class FileWatcher extends EventEmitter {
    private watcher;
    private config;
    private changeQueue;
    private processing;
    private fileHashes;
    constructor(config?: Partial<WatcherConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleFileChange;
    private handleDirectoryChange;
    private queueChange;
    private processChanges;
    private processChange;
    private getChangePriority;
    private getChangeIcon;
    private chunkArray;
    private initializeFileHashes;
    private scanDirectory;
    private shouldIgnore;
    private escapeRegex;
    getWatchedPaths(): string[];
    getQueueLength(): number;
    isProcessing(): boolean;
    rescan(): Promise<void>;
}
//# sourceMappingURL=FileWatcher.d.ts.map