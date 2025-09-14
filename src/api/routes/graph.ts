/**
 * Graph Operations Routes
 * Handles graph search, entity examples, and dependency analysis
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";

interface GraphSearchRequest {
  query: string;
  entityTypes?: ("function" | "class" | "interface" | "file" | "module")[];
  searchType?: "semantic" | "structural" | "usage" | "dependency";
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: {
      since?: Date;
      until?: Date;
    };
    checkpointId?: string;
  };
  includeRelated?: boolean;
  limit?: number;
}

interface GraphSearchResult {
  entities: any[];
  relationships: any[];
  clusters: any[];
  relevanceScore: number;
}

interface GraphExamples {
  entityId: string;
  signature: string;
  usageExamples: {
    context: string;
    code: string;
    file: string;
    line: number;
  }[];
  testExamples: {
    testId: string;
    testName: string;
    testCode: string;
    assertions: string[];
  }[];
  relatedPatterns: {
    pattern: string;
    frequency: number;
    confidence: number;
  }[];
}

interface DependencyAnalysis {
  entityId: string;
  directDependencies: {
    entity: any;
    relationship: string;
    strength: number;
  }[];
  indirectDependencies: {
    entity: any;
    path: any[];
    relationship: string;
    distance: number;
  }[];
  reverseDependencies: {
    entity: any;
    relationship: string;
    impact: "high" | "medium" | "low";
  }[];
  circularDependencies: {
    cycle: any[];
    severity: "critical" | "warning" | "info";
  }[];
}

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
    "/graph/entity/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: { entityId: { type: "string" } },
          required: ["entityId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        if (!entityId || typeof entityId !== "string" || entityId.trim() === "") {
          return reply.status(400).send({
            success: false,
            error: { code: "INVALID_REQUEST", message: "Entity ID must be a non-empty string" },
          });
        }

        const entity = await kgService.getEntity(entityId);
        if (!entity) {
          return reply.status(404).send({
            success: false,
            error: { code: "ENTITY_NOT_FOUND", message: "Entity not found" },
          });
        }

        reply.send({ success: true, data: entity });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "ENTITY_FETCH_FAILED",
            message: "Failed to fetch entity",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );

  // Alias: /graph/entities/:entityId -> /graph/entity/:entityId
  app.get(
    "/graph/entities/:entityId",
    async (request, reply) => {
      const params = request.params as { entityId: string };
      const res = await (app as any).inject({
        method: "GET",
        url: `/graph/entity/${encodeURIComponent(params.entityId)}`,
      });
      reply.status(res.statusCode).send(res.body ?? res.payload);
    }
  );

  // GET /api/graph/relationship/:relationshipId - Get single relationship by ID
  app.get(
    "/graph/relationship/:relationshipId",
    {
      schema: {
        params: {
          type: "object",
          properties: { relationshipId: { type: "string" } },
          required: ["relationshipId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };

        if (!relationshipId || typeof relationshipId !== "string" || relationshipId.trim() === "") {
          return reply.status(400).send({
            success: false,
            error: { code: "INVALID_REQUEST", message: "Relationship ID must be a non-empty string" },
          });
        }

        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel) {
          return reply.status(404).send({
            success: false,
            error: { code: "RELATIONSHIP_NOT_FOUND", message: "Relationship not found" },
          });
        }

        reply.send({ success: true, data: rel });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "RELATIONSHIP_FETCH_FAILED",
            message: "Failed to fetch relationship",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );

  // GET /api/graph/relationship/:relationshipId/full - Relationship with resolved endpoints
  app.get(
    "/graph/relationship/:relationshipId/full",
    {
      schema: {
        params: {
          type: "object",
          properties: { relationshipId: { type: "string" } },
          required: ["relationshipId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { relationshipId } = request.params as { relationshipId: string };
        if (!relationshipId || typeof relationshipId !== "string" || relationshipId.trim() === "") {
          return reply.status(400).send({
            success: false,
            error: { code: "INVALID_REQUEST", message: "Relationship ID must be a non-empty string" },
          });
        }

        const rel = await kgService.getRelationshipById(relationshipId);
        if (!rel) {
          return reply.status(404).send({
            success: false,
            error: { code: "RELATIONSHIP_NOT_FOUND", message: "Relationship not found" },
          });
        }

        const [from, to] = await Promise.all([
          kgService.getEntity(rel.fromEntityId),
          kgService.getEntity(rel.toEntityId),
        ]);

        reply.send({ success: true, data: { relationship: rel, from, to } });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "RELATIONSHIP_FULL_FETCH_FAILED",
            message: "Failed to fetch relationship details",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );

  // Alias: /graph/relationships/:relationshipId -> /graph/relationship/:relationshipId
  app.get(
    "/graph/relationships/:relationshipId",
    async (request, reply) => {
      const params = request.params as { relationshipId: string };
      const res = await (app as any).inject({
        method: "GET",
        url: `/graph/relationship/${encodeURIComponent(params.relationshipId)}`,
      });
      reply.status(res.statusCode).send(res.body ?? res.payload);
    }
  );
  // POST /api/graph/search - Perform semantic and structural searches
  app.post(
    "/graph/search",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            query: { type: "string" },
            entityTypes: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "function",
                  "class",
                  "interface",
                  "file",
                  "module",
                  "spec",
                  "test",
                  "change",
                  "session",
                  "directory",
                ],
              },
            },
            searchType: {
              type: "string",
              enum: ["semantic", "structural", "usage", "dependency"],
            },
            filters: {
              type: "object",
              properties: {
                language: { type: "string" },
                path: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                lastModified: {
                  type: "object",
                  properties: {
                    since: { type: "string", format: "date-time" },
                    until: { type: "string", format: "date-time" },
                  },
                },
                checkpointId: { type: "string" },
              },
            },
            includeRelated: { type: "boolean" },
            limit: { type: "number" },
          },
          required: ["query"],
        },
      },
    },
    async (request, reply) => {
      try {
        const params: GraphSearchRequest = request.body as GraphSearchRequest;

        // Validate required parameters with better error handling
        if (!params || typeof params !== "object") {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "Request body must be a valid JSON object",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        if (
          !params.query ||
          (typeof params.query === "string" && params.query.trim() === "")
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "Query parameter is required and cannot be empty",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        // Ensure query is a string
        if (typeof params.query !== "string") {
          params.query = String(params.query);
        }

        // Perform the search using KnowledgeGraphService
        const entities = await kgService.search(params);

        // Get relationships if includeRelated is true
        let relationships: any[] = [];
        let clusters: any[] = [];
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
        console.error("Graph search error:", error);
        reply.status(500).send({
          success: false,
          error: {
            code: "GRAPH_SEARCH_FAILED",
            message: "Failed to perform graph search",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          requestId: (request as any).id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/graph/examples/{entityId} - Get usage examples and tests
  app.get(
    "/graph/examples/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            entityId: { type: "string" },
          },
          required: ["entityId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Validate entityId parameter
        if (
          !entityId ||
          typeof entityId !== "string" ||
          entityId.trim() === ""
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "Entity ID is required and must be a non-empty string",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        // Retrieve examples from knowledge graph
        const examples = await kgService.getEntityExamples(entityId);

        // Check if entity exists and examples exist
        if (!examples) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "ENTITY_NOT_FOUND",
              message: "Entity not found",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        // Check if examples exist
        if (
          Array.isArray(examples.usageExamples) &&
          examples.usageExamples.length === 0 &&
          Array.isArray(examples.testExamples) &&
          examples.testExamples.length === 0
        ) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "EXAMPLES_NOT_FOUND",
              message: "No examples found for the specified entity",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        reply.send({
          success: true,
          data: examples,
        });
      } catch (error) {
        console.error("Examples retrieval error:", error);
        reply.status(500).send({
          success: false,
          error: {
            code: "EXAMPLES_RETRIEVAL_FAILED",
            message: "Failed to retrieve usage examples",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          requestId: (request as any).id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/graph/dependencies/{entityId} - Analyze dependency relationships
  app.get(
    "/graph/dependencies/:entityId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            entityId: { type: "string" },
          },
          required: ["entityId"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Validate entityId parameter
        if (
          !entityId ||
          typeof entityId !== "string" ||
          entityId.trim() === ""
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "Entity ID is required and must be a non-empty string",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        // Analyze dependencies using graph queries
        const analysis = await kgService.getEntityDependencies(entityId);

        // Check if entity exists
        if (!analysis) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "ENTITY_NOT_FOUND",
              message: "Entity not found",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        // Check if analysis has any meaningful data
        if (
          (!analysis.directDependencies ||
            analysis.directDependencies.length === 0) &&
          (!analysis.indirectDependencies ||
            analysis.indirectDependencies.length === 0) &&
          (!analysis.reverseDependencies ||
            analysis.reverseDependencies.length === 0)
        ) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "DEPENDENCIES_NOT_FOUND",
              message:
                "No dependency information found for the specified entity",
            },
            requestId: (request as any).id,
            timestamp: new Date().toISOString(),
          });
        }

        reply.send({
          success: true,
          data: analysis,
        });
      } catch (error) {
        console.error("Dependency analysis error:", error);
        reply.status(500).send({
          success: false,
          error: {
            code: "DEPENDENCY_ANALYSIS_FAILED",
            message: "Failed to analyze dependencies",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          requestId: (request as any).id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/graph/entities - List all entities with filtering
  app.get(
    "/graph/entities",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            type: { type: "string" },
            language: { type: "string" },
            path: { type: "string" },
            tags: { type: "string" }, // comma-separated
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
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
          ? query.tags.split(",").map((t) => t.trim())
          : undefined;

        // Query entities from knowledge graph
        const { entities, total } = await kgService.listEntities({
          type: query.type,
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
        reply.status(500).send({
          success: false,
          error: {
            code: "ENTITIES_LIST_FAILED",
            message: "Failed to list entities",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );

  // GET /api/graph/relationships - List relationships with filtering
  app.get(
    "/graph/relationships",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            fromEntity: { type: "string" },
            toEntity: { type: "string" },
            type: { type: "string" },
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
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
          fromEntity: query.fromEntity,
          toEntity: query.toEntity,
          type: query.type,
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
        reply.status(500).send({
          success: false,
          error: {
            code: "RELATIONSHIPS_LIST_FAILED",
            message: "Failed to list relationships",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );
}
