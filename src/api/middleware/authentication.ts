/**
 * Authentication helpers for Fastify requests.
 * Provides JWT and API key verification along with scope-aware checks.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { authenticateApiKey } from "./api-key-registry.js";
import { normalizeInputToArray, normalizeScopes } from "./scopes.js";

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

const buildUserFromPayload = (payload: jwt.JwtPayload): AuthenticatedUser => {
  const permissions = normalizeInputToArray(payload.permissions);
  const scopes = normalizeScopes(payload.scopes ?? payload.scope, permissions);
  const role = typeof payload.role === "string" ? payload.role : "user";
  const userIdCandidate =
    payload.userId ?? payload.sub ?? payload.id ?? payload.login ?? payload.username;
  const userId = typeof userIdCandidate === "string" && userIdCandidate.length > 0
    ? userIdCandidate
    : "anonymous";

  return {
    userId,
    role,
    scopes,
    permissions,
    issuer: typeof payload.iss === "string" ? payload.iss : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    metadata: {
      tokenIssuedAt: payload.iat,
      tokenExpiresAt: payload.exp,
      audience: payload.aud,
    },
  };
};

const createAnonymousContext = (): AuthContext => ({
  tokenType: "anonymous",
  scopes: [],
});

const createAdminContext = (rawToken: string): AuthContext => ({
  tokenType: "admin-token",
  rawToken,
  scopes: ["admin", "graph:read", "graph:write", "code:analyze", "session:manage"],
  apiKeyId: "admin",
  user: {
    userId: "admin",
    role: "admin",
    scopes: ["admin", "graph:read", "graph:write", "code:analyze", "session:manage"],
    permissions: ["admin", "read", "write"],
  },
});

const attachJwtMetadata = (context: AuthContext, payload: jwt.JwtPayload) => {
  const audience = normalizeInputToArray(payload.aud);
  if (audience.length > 0) context.audience = audience;
  if (typeof payload.iss === "string") context.issuer = payload.iss;
  if (typeof payload.exp === "number") context.expiresAt = payload.exp;
  if (typeof (payload as any).sessionId === "string") {
    context.sessionId = (payload as any).sessionId;
  }
};

export function authenticateRequest(request: FastifyRequest): AuthContext {
  const context = authenticateHeaders(request.headers, {
    requestId: request.id,
    ip: request.ip,
    userAgent: request.headers["user-agent"] as string | undefined,
  });
  return context;
}

export function authenticateHeaders(
  headers: FastifyRequest["headers"],
  audit?: AuthAuditContext
): AuthContext {
  const authHeader = (headers["authorization"] as string | undefined) || "";
  const apiKeyHeader = headers["x-api-key"] as string | undefined;
  const adminToken = (process.env.ADMIN_API_TOKEN || "").trim();

  if (adminToken && authHeader) {
    const tokenCandidate = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();
    if (tokenCandidate === adminToken) {
      const adminContext = createAdminContext(tokenCandidate);
      adminContext.audit = audit;
      return adminContext;
    }
  }

  if (authHeader) {
    const hasBearerPrefix = authHeader.toLowerCase().startsWith("bearer ");
    const token = hasBearerPrefix ? authHeader.slice(7).trim() : authHeader.trim();

    const context: AuthContext = {
      tokenType: "jwt",
      rawToken: token,
      scopes: [],
      audit,
    };

    if (!hasBearerPrefix) {
      context.tokenError = "MISSING_BEARER";
      context.tokenErrorDetail = "Authorization header must use Bearer scheme";
      return context;
    }

    if (!token) {
      context.tokenError = "INVALID_TOKEN";
      context.tokenErrorDetail = "Bearer token is empty";
      return context;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      context.tokenError = "INVALID_TOKEN";
      context.tokenErrorDetail = "JWT secret is not configured";
      return context;
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      const user = buildUserFromPayload(payload);
      context.user = user;
      context.scopes = user.scopes;
      attachJwtMetadata(context, payload);
    } catch (error) {
      context.tokenError = error instanceof jwt.TokenExpiredError
        ? "TOKEN_EXPIRED"
        : "INVALID_TOKEN";
      context.tokenErrorDetail =
        error instanceof Error ? error.message : "Unable to verify token";
    }

    return context;
  }

  if (apiKeyHeader) {
    if (adminToken && apiKeyHeader.trim() === adminToken) {
      const adminContext = createAdminContext(apiKeyHeader.trim());
      adminContext.audit = audit;
      return adminContext;
    }

    const context: AuthContext = {
      tokenType: "api-key",
      rawToken: apiKeyHeader,
      scopes: [],
      audit,
    };

    const verification = authenticateApiKey(apiKeyHeader);
    if (!verification.ok) {
      context.tokenError = verification.errorCode;
      context.tokenErrorDetail = verification.message;
      return context;
    }

    context.apiKeyId = verification.record.id;
    context.scopes = verification.scopes;
    context.user = {
      userId: verification.record.id,
      role: "api-key",
      scopes: verification.scopes,
      permissions: [],
      metadata: {
        lastRotatedAt: verification.record.lastRotatedAt,
        checksum: verification.record.checksum,
      },
    };
    return context;
  }

  const anonymous = createAnonymousContext();
  anonymous.audit = audit;
  return anonymous;
}

export const scopesSatisfyRequirement = (
  grantedScopes: string[] | undefined,
  requiredScopes: string[] | undefined
): boolean => {
  if (!requiredScopes || requiredScopes.length === 0) return true;
  if (!grantedScopes || grantedScopes.length === 0) return false;
  const granted = new Set(grantedScopes.map((scope) => scope.toLowerCase()));
  return requiredScopes.every((scope) => granted.has(scope.toLowerCase()) || granted.has("admin"));
};

export interface AuthErrorDetails {
  reason?: string;
  detail?: string;
  remediation?: string;
  tokenType?: string;
  expiresAt?: number;
  requiredScopes?: string[];
  providedScopes?: string[];
}

export function sendAuthError(
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  errorCode: string,
  message: string,
  details: AuthErrorDetails = {}
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: errorCode,
      message,
      reason: details.reason,
      detail: details.detail,
      remediation: details.remediation,
    },
    metadata: {
      tokenType: details.tokenType,
      expiresAt: details.expiresAt,
      requiredScopes: details.requiredScopes,
      providedScopes: details.providedScopes,
    },
    timestamp: new Date().toISOString(),
    requestId: request.id,
  });
}
