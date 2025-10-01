import base from '../../vitest.config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    // Point to the repo-level setup file from package context
    setupFiles: ['../../tests/setup.ts'],
  },
});
