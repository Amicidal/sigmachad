/**
 * Test setup file for Vitest
 * Configures global test environment
 */
import { afterAll, vi } from 'vitest';
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
//# sourceMappingURL=setup.js.map