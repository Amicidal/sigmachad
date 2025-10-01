#!/usr/bin/env node

/**
 * API Server - HTTP/WebSocket server for Memento
 * Provides REST API and WebSocket connections for the web app
 */

import 'dotenv/config';
import { APIGateway } from '@memento/api';
import { DatabaseService, createDatabaseConfig } from '@memento/database';
import { KnowledgeGraphService, ASTParser, DocumentationParser } from '@memento/knowledge';
import { FileWatcher } from '@memento/core';
import { SecurityScanner } from '@memento/testing';
import { SynchronizationCoordinator, SynchronizationMonitoring } from '@memento/sync/synchronization';
import { ConflictResolution, RollbackCapabilities } from '@memento/sync/scm';

async function main() {
  console.log('🚀 Starting API Server for Memento...');

  try {
    // Initialize database service
    console.log('🔧 Initializing database connections...');
    const dbConfig = createDatabaseConfig();
    const dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    await dbService.setupDatabase();

    // Initialize knowledge graph service
    console.log('🧠 Initializing knowledge graph service...');
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

    // Initialize file watcher
    console.log('👀 Initializing file watcher...');
    const fileWatcher = new FileWatcher({
      watchPaths: ['src', 'lib', 'packages', 'apps', 'tests'],
      debounceMs: 500,
      maxConcurrent: 10,
    });

    // Set up file change handlers
    let pendingChanges: any[] = [];
    let syncTimeout: NodeJS.Timeout | null = null;

    fileWatcher.on('change', async (change) => {
      console.log(`📡 File change detected: ${change.path} (${change.type})`);
      pendingChanges.push(change);

      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }

      syncTimeout = setTimeout(async () => {
        if (pendingChanges.length > 0) {
          try {
            console.log(`🔄 Processing batch of ${pendingChanges.length} file changes`);
            await syncCoordinator.synchronizeFileChanges(pendingChanges);
            pendingChanges = [];
          } catch (error) {
            console.error(`❌ Error in batch sync:`, error);
            pendingChanges = [];
          }
        }
      }, 1000);
    });

    // Start file watcher
    await fileWatcher.start();

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
        port: parseInt(process.env.API_PORT || '3001'),
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
        syncMonitor.stopHealthMonitoring();
        await apiGateway.stop();
        await fileWatcher.stop();
        await dbService.close();
        console.log('✅ Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));

    console.log('🎉 API Server is running!');
    console.log(`📊 API available at: http://localhost:${process.env.API_PORT || 3001}`);
    console.log(`🔍 Health check: http://localhost:${process.env.API_PORT || 3001}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${process.env.API_PORT || 3001}/ws`);
    console.log(`📁 Watching files in: ${fileWatcher.getWatchedPaths().join(', ')}`);

  } catch (error) {
    console.error('💥 Failed to start API Server:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
