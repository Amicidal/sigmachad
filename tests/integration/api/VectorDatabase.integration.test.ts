/**
 * Integration tests for Vector Database API endpoints
 * Tests semantic search, vector embeddings, and cross-database operations
 * between FalkorDB (graph) and Qdrant (vector)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess, expectError } from "../../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "@memento/api/APIGateway";
import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/database/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  insertTestFixtures,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers.js";
import { CodebaseEntity } from "@memento/shared-types";

describe("Vector Database API Integration", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run integration tests"
      );
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  describe("POST /api/v1/vdb/search", () => {
    it("should perform semantic search with vector similarity", async () => {
      // Setup test data with semantic content
      const testEntities = [
        {
          id: "auth-service",
          path: "src/services/AuthService.ts",
          hash: "auth123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "AuthService",
          signature: "class AuthService",
          docstring: "Handles user authentication and authorization logic",
        },
        {
          id: "user-model",
          path: "src/models/User.ts",
          hash: "user123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "User",
          signature: "class User",
          docstring: "User entity model with authentication fields",
        },
        {
          id: "login-function",
          path: "src/services/AuthService.ts",
          hash: "login123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "loginUser",
          signature:
            "async function loginUser(email: string, password: string): Promise<User>",
          docstring:
            "Authenticates user with email and password, returns user object",
        },
      ];

      // Create entities in knowledge graph
      for (const entity of testEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Test semantic search
      const searchRequest = {
        query: "user authentication login",
        entityTypes: ["function", "class"],
        similarity: 0.7,
        limit: 5,
        includeMetadata: true,
        filters: {
          language: "typescript",
          lastModified: {
            since: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(searchRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Validate semantic search response structure
        expect(body.data).toEqual(
          expect.objectContaining({
            results: expect.any(Array),
            metadata: expect.any(Object),
          })
        );

        expect(body.data.metadata).toEqual(
          expect.objectContaining({
            totalResults: expect.any(Number),
            searchTime: expect.any(Number),
            indexSize: expect.any(Number),
          })
        );

        // Each result should have similarity score and metadata
        if (body.data.results.length > 0) {
          const result = body.data.results[0];
          expect(result).toEqual(
            expect.objectContaining({
              entity: expect.any(Object),
              similarity: expect.any(Number),
              context: expect.any(String),
              highlights: expect.any(Array),
            })
          );
          expect(result.similarity).toBeGreaterThan(0);
          expect(result.similarity).toBeLessThanOrEqual(1);
        }
      }
    });

    it("should handle different similarity thresholds", async () => {
      // Setup diverse content
      const diverseEntities = [
        {
          id: "payment-service",
          path: "src/services/PaymentService.ts",
          hash: "pay123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "PaymentService",
          docstring: "Handles payment processing and transaction management",
        },
        {
          id: "email-service",
          path: "src/services/EmailService.ts",
          hash: "email123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "EmailService",
          docstring: "Manages email sending and template processing",
        },
        {
          id: "auth-middleware",
          path: "src/middleware/auth.ts",
          hash: "authmw123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "authenticate",
          docstring: "Middleware function for JWT token authentication",
        },
      ];

      for (const entity of diverseEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Test with high similarity threshold
      const highSimilarityRequest = {
        query: "payment processing",
        similarity: 0.9, // Very strict threshold
        limit: 10,
      };

      const highSimilarityResponse = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(highSimilarityRequest),
      });

      if (highSimilarityResponse.statusCode === 404) {
        throw new Error('Vector DB search endpoint missing; similarity thresholds test requires implementation');
      }
      expect(highSimilarityResponse.statusCode).toBe(200);

      if (highSimilarityResponse.statusCode === 200) {
        const highBody = JSON.parse(highSimilarityResponse.payload);
        expectSuccess(highBody);

        // Should return fewer results with high threshold
        const highThresholdResults = highBody.data.results.length;

        // Test with low similarity threshold
        const lowSimilarityRequest = {
          query: "payment processing",
          similarity: 0.1, // Very loose threshold
          limit: 10,
        };

        const lowSimilarityResponse = await app.inject({
          method: "POST",
          url: "/api/v1/vdb/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(lowSimilarityRequest),
        });

        expect(lowSimilarityResponse.statusCode).toBe(200);
        const lowBody = JSON.parse(lowSimilarityResponse.payload);
        expectSuccess(lowBody);

        // Lower threshold should return more or equal results
        expect(lowBody.data.results.length).toBeGreaterThanOrEqual(
          highThresholdResults
        );

        // All results should meet their respective thresholds
        highBody.data.results.forEach((result: any) => {
          expect(result.similarity).toBeGreaterThanOrEqual(0.9);
        });

        lowBody.data.results.forEach((result: any) => {
          expect(result.similarity).toBeGreaterThanOrEqual(0.1);
        });
      } else {
        const highBody = JSON.parse(highSimilarityResponse.payload || '{}');
        expectError(highBody);
      }
    });

    it("should support entity type filtering in semantic search", async () => {
      // Setup mixed entity types
      const mixedEntities = [
        {
          id: "user-interface",
          path: "src/components/UserInterface.tsx",
          hash: "ui123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "UserInterface",
          docstring: "React component for user interface display",
        },
        {
          id: "api-route",
          path: "src/routes/user.ts",
          hash: "route123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "getUser",
          docstring: "API route handler for fetching user data",
        },
        {
          id: "database-model",
          path: "src/models/UserModel.ts",
          hash: "model123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "UserModel",
          docstring: "Database model for user entity",
        },
      ];

      for (const entity of mixedEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Search for functions only
      const functionSearchRequest = {
        query: "user data",
        entityTypes: ["function"],
        limit: 5,
      };

      const functionResponse = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(functionSearchRequest),
      });

      if (functionResponse.statusCode === 404) {
        throw new Error('Vector DB search endpoint missing; entity type filtering test requires implementation');
      }
      expect(functionResponse.statusCode).toBe(200);

      if (functionResponse.statusCode === 200) {
        const functionBody = JSON.parse(functionResponse.payload);
        expectSuccess(functionBody);

        // All results should be functions
        functionBody.data.results.forEach((result: any) => {
          expect(result.entity.kind).toBe("function");
        });

        // Search for classes only
        const classSearchRequest = {
          query: "user data",
          entityTypes: ["class"],
          limit: 5,
        };

        const classResponse = await app.inject({
          method: "POST",
          url: "/api/v1/vdb/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(classSearchRequest),
        });

        expect(classResponse.statusCode).toBe(200);
        const classBody = JSON.parse(classResponse.payload);
        expectSuccess(classBody);

        // All results should be classes
        classBody.data.results.forEach((result: any) => {
          expect(result.entity.kind).toBe("class");
        });
      } else {
        const body = JSON.parse(functionResponse.payload || '{}');
        expectError(body);
      }
    });

    it("should handle empty search results gracefully", async () => {
      const searchRequest = {
        query: "nonexistent-concept-xyz-12345",
        limit: 5,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(searchRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);
        expect(body.data.results).toEqual([]);
        expect(body.data.metadata.totalResults).toBe(0);
      }
    });

    it("should validate search request parameters", async () => {
      // Test with missing query
      const invalidRequest = {
        entityTypes: ["function"],
        limit: 5,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidRequest),
      });

      expect(response.statusCode).toBe(400);

      if (response.statusCode === 400) {
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
        expect(body.error).toEqual(expect.any(Object));
      }
    });

    it("should support metadata filtering in semantic search", async () => {
      // Setup entities with different metadata
      const metadataEntities = [
        {
          id: "old-service",
          path: "src/services/OldService.ts",
          hash: "old123",
          language: "typescript",
          lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          type: "symbol",
          kind: "class",
          name: "OldService",
          docstring: "Legacy service for data processing",
        },
        {
          id: "new-service",
          path: "src/services/NewService.ts",
          hash: "new123",
          language: "typescript",
          lastModified: new Date(), // Today
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "NewService",
          docstring: "Modern service for data processing",
        },
      ];

      for (const entity of metadataEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Search with time range filter
      const filteredSearchRequest = {
        query: "data processing",
        filters: {
          lastModified: {
            since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        limit: 5,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/vdb/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(filteredSearchRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should only return recently modified entities
        body.data.results.forEach((result: any) => {
          const lastModified = new Date(result.entity.lastModified);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          expect(lastModified.getTime()).toBeGreaterThan(
            sevenDaysAgo.getTime()
          );
        });
      }
    });

    it("should handle concurrent semantic search requests", async () => {
      // Setup test data
      const concurrentEntities = [];
      for (let i = 0; i < 10; i++) {
        const entity = {
          id: `concurrent-entity-${i}`,
          path: `src/services/Service${i}.ts`,
          hash: `conc${i}23`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: `Service${i}`,
          docstring: `Service ${i} for concurrent testing with shared functionality`,
        };
        concurrentEntities.push(entity);
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Create multiple concurrent search requests
      const searchRequests = [];
      for (let i = 0; i < 5; i++) {
        searchRequests.push(
          app.inject({
            method: "POST",
            url: "/api/v1/vdb/search",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify({
              query: "concurrent testing shared functionality",
              limit: 5,
            }),
          })
        );
      }

      const responses = await Promise.all(searchRequests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expectSuccess(body);
        }
      });
    });
  });
});
