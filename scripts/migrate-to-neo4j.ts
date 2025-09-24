#!/usr/bin/env tsx

/**
 * Migration Script: FalkorDB + Qdrant → Neo4j
 *
 * This script migrates data from FalkorDB (graph) and Qdrant (vectors)
 * to a unified Neo4j database with native vector support.
 */

import { createClient as createRedisClient } from 'redis';
import { QdrantClient } from '@qdrant/js-client-rest';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../src/services/database/Neo4jService.js';

interface MigrationConfig {
  source: {
    falkordb: {
      url: string;
      database?: number;
    };
    qdrant: {
      url: string;
      apiKey?: string;
    };
  };
  target: {
    neo4j: {
      uri: string;
      username: string;
      password: string;
      database?: string;
    };
  };
}

class DataMigrator {
  private falkorClient: any;
  private qdrantClient: QdrantClient;
  private neo4jService: Neo4jService;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.qdrantClient = new QdrantClient({
      url: config.source.qdrant.url,
      apiKey: config.source.qdrant.apiKey,
    });
    this.neo4jService = new Neo4jService(config.target.neo4j);
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing migration services...');

    // Connect to FalkorDB (Redis)
    this.falkorClient = createRedisClient({
      url: this.config.source.falkordb.url,
      database: this.config.source.falkordb.database || 0,
    });
    await this.falkorClient.connect();
    console.log('✅ Connected to FalkorDB');

    // Test Qdrant connection
    await this.qdrantClient.getCollections();
    console.log('✅ Connected to Qdrant');

