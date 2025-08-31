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
import { APIGateway } from './api/APIGateway.js';

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
    if ('initialize' in astParser && typeof (astParser as any).initialize === 'function') {
      await (astParser as any).initialize();
    }

    // Initialize file watcher
    console.log('👀 Initializing file watcher...');
    const fileWatcher = new FileWatcher({
      watchPaths: ['src', 'lib', 'packages', 'tests'],
      debounceMs: 500,
      maxConcurrent: 10,
    });

    // Set up file change handlers
    fileWatcher.on('change', async (change) => {
      console.log(`📡 Processing file change: ${change.path}`);

      try {
        // Parse the changed file
        const parseResult = await astParser.parseFile(change.absolutePath);

        if (parseResult.errors.length > 0) {
          console.warn(`⚠️ Parse errors in ${change.path}:`, parseResult.errors);
        }

        // Update knowledge graph with new entities and relationships
        for (const entity of parseResult.entities) {
          await kgService.createEntity(entity);
        }

        for (const relationship of parseResult.relationships) {
          await kgService.createRelationship(relationship);
        }

        console.log(`✅ Processed ${parseResult.entities.length} entities and ${parseResult.relationships.length} relationships`);
      } catch (error) {
        console.error(`❌ Error processing file change ${change.path}:`, error);
      }
    });

    // Start file watcher
    await fileWatcher.start();

    // Initialize API Gateway
    console.log('🌐 Initializing API Gateway...');
    const apiGateway = new APIGateway(kgService, dbService, fileWatcher, astParser, {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0',
    });

    // Start API Gateway
    await apiGateway.start();

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
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
