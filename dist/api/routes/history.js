/**
 * History and Checkpoints Routes (stubs)
 * Provides endpoints for creating/listing/fetching/deleting checkpoints and time-scoped graph queries.
 * Implementation is intentionally minimal to establish API surface; handlers return placeholders.
 */
export async function registerHistoryRoutes(app, kgService, _dbService) {
    // POST /api/v1/history/checkpoints - create a checkpoint (stub)
    app.post("/history/checkpoints", {
        schema: {
            body: {
                type: "object",
                properties: {
                    seedEntities: { type: "array", items: { type: "string" } },
                    reason: { type: "string", enum: ["daily", "incident", "manual"] },
                    hops: { type: "number" },
                    window: {
                        type: "object",
                        properties: {
                            since: { type: "string" },
                            until: { type: "string" },
                            timeRange: { type: "string" },
                        },
                    },
                },
                required: ["seedEntities", "reason"],
            },
        },
    }, async (request, reply) => {
        var _a;
        try {
            const body = request.body;
            const seedEntities = Array.isArray(body.seedEntities) ? body.seedEntities : [];
            const reason = String(body.reason || 'manual');
            const hops = typeof body.hops === 'number' ? Math.floor(body.hops) : undefined;
            const window = body.window;
            const { checkpointId } = await kgService.createCheckpoint(seedEntities, reason, (_a = hops) !== null && _a !== void 0 ? _a : 2, window);
            reply.status(201).send({ success: true, data: { checkpointId } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_CREATE_FAILED', message: error instanceof Error ? error.message : 'Failed to create checkpoint' } });
        }
    });
    // GET /api/v1/history/checkpoints/:id/export - export checkpoint JSON
    app.get("/history/checkpoints/:id/export", {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
            querystring: { type: 'object', properties: { includeRelationships: { type: 'boolean' } } }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const q = request.query;
            const includeRelationships = (q === null || q === void 0 ? void 0 : q.includeRelationships) !== false;
            const exported = await kgService.exportCheckpoint(id, { includeRelationships });
            if (!exported) {
                reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
                return;
            }
            reply.send({ success: true, data: exported });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_EXPORT_FAILED', message: error instanceof Error ? error.message : 'Failed to export checkpoint' } });
        }
    });
    // POST /api/v1/history/checkpoints/import - import checkpoint JSON
    app.post("/history/checkpoints/import", {
        schema: {
            body: { type: 'object' }
        }
    }, async (request, reply) => {
        try {
            const body = request.body;
            const useOriginalId = !!(body === null || body === void 0 ? void 0 : body.useOriginalId);
            if (!body || !body.checkpoint || !Array.isArray(body.members)) {
                reply.status(400).send({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Expected { checkpoint, members, relationships? }' } });
                return;
            }
            const result = await kgService.importCheckpoint(body, { useOriginalId });
            reply.status(201).send({ success: true, data: result });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_IMPORT_FAILED', message: error instanceof Error ? error.message : 'Failed to import checkpoint' } });
        }
    });
    // GET /api/v1/history/checkpoints - list checkpoints
    app.get("/history/checkpoints", {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    reason: { type: "string" },
                    since: { type: "string" },
                    until: { type: "string" },
                    limit: { type: "number" },
                    offset: { type: "number" },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const q = request.query;
            const reason = typeof q.reason === 'string' && q.reason ? q.reason : undefined;
            const since = typeof q.since === 'string' && q.since ? new Date(q.since) : undefined;
            const until = typeof q.until === 'string' && q.until ? new Date(q.until) : undefined;
            const limit = q.limit !== undefined ? Number(q.limit) : undefined;
            const offset = q.offset !== undefined ? Number(q.offset) : undefined;
            const { items, total } = await kgService.listCheckpoints({ reason, since, until, limit, offset });
            reply.send({ success: true, data: items, total });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_LIST_FAILED', message: error instanceof Error ? error.message : 'Failed to list checkpoints' } });
        }
    });
    // GET /api/v1/history/checkpoints/:id - get checkpoint members (stub)
    app.get("/history/checkpoints/:id", {
        schema: {
            params: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
            querystring: {
                type: 'object',
                properties: { limit: { type: 'number' }, offset: { type: 'number' } }
            }
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const q = request.query;
            const limit = (q === null || q === void 0 ? void 0 : q.limit) !== undefined ? Number(q.limit) : undefined;
            const offset = (q === null || q === void 0 ? void 0 : q.offset) !== undefined ? Number(q.offset) : undefined;
            const cp = await kgService.getCheckpoint(id);
            if (!cp) {
                reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
                return;
            }
            const { items, total } = await kgService.getCheckpointMembers(id, { limit, offset });
            reply.send({ success: true, data: { checkpoint: cp, members: items, totalMembers: total } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_FETCH_FAILED', message: error instanceof Error ? error.message : 'Failed to fetch checkpoint' } });
        }
    });
    // GET /api/v1/history/checkpoints/:id/summary - summary counts
    app.get("/history/checkpoints/:id/summary", {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const summary = await kgService.getCheckpointSummary(id);
            if (!summary) {
                reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
                return;
            }
            reply.send({ success: true, data: summary });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_SUMMARY_FAILED', message: error instanceof Error ? error.message : 'Failed to compute summary' } });
        }
    });
    // DELETE /api/v1/history/checkpoints/:id - delete checkpoint (stub)
    app.delete("/history/checkpoints/:id", {
        schema: {
            params: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const ok = await kgService.deleteCheckpoint(id);
            if (!ok) {
                reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
                return;
            }
            reply.status(204).send();
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_DELETE_FAILED', message: error instanceof Error ? error.message : 'Failed to delete checkpoint' } });
        }
    });
    // POST /api/v1/graph/time-travel - time-scoped traversal (stub)
    app.post("/graph/time-travel", {
        schema: {
            body: {
                type: "object",
                properties: {
                    startId: { type: "string" },
                    atTime: { type: "string" },
                    since: { type: "string" },
                    until: { type: "string" },
                    maxDepth: { type: "number" },
                    types: { type: 'array', items: { type: 'string' } }
                },
                required: ["startId"],
            },
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            const startId = String(body.startId);
            const atTime = body.atTime ? new Date(body.atTime) : undefined;
            const since = body.since ? new Date(body.since) : undefined;
            const until = body.until ? new Date(body.until) : undefined;
            const maxDepth = typeof body.maxDepth === 'number' ? Math.floor(body.maxDepth) : undefined;
            const types = Array.isArray(body.types) ? body.types.map((t) => String(t)) : undefined;
            const { entities, relationships } = await kgService.timeTravelTraversal({ startId, atTime, since, until, maxDepth, types });
            reply.send({ success: true, data: { entities, relationships } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'TIME_TRAVEL_FAILED', message: error instanceof Error ? error.message : 'Failed to perform time traversal' } });
        }
    });
    // Additional stubs for future control-plane endpoints
    // POST /api/v1/history/checkpoints/:id/rebuild - Rebuild checkpoint members using current config
    app.post('/history/checkpoints/:id/rebuild', async (_req, reply) => {
        reply.status(202).send({ success: true, message: 'Rebuild scheduled (stub)' });
    });
    // POST /api/v1/history/checkpoints/:id/refresh-members - Refresh member links without changing metadata
    app.post('/history/checkpoints/:id/refresh-members', async (_req, reply) => {
        reply.status(202).send({ success: true, message: 'Refresh scheduled (stub)' });
    });
}
//# sourceMappingURL=history.js.map