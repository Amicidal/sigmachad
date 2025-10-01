/**
 * Test setup file for Vitest
 * Configures global test environment
 */

import { afterAll, afterEach, beforeAll, vi, expect } from 'vitest';

// Offline safeguards for unit tests: prevent accidental network/service calls
// If RUN_INTEGRATION=1 is not set, provide lightweight module mocks for
// external services that otherwise attempt real connections.
if (process.env.RUN_INTEGRATION !== '1') {
  // Mock neo4j-driver used by knowledge/database layers
  vi.mock('neo4j-driver', () => {
    const mockNeo4j = {
      auth: { basic: vi.fn(() => ({})) },
      driver: vi.fn(() => ({
        session: vi.fn(() => {
          const tx = {
            run: vi.fn(async () => ({ records: [] })),
            commit: vi.fn(async () => undefined),
            rollback: vi.fn(async () => undefined),
          };
          return {
            run: vi.fn(async () => ({ records: [] })),
            beginTransaction: vi.fn(() => tx),
            close: vi.fn(async () => undefined),
          };
        }),
        close: vi.fn(async () => undefined),
      })),
      session: { WRITE: 'WRITE', READ: 'READ' },
    } as const;
    return {
      default: mockNeo4j,
      ...mockNeo4j,
    };
  });

  // Mock Qdrant REST client to keep vector operations offline by default
  vi.mock('@qdrant/js-client-rest', () => ({
    QdrantClient: vi.fn().mockImplementation((_cfg?: any) => ({
      getCollections: vi.fn(async () => ({ collections: [] })),
      createCollection: vi.fn(async () => ({ result: 'created' })),
      deleteCollection: vi.fn(async () => ({ result: 'deleted' })),
      upsert: vi.fn(async () => ({ result: { points_count: 0 } })),
      search: vi.fn(async () => []),
      scroll: vi.fn(async () => ({ points: [] })),
      delete: vi.fn(async () => ({ result: 'deleted' })),
      deletePoints: vi.fn(async () => ({ result: 'deleted' })),
      updateCollection: vi.fn(async () => ({})),
      getCollection: vi.fn(async () => ({})),
    })),
  }));
}

// Clean up all mocks after tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to wait for promises
  waitForPromises: () => new Promise(resolve => setImmediate(resolve)),

  // Helper to create mock functions
  mockFn: vi.fn,

  // Helper to spy on functions
  spyOn: vi.spyOn,
  
  // Helper for tests that need fake timers (opt-in, not global)
  useFakeTimers: () => {
    vi.useFakeTimers();
    return {
      advanceTime: (ms: number) => vi.advanceTimersByTime(ms),
      restore: () => vi.useRealTimers()
    };
  }
};

// Generic async wait utilities for tests
// - sleep: simple delay
// - waitFor: poll until condition returns truthy or timeout
// These avoid scattering ad-hoc setTimeout sleeps in tests.
(global as any).testUtils.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
(global as any).testUtils.waitFor = async (
  check: () => boolean | Promise<boolean>,
  opts: { timeout?: number; interval?: number } = {}
) => {
  const timeout = opts.timeout ?? 2000;
  const interval = opts.interval ?? 20;
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Await the predicate in case it’s async
    // If it throws, treat as falsy and keep polling
    try {
      if (await check()) return;
    } catch {
      // ignore and keep waiting
    }
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise(r => setTimeout(r, interval));
  }
};

// Wait until a condition stays false for the entire timeout window.
// If the condition ever returns true during the window, throws immediately.
(global as any).testUtils.waitForNot = async (
  check: () => boolean | Promise<boolean>,
  opts: { timeout?: number; interval?: number } = {}
) => {
  const timeout = opts.timeout ?? 300;
  const interval = opts.interval ?? 20;
  const start = Date.now();
  while (Date.now() - start <= timeout) {
    try {
      if (await check()) {
        throw new Error('waitForNot condition became true');
      }
    } catch (err) {
      // If check throws, treat as truthy to be safe and rethrow
      throw err instanceof Error ? err : new Error('waitForNot condition threw');
    }
    await new Promise(r => setTimeout(r, interval));
  }
};

// Deterministic RNG for tests to avoid flakiness
// Simple LCG seeded via TEST_SEED (default 1). Opt out by setting DISABLE_TEST_RANDOM_SEED=1
let originalMathRandom: (() => number) | undefined;
let rngState = 1 >>> 0;
function seededRng(): number {
  rngState = (1664525 * rngState + 1013904223) >>> 0;
  return (rngState >>> 8) / 0x01000000; // [0,1)
}

beforeAll(() => {
  if (process.env.DISABLE_TEST_RANDOM_SEED !== '1') {
    const seed = parseInt(process.env.TEST_SEED || '1', 10);
    rngState = (isNaN(seed) ? 1 : seed) >>> 0;
    originalMathRandom = Math.random;
    // @ts-ignore override for tests
    Math.random = seededRng;
  }
});

afterAll(() => {
  if (originalMathRandom) {
    // Restore original Math.random
    // @ts-ignore restore for tests
    Math.random = originalMathRandom;
    originalMathRandom = undefined;
  }
});

// Enforce: any test with zero assertions should fail
afterEach(() => {
  const state = (expect as any)?.getState?.();
  if (state && state.assertionCalls === 0 && state.currentTestName) {
    throw new Error(`Test had zero assertions: ${state.currentTestName}`);
  }
});
