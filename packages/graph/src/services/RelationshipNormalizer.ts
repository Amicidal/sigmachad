import crypto from 'crypto';
import {
  GraphRelationship,
  RelationshipType,
  StructuralImportType,
  isStructuralRelationshipType,
} from '@memento/core';
import { canonicalRelationshipId } from '@memento/core';

export type StructuralLanguageAdapter = (
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) => void;

const structuralAdapters: StructuralLanguageAdapter[] = [];

export function registerStructuralAdapter(
  adapter: StructuralLanguageAdapter
): void {
  structuralAdapters.push(adapter);
}

function applyRegisteredAdapters(rel: GraphRelationship): void {
  for (const adapter of structuralAdapters) {
    try {
      adapter(rel);
    } catch (error) {
      // Adapters should never throw; log when NODE_ENV indicates diagnostics
      if ((process.env.STRUCTURAL_ADAPTER_DEBUG || '0') === '1') {
        console.warn('Structural adapter failed', error);
      }
    }
  }
}

function normalizeStructuralRelationship(
  relIn: GraphRelationship
): GraphRelationship {
  // Only process structural relationships
  if (!isStructuralRelationshipType(relIn.type)) {
    return relIn;
  }

  const rel: any = relIn;
  const md: Record<string, any> = { ...(rel.metadata || {}) };
  rel.metadata = md;

  const sanitizeString = (value: unknown, max = 512): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  };

  const sanitizeBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return undefined;
  };

  const sanitizeNonNegativeInt = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    if (num < 0) return 0;
    return Math.floor(num);
  };

  const sanitizeConfidence = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    if (num < 0) return 0;
    if (num > 1) return 1;
    return num;
  };

  const normalizeLanguage = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 64);
    if (!sanitized) return undefined;
    return sanitized.toLowerCase();
  };

  const normalizeSymbolKind = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 64);
    if (!sanitized) return undefined;
    return sanitized.toLowerCase();
  };

  const normalizeModulePath = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 1024);
    if (!sanitized) return undefined;
    let normalized = sanitized.replace(/\\+/g, '/');
    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/g, '');
      if (normalized.length === 0) {
        normalized = '/';
      }
    }
    normalized = normalized.replace(/\/{2,}/g, '/');
    return normalized;
  };

  type ResolutionState = 'resolved' | 'unresolved' | 'partial';

  const normalizeResolutionState = (
    value: unknown
  ): ResolutionState | undefined => {
    if (typeof value === 'boolean') {
      return value ? 'resolved' : 'unresolved';
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'resolved') return 'resolved';
      if (normalized === 'unresolved') return 'unresolved';
      if (normalized === 'partial') return 'partial';
    }
    return undefined;
  };

  const normalizeImportType = (
    value: unknown,
    namespaceHint: boolean,
    wildcardHint: boolean
  ): StructuralImportType | undefined => {
    const raw = sanitizeString(value, 32);
    if (!raw) {
      if (namespaceHint) return 'namespace';
      if (wildcardHint) return 'wildcard';
      return undefined;
    }
    const normalized = raw.toLowerCase().replace(/[_\s]+/g, '-');
    switch (normalized) {
      case 'default':
      case 'default-import':
      case 'import-default':
        return 'default';
      case 'named':
      case 'named-import':
      case 'type':
      case 'types':
        return 'named';
      case 'namespace':
      case 'namespace-import':
      case 'star-import':
        return 'namespace';
      case 'wildcard':
      case 'all':
        return 'wildcard';
      case 'side-effect':
      case 'sideeffect':
      case 'side-effect-import':
        return 'side-effect';
      default:
        if (normalized === '*') return 'wildcard';
        if (normalized.includes('namespace')) return 'namespace';
        if (normalized.includes('side')) return 'side-effect';
        if (normalized.includes('default')) return 'default';
        if (normalized.includes('wild')) return 'wildcard';
        if (normalized.includes('star')) return 'namespace';
        if (normalized.includes('type')) return 'named';
        return undefined;
    }
  };

  const resolvedFlag =
    sanitizeBoolean(rel.resolved) ??
    sanitizeBoolean(md.resolved) ??
    sanitizeBoolean((md as any).isResolved);
  const hadResolvedInput = typeof resolvedFlag === 'boolean';
  if (typeof resolvedFlag === 'boolean') {
    rel.resolved = resolvedFlag;
    md.resolved = resolvedFlag;
  } else {
    delete rel.resolved;
    if (md.resolved !== undefined) delete md.resolved;
    if ((md as any).isResolved !== undefined) delete (md as any).isResolved;
  }

  const existingConfidence =
    sanitizeConfidence(rel.confidence) ?? sanitizeConfidence(md.confidence);
  if (typeof existingConfidence === 'number') {
    rel.confidence = existingConfidence;
    md.confidence = existingConfidence;
  }

  const initialResolutionState = normalizeResolutionState(
    (rel as any).resolutionState ??
      md.resolutionState ??
      md.resolved ??
      rel.resolved
  );
  if (initialResolutionState) {
    (rel as any).resolutionState = initialResolutionState;
    md.resolutionState = initialResolutionState;
  }

  const rawModule =
    rel.modulePath ??
    md.modulePath ??
    md.module ??
    md.moduleSpecifier ??
    md.sourceModule;
  const modulePath = normalizeModulePath(rawModule);
  if (modulePath) {
    rel.modulePath = modulePath;
    md.modulePath = modulePath;
  } else {
    delete rel.modulePath;
    if (md.modulePath !== undefined) delete md.modulePath;
  }

  if (rel.type === RelationshipType.IMPORTS) {
    const alias =
      sanitizeString(rel.importAlias, 256) ??
      sanitizeString(md.importAlias, 256) ??
      sanitizeString(md.alias, 256);
    if (alias) {
      rel.importAlias = alias;
      md.importAlias = alias;
    } else {
      delete rel.importAlias;
    }

    const namespaceHint = Boolean(
      sanitizeBoolean(rel.isNamespace ?? md.isNamespace) ||
        (typeof modulePath === 'string' && modulePath.endsWith('/*'))
    );
    const wildcardHint =
      typeof rawModule === 'string' && rawModule.trim() === '*';
    const importType = normalizeImportType(
      rel.importType ?? md.importType ?? md.importKind ?? md.kind,
      namespaceHint,
      wildcardHint
    );
    if (importType) {
      rel.importType = importType;
      md.importType = importType;
    } else {
      delete rel.importType;
    }

    const isNamespace =
      sanitizeBoolean(rel.isNamespace ?? md.isNamespace) ??
      (importType === 'namespace' ? true : undefined);
    if (typeof isNamespace === 'boolean') {
      rel.isNamespace = isNamespace;
      md.isNamespace = isNamespace;
    } else {
      delete rel.isNamespace;
    }

    const importDepth = sanitizeNonNegativeInt(
      rel.importDepth ?? md.importDepth
    );
    if (importDepth !== undefined) {
      rel.importDepth = importDepth;
      md.importDepth = importDepth;
    }

    const resolutionState = normalizeResolutionState(
      (rel as any).resolutionState ??
        md.resolutionState ??
        rel.resolved ??
        md.resolved
    );
    if (resolutionState) {
      (rel as any).resolutionState = resolutionState;
      md.resolutionState = resolutionState;
    } else {
      delete (rel as any).resolutionState;
      if (md.resolutionState !== undefined) delete md.resolutionState;
    }
  }

  if (rel.type === RelationshipType.EXPORTS) {
    const reExportTarget = sanitizeString(
      rel.reExportTarget ?? md.reExportTarget ?? md.module ?? md.from,
      1024
    );
    const hasReExportTarget = Boolean(reExportTarget);

    const rawIsReExport = sanitizeBoolean(
      rel.isReExport ?? md.isReExport ?? md.reExport
    );
    const isReExport =
      rawIsReExport !== undefined
        ? rawIsReExport
        : hasReExportTarget
        ? true
        : undefined;

    if (typeof isReExport === 'boolean') {
      rel.isReExport = isReExport;
      md.isReExport = isReExport;
    } else {
      delete rel.isReExport;
      if (md.isReExport !== undefined) delete md.isReExport;
    }

    if (hasReExportTarget && (isReExport === undefined || isReExport)) {
      rel.reExportTarget = reExportTarget!;
      md.reExportTarget = reExportTarget!;
    } else {
      delete rel.reExportTarget;
      if (md.reExportTarget !== undefined) delete md.reExportTarget;
    }
  }
  const language =
    normalizeLanguage(rel.language ?? md.language ?? md.lang) ?? undefined;
  if (language) {
    rel.language = language;
    md.language = language;
  } else {
    delete rel.language;
  }

  const symbolKind = normalizeSymbolKind(
    rel.symbolKind ?? md.symbolKind ?? md.kind
  );
  if (symbolKind) {
    rel.symbolKind = symbolKind;
    md.symbolKind = symbolKind;
    if (md.kind !== undefined) delete md.kind;
  } else {
    delete rel.symbolKind;
  }

  if (
    md.languageSpecific !== undefined &&
    (md.languageSpecific === null || typeof md.languageSpecific !== 'object')
  ) {
    delete md.languageSpecific;
  }

  applyRegisteredAdapters(rel as GraphRelationship);

  const legacyMetadataKeys = [
    'alias',
    'module',
    'moduleSpecifier',
    'sourceModule',
    'importKind',
    'lang',
    'languageId',
    'language_id',
    'reExport',
  ];
  for (const key of legacyMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(md, key)) {
      delete (md as Record<string, unknown>)[key];
    }
  }

  const inferStructuralResolutionState = (): ResolutionState | undefined => {
    const classifyTarget = ():
      | 'entity'
      | 'placeholder'
      | 'external'
      | undefined => {
      const toRef: any = (rel as any).toRef;
      const refKind =
        toRef && typeof toRef.kind === 'string'
          ? toRef.kind.toLowerCase()
          : undefined;
      if (
        refKind &&
        ['filesymbol', 'entity', 'file', 'directory'].includes(refKind)
      ) {
        return 'entity';
      }
      if (refKind === 'external') {
        return 'external';
      }
      if (refKind === 'placeholder') {
        return 'placeholder';
      }

      const toId = typeof rel.toEntityId === 'string' ? rel.toEntityId : '';
      if (
        toId.startsWith('file:') ||
        toId.startsWith('sym:') ||
        toId.startsWith('dir:') ||
        toId.startsWith('entity:')
      ) {
        return 'entity';
      }
      if (
        /^(import:|external:|package:|module:)/.test(toId) ||
        /^(class|interface|function|typealias):/.test(toId)
      ) {
        return 'placeholder';
      }

      return undefined;
    };

    if (
      rel.type === RelationshipType.CONTAINS ||
      rel.type === RelationshipType.DEFINES
    ) {
      return 'resolved';
    }

    const targetKind = classifyTarget();
    if (targetKind === 'entity') return 'resolved';
    if (targetKind === 'external' || targetKind === 'placeholder') {
      return 'unresolved';
    }

    return undefined;
  };

  const resolutionStateFinal = normalizeResolutionState(
    (rel as any).resolutionState ??
      md.resolutionState ??
      inferStructuralResolutionState()
  );

  if (resolutionStateFinal) {
    (rel as any).resolutionState = resolutionStateFinal;
    md.resolutionState = resolutionStateFinal;
  } else if (typeof rel.resolved === 'boolean') {
    const inferred = rel.resolved ? 'resolved' : 'unresolved';
    (rel as any).resolutionState = inferred;
    md.resolutionState = inferred;
  }

  const normalizedResolutionState = normalizeResolutionState(
    (rel as any).resolutionState ?? md.resolutionState
  );

  if (normalizedResolutionState) {
    (rel as any).resolutionState = normalizedResolutionState;
    md.resolutionState = normalizedResolutionState;
  } else {
    delete (rel as any).resolutionState;
    if (md.resolutionState !== undefined) delete md.resolutionState;
  }

  const resolvedFromState =
    normalizedResolutionState === 'resolved'
      ? true
      : normalizedResolutionState === 'unresolved'
      ? false
      : undefined;

  if (resolvedFromState !== undefined) {
    rel.resolved = resolvedFromState;
    md.resolved = resolvedFromState;
  } else if (!normalizedResolutionState && hadResolvedInput) {
    rel.resolved = resolvedFlag as boolean;
    md.resolved = resolvedFlag as boolean;
  } else if (!normalizedResolutionState && typeof rel.resolved === 'boolean') {
    md.resolved = rel.resolved;
  } else {
    delete rel.resolved;
    if (md.resolved !== undefined) delete md.resolved;
  }

  if (typeof rel.confidence !== 'number') {
    const resolutionState = (rel as any).resolutionState;
    const defaultConfidence = (() => {
      if (
        rel.type === RelationshipType.CONTAINS ||
        rel.type === RelationshipType.DEFINES
      ) {
        return 0.95;
      }
      if (resolutionState === 'resolved') return 0.9;
      if (resolutionState === 'partial') return 0.6;
      return 0.4;
    })();
    rel.confidence = defaultConfidence;
  }
  if (typeof md.confidence !== 'number') {
    md.confidence = rel.confidence;
  }

  rel.id = canonicalStructuralRelationshipId(rel as GraphRelationship);
  return rel as GraphRelationship;
}

