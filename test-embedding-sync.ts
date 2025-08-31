import { DatabaseService, createDatabaseConfig } from './src/services/DatabaseService.js';
import { KnowledgeGraphService } from './src/services/KnowledgeGraphService.js';
import { Entity, SymbolEntity } from './src/models/entities.js';

async function testEmbeddingSync() {
  console.log('Testing embedding synchronization...\n');
  
  const dbConfig = createDatabaseConfig();
  const dbService = new DatabaseService(dbConfig);
  const kgService = new KnowledgeGraphService(dbService);
  
  await dbService.initialize();
  
  try {
    // Create a test entity
    const testEntity: SymbolEntity = {
      id: 'test-sync-entity-' + Date.now(),
      type: 'symbol',
      name: 'testSyncFunction',
      path: '/test/sync.ts:testSyncFunction',
      kind: 'function',
      signature: 'function testSyncFunction(): void',
      documentation: 'Initial documentation',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date()
    };
    
    console.log('1️⃣ Creating test entity...');
    await kgService.createEntity(testEntity);
    console.log(`   Created: ${testEntity.id}`);
    
    // Check if embedding was created
    const numericId = Math.abs(hashCode(testEntity.id));
    console.log(`   Numeric ID for Qdrant: ${numericId}`);
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check embedding exists
    const searchResult = await dbService.qdrant.scroll('code_embeddings', {
      filter: {
        must: [{
          key: 'entityId',
          match: { value: testEntity.id }
        }]
      },
      limit: 1,
      with_payload: true,
      with_vector: false
    });
    
    if (searchResult.points && searchResult.points.length > 0) {
      console.log('   ✅ Embedding created successfully');
      const originalPayload = searchResult.points[0].payload;
      console.log(`   Original payload: ${JSON.stringify(originalPayload, null, 2)}`);
    } else {
      console.log('   ❌ No embedding found after creation');
    }
    
    // 2. Update the entity
    console.log('\n2️⃣ Updating entity...');
    const updates = {
      documentation: 'Updated documentation with more details',
      signature: 'function testSyncFunction(param: string): boolean'
    };
    
    await kgService.updateEntity(testEntity.id, updates);
    console.log('   Entity updated');
    
    // Wait for update to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if embedding was updated
    const updatedSearch = await dbService.qdrant.scroll('code_embeddings', {
      filter: {
        must: [{
          key: 'entityId',
          match: { value: testEntity.id }
        }]
      },
      limit: 1,
      with_payload: true,
      with_vector: false
    });
    
    if (updatedSearch.points && updatedSearch.points.length > 0) {
      console.log('   ✅ Embedding still exists after update');
      const updatedPayload = updatedSearch.points[0].payload;
      
      // The embedding vector should be different (but we can't easily check that without vectors)
      // At minimum, the payload should reflect any metadata changes
      console.log(`   Updated payload: ${JSON.stringify(updatedPayload, null, 2)}`);
    } else {
      console.log('   ❌ Embedding missing after update');
    }
    
    // 3. Delete the entity
    console.log('\n3️⃣ Deleting entity...');
    await kgService.deleteEntity(testEntity.id);
    console.log('   Entity deleted');
    
    // Wait for deletion to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if embedding was deleted
    const deletedSearch = await dbService.qdrant.scroll('code_embeddings', {
      filter: {
        must: [{
          key: 'entityId',
          match: { value: testEntity.id }
        }]
      },
      limit: 1,
      with_payload: true
    });
    
    if (!deletedSearch.points || deletedSearch.points.length === 0) {
      console.log('   ✅ Embedding correctly deleted');
    } else {
      console.log('   ❌ Embedding still exists after entity deletion');
    }
    
    console.log('\n✅ Synchronization test complete');
    
  } catch (error) {
    console.error('Error during sync test:', error);
  } finally {
    await dbService.close();
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

testEmbeddingSync();
