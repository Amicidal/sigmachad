import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture hSet payloads from the mocked Redis client
const calls: {
  hSet: Array<{ key: string; data: Record<string, string | number> }>;
  existKeys: string[];
} = { hSet: [], existKeys: [] };

// Minimal Redis client stub used by the mocked pool
const presentKeys = new Set<string>();
const clientStub = {
  async exists(key: string) {
    calls.existKeys.push(key);
    return presentKeys.has(key) ? 1 : 0;
  },
  async hSet(key: string, data: Record<string, string | number>) {
    calls.hSet.push({ key, data });
    presentKeys.add(key);
    return 1;
  },
  async expire() {
    return 1;
  },
  async zAdd() {
    return 1;
  },
  async zRange() {
    return [] as string[];
  },
  async hGetAll() {
    return {} as Record<string, string>;
  },
  async del() {
    // naive cleanup for existence checks
    for (const k of Array.from(presentKeys.keys())) {
      presentKeys.delete(k);
    }
    return 1;
  },
};

// Mock the connection pool used by EnhancedSessionStore to inject the stub client
vi.mock('@memento/core/services/RedisConnectionPool.js', () => {
  class RedisConnectionPool {
    constructor() {}
    async execute<T>(fn: (client: typeof clientStub) => Promise<T>) {
      return fn(clientStub);
    }
    getStats() {
      return {} as any;
    }
    getStatus() {
      return { isHealthy: true } as any;
    }
    async shutdown() {}
  }
  return { RedisConnectionPool };
});

// Import after mocks are in place
import { EnhancedSessionStore } from '@memento/core/services/EnhancedSessionStore';

describe('EnhancedSessionStore dynamic hash builders', () => {
  beforeEach(() => {
    calls.hSet.length = 0;
    calls.existKeys.length = 0;
  });

  it('creates session without undefined fields in hSet payload', async () => {
    const store = new EnhancedSessionStore({
      redis: { url: 'redis://localhost' } as any,
      pool: { minConnections: 0 } as any,
      // Force immediate batch processing
      batchSize: 1,
    } as any);

    await store.createSession('s-1', 'agent-A', { ttl: 60 });

    const createCall = calls.hSet.find((c) => c.key.startsWith('session:'));
    expect(createCall).toBeTruthy();
    const payload = createCall!.data;
    expect(Object.keys(payload).sort()).toEqual(['agentIds', 'events', 'state']);
    // Ensure no undefined sneaks in
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });

  it('updates session with only provided fields', async () => {
    const store = new EnhancedSessionStore({
      redis: { url: 'redis://localhost' } as any,
      pool: { minConnections: 0 } as any,
      batchSize: 1,
    } as any);

    // Create first so update path passes the existence check
    await store.createSession('s-2', 'agent-X', { ttl: 60 });

    await store.updateSession('s-2', {
      state: 'working' as any,
      agentIds: ['A', 'B'],
      metadata: { foo: 'bar' },
    });

    const updateCall = calls.hSet
      .filter((c) => c.key === 'session:s-2')
      .slice(-1)[0];
    expect(updateCall).toBeTruthy();
    const payload = updateCall!.data;
    expect(Object.keys(payload).sort()).toEqual(['agentIds', 'metadata', 'state']);
    expect(payload.state).toBe('working');
    expect(typeof payload.metadata).toBe('string'); // serialized
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });
});
