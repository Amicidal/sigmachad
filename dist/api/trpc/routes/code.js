/**
 * Code Analysis tRPC Routes
 * Type-safe procedures for code analysis and refactoring
 */
import { z } from 'zod';
import { router, publicProcedure } from '../base.js';
import { TRPCError } from '@trpc/server';
export const codeRouter = router({
    // Analyze code and get suggestions
    analyze: publicProcedure
        .input(z.object({
        file: z.string(),
        lineStart: z.number().optional(),
        lineEnd: z.number().optional(),
        types: z.array(z.string()).optional(),
    }))
        .query(async ({ input, ctx }) => {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Static code analysis is not available in this build.' });
    }),
    // Get refactoring suggestions
    refactor: publicProcedure
        .input(z.object({
        files: z.array(z.string()),
        refactorType: z.string(),
        options: z.record(z.any()).optional(),
    }))
        .query(async ({ input, ctx }) => {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Refactoring suggestions are not available in this build.' });
    }),
    // Parse and analyze file
    parseFile: publicProcedure
        .input(z.object({
        filePath: z.string(),
    }))
        .query(async ({ input, ctx }) => {
        const result = await ctx.astParser.parseFile(input.filePath);
        return result;
    }),
    // Get symbols from file
    getSymbols: publicProcedure
        .input(z.object({
        filePath: z.string(),
        symbolType: z.enum(['function', 'class', 'interface', 'typeAlias']).optional(),
    }))
        .query(async ({ input, ctx }) => {
        const result = await ctx.astParser.parseFile(input.filePath);
        let symbols = result.entities;
        if (input.symbolType) {
            // Filter by symbol type
            symbols = symbols.filter(entity => {
                switch (input.symbolType) {
                    case 'function':
                        return entity.type === 'symbol' && 'kind' in entity && entity.kind === 'function';
                    case 'class':
                        return entity.type === 'symbol' && 'kind' in entity && entity.kind === 'class';
                    case 'interface':
                        return entity.type === 'symbol' && 'kind' in entity && entity.kind === 'interface';
                    case 'typeAlias':
                        return entity.type === 'symbol' && 'kind' in entity && entity.kind === 'typeAlias';
                    default:
                        return false;
                }
            });
        }
        return symbols;
    }),
});
//# sourceMappingURL=code.js.map