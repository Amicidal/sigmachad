#!/usr/bin/env tsx

import 'dotenv/config';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { SynchronizationCoordinator } from '../src/services/SynchronizationCoordinator.js';

async function waitForCompletion(
  coordinator: SynchronizationCoordinator,
  operationId: string,
  timeoutMs = 5 * 60 * 1000,
  pollMs = 1000
) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const op = coordinator.getOperationStatus(operationId);
      if (op && ['completed', 'failed', 'rolled_back'].includes(op.status)) {
        if (op.status === 'completed') {
          console.log('✅ Full synchronization completed');
          resolve();
        } else {
          reject(new Error(`Synchronization ${op.status}`));
        }
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('Synchronization timed out'));
        return;
      }

      setTimeout(check, pollMs);
    };

    check();
  });
}

async function main() {
  console.log('🔄 Starting knowledge graph synchronization...');

  const dbConfig = createDatabaseConfig();
  const dbService = new DatabaseService(dbConfig);
  await dbService.initialize();
  await dbService.setupDatabase();

  const kgService = new KnowledgeGraphService(dbService);
  await kgService.initialize();

  const astParser = new ASTParser();
  if (typeof (astParser as any).initialize === 'function') {
    await (astParser as any).initialize();
  }

  const coordinator = new SynchronizationCoordinator(kgService, astParser, dbService);
  const operationId = await coordinator.startFullSynchronization({ includeEmbeddings: false });
  console.log(`🚀 Full synchronization started (operation: ${operationId})`);

  try {
    await waitForCompletion(coordinator, operationId);
  } catch (err) {
    console.error('❌ Synchronization did not finish cleanly:', err);
    process.exitCode = 1;
  } finally {
    await dbService.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('❌ Failed to synchronize knowledge graph:', err);
  process.exitCode = 1;
});
