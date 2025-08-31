import { DatabaseService, createDatabaseConfig } from './src/services/DatabaseService.js';

async function testEmbeddingLookup() {
  const dbConfig = createDatabaseConfig();
  const dbService = new DatabaseService(dbConfig);
  await dbService.initialize();
  
  try {
    // Get a specific entity from graph
    const query = `MATCH (n) WHERE n.type = 'symbol' RETURN n LIMIT 3`;
    const entities = await dbService.falkordbQuery(query);
    
    console.log('Testing embedding lookup for entities:\n');
    
    for (const row of entities) {
      const entity = row.n;
      console.log(`Entity: ${entity.id} (${entity.type})`);
      
      // Try different ID formats
      const stringId = entity.id;
      const numericId = Math.abs(hashCode(stringId));
      
      console.log(`  String ID: ${stringId}`);
      console.log(`  Numeric ID: ${numericId}`);
      
      // Search by payload filter instead of ID
      const searchResult = await dbService.qdrant.scroll('code_embeddings', {
        filter: {
          must: [{
            key: 'entityId',
            match: { value: stringId }
          }]
        },
        limit: 1,
        with_payload: true
      });
      
      if (searchResult.points && searchResult.points.length > 0) {
        const point = searchResult.points[0];
        console.log(`  ✅ Found embedding with ID: ${point.id}`);
        console.log(`     Payload entityId: ${point.payload?.entityId}`);
      } else {
        console.log(`  ❌ No embedding found`);
      }
      console.log();
    }
    
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

testEmbeddingLookup();
