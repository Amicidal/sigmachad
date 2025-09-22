import crypto from "crypto";
import { RelationshipType, CODE_RELATIONSHIP_TYPES, isDocumentationRelationshipType, isPerformanceRelationshipType, isSessionRelationshipType, isStructuralRelationshipType, } from "../models/relationships.js";
import { sanitizeEnvironment } from "./environment.js";
const CODE_RELATIONSHIP_TYPE_SET = new Set(CODE_RELATIONSHIP_TYPES);
// --- Shared merge helpers for evidence/locations ---
export function mergeEdgeEvidence(a = [], b = [], limit = 20) {
    const arr = [
        ...(Array.isArray(a) ? a : []),
        ...(Array.isArray(b) ? b : []),
    ].filter(Boolean);
    const key = (e) => {
        var _a, _b, _c;
        return `${e.source || ""}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ""}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ""}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ""}`;
    };
    const rankSrc = (e) => e.source === "type-checker" ? 3 : e.source === "ast" ? 2 : 1;
    const seen = new Set();
    const out = [];
    for (const e of arr.sort((x, y) => {
        var _a, _b;
        const rs = rankSrc(y) - rankSrc(x);
        if (rs !== 0)
            return rs;
        const lx = typeof ((_a = x.location) === null || _a === void 0 ? void 0 : _a.line) === "number"
            ? x.location.line
            : Number.MAX_SAFE_INTEGER;
        const ly = typeof ((_b = y.location) === null || _b === void 0 ? void 0 : _b.line) === "number"
            ? y.location.line
            : Number.MAX_SAFE_INTEGER;
        return lx - ly;
    })) {
        const k = key(e);
        if (!seen.has(k)) {
            seen.add(k);
            out.push(e);
        }
        if (out.length >= limit)
            break;
    }
    return out;
}
export function mergeEdgeLocations(a = [], b = [], limit = 20) {
    const arr = [
        ...(Array.isArray(a) ? a : []),
        ...(Array.isArray(b) ? b : []),
    ].filter(Boolean);
    const key = (l) => `${l.path || ""}|${l.line || ""}|${l.column || ""}`;
    const seen = new Set();
    const out = [];
    for (const l of arr) {
        const k = key(l);
        if (!seen.has(k)) {
            seen.add(k);
            out.push(l);
        }
        if (out.length >= limit)
            break;
    }
    return out;
}
export function isCodeRelationship(type) {
    // Handle legacy USES type
    if (type === "USES")
        return true;
    return CODE_RELATIONSHIP_TYPE_SET.has(type);
}
export function normalizeSource(s) {
    if (!s)
        return undefined;
    const v = String(s).toLowerCase();
    if (v === "call-typecheck" ||
        v === "ts" ||
        v === "checker" ||
        v === "tc" ||
        v === "type-checker")
        return "type-checker";
    if (v === "ts-ast" || v === "ast" || v === "parser")
        return "ast";
    if (v === "heuristic" || v === "inferred")
        return "heuristic";
    if (v === "index" || v === "indexer")
        return "index";
    if (v === "runtime" || v === "instrumentation")
        return "runtime";
    if (v === "lsp" || v === "language-server")
        return "lsp";
    // Default to heuristic if unknown string was provided
    return "heuristic";
}
// Compute a canonical target key for code edges to keep relationship IDs stable as resolution improves
export function canonicalTargetKeyFor(rel) {
    const anyRel = rel;
    const t = String(rel.toEntityId || "");
    const toRef = anyRel.toRef;
    // Prefer structured toRef
    if (toRef && typeof toRef === "object") {
        if (toRef.kind === "entity" && toRef.id)
            return `ENT:${toRef.id}`;
        if (toRef.kind === "fileSymbol" &&
            (toRef.file || toRef.symbol || toRef.name)) {
            const file = toRef.file || "";
            const sym = (toRef.symbol || toRef.name || "");
            return `FS:${file}:${sym}`;
        }
        if (toRef.kind === "external" && toRef.name)
            return `EXT:${toRef.name}`;
    }
    // Fallback to parsing toEntityId
    // Concrete entity id (sym:/file: path without symbol) → ENT (keeps id unique)
    if (/^(sym:|file:[^:]+$)/.test(t))
        return `ENT:${t}`;
    // File symbol placeholder: file:<relPath>:<name>
    {
        const m = t.match(/^file:(.+?):(.+)$/);
        if (m)
            return `FS:${m[1]}:${m[2]}`;
    }
    // External name
    {
        const m = t.match(/^external:(.+)$/);
        if (m)
            return `EXT:${m[1]}`;
    }
    // Kind-qualified placeholders
    {
        const m = t.match(/^(class|interface|function|typeAlias):(.+)$/);
        if (m)
            return `KIND:${m[1]}:${m[2]}`;
    }
    // Import placeholder
    {
        const m = t.match(/^import:(.+?):(.+)$/);
        if (m)
            return `IMP:${m[1]}:${m[2]}`;
    }
    // Raw fallback
    return `RAW:${t}`;
}
const EVIDENCE_NOTE_MAX = 2000;
const EXTRACTOR_VERSION_MAX = 200;
const PATH_MAX = 4096;
function clampConfidenceValue(value) {
    const num = typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : NaN;
    if (!Number.isFinite(num))
        return undefined;
    const clamped = Math.max(0, Math.min(1, num));
    return clamped;
}
function sanitizeStringValue(value, maxLength) {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}
function sanitizeLocationEntry(value) {
    if (!value || typeof value !== "object")
        return null;
    const out = {};
    const path = sanitizeStringValue(value.path, PATH_MAX);
    if (path)
        out.path = path;
    const lineRaw = value.line;
    const lineNum = Number(lineRaw);
    if (Number.isFinite(lineNum)) {
        const line = Math.max(0, Math.round(lineNum));
        out.line = line;
    }
    const columnRaw = value.column;
    const columnNum = Number(columnRaw);
    if (Number.isFinite(columnNum)) {
        const column = Math.max(0, Math.round(columnNum));
        out.column = column;
    }
    return out.path !== undefined ||
        out.line !== undefined ||
        out.column !== undefined
        ? out
        : null;
}
function sanitizeLocationList(value) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const entry of value) {
        const sanitized = sanitizeLocationEntry(entry);
        if (sanitized) {
            out.push(sanitized);
            if (out.length >= 20)
                break;
        }
    }
    return out;
}
function sanitizeEvidenceList(value, fallbackSource) {
    const arr = Array.isArray(value) ? value : [];
    const out = [];
    for (const entry of arr) {
        if (!entry || typeof entry !== "object")
            continue;
        const srcNormalized = normalizeSource(entry.source) || fallbackSource;
        const ev = { source: srcNormalized };
        const confidence = clampConfidenceValue(entry.confidence);
        if (confidence !== undefined)
            ev.confidence = confidence;
        const loc = sanitizeLocationEntry(entry.location);
        if (loc)
            ev.location = loc;
        const note = sanitizeStringValue(entry.note, EVIDENCE_NOTE_MAX);
        if (note)
            ev.note = note;
        const extractorVersion = sanitizeStringValue(entry.extractorVersion, EXTRACTOR_VERSION_MAX);
        if (extractorVersion)
            ev.extractorVersion = extractorVersion;
        out.push(ev);
        if (out.length >= 20)
            break;
    }
    return out;
}
function coerceNonNegative(value, { integer = false } = {}) {
    const parsed = typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : NaN;
    if (!Number.isFinite(parsed))
        return undefined;
    const sanitized = parsed < 0 ? 0 : parsed;
    return integer ? Math.floor(sanitized) : sanitized;
}
export function normalizeCodeEdge(relIn) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rel = { ...relIn };
    // Backwards compatibility: old ingesters emitted USES instead of TYPE_USES
    if (rel.type === "USES")
        rel.type = RelationshipType.TYPE_USES;
    if (!isCodeRelationship(rel.type))
        return rel;
    const md = (rel.metadata || {});
    // Unified hoisting from metadata to top-level for consistent access
    const hoist = (k, mapKey) => {
        const key = mapKey || k;
        if (rel[key] == null && md[k] != null)
            rel[key] = md[k];
    };
    [
        "kind",
        "resolution",
        "scope",
        "arity",
        "awaited",
        "operator",
        "importDepth",
        "usedTypeChecker",
        "isExported",
        "accessPath",
        "dataFlowId",
        "confidence",
        "inferred",
        "resolved",
        "source",
        "callee",
        "paramName",
        "importAlias",
        "receiverType",
        "dynamicDispatch",
        "overloadIndex",
        "genericArguments",
        "ambiguous",
        "candidateCount",
        "isMethod",
        "occurrencesScan",
        "occurrencesTotal",
        "occurrencesRecent",
    ].forEach((k) => hoist(k));
    // For PARAM_TYPE legacy param -> paramName
    hoist("param", "paramName");
    const occScan = coerceNonNegative(rel.occurrencesScan, { integer: true });
    if (occScan !== undefined)
        rel.occurrencesScan = occScan;
    else
        delete rel.occurrencesScan;
    const occTotal = coerceNonNegative(rel.occurrencesTotal, { integer: true });
    if (occTotal !== undefined)
        rel.occurrencesTotal = occTotal;
    else
        delete rel.occurrencesTotal;
    const occRecent = coerceNonNegative(rel.occurrencesRecent, {
        integer: false,
    });
    if (occRecent !== undefined)
        rel.occurrencesRecent = occRecent;
    else
        delete rel.occurrencesRecent;
    rel.source = normalizeSource(rel.source || md.source);
    // Consolidate: confidence is canonical; map legacy strength inputs when present
    if (typeof rel.confidence !== "number" &&
        typeof rel.strength === "number") {
        rel.confidence = Math.max(0, Math.min(1, rel.strength));
    }
    if (rel.strength !== undefined) {
        delete rel.strength;
    }
    // Default active=true when seen
    if (typeof rel.active !== "boolean")
        rel.active = true;
    // Compose context/location
    const path = ((_a = rel.location) === null || _a === void 0 ? void 0 : _a.path) || md.path;
    const line = (_c = (_b = rel.location) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : md.line;
    const column = (_e = (_d = rel.location) === null || _d === void 0 ? void 0 : _d.column) !== null && _e !== void 0 ? _e : md.column;
    if (!rel.context && typeof path === "string" && typeof line === "number")
        rel.context = `${path}:${line}`;
    if (!rel.location &&
        (path || typeof line === "number" || typeof column === "number")) {
        rel.location = {
            ...(path ? { path } : {}),
            ...(typeof line === "number" ? { line } : {}),
            ...(typeof column === "number" ? { column } : {}),
        };
    }
    const locationSanitized = sanitizeLocationEntry(rel.location);
    if (locationSanitized)
        rel.location = locationSanitized;
    else if (rel.location != null)
        delete rel.location;
    // Site sampling
    if (!rel.siteId &&
        rel.location &&
        rel.location.path &&
        typeof rel.location.line === "number") {
        const base = `${rel.location.path}|${rel.location.line}|${(_f = rel.location.column) !== null && _f !== void 0 ? _f : ""}|${(_g = rel.accessPath) !== null && _g !== void 0 ? _g : ""}`;
        rel.siteId =
            "site_" +
                crypto.createHash("sha1").update(base).digest("hex").slice(0, 12);
    }
    // Stable-ish site hash using richer context to survive small shifts
    if (!rel.siteHash) {
        const payload = JSON.stringify({
            p: (_h = rel.location) === null || _h === void 0 ? void 0 : _h.path,
            a: rel.accessPath,
            k: rel.kind,
            c: rel.callee,
            o: rel.operator,
            pm: rel.paramName,
            t: rel.type,
            f: rel.fromEntityId,
        });
        rel.siteHash =
            "sh_" +
                crypto.createHash("sha1").update(payload).digest("hex").slice(0, 16);
    }
    if (Array.isArray(rel.sites)) {
        rel.sites = Array.from(new Set(rel.sites.concat(rel.siteId ? [rel.siteId] : []))).slice(0, 20);
    }
    else if (rel.siteId) {
        rel.sites = [rel.siteId];
    }
    // Evidence merge & top-K preference
    const evTop = Array.isArray(rel.evidence) ? rel.evidence : [];
    const evMd = Array.isArray(md.evidence) ? md.evidence : [];
    const out = mergeEdgeEvidence(evTop, evMd, 20);
    if (out.length > 0)
        rel.evidence = out;
    else {
        const def = {
            source: rel.source || "ast",
            confidence: typeof rel.confidence === "number"
                ? rel.confidence
                : undefined,
            location: rel.location,
            note: typeof md.note === "string" ? md.note : undefined,
            extractorVersion: typeof md.extractorVersion === "string"
                ? md.extractorVersion
                : undefined,
        };
        rel.evidence = [def];
    }
    const fallbackSource = rel.source || "ast";
    let sanitizedEvidence = sanitizeEvidenceList(rel.evidence, fallbackSource);
    if (sanitizedEvidence.length === 0) {
        sanitizedEvidence = sanitizeEvidenceList([
            {
                source: fallbackSource,
                confidence: clampConfidenceValue(rel.confidence),
                location: rel.location,
                note: typeof md.note === "string" ? md.note : undefined,
                extractorVersion: typeof md.extractorVersion === "string"
                    ? md.extractorVersion
                    : undefined,
            },
        ], fallbackSource);
    }
    if (sanitizedEvidence.length === 0) {
        sanitizedEvidence = [{ source: fallbackSource }];
    }
    rel.evidence = sanitizedEvidence;
    const combinedLocations = sanitizeLocationList([
        ...(Array.isArray(rel.locations) ? rel.locations : []),
        ...(Array.isArray(md.locations) ? md.locations : []),
    ]);
    if (combinedLocations.length > 0)
        rel.locations = combinedLocations;
    else
        delete rel.locations;
    // Carry toRef/fromRef into metadata for persistence/audit if not stored elsewhere
    const mdNew = { ...md };
    delete mdNew.evidence;
    delete mdNew.locations;
    if (rel.fromRef && mdNew.fromRef == null)
        mdNew.fromRef = rel.fromRef;
    if (rel.toRef && mdNew.toRef == null)
        mdNew.toRef = rel.toRef;
    rel.metadata = mdNew;
    // Promote toRef scalars for querying
    try {
        const t = String(rel.toEntityId || "");
        const toRef = rel.toRef || mdNew.toRef;
        const parseSym = (symId) => {
            // sym:<relPath>#<name>@<hash>
            const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
            if (!m)
                return null;
            const file = m[1];
            const symbol = m[2];
            return { file, symbol, name: symbol };
        };
        const setFileSym = (file, sym) => {
            rel.to_ref_kind = "fileSymbol";
            rel.to_ref_file = file;
            rel.to_ref_symbol = sym;
            rel.to_ref_name = rel.to_ref_name || sym;
        };
        if (toRef && typeof toRef === "object") {
            if (toRef.kind === "entity") {
                rel.to_ref_kind = "entity";
                rel.to_ref_name = toRef.name || rel.to_ref_name;
            }
            else if (toRef.kind === "fileSymbol") {
                setFileSym(toRef.file || "", toRef.symbol || toRef.name || "");
            }
            else if (toRef.kind === "external") {
                rel.to_ref_kind = "external";
                rel.to_ref_name = toRef.name || rel.to_ref_name;
            }
        }
        else {
            // sym: concrete symbol ids
            if (t.startsWith("sym:")) {
                const parsed = parseSym(t);
                if (parsed)
                    setFileSym(parsed.file, parsed.symbol);
            }
            const mFile = t.match(/^file:(.+?):(.+)$/);
            if (mFile)
                setFileSym(mFile[1], mFile[2]);
            const mExt = t.match(/^external:(.+)$/);
            if (mExt) {
                rel.to_ref_kind = "external";
                rel.to_ref_name = mExt[1];
            }
            if (/^(sym:|file:)/.test(t)) {
                rel.to_ref_kind = rel.to_ref_kind || "entity";
            }
        }
    }
    catch (_j) { }
    // Promote fromRef scalars for querying (mirror of to_ref_*)
    try {
        const f = String(rel.fromEntityId || "");
        const fromRef = rel.fromRef || mdNew.fromRef;
        const parseSymFrom = (symId) => {
            const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
            if (!m)
                return null;
            const file = m[1];
            const symbol = m[2];
            return { file, symbol, name: symbol };
        };
        const setFromFileSym = (file, sym) => {
            rel.from_ref_kind = "fileSymbol";
            rel.from_ref_file = file;
            rel.from_ref_symbol = sym;
            rel.from_ref_name = rel.from_ref_name || sym;
        };
        if (fromRef && typeof fromRef === "object") {
            if (fromRef.kind === "entity") {
                rel.from_ref_kind = "entity";
                rel.from_ref_name = fromRef.name || rel.from_ref_name;
            }
            else if (fromRef.kind === "fileSymbol") {
                setFromFileSym(fromRef.file || "", fromRef.symbol || fromRef.name || "");
            }
            else if (fromRef.kind === "external") {
                rel.from_ref_kind = "external";
                rel.from_ref_name = fromRef.name || rel.from_ref_name;
            }
        }
        else {
            if (f.startsWith("sym:")) {
                const parsed = parseSymFrom(f);
                if (parsed)
                    setFromFileSym(parsed.file, parsed.symbol);
            }
            const mFile = f.match(/^file:(.+?):(.+)$/);
            if (mFile)
                setFromFileSym(mFile[1], mFile[2]);
            const mExt = f.match(/^external:(.+)$/);
            if (mExt) {
                rel.from_ref_kind = "external";
                rel.from_ref_name = mExt[1];
            }
            if (/^(sym:|file:)/.test(f)) {
                rel.from_ref_kind = rel.from_ref_kind || "entity";
            }
        }
    }
    catch (_k) { }
    // Backfill kind defaults when missing (kept lightweight; semantic defaults)
    try {
        if (!rel.kind) {
            switch (rel.type) {
                case RelationshipType.CALLS:
                    rel.kind = "call";
                    break;
                case RelationshipType.REFERENCES:
                    rel.kind = "identifier";
                    break;
                case RelationshipType.OVERRIDES:
                    rel.kind = "override";
                    break;
                case RelationshipType.EXTENDS:
                case RelationshipType.IMPLEMENTS:
                    rel.kind = "inheritance";
                    break;
                case RelationshipType.READS:
                    rel.kind = "read";
                    break;
                case RelationshipType.WRITES:
                    rel.kind = "write";
                    break;
                case RelationshipType.DEPENDS_ON:
                    rel.kind = "dependency";
                    break;
                case RelationshipType.THROWS:
                    rel.kind = "throw";
                    break;
                case RelationshipType.TYPE_USES:
                    rel.kind = "type";
                    break;
                case RelationshipType.RETURNS_TYPE:
                    rel.kind = "return";
                    break;
                case RelationshipType.PARAM_TYPE:
                    rel.kind = "param";
                    break;
            }
        }
    }
    catch (_l) { }
    return rel;
}
// Compute canonical relationship id for code edges using the canonical target key
export function canonicalRelationshipId(fromId, rel) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (isStructuralRelationshipType(rel.type)) {
        const baseTarget = canonicalTargetKeyFor(rel);
        const base = `${fromId}|${baseTarget}|${rel.type}`;
        return "time-rel_" + crypto.createHash("sha1").update(base).digest("hex");
    }
    if (isSessionRelationshipType(rel.type)) {
        const anyRel = rel;
        const sessionIdSource = (_c = (_a = anyRel.sessionId) !== null && _a !== void 0 ? _a : (_b = anyRel.metadata) === null || _b === void 0 ? void 0 : _b.sessionId) !== null && _c !== void 0 ? _c : (typeof rel.fromEntityId === "string" && rel.fromEntityId
            ? rel.fromEntityId
            : "");
        const sessionId = String(sessionIdSource || "")
            .trim()
            .toLowerCase();
        const sequenceSource = (_f = (_d = anyRel.sequenceNumber) !== null && _d !== void 0 ? _d : (_e = anyRel.metadata) === null || _e === void 0 ? void 0 : _e.sequenceNumber) !== null && _f !== void 0 ? _f : 0;
        const sequenceNumber = Number.isFinite(Number(sequenceSource))
            ? Math.max(0, Math.floor(Number(sequenceSource)))
            : 0;
        const base = `${sessionId}|${sequenceNumber}|${rel.type}`;
        return ("rel_session_" +
            crypto.createHash("sha1").update(base).digest("hex"));
    }
    if (isPerformanceRelationshipType(rel.type)) {
        const anyRel = rel;
        const md = anyRel.metadata && typeof anyRel.metadata === "object"
            ? anyRel.metadata
            : {};
        const metricId = normalizeMetricIdForId((_j = (_h = (_g = anyRel.metricId) !== null && _g !== void 0 ? _g : md.metricId) !== null && _h !== void 0 ? _h : rel.toEntityId) !== null && _j !== void 0 ? _j : "unknown");
        const environment = sanitizeEnvironment((_l = (_k = anyRel.environment) !== null && _k !== void 0 ? _k : md.environment) !== null && _l !== void 0 ? _l : "unknown");
        const scenario = normalizeScenarioForId((_m = anyRel.scenario) !== null && _m !== void 0 ? _m : md.scenario);
        const target = String(rel.toEntityId || "");
        const base = `${fromId}|${target}|${rel.type}|${metricId}|${environment}|${scenario}`;
        return ("rel_perf_" + crypto.createHash("sha1").update(base).digest("hex"));
    }
    const baseTarget = isCodeRelationship(rel.type)
        ? canonicalTargetKeyFor(rel)
        : isDocumentationRelationshipType(rel.type)
            ? canonicalDocumentationTargetKey(rel)
            : String(rel.toEntityId || "");
    const base = `${fromId}|${baseTarget}|${rel.type}`;
    return "rel_" + crypto.createHash("sha1").update(base).digest("hex");
}
// Produce the legacy structural relationship id (rel_*) for migration purposes
export function legacyStructuralRelationshipId(canonicalId, rel) {
    if (!isStructuralRelationshipType(rel.type))
        return null;
    if (canonicalId.startsWith("time-rel_")) {
        return "rel_" + canonicalId.slice("time-rel_".length);
    }
    if (canonicalId.startsWith("rel_"))
        return canonicalId;
    return null;
}
export function normalizeMetricIdForId(value) {
    if (!value)
        return "unknown";
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9/_\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/\/+/g, "/")
        .replace(/\/+$/g, "")
        .replace(/^\/+/, "")
        .slice(0, 256) || "unknown";
}
function normalizeScenarioForId(value) {
    if (!value)
        return "";
    return normalizeStringForId(value).toLowerCase();
}
function canonicalDocumentationTargetKey(rel) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const anyRel = rel;
    const md = anyRel.metadata && typeof anyRel.metadata === "object"
        ? anyRel.metadata
        : {};
    const source = normalizeDocSourceForId((_a = anyRel.source) !== null && _a !== void 0 ? _a : md.source);
    const docIntent = normalizeDocIntentForId((_b = anyRel.docIntent) !== null && _b !== void 0 ? _b : md.docIntent, rel.type);
    const sectionAnchor = normalizeAnchorForId((_d = (_c = anyRel.sectionAnchor) !== null && _c !== void 0 ? _c : md.sectionAnchor) !== null && _d !== void 0 ? _d : md.anchor);
    switch (rel.type) {
        case RelationshipType.DOCUMENTED_BY: {
            const docVersion = normalizeStringForId((_e = anyRel.docVersion) !== null && _e !== void 0 ? _e : md.docVersion);
            return `${rel.toEntityId}|${sectionAnchor}|${source}|${docIntent}|${docVersion}`;
        }
        case RelationshipType.DESCRIBES_DOMAIN: {
            const domainPath = normalizeDomainPathForId((_g = (_f = anyRel.domainPath) !== null && _f !== void 0 ? _f : md.domainPath) !== null && _g !== void 0 ? _g : md.taxonomyPath);
            const taxonomyVersion = normalizeStringForId((_h = anyRel.taxonomyVersion) !== null && _h !== void 0 ? _h : md.taxonomyVersion);
            return `${rel.toEntityId}|${domainPath}|${taxonomyVersion}|${sectionAnchor}|${docIntent}`;
        }
        case RelationshipType.BELONGS_TO_DOMAIN: {
            const domainPath = normalizeDomainPathForId((_j = anyRel.domainPath) !== null && _j !== void 0 ? _j : md.domainPath);
            return `${rel.toEntityId}|${domainPath}|${source}|${docIntent}`;
        }
        case RelationshipType.CLUSTER_MEMBER: {
            const clusterVersion = normalizeStringForId((_k = anyRel.clusterVersion) !== null && _k !== void 0 ? _k : md.clusterVersion);
            const docAnchor = normalizeAnchorForId((_m = (_l = anyRel.docAnchor) !== null && _l !== void 0 ? _l : md.docAnchor) !== null && _m !== void 0 ? _m : sectionAnchor);
            const embeddingVersion = normalizeStringForId((_o = anyRel.embeddingVersion) !== null && _o !== void 0 ? _o : md.embeddingVersion);
            return `${rel.toEntityId}|${clusterVersion}|${docAnchor}|${embeddingVersion}|${docIntent}`;
        }
        case RelationshipType.DOMAIN_RELATED: {
            const relationshipType = normalizeStringForId((_p = anyRel.relationshipType) !== null && _p !== void 0 ? _p : md.relationshipType);
            return `${rel.toEntityId}|${relationshipType}|${source}`;
        }
        case RelationshipType.GOVERNED_BY: {
            const policyType = normalizeStringForId((_q = anyRel.policyType) !== null && _q !== void 0 ? _q : md.policyType);
            return `${rel.toEntityId}|${policyType}|${docIntent}`;
        }
        case RelationshipType.DOCUMENTS_SECTION: {
            return `${rel.toEntityId}|${sectionAnchor}|${docIntent}`;
        }
        default:
            return String(rel.toEntityId || "");
    }
}
function normalizeAnchorForId(anchor) {
    if (!anchor)
        return "_root";
    const normalized = String(anchor)
        .trim()
        .replace(/^#+/, "")
        .toLowerCase()
        .replace(/[^a-z0-9\-_/\s]+/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-/g, "")
        .replace(/-$/g, "");
    return normalized.length > 0 ? normalized.slice(0, 128) : "_root";
}
function normalizeDomainPathForId(value) {
    if (!value)
        return "";
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/>+/g, "/")
        .replace(/\s+/g, "/")
        .replace(/[^a-z0-9/_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/\/+/, "/")
        .replace(/^\/+|\/+$/g, "");
}
function normalizeStringForId(value) {
    if (typeof value !== "string")
        return "";
    return value.trim();
}
function normalizeDocSourceForId(value) {
    if (!value)
        return "";
    const normalized = String(value).toLowerCase();
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
function normalizeDocIntentForId(value, type) {
    if (value === null || value === undefined) {
        if (type === RelationshipType.GOVERNED_BY)
            return "governance";
        return "ai-context";
    }
    const normalized = String(value).toLowerCase();
    if (normalized === "ai-context" ||
        normalized === "governance" ||
        normalized === "mixed") {
        return normalized;
    }
    return type === RelationshipType.GOVERNED_BY ? "governance" : "ai-context";
}
//# sourceMappingURL=codeEdges.js.map