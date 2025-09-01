/**
 * tRPC Graph Router Tests
 * Tests the graph router procedures
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

describe('Graph tRPC Router', () => {
  describe('File Structure', () => {
    it('should have graph router file', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const exists = await fs.access(graphRouterPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have proper file extension', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const stat = await fs.stat(graphRouterPath);
      expect(stat.isFile()).toBe(true);
    });
  });

  describe('Module Structure', () => {
    it('should export graphRouter', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const content = await fs.readFile(graphRouterPath, 'utf-8');

      expect(content).toContain('export');
      expect(content).toContain('graphRouter');
      expect(content).toContain('router(');
    });

    it('should have router definition', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const content = await fs.readFile(graphRouterPath, 'utf-8');

      expect(content).toContain('router({');
      expect(content).toContain('})');
    });

    it('should have graph-related procedures', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const content = await fs.readFile(graphRouterPath, 'utf-8');

      expect(content).toContain('publicProcedure');
    });
  });

  describe('Procedure Definitions', () => {
    it('should have procedures defined', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const content = await fs.readFile(graphRouterPath, 'utf-8');

      expect(content).toContain('publicProcedure');
      expect(content).toContain('query');
    });

    it('should be properly structured for tRPC', async () => {
      const graphRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/graph.ts');
      const content = await fs.readFile(graphRouterPath, 'utf-8');

      expect(content).toContain('router({');
      expect(content).toContain('})');
    });
  });
});