function canonicalStructuralRelationshipId(rel: GraphRelationship): string {
  const baseId = canonicalRelationshipId(rel.fromEntityId ?? '', rel);
  if (baseId.startsWith('time-rel_')) return baseId;
  if (baseId.startsWith('rel_')) {
    return `time-rel_${baseId.slice('rel_'.length)}`;
  }
  return `time-rel_${crypto.createHash('sha1').update(baseId).digest('hex')}`;
}

// --- Default adapters ---

registerStructuralAdapter(function typescriptAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  // Only process structural relationships
  if (!isStructuralRelationshipType(relationship.type)) {
    return;
  }

  const structuralRel = relationship as any; // Cast to access structural properties
  const md = structuralRel.metadata || {};
  const candidates = collectLanguageCandidates(structuralRel);
  let detected = candidates.find((value) =>
    ['typescript', 'ts', 'tsx'].includes(value)
  );
  let detectionSource: string | undefined = detected;
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship);
    detectionSource = detected;
  }

  let syntaxHint: string | undefined;
  if (detectionSource === 'tsx') {
    syntaxHint = 'tsx';
  } else if (detectionSource === 'ts') {
    syntaxHint = 'ts';
  }

  if (!syntaxHint) {
    const moduleCandidates = [
      structuralRel.modulePath,
      md.modulePath,
      md.module,
      md.sourceModule,
      md.path,
    ].filter((value): value is string => typeof value === 'string');
    if (
      moduleCandidates.some((value) => value.toLowerCase().endsWith('.tsx'))
    ) {
      syntaxHint = 'tsx';
    } else if (
      moduleCandidates.some((value) => value.toLowerCase().endsWith('.ts'))
    ) {
      syntaxHint = 'ts';
    }
  }

  if (detected && ['ts', 'tsx', 'typescript'].includes(detected)) {
    detected = 'typescript';
    const existingLanguageSpecific =
      md.languageSpecific && typeof md.languageSpecific === 'object'
        ? md.languageSpecific
        : {};
    const currentSyntax = existingLanguageSpecific?.syntax;
    const nextSyntax = ((): string | undefined => {
      if (typeof currentSyntax === 'string' && currentSyntax.trim() !== '') {
        return currentSyntax.trim();
      }
      if (syntaxHint) return syntaxHint;
      return 'ts';
    })();

    md.languageSpecific = {
      ...existingLanguageSpecific,
      ...(nextSyntax ? { syntax: nextSyntax } : {}),
    };
  }

  const applyLanguage = (value: string | undefined) => {
    if (!value) return;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;
    structuralRel.language = normalized;
    md.language = normalized;
  };

  if (detected) {
    applyLanguage(detected);
  } else {
    const fallback = [structuralRel.language, md.language].find(
      (value): value is string =>
        typeof value === 'string' && value.trim() !== ''
    );
    if (fallback) {
      applyLanguage(fallback);
    } else {
      delete structuralRel.language;
      delete md.language;
    }
  }

  if (
    (relationship.type === RelationshipType.IMPORTS ||
      relationship.type === RelationshipType.EXPORTS) &&
    !relationship.symbolKind
  ) {
    relationship.symbolKind = 'module';
    md.symbolKind = 'module';
  }
});

