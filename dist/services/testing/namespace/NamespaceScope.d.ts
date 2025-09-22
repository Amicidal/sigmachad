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
export declare function createNamespaceScope(bindings: NamespaceBindings): NamespaceScope;
//# sourceMappingURL=NamespaceScope.d.ts.map