/**
 * Test utilities for rate limiting tests
 * Provides mock Fastify request and response objects
 */

import { vi } from 'vitest';

// Mock Fastify request interface
export interface MockFastifyRequest {
  id?: string;
  ip: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
}

// Mock Fastify reply interface
export interface MockFastifyReply {
  statusCode: number;
  status: (code: number) => MockFastifyReply;
  send: (data: any) => void;
  header: (name: string, value: string) => MockFastifyReply;
  headers: Record<string, string>;
}

// Create a mock Fastify request
export function createMockRequest(overrides: Partial<MockFastifyRequest> = {}): MockFastifyRequest {
  return {
    id: overrides.id ?? 'mock-request-id',
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
export function createMockReply(): MockFastifyReply {
  const headers: Record<string, string> = {};
  let statusCode = 200;

  const mockReply: MockFastifyReply = {
    statusCode,
    status: vi.fn((code: number) => {
      statusCode = code;
      return mockReply;
    }),
    send: vi.fn(),
    header: vi.fn((name: string, value: string) => {
      headers[name] = value;
      return mockReply;
    }),
    headers,
  };

  return mockReply;
}

// Create a mock reply with specific status code
export function createMockReplyWithStatus(statusCode: number): MockFastifyReply {
  const reply = createMockReply();
  reply.statusCode = statusCode;
  return reply;
}

// Helper to create requests with different IPs
export function createRequestFromIP(ip: string, overrides: Partial<MockFastifyRequest> = {}): MockFastifyRequest {
  return createMockRequest({ ip, ...overrides });
}

// Helper to create requests with different user agents
export function createRequestWithUserAgent(userAgent: string, overrides: Partial<MockFastifyRequest> = {}): MockFastifyRequest {
  return createMockRequest({
    headers: { 'user-agent': userAgent },
    ...overrides,
  });
}

// Helper to create requests with different methods
export function createRequestWithMethod(method: string, overrides: Partial<MockFastifyRequest> = {}): MockFastifyRequest {
  return createMockRequest({ method, ...overrides });
}

// Helper to create requests with different URLs
export function createRequestWithUrl(url: string, overrides: Partial<MockFastifyRequest> = {}): MockFastifyRequest {
  return createMockRequest({ url, ...overrides });
}
