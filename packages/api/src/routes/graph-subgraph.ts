/**
 * Subgraph & Neighbors endpoints for graph viewer
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/database';

export async function registerGraphViewerRoutes(app: FastifyInstance, kg: KnowledgeGraphService, _db: DatabaseService) {
  // GET /api/v1/graph/subgraph?limit=2000&type=symbol
  app.get('/graph/subgraph', async (request, reply) => {
    try {
      const q = (request.query || {}) as any;
      const limit = Math.min(parseInt(q.limit || '2000', 10), 5000);
      const type = typeof q.type === 'string' ? q.type : undefined;

      // Fetch entities with optional type filter
      const { entities } = await kg.listEntities({ type, limit, offset: 0 });

      // Fetch relationships among these entities (bounded)
      const idSet = new Set((entities || []).map((e: any) => e.id));
      // Pull a larger page of relationships and then filter
      const { relationships } = await kg.listRelationships({ limit: Math.min(limit * 3, 10000), offset: 0 });
      const subRels = relationships.filter((r: any) => idSet.has(r.fromEntityId) && idSet.has(r.toEntityId));

      reply.send({ success: true, data: { nodes: entities || [], edges: subRels } });
    } catch (e: any) {
      reply.code(500).send({ success: false, error: { code: 'SUBGRAPH_FAILED', message: e?.message || 'Failed to build subgraph' } });
    }
  });

  // GET /api/v1/graph/neighbors?id=<entityId>&limit=1000
  app.get('/graph/neighbors', async (request, reply) => {
    try {
      const q = (request.query || {}) as any;
      const id = String(q.id || '').trim();
      const limit = Math.min(parseInt(q.limit || '1000', 10), 5000);
      if (!id) return reply.code(400).send({ success: false, error: { code: 'INVALID_ID', message: 'id required' } });

      // Get relationships where node is source or target
      const { relationships } = await kg.listRelationships({ limit: Math.min(limit * 2, 5000), offset: 0 });
      const neigh = relationships.filter((r: any) => r.fromEntityId === id || r.toEntityId === id).slice(0, limit);
      const neighborIds = new Set<string>();
      neigh.forEach((r: any) => { if (r.fromEntityId !== id) neighborIds.add(r.fromEntityId); if (r.toEntityId !== id) neighborIds.add(r.toEntityId); });

      // Fetch neighbor entities
      const nodes: any[] = [];
      for (const nid of neighborIds) {
        const e = await kg.getEntity(nid);
        if (e) nodes.push(e);
      }
      // Also include the center node if available
      const center = await kg.getEntity(id); if (center) nodes.push(center);

      reply.send({ success: true, data: { nodes, edges: neigh } });
    } catch (e: any) {
      reply.code(500).send({ success: false, error: { code: 'NEIGHBORS_FAILED', message: e?.message || 'Failed to fetch neighbors' } });
    }
  });
}
