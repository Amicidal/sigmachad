/**
 * Rate Limiting Middleware for API Requests
 * Implements token bucket algorithm for rate limiting
 */
import { FastifyRequest, FastifyReply } from 'fastify';
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare function createRateLimit(config?: Partial<RateLimitConfig>): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const searchRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const adminRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const defaultRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const strictRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function cleanupBuckets(): void;
export declare function getRateLimitStats(): {
    totalBuckets: number;
    activeBuckets: number;
    oldestBucket: number;
    newestBucket: number;
};
export declare function startCleanupInterval(intervalMs?: number): void;
export {};
//# sourceMappingURL=rate-limiting.d.ts.map