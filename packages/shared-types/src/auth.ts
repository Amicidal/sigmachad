export type AuthTokenType = "jwt" | "api-key" | "admin-token" | "anonymous";

export type AuthTokenError =
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "INVALID_API_KEY"
  | "MISSING_BEARER"
  | "MISSING_SCOPES"
  | "CHECKSUM_MISMATCH";

export interface AuthenticatedUser {
  userId: string;
  role: string;
  scopes: string[];
  permissions?: string[];
  issuer?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthAuditContext {
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuthContext {
  tokenType: AuthTokenType;
  user?: AuthenticatedUser;
  apiKeyId?: string;
  rawToken?: string;
  scopes: string[];
  requiredScopes?: string[];
  audience?: string[];
  issuer?: string;
  expiresAt?: number;
  sessionId?: string;
  tokenError?: AuthTokenError;
  tokenErrorDetail?: string;
  audit?: AuthAuditContext;
  decision?: "granted" | "denied";
}

