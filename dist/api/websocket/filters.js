import path from "path";
const collectStrings = (...values) => {
    const results = [];
    for (const value of values) {
        if (!value)
            continue;
        if (Array.isArray(value)) {
            for (const inner of value) {
                if (inner) {
                    results.push(inner);
                }
            }
        }
        else {
            results.push(value);
        }
    }
    return results;
};
const normalizeExtension = (ext) => {
    const trimmed = ext.trim();
    if (!trimmed)
        return trimmed;
    const lowered = trimmed.toLowerCase();
    return lowered.startsWith(".") ? lowered : `.${lowered}`;
};
const toLower = (value) => value.toLowerCase();
export const normalizeFilter = (filter) => {
    if (!filter) {
        return undefined;
    }
    const paths = collectStrings(filter.path, filter.paths);
    const absolutePaths = paths.map((p) => path.resolve(p));
    const extensions = collectStrings(filter.extensions).map(normalizeExtension);
    const types = collectStrings(filter.type, filter.types, filter.changeType, filter.changeTypes)
        .map((t) => t.trim())
        .filter(Boolean)
        .map(toLower);
    const eventTypes = collectStrings(filter.eventTypes)
        .map((t) => t.trim())
        .filter(Boolean)
        .map(toLower);
    const entityTypes = collectStrings(filter.entityType, filter.entityTypes)
        .map((t) => t.trim())
        .filter(Boolean)
        .map(toLower);
    const relationshipTypes = collectStrings(filter.relationshipType, filter.relationshipTypes)
        .map((t) => t.trim())
        .filter(Boolean)
        .map(toLower);
    const sessionIds = collectStrings(filter.sessionId, filter.sessionIds)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const operationIds = collectStrings(filter.operationId, filter.operationIds)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const sessionEvents = collectStrings(filter.sessionEvents)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const sessionEdgeTypes = collectStrings(filter.sessionEdgeTypes)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    return {
        paths,
        absolutePaths,
        extensions,
        types,
        eventTypes,
        entityTypes,
        relationshipTypes,
        sessionIds,
        operationIds,
        sessionEvents,
        sessionEdgeTypes,
    };
};
const pathMatchesAbsolute = (prefixes, candidate) => {
    if (!candidate) {
        return false;
    }
    const normalizedCandidate = path.resolve(candidate);
    for (const prefix of prefixes) {
        const normalizedPrefix = path.resolve(prefix);
        if (normalizedCandidate === normalizedPrefix) {
            return true;
        }
        if (normalizedCandidate.startsWith(normalizedPrefix.endsWith(path.sep)
            ? normalizedPrefix
            : `${normalizedPrefix}${path.sep}`)) {
            return true;
        }
    }
    return false;
};
const matchesFileChange = (filter, event) => {
    const change = event.data || {};
    const changeType = (change.type || change.changeType || "")
        .toString()
        .toLowerCase();
    if (filter.types.length > 0 && !filter.types.includes(changeType)) {
        return false;
    }
    const candidatePath = typeof change.absolutePath === "string"
        ? change.absolutePath
        : typeof change.path === "string"
            ? path.resolve(process.cwd(), change.path)
            : undefined;
    if (filter.absolutePaths.length > 0 &&
        !pathMatchesAbsolute(filter.absolutePaths, candidatePath)) {
        return false;
    }
    if (filter.extensions.length > 0) {
        const target = typeof change.path === "string"
            ? change.path
            : typeof change.absolutePath === "string"
                ? change.absolutePath
                : undefined;
        if (!target) {
            return false;
        }
        const extension = path.extname(target).toLowerCase();
        if (!filter.extensions.includes(extension)) {
            return false;
        }
    }
    return true;
};
const matchesEntityEvent = (filter, event) => {
    var _a, _b;
    if (filter.entityTypes.length === 0) {
        return true;
    }
    const candidate = (((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.entityType) || "")
        .toString()
        .toLowerCase();
    if (!candidate) {
        return false;
    }
    return filter.entityTypes.includes(candidate);
};
const matchesRelationshipEvent = (filter, event) => {
    var _a, _b;
    if (filter.relationshipTypes.length === 0) {
        return true;
    }
    const candidate = (((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.relationshipType) || "")
        .toString()
        .toLowerCase();
    if (!candidate) {
        return false;
    }
    return filter.relationshipTypes.includes(candidate);
};
const matchesSessionEvent = (filter, event) => {
    var _a;
    const payload = ((_a = event.data) !== null && _a !== void 0 ? _a : {});
    const rawSessionId = typeof payload.sessionId === "string"
        ? payload.sessionId
        : typeof payload.session_id === "string"
            ? payload.session_id
            : undefined;
    const normalizedSessionId = rawSessionId === null || rawSessionId === void 0 ? void 0 : rawSessionId.toLowerCase();
    if (filter.sessionIds.length > 0) {
        if (!normalizedSessionId || !filter.sessionIds.includes(normalizedSessionId)) {
            return false;
        }
    }
    const rawOperationId = typeof payload.operationId === "string"
        ? payload.operationId
        : typeof payload.operation_id === "string"
            ? payload.operation_id
            : undefined;
    const normalizedOperationId = rawOperationId === null || rawOperationId === void 0 ? void 0 : rawOperationId.toLowerCase();
    if (filter.operationIds.length > 0) {
        if (!normalizedOperationId || !filter.operationIds.includes(normalizedOperationId)) {
            return false;
        }
    }
    const eventName = typeof payload.event === "string"
        ? payload.event.toLowerCase()
        : undefined;
    if (filter.sessionEvents.length > 0) {
        if (!eventName || !filter.sessionEvents.includes(eventName)) {
            return false;
        }
    }
    if (filter.sessionEdgeTypes.length > 0) {
        const relationships = Array.isArray(payload.relationships)
            ? payload.relationships
            : [];
        const matchesEdge = relationships.some((rel) => {
            const relType = typeof (rel === null || rel === void 0 ? void 0 : rel.type) === "string"
                ? String(rel.type).toLowerCase()
                : typeof (rel === null || rel === void 0 ? void 0 : rel.relationshipType) === "string"
                    ? String(rel.relationshipType).toLowerCase()
                    : undefined;
            return !!relType && filter.sessionEdgeTypes.includes(relType);
        });
        if (!matchesEdge) {
            return false;
        }
    }
    return true;
};
export const matchesEvent = (subscription, event) => {
    var _a, _b, _c;
    const normalized = subscription.normalizedFilter;
    if (!normalized) {
        return true;
    }
    const eventType = (_c = (_b = (_a = event.type) === null || _a === void 0 ? void 0 : _a.toLowerCase) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "";
    if (normalized.eventTypes.length > 0 && !normalized.eventTypes.includes(eventType)) {
        return false;
    }
    if (event.type === "file_change") {
        return matchesFileChange(normalized, event);
    }
    if (event.type.startsWith("entity_")) {
        return matchesEntityEvent(normalized, event);
    }
    if (event.type.startsWith("relationship_")) {
        return matchesRelationshipEvent(normalized, event);
    }
    if (event.type === "session_event") {
        return matchesSessionEvent(normalized, event);
    }
    return true;
};
//# sourceMappingURL=filters.js.map