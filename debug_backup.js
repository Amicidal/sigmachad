/**
 * Debug script to check backup creation and restoration
 */

import {
  DatabaseService,
  createTestDatabaseConfig,
} from "./dist/src/services/DatabaseService.js";
import { BackupService } from "./dist/src/services/BackupService.js";
import fs from "fs/promises";
import path from "path";

async function debugBackup() {
  console.log("🔍 Starting backup debug...");

  // Initialize services
  const dbService = new DatabaseService(createTestDatabaseConfig());
  await dbService.initialize();
  await dbService.setupDatabase();

  const backupService = new BackupService(
    dbService,
    createTestDatabaseConfig()
  );

  try {
    // Create test directory
    const testDir = path.join("/tmp", "backup-debug");
    await fs.mkdir(testDir, { recursive: true });

    // Insert test data
    console.log("📝 Inserting test data...");
    await dbService.postgresQuery(
      `
      INSERT INTO documents (type, content, metadata)
      VALUES ($1, $2, $3)
    `,
      [
        "backup_test",
        JSON.stringify({ test: "backup restoration test" }),
        JSON.stringify({ backup_test: true }),
      ]
    );

    // Verify data was inserted
    const countResult = await dbService.postgresQuery(
      "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
    );
    console.log("✅ Test data inserted. Count:", countResult.rows[0].count);

    // Create backup
    console.log("📦 Creating backup...");
    const backupOptions = {
      type: "full",
      includeData: true,
      includeConfig: false,
      compression: false,
      destination: testDir,
    };

    const metadata = await backupService.createBackup(backupOptions);
    console.log("✅ Backup created:", metadata);

    // Check if backup file exists
    const backupFiles = await fs.readdir(testDir);
    console.log("📁 Backup files:", backupFiles);

    // Read PostgreSQL backup file
    const postgresBackupFile = backupFiles.find((file) =>
      file.includes("postgres")
    );
    if (postgresBackupFile) {
      const backupPath = path.join(testDir, postgresBackupFile);
      const content = await fs.readFile(backupPath, "utf-8");
      console.log("📄 PostgreSQL backup content:");
      console.log(content.substring(0, 500) + "...");

      // Check if our test data is in the backup
      if (content.includes("backup_test")) {
        console.log("✅ Test data found in backup file");
      } else {
        console.log("❌ Test data NOT found in backup file");
      }
    } else {
      console.log("❌ No PostgreSQL backup file found");
    }

    // Delete test data
    console.log("🗑️ Deleting test data...");
    await dbService.postgresQuery(
      "DELETE FROM documents WHERE type = 'backup_test'"
    );

    const deleteCount = await dbService.postgresQuery(
      "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
    );
    console.log("✅ Test data deleted. Count:", deleteCount.rows[0].count);

    // Try restoration
    console.log("🔄 Attempting restoration...");
    const restoreResult = await backupService.restoreBackup(metadata.id, {
      destination: testDir,
    });
    console.log("✅ Restore result:", restoreResult);

    // Check if data was restored
    const restoreCount = await dbService.postgresQuery(
      "SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'"
    );
    console.log("🔍 After restore count:", restoreCount.rows[0].count);

    if (restoreCount.rows[0].count > 0) {
      console.log("✅ Restoration successful!");
    } else {
      console.log("❌ Restoration failed - no data restored");
    }
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await dbService.close();
  }
}

debugBackup()
  .then(() => {
    console.log("🏁 Debug complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Debug failed with error:", error);
    process.exit(1);
  });
