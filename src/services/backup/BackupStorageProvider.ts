export interface BackupFileStat {
  path: string;
  size: number;
  modifiedAt: Date;
}

export interface BackupStorageWriteOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface BackupStorageReadOptions {
  expectedContentType?: string;
}

export interface BackupStorageProvider {
  readonly id: string;
  readonly supportsStreaming: boolean;

  ensureReady(): Promise<void>;
  writeFile(
    relativePath: string,
    data: string | Buffer,
    options?: BackupStorageWriteOptions
  ): Promise<void>;
  readFile(
    relativePath: string,
    options?: BackupStorageReadOptions
  ): Promise<Buffer>;
  removeFile(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<BackupFileStat | null>;
  list(prefix?: string): Promise<string[]>;

  createReadStream?
    : (relativePath: string, options?: BackupStorageReadOptions) => NodeJS.ReadableStream;
  createWriteStream?
    : (
        relativePath: string,
        options?: BackupStorageWriteOptions
      ) => NodeJS.WritableStream;
}

export interface BackupStorageFactoryOptions {
  provider?: "local" | "memory" | "s3" | string;
  basePath?: string;
  config?: Record<string, unknown>;
}

export interface BackupStorageRegistry {
  register(id: string, provider: BackupStorageProvider): void;
  get(id: string): BackupStorageProvider | undefined;
  getDefault(): BackupStorageProvider;
}

export class DefaultBackupStorageRegistry implements BackupStorageRegistry {
  private providers = new Map<string, BackupStorageProvider>();
  private defaultId: string;

  constructor(defaultProvider: BackupStorageProvider) {
    this.defaultId = defaultProvider.id;
    this.register(defaultProvider.id, defaultProvider);
  }

  register(id: string, provider: BackupStorageProvider): void {
    this.providers.set(id, provider);
  }

  get(id: string): BackupStorageProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): BackupStorageProvider {
    const provider = this.providers.get(this.defaultId);
    if (!provider) {
      throw new Error(`Default backup storage provider "${this.defaultId}" not registered`);
    }
    return provider;
  }
}
