/**
 * History and Checkpoints Routes (stubs)
 * Provides endpoints for creating/listing/fetching/deleting checkpoints and time-scoped graph queries.
 * Implementation is intentionally minimal to establish API surface; handlers return placeholders.
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";

export async function registerHistoryRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  _dbService: DatabaseService
): Promise<void> {
  // POST /api/v1/history/checkpoints - create a checkpoint (stub)
  app.post(
    "/history/checkpoints",
    {
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
    },
    async (request, reply) => {
      try {
        const body = request.body as any;
        const seedEntities = Array.isArray(body.seedEntities) ? body.seedEntities : [];
        const reason = String(body.reason || 'manual') as 'daily' | 'incident' | 'manual';
        const hops = typeof body.hops === 'number' ? Math.floor(body.hops) : undefined;
        const window = body.window as any | undefined;
        const { checkpointId } = await kgService.createCheckpoint(seedEntities, reason, (hops as any) ?? 2, window);
        reply.status(201).send({ success: true, data: { checkpointId } });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_CREATE_FAILED', message: error instanceof Error ? error.message : 'Failed to create checkpoint' } });
      }
    }
  );

  // GET /api/v1/history/checkpoints/:id/export - export checkpoint JSON
  app.get(
    "/history/checkpoints/:id/export",
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        querystring: { type: 'object', properties: { includeRelationships: { type: 'boolean' } } }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const q = request.query as any;
        const includeRelationships = q?.includeRelationships !== false;
        const exported = await kgService.exportCheckpoint(id, { includeRelationships });
        if (!exported) {
          reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
          return;
        }
        reply.send({ success: true, data: exported });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_EXPORT_FAILED', message: error instanceof Error ? error.message : 'Failed to export checkpoint' } });
      }
    }
  );

  // POST /api/v1/history/checkpoints/import - import checkpoint JSON
  app.post(
    "/history/checkpoints/import",
    {
      schema: {
        body: { type: 'object' }
      }
    },
    async (request, reply) => {
      try {
        const body = request.body as any;
        const useOriginalId = !!body?.useOriginalId;
        if (!body || !body.checkpoint || !Array.isArray(body.members)) {
          reply.status(400).send({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Expected { checkpoint, members, relationships? }' } });
          return;
        }
        const result = await kgService.importCheckpoint(body, { useOriginalId });
        reply.status(201).send({ success: true, data: result });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_IMPORT_FAILED', message: error instanceof Error ? error.message : 'Failed to import checkpoint' } });
      }
    }
  );

  // GET /api/v1/history/checkpoints - list checkpoints
  app.get(
    "/history/checkpoints",
    {
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
    },
    async (request, reply) => {
      try {
        const q = request.query as any;
        const reason = typeof q.reason === 'string' && q.reason ? q.reason : undefined;
        const since = typeof q.since === 'string' && q.since ? new Date(q.since) : undefined;
        const until = typeof q.until === 'string' && q.until ? new Date(q.until) : undefined;
        const limit = q.limit !== undefined ? Number(q.limit) : undefined;
        const offset = q.offset !== undefined ? Number(q.offset) : undefined;

        const { items, total } = await kgService.listCheckpoints({ reason, since, until, limit, offset });
        reply.send({ success: true, data: items, total });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_LIST_FAILED', message: error instanceof Error ? error.message : 'Failed to list checkpoints' } });
      }
    }
  );

  // GET /api/v1/history/checkpoints/:id - get checkpoint members (stub)
  app.get(
    "/history/checkpoints/:id",
    {
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const q = request.query as any;
        const limit = q?.limit !== undefined ? Number(q.limit) : undefined;
        const offset = q?.offset !== undefined ? Number(q.offset) : undefined;
        const cp = await kgService.getCheckpoint(id);
        if (!cp) {
          reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
          return;
        }
        const { items, total } = await kgService.getCheckpointMembers(id, { limit, offset });
        reply.send({ success: true, data: { checkpoint: cp, members: items, totalMembers: total } });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_FETCH_FAILED', message: error instanceof Error ? error.message : 'Failed to fetch checkpoint' } });
      }
    }
  );

  // GET /api/v1/history/checkpoints/:id/summary - summary counts
  app.get(
    "/history/checkpoints/:id/summary",
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const summary = await kgService.getCheckpointSummary(id);
        if (!summary) {
          reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
          return;
        }
        reply.send({ success: true, data: summary });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_SUMMARY_FAILED', message: error instanceof Error ? error.message : 'Failed to compute summary' } });
      }
    }
  );

  // DELETE /api/v1/history/checkpoints/:id - delete checkpoint (stub)
  app.delete(
    "/history/checkpoints/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const ok = await kgService.deleteCheckpoint(id);
        if (!ok) {
          reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
          return;
        }
        reply.status(204).send();
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'CHECKPOINT_DELETE_FAILED', message: error instanceof Error ? error.message : 'Failed to delete checkpoint' } });
      }
    }
  );

  // GET /api/v1/history/entities/:id/timeline - entity version timeline with optional relationships
  app.get(
    "/history/entities/:id/timeline",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        querystring: {
          type: "object",
          properties: {
            includeRelationships: { type: "boolean" },
            limit: { type: "number" },
            offset: { type: "number" },
            since: { type: "string" },
            until: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const query = request.query as any;
        const includeRelationships =
          query?.includeRelationships === true ||
          query?.includeRelationships === 'true';
        const limit = query?.limit !== undefined ? Number(query.limit) : undefined;
        const offset = query?.offset !== undefined ? Number(query.offset) : undefined;
        const since = typeof query?.since === 'string' && query.since ? query.since : undefined;
        const until = typeof query?.until === 'string' && query.until ? query.until : undefined;
        const timeline = await kgService.getEntityTimeline(id, {
          includeRelationships,
          limit,
          offset,
          since,
          until,
        });
        reply.send({ success: true, data: timeline });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'ENTITY_TIMELINE_FAILED',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to load entity timeline',
          },
        });
      }
    }
  );

  // GET /api/v1/history/relationships/:id/timeline - relationship temporal segments
  app.get(
    "/history/relationships/:id/timeline",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const timeline = await kgService.getRelationshipTimeline(id);
        if (!timeline) {
          reply.status(404).send({
            success: false,
            error: {
              code: 'RELATIONSHIP_NOT_FOUND',
              message: 'Relationship not found',
            },
          });
          return;
        }
        reply.send({ success: true, data: timeline });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'RELATIONSHIP_TIMELINE_FAILED',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to load relationship timeline',
          },
        });
      }
    }
  );

  // GET /api/v1/history/sessions/:id/changes - change summaries for a session
  app.get(
    "/history/sessions/:id/changes",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        querystring: {
          type: "object",
          properties: {
            since: { type: "string" },
            until: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const query = request.query as any;
        const options = {
          since: typeof query?.since === 'string' ? query.since : undefined,
          until: typeof query?.until === 'string' ? query.until : undefined,
          limit: query?.limit !== undefined ? Number(query.limit) : undefined,
        };
        const changes = await kgService.getChangesForSession(id, options);
        reply.send({ success: true, data: changes });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'SESSION_CHANGES_FAILED',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to load session changes',
          },
        });
      }
    }
  );

  // POST /api/v1/graph/time-travel - time-scoped traversal (stub)
  app.post(
    "/graph/time-travel",
    {
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
    },
    async (request, reply) => {
      try {
        const body = request.body as any;
        const startId = String(body.startId);
        const atTime = body.atTime ? new Date(body.atTime) : undefined;
        const since = body.since ? new Date(body.since) : undefined;
        const until = body.until ? new Date(body.until) : undefined;
        const maxDepth = typeof body.maxDepth === 'number' ? Math.floor(body.maxDepth) : undefined;

        const types = Array.isArray(body.types) ? body.types.map((t: any) => String(t)) : undefined;
        const { entities, relationships } = await kgService.timeTravelTraversal({ startId, atTime, since, until, maxDepth, types });
        reply.send({ success: true, data: { entities, relationships } });
      } catch (error) {
        reply.status(500).send({ success: false, error: { code: 'TIME_TRAVEL_FAILED', message: error instanceof Error ? error.message : 'Failed to perform time traversal' } });
      }
    }
  );

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
