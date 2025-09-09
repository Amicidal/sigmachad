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
            advanceTime: (ms) => vi.advanceTimersByTime(ms),
            restore: () => vi.useRealTimers()
        };
    }
};
// Generic async wait utilities for tests
// - sleep: simple delay
// - waitFor: poll until condition returns truthy or timeout
// These avoid scattering ad-hoc setTimeout sleeps in tests.
global.testUtils.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.testUtils.waitFor = async (check, opts = {}) => {
    const timeout = opts.timeout ?? 2000;
    const interval = opts.interval ?? 20;
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // Await the predicate in case it’s async
        // If it throws, treat as falsy and keep polling
        try {
            if (await check())
                return;
        }
        catch {
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
global.testUtils.waitForNot = async (check, opts = {}) => {
    const timeout = opts.timeout ?? 300;
    const interval = opts.interval ?? 20;
    const start = Date.now();
    while (Date.now() - start <= timeout) {
        try {
            if (await check()) {
                throw new Error('waitForNot condition became true');
            }
        }
        catch (err) {
            // If check throws, treat as truthy to be safe and rethrow
            throw err instanceof Error ? err : new Error('waitForNot condition threw');
        }
        await new Promise(r => setTimeout(r, interval));
    }
};
// Deterministic RNG for tests to avoid flakiness
// Simple LCG seeded via TEST_SEED (default 1). Opt out by setting DISABLE_TEST_RANDOM_SEED=1
let originalMathRandom;
let rngState = 1 >>> 0;
function seededRng() {
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
    const state = expect?.getState?.();
    const isIntegration = process.env.RUN_INTEGRATION === '1';
    if (!isIntegration && state && state.assertionCalls === 0 && state.currentTestName) {
        throw new Error(`Test had zero assertions: ${state.currentTestName}`);
    }
    // In integration runs, only warn to avoid failing tests designed as smoke checks
    if (isIntegration && state && state.assertionCalls === 0 && state.currentTestName) {
        // eslint-disable-next-line no-console
        console.warn(`Warning: Test had zero assertions: ${state.currentTestName}`);
    }
});
//# sourceMappingURL=setup.js.map