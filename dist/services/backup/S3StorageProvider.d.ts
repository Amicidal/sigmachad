import { PassThrough, Readable } from "node:stream";
import type { BackupFileStat, BackupStorageProvider, BackupStorageReadOptions, BackupStorageWriteOptions } from "./BackupStorageProvider.js";
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
export declare class S3StorageProvider implements BackupStorageProvider {
    readonly id: string;
    readonly supportsStreaming = true;
    private clientPromise?;
    private readonly bucket;
    private readonly prefix?;
    private readonly options;
    private awsSdkPromise?;
    private uploadSdkPromise?;
    constructor(options: S3StorageProviderOptions);
    ensureReady(): Promise<void>;
    writeFile(relativePath: string, data: string | Buffer, options?: BackupStorageWriteOptions): Promise<void>;
    readFile(relativePath: string, _options?: BackupStorageReadOptions): Promise<Buffer>;
    removeFile(relativePath: string): Promise<void>;
    exists(relativePath: string): Promise<boolean>;
    stat(relativePath: string): Promise<BackupFileStat | null>;
    list(prefix?: string): Promise<string[]>;
    createReadStream(relativePath: string): Readable;
    createWriteStream(relativePath: string): PassThrough;
    private readToStream;
    private pipeUpload;
    private sanitizeMetadata;
    private stripPrefix;
    private normalizePrefix;
    private normalizeRelativePath;
    private buildKey;
    private getClient;
    private loadAwsClient;
    private loadUploadSdk;
    private isNotFoundError;
    private wrapAwsError;
    private normaliseBodyToBuffer;
}
//# sourceMappingURL=S3StorageProvider.d.ts.map