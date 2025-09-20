/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */

import { DatabaseService } from "./DatabaseService.js";
import {
  Entity,
  CodebaseEntity,
  Spec,
  Test,
  Change,
  Session,
  File,
  FunctionSymbol,
  ClassSymbol,
} from "../models/entities.js";
import {
  GraphRelationship,
  RelationshipType,
  RelationshipQuery,
  PathQuery,
  TraversalQuery,
  isDocumentationRelationshipType,
  DocumentationCoverageScope,
  DocumentationIntent,
  DocumentationPolicyType,
  DocumentationQuality,
  DOCUMENTATION_RELATIONSHIP_TYPES,
  isStructuralRelationshipType,
  StructuralImportType,
  isPerformanceRelationshipType,
} from "../models/relationships.js";
import {
  ImpactAnalysis,
  ImpactAnalysisRequest,
  GraphSearchRequest,
  GraphExamples,
  DependencyAnalysis,
  TimeRangeParams,
  EntityTimelineEntry,
  EntityTimelineResult,
  RelationshipTimeline,
  RelationshipTimelineSegment,
  SessionChangeSummary,
  SessionChangesResult,
  ModuleChildrenResult,
  ModuleHistoryEntitySummary,
  ModuleHistoryOptions,
  ModuleHistoryRelationship,
  ModuleHistoryResult,
  ListImportsResult,
  DefinitionLookupResult,
  StructuralNavigationEntry,
} from "../models/types.js";
import { noiseConfig } from "../config/noise.js";
import { embeddingService } from "../utils/embedding.js";
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
  isCodeRelationship,
  mergeEdgeEvidence,
  mergeEdgeLocations,
  legacyStructuralRelationshipId,
} from "../utils/codeEdges.js";
import { sanitizeEnvironment } from "../utils/environment.js";
import { EventEmitter } from "events";
import crypto from "crypto";
import path from "path";
import {
  createNamespaceScope,
  NamespaceScope,
} from "./namespace/NamespaceScope.js";
import {
  normalizeStructuralRelationship as normalizeStructuralRelationshipExternal,
} from "./relationships/RelationshipNormalizer.js";
import { extractStructuralPersistenceFields } from "./relationships/structuralPersistence.js";

export interface GraphNamespaceConfig {
  id?: string;
  name?: string;
  postgresSchema?: string;
  falkorGraph?: string;
  qdrantPrefix?: string;
  codeCollection?: string;
  documentationCollection?: string;
  redisPrefix?: string;
  entityPrefix?: string;
  created?: Date;
}

type ResolvedGraphNamespace = {
  id?: string;
  label?: string;
  falkorGraph: string;
  qdrant: {
    code: string;
    documentation: string;
  };
  redisPrefix: string;
  entityPrefix: string;
};

type TemporalSegmentRecord = {
  segmentId: string;
  openedAt: string;
  closedAt?: string | null;
  changeSetId?: string;
};

type TemporalEventRecord = {
  type: "opened" | "closed";
  at: string;
  changeSetId?: string;
  segmentId?: string;
};

type TemporalMetadataRecord = {
  changeSetId?: string;
  current?: TemporalSegmentRecord;
  segments: TemporalSegmentRecord[];
  events: TemporalEventRecord[];
};

const DEFAULT_GRAPH_KEY = "memento";
const DEFAULT_QDRANT_CODE_COLLECTION = "code_embeddings";
const DEFAULT_QDRANT_DOC_COLLECTION = "documentation_embeddings";
const DEFAULT_REDIS_PREFIX = "kg:";

type ModuleChildrenOptions = {
  includeFiles?: boolean;
  includeSymbols?: boolean;
  limit?: number;
  language?: string | string[];
  symbolKind?: string | string[];
  modulePathPrefix?: string;
};

type ListImportsOptions = {
  resolvedOnly?: boolean;
  language?: string | string[];
  symbolKind?: string | string[];
  importAlias?: string | string[];
  importType?: StructuralImportType | StructuralImportType[];
  isNamespace?: boolean;
  modulePath?: string | string[];
  modulePathPrefix?: string;
  limit?: number;
};

type EnsureIndicesStats = {
  created: number;
  exists: number;
  deferred: number;
  failed: number;
};

type EnsureIndicesResult = {
  status: "completed" | "deferred" | "failed";
  stats: EnsureIndicesStats;
};

// Simple cache interface for search results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  private generateKey(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  get(key: any): T | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  set(key: any, value: T, ttl?: number): void {
    const cacheKey = this.generateKey(key);

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey !== "undefined") {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: (key: string) => boolean): void {
    for (const [key] of this.cache) {
      if (pattern(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidate a specific entry using the same key normalization used internally
  invalidateKey(key: any): void {
    const cacheKey = this.generateKey(key);
    this.invalidate((k) => k === cacheKey);
  }
}

type LocationEntry = { path?: string; line?: number; column?: number };

function collapseLocationsToEarliest(
  locations: LocationEntry[] = [],
  limit = 20
): LocationEntry[] {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const byPath = new Map<string, { location: LocationEntry; index: number }>();

  locations.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const key = entry.path ?? "";
    const existing = byPath.get(key);
    if (!existing) {
      byPath.set(key, { location: entry, index });
      return;
    }

    const existingLine =
      typeof existing.location.line === "number"
        ? existing.location.line
        : Number.POSITIVE_INFINITY;
    const incomingLine =
      typeof entry.line === "number" ? entry.line : Number.POSITIVE_INFINITY;
    if (incomingLine < existingLine) {
      byPath.set(key, { location: entry, index });
      return;
    }
    if (incomingLine > existingLine) {
      return;
    }

    const existingColumn =
      typeof existing.location.column === "number"
        ? existing.location.column
        : Number.POSITIVE_INFINITY;
    const incomingColumn =
      typeof entry.column === "number"
        ? entry.column
        : Number.POSITIVE_INFINITY;

    if (incomingColumn < existingColumn) {
      byPath.set(key, { location: entry, index });
      return;
    }
    if (incomingColumn > existingColumn) {
      return;
    }

    // Tie-breaker: retain earlier occurrence in the original list
    if (index < existing.index) {
      byPath.set(key, { location: entry, index });
    }
  });

  return Array.from(byPath.values())
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.location);
}

type TemporalTransactionStep = {
  query: string;
  params?: Record<string, any>;
};

type TemporalTransactionResult = {
  data: Array<Record<string, any>>;
  headers: string[];
};

const IMPACT_CODE_RELATIONSHIP_TYPES: RelationshipType[] = [
  RelationshipType.CALLS,
  RelationshipType.REFERENCES,
  RelationshipType.DEPENDS_ON,
  RelationshipType.IMPLEMENTS,
  RelationshipType.EXTENDS,
  RelationshipType.OVERRIDES,
  RelationshipType.TYPE_USES,
  RelationshipType.RETURNS_TYPE,
  RelationshipType.PARAM_TYPE,
];

const TEST_IMPACT_RELATIONSHIP_TYPES: RelationshipType[] = [
  RelationshipType.TESTS,
  RelationshipType.VALIDATES,
];

const DOCUMENTATION_IMPACT_RELATIONSHIP_TYPES: RelationshipType[] = [
  RelationshipType.DOCUMENTED_BY,
  RelationshipType.DESCRIBES_DOMAIN,
  RelationshipType.DOCUMENTS_SECTION,
  RelationshipType.GOVERNED_BY,
];

const SPEC_RELATIONSHIP_TYPES: RelationshipType[] = [
  RelationshipType.REQUIRES,
  RelationshipType.IMPACTS,
  RelationshipType.IMPLEMENTS_SPEC,
];

const SPEC_PRIORITY_ORDER: Record<
  "critical" | "high" | "medium" | "low",
  number
> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SPEC_IMPACT_ORDER: Record<
  "critical" | "high" | "medium" | "low",
  number
> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export class KnowledgeGraphService extends EventEmitter {
  private readonly namespace: ResolvedGraphNamespace;
  private readonly namespaceScope: NamespaceScope;
  private searchCache: SimpleCache<Entity[]>;
  private entityCache: SimpleCache<Entity>;
  private _lastPruneSummary: {
    retentionDays: number;
    cutoff: string;
    versions: number;
    closedEdges: number;
    checkpoints: number;
    dryRun?: boolean;
  } | null = null;
  private _indexesEnsured = false;
  private _indexEnsureInFlight: Promise<EnsureIndicesResult> | null = null;
  private temporalTransactionChain: Promise<void>;

  constructor(
    private db: DatabaseService,
    namespace?: GraphNamespaceConfig
  ) {
    super();
    this.namespace = this.resolveNamespace(namespace);
    this.namespaceScope = createNamespaceScope({
      entityPrefix: this.namespace.entityPrefix,
      redisPrefix: this.namespace.redisPrefix,
      qdrant: this.namespace.qdrant,
    });
    this.setMaxListeners(100); // Allow more listeners for WebSocket connections
    this.searchCache = new SimpleCache<Entity[]>(500, 300000); // Increased cache size to 500 results for 5 minutes
    this.entityCache = new SimpleCache<Entity>(1000, 600000); // Cache individual entities for 10 minutes
    // Index creation moved to initialize() method
    this.temporalTransactionChain = Promise.resolve();
  }

  private resolveNamespace(
    namespace?: GraphNamespaceConfig
  ): ResolvedGraphNamespace {
    const prefix = namespace?.qdrantPrefix ?? "";
    const codeCollection =
      namespace?.codeCollection ??
      (prefix
        ? `${prefix}code_embeddings`
        : DEFAULT_QDRANT_CODE_COLLECTION);
    const documentationCollection =
      namespace?.documentationCollection ??
      (prefix
        ? `${prefix}documentation_embeddings`
        : DEFAULT_QDRANT_DOC_COLLECTION);

    return {
      id: namespace?.id,
      label: namespace?.name ?? namespace?.id,
      falkorGraph: namespace?.falkorGraph || DEFAULT_GRAPH_KEY,
      qdrant: {
        code: codeCollection,
        documentation: documentationCollection,
      },
      redisPrefix: namespace?.redisPrefix ?? DEFAULT_REDIS_PREFIX,
      entityPrefix: namespace?.entityPrefix ?? "",
    };
  }

  private graphDbQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<any> {
    const paramBag = params ?? {};
    if (this.namespace.falkorGraph === DEFAULT_GRAPH_KEY) {
      return this.db.falkordbQuery(query, paramBag);
    }
    return this.db.falkordbQuery(query, paramBag, {
      graph: this.namespace.falkorGraph,
    });
  }

  private async runTemporalTransaction(
    steps: TemporalTransactionStep[],
    options: { graphKey?: string } = {}
  ): Promise<TemporalTransactionResult[]> {
    if (!Array.isArray(steps) || steps.length === 0) {
      return [];
    }

    const task = async (): Promise<TemporalTransactionResult[]> => {
      const graphKey =
        options.graphKey || this.namespace.falkorGraph || DEFAULT_GRAPH_KEY;

      await this.db.falkordbCommand("MULTI");

      try {
        for (const step of steps) {
          const params = step.params ?? {};
          await this.db.falkordbCommand(
            "GRAPH.QUERY",
            graphKey,
            step.query,
            params
          );
        }

        const execResult = await this.db.falkordbCommand("EXEC");
        if (!Array.isArray(execResult)) {
          throw new Error("FalkorDB EXEC returned unexpected result");
        }
        return execResult.map((raw) => this.parseGraphExecResult(raw));
      } catch (error) {
        try {
          await this.db.falkordbCommand("DISCARD");
        } catch (discardError) {
          console.warn(
            "runTemporalTransaction: failed to discard transaction",
            discardError
          );
        }
        throw error;
      }
    };

    const resultPromise = this.temporalTransactionChain.then(task, task);
    this.temporalTransactionChain = resultPromise.then(
      () => undefined,
      () => undefined
    );
    return resultPromise;
  }

  private parseGraphExecResult(raw: any): TemporalTransactionResult {
    if (!raw) {
      return { data: [], headers: [] };
    }

    if (typeof raw === "object" && raw !== null) {
      if (Array.isArray((raw as any).data) && Array.isArray((raw as any).headers)) {
        return {
          data: (raw as any).data as Array<Record<string, any>>,
          headers: ((raw as any).headers as any[]).map((h) => String(h)),
        };
      }
    }

    if (Array.isArray(raw)) {
      if (raw.length === 3 && Array.isArray(raw[0]) && Array.isArray(raw[1])) {
        const headers = (raw[0] as any[]).map((h) => String(h));
        const rows = (raw[1] as any[]).map((row) =>
          this.mapGraphRow(headers, row)
        );
        return { data: rows, headers };
      }
      if (raw.length === 1) {
        return this.parseGraphExecResult(raw[0]);
      }
      if (raw.length === 0) {
        return { data: [], headers: [] };
      }
    }

    if (
      typeof raw === "string" ||
      typeof raw === "number" ||
      typeof raw === "boolean"
    ) {
      return { data: [{ value: raw }], headers: ["value"] };
    }

    return { data: [], headers: [] };
  }

  private mapGraphRow(headers: string[], row: any): Record<string, any> {
    const record: Record<string, any> = {};
    if (!Array.isArray(headers) || !Array.isArray(row)) {
      return record;
    }
    headers.forEach((header, index) => {
      record[header] = this.decodeGraphValue(row[index]);
    });
    return record;
  }

  private decodeGraphValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value.map((v) => this.decodeGraphValue(v));
    if (typeof value === "object") {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.decodeGraphValue(v);
      }
      return out;
    }
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed === "null") return null;
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          const inner = trimmed.slice(1, -1).trim();
          if (!inner) return [];
          const parts = inner.split(",").map((p) => p.trim());
          return parts.map((part) => {
            const unquoted = part.replace(/^['"]|['"]$/g, "");
            if (/^-?\d+(?:\.\d+)?$/.test(unquoted)) return Number(unquoted);
            if (unquoted === "true") return true;
            if (unquoted === "false") return false;
            if (unquoted === "null") return null;
            return unquoted;
          });
        }
      }
    }
    return value;
  }

  private qdrantCollection(kind: "code" | "documentation"): string {
    return this.namespaceScope.qdrantCollection(kind);
  }

  private namespaceId(id: string): string {
    return this.namespaceScope.applyEntityPrefix(id);
  }

  private resolveEntityIdInput(entityId: string): string {
    return this.namespaceScope.requireEntityId(entityId);
  }

  private resolveOptionalEntityId(entityId?: string | null): string | undefined {
    return this.namespaceScope.optionalEntityId(entityId);
  }

  private resolveEntityIdArray(ids?: string[] | null): string[] | undefined {
    return this.namespaceScope.entityIdArray(ids);
  }

  private resolveRelationshipIdInput(relationshipId: string): string {
    return this.namespaceScope.requireRelationshipId(relationshipId);
  }

  private resolveOptionalRelationshipId(
    relationshipId?: string | null
  ): string | undefined {
    return this.namespaceScope.optionalRelationshipId(relationshipId);
  }

  private relationshipIdCandidates(
    ...ids: Array<string | null | undefined>
  ): string[] {
    const prefix = this.namespaceScope.entityPrefix;
    const results = new Set<string>();
    const ensure = (value: string) => {
      if (typeof value !== "string" || value.length === 0) return;
      if (!results.has(value)) {
        results.add(value);
      }
      if (prefix && value.startsWith(prefix)) {
        const without = value.slice(prefix.length);
        if (!results.has(without)) results.add(without);
      }
    };
    for (const id of ids) {
      if (typeof id !== "string" || id.length === 0) continue;
      ensure(id);
      const withoutPrefix =
        prefix && id.startsWith(prefix) ? id.slice(prefix.length) : id;
      let counterpart: string | null = null;
      if (withoutPrefix.startsWith("time-rel_")) {
        counterpart = "rel_" + withoutPrefix.slice("time-rel_".length);
      } else if (withoutPrefix.startsWith("rel_")) {
        counterpart = "time-rel_" + withoutPrefix.slice("rel_".length);
      }
      if (counterpart) {
        ensure(counterpart);
        if (prefix) ensure(`${prefix}${counterpart}`);
      }
    }
    return Array.from(results);
  }

  private stripEntityPrefix(id: string): string {
    const prefix = this.namespaceScope.entityPrefix;
    if (!prefix || !id) {
      return id;
    }
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  }

  private applyNamespaceToEntity(entity: Entity): void {
    if (!entity || typeof entity !== "object") {
      return;
    }

    const existingId = (entity as any).id;
    if (typeof existingId === "string" && existingId.length > 0) {
      (entity as any).id = this.namespaceScope.applyEntityPrefix(existingId);
      return;
    }

    const prefix = this.namespaceScope.entityPrefix;
    if (!prefix) {
      return;
    }

    const typeSlug = String((entity as any).type || "entity");
    const generated = `${typeSlug}_${crypto.randomUUID()}`;
    (entity as any).id = this.namespaceScope.applyEntityPrefix(generated);
  }

  private generateCheckpointId(seed?: string): string {
    const base = seed ?? `chk_${Date.now().toString(36)}`;
    return this.namespaceId(base);
  }

  // --- Phase 2: Dual-write auxiliary nodes for evidence, sites, candidates, and dataflow ---
  private async dualWriteAuxiliaryForEdge(
    rIn: GraphRelationship
  ): Promise<void> {
    const enable =
      String(process.env.EDGE_AUX_DUAL_WRITE || "true").toLowerCase() !==
      "false";
    if (!enable) return;
    const any: any = rIn as any;
    const edgeId = any.id as string;
    const nowISO = new Date().toISOString();

    // Upsert evidence nodes
    try {
      const ev: any[] = Array.isArray(any.evidence)
        ? any.evidence
        : Array.isArray(any.metadata?.evidence)
        ? any.metadata.evidence
        : [];
      if (Array.isArray(ev) && ev.length > 0) {
        for (const e of ev.slice(0, 50)) {
          const k = JSON.stringify({
            edgeId,
            s: e.source || "",
            p: e.location?.path || "",
            l: e.location?.line || 0,
            c: e.location?.column || 0,
          });
          const eid =
            "evid_" +
            crypto.createHash("sha1").update(k).digest("hex").slice(0, 20);
          const props = {
            id: eid,
            edgeId,
            source: e.source || null,
            confidence: typeof e.confidence === "number" ? e.confidence : null,
            path: e.location?.path || null,
            line: typeof e.location?.line === "number" ? e.location.line : null,
            column:
              typeof e.location?.column === "number" ? e.location.column : null,
            note: e.note || null,
            extractorVersion: e.extractorVersion || null,
            createdAt: nowISO,
            updatedAt: nowISO,
          } as any;
          const params = {
            ...props,
          } as any;
          params.rows = [{ ...props }];
          await this.graphDbQuery(
            `// UNWIND $rows AS row
             MERGE (n:edge_evidence { id: $id })
             ON CREATE SET n.createdAt = $createdAt
             SET n.edgeId = $edgeId, n.source = $source, n.confidence = $confidence,
                 n.path = $path, n.line = $line, n.column = $column, n.note = $note, n.extractorVersion = $extractorVersion,
                 n.updatedAt = $updatedAt`,
            params
          );
        }
      }
    } catch {}

    // Upsert site node
    try {
      const siteHash = any.siteHash as string | undefined;
      if (siteHash) {
        const params = {
          id: siteHash,
          edgeId,
          siteId: any.siteId || null,
          path: any.location?.path || any.metadata?.path || null,
          line:
            typeof any.location?.line === "number"
              ? any.location.line
              : typeof any.metadata?.line === "number"
              ? any.metadata.line
              : null,
          column:
            typeof any.location?.column === "number"
              ? any.location.column
              : typeof any.metadata?.column === "number"
              ? any.metadata.column
              : null,
          accessPath: any.accessPath || any.metadata?.accessPath || null,
          now: nowISO,
        } as any;
        params.rows = [{ ...params }];
        await this.graphDbQuery(
          `// UNWIND $rows AS row
           MERGE (s:edge_site { id: $id })
           SET s.edgeId = $edgeId,
               s.siteId = $siteId,
               s.path = $path,
               s.line = $line,
               s.column = $column,
               s.accessPath = $accessPath,
               s.updatedAt = $now`,
          params
        );
      }
    } catch {}

    // Upsert candidate nodes if present in metadata (from coordinator resolution)
    try {
      const cands: any[] = Array.isArray(any.metadata?.candidates)
        ? any.metadata.candidates
        : [];
      if (Array.isArray(cands) && cands.length > 0) {
        let rank = 0;
        for (const c of cands.slice(0, 20)) {
          rank++;
          const cidBase = `${edgeId}|${c.id || c.name || ""}|${rank}`;
          const cid =
            "cand_" +
            crypto
              .createHash("sha1")
              .update(cidBase)
              .digest("hex")
              .slice(0, 20);
          const candParams = {
            id: cid,
            edgeId,
            candId: c.id || null,
            name: c.name || null,
            path: c.path || null,
            resolver: c.resolver || null,
            score: typeof c.score === "number" ? c.score : null,
            rank,
            now: nowISO,
          } as any;
          candParams.rows = [{ ...candParams }];
          await this.graphDbQuery(
            `// UNWIND $rows AS row
             MERGE (n:edge_candidate { id: $id })
             ON CREATE SET n.createdAt = $now
             SET n.edgeId = $edgeId, n.candidateId = $candId, n.name = $name, n.path = $path,
                 n.resolver = $resolver, n.score = $score, n.rank = $rank, n.updatedAt = $now`,
            candParams
          );
          // Optional: link to candidate entity if exists (guarded)
          try {
            if (c.id) {
              await this.graphDbQuery(
                `MATCH (cand:edge_candidate {id: $cid}), (e {id: $eid})
                 MERGE (cand)-[:CANDIDATE_ENTITY]->(e)`,
                { cid, eid: c.id }
              );
            }
          } catch {}
        }
      }
    } catch {}

    // Phase 3: Dataflow nodes for READS/WRITES (optional)
    try {
      const dfEnable =
        String(process.env.EDGE_DATAFLOW_NODES || "true").toLowerCase() !==
        "false";
      if (
        dfEnable &&
        (rIn.type === (RelationshipType as any).READS ||
          rIn.type === (RelationshipType as any).WRITES)
      ) {
        const dfId = any.dataFlowId as string | undefined;
        if (dfId) {
          const fromId = rIn.fromEntityId;
          const toId = rIn.toEntityId;
          await this.graphDbQuery(
            `MERGE (df:dataflow { id: $id })
             ON CREATE SET df.createdAt = $now
             SET df.var = $var, df.file = $file, df.updatedAt = $now
             WITH df
             MATCH (a {id: $fromId})
             MERGE (a)-[:HAS_DATAFLOW]->(df)
             WITH df
             MATCH (b {id: $toId})
             MERGE (df)-[:DATAFLOW_TO]->(b)`,
            {
              id: dfId,
              var: any.to_ref_symbol || null,
              file: any.to_ref_file || null,
              now: nowISO,
              fromId,
              toId,
            }
          );
        }
      }
    } catch {}
  }

  /**
   * Phase 3: Compute and store lightweight materialized edge stats for an entity.
   */
  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    try {
      const byType = await this.graphDbQuery(
        `MATCH (a {id: $id})-[r]->()
         RETURN type(r) as t, count(r) as c`,
        { id: resolvedId }
      );
      const topSymbols = await this.graphDbQuery(
        `MATCH (a {id: $id})-[r]->()
         WHERE r.to_ref_symbol IS NOT NULL
         RETURN r.to_ref_symbol as sym, count(*) as c
         ORDER BY c DESC LIMIT 10`,
        { id: resolvedId }
      );
      const payload = {
        byType: (byType || []).map((row: any) => ({
          type: row.t,
          count: row.c,
        })),
        topSymbols: (topSymbols || []).map((row: any) => ({
          symbol: row.sym,
          count: row.c,
        })),
        updatedAt: new Date().toISOString(),
      };
      await this.graphDbQuery(
        `MERGE (s:edge_stats { id: $sid })
         SET s.entityId = $eid, s.payload = $payload, s.updatedAt = $now`,
        {
          sid: `stats_${resolvedId}`,
          eid: resolvedId,
          payload: JSON.stringify(payload),
          now: new Date().toISOString(),
        }
      );
    } catch {}
  }

  // --- Shared helpers (Phase 1: normalization/merge/unify) ---
  private dedupeBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const x of arr) {
      const k = keyFn(x);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(x);
      }
    }
    return out;
  }

  private mergeEvidenceArrays(oldArr: any[], newArr: any[], limit = 20): any[] {
    try {
      return mergeEdgeEvidence(
        oldArr as any[],
        newArr as any[],
        limit
      ) as any[];
    } catch {
      return (oldArr || []).slice(0, limit);
    }
  }

  private mergeLocationsArrays(
    oldArr: any[],
    newArr: any[],
    limit = 20
  ): any[] {
    try {
      return mergeEdgeLocations(
        oldArr as any[],
        newArr as any[],
        limit
      ) as any[];
    } catch {
      return (oldArr || []).slice(0, limit);
    }
  }

  // Best-effort: when a resolved edge is created, merge and retire placeholder edges (file:/external:/kind:)
  private async unifyResolvedEdgePlaceholders(
    rel: GraphRelationship
  ): Promise<void> {
    try {
      // Only unify for code-like edges and resolved targets
      const any: any = rel as any;
      const toKind = any.to_ref_kind as string | undefined;
      const toId = this.stripEntityPrefix(String(rel.toEntityId || ""));
      const isResolved = toKind === "entity" || toId.startsWith("sym:");
      if (!isResolved) return;

      // Derive file/symbol/name for matching placeholders
      let file: string | undefined;
      let symbol: string | undefined;
      let name: string | undefined;
      try {
        if (
          typeof any.to_ref_file === "string" &&
          typeof any.to_ref_symbol === "string"
        ) {
          file = any.to_ref_file;
          symbol = any.to_ref_symbol;
          name = any.to_ref_name || any.to_ref_symbol;
        } else if (toId.startsWith("sym:")) {
          const m = toId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
          if (m) {
            file = m[1];
            symbol = m[2];
            name = symbol;
          }
        }
      } catch {}
      if (!file || !symbol) return;

      const type = rel.type;
      const fromId = rel.fromEntityId;
      const nowISO = new Date().toISOString();

      // Fetch candidate placeholder edges to merge: same from/type and matching file+symbol
      const q = `
        MATCH (a {id: $fromId})-[r:${type}]->(b)
        WHERE r.id <> $newId AND coalesce(r.active, true) = true
          AND r.to_ref_file = $file AND r.to_ref_symbol = $symbol
        RETURN r`;
      const rows = await this.graphDbQuery(q, {
        fromId,
        newId: rel.id,
        file,
        symbol,
      });
      const placeholdersFile: any[] = (rows || []).map((row: any) =>
        this.parseRelationshipFromGraph(row)
      );

      // Optional: also unify 'external:<name>' placeholders by symbol name (best-effort, name-only)
      let placeholdersExternal: any[] = [];
      try {
        const qext = `
          MATCH (a {id: $fromId})-[r:${type}]->(b)
          WHERE r.id <> $newId AND coalesce(r.active, true) = true
            AND r.to_ref_kind = 'external' AND r.to_ref_name = $symbol
          RETURN r`;
        const rowsExt = await this.graphDbQuery(qext, {
          fromId,
          newId: rel.id,
          symbol,
        });
        placeholdersExternal = (rowsExt || []).map((row: any) =>
          this.parseRelationshipFromGraph(row)
        );
      } catch {}
      const placeholders: any[] = ([] as any[]).concat(
        placeholdersFile,
        placeholdersExternal
      );
      if (placeholders.length === 0) return;

      // Aggregate properties to fold into the resolved edge
      let occTotalAdd = 0;
      let occScanAdd = 0;
      let confMax = -Infinity;
      let firstSeenMin: string | null = null;
      let lastSeenMax: string | null = null;
      let evAgg: any[] = [];
      let locAgg: any[] = [];
      let sitesAgg: string[] = [];
      for (const p of placeholders) {
        const anyp: any = p as any;
        occTotalAdd +=
          typeof anyp.occurrencesTotal === "number" ? anyp.occurrencesTotal : 0;
        occScanAdd +=
          typeof anyp.occurrencesScan === "number" ? anyp.occurrencesScan : 0;
        if (typeof anyp.confidence === "number")
          confMax = Math.max(confMax, anyp.confidence);
        const fs =
          anyp.firstSeenAt instanceof Date
            ? anyp.firstSeenAt.toISOString()
            : typeof anyp.firstSeenAt === "string"
            ? anyp.firstSeenAt
            : null;
        const ls =
          anyp.lastSeenAt instanceof Date
            ? anyp.lastSeenAt.toISOString()
            : typeof anyp.lastSeenAt === "string"
            ? anyp.lastSeenAt
            : null;
        if (fs)
          firstSeenMin = !firstSeenMin || fs < firstSeenMin ? fs : firstSeenMin;
        if (ls)
          lastSeenMax = !lastSeenMax || ls > lastSeenMax ? ls : lastSeenMax;
        if (Array.isArray(anyp.evidence))
          evAgg = this.mergeEvidenceArrays(evAgg, anyp.evidence);
        if (Array.isArray(anyp.locations))
          locAgg = this.mergeLocationsArrays(locAgg, anyp.locations);
        if (Array.isArray(anyp.sites))
          sitesAgg = Array.from(new Set(sitesAgg.concat(anyp.sites))).slice(
            0,
            50
          );
      }

      // Update resolved edge with aggregates
      const update = `
        MATCH (a {id: $fromId})-[r:${type} {id: $newId}]->(b)
        SET r.occurrencesTotal = coalesce(r.occurrencesTotal,0) + $occTotalAdd,
            r.occurrencesScan = coalesce(r.occurrencesScan,0) + $occScanAdd,
            r.confidence = CASE WHEN $confMax IS NULL THEN r.confidence ELSE GREATEST(coalesce(r.confidence,0), $confMax) END,
            r.firstSeenAt = CASE WHEN $firstSeenMin IS NULL THEN r.firstSeenAt ELSE coalesce(r.firstSeenAt, $firstSeenMin) END,
            r.lastSeenAt = CASE WHEN $lastSeenMax IS NULL THEN r.lastSeenAt ELSE GREATEST(coalesce(r.lastSeenAt, $lastSeenMax), $lastSeenMax) END,
            r.evidence = CASE WHEN $evidence IS NULL THEN r.evidence ELSE $evidence END,
            r.locations = CASE WHEN $locations IS NULL THEN r.locations ELSE $locations END,
            r.sites = CASE WHEN $sites IS NULL THEN r.sites ELSE $sites END
      `;
      await this.graphDbQuery(update, {
        fromId,
        newId: rel.id,
        occTotalAdd,
        occScanAdd,
        confMax: Number.isFinite(confMax) ? confMax : null,
        firstSeenMin,
        lastSeenMax,
        evidence:
          evAgg.length > 0 ? JSON.stringify(evAgg).slice(0, 200000) : null,
        locations:
          locAgg.length > 0 ? JSON.stringify(locAgg).slice(0, 200000) : null,
        sites:
          sitesAgg.length > 0
            ? JSON.stringify(sitesAgg).slice(0, 200000)
            : null,
      });

      // Retire placeholder edges (deactivate and close validity)
      const oldIds = placeholders.map((p: any) => p.id).filter(Boolean);
      if (oldIds.length > 0) {
        const retire = `
          UNWIND $ids AS rid
          MATCH ()-[r {id: rid}]-()
          SET r.active = false,
              r.validTo = coalesce(r.validTo, $now)
        `;
        await this.graphDbQuery(retire, { ids: oldIds, now: nowISO });
      }
    } catch {
      // best-effort; do not block
    }
  }

  // --- Internal helpers for relationship normalization and ranking ---
  private normalizeRelationship(relIn: GraphRelationship): GraphRelationship {
    // Create a shallow copy we can mutate safely
    const rel: any = { ...(relIn as any) };

    if (
      typeof rel.id === "string" &&
      rel.id.length > 0 &&
      !isStructuralRelationshipType(rel.type)
    ) {
      rel.id = this.namespaceScope.applyRelationshipPrefix(rel.id);
    }

    if (typeof rel.fromEntityId === "string") {
      rel.fromEntityId = this.namespaceId(rel.fromEntityId);
    }
    if (typeof rel.toEntityId === "string") {
      rel.toEntityId = this.namespaceId(rel.toEntityId);
    }

    // Ensure timestamps and version
    if (!(rel.created instanceof Date))
      rel.created = new Date(rel.created || Date.now());
    if (!(rel.lastModified instanceof Date))
      rel.lastModified = new Date(rel.lastModified || Date.now());
    if (typeof rel.version !== "number") rel.version = 1;

    this.harmonizeRefFields(rel);

    if (isStructuralRelationshipType(rel.type)) {
      Object.assign(rel, this.normalizeStructuralRelationship(rel));
      if (typeof rel.id === "string" && rel.id.length > 0) {
        rel.id = this.namespaceScope.applyRelationshipPrefix(rel.id);
      }
      this.harmonizeRefFields(rel);
    }

    // Delegate code-edge normalization to shared normalizer to avoid drift
    if (isCodeRelationship(rel.type)) {
      Object.assign(rel, normalizeCodeEdge(rel));
      this.harmonizeRefFields(rel);
    }

    if (isDocumentationRelationshipType(rel.type)) {
      Object.assign(rel, this.normalizeDocumentationEdge(rel));
    }

    if (isPerformanceRelationshipType(rel.type)) {
      Object.assign(rel, this.normalizePerformanceRelationship(rel));
    }

    // Generate a human-readable why if missing
    if (!rel.why) {
      const src = rel.source as string | undefined;
      const res = rel.resolution as string | undefined;
      const scope = rel.scope as string | undefined;
      const hints: string[] = [];
      if (src === "type-checker" || res === "type-checker")
        hints.push("resolved by type checker");
      else if (res === "via-import") hints.push("via import deep resolution");
      else if (res === "direct") hints.push("direct AST resolution");
      else if (src === "heuristic" || res === "heuristic")
        hints.push("heuristic match");
      if (scope) hints.push(`scope=${scope}`);
      if (hints.length > 0) rel.why = hints.join("; ");
    }

    return rel as GraphRelationship;
  }

  private normalizeStructuralRelationship(relIn: GraphRelationship): any {
    return normalizeStructuralRelationshipExternal(relIn);
  }

  private normalizePerformanceRelationship(relIn: GraphRelationship): any {
    const rel: any = relIn;
    const md: Record<string, any> = { ...(rel.metadata || {}) };
    rel.metadata = md;

    const round = (value: number, precision = 4): number => {
      const factor = Math.pow(10, precision);
      return Math.round(value * factor) / factor;
    };

    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const toPositiveInt = (value: unknown): number | undefined => {
      const num = toNumber(value);
      if (num === undefined) return undefined;
      if (num < 0) return undefined;
      return Math.round(num);
    };

    const sanitizeString = (value: unknown, max = 256): string | undefined => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
    };

    const sanitizeMetricId = (value: unknown): string | undefined => {
      const raw = sanitizeString(value, 256);
      if (!raw) return undefined;
      const normalized = raw
        .toLowerCase()
        .replace(/[^a-z0-9/_\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/\/+/g, "/")
        .replace(/\/+$/g, "")
        .replace(/^\/+/, "")
        .slice(0, 256);
      if (!normalized) return undefined;
      if (!/[a-z0-9]/.test(normalized)) return undefined;
      return normalized;
    };

    const sanitizeUnit = (value: unknown): string | undefined => {
      const raw = sanitizeString(value, 32);
      if (!raw) return undefined;
      return raw.toLowerCase();
    };

    const normalizeTrend = (value: unknown, delta?: number): string | undefined => {
      if (typeof delta === "number" && Number.isFinite(delta)) {
        if (delta > 0) return "regression";
        if (delta < 0) return "improvement";
        return "neutral";
      }
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["regression", "improvement", "neutral"].includes(normalized)) {
          return normalized;
        }
      }
      if (typeof delta === "number") {
        if (delta > 0) return "regression";
        if (delta < 0) return "improvement";
      }
      return "neutral";
    };

    const severityOrder: Array<"critical" | "high" | "medium" | "low"> = [
      "critical",
      "high",
      "medium",
      "low",
    ];

    const sanitizeSeverity = (
      value: unknown,
      percentChange?: number,
      delta?: number,
      trend?: string
    ): "critical" | "high" | "medium" | "low" => {
      const normalizedInput =
        typeof value === "string" ? value.trim().toLowerCase() : undefined;

      const isImprovement = (() => {
        if (typeof percentChange === "number" && percentChange < 0) return true;
        if (typeof delta === "number" && delta < 0) return true;
        if (trend === "improvement") return true;
        return false;
      })();

      if (isImprovement) {
        return "low";
      }

      if (normalizedInput && severityOrder.includes(normalizedInput as any)) {
        return normalizedInput as any;
      }

      const percent = Math.abs(percentChange ?? 0);
      if (percent >= 50) return "critical";
      if (percent >= 25) return "high";
      if (percent >= 10) return "medium";
      if (percent >= 5) return "low";
      const absDelta = Math.abs(delta ?? 0);
      if (absDelta >= 2000) return "critical";
      if (absDelta >= 1000) return "high";
      if (absDelta >= 250) return "medium";
      return "low";
    };

    const metricIdSource = rel.metricId ?? md.metricId;
    const metricId = sanitizeMetricId(metricIdSource);
    if (!metricId) {
      throw new Error(
        `Performance relationships require metricId (received: ${String(
          metricIdSource
        )})`
      );
    }
    rel.metricId = metricId;
    md.metricId = metricId;

    const scenario = sanitizeString(rel.scenario ?? md.scenario, 128);
    if (scenario) {
      rel.scenario = scenario;
      md.scenario = scenario;
    }

    const environment = sanitizeEnvironment(rel.environment ?? md.environment ?? "");
    rel.environment = environment;
    md.environment = environment;

    const unit = sanitizeUnit(rel.unit ?? md.unit ?? "ms") ?? "ms";
    rel.unit = unit;
    md.unit = unit;

    const historyRaw = Array.isArray(rel.metricsHistory)
      ? rel.metricsHistory
      : Array.isArray(md.metricsHistory)
      ? md.metricsHistory
      : [];

    const metricsHistoryWithIndex = historyRaw
      .map((entry: any, index: number) => {
        if (!entry) return null;
        const value = toNumber(entry.value);
        if (value === undefined) return null;
        const tsRaw = entry.timestamp ?? entry.time ?? entry.recordedAt;
        const ts = tsRaw ? new Date(tsRaw) : undefined;
        const timestamp = ts && !Number.isNaN(ts.valueOf()) ? ts : undefined;
        const runId = sanitizeString(entry.runId ?? entry.id, 128);
        const entryEnv = sanitizeEnvironment(entry.environment ?? environment ?? "");
        const entryUnit = sanitizeUnit(entry.unit ?? unit);
        return {
          value: round(value),
          timestamp,
          runId,
          environment: entryEnv,
          unit: entryUnit ?? unit,
          __index: index,
        };
      })
      .filter(Boolean) as Array<
      {
        value: number;
        timestamp?: Date;
        runId?: string;
        environment?: string;
        unit?: string;
        __index: number;
      }
    >;

    const metricsHistory = metricsHistoryWithIndex
      .sort((a, b) => {
        const ta = a.timestamp?.valueOf();
        const tb = b.timestamp?.valueOf();
        if (ta !== undefined && tb !== undefined) {
          if (ta === tb) return a.__index - b.__index;
          return ta - tb;
        }
        if (ta === undefined && tb === undefined) {
          return a.__index - b.__index;
        }
        return ta === undefined ? 1 : -1;
      })
      .map(({ __index, ...entry }) => entry);

    if (metricsHistory.length > 0) {
      rel.metricsHistory = metricsHistory;
      md.metricsHistory = metricsHistory.map((entry: any) => ({
        value: entry.value,
        timestamp: entry.timestamp ? entry.timestamp.toISOString() : undefined,
        runId: entry.runId,
        environment: entry.environment,
        unit: entry.unit,
      }));
    }

    let baseline = toNumber(rel.baselineValue ?? md.baselineValue);
    let current = toNumber(rel.currentValue ?? md.currentValue);

    if (baseline === undefined && metricsHistory.length > 0) {
      baseline = metricsHistory[0].value;
    }
    if (current === undefined && metricsHistory.length > 0) {
      current = metricsHistory[metricsHistory.length - 1].value;
    }

    if (baseline !== undefined) {
      rel.baselineValue = round(baseline);
      md.baselineValue = rel.baselineValue;
    }
    if (current !== undefined) {
      rel.currentValue = round(current);
      md.currentValue = rel.currentValue;
    }

    let delta = toNumber(rel.delta ?? md.delta);
    if (delta === undefined && baseline !== undefined && current !== undefined) {
      delta = current - baseline;
    }
    if (delta !== undefined) {
      rel.delta = round(delta);
      md.delta = rel.delta;
    }

    let percentChange = toNumber(rel.percentChange ?? md.percentChange);
    if (
      percentChange === undefined &&
      baseline !== undefined &&
      baseline !== 0 &&
      current !== undefined
    ) {
      percentChange = ((current - baseline) / baseline) * 100;
    }
    if (percentChange !== undefined) {
      rel.percentChange = round(percentChange);
      md.percentChange = rel.percentChange;
    } else if (baseline === 0 && current !== undefined) {
      md.percentChange = null;
      md.percentChangeNote = "baseline-zero";
    }

    let sampleSize = toPositiveInt(rel.sampleSize ?? md.sampleSize);
    if (sampleSize === undefined && metricsHistory.length > 0) {
      sampleSize = metricsHistory.length;
    }
    rel.sampleSize = sampleSize ?? undefined;
    if (sampleSize !== undefined) md.sampleSize = sampleSize;

    const ciRaw = rel.confidenceInterval ?? md.confidenceInterval;
    let confidenceInterval: any = null;
    if (ciRaw && typeof ciRaw === "object") {
      const lower = toNumber((ciRaw as any).lower);
      const upper = toNumber((ciRaw as any).upper);
      if (lower !== undefined || upper !== undefined) {
        confidenceInterval = {
          lower: lower !== undefined ? round(lower) : undefined,
          upper: upper !== undefined ? round(upper) : undefined,
        };
      }
    }
    rel.confidenceInterval = confidenceInterval;
    if (confidenceInterval) md.confidenceInterval = confidenceInterval;

    const trend = normalizeTrend(rel.trend ?? md.trend, rel.delta ?? delta);
    rel.trend = trend;
    md.trend = trend;

    const severity = sanitizeSeverity(
      rel.severity ?? md.severity,
      rel.percentChange ?? percentChange,
      rel.delta ?? delta,
      trend
    );
    rel.severity = severity;
    md.severity = severity;

    const severityWeight: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    const computedRisk = (() => {
      const pctRaw = rel.percentChange ?? percentChange ?? 0;
      const deltaRaw = rel.delta ?? delta ?? 0;
      if (pctRaw <= 0 || deltaRaw < 0) return 0;
      const pct = Math.abs(pctRaw) / 100;
      const sz = sampleSize ?? 1;
      const weight = severityWeight[severity] ?? 1;
      if (!Number.isFinite(pct)) return undefined;
      return round(pct * weight * Math.log2(sz + 1));
    })();
    const riskScore = toNumber(rel.riskScore ?? md.riskScore) ?? computedRisk;
    if (riskScore !== undefined) {
      rel.riskScore = round(riskScore);
      md.riskScore = rel.riskScore;
    }

    const runId = sanitizeString(rel.runId ?? md.runId, 128);
    if (runId) {
      rel.runId = runId;
      md.runId = runId;
    }

    const policyId = sanitizeString(rel.policyId ?? md.policyId, 128);
    if (policyId) {
      rel.policyId = policyId;
      md.policyId = policyId;
    }

    const detectedAtRaw = rel.detectedAt ?? md.detectedAt;
    if (detectedAtRaw) {
      const detectedAt = new Date(detectedAtRaw);
      if (!Number.isNaN(detectedAt.valueOf())) {
        rel.detectedAt = detectedAt;
        md.detectedAt = detectedAt.toISOString();
      }
    }

    const resolvedAtRaw = rel.resolvedAt ?? md.resolvedAt;
    if (resolvedAtRaw) {
      const resolvedAt = new Date(resolvedAtRaw);
      if (!Number.isNaN(resolvedAt.valueOf())) {
        rel.resolvedAt = resolvedAt;
        md.resolvedAt = resolvedAt.toISOString();
      }
    } else if (resolvedAtRaw === null) {
      rel.resolvedAt = null;
      md.resolvedAt = null;
    }

    const evidence = Array.isArray(rel.evidence)
      ? rel.evidence
      : Array.isArray(md.evidence)
      ? md.evidence
      : [];
    rel.evidence = evidence.slice(0, 20);
    if (rel.evidence.length > 0) {
      md.evidence = rel.evidence.map((entry: any) => ({
        ...entry,
        note: sanitizeString(entry?.note, 512),
      }));
    }

    if (Array.isArray((rel as any).metrics)) {
      md.metrics = (rel as any).metrics;
      delete (rel as any).metrics;
    }

    return rel;
  }

  private normalizeDocumentationEdge(relIn: any): any {
    const rel = relIn;
    const md: Record<string, any> = { ...(rel.metadata || {}) };
    rel.metadata = md;

    const source = this.normalizeDocSource(rel.source || md.source);
    if (source) {
      rel.source = source;
      md.source = source;
    }

    const docIntent = this.normalizeDocIntent(
      rel.docIntent ?? md.docIntent,
      source,
      rel.type
    );
    if (docIntent) {
      rel.docIntent = docIntent;
      md.docIntent = docIntent;
    }

    const sectionAnchor = this.normalizeSectionAnchor(
      rel.sectionAnchor ?? md.sectionAnchor ?? md.anchor,
      rel.type === RelationshipType.DOCUMENTED_BY ||
        rel.type === RelationshipType.DOCUMENTS_SECTION
    );
    if (sectionAnchor) {
      rel.sectionAnchor = sectionAnchor;
      md.sectionAnchor = sectionAnchor;
    }

    const summary = this.normalizeSummary(rel.summary ?? md.summary);
    if (summary !== undefined) {
      if (summary) {
        rel.summary = summary;
        md.summary = summary;
      } else {
        delete rel.summary;
        delete md.summary;
      }
    }

    const docVersion = this.normalizeString(rel.docVersion ?? md.docVersion);
    if (docVersion) {
      rel.docVersion = docVersion;
      md.docVersion = docVersion;
    }

    const docHash = this.normalizeString(rel.docHash ?? md.docHash);
    if (docHash) {
      rel.docHash = docHash;
      md.docHash = docHash;
    }

    const coverageScope = this.normalizeCoverageScope(
      rel.coverageScope ?? md.coverageScope
    );
    if (coverageScope) {
      rel.coverageScope = coverageScope;
      md.coverageScope = coverageScope;
    } else {
      delete rel.coverageScope;
      delete md.coverageScope;
    }

    const documentationQuality = this.normalizeDocumentationQuality(
      rel.documentationQuality ?? md.documentationQuality
    );
    if (documentationQuality) {
      rel.documentationQuality = documentationQuality;
      md.documentationQuality = documentationQuality;
    } else {
      delete rel.documentationQuality;
      delete md.documentationQuality;
    }

    const docLocale = this.normalizeLocale(rel.docLocale ?? md.docLocale);
    if (docLocale) {
      rel.docLocale = docLocale;
      md.docLocale = docLocale;
    }

    const tags = this.normalizeStringArray(rel.tags ?? md.tags);
    if (tags) {
      rel.tags = tags;
      md.tags = tags;
    }

    const stakeholders = this.normalizeStringArray(
      rel.stakeholders ?? md.stakeholders
    );
    if (stakeholders) {
      rel.stakeholders = stakeholders;
      md.stakeholders = stakeholders;
    }

    const confidence = this.clamp01(rel.confidence ?? md.confidence);
    if (confidence !== undefined) {
      rel.confidence = confidence;
      md.confidence = confidence;
    }

    if (
      rel.type === RelationshipType.BELONGS_TO_DOMAIN &&
      rel.strength === undefined
    ) {
      rel.strength = this.clamp01(md.strength) ?? 0.5;
    } else if (rel.strength !== undefined) {
      rel.strength = this.clamp01(rel.strength) ?? undefined;
    }
    if (rel.strength !== undefined) {
      md.strength = rel.strength;
    }

    if (rel.type === RelationshipType.CLUSTER_MEMBER) {
      const similarity = this.clampRange(
        rel.similarityScore ?? md.similarityScore,
        -1,
        1
      );
      if (similarity !== undefined) {
        rel.similarityScore = similarity;
        md.similarityScore = similarity;
      }

      const clusterVersion =
        this.normalizeString(rel.clusterVersion ?? md.clusterVersion) || "v1";
      rel.clusterVersion = clusterVersion;
      md.clusterVersion = clusterVersion;

      const docAnchor =
        this.normalizeSectionAnchor(rel.docAnchor ?? md.docAnchor) ||
        sectionAnchor;
      if (docAnchor) {
        rel.docAnchor = docAnchor;
        md.docAnchor = docAnchor;
      }
    }

    if (
      rel.type === RelationshipType.DESCRIBES_DOMAIN ||
      rel.type === RelationshipType.BELONGS_TO_DOMAIN
    ) {
      const domainPath = this.normalizeDomainPath(
        rel.domainPath ?? md.domainPath ?? md.taxonomyPath
      );
      if (domainPath) {
        rel.domainPath = domainPath;
        md.domainPath = domainPath;
      }
    }

    if (rel.type === RelationshipType.DESCRIBES_DOMAIN) {
      const taxonomyVersion =
        this.normalizeString(rel.taxonomyVersion ?? md.taxonomyVersion) || "v1";
      rel.taxonomyVersion = taxonomyVersion;
      md.taxonomyVersion = taxonomyVersion;
    }

    if (rel.type === RelationshipType.DOMAIN_RELATED) {
      const relationshipType = this.normalizeDomainRelationship(
        rel.relationshipType ?? md.relationshipType
      );
      if (relationshipType) {
        rel.relationshipType = relationshipType;
        md.relationshipType = relationshipType;
      }
    }

    if (rel.type === RelationshipType.GOVERNED_BY) {
      const policyType = this.normalizePolicyType(
        rel.policyType ?? md.policyType
      );
      if (policyType) {
        rel.policyType = policyType;
        md.policyType = policyType;
      }
    }

    const lastValidated = this.toDate(rel.lastValidated ?? md.lastValidated);
    if (lastValidated) {
      rel.lastValidated = lastValidated;
      md.lastValidated = lastValidated.toISOString();
    }

    const updatedFromDocAt = this.toDate(
      rel.updatedFromDocAt ?? md.updatedFromDocAt
    );
    if (updatedFromDocAt) {
      rel.updatedFromDocAt = updatedFromDocAt;
      md.updatedFromDocAt = updatedFromDocAt.toISOString();
    }

    const lastComputed = this.toDate(rel.lastComputed ?? md.lastComputed);
    if (lastComputed) {
      rel.lastComputed = lastComputed;
      md.lastComputed = lastComputed.toISOString();
    }

    const effectiveFrom = this.toDate(rel.effectiveFrom ?? md.effectiveFrom);
    if (effectiveFrom) {
      rel.effectiveFrom = effectiveFrom;
      md.effectiveFrom = effectiveFrom.toISOString();
    }

    const expiresAtRaw = rel.expiresAt ?? md.expiresAt;
    if (expiresAtRaw === null) {
      rel.expiresAt = null;
      md.expiresAt = null;
    } else {
      const expiresAt = this.toDate(expiresAtRaw);
      if (expiresAt) {
        rel.expiresAt = expiresAt;
        md.expiresAt = expiresAt.toISOString();
      }
    }

    if (Array.isArray(rel.evidence)) {
      rel.evidence = rel.evidence.slice(0, 5);
    }
    if (Array.isArray(md.evidence)) {
      md.evidence = md.evidence.slice(0, 5);
    }

    const embeddingVersion = this.normalizeString(
      rel.embeddingVersion ?? md.embeddingVersion
    );
    if (embeddingVersion) {
      rel.embeddingVersion = embeddingVersion;
      md.embeddingVersion = embeddingVersion;
    } else if (docIntent === "ai-context") {
      const defaultEmbeddingVersion =
        process.env.EMBEDDING_MODEL_VERSION ||
        process.env.DEFAULT_EMBEDDING_VERSION;
      if (defaultEmbeddingVersion) {
        rel.embeddingVersion = defaultEmbeddingVersion;
        md.embeddingVersion = defaultEmbeddingVersion;
      }
    }

    return rel;
  }

  private normalizeDocSource(source: any): string | undefined {
    if (!source) return undefined;
    const normalized = String(source).toLowerCase();
    switch (normalized) {
      case "parser":
      case "manual":
      case "llm":
      case "imported":
      case "sync":
      case "other":
        return normalized;
      default:
        return "other";
    }
  }

  private normalizeDocIntent(
    intent: any,
    source: string | undefined,
    type: RelationshipType
  ): DocumentationIntent {
    const normalized =
      typeof intent === "string" ? intent.toLowerCase() : undefined;
    if (
      normalized === "ai-context" ||
      normalized === "governance" ||
      normalized === "mixed"
    ) {
      return normalized as DocumentationIntent;
    }

    if (type === RelationshipType.GOVERNED_BY) {
      return "governance";
    }

    if (source === "manual") {
      return "governance";
    }

    return source === "llm" ? "ai-context" : "ai-context";
  }

  private normalizeCoverageScope(
    scope: any
  ): DocumentationCoverageScope | undefined {
    if (!scope) return undefined;
    const normalized = String(scope).toLowerCase();
    switch (normalized) {
      case "api":
      case "behavior":
      case "operational":
      case "security":
      case "compliance":
        return normalized as DocumentationCoverageScope;
      default:
        return undefined;
    }
  }

  private normalizeDocumentationQuality(
    quality: any
  ): DocumentationQuality | undefined {
    if (!quality) return undefined;
    const normalized = String(quality).toLowerCase();
    switch (normalized) {
      case "complete":
      case "partial":
      case "outdated":
        return normalized as DocumentationQuality;
      default:
        return undefined;
    }
  }

  private normalizePolicyType(
    policyType: any
  ): DocumentationPolicyType | undefined {
    if (!policyType) return undefined;
    const normalized = String(policyType).toLowerCase();
    switch (normalized) {
      case "adr":
      case "runbook":
      case "compliance":
      case "manual":
      case "decision-log":
        return normalized as DocumentationPolicyType;
      default:
        return undefined;
    }
  }

  private normalizeDomainRelationship(value: any): string | undefined {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase();
    switch (normalized) {
      case "depends_on":
      case "overlaps":
      case "shares_owner":
        return normalized;
      default:
        return normalized;
    }
  }

  private normalizeSectionAnchor(
    anchor: any,
    enforceRoot = false
  ): string | undefined {
    if (!anchor && enforceRoot) {
      return "_root";
    }
    if (!anchor) return undefined;
    const normalized = String(anchor)
      .trim()
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9\-_/\s]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-/g, "")
      .replace(/-$/g, "");

    return normalized.length > 0
      ? normalized.slice(0, 128)
      : enforceRoot
      ? "_root"
      : undefined;
  }

  private normalizeDomainPath(value: any): string | undefined {
    if (!value) return undefined;
    const normalized = String(value)
      .trim()
      .toLowerCase()
      .replace(/>+/g, "/")
      .replace(/\s+/g, "/")
      .replace(/[^a-z0-9/_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/\/+/, "/")
      .replace(/^\/+|\/+$/g, "");
    return normalized;
  }

  private normalizeModulePathFilter(value?: string | null): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    let normalized = trimmed.replace(/\\+/g, "/");
    normalized = normalized.replace(/\/{2,}/g, "/");
    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/g, "");
      if (!normalized) {
        normalized = "/";
      }
    }
    return normalized;
  }

  private normalizeModulePathFilterInput(
    value?: string | string[] | null
  ): string | string[] | undefined {
    if (typeof value === "string") {
      return this.normalizeModulePathFilter(value) ?? undefined;
    }
    if (Array.isArray(value)) {
      const normalizedList = value
        .map((entry) =>
          typeof entry === "string"
            ? this.normalizeModulePathFilter(entry)
            : undefined
        )
        .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
      if (normalizedList.length === 0) {
        return undefined;
      }
      if (normalizedList.length === 1) {
        return normalizedList[0];
      }
      return normalizedList;
    }
    return undefined;
  }

  private normalizeSummary(value: any): string | undefined {
    if (!value) return undefined;
    const text = String(value).trim();
    if (text.length === 0) return undefined;
    return text.length > 500 ? `${text.slice(0, 497)}...` : text;
  }

  private normalizeStringArray(value: any): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const normalized = value
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
    if (normalized.length === 0) return undefined;
    return Array.from(new Set(normalized)).slice(0, 20);
  }

  private normalizeString(value: any): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private normalizeLocale(value: any): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.slice(0, 16);
  }

  private clamp01(value: any): number | undefined {
    if (typeof value !== "number") return undefined;
    if (Number.isNaN(value)) return undefined;
    if (!Number.isFinite(value)) return undefined;
    return Math.min(1, Math.max(0, value));
  }

  private clampRange(value: any, min: number, max: number): number | undefined {
    if (typeof value !== "number") return undefined;
    if (Number.isNaN(value)) return undefined;
    if (!Number.isFinite(value)) return undefined;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private harmonizeRefFields(rel: any): void {
    const sync = (dir: "to" | "from") => {
      const baseIdKey = dir === "to" ? "toEntityId" : "fromEntityId";
      const refKey = dir === "to" ? "toRef" : "fromRef";
      const scalarPrefix = dir === "to" ? "to_ref_" : "from_ref_";
      const mdKey = dir === "to" ? "toRef" : "fromRef";

      const baseId =
        typeof rel[baseIdKey] === "string"
          ? (rel[baseIdKey] as string)
          : undefined;
      const existingRef =
        rel[refKey] && typeof rel[refKey] === "object"
          ? { ...rel[refKey] }
          : {};
      const scalars = {
        kind:
          typeof rel[`${scalarPrefix}kind`] === "string"
            ? (rel[`${scalarPrefix}kind`] as string)
            : undefined,
        file:
          typeof rel[`${scalarPrefix}file`] === "string"
            ? (rel[`${scalarPrefix}file`] as string)
            : undefined,
        symbol:
          typeof rel[`${scalarPrefix}symbol`] === "string"
            ? (rel[`${scalarPrefix}symbol`] as string)
            : undefined,
        name:
          typeof rel[`${scalarPrefix}name`] === "string"
            ? (rel[`${scalarPrefix}name`] as string)
            : undefined,
      };
      const hadScalarRef = Boolean(
        scalars.file || scalars.symbol || scalars.name
      );
      const hadStructuredRef = Boolean(
        existingRef &&
          (existingRef.file || existingRef.symbol || existingRef.name)
      );
      const derivedFromIdOnly = !hadScalarRef && !hadStructuredRef && !!baseId;

      const ref: any = existingRef;
      if (!ref.id && baseId) ref.id = baseId;
      if (!ref.kind && scalars.kind) ref.kind = scalars.kind;
      if (!ref.kind && typeof ref.id === "string")
        ref.kind = this.inferRefKindFromId(ref.id);
      if (!ref.kind) ref.kind = "entity";

      const idForParse = typeof ref.id === "string" ? ref.id : baseId;

      if (ref.kind === "fileSymbol") {
        const parsed = this.parseFileSymbolFromId(idForParse);
        if (!ref.file && scalars.file) ref.file = scalars.file;
        if (!ref.file && parsed.file) ref.file = parsed.file;
        if (!ref.symbol && scalars.symbol) ref.symbol = scalars.symbol;
        if (!ref.symbol && parsed.symbol) ref.symbol = parsed.symbol;
        if (!ref.name && scalars.name) ref.name = scalars.name;
        if (!ref.name && parsed.name) ref.name = parsed.name;
        if (!ref.name && ref.symbol) ref.name = ref.symbol;
      } else if (ref.kind === "external") {
        if (!ref.name) {
          ref.name =
            scalars.name ||
            (idForParse ? idForParse.replace(/^external:/, "") : undefined);
        }
      } else {
        if (!ref.name) {
          ref.name =
            scalars.name ||
            (idForParse && idForParse.includes(":")
              ? idForParse.split(":").pop()
              : idForParse);
        }
      }

      rel[refKey] = ref;

      // Update scalar mirrors to reflect canonical ref
      const kindKey = `${scalarPrefix}kind`;
      const fileKey = `${scalarPrefix}file`;
      const symbolKey = `${scalarPrefix}symbol`;
      const nameKey = `${scalarPrefix}name`;

      rel[kindKey] = ref.kind;
      if (ref.kind === "fileSymbol") {
        rel[fileKey] = ref.file;
        rel[symbolKey] = ref.symbol;
        rel[nameKey] = ref.name;
      } else {
        delete rel[fileKey];
        delete rel[symbolKey];
        rel[nameKey] = ref.name;
      }

      // Ensure metadata mirrors the structured reference for persistence/audit
      if (ref && typeof ref === "object") {
        const md: any = (rel.metadata = { ...(rel.metadata || {}) });
        if (md[mdKey] == null) {
          const refForMetadata = { ...ref };
          const hasScalarRef = Boolean(
            scalars.file || scalars.symbol || scalars.name
          );
          const hasStructuredRef = Boolean(
            existingRef &&
              (existingRef.file || existingRef.symbol || existingRef.name)
          );
          if (derivedFromIdOnly) {
            delete refForMetadata.id;
          }
          md[mdKey] = refForMetadata;
        }
      }
    };

    sync("to");
    sync("from");
  }

  private inferRefKindFromId(
    id?: string
  ): "entity" | "fileSymbol" | "external" {
    if (!id) return "entity";
    if (id.startsWith("external:")) return "external";
    if (id.startsWith("sym:") || id.startsWith("file:")) return "fileSymbol";
    return "entity";
  }

  private parseFileSymbolFromId(id?: string): {
    file?: string;
    symbol?: string;
    name?: string;
  } {
    if (!id) return {};
    const symMatch = id.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
    if (symMatch) {
      const file = symMatch[1];
      const symbol = symMatch[2];
      return { file, symbol, name: symbol };
    }
    const fileMatch = id.match(/^file:(.+?):(.+)$/);
    if (fileMatch) {
      const file = fileMatch[1];
      const symbol = fileMatch[2];
      return { file, symbol, name: symbol };
    }
    const importMatch = id.match(/^import:(.+?):(.+)$/);
    if (importMatch) {
      const file = importMatch[1];
      const symbol = importMatch[2];
      return { file, symbol, name: symbol };
    }
    return {};
  }

  private canonicalRelationshipId(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): string {
    // Build a temporary relationship shell to compute canonical key
    const rel = {
      fromEntityId: fromId,
      toEntityId: toId,
      type,
    } as GraphRelationship;
    return this.namespaceScope.applyRelationshipPrefix(
      canonicalRelationshipId(fromId, rel)
    );
  }

  private directoryDistance(fromFile: string, candidatePath: string): number {
    // Compare directory prefixes; smaller distance means closer
    const norm = (s: string) => String(s || "").replace(/\\/g, "/");
    const from = norm(fromFile);
    const cand = norm(candidatePath);
    const fromDir = from.includes("/")
      ? from.slice(0, from.lastIndexOf("/"))
      : "";
    const candFile = cand.includes(":")
      ? cand.slice(0, cand.lastIndexOf(":"))
      : cand; // symbol path has ":name"
    const candDir = candFile.includes("/")
      ? candFile.slice(0, candFile.lastIndexOf("/"))
      : "";
    if (!fromDir || !candDir) return 9999;
    const fromParts = fromDir.split("/");
    const candParts = candDir.split("/");
    let i = 0;
    while (
      i < fromParts.length &&
      i < candParts.length &&
      fromParts[i] === candParts[i]
    )
      i++;
    // distance = remaining hops
    return fromParts.length - i + (candParts.length - i);
  }

  private isHistoryEnabled(): boolean {
    try {
      return (process.env.HISTORY_ENABLED || "true").toLowerCase() !== "false";
    } catch {
      return true;
    }
  }

  // --- History / Temporal operations ---
  private emptyTemporalMetadata(): TemporalMetadataRecord {
    return { segments: [], events: [] };
  }

  private normalizeTemporalSegment(
    input: any
  ): TemporalSegmentRecord | undefined {
    if (!input || typeof input !== "object") return undefined;
    const segmentId =
      typeof input.segmentId === "string" && input.segmentId.length > 0
        ? input.segmentId
        : undefined;
    const openedAt =
      typeof input.openedAt === "string" && input.openedAt.length > 0
        ? input.openedAt
        : undefined;
    if (!segmentId || !openedAt) return undefined;
    const segment: TemporalSegmentRecord = {
      segmentId,
      openedAt,
      closedAt:
        typeof input.closedAt === "string" && input.closedAt.length > 0
          ? input.closedAt
          : undefined,
      changeSetId:
        typeof input.changeSetId === "string" && input.changeSetId.length > 0
          ? input.changeSetId
          : undefined,
    };
    return segment;
  }

  private normalizeTemporalMetadata(meta: any): TemporalMetadataRecord {
    if (!meta || typeof meta !== "object") {
      return this.emptyTemporalMetadata();
    }
    const normalized: TemporalMetadataRecord = {
      changeSetId:
        typeof meta.changeSetId === "string" && meta.changeSetId.length > 0
          ? meta.changeSetId
          : undefined,
      current: this.normalizeTemporalSegment(meta.current),
      segments: Array.isArray(meta.segments)
        ? meta.segments
            .map((segment: any) => this.normalizeTemporalSegment(segment))
            .filter((segment): segment is TemporalSegmentRecord => Boolean(segment))
        : [],
      events: Array.isArray(meta.events)
        ? meta.events
            .filter(
              (event: any) =>
                event &&
                (event.type === "opened" || event.type === "closed") &&
                typeof event.at === "string"
            )
            .map((event: any) => ({
              type: event.type as "opened" | "closed",
              at: event.at,
              changeSetId:
                typeof event.changeSetId === "string" &&
                event.changeSetId.length > 0
                  ? event.changeSetId
                  : undefined,
              segmentId:
                typeof event.segmentId === "string" && event.segmentId.length > 0
                  ? event.segmentId
                  : undefined,
            }))
        : [],
    };
    return normalized;
  }

  private parseTemporalMetadata(raw: any): TemporalMetadataRecord {
    if (raw == null) {
      return this.emptyTemporalMetadata();
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return this.normalizeTemporalMetadata(parsed);
      } catch {
        return this.emptyTemporalMetadata();
      }
    }
    if (typeof raw === "object") {
      return this.normalizeTemporalMetadata(raw);
    }
    return this.emptyTemporalMetadata();
  }

  private serializeTemporalMetadata(meta: TemporalMetadataRecord): string {
    return JSON.stringify(meta);
  }

  private pushTemporalSegment(
    meta: TemporalMetadataRecord,
    segment: TemporalSegmentRecord
  ): void {
    if (!segment.segmentId || !segment.openedAt) return;
    const exists = meta.segments.some(
      (existing) =>
        existing.segmentId === segment.segmentId &&
        existing.openedAt === segment.openedAt &&
        (existing.closedAt ?? null) === (segment.closedAt ?? null)
    );
    if (!exists) {
      meta.segments.push(segment);
      if (meta.segments.length > 100) {
        meta.segments = meta.segments.slice(-100);
      }
    }
  }

  private recordTemporalEvent(
    meta: TemporalMetadataRecord,
    event: TemporalEventRecord
  ): void {
    meta.events.push(event);
    if (meta.events.length > 250) {
      meta.events = meta.events.slice(-250);
    }
  }

  /**
   * Append a compact version snapshot for an entity when its content changes.
   */
  async appendVersion(
    entity: Entity,
    opts?: { changeSetId?: string; timestamp?: Date }
  ): Promise<string> {
    if (!this.isHistoryEnabled()) {
      const vid = `ver_${
        (entity as any)?.id || "disabled"
      }_${Date.now().toString(36)}`;
      console.log(
        `📝 [history disabled] appendVersion skipped; returning ${vid}`
      );
      return vid;
    }
    const entityIdRaw = (entity as any)?.id;
    if (!entityIdRaw) throw new Error("appendVersion: entity.id is required");
    const entityId = this.resolveEntityIdInput(entityIdRaw);
    const ts = opts?.timestamp || new Date();
    const tsISO = ts.toISOString();
    const hash = (entity as any)?.hash || "";
    const path = (
      this.hasCodebaseProperties(entity) ? (entity as any).path : undefined
    ) as string | undefined;
    const language = (
      this.hasCodebaseProperties(entity) ? (entity as any).language : undefined
    ) as string | undefined;
    const vid = `ver_${entityId}_${hash || Date.now().toString(36)}`;

    const vprops: Record<string, any> = {
      id: vid,
      type: "version",
      entityId,
      hash,
      timestamp: tsISO,
    };
    if (path) vprops.path = path;
    if (language) vprops.language = language;
    if (opts?.changeSetId) vprops.changeSetId = opts.changeSetId;

    const continuityRows = await this.graphDbQuery(
      `MATCH (e {id: $entityId})
       OPTIONAL MATCH (e)<-[:OF]-(prev:version)
       WHERE prev.timestamp <= $ts
       WITH e, prev
       ORDER BY prev.timestamp DESC
       WITH e, collect(prev) AS prevs
       OPTIONAL MATCH (e)<-[:OF]-(future:version)
       WHERE future.timestamp > $ts
       WITH e, prevs, collect(future) AS futures
       RETURN
         CASE WHEN size(prevs) = 0 THEN NULL ELSE prevs[0].id END AS prevId,
         CASE WHEN size(prevs) = 0 THEN NULL ELSE prevs[0].timestamp END AS prevTimestamp,
         size(futures) AS futureCount
      `,
      { entityId, ts: tsISO }
    );

    const continuity =
      Array.isArray(continuityRows) && continuityRows.length > 0
        ? continuityRows[0]
        : { prevId: null, prevTimestamp: null, futureCount: 0 };

    const futureCount = Number(continuity.futureCount ?? 0);
    if (futureCount > 0) {
      throw new Error(
        `appendVersion: refused to create version at ${tsISO} for ${entityId} because newer versions exist`
      );
    }

    const prevIdRaw =
      typeof continuity.prevId === "string" && continuity.prevId.length > 0
        ? continuity.prevId
        : null;
    const prevId = prevIdRaw ? this.resolveEntityIdInput(prevIdRaw) : null;
    const prevTimestamp =
      typeof continuity.prevTimestamp === "string" &&
      continuity.prevTimestamp.length > 0
        ? continuity.prevTimestamp
        : null;

    const steps: TemporalTransactionStep[] = [];

    steps.push({
      query: `
        MATCH (e {id: $entityId})
        OPTIONAL MATCH (e)<-[:OF]-(future:version)
        WHERE future.timestamp > $ts
        WITH e, collect(future.id) AS futureVersions
        WHERE size(futureVersions) = 0
        OPTIONAL MATCH (e)<-[:OF]-(prevCandidate:version)
        WHERE prevCandidate.timestamp <= $ts
        WITH e, prevCandidate
        ORDER BY prevCandidate.timestamp DESC
        WITH e, collect(prevCandidate)[0] AS prev
        WHERE ($prevId IS NULL AND prev IS NULL)
           OR (prev IS NOT NULL AND prev.id = $prevId AND NOT EXISTS {
             MATCH (e)<-[:OF]-(between:version)
             WHERE between.timestamp > prev.timestamp AND between.timestamp < $ts
           })
        MERGE (v:version { id: $vid })
        SET v += $vprops,
            v.timestamp = $ts
        WITH e, v, prev
        MERGE (v)-[of:OF { id: $ofId }]->(e)
        ON CREATE SET of.created = $ts, of.version = 1, of.metadata = '{}'
        SET of.lastModified = $ts,
            of.version = coalesce(of.version, 0) + 1
        RETURN v.id AS versionId,
               prev.id AS previousId
      `,
      params: {
        entityId,
        vid,
        ts: tsISO,
        vprops,
        ofId: `rel_${vid}_${entityId}_OF`,
        prevId,
      },
    });

    if (prevId) {
      steps.push({
        query: `
          MATCH (v:version { id: $vid })-[:OF]->(e {id: $entityId})
          OPTIONAL MATCH (v)-[existing:PREVIOUS_VERSION]->(other:version)
          WITH e, v, existing, other
          MATCH (prev:version { id: $prevId })-[:OF]->(e)
          WITH e, v, prev, existing, other
          WHERE prev.timestamp <= $ts
            AND (existing IS NULL OR other.id = $prevId)
            AND NOT EXISTS {
              MATCH (e)<-[:OF]-(between:version)
              WHERE between.timestamp > prev.timestamp AND between.timestamp < $ts
            }
          MERGE (v)-[r:PREVIOUS_VERSION { id: $relId }]->(prev)
          ON CREATE SET r.created = $ts, r.version = 0, r.metadata = '{}'
          SET r.lastModified = $ts,
              r.version = coalesce(r.version, 0) + 1
          RETURN r.id AS relId
        `,
        params: {
          entityId,
          vid,
          prevId,
          ts: tsISO,
          relId: this.canonicalRelationshipId(
            vid,
            prevId,
            RelationshipType.PREVIOUS_VERSION
          ),
        },
      });
    }

    let changeStepIndex = -1;
    let changeRelType = prevId
      ? RelationshipType.MODIFIED_IN
      : RelationshipType.CREATED_IN;

    if (opts?.changeSetId) {
      const changeId = this.namespaceId(opts.changeSetId);
      const metadata = JSON.stringify({
        entityId,
        versionId: vid,
        changeSetId: opts.changeSetId,
        timestamp: tsISO,
        previousVersionId: prevId ?? undefined,
        previousTimestamp: prevTimestamp ?? undefined,
      });
      steps.push({
        query: `
          MATCH (v:version { id: $vid })-[:OF]->(e {id: $entityId})
          MERGE (c:change { id: $changeId })
          ON CREATE SET c.type = 'change', c.createdAt = $ts
          SET c.timestamp = $ts,
              c.lastSeenAt = $ts,
              c.changeSetKey = $rawChangeId
          MERGE (v)-[vc:${changeRelType} { id: $versionRelId }]->(c)
          ON CREATE SET vc.created = $ts, vc.version = 0, vc.metadata = $metadata
          SET vc.lastModified = $ts,
              vc.version = coalesce(vc.version, 0) + 1,
              vc.metadata = $metadata
          MERGE (e)-[ec:${changeRelType} { id: $entityRelId }]->(c)
          ON CREATE SET ec.created = $ts, ec.version = 0, ec.metadata = $metadata
          SET ec.lastModified = $ts,
              ec.version = coalesce(ec.version, 0) + 1,
              ec.metadata = $metadata
          RETURN c.id AS changeId
        `,
        params: {
          entityId,
          vid,
          changeId,
          rawChangeId: opts.changeSetId,
          ts: tsISO,
          metadata,
          versionRelId: this.canonicalRelationshipId(
            vid,
            changeId,
            changeRelType
          ),
          entityRelId: this.canonicalRelationshipId(
            entityId,
            changeId,
            changeRelType
          ),
        },
      });
      changeStepIndex = steps.length - 1;
    }

    const txnResults = await this.runTemporalTransaction(steps);
    if (txnResults.length === 0 || txnResults[0].data.length === 0) {
      throw new Error(
        `appendVersion: transactional insert failed for ${vid}; a newer version may have been written concurrently`
      );
    }

    if (prevId) {
      const prevResult = txnResults[1];
      if (!prevResult || prevResult.data.length === 0) {
        throw new Error(
          `appendVersion: continuity guard prevented linking ${vid} -> ${prevId}`
        );
      }
    }

    if (opts?.changeSetId && changeStepIndex >= 0) {
      const changeResult = txnResults[changeStepIndex];
      if (!changeResult || changeResult.data.length === 0) {
        console.warn(
          `⚠️ appendVersion: change linkage for ${opts.changeSetId} was skipped`
        );
      }
    }

    console.log({
      event: "history.version_created",
      entityId,
      versionId: vid,
      timestamp: tsISO,
      changeSetId: opts?.changeSetId,
    });
    return vid;
  }

  async repairPreviousVersionLink(
    entityId: string,
    currentVersionId: string,
    previousVersionId: string,
    options: { timestamp?: Date } = {}
  ): Promise<boolean> {
    if (!this.isHistoryEnabled()) {
      return false;
    }

    const resolvedEntityId = this.resolveEntityIdInput(entityId);
    const resolvedCurrentId = this.resolveEntityIdInput(currentVersionId);
    const resolvedPrevId = this.resolveEntityIdInput(previousVersionId);
    const tsISO = (options.timestamp || new Date()).toISOString();

    const steps: TemporalTransactionStep[] = [
      {
        query: `
          MATCH (current:version { id: $currentId })-[:OF]->(e {id: $entityId})
          MATCH (prev:version { id: $prevId })-[:OF]->(e)
          OPTIONAL MATCH (current)-[existing:PREVIOUS_VERSION]->(other:version)
          WITH current, prev, existing, other, e
          WHERE prev.timestamp <= current.timestamp
            AND (existing IS NULL OR other.id = $prevId)
            AND NOT EXISTS {
              MATCH (e)<-[:OF]-(between:version)
              WHERE between.timestamp > prev.timestamp
                AND between.timestamp < current.timestamp
            }
          MERGE (current)-[r:PREVIOUS_VERSION { id: $relId }]->(prev)
          ON CREATE SET r.created = $ts, r.version = 0, r.metadata = '{}'
          SET r.lastModified = $ts,
              r.version = coalesce(r.version, 0) + 1
          RETURN r.id AS id
        `,
        params: {
          entityId: resolvedEntityId,
          currentId: resolvedCurrentId,
          prevId: resolvedPrevId,
          ts: tsISO,
          relId: this.canonicalRelationshipId(
            resolvedCurrentId,
            resolvedPrevId,
            RelationshipType.PREVIOUS_VERSION
          ),
        },
      },
    ];

    const results = await this.runTemporalTransaction(steps);
    const rows = results[0]?.data ?? [];
    const repaired = rows.length > 0;
    if (repaired) {
      console.log({
        event: "history.version_repaired",
        entityId: resolvedEntityId,
        versionId: resolvedCurrentId,
        previousVersionId: resolvedPrevId,
        timestamp: tsISO,
      });
    }
    return repaired;
  }

  /**
   * Open (or create) a relationship with a validity interval starting at ts.
   * Stub: logs intent; no-op.
   */
  async openEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    if (!this.isHistoryEnabled()) {
      console.log(
        `🔗 [history disabled] openEdge skipped for ${fromId}->${toId} ${type}`
      );
      return;
    }
    const at = (ts || new Date()).toISOString();
    const resolvedFrom = this.resolveEntityIdInput(fromId);
    const resolvedTo = this.resolveEntityIdInput(toId);
    const relationshipId = this.canonicalRelationshipId(
      resolvedFrom,
      resolvedTo,
      type
    );
    const existingRows = await this.graphDbQuery(
      `MATCH (a {id: $fromId})-[r:${type} { id: $id }]->(b {id: $toId})
       RETURN r.validFrom AS validFrom,
              r.validTo AS validTo,
              r.temporal AS temporal,
              r.segmentId AS segmentId,
              r.lastChangeSetId AS lastChangeSetId,
              r.version AS version,
              r.lastModified AS lastModified
      `,
      { fromId: resolvedFrom, toId: resolvedTo, id: relationshipId }
    );
    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    const meta = this.parseTemporalMetadata(existing?.temporal);
    const changeKey =
      (changeSetId && changeSetId.length > 0 ? changeSetId : undefined) ||
      meta.changeSetId ||
      (existing?.lastChangeSetId as string | undefined);
    if (changeKey) {
      meta.changeSetId = changeKey;
    }
    const newSegmentId = `seg_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    if (!existing) {
      const current: TemporalSegmentRecord = {
        segmentId: newSegmentId,
        openedAt: at,
        changeSetId: changeKey,
      };
      meta.current = current;
      this.recordTemporalEvent(meta, {
        type: "opened",
        at,
        changeSetId: changeKey,
        segmentId: current.segmentId,
      });
      const temporal = this.serializeTemporalMetadata(meta);
      const params: Record<string, any> = {
        fromId: resolvedFrom,
        toId: resolvedTo,
        id: relationshipId,
        at,
        segmentId: newSegmentId,
        temporal,
      };
      if (changeKey) params.changeSetId = changeKey;
      const changeClause = changeKey ? ", r.lastChangeSetId = $changeSetId" : "";
      const transactionResults = await this.runTemporalTransaction([
        {
          query: `
            MATCH (a {id: $fromId}), (b {id: $toId})
            OPTIONAL MATCH (a)-[existing:${type} { id: $id }]->(b)
            WITH a, b, existing
            WHERE existing IS NULL
            MERGE (a)-[r:${type} { id: $id }]->(b)
            ON CREATE SET r.created = $at, r.version = 0
            SET r.lastModified = $at,
                r.version = coalesce(r.version, 0) + 1,
                r.validFrom = $at,
                r.validTo = NULL,
                r.active = true,
                r.segmentId = $segmentId,
                r.temporal = $temporal${changeClause}
            RETURN r.id AS id
          `,
          params,
        },
      ]);
      const rows = transactionResults[0]?.data ?? [];
      if (rows.length === 0) {
        throw new Error(
          `openEdge: relationship ${relationshipId} was created concurrently; please retry`
        );
      }
      console.log({
        event: "history.edge_opened",
        id: relationshipId,
        type,
        fromId: resolvedFrom,
        toId: resolvedTo,
        at,
        changeSetId: changeKey,
        segmentId: newSegmentId,
      });
      return;
    }

    const wasActive = existing.validTo == null;
    if (!wasActive) {
      const priorSegment: TemporalSegmentRecord = {
        segmentId:
          (existing.segmentId as string | undefined) ||
          meta.current?.segmentId ||
          `seg_prev_${Math.random().toString(36).slice(2, 8)}`,
        openedAt:
          (existing.validFrom as string | undefined) ||
          meta.current?.openedAt ||
          at,
        closedAt: existing.validTo as string | undefined,
        changeSetId:
          (existing.lastChangeSetId as string | undefined) ||
          meta.current?.changeSetId ||
          meta.changeSetId,
      };
      if (priorSegment.closedAt) {
        this.pushTemporalSegment(meta, priorSegment);
      }
      const current: TemporalSegmentRecord = {
        segmentId: newSegmentId,
        openedAt: at,
        changeSetId: changeKey ?? priorSegment.changeSetId,
      };
      meta.current = current;
      this.recordTemporalEvent(meta, {
        type: "opened",
        at,
        changeSetId: current.changeSetId,
        segmentId: current.segmentId,
      });
      const temporal = this.serializeTemporalMetadata(meta);
      const params: Record<string, any> = {
        fromId: resolvedFrom,
        toId: resolvedTo,
        id: relationshipId,
        at,
        segmentId: newSegmentId,
        temporal,
        expectedValidTo: existing.validTo ?? null,
        expectedVersion: Number(existing.version ?? 0),
      };
      if (current.changeSetId) params.changeSetId = current.changeSetId;
      const changeClause = params.changeSetId
        ? ", r.lastChangeSetId = $changeSetId"
        : "";
      const transactionResults = await this.runTemporalTransaction([
        {
          query: `
            MATCH (a {id: $fromId})-[r:${type} { id: $id }]->(b {id: $toId})
            WHERE r.validTo IS NOT NULL
              AND (( $expectedValidTo IS NULL AND r.validTo IS NULL ) OR r.validTo = $expectedValidTo)
              AND coalesce(r.version, 0) = $expectedVersion
            SET r.lastModified = $at,
                r.validFrom = $at,
                r.validTo = NULL,
                r.active = true,
                r.segmentId = $segmentId,
                r.version = coalesce(r.version, 0) + 1,
                r.temporal = $temporal${changeClause}
            RETURN r.id AS id
          `,
          params,
        },
      ]);
      const rows = transactionResults[0]?.data ?? [];
      if (rows.length === 0) {
        throw new Error(
          `openEdge: relationship ${relationshipId} state changed before reopen; retry`
        );
      }
      console.log({
        event: "history.edge_reopened",
        id: relationshipId,
        type,
        fromId: resolvedFrom,
        toId: resolvedTo,
        at,
        changeSetId: params.changeSetId,
        segmentId: newSegmentId,
      });
      return;
    }

    const current = meta.current ?? {
      segmentId:
        (existing.segmentId as string | undefined) ||
        `seg_active_${Math.random().toString(36).slice(2, 8)}`,
      openedAt:
        (existing.validFrom as string | undefined) ||
        at,
      changeSetId: changeKey,
    };
    if (changeKey) {
      current.changeSetId = changeKey;
    }
    if (!meta.current) {
      meta.current = current;
    }
    const temporal = this.serializeTemporalMetadata(meta);
    const params: Record<string, any> = {
      fromId: resolvedFrom,
      toId: resolvedTo,
      id: relationshipId,
      at,
      temporal,
      expectedVersion: Number(existing.version ?? 0),
    };
    if (changeKey) params.changeSetId = changeKey;
    const changeClause = changeKey ? ", r.lastChangeSetId = $changeSetId" : "";
    const transactionResults = await this.runTemporalTransaction([
      {
        query: `
          MATCH (a {id: $fromId})-[r:${type} { id: $id }]->(b {id: $toId})
          WHERE r.validTo IS NULL
            AND coalesce(r.version, 0) = $expectedVersion
          SET r.lastModified = $at,
              r.version = coalesce(r.version, 0) + 1,
              r.temporal = $temporal${changeClause}
          RETURN r.id AS id
        `,
        params,
      },
    ]);
    const rows = transactionResults[0]?.data ?? [];
    if (rows.length === 0) {
      throw new Error(
        `openEdge: relationship ${relationshipId} changed while updating metadata; retry`
      );
    }
    console.log({
      event: "history.edge_opened_refresh",
      id: relationshipId,
      type,
      fromId: resolvedFrom,
      toId: resolvedTo,
      at,
      changeSetId: changeKey,
      segmentId: current.segmentId,
    });
  }

  /**
   * Close a relationship's validity interval at ts.
   * Stub: logs intent; no-op.
   */
  async closeEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    if (!this.isHistoryEnabled()) {
      console.log(
        `⛓️ [history disabled] closeEdge skipped for ${fromId}->${toId} ${type}`
      );
      return;
    }
    const at = (ts || new Date()).toISOString();
    const resolvedFrom = this.resolveEntityIdInput(fromId);
    const resolvedTo = this.resolveEntityIdInput(toId);
    const rows = await this.graphDbQuery(
      `MATCH (a {id: $fromId})-[r:${type}]->(b {id: $toId})
       RETURN r.id AS id,
              r.validFrom AS validFrom,
              r.validTo AS validTo,
              r.temporal AS temporal,
              r.segmentId AS segmentId,
              r.lastChangeSetId AS lastChangeSetId,
              r.version AS version,
              r.lastModified AS lastModified
       ORDER BY coalesce(r.lastModified, r.validFrom) DESC
       LIMIT 1
      `,
      { fromId: resolvedFrom, toId: resolvedTo }
    );
    if (!rows || rows.length === 0) {
      console.log({
        event: "history.edge_closed_missing",
        id: this.canonicalRelationshipId(resolvedFrom, resolvedTo, type),
        type,
        fromId: resolvedFrom,
        toId: resolvedTo,
        at,
      });
      return;
    }
    const row = rows[0];
    const relationshipId =
      (row.id as string | undefined) ||
      this.canonicalRelationshipId(resolvedFrom, resolvedTo, type);
    const meta = this.parseTemporalMetadata(row.temporal);
    const changeKey =
      (changeSetId && changeSetId.length > 0 ? changeSetId : undefined) ||
      meta.changeSetId ||
      (row.lastChangeSetId as string | undefined);
    if (changeKey) {
      meta.changeSetId = changeKey;
    }
    const current =
      meta.current ||
      this.normalizeTemporalSegment({
        segmentId: row.segmentId,
        openedAt: row.validFrom,
        changeSetId: row.lastChangeSetId,
      }) || {
        segmentId: `seg_${Math.random().toString(36).slice(2, 8)}`,
        openedAt: (row.validFrom as string | undefined) || at,
        changeSetId: row.lastChangeSetId as string | undefined,
      };
    if (changeKey) {
      current.changeSetId = changeKey;
    }
    current.closedAt = at;
    this.pushTemporalSegment(meta, { ...current });
    meta.current = { ...current };
    this.recordTemporalEvent(meta, {
      type: "closed",
      at,
      changeSetId: current.changeSetId,
      segmentId: current.segmentId,
    });
    const temporal = this.serializeTemporalMetadata(meta);
    const params: Record<string, any> = {
      fromId: resolvedFrom,
      toId: resolvedTo,
      id: relationshipId,
      at,
      temporal,
      expectedVersion: Number(row.version ?? 0),
    };
    if (changeKey) params.changeSetId = changeKey;
    const changeClause = changeKey ? ", r.lastChangeSetId = $changeSetId" : "";
    const transactionResults = await this.runTemporalTransaction([
      {
        query: `
          MATCH (a {id: $fromId})-[r:${type} { id: $id }]->(b {id: $toId})
          WHERE r.validTo IS NULL
            AND coalesce(r.version, 0) = $expectedVersion
          SET r.validTo = coalesce(r.validTo, $at),
              r.lastModified = $at,
              r.active = false,
              r.version = coalesce(r.version, 0) + 1,
              r.temporal = $temporal${changeClause}
          RETURN r.id AS id
        `,
        params,
      },
    ]);
    const rowsUpdated = transactionResults[0]?.data ?? [];
    if (rowsUpdated.length === 0) {
      throw new Error(
        `closeEdge: relationship ${relationshipId} changed before close; retry`
      );
    }
    console.log({
      event: "history.edge_closed",
      id: relationshipId,
      type,
      fromId: resolvedFrom,
      toId: resolvedTo,
      at,
      changeSetId: changeKey,
      segmentId: current.segmentId,
    });
  }

  async getEntityTimeline(
    entityId: string,
    options?: {
      includeRelationships?: boolean;
      limit?: number;
      offset?: number;
      since?: Date | string;
      until?: Date | string;
    }
  ): Promise<EntityTimelineResult> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    const limitRaw = Number(options?.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
      : 50;
    const offsetRaw = Number(options?.offset ?? 0);
    const offset = Number.isFinite(offsetRaw)
      ? Math.max(0, Math.min(1000, Math.floor(offsetRaw)))
      : 0;
    const parseWindow = (value?: Date | string): string | undefined => {
      if (!value) return undefined;
      const date = new Date(value as any);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };
    const since = parseWindow(options?.since);
    const until = parseWindow(options?.until);

    const versionRows = await this.graphDbQuery(
      `MATCH (e {id: $entityId})<-[:OF]-(v:version)
       WHERE ($since IS NULL OR v.timestamp >= $since)
         AND ($until IS NULL OR v.timestamp <= $until)
       OPTIONAL MATCH (v)-[:PREVIOUS_VERSION]->(prev:version)
       RETURN v.id AS id,
              v.hash AS hash,
              v.timestamp AS timestamp,
              v.path AS path,
              v.language AS language,
              v.changeSetId AS changeSetId,
              prev.id AS previousId
       ORDER BY v.timestamp DESC
       SKIP $offset
       LIMIT $limit
      `,
      { entityId: resolvedId, limit, offset, since, until }
    );

    const versions: EntityTimelineEntry[] = (versionRows || []).map(
      (row: any) => {
        const ts =
          row.timestamp && typeof row.timestamp === "string"
            ? new Date(row.timestamp)
            : this.toDate(row.timestamp) || new Date();
        const metadata: Record<string, any> = {};
        if (row.path) metadata.path = row.path;
        if (row.language) metadata.language = row.language;
        const entry: EntityTimelineEntry = {
          versionId: row.id,
          hash: row.hash ?? undefined,
          timestamp: ts,
          path: row.path ?? undefined,
          language: row.language ?? undefined,
          changeSetId: row.changeSetId ?? undefined,
          previousVersionId: row.previousId ?? null,
          changes: [],
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
        return entry;
      }
    );

    const versionIds = versions.map((entry) => entry.versionId);
    if (versionIds.length > 0) {
      const changeRows = await this.graphDbQuery(
        `UNWIND $versionIds AS vid
         MATCH (v:version {id: vid})-[rel]->(c:change)
         WHERE type(rel) IN ['CREATED_IN','MODIFIED_IN','REMOVED_IN']
         RETURN vid AS versionId,
                type(rel) AS relType,
                rel.metadata AS metadata,
                rel.lastModified AS lastModified,
                c AS change,
                c.id AS changeId
        `,
        { versionIds }
      );
      const versionMap = new Map<string, EntityTimelineEntry>();
      for (const entry of versions) {
        versionMap.set(entry.versionId, entry);
      }
      for (const row of changeRows || []) {
        const entry = versionMap.get(row.versionId);
        if (!entry) continue;
        let metadata: Record<string, any> | undefined;
        if (typeof row.metadata === "string") {
          try {
            metadata = JSON.parse(row.metadata);
          } catch {
            metadata = undefined;
          }
        } else if (row.metadata && typeof row.metadata === "object") {
          metadata = row.metadata;
        }
        const changeEntity = this.parseEntityFromGraph(row.change) as Change;
        entry.changes.push({
          changeId: row.changeId || changeEntity?.id,
          type: row.relType as RelationshipType,
          metadata,
          change: changeEntity,
        });
        if (!entry.changeSetId) {
          const changeSetKey = (changeEntity as any)?.changeSetKey;
          if (typeof changeSetKey === "string" && changeSetKey.length > 0) {
            entry.changeSetId = changeSetKey;
          }
        }
      }
    }

    let relationships: RelationshipTimeline[] | undefined;
    if (options?.includeRelationships) {
      const relRows = await this.graphDbQuery(
        `MATCH (a {id: $entityId})-[r]->(b)
         WHERE r.temporal IS NOT NULL OR r.validFrom IS NOT NULL OR r.validTo IS NOT NULL
         RETURN r.id AS id,
                type(r) AS type,
                a.id AS fromId,
                b.id AS toId,
                r.validFrom AS validFrom,
                r.validTo AS validTo,
                coalesce(r.active, r.validTo IS NULL) AS active,
                r.lastModified AS lastModified,
                r.temporal AS temporal,
                r.segmentId AS segmentId,
                r.lastChangeSetId AS lastChangeSetId
         UNION ALL
         MATCH (a)-[r]->(b {id: $entityId})
         WHERE r.temporal IS NOT NULL OR r.validFrom IS NOT NULL OR r.validTo IS NOT NULL
         RETURN r.id AS id,
                type(r) AS type,
                a.id AS fromId,
                b.id AS toId,
                r.validFrom AS validFrom,
                r.validTo AS validTo,
                coalesce(r.active, r.validTo IS NULL) AS active,
                r.lastModified AS lastModified,
                r.temporal AS temporal,
                r.segmentId AS segmentId,
                r.lastChangeSetId AS lastChangeSetId
         LIMIT $relLimit
        `,
        { entityId: resolvedId, relLimit: Math.min(limit * 2, 200) }
      );
      relationships = (relRows || []).map((row: any) =>
        this.buildRelationshipTimelineFromRow(row)
      );
    }

    return {
      entityId: resolvedId,
      versions,
      relationships,
    };
  }

  private buildRelationshipTimelineFromRow(
    row: any
  ): RelationshipTimeline {
    const temporal = this.parseTemporalMetadata(row.temporal);
    if (!temporal.current && row.validFrom) {
      temporal.current = this.normalizeTemporalSegment({
        segmentId: row.segmentId,
        openedAt: row.validFrom,
        closedAt: row.validTo,
        changeSetId: temporal.changeSetId || row.lastChangeSetId,
      });
    } else if (temporal.current) {
      if (!temporal.current.openedAt && row.validFrom) {
        temporal.current.openedAt = row.validFrom;
      }
      if (!temporal.current.closedAt && row.validTo) {
        temporal.current.closedAt = row.validTo;
      }
      if (!temporal.current.changeSetId && row.lastChangeSetId) {
        temporal.current.changeSetId = row.lastChangeSetId;
      }
    }
    if (!temporal.changeSetId && row.lastChangeSetId) {
      temporal.changeSetId = row.lastChangeSetId;
    }

    const convertSegment = (
      segment?: TemporalSegmentRecord
    ): RelationshipTimelineSegment | undefined => {
      if (!segment || !segment.segmentId || !segment.openedAt) return undefined;
      const opened = this.toDate(segment.openedAt);
      if (!opened) return undefined;
      const closed = this.toDate(segment.closedAt);
      return {
        segmentId: segment.segmentId,
        openedAt: opened,
        closedAt: closed ?? undefined,
        changeSetId: segment.changeSetId,
      };
    };

    const segments: RelationshipTimelineSegment[] = [];
    const seen = new Set<string>();
    const addSegment = (segment?: TemporalSegmentRecord) => {
      const converted = convertSegment(segment);
      if (!converted) return;
      const key = `${converted.segmentId}|${converted.openedAt.toISOString()}|${
        converted.closedAt ? converted.closedAt.toISOString() : ""
      }`;
      if (seen.has(key)) return;
      seen.add(key);
      segments.push(converted);
    };

    for (const segment of temporal.segments) addSegment(segment);
    addSegment(temporal.current);

    segments.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());

    const temporalInfo: Record<string, any> = {};
    if (temporal.changeSetId) temporalInfo.changeSetId = temporal.changeSetId;
    if (temporal.events.length > 0) {
      temporalInfo.events = temporal.events.slice(-100);
    }

    const timeline: RelationshipTimeline = {
      relationshipId: row.id,
      type: row.type,
      fromEntityId: row.fromId,
      toEntityId: row.toId,
      active: row.active === true || row.validTo == null,
      current: convertSegment(temporal.current),
      segments,
      lastModified: this.toDate(row.lastModified) ?? undefined,
      temporal: Object.keys(temporalInfo).length > 0 ? temporalInfo : undefined,
    };

    return timeline;
  }

  async getRelationshipTimeline(
    relationshipId: string
  ): Promise<RelationshipTimeline | null> {
    const resolvedId = this.resolveRelationshipIdInput(relationshipId);
    const rows = await this.graphDbQuery(
      `MATCH (a)-[r { id: $id }]->(b)
       RETURN r.id AS id,
              type(r) AS type,
              a.id AS fromId,
              b.id AS toId,
              r.validFrom AS validFrom,
              r.validTo AS validTo,
              coalesce(r.active, r.validTo IS NULL) AS active,
              r.lastModified AS lastModified,
              r.temporal AS temporal,
              r.segmentId AS segmentId,
              r.lastChangeSetId AS lastChangeSetId
      `,
      { id: resolvedId }
    );
    if (!rows || rows.length === 0) {
      return null;
    }
    return this.buildRelationshipTimelineFromRow(rows[0]);
  }

  async getChangesForSession(
    sessionId: string,
    options?: { since?: Date | string; until?: Date | string; limit?: number }
  ): Promise<SessionChangesResult> {
    const resolvedSessionId = this.resolveEntityIdInput(sessionId);
    const limitRaw = Number(options?.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
      : 50;
    const parseWindow = (value?: Date | string): string | undefined => {
      if (!value) return undefined;
      const date = new Date(value as any);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };
    const since = parseWindow(options?.since);
    const until = parseWindow(options?.until);

    const baseParams: Record<string, any> = {
      sessionId: resolvedSessionId,
      since,
      until,
    };

    const totalRes = await this.graphDbQuery(
      `MATCH (s {id: $sessionId})-[:DEPENDS_ON_CHANGE|SESSION_MODIFIED|SESSION_IMPACTED]->(c:change)
       WHERE ($since IS NULL OR c.timestamp >= $since) AND ($until IS NULL OR c.timestamp <= $until)
       RETURN count(DISTINCT c) AS total
      `,
      baseParams
    );
    const total = totalRes?.[0]?.total ?? 0;

    const rows = await this.graphDbQuery(
      `MATCH (s {id: $sessionId})-[:DEPENDS_ON_CHANGE|SESSION_MODIFIED|SESSION_IMPACTED]->(c:change)
       WHERE ($since IS NULL OR c.timestamp >= $since) AND ($until IS NULL OR c.timestamp <= $until)
       RETURN DISTINCT c, c.timestamp AS timestamp
       ORDER BY timestamp DESC
       LIMIT $limit
      `,
      { ...baseParams, limit }
    );

    if (!rows || rows.length === 0) {
      return { sessionId: resolvedSessionId, total, changes: [] };
    }

    const changes: SessionChangeSummary[] = [];
    const changeIds: string[] = [];
    for (const row of rows) {
      const changeEntity = this.parseEntityFromGraph(row.c) as Change;
      if (changeEntity?.id) {
        changeIds.push(changeEntity.id);
      }
      changes.push({
        change: changeEntity,
        relationships: [],
        versions: [],
      });
    }

    if (changeIds.length > 0) {
      const changeMap = new Map<string, SessionChangeSummary>();
      for (const summary of changes) {
        if (summary.change?.id) {
          changeMap.set(summary.change.id, summary);
        }
      }

      const relRows = await this.graphDbQuery(
        `UNWIND $changeIds AS cid
         MATCH (a)-[rel]->(b)
         WHERE rel.id IS NOT NULL AND (a.id = cid OR b.id = cid)
           AND type(rel) IN ['MODIFIED_IN','CREATED_IN','REMOVED_IN','MODIFIED_BY']
         RETURN cid AS changeId,
                type(rel) AS relType,
                rel.id AS relId,
                a.id AS fromId,
                b.id AS toId
        `,
        { changeIds }
      );
      for (const row of relRows || []) {
        const summary = changeMap.get(row.changeId);
        if (!summary) continue;
        let entityId: string | undefined;
        let direction: "incoming" | "outgoing" = "outgoing";
        if (row.changeId === row.fromId) {
          entityId = row.toId;
          direction = "outgoing";
        } else if (row.changeId === row.toId) {
          entityId = row.fromId;
          direction = "incoming";
        } else {
          entityId = row.fromId;
        }
        summary.relationships.push({
          relationshipId: row.relId,
          type: row.relType as RelationshipType,
          entityId,
          direction,
        });
      }

      const versionRows = await this.graphDbQuery(
        `UNWIND $changeIds AS cid
         MATCH (v:version)-[rel]->(c:change {id: cid})
         WHERE type(rel) IN ['CREATED_IN','MODIFIED_IN','REMOVED_IN']
         RETURN cid AS changeId,
                v.id AS versionId,
                coalesce(v.entityId, '') AS entityId,
                type(rel) AS relType
        `,
        { changeIds }
      );
      for (const row of versionRows || []) {
        const summary = changeMap.get(row.changeId);
        if (!summary) continue;
        summary.versions.push({
          versionId: row.versionId,
          entityId: row.entityId,
          relationshipType: row.relType as RelationshipType,
        });
      }
    }

    return {
      sessionId: resolvedSessionId,
      total,
      changes,
    };
  }

  /**
   * Create a checkpoint subgraph descriptor and (in full impl) link members.
   * Stub: returns a generated checkpointId.
   */
  async createCheckpoint(
    seedEntities: string[],
    reason: "daily" | "incident" | "manual",
    hops: number,
    window?: TimeRangeParams
  ): Promise<{ checkpointId: string }> {
    if (!this.isHistoryEnabled()) {
      const checkpointId = this.generateCheckpointId();
      console.log(
        `📌 [history disabled] createCheckpoint skipped; returning ${checkpointId}`
      );
      return { checkpointId };
    }
    const envHops = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || "", 10);
    const effectiveHops =
      Number.isFinite(envHops) && envHops > 0 ? envHops : hops || 2;
    const hopsClamped = Math.max(1, Math.min(effectiveHops, 5));
    const checkpointId = this.generateCheckpointId();
    const ts = new Date().toISOString();
    const seeds = seedEntities || [];
    const metadata = { reason, window: window || {} };

    // Create checkpoint node
    await this.graphDbQuery(
      `MERGE (c:checkpoint { id: $id })
       SET c.type = 'checkpoint', c.checkpointId = $id, c.timestamp = $ts, c.reason = $reason, c.hops = $hops, c.seedEntities = $seeds, c.metadata = $meta
      `,
      {
        id: checkpointId,
        ts,
        reason,
        hops,
        seeds: JSON.stringify(seeds),
        meta: JSON.stringify(metadata),
      }
    );

    // Collect neighborhood member ids up to K hops
    const queryMembers = `
      UNWIND $seedIds AS sid
      MATCH (s {id: sid})
      WITH collect(s) AS seeds
      UNWIND seeds AS s
      MATCH (s)-[*1..${hopsClamped}]-(n)
      RETURN DISTINCT n.id AS id
    `;
    const res = await this.graphDbQuery(queryMembers, { seedIds: seeds });
    const memberIds: string[] = (res || [])
      .map((row: any) => row.id)
      .filter(Boolean);

    if (memberIds.length > 0) {
      const ridPrefix = `rel_chk_${checkpointId}_includes_`;
      await this.graphDbQuery(
        `UNWIND $members AS mid
         MATCH (n {id: mid}), (c:checkpoint {id: $cid})
         MERGE (c)-[r:CHECKPOINT_INCLUDES { id: $ridPrefix + mid }]->(n)
         ON CREATE SET r.created = $ts, r.version = 1, r.metadata = '{}'
         SET r.lastModified = $ts
        `,
        { members: memberIds, cid: checkpointId, ts, ridPrefix }
      );
    }

    // Optional embeddings for checkpoint members with checkpointId payload tag
    const embedVersions =
      (process.env.HISTORY_EMBED_VERSIONS || "false").toLowerCase() === "true";
    if (embedVersions && memberIds.length > 0) {
      try {
        const nodes = await this.graphDbQuery(
          `UNWIND $ids AS id MATCH (n {id: id}) RETURN n`,
          { ids: memberIds }
        );
        const entities = (nodes || []).map((row: any) =>
          this.parseEntityFromGraph(row)
        );
        if (entities.length > 0) {
          await this.createEmbeddingsBatch(entities, { checkpointId });
        }
      } catch (e) {
        console.warn("Checkpoint embeddings failed:", e);
      }
    }

    console.log({
      event: "history.checkpoint_created",
      checkpointId,
      members: memberIds.length,
      reason,
      hops: hopsClamped,
      timestamp: ts,
    });
    return { checkpointId };
  }

  /**
   * Prune history artifacts older than the retention window.
   * Stub: returns zeros.
   */
  async pruneHistory(
    retentionDays: number,
    opts?: { dryRun?: boolean }
  ): Promise<{
    versionsDeleted: number;
    edgesClosed: number;
    checkpointsDeleted: number;
  }> {
    if (!this.isHistoryEnabled()) {
      console.log(`🧹 [history disabled] pruneHistory no-op`);
      return { versionsDeleted: 0, edgesClosed: 0, checkpointsDeleted: 0 };
    }
    const cutoff = new Date(
      Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000
    ).toISOString();

    const dry = !!opts?.dryRun;

    const runCountQuery = async (
      dryQuery: string,
      mutateQuery: string,
      label: string
    ): Promise<number> => {
      const query = dry ? dryQuery : mutateQuery;
      try {
        const result = await this.graphDbQuery(query, { cutoff });
        const row = Array.isArray(result) ? result[0] : undefined;
        const value = row?.count ?? row?.c ?? row?.size ?? 0;
        const numeric = Number(value) || 0;
        return numeric < 0 ? 0 : numeric;
      } catch (error) {
        console.warn(
          `⚠️ [history.prune] ${label} query failed, returning 0`,
          error
        );
        return 0;
      }
    };

    // Delete old checkpoints (or count if dry-run)
    const checkpointsDeleted = await runCountQuery(
      `MATCH (c:checkpoint) WHERE c.timestamp < $cutoff RETURN count(c) AS count`,
      `MATCH (c:checkpoint)
         WHERE c.timestamp < $cutoff
         WITH collect(c) AS cs
         FOREACH (x IN cs | DETACH DELETE x)
         RETURN size(cs) AS count`,
      "checkpoint cleanup"
    );

    // Delete relationships that have been closed before cutoff (or count)
    const edgesClosed = await runCountQuery(
      `MATCH ()-[r]-() WHERE r.validTo IS NOT NULL AND r.validTo < $cutoff RETURN count(r) AS count`,
      `MATCH ()-[r]-()
         WHERE r.validTo IS NOT NULL AND r.validTo < $cutoff
         WITH collect(r) AS rs
         FOREACH (x IN rs | DELETE x)
         RETURN size(rs) AS count`,
      "relationship cleanup"
    );

    // Delete versions older than cutoff not referenced by non-expired checkpoints (or count)
    const versionsDeleted = await runCountQuery(
      `MATCH (v:version)
         WHERE v.timestamp < $cutoff AND NOT EXISTS ((:checkpoint)-[:CHECKPOINT_INCLUDES]->(v))
         RETURN count(v) AS count`,
      `MATCH (v:version)
         WHERE v.timestamp < $cutoff AND NOT EXISTS ((:checkpoint)-[:CHECKPOINT_INCLUDES]->(v))
         WITH collect(v) AS vs
         FOREACH (x IN vs | DETACH DELETE x)
         RETURN size(vs) AS count`,
      "version cleanup"
    );
    console.log({
      event: "history.prune",
      dryRun: dry,
      retentionDays,
      cutoff,
      versions: versionsDeleted,
      closedEdges: edgesClosed,
      checkpoints: checkpointsDeleted,
    });
    this._lastPruneSummary = {
      retentionDays,
      cutoff,
      versions: versionsDeleted,
      closedEdges: edgesClosed,
      checkpoints: checkpointsDeleted,
      ...(dry ? { dryRun: true } : {}),
    };
    return { versionsDeleted, edgesClosed, checkpointsDeleted };
  }

  /** Aggregate history-related metrics for admin */
  async getHistoryMetrics(): Promise<{
    versions: number;
    checkpoints: number;
    checkpointMembers: { avg: number; min: number; max: number };
    temporalEdges: { open: number; closed: number };
    lastPrune?: {
      retentionDays: number;
      cutoff: string;
      versions: number;
      closedEdges: number;
      checkpoints: number;
      dryRun?: boolean;
    } | null;
    totals: { nodes: number; relationships: number };
  }> {
    // Parallelize counts
    const [
      nodesRow,
      relsRow,
      verRow,
      cpRow,
      openEdgesRow,
      closedEdgesRow,
      cpMembersRows,
    ] = await Promise.all([
      this.graphDbQuery(`MATCH (n) RETURN count(n) AS c`, {}),
      this.graphDbQuery(`MATCH ()-[r]-() RETURN count(r) AS c`, {}),
      this.graphDbQuery(`MATCH (v:version) RETURN count(v) AS c`, {}),
      this.graphDbQuery(`MATCH (c:checkpoint) RETURN count(c) AS c`, {}),
      this.graphDbQuery(
        `MATCH ()-[r]-() WHERE r.validFrom IS NOT NULL AND (r.validTo IS NULL) RETURN count(r) AS c`,
        {}
      ),
      this.graphDbQuery(
        `MATCH ()-[r]-() WHERE r.validTo IS NOT NULL RETURN count(r) AS c`,
        {}
      ),
      this.graphDbQuery(
        `MATCH (c:checkpoint) OPTIONAL MATCH (c)-[:CHECKPOINT_INCLUDES]->(n) RETURN c.id AS id, count(n) AS m`,
        {}
      ),
    ]);

    const membersCounts = (cpMembersRows || []).map(
      (r: any) => Number(r.m) || 0
    );
    const min = membersCounts.length ? Math.min(...membersCounts) : 0;
    const max = membersCounts.length ? Math.max(...membersCounts) : 0;
    const avg = membersCounts.length
      ? membersCounts.reduce((a, b) => a + b, 0) / membersCounts.length
      : 0;

    return {
      versions: verRow?.[0]?.c || 0,
      checkpoints: cpRow?.[0]?.c || 0,
      checkpointMembers: { avg, min, max },
      temporalEdges: {
        open: openEdgesRow?.[0]?.c || 0,
        closed: closedEdgesRow?.[0]?.c || 0,
      },
      lastPrune: this._lastPruneSummary || null,
      totals: {
        nodes: nodesRow?.[0]?.c || 0,
        relationships: relsRow?.[0]?.c || 0,
      },
    };
  }

  /** Inspect database indexes and evaluate expected coverage. */
  async getIndexHealth(): Promise<{
    supported: boolean;
    indexes?: any[];
    expected: {
      file_path: boolean;
      symbol_path: boolean;
      version_entity: boolean;
      checkpoint_id: boolean;
      rel_validFrom: boolean;
      rel_validTo: boolean;
    };
    notes?: string[];
  }> {
    const expectedNames = [
      "file_path",
      "symbol_path",
      "version_entity",
      "checkpoint_id",
      "rel_valid_from",
      "rel_valid_to",
    ];
    const notes: string[] = [];
    try {
      const rows = await this.graphDbQuery("CALL db.indexes()", {});
      const textDump = JSON.stringify(rows || []).toLowerCase();
      const has = (token: string) => textDump.includes(token.toLowerCase());
      const health = {
        supported: true,
        indexes: rows,
        expected: {
          file_path: has("file(path)") || has("file_path"),
          symbol_path: has("symbol(path)") || has("symbol_path"),
          version_entity:
            has("version(entityid)") ||
            has("version_entity") ||
            has("entityid"),
          checkpoint_id:
            has("checkpoint(checkpointid)") ||
            has("checkpoint_id") ||
            has("checkpointid"),
          rel_validFrom: has("validfrom") || has("rel_valid_from"),
          rel_validTo: has("validto") || has("rel_valid_to"),
        },
        notes,
      } as any;
      return health;
    } catch (e) {
      notes.push("db.indexes() not supported; using heuristic checks");
      // Try minimal heuristic checks by running EXPLAIN-like queries (if supported); fallback to nulls
      return {
        supported: false,
        expected: {
          file_path: false,
          symbol_path: false,
          version_entity: false,
          checkpoint_id: false,
          rel_validFrom: false,
          rel_validTo: false,
        },
        notes,
      };
    }
  }

  /** Run quick, non-destructive micro-benchmarks for common queries. */
  async runBenchmarks(options?: { mode?: "quick" | "full" }): Promise<{
    mode: "quick" | "full";
    totals: { nodes: number; edges: number };
    timings: Record<string, number>; // ms
    samples: Record<string, any>;
  }> {
    const mode = options?.mode || "quick";
    const timings: Record<string, number> = {};
    const samples: Record<string, any> = {};

    const time = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
      const t0 = Date.now();
      const out = await fn();
      timings[label] = Date.now() - t0;
      return out;
    };

    // Totals
    const nodesRow = await time(
      "nodes.count",
      async () =>
        await this.graphDbQuery(`MATCH (n) RETURN count(n) AS c`, {})
    );
    const edgesRow = await time(
      "edges.count",
      async () =>
        await this.graphDbQuery(`MATCH ()-[r]-() RETURN count(r) AS c`, {})
    );
    const nodes = nodesRow?.[0]?.c || 0;
    const edges = edgesRow?.[0]?.c || 0;

    // Sample one id for targeted lookup
    const idRow = await time(
      "sample.id.fetch",
      async () =>
        await this.graphDbQuery(`MATCH (n) RETURN n.id AS id LIMIT 1`, {})
    );
    const sampleId: string | undefined = idRow?.[0]?.id;
    samples.entityId = sampleId || null;
    if (sampleId) {
      await time(
        "lookup.byId",
        async () =>
          await this.graphDbQuery(`MATCH (n {id: $id}) RETURN n`, {
            id: sampleId,
          })
      );
    }

    // Versions and checkpoints
    await time(
      "versions.count",
      async () =>
        await this.graphDbQuery(
          `MATCH (v:version) RETURN count(v) AS c`,
          {}
        )
    );
    const cpIdRow = await time(
      "checkpoint.sample",
      async () =>
        await this.graphDbQuery(
          `MATCH (c:checkpoint) RETURN c.id AS id LIMIT 1`,
          {}
        )
    );
    const cpId: string | undefined = cpIdRow?.[0]?.id;
    samples.checkpointId = cpId || null;
    if (cpId) {
      await time(
        "checkpoint.members",
        async () =>
          await this.graphDbQuery(
            `MATCH (c:checkpoint {id: $id})-[:CHECKPOINT_INCLUDES]->(n) RETURN count(n) AS c`,
            { id: cpId }
          )
      );
    }

    // Temporal edges
    await time(
      "temporal.open",
      async () =>
        await this.graphDbQuery(
          `MATCH ()-[r]-() WHERE r.validFrom IS NOT NULL AND r.validTo IS NULL RETURN count(r) AS c`,
          {}
        )
    );
    await time(
      "temporal.closed",
      async () =>
        await this.graphDbQuery(
          `MATCH ()-[r]-() WHERE r.validTo IS NOT NULL RETURN count(r) AS c`,
          {}
        )
    );

    // Time-travel traversal micro
    if (sampleId) {
      const until = new Date().toISOString();
      await time("timetravel.depth2", async () =>
        this.timeTravelTraversal({
          startId: sampleId,
          until: new Date(until),
          maxDepth: 2,
        })
      );
    }

    // Optional extended benchmarks
    if (mode === "full") {
      // Neighbor fanout
      if (sampleId) {
        await time(
          "neighbors.depth3",
          async () =>
            await this.graphDbQuery(
              `MATCH (s {id: $id})-[:DEPENDS_ON|TYPE_USES*1..3]-(n) RETURN count(n) AS c`,
              { id: sampleId }
            )
        );
      }
    }

    return {
      mode,
      totals: { nodes, edges },
      timings,
      samples,
    };
  }

  /** Ensure graph indexes for common queries (best-effort across dialects). */
  async ensureGraphIndexes(): Promise<void> {
    const stats: Record<
      "created" | "exists" | "deferred" | "failed",
      number
    > = {
      created: 0,
      exists: 0,
      deferred: 0,
      failed: 0,
    };
    const bump = (outcome: keyof typeof stats) => {
      stats[outcome] += 1;
    };

    const indexQueries = [
      "CREATE INDEX ON :Entity(id)",
      "CREATE INDEX ON :Entity(type)",
      "CREATE INDEX ON :Entity(path)",
      "CREATE INDEX ON :Entity(language)",
      "CREATE INDEX ON :file(path)",
      "CREATE INDEX ON :symbol(path)",
      "CREATE INDEX ON :version(entityId)",
      "CREATE INDEX ON :checkpoint(checkpointId)",
    ];

    for (const query of indexQueries) {
      const outcome = await this.createIndexGuarded(query);
      bump(outcome);
      if (outcome === "deferred") {
        console.log("graph.indexes.ensure halted", { outcome, query });
        return;
      }
    }

    console.log({
      event: "graph.indexes.ensure_attempted",
      stats,
    });
  }

  private normalizeGraphError(error: unknown): string {
    if (error instanceof Error && typeof error.message === "string") {
      return error.message.toLowerCase();
    }
    if (typeof error === "string") {
      return error.toLowerCase();
    }
    if (error && typeof error === "object") {
      const candidate = (error as { message?: unknown }).message;
      if (typeof candidate === "string") {
        return candidate.toLowerCase();
      }
    }
    return String(error ?? "").toLowerCase();
  }

  private isIndexAlreadyExistsError(error: unknown): boolean {
    const message = this.normalizeGraphError(error);
    return (
      message.includes("already indexed") || message.includes("already exists")
    );
  }

  private isGraphMissingError(error: unknown): boolean {
    const message = this.normalizeGraphError(error);
    if (!message) {
      return false;
    }
    return (
      (message.includes("graph") && message.includes("does not exist")) ||
      message.includes("unknown graph") ||
      message.includes("graph not found")
    );
  }

  private async createIndexGuarded(
    query: string
  ): Promise<"created" | "exists" | "deferred" | "failed"> {
    try {
      const graphKey = this.namespace.falkorGraph || DEFAULT_GRAPH_KEY;
      await this.db.falkordbCommand("GRAPH.QUERY", graphKey, query);
      return "created";
    } catch (error) {
      if (this.isIndexAlreadyExistsError(error)) {
        return "exists";
      }
      if (this.isGraphMissingError(error)) {
        return "deferred";
      }
      console.warn("graph index creation failed", { query, error });
      return "failed";
    }
  }

  /**
   * List checkpoints with optional filters and pagination.
   * Returns an array of checkpoint entities and the total count matching filters.
   */
  async listCheckpoints(options?: {
    reason?: string;
    since?: Date | string;
    until?: Date | string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const reason = options?.reason || null;
    const sinceISO = options?.since
      ? new Date(options.since as any).toISOString()
      : null;
    const untilISO = options?.until
      ? new Date(options.until as any).toISOString()
      : null;
    const limit = Math.max(0, Math.min(500, Math.floor(options?.limit ?? 100)));
    const offset = Math.max(0, Math.floor(options?.offset ?? 0));

    const where = `
      WHERE ($reason IS NULL OR c.reason = $reason)
        AND ($since IS NULL OR c.timestamp >= $since)
        AND ($until IS NULL OR c.timestamp <= $until)
    `;

    const totalRes = await this.graphDbQuery(
      `MATCH (c:checkpoint)
       ${where}
       RETURN count(c) AS total
      `,
      { reason, since: sinceISO, until: untilISO }
    );
    const total = totalRes?.[0]?.total || 0;

    const rows = await this.graphDbQuery(
      `MATCH (c:checkpoint)
       ${where}
       OPTIONAL MATCH (c)-[:CHECKPOINT_INCLUDES]->(n)
       WITH c, count(n) AS memberCount
       RETURN c AS n, memberCount
       ORDER BY c.timestamp DESC
       SKIP $offset LIMIT $limit
      `,
      { reason, since: sinceISO, until: untilISO, offset, limit }
    );

    const items = (rows || []).map((row: any) => {
      const cp = this.parseEntityFromGraph(row.n);
      return { ...cp, memberCount: row.memberCount ?? 0 };
    });

    return { items, total };
  }

  /** Get a checkpoint node by id. */
  async getCheckpoint(id: string): Promise<Entity | null> {
    const rows = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })
       RETURN c AS n
       LIMIT 1
      `,
      { id }
    );
    if (!rows || rows.length === 0) return null;
    return this.parseEntityFromGraph(rows[0].n);
  }

  /** Get members of a checkpoint with pagination. */
  async getCheckpointMembers(
    id: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: Entity[]; total: number }> {
    const limit = Math.max(
      0,
      Math.min(1000, Math.floor(options?.limit ?? 100))
    );
    const offset = Math.max(0, Math.floor(options?.offset ?? 0));

    const totalRes = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN count(n) AS total
      `,
      { id }
    );
    const total = totalRes?.[0]?.total || 0;

    const rows = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN n
       SKIP $offset LIMIT $limit
      `,
      { id, offset, limit }
    );
    const items = (rows || []).map((row: any) =>
      this.parseEntityFromGraph(row)
    );
    return { items, total };
  }

  /**
   * Time-scoped traversal starting from a node, filtering relationships by validFrom/validTo.
   * atTime: edges active at a specific moment.
   * since/until: edges overlapping a time window.
   */
  async timeTravelTraversal(query: {
    startId: string;
    atTime?: Date | string;
    since?: Date | string;
    until?: Date | string;
    maxDepth?: number;
    types?: string[];
  }): Promise<{ entities: Entity[]; relationships: GraphRelationship[] }> {
    const depth = Math.max(1, Math.min(5, Math.floor(query.maxDepth ?? 3)));
    const at = query.atTime
      ? new Date(query.atTime as any).toISOString()
      : null;
    const since = query.since
      ? new Date(query.since as any).toISOString()
      : null;
    const until = query.until
      ? new Date(query.until as any).toISOString()
      : null;
    const types = Array.isArray(query.types)
      ? query.types.map((t) => String(t).toUpperCase())
      : [];
    const hasTypes = types.length > 0 ? 1 : 0;

    // Collect nodeIds reachable within depth under validity constraints
    const nodeRows = await this.graphDbQuery(
      `MATCH (start {id: $startId})
       MATCH path = (start)-[r*1..${depth}]-(n)
       WHERE ALL(rel IN r WHERE
         ($hasTypes = 0 OR type(rel) IN $types) AND
         (
           ($at IS NOT NULL AND ((rel.validFrom IS NULL OR rel.validFrom <= $at) AND (rel.validTo IS NULL OR rel.validTo > $at))) OR
           ($at IS NULL AND $since IS NOT NULL AND $until IS NOT NULL AND ((rel.validFrom IS NULL OR rel.validFrom <= $until) AND (rel.validTo IS NULL OR rel.validTo >= $since))) OR
           ($at IS NULL AND $since IS NULL AND $until IS NULL)
         )
       )
       RETURN DISTINCT n.id AS id
      `,
      { startId: query.startId, at, since, until, types, hasTypes }
    );
    const nodeIds = new Set<string>([query.startId]);
    for (const row of nodeRows || []) {
      if (row.id) nodeIds.add(row.id as string);
    }

    const idsArr = Array.from(nodeIds);
    if (idsArr.length === 0) {
      return { entities: [], relationships: [] };
    }

    // Fetch entities
    const entityRows = await this.graphDbQuery(
      `UNWIND $ids AS id
       MATCH (n {id: id})
       RETURN n
      `,
      { ids: idsArr }
    );
    const entities = (entityRows || []).map((row: any) =>
      this.parseEntityFromGraph(row)
    );

    // Fetch relationships among these nodes under the same validity constraint
    const relRows = await this.graphDbQuery(
      `UNWIND $ids AS idA
       MATCH (a {id: idA})-[r]->(b)
       WHERE b.id IN $ids AND (
         ($at IS NOT NULL AND ((r.validFrom IS NULL OR r.validFrom <= $at) AND (r.validTo IS NULL OR r.validTo > $at))) OR
         ($at IS NULL AND $since IS NOT NULL AND $until IS NOT NULL AND ((r.validFrom IS NULL OR r.validFrom <= $until) AND (r.validTo IS NULL OR r.validTo >= $since))) OR
         ($at IS NULL AND $since IS NULL AND $until IS NULL)
       ) AND ($hasTypes = 0 OR type(r) IN $types)
       RETURN r, a.id AS fromId, b.id AS toId
      `,
      { ids: idsArr, at, since, until, types, hasTypes }
    );
    const relationships: GraphRelationship[] = (relRows || []).map(
      (row: any) => {
        const base = this.parseRelationshipFromGraph(row.r);
        return {
          ...base,
          fromEntityId: row.fromId,
          toEntityId: row.toId,
        } as GraphRelationship;
      }
    );

    return { entities, relationships };
  }

  /** Delete a checkpoint node and its include edges. */
  async deleteCheckpoint(id: string): Promise<boolean> {
    const res = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })
       WITH c LIMIT 1
       DETACH DELETE c
       RETURN 1 AS ok
      `,
      { id }
    );
    return !!(res && res[0] && res[0].ok);
  }

  /** Compute summary statistics for a checkpoint. */
  async getCheckpointSummary(id: string): Promise<{
    totalMembers: number;
    entityTypeCounts: Array<{ type: string; count: number }>;
    relationshipTypeCounts: Array<{ type: string; count: number }>;
  } | null> {
    // Ensure checkpoint exists
    const cp = await this.getCheckpoint(id);
    if (!cp) return null;

    const memberCountRes = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN count(n) AS total
      `,
      { id }
    );
    const totalMembers = memberCountRes?.[0]?.total || 0;

    const typeRows = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       WITH coalesce(n.type, 'unknown') AS t
       RETURN t AS type, count(*) AS count
       ORDER BY count DESC
      `,
      { id }
    );
    const entityTypeCounts = (typeRows || []).map((row: any) => ({
      type: row.type,
      count: row.count,
    }));

    const relRows = await this.graphDbQuery(
      `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(a)
       MATCH (c)-[:CHECKPOINT_INCLUDES]->(b)
       MATCH (a)-[r]->(b)
       WITH type(r) AS t
       RETURN t AS type, count(*) AS count
       ORDER BY count DESC
      `,
      { id }
    );
    const relationshipTypeCounts = (relRows || []).map((row: any) => ({
      type: row.type,
      count: row.count,
    }));

    return { totalMembers, entityTypeCounts, relationshipTypeCounts };
  }

  /** Find recently modified entities (by lastModified property) */
  async findRecentEntityIds(
    since: Date,
    limit: number = 200
  ): Promise<string[]> {
    const iso = since.toISOString();
    const rows = await this.graphDbQuery(
      `MATCH (n)
       WHERE n.lastModified IS NOT NULL AND n.lastModified >= $since
       RETURN n.id AS id
       ORDER BY n.lastModified DESC
       LIMIT $limit
      `,
      { since: iso, limit }
    );
    return (rows || []).map((row: any) => row.id).filter(Boolean);
  }

  /** Export a checkpoint to a portable JSON structure. */
  async exportCheckpoint(
    id: string,
    options?: { includeRelationships?: boolean }
  ): Promise<{
    checkpoint: any;
    members: Entity[];
    relationships?: GraphRelationship[];
  } | null> {
    const cp = await this.getCheckpoint(id);
    if (!cp) return null;
    const { items: members } = await this.getCheckpointMembers(id, {
      limit: 1000,
      offset: 0,
    });
    let relationships: GraphRelationship[] | undefined;
    if (options?.includeRelationships !== false && members.length > 0) {
      const ids = members.map((m) => (m as any).id);
      const rows = await this.graphDbQuery(
        `UNWIND $ids AS idA
         MATCH (a {id: idA})-[r]->(b)
         WHERE b.id IN $ids
         RETURN r, a.id AS fromId, b.id AS toId
        `,
        { ids }
      );
      relationships = (rows || []).map((row: any) => {
        const base = this.parseRelationshipFromGraph(row.r);
        return {
          ...base,
          fromEntityId: row.fromId,
          toEntityId: row.toId,
        } as GraphRelationship;
      });
    }
    return {
      checkpoint: cp,
      members,
      ...(relationships ? { relationships } : {}),
    };
  }

  /** Import a checkpoint JSON; returns new checkpoint id and stats. */
  async importCheckpoint(
    data: {
      checkpoint: any;
      members: Array<Entity | { id: string }>;
      relationships?: Array<GraphRelationship>;
    },
    options?: { useOriginalId?: boolean }
  ): Promise<{ checkpointId: string; linked: number; missing: number }> {
    if (!this.isHistoryEnabled()) {
      const fakeId = this.generateCheckpointId();
      console.log(
        `📦 [history disabled] importCheckpoint skipped; returning ${fakeId}`
      );
      return {
        checkpointId: fakeId,
        linked: 0,
        missing: data.members?.length || 0,
      };
    }

    const original = data.checkpoint || {};
    const providedId: string | undefined = original.id || original.checkpointId;
    const useOriginal = options?.useOriginalId === true && !!providedId;
    const checkpointId = useOriginal
      ? this.namespaceId(String(providedId))
      : this.generateCheckpointId();

    const ts = original.timestamp
      ? new Date(original.timestamp).toISOString()
      : new Date().toISOString();
    const reason = original.reason || "manual";
    const hops = Number.isFinite(original.hops) ? original.hops : 2;
    const seeds = Array.isArray(original.seedEntities)
      ? original.seedEntities
      : [];
    const meta = JSON.stringify(original.metadata || {});

    await this.graphDbQuery(
      `MERGE (c:checkpoint { id: $id })
       SET c.type = 'checkpoint', c.checkpointId = $id, c.timestamp = $ts, c.reason = $reason, c.hops = $hops, c.seedEntities = $seeds, c.metadata = $meta
      `,
      { id: checkpointId, ts, reason, hops, seeds: JSON.stringify(seeds), meta }
    );

    const memberIds = (data.members || [])
      .map((m) => (m as any).id)
      .filter(Boolean);
    let linked = 0;
    let missing = 0;
    if (memberIds.length > 0) {
      // Check which members exist
      const presentRows = await this.graphDbQuery(
        `UNWIND $ids AS id MATCH (n {id: id}) RETURN collect(n.id) AS present`,
        { ids: memberIds }
      );
      const present = new Set<string>(presentRows?.[0]?.present || []);
      const existing = memberIds.filter((id) => present.has(id));
      missing = memberIds.length - existing.length;
      if (existing.length > 0) {
        await this.graphDbQuery(
          `UNWIND $ids AS mid
           MATCH (n {id: mid}), (c:checkpoint {id: $cid})
           MERGE (c)-[r:CHECKPOINT_INCLUDES { id: $ridPrefix + mid }]->(n)
           ON CREATE SET r.created = $ts, r.version = 1, r.metadata = '{}'
           SET r.lastModified = $ts
          `,
          {
            ids: existing,
            cid: checkpointId,
            ts,
            ridPrefix: `rel_chk_${checkpointId}_includes_`,
          }
        );
        linked = existing.length;
      }
    }

    // Relationships import optional: we do not create relationships here to avoid duplicating topology; rely on existing graph.
    return { checkpointId, linked, missing };
  }

  async initialize(): Promise<void> {
    // Ensure database is ready
    await this.db.initialize();

    // Only create indexes once per instance
    if (!this._indexesEnsured) {
      try {
        // Check if indexes already exist to avoid unnecessary creation
        const indexCheck = await this.graphDbQuery("CALL db.indexes()", {});

        if (indexCheck && indexCheck.length > 0) {
          console.log(
            `✅ Graph indexes verified: ${indexCheck.length} indexes found`
          );
          this._indexesEnsured = true;
        } else {
          console.log("📊 Creating graph indexes...");
          const result = await this.bootstrapIndicesOnce();
          if (result?.status === "completed") {
            console.log("✅ Graph indexes created");
          } else {
            console.log(
              "⚠️ Graph index creation deferred",
              result ?? { reason: "unknown" }
            );
          }
        }
      } catch (error) {
        // If index checking fails, try to create them anyway (best effort)
        console.log(
          "📊 Index verification failed, attempting to create indexes..."
        );
        try {
          const result = await this.bootstrapIndicesOnce();
          if (result?.status === "completed") {
            console.log("✅ Graph indexes created");
          } else {
            console.warn(
              "⚠️ Graph index creation deferred after verification failure",
              result ?? { reason: "unknown" }
            );
          }
        } catch (createError) {
          console.warn("⚠️ Could not create graph indexes:", createError);
          this._indexesEnsured = true; // Don't retry on subsequent calls
        }
      }
    }
  }

  private hasCodebaseProperties(entity: Entity): boolean {
    return (
      "path" in entity &&
      "hash" in entity &&
      "language" in entity &&
      "lastModified" in entity &&
      "created" in entity
    );
  }

  // Entity CRUD operations
  async createEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<void> {
    this.applyNamespaceToEntity(entity);
    const labels = this.getEntityLabels(entity);
    const properties = this.sanitizeProperties(entity);

    // Build props excluding id so we never overwrite an existing node's id
    const propsNoId: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (key === "id") continue;
      let processedValue = value as any;
      if (value instanceof Date) processedValue = value.toISOString();
      else if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        processedValue = JSON.stringify(value);
      }
      if (processedValue !== undefined) propsNoId[key] = processedValue;
    }

    // Choose merge key: prefer (type,path) for codebase entities, otherwise id
    const entityType = (properties as any).type as string | undefined;
    const usePathKey =
      this.hasCodebaseProperties(entity) &&
      (properties as any).path &&
      entityType?.toLowerCase() !== "test";

    const shouldEarlyEmit =
      process.env.NODE_ENV === "test" || process.env.RUN_INTEGRATION === "1";
    if (shouldEarlyEmit) {
      const hasCodebasePropsEarly = this.hasCodebaseProperties(entity);
      this.emit("entityCreated", {
        id: entity.id,
        type: entity.type,
        path: hasCodebasePropsEarly ? (entity as any).path : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    let result: any[] = [];
    if (usePathKey) {
      const query = `
        MERGE (n:${labels.join(":")} { type: $type, path: $path })
        ON CREATE SET n.id = $id
        SET n += $props
        RETURN n.id AS id
      `;
      result = await this.graphDbQuery(query, {
        id: (properties as any).id,
        type: (properties as any).type,
        path: (properties as any).path,
        props: propsNoId,
      });
    } else {
      const query = `
        MERGE (n:${labels.join(":")} { id: $id })
        SET n += $props
        RETURN n.id AS id
      `;
      result = await this.graphDbQuery(query, {
        id: (properties as any).id,
        props: propsNoId,
      });
    }

    // Align in-memory id with the graph's persisted id
    const persistedId = result?.[0]?.id || (properties as any).id;
    (entity as any).id = persistedId;

    // Create or refresh vector embedding (unless explicitly skipped)
    if (!options?.skipEmbedding) {
      await this.createEmbedding(entity);
    }

    if (!shouldEarlyEmit) {
      const hasCodebaseProps = this.hasCodebaseProperties(entity);
      this.emit("entityCreated", {
        id: entity.id,
        type: entity.type,
        path: hasCodebaseProps ? (entity as any).path : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    const label = this.getEntityLabel(entity);
    console.log(`✅ Upserted entity: ${label} (${entity.type})`);

    this.invalidateEntityCache(entity.id);
  }

  /**
   * Create many entities in a small number of graph queries.
   * Groups by primary label (entity.type) and uses UNWIND + SET n += row.
   */
  async createEntitiesBulk(
    entities: Entity[],
    options?: { skipEmbedding?: boolean }
  ): Promise<void> {
    if (!entities || entities.length === 0) return;

    // Group by primary label
    const byType = new Map<string, Entity[]>();
    for (const e of entities) {
      const t = String((e as any).type || e.type);
      const arr = byType.get(t) || [];
      arr.push(e);
      byType.set(t, arr);
    }

    for (const [type, list] of byType.entries()) {
      const withPath: Array<{
        id: string;
        type: string;
        path: string;
        props: any;
      }> = [];
      const withoutPath: Array<{ id: string; props: any; type: string }> = [];

      for (const entity of list) {
        this.applyNamespaceToEntity(entity);
        const properties = this.sanitizeProperties(entity);
        const propsNoId: Record<string, any> = {};
        for (const [key, value] of Object.entries(properties)) {
          if (key === "id") continue;
          let v: any = value;
          if (value instanceof Date) v = value.toISOString();
          else if (
            Array.isArray(value) ||
            (typeof value === "object" && value !== null)
          )
            v = JSON.stringify(value);
          if (v !== undefined) propsNoId[key] = v;
        }
        if ((properties as any).path) {
          withPath.push({
            id: (properties as any).id,
            type: (properties as any).type,
            path: (properties as any).path,
            props: propsNoId,
          });
        } else {
          withoutPath.push({
            id: (properties as any).id,
            type: (properties as any).type,
            props: propsNoId,
          });
        }
      }

      if (withPath.length > 0) {
        const queryWithPath = `
          UNWIND $rows AS row
          MERGE (n:${type} { type: row.type, path: row.path })
          ON CREATE SET n.id = row.id
          SET n += row.props
        `;
        await this.graphDbQuery(queryWithPath, { rows: withPath });
      }

      if (withoutPath.length > 0) {
        const queryById = `
          UNWIND $rows AS row
          MERGE (n:${type} { id: row.id })
          SET n += row.props
        `;
        await this.graphDbQuery(queryById, { rows: withoutPath });
      }

      // Align entity IDs in memory for items with path (to ensure embeddings reference persisted nodes)
      if (withPath.length > 0) {
        const fetchIdsQuery = `
          UNWIND $rows AS row
          MATCH (n { type: row.type, path: row.path })
          RETURN row.type AS type, row.path AS path, n.id AS id
        `;
        const idRows = await this.graphDbQuery(fetchIdsQuery, {
          rows: withPath.map((r) => ({ type: r.type, path: r.path })),
        });
        const idMap = new Map<string, string>();
        for (const r of idRows) {
          idMap.set(`${r.type}::${r.path}`, r.id);
        }
        for (const e of list) {
          const p = (e as any).path;
          if (p) {
            const k = `${(e as any).type}::${p}`;
            const persistedId = idMap.get(k);
            if (persistedId) (e as any).id = persistedId;
          }
        }
      }
    }

    if (!options?.skipEmbedding) {
      await this.createEmbeddingsBatch(entities);
    }
  }

  // Prefer human-friendly label over raw ID for logs/UI
  private getEntityLabel(entity: Entity): string {
    try {
      if (this.hasCodebaseProperties(entity)) {
        const p = (entity as any).path as string;
        if (p) return p;
      }
      if ((entity as any).title) {
        return (entity as any).title as string;
      }
      if ((entity as any).name) {
        const nm = (entity as any).name as string;
        // Include kind for symbols if present
        const kind = (entity as any).kind as string | undefined;
        return kind ? `${kind}:${nm}` : nm;
      }
      // Fall back to signature if available
      const sig = this.getEntitySignature(entity);
      if (sig && sig !== entity.id) return sig;
    } catch {}
    return entity.id;
  }

  async getEntity(entityId: string): Promise<Entity | null> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    // Check cache first
    const cached = this.entityCache.get(resolvedId);
    if (cached) {
      console.log(`🔍 Cache hit for entity: ${resolvedId}`);
      return cached;
    }

    const query = `
      MATCH (n {id: $id})
      RETURN n
    `;

    const result = await this.graphDbQuery(query, { id: resolvedId });

    if (!result || result.length === 0) {
      return null;
    }

    const entity = this.parseEntityFromGraph(result[0]);
    if (entity) {
      // Cache the entity
      this.entityCache.set(resolvedId, entity);
      console.log(`🔍 Cached entity: ${resolvedId}`);
    }

    return entity;
  }

  async updateEntity(
    entityId: string,
    updates: Partial<Entity>,
    options?: { skipEmbedding?: boolean }
  ): Promise<void> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    // Convert dates to ISO strings for FalkorDB
    const sanitizedUpdates = { ...updates };
    if (
      "lastModified" in sanitizedUpdates &&
      sanitizedUpdates.lastModified instanceof Date
    ) {
      sanitizedUpdates.lastModified =
        sanitizedUpdates.lastModified.toISOString() as any;
    }
    if (
      "created" in sanitizedUpdates &&
      sanitizedUpdates.created instanceof Date
    ) {
      sanitizedUpdates.created = sanitizedUpdates.created.toISOString() as any;
    }

    // Handle updates - merge objects and filter incompatible types
    const falkorCompatibleUpdates: any = {};
    for (const [key, value] of Object.entries(sanitizedUpdates)) {
      // Skip id field (shouldn't be updated)
      if (key === "id") continue;

      // Handle objects by serializing them as JSON strings for storage
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        falkorCompatibleUpdates[key] = JSON.stringify(value);
      }
      // Handle arrays by serializing them as JSON strings
      else if (Array.isArray(value)) {
        falkorCompatibleUpdates[key] = JSON.stringify(value);
      }
      // Handle primitive types (including numbers, strings, booleans) directly
      else if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        falkorCompatibleUpdates[key] = value;
      }
      // Handle other non-null values
      else if (value !== null && value !== undefined) {
        falkorCompatibleUpdates[key] = String(value);
      }
    }

    // If no compatible updates, skip the database update
    if (Object.keys(falkorCompatibleUpdates).length === 0) {
    console.warn(`No FalkorDB-compatible updates for entity ${resolvedId}`);
      return;
    }

    const setClause = Object.keys(falkorCompatibleUpdates)
      .map((key) => `n.${key} = $${key}`)
      .join(", ");

    const query = `
      MATCH (n {id: $id})
      SET ${setClause}
      RETURN n
    `;

    const params = { id: resolvedId, ...falkorCompatibleUpdates };
    await this.graphDbQuery(query, params);

    // Invalidate cache before fetching the updated entity to avoid stale reads
    this.invalidateEntityCache(resolvedId);

    if (!options?.skipEmbedding) {
      // Update vector embedding based on the freshly fetched entity
      const updatedEntity = await this.getEntity(resolvedId);
      if (updatedEntity) {
        await this.updateEmbedding(updatedEntity);

        // Emit event for real-time updates
        this.emit("entityUpdated", {
          id: resolvedId,
          updates: sanitizedUpdates,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Cache already invalidated above
  }

  async createOrUpdateEntity(entity: Entity): Promise<void> {
    const existing = await this.getEntity(entity.id);
    if (existing) {
      await this.updateEntity(entity.id, entity);
    } else {
      await this.createEntity(entity);
    }
  }

  async deleteEntity(entityId: string): Promise<void> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    // Get relationships before deletion for event emission
    const relationships = await this.getRelationships({
      fromEntityId: resolvedId,
    });

    // Delete node and any attached relationships in one operation
    await this.graphDbQuery(
      `
      MATCH (n {id: $id})
      DETACH DELETE n
    `,
      { id: resolvedId }
    );

    // Emit events for deleted relationships
    for (const relationship of relationships) {
      this.emit("relationshipDeleted", relationship.id);
    }

    // Delete vector embedding
    await this.deleteEmbedding(resolvedId);

    // Invalidate cache
    this.invalidateEntityCache(resolvedId);

    // Emit event for real-time updates
    this.emit("entityDeleted", resolvedId);
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    const resolvedId = this.resolveRelationshipIdInput(relationshipId);
    const candidateIds = this.relationshipIdCandidates(
      resolvedId,
      relationshipId
    );

    await this.graphDbQuery(
      `
      MATCH ()-[r]-()
      WHERE r.id IN $ids
      DELETE r
    `,
      { ids: candidateIds }
    );

    // Emit event for real-time updates using canonical (namespaced) id
    this.emit("relationshipDeleted", resolvedId);
  }

  // Relationship operations
  async createRelationship(
    relationship: GraphRelationship | string,
    toEntityId?: string,
    type?: RelationshipType,
    options?: { validate?: boolean }
  ): Promise<void> {
    // Handle backward compatibility with old calling signature
    let relationshipObj: GraphRelationship;

    if (typeof relationship === "string") {
      // Old signature: createRelationship(fromEntityId, toEntityId, type)
      if (!toEntityId || !type) {
        throw new Error(
          "Invalid parameters: when using old signature, both toEntityId and type are required"
        );
      }

      // Temporary id; will be canonicalized below using final from/to/type
      relationshipObj = {
        id: `rel_${relationship}_${toEntityId}_${type}`,
        fromEntityId: relationship,
        toEntityId: toEntityId,
        type: type,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
      } as any as GraphRelationship;
    } else {
      // New signature: createRelationship(relationshipObject)
      const rel = { ...(relationship as any) } as any;
      // id will be canonicalized below; accept incoming for now
      if (!rel.created) rel.created = new Date();
      if (!rel.lastModified) rel.lastModified = new Date();
      if (typeof rel.version !== "number") rel.version = 1;
      relationshipObj = rel as GraphRelationship;
    }

    // Validate required fields
    if (!relationshipObj.fromEntityId) {
      throw new Error(
        "Relationship fromEntityId is required and cannot be undefined"
      );
    }
    if (!relationshipObj.toEntityId) {
      throw new Error(
        "Relationship toEntityId is required and cannot be undefined"
      );
    }
    if (!relationshipObj.type) {
      throw new Error("Relationship type is required");
    }

    // Optionally validate existence (default true)
    // For integration tests, validation should work normally
    // For unit tests, validation can be skipped by setting validate: false
    const isIntegrationTest = process.env.RUN_INTEGRATION === "1";
    const shouldValidate =
      options?.validate !== false &&
      (isIntegrationTest || process.env.NODE_ENV !== "test");

    const resolvedFromId = this.resolveEntityIdInput(
      relationshipObj.fromEntityId as string
    );
    const resolvedToId = this.resolveEntityIdInput(
      relationshipObj.toEntityId as string
    );
    relationshipObj.fromEntityId = resolvedFromId;
    relationshipObj.toEntityId = resolvedToId;

    if (shouldValidate) {
      const fromEntity = await this.getEntity(relationshipObj.fromEntityId);
      if (!fromEntity) {
        throw new Error(
          `From entity ${relationshipObj.fromEntityId} does not exist`
        );
      }

      const toEntity = await this.getEntity(relationshipObj.toEntityId);
      if (!toEntity) {
        throw new Error(
          `To entity ${relationshipObj.toEntityId} does not exist`
        );
      }
    }

    // Normalize via shared normalizer; apply simple gating using noiseConfig
    try {
      relationshipObj = this.normalizeRelationship(relationshipObj);
      const top = relationshipObj as any;
      // Gate low-confidence inferred relationships if below threshold
      if (
        top.inferred &&
        typeof top.confidence === "number" &&
        top.confidence < noiseConfig.MIN_INFERRED_CONFIDENCE
      ) {
        return;
      }
      // Default confidence to 1.0 when explicitly resolved
      if (top.resolved && typeof top.confidence !== "number") {
        top.confidence = 1.0;
      }
      // Initialize first/last seen timestamps
      if (top.firstSeenAt == null) top.firstSeenAt = top.created || new Date();
      if (top.lastSeenAt == null)
        top.lastSeenAt = top.lastModified || new Date();
      // Set validity interval defaults for temporal consistency
      if (this.isHistoryEnabled()) {
        if (top.validFrom == null) top.validFrom = top.firstSeenAt;
        if (top.active == null) top.active = true;
      }
    } catch {}

    const incomingIdRaw =
      typeof (relationshipObj as any).id === "string"
        ? (relationshipObj as any).id
        : undefined;
    const canonicalIdRaw = canonicalRelationshipId(
      relationshipObj.fromEntityId,
      relationshipObj
    );
    const canonicalIdNamespaced = this.namespaceScope.applyRelationshipPrefix(
      canonicalIdRaw
    );
    relationshipObj.id = canonicalIdNamespaced;
    const normalizedType = relationshipObj.type;
    const idCandidates = [canonicalIdNamespaced];
    const legacyIdRaw = legacyStructuralRelationshipId(
      canonicalIdRaw,
      relationshipObj
    );
    if (legacyIdRaw && legacyIdRaw !== canonicalIdRaw) {
      const legacyNamespaced = this.namespaceScope.applyRelationshipPrefix(
        legacyIdRaw
      );
      idCandidates.push(legacyNamespaced);
      try {
        await this.graphDbQuery(
          `MATCH ()-[legacy:${normalizedType} { id: $legacyId }]->()
           SET legacy.id = $id`,
          { legacyId: legacyNamespaced, id: canonicalIdNamespaced }
        );
      } catch {}
    }
    if (
      incomingIdRaw &&
      incomingIdRaw !== canonicalIdRaw &&
      incomingIdRaw !== canonicalIdNamespaced
    ) {
      idCandidates.push(incomingIdRaw);
    }

    // Best-effort: backfill to_ref_* scalars for resolved targets using the entity's path/name
    try {
      const anyRel: any = relationshipObj as any;
      const looksCode = isCodeRelationship(relationshipObj.type as any);
      const missingFileSym = !(
        typeof anyRel.to_ref_file === "string" &&
        typeof anyRel.to_ref_symbol === "string"
      );
      if (looksCode && missingFileSym) {
        const toEnt = await this.getEntity(relationshipObj.toEntityId);
        if (toEnt && this.hasCodebaseProperties(toEnt)) {
          const p = (toEnt as any).path as string | undefined;
          const name = (toEnt as any).name as string | undefined;
          if (p && name) {
            const fileRel = p.includes(":") ? p.split(":")[0] : p;
            anyRel.to_ref_kind = "fileSymbol";
            anyRel.to_ref_file = fileRel;
            anyRel.to_ref_symbol = name;
            anyRel.to_ref_name = anyRel.to_ref_name || name;
            if (!anyRel.toRef)
              anyRel.toRef = {
                kind: "fileSymbol",
                file: fileRel,
                symbol: name,
                name,
              };
            const md = (anyRel.metadata = { ...(anyRel.metadata || {}) });
            md.toRef = {
              kind: "fileSymbol",
              file: fileRel,
              symbol: name,
              name,
            };
            anyRel.__backfilledToRef = true;
          }
        }
      }
    } catch {}

    // Merge evidence with any existing relationship instance
    let confidence: number | undefined;
    let inferred: boolean | undefined;
    let resolved: boolean | undefined;
    let source: string | undefined;
    let context: string | undefined;
    let mergedEvidence: any[] | undefined;
    let mergedLocations:
      | Array<{ path?: string; line?: number; column?: number }>
      | undefined;

    // Prefer explicit top-level fields, then metadata
    const mdIn = (relationshipObj as any).metadata || {};
    const topIn: any = relationshipObj as any;
    const incoming = {
      confidence:
        typeof topIn.confidence === "number"
          ? topIn.confidence
          : typeof mdIn.confidence === "number"
          ? mdIn.confidence
          : undefined,
      inferred:
        typeof topIn.inferred === "boolean"
          ? topIn.inferred
          : typeof mdIn.inferred === "boolean"
          ? mdIn.inferred
          : undefined,
      resolved:
        typeof topIn.resolved === "boolean"
          ? topIn.resolved
          : typeof mdIn.resolved === "boolean"
          ? mdIn.resolved
          : undefined,
      source:
        typeof topIn.source === "string"
          ? topIn.source
          : typeof mdIn.source === "string"
          ? mdIn.source
          : undefined,
      context: typeof topIn.context === "string" ? topIn.context : undefined,
    };

    // Fetch existing to merge evidence (best-effort)
    try {
      let existingRows = await this.graphDbQuery(
        `MATCH ()-[r]->() WHERE r.id IN $ids RETURN r LIMIT 1`,
        { ids: idCandidates }
      );
      if ((!existingRows || existingRows.length === 0) && incomingIdRaw) {
        existingRows = await this.graphDbQuery(
          `MATCH ()-[r]->() WHERE r.id = $id RETURN r LIMIT 1`,
          { id: incomingIdRaw }
        ).catch(() => []);
      }
      if (existingRows && existingRows[0] && existingRows[0].r) {
        const relData = existingRows[0].r;
        const props: any = {};
        if (Array.isArray(relData)) {
          for (const [k, v] of relData) {
            if (k === "properties" && Array.isArray(v)) {
              for (const [pk, pv] of v) props[pk] = pv;
            } else if (k !== "src_node" && k !== "dest_node") {
              props[k] = v;
            }
          }
        }
        const mdOld =
          typeof props.metadata === "string"
            ? (() => {
                try {
                  return JSON.parse(props.metadata);
                } catch {
                  return {};
                }
              })()
            : props.metadata || {};
        // Merge with incoming: choose max for confidence; preserve earlier context if not provided
        const oldConf =
          typeof props.confidence === "number"
            ? props.confidence
            : typeof mdOld.confidence === "number"
            ? mdOld.confidence
            : undefined;
        const oldCtx =
          typeof props.context === "string" ? props.context : undefined;
        const incomingConf =
          typeof incoming.confidence === "number"
            ? incoming.confidence
            : undefined;
        const oldConfNumeric =
          typeof oldConf === "number" ? oldConf : undefined;
        if (oldConfNumeric != null && incomingConf != null) {
          confidence = Math.max(oldConfNumeric, incomingConf);
        } else {
          confidence = oldConfNumeric ?? incomingConf;
        }
        inferred =
          incoming.inferred ??
          (typeof mdOld.inferred === "boolean" ? mdOld.inferred : undefined);
        resolved =
          incoming.resolved ??
          (typeof mdOld.resolved === "boolean" ? mdOld.resolved : undefined);
        source =
          incoming.source ??
          (typeof mdOld.source === "string" ? mdOld.source : undefined);
        context = incoming.context || oldCtx;
        // Merge first/last seen
        try {
          const oldFirst =
            props.firstSeenAt && typeof props.firstSeenAt === "string"
              ? new Date(props.firstSeenAt)
              : null;
          const oldLast =
            props.lastSeenAt && typeof props.lastSeenAt === "string"
              ? new Date(props.lastSeenAt)
              : null;
          const inFirst =
            (relationshipObj as any).firstSeenAt instanceof Date
              ? (relationshipObj as any).firstSeenAt
              : null;
          const inLast =
            (relationshipObj as any).lastSeenAt instanceof Date
              ? (relationshipObj as any).lastSeenAt
              : null;
          (relationshipObj as any).firstSeenAt =
            oldFirst && inFirst
              ? oldFirst < inFirst
                ? oldFirst
                : inFirst
              : oldFirst || inFirst || new Date();
          (relationshipObj as any).lastSeenAt =
            oldLast && inLast
              ? oldLast > inLast
                ? oldLast
                : inLast
              : oldLast || inLast || new Date();
        } catch {}

        // Merge evidence arrays and locations arrays (preserve up to 20 entries, prefer earliest lines)
        try {
          const mdInTop: any = relationshipObj as any;
          const mdIn: any = (relationshipObj as any).metadata || {};
          const evOld = Array.isArray(mdOld.evidence) ? mdOld.evidence : [];
          const evNew = Array.isArray(mdInTop.evidence)
            ? mdInTop.evidence
            : Array.isArray(mdIn.evidence)
            ? mdIn.evidence
            : [];
          const locOld = Array.isArray(mdOld.locations) ? mdOld.locations : [];
          const locNew = Array.isArray(mdInTop.locations)
            ? mdInTop.locations
            : Array.isArray(mdIn.locations)
            ? mdIn.locations
            : [];
          const dedupeBy = (arr: any[], keyFn: (x: any) => string) => {
            const seen = new Set<string>();
            const out: any[] = [];
            for (const it of arr) {
              const k = keyFn(it);
              if (!seen.has(k)) {
                seen.add(k);
                out.push(it);
              }
            }
            return out;
          };
          mergedEvidence = mergeEdgeEvidence(evOld, evNew, 20);
          const locMergedRaw = [...locOld, ...locNew];
          mergedLocations = mergeEdgeLocations(locMergedRaw, [], 20);
        } catch {}
      }
    } catch {
      // Non-fatal; fall back to incoming only
    }

    // Defaults if not set from existing
    confidence = confidence ?? incoming.confidence;
    inferred = inferred ?? incoming.inferred;
    resolved = resolved ?? incoming.resolved;
    source = source ?? incoming.source;
    context = context ?? incoming.context;

    // Also merge location info in metadata: keep earliest line if both present; attach merged evidence/locations
    try {
      const md = { ...(relationshipObj.metadata || {}) } as any;
      const hasLineIn = typeof md.line === "number";
      // If we fetched existing earlier, mdOld handled above; we keep relationshipObj.metadata as the single source of truth now
      if (hasLineIn && typeof md._existingEarliestLine === "number") {
        md.line = Math.min(md.line, md._existingEarliestLine);
      }
      // Ensure evidence and locations arrays are carried over from top-level (AST) and merged with existing when available
      const topAll: any = relationshipObj as any;
      const evIn = Array.isArray(topAll.evidence)
        ? topAll.evidence
        : Array.isArray(md.evidence)
        ? md.evidence
        : [];
      const locIn = Array.isArray(topAll.locations)
        ? topAll.locations
        : Array.isArray(md.locations)
        ? md.locations
        : [];
      if (mergedEvidence || evIn.length > 0) {
        md.evidence = mergedEvidence || evIn;
      }
      if ((mergedLocations && mergedLocations.length > 0) || locIn.length > 0) {
        const candidateLocations =
          mergedLocations && mergedLocations.length > 0
            ? mergedLocations
            : locIn;
        const collapsed = collapseLocationsToEarliest(candidateLocations, 20);
        if (collapsed.length > 0) {
          md.locations = collapsed;
          (relationshipObj as any).locations = collapsed;
        }
      }
      if (!context) {
        const locationCandidates: Array<{ path?: string; line?: number }> = [];
        if (Array.isArray(mergedLocations)) locationCandidates.push(...mergedLocations);
        if (locIn.length > 0) locationCandidates.push(...locIn);
        if (Array.isArray((relationshipObj as any).locations)) {
          locationCandidates.push(...((relationshipObj as any).locations ?? []));
        }
        const firstLocation = locationCandidates
          .filter((loc) => loc && typeof loc.path === "string")
          .reduce<{ path: string; line?: number } | null>((best, loc) => {
            if (!best) return { path: loc.path as string, line: loc.line };
            const bestLine =
              typeof best.line === "number" ? best.line : Number.POSITIVE_INFINITY;
            const locLine =
              typeof loc.line === "number" ? loc.line : Number.POSITIVE_INFINITY;
            if (locLine < bestLine) {
              return { path: loc.path as string, line: loc.line };
            }
            if (locLine === bestLine && typeof loc.path === "string") {
              return best; // keep existing ordering when tied
            }
            return best;
          }, null);
        if (firstLocation) {
          const linePart =
            typeof firstLocation.line === "number"
              ? `:${firstLocation.line}`
              : "";
          context = `${firstLocation.path}${linePart}`;
        }
      }
      {
        const evidenceCandidates = (mergedEvidence || evIn).filter(
          (entry: any) =>
            entry &&
            entry.location &&
            typeof entry.location.path === "string"
        );
        const earliestEvidence = evidenceCandidates.reduce<
          { path: string; line?: number } | null
        >((best, entry: any) => {
          const path = entry.location.path as string;
          const line = entry.location.line;
          if (!best) return { path, line };
          const bestLine =
            typeof best.line === "number"
              ? best.line
              : Number.POSITIVE_INFINITY;
          const entryLine =
            typeof line === "number"
              ? line
              : Number.POSITIVE_INFINITY;
          if (entryLine < bestLine) return { path, line };
          return best;
        }, null);
        if (earliestEvidence) {
          const linePart =
            typeof earliestEvidence.line === "number"
              ? `:${earliestEvidence.line}`
              : "";
          const evidenceContext = `${earliestEvidence.path}${linePart}`;
          if (!context) {
            context = evidenceContext;
          } else {
            const parseLine = (value: string): number => {
              const parts = value.split(":");
              const candidate = Number(parts[parts.length - 1]);
              return Number.isFinite(candidate) ? candidate : Number.POSITIVE_INFINITY;
            };
            if (parseLine(evidenceContext) < parseLine(context)) {
              context = evidenceContext;
            }
          }
        }
      }
      relationshipObj.metadata = md;
    } catch {}

    // Canonicalize relationship id using canonical target key for stability
    (relationshipObj as any).id = canonicalIdNamespaced;

    // Ensure we use the normalized type in the query
    const query = `
      // UNWIND $rows AS row
      MATCH (a {id: $fromId}), (b {id: $toId})
      MERGE (a)-[r:${normalizedType} { id: $id }]->(b)
      ON CREATE SET r.created = $created, r.version = $version
      SET r.lastModified = $lastModified,
          r.metadata = $metadata,
          r.occurrencesScan = $occurrencesScan,
          r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + coalesce($occurrencesScan, 0),
          r.confidence = $confidence,
          r.inferred = $inferred,
          r.resolved = $resolved,
          r.source = $source,
          r.context = $context,
          r.kind = $kind,
          r.resolution = $resolution,
          r.scope = $scope,
          r.arity = $arity,
          r.awaited = $awaited,
          r.operator = $operator,
          r.importDepth = $importDepth,
          r.usedTypeChecker = $usedTypeChecker,
          r.isExported = $isExported,
          r.accessPath = $accessPath,
          r.callee = $callee,
          r.paramName = $paramName,
          r.importAlias = $importAlias,
          r.importType = $importType,
          r.isNamespace = $isNamespace,
          r.isReExport = $isReExport,
          r.reExportTarget = $reExportTarget,
          r.language = $language,
          r.symbolKind = $symbolKind,
          r.modulePath = $modulePath,
          r.resolutionState = $resolutionState,
          r.receiverType = $receiverType,
          r.dynamicDispatch = $dynamicDispatch,
          r.overloadIndex = $overloadIndex,
          r.genericArguments = $genericArguments,
          r.location_path = $loc_path,
          r.location_line = $loc_line,
          r.location_col = $loc_col,
          r.evidence = $evidence,
          r.locations = $locations,
          r.siteId = $siteId,
          r.siteHash = $siteHash,
          r.sites = $sites,
          r.why = $why,
          r.to_ref_kind = $to_ref_kind,
          r.to_ref_file = $to_ref_file,
          r.to_ref_symbol = $to_ref_symbol,
          r.to_ref_name = $to_ref_name,
          r.from_ref_kind = $from_ref_kind,
          r.from_ref_file = $from_ref_file,
          r.from_ref_symbol = $from_ref_symbol,
          r.from_ref_name = $from_ref_name,
          r.ambiguous = $ambiguous,
          r.candidateCount = $candidateCount,
          r.isMethod = $isMethod,
          r.active = true,
          r.firstSeenAt = coalesce(r.firstSeenAt, $firstSeenAt),
          r.lastSeenAt = $lastSeenAt,
          r.validFrom = coalesce(r.validFrom, $firstSeenAt),
          r.segmentId = CASE WHEN $segmentId IS NULL THEN r.segmentId ELSE coalesce(r.segmentId, $segmentId) END,
          r.temporal = CASE WHEN $temporal IS NULL THEN r.temporal ELSE coalesce(r.temporal, $temporal) END,
          r.lastChangeSetId = CASE WHEN $changeSetId IS NULL THEN r.lastChangeSetId ELSE $changeSetId END,
          r.sectionAnchor = $sectionAnchor,
          r.sectionTitle = $sectionTitle,
          r.summary = $summary,
          r.docVersion = $docVersion,
          r.docHash = $docHash,
          r.documentationQuality = $documentationQuality,
          r.coverageScope = $coverageScope,
          r.domainPath = $domainPath,
          r.taxonomyVersion = $taxonomyVersion,
          r.updatedFromDocAt = $updatedFromDocAt,
          r.lastValidated = $lastValidated,
          r.strength = coalesce($strength, r.strength),
          r.similarityScore = coalesce($similarityScore, r.similarityScore),
          r.clusterVersion = coalesce($clusterVersion, r.clusterVersion),
          r.role = coalesce($role, r.role),
          r.docIntent = $docIntent,
          r.embeddingVersion = coalesce($embeddingVersion, r.embeddingVersion),
          r.policyType = coalesce($policyType, r.policyType),
          r.effectiveFrom = coalesce($effectiveFrom, r.effectiveFrom),
          r.expiresAt = CASE WHEN $expiresAt_is_set THEN $expiresAt ELSE r.expiresAt END,
          r.relationshipType = coalesce($relationshipType, r.relationshipType),
          r.docLocale = coalesce($docLocale, r.docLocale),
          r.tags = CASE WHEN $tags IS NULL THEN r.tags ELSE $tags END,
          r.stakeholders = CASE WHEN $stakeholders IS NULL THEN r.stakeholders ELSE $stakeholders END,
          r.metricId = $metricId,
          r.scenario = $scenario,
          r.environment = $environment,
          r.unit = $unit,
          r.baselineValue = $baselineValue,
          r.currentValue = $currentValue,
          r.delta = $delta,
          r.percentChange = $percentChange,
          r.sampleSize = $sampleSize,
          r.confidenceInterval = $confidenceInterval,
          r.trend = $trend,
          r.severity = $severity,
          r.riskScore = $riskScore,
          r.runId = $runId,
          r.policyId = coalesce($policyId, r.policyId),
          r.detectedAt = $detectedAt,
          r.resolvedAt = CASE WHEN $resolvedAt_is_set THEN $resolvedAt ELSE r.resolvedAt END,
          r.metricsHistory = $metricsHistory,
          r.metrics = $metrics
    `;

    const mdAll: any = (relationshipObj as any).metadata || {};
    if (
      (relationshipObj as any).__backfilledToRef &&
      mdAll.toRef &&
      typeof mdAll.toRef === "object"
    ) {
      mdAll.toRef = { ...mdAll.toRef };
      delete mdAll.toRef.id;
    }
    // Persist structured refs for auditability before serialization
    try {
      const topAllAny: any = relationshipObj as any;
      if (topAllAny.fromRef && mdAll.fromRef == null)
        mdAll.fromRef = topAllAny.fromRef;
      if (topAllAny.toRef && mdAll.toRef == null) mdAll.toRef = topAllAny.toRef;
    } catch {}
    const topAll: any = relationshipObj as any;

    const toNonEmptyString = (value: unknown, limit = 256): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      return limit > 0 ? trimmed.slice(0, limit) : trimmed;
    };

    const changeSetIdEff =
      toNonEmptyString((relationshipObj as any).changeSetId) ??
      toNonEmptyString(topAll.changeSetId) ??
      toNonEmptyString(mdAll.changeSetId) ??
      toNonEmptyString((relationshipObj as any).lastChangeSetId) ??
      toNonEmptyString(topAll.lastChangeSetId) ??
      toNonEmptyString(mdAll.lastChangeSetId) ??
      null;

    const toISO = (value: any) => {
      if (value === null) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string") {
        const dt = new Date(value);
        return Number.isNaN(dt.getTime()) ? value : dt.toISOString();
      }
      return null;
    };

    const historyEnabled = this.isHistoryEnabled();
    const structuralProps = extractStructuralPersistenceFields(topAll, mdAll);
    const scopeEff =
      typeof topAll.scope === "string"
        ? topAll.scope
        : typeof mdAll.scope === "string"
        ? mdAll.scope
        : structuralProps.scope;
    const firstSeenAtEff =
      toISO(
        (relationshipObj as any).firstSeenAt ??
          structuralProps.firstSeenAt ??
          topAll.firstSeenAt ??
          mdAll.firstSeenAt ??
          null
      ) ?? relationshipObj.created.toISOString();
    const lastSeenAtEff =
      toISO(
        (relationshipObj as any).lastSeenAt ??
          structuralProps.lastSeenAt ??
          topAll.lastSeenAt ??
          mdAll.lastSeenAt ??
          null
      ) ?? relationshipObj.lastModified.toISOString();

    let segmentIdEff: string | null = null;
    let temporalEff: string | null = null;

    if (historyEnabled) {
      segmentIdEff =
        toNonEmptyString(topAll.segmentId) ??
        toNonEmptyString((relationshipObj as any).segmentId) ??
        toNonEmptyString(mdAll.segmentId) ??
        null;

      const incomingTemporalRaw = (() => {
        const fromTop =
          typeof topAll.temporal === "string" ? topAll.temporal.trim() : "";
        if (fromTop) return fromTop;
        const fromMetadata =
          typeof mdAll.temporal === "string" ? mdAll.temporal.trim() : "";
        return fromMetadata || null;
      })();

      if (incomingTemporalRaw) {
        temporalEff = incomingTemporalRaw;
        if (!segmentIdEff) {
          try {
            const parsed = JSON.parse(incomingTemporalRaw);
            const currentSeg = parsed?.current;
            if (
              currentSeg &&
              typeof currentSeg.segmentId === "string" &&
              currentSeg.segmentId.trim()
            ) {
              segmentIdEff = currentSeg.segmentId.trim();
            }
          } catch {}
        }
      }

      if (!temporalEff) {
        const openedAt = firstSeenAtEff || relationshipObj.created.toISOString();
        const generatedSegment =
          segmentIdEff ??
          `seg_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
        segmentIdEff = generatedSegment;
        const temporalMeta = this.emptyTemporalMetadata();
        if (changeSetIdEff) temporalMeta.changeSetId = changeSetIdEff;
        const currentSegment: TemporalSegmentRecord = {
          segmentId: generatedSegment,
          openedAt,
          changeSetId: changeSetIdEff ?? undefined,
        };
        temporalMeta.current = currentSegment;
        this.recordTemporalEvent(temporalMeta, {
          type: "opened",
          at: openedAt,
          changeSetId: currentSegment.changeSetId,
          segmentId: currentSegment.segmentId,
        });
        temporalEff = this.serializeTemporalMetadata(temporalMeta);
      }

      if (temporalEff) {
        temporalEff = temporalEff.slice(0, 200000);
      }
    }

    const evidenceArr = Array.isArray(topAll.evidence)
      ? topAll.evidence
      : Array.isArray(mdAll.evidence)
      ? mdAll.evidence
      : [];
    const locationsArr = Array.isArray(topAll.locations)
      ? topAll.locations
      : Array.isArray(mdAll.locations)
      ? mdAll.locations
      : [];
    const locPathEff =
      (topAll.location && topAll.location.path) || mdAll.path || null;
    const locLineEff =
      topAll.location && typeof topAll.location.line === "number"
        ? topAll.location.line
        : typeof mdAll.line === "number"
        ? mdAll.line
        : null;
    const locColEff =
      topAll.location && typeof topAll.location.column === "number"
        ? topAll.location.column
        : typeof mdAll.column === "number"
        ? mdAll.column
        : null;
    const siteIdEff =
      typeof (topAll.siteId || mdAll.siteId) === "string"
        ? topAll.siteId || mdAll.siteId
        : locPathEff && typeof locLineEff === "number"
        ? "site_" +
          crypto
            .createHash("sha1")
            .update(
              `${locPathEff}|${locLineEff}|${locColEff ?? ""}|${
                topAll.accessPath || mdAll.accessPath || ""
              }`
            )
            .digest("hex")
            .slice(0, 12)
        : null;
    const sectionAnchorEff =
      typeof topAll.sectionAnchor === "string"
        ? topAll.sectionAnchor
        : typeof mdAll.sectionAnchor === "string"
        ? mdAll.sectionAnchor
        : null;
    const sectionTitleEff =
      typeof topAll.sectionTitle === "string"
        ? topAll.sectionTitle
        : typeof mdAll.sectionTitle === "string"
        ? mdAll.sectionTitle
        : null;
    const summaryEff =
      typeof topAll.summary === "string"
        ? topAll.summary
        : typeof mdAll.summary === "string"
        ? mdAll.summary
        : null;
    const docVersionEff =
      typeof topAll.docVersion === "string"
        ? topAll.docVersion
        : typeof mdAll.docVersion === "string"
        ? mdAll.docVersion
        : null;
    const docHashEff =
      typeof topAll.docHash === "string"
        ? topAll.docHash
        : typeof mdAll.docHash === "string"
        ? mdAll.docHash
        : null;
    const documentationQualityEff =
      typeof topAll.documentationQuality === "string"
        ? topAll.documentationQuality
        : typeof mdAll.documentationQuality === "string"
        ? mdAll.documentationQuality
        : null;
    const coverageScopeEff =
      typeof topAll.coverageScope === "string"
        ? topAll.coverageScope
        : typeof mdAll.coverageScope === "string"
        ? mdAll.coverageScope
        : null;
    const domainPathEff =
      typeof topAll.domainPath === "string"
        ? topAll.domainPath
        : typeof mdAll.domainPath === "string"
        ? mdAll.domainPath
        : null;
    const taxonomyVersionEff =
      typeof topAll.taxonomyVersion === "string"
        ? topAll.taxonomyVersion
        : typeof mdAll.taxonomyVersion === "string"
        ? mdAll.taxonomyVersion
        : null;
    const updatedFromDocAtEff = toISO(
      topAll.updatedFromDocAt ?? mdAll.updatedFromDocAt
    );
    const lastValidatedEff = toISO(topAll.lastValidated ?? mdAll.lastValidated);
    const strengthEff =
      typeof topAll.strength === "number"
        ? topAll.strength
        : typeof mdAll.strength === "number"
        ? mdAll.strength
        : null;
    const similarityEff =
      typeof topAll.similarityScore === "number"
        ? topAll.similarityScore
        : typeof mdAll.similarityScore === "number"
        ? mdAll.similarityScore
        : null;
    const clusterVersionEff =
      typeof topAll.clusterVersion === "string"
        ? topAll.clusterVersion
        : typeof mdAll.clusterVersion === "string"
        ? mdAll.clusterVersion
        : null;
    const roleEff =
      typeof topAll.role === "string"
        ? topAll.role
        : typeof mdAll.role === "string"
        ? mdAll.role
        : null;
    const docIntentEff =
      typeof topAll.docIntent === "string"
        ? topAll.docIntent
        : typeof mdAll.docIntent === "string"
        ? mdAll.docIntent
        : null;
    const embeddingVersionEff =
      typeof topAll.embeddingVersion === "string"
        ? topAll.embeddingVersion
        : typeof mdAll.embeddingVersion === "string"
        ? mdAll.embeddingVersion
        : null;
    const policyTypeEff =
      typeof topAll.policyType === "string"
        ? topAll.policyType
        : typeof mdAll.policyType === "string"
        ? mdAll.policyType
        : null;
    const effectiveFromEff = toISO(topAll.effectiveFrom ?? mdAll.effectiveFrom);
    const expiresAtCandidate =
      topAll.expiresAt !== undefined
        ? topAll.expiresAt
        : Object.prototype.hasOwnProperty.call(mdAll, "expiresAt")
        ? mdAll.expiresAt
        : undefined;
    const expiresAtEff =
      expiresAtCandidate === null ? null : toISO(expiresAtCandidate);
    const expiresAtIsSet = expiresAtCandidate !== undefined;
    const relationshipTypeEff =
      typeof topAll.relationshipType === "string"
        ? topAll.relationshipType
        : typeof mdAll.relationshipType === "string"
        ? mdAll.relationshipType
        : null;
    const docLocaleEff =
      typeof topAll.docLocale === "string"
        ? topAll.docLocale
        : typeof mdAll.docLocale === "string"
        ? mdAll.docLocale
        : null;
    const tagsEff = Array.isArray(topAll.tags)
      ? topAll.tags
      : Array.isArray(mdAll.tags)
      ? mdAll.tags
      : null;
    const stakeholdersEff = Array.isArray(topAll.stakeholders)
      ? topAll.stakeholders
      : Array.isArray(mdAll.stakeholders)
      ? mdAll.stakeholders
      : null;
    const metadataJson = JSON.stringify(mdAll);
    const isPerfRelationship = isPerformanceRelationshipType(
      relationshipObj.type as RelationshipType
    );
    const pickString = (value: unknown, limit?: number): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      return typeof limit === "number" && limit > 0
        ? trimmed.slice(0, limit)
        : trimmed;
    };
    const toFiniteNumber = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string" && value.trim() !== "") {
        const num = Number(value);
        if (Number.isFinite(num)) return num;
      }
      return null;
    };
    const metricIdEff = isPerfRelationship
      ? pickString(topAll.metricId ?? mdAll.metricId ?? null)
      : null;
    const scenarioEff = isPerfRelationship
      ? pickString(topAll.scenario ?? mdAll.scenario ?? null)
      : null;
    const environmentEff = isPerfRelationship
      ? pickString(topAll.environment ?? mdAll.environment ?? null)
      : null;
    const unitEff = isPerfRelationship
      ? pickString(topAll.unit ?? mdAll.unit ?? null, 32)
      : null;
    const baselineEff = isPerfRelationship
      ? toFiniteNumber(topAll.baselineValue ?? mdAll.baselineValue)
      : null;
    const currentEff = isPerfRelationship
      ? toFiniteNumber(topAll.currentValue ?? mdAll.currentValue)
      : null;
    const deltaEff = isPerfRelationship
      ? toFiniteNumber(topAll.delta ?? mdAll.delta)
      : null;
    const percentEff = isPerfRelationship
      ? toFiniteNumber(topAll.percentChange ?? mdAll.percentChange)
      : null;
    const sampleSizeEff = isPerfRelationship
      ? toFiniteNumber(topAll.sampleSize ?? mdAll.sampleSize)
      : null;
    const rawConfidence = isPerfRelationship
      ? topAll.confidenceInterval ?? mdAll.confidenceInterval
      : null;
    const confidenceIntervalEff = (() => {
      if (!rawConfidence || typeof rawConfidence !== "object") return null;
      const lower = toFiniteNumber((rawConfidence as any).lower);
      const upper = toFiniteNumber((rawConfidence as any).upper);
      if (lower == null && upper == null) return null;
      return {
        ...(lower != null ? { lower } : {}),
        ...(upper != null ? { upper } : {}),
      };
    })();
    const confidenceIntervalJson = confidenceIntervalEff
      ? JSON.stringify(confidenceIntervalEff).slice(0, 200000)
      : null;
    const trendEff = isPerfRelationship
      ? pickString(topAll.trend ?? mdAll.trend ?? null)
      : null;
    const severityEff = isPerfRelationship
      ? pickString(topAll.severity ?? mdAll.severity ?? null)
      : null;
    const riskScoreEff = isPerfRelationship
      ? toFiniteNumber(topAll.riskScore ?? mdAll.riskScore)
      : null;
    const runIdEff = isPerfRelationship
      ? pickString(topAll.runId ?? mdAll.runId ?? null)
      : null;
    const policyIdEff = isPerfRelationship
      ? pickString(topAll.policyId ?? mdAll.policyId ?? null)
      : null;
    const detectedAtEff = isPerfRelationship
      ? toISO(topAll.detectedAt ?? mdAll.detectedAt)
      : null;
    const resolvedAtCandidate = isPerfRelationship
      ? Object.prototype.hasOwnProperty.call(topAll, "resolvedAt")
        ? topAll.resolvedAt
        : Object.prototype.hasOwnProperty.call(mdAll, "resolvedAt")
        ? mdAll.resolvedAt
        : undefined
      : undefined;
    const resolvedAtEff =
      resolvedAtCandidate === undefined
        ? null
        : resolvedAtCandidate === null
        ? null
        : toISO(resolvedAtCandidate);
    const resolvedAtIsSet = resolvedAtCandidate !== undefined;
    const metricsHistoryArray = (() => {
      if (!isPerfRelationship) return null;
      if (Array.isArray(topAll.metricsHistory)) return topAll.metricsHistory;
      if (Array.isArray(mdAll.metricsHistory)) return mdAll.metricsHistory;
      return null;
    })();
    const metricsHistoryEff = (() => {
      if (!metricsHistoryArray || metricsHistoryArray.length === 0) return null;
      return JSON.stringify(
        metricsHistoryArray.map((entry: any) => ({
          ...entry,
          timestamp: toISO(entry?.timestamp ?? entry?.time ?? entry?.recordedAt),
        }))
      ).slice(0, 200000);
    })();
    const metricsEff = (() => {
      if (!isPerfRelationship) return null;
      const arr = Array.isArray(mdAll.metrics) ? mdAll.metrics : [];
      if (arr.length === 0) return null;
      return JSON.stringify(arr).slice(0, 200000);
    })();
    const params: any = {
      fromId: relationshipObj.fromEntityId,
      toId: relationshipObj.toEntityId,
      id: relationshipObj.id,
      created: relationshipObj.created.toISOString(),
      lastModified: relationshipObj.lastModified.toISOString(),
      version: relationshipObj.version,
      metadata: metadataJson,
      segmentId: segmentIdEff,
      temporal: temporalEff,
      changeSetId: changeSetIdEff,
      occurrencesScan:
        typeof topAll.occurrencesScan === "number"
          ? topAll.occurrencesScan
          : null,
      confidence: typeof confidence === "number" ? confidence : null,
      inferred: typeof inferred === "boolean" ? inferred : null,
      resolved: typeof resolved === "boolean" ? resolved : null,
      source: typeof source === "string" ? source : null,
      context: typeof context === "string" ? context : null,
      kind:
        typeof topAll.kind === "string"
          ? topAll.kind
          : typeof mdAll.kind === "string"
          ? mdAll.kind
          : null,
      resolution:
        typeof topAll.resolution === "string"
          ? topAll.resolution
          : typeof mdAll.resolution === "string"
          ? mdAll.resolution
          : null,
      scope: scopeEff ?? null,
      arity:
        typeof topAll.arity === "number"
          ? topAll.arity
          : typeof mdAll.arity === "number"
          ? mdAll.arity
          : null,
      awaited:
        typeof topAll.awaited === "boolean"
          ? topAll.awaited
          : typeof mdAll.awaited === "boolean"
          ? mdAll.awaited
          : null,
      operator:
        typeof topAll.operator === "string"
          ? topAll.operator
          : typeof mdAll.operator === "string"
          ? mdAll.operator
          : null,
      importDepth: structuralProps.importDepth,
      usedTypeChecker:
        typeof topAll.usedTypeChecker === "boolean"
          ? topAll.usedTypeChecker
          : typeof mdAll.usedTypeChecker === "boolean"
          ? mdAll.usedTypeChecker
          : null,
      isExported:
        typeof topAll.isExported === "boolean"
          ? topAll.isExported
          : typeof mdAll.isExported === "boolean"
          ? mdAll.isExported
          : null,
      accessPath:
        typeof topAll.accessPath === "string"
          ? topAll.accessPath
          : typeof mdAll.accessPath === "string"
          ? mdAll.accessPath
          : null,
      callee:
        typeof topAll.callee === "string"
          ? topAll.callee
          : typeof mdAll.callee === "string"
          ? mdAll.callee
          : null,
      paramName:
        typeof topAll.paramName === "string"
          ? topAll.paramName
          : typeof mdAll.param === "string"
          ? mdAll.param
          : null,
      importAlias: structuralProps.importAlias,
      importType: structuralProps.importType,
      isNamespace: structuralProps.isNamespace,
      isReExport: structuralProps.isReExport,
      reExportTarget: structuralProps.reExportTarget,
      language: structuralProps.language,
      symbolKind: structuralProps.symbolKind,
      modulePath: structuralProps.modulePath,
      resolutionState: structuralProps.resolutionState,
      receiverType:
        typeof topAll.receiverType === "string"
          ? topAll.receiverType
          : typeof mdAll.receiverType === "string"
          ? mdAll.receiverType
          : null,
      dynamicDispatch:
        typeof topAll.dynamicDispatch === "boolean"
          ? topAll.dynamicDispatch
          : typeof mdAll.dynamicDispatch === "boolean"
          ? mdAll.dynamicDispatch
          : null,
      overloadIndex:
        typeof topAll.overloadIndex === "number"
          ? topAll.overloadIndex
          : typeof mdAll.overloadIndex === "number"
          ? mdAll.overloadIndex
          : null,
      genericArguments: JSON.stringify(
        Array.isArray(topAll.genericArguments)
          ? topAll.genericArguments
          : Array.isArray(mdAll.genericArguments)
          ? mdAll.genericArguments
          : []
      ).slice(0, 200000),
      loc_path: (topAll.location && topAll.location.path) || mdAll.path || null,
      loc_line:
        topAll.location && typeof topAll.location.line === "number"
          ? topAll.location.line
          : typeof mdAll.line === "number"
          ? mdAll.line
          : null,
      loc_col:
        topAll.location && typeof topAll.location.column === "number"
          ? topAll.location.column
          : typeof mdAll.column === "number"
          ? mdAll.column
          : null,
      evidence: JSON.stringify(evidenceArr).slice(0, 200000),
      locations: JSON.stringify(locationsArr).slice(0, 200000),
      siteId: siteIdEff,
      siteHash: typeof topAll.siteHash === "string" ? topAll.siteHash : null,
      sites: JSON.stringify(
        Array.isArray(topAll.sites)
          ? topAll.sites
          : Array.isArray(mdAll.sites)
          ? mdAll.sites
          : []
      ).slice(0, 200000),
      why:
        typeof (topAll.why || mdAll.why) === "string"
          ? topAll.why || mdAll.why
          : null,
      to_ref_kind:
        typeof topAll.to_ref_kind === "string" ? topAll.to_ref_kind : null,
      to_ref_file:
        typeof topAll.to_ref_file === "string" ? topAll.to_ref_file : null,
      to_ref_symbol:
        typeof topAll.to_ref_symbol === "string" ? topAll.to_ref_symbol : null,
      to_ref_name:
        typeof topAll.to_ref_name === "string" ? topAll.to_ref_name : null,
      from_ref_kind:
        typeof (topAll as any).from_ref_kind === "string"
          ? (topAll as any).from_ref_kind
          : null,
      from_ref_file:
        typeof (topAll as any).from_ref_file === "string"
          ? (topAll as any).from_ref_file
          : null,
      from_ref_symbol:
        typeof (topAll as any).from_ref_symbol === "string"
          ? (topAll as any).from_ref_symbol
          : null,
      from_ref_name:
        typeof (topAll as any).from_ref_name === "string"
          ? (topAll as any).from_ref_name
          : null,
      ambiguous:
        typeof topAll.ambiguous === "boolean"
          ? topAll.ambiguous
          : typeof mdAll.ambiguous === "boolean"
          ? mdAll.ambiguous
          : null,
      candidateCount:
        typeof topAll.candidateCount === "number"
          ? topAll.candidateCount
          : typeof mdAll.candidateCount === "number"
          ? mdAll.candidateCount
          : null,
      isMethod: typeof topAll.isMethod === "boolean" ? topAll.isMethod : null,
      firstSeenAt: firstSeenAtEff,
      lastSeenAt: lastSeenAtEff,
      sectionAnchor: sectionAnchorEff,
      sectionTitle: sectionTitleEff,
      summary: summaryEff,
      docVersion: docVersionEff,
      docHash: docHashEff,
      documentationQuality: documentationQualityEff,
      coverageScope: coverageScopeEff,
      domainPath: domainPathEff,
      taxonomyVersion: taxonomyVersionEff,
      updatedFromDocAt: updatedFromDocAtEff,
      lastValidated: lastValidatedEff,
      strength: strengthEff,
      similarityScore: similarityEff,
      clusterVersion: clusterVersionEff,
      role: roleEff,
      docIntent: docIntentEff,
      embeddingVersion: embeddingVersionEff,
      policyType: policyTypeEff,
      effectiveFrom: effectiveFromEff,
      expiresAt: expiresAtEff,
      expiresAt_is_set: expiresAtIsSet,
      relationshipType: relationshipTypeEff,
      docLocale: docLocaleEff,
      tags: tagsEff,
      stakeholders: stakeholdersEff,
      metricId: metricIdEff,
      scenario: scenarioEff,
      environment: environmentEff,
      unit: unitEff,
      baselineValue: baselineEff,
      currentValue: currentEff,
      delta: deltaEff,
      percentChange: percentEff,
      sampleSize: sampleSizeEff,
      confidenceInterval: confidenceIntervalJson,
      trend: trendEff,
      severity: severityEff,
      riskScore: riskScoreEff,
      runId: runIdEff,
      policyId: policyIdEff,
      detectedAt: detectedAtEff,
      resolvedAt: resolvedAtEff,
      resolvedAt_is_set: resolvedAtIsSet,
      metricsHistory: metricsHistoryEff,
      metrics: metricsEff,
    };
    delete (relationshipObj as any).__backfilledToRef;
    const debugRow = { ...params };
    params.rows = [debugRow];

    const result = await this.graphDbQuery(query, params);

    // Phase 1: Unify resolved edge with any prior placeholders pointing to same symbol
    try {
      await this.unifyResolvedEdgePlaceholders(relationshipObj);
    } catch {}

    // Phase 2: Dual-write auxiliary evidence/site/candidate nodes (non-blocking)
    try {
      await this.dualWriteAuxiliaryForEdge(relationshipObj);
    } catch {}

    // Emit event for real-time updates
    this.emit("relationshipCreated", {
      id: relationshipObj.id,
      type: relationshipObj.type,
      fromEntityId: relationshipObj.fromEntityId,
      toEntityId: relationshipObj.toEntityId,
      timestamp: new Date().toISOString(),
    });

    if (!this._indexesEnsured) {
      this.bootstrapIndicesOnce().catch(() => undefined);
    }
  }

  async upsertRelationship(relationship: GraphRelationship): Promise<void> {
    const normalized: any = { ...(relationship as any) };
    normalized.fromEntityId =
      normalized.fromEntityId ?? (normalized.sourceId as string | undefined);
    normalized.toEntityId =
      normalized.toEntityId ?? (normalized.targetId as string | undefined);

    await this.createRelationship(normalized as GraphRelationship);
  }

  /**
   * Mark code relationships as inactive if not seen since the provided cutoff.
   * Optionally restrict by file path (to_ref_file) to limit scope after parsing a file.
   */
  async markInactiveEdgesNotSeenSince(
    cutoff: Date,
    opts?: { toRefFile?: string }
  ): Promise<number> {
    const cutoffISO = cutoff.toISOString();
    const where: string[] = [
      "r.lastSeenAt < $cutoff",
      "r.active = true OR r.active IS NULL",
      "r.kind IS NOT NULL OR r.source IS NOT NULL", // likely code edges
    ];
    if (opts?.toRefFile) where.push("r.to_ref_file = $toRefFile");
    const query = `
      MATCH ()-[r]->()
      WHERE ${where.join(" AND ")}
      SET r.active = false,
          r.validTo = coalesce(r.validTo, $cutoff)
      RETURN count(r) AS updated
    `;
    const rows = await this.graphDbQuery(query, {
      cutoff: cutoffISO,
      toRefFile: opts?.toRefFile || null,
    });
    return rows?.[0]?.updated || 0;
  }

  async updateDocumentationFreshness(
    docId: string,
    opts: {
      lastValidated: Date;
      documentationQuality?: DocumentationQuality;
      updatedFromDocAt?: Date;
    }
  ): Promise<number> {
    const resolvedDocId = this.resolveEntityIdInput(docId);
    const lastValidatedISO = opts.lastValidated.toISOString();
    const updatedFromDocAtISO = opts.updatedFromDocAt
      ? opts.updatedFromDocAt.toISOString()
      : null;
    const docTypes = DOCUMENTATION_RELATIONSHIP_TYPES.map(
      (t) => t as unknown as string
    );
    const setDocQuality = typeof opts.documentationQuality === "string";
    const query = `
      MATCH (doc {id: $docId})
      MATCH (doc)-[r]-()
      WHERE type(r) IN $docTypes
      SET r.lastValidated = $lastValidated,
          r.updatedFromDocAt = CASE WHEN $updatedFromDocAt IS NULL THEN r.updatedFromDocAt ELSE $updatedFromDocAt END,
          r.active = coalesce(r.active, true)
          ${
            setDocQuality
              ? ", r.documentationQuality = $documentationQuality"
              : ""
          }
      RETURN count(r) AS updated
    `;
    try {
      const rows = await this.graphDbQuery(query, {
        docId: resolvedDocId,
        docTypes,
        lastValidated: lastValidatedISO,
        updatedFromDocAt: updatedFromDocAtISO,
        documentationQuality: opts.documentationQuality ?? null,
      });
      return rows?.[0]?.updated || 0;
    } catch (error) {
      console.warn(
        `updateDocumentationFreshness failed for ${docId}:`,
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  async markDocumentationAsStale(
    cutoff: Date,
    excludeDocIds: string[] = []
  ): Promise<number> {
    const cutoffISO = cutoff.toISOString();
    const resolvedExclude =
      this.resolveEntityIdArray(excludeDocIds) ?? [];
    const docTypes = DOCUMENTATION_RELATIONSHIP_TYPES.map(
      (t) => t as unknown as string
    );
    const query = `
      MATCH (doc {type: "documentation"})
      WHERE (doc.docSource IS NULL OR doc.docSource <> 'manual')
        AND NOT doc.id IN $exclude
      MATCH (doc)-[r]-()
      WHERE type(r) IN $docTypes AND (r.lastValidated IS NULL OR r.lastValidated < $cutoff)
      SET r.documentationQuality = 'outdated',
          r.lastValidated = coalesce(r.lastValidated, $cutoff),
          r.active = coalesce(r.active, true)
      RETURN count(r) AS updated
    `;
    try {
      const rows = await this.graphDbQuery(query, {
        cutoff: cutoffISO,
        exclude: resolvedExclude,
        docTypes,
      });
      return rows?.[0]?.updated || 0;
    } catch (error) {
      console.warn(
        "markDocumentationAsStale failed:",
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  async markEntityDocumentationOutdated(
    entityId: string,
    opts: { reason?: string; staleSince?: Date } = {}
  ): Promise<number> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    const reason = opts.reason || null;
    const staleSinceISO = (opts.staleSince || new Date()).toISOString();
    const query = `
      MATCH (entity {id: $entityId})-[r:DOCUMENTED_BY]->(doc {type: "documentation"})
      WHERE coalesce(doc.docSource, 'parser') <> 'manual'
      SET r.documentationQuality = 'outdated',
          r.active = coalesce(r.active, true),
          r.lastValidated = CASE WHEN r.lastValidated IS NULL THEN $staleSince ELSE r.lastValidated END,
          r.docStaleReason = CASE WHEN $reason IS NULL THEN r.docStaleReason ELSE $reason END
      RETURN count(r) AS updated
    `;

    try {
      const rows = await this.graphDbQuery(query, {
        entityId: resolvedId,
        reason,
        staleSince: staleSinceISO,
      });
      return rows?.[0]?.updated || 0;
    } catch (error) {
      console.warn(
        `markEntityDocumentationOutdated failed for ${entityId}:`,
        error instanceof Error ? error.message : error
      );
      return 0;
    }
  }

  private async bootstrapIndicesOnce(): Promise<EnsureIndicesResult | null> {
    if (this._indexesEnsured) {
      return {
        status: "completed",
        stats: { created: 0, exists: 0, deferred: 0, failed: 0 },
      };
    }

    if (this._indexEnsureInFlight) {
      return this._indexEnsureInFlight;
    }

    const promise = (async () => {
      try {
        const result = await this.ensureIndices();
        if (result.status === "completed") {
          this._indexesEnsured = true;
        } else if (result.status === "failed") {
          console.warn("graph.indices.ensure failed", result);
        }
        return result;
      } finally {
        this._indexEnsureInFlight = null;
      }
    })();

    this._indexEnsureInFlight = promise;
    return promise;
  }

  /**
   * Best-effort index creation to accelerate common queries.
   * Guarded to avoid failures on engines that do not support these syntaxes.
   */
  async ensureIndices(): Promise<EnsureIndicesResult> {
    const stats: EnsureIndicesStats = {
      created: 0,
      exists: 0,
      deferred: 0,
      failed: 0,
    };
    const bump = (outcome: keyof EnsureIndicesStats) => {
      stats[outcome] += 1;
    };
    let status: EnsureIndicesResult["status"] = "completed";

    const runGroup = async (queries: string[]) => {
      for (const query of queries) {
        const outcome = await this.createIndexGuarded(query);
        bump(outcome);
        if (outcome === "deferred") {
          status = status === "failed" ? status : "deferred";
          console.log("graph.indices.ensure halted", { outcome, query });
          return false;
        }
        if (outcome === "failed") {
          status = "failed";
          console.log("graph.indices.ensure halted", { outcome, query });
          return false;
        }
      }
      return true;
    };

    const nodeIndexQueries = [
      "CREATE INDEX ON :Entity(id)",
      "CREATE INDEX ON :Entity(type)",
      "CREATE INDEX ON :Entity(path)",
    ];
    const additionalNodeIndexes = [
      "CREATE INDEX ON :Entity(name)",
      "CREATE INDEX ON :Entity(lastModified)",
      "CREATE INDEX ON :Entity(created)",
    ];
    const relationshipIndexQueries = [
      "CREATE INDEX ON :file(path)",
      "CREATE INDEX ON :symbol(path)",
      "CREATE INDEX ON :version(entityId)",
      "CREATE INDEX ON :checkpoint(checkpointId)",
    ];

    const groups = [
      nodeIndexQueries,
      additionalNodeIndexes,
      relationshipIndexQueries,
    ];
    for (const group of groups) {
      const proceed = await runGroup(group);
      if (!proceed) {
        console.log("graph.indices.ensure summary", { stats, status });
        return { status, stats };
      }
    }

    console.log({ event: "graph.indices.ensure_attempted", stats });
    return { status, stats };
  }

  /**
   * Upsert evidence and lightweight fields for existing relationships by id.
   * Intended for incremental sync to keep occurrences, evidence, locations, and lastSeenAt updated.
   */
  async upsertEdgeEvidenceBulk(
    rels: Array<GraphRelationship & { toEntityId?: string }>
  ): Promise<void> {
    if (!Array.isArray(rels) || rels.length === 0) return;
    const nowISO = new Date().toISOString();
    for (const rIn of rels) {
      try {
        const normalized = this.normalizeRelationship(rIn as GraphRelationship);
        const topIn: any = normalized as any;
        const mdIn: any = topIn.metadata || {};
        const baseRid =
          (typeof topIn.id === "string" && topIn.id.length > 0
            ? topIn.id
            : canonicalRelationshipId(topIn.fromEntityId, normalized)) ?? "";
        const rid = this.namespaceScope.applyRelationshipPrefix(baseRid);
        topIn.id = rid;
        const candidateIds = this.relationshipIdCandidates(rid, baseRid);
        // Fetch existing
        let props: any = null;
        try {
          const rows = await this.graphDbQuery(
            `MATCH ()-[r]->() WHERE r.id = $id RETURN r LIMIT 1`,
            { id: rid }
          );
          const fallbackRows =
            (!rows || rows.length === 0) && candidateIds.length > 1
              ? await this.graphDbQuery(
                  `MATCH ()-[r]->() WHERE r.id IN $ids RETURN r LIMIT 1`,
                  { ids: candidateIds }
                )
              : null;
          const rowSource = rows && rows[0] ? rows[0] : fallbackRows?.[0];
          if (rowSource && rowSource.r) {
            const relData = rowSource.r;
            props = {};
            if (Array.isArray(relData)) {
              for (const [k, v] of relData) {
                if (k === "properties" && Array.isArray(v)) {
                  for (const [pk, pv] of v) props[pk] = pv;
                } else if (k !== "src_node" && k !== "dest_node") {
                  props[k] = v;
                }
              }
            }
          }
        } catch {}
        const incoming = {
          occurrencesScan:
            typeof topIn.occurrencesScan === "number"
              ? topIn.occurrencesScan
              : typeof mdIn.occurrencesScan === "number"
              ? mdIn.occurrencesScan
              : 1,
          confidence:
            typeof topIn.confidence === "number"
              ? topIn.confidence
              : typeof mdIn.confidence === "number"
              ? mdIn.confidence
              : undefined,
          inferred:
            typeof topIn.inferred === "boolean"
              ? topIn.inferred
              : typeof mdIn.inferred === "boolean"
              ? mdIn.inferred
              : undefined,
          resolved:
            typeof topIn.resolved === "boolean"
              ? topIn.resolved
              : typeof mdIn.resolved === "boolean"
              ? mdIn.resolved
              : undefined,
          source:
            typeof topIn.source === "string"
              ? topIn.source
              : typeof mdIn.source === "string"
              ? mdIn.source
              : undefined,
          context:
            typeof topIn.context === "string" ? topIn.context : undefined,
        };

        // Merge with existing
        let occurrencesScan = incoming.occurrencesScan || 1;
        let confidence = incoming.confidence;
        let inferred = incoming.inferred;
        let resolved = incoming.resolved;
        let source = incoming.source;
        let context = incoming.context;
        let mergedEvidence: any[] | undefined;
        let mergedLocations:
          | Array<{ path?: string; line?: number; column?: number }>
          | undefined;
        let firstSeenAtISO = nowISO;
        let lastSeenAtISO = nowISO;

        if (props) {
          const mdOld =
            typeof props.metadata === "string"
              ? (() => {
                  try {
                    return JSON.parse(props.metadata);
                  } catch {
                    return {};
                  }
                })()
              : props.metadata || {};
          const oldConf =
            typeof props.confidence === "number"
              ? props.confidence
              : typeof mdOld.confidence === "number"
              ? mdOld.confidence
              : undefined;
          const oldCtx =
            typeof props.context === "string" ? props.context : undefined;
          confidence = Math.max(oldConf || 0, confidence || 0);
          inferred =
            inferred ??
            (typeof mdOld.inferred === "boolean" ? mdOld.inferred : undefined);
          resolved =
            resolved ??
            (typeof mdOld.resolved === "boolean" ? mdOld.resolved : undefined);
          source =
            source ??
            (typeof mdOld.source === "string" ? mdOld.source : undefined);
          context = context || oldCtx;
          // first/last seen
          try {
            const oldFirstISO =
              typeof props.firstSeenAt === "string" ? props.firstSeenAt : null;
            const oldLastISO =
              typeof props.lastSeenAt === "string" ? props.lastSeenAt : null;
            firstSeenAtISO = oldFirstISO
              ? new Date(oldFirstISO) < new Date(nowISO)
                ? oldFirstISO
                : nowISO
              : nowISO;
            lastSeenAtISO =
              oldLastISO && new Date(oldLastISO) > new Date(nowISO)
                ? oldLastISO
                : nowISO;
          } catch {}

          // Merge evidence/locations
          try {
            const evOld = Array.isArray(mdOld.evidence) ? mdOld.evidence : [];
            const evNew = Array.isArray((topIn as any).evidence)
              ? (topIn as any).evidence
              : Array.isArray(mdIn.evidence)
              ? mdIn.evidence
              : [];
            const locOld = Array.isArray(mdOld.locations)
              ? mdOld.locations
              : [];
            const locNew = Array.isArray((topIn as any).locations)
              ? (topIn as any).locations
              : Array.isArray(mdIn.locations)
              ? mdIn.locations
              : [];
            const dedupeBy = (arr: any[], keyFn: (x: any) => string) => {
              const seen = new Set<string>();
              const out: any[] = [];
              for (const it of arr) {
                const k = keyFn(it);
                if (!seen.has(k)) {
                  seen.add(k);
                  out.push(it);
                }
              }
              return out;
            };
            mergedEvidence = mergeEdgeEvidence(evOld, evNew, 20);
            const locMergedRaw = [...locOld, ...locNew];
            mergedLocations = mergeEdgeLocations(locMergedRaw, [], 20);
          } catch {}
        }

        // Update relationship row
        const q = `
          MATCH ()-[r]-()
          WHERE r.id IN $ids
          SET r.lastModified = $now,
              r.version = coalesce(r.version, 0) + 1,
              r.occurrencesScan = coalesce(r.occurrencesScan, 0) + $occurrencesScan,
              r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + $occurrencesScan,
              r.confidence = $confidence,
              r.inferred = $inferred,
              r.resolved = $resolved,
              r.source = $source,
              r.context = COALESCE(r.context, $context),
              r.evidence = $evidence,
              r.locations = $locations,
              r.firstSeenAt = COALESCE(r.firstSeenAt, $firstSeenAt),
              r.lastSeenAt = $lastSeenAt
        `;
        const evidenceArr = Array.isArray(topIn.evidence)
          ? topIn.evidence
          : Array.isArray(mdIn.evidence)
          ? mdIn.evidence
          : [];
        const locationsArr = Array.isArray(topIn.locations)
          ? topIn.locations
          : Array.isArray(mdIn.locations)
          ? mdIn.locations
          : [];
        await this.graphDbQuery(q, {
          ids: candidateIds,
          id: rid,
          now: nowISO,
          occurrencesScan:
            typeof occurrencesScan === "number" ? occurrencesScan : 1,
          confidence: typeof confidence === "number" ? confidence : null,
          inferred: typeof inferred === "boolean" ? inferred : null,
          resolved: typeof resolved === "boolean" ? resolved : null,
          source: typeof source === "string" ? source : null,
          context: typeof context === "string" ? context : null,
          evidence: JSON.stringify(mergedEvidence || evidenceArr).slice(
            0,
            200000
          ),
          locations: JSON.stringify(mergedLocations || locationsArr).slice(
            0,
            200000
          ),
          firstSeenAt: firstSeenAtISO,
          lastSeenAt: lastSeenAtISO,
        });
        // Phase 2: dual-write evidence/sites for updated edge
        try {
          await this.dualWriteAuxiliaryForEdge({ ...topIn, id: rid } as any);
        } catch {}
      } catch {
        // continue on error for other items
      }
    }
  }

  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    let matchClause = "MATCH (a)-[r]->(b)";
    const whereClause: string[] = [];
    const params: any = {};

    const fromEntityId = this.resolveOptionalEntityId(query.fromEntityId);
    if (fromEntityId) {
      whereClause.push("a.id = $fromId");
      params.fromId = fromEntityId;
    }

    const toEntityId = this.resolveOptionalEntityId(query.toEntityId);
    if (toEntityId) {
      whereClause.push("b.id = $toId");
      params.toId = toEntityId;
    }

    if (query.type && query.type.length > 0) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      whereClause.push(`type(r) IN [${types.map((t) => "$" + t).join(", ")}]`);
      types.forEach((type, index) => {
        params[type] = type;
      });
    }

    if (query.since) {
      whereClause.push("r.created >= $since");
      params.since = query.since.toISOString();
    }
    if ((query as any).until) {
      const until = (query as any).until as Date;
      if (until instanceof Date) {
        whereClause.push("r.created <= $until");
        params.until = until.toISOString();
      }
    }

    // Extended filters for code edges
    const qAny: any = query as any;
    const applyEnumFilter = (value: any, column: string, key: string) => {
      if (Array.isArray(value)) {
        const filtered = value.filter((v) => typeof v === "string");
        if (filtered.length === 1) {
          whereClause.push(`${column} = $${key}`);
          params[key] = filtered[0];
        } else if (filtered.length > 1) {
          const listKey = `${key}List`;
          whereClause.push(`${column} IN $${listKey}`);
          params[listKey] = filtered;
        }
      } else if (typeof value === "string") {
        whereClause.push(`${column} = $${key}`);
        params[key] = value;
      }
    };
    const coerceStringList = (value: any): string[] => {
      if (Array.isArray(value)) {
        return value
          .filter((v) => typeof v === "string")
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? [trimmed] : [];
      }
      return [];
    };
    const applyArrayContainsFilter = (
      value: any,
      column: string,
      key: string
    ) => {
      const list = coerceStringList(value);
      if (list.length === 1) {
        whereClause.push(`ANY(x IN coalesce(${column}, []) WHERE x = $${key})`);
        params[key] = list[0];
      } else if (list.length > 1) {
        const listKey = `${key}List`;
        whereClause.push(
          `ANY(x IN coalesce(${column}, []) WHERE x IN $${listKey})`
        );
        params[listKey] = list;
      }
    };
    applyEnumFilter(qAny.kind, "r.kind", "kind");
    applyEnumFilter(qAny.source, "r.source", "source");
    applyEnumFilter(qAny.resolution, "r.resolution", "resolution");
    applyEnumFilter(qAny.scope, "r.scope", "scope");
    applyEnumFilter(qAny.docIntent, "r.docIntent", "docIntent");
    applyEnumFilter(qAny.coverageScope, "r.coverageScope", "coverageScope");
    applyEnumFilter(
      qAny.embeddingVersion,
      "r.embeddingVersion",
      "embeddingVersion"
    );
    applyEnumFilter(qAny.clusterVersion, "r.clusterVersion", "clusterVersion");
    applyEnumFilter(qAny.docLocale, "r.docLocale", "docLocale");
    applyEnumFilter(qAny.importAlias, "r.importAlias", "importAlias");
    applyEnumFilter(qAny.importType, "r.importType", "importType");
    const languageFiltersList = coerceStringList(qAny.language).map((value) =>
      value.toLowerCase()
    );
    if (languageFiltersList.length === 1) {
      whereClause.push(
        "((r.language IS NOT NULL AND toLower(r.language) = $languageFilter) OR toLower(coalesce(b.language, '')) = $languageFilter)"
      );
      params.languageFilter = languageFiltersList[0];
    } else if (languageFiltersList.length > 1) {
      whereClause.push(
        "((r.language IS NOT NULL AND toLower(r.language) IN $languageFilterList) OR toLower(coalesce(b.language, '')) IN $languageFilterList)"
      );
      params.languageFilterList = languageFiltersList;
    }
    applyEnumFilter(qAny.symbolKind, "r.symbolKind", "symbolKind");
    applyEnumFilter(qAny.modulePath, "r.modulePath", "modulePathFilter");
    if (typeof qAny.isNamespace === "boolean") {
      whereClause.push("r.isNamespace = $isNamespace");
      params.isNamespace = qAny.isNamespace;
    }
    if (
      typeof qAny.modulePathPrefix === "string" &&
      qAny.modulePathPrefix.trim().length > 0
    ) {
      whereClause.push("r.modulePath STARTS WITH $modulePathPrefix");
      params.modulePathPrefix = qAny.modulePathPrefix.trim();
    }
    if (typeof qAny.confidenceMin === "number") {
      whereClause.push("r.confidence >= $cmin");
      params.cmin = qAny.confidenceMin;
    }
    if (typeof qAny.confidenceMax === "number") {
      whereClause.push("r.confidence <= $cmax");
      params.cmax = qAny.confidenceMax;
    }
    if (typeof qAny.inferred === "boolean") {
      whereClause.push("r.inferred = $inferred");
      params.inferred = qAny.inferred;
    }
    if (typeof qAny.resolved === "boolean") {
      whereClause.push("r.resolved = $resolved");
      params.resolved = qAny.resolved;
    }
    if (typeof qAny.active === "boolean") {
      whereClause.push("r.active = $active");
      params.active = qAny.active;
    }
    if (qAny.firstSeenSince instanceof Date) {
      whereClause.push("r.firstSeenAt >= $fsince");
      params.fsince = qAny.firstSeenSince.toISOString();
    }
    if (qAny.lastSeenSince instanceof Date) {
      whereClause.push("r.lastSeenAt >= $lsince");
      params.lsince = qAny.lastSeenSince.toISOString();
    }
    // Optional filters for additional code-edge attributes
    if (typeof qAny.arityEq === "number") {
      whereClause.push("r.arity = $arityEq");
      params.arityEq = qAny.arityEq;
    }
    if (typeof qAny.arityMin === "number") {
      whereClause.push("r.arity >= $arityMin");
      params.arityMin = qAny.arityMin;
    }
    if (typeof qAny.arityMax === "number") {
      whereClause.push("r.arity <= $arityMax");
      params.arityMax = qAny.arityMax;
    }
    if (typeof qAny.awaited === "boolean") {
      whereClause.push("r.awaited = $awaited");
      params.awaited = qAny.awaited;
    }
    if (typeof qAny.isMethod === "boolean") {
      whereClause.push("r.isMethod = $isMethod");
      params.isMethod = qAny.isMethod;
    }
    if (typeof qAny.operator === "string") {
      whereClause.push("r.operator = $operator");
      params.operator = qAny.operator;
    }
    if (typeof qAny.callee === "string") {
      whereClause.push("r.callee = $callee");
      params.callee = qAny.callee;
    }
    if (typeof qAny.importDepthMin === "number") {
      whereClause.push("r.importDepth >= $importDepthMin");
      params.importDepthMin = qAny.importDepthMin;
    }
    if (typeof qAny.importDepthMax === "number") {
      whereClause.push("r.importDepth <= $importDepthMax");
      params.importDepthMax = qAny.importDepthMax;
    }
    const domainPaths = coerceStringList(qAny.domainPath)
      .map((value) => this.normalizeDomainPath(value))
      .filter(
        (value): value is string => value !== undefined && value !== null
      );
    if (domainPaths.length === 1) {
      whereClause.push("r.domainPath = $domainPath");
      params.domainPath = domainPaths[0];
    } else if (domainPaths.length > 1) {
      whereClause.push("r.domainPath IN $domainPathList");
      params.domainPathList = domainPaths;
    }

    const domainPrefixes = coerceStringList(qAny.domainPrefix)
      .map((value) => this.normalizeDomainPath(value))
      .filter(
        (value): value is string => value !== undefined && value !== null
      );
    if (domainPrefixes.length === 1) {
      whereClause.push("r.domainPath STARTS WITH $domainPrefix");
      params.domainPrefix = domainPrefixes[0];
    } else if (domainPrefixes.length > 1) {
      const clauses: string[] = [];
      domainPrefixes.forEach((prefix, idx) => {
        const key = `domainPrefix${idx}`;
        clauses.push(`r.domainPath STARTS WITH $${key}`);
        params[key] = prefix;
      });
      if (clauses.length > 0) {
        whereClause.push(`(${clauses.join(" OR ")})`);
      }
    }

    const clusterIds = coerceStringList(qAny.clusterId);
    if (clusterIds.length === 1) {
      whereClause.push(
        '((a.type = "semanticCluster" AND a.id = $clusterId) OR (b.type = "semanticCluster" AND b.id = $clusterId))'
      );
      params.clusterId = clusterIds[0];
    } else if (clusterIds.length > 1) {
      const key = "clusterIdList";
      whereClause.push(
        '((a.type = "semanticCluster" AND a.id IN $clusterIdList) OR (b.type = "semanticCluster" AND b.id IN $clusterIdList))'
      );
      params[key] = clusterIds;
    }

    const docTypes = coerceStringList(qAny.docType);
    if (docTypes.length === 1) {
      whereClause.push(
        '((a.type = "documentation" AND a.docType = $docType) OR (b.type = "documentation" AND b.docType = $docType))'
      );
      params.docType = docTypes[0];
    } else if (docTypes.length > 1) {
      whereClause.push(
        '((a.type = "documentation" AND a.docType IN $docTypeList) OR (b.type = "documentation" AND b.docType IN $docTypeList))'
      );
      params.docTypeList = docTypes;
    }

    const docStatuses = coerceStringList(qAny.docStatus);
    if (docStatuses.length === 1) {
      whereClause.push(
        '((a.type = "documentation" AND a.status = $docStatus) OR (b.type = "documentation" AND b.status = $docStatus))'
      );
      params.docStatus = docStatuses[0];
    } else if (docStatuses.length > 1) {
      whereClause.push(
        '((a.type = "documentation" AND a.status IN $docStatusList) OR (b.type = "documentation" AND b.status IN $docStatusList))'
      );
      params.docStatusList = docStatuses;
    }

    if (qAny.lastValidatedAfter instanceof Date) {
      whereClause.push("r.lastValidated >= $lastValidatedAfter");
      params.lastValidatedAfter = qAny.lastValidatedAfter.toISOString();
    }
    if (qAny.lastValidatedBefore instanceof Date) {
      whereClause.push("r.lastValidated <= $lastValidatedBefore");
      params.lastValidatedBefore = qAny.lastValidatedBefore.toISOString();
    }

    const normalizeMetricIdForFilter = (value: string): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      const normalized = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9/_\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/\/+/g, "/")
        .replace(/\/+$/g, "")
        .replace(/^\/+/, "")
        .slice(0, 256);
      return normalized || "unknown";
    };

    const metricFilters = coerceStringList(qAny.metricId)
      .map(normalizeMetricIdForFilter)
      .filter((value): value is string => Boolean(value));
    if (metricFilters.length === 1) {
      whereClause.push("r.metricId = $metricIdFilter");
      params.metricIdFilter = metricFilters[0];
    } else if (metricFilters.length > 1) {
      whereClause.push("r.metricId IN $metricIdList");
      params.metricIdList = metricFilters;
    }

    const environmentFilters = coerceStringList(qAny.environment)
      .map((value) => sanitizeEnvironment(value))
      .filter((value) => typeof value === "string" && value.length > 0);
    if (environmentFilters.length === 1) {
      whereClause.push("r.environment = $environmentFilter");
      params.environmentFilter = environmentFilters[0];
    } else if (environmentFilters.length > 1) {
      whereClause.push("r.environment IN $environmentFilterList");
      params.environmentFilterList = environmentFilters;
    }

    const severityAllowed = new Set(["critical", "high", "medium", "low"]);
    const severityFilters = coerceStringList(qAny.severity)
      .map((value) => value.toLowerCase())
      .filter((value) => severityAllowed.has(value));
    if (severityFilters.length === 1) {
      whereClause.push("r.severity = $severityFilter");
      params.severityFilter = severityFilters[0];
    } else if (severityFilters.length > 1) {
      whereClause.push("r.severity IN $severityFilterList");
      params.severityFilterList = severityFilters;
    }

    const trendAllowed = new Set(["regression", "improvement", "neutral"]);
    const trendFilters = coerceStringList(qAny.trend)
      .map((value) => value.toLowerCase())
      .filter((value) => trendAllowed.has(value));
    if (trendFilters.length === 1) {
      whereClause.push("r.trend = $trendFilter");
      params.trendFilter = trendFilters[0];
    } else if (trendFilters.length > 1) {
      whereClause.push("r.trend IN $trendFilterList");
      params.trendFilterList = trendFilters;
    }

    const toIsoDate = (value: unknown): string | null => {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string") {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
      }
      return null;
    };

    const detectedAfterISO = toIsoDate(qAny.detectedAfter);
    if (detectedAfterISO) {
      whereClause.push(
        "coalesce(r.detectedAt, r.created) >= $detectedAfter"
      );
      params.detectedAfter = detectedAfterISO;
    }

    const detectedBeforeISO = toIsoDate(qAny.detectedBefore);
    if (detectedBeforeISO) {
      whereClause.push(
        "coalesce(r.detectedAt, r.created) <= $detectedBefore"
      );
      params.detectedBefore = detectedBeforeISO;
    }

    const resolvedAfterISO = toIsoDate(qAny.resolvedAfter);
    if (resolvedAfterISO) {
      whereClause.push("r.resolvedAt IS NOT NULL AND r.resolvedAt >= $resolvedAfter");
      params.resolvedAfter = resolvedAfterISO;
    }

    const resolvedBeforeISO = toIsoDate(qAny.resolvedBefore);
    if (resolvedBeforeISO) {
      whereClause.push("r.resolvedAt IS NOT NULL AND r.resolvedAt <= $resolvedBefore");
      params.resolvedBefore = resolvedBeforeISO;
    }

    applyArrayContainsFilter(qAny.stakeholder, "r.stakeholders", "stakeholder");
    applyArrayContainsFilter(qAny.tag, "r.tags", "tag");
    // Filters on promoted to_ref_* scalars and siteHash
    if (typeof qAny.to_ref_kind === "string") {
      whereClause.push("r.to_ref_kind = $to_ref_kind");
      params.to_ref_kind = qAny.to_ref_kind;
    }
    if (typeof qAny.to_ref_file === "string") {
      whereClause.push("r.to_ref_file = $to_ref_file");
      params.to_ref_file = qAny.to_ref_file;
    }
    if (typeof qAny.to_ref_symbol === "string") {
      whereClause.push("r.to_ref_symbol = $to_ref_symbol");
      params.to_ref_symbol = qAny.to_ref_symbol;
    }
    if (typeof qAny.to_ref_name === "string") {
      whereClause.push("r.to_ref_name = $to_ref_name");
      params.to_ref_name = qAny.to_ref_name;
    }
    if (typeof qAny.siteHash === "string") {
      whereClause.push("r.siteHash = $siteHash");
      params.siteHash = qAny.siteHash;
    }

    // Filters on promoted from_ref_* scalars
    if (typeof (qAny as any).from_ref_kind === "string") {
      whereClause.push("r.from_ref_kind = $from_ref_kind");
      (params as any).from_ref_kind = (qAny as any).from_ref_kind;
    }
    if (typeof (qAny as any).from_ref_file === "string") {
      whereClause.push("r.from_ref_file = $from_ref_file");
      (params as any).from_ref_file = (qAny as any).from_ref_file;
    }
    if (typeof (qAny as any).from_ref_symbol === "string") {
      whereClause.push("r.from_ref_symbol = $from_ref_symbol");
      (params as any).from_ref_symbol = (qAny as any).from_ref_symbol;
    }
    if (typeof (qAny as any).from_ref_name === "string") {
      whereClause.push("r.from_ref_name = $from_ref_name");
      (params as any).from_ref_name = (qAny as any).from_ref_name;
    }

    // Default to active edges for code-edge-like queries
    try {
      const typeArr = Array.isArray(query.type)
        ? query.type
        : query.type
        ? [query.type]
        : [];
      const looksLikeCode =
        !!qAny.kind ||
        !!qAny.source ||
        typeof qAny.confidenceMin === "number" ||
        typeof qAny.confidenceMax === "number" ||
        typeof qAny.inferred === "boolean" ||
        typeof qAny.resolved === "boolean" ||
        typeof qAny.to_ref_kind === "string" ||
        typeof qAny.to_ref_file === "string" ||
        typeof qAny.to_ref_symbol === "string" ||
        typeof qAny.to_ref_name === "string" ||
        typeof (qAny as any).from_ref_kind === "string" ||
        typeof (qAny as any).from_ref_file === "string" ||
        typeof (qAny as any).from_ref_symbol === "string" ||
        typeof (qAny as any).from_ref_name === "string" ||
        typeof qAny.siteHash === "string" ||
        typeArr.some((t: any) => isCodeRelationship(t));
      if (qAny.active == null && looksLikeCode) {
        whereClause.push("coalesce(r.active, true) = true");
      }
    } catch {}

    const fullQuery = `
      ${matchClause}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN r, a.id as fromId, b.id as toId
      ${query.offset ? "SKIP $offset" : ""}
      ${query.limit ? "LIMIT $limit" : ""}
    `;

    if (query.limit) params.limit = query.limit;
    if (query.offset) params.offset = query.offset;

    const result = await this.graphDbQuery(fullQuery, params);
    return result.map((row: any) => this.parseRelationshipFromGraph(row));
  }

  /**
   * Finalize a scan by deactivating code edges not observed during this scan window.
   * Edges with lastSeenAt < scanStartedAt are set active=false. When history is enabled,
   * also set validTo for those edges if not already closed.
   */
  async finalizeScan(scanStartedAt: Date): Promise<{ deactivated: number }> {
    const cutoff = scanStartedAt.toISOString();
    let deactivated = 0;
    try {
      const res = await this.graphDbQuery(
        `MATCH ()-[r]-()
         WHERE r.lastSeenAt < $cutoff AND coalesce(r.active, true) = true
         WITH collect(r) AS rs
         FOREACH (x IN rs | SET x.active = false)
         RETURN size(rs) AS count`,
        { cutoff }
      );
      deactivated = res?.[0]?.count || 0;
    } catch {}

    // Best-effort: proactively retire unresolved external placeholders that haven't been seen since cutoff
    try {
      const res2 = await this.graphDbQuery(
        `MATCH ()-[r]-()
         WHERE coalesce(r.active, true) = true AND r.to_ref_kind = 'external'
           AND coalesce(r.lastSeenAt, r.created) < $cutoff
         WITH collect(r) AS rs
         FOREACH (x IN rs | SET x.active = false)
         RETURN size(rs) AS count`,
        { cutoff }
      );
      deactivated += res2?.[0]?.count || 0;
    } catch {}

    // If temporal history is enabled, set validTo for edges that transitioned inactive
    try {
      if (this.isHistoryEnabled()) {
        await this.graphDbQuery(
          `MATCH ()-[r]-()
           WHERE r.lastSeenAt < $cutoff AND coalesce(r.active, false) = false AND r.validFrom IS NOT NULL AND r.validTo IS NULL
           SET r.validTo = $cutoff`,
          { cutoff }
        );
      }
    } catch {}
    return { deactivated };
  }

  async queryRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.getRelationships(query);
  }

  // Retrieve a single relationship by ID
  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    const resolvedId = this.resolveRelationshipIdInput(relationshipId);
    const candidateIds = this.relationshipIdCandidates(
      resolvedId,
      relationshipId
    );
    const query = `
      MATCH (a)-[r]->(b)
      WHERE r.id IN $ids
      RETURN r, a.id as fromId, b.id as toId
      LIMIT 1
    `;

    const result = await this.graphDbQuery(query, { ids: candidateIds });
    if (!result || result.length === 0) return null;

    const relationship = this.parseRelationshipFromGraph(result[0]);
    return {
      ...relationship,
      fromEntityId: result[0].fromId,
      toEntityId: result[0].toId,
      id: this.namespaceScope.applyRelationshipPrefix(relationship.id),
    } as GraphRelationship;
  }

  canonicalizeRelationship(
    relationship: GraphRelationship
  ): GraphRelationship {
    const normalized = { ...(relationship as any) } as GraphRelationship;

    if (!normalized.fromEntityId || !normalized.toEntityId || !normalized.type) {
      return normalized;
    }

    try {
      normalized.fromEntityId = this.resolveEntityIdInput(
        normalized.fromEntityId
      );
      normalized.toEntityId = this.resolveEntityIdInput(normalized.toEntityId);
    } catch {
      return normalized;
    }

    const canonicalId = canonicalRelationshipId(
      normalized.fromEntityId,
      normalized
    );
    normalized.id = this.namespaceScope.applyRelationshipPrefix(canonicalId);

    return normalized;
  }

  /**
   * Create many relationships in one round-trip per relationship type.
   * Validation is optional (defaults to false for performance in sync paths).
   */
  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: { validate?: boolean }
  ): Promise<void> {
    if (!relationships || relationships.length === 0) return;

    const validate = options?.validate === true;

    const historyEnabled = this.isHistoryEnabled();
    const normalizedRelationships = relationships.map((rel) =>
      this.normalizeRelationship(rel)
    );
    const filteredRelationships: GraphRelationship[] = [];
    for (const rel of normalizedRelationships) {
      const top: any = rel as any;
      if (
        top.inferred &&
        typeof top.confidence === "number" &&
        top.confidence < noiseConfig.MIN_INFERRED_CONFIDENCE
      ) {
        continue;
      }
      if (top.resolved && typeof top.confidence !== "number") {
        top.confidence = 1.0;
      }
      if (top.firstSeenAt == null) top.firstSeenAt = top.created || new Date();
      if (top.lastSeenAt == null)
        top.lastSeenAt = top.lastModified || new Date();
      if (historyEnabled) {
        if (top.validFrom == null) top.validFrom = top.firstSeenAt;
        if (top.active == null) top.active = true;
      }
      filteredRelationships.push(rel);
    }

    if (filteredRelationships.length === 0) return;

    // Group by relationship type since Cypher relationship type is not parameterizable
    const byType = new Map<string, GraphRelationship[]>();
    for (const r of filteredRelationships) {
      if (!r.type || !r.fromEntityId || !r.toEntityId) continue;
      const list = byType.get(r.type) || [];
      list.push(r);
      byType.set(r.type, list);
    }

    for (const [type, relList] of byType.entries()) {
      let listEff = relList;
      // Optionally validate node existence in bulk (lightweight)
      if (validate) {
        const ids = Array.from(
          new Set(listEff.flatMap((r) => [r.fromEntityId, r.toEntityId]))
        );
        const result = await this.graphDbQuery(
          `UNWIND $ids AS id MATCH (n {id: id}) RETURN collect(n.id) as present`,
          { ids }
        );
        const present: string[] = result?.[0]?.present || [];
        const presentSet = new Set(present);
        listEff = listEff.filter(
          (r) => presentSet.has(r.fromEntityId) && presentSet.has(r.toEntityId)
        );
        if (listEff.length === 0) continue;
      }

      // Best-effort: backfill to_ref_* scalars for resolved targets using the entity's path/name (bulk)
      try {
        const candidates: string[] = [];
        for (const r of listEff) {
          const anyR: any = r as any;
          if (!isCodeRelationship(r.type as any)) continue;
          const missing = !(
            typeof anyR.to_ref_file === "string" &&
            typeof anyR.to_ref_symbol === "string"
          );
          if (missing && typeof r.toEntityId === "string")
            candidates.push(r.toEntityId);
        }
        const uniq = Array.from(new Set(candidates));
        if (uniq.length > 0) {
          const rows = await this.graphDbQuery(
            `UNWIND $ids AS id MATCH (n {id: id}) RETURN n.id as id, n.path as path, n.name as name`,
            { ids: uniq }
          );
          const toMap = new Map<string, { fileRel?: string; name?: string }>();
          for (const row of rows || []) {
            const id = row.id as string;
            const p = row.path as string | null;
            const name = row.name as string | null;
            if (id && p && name) {
              const fileRel = p.includes(":") ? p.split(":")[0] : p;
              toMap.set(id, { fileRel, name });
            }
          }
          for (const r of listEff) {
            const anyR: any = r as any;
            if (!isCodeRelationship(r.type as any)) continue;
            const missing = !(
              typeof anyR.to_ref_file === "string" &&
              typeof anyR.to_ref_symbol === "string"
            );
            if (!missing) continue;
            const hit = toMap.get(r.toEntityId);
            if (hit && hit.fileRel && hit.name) {
              anyR.to_ref_kind = "fileSymbol";
              anyR.to_ref_file = hit.fileRel;
              anyR.to_ref_symbol = hit.name;
              anyR.to_ref_name = anyR.to_ref_name || hit.name;
              if (!anyR.toRef)
                anyR.toRef = {
                  kind: "fileSymbol",
                  file: hit.fileRel,
                  symbol: hit.name,
                  name: hit.name,
                };
            }
          }
        }
      } catch {}

      // Map each relationship to a normalized row, then pre-dedupe by id merging counts/evidence
      const rowsRaw = listEff.map((r) => {
        const top: any = r as any;
        const mdIn: any = top.metadata || {};
        // Carry top-level evidence/locations into metadata for persistence
        const evTop = Array.isArray(top.evidence) ? top.evidence : [];
        const locTop = Array.isArray(top.locations) ? top.locations : [];
        const md: any = { ...mdIn };
        if (top.fromRef && md.fromRef == null) md.fromRef = top.fromRef;
        if (top.toRef && md.toRef == null) md.toRef = top.toRef;
        if (evTop.length > 0 || Array.isArray(md.evidence)) {
          const evOld = Array.isArray(md.evidence) ? md.evidence : [];
          md.evidence = [...evOld, ...evTop].slice(0, 20);
        }
        if (locTop.length > 0 || Array.isArray(md.locations)) {
          const locOld = Array.isArray(md.locations) ? md.locations : [];
          md.locations = [...locOld, ...locTop].slice(0, 20);
        }
        // Normalize/hoist fields similar to single create
        const normalizeSource = (s?: string) => {
          if (!s) return undefined;
          if (s === "call-typecheck") return "type-checker";
          if (s === "ts" || s === "checker" || s === "tc")
            return "type-checker";
          if (s === "ts-ast") return "ast";
          if (s === "heuristic" || s === "inferred") return "heuristic";
          return s as any;
        };
        let source =
          typeof top.source === "string"
            ? top.source
            : typeof md.source === "string"
            ? md.source
            : undefined;
        source = normalizeSource(source);
        let confidence =
          typeof top.confidence === "number"
            ? top.confidence
            : typeof md.confidence === "number"
            ? md.confidence
            : undefined;
        const resolved =
          typeof top.resolved === "boolean"
            ? top.resolved
            : typeof md.resolved === "boolean"
            ? md.resolved
            : false;
        if (resolved && typeof confidence !== "number") confidence = 1.0;
        if (typeof confidence === "number") {
          confidence = Math.max(0, Math.min(1, confidence));
        }
        const occurrencesScan =
          typeof top.occurrencesScan === "number"
            ? top.occurrencesScan
            : typeof md.occurrencesScan === "number"
            ? md.occurrencesScan
            : undefined;
        const context =
          typeof top.context === "string"
            ? top.context
            : typeof md.path === "string" && typeof md.line === "number"
            ? `${md.path}:${md.line}`
            : undefined;
        // evidence/locations/site sampling
        const evidence = JSON.stringify(
          Array.isArray(top.evidence)
            ? top.evidence
            : Array.isArray(md.evidence)
            ? md.evidence
            : []
        ).slice(0, 200000);
        const locations = JSON.stringify(
          Array.isArray(top.locations)
            ? top.locations
            : Array.isArray(md.locations)
            ? md.locations
            : []
        ).slice(0, 200000);
        const siteId =
          typeof top.siteId === "string"
            ? top.siteId
            : typeof md.siteId === "string"
            ? md.siteId
            : null;
        const sites = JSON.stringify(
          Array.isArray(top.sites)
            ? top.sites
            : Array.isArray(md.sites)
            ? md.sites
            : []
        ).slice(0, 200000);
        const why =
          typeof top.why === "string"
            ? top.why
            : typeof md.why === "string"
            ? md.why
            : null;
        const isPerfRelationship = isPerformanceRelationshipType(
          r.type as RelationshipType
        );
        const pickString = (value: unknown, limit?: number): string | null => {
          if (typeof value !== "string") return null;
          const trimmed = value.trim();
          if (!trimmed) return null;
          return typeof limit === "number" && limit > 0
            ? trimmed.slice(0, limit)
            : trimmed;
        };
        const toFiniteNumber = (value: unknown): number | null => {
          if (typeof value === "number" && Number.isFinite(value)) return value;
          if (typeof value === "string" && value.trim() !== "") {
            const num = Number(value);
            if (Number.isFinite(num)) return num;
          }
          return null;
        };
        const metricIdEff = isPerfRelationship
          ? pickString(top.metricId ?? md.metricId ?? null)
          : null;
        const scenarioEff = isPerfRelationship
          ? pickString(top.scenario ?? md.scenario ?? null)
          : null;
        const environmentEff = isPerfRelationship
          ? pickString(top.environment ?? md.environment ?? null)
          : null;
        const unitEff = isPerfRelationship
          ? pickString(top.unit ?? md.unit ?? null, 32)
          : null;
        const baselineEff = isPerfRelationship
          ? toFiniteNumber(top.baselineValue ?? md.baselineValue)
          : null;
        const currentEff = isPerfRelationship
          ? toFiniteNumber(top.currentValue ?? md.currentValue)
          : null;
        const deltaEff = isPerfRelationship
          ? toFiniteNumber(top.delta ?? md.delta)
          : null;
        const percentEff = isPerfRelationship
          ? toFiniteNumber(top.percentChange ?? md.percentChange)
          : null;
        const sampleSizeEff = isPerfRelationship
          ? toFiniteNumber(top.sampleSize ?? md.sampleSize)
          : null;
        const rawConfidence = isPerfRelationship
          ? top.confidenceInterval ?? md.confidenceInterval
          : null;
        const confidenceIntervalEff = (() => {
          if (!rawConfidence || typeof rawConfidence !== "object") return null;
          const lower = toFiniteNumber((rawConfidence as any).lower);
          const upper = toFiniteNumber((rawConfidence as any).upper);
          if (lower == null && upper == null) return null;
          return {
            ...(lower != null ? { lower } : {}),
            ...(upper != null ? { upper } : {}),
          };
        })();
        const trendEff = isPerfRelationship
          ? pickString(top.trend ?? md.trend ?? null)
          : null;
        const severityEff = isPerfRelationship
          ? pickString(top.severity ?? md.severity ?? null)
          : null;
        const riskScoreEff = isPerfRelationship
          ? toFiniteNumber(top.riskScore ?? md.riskScore)
          : null;
        const runIdEff = isPerfRelationship
          ? pickString(top.runId ?? md.runId ?? null)
          : null;
        const policyIdEff = isPerfRelationship
          ? pickString(top.policyId ?? md.policyId ?? null)
          : null;
        const detectedAtEff = isPerfRelationship
          ? toISO(top.detectedAt ?? md.detectedAt)
          : null;
        const resolvedAtCandidate = isPerfRelationship
          ? Object.prototype.hasOwnProperty.call(top, "resolvedAt")
            ? top.resolvedAt
            : Object.prototype.hasOwnProperty.call(md, "resolvedAt")
            ? md.resolvedAt
            : undefined
          : undefined;
        const resolvedAtEff =
          resolvedAtCandidate === undefined
            ? null
            : resolvedAtCandidate === null
            ? null
            : toISO(resolvedAtCandidate);
        const resolvedAtIsSet = resolvedAtCandidate !== undefined;
        const metricsHistoryArray = (() => {
          if (!isPerfRelationship) return null;
          if (Array.isArray(top.metricsHistory)) return top.metricsHistory;
          if (Array.isArray(md.metricsHistory)) return md.metricsHistory;
          return null;
        })();
        const metricsHistoryEff = (() => {
          if (!metricsHistoryArray || metricsHistoryArray.length === 0) return null;
          return JSON.stringify(
            metricsHistoryArray.map((entry: any) => ({
              ...entry,
              timestamp: toISO(entry?.timestamp ?? entry?.time ?? entry?.recordedAt),
            }))
          ).slice(0, 200000);
        })();
        const metricsEff = (() => {
          if (!isPerfRelationship) return null;
          const arr = Array.isArray(md.metrics) ? md.metrics : [];
          if (arr.length === 0) return null;
          return JSON.stringify(arr).slice(0, 200000);
        })();
        const createdISO = (
          r.created instanceof Date ? r.created : new Date(r.created as any)
        ).toISOString();
        const lastISO = (
          r.lastModified instanceof Date
            ? r.lastModified
            : new Date(r.lastModified as any)
        ).toISOString();
        // Canonical id by final from/to/type (fallback if not provided by upstream)
        const toISO = (value: any): string | null => {
          if (value === null) return null;
          if (value === undefined) return null;
          if (value instanceof Date) return value.toISOString();
          if (typeof value === "string") {
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
          }
          return null;
        };
        const canonicalBaseId =
          canonicalRelationshipId(r.fromEntityId, r as GraphRelationship) ??
          "";
        const id = this.namespaceScope.applyRelationshipPrefix(canonicalBaseId);
        top.id = id;
        const legacyBaseId = legacyStructuralRelationshipId(
          canonicalBaseId,
          r as GraphRelationship
        );
        const legacyId =
          legacyBaseId && legacyBaseId !== canonicalBaseId
            ? this.namespaceScope.applyRelationshipPrefix(legacyBaseId)
            : null;
        const updatedFromDocAtISO = toISO(
          top.updatedFromDocAt ?? md.updatedFromDocAt
        );
        const lastValidatedISO = toISO(top.lastValidated ?? md.lastValidated);
        const effectiveFromISO = toISO(top.effectiveFrom ?? md.effectiveFrom);
        const expiresAtProvidedTop = Object.prototype.hasOwnProperty.call(
          top,
          "expiresAt"
        );
        const expiresAtProvidedMeta = Object.prototype.hasOwnProperty.call(
          md,
          "expiresAt"
        );
        const expiresAtRaw = expiresAtProvidedTop
          ? top.expiresAt
          : expiresAtProvidedMeta
          ? md.expiresAt
          : undefined;
        const expiresAtIsSet = expiresAtProvidedTop || expiresAtProvidedMeta;
        const expiresAtISO = expiresAtRaw === null ? null : toISO(expiresAtRaw);
        const structuralProps = extractStructuralPersistenceFields(top, md);
        const scopeValue =
          typeof top.scope === "string"
            ? top.scope
            : typeof md.scope === "string"
            ? md.scope
            : structuralProps.scope;
        const firstSeenAtISO =
          toISO(
            (top as any).firstSeenAt ??
              structuralProps.firstSeenAt ??
              md.firstSeenAt ??
              createdISO
          ) ?? createdISO;
        const lastSeenAtISO =
          toISO(
            (top as any).lastSeenAt ??
              structuralProps.lastSeenAt ??
              md.lastSeenAt ??
              lastISO
          ) ?? lastISO;
        return {
          fromId: r.fromEntityId,
          toId: r.toEntityId,
          id,
          created: createdISO,
          lastModified: lastISO,
          version: r.version,
          metadata: JSON.stringify(md),
          // Note: above uses r.metadata; we instead want to persist our merged md
          // (FalkorDB query below uses row.metadata directly)
          occurrencesScan: occurrencesScan ?? null,
          confidence: typeof confidence === "number" ? confidence : null,
          inferred:
            typeof top.inferred === "boolean"
              ? top.inferred
              : typeof md.inferred === "boolean"
              ? md.inferred
              : null,
          resolved:
            typeof top.resolved === "boolean"
              ? top.resolved
              : typeof md.resolved === "boolean"
              ? md.resolved
              : null,
          source: source ?? null,
          context: context ?? null,
          // Extra code-edge fields
          kind:
            typeof top.kind === "string"
              ? top.kind
              : typeof md.kind === "string"
              ? md.kind
              : null,
          resolution:
            typeof top.resolution === "string"
              ? top.resolution
              : typeof md.resolution === "string"
              ? md.resolution
              : null,
          scope: scopeValue,
          arity:
            typeof top.arity === "number"
              ? top.arity
              : typeof md.arity === "number"
              ? md.arity
              : null,
          awaited:
            typeof top.awaited === "boolean"
              ? top.awaited
              : typeof md.awaited === "boolean"
              ? md.awaited
              : null,
          operator:
            typeof top.operator === "string"
              ? top.operator
              : typeof md.operator === "string"
              ? md.operator
              : null,
          importDepth: structuralProps.importDepth,
          usedTypeChecker:
            typeof top.usedTypeChecker === "boolean"
              ? top.usedTypeChecker
              : typeof md.usedTypeChecker === "boolean"
              ? md.usedTypeChecker
              : null,
          isExported:
            typeof top.isExported === "boolean"
              ? top.isExported
              : typeof md.isExported === "boolean"
              ? md.isExported
              : null,
          accessPath:
            typeof top.accessPath === "string"
              ? top.accessPath
              : typeof md.accessPath === "string"
              ? md.accessPath
              : null,
          callee:
            typeof top.callee === "string"
              ? top.callee
              : typeof md.callee === "string"
              ? md.callee
              : null,
          paramName:
            typeof top.paramName === "string"
              ? top.paramName
              : typeof md.param === "string"
              ? md.param
              : null,
          importAlias: structuralProps.importAlias,
          importType: structuralProps.importType,
          isNamespace: structuralProps.isNamespace,
          isReExport: structuralProps.isReExport,
          reExportTarget: structuralProps.reExportTarget,
          language: structuralProps.language,
          symbolKind: structuralProps.symbolKind,
          modulePath: structuralProps.modulePath,
          resolutionState: structuralProps.resolutionState,
          receiverType:
            typeof top.receiverType === "string"
              ? top.receiverType
              : typeof md.receiverType === "string"
              ? md.receiverType
              : null,
          dynamicDispatch:
            typeof top.dynamicDispatch === "boolean"
              ? top.dynamicDispatch
              : typeof md.dynamicDispatch === "boolean"
              ? md.dynamicDispatch
              : null,
          overloadIndex:
            typeof top.overloadIndex === "number"
              ? top.overloadIndex
              : typeof md.overloadIndex === "number"
              ? md.overloadIndex
              : null,
          genericArguments: JSON.stringify(
            Array.isArray(top.genericArguments)
              ? top.genericArguments
              : Array.isArray(md.genericArguments)
              ? md.genericArguments
              : []
          ).slice(0, 200000),
          siteHash: typeof top.siteHash === "string" ? top.siteHash : null,
          dataFlowId:
            typeof (top as any).dataFlowId === "string"
              ? (top as any).dataFlowId
              : typeof md.dataFlowId === "string"
              ? md.dataFlowId
              : null,
          to_ref_kind:
            typeof top.to_ref_kind === "string" ? top.to_ref_kind : null,
          to_ref_file:
            typeof top.to_ref_file === "string" ? top.to_ref_file : null,
          to_ref_symbol:
            typeof top.to_ref_symbol === "string" ? top.to_ref_symbol : null,
          to_ref_name:
            typeof top.to_ref_name === "string" ? top.to_ref_name : null,
          from_ref_kind:
            typeof (top as any).from_ref_kind === "string"
              ? (top as any).from_ref_kind
              : null,
          from_ref_file:
            typeof (top as any).from_ref_file === "string"
              ? (top as any).from_ref_file
              : null,
          from_ref_symbol:
            typeof (top as any).from_ref_symbol === "string"
              ? (top as any).from_ref_symbol
              : null,
          from_ref_name:
            typeof (top as any).from_ref_name === "string"
              ? (top as any).from_ref_name
              : null,
          ambiguous:
            typeof top.ambiguous === "boolean"
              ? top.ambiguous
              : typeof md.ambiguous === "boolean"
              ? md.ambiguous
              : null,
          candidateCount:
            typeof top.candidateCount === "number"
              ? top.candidateCount
              : typeof md.candidateCount === "number"
              ? md.candidateCount
              : null,
          isMethod: typeof top.isMethod === "boolean" ? top.isMethod : null,
          firstSeenAt: firstSeenAtISO,
          lastSeenAt: lastSeenAtISO,
          legacyId,
          loc_path: (top.location && top.location.path) ?? md.path ?? null,
          loc_line:
            top.location && typeof top.location.line === "number"
              ? top.location.line
              : typeof md.line === "number"
              ? md.line
              : null,
          loc_col:
            top.location && typeof top.location.column === "number"
              ? top.location.column
              : typeof md.column === "number"
              ? md.column
              : null,
          evidence,
          locations,
          siteId,
          sites,
          why,
          sectionAnchor:
            typeof top.sectionAnchor === "string"
              ? top.sectionAnchor
              : typeof md.sectionAnchor === "string"
              ? md.sectionAnchor
              : null,
          sectionTitle:
            typeof top.sectionTitle === "string"
              ? top.sectionTitle
              : typeof md.sectionTitle === "string"
              ? md.sectionTitle
              : null,
          summary:
            typeof top.summary === "string"
              ? top.summary
              : typeof md.summary === "string"
              ? md.summary
              : null,
          docVersion:
            typeof top.docVersion === "string"
              ? top.docVersion
              : typeof md.docVersion === "string"
              ? md.docVersion
              : null,
          docHash:
            typeof top.docHash === "string"
              ? top.docHash
              : typeof md.docHash === "string"
              ? md.docHash
              : null,
          documentationQuality:
            typeof top.documentationQuality === "string"
              ? top.documentationQuality
              : typeof md.documentationQuality === "string"
              ? md.documentationQuality
              : null,
          coverageScope:
            typeof top.coverageScope === "string"
              ? top.coverageScope
              : typeof md.coverageScope === "string"
              ? md.coverageScope
              : null,
          domainPath:
            typeof top.domainPath === "string"
              ? top.domainPath
              : typeof md.domainPath === "string"
              ? md.domainPath
              : null,
          taxonomyVersion:
            typeof top.taxonomyVersion === "string"
              ? top.taxonomyVersion
              : typeof md.taxonomyVersion === "string"
              ? md.taxonomyVersion
              : null,
          updatedFromDocAt: updatedFromDocAtISO,
          lastValidated: lastValidatedISO,
          strength:
            typeof top.strength === "number"
              ? top.strength
              : typeof md.strength === "number"
              ? md.strength
              : null,
          similarityScore:
            typeof top.similarityScore === "number"
              ? top.similarityScore
              : typeof md.similarityScore === "number"
              ? md.similarityScore
              : null,
          clusterVersion:
            typeof top.clusterVersion === "string"
              ? top.clusterVersion
              : typeof md.clusterVersion === "string"
              ? md.clusterVersion
              : null,
          role:
            typeof top.role === "string"
              ? top.role
              : typeof md.role === "string"
              ? md.role
              : null,
          docIntent:
            typeof top.docIntent === "string"
              ? top.docIntent
              : typeof md.docIntent === "string"
              ? md.docIntent
              : null,
          embeddingVersion:
            typeof top.embeddingVersion === "string"
              ? top.embeddingVersion
              : typeof md.embeddingVersion === "string"
              ? md.embeddingVersion
              : null,
          policyType:
            typeof top.policyType === "string"
              ? top.policyType
              : typeof md.policyType === "string"
              ? md.policyType
              : null,
          effectiveFrom: effectiveFromISO,
          expiresAt: expiresAtISO,
          expiresAt_is_set: expiresAtIsSet,
          relationshipType:
            typeof top.relationshipType === "string"
              ? top.relationshipType
              : typeof md.relationshipType === "string"
              ? md.relationshipType
              : null,
          docLocale:
            typeof top.docLocale === "string"
              ? top.docLocale
              : typeof md.docLocale === "string"
              ? md.docLocale
              : null,
          tags: Array.isArray(top.tags)
            ? top.tags
            : Array.isArray(md.tags)
            ? md.tags
            : null,
          stakeholders: Array.isArray(top.stakeholders)
            ? top.stakeholders
            : Array.isArray(md.stakeholders)
            ? md.stakeholders
            : null,
          metricId: metricIdEff,
          scenario: scenarioEff,
          environment: environmentEff,
          unit: unitEff,
          baselineValue: baselineEff,
          currentValue: currentEff,
          delta: deltaEff,
          percentChange: percentEff,
          sampleSize: sampleSizeEff,
          confidenceInterval: confidenceIntervalEff,
          trend: trendEff,
          severity: severityEff,
          riskScore: riskScoreEff,
          runId: runIdEff,
          policyId: policyIdEff,
          detectedAt: detectedAtEff,
          resolvedAt: resolvedAtEff,
          resolvedAt_is_set: resolvedAtIsSet,
          metricsHistory: metricsHistoryEff,
          metrics: metricsEff,
        };
      });

      // Pre-dedupe rows by id: merge occurrencesScan (sum), and merge evidence/locations/sites/context conservatively
      const toMillis = (value: unknown): number | null => {
        if (value instanceof Date) {
          const ts = value.getTime();
          return Number.isNaN(ts) ? null : ts;
        }
        if (typeof value === "string") {
          const ts = Date.parse(value);
          return Number.isNaN(ts) ? null : ts;
        }
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        return null;
      };
      const computeFreshnessScore = (candidate: Record<string, any>): number => {
        if (!candidate || typeof candidate !== "object") return 0;
        const sources = [
          candidate.lastModified,
          candidate.lastSeenAt,
          candidate.updatedFromDocAt,
          candidate.lastValidated,
          candidate.detectedAt,
          candidate.resolvedAt,
          candidate.created,
          candidate.firstSeenAt,
        ];
        let freshest = Number.NEGATIVE_INFINITY;
        for (const source of sources) {
          const ts = toMillis(source);
          if (ts !== null && ts > freshest) freshest = ts;
        }
        return freshest === Number.NEGATIVE_INFINITY ? 0 : freshest;
      };
      const mergeArrJson = (
        a: string | null,
        b: string | null,
        limit: number,
        keyFn?: (x: any) => string
      ) => {
        try {
          const arrA: any[] = a ? JSON.parse(a) : [];
          const arrB: any[] = b ? JSON.parse(b) : [];
          const raw = [...arrA, ...arrB].filter(Boolean);
          if (!keyFn) return JSON.stringify(raw.slice(0, limit));
          const seen = new Set<string>();
          const out: any[] = [];
          for (const it of raw) {
            const k = keyFn(it);
            if (!seen.has(k)) {
              seen.add(k);
              out.push(it);
            }
            if (out.length >= limit) break;
          }
          return JSON.stringify(out);
        } catch {
          return a || b || null;
        }
      };
      const dedup = new Map<string, any>();
      for (const row of rowsRaw) {
        const prev = dedup.get(row.id);
        if (!prev) {
          (row as any).__freshness = computeFreshnessScore(row);
          dedup.set(row.id, row);
          continue;
        }
        const prevFreshness =
          typeof (prev as any).__freshness === "number"
            ? (prev as any).__freshness
            : computeFreshnessScore(prev);
        const rowFreshness = computeFreshnessScore(row);
        const rowIsFresher = rowFreshness > prevFreshness;
        // Merge counts
        const occA =
          typeof prev.occurrencesScan === "number" ? prev.occurrencesScan : 0;
        const occB =
          typeof row.occurrencesScan === "number" ? row.occurrencesScan : 0;
        prev.occurrencesScan = occA + occB;
        // Keep earliest created, latest lastModified/lastSeenAt
        try {
          if (new Date(row.created) < new Date(prev.created))
            prev.created = row.created;
        } catch {}
        try {
          if (new Date(row.lastModified) > new Date(prev.lastModified))
            prev.lastModified = row.lastModified;
        } catch {}
        try {
          if (
            row.lastSeenAt &&
            (!prev.lastSeenAt || new Date(row.lastSeenAt) > new Date(prev.lastSeenAt))
          ) {
            prev.lastSeenAt = row.lastSeenAt;
          }
        } catch {}
        // Merge context (keep earliest line; prefer existing if set)
        if (!prev.context && row.context) prev.context = row.context;
        // Merge evidence/locations/sites with dedupe and bounds
        prev.evidence = mergeArrJson(
          prev.evidence,
          row.evidence,
          20,
          (e) =>
            `${e.source || ""}|${e.location?.path || ""}|${
              e.location?.line || ""
            }|${e.location?.column || ""}`
        );
        prev.locations = mergeArrJson(
          prev.locations,
          row.locations,
          20,
          (l) => `${l.path || ""}|${l.line || ""}|${l.column || ""}`
        );
        prev.sites = mergeArrJson(prev.sites, row.sites, 20, (s) => String(s));
        // Preserve stronger confidence
        if (typeof row.confidence === "number")
          prev.confidence = Math.max(prev.confidence ?? 0, row.confidence);
        if (row.dataFlowId) {
          if (rowIsFresher || !prev.dataFlowId) {
            prev.dataFlowId = row.dataFlowId;
          }
        }
        if (row.resolved === true) {
          prev.resolved = true;
        } else if (row.resolved === false && rowIsFresher) {
          prev.resolved = false;
        } else if (prev.resolved == null && row.resolved != null) {
          prev.resolved = row.resolved;
        }
        // Combine candidate count
        if (typeof row.candidateCount === "number") {
          const a = prev.candidateCount ?? 0;
          const b = row.candidateCount ?? 0;
          prev.candidateCount = Math.max(a, b);
        }
        if (typeof row.strength === "number") {
          if (typeof prev.strength === "number") {
            prev.strength = Math.max(prev.strength, row.strength);
          } else {
            prev.strength = row.strength;
          }
        }
        if (typeof row.similarityScore === "number") {
          if (typeof prev.similarityScore === "number") {
            prev.similarityScore = Math.max(
              prev.similarityScore,
              row.similarityScore
            );
          } else {
            prev.similarityScore = row.similarityScore;
          }
        }
        const updateIfFresher = (field: string) => {
          const incoming = (row as any)[field];
          if (incoming === undefined || incoming === null) return;
          const prevValue = (prev as any)[field];
          if (rowIsFresher || prevValue === undefined || prevValue === null) {
            (prev as any)[field] = incoming;
          }
        };
        updateIfFresher("importAlias");
        updateIfFresher("importType");
        updateIfFresher("reExportTarget");
        updateIfFresher("language");
        updateIfFresher("symbolKind");
        updateIfFresher("modulePath");
        updateIfFresher("resolutionState");
        updateIfFresher("scope");
        if (typeof row.importDepth === "number") {
          if (
            rowIsFresher ||
            typeof (prev as any).importDepth !== "number"
          ) {
            (prev as any).importDepth = row.importDepth;
          }
        }
        const mergeBooleanField = (field: "isNamespace" | "isReExport") => {
          const rowVal = (row as any)[field];
          if (rowVal === true) {
            (prev as any)[field] = true;
            return;
          }
          if (rowVal === false) {
            if (rowIsFresher || (prev as any)[field] == null) {
              (prev as any)[field] = false;
            }
          }
        };
        mergeBooleanField("isNamespace");
        mergeBooleanField("isReExport");
        updateIfFresher("sectionAnchor");
        updateIfFresher("sectionTitle");
        updateIfFresher("summary");
        updateIfFresher("docVersion");
        updateIfFresher("docHash");
        updateIfFresher("documentationQuality");
        updateIfFresher("coverageScope");
        updateIfFresher("domainPath");
        updateIfFresher("taxonomyVersion");
        updateIfFresher("clusterVersion");
        updateIfFresher("role");
        updateIfFresher("docIntent");
        updateIfFresher("embeddingVersion");
        updateIfFresher("policyType");
        updateIfFresher("relationshipType");
        updateIfFresher("docLocale");
        if (
          row.updatedFromDocAt &&
          (!prev.updatedFromDocAt ||
            row.updatedFromDocAt > prev.updatedFromDocAt)
        ) {
          prev.updatedFromDocAt = row.updatedFromDocAt;
        }
        if (
          row.lastValidated &&
          (!prev.lastValidated || row.lastValidated > prev.lastValidated)
        ) {
          prev.lastValidated = row.lastValidated;
        }
        if (
          row.effectiveFrom &&
          (!prev.effectiveFrom || row.effectiveFrom < prev.effectiveFrom)
        ) {
          prev.effectiveFrom = row.effectiveFrom;
        }
        if (row.expiresAt_is_set) {
          prev.expiresAt_is_set = true;
          prev.expiresAt = row.expiresAt;
        }
        if (row.metricId) prev.metricId = row.metricId;
        if (row.scenario) prev.scenario = row.scenario;
        if (row.environment) prev.environment = row.environment;
        if (row.unit) prev.unit = row.unit;
        if (row.baselineValue != null) prev.baselineValue = row.baselineValue;
        if (row.currentValue != null) prev.currentValue = row.currentValue;
        if (row.delta != null) prev.delta = row.delta;
        if (row.percentChange != null) prev.percentChange = row.percentChange;
        if (row.sampleSize != null) prev.sampleSize = row.sampleSize;
        if (row.confidenceInterval) prev.confidenceInterval = row.confidenceInterval;
        if (row.trend) prev.trend = row.trend;
        if (row.severity) prev.severity = row.severity;
        if (row.riskScore != null) prev.riskScore = row.riskScore;
        if (row.runId) prev.runId = row.runId;
        if (row.policyId) prev.policyId = row.policyId;
        if (row.detectedAt) prev.detectedAt = row.detectedAt;
        if (row.resolvedAt_is_set) {
          prev.resolvedAt_is_set = true;
          prev.resolvedAt = row.resolvedAt;
        } else if (prev.resolvedAt_is_set !== true && row.resolvedAt === null) {
          prev.resolvedAt = row.resolvedAt;
        }
        if (row.metricsHistory) prev.metricsHistory = row.metricsHistory;
        if (row.metrics) prev.metrics = row.metrics;
        const mergeStringArray = (field: "tags" | "stakeholders") => {
          const rowArr = Array.isArray((row as any)[field])
            ? ((row as any)[field] as string[])
            : [];
          if (rowArr.length === 0) return;
          if (rowIsFresher) {
            (prev as any)[field] = Array.from(new Set(rowArr));
            return;
          }
          const prevArr = Array.isArray((prev as any)[field])
            ? ((prev as any)[field] as string[])
            : [];
          const merged = new Set<string>(prevArr);
          for (const item of rowArr) {
            merged.add(item);
          }
          (prev as any)[field] = Array.from(merged);
        };
        mergeStringArray("tags");
        mergeStringArray("stakeholders");
        if (rowIsFresher && typeof row.metadata === "string" && row.metadata) {
          prev.metadata = row.metadata;
        } else if (
          (prev.metadata == null || prev.metadata === "") &&
          typeof row.metadata === "string" &&
          row.metadata
        ) {
          prev.metadata = row.metadata;
        }
        (prev as any).__freshness = Math.max(prevFreshness, rowFreshness);
      }
      const rows = Array.from(dedup.values());

      // FalkorDB has issues with complex UNWIND parameters, so use individual queries
      // TODO: Optimize this later with better parameter handling
      for (const row of rows) {
        if ((row as any).__freshness !== undefined) {
          delete (row as any).__freshness;
        }
        if (typeof row.legacyId === "string" && row.legacyId !== row.id) {
          try {
            await this.graphDbQuery(
              `MATCH ()-[legacy:${type} { id: $legacyId }]->()
               SET legacy.id = $id`,
              { legacyId: row.legacyId, id: row.id }
            );
          } catch {}
        }
        const query = `
          // UNWIND $rows AS row
          MATCH (a {id: $fromId}), (b {id: $toId})
          MERGE (a)-[r:${type} { id: $id }]->(b)
          ON CREATE SET r.created = $created, r.version = $version
          SET r.lastModified = $lastModified,
              r.metadata = $metadata,
              r.occurrencesScan = $occurrencesScan,
              r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + coalesce($occurrencesScan, 0),
              r.confidence = $confidence,
              r.inferred = $inferred,
              r.resolved = $resolved,
              r.source = $source,
              r.context = $context,
              r.kind = $kind,
              r.resolution = $resolution,
              r.scope = $scope,
              r.arity = $arity,
              r.awaited = $awaited,
              r.operator = $operator,
              r.importDepth = $importDepth,
              r.usedTypeChecker = $usedTypeChecker,
              r.isExported = $isExported,
              r.accessPath = $accessPath,
              r.callee = $callee,
              r.paramName = $paramName,
              r.importAlias = $importAlias,
              r.importType = $importType,
              r.isNamespace = $isNamespace,
              r.isReExport = $isReExport,
              r.reExportTarget = $reExportTarget,
              r.language = $language,
              r.symbolKind = $symbolKind,
              r.modulePath = $modulePath,
              r.resolutionState = $resolutionState,
              r.receiverType = $receiverType,
              r.dynamicDispatch = $dynamicDispatch,
              r.overloadIndex = $overloadIndex,
              r.genericArguments = $genericArguments,
              r.siteHash = $siteHash,
              r.location_path = $loc_path,
              r.location_line = $loc_line,
              r.location_col = $loc_col,
              r.evidence = $evidence,
              r.locations = $locations,
              r.siteId = $siteId,
              r.sites = $sites,
              r.dataFlowId = $dataFlowId,
              r.why = $why,
              r.to_ref_kind = $to_ref_kind,
              r.to_ref_file = $to_ref_file,
              r.to_ref_symbol = $to_ref_symbol,
              r.to_ref_name = $to_ref_name,
              r.from_ref_kind = $from_ref_kind,
              r.from_ref_file = $from_ref_file,
              r.from_ref_symbol = $from_ref_symbol,
              r.from_ref_name = $from_ref_name,
              r.ambiguous = $ambiguous,
              r.candidateCount = $candidateCount,
              r.isMethod = $isMethod,
              r.active = true,
              r.firstSeenAt = coalesce(r.firstSeenAt, $firstSeenAt),
              r.lastSeenAt = $lastSeenAt,
              r.validFrom = coalesce(r.validFrom, $firstSeenAt),
              r.sectionAnchor = $sectionAnchor,
              r.sectionTitle = $sectionTitle,
              r.summary = $summary,
              r.docVersion = $docVersion,
              r.docHash = $docHash,
              r.documentationQuality = $documentationQuality,
              r.coverageScope = $coverageScope,
              r.domainPath = $domainPath,
              r.taxonomyVersion = $taxonomyVersion,
              r.updatedFromDocAt = $updatedFromDocAt,
              r.lastValidated = $lastValidated,
              r.strength = coalesce($strength, r.strength),
              r.similarityScore = coalesce($similarityScore, r.similarityScore),
              r.clusterVersion = coalesce($clusterVersion, r.clusterVersion),
              r.role = coalesce($role, r.role),
              r.docIntent = $docIntent,
          r.embeddingVersion = coalesce($embeddingVersion, r.embeddingVersion),
          r.policyType = coalesce($policyType, r.policyType),
          r.effectiveFrom = coalesce($effectiveFrom, r.effectiveFrom),
          r.expiresAt = CASE WHEN $expiresAt_is_set THEN $expiresAt ELSE r.expiresAt END,
          r.relationshipType = coalesce($relationshipType, r.relationshipType),
          r.docLocale = coalesce($docLocale, r.docLocale),
          r.tags = CASE WHEN $tags IS NULL THEN r.tags ELSE $tags END,
          r.stakeholders = CASE WHEN $stakeholders IS NULL THEN r.stakeholders ELSE $stakeholders END,
          r.metricId = $metricId,
          r.scenario = $scenario,
          r.environment = $environment,
          r.unit = $unit,
          r.baselineValue = $baselineValue,
          r.currentValue = $currentValue,
          r.delta = $delta,
          r.percentChange = $percentChange,
          r.sampleSize = $sampleSize,
          r.confidenceInterval = $confidenceInterval,
          r.trend = $trend,
          r.severity = $severity,
          r.riskScore = $riskScore,
          r.runId = $runId,
          r.policyId = coalesce($policyId, r.policyId),
          r.detectedAt = $detectedAt,
          r.resolvedAt = CASE WHEN $resolvedAt_is_set THEN $resolvedAt ELSE r.resolvedAt END,
          r.metricsHistory = $metricsHistory,
          r.metrics = $metrics
        `;

        // Use the same parameter mapping as single relationship creation
        const params = {
          fromId: row.fromId,
          toId: row.toId,
          id: row.id,
          created: row.created,
          lastModified: row.lastModified,
          version: row.version,
          metadata: row.metadata,
          occurrencesScan: row.occurrencesScan,
          confidence: row.confidence,
          inferred: row.inferred,
          resolved: row.resolved,
          source: row.source,
          context: row.context,
          kind: row.kind,
          resolution: row.resolution,
          scope: row.scope,
          arity: row.arity,
          awaited: row.awaited,
          operator: row.operator,
          importDepth: row.importDepth,
          usedTypeChecker: row.usedTypeChecker,
          isExported: row.isExported,
          accessPath: row.accessPath,
          callee: row.callee,
          paramName: row.paramName,
          importAlias: row.importAlias,
          importType: row.importType,
          isNamespace: row.isNamespace,
          isReExport: row.isReExport,
          reExportTarget: row.reExportTarget,
          language: row.language,
          symbolKind: row.symbolKind,
          modulePath: row.modulePath,
          resolutionState: row.resolutionState,
          receiverType: row.receiverType,
          dynamicDispatch: row.dynamicDispatch,
          overloadIndex: row.overloadIndex,
          genericArguments: row.genericArguments,
          siteHash: row.siteHash,
          loc_path: row.loc_path,
          loc_line: row.loc_line,
          loc_col: row.loc_col,
          evidence: row.evidence,
          locations: row.locations,
          siteId: row.siteId,
          sites: row.sites,
          dataFlowId: row.dataFlowId,
          why: row.why,
          to_ref_kind: row.to_ref_kind,
          to_ref_file: row.to_ref_file,
          to_ref_symbol: row.to_ref_symbol,
          to_ref_name: row.to_ref_name,
          from_ref_kind: row.from_ref_kind,
          from_ref_file: row.from_ref_file,
          from_ref_symbol: row.from_ref_symbol,
          from_ref_name: row.from_ref_name,
          ambiguous: row.ambiguous,
          candidateCount: row.candidateCount,
          isMethod: row.isMethod,
          firstSeenAt: row.firstSeenAt,
          lastSeenAt: row.lastSeenAt,
          sectionAnchor: row.sectionAnchor,
          sectionTitle: row.sectionTitle,
          summary: row.summary,
          docVersion: row.docVersion,
          docHash: row.docHash,
          documentationQuality: row.documentationQuality,
          coverageScope: row.coverageScope,
          domainPath: row.domainPath,
          taxonomyVersion: row.taxonomyVersion,
          updatedFromDocAt: row.updatedFromDocAt,
          lastValidated: row.lastValidated,
          strength: row.strength,
          similarityScore: row.similarityScore,
          clusterVersion: row.clusterVersion,
          role: row.role,
          docIntent: row.docIntent,
          embeddingVersion: row.embeddingVersion,
          policyType: row.policyType,
          effectiveFrom: row.effectiveFrom,
          expiresAt: row.expiresAt,
          expiresAt_is_set: row.expiresAt_is_set,
          relationshipType: row.relationshipType,
          docLocale: row.docLocale,
          tags: row.tags,
          stakeholders: row.stakeholders,
          metricId: row.metricId,
          scenario: row.scenario,
          environment: row.environment,
          unit: row.unit,
          baselineValue: row.baselineValue,
          currentValue: row.currentValue,
          delta: row.delta,
          percentChange: row.percentChange,
          sampleSize: row.sampleSize,
          confidenceInterval: row.confidenceInterval,
          trend: row.trend,
          severity: row.severity,
          riskScore: row.riskScore,
          runId: row.runId,
          policyId: row.policyId,
          detectedAt: row.detectedAt,
          resolvedAt: row.resolvedAt,
          resolvedAt_is_set: row.resolvedAt_is_set,
          metricsHistory: row.metricsHistory,
          metrics: row.metrics,
        };

        const debugRow = { ...params };
        params.rows = [debugRow];

        await this.graphDbQuery(query, params);
      }

      // Batched unification: only one unifier call per unique (fromId,type,file,symbol)
      try {
        await this.unifyResolvedEdgesBatch(
          rows.map((row: any) => ({
            id: row.id,
            fromId: row.fromId,
            toId: row.toId,
            type,
            to_ref_kind: row.to_ref_kind,
            to_ref_file: row.to_ref_file,
            to_ref_symbol: row.to_ref_symbol,
            to_ref_name: row.to_ref_name,
            created: row.created,
            lastModified: row.lastModified,
            version: row.version || 1,
          }))
        );
      } catch {}

      // Dual-write auxiliaries for each edge (best-effort)
      try {
        for (const row of rows) {
          const relObj: GraphRelationship = {
            id: row.id,
            fromEntityId: row.fromId,
            toEntityId: row.toId,
            type: type as any,
            created: new Date(row.created),
            lastModified: new Date(row.lastModified),
            version: row.version || 1,
          } as any;
          (relObj as any).to_ref_kind = row.to_ref_kind;
          (relObj as any).to_ref_file = row.to_ref_file;
          (relObj as any).to_ref_symbol = row.to_ref_symbol;
          (relObj as any).to_ref_name = row.to_ref_name;
          if (row.siteId) relObj.siteId = row.siteId;
          if (row.siteHash) relObj.siteHash = row.siteHash;
          if (typeof row.dataFlowId === "string" && row.dataFlowId)
            (relObj as any).dataFlowId = row.dataFlowId;
          try {
            const mdParsed = row.metadata
              ? JSON.parse(row.metadata)
              : undefined;
            if (mdParsed) relObj.metadata = mdParsed;
          } catch {}
          try {
            const evidenceParsed = row.evidence ? JSON.parse(row.evidence) : [];
            if (Array.isArray(evidenceParsed) && evidenceParsed.length > 0)
              relObj.evidence = evidenceParsed;
          } catch {}
          try {
            const locationsParsed = row.locations
              ? JSON.parse(row.locations)
              : [];
            if (Array.isArray(locationsParsed) && locationsParsed.length > 0)
              relObj.locations = locationsParsed;
          } catch {}
          try {
            const sitesParsed = row.sites ? JSON.parse(row.sites) : [];
            if (Array.isArray(sitesParsed) && sitesParsed.length > 0)
              relObj.sites = sitesParsed;
          } catch {}
          const loc: any = {};
          if (row.loc_path) loc.path = row.loc_path;
          if (typeof row.loc_line === "number") loc.line = row.loc_line;
          if (typeof row.loc_col === "number") loc.column = row.loc_col;
          if (Object.keys(loc).length > 0) {
            const existing = Array.isArray(relObj.locations)
              ? relObj.locations
              : [];
            relObj.locations = [...existing, loc];
          }
          try {
            await this.dualWriteAuxiliaryForEdge(relObj);
          } catch {}
        }
      } catch {}
    }

    if (!this._indexesEnsured) {
      this.bootstrapIndicesOnce().catch(() => undefined);
    }
  }

  // Phase 1+: grouped unifier to reduce duplicate scans per batch
  private async unifyResolvedEdgesBatch(
    rows: Array<{
      id: string;
      fromId: string;
      toId: string;
      type: string;
      to_ref_kind?: string;
      to_ref_file?: string;
      to_ref_symbol?: string;
      to_ref_name?: string;
      created?: string;
      lastModified?: string;
      version?: number;
    }>
  ): Promise<void> {
    const groups = new Map<string, { any: any }>();
    for (const r of rows) {
      const resolved =
        r.to_ref_kind === "entity" || String(r.toId || "").startsWith("sym:");
      const file = r.to_ref_file || "";
      const symbol = r.to_ref_symbol || "";
      if (!resolved || !file || !symbol) continue;
      const key = `${r.fromId}|${r.type}|${file}|${symbol}`;
      if (!groups.has(key)) groups.set(key, { any: r });
    }
    for (const { any } of groups.values()) {
      const relObj: GraphRelationship = {
        id: any.id,
        fromEntityId: any.fromId,
        toEntityId: any.toId,
        type: any.type as any,
        created: new Date(any.created || Date.now()),
        lastModified: new Date(any.lastModified || Date.now()),
        version: any.version || 1,
      } as any;
      (relObj as any).to_ref_kind = any.to_ref_kind;
      (relObj as any).to_ref_file = any.to_ref_file;
      (relObj as any).to_ref_symbol = any.to_ref_symbol;
      (relObj as any).to_ref_name = any.to_ref_name;
      await this.unifyResolvedEdgePlaceholders(relObj);
    }
  }

  // --- Read paths for auxiliary nodes (evidence, sites, candidates) ---
  async getEdgeEvidenceNodes(
    edgeId: string,
    limit: number = 200
  ): Promise<
    Array<{
      id: string;
      edgeId: string;
      source?: string;
      confidence?: number;
      path?: string;
      line?: number;
      column?: number;
      note?: string;
      extractorVersion?: string;
      createdAt?: string;
      updatedAt?: string;
    }>
  > {
    try {
      const rows = await this.graphDbQuery(
        `MATCH (n:edge_evidence) WHERE n.edgeId = $edgeId
         RETURN n.id AS id, n.edgeId AS edgeId, n.source AS source, n.confidence AS confidence,
                n.path AS path, n.line AS line, n.column AS column, n.note AS note,
                n.extractorVersion AS extractorVersion, n.createdAt AS createdAt, n.updatedAt AS updatedAt
         ORDER BY n.updatedAt DESC LIMIT $limit`,
        { edgeId, limit }
      );
      return (rows || []) as any;
    } catch {
      return [];
    }
  }

  async getEdgeSites(
    edgeId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      edgeId: string;
      siteId?: string;
      path?: string;
      line?: number;
      column?: number;
      accessPath?: string;
      updatedAt?: string;
    }>
  > {
    try {
      const rows = await this.graphDbQuery(
        `MATCH (s:edge_site) WHERE s.edgeId = $edgeId
         RETURN s.id AS id, s.edgeId AS edgeId, s.siteId AS siteId, s.path AS path, s.line AS line, s.column AS column, s.accessPath AS accessPath, s.updatedAt AS updatedAt
         ORDER BY s.updatedAt DESC LIMIT $limit`,
        { edgeId, limit }
      );
      return (rows || []) as any;
    } catch {
      return [];
    }
  }

  async getEdgeCandidates(
    edgeId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      edgeId: string;
      candidateId?: string;
      name?: string;
      path?: string;
      resolver?: string;
      score?: number;
      rank?: number;
      updatedAt?: string;
    }>
  > {
    try {
      const rows = await this.graphDbQuery(
        `MATCH (c:edge_candidate) WHERE c.edgeId = $edgeId
         RETURN c.id AS id, c.edgeId AS edgeId, c.candidateId AS candidateId, c.name AS name, c.path AS path,
                c.resolver AS resolver, c.score AS score, c.rank AS rank, c.updatedAt AS updatedAt
         ORDER BY c.rank ASC, c.updatedAt DESC LIMIT $limit`,
        { edgeId, limit }
      );
      return (rows || []) as any;
    } catch {
      return [];
    }
  }

  // Graph search operations
  async search(request: GraphSearchRequest): Promise<Entity[]> {
    // Create a cache key from the request
    const cacheKey = {
      query: request.query,
      searchType: request.searchType || "structural",
      entityTypes: request.entityTypes,
      filters: request.filters,
      includeRelated: request.includeRelated,
      limit: request.limit,
    };

    // Check cache first
    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      console.log(`🔍 Cache hit for search query: ${request.query}`);
      return cachedResult;
    }

    // Perform the actual search
    let result: Entity[];
    if (request.searchType === "semantic") {
      result = await this.semanticSearch(request);
    } else {
      result = await this.structuralSearch(request);
    }

    // If caller requested specific entity types, filter results to match
    if (request.entityTypes && request.entityTypes.length > 0) {
      result = result.filter((e) =>
        this.entityMatchesRequestedTypes(e, request.entityTypes!)
      );
    }

    // Cache the result
    this.searchCache.set(cacheKey, result);
    console.log(`🔍 Cached search result for query: ${request.query}`);

    return result;
  }

  // Map request entityTypes (function/class/interface/file/module) to actual entity shape
  private entityMatchesRequestedTypes(
    entity: Entity,
    requested: string[]
  ): boolean {
    const type = (entity as any)?.type;
    const kind = (entity as any)?.kind;
    for (const t of requested) {
      const tn = String(t || "").toLowerCase();
      if (
        tn === "function" &&
        ((type === "symbol" && kind === "function") || type === "function")
      ) {
        return true;
      }
      if (
        tn === "class" &&
        ((type === "symbol" && kind === "class") || type === "class")
      ) {
        return true;
      }
      if (
        tn === "interface" &&
        ((type === "symbol" && kind === "interface") || type === "interface")
      ) {
        return true;
      }
      if (tn === "file" && type === "file") return true;
      if (tn === "module" && (type === "module" || type === "file"))
        return true;
      if (tn === "test" && type === "test") return true;
    }
    return false;
  }

  /**
   * Reset all in-memory caches maintained by the service.
   */
  resetCaches(): void {
    this.entityCache.clear();
    this.searchCache.clear();
    console.log("🧹 KnowledgeGraphService caches cleared");
  }

  /**
   * Invalidate cache entries whose key (entity id or search payload) matches a prefix.
   */
  invalidateCachesByPrefix(prefix: string): void {
    if (!prefix) {
      return;
    }
    const normalizedPrefix = this.namespaceId(prefix);
    const matcher = (rawKey: string): boolean => {
      try {
        const parsed = JSON.parse(rawKey);
        if (typeof parsed === "string") {
          return parsed.startsWith(normalizedPrefix);
        }
      } catch {
        // Ignore JSON parse errors and fall through
      }
      return rawKey.includes(normalizedPrefix);
    };
    this.entityCache.invalidate(matcher);
    this.searchCache.invalidate(matcher);
  }

  /**
   * Clear search cache
   */
  private clearSearchCache(): void {
    this.searchCache.clear();
    console.log("🔄 Search cache cleared");
  }

  /**
   * Invalidate cache entries related to an entity
   */
  private invalidateEntityCache(entityId: string): void {
    const resolvedId = this.namespaceId(entityId);
    // Remove the specific entity from cache
    this.entityCache.invalidateKey(resolvedId);

    // Also clear search cache as searches might be affected
    // This could be optimized to only clear relevant searches
    this.clearSearchCache();
    console.log(`🔄 Invalidated cache for entity: ${resolvedId}`);
  }

  async shutdown(options: { resetCaches?: boolean; preserveListeners?: boolean } = {}): Promise<void> {
    if (options.resetCaches !== false) {
      this.resetCaches();
    }
    if (!options.preserveListeners) {
      this.removeAllListeners();
    }
  }

  static async withScopedInstance<T>(
    db: DatabaseService,
    options: { namespace?: GraphNamespaceConfig; initialize?: boolean } = {},
    handler: (service: KnowledgeGraphService) => Promise<T>
  ): Promise<T> {
    const service = new KnowledgeGraphService(db, options.namespace);
    try {
      if (options.initialize !== false) {
        await service.initialize();
      }
      return await handler(service);
    } finally {
      await service.shutdown();
    }
  }

  /**
   * Find entities by type
   */
  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    const request: GraphSearchRequest = {
      query: "",
      searchType: "structural",
      entityTypes: [entityType as any],
    };
    return this.structuralSearch(request);
  }

  /**
   * Find symbol entities by exact name
   */
  async findSymbolsByName(name: string, limit: number = 50): Promise<Entity[]> {
    const query = `
      MATCH (n {type: $type})
      WHERE n.name = $name
      RETURN n
      LIMIT $limit
    `;
    const result = await this.graphDbQuery(query, {
      type: "symbol",
      name,
      limit,
    });
    return result.map((row: any) => this.parseEntityFromGraph(row));
  }

  /**
   * Find symbol by kind and name (e.g., class/interface/function)
   */
  async findSymbolByKindAndName(
    kind: string,
    name: string,
    limit: number = 50
  ): Promise<Entity[]> {
    const query = `
      MATCH (n {type: $type})
      WHERE n.name = $name AND n.kind = $kind
      RETURN n
      LIMIT $limit
    `;
    const result = await this.graphDbQuery(query, {
      type: "symbol",
      name,
      kind,
      limit,
    });
    return result.map((row: any) => this.parseEntityFromGraph(row));
  }

  /**
   * Find a symbol defined in a specific file by name
   */
  async findSymbolInFile(
    filePath: string,
    name: string
  ): Promise<Entity | null> {
    const query = `
      MATCH (n {type: $type})
      WHERE n.path = $path
      RETURN n
      LIMIT 1
    `;
    // Symbol entities store path as `${filePath}:${name}`
    const compositePath = `${filePath}:${name}`;
    const result = await this.graphDbQuery(query, {
      type: "symbol",
      path: compositePath,
    });
    const entity = result[0] ? this.parseEntityFromGraph(result[0]) : null;
    return entity;
  }

  /**
   * Find symbols by name that are "nearby" a given file, using directory prefix.
   * This helps resolve placeholders by preferring local modules over global matches.
   */
  async findNearbySymbols(
    filePath: string,
    name: string,
    limit: number = 20
  ): Promise<Entity[]> {
    try {
      const rel = String(filePath || "").replace(/\\/g, "/");
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      const dirPrefix = dir ? `${dir}/` : "";
      const query = `
        MATCH (n {type: $type})
        WHERE n.name = $name AND ($dirPrefix = '' OR n.path STARTS WITH $dirPrefix)
        RETURN n
        LIMIT $limit
      `;
      // Fetch more and rank in memory by directory distance
      const raw = await this.graphDbQuery(query, {
        type: "symbol",
        name,
        dirPrefix,
        limit: Math.max(limit * 3, limit),
      });
      const entities = (raw || []).map((row: any) =>
        this.parseEntityFromGraph(row)
      );
      const ranked = entities
        .map((e) => ({
          e,
          d: this.directoryDistance(filePath, (e as any).path || ""),
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, limit)
        .map((x) => x.e);
      return ranked;
    } catch {
      return [];
    }
  }

  /**
   * Get a file entity by path
   */
  async getFileByPath(path: string): Promise<Entity | null> {
    const query = `
      MATCH (n {type: $type, path: $path})
      RETURN n
      LIMIT 1
    `;
    const result = await this.graphDbQuery(query, { type: "file", path });
    return result[0] ? this.parseEntityFromGraph(result[0]) : null;
  }

  private async semanticSearch(request: GraphSearchRequest): Promise<Entity[]> {
    // Validate limit parameter
    if (
      request.limit !== undefined &&
      (typeof request.limit !== "number" ||
        request.limit < 0 ||
        !Number.isInteger(request.limit))
    ) {
      throw new Error(
        `Invalid limit parameter: ${request.limit}. Must be a positive integer.`
      );
    }

    try {
      // Get vector embeddings for the query
      const embeddings = await this.generateEmbedding(
        String(request.query || "")
      );

      // Search in Qdrant
      const qdrantOptions: any = {
        vector: embeddings,
        limit: request.limit || 10,
        with_payload: true,
        with_vector: false,
      };
      const checkpointId = request.filters?.checkpointId;
      if (checkpointId) {
        qdrantOptions.filter = {
          must: [{ key: "checkpointId", match: { value: checkpointId } }],
        };
      }
      const searchResult = await this.db.qdrant.search(
        this.qdrantCollection("code"),
        qdrantOptions
      );

      // Get entities from graph database
      const searchResultData = searchResult as any;

      // Handle different Qdrant response formats
      let points: any[] = [];
      if (Array.isArray(searchResultData)) {
        // Direct array of points
        points = searchResultData;
      } else if (searchResultData.points) {
        // Object with points property
        points = searchResultData.points;
      } else if (searchResultData.results) {
        // Object with results property
        points = searchResultData.results;
      }

      const entities: Entity[] = [];

      for (const point of points) {
        // Get the actual entity ID from the payload, not the numeric ID
        const entityId = point.payload?.entityId;
        if (entityId) {
          const entity = await this.getEntity(entityId);
          if (entity) {
            entities.push(entity);
          }
        }
      }

      // If no results from semantic search, fall back to structural search
      if (entities.length === 0) {
        console.log(
          "Semantic search returned no results, falling back to structural search"
        );
        return this.structuralSearch(request);
      }

      return entities;
    } catch (error) {
      console.warn(
        "Semantic search failed, falling back to structural search:",
        error
      );
      // Fall back to structural search if semantic search fails
      return this.structuralSearch(request);
    }
  }

  private async structuralSearch(
    request: GraphSearchRequest
  ): Promise<Entity[]> {
    // Validate limit parameter
    if (
      request.limit !== undefined &&
      (typeof request.limit !== "number" ||
        request.limit < 0 ||
        !Number.isInteger(request.limit))
    ) {
      throw new Error(
        `Invalid limit parameter: ${request.limit}. Must be a positive integer.`
      );
    }

    let query = "MATCH (n)";
    const whereClause: string[] = [];
    const params: any = {};

    // Map requested entityTypes to stored schema (type/kind)
    if (request.entityTypes && request.entityTypes.length > 0) {
      const typeClauses: string[] = [];
      let idx = 0;
      for (const t of request.entityTypes) {
        const typeName = String(t || "").toLowerCase();
        switch (typeName) {
          case "function": {
            const tp = `etype_${idx}`;
            const kd = `ekind_${idx}`;
            params[tp] = "symbol";
            params[kd] = "function";
            typeClauses.push(
              `((n.type = $${tp} AND n.kind = $${kd}) OR n.type = "function")`
            );
            idx++;
            break;
          }
          case "class": {
            const tp = `etype_${idx}`;
            const kd = `ekind_${idx}`;
            params[tp] = "symbol";
            params[kd] = "class";
            typeClauses.push(
              `((n.type = $${tp} AND n.kind = $${kd}) OR n.type = "class")`
            );
            idx++;
            break;
          }
          case "interface": {
            const tp = `etype_${idx}`;
            const kd = `ekind_${idx}`;
            params[tp] = "symbol";
            params[kd] = "interface";
            typeClauses.push(
              `((n.type = $${tp} AND n.kind = $${kd}) OR n.type = "interface")`
            );
            idx++;
            break;
          }
          case "file": {
            const tp = `etype_${idx}`;
            params[tp] = "file";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          case "module": {
            // Prefer explicit module type; some graphs represent modules as files
            const tp1 = `etype_${idx}`;
            const tp2 = `etype_${idx + 1}`;
            params[tp1] = "module";
            params[tp2] = "file";
            typeClauses.push(`(n.type = $${tp1} OR n.type = $${tp2})`);
            idx += 2;
            break;
          }
          case "symbol": {
            const tp = `etype_${idx}`;
            params[tp] = "symbol";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          case "documentation": {
            const tp = `etype_${idx}`;
            params[tp] = "documentation";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          case "test": {
            const tp = `etype_${idx}`;
            params[tp] = "test";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          case "businessdomain":
          case "domain": {
            const tp = `etype_${idx}`;
            params[tp] = "businessDomain";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          case "semanticcluster":
          case "cluster": {
            const tp = `etype_${idx}`;
            params[tp] = "semanticCluster";
            typeClauses.push(`(n.type = $${tp})`);
            idx++;
            break;
          }
          default: {
            // Unknown type: skip
            break;
          }
        }
      }

      if (typeClauses.length === 0) {
        return [];
      }

      // Apply all mapped type constraints using OR so other filters still apply
      whereClause.push(`(${typeClauses.join(" OR ")})`);
    }

    // Add text search if query is provided
    if (request.query && request.query.trim() !== "") {
      // For exact ID matching (like UUID searches)
      if (request.query.match(/^[a-f0-9-]{36}$/i)) {
        // Looks like a UUID, do exact match on ID
        whereClause.push("n.id = $searchId");
        params.searchId = request.query;
      } else {
        // For general text search using FalkorDB's supported string functions
        const searchTerms = request.query.toLowerCase().split(/\s+/);
        const searchConditions: string[] = [];

        searchTerms.forEach((term, index) => {
          // Create regex pattern for substring matching
          const pattern = `.*${term}.*`;
          params[`pattern_${index}`] = pattern;
          params[`term_${index}`] = term;

          // Build conditions array based on what FalkorDB supports
          const conditions: string[] = [];

          // Use CONTAINS for substring matching (widely supported in Cypher)
          if (request.searchType !== undefined) {
            conditions.push(
              `toLower(n.name) CONTAINS $term_${index}`,
              `toLower(n.docstring) CONTAINS $term_${index}`,
              `toLower(n.path) CONTAINS $term_${index}`,
              `toLower(n.id) CONTAINS $term_${index}`
            );
          }

          // Always include exact matches (most compatible and performant)
          conditions.push(
            `toLower(n.name) = $term_${index}`,
            `toLower(n.title) = $term_${index}`,
            `toLower(n.id) = $term_${index}`
          );

          // Use STARTS WITH for prefix matching (widely supported in Cypher)
          conditions.push(
            `toLower(n.name) STARTS WITH $term_${index}`,
            `toLower(n.path) STARTS WITH $term_${index}`
          );

          if (conditions.length > 0) {
            searchConditions.push(`(${conditions.join(" OR ")})`);
          }
        });

        if (searchConditions.length > 0) {
          whereClause.push(`(${searchConditions.join(" OR ")})`);
        }
      }
    }

    // Add path filters with index-friendly patterns
    if (request.filters?.path) {
      // Check if the filter looks like a pattern (contains no slashes at start)
      if (!request.filters.path.startsWith("/")) {
        // Treat as a substring match
        whereClause.push("n.path CONTAINS $path");
        params.path = request.filters.path;
      } else {
        // Treat as a prefix match
        whereClause.push("n.path STARTS WITH $path");
        params.path = request.filters.path;
      }
    }

    // Add language filters
    if (request.filters?.language) {
      whereClause.push("n.language = $language");
      params.language = request.filters.language;
    }

    // Add time filters with optimized date handling
    if (request.filters?.lastModified?.since) {
      whereClause.push("n.lastModified >= $since");
      params.since = request.filters.lastModified.since.toISOString();
    }

    if (request.filters?.lastModified?.until) {
      whereClause.push("n.lastModified <= $until");
      params.until = request.filters.lastModified.until.toISOString();
    }

    const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN n
      ${request.limit ? "LIMIT $limit" : ""}
    `;

    if (request.limit) params.limit = request.limit;

    try {
      const result = await this.graphDbQuery(fullQuery, params);
      let entities = result.map((row: any) => this.parseEntityFromGraph(row));
      // Optional checkpoint filter: restrict to checkpoint members
      const checkpointId = request.filters?.checkpointId;
      if (checkpointId) {
        try {
          const rows = await this.graphDbQuery(
            `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n) RETURN n.id AS id`,
            { id: checkpointId }
          );
          const allowed = new Set<string>((rows || []).map((r: any) => r.id));
          entities = entities.filter((e: any) => allowed.has(e.id));
        } catch {
          // If filter query fails, return unfiltered entities
        }
      }
      return entities;
    } catch (error: any) {
      // If the query fails due to unsupported functions, try a simpler query
      if (
        error?.message?.includes("Unknown function") ||
        error?.message?.includes("matchRegEx")
      ) {
        console.warn(
          "FalkorDB query failed with advanced functions, falling back to simple search"
        );

        // Retry with simple exact match only
        const simpleQuery = request.query?.trim();
        if (simpleQuery && !simpleQuery.match(/^[a-f0-9-]{36}$/i)) {
          const simpleParams: any = { searchTerm: simpleQuery.toLowerCase() };
          const simpleFullQuery = `
            MATCH (n)
            WHERE toLower(n.name) = $searchTerm 
               OR toLower(n.id) = $searchTerm
               OR n.id = $searchTerm
            RETURN n
            ${request.limit ? "LIMIT " + request.limit : ""}
          `;

          try {
            const result = await this.graphDbQuery(
              simpleFullQuery,
              simpleParams
            );
            let entities = result.map((row: any) =>
              this.parseEntityFromGraph(row)
            );
            const checkpointId = request.filters?.checkpointId;
            if (checkpointId) {
              try {
                const rows = await this.graphDbQuery(
                  `MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n) RETURN n.id AS id`,
                  { id: checkpointId }
                );
                const allowed = new Set<string>(
                  (rows || []).map((r: any) => r.id)
                );
                entities = entities.filter((e: any) => allowed.has(e.id));
              } catch {}
            }
            return entities;
          } catch (fallbackError) {
            console.error("Even simple FalkorDB query failed:", fallbackError);
            return [];
          }
        }
      }

      // Re-throw if it's not a function-related error
      throw error;
    }
  }

  async getEntityExamples(entityId: string): Promise<GraphExamples | null> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const entity = await this.getEntity(entityId);
    if (!entity) {
      return null; // Return null instead of throwing error
    }

    // Get usage examples from relationships
    const usageRelationships = await this.getRelationships({
      toEntityId: entityId,
      type: [RelationshipType.CALLS, RelationshipType.REFERENCES],
      limit: 10,
    });

    const usageExamples = await Promise.all(
      usageRelationships.map(async (rel) => {
        const caller = await this.getEntity(rel.fromEntityId);
        if (caller && this.hasCodebaseProperties(caller)) {
          let snippet = `// Usage in ${(caller as any).path}`;
          let lineNum = (rel as any)?.metadata?.line || 1;
          try {
            const fileRel = ((caller as any).path || "").split(":")[0];
            const abs = path.resolve(fileRel);
            const raw = await fs.readFile(abs, "utf-8");
            const lines = raw.split("\n");
            const idx = Math.max(
              1,
              Math.min(lines.length, Number(lineNum) || 1)
            );
            const from = Math.max(1, idx - 2);
            const to = Math.min(lines.length, idx + 2);
            const view = lines.slice(from - 1, to).join("\n");
            snippet = view;
            lineNum = idx;
          } catch {}
          return {
            context: `${(caller as any).path}:${rel.type}`,
            code: snippet,
            file: (caller as any).path,
            line: lineNum,
          };
        }
        return null;
      })
    ).then((examples) =>
      examples.filter((ex): ex is NonNullable<typeof ex> => ex !== null)
    );

    // Get test examples
    const testRelationships = await this.getRelationships({
      toEntityId: entityId,
      type: RelationshipType.TESTS,
      limit: 5,
    });

    const testExamples = await Promise.all(
      testRelationships.map(async (rel) => {
        const test = await this.getEntity(rel.fromEntityId);
        if (
          test &&
          test.type === "test" &&
          this.hasCodebaseProperties(entity)
        ) {
          return {
            testId: test.id,
            testName: (test as Test).testType,
            testCode: `// Test for ${(entity as any).path}`,
            assertions: [],
          };
        }
        return null;
      })
    ).then((examples) =>
      examples.filter((ex): ex is NonNullable<typeof ex> => ex !== null)
    );

    return {
      entityId,
      signature: this.getEntitySignature(entity),
      usageExamples,
      testExamples,
      relatedPatterns: [], // Would be populated from usage analysis
    };
  }

  async getEntityDependencies(
    entityId: string
  ): Promise<DependencyAnalysis | null> {
    const entity = await this.getEntity(entityId);
    if (!entity) {
      return null; // Return null instead of throwing error
    }

    // Get direct dependencies
    const directDeps = await this.getRelationships({
      fromEntityId: entityId,
      type: [
        RelationshipType.CALLS,
        RelationshipType.REFERENCES,
        RelationshipType.DEPENDS_ON,
      ],
    });

    // Get reverse dependencies
    const reverseDeps = await this.getRelationships({
      toEntityId: entityId,
      type: [
        RelationshipType.CALLS,
        RelationshipType.REFERENCES,
        RelationshipType.DEPENDS_ON,
      ],
    });

    const [directEntities, reverseEntities] = await Promise.all([
      Promise.all(
        directDeps.map((rel) =>
          this.getEntity(rel.toEntityId).catch(() => null)
        )
      ),
      Promise.all(
        reverseDeps.map((rel) =>
          this.getEntity(rel.fromEntityId).catch(() => null)
        )
      ),
    ]);

    const directDependencies: DependencyAnalysis["directDependencies"] = [];
    for (let i = 0; i < directDeps.length; i++) {
      const entityRef = directEntities[i];
      if (!entityRef) continue;
      const rel = directDeps[i];
      const confidence =
        typeof (rel as any).confidence === "number"
          ? Math.max(0, Math.min(1, (rel as any).confidence))
          : 1;
      directDependencies.push({
        entity: entityRef,
        relationship: rel.type,
        confidence,
      });
    }

    const reverseDependencies: DependencyAnalysis["reverseDependencies"] = [];
    for (let i = 0; i < reverseDeps.length; i++) {
      const entityRef = reverseEntities[i];
      if (!entityRef) continue;
      const rel = reverseDeps[i];
      reverseDependencies.push({
        entity: entityRef,
        relationship: rel.type,
        impact: "medium",
      });
    }

    return {
      entityId,
      directDependencies,
      indirectDependencies: [],
      reverseDependencies,
      circularDependencies: [],
    };
  }

  private buildEmptyImpact(): ImpactAnalysis {
    return {
      directImpact: [],
      cascadingImpact: [],
      testImpact: {
        affectedTests: [],
        requiredUpdates: [],
        coverageImpact: 0,
      },
      documentationImpact: {
        staleDocs: [],
        missingDocs: [],
        requiredUpdates: [],
        freshnessPenalty: 0,
      },
      specImpact: {
        relatedSpecs: [],
        requiredUpdates: [],
        summary: {
          byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
          byImpactLevel: { critical: 0, high: 0, medium: 0, low: 0 },
          statuses: {
            draft: 0,
            approved: 0,
            implemented: 0,
            deprecated: 0,
            unknown: 0,
          },
          acceptanceCriteriaReferences: 0,
          pendingSpecs: 0,
        },
      },
      deploymentGate: {
        blocked: false,
        level: "none",
        reasons: [],
        stats: { missingDocs: 0, staleDocs: 0, freshnessPenalty: 0 },
      },
      recommendations: [],
    };
  }

  private dedupeEntities(entities: Array<Entity | null | undefined>): Entity[] {
    const seen = new Set<string>();
    const result: Entity[] = [];
    for (const entity of entities) {
      if (!entity) continue;
      if (seen.has(entity.id)) continue;
      seen.add(entity.id);
      result.push(entity);
    }
    return result;
  }

  private dedupeStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      if (!value || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result;
  }

  private async getEntitiesByIds(ids: string[]): Promise<Map<string, Entity>> {
    const normalizedIds = ids
      .map((id) => this.resolveOptionalEntityId(id))
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

    if (normalizedIds.length === 0) {
      return new Map();
    }

    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const id of normalizedIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      uniqueIds.push(id);
    }

    const entities = new Map<string, Entity>();
    const missing: string[] = [];

    for (const id of uniqueIds) {
      const cached = this.entityCache.get(id);
      if (cached) {
        entities.set(id, cached);
      } else {
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < missing.length; i += chunkSize) {
        const chunk = missing.slice(i, i + chunkSize);
        try {
          const rows = await this.graphDbQuery(
            `
              UNWIND $ids AS requestedId
              MATCH (n { id: requestedId })
              RETURN requestedId AS id, n
            `,
            { ids: chunk }
          );

          for (const row of rows || []) {
            try {
              const graphNode = row?.n ?? row?.node ?? row;
              const entity = this.parseEntityFromGraph(graphNode);
              if (!entity?.id) {
                continue;
              }
              const resolvedId =
                typeof row?.id === "string"
                  ? this.resolveOptionalEntityId(row.id) ?? row.id
                  : this.resolveOptionalEntityId(entity.id) ?? entity.id;
              if (!resolvedId) {
                continue;
              }
              this.entityCache.set(resolvedId, entity);
              entities.set(resolvedId, entity);
            } catch (error) {
              console.error(
                "[KnowledgeGraphService] Failed to parse entity from bulk fetch:",
                error
              );
            }
          }
        } catch (error) {
          console.error(
            "[KnowledgeGraphService] Bulk entity fetch failed:",
            error
          );

          const fallbackResults = await Promise.all(
            chunk.map(async (id) => {
              try {
                const entity = await this.getEntity(id);
                return entity ? ([id, entity] as const) : null;
              } catch (err) {
                console.error(
                  `[KnowledgeGraphService] Failed to fetch entity ${id} in fallback:`,
                  err
                );
                return null;
              }
            })
          );

          for (const entry of fallbackResults) {
            if (!entry) continue;
            const [id, entity] = entry;
            this.entityCache.set(id, entity);
            entities.set(id, entity);
          }
        }
      }
    }

    return entities;
  }

  private determineDirectSeverity(
    change: ImpactAnalysisRequest["changes"][number],
    impactedCount: number
  ): "high" | "medium" | "low" {
    if (change.changeType === "delete") {
      return "high";
    }

    if (change.signatureChange) {
      return impactedCount > 5 ? "high" : "medium";
    }

    if (change.changeType === "rename") {
      return impactedCount > 5 ? "medium" : "low";
    }

    if (impactedCount >= 10) {
      return "high";
    }
    if (impactedCount >= 3) {
      return "medium";
    }
    return impactedCount > 0 ? "low" : "low";
  }

  private normalizeSpecPriority(
    value: unknown
  ): "critical" | "high" | "medium" | "low" | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized in SPEC_PRIORITY_ORDER) {
      return normalized as keyof typeof SPEC_PRIORITY_ORDER;
    }
    return undefined;
  }

  private normalizeSpecImpactLevel(
    value: unknown
  ): "critical" | "high" | "medium" | "low" | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized in SPEC_IMPACT_ORDER) {
      return normalized as keyof typeof SPEC_IMPACT_ORDER;
    }
    return undefined;
  }

  private normalizeSpecStatus(value: unknown): Spec["status"] | "unknown" {
    if (typeof value !== "string") {
      return "unknown";
    }
    const normalized = value.toLowerCase();
    if (
      normalized === "draft" ||
      normalized === "approved" ||
      normalized === "implemented" ||
      normalized === "deprecated"
    ) {
      return normalized as Spec["status"];
    }
    return "unknown";
  }

  private pickHigherPriority(
    current: "critical" | "high" | "medium" | "low" | undefined,
    candidate: "critical" | "high" | "medium" | "low" | undefined
  ): "critical" | "high" | "medium" | "low" | undefined {
    if (!candidate) return current;
    if (!current) return candidate;
    return SPEC_PRIORITY_ORDER[candidate] >= SPEC_PRIORITY_ORDER[current]
      ? candidate
      : current;
  }

  private pickHigherImpactLevel(
    current: "critical" | "high" | "medium" | "low" | undefined,
    candidate: "critical" | "high" | "medium" | "low" | undefined
  ): "critical" | "high" | "medium" | "low" | undefined {
    if (!candidate) return current;
    if (!current) return candidate;
    return SPEC_IMPACT_ORDER[candidate] >= SPEC_IMPACT_ORDER[current]
      ? candidate
      : current;
  }

  private async getRelationshipsSafe(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    try {
      return await this.getRelationships(query);
    } catch (error) {
      console.error("[ImpactAnalysis] Relationship query failed:", error);
      return [];
    }
  }

  private evaluateDeploymentGate(
    documentationImpact: ImpactAnalysis["documentationImpact"]
  ): ImpactAnalysis["deploymentGate"] {
    const missingCount = documentationImpact.missingDocs?.length || 0;
    const staleCount = documentationImpact.staleDocs?.length || 0;
    const freshnessPenalty = documentationImpact.freshnessPenalty || 0;

    const reasons: string[] = [];
    let blocked = false;
    let level: ImpactAnalysis["deploymentGate"]["level"] = "none";

    if (missingCount > 0) {
      blocked = true;
      level = "required";
      reasons.push(
        `${missingCount} impacted entit${
          missingCount === 1 ? "y" : "ies"
        } lack linked documentation`
      );
    }

    if (staleCount > 3 || freshnessPenalty > 5) {
      if (!blocked) {
        level = "advisory";
      }
      reasons.push(
        `${staleCount} documentation artefact${
          staleCount === 1 ? "" : "s"
        } marked stale`
      );
    }

    return {
      blocked,
      level,
      reasons,
      stats: {
        missingDocs: missingCount,
        staleDocs: staleCount,
        freshnessPenalty,
      },
    };
  }

  private generateImpactRecommendations(
    directImpact: ImpactAnalysis["directImpact"],
    cascadingImpact: ImpactAnalysis["cascadingImpact"],
    testImpact: ImpactAnalysis["testImpact"],
    documentationImpact: ImpactAnalysis["documentationImpact"],
    specImpact: ImpactAnalysis["specImpact"]
  ): ImpactAnalysis["recommendations"] {
    const recommendations: ImpactAnalysis["recommendations"] = [];

    const highSeverityDirect = directImpact.filter(
      (entry) => entry.severity === "high" && entry.entities.length > 0
    );
    if (highSeverityDirect.length > 0) {
      const affectedCount = highSeverityDirect.reduce(
        (total, entry) => total + entry.entities.length,
        0
      );
      const sampleEntities = highSeverityDirect
        .flatMap((entry) => entry.entities.slice(0, 5))
        .map((entity) => this.getEntityLabel(entity));
      const description =
        affectedCount === 1
          ? "Resolve the high-risk dependency before merging."
          : `Resolve ${affectedCount} high-risk dependencies before merging.`;

      recommendations.push({
        priority: "immediate",
        description,
        effort: "high",
        impact: "breaking",
        type: "warning",
        actions: sampleEntities,
      });
    }

    if (cascadingImpact.length > 0) {
      const highestLevel = Math.max(
        ...cascadingImpact.map((entry) => entry.level)
      );
      if (highestLevel > 1) {
        recommendations.push({
          priority: "planned",
          description: `Review cascading impacts up to level ${highestLevel} to prevent regressions`,
          effort: "medium",
          impact: "functional",
          type: "requirement",
          actions: cascadingImpact
            .slice(0, 3)
            .flatMap((entry) => entry.entities.slice(0, 2))
            .map((entity) => this.getEntityLabel(entity)),
        });
      }
    }

    if (testImpact.affectedTests.length > 0) {
      const testCount = testImpact.affectedTests.length;
      const description =
        testCount === 1
          ? "Update the impacted test to maintain coverage."
          : `Update ${testCount} impacted tests to maintain coverage.`;
      recommendations.push({
        priority: "immediate",
        description,
        effort: testCount > 3 ? "medium" : "low",
        impact: "functional",
        type: "requirement",
        actions: testImpact.affectedTests
          .slice(0, 5)
          .map((test) => this.getEntityLabel(test)),
      });
    }

    const documentationIssues =
      (documentationImpact.staleDocs?.length || 0) +
      (documentationImpact.missingDocs?.length || 0);
    if (documentationIssues > 0) {
      const missingCount = documentationImpact.missingDocs?.length || 0;
      const staleCount = documentationImpact.staleDocs?.length || 0;
      const description =
        missingCount > 0
          ? missingCount === 1
            ? "Author documentation for the uncovered entity."
            : `Author documentation for ${missingCount} uncovered entities.`
          : staleCount === 1
          ? "Refresh the stale documentation artefact."
          : `Refresh ${staleCount} stale documentation artefacts.`;

      recommendations.push({
        priority: missingCount > 0 ? "immediate" : "planned",
        description,
        effort: missingCount > 0 ? "medium" : "low",
        impact: "functional",
        type: "warning",
        actions: [
          ...documentationImpact.staleDocs
            .slice(0, 3)
            .map((doc: any) => doc.title || doc.docId),
          ...documentationImpact.missingDocs
            .slice(0, 2)
            .map((doc: any) => doc.entityName || doc.entityId),
        ].filter(Boolean),
      });
    }

    if (specImpact.relatedSpecs.length > 0) {
      const summary = specImpact.summary;
      const prioritizedSpecs = specImpact.relatedSpecs.slice().sort((a, b) => {
        const aRank = a.priority ? SPEC_PRIORITY_ORDER[a.priority] : 0;
        const bRank = b.priority ? SPEC_PRIORITY_ORDER[b.priority] : 0;
        return bRank - aRank;
      });
      const topSpecNames = prioritizedSpecs
        .slice(0, 5)
        .map((entry) => entry.spec?.title || entry.specId);

      if (summary.byPriority.critical > 0) {
        const count = summary.byPriority.critical;
        recommendations.push({
          priority: "immediate",
          description:
            count === 1
              ? "Resolve the linked critical specification before merging."
              : `Resolve ${count} linked critical specifications before merging.`,
          effort: "high",
          impact: "functional",
          type: "warning",
          actions: topSpecNames,
        });
      } else if (summary.byPriority.high > 0) {
        const count = summary.byPriority.high;
        recommendations.push({
          priority: "immediate",
          description:
            count === 1
              ? "Coordinate with the high-priority spec owner to validate changes."
              : `Coordinate with ${count} high-priority spec owners to validate changes.`,
          effort: "medium",
          impact: "functional",
          type: "requirement",
          actions: topSpecNames,
        });
      } else if (summary.pendingSpecs > 0) {
        const count = summary.pendingSpecs;
        recommendations.push({
          priority: "planned",
          description:
            count === 1
              ? "Finalize the linked specification still in progress."
              : `Finalize ${count} linked specifications still in progress before release.`,
          effort: "medium",
          impact: "functional",
          type: "requirement",
          actions: topSpecNames,
        });
      }

      if (summary.acceptanceCriteriaReferences > 0) {
        const count = summary.acceptanceCriteriaReferences;
        recommendations.push({
          priority: count > 2 ? "immediate" : "planned",
          description:
            count === 1
              ? "Validate the impacted acceptance criterion to maintain coverage."
              : `Validate ${count} impacted acceptance criteria to maintain coverage.`,
          effort: "medium",
          impact: "functional",
          type: "requirement",
          actions: topSpecNames,
        });
      }
    }

    return recommendations;
  }

  private computeCoverageContribution(
    relationship: GraphRelationship,
    testEntity?: Test | null
  ): number {
    const relAny = relationship as any;
    const metadata = (relAny?.metadata as Record<string, any>) || {};
    const candidates: number[] = [];

    const directCoverage = relAny?.coverage;
    if (typeof directCoverage === "number") {
      candidates.push(directCoverage);
    }

    if (typeof metadata.coverage === "number") {
      candidates.push(metadata.coverage);
    }
    if (typeof metadata.coverageDelta === "number") {
      candidates.push(metadata.coverageDelta);
    }
    if (
      metadata.coverage?.percent &&
      typeof metadata.coverage.percent === "number"
    ) {
      candidates.push(metadata.coverage.percent);
    }

    if (testEntity?.coverage) {
      const { lines, statements, functions, branches } = testEntity.coverage;
      [lines, statements, functions, branches]
        .filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value)
        )
        .forEach((value) => candidates.push(value));
    }

    let coverage = candidates.find((value) => value > 1 && value <= 100);
    if (coverage === undefined) {
      const fractional = candidates.find((value) => value >= 0 && value <= 1);
      coverage = typeof fractional === "number" ? fractional * 100 : undefined;
    }

    if (coverage === undefined) {
      coverage = 10;
    }

    return Number(coverage.toFixed(2));
  }

  private async computeCascadingImpact(
    change: ImpactAnalysisRequest["changes"][number],
    startingRelationships: GraphRelationship[],
    maxDepth: number
  ): Promise<ImpactAnalysis["cascadingImpact"]> {
    const initial = startingRelationships
      .map((rel) => rel.fromEntityId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (initial.length === 0) {
      return [];
    }

    const visited = new Set<string>([change.entityId]);
    let frontier = startingRelationships
      .map((rel) => ({
        entityId: rel.fromEntityId,
        relationship: rel.type,
      }))
      .filter(
        (item): item is { entityId: string; relationship: RelationshipType } =>
          typeof item.entityId === "string" && item.entityId.length > 0
      );

    const buckets = new Map<
      string,
      { level: number; relationship: RelationshipType; entityIds: Set<string> }
    >();

    let level = 1;
    while (frontier.length > 0 && level <= maxDepth) {
      const levelItems = frontier.filter((item) => !visited.has(item.entityId));
      if (levelItems.length === 0) {
        break;
      }

      for (const item of levelItems) {
        visited.add(item.entityId);
        const key = `${level}:${item.relationship}`;
        const bucket = buckets.get(key) || {
          level,
          relationship: item.relationship,
          entityIds: new Set<string>(),
        };
        bucket.entityIds.add(item.entityId);
        buckets.set(key, bucket);
      }

      if (level >= maxDepth) {
        break;
      }

      const nestedResults = await Promise.all(
        levelItems.map((item) =>
          this.getRelationshipsSafe({
            toEntityId: item.entityId,
            type: IMPACT_CODE_RELATIONSHIP_TYPES,
            limit: 200,
          })
        )
      );

      const nextCandidates = new Map<string, RelationshipType>();
      for (const rels of nestedResults) {
        for (const rel of rels) {
          if (!rel.fromEntityId || visited.has(rel.fromEntityId)) {
            continue;
          }
          if (!nextCandidates.has(rel.fromEntityId)) {
            nextCandidates.set(rel.fromEntityId, rel.type);
          }
        }
      }

      frontier = Array.from(nextCandidates.entries()).map(
        ([entityId, relationship]) => ({
          entityId,
          relationship,
        })
      );
      level += 1;
    }

    const bucketEntries = Array.from(buckets.values());
    if (bucketEntries.length === 0) {
      return [];
    }

    const resolved = await Promise.all(
      bucketEntries.map(async (bucket) => {
        const entities = Array.from(
          (await this.getEntitiesByIds(Array.from(bucket.entityIds))).values()
        );
        if (entities.length === 0) {
          return null;
        }
        const confidence = Number(
          Math.max(0.3, 0.9 - (bucket.level - 1) * 0.2).toFixed(2)
        );
        return {
          level: bucket.level,
          relationship: bucket.relationship,
          entities,
          confidence,
        } satisfies ImpactAnalysis["cascadingImpact"][number];
      })
    );

    return resolved
      .filter(
        (entry): entry is ImpactAnalysis["cascadingImpact"][number] =>
          entry !== null
      )
      .sort((a, b) => a.level - b.level);
  }

  async analyzeImpact(
    changes: ImpactAnalysisRequest["changes"],
    options: { includeIndirect?: boolean; maxDepth?: number } = {}
  ): Promise<ImpactAnalysis> {
    if (!Array.isArray(changes) || changes.length === 0) {
      return this.buildEmptyImpact();
    }

    const includeIndirect = options.includeIndirect !== false;
    const maxDepth =
      options.maxDepth && Number.isFinite(options.maxDepth)
        ? Math.max(1, Math.min(8, Math.floor(options.maxDepth)))
        : 3;

    const analysis = this.buildEmptyImpact();
    let processedAny = false;
    const specAggregates = new Map<
      string,
      {
        spec?: Spec;
        priority?: "critical" | "high" | "medium" | "low";
        impactLevel?: "critical" | "high" | "medium" | "low";
        status?: Spec["status"] | "unknown";
        ownerTeams: Set<string>;
        acceptanceCriteriaIds: Set<string>;
        relationships: ImpactAnalysis["specImpact"]["relatedSpecs"][number]["relationships"];
      }
    >();
    const specRequiredUpdates: string[] = [];
    const specAcceptanceCriteriaRefs = new Set<string>();

    for (const change of changes) {
      if (!change || !change.entityId) {
        continue;
      }

      try {
        const entity = await this.getEntity(change.entityId);
        const entityLabel = entity
          ? this.getEntityLabel(entity)
          : change.entityId;

        // Direct dependents (entities that rely on the changed entity)
        const dependentRelationships = await this.getRelationshipsSafe({
          toEntityId: change.entityId,
          type: IMPACT_CODE_RELATIONSHIP_TYPES,
          limit: 200,
        });

        if (dependentRelationships.length > 0) {
          const dependents = Array.from(
            (
              await this.getEntitiesByIds(
                dependentRelationships.map((rel) => rel.fromEntityId)
              )
            ).values()
          );

          if (dependents.length > 0) {
            analysis.directImpact.push({
              entities: dependents,
              severity: this.determineDirectSeverity(change, dependents.length),
              reason: `${dependents.length} entit${
                dependents.length === 1 ? "y" : "ies"
              } depend on ${entityLabel}`,
            });
          }

          if (includeIndirect) {
            const cascading = await this.computeCascadingImpact(
              change,
              dependentRelationships,
              maxDepth
            );
            analysis.cascadingImpact.push(...cascading);
          }
        }

        // Upstream dependencies (entities that the changed entity relies on)
        const dependencyRelationships = await this.getRelationshipsSafe({
          fromEntityId: change.entityId,
          type: IMPACT_CODE_RELATIONSHIP_TYPES,
          limit: 200,
        });

        if (
          dependencyRelationships.length > 0 &&
          (change.changeType === "delete" || change.signatureChange)
        ) {
          const dependencies = Array.from(
            (
              await this.getEntitiesByIds(
                dependencyRelationships.map((rel) => rel.toEntityId)
              )
            ).values()
          );

          if (dependencies.length > 0) {
            analysis.directImpact.push({
              entities: dependencies,
              severity: change.changeType === "delete" ? "high" : "medium",
              reason: `${entityLabel} interacts with ${
                dependencies.length
              } critical dependenc${dependencies.length === 1 ? "y" : "ies"}`,
            });
          }
        }

        // Test impact
        const testRelationships = await this.getRelationshipsSafe({
          toEntityId: change.entityId,
          type: TEST_IMPACT_RELATIONSHIP_TYPES,
          limit: 200,
        });

        if (testRelationships.length > 0) {
          const testsById = await this.getEntitiesByIds(
            testRelationships.map((rel) => rel.fromEntityId)
          );

          for (const rel of testRelationships) {
            const testEntity = testsById.get(rel.fromEntityId) as
              | Test
              | undefined;
            if (testEntity) {
              analysis.testImpact.affectedTests.push(testEntity);
            }

            const testLabel = testEntity
              ? this.getEntityLabel(testEntity)
              : rel.fromEntityId;
            analysis.testImpact.requiredUpdates.push(
              `Update test ${testLabel} to reflect changes in ${entityLabel}`
            );
            analysis.testImpact.coverageImpact +=
              this.computeCoverageContribution(rel, testEntity);
          }
        }

        // Documentation impact
        const documentationRelationships = await this.getRelationshipsSafe({
          toEntityId: change.entityId,
          type: DOCUMENTATION_IMPACT_RELATIONSHIP_TYPES,
          limit: 200,
        });

        if (documentationRelationships.length === 0) {
          analysis.documentationImpact.missingDocs.push({
            entityId: change.entityId,
            entityName: entityLabel,
            reason: "No linked documentation",
          });
          analysis.documentationImpact.requiredUpdates.push(
            `Author or link documentation for ${entityLabel}`
          );
          analysis.documentationImpact.freshnessPenalty += 2;
        } else {
          const docsById = await this.getEntitiesByIds(
            documentationRelationships.map((rel) => rel.fromEntityId)
          );

          for (const rel of documentationRelationships) {
            const docEntity = docsById.get(rel.fromEntityId);
            if (!docEntity) {
              continue;
            }

            const docAny = docEntity as any;
            const docTitle = docAny.title || this.getEntityLabel(docEntity);
            const docStatus = docAny.status || "unknown";
            const relMeta = ((rel as any)?.metadata || {}) as Record<
              string,
              any
            >;
            const stalenessScore =
              typeof relMeta.stalenessScore === "number"
                ? relMeta.stalenessScore
                : 0;
            const isStale =
              docStatus !== "active" ||
              (typeof relMeta.isStale === "boolean" && relMeta.isStale) ||
              stalenessScore > 0.4;

            if (isStale) {
              analysis.documentationImpact.staleDocs.push({
                docId: docEntity.id,
                title: docTitle,
                status: docStatus,
                relationship: rel.type,
                stalenessScore: stalenessScore || undefined,
              });
              analysis.documentationImpact.requiredUpdates.push(
                `Refresh documentation ${docTitle} to reflect ${entityLabel}`
              );
              analysis.documentationImpact.freshnessPenalty +=
                stalenessScore > 0
                  ? Math.min(
                      5,
                      Math.max(1, Number((stalenessScore * 5).toFixed(1)))
                    )
                  : 1;
            } else {
              analysis.documentationImpact.requiredUpdates.push(
                `Validate documentation ${docTitle} still matches ${entityLabel}`
              );
              analysis.documentationImpact.freshnessPenalty += 0.5;
            }
          }
        }

        // Specification impact
        const specRelationships = await this.getRelationshipsSafe({
          toEntityId: change.entityId,
          type: SPEC_RELATIONSHIP_TYPES,
          limit: 200,
        });

        if (specRelationships.length > 0) {
          const specEntities = await this.getEntitiesByIds(
            specRelationships.map((rel) => rel.fromEntityId)
          );

          for (const rel of specRelationships) {
            if (!rel.fromEntityId) {
              continue;
            }

            const metadata = ((rel as any)?.metadata || {}) as Record<
              string,
              any
            >;
            const specEntity = specEntities.get(rel.fromEntityId) as
              | Spec
              | undefined;

            const relationshipImpact = this.normalizeSpecImpactLevel(
              (rel as any)?.impactLevel ?? metadata.impactLevel
            );
            const relationshipPriority = this.normalizeSpecPriority(
              (rel as any)?.priority ?? metadata.priority
            );
            const specPriority = this.normalizeSpecPriority(
              specEntity?.priority ?? metadata.specPriority
            );
            const normalizedPriority = this.pickHigherPriority(
              relationshipPriority,
              specPriority
            );
            const specStatus =
              this.normalizeSpecStatus(specEntity?.status) ||
              this.normalizeSpecStatus(metadata.status);
            const relationshipStatus = this.normalizeSpecStatus(
              metadata.status
            );

            const acceptanceIds = new Set<string>();
            if (typeof metadata.acceptanceCriteriaId === "string") {
              acceptanceIds.add(metadata.acceptanceCriteriaId);
            }
            if (Array.isArray(metadata.acceptanceCriteriaIds)) {
              for (const id of metadata.acceptanceCriteriaIds) {
                if (typeof id === "string" && id.trim().length > 0) {
                  acceptanceIds.add(id.trim());
                }
              }
            }

            const aggregate = specAggregates.get(rel.fromEntityId) || {
              spec: specEntity,
              priority: normalizedPriority,
              impactLevel: relationshipImpact,
              status: specStatus,
              ownerTeams: new Set<string>(),
              acceptanceCriteriaIds: new Set<string>(),
              relationships: [] as Array<{
                type: RelationshipType;
                impactLevel?: "critical" | "high" | "medium" | "low";
                priority?: "critical" | "high" | "medium" | "low";
                acceptanceCriteriaId?: string;
                acceptanceCriteriaIds?: string[];
                rationale?: string;
                ownerTeam?: string;
                confidence?: number;
                status?: Spec["status"] | "unknown";
              }>,
            };

            aggregate.spec = specEntity ?? aggregate.spec;
            aggregate.priority = this.pickHigherPriority(
              aggregate.priority,
              normalizedPriority
            );
            aggregate.impactLevel = this.pickHigherImpactLevel(
              aggregate.impactLevel,
              relationshipImpact
            );
            aggregate.status =
              specStatus !== "unknown" ? specStatus : aggregate.status;

            const ownerTeam =
              typeof metadata.ownerTeam === "string"
                ? metadata.ownerTeam.trim()
                : undefined;
            if (ownerTeam) {
              aggregate.ownerTeams.add(ownerTeam);
            }

            for (const id of acceptanceIds) {
              aggregate.acceptanceCriteriaIds.add(id);
              specAcceptanceCriteriaRefs.add(id);
            }

            aggregate.relationships.push({
              type: rel.type,
              impactLevel: relationshipImpact,
              priority: relationshipPriority ?? normalizedPriority,
              acceptanceCriteriaId:
                acceptanceIds.size === 1
                  ? Array.from(acceptanceIds)[0]
                  : undefined,
              acceptanceCriteriaIds:
                acceptanceIds.size > 1 ? Array.from(acceptanceIds) : undefined,
              rationale:
                typeof metadata.rationale === "string"
                  ? metadata.rationale
                  : undefined,
              ownerTeam,
              confidence:
                typeof metadata.confidence === "number"
                  ? metadata.confidence
                  : undefined,
              status: relationshipStatus,
            });

            specAggregates.set(rel.fromEntityId, aggregate);

            const specTitle =
              specEntity?.title || specEntity?.name || rel.fromEntityId;
            const priorityLabel = aggregate.priority ?? normalizedPriority;
            const statusLabel =
              aggregate.status !== "unknown" ? aggregate.status : "unspecified";

            if (priorityLabel === "critical") {
              specRequiredUpdates.push(
                `Resolve critical spec ${specTitle} (${statusLabel}) before deploying changes to ${entityLabel}`
              );
            } else if (priorityLabel === "high") {
              specRequiredUpdates.push(
                `Coordinate with spec ${specTitle} (${statusLabel}) to validate changes to ${entityLabel}`
              );
            } else if (aggregate.status !== "implemented") {
              specRequiredUpdates.push(
                `Review spec ${specTitle} (${statusLabel}) for potential adjustments after modifying ${entityLabel}`
              );
            }
          }
        }

        processedAny = true;
      } catch (error) {
        console.error(
          `[ImpactAnalysis] Failed to process change ${change.entityId}:`,
          error
        );
      }
    }

    if (specAggregates.size > 0 || specAcceptanceCriteriaRefs.size > 0) {
      const specEntries: ImpactAnalysis["specImpact"]["relatedSpecs"] = [];
      const prioritySummary = { critical: 0, high: 0, medium: 0, low: 0 };
      const impactSummary = { critical: 0, high: 0, medium: 0, low: 0 };
      const statusSummary = {
        draft: 0,
        approved: 0,
        implemented: 0,
        deprecated: 0,
        unknown: 0,
      };
      let pendingSpecs = 0;

      for (const [specId, aggregate] of specAggregates.entries()) {
        const priorityKey = aggregate.priority;
        const impactKey = aggregate.impactLevel;
        const statusKey = aggregate.status ?? "unknown";

        if (priorityKey) {
          prioritySummary[priorityKey] += 1;
        }
        if (impactKey) {
          impactSummary[impactKey] += 1;
        }
        if (statusKey in statusSummary) {
          statusSummary[statusKey as keyof typeof statusSummary] += 1;
        } else {
          statusSummary.unknown += 1;
        }
        if (
          statusKey === "draft" ||
          statusKey === "approved" ||
          statusKey === "unknown"
        ) {
          pendingSpecs += 1;
        }

        const ownerTeams = Array.from(aggregate.ownerTeams.values());
        const acceptanceCriteriaIds = Array.from(
          aggregate.acceptanceCriteriaIds.values()
        );
        const spec = aggregate.spec;

        specEntries.push({
          specId,
          spec: spec
            ? {
                id: spec.id,
                title: spec.title,
                priority: spec.priority,
                status: spec.status,
                assignee: spec.assignee,
                tags: spec.tags,
              }
            : undefined,
          priority: aggregate.priority,
          impactLevel: aggregate.impactLevel,
          status: aggregate.status,
          ownerTeams,
          acceptanceCriteriaIds,
          relationships: aggregate.relationships,
        });
      }

      analysis.specImpact.relatedSpecs = specEntries;
      analysis.specImpact.summary = {
        byPriority: prioritySummary,
        byImpactLevel: impactSummary,
        statuses: statusSummary,
        acceptanceCriteriaReferences: specAcceptanceCriteriaRefs.size,
        pendingSpecs,
      };
      analysis.specImpact.requiredUpdates = this.dedupeStrings([
        ...analysis.specImpact.requiredUpdates,
        ...specRequiredUpdates,
      ]);
    }

    if (!processedAny) {
      return this.buildEmptyImpact();
    }

    analysis.directImpact = analysis.directImpact.filter(
      (entry) => Array.isArray(entry.entities) && entry.entities.length > 0
    );
    analysis.cascadingImpact = analysis.cascadingImpact.sort(
      (a, b) => a.level - b.level
    );
    analysis.testImpact.affectedTests = this.dedupeEntities(
      analysis.testImpact.affectedTests
    ) as Test[];
    analysis.testImpact.requiredUpdates = this.dedupeStrings(
      analysis.testImpact.requiredUpdates
    );
    analysis.testImpact.coverageImpact = Number(
      analysis.testImpact.coverageImpact.toFixed(2)
    );

    // Deduplicate documentation arrays
    const staleDocsById = new Map<string, any>();
    for (const doc of analysis.documentationImpact.staleDocs || []) {
      if (doc?.docId && !staleDocsById.has(doc.docId)) {
        staleDocsById.set(doc.docId, doc);
      }
    }
    analysis.documentationImpact.staleDocs = Array.from(staleDocsById.values());

    const missingDocsByEntity = new Map<string, any>();
    for (const doc of analysis.documentationImpact.missingDocs || []) {
      if (doc?.entityId && !missingDocsByEntity.has(doc.entityId)) {
        missingDocsByEntity.set(doc.entityId, doc);
      }
    }
    analysis.documentationImpact.missingDocs = Array.from(
      missingDocsByEntity.values()
    );

    analysis.documentationImpact.requiredUpdates = this.dedupeStrings(
      analysis.documentationImpact.requiredUpdates
    );
    analysis.documentationImpact.freshnessPenalty = Number(
      analysis.documentationImpact.freshnessPenalty.toFixed(2)
    );

    analysis.deploymentGate = this.evaluateDeploymentGate(
      analysis.documentationImpact
    );
    analysis.recommendations = this.generateImpactRecommendations(
      analysis.directImpact,
      analysis.cascadingImpact,
      analysis.testImpact,
      analysis.documentationImpact,
      analysis.specImpact
    );

    return analysis;
  }

  // Path finding and traversal
  async findPaths(query: PathQuery): Promise<any[]> {
    let cypherQuery: string;
    const params: any = { startId: query.startEntityId };

    // Build the query based on whether relationship types are specified
    if (query.relationshipTypes && query.relationshipTypes.length > 0) {
      // FalkorDB syntax for relationship types with depth
      const relTypes = query.relationshipTypes.join("|");
      cypherQuery = `
        MATCH path = (start {id: $startId})-[:${relTypes}*1..${
        query.maxDepth || 5
      }]-(end ${query.endEntityId ? "{id: $endId}" : ""})
        RETURN [node IN nodes(path) | node.id] AS nodeIds
        LIMIT 10
      `;
    } else {
      // No specific relationship types
      cypherQuery = `
        MATCH path = (start {id: $startId})-[*1..${query.maxDepth || 5}]-(end ${
        query.endEntityId ? "{id: $endId}" : ""
      })
        RETURN [node IN nodes(path) | node.id] AS nodeIds
        LIMIT 10
      `;
    }

    if (query.endEntityId) {
      params.endId = query.endEntityId;
    }

    const result = await this.graphDbQuery(cypherQuery, params);
    // Expect rows like: { nodeIds: ["id1","id2",...] }
    return result.map((row: any) => {
      // Ensure we always return an array of node IDs
      if (Array.isArray(row.nodeIds)) {
        return row.nodeIds;
      } else if (Array.isArray(row)) {
        return row;
      } else {
        // If neither, return an empty array to prevent type errors
        return [];
      }
    });
  }

  async traverseGraph(query: TraversalQuery): Promise<Entity[]> {
    let cypherQuery: string;
    const params: any = { startId: query.startEntityId };

    if (query.relationshipTypes && query.relationshipTypes.length > 0) {
      const relTypes = query.relationshipTypes.join("|");
      cypherQuery = `
        MATCH (start {id: $startId})-[:${relTypes}*1..${
        query.maxDepth || 3
      }]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
    } else {
      cypherQuery = `
        MATCH (start {id: $startId})-[*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
    }

    const result = await this.graphDbQuery(cypherQuery, params);
    return result.map((row: any) => this.parseEntityFromGraph(row));
  }

  // Vector embedding operations
  async createEmbeddingsBatch(
    entities: Entity[],
    options?: { checkpointId?: string }
  ): Promise<void> {
    try {
      const inputs = entities.map((entity) => ({
        content: this.getEntityContentForEmbedding(entity),
        entityId: entity.id,
      }));

      const batchResult = await embeddingService.generateEmbeddingsBatch(
        inputs
      );

      // Build one upsert per collection with all points
      const byCollection = new Map<
        string,
        Array<{ id: number; vector: number[]; payload: any }>
      >();
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const embedding = batchResult.results[i].embedding;
        const collection = this.getEmbeddingCollection(entity);
        const hasCodebaseProps = this.hasCodebaseProperties(entity);
        const numericId = this.stringToNumericId(entity.id);

        const payload = {
          entityId: entity.id,
          type: entity.type,
          path: hasCodebaseProps ? (entity as any).path : "",
          language: hasCodebaseProps ? (entity as any).language : "",
          lastModified: hasCodebaseProps
            ? (entity as any).lastModified.toISOString()
            : new Date().toISOString(),
          ...(options?.checkpointId
            ? { checkpointId: options.checkpointId }
            : {}),
        };

        const list = byCollection.get(collection) || [];
        list.push({ id: numericId, vector: embedding, payload });
        byCollection.set(collection, list);
      }

      for (const [collection, points] of byCollection.entries()) {
        await this.db.qdrant.upsert(collection, { points });
      }

      console.log(
        `✅ Created embeddings for ${entities.length} entities (${
          batchResult.totalTokens
        } tokens, $${batchResult.totalCost.toFixed(4)})`
      );
    } catch (error) {
      console.error("Failed to create batch embeddings:", error);
      // Fallback to individual processing
      for (const entity of entities) {
        await this.createEmbedding(entity);
      }
    }
  }

  private async createEmbedding(entity: Entity): Promise<void> {
    try {
      const content = this.getEntityContentForEmbedding(entity);
      const embedding = await this.generateEmbedding(content);

      const collection = this.getEmbeddingCollection(entity);
      const hasCodebaseProps = this.hasCodebaseProperties(entity);

      // Convert string ID to numeric ID for Qdrant
      const numericId = this.stringToNumericId(entity.id);

      await this.db.qdrant.upsert(collection, {
        points: [
          {
            id: numericId,
            vector: embedding,
            payload: {
              entityId: entity.id,
              type: entity.type,
              path: hasCodebaseProps ? (entity as any).path : "",
              language: hasCodebaseProps ? (entity as any).language : "",
              lastModified: hasCodebaseProps
                ? (entity as any).lastModified.toISOString()
                : new Date().toISOString(),
            },
          },
        ],
      });

      console.log(
        `✅ Created embedding for entity ${entity.id} in ${collection}`
      );
    } catch (error) {
      console.error(
        `Failed to create embedding for entity ${entity.id}:`,
        error
      );
    }
  }

  private async updateEmbedding(entity: Entity): Promise<void> {
    await this.deleteEmbedding(entity.id);
    await this.createEmbedding(entity);
  }

  private async deleteEmbedding(entityId: string): Promise<void> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    // Use the same filter for both collections to delete by entityId in payload
    const filter = {
      filter: {
        must: [
          {
            key: "entityId",
            match: { value: resolvedId },
          },
        ],
      },
    };

    try {
      await this.db.qdrant.delete(this.qdrantCollection("code"), filter);
    } catch (error) {
      // Collection might not exist or no matching points
    }

    try {
      await this.db.qdrant.delete(
        this.qdrantCollection("documentation"),
        filter
      );
    } catch (error) {
      // Collection might not exist or no matching points
    }
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    try {
      const result = await embeddingService.generateEmbedding(content);
      return result.embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      // Fallback to mock embedding
      return Array.from({ length: 1536 }, () => Math.random() - 0.5);
    }
  }

  // Helper methods
  private getEntityLabels(entity: Entity): string[] {
    const labels = ["Entity", entity.type];

    // Add specific labels based on entity type
    if (entity.type === "file") {
      const fileEntity = entity as File;
      if (fileEntity.isTest) labels.push("test" as any);
      if (fileEntity.isConfig) labels.push("config" as any);
    }

    return labels;
  }

  private sanitizeProperties(entity: Entity): Record<string, any> {
    const props: Record<string, any> = {};

    // Copy all properties with proper type conversion
    for (const [key, value] of Object.entries(entity)) {
      if (key === "metadata") {
        // Store metadata as JSON string
        if (value && typeof value === "object") {
          props[key] = JSON.stringify(value);
        }
        continue;
      }

      if (value instanceof Date) {
        // Convert dates to ISO strings
        props[key] = value.toISOString();
      } else if (value === null || value === undefined) {
        // Skip null/undefined values
        continue;
      } else if (typeof value === "object" && value !== null) {
        // Convert complex objects to JSON strings
        try {
          props[key] = JSON.stringify(value);
        } catch {
          // Skip objects that can't be serialized
          continue;
        }
      } else {
        // Copy primitive values directly
        props[key] = value;
      }
    }

    return props;
  }

  private hydrateEntityProperties(properties: Record<string, any>): Entity {
    if (!properties || typeof properties !== "object") {
      return properties as Entity;
    }

    const dateFields = [
      "lastModified",
      "created",
      "lastIndexed",
      "lastAnalyzed",
      "lastValidated",
      "snapshotCreated",
      "snapshotTakenAt",
      "updated",
      "updatedAt",
      "firstSeenAt",
      "lastSeenAt",
    ];
    for (const field of dateFields) {
      const value = (properties as any)[field];
      if (typeof value === "string") {
        const parsedDate = new Date(value);
        if (!Number.isNaN(parsedDate.valueOf())) {
          (properties as any)[field] = parsedDate;
        }
      }
    }

    const jsonFields = [
      "metadata",
      "dependencies",
      "businessDomains",
      "stakeholders",
      "technologies",
      "memberEntities",
      "extractedFrom",
      "keyProcesses",
      "coverage",
      "executionHistory",
      "performanceMetrics",
    ];
    for (const field of jsonFields) {
      const value = (properties as any)[field];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
          try {
            (properties as any)[field] = JSON.parse(trimmed);
          } catch {
            // Keep original string if parsing fails
          }
        }
      }
    }

    const numericFields = ["size", "lines", "version"];
    for (const field of numericFields) {
      const value = (properties as any)[field];
      if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          (properties as any)[field] = parsed;
        }
      }
    }

    const coerceNumber = (value: unknown): number | undefined => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const coerceDate = (value: unknown): Date | undefined => {
      if (value instanceof Date) return value;
      if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
      }
      return undefined;
    };

    const coverage = (properties as any).coverage;
    if (coverage && typeof coverage === "object") {
      for (const key of ["lines", "branches", "functions", "statements"]) {
        const coerced = coerceNumber((coverage as any)[key]);
        if (coerced !== undefined) (coverage as any)[key] = coerced;
      }
    }

    const executionHistory = (properties as any).executionHistory;
    if (Array.isArray(executionHistory)) {
      (properties as any).executionHistory = executionHistory.map((entry: any) => {
        if (!entry || typeof entry !== "object") return entry;
        const normalized: any = { ...entry };
        const ts = coerceDate(normalized.timestamp);
        if (ts) normalized.timestamp = ts;
        const duration = coerceNumber(normalized.duration);
        if (duration !== undefined) normalized.duration = duration;
        if (normalized.coverage && typeof normalized.coverage === "object") {
          for (const key of ["lines", "branches", "functions", "statements"]) {
            const coerced = coerceNumber(normalized.coverage[key]);
            if (coerced !== undefined) normalized.coverage[key] = coerced;
          }
        }
        return normalized;
      });
    }

    const perfMetrics = (properties as any).performanceMetrics;
    if (perfMetrics && typeof perfMetrics === "object") {
      const numericPerfFields = [
        "averageExecutionTime",
        "p95ExecutionTime",
        "successRate",
        "baselineExecutionTime",
        "minExecutionTime",
        "maxExecutionTime",
      ];
      for (const field of numericPerfFields) {
        const coerced = coerceNumber(perfMetrics[field]);
        if (coerced !== undefined) perfMetrics[field] = coerced;
      }
      if (Array.isArray(perfMetrics.benchmarkComparisons)) {
        perfMetrics.benchmarkComparisons = perfMetrics.benchmarkComparisons.map(
          (benchmark: any) => {
            if (!benchmark || typeof benchmark !== "object") return benchmark;
            const normalized: any = { ...benchmark };
            const threshold = coerceNumber(normalized.threshold);
            if (threshold !== undefined) normalized.threshold = threshold;
            const value = coerceNumber(normalized.value);
            if (value !== undefined) normalized.value = value;
            return normalized;
          }
        );
      }
      if (Array.isArray(perfMetrics.historicalData)) {
        perfMetrics.historicalData = perfMetrics.historicalData.map((entry: any) => {
          if (!entry || typeof entry !== "object") return entry;
          const normalized: any = { ...entry };
          const ts =
            coerceDate(normalized.timestamp) ||
            coerceDate(normalized.time) ||
            coerceDate(normalized.recordedAt);
          if (ts) normalized.timestamp = ts;
          const execTime = coerceNumber(normalized.executionTime);
          if (execTime !== undefined) normalized.executionTime = execTime;
          const avgExec = coerceNumber(normalized.averageExecutionTime);
          if (avgExec !== undefined) normalized.averageExecutionTime = avgExec;
          else if (
            normalized.averageExecutionTime === undefined &&
            execTime !== undefined
          ) {
            normalized.averageExecutionTime = execTime;
          }
          const p95Exec = coerceNumber(normalized.p95ExecutionTime);
          if (p95Exec !== undefined) normalized.p95ExecutionTime = p95Exec;
          const effectiveExec =
            normalized.executionTime ??
            normalized.averageExecutionTime ??
            normalized.p95ExecutionTime;
          if (
            normalized.executionTime === undefined &&
            typeof effectiveExec === "number"
          ) {
            normalized.executionTime = effectiveExec;
          }
          const success = coerceNumber(normalized.successRate);
          if (success !== undefined) normalized.successRate = success;
          const coveragePct = coerceNumber(normalized.coveragePercentage);
          if (coveragePct !== undefined) normalized.coveragePercentage = coveragePct;
          if (normalized.runId != null && typeof normalized.runId !== "string") {
            normalized.runId = String(normalized.runId);
          }
          return normalized;
        });
      }
    }

    return properties as Entity;
  }

  private parseEntityFromGraph(graphNode: any): Entity {
    // Parse entity from FalkorDB result format
    // Typical formats observed:
    // - { n: [[key,value], ...] }
    // - { connected: [[key,value], ...] }
    // - [[key,value], ...]
    // - { n: [...], labels: [...]} (labels handled inside pairs)

    const toPropsFromPairs = (pairs: any[]): Record<string, any> => {
      const properties: any = {};
      for (const [key, value] of pairs) {
        if (key === "properties") {
          // Parse nested properties which contain the actual entity data
          if (Array.isArray(value)) {
            const nestedProps: any = {};
            for (const [propKey, propValue] of value) {
              nestedProps[propKey] = propValue;
            }

            // The actual entity properties are stored in the nested properties
            Object.assign(properties, nestedProps);
          }
        } else if (key === "labels") {
          // Extract type from labels (first label is usually the type)
          if (Array.isArray(value) && value.length > 0) {
            properties.type = value[0];
          }
        } else {
          // Store other direct node properties (but don't overwrite properties from nested props)
          if (!properties[key]) {
            properties[key] = value;
          }
        }
      }
      return properties;
    };

    const isPairArray = (v: any): v is any[] =>
      Array.isArray(v) &&
      v.length > 0 &&
      Array.isArray(v[0]) &&
      v[0].length === 2;

    // Case 1: explicit 'n'
    if (graphNode && graphNode.n && isPairArray(graphNode.n)) {
      const properties = toPropsFromPairs(graphNode.n);

      // Convert date strings back to Date objects
      return this.hydrateEntityProperties(properties);
    }

    // Case 2: explicit 'connected' alias
    if (graphNode && graphNode.connected && isPairArray(graphNode.connected)) {
      const properties = toPropsFromPairs(graphNode.connected);
      return this.hydrateEntityProperties(properties);
    }

    // Case 3: node returned directly as array-of-pairs
    if (isPairArray(graphNode)) {
      const properties = toPropsFromPairs(graphNode);
      return this.hydrateEntityProperties(properties);
    }

    // Case 4: already an object with id
    if (
      graphNode &&
      typeof graphNode === "object" &&
      typeof graphNode.id === "string"
    ) {
      return this.hydrateEntityProperties({ ...(graphNode as any) });
    }

    // Fallback for other formats
    return this.hydrateEntityProperties(graphNode as Record<string, any>);
  }

  private parseRelationshipFromGraph(graphResult: any): GraphRelationship {
    // Parse relationship from FalkorDB result format
    // FalkorDB returns: { r: [...relationship data...], fromId: "string", toId: "string" }

    if (graphResult && graphResult.r) {
      const relData = graphResult.r;

      // If it's an array format, parse it
      if (Array.isArray(relData)) {
        const properties: any = {};

        for (const [key, value] of relData) {
          if (key === "properties" && Array.isArray(value)) {
            // Parse nested properties
            const nestedProps: any = {};
            for (const [propKey, propValue] of value) {
              nestedProps[propKey] = propValue;
            }
            Object.assign(properties, nestedProps);
          } else if (key === "type") {
            // Store the relationship type
            properties.type = value;
          } else if (key !== "src_node" && key !== "dest_node") {
            // Store other direct properties (like id, created, etc.)
            properties[key] = value;
          }
          // Skip src_node and dest_node as we use fromId/toId from top level
        }

        // Use the string IDs from the top level instead of numeric node IDs
        properties.fromEntityId = graphResult.fromId;
        properties.toEntityId = graphResult.toId;

        // Parse dates and metadata
        if (properties.created && typeof properties.created === "string") {
          properties.created = new Date(properties.created);
        }
        if (
          properties.lastModified &&
          typeof properties.lastModified === "string"
        ) {
          properties.lastModified = new Date(properties.lastModified);
        }
        if (properties.metadata && typeof properties.metadata === "string") {
          try {
            properties.metadata = JSON.parse(properties.metadata);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }

        // Rehydrate structured location from flat properties if present
        try {
          const lp = (properties as any).location_path;
          const ll = (properties as any).location_line;
          const lc = (properties as any).location_col;
          if (lp != null || ll != null || lc != null) {
            (properties as any).location = {
              ...(lp != null ? { path: lp } : {}),
              ...(typeof ll === "number" ? { line: ll } : {}),
              ...(typeof lc === "number" ? { column: lc } : {}),
            };
          }
          // Do not leak internal fields to callers
          delete (properties as any).location_path;
          delete (properties as any).location_line;
          delete (properties as any).location_col;
          // Evidence and locations as first-class JSON; if stored as JSON strings, parse them
          const ev = (properties as any).evidence;
          if (typeof ev === "string") {
            try {
              (properties as any).evidence = JSON.parse(ev);
            } catch {}
          }
          const locs = (properties as any).locations;
          if (typeof locs === "string") {
            try {
              (properties as any).locations = JSON.parse(locs);
            } catch {}
          }
          const conf = (properties as any).confidenceInterval;
          if (typeof conf === "string") {
            try {
              (properties as any).confidenceInterval = JSON.parse(conf);
            } catch {}
          }
          const metricsHistory = (properties as any).metricsHistory;
          if (typeof metricsHistory === "string") {
            try {
              const parsed = JSON.parse(metricsHistory);
              if (Array.isArray(parsed)) {
                (properties as any).metricsHistory = parsed.map((entry: any) => {
                  if (entry && typeof entry === "object" && entry.timestamp) {
                    const ts = new Date(entry.timestamp);
                    if (!Number.isNaN(ts.valueOf())) entry.timestamp = ts;
                  }
                  return entry;
                });
              }
            } catch {}
          } else if (Array.isArray(metricsHistory)) {
            (properties as any).metricsHistory = metricsHistory.map((entry: any) => {
              if (entry && typeof entry === "object" && entry.timestamp) {
                const ts = new Date(entry.timestamp);
                if (!Number.isNaN(ts.valueOf())) entry.timestamp = ts;
              }
              return entry;
            });
          }
          // genericArguments may be stored as JSON string
          const gargs = (properties as any).genericArguments;
          if (typeof gargs === "string") {
            try {
              (properties as any).genericArguments = JSON.parse(gargs);
            } catch {}
          }
          // first/last seen timestamps
          if (
            (properties as any).firstSeenAt &&
            typeof (properties as any).firstSeenAt === "string"
          ) {
            try {
              (properties as any).firstSeenAt = new Date(
                (properties as any).firstSeenAt
              );
            } catch {}
          }
          if (
            (properties as any).lastSeenAt &&
            typeof (properties as any).lastSeenAt === "string"
          ) {
            try {
              (properties as any).lastSeenAt = new Date(
                (properties as any).lastSeenAt
              );
            } catch {}
          }
          const detectedAtRaw = (properties as any).detectedAt;
          if (typeof detectedAtRaw === "string") {
            const detectedAt = new Date(detectedAtRaw);
            if (!Number.isNaN(detectedAt.valueOf())) {
              (properties as any).detectedAt = detectedAt;
            }
          }
          const resolvedAtRaw = (properties as any).resolvedAt;
          if (typeof resolvedAtRaw === "string") {
            const resolvedAt = new Date(resolvedAtRaw);
            if (!Number.isNaN(resolvedAt.valueOf())) {
              (properties as any).resolvedAt = resolvedAt;
            }
          }
        } catch {}

        // Apply normalization when parsing from database to ensure consistency
        const normalized = this.normalizeRelationship(
          properties as GraphRelationship
        );
        return normalized;
      }
    }

    // Fallback to original format - also normalize
    const fallback = graphResult.r as GraphRelationship;
    return this.normalizeRelationship(fallback);
  }

  private getEntityContentForEmbedding(entity: Entity): string {
    return embeddingService.generateEntityContent(entity);
  }

  private getEmbeddingCollection(entity: Entity): string {
    return entity.type === "documentation"
      ? this.qdrantCollection("documentation")
      : this.qdrantCollection("code");
  }

  private getEntitySignature(entity: Entity): string {
    switch (entity.type) {
      case "symbol":
        const symbolEntity = entity as any;
        if (symbolEntity.kind === "function") {
          return symbolEntity.signature;
        } else if (symbolEntity.kind === "class") {
          return `class ${symbolEntity.name}`;
        }
        return symbolEntity.signature;
      default:
        return this.hasCodebaseProperties(entity)
          ? (entity as any).path
          : entity.id;
    }
  }

  async listEntities(
    options: {
      type?: string;
      kind?: string;
      language?: string;
      path?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entities: Entity[]; total: number }> {
    const {
      type,
      kind,
      language,
      path,
      tags,
      limit = 50,
      offset = 0,
    } = options;

    let query = "MATCH (n)";
    const whereClause: string[] = [];
    const params: Record<string, unknown> = {};

    // Add type filter
    if (type) {
      whereClause.push("n.type = $type");
      params.type = type;
    }

    if (kind) {
      whereClause.push("n.kind = $kind");
      params.kind = kind;
    }

    // Add language filter
    if (language) {
      whereClause.push("n.language = $language");
      params.language = language;
    }

    // Add path filter
    if (path) {
      whereClause.push("n.path CONTAINS $path");
      params.path = path;
    }

    // Add tags filter (if metadata contains tags)
    if (tags && tags.length > 0) {
      whereClause.push("ANY(tag IN $tags WHERE n.metadata CONTAINS tag)");
      params.tags = tags;
    }

    const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN n
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = offset;
    params.limit = limit;

    const result = await this.graphDbQuery(fullQuery, params);
    const entities = result.map((row: any) => this.parseEntityFromGraph(row));

    // Get total count
    const countQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN count(n) as total
    `;

    const countResult = await this.graphDbQuery(countQuery, params);
    const total = countResult[0]?.total || 0;

    return { entities, total };
  }

  async getEntitiesByFile(
    filePath: string,
    options: { includeSymbols?: boolean } = {}
  ): Promise<Entity[]> {
    if (!filePath || typeof filePath !== "string") {
      return [];
    }

    const relative = path.isAbsolute(filePath)
      ? path.relative(process.cwd(), filePath)
      : filePath;
    const normalized = relative.replace(/\\/g, "/").replace(/^file:/, "");
    const fileId = `file:${normalized}`;
    const symbolPrefix = `${normalized}:`;

    const query = `
      MATCH (n)
      WHERE n.path = $filePath
         OR n.id = $fileId
         OR n.path STARTS WITH $symbolPrefix
         OR (exists(n.filePath) AND n.filePath = $filePath)
      RETURN n
    `;

    const rows = await this.graphDbQuery(query, {
      filePath: normalized,
      fileId,
      symbolPrefix,
    });

    const entities: Entity[] = [];
    const seen = new Set<string>();

    for (const row of rows || []) {
      const entity = this.parseEntityFromGraph(row);
      if (!entity?.id) continue;

      if (!options.includeSymbols && entity.type === "symbol") {
        // Skip symbols when not requested explicitly.
        continue;
      }

      if (!seen.has(entity.id)) {
        seen.add(entity.id);
        entities.push(entity);
      }
    }

    return entities;
  }

  async listRelationships(
    options: {
      fromEntity?: string;
      toEntity?: string;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ relationships: GraphRelationship[]; total: number }> {
    const { fromEntity, toEntity, type, limit = 50, offset = 0 } = options;

    let query = "MATCH (from)-[r]->(to)";
    const whereClause: string[] = [];
    const params: any = {};

    // Add from entity filter
    if (fromEntity) {
      whereClause.push("from.id = $fromEntity");
      params.fromEntity = fromEntity;
    }

    // Add to entity filter
    if (toEntity) {
      whereClause.push("to.id = $toEntity");
      params.toEntity = toEntity;
    }

    // Add relationship type filter
    if (type) {
      whereClause.push("type(r) = $type");
      params.type = type;
    }

    const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN r, from.id as fromId, to.id as toId
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = offset;
    params.limit = limit;

    const result = await this.graphDbQuery(fullQuery, params);
    const relationships = result.map((row: any) => {
      const relationship = this.parseRelationshipFromGraph(row);
      return {
        ...relationship,
        fromEntityId: row.fromId,
        toEntityId: row.toId,
      };
    });

    // Get total count
    const countQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN count(r) as total
    `;

    const countResult = await this.graphDbQuery(countQuery, params);
    const total = countResult[0]?.total || 0;

    return { relationships, total };
  }

  async listModuleChildren(
    modulePath: string,
    options: ModuleChildrenOptions = {}
  ): Promise<ModuleChildrenResult> {
    if (typeof modulePath !== "string") {
      return { modulePath: "", children: [] };
    }

    const originalInput = modulePath.trim();
    const normalizedPath = originalInput.replace(/\\/g, "/");
    if (normalizedPath.length === 0) {
      return { modulePath: "", children: [] };
    }

    const entityPrefix = this.namespaceScope.entityPrefix || "";
    const rawIdCandidate = originalInput;
    const prefixedIdCandidate = this.namespaceScope.applyEntityPrefix(
      rawIdCandidate
    );
    const parentRows = await this.graphDbQuery(
      `MATCH (n)
       WHERE ($entityPrefix = "" OR n.id STARTS WITH $entityPrefix)
         AND (
           n.path = $path
           OR n.modulePath = $path
           OR n.id = $rawId
           OR n.id = $prefixedId
         )
       RETURN n
       ORDER BY
         CASE
           WHEN n.type IN ['module', 'directory', 'file'] THEN 0
           WHEN n.type IN ['symbol'] THEN 1
           ELSE 2
         END,
         CASE
           WHEN n.id = $prefixedId THEN 0
           WHEN n.id = $rawId THEN 1
           WHEN n.path = $path THEN 2
           ELSE 3
         END
       LIMIT 1`,
      {
        path: normalizedPath,
        rawId: rawIdCandidate,
        prefixedId: prefixedIdCandidate,
        entityPrefix,
      }
    );

    const parentEntity =
      parentRows && parentRows[0]
        ? this.parseEntityFromGraph(parentRows[0])
        : null;
    if (!parentEntity?.id) {
      return { modulePath: normalizedPath, children: [] };
    }

    const includeFiles = options.includeFiles !== false;
    const includeSymbols = options.includeSymbols !== false;
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);

    const toStringList = (value?: string | string[]): string[] => {
      if (!value) return [];
      const raw = Array.isArray(value) ? value : [value];
      const flattened = raw.flatMap((entry) =>
        typeof entry === "string" ? entry.split(",") : []
      );
      return flattened
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    };

    const languageFilters = toStringList(options.language).map((entry) =>
      entry.toLowerCase()
    );
    const symbolKindFilters = toStringList(options.symbolKind).map((entry) =>
      entry.toLowerCase()
    );
    const modulePathPrefixRaw =
      typeof options.modulePathPrefix === "string"
        ? options.modulePathPrefix.trim()
        : undefined;
    const modulePathPrefix =
      modulePathPrefixRaw && modulePathPrefixRaw.length > 0
        ? this.normalizeModulePathFilter(modulePathPrefixRaw)
        : undefined;

    const filters: string[] = [
      "coalesce(r.active, true) = true",
      "coalesce(child.active, true) = true",
    ];
    if (!includeFiles) filters.push("child.type <> 'file'");
    if (!includeSymbols) filters.push("child.type <> 'symbol'");
    if (languageFilters.length === 1) {
      filters.push(
        "(child.type IN ['module', 'directory']"
          + " OR (r.language IS NOT NULL AND toLower(r.language) = $languageFilter)"
          + " OR (toLower(coalesce(child.language, '')) = $languageFilter))"
      );
    } else if (languageFilters.length > 1) {
      filters.push(
        "(child.type IN ['module', 'directory']"
          + " OR (r.language IS NOT NULL AND toLower(r.language) IN $languageFilterList)"
          + " OR (toLower(coalesce(child.language, '')) IN $languageFilterList))"
      );
    }
    if (symbolKindFilters.length === 1) {
      filters.push(
        "(child.type <> 'symbol' OR toLower(coalesce(child.kind, '')) = $symbolKindFilter)"
      );
    } else if (symbolKindFilters.length > 1) {
      filters.push(
        "(child.type <> 'symbol' OR toLower(coalesce(child.kind, '')) IN $symbolKindFilterList)"
      );
    }
    if (modulePathPrefix) {
      filters.push(
        "coalesce(child.modulePath, child.path, '') STARTS WITH $modulePathPrefix"
      );
    }
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const params: Record<string, any> = {
      parentId: parentEntity.id,
      limit,
    };
    if (languageFilters.length === 1) params.languageFilter = languageFilters[0];
    if (languageFilters.length > 1) params.languageFilterList = languageFilters;
    if (symbolKindFilters.length === 1)
      params.symbolKindFilter = symbolKindFilters[0];
    if (symbolKindFilters.length > 1)
      params.symbolKindFilterList = symbolKindFilters;
    if (modulePathPrefix) params.modulePathPrefix = modulePathPrefix;

    const rows = await this.graphDbQuery(
      `
        MATCH (parent {id: $parentId})-[r:CONTAINS]->(child)
        ${whereClause}
        RETURN child, r
        ORDER BY child.type, coalesce(child.name, child.id)
        LIMIT $limit
      `,
      params
    );

    const children = (rows || []).map((row: any) => {
      const entity = this.parseEntityFromGraph(row.child);
      if (!entity?.id) {
        return null;
      }
      const relationship = this.parseRelationshipFromGraph({
        r: row.r,
        fromId: parentEntity.id,
        toId: entity.id,
      });
      return { entity, relationship } as StructuralNavigationEntry;
    }).filter(Boolean) as StructuralNavigationEntry[];

    return {
      modulePath: parentEntity.path || normalizedPath,
      parentId: parentEntity.id,
      children,
    };
  }

  async getModuleHistory(
    modulePath: string,
    options: ModuleHistoryOptions = {}
  ): Promise<ModuleHistoryResult> {
    const normalizedPath =
      typeof modulePath === "string"
        ? modulePath.trim().replace(/\\/g, "/")
        : "";
    const generatedAt = new Date();

    if (normalizedPath.length === 0) {
      return {
        moduleId: null,
        modulePath: "",
        moduleType: undefined,
        generatedAt,
        versions: [],
        relationships: [],
      };
    }

    let moduleEntity: Entity | null = null;

    try {
      const candidate = await this.getEntity(normalizedPath);
      if (candidate?.id) moduleEntity = candidate;
    } catch {}

    if (!moduleEntity?.id) {
      const moduleRows = await this.graphDbQuery(
        `MATCH (m)
         WHERE (m.path = $path OR m.modulePath = $path)
            OR m.id = $path
         RETURN m
         ORDER BY CASE
           WHEN m.type = 'module' THEN 0
           WHEN m.type = 'file' THEN 1
           ELSE 2
         END
         LIMIT 1
        `,
        { path: normalizedPath }
      );

      if (moduleRows && moduleRows[0]) {
        const row = moduleRows[0];
        moduleEntity = this.parseEntityFromGraph((row as any).m ?? row);
      }
    }

    if (!moduleEntity?.id) {
      return {
        moduleId: null,
        modulePath: normalizedPath,
        moduleType: undefined,
        generatedAt,
        versions: [],
        relationships: [],
      };
    }

    const structuralTypes: string[] = [
      RelationshipType.CONTAINS,
      RelationshipType.DEFINES,
      RelationshipType.EXPORTS,
      RelationshipType.IMPORTS,
    ];

    const limitRaw = Number.isFinite(options.limit)
      ? Number(options.limit)
      : 200;
    const limit = Math.max(1, Math.min(500, Math.floor(limitRaw)));
    const includeInactive = options.includeInactive !== false;

    const relationshipRows = await this.graphDbQuery(
      `
        MATCH (m {id: $moduleId})-[r]->(other)
        WHERE type(r) IN $types
        RETURN r,
               r.id AS id,
               type(r) AS type,
               m.id AS fromId,
               other.id AS toId,
               other AS other,
               r.validFrom AS validFrom,
               r.validTo AS validTo,
               coalesce(r.active, r.validTo IS NULL) AS active,
               r.lastModified AS lastModified,
               r.temporal AS temporal,
               r.segmentId AS segmentId,
               r.lastChangeSetId AS lastChangeSetId,
               r.firstSeenAt AS firstSeenAt,
               r.lastSeenAt AS lastSeenAt,
               r.scope AS scope,
               r.confidence AS confidence,
               r.metadata AS metadata,
               coalesce(r.lastModified, r.firstSeenAt, r.validFrom) AS sortKey
        UNION ALL
        MATCH (other)-[r]->(m {id: $moduleId})
        WHERE type(r) IN $types
        RETURN r,
               r.id AS id,
               type(r) AS type,
               other.id AS fromId,
               m.id AS toId,
               other AS other,
               r.validFrom AS validFrom,
               r.validTo AS validTo,
               coalesce(r.active, r.validTo IS NULL) AS active,
               r.lastModified AS lastModified,
               r.temporal AS temporal,
               r.segmentId AS segmentId,
               r.lastChangeSetId AS lastChangeSetId,
               r.firstSeenAt AS firstSeenAt,
               r.lastSeenAt AS lastSeenAt,
               r.scope AS scope,
               r.confidence AS confidence,
               r.metadata AS metadata,
               coalesce(r.lastModified, r.firstSeenAt, r.validFrom) AS sortKey
        ORDER BY sortKey DESC
        LIMIT $limit
      `,
      {
        moduleId: moduleEntity.id,
        types: structuralTypes,
        limit,
      }
    );

    const moduleSummary = this.toModuleHistorySummary(moduleEntity);
    const relationships: ModuleHistoryRelationship[] = [];
    const seen = new Set<string>();

    for (const row of relationshipRows || []) {
      if (!row || !row.id) continue;
      if (seen.has(row.id)) continue;
      const timeline = this.buildRelationshipTimelineFromRow(row);
      if (!timeline) continue;
      seen.add(row.id);

      const parsedRelationship = this.parseRelationshipFromGraph({
        r: row.r,
        fromId: row.fromId,
        toId: row.toId,
      });

      const otherEntity = row.other
        ? this.parseEntityFromGraph(row.other)
        : null;
      const direction: "outgoing" | "incoming" =
        row.fromId === moduleEntity.id ? "outgoing" : "incoming";

      const fromSummary =
        direction === "outgoing"
          ? moduleSummary
          : this.toModuleHistorySummary(otherEntity, row.fromId);
      const toSummary =
        direction === "outgoing"
          ? this.toModuleHistorySummary(otherEntity, row.toId)
          : moduleSummary;

      let metadata: Record<string, any> | undefined;
      if (
        parsedRelationship.metadata &&
        typeof parsedRelationship.metadata === "object"
      ) {
        metadata = parsedRelationship.metadata as Record<string, any>;
      } else if (typeof row.metadata === "string") {
        try {
          metadata = JSON.parse(row.metadata);
        } catch {
          metadata = undefined;
        }
      } else if (row.metadata && typeof row.metadata === "object") {
        metadata = row.metadata as Record<string, any>;
      }

      const toFiniteNumber = (value: unknown): number | null => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string") {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      const toNonEmptyString = (value: unknown): string | null => {
        if (typeof value !== "string") return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const confidenceValue =
        toFiniteNumber(row.confidence) ??
        toFiniteNumber((parsedRelationship as any).confidence) ??
        toFiniteNumber(metadata?.confidence) ??
        null;

      const scopeValue =
        toNonEmptyString(row.scope) ??
        toNonEmptyString((parsedRelationship as any).scope) ??
        toNonEmptyString(metadata?.scope) ??
        null;

      const firstSeenAt =
        this.toDate(row.firstSeenAt) ||
        this.toDate((parsedRelationship as any).firstSeenAt) ||
        null;
      const lastSeenAt =
        this.toDate(row.lastSeenAt) ||
        this.toDate((parsedRelationship as any).lastSeenAt) ||
        null;
      const lastModified =
        this.toDate(row.lastModified) ||
        this.toDate((parsedRelationship as any).lastModified) ||
        undefined;

      relationships.push({
        relationshipId: timeline.relationshipId,
        type: timeline.type,
        direction,
        from: fromSummary,
        to: toSummary,
        active: timeline.active,
        current: timeline.current,
        segments: timeline.segments,
        firstSeenAt,
        lastSeenAt,
        confidence: confidenceValue,
        scope: scopeValue,
        metadata,
        temporal: timeline.temporal,
        lastModified,
      });
      if (process.env.DEBUG_MODULE_HISTORY === "1") {
        console.log(
          "moduleHistory.timeline",
          timeline.relationshipId,
          timeline.active,
          timeline.segments
        );
      }
    }

    const filteredRelationships = includeInactive
      ? relationships
      : relationships.filter((rel) => rel.active);

    const sortValue = (rel: ModuleHistoryRelationship): number => {
      const candidates: Array<Date | null | undefined> = [
        rel.lastModified,
        rel.lastSeenAt ?? undefined,
        rel.firstSeenAt ?? undefined,
      ];
      for (const candidate of candidates) {
        if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
          return candidate.getTime();
        }
      }
      return 0;
    };

    filteredRelationships.sort((a, b) => sortValue(b) - sortValue(a));

    const versionLimitRaw = Number.isFinite(options.versionLimit)
      ? Number(options.versionLimit)
      : Number.isFinite(options.limit)
      ? Number(options.limit)
      : 50;
    const versionLimit = Math.max(1, Math.min(200, Math.floor(versionLimitRaw)));
    const versionsTimeline = await this.getEntityTimeline(moduleEntity.id, {
      includeRelationships: false,
      limit: versionLimit,
    });

    return {
      moduleId: moduleEntity.id,
      modulePath: moduleEntity.path || normalizedPath,
      moduleType: moduleEntity.type,
      generatedAt,
      versions: versionsTimeline.versions,
      relationships: filteredRelationships,
    };
  }

  private toModuleHistorySummary(
    entity: Entity | null | undefined,
    fallbackId?: string
  ): ModuleHistoryEntitySummary {
    const summary: ModuleHistoryEntitySummary = {
      id: entity?.id ?? fallbackId ?? "unknown",
    };
    if (entity) {
      const candidate: any = entity;
      if (typeof candidate.type === "string") summary.type = candidate.type;
      if (typeof candidate.name === "string") summary.name = candidate.name;
      if (typeof candidate.path === "string") summary.path = candidate.path;
      if (typeof candidate.language === "string")
        summary.language = candidate.language;
    }
    return summary;
  }

  async listImports(
    entityId: string,
    options: ListImportsOptions = {}
  ): Promise<ListImportsResult> {
    const resolvedId = this.resolveEntityIdInput(entityId);
    const limit = Math.min(Math.max(options.limit ?? 200, 1), 1000);
    const modulePathFilter = this.normalizeModulePathFilterInput(
      options.modulePath as string | string[] | undefined
    );
    const modulePathPrefixFilter =
      typeof options.modulePathPrefix === "string"
        ? this.normalizeModulePathFilter(options.modulePathPrefix)
        : undefined;

    const relationshipQuery: RelationshipQuery = {
      fromEntityId: resolvedId,
      type: RelationshipType.IMPORTS,
      limit,
    } as RelationshipQuery;

    if (options.language) {
      (relationshipQuery as any).language = options.language;
    }
    if (options.symbolKind) {
      (relationshipQuery as any).symbolKind = options.symbolKind;
    }
    if (options.importAlias) {
      (relationshipQuery as any).importAlias = options.importAlias;
    }
    if (options.importType) {
      (relationshipQuery as any).importType = options.importType;
    }
    if (typeof options.isNamespace === "boolean") {
      (relationshipQuery as any).isNamespace = options.isNamespace;
    }
    if (modulePathFilter !== undefined) {
      (relationshipQuery as any).modulePath = modulePathFilter;
    }
    if (modulePathPrefixFilter) {
      (relationshipQuery as any).modulePathPrefix = modulePathPrefixFilter;
    }

    const relationships = await this.getRelationships(relationshipQuery);
    const activeRelationships = relationships.filter(
      (rel) => (rel as any).active !== false
    );
    const filtered = options.resolvedOnly
      ? activeRelationships.filter(
          (rel) =>
            rel.resolutionState === "resolved" ||
            (rel as any).resolved === true
        )
      : activeRelationships;

    const resolvedTargetIds = filtered
      .map((rel) => this.resolveOptionalEntityId(rel.toEntityId))
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const targetsMap: Map<string, Entity> = resolvedTargetIds.length
      ? await this.getEntitiesByIds(resolvedTargetIds)
      : new Map();

    const imports: ImportEntry[] = filtered.map((rel) => {
      const resolvedId = this.resolveOptionalEntityId(rel.toEntityId);
      const target = resolvedId ? targetsMap.get(resolvedId) ?? null : null;
      return { relationship: rel, target };
    });

    return { entityId: resolvedId, imports };
  }

  async findDefinition(symbolId: string): Promise<DefinitionLookupResult> {
    const resolvedId = this.resolveEntityIdInput(symbolId);
    const relationships = await this.getRelationships({
      toEntityId: resolvedId,
      type: RelationshipType.DEFINES,
      limit: 1,
    });

    const relationship = relationships[0] ?? null;
    let source: Entity | null = null;
    if (relationship?.fromEntityId) {
      try {
        source = await this.getEntity(relationship.fromEntityId);
      } catch {
        source = null;
      }
    }

    return {
      symbolId: resolvedId,
      relationship,
      source,
    };
  }

  private stringToNumericId(stringId: string): number {
    // Create a numeric hash from string ID for Qdrant compatibility
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
      const char = stringId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number
    return Math.abs(hash);
  }

  private sanitizeParameterName(name: string): string {
    // Replace invalid characters with underscores to create valid Cypher parameter names
    // Cypher parameter names must match /^[a-zA-Z_][a-zA-Z0-9_]*$/
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}
