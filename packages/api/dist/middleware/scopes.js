/**
 * Utilities for working with authorization scopes.
 */
const SCOPE_ALIASES = {
    "read": "graph:read",
    "graph.read": "graph:read",
    "write": "graph:write",
    "graph.write": "graph:write",
    "read:graph": "graph:read",
    "write:graph": "graph:write",
    "analyze": "code:analyze",
    "code.read": "code:read",
    "code.write": "code:write",
    "session.manage": "session:manage",
    "session.refresh": "session:refresh",
};
export const normalizeInputToArray = (value) => {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value;
    if (typeof value === "string") {
        return value
            .split(/[\s,]+/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
    }
    return [];
};
export const normalizeScopes = (scopes, fallback) => {
    const rawScopes = normalizeInputToArray(scopes);
    const alternate = rawScopes.length === 0 ? normalizeInputToArray(fallback) : [];
    const source = rawScopes.length > 0 ? rawScopes : alternate;
    const deduped = new Set(source
        .map((scope) => scope.trim().toLowerCase())
        .filter((scope) => scope.length > 0)
        .map((scope) => { var _a; return (_a = SCOPE_ALIASES[scope]) !== null && _a !== void 0 ? _a : scope; }));
    return Array.from(deduped);
};
export const applyScopeAliases = (scopes) => Array.from(new Set(scopes.map((scope) => scope.trim().toLowerCase()).map((scope) => { var _a; return (_a = SCOPE_ALIASES[scope]) !== null && _a !== void 0 ? _a : scope; })));
//# sourceMappingURL=scopes.js.map