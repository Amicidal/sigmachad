/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { RelationshipType, } from "../models/relationships.js";
import { embeddingService } from "../utils/embedding.js";
import { EventEmitter } from "events";
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
                await time('neighbors.depth3', async () => await this.db.falkordbQuery(`MATCH (s {id: $id})-[:DEPENDS_ON*1..3]-(n) RETURN count(n) AS c`, { id: sampleId }));
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
        // Handle backward compatibility with old calling signature
        let relationshipObj;
        if (typeof relationship === "string") {
            // Old signature: createRelationship(fromEntityId, toEntityId, type)
            if (!toEntityId || !type) {
                throw new Error("Invalid parameters: when using old signature, both toEntityId and type are required");
            }
            const deterministicId = `rel_${relationship}_${toEntityId}_${type}`;
            relationshipObj = {
                id: deterministicId,
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
            if (!rel.id) {
                rel.id = `rel_${rel.fromEntityId}_${rel.toEntityId}_${rel.type}`;
            }
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
        const query = `
      MATCH (a {id: $fromId}), (b {id: $toId})
      MERGE (a)-[r:${relationshipObj.type} { id: $id }]->(b)
      ON CREATE SET r.created = $created, r.version = $version, r.metadata = $metadata
      SET r.lastModified = $lastModified
    `;
        const result = await this.db.falkordbQuery(query, {
            fromId: relationshipObj.fromEntityId,
            toId: relationshipObj.toEntityId,
            id: relationshipObj.id,
            created: relationshipObj.created.toISOString(),
            lastModified: relationshipObj.lastModified.toISOString(),
            version: relationshipObj.version,
            metadata: JSON.stringify(relationshipObj.metadata || {}),
        });
        // Emit event for real-time updates
        this.emit("relationshipCreated", {
            id: relationshipObj.id,
            type: relationshipObj.type,
            fromEntityId: relationshipObj.fromEntityId,
            toEntityId: relationshipObj.toEntityId,
            timestamp: new Date().toISOString(),
        });
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
        var _a;
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
            const rows = listEff.map((r) => ({
                fromId: r.fromEntityId,
                toId: r.toEntityId,
                id: r.id || `rel_${r.fromEntityId}_${r.toEntityId}_${type}`,
                created: (r.created instanceof Date ? r.created : new Date(r.created)).toISOString(),
                lastModified: (r.lastModified instanceof Date ? r.lastModified : new Date(r.lastModified)).toISOString(),
                version: r.version,
                metadata: JSON.stringify(r.metadata || {}),
            }));
            const query = `
        UNWIND $rows AS row
        MATCH (a {id: row.fromId}), (b {id: row.toId})
        MERGE (a)-[r:${type} { id: row.id }]->(b)
        ON CREATE SET r.created = row.created, r.version = row.version, r.metadata = row.metadata
        SET r.lastModified = row.lastModified
      `;
            await this.db.falkordbQuery(query, { rows });
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
            const caller = await this.getEntity(rel.fromEntityId);
            if (caller && this.hasCodebaseProperties(caller)) {
                return {
                    context: `${caller.path}:${rel.type}`,
                    code: `// Usage in ${caller.path}`,
                    file: caller.path,
                    line: 1, // Would need to be determined from AST
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