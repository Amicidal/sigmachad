export default [
  {
    files: ['packages/**/*.{ts,tsx,js,jsx}', 'apps/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Cognitive Complexity - max 15
      complexity: ['error', 10],

      // Basic code quality rules
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-empty': 'warn',
      'no-debugger': 'error',
    },
  },
];
