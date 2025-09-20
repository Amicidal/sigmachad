/**
 * End-to-End Integration tests for API
 * Tests complete user workflows combining multiple API components
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { expectSuccess, expectError } from "../../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService.js";
import { DatabaseService } from "../../../src/services/DatabaseService.js";
import { TestEngine } from "../../../src/services/TestEngine.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  insertTestFixtures,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers.js";

describe("API End-to-End Integration", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let testEngine: TestEngine;
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
    kgService = new KnowledgeGraphService(dbService);
    testEngine = new TestEngine(kgService, dbService);

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

  describe("Complete Design-to-Implementation Workflow", () => {
    it("should handle complete design specification workflow", async () => {
      // Step 1: Create a design specification
      const designRequest = {
        title: "User Authentication System",
        description: "Design a secure user authentication system",
        requirements: [
          "Support email/password authentication",
          "Implement JWT tokens",
          "Include password reset functionality",
          "Provide user registration",
        ],
        acceptanceCriteria: [
          "Users can register with valid email",
          "Users can login with correct credentials",
          "Invalid login attempts are rejected",
          "JWT tokens expire after 24 hours",
        ],
      };

      const designResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(designRequest),
      });

      expect(designResponse.statusCode).toBe(200);

      if (
        designResponse.statusCode === 200 ||
        designResponse.statusCode === 201
      ) {
        const designBody = JSON.parse(designResponse.payload);
        expectSuccess(designBody, { specId: expect.any(String) });

        const specId = designBody.data.specId;

        // Step 2: Generate test plan for the specification
        const testPlanRequest = {
          specId,
          testTypes: ["unit", "integration", "e2e"],
          includePerformanceTests: true,
          includeSecurityTests: true,
        };

        const testPlanResponse = await app.inject({
          method: "POST",
          url: "/api/v1/tests/plan-and-generate",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(testPlanRequest),
        });

        expect(testPlanResponse.statusCode).toBe(200);

        const testPlanBody = JSON.parse(testPlanResponse.payload);
        expectSuccess(testPlanBody, { testPlan: expect.anything() });

        // Step 3: Search for related entities in the knowledge graph
        const searchRequest = {
          query: "authentication",
          entityTypes: ["spec", "function"],
          includeRelated: true,
        };

        const searchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(searchRequest),
        });

        expect(searchResponse.statusCode).toBe(200);

        const searchBody = JSON.parse(searchResponse.payload);
        expectSuccess(searchBody);

        // Step 4: Get dependency analysis for the specification
        const dependencyResponse = await app.inject({
          method: "GET",
          url: `/api/v1/graph/dependencies/${specId}`,
        });

        // Newly created specs return an empty dependency set but still succeed
        expect(dependencyResponse.statusCode).toBe(200);
        const dependencyBody = JSON.parse(dependencyResponse.payload || "{}");
        expectSuccess(dependencyBody);
        expect(dependencyBody.data).toEqual(
          expect.objectContaining({
            directDependencies: expect.any(Array),
            indirectDependencies: expect.any(Array),
            reverseDependencies: expect.any(Array),
            circularDependencies: expect.any(Array),
          })
        );
        expect(dependencyBody.data.directDependencies.length).toBe(0);
        expect(dependencyBody.data.indirectDependencies.length).toBe(0);
        expect(dependencyBody.data.reverseDependencies.length).toBe(0);
        expect(dependencyBody.data.circularDependencies.length).toBe(0);

        // Step 5: Record some test execution results
        const testResults = [
          {
            testId: "auth_unit_test_1",
            testSuite: "authentication_unit_tests",
            testName: "should validate email format",
            status: "passed" as const,
            duration: 150,
          },
          {
            testId: "auth_integration_test_1",
            testSuite: "authentication_integration_tests",
            testName: "should handle login flow",
            status: "passed" as const,
            duration: 300,
          },
        ];

        const recordResponse = await app.inject({
          method: "POST",
          url: "/api/v1/tests/record-execution",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(testResults),
        });

        expect(recordResponse.statusCode).toBe(200);

        const recordBody = JSON.parse(recordResponse.payload);
        expectSuccess(recordBody, { recorded: expect.any(Number) });
        expect(recordBody.data.recorded).toBe(2);

        // Step 6: Get performance metrics
        const performanceResponse = await app.inject({
          method: "GET",
          url: `/api/v1/tests/performance/${specId}`,
        });

        // No performance data is expected for a new spec
        expect(performanceResponse.statusCode).toBe(404);
        const perfBody = JSON.parse(performanceResponse.payload || '{}');
        expectError(perfBody);

        // Step 7: Verify overall system health
        const healthResponse = await app.inject({
          method: "GET",
          url: "/health",
        });

        expect(healthResponse.statusCode).toBe(200);

        const healthBody = JSON.parse(healthResponse.payload);
        expect(healthBody).toEqual(
          expect.objectContaining({ status: "healthy" })
        );
      }
    });
  });

  describe("Code Analysis and Testing Workflow", () => {
    it("should handle complete code analysis workflow", async () => {
      // Step 1: Analyze code (simulate by creating a code entity)
      const codeEntity = {
        id: "auth_service_ts",
        type: "function",
        name: "authenticateUser",
        path: "/src/services/authService.ts",
        language: "typescript",
        content: `
          export async function authenticateUser(email: string, password: string) {
            // Validate input
            if (!email || !password) {
              throw new Error('Email and password required');
            }

            // Check user exists
            const user = await findUserByEmail(email);
            if (!user) {
              throw new Error('User not found');
            }

            // Verify password
            const isValidPassword = await verifyPassword(password, user.passwordHash);
            if (!isValidPassword) {
              throw new Error('Invalid password');
            }

            // Generate JWT token
            const token = generateJWT(user.id);
            return { token, user: { id: user.id, email: user.email } };
          }
        `,
      };

      await kgService.createEntity(codeEntity);

      // Step 2: Search for the code entity
      const searchRequest = {
        query: "authenticateUser",
        entityTypes: ["function"],
      };

      const searchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(searchRequest),
      });

      expect(searchResponse.statusCode).toBe(200);

      const searchBody = JSON.parse(searchResponse.payload);
      expect(searchBody).toEqual(expect.objectContaining({ success: true }));
      expect(searchBody.data.entities.length).toBeGreaterThan(0);

      // Step 3: Get usage examples
      const examplesResponse = await app.inject({
        method: "GET",
        url: `/api/v1/graph/examples/${codeEntity.id}`,
      });

      expect(examplesResponse.statusCode).toBe(200);
      {
        const body = JSON.parse(examplesResponse.payload || "{}");
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(body.data).toEqual(
          expect.objectContaining({
            usageExamples: expect.any(Array),
            testExamples: expect.any(Array),
            relatedPatterns: expect.any(Array),
          })
        );
        expect(body.data.usageExamples.length).toBe(0);
        expect(body.data.testExamples.length).toBe(0);
        expect(body.data.relatedPatterns.length).toBe(0);
      }

      // Step 4: Analyze dependencies
      const dependencyResponse = await app.inject({
        method: "GET",
        url: `/api/v1/graph/dependencies/${codeEntity.id}`,
      });

      expect(dependencyResponse.statusCode).toBe(200);
      {
        const body = JSON.parse(dependencyResponse.payload || "{}");
        expect(body).toEqual(expect.objectContaining({ success: true }));
        expect(body.data).toEqual(
          expect.objectContaining({
            directDependencies: expect.any(Array),
            indirectDependencies: expect.any(Array),
            reverseDependencies: expect.any(Array),
            circularDependencies: expect.any(Array),
          })
        );
        expect(body.data.directDependencies.length).toBe(0);
        expect(body.data.indirectDependencies.length).toBe(0);
        expect(body.data.reverseDependencies.length).toBe(0);
        expect(body.data.circularDependencies.length).toBe(0);
      }

      // Step 5: Generate tests for this function
      const testSpec = {
        id: "auth_service_spec",
        type: "spec",
        title: "Authentication Service Tests",
        acceptanceCriteria: [
          "Should validate email and password parameters",
          "Should reject invalid credentials",
          "Should return JWT token for valid login",
          "Should handle user not found error",
        ],
      };

      await kgService.createEntity(testSpec);

      const testPlanRequest = {
        specId: testSpec.id,
        testTypes: ["unit", "integration"],
        includePerformanceTests: true,
      };

      const testPlanResponse = await app.inject({
        method: "POST",
        url: "/api/v1/tests/plan-and-generate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(testPlanRequest),
      });

      expect(testPlanResponse.statusCode).toBe(200);

      // Step 6: Record test execution
      const testResults = [
        {
          testId: "auth_validate_params",
          testSuite: "auth_unit_tests",
          testName: "should validate required parameters",
          status: "passed" as const,
          duration: 50,
        },
        {
          testId: "auth_invalid_credentials",
          testSuite: "auth_unit_tests",
          testName: "should reject invalid credentials",
          status: "passed" as const,
          duration: 75,
        },
      ];

      const recordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/tests/record-execution",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(testResults),
      });

      expect(recordResponse.statusCode).toBe(200);

      // Step 7: Get coverage analysis
      const coverageResponse = await app.inject({
        method: "GET",
        url: `/api/v1/tests/coverage/${codeEntity.id}`,
      });

      expect(coverageResponse.statusCode).toBe(200);
      if (coverageResponse.statusCode === 404) {
        const body = JSON.parse(coverageResponse.payload || '{}');
        expect(body).toEqual(expect.objectContaining({ success: false }));
      }
    });
  });

  describe("Multi-User Concurrent Workflow", () => {
    it("should handle multiple users working concurrently", async () => {
      const userCount = 3;
      const workflows = [];

      for (let i = 0; i < userCount; i++) {
        const userWorkflow = async (userId: number) => {
          // User creates a specification
          const specRequest = {
            title: `User ${userId} Feature`,
            description: `Feature requested by user ${userId}`,
            acceptanceCriteria: [
              `Should work for user ${userId}`,
              `Should handle user ${userId} data`,
            ],
          };

          const specResponse = await app.inject({
            method: "POST",
            url: "/api/v1/design/create-spec",
            headers: {
              "content-type": "application/json",
              "x-user-id": `user-${userId}`,
            },
            payload: JSON.stringify(specRequest),
          });

          if (
            specResponse.statusCode === 200 ||
            specResponse.statusCode === 201
          ) {
            const specBody = JSON.parse(specResponse.payload);
            const specId = specBody.data.specId;

            // User searches for related work
            const searchRequest = {
              query: `user ${userId}`,
              limit: 5,
            };

            const searchResponse = await app.inject({
              method: "POST",
              url: "/api/v1/graph/search",
              headers: {
                "content-type": "application/json",
                "x-user-id": `user-${userId}`,
              },
              payload: JSON.stringify(searchRequest),
            });

            // User records test results
            const testResults = [
              {
                testId: `user_${userId}_test_1`,
                testSuite: `user_${userId}_tests`,
                testName: `User ${userId} test case`,
                status: "passed" as const,
                duration: 100 + userId * 10,
              },
            ];

            const recordResponse = await app.inject({
              method: "POST",
              url: "/api/v1/tests/record-execution",
              headers: {
                "content-type": "application/json",
                "x-user-id": `user-${userId}`,
              },
              payload: JSON.stringify(testResults),
            });

            return {
              userId,
              specCreated:
                specResponse.statusCode === 200 ||
                specResponse.statusCode === 201,
              searchWorked: searchResponse.statusCode === 200,
              testsRecorded: recordResponse.statusCode === 200,
            };
          }

          return {
            userId,
            specCreated: false,
            searchWorked: false,
            testsRecorded: false,
          };
        };

        workflows.push(userWorkflow(i + 1));
      }

      const results = await Promise.all(workflows);

      // Verify all users could complete their workflows
      results.forEach((result) => {
        expect(result).toEqual(
          expect.objectContaining({
            specCreated: true,
            searchWorked: true,
            testsRecorded: true,
          })
        );
      });
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle partial failures gracefully", async () => {
      // Step 1: Create a specification
      const specRequest = {
        title: "Resilient Feature",
        description: "Test error recovery",
        acceptanceCriteria: ["Should handle errors gracefully"],
      };

      const specResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(specRequest),
      });

      expect(specResponse.statusCode).toBe(200);

      if (specResponse.statusCode === 200 || specResponse.statusCode === 201) {
        const specBody = JSON.parse(specResponse.payload);
        const specId = specBody.data.specId;

        // Step 2: Try operations that might fail
        const operations = [
          // Valid search
          app.inject({
            method: "POST",
            url: "/api/v1/graph/search",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({ query: "test" }),
          }),
          // Invalid search (missing query)
          app.inject({
            method: "POST",
            url: "/api/v1/graph/search",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({}),
          }),
          // Valid test plan
          app.inject({
            method: "POST",
            url: "/api/v1/tests/plan-and-generate",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({ specId }),
          }),
          // Invalid test plan (non-existent spec)
          app.inject({
            method: "POST",
            url: "/api/v1/tests/plan-and-generate",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({ specId: "non-existent" }),
          }),
        ];

        const results = await Promise.all(operations);
        const successCount = results.filter(
          (r) => r.statusCode === 200 || r.statusCode === 201
        ).length;
        const errorCount = results.filter((r) => r.statusCode >= 400).length;

        // Should have both successes and expected failures
        expect(successCount).toBeGreaterThan(0);
        expect(errorCount).toBeGreaterThan(0);
        expect(successCount + errorCount).toBe(operations.length);

        // Step 3: Verify system remains healthy after errors
        const healthResponse = await app.inject({
          method: "GET",
          url: "/health",
        });

        expect(healthResponse.statusCode).toBe(200);

        const healthBody = JSON.parse(healthResponse.payload);
        expect(healthBody.status).toBe("healthy");
      }
    });
  });

  describe("Performance Under Load", () => {
    it("should handle sustained concurrent load", async () => {
      const concurrentUsers = 5;
      const requestsPerUser = 10;
      const operations = [];

      // Create multiple users performing various operations
      for (let user = 0; user < concurrentUsers; user++) {
        for (let request = 0; request < requestsPerUser; request++) {
          const operationType = request % 4;

          switch (operationType) {
            case 0:
              // Health check
              operations.push(
                app.inject({
                  method: "GET",
                  url: "/health",
                })
              );
              break;
            case 1:
              // Graph search
              operations.push(
                app.inject({
                  method: "POST",
                  url: "/api/v1/graph/search",
                  headers: { "content-type": "application/json" },
                  payload: JSON.stringify({
                    query: `load_test_${user}_${request}`,
                  }),
                })
              );
              break;
            case 2:
              // List entities
              operations.push(
                app.inject({
                  method: "GET",
                  url: "/api/v1/graph/entities?limit=5",
                })
              );
              break;
            case 3:
              // Test plan generation (use a dummy spec ID)
              operations.push(
                app.inject({
                  method: "POST",
                  url: "/api/v1/tests/plan-and-generate",
                  headers: { "content-type": "application/json" },
                  payload: JSON.stringify({
                    specId: `load_spec_${user}_${request}`,
                  }),
                })
              );
              break;
          }
        }
      }

      const startTime = Date.now();
      const responses = await Promise.all(operations);
      const endTime = Date.now();

      const totalDuration = endTime - startTime;
      const totalRequests = concurrentUsers * requestsPerUser;
      const successRate =
        responses.filter((r) => r.statusCode < 400).length / totalRequests;

      // Performance expectations (relaxed for test environment)
      expect(totalDuration).toBeLessThan(60000); // 60 seconds max for all operations
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate

      // Verify system health after load test
      const healthResponse = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(healthResponse.statusCode).toBe(200);
    });
  });

  describe("Data Consistency Across Operations", () => {
    it("should maintain data consistency across create-read-update workflows", async () => {
      // Step 1: Create a specification
      const specRequest = {
        title: "Consistency Test Spec",
        description: "Test data consistency across operations",
        acceptanceCriteria: [
          "Data should be consistent across all operations",
          "Updates should be reflected in subsequent reads",
        ],
      };

      const createResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(specRequest),
      });

      expect(createResponse.statusCode).toBe(200);

      if (
        createResponse.statusCode === 200 ||
        createResponse.statusCode === 201
      ) {
        const createBody = JSON.parse(createResponse.payload);
        const specId = createBody.data.specId;

        // Step 2: Read the specification via search
        const searchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: specId }),
        });

        expect(searchResponse.statusCode).toBe(200);

        const searchBody = JSON.parse(searchResponse.payload);
        expect(searchBody.data.entities.length).toBeGreaterThan(0);

        const foundSpec = searchBody.data.entities.find(
          (e: any) => e.id === specId
        );
        expect(foundSpec).toEqual(expect.any(Object));
        expect(foundSpec.title).toBe(specRequest.title);

        // Step 3: Generate tests for the specification
        const testPlanRequest = {
          specId,
          testTypes: ["unit"],
        };

        const testPlanResponse = await app.inject({
          method: "POST",
          url: "/api/v1/tests/plan-and-generate",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(testPlanRequest),
        });

        expect(testPlanResponse.statusCode).toBe(200);

        // Step 4: Record test execution
        const testResults = [
          {
            testId: "consistency_test_1",
            testSuite: "consistency_tests",
            testName: "should maintain data consistency",
            status: "passed" as const,
            duration: 100,
          },
        ];

        const recordResponse = await app.inject({
          method: "POST",
          url: "/api/v1/tests/record-execution",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(testResults),
        });

        expect(recordResponse.statusCode).toBe(200);

        // Step 5: Verify data consistency by searching again
        const finalSearchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: specId }),
        });

        expect(finalSearchResponse.statusCode).toBe(200);

        const finalSearchBody = JSON.parse(finalSearchResponse.payload);
        const finalSpec = finalSearchBody.data.entities.find(
          (e: any) => e.id === specId
        );
        expect(finalSpec).toEqual(expect.any(Object));
        expect(finalSpec.title).toBe(specRequest.title);

        // Step 6: Get performance metrics (should work even if no data)
        const performanceResponse = await app.inject({
          method: "GET",
          url: `/api/v1/tests/performance/${specId}`,
        });

        expect([200, 404]).toContain(performanceResponse.statusCode);
        const body = JSON.parse(performanceResponse.payload || '{}');
        if (performanceResponse.statusCode === 200) {
          expect(body).toEqual(
            expect.objectContaining({
              success: true,
              data: expect.objectContaining({
                metrics: expect.any(Object),
                history: expect.any(Array),
              }),
            })
          );
        } else {
          expect(body).toEqual(expect.objectContaining({ success: false }));
        }
      }
    });
  });
});
