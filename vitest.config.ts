/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import os from 'node:os';

const cpuCount = os.cpus()?.length ?? 1;
const defaultMaxThreads = cpuCount > 1 ? Math.min(cpuCount, 4) : 1;
const defaultMinThreads = cpuCount > 1 ? Math.min(2, defaultMaxThreads) : 1;

export default defineConfig({
  test: {
    // Force thread pool by default to avoid sandbox restrictions with process signals.
    // Can be overridden via env: VITEST_POOL=vmThreads|forks|threads
    pool: (process.env.VITEST_POOL as any) || 'threads',
    poolOptions: {
      threads: {
        // Allow tuning via env to reduce worker management if needed in CI/sandboxes.
        minThreads: Number(
          process.env.VITEST_MIN_THREADS || defaultMinThreads
        ),
        maxThreads: Number(
          process.env.VITEST_MAX_THREADS || defaultMaxThreads
        ),
      },
    },
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    // Disallow focused tests (e.g., .only) in all environments
    allowOnly: false,
    globals: true, // Enable global test functions like describe, it, expect
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      ...(process.env.RUN_INTEGRATION === '1' ? [] : ['tests/integration/**'])
    ],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,js}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,js}',
        'src/**/*.spec.{ts,js}',
        'src/**/__tests__/**',
        'src/index.ts'
      ],
      all: true, // Include all files to identify untested code
      reportOnFailure: true, // Generate coverage report even when tests fail
      thresholds: {
        global: {
          statements: 75,
          branches: 70,
          functions: 80,
          lines: 75
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/api': resolve(__dirname, './src/api'),
      '@/services': resolve(__dirname, './src/services'),
      '@/models': resolve(__dirname, './src/models'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@memento/agents': resolve(__dirname, './packages/agents/src'),
      '@memento/api': resolve(__dirname, './packages/api/src'),
      '@memento/backup': resolve(__dirname, './packages/backup/src'),
      '@memento/core': resolve(__dirname, './packages/core/src'),
      '@memento/database': resolve(__dirname, './packages/database/src'),
      '@memento/graph': resolve(__dirname, './packages/graph/src'),
      '@memento/jobs': resolve(__dirname, './packages/jobs/src'),
      '@memento/main': resolve(__dirname, './apps/main/src'),
      '@memento/main/*': resolve(__dirname, './apps/main/src/*'),
      '@memento/knowledge': resolve(__dirname, './packages/knowledge/src'),
      '@memento/parser': resolve(__dirname, './packages/parser/src'),
      '@memento/shared-types': resolve(__dirname, './packages/shared-types/src'),
      '@memento/sync': resolve(__dirname, './packages/sync/src'),
      '@memento/testing': resolve(__dirname, './packages/testing/src'),
      '@memento/utils': resolve(__dirname, './packages/utils/src'),
    },
  },
  esbuild: {
    target: 'node18',
  },
});
