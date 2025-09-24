/**
 * Enhanced Error Handler for API Gateway
 * Provides comprehensive error handling, logging, and response formatting
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

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

const getErrorMetadata = (error: any): ErrorMetadata => {
  // TRPC Errors
  if (error instanceof TRPCError) {
    const category = error.code === 'UNAUTHORIZED' ? 'authentication' :
                    error.code === 'FORBIDDEN' ? 'authorization' :
                    error.code === 'BAD_REQUEST' ? 'validation' :
                    error.code === 'NOT_FOUND' ? 'not_found' :
                    error.code === 'TOO_MANY_REQUESTS' ? 'rate_limit' :
                    error.code === 'INTERNAL_SERVER_ERROR' ? 'server_error' :
                    'server_error';

    const statusCode = error.code === 'UNAUTHORIZED' ? 401 :
                      error.code === 'FORBIDDEN' ? 403 :
                      error.code === 'BAD_REQUEST' ? 400 :
                      error.code === 'NOT_FOUND' ? 404 :
                      error.code === 'TOO_MANY_REQUESTS' ? 429 :
                      error.code === 'TIMEOUT' ? 408 :
                      error.code === 'CONFLICT' ? 409 :
                      error.code === 'PRECONDITION_FAILED' ? 412 :
                      500;

    return {
      code: error.code,
      statusCode,
      category,
      retryable: ['TIMEOUT', 'INTERNAL_SERVER_ERROR'].includes(error.code),
      details: error.cause ? { cause: String(error.cause) } : undefined,
    };
  }

  // Zod Validation Errors
  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      category: 'validation',
      retryable: false,
      details: {
        issues: error.issues,
        path: error.issues[0]?.path?.join('.'),
      },
    };
  }

  // Fastify Errors
  if ((error as any)?.code?.startsWith('FST_')) {
    const fastifyError = error as FastifyError;

    if (fastifyError.code === 'FST_ERR_VALIDATION') {
      return {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        category: 'validation',
        retryable: false,
        details: {
          validation: (fastifyError as any).validation,
          validationContext: (fastifyError as any).validationContext,
        },
      };
    }

    if (fastifyError.code === 'FST_ERR_NOT_FOUND') {
      return {
        code: 'NOT_FOUND',
        statusCode: 404,
        category: 'not_found',
        retryable: false,
      };
    }

    return {
      code: fastifyError.code,
      statusCode: fastifyError.statusCode || 500,
      category: 'server_error',
      retryable: false,
    };
  }

  // Rate Limiting Errors
  if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      category: 'rate_limit',
      retryable: true,
      details: {
        retryAfter: error.retryAfter || 60,
      },
    };
  }

  // Authentication Errors
  if (error.message?.includes('unauthorized') || error.message?.includes('invalid token')) {
    return {
      code: 'UNAUTHORIZED',
      statusCode: 401,
      category: 'authentication',
      retryable: false,
    };
  }

  // Authorization Errors
  if (error.message?.includes('forbidden') || error.message?.includes('insufficient')) {
    return {
      code: 'FORBIDDEN',
      statusCode: 403,
      category: 'authorization',
      retryable: false,
    };
  }

  // Network/Connection Errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return {
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
      category: 'service_unavailable',
      retryable: true,
      details: {
        networkError: error.code,
      },
    };
  }

  // Default Server Error
  return {
    code: error.code || 'INTERNAL_SERVER_ERROR',
    statusCode: error.statusCode || 500,
    category: 'server_error',
    retryable: error.statusCode === 503,
    details: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      name: error.name,
    } : undefined,
  };
};

export const createErrorHandler = () => {
  return (error: any, request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;

    const context: ErrorContext = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'] as string,
      ip: request.ip,
      timestamp: new Date().toISOString(),
      duration,
    };

    const metadata = getErrorMetadata(error);

    // Log error with appropriate level
    const logLevel = metadata.category === 'validation' || metadata.category === 'not_found' ? 'warn' : 'error';
    const logData = {
      error: {
        message: error.message,
        code: metadata.code,
        category: metadata.category,
        statusCode: metadata.statusCode,
        stack: metadata.category === 'server_error' ? error.stack : undefined,
      },
      context,
      metadata: metadata.details,
    };

    if (logLevel === 'error') {
      request.log.error(logData, 'Request failed with error');
    } else {
      request.log.warn(logData, 'Request failed with warning');
    }

    // Sanitize error message for client
    const clientMessage = metadata.category === 'server_error' && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message;

    const response: StandardErrorResponse = {
      success: false,
      error: {
        code: metadata.code,
        message: clientMessage,
        category: metadata.category,
        retryable: metadata.retryable,
        details: metadata.details,
      },
      context: {
        ...context,
        // Remove sensitive headers in production
        userAgent: process.env.NODE_ENV === 'production' ? undefined : context.userAgent,
      },
    };

    // Add retry headers for retryable errors
    if (metadata.retryable) {
      const retryAfter = metadata.details?.retryAfter || 60;
      reply.header('Retry-After', retryAfter.toString());
    }

    // Add security headers
    reply.header('X-Content-Type-Options', 'nosniff');

    reply.status(metadata.statusCode).send(response);
  };
};

// Helper function for manual error throwing with proper typing
export const createApiError = (
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): Error => {
  const error = new Error(message) as any;
  error.code = code;
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
};

// Common error factory functions
export const ValidationError = (message: string, details?: Record<string, any>) =>
  createApiError('VALIDATION_ERROR', message, 400, details);

export const AuthenticationError = (message: string = 'Authentication required') =>
  createApiError('UNAUTHORIZED', message, 401);

export const AuthorizationError = (message: string = 'Insufficient permissions') =>
  createApiError('FORBIDDEN', message, 403);

export const NotFoundError = (message: string = 'Resource not found') =>
  createApiError('NOT_FOUND', message, 404);

export const RateLimitError = (message: string = 'Rate limit exceeded', retryAfter: number = 60) =>
  createApiError('RATE_LIMIT_EXCEEDED', message, 429, { retryAfter });

export const ServiceUnavailableError = (message: string = 'Service temporarily unavailable') =>
  createApiError('SERVICE_UNAVAILABLE', message, 503);