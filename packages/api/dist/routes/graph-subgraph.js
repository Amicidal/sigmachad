export async function registerGraphViewerRoutes(app, kg, _db) {
    // GET /api/v1/graph/subgraph?limit=2000&type=symbol
    app.get('/graph/subgraph', async (request, reply) => {
        try {
            const q = (request.query || {});
            const limit = Math.min(parseInt(q.limit || '2000', 10), 5000);
            const type = typeof q.type === 'string' ? q.type : undefined;
            // Fetch entities with optional type filter
            const { entities } = await kg.listEntities({ type, limit, offset: 0 });
            // Fetch relationships among these entities (bounded)
            const idSet = new Set((entities || []).map((e) => e.id));
            // Pull a larger page of relationships and then filter
            const { relationships } = await kg.listRelationships({ limit: Math.min(limit * 3, 10000), offset: 0 });
            const subRels = relationships.filter((r) => idSet.has(r.fromEntityId) && idSet.has(r.toEntityId));
            reply.send({ success: true, data: { nodes: entities || [], edges: subRels } });
        }
        catch (e) {
            reply.code(500).send({ success: false, error: { code: 'SUBGRAPH_FAILED', message: (e === null || e === void 0 ? void 0 : e.message) || 'Failed to build subgraph' } });
        }
    });
    // GET /api/v1/graph/neighbors?id=<entityId>&limit=1000
    app.get('/graph/neighbors', async (request, reply) => {
        try {
            const q = (request.query || {});
            const id = String(q.id || '').trim();
            const limit = Math.min(parseInt(q.limit || '1000', 10), 5000);
            if (!id)
                return reply.code(400).send({ success: false, error: { code: 'INVALID_ID', message: 'id required' } });
            // Get relationships where node is source or target
            const { relationships } = await kg.listRelationships({ limit: Math.min(limit * 2, 5000), offset: 0 });
            const neigh = relationships.filter((r) => r.fromEntityId === id || r.toEntityId === id).slice(0, limit);
            const neighborIds = new Set();
            neigh.forEach((r) => { if (r.fromEntityId !== id)
                neighborIds.add(r.fromEntityId); if (r.toEntityId !== id)
                neighborIds.add(r.toEntityId); });
            // Fetch neighbor entities
            const nodes = [];
            for (const nid of neighborIds) {
                const e = await kg.getEntity(nid);
                if (e)
                    nodes.push(e);
            }
            // Also include the center node if available
            const center = await kg.getEntity(id);
            if (center)
                nodes.push(center);
            reply.send({ success: true, data: { nodes, edges: neigh } });
        }
        catch (e) {
            reply.code(500).send({ success: false, error: { code: 'NEIGHBORS_FAILED', message: (e === null || e === void 0 ? void 0 : e.message) || 'Failed to fetch neighbors' } });
        }
    });
}
//# sourceMappingURL=graph-subgraph.js.map