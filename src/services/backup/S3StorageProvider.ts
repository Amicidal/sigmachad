import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import type {
  BackupFileStat,
  BackupStorageProvider,
  BackupStorageReadOptions,
  BackupStorageWriteOptions,
} from "./BackupStorageProvider.js";

export interface S3StorageProviderCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface S3StorageProviderOptions {
  id?: string;
  bucket: string;
  region?: string;
  prefix?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  credentials?: S3StorageProviderCredentials;
  autoCreate?: boolean;
  kmsKeyId?: string;
  serverSideEncryption?: string;
  uploadConcurrency?: number;
  uploadPartSizeBytes?: number;
}

interface AwsSdkBundle {
  S3Client: any;
  HeadBucketCommand: any;
  CreateBucketCommand: any;
  PutObjectCommand: any;
  GetObjectCommand: any;
  DeleteObjectCommand: any;
  ListObjectsV2Command: any;
  HeadObjectCommand: any;
}

interface AwsUploadBundle {
  Upload: any;
}

const NOT_FOUND_CODES = new Set(["NotFound", "NoSuchKey", "404"]);

export class S3StorageProvider implements BackupStorageProvider {
  readonly id: string;
  readonly supportsStreaming = true;

  private clientPromise?: Promise<any>;
  private readonly bucket: string;
  private readonly prefix?: string;
  private readonly options: S3StorageProviderOptions;
  private awsSdkPromise?: Promise<AwsSdkBundle>;
  private uploadSdkPromise?: Promise<AwsUploadBundle>;

  constructor(options: S3StorageProviderOptions) {
    if (!options.bucket) {
      throw new Error("S3StorageProvider requires a bucket name");
    }
    this.options = options;
    this.bucket = options.bucket;
    this.prefix = options.prefix ? this.normalizePrefix(options.prefix) : undefined;
    this.id = options.id ?? `s3:${this.bucket}${this.prefix ? `/${this.prefix}` : ""}`;
  }

