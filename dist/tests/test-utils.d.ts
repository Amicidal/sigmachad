/**
 * Test utilities for rate limiting tests
 * Provides mock Fastify request and response objects
 */
export interface MockFastifyRequest {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    query?: any;
    params?: any;
}
export interface MockFastifyReply {
    statusCode: number;
    status: (code: number) => MockFastifyReply;
    send: (data: any) => void;
    header: (name: string, value: string) => void;
    headers: Record<string, string>;
}
export declare function createMockRequest(overrides?: Partial<MockFastifyRequest>): MockFastifyRequest;
export declare function createMockReply(): MockFastifyReply;
export declare function createMockReplyWithStatus(statusCode: number): MockFastifyReply;
export declare function createRequestFromIP(ip: string, overrides?: Partial<MockFastifyRequest>): MockFastifyRequest;
export declare function createRequestWithUserAgent(userAgent: string, overrides?: Partial<MockFastifyRequest>): MockFastifyRequest;
export declare function createRequestWithMethod(method: string, overrides?: Partial<MockFastifyRequest>): MockFastifyRequest;
export declare function createRequestWithUrl(url: string, overrides?: Partial<MockFastifyRequest>): MockFastifyRequest;
//# sourceMappingURL=test-utils.d.ts.map