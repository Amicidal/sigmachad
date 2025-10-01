/**
 * Unit tests for Validation Middleware
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { z, ZodError } from 'zod';
import {
  validateSchema,
  validateEntityId,
  validateSearchRequest,
  validatePagination,
  sanitizeInput,
  createRateLimitKey,
  uuidSchema,
  paginationSchema,
  entityIdSchema,
  searchQuerySchema,
  type MockFastifyRequest,
  type MockFastifyReply
} from '@memento/api/middleware/validation';

import {
  createMockRequest,
  createMockReply,
  createMockReplyWithStatus,
  createRequestFromIP,
  createRequestWithUserAgent,
  createRequestWithMethod,
  createRequestWithUrl,
} from '../../test-utils.js';

describe('Validation Middleware', () => {
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockReply = createMockReply();
    vi.clearAllMocks();
  });

  describe('Common Validation Schemas', () => {
    describe('uuidSchema', () => {
      it('should validate valid UUID strings', () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        expect(() => uuidSchema.parse(validUUID)).not.toThrow();
        expect(uuidSchema.parse(validUUID)).toBe(validUUID);
      });

      it('should reject invalid UUID strings', () => {
        const invalidUUIDs = [
          'not-a-uuid',
          '550e8400-e29b-41d4-a716', // too short
          '550e8400-e29b-41d4-a716-446655440000-extra', // too long
          '', // empty string
          '550e8400e29b41d4a716446655440000', // no dashes
        ];

        invalidUUIDs.forEach(uuid => {
          expect(() => uuidSchema.parse(uuid)).toThrow(ZodError);
        });
      });
    });

    describe('paginationSchema', () => {
      it('should validate valid pagination parameters', () => {
        const validPagination = { limit: 50, offset: 0 };
        expect(() => paginationSchema.parse(validPagination)).not.toThrow();
        expect(paginationSchema.parse(validPagination)).toEqual(validPagination);
      });

      it('should apply default values', () => {
        const partialPagination = {};
        const result = paginationSchema.parse(partialPagination);
        expect(result.limit).toBe(50);
        expect(result.offset).toBe(0);
      });

      it('should reject invalid limit values', () => {
        const invalidLimits = [-1, 0, 1001, '50'];
        invalidLimits.forEach(limit => {
          expect(() => paginationSchema.parse({ limit, offset: 0 })).toThrow(ZodError);
        });
      });

      it('should reject invalid offset values', () => {
        const invalidOffsets = [-1, '0'];
        invalidOffsets.forEach(offset => {
          expect(() => paginationSchema.parse({ limit: 50, offset })).toThrow(ZodError);
        });
      });
    });

    describe('entityIdSchema', () => {
      it('should validate valid entity IDs', () => {
        const validIds = ['user123', 'file-name.ts', 'entity_with_underscores'];
        validIds.forEach(id => {
          expect(() => entityIdSchema.parse(id)).not.toThrow();
          expect(entityIdSchema.parse(id)).toBe(id);
        });
      });

      it('should reject invalid entity IDs', () => {
        const invalidIds = ['', 'a'.repeat(256), null, undefined];
        invalidIds.forEach(id => {
          expect(() => entityIdSchema.parse(id)).toThrow(ZodError);
        });
      });
    });

    describe('searchQuerySchema', () => {
      it('should validate complete search query', () => {
        const validSearchQuery = {
          query: 'test search',
          entityTypes: ['function', 'class'],
          searchType: 'semantic',
          filters: {
            language: 'typescript',
            path: '/src',
            tags: ['important'],
            lastModified: {
              since: '2023-01-01T00:00:00.000Z',
              until: '2023-12-31T23:59:59.000Z',
            },
          },
          includeRelated: true,
          limit: 50,
        };

        expect(() => searchQuerySchema.parse(validSearchQuery)).not.toThrow();
      });

      it('should validate minimal search query', () => {
        const minimalSearchQuery = {
          query: 'test',
        };

        expect(() => searchQuerySchema.parse(minimalSearchQuery)).not.toThrow();
      });

      it('should reject invalid search queries', () => {
        const invalidQueries = [
          { query: '' }, // empty query
          { query: 'a'.repeat(1001) }, // too long
          { query: 'test', entityTypes: ['invalid'] }, // invalid entity type
          { query: 'test', searchType: 'invalid' }, // invalid search type
          { query: 'test', limit: 0 }, // invalid limit
          { query: 'test', limit: 101 }, // limit too high
        ];

        invalidQueries.forEach(query => {
          expect(() => searchQuerySchema.parse(query)).toThrow(ZodError);
        });
      });
    });
  });

  describe('validateSchema function', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
      email: z.string().email(),
    });

    it('should validate request body successfully', async () => {
      const validBody = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      mockRequest.body = validBody;
      const middleware = validateSchema(testSchema);

      await middleware(mockRequest, mockReply);

      expect(mockRequest.body).toEqual(validBody);
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle body validation errors', async () => {
      const invalidBody = {
        name: '',
        age: -1,
        email: 'invalid-email',
      };

      mockRequest.body = invalidBody;
      const middleware = validateSchema(testSchema);

      await middleware(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should validate query parameters', async () => {
      // Use field names that the internal extractQuerySchema function recognizes
      const querySchema = z.object({
        limit: z.number(),
        offset: z.number(),
      });

      const validQuery = { limit: 10, offset: 0 };
      mockRequest.query = validQuery;

      const middleware = validateSchema(querySchema);
      await middleware(mockRequest, mockReply);

      expect(mockRequest.query).toEqual({ limit: 10, offset: 0 });
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should validate path parameters', async () => {
      // Use field names that the internal extractParamsSchema function recognizes
      const paramsSchema = z.object({
        id: z.string().uuid(),
        name: z.string(),
      });

      const validParams = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test'
      };
      mockRequest.params = validParams;

      const middleware = validateSchema(paramsSchema);
      await middleware(mockRequest, mockReply);

      expect(mockRequest.params).toEqual(validParams);
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle non-Zod errors gracefully', async () => {
      // Create a schema that will cause a non-Zod error during body validation
      const badSchema = {
        parse: () => { throw new Error('Non-Zod error'); }
      } as any;

      mockRequest.body = { test: 'data' }; // Add body to trigger validation
      const middleware = validateSchema(badSchema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_INTERNAL_ERROR',
          message: 'Internal validation error',
        },
      });
    });

    it('should skip validation when no body/query/params present', async () => {
      const middleware = validateSchema(testSchema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });



  describe('Pre-built Validation Middlewares', () => {
    describe('validateEntityId', () => {
      it('should validate valid entity ID in params', async () => {
        mockRequest.params = { entityId: 'valid-entity-id' };

        await validateEntityId(mockRequest, mockReply);

        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should reject invalid entity ID', async () => {
        mockRequest.params = { entityId: '' };

        await validateEntityId(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.any(Array),
          },
        });
      });
    });

    describe('validateSearchRequest', () => {
      it('should validate valid search request', async () => {
        mockRequest.body = {
          query: 'test search',
          entityTypes: ['function'],
          searchType: 'semantic',
          limit: 50,
        };

        await validateSearchRequest(mockRequest, mockReply);

        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should reject invalid search request', async () => {
        mockRequest.body = {
          query: '', // empty query
          limit: 200, // exceeds max
        };

        await validateSearchRequest(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
      });
    });

    describe('validatePagination', () => {
      it('should validate valid pagination parameters', async () => {
        // Since validatePagination uses paginationSchema directly on body/query/params,
        // we need to put the data in the right place. Let's try query first.
        mockRequest.query = { limit: 25, offset: 10 };

        await validatePagination(mockRequest, mockReply);

        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should reject invalid pagination parameters', async () => {
        mockRequest.query = { limit: 1500, offset: -1 };

        await validatePagination(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
      });
    });
  });

  describe('Sanitization Functions', () => {

    describe('sanitizeInput middleware', () => {
      it('should sanitize request body', async () => {
        mockRequest.body = {
          comment: '<script>alert("xss")</script>Hello World',
          name: 'John',
        };

        await sanitizeInput()(mockRequest, mockReply);

        expect(mockRequest.body.comment).toBe('Hello World');
        expect(mockRequest.body.name).toBe('John');
      });

      it('should sanitize request query', async () => {
        mockRequest.query = {
          search: '<b>search term</b>',
          filter: 'normal',
        };

        await sanitizeInput()(mockRequest, mockReply);

        expect(mockRequest.query.search).toBe('search term');
        expect(mockRequest.query.filter).toBe('normal');
      });

      it('should sanitize request params', async () => {
        mockRequest.params = {
          id: '<script>123</script>',
          name: '<b>John Doe</b>',
        };

        await sanitizeInput()(mockRequest, mockReply);

        expect(mockRequest.params.id).toBe(''); // Script tags are completely removed
        expect(mockRequest.params.name).toBe('John Doe');
      });

      it('should handle missing request properties', async () => {
        const minimalRequest = {} as MockFastifyRequest;

        await sanitizeInput()(minimalRequest, mockReply);

        // Should not throw or modify anything
        expect(minimalRequest).toEqual({});
      });
    });
  });

  describe('createRateLimitKey', () => {
    it('should create rate limit key from request properties', () => {
      const request = createMockRequest({
        ip: '192.168.1.1',
        method: 'POST',
        url: '/api/users',
        headers: { 'user-agent': 'TestAgent/1.0' },
      });

      const key = createRateLimitKey(request);
      expect(key).toBe('192.168.1.1:TestAgent/1.0:POST:/api/users');
    });

    it('should handle missing IP', () => {
      const request = createMockRequest({
        ip: '',
        headers: { 'user-agent': 'TestAgent' },
      });

      const key = createRateLimitKey(request);
      expect(key).toBe('unknown:TestAgent:GET:/api/test');
    });

    it('should handle missing user agent', () => {
      const request = createMockRequest({
        ip: '127.0.0.1',
        headers: {},
      });

      const key = createRateLimitKey(request);
      expect(key).toBe('127.0.0.1:unknown:GET:/api/test');
    });

    it('should handle different request types', () => {
      const testCases = [
        {
          request: createRequestFromIP('10.0.0.1'),
          expectedStart: '10.0.0.1:',
        },
        {
          request: createRequestWithUserAgent('CustomAgent'),
          expected: '127.0.0.1:CustomAgent:GET:/api/test',
        },
        {
          request: createRequestWithMethod('DELETE'),
          expected: '127.0.0.1:test-agent:DELETE:/api/test',
        },
        {
          request: createRequestWithUrl('/api/special'),
          expected: '127.0.0.1:test-agent:GET:/api/special',
        },
      ];

      testCases.forEach(({ request, expected, expectedStart }) => {
        const key = createRateLimitKey(request);
        if (expected) {
          expect(key).toBe(expected);
        } else if (expectedStart) {
          expect(key.startsWith(expectedStart)).toBe(true);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex validation with body data', async () => {
      const complexSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()),
        metadata: z.object({
          author: z.string(),
          published: z.boolean(),
        }),
      });

      mockRequest.body = {
        title: 'Test Title',
        description: 'Test Description',
        tags: ['tag1', 'tag2'],
        metadata: {
          author: 'Test Author',
          published: true,
        },
      };

      const middleware = validateSchema(complexSchema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        title: 'Test Title',
        description: 'Test Description',
        tags: ['tag1', 'tag2'],
        metadata: {
          author: 'Test Author',
          published: true,
        },
      });
    });

    it('should handle validation with sanitization', async () => {
      const schema = z.object({
        comment: z.string(),
        name: z.string(),
      });

      mockRequest.body = {
        comment: '<script>alert("hack")</script>This is a comment',
        name: '<b>John Doe</b>',
      };

      // First sanitize, then validate
      await sanitizeInput()(mockRequest, mockReply);
      const middleware = validateSchema(schema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockRequest.body.comment).toBe('This is a comment');
      expect(mockRequest.body.name).toBe('John Doe');
    });

    it('should handle empty or undefined request properties', async () => {
      const schema = z.object({
        optional: z.string().optional(),
      });

      // Request with no body, query, or params
      const emptyRequest = {} as MockFastifyRequest;
      const emptyReply = createMockReply();

      const middleware = validateSchema(schema);
      await middleware(emptyRequest, emptyReply);

      expect(emptyReply.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const schema = z.object({
        data: z.string(),
      });

      // Simulate malformed body that can't be parsed
      mockRequest.body = undefined; // This should be handled gracefully

      const middleware = validateSchema(schema);
      await middleware(mockRequest, mockReply);

      // Should not throw, should just skip validation
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle very large request bodies', async () => {
      const schema = z.object({
        data: z.string().max(1000),
      });

      const largeData = 'a'.repeat(2000); // Exceeds schema limit
      mockRequest.body = { data: largeData };

      const middleware = validateSchema(schema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
    });

    it('should handle special characters in validation', async () => {
      const schema = z.object({
        email: z.string().email(),
        url: z.string().url(),
      });

      const testCases = [
        { email: 'test@example.com', url: 'https://example.com' },
        { email: 'invalid-email', url: 'not-a-url' },
        { email: 'test+tag@example.com', url: 'http://localhost:3000' },
      ];

      for (const testCase of testCases) {
        mockRequest.body = testCase;
        const middleware = validateSchema(schema);
        await middleware(mockRequest, mockReply);

        if (testCase.email.includes('invalid') || testCase.url.includes('not-a-url')) {
          expect(mockReply.status).toHaveBeenCalledWith(400);
        } else {
          expect(mockReply.status).not.toHaveBeenCalled();
        }

        mockReply = createMockReply(); // Reset reply for next test
      }
    });
  });
});
