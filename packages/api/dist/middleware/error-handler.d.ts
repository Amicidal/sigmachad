/**
 * Enhanced Error Handler for API Gateway
 * Provides comprehensive error handling, logging, and response formatting
 */
import { FastifyReply, FastifyRequest } from 'fastify';
export interface ErrorContext {
    requestId: string;
    method: string;
    url: string;
    userAgent?: string;
    ip: string;
    timestamp: string;
    duration?: number;
}
export interface ErrorMetadata {
    code: string;
    statusCode: number;
    category: 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'not_found' | 'server_error' | 'service_unavailable';
    retryable: boolean;
    details?: Record<string, any>;
}
export interface StandardErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        category: string;
        retryable: boolean;
        details?: Record<string, any>;
    };
    context: ErrorContext;
}
export declare const createErrorHandler: () => (error: any, request: FastifyRequest, reply: FastifyReply) => void;
export declare const createApiError: (code: string, message: string, statusCode?: number, details?: Record<string, any>) => Error;
export declare const ValidationError: (message: string, details?: Record<string, any>) => Error;
export declare const AuthenticationError: (message?: string) => Error;
export declare const AuthorizationError: (message?: string) => Error;
export declare const NotFoundError: (message?: string) => Error;
export declare const RateLimitError: (message?: string, retryAfter?: number) => Error;
export declare const ServiceUnavailableError: (message?: string) => Error;
//# sourceMappingURL=error-handler.d.ts.map