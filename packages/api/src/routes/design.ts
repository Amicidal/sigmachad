/**
 * Design & Specification Routes
 * Handles spec creation, validation, and management
 */

import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
import { SpecService } from "../../../dist/services/testing/index.js";
import {
  CreateSpecRequest,
  UpdateSpecRequest,
  ListSpecsParams,
} from "../../../dist/services/core/index.js";

export function registerDesignRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService
): void {
  const specService = new SpecService(kgService, dbService);

  // Create specification
  app.post(
    "/design/create-spec",
    {
      schema: {
        body: {
          type: "object",
          required: ["title", "description", "acceptanceCriteria"],
          properties: {
            title: { type: "string", minLength: 1 },
            description: { type: "string", minLength: 1 },
            goals: { type: "array", items: { type: "string" } },
            acceptanceCriteria: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            assignee: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            dependencies: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  specId: { type: "string" },
                  spec: { type: "object" },
                  validationResults: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await specService.createSpec(
          request.body as CreateSpecRequest
        );
        reply.send({
          success: true,
          data: result,
          metadata: {
            requestId: request.id,
            timestamp: new Date(),
            executionTime: 0,
          },
        });
      } catch (error) {
        (reply as any).status(400);
        reply.send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  );

  // Get specification
  app.get("/design/specs/:specId", async (request, reply) => {
    try {
      const { specId } = request.params as { specId: string };
      const result = await specService.getSpec(specId);

      reply.send({
        success: true,
        data: result,
        metadata: {
          requestId: request.id,
          timestamp: new Date(),
          executionTime: 0,
        },
      });
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  });

  // Update specification
  const registerUpdate =
    (app as any).put && typeof (app as any).put === "function"
      ? (app as any).put.bind(app)
      : (app as any).post.bind(app);
  registerUpdate("/design/specs/:specId", async (request: any, reply: any) => {
    try {
      const { specId } = request.params as { specId: string };
      const result = await specService.updateSpec(
        specId,
        request.body as UpdateSpecRequest
      );

      reply.send({
        success: true,
        data: result,
        metadata: {
          requestId: request.id,
          timestamp: new Date(),
          executionTime: 0,
        },
      });
    } catch (error) {
      (reply as any).status(400);
      reply.send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  });

  // List specifications
  app.get("/design/specs", async (request, reply) => {
    try {
      const params = request.query as ListSpecsParams;
      const result = await specService.listSpecs(params);

      reply.send({
        success: true,
        data: result.specs,
        pagination: result.pagination,
        metadata: {
          requestId: request.id,
          timestamp: new Date(),
          executionTime: 0,
        },
      });
    } catch (error) {
      const requestParams = request.query;
      (reply as any).status(400);
      reply.send({
        success: false,
        data: [],
        pagination: {
          page: 1,
          pageSize: (request.query as ListSpecsParams).limit || 20,
          total: 0,
          hasMore: false,
        },
        error: {
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        metadata: {
          requestId: request.id,
          timestamp: new Date(),
          executionTime: 0,
        },
      });
    }
  });

  // POST /api/design/generate - Generate design/spec from inputs (stubbed)
  app.post("/design/generate", async (request, reply) => {
    try {
      reply.send({ success: true, data: { specId: uuidv4() } });
    } catch (error) {
      reply
        .status(500)
        .send({
          success: false,
          error: {
            code: "GENERATE_FAILED",
            message: "Failed to generate spec",
          },
        });
    }
  });
}
