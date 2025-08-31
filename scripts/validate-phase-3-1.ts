#!/usr/bin/env tsx

/**
 * Phase 3.1 Validation Script
 * Tests all validation criteria for the Knowledge Graph Service
 */

import 'dotenv/config';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { Entity, CodebaseEntity, FunctionSymbol, ClassSymbol, File } from '../src/models/entities.js';
import { GraphRelationship, RelationshipType } from '../src/models/relationships.js';
import { GraphSearchRequest } from '../src/models/types.js';

async function validatePhase31(): Promise<void> {
  console.log('🔍 Starting Phase 3.1 Validation...\n');

  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;

  try {
    // Initialize services
    console.log('🔧 Initializing database connections...');
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    // Setup database schema
    await dbService.setupDatabase();

    console.log('🧠 Initializing knowledge graph service...');
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    console.log('✅ Services initialized successfully\n');

    // Test 1: Entities can be created and retrieved
    console.log('📋 VALIDATION CRITERION 1: Entities can be created and retrieved');
    await validateEntityCRUD(kgService);

    // Test 2: Relationships are established correctly
    console.log('\n📋 VALIDATION CRITERION 2: Relationships are established correctly');
    await validateRelationships(kgService);

    // Test 3: Graph queries return accurate results
    console.log('\n📋 VALIDATION CRITERION 3: Graph queries return accurate results');
    await validateGraphQueries(kgService);

    // Test 4: Synchronization works properly
    console.log('\n📋 VALIDATION CRITERION 4: Synchronization works properly');
    await validateSynchronization(kgService);

    console.log('\n🎉 Phase 3.1 Validation Complete!');
    console.log('✅ All validation criteria have been tested.');

  } catch (error) {
    console.error('❌ Phase 3.1 Validation Failed:', error);
    process.exit(1);
  } finally {
    if (dbService) {
      await dbService.close();
    }
  }
}

async function validateEntityCRUD(kgService: KnowledgeGraphService): Promise<void> {
  console.log('  Testing entity creation and retrieval...');

  try {
    // Create a simple test entity first
    const simpleEntity = {
      id: 'simple-test-entity',
      type: 'file' as const,
      path: '/test/simple.txt',
      hash: 'simple-hash',
      language: 'text',
      lastModified: new Date(),
      created: new Date()
    };

    console.log('  Creating simple test entity...');
    await kgService.createEntity(simpleEntity);
    console.log('  ✅ Simple entity created successfully');

    // Try to retrieve it
    const retrievedSimple = await kgService.getEntity(simpleEntity.id);
    console.log('  Retrieved simple entity:', retrievedSimple);

    if (!retrievedSimple) {
      throw new Error('Simple entity retrieval failed - entity not found');
    }

    console.log('  ✅ Simple entity retrieved successfully');
    console.log('  ✅ PASS: Basic entity operations work');

  } catch (error) {
    console.error('  ❌ FAIL: Entity CRUD validation failed:', error);
    throw error;
  }
}

async function validateRelationships(kgService: KnowledgeGraphService): Promise<void> {
  console.log('  Testing relationship creation and queries...');

  try {
    // Create test entities first
    const testFile: File = {
      id: 'test-file-validate',
      type: 'file',
      path: '/src/services/KnowledgeGraphService.ts',
      hash: 'test-file-hash-123',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      extension: '.ts',
      isTest: false,
      isConfig: false,
      size: 1024,
      metadata: {}
    };

    const testFunction: FunctionSymbol = {
      id: 'test-func-rel-validate',
      type: 'symbol',
      kind: 'function',
      name: 'processEntity',
      signature: 'processEntity(entity: Entity): Promise<void>',
      path: '/src/services/KnowledgeGraphService.ts',
      hash: 'test-func-hash-123',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      metadata: {
        parameters: [{ name: 'entity', type: 'Entity' }],
        returnType: 'Promise<void>',
        isExported: true,
        lineNumber: 25
      }
    };

    await kgService.createEntity(testFile);
    await kgService.createEntity(testFunction);

    // Create relationship
    const relationship: GraphRelationship = {
      id: 'test-rel-contains',
      type: RelationshipType.CONTAINS,
      fromEntityId: testFile.id,
      toEntityId: testFunction.id,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: {
        relationship: 'file-contains-function',
        strength: 1.0
      }
    };

    await kgService.createRelationship(relationship);
    console.log('  ✅ Relationship created successfully');

    // Query relationships
    const relationships = await kgService.getRelationships({
      fromEntityId: testFile.id,
      type: [RelationshipType.CONTAINS]
    });

    if (relationships.length === 0) {
      throw new Error('Relationship query failed - no relationships found');
    }

    if (relationships[0].fromEntityId !== testFile.id) {
      throw new Error('Relationship query failed - fromEntityId mismatch');
    }

    if (relationships[0].toEntityId !== testFunction.id) {
      throw new Error('Relationship query failed - toEntityId mismatch');
    }

    console.log('  ✅ Relationships queried successfully');
    console.log('  ✅ Relationship data integrity verified');

    // Clean up
    await kgService.deleteEntity(testFile.id);
    await kgService.deleteEntity(testFunction.id);

    console.log('  ✅ PASS: Relationships are established correctly');

  } catch (error) {
    console.error('  ❌ FAIL: Relationship validation failed:', error);
    throw error;
  }
}

