import base from '../../vitest.config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    setupFiles: ['../../tests/setup.ts'],
  },
});
