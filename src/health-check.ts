#!/usr/bin/env node

/**
 * Health Check Script for Memento
 * Used by Docker health checks and monitoring systems
 */

import { DatabaseService, createDatabaseConfig } from './services/DatabaseService.js';

async function healthCheck(): Promise<void> {
  try {
    const dbConfig = createDatabaseConfig();
    const dbService = new DatabaseService(dbConfig);

    // Initialize database connections
    await dbService.initialize();

    // Check database health
    const health = await dbService.healthCheck();

    // Close connections
    await dbService.close();

    // Check overall health
    const allHealthy = Object.values(health).every(status =>
      status === true || status === undefined
    );

    if (allHealthy) {
      console.log('✅ All systems healthy');
      process.exit(0);
    } else {
      console.log('❌ System health check failed:', health);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

// Run health check
healthCheck().catch((error) => {
  console.error('💥 Health check error:', error);
  process.exit(1);
});
