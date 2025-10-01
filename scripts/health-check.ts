#!/usr/bin/env tsx

import 'dotenv/config';
import { DatabaseService, createDatabaseConfig } from '../src/services/core/DatabaseService.js';

async function main() {
  const config = createDatabaseConfig();
  const dbService = new DatabaseService(config);

  console.log('🩺 Running health check...');
  try {
    await dbService.initialize();
    const health = await dbService.healthCheck();

    const statuses: Record<string, 'healthy' | 'unhealthy' | 'unknown'> = {
      neo4j: health.neo4j?.status ?? 'unknown',
      qdrant: health.qdrant?.status ?? 'unknown',
      postgresql: health.postgresql?.status ?? 'unknown',
      redis: health.redis?.status ?? 'unknown',
    };

    console.table(statuses);

    const allHealthy = Object.values(statuses).every((status) => status === 'healthy');
    if (!allHealthy) {
      console.log('⚠️ At least one component is not healthy.');
      process.exitCode = 1;
    } else {
      console.log('✅ All core services healthy.');
    }
  } finally {
    await dbService.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('❌ Health check failed:', err);
  process.exitCode = 1;
});
