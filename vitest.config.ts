/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Force thread pool by default to avoid sandbox restrictions with process signals.
    // Can be overridden via env: VITEST_POOL=vmThreads|forks|threads
    pool: (process.env.VITEST_POOL as any) || 'threads',
    poolOptions: {
      threads: {
        // Allow tuning via env to reduce worker management if needed in CI/sandboxes.
        minThreads: Number(process.env.VITEST_MIN_THREADS || 1),
        maxThreads: Number(process.env.VITEST_MAX_THREADS || 1),
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
    },
  },
  esbuild: {
    target: 'node18',
  },
});
