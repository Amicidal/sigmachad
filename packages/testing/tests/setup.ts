/**
 * @file setup.ts
 * @description Test setup configuration for temporal tracking tests
 */

import { vi } from 'vitest';

// Mock external dependencies that might not be available in test environment
vi.mock('@memento/database', () => ({
  DatabaseService: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ affectedRows: 1 }),
    query: vi.fn().mockResolvedValue([]),
    transaction: vi.fn().mockImplementation((fn) => fn())
  }))
}));

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: vi.fn(),
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Set test timeout
const DEFAULT_TIMEOUT = 10000;

export { DEFAULT_TIMEOUT };