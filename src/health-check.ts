#!/usr/bin/env node

/**
 * Health Check Script for Memento
 * Used by Docker health checks and monitoring systems
 */

import { DatabaseService, createDatabaseConfig } from './services/DatabaseService.js';
import { IDatabaseHealthCheck } from './services/database/interfaces.js';

export interface HealthCheckResult {
  healthy: boolean;
  databases: IDatabaseHealthCheck;
  error?: string;
}

/**
 * Perform health check on all system components
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
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

    return {
      healthy: allHealthy,
      databases: health,
    };
  } catch (error) {
    return {
      healthy: false,
      databases: {
        falkordb: false,
        qdrant: false,
        postgresql: false,
        redis: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * CLI health check function
 */
export async function healthCheck(): Promise<void> {
  const result = await performHealthCheck();

  if (result.healthy) {
    console.log('✅ All systems healthy');
    process.exit(0);
  } else {
    console.log('❌ System health check failed:', result.databases);
    if (result.error) {
      console.error('Error:', result.error);
    }
    process.exit(1);
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  healthCheck().catch((error) => {
    console.error('💥 Health check error:', error);
    process.exit(1);
  });
}

