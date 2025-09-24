import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'e2e',
    environment: 'node',
    timeout: 60000, // 60 seconds for E2E tests
    testTimeout: 60000,
    hookTimeout: 30000,
    globals: true,
    setupFiles: ['./setup.ts'],
    teardownTimeout: 30000,
    sequence: {
      concurrent: false, // Run E2E tests sequentially to avoid conflicts
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for E2E tests
      },
    },
    coverage: {
      enabled: false, // Coverage not meaningful for E2E tests
    },
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
    },
  },
  resolve: {
    alias: {
      '@memento/core': path.resolve(__dirname, '../../packages/core/src'),
      '@memento/api': path.resolve(__dirname, '../../packages/api/src'),
      '@memento/database': path.resolve(__dirname, '../../packages/database/src'),
      '@memento/knowledge': path.resolve(__dirname, '../../packages/knowledge/src'),
      '@memento/testing': path.resolve(__dirname, '../../packages/testing/src'),
      '@memento/sync': path.resolve(__dirname, '../../packages/sync/src'),
    },
  },
});