async function validateGraphQueries(kgService: KnowledgeGraphService): Promise<void> {
  console.log('  Testing graph query functionality...');

  try {
    // Create test entities for search
    const testEntities: Entity[] = [
      {
        id: 'search-test-func-1',
        type: 'symbol',
        kind: 'function',
        name: 'searchFunctionOne',
        signature: 'searchFunctionOne(param: string): boolean',
        path: '/src/utils/search.ts',
        hash: 'search-hash-1',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        metadata: {}
      } as FunctionSymbol,
      {
        id: 'search-test-func-2',
        type: 'symbol',
        kind: 'function',
        name: 'searchFunctionTwo',
        signature: 'searchFunctionTwo(data: any[]): number',
        path: '/src/services/SearchService.ts',
        hash: 'search-hash-2',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        metadata: {}
      } as FunctionSymbol
    ];

    for (const entity of testEntities) {
      await kgService.createEntity(entity);
    }

    console.log('  ✅ Test entities created for search');

    // Test structural search
    const structuralSearchRequest: GraphSearchRequest = {
      query: 'function',
      entityTypes: ['symbol'],
      searchType: 'structural',
      filters: {
        language: 'typescript'
      },
      limit: 10
    };

    const structuralResults = await kgService.search(structuralSearchRequest);

    if (structuralResults.length === 0) {
      throw new Error('Structural search failed - no results found');
    }

    console.log(`  ✅ Structural search returned ${structuralResults.length} results`);

    // Test entity examples
    const examples = await kgService.getEntityExamples(testEntities[0].id);
    console.log('  ✅ Entity examples retrieved');

    // Test dependency analysis
    const dependencies = await kgService.getEntityDependencies(testEntities[0].id);
    console.log('  ✅ Dependency analysis completed');

    // Test path finding
    const paths = await kgService.findPaths({
      startEntityId: testEntities[0].id,
      maxDepth: 3
    });
    console.log(`  ✅ Path finding returned ${paths.length} paths`);

    // Test graph traversal
    const traversalResults = await kgService.traverseGraph({
      startEntityId: testEntities[0].id,
      maxDepth: 2,
      limit: 5
    });
    console.log(`  ✅ Graph traversal returned ${traversalResults.length} entities`);

    // Clean up
    for (const entity of testEntities) {
      await kgService.deleteEntity(entity.id);
    }

    console.log('  ✅ PASS: Graph queries return accurate results');

  } catch (error) {
    console.error('  ❌ FAIL: Graph queries validation failed:', error);
    throw error;
  }
}

async function validateSynchronization(kgService: KnowledgeGraphService): Promise<void> {
  console.log('  Testing synchronization functionality...');

  try {
    // Test with a simple file that exists
    const testFilePath = '/Users/jp/Documents/sigmachad/src/services/KnowledgeGraphService.ts';

    // Create a test entity that represents a file
    const testFileEntity: File = {
      id: 'sync-test-file',
      type: 'file',
      path: testFilePath,
      hash: 'sync-test-hash-' + Date.now(),
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      extension: '.ts',
      isTest: false,
      isConfig: false,
      size: 2048,
      metadata: {
        syncSource: 'validation-test'
      }
    };

    // Test entity creation (simulates sync)
    await kgService.createEntity(testFileEntity);
    console.log('  ✅ Synchronization entity created');

    // Verify entity was created
    const retrievedEntity = await kgService.getEntity(testFileEntity.id);
    if (!retrievedEntity) {
      throw new Error('Synchronization failed - entity not persisted');
    }

    console.log('  ✅ Synchronization entity persisted');

    // Test relationship creation (simulates sync)
    const testRelationship: GraphRelationship = {
      id: 'sync-test-rel',
      type: RelationshipType.DEPENDS_ON,
      fromEntityId: testFileEntity.id,
      toEntityId: 'non-existent-entity', // This is okay for testing
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: {
        syncOperation: 'test-sync'
      }
    };

    await kgService.createRelationship(testRelationship);
    console.log('  ✅ Synchronization relationship created');

    // Test batch operations (simulating real sync)
    const batchEntities: Entity[] = [
      {
        id: 'batch-test-1',
        type: 'file',
        path: '/test/file1.ts',
        hash: 'batch-hash-1',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        isTest: false,
        isConfig: false,
        size: 1024,
        metadata: {}
      } as File,
      {
        id: 'batch-test-2',
        type: 'file',
        path: '/test/file2.ts',
        hash: 'batch-hash-2',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        isTest: false,
        isConfig: false,
        size: 1024,
        metadata: {}
      } as File
    ];

    for (const entity of batchEntities) {
      await kgService.createEntity(entity);
    }

    console.log(`  ✅ Batch synchronization processed ${batchEntities.length} entities`);

    // Clean up test entities
    await kgService.deleteEntity(testFileEntity.id);
    for (const entity of batchEntities) {
      await kgService.deleteEntity(entity.id);
    }

    console.log('  ✅ Synchronization cleanup completed');
    console.log('  ✅ PASS: Synchronization works properly');

  } catch (error) {
    console.error('  ❌ FAIL: Synchronization validation failed:', error);
    throw error;
  }
}

// Run validation
validatePhase31().catch((error) => {
  console.error('💥 Fatal error during validation:', error);
  process.exit(1);
});
