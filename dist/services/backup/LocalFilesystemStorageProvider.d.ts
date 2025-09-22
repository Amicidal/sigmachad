import * as nodeFs from "fs";
import { BackupStorageProvider, BackupStorageWriteOptions, BackupStorageReadOptions, BackupFileStat } from "./BackupStorageProvider.js";
export interface LocalFilesystemProviderOptions {
    basePath: string;
    allowCreate?: boolean;
}
export declare class LocalFilesystemStorageProvider implements BackupStorageProvider {
    readonly id: string;
    readonly supportsStreaming = true;
    private basePath;
    private allowCreate;
    constructor(options: LocalFilesystemProviderOptions);
    private resolve;
    ensureReady(): Promise<void>;
    writeFile(relativePath: string, data: string | Buffer, _options?: BackupStorageWriteOptions): Promise<void>;
    readFile(relativePath: string, _options?: BackupStorageReadOptions): Promise<Buffer>;
    removeFile(relativePath: string): Promise<void>;
    exists(relativePath: string): Promise<boolean>;
    stat(relativePath: string): Promise<BackupFileStat | null>;
    list(prefix?: string): Promise<string[]>;
    createReadStream(relativePath: string): nodeFs.ReadStream;
    createWriteStream(relativePath: string): nodeFs.WriteStream;
}
//# sourceMappingURL=LocalFilesystemStorageProvider.d.ts.map