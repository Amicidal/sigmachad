/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { RelationshipType, } from "../models/relationships.js";
import { noiseConfig } from "../config/noise.js";
import { embeddingService } from "../utils/embedding.js";
import { normalizeCodeEdge, canonicalRelationshipId, isCodeRelationship } from "../utils/codeEdges.js";
import { EventEmitter } from "events";
import crypto from "crypto";
class SimpleCache {
    constructor(maxSize = 100, defaultTTL = 300000) {
        this.cache = new Map();
        // 5 minutes default TTL
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }
    generateKey(obj) {
        return JSON.stringify(obj, Object.keys(obj).sort());
    }
    get(key) {
        const cacheKey = this.generateKey(key);
        const entry = this.cache.get(cacheKey);
        if (!entry)
            return null;
        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(cacheKey);
            return null;
        }
        return entry.data;
    }
    set(key, value, ttl) {
        const cacheKey = this.generateKey(key);
        // If cache is at max size, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(cacheKey, {
            data: value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        });
    }
    clear() {
        this.cache.clear();
    }
    invalidate(pattern) {
        for (const [key] of this.cache) {
            if (pattern(key)) {
                this.cache.delete(key);
            }
        }
    }
    // Invalidate a specific entry using the same key normalization used internally
    invalidateKey(key) {
        const cacheKey = this.generateKey(key);
        this.invalidate((k) => k === cacheKey);
    }
}
export class KnowledgeGraphService extends EventEmitter {
    constructor(db) {
        super();
        this.db = db;
        this._lastPruneSummary = null;
        this.setMaxListeners(100); // Allow more listeners for WebSocket connections
        this.searchCache = new SimpleCache(500, 300000); // Increased cache size to 500 results for 5 minutes
        this.entityCache = new SimpleCache(1000, 600000); // Cache individual entities for 10 minutes
        // Best-effort: initialize helpful indices (guarded)
        try {
            this.ensureIndices().catch(() => { });
        }
        catch (_a) { }
    }
    // --- Phase 2: Dual-write auxiliary nodes for evidence, sites, candidates, and dataflow ---
    async dualWriteAuxiliaryForEdge(rIn) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const enable = String(process.env.EDGE_AUX_DUAL_WRITE || 'true').toLowerCase() !== 'false';
        if (!enable)
            return;
        const any = rIn;
        const edgeId = any.id;
        const nowISO = new Date().toISOString();
        // Upsert evidence nodes
        try {
            const ev = Array.isArray(any.evidence) ? any.evidence : (Array.isArray((_a = any.metadata) === null || _a === void 0 ? void 0 : _a.evidence) ? any.metadata.evidence : []);
            if (Array.isArray(ev) && ev.length > 0) {
                for (const e of ev.slice(0, 50)) {
                    const k = JSON.stringify({ edgeId, s: e.source || '', p: ((_b = e.location) === null || _b === void 0 ? void 0 : _b.path) || '', l: ((_c = e.location) === null || _c === void 0 ? void 0 : _c.line) || 0, c: ((_d = e.location) === null || _d === void 0 ? void 0 : _d.column) || 0 });
                    const eid = 'evid_' + crypto.createHash('sha1').update(k).digest('hex').slice(0, 20);
                    const props = {
                        id: eid,
                        edgeId,
                        source: e.source || null,
                        confidence: typeof e.confidence === 'number' ? e.confidence : null,
                        path: ((_e = e.location) === null || _e === void 0 ? void 0 : _e.path) || null,
                        line: typeof ((_f = e.location) === null || _f === void 0 ? void 0 : _f.line) === 'number' ? e.location.line : null,
                        column: typeof ((_g = e.location) === null || _g === void 0 ? void 0 : _g.column) === 'number' ? e.location.column : null,
                        note: e.note || null,
                        extractorVersion: e.extractorVersion || null,
                        createdAt: nowISO,
                        updatedAt: nowISO,
                    };
                    await this.db.falkordbQuery(`MERGE (n:edge_evidence { id: $id })
             ON CREATE SET n.createdAt = $createdAt
             SET n.edgeId = $edgeId, n.source = $source, n.confidence = $confidence,
                 n.path = $path, n.line = $line, n.column = $column, n.note = $note, n.extractorVersion = $extractorVersion,
                 n.updatedAt = $updatedAt`, props);
                }
            }
        }
        catch (_r) { }
        // Upsert site node
        try {
            const siteHash = any.siteHash;
            if (siteHash) {
                await this.db.falkordbQuery(`MERGE (s:edge_site { id: $id })
           SET s.edgeId = $edgeId,
               s.siteId = $siteId,
               s.path = $path,
               s.line = $line,
               s.column = $column,
               s.accessPath = $accessPath,
               s.updatedAt = $now`, {
                    id: siteHash,
                    edgeId,
                    siteId: any.siteId || null,
                    path: ((_h = any.location) === null || _h === void 0 ? void 0 : _h.path) || ((_j = any.metadata) === null || _j === void 0 ? void 0 : _j.path) || null,
                    line: typeof ((_k = any.location) === null || _k === void 0 ? void 0 : _k.line) === 'number' ? any.location.line : (typeof ((_l = any.metadata) === null || _l === void 0 ? void 0 : _l.line) === 'number' ? any.metadata.line : null),
                    column: typeof ((_m = any.location) === null || _m === void 0 ? void 0 : _m.column) === 'number' ? any.location.column : (typeof ((_o = any.metadata) === null || _o === void 0 ? void 0 : _o.column) === 'number' ? any.metadata.column : null),
                    accessPath: any.accessPath || ((_p = any.metadata) === null || _p === void 0 ? void 0 : _p.accessPath) || null,
                    now: nowISO,
                });
            }
        }
        catch (_s) { }
        // Upsert candidate nodes if present in metadata (from coordinator resolution)
        try {
            const cands = Array.isArray((_q = any.metadata) === null || _q === void 0 ? void 0 : _q.candidates) ? any.metadata.candidates : [];
            if (Array.isArray(cands) && cands.length > 0) {
                let rank = 0;
                for (const c of cands.slice(0, 20)) {
                    rank++;
                    const cidBase = `${edgeId}|${c.id || c.name || ''}|${rank}`;
                    const cid = 'cand_' + crypto.createHash('sha1').update(cidBase).digest('hex').slice(0, 20);
                    await this.db.falkordbQuery(`MERGE (n:edge_candidate { id: $id })
             ON CREATE SET n.createdAt = $now
             SET n.edgeId = $edgeId, n.candidateId = $candId, n.name = $name, n.path = $path,
                 n.resolver = $resolver, n.score = $score, n.rank = $rank, n.updatedAt = $now`, {
                        id: cid,
                        edgeId,
                        candId: c.id || null,
                        name: c.name || null,
                        path: c.path || null,
                        resolver: c.resolver || null,
                        score: typeof c.score === 'number' ? c.score : null,
                        rank,
                        now: nowISO,
                    });
                    // Optional: link to candidate entity if exists (guarded)
                    try {
                        if (c.id) {
                            await this.db.falkordbQuery(`MATCH (cand:edge_candidate {id: $cid}), (e {id: $eid})
                 MERGE (cand)-[:CANDIDATE_ENTITY]->(e)`, { cid, eid: c.id });
                        }
                    }
                    catch (_t) { }
                }
            }
        }
        catch (_u) { }
        // Phase 3: Dataflow nodes for READS/WRITES (optional)
        try {
            const dfEnable = String(process.env.EDGE_DATAFLOW_NODES || 'true').toLowerCase() !== 'false';
            if (dfEnable && (rIn.type === RelationshipType.READS || rIn.type === RelationshipType.WRITES)) {
                const dfId = any.dataFlowId;
                if (dfId) {
                    const fromId = rIn.fromEntityId;
                    const toId = rIn.toEntityId;
                    await this.db.falkordbQuery(`MERGE (df:dataflow { id: $id })
             ON CREATE SET df.createdAt = $now
             SET df.var = $var, df.file = $file, df.updatedAt = $now
             WITH df
             MATCH (a {id: $fromId})
             MERGE (a)-[:HAS_DATAFLOW]->(df)
             WITH df
             MATCH (b {id: $toId})
             MERGE (df)-[:DATAFLOW_TO]->(b)`, {
                        id: dfId,
                        var: any.to_ref_symbol || null,
                        file: any.to_ref_file || null,
                        now: nowISO,
                        fromId,
                        toId,
                    });
                }
            }
        }
        catch (_v) { }
    }
    /**
     * Phase 3: Compute and store lightweight materialized edge stats for an entity.
     */
    async computeAndStoreEdgeStats(entityId) {
        try {
            const byType = await this.db.falkordbQuery(`MATCH (a {id: $id})-[r]->()
         RETURN type(r) as t, count(r) as c`, { id: entityId });
            const topSymbols = await this.db.falkordbQuery(`MATCH (a {id: $id})-[r]->()
         WHERE r.to_ref_symbol IS NOT NULL
         RETURN r.to_ref_symbol as sym, count(*) as c
         ORDER BY c DESC LIMIT 10`, { id: entityId });
            const payload = {
                byType: (byType || []).map((row) => ({ type: row.t, count: row.c })),
                topSymbols: (topSymbols || []).map((row) => ({ symbol: row.sym, count: row.c })),
                updatedAt: new Date().toISOString(),
            };
            await this.db.falkordbQuery(`MERGE (s:edge_stats { id: $sid })
         SET s.entityId = $eid, s.payload = $payload, s.updatedAt = $now`, { sid: `stats_${entityId}`, eid: entityId, payload: JSON.stringify(payload), now: new Date().toISOString() });
        }
        catch (_a) { }
    }
    // --- Shared helpers (Phase 1: normalization/merge/unify) ---
    dedupeBy(arr, keyFn) {
        const seen = new Set();
        const out = [];
        for (const x of arr) {
            const k = keyFn(x);
            if (!seen.has(k)) {
                seen.add(k);
                out.push(x);
            }
        }
        return out;
    }
    mergeEvidenceArrays(oldArr, newArr, limit = 20) {
        const merged = this.dedupeBy([...(oldArr || []), ...(newArr || [])], (e) => { var _a, _b, _c; return `${e.source || ''}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ''}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ''}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ''}`; });
        return merged.slice(0, limit);
    }
    mergeLocationsArrays(oldArr, newArr, limit = 20) {
        const merged = this.dedupeBy([...(oldArr || []), ...(newArr || [])], (l) => `${l.path || ''}|${l.line || ''}|${l.column || ''}`);
        return merged.slice(0, limit);
    }
    // Best-effort: when a resolved edge is created, merge and retire placeholder edges (file:/external:/kind:)
    async unifyResolvedEdgePlaceholders(rel) {
        try {
            // Only unify for code-like edges and resolved targets
            const any = rel;
            const toKind = any.to_ref_kind;
            const toId = String(rel.toEntityId || '');
            const isResolved = (toKind === 'entity') || toId.startsWith('sym:');
            if (!isResolved)
                return;
            // Derive file/symbol/name for matching placeholders
            let file;
            let symbol;
            let name;
            try {
                if (typeof any.to_ref_file === 'string' && typeof any.to_ref_symbol === 'string') {
                    file = any.to_ref_file;
                    symbol = any.to_ref_symbol;
                    name = any.to_ref_name || any.to_ref_symbol;
                }
                else if (toId.startsWith('sym:')) {
                    const m = toId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
                    if (m) {
                        file = m[1];
                        symbol = m[2];
                        name = symbol;
                    }
                }
            }
            catch (_a) { }
            if (!file || !symbol)
                return;
            const type = rel.type;
            const fromId = rel.fromEntityId;
            const nowISO = new Date().toISOString();
            // Fetch candidate placeholder edges to merge: same from/type and matching file+symbol
            const q = `
        MATCH (a {id: $fromId})-[r:${type}]->(b)
        WHERE r.id <> $newId AND coalesce(r.active, true) = true
          AND r.to_ref_file = $file AND r.to_ref_symbol = $symbol
        RETURN r`;
            const rows = await this.db.falkordbQuery(q, { fromId, newId: rel.id, file, symbol });
            if (!rows || rows.length === 0)
                return;
            // Parse placeholder edge props
            const placeholders = rows.map((row) => this.parseRelationshipFromGraph(row));
            // Aggregate properties to fold into the resolved edge
            let occTotalAdd = 0;
            let occScanAdd = 0;
            let confMax = -Infinity;
            let firstSeenMin = null;
            let lastSeenMax = null;
            let evAgg = [];
            let locAgg = [];
            let sitesAgg = [];
            for (const p of placeholders) {
                const anyp = p;
                occTotalAdd += (typeof anyp.occurrencesTotal === 'number' ? anyp.occurrencesTotal : 0);
                occScanAdd += (typeof anyp.occurrencesScan === 'number' ? anyp.occurrencesScan : 0);
                if (typeof anyp.confidence === 'number')
                    confMax = Math.max(confMax, anyp.confidence);
                const fs = (anyp.firstSeenAt instanceof Date ? anyp.firstSeenAt.toISOString() : (typeof anyp.firstSeenAt === 'string' ? anyp.firstSeenAt : null));
                const ls = (anyp.lastSeenAt instanceof Date ? anyp.lastSeenAt.toISOString() : (typeof anyp.lastSeenAt === 'string' ? anyp.lastSeenAt : null));
                if (fs)
                    firstSeenMin = !firstSeenMin || fs < firstSeenMin ? fs : firstSeenMin;
                if (ls)
                    lastSeenMax = !lastSeenMax || ls > lastSeenMax ? ls : lastSeenMax;
                if (Array.isArray(anyp.evidence))
                    evAgg = this.mergeEvidenceArrays(evAgg, anyp.evidence);
                if (Array.isArray(anyp.locations))
                    locAgg = this.mergeLocationsArrays(locAgg, anyp.locations);
                if (Array.isArray(anyp.sites))
                    sitesAgg = Array.from(new Set(sitesAgg.concat(anyp.sites))).slice(0, 50);
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
            await this.db.falkordbQuery(update, {
                fromId,
                newId: rel.id,
                occTotalAdd,
                occScanAdd,
                confMax: Number.isFinite(confMax) ? confMax : null,
                firstSeenMin,
                lastSeenMax,
                evidence: evAgg.length > 0 ? JSON.stringify(evAgg).slice(0, 200000) : null,
                locations: locAgg.length > 0 ? JSON.stringify(locAgg).slice(0, 200000) : null,
                sites: sitesAgg.length > 0 ? JSON.stringify(sitesAgg).slice(0, 200000) : null,
            });
            // Retire placeholder edges (deactivate and close validity)
            const oldIds = placeholders.map((p) => p.id).filter(Boolean);
            if (oldIds.length > 0) {
                const retire = `
          UNWIND $ids AS rid
          MATCH ()-[r {id: rid}]-()
          SET r.active = false,
              r.validTo = coalesce(r.validTo, $now)
        `;
                await this.db.falkordbQuery(retire, { ids: oldIds, now: nowISO });
            }
        }
        catch (_b) {
            // best-effort; do not block
        }
    }
    // --- Internal helpers for relationship normalization and ranking ---
    normalizeRelationship(relIn) {
        // Create a shallow copy we can mutate safely
        const rel = { ...relIn };
        // Ensure timestamps and version
        if (!(rel.created instanceof Date))
            rel.created = new Date(rel.created || Date.now());
        if (!(rel.lastModified instanceof Date))
            rel.lastModified = new Date(rel.lastModified || Date.now());
        if (typeof rel.version !== "number")
            rel.version = 1;
        // Delegate code-edge normalization to shared normalizer to avoid drift
        if (isCodeRelationship(rel.type)) {
            Object.assign(rel, normalizeCodeEdge(rel));
        }
        // Generate a human-readable why if missing
        if (!rel.why) {
            const src = rel.source;
            const res = rel.resolution;
            const scope = rel.scope;
            const hints = [];
            if (src === 'type-checker' || res === 'type-checker')
                hints.push('resolved by type checker');
            else if (res === 'via-import')
                hints.push('via import deep resolution');
            else if (res === 'direct')
                hints.push('direct AST resolution');
            else if (src === 'heuristic' || res === 'heuristic')
                hints.push('heuristic match');
            if (scope)
                hints.push(`scope=${scope}`);
            if (hints.length > 0)
                rel.why = hints.join('; ');
        }
        return rel;
    }
    canonicalRelationshipId(fromId, toId, type) {
        // Build a temporary relationship shell to compute canonical key
        const rel = { fromEntityId: fromId, toEntityId: toId, type };
        return canonicalRelationshipId(fromId, rel);
    }
    directoryDistance(fromFile, candidatePath) {
        // Compare directory prefixes; smaller distance means closer
        const norm = (s) => String(s || '').replace(/\\/g, '/');
        const from = norm(fromFile);
        const cand = norm(candidatePath);
        const fromDir = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
        const candFile = cand.includes(':') ? cand.slice(0, cand.lastIndexOf(':')) : cand; // symbol path has ":name"
        const candDir = candFile.includes('/') ? candFile.slice(0, candFile.lastIndexOf('/')) : '';
        if (!fromDir || !candDir)
            return 9999;
        const fromParts = fromDir.split('/');
        const candParts = candDir.split('/');
        let i = 0;
        while (i < fromParts.length && i < candParts.length && fromParts[i] === candParts[i])
            i++;
        // distance = remaining hops
        return (fromParts.length - i) + (candParts.length - i);
    }
    isHistoryEnabled() {
        try {
            return (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false';
        }
        catch (_a) {
            return true;
        }
    }
    // --- History/Checkpoint stubs (to be implemented) ---
    /**
     * Append a compact version snapshot for an entity when its content changes.
     * Stub: returns a generated version id without writing to the graph.
     */
    async appendVersion(entity, opts) {
        if (!this.isHistoryEnabled()) {
            const vid = `ver_${(entity === null || entity === void 0 ? void 0 : entity.id) || 'disabled'}_${Date.now().toString(36)}`;
            console.log(`📝 [history disabled] appendVersion skipped; returning ${vid}`);
            return vid;
        }
        const entityId = entity === null || entity === void 0 ? void 0 : entity.id;
        if (!entityId)
            throw new Error('appendVersion: entity.id is required');
        const ts = ((opts === null || opts === void 0 ? void 0 : opts.timestamp) || new Date());
        const tsISO = ts.toISOString();
        const hash = (entity === null || entity === void 0 ? void 0 : entity.hash) || '';
        const path = (this.hasCodebaseProperties(entity) ? entity.path : undefined);
        const language = (this.hasCodebaseProperties(entity) ? entity.language : undefined);
        const vid = `ver_${entityId}_${hash || Date.now().toString(36)}`;
        // Create/merge version node and OF relationship
        const vprops = {
            id: vid,
            type: 'version',
            entityId,
            hash,
            timestamp: tsISO,
        };
        if (path)
            vprops.path = path;
        if (language)
            vprops.language = language;
        if (opts === null || opts === void 0 ? void 0 : opts.changeSetId)
            vprops.changeSetId = opts.changeSetId;
        await this.db.falkordbQuery(`MATCH (e {id: $entityId})
       MERGE (v:version { id: $vid })
       SET v += $vprops
       MERGE (v)-[of:OF { id: $ofId }]->(e)
       ON CREATE SET of.created = $ts, of.version = 1, of.metadata = '{}'
       SET of.lastModified = $ts
      `, { entityId, vid, vprops, ts: tsISO, ofId: `rel_${vid}_${entityId}_OF` });
        // Link to previous version if exists (chain among version nodes)
        const prev = await this.db.falkordbQuery(`MATCH (e {id: $entityId})<-[:OF]-(pv:version)
       WHERE pv.id <> $vid AND pv.timestamp <= $ts
       RETURN pv.id AS id, pv.timestamp AS ts
       ORDER BY ts DESC LIMIT 1
      `, { entityId, vid, ts: tsISO });
        if (prev && prev.length > 0) {
            const prevId = prev[0].id;
            await this.db.falkordbQuery(`MATCH (v:version {id: $vid}), (pv:version {id: $prevId})
         MERGE (v)-[r:PREVIOUS_VERSION { id: $rid }]->(pv)
         ON CREATE SET r.created = $ts, r.version = 1, r.metadata = '{}'
         SET r.lastModified = $ts
        `, { vid, prevId, ts: tsISO, rid: `rel_${vid}_${prevId}_PREVIOUS_VERSION` });
        }
        console.log({ event: 'history.version_created', entityId, versionId: vid, timestamp: tsISO });
        return vid;
    }
    /**
     * Open (or create) a relationship with a validity interval starting at ts.
     * Stub: logs intent; no-op.
     */
    async openEdge(fromId, toId, type, ts, changeSetId) {
        if (!this.isHistoryEnabled()) {
            console.log(`🔗 [history disabled] openEdge skipped for ${fromId}->${toId} ${type}`);
            return;
        }
        const at = (ts || new Date()).toISOString();
        const id = `rel_${fromId}_${toId}_${type}`;
        const meta = JSON.stringify(changeSetId ? { changeSetId } : {});
        const query = `
      MATCH (a {id: $fromId}), (b {id: $toId})
      MERGE (a)-[r:${type} { id: $id }]->(b)
      ON CREATE SET r.created = $at, r.version = 1, r.metadata = $meta, r.validFrom = $at, r.validTo = NULL
      SET r.lastModified = $at, r.validTo = NULL, r.version = coalesce(r.version, 0) + 1
    `;
        await this.db.falkordbQuery(query, { fromId, toId, id, at, meta });
        console.log({ event: 'history.edge_opened', id, type, fromId, toId, at });
    }
    /**
     * Close a relationship's validity interval at ts.
     * Stub: logs intent; no-op.
     */
    async closeEdge(fromId, toId, type, ts) {
        if (!this.isHistoryEnabled()) {
            console.log(`⛓️ [history disabled] closeEdge skipped for ${fromId}->${toId} ${type}`);
            return;
        }
        const at = (ts || new Date()).toISOString();
        const id = `rel_${fromId}_${toId}_${type}`;
        const query = `
      MATCH (a {id: $fromId})-[r:${type} { id: $id }]->(b {id: $toId})
      SET r.validTo = coalesce(r.validTo, $at), r.lastModified = $at, r.version = coalesce(r.version, 0) + 1
    `;
        await this.db.falkordbQuery(query, { fromId, toId, id, at });
        console.log({ event: 'history.edge_closed', id, type, fromId, toId, at });
    }
    /**
     * Create a checkpoint subgraph descriptor and (in full impl) link members.
     * Stub: returns a generated checkpointId.
     */
    async createCheckpoint(seedEntities, reason, hops, window) {
        if (!this.isHistoryEnabled()) {
            const checkpointId = `chk_${Date.now().toString(36)}`;
            console.log(`📌 [history disabled] createCheckpoint skipped; returning ${checkpointId}`);
            return { checkpointId };
        }
        const envHops = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || '', 10);
        const effectiveHops = Number.isFinite(envHops) && envHops > 0 ? envHops : (hops || 2);
        const hopsClamped = Math.max(1, Math.min(effectiveHops, 5));
        const checkpointId = `chk_${Date.now().toString(36)}`;
        const ts = new Date().toISOString();
        const seeds = seedEntities || [];
        const metadata = { reason, window: window || {} };
        // Create checkpoint node
        await this.db.falkordbQuery(`MERGE (c:checkpoint { id: $id })
       SET c.type = 'checkpoint', c.checkpointId = $id, c.timestamp = $ts, c.reason = $reason, c.hops = $hops, c.seedEntities = $seeds, c.metadata = $meta
      `, { id: checkpointId, ts, reason, hops, seeds: JSON.stringify(seeds), meta: JSON.stringify(metadata) });
        // Collect neighborhood member ids up to K hops
        const queryMembers = `
      UNWIND $seedIds AS sid
      MATCH (s {id: sid})
      WITH collect(s) AS seeds
      UNWIND seeds AS s
      MATCH (s)-[*1..${hopsClamped}]-(n)
      RETURN DISTINCT n.id AS id
    `;
        const res = await this.db.falkordbQuery(queryMembers, { seedIds: seeds });
        const memberIds = (res || []).map((row) => row.id).filter(Boolean);
        if (memberIds.length > 0) {
            const ridPrefix = `rel_chk_${checkpointId}_includes_`;
            await this.db.falkordbQuery(`UNWIND $members AS mid
         MATCH (n {id: mid}), (c:checkpoint {id: $cid})
         MERGE (c)-[r:CHECKPOINT_INCLUDES { id: $ridPrefix + mid }]->(n)
         ON CREATE SET r.created = $ts, r.version = 1, r.metadata = '{}'
         SET r.lastModified = $ts
        `, { members: memberIds, cid: checkpointId, ts, ridPrefix });
        }
        // Optional embeddings for checkpoint members with checkpointId payload tag
        const embedVersions = (process.env.HISTORY_EMBED_VERSIONS || 'false').toLowerCase() === 'true';
        if (embedVersions && memberIds.length > 0) {
            try {
                const nodes = await this.db.falkordbQuery(`UNWIND $ids AS id MATCH (n {id: id}) RETURN n`, { ids: memberIds });
                const entities = (nodes || []).map((row) => this.parseEntityFromGraph(row));
                if (entities.length > 0) {
                    await this.createEmbeddingsBatch(entities, { checkpointId });
                }
            }
            catch (e) {
                console.warn('Checkpoint embeddings failed:', e);
            }
        }
        console.log({ event: 'history.checkpoint_created', checkpointId, members: memberIds.length, reason, hops: hopsClamped, timestamp: ts });
        return { checkpointId };
    }
    /**
     * Prune history artifacts older than the retention window.
     * Stub: returns zeros.
     */
    async pruneHistory(retentionDays, opts) {
        var _a, _b, _c;
        if (!this.isHistoryEnabled()) {
            console.log(`🧹 [history disabled] pruneHistory no-op`);
            return { versionsDeleted: 0, edgesClosed: 0, checkpointsDeleted: 0 };
        }
        const cutoff = new Date(Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000).toISOString();
        const dry = !!(opts === null || opts === void 0 ? void 0 : opts.dryRun);
        // Delete old checkpoints (or count if dry-run)
        const delCheckpoints = await this.db.falkordbQuery(dry
            ? `MATCH (c:checkpoint) WHERE c.timestamp < $cutoff RETURN count(c) AS count`
            : `MATCH (c:checkpoint)
           WHERE c.timestamp < $cutoff
           WITH collect(c) AS cs
           FOREACH (x IN cs | DETACH DELETE x)
           RETURN size(cs) AS count`, { cutoff });
        const checkpointsDeleted = ((_a = delCheckpoints === null || delCheckpoints === void 0 ? void 0 : delCheckpoints[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        // Delete relationships that have been closed before cutoff (or count)
        const delEdges = await this.db.falkordbQuery(dry
            ? `MATCH ()-[r]-() WHERE r.validTo IS NOT NULL AND r.validTo < $cutoff RETURN count(r) AS count`
            : `MATCH ()-[r]-()
           WHERE r.validTo IS NOT NULL AND r.validTo < $cutoff
           WITH collect(r) AS rs
           FOREACH (x IN rs | DELETE x)
           RETURN size(rs) AS count`, { cutoff });
        const edgesClosed = ((_b = delEdges === null || delEdges === void 0 ? void 0 : delEdges[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        // Delete versions older than cutoff not referenced by non-expired checkpoints (or count)
        const delVersions = await this.db.falkordbQuery(dry
            ? `MATCH (v:version)
           WHERE v.timestamp < $cutoff AND NOT EXISTS ((:checkpoint)-[:CHECKPOINT_INCLUDES]->(v))
           RETURN count(v) AS count`
            : `MATCH (v:version)
           WHERE v.timestamp < $cutoff AND NOT EXISTS ((:checkpoint)-[:CHECKPOINT_INCLUDES]->(v))
           WITH collect(v) AS vs
           FOREACH (x IN vs | DETACH DELETE x)
           RETURN size(vs) AS count`, { cutoff });
        const versionsDeleted = ((_c = delVersions === null || delVersions === void 0 ? void 0 : delVersions[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
        console.log({ event: 'history.prune', dryRun: dry, retentionDays, cutoff, versions: versionsDeleted, closedEdges: edgesClosed, checkpoints: checkpointsDeleted });
        this._lastPruneSummary = { retentionDays, cutoff, versions: versionsDeleted, closedEdges: edgesClosed, checkpoints: checkpointsDeleted, ...(dry ? { dryRun: true } : {}) };
        return { versionsDeleted, edgesClosed, checkpointsDeleted };
    }
    /** Aggregate history-related metrics for admin */
    async getHistoryMetrics() {
        var _a, _b, _c, _d, _e, _f;
        // Parallelize counts
        const [nodesRow, relsRow, verRow, cpRow, openEdgesRow, closedEdgesRow, cpMembersRows] = await Promise.all([
            this.db.falkordbQuery(`MATCH (n) RETURN count(n) AS c`, {}),
            this.db.falkordbQuery(`MATCH ()-[r]-() RETURN count(r) AS c`, {}),
            this.db.falkordbQuery(`MATCH (v:version) RETURN count(v) AS c`, {}),
            this.db.falkordbQuery(`MATCH (c:checkpoint) RETURN count(c) AS c`, {}),
            this.db.falkordbQuery(`MATCH ()-[r]-() WHERE r.validFrom IS NOT NULL AND (r.validTo IS NULL) RETURN count(r) AS c`, {}),
            this.db.falkordbQuery(`MATCH ()-[r]-() WHERE r.validTo IS NOT NULL RETURN count(r) AS c`, {}),
            this.db.falkordbQuery(`MATCH (c:checkpoint) OPTIONAL MATCH (c)-[:CHECKPOINT_INCLUDES]->(n) RETURN c.id AS id, count(n) AS m`, {}),
        ]);
        const membersCounts = (cpMembersRows || []).map((r) => Number(r.m) || 0);
        const min = membersCounts.length ? Math.min(...membersCounts) : 0;
        const max = membersCounts.length ? Math.max(...membersCounts) : 0;
        const avg = membersCounts.length ? membersCounts.reduce((a, b) => a + b, 0) / membersCounts.length : 0;
        return {
            versions: ((_a = verRow === null || verRow === void 0 ? void 0 : verRow[0]) === null || _a === void 0 ? void 0 : _a.c) || 0,
            checkpoints: ((_b = cpRow === null || cpRow === void 0 ? void 0 : cpRow[0]) === null || _b === void 0 ? void 0 : _b.c) || 0,
            checkpointMembers: { avg, min, max },
            temporalEdges: { open: ((_c = openEdgesRow === null || openEdgesRow === void 0 ? void 0 : openEdgesRow[0]) === null || _c === void 0 ? void 0 : _c.c) || 0, closed: ((_d = closedEdgesRow === null || closedEdgesRow === void 0 ? void 0 : closedEdgesRow[0]) === null || _d === void 0 ? void 0 : _d.c) || 0 },
            lastPrune: this._lastPruneSummary || null,
            totals: { nodes: ((_e = nodesRow === null || nodesRow === void 0 ? void 0 : nodesRow[0]) === null || _e === void 0 ? void 0 : _e.c) || 0, relationships: ((_f = relsRow === null || relsRow === void 0 ? void 0 : relsRow[0]) === null || _f === void 0 ? void 0 : _f.c) || 0 },
        };
    }
    /** Inspect database indexes and evaluate expected coverage. */
    async getIndexHealth() {
        const expectedNames = [
            'file_path',
            'symbol_path',
            'version_entity',
            'checkpoint_id',
            'rel_valid_from',
            'rel_valid_to',
        ];
        const notes = [];
        try {
            const rows = await this.db.falkordbQuery("CALL db.indexes()", {});
            const textDump = JSON.stringify(rows || []).toLowerCase();
            const has = (token) => textDump.includes(token.toLowerCase());
            const health = {
                supported: true,
                indexes: rows,
                expected: {
                    file_path: has('file(path)') || has('file_path'),
                    symbol_path: has('symbol(path)') || has('symbol_path'),
                    version_entity: has('version(entityid)') || has('version_entity') || has('entityid'),
                    checkpoint_id: has('checkpoint(checkpointid)') || has('checkpoint_id') || has('checkpointid'),
                    rel_validFrom: has('validfrom') || has('rel_valid_from'),
                    rel_validTo: has('validto') || has('rel_valid_to'),
                },
                notes,
            };
            return health;
        }
        catch (e) {
            notes.push('db.indexes() not supported; using heuristic checks');
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
    async runBenchmarks(options) {
        var _a, _b, _c, _d;
        const mode = (options === null || options === void 0 ? void 0 : options.mode) || 'quick';
        const timings = {};
        const samples = {};
        const time = async (label, fn) => {
            const t0 = Date.now();
            const out = await fn();
            timings[label] = Date.now() - t0;
            return out;
        };
        // Totals
        const nodesRow = await time('nodes.count', async () => await this.db.falkordbQuery(`MATCH (n) RETURN count(n) AS c`, {}));
        const edgesRow = await time('edges.count', async () => await this.db.falkordbQuery(`MATCH ()-[r]-() RETURN count(r) AS c`, {}));
        const nodes = ((_a = nodesRow === null || nodesRow === void 0 ? void 0 : nodesRow[0]) === null || _a === void 0 ? void 0 : _a.c) || 0;
        const edges = ((_b = edgesRow === null || edgesRow === void 0 ? void 0 : edgesRow[0]) === null || _b === void 0 ? void 0 : _b.c) || 0;
        // Sample one id for targeted lookup
        const idRow = await time('sample.id.fetch', async () => await this.db.falkordbQuery(`MATCH (n) RETURN n.id AS id LIMIT 1`, {}));
        const sampleId = (_c = idRow === null || idRow === void 0 ? void 0 : idRow[0]) === null || _c === void 0 ? void 0 : _c.id;
        samples.entityId = sampleId || null;
        if (sampleId) {
            await time('lookup.byId', async () => await this.db.falkordbQuery(`MATCH (n {id: $id}) RETURN n`, { id: sampleId }));
        }
        // Versions and checkpoints
        await time('versions.count', async () => await this.db.falkordbQuery(`MATCH (v:version) RETURN count(v) AS c`, {}));
        const cpIdRow = await time('checkpoint.sample', async () => await this.db.falkordbQuery(`MATCH (c:checkpoint) RETURN c.id AS id LIMIT 1`, {}));
        const cpId = (_d = cpIdRow === null || cpIdRow === void 0 ? void 0 : cpIdRow[0]) === null || _d === void 0 ? void 0 : _d.id;
        samples.checkpointId = cpId || null;
        if (cpId) {
            await time('checkpoint.members', async () => await this.db.falkordbQuery(`MATCH (c:checkpoint {id: $id})-[:CHECKPOINT_INCLUDES]->(n) RETURN count(n) AS c`, { id: cpId }));
        }
        // Temporal edges
        await time('temporal.open', async () => await this.db.falkordbQuery(`MATCH ()-[r]-() WHERE r.validFrom IS NOT NULL AND r.validTo IS NULL RETURN count(r) AS c`, {}));
        await time('temporal.closed', async () => await this.db.falkordbQuery(`MATCH ()-[r]-() WHERE r.validTo IS NOT NULL RETURN count(r) AS c`, {}));
        // Time-travel traversal micro
        if (sampleId) {
            const until = new Date().toISOString();
            await time('timetravel.depth2', async () => this.timeTravelTraversal({ startId: sampleId, until: new Date(until), maxDepth: 2 }));
        }
        // Optional extended benchmarks
        if (mode === 'full') {
            // Neighbor fanout
            if (sampleId) {
                await time('neighbors.depth3', async () => await this.db.falkordbQuery(`MATCH (s {id: $id})-[:DEPENDS_ON|TYPE_USES*1..3]-(n) RETURN count(n) AS c`, { id: sampleId }));
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
    async ensureGraphIndexes() {
        const tries = [];
        const run = async (query) => {
            tries.push(query);
            try {
                await this.db.falkordbQuery(query, {});
            }
            catch (_a) { }
        };
        // Neo4j 4+/5 style
        await run("CREATE INDEX file_path IF NOT EXISTS FOR (n:file) ON (n.path)");
        await run("CREATE INDEX symbol_path IF NOT EXISTS FOR (n:symbol) ON (n.path)");
        await run("CREATE INDEX version_entity IF NOT EXISTS FOR (n:version) ON (n.entityId)");
        await run("CREATE INDEX checkpoint_id IF NOT EXISTS FOR (n:checkpoint) ON (n.checkpointId)");
        // Relationship property indexes (may be unsupported; best-effort)
        await run("CREATE INDEX rel_valid_from IF NOT EXISTS FOR ()-[r]-() ON (r.validFrom)");
        await run("CREATE INDEX rel_valid_to IF NOT EXISTS FOR ()-[r]-() ON (r.validTo)");
        await run("CREATE INDEX rel_id IF NOT EXISTS FOR ()-[r]-() ON (r.id)");
        await run("CREATE INDEX rel_confidence IF NOT EXISTS FOR ()-[r]-() ON (r.confidence)");
        await run("CREATE INDEX rel_kind IF NOT EXISTS FOR ()-[r]-() ON (r.kind)");
        await run("CREATE INDEX rel_source IF NOT EXISTS FOR ()-[r]-() ON (r.source)");
        await run("CREATE INDEX rel_firstSeen IF NOT EXISTS FOR ()-[r]-() ON (r.firstSeenAt)");
        await run("CREATE INDEX rel_lastSeen IF NOT EXISTS FOR ()-[r]-() ON (r.lastSeenAt)");
        await run("CREATE INDEX rel_siteHash IF NOT EXISTS FOR ()-[r]-() ON (r.siteHash)");
        await run("CREATE INDEX rel_active IF NOT EXISTS FOR ()-[r]-() ON (r.active)");
        await run("CREATE INDEX rel_occ_total IF NOT EXISTS FOR ()-[r]-() ON (r.occurrencesTotal)");
        await run("CREATE INDEX rel_to_ref_kind IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_kind)");
        await run("CREATE INDEX rel_to_ref_file IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_file)");
        await run("CREATE INDEX rel_to_ref_symbol IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_symbol)");
        await run("CREATE INDEX rel_from_ref_kind IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_kind)");
        await run("CREATE INDEX rel_from_ref_file IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_file)");
        await run("CREATE INDEX rel_from_ref_symbol IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_symbol)");
        // Fallback to legacy style
        await run("CREATE INDEX ON :file(path)");
        await run("CREATE INDEX ON :symbol(path)");
        await run("CREATE INDEX ON :version(entityId)");
        await run("CREATE INDEX ON :checkpoint(checkpointId)");
        console.log({ event: 'graph.indexes.ensure_attempted', attempts: tries.length });
    }
    /**
     * List checkpoints with optional filters and pagination.
     * Returns an array of checkpoint entities and the total count matching filters.
     */
    async listCheckpoints(options) {
        var _a, _b, _c;
        const reason = (options === null || options === void 0 ? void 0 : options.reason) || null;
        const sinceISO = (options === null || options === void 0 ? void 0 : options.since) ? new Date(options.since).toISOString() : null;
        const untilISO = (options === null || options === void 0 ? void 0 : options.until) ? new Date(options.until).toISOString() : null;
        const limit = Math.max(0, Math.min(500, Math.floor((_a = options === null || options === void 0 ? void 0 : options.limit) !== null && _a !== void 0 ? _a : 100)));
        const offset = Math.max(0, Math.floor((_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : 0));
        const where = `
      WHERE ($reason IS NULL OR c.reason = $reason)
        AND ($since IS NULL OR c.timestamp >= $since)
        AND ($until IS NULL OR c.timestamp <= $until)
    `;
        const totalRes = await this.db.falkordbQuery(`MATCH (c:checkpoint)
       ${where}
       RETURN count(c) AS total
      `, { reason, since: sinceISO, until: untilISO });
        const total = ((_c = totalRes === null || totalRes === void 0 ? void 0 : totalRes[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const rows = await this.db.falkordbQuery(`MATCH (c:checkpoint)
       ${where}
       OPTIONAL MATCH (c)-[:CHECKPOINT_INCLUDES]->(n)
       WITH c, count(n) AS memberCount
       RETURN c AS n, memberCount
       ORDER BY c.timestamp DESC
       SKIP $offset LIMIT $limit
      `, { reason, since: sinceISO, until: untilISO, offset, limit });
        const items = (rows || []).map((row) => {
            var _a;
            const cp = this.parseEntityFromGraph(row.n);
            return { ...cp, memberCount: (_a = row.memberCount) !== null && _a !== void 0 ? _a : 0 };
        });
        return { items, total };
    }
    /** Get a checkpoint node by id. */
    async getCheckpoint(id) {
        const rows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })
       RETURN c AS n
       LIMIT 1
      `, { id });
        if (!rows || rows.length === 0)
            return null;
        return this.parseEntityFromGraph(rows[0].n);
    }
    /** Get members of a checkpoint with pagination. */
    async getCheckpointMembers(id, options) {
        var _a, _b, _c;
        const limit = Math.max(0, Math.min(1000, Math.floor((_a = options === null || options === void 0 ? void 0 : options.limit) !== null && _a !== void 0 ? _a : 100)));
        const offset = Math.max(0, Math.floor((_b = options === null || options === void 0 ? void 0 : options.offset) !== null && _b !== void 0 ? _b : 0));
        const totalRes = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN count(n) AS total
      `, { id });
        const total = ((_c = totalRes === null || totalRes === void 0 ? void 0 : totalRes[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const rows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN n
       SKIP $offset LIMIT $limit
      `, { id, offset, limit });
        const items = (rows || []).map((row) => this.parseEntityFromGraph(row));
        return { items, total };
    }
    /**
     * Time-scoped traversal starting from a node, filtering relationships by validFrom/validTo.
     * atTime: edges active at a specific moment.
     * since/until: edges overlapping a time window.
     */
    async timeTravelTraversal(query) {
        var _a;
        const depth = Math.max(1, Math.min(5, Math.floor((_a = query.maxDepth) !== null && _a !== void 0 ? _a : 3)));
        const at = query.atTime ? new Date(query.atTime).toISOString() : null;
        const since = query.since ? new Date(query.since).toISOString() : null;
        const until = query.until ? new Date(query.until).toISOString() : null;
        const types = Array.isArray(query.types) ? query.types.map((t) => String(t).toUpperCase()) : [];
        const hasTypes = types.length > 0 ? 1 : 0;
        // Collect nodeIds reachable within depth under validity constraints
        const nodeRows = await this.db.falkordbQuery(`MATCH (start {id: $startId})
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
      `, { startId: query.startId, at, since, until, types, hasTypes });
        const nodeIds = new Set([query.startId]);
        for (const row of nodeRows || []) {
            if (row.id)
                nodeIds.add(row.id);
        }
        const idsArr = Array.from(nodeIds);
        if (idsArr.length === 0) {
            return { entities: [], relationships: [] };
        }
        // Fetch entities
        const entityRows = await this.db.falkordbQuery(`UNWIND $ids AS id
       MATCH (n {id: id})
       RETURN n
      `, { ids: idsArr });
        const entities = (entityRows || []).map((row) => this.parseEntityFromGraph(row));
        // Fetch relationships among these nodes under the same validity constraint
        const relRows = await this.db.falkordbQuery(`UNWIND $ids AS idA
       MATCH (a {id: idA})-[r]->(b)
       WHERE b.id IN $ids AND (
         ($at IS NOT NULL AND ((r.validFrom IS NULL OR r.validFrom <= $at) AND (r.validTo IS NULL OR r.validTo > $at))) OR
         ($at IS NULL AND $since IS NOT NULL AND $until IS NOT NULL AND ((r.validFrom IS NULL OR r.validFrom <= $until) AND (r.validTo IS NULL OR r.validTo >= $since))) OR
         ($at IS NULL AND $since IS NULL AND $until IS NULL)
       ) AND ($hasTypes = 0 OR type(r) IN $types)
       RETURN r, a.id AS fromId, b.id AS toId
      `, { ids: idsArr, at, since, until, types, hasTypes });
        const relationships = (relRows || []).map((row) => {
            const base = this.parseRelationshipFromGraph(row.r);
            return {
                ...base,
                fromEntityId: row.fromId,
                toEntityId: row.toId,
            };
        });
        return { entities, relationships };
    }
    /** Delete a checkpoint node and its include edges. */
    async deleteCheckpoint(id) {
        const res = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })
       WITH c LIMIT 1
       DETACH DELETE c
       RETURN 1 AS ok
      `, { id });
        return !!(res && res[0] && res[0].ok);
    }
    /** Compute summary statistics for a checkpoint. */
    async getCheckpointSummary(id) {
        var _a;
        // Ensure checkpoint exists
        const cp = await this.getCheckpoint(id);
        if (!cp)
            return null;
        const memberCountRes = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       RETURN count(n) AS total
      `, { id });
        const totalMembers = ((_a = memberCountRes === null || memberCountRes === void 0 ? void 0 : memberCountRes[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const typeRows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n)
       WITH coalesce(n.type, 'unknown') AS t
       RETURN t AS type, count(*) AS count
       ORDER BY count DESC
      `, { id });
        const entityTypeCounts = (typeRows || []).map((row) => ({ type: row.type, count: row.count }));
        const relRows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(a)
       MATCH (c)-[:CHECKPOINT_INCLUDES]->(b)
       MATCH (a)-[r]->(b)
       WITH type(r) AS t
       RETURN t AS type, count(*) AS count
       ORDER BY count DESC
      `, { id });
        const relationshipTypeCounts = (relRows || []).map((row) => ({ type: row.type, count: row.count }));
        return { totalMembers, entityTypeCounts, relationshipTypeCounts };
    }
    /** Find recently modified entities (by lastModified property) */
    async findRecentEntityIds(since, limit = 200) {
        const iso = since.toISOString();
        const rows = await this.db.falkordbQuery(`MATCH (n)
       WHERE n.lastModified IS NOT NULL AND n.lastModified >= $since
       RETURN n.id AS id
       ORDER BY n.lastModified DESC
       LIMIT $limit
      `, { since: iso, limit });
        return (rows || []).map((row) => row.id).filter(Boolean);
    }
    /** Export a checkpoint to a portable JSON structure. */
    async exportCheckpoint(id, options) {
        const cp = await this.getCheckpoint(id);
        if (!cp)
            return null;
        const { items: members } = await this.getCheckpointMembers(id, { limit: 1000, offset: 0 });
        let relationships;
        if ((options === null || options === void 0 ? void 0 : options.includeRelationships) !== false && members.length > 0) {
            const ids = members.map((m) => m.id);
            const rows = await this.db.falkordbQuery(`UNWIND $ids AS idA
         MATCH (a {id: idA})-[r]->(b)
         WHERE b.id IN $ids
         RETURN r, a.id AS fromId, b.id AS toId
        `, { ids });
            relationships = (rows || []).map((row) => {
                const base = this.parseRelationshipFromGraph(row.r);
                return { ...base, fromEntityId: row.fromId, toEntityId: row.toId };
            });
        }
        return {
            checkpoint: cp,
            members,
            ...(relationships ? { relationships } : {}),
        };
    }
    /** Import a checkpoint JSON; returns new checkpoint id and stats. */
    async importCheckpoint(data, options) {
        var _a, _b;
        if (!this.isHistoryEnabled()) {
            const fakeId = `chk_${Date.now().toString(36)}`;
            console.log(`📦 [history disabled] importCheckpoint skipped; returning ${fakeId}`);
            return { checkpointId: fakeId, linked: 0, missing: ((_a = data.members) === null || _a === void 0 ? void 0 : _a.length) || 0 };
        }
        const original = data.checkpoint || {};
        const providedId = original.id || original.checkpointId;
        const useOriginal = (options === null || options === void 0 ? void 0 : options.useOriginalId) === true && !!providedId;
        const checkpointId = useOriginal ? String(providedId) : `chk_${Date.now().toString(36)}`;
        const ts = original.timestamp ? new Date(original.timestamp).toISOString() : new Date().toISOString();
        const reason = original.reason || 'manual';
        const hops = Number.isFinite(original.hops) ? original.hops : 2;
        const seeds = Array.isArray(original.seedEntities) ? original.seedEntities : [];
        const meta = JSON.stringify(original.metadata || {});
        await this.db.falkordbQuery(`MERGE (c:checkpoint { id: $id })
       SET c.type = 'checkpoint', c.checkpointId = $id, c.timestamp = $ts, c.reason = $reason, c.hops = $hops, c.seedEntities = $seeds, c.metadata = $meta
      `, { id: checkpointId, ts, reason, hops, seeds: JSON.stringify(seeds), meta });
        const memberIds = (data.members || []).map((m) => m.id).filter(Boolean);
        let linked = 0;
        let missing = 0;
        if (memberIds.length > 0) {
            // Check which members exist
            const presentRows = await this.db.falkordbQuery(`UNWIND $ids AS id MATCH (n {id: id}) RETURN collect(n.id) AS present`, { ids: memberIds });
            const present = new Set(((_b = presentRows === null || presentRows === void 0 ? void 0 : presentRows[0]) === null || _b === void 0 ? void 0 : _b.present) || []);
            const existing = memberIds.filter((id) => present.has(id));
            missing = memberIds.length - existing.length;
            if (existing.length > 0) {
                await this.db.falkordbQuery(`UNWIND $ids AS mid
           MATCH (n {id: mid}), (c:checkpoint {id: $cid})
           MERGE (c)-[r:CHECKPOINT_INCLUDES { id: $ridPrefix + mid }]->(n)
           ON CREATE SET r.created = $ts, r.version = 1, r.metadata = '{}'
           SET r.lastModified = $ts
          `, { ids: existing, cid: checkpointId, ts, ridPrefix: `rel_chk_${checkpointId}_includes_` });
                linked = existing.length;
            }
        }
        // Relationships import optional: we do not create relationships here to avoid duplicating topology; rely on existing graph.
        return { checkpointId, linked, missing };
    }
    async initialize() {
        // Ensure database is ready
        await this.db.initialize();
        // Verify graph indexes exist
        try {
            const indexCheck = await this.db.falkordbQuery("CALL db.indexes()", {});
            if (indexCheck && indexCheck.length > 0) {
                console.log(`✅ Graph indexes verified: ${indexCheck.length} indexes found`);
            }
            else {
                console.log("⚠️ No graph indexes found, they will be created on next setupDatabase call");
            }
        }
        catch (error) {
            // Indexes might not be queryable yet, this is okay
            console.log("📊 Graph indexes will be verified on first query");
        }
        // Best-effort ensure indexes for our common access patterns
        try {
            await this.ensureGraphIndexes();
        }
        catch (_a) { }
    }
    hasCodebaseProperties(entity) {
        return ("path" in entity &&
            "hash" in entity &&
            "language" in entity &&
            "lastModified" in entity &&
            "created" in entity);
    }
    // Entity CRUD operations
    async createEntity(entity, options) {
        var _a;
        const labels = this.getEntityLabels(entity);
        const properties = this.sanitizeProperties(entity);
        // Build props excluding id so we never overwrite an existing node's id
        const propsNoId = {};
        for (const [key, value] of Object.entries(properties)) {
            if (key === "id")
                continue;
            let processedValue = value;
            if (value instanceof Date)
                processedValue = value.toISOString();
            else if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
                processedValue = JSON.stringify(value);
            }
            if (processedValue !== undefined)
                propsNoId[key] = processedValue;
        }
        // Choose merge key: prefer (type,path) for codebase entities, otherwise id
        const usePathKey = this.hasCodebaseProperties(entity) && properties.path;
        const shouldEarlyEmit = process.env.NODE_ENV === "test" || process.env.RUN_INTEGRATION === "1";
        if (shouldEarlyEmit) {
            const hasCodebasePropsEarly = this.hasCodebaseProperties(entity);
            this.emit("entityCreated", {
                id: entity.id,
                type: entity.type,
                path: hasCodebasePropsEarly ? entity.path : undefined,
                timestamp: new Date().toISOString(),
            });
        }
        let result = [];
        if (usePathKey) {
            const query = `
        MERGE (n:${labels.join(":")} { type: $type, path: $path })
        ON CREATE SET n.id = $id
        SET n += $props
        RETURN n.id AS id
      `;
            result = await this.db.falkordbQuery(query, {
                id: properties.id,
                type: properties.type,
                path: properties.path,
                props: propsNoId,
            });
        }
        else {
            const query = `
        MERGE (n:${labels.join(":")} { id: $id })
        SET n += $props
        RETURN n.id AS id
      `;
            result = await this.db.falkordbQuery(query, {
                id: properties.id,
                props: propsNoId,
            });
        }
        // Align in-memory id with the graph's persisted id
        const persistedId = ((_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a.id) || properties.id;
        entity.id = persistedId;
        // Create or refresh vector embedding (unless explicitly skipped)
        if (!(options === null || options === void 0 ? void 0 : options.skipEmbedding)) {
            await this.createEmbedding(entity);
        }
        if (!shouldEarlyEmit) {
            const hasCodebaseProps = this.hasCodebaseProperties(entity);
            this.emit("entityCreated", {
                id: entity.id,
                type: entity.type,
                path: hasCodebaseProps ? entity.path : undefined,
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
    async createEntitiesBulk(entities, options) {
        if (!entities || entities.length === 0)
            return;
        // Group by primary label
        const byType = new Map();
        for (const e of entities) {
            const t = String(e.type || e.type);
            const arr = byType.get(t) || [];
            arr.push(e);
            byType.set(t, arr);
        }
        for (const [type, list] of byType.entries()) {
            const withPath = [];
            const withoutPath = [];
            for (const entity of list) {
                const properties = this.sanitizeProperties(entity);
                const propsNoId = {};
                for (const [key, value] of Object.entries(properties)) {
                    if (key === "id")
                        continue;
                    let v = value;
                    if (value instanceof Date)
                        v = value.toISOString();
                    else if (Array.isArray(value) || (typeof value === "object" && value !== null))
                        v = JSON.stringify(value);
                    if (v !== undefined)
                        propsNoId[key] = v;
                }
                if (properties.path) {
                    withPath.push({ id: properties.id, type: properties.type, path: properties.path, props: propsNoId });
                }
                else {
                    withoutPath.push({ id: properties.id, type: properties.type, props: propsNoId });
                }
            }
            if (withPath.length > 0) {
                const queryWithPath = `
          UNWIND $rows AS row
          MERGE (n:${type} { type: row.type, path: row.path })
          ON CREATE SET n.id = row.id
          SET n += row.props
        `;
                await this.db.falkordbQuery(queryWithPath, { rows: withPath });
            }
            if (withoutPath.length > 0) {
                const queryById = `
          UNWIND $rows AS row
          MERGE (n:${type} { id: row.id })
          SET n += row.props
        `;
                await this.db.falkordbQuery(queryById, { rows: withoutPath });
            }
            // Align entity IDs in memory for items with path (to ensure embeddings reference persisted nodes)
            if (withPath.length > 0) {
                const fetchIdsQuery = `
          UNWIND $rows AS row
          MATCH (n { type: row.type, path: row.path })
          RETURN row.type AS type, row.path AS path, n.id AS id
        `;
                const idRows = await this.db.falkordbQuery(fetchIdsQuery, { rows: withPath.map(r => ({ type: r.type, path: r.path })) });
                const idMap = new Map();
                for (const r of idRows) {
                    idMap.set(`${r.type}::${r.path}`, r.id);
                }
                for (const e of list) {
                    const p = e.path;
                    if (p) {
                        const k = `${e.type}::${p}`;
                        const persistedId = idMap.get(k);
                        if (persistedId)
                            e.id = persistedId;
                    }
                }
            }
        }
        if (!(options === null || options === void 0 ? void 0 : options.skipEmbedding)) {
            await this.createEmbeddingsBatch(entities);
        }
    }
    // Prefer human-friendly label over raw ID for logs/UI
    getEntityLabel(entity) {
        try {
            if (this.hasCodebaseProperties(entity)) {
                const p = entity.path;
                if (p)
                    return p;
            }
            if (entity.title) {
                return entity.title;
            }
            if (entity.name) {
                const nm = entity.name;
                // Include kind for symbols if present
                const kind = entity.kind;
                return kind ? `${kind}:${nm}` : nm;
            }
            // Fall back to signature if available
            const sig = this.getEntitySignature(entity);
            if (sig && sig !== entity.id)
                return sig;
        }
        catch (_a) { }
        return entity.id;
    }
    async getEntity(entityId) {
        // Check cache first
        const cached = this.entityCache.get(entityId);
        if (cached) {
            console.log(`🔍 Cache hit for entity: ${entityId}`);
            return cached;
        }
        const query = `
      MATCH (n {id: $id})
      RETURN n
    `;
        const result = await this.db.falkordbQuery(query, { id: entityId });
        if (!result || result.length === 0) {
            return null;
        }
        const entity = this.parseEntityFromGraph(result[0]);
        if (entity) {
            // Cache the entity
            this.entityCache.set(entityId, entity);
            console.log(`🔍 Cached entity: ${entityId}`);
        }
        return entity;
    }
    async updateEntity(entityId, updates, options) {
        // Convert dates to ISO strings for FalkorDB
        const sanitizedUpdates = { ...updates };
        if ("lastModified" in sanitizedUpdates &&
            sanitizedUpdates.lastModified instanceof Date) {
            sanitizedUpdates.lastModified =
                sanitizedUpdates.lastModified.toISOString();
        }
        if ("created" in sanitizedUpdates &&
            sanitizedUpdates.created instanceof Date) {
            sanitizedUpdates.created = sanitizedUpdates.created.toISOString();
        }
        // Handle updates - merge objects and filter incompatible types
        const falkorCompatibleUpdates = {};
        for (const [key, value] of Object.entries(sanitizedUpdates)) {
            // Skip id field (shouldn't be updated)
            if (key === "id")
                continue;
            // Handle objects by serializing them as JSON strings for storage
            if (typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)) {
                falkorCompatibleUpdates[key] = JSON.stringify(value);
            }
            // Handle arrays by serializing them as JSON strings
            else if (Array.isArray(value)) {
                falkorCompatibleUpdates[key] = JSON.stringify(value);
            }
            // Handle primitive types (including numbers, strings, booleans) directly
            else if (typeof value === "number" ||
                typeof value === "string" ||
                typeof value === "boolean") {
                falkorCompatibleUpdates[key] = value;
            }
            // Handle other non-null values
            else if (value !== null && value !== undefined) {
                falkorCompatibleUpdates[key] = String(value);
            }
        }
        // If no compatible updates, skip the database update
        if (Object.keys(falkorCompatibleUpdates).length === 0) {
            console.warn(`No FalkorDB-compatible updates for entity ${entityId}`);
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
        const params = { id: entityId, ...falkorCompatibleUpdates };
        await this.db.falkordbQuery(query, params);
        // Invalidate cache before fetching the updated entity to avoid stale reads
        this.invalidateEntityCache(entityId);
        if (!(options === null || options === void 0 ? void 0 : options.skipEmbedding)) {
            // Update vector embedding based on the freshly fetched entity
            const updatedEntity = await this.getEntity(entityId);
            if (updatedEntity) {
                await this.updateEmbedding(updatedEntity);
                // Emit event for real-time updates
                this.emit("entityUpdated", {
                    id: entityId,
                    updates: sanitizedUpdates,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        // Cache already invalidated above
    }
    async createOrUpdateEntity(entity) {
        const existing = await this.getEntity(entity.id);
        if (existing) {
            await this.updateEntity(entity.id, entity);
        }
        else {
            await this.createEntity(entity);
        }
    }
    async deleteEntity(entityId) {
        // Get relationships before deletion for event emission
        const relationships = await this.getRelationships({
            fromEntityId: entityId,
        });
        // Delete node and any attached relationships in one operation
        await this.db.falkordbQuery(`
      MATCH (n {id: $id})
      DETACH DELETE n
    `, { id: entityId });
        // Emit events for deleted relationships
        for (const relationship of relationships) {
            this.emit("relationshipDeleted", relationship.id);
        }
        // Delete vector embedding
        await this.deleteEmbedding(entityId);
        // Invalidate cache
        this.invalidateEntityCache(entityId);
        // Emit event for real-time updates
        this.emit("entityDeleted", entityId);
    }
    async deleteRelationship(relationshipId) {
        // Delete relationship by ID
        await this.db.falkordbQuery(`
      MATCH ()-[r {id: $id}]-()
      DELETE r
    `, { id: relationshipId });
        // Emit event for real-time updates
        this.emit("relationshipDeleted", relationshipId);
    }
    // Relationship operations
    async createRelationship(relationship, toEntityId, type, options) {
        var _a, _b, _c, _d, _e;
        // Handle backward compatibility with old calling signature
        let relationshipObj;
        if (typeof relationship === "string") {
            // Old signature: createRelationship(fromEntityId, toEntityId, type)
            if (!toEntityId || !type) {
                throw new Error("Invalid parameters: when using old signature, both toEntityId and type are required");
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
            };
        }
        else {
            // New signature: createRelationship(relationshipObject)
            const rel = { ...relationship };
            // id will be canonicalized below; accept incoming for now
            if (!rel.created)
                rel.created = new Date();
            if (!rel.lastModified)
                rel.lastModified = new Date();
            if (typeof rel.version !== "number")
                rel.version = 1;
            relationshipObj = rel;
        }
        // Validate required fields
        if (!relationshipObj.fromEntityId) {
            throw new Error("Relationship fromEntityId is required and cannot be undefined");
        }
        if (!relationshipObj.toEntityId) {
            throw new Error("Relationship toEntityId is required and cannot be undefined");
        }
        if (!relationshipObj.type) {
            throw new Error("Relationship type is required");
        }
        // Optionally validate existence (default true)
        if ((options === null || options === void 0 ? void 0 : options.validate) !== false) {
            const fromEntity = await this.getEntity(relationshipObj.fromEntityId);
            if (!fromEntity) {
                throw new Error(`From entity ${relationshipObj.fromEntityId} does not exist`);
            }
            const toEntity = await this.getEntity(relationshipObj.toEntityId);
            if (!toEntity) {
                throw new Error(`To entity ${relationshipObj.toEntityId} does not exist`);
            }
        }
        // Normalize via shared normalizer; apply simple gating using noiseConfig
        try {
            relationshipObj = normalizeCodeEdge(relationshipObj);
            const top = relationshipObj;
            // Gate low-confidence inferred relationships if below threshold
            if (top.inferred && typeof top.confidence === 'number' && top.confidence < noiseConfig.MIN_INFERRED_CONFIDENCE) {
                return;
            }
            // Default confidence to 1.0 when explicitly resolved
            if (top.resolved && typeof top.confidence !== 'number') {
                top.confidence = 1.0;
                top.strength = 1.0;
            }
            // Initialize first/last seen timestamps
            if (top.firstSeenAt == null)
                top.firstSeenAt = top.created || new Date();
            if (top.lastSeenAt == null)
                top.lastSeenAt = top.lastModified || new Date();
            // Set validity interval defaults for temporal consistency
            if (this.isHistoryEnabled()) {
                if (top.validFrom == null)
                    top.validFrom = top.firstSeenAt;
                if (top.active == null)
                    top.active = true;
            }
        }
        catch (_f) { }
        // Merge evidence with any existing relationship instance
        let confidence;
        let inferred;
        let resolved;
        let source;
        let strength;
        let context;
        let mergedEvidence;
        let mergedLocations;
        // Prefer explicit top-level fields, then metadata
        const mdIn = relationshipObj.metadata || {};
        const topIn = relationshipObj;
        const incoming = {
            confidence: typeof topIn.confidence === 'number' ? topIn.confidence : (typeof mdIn.confidence === 'number' ? mdIn.confidence : undefined),
            inferred: typeof topIn.inferred === 'boolean' ? topIn.inferred : (typeof mdIn.inferred === 'boolean' ? mdIn.inferred : undefined),
            resolved: typeof topIn.resolved === 'boolean' ? topIn.resolved : (typeof mdIn.resolved === 'boolean' ? mdIn.resolved : undefined),
            source: typeof topIn.source === 'string' ? topIn.source : (typeof mdIn.source === 'string' ? mdIn.source : undefined),
            context: typeof topIn.context === 'string' ? topIn.context : undefined,
        };
        // Fetch existing to merge evidence (best-effort)
        try {
            const existingRows = await this.db.falkordbQuery(`MATCH ()-[r]->() WHERE r.id = $id RETURN r LIMIT 1`, { id: relationshipObj.id });
            if (existingRows && existingRows[0] && existingRows[0].r) {
                const relData = existingRows[0].r;
                const props = {};
                if (Array.isArray(relData)) {
                    for (const [k, v] of relData) {
                        if (k === 'properties' && Array.isArray(v)) {
                            for (const [pk, pv] of v)
                                props[pk] = pv;
                        }
                        else if (k !== 'src_node' && k !== 'dest_node') {
                            props[k] = v;
                        }
                    }
                }
                const mdOld = typeof props.metadata === 'string' ? (() => { try {
                    return JSON.parse(props.metadata);
                }
                catch (_a) {
                    return {};
                } })() : (props.metadata || {});
                // Merge with incoming: choose max for confidence; preserve earlier context if not provided
                const oldConf = typeof props.confidence === 'number' ? props.confidence : (typeof mdOld.confidence === 'number' ? mdOld.confidence : undefined);
                const oldCtx = typeof props.context === 'string' ? props.context : undefined;
                confidence = Math.max(oldConf || 0, incoming.confidence || 0);
                inferred = (_a = incoming.inferred) !== null && _a !== void 0 ? _a : (typeof mdOld.inferred === 'boolean' ? mdOld.inferred : undefined);
                resolved = (_b = incoming.resolved) !== null && _b !== void 0 ? _b : (typeof mdOld.resolved === 'boolean' ? mdOld.resolved : undefined);
                source = (_c = incoming.source) !== null && _c !== void 0 ? _c : (typeof mdOld.source === 'string' ? mdOld.source : undefined);
                context = incoming.context || oldCtx;
                // Merge first/last seen
                try {
                    const oldFirst = (props.firstSeenAt && typeof props.firstSeenAt === 'string') ? new Date(props.firstSeenAt) : null;
                    const oldLast = (props.lastSeenAt && typeof props.lastSeenAt === 'string') ? new Date(props.lastSeenAt) : null;
                    const inFirst = relationshipObj.firstSeenAt instanceof Date ? relationshipObj.firstSeenAt : null;
                    const inLast = relationshipObj.lastSeenAt instanceof Date ? relationshipObj.lastSeenAt : null;
                    relationshipObj.firstSeenAt = oldFirst && inFirst ? (oldFirst < inFirst ? oldFirst : inFirst) : (oldFirst || inFirst || new Date());
                    relationshipObj.lastSeenAt = oldLast && inLast ? (oldLast > inLast ? oldLast : inLast) : (oldLast || inLast || new Date());
                }
                catch (_g) { }
                // Merge evidence arrays and locations arrays (preserve up to 20 entries, prefer earliest lines)
                try {
                    const mdInTop = relationshipObj;
                    const mdIn = relationshipObj.metadata || {};
                    const evOld = Array.isArray(mdOld.evidence) ? mdOld.evidence : [];
                    const evNew = Array.isArray(mdInTop.evidence) ? mdInTop.evidence : (Array.isArray(mdIn.evidence) ? mdIn.evidence : []);
                    const locOld = Array.isArray(mdOld.locations) ? mdOld.locations : [];
                    const locNew = Array.isArray(mdInTop.locations) ? mdInTop.locations : (Array.isArray(mdIn.locations) ? mdIn.locations : []);
                    const dedupeBy = (arr, keyFn) => {
                        const seen = new Set();
                        const out = [];
                        for (const it of arr) {
                            const k = keyFn(it);
                            if (!seen.has(k)) {
                                seen.add(k);
                                out.push(it);
                            }
                        }
                        return out;
                    };
                    const evMergedRaw = [...evOld, ...evNew];
                    const evMerged = dedupeBy(evMergedRaw, (e) => { var _a, _b, _c; return `${e.source || ''}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ''}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ''}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ''}`; });
                    mergedEvidence = evMerged.slice(0, 20);
                    const locMergedRaw = [...locOld, ...locNew];
                    const locMergedDedupe = dedupeBy(locMergedRaw, (l) => `${l.path || ''}|${l.line || ''}|${l.column || ''}`);
                    mergedLocations = locMergedDedupe.slice(0, 20);
                }
                catch (_h) { }
            }
        }
        catch (_j) {
            // Non-fatal; fall back to incoming only
        }
        // Defaults if not set from existing
        confidence = confidence !== null && confidence !== void 0 ? confidence : incoming.confidence;
        inferred = inferred !== null && inferred !== void 0 ? inferred : incoming.inferred;
        resolved = resolved !== null && resolved !== void 0 ? resolved : incoming.resolved;
        source = source !== null && source !== void 0 ? source : incoming.source;
        context = context !== null && context !== void 0 ? context : incoming.context;
        if (typeof confidence === 'number') {
            strength = Math.max(0, Math.min(1, confidence));
        }
        // Also merge location info in metadata: keep earliest line if both present; attach merged evidence/locations
        try {
            const md = { ...(relationshipObj.metadata || {}) };
            const hasLineIn = typeof md.line === 'number';
            // If we fetched existing earlier, mdOld handled above; we keep relationshipObj.metadata as the single source of truth now
            if (hasLineIn && typeof md._existingEarliestLine === 'number') {
                md.line = Math.min(md.line, md._existingEarliestLine);
            }
            // Ensure evidence and locations arrays are carried over from top-level (AST) and merged with existing when available
            const topAll = relationshipObj;
            const evIn = Array.isArray(topAll.evidence) ? topAll.evidence : (Array.isArray(md.evidence) ? md.evidence : []);
            const locIn = Array.isArray(topAll.locations) ? topAll.locations : (Array.isArray(md.locations) ? md.locations : []);
            if (mergedEvidence || evIn.length > 0) {
                md.evidence = mergedEvidence || evIn;
            }
            if (mergedLocations || locIn.length > 0) {
                md.locations = mergedLocations || locIn;
            }
            relationshipObj.metadata = md;
        }
        catch (_k) { }
        // Canonicalize relationship id using canonical target key for stability
        relationshipObj.id = canonicalRelationshipId(relationshipObj.fromEntityId, relationshipObj);
        const query = `
      MATCH (a {id: $fromId}), (b {id: $toId})
      MERGE (a)-[r:${relationshipObj.type} { id: $id }]->(b)
      ON CREATE SET r.created = $created, r.version = $version
      SET r.lastModified = $lastModified,
          r.metadata = $metadata,
          r.occurrencesScan = $occurrencesScan,
          r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + coalesce($occurrencesScan, 0),
          r.confidence = $confidence,
          r.inferred = $inferred,
          r.resolved = $resolved,
          r.source = $source,
          r.strength = $strength,
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
          r.validFrom = coalesce(r.validFrom, $firstSeenAt)
    `;
        const mdAll = relationshipObj.metadata || {};
        // Persist structured refs for auditability
        try {
            const topAllAny = relationshipObj;
            if (topAllAny.fromRef && mdAll.fromRef == null)
                mdAll.fromRef = topAllAny.fromRef;
            if (topAllAny.toRef && mdAll.toRef == null)
                mdAll.toRef = topAllAny.toRef;
        }
        catch (_l) { }
        const topAll = relationshipObj;
        const evidenceArr = Array.isArray(topAll.evidence)
            ? topAll.evidence
            : (Array.isArray(mdAll.evidence) ? mdAll.evidence : []);
        const locationsArr = Array.isArray(topAll.locations)
            ? topAll.locations
            : (Array.isArray(mdAll.locations) ? mdAll.locations : []);
        const locPathEff = (topAll.location && topAll.location.path) || mdAll.path || null;
        const locLineEff = (topAll.location && typeof topAll.location.line === 'number' ? topAll.location.line : (typeof mdAll.line === 'number' ? mdAll.line : null));
        const locColEff = (topAll.location && typeof topAll.location.column === 'number' ? topAll.location.column : (typeof mdAll.column === 'number' ? mdAll.column : null));
        const siteIdEff = (typeof (topAll.siteId || mdAll.siteId) === 'string')
            ? (topAll.siteId || mdAll.siteId)
            : (locPathEff && (typeof locLineEff === 'number')
                ? ('site_' + crypto.createHash('sha1').update(`${locPathEff}|${locLineEff}|${locColEff !== null && locColEff !== void 0 ? locColEff : ''}|${topAll.accessPath || mdAll.accessPath || ''}`).digest('hex').slice(0, 12))
                : null);
        const result = await this.db.falkordbQuery(query, {
            fromId: relationshipObj.fromEntityId,
            toId: relationshipObj.toEntityId,
            id: relationshipObj.id,
            created: relationshipObj.created.toISOString(),
            lastModified: relationshipObj.lastModified.toISOString(),
            version: relationshipObj.version,
            metadata: JSON.stringify(relationshipObj.metadata || {}),
            occurrencesScan: (typeof ((_d = topAll.occurrencesScan) !== null && _d !== void 0 ? _d : topAll.occurrences) === 'number' ? ((_e = topAll.occurrencesScan) !== null && _e !== void 0 ? _e : topAll.occurrences) : null),
            confidence: typeof confidence === 'number' ? confidence : null,
            inferred: typeof inferred === 'boolean' ? inferred : null,
            resolved: typeof resolved === 'boolean' ? resolved : null,
            source: typeof source === 'string' ? source : null,
            strength: typeof strength === 'number' ? strength : null,
            context: typeof context === 'string' ? context : null,
            kind: typeof topAll.kind === 'string' ? topAll.kind : (typeof mdAll.kind === 'string' ? mdAll.kind : null),
            resolution: typeof topAll.resolution === 'string' ? topAll.resolution : (typeof mdAll.resolution === 'string' ? mdAll.resolution : null),
            scope: typeof topAll.scope === 'string' ? topAll.scope : (typeof mdAll.scope === 'string' ? mdAll.scope : null),
            arity: typeof topAll.arity === 'number' ? topAll.arity : (typeof mdAll.arity === 'number' ? mdAll.arity : null),
            awaited: typeof topAll.awaited === 'boolean' ? topAll.awaited : (typeof mdAll.awaited === 'boolean' ? mdAll.awaited : null),
            operator: typeof topAll.operator === 'string' ? topAll.operator : (typeof mdAll.operator === 'string' ? mdAll.operator : null),
            importDepth: typeof topAll.importDepth === 'number' ? topAll.importDepth : (typeof mdAll.importDepth === 'number' ? mdAll.importDepth : null),
            usedTypeChecker: typeof topAll.usedTypeChecker === 'boolean' ? topAll.usedTypeChecker : (typeof mdAll.usedTypeChecker === 'boolean' ? mdAll.usedTypeChecker : null),
            isExported: typeof topAll.isExported === 'boolean' ? topAll.isExported : (typeof mdAll.isExported === 'boolean' ? mdAll.isExported : null),
            accessPath: typeof topAll.accessPath === 'string' ? topAll.accessPath : (typeof mdAll.accessPath === 'string' ? mdAll.accessPath : null),
            callee: typeof topAll.callee === 'string' ? topAll.callee : (typeof mdAll.callee === 'string' ? mdAll.callee : null),
            paramName: typeof topAll.paramName === 'string' ? topAll.paramName : (typeof mdAll.param === 'string' ? mdAll.param : null),
            importAlias: typeof topAll.importAlias === 'string' ? topAll.importAlias : (typeof mdAll.importAlias === 'string' ? mdAll.importAlias : null),
            receiverType: typeof topAll.receiverType === 'string' ? topAll.receiverType : (typeof mdAll.receiverType === 'string' ? mdAll.receiverType : null),
            dynamicDispatch: typeof topAll.dynamicDispatch === 'boolean' ? topAll.dynamicDispatch : (typeof mdAll.dynamicDispatch === 'boolean' ? mdAll.dynamicDispatch : null),
            overloadIndex: typeof topAll.overloadIndex === 'number' ? topAll.overloadIndex : (typeof mdAll.overloadIndex === 'number' ? mdAll.overloadIndex : null),
            genericArguments: JSON.stringify(Array.isArray(topAll.genericArguments) ? topAll.genericArguments : (Array.isArray(mdAll.genericArguments) ? mdAll.genericArguments : [])).slice(0, 200000),
            loc_path: (topAll.location && topAll.location.path) || mdAll.path || null,
            loc_line: (topAll.location && typeof topAll.location.line === 'number' ? topAll.location.line : (typeof mdAll.line === 'number' ? mdAll.line : null)),
            loc_col: (topAll.location && typeof topAll.location.column === 'number' ? topAll.location.column : (typeof mdAll.column === 'number' ? mdAll.column : null)),
            evidence: JSON.stringify(evidenceArr).slice(0, 200000),
            locations: JSON.stringify(locationsArr).slice(0, 200000),
            siteId: siteIdEff,
            siteHash: typeof topAll.siteHash === 'string' ? topAll.siteHash : null,
            sites: JSON.stringify(Array.isArray(topAll.sites) ? topAll.sites : (Array.isArray(mdAll.sites) ? mdAll.sites : [])).slice(0, 200000),
            why: typeof (topAll.why || mdAll.why) === 'string' ? (topAll.why || mdAll.why) : null,
            to_ref_kind: typeof topAll.to_ref_kind === 'string' ? topAll.to_ref_kind : null,
            to_ref_file: typeof topAll.to_ref_file === 'string' ? topAll.to_ref_file : null,
            to_ref_symbol: typeof topAll.to_ref_symbol === 'string' ? topAll.to_ref_symbol : null,
            to_ref_name: typeof topAll.to_ref_name === 'string' ? topAll.to_ref_name : null,
            from_ref_kind: typeof topAll.from_ref_kind === 'string' ? topAll.from_ref_kind : null,
            from_ref_file: typeof topAll.from_ref_file === 'string' ? topAll.from_ref_file : null,
            from_ref_symbol: typeof topAll.from_ref_symbol === 'string' ? topAll.from_ref_symbol : null,
            from_ref_name: typeof topAll.from_ref_name === 'string' ? topAll.from_ref_name : null,
            ambiguous: typeof topAll.ambiguous === 'boolean' ? topAll.ambiguous : (typeof mdAll.ambiguous === 'boolean' ? mdAll.ambiguous : null),
            candidateCount: typeof topAll.candidateCount === 'number' ? topAll.candidateCount : (typeof mdAll.candidateCount === 'number' ? mdAll.candidateCount : null),
            isMethod: typeof topAll.isMethod === 'boolean' ? topAll.isMethod : null,
            firstSeenAt: (relationshipObj.firstSeenAt instanceof Date ? relationshipObj.firstSeenAt : new Date()).toISOString(),
            lastSeenAt: (relationshipObj.lastSeenAt instanceof Date ? relationshipObj.lastSeenAt : new Date()).toISOString(),
        });
        // Phase 1: Unify resolved edge with any prior placeholders pointing to same symbol
        try {
            await this.unifyResolvedEdgePlaceholders(relationshipObj);
        }
        catch (_m) { }
        // Phase 2: Dual-write auxiliary evidence/site/candidate nodes (non-blocking)
        try {
            await this.dualWriteAuxiliaryForEdge(relationshipObj);
        }
        catch (_o) { }
        // Emit event for real-time updates
        this.emit("relationshipCreated", {
            id: relationshipObj.id,
            type: relationshipObj.type,
            fromEntityId: relationshipObj.fromEntityId,
            toEntityId: relationshipObj.toEntityId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Mark code relationships as inactive if not seen since the provided cutoff.
     * Optionally restrict by file path (to_ref_file) to limit scope after parsing a file.
     */
    async markInactiveEdgesNotSeenSince(cutoff, opts) {
        var _a;
        const cutoffISO = cutoff.toISOString();
        const where = [
            "r.lastSeenAt < $cutoff",
            "r.active = true OR r.active IS NULL",
            "r.kind IS NOT NULL OR r.source IS NOT NULL", // likely code edges
        ];
        if (opts === null || opts === void 0 ? void 0 : opts.toRefFile)
            where.push("r.to_ref_file = $toRefFile");
        const query = `
      MATCH ()-[r]->()
      WHERE ${where.join(' AND ')}
      SET r.active = false,
          r.validTo = coalesce(r.validTo, $cutoff)
      RETURN count(r) AS updated
    `;
        const rows = await this.db.falkordbQuery(query, { cutoff: cutoffISO, toRefFile: (opts === null || opts === void 0 ? void 0 : opts.toRefFile) || null });
        return ((_a = rows === null || rows === void 0 ? void 0 : rows[0]) === null || _a === void 0 ? void 0 : _a.updated) || 0;
    }
    /**
     * Best-effort index creation to accelerate common queries.
     * Guarded to avoid failures on engines that do not support these syntaxes.
     */
    async ensureIndices() {
        try {
            // Neo4j-style index creation (if supported)
            await this.db.falkordbQuery(`CREATE INDEX node_type IF NOT EXISTS FOR (n) ON (n.type)`, {});
        }
        catch (_a) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX node_name IF NOT EXISTS FOR (n) ON (n.name)`, {});
        }
        catch (_b) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX node_path IF NOT EXISTS FOR (n) ON (n.path)`, {});
        }
        catch (_c) { }
        // Relationship property indices may not be supported; attempt guarded
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_type IF NOT EXISTS FOR ()-[r]-() ON (type(r))`, {});
        }
        catch (_d) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_kind IF NOT EXISTS FOR ()-[r]-() ON (r.kind)`, {});
        }
        catch (_e) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_source IF NOT EXISTS FOR ()-[r]-() ON (r.source)`, {});
        }
        catch (_f) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_confidence IF NOT EXISTS FOR ()-[r]-() ON (r.confidence)`, {});
        }
        catch (_g) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_firstSeen IF NOT EXISTS FOR ()-[r]-() ON (r.firstSeenAt)`, {});
        }
        catch (_h) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_lastSeen IF NOT EXISTS FOR ()-[r]-() ON (r.lastSeenAt)`, {});
        }
        catch (_j) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_siteHash IF NOT EXISTS FOR ()-[r]-() ON (r.siteHash)`, {});
        }
        catch (_k) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_active IF NOT EXISTS FOR ()-[r]-() ON (r.active)`, {});
        }
        catch (_l) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_occ_total IF NOT EXISTS FOR ()-[r]-() ON (r.occurrencesTotal)`, {});
        }
        catch (_m) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_to_ref_kind IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_kind)`, {});
        }
        catch (_o) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_to_ref_file IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_file)`, {});
        }
        catch (_p) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_to_ref_symbol IF NOT EXISTS FOR ()-[r]-() ON (r.to_ref_symbol)`, {});
        }
        catch (_q) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_from_ref_kind IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_kind)`, {});
        }
        catch (_r) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_from_ref_file IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_file)`, {});
        }
        catch (_s) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_from_ref_symbol IF NOT EXISTS FOR ()-[r]-() ON (r.from_ref_symbol)`, {});
        }
        catch (_t) { }
        // Composite indices (guarded; may be unsupported depending on backend)
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_type_to_symbol IF NOT EXISTS FOR ()-[r]-() ON (type(r), r.to_ref_symbol)`, {});
        }
        catch (_u) { }
        try {
            await this.db.falkordbQuery(`CREATE INDEX rel_active_lastSeen IF NOT EXISTS FOR ()-[r]-() ON (r.active, r.lastSeenAt)`, {});
        }
        catch (_v) { }
    }
    /**
     * Upsert evidence and lightweight fields for existing relationships by id.
     * Intended for incremental sync to keep occurrences, evidence, locations, and lastSeenAt updated.
     */
    async upsertEdgeEvidenceBulk(rels) {
        if (!Array.isArray(rels) || rels.length === 0)
            return;
        const nowISO = new Date().toISOString();
        for (const rIn of rels) {
            try {
                const rid = rIn.id || canonicalRelationshipId(rIn.fromEntityId, rIn);
                // Fetch existing
                let props = null;
                try {
                    const rows = await this.db.falkordbQuery(`MATCH ()-[r]->() WHERE r.id = $id RETURN r LIMIT 1`, { id: rid });
                    if (rows && rows[0] && rows[0].r) {
                        const relData = rows[0].r;
                        props = {};
                        if (Array.isArray(relData)) {
                            for (const [k, v] of relData) {
                                if (k === 'properties' && Array.isArray(v)) {
                                    for (const [pk, pv] of v)
                                        props[pk] = pv;
                                }
                                else if (k !== 'src_node' && k !== 'dest_node') {
                                    props[k] = v;
                                }
                            }
                        }
                    }
                }
                catch (_a) { }
                const mdIn = rIn.metadata || {};
                const topIn = rIn;
                const incoming = {
                    occurrencesScan: (typeof topIn.occurrencesScan === 'number' ? topIn.occurrencesScan : (typeof topIn.occurrences === 'number' ? topIn.occurrences : (typeof mdIn.occurrences === 'number' ? mdIn.occurrences : 1))),
                    confidence: typeof topIn.confidence === 'number' ? topIn.confidence : (typeof mdIn.confidence === 'number' ? mdIn.confidence : undefined),
                    inferred: typeof topIn.inferred === 'boolean' ? topIn.inferred : (typeof mdIn.inferred === 'boolean' ? mdIn.inferred : undefined),
                    resolved: typeof topIn.resolved === 'boolean' ? topIn.resolved : (typeof mdIn.resolved === 'boolean' ? mdIn.resolved : undefined),
                    source: typeof topIn.source === 'string' ? topIn.source : (typeof mdIn.source === 'string' ? mdIn.source : undefined),
                    context: typeof topIn.context === 'string' ? topIn.context : undefined,
                };
                // Merge with existing
                let occurrencesScan = incoming.occurrencesScan || 1;
                let confidence = incoming.confidence;
                let inferred = incoming.inferred;
                let resolved = incoming.resolved;
                let source = incoming.source;
                let context = incoming.context;
                let mergedEvidence;
                let mergedLocations;
                let firstSeenAtISO = nowISO;
                let lastSeenAtISO = nowISO;
                if (props) {
                    const mdOld = typeof props.metadata === 'string' ? (() => { try {
                        return JSON.parse(props.metadata);
                    }
                    catch (_a) {
                        return {};
                    } })() : (props.metadata || {});
                    const oldConf = typeof props.confidence === 'number' ? props.confidence : (typeof mdOld.confidence === 'number' ? mdOld.confidence : undefined);
                    const oldCtx = typeof props.context === 'string' ? props.context : undefined;
                    confidence = Math.max(oldConf || 0, confidence || 0);
                    inferred = inferred !== null && inferred !== void 0 ? inferred : (typeof mdOld.inferred === 'boolean' ? mdOld.inferred : undefined);
                    resolved = resolved !== null && resolved !== void 0 ? resolved : (typeof mdOld.resolved === 'boolean' ? mdOld.resolved : undefined);
                    source = source !== null && source !== void 0 ? source : (typeof mdOld.source === 'string' ? mdOld.source : undefined);
                    context = context || oldCtx;
                    // first/last seen
                    try {
                        const oldFirstISO = typeof props.firstSeenAt === 'string' ? props.firstSeenAt : null;
                        const oldLastISO = typeof props.lastSeenAt === 'string' ? props.lastSeenAt : null;
                        firstSeenAtISO = oldFirstISO ? (new Date(oldFirstISO) < new Date(nowISO) ? oldFirstISO : nowISO) : nowISO;
                        lastSeenAtISO = oldLastISO && new Date(oldLastISO) > new Date(nowISO) ? oldLastISO : nowISO;
                    }
                    catch (_b) { }
                    // Merge evidence/locations
                    try {
                        const evOld = Array.isArray(mdOld.evidence) ? mdOld.evidence : [];
                        const evNew = Array.isArray(topIn.evidence) ? topIn.evidence : (Array.isArray(mdIn.evidence) ? mdIn.evidence : []);
                        const locOld = Array.isArray(mdOld.locations) ? mdOld.locations : [];
                        const locNew = Array.isArray(topIn.locations) ? topIn.locations : (Array.isArray(mdIn.locations) ? mdIn.locations : []);
                        const dedupeBy = (arr, keyFn) => {
                            const seen = new Set();
                            const out = [];
                            for (const it of arr) {
                                const k = keyFn(it);
                                if (!seen.has(k)) {
                                    seen.add(k);
                                    out.push(it);
                                }
                            }
                            return out;
                        };
                        const evMergedRaw = [...evOld, ...evNew];
                        const evMerged = dedupeBy(evMergedRaw, (e) => { var _a, _b, _c; return `${e.source || ''}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ''}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ''}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ''}`; });
                        mergedEvidence = evMerged.slice(0, 20);
                        const locMergedRaw = [...locOld, ...locNew];
                        const locMergedDedupe = dedupeBy(locMergedRaw, (l) => `${l.path || ''}|${l.line || ''}|${l.column || ''}`);
                        mergedLocations = locMergedDedupe.slice(0, 20);
                    }
                    catch (_c) { }
                }
                // Update relationship row
                const q = `
          MATCH ()-[r { id: $id }]-()
          SET r.lastModified = $now,
              r.version = coalesce(r.version, 0) + 1,
              r.occurrencesScan = coalesce(r.occurrencesScan, 0) + $occurrencesScan,
              r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + $occurrencesScan,
              r.confidence = $confidence,
              r.inferred = $inferred,
              r.resolved = $resolved,
              r.source = $source,
              r.strength = CASE WHEN $confidence IS NULL THEN r.strength ELSE GREATEST(COALESCE(r.strength,0), $confidence) END,
              r.context = COALESCE(r.context, $context),
              r.evidence = $evidence,
              r.locations = $locations,
              r.firstSeenAt = COALESCE(r.firstSeenAt, $firstSeenAt),
              r.lastSeenAt = $lastSeenAt
        `;
                const evidenceArr = Array.isArray(rIn.evidence) ? rIn.evidence : (Array.isArray(mdIn.evidence) ? mdIn.evidence : []);
                const locationsArr = Array.isArray(rIn.locations) ? rIn.locations : (Array.isArray(mdIn.locations) ? mdIn.locations : []);
                await this.db.falkordbQuery(q, {
                    id: rid,
                    now: nowISO,
                    occurrencesScan: typeof occurrencesScan === 'number' ? occurrencesScan : 1,
                    confidence: typeof confidence === 'number' ? confidence : null,
                    inferred: typeof inferred === 'boolean' ? inferred : null,
                    resolved: typeof resolved === 'boolean' ? resolved : null,
                    source: typeof source === 'string' ? source : null,
                    context: typeof context === 'string' ? context : null,
                    evidence: JSON.stringify(mergedEvidence || evidenceArr).slice(0, 200000),
                    locations: JSON.stringify(mergedLocations || locationsArr).slice(0, 200000),
                    firstSeenAt: firstSeenAtISO,
                    lastSeenAt: lastSeenAtISO,
                });
                // Phase 2: dual-write evidence/sites for updated edge
                try {
                    await this.dualWriteAuxiliaryForEdge({ ...rIn, id: rid });
                }
                catch (_d) { }
            }
            catch (_e) {
                // continue on error for other items
            }
        }
    }
    async getRelationships(query) {
        let matchClause = "MATCH (a)-[r]->(b)";
        const whereClause = [];
        const params = {};
        if (query.fromEntityId) {
            whereClause.push("a.id = $fromId");
            params.fromId = query.fromEntityId;
        }
        if (query.toEntityId) {
            whereClause.push("b.id = $toId");
            params.toId = query.toEntityId;
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
        if (query.until) {
            const until = query.until;
            if (until instanceof Date) {
                whereClause.push("r.created <= $until");
                params.until = until.toISOString();
            }
        }
        // Extended filters for code edges
        const qAny = query;
        if (qAny.kind) {
            whereClause.push("r.kind = $kind");
            params.kind = qAny.kind;
        }
        if (qAny.source) {
            whereClause.push("r.source = $source");
            params.source = qAny.source;
        }
        if (typeof qAny.confidenceMin === 'number') {
            whereClause.push("r.confidence >= $cmin");
            params.cmin = qAny.confidenceMin;
        }
        if (typeof qAny.confidenceMax === 'number') {
            whereClause.push("r.confidence <= $cmax");
            params.cmax = qAny.confidenceMax;
        }
        if (typeof qAny.inferred === 'boolean') {
            whereClause.push("r.inferred = $inferred");
            params.inferred = qAny.inferred;
        }
        if (typeof qAny.resolved === 'boolean') {
            whereClause.push("r.resolved = $resolved");
            params.resolved = qAny.resolved;
        }
        if (typeof qAny.active === 'boolean') {
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
        if (typeof qAny.arityEq === 'number') {
            whereClause.push('r.arity = $arityEq');
            params.arityEq = qAny.arityEq;
        }
        if (typeof qAny.arityMin === 'number') {
            whereClause.push('r.arity >= $arityMin');
            params.arityMin = qAny.arityMin;
        }
        if (typeof qAny.arityMax === 'number') {
            whereClause.push('r.arity <= $arityMax');
            params.arityMax = qAny.arityMax;
        }
        if (typeof qAny.awaited === 'boolean') {
            whereClause.push('r.awaited = $awaited');
            params.awaited = qAny.awaited;
        }
        if (typeof qAny.isMethod === 'boolean') {
            whereClause.push('r.isMethod = $isMethod');
            params.isMethod = qAny.isMethod;
        }
        // Filters on promoted to_ref_* scalars and siteHash
        if (typeof qAny.to_ref_kind === 'string') {
            whereClause.push("r.to_ref_kind = $to_ref_kind");
            params.to_ref_kind = qAny.to_ref_kind;
        }
        if (typeof qAny.to_ref_file === 'string') {
            whereClause.push("r.to_ref_file = $to_ref_file");
            params.to_ref_file = qAny.to_ref_file;
        }
        if (typeof qAny.to_ref_symbol === 'string') {
            whereClause.push("r.to_ref_symbol = $to_ref_symbol");
            params.to_ref_symbol = qAny.to_ref_symbol;
        }
        if (typeof qAny.to_ref_name === 'string') {
            whereClause.push("r.to_ref_name = $to_ref_name");
            params.to_ref_name = qAny.to_ref_name;
        }
        if (typeof qAny.siteHash === 'string') {
            whereClause.push("r.siteHash = $siteHash");
            params.siteHash = qAny.siteHash;
        }
        // Filters on promoted from_ref_* scalars
        if (typeof qAny.from_ref_kind === 'string') {
            whereClause.push('r.from_ref_kind = $from_ref_kind');
            params.from_ref_kind = qAny.from_ref_kind;
        }
        if (typeof qAny.from_ref_file === 'string') {
            whereClause.push('r.from_ref_file = $from_ref_file');
            params.from_ref_file = qAny.from_ref_file;
        }
        if (typeof qAny.from_ref_symbol === 'string') {
            whereClause.push('r.from_ref_symbol = $from_ref_symbol');
            params.from_ref_symbol = qAny.from_ref_symbol;
        }
        if (typeof qAny.from_ref_name === 'string') {
            whereClause.push('r.from_ref_name = $from_ref_name');
            params.from_ref_name = qAny.from_ref_name;
        }
        // Default to active edges for code-edge-like queries
        try {
            const typeArr = Array.isArray(query.type) ? query.type : (query.type ? [query.type] : []);
            const looksLikeCode = (!!qAny.kind || !!qAny.source || typeof qAny.confidenceMin === 'number' || typeof qAny.confidenceMax === 'number' ||
                typeof qAny.inferred === 'boolean' || typeof qAny.resolved === 'boolean' || typeof qAny.to_ref_kind === 'string' ||
                typeof qAny.to_ref_file === 'string' || typeof qAny.to_ref_symbol === 'string' || typeof qAny.to_ref_name === 'string' ||
                typeof qAny.from_ref_kind === 'string' || typeof qAny.from_ref_file === 'string' || typeof qAny.from_ref_symbol === 'string' || typeof qAny.from_ref_name === 'string' ||
                typeof qAny.siteHash === 'string' || typeArr.some((t) => isCodeRelationship(t)));
            if (qAny.active == null && looksLikeCode) {
                whereClause.push('coalesce(r.active, true) = true');
            }
        }
        catch (_a) { }
        const fullQuery = `
      ${matchClause}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN r, a.id as fromId, b.id as toId
      ${query.limit ? "LIMIT $limit" : ""}
      ${query.offset ? "SKIP $offset" : ""}
    `;
        if (query.limit)
            params.limit = query.limit;
        if (query.offset)
            params.offset = query.offset;
        const result = await this.db.falkordbQuery(fullQuery, params);
        return result.map((row) => this.parseRelationshipFromGraph(row));
    }
    /**
     * Finalize a scan by deactivating code edges not observed during this scan window.
     * Edges with lastSeenAt < scanStartedAt are set active=false. When history is enabled,
     * also set validTo for those edges if not already closed.
     */
    async finalizeScan(scanStartedAt) {
        var _a, _b;
        const cutoff = scanStartedAt.toISOString();
        let deactivated = 0;
        try {
            const res = await this.db.falkordbQuery(`MATCH ()-[r]-()
         WHERE r.lastSeenAt < $cutoff AND coalesce(r.active, true) = true
         WITH collect(r) AS rs
         FOREACH (x IN rs | SET x.active = false)
         RETURN size(rs) AS count`, { cutoff });
            deactivated = ((_a = res === null || res === void 0 ? void 0 : res[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        }
        catch (_c) { }
        // Best-effort: proactively retire unresolved external placeholders that haven't been seen since cutoff
        try {
            const res2 = await this.db.falkordbQuery(`MATCH ()-[r]-()
         WHERE coalesce(r.active, true) = true AND r.to_ref_kind = 'external'
           AND coalesce(r.lastSeenAt, r.created) < $cutoff
         WITH collect(r) AS rs
         FOREACH (x IN rs | SET x.active = false)
         RETURN size(rs) AS count`, { cutoff });
            deactivated += ((_b = res2 === null || res2 === void 0 ? void 0 : res2[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        }
        catch (_d) { }
        // If temporal history is enabled, set validTo for edges that transitioned inactive
        try {
            if (this.isHistoryEnabled()) {
                await this.db.falkordbQuery(`MATCH ()-[r]-()
           WHERE r.lastSeenAt < $cutoff AND coalesce(r.active, false) = false AND r.validFrom IS NOT NULL AND r.validTo IS NULL
           SET r.validTo = $cutoff`, { cutoff });
            }
        }
        catch (_e) { }
        return { deactivated };
    }
    async queryRelationships(query) {
        return this.getRelationships(query);
    }
    // Retrieve a single relationship by ID
    async getRelationshipById(relationshipId) {
        const query = `
      MATCH (a)-[r]->(b)
      WHERE r.id = $id
      RETURN r, a.id as fromId, b.id as toId
      LIMIT 1
    `;
        const result = await this.db.falkordbQuery(query, { id: relationshipId });
        if (!result || result.length === 0)
            return null;
        const relationship = this.parseRelationshipFromGraph(result[0]);
        return {
            ...relationship,
            fromEntityId: result[0].fromId,
            toEntityId: result[0].toId,
        };
    }
    /**
     * Create many relationships in one round-trip per relationship type.
     * Validation is optional (defaults to false for performance in sync paths).
     */
    async createRelationshipsBulk(relationships, options) {
        var _a, _b, _c, _d, _e;
        if (!relationships || relationships.length === 0)
            return;
        const validate = (options === null || options === void 0 ? void 0 : options.validate) === true;
        // Group by relationship type since Cypher relationship type is not parameterizable
        const byType = new Map();
        for (const r of relationships) {
            if (!r.type || !r.fromEntityId || !r.toEntityId)
                continue;
            const list = byType.get(r.type) || [];
            list.push(r);
            byType.set(r.type, list);
        }
        for (const [type, relList] of byType.entries()) {
            let listEff = relList;
            // Optionally validate node existence in bulk (lightweight)
            if (validate) {
                const ids = Array.from(new Set(listEff.flatMap(r => [r.fromEntityId, r.toEntityId])));
                const result = await this.db.falkordbQuery(`UNWIND $ids AS id MATCH (n {id: id}) RETURN collect(n.id) as present`, { ids });
                const present = ((_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a.present) || [];
                const presentSet = new Set(present);
                listEff = listEff.filter(r => presentSet.has(r.fromEntityId) && presentSet.has(r.toEntityId));
                if (listEff.length === 0)
                    continue;
            }
            // Map each relationship to a normalized row, then pre-dedupe by id merging counts/evidence
            const rowsRaw = listEff.map((r) => {
                var _a, _b, _c;
                const top = r;
                const mdIn = top.metadata || {};
                // Normalize each edge before persistence
                const norm = normalizeCodeEdge(r);
                Object.assign(top, norm);
                // Carry top-level evidence/locations into metadata for persistence
                const evTop = Array.isArray(top.evidence) ? top.evidence : [];
                const locTop = Array.isArray(top.locations) ? top.locations : [];
                const md = { ...mdIn };
                if (top.fromRef && md.fromRef == null)
                    md.fromRef = top.fromRef;
                if (top.toRef && md.toRef == null)
                    md.toRef = top.toRef;
                if (evTop.length > 0 || Array.isArray(md.evidence)) {
                    const evOld = Array.isArray(md.evidence) ? md.evidence : [];
                    md.evidence = [...evOld, ...evTop].slice(0, 20);
                }
                if (locTop.length > 0 || Array.isArray(md.locations)) {
                    const locOld = Array.isArray(md.locations) ? md.locations : [];
                    md.locations = [...locOld, ...locTop].slice(0, 20);
                }
                // Normalize/hoist fields similar to single create
                const normalizeSource = (s) => {
                    if (!s)
                        return undefined;
                    if (s === 'call-typecheck')
                        return 'type-checker';
                    if (s === 'ts' || s === 'checker' || s === 'tc')
                        return 'type-checker';
                    if (s === 'ts-ast')
                        return 'ast';
                    if (s === 'heuristic' || s === 'inferred')
                        return 'heuristic';
                    return s;
                };
                let source = typeof top.source === 'string' ? top.source : (typeof md.source === 'string' ? md.source : undefined);
                source = normalizeSource(source);
                let confidence = typeof top.confidence === 'number' ? top.confidence : (typeof md.confidence === 'number' ? md.confidence : undefined);
                const resolved = typeof top.resolved === 'boolean' ? top.resolved : (typeof md.resolved === 'boolean' ? md.resolved : false);
                if (resolved && typeof confidence !== 'number')
                    confidence = 1.0;
                const strength = typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : ((_a = top.strength) !== null && _a !== void 0 ? _a : null);
                const occurrencesScan = (typeof top.occurrencesScan === 'number' ? top.occurrencesScan : (typeof top.occurrences === 'number' ? top.occurrences : (typeof md.occurrences === 'number' ? md.occurrences : undefined)));
                const context = (typeof top.context === 'string' ? top.context : (typeof md.path === 'string' && typeof md.line === 'number' ? `${md.path}:${md.line}` : undefined));
                // evidence/locations/site sampling
                const evidence = JSON.stringify(Array.isArray(top.evidence) ? top.evidence : (Array.isArray(md.evidence) ? md.evidence : [])).slice(0, 200000);
                const locations = JSON.stringify(Array.isArray(top.locations) ? top.locations : (Array.isArray(md.locations) ? md.locations : [])).slice(0, 200000);
                const siteId = typeof top.siteId === 'string' ? top.siteId : (typeof md.siteId === 'string' ? md.siteId : null);
                const sites = JSON.stringify(Array.isArray(top.sites) ? top.sites : (Array.isArray(md.sites) ? md.sites : [])).slice(0, 200000);
                const why = typeof top.why === 'string' ? top.why : (typeof md.why === 'string' ? md.why : null);
                const createdISO = (r.created instanceof Date ? r.created : new Date(r.created)).toISOString();
                const lastISO = (r.lastModified instanceof Date ? r.lastModified : new Date(r.lastModified)).toISOString();
                // Canonical id by final from/to/type (fallback if not provided by upstream)
                const id = top.id || canonicalRelationshipId(r.fromEntityId, { toEntityId: r.toEntityId, type });
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
                    occurrencesScan: occurrencesScan !== null && occurrencesScan !== void 0 ? occurrencesScan : null,
                    confidence: typeof confidence === 'number' ? confidence : null,
                    inferred: (typeof top.inferred === 'boolean' ? top.inferred : (typeof md.inferred === 'boolean' ? md.inferred : null)),
                    resolved: (typeof top.resolved === 'boolean' ? top.resolved : (typeof md.resolved === 'boolean' ? md.resolved : null)),
                    source: source !== null && source !== void 0 ? source : null,
                    strength,
                    context: context !== null && context !== void 0 ? context : null,
                    // Extra code-edge fields
                    kind: (typeof top.kind === 'string' ? top.kind : (typeof md.kind === 'string' ? md.kind : null)),
                    resolution: (typeof top.resolution === 'string' ? top.resolution : (typeof md.resolution === 'string' ? md.resolution : null)),
                    scope: (typeof top.scope === 'string' ? top.scope : (typeof md.scope === 'string' ? md.scope : null)),
                    arity: (typeof top.arity === 'number' ? top.arity : (typeof md.arity === 'number' ? md.arity : null)),
                    awaited: (typeof top.awaited === 'boolean' ? top.awaited : (typeof md.awaited === 'boolean' ? md.awaited : null)),
                    operator: (typeof top.operator === 'string' ? top.operator : (typeof md.operator === 'string' ? md.operator : null)),
                    importDepth: (typeof top.importDepth === 'number' ? top.importDepth : (typeof md.importDepth === 'number' ? md.importDepth : null)),
                    usedTypeChecker: (typeof top.usedTypeChecker === 'boolean' ? top.usedTypeChecker : (typeof md.usedTypeChecker === 'boolean' ? md.usedTypeChecker : null)),
                    isExported: (typeof top.isExported === 'boolean' ? top.isExported : (typeof md.isExported === 'boolean' ? md.isExported : null)),
                    accessPath: (typeof top.accessPath === 'string' ? top.accessPath : (typeof md.accessPath === 'string' ? md.accessPath : null)),
                    callee: (typeof top.callee === 'string' ? top.callee : (typeof md.callee === 'string' ? md.callee : null)),
                    paramName: (typeof top.paramName === 'string' ? top.paramName : (typeof md.param === 'string' ? md.param : null)),
                    importAlias: (typeof top.importAlias === 'string' ? top.importAlias : (typeof md.importAlias === 'string' ? md.importAlias : null)),
                    receiverType: (typeof top.receiverType === 'string' ? top.receiverType : (typeof md.receiverType === 'string' ? md.receiverType : null)),
                    dynamicDispatch: (typeof top.dynamicDispatch === 'boolean' ? top.dynamicDispatch : (typeof md.dynamicDispatch === 'boolean' ? md.dynamicDispatch : null)),
                    overloadIndex: (typeof top.overloadIndex === 'number' ? top.overloadIndex : (typeof md.overloadIndex === 'number' ? md.overloadIndex : null)),
                    genericArguments: JSON.stringify(Array.isArray(top.genericArguments) ? top.genericArguments : (Array.isArray(md.genericArguments) ? md.genericArguments : [])).slice(0, 200000),
                    siteHash: (typeof top.siteHash === 'string' ? top.siteHash : null),
                    to_ref_kind: (typeof top.to_ref_kind === 'string' ? top.to_ref_kind : null),
                    to_ref_file: (typeof top.to_ref_file === 'string' ? top.to_ref_file : null),
                    to_ref_symbol: (typeof top.to_ref_symbol === 'string' ? top.to_ref_symbol : null),
                    to_ref_name: (typeof top.to_ref_name === 'string' ? top.to_ref_name : null),
                    from_ref_kind: (typeof top.from_ref_kind === 'string' ? top.from_ref_kind : null),
                    from_ref_file: (typeof top.from_ref_file === 'string' ? top.from_ref_file : null),
                    from_ref_symbol: (typeof top.from_ref_symbol === 'string' ? top.from_ref_symbol : null),
                    from_ref_name: (typeof top.from_ref_name === 'string' ? top.from_ref_name : null),
                    ambiguous: (typeof top.ambiguous === 'boolean' ? top.ambiguous : (typeof md.ambiguous === 'boolean' ? md.ambiguous : null)),
                    candidateCount: (typeof top.candidateCount === 'number' ? top.candidateCount : (typeof md.candidateCount === 'number' ? md.candidateCount : null)),
                    isMethod: (typeof top.isMethod === 'boolean' ? top.isMethod : null),
                    firstSeenAt: createdISO,
                    lastSeenAt: lastISO,
                    loc_path: (_c = (_b = (top.location && top.location.path)) !== null && _b !== void 0 ? _b : md.path) !== null && _c !== void 0 ? _c : null,
                    loc_line: (top.location && typeof top.location.line === 'number' ? top.location.line : (typeof md.line === 'number' ? md.line : null)),
                    loc_col: (top.location && typeof top.location.column === 'number' ? top.location.column : (typeof md.column === 'number' ? md.column : null)),
                    evidence,
                    locations,
                    siteId,
                    sites,
                    why,
                };
            });
            // Pre-dedupe rows by id: merge occurrencesScan (sum), and merge evidence/locations/sites/context conservatively
            const mergeArrJson = (a, b, limit, keyFn) => {
                try {
                    const arrA = a ? JSON.parse(a) : [];
                    const arrB = b ? JSON.parse(b) : [];
                    const raw = [...arrA, ...arrB].filter(Boolean);
                    if (!keyFn)
                        return JSON.stringify(raw.slice(0, limit));
                    const seen = new Set();
                    const out = [];
                    for (const it of raw) {
                        const k = keyFn(it);
                        if (!seen.has(k)) {
                            seen.add(k);
                            out.push(it);
                        }
                        if (out.length >= limit)
                            break;
                    }
                    return JSON.stringify(out);
                }
                catch (_a) {
                    return a || b || null;
                }
            };
            const dedup = new Map();
            for (const row of rowsRaw) {
                const prev = dedup.get(row.id);
                if (!prev) {
                    dedup.set(row.id, row);
                    continue;
                }
                // Merge counts
                const occA = typeof prev.occurrencesScan === 'number' ? prev.occurrencesScan : 0;
                const occB = typeof row.occurrencesScan === 'number' ? row.occurrencesScan : 0;
                prev.occurrencesScan = occA + occB;
                // Keep earliest created, latest lastModified
                try {
                    if (new Date(row.created) < new Date(prev.created))
                        prev.created = row.created;
                }
                catch (_f) { }
                try {
                    if (new Date(row.lastModified) > new Date(prev.lastModified))
                        prev.lastModified = row.lastModified;
                }
                catch (_g) { }
                // Merge context (keep earliest line; prefer existing if set)
                if (!prev.context && row.context)
                    prev.context = row.context;
                // Merge evidence/locations/sites with dedupe and bounds
                prev.evidence = mergeArrJson(prev.evidence, row.evidence, 20, (e) => { var _a, _b, _c; return `${e.source || ''}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ''}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ''}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ''}`; });
                prev.locations = mergeArrJson(prev.locations, row.locations, 20, (l) => `${l.path || ''}|${l.line || ''}|${l.column || ''}`);
                prev.sites = mergeArrJson(prev.sites, row.sites, 20, (s) => String(s));
                // Preserve stronger confidence/strength
                if (typeof row.confidence === 'number')
                    prev.confidence = Math.max((_b = prev.confidence) !== null && _b !== void 0 ? _b : 0, row.confidence);
                if (typeof row.strength === 'number')
                    prev.strength = Math.max((_c = prev.strength) !== null && _c !== void 0 ? _c : 0, row.strength);
                // Combine candidate count
                if (typeof row.candidateCount === 'number') {
                    const a = (_d = prev.candidateCount) !== null && _d !== void 0 ? _d : 0;
                    const b = (_e = row.candidateCount) !== null && _e !== void 0 ? _e : 0;
                    prev.candidateCount = Math.max(a, b);
                }
            }
            const rows = Array.from(dedup.values());
            const query = `
        UNWIND $rows AS row
        MATCH (a {id: row.fromId}), (b {id: row.toId})
        MERGE (a)-[r:${type} { id: row.id }]->(b)
        ON CREATE SET r.created = row.created, r.version = row.version, r.metadata = row.metadata
        SET r.lastModified = row.lastModified,
            r.metadata = row.metadata,
            r.occurrencesScan = row.occurrencesScan,
            r.occurrencesTotal = coalesce(r.occurrencesTotal, 0) + coalesce(row.occurrencesScan, 0),
            r.confidence = row.confidence,
            r.inferred = row.inferred,
            r.resolved = row.resolved,
            r.source = row.source,
            r.strength = row.strength,
            r.context = row.context,
            r.kind = row.kind,
            r.resolution = row.resolution,
            r.scope = row.scope,
            r.arity = row.arity,
            r.awaited = row.awaited,
            r.operator = row.operator,
            r.importDepth = row.importDepth,
            r.usedTypeChecker = row.usedTypeChecker,
            r.isExported = row.isExported,
            r.accessPath = row.accessPath,
            r.callee = row.callee,
            r.paramName = row.paramName,
            r.importAlias = row.importAlias,
            r.receiverType = row.receiverType,
            r.dynamicDispatch = row.dynamicDispatch,
            r.overloadIndex = row.overloadIndex,
            r.genericArguments = row.genericArguments,
            r.siteHash = row.siteHash,
            r.location_path = row.loc_path,
            r.location_line = row.loc_line,
            r.location_col = row.loc_col,
            r.evidence = row.evidence,
            r.locations = row.locations,
            r.siteId = row.siteId,
            r.sites = row.sites,
            r.why = row.why,
            r.to_ref_kind = row.to_ref_kind,
            r.to_ref_file = row.to_ref_file,
            r.to_ref_symbol = row.to_ref_symbol,
            r.to_ref_name = row.to_ref_name,
            r.from_ref_kind = row.from_ref_kind,
            r.from_ref_file = row.from_ref_file,
            r.from_ref_symbol = row.from_ref_symbol,
            r.from_ref_name = row.from_ref_name,
            r.ambiguous = row.ambiguous,
            r.candidateCount = row.candidateCount,
            r.isMethod = row.isMethod,
            r.active = true,
            r.firstSeenAt = coalesce(r.firstSeenAt, row.firstSeenAt),
            r.lastSeenAt = row.lastSeenAt,
            r.validFrom = coalesce(r.validFrom, row.firstSeenAt)
      `;
            await this.db.falkordbQuery(query, { rows });
            // Batched unification: only one unifier call per unique (fromId,type,file,symbol)
            try {
                await this.unifyResolvedEdgesBatch(rows.map((row) => ({
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
                })));
            }
            catch (_h) { }
            // Dual-write auxiliaries for each edge (best-effort)
            try {
                for (const row of rows) {
                    const relObj = {
                        id: row.id,
                        fromEntityId: row.fromId,
                        toEntityId: row.toId,
                        type: type,
                        created: new Date(row.created),
                        lastModified: new Date(row.lastModified),
                        version: row.version || 1,
                    };
                    relObj.to_ref_kind = row.to_ref_kind;
                    relObj.to_ref_file = row.to_ref_file;
                    relObj.to_ref_symbol = row.to_ref_symbol;
                    relObj.to_ref_name = row.to_ref_name;
                    try {
                        await this.dualWriteAuxiliaryForEdge(relObj);
                    }
                    catch (_j) { }
                }
            }
            catch (_k) { }
        }
    }
    // Phase 1+: grouped unifier to reduce duplicate scans per batch
    async unifyResolvedEdgesBatch(rows) {
        const groups = new Map();
        for (const r of rows) {
            const resolved = (r.to_ref_kind === 'entity') || (String(r.toId || '').startsWith('sym:'));
            const file = r.to_ref_file || '';
            const symbol = r.to_ref_symbol || '';
            if (!resolved || !file || !symbol)
                continue;
            const key = `${r.fromId}|${r.type}|${file}|${symbol}`;
            if (!groups.has(key))
                groups.set(key, { any: r });
        }
        for (const { any } of groups.values()) {
            const relObj = {
                id: any.id,
                fromEntityId: any.fromId,
                toEntityId: any.toId,
                type: any.type,
                created: new Date(any.created || Date.now()),
                lastModified: new Date(any.lastModified || Date.now()),
                version: any.version || 1,
            };
            relObj.to_ref_kind = any.to_ref_kind;
            relObj.to_ref_file = any.to_ref_file;
            relObj.to_ref_symbol = any.to_ref_symbol;
            relObj.to_ref_name = any.to_ref_name;
            await this.unifyResolvedEdgePlaceholders(relObj);
        }
    }
    // --- Read paths for auxiliary nodes (evidence, sites, candidates) ---
    async getEdgeEvidenceNodes(edgeId, limit = 200) {
        try {
            const rows = await this.db.falkordbQuery(`MATCH (n:edge_evidence) WHERE n.edgeId = $edgeId
         RETURN n.id AS id, n.edgeId AS edgeId, n.source AS source, n.confidence AS confidence,
                n.path AS path, n.line AS line, n.column AS column, n.note AS note,
                n.extractorVersion AS extractorVersion, n.createdAt AS createdAt, n.updatedAt AS updatedAt
         ORDER BY n.updatedAt DESC LIMIT $limit`, { edgeId, limit });
            return (rows || []);
        }
        catch (_a) {
            return [];
        }
    }
    async getEdgeSites(edgeId, limit = 50) {
        try {
            const rows = await this.db.falkordbQuery(`MATCH (s:edge_site) WHERE s.edgeId = $edgeId
         RETURN s.id AS id, s.edgeId AS edgeId, s.siteId AS siteId, s.path AS path, s.line AS line, s.column AS column, s.accessPath AS accessPath, s.updatedAt AS updatedAt
         ORDER BY s.updatedAt DESC LIMIT $limit`, { edgeId, limit });
            return (rows || []);
        }
        catch (_a) {
            return [];
        }
    }
    async getEdgeCandidates(edgeId, limit = 50) {
        try {
            const rows = await this.db.falkordbQuery(`MATCH (c:edge_candidate) WHERE c.edgeId = $edgeId
         RETURN c.id AS id, c.edgeId AS edgeId, c.candidateId AS candidateId, c.name AS name, c.path AS path,
                c.resolver AS resolver, c.score AS score, c.rank AS rank, c.updatedAt AS updatedAt
         ORDER BY c.rank ASC, c.updatedAt DESC LIMIT $limit`, { edgeId, limit });
            return (rows || []);
        }
        catch (_a) {
            return [];
        }
    }
    // Graph search operations
    async search(request) {
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
        let result;
        if (request.searchType === "semantic") {
            result = await this.semanticSearch(request);
        }
        else {
            result = await this.structuralSearch(request);
        }
        // If caller requested specific entity types, filter results to match
        if (request.entityTypes && request.entityTypes.length > 0) {
            result = result.filter((e) => this.entityMatchesRequestedTypes(e, request.entityTypes));
        }
        // Cache the result
        this.searchCache.set(cacheKey, result);
        console.log(`🔍 Cached search result for query: ${request.query}`);
        return result;
    }
    // Map request entityTypes (function/class/interface/file/module) to actual entity shape
    entityMatchesRequestedTypes(entity, requested) {
        const type = entity === null || entity === void 0 ? void 0 : entity.type;
        const kind = entity === null || entity === void 0 ? void 0 : entity.kind;
        for (const t of requested) {
            const tn = String(t || "").toLowerCase();
            if (tn === "function" && type === "symbol" && kind === "function")
                return true;
            if (tn === "class" && type === "symbol" && kind === "class")
                return true;
            if (tn === "interface" && type === "symbol" && kind === "interface")
                return true;
            if (tn === "file" && type === "file")
                return true;
            if (tn === "module" && (type === "module" || type === "file"))
                return true;
        }
        return false;
    }
    /**
     * Clear search cache
     */
    clearSearchCache() {
        this.searchCache.clear();
        console.log("🔄 Search cache cleared");
    }
    /**
     * Invalidate cache entries related to an entity
     */
    invalidateEntityCache(entityId) {
        // Remove the specific entity from cache
        this.entityCache.invalidateKey(entityId);
        // Also clear search cache as searches might be affected
        // This could be optimized to only clear relevant searches
        this.clearSearchCache();
        console.log(`🔄 Invalidated cache for entity: ${entityId}`);
    }
    /**
     * Find entities by type
     */
    async findEntitiesByType(entityType) {
        const request = {
            query: "",
            searchType: "structural",
            entityTypes: [entityType],
        };
        return this.structuralSearch(request);
    }
    /**
     * Find symbol entities by exact name
     */
    async findSymbolsByName(name, limit = 50) {
        const query = `
      MATCH (n {type: $type})
      WHERE n.name = $name
      RETURN n
      LIMIT $limit
    `;
        const result = await this.db.falkordbQuery(query, {
            type: "symbol",
            name,
            limit,
        });
        return result.map((row) => this.parseEntityFromGraph(row));
    }
    /**
     * Find symbol by kind and name (e.g., class/interface/function)
     */
    async findSymbolByKindAndName(kind, name, limit = 50) {
        const query = `
      MATCH (n {type: $type})
      WHERE n.name = $name AND n.kind = $kind
      RETURN n
      LIMIT $limit
    `;
        const result = await this.db.falkordbQuery(query, {
            type: "symbol",
            name,
            kind,
            limit,
        });
        return result.map((row) => this.parseEntityFromGraph(row));
    }
    /**
     * Find a symbol defined in a specific file by name
     */
    async findSymbolInFile(filePath, name) {
        const query = `
      MATCH (n {type: $type})
      WHERE n.path = $path
      RETURN n
      LIMIT 1
    `;
        // Symbol entities store path as `${filePath}:${name}`
        const compositePath = `${filePath}:${name}`;
        const result = await this.db.falkordbQuery(query, {
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
    async findNearbySymbols(filePath, name, limit = 20) {
        try {
            const rel = String(filePath || '').replace(/\\/g, '/');
            const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
            const dirPrefix = dir ? `${dir}/` : '';
            const query = `
        MATCH (n {type: $type})
        WHERE n.name = $name AND ($dirPrefix = '' OR n.path STARTS WITH $dirPrefix)
        RETURN n
        LIMIT $limit
      `;
            // Fetch more and rank in memory by directory distance
            const raw = await this.db.falkordbQuery(query, {
                type: 'symbol',
                name,
                dirPrefix,
                limit: Math.max(limit * 3, limit),
            });
            const entities = (raw || []).map((row) => this.parseEntityFromGraph(row));
            const ranked = entities
                .map((e) => ({ e, d: this.directoryDistance(filePath, e.path || '') }))
                .sort((a, b) => a.d - b.d)
                .slice(0, limit)
                .map((x) => x.e);
            return ranked;
        }
        catch (_a) {
            return [];
        }
    }
    /**
     * Get a file entity by path
     */
    async getFileByPath(path) {
        const query = `
      MATCH (n {type: $type, path: $path})
      RETURN n
      LIMIT 1
    `;
        const result = await this.db.falkordbQuery(query, { type: "file", path });
        return result[0] ? this.parseEntityFromGraph(result[0]) : null;
    }
    async semanticSearch(request) {
        var _a, _b;
        // Validate limit parameter
        if (request.limit !== undefined &&
            (typeof request.limit !== "number" ||
                request.limit < 0 ||
                !Number.isInteger(request.limit))) {
            throw new Error(`Invalid limit parameter: ${request.limit}. Must be a positive integer.`);
        }
        try {
            // Get vector embeddings for the query
            const embeddings = await this.generateEmbedding(String(request.query || ""));
            // Search in Qdrant
            const qdrantOptions = {
                vector: embeddings,
                limit: request.limit || 10,
                with_payload: true,
                with_vector: false,
            };
            const checkpointId = (_a = request.filters) === null || _a === void 0 ? void 0 : _a.checkpointId;
            if (checkpointId) {
                qdrantOptions.filter = {
                    must: [
                        { key: 'checkpointId', match: { value: checkpointId } }
                    ]
                };
            }
            const searchResult = await this.db.qdrant.search("code_embeddings", qdrantOptions);
            // Get entities from graph database
            const searchResultData = searchResult;
            // Handle different Qdrant response formats
            let points = [];
            if (Array.isArray(searchResultData)) {
                // Direct array of points
                points = searchResultData;
            }
            else if (searchResultData.points) {
                // Object with points property
                points = searchResultData.points;
            }
            else if (searchResultData.results) {
                // Object with results property
                points = searchResultData.results;
            }
            const entities = [];
            for (const point of points) {
                // Get the actual entity ID from the payload, not the numeric ID
                const entityId = (_b = point.payload) === null || _b === void 0 ? void 0 : _b.entityId;
                if (entityId) {
                    const entity = await this.getEntity(entityId);
                    if (entity) {
                        entities.push(entity);
                    }
                }
            }
            // If no results from semantic search, fall back to structural search
            if (entities.length === 0) {
                console.log("Semantic search returned no results, falling back to structural search");
                return this.structuralSearch(request);
            }
            return entities;
        }
        catch (error) {
            console.warn("Semantic search failed, falling back to structural search:", error);
            // Fall back to structural search if semantic search fails
            return this.structuralSearch(request);
        }
    }
    async structuralSearch(request) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // Validate limit parameter
        if (request.limit !== undefined &&
            (typeof request.limit !== "number" ||
                request.limit < 0 ||
                !Number.isInteger(request.limit))) {
            throw new Error(`Invalid limit parameter: ${request.limit}. Must be a positive integer.`);
        }
        let query = "MATCH (n)";
        const whereClause = [];
        const params = {};
        // Map requested entityTypes to stored schema (type/kind)
        if (request.entityTypes && request.entityTypes.length > 0) {
            const typeClauses = [];
            let idx = 0;
            for (const t of request.entityTypes) {
                const typeName = String(t || "").toLowerCase();
                switch (typeName) {
                    case "function": {
                        const tp = `etype_${idx}`;
                        const kd = `ekind_${idx}`;
                        params[tp] = "symbol";
                        params[kd] = "function";
                        typeClauses.push(`(n.type = $${tp} AND n.kind = $${kd})`);
                        idx++;
                        break;
                    }
                    case "class": {
                        const tp = `etype_${idx}`;
                        const kd = `ekind_${idx}`;
                        params[tp] = "symbol";
                        params[kd] = "class";
                        typeClauses.push(`(n.type = $${tp} AND n.kind = $${kd})`);
                        idx++;
                        break;
                    }
                    case "interface": {
                        const tp = `etype_${idx}`;
                        const kd = `ekind_${idx}`;
                        params[tp] = "symbol";
                        params[kd] = "interface";
                        typeClauses.push(`(n.type = $${tp} AND n.kind = $${kd})`);
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
            }
            else {
                // For general text search using FalkorDB's supported string functions
                const searchTerms = request.query.toLowerCase().split(/\s+/);
                const searchConditions = [];
                searchTerms.forEach((term, index) => {
                    // Create regex pattern for substring matching
                    const pattern = `.*${term}.*`;
                    params[`pattern_${index}`] = pattern;
                    params[`term_${index}`] = term;
                    // Build conditions array based on what FalkorDB supports
                    const conditions = [];
                    // Use CONTAINS for substring matching (widely supported in Cypher)
                    if (request.searchType !== undefined) {
                        conditions.push(`toLower(n.name) CONTAINS $term_${index}`, `toLower(n.docstring) CONTAINS $term_${index}`, `toLower(n.path) CONTAINS $term_${index}`, `toLower(n.id) CONTAINS $term_${index}`);
                    }
                    // Always include exact matches (most compatible and performant)
                    conditions.push(`toLower(n.name) = $term_${index}`, `toLower(n.title) = $term_${index}`, `toLower(n.id) = $term_${index}`);
                    // Use STARTS WITH for prefix matching (widely supported in Cypher)
                    conditions.push(`toLower(n.name) STARTS WITH $term_${index}`, `toLower(n.path) STARTS WITH $term_${index}`);
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
        if ((_a = request.filters) === null || _a === void 0 ? void 0 : _a.path) {
            // Check if the filter looks like a pattern (contains no slashes at start)
            if (!request.filters.path.startsWith("/")) {
                // Treat as a substring match
                whereClause.push("n.path CONTAINS $path");
                params.path = request.filters.path;
            }
            else {
                // Treat as a prefix match
                whereClause.push("n.path STARTS WITH $path");
                params.path = request.filters.path;
            }
        }
        // Add language filters
        if ((_b = request.filters) === null || _b === void 0 ? void 0 : _b.language) {
            whereClause.push("n.language = $language");
            params.language = request.filters.language;
        }
        // Add time filters with optimized date handling
        if ((_d = (_c = request.filters) === null || _c === void 0 ? void 0 : _c.lastModified) === null || _d === void 0 ? void 0 : _d.since) {
            whereClause.push("n.lastModified >= $since");
            params.since = request.filters.lastModified.since.toISOString();
        }
        if ((_f = (_e = request.filters) === null || _e === void 0 ? void 0 : _e.lastModified) === null || _f === void 0 ? void 0 : _f.until) {
            whereClause.push("n.lastModified <= $until");
            params.until = request.filters.lastModified.until.toISOString();
        }
        const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN n
      ${request.limit ? "LIMIT $limit" : ""}
    `;
        if (request.limit)
            params.limit = request.limit;
        try {
            const result = await this.db.falkordbQuery(fullQuery, params);
            let entities = result.map((row) => this.parseEntityFromGraph(row));
            // Optional checkpoint filter: restrict to checkpoint members
            const checkpointId = (_g = request.filters) === null || _g === void 0 ? void 0 : _g.checkpointId;
            if (checkpointId) {
                try {
                    const rows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n) RETURN n.id AS id`, { id: checkpointId });
                    const allowed = new Set((rows || []).map((r) => r.id));
                    entities = entities.filter((e) => allowed.has(e.id));
                }
                catch (_m) {
                    // If filter query fails, return unfiltered entities
                }
            }
            return entities;
        }
        catch (error) {
            // If the query fails due to unsupported functions, try a simpler query
            if (((_h = error === null || error === void 0 ? void 0 : error.message) === null || _h === void 0 ? void 0 : _h.includes("Unknown function")) ||
                ((_j = error === null || error === void 0 ? void 0 : error.message) === null || _j === void 0 ? void 0 : _j.includes("matchRegEx"))) {
                console.warn("FalkorDB query failed with advanced functions, falling back to simple search");
                // Retry with simple exact match only
                const simpleQuery = (_k = request.query) === null || _k === void 0 ? void 0 : _k.trim();
                if (simpleQuery && !simpleQuery.match(/^[a-f0-9-]{36}$/i)) {
                    const simpleParams = { searchTerm: simpleQuery.toLowerCase() };
                    const simpleFullQuery = `
            MATCH (n)
            WHERE toLower(n.name) = $searchTerm 
               OR toLower(n.id) = $searchTerm
               OR n.id = $searchTerm
            RETURN n
            ${request.limit ? "LIMIT " + request.limit : ""}
          `;
                    try {
                        const result = await this.db.falkordbQuery(simpleFullQuery, simpleParams);
                        let entities = result.map((row) => this.parseEntityFromGraph(row));
                        const checkpointId = (_l = request.filters) === null || _l === void 0 ? void 0 : _l.checkpointId;
                        if (checkpointId) {
                            try {
                                const rows = await this.db.falkordbQuery(`MATCH (c:checkpoint { id: $id })-[:CHECKPOINT_INCLUDES]->(n) RETURN n.id AS id`, { id: checkpointId });
                                const allowed = new Set((rows || []).map((r) => r.id));
                                entities = entities.filter((e) => allowed.has(e.id));
                            }
                            catch (_o) { }
                        }
                        return entities;
                    }
                    catch (fallbackError) {
                        console.error("Even simple FalkorDB query failed:", fallbackError);
                        return [];
                    }
                }
            }
            // Re-throw if it's not a function-related error
            throw error;
        }
    }
    async getEntityExamples(entityId) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const entity = await this.getEntity(entityId);
        if (!entity) {
            return null; // Return null instead of throwing error
        }
        // Get usage examples from relationships
        const usageRelationships = await this.getRelationships({
            toEntityId: entityId,
            type: [
                RelationshipType.CALLS,
                RelationshipType.REFERENCES,
            ],
            limit: 10,
        });
        const usageExamples = await Promise.all(usageRelationships.map(async (rel) => {
            var _a;
            const caller = await this.getEntity(rel.fromEntityId);
            if (caller && this.hasCodebaseProperties(caller)) {
                let snippet = `// Usage in ${caller.path}`;
                let lineNum = ((_a = rel === null || rel === void 0 ? void 0 : rel.metadata) === null || _a === void 0 ? void 0 : _a.line) || 1;
                try {
                    const fileRel = (caller.path || '').split(':')[0];
                    const abs = path.resolve(fileRel);
                    const raw = await fs.readFile(abs, 'utf-8');
                    const lines = raw.split('\n');
                    const idx = Math.max(1, Math.min(lines.length, Number(lineNum) || 1));
                    const from = Math.max(1, idx - 2);
                    const to = Math.min(lines.length, idx + 2);
                    const view = lines.slice(from - 1, to).join('\n');
                    snippet = view;
                    lineNum = idx;
                }
                catch (_b) { }
                return {
                    context: `${caller.path}:${rel.type}`,
                    code: snippet,
                    file: caller.path,
                    line: lineNum,
                };
            }
            return null;
        })).then((examples) => examples.filter((ex) => ex !== null));
        // Get test examples
        const testRelationships = await this.getRelationships({
            toEntityId: entityId,
            type: RelationshipType.TESTS,
            limit: 5,
        });
        const testExamples = await Promise.all(testRelationships.map(async (rel) => {
            const test = await this.getEntity(rel.fromEntityId);
            if (test &&
                test.type === "test" &&
                this.hasCodebaseProperties(entity)) {
                return {
                    testId: test.id,
                    testName: test.testType,
                    testCode: `// Test for ${entity.path}`,
                    assertions: [],
                };
            }
            return null;
        })).then((examples) => examples.filter((ex) => ex !== null));
        return {
            entityId,
            signature: this.getEntitySignature(entity),
            usageExamples,
            testExamples,
            relatedPatterns: [], // Would be populated from usage analysis
        };
    }
    async getEntityDependencies(entityId) {
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
        return {
            entityId,
            directDependencies: directDeps.map((rel) => ({
                entity: null, // Would need to fetch entity
                relationship: rel.type,
                strength: 1,
            })),
            indirectDependencies: [],
            reverseDependencies: reverseDeps.map((rel) => ({
                entity: null,
                relationship: rel.type,
                impact: "medium",
            })),
            circularDependencies: [],
        };
    }
    // Path finding and traversal
    async findPaths(query) {
        let cypherQuery;
        const params = { startId: query.startEntityId };
        // Build the query based on whether relationship types are specified
        if (query.relationshipTypes && query.relationshipTypes.length > 0) {
            // FalkorDB syntax for relationship types with depth
            const relTypes = query.relationshipTypes.join("|");
            cypherQuery = `
        MATCH path = (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? "{id: $endId}" : ""})
        RETURN [node IN nodes(path) | node.id] AS nodeIds
        LIMIT 10
      `;
        }
        else {
            // No specific relationship types
            cypherQuery = `
        MATCH path = (start {id: $startId})-[*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? "{id: $endId}" : ""})
        RETURN [node IN nodes(path) | node.id] AS nodeIds
        LIMIT 10
      `;
        }
        if (query.endEntityId) {
            params.endId = query.endEntityId;
        }
        const result = await this.db.falkordbQuery(cypherQuery, params);
        // Expect rows like: { nodeIds: ["id1","id2",...] }
        return result.map((row) => {
            // Ensure we always return an array of node IDs
            if (Array.isArray(row.nodeIds)) {
                return row.nodeIds;
            }
            else if (Array.isArray(row)) {
                return row;
            }
            else {
                // If neither, return an empty array to prevent type errors
                return [];
            }
        });
    }
    async traverseGraph(query) {
        let cypherQuery;
        const params = { startId: query.startEntityId };
        if (query.relationshipTypes && query.relationshipTypes.length > 0) {
            const relTypes = query.relationshipTypes.join("|");
            cypherQuery = `
        MATCH (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
        }
        else {
            cypherQuery = `
        MATCH (start {id: $startId})-[*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
        }
        const result = await this.db.falkordbQuery(cypherQuery, params);
        return result.map((row) => this.parseEntityFromGraph(row));
    }
    // Vector embedding operations
    async createEmbeddingsBatch(entities, options) {
        try {
            const inputs = entities.map((entity) => ({
                content: this.getEntityContentForEmbedding(entity),
                entityId: entity.id,
            }));
            const batchResult = await embeddingService.generateEmbeddingsBatch(inputs);
            // Build one upsert per collection with all points
            const byCollection = new Map();
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const embedding = batchResult.results[i].embedding;
                const collection = this.getEmbeddingCollection(entity);
                const hasCodebaseProps = this.hasCodebaseProperties(entity);
                const numericId = this.stringToNumericId(entity.id);
                const payload = {
                    entityId: entity.id,
                    type: entity.type,
                    path: hasCodebaseProps ? entity.path : "",
                    language: hasCodebaseProps ? entity.language : "",
                    lastModified: hasCodebaseProps
                        ? entity.lastModified.toISOString()
                        : new Date().toISOString(),
                    ...((options === null || options === void 0 ? void 0 : options.checkpointId) ? { checkpointId: options.checkpointId } : {}),
                };
                const list = byCollection.get(collection) || [];
                list.push({ id: numericId, vector: embedding, payload });
                byCollection.set(collection, list);
            }
            for (const [collection, points] of byCollection.entries()) {
                await this.db.qdrant.upsert(collection, { points });
            }
            console.log(`✅ Created embeddings for ${entities.length} entities (${batchResult.totalTokens} tokens, $${batchResult.totalCost.toFixed(4)})`);
        }
        catch (error) {
            console.error("Failed to create batch embeddings:", error);
            // Fallback to individual processing
            for (const entity of entities) {
                await this.createEmbedding(entity);
            }
        }
    }
    async createEmbedding(entity) {
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
                            path: hasCodebaseProps ? entity.path : "",
                            language: hasCodebaseProps ? entity.language : "",
                            lastModified: hasCodebaseProps
                                ? entity.lastModified.toISOString()
                                : new Date().toISOString(),
                        },
                    },
                ],
            });
            console.log(`✅ Created embedding for entity ${entity.id} in ${collection}`);
        }
        catch (error) {
            console.error(`Failed to create embedding for entity ${entity.id}:`, error);
        }
    }
    async updateEmbedding(entity) {
        await this.deleteEmbedding(entity.id);
        await this.createEmbedding(entity);
    }
    async deleteEmbedding(entityId) {
        // Use the same filter for both collections to delete by entityId in payload
        const filter = {
            filter: {
                must: [
                    {
                        key: "entityId",
                        match: { value: entityId },
                    },
                ],
            },
        };
        try {
            await this.db.qdrant.delete("code_embeddings", filter);
        }
        catch (error) {
            // Collection might not exist or no matching points
        }
        try {
            await this.db.qdrant.delete("documentation_embeddings", filter);
        }
        catch (error) {
            // Collection might not exist or no matching points
        }
    }
    async generateEmbedding(content) {
        try {
            const result = await embeddingService.generateEmbedding(content);
            return result.embedding;
        }
        catch (error) {
            console.error("Failed to generate embedding:", error);
            // Fallback to mock embedding
            return Array.from({ length: 1536 }, () => Math.random() - 0.5);
        }
    }
    // Helper methods
    getEntityLabels(entity) {
        const labels = [entity.type];
        // Add specific labels based on entity type
        if (entity.type === "file") {
            const fileEntity = entity;
            if (fileEntity.isTest)
                labels.push("test");
            if (fileEntity.isConfig)
                labels.push("config");
        }
        return labels;
    }
    sanitizeProperties(entity) {
        const props = { ...entity };
        // Remove complex objects that can't be stored in graph database
        if ("metadata" in props) {
            delete props.metadata;
        }
        return props;
    }
    parseEntityFromGraph(graphNode) {
        // Parse entity from FalkorDB result format
        // Typical formats observed:
        // - { n: [[key,value], ...] }
        // - { connected: [[key,value], ...] }
        // - [[key,value], ...]
        // - { n: [...], labels: [...]} (labels handled inside pairs)
        const toPropsFromPairs = (pairs) => {
            const properties = {};
            for (const [key, value] of pairs) {
                if (key === "properties") {
                    // Parse nested properties which contain the actual entity data
                    if (Array.isArray(value)) {
                        const nestedProps = {};
                        for (const [propKey, propValue] of value) {
                            nestedProps[propKey] = propValue;
                        }
                        // The actual entity properties are stored in the nested properties
                        Object.assign(properties, nestedProps);
                    }
                }
                else if (key === "labels") {
                    // Extract type from labels (first label is usually the type)
                    if (Array.isArray(value) && value.length > 0) {
                        properties.type = value[0];
                    }
                }
                else {
                    // Store other direct node properties (but don't overwrite properties from nested props)
                    if (!properties[key]) {
                        properties[key] = value;
                    }
                }
            }
            return properties;
        };
        const isPairArray = (v) => Array.isArray(v) &&
            v.length > 0 &&
            Array.isArray(v[0]) &&
            v[0].length === 2;
        // Case 1: explicit 'n'
        if (graphNode && graphNode.n && isPairArray(graphNode.n)) {
            const properties = toPropsFromPairs(graphNode.n);
            // Convert date strings back to Date objects
            if (properties.lastModified &&
                typeof properties.lastModified === "string") {
                properties.lastModified = new Date(properties.lastModified);
            }
            if (properties.created && typeof properties.created === "string") {
                properties.created = new Date(properties.created);
            }
            // Parse JSON strings back to their original types
            const jsonFields = ["metadata", "dependencies"];
            for (const field of jsonFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    try {
                        properties[field] = JSON.parse(properties[field]);
                    }
                    catch (e) {
                        // If parsing fails, keep as string
                    }
                }
            }
            // Convert numeric fields from strings back to numbers
            const numericFields = ["size", "lines", "version"];
            for (const field of numericFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    const parsed = parseFloat(properties[field]);
                    if (!isNaN(parsed)) {
                        properties[field] = parsed;
                    }
                }
            }
            return properties;
        }
        // Case 2: explicit 'connected' alias
        if (graphNode && graphNode.connected && isPairArray(graphNode.connected)) {
            const properties = toPropsFromPairs(graphNode.connected);
            if (properties.lastModified &&
                typeof properties.lastModified === "string") {
                properties.lastModified = new Date(properties.lastModified);
            }
            if (properties.created && typeof properties.created === "string") {
                properties.created = new Date(properties.created);
            }
            const jsonFields = ["metadata", "dependencies"];
            for (const field of jsonFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    try {
                        properties[field] = JSON.parse(properties[field]);
                    }
                    catch (_a) { }
                }
            }
            // Convert numeric fields from strings back to numbers
            const numericFields = ["size", "lines", "version"];
            for (const field of numericFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    const parsed = parseFloat(properties[field]);
                    if (!isNaN(parsed)) {
                        properties[field] = parsed;
                    }
                }
            }
            return properties;
        }
        // Case 3: node returned directly as array-of-pairs
        if (isPairArray(graphNode)) {
            const properties = toPropsFromPairs(graphNode);
            if (properties.lastModified &&
                typeof properties.lastModified === "string") {
                properties.lastModified = new Date(properties.lastModified);
            }
            if (properties.created && typeof properties.created === "string") {
                properties.created = new Date(properties.created);
            }
            const jsonFields = ["metadata", "dependencies"];
            for (const field of jsonFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    try {
                        properties[field] = JSON.parse(properties[field]);
                    }
                    catch (_b) { }
                }
            }
            // Convert numeric fields from strings back to numbers
            const numericFields = ["size", "lines", "version"];
            for (const field of numericFields) {
                if (properties[field] && typeof properties[field] === "string") {
                    const parsed = parseFloat(properties[field]);
                    if (!isNaN(parsed)) {
                        properties[field] = parsed;
                    }
                }
            }
            return properties;
        }
        // Case 4: already an object with id
        if (graphNode &&
            typeof graphNode === "object" &&
            typeof graphNode.id === "string") {
            return graphNode;
        }
        // Fallback for other formats
        return graphNode;
    }
    parseRelationshipFromGraph(graphResult) {
        // Parse relationship from FalkorDB result format
        // FalkorDB returns: { r: [...relationship data...], fromId: "string", toId: "string" }
        if (graphResult && graphResult.r) {
            const relData = graphResult.r;
            // If it's an array format, parse it
            if (Array.isArray(relData)) {
                const properties = {};
                for (const [key, value] of relData) {
                    if (key === "properties" && Array.isArray(value)) {
                        // Parse nested properties
                        const nestedProps = {};
                        for (const [propKey, propValue] of value) {
                            nestedProps[propKey] = propValue;
                        }
                        Object.assign(properties, nestedProps);
                    }
                    else if (key === "type") {
                        // Store the relationship type
                        properties.type = value;
                    }
                    else if (key !== "src_node" && key !== "dest_node") {
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
                if (properties.lastModified &&
                    typeof properties.lastModified === "string") {
                    properties.lastModified = new Date(properties.lastModified);
                }
                if (properties.metadata && typeof properties.metadata === "string") {
                    try {
                        properties.metadata = JSON.parse(properties.metadata);
                    }
                    catch (e) {
                        // Keep as string if parsing fails
                    }
                }
                // Rehydrate structured location from flat properties if present
                try {
                    const lp = properties.location_path;
                    const ll = properties.location_line;
                    const lc = properties.location_col;
                    if (lp != null || ll != null || lc != null) {
                        properties.location = {
                            ...(lp != null ? { path: lp } : {}),
                            ...(typeof ll === 'number' ? { line: ll } : {}),
                            ...(typeof lc === 'number' ? { column: lc } : {}),
                        };
                    }
                    // Do not leak internal fields to callers
                    delete properties.location_path;
                    delete properties.location_line;
                    delete properties.location_col;
                    // Evidence and locations as first-class JSON; if stored as JSON strings, parse them
                    const ev = properties.evidence;
                    if (typeof ev === 'string') {
                        try {
                            properties.evidence = JSON.parse(ev);
                        }
                        catch (_a) { }
                    }
                    const locs = properties.locations;
                    if (typeof locs === 'string') {
                        try {
                            properties.locations = JSON.parse(locs);
                        }
                        catch (_b) { }
                    }
                    // genericArguments may be stored as JSON string
                    const gargs = properties.genericArguments;
                    if (typeof gargs === 'string') {
                        try {
                            properties.genericArguments = JSON.parse(gargs);
                        }
                        catch (_c) { }
                    }
                    // first/last seen timestamps
                    if (properties.firstSeenAt && typeof properties.firstSeenAt === 'string') {
                        try {
                            properties.firstSeenAt = new Date(properties.firstSeenAt);
                        }
                        catch (_d) { }
                    }
                    if (properties.lastSeenAt && typeof properties.lastSeenAt === 'string') {
                        try {
                            properties.lastSeenAt = new Date(properties.lastSeenAt);
                        }
                        catch (_e) { }
                    }
                }
                catch (_f) { }
                return properties;
            }
        }
        // Fallback to original format
        return graphResult.r;
    }
    getEntityContentForEmbedding(entity) {
        return embeddingService.generateEntityContent(entity);
    }
    getEmbeddingCollection(entity) {
        return entity.type === "documentation"
            ? "documentation_embeddings"
            : "code_embeddings";
    }
    getEntitySignature(entity) {
        switch (entity.type) {
            case "symbol":
                const symbolEntity = entity;
                if (symbolEntity.kind === "function") {
                    return symbolEntity.signature;
                }
                else if (symbolEntity.kind === "class") {
                    return `class ${symbolEntity.name}`;
                }
                return symbolEntity.signature;
            default:
                return this.hasCodebaseProperties(entity)
                    ? entity.path
                    : entity.id;
        }
    }
    async listEntities(options = {}) {
        var _a;
        const { type, language, path, tags, limit = 50, offset = 0 } = options;
        let query = "MATCH (n)";
        const whereClause = [];
        const params = {};
        // Add type filter
        if (type) {
            whereClause.push("n.type = $type");
            params.type = type;
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
        const result = await this.db.falkordbQuery(fullQuery, params);
        const entities = result.map((row) => this.parseEntityFromGraph(row));
        // Get total count
        const countQuery = `
      ${query}
      ${whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""}
      RETURN count(n) as total
    `;
        const countResult = await this.db.falkordbQuery(countQuery, params);
        const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return { entities, total };
    }
    async listRelationships(options = {}) {
        var _a;
        const { fromEntity, toEntity, type, limit = 50, offset = 0 } = options;
        let query = "MATCH (from)-[r]->(to)";
        const whereClause = [];
        const params = {};
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
        const result = await this.db.falkordbQuery(fullQuery, params);
        const relationships = result.map((row) => {
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
        const countResult = await this.db.falkordbQuery(countQuery, params);
        const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        return { relationships, total };
    }
    stringToNumericId(stringId) {
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
    sanitizeParameterName(name) {
        // Replace invalid characters with underscores to create valid Cypher parameter names
        // Cypher parameter names must match /^[a-zA-Z_][a-zA-Z0-9_]*$/
        return name.replace(/[^a-zA-Z0-9_]/g, "_");
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map