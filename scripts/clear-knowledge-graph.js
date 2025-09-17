#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from 'redis';

const GRAPH_KEY = process.env.FALKORDB_GRAPH_KEY || 'memento';

async function main() {
  const url = process.env.FALKORDB_URL || 'redis://localhost:6379';
  const client = createClient({ url });

  client.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });

  console.log(`🧹 Clearing knowledge graph at ${url} (graph key: ${GRAPH_KEY})...`);

  await client.connect();

  try {
    // Attempt to drop the graph entirely
    try {
      const response = await client.sendCommand(['GRAPH.DELETE', GRAPH_KEY]);
      console.log('🗑️ GRAPH.DELETE response:', response ?? '(no response)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unknown graph') || msg.includes('unknown graph')) {
        console.log('ℹ️ Graph did not exist – nothing to delete.');
      } else {
        throw err;
      }
    }

    // Also clear the keyspace that FalkorDB uses for metadata to be safe
    const pattern = `${GRAPH_KEY}:*`;
    const keys = [];
    for await (const key of client.scanIterator({ MATCH: pattern })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗂️ Removed ${keys.length} auxiliary graph keys`);
    }

    console.log('✅ Knowledge graph cleared successfully');
  } finally {
    await client.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Failed to clear knowledge graph:', err);
  process.exitCode = 1;
});
