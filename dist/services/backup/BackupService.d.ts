/**
 * Backup Service for Memento
 * Handles system backup and restore operations across all databases
 */
import { DatabaseService } from "../core/DatabaseService.js";
import type { DatabaseConfig } from "../database/index.js";
import type { LoggingService } from "../core/LoggingService.js";
import { BackupStorageProvider, BackupStorageRegistry } from "./BackupStorageProvider.js";
export interface BackupOptions {
    type: "full" | "incremental";
    includeData: boolean;
    includeConfig: boolean;
    compression: boolean;
    destination?: string;
    storageProviderId?: string;
    labels?: string[];
}
export interface BackupMetadata {
    id: string;
    type: "full" | "incremental";
    timestamp: Date;
    size: number;
    checksum: string;
    components: {
        falkordb: boolean;
        qdrant: boolean;
        postgres: boolean;
        config: boolean;
    };
    status: "completed" | "failed" | "in_progress";
}
interface RestoreErrorDetails {
    message: string;
    code?: string;
    cause?: unknown;
}
interface BackupIntegrityMetadata {
    missingFiles?: string[];
    checksum?: {
        expected: string;
        actual: string;
    };
    cause?: unknown;
}
interface BackupIntegrityResult {
    passed: boolean;
    isValid?: boolean;
    details: string;
    metadata?: BackupIntegrityMetadata;
}
type RestoreIntegrityCheck = Omit<BackupIntegrityResult, "details" | "metadata"> & {
    details: {
        message: string;
        metadata?: BackupIntegrityMetadata;
    };
};
interface RestoreResult {
    backupId: string;
    status: "in_progress" | "completed" | "failed" | "dry_run_completed";
    success: boolean;
    changes: Array<Record<string, unknown>>;
    estimatedDuration: string;
    integrityCheck?: RestoreIntegrityCheck;
    error?: RestoreErrorDetails;
    token?: string;
    tokenExpiresAt?: Date;
    requiresApproval?: boolean;
}
export interface RestorePreviewToken {
    token: string;
    backupId: string;
    issuedAt: Date;
    expiresAt: Date;
    requestedBy?: string;
    requiresApproval: boolean;
    approvedAt?: Date;
    approvedBy?: string;
    metadata: Record<string, unknown>;
}
export interface RestorePreviewResult {
    backupId: string;
    token: string;
    success: boolean;
    expiresAt: Date;
    changes: Array<Record<string, unknown>>;
    estimatedDuration: string;
    integrityCheck?: RestoreIntegrityCheck;
}
export interface RestoreApprovalPolicy {
    requireSecondApproval: boolean;
    tokenTtlMs: number;
}
export interface BackupServiceOptions {
    storageProvider?: BackupStorageProvider;
    storageRegistry?: BackupStorageRegistry;
    loggingService?: LoggingService;
    restorePolicy?: Partial<RestoreApprovalPolicy>;
}
export interface RestoreOptions {
    dryRun?: boolean;
    destination?: string;
    validateIntegrity?: boolean;
    storageProviderId?: string;
    requestedBy?: string;
    restoreToken?: string;
}
export interface RestoreApprovalRequest {
    token: string;
    approvedBy: string;
    reason?: string;
}
export declare class MaintenanceOperationError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly component?: string;
    readonly stage?: string;
    readonly cause?: unknown;
    constructor(message: string, options: {
        code: string;
        statusCode?: number;
        component?: string;
        stage?: string;
        cause?: unknown;
    });
}
export declare class BackupService {
    private dbService;
    private config;
    private backupDir;
    private storageRegistry;
    private storageProvider;
    private loggingService?;
    private restorePolicy;
    private restoreTokens;
    private retentionPolicy?;
    constructor(dbService: DatabaseService, config: DatabaseConfig, options?: BackupServiceOptions);
    private logInfo;
    private logError;
    createBackup(options: BackupOptions): Promise<BackupMetadata>;
    restoreBackup(backupId: string, options?: RestoreOptions): Promise<RestoreResult>;
    approveRestore(request: RestoreApprovalRequest): RestorePreviewToken;
    private initializeStorageProviders;
    private registerConfiguredProviders;
    private instantiateConfiguredProvider;
    private buildS3Credentials;
    private buildGcsCredentials;
    private getStringOption;
    private getBooleanOption;
    private getNumberOption;
    private ensureServiceReadiness;
    private ensureSpecificServiceReady;
    private enforceRetentionPolicy;
    private deleteBackupArtifacts;
    private exportQdrantCollectionPoints;
    private collectQdrantPointArtifacts;
    private loadQdrantPoints;
    private recreateQdrantCollection;
    private upsertQdrantPoints;
    private isQdrantNotFoundError;
    private prepareStorageContext;
    private buildArtifactPath;
    private writeArtifact;
    private readArtifact;
    private artifactExists;
    private computeBufferChecksum;
    private purgeExpiredRestoreTokens;
    private issueRestoreToken;
    private fetchFalkorCounts;
    private fetchQdrantCollectionNames;
    private fetchPostgresTableNames;
    private validateFalkorBackup;
    private validateQdrantBackup;
    private validatePostgresBackup;
    private validateConfigBackup;
    private backupFalkorDB;
    private backupQdrant;
    private backupPostgreSQL;
    private backupConfig;
    private compressBackup;
    private calculateBackupSize;
    private calculateChecksum;
    private quoteIdentifier;
    private sanitizeRowForBackup;
    private sanitizeValueForBackup;
    private hydrateValueForRestore;
    private mapUdtNameToSqlType;
    private resolveColumnType;
    private generateCreateTableStatement;
    private storeBackupMetadata;
    private getBackupMetadata;
    private getBackupRecord;
    private validateBackup;
    private restoreFalkorDB;
    private restoreQdrant;
    private restorePostgreSQL;
    private restoreConfig;
    verifyBackupIntegrity(backupId: string, options?: {
        destination?: string;
        storageProviderId?: string;
    }): Promise<BackupIntegrityResult>;
    listBackups(options?: {
        destination?: string;
    }): Promise<BackupMetadata[]>;
    private deserializeBackupMetadata;
    private loadLegacyBackupRecord;
    private readLegacyBackupMetadata;
    private readLegacyMetadataFromProvider;
    private listLegacyBackupMetadata;
    private listLegacyMetadataFromProvider;
}
export {};
//# sourceMappingURL=BackupService.d.ts.map