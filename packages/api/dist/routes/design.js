/**
 * Design & Specification Routes
 * Handles spec creation, validation, and management
 */
import { v4 as uuidv4 } from "uuid";
import { SpecService } from "../../../dist/services/testing/index.js";
export function registerDesignRoutes(app, kgService, dbService) {
    const specService = new SpecService(kgService, dbService);
    // Create specification
    app.post("/design/create-spec", {
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
    }, async (request, reply) => {
        try {
            const result = await specService.createSpec(request.body);
            reply.send({
                success: true,
                data: result,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            reply.status(400);
            reply.send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    });
    // Get specification
    app.get("/design/specs/:specId", async (request, reply) => {
        try {
            const { specId } = request.params;
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
        }
        catch (error) {
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
    const registerUpdate = app.put && typeof app.put === "function"
        ? app.put.bind(app)
        : app.post.bind(app);
    registerUpdate("/design/specs/:specId", async (request, reply) => {
        try {
            const { specId } = request.params;
            const result = await specService.updateSpec(specId, request.body);
            reply.send({
                success: true,
                data: result,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            reply.status(400);
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
            const params = request.query;
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
        }
        catch (error) {
            const requestParams = request.query;
            reply.status(400);
            reply.send({
                success: false,
                data: [],
                pagination: {
                    page: 1,
                    pageSize: request.query.limit || 20,
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
        }
        catch (error) {
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
//# sourceMappingURL=design.js.map