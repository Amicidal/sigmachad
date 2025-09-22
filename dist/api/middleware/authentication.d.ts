/**
 * Authentication helpers for Fastify requests.
 * Provides JWT and API key verification along with scope-aware checks.
 */
import { FastifyReply, FastifyRequest } from "fastify";
export type AuthTokenType = "jwt" | "api-key" | "admin-token" | "anonymous";
export type AuthTokenError = "INVALID_TOKEN" | "TOKEN_EXPIRED" | "INVALID_API_KEY" | "MISSING_BEARER" | "MISSING_SCOPES" | "CHECKSUM_MISMATCH";
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
export declare function authenticateRequest(request: FastifyRequest): AuthContext;
export declare function authenticateHeaders(headers: FastifyRequest["headers"], audit?: AuthAuditContext): AuthContext;
export declare const scopesSatisfyRequirement: (grantedScopes: string[] | undefined, requiredScopes: string[] | undefined) => boolean;
export interface AuthErrorDetails {
    reason?: string;
    detail?: string;
    remediation?: string;
    tokenType?: string;
    expiresAt?: number;
    requiredScopes?: string[];
    providedScopes?: string[];
}
export declare function sendAuthError(reply: FastifyReply, request: FastifyRequest, statusCode: number, errorCode: string, message: string, details?: AuthErrorDetails): FastifyReply<import("fastify").RouteGenericInterface, import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
//# sourceMappingURL=authentication.d.ts.map