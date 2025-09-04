/**
 * Test setup file for Vitest
 * Configures global test environment
 */

import { afterAll, afterEach, beforeAll, vi, expect } from 'vitest';

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

// Soft assertion guardrail: warn when a test has zero assertions
afterEach(() => {
  const state = (expect as any)?.getState?.();
  if (state && state.assertionCalls === 0 && state.currentTestName) {
    // eslint-disable-next-line no-console
    console.warn(`[warn] Test had zero assertions: ${state.currentTestName}`);
  }
});
