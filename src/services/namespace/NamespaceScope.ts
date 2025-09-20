export interface NamespaceBindings {
  entityPrefix: string;
  redisPrefix: string;
  qdrant: {
    code: string;
    documentation: string;
  };
}

export interface NamespaceScope {
  readonly entityPrefix: string;
  readonly redisPrefix: string;
  readonly qdrant: {
    code: string;
    documentation: string;
  };
  requireEntityId(id: string): string;
  optionalEntityId(id?: string | null): string | undefined;
  entityIdArray(ids?: string[] | null): string[] | undefined;
  applyEntityPrefix(id: string): string;
  requireRelationshipId(id: string): string;
  optionalRelationshipId(id?: string | null): string | undefined;
  applyRelationshipPrefix(id: string): string;
  qualifyRedisKey(key: string): string;
  qdrantCollection(kind: "code" | "documentation"): string;
}

function applyPrefix(prefix: string, value: string): string {
  if (prefix.length === 0) {
    return value;
  }
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

function normalizeArray(input?: string[] | null): string[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }
  const filtered = input
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value);
  return filtered.length > 0 ? filtered : undefined;
}

export function createNamespaceScope(bindings: NamespaceBindings): NamespaceScope {
  const { entityPrefix, redisPrefix, qdrant } = bindings;

  const requireEntityId = (id: string): string => {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error("Entity id is required");
    }
    return applyPrefix(entityPrefix, id);
  };

  const optionalEntityId = (id?: string | null): string | undefined => {
    if (typeof id !== "string" || id.length === 0) {
      return undefined;
    }
    return applyPrefix(entityPrefix, id);
  };

  const entityIdArray = (ids?: string[] | null): string[] | undefined => {
    const normalized = normalizeArray(ids);
    if (!normalized) {
      return undefined;
    }
    return normalized.map((value) => applyPrefix(entityPrefix, value));
  };

  const requireRelationshipId = (id: string): string => {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error("Relationship id is required");
    }
    return applyPrefix(entityPrefix, id);
  };

  const optionalRelationshipId = (id?: string | null): string | undefined => {
    if (typeof id !== "string" || id.length === 0) {
      return undefined;
    }
    return applyPrefix(entityPrefix, id);
  };

  const qualifyRedisKey = (key: string): string => {
    if (typeof key !== "string" || key.length === 0) {
      throw new Error("Redis key is required");
    }
    if (redisPrefix.length === 0) {
      return key;
    }
    return key.startsWith(redisPrefix) ? key : `${redisPrefix}${key}`;
  };

  const qdrantCollection = (kind: "code" | "documentation"): string => {
    return kind === "code" ? qdrant.code : qdrant.documentation;
  };

  return Object.freeze({
    entityPrefix,
    redisPrefix,
    qdrant,
    requireEntityId,
    optionalEntityId,
    entityIdArray,
    applyEntityPrefix: (id: string) => applyPrefix(entityPrefix, id),
    requireRelationshipId,
    optionalRelationshipId,
    applyRelationshipPrefix: (id: string) => applyPrefix(entityPrefix, id),
    qualifyRedisKey,
    qdrantCollection,
  });
}
