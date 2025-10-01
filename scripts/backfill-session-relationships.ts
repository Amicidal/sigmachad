#!/usr/bin/env tsx

import "dotenv/config";

import crypto from "crypto";

import {
  createDatabaseConfig,
  DatabaseService,
} from "../src/services/core/DatabaseService.js";
import {
  canonicalRelationshipId,
} from "../src/utils/codeEdges.js";
import {
  RelationshipType,
  SESSION_RELATIONSHIP_TYPES,
  type GraphRelationship,
} from "../src/models/relationships.js";

interface CLIOptions {
  batchSize: number;
  dryRun: boolean;
  quiet: boolean;
  max?: number;
  sessionId?: string;
}

interface SessionRow {
  id: string;
  type: string;
  fromId: string;
  toId: string;
  sessionId: string | null;
  sequenceNumber: number | null;
  timestamp: string | null;
  created: string | null;
  lastModified: string | null;
  eventId: string | null;
  actor: string | null;
  annotations: any;
  changeInfo: any;
  stateTransition: any;
  stateTransitionTo: string | null;
  impact: any;
  impactSeverity: string | null;
  metadata: any;
  raw: Record<string, unknown>;
}

interface SessionFix {
  currentId: string;
  newId: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  sessionId: string;
  sequenceNumber: number;
  timestamp: string;
  eventId?: string | null;
  actor?: string | null;
  annotations?: string[] | null;
  changeInfo?: Record<string, any> | null;
  stateTransition?: Record<string, any> | null;
  stateTransitionTo?: string | null;
  impact?: Record<string, any> | null;
  impactSeverity?: string | null;
  metadata: Record<string, any>;
  metadataString: string;
  siteHash: string;
  reasons: string[];
}

interface SessionSequenceState {
  used: Set<number>;
  nextCandidate: number;
}

const SESSION_TYPE_LIST = Array.from(SESSION_RELATIONSHIP_TYPES)
  .map((t) => `'${t}'`)
  .join(", ");

const FETCH_QUERY = `
MATCH (a)-[r]->(b)
WHERE type(r) IN [${SESSION_TYPE_LIST}]
  AND ($sessionFilter IS NULL OR r.sessionId = $sessionFilter OR a.id = $sessionFilter)
RETURN
  r.id AS id,
  type(r) AS type,
  a.id AS fromId,
  b.id AS toId,
  r.sessionId AS sessionId,
  r.sequenceNumber AS sequenceNumber,
  r.timestamp AS timestamp,
  r.created AS created,
  r.lastModified AS lastModified,
  r.eventId AS eventId,
  r.actor AS actor,
  r.annotations AS annotations,
  r.changeInfo AS changeInfo,
  r.stateTransition AS stateTransition,
  r.stateTransitionTo AS stateTransitionTo,
  r.impact AS impact,
  r.impactSeverity AS impactSeverity,
  r.metadata AS metadata,
  r.siteHash AS siteHash
ORDER BY coalesce(r.sessionId, ''),
         coalesce(r.timestamp, r.created),
         coalesce(r.sequenceNumber, -1),
         r.id
SKIP $skip
LIMIT $limit
`;

