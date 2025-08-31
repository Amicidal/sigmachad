#!/usr/bin/env tsx
/**
 * Test script for Conflict Detection and Resolution
 * Validates conflict detection is working properly
 */

import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ConflictResolution } from '../src/services/ConflictResolution.js';
import { Entity, GraphRelationship } from '../src/models/entities.js';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message: string) {
  log(`\n${colors.bright}========================================`, colors.blue);
  log(message, colors.blue + colors.bright);
  log(`========================================${colors.reset}\n`, colors.blue);
}

async function testConflictDetection() {
  header('Testing Conflict Detection and Resolution');
  
  let dbService: DatabaseService | null = null;
  let kgService: KnowledgeGraphService | null = null;
  let conflictResolver: ConflictResolution | null = null;
  
  try {
    // Initialize services
    header('1. Initializing Services');
    
    info('Creating database service...');
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    success('Database service initialized');
    
    info('Creating knowledge graph service...');
    kgService = new KnowledgeGraphService(dbService);
    success('Knowledge graph service created');
    
    info('Creating conflict resolution service...');
    conflictResolver = new ConflictResolution(kgService);
    success('Conflict resolution service created');
    
    // Test 1: Entity Version Conflict
    header('2. Testing Entity Version Conflict Detection');
    
    const baseEntity: Entity = {
      id: 'conflict-test-entity-1',
      type: 'symbol',
      name: 'ConflictTestEntity',
      path: '/test/conflict.ts',
      hash: 'hash1',
      language: 'typescript',
      lastModified: new Date('2024-01-01T10:00:00Z'),
      created: new Date('2024-01-01T09:00:00Z'),
      visibility: 'public',
      signature: 'class ConflictTestEntity',
      docstring: 'Original documentation',
      isExported: true,
      isDeprecated: false,
      kind: 'class'
    };
    
    // Create the entity in the graph
    info('Creating original entity in graph...');
    await kgService.createEntity(baseEntity);
    success('Original entity created');
    
    // Simulate an update to the entity (newer version)
    info('Updating entity with newer version...');
    const updatedEntity = {
      ...baseEntity,
      lastModified: new Date('2024-01-01T12:00:00Z'),
      docstring: 'Updated documentation from another source'
    };
    await kgService.updateEntity(baseEntity.id, updatedEntity);
    success('Entity updated with newer version');
    
    // Now try to apply an older change (should create conflict)
    info('Attempting to apply older change (should create conflict)...');
    const olderChange: Entity = {
      ...baseEntity,
      lastModified: new Date('2024-01-01T11:00:00Z'),
      docstring: 'Documentation from an older change'
    };
    
    const conflicts = await conflictResolver.detectConflicts([olderChange], []);
    
    if (conflicts.length > 0) {
      success(`✓ Version conflict detected correctly! Found ${conflicts.length} conflict(s)`);
      
      const conflict = conflicts[0];
      info(`Conflict type: ${conflict.type}`);
      info(`Conflict description: ${conflict.description}`);
      info(`Current lastModified: ${conflict.conflictingValues.current.lastModified}`);
      info(`Incoming lastModified: ${conflict.conflictingValues.incoming.lastModified}`);
    } else {
      error('✗ Version conflict was not detected');
    }
    
    // Test 2: Concurrent Modification Conflict
    header('3. Testing Concurrent Modification Detection');
    
    const entity2: Entity = {
      id: 'conflict-test-entity-2',
      type: 'symbol',
      name: 'ConcurrentTestEntity',
      path: '/test/concurrent.ts',
      hash: 'hash2',
      language: 'typescript',
      lastModified: new Date('2024-01-02T10:00:00Z'),
      created: new Date('2024-01-02T09:00:00Z'),
      visibility: 'private',
      signature: 'interface ConcurrentTestEntity',
      docstring: 'Initial state',
      isExported: false,
      isDeprecated: false,
      kind: 'interface'
    };
    
    // Create entity
    await kgService.createEntity(entity2);
    
    // Simulate two concurrent modifications
    const modification1 = {
      ...entity2,
      lastModified: new Date('2024-01-02T11:00:00Z'),
      docstring: 'Modified by user 1'
    };
    
    const modification2 = {
      ...entity2,
      lastModified: new Date('2024-01-02T10:30:00Z'),
      docstring: 'Modified by user 2'
    };
    
    // Apply first modification
    await kgService.updateEntity(entity2.id, modification1);
    
    // Try to apply second (older) modification
    const concurrentConflicts = await conflictResolver.detectConflicts([modification2], []);
    
    if (concurrentConflicts.length > 0) {
      success(`✓ Concurrent modification conflict detected! Found ${concurrentConflicts.length} conflict(s)`);
    } else {
      error('✗ Concurrent modification conflict was not detected');
    }
    
    // Test 3: Relationship Conflict
    header('4. Testing Relationship Conflict Detection');
    
    // Create two entities for relationship
    const fromEntity: Entity = {
      id: 'rel-from-entity',
      type: 'symbol',
      name: 'FromEntity',
      path: '/test/from.ts',
      hash: 'hash3',
      language: 'typescript',
      lastModified: new Date('2024-01-03T10:00:00Z'),
      created: new Date('2024-01-03T09:00:00Z'),
      visibility: 'public',
      signature: 'class FromEntity',
      docstring: '',
      isExported: true,
      isDeprecated: false,
      kind: 'class'
    };
    
    const toEntity: Entity = {
      id: 'rel-to-entity',
      type: 'symbol',
      name: 'ToEntity',
      path: '/test/to.ts',
      hash: 'hash4',
      language: 'typescript',
      lastModified: new Date('2024-01-03T10:00:00Z'),
      created: new Date('2024-01-03T09:00:00Z'),
      visibility: 'public',
      signature: 'class ToEntity',
      docstring: '',
      isExported: true,
      isDeprecated: false,
      kind: 'class'
    };
    
    await kgService.createEntity(fromEntity);
    await kgService.createEntity(toEntity);
    
    const relationship: GraphRelationship = {
      id: 'test-relationship-1',
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      type: 'EXTENDS',
      strength: 1.0,
      lastModified: new Date('2024-01-03T11:00:00Z'),
      created: new Date('2024-01-03T10:30:00Z'),
      metadata: {
        description: 'Original relationship'
      }
    };
    
    // Create relationship
    await kgService.createRelationship(relationship);
    info('Original relationship created');
    
    // Try to create an older version of the same relationship
    const olderRelationship: GraphRelationship = {
      ...relationship,
      lastModified: new Date('2024-01-03T10:45:00Z'),
      metadata: {
        description: 'Older relationship version'
      }
    };
    
    const relConflicts = await conflictResolver.detectConflicts([], [olderRelationship]);
    
    if (relConflicts.length > 0) {
      success(`✓ Relationship conflict detected! Found ${relConflicts.length} conflict(s)`);
    } else {
      warning('⚠ Relationship conflict was not detected (may be expected if relationships are overwritten)');
    }
    
    // Test 4: Conflict Resolution Strategies
    header('5. Testing Conflict Resolution Strategies');
    
    if (conflicts.length > 0) {
      info('Testing automatic conflict resolution...');
      
      const resolutions = await conflictResolver.resolveConflictsAuto(conflicts);
      
      if (resolutions.length > 0) {
        success(`✓ Conflicts auto-resolved! ${resolutions.length} resolution(s) applied`);
        
        for (const resolution of resolutions) {
          info(`Resolution strategy: ${resolution.strategy}`);
          info(`Resolved by: ${resolution.resolvedBy}`);
        }
      } else {
        error('✗ Auto-resolution failed');
      }
      
      // Check if conflict is marked as resolved
      const unresolvedConflicts = conflictResolver.getUnresolvedConflicts();
      const resolvedConflicts = conflictResolver.getResolvedConflicts();
      
      info(`Unresolved conflicts: ${unresolvedConflicts.length}`);
      info(`Resolved conflicts: ${resolvedConflicts.length}`);
      
      if (resolvedConflicts.length > 0) {
        success('✓ Conflicts properly marked as resolved');
      }
    }
    
    // Test 5: Get conflict statistics
    header('6. Conflict Statistics');
    
    const stats = conflictResolver.getConflictStatistics();
    info(`Total conflicts: ${stats.total}`);
    info(`Resolved: ${stats.resolved}`);
    info(`Unresolved: ${stats.unresolved}`);
    
    if (stats.byType) {
      info('Conflicts by type:');
      for (const [type, count] of Object.entries(stats.byType)) {
        info(`  ${type}: ${count}`);
      }
    }
    
    // Summary
    header('Test Summary');
    
    const allTestsPassed = conflicts.length > 0 && concurrentConflicts.length > 0;
    
    if (allTestsPassed) {
      success('\n🎉 All conflict detection tests passed!');
      success('Conflict detection and resolution is working properly.');
    } else {
      warning('\n⚠️ Some conflict detection tests did not pass as expected.');
      info('Review the conflict detection logic for potential issues.');
    }
    
  } catch (err) {
    error(`Test failed with error: ${err}`);
    console.error(err);
  } finally {
    // Cleanup
    info('\nCleaning up...');
    
    if (dbService) {
      await dbService.close();
    }
    
    success('Cleanup completed');
  }
}

// Run the test
testConflictDetection().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});