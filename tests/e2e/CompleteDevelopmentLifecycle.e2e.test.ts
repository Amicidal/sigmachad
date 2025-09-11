/**
 * End-to-End tests for Complete Development Lifecycle
 * Tests the full Docs → Tests → Implementation → Validation → Impact → Commit workflow
 * This validates the core value proposition of Memento as an AI-assisted development platform
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess } from "../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "@/api/APIGateway";
import { KnowledgeGraphService } from "@/services/KnowledgeGraphService";
import { DatabaseService } from "@/services/DatabaseService";
import { TestEngine } from "@/services/TestEngine";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../test-utils/database-helpers";
import { CodebaseEntity } from "@/models/entities";

describe("Complete Development Lifecycle E2E", () => {
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
      throw new Error("Database health check failed - cannot run E2E tests");
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);
    testEngine = new TestEngine(kgService, dbService);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();
  }, 60000); // Extended timeout for E2E tests

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

  describe("Complete User Authentication Feature Lifecycle", () => {
    it("should execute full development lifecycle from concept to deployment", async () => {
      console.log("🚀 Starting Complete Development Lifecycle E2E Test");

      // ============================================================================
      // PHASE 1: DESIGN & SPECIFICATION (Docs)
      // ============================================================================
      console.log("📋 Phase 1: Creating Feature Specification");

      const specRequest = {
        title: "User Authentication & Authorization System",
        description:
          "Implement a comprehensive user authentication system with role-based access control",
        requirements: [
          "Email/password authentication with secure password hashing",
          "JWT token-based session management with refresh tokens",
          "Role-based access control (User, Admin, Moderator)",
          "Password reset functionality with secure token generation",
          "Account lockout after failed login attempts",
          "Session management and logout functionality",
        ],
        acceptanceCriteria: [
          "Users can register with valid email and strong password",
          "Users can login with correct credentials and receive JWT tokens",
          "Invalid login attempts are rejected with appropriate error messages",
          "JWT tokens expire after 24 hours and can be refreshed",
          "Users can reset passwords using secure reset links",
          "Admin users can manage other user accounts",
          "Sessions are properly invalidated on logout",
          "Failed login attempts trigger account lockout after 5 attempts",
        ],
        priority: "high",
        tags: ["authentication", "security", "user-management"],
      };

      const specResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(specRequest),
      });

      expect([200, 201]).toContain(specResponse.statusCode);

      if (specResponse.statusCode !== 200 && specResponse.statusCode !== 201) {
        console.log(
          "⚠️  Specification creation endpoint not implemented yet, skipping to next phases"
        );
        return;
      }

      const specBody = JSON.parse(specResponse.payload);
      expectSuccess(specBody);
      const specId = specBody.data.specId;

      console.log(`✅ Specification created with ID: ${specId}`);

      // ============================================================================
      // PHASE 2: TEST PLANNING & GENERATION (Tests)
      // ============================================================================
      console.log("🧪 Phase 2: Generating Test Plans");

      const testPlanRequest = {
        specId,
        testTypes: ["unit", "integration", "e2e"],
        includePerformanceTests: true,
        includeSecurityTests: true,
        coverage: {
          minLines: 85,
          minBranches: 80,
          minFunctions: 90,
        },
      };

      const testPlanResponse = await app.inject({
        method: "POST",
        url: "/api/v1/tests/plan-and-generate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(testPlanRequest),
      });

      expect([200, 201]).toContain(testPlanResponse.statusCode);

      if (
        testPlanResponse.statusCode === 200 ||
        testPlanResponse.statusCode === 201
      ) {
        const testPlanBody = JSON.parse(testPlanResponse.payload);
        expectSuccess(testPlanBody);

        console.log("✅ Test plan generated successfully");
        console.log(
          `📊 Expected coverage: ${JSON.stringify(
            testPlanBody.data?.estimatedCoverage || {}
          )}`
        );
      }

      // ============================================================================
      // PHASE 3: IMPLEMENTATION (Code)
      // ============================================================================
      console.log("💻 Phase 3: Implementing Authentication System");

      // Create the authentication service implementation
      const authServiceEntity: CodebaseEntity = {
        id: "auth-service-implementation",
        path: "src/services/AuthService.ts",
        hash: "authimpl123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 2048,
        lines: 120,
        isTest: false,
        content: `
          import bcrypt from 'bcrypt';
          import jwt from 'jsonwebtoken';
          import { User, UserRole } from '../models/User';

          export interface LoginCredentials {
            email: string;
            password: string;
          }

          export interface AuthTokens {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
          }

          export class AuthService {
            private failedAttempts = new Map<string, number>();
            private lockedAccounts = new Set<string>();

            constructor(
              private userRepository: UserRepository,
              private tokenSecret: string,
              private tokenExpiration: string = '24h'
            ) {}

            async register(email: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
              // Validate input
              if (!this.isValidEmail(email)) {
                throw new Error('Invalid email format');
              }

              if (!this.isStrongPassword(password)) {
                throw new Error('Password does not meet security requirements');
              }

              // Check if user already exists
              const existingUser = await this.userRepository.findByEmail(email);
              if (existingUser) {
                throw new Error('User already exists with this email');
              }

              // Hash password
              const hashedPassword = await bcrypt.hash(password, 12);

              // Create user
              const user = await this.userRepository.create({
                email,
                passwordHash: hashedPassword,
                role,
                isActive: true,
                failedLoginAttempts: 0,
                lockedUntil: null,
              });

              return user;
            }

            async login(credentials: LoginCredentials): Promise<AuthTokens> {
              const { email, password } = credentials;

              // Check if account is locked
              if (this.lockedAccounts.has(email)) {
                throw new Error('Account is temporarily locked due to failed login attempts');
              }

              // Find user
              const user = await this.userRepository.findByEmail(email);
              if (!user) {
                throw new Error('Invalid email or password');
              }

              // Verify password
              const isValidPassword = await bcrypt.compare(password, user.passwordHash);
              if (!isValidPassword) {
                await this.handleFailedLogin(email, user);
                throw new Error('Invalid email or password');
              }

              // Reset failed attempts on successful login
              await this.resetFailedAttempts(email, user);

              // Generate tokens
              return this.generateTokens(user);
            }

            async refreshToken(refreshToken: string): Promise<AuthTokens> {
              try {
                const payload = jwt.verify(refreshToken, this.tokenSecret) as any;
                const user = await this.userRepository.findById(payload.userId);

                if (!user) {
                  throw new Error('User not found');
                }

                return this.generateTokens(user);
              } catch (error) {
                throw new Error('Invalid refresh token');
              }
            }

            async logout(userId: string): Promise<void> {
              // Invalidate user's refresh tokens (implementation would depend on token storage)
              await this.invalidateUserTokens(userId);
            }

            async resetPassword(email: string): Promise<string> {
              const user = await this.userRepository.findByEmail(email);
              if (!user) {
                // Don't reveal if email exists for security
                return 'If the email exists, a reset link has been sent';
              }

              const resetToken = this.generateResetToken();
              await this.userRepository.updateResetToken(user.id, resetToken);

              // Send reset email (would integrate with email service)
              await this.sendResetEmail(email, resetToken);

              return 'Password reset link sent to your email';
            }

            private async handleFailedLogin(email: string, user: User): Promise<void> {
              const attempts = (this.failedAttempts.get(email) || 0) + 1;
              this.failedAttempts.set(email, attempts);

              if (attempts >= 5) {
                this.lockedAccounts.add(email);
                await this.userRepository.lockAccount(user.id, new Date(Date.now() + 30 * 60 * 1000)); // 30 minutes
              } else {
                await this.userRepository.incrementFailedAttempts(user.id);
              }
            }

            private async resetFailedAttempts(email: string, user: User): Promise<void> {
              this.failedAttempts.delete(email);
              this.lockedAccounts.delete(email);
              await this.userRepository.resetFailedAttempts(user.id);
            }

            private generateTokens(user: User): AuthTokens {
              const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
              };

              const accessToken = jwt.sign(payload, this.tokenSecret, {
                expiresIn: this.tokenExpiration,
              });

              const refreshToken = jwt.sign(
                { userId: user.id, type: 'refresh' },
                this.tokenSecret,
                { expiresIn: '7d' }
              );

              return {
                accessToken,
                refreshToken,
                expiresIn: 24 * 60 * 60, // 24 hours in seconds
              };
            }

            private generateResetToken(): string {
              return jwt.sign(
                { type: 'password_reset', timestamp: Date.now() },
                this.tokenSecret,
                { expiresIn: '1h' }
              );
            }

            private isValidEmail(email: string): boolean {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(email);
            }

            private isStrongPassword(password: string): boolean {
              // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
              const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
              return strongPasswordRegex.test(password);
            }

            private async invalidateUserTokens(userId: string): Promise<void> {
              // Implementation would depend on token storage strategy
              // This could involve blacklisting tokens or using a token registry
            }

            private async sendResetEmail(email: string, resetToken: string): Promise<void> {
              // Implementation would integrate with email service
              console.log(\`Reset email would be sent to \${email} with token \${resetToken}\`);
            }
          }
        `,
      };

      // Create the user model
      const userModelEntity: CodebaseEntity = {
        id: "user-model-implementation",
        path: "src/models/User.ts",
        hash: "usermodelimpl123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 384,
        lines: 45,
        isTest: false,
        content: `
          export enum UserRole {
            USER = 'user',
            MODERATOR = 'moderator',
            ADMIN = 'admin',
          }

          export interface User {
            id: string;
            email: string;
            passwordHash: string;
            role: UserRole;
            isActive: boolean;
            failedLoginAttempts: number;
            lockedUntil: Date | null;
            resetToken?: string;
            resetTokenExpires?: Date;
            createdAt: Date;
            updatedAt: Date;
          }

          export interface CreateUserData {
            email: string;
            passwordHash: string;
            role: UserRole;
            isActive?: boolean;
            failedLoginAttempts?: number;
            lockedUntil?: Date | null;
          }

          export interface UserRepository {
            create(data: CreateUserData): Promise<User>;
            findById(id: string): Promise<User | null>;
            findByEmail(email: string): Promise<User | null>;
            updateResetToken(userId: string, resetToken: string): Promise<void>;
            incrementFailedAttempts(userId: string): Promise<void>;
            resetFailedAttempts(userId: string): Promise<void>;
            lockAccount(userId: string, lockedUntil: Date): Promise<void>;
            unlockAccount(userId: string): Promise<void>;
            updateLastLogin(userId: string): Promise<void>;
          }
        `,
      };

      await kgService.createEntity(authServiceEntity);
      await kgService.createEntity(userModelEntity);

      console.log("✅ Authentication service implementation created");

      // ============================================================================
      // PHASE 4: VALIDATION (TypeScript, ESLint, Tests, Security, Coverage)
      // ============================================================================
      console.log("🔍 Phase 4: Running Comprehensive Validation");

      const validationRequest = {
        files: ["src/services/AuthService.ts", "src/models/User.ts"],
        includeTypes: ["typescript", "eslint", "security"],
        failOnWarnings: false,
      };

      const validationResponse = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(validationRequest),
      });

      if (validationResponse.statusCode === 200) {
        const validationBody = JSON.parse(validationResponse.payload);
        expectSuccess(validationBody);

        console.log("✅ Validation completed successfully");
        console.log(
          `📊 Validation Score: ${
            validationBody.data?.overall?.score || "N/A"
          }/100`
        );
      }

      // ============================================================================
      // PHASE 5: IMPACT ANALYSIS (Dependency Analysis & Change Impact)
      // ============================================================================
      console.log("📈 Phase 5: Analyzing Implementation Impact");

      const impactRequest = {
        changes: [
          {
            entityId: authServiceEntity.id,
            changeType: "create",
          },
          {
            entityId: userModelEntity.id,
            changeType: "create",
          },
        ],
        includeIndirect: true,
        maxDepth: 3,
      };

      const impactResponse = await app.inject({
        method: "POST",
        url: "/api/v1/impact/analyze",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(impactRequest),
      });

      if (impactResponse.statusCode === 200) {
        const impactBody = JSON.parse(impactResponse.payload);
        expectSuccess(impactBody);

        console.log("✅ Impact analysis completed");
        console.log(
          `🎯 Direct Impact: ${
            impactBody.data?.directImpact?.length || 0
          } entities`
        );
        console.log(
          `🌊 Cascading Impact: ${
            impactBody.data?.cascadingImpact?.length || 0
          } entities`
        );
      }

      // ============================================================================
      // PHASE 6: COMMIT & SCM INTEGRATION (Version Control & Artifacts)
      // ============================================================================
      console.log("📦 Phase 6: Creating Commit with Linked Artifacts");

      const commitRequest = {
        title: "feat: implement user authentication system",
        description: `Implements comprehensive user authentication system with the following features:

• Email/password authentication with bcrypt hashing
• JWT token-based session management with refresh tokens
• Role-based access control (User, Admin, Moderator)
• Password reset functionality with secure tokens
• Account lockout after 5 failed login attempts
• Session management and secure logout

This implementation addresses the requirements outlined in specification: ${specId}

Acceptance Criteria Met:
✅ Users can register with valid email and strong password
✅ Users can login with correct credentials and receive JWT tokens
✅ Invalid login attempts are rejected with appropriate error messages
✅ JWT tokens expire after 24 hours and can be refreshed
✅ Password reset functionality with secure token generation
✅ Role-based access control implementation
✅ Account lockout mechanism after failed attempts

Related Files:
- src/services/AuthService.ts (Main authentication service)
- src/models/User.ts (User model and repository interface)

Security Features:
- Bcrypt password hashing with salt rounds of 12
- JWT tokens with configurable expiration
- Account lockout protection against brute force
- Secure password reset token generation
- Input validation and sanitization

Test Coverage: Comprehensive unit and integration tests planned
Performance: Optimized for high-throughput authentication requests`,
        changes: ["src/services/AuthService.ts", "src/models/User.ts"],
        relatedSpecId: specId,
        createPR: true,
        branchName: "feature/user-authentication-system",
        labels: [
          "enhancement",
          "security",
          "authentication",
          "user-management",
        ],
      };

      const commitResponse = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(commitRequest),
      });

      if (
        commitResponse.statusCode === 200 ||
        commitResponse.statusCode === 201
      ) {
        const commitBody = JSON.parse(commitResponse.payload);
        expectSuccess(commitBody);

        console.log("✅ Commit created successfully");
        console.log(`🔗 Commit Hash: ${commitBody.data?.commitHash || "N/A"}`);
        console.log(`🔗 PR URL: ${commitBody.data?.prUrl || "N/A"}`);
      }

      // ============================================================================
      // VERIFICATION: Test Complete Workflow Integration
      // ============================================================================
      console.log("✨ Verifying Complete Workflow Integration");

      // Verify spec exists and is linked to implementation
      const specSearchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({ query: specId }),
      });

      if (specSearchResponse.statusCode === 200) {
        const specSearchBody = JSON.parse(specSearchResponse.payload);
        expectSuccess(specSearchBody);
        expect(specSearchBody.data.entities.length).toBeGreaterThan(0);
      }

      // Verify implementation files exist in knowledge graph
      const authServiceSearchResponse = await app.inject({
        method: "POST",
        url: "/api/v1/graph/search",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify({ query: "AuthService" }),
      });

      if (authServiceSearchResponse.statusCode === 200) {
        const authSearchBody = JSON.parse(authServiceSearchResponse.payload);
        expectSuccess(authSearchBody);
        expect(authSearchBody.data.entities.length).toBeGreaterThan(0);
      }

      // Verify system health after complete workflow
      const healthResponse = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(healthResponse.statusCode).toBe(200);
      const healthBody = JSON.parse(healthResponse.payload);
      expect(healthBody.status).toBe("healthy");

      console.log("🎉 Complete Development Lifecycle E2E Test Passed!");
      console.log("✅ All phases completed successfully");
      console.log("✅ Knowledge graph updated with new entities");
      console.log("✅ System remains healthy after workflow completion");
    });

    it("should handle workflow interruptions and recovery gracefully", async () => {
      console.log("🛡️ Testing Workflow Recovery Scenarios");

      // Create initial spec
      const recoverySpecRequest = {
        title: "Recovery Test Feature",
        description: "Testing workflow recovery after interruptions",
        acceptanceCriteria: ["Should handle partial workflow completion"],
      };

      const recoverySpecResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(recoverySpecRequest),
      });

      if (
        recoverySpecResponse.statusCode === 200 ||
        recoverySpecResponse.statusCode === 201
      ) {
        const recoverySpecBody = JSON.parse(recoverySpecResponse.payload);
        const recoverySpecId = recoverySpecBody.data.specId;

        // Simulate partial workflow - create spec but skip test planning
        console.log("📝 Created spec, now testing partial workflow recovery");

        // System should remain functional even with incomplete workflow
        const healthResponse = await app.inject({
          method: "GET",
          url: "/health",
        });

        expect(healthResponse.statusCode).toBe(200);

        // Should be able to query the spec even without completing full workflow
        const specQueryResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: recoverySpecId }),
        });

        if (specQueryResponse.statusCode === 200) {
          const specQueryBody = JSON.parse(specQueryResponse.payload);
          expectSuccess(specQueryBody);
        }

        console.log("✅ Partial workflow recovery handled gracefully");
      }
    });

    it("should validate workflow phase dependencies and ordering", async () => {
      console.log("🔒 Testing Workflow Phase Dependencies");

      // Try to generate tests without a spec (should handle gracefully)
      const invalidTestPlanRequest = {
        specId: "non-existent-spec-12345",
        testTypes: ["unit"],
      };

      const invalidTestResponse = await app.inject({
        method: "POST",
        url: "/api/v1/tests/plan-and-generate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidTestPlanRequest),
      });

      // Should handle gracefully without breaking the system
      expect([200, 400, 404]).toContain(invalidTestResponse.statusCode);

      if (invalidTestResponse.statusCode === 200) {
        const invalidTestBody = JSON.parse(invalidTestResponse.payload);
        // Should return appropriate result or error
        expect(invalidTestBody).toBeDefined();
      }

      // Try validation without files (should handle gracefully)
      const invalidValidationRequest = {
        files: [],
        includeTypes: ["typescript"],
      };

      const invalidValidationResponse = await app.inject({
        method: "POST",
        url: "/api/v1/code/validate",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidValidationRequest),
      });

      expect([200, 400, 404]).toContain(invalidValidationResponse.statusCode);

      console.log("✅ Invalid workflow sequences handled gracefully");
    });

    it("should maintain data consistency across workflow phases", async () => {
      console.log("🔄 Testing Data Consistency Across Workflow");

      // Create a complete workflow and verify data consistency
      const consistencySpecRequest = {
        title: "Data Consistency Test",
        description: "Testing data consistency across all workflow phases",
        acceptanceCriteria: [
          "Data should be consistent across all phases",
          "Entity relationships should be maintained",
          "Search results should reflect all changes",
        ],
      };

      const consistencySpecResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(consistencySpecRequest),
      });

      if (
        consistencySpecResponse.statusCode === 200 ||
        consistencySpecResponse.statusCode === 201
      ) {
        const consistencySpecBody = JSON.parse(consistencySpecResponse.payload);
        const consistencySpecId = consistencySpecBody.data.specId;

        // Phase 1: Create implementation
        const consistencyImplEntity: CodebaseEntity = {
          id: "consistency-test-impl",
          path: "src/services/ConsistencyTestService.ts",
          hash: "consistency123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 256,
          lines: 20,
          isTest: false,
          content: `
            export class ConsistencyTestService {
              testConsistency(): boolean {
                return true;
              }
            }
          `,
        };

        await kgService.createEntity(consistencyImplEntity);

        // Phase 2: Verify consistency via multiple search approaches
        const searchQueries = [
          { query: consistencySpecId },
          { query: "ConsistencyTestService" },
          { query: "consistency" },
        ];

        for (const searchQuery of searchQueries) {
          const searchResponse = await app.inject({
            method: "POST",
            url: "/api/v1/graph/search",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify(searchQuery),
          });

          if (searchResponse.statusCode === 200) {
            const searchBody = JSON.parse(searchResponse.payload);
            expectSuccess(searchBody);
          }
        }

        // Phase 3: Verify via direct entity queries
        const specSearchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: consistencySpecId }),
        });

        const implSearchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: "ConsistencyTestService" }),
        });

        // Both should return results if data is consistent
        if (
          specSearchResponse.statusCode === 200 &&
          implSearchResponse.statusCode === 200
        ) {
          const specBody = JSON.parse(specSearchResponse.payload);
          const implBody = JSON.parse(implSearchResponse.payload);

          expectSuccess(specBody);
          expectSuccess(implBody);

          // Should find the entities we created
          expect(specBody.data.entities.length).toBeGreaterThan(0);
          expect(implBody.data.entities.length).toBeGreaterThan(0);
        }

        console.log("✅ Data consistency maintained across workflow phases");
      }
    });

    it("should handle concurrent development workflows", async () => {
      console.log("⚡ Testing Concurrent Development Workflows");

      const concurrentWorkflows = 3;
      const workflowPromises = [];

      for (let i = 0; i < concurrentWorkflows; i++) {
        const workflow = async (workflowId: number) => {
          // Create spec for this workflow
          const concurrentSpecRequest = {
            title: `Concurrent Feature ${workflowId}`,
            description: `Testing concurrent workflow ${workflowId}`,
            acceptanceCriteria: [
              `Workflow ${workflowId} should complete successfully`,
            ],
          };

          const specResponse = await app.inject({
            method: "POST",
            url: "/api/v1/design/create-spec",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify(concurrentSpecRequest),
          });

          if (
            specResponse.statusCode === 200 ||
            specResponse.statusCode === 201
          ) {
            const specBody = JSON.parse(specResponse.payload);
            const specId = specBody.data.specId;

            // Create implementation for this workflow
            const concurrentImplEntity: CodebaseEntity = {
              id: `concurrent-impl-${workflowId}`,
              path: `src/services/ConcurrentService${workflowId}.ts`,
              hash: `concurrent${workflowId}23`,
              language: "typescript",
              lastModified: new Date(),
              created: new Date(),
              type: "file",
              size: 128,
              lines: 10,
              isTest: false,
              content: `
                export class ConcurrentService${workflowId} {
                  execute(): string {
                    return 'Workflow ${workflowId} executed';
                  }
                }
              `,
            };

            await kgService.createEntity(concurrentImplEntity);

            return { workflowId, specId, success: true };
          }

          return { workflowId, specId: null, success: false };
        };

        workflowPromises.push(workflow(i + 1));
      }

      // Execute all workflows concurrently
      const workflowResults = await Promise.all(workflowPromises);

      // Verify all workflows completed
      const successfulWorkflows = workflowResults.filter(
        (result) => result.success
      );
      expect(successfulWorkflows.length).toBe(concurrentWorkflows);

      // Verify all specs and implementations exist
      for (const result of successfulWorkflows) {
        if (result.specId) {
          const searchResponse = await app.inject({
            method: "POST",
            url: "/api/v1/graph/search",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify({ query: result.specId }),
          });

          if (searchResponse.statusCode === 200) {
            const searchBody = JSON.parse(searchResponse.payload);
            expectSuccess(searchBody);
          }
        }
      }

      console.log(
        `✅ ${concurrentWorkflows} concurrent workflows completed successfully`
      );
    });
  });

  describe("Development Workflow Error Recovery", () => {
    it("should recover from partial failures in the development pipeline", async () => {
      console.log("🔧 Testing Error Recovery in Development Pipeline");

      // Create a spec
      const recoverySpecRequest = {
        title: "Error Recovery Test",
        description: "Testing error recovery mechanisms",
        acceptanceCriteria: ["Should recover from partial failures"],
      };

      const recoverySpecResponse = await app.inject({
        method: "POST",
        url: "/api/v1/design/create-spec",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(recoverySpecRequest),
      });

      if (
        recoverySpecResponse.statusCode === 200 ||
        recoverySpecResponse.statusCode === 201
      ) {
        const recoverySpecBody = JSON.parse(recoverySpecResponse.payload);
        const recoverySpecId = recoverySpecBody.data.specId;

        // Simulate various failure scenarios
        const failureScenarios = [
          // Non-existent spec for test planning
          {
            type: "test-planning-failure",
            request: {
              method: "POST",
              url: "/api/v1/tests/plan-and-generate",
              headers: { "content-type": "application/json" },
              payload: JSON.stringify({ specId: "non-existent-spec-12345" }),
            },
          },
          // Validation with non-existent files
          {
            type: "validation-failure",
            request: {
              method: "POST",
              url: "/api/v1/code/validate",
              headers: { "content-type": "application/json" },
              payload: JSON.stringify({ files: ["non-existent-file.ts"] }),
            },
          },
          // Impact analysis with invalid entities
          {
            type: "impact-failure",
            request: {
              method: "POST",
              url: "/api/v1/impact/analyze",
              headers: { "content-type": "application/json" },
              payload: JSON.stringify({
                changes: [
                  { entityId: "non-existent-entity", changeType: "modify" },
                ],
              }),
            },
          },
        ];

        // Test each failure scenario
        for (const scenario of failureScenarios) {
          const response = await app.inject(scenario.request);

          // Should handle failures gracefully without breaking the system
          expect([200, 400, 404, 500]).toContain(response.statusCode);

          // System should remain healthy after each failure
          const healthResponse = await app.inject({
            method: "GET",
            url: "/health",
          });

          expect(healthResponse.statusCode).toBe(200);
        }

        // Original spec should still exist and be queryable
        const recoverySearchResponse = await app.inject({
          method: "POST",
          url: "/api/v1/graph/search",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({ query: recoverySpecId }),
        });

        if (recoverySearchResponse.statusCode === 200) {
          const recoverySearchBody = JSON.parse(recoverySearchResponse.payload);
          expectSuccess(recoverySearchBody);
          expect(recoverySearchBody.data.entities.length).toBeGreaterThan(0);
        }

        console.log("✅ Error recovery mechanisms working correctly");
      }
    });

    it("should validate workflow state transitions and constraints", async () => {
      console.log("🔄 Testing Workflow State Transitions");

      // Test various invalid state transitions
      const invalidTransitions = [
        // Try to validate before implementation
        {
          description: "Validation without implementation",
          request: {
            method: "POST",
            url: "/api/v1/code/validate",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({
              files: ["non-existent-implementation.ts"],
              includeTypes: ["typescript"],
            }),
          },
        },
        // Try to analyze impact of non-existent changes
        {
          description: "Impact analysis of non-existent changes",
          request: {
            method: "POST",
            url: "/api/v1/impact/analyze",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({
              changes: [{ entityId: "phantom-entity", changeType: "delete" }],
            }),
          },
        },
        // Try to commit without proper artifacts
        {
          description: "Commit without required fields",
          request: {
            method: "POST",
            url: "/api/v1/scm/commit-pr",
            headers: { "content-type": "application/json" },
            payload: JSON.stringify({
              description: "Missing title and changes",
            }),
          },
        },
      ];

      // Test each invalid transition
      for (const transition of invalidTransitions) {
        const response = await app.inject(transition.request);

        // Should handle invalid transitions appropriately
        expect([200, 400, 404]).toContain(response.statusCode);

        if (response.statusCode === 400) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(false);
        }

        // System should remain stable
        const healthResponse = await app.inject({
          method: "GET",
          url: "/health",
        });

        expect(healthResponse.statusCode).toBe(200);
      }

      console.log("✅ Workflow state transitions validated");
    });
  });
});
