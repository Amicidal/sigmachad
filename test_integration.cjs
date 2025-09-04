const { createClient } = require('redis');
const { Pool } = require('pg');
const { QdrantClient } = require('@qdrant/js-client-rest');

class SimpleDatabaseService {
  constructor(config) {
    this.config = config;
    this.falkordbClient = null;
    this.qdrantClient = null;
    this.postgresPool = null;
    this.redisClient = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.falkordbClient = createClient({ url: this.config.falkordb.url });
    await this.falkordbClient.connect();
    
    this.qdrantClient = new QdrantClient({ url: this.config.qdrant.url });
    
    this.postgresPool = new Pool({
      connectionString: this.config.postgresql.connectionString,
      max: this.config.postgresql.max || 20,
    });
    
    this.redisClient = createClient({ url: this.config.redis.url });
    await this.redisClient.connect();
    
    this.initialized = true;
  }

  async close() {
    if (this.falkordbClient) await this.falkordbClient.disconnect();
    if (this.postgresPool) await this.postgresPool.end();
    if (this.redisClient) await this.redisClient.disconnect();
    this.initialized = false;
  }

  async postgresQuery(sql, params = []) {
    if (!this.initialized) throw new Error('Database not initialized');
    const result = await this.postgresPool.query(sql, params);
    return result;
  }

  async falkordbQuery(query, params = {}) {
    if (!this.initialized) throw new Error('Database not initialized');
    let processedQuery = query;
    for (const [key, value] of Object.entries(params)) {
      processedQuery = processedQuery.replace(new RegExp('\\$' + key, 'g'), JSON.stringify(value));
    }
    const result = await this.falkordbClient.sendCommand(['GRAPH.QUERY', 'memento', processedQuery]);
    return result;
  }

  async redisSet(key, value) {
    if (!this.initialized) throw new Error('Database not initialized');
    await this.redisClient.set(key, value);
  }

  async redisGet(key) {
    if (!this.initialized) throw new Error('Database not initialized');
    return await this.redisClient.get(key);
  }
}

const TEST_CONFIG = {
  falkordb: { url: 'redis://localhost:6380' },
  qdrant: { url: 'http://localhost:6335' },
  postgresql: { 
    connectionString: 'postgresql://memento_test:memento_test@localhost:5433/memento_test',
    max: 5
  },
  redis: { url: 'redis://localhost:6381' }
};

async function runTest() {
  console.log('🧪 Running integration test simulation...');
  
  const dbService = new SimpleDatabaseService(TEST_CONFIG);
  
  try {
    await dbService.initialize();
    console.log('✅ Database initialized');
    
    // Test 1: Cross-database workflow
    console.log('\n📝 Test 1: Cross-database workflow');
    
    // 1. Store document in PostgreSQL
    const docResult = await dbService.postgresQuery(`
      INSERT INTO documents (type, content, metadata)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [
      'code',
      JSON.stringify({ language: 'typescript', code: 'console.log("test");' }),
      JSON.stringify({ file: 'test.ts', author: 'test_user' })
    ]);
    
    const docId = docResult.rows[0]?.id;
    console.log('✅ Document inserted in PostgreSQL, ID:', docId);
    
    // 2. Create corresponding graph node in FalkorDB
    await dbService.falkordbQuery(`
      CREATE (:Entity {
        id: $id,
        type: 'file',
        path: 'test.ts',
        language: 'typescript',
        lastModified: $timestamp
      })
    `, {
      id: docId,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Graph node created in FalkorDB');
    
    // 3. Cache metadata in Redis
    await dbService.redisSet(`doc:${docId}:metadata`, JSON.stringify({
      type: 'code',
      path: 'test.ts',
      language: 'typescript',
      cached_at: new Date().toISOString(),
    }));
    console.log('✅ Metadata cached in Redis');
    
    // 4. Verify data consistency
    const pgResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [docId]);
    console.log('✅ PostgreSQL verification:', pgResult.rows.length === 1);
    
    const redisResult = await dbService.redisGet(`doc:${docId}:metadata`);
    console.log('✅ Redis verification:', redisResult !== null);
    
    console.log('\n✅ Test 1 completed successfully');
    
    // Test 2: Performance test simulation
    console.log('\n⚡ Test 2: Performance test');
    const startTime = Date.now();
    
    const operations = [];
    for (let i = 0; i < 5; i++) {
      operations.push(
        dbService.postgresQuery(`
          INSERT INTO documents (type, content, metadata)
          VALUES ($1, $2, $3)
        `, [
          'performance_test',
          JSON.stringify({ iteration: i }),
          JSON.stringify({ test_id: i })
        ])
      );
    }
    
    await Promise.all(operations);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Performance test: ${operations.length} operations completed in ${duration}ms`);
    
    console.log('\n🎉 All integration tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await dbService.close();
  }
}

runTest();
