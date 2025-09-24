/**
 * Rate Limiting Middleware for API Requests
 * Implements token bucket algorithm for rate limiting
 */
import { createRateLimitKey } from "./validation.js";
// Registry of all bucket stores for stats/cleanup
const bucketStores = new Set();
// Default rate limit configurations
const DEFAULT_CONFIGS = {
    search: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute for search
    admin: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute for admin
    default: { maxRequests: 1000, windowMs: 3600000 }, // 1000 requests per hour default
};
// Rate limiting middleware factory
export function createRateLimit(config = {}) {
    const finalConfig = { ...DEFAULT_CONFIGS.default, ...config };
    // Each middleware instance gets its own store to avoid cross-test interference
    const buckets = new Map();
    bucketStores.add(buckets);
    const requestKeyCache = new WeakMap();
    return async (request, reply) => {
        // Snapshot the derived key per request object to ensure stability under mutation in concurrent scenarios
        let key = requestKeyCache.get(request);
        if (!key) {
            key = createRateLimitKey(request);
            requestKeyCache.set(request, key);
        }
        const now = Date.now();
        // Get or create token bucket
        let bucket = buckets.get(key);
        if (!bucket) {
            bucket = {
                tokens: finalConfig.maxRequests,
                lastRefill: now,
            };
            buckets.set(key, bucket);
        }
        // Refill tokens based on time elapsed
        const timeElapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor((timeElapsed / finalConfig.windowMs) * finalConfig.maxRequests);
        bucket.tokens = Math.min(finalConfig.maxRequests, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        // Check if request should be skipped
        if (finalConfig.skipSuccessfulRequests && reply.statusCode < 400) {
            return;
        }
        if (finalConfig.skipFailedRequests && reply.statusCode >= 400) {
            return;
        }
        // Check if rate limit exceeded
        if (bucket.tokens <= 0) {
            const resetTime = bucket.lastRefill + finalConfig.windowMs;
            const retryAfter = Math.ceil((resetTime - now) / 1000);
            // Ensure rate limit headers are present on 429 responses
            reply.header("X-RateLimit-Limit", finalConfig.maxRequests.toString());
            reply.header("X-RateLimit-Remaining", "0");
            reply.header("X-RateLimit-Reset", resetTime.toString());
            reply.header("Retry-After", retryAfter.toString());
            reply.status(429).send({
                success: false,
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Too many requests",
                    details: {
                        retryAfter,
                        limit: finalConfig.maxRequests,
                        windowMs: finalConfig.windowMs,
                    },
                },
            });
            return;
        }
        // Consume token
        bucket.tokens--;
        // Add rate limit headers
        reply.header("X-RateLimit-Limit", finalConfig.maxRequests.toString());
        reply.header("X-RateLimit-Remaining", bucket.tokens.toString());
        reply.header("X-RateLimit-Reset", (bucket.lastRefill + finalConfig.windowMs).toString());
    };
}
// Pre-configured rate limiting middleware for different endpoints
export const searchRateLimit = createRateLimit(DEFAULT_CONFIGS.search);
export const adminRateLimit = createRateLimit(DEFAULT_CONFIGS.admin);
export const defaultRateLimit = createRateLimit(DEFAULT_CONFIGS.default);
// Stricter rate limit for sensitive operations
export const strictRateLimit = createRateLimit({
    maxRequests: 10,
    windowMs: 60000, // 10 requests per minute
});
// Cleanup function to remove old buckets (call periodically)
export function cleanupBuckets() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    for (const store of bucketStores) {
        for (const [key, bucket] of store.entries()) {
            if (now - bucket.lastRefill > maxAge) {
                store.delete(key);
            }
        }
    }
}
// Get rate limit stats (for monitoring)
export function getRateLimitStats() {
    const now = Date.now();
    const stats = {
        totalBuckets: 0,
        activeBuckets: 0,
        oldestBucket: now,
        newestBucket: 0,
    };
    for (const store of bucketStores) {
        stats.totalBuckets += store.size;
        for (const bucket of store.values()) {
            if (bucket.tokens < DEFAULT_CONFIGS.default.maxRequests) {
                stats.activeBuckets++;
            }
            stats.oldestBucket = Math.min(stats.oldestBucket, bucket.lastRefill);
            stats.newestBucket = Math.max(stats.newestBucket, bucket.lastRefill);
        }
    }
    return stats;
}
// Test-only helper to introspect and mutate bucket state.
export function __getRateLimitStoresForTests() {
    return Array.from(bucketStores);
}
// Start cleanup interval (should be called when app starts)
export function startCleanupInterval(intervalMs = 300000) {
    // 5 minutes
    globalThis.setInterval(cleanupBuckets, intervalMs);
}
//# sourceMappingURL=rate-limiting.js.map