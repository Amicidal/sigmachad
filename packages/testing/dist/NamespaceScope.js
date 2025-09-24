function applyPrefix(prefix, value) {
    if (prefix.length === 0) {
        return value;
    }
    return value.startsWith(prefix) ? value : `${prefix}${value}`;
}
function normalizeArray(input) {
    if (!Array.isArray(input)) {
        return undefined;
    }
    const filtered = input
        .filter((value) => typeof value === "string" && value.length > 0)
        .map((value) => value);
    return filtered.length > 0 ? filtered : undefined;
}
export function createNamespaceScope(bindings) {
    const { entityPrefix, redisPrefix, qdrant } = bindings;
    const requireEntityId = (id) => {
        if (typeof id !== "string" || id.length === 0) {
            throw new Error("Entity id is required");
        }
        return applyPrefix(entityPrefix, id);
    };
    const optionalEntityId = (id) => {
        if (typeof id !== "string" || id.length === 0) {
            return undefined;
        }
        return applyPrefix(entityPrefix, id);
    };
    const entityIdArray = (ids) => {
        const normalized = normalizeArray(ids);
        if (!normalized) {
            return undefined;
        }
        return normalized.map((value) => applyPrefix(entityPrefix, value));
    };
    const requireRelationshipId = (id) => {
        if (typeof id !== "string" || id.length === 0) {
            throw new Error("Relationship id is required");
        }
        return applyPrefix(entityPrefix, id);
    };
    const optionalRelationshipId = (id) => {
        if (typeof id !== "string" || id.length === 0) {
            return undefined;
        }
        return applyPrefix(entityPrefix, id);
    };
    const qualifyRedisKey = (key) => {
        if (typeof key !== "string" || key.length === 0) {
            throw new Error("Redis key is required");
        }
        if (redisPrefix.length === 0) {
            return key;
        }
        return key.startsWith(redisPrefix) ? key : `${redisPrefix}${key}`;
    };
    const qdrantCollection = (kind) => {
        return kind === "code" ? qdrant.code : qdrant.documentation;
    };
    return Object.freeze({
        entityPrefix,
        redisPrefix,
        qdrant,
        requireEntityId,
        optionalEntityId,
        entityIdArray,
        applyEntityPrefix: (id) => applyPrefix(entityPrefix, id),
        requireRelationshipId,
        optionalRelationshipId,
        applyRelationshipPrefix: (id) => applyPrefix(entityPrefix, id),
        qualifyRedisKey,
        qdrantCollection,
    });
}
//# sourceMappingURL=NamespaceScope.js.map