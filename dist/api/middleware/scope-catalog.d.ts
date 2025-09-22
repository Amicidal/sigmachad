/**
 * Scope catalogue management for the API gateway pre-handler.
 * Allows central declaration and dynamic registration of scope rules.
 */
export interface ScopeRequirement {
    scopes: string[];
    mode?: "all" | "any";
    description?: string;
}
export interface ScopeRule {
    matcher: RegExp;
    method?: string;
    scopes: string[];
    description?: string;
}
export declare class ScopeCatalog {
    private rules;
    constructor(initialRules?: ScopeRule[]);
    registerRule(rule: ScopeRule): void;
    registerRules(rules: ScopeRule[]): void;
    listRules(): ScopeRule[];
    resolveRequirement(method: string, fullPath: string): ScopeRequirement | null;
}
export declare const DEFAULT_SCOPE_RULES: ScopeRule[];
//# sourceMappingURL=scope-catalog.d.ts.map