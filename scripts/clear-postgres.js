#!/usr/bin/env node

import 'dotenv/config';
import { Client } from 'pg';

const DEFAULT_URL = 'postgresql://memento:memento@localhost:5432/memento';
const TABLES = [
  'test_coverage',
  'test_performance',
  'test_results',
  'test_suites',
  'flaky_test_analyses',
  'changes',
  'sessions',
  'documents',
  'performance_metric_snapshots',
  'coverage_history',
];

async function main() {
  const connectionString = process.env.DATABASE_URL || DEFAULT_URL;
  console.log(`🧹 Clearing PostgreSQL tables using ${connectionString}`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const tables = TABLES.map((name) => `"${name}"`).join(', ');
    const truncateSQL = `TRUNCATE TABLE IF EXISTS ${tables} RESTART IDENTITY CASCADE;`;
    await client.query(truncateSQL);
    console.log(`✅ Truncated tables: ${TABLES.join(', ')}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed to clear PostgreSQL data:', err);
  process.exitCode = 1;
});
