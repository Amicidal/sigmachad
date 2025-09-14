import { defineConfig } from 'vite';

// Ensure built asset URLs are served under /ui/graph/
export default defineConfig({
  base: '/ui/graph/',
});

