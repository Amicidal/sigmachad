import crypto from 'crypto';
import { RelationshipType, } from '../models/relationships.js';
export function isCodeRelationship(type) {
    return (type === RelationshipType.CALLS ||
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.DEPENDS_ON ||
        type === RelationshipType.IMPLEMENTS ||
        type === RelationshipType.EXTENDS ||
        type === RelationshipType.OVERRIDES ||
        type === RelationshipType.READS ||
        type === RelationshipType.WRITES ||
        type === RelationshipType.THROWS ||
        type === RelationshipType.TYPE_USES ||
        type === RelationshipType.RETURNS_TYPE ||
        type === RelationshipType.PARAM_TYPE);
}
export function normalizeSource(s) {
    if (!s)
        return undefined;
    const v = String(s).toLowerCase();
    if (v === 'call-typecheck' || v === 'ts' || v === 'checker' || v === 'tc' || v === 'type-checker')
        return 'type-checker';
    if (v === 'ts-ast' || v === 'ast' || v === 'parser')
        return 'ast';
    if (v === 'heuristic' || v === 'inferred')
        return 'heuristic';
    if (v === 'index' || v === 'indexer')
        return 'index';
    if (v === 'runtime' || v === 'instrumentation')
        return 'runtime';
    if (v === 'lsp' || v === 'language-server')
        return 'lsp';
    // Default to heuristic if unknown string was provided
    return 'heuristic';
}
// Compute a canonical target key for code edges to keep relationship IDs stable as resolution improves
export function canonicalTargetKeyFor(rel) {
    const anyRel = rel;
    const t = String(rel.toEntityId || '');
    const toRef = anyRel.toRef;
    // Prefer structured toRef
    if (toRef && typeof toRef === 'object') {
        if (toRef.kind === 'entity' && toRef.id)
            return `ENT:${toRef.id}`;
        if (toRef.kind === 'fileSymbol' && (toRef.file || toRef.symbol || toRef.name)) {
            const file = toRef.file || '';
            const sym = (toRef.symbol || toRef.name || '');
            return `FS:${file}:${sym}`;
        }
        if (toRef.kind === 'external' && toRef.name)
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
export function normalizeCodeEdge(relIn) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rel = { ...relIn };
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
        'kind', 'resolution', 'scope', 'arity', 'awaited', 'operator', 'importDepth', 'usedTypeChecker', 'isExported', 'accessPath',
        'occurrences', 'confidence', 'inferred', 'resolved', 'source', 'callee', 'paramName', 'importAlias', 'receiverType', 'dynamicDispatch', 'overloadIndex', 'genericArguments',
        'ambiguous', 'candidateCount', 'isMethod'
    ].forEach((k) => hoist(k));
    // For PARAM_TYPE legacy param -> paramName
    hoist('param', 'paramName');
    rel.source = normalizeSource(rel.source || md.source);
    // Consolidate: confidence is canonical; strength mirrors confidence for compatibility
    if (typeof rel.confidence !== 'number' && typeof rel.strength === 'number') {
        rel.confidence = Math.max(0, Math.min(1, rel.strength));
    }
    if (typeof rel.confidence === 'number') {
        rel.strength = Math.max(0, Math.min(1, rel.confidence));
    }
    // occurrencesScan: prefer explicit, then fallback to occurrences
    if (typeof rel.occurrencesScan !== 'number' && typeof rel.occurrences === 'number') {
        rel.occurrencesScan = rel.occurrences;
    }
    // Default active=true when seen
    if (typeof rel.active !== 'boolean')
        rel.active = true;
    // Compose context/location
    const path = ((_a = rel.location) === null || _a === void 0 ? void 0 : _a.path) || md.path;
    const line = ((_c = (_b = rel.location) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : md.line);
    const column = ((_e = (_d = rel.location) === null || _d === void 0 ? void 0 : _d.column) !== null && _e !== void 0 ? _e : md.column);
    if (!rel.context && typeof path === 'string' && typeof line === 'number')
        rel.context = `${path}:${line}`;
    if (!rel.location && (path || typeof line === 'number' || typeof column === 'number')) {
        rel.location = {
            ...(path ? { path } : {}),
            ...(typeof line === 'number' ? { line } : {}),
            ...(typeof column === 'number' ? { column } : {}),
        };
    }
    // Site sampling
    if (!rel.siteId && rel.location && rel.location.path && (typeof rel.location.line === 'number')) {
        const base = `${rel.location.path}|${rel.location.line}|${(_f = rel.location.column) !== null && _f !== void 0 ? _f : ''}|${(_g = rel.accessPath) !== null && _g !== void 0 ? _g : ''}`;
        rel.siteId = 'site_' + crypto.createHash('sha1').update(base).digest('hex').slice(0, 12);
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
        rel.siteHash = 'sh_' + crypto.createHash('sha1').update(payload).digest('hex').slice(0, 16);
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
    let ev = [...evMd, ...evTop].filter(Boolean);
    // Dedupe by (source,path,line,col)
    const seen = new Set();
    const key = (e) => { var _a, _b, _c; return `${e.source || ''}|${((_a = e.location) === null || _a === void 0 ? void 0 : _a.path) || ''}|${((_b = e.location) === null || _b === void 0 ? void 0 : _b.line) || ''}|${((_c = e.location) === null || _c === void 0 ? void 0 : _c.column) || ''}`; };
    const rankSrc = (e) => (e.source === 'type-checker' ? 3 : e.source === 'ast' ? 2 : 1);
    const out = [];
    for (const e of ev.sort((a, b) => {
        var _a, _b;
        const rs = rankSrc(b) - rankSrc(a);
        if (rs !== 0)
            return rs;
        const la = (typeof ((_a = a.location) === null || _a === void 0 ? void 0 : _a.line) === 'number' ? a.location.line : Number.MAX_SAFE_INTEGER);
        const lb = (typeof ((_b = b.location) === null || _b === void 0 ? void 0 : _b.line) === 'number' ? b.location.line : Number.MAX_SAFE_INTEGER);
        return la - lb;
    })) {
        const k = key(e);
        if (!seen.has(k)) {
            seen.add(k);
            out.push(e);
        }
        if (out.length >= 20)
            break; // align with persistence bounds
    }
    if (out.length > 0)
        rel.evidence = out;
    else {
        const def = {
            source: rel.source || 'ast',
            confidence: typeof rel.confidence === 'number' ? rel.confidence : undefined,
            location: rel.location,
            note: typeof md.note === 'string' ? md.note : undefined,
            extractorVersion: (typeof md.extractorVersion === 'string' ? md.extractorVersion : undefined),
        };
        rel.evidence = [def];
    }
    // Carry toRef/fromRef into metadata for persistence/audit if not stored elsewhere
    const mdNew = { ...md };
    if (rel.fromRef && mdNew.fromRef == null)
        mdNew.fromRef = rel.fromRef;
    if (rel.toRef && mdNew.toRef == null)
        mdNew.toRef = rel.toRef;
    rel.metadata = mdNew;
    // Promote toRef scalars for querying
    try {
        const t = String(rel.toEntityId || '');
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
            rel.to_ref_kind = 'fileSymbol';
            rel.to_ref_file = file;
            rel.to_ref_symbol = sym;
            rel.to_ref_name = rel.to_ref_name || sym;
        };
        if (toRef && typeof toRef === 'object') {
            if (toRef.kind === 'entity') {
                rel.to_ref_kind = 'entity';
                rel.to_ref_name = toRef.name || rel.to_ref_name;
            }
            else if (toRef.kind === 'fileSymbol') {
                setFileSym(toRef.file || '', toRef.symbol || toRef.name || '');
            }
            else if (toRef.kind === 'external') {
                rel.to_ref_kind = 'external';
                rel.to_ref_name = toRef.name || rel.to_ref_name;
            }
        }
        else {
            // sym: concrete symbol ids
            if (t.startsWith('sym:')) {
                const parsed = parseSym(t);
                if (parsed)
                    setFileSym(parsed.file, parsed.symbol);
            }
            const mFile = t.match(/^file:(.+?):(.+)$/);
            if (mFile)
                setFileSym(mFile[1], mFile[2]);
            const mExt = t.match(/^external:(.+)$/);
            if (mExt) {
                rel.to_ref_kind = 'external';
                rel.to_ref_name = mExt[1];
            }
            if (/^(sym:|file:)/.test(t)) {
                rel.to_ref_kind = rel.to_ref_kind || 'entity';
            }
        }
    }
    catch (_j) { }
    // Promote fromRef scalars for querying (mirror of to_ref_*)
    try {
        const f = String(rel.fromEntityId || '');
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
            rel.from_ref_kind = 'fileSymbol';
            rel.from_ref_file = file;
            rel.from_ref_symbol = sym;
            rel.from_ref_name = rel.from_ref_name || sym;
        };
        if (fromRef && typeof fromRef === 'object') {
            if (fromRef.kind === 'entity') {
                rel.from_ref_kind = 'entity';
                rel.from_ref_name = fromRef.name || rel.from_ref_name;
            }
            else if (fromRef.kind === 'fileSymbol') {
                setFromFileSym(fromRef.file || '', fromRef.symbol || fromRef.name || '');
            }
            else if (fromRef.kind === 'external') {
                rel.from_ref_kind = 'external';
                rel.from_ref_name = fromRef.name || rel.from_ref_name;
            }
        }
        else {
            if (f.startsWith('sym:')) {
                const parsed = parseSymFrom(f);
                if (parsed)
                    setFromFileSym(parsed.file, parsed.symbol);
            }
            const mFile = f.match(/^file:(.+?):(.+)$/);
            if (mFile)
                setFromFileSym(mFile[1], mFile[2]);
            const mExt = f.match(/^external:(.+)$/);
            if (mExt) {
                rel.from_ref_kind = 'external';
                rel.from_ref_name = mExt[1];
            }
            if (/^(sym:|file:)/.test(f)) {
                rel.from_ref_kind = rel.from_ref_kind || 'entity';
            }
        }
    }
    catch (_k) { }
    // Backfill kind defaults when missing (kept lightweight; semantic defaults)
    try {
        if (!rel.kind) {
            switch (rel.type) {
                case RelationshipType.CALLS:
                    rel.kind = 'call';
                    break;
                case RelationshipType.REFERENCES:
                    rel.kind = 'identifier';
                    break;
                case RelationshipType.OVERRIDES:
                    rel.kind = 'override';
                    break;
                case RelationshipType.EXTENDS:
                case RelationshipType.IMPLEMENTS:
                    rel.kind = 'inheritance';
                    break;
                case RelationshipType.READS:
                    rel.kind = 'read';
                    break;
                case RelationshipType.WRITES:
                    rel.kind = 'write';
                    break;
                case RelationshipType.THROWS:
                    rel.kind = 'throw';
                    break;
                case RelationshipType.TYPE_USES:
                    rel.kind = 'type';
                    break;
                case RelationshipType.RETURNS_TYPE:
                    rel.kind = 'return';
                    break;
                case RelationshipType.PARAM_TYPE:
                    rel.kind = 'param';
                    break;
            }
        }
    }
    catch (_l) { }
    return rel;
}
// Compute canonical relationship id for code edges using the canonical target key
export function canonicalRelationshipId(fromId, rel) {
    const baseTarget = isCodeRelationship(rel.type) ? canonicalTargetKeyFor(rel) : String(rel.toEntityId || '');
    const base = `${fromId}|${baseTarget}|${rel.type}`;
    return 'rel_' + crypto.createHash('sha1').update(base).digest('hex');
}
//# sourceMappingURL=codeEdges.js.map