/**
 * Authentication helpers for Fastify requests.
 * Provides JWT and API key verification along with scope-aware checks.
 */
import jwt from "jsonwebtoken";
import { authenticateApiKey } from "./api-key-registry.js";
import { normalizeInputToArray, normalizeScopes } from "./scopes.js";
const buildUserFromPayload = (payload) => {
    var _a, _b, _c, _d, _e;
    const permissions = normalizeInputToArray(payload.permissions);
    const scopes = normalizeScopes((_a = payload.scopes) !== null && _a !== void 0 ? _a : payload.scope, permissions);
    const role = typeof payload.role === "string" ? payload.role : "user";
    const userIdCandidate = (_e = (_d = (_c = (_b = payload.userId) !== null && _b !== void 0 ? _b : payload.sub) !== null && _c !== void 0 ? _c : payload.id) !== null && _d !== void 0 ? _d : payload.login) !== null && _e !== void 0 ? _e : payload.username;
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
const createAnonymousContext = () => ({
    tokenType: "anonymous",
    scopes: [],
});
const createAdminContext = (rawToken) => ({
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
const attachJwtMetadata = (context, payload) => {
    const audience = normalizeInputToArray(payload.aud);
    if (audience.length > 0)
        context.audience = audience;
    if (typeof payload.iss === "string")
        context.issuer = payload.iss;
    if (typeof payload.exp === "number")
        context.expiresAt = payload.exp;
    if (typeof payload.sessionId === "string") {
        context.sessionId = payload.sessionId;
    }
};
export function authenticateRequest(request) {
    const context = authenticateHeaders(request.headers, {
        requestId: request.id,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
    });
    return context;
}
export function authenticateHeaders(headers, audit) {
    const authHeader = headers["authorization"] || "";
    const apiKeyHeader = headers["x-api-key"];
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
        const context = {
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
            const payload = jwt.verify(token, secret);
            const user = buildUserFromPayload(payload);
            context.user = user;
            context.scopes = user.scopes;
            attachJwtMetadata(context, payload);
        }
        catch (error) {
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
        const context = {
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
export const scopesSatisfyRequirement = (grantedScopes, requiredScopes) => {
    if (!requiredScopes || requiredScopes.length === 0)
        return true;
    if (!grantedScopes || grantedScopes.length === 0)
        return false;
    const granted = new Set(grantedScopes.map((scope) => scope.toLowerCase()));
    return requiredScopes.every((scope) => granted.has(scope.toLowerCase()) || granted.has("admin"));
};
export function sendAuthError(reply, request, statusCode, errorCode, message, details = {}) {
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
//# sourceMappingURL=authentication.js.map