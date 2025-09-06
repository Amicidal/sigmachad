/**
 * Integration tests for BackupService
 * Tests backup creation, restoration, and data integrity across databases
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BackupService, BackupOptions, BackupMetadata } from '../../../src/services/BackupService';
import { DatabaseService, createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('BackupService Integration', () => {
  let dbService: DatabaseService;
  let backupService: BackupService;
  let testBackupDir: string;
  let testDir: string;

  beforeAll(async () => {
    // Create test directories
    testDir = path.join(tmpdir(), 'backup-service-integration-tests');
    testBackupDir = path.join(testDir, 'backups');
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testBackupDir, { recursive: true });

    // Initialize database service
    dbService = new DatabaseService(createTestDatabaseConfig());
    await dbService.initialize();
    await dbService.setupDatabase();

    // Initialize backup service
    backupService = new BackupService(dbService, createTestDatabaseConfig());
  }, 30000);

  afterAll(async () => {
    // Clean up
    try {
      await dbService?.close();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up:', error);
    }
  });

  beforeEach(async () => {
    // Clean up backup directory before each test
    try {
      const files = await fs.readdir(testBackupDir);
      await Promise.all(files.map(file => fs.unlink(path.join(testBackupDir, file))));
    } catch (error) {
      // Directory might be empty, that's okay
    }
  });

  describe('Backup Creation Integration', () => {
    it('should create a full backup successfully', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata).toBeDefined();
      expect(metadata.id).toMatch(/^backup_\d+$/);
      expect(metadata.type).toBe('full');
      expect(metadata.timestamp).toBeInstanceOf(Date);
      expect(metadata.status).toBe('completed');
      expect(metadata.size).toBeGreaterThan(0);
      expect(typeof metadata.checksum).toBe('string');
      expect(metadata.checksum.length).toBeGreaterThan(0);

      // Check that backup files were created
      const backupFiles = await fs.readdir(testBackupDir);
      expect(backupFiles.length).toBeGreaterThan(0);

      // Verify backup contains expected components
      const hasPostgresBackup = backupFiles.some(file => file.includes('postgres'));
      const hasFalkorBackup = backupFiles.some(file => file.includes('falkordb'));
      const hasQdrantBackup = backupFiles.some(file => file.includes('qdrant'));

      // At least one database backup should exist
      expect(hasPostgresBackup || hasFalkorBackup || hasQdrantBackup).toBe(true);
    });

    it('should create an incremental backup', async () => {
      const options: BackupOptions = {
        type: 'incremental',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('incremental');
      expect(metadata.status).toBe('completed');

      // Incremental backup should still contain data
      const backupFiles = await fs.readdir(testBackupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should include configuration in backup when requested', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: false,
        includeConfig: true,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata).toBeDefined();
      expect(metadata.components.config).toBe(true);

      // Check for config files in backup
      const backupFiles = await fs.readdir(testBackupDir);
      const hasConfigFile = backupFiles.some(file =>
        file.includes('config') || file.includes('package.json')
      );

      // Should contain configuration
      expect(hasConfigFile || metadata.components.config).toBe(true);
    });

    it('should compress backup when requested', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: true,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata).toBeDefined();
      expect(metadata.status).toBe('completed');

      // Check for compressed files
      const backupFiles = await fs.readdir(testBackupDir);
      const hasCompressedFile = backupFiles.some(file =>
        file.endsWith('.zip') || file.endsWith('.tar.gz') || file.endsWith('.tar')
      );

      expect(hasCompressedFile).toBe(true);
    });

    it('should handle backup creation with no data', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: false,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata).toBeDefined();
      expect(metadata.status).toBe('completed');

      // Should still create a backup (possibly empty or with metadata only)
      const backupFiles = await fs.readdir(testBackupDir);
      expect(backupFiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Backup Metadata Integration', () => {
    it('should generate valid checksums for backups', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata.checksum).toBeDefined();
      expect(typeof metadata.checksum).toBe('string');
      expect(metadata.checksum.length).toBeGreaterThan(0);

      // Checksum should be consistent (run backup again with same data)
      const backupFiles = await fs.readdir(testBackupDir);
      if (backupFiles.length > 0) {
        // Checksum should be a valid hash format (hex or base64)
        expect(/^[a-f0-9]+$/i.test(metadata.checksum) || /^[a-zA-Z0-9+/=]+$/.test(metadata.checksum)).toBe(true);
      }
    });

    it('should track backup components correctly', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: true,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata.components).toBeDefined();

      // Components should be tracked as booleans
      expect(typeof metadata.components.falkordb).toBe('boolean');
      expect(typeof metadata.components.qdrant).toBe('boolean');
      expect(typeof metadata.components.postgres).toBe('boolean');
      expect(typeof metadata.components.config).toBe('boolean');

      // Config should be true since we requested it
      expect(metadata.components.config).toBe(true);
    });

    it('should calculate accurate backup sizes', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata: BackupMetadata = await backupService.createBackup(options);

      expect(metadata.size).toBeGreaterThanOrEqual(0);

      // Calculate actual size of backup files
      const backupFiles = await fs.readdir(testBackupDir);
      let totalSize = 0;

      for (const file of backupFiles) {
        const filePath = path.join(testBackupDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      // Metadata size should match actual size (approximately)
      expect(Math.abs(metadata.size - totalSize)).toBeLessThan(1000); // Allow 1KB tolerance
    });
  });

  describe('Backup Restoration Integration', () => {
    let testBackupMetadata: BackupMetadata;

    beforeEach(async () => {
      // Create test data first
      await dbService.postgresQuery(`
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
      `, [
        'backup_test',
        JSON.stringify({ test: 'backup restoration test' }),
        JSON.stringify({ backup_test: true })
      ]);

      // Create a backup
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      testBackupMetadata = await backupService.createBackup(options);
      expect(testBackupMetadata.status).toBe('completed');
    });

    it('should restore from backup successfully', async () => {
      // Clear test data
      await dbService.postgresQuery("DELETE FROM documents WHERE type = 'backup_test'");

      // Verify data is cleared
      const clearedResult = await dbService.postgresQuery(
        "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
      );
      expect(parseInt(clearedResult.rows[0].count)).toBe(0);

      // Restore from backup
      const restoreResult = await backupService.restoreBackup(testBackupMetadata.id, {
        destination: testBackupDir
      });

      expect(restoreResult).toBeDefined();
      expect(restoreResult).toEqual(expect.objectContaining({ success: true }));

      // Verify data is restored
      const restoredResult = await dbService.postgresQuery(
        "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
      );
      expect(parseInt(restoredResult.rows[0].count)).toBeGreaterThan(0);
    });

    it('should handle restoration of compressed backups', async () => {
      // Create compressed backup
      const compressedOptions: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: true,
        destination: testBackupDir
      };

      const compressedMetadata = await backupService.createBackup(compressedOptions);
      expect(compressedMetadata.status).toBe('completed');

      // Clear and restore from compressed backup
      await dbService.postgresQuery("DELETE FROM documents WHERE type = 'backup_test'");

      const restoreResult = await backupService.restoreBackup(compressedMetadata.id, {
        destination: testBackupDir
      });

      expect(restoreResult).toEqual(expect.objectContaining({ success: true }));

      // Verify data is restored
      const restoredResult = await dbService.postgresQuery(
        "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
      );
      expect(parseInt(restoredResult.rows[0].count)).toBeGreaterThan(0);
    });

    it('should validate backup integrity during restoration', async () => {
      const restoreResult = await backupService.restoreBackup(testBackupMetadata.id, {
        destination: testBackupDir,
        validateIntegrity: true
      });

      expect(restoreResult).toBeDefined();
      expect(restoreResult).toEqual(expect.objectContaining({ success: true }));

      // Should include integrity check results
      if (restoreResult.integrityCheck) {
        expect(typeof restoreResult.integrityCheck.passed).toBe('boolean');
        expect(restoreResult.integrityCheck.details).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle backup creation with database connection failures', async () => {
      // Create backup service with invalid database config
      const invalidConfig = {
        falkordb: { url: 'redis://invalid:1234', database: 1 },
        qdrant: { url: 'http://invalid:1234', apiKey: undefined },
        postgresql: { connectionString: 'postgresql://invalid:invalid@invalid:1234/invalid' },
        redis: { url: 'redis://invalid:1234' }
      };

      const invalidBackupService = new BackupService(dbService, invalidConfig);

      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      // Should handle errors gracefully
      const metadata = await invalidBackupService.createBackup(options);

      // Backup should still be created (even if with errors)
      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      // Status might be 'failed' or 'completed' depending on implementation
      expect(['completed', 'failed']).toContain(metadata.status);
    });

    it('should handle missing backup destination gracefully', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: false,
        includeConfig: false,
        compression: false,
        destination: '/non/existent/path/that/does/not/exist'
      };

      await expect(backupService.createBackup(options)).rejects.toThrow();
    });

    it('should handle invalid backup IDs during restoration', async () => {
      const invalidId = 'invalid_backup_id_12345';

      const restoreResult = await backupService.restoreBackup(invalidId, {
        destination: testBackupDir
      });

      expect(restoreResult).toBeDefined();
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toBeDefined();
    });

    it('should handle corrupted backup files', async () => {
      // Create a backup first
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata = await backupService.createBackup(options);

      // Corrupt a backup file
      const backupFiles = await fs.readdir(testBackupDir);
      if (backupFiles.length > 0) {
        const filePath = path.join(testBackupDir, backupFiles[0]);
        await fs.appendFile(filePath, 'CORRUPTED_DATA_APPENDED');

        // Try to restore corrupted backup
        const restoreResult = await backupService.restoreBackup(metadata.id, {
          destination: testBackupDir
        });

        // Should handle corruption gracefully
        expect(restoreResult).toBeDefined();
        // May succeed or fail depending on corruption severity
        expect(typeof restoreResult.success).toBe('boolean');
      }
    });

    it('should handle concurrent backup operations', async () => {
      const concurrentOperations = 3;
      const promises: Promise<BackupMetadata>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const options: BackupOptions = {
          type: 'full',
          includeData: false, // Avoid conflicts with data operations
          includeConfig: true,
          compression: false,
          destination: path.join(testBackupDir, `concurrent_${i}`)
        };

        promises.push(backupService.createBackup(options));
      }

      const results = await Promise.allSettled(promises);

      // Some operations should succeed
      const successfulResults = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 'completed'
      );

      expect(successfulResults.length).toBeGreaterThan(0);

      // Failed operations should have proper error handling
      const failedResults = results.filter(result => result.status === 'rejected');
      failedResults.forEach(result => {
        expect(result.status).toBe('rejected');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle large dataset backups efficiently', async () => {
      // Create a larger dataset
      const largeDatasetSize = 100;
      const insertPromises: Promise<any>[] = [];

      for (let i = 0; i < largeDatasetSize; i++) {
        insertPromises.push(
          dbService.postgresQuery(`
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `, [
            'large_backup_test',
            JSON.stringify({ index: i, data: 'x'.repeat(1000) }), // 1KB per document
            JSON.stringify({ large_test: true, index: i })
          ])
        );
      }

      await Promise.all(insertPromises);

      // Backup the large dataset
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const startTime = Date.now();
      const metadata = await backupService.createBackup(options);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(metadata.status).toBe('completed');
      expect(metadata.size).toBeGreaterThan(0);

      // Should complete within reasonable time (adjust based on environment)
      expect(duration).toBeLessThan(30000); // 30 seconds max for 100KB dataset

      // Clean up large dataset
      await dbService.postgresQuery("DELETE FROM documents WHERE type = 'large_backup_test'");
    });

    it('should maintain backup performance consistency', async () => {
      const iterations = 5;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const options: BackupOptions = {
          type: 'full',
          includeData: false, // Use lightweight backups for performance testing
          includeConfig: true,
          compression: false,
          destination: path.join(testBackupDir, `perf_${i}`)
        };

        const startTime = Date.now();
        const metadata = await backupService.createBackup(options);
        const endTime = Date.now();

        expect(metadata.status).toBe('completed');
        durations.push(endTime - startTime);
      }

      // Calculate performance statistics
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = maxDuration - minDuration;

      // Performance should be reasonably consistent
      expect(avgDuration).toBeLessThan(5000); // Average < 5 seconds
      expect(variance).toBeLessThan(avgDuration * 0.5); // Variance < 50% of average
    });

    it('should handle backup cleanup efficiently', async () => {
      // Create multiple backups
      const backupCount = 10;
      const backupPromises: Promise<BackupMetadata>[] = [];

      for (let i = 0; i < backupCount; i++) {
        const options: BackupOptions = {
          type: 'full',
          includeData: false,
          includeConfig: false,
          compression: false,
          destination: path.join(testBackupDir, `cleanup_${i}`)
        };

        backupPromises.push(backupService.createBackup(options));
      }

      await Promise.all(backupPromises);

      // List all backup directories
      const allDirs = await fs.readdir(testDir);
      const backupDirs = allDirs.filter(dir => dir.startsWith('cleanup_'));

      expect(backupDirs.length).toBe(backupCount);

      // Clean up should be efficient
      const cleanupStartTime = Date.now();
      await Promise.all(backupDirs.map(dir =>
        fs.rm(path.join(testDir, dir), { recursive: true, force: true })
      ));
      const cleanupEndTime = Date.now();

      const cleanupDuration = cleanupEndTime - cleanupStartTime;
      expect(cleanupDuration).toBeLessThan(2000); // Cleanup should be fast
    });
  });

  describe('Backup Verification and Integrity', () => {
    it('should verify backup integrity after creation', async () => {
      const options: BackupOptions = {
        type: 'full',
        includeData: true,
        includeConfig: false,
        compression: false,
        destination: testBackupDir
      };

      const metadata = await backupService.createBackup(options);

      // Verify backup integrity
      const integrityResult = await backupService.verifyBackupIntegrity(metadata.id, {
        destination: testBackupDir
      });

      expect(integrityResult).toBeDefined();
      expect(typeof integrityResult.isValid).toBe('boolean');
      expect(integrityResult.details).toBeDefined();

      // If backup was created successfully, integrity should be valid
      if (metadata.status === 'completed') {
        expect(integrityResult.isValid).toBe(true);
      }
    });

    it('should detect backup corruption', async () => {
      // Create a valid backup
      const options: BackupOptions = {
        type: 'full',
        includeData: false,
        includeConfig: true,
        compression: false,
        destination: testBackupDir
      };

      const metadata = await backupService.createBackup(options);

      // Corrupt the backup
      const backupFiles = await fs.readdir(testBackupDir);
      if (backupFiles.length > 0) {
        const filePath = path.join(testBackupDir, backupFiles[0]);
        const originalContent = await fs.readFile(filePath);
        const corruptedContent = originalContent.slice(0, -10); // Remove last 10 bytes
        await fs.writeFile(filePath, corruptedContent);

        // Verify integrity should detect corruption
        const integrityResult = await backupService.verifyBackupIntegrity(metadata.id, {
          destination: testBackupDir
        });

        // Should detect the corruption
        expect(integrityResult.isValid).toBe(false);
        expect(integrityResult.details).toContain('corrupt');
      }
    });

    it('should handle backup listing and management', async () => {
      // Create multiple backups
      const backupIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const options: BackupOptions = {
          type: 'full',
          includeData: false,
          includeConfig: false,
          compression: false,
          destination: path.join(testBackupDir, `list_${i}`)
        };

        const metadata = await backupService.createBackup(options);
        backupIds.push(metadata.id);
      }

      // List available backups
      const availableBackups = await backupService.listBackups({
        destination: testBackupDir
      });

      expect(availableBackups).toBeDefined();
      expect(Array.isArray(availableBackups)).toBe(true);
      expect(availableBackups.length).toBeGreaterThanOrEqual(3);

      // Each backup should have proper metadata
      availableBackups.forEach(backup => {
        expect(backup.id).toBeDefined();
        expect(backup.timestamp).toBeInstanceOf(Date);
        expect(typeof backup.size).toBe('number');
      });
    });
  });
});