const UPDATE_QUERY = `
MATCH (a {id: $fromId})-[r {id: $currentId}]->(b {id: $toId})
SET r.id = $newId,
    r.sessionId = $sessionId,
    r.sequenceNumber = $sequenceNumber,
    r.timestamp = $timestamp,
    r.eventId = $eventId,
    r.actor = $actor,
    r.annotations = $annotations,
    r.changeInfo = $changeInfo,
    r.stateTransition = $stateTransition,
    r.stateTransitionTo = $stateTransitionTo,
    r.impact = $impact,
    r.impactSeverity = $impactSeverity,
    r.metadata = $metadata,
    r.siteHash = $siteHash
RETURN 1
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
        "Usage: pnpm tsx scripts/backfill-session-relationships.ts [options]\n\n" +
          "Options:\n" +
          "  --apply              Persist fixes (default is dry-run)\n" +
          "  --dry-run            Preview without writing (default)\n" +
          "  --batch-size <n>     Relationships per batch (default 200)\n" +
          "  --max <n>            Maximum relationships to inspect\n" +
          "  --session <session>  Limit to a single session id\n" +
          "  --quiet              Reduce per-edge logging\n"
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

    const [flag, inline] = raw.includes("=") ? raw.split("=", 2) : [raw, undefined];
    let value = inline;
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
      case "--session": {
        if (value) options.sessionId = value.trim().toLowerCase();
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

const isCliExecution = (): boolean => {
  if (!process.argv[1]) return false;
  try {
    const invoked = new URL(`file://${process.argv[1]}`).href;
    return import.meta.url === invoked;
  } catch {
    return false;
  }
};

const parseMetadata = (value: unknown): Record<string, any> => {
  if (value == null) return {};
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return JSON.parse(JSON.stringify(parsed));
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof value === "object") {
    return JSON.parse(JSON.stringify(value));
  }
  return {};
};

const cloneObject = (value: unknown): Record<string, any> | null => {
  if (!value || typeof value !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const sanitizeStringArray = (
  value: unknown,
  maxItems = 50,
  maxLength = 512
): string[] | null => {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    out.push(trimmed.slice(0, maxLength));
    if (out.length >= maxItems) break;
  }
  return out.length > 0 ? Array.from(new Set(out)) : null;
};

const toISO = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }
  return null;
};

const sortObject = (input: any): any => {
  if (Array.isArray(input)) return input.map(sortObject);
  if (input && typeof input === "object") {
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(input).sort()) {
      sorted[key] = sortObject((input as any)[key]);
    }
    return sorted;
  }
  return input;
};

const stableStringify = (value: Record<string, any>): string =>
  JSON.stringify(sortObject(value ?? {}));

const computeSiteHash = (
  sessionId: string,
  sequenceNumber: number,
  type: RelationshipType,
  changeInfo: Record<string, any> | null
): string => {
  const payload = JSON.stringify({
    sessionId,
    sequenceNumber,
    type,
    changeInfo,
  });
  return (
    "sh_" +
    crypto.createHash("sha1").update(payload).digest("hex").slice(0, 16)
  );
};

const coerceSequenceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return null;
};

const determineSessionId = (
  row: SessionRow,
  metadata: Record<string, any>
): string | null => {
  if (row.sessionId && typeof row.sessionId === "string") {
    return row.sessionId.trim().toLowerCase();
  }
  const mdSession = metadata.sessionId || metadata.session_id;
  if (typeof mdSession === "string" && mdSession.trim()) {
    return mdSession.trim().toLowerCase();
  }
  if (typeof row.fromId === "string" && row.fromId.trim()) {
    return row.fromId.trim().toLowerCase();
  }
  return null;
};

const prepareGraphRelationship = (
  row: SessionRow,
  sessionId: string,
  sequenceNumber: number,
  timestampIso: string | null,
  actor: string | null,
  eventId: string | null,
  annotations: string[] | null,
  changeInfo: Record<string, any> | null,
  stateTransition: Record<string, any> | null,
  impact: Record<string, any> | null
): GraphRelationship => {
  const createdIso = toISO(row.created) ?? new Date().toISOString();
  const lastModifiedIso = toISO(row.lastModified) ?? createdIso;
  return {
    id: row.id,
    fromEntityId: row.fromId,
    toEntityId: row.toId,
    type: row.type as RelationshipType,
    created: new Date(createdIso),
    lastModified: new Date(lastModifiedIso),
    version: 1,
    sessionId,
    sequenceNumber,
    timestamp: timestampIso ? new Date(timestampIso) : new Date(createdIso),
    eventId: eventId ?? undefined,
    actor: actor ?? undefined,
    annotations: annotations ?? undefined,
    changeInfo: changeInfo ?? undefined,
    stateTransition: stateTransition ?? undefined,
    impact: impact ?? undefined,
  } as GraphRelationship;
};

