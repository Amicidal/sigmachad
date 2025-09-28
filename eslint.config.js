import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import maxDepthRule from './scripts/eslint-rules/max-depth-rule.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
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
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security,
      custom: {
        rules: {
          'max-depth': maxDepthRule,
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
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
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
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.test.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-object-injection': 'off', // Common in tests
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
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable object injection detection for shared types since they only contain type definitions
      'security/detect-object-injection': 'off',
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
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable overly strict object injection detection for database operations
      'security/detect-object-injection': 'warn',
    },
  },
  {
    files: ['packages/testing/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/testing/tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable overly strict object injection detection for testing utilities
      'security/detect-object-injection': 'warn',
    },
  },
  {
    files: ['packages/knowledge/scripts/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './packages/knowledge/tsconfig.json',
      },
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