registerStructuralAdapter(function pythonAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  // Only process structural relationships
  if (!isStructuralRelationshipType(relationship.type)) {
    return;
  }

  const structuralRel = relationship as any; // Cast to access structural properties
  const md = structuralRel.metadata || {};
  const candidates = collectLanguageCandidates(structuralRel);
  let detected = candidates.find((value) => ['python', 'py'].includes(value));
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship, 'py');
  }
  if (detected) {
    structuralRel.language = 'python';
    md.language = 'python';
  }
});

registerStructuralAdapter(function goAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  // Only process structural relationships
  if (!isStructuralRelationshipType(relationship.type)) {
    return;
  }

  const structuralRel = relationship as any; // Cast to access structural properties
  const md = structuralRel.metadata || {};
  const candidates = collectLanguageCandidates(structuralRel);
  let detected: string | undefined = candidates.find((value) => value === 'go');
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship, 'go');
  }
  if (detected === 'go') {
    structuralRel.language = 'go';
    md.language = 'go';
  }
});

function collectLanguageCandidates(rel: GraphRelationship): string[] {
  const md: any = rel.metadata || {};
  const values = [
    (rel as any).language,
    md.language,
    md.lang,
    md.languageId,
    md.language_id,
  ];
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function guessLanguageFromPathHints(
  rel: GraphRelationship,
  extensionHint?: string
): string | undefined {
  const md: any = rel.metadata || {};
  const candidates = [
    md.path,
    md.modulePath,
    (rel as any).modulePath,
    rel.fromEntityId,
    rel.toEntityId,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  const matchesExtension = (ext: string) =>
    candidates.some((candidate) => candidate.includes(`.${ext}`));

  if (!extensionHint && matchesExtension('ts')) return 'typescript';
  if (!extensionHint && matchesExtension('tsx')) return 'typescript';
  if (!extensionHint && matchesExtension('js')) return 'javascript';
  if (extensionHint && matchesExtension(extensionHint)) {
    if (extensionHint === 'py') return 'python';
    if (extensionHint === 'go') return 'go';
  }
  return undefined;
}

export { normalizeStructuralRelationship };
export default normalizeStructuralRelationship;
