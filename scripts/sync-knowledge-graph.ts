#!/usr/bin/env tsx

/**
 * Knowledge Graph Synchronization Script
 * Manually syncs the knowledge graph with the current codebase
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ASTParser } from '../src/services/ASTParser.js';

async function syncKnowledgeGraph(): Promise<void> {
  console.log('🔄 Starting knowledge graph synchronization...');

  try {
    // Initialize services
    const dbConfig = createDatabaseConfig();
    const dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    const kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    const astParser = new ASTParser();

    // Setup database schema
    await dbService.setupDatabase();

    // Define directories to scan
    const scanDirs = [
      'src',
      'tests',
      'scripts',
      // Add more directories as needed
    ];

    let totalFiles = 0;
    let totalEntities = 0;
    let totalRelationships = 0;
    let totalErrors = 0;

    // Scan each directory
    for (const scanDir of scanDirs) {
      console.log(`📁 Scanning directory: ${scanDir}`);

      try {
        const files = await scanDirectory(scanDir);
        const codeFiles = files.filter(file =>
          /\.(ts|tsx|js|jsx)$/.test(file) &&
          !file.includes('node_modules') &&
          !file.includes('dist') &&
          !file.includes('coverage')
        );

        console.log(`📄 Found ${codeFiles.length} code files in ${scanDir}`);

        // Process files in batches
        const batchSize = 10;
        for (let i = 0; i < codeFiles.length; i += batchSize) {
          const batch = codeFiles.slice(i, i + batchSize);
          console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(codeFiles.length / batchSize)}`);

          const promises = batch.map(async (filePath) => {
            try {
              const parseResult = await astParser.parseFile(filePath);

              // Create entities
              for (const entity of parseResult.entities) {
                await kgService.createEntity(entity);
              }

              // Create relationships
              for (const relationship of parseResult.relationships) {
                await kgService.createRelationship(relationship);
              }

              return {
                file: filePath,
                entities: parseResult.entities.length,
                relationships: parseResult.relationships.length,
                errors: parseResult.errors.length,
              };
            } catch (error) {
              console.error(`❌ Error processing ${filePath}:`, error);
              return {
                file: filePath,
                entities: 0,
                relationships: 0,
                errors: 1,
              };
            }
          });

          const results = await Promise.allSettled(promises);

          for (const result of results) {
            if (result.status === 'fulfilled') {
              totalFiles++;
              totalEntities += result.value.entities;
              totalRelationships += result.value.relationships;
              totalErrors += result.value.errors;

              if (result.value.errors > 0) {
                console.warn(`⚠️  ${result.value.file}: ${result.value.entities} entities, ${result.value.relationships} relationships, ${result.value.errors} errors`);
              } else {
                console.log(`✅ ${result.value.file}: ${result.value.entities} entities, ${result.value.relationships} relationships`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error scanning directory ${scanDir}:`, error);
      }
    }

    // Generate summary
    console.log('\n📊 Synchronization Summary:');
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Entities created: ${totalEntities}`);
    console.log(`   Relationships created: ${totalRelationships}`);
    console.log(`   Errors encountered: ${totalErrors}`);

    if (totalErrors > 0) {
      console.log('\n⚠️  Some files had parsing errors. Check the logs above for details.');
    }

    console.log('\n✅ Knowledge graph synchronization complete!');

  } catch (error) {
    console.error('❌ Knowledge graph synchronization failed:', error);
    process.exit(1);
  }
}

async function scanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (!['node_modules', 'dist', 'coverage', '.git'].includes(entry.name)) {
          const subFiles = await scanDirectory(fullPath);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    console.warn(`Could not scan directory ${dirPath}:`, error);
  }

  return files;
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Knowledge Graph Synchronization Script

Usage:
  pnpm run sync                    Sync all directories
  pnpm run sync --dir src          Sync specific directory
  pnpm run sync --help             Show this help

Options:
  --dir <path>    Sync specific directory (default: src, tests, scripts)
  --help, -h      Show this help message

Examples:
  pnpm run sync
  pnpm run sync --dir src/components
  pnpm run sync --dir tests/unit
  `);
  process.exit(0);
}

// Extract directory from args
let scanDirs = ['src', 'tests', 'scripts'];
const dirIndex = args.indexOf('--dir');
if (dirIndex !== -1 && args[dirIndex + 1]) {
  scanDirs = [args[dirIndex + 1]];
}

// Run synchronization
syncKnowledgeGraph().catch((error) => {
  console.error('💥 Fatal error during sync:', error);
  process.exit(1);
});

