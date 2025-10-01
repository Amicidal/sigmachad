#!/usr/bin/env node

import 'dotenv/config';
import neo4j from 'neo4j-driver';

async function main() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'memento123';
  const database = process.env.NEO4J_DATABASE || 'neo4j';

  console.log(
    `🧹 Clearing Neo4j knowledge graph at ${uri} (database: ${database})...`
  );

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session({ database });

  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ All nodes and relationships deleted from Neo4j');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('❌ Failed to clear knowledge graph:', err);
  process.exitCode = 1;
});
