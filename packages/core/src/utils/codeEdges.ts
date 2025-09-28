import * as crypto from 'crypto';
import {
  GraphRelationship,
  RelationshipType,
  CodeEdgeSource,
  CodeEdgeKind,
  EdgeEvidence,
  CodeRelationship,
  CODE_RELATIONSHIP_TYPES,
  isDocumentationRelationshipType,
  isPerformanceRelationshipType,
  isSessionRelationshipType,
  isStructuralRelationshipType,
} from '../models/relationships.js';
import { sanitizeEnvironment } from './environment.js';
import { canonicalRelationshipId } from '@memento/shared-types';

const CODE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  CODE_RELATIONSHIP_TYPES
);

// --- Shared merge helpers for evidence/locations ---
export function mergeEdgeEvidence(
  a: EdgeEvidence[] = [],
  b: EdgeEvidence[] = [],
  limit = 20
): EdgeEvidence[] {
  const arr = [
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ].filter(Boolean) as EdgeEvidence[];
  const key = (e: EdgeEvidence) =>
    `${e.source || ''}|${e.location?.path || ''}|${e.location?.line || ''}|${
      e.location?.column || ''
    }`;
  const rankSrc = (e: EdgeEvidence) =>
    e.source === 'type-checker' ? 3 : e.source === 'ast' ? 2 : 1;
  const seen = new Set<string>();
  const out: EdgeEvidence[] = [];
  for (const e of arr.sort((x, y) => {
    const rs = rankSrc(y) - rankSrc(x);
    if (rs !== 0) return rs;
    const lx =
      typeof x.location?.line === 'number'
        ? x.location!.line!
        : Number.MAX_SAFE_INTEGER;
    const ly =
      typeof y.location?.line === 'number'
        ? y.location!.line!
        : Number.MAX_SAFE_INTEGER;
    return lx - ly;
  })) {
    const k = key(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function mergeEdgeLocations(
  a: Array<{ path?: string; line?: number; column?: number }> = [],
  b: Array<{ path?: string; line?: number; column?: number }> = [],
  limit = 20
): Array<{ path?: string; line?: number; column?: number }> {
  const arr = [
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ].filter(Boolean) as Array<{ path?: string; line?: number; column?: number }>;
  const key = (l: { path?: string; line?: number; column?: number }) =>
    `${l.path || ''}|${l.line || ''}|${l.column || ''}`;
  const seen = new Set<string>();
  const out: Array<{ path?: string; line?: number; column?: number }> = [];
  for (const l of arr) {
    const k = key(l);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(l);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function isCodeRelationship(type: RelationshipType): boolean {
  // Handle legacy USES type by converting to equivalent type
  if ((type as string) === 'USES') return true;
  return CODE_RELATIONSHIP_TYPE_SET.has(type);
}

export function normalizeSource(s?: string): CodeEdgeSource | undefined {
  if (!s) return undefined;
  const v = String(s).toLowerCase();
  if (
    v === 'call-typecheck' ||
    v === 'ts' ||
    v === 'checker' ||
    v === 'tc' ||
    v === 'type-checker'
  )
    return 'type-checker';
  if (v === 'ts-ast' || v === 'ast' || v === 'parser') return 'ast';
  if (v === 'heuristic' || v === 'inferred') return 'heuristic';
  if (v === 'index' || v === 'indexer') return 'index';
  if (v === 'runtime' || v === 'instrumentation') return 'runtime';
  if (v === 'lsp' || v === 'language-server') return 'lsp';
  // Default to heuristic if unknown string was provided
  return 'heuristic';
}

// Compute a canonical target key for code edges to keep relationship IDs stable as resolution improves
export function canonicalTargetKeyFor(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const t = String(rel.toEntityId || '');
  const toRef = anyRel.toRef;

  // Prefer structured toRef
  if (toRef && typeof toRef === 'object') {
    if (toRef.kind === 'entity' && toRef.id) return `ENT:${toRef.id}`;
    if (
      toRef.kind === 'fileSymbol' &&
      (toRef.file || toRef.symbol || toRef.name)
    ) {
      const file = toRef.file || '';
      const sym = (toRef.symbol || toRef.name || '') as string;
      return `FS:${file}:${sym}`;
    }
    if (toRef.kind === 'external' && toRef.name) return `EXT:${toRef.name}`;
  }

  // Fallback to parsing toEntityId
  // Concrete entity id (sym:/file: path without symbol) → ENT (keeps id unique)
  if (/^(sym:|file:[^:]+$)/.test(t)) return `ENT:${t}`;
  // File symbol placeholder: file:<relPath>:<name>
  {
    const m = t.match(/^file:(.+?):(.+)$/);
    if (m) return `FS:${m[1]}:${m[2]}`;
  }
  // External name
  {
    const m = t.match(/^external:(.+)$/);
    if (m) return `EXT:${m[1]}`;
  }
  // Kind-qualified placeholders
  {
    const m = t.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (m) return `KIND:${m[1]}:${m[2]}`;
  }
  // Import placeholder
  {
    const m = t.match(/^import:(.+?):(.+)$/);
    if (m) return `IMP:${m[1]}:${m[2]}`;
  }
  // Raw fallback
  return `RAW:${t}`;
}

const EVIDENCE_NOTE_MAX = 2000;
const EXTRACTOR_VERSION_MAX = 200;
const PATH_MAX = 4096;

function clampConfidenceValue(value: unknown): number | undefined {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  if (!Number.isFinite(num)) return undefined;
  const clamped = Math.max(0, Math.min(1, num));
  return clamped;
}

function sanitizeStringValue(
  value: unknown,
  maxLength: number
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function sanitizeLocationEntry(
  value: any
): { path?: string; line?: number; column?: number } | null {
  if (!value || typeof value !== 'object') return null;
  const out: { path?: string; line?: number; column?: number } = {};
  const path = sanitizeStringValue((value as any).path, PATH_MAX);
  if (path) out.path = path;
  const lineRaw = (value as any).line;
  const lineNum = Number(lineRaw);
  if (Number.isFinite(lineNum)) {
    const line = Math.max(0, Math.round(lineNum));
    out.line = line;
  }
  const columnRaw = (value as any).column;
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

function sanitizeLocationList(
  value: any
): Array<{ path?: string; line?: number; column?: number }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ path?: string; line?: number; column?: number }> = [];
  for (const entry of value) {
    const sanitized = sanitizeLocationEntry(entry);
    if (sanitized) {
      out.push(sanitized);
      if (out.length >= 20) break;
    }
  }
  return out;
}

function sanitizeEvidenceList(
  value: any,
  fallbackSource: CodeEdgeSource
): EdgeEvidence[] {
  const arr = Array.isArray(value) ? value : [];
  const out: EdgeEvidence[] = [];
  for (const entry of arr) {
    if (!entry || typeof entry !== 'object') continue;
    const srcNormalized =
      normalizeSource((entry as any).source) || fallbackSource;
    const ev: EdgeEvidence = { source: srcNormalized };
    const confidence = clampConfidenceValue((entry as any).confidence);
    if (confidence !== undefined) ev.confidence = confidence;
    const loc = sanitizeLocationEntry((entry as any).location);
    if (loc) ev.location = loc;
    const note = sanitizeStringValue((entry as any).note, EVIDENCE_NOTE_MAX);
    if (note) ev.note = note;
    const extractorVersion = sanitizeStringValue(
      (entry as any).extractorVersion,
      EXTRACTOR_VERSION_MAX
    );
    if (extractorVersion) ev.extractorVersion = extractorVersion;
    out.push(ev);
    if (out.length >= 20) break;
  }
  return out;
}

function coerceNonNegative(
  value: unknown,
  { integer = false }: { integer?: boolean } = {}
): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  const sanitized = parsed < 0 ? 0 : parsed;
  return integer ? Math.floor(sanitized) : sanitized;
}

export function normalizeCodeEdge<T extends GraphRelationship>(relIn: T): T {
  const rel: any = { ...(relIn as any) };
  // Backwards compatibility: old ingesters emitted USES instead of TYPE_USES
  if (rel.type === 'USES') rel.type = RelationshipType.TYPE_USES;
  if (!isCodeRelationship(rel.type)) return rel as T;

  const md = (rel.metadata || {}) as any;

  // Unified hoisting from metadata to top-level for consistent access
  const hoist = (k: string, mapKey?: string) => {
    const key = mapKey || k;
    if (rel[key] == null && md[k] != null) rel[key] = md[k];
  };
  [
    'kind',
    'resolution',
    'scope',
    'arity',
    'awaited',
    'operator',
    'importDepth',
    'usedTypeChecker',
    'isExported',
    'accessPath',
    'dataFlowId',
    'confidence',
    'inferred',
    'resolved',
    'source',
    'callee',
    'paramName',
    'importAlias',
    'receiverType',
    'dynamicDispatch',
    'overloadIndex',
    'genericArguments',
    'ambiguous',
    'candidateCount',
    'isMethod',
    'occurrencesScan',
    'occurrencesTotal',
    'occurrencesRecent',
  ].forEach((k) => hoist(k));
  // For PARAM_TYPE legacy param -> paramName
  hoist('param', 'paramName');

  const occScan = coerceNonNegative(rel.occurrencesScan, { integer: true });
  if (occScan !== undefined) rel.occurrencesScan = occScan;
  else delete rel.occurrencesScan;
  const occTotal = coerceNonNegative(rel.occurrencesTotal, { integer: true });
  if (occTotal !== undefined) rel.occurrencesTotal = occTotal;
  else delete rel.occurrencesTotal;
  const occRecent = coerceNonNegative(rel.occurrencesRecent, {
    integer: false,
  });
  if (occRecent !== undefined) rel.occurrencesRecent = occRecent;
  else delete rel.occurrencesRecent;

  rel.source = normalizeSource(rel.source || md.source);
  // Consolidate: confidence is canonical; map legacy strength inputs when present
  if (
    typeof rel.confidence !== 'number' &&
    typeof (rel as any).strength === 'number'
  ) {
    rel.confidence = Math.max(0, Math.min(1, (rel as any).strength as number));
  }
  if ((rel as any).strength !== undefined) {
    delete (rel as any).strength;
  }

  // Default active=true when seen
  if (typeof rel.active !== 'boolean') rel.active = true;

  // Compose context/location
  const path = rel.location?.path || md.path;
  const line = rel.location?.line ?? md.line;
  const column = rel.location?.column ?? md.column;
  if (!rel.context && typeof path === 'string' && typeof line === 'number')
    rel.context = `${path}:${line}`;
  if (
    !rel.location &&
    (path || typeof line === 'number' || typeof column === 'number')
  ) {
    rel.location = {
      ...(path ? { path } : {}),
      ...(typeof line === 'number' ? { line } : {}),
      ...(typeof column === 'number' ? { column } : {}),
    };
  }

  const locationSanitized = sanitizeLocationEntry(rel.location);
  if (locationSanitized) rel.location = locationSanitized;
  else if (rel.location != null) delete rel.location;

  // Site sampling
  if (
    !rel.siteId &&
    rel.location &&
    rel.location.path &&
    typeof rel.location.line === 'number'
  ) {
    const base = `${rel.location.path}|${rel.location.line}|${
      rel.location.column ?? ''
    }|${rel.accessPath ?? ''}`;
    rel.siteId =
      'site_' +
      crypto.createHash('sha1').update(base).digest('hex').slice(0, 12);
  }
  // Stable-ish site hash using richer context to survive small shifts
  if (!rel.siteHash) {
    const payload = JSON.stringify({
      p: rel.location?.path,
      a: rel.accessPath,
      k: rel.kind,
      c: rel.callee,
      o: rel.operator,
      pm: rel.paramName,
      t: rel.type,
      f: rel.fromEntityId,
    });
    rel.siteHash =
      'sh_' +
      crypto.createHash('sha1').update(payload).digest('hex').slice(0, 16);
  }
  if (Array.isArray(rel.sites)) {
    rel.sites = Array.from(
      new Set(rel.sites.concat(rel.siteId ? [rel.siteId] : []))
    ).slice(0, 20);
  } else if (rel.siteId) {
    rel.sites = [rel.siteId];
  }

  // Evidence merge & top-K preference
  const evTop: EdgeEvidence[] = Array.isArray(rel.evidence) ? rel.evidence : [];
  const evMd: EdgeEvidence[] = Array.isArray(md.evidence) ? md.evidence : [];
  const out = mergeEdgeEvidence(evTop, evMd, 20);
  if (out.length > 0) rel.evidence = out;
  else {
    const def: EdgeEvidence = {
      source: (rel.source as CodeEdgeSource) || 'ast',
      confidence:
        typeof (rel as any).confidence === 'number'
          ? (rel as any).confidence
          : undefined,
      location: rel.location,
      note: typeof md.note === 'string' ? md.note : undefined,
      extractorVersion:
        typeof md.extractorVersion === 'string'
          ? md.extractorVersion
          : undefined,
    };
    rel.evidence = [def];
  }

  const fallbackSource = (rel.source as CodeEdgeSource) || 'ast';
  let sanitizedEvidence = sanitizeEvidenceList(
    rel.evidence as any,
    fallbackSource
  );
  if (sanitizedEvidence.length === 0) {
    sanitizedEvidence = sanitizeEvidenceList(
      [
        {
          source: fallbackSource,
          confidence: clampConfidenceValue(rel.confidence),
          location: rel.location,
          note: typeof md.note === 'string' ? md.note : undefined,
          extractorVersion:
            typeof md.extractorVersion === 'string'
              ? md.extractorVersion
              : undefined,
        },
      ],
      fallbackSource
    );
  }
  if (sanitizedEvidence.length === 0) {
    sanitizedEvidence = [{ source: fallbackSource }];
  }
  rel.evidence = sanitizedEvidence;

  const combinedLocations = sanitizeLocationList([
    ...(Array.isArray(rel.locations) ? rel.locations : []),
    ...(Array.isArray((md as any).locations) ? (md as any).locations : []),
  ]);
  if (combinedLocations.length > 0) rel.locations = combinedLocations;
  else delete rel.locations;

  // Carry toRef/fromRef into metadata for persistence/audit if not stored elsewhere
  const mdNew: any = { ...md };
  delete mdNew.evidence;
  delete mdNew.locations;
  if (rel.fromRef && mdNew.fromRef == null) mdNew.fromRef = rel.fromRef;
  if (rel.toRef && mdNew.toRef == null) mdNew.toRef = rel.toRef;
  rel.metadata = mdNew;

  // Promote toRef scalars for querying
  try {
    const t = String(rel.toEntityId || '');
    const toRef = rel.toRef || mdNew.toRef;
    const parseSym = (
      symId: string
    ): { file: string; symbol: string; name: string } | null => {
      // sym:<relPath>#<name>@<hash>
      const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
      if (!m) return null;
      const file = m[1];
      const symbol = m[2];
      return { file, symbol, name: symbol };
    };
    const setFileSym = (file: string, sym: string) => {
      rel.to_ref_kind = 'fileSymbol';
      rel.to_ref_file = file;
      rel.to_ref_symbol = sym;
      rel.to_ref_name = rel.to_ref_name || sym;
    };
    if (toRef && typeof toRef === 'object') {
      if (toRef.kind === 'entity') {
        rel.to_ref_kind = 'entity';
        rel.to_ref_name = toRef.name || rel.to_ref_name;
      } else if (toRef.kind === 'fileSymbol') {
        setFileSym(toRef.file || '', toRef.symbol || toRef.name || '');
      } else if (toRef.kind === 'external') {
        rel.to_ref_kind = 'external';
        rel.to_ref_name = toRef.name || rel.to_ref_name;
      }
    } else {
      // sym: concrete symbol ids
      if (t.startsWith('sym:')) {
        const parsed = parseSym(t);
        if (parsed) setFileSym(parsed.file, parsed.symbol);
      }
      const mFile = t.match(/^file:(.+?):(.+)$/);
      if (mFile) setFileSym(mFile[1], mFile[2]);
      const mExt = t.match(/^external:(.+)$/);
      if (mExt) {
        rel.to_ref_kind = 'external';
        rel.to_ref_name = mExt[1];
      }
      if (/^(sym:|file:)/.test(t)) {
        rel.to_ref_kind = rel.to_ref_kind || 'entity';
      }
    }
  } catch {}

  // Promote fromRef scalars for querying (mirror of to_ref_*)
  try {
    const f = String(rel.fromEntityId || '');
    const fromRef = (rel as any).fromRef || mdNew.fromRef;
    const parseSymFrom = (
      symId: string
    ): { file: string; symbol: string; name: string } | null => {
      const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
      if (!m) return null;
      const file = m[1];
      const symbol = m[2];
      return { file, symbol, name: symbol };
    };
    const setFromFileSym = (file: string, sym: string) => {
      (rel as any).from_ref_kind = 'fileSymbol';
      (rel as any).from_ref_file = file;
      (rel as any).from_ref_symbol = sym;
      (rel as any).from_ref_name = (rel as any).from_ref_name || sym;
    };
    if (fromRef && typeof fromRef === 'object') {
      if (fromRef.kind === 'entity') {
        (rel as any).from_ref_kind = 'entity';
        (rel as any).from_ref_name = fromRef.name || (rel as any).from_ref_name;
      } else if (fromRef.kind === 'fileSymbol') {
        setFromFileSym(
          fromRef.file || '',
          fromRef.symbol || fromRef.name || ''
        );
      } else if (fromRef.kind === 'external') {
        (rel as any).from_ref_kind = 'external';
        (rel as any).from_ref_name = fromRef.name || (rel as any).from_ref_name;
      }
    } else {
      if (f.startsWith('sym:')) {
        const parsed = parseSymFrom(f);
        if (parsed) setFromFileSym(parsed.file, parsed.symbol);
      }
      const mFile = f.match(/^file:(.+?):(.+)$/);
      if (mFile) setFromFileSym(mFile[1], mFile[2]);
      const mExt = f.match(/^external:(.+)$/);
      if (mExt) {
        (rel as any).from_ref_kind = 'external';
        (rel as any).from_ref_name = mExt[1];
      }
      if (/^(sym:|file:)/.test(f)) {
        (rel as any).from_ref_kind = (rel as any).from_ref_kind || 'entity';
      }
    }
  } catch {}

  // Backfill kind defaults when missing (kept lightweight; semantic defaults)
  try {
    if (!rel.kind) {
      switch (rel.type) {
        case RelationshipType.CALLS:
          (rel as any).kind = 'call';
          break;
        case RelationshipType.REFERENCES:
          (rel as any).kind = 'identifier';
          break;
        case RelationshipType.OVERRIDES:
          (rel as any).kind = 'override';
          break;
        case RelationshipType.EXTENDS:
        case RelationshipType.IMPLEMENTS:
          (rel as any).kind = 'inheritance';
          break;
        case RelationshipType.READS:
          (rel as any).kind = 'read';
          break;
        case RelationshipType.WRITES:
          (rel as any).kind = 'write';
          break;
        case RelationshipType.DEPENDS_ON:
          (rel as any).kind = 'dependency';
          break;
        case RelationshipType.THROWS:
          (rel as any).kind = 'throw';
          break;
        case RelationshipType.TYPE_USES:
          (rel as any).kind = 'type';
          break;
        case RelationshipType.RETURNS_TYPE:
          (rel as any).kind = 'return';
          break;
        case RelationshipType.PARAM_TYPE:
          (rel as any).kind = 'param';
          break;
      }
    }
  } catch {}

  return rel as T;
}

// canonicalRelationshipId is now imported from @memento/shared-types

// Produce the legacy structural relationship id (rel_*) for migration purposes
export function legacyStructuralRelationshipId(
  canonicalId: string,
  rel: GraphRelationship
): string | null {
  if (!isStructuralRelationshipType(rel.type)) return null;
  if (canonicalId.startsWith('time-rel_')) {
    return 'rel_' + canonicalId.slice('time-rel_'.length);
  }
  if (canonicalId.startsWith('rel_')) return canonicalId;
  return null;
}

export function normalizeMetricIdForId(value: any): string {
  if (!value) return 'unknown';
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9/_\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/\/+/g, '/')
      .replace(/\/+$/g, '')
      .replace(/^\/+/, '')
      .slice(0, 256) || 'unknown'
  );
}

function normalizeScenarioForId(value: any): string {
  if (!value) return '';
  return normalizeStringForId(value).toLowerCase();
}

function canonicalDocumentationTargetKey(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const md =
    anyRel.metadata && typeof anyRel.metadata === 'object'
      ? anyRel.metadata
      : {};
  const source = normalizeDocSourceForId(anyRel.source ?? md.source);
  const docIntent = normalizeDocIntentForId(
    anyRel.docIntent ?? md.docIntent,
    rel.type
  );
  const sectionAnchor = normalizeAnchorForId(
    anyRel.sectionAnchor ?? md.sectionAnchor ?? md.anchor
  );

  switch (rel.type) {
    case RelationshipType.DOCUMENTED_BY: {
      const docVersion = normalizeStringForId(
        anyRel.docVersion ?? md.docVersion
      );
      return `${rel.toEntityId}|${sectionAnchor}|${source}|${docIntent}|${docVersion}`;
    }
    case RelationshipType.DESCRIBES_DOMAIN: {
      const domainPath = normalizeDomainPathForId(
        anyRel.domainPath ?? md.domainPath ?? md.taxonomyPath
      );
      const taxonomyVersion = normalizeStringForId(
        anyRel.taxonomyVersion ?? md.taxonomyVersion
      );
      return `${rel.toEntityId}|${domainPath}|${taxonomyVersion}|${sectionAnchor}|${docIntent}`;
    }
    case RelationshipType.BELONGS_TO_DOMAIN: {
      const domainPath = normalizeDomainPathForId(
        anyRel.domainPath ?? md.domainPath
      );
      return `${rel.toEntityId}|${domainPath}|${source}|${docIntent}`;
    }
    case RelationshipType.CLUSTER_MEMBER: {
      const clusterVersion = normalizeStringForId(
        anyRel.clusterVersion ?? md.clusterVersion
      );
      const docAnchor = normalizeAnchorForId(
        anyRel.docAnchor ?? md.docAnchor ?? sectionAnchor
      );
      const embeddingVersion = normalizeStringForId(
        anyRel.embeddingVersion ?? md.embeddingVersion
      );
      return `${rel.toEntityId}|${clusterVersion}|${docAnchor}|${embeddingVersion}|${docIntent}`;
    }
    case RelationshipType.DOMAIN_RELATED: {
      const relationshipType = normalizeStringForId(
        anyRel.relationshipType ?? md.relationshipType
      );
      return `${rel.toEntityId}|${relationshipType}|${source}`;
    }
    case RelationshipType.GOVERNED_BY: {
      const policyType = normalizeStringForId(
        anyRel.policyType ?? md.policyType
      );
      return `${rel.toEntityId}|${policyType}|${docIntent}`;
    }
    case RelationshipType.DOCUMENTS_SECTION: {
      return `${rel.toEntityId}|${sectionAnchor}|${docIntent}`;
    }
    default:
      return String(rel.toEntityId || '');
  }
}

function normalizeAnchorForId(anchor: any): string {
  if (!anchor) return '_root';
  const normalized = String(anchor)
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9\-_/\s]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '');
  return normalized.length > 0 ? normalized.slice(0, 128) : '_root';
}

function normalizeDomainPathForId(value: any): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/>+/g, '/')
    .replace(/\s+/g, '/')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/, '/')
    .replace(/^\/+|\/+$/g, '');
}

function normalizeStringForId(value: any): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeDocSourceForId(value: any): string {
  if (!value) return '';
  const normalized = String(value).toLowerCase();
  switch (normalized) {
    case 'parser':
    case 'manual':
    case 'llm':
    case 'imported':
    case 'sync':
    case 'other':
      return normalized;
    default:
      return 'other';
  }
}

function normalizeDocIntentForId(value: any, type: RelationshipType): string {
  if (value === null || value === undefined) {
    if (type === RelationshipType.GOVERNED_BY) return 'governance';
    return 'ai-context';
  }
  const normalized = String(value).toLowerCase();
  if (
    normalized === 'ai-context' ||
    normalized === 'governance' ||
    normalized === 'mixed'
  ) {
    return normalized;
  }
  return type === RelationshipType.GOVERNED_BY ? 'governance' : 'ai-context';
}
