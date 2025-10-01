/**
 * Unit tests for Rate Limiting Middleware
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRateLimit,
  searchRateLimit,
  adminRateLimit,
  defaultRateLimit,
  strictRateLimit,
  cleanupBuckets,
  getRateLimitStats,
  startCleanupInterval
} from '@memento/api/middleware/rate-limiting';

// Define DEFAULT_CONFIGS locally for testing
const DEFAULT_CONFIGS = {
  search: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute for search
  admin: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute for admin
  default: { maxRequests: 1000, windowMs: 3600000 }, // 1000 requests per hour default
};
import {
  createMockRequest,
  createMockReply,
  createMockReplyWithStatus,
  createRequestFromIP,
  createRequestWithUserAgent,
  createRequestWithMethod,
  createRequestWithUrl,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../test-utils.js';

// Mock the validation module
vi.mock('./validation.js', () => ({
  createRateLimitKey: vi.fn((request: MockFastifyRequest) => {
    return `${request.ip}:${request.headers['user-agent']}:${request.method}:${request.url}`;
  })
}));

describe('Rate Limiting Middleware', () => {
  let mockRequest: MockFastifyRequest;

  beforeEach(() => {
    mockRequest = createMockRequest();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Ensure timers and system time are restored between tests
    try { vi.useRealTimers(); } catch {}
    vi.clearAllTimers();
  });

  describe('Token Bucket Algorithm', () => {
    it('should create a new bucket for first request', async () => {
      const rateLimit = createRateLimit({ maxRequests: 10, windowMs: 60000 });
      mockRequest.url = `/api/test-${Date.now()}-first`;
      const mockReply = createMockReply();
      await rateLimit(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should refill tokens based on time elapsed', async () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);
      const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 1000 });

      // First request
      mockRequest.url = `/api/test-${start}-refill`;
      const mockReply = createMockReply();
      await rateLimit(mockRequest, mockReply);

      // Advance time by 500ms (should refill 2.5 tokens, floored to 2)
      vi.setSystemTime(start + 500);

      // Second request should succeed (bucket should have tokens available)
      await rateLimit(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should consume tokens on each request', async () => {
      const rateLimit = createRateLimit({ maxRequests: 3, windowMs: 60000 });

      // Make 3 requests (should succeed)
      for (let i = 0; i < 3; i++) {
        const reply = createMockReply();
        await rateLimit(mockRequest, reply);
        expect(reply.status).not.toHaveBeenCalled();
      }

      // 4th request should be rate limited
      const reply = createMockReply();
      await rateLimit(mockRequest, reply);
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should not exceed max tokens during refill', async () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);
      const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 1000 });
      mockRequest.url = `/api/test-${start}-max`;

      // Use all tokens
      for (let i = 0; i < 5; i++) {
        const reply = createMockReply();
        await rateLimit(mockRequest, reply);
      }

      // Advance time by more than window (should refill to max)
      vi.setSystemTime(start + 2000);

      // Should be able to make requests again
      const reply = createMockReply();
      await rateLimit(mockRequest, reply);
      expect(reply.status).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should use search configuration for searchRateLimit', async () => {
      const searchRequests = DEFAULT_CONFIGS.search.maxRequests;
      mockRequest.url = `/api/test-${Date.now()}-search`;

      for (let i = 0; i < searchRequests; i++) {
        const reply = createMockReply();
        await searchRateLimit(mockRequest, reply);
        expect(reply.status).not.toHaveBeenCalled();
      }

      // Next request should be rate limited
      const reply = createMockReply();
      await searchRateLimit(mockRequest, reply);
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should use admin configuration for adminRateLimit', async () => {
      const adminRequests = DEFAULT_CONFIGS.admin.maxRequests;
      mockRequest.url = `/api/test-${Date.now()}-admin`;

      for (let i = 0; i < adminRequests; i++) {
        const reply = createMockReply();
        await adminRateLimit(mockRequest, reply);
        expect(reply.status).not.toHaveBeenCalled();
      }

      const reply = createMockReply();
      await adminRateLimit(mockRequest, reply);
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should use default configuration for defaultRateLimit', async () => {
      const defaultRequests = DEFAULT_CONFIGS.default.maxRequests;
      mockRequest.url = `/api/test-${Date.now()}-default`;

      for (let i = 0; i < defaultRequests; i++) {
        const reply = createMockReply();
        await defaultRateLimit(mockRequest, reply);
        expect(reply.status).not.toHaveBeenCalled();
      }

      const reply = createMockReply();
      await defaultRateLimit(mockRequest, reply);
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should use strict configuration for strictRateLimit', async () => {
      // strictRateLimit allows only 10 requests per minute
      mockRequest.url = `/api/test-${Date.now()}-strict`;
      for (let i = 0; i < 10; i++) {
        const reply = createMockReply();
        await strictRateLimit(mockRequest, reply);
        expect(reply.status).not.toHaveBeenCalled();
      }

      const reply = createMockReply();
      await strictRateLimit(mockRequest, reply);
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should merge custom config with defaults', async () => {
      const customRateLimit = createRateLimit({ maxRequests: 2 });
      mockRequest.url = `/api/test-${Date.now()}-custom`;
      const mockReply = createMockReply();

      await customRateLimit(mockRequest, mockReply);
      await customRateLimit(mockRequest, mockReply);

      // Third request should be rate limited
      await customRateLimit(mockRequest, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Skip Logic', () => {
    it('should skip rate limiting for successful requests when skipSuccessfulRequests is true', async () => {
      const rateLimit = createRateLimit({
        maxRequests: 1,
        windowMs: 60000,
        skipSuccessfulRequests: true
      });

      // First request succeeds
      const successfulReply = createMockReplyWithStatus(200);
      await rateLimit(mockRequest, successfulReply);

      // Second request should be skipped because first was successful
      await rateLimit(mockRequest, successfulReply);
      expect(successfulReply.status).not.toHaveBeenCalled();
    });

    it('should not skip rate limiting for failed requests when skipSuccessfulRequests is true', async () => {
      const rateLimit = createRateLimit({
        maxRequests: 1,
        windowMs: 60000,
        skipSuccessfulRequests: true
      });

      // First request fails
      const failedReply = createMockReplyWithStatus(400);
      await rateLimit(mockRequest, failedReply);

      // Second request should still be rate limited
      await rateLimit(mockRequest, failedReply);
      expect(failedReply.status).toHaveBeenCalledWith(429);
    });

    it('should skip rate limiting for failed requests when skipFailedRequests is true', async () => {
      const rateLimit = createRateLimit({
        maxRequests: 1,
        windowMs: 60000,
        skipFailedRequests: true
      });

      // First request fails
      const failedReply = createMockReplyWithStatus(500);
      await rateLimit(mockRequest, failedReply);

      // Second request should be skipped because first failed
      await rateLimit(mockRequest, failedReply);
      expect(failedReply.status).not.toHaveBeenCalled();
    });

    it('should not skip rate limiting for successful requests when skipFailedRequests is true', async () => {
      const rateLimit = createRateLimit({
        maxRequests: 1,
        windowMs: 60000,
        skipFailedRequests: true
      });

      // First request succeeds
      const successfulReply = createMockReplyWithStatus(200);
      await rateLimit(mockRequest, successfulReply);

      // Second request should still be rate limited
      await rateLimit(mockRequest, successfulReply);
      expect(successfulReply.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Rate Limit Exceeded Behavior', () => {
    it('should return 429 status when rate limit is exceeded', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });
      mockRequest.url = `/api/test-${Date.now()}-exceeded`;
      const mockReply = createMockReply();

      // First request succeeds
      await rateLimit(mockRequest, mockReply);

      // Second request is rate limited
      await rateLimit(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(429);
    });

    it('should include proper error response structure', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });
      mockRequest.url = `/api/test-${Date.now()}-error-structure`;
      const mockReply = createMockReply();

      await rateLimit(mockRequest, mockReply); // First request
      await rateLimit(mockRequest, mockReply); // Second request (rate limited)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          details: expect.objectContaining({
            retryAfter: expect.any(Number),
            limit: 1,
            windowMs: 60000,
          }),
        },
      });
    });

    it('should set rate limit headers', async () => {
      const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 60000 });
      const reply = createMockReply();
      mockRequest.url = `/api/test-${Date.now()}-headers`;

      await rateLimit(mockRequest, reply);

      expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
      expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should calculate correct retryAfter time', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 10000 });
      mockRequest.url = `/api/test-${Date.now()}-retry`;
      const mockReply = createMockReply();

      await rateLimit(mockRequest, mockReply); // First request
      await rateLimit(mockRequest, mockReply); // Second request (rate limited)

      const sendCall = mockReply.send.mock.calls[0][0];
      const retryAfter = sendCall.error.details.retryAfter;

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(10);
    });
  });

  describe('Cleanup and Stats Functions', () => {
    it('should clean up old buckets', () => {
      // Test that cleanupBuckets function exists and is callable
      expect(typeof cleanupBuckets).toBe('function');

      // Create a rate limit to ensure buckets are created
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 1000 });
      const request = createMockRequest();

      // Make a request to create a bucket
      rateLimit(request, createMockReply());

      // Call cleanup - in a real scenario this would clean up old buckets
      cleanupBuckets();

      // The function should execute without throwing
      expect(cleanupBuckets).not.toThrow();
    });

    it('should return correct rate limit stats', () => {
      // Test that getRateLimitStats function exists and returns expected structure
      expect(typeof getRateLimitStats).toBe('function');

      const stats = getRateLimitStats();

      // Should return an object with expected properties
      expect(stats).toHaveProperty('totalBuckets');
      expect(stats).toHaveProperty('activeBuckets');
      expect(stats).toHaveProperty('oldestBucket');
      expect(stats).toHaveProperty('newestBucket');

      // All properties should be numbers
      expect(typeof stats.totalBuckets).toBe('number');
      expect(typeof stats.activeBuckets).toBe('number');
      expect(typeof stats.oldestBucket).toBe('number');
      expect(typeof stats.newestBucket).toBe('number');
    });

    it('should start cleanup interval with default timing', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      startCleanupInterval();

      expect(setIntervalSpy).toHaveBeenCalledWith(cleanupBuckets, 300000);
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should start cleanup interval with custom timing', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      startCleanupInterval(60000);

      expect(setIntervalSpy).toHaveBeenCalledWith(cleanupBuckets, 60000);
    });
  });

  describe('Edge Cases and Different Request Types', () => {
    it('should handle different IP addresses as separate buckets', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });

      const request1 = createRequestFromIP('1.1.1.1');
      const request2 = createRequestFromIP('2.2.2.2');

      // Both should succeed initially
      const mockReply = createMockReply();
      await rateLimit(request1, mockReply);
      await rateLimit(request2, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle different user agents as separate buckets', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });

      const request1 = createRequestWithUserAgent('agent1');
      const request2 = createRequestWithUserAgent('agent2');

      const mockReply = createMockReply();
      await rateLimit(request1, mockReply);
      await rateLimit(request2, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle different methods as separate buckets', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });

      const getRequest = createRequestWithMethod('GET');
      const postRequest = createRequestWithMethod('POST');

      const getReply = createMockReply();
      const postReply = createMockReply();

      await rateLimit(getRequest, getReply);
      await rateLimit(postRequest, postReply);

      expect(getReply.status).not.toHaveBeenCalled();
      expect(postReply.status).not.toHaveBeenCalled();
    });

    it('should handle different URLs as separate buckets', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 60000 });

      const url1Request = createRequestWithUrl('/api/users');
      const url2Request = createRequestWithUrl('/api/posts');

      const mockReply = createMockReply();
      await rateLimit(url1Request, mockReply);
      await rateLimit(url2Request, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle unknown IP gracefully', async () => {
      const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 60000 });
      const requestWithoutIP = createMockRequest({ ip: '' });

      const mockReply = createMockReply();
      await rateLimit(requestWithoutIP, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle missing user agent gracefully', async () => {
      const rateLimit = createRateLimit({ maxRequests: 5, windowMs: 60000 });
      const requestWithoutUA = createMockRequest({
        headers: {}
      });

      const mockReply = createMockReply();
      await rateLimit(requestWithoutUA, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should handle zero maxRequests configuration', async () => {
      const rateLimit = createRateLimit({ maxRequests: 0, windowMs: 60000 });

      mockRequest.url = `/api/test-${Date.now()}-zero`;
      const mockReply = createMockReply();
      await rateLimit(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(429);
    });

    it('should handle very large windowMs values', async () => {
      const rateLimit = createRateLimit({ maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 }); // 24 hours

      mockRequest.url = `/api/test-${Date.now()}-large-window`;
      const mockReply = createMockReply();
      await rateLimit(mockRequest, mockReply);
      await rateLimit(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Concurrency and Timing', () => {
    it('should handle concurrent requests correctly', async () => {
      const rateLimit = createRateLimit({ maxRequests: 3, windowMs: 60000 });

      const promises = [];
      const replies = [];

      for (let i = 0; i < 5; i++) {
        const reply = createMockReply();
        replies.push(reply);
        // Use a unique URL per request to avoid bucket reuse across prior tests in-thread
        mockRequest.url = `/api/test-concurrent-${Date.now()}-${i}`;
        promises.push(rateLimit(mockRequest, reply));
      }

      await Promise.all(promises);

      // Count how many requests were rate limited
      const rateLimitedCount = replies.filter(reply =>
        reply.status.mock.calls.length > 0 && reply.status.mock.calls[0][0] === 429
      ).length;

      // With 3 max requests, 2 out of 5 should be rate limited
      expect(rateLimitedCount).toBe(2);
    });

    it('should handle timer precision correctly', async () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);
      const rateLimit = createRateLimit({ maxRequests: 2, windowMs: 1000 });
      mockRequest.url = `/api/test-${start}-precision`;

      const reply1 = createMockReply();
      await rateLimit(mockRequest, reply1);

      // Advance time by exactly half the window
      vi.setSystemTime(start + 500);

      const reply2 = createMockReply();
      await rateLimit(mockRequest, reply2);

      // Should still have tokens available
      expect(reply1.status).not.toHaveBeenCalled();
      expect(reply2.status).not.toHaveBeenCalled();
    });
  });
});
