import * as fs from "fs/promises";
import * as nodeFs from "fs";
import * as path from "path";
export class LocalFilesystemStorageProvider {
    constructor(options) {
        var _a;
        this.supportsStreaming = true;
        this.basePath = options.basePath;
        this.allowCreate = (_a = options.allowCreate) !== null && _a !== void 0 ? _a : true;
        this.id = `local:${path.resolve(this.basePath)}`;
    }
    resolve(relativePath) {
        const normalized = path.normalize(relativePath).replace(/^\.\/+/, "");
        return path.join(this.basePath, normalized);
    }
    async ensureReady() {
        const storagePath = this.resolve(".");
        try {
            await fs.mkdir(storagePath, { recursive: true });
        }
        catch (error) {
            if (!this.allowCreate) {
                throw new Error(`Unable to initialize local storage provider at ${storagePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
            throw error;
        }
    }
    async writeFile(relativePath, data, _options) {
        const absolutePath = this.resolve(relativePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, data);
    }
    async readFile(relativePath, _options) {
        const absolutePath = this.resolve(relativePath);
        return fs.readFile(absolutePath);
    }
    async removeFile(relativePath) {
        const absolutePath = this.resolve(relativePath);
        try {
            await fs.unlink(absolutePath);
        }
        catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }
    async exists(relativePath) {
        const absolutePath = this.resolve(relativePath);
        try {
            await fs.access(absolutePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    async stat(relativePath) {
        const absolutePath = this.resolve(relativePath);
        try {
            const stats = await fs.stat(absolutePath);
            return {
                path: relativePath,
                size: stats.size,
                modifiedAt: stats.mtime,
            };
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }
    async list(prefix = "") {
        const absolutePrefix = this.resolve(prefix || ".");
        let entries;
        try {
            entries = (await fs.readdir(absolutePrefix, {
                withFileTypes: true,
            }));
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
        const results = [];
        for (const entry of entries) {
            const relative = path.join(prefix, entry.name);
            if (entry.isDirectory()) {
                const nested = await this.list(relative);
                results.push(...nested);
            }
            else {
                results.push(relative);
            }
        }
        return results;
    }
    createReadStream(relativePath) {
        const absolutePath = this.resolve(relativePath);
        return nodeFs.createReadStream(absolutePath);
    }
    createWriteStream(relativePath) {
        const absolutePath = this.resolve(relativePath);
        nodeFs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        return nodeFs.createWriteStream(absolutePath);
    }
}
//# sourceMappingURL=LocalFilesystemStorageProvider.js.map