  async ensureReady(): Promise<void> {
    const { HeadBucketCommand, CreateBucketCommand } = await this.loadAwsClient();
    const client = await this.getClient();

    try {
      await client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: any) {
      if (this.options.autoCreate && this.isNotFoundError(error)) {
        await client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
            CreateBucketConfiguration: this.options.region
              ? { LocationConstraint: this.options.region }
              : undefined,
          })
        );
        return;
      }
      throw this.wrapAwsError("Failed to access S3 bucket", error);
    }
  }

  async writeFile(
    relativePath: string,
    data: string | Buffer,
    options?: BackupStorageWriteOptions
  ): Promise<void> {
    const { PutObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();
    const Body = typeof data === "string" ? Buffer.from(data) : data;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.buildKey(relativePath),
          Body,
          ContentType: options?.contentType,
          Metadata: this.sanitizeMetadata(options?.metadata),
          ServerSideEncryption: this.options.serverSideEncryption,
          SSEKMSKeyId: this.options.kmsKeyId,
        })
      );
    } catch (error) {
      throw this.wrapAwsError("Failed to upload backup artifact to S3", error);
    }
  }

  async readFile(
    relativePath: string,
    _options?: BackupStorageReadOptions
  ): Promise<Buffer> {
    const { GetObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();

    try {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.buildKey(relativePath),
        })
      );
      return this.normaliseBodyToBuffer(result?.Body);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(`S3 object not found for key ${relativePath}`);
      }
      throw this.wrapAwsError("Failed to read backup artifact from S3", error);
    }
  }

  async removeFile(relativePath: string): Promise<void> {
    const { DeleteObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.buildKey(relativePath),
        })
      );
    } catch (error) {
      throw this.wrapAwsError("Failed to delete backup artifact from S3", error);
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const { HeadObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.buildKey(relativePath),
        })
      );
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw this.wrapAwsError("Failed to determine S3 object availability", error);
    }
  }

  async stat(relativePath: string): Promise<BackupFileStat | null> {
    const { HeadObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();

    try {
      const response = await client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.buildKey(relativePath),
        })
      );
      return {
        path: relativePath,
        size: Number(response?.ContentLength ?? 0),
        modifiedAt: response?.LastModified
          ? new Date(response.LastModified)
          : new Date(),
      };
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw this.wrapAwsError("Failed to obtain S3 object metadata", error);
    }
  }

  async list(prefix = ""): Promise<string[]> {
    const { ListObjectsV2Command } = await this.loadAwsClient();
    const client = await this.getClient();
    const results: string[] = [];
    const effectivePrefix = this.buildKey(prefix);

    try {
      let continuationToken: string | undefined;
      do {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: effectivePrefix,
            ContinuationToken: continuationToken,
          })
        );

        const contents: Array<{ Key?: string }> = response?.Contents ?? [];
        for (const item of contents) {
          if (!item.Key) continue;
          results.push(this.stripPrefix(item.Key));
        }

        continuationToken = response?.NextContinuationToken;
      } while (continuationToken);

      return results;
    } catch (error) {
      throw this.wrapAwsError("Failed to list S3 backup artifacts", error);
    }
  }

  createReadStream(relativePath: string): Readable {
    const stream = new PassThrough();
    this.readToStream(relativePath, stream).catch((error) => {
      stream.emit("error", error);
    });
    return stream;
  }

  createWriteStream(relativePath: string): PassThrough {
    const stream = new PassThrough();
    this.pipeUpload(relativePath, stream).catch((error) => {
      stream.emit("error", error);
    });
    return stream;
  }

  private async readToStream(relativePath: string, target: PassThrough): Promise<void> {
    const { GetObjectCommand } = await this.loadAwsClient();
    const client = await this.getClient();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.buildKey(relativePath),
      })
    );
    const body = response?.Body;

    if (body instanceof Readable) {
      body.pipe(target);
      return;
    }

    try {
      const buffer = await this.normaliseBodyToBuffer(body);
      target.end(buffer);
    } catch (error) {
      target.emit("error", error);
    }
  }

  private async pipeUpload(relativePath: string, body: PassThrough): Promise<void> {
    const { Upload } = await this.loadUploadSdk();
    const client = await this.getClient();

    const upload = new Upload({
      client,
      params: {
        Bucket: this.bucket,
        Key: this.buildKey(relativePath),
        Body: body,
        ServerSideEncryption: this.options.serverSideEncryption,
        SSEKMSKeyId: this.options.kmsKeyId,
      },
      queueSize: this.options.uploadConcurrency ?? 4,
      partSize: this.options.uploadPartSizeBytes ?? 5 * 1024 * 1024,
      leavePartsOnError: false,
    });

    await upload.done();
  }

  private sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> | undefined {
    if (!metadata) return undefined;
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined || value === null) continue;
      clean[key] = String(value);
    }
    return Object.keys(clean).length > 0 ? clean : undefined;
  }

  private stripPrefix(fullKey: string): string {
    const normalized = fullKey.replace(/\\+/g, "/");
    const prefix = this.prefix ? `${this.prefix.replace(/\\+/g, "/")}/` : "";
    if (prefix && normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
    return normalized;
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

  private async getClient(): Promise<any> {
    if (!this.clientPromise) {
      const { S3Client } = await this.loadAwsClient();
      const credentials = this.options.credentials
        ? {
            accessKeyId: this.options.credentials.accessKeyId,
            secretAccessKey: this.options.credentials.secretAccessKey,
            sessionToken: this.options.credentials.sessionToken,
          }
        : undefined;

      this.clientPromise = Promise.resolve(
        new S3Client({
          region: this.options.region,
          endpoint: this.options.endpoint,
          forcePathStyle: this.options.forcePathStyle,
          credentials,
        })
      );
    }
    return this.clientPromise;
  }

  private async loadAwsClient(): Promise<AwsSdkBundle> {
    if (!this.awsSdkPromise) {
      this.awsSdkPromise = (async () => {
        try {
          const module = await import("@aws-sdk/client-s3");
          return module as AwsSdkBundle;
        } catch (error) {
          throw new Error(
            "S3 support requires optional dependency '@aws-sdk/client-s3'. Install it to enable the S3 storage provider."
          );
        }
      })();
    }
    return this.awsSdkPromise;
  }

  private async loadUploadSdk(): Promise<AwsUploadBundle> {
    if (!this.uploadSdkPromise) {
      this.uploadSdkPromise = (async () => {
        try {
          const module = await import("@aws-sdk/lib-storage");
          return module as AwsUploadBundle;
        } catch (error) {
          throw new Error(
            "S3 support requires optional dependency '@aws-sdk/lib-storage'. Install it to enable streaming uploads."
          );
        }
      })();
    }
    return this.uploadSdkPromise;
  }

  private isNotFoundError(error: any): boolean {
    if (!error) return false;
    if (NOT_FOUND_CODES.has(error?.name)) return true;
    const status = error?.$metadata?.httpStatusCode ?? error?.statusCode;
    if (status === 404) return true;
    const code = error?.Code || error?.code;
    if (code && NOT_FOUND_CODES.has(String(code))) return true;
    return false;
  }

  private wrapAwsError(message: string, error: any): Error {
    const details = error instanceof Error ? error.message : String(error);
    const err = new Error(`${message}: ${details}`);
    (err as any).cause = error;
    return err;
  }

  private async normaliseBodyToBuffer(body: any): Promise<Buffer> {
    if (!body) {
      return Buffer.alloc(0);
    }

    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    if (typeof body === "string") {
      return Buffer.from(body);
    }

    if (typeof body.arrayBuffer === "function") {
      const arrayBuffer = await body.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (typeof body.transformToByteArray === "function") {
      const byteArray = await body.transformToByteArray();
      return Buffer.from(byteArray);
    }

    return Buffer.from(body);
  }
}
