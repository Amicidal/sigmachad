#!/usr/bin/env tsx

import "dotenv/config";

import {
  createDatabaseConfig,
  DatabaseService,
} from "../src/services/DatabaseService.js";
import {
  computeStructuralBackfillUpdate,
  type StructuralRelationshipSnapshot,
} from "../src/services/relationships/structuralPersistence.js";

interface CLIOptions {
  batchSize: number;
  dryRun: boolean;
  quiet: boolean;
  max?: number;
}

const STRUCTURAL_QUERY = `
MATCH (a)-[r]->(b)
WHERE type(r) IN ['CONTAINS','DEFINES','EXPORTS','IMPORTS']
RETURN
  r.id AS id,
  type(r) AS type,
  a.id AS fromId,
  b.id AS toId,
  r.created AS created,
  r.lastModified AS lastModified,
  r.version AS version,
  r.importAlias AS importAlias,
  r.importType AS importType,
  r.isNamespace AS isNamespace,
  r.isReExport AS isReExport,
  r.reExportTarget AS reExportTarget,
  r.language AS language,
  r.symbolKind AS symbolKind,
  r.modulePath AS modulePath,
  r.resolutionState AS resolutionState,
  r.importDepth AS importDepth,
  r.confidence AS confidence,
  r.scope AS scope,
  r.firstSeenAt AS firstSeenAt,
  r.lastSeenAt AS lastSeenAt,
  r.metadata AS metadata
ORDER BY r.id
SKIP $skip
LIMIT $limit
`;

const UPDATE_QUERY = `
UNWIND $rows AS row
MATCH ()-[r {id: row.id}]->()
SET r.importAlias = row.importAlias,
    r.importType = row.importType,
    r.isNamespace = row.isNamespace,
    r.isReExport = row.isReExport,
    r.reExportTarget = row.reExportTarget,
    r.language = row.language,
    r.symbolKind = row.symbolKind,
    r.modulePath = row.modulePath,
    r.resolutionState = row.resolutionState,
    r.importDepth = row.importDepth,
    r.confidence = row.confidence,
    r.scope = row.scope,
    r.firstSeenAt = coalesce(row.firstSeenAt, r.firstSeenAt),
    r.lastSeenAt = coalesce(row.lastSeenAt, r.lastSeenAt),
    r.metadata = row.metadata
`;

const parseArgs = (argv: string[]): CLIOptions => {
  const options: CLIOptions = {
    batchSize: 200,
    dryRun: true,
    quiet: false,
  };

  const takeNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.floor(parsed);
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw) continue;

    if (raw === "--help" || raw === "-h") {
      console.log(
        "Usage: pnpm tsx scripts/backfill-structural-metadata.ts [options]\n\n" +
          "Options:\n" +
          "  --apply           Persist updates (default is dry-run)\n" +
          "  --dry-run         Preview changes without writing (default)\n" +
          "  --batch-size <n>  Relationships to scan per batch (default 200)\n" +
          "  --max <n>         Maximum relationships to inspect before stopping\n" +
          "  --quiet           Reduce per-batch logging\n"
      );
      process.exit(0);
    }

    if (raw === "--apply") {
      options.dryRun = false;
      continue;
    }
    if (raw === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (raw === "--quiet") {
      options.quiet = true;
      continue;
    }

    const [flag, inlineValue] = raw.includes("=") ? raw.split("=", 2) : [raw, undefined];
    let value = inlineValue;
    if (!value && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      value = argv[index + 1];
      index += 1;
    }

    switch (flag) {
      case "--batch-size": {
        const parsed = takeNumber(value);
        if (parsed) options.batchSize = parsed;
        break;
      }
      case "--max": {
        const parsed = takeNumber(value);
        if (parsed) options.max = parsed;
        break;
      }
      default: {
        console.warn(`⚠️ Unknown option ${flag}; ignoring.`);
        break;
      }
    }
  }

  return options;
};

const toSnapshot = (row: any): StructuralRelationshipSnapshot => ({
  id: row.id as string,
  type: row.type as string,
  fromId: row.fromId as string,
  toId: row.toId as string,
  created: row.created as string | null,
  lastModified: row.lastModified as string | null,
  version: typeof row.version === "number" ? row.version : 1,
  importAlias: row.importAlias,
  importType: row.importType,
  isNamespace: row.isNamespace,
  isReExport: row.isReExport,
  reExportTarget: row.reExportTarget,
  language: row.language,
  symbolKind: row.symbolKind,
  modulePath: row.modulePath,
  resolutionState: row.resolutionState,
  importDepth: row.importDepth,
  confidence: row.confidence,
  scope: row.scope,
  firstSeenAt: row.firstSeenAt,
  lastSeenAt: row.lastSeenAt,
  metadata: row.metadata,
});

const isCliExecution = (): boolean => {
  if (!process.argv[1]) return false;
  try {
    const invoked = new URL(`file://${process.argv[1]}`).href;
    return import.meta.url === invoked;
  } catch {
    return false;
  }
};

const logSummary = (
  label: string,
  total: number,
  byField: Map<string, number>,
  quiet: boolean
): void => {
  if (quiet) return;
  const fieldSummary = Object.fromEntries(byField.entries());
  console.log(label, {
    total,
    fieldSummary,
  });
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  if (!options.quiet) {
    console.log("🧭 Structural metadata backfill starting...", {
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      max: options.max,
    });
  }

  const config = createDatabaseConfig();
  const dbService = new DatabaseService(config);

  try {
    await dbService.initialize();
    await dbService.setupDatabase();

    let skip = 0;
    let scanned = 0;
    let updated = 0;
    const changedByField = new Map<string, number>();

    while (true) {
      const remaining =
        options.max !== undefined ? Math.max(options.max - scanned, 0) : undefined;
      if (remaining !== undefined && remaining <= 0) break;

      const limit =
        remaining !== undefined ? Math.min(options.batchSize, remaining) : options.batchSize;
      if (limit <= 0) break;

      const rows = (await dbService.falkordbQuery(STRUCTURAL_QUERY, {
        skip,
        limit,
      })) as any[];

      if (!rows || rows.length === 0) break;

      const snapshots = rows.map(toSnapshot);
      scanned += snapshots.length;
      skip += snapshots.length;

      const updates = snapshots
        .map((snapshot) => computeStructuralBackfillUpdate(snapshot))
        .filter((update): update is NonNullable<typeof update> => update !== null);

      for (const update of updates) {
        for (const field of update.changedFields) {
          changedByField.set(field, (changedByField.get(field) ?? 0) + 1);
        }
      }

      if (options.dryRun) {
        if (!options.quiet && updates.length > 0) {
          console.log("🔍 Dry run: relationships requiring updates", {
            count: updates.length,
            sample: updates.slice(0, 3).map((entry) => ({
              id: entry.payload.id,
              changed: entry.changedFields,
            })),
          });
        }
        continue;
      }

      if (updates.length > 0) {
        await dbService.falkordbQuery(UPDATE_QUERY, {
          rows: updates.map((entry) => entry.payload),
        });
        updated += updates.length;
        if (!options.quiet) {
          console.log("✅ Applied structural metadata updates", {
            batch: updates.length,
            totalUpdated: updated,
          });
        }
      } else if (!options.quiet) {
        console.log("ℹ️ No structural metadata changes detected for this batch");
      }
    }

    logSummary("📊 Structural metadata change summary", updated, changedByField, options.quiet);
    if (!options.quiet) {
      console.log("📦 Structural metadata backfill complete", {
        scanned,
        updated,
        dryRun: options.dryRun,
      });
    }
  } finally {
    await dbService.close().catch((error) => {
      console.warn("⚠️ Failed to close database connections cleanly", error);
    });
  }
};

if (isCliExecution()) {
  main().catch((error) => {
    console.error("❌ Structural metadata backfill failed", error);
    process.exitCode = 1;
  });
}

export { main };
