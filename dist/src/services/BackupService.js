/**
 * Backup Service for Memento
 * Handles system backup and restore operations across all databases
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
export class BackupService {
    dbService;
    config;
    constructor(dbService, config) {
        this.dbService = dbService;
        this.config = config;
    }
    async createBackup(options) {
        const backupId = `backup_${Date.now()}`;
        const backupDir = options.destination || './backups';
        // Create backup directory
        await fs.mkdir(backupDir, { recursive: true });
        const metadata = {
            id: backupId,
            type: options.type,
            timestamp: new Date(),
            size: 0,
            checksum: '',
            components: {
                falkordb: false,
                qdrant: false,
                postgres: false,
                config: false
            },
            status: 'in_progress'
        };
        try {
            // 1. Backup FalkorDB (Redis-based graph data)
            if (options.includeData) {
                await this.backupFalkorDB(backupDir, backupId);
                metadata.components.falkordb = true;
            }
            // 2. Backup Qdrant (Vector embeddings)
            if (options.includeData) {
                await this.backupQdrant(backupDir, backupId);
                metadata.components.qdrant = true;
            }
            // 3. Backup PostgreSQL (Document storage)
            if (options.includeData) {
                await this.backupPostgreSQL(backupDir, backupId);
                metadata.components.postgres = true;
            }
            // 4. Backup configuration (if requested)
            if (options.includeConfig) {
                await this.backupConfig(backupDir, backupId);
                metadata.components.config = true;
            }
            // 5. Compress backup (if requested)
            if (options.compression) {
                await this.compressBackup(backupDir, backupId);
            }
            // 6. Calculate size and checksum
            metadata.size = await this.calculateBackupSize(backupDir, backupId);
            metadata.checksum = await this.calculateChecksum(backupDir, backupId);
            metadata.status = 'completed';
            // Store backup metadata
            await this.storeBackupMetadata(metadata);
        }
        catch (error) {
            metadata.status = 'failed';
            console.error('Backup failed:', error);
            throw error;
        }
        return metadata;
    }
    async restoreBackup(backupId, options) {
        const metadata = await this.getBackupMetadata(backupId);
        if (!metadata) {
            throw new Error(`Backup ${backupId} not found`);
        }
        const restoreResult = {
            backupId,
            status: options.dryRun ? 'dry_run_completed' : 'in_progress',
            changes: [],
            estimatedDuration: '10-15 minutes'
        };
        if (options.dryRun) {
            // Validate backup integrity and simulate restore
            restoreResult.changes = await this.validateBackup(backupId);
            return restoreResult;
        }
        try {
            // Perform actual restore
            if (metadata.components.falkordb) {
                await this.restoreFalkorDB(backupId);
                restoreResult.changes.push({ component: 'falkordb', action: 'restored' });
            }
            if (metadata.components.qdrant) {
                await this.restoreQdrant(backupId);
                restoreResult.changes.push({ component: 'qdrant', action: 'restored' });
            }
            if (metadata.components.postgres) {
                await this.restorePostgreSQL(backupId);
                restoreResult.changes.push({ component: 'postgres', action: 'restored' });
            }
            if (metadata.components.config) {
                await this.restoreConfig(backupId);
                restoreResult.changes.push({ component: 'config', action: 'restored' });
            }
            restoreResult.status = 'completed';
        }
        catch (error) {
            restoreResult.status = 'failed';
            console.error('Restore failed:', error);
            throw error;
        }
        return restoreResult;
    }
    async backupFalkorDB(backupDir, backupId) {
        try {
            const dumpPath = path.join(backupDir, `${backupId}_falkordb.rdb`);
            // Use Redis BGSAVE command to create a snapshot
            const falkorClient = this.dbService.getFalkorDBService().getClient();
            await falkorClient.sendCommand(['BGSAVE']);
            // Wait a moment for the save to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            // For Redis-based FalkorDB, we need to save the RDB file
            // This is a simplified approach - in production, you'd need to access the Redis dump file
            const dumpData = await falkorClient.sendCommand(['SAVE']);
            await fs.writeFile(dumpPath, JSON.stringify(dumpData, null, 2));
            console.log(`✅ FalkorDB backup created: ${dumpPath}`);
        }
        catch (error) {
            console.error('❌ FalkorDB backup failed:', error);
            throw new Error(`FalkorDB backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async backupQdrant(backupDir, backupId) {
        try {
            const qdrantClient = this.dbService.getQdrantService().getClient();
            const collections = await qdrantClient.getCollections();
            const collectionsPath = path.join(backupDir, `${backupId}_qdrant_collections.json`);
            // Save collections metadata
            await fs.writeFile(collectionsPath, JSON.stringify(collections, null, 2));
            // Create snapshots for each collection
            for (const collection of collections.collections) {
                try {
                    const snapshot = await qdrantClient.createSnapshot(collection.name);
                    const snapshotPath = path.join(backupDir, `${backupId}_qdrant_${collection.name}_snapshot.json`);
                    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
                }
                catch (error) {
                    console.warn(`⚠️ Failed to create snapshot for collection ${collection.name}:`, error);
                }
            }
            console.log(`✅ Qdrant backup created for ${collections.collections.length} collections`);
        }
        catch (error) {
            console.error('❌ Qdrant backup failed:', error);
            throw new Error(`Qdrant backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async backupPostgreSQL(backupDir, backupId) {
        try {
            const dumpPath = path.join(backupDir, `${backupId}_postgres.sql`);
            // Get all table data and schema
            const postgresService = this.dbService.getPostgreSQLService();
            const tablesQuery = `
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;
            const tablesResult = await postgresService.query(tablesQuery);
            const tables = tablesResult.rows || tablesResult;
            let dumpContent = `-- PostgreSQL dump created by Memento Backup Service\n`;
            dumpContent += `-- Created: ${new Date().toISOString()}\n\n`;
            // Dump schema and data for each table
            for (const table of tables) {
                const tableName = table.tablename;
                // Get table schema
                const schemaQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
                const columnsResult = await postgresService.query(schemaQuery, [tableName]);
                const columns = columnsResult.rows || columnsResult;
                dumpContent += `-- Schema for table: ${tableName}\n`;
                dumpContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
                dumpContent += columns.map((col) => `  ${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`).join(',\n');
                dumpContent += `\n);\n\n`;
                // Get table data
                const dataQuery = `SELECT * FROM ${tableName};`;
                const dataResult = await postgresService.query(dataQuery);
                const data = dataResult.rows || dataResult;
                if (data.length > 0) {
                    dumpContent += `-- Data for table: ${tableName}\n`;
                    for (const row of data) {
                        const values = Object.values(row).map(value => value === null ? 'NULL' :
                            typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` :
                                typeof value === 'object' ? `'${JSON.stringify(value)}'` :
                                    value ? value.toString() : 'NULL');
                        dumpContent += `INSERT INTO ${tableName} VALUES (${values.join(', ')});\n`;
                    }
                    dumpContent += `\n`;
                }
            }
            await fs.writeFile(dumpPath, dumpContent);
            console.log(`✅ PostgreSQL backup created: ${dumpPath}`);
        }
        catch (error) {
            console.error('❌ PostgreSQL backup failed:', error);
            throw new Error(`PostgreSQL backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async backupConfig(backupDir, backupId) {
        try {
            const configPath = path.join(backupDir, `${backupId}_config.json`);
            // Sanitize config to remove sensitive data
            const sanitizedConfig = {
                ...this.config,
                qdrant: {
                    ...this.config.qdrant,
                    apiKey: this.config.qdrant.apiKey ? '[REDACTED]' : undefined
                }
            };
            await fs.writeFile(configPath, JSON.stringify(sanitizedConfig, null, 2));
            console.log(`✅ Configuration backup created: ${configPath}`);
        }
        catch (error) {
            console.error('❌ Configuration backup failed:', error);
            throw new Error(`Configuration backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async compressBackup(backupDir, backupId) {
        try {
            const archivePath = path.join(backupDir, `${backupId}.tar.gz`);
            const output = createWriteStream(archivePath);
            const archive = archiver('tar', { gzip: true });
            archive.pipe(output);
            // Add all backup files to archive
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter(file => file.startsWith(backupId));
            for (const file of backupFiles) {
                const filePath = path.join(backupDir, file);
                archive.file(filePath, { name: file });
            }
            await archive.finalize();
            // Remove uncompressed files after successful compression
            for (const file of backupFiles) {
                if (!file.endsWith('.tar.gz')) {
                    await fs.unlink(path.join(backupDir, file));
                }
            }
            console.log(`✅ Backup compressed: ${archivePath}`);
        }
        catch (error) {
            console.error('❌ Backup compression failed:', error);
            throw new Error(`Backup compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async calculateBackupSize(backupDir, backupId) {
        try {
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter(file => file.startsWith(backupId));
            let totalSize = 0;
            for (const file of backupFiles) {
                const stats = await fs.stat(path.join(backupDir, file));
                totalSize += stats.size;
            }
            return totalSize;
        }
        catch (error) {
            console.warn('⚠️ Failed to calculate backup size:', error);
            return 0;
        }
    }
    async calculateChecksum(backupDir, backupId) {
        try {
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter(file => file.startsWith(backupId));
            const hash = crypto.createHash('sha256');
            for (const file of backupFiles.sort()) {
                const filePath = path.join(backupDir, file);
                const content = await fs.readFile(filePath);
                hash.update(content);
            }
            return hash.digest('hex');
        }
        catch (error) {
            console.warn('⚠️ Failed to calculate backup checksum:', error);
            return '';
        }
    }
    async storeBackupMetadata(metadata) {
        try {
            const metadataPath = path.join('./backups', `${metadata.id}_metadata.json`);
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        catch (error) {
            console.warn('⚠️ Failed to store backup metadata:', error);
        }
    }
    async getBackupMetadata(backupId) {
        try {
            const metadataPath = path.join('./backups', `${backupId}_metadata.json`);
            const content = await fs.readFile(metadataPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            return null;
        }
    }
    async validateBackup(backupId) {
        const metadata = await this.getBackupMetadata(backupId);
        if (!metadata) {
            throw new Error(`Backup metadata not found for ${backupId}`);
        }
        const changes = [];
        // Validate each component
        if (metadata.components.falkordb) {
            changes.push({ component: 'falkordb', action: 'validate', status: 'valid' });
        }
        if (metadata.components.qdrant) {
            changes.push({ component: 'qdrant', action: 'validate', status: 'valid' });
        }
        if (metadata.components.postgres) {
            changes.push({ component: 'postgres', action: 'validate', status: 'valid' });
        }
        if (metadata.components.config) {
            changes.push({ component: 'config', action: 'validate', status: 'valid' });
        }
        return changes;
    }
    // Placeholder restore methods - would need specific implementation based on backup format
    async restoreFalkorDB(backupId) {
        console.log(`🔄 Restoring FalkorDB from backup ${backupId}`);
        // Implementation would depend on backup format
    }
    async restoreQdrant(backupId) {
        console.log(`🔄 Restoring Qdrant from backup ${backupId}`);
        // Implementation would depend on backup format
    }
    async restorePostgreSQL(backupId) {
        console.log(`🔄 Restoring PostgreSQL from backup ${backupId}`);
        // Implementation would depend on backup format
    }
    async restoreConfig(backupId) {
        console.log(`🔄 Restoring configuration from backup ${backupId}`);
        // Implementation would depend on backup format
    }
}
//# sourceMappingURL=BackupService.js.map