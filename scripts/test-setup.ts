#!/usr/bin/env tsx

/**
 * Test Database Setup Script
 * Sets up test databases and ensures they're ready for testing
 */

import { execSync, spawn } from 'child_process';
import { createTestDatabaseConfig } from '../src/services/DatabaseService.js';
import { DatabaseService } from '../src/services/DatabaseService.js';

class TestDatabaseSetup {
  private processes: Map<string, any> = new Map();

  async setup(): Promise<void> {
    console.log('🚀 Setting up test databases...');

    try {
      // Start test databases using docker-compose
      console.log('📦 Starting test databases with Docker Compose...');
      execSync('docker-compose -f docker-compose.test.yml up -d', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Wait for databases to be ready
      await this.waitForDatabases();

      // Initialize database schema
      await this.initializeSchema();

      console.log('✅ Test databases setup complete!');
    } catch (error) {
      console.error('❌ Failed to setup test databases:', error);
      await this.cleanup();
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test databases...');

    try {
      // Stop test databases
      execSync('docker-compose -f docker-compose.test.yml down -v', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Kill any remaining processes
      for (const [name, process] of this.processes) {
        try {
          process.kill();
        } catch (error) {
          console.warn(`Failed to kill process ${name}:`, error);
        }
      }

      console.log('✅ Test databases cleaned up!');
    } catch (error) {
      console.error('❌ Failed to cleanup test databases:', error);
    }
  }

  private async waitForDatabases(): Promise<void> {
    console.log('⏳ Waiting for databases to be ready...');

    const maxRetries = 60; // Increased retries for FalkorDB
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Test each database individually
        const ready = await this.checkDatabasesReady();
        if (ready) {
          console.log('✅ All test databases are ready!');
          return;
        }
      } catch (error) {
        console.log(`⏳ Databases not ready yet (${i + 1}/${maxRetries}). Retrying in ${retryDelay}ms...`);
        console.log(`   Error: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error('Test databases failed to start within timeout');
  }

  private async checkDatabasesReady(): Promise<boolean> {
    try {
      // Test PostgreSQL
      const pg = await import('pg');
      const pgClient = new pg.Client({
        connectionString: 'postgresql://memento_test:memento_test@localhost:5433/memento_test'
      });
      await pgClient.connect();
      await pgClient.query('SELECT 1');
      await pgClient.end();
      console.log('   ✅ PostgreSQL ready');

      // Test Qdrant
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      const qdrantClient = new QdrantClient({ url: 'http://localhost:6335' });
      await qdrantClient.getCollections();
      console.log('   ✅ Qdrant ready');

      // Test FalkorDB (Redis)
      const { createClient } = await import('redis');
      const falkordbClient = createClient({ url: 'redis://localhost:6380' });
      await falkordbClient.connect();
      await falkordbClient.ping();
      await falkordbClient.disconnect();
      console.log('   ✅ FalkorDB ready');

      // Test Redis
      const redisClient = createClient({ url: 'redis://localhost:6381' });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.disconnect();
      console.log('   ✅ Redis ready');

      return true;
    } catch (error) {
      console.log(`   ❌ Database check failed: ${error.message}`);
      return false;
    }
  }

  private async initializeSchema(): Promise<void> {
    console.log('📋 Initializing database schemas...');

    const config = createTestDatabaseConfig();
    const dbService = new DatabaseService(config);

    try {
      await dbService.initialize();

      // Enable PostgreSQL extensions needed for tests
      await this.enablePostgresExtensions(dbService);

      await dbService.setupDatabase();
      console.log('✅ Database schemas initialized!');
    } finally {
      await dbService.close();
    }
  }

  private async enablePostgresExtensions(dbService: DatabaseService): Promise<void> {
    console.log('🔧 Enabling PostgreSQL extensions...');

    try {
      // Enable UUID extension for test database
      await dbService.postgresQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('   ✅ uuid-ossp extension enabled');
    } catch (error) {
      console.warn('   ⚠️ Failed to enable PostgreSQL extensions:', error);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log('Usage: tsx test-setup.ts [setup|cleanup]');
    process.exit(1);
  }

  const setup = new TestDatabaseSetup();

  try {
    switch (command) {
      case 'setup':
        await setup.setup();
        break;
      case 'cleanup':
        await setup.cleanup();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: setup, cleanup');
        process.exit(1);
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  }
}

// Export for use in tests
export { TestDatabaseSetup };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
