/**
 * @file TestDataStorage.ts
 * @description Enhanced data storage for temporal test tracking
 *
 * Provides database persistence, data compression, archival strategies,
 * and data export/import utilities for temporal test data.
 */

import {
  TestExecutionRecord,
  TestEvolutionEvent,
  TestRelationship,
  TestConfiguration,
  TestMetadata
} from './TestTypes.js';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

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
    executions: number; // days
    events: number; // days
    relationships: number; // days
    snapshots: number; // days
  };
  /** Archival configuration */
  archivalConfig: {
    coldStorageThreshold: number; // days
    compressionRatio: number; // target compression ratio
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
  getExecutions(
    testId?: string,
    entityId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TestExecutionRecord[]>;

  /**
   * Retrieve events by test and date range
   */
  getEvents(
    testId?: string,
    entityId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TestEvolutionEvent[]>;

  /**
   * Retrieve relationships by test
   */
  getRelationships(
    testId?: string,
    entityId?: string,
    activeOnly?: boolean
  ): Promise<TestRelationship[]>;

  /**
   * Create data snapshot
   */
  createSnapshot(
    type: 'full' | 'incremental' | 'differential',
    filters?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<DataSnapshot>;

  /**
   * Restore from snapshot
   */
  restoreSnapshot(snapshotId: string): Promise<void>;

  /**
   * Archive old data
   */
  archiveData(
    olderThan: Date,
    archiveType: 'cold_storage' | 'backup'
  ): Promise<ArchivalRecord>;

  /**
   * Export data
   */
  exportData(
    format: ExportFormat,
    filters?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
      dataTypes?: Array<'executions' | 'events' | 'relationships'>;
    }
  ): Promise<Buffer>;

  /**
   * Import data
   */
  importData(
    data: Buffer,
    format: ExportFormat,
    options?: {
      overwrite?: boolean;
      validate?: boolean;
      dryRun?: boolean;
    }
  ): Promise<ImportResult>;

  /**
   * Perform data integrity check
   */
  checkDataIntegrity(
    scope?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<DataIntegrityCheck>;

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
export class TestDataStorage implements ITestDataStorage {
  private readonly config: StorageConfiguration;
  private db?: any;
  private compressionCache = new Map<string, Buffer>();

  constructor(
    config: Partial<StorageConfiguration> = {},
    databaseService?: any
  ) {
    this.config = {
      enablePersistence: true,
      enableCompression: true,
      compressionLevel: 6,
      enableArchival: true,
      retentionPolicies: {
        executions: 90,
        events: 180,
        relationships: 365,
        snapshots: 30
      },
      archivalConfig: {
        coldStorageThreshold: 365,
        compressionRatio: 0.3,
        batchSize: 1000
      },
      databaseConfig: {
        poolSize: 10,
        timeout: 30000
      },
      ...config
    };

    this.db = databaseService;
  }

  /**
   * Store test execution record
   */
  async storeExecution(execution: TestExecutionRecord): Promise<void> {
    if (!this.config.enablePersistence || !this.db) {
      return;
    }

    const compressed = this.config.enableCompression ?
      await this.compressDataInternal(execution) : Buffer.from(JSON.stringify(execution));

    const query = `
      INSERT INTO test_executions (
        execution_id, test_id, entity_id, suite_id, timestamp, status,
        duration, compressed_data, original_size, compressed_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (execution_id) DO UPDATE SET
        status = excluded.status,
        duration = excluded.duration,
        compressed_data = excluded.compressed_data,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.execute(query, [
      execution.executionId,
      execution.testId,
      execution.entityId,
      execution.suiteId,
      execution.timestamp,
      execution.status,
      execution.duration,
      compressed,
      JSON.stringify(execution).length,
      compressed.length
    ]);
  }

  /**
   * Store test evolution event
   */
  async storeEvent(event: TestEvolutionEvent): Promise<void> {
    if (!this.config.enablePersistence || !this.db) {
      return;
    }

    const compressed = this.config.enableCompression ?
      await this.compressDataInternal(event) : Buffer.from(JSON.stringify(event));

    const query = `
      INSERT INTO test_events (
        event_id, test_id, entity_id, timestamp, type,
        compressed_data, original_size, compressed_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      event.eventId,
      event.testId,
      event.entityId,
      event.timestamp,
      event.type,
      compressed,
      JSON.stringify(event).length,
      compressed.length
    ]);
  }

  /**
   * Store test relationship
   */
  async storeRelationship(relationship: TestRelationship): Promise<void> {
    if (!this.config.enablePersistence || !this.db) {
      return;
    }

    const compressed = this.config.enableCompression ?
      await this.compressDataInternal(relationship) : Buffer.from(JSON.stringify(relationship));

    const query = `
      INSERT INTO test_relationships (
        relationship_id, test_id, entity_id, type, valid_from, valid_to,
        active, confidence, compressed_data, original_size, compressed_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (relationship_id) DO UPDATE SET
        valid_to = excluded.valid_to,
        active = excluded.active,
        confidence = excluded.confidence,
        compressed_data = excluded.compressed_data,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.execute(query, [
      relationship.relationshipId,
      relationship.testId,
      relationship.entityId,
      relationship.type,
      relationship.validFrom,
      relationship.validTo,
      relationship.active,
      relationship.confidence,
      compressed,
      JSON.stringify(relationship).length,
      compressed.length
    ]);
  }

  /**
   * Retrieve executions by test and date range
   */
  async getExecutions(
    testId?: string,
    entityId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TestExecutionRecord[]> {
    if (!this.config.enablePersistence || !this.db) {
      return [];
    }

    let query = 'SELECT * FROM test_executions WHERE 1=1';
    const params: any[] = [];

    if (testId) {
      query += ' AND test_id = ?';
      params.push(testId);
    }

    if (entityId) {
      query += ' AND entity_id = ?';
      params.push(entityId);
    }

    if (dateRange) {
      query += ' AND timestamp BETWEEN ? AND ?';
      params.push(dateRange.start, dateRange.end);
    }

    query += ' ORDER BY timestamp DESC';

    const rows = await this.db.query(query, params);
    const executions: TestExecutionRecord[] = [];

    for (const row of rows) {
      const data = this.config.enableCompression ?
        await this.decompressDataInternal(row.compressed_data) :
        JSON.parse(row.compressed_data.toString());

      executions.push(data);
    }

    return executions;
  }

  /**
   * Retrieve events by test and date range
   */
  async getEvents(
    testId?: string,
    entityId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TestEvolutionEvent[]> {
    if (!this.config.enablePersistence || !this.db) {
      return [];
    }

    let query = 'SELECT * FROM test_events WHERE 1=1';
    const params: any[] = [];

    if (testId) {
      query += ' AND test_id = ?';
      params.push(testId);
    }

    if (entityId) {
      query += ' AND entity_id = ?';
      params.push(entityId);
    }

    if (dateRange) {
      query += ' AND timestamp BETWEEN ? AND ?';
      params.push(dateRange.start, dateRange.end);
    }

    query += ' ORDER BY timestamp DESC';

    const rows = await this.db.query(query, params);
    const events: TestEvolutionEvent[] = [];

    for (const row of rows) {
      const data = this.config.enableCompression ?
        await this.decompressDataInternal(row.compressed_data) :
        JSON.parse(row.compressed_data.toString());

      events.push(data);
    }

    return events;
  }

  /**
   * Retrieve relationships by test
   */
  async getRelationships(
    testId?: string,
    entityId?: string,
    activeOnly = true
  ): Promise<TestRelationship[]> {
    if (!this.config.enablePersistence || !this.db) {
      return [];
    }

    let query = 'SELECT * FROM test_relationships WHERE 1=1';
    const params: any[] = [];

    if (testId) {
      query += ' AND test_id = ?';
      params.push(testId);
    }

    if (entityId) {
      query += ' AND entity_id = ?';
      params.push(entityId);
    }

    if (activeOnly) {
      query += ' AND active = true';
    }

    query += ' ORDER BY valid_from DESC';

    const rows = await this.db.query(query, params);
    const relationships: TestRelationship[] = [];

    for (const row of rows) {
      const data = this.config.enableCompression ?
        await this.decompressDataInternal(row.compressed_data) :
        JSON.parse(row.compressed_data.toString());

      relationships.push(data);
    }

    return relationships;
  }

  /**
   * Create data snapshot
   */
  async createSnapshot(
    type: 'full' | 'incremental' | 'differential',
    filters?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<DataSnapshot> {
    const snapshotId = `snapshot_${type}_${Date.now()}`;
    const timestamp = new Date();

    // Collect data based on filters
    const executions = await this.getExecutions(
      undefined,
      undefined,
      filters?.dateRange
    );

    const events = await this.getEvents(
      undefined,
      undefined,
      filters?.dateRange
    );

    const relationships = await this.getRelationships();

    // Filter by test IDs if specified
    const filteredExecutions = filters?.testIds ?
      executions.filter(exec => filters.testIds!.includes(exec.testId)) :
      executions;

    const filteredEvents = filters?.testIds ?
      events.filter(event => filters.testIds!.includes(event.testId)) :
      events;

    const filteredRelationships = filters?.testIds ?
      relationships.filter(rel => filters.testIds!.includes(rel.testId)) :
      relationships;

    // Create snapshot data
    const snapshotData = {
      type,
      timestamp,
      executions: filteredExecutions,
      events: filteredEvents,
      relationships: filteredRelationships,
      metadata: {
        version: '1.0.0',
        filters
      }
    };

    const originalData = Buffer.from(JSON.stringify(snapshotData));
    const compressedData = this.config.enableCompression ?
      await gzip(originalData, { level: this.config.compressionLevel }) :
      originalData;

    const checksum = crypto.createHash('sha256').update(originalData).digest('hex');

    const snapshot: DataSnapshot = {
      snapshotId,
      timestamp,
      type,
      version: '1.0.0',
      compressedSize: compressedData.length,
      originalSize: originalData.length,
      compressionRatio: compressedData.length / originalData.length,
      metadata: {
        testCount: new Set([...filteredExecutions.map(e => e.testId)]).size,
        executionCount: filteredExecutions.length,
        eventCount: filteredEvents.length,
        relationshipCount: filteredRelationships.length,
        checksum
      },
      data: compressedData
    };

    // Store snapshot in database
    if (this.config.enablePersistence && this.db) {
      const query = `
        INSERT INTO data_snapshots (
          snapshot_id, timestamp, type, version, compressed_size,
          original_size, compression_ratio, metadata, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(query, [
        snapshotId,
        timestamp,
        type,
        snapshot.version,
        snapshot.compressedSize,
        snapshot.originalSize,
        snapshot.compressionRatio,
        JSON.stringify(snapshot.metadata),
        compressedData
      ]);
    }

    return snapshot;
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    if (!this.config.enablePersistence || !this.db) {
      throw new Error('Database persistence is required for snapshot restoration');
    }

    const query = 'SELECT * FROM data_snapshots WHERE snapshot_id = ?';
    const rows = await this.db.query(query, [snapshotId]);

    if (rows.length === 0) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const snapshotRow = rows[0];
    const compressedData = snapshotRow.data;

    const originalData = this.config.enableCompression ?
      await gunzip(compressedData) :
      compressedData;

    const snapshotData = JSON.parse(originalData.toString());

    // Verify data integrity
    const checksum = crypto.createHash('sha256').update(originalData).digest('hex');
    const metadata = JSON.parse(snapshotRow.metadata);

    if (checksum !== metadata.checksum) {
      throw new Error('Snapshot data integrity check failed');
    }

    // Restore data
    await this.db.transaction(async () => {
      // Clear existing data (optional - could be configurable)
      if (snapshotData.type === 'full') {
        await this.db!.execute('DELETE FROM test_executions');
        await this.db!.execute('DELETE FROM test_events');
        await this.db!.execute('DELETE FROM test_relationships');
      }

      // Restore executions
      for (const execution of snapshotData.executions) {
        await this.storeExecution(execution);
      }

      // Restore events
      for (const event of snapshotData.events) {
        await this.storeEvent(event);
      }

      // Restore relationships
      for (const relationship of snapshotData.relationships) {
        await this.storeRelationship(relationship);
      }
    });
  }

  /**
   * Archive old data
   */
  async archiveData(
    olderThan: Date,
    archiveType: 'cold_storage' | 'backup'
  ): Promise<ArchivalRecord> {
    if (!this.config.enableArchival) {
      throw new Error('Data archival is disabled');
    }

    const archiveId = `archive_${archiveType}_${Date.now()}`;
    const timestamp = new Date();

    // Get data to archive
    const executions = await this.getExecutions(
      undefined,
      undefined,
      { start: new Date(0), end: olderThan }
    );

    const events = await this.getEvents(
      undefined,
      undefined,
      { start: new Date(0), end: olderThan }
    );

    const relationships = await this.getRelationships();
    const oldRelationships = relationships.filter(
      rel => rel.validFrom < olderThan && (!rel.validTo || rel.validTo < olderThan)
    );

    // Create archive data
    const archiveData = {
      type: archiveType,
      timestamp,
      dateRange: { start: new Date(0), end: olderThan },
      executions,
      events,
      relationships: oldRelationships
    };

    const originalData = Buffer.from(JSON.stringify(archiveData));
    const compressedData = await gzip(originalData, { level: 9 }); // Max compression for archives

    const checksum = crypto.createHash('sha256').update(originalData).digest('hex');
    const recordCount = executions.length + events.length + oldRelationships.length;

    // Store archive metadata
    const archivalRecord: ArchivalRecord = {
      archiveId,
      timestamp,
      type: archiveType,
      dateRange: { start: new Date(0), end: olderThan },
      location: `archive://${archiveId}`,
      size: compressedData.length,
      metadata: {
        recordCount,
        compressionRatio: compressedData.length / originalData.length,
        checksum
      }
    };

    if (this.config.enablePersistence && this.db) {
      // Store archive
      const query = `
        INSERT INTO data_archives (
          archive_id, timestamp, type, date_range_start, date_range_end,
          location, size, metadata, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(query, [
        archiveId,
        timestamp,
        archiveType,
        archivalRecord.dateRange.start,
        archivalRecord.dateRange.end,
        archivalRecord.location,
        archivalRecord.size,
        JSON.stringify(archivalRecord.metadata),
        compressedData
      ]);

      // Remove archived data from main tables if this is cold storage
      if (archiveType === 'cold_storage') {
        await this.db.transaction(async () => {
          await this.db!.execute('DELETE FROM test_executions WHERE timestamp < ?', [olderThan]);
          await this.db!.execute('DELETE FROM test_events WHERE timestamp < ?', [olderThan]);
          await this.db!.execute(
            'DELETE FROM test_relationships WHERE valid_from < ? AND (valid_to IS NULL OR valid_to < ?)',
            [olderThan, olderThan]
          );
        });
      }
    }

    return archivalRecord;
  }

  /**
   * Export data
   */
  async exportData(
    format: ExportFormat,
    filters?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
      dataTypes?: Array<'executions' | 'events' | 'relationships'>;
    }
  ): Promise<Buffer> {
    const dataTypes = filters?.dataTypes || ['executions', 'events', 'relationships'];
    const exportData: any = {};

    if (dataTypes.includes('executions')) {
      exportData.executions = await this.getExecutions(
        undefined,
        undefined,
        filters?.dateRange
      );

      if (filters?.testIds) {
        exportData.executions = exportData.executions.filter(
          (exec: TestExecutionRecord) => filters.testIds!.includes(exec.testId)
        );
      }
    }

    if (dataTypes.includes('events')) {
      exportData.events = await this.getEvents(
        undefined,
        undefined,
        filters?.dateRange
      );

      if (filters?.testIds) {
        exportData.events = exportData.events.filter(
          (event: TestEvolutionEvent) => filters.testIds!.includes(event.testId)
        );
      }
    }

    if (dataTypes.includes('relationships')) {
      exportData.relationships = await this.getRelationships();

      if (filters?.testIds) {
        exportData.relationships = exportData.relationships.filter(
          (rel: TestRelationship) => filters.testIds!.includes(rel.testId)
        );
      }
    }

    if (format.includeMetadata) {
      exportData.metadata = {
        exportTimestamp: new Date(),
        format,
        filters,
        recordCounts: {
          executions: exportData.executions?.length || 0,
          events: exportData.events?.length || 0,
          relationships: exportData.relationships?.length || 0
        }
      };
    }

    let serializedData: Buffer;

    switch (format.format) {
      case 'json':
        serializedData = Buffer.from(JSON.stringify(exportData, null, 2));
        break;

      case 'csv':
        serializedData = Buffer.from(this.convertToCSV(exportData));
        break;

      case 'binary':
        serializedData = this.serializeToBinary(exportData);
        break;

      default:
        throw new Error(`Unsupported export format: ${format.format}`);
    }

    // Apply compression if requested
    if (format.compress) {
      serializedData = await gzip(serializedData, { level: this.config.compressionLevel });
    }

    // Apply encryption if requested
    if (format.encryption?.enabled && format.encryption.key) {
      serializedData = this.encryptData(serializedData, format.encryption.key, format.encryption.algorithm);
    }

    return serializedData;
  }

  /**
   * Import data
   */
  async importData(
    data: Buffer,
    format: ExportFormat,
    options: {
      overwrite?: boolean;
      validate?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const importId = `import_${Date.now()}`;
    const startTime = Date.now();
    const errors: Array<{ record: number; error: string; details?: any }> = [];

    let processedData = data;

    try {
      // Decrypt if needed
      if (format.encryption?.enabled && format.encryption.key) {
        processedData = this.decryptData(processedData, format.encryption.key, format.encryption.algorithm);
      }

      // Decompress if needed
      if (format.compress) {
        processedData = await gunzip(processedData);
      }

      // Parse data based on format
      let importData: any;

      switch (format.format) {
        case 'json':
          importData = JSON.parse(processedData.toString());
          break;

        case 'csv':
          importData = this.parseCSV(processedData.toString());
          break;

        case 'binary':
          importData = this.deserializeFromBinary(processedData);
          break;

        default:
          throw new Error(`Unsupported import format: ${format.format}`);
      }

      // Validate data if requested
      if (options.validate) {
        const validationErrors = this.validateImportData(importData);
        errors.push(...validationErrors);

        if (validationErrors.length > 0 && !options.dryRun) {
          throw new Error(`Validation failed with ${validationErrors.length} errors`);
        }
      }

      let recordsProcessed = 0;
      let recordsImported = 0;

      if (!options.dryRun && this.config.enablePersistence && this.db) {
        await this.db.transaction(async () => {
          // Import executions
          if (importData.executions) {
            for (const [index, execution] of importData.executions.entries()) {
              try {
                recordsProcessed++;
                await this.storeExecution(execution);
                recordsImported++;
              } catch (error) {
                errors.push({
                  record: index,
                  error: `Failed to import execution: ${error}`,
                  details: execution
                });
              }
            }
          }

          // Import events
          if (importData.events) {
            for (const [index, event] of importData.events.entries()) {
              try {
                recordsProcessed++;
                await this.storeEvent(event);
                recordsImported++;
              } catch (error) {
                errors.push({
                  record: index,
                  error: `Failed to import event: ${error}`,
                  details: event
                });
              }
            }
          }

          // Import relationships
          if (importData.relationships) {
            for (const [index, relationship] of importData.relationships.entries()) {
              try {
                recordsProcessed++;
                await this.storeRelationship(relationship);
                recordsImported++;
              } catch (error) {
                errors.push({
                  record: index,
                  error: `Failed to import relationship: ${error}`,
                  details: relationship
                });
              }
            }
          }
        });
      } else {
        // Dry run - just count records
        recordsProcessed = (importData.executions?.length || 0) +
                          (importData.events?.length || 0) +
                          (importData.relationships?.length || 0);
        recordsImported = recordsProcessed; // Assume all would be imported in dry run
      }

      const duration = Date.now() - startTime;
      const status = errors.length === 0 ? 'success' :
                    recordsImported > 0 ? 'partial' : 'failed';

      return {
        importId,
        timestamp: new Date(),
        status,
        recordsProcessed,
        recordsImported,
        errors,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        importId,
        timestamp: new Date(),
        status: 'failed',
        recordsProcessed: 0,
        recordsImported: 0,
        errors: [{
          record: -1,
          error: `Import failed: ${error}`,
          details: error
        }],
        duration
      };
    }
  }

  /**
   * Perform data integrity check
   */
  async checkDataIntegrity(
    scope?: {
      testIds?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<DataIntegrityCheck> {
    const checkId = `integrity_check_${Date.now()}`;
    const timestamp = new Date();
    const issues: Array<{
      type: 'corruption' | 'missing' | 'inconsistent' | 'duplicate';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      affectedRecords: number;
      recommendedAction: string;
    }> = [];

    let totalRecords = 0;
    let validRecords = 0;
    let corruptedRecords = 0;
    const missingRecords = 0;

    try {
      // Check executions
      const executions = await this.getExecutions(
        undefined,
        undefined,
        scope?.dateRange
      );

      totalRecords += executions.length;

      for (const execution of executions) {
        if (scope?.testIds && !scope.testIds.includes(execution.testId)) continue;

        try {
          // Validate execution structure
          if (!execution.executionId || !execution.testId || !execution.timestamp) {
            corruptedRecords++;
            issues.push({
              type: 'corruption',
              severity: 'high',
              description: `Execution record missing required fields: ${execution.executionId}`,
              affectedRecords: 1,
              recommendedAction: 'Remove or repair corrupted record'
            });
          } else {
            validRecords++;
          }
        } catch (error) {
          corruptedRecords++;
          issues.push({
            type: 'corruption',
            severity: 'critical',
            description: `Failed to validate execution: ${error}`,
            affectedRecords: 1,
            recommendedAction: 'Investigate and repair data corruption'
          });
        }
      }

      // Check for duplicate executions
      const executionIds = executions.map(e => e.executionId);
      const duplicateExecutions = executionIds.filter(
        (id, index) => executionIds.indexOf(id) !== index
      );

      if (duplicateExecutions.length > 0) {
        issues.push({
          type: 'duplicate',
          severity: 'medium',
          description: `Found ${duplicateExecutions.length} duplicate execution records`,
          affectedRecords: duplicateExecutions.length,
          recommendedAction: 'Remove duplicate records'
        });
      }

      // Check events
      const events = await this.getEvents(
        undefined,
        undefined,
        scope?.dateRange
      );

      totalRecords += events.length;

      for (const event of events) {
        if (scope?.testIds && !scope.testIds.includes(event.testId)) continue;

        try {
          if (!event.eventId || !event.testId || !event.timestamp || !event.type) {
            corruptedRecords++;
            issues.push({
              type: 'corruption',
              severity: 'high',
              description: `Event record missing required fields: ${event.eventId}`,
              affectedRecords: 1,
              recommendedAction: 'Remove or repair corrupted record'
            });
          } else {
            validRecords++;
          }
        } catch (error) {
          corruptedRecords++;
        }
      }

      // Check relationships
      const relationships = await this.getRelationships();
      totalRecords += relationships.length;

      for (const relationship of relationships) {
        if (scope?.testIds && !scope.testIds.includes(relationship.testId)) continue;

        try {
          if (!relationship.relationshipId || !relationship.testId || !relationship.entityId) {
            corruptedRecords++;
            issues.push({
              type: 'corruption',
              severity: 'high',
              description: `Relationship record missing required fields: ${relationship.relationshipId}`,
              affectedRecords: 1,
              recommendedAction: 'Remove or repair corrupted record'
            });
          } else {
            validRecords++;
          }
        } catch (error) {
          corruptedRecords++;
        }
      }

      // Check for orphaned relationships (relationships without corresponding executions)
      const testIds = new Set(executions.map(e => e.testId));
      const orphanedRelationships = relationships.filter(
        rel => !testIds.has(rel.testId)
      );

      if (orphanedRelationships.length > 0) {
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          description: `Found ${orphanedRelationships.length} orphaned relationships`,
          affectedRecords: orphanedRelationships.length,
          recommendedAction: 'Review and clean up orphaned relationships'
        });
      }

    } catch (error) {
      issues.push({
        type: 'corruption',
        severity: 'critical',
        description: `Integrity check failed: ${error}`,
        affectedRecords: totalRecords,
        recommendedAction: 'Investigate system-wide data corruption'
      });
    }

    const status = issues.length === 0 ? 'passed' :
                  issues.some(i => i.severity === 'critical') ? 'failed' : 'warning';

    return {
      checkId,
      timestamp,
      status,
      issues,
      statistics: {
        totalRecords,
        validRecords,
        corruptedRecords,
        missingRecords
      }
    };
  }

  /**
   * Cleanup old data based on retention policies
   */
  async cleanupOldData(): Promise<{
    deletedExecutions: number;
    deletedEvents: number;
    deletedRelationships: number;
    deletedSnapshots: number;
  }> {
    if (!this.config.enablePersistence || !this.db) {
      return {
        deletedExecutions: 0,
        deletedEvents: 0,
        deletedRelationships: 0,
        deletedSnapshots: 0
      };
    }

    const now = new Date();
    const executionCutoff = new Date(now.getTime() - this.config.retentionPolicies.executions * 24 * 60 * 60 * 1000);
    const eventCutoff = new Date(now.getTime() - this.config.retentionPolicies.events * 24 * 60 * 60 * 1000);
    const relationshipCutoff = new Date(now.getTime() - this.config.retentionPolicies.relationships * 24 * 60 * 60 * 1000);
    const snapshotCutoff = new Date(now.getTime() - this.config.retentionPolicies.snapshots * 24 * 60 * 60 * 1000);

    const deletedExecutions = await this.db.execute(
      'DELETE FROM test_executions WHERE timestamp < ?',
      [executionCutoff]
    );

    const deletedEvents = await this.db.execute(
      'DELETE FROM test_events WHERE timestamp < ?',
      [eventCutoff]
    );

    const deletedRelationships = await this.db.execute(
      'DELETE FROM test_relationships WHERE valid_from < ? AND NOT active',
      [relationshipCutoff]
    );

    const deletedSnapshots = await this.db.execute(
      'DELETE FROM data_snapshots WHERE timestamp < ?',
      [snapshotCutoff]
    );

    return {
      deletedExecutions: deletedExecutions.affectedRows || 0,
      deletedEvents: deletedEvents.affectedRows || 0,
      deletedRelationships: deletedRelationships.affectedRows || 0,
      deletedSnapshots: deletedSnapshots.affectedRows || 0
    };
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<{
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
  }> {
    if (!this.config.enablePersistence || !this.db) {
      return {
        totalSize: 0,
        compressedSize: 0,
        recordCounts: {
          executions: 0,
          events: 0,
          relationships: 0,
          snapshots: 0,
          archives: 0
        },
        compressionRatio: 1,
        oldestRecord: new Date(),
        newestRecord: new Date()
      };
    }

    // Get record counts and sizes
    const executionStats = await this.db.query(`
      SELECT COUNT(*) as count, SUM(original_size) as original_size, SUM(compressed_size) as compressed_size,
             MIN(timestamp) as oldest, MAX(timestamp) as newest
      FROM test_executions
    `);

    const eventStats = await this.db.query(`
      SELECT COUNT(*) as count, SUM(original_size) as original_size, SUM(compressed_size) as compressed_size,
             MIN(timestamp) as oldest, MAX(timestamp) as newest
      FROM test_events
    `);

    const relationshipStats = await this.db.query(`
      SELECT COUNT(*) as count, SUM(original_size) as original_size, SUM(compressed_size) as compressed_size,
             MIN(valid_from) as oldest, MAX(valid_from) as newest
      FROM test_relationships
    `);

    const snapshotStats = await this.db.query(`
      SELECT COUNT(*) as count, SUM(original_size) as original_size, SUM(compressed_size) as compressed_size
      FROM data_snapshots
    `);

    const archiveStats = await this.db.query(`
      SELECT COUNT(*) as count
      FROM data_archives
    `);

    const totalOriginalSize = (executionStats[0]?.original_size || 0) +
                             (eventStats[0]?.original_size || 0) +
                             (relationshipStats[0]?.original_size || 0) +
                             (snapshotStats[0]?.original_size || 0);

    const totalCompressedSize = (executionStats[0]?.compressed_size || 0) +
                               (eventStats[0]?.compressed_size || 0) +
                               (relationshipStats[0]?.compressed_size || 0) +
                               (snapshotStats[0]?.compressed_size || 0);

    const timestamps = [
      executionStats[0]?.oldest,
      eventStats[0]?.oldest,
      relationshipStats[0]?.oldest
    ].filter(Boolean).map(ts => new Date(ts));

    const newestTimestamps = [
      executionStats[0]?.newest,
      eventStats[0]?.newest,
      relationshipStats[0]?.newest
    ].filter(Boolean).map(ts => new Date(ts));

    return {
      totalSize: totalOriginalSize,
      compressedSize: totalCompressedSize,
      recordCounts: {
        executions: executionStats[0]?.count || 0,
        events: eventStats[0]?.count || 0,
        relationships: relationshipStats[0]?.count || 0,
        snapshots: snapshotStats[0]?.count || 0,
        archives: archiveStats[0]?.count || 0
      },
      compressionRatio: totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1,
      oldestRecord: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : new Date(),
      newestRecord: newestTimestamps.length > 0 ? new Date(Math.max(...newestTimestamps.map(t => t.getTime()))) : new Date()
    };
  }

  // Public compression utilities for testing

  /**
   * Compress data with metadata
   */
  async compressData(data: any): Promise<{
    data: Buffer;
    size: number;
    compressionRatio: number;
    metadata: {
      originalSize: number;
      compressedSize: number;
      algorithm: string;
    };
  }> {
    const jsonData = Buffer.from(JSON.stringify(data));
    const compressed = await gzip(jsonData, { level: this.config.compressionLevel });

    return {
      data: compressed,
      size: compressed.length,
      compressionRatio: jsonData.length / compressed.length, // Fixed: originalSize / compressedSize
      metadata: {
        originalSize: jsonData.length,
        compressedSize: compressed.length,
        algorithm: 'gzip'
      }
    };
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData: { data: Buffer }): Promise<any> {
    const jsonData = await gunzip(compressedData.data);
    const parsed = JSON.parse(jsonData.toString());
    return this.reconstructDates(parsed);
  }

  /**
   * Batch compress multiple data sets
   */
  async batchCompress(dataSets: any[]): Promise<Array<{
    success: boolean;
    compressionRatio: number;
    originalSize: number;
    compressedSize: number;
  }>> {
    const results: Array<{
      success: boolean;
      compressionRatio: number;
      originalSize: number;
      compressedSize: number;
    }> = [];

    for (const data of dataSets) {
      try {
        const compressed = await this.compressData(data);
        results.push({
          success: true,
          compressionRatio: compressed.compressionRatio,
          originalSize: compressed.metadata.originalSize,
          compressedSize: compressed.metadata.compressedSize
        });
      } catch (error) {
        results.push({
          success: false,
          compressionRatio: 1,
          originalSize: 0,
          compressedSize: 0
        });
      }
    }

    return results;
  }

  /**
   * Optimize storage with retention policies
   */
  async optimizeStorage(
    data: TestExecutionRecord[],
    policy: {
      retentionDays: number;
      compressionAfterDays: number;
      archiveAfterDays: number;
    }
  ): Promise<{
    retained: TestExecutionRecord[];
    compressed: TestExecutionRecord[];
    archived: TestExecutionRecord[];
    spaceFreed: number;
  }> {
    const now = new Date();
    const retentionCutoff = new Date(now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000);
    const compressionCutoff = new Date(now.getTime() - policy.compressionAfterDays * 24 * 60 * 60 * 1000);
    const archiveCutoff = new Date(now.getTime() - policy.archiveAfterDays * 24 * 60 * 60 * 1000);

    const retained = data.filter(exec => exec.timestamp >= retentionCutoff);
    const toCompress = data.filter(exec =>
      exec.timestamp < compressionCutoff && exec.timestamp >= retentionCutoff
    );
    const toArchive = data.filter(exec =>
      exec.timestamp < archiveCutoff
    );

    const originalSize = JSON.stringify(data).length;
    const retainedSize = JSON.stringify(retained).length;
    const spaceFreed = originalSize - retainedSize;

    return {
      retained,
      compressed: toCompress,
      archived: toArchive,
      spaceFreed
    };
  }

  // Private helper methods

  private async compressDataInternal(data: any): Promise<Buffer> {
    const jsonData = Buffer.from(JSON.stringify(data));
    return await gzip(jsonData, { level: this.config.compressionLevel });
  }

  private reconstructDates(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.reconstructDates(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if the value looks like an ISO date string
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
        result[key] = new Date(value);
      } else if (typeof value === 'object') {
        result[key] = this.reconstructDates(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async decompressDataInternal(compressedData: Buffer): Promise<any> {
    const jsonData = await gunzip(compressedData);
    const parsed = JSON.parse(jsonData.toString());
    return this.reconstructDates(parsed);
  }

  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Convert executions
    if (data.executions && data.executions.length > 0) {
      lines.push('# Executions');
      const headers = Object.keys(data.executions[0]);
      lines.push(headers.join(','));

      for (const execution of data.executions) {
        const values = headers.map(header => {
          const value = execution[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        lines.push(values.join(','));
      }
      lines.push('');
    }

    // Convert events
    if (data.events && data.events.length > 0) {
      lines.push('# Events');
      const headers = Object.keys(data.events[0]);
      lines.push(headers.join(','));

      for (const event of data.events) {
        const values = headers.map(header => {
          const value = event[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        lines.push(values.join(','));
      }
      lines.push('');
    }

    // Convert relationships
    if (data.relationships && data.relationships.length > 0) {
      lines.push('# Relationships');
      const headers = Object.keys(data.relationships[0]);
      lines.push(headers.join(','));

      for (const relationship of data.relationships) {
        const values = headers.map(header => {
          const value = relationship[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        lines.push(values.join(','));
      }
    }

    return lines.join('\n');
  }

  private parseCSV(csvData: string): any {
    // Basic CSV parsing - in production would use a proper CSV library
    const lines = csvData.split('\n');
    const result: any = {};

    let currentSection = '';
    let headers: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        currentSection = line.substring(2).toLowerCase();
        result[currentSection] = [];
        headers = [];
        continue;
      }

      if (headers.length === 0 && line.trim()) {
        headers = line.split(',');
        continue;
      }

      if (line.trim() && currentSection) {
        const values = line.split(',');
        const record: any = {};

        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        result[currentSection].push(record);
      }
    }

    return result;
  }

  private serializeToBinary(data: any): Buffer {
    // Simple binary serialization - in production would use a proper format like Protocol Buffers
    return Buffer.from(JSON.stringify(data));
  }

  private deserializeFromBinary(data: Buffer): any {
    return JSON.parse(data.toString());
  }

  private encryptData(data: Buffer, key: string, algorithm: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
  }

  private decryptData(data: Buffer, key: string, algorithm: string): Buffer {
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private validateImportData(data: any): Array<{ record: number; error: string; details?: any }> {
    const errors: Array<{ record: number; error: string; details?: any }> = [];

    // Validate executions
    if (data.executions) {
      data.executions.forEach((execution: any, index: number) => {
        if (!execution.executionId) {
          errors.push({
            record: index,
            error: 'Missing executionId',
            details: execution
          });
        }

        if (!execution.testId) {
          errors.push({
            record: index,
            error: 'Missing testId',
            details: execution
          });
        }

        if (!execution.timestamp) {
          errors.push({
            record: index,
            error: 'Missing timestamp',
            details: execution
          });
        }
      });
    }

    // Validate events
    if (data.events) {
      data.events.forEach((event: any, index: number) => {
        if (!event.eventId) {
          errors.push({
            record: index,
            error: 'Missing eventId',
            details: event
          });
        }

        if (!event.type) {
          errors.push({
            record: index,
            error: 'Missing event type',
            details: event
          });
        }
      });
    }

    // Validate relationships
    if (data.relationships) {
      data.relationships.forEach((relationship: any, index: number) => {
        if (!relationship.relationshipId) {
          errors.push({
            record: index,
            error: 'Missing relationshipId',
            details: relationship
          });
        }

        if (!relationship.type) {
          errors.push({
            record: index,
            error: 'Missing relationship type',
            details: relationship
          });
        }
      });
    }

    return errors;
  }
}
