/**
 * File Watcher Service for Memento
 * Monitors filesystem changes and triggers graph updates
 */
import chokidar from "chokidar";
import { EventEmitter } from "events";
import * as path from "path";
import { promises as fs } from "fs";
import * as crypto from "crypto";
export class FileWatcher extends EventEmitter {
    watcher = null;
    config;
    changeQueue = [];
    processing = false;
    fileHashes = new Map();
    constructor(config = {}) {
        super();
        this.config = {
            watchPaths: config.watchPaths || ["src", "lib", "packages"],
            ignorePatterns: config.ignorePatterns || [
                "**/node_modules/**",
                "**/dist/**",
                "**/build/**",
                "**/.git/**",
                "**/coverage/**",
                "**/*.log",
                "**/.DS_Store",
                "**/package-lock.json",
                "**/yarn.lock",
                "**/pnpm-lock.yaml",
            ],
            debounceMs: config.debounceMs || 500,
            maxConcurrent: config.maxConcurrent || 10,
        };
    }
    // Backward-compatible initialize() alias for tests expecting this method
    async initialize() {
        return this.start();
    }
    async start() {
        if (this.watcher) {
            await this.stop();
        }
        console.log("🔍 Starting file watcher...");
        // Initialize file hashes for existing files
        await this.initializeFileHashes();
        // Create watcher with polling fallback for unreliable environments
        // Force polling on macOS due to SIP limitations
        const isMacOS = process.platform === "darwin";
        const usePolling = process.env.USE_POLLING === "true" ||
            process.env.NODE_ENV === "test" ||
            isMacOS; // Force polling on macOS for reliability
        console.log(`${usePolling ? "🔄" : "👁️ "} Using ${usePolling ? "polling" : "native"} file watching mode`);
        this.watcher = chokidar.watch(this.config.watchPaths, {
            ignored: this.config.ignorePatterns,
            persistent: true,
            ignoreInitial: true,
            usePolling: usePolling, // Force polling in test environments or when requested
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: usePolling ? 100 : 50, // Slower polling when forced
            },
            interval: usePolling ? 100 : undefined, // Polling interval when using polling
        });
        // Bind event handlers
        this.watcher.on("add", (filePath) => this.handleFileChange(filePath, "create"));
        this.watcher.on("change", (filePath) => this.handleFileChange(filePath, "modify"));
        this.watcher.on("unlink", (filePath) => this.handleFileChange(filePath, "delete"));
        this.watcher.on("addDir", (dirPath) => this.handleDirectoryChange(dirPath, "create"));
        this.watcher.on("unlinkDir", (dirPath) => this.handleDirectoryChange(dirPath, "delete"));
        // Handle watcher errors
        this.watcher.on("error", (error) => {
            console.error("File watcher error:", error);
            this.emit("error", error);
        });
        console.log(`✅ File watcher started, monitoring: ${this.config.watchPaths.join(", ")}`);
    }
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            console.log("🛑 File watcher stopped");
        }
    }
    async handleFileChange(filePath, type) {
        try {
            const absolutePath = path.resolve(filePath);
            const relativePath = path.relative(process.cwd(), filePath);
            const change = {
                path: relativePath,
                absolutePath,
                type,
            };
            if (type !== "delete") {
                const stats = await fs.stat(absolutePath);
                change.stats = {
                    size: stats.size,
                    mtime: stats.mtime,
                    isDirectory: stats.isDirectory(),
                };
                // Calculate file hash for change detection
                if (!stats.isDirectory()) {
                    const content = await fs.readFile(absolutePath);
                    change.hash = crypto
                        .createHash("sha256")
                        .update(content)
                        .digest("hex");
                }
            }
            // Check if file actually changed
            const previousHash = this.fileHashes.get(relativePath);
            if (change.hash && previousHash === change.hash && type === "modify") {
                return; // No actual change
            }
            // Update hash cache
            if (change.hash) {
                this.fileHashes.set(relativePath, change.hash);
            }
            else if (type === "delete") {
                this.fileHashes.delete(relativePath);
            }
            this.queueChange(change);
        }
        catch (error) {
            console.error(`Error handling file change ${filePath}:`, error);
        }
    }
    async handleDirectoryChange(dirPath, type) {
        const absolutePath = path.resolve(dirPath);
        const relativePath = path.relative(process.cwd(), dirPath);
        const change = {
            path: relativePath,
            absolutePath,
            type,
            stats: {
                size: 0,
                mtime: new Date(),
                isDirectory: true,
            },
        };
        this.queueChange(change);
    }
    queueChange(change) {
        this.changeQueue.push(change);
        // Debounce processing
        if (!this.processing) {
            setTimeout(() => this.processChanges(), this.config.debounceMs);
        }
    }
    async processChanges() {
        if (this.processing || this.changeQueue.length === 0) {
            return;
        }
        this.processing = true;
        try {
            // Group changes by type and path
            const changesByPath = new Map();
            const changes = [...this.changeQueue];
            this.changeQueue = [];
            // Process in batches
            const batches = this.chunkArray(changes, this.config.maxConcurrent);
            for (const batch of batches) {
                const promises = batch.map((change) => this.processChange(change));
                await Promise.allSettled(promises);
            }
            // Emit batch completion
            if (changes.length > 0) {
                this.emit("batchComplete", changes);
            }
        }
        catch (error) {
            console.error("Error processing changes:", error);
            this.emit("error", error);
        }
        finally {
            this.processing = false;
            // Process any new changes that arrived during processing
            if (this.changeQueue.length > 0) {
                setTimeout(() => this.processChanges(), 100);
            }
        }
    }
    async processChange(change) {
        try {
            // Emit individual change event
            this.emit("change", change);
            // Determine change priority
            const priority = this.getChangePriority(change);
            // Emit typed events
            switch (change.type) {
                case "create":
                    this.emit("fileCreated", change);
                    break;
                case "modify":
                    this.emit("fileModified", change);
                    break;
                case "delete":
                    this.emit("fileDeleted", change);
                    break;
                case "rename":
                    this.emit("fileRenamed", change);
                    break;
            }
            console.log(`${this.getChangeIcon(change.type)} ${change.path} (${priority} priority)`);
        }
        catch (error) {
            console.error(`Error processing change ${change.path}:`, error);
            this.emit("changeError", change, error);
        }
    }
    getChangePriority(change) {
        const path = change.path.toLowerCase();
        // Low priority: Generated files, build artifacts, logs
        if (path.includes("dist/") ||
            path.includes("build/") ||
            path.includes("coverage/") ||
            path.includes("logs/") ||
            path.includes(".log") ||
            path.includes("node_modules/")) {
            return "low";
        }
        // High priority: Core source files
        if (/\.(ts|tsx|js|jsx)$/.test(path) &&
            !path.includes("test") &&
            !path.includes("spec")) {
            return "high";
        }
        // Medium priority: Config files, documentation
        if (/\.(json|yaml|yml|md|config)$/.test(path) || path.includes("readme")) {
            return "medium";
        }
        // Low priority: Everything else
        return "low";
    }
    getChangeIcon(type) {
        switch (type) {
            case "create":
                return "📄";
            case "modify":
                return "✏️";
            case "delete":
                return "🗑️";
            case "rename":
                return "🏷️";
            default:
                return "📝";
        }
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    async initializeFileHashes() {
        console.log("🔄 Initializing file hashes...");
        const scanPromises = [];
        for (const watchPath of this.config.watchPaths) {
            scanPromises.push(this.scanDirectory(watchPath));
        }
        await Promise.allSettled(scanPromises);
        console.log(`📊 Initialized hashes for ${this.fileHashes.size} files`);
    }
    async scanDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(process.cwd(), fullPath);
                // Skip ignored patterns
                if (this.shouldIgnore(relativePath)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath);
                }
                else if (entry.isFile()) {
                    try {
                        const content = await fs.readFile(fullPath);
                        const hash = crypto
                            .createHash("sha256")
                            .update(content)
                            .digest("hex");
                        this.fileHashes.set(relativePath, hash);
                    }
                    catch (error) {
                        // Skip files that can't be read
                        console.warn(`Could not hash file ${relativePath}:`, error);
                    }
                }
            }
        }
        catch (error) {
            // Skip directories that can't be read
            console.warn(`Could not scan directory ${dirPath}:`, error);
        }
    }
    shouldIgnore(filePath) {
        return this.config.ignorePatterns.some((pattern) => this.globToRegex(pattern).test(filePath));
    }
    // Convert a minimal glob to a RegExp supporting:
    // - "**" for any number of path segments (including none)
    // - "*" for any number of non-separator chars within a path segment
    // Other characters are treated literally.
    globToRegex(pattern) {
        let out = "";
        for (let i = 0; i < pattern.length;) {
            // Handle **/
            if (pattern.startsWith("**/", i)) {
                out += "(?:.*/)?";
                i += 3;
                continue;
            }
            // Handle /**/
            if (pattern.startsWith("/**/", i)) {
                out += "(?:/.*/)?";
                i += 4;
                continue;
            }
            // Handle ** (any path including separators)
            if (pattern.startsWith("**", i)) {
                out += ".*";
                i += 2;
                continue;
            }
            const ch = pattern[i];
            if (ch === "*") {
                // Any chars except path separator
                out += "[^/]*";
                i += 1;
                continue;
            }
            // Escape regex special characters
            if (/[-/\\^$+?.()|[\]{}]/.test(ch)) {
                out += `\\${ch}`;
            }
            else {
                out += ch;
            }
            i += 1;
        }
        return new RegExp(`^${out}$`);
    }
    // Public API methods
    getWatchedPaths() {
        return this.config.watchPaths;
    }
    getQueueLength() {
        return this.changeQueue.length;
    }
    isProcessing() {
        return this.processing;
    }
    // Force a rescan of all files
    async rescan() {
        this.fileHashes.clear();
        await this.initializeFileHashes();
        console.log("🔄 File rescan complete");
    }
}
//# sourceMappingURL=FileWatcher.js.map