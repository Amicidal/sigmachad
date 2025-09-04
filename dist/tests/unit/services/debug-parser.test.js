/**
 * Debug test for ASTParser to understand what it actually produces
 */
import { describe, it, expect } from 'vitest';
import { ASTParser } from '@/services/ASTParser';
import path from 'path';
describe('ASTParser Debug', () => {
    it('should debug incremental parsing', async () => {
        const parser = new ASTParser();
        await parser.initialize();
        const testFilesDir = path.join(__dirname, 'ast-parser');
        const filePath = path.join(testFilesDir, 'sample-class.ts');
        console.log('=== First parse ===');
        const result1 = await parser.parseFileIncremental(filePath);
        console.log('isIncremental:', result1.isIncremental);
        console.log('Cache stats:', parser.getCacheStats());
        console.log('=== Modifying file ===');
        const fs = require('fs/promises');
        const originalContent = await fs.readFile(filePath, 'utf-8');
        const modifiedContent = originalContent + '\n// Test modification';
        await fs.writeFile(filePath, modifiedContent);
        console.log('=== Second parse (should detect changes) ===');
        const result2 = await parser.parseFileIncremental(filePath);
        console.log('isIncremental:', result2.isIncremental);
        console.log('Cache stats:', parser.getCacheStats());
        console.log('=== Restoring file ===');
        await fs.writeFile(filePath, originalContent);
        // Test expectations
        expect(result1.isIncremental).toBe(false); // First parse should not be incremental
        expect(result2.isIncremental).toBe(false); // Second parse should detect changes and not be incremental
    });
});
//# sourceMappingURL=debug-parser.test.js.map