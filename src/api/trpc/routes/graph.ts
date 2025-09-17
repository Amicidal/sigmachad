/**
 * Knowledge Graph tRPC Routes
 * Type-safe procedures for graph operations
 */

import { z } from 'zod';
import { router, publicProcedure } from '../base.js';
import { TRPCError } from '@trpc/server';

// Entity and Relationship schemas
const EntitySchema = z.object({
  id: z.string(),
  type: z.enum([
    'file', 'directory', 'module', 'symbol', 'function', 'class',
    'interface', 'typeAlias', 'test', 'spec', 'change', 'session',
    'documentation', 'businessDomain', 'semanticCluster',
    'securityIssue', 'vulnerability'
  ]),
});

const RelationshipSchema = z.object({
  id: z.string(),
  fromEntityId: z.string(),
  toEntityId: z.string(),
  type: z.string(),
  created: z.date(),
  lastModified: z.date(),
  version: z.number(),
});

export const graphRouter = router({
  // Get entities by type
  getEntities: publicProcedure
    .input(z.object({
      type: z.string().optional(),
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const { entities, total } = await ctx.kgService.listEntities({
        type: input.type,
        limit: input.limit,
        offset: input.offset,
      });
      return {
        items: entities,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Get entity by ID
  getEntity: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const entity = await ctx.kgService.getEntity(input.id);
      if (!entity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Entity ${input.id} not found` });
      }
      return entity;
    }),

  // Get relationships for entity
  getRelationships: publicProcedure
    .input(z.object({
      entityId: z.string(),
      direction: z.enum(['incoming', 'outgoing', 'both']).default('both'),
      type: z.string().optional(),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ input, ctx }) => {
      const types = input.type ? [input.type] : undefined;
      const collected: any[] = [];

      if (input.direction === 'outgoing' || input.direction === 'both') {
        const outgoing = await ctx.kgService.getRelationships({
          fromEntityId: input.entityId,
          type: types as any,
          limit: input.limit,
        });
        collected.push(...outgoing);
      }

      if (input.direction === 'incoming' || input.direction === 'both') {
        const incoming = await ctx.kgService.getRelationships({
          toEntityId: input.entityId,
          type: types as any,
          limit: input.limit,
        });
        collected.push(...incoming);
      }

      const seen = new Set<string>();
      const deduped = [] as any[];
      for (const rel of collected) {
        const key = (rel as any).id || `${rel.fromEntityId}->${rel.toEntityId}:${rel.type}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(rel);
        }
        if (deduped.length >= input.limit) {
          break;
        }
      }

      return deduped;
    }),

  // Search entities
  searchEntities: publicProcedure
    .input(z.object({
      query: z.string(),
      entityTypes: z.array(z.enum(['function','class','interface','file','module','spec','test','change','session','directory'])).optional(),
      searchType: z.enum(['semantic','structural','usage','dependency']).optional(),
      filters: z.object({
        language: z.string().optional(),
        path: z.string().optional(),
        tags: z.array(z.string()).optional(),
        lastModified: z.object({ since: z.date().optional(), until: z.date().optional() }).optional(),
        checkpointId: z.string().optional(),
      }).optional(),
      includeRelated: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const entities = await ctx.kgService.search({
        query: input.query,
        entityTypes: input.entityTypes as any,
        searchType: input.searchType as any,
        filters: input.filters as any,
        includeRelated: input.includeRelated,
        limit: input.limit,
      } as any);
      return { items: entities, total: entities.length };
    }),

  // Get entity dependencies
  getDependencies: publicProcedure
    .input(z.object({
      entityId: z.string(),
      depth: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ input, ctx }) => {
      const analysis = await ctx.kgService.getEntityDependencies(input.entityId);
      if (!analysis) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Entity ${input.entityId} not found` });
      }
      return analysis;
    }),

  // Get semantic clusters
  getClusters: publicProcedure
    .input(z.object({
      domain: z.string().optional(),
      minSize: z.number().min(2).default(3),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { entities } = await ctx.kgService.listEntities({
        type: 'semanticCluster',
        limit: input.limit,
        offset: 0,
      });

      const filtered = entities.filter((cluster: any) => {
        if (input.domain) {
          const domain = (cluster?.domain || cluster?.metadata?.domain || '').toString();
          if (!domain.toLowerCase().includes(input.domain.toLowerCase())) {
            return false;
          }
        }
        const members = Array.isArray((cluster as any).members) ? (cluster as any).members.length : 0;
        return members >= input.minSize;
      });

      return filtered.slice(0, input.limit);
    }),

  // Analyze entity impact
  analyzeImpact: publicProcedure
    .input(z.object({
      entityId: z.string(),
      changeType: z.enum(['modify', 'delete', 'refactor']),
    }))
    .query(async ({ input, ctx }) => {
      throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Impact analysis is not yet available.' });
    }),
  // Time travel traversal
  timeTravel: publicProcedure
    .input(z.object({
      startId: z.string(),
      atTime: z.date().optional(),
      since: z.date().optional(),
      until: z.date().optional(),
      maxDepth: z.number().int().min(1).max(5).optional(),
      types: z.array(z.string()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const res = await ctx.kgService.timeTravelTraversal({
        startId: input.startId,
        atTime: input.atTime,
        since: input.since,
        until: input.until,
        maxDepth: input.maxDepth,
        types: input.types,
      });
      return res;
    }),
});
