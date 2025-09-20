#!/usr/bin/env tsx

import 'dotenv/config';
import {
  createDatabaseConfig,
  DatabaseService,
} from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { TemporalHistoryValidator } from '../src/jobs/TemporalHistoryValidator.js';

interface CLIOptions {
  autoRepair: boolean;
  dryRun: boolean;
  batchSize?: number;
  timelineLimit?: number;
  maxEntities?: number;
  quiet: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = {
    autoRepair: false,
    dryRun: true,
    quiet: false,
  };

  const takeNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw) continue;

    if (raw === '--help' || raw === '-h') {
      console.log(`Usage: pnpm tsx scripts/backfill-temporal-history.ts [options]\n\n` +
        `Options:\n` +
        `  --repair            Apply auto-repair for missing PREVIOUS_VERSION links (implies --no-dry-run)\n` +
        `  --dry-run           Do not persist repairs (default)\n` +
        `  --batch-size <n>    Limit entities processed per batch (default 25)\n` +
        `  --timeline-limit <n>  Limit versions fetched per entity (default 200)\n` +
        `  --max-entities <n>  Hard cap on entities scanned before exiting\n` +
        `  --quiet             Suppress per-entity logs\n`);
      process.exit(0);
    }

    if (raw === '--repair') {
      options.autoRepair = true;
      options.dryRun = false;
      continue;
    }
    if (raw === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (raw === '--quiet') {
      options.quiet = true;
      continue;
    }

    const [flag, inlineValue] = raw.includes('=') ? raw.split('=', 2) : [raw, undefined];
    let value = inlineValue;
    if (!value && argv[index + 1] && !argv[index + 1].startsWith('--')) {
      value = argv[index + 1];
      index += 1;
    }

    switch (flag) {
      case '--batch-size':
        options.batchSize = takeNumber(value);
        break;
      case '--timeline-limit':
        options.timelineLimit = takeNumber(value);
        break;
      case '--max-entities':
        options.maxEntities = takeNumber(value);
        break;
      default:
        console.warn(`⚠️ Unknown option ${flag}; ignoring.`);
        break;
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.quiet) {
    console.log('🧭 Temporal history backfill starting...', {
      autoRepair: options.autoRepair,
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      timelineLimit: options.timelineLimit,
      maxEntities: options.maxEntities,
    });
  }

  const config = createDatabaseConfig();
  const dbService = new DatabaseService(config);
  await dbService.initialize();
  await dbService.setupDatabase();

  const kgService = new KnowledgeGraphService(dbService);
  await kgService.initialize();

  const validator = new TemporalHistoryValidator(kgService);
  const report = await validator.validate({
    batchSize: options.batchSize,
    timelineLimit: options.timelineLimit,
    maxEntities: options.maxEntities,
    autoRepair: options.autoRepair,
    dryRun: options.dryRun,
    logger: options.quiet
      ? undefined
      : (message, context) => {
          console.log(`[${message}]`, context ?? {});
        },
  });

  console.log('📊 Temporal history validation report', {
    scannedEntities: report.scannedEntities,
    inspectedVersions: report.inspectedVersions,
    repairedLinks: report.repairedLinks,
    issues: report.issues.length,
    dryRun: options.dryRun,
  });

  if (report.issues.length > 0 && !options.autoRepair) {
    console.warn('⚠️ Issues detected. Run again with --repair to attempt auto-repair.');
  }

  await dbService.close().catch((error) => {
    console.warn('⚠️ Failed to close database service cleanly', error);
  });
}

main().catch((error) => {
  console.error('❌ Temporal history backfill failed', error);
  process.exitCode = 1;
});
