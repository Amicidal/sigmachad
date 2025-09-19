import path from "node:path";
import { PassThrough } from "node:stream";
import type {
  BackupFileStat,
  BackupStorageProvider,
  BackupStorageReadOptions,
  BackupStorageWriteOptions,
} from "./BackupStorageProvider.js";

export interface GCSStorageProviderCredentials {
  clientEmail?: string;
  privateKey?: string;
}

export interface GCSStorageProviderOptions {
  id?: string;
  bucket: string;
  prefix?: string;
  projectId?: string;
  keyFilename?: string;
  credentials?: GCSStorageProviderCredentials;
  autoCreate?: boolean;
  resumableUploads?: boolean;
  makePublic?: boolean;
}

interface GcsModule {
  Storage: any;
}

export class GCSStorageProvider implements BackupStorageProvider {
  readonly id: string;
  readonly supportsStreaming = true;

  private storagePromise?: Promise<any>;
  private readonly bucketName: string;
  private readonly prefix?: string;
  private readonly options: GCSStorageProviderOptions;
  private gcsModulePromise?: Promise<GcsModule>;

  constructor(options: GCSStorageProviderOptions) {
    if (!options.bucket) {
      throw new Error("GCSStorageProvider requires a bucket name");
    }
    this.options = options;
    this.bucketName = options.bucket;
    this.prefix = options.prefix ? this.normalizePrefix(options.prefix) : undefined;
    this.id = options.id ?? `gcs:${this.bucketName}${this.prefix ? `/${this.prefix}` : ""}`;
  }

