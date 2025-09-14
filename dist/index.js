#!/usr/bin/env node
/**
 * Memento - AI Coding Assistant with Knowledge Graph
 * Main application entry point
 */
import 'dotenv/config';
import { DatabaseService, createDatabaseConfig } from './services/DatabaseService.js';
import { KnowledgeGraphService } from './services/KnowledgeGraphService.js';
import { FileWatcher } from './services/FileWatcher.js';
import { ASTParser } from './services/ASTParser.js';
import { DocumentationParser } from './services/DocumentationParser.js';
import { APIGateway } from './api/APIGateway.js';
import { SynchronizationCoordinator } from './services/SynchronizationCoordinator.js';
import { ConflictResolution } from './services/ConflictResolution.js';
import { SynchronizationMonitoring } from './services/SynchronizationMonitoring.js';
import { RollbackCapabilities } from './services/RollbackCapabilities.js';
import { SecurityScanner } from './services/SecurityScanner.js';
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
        const kgService = new KnowledgeGraphService(dbService);
        await kgService.initialize();
        // Initialize AST parser
        console.log('📝 Initializing AST parser...');
        const astParser = new ASTParser();
        if ('initialize' in astParser && typeof astParser.initialize === 'function') {
            await astParser.initialize();
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
        const syncCoordinator = new SynchronizationCoordinator(kgService, astParser, dbService);
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
        syncCoordinator.on('syncProgress', (operation, payload) => {
            try {
                syncMonitor.recordProgress(operation, payload);
            }
            catch (_a) { }
        });
        conflictResolver.addConflictListener((conflict) => {
            syncMonitor.recordConflict(conflict);
        });
        // Initialize file watcher
        console.log('👀 Initializing file watcher...');
        const fileWatcher = new FileWatcher({
            watchPaths: ['src', 'lib', 'packages', 'tests'],
            debounceMs: 500,
            maxConcurrent: 10,
        });
        // Set up file change handlers with new synchronization system
        let pendingChanges = [];
        let syncTimeout = null;
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
                        const rollbackId = await rollbackCapabilities.createRollbackPoint(`batch_sync_${Date.now()}`, `Batch sync for ${pendingChanges.length} file changes`);
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
                                }
                                else {
                                    console.log(`✅ Sync operation completed successfully`);
                                    // Clean up rollback point on success
                                    rollbackCapabilities.deleteRollbackPoint(rollbackId);
                                }
                            }
                            else {
                                // Check again in 1 second
                                setTimeout(checkCompletion, 1000);
                            }
                        };
                        setTimeout(checkCompletion, 1000);
                        // Clear pending changes
                        pendingChanges = [];
                    }
                    catch (error) {
                        console.error(`❌ Error in batch sync:`, error);
                        pendingChanges = []; // Clear on error to prevent infinite retries
                    }
                }
            }, 1000); // 1 second debounce
        });
        // Start file watcher
        await fileWatcher.start();
        // Initialize API Gateway with enhanced services
        console.log('🌐 Initializing API Gateway...');
        const apiGateway = new APIGateway(kgService, dbService, fileWatcher, astParser, docParser, securityScanner, {
            port: parseInt(process.env.PORT || '3000'),
            host: process.env.HOST || '0.0.0.0',
        }, {
            syncCoordinator,
            syncMonitor,
            conflictResolver,
            rollbackCapabilities,
        });
        // Start API Gateway
        await apiGateway.start();
        // Graceful shutdown handlers
        const shutdown = async (signal) => {
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
                process.exit(0);
            }
            catch (error) {
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
    }
    catch (error) {
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
  npm start                    Start the development server
  npm run dev                  Start with hot reload
  npm run build               Build for production
  npm test                     Run tests
  npm run health              Check system health

Environment Variables:
  PORT                         Server port (default: 3000)
  HOST                         Server host (default: 0.0.0.0)
  NODE_ENV                     Environment (development/production)
  FALKORDB_URL                 FalkorDB connection URL
  QDRANT_URL                   Qdrant connection URL
  DATABASE_URL                 PostgreSQL connection URL
  LOG_LEVEL                    Logging level (info/debug/warn/error)

Examples:
  PORT=3001 npm start          Start on port 3001
  NODE_ENV=production npm start Run in production mode
  `);
    process.exit(0);
}
// Start the application
main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map