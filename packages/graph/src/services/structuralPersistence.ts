/* eslint-disable security/detect-object-injection */
// TODO(2025-09-30.35): Harden dynamic indexing; replace bracket access with safe helpers.
import {
  type GraphRelationship,
  type StructuralImportType,
  RelationshipType,
} from '@memento/shared-types';
import { normalizeStructuralRelationship } from './RelationshipNormalizer.js';

export interface StructuralPersistenceFields {
  importAlias: string | null;
  importType: StructuralImportType | null;
  isNamespace: boolean | null;
  isReExport: boolean | null;
  reExportTarget: string | null;
  language: string | null;
  symbolKind: string | null;
  modulePath: string | null;
  resolutionState: string | null;
  importDepth: number | null;
  confidence: number | null;
  scope: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

const STRING_NORMALIZER = (value: unknown, max = 1024): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const BOOLEAN_NORMALIZER = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  return null;
};

const NUMBER_NORMALIZER = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return null;
};

const CONFIDENCE_NORMALIZER = (value: unknown): number | null => {
  let numeric: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    numeric = value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) numeric = parsed;
  }
  if (numeric === null) return null;
  const clamped = Math.min(Math.max(numeric, 0), 1);
  return Number.isFinite(clamped) ? clamped : null;
};

const DATE_NORMALIZER = (value: unknown): string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
};

const normalizeModulePathValue = (value: string | null): string | null => {
  if (!value) return null;
  let normalized = value.replace(/\\+/g, '/');
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/g, '');
    if (!normalized) {
      normalized = '/';
    }
  }
  return normalized;
};

const lowerCase = (value: string | null): string | null =>
  value ? value.toLowerCase() : null;

export const extractStructuralPersistenceFields = (
  topLevel: Record<string, any>,
  metadata: Record<string, any>
): StructuralPersistenceFields => {
  const pickString = (...keys: string[]): string | null => {
    for (const key of keys) {
      const candidate = STRING_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate) return candidate;
    }
    return null;
  };

  const pickBoolean = (...keys: string[]): boolean | null => {
    for (const key of keys) {
      const candidate = BOOLEAN_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate !== null) return candidate;
    }
    return null;
  };

  const pickNumber = (...keys: string[]): number | null => {
    for (const key of keys) {
      const candidate = NUMBER_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate !== null) return candidate;
    }
    return null;
  };

  const modulePathCandidate = pickString(
    'modulePath',
    'module',
    'moduleSpecifier',
    'sourceModule'
  );

  const resolutionStateCandidate = pickString('resolutionState');

  const importTypeCandidate = pickString('importType', 'importKind', 'kind');
  const importTypeNormalized = importTypeCandidate
    ? (importTypeCandidate.toLowerCase() as StructuralImportType)
    : null;
  const reExportTargetCandidate = pickString('reExportTarget');
  const reExportTargetNormalized = normalizeModulePathValue(
    reExportTargetCandidate
  );

  return {
    importAlias: pickString('importAlias', 'alias'),
    importType: importTypeNormalized,
    isNamespace: pickBoolean('isNamespace'),
    isReExport: pickBoolean('isReExport', 'reExport'),
    reExportTarget:
      reExportTargetNormalized !== null
        ? reExportTargetNormalized
        : reExportTargetCandidate,
    language: lowerCase(pickString('language', 'lang', 'languageId')),
    symbolKind: lowerCase(pickString('symbolKind', 'kind')),
    modulePath: normalizeModulePathValue(modulePathCandidate),
    resolutionState: resolutionStateCandidate
      ? lowerCase(resolutionStateCandidate)
      : null,
    importDepth: pickNumber('importDepth'),
    confidence:
      CONFIDENCE_NORMALIZER(topLevel.confidence ?? metadata.confidence) ?? null,
    scope: lowerCase(pickString('scope')),
    firstSeenAt: DATE_NORMALIZER(topLevel.firstSeenAt ?? metadata.firstSeenAt),
    lastSeenAt: DATE_NORMALIZER(topLevel.lastSeenAt ?? metadata.lastSeenAt),
  };
};

const cloneMetadata = (value: unknown): Record<string, any> => {
  if (value == null) return {};

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return JSON.parse(JSON.stringify(parsed));
      }
    } catch {
      return {};
    }
    return {};
  }

  if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }

  return {};
};

const sortObject = (value: any): any => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    const sorted = Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
    return sorted;
  }
  return value;
};

export const stableStringifyMetadata = (value: Record<string, any>): string =>
  JSON.stringify(sortObject(value ?? {}));

export interface StructuralRelationshipSnapshot {
  id: string;
  type: RelationshipType | string;
  fromId: string;
  toId: string;
  created?: string | Date | null;
  lastModified?: string | Date | null;
  version?: number | null;
  importAlias?: unknown;
  importType?: unknown;
  isNamespace?: unknown;
  isReExport?: unknown;
  reExportTarget?: unknown;
  language?: unknown;
  symbolKind?: unknown;
  modulePath?: unknown;
  resolutionState?: unknown;
  importDepth?: unknown;
  confidence?: unknown;
  scope?: unknown;
  firstSeenAt?: unknown;
  lastSeenAt?: unknown;
  metadata?: unknown;
}

