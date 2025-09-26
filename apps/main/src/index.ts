#!/usr/bin/env node

/**
 * Memento - AI Coding Assistant with Knowledge Graph
 * Main application entry point
 */

import 'dotenv/config';
import { DatabaseService, createDatabaseConfig } from '@memento/database';
import { KnowledgeGraphService } from '@memento/knowledge';
import { FileWatcher } from '@memento/core';
import { ASTParser } from '@memento/knowledge';
import { DocumentationParser } from '@memento/knowledge';
import { APIGateway } from '@memento/api';
import { SynchronizationCoordinator } from '@memento/sync/synchronization';
import { ConflictResolution } from '@memento/sync/scm';
import { SynchronizationMonitoring } from '@memento/sync/synchronization';
import { RollbackCapabilities } from '@memento/sync/scm';
import { SecurityScanner } from '@memento/testing';

async function main() {
  console.log('🚀 Starting Memento...');

  try {
    // Initialize database service
    console.log('🔧 Initializing database connections...');
    const dbConfig = createDatabaseConfig();
    const dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    // Setup database schema
    await dbService.setupDatabase();

    // Initialize knowledge graph service
    console.log('🧠 Initializing knowledge graph service...');

    // Extract Neo4j config for the new KnowledgeGraphService
    const neo4jConfig = {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || 'neo4j',
    };

    const kgService = new KnowledgeGraphService(neo4jConfig);
    await kgService.initialize();

    // Initialize AST parser
    console.log('📝 Initializing AST parser...');
    const astParser = new ASTParser();
    if ('initialize' in astParser && typeof (astParser as any).initialize === 'function') {
      await (astParser as any).initialize();
    }

    // Initialize documentation parser
    console.log('📚 Initializing documentation parser...');
    const docParser = new DocumentationParser(kgService, dbService);

    // Initialize security scanner
    console.log('🔒 Initializing security scanner...');
    const securityScanner = new SecurityScanner(dbService, kgService);
    await securityScanner.initialize();

    // Initialize synchronization services
    console.log('🔄 Initializing synchronization services...');
    const syncMonitor = new SynchronizationMonitoring();
    const conflictResolver = new ConflictResolution(kgService);
    const rollbackCapabilities = new RollbackCapabilities(kgService, dbService);
    const syncCoordinator = new SynchronizationCoordinator(
      kgService,
      astParser,
      dbService,
      conflictResolver,
      rollbackCapabilities
    );

    // Wire up event handlers for monitoring
    syncCoordinator.on('operationStarted', (operation) => {
      syncMonitor.recordOperationStart(operation);
    });
    syncCoordinator.on('operationCompleted', (operation) => {
      syncMonitor.recordOperationComplete(operation);
    });
    syncCoordinator.on('operationFailed', (operation, error) => {
      syncMonitor.recordOperationFailed(operation, error);
    });
    // Track progress/phase updates
    syncCoordinator.on('syncProgress', (operation: any, payload: { phase: string; progress?: number }) => {
      try { syncMonitor.recordProgress(operation, payload); } catch {}
    });
    syncCoordinator.on('conflictDetected', (conflict) => {
      syncMonitor.recordConflict(conflict as any);
    });
    syncCoordinator.on('sessionSequenceAnomaly', (anomaly: any) => {
      try {
        syncMonitor.recordSessionSequenceAnomaly(anomaly);
      } catch {}
    });
    syncCoordinator.on('checkpointMetricsUpdated', (snapshot) => {
      try {
        syncMonitor.recordCheckpointMetrics(snapshot);
      } catch (error) {
        console.warn('[monitor] failed to record checkpoint metrics', error);
      }
    });

    conflictResolver.addConflictListener((conflict) => {
      syncMonitor.recordConflict(conflict as any);
    });

    // Initialize file watcher
    console.log('👀 Initializing file watcher...');
    const fileWatcher = new FileWatcher({
      watchPaths: ['src', 'lib', 'packages', 'tests'],
      debounceMs: 500,
      maxConcurrent: 10,
    });

    // Set up file change handlers with new synchronization system
    let pendingChanges: any[] = [];
    let syncTimeout: NodeJS.Timeout | null = null;

    fileWatcher.on('change', async (change) => {
      console.log(`📡 File change detected: ${change.path} (${change.type})`);

      // Add change to pending batch
      pendingChanges.push(change);

      // Debounce sync operations
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }

      syncTimeout = setTimeout(async () => {
        if (pendingChanges.length > 0) {
          try {
            console.log(`🔄 Processing batch of ${pendingChanges.length} file changes`);

            // Create rollback point for safety
            const rollbackId = await rollbackCapabilities.createRollbackPoint(
              `batch_sync_${Date.now()}`,
              `Batch sync for ${pendingChanges.length} file changes`
            );

            // Start synchronization operation
            const operationId = await syncCoordinator.synchronizeFileChanges(pendingChanges);

            // Wait for operation to complete
            const checkCompletion = () => {
              const operation = syncCoordinator.getOperationStatus(operationId);
              if (operation && (operation.status === 'completed' || operation.status === 'failed')) {
                if (operation.status === 'failed') {
                  console.error(`❌ Sync operation failed, attempting rollback...`);
                  rollbackCapabilities.rollbackToPoint(rollbackId).catch(rollbackError => {
                    console.error('❌ Rollback also failed:', rollbackError);
                  });
                } else {
                  console.log(`✅ Sync operation completed successfully`);
                  // Clean up rollback point on success
                  rollbackCapabilities.deleteRollbackPoint(rollbackId);
                }
              } else {
                // Check again in 1 second
                setTimeout(checkCompletion, 1000);
              }
            };

            setTimeout(checkCompletion, 1000);

            // Clear pending changes
            pendingChanges = [];

          } catch (error) {
            console.error(`❌ Error in batch sync:`, error);
            pendingChanges = []; // Clear on error to prevent infinite retries
          }
        }
      }, 1000); // 1 second debounce
    });

    // Start file watcher
    await fileWatcher.start();

    const waitForSyncCompletion = async (
      operationId: string,
      timeoutMs = 5 * 60 * 1000,
      pollMs = 1000
    ) => {
      const startedAt = Date.now();

      return new Promise<void>((resolve, reject) => {
        const checkStatus = () => {
          const op = syncCoordinator.getOperationStatus(operationId);
          if (op && ["completed", "failed", "rolled_back"].includes(op.status)) {
            if (op.status === "completed") {
              resolve();
            } else {
              reject(new Error(`Initial sync ${op.status}`));
            }
            return;
          }

          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error("Timed out waiting for initial synchronization"));
            return;
          }

          setTimeout(checkStatus, pollMs);
        };

        checkStatus();
      });
    };

    const skipInitialSync = String(process.env.SKIP_INITIAL_FULL_SYNC || "").toLowerCase() === "true";
    if (!skipInitialSync) {
      try {
        console.log("🔁 Performing initial full synchronization...");
        const fullSyncId = await syncCoordinator.startFullSynchronization({ includeEmbeddings: false });
        await waitForSyncCompletion(fullSyncId).catch((error) => {
          console.warn("⚠️ Initial synchronization did not complete cleanly:", error instanceof Error ? error.message : error);
        });
      } catch (error) {
        console.warn("⚠️ Failed to start initial synchronization:", error);
      }
    } else {
      console.log("⏭️ SKIP_INITIAL_FULL_SYNC enabled – skipping boot-time synchronization");
    }

    // Initialize API Gateway with enhanced services
    console.log('🌐 Initializing API Gateway...');
    const apiGateway = new APIGateway(
      kgService, 
      dbService, 
      fileWatcher, 
      astParser, 
      docParser,
      securityScanner,
      {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
      }, 
      {
        syncCoordinator,
        syncMonitor,
        conflictResolver,
        rollbackCapabilities,
      }
    );

    // Start API Gateway
    await apiGateway.start();

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Stop monitoring first
        syncMonitor.stopHealthMonitoring();

        // Stop API Gateway
        await apiGateway.stop();

        // Stop file watcher
        await fileWatcher.stop();

        // Close database connections
        await dbService.close();

        console.log('✅ Shutdown complete');

        const failureSignals = new Set(['uncaughtException', 'unhandledRejection']);
        if (failureSignals.has(signal)) {
          process.exit(1);
          return;
        }

        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });

    console.log('🎉 Memento is running!');
    console.log(`📊 API available at: http://localhost:${process.env.PORT || 3000}`);
    console.log(`🔍 Health check: http://localhost:${process.env.PORT || 3000}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${process.env.PORT || 3000}/ws`);
    console.log(`📁 Watching files in: ${fileWatcher.getWatchedPaths().join(', ')}`);

  } catch (error) {
    console.error('💥 Failed to start Memento:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Memento - AI Coding Assistant with Knowledge Graph

Usage:
  pnpm start                   Start the development server
  pnpm run dev                 Start with hot reload
  pnpm run build              Build for production
  pnpm test                    Run tests
  pnpm run health             Check system health

Environment Variables:
  PORT                         Server port (default: 3000)
  HOST                         Server host (default: 0.0.0.0)
  NODE_ENV                     Environment (development/production)
  FALKORDB_URL                 FalkorDB connection URL
  QDRANT_URL                   Qdrant connection URL
  DATABASE_URL                 PostgreSQL connection URL
  LOG_LEVEL                    Logging level (info/debug/warn/error)

Examples:
  PORT=3001 pnpm start         Start on port 3001
  NODE_ENV=production pnpm start Run in production mode
  `);
  process.exit(0);
}

// Start the application
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
