import * as fs from "fs/promises";
import * as nodeFs from "fs";
import * as path from "path";
import {
  BackupStorageProvider,
  BackupStorageWriteOptions,
  BackupStorageReadOptions,
  BackupFileStat,
} from "./BackupStorageProvider.js";

export interface LocalFilesystemProviderOptions {
  basePath: string;
  allowCreate?: boolean;
}

export class LocalFilesystemStorageProvider
  implements BackupStorageProvider
{
  readonly id: string;
  readonly supportsStreaming = true;
  private basePath: string;
  private allowCreate: boolean;

  constructor(options: LocalFilesystemProviderOptions) {
    this.basePath = options.basePath;
    this.allowCreate = options.allowCreate ?? true;
    this.id = `local:${path.resolve(this.basePath)}`;
  }

  private resolve(relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^\.\/+/, "");
    return path.join(this.basePath, normalized);
  }

  async ensureReady(): Promise<void> {
    const storagePath = this.resolve(".");
    try {
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      if (!this.allowCreate) {
        throw new Error(
          `Unable to initialize local storage provider at ${storagePath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      throw error;
    }
  }

  async writeFile(
    relativePath: string,
    data: string | Buffer,
    _options?: BackupStorageWriteOptions
  ): Promise<void> {
    const absolutePath = this.resolve(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, data);
  }

  async readFile(
    relativePath: string,
    _options?: BackupStorageReadOptions
  ): Promise<Buffer> {
    const absolutePath = this.resolve(relativePath);
    return fs.readFile(absolutePath);
  }

  async removeFile(relativePath: string): Promise<void> {
    const absolutePath = this.resolve(relativePath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const absolutePath = this.resolve(relativePath);
    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(relativePath: string): Promise<BackupFileStat | null> {
    const absolutePath = this.resolve(relativePath);
    try {
      const stats = await fs.stat(absolutePath);
      return {
        path: relativePath,
        size: stats.size,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async list(prefix = ""): Promise<string[]> {
    const absolutePrefix = this.resolve(prefix || ".");
    let entries: import("fs").Dirent[];
    try {
      entries = (await fs.readdir(absolutePrefix, {
        withFileTypes: true,
      })) as typeof entries;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
    const results: string[] = [];

    for (const entry of entries) {
      const relative = path.join(prefix, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.list(relative);
        results.push(...nested);
      } else {
        results.push(relative);
      }
    }

    return results;
  }

  createReadStream(relativePath: string) {
    const absolutePath = this.resolve(relativePath);
    return nodeFs.createReadStream(absolutePath);
  }

  createWriteStream(relativePath: string) {
    const absolutePath = this.resolve(relativePath);
    nodeFs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    return nodeFs.createWriteStream(absolutePath);
  }
}
