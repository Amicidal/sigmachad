/**
 * Test utilities for rate limiting tests
 * Provides mock Fastify request and response objects
 */
import { vi } from 'vitest';
// Create a mock Fastify request
export function createMockRequest(overrides = {}) {
    return {
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test',
        headers: {
            'user-agent': 'test-agent',
            ...overrides.headers,
        },
        ...overrides,
    };
}
// Create a mock Fastify reply
export function createMockReply() {
    const headers = {};
    let statusCode = 200;
    const mockReply = {
        statusCode,
        status: vi.fn((code) => {
            statusCode = code;
            return mockReply;
        }),
        send: vi.fn(),
        header: vi.fn((name, value) => {
            headers[name] = value;
        }),
        headers,
    };
    return mockReply;
}
// Create a mock reply with specific status code
export function createMockReplyWithStatus(statusCode) {
    const reply = createMockReply();
    reply.statusCode = statusCode;
    return reply;
}
// Helper to create requests with different IPs
export function createRequestFromIP(ip, overrides = {}) {
    return createMockRequest({ ip, ...overrides });
}
// Helper to create requests with different user agents
export function createRequestWithUserAgent(userAgent, overrides = {}) {
    return createMockRequest({
        headers: { 'user-agent': userAgent },
        ...overrides,
    });
}
// Helper to create requests with different methods
export function createRequestWithMethod(method, overrides = {}) {
    return createMockRequest({ method, ...overrides });
}
// Helper to create requests with different URLs
export function createRequestWithUrl(url, overrides = {}) {
    return createMockRequest({ url, ...overrides });
}
//# sourceMappingURL=test-utils.js.map