import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import maxDepthRule from './scripts/eslint-rules/max-depth-rule.js';
import noCrossPackageTypeImports from './scripts/eslint-rules/no-cross-package-type-imports.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        // No global `project` here; per-package/app overrides set it.
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        require: 'readonly',
        module: 'readonly',
        // Node 18+ globals used across TS code
        URL: 'readonly',
        AbortController: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security,
      custom: {
        rules: {
          'max-depth': maxDepthRule,
          'no-cross-package-type-imports': noCrossPackageTypeImports,
        },
      },
    },
    rules: {
      // Custom directory structure rules
      'custom/max-depth': [
        'error',
        {
          targetDepth: 3,
          warnDepth: 4,
          maxDepth: 5,
          ignorePaths: ['node_modules', 'dist', 'coverage', '.git', '.husky'],
          complexDomains: [
            'services/knowledge',
            'services/testing',
            'api/trpc',
            'services/synchronization',
          ],
        },
      ],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'error',

      // General code quality
      'no-console': 'off', // We use console for logging
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',

      // Import/export
      'no-unused-vars': 'off', // Handled by TypeScript
      // Disable core no-undef for TS; TS handles undefined identifiers/types
      'no-undef': 'off',
    },
  },
  // Ensure Node 18 globals are recognized in JS too (keep no-undef enabled in JS)
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        AbortController: 'readonly',
      },
    },
  },
  {
    files: ['packages/agents/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/agents/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/api/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/api/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/backup/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/backup/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/core/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/core/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/graph/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/graph/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/jobs/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/jobs/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/knowledge/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/knowledge/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/parser/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/parser/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/sync/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/sync/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/utils/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/utils/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  // App overrides
  {
    files: ['apps/main/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './apps/main/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['apps/mcp-server/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './apps/mcp-server/tsconfig.app.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './apps/web/tsconfig.app.json',
        tsconfigRootDir: rootDir,
      },
    },
  },
  {
    files: ['packages/**/*.ts'],
    rules: {
      'custom/no-cross-package-type-imports': [
        'error',
        {
          allow: ['@memento/shared-types'],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../../../*',
                '../../../**',
                '../../../../*',
                '../../../../**',
                '../../../../../*',
                '../../../../../**',
              ],
              message:
                'Use @memento/* aliases or package entry points instead of imports with three or more ../ segments.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__tests__/**/*.ts',
      'tests/**/*.ts',
    ],
    languageOptions: {
      parser: tsparser,
      // Avoid a project-based parser for tests to prevent tsconfig exclusion issues.
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-object-injection': 'off', // Common in tests
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['packages/shared-types/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/shared-types/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable object injection detection for shared types since they only contain type definitions
      'security/detect-object-injection': 'off',
      // Shared types are declaration-only; allow unused exports/imports
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['packages/database/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/database/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable object injection rule in database adapters (keys validated upstream)
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['packages/testing/src/**/*.ts'],
    ignores: ['packages/testing/src/security/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/testing/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Testing helpers can perform meta-programming; disable this rule here
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['packages/testing/src/security/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      // The package tsconfig explicitly excludes security tooling; do not use a project here.
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['packages/knowledge/scripts/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      // Do not set a project here; the package tsconfig excludes scripts.
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Disable object injection detection for knowledge scripts to reduce false positives
      'security/detect-object-injection': 'warn',
    },
  },
  {
    files: ['packages/knowledge/src/ingestion/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/knowledge/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      // Temporarily disable object-injection detection in ingestion glue.
      // These files are adapters; upstream sanitization applies. See task 15.
      'security/detect-object-injection': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '**/*.d.ts',
      'eslint.config.js',
      'tests/setup.ts',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
];
