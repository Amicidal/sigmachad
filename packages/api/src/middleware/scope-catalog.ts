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

export class ScopeCatalog {
  private rules: ScopeRule[] = [];

  constructor(initialRules: ScopeRule[] = []) {
    this.rules = [...initialRules];
  }

  registerRule(rule: ScopeRule): void {
    this.rules.push(rule);
  }

  registerRules(rules: ScopeRule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  listRules(): ScopeRule[] {
    return [...this.rules];
  }

  resolveRequirement(method: string, fullPath: string): ScopeRequirement | null {
    const normalizedPath = (fullPath || "/").split("?")[0] || "/";
    const upperMethod = (method || "GET").toUpperCase();

    for (const rule of this.rules) {
      if (rule.method && rule.method.toUpperCase() !== upperMethod) {
        continue;
      }
      if (rule.matcher.test(normalizedPath)) {
        return {
          scopes: [...rule.scopes],
          mode: "all",
          description: rule.description,
        };
      }
    }

    return null;
  }
}

export const DEFAULT_SCOPE_RULES: ScopeRule[] = [
  {
    matcher: /^\/api\/v1\/(?:admin\/)?restore\/(?:preview|confirm)$/,
    method: "POST",
    scopes: ["admin", "admin:restore"],
    description: "Restore workflows require administrative restore scope",
  },
  {
    matcher: /^\/api\/v1\/(?:admin\/)?restore\/approve$/,
    method: "POST",
    scopes: ["admin", "admin:restore:approve"],
    description: "Restore approval requires elevated scope",
  },
  {
    matcher: /^\/api\/v1\/admin(?:\/|$)/,
    scopes: ["admin"],
    description: "Administrative endpoints",
  },
  {
    matcher: /^\/api\/v1\/history(?:\/|$)/,
    scopes: ["admin"],
    description: "Historical data endpoints require administrative access",
  },
  {
    matcher: /^\/api\/v1\/graph\/search$/,
    method: "POST",
    scopes: ["graph:read"],
    description: "Graph search requires read access",
  },
  {
    matcher: /^\/api\/v1\/graph\//,
    scopes: ["graph:read"],
    description: "Graph resources require read scope",
  },
  {
    matcher: /^\/api\/v1\/code\/analyze$/,
    method: "POST",
    scopes: ["code:analyze"],
    description: "Code analysis requires dedicated scope",
  },
  {
    matcher: /^\/api\/v1\/code\/validate$/,
    method: "POST",
    scopes: ["code:analyze"],
    description: "Code validation relies on analysis permission",
  },
  {
    matcher: /^\/api\/v1\/code\//,
    scopes: ["code:write"],
    description: "Code endpoints default to write scope",
  },
  {
    matcher: /^\/api\/v1\/auth\/refresh$/,
    method: "POST",
    scopes: ["session:refresh"],
    description: "Refresh token exchange",
  },
];
