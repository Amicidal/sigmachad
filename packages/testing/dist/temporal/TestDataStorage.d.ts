/**
 * @file TestDataStorage.ts
 * @description Enhanced data storage for temporal test tracking
 *
 * Provides database persistence, data compression, archival strategies,
 * and data export/import utilities for temporal test data.
 */
import { DatabaseService } from '@memento/database';
import { TestExecutionRecord, TestEvolutionEvent, TestRelationship } from './TestTypes.js';
export interface StorageConfiguration {
    /** Enable database persistence */
    enablePersistence: boolean;
    /** Enable data compression */
    enableCompression: boolean;
    /** Compression level (1-9) */
    compressionLevel: number;
    /** Enable automatic archival */
    enableArchival: boolean;
    /** Data retention policies */
    retentionPolicies: {
        executions: number;
        events: number;
        relationships: number;
        snapshots: number;
    };
    /** Archival configuration */
    archivalConfig: {
        coldStorageThreshold: number;
        compressionRatio: number;
        batchSize: number;
    };
    /** Database configuration */
    databaseConfig: {
        connectionString?: string;
        poolSize: number;
        timeout: number;
    };
}
export interface DataSnapshot {
    /** Snapshot identifier */
    snapshotId: string;
    /** Snapshot timestamp */
    timestamp: Date;
    /** Snapshot type */
    type: 'full' | 'incremental' | 'differential';
    /** Data version */
    version: string;
    /** Compressed data size */
    compressedSize: number;
    /** Original data size */
    originalSize: number;
    /** Compression ratio */
    compressionRatio: number;
    /** Snapshot metadata */
    metadata: {
        testCount: number;
        executionCount: number;
        eventCount: number;
        relationshipCount: number;
        checksum: string;
    };
    /** Data payload (compressed if enabled) */
    data: Buffer;
}
export interface ArchivalRecord {
    /** Archive identifier */
    archiveId: string;
    /** Archive timestamp */
    timestamp: Date;
    /** Archive type */
    type: 'cold_storage' | 'backup' | 'export';
    /** Data range */
    dateRange: {
        start: Date;
        end: Date;
    };
    /** Archive location */
    location: string;
    /** Archive size */
    size: number;
    /** Archive metadata */
    metadata: {
        recordCount: number;
        compressionRatio: number;
        checksum: string;
    };
}
export interface ExportFormat {
    /** Export format type */
    format: 'json' | 'csv' | 'parquet' | 'avro' | 'binary';
    /** Include metadata */
    includeMetadata: boolean;
    /** Apply compression */
    compress: boolean;
    /** Encryption settings */
    encryption?: {
        enabled: boolean;
        algorithm: string;
        key?: string;
    };
}
export interface ImportResult {
    /** Import identifier */
    importId: string;
    /** Import timestamp */
    timestamp: Date;
    /** Import status */
    status: 'success' | 'partial' | 'failed';
    /** Records processed */
    recordsProcessed: number;
    /** Records imported */
    recordsImported: number;
    /** Errors encountered */
    errors: Array<{
        record: number;
        error: string;
        details?: any;
    }>;
    /** Import duration */
    duration: number;
}
export interface DataIntegrityCheck {
    /** Check identifier */
    checkId: string;
    /** Check timestamp */
    timestamp: Date;
    /** Check status */
    status: 'passed' | 'failed' | 'warning';
    /** Issues found */
    issues: Array<{
        type: 'corruption' | 'missing' | 'inconsistent' | 'duplicate';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        affectedRecords: number;
        recommendedAction: string;
    }>;
    /** Check statistics */
    statistics: {
        totalRecords: number;
        validRecords: number;
        corruptedRecords: number;
        missingRecords: number;
    };
}
export interface ITestDataStorage {
    /**
     * Store test execution record
     */
    storeExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Store test evolution event
     */
    storeEvent(event: TestEvolutionEvent): Promise<void>;
    /**
     * Store test relationship
     */
    storeRelationship(relationship: TestRelationship): Promise<void>;
    /**
     * Retrieve executions by test and date range
     */
    getExecutions(testId?: string, entityId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TestExecutionRecord[]>;
    /**
     * Retrieve events by test and date range
     */
    getEvents(testId?: string, entityId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TestEvolutionEvent[]>;
    /**
     * Retrieve relationships by test
     */
    getRelationships(testId?: string, entityId?: string, activeOnly?: boolean): Promise<TestRelationship[]>;
    /**
     * Create data snapshot
     */
    createSnapshot(type: 'full' | 'incremental' | 'differential', filters?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<DataSnapshot>;
    /**
     * Restore from snapshot
     */
    restoreSnapshot(snapshotId: string): Promise<void>;
    /**
     * Archive old data
     */
    archiveData(olderThan: Date, archiveType: 'cold_storage' | 'backup'): Promise<ArchivalRecord>;
    /**
     * Export data
     */
    exportData(format: ExportFormat, filters?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        dataTypes?: Array<'executions' | 'events' | 'relationships'>;
    }): Promise<Buffer>;
    /**
     * Import data
     */
    importData(data: Buffer, format: ExportFormat, options?: {
        overwrite?: boolean;
        validate?: boolean;
        dryRun?: boolean;
    }): Promise<ImportResult>;
    /**
     * Perform data integrity check
     */
    checkDataIntegrity(scope?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<DataIntegrityCheck>;
    /**
     * Cleanup old data based on retention policies
     */
    cleanupOldData(): Promise<{
        deletedExecutions: number;
        deletedEvents: number;
        deletedRelationships: number;
        deletedSnapshots: number;
    }>;
    /**
     * Get storage statistics
     */
    getStorageStatistics(): Promise<{
        totalSize: number;
        compressedSize: number;
        recordCounts: {
            executions: number;
            events: number;
            relationships: number;
            snapshots: number;
            archives: number;
        };
        compressionRatio: number;
        oldestRecord: Date;
        newestRecord: Date;
    }>;
}
/**
 * Enhanced data storage service for temporal test tracking
 */
export declare class TestDataStorage implements ITestDataStorage {
    private readonly config;
    private db?;
    private compressionCache;
    constructor(config?: Partial<StorageConfiguration>, databaseService?: DatabaseService);
    /**
     * Store test execution record
     */
    storeExecution(execution: TestExecutionRecord): Promise<void>;
    /**
     * Store test evolution event
     */
    storeEvent(event: TestEvolutionEvent): Promise<void>;
    /**
     * Store test relationship
     */
    storeRelationship(relationship: TestRelationship): Promise<void>;
    /**
     * Retrieve executions by test and date range
     */
    getExecutions(testId?: string, entityId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TestExecutionRecord[]>;
    /**
     * Retrieve events by test and date range
     */
    getEvents(testId?: string, entityId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TestEvolutionEvent[]>;
    /**
     * Retrieve relationships by test
     */
    getRelationships(testId?: string, entityId?: string, activeOnly?: boolean): Promise<TestRelationship[]>;
    /**
     * Create data snapshot
     */
    createSnapshot(type: 'full' | 'incremental' | 'differential', filters?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<DataSnapshot>;
    /**
     * Restore from snapshot
     */
    restoreSnapshot(snapshotId: string): Promise<void>;
    /**
     * Archive old data
     */
    archiveData(olderThan: Date, archiveType: 'cold_storage' | 'backup'): Promise<ArchivalRecord>;
    /**
     * Export data
     */
    exportData(format: ExportFormat, filters?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        dataTypes?: Array<'executions' | 'events' | 'relationships'>;
    }): Promise<Buffer>;
    /**
     * Import data
     */
    importData(data: Buffer, format: ExportFormat, options?: {
        overwrite?: boolean;
        validate?: boolean;
        dryRun?: boolean;
    }): Promise<ImportResult>;
    /**
     * Perform data integrity check
     */
    checkDataIntegrity(scope?: {
        testIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<DataIntegrityCheck>;
    /**
     * Cleanup old data based on retention policies
     */
    cleanupOldData(): Promise<{
        deletedExecutions: number;
        deletedEvents: number;
        deletedRelationships: number;
        deletedSnapshots: number;
    }>;
    /**
     * Get storage statistics
     */
    getStorageStatistics(): Promise<{
        totalSize: number;
        compressedSize: number;
        recordCounts: {
            executions: number;
            events: number;
            relationships: number;
            snapshots: number;
            archives: number;
        };
        compressionRatio: number;
        oldestRecord: Date;
        newestRecord: Date;
    }>;
    private compressData;
    private decompressData;
    private convertToCSV;
    private parseCSV;
    private serializeToBinary;
    private deserializeFromBinary;
    private encryptData;
    private decryptData;
    private validateImportData;
}
//# sourceMappingURL=TestDataStorage.d.ts.map