const extractSessionRows = (rows: any[]): SessionRow[] =>
  rows.map((row) => ({
    id: String(row.id),
    type: String(row.type),
    fromId: String(row.fromId),
    toId: String(row.toId),
    sessionId: row.sessionId == null ? null : String(row.sessionId),
    sequenceNumber: coerceSequenceNumber(row.sequenceNumber),
    timestamp: toISO(row.timestamp) ?? toISO(row.created),
    created: toISO(row.created),
    lastModified: toISO(row.lastModified),
    eventId:
      row.eventId == null || row.eventId === ""
        ? null
        : String(row.eventId),
    actor:
      row.actor == null || row.actor === "" ? null : String(row.actor).trim(),
    annotations: row.annotations,
    changeInfo: row.changeInfo,
    stateTransition: row.stateTransition,
    stateTransitionTo:
      row.stateTransitionTo == null
        ? null
        : String(row.stateTransitionTo).toLowerCase(),
    impact: row.impact,
    impactSeverity:
      row.impactSeverity == null
        ? null
        : String(row.impactSeverity).toLowerCase(),
    metadata: row.metadata,
    raw: row,
  }));

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  if (!options.quiet) {
    console.log("🧭 Session relationship backfill starting...", {
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      max: options.max,
      sessionId: options.sessionId,
    });
  }

  const config = createDatabaseConfig();
  const db = new DatabaseService(config);
  await db.initialize();
  const graph = db.getGraphService();

  let skip = 0;
  let scanned = 0;
  const updates: SessionFix[] = [];
  const problems: Array<{ id: string; reason: string }> = [];
  const sessionStates = new Map<string, SessionSequenceState>();

  const stats = {
    sequenceAssigned: 0,
    duplicateSequence: 0,
    idChanges: 0,
    metadataChanges: 0,
    siteHashChanges: 0,
  };

  const allocateSequence = (sessionId: string, preferred: number | null) => {
    let state = sessionStates.get(sessionId);
    if (!state) {
      state = { used: new Set<number>(), nextCandidate: 0 };
      sessionStates.set(sessionId, state);
    }
    if (preferred != null && !state.used.has(preferred)) {
      state.used.add(preferred);
      if (preferred >= state.nextCandidate) {
        state.nextCandidate = preferred + 1;
      }
      return preferred;
    }
    let candidate = state.nextCandidate;
    while (state.used.has(candidate)) {
      candidate += 1;
    }
    state.used.add(candidate);
    state.nextCandidate = candidate + 1;
    return candidate;
  };

  try {
    while (true) {
      const rows = await graph.query(FETCH_QUERY, {
        skip,
        limit: options.batchSize,
        sessionFilter: options.sessionId ?? null,
      });
      if (!rows || rows.length === 0) break;

      const sessionRows = extractSessionRows(rows);
      for (const row of sessionRows) {
        scanned += 1;
        const metadata = parseMetadata(row.metadata);
        const sessionId = determineSessionId(row, metadata);
        if (!sessionId) {
          problems.push({ id: row.id, reason: "missing_session_id" });
          continue;
        }

        const annotations = sanitizeStringArray(row.annotations, 50, 512);
        const changeInfo = cloneObject(row.changeInfo);
        const stateTransition = cloneObject(row.stateTransition);
        const impact = cloneObject(row.impact);
        const stateTransitionTo =
          row.stateTransitionTo ??
          (stateTransition && typeof stateTransition.to === "string"
            ? String(stateTransition.to).toLowerCase()
            : null);
        const impactSeverity = (() => {
          const fromRow = row.impactSeverity;
          const fromImpact =
            impact && typeof impact.severity === "string"
              ? String(impact.severity).toLowerCase()
              : null;
          const fromMetadata =
            typeof metadata.severity === "string"
              ? String(metadata.severity).toLowerCase()
              : null;
          return (fromRow || fromImpact || fromMetadata) ?? null;
        })();

        const timestampIso = row.timestamp ?? toISO(row.created);
        if (!timestampIso) {
          problems.push({ id: row.id, reason: "missing_timestamp" });
          continue;
        }

        let preferredSequence = row.sequenceNumber;
        let needsSequenceUpdate = false;
        if (preferredSequence == null) {
          preferredSequence = allocateSequence(sessionId, null);
          needsSequenceUpdate = true;
          stats.sequenceAssigned += 1;
        } else {
          const normalized = allocateSequence(sessionId, preferredSequence);
          if (normalized !== preferredSequence) {
            // collision detected
            preferredSequence = normalized;
            needsSequenceUpdate = true;
            stats.duplicateSequence += 1;
          }
        }

        const actor = row.actor ? row.actor.slice(0, 256) : null;
        const eventId = row.eventId ? row.eventId.slice(0, 256) : null;

        const graphRel = prepareGraphRelationship(
          row,
          sessionId,
          preferredSequence,
          timestampIso,
          actor,
          eventId,
          annotations,
          changeInfo,
          stateTransition,
          impact
        );

        const canonicalId = canonicalRelationshipId(row.fromId, graphRel);
        const existingId = row.id;
        const namespacePrefix = existingId.includes("::")
          ? existingId.slice(0, existingId.lastIndexOf("::") + 2)
          : "";
        const newId = namespacePrefix + canonicalId;
        const needsIdUpdate = newId !== existingId;
        if (needsIdUpdate) stats.idChanges += 1;

        const normalizedMetadata = { ...metadata };
        normalizedMetadata.sessionId = sessionId;
        normalizedMetadata.sequenceNumber = preferredSequence;
        normalizedMetadata.timestamp = timestampIso;
        if (eventId) normalizedMetadata.eventId = eventId;
        else delete normalizedMetadata.eventId;
        if (actor) normalizedMetadata.actor = actor;
        else delete normalizedMetadata.actor;
        if (annotations) normalizedMetadata.annotations = annotations;
        else delete normalizedMetadata.annotations;
        if (changeInfo) normalizedMetadata.changeInfo = changeInfo;
        else delete normalizedMetadata.changeInfo;
        if (stateTransition) normalizedMetadata.stateTransition = stateTransition;
        else delete normalizedMetadata.stateTransition;
        if (stateTransitionTo) normalizedMetadata.stateTransitionTo = stateTransitionTo;
        else delete normalizedMetadata.stateTransitionTo;
        if (impact) normalizedMetadata.impact = impact;
        else delete normalizedMetadata.impact;
        if (impactSeverity) normalizedMetadata.severity = impactSeverity;
        else delete normalizedMetadata.severity;

        const siteHash = computeSiteHash(
          sessionId,
          preferredSequence,
          row.type as RelationshipType,
          changeInfo
        );
        normalizedMetadata.siteHash = siteHash;

        const metadataString = stableStringify(normalizedMetadata);
        const existingMetadataString = stableStringify(metadata);
        const needsMetadataUpdate = metadataString !== existingMetadataString;
        if (needsMetadataUpdate) stats.metadataChanges += 1;

        const needsSiteHashUpdate = row.raw?.siteHash !== siteHash;
        if (needsSiteHashUpdate) stats.siteHashChanges += 1;

        const reasons: string[] = [];
        if (needsIdUpdate) reasons.push("id");
        if (needsSequenceUpdate) reasons.push("sequenceNumber");
        if (needsMetadataUpdate) reasons.push("metadata");
        if (needsSiteHashUpdate) reasons.push("siteHash");
        if (stateTransitionTo && stateTransition?.to !== stateTransitionTo) {
          reasons.push("stateTransitionTo");
        }
        if (impactSeverity && impact?.severity !== impactSeverity) {
          reasons.push("impactSeverity");
        }

        if (reasons.length === 0) {
          continue;
        }

        updates.push({
          currentId: existingId,
          newId,
          fromId: row.fromId,
          toId: row.toId,
          type: row.type as RelationshipType,
          sessionId,
          sequenceNumber: preferredSequence,
          timestamp: timestampIso,
          eventId,
          actor,
          annotations,
          changeInfo,
          stateTransition,
          stateTransitionTo,
          impact,
          impactSeverity,
          metadata: metadataString,
          siteHash,
          reasons,
        });
      }

      skip += rows.length;
      if (options.max && scanned >= options.max) {
        break;
      }
      if (rows.length < options.batchSize) break;
    }
  } finally {
    await db.close();
  }

  if (!options.quiet) {
    console.log("✅ Scan complete", {
      scanned,
      updates: updates.length,
      sequenceAssigned: stats.sequenceAssigned,
      duplicateSequence: stats.duplicateSequence,
      idChanges: stats.idChanges,
      metadataChanges: stats.metadataChanges,
      siteHashChanges: stats.siteHashChanges,
      problems: problems.length,
    });
  }

  if (problems.length > 0) {
    console.warn("⚠️ Some relationships could not be normalized", problems.slice(0, 10));
    if (problems.length > 10) {
      console.warn(`...and ${problems.length - 10} more issues.`);
    }
  }

  if (updates.length === 0) {
    console.log("🎉 No changes required.");
    return;
  }

  const collisionCheck = new Map<string, Set<string>>();
  for (const fix of updates) {
    const ids = collisionCheck.get(fix.newId) || new Set();
    ids.add(fix.currentId);
    collisionCheck.set(fix.newId, ids);
  }
  const collisions = Array.from(collisionCheck.entries()).filter(
    ([, ids]) => ids.size > 1
  );
  if (collisions.length > 0) {
    console.error("🚫 Conflicting canonical ids detected:");
    for (const [newId, currentIds] of collisions) {
      console.error(`  ${newId} <= ${Array.from(currentIds).join(", ")}`);
    }
    console.error("Resolve collisions manually before applying.");
    return;
  }

  if (options.dryRun) {
    if (!options.quiet) {
      console.log("🔍 Dry-run mode; showing first few planned updates:");
      for (const fix of updates.slice(0, 10)) {
        console.log({ id: fix.currentId, newId: fix.newId, reasons: fix.reasons });
      }
      if (updates.length > 10) {
        console.log(`...and ${updates.length - 10} additional updates.`);
      }
    }
    console.log("✅ Dry-run complete. Re-run with --apply to persist changes.");
    return;
  }

  console.log(`✍️ Applying ${updates.length} updates...`);
  const configApply = createDatabaseConfig();
  const dbApply = new DatabaseService(configApply);
  await dbApply.initialize();
  const graphApply = dbApply.getGraphService();
  try {
    for (const fix of updates) {
      await graphApply.query(UPDATE_QUERY, {
        currentId: fix.currentId,
        newId: fix.newId,
        fromId: fix.fromId,
        toId: fix.toId,
        sessionId: fix.sessionId,
        sequenceNumber: fix.sequenceNumber,
        timestamp: fix.timestamp,
        eventId: fix.eventId ?? null,
        actor: fix.actor ?? null,
        annotations: fix.annotations ?? null,
        changeInfo: fix.changeInfo ?? null,
        stateTransition: fix.stateTransition ?? null,
        stateTransitionTo: fix.stateTransitionTo ?? null,
        impact: fix.impact ?? null,
        impactSeverity: fix.impactSeverity ?? null,
        metadata: fix.metadata,
        siteHash: fix.siteHash,
      });
    }
  } finally {
    await dbApply.close();
  }

  console.log("✅ Session relationship backfill complete", {
    updated: updates.length,
  });
};

if (isCliExecution()) {
  main().catch((error) => {
    console.error("❌ Backfill failed", error);
    process.exit(1);
  });
}
