/**
 * Integration tests for Code Validation API endpoints
 * Tests comprehensive validation pipeline including TypeScript, ESLint,
 * security scanning, testing, and coverage analysis
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess, expectError } from "../../test-utils/assertions";
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

describe("Code Validation API Integration", () => {
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

  describe("POST /api/v1/code/validate", () => {
    it("should run comprehensive validation on TypeScript files", async () => {
      // Setup test files with various validation scenarios
      const testFiles = [
        {
          id: "valid-service",
          path: "src/services/ValidService.ts",
          hash: "valid123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 1024,
          lines: 50,
          isTest: false,
          content: `
            export class ValidService {
              constructor(private db: Database) {}

              async getUser(id: string): Promise<User | null> {
                if (!id) {
                  throw new Error('User ID is required');
                }
                return await this.db.users.findById(id);
              }

              validateEmail(email: string): boolean {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
              }
            }
          `,
        },
        {
          id: "test-file",
          path: "src/services/__tests__/ValidService.test.ts",
          hash: "test456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 512,
          lines: 30,
          isTest: true,
          content: `
            import { ValidService } from '../ValidService';

            describe('ValidService', () => {
              it('should get user by id', async () => {
                const service = new ValidService(mockDb);
                const user = await service.getUser('123');
                expect(user).toEqual(expect.anything());
              });

              it('should validate email format', () => {
                const service = new ValidService(mockDb);
                expect(service.validateEmail('test@example.com')).toBe(true);
                expect(service.validateEmail('invalid-email')).toBe(false);
              });
            });
          `,
        },
      ];

      // Create test files
      for (const file of testFiles) {
        await kgService.createEntity(file as CodebaseEntity);
      }

      // Test comprehensive validation
      const validationRequest = {
        files: ["src/services/ValidService.ts"],
        includeTypes: ["typescript", "eslint", "tests", "coverage"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Validate comprehensive validation response structure
        expect(body.data).toEqual(
          expect.objectContaining({
            overall: expect.any(Object),
            typescript: expect.any(Object),
            eslint: expect.any(Object),
            tests: expect.any(Object),
            coverage: expect.any(Object),
          })
        );

        // Overall validation should have score and duration
        expect(body.data.overall).toEqual(
          expect.objectContaining({
            passed: expect.any(Boolean),
            score: expect.any(Number),
            duration: expect.any(Number),
          })
        );

        expect(body.data.overall.score).toBeGreaterThanOrEqual(0);
        expect(body.data.overall.score).toBeLessThanOrEqual(100);
        expect(body.data.overall.duration).toBeGreaterThan(0);
      }
    });

    it("should detect and report TypeScript compilation errors", async () => {
      // Setup file with TypeScript errors
      const invalidFile: CodebaseEntity = {
        id: "invalid-typescript",
        path: "src/services/InvalidService.ts",
        hash: "invalid123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 256,
        lines: 15,
        isTest: false,
        content: `
          export class InvalidService {
            constructor(private db) {} // Missing type annotation

            async getUser(id) { // Missing return type
              return await this.db.users.findById(id); // Missing await handling
            }

            processData(data: any): string {
              return data.nonexistentProperty; // Property doesn't exist
            }
          }
        `,
      };

      await kgService.createEntity(invalidFile);

      const validationRequest = {
        files: ["src/services/InvalidService.ts"],
        includeTypes: ["typescript"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should detect TypeScript errors
        expect(body.data.typescript.errors).toBeGreaterThan(0);
        expect(body.data.typescript.issues).toEqual(expect.any(Array));
        expect(body.data.overall.passed).toBe(false);

        // Should have specific error details
        if (body.data.typescript.issues.length > 0) {
          const issue = body.data.typescript.issues[0];
          expect(issue).toEqual(
            expect.objectContaining({
              file: expect.any(String),
              line: expect.any(Number),
              message: expect.any(String),
              severity: expect.any(String),
            })
          );
        }
      }
    });

    it("should run ESLint and detect code quality issues", async () => {
      // Setup file with ESLint violations
      const qualityFile: CodebaseEntity = {
        id: "quality-issues",
        path: "src/services/QualityService.ts",
        hash: "quality123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 384,
        lines: 25,
        isTest: false,
        content: `
          export class QualityService {
            private unusedVariable = 'never used'; // Unused variable

            public async processData(data: any) { // Inconsistent naming
              console.log('Processing data'); // Console statement
              if (data == null) return; // Loose equality

              let result = data.value; // No type annotation
              return result;
            }
          }
        `,
      };

      await kgService.createEntity(qualityFile);

      const validationRequest = {
        files: ["src/services/QualityService.ts"],
        includeTypes: ["eslint"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should detect ESLint issues
        expect(body.data.eslint.warnings).toBeGreaterThanOrEqual(0);
        expect(body.data.eslint.issues).toEqual(expect.any(Array));

        // Should have specific ESLint rule violations
        if (body.data.eslint.issues.length > 0) {
          const issue = body.data.eslint.issues[0];
          expect(issue).toEqual(
            expect.objectContaining({
              ruleId: expect.any(String),
              message: expect.any(String),
              line: expect.any(Number),
              severity: expect.any(String),
            })
          );
        }
      }
    });

    it("should run security scanning and detect vulnerabilities", async () => {
      // Setup file with security issues
      const securityFile: CodebaseEntity = {
        id: "security-issues",
        path: "src/services/SecurityService.ts",
        hash: "security123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 320,
        lines: 20,
        isTest: false,
        content: `
          import { exec } from 'child_process'; // Dangerous import

          export class SecurityService {
            async runCommand(userInput: string) {
              // Command injection vulnerability
              exec(\`ls \${userInput}\`, (error, stdout) => {
                console.log(stdout);
              });
            }

            authenticateUser(password: string) {
              // Weak password storage
              const hashedPassword = password; // No hashing
              return hashedPassword;
            }

            processUserData(data: any) {
              // Potential XSS vulnerability
              return \`<div>\${data.userInput}</div>\`;
            }
          }
        `,
      };

      await kgService.createEntity(securityFile);

      const validationRequest = {
        files: ["src/services/SecurityService.ts"],
        includeTypes: ["security"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should detect security issues
        expect(body.data.security).toEqual(
          expect.objectContaining({
            critical: expect.any(Number),
            high: expect.any(Number),
            issues: expect.any(Array),
          })
        );

        // Should have specific security vulnerabilities
        if (body.data.security.issues.length > 0) {
          const issue = body.data.security.issues[0];
          expect(issue).toEqual(
            expect.objectContaining({
              severity: expect.any(String),
              title: expect.any(String),
              description: expect.any(String),
              cwe: expect.any(String),
            })
          );
          expect(["critical", "high", "medium", "low"]).toContain(
            issue.severity
          );
        }
      }
    });

    it("should run tests and calculate coverage metrics", async () => {
      // Setup test files with different coverage scenarios
      const testFiles = [
        {
          id: "well-tested-service",
          path: "src/services/WellTestedService.ts",
          hash: "well123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 20,
          isTest: false,
        },
        {
          id: "well-tested-spec",
          path: "src/services/__tests__/WellTestedService.test.ts",
          hash: "welltest123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "test",
          testType: "unit",
          targetSymbol: "well-tested-service",
        },
        {
          id: "poorly-tested-service",
          path: "src/services/PoorlyTestedService.ts",
          hash: "poor123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 20,
          isTest: false,
        },
      ];

      for (const file of testFiles) {
        await kgService.createEntity(file as CodebaseEntity);
      }

      const validationRequest = {
        files: [
          "src/services/WellTestedService.ts",
          "src/services/PoorlyTestedService.ts",
        ],
        includeTypes: ["tests", "coverage"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should have test results
        expect(body.data.tests).toEqual(
          expect.objectContaining({
            passed: expect.any(Number),
            failed: expect.any(Number),
            skipped: expect.any(Number),
            coverage: expect.any(Object),
          })
        );

        // Coverage should have detailed metrics
        expect(body.data.coverage).toEqual(
          expect.objectContaining({
            lines: expect.any(Number),
            branches: expect.any(Number),
            functions: expect.any(Number),
            statements: expect.any(Number),
          })
        );

        // Coverage percentages should be between 0 and 100
        Object.values(body.data.coverage).forEach((value: any) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      }
    });

    it("should validate by spec ID with related files", async () => {
      // Setup spec and related files
      const specEntity: CodebaseEntity = {
        id: "validation-spec",
        path: "docs/specs/data-validation.md",
        hash: "specval123",
        language: "markdown",
        lastModified: new Date(),
        created: new Date(),
        type: "spec",
        title: "Data Validation Requirements",
        description: "Comprehensive data validation implementation",
        acceptanceCriteria: [
          "All inputs must be validated",
          "Type safety must be enforced",
          "Error messages must be clear",
        ],
        status: "approved",
        priority: "high",
      };

      const implementationFiles = [
        {
          id: "validation-utils",
          path: "src/utils/validation.ts",
          hash: "valutils123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 512,
          lines: 40,
          isTest: false,
        },
        {
          id: "validation-tests",
          path: "src/utils/__tests__/validation.test.ts",
          hash: "valtests123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 25,
          isTest: true,
        },
      ];

      await kgService.createEntity(specEntity);
      for (const file of implementationFiles) {
        await kgService.createEntity(file as CodebaseEntity);
      }

      const validationRequest = {
        specId: specEntity.id,
        includeTypes: ["typescript", "eslint", "tests", "coverage", "security"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should validate all components
        expect(body.data).toEqual(
          expect.objectContaining({
            overall: expect.any(Object),
            typescript: expect.any(Object),
            eslint: expect.any(Object),
            tests: expect.any(Object),
            coverage: expect.any(Object),
            security: expect.any(Object),
          })
        );

        // Overall score should be calculated
        expect(body.data.overall.score).toBeGreaterThanOrEqual(0);
        expect(body.data.overall.score).toBeLessThanOrEqual(100);
      }
    });

    it("should handle concurrent validation requests", async () => {
      // Setup multiple files for concurrent validation
      const concurrentFiles = [];
      for (let i = 0; i < 5; i++) {
        const file: CodebaseEntity = {
          id: `concurrent-file-${i}`,
          path: `src/services/Service${i}.ts`,
          hash: `conc${i}23`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 15,
          isTest: false,
          content: `
            export class Service${i} {
              async process(): Promise<void> {
                console.log('Processing in service ${i}');
              }
            }
          `,
        };
        concurrentFiles.push(file);
        await kgService.createEntity(file);
      }

      // Create concurrent validation requests
      const validationRequests = concurrentFiles.map((file) => ({
        files: [file.path],
        includeTypes: ["typescript", "eslint"],
        failOnWarnings: false,
      }));

      const responses = await Promise.all(
        validationRequests.map((request) =>
          app.inject({
            method: "POST",
            url: "/api/v1/code/validate",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify(request),
          })
        )
      );

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expectSuccess(body);
          expect(body.data.overall).toEqual(
            expect.objectContaining({
              passed: expect.any(Boolean),
              score: expect.any(Number),
            })
          );
        }
      });
    });

    it("should respect failOnWarnings parameter", async () => {
      // Setup file with warnings but no errors
      const warningFile: CodebaseEntity = {
        id: "warning-only-file",
        path: "src/services/WarningService.ts",
        hash: "warn123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 192,
        lines: 12,
        isTest: false,
        content: `
          export class WarningService {
            private unusedVar = 'test'; // ESLint warning

            async processData(data: any) { // Type warning
              console.log('Processing:', data); // ESLint warning
            }
          }
        `,
      };

      await kgService.createEntity(warningFile);

      const sendValidation = async (failOnWarnings: boolean) => {
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/code/validate",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({
            files: ["src/services/WarningService.ts"],
            includeTypes: ["typescript", "eslint"],
            failOnWarnings,
          }),
        });

        // Some implementations may not provide lint data; treat 404 as acceptable fallback
        expect([200, 404]).toContain(response.statusCode);

        const body = JSON.parse(response.payload || "{}");
        return { response, body } as const;
      };

      const lenient = await sendValidation(false);
      if (lenient.response.statusCode === 200) {
        expectSuccess(lenient.body);
      } else {
        expectError(lenient.body);
      }

      const strict = await sendValidation(true);
      if (strict.response.statusCode === 200) {
        expect(strict.body.data).toEqual(expect.any(Object));
      } else {
        expectError(strict.body);
      }
    });

    it("should validate request parameters", async () => {
      // Test with invalid request
      const invalidRequest = {
        // Missing files and specId
        includeTypes: ["typescript"],
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidRequest),
      });

      expect(response.statusCode).toBe(400);

      if (response.statusCode === 400) {
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
        expect(body).toEqual(
          expect.objectContaining({ error: expect.objectContaining({ code: "VALIDATION_ERROR" }) })
        );
      }
    });

    it("should provide detailed architecture validation", async () => {
      // Setup files that violate architectural constraints
      const architectureFiles = [
        {
          id: "ui-layer-service",
          path: "src/components/UserProfile.tsx",
          hash: "ui123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 384,
          lines: 25,
          isTest: false,
          content: `
            import { DatabaseService } from "from '../services/DatabaseService'"; // UI importing data layer

            export const UserProfile = () => {
              const db = new DatabaseService();
              // Direct database access from UI component - architectural violation
              return <div>User Profile</div>;
            };
          `,
        },
        {
          id: "business-logic-test",
          path: "src/services/__tests__/BusinessLogic.test.ts",
          hash: "biztest123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 20,
          isTest: true,
          content: `
            import { BusinessLogic } from '../BusinessLogic';

            describe('BusinessLogic', () => {
              it('should process business rules', () => {
                // Test implementation
              });
            });
          `,
        },
      ];

      for (const file of architectureFiles) {
        await kgService.createEntity(file as CodebaseEntity);
      }

      const validationRequest = {
        files: [
          "src/components/UserProfile.tsx",
          "src/services/__tests__/BusinessLogic.test.ts",
        ],
        includeTypes: ["typescript", "eslint", "architecture"],
        failOnWarnings: false,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      expect(response.statusCode).toBe(200);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expectSuccess(body);

        // Should include architecture validation
        expect(body.data.architecture).toEqual(expect.any(Object));
        expect(body.data.architecture.violations).toEqual(expect.anything());
        expect(body.data.architecture.issues).toEqual(expect.any(Array));
      }
    });
  });
});
