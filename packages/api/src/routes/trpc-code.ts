/**
 * Code Analysis tRPC Routes
 * Type-safe procedures for code analysis and refactoring
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc/base.js';
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
      try {
        const result = await ctx.astParser.parseFile(input.file);

        const analysis = {
          file: input.file,
          entities: result.entities,
          relationships: result.relationships,
          symbols: result.entities.filter(e => e.type === 'symbol'),
          suggestions: [] as string[],
          metrics: {
            complexity: result.entities.length,
            dependencies: result.relationships.length,
            exports: result.entities.filter(e => 'isExported' in e && e.isExported).length,
          }
        };

        // Add basic suggestions based on analysis
        if (analysis.metrics.complexity > 50) {
          analysis.suggestions.push('Consider splitting this file - it has high complexity');
        }
        if (analysis.metrics.dependencies > 20) {
          analysis.suggestions.push('Consider reducing dependencies for better maintainability');
        }
        if (analysis.symbols.length === 0) {
          analysis.suggestions.push('No symbols found - verify file syntax');
        }

        return analysis;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  // Get refactoring suggestions
  refactor: publicProcedure
    .input(z.object({
      files: z.array(z.string()),
      refactorType: z.string(),
      options: z.record(z.any()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const suggestions = [];

        // Analyze each file to provide refactoring suggestions
        for (const file of input.files) {
          try {
            const result = await ctx.astParser.parseFile(file);

            switch (input.refactorType) {
              case 'extract-function':
                if (result.entities.some(e => e.type === 'symbol' && 'kind' in e && e.kind === 'function')) {
                  suggestions.push({
                    file,
                    type: 'extract-function',
                    message: 'Consider extracting complex logic into separate functions',
                    impact: 'medium'
                  });
                }
                break;
              case 'split-module':
                if (result.entities.length > 30) {
                  suggestions.push({
                    file,
                    type: 'split-module',
                    message: 'Module is large - consider splitting into smaller modules',
                    impact: 'high'
                  });
                }
                break;
              case 'remove-duplication':
                suggestions.push({
                  file,
                  type: 'remove-duplication',
                  message: 'Analyze for potential code duplication',
                  impact: 'low'
                });
                break;
              default:
                suggestions.push({
                  file,
                  type: 'general',
                  message: 'General refactoring recommendations available',
                  impact: 'low'
                });
            }
          } catch (fileError) {
            suggestions.push({
              file,
              type: 'error',
              message: `Could not analyze file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
              impact: 'low'
            });
          }
        }

        return {
          refactorType: input.refactorType,
          files: input.files,
          suggestions,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate refactoring suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
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
