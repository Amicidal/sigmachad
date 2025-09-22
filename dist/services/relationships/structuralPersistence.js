import { RelationshipType, } from "../../models/relationships.js";
import { normalizeStructuralRelationship } from "./RelationshipNormalizer.js";
const STRING_NORMALIZER = (value, max = 1024) => {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};
const BOOLEAN_NORMALIZER = (value) => {
    if (typeof value === "boolean")
        return value;
    return null;
};
const NUMBER_NORMALIZER = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    return null;
};
const CONFIDENCE_NORMALIZER = (value) => {
    let numeric = null;
    if (typeof value === "number" && Number.isFinite(value)) {
        numeric = value;
    }
    else if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            numeric = parsed;
    }
    if (numeric === null)
        return null;
    const clamped = Math.min(Math.max(numeric, 0), 1);
    return Number.isFinite(clamped) ? clamped : null;
};
const DATE_NORMALIZER = (value) => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
};
const normalizeModulePathValue = (value) => {
    if (!value)
        return null;
    let normalized = value.replace(/\\+/g, "/");
    normalized = normalized.replace(/\/{2,}/g, "/");
    if (normalized.length > 1) {
        normalized = normalized.replace(/\/+$/g, "");
        if (!normalized) {
            normalized = "/";
        }
    }
    return normalized;
};
const lowerCase = (value) => value ? value.toLowerCase() : null;
export const extractStructuralPersistenceFields = (topLevel, metadata) => {
    var _a, _b, _c, _d;
    const pickString = (...keys) => {
        var _a;
        for (const key of keys) {
            const candidate = STRING_NORMALIZER((_a = topLevel[key]) !== null && _a !== void 0 ? _a : metadata[key]);
            if (candidate)
                return candidate;
        }
        return null;
    };
    const pickBoolean = (...keys) => {
        var _a;
        for (const key of keys) {
            const candidate = BOOLEAN_NORMALIZER((_a = topLevel[key]) !== null && _a !== void 0 ? _a : metadata[key]);
            if (candidate !== null)
                return candidate;
        }
        return null;
    };
    const pickNumber = (...keys) => {
        var _a;
        for (const key of keys) {
            const candidate = NUMBER_NORMALIZER((_a = topLevel[key]) !== null && _a !== void 0 ? _a : metadata[key]);
            if (candidate !== null)
                return candidate;
        }
        return null;
    };
    const modulePathCandidate = pickString("modulePath", "module", "moduleSpecifier", "sourceModule");
    const resolutionStateCandidate = pickString("resolutionState");
    const importTypeCandidate = pickString("importType", "importKind", "kind");
    const importTypeNormalized = importTypeCandidate
        ? importTypeCandidate.toLowerCase()
        : null;
    const reExportTargetCandidate = pickString("reExportTarget");
    const reExportTargetNormalized = normalizeModulePathValue(reExportTargetCandidate);
    return {
        importAlias: pickString("importAlias", "alias"),
        importType: importTypeNormalized,
        isNamespace: pickBoolean("isNamespace"),
        isReExport: pickBoolean("isReExport", "reExport"),
        reExportTarget: reExportTargetNormalized !== null
            ? reExportTargetNormalized
            : reExportTargetCandidate,
        language: lowerCase(pickString("language", "lang", "languageId")),
        symbolKind: lowerCase(pickString("symbolKind", "kind")),
        modulePath: normalizeModulePathValue(modulePathCandidate),
        resolutionState: resolutionStateCandidate
            ? lowerCase(resolutionStateCandidate)
            : null,
        importDepth: pickNumber("importDepth"),
        confidence: (_b = CONFIDENCE_NORMALIZER((_a = topLevel.confidence) !== null && _a !== void 0 ? _a : metadata.confidence)) !== null && _b !== void 0 ? _b : null,
        scope: lowerCase(pickString("scope")),
        firstSeenAt: DATE_NORMALIZER((_c = topLevel.firstSeenAt) !== null && _c !== void 0 ? _c : metadata.firstSeenAt),
        lastSeenAt: DATE_NORMALIZER((_d = topLevel.lastSeenAt) !== null && _d !== void 0 ? _d : metadata.lastSeenAt),
    };
};
const cloneMetadata = (value) => {
    if (value == null)
        return {};
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed)
            return {};
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === "object") {
                return JSON.parse(JSON.stringify(parsed));
            }
        }
        catch (_a) {
            return {};
        }
        return {};
    }
    if (typeof value === "object") {
        return JSON.parse(JSON.stringify(value));
    }
    return {};
};
const sortObject = (value) => {
    if (Array.isArray(value))
        return value.map(sortObject);
    if (value && typeof value === "object") {
        const sorted = Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = sortObject(value[key]);
            return acc;
        }, {});
        return sorted;
    }
    return value;
};
export const stableStringifyMetadata = (value) => JSON.stringify(sortObject(value !== null && value !== void 0 ? value : {}));
const asDate = (value) => {
    if (value instanceof Date)
        return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime()))
            return parsed;
    }
    return new Date();
};
const stringOrNull = (value) => { var _a; return (_a = STRING_NORMALIZER(value)) !== null && _a !== void 0 ? _a : null; };
const booleanOrNull = (value) => BOOLEAN_NORMALIZER(value);
const numberOrNull = (value) => NUMBER_NORMALIZER(value);
export const computeStructuralBackfillUpdate = (snapshot) => {
    var _a, _b, _c, _d, _e, _f;
    const metadataObject = cloneMetadata(snapshot.metadata);
    const relationship = {
        id: snapshot.id,
        fromEntityId: snapshot.fromId,
        toEntityId: snapshot.toId,
        type: (_a = snapshot.type) !== null && _a !== void 0 ? _a : RelationshipType.IMPORTS,
        created: asDate((_b = snapshot.created) !== null && _b !== void 0 ? _b : null),
        lastModified: asDate((_c = snapshot.lastModified) !== null && _c !== void 0 ? _c : null),
        version: typeof snapshot.version === "number" ? snapshot.version : 1,
        metadata: metadataObject,
    };
    const assign = (key, value) => {
        if (value !== undefined && value !== null) {
            relationship[key] = value;
        }
    };
    assign("importAlias", snapshot.importAlias);
    assign("importType", snapshot.importType);
    assign("isNamespace", snapshot.isNamespace);
    assign("isReExport", snapshot.isReExport);
    assign("reExportTarget", snapshot.reExportTarget);
    assign("language", snapshot.language);
    assign("symbolKind", snapshot.symbolKind);
    assign("modulePath", snapshot.modulePath);
    assign("resolutionState", snapshot.resolutionState);
    assign("importDepth", snapshot.importDepth);
    const normalized = normalizeStructuralRelationship(relationship);
    const normalizedMetadata = cloneMetadata(normalized.metadata);
    const expected = extractStructuralPersistenceFields(normalized, normalizedMetadata);
    const existing = {
        importAlias: stringOrNull(snapshot.importAlias),
        importType: stringOrNull(snapshot.importType),
        isNamespace: booleanOrNull(snapshot.isNamespace),
        isReExport: booleanOrNull(snapshot.isReExport),
        reExportTarget: stringOrNull(snapshot.reExportTarget),
        language: lowerCase(stringOrNull(snapshot.language)),
        symbolKind: lowerCase(stringOrNull(snapshot.symbolKind)),
        modulePath: normalizeModulePathValue(stringOrNull(snapshot.modulePath)),
        resolutionState: lowerCase(stringOrNull(snapshot.resolutionState)),
        importDepth: numberOrNull(snapshot.importDepth),
        confidence: CONFIDENCE_NORMALIZER((_d = snapshot.confidence) !== null && _d !== void 0 ? _d : null),
        scope: lowerCase(stringOrNull(snapshot.scope)),
        firstSeenAt: DATE_NORMALIZER((_e = snapshot.firstSeenAt) !== null && _e !== void 0 ? _e : null),
        lastSeenAt: DATE_NORMALIZER((_f = snapshot.lastSeenAt) !== null && _f !== void 0 ? _f : null),
    };
    const changedFields = [];
    Object.keys(expected).forEach((key) => {
        if (expected[key] !== existing[key]) {
            changedFields.push(key);
        }
    });
    const expectedMetadataJson = stableStringifyMetadata(normalizedMetadata);
    const existingMetadataJson = stableStringifyMetadata(metadataObject);
    if (expectedMetadataJson !== existingMetadataJson) {
        changedFields.push("metadata");
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
//# sourceMappingURL=structuralPersistence.js.map