/**
 * Backup Service for Memento
 * Handles system backup and restore operations across all databases
 */
import { DatabaseService, DatabaseConfig } from './DatabaseService.js';
export interface BackupOptions {
    type: 'full' | 'incremental';
    includeData: boolean;
    includeConfig: boolean;
    compression: boolean;
    destination?: string;
}
export interface BackupMetadata {
    id: string;
    type: 'full' | 'incremental';
    timestamp: Date;
    size: number;
    checksum: string;
    components: {
        falkordb: boolean;
        qdrant: boolean;
        postgres: boolean;
        config: boolean;
    };
    status: 'completed' | 'failed' | 'in_progress';
}
export declare class BackupService {
    private dbService;
    private config;
    constructor(dbService: DatabaseService, config: DatabaseConfig);
    createBackup(options: BackupOptions): Promise<BackupMetadata>;
    restoreBackup(backupId: string, options: {
        dryRun?: boolean;
    }): Promise<any>;
    private backupFalkorDB;
    private backupQdrant;
    private backupPostgreSQL;
    private backupConfig;
    private compressBackup;
    private calculateBackupSize;
    private calculateChecksum;
    private storeBackupMetadata;
    private getBackupMetadata;
    private validateBackup;
    private restoreFalkorDB;
    private restoreQdrant;
    private restorePostgreSQL;
    private restoreConfig;
}
//# sourceMappingURL=BackupService.d.ts.map