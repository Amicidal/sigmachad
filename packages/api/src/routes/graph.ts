/**
 * Graph Operations Routes
 * Handles graph search, entity examples, and dependency analysis
 */

import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/database';
import { RelationshipType } from '@memento/core';
import {
  GraphSearchRequest,
  GraphSearchResult,
  GraphExamples,
  DependencyAnalysis,
} from '@memento/shared-types';

const GRAPH_ENTITY_TYPE_LOOKUP: Record<string, string> = {
  change: 'change',
  directory: 'directory',
  file: 'file',
  module: 'module',
  spec: 'spec',
  symbol: 'symbol',
  test: 'test',
};

const GRAPH_SYMBOL_KIND_LOOKUP: Record<string, string> = {
  class: 'class',
  function: 'function',
  interface: 'interface',
  method: 'method',
  property: 'property',
  typealias: 'typeAlias',
  unknown: 'unknown',
  variable: 'variable',
};

const parseBooleanParam = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const parseStringArrayParam = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const buildErrorResponse = (
  request: { id?: string } | null | undefined,
  error: { code: string; message: string; details?: string }
) => ({
  success: false,
  error,
  requestId: request?.id ?? 'unknown',
  timestamp: new Date().toISOString(),
});

export async function registerGraphRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService
): Promise<void> {
  // Simple redirect to the build-based graph UI if available
  app.get('/graph/ui', async (_req, reply) => {
    reply.redirect('/ui/graph/');
  });
  // GET /api/graph/entity/:entityId - Get single entity by ID
  app.get(
    '/graph/entity/:entityId',
    {
      schema: {
        params: {
          type: 'object',
          properties: { entityId: { type: 'string' } },
          required: ['entityId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        if (
          !entityId ||
          typeof entityId !== 'string' ||
          entityId.trim() === ''
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Entity ID must be a non-empty string',
            },
          });
        }

        const entity = await kgService.getEntity(entityId);
        if (!entity) {
          return reply.status(404).send({
            success: false,
            error: { code: 'ENTITY_NOT_FOUND', message: 'Entity not found' },
          });
        }

        reply.send({ success: true, data: entity });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'ENTITY_FETCH_FAILED',
            message: 'Failed to fetch entity',
            details,
          })
        );
      }
    }
  );

  // Alias: /graph/entities/:entityId -> /graph/entity/:entityId
  app.get('/graph/entities/:entityId', async (request, reply) => {
    const params = request.params as { entityId: string };
    const res = await (app as any).inject({
      method: 'GET',
      url: `/graph/entity/${encodeURIComponent(params.entityId)}`,
    });
    const headers = res.headers ?? {};
    const contentTypeHeader = headers['content-type'];

    Object.entries(headers).forEach(([key, value]) => {
      if (
        key.toLowerCase() === 'content-length' ||
        typeof value === 'undefined'
      ) {
        return;
      }

      reply.header(key, value as any);
    });

    let payload: unknown = res.body ?? res.payload;
    const isJsonResponse =
      typeof contentTypeHeader === 'string' &&
      contentTypeHeader.includes('application/json');

    if (isJsonResponse && typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // fall back to sending raw payload if parsing fails
      }
    }

    reply.status(res.statusCode).send(payload);
  });

  // GET /api/graph/relationship/:relationshipId - Get single relationship by ID
  app.get(
    '/graph/relationship/:relationshipId',
    {
      schema: {
        params: {
          type: 'object',
          properties: { relationshipId: { type: 'string' } },
          required: ['relationshipId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };

        if (
          !relationshipId ||
          typeof relationshipId !== 'string' ||
          relationshipId.trim() === ''
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Relationship ID must be a non-empty string',
            },
          });
        }

        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'RELATIONSHIP_NOT_FOUND',
              message: 'Relationship not found',
            },
          });
        }

        reply.send({ success: true, data: rel });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'RELATIONSHIP_FETCH_FAILED',
            message: 'Failed to fetch relationship',
            details,
          })
        );
      }
    }
  );

  app.get(
    '/graph/modules/children',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            modulePath: { type: 'string' },
            includeFiles: {
              anyOf: [{ type: 'boolean' }, { type: 'string' }],
            },
            includeSymbols: {
              anyOf: [{ type: 'boolean' }, { type: 'string' }],
            },
            language: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            symbolKind: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            modulePathPrefix: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 500 },
          },
          required: ['modulePath'],
        },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        modulePath: string;
        includeFiles?: boolean | string;
        includeSymbols?: boolean | string;
        language?: string | string[];
        symbolKind?: string | string[];
        modulePathPrefix?: string;
        limit?: number | string;
      };

      try {
        const includeFiles = parseBooleanParam(query.includeFiles);
        const includeSymbols = parseBooleanParam(query.includeSymbols);
        const languages = parseStringArrayParam(query.language);
        const symbolKinds = parseStringArrayParam(query.symbolKind);
        const modulePathPrefix =
          typeof query.modulePathPrefix === 'string'
            ? query.modulePathPrefix.trim()
            : undefined;
        const limit =
          typeof query.limit === 'number'
            ? query.limit
            : typeof query.limit === 'string' && query.limit.trim().length > 0
            ? Number(query.limit)
            : undefined;

        const options: Parameters<
          KnowledgeGraphService['listModuleChildren']
        >[1] = {};
        if (typeof includeFiles === 'boolean')
          options.includeFiles = includeFiles;
        if (typeof includeSymbols === 'boolean')
          options.includeSymbols = includeSymbols;
        if (languages.length === 1) {
          options.language = languages[0];
        } else if (languages.length > 1) {
          options.language = languages;
        }
        if (symbolKinds.length === 1) {
          options.symbolKind = symbolKinds[0];
        } else if (symbolKinds.length > 1) {
          options.symbolKind = symbolKinds;
        }
        if (modulePathPrefix && modulePathPrefix.length > 0) {
          options.modulePathPrefix = modulePathPrefix;
        }
        if (typeof limit === 'number' && !Number.isNaN(limit)) {
          options.limit = limit;
        }

        const result = await kgService.listModuleChildren(
          query.modulePath,
          options
        );
        reply.send({ success: true, data: result });
      } catch (error) {
        const details =
          error instanceof Error
            ? error.message
            : 'Failed to list module children';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'MODULE_CHILDREN_FAILED',
            message: 'Failed to list module children',
            details,
          })
        );
      }
    }
  );

  app.get(
    '/graph/entity/:entityId/imports',
    {
      schema: {
        params: {
          type: 'object',
          properties: { entityId: { type: 'string' } },
          required: ['entityId'],
        },
        querystring: {
          type: 'object',
          properties: {
            resolvedOnly: { type: 'boolean' },
            language: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            symbolKind: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            importAlias: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            importType: {
              anyOf: [
                {
                  type: 'string',
                  enum: [
                    'default',
                    'named',
                    'namespace',
                    'wildcard',
                    'side-effect',
                  ],
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'default',
                      'named',
                      'namespace',
                      'wildcard',
                      'side-effect',
                    ],
                  },
                },
              ],
            },
            isNamespace: { type: 'boolean' },
            modulePath: {
              anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            modulePathPrefix: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { entityId: string };
      const query = request.query as {
        resolvedOnly?: boolean | string;
        language?: string | string[];
        symbolKind?: string | string[];
        importAlias?: string | string[];
        importType?: string | string[];
        isNamespace?: boolean | string;
        modulePath?: string | string[];
        modulePathPrefix?: string;
        limit?: number | string;
      };

      try {
        const resolvedOnly = parseBooleanParam(query.resolvedOnly);
        const languages = parseStringArrayParam(query.language).map((value) =>
          value.toLowerCase()
        );
        const symbolKinds = parseStringArrayParam(query.symbolKind).map(
          (value) => value.toLowerCase()
        );
        const importAliases = parseStringArrayParam(query.importAlias);
        const importTypes = parseStringArrayParam(query.importType).map(
          (value) => value.toLowerCase()
        );
        const isNamespace = parseBooleanParam(query.isNamespace);
        const modulePaths = parseStringArrayParam(query.modulePath);
        const modulePathPrefix =
          typeof query.modulePathPrefix === 'string'
            ? query.modulePathPrefix.trim()
            : undefined;
        const limit =
          typeof query.limit === 'number'
            ? query.limit
            : typeof query.limit === 'string' && query.limit.trim().length > 0
            ? Number(query.limit)
            : undefined;

        const options: Parameters<KnowledgeGraphService['listImports']>[1] = {};
        if (typeof resolvedOnly === 'boolean')
          options.resolvedOnly = resolvedOnly;
        if (languages.length === 1) {
          options.language = languages[0];
        } else if (languages.length > 1) {
          options.language = languages;
        }
        if (symbolKinds.length === 1) {
          options.symbolKind = symbolKinds[0];
        } else if (symbolKinds.length > 1) {
          options.symbolKind = symbolKinds;
        }
        if (importAliases.length === 1) {
          options.importAlias = importAliases[0];
        } else if (importAliases.length > 1) {
          options.importAlias = importAliases;
        }
        if (importTypes.length === 1) {
          options.importType = importTypes[0] as any;
        } else if (importTypes.length > 1) {
          options.importType = importTypes as any;
        }
        if (typeof isNamespace === 'boolean') {
          options.isNamespace = isNamespace;
        }
        if (modulePaths.length === 1) {
          options.modulePath = modulePaths[0];
        } else if (modulePaths.length > 1) {
          options.modulePath = modulePaths;
        }
        if (modulePathPrefix && modulePathPrefix.length > 0) {
          options.modulePathPrefix = modulePathPrefix;
        }
        if (typeof limit === 'number' && !Number.isNaN(limit)) {
          options.limit = limit;
        }

        const result = await kgService.listImports(params.entityId, options);
        reply.send({ success: true, data: result });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Failed to list imports';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'LIST_IMPORTS_FAILED',
            message: 'Failed to list imports',
            details,
          })
        );
      }
    }
  );

  app.get(
    '/graph/symbol/:symbolId/definition',
    {
      schema: {
        params: {
          type: 'object',
          properties: { symbolId: { type: 'string' } },
          required: ['symbolId'],
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { symbolId: string };

      try {
        const result = await kgService.findDefinition(params.symbolId);
        reply.send({ success: true, data: result });
      } catch (error) {
        const details =
          error instanceof Error
            ? error.message
            : 'Failed to resolve definition';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'FIND_DEFINITION_FAILED',
            message: 'Failed to find symbol definition',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/relationship/:relationshipId/evidence - List auxiliary evidence nodes
  app.get(
    '/graph/relationship/:relationshipId/evidence',
    {
      schema: {
        params: {
          type: 'object',
          properties: { relationshipId: { type: 'string' } },
          required: ['relationshipId'],
        },
        querystring: {
          type: 'object',
          properties: { limit: { type: 'number' } },
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };
        const { limit } = (request.query as any) || {};
        if (
          !relationshipId ||
          typeof relationshipId !== 'string' ||
          relationshipId.trim() === ''
        ) {
          return reply
            .status(400)
            .send({
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Relationship ID must be a non-empty string',
              },
            });
        }
        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel)
          return reply
            .status(404)
            .send({
              success: false,
              error: {
                code: 'RELATIONSHIP_NOT_FOUND',
                message: 'Relationship not found',
              },
            });
        const evidence = await kgService.getEdgeEvidenceNodes(
          relationshipId,
          Math.max(1, Math.min(Number(limit) || 200, 1000))
        );
        reply.send({ success: true, data: evidence });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'EVIDENCE_FETCH_FAILED',
            message: 'Failed to fetch evidence',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/relationship/:relationshipId/sites - List auxiliary site nodes
  app.get(
    '/graph/relationship/:relationshipId/sites',
    {
      schema: {
        params: {
          type: 'object',
          properties: { relationshipId: { type: 'string' } },
          required: ['relationshipId'],
        },
        querystring: {
          type: 'object',
          properties: { limit: { type: 'number' } },
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };
        const { limit } = (request.query as any) || {};
        if (
          !relationshipId ||
          typeof relationshipId !== 'string' ||
          relationshipId.trim() === ''
        ) {
          return reply
            .status(400)
            .send({
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Relationship ID must be a non-empty string',
              },
            });
        }
        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel)
          return reply
            .status(404)
            .send({
              success: false,
              error: {
                code: 'RELATIONSHIP_NOT_FOUND',
                message: 'Relationship not found',
              },
            });
        const sites = await kgService.getEdgeSites(
          relationshipId,
          Math.max(1, Math.min(Number(limit) || 50, 500))
        );
        reply.send({ success: true, data: sites });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'SITES_FETCH_FAILED',
            message: 'Failed to fetch sites',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/relationship/:relationshipId/candidates - List auxiliary candidate nodes
  app.get(
    '/graph/relationship/:relationshipId/candidates',
    {
      schema: {
        params: {
          type: 'object',
          properties: { relationshipId: { type: 'string' } },
          required: ['relationshipId'],
        },
        querystring: {
          type: 'object',
          properties: { limit: { type: 'number' } },
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };
        const { limit } = (request.query as any) || {};
        if (
          !relationshipId ||
          typeof relationshipId !== 'string' ||
          relationshipId.trim() === ''
        ) {
          return reply
            .status(400)
            .send({
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Relationship ID must be a non-empty string',
              },
            });
        }
        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel)
          return reply
            .status(404)
            .send({
              success: false,
              error: {
                code: 'RELATIONSHIP_NOT_FOUND',
                message: 'Relationship not found',
              },
            });
        const candidates = await kgService.getEdgeCandidates(
          relationshipId,
          Math.max(1, Math.min(Number(limit) || 50, 500))
        );
        reply.send({ success: true, data: candidates });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'CANDIDATES_FETCH_FAILED',
            message: 'Failed to fetch candidates',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/relationship/:relationshipId/full - Relationship with resolved endpoints
  app.get(
    '/graph/relationship/:relationshipId/full',
    {
      schema: {
        params: {
          type: 'object',
          properties: { relationshipId: { type: 'string' } },
          required: ['relationshipId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };
        if (
          !relationshipId ||
          typeof relationshipId !== 'string' ||
          relationshipId.trim() === ''
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Relationship ID must be a non-empty string',
            },
          });
        }

        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'RELATIONSHIP_NOT_FOUND',
              message: 'Relationship not found',
            },
          });
        }

        const [from, to] = await Promise.all([
          kgService.getEntity(rel.fromEntityId),
          kgService.getEntity(rel.toEntityId),
        ]);

        reply.send({ success: true, data: { relationship: rel, from, to } });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'RELATIONSHIP_FULL_FETCH_FAILED',
            message: 'Failed to fetch relationship details',
            details,
          })
        );
      }
    }
  );

  // Alias: /graph/relationships/:relationshipId -> /graph/relationship/:relationshipId
  app.get('/graph/relationships/:relationshipId', async (request, reply) => {
    const params = request.params as { relationshipId: string };
    const res = await (app as any).inject({
      method: 'GET',
      url: `/graph/relationship/${encodeURIComponent(params.relationshipId)}`,
    });
    reply.status(res.statusCode).send(res.body ?? res.payload);
  });
  // POST /api/graph/search - Perform semantic and structural searches
  app.post(
    '/graph/search',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            entityTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'function',
                  'class',
                  'interface',
                  'file',
                  'module',
                  'spec',
                  'test',
                  'change',
                  'session',
                  'directory',
                ],
              },
            },
            searchType: {
              type: 'string',
              enum: ['semantic', 'structural', 'usage', 'dependency'],
            },
            filters: {
              type: 'object',
              properties: {
                language: { type: 'string' },
                path: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                lastModified: {
                  type: 'object',
                  properties: {
                    since: { type: 'string', format: 'date-time' },
                    until: { type: 'string', format: 'date-time' },
                  },
                },
                checkpointId: { type: 'string' },
              },
            },
            includeRelated: { type: 'boolean' },
            limit: { type: 'number' },
          },
          required: ['query'],
        },
      },
    },
    async (request, reply) => {
      try {
        const params: GraphSearchRequest = request.body as GraphSearchRequest;

        // Validate required parameters with better error handling
        if (!params || typeof params !== 'object') {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Request body must be a valid JSON object',
            },
          });
        }

        if (
          !params.query ||
          (typeof params.query === 'string' && params.query.trim() === '')
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Query parameter is required and cannot be empty',
            },
          });
        }

        // Ensure query is a string
        if (typeof params.query !== 'string') {
          params.query = String(params.query);
        }

        // Perform the search using KnowledgeGraphService
        const entities = await kgService.search(params);

        // Get relationships if includeRelated is true
        let relationships: any[] = [];
        const clusters: any[] = [];
        let relevanceScore = 0;

        if (params.includeRelated && entities.length > 0) {
          // Get relationships for the top entities
          const topEntities = entities.slice(0, 5);
          for (const entity of topEntities) {
            const entityRelationships = await kgService.getRelationships({
              fromEntityId: entity.id,
              limit: 10,
            });
            relationships.push(...entityRelationships);
          }

          // Remove duplicates
          relationships = relationships.filter(
            (rel, index, self) =>
              index === self.findIndex((r) => r.id === rel.id)
          );
        }

        // Calculate relevance score based on number of results and relationships
        relevanceScore = Math.min(
          entities.length * 0.3 + relationships.length * 0.2,
          1.0
        );

        const results: GraphSearchResult = {
          entities,
          relationships,
          clusters,
          relevanceScore,
        };

        reply.send({
          success: true,
          data: results,
        });
      } catch (error) {
        console.error('Graph search error:', error);
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'GRAPH_SEARCH_FAILED',
            message: 'Failed to perform graph search',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/examples/{entityId} - Get usage examples and tests
  app.get(
    '/graph/examples/:entityId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
          },
          required: ['entityId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Validate entityId parameter
        if (
          !entityId ||
          typeof entityId !== 'string' ||
          entityId.trim() === ''
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Entity ID is required and must be a non-empty string',
            },
          });
        }

        // Retrieve examples from knowledge graph
        const examples = await kgService.getEntityExamples(entityId);

        // Check if entity exists and examples exist
        if (!examples) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ENTITY_NOT_FOUND',
              message: 'Entity not found',
            },
          });
        }

        const sanitizedExamples = {
          ...examples,
          usageExamples: Array.isArray(examples.usageExamples)
            ? examples.usageExamples
            : [],
          testExamples: Array.isArray(examples.testExamples)
            ? examples.testExamples
            : [],
          relatedPatterns: Array.isArray(examples.relatedPatterns)
            ? examples.relatedPatterns
            : [],
        };

        reply.send({
          success: true,
          data: sanitizedExamples,
        });
      } catch (error) {
        console.error('Examples retrieval error:', error);
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'EXAMPLES_RETRIEVAL_FAILED',
            message: 'Failed to retrieve usage examples',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/dependencies/{entityId} - Analyze dependency relationships
  app.get(
    '/graph/dependencies/:entityId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
          },
          required: ['entityId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Validate entityId parameter
        if (
          !entityId ||
          typeof entityId !== 'string' ||
          entityId.trim() === ''
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Entity ID is required and must be a non-empty string',
            },
          });
        }

        // Analyze dependencies using graph queries
        const analysis = await kgService.getEntityDependencies(entityId);

        // Check if entity exists
        if (!analysis) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ENTITY_NOT_FOUND',
              message: 'Entity not found',
            },
          });
        }

        const sanitizedAnalysis = {
          ...analysis,
          directDependencies: Array.isArray(analysis.directDependencies)
            ? analysis.directDependencies
            : [],
          indirectDependencies: Array.isArray(analysis.indirectDependencies)
            ? analysis.indirectDependencies
            : [],
          reverseDependencies: Array.isArray(analysis.reverseDependencies)
            ? analysis.reverseDependencies
            : [],
          circularDependencies: Array.isArray(analysis.circularDependencies)
            ? analysis.circularDependencies
            : [],
        };

        reply.send({
          success: true,
          data: sanitizedAnalysis,
        });
      } catch (error) {
        console.error('Dependency analysis error:', error);
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'DEPENDENCY_ANALYSIS_FAILED',
            message: 'Failed to analyze dependencies',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/entities - List all entities with filtering
  app.get(
    '/graph/entities',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            language: { type: 'string' },
            path: { type: 'string' },
            tags: { type: 'string' }, // comma-separated
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          type?: string;
          language?: string;
          path?: string;
          tags?: string;
          limit?: number;
          offset?: number;
        };

        // Parse tags if provided
        const tags = query.tags
          ? query.tags.split(',').map((t) => t.trim())
          : undefined;

        const typeParam = query.type?.trim();
        let entityTypeFilter: string | undefined;
        let symbolKindFilter: string | undefined;

        if (typeParam) {
          const lowerType = typeParam.toLowerCase();
          if (GRAPH_ENTITY_TYPE_LOOKUP[lowerType]) {
            entityTypeFilter = GRAPH_ENTITY_TYPE_LOOKUP[lowerType];
          } else if (GRAPH_SYMBOL_KIND_LOOKUP[lowerType]) {
            entityTypeFilter = 'symbol';
            symbolKindFilter = GRAPH_SYMBOL_KIND_LOOKUP[lowerType];
          } else {
            // Fall back to treating unknown types as symbol kinds for forward compatibility
            entityTypeFilter = 'symbol';
            symbolKindFilter = typeParam;
          }
        }

        // Query entities from knowledge graph
        const { entities, total } = await kgService.listEntities({
          type: entityTypeFilter,
          kind: symbolKindFilter,
          language: query.language,
          path: query.path,
          tags,
          limit: query.limit,
          offset: query.offset,
        });

        reply.send({
          success: true,
          data: entities,
          pagination: {
            page: Math.floor((query.offset || 0) / (query.limit || 50)) + 1,
            pageSize: query.limit || 50,
            total,
            hasMore: (query.offset || 0) + (query.limit || 50) < total,
          },
        });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'ENTITIES_LIST_FAILED',
            message: 'Failed to list entities',
            details,
          })
        );
      }
    }
  );

  // GET /api/graph/relationships - List relationships with filtering
  app.get(
    '/graph/relationships',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            fromEntity: { type: 'string' },
            toEntity: { type: 'string' },
            type: { type: 'string' },
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          fromEntity?: string;
          toEntity?: string;
          type?: string;
          limit?: number;
          offset?: number;
        };

        // Query relationships from knowledge graph
        const { relationships, total } = await kgService.listRelationships({
          fromEntityId: query.fromEntity,
          toEntityId: query.toEntity,
          type: query.type as RelationshipType | undefined,
          limit: query.limit,
          offset: query.offset,
        });

        reply.send({
          success: true,
          data: relationships,
          pagination: {
            page: Math.floor((query.offset || 0) / (query.limit || 50)) + 1,
            pageSize: query.limit || 50,
            total,
            hasMore: (query.offset || 0) + (query.limit || 50) < total,
          },
        });
      } catch (error) {
        const details =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(500).send(
          buildErrorResponse(request, {
            code: 'RELATIONSHIPS_LIST_FAILED',
            message: 'Failed to list relationships',
            details,
          })
        );
      }
    }
  );
}
