/**
 * Unit tests for Enhanced Error Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import {
  createErrorHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
} from '../src/middleware/error-handler.js';

describe('Enhanced Error Handler', () => {
  let mockRequest: any;
  let mockReply: any;
  let errorHandler: any;

  beforeEach(() => {
    mockRequest = {
      id: 'test-request-id',
      method: 'POST',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
      log: {
        error: vi.fn(),
        warn: vi.fn(),
      },
    };

    mockReply = {
      status: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    errorHandler = createErrorHandler();

    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TRPC Error handling', () => {
    it('should handle UNAUTHORIZED errors', () => {
      const error = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            category: 'authentication',
            retryable: false,
          },
          context: expect.objectContaining({
            requestId: 'test-request-id',
            method: 'POST',
            url: '/api/test',
          }),
        })
      );
    });

    it('should handle FORBIDDEN errors', () => {
      const error = new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            category: 'authorization',
            retryable: false,
          }),
        })
      );
    });

    it('should handle BAD_REQUEST errors', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
            category: 'validation',
            retryable: false,
          }),
        })
      );
    });

    it('should handle NOT_FOUND errors', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            category: 'not_found',
            retryable: false,
          }),
        })
      );
    });

    it('should handle TOO_MANY_REQUESTS errors', () => {
      const error = new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(429);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TOO_MANY_REQUESTS',
            category: 'rate_limit',
            retryable: true,
          }),
        })
      );
    });

    it('should handle INTERNAL_SERVER_ERROR with retryable flag', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            category: 'server_error',
            retryable: true,
          }),
        })
      );
    });
  });

  describe('Zod Error handling', () => {
    it('should handle Zod validation errors', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['field1', 'subfield'],
          message: 'Expected string, received number',
        },
      ]);

      errorHandler(zodError, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            category: 'validation',
            retryable: false,
            details: expect.objectContaining({
              issues: expect.any(Array),
              path: 'field1.subfield',
            }),
          }),
        })
      );
    });
  });

  describe('Fastify Error handling', () => {
    it('should handle Fastify validation errors', () => {
      const fastifyError = {
        code: 'FST_ERR_VALIDATION',
        statusCode: 400,
        message: 'Validation failed',
        validation: [{ message: 'Required field missing' }],
      };

      errorHandler(fastifyError, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            category: 'validation',
            retryable: false,
            details: expect.objectContaining({
              validation: expect.any(Array),
            }),
          }),
        })
      );
    });

    it('should handle Fastify not found errors', () => {
      const fastifyError = {
        code: 'FST_ERR_NOT_FOUND',
        statusCode: 404,
        message: 'Route not found',
      };

      errorHandler(fastifyError, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            category: 'not_found',
            retryable: false,
          }),
        })
      );
    });
  });

  describe('Network Error handling', () => {
    it('should handle connection refused errors', () => {
      const networkError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };

      errorHandler(networkError, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'SERVICE_UNAVAILABLE',
            category: 'service_unavailable',
            retryable: true,
            details: expect.objectContaining({
              networkError: 'ECONNREFUSED',
            }),
          }),
        })
      );
    });
  });

  describe('Logging behavior', () => {
    it('should log validation errors as warnings', () => {
      const zodError = new ZodError([{
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: [],
        message: 'Invalid type',
      }]);

      errorHandler(zodError, mockRequest, mockReply);

      expect(mockRequest.log.warn).toHaveBeenCalled();
      expect(mockRequest.log.error).not.toHaveBeenCalled();
    });

    it('should log server errors as errors', () => {
      const serverError = new Error('Server crashed');

      errorHandler(serverError, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockRequest.log.warn).not.toHaveBeenCalled();
    });
  });

  describe('Retry headers', () => {
    it('should add retry headers for retryable errors', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error',
      });

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('Retry-After', '60');
    });

    it('should use custom retry delay when provided', () => {
      const error = {
        message: 'too many requests',
        retryAfter: 120,
      };

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('Retry-After', '120');
    });
  });

  describe('Security headers', () => {
    it('should always add security headers', () => {
      const error = new Error('Any error');

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should sanitize error messages in production', () => {
      const error = new Error('Internal database connection failed');

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred',
          }),
        })
      );
    });

    it('should remove sensitive headers in production', () => {
      const error = new Error('Any error');

      errorHandler(error, mockRequest, mockReply);

      const sentData = mockReply.send.mock.calls[0][0];
      expect(sentData.context.userAgent).toBeUndefined();
    });
  });

  describe('Error factory functions', () => {
    it('should create validation errors correctly', () => {
      const error = ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect((error as any).code).toBe('VALIDATION_ERROR');
      expect((error as any).statusCode).toBe(400);
      expect((error as any).details).toEqual({ field: 'email' });
    });

    it('should create authentication errors correctly', () => {
      const error = AuthenticationError('Token expired');

      expect(error.message).toBe('Token expired');
      expect((error as any).code).toBe('UNAUTHORIZED');
      expect((error as any).statusCode).toBe(401);
    });

    it('should create authorization errors correctly', () => {
      const error = AuthorizationError();

      expect(error.message).toBe('Insufficient permissions');
      expect((error as any).code).toBe('FORBIDDEN');
      expect((error as any).statusCode).toBe(403);
    });

    it('should create not found errors correctly', () => {
      const error = NotFoundError('User not found');

      expect(error.message).toBe('User not found');
      expect((error as any).code).toBe('NOT_FOUND');
      expect((error as any).statusCode).toBe(404);
    });

    it('should create rate limit errors correctly', () => {
      const error = RateLimitError('Too many requests', 300);

      expect(error.message).toBe('Too many requests');
      expect((error as any).code).toBe('RATE_LIMIT_EXCEEDED');
      expect((error as any).statusCode).toBe(429);
      expect((error as any).details).toEqual({ retryAfter: 300 });
    });

    it('should create service unavailable errors correctly', () => {
      const error = ServiceUnavailableError();

      expect(error.message).toBe('Service temporarily unavailable');
      expect((error as any).code).toBe('SERVICE_UNAVAILABLE');
      expect((error as any).statusCode).toBe(503);
    });
  });
});