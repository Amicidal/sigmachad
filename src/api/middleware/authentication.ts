/**
 * Authentication helpers for Fastify requests.
 * Provides JWT and API key verification along with basic permission checks.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export type AuthTokenType = "jwt" | "api-key" | "anonymous";

export interface AuthenticatedUser {
  userId: string;
  role: string;
  permissions: string[];
  issuer?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthContext {
  tokenType: AuthTokenType;
  user?: AuthenticatedUser;
  apiKeyId?: string;
  rawToken?: string;
  tokenError?:
    | "INVALID_TOKEN"
    | "TOKEN_EXPIRED"
    | "INVALID_API_KEY"
    | "MISSING_BEARER";
}

const normalizePermissions = (perms: unknown): string[] => {
  if (!Array.isArray(perms)) return [];
  return perms
    .map((perm) => (typeof perm === "string" ? perm.trim().toLowerCase() : ""))
    .filter((perm) => perm.length > 0);
};

const buildUserFromPayload = (payload: jwt.JwtPayload): AuthenticatedUser => {
  const permissions = normalizePermissions(payload.permissions);
  const role = typeof payload.role === "string" ? payload.role : "user";
  const userIdCandidate =
    payload.userId ?? payload.sub ?? payload.id ?? payload.login ?? payload.username;
  const userId = typeof userIdCandidate === "string" && userIdCandidate.length > 0
    ? userIdCandidate
    : "anonymous";

  return {
    userId,
    role,
    permissions,
    issuer: typeof payload.iss === "string" ? payload.iss : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    metadata: {
      tokenIssuedAt: payload.iat,
      tokenExpiresAt: payload.exp,
    },
  };
};

export function authenticateRequest(request: FastifyRequest): AuthContext {
  const authHeader = (request.headers["authorization"] as string | undefined) || "";
  const apiKeyHeader = request.headers["x-api-key"] as string | undefined;
  const adminToken = (process.env.ADMIN_API_TOKEN || "").trim();

  const createAdminContext = (rawToken: string): AuthContext => ({
    tokenType: "api-key",
    rawToken,
    apiKeyId: "admin",
    user: {
      userId: "admin",
      role: "admin",
      permissions: ["admin", "read"],
    },
  });

  if (authHeader) {
    const hasBearerPrefix = authHeader.toLowerCase().startsWith("bearer ");
    const token = hasBearerPrefix ? authHeader.slice(7).trim() : authHeader.trim();

    if (adminToken && token === adminToken) {
      return createAdminContext(token);
    }

    const context: AuthContext = {
      tokenType: "jwt",
      rawToken: token,
    };

    if (!hasBearerPrefix) {
      context.tokenError = "MISSING_BEARER";
      return context;
    }

    if (!token) {
      context.tokenError = "INVALID_TOKEN";
      return context;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      context.tokenError = "INVALID_TOKEN";
      return context;
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      context.user = buildUserFromPayload(payload);
    } catch (error) {
      context.tokenError = error instanceof jwt.TokenExpiredError
        ? "TOKEN_EXPIRED"
        : "INVALID_TOKEN";
    }

    return context;
  }

  if (apiKeyHeader) {
    if (adminToken && apiKeyHeader.trim() === adminToken) {
      return createAdminContext(apiKeyHeader.trim());
    }

    const context: AuthContext = {
      tokenType: "api-key",
      rawToken: apiKeyHeader,
    };

    try {
      const decoded = Buffer.from(apiKeyHeader, "base64").toString("utf8");
      const [keyId, providedSecret] = decoded.split(":");
      const expectedSecret = process.env.API_KEY_SECRET;

      if (keyId && providedSecret && expectedSecret && providedSecret === expectedSecret) {
        context.apiKeyId = keyId;
        context.user = {
          userId: keyId,
          role: "api-key",
          permissions: ["read"],
        };
        return context;
      }

      context.tokenError = "INVALID_API_KEY";
    } catch {
      context.tokenError = "INVALID_API_KEY";
    }

    return context;
  }

  return { tokenType: "anonymous" };
}

export const hasPermission = (
  user: AuthenticatedUser | undefined,
  required: string
): boolean => {
  if (!user) return false;
  const normalized = normalizePermissions(user.permissions);
  if (normalized.includes("admin")) return true;
  return normalized.includes(required.toLowerCase());
};

export function sendAuthError(
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  errorCode: string,
  message: string
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: errorCode,
      message,
    },
    timestamp: new Date().toISOString(),
    requestId: request.id,
  });
}
