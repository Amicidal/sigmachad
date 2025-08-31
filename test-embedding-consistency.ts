import { DatabaseService, createDatabaseConfig } from './src/services/DatabaseService.js';
import { KnowledgeGraphService } from './src/services/KnowledgeGraphService.js';

async function checkEmbeddingConsistency() {
  console.log('Checking embedding consistency...\n');
  
  const dbConfig = createDatabaseConfig();
  const dbService = new DatabaseService(dbConfig);
  const kgService = new KnowledgeGraphService(dbService);
  
  await dbService.initialize();
  
  try {
    // 1. Get count of entities in graph
    const graphCountQuery = `MATCH (n) RETURN count(n) as count`;
    const graphResult = await dbService.falkordbQuery(graphCountQuery);
    const graphCount = graphResult[0]?.count || 0;
    console.log(`📊 Entities in graph: ${graphCount}`);
    
    // 2. Get count of embeddings in Qdrant collections
    const codeEmbeddingsCount = await dbService.qdrant.count('code_embeddings');
    const docEmbeddingsCount = await dbService.qdrant.count('documentation_embeddings');
    const totalEmbeddings = (codeEmbeddingsCount.count || 0) + (docEmbeddingsCount.count || 0);
    console.log(`🔢 Code embeddings: ${codeEmbeddingsCount.count || 0}`);
    console.log(`📚 Documentation embeddings: ${docEmbeddingsCount.count || 0}`);
    console.log(`📦 Total embeddings: ${totalEmbeddings}`);
    
    // 3. Sample check - get some entities and verify they have embeddings
    const sampleQuery = `MATCH (n) RETURN n LIMIT 10`;
    const sampleEntities = await dbService.falkordbQuery(sampleQuery);
    
    console.log('\n🔍 Sampling entity-embedding consistency:');
    let consistentCount = 0;
    let inconsistentCount = 0;
    
    for (const row of sampleEntities) {
      const entity = row.n;
      if (!entity?.id) continue;
      
      // Convert string ID to numeric for Qdrant lookup
      const numericId = Math.abs(hashCode(entity.id));
      
      try {
        // Try to find in code embeddings
        const codeResult = await dbService.qdrant.retrieve('code_embeddings', {
          ids: [numericId]
        });
        
        if (codeResult.length > 0) {
          console.log(`  ✅ ${entity.id} (${entity.type || 'unknown'}) - has embedding`);
          consistentCount++;
        } else {
          // Try documentation embeddings
          const docResult = await dbService.qdrant.retrieve('documentation_embeddings', {
            ids: [numericId]
          });
          
          if (docResult.length > 0) {
            console.log(`  ✅ ${entity.id} (${entity.type || 'unknown'}) - has embedding (doc)`);
            consistentCount++;
          } else {
            console.log(`  ❌ ${entity.id} (${entity.type || 'unknown'}) - NO EMBEDDING FOUND`);
            inconsistentCount++;
          }
        }
      } catch (error) {
        console.log(`  ⚠️  ${entity.id} - Error checking embedding`);
      }
    }
    
    console.log('\n📈 Consistency Summary:');
    console.log(`  - Graph entities: ${graphCount}`);
    console.log(`  - Total embeddings: ${totalEmbeddings}`);
    console.log(`  - Sample consistent: ${consistentCount}/${sampleEntities.length}`);
    console.log(`  - Sample inconsistent: ${inconsistentCount}/${sampleEntities.length}`);
    
    // 4. Check for orphaned embeddings (embeddings without entities)
    console.log('\n🔍 Checking for orphaned embeddings...');
    
    // Get sample of embeddings and check if entities exist
    const codeEmbeddingSample = await dbService.qdrant.scroll('code_embeddings', {
      limit: 10,
      with_payload: true
    });
    
    let orphanedCount = 0;
    for (const point of codeEmbeddingSample.points || []) {
      const entityId = point.payload?.entityId;
      if (entityId) {
        const checkQuery = `MATCH (n {id: $id}) RETURN n`;
        const result = await dbService.falkordbQuery(checkQuery, { id: entityId });
        if (result.length === 0) {
          console.log(`  ⚠️  Orphaned embedding: ${entityId}`);
          orphanedCount++;
        }
      }
    }
    
    if (orphanedCount === 0) {
      console.log('  ✅ No orphaned embeddings found in sample');
    } else {
      console.log(`  ❌ Found ${orphanedCount} orphaned embeddings in sample`);
    }
    
    // Final assessment
    console.log('\n🎯 Overall Assessment:');
    if (graphCount === 0) {
      console.log('  ⚠️  No entities in graph - system appears empty');
    } else if (totalEmbeddings === 0) {
      console.log('  ❌ No embeddings found - embeddings not being created');
    } else if (Math.abs(graphCount - totalEmbeddings) > graphCount * 0.1) {
      console.log('  ⚠️  Significant mismatch between entities and embeddings');
    } else {
      console.log('  ✅ Embeddings appear to be consistent');
    }
    
  } catch (error) {
    console.error('Error checking consistency:', error);
  } finally {
    await dbService.close();
  }
}

// Simple hash function to convert string to number
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

checkEmbeddingConsistency();