export interface StructuralBackfillUpdate {
  payload: {
    id: string;
    importAlias: string | null;
    importType: StructuralImportType | null;
    isNamespace: boolean | null;
    isReExport: boolean | null;
    reExportTarget: string | null;
    language: string | null;
    symbolKind: string | null;
    modulePath: string | null;
    resolutionState: string | null;
    importDepth: number | null;
    confidence: number | null;
    scope: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    metadata: string;
  };
  changedFields: string[];
}

const asDate = (value: string | Date | null | undefined): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const stringOrNull = (value: unknown): string | null =>
  STRING_NORMALIZER(value) ?? null;

const booleanOrNull = (value: unknown): boolean | null =>
  BOOLEAN_NORMALIZER(value);

const numberOrNull = (value: unknown): number | null =>
  NUMBER_NORMALIZER(value);

export const computeStructuralBackfillUpdate = (
  snapshot: StructuralRelationshipSnapshot
): StructuralBackfillUpdate | null => {
  const metadataObject = cloneMetadata(snapshot.metadata);

  const relationship: GraphRelationship = {
    id: snapshot.id,
    fromEntityId: snapshot.fromId,
    toEntityId: snapshot.toId,
    type: (snapshot.type as RelationshipType) ?? RelationshipType.IMPORTS,
    created: asDate(snapshot.created ?? null),
    lastModified: asDate(snapshot.lastModified ?? null),
    version: typeof snapshot.version === 'number' ? snapshot.version : 1,
    metadata: metadataObject,
  } as GraphRelationship;

  const assign = (key: string, value: unknown): void => {
    if (value !== undefined && value !== null) {
      (relationship as any)[key] = value;
    }
  };

  assign('importAlias', snapshot.importAlias);
  assign('importType', snapshot.importType);
  assign('isNamespace', snapshot.isNamespace);
  assign('isReExport', snapshot.isReExport);
  assign('reExportTarget', snapshot.reExportTarget);
  assign('language', snapshot.language);
  assign('symbolKind', snapshot.symbolKind);
  assign('modulePath', snapshot.modulePath);
  assign('resolutionState', snapshot.resolutionState);
  assign('importDepth', snapshot.importDepth);

  const normalized = normalizeStructuralRelationship(relationship);
  const normalizedMetadata = cloneMetadata(normalized.metadata);

  const expected = extractStructuralPersistenceFields(
    normalized as any,
    normalizedMetadata
  );

  const existing = {
    importAlias: stringOrNull(snapshot.importAlias),
    importType: stringOrNull(
      snapshot.importType
    ) as StructuralImportType | null,
    isNamespace: booleanOrNull(snapshot.isNamespace),
    isReExport: booleanOrNull(snapshot.isReExport),
    reExportTarget: stringOrNull(snapshot.reExportTarget),
    language: lowerCase(stringOrNull(snapshot.language)),
    symbolKind: lowerCase(stringOrNull(snapshot.symbolKind)),
    modulePath: normalizeModulePathValue(stringOrNull(snapshot.modulePath)),
    resolutionState: lowerCase(stringOrNull(snapshot.resolutionState)),
    importDepth: numberOrNull(snapshot.importDepth),
    confidence: CONFIDENCE_NORMALIZER(snapshot.confidence ?? null),
    scope: lowerCase(stringOrNull(snapshot.scope)),
    firstSeenAt: DATE_NORMALIZER(snapshot.firstSeenAt ?? null),
    lastSeenAt: DATE_NORMALIZER(snapshot.lastSeenAt ?? null),
  } satisfies StructuralPersistenceFields;

  const changedFields: string[] = [];

  (Object.keys(expected) as Array<keyof StructuralPersistenceFields>).forEach(
    (key) => {
      if (expected[key] !== existing[key]) {
        changedFields.push(key);
      }
    }
  );

  const expectedMetadataJson = stableStringifyMetadata(normalizedMetadata);
  const existingMetadataJson = stableStringifyMetadata(metadataObject);
  if (expectedMetadataJson !== existingMetadataJson) {
    changedFields.push('metadata');
  }

  if (changedFields.length === 0) {
    return null;
  }

  return {
    payload: {
      id: snapshot.id,
      importAlias: expected.importAlias,
      importType: expected.importType,
      isNamespace: expected.isNamespace,
      isReExport: expected.isReExport,
      reExportTarget: expected.reExportTarget,
      language: expected.language,
      symbolKind: expected.symbolKind,
      modulePath: expected.modulePath,
      resolutionState: expected.resolutionState,
      importDepth: expected.importDepth,
      confidence: expected.confidence,
      scope: expected.scope,
      firstSeenAt: expected.firstSeenAt,
      lastSeenAt: expected.lastSeenAt,
      metadata: expectedMetadataJson,
    },
    changedFields,
  };
};
