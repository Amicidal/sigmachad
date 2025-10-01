import { defineConfig } from 'vitest/config';
import path from 'path';

const packagesRoot = path.resolve(__dirname, '..', '..', '..');
const knowledgeRoot = path.resolve(__dirname, '..', '..');

export default defineConfig({
  test: {
    name: 'advanced-e2e',
    environment: 'node',
    timeout: 300000, // 5 minutes for advanced tests
    testTimeout: 300000,
    hookTimeout: 60000,
    globals: true,
    setupFiles: ['./setup.ts', './utils/test-reliability.ts'],
    teardownTimeout: 60000,

    // Advanced parallelization configuration
    sequence: {
      concurrent: process.env.PARALLEL_E2E === 'true',
      shuffle: process.env.SHUFFLE_TESTS === 'true',
    },

    // Pool configuration for optimal resource usage
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: process.env.SINGLE_FORK === 'true',
        minForks: process.env.MIN_FORKS ? parseInt(process.env.MIN_FORKS) : 1,
        maxForks: process.env.MAX_FORKS ? parseInt(process.env.MAX_FORKS) :
                  Math.min(4, Math.max(1, Math.floor(require('os').cpus().length / 2))),
        isolate: true,
      },
    },

    // File patterns for advanced E2E tests
    include: [
      'packages/knowledge/tests/e2e/advanced/**/*.test.ts',
      'tests/e2e/advanced/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      '**/coverage/**',
    ],

    // Coverage configuration (disabled for E2E by default)
    coverage: {
      enabled: process.env.E2E_COVERAGE === 'true',
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.test.ts',
        '**/*.config.*',
      ],
    },

    // Retry configuration for flaky tests
    retry: process.env.CI ? 2 : 0,

    // Environment variables
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: process.env.LOG_LEVEL || 'error',

      // Test mode configuration
      QUICK_MODE: process.env.QUICK_MODE || 'false',
      COMPREHENSIVE: process.env.COMPREHENSIVE || 'false',
      BENCHMARK: process.env.BENCHMARK || 'false',

      // Test-specific timeouts
      CHAOS_DURATION: process.env.CHAOS_DURATION || '30000',
      MIGRATION_DATASET_SIZE: process.env.MIGRATION_DATASET_SIZE || '1000',
      PERFORMANCE_THRESHOLD: process.env.PERFORMANCE_THRESHOLD || '1000',

      // Database connections (E2E test ports)
      NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7688',
      NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'neo4j',
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'password',

      POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
      POSTGRES_PORT: process.env.POSTGRES_PORT || '5434',
      POSTGRES_DB: process.env.POSTGRES_DB || 'memento_test',
      POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'password',

      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: process.env.REDIS_PORT || '6382',

      QDRANT_HOST: process.env.QDRANT_HOST || 'localhost',
      QDRANT_PORT: process.env.QDRANT_PORT || '6334',
    },

    // Reporter configuration
    reporter: process.env.CI ? ['default', 'junit', 'json'] : ['verbose'],
    outputFile: {
      junit: './logs/advanced-e2e-results.xml',
      json: './logs/advanced-e2e-results.json',
    },

    // Resource management
    logHeapUsage: true,
    allowOnly: !process.env.CI,
    passWithNoTests: false,

    // Test filtering based on environment
    testNamePattern: process.env.TEST_PATTERN ? new RegExp(process.env.TEST_PATTERN) : undefined,
  },

  resolve: {
    alias: {
      '@memento/core': path.resolve(packagesRoot, 'core/src'),
      '@memento/api': path.resolve(packagesRoot, 'api/src'),
      '@memento/database': path.resolve(packagesRoot, 'database/src'),
      '@memento/knowledge': path.resolve(knowledgeRoot, 'src'),
      '@memento/testing': path.resolve(packagesRoot, 'testing/src'),
      '@memento/sync': path.resolve(packagesRoot, 'sync/src'),
      '@e2e-utils': path.resolve(__dirname, './utils'),
    },
  },

  // Vite-specific optimizations for E2E tests
  esbuild: {
    target: 'node18',
    platform: 'node',
  },

  // Define constants for different test modes
  define: {
    __TEST_MODE__: JSON.stringify(process.env.NODE_ENV === 'test'),
    __QUICK_MODE__: JSON.stringify(process.env.QUICK_MODE === 'true'),
    __COMPREHENSIVE_MODE__: JSON.stringify(process.env.COMPREHENSIVE === 'true'),
    __BENCHMARK_MODE__: JSON.stringify(process.env.BENCHMARK === 'true'),
    __CI_MODE__: JSON.stringify(!!process.env.CI),
  },
});

// Export additional configurations for different scenarios
export const quickConfig = defineConfig({
  ...require('./vitest.config.advanced.ts').default,
  test: {
    ...require('./vitest.config.advanced.ts').default.test,
    timeout: 60000, // 1 minute for quick tests
    testTimeout: 60000,
    env: {
      ...require('./vitest.config.advanced.ts').default.test.env,
      QUICK_MODE: 'true',
      CHAOS_DURATION: '10000',
      MIGRATION_DATASET_SIZE: '100',
      PERFORMANCE_THRESHOLD: '2000',
    },
  },
});

export const comprehensiveConfig = defineConfig({
  ...require('./vitest.config.advanced.ts').default,
  test: {
    ...require('./vitest.config.advanced.ts').default.test,
    timeout: 600000, // 10 minutes for comprehensive tests
    testTimeout: 600000,
    env: {
      ...require('./vitest.config.advanced.ts').default.test.env,
      COMPREHENSIVE: 'true',
      CHAOS_DURATION: '120000',
      MIGRATION_DATASET_SIZE: '10000',
      PERFORMANCE_THRESHOLD: '500',
    },
  },
});

export const benchmarkConfig = defineConfig({
  ...require('./vitest.config.advanced.ts').default,
  test: {
    ...require('./vitest.config.advanced.ts').default.test,
    timeout: 900000, // 15 minutes for benchmark tests
    testTimeout: 900000,
    sequence: {
      concurrent: false, // Run benchmarks sequentially
    },
    env: {
      ...require('./vitest.config.advanced.ts').default.test.env,
      BENCHMARK: 'true',
      PERFORMANCE_THRESHOLD: '200',
    },
  },
});
