/**
 * History tRPC Routes
 * Type-safe procedures for history and checkpoints
 */
import { z } from 'zod';
import { router, adminProcedure } from '../base.js';
export const historyRouter = router({
    // Create a checkpoint
    createCheckpoint: adminProcedure
        .input(z.object({
        seedEntities: z.array(z.string()).default([]),
        reason: z.enum(['daily', 'incident', 'manual']).default('manual'),
        hops: z.number().int().min(1).max(5).optional(),
        window: z.object({
            since: z.date().optional(),
            until: z.date().optional(),
            timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).optional(),
        }).optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { checkpointId } = await ctx.kgService.createCheckpoint(input.seedEntities, {
            reason: input.reason,
            hops: (_a = input.hops) !== null && _a !== void 0 ? _a : 2,
            window: input.window
        });
        return { checkpointId };
    }),
    // List checkpoints
    listCheckpoints: adminProcedure
        .input(z.object({
        reason: z.string().optional(),
        since: z.date().optional(),
        until: z.date().optional(),
        limit: z.number().int().min(1).max(1000).optional(),
        offset: z.number().int().min(0).optional(),
    }).optional())
        .query(async ({ input, ctx }) => {
        const { items, total } = await ctx.kgService.listCheckpoints({
            reason: input === null || input === void 0 ? void 0 : input.reason,
            since: input === null || input === void 0 ? void 0 : input.since,
            until: input === null || input === void 0 ? void 0 : input.until,
            limit: input === null || input === void 0 ? void 0 : input.limit,
            offset: input === null || input === void 0 ? void 0 : input.offset,
        });
        return { items, total };
    }),
    // Get checkpoint by id
    getCheckpoint: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
        const cp = await ctx.kgService.getCheckpoint(input.id);
        return cp;
    }),
    // Get checkpoint members
    getCheckpointMembers: adminProcedure
        .input(z.object({ id: z.string(), limit: z.number().int().min(1).max(1000).optional(), offset: z.number().int().min(0).optional() }))
        .query(async ({ input, ctx }) => {
        const allItems = await ctx.kgService.getCheckpointMembers(input.id);
        const offset = input.offset || 0;
        const limit = input.limit || allItems.length;
        const items = allItems.slice(offset, offset + limit);
        const total = allItems.length;
        return { items, total };
    }),
    // Summary
    getCheckpointSummary: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
        return ctx.kgService.getCheckpointSummary(input.id);
    }),
    // Export checkpoint
    exportCheckpoint: adminProcedure
        .input(z.object({ id: z.string(), includeRelationships: z.boolean().optional() }))
        .query(async ({ input, ctx }) => {
        return ctx.kgService.exportCheckpoint(input.id);
    }),
    // Import checkpoint
    importCheckpoint: adminProcedure
        .input(z.object({
        checkpoint: z.any(),
        members: z.array(z.any()),
        relationships: z.array(z.any()).optional(),
        useOriginalId: z.boolean().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        return ctx.kgService.importCheckpoint({ checkpoint: input.checkpoint, entities: input.members, relationships: input.relationships || [] });
    }),
    // Delete checkpoint
    deleteCheckpoint: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
        const ok = await ctx.kgService.deleteCheckpoint(input.id);
        return { success: ok };
    }),
});
//# sourceMappingURL=trpc-history.js.map