  async ensureReady(): Promise<void> {
    const bucket = await this.getBucket();
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        if (!this.options.autoCreate) {
          throw new Error(`GCS bucket ${this.bucketName} does not exist`);
        }
        await bucket.create();
      }
    } catch (error) {
      throw this.wrapGcsError("Failed to access Google Cloud Storage bucket", error);
    }
  }

  async writeFile(
    relativePath: string,
    data: string | Buffer,
    options?: BackupStorageWriteOptions
  ): Promise<void> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));
    const body = typeof data === "string" ? Buffer.from(data) : data;

    try {
      await file.save(body, {
        resumable: this.options.resumableUploads ?? true,
        contentType: options?.contentType,
        metadata: this.sanitizeMetadata(options?.metadata),
        gzip: false,
      });

      if (this.options.makePublic) {
        await file.makePublic();
      }
    } catch (error) {
      throw this.wrapGcsError("Failed to upload backup artifact to GCS", error);
    }
  }

  async readFile(
    relativePath: string,
    _options?: BackupStorageReadOptions
  ): Promise<Buffer> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));

    try {
      const [buffer] = await file.download();
      return buffer as Buffer;
    } catch (error: any) {
      if (error?.code === 404) {
        throw new Error(`GCS object not found for key ${relativePath}`);
      }
      throw this.wrapGcsError("Failed to read backup artifact from GCS", error);
    }
  }

  async removeFile(relativePath: string): Promise<void> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));

    try {
      await file.delete({ ignoreNotFound: true });
    } catch (error) {
      throw this.wrapGcsError("Failed to delete backup artifact from GCS", error);
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));

    try {
      const [exists] = await file.exists();
      return Boolean(exists);
    } catch (error) {
      throw this.wrapGcsError("Failed to determine GCS object availability", error);
    }
  }

  async stat(relativePath: string): Promise<BackupFileStat | null> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));

    try {
      const [metadata] = await file.getMetadata();
      if (!metadata) {
        return null;
      }

      return {
        path: relativePath,
        size: Number(metadata.size ?? 0),
        modifiedAt: metadata.updated ? new Date(metadata.updated) : new Date(),
      };
    } catch (error: any) {
      if (error?.code === 404) {
        return null;
      }
      throw this.wrapGcsError("Failed to obtain GCS object metadata", error);
    }
  }

  async list(prefix = ""): Promise<string[]> {
    const bucket = await this.getBucket();
    const effectivePrefix = this.buildKey(prefix);
    const results: string[] = [];

    try {
      let pageToken: string | undefined;
      do {
        const [files, , response] = await bucket.getFiles({
          prefix: effectivePrefix,
          autoPaginate: false,
          pageToken,
        });

        for (const file of files ?? []) {
          if (!file?.name) continue;
          results.push(this.stripPrefix(file.name));
        }

        pageToken = response?.nextPageToken;
      } while (pageToken);

      return results;
    } catch (error) {
      throw this.wrapGcsError("Failed to list GCS backup artifacts", error);
    }
  }

  createReadStream(relativePath: string): Readable {
    const stream = new PassThrough();
    this.pipeReadStream(relativePath, stream).catch((error) => {
      stream.emit("error", error);
    });
    return stream;
  }

  createWriteStream(relativePath: string): PassThrough {
    const stream = new PassThrough();
    this.pipeWriteStream(relativePath, stream).catch((error) => {
      stream.emit("error", error);
    });
    return stream;
  }

  private async pipeReadStream(relativePath: string, target: PassThrough): Promise<void> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));
    const source = file.createReadStream();
    source.on("error", (error: any) => target.emit("error", error));
    source.pipe(target);
  }

  private async pipeWriteStream(relativePath: string, source: PassThrough): Promise<void> {
    const bucket = await this.getBucket();
    const file = bucket.file(this.buildKey(relativePath));

    await new Promise<void>((resolve, reject) => {
      const destination = file.createWriteStream({
        resumable: this.options.resumableUploads ?? true,
      });
      source.pipe(destination);
      destination.on("error", reject);
      destination.on("finish", async () => {
        try {
          if (this.options.makePublic) {
            await file.makePublic();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      source.on("error", reject);
    });
  }

  private sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> | undefined {
    const merged = metadata ? { ...metadata } : {};
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  private normalizePrefix(value: string): string {
    return value
      .replace(/\\+/g, "/")
      .split("/")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .join("/");
  }

  private normalizeRelativePath(value: string): string {
    return value
      .replace(/\\+/g, "/")
      .split("/")
      .filter((segment) => segment.length > 0)
      .join("/");
  }

  private stripPrefix(name: string): string {
    if (!this.prefix) {
      return name.replace(/\\+/g, "/");
    }
    const normalizedPrefix = `${this.prefix}/`;
    return name.startsWith(normalizedPrefix)
      ? name.slice(normalizedPrefix.length)
      : name;
  }

  private buildKey(relativePath: string): string {
    const sanitized = this.normalizeRelativePath(relativePath);
    if (!this.prefix) {
      return sanitized;
    }
    if (!sanitized) {
      return this.prefix;
    }
    return path.posix.join(this.prefix, sanitized);
  }

  private async getBucket(): Promise<any> {
    const storage = await this.getStorage();
    return storage.bucket(this.bucketName);
  }

  private async getStorage(): Promise<any> {
    if (!this.storagePromise) {
      const { Storage } = await this.loadGcsModule();
      const credentials = this.options.credentials?.clientEmail
        ? {
            client_email: this.options.credentials.clientEmail,
            private_key: this.options.credentials.privateKey,
          }
        : undefined;

      this.storagePromise = Promise.resolve(
        new Storage({
          projectId: this.options.projectId,
          keyFilename: this.options.keyFilename,
          credentials,
        })
      );
    }
    return this.storagePromise;
  }

  private async loadGcsModule(): Promise<GcsModule> {
    if (!this.gcsModulePromise) {
      this.gcsModulePromise = (async () => {
        try {
          const module = await import("@google-cloud/storage");
          return module as GcsModule;
        } catch (error) {
          throw new Error(
            "GCS support requires optional dependency '@google-cloud/storage'. Install it to enable the GCS storage provider."
          );
        }
      })();
    }
    return this.gcsModulePromise;
  }

  private wrapGcsError(message: string, error: any): Error {
    const details = error instanceof Error ? error.message : String(error);
    const err = new Error(`${message}: ${details}`);
    (err as any).cause = error;
    return err;
  }
}
