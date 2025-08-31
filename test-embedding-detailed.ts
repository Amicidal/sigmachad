import { DatabaseService, createDatabaseConfig } from './src/services/DatabaseService.js';

async function testDetailedConsistency() {
  const dbConfig = createDatabaseConfig();
  const dbService = new DatabaseService(dbConfig);
  await dbService.initialize();
  
  try {
    // First, let's see the structure of entities in the graph
    const query = `MATCH (n) RETURN n LIMIT 3`;
    const entities = await dbService.falkordbQuery(query);
    
    console.log('Sample entities from graph:');
    console.log(JSON.stringify(entities, null, 2));
    
    // Now check embeddings structure
    const embeddings = await dbService.qdrant.scroll('code_embeddings', {
      limit: 3,
      with_payload: true
    });
    
    console.log('\nSample embeddings from Qdrant:');
    console.log(JSON.stringify(embeddings.points?.map(p => ({
      id: p.id,
      payload: p.payload
    })), null, 2));
    
    // Check ID mapping
    console.log('\n🔍 Checking ID mapping consistency:');
    
    if (embeddings.points && embeddings.points.length > 0) {
      const firstEmbedding = embeddings.points[0];
      const entityId = firstEmbedding.payload?.entityId;
      
      if (entityId) {
        console.log(`\nLooking for entity with ID: ${entityId}`);
        const checkQuery = `MATCH (n) WHERE n.id = $id RETURN n`;
        const result = await dbService.falkordbQuery(checkQuery, { id: entityId });
        
        if (result.length > 0) {
          console.log('✅ Found matching entity in graph');
        } else {
          console.log('❌ No matching entity found in graph');
        }
      }
    }
    
  } finally {
    await dbService.close();
  }
}

testDetailedConsistency();
