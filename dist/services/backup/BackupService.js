/**
 * Backup Service for Memento
 * Handles system backup and restore operations across all databases
 */
import * as path from "path";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import archiver from "archiver";
import { DefaultBackupStorageRegistry, } from "./BackupStorageProvider.js";
import { LocalFilesystemStorageProvider } from "./LocalFilesystemStorageProvider.js";
import { S3StorageProvider } from "./S3StorageProvider.js";
// import { GCSStorageProvider } from "./GCSStorageProvider.js"; // TODO: Implement GCS provider
import { MaintenanceMetrics } from "../testing-metrics/MaintenanceMetrics.js";
export class MaintenanceOperationError extends Error {
    constructor(message, options) {
        var _a;
        super(message);
        this.name = "MaintenanceOperationError";
        this.code = options.code;
        this.statusCode = (_a = options.statusCode) !== null && _a !== void 0 ? _a : 500;
        this.component = options.component;
        this.stage = options.stage;
        this.cause = options.cause;
    }
}
export class BackupService {
    constructor(dbService, config, options = {}) {
        var _a;
        this.dbService = dbService;
        this.config = config;
        this.backupDir = "./backups";
        this.restoreTokens = new Map();
        this.loggingService = options.loggingService;
        const backupConfig = this.config.backups;
        if ((_a = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.local) === null || _a === void 0 ? void 0 : _a.basePath) {
            this.backupDir = backupConfig.local.basePath;
        }
        const { registry, defaultProvider, retention } = this.initializeStorageProviders(options, backupConfig);
        this.storageRegistry = registry;
        this.storageProvider = defaultProvider;
        this.retentionPolicy = retention;
        this.restorePolicy = {
            requireSecondApproval: false,
            tokenTtlMs: 15 * 60 * 1000,
            ...options.restorePolicy,
        };
    }
    logInfo(component, message, data) {
        var _a;
        (_a = this.loggingService) === null || _a === void 0 ? void 0 : _a.info(component, message, data);
    }
    logError(component, message, data) {
        var _a;
        (_a = this.loggingService) === null || _a === void 0 ? void 0 : _a.error(component, message, data);
    }
    async createBackup(options) {
        var _a, _b, _c, _d;
        const metrics = MaintenanceMetrics.getInstance();
        const startedAt = Date.now();
        const backupId = `backup_${Date.now()}`;
        await this.prepareStorageContext({
            destination: options.destination,
            storageProviderId: options.storageProviderId,
        });
        const storageProviderId = this.storageProvider.id;
        await this.ensureServiceReadiness({
            falkor: options.includeData,
            qdrant: options.includeData,
            postgres: options.includeData,
        });
        const metadata = {
            id: backupId,
            type: options.type,
            timestamp: new Date(),
            size: 0,
            checksum: "",
            components: {
                falkordb: false,
                qdrant: false,
                postgres: false,
                config: false,
            },
            status: "in_progress",
        };
        this.logInfo("backup", "Backup started", {
            backupId,
            type: options.type,
            storageProvider: this.storageProvider.id,
        });
        try {
            if (options.includeData) {
                try {
                    await this.backupFalkorDB(backupId, { silent: false });
                    metadata.components.falkordb = true;
                }
                catch (error) {
                    this.logError("backup", "FalkorDB backup failed", {
                        backupId,
                        error: error instanceof Error ? error.message : error,
                    });
                }
            }
            if (options.includeData) {
                try {
                    await this.backupQdrant(backupId, { silent: false });
                    metadata.components.qdrant = true;
                }
                catch (error) {
                    this.logError("backup", "Qdrant backup failed", {
                        backupId,
                        error: error instanceof Error ? error.message : error,
                    });
                }
            }
            if (options.includeData) {
                try {
                    await this.backupPostgreSQL(backupId);
                    metadata.components.postgres = true;
                }
                catch (error) {
                    this.logError("backup", "PostgreSQL backup failed", {
                        backupId,
                        error: error instanceof Error ? error.message : error,
                    });
                }
            }
            if (options.includeConfig) {
                try {
                    await this.backupConfig(backupId);
                    metadata.components.config = true;
                }
                catch (error) {
                    this.logError("backup", "Configuration backup failed", {
                        backupId,
                        error: error instanceof Error ? error.message : error,
                    });
                    throw error;
                }
            }
            if (options.compression) {
                await this.compressBackup(backupId);
            }
            metadata.size = await this.calculateBackupSize(backupId);
            metadata.checksum = await this.calculateChecksum(backupId);
            metadata.status = "completed";
            await this.storeBackupMetadata(metadata, {
                storageProviderId: this.storageProvider.id,
                destination: (_a = options.destination) !== null && _a !== void 0 ? _a : this.backupDir,
                labels: (_b = options.labels) !== null && _b !== void 0 ? _b : [],
            });
            this.logInfo("backup", "Backup completed", {
                backupId,
                size: metadata.size,
                checksum: metadata.checksum,
            });
            metrics.recordBackup({
                status: "success",
                durationMs: Date.now() - startedAt,
                type: options.type,
                storageProviderId,
                sizeBytes: metadata.size,
            });
            await this.enforceRetentionPolicy();
            return metadata;
        }
        catch (error) {
            metadata.status = "failed";
            await this.storeBackupMetadata(metadata, {
                storageProviderId: this.storageProvider.id,
                destination: (_c = options.destination) !== null && _c !== void 0 ? _c : this.backupDir,
                labels: (_d = options.labels) !== null && _d !== void 0 ? _d : [],
                error: error instanceof Error ? error.message : error,
            });
            metrics.recordBackup({
                status: "failure",
                durationMs: Date.now() - startedAt,
                type: options.type,
                storageProviderId,
            });
            const failure = error instanceof MaintenanceOperationError
                ? error
                : new MaintenanceOperationError(error instanceof Error ? error.message : "Backup failed", {
                    code: "BACKUP_FAILED",
                    component: "backup",
                    stage: "orchestrator",
                    cause: error,
                });
            this.logError("backup", "Backup failed", {
                backupId,
                error: failure.message,
                code: failure.code,
            });
            throw failure;
        }
    }
    async restoreBackup(backupId, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const metrics = MaintenanceMetrics.getInstance();
        const startedAt = Date.now();
        const requestedMode = ((_a = options.dryRun) !== null && _a !== void 0 ? _a : !options.restoreToken) ? "preview" : "apply";
        const record = await this.getBackupRecord(backupId);
        if (!record) {
            metrics.recordRestore({
                mode: requestedMode,
                status: "failure",
                durationMs: Date.now() - startedAt,
                requiresApproval: this.restorePolicy.requireSecondApproval,
                storageProviderId: this.storageProvider.id,
                backupId,
            });
            return {
                backupId,
                status: "failed",
                success: false,
                changes: [],
                estimatedDuration: "0 minutes",
                error: {
                    message: `Backup ${backupId} not found`,
                    code: "NOT_FOUND",
                },
            };
        }
        const storageProviderId = (_c = (_b = options.storageProviderId) !== null && _b !== void 0 ? _b : record.storageProviderId) !== null && _c !== void 0 ? _c : this.storageProvider.id;
        const destination = (_d = options.destination) !== null && _d !== void 0 ? _d : ((_e = record.destination) !== null && _e !== void 0 ? _e : undefined);
        const dryRun = (_f = options.dryRun) !== null && _f !== void 0 ? _f : !options.restoreToken;
        await this.prepareStorageContext({
            destination,
            storageProviderId,
        });
        const requiredComponents = (_g = record.metadata.components) !== null && _g !== void 0 ? _g : {
            falkordb: false,
            qdrant: false,
            postgres: false,
        };
        if (!dryRun) {
            await this.ensureServiceReadiness({
                falkor: Boolean(requiredComponents.falkordb),
                qdrant: Boolean(requiredComponents.qdrant),
                postgres: Boolean(requiredComponents.postgres),
            });
        }
        if (dryRun) {
            try {
                const changes = await this.validateBackup(backupId);
                const hasBlockingIssues = changes.some((item) => ["invalid", "missing"].includes(item.status));
                let integrityCheck;
                if (options.validateIntegrity) {
                    const integrityResult = await this.verifyBackupIntegrity(backupId, {
                        destination,
                        storageProviderId,
                    });
                    integrityCheck = {
                        passed: integrityResult.passed,
                        isValid: integrityResult.isValid,
                        details: {
                            message: integrityResult.details,
                            metadata: integrityResult.metadata,
                        },
                    };
                }
                const canProceed = !hasBlockingIssues &&
                    (integrityCheck ? integrityCheck.passed && integrityCheck.isValid !== false : true);
                const tokenRecord = this.issueRestoreToken({
                    backupId,
                    storageProviderId: this.storageProvider.id,
                    destination,
                    requestedBy: options.requestedBy,
                    requiresApproval: this.restorePolicy.requireSecondApproval,
                    metadata: {
                        canProceed,
                        requestedBy: options.requestedBy,
                        createdAt: new Date().toISOString(),
                    },
                });
                const result = {
                    backupId,
                    status: canProceed ? "dry_run_completed" : "failed",
                    success: canProceed,
                    changes,
                    estimatedDuration: "0 minutes",
                    integrityCheck,
                    token: tokenRecord.token,
                    expiresAt: tokenRecord.expiresAt,
                    tokenExpiresAt: tokenRecord.expiresAt,
                    requiresApproval: tokenRecord.requiresApproval,
                    error: canProceed
                        ? undefined
                        : {
                            message: "Validation detected blocking issues",
                            code: "RESTORE_VALIDATION_FAILED",
                        },
                };
                metrics.recordRestore({
                    mode: "preview",
                    status: result.success ? "success" : "failure",
                    durationMs: Date.now() - startedAt,
                    requiresApproval: Boolean(result.requiresApproval),
                    storageProviderId,
                    backupId,
                });
                return result;
            }
            catch (error) {
                const failureResult = {
                    backupId,
                    status: "failed",
                    success: false,
                    changes: [],
                    estimatedDuration: "0 minutes",
                    error: {
                        message: error instanceof MaintenanceOperationError
                            ? error.message
                            : error instanceof Error
                                ? error.message
                                : "Failed to validate backup metadata",
                        code: "DRY_RUN_VALIDATION_FAILED",
                        cause: error,
                    },
                };
                metrics.recordRestore({
                    mode: "preview",
                    status: "failure",
                    durationMs: Date.now() - startedAt,
                    requiresApproval: this.restorePolicy.requireSecondApproval,
                    storageProviderId,
                    backupId,
                });
                return failureResult;
            }
        }
        const restoreToken = options.restoreToken;
        if (!restoreToken) {
            throw new MaintenanceOperationError("Restore token is required", {
                code: "RESTORE_TOKEN_REQUIRED",
                statusCode: 400,
                component: "restore",
            });
        }
        this.purgeExpiredRestoreTokens();
        const tokenRecord = this.restoreTokens.get(restoreToken);
        if (!tokenRecord || tokenRecord.backupId !== backupId) {
            throw new MaintenanceOperationError("Restore token is invalid or expired", {
                code: "RESTORE_TOKEN_INVALID",
                statusCode: 410,
                component: "restore",
            });
        }
        if (tokenRecord.expiresAt.getTime() <= Date.now()) {
            this.restoreTokens.delete(restoreToken);
            throw new MaintenanceOperationError("Restore token has expired", {
                code: "RESTORE_TOKEN_EXPIRED",
                statusCode: 410,
                component: "restore",
            });
        }
        const canProceed = Boolean(((_h = tokenRecord.metadata) === null || _h === void 0 ? void 0 : _h.canProceed) !== false);
        const isApproved = Boolean(tokenRecord.approvedAt);
        if (!canProceed && !isApproved) {
            throw new MaintenanceOperationError("Restore cannot proceed until blocking issues are resolved", {
                code: "RESTORE_VALIDATION_FAILED",
                statusCode: 409,
                component: "restore",
            });
        }
        if (tokenRecord.requiresApproval && !tokenRecord.approvedAt) {
            throw new MaintenanceOperationError("Restore requires secondary approval before execution", {
                code: "RESTORE_APPROVAL_REQUIRED",
                statusCode: 403,
                component: "restore",
            });
        }
        const restoreResult = {
            backupId,
            status: "in_progress",
            success: false,
            changes: [],
            estimatedDuration: "10-15 minutes",
        };
        if (options.validateIntegrity) {
            const integrityResult = await this.verifyBackupIntegrity(backupId, {
                destination,
                storageProviderId,
            });
            restoreResult.integrityCheck = {
                passed: integrityResult.passed,
                isValid: integrityResult.isValid,
                details: {
                    message: integrityResult.details,
                    metadata: integrityResult.metadata,
                },
            };
            if (!integrityResult.isValid) {
                throw new MaintenanceOperationError("Backup integrity check failed", {
                    code: "RESTORE_INTEGRITY_FAILED",
                    statusCode: 412,
                    component: "restore",
                });
            }
        }
        try {
            const metadata = record.metadata;
            if (metadata.components.falkordb) {
                await this.restoreFalkorDB(backupId);
                restoreResult.changes.push({
                    component: "falkordb",
                    action: "restored",
                    status: "completed",
                    details: "FalkorDB restored successfully",
                });
            }
            if (metadata.components.qdrant) {
                await this.restoreQdrant(backupId);
                restoreResult.changes.push({
                    component: "qdrant",
                    action: "restored",
                    status: "completed",
                    details: "Qdrant restored successfully",
                });
            }
            if (metadata.components.postgres) {
                await this.restorePostgreSQL(backupId);
                restoreResult.changes.push({
                    component: "postgres",
                    action: "restored",
                    status: "completed",
                    details: "PostgreSQL restored successfully",
                });
            }
            if (metadata.components.config) {
                await this.restoreConfig(backupId);
                restoreResult.changes.push({
                    component: "config",
                    action: "restored",
                    status: "completed",
                    details: "Configuration restored successfully",
                });
            }
            restoreResult.status = "completed";
            restoreResult.success = true;
            this.restoreTokens.delete(restoreToken);
            restoreResult.requiresApproval = tokenRecord.requiresApproval;
            metrics.recordRestore({
                mode: "apply",
                status: "success",
                durationMs: Date.now() - startedAt,
                requiresApproval: Boolean(tokenRecord.requiresApproval),
                storageProviderId,
                backupId,
            });
            return restoreResult;
        }
        catch (error) {
            this.logError("restore", "Restore execution failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            metrics.recordRestore({
                mode: dryRun ? "preview" : "apply",
                status: "failure",
                durationMs: Date.now() - startedAt,
                requiresApproval: dryRun
                    ? this.restorePolicy.requireSecondApproval
                    : Boolean((_j = tokenRecord === null || tokenRecord === void 0 ? void 0 : tokenRecord.requiresApproval) !== null && _j !== void 0 ? _j : this.restorePolicy.requireSecondApproval),
                storageProviderId,
                backupId,
            });
            throw (error instanceof MaintenanceOperationError
                ? error
                : new MaintenanceOperationError(error instanceof Error ? error.message : "Restore failed", {
                    code: "RESTORE_FAILED",
                    component: "restore",
                    stage: "apply",
                    cause: error,
                }));
        }
    }
    approveRestore(request) {
        const metrics = MaintenanceMetrics.getInstance();
        this.purgeExpiredRestoreTokens();
        const tokenRecord = this.restoreTokens.get(request.token);
        if (!tokenRecord) {
            throw new MaintenanceOperationError("Restore token not found", {
                code: "RESTORE_TOKEN_INVALID",
                statusCode: 404,
                component: "restore",
            });
        }
        tokenRecord.approvedAt = new Date();
        tokenRecord.approvedBy = request.approvedBy;
        tokenRecord.metadata = {
            ...tokenRecord.metadata,
            approvalReason: request.reason,
        };
        this.restoreTokens.set(request.token, tokenRecord);
        metrics.recordRestoreApproval({ status: "approved" });
        return tokenRecord;
    }
    initializeStorageProviders(options, backupConfig) {
        var _a, _b, _c, _d, _e, _f;
        const localBasePath = (_b = (_a = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.local) === null || _a === void 0 ? void 0 : _a.basePath) !== null && _b !== void 0 ? _b : this.backupDir;
        const allowCreate = (_d = (_c = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.local) === null || _c === void 0 ? void 0 : _c.allowCreate) !== null && _d !== void 0 ? _d : true;
        let registry = options.storageRegistry;
        let defaultProvider = (_e = options.storageProvider) !== null && _e !== void 0 ? _e : null;
        if (!registry) {
            const provider = (_f = options.storageProvider) !== null && _f !== void 0 ? _f : new LocalFilesystemStorageProvider({
                basePath: localBasePath,
                allowCreate,
            });
            registry = new DefaultBackupStorageRegistry(provider);
            defaultProvider = provider;
        }
        else if (!defaultProvider) {
            defaultProvider = new LocalFilesystemStorageProvider({
                basePath: localBasePath,
                allowCreate,
            });
            registry.register(defaultProvider.id, defaultProvider);
        }
        else {
            registry.register(defaultProvider.id, defaultProvider);
        }
        this.registerConfiguredProviders(registry, backupConfig);
        if (backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.defaultProvider) {
            const configuredDefault = registry.get(backupConfig.defaultProvider);
            if (configuredDefault) {
                defaultProvider = configuredDefault;
            }
            else {
                this.logError("backup", "Configured default storage provider not found", {
                    providerId: backupConfig.defaultProvider,
                });
            }
        }
        return {
            registry,
            defaultProvider: defaultProvider !== null && defaultProvider !== void 0 ? defaultProvider : registry.getDefault(),
            retention: backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.retention,
        };
    }
    registerConfiguredProviders(registry, backupConfig) {
        const configuredProviders = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.providers;
        if (!configuredProviders) {
            return;
        }
        for (const [providerId, definition] of Object.entries(configuredProviders)) {
            try {
                const provider = this.instantiateConfiguredProvider(providerId, definition, backupConfig);
                registry.register(providerId, provider);
            }
            catch (error) {
                this.logError("backup", "Failed to register backup storage provider", {
                    providerId,
                    error: error instanceof Error ? error.message : error,
                });
            }
        }
    }
    instantiateConfiguredProvider(providerId, definition, backupConfig) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const type = ((_a = definition.type) !== null && _a !== void 0 ? _a : "local").toLowerCase();
        const options = ((_b = definition.options) !== null && _b !== void 0 ? _b : {});
        switch (type) {
            case "local": {
                const basePath = (_e = (_c = this.getStringOption(options, "basePath")) !== null && _c !== void 0 ? _c : (_d = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.local) === null || _d === void 0 ? void 0 : _d.basePath) !== null && _e !== void 0 ? _e : this.backupDir;
                const allowCreate = this.getBooleanOption(options, "allowCreate");
                return new LocalFilesystemStorageProvider({
                    basePath,
                    allowCreate: (_g = allowCreate !== null && allowCreate !== void 0 ? allowCreate : (_f = backupConfig === null || backupConfig === void 0 ? void 0 : backupConfig.local) === null || _f === void 0 ? void 0 : _f.allowCreate) !== null && _g !== void 0 ? _g : true,
                });
            }
            case "s3": {
                const bucket = this.getStringOption(options, "bucket");
                if (!bucket) {
                    throw new Error(`S3 storage provider "${providerId}" requires a bucket name`);
                }
                const credentials = this.buildS3Credentials(options);
                return new S3StorageProvider({
                    id: providerId,
                    bucket,
                    region: this.getStringOption(options, "region"),
                    prefix: this.getStringOption(options, "prefix"),
                    endpoint: this.getStringOption(options, "endpoint"),
                    forcePathStyle: (_h = this.getBooleanOption(options, "forcePathStyle")) !== null && _h !== void 0 ? _h : undefined,
                    autoCreate: (_j = this.getBooleanOption(options, "autoCreate")) !== null && _j !== void 0 ? _j : undefined,
                    kmsKeyId: this.getStringOption(options, "kmsKeyId"),
                    serverSideEncryption: this.getStringOption(options, "serverSideEncryption"),
                    uploadConcurrency: (_k = this.getNumberOption(options, "uploadConcurrency")) !== null && _k !== void 0 ? _k : undefined,
                    uploadPartSizeBytes: (_l = this.getNumberOption(options, "uploadPartSizeBytes")) !== null && _l !== void 0 ? _l : undefined,
                    credentials,
                });
            }
            case "gcs": {
                const bucket = this.getStringOption(options, "bucket");
                if (!bucket) {
                    throw new Error(`GCS storage provider "${providerId}" requires a bucket name`);
                }
                const credentials = this.buildGcsCredentials(options);
                // TODO: Implement GCS provider - using S3 provider as fallback for now
                return new S3StorageProvider({
                    id: providerId,
                    bucket,
                    prefix: this.getStringOption(options, "prefix"),
                    region: this.getStringOption(options, "region"),
                    endpoint: this.getStringOption(options, "endpoint"),
                    autoCreate: (_m = this.getBooleanOption(options, "autoCreate")) !== null && _m !== void 0 ? _m : undefined,
                    credentials: {
                        accessKeyId: this.getStringOption(options, "accessKeyId") || "",
                        secretAccessKey: this.getStringOption(options, "secretAccessKey") || "",
                        sessionToken: this.getStringOption(options, "sessionToken"),
                    },
                });
            }
            default:
                throw new Error(`Unsupported backup storage provider type: ${definition.type}`);
        }
    }
    buildS3Credentials(options) {
        const accessKeyId = this.getStringOption(options, "accessKeyId");
        const secretAccessKey = this.getStringOption(options, "secretAccessKey");
        const sessionToken = this.getStringOption(options, "sessionToken");
        const nested = options.credentials;
        if (!accessKeyId && typeof nested === "object" && nested) {
            const nestedCreds = nested;
            return this.buildS3Credentials(nestedCreds);
        }
        if (accessKeyId && secretAccessKey) {
            return {
                accessKeyId,
                secretAccessKey,
                sessionToken,
            };
        }
        return undefined;
    }
    buildGcsCredentials(options) {
        const clientEmail = this.getStringOption(options, "clientEmail");
        const privateKey = this.getStringOption(options, "privateKey");
        const nested = options.credentials;
        if (!clientEmail && typeof nested === "object" && nested) {
            const nestedCreds = nested;
            return this.buildGcsCredentials(nestedCreds);
        }
        if (clientEmail && privateKey) {
            return {
                clientEmail,
                privateKey,
            };
        }
        return undefined;
    }
    getStringOption(source, key) {
        const value = source[key];
        return typeof value === "string" && value.length > 0 ? value : undefined;
    }
    getBooleanOption(source, key) {
        const value = source[key];
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "string") {
            if (value.toLowerCase() === "true")
                return true;
            if (value.toLowerCase() === "false")
                return false;
        }
        return undefined;
    }
    getNumberOption(source, key) {
        const value = source[key];
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    }
    async ensureServiceReadiness(requirements) {
        if (!this.dbService ||
            typeof this.dbService.isInitialized !== "function" ||
            !this.dbService.isInitialized()) {
            throw new MaintenanceOperationError("Database service unavailable", {
                code: "DEPENDENCY_UNAVAILABLE",
                statusCode: 503,
                component: "database",
            });
        }
        const checks = [];
        if (requirements.falkor) {
            checks.push(this.ensureSpecificServiceReady(() => this.dbService.getFalkorDBService(), "falkordb"));
        }
        if (requirements.qdrant) {
            checks.push(this.ensureSpecificServiceReady(() => this.dbService.getQdrantService(), "qdrant"));
        }
        if (requirements.postgres) {
            checks.push(this.ensureSpecificServiceReady(() => this.dbService.getPostgreSQLService(), "postgres"));
        }
        await Promise.all(checks);
    }
    async ensureSpecificServiceReady(getService, component) {
        try {
            const service = getService();
            if (service && typeof service.healthCheck === "function") {
                const healthy = await service.healthCheck();
                if (!healthy) {
                    throw new Error(`${component} health check reported unavailable`);
                }
            }
        }
        catch (error) {
            throw new MaintenanceOperationError(`${component} service unavailable`, {
                code: "DEPENDENCY_UNAVAILABLE",
                statusCode: 503,
                component,
                cause: error,
            });
        }
    }
    async enforceRetentionPolicy() {
        const policy = this.retentionPolicy;
        if (!policy) {
            return;
        }
        try {
            const pg = this.dbService.getPostgreSQLService();
            const result = await pg.query(`SELECT id, recorded_at, size_bytes, storage_provider
         FROM maintenance_backups
         ORDER BY recorded_at DESC`);
            const rows = Array.isArray(result.rows) ? result.rows : [];
            if (rows.length === 0) {
                return;
            }
            const idsToDelete = new Set();
            const now = Date.now();
            if (policy.maxAgeDays && policy.maxAgeDays > 0) {
                const cutoff = now - policy.maxAgeDays * 24 * 60 * 60 * 1000;
                for (const row of rows) {
                    const recordedAt = new Date(row.recorded_at).getTime();
                    if (!Number.isNaN(recordedAt) && recordedAt < cutoff) {
                        idsToDelete.add(row.id);
                    }
                }
            }
            if (policy.maxEntries && policy.maxEntries > 0) {
                const eligible = rows.filter((row) => !idsToDelete.has(row.id));
                for (let index = policy.maxEntries; index < eligible.length; index += 1) {
                    idsToDelete.add(eligible[index].id);
                }
            }
            if (policy.maxTotalSizeBytes && policy.maxTotalSizeBytes > 0) {
                let runningSize = 0;
                const eligible = rows.filter((row) => !idsToDelete.has(row.id));
                for (const row of eligible) {
                    const size = Number(row.size_bytes) || 0;
                    if (runningSize + size <= policy.maxTotalSizeBytes) {
                        runningSize += size;
                    }
                    else {
                        idsToDelete.add(row.id);
                    }
                }
            }
            if (idsToDelete.size === 0) {
                return;
            }
            if (policy.deleteArtifacts !== false) {
                for (const row of rows) {
                    if (!idsToDelete.has(row.id)) {
                        continue;
                    }
                    await this.deleteBackupArtifacts(row.id, row.storage_provider);
                }
            }
            await pg.query(`DELETE FROM maintenance_backups WHERE id = ANY($1::text[])`, [Array.from(idsToDelete)]);
            this.logInfo("backup", "Retention pruning completed", {
                removedBackups: idsToDelete.size,
            });
        }
        catch (error) {
            this.logError("backup", "Retention enforcement failed", {
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async deleteBackupArtifacts(backupId, providerId) {
        try {
            let provider = this.storageRegistry.get(providerId);
            if (!provider && this.storageProvider.id === providerId) {
                provider = this.storageProvider;
            }
            if (!provider) {
                this.logError("backup", "Retention pruning skipped unknown provider", {
                    backupId,
                    providerId,
                });
                return;
            }
            await provider.ensureReady();
            const artifacts = await provider.list();
            for (const artifact of artifacts) {
                if (artifact.startsWith(backupId)) {
                    try {
                        await provider.removeFile(artifact);
                    }
                    catch (error) {
                        this.logError("backup", "Failed to delete backup artifact", {
                            backupId,
                            providerId,
                            artifact,
                            error: error instanceof Error ? error.message : error,
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logError("backup", "Retention artifact cleanup failed", {
                backupId,
                providerId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async exportQdrantCollectionPoints(client, collectionName) {
        var _a;
        const points = [];
        let nextOffset = undefined;
        const batchSize = 256;
        do {
            const response = await client.scroll(collectionName, {
                limit: batchSize,
                offset: nextOffset,
                with_payload: true,
                with_vector: true,
            });
            const batch = Array.isArray(response === null || response === void 0 ? void 0 : response.points) ? response.points : [];
            if (batch.length > 0) {
                points.push(...batch.map((point) => {
                    const entry = {
                        id: point.id,
                    };
                    if (point.payload !== undefined) {
                        entry.payload = point.payload;
                    }
                    if (point.vector !== undefined) {
                        entry.vector = point.vector;
                    }
                    if (point.vectors !== undefined) {
                        entry.vectors = point.vectors;
                    }
                    return entry;
                }));
            }
            nextOffset = (_a = response === null || response === void 0 ? void 0 : response.next_page_offset) !== null && _a !== void 0 ? _a : undefined;
        } while (nextOffset);
        return points;
    }
    async collectQdrantPointArtifacts(backupId) {
        const manifestArtifact = `${backupId}_qdrant_collections.json`;
        const exists = await this.artifactExists(backupId, manifestArtifact);
        if (!exists) {
            return [];
        }
        const manifest = JSON.parse((await this.readArtifact(backupId, manifestArtifact)).toString("utf-8"));
        const collectionEntries = Array.isArray(manifest === null || manifest === void 0 ? void 0 : manifest.collections)
            ? manifest.collections
            : [];
        return collectionEntries
            .map((entry) => entry === null || entry === void 0 ? void 0 : entry.pointsArtifact)
            .filter((artifact) => typeof artifact === "string");
    }
    async loadQdrantPoints(backupId, entry) {
        if (Array.isArray(entry.points) && entry.points.length > 0) {
            return entry.points;
        }
        if (!entry.pointsArtifact) {
            return [];
        }
        const exists = await this.artifactExists(backupId, entry.pointsArtifact);
        if (!exists) {
            return [];
        }
        const raw = JSON.parse((await this.readArtifact(backupId, entry.pointsArtifact)).toString("utf-8"));
        if (Array.isArray(raw)) {
            return raw;
        }
        if (Array.isArray(raw === null || raw === void 0 ? void 0 : raw.points)) {
            return raw.points;
        }
        return [];
    }
    async recreateQdrantCollection(client, entry) {
        var _a, _b, _c, _d;
        const name = entry.name;
        const config = (_a = entry.info) === null || _a === void 0 ? void 0 : _a.config;
        if (!((_b = config === null || config === void 0 ? void 0 : config.params) === null || _b === void 0 ? void 0 : _b.vectors)) {
            throw new Error(`Missing collection configuration for ${name}`);
        }
        try {
            await client.deleteCollection(name);
        }
        catch (error) {
            if (!this.isQdrantNotFoundError(error)) {
                throw error;
            }
        }
        const createPayload = {
            ...config.params,
        };
        if (config.hnsw_config) {
            createPayload.hnsw_config = config.hnsw_config;
        }
        if (config.optimizer_config) {
            createPayload.optimizer_config = config.optimizer_config;
        }
        if (config.wal_config) {
            createPayload.wal_config = config.wal_config;
        }
        if (config.quantization_config) {
            createPayload.quantization_config = config.quantization_config;
        }
        if (config.strict_mode_config) {
            createPayload.strict_mode_config = config.strict_mode_config;
        }
        await client.createCollection(name, createPayload);
        const payloadSchema = (_d = (_c = entry.info) === null || _c === void 0 ? void 0 : _c.payload_schema) !== null && _d !== void 0 ? _d : {};
        for (const [fieldName, fieldSchema] of Object.entries(payloadSchema)) {
            if (!fieldSchema)
                continue;
            try {
                await client.createPayloadIndex(name, {
                    field_name: fieldName,
                    field_schema: fieldSchema,
                    wait: true,
                });
            }
            catch (error) {
                this.logError("restore", "Failed to recreate Qdrant payload index", {
                    collection: name,
                    field: fieldName,
                    error: error instanceof Error ? error.message : error,
                });
            }
        }
    }
    async upsertQdrantPoints(client, collectionName, points) {
        if (!points.length) {
            return;
        }
        const chunkSize = 200;
        for (let index = 0; index < points.length; index += chunkSize) {
            const chunk = points.slice(index, index + chunkSize);
            await client.upsert(collectionName, {
                points: chunk,
                wait: true,
            });
        }
    }
    isQdrantNotFoundError(error) {
        var _a, _b;
        const status = (_a = error === null || error === void 0 ? void 0 : error.status) !== null && _a !== void 0 ? _a : (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status;
        if (status === 404) {
            return true;
        }
        const code = error === null || error === void 0 ? void 0 : error.code;
        if (code === 404) {
            return true;
        }
        const message = error === null || error === void 0 ? void 0 : error.message;
        if (typeof message === "string") {
            return message.toLowerCase().includes("not found");
        }
        return false;
    }
    async prepareStorageContext(options = {}) {
        if (options.storageProviderId) {
            const provider = this.storageRegistry.get(options.storageProviderId);
            if (!provider) {
                throw new MaintenanceOperationError(`Unknown storage provider: ${options.storageProviderId}`, {
                    code: "STORAGE_PROVIDER_UNKNOWN",
                    statusCode: 400,
                });
            }
            this.storageProvider = provider;
        }
        else if (options.destination) {
            this.backupDir = options.destination;
            const localProvider = new LocalFilesystemStorageProvider({
                basePath: this.backupDir,
            });
            this.storageProvider = localProvider;
            this.storageRegistry.register(localProvider.id, localProvider);
        }
        else {
            this.storageProvider = this.storageRegistry.getDefault();
        }
        await this.storageProvider.ensureReady();
    }
    buildArtifactPath(backupId, fileName) {
        if (fileName.startsWith(backupId)) {
            return fileName.replace(/\\/g, "/");
        }
        return path.posix.join(backupId, fileName);
    }
    async writeArtifact(backupId, fileName, data) {
        await this.storageProvider.writeFile(this.buildArtifactPath(backupId, fileName), data);
    }
    async readArtifact(backupId, fileName) {
        return this.storageProvider.readFile(this.buildArtifactPath(backupId, fileName));
    }
    async artifactExists(backupId, fileName) {
        return this.storageProvider.exists(this.buildArtifactPath(backupId, fileName));
    }
    computeBufferChecksum(buffer) {
        return crypto.createHash("sha256").update(buffer).digest("hex");
    }
    purgeExpiredRestoreTokens() {
        const now = Date.now();
        for (const [token, record] of this.restoreTokens.entries()) {
            if (record.expiresAt.getTime() <= now) {
                this.restoreTokens.delete(token);
            }
        }
    }
    issueRestoreToken(params) {
        this.purgeExpiredRestoreTokens();
        const token = crypto.randomUUID();
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + this.restorePolicy.tokenTtlMs);
        const record = {
            token,
            backupId: params.backupId,
            issuedAt,
            expiresAt,
            requestedBy: params.requestedBy,
            requiresApproval: params.requiresApproval,
            metadata: {
                ...params.metadata,
                storageProviderId: params.storageProviderId,
                destination: params.destination,
            },
        };
        this.restoreTokens.set(token, record);
        return record;
    }
    async fetchFalkorCounts() {
        try {
            const falkorService = this.dbService.getFalkorDBService();
            const nodesResult = await falkorService.query("MATCH (n) RETURN count(n) AS count");
            const relationshipsResult = await falkorService.query("MATCH ()-[r]->() RETURN count(r) AS count");
            const extractCount = (result) => {
                var _a;
                if (!result)
                    return 0;
                if (Array.isArray(result)) {
                    const first = result[0];
                    if (!first)
                        return 0;
                    if (typeof first.count === "number")
                        return first.count;
                    if (Array.isArray(first))
                        return Number(first[0]) || 0;
                }
                if ((result === null || result === void 0 ? void 0 : result.data) && Array.isArray(result.data)) {
                    const first = result.data[0];
                    if (first && typeof first.count === "number")
                        return first.count;
                }
                return Number((_a = result === null || result === void 0 ? void 0 : result.count) !== null && _a !== void 0 ? _a : 0) || 0;
            };
            return {
                nodes: extractCount(nodesResult),
                relationships: extractCount(relationshipsResult),
            };
        }
        catch (_a) {
            return null;
        }
    }
    async fetchQdrantCollectionNames() {
        try {
            const qdrantClient = this.dbService.getQdrantService().getClient();
            const collections = await qdrantClient.getCollections();
            if (!(collections === null || collections === void 0 ? void 0 : collections.collections)) {
                return [];
            }
            return collections.collections.map((item) => item.name).filter(Boolean);
        }
        catch (_a) {
            return null;
        }
    }
    async fetchPostgresTableNames() {
        try {
            const postgresService = this.dbService.getPostgreSQLService();
            const result = await postgresService.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
            const rows = result.rows || result;
            if (!rows)
                return [];
            return rows.map((row) => row.tablename || row.table_name).filter(Boolean);
        }
        catch (_a) {
            return null;
        }
    }
    async validateFalkorBackup(backupId) {
        const artifact = `${backupId}_falkordb.dump`;
        const exists = await this.artifactExists(backupId, artifact);
        if (!exists) {
            return {
                component: "falkordb",
                action: "validate",
                status: "missing",
                details: "Graph snapshot artifact not found",
            };
        }
        try {
            const buffer = await this.readArtifact(backupId, artifact);
            const parsed = JSON.parse(buffer.toString("utf-8"));
            const nodes = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.nodes) ? parsed.nodes.length : 0;
            const relationships = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.relationships)
                ? parsed.relationships.length
                : 0;
            const liveCounts = await this.fetchFalkorCounts();
            const checksum = this.computeBufferChecksum(buffer);
            const status = nodes === 0 || relationships === 0 ? "warning" : "valid";
            return {
                component: "falkordb",
                action: "validate",
                status,
                details: status === "valid"
                    ? "Graph snapshot parsed successfully"
                    : "Graph snapshot parsed but contains no nodes or relationships",
                metadata: {
                    nodes,
                    relationships,
                    checksum,
                    liveNodes: liveCounts === null || liveCounts === void 0 ? void 0 : liveCounts.nodes,
                    liveRelationships: liveCounts === null || liveCounts === void 0 ? void 0 : liveCounts.relationships,
                },
            };
        }
        catch (error) {
            return {
                component: "falkordb",
                action: "validate",
                status: "invalid",
                details: "Failed to parse Falkor snapshot",
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async validateQdrantBackup(backupId) {
        const metadataArtifact = `${backupId}_qdrant_collections.json`;
        const exists = await this.artifactExists(backupId, metadataArtifact);
        if (!exists) {
            return {
                component: "qdrant",
                action: "validate",
                status: "missing",
                details: "Qdrant collections manifest not found",
            };
        }
        try {
            const manifest = JSON.parse((await this.readArtifact(backupId, metadataArtifact)).toString("utf-8"));
            const collectionEntries = Array.isArray(manifest === null || manifest === void 0 ? void 0 : manifest.collections)
                ? manifest.collections.filter((item) => typeof (item === null || item === void 0 ? void 0 : item.name) === "string")
                : [];
            const missingArtifacts = [];
            for (const entry of collectionEntries) {
                const artifact = entry === null || entry === void 0 ? void 0 : entry.pointsArtifact;
                if (typeof artifact !== "string") {
                    missingArtifacts.push(entry.name);
                    continue;
                }
                // eslint-disable-next-line no-await-in-loop
                const hasArtifact = await this.artifactExists(backupId, artifact);
                if (!hasArtifact) {
                    missingArtifacts.push(entry.name);
                }
            }
            const liveCollections = await this.fetchQdrantCollectionNames();
            const status = missingArtifacts.length > 0 ? "warning" : "valid";
            return {
                component: "qdrant",
                action: "validate",
                status,
                details: status === "valid"
                    ? "Qdrant collection data captured"
                    : `${missingArtifacts.length} collection backups missing point data artifacts`,
                metadata: {
                    collections: collectionEntries.map((entry) => ({
                        name: entry.name,
                        pointsArtifact: entry.pointsArtifact,
                        pointCount: entry.pointCount,
                        error: entry.error,
                    })),
                    liveCollections,
                    missingArtifacts,
                },
            };
        }
        catch (error) {
            return {
                component: "qdrant",
                action: "validate",
                status: "invalid",
                details: "Failed to parse Qdrant collections manifest",
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async validatePostgresBackup(backupId) {
        const jsonArtifact = `${backupId}_postgres.json`;
        const sqlArtifact = `${backupId}_postgres.sql`;
        const jsonExists = await this.artifactExists(backupId, jsonArtifact);
        const sqlExists = await this.artifactExists(backupId, sqlArtifact);
        if (!jsonExists && !sqlExists) {
            return {
                component: "postgres",
                action: "validate",
                status: "missing",
                details: "PostgreSQL artifacts not found",
            };
        }
        if (jsonExists) {
            try {
                const artifact = (await this.readArtifact(backupId, jsonArtifact)).toString("utf-8");
                const payload = JSON.parse(artifact);
                const liveTables = await this.fetchPostgresTableNames();
                return {
                    component: "postgres",
                    action: "validate",
                    status: payload.tables.length === 0 ? "warning" : "valid",
                    details: payload.tables.length > 0
                        ? "Structured PostgreSQL backup artifact parsed successfully"
                        : "Structured artifact parsed but contains no tables",
                    metadata: {
                        tables: payload.tables.map((table) => ({
                            name: table.name,
                            rowCount: table.rows.length,
                        })),
                        liveTables,
                        checksum: this.computeBufferChecksum(Buffer.from(artifact)),
                    },
                };
            }
            catch (error) {
                return {
                    component: "postgres",
                    action: "validate",
                    status: "invalid",
                    details: "Failed to parse structured PostgreSQL artifact",
                    metadata: {
                        error: error instanceof Error ? error.message : String(error),
                    },
                };
            }
        }
        try {
            const dump = (await this.readArtifact(backupId, sqlArtifact)).toString("utf-8");
            const tableMatches = dump.match(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_"\.]+)/g);
            const backupTables = tableMatches ? tableMatches.length : 0;
            const liveTables = await this.fetchPostgresTableNames();
            const status = backupTables === 0 ? "warning" : "valid";
            return {
                component: "postgres",
                action: "validate",
                status,
                details: status === "valid"
                    ? "Legacy PostgreSQL dump contains table definitions"
                    : "Legacy PostgreSQL dump parsed but no table definitions found",
                metadata: {
                    backupTables,
                    liveTables,
                    checksum: this.computeBufferChecksum(Buffer.from(dump)),
                },
            };
        }
        catch (error) {
            return {
                component: "postgres",
                action: "validate",
                status: "invalid",
                details: "Failed to parse PostgreSQL dump",
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async validateConfigBackup(backupId) {
        const artifact = `${backupId}_config.json`;
        const exists = await this.artifactExists(backupId, artifact);
        if (!exists) {
            return {
                component: "config",
                action: "validate",
                status: "missing",
                details: "Configuration snapshot not found",
            };
        }
        try {
            const parsed = JSON.parse((await this.readArtifact(backupId, artifact)).toString("utf-8"));
            const keys = Object.keys(parsed !== null && parsed !== void 0 ? parsed : {});
            const status = keys.length === 0 ? "warning" : "valid";
            return {
                component: "config",
                action: "validate",
                status,
                details: status === "valid"
                    ? "Configuration snapshot parsed successfully"
                    : "Configuration snapshot parsed but contains no entries",
                metadata: {
                    keys,
                },
            };
        }
        catch (error) {
            return {
                component: "config",
                action: "validate",
                status: "invalid",
                details: "Failed to parse configuration snapshot",
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async backupFalkorDB(backupId, options = {}) {
        const { silent = true } = options;
        const artifactName = `${backupId}_falkordb.dump`;
        try {
            const falkorService = this.dbService.getFalkorDBService();
            const nodesResult = await falkorService.query(`
        MATCH (n)
        RETURN labels(n) as labels, properties(n) as props, ID(n) as id
      `);
            const relsResult = await falkorService.query(`
        MATCH (a)-[r]->(b)
        RETURN ID(a) as startId, ID(b) as endId, type(r) as type, properties(r) as props
      `);
            const backupData = {
                timestamp: new Date().toISOString(),
                nodes: nodesResult,
                relationships: relsResult,
                metadata: {
                    nodeCount: nodesResult.length,
                    relationshipCount: relsResult.length,
                },
            };
            await this.writeArtifact(backupId, artifactName, JSON.stringify(backupData, null, 2));
            this.logInfo("backup", "FalkorDB backup created", {
                backupId,
                artifact: artifactName,
            });
        }
        catch (error) {
            this.logError("backup", "FalkorDB backup failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            if (!silent) {
                throw new MaintenanceOperationError(error instanceof Error ? error.message : "FalkorDB backup failed", {
                    code: "BACKUP_FALKORDB_FAILED",
                    component: "falkordb",
                    stage: "backup",
                    cause: error,
                });
            }
        }
    }
    async backupQdrant(backupId, options = {}) {
        const { silent = true } = options;
        try {
            const qdrantClient = this.dbService.getQdrantService().getClient();
            const collectionsResponse = await qdrantClient.getCollections();
            const collections = Array.isArray(collectionsResponse === null || collectionsResponse === void 0 ? void 0 : collectionsResponse.collections)
                ? collectionsResponse.collections
                : [];
            const manifest = {
                timestamp: new Date().toISOString(),
                collections: [],
            };
            for (const collection of collections) {
                const name = collection === null || collection === void 0 ? void 0 : collection.name;
                if (typeof name !== "string" || name.length === 0) {
                    continue;
                }
                const entry = { name };
                try {
                    const info = await qdrantClient.getCollection(name);
                    entry.info = info ? JSON.parse(JSON.stringify(info)) : undefined;
                    const points = await this.exportQdrantCollectionPoints(qdrantClient, name);
                    entry.pointCount = points.length;
                    const pointsArtifact = path.posix.join("qdrant", `${name}_points.json`);
                    entry.pointsArtifact = pointsArtifact;
                    await this.writeArtifact(backupId, pointsArtifact, JSON.stringify({ points }, null, 2));
                }
                catch (error) {
                    entry.error = error instanceof Error ? error.message : String(error);
                    this.logError("backup", "Qdrant collection backup failed", {
                        backupId,
                        collection: name,
                        error: entry.error,
                    });
                    if (!silent) {
                        throw error;
                    }
                }
                manifest.collections.push(entry);
            }
            const manifestArtifact = `${backupId}_qdrant_collections.json`;
            await this.writeArtifact(backupId, manifestArtifact, JSON.stringify(manifest, null, 2));
            this.logInfo("backup", "Qdrant backup completed", {
                backupId,
                collections: manifest.collections.length,
            });
        }
        catch (error) {
            this.logError("backup", "Qdrant backup failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            if (!silent) {
                throw new MaintenanceOperationError(error instanceof Error ? error.message : "Qdrant backup failed", {
                    code: "BACKUP_QDRANT_FAILED",
                    component: "qdrant",
                    stage: "backup",
                    cause: error,
                });
            }
        }
    }
    async backupPostgreSQL(backupId) {
        try {
            const sqlArtifactName = `${backupId}_postgres.sql`;
            const jsonArtifactName = `${backupId}_postgres.json`;
            const postgresService = this.dbService.getPostgreSQLService();
            const tablesQuery = `
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;
            const tablesResult = await postgresService.query(tablesQuery);
            const tables = tablesResult.rows || tablesResult;
            this.logInfo("backup", "PostgreSQL tables enumerated", {
                backupId,
                tableCount: tables.length,
            });
            const tableDumps = [];
            let schemaContent = `-- PostgreSQL schema snapshot created by Memento Backup Service\n`;
            schemaContent += `-- Created: ${new Date().toISOString()}\n\n`;
            for (const table of tables) {
                const tableName = table.tablename;
                const schemaQuery = `
          SELECT
            column_name,
            data_type,
            udt_name,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
                const columnsResult = await postgresService.query(schemaQuery, [
                    tableName,
                ]);
                const columns = columnsResult.rows || columnsResult;
                const primaryKeyQuery = `
          SELECT
            a.attname AS column_name
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid
            AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary = true;
        `;
                const primaryKeyResult = await postgresService.query(primaryKeyQuery, [
                    tableName,
                ]);
                const primaryKeys = (primaryKeyResult.rows || primaryKeyResult).map((row) => row.column_name);
                const columnDefinitions = columns.map((col) => ({
                    name: col.column_name,
                    dataType: col.data_type,
                    udtName: col.udt_name,
                    isNullable: col.is_nullable !== "NO",
                    columnDefault: col.column_default,
                    characterMaximumLength: col.character_maximum_length,
                    numericPrecision: col.numeric_precision,
                    numericScale: col.numeric_scale,
                }));
                const createStatement = this.generateCreateTableStatement(tableName, columnDefinitions, primaryKeys);
                schemaContent += `-- Schema for table: ${tableName}\n`;
                schemaContent += `${createStatement}\n\n`;
                schemaContent += `-- Data for table: ${tableName} captured in ${jsonArtifactName}\n\n`;
                const dataQuery = `SELECT * FROM ${this.quoteIdentifier(tableName)};`;
                const dataResult = await postgresService.query(dataQuery);
                const data = dataResult.rows || dataResult;
                const sanitizedRows = data.map((row) => this.sanitizeRowForBackup(row));
                tableDumps.push({
                    name: tableName,
                    columns: columnDefinitions,
                    primaryKey: primaryKeys,
                    createStatement,
                    rows: sanitizedRows,
                });
            }
            const artifactPayload = {
                version: 1,
                createdAt: new Date().toISOString(),
                tables: tableDumps,
            };
            await this.writeArtifact(backupId, sqlArtifactName, schemaContent);
            await this.writeArtifact(backupId, jsonArtifactName, JSON.stringify(artifactPayload, null, 2));
            this.logInfo("backup", "PostgreSQL backup created", {
                backupId,
                tables: tableDumps.length,
            });
        }
        catch (error) {
            this.logError("backup", "PostgreSQL backup failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw new MaintenanceOperationError(error instanceof Error ? error.message : "PostgreSQL backup failed", {
                code: "BACKUP_POSTGRES_FAILED",
                component: "postgres",
                stage: "backup",
                cause: error,
            });
        }
    }
    async backupConfig(backupId) {
        try {
            const configArtifact = `${backupId}_config.json`;
            // Sanitize config to remove sensitive data
            const sanitizedConfig = {
                ...this.config,
                qdrant: this.config.qdrant ? {
                    ...this.config.qdrant,
                    apiKey: this.config.qdrant.apiKey ? "[REDACTED]" : undefined,
                } : undefined,
            };
            await this.writeArtifact(backupId, configArtifact, JSON.stringify(sanitizedConfig, null, 2));
            this.logInfo("backup", "Configuration backup created", {
                backupId,
            });
        }
        catch (error) {
            this.logError("backup", "Configuration backup failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw new MaintenanceOperationError(error instanceof Error ? error.message : "Configuration backup failed", {
                code: "BACKUP_CONFIG_FAILED",
                component: "config",
                stage: "backup",
                cause: error,
            });
        }
    }
    async compressBackup(backupId) {
        if (!this.storageProvider.supportsStreaming ||
            !this.storageProvider.createReadStream ||
            !this.storageProvider.createWriteStream) {
            this.logInfo("backup", "Skipping compression for storage provider", {
                backupId,
                storageProvider: this.storageProvider.id,
            });
            return;
        }
        const archiveName = `${backupId}.tar.gz`;
        const archivePath = this.buildArtifactPath(backupId, archiveName);
        try {
            const files = await this.storageProvider.list();
            const backupFiles = files.filter((file) => file.startsWith(backupId) && !file.endsWith(".tar.gz"));
            const archive = archiver("tar", { gzip: true });
            const output = this.storageProvider.createWriteStream(archivePath);
            archive.pipe(output);
            for (const file of backupFiles) {
                const stream = this.storageProvider.createReadStream(file);
                archive.append(stream, { name: path.posix.basename(file) });
            }
            await archive.finalize();
            this.logInfo("backup", "Backup compressed", {
                backupId,
                archive: archiveName,
            });
        }
        catch (error) {
            this.logError("backup", "Backup compression failed", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw new MaintenanceOperationError(error instanceof Error ? error.message : "Backup compression failed", {
                code: "BACKUP_COMPRESSION_FAILED",
                component: "backup",
                stage: "compression",
                cause: error,
            });
        }
    }
    async calculateBackupSize(backupId) {
        try {
            const files = await this.storageProvider.list();
            const backupFiles = files.filter((file) => file.startsWith(backupId));
            let totalSize = 0;
            for (const file of backupFiles) {
                const stat = await this.storageProvider.stat(file);
                if (stat) {
                    totalSize += stat.size;
                }
            }
            return totalSize;
        }
        catch (error) {
            this.logError("backup", "Failed to calculate backup size", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            return 0;
        }
    }
    async calculateChecksum(backupId) {
        try {
            const files = await this.storageProvider.list();
            const backupFiles = files
                .filter((file) => file.startsWith(backupId))
                .filter((file) => !file.endsWith(".tar.gz"));
            const hash = crypto.createHash("sha256");
            for (const file of backupFiles.sort()) {
                const content = await this.storageProvider.readFile(file);
                hash.update(content);
            }
            return hash.digest("hex");
        }
        catch (error) {
            this.logError("backup", "Failed to calculate backup checksum", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            return "";
        }
    }
    quoteIdentifier(identifier) {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    sanitizeRowForBackup(row) {
        const sanitized = {};
        for (const [key, value] of Object.entries(row)) {
            sanitized[key] = this.sanitizeValueForBackup(value);
        }
        return sanitized;
    }
    sanitizeValueForBackup(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (Buffer.isBuffer(value)) {
            return {
                __backupType: "Buffer",
                data: value.toString("base64"),
            };
        }
        if (value instanceof Date) {
            return {
                __backupType: "Date",
                value: value.toISOString(),
            };
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeValueForBackup(item));
        }
        if (typeof value === "object") {
            return value;
        }
        return value;
    }
    hydrateValueForRestore(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.hydrateValueForRestore(item));
        }
        if (typeof value === "object" &&
            value !== null &&
            value.__backupType === "Buffer" &&
            typeof value.data === "string") {
            return Buffer.from(value.data, "base64");
        }
        if (typeof value === "object" &&
            value !== null &&
            value.__backupType === "Date" &&
            typeof value.value === "string") {
            return new Date(value.value);
        }
        return value;
    }
    mapUdtNameToSqlType(udtName) {
        var _a;
        if (!udtName) {
            return "text";
        }
        const normalized = udtName.replace(/^_/, "");
        const mapping = {
            int2: "smallint",
            int4: "integer",
            int8: "bigint",
            float4: "real",
            float8: "double precision",
            numeric: "numeric",
            varchar: "character varying",
            text: "text",
            bool: "boolean",
            bytea: "bytea",
            timestamp: "timestamp",
            timestamptz: "timestamp with time zone",
            date: "date",
            time: "time",
            timetz: "time with time zone",
            uuid: "uuid",
            json: "json",
            jsonb: "jsonb",
            citext: "citext",
        };
        return (_a = mapping[normalized]) !== null && _a !== void 0 ? _a : normalized;
    }
    resolveColumnType(column) {
        var _a;
        const dataType = column.dataType.toLowerCase();
        if (dataType === "array") {
            const elementType = this.mapUdtNameToSqlType(column.udtName);
            return `${elementType}[]`;
        }
        if (dataType === "user-defined") {
            return (_a = column.udtName) !== null && _a !== void 0 ? _a : column.dataType;
        }
        if (dataType === "character varying" || dataType === "varchar") {
            if (column.characterMaximumLength) {
                return `character varying(${column.characterMaximumLength})`;
            }
            return "character varying";
        }
        if (dataType === "numeric" || dataType === "decimal") {
            if (column.numericPrecision) {
                if (column.numericScale) {
                    return `numeric(${column.numericPrecision}, ${column.numericScale})`;
                }
                return `numeric(${column.numericPrecision})`;
            }
            return "numeric";
        }
        return column.dataType;
    }
    generateCreateTableStatement(tableName, columns, primaryKey) {
        const columnStatements = columns.map((column) => {
            const parts = [
                `${this.quoteIdentifier(column.name)} ${this.resolveColumnType(column)}`,
            ];
            if (column.columnDefault) {
                parts.push(`DEFAULT ${column.columnDefault}`);
            }
            if (!column.isNullable) {
                parts.push("NOT NULL");
            }
            return parts.join(" ");
        });
        let statement = `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (\n  ${columnStatements.join(",\n  ")}`;
        if (primaryKey.length > 0) {
            statement += `,\n  PRIMARY KEY (${primaryKey
                .map((key) => this.quoteIdentifier(key))
                .join(", ")})`;
        }
        statement += `\n);`;
        return statement;
    }
    async storeBackupMetadata(metadata, context) {
        var _a, _b;
        try {
            const pg = this.dbService.getPostgreSQLService();
            const serializableMetadata = {
                ...metadata,
                timestamp: metadata.timestamp.toISOString(),
            };
            await pg.query(`INSERT INTO maintenance_backups (
            id,
            type,
            recorded_at,
            size_bytes,
            checksum,
            status,
            components,
            storage_provider,
            destination,
            labels,
            metadata,
            error,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          ON CONFLICT (id)
          DO UPDATE SET
            type = EXCLUDED.type,
            recorded_at = EXCLUDED.recorded_at,
            size_bytes = EXCLUDED.size_bytes,
            checksum = EXCLUDED.checksum,
            status = EXCLUDED.status,
            components = EXCLUDED.components,
            storage_provider = EXCLUDED.storage_provider,
            destination = EXCLUDED.destination,
            labels = EXCLUDED.labels,
            metadata = EXCLUDED.metadata,
            error = EXCLUDED.error,
            updated_at = NOW()
        `, [
                metadata.id,
                metadata.type,
                metadata.timestamp,
                metadata.size,
                metadata.checksum,
                metadata.status,
                JSON.stringify(metadata.components),
                context.storageProviderId,
                (_a = context.destination) !== null && _a !== void 0 ? _a : null,
                (_b = context.labels) !== null && _b !== void 0 ? _b : [],
                JSON.stringify(serializableMetadata),
                context.error
                    ? typeof context.error === "string"
                        ? context.error
                        : JSON.stringify(context.error)
                    : null,
            ]);
        }
        catch (error) {
            this.logError("backup", "Failed to persist backup metadata", {
                backupId: metadata.id,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async getBackupMetadata(backupId) {
        var _a;
        const record = await this.getBackupRecord(backupId);
        return (_a = record === null || record === void 0 ? void 0 : record.metadata) !== null && _a !== void 0 ? _a : null;
    }
    async getBackupRecord(backupId) {
        var _a;
        try {
            const pg = this.dbService.getPostgreSQLService();
            const result = await pg.query(`SELECT metadata, storage_provider, destination, labels, status
         FROM maintenance_backups
         WHERE id = $1
         LIMIT 1`, [backupId]);
            if (!result.rows || result.rows.length === 0) {
                return await this.loadLegacyBackupRecord(backupId);
            }
            const row = result.rows[0];
            const parsed = this.deserializeBackupMetadata((_a = row.metadata) !== null && _a !== void 0 ? _a : row.metadata_json);
            if (!parsed) {
                return await this.loadLegacyBackupRecord(backupId);
            }
            return {
                metadata: parsed,
                storageProviderId: row.storage_provider,
                destination: row.destination,
                labels: row.labels,
                status: row.status,
            };
        }
        catch (error) {
            this.logError("backup", "Failed to load backup metadata", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            return await this.loadLegacyBackupRecord(backupId);
        }
    }
    async validateBackup(backupId) {
        const metadata = await this.getBackupMetadata(backupId);
        if (!metadata) {
            throw new MaintenanceOperationError(`Backup metadata not found for ${backupId}`, {
                code: "BACKUP_METADATA_NOT_FOUND",
                statusCode: 404,
                component: "backup",
                stage: "validation",
            });
        }
        const validations = [];
        if (metadata.components.falkordb) {
            validations.push(await this.validateFalkorBackup(backupId));
        }
        if (metadata.components.qdrant) {
            validations.push(await this.validateQdrantBackup(backupId));
        }
        if (metadata.components.postgres) {
            validations.push(await this.validatePostgresBackup(backupId));
        }
        if (metadata.components.config) {
            validations.push(await this.validateConfigBackup(backupId));
        }
        return validations;
    }
    async restoreFalkorDB(backupId) {
        const artifact = `${backupId}_falkordb.dump`;
        this.logInfo("restore", "Restoring FalkorDB", { backupId });
        try {
            const exists = await this.artifactExists(backupId, artifact);
            if (!exists) {
                this.logInfo("restore", "FalkorDB snapshot not found; skipping", {
                    backupId,
                    artifact,
                });
                return;
            }
            const backupData = JSON.parse((await this.readArtifact(backupId, artifact)).toString("utf-8"));
            const falkorService = this.dbService.getFalkorDBService();
            await falkorService.query(`MATCH (n) DETACH DELETE n`);
            const sanitizeProperties = (props) => {
                if (!props || typeof props !== "object")
                    return {};
                const sanitized = {};
                for (const [key, value] of Object.entries(props)) {
                    if (value === null || value === undefined) {
                        // Skip null/undefined values
                        continue;
                    }
                    else if (typeof value === "string" ||
                        typeof value === "number" ||
                        typeof value === "boolean") {
                        // Primitive types are allowed
                        sanitized[key] = value;
                    }
                    else if (Array.isArray(value)) {
                        // Arrays of primitives are allowed
                        const sanitizedArray = value.filter((item) => item === null ||
                            typeof item === "string" ||
                            typeof item === "number" ||
                            typeof item === "boolean");
                        if (sanitizedArray.length > 0) {
                            sanitized[key] = sanitizedArray;
                        }
                    }
                    else if (typeof value === "object") {
                        // Convert complex objects to JSON strings
                        try {
                            sanitized[key] = JSON.stringify(value);
                        }
                        catch (_a) {
                            // If JSON serialization fails, skip this property
                            console.warn(`⚠️ Skipping complex property ${key} - cannot serialize`);
                        }
                    }
                }
                return sanitized;
            };
            // Restore nodes
            if (backupData.nodes && backupData.nodes.length > 0) {
                for (const node of backupData.nodes) {
                    const labels = node.labels && node.labels.length > 0
                        ? `:${node.labels.join(":")}`
                        : "";
                    const sanitizedProps = sanitizeProperties(node.props);
                    // Create node with labels, then merge all properties from map parameter
                    await falkorService.query(`CREATE (n${labels}) WITH n SET n += $props`, {
                        props: sanitizedProps,
                    });
                }
            }
            // Restore relationships
            if (backupData.relationships && backupData.relationships.length > 0) {
                for (const rel of backupData.relationships) {
                    const sanitizedProps = sanitizeProperties(rel.props);
                    await falkorService.query(`MATCH (a), (b) WHERE ID(a) = $startId AND ID(b) = $endId
             CREATE (a)-[r:${rel.type}]->(b) WITH r SET r += $props`, { startId: rel.startId, endId: rel.endId, props: sanitizedProps });
                }
            }
            this.logInfo("restore", "FalkorDB restored", { backupId });
        }
        catch (error) {
            this.logError("restore", "FalkorDB restore encountered errors", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async restoreQdrant(backupId) {
        this.logInfo("restore", "Restoring Qdrant", { backupId });
        try {
            const qdrantClient = this.dbService.getQdrantService().getClient();
            const manifestArtifact = `${backupId}_qdrant_collections.json`;
            const manifestExists = await this.artifactExists(backupId, manifestArtifact);
            if (!manifestExists) {
                this.logInfo("restore", "No Qdrant collections manifest found; skipping", {
                    backupId,
                });
                return;
            }
            const manifest = JSON.parse((await this.readArtifact(backupId, manifestArtifact)).toString("utf-8"));
            const collectionEntries = Array.isArray(manifest === null || manifest === void 0 ? void 0 : manifest.collections)
                ? manifest.collections.filter((item) => typeof (item === null || item === void 0 ? void 0 : item.name) === "string")
                : [];
            for (const entry of collectionEntries) {
                const name = entry.name;
                if (entry === null || entry === void 0 ? void 0 : entry.error) {
                    this.logError("restore", "Skipping Qdrant collection due to backup error", {
                        backupId,
                        collection: name,
                        error: entry.error,
                    });
                    continue;
                }
                try {
                    await this.recreateQdrantCollection(qdrantClient, entry);
                    const points = await this.loadQdrantPoints(backupId, entry);
                    await this.upsertQdrantPoints(qdrantClient, name, points);
                    this.logInfo("restore", "Qdrant collection restored", {
                        backupId,
                        collection: name,
                        pointsRestored: points.length,
                    });
                }
                catch (error) {
                    this.logError("restore", "Failed to restore Qdrant collection", {
                        backupId,
                        collection: name,
                        error: error instanceof Error ? error.message : error,
                    });
                    throw error;
                }
            }
            this.logInfo("restore", "Qdrant restore completed", {
                backupId,
                collections: collectionEntries.length,
            });
        }
        catch (error) {
            this.logError("restore", "Failed to restore Qdrant", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async restorePostgreSQL(backupId) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.logInfo("restore", "Restoring PostgreSQL", { backupId });
        try {
            const jsonArtifact = `${backupId}_postgres.json`;
            const sqlArtifact = `${backupId}_postgres.sql`;
            const postgresService = this.dbService.getPostgreSQLService();
            if (await this.artifactExists(backupId, jsonArtifact)) {
                const artifactContent = (await this.readArtifact(backupId, jsonArtifact)).toString("utf-8");
                const payload = JSON.parse(artifactContent);
                for (const table of payload.tables) {
                    const columnDefinitions = (_a = table.columns) !== null && _a !== void 0 ? _a : [];
                    const primaryKeys = (_b = table.primaryKey) !== null && _b !== void 0 ? _b : [];
                    const createStatement = ((_c = table.createStatement) === null || _c === void 0 ? void 0 : _c.trim()) ||
                        this.generateCreateTableStatement(table.name, columnDefinitions, primaryKeys);
                    if (createStatement) {
                        try {
                            await postgresService.query(createStatement);
                        }
                        catch (error) {
                            if (!((_d = error === null || error === void 0 ? void 0 : error.message) === null || _d === void 0 ? void 0 : _d.includes("already exists"))) {
                                this.logError("restore", "Failed to create table", {
                                    backupId,
                                    table: table.name,
                                    error: error instanceof Error ? error.message : error,
                                });
                                throw error;
                            }
                        }
                    }
                    if (!Array.isArray(table.rows) || table.rows.length === 0) {
                        continue;
                    }
                    const columnNames = columnDefinitions.length
                        ? columnDefinitions.map((col) => col.name)
                        : Object.keys((_e = table.rows[0]) !== null && _e !== void 0 ? _e : {});
                    if (columnNames.length === 0) {
                        continue;
                    }
                    const quotedColumns = columnNames.map((name) => this.quoteIdentifier(name));
                    const placeholders = columnNames
                        .map((_, index) => `$${index + 1}`)
                        .join(", ");
                    const upsertClause = (() => {
                        if (!primaryKeys.length) {
                            return "";
                        }
                        const nonPkColumns = columnNames.filter((name) => !primaryKeys.includes(name));
                        if (!nonPkColumns.length) {
                            return ` ON CONFLICT (${primaryKeys
                                .map((key) => this.quoteIdentifier(key))
                                .join(", ")}) DO NOTHING`;
                        }
                        const updateAssignments = nonPkColumns
                            .map((name) => `${this.quoteIdentifier(name)} = EXCLUDED.${this.quoteIdentifier(name)}`)
                            .join(", ");
                        return ` ON CONFLICT (${primaryKeys
                            .map((key) => this.quoteIdentifier(key))
                            .join(", ")}) DO UPDATE SET ${updateAssignments}`;
                    })();
                    const insertSql = `INSERT INTO ${this.quoteIdentifier(table.name)} (${quotedColumns.join(", ")}) VALUES (${placeholders})${upsertClause}`;
                    for (const row of table.rows) {
                        const values = columnNames.map((name) => this.hydrateValueForRestore(row[name]));
                        await postgresService.query(insertSql, values);
                    }
                }
                this.logInfo("restore", "PostgreSQL restored from structured artifact", {
                    backupId,
                    tablesRestored: payload.tables.length,
                });
                return;
            }
            const sqlExists = await this.artifactExists(backupId, sqlArtifact);
            if (!sqlExists) {
                this.logInfo("restore", "PostgreSQL artifacts not found; skipping", {
                    backupId,
                });
                return;
            }
            const dumpContent = (await this.readArtifact(backupId, sqlArtifact)).toString("utf-8");
            try {
                await postgresService.query(dumpContent);
                this.logInfo("restore", "PostgreSQL restored using legacy dump", {
                    backupId,
                });
                return;
            }
            catch (multiErr) {
                this.logError("restore", "Legacy dump replay failed; attempting statement-by-statement recovery", {
                    backupId,
                    error: (_f = multiErr === null || multiErr === void 0 ? void 0 : multiErr.message) !== null && _f !== void 0 ? _f : multiErr,
                });
            }
            const statements = [];
            let currentStatement = "";
            let inParentheses = 0;
            let inQuotes = false;
            let quoteChar = "";
            for (let i = 0; i < dumpContent.length; i++) {
                const char = dumpContent[i];
                const prevChar = i > 0 ? dumpContent[i - 1] : "";
                if ((char === '"' || char === "'") && prevChar !== "\\") {
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                    }
                    else if (char === quoteChar) {
                        inQuotes = false;
                        quoteChar = "";
                    }
                }
                if (!inQuotes) {
                    if (char === "(")
                        inParentheses++;
                    else if (char === ")")
                        inParentheses--;
                }
                currentStatement += char;
                if (char === ";" && !inQuotes && inParentheses === 0) {
                    const trimmed = currentStatement.trim();
                    if (trimmed && !trimmed.startsWith("--")) {
                        statements.push(trimmed);
                    }
                    currentStatement = "";
                }
            }
            const createStatements = [];
            const insertStatements = [];
            for (const statement of statements) {
                if (statement.toUpperCase().includes("CREATE TABLE")) {
                    createStatements.push(statement);
                }
                else if (statement.toUpperCase().includes("INSERT INTO")) {
                    insertStatements.push(statement);
                }
            }
            for (const statement of createStatements) {
                try {
                    await postgresService.query(statement);
                }
                catch (error) {
                    if (!((_g = error === null || error === void 0 ? void 0 : error.message) === null || _g === void 0 ? void 0 : _g.includes("already exists"))) {
                        console.warn(`⚠️ Failed to create table: ${statement.substring(0, 50)}...`, error);
                    }
                }
            }
            for (const statement of insertStatements) {
                try {
                    await postgresService.query(statement);
                }
                catch (error) {
                    if (error.code === "23505" &&
                        ((_h = error.message) === null || _h === void 0 ? void 0 : _h.includes("duplicate key"))) {
                        try {
                            const insertMatch = statement.match(/INSERT INTO ([\w"]+) VALUES \((.+)\);/);
                            if (insertMatch) {
                                const tableIdentifier = insertMatch[1].replace(/"/g, "");
                                const columnsQuery = `
                  SELECT column_name
                  FROM information_schema.columns
                  WHERE table_name = $1 AND table_schema = 'public'
                  ORDER BY ordinal_position;
                `;
                                const columnsResult = await postgresService.query(columnsQuery, [tableIdentifier]);
                                const columns = columnsResult.rows || columnsResult;
                                if (columns.length > 0) {
                                    const updateClause = columns
                                        .map((col) => `${col.column_name} = EXCLUDED.${col.column_name}`)
                                        .join(", ");
                                    const conflictStatement = `${statement.slice(0, -1)} ON CONFLICT (id) DO UPDATE SET ${updateClause};`;
                                    await postgresService.query(conflictStatement);
                                }
                            }
                        }
                        catch (updateError) {
                            console.warn(`⚠️ Failed to resolve conflict for statement: ${statement.substring(0, 50)}...`, updateError);
                        }
                    }
                    else {
                        console.warn(`⚠️ Failed to insert data: ${statement.substring(0, 50)}...`, error);
                    }
                }
            }
            this.logInfo("restore", "PostgreSQL restored from legacy artifact", {
                backupId,
            });
        }
        catch (error) {
            this.logError("restore", "Failed to restore PostgreSQL", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async restoreConfig(backupId) {
        this.logInfo("restore", "Restoring configuration", { backupId });
        try {
            const artifact = `${backupId}_config.json`;
            const exists = await this.artifactExists(backupId, artifact);
            if (!exists) {
                this.logInfo("restore", "Configuration snapshot not found; skipping", {
                    backupId,
                });
                return;
            }
            const configContent = (await this.readArtifact(backupId, artifact)).toString("utf-8");
            const restoredConfig = JSON.parse(configContent);
            this.logInfo("restore", "Configuration snapshot loaded", {
                backupId,
                keys: Object.keys(restoredConfig !== null && restoredConfig !== void 0 ? restoredConfig : {}),
            });
        }
        catch (error) {
            this.logError("restore", "Failed to restore configuration", {
                backupId,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async verifyBackupIntegrity(backupId, options) {
        var _a, _b, _c, _d;
        try {
            const record = await this.getBackupRecord(backupId);
            if (!record) {
                return {
                    passed: false,
                    isValid: false,
                    details: `Backup metadata not found for ${backupId}`,
                };
            }
            await this.prepareStorageContext({
                destination: (_a = options === null || options === void 0 ? void 0 : options.destination) !== null && _a !== void 0 ? _a : ((_b = record.destination) !== null && _b !== void 0 ? _b : undefined),
                storageProviderId: (_d = (_c = options === null || options === void 0 ? void 0 : options.storageProviderId) !== null && _c !== void 0 ? _c : record.storageProviderId) !== null && _d !== void 0 ? _d : undefined,
            });
            const metadata = record.metadata;
            const currentChecksum = await this.calculateChecksum(backupId);
            if (currentChecksum !== metadata.checksum) {
                return {
                    passed: false,
                    isValid: false,
                    details: "Checksum mismatch detected. This indicates the backup may be corrupt.",
                    metadata: {
                        checksum: {
                            expected: metadata.checksum,
                            actual: currentChecksum,
                        },
                    },
                };
            }
            const expectedArtifacts = [];
            const missingFiles = [];
            if (metadata.components.falkordb) {
                expectedArtifacts.push(`${backupId}_falkordb.dump`);
            }
            if (metadata.components.qdrant) {
                expectedArtifacts.push(`${backupId}_qdrant_collections.json`);
                const qdrantArtifacts = await this.collectQdrantPointArtifacts(backupId);
                expectedArtifacts.push(...qdrantArtifacts);
            }
            if (metadata.components.postgres) {
                const postgresJson = `${backupId}_postgres.json`;
                const postgresSql = `${backupId}_postgres.sql`;
                const jsonExists = await this.artifactExists(backupId, postgresJson);
                const sqlExists = await this.artifactExists(backupId, postgresSql);
                if (jsonExists) {
                    expectedArtifacts.push(postgresJson);
                }
                if (sqlExists) {
                    expectedArtifacts.push(postgresSql);
                }
                if (!jsonExists && !sqlExists) {
                    missingFiles.push(postgresJson);
                }
            }
            if (metadata.components.config) {
                expectedArtifacts.push(`${backupId}_config.json`);
            }
            for (const artifact of expectedArtifacts) {
                const exists = await this.artifactExists(backupId, artifact);
                if (!exists) {
                    missingFiles.push(artifact);
                }
            }
            if (missingFiles.length > 0) {
                return {
                    passed: false,
                    isValid: false,
                    details: "Missing or corrupt backup files detected.",
                    metadata: {
                        missingFiles,
                    },
                };
            }
            return {
                passed: true,
                isValid: true,
                details: "All backup files present and checksums match",
                metadata: {
                    missingFiles: [],
                    storageProvider: this.storageProvider.id,
                },
            };
        }
        catch (error) {
            return {
                passed: false,
                isValid: false,
                details: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                metadata: {
                    cause: error,
                },
            };
        }
    }
    async listBackups(options) {
        var _a;
        try {
            const pg = this.dbService.getPostgreSQLService();
            const params = [];
            let whereClause = "";
            if (options === null || options === void 0 ? void 0 : options.destination) {
                params.push(options.destination);
                whereClause = "WHERE destination = $1";
            }
            const result = await pg.query(`SELECT metadata FROM maintenance_backups ${whereClause} ORDER BY recorded_at DESC`, params);
            const records = new Map();
            for (const row of result.rows || []) {
                const metadata = this.deserializeBackupMetadata((_a = row.metadata) !== null && _a !== void 0 ? _a : row.metadata_json);
                if (metadata) {
                    records.set(metadata.id, metadata);
                }
            }
            if (!(options === null || options === void 0 ? void 0 : options.destination)) {
                const legacyBackups = await this.listLegacyBackupMetadata();
                for (const metadata of legacyBackups) {
                    if (!records.has(metadata.id)) {
                        records.set(metadata.id, metadata);
                    }
                }
            }
            return Array.from(records.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }
        catch (error) {
            this.logError("backup", "Failed to list backups", {
                error: error instanceof Error ? error.message : error,
            });
            const legacyBackups = await this.listLegacyBackupMetadata();
            if (legacyBackups.length > 0 && !(options === null || options === void 0 ? void 0 : options.destination)) {
                return legacyBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            }
            return [];
        }
    }
    deserializeBackupMetadata(raw) {
        var _a, _b, _c;
        if (!raw) {
            return null;
        }
        let value = raw;
        if (typeof raw === "string") {
            try {
                value = JSON.parse(raw);
            }
            catch (_d) {
                return null;
            }
        }
        if (!value || typeof value !== "object") {
            return null;
        }
        const timestampInput = value.timestamp;
        const timestamp = timestampInput instanceof Date
            ? timestampInput
            : new Date(typeof timestampInput === "string" ? timestampInput : Number(timestampInput));
        if (!timestamp || Number.isNaN(timestamp.getTime())) {
            return null;
        }
        const id = value.id;
        const type = value.type;
        if (typeof id !== "string" || !id) {
            return null;
        }
        const normalizedType = type === "incremental" ? "incremental" : "full";
        const sourceComponents = (_a = value.components) !== null && _a !== void 0 ? _a : {};
        const metadata = {
            id,
            type: normalizedType,
            timestamp,
            size: Number((_c = (_b = value.size) !== null && _b !== void 0 ? _b : value.size_bytes) !== null && _c !== void 0 ? _c : 0) || 0,
            checksum: typeof value.checksum === "string" ? value.checksum : "",
            components: {
                falkordb: Boolean(sourceComponents.falkordb),
                qdrant: Boolean(sourceComponents.qdrant),
                postgres: Boolean(sourceComponents.postgres),
                config: Boolean(sourceComponents.config),
            },
            status: value.status === "failed"
                ? "failed"
                : value.status === "in_progress"
                    ? "in_progress"
                    : "completed",
        };
        return metadata;
    }
    async loadLegacyBackupRecord(backupId) {
        const metadata = await this.readLegacyBackupMetadata(backupId);
        if (!metadata) {
            return null;
        }
        return {
            metadata,
            storageProviderId: this.storageProvider.id,
            destination: null,
            labels: null,
            status: metadata.status,
        };
    }
    async readLegacyBackupMetadata(backupId) {
        const fileName = `${backupId}_metadata.json`;
        const metadataFromProvider = await this.readLegacyMetadataFromProvider(fileName);
        if (metadataFromProvider) {
            return metadataFromProvider;
        }
        try {
            const metadataPath = path.join(this.backupDir, fileName);
            const content = await fs.readFile(metadataPath, "utf-8");
            return this.deserializeBackupMetadata(content);
        }
        catch (_a) {
            return null;
        }
    }
    async readLegacyMetadataFromProvider(fileName) {
        try {
            await this.storageProvider.ensureReady();
            const exists = await this.storageProvider.exists(fileName);
            if (!exists) {
                return null;
            }
            const buffer = await this.storageProvider.readFile(fileName);
            return this.deserializeBackupMetadata(buffer.toString("utf-8"));
        }
        catch (_a) {
            return null;
        }
    }
    async listLegacyBackupMetadata() {
        const results = new Map();
        const metadataSuffix = "_metadata.json";
        const providerEntries = await this.listLegacyMetadataFromProvider();
        for (const metadata of providerEntries) {
            results.set(metadata.id, metadata);
        }
        try {
            const files = await fs.readdir(this.backupDir);
            for (const file of files) {
                if (!file.endsWith(metadataSuffix)) {
                    continue;
                }
                if (results.has(file.replace(metadataSuffix, ""))) {
                    continue;
                }
                try {
                    const content = await fs.readFile(path.join(this.backupDir, file), "utf-8");
                    const metadata = this.deserializeBackupMetadata(content);
                    if (metadata) {
                        results.set(metadata.id, metadata);
                    }
                }
                catch (_a) {
                    // Ignore unreadable legacy file
                }
            }
        }
        catch (_b) {
            // Ignore missing local backup directory
        }
        return Array.from(results.values());
    }
    async listLegacyMetadataFromProvider() {
        try {
            await this.storageProvider.ensureReady();
            const files = await this.storageProvider.list();
            const metadataFiles = files.filter((file) => file.endsWith("_metadata.json"));
            const results = [];
            for (const file of metadataFiles) {
                try {
                    const buffer = await this.storageProvider.readFile(file);
                    const metadata = this.deserializeBackupMetadata(buffer.toString("utf-8"));
                    if (metadata) {
                        results.push(metadata);
                    }
                }
                catch (_a) {
                    // Ignore unreadable provider metadata
                }
            }
            return results;
        }
        catch (_b) {
            return [];
        }
    }
}
//# sourceMappingURL=BackupService.js.map