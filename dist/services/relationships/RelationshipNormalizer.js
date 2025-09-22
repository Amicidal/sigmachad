import crypto from "crypto";
import { RelationshipType, } from "../../models/relationships.js";
import { canonicalRelationshipId } from "../../utils/codeEdges.js";
const structuralAdapters = [];
export function registerStructuralAdapter(adapter) {
    structuralAdapters.push(adapter);
}
function applyRegisteredAdapters(rel) {
    for (const adapter of structuralAdapters) {
        try {
            adapter(rel);
        }
        catch (error) {
            // Adapters should never throw; log when NODE_ENV indicates diagnostics
            if ((process.env.STRUCTURAL_ADAPTER_DEBUG || "0") === "1") {
                console.warn("Structural adapter failed", error);
            }
        }
    }
}
export function normalizeStructuralRelationship(relIn) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
    const rel = relIn;
    const md = { ...(rel.metadata || {}) };
    rel.metadata = md;
    const sanitizeString = (value, max = 512) => {
        if (typeof value !== "string")
            return undefined;
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
    };
    const sanitizeBoolean = (value) => {
        if (typeof value === "boolean")
            return value;
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "true")
                return true;
            if (normalized === "false")
                return false;
        }
        return undefined;
    };
    const sanitizeNonNegativeInt = (value) => {
        if (value === null || value === undefined)
            return undefined;
        const num = Number(value);
        if (!Number.isFinite(num))
            return undefined;
        if (num < 0)
            return 0;
        return Math.floor(num);
    };
    const sanitizeConfidence = (value) => {
        if (value === null || value === undefined)
            return undefined;
        const num = Number(value);
        if (!Number.isFinite(num))
            return undefined;
        if (num < 0)
            return 0;
        if (num > 1)
            return 1;
        return num;
    };
    const normalizeLanguage = (value) => {
        const sanitized = sanitizeString(value, 64);
        if (!sanitized)
            return undefined;
        return sanitized.toLowerCase();
    };
    const normalizeSymbolKind = (value) => {
        const sanitized = sanitizeString(value, 64);
        if (!sanitized)
            return undefined;
        return sanitized.toLowerCase();
    };
    const normalizeModulePath = (value) => {
        const sanitized = sanitizeString(value, 1024);
        if (!sanitized)
            return undefined;
        let normalized = sanitized.replace(/\\+/g, "/");
        if (normalized.length > 1) {
            normalized = normalized.replace(/\/+$/g, "");
            if (normalized.length === 0) {
                normalized = "/";
            }
        }
        normalized = normalized.replace(/\/{2,}/g, "/");
        return normalized;
    };
    const normalizeResolutionState = (value) => {
        if (typeof value === "boolean") {
            return value ? "resolved" : "unresolved";
        }
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "resolved")
                return "resolved";
            if (normalized === "unresolved")
                return "unresolved";
            if (normalized === "partial")
                return "partial";
        }
        return undefined;
    };
    const normalizeImportType = (value, namespaceHint, wildcardHint) => {
        const raw = sanitizeString(value, 32);
        if (!raw) {
            if (namespaceHint)
                return "namespace";
            if (wildcardHint)
                return "wildcard";
            return undefined;
        }
        const normalized = raw.toLowerCase().replace(/[_\s]+/g, "-");
        switch (normalized) {
            case "default":
            case "default-import":
            case "import-default":
                return "default";
            case "named":
            case "named-import":
            case "type":
            case "types":
                return "named";
            case "namespace":
            case "namespace-import":
            case "star-import":
                return "namespace";
            case "wildcard":
            case "all":
                return "wildcard";
            case "side-effect":
            case "sideeffect":
            case "side-effect-import":
                return "side-effect";
            default:
                if (normalized === "*")
                    return "wildcard";
                if (normalized.includes("namespace"))
                    return "namespace";
                if (normalized.includes("side"))
                    return "side-effect";
                if (normalized.includes("default"))
                    return "default";
                if (normalized.includes("wild"))
                    return "wildcard";
                if (normalized.includes("star"))
                    return "namespace";
                if (normalized.includes("type"))
                    return "named";
                return undefined;
        }
    };
    const resolvedFlag = (_b = (_a = sanitizeBoolean(rel.resolved)) !== null && _a !== void 0 ? _a : sanitizeBoolean(md.resolved)) !== null && _b !== void 0 ? _b : sanitizeBoolean(md.isResolved);
    const hadResolvedInput = typeof resolvedFlag === "boolean";
    if (typeof resolvedFlag === "boolean") {
        rel.resolved = resolvedFlag;
        md.resolved = resolvedFlag;
    }
    else {
        delete rel.resolved;
        if (md.resolved !== undefined)
            delete md.resolved;
        if (md.isResolved !== undefined)
            delete md.isResolved;
    }
    const existingConfidence = (_c = sanitizeConfidence(rel.confidence)) !== null && _c !== void 0 ? _c : sanitizeConfidence(md.confidence);
    if (typeof existingConfidence === "number") {
        rel.confidence = existingConfidence;
        md.confidence = existingConfidence;
    }
    const initialResolutionState = normalizeResolutionState((_e = (_d = rel.resolutionState) !== null && _d !== void 0 ? _d : md.resolutionState) !== null && _e !== void 0 ? _e : ((_f = md.resolved) !== null && _f !== void 0 ? _f : rel.resolved));
    if (initialResolutionState) {
        rel.resolutionState = initialResolutionState;
        md.resolutionState = initialResolutionState;
    }
    const rawModule = (_k = (_j = (_h = (_g = rel.modulePath) !== null && _g !== void 0 ? _g : md.modulePath) !== null && _h !== void 0 ? _h : md.module) !== null && _j !== void 0 ? _j : md.moduleSpecifier) !== null && _k !== void 0 ? _k : md.sourceModule;
    const modulePath = normalizeModulePath(rawModule);
    if (modulePath) {
        rel.modulePath = modulePath;
        md.modulePath = modulePath;
    }
    else {
        delete rel.modulePath;
        if (md.modulePath !== undefined)
            delete md.modulePath;
    }
    if (rel.type === RelationshipType.IMPORTS) {
        const alias = (_m = (_l = sanitizeString(rel.importAlias, 256)) !== null && _l !== void 0 ? _l : sanitizeString(md.importAlias, 256)) !== null && _m !== void 0 ? _m : sanitizeString(md.alias, 256);
        if (alias) {
            rel.importAlias = alias;
            md.importAlias = alias;
        }
        else {
            delete rel.importAlias;
        }
        const namespaceHint = Boolean(sanitizeBoolean((_o = rel.isNamespace) !== null && _o !== void 0 ? _o : md.isNamespace) ||
            (typeof modulePath === "string" && modulePath.endsWith("/*")));
        const wildcardHint = typeof rawModule === "string" && rawModule.trim() === "*";
        const importType = normalizeImportType((_r = (_q = (_p = rel.importType) !== null && _p !== void 0 ? _p : md.importType) !== null && _q !== void 0 ? _q : md.importKind) !== null && _r !== void 0 ? _r : md.kind, namespaceHint, wildcardHint);
        if (importType) {
            rel.importType = importType;
            md.importType = importType;
        }
        else {
            delete rel.importType;
        }
        const isNamespace = (_t = sanitizeBoolean((_s = rel.isNamespace) !== null && _s !== void 0 ? _s : md.isNamespace)) !== null && _t !== void 0 ? _t : (importType === "namespace" ? true : undefined);
        if (typeof isNamespace === "boolean") {
            rel.isNamespace = isNamespace;
            md.isNamespace = isNamespace;
        }
        else {
            delete rel.isNamespace;
        }
        const importDepth = sanitizeNonNegativeInt((_u = rel.importDepth) !== null && _u !== void 0 ? _u : md.importDepth);
        if (importDepth !== undefined) {
            rel.importDepth = importDepth;
            md.importDepth = importDepth;
        }
        const resolutionState = normalizeResolutionState((_x = (_w = (_v = rel.resolutionState) !== null && _v !== void 0 ? _v : md.resolutionState) !== null && _w !== void 0 ? _w : rel.resolved) !== null && _x !== void 0 ? _x : md.resolved);
        if (resolutionState) {
            rel.resolutionState = resolutionState;
            md.resolutionState = resolutionState;
        }
        else {
            delete rel.resolutionState;
            if (md.resolutionState !== undefined)
                delete md.resolutionState;
        }
    }
    if (rel.type === RelationshipType.EXPORTS) {
        const reExportTarget = sanitizeString((_0 = (_z = (_y = rel.reExportTarget) !== null && _y !== void 0 ? _y : md.reExportTarget) !== null && _z !== void 0 ? _z : md.module) !== null && _0 !== void 0 ? _0 : md.from, 1024);
        const hasReExportTarget = Boolean(reExportTarget);
        const rawIsReExport = sanitizeBoolean((_2 = (_1 = rel.isReExport) !== null && _1 !== void 0 ? _1 : md.isReExport) !== null && _2 !== void 0 ? _2 : md.reExport);
        const isReExport = rawIsReExport !== undefined
            ? rawIsReExport
            : hasReExportTarget
                ? true
                : undefined;
        if (typeof isReExport === "boolean") {
            rel.isReExport = isReExport;
            md.isReExport = isReExport;
        }
        else {
            delete rel.isReExport;
            if (md.isReExport !== undefined)
                delete md.isReExport;
        }
        if (hasReExportTarget && (isReExport === undefined || isReExport)) {
            rel.reExportTarget = reExportTarget;
            md.reExportTarget = reExportTarget;
        }
        else {
            delete rel.reExportTarget;
            if (md.reExportTarget !== undefined)
                delete md.reExportTarget;
        }
    }
    const language = (_5 = normalizeLanguage((_4 = (_3 = rel.language) !== null && _3 !== void 0 ? _3 : md.language) !== null && _4 !== void 0 ? _4 : md.lang)) !== null && _5 !== void 0 ? _5 : undefined;
    if (language) {
        rel.language = language;
        md.language = language;
    }
    else {
        delete rel.language;
    }
    const symbolKind = normalizeSymbolKind((_7 = (_6 = rel.symbolKind) !== null && _6 !== void 0 ? _6 : md.symbolKind) !== null && _7 !== void 0 ? _7 : md.kind);
    if (symbolKind) {
        rel.symbolKind = symbolKind;
        md.symbolKind = symbolKind;
        if (md.kind !== undefined)
            delete md.kind;
    }
    else {
        delete rel.symbolKind;
    }
    if (md.languageSpecific !== undefined &&
        (md.languageSpecific === null || typeof md.languageSpecific !== "object")) {
        delete md.languageSpecific;
    }
    applyRegisteredAdapters(rel);
    const legacyMetadataKeys = [
        "alias",
        "module",
        "moduleSpecifier",
        "sourceModule",
        "importKind",
        "lang",
        "languageId",
        "language_id",
        "reExport",
    ];
    for (const key of legacyMetadataKeys) {
        if (Object.prototype.hasOwnProperty.call(md, key)) {
            delete md[key];
        }
    }
    const inferStructuralResolutionState = () => {
        const classifyTarget = () => {
            const toRef = rel.toRef;
            const refKind = toRef && typeof toRef.kind === "string"
                ? toRef.kind.toLowerCase()
                : undefined;
            if (refKind &&
                ["filesymbol", "entity", "file", "directory"].includes(refKind)) {
                return "entity";
            }
            if (refKind === "external") {
                return "external";
            }
            if (refKind === "placeholder") {
                return "placeholder";
            }
            const toId = typeof rel.toEntityId === "string" ? rel.toEntityId : "";
            if (toId.startsWith("file:") ||
                toId.startsWith("sym:") ||
                toId.startsWith("dir:") ||
                toId.startsWith("entity:")) {
                return "entity";
            }
            if (/^(import:|external:|package:|module:)/.test(toId) ||
                /^(class|interface|function|typealias):/.test(toId)) {
                return "placeholder";
            }
            return undefined;
        };
        if (rel.type === RelationshipType.CONTAINS ||
            rel.type === RelationshipType.DEFINES) {
            return "resolved";
        }
        const targetKind = classifyTarget();
        if (targetKind === "entity")
            return "resolved";
        if (targetKind === "external" || targetKind === "placeholder") {
            return "unresolved";
        }
        return undefined;
    };
    const resolutionStateFinal = normalizeResolutionState((_9 = (_8 = rel.resolutionState) !== null && _8 !== void 0 ? _8 : md.resolutionState) !== null && _9 !== void 0 ? _9 : inferStructuralResolutionState());
    if (resolutionStateFinal) {
        rel.resolutionState = resolutionStateFinal;
        md.resolutionState = resolutionStateFinal;
    }
    else if (typeof rel.resolved === "boolean") {
        const inferred = rel.resolved ? "resolved" : "unresolved";
        rel.resolutionState = inferred;
        md.resolutionState = inferred;
    }
    const normalizedResolutionState = normalizeResolutionState((_10 = rel.resolutionState) !== null && _10 !== void 0 ? _10 : md.resolutionState);
    if (normalizedResolutionState) {
        rel.resolutionState = normalizedResolutionState;
        md.resolutionState = normalizedResolutionState;
    }
    else {
        delete rel.resolutionState;
        if (md.resolutionState !== undefined)
            delete md.resolutionState;
    }
    const resolvedFromState = normalizedResolutionState === "resolved"
        ? true
        : normalizedResolutionState === "unresolved"
            ? false
            : undefined;
    if (resolvedFromState !== undefined) {
        rel.resolved = resolvedFromState;
        md.resolved = resolvedFromState;
    }
    else if (!normalizedResolutionState && hadResolvedInput) {
        rel.resolved = resolvedFlag;
        md.resolved = resolvedFlag;
    }
    else if (!normalizedResolutionState && typeof rel.resolved === "boolean") {
        md.resolved = rel.resolved;
    }
    else {
        delete rel.resolved;
        if (md.resolved !== undefined)
            delete md.resolved;
    }
    if (typeof rel.confidence !== "number") {
        const resolutionState = rel.resolutionState;
        const defaultConfidence = (() => {
            if (rel.type === RelationshipType.CONTAINS ||
                rel.type === RelationshipType.DEFINES) {
                return 0.95;
            }
            if (resolutionState === "resolved")
                return 0.9;
            if (resolutionState === "partial")
                return 0.6;
            return 0.4;
        })();
        rel.confidence = defaultConfidence;
    }
    if (typeof md.confidence !== "number") {
        md.confidence = rel.confidence;
    }
    rel.id = canonicalStructuralRelationshipId(rel);
    return rel;
}
function canonicalStructuralRelationshipId(rel) {
    var _a;
    const baseId = canonicalRelationshipId((_a = rel.fromEntityId) !== null && _a !== void 0 ? _a : "", rel);
    if (baseId.startsWith("time-rel_"))
        return baseId;
    if (baseId.startsWith("rel_")) {
        return `time-rel_${baseId.slice("rel_".length)}`;
    }
    return `time-rel_${crypto.createHash("sha1").update(baseId).digest("hex")}`;
}
// --- Default adapters ---
registerStructuralAdapter(function typescriptAdapter(relationship) {
    const md = relationship.metadata || {};
    const candidates = collectLanguageCandidates(relationship);
    let detected = candidates.find((value) => ["typescript", "ts", "tsx"].includes(value));
    let detectionSource = detected;
    if (!detected) {
        detected = guessLanguageFromPathHints(relationship);
        detectionSource = detected;
    }
    let syntaxHint;
    if (detectionSource === "tsx") {
        syntaxHint = "tsx";
    }
    else if (detectionSource === "ts") {
        syntaxHint = "ts";
    }
    if (!syntaxHint) {
        const moduleCandidates = [
            relationship.modulePath,
            md.modulePath,
            md.module,
            md.sourceModule,
            md.path,
        ].filter((value) => typeof value === "string");
        if (moduleCandidates.some((value) => value.toLowerCase().endsWith(".tsx"))) {
            syntaxHint = "tsx";
        }
        else if (moduleCandidates.some((value) => value.toLowerCase().endsWith(".ts"))) {
            syntaxHint = "ts";
        }
    }
    if (detected && ["ts", "tsx", "typescript"].includes(detected)) {
        detected = "typescript";
        const existingLanguageSpecific = md.languageSpecific && typeof md.languageSpecific === "object"
            ? md.languageSpecific
            : {};
        const currentSyntax = existingLanguageSpecific === null || existingLanguageSpecific === void 0 ? void 0 : existingLanguageSpecific.syntax;
        const nextSyntax = (() => {
            if (typeof currentSyntax === "string" && currentSyntax.trim() !== "") {
                return currentSyntax.trim();
            }
            if (syntaxHint)
                return syntaxHint;
            return "ts";
        })();
        md.languageSpecific = {
            ...existingLanguageSpecific,
            ...(nextSyntax ? { syntax: nextSyntax } : {}),
        };
    }
    const applyLanguage = (value) => {
        if (!value)
            return;
        const normalized = value.trim().toLowerCase();
        if (!normalized)
            return;
        relationship.language = normalized;
        md.language = normalized;
    };
    if (detected) {
        applyLanguage(detected);
    }
    else {
        const fallback = [relationship.language, md.language].find((value) => typeof value === "string" && value.trim() !== "");
        if (fallback) {
            applyLanguage(fallback);
        }
        else {
            delete relationship.language;
            delete md.language;
        }
    }
    if ((relationship.type === RelationshipType.IMPORTS ||
        relationship.type === RelationshipType.EXPORTS) &&
        !relationship.symbolKind) {
        relationship.symbolKind = "module";
        md.symbolKind = "module";
    }
});
registerStructuralAdapter(function pythonAdapter(relationship) {
    const md = relationship.metadata || {};
    const candidates = collectLanguageCandidates(relationship);
    let detected = candidates.find((value) => ["python", "py"].includes(value));
    if (!detected) {
        detected = guessLanguageFromPathHints(relationship, "py");
    }
    if (detected) {
        relationship.language = "python";
        md.language = "python";
    }
});
registerStructuralAdapter(function goAdapter(relationship) {
    const md = relationship.metadata || {};
    const candidates = collectLanguageCandidates(relationship);
    let detected = candidates.find((value) => value === "go");
    if (!detected) {
        detected = guessLanguageFromPathHints(relationship, "go");
    }
    if (detected) {
        relationship.language = "go";
        md.language = "go";
    }
});
function collectLanguageCandidates(rel) {
    const md = rel.metadata || {};
    const values = [
        rel.language,
        md.language,
        md.lang,
        md.languageId,
        md.language_id,
    ];
    return values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);
}
function guessLanguageFromPathHints(rel, extensionHint) {
    const md = rel.metadata || {};
    const candidates = [
        md.path,
        md.modulePath,
        rel.modulePath,
        rel.fromEntityId,
        rel.toEntityId,
    ]
        .filter((value) => typeof value === "string")
        .map((value) => value.toLowerCase());
    const matchesExtension = (ext) => candidates.some((candidate) => candidate.includes(`.${ext}`));
    if (!extensionHint && matchesExtension("ts"))
        return "typescript";
    if (!extensionHint && matchesExtension("tsx"))
        return "typescript";
    if (!extensionHint && matchesExtension("js"))
        return "javascript";
    if (extensionHint && matchesExtension(extensionHint)) {
        if (extensionHint === "py")
            return "python";
        if (extensionHint === "go")
            return "go";
    }
    return undefined;
}
//# sourceMappingURL=RelationshipNormalizer.js.map