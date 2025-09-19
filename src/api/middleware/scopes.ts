/**
 * Utilities for working with authorization scopes.
 */

const SCOPE_ALIASES: Record<string, string> = {
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

export const normalizeInputToArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    return value
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return [];
};

export const normalizeScopes = (scopes: unknown, fallback?: unknown): string[] => {
  const rawScopes = normalizeInputToArray(scopes);
  const alternate = rawScopes.length === 0 ? normalizeInputToArray(fallback) : [];
  const source = rawScopes.length > 0 ? rawScopes : alternate;
  const deduped = new Set(
    source
      .map((scope) => scope.trim().toLowerCase())
      .filter((scope) => scope.length > 0)
      .map((scope) => SCOPE_ALIASES[scope] ?? scope)
  );
  return Array.from(deduped);
};

export const applyScopeAliases = (scopes: string[]): string[] =>
  Array.from(
    new Set(
      scopes.map((scope) => scope.trim().toLowerCase()).map((scope) => SCOPE_ALIASES[scope] ?? scope)
    )
  );

