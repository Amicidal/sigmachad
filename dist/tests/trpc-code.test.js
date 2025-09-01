/**
 * tRPC Code Router Tests
 * Tests the code router procedures
 */
import { describe, it, expect } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
describe('Code tRPC Router', () => {
    describe('File Structure', () => {
        it('should have code router file', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const exists = await fs.access(codeRouterPath).then(() => true).catch(() => false);
            expect(exists).toBe(true);
        });
        it('should have proper file extension', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const stat = await fs.stat(codeRouterPath);
            expect(stat.isFile()).toBe(true);
        });
    });
    describe('Module Structure', () => {
        it('should export codeRouter', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const content = await fs.readFile(codeRouterPath, 'utf-8');
            expect(content).toContain('export');
            expect(content).toContain('codeRouter');
            expect(content).toContain('router(');
        });
        it('should have router definition', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const content = await fs.readFile(codeRouterPath, 'utf-8');
            expect(content).toContain('router({');
            expect(content).toContain('})');
        });
        it('should have code-related procedures', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const content = await fs.readFile(codeRouterPath, 'utf-8');
            // Check for common code-related procedures
            expect(content).toContain('publicProcedure');
        });
    });
    describe('Procedure Definitions', () => {
        it('should have procedures defined', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const content = await fs.readFile(codeRouterPath, 'utf-8');
            expect(content).toContain('publicProcedure');
            expect(content).toContain('query');
        });
        it('should be properly structured for tRPC', async () => {
            const codeRouterPath = path.join(process.cwd(), 'src/api/trpc/routes/code.ts');
            const content = await fs.readFile(codeRouterPath, 'utf-8');
            expect(content).toContain('router({');
            expect(content).toContain('})');
        });
    });
});
//# sourceMappingURL=trpc-code.test.js.map