    // Initialize Neo4j
    await this.neo4jService.initialize();
    await this.neo4jService.setupGraph();
    await this.neo4jService.setupVectorIndexes();
    console.log('✅ Connected to Neo4j');
  }

  async migrateGraphData(): Promise<void> {
    console.log('\n📊 Migrating graph data from FalkorDB to Neo4j...');

    try {
      // Export all nodes from FalkorDB
      const nodesResult = await this.falkorClient.sendCommand([
        'GRAPH.QUERY',
        'memento',
        'MATCH (n) RETURN n, labels(n) as labels LIMIT 10000',
      ]);

      if (!nodesResult || !Array.isArray(nodesResult)) {
        console.log('⚠️ No nodes found in FalkorDB');
        return;
      }

      const [headers, data] = nodesResult;
      console.log(`Found ${data?.length || 0} nodes to migrate`);

      // Migrate nodes to Neo4j
      const session = this.neo4jService.getDriver().session();
      let migratedCount = 0;

      for (const row of data || []) {
        if (!row || !Array.isArray(row)) continue;

        const [node, labels] = row;
        if (!node || typeof node !== 'object') continue;

        // Extract properties and labels
        const props = { ...node };
        delete props.id; // Remove FalkorDB internal ID

        const nodeLabels = Array.isArray(labels) ? labels.join(':') : 'Entity';

        try {
          await session.run(
            `CREATE (n:${nodeLabels})
             SET n = $props`,
            { props }
          );
          migratedCount++;

          if (migratedCount % 100 === 0) {
            console.log(`  Migrated ${migratedCount} nodes...`);
          }
        } catch (error) {
          console.error(`Failed to migrate node:`, error);
        }
      }

      await session.close();
      console.log(`✅ Migrated ${migratedCount} nodes`);

      // Now migrate relationships
      await this.migrateRelationships();
    } catch (error) {
      console.error('❌ Graph migration failed:', error);
      throw error;
    }
  }

  async migrateRelationships(): Promise<void> {
    console.log('\n🔗 Migrating relationships from FalkorDB to Neo4j...');

    try {
      const relsResult = await this.falkorClient.sendCommand([
        'GRAPH.QUERY',
        'memento',
        'MATCH (a)-[r]->(b) RETURN id(a) as fromId, id(b) as toId, type(r) as type, properties(r) as props LIMIT 10000',
      ]);

      if (!relsResult || !Array.isArray(relsResult)) {
        console.log('⚠️ No relationships found in FalkorDB');
        return;
      }

      const [headers, data] = relsResult;
      console.log(`Found ${data?.length || 0} relationships to migrate`);

      const session = this.neo4jService.getDriver().session();
      let migratedCount = 0;

      for (const row of data || []) {
        if (!row || !Array.isArray(row)) continue;

        const [fromId, toId, type, props] = row;

        try {
          await session.run(
            `MATCH (a {falkorId: $fromId}), (b {falkorId: $toId})
             CREATE (a)-[r:${type}]->(b)
             SET r = $props`,
            { fromId, toId, props: props || {} }
          );
          migratedCount++;

          if (migratedCount % 100 === 0) {
            console.log(`  Migrated ${migratedCount} relationships...`);
          }
        } catch (error) {
          console.error(`Failed to migrate relationship:`, error);
        }
      }

      await session.close();
      console.log(`✅ Migrated ${migratedCount} relationships`);
    } catch (error) {
      console.error('❌ Relationship migration failed:', error);
      throw error;
    }
  }

  async migrateVectorData(): Promise<void> {
    console.log('\n🧮 Migrating vector embeddings from Qdrant to Neo4j...');

    const collections = [
      'code_embeddings',
      'documentation_embeddings',
      'integration_test',
    ];

    for (const collection of collections) {
      try {
        console.log(`\n  Processing collection: ${collection}`);

        let offset = 0;
        const limit = 100;
        let totalMigrated = 0;

        while (true) {
          // Scroll through Qdrant collection
          const response = await this.qdrantClient.scroll(collection, {
            limit,
            offset,
            with_payload: true,
            with_vector: true,
          });

          if (!response.points || response.points.length === 0) {
            break;
          }

          // Migrate each point to Neo4j
          for (const point of response.points) {
            try {
              await this.neo4jService.upsertVector(
                collection,
                point.id.toString(),
                point.vector as number[],
                point.payload || {}
              );
              totalMigrated++;
            } catch (error) {
              console.error(`Failed to migrate vector ${point.id}:`, error);
            }
          }

          console.log(`    Migrated ${totalMigrated} vectors...`);

          if (response.points.length < limit) {
            break;
          }

          offset += limit;
        }

        console.log(
          `  ✅ Migrated ${totalMigrated} vectors from ${collection}`
        );
      } catch (error: any) {
        if (error.status === 404 || error.message?.includes('Not found')) {
          console.log(`  ⚠️ Collection ${collection} not found in Qdrant`);
        } else {
          console.error(`  ❌ Failed to migrate ${collection}:`, error);
        }
      }
    }
  }

  async verifyMigration(): Promise<void> {
    console.log('\n🔍 Verifying migration...');

    const session = this.neo4jService.getDriver().session();

    try {
      // Count nodes
      const nodeCountResult = await session.run(
        'MATCH (n) RETURN count(n) as count'
      );
      const nodeCount = nodeCountResult.records[0].get('count').toNumber();
      console.log(`  Nodes in Neo4j: ${nodeCount}`);

      // Count relationships
      const relCountResult = await session.run(
        'MATCH ()-[r]->() RETURN count(r) as count'
      );
      const relCount = relCountResult.records[0].get('count').toNumber();
      console.log(`  Relationships in Neo4j: ${relCount}`);

      // Count vectors by type
      const vectorTypes = ['CodeEmbedding', 'DocEmbedding', 'TestEmbedding'];
      for (const type of vectorTypes) {
        const vectorResult = await session.run(
          `MATCH (n:${type}) RETURN count(n) as count`
        );
        const count = vectorResult.records[0].get('count').toNumber();
        console.log(`  ${type} vectors: ${count}`);
      }
    } finally {
      await session.close();
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up connections...');

    if (this.falkorClient) {
      await this.falkorClient.disconnect();
    }

    await this.neo4jService.close();

    console.log('✅ Cleanup complete');
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.migrateGraphData();
      await this.migrateVectorData();
      await this.verifyMigration();
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  const config: MigrationConfig = {
    source: {
      falkordb: {
        url: process.env.OLD_FALKORDB_URL || 'redis://localhost:6379',
        database: 0,
      },
      qdrant: {
        url: process.env.OLD_QDRANT_URL || 'http://localhost:6333',
        apiKey: process.env.OLD_QDRANT_API_KEY,
      },
    },
    target: {
      neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'memento123',
        database: process.env.NEO4J_DATABASE || 'neo4j',
      },
    },
  };

  console.log('🚀 Starting FalkorDB + Qdrant → Neo4j Migration');
  console.log('================================================');

  const migrator = new DataMigrator(config);
  await migrator.run();

  console.log('\n✨ Migration complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
}

export { DataMigrator, MigrationConfig };
