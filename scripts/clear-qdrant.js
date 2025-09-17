#!/usr/bin/env node

import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';

const DEFAULT_URL = 'http://localhost:6333';
const DEFAULT_COLLECTIONS = [
  'code_embeddings',
  'documentation_embeddings',
  'integration_test',
];

async function main() {
  const url = process.env.QDRANT_URL || DEFAULT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const collectionsToDelete = (process.env.QDRANT_COLLECTIONS || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const targets = collectionsToDelete.length > 0 ? collectionsToDelete : DEFAULT_COLLECTIONS;

  console.log(`🧹 Clearing Qdrant collections at ${url}`);

  const client = new QdrantClient({ url, apiKey });

  const existingCollections = await client.getCollections();
  const existing = new Set((existingCollections.collections || []).map((c) => c.name));

  let deleted = 0;
  for (const name of targets) {
    if (!existing.has(name)) {
      console.log(`ℹ️ Collection '${name}' does not exist – skipping`);
      continue;
    }
    await client.deleteCollection(name);
    console.log(`✅ Deleted collection '${name}'`);
    deleted += 1;
  }

  if (deleted === 0) {
    console.log('ℹ️ No collections needed deletion.');
  } else {
    console.log(`🗑️ Removed ${deleted} collections from Qdrant`);
  }
}

main().catch((err) => {
  console.error('❌ Failed to clear Qdrant collections:', err);
  process.exitCode = 1;
});
