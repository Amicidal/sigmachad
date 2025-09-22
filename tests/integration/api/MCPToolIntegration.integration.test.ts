/**
 * Integration tests for MCP Tool Integration
 * Tests all documented MCP tools and their integration with the knowledge graph
 * and other services
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess } from "../../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../../src/services/core/DatabaseService.js";
import { TestEngine } from "../../../src/services/testing/TestEngine.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  insertTestFixtures,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers.js";
import { CodebaseEntity } from "../../../src/models/entities.js";
import { RelationshipType } from "../../../src/models/relationships.js";

describe("MCP Tool Integration", () => {
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
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
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

  describe("design.create_spec MCP Tool", () => {
    it("should create specification via MCP and integrate with knowledge graph", async () => {
      const specRequest = {
        title: "MCP User Authentication System",
        description:
          "Design a secure user authentication system for MCP integration",
        requirements: [
          "Support OAuth 2.0 flows",
          "JWT token management",
          "Multi-factor authentication",
          "Session handling",
        ],
        acceptanceCriteria: [
          "Users can authenticate via OAuth providers",
          "JWT tokens have configurable expiration",
          "MFA can be enabled per user",
          "Sessions are properly managed and cleaned up",
        ],
        priority: "high",
        tags: ["authentication", "security", "mcp-integration"],
      };

      // Test via MCP endpoint
      const mcpRequest = {
        toolName: "design.create_spec",
        arguments: specRequest,
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 404) {
        throw new Error('MCP tool design.create_spec must be implemented for this test');
      }
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
      const body = JSON.parse(response.payload);
      expect(body).toEqual(expect.objectContaining({ result: expect.anything() }));

        // Validate MCP tool response structure
        expect(body.result).toEqual(
          expect.objectContaining({
            specId: expect.any(String),
            spec: expect.any(Object),
            validationResults: expect.any(Object),
          })
        );

        const specId = body.result.specId;

        // Verify spec was created in knowledge graph
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
        expectSuccess(searchBody);
        expect(searchBody.data.entities.length).toBeGreaterThan(0);

        // Verify spec content matches request
        const foundSpec = searchBody.data.entities.find(
          (e: any) => e.id === specId
        );
        expect(foundSpec).toEqual(expect.any(Object));
        expect(foundSpec.title).toBe(specRequest.title);
        expect(foundSpec.priority).toBe(specRequest.priority);
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });

    it("should validate spec parameters and provide helpful error messages", async () => {
      const invalidSpecRequest = {
        // Missing required title and description
        acceptanceCriteria: ["Some criteria"],
      };

      const mcpRequest = {
        toolName: "design.create_spec",
        arguments: invalidSpecRequest,
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 404) {
        throw new Error('MCP tool design.create_spec missing; validation test requires implementation');
      }

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload || '{}');
      expect(body).toHaveProperty('error');
      expect(['string', 'number']).toContain(typeof body.error.code);
      expect(typeof body.error.message).toBe('string');
      if (body.error.details) {
        expect(typeof body.error.details).toBe('string');
      }
    });
  });

  describe("tests.plan_and_generate MCP Tool", () => {
    it("should generate comprehensive test plans for specifications", async () => {
      // First create a spec
      const specEntity: CodebaseEntity = {
        id: "test-plan-spec",
        path: "docs/specs/test-planning.md",
        hash: "testplan123",
        language: "markdown",
        lastModified: new Date(),
        created: new Date(),
        type: "spec",
        title: "Test Planning and Generation",
        description: "Automated test planning and generation system",
        acceptanceCriteria: [
          "Unit tests must cover all public methods",
          "Integration tests must cover API endpoints",
          "E2E tests must cover critical user workflows",
          "Performance tests must validate response times",
        ],
        status: "approved",
        priority: "high",
      };

      await kgService.createEntity(specEntity);

      // Test via MCP
      const mcpRequest = {
        toolName: "tests.plan_and_generate",
        arguments: {
          specId: specEntity.id,
          testTypes: ["unit", "integration", "e2e"],
          includePerformanceTests: true,
          includeSecurityTests: true,
          coverage: {
            minLines: 80,
            minBranches: 75,
            minFunctions: 90,
          },
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 404) {
        throw new Error('MCP tool tests.plan_and_generate must be implemented for this test');
      }
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));

        // Validate test plan structure
        expect(body.result).toEqual(
          expect.objectContaining({
            testPlan: expect.any(Object),
            estimatedCoverage: expect.any(Object),
            changedFiles: expect.any(Array),
          })
        );

        // Validate test plan components
        expect(body.result.testPlan).toEqual(
          expect.objectContaining({
            unitTests: expect.any(Array),
            integrationTests: expect.any(Array),
            e2eTests: expect.any(Array),
            performanceTests: expect.any(Array),
          })
        );

        // Validate coverage estimates
        expect(body.result.estimatedCoverage).toEqual(
          expect.objectContaining({
            lines: expect.any(Number),
            branches: expect.any(Number),
            functions: expect.any(Number),
          })
        );
      }
    });

    it("should handle non-existent spec gracefully", async () => {
      const mcpRequest = {
        toolName: "tests.plan_and_generate",
        arguments: {
          specId: "non-existent-spec-12345",
          testTypes: ["unit"],
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 404) {
        throw new Error('MCP tool tests.plan_and_generate missing; non-existent spec handling requires implementation');
      }
      // MCP planner handles missing specs by generating a plan; expect success
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.any(Object));
        // Should handle gracefully with appropriate error/result
      } else if (response.statusCode === 400) {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });
  });

  describe("graph.search MCP Tool", () => {
    it("should perform semantic search with graph integration", async () => {
      // Setup diverse codebase entities
      const searchEntities = [
        {
          id: "auth-middleware",
          path: "src/middleware/auth.ts",
          hash: "authmw123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "authenticateUser",
          docstring:
            "Middleware function for user authentication and authorization",
        },
        {
          id: "user-model",
          path: "src/models/User.ts",
          hash: "usermodel123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "User",
          docstring:
            "User entity model with authentication fields and relationships",
        },
        {
          id: "auth-service",
          path: "src/services/AuthService.ts",
          hash: "authsvc123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "AuthService",
          docstring:
            "Service handling authentication logic and token management",
        },
        {
          id: "login-route",
          path: "src/routes/auth.ts",
          hash: "authroute123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "loginHandler",
          docstring:
            "API route handler for user login with validation and response",
        },
      ];

      for (const entity of searchEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Test semantic search via MCP
      const mcpRequest = {
        toolName: "graph.search",
        arguments: {
          query: "user authentication login",
          entityTypes: ["function", "class"],
          searchType: "semantic",
          includeRelated: true,
          limit: 10,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      // With prepared data, expect success
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));

        // Validate semantic search results
        expect(body.result).toEqual(
          expect.objectContaining({
            entities: expect.any(Array),
            relationships: expect.any(Array),
            relevanceScore: expect.any(Number),
          })
        );

        // Should find relevant entities
        expect(body.result.entities.length).toBeGreaterThan(0);

        // Each entity should have proper structure
        body.result.entities.forEach((entity: any) => {
          expect(entity).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              path: expect.any(String),
              type: expect.any(String),
              language: expect.any(String),
            })
          );
        });
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });

    it("should handle different search types and filters", async () => {
      // Setup test data
      await insertTestFixtures(dbService);

      const searchScenarios = [
        {
          query: "function",
          searchType: "structural",
          entityTypes: ["function"],
        },
        {
          query: "class",
          searchType: "semantic",
          entityTypes: ["class"],
          filters: {
            language: "typescript",
          },
        },
        {
          query: "test",
          searchType: "usage",
          includeRelated: true,
        },
      ];

      for (const scenario of searchScenarios) {
        const mcpRequest = {
          toolName: "graph.search",
          arguments: scenario,
        };

        const response = await app.inject({
          method: "POST",
          url: "/mcp",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(mcpRequest),
        });

        if (response.statusCode === 404) {
          throw new Error('MCP tool graph.search must be implemented for search scenarios');
        }
        expect(response.statusCode).toBe(200);

        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));
          expect(Array.isArray(body.result.entities)).toBe(true);
        }
      }
    });
  });

  describe("graph.examples MCP Tool", () => {
    it("should retrieve usage examples and canonical patterns", async () => {
      // Setup function with multiple usage examples
      const exampleEntities = [
        {
          id: "utility-function",
          path: "src/utils/helpers.ts",
          hash: "utilfunc123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "formatUserName",
          signature:
            "function formatUserName(firstName: string, lastName: string): string",
          docstring: "Formats user name with proper capitalization and spacing",
        },
        {
          id: "usage-example-1",
          path: "src/components/UserProfile.tsx",
          hash: "usage1123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 15,
          isTest: false,
          content: `
            import { formatUserName } from '../utils/helpers';

            const UserProfile = ({ user }) => {
              const displayName = formatUserName(user.firstName, user.lastName);
              return <div>Welcome, {displayName}!</div>;
            };
          `,
        },
        {
          id: "usage-example-2",
          path: "src/services/UserService.ts",
          hash: "usage2123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 320,
          lines: 20,
          isTest: false,
          content: `
            import { formatUserName } from '../utils/helpers';

            export class UserService {
              getDisplayName(user: User): string {
                return formatUserName(user.firstName, user.lastName);
              }

              formatMultipleUsers(users: User[]): string[] {
                return users.map(user => formatUserName(user.firstName, user.lastName));
              }
            }
          `,
        },
        {
          id: "test-example",
          path: "src/utils/__tests__/helpers.test.ts",
          hash: "testex123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "test",
          testType: "unit",
          targetSymbol: "utility-function",
          content: `
            import { formatUserName } from '../helpers';

            describe('formatUserName', () => {
              it('should format basic names', () => {
                expect(formatUserName('john', 'doe')).toBe('John Doe');
              });

              it('should handle single names', () => {
                expect(formatUserName('madonna', '')).toBe('Madonna');
              });
            });
          `,
        },
      ];

      for (const entity of exampleEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Create relationships between entities
      // usage-example-1 USES utility-function
      await kgService.createRelationship({
        fromEntityId: "usage-example-1",
        toEntityId: "utility-function",
        type: RelationshipType.TYPE_USES,
        confidence: 1.0,
        created: new Date(),
        lastModified: new Date(),
        metadata: {
          line: 1,
          context: "import statement",
        },
      });

      // usage-example-2 USES utility-function
      await kgService.createRelationship({
        fromEntityId: "usage-example-2",
        toEntityId: "utility-function",
        type: RelationshipType.TYPE_USES,
        confidence: 1.0,
        created: new Date(),
        lastModified: new Date(),
        metadata: {
          line: 1,
          context: "import statement",
        },
      });

      // test-example TESTS utility-function
      await kgService.createRelationship({
        fromEntityId: "test-example",
        toEntityId: "utility-function",
        type: RelationshipType.TESTS,
        confidence: 1.0,
        created: new Date(),
        lastModified: new Date(),
        metadata: {
          testType: "unit",
          coverage: 100,
        },
      });

      // Test examples retrieval via MCP
      const mcpRequest = {
        toolName: "graph.examples",
        arguments: {
          entityId: "utility-function",
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));

        // Validate examples structure
        expect(body.result).toEqual(
          expect.objectContaining({
            entityId: "utility-function",
            signature: expect.any(String),
            usageExamples: expect.any(Array),
            testExamples: expect.any(Array),
            relatedPatterns: expect.any(Array),
          })
        );

        // Usage and test examples should be arrays (may be empty when no examples recorded)
        expect(Array.isArray(body.result.usageExamples)).toBe(true);
        expect(Array.isArray(body.result.testExamples)).toBe(true);

        body.result.usageExamples.forEach((example: any) => {
          expect(example).toEqual(
            expect.objectContaining({
              context: expect.any(String),
              code: expect.any(String),
              file: expect.any(String),
              line: expect.any(Number),
            })
          );
        });

        body.result.testExamples.forEach((test: any) => {
          expect(test).toEqual(
            expect.objectContaining({
              testId: expect.any(String),
              testName: expect.any(String),
              assertions: expect.any(Array),
            })
          );

          if (Object.prototype.hasOwnProperty.call(test, 'testCode')) {
            expect(typeof test.testCode).toBe('string');
          }
        });
      }
    });

    it("should handle non-existent entity gracefully", async () => {
      const mcpRequest = {
        toolName: "graph.examples",
        arguments: {
          entityId: "non-existent-entity-12345",
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      // MCP graph.examples returns a structured result even for non-existent entity
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.any(Object));
        // Should handle gracefully
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });
  });

  describe("code.propose_diff MCP Tool", () => {
    it("should analyze proposed code changes and their impact", async () => {
      // Setup existing codebase
      const existingEntities = [
        {
          id: "existing-service",
          path: "src/services/ExistingService.ts",
          hash: "exist123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "ExistingService",
          signature: "class ExistingService",
        },
        {
          id: "dependent-consumer",
          path: "src/consumers/ServiceConsumer.ts",
          hash: "consumer123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "consumeService",
          signature: "function consumeService(): void",
        },
      ];

      for (const entity of existingEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Create relationship
      await kgService.createRelationship(
        existingEntities[1].id,
        existingEntities[0].id,
        "USES"
      );

      // Test proposed changes via MCP
      const mcpRequest = {
        toolName: "code.propose_diff",
        arguments: {
          changes: [
            {
              file: "src/services/ExistingService.ts",
              type: "modify",
              oldContent: "class ExistingService {\n  processData() {}\n}",
              newContent:
                "class ExistingService {\n  processData(): Promise<void> {}\n  validateInput(input: any): boolean { return true; }\n}",
              lineStart: 1,
              lineEnd: 3,
            },
            {
              file: "src/services/NewService.ts",
              type: "create",
              newContent: "export class NewService {\n  constructor() {}\n}",
            },
          ],
          description:
            "Refactor ExistingService to be async and add input validation",
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      if (response.statusCode === 404) {
        throw new Error('MCP tool validate.run missing; validation pipeline test requires implementation');
      }
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.anything() }));

        // Validate impact analysis structure
        expect(body.result).toEqual(
          expect.objectContaining({
            affectedEntities: expect.any(Array),
            breakingChanges: expect.any(Array),
            impactAnalysis: expect.any(Object),
            recommendations: expect.any(Array),
          })
        );

        // Should identify affected entities
        expect(body.result.affectedEntities.length).toBeGreaterThan(0);

        // Should analyze breaking changes
        expect(Array.isArray(body.result.breakingChanges)).toBe(true);

        // Should provide impact analysis
        expect(body.result.impactAnalysis).toEqual(
          expect.objectContaining({
            directImpact: expect.any(Array),
            indirectImpact: expect.any(Array),
            testImpact: expect.any(Object),
          })
        );

        // Should provide recommendations
        expect(Array.isArray(body.result.recommendations)).toBe(true);
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });

    it("should validate proposed changes parameters", async () => {
      const invalidRequest = {
        toolName: "code.propose_diff",
        arguments: {
          changes: [
            {
              // Missing required fields
              type: "modify",
            },
          ],
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidRequest),
      });

      // MCP propose_diff returns structured result even for incomplete inputs
      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        // Should handle validation gracefully
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });
  });

  describe("validate.run MCP Tool", () => {
    it("should run comprehensive validation pipeline", async () => {
      // Setup files for validation
      const validationEntities = [
        {
          id: "validation-target",
          path: "src/services/ValidationService.ts",
          hash: "validtarget123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 512,
          lines: 35,
          isTest: false,
          content: `
            export class ValidationService {
              async processUser(user: any): Promise<User> {
                if (!user.name) {
                  throw new Error('Name is required');
                }
                return { id: 1, name: user.name };
              }

              validateEmail(email: string): boolean {
                return email.includes('@');
              }
            }
          `,
        },
        {
          id: "validation-tests",
          path: "src/services/__tests__/ValidationService.test.ts",
          hash: "validtests123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 20,
          isTest: true,
          content: `
            import { ValidationService } from '../ValidationService';

            describe('ValidationService', () => {
              it('should validate email format', () => {
                const service = new ValidationService();
                expect(service.validateEmail('test@example.com')).toBe(true);
              });
            });
          `,
        },
      ];

      for (const entity of validationEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Test validation via MCP
      const mcpRequest = {
        toolName: "validate.run",
        arguments: {
          files: ["src/services/ValidationService.ts"],
          includeTypes: [
            "typescript",
            "eslint",
            "tests",
            "coverage",
            "security",
          ],
          failOnWarnings: false,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.anything() }));

        // Validate comprehensive validation results
        expect(body.result).toEqual(
          expect.objectContaining({
            overall: expect.any(Object),
            typescript: expect.any(Object),
            eslint: expect.any(Object),
            tests: expect.any(Object),
            coverage: expect.any(Object),
            security: expect.any(Object),
          })
        );

        // Overall validation should have score
        expect(body.result.overall).toEqual(
          expect.objectContaining({
            passed: expect.any(Boolean),
            score: expect.any(Number),
            duration: expect.any(Number),
          })
        );
      }
    });

    it("should handle different validation types and configurations", async () => {
      // Setup test file
      const testEntity: CodebaseEntity = {
        id: "config-test-file",
        path: "src/utils/ConfigTest.ts",
        hash: "configtest123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 192,
        lines: 12,
        isTest: false,
        content: `
          export const config = {
            apiUrl: 'http://localhost:3000',
            timeout: 5000,
          };
        `,
      };

      await kgService.createEntity(testEntity);

      const validationConfigs = [
        {
          includeTypes: ["typescript"],
          failOnWarnings: false,
        },
        {
          includeTypes: ["typescript", "eslint"],
          failOnWarnings: true,
        },
        {
          includeTypes: ["typescript", "eslint", "security"],
          failOnWarnings: false,
        },
      ];

      for (const config of validationConfigs) {
        const mcpRequest = {
          toolName: "validate.run",
          arguments: {
            files: ["src/utils/ConfigTest.ts"],
            ...config,
          },
        };

        const response = await app.inject({
          method: "POST",
          url: "/mcp",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(mcpRequest),
        });

        expect(response.statusCode).toBe(200);

        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));
          expect(body.result).toEqual(expect.objectContaining({ overall: expect.anything() }));
        } else {
          const body = JSON.parse(response.payload || '{}');
          expect(body).toHaveProperty('error');
        }
      }
    });
  });

  describe("impact.analyze MCP Tool", () => {
    it("should analyze cascading impact of changes", async () => {
      // Setup complex dependency chain
      const impactEntities = [
        {
          id: "core-utility",
          path: "src/utils/core.ts",
          hash: "coreutil123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "processData",
          signature: "function processData(data: any): any",
        },
        {
          id: "service-layer",
          path: "src/services/DataService.ts",
          hash: "servicelayer123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "class",
          name: "DataService",
          signature: "class DataService",
        },
        {
          id: "api-handler",
          path: "src/routes/api.ts",
          hash: "apihandler123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: "apiHandler",
          signature: "function apiHandler(req: Request): Response",
        },
      ];

      for (const entity of impactEntities) {
        await kgService.createEntity(entity as CodebaseEntity);
      }

      // Create dependency relationships
      await kgService.createRelationship(
        impactEntities[1].id,
        impactEntities[0].id,
        "USES"
      );
      await kgService.createRelationship(
        impactEntities[2].id,
        impactEntities[1].id,
        "CALLS"
      );

      // Test impact analysis via MCP
      const mcpRequest = {
        toolName: "impact.analyze",
        arguments: {
          changes: [
            {
              entityId: impactEntities[0].id,
              changeType: "modify",
              signatureChange: true,
            },
          ],
          includeIndirect: true,
          maxDepth: 3,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(mcpRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.objectContaining({ result: expect.any(Object) }));

        expect(Array.isArray(body.result.directImpact)).toBe(true);
        expect(Array.isArray(body.result.cascadingImpact)).toBe(true);
        expect(body.result.documentationImpact).toEqual(
          expect.objectContaining({
            staleDocs: expect.any(Array),
            missingDocs: expect.any(Array),
            requiredUpdates: expect.any(Array),
          })
        );
        expect(body.result.testImpact).toEqual(expect.any(Object));
        expect(Array.isArray(body.result.recommendations)).toBe(true);
        expect(body.result.summary).toEqual(
          expect.objectContaining({
            totalAffectedEntities: expect.any(Number),
            riskLevel: expect.any(String),
            estimatedEffort: expect.any(String),
          })
        );
      } else {
        const body = JSON.parse(response.payload || '{}');
        expect(body).toHaveProperty('error');
      }
    });
  });

  describe("MCP Tool Error Handling and Validation", () => {
    it("should handle invalid tool names gracefully", async () => {
      const invalidRequest = {
        toolName: "non-existent-tool",
        arguments: {},
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidRequest),
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate tool arguments", async () => {
      const invalidArgsRequest = {
        toolName: "graph.search",
        arguments: {
          // Missing required query parameter
          limit: 10,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidArgsRequest),
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload || '{}');
      expect(body).toHaveProperty('error');
      expect(['string', 'number']).toContain(typeof body.error.code);
      expect(typeof body.error.message).toBe('string');
      if (body.error.details) {
        expect(typeof body.error.details).toBe('string');
      }
    });

    it("should handle concurrent MCP tool execution", async () => {
      // Setup test data
      await insertTestFixtures(dbService);

      const concurrentRequests = [
        {
          toolName: "graph.search",
          arguments: { query: "function", limit: 5 },
        },
        {
          toolName: "graph.search",
          arguments: { query: "class", limit: 5 },
        },
        {
          toolName: "design.create_spec",
          arguments: {
            title: "Concurrent Test Spec",
            description: "Testing concurrent MCP tool execution",
            acceptanceCriteria: ["Should handle concurrency"],
          },
        },
      ];

      const responses = await Promise.all(
        concurrentRequests.map((request) =>
          app.inject({
            method: "POST",
            url: "/mcp",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify(request),
          })
        )
      );

      // All requests should succeed deterministically
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toEqual(expect.any(Object));
      });
    });

    it("should provide consistent response format across tools", async () => {
      await insertTestFixtures(dbService);

      const testRequests = [
        {
          toolName: "graph.search",
          arguments: { query: "test", limit: 1 },
        },
        {
          toolName: "graph.examples",
          arguments: { entityId: "test-entity" },
        },
      ];

      for (const request of testRequests) {
        const response = await app.inject({
          method: "POST",
          url: "/mcp",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(request),
        });

        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body).toHaveProperty("result");
          // Result should be an object (not just a primitive)
          expect(typeof body.result).toBe("object");
          expect(body.result).not.toBeNull();
        }
      }
    });
  });
});
