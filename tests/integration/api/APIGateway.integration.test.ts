/**
 * Integration tests for API Gateway
 * Tests the complete API Gateway functionality including initialization,
 * health checks, route registration, and service integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../../src/services/core/DatabaseService.js";
import { FileWatcher } from "../../../src/services/core/FileWatcher.js";
import { ASTParser } from "../../../src/services/knowledge/ASTParser.js";
import { DocumentationParser } from "../../../src/services/knowledge/DocumentationParser.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
  insertTestFixtures,
  TEST_FIXTURE_IDS,
} from "../../test-utils/database-helpers.js";

describe("APIGateway Integration", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;
  let serverStarted = false;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase({ silent: true });
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run integration tests"
      );
    }

    // Create knowledge graph service
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);

    // Get the Fastify app
    app = apiGateway.getApp();

    // Start the server once for all tests
    await apiGateway.start();
    serverStarted = true;
  }, 30000);

  afterAll(async () => {
    if (apiGateway && serverStarted) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService, {
        includeVector: false,
        includeCache: false,
        silent: true,
      });
    }
  });

  describe("API Gateway Initialization", () => {
    it("should initialize with correct configuration", () => {
      const config = apiGateway.getConfig();

      expect(config).toEqual(expect.any(Object));
      // Port should be assigned after server starts
      expect(config.port).toBeGreaterThan(0);
      expect(config.host).toBe("0.0.0.0");
      expect(config.cors).toEqual(expect.any(Object));
      expect(config.cors.origin).toEqual(expect.anything());
      expect(config.rateLimit).toEqual(expect.any(Object));
      expect(config.rateLimit.max).toBeGreaterThan(0);
    });

    it("should have Fastify app instance", () => {
      expect(app).toEqual(expect.any(Object));
      expect(typeof app).toBe("object");
      expect(app.server).toEqual(expect.any(Object));
    });

    it("should have all required routes registered", () => {
      // Check that routes are registered by testing the route tree
      expect(app.hasRoute("GET", "/health")).toBe(true);
      expect(app.hasRoute("GET", "/docs")).toBe(true);
      expect(app.hasRoute("GET", "/api/v1/test")).toBe(true);
    });

    it("should respond on key API v1 routes via injection", async () => {
      // Validate nested routes by performing minimal requests
      // Graph search: expect 200 on valid payload (or 400 for validation in non-strict)
      await insertTestFixtures(dbService);
      const graphSearch = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ query: "function", limit: 1 })
      });
      expect(graphSearch.statusCode).toBe(200);
      const graphBody = JSON.parse(graphSearch.payload);
      expect(graphBody).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
      expect(Array.isArray(graphBody.data.entities)).toBe(true);

      // Tests: plan-and-generate
      const testPlan = await app.inject({
        method: "POST",
        url: "/api/v1/tests/plan-and-generate",
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ specId: "non-existent", testTypes: ["unit"] })
      });
      // Non-existent spec should produce 404 from REST tests route
      expect(testPlan.statusCode).toBe(404);

      // Docs endpoint should exist
      const docs = await app.inject({ method: "GET", url: "/docs" });
      expect(docs.statusCode).toBe(200);
    });
  });

  describe("Health Check Endpoint", () => {
    it("should return healthy status when all services are working", async () => {
      // Make request to health endpoint
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.status).toBe("healthy");
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
      expect(body.uptime).toBeGreaterThan(0);
      expect(body.services).toEqual(expect.any(Object));
      expect(body.mcp).toEqual(expect.any(Object));
      expect(typeof body.mcp.tools).toBe('number');
    });

    it("should include database health status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      const body = JSON.parse(response.payload);
      expect(body.services).toHaveProperty("falkordb");
      expect(body.services).toHaveProperty("qdrant");
      expect(body.services).toHaveProperty("postgresql");
      expect(body.services).toHaveProperty("redis");
    });

    it("should include MCP server status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      const body = JSON.parse(response.payload);
      expect(body.mcp).toEqual(expect.any(Object));
      expect(typeof body.mcp.tools).toBe("number");
      expect(body.mcp.validation).toEqual(expect.any(Object));
    });

    it("should return unhealthy status when critical services fail", async () => {
      // Mock a service failure scenario
      const originalHealthCheck = dbService.healthCheck;
      dbService.healthCheck = async () => ({
        falkordb: { status: "unhealthy" as const },
        qdrant: { status: "healthy" as const },
        postgresql: { status: "healthy" as const },
        redis: { status: "healthy" as const },
      });

      try {
        const response = await app.inject({
          method: "GET",
          url: "/health",
          headers: {
            "x-test-health-check": "true",
          },
        });

        expect(response.statusCode).toBe(503);

        const body = JSON.parse(response.payload);
        expect(body.status).toBe("unhealthy");
        expect(body.services.falkordb.status).toBe("unhealthy");
      } finally {
        // Restore original health check
        dbService.healthCheck = originalHealthCheck;
      }
    });
  });

  describe("CORS Configuration", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await app.inject({
        method: "OPTIONS",
        url: "/api/v1/graph/search",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
    });

    it("should include CORS headers in responses", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
        headers: {
          origin: "http://localhost:5173",
        },
      });

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("Request/Response Middleware", () => {
    it("should add request ID to all responses", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.headers["x-request-id"]).toEqual(expect.any(String));
      expect((response.headers["x-request-id"] as string).length).toBeGreaterThan(0);
    });

    it("should handle custom request IDs", async () => {
      const customRequestId = "custom-request-123";

      const response = await app.inject({
        method: "GET",
        url: "/health",
        headers: {
          "x-request-id": customRequestId,
        },
      });

      expect(response.headers["x-request-id"]).toBe(customRequestId);
    });

    it("should log requests and responses", async () => {
      // This test verifies that logging middleware is properly configured
      // In a real scenario, you might want to capture logs, but for now we verify the middleware exists
      const response = await app.inject({
        method: "GET",
        url: "/health",
        headers: {
          "x-test-health-check": "true",
        },
      });

      expect(response.statusCode).toBe(200);
      // Logging is handled by Fastify's built-in logging, so we just verify the request succeeds
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/non-existent-route",
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.payload);
      expect(body.error).toBe("Not Found");
      expect(body.message).toContain("not found");
      expect(body).toEqual(
        expect.objectContaining({
          requestId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it("should handle invalid JSON in request body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: "{ invalid json",
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return proper error format for server errors", async () => {
      // Mock an internal server error
      const originalSearch = kgService.search;
      kgService.search = async () => {
        throw new Error("Test database error");
      };

      try {
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: "test" }),
        });

        expect(response.statusCode).toBe(500);

        const body = JSON.parse(response.payload);
        expect(body.error).toEqual(expect.any(Object));
        expect(body.error.code).toBe("GRAPH_SEARCH_FAILED");
        expect(body.error.message).toContain("Failed to perform graph search");
        expect(body).toEqual(
          expect.objectContaining({
            requestId: expect.any(String),
            timestamp: expect.any(String),
          })
        );
      } finally {
        // Restore original method
        kgService.search = originalSearch;
      }
    });
  });

  describe("Route Validation", () => {
    it("should validate required fields in request body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({}), // Missing required 'query' field
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate request parameters", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/graph/examples/invalid-id",
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: "ENTITY_NOT_FOUND",
          }),
        })
      );
    });
  });

  describe("API Documentation", () => {
    it("should serve OpenAPI documentation", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");

      const body = JSON.parse(response.payload);
      expect(body).toEqual(
        expect.objectContaining({
          openapi: expect.any(String),
          info: expect.any(Object),
        })
      );
    });
  });

  describe("Test Route", () => {
    it("should return success message for test route", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/test",
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.message).toContain("Route registration is working");
      expect(body.timestamp).toEqual(expect.any(String));
    });
  });

  describe("Server Lifecycle", () => {
    it("should have server running with assigned port", () => {
      // Server is already started in beforeAll
      expect(apiGateway.getConfig().port).toBeGreaterThan(0);
      expect(app.server).toEqual(expect.any(Object));
      expect(app.server.listening).toBe(true);
    });

    it("should handle multiple start/stop cycles with fresh instances", async () => {
      // Use a new APIGateway instance per cycle to avoid reopening a closed server
      for (let i = 0; i < 2; i++) {
        const cycleGateway = new APIGateway(kgService, dbService);
        const cycleApp = cycleGateway.getApp();
        await cycleGateway.start();

        // Verify server is listening and a basic route responds
        expect(cycleGateway.getConfig().port).toBeGreaterThan(0);
        expect(cycleApp.server.listening).toBe(true);
        const resp = await cycleApp.inject({ method: 'GET', url: '/health' });
        expect(resp.statusCode).toBe(200);
        const body = JSON.parse(resp.payload || '{}');
        expect(body).toEqual(
          expect.objectContaining({
            status: 'healthy',
            services: expect.any(Object),
          })
        );

        await cycleGateway.stop();
        expect(cycleApp.server.listening).toBe(false);
      }
    });
  });
});
