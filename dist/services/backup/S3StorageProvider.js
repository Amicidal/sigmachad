import path from "node:path";
import { PassThrough, Readable } from "node:stream";
const NOT_FOUND_CODES = new Set(["NotFound", "NoSuchKey", "404"]);
export class S3StorageProvider {
    constructor(options) {
        var _a;
        this.supportsStreaming = true;
        if (!options.bucket) {
            throw new Error("S3StorageProvider requires a bucket name");
        }
        this.options = options;
        this.bucket = options.bucket;
        this.prefix = options.prefix ? this.normalizePrefix(options.prefix) : undefined;
        this.id = (_a = options.id) !== null && _a !== void 0 ? _a : `s3:${this.bucket}${this.prefix ? `/${this.prefix}` : ""}`;
    }
    async ensureReady() {
        const { HeadBucketCommand, CreateBucketCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        try {
            await client.send(new HeadBucketCommand({ Bucket: this.bucket }));
        }
        catch (error) {
            if (this.options.autoCreate && this.isNotFoundError(error)) {
                await client.send(new CreateBucketCommand({
                    Bucket: this.bucket,
                    CreateBucketConfiguration: this.options.region
                        ? { LocationConstraint: this.options.region }
                        : undefined,
                }));
                return;
            }
            throw this.wrapAwsError("Failed to access S3 bucket", error);
        }
    }
    async writeFile(relativePath, data, options) {
        const { PutObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        const Body = typeof data === "string" ? Buffer.from(data) : data;
        try {
            await client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: this.buildKey(relativePath),
                Body,
                ContentType: options === null || options === void 0 ? void 0 : options.contentType,
                Metadata: this.sanitizeMetadata(options === null || options === void 0 ? void 0 : options.metadata),
                ServerSideEncryption: this.options.serverSideEncryption,
                SSEKMSKeyId: this.options.kmsKeyId,
            }));
        }
        catch (error) {
            throw this.wrapAwsError("Failed to upload backup artifact to S3", error);
        }
    }
    async readFile(relativePath, _options) {
        const { GetObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        try {
            const result = await client.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: this.buildKey(relativePath),
            }));
            return this.normaliseBodyToBuffer(result === null || result === void 0 ? void 0 : result.Body);
        }
        catch (error) {
            if (this.isNotFoundError(error)) {
                throw new Error(`S3 object not found for key ${relativePath}`);
            }
            throw this.wrapAwsError("Failed to read backup artifact from S3", error);
        }
    }
    async removeFile(relativePath) {
        const { DeleteObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        try {
            await client.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: this.buildKey(relativePath),
            }));
        }
        catch (error) {
            throw this.wrapAwsError("Failed to delete backup artifact from S3", error);
        }
    }
    async exists(relativePath) {
        const { HeadObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        try {
            await client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: this.buildKey(relativePath),
            }));
            return true;
        }
        catch (error) {
            if (this.isNotFoundError(error)) {
                return false;
            }
            throw this.wrapAwsError("Failed to determine S3 object availability", error);
        }
    }
    async stat(relativePath) {
        var _a;
        const { HeadObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        try {
            const response = await client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: this.buildKey(relativePath),
            }));
            return {
                path: relativePath,
                size: Number((_a = response === null || response === void 0 ? void 0 : response.ContentLength) !== null && _a !== void 0 ? _a : 0),
                modifiedAt: (response === null || response === void 0 ? void 0 : response.LastModified)
                    ? new Date(response.LastModified)
                    : new Date(),
            };
        }
        catch (error) {
            if (this.isNotFoundError(error)) {
                return null;
            }
            throw this.wrapAwsError("Failed to obtain S3 object metadata", error);
        }
    }
    async list(prefix = "") {
        var _a;
        const { ListObjectsV2Command } = await this.loadAwsClient();
        const client = await this.getClient();
        const results = [];
        const effectivePrefix = this.buildKey(prefix);
        try {
            let continuationToken;
            do {
                const response = await client.send(new ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: effectivePrefix,
                    ContinuationToken: continuationToken,
                }));
                const contents = (_a = response === null || response === void 0 ? void 0 : response.Contents) !== null && _a !== void 0 ? _a : [];
                for (const item of contents) {
                    if (!item.Key)
                        continue;
                    results.push(this.stripPrefix(item.Key));
                }
                continuationToken = response === null || response === void 0 ? void 0 : response.NextContinuationToken;
            } while (continuationToken);
            return results;
        }
        catch (error) {
            throw this.wrapAwsError("Failed to list S3 backup artifacts", error);
        }
    }
    createReadStream(relativePath) {
        const stream = new PassThrough();
        this.readToStream(relativePath, stream).catch((error) => {
            stream.emit("error", error);
        });
        return stream;
    }
    createWriteStream(relativePath) {
        const stream = new PassThrough();
        this.pipeUpload(relativePath, stream).catch((error) => {
            stream.emit("error", error);
        });
        return stream;
    }
    async readToStream(relativePath, target) {
        const { GetObjectCommand } = await this.loadAwsClient();
        const client = await this.getClient();
        const response = await client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.buildKey(relativePath),
        }));
        const body = response === null || response === void 0 ? void 0 : response.Body;
        if (body instanceof Readable) {
            body.pipe(target);
            return;
        }
        try {
            const buffer = await this.normaliseBodyToBuffer(body);
            target.end(buffer);
        }
        catch (error) {
            target.emit("error", error);
        }
    }
    async pipeUpload(relativePath, body) {
        var _a, _b;
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
            queueSize: (_a = this.options.uploadConcurrency) !== null && _a !== void 0 ? _a : 4,
            partSize: (_b = this.options.uploadPartSizeBytes) !== null && _b !== void 0 ? _b : 5 * 1024 * 1024,
            leavePartsOnError: false,
        });
        await upload.done();
    }
    sanitizeMetadata(metadata) {
        if (!metadata)
            return undefined;
        const clean = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (value === undefined || value === null)
                continue;
            clean[key] = String(value);
        }
        return Object.keys(clean).length > 0 ? clean : undefined;
    }
    stripPrefix(fullKey) {
        const normalized = fullKey.replace(/\\+/g, "/");
        const prefix = this.prefix ? `${this.prefix.replace(/\\+/g, "/")}/` : "";
        if (prefix && normalized.startsWith(prefix)) {
            return normalized.slice(prefix.length);
        }
        return normalized;
    }
    normalizePrefix(value) {
        return value
            .replace(/\\+/g, "/")
            .split("/")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0)
            .join("/");
    }
    normalizeRelativePath(value) {
        return value
            .replace(/\\+/g, "/")
            .split("/")
            .filter((segment) => segment.length > 0)
            .join("/");
    }
    buildKey(relativePath) {
        const sanitized = this.normalizeRelativePath(relativePath);
        if (!this.prefix) {
            return sanitized;
        }
        if (!sanitized) {
            return this.prefix;
        }
        return path.posix.join(this.prefix, sanitized);
    }
    async getClient() {
        if (!this.clientPromise) {
            const { S3Client } = await this.loadAwsClient();
            const credentials = this.options.credentials
                ? {
                    accessKeyId: this.options.credentials.accessKeyId,
                    secretAccessKey: this.options.credentials.secretAccessKey,
                    sessionToken: this.options.credentials.sessionToken,
                }
                : undefined;
            this.clientPromise = Promise.resolve(new S3Client({
                region: this.options.region,
                endpoint: this.options.endpoint,
                forcePathStyle: this.options.forcePathStyle,
                credentials,
            }));
        }
        return this.clientPromise;
    }
    async loadAwsClient() {
        if (!this.awsSdkPromise) {
            this.awsSdkPromise = (async () => {
                try {
                    const module = await import("@aws-sdk/client-s3");
                    return module;
                }
                catch (error) {
                    throw new Error("S3 support requires optional dependency '@aws-sdk/client-s3'. Install it to enable the S3 storage provider.");
                }
            })();
        }
        return this.awsSdkPromise;
    }
    async loadUploadSdk() {
        if (!this.uploadSdkPromise) {
            this.uploadSdkPromise = (async () => {
                try {
                    const module = await import("@aws-sdk/lib-storage");
                    return module;
                }
                catch (error) {
                    throw new Error("S3 support requires optional dependency '@aws-sdk/lib-storage'. Install it to enable streaming uploads.");
                }
            })();
        }
        return this.uploadSdkPromise;
    }
    isNotFoundError(error) {
        var _a, _b;
        if (!error)
            return false;
        if (NOT_FOUND_CODES.has(error === null || error === void 0 ? void 0 : error.name))
            return true;
        const status = (_b = (_a = error === null || error === void 0 ? void 0 : error.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) !== null && _b !== void 0 ? _b : error === null || error === void 0 ? void 0 : error.statusCode;
        if (status === 404)
            return true;
        const code = (error === null || error === void 0 ? void 0 : error.Code) || (error === null || error === void 0 ? void 0 : error.code);
        if (code && NOT_FOUND_CODES.has(String(code)))
            return true;
        return false;
    }
    wrapAwsError(message, error) {
        const details = error instanceof Error ? error.message : String(error);
        const err = new Error(`${message}: ${details}`);
        err.cause = error;
        return err;
    }
    async normaliseBodyToBuffer(body) {
        if (!body) {
            return Buffer.alloc(0);
        }
        if (Buffer.isBuffer(body)) {
            return body;
        }
        if (body instanceof Readable) {
            const chunks = [];
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
//# sourceMappingURL=S3StorageProvider.js.map