/**
 * History and Checkpoints Routes (stubs)
 * Provides endpoints for creating/listing/fetching/deleting checkpoints and time-scoped graph queries.
 * Implementation is intentionally minimal to establish API surface; handlers return placeholders.
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
import { RelationshipType } from "../../../dist/services/core/index.js";

const coerceStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const arr = value
      .map((entry) =>
        typeof entry === "string" ? entry : entry != null ? String(entry) : ""
      )
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof value === "string") {
    const parts = value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return parts.length > 0 ? parts : undefined;
  }
  return undefined;
};

const coerceNumberArray = (value: unknown): number[] | undefined => {
  if (Array.isArray(value)) {
    const arr = value
      .map((entry) =>
        typeof entry === "number"
          ? entry
          : typeof entry === "string"
          ? Number(entry.trim())
          : NaN
      )
      .filter((entry) => Number.isFinite(entry))
      .map((entry) => Math.floor(entry));
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof value === "string") {
    const parts = value
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
      .map((entry) => Math.floor(entry));
    return parts.length > 0 ? parts : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return [Math.floor(value)];
  }
  return undefined;
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const num = Number(value);
    return Number.isFinite(num) ? Math.floor(num) : undefined;
  }
  return undefined;
};

const parseSequenceInput = (
  value: unknown
): number | number[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const arr = coerceNumberArray(value);
    if (!arr || arr.length === 0) return undefined;
    return arr.length === 1 ? arr[0] : arr;
  }
  if (typeof value === "string") {
    const arr = coerceNumberArray(value);
    if (!arr || arr.length === 0) return undefined;
    return arr.length === 1 ? arr[0] : arr;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  return undefined;
};

const parseSequenceRange = (
  value: unknown
): { from?: number; to?: number } | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const input = value as Record<string, unknown>;
  const from = parseOptionalNumber(input.from);
  const to = parseOptionalNumber(input.to);
  if (from === undefined && to === undefined) {
    return undefined;
  }
  const range: { from?: number; to?: number } = {};
  if (from !== undefined) range.from = from;
  if (to !== undefined) range.to = to;
  return range;
};

const toTimestampString = (value: unknown): string | undefined => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const parseTimestampRange = (
  value: unknown
): { from?: string; to?: string } | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const input = value as Record<string, unknown>;
  const from = toTimestampString(input.from);
  const to = toTimestampString(input.to);
  if (!from && !to) {
    return undefined;
  }
  const range: { from?: string; to?: string } = {};
  if (from) range.from = from;
  if (to) range.to = to;
  return range;
};

const coerceRelationshipTypes = (
  value: unknown
): RelationshipType[] | undefined => {
  const strings = coerceStringArray(value);
  if (!strings) return undefined;
  const knownValues = new Set<string>(
    Object.values(RelationshipType) as string[]
  );
  const set = new Set<RelationshipType>();
  for (const candidateRaw of strings) {
    const candidate = candidateRaw.trim();
    if (!candidate) continue;
    if (knownValues.has(candidate)) {
      set.add(candidate as RelationshipType);
      continue;
    }
    const upper = candidate.toUpperCase();
    if (knownValues.has(upper)) {
      set.add(upper as RelationshipType);
    }
  }
  return set.size > 0 ? Array.from(set) : undefined;
};

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
        const { checkpointId } = await kgService.createCheckpoint(seedEntities, { reason, hops: hops ?? 2, window });
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
        const exported = await kgService.exportCheckpoint(id);
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
        const result = await kgService.importCheckpoint(body);
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
        const limit = q?.limit !== undefined ? Number(q.limit) : 50;
        const offset = q?.offset !== undefined ? Number(q.offset) : 0;
        const cp = await kgService.getCheckpoint(id);
        if (!cp) {
          reply.status(404).send({ success: false, error: { code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint not found' } });
          return;
        }
        const members = await kgService.getCheckpointMembers(id);
        const total = members.length;
        const items = members.slice(offset, offset + limit);
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
        await kgService.deleteCheckpoint(id);
        // Deletion successful since no exception was thrown
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
    "/history/sessions/:id/timeline",
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
            limit: { type: "integer", minimum: 1, maximum: 200 },
            offset: { type: "integer", minimum: 0 },
            order: { type: "string", enum: ["asc", "desc"] },
            sequenceNumber: {
              anyOf: [
                { type: "integer" },
                { type: "array", items: { type: "integer" } },
                { type: "string" },
              ],
            },
            sequenceNumberRange: {
              type: "object",
              properties: {
                from: { type: "integer" },
                to: { type: "integer" },
              },
              additionalProperties: false,
            },
            sequenceNumberMin: { type: "integer" },
            sequenceNumberMax: { type: "integer" },
            timestampFrom: { type: "string" },
            timestampTo: { type: "string" },
            timestampRange: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
              additionalProperties: false,
            },
            actor: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            impactSeverity: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            stateTransitionTo: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            types: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const sessionId = id;
        const query = request.query as Record<string, any>;

        const limit = parseOptionalNumber(query.limit);
        const offset = parseOptionalNumber(query.offset);
        const sequenceNumber = parseSequenceInput(query.sequenceNumber);
        const sequenceNumberMin = parseOptionalNumber(query.sequenceNumberMin);
        const sequenceNumberMax = parseOptionalNumber(query.sequenceNumberMax);
        const sequenceNumberRange = parseSequenceRange(
          query.sequenceNumberRange
        );
        const impactSeverityRaw = coerceStringArray(query.impactSeverity)?.map(
          (value) => value.toLowerCase()
        );
        const stateTransitionRaw = coerceStringArray(query.stateTransitionTo)?.map(
          (value) => value.toLowerCase()
        );
        const actorFilter = coerceStringArray(query.actor);
        const typesFilter = coerceRelationshipTypes(query.types);
        const timestampRange = parseTimestampRange(query.timestampRange);

        const timelineOptions: any = {};
        if (limit !== undefined) timelineOptions.limit = limit;
        if (offset !== undefined) timelineOptions.offset = offset;
        if (query.order === "desc") timelineOptions.order = "desc";
        if (sequenceNumber !== undefined)
          timelineOptions.sequenceNumber = sequenceNumber;
        if (sequenceNumberMin !== undefined)
          timelineOptions.sequenceNumberMin = sequenceNumberMin;
        if (sequenceNumberMax !== undefined)
          timelineOptions.sequenceNumberMax = sequenceNumberMax;
        if (
          sequenceNumberRange?.from !== undefined &&
          timelineOptions.sequenceNumberMin === undefined
        ) {
          timelineOptions.sequenceNumberMin = sequenceNumberRange.from;
        }
        if (
          sequenceNumberRange?.to !== undefined &&
          timelineOptions.sequenceNumberMax === undefined
        ) {
          timelineOptions.sequenceNumberMax = sequenceNumberRange.to;
        }
        if (query.timestampFrom)
          timelineOptions.timestampFrom = String(query.timestampFrom);
        if (query.timestampTo)
          timelineOptions.timestampTo = String(query.timestampTo);
        if (
          timestampRange?.from &&
          timelineOptions.timestampFrom === undefined
        )
          timelineOptions.timestampFrom = timestampRange.from;
        if (timestampRange?.to && timelineOptions.timestampTo === undefined)
          timelineOptions.timestampTo = timestampRange.to;
        if (actorFilter) timelineOptions.actor = actorFilter;
        if (impactSeverityRaw && impactSeverityRaw.length > 0)
          timelineOptions.impactSeverity = impactSeverityRaw;
        if (stateTransitionRaw && stateTransitionRaw.length > 0)
          timelineOptions.stateTransitionTo = stateTransitionRaw;
        if (typesFilter && typesFilter.length > 0)
          timelineOptions.types = typesFilter;

        const timeline = await kgService.getSessionTimeline(
          sessionId,
          timelineOptions
        );
        reply.send({ success: true, data: timeline });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "SESSION_TIMELINE_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load session timeline",
          },
        });
      }
    }
  );

  app.get(
    "/history/sessions/:id/impacts",
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
            limit: { type: "integer", minimum: 1, maximum: 200 },
            offset: { type: "integer", minimum: 0 },
            timestampFrom: { type: "string" },
            timestampTo: { type: "string" },
            timestampRange: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
              additionalProperties: false,
            },
            actor: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            impactSeverity: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            sequenceNumberRange: {
              type: "object",
              properties: {
                from: { type: "integer" },
                to: { type: "integer" },
              },
              additionalProperties: false,
            },
            sequenceNumberMin: { type: "integer" },
            sequenceNumberMax: { type: "integer" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const sessionId = id;
        const query = request.query as Record<string, any>;

        const limit = parseOptionalNumber(query.limit);
        const offset = parseOptionalNumber(query.offset);
        const actorFilter = coerceStringArray(query.actor);
        const impactSeverityRaw = coerceStringArray(query.impactSeverity)?.map(
          (value) => value.toLowerCase()
        );
        const timestampRange = parseTimestampRange(query.timestampRange);
        const sequenceRange = parseSequenceRange(query.sequenceNumberRange);
        const sequenceMin = parseOptionalNumber(query.sequenceNumberMin);
        const sequenceMax = parseOptionalNumber(query.sequenceNumberMax);

        const impactOptions: any = {};
        if (limit !== undefined) impactOptions.limit = limit;
        if (offset !== undefined) impactOptions.offset = offset;
        if (query.timestampFrom)
          impactOptions.timestampFrom = String(query.timestampFrom);
        if (query.timestampTo)
          impactOptions.timestampTo = String(query.timestampTo);
        if (
          timestampRange?.from &&
          impactOptions.timestampFrom === undefined
        )
          impactOptions.timestampFrom = timestampRange.from;
        if (timestampRange?.to && impactOptions.timestampTo === undefined)
          impactOptions.timestampTo = timestampRange.to;
        if (actorFilter) impactOptions.actor = actorFilter;
        if (impactSeverityRaw && impactSeverityRaw.length > 0)
          impactOptions.impactSeverity = impactSeverityRaw;
        if (sequenceMin !== undefined)
          impactOptions.sequenceNumberMin = sequenceMin;
        if (sequenceMax !== undefined)
          impactOptions.sequenceNumberMax = sequenceMax;
        if (
          sequenceRange?.from !== undefined &&
          impactOptions.sequenceNumberMin === undefined
        ) {
          impactOptions.sequenceNumberMin = sequenceRange.from;
        }
        if (
          sequenceRange?.to !== undefined &&
          impactOptions.sequenceNumberMax === undefined
        ) {
          impactOptions.sequenceNumberMax = sequenceRange.to;
        }

        const impacts = await kgService.getSessionImpacts(sessionId);
        reply.send({ success: true, data: impacts });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "SESSION_IMPACTS_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load session impacts",
          },
        });
      }
    }
  );

  app.get(
    "/history/entities/:id/sessions",
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
            limit: { type: "integer", minimum: 1, maximum: 200 },
            offset: { type: "integer", minimum: 0 },
            timestampFrom: { type: "string" },
            timestampTo: { type: "string" },
            timestampRange: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
              additionalProperties: false,
            },
            actor: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            impactSeverity: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            stateTransitionTo: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            types: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            sequenceNumber: {
              anyOf: [
                { type: "integer" },
                { type: "array", items: { type: "integer" } },
                { type: "string" },
              ],
            },
            sequenceNumberRange: {
              type: "object",
              properties: {
                from: { type: "integer" },
                to: { type: "integer" },
              },
              additionalProperties: false,
            },
            sequenceNumberMin: { type: "integer" },
            sequenceNumberMax: { type: "integer" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const entityId = id;
        const query = request.query as Record<string, any>;

        const limit = parseOptionalNumber(query.limit);
        const offset = parseOptionalNumber(query.offset);
        const actorFilter = coerceStringArray(query.actor);
        const impactSeverityRaw = coerceStringArray(query.impactSeverity)?.map(
          (value) => value.toLowerCase()
        );
        const stateTransitionRaw = coerceStringArray(query.stateTransitionTo)?.map(
          (value) => value.toLowerCase()
        );
        const typesFilter = coerceRelationshipTypes(query.types);
        const sequenceNumber = parseSequenceInput(query.sequenceNumber);
        const sequenceRange = parseSequenceRange(query.sequenceNumberRange);
        const sequenceMin = parseOptionalNumber(query.sequenceNumberMin);
        const sequenceMax = parseOptionalNumber(query.sequenceNumberMax);
        const timestampRange = parseTimestampRange(query.timestampRange);

        const sessionOptions: any = {};
        if (limit !== undefined) sessionOptions.limit = limit;
        if (offset !== undefined) sessionOptions.offset = offset;
        if (query.timestampFrom)
          sessionOptions.timestampFrom = String(query.timestampFrom);
        if (query.timestampTo)
          sessionOptions.timestampTo = String(query.timestampTo);
        if (
          timestampRange?.from &&
          sessionOptions.timestampFrom === undefined
        )
          sessionOptions.timestampFrom = timestampRange.from;
        if (timestampRange?.to && sessionOptions.timestampTo === undefined)
          sessionOptions.timestampTo = timestampRange.to;
        if (actorFilter) sessionOptions.actor = actorFilter;
        if (impactSeverityRaw && impactSeverityRaw.length > 0)
          sessionOptions.impactSeverity = impactSeverityRaw;
        if (stateTransitionRaw && stateTransitionRaw.length > 0)
          sessionOptions.stateTransitionTo = stateTransitionRaw;
        if (typesFilter && typesFilter.length > 0)
          sessionOptions.types = typesFilter;
        if (sequenceNumber !== undefined)
          sessionOptions.sequenceNumber = sequenceNumber;
        if (sequenceMin !== undefined)
          sessionOptions.sequenceNumberMin = sequenceMin;
        if (sequenceMax !== undefined)
          sessionOptions.sequenceNumberMax = sequenceMax;
        if (
          sequenceRange?.from !== undefined &&
          sessionOptions.sequenceNumberMin === undefined
        ) {
          sessionOptions.sequenceNumberMin = sequenceRange.from;
        }
        if (
          sequenceRange?.to !== undefined &&
          sessionOptions.sequenceNumberMax === undefined
        ) {
          sessionOptions.sequenceNumberMax = sequenceRange.to;
        }

        const sessions = await kgService.getSessionsAffectingEntity(
          entityId,
          sessionOptions
        );
        reply.send({ success: true, data: sessions });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "ENTITY_SESSIONS_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load sessions for entity",
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
