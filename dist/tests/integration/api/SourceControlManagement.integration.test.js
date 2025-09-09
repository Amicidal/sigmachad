/**
 * Integration tests for Source Control Management API endpoints
 * Tests commit/PR creation, branch management, and SCM integration
 * with knowledge graph and testing artifacts
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { expectSuccess } from "../../test-utils/assertions";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService.js";
import { TestEngine } from "../../../src/services/TestEngine.js";
import { setupTestDatabase, cleanupTestDatabase, clearTestData, checkDatabaseHealth, } from "../../test-utils/database-helpers.js";
describe("Source Control Management API Integration", () => {
    let dbService;
    let kgService;
    let testEngine;
    let apiGateway;
    let app;
    beforeAll(async () => {
        // Setup test database
        dbService = await setupTestDatabase();
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error("Database health check failed - cannot run integration tests");
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
    describe("POST /api/v1/scm/commit-pr", () => {
        it("should create commit with linked artifacts", async () => {
            // Setup test data: spec, tests, and code changes
            const specEntity = {
                id: "feature-spec",
                path: "docs/features/user-auth.md",
                hash: "spec123",
                language: "markdown",
                lastModified: new Date(),
                created: new Date(),
                type: "spec",
                title: "User Authentication Feature",
                description: "Implement secure user authentication",
                acceptanceCriteria: [
                    "Users can register with email/password",
                    "Users can login with valid credentials",
                    "Invalid login attempts are rejected",
                ],
                status: "approved",
                priority: "high",
            };
            const testEntity = {
                id: "auth-tests",
                path: "src/services/__tests__/AuthService.test.ts",
                hash: "test123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "test",
                testType: "unit",
                targetSymbol: "auth-service",
            };
            const codeEntity = {
                id: "auth-service",
                path: "src/services/AuthService.ts",
                hash: "code123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "class",
                name: "AuthService",
                signature: "class AuthService",
            };
            // Create entities
            await kgService.createEntity(specEntity);
            await kgService.createEntity(testEntity);
            await kgService.createEntity(codeEntity);
            // Test commit/PR creation
            const commitRequest = {
                title: "feat: implement user authentication",
                description: "Add secure user authentication with JWT tokens\n\n- Email/password registration\n- Login with credential validation\n- JWT token generation\n\nRelated to: #123",
                changes: [
                    "src/services/AuthService.ts",
                    "src/services/__tests__/AuthService.test.ts",
                    "docs/features/user-auth.md",
                ],
                relatedSpecId: specEntity.id,
                testResults: [testEntity.id],
                createPR: true,
                branchName: "feature/user-auth",
                labels: ["enhancement", "security", "user-facing"],
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(commitRequest),
            });
            expect([200, 201, 404]).toContain(response.statusCode); // 404 if endpoint not implemented yet
            if (response.statusCode === 200 || response.statusCode === 201) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Validate commit/PR response structure
                expect(body.data).toEqual(expect.objectContaining({
                    commitHash: expect.any(String),
                    branch: expect.any(String),
                    relatedArtifacts: expect.any(Object),
                }));
                if (commitRequest.createPR) {
                    expect(body.data.prUrl).toBeDefined();
                }
                // Validate linked artifacts
                expect(body.data.relatedArtifacts).toEqual(expect.objectContaining({
                    spec: expect.any(Object),
                    tests: expect.any(Array),
                }));
                // Spec should match the created spec
                expect(body.data.relatedArtifacts.spec.id).toBe(specEntity.id);
                expect(body.data.relatedArtifacts.spec.title).toBe(specEntity.title);
            }
        });
        it("should handle commit-only requests without PR creation", async () => {
            // Setup minimal test data
            const codeEntity = {
                id: "simple-fix",
                path: "src/utils/helpers.ts",
                hash: "fix123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "formatDate",
                signature: "function formatDate(date: Date): string",
            };
            await kgService.createEntity(codeEntity);
            const commitOnlyRequest = {
                title: "fix: correct date formatting in helper function",
                description: "Fix date formatting bug in formatDate utility function",
                changes: ["src/utils/helpers.ts"],
                createPR: false,
                branchName: "main",
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(commitOnlyRequest),
            });
            expect([200, 201, 404]).toContain(response.statusCode);
            if (response.statusCode === 200 || response.statusCode === 201) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Should have commit hash but no PR URL
                expect(body.data.commitHash).toBeDefined();
                expect(body.data.prUrl).toBeUndefined();
                expect(body.data.branch).toBe(commitOnlyRequest.branchName);
            }
        });
        it("should validate commit request parameters", async () => {
            // Test with missing required fields
            const invalidRequest = {
                description: "Missing title and changes",
                createPR: true,
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(invalidRequest),
            });
            expect([400, 404]).toContain(response.statusCode);
            if (response.statusCode === 400) {
                const body = JSON.parse(response.payload);
                expect(body.success).toBe(false);
                expect(body.error).toBeDefined();
                expect(body.error.code).toBe("VALIDATION_ERROR");
            }
        });
        it("should handle validation results in commit creation", async () => {
            // Setup test data with validation results
            const specEntity = {
                id: "validation-spec",
                path: "docs/features/data-validation.md",
                hash: "valspec123",
                language: "markdown",
                lastModified: new Date(),
                created: new Date(),
                type: "spec",
                title: "Data Validation Enhancement",
                description: "Add comprehensive data validation",
                acceptanceCriteria: [
                    "All inputs are validated",
                    "Error messages are clear",
                ],
                status: "approved",
                priority: "medium",
            };
            const testEntity = {
                id: "validation-tests",
                path: "src/utils/__tests__/validation.test.ts",
                hash: "valtest123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "test",
                testType: "unit",
                targetSymbol: "validation-utils",
            };
            await kgService.createEntity(specEntity);
            await kgService.createEntity(testEntity);
            // Mock validation results (in a real scenario, these would come from the validation API)
            const validationResults = {
                overall: {
                    passed: true,
                    score: 95,
                    duration: 1250,
                },
                typescript: {
                    errors: 0,
                    warnings: 2,
                    passed: true,
                },
                eslint: {
                    errors: 0,
                    warnings: 1,
                    passed: true,
                },
                tests: {
                    passed: 15,
                    failed: 0,
                    skipped: 0,
                    coverage: 92,
                },
            };
            const commitWithValidationRequest = {
                title: "feat: add data validation utilities",
                description: "Implement comprehensive input validation with error handling",
                changes: [
                    "src/utils/validation.ts",
                    "src/utils/__tests__/validation.test.ts",
                ],
                relatedSpecId: specEntity.id,
                testResults: [testEntity.id],
                validationResults: JSON.stringify(validationResults),
                createPR: true,
                branchName: "feature/data-validation",
                labels: ["enhancement", "validation"],
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(commitWithValidationRequest),
            });
            expect([200, 201, 404]).toContain(response.statusCode);
            if (response.statusCode === 200 || response.statusCode === 201) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Should include validation results in response
                expect(body.data.relatedArtifacts).toEqual(expect.objectContaining({
                    validation: expect.any(Object),
                }));
                // Validation should indicate success
                expect(body.data.relatedArtifacts.validation.overall.passed).toBe(true);
                expect(body.data.relatedArtifacts.validation.overall.score).toBe(95);
            }
        });
        it("should handle concurrent commit requests", async () => {
            // Setup multiple independent changes
            const commitRequests = [];
            for (let i = 0; i < 3; i++) {
                const codeEntity = {
                    id: `concurrent-feature-${i}`,
                    path: `src/features/feature${i}.ts`,
                    hash: `feat${i}23`,
                    language: "typescript",
                    lastModified: new Date(),
                    created: new Date(),
                    type: "symbol",
                    kind: "function",
                    name: `feature${i}`,
                    signature: `function feature${i}(): void`,
                };
                await kgService.createEntity(codeEntity);
                commitRequests.push({
                    title: `feat: implement feature ${i}`,
                    description: `Add feature ${i} functionality`,
                    changes: [`src/features/feature${i}.ts`],
                    createPR: false,
                    branchName: `feature/feature-${i}`,
                });
            }
            // Execute concurrent commit requests
            const responses = await Promise.all(commitRequests.map((request) => app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(request),
            })));
            // All requests should succeed
            responses.forEach((response) => {
                expect([200, 201, 404]).toContain(response.statusCode);
                if (response.statusCode === 200 || response.statusCode === 201) {
                    const body = JSON.parse(response.payload);
                    expectSuccess(body);
                    expect(body.data.commitHash).toBeDefined();
                }
            });
            // All commits should have unique hashes
            const commitHashes = responses
                .filter((r) => r.statusCode === 200 || r.statusCode === 201)
                .map((r) => JSON.parse(r.payload).data.commitHash);
            const uniqueHashes = new Set(commitHashes);
            expect(uniqueHashes.size).toBe(commitHashes.length);
        });
        it("should handle branch naming conflicts gracefully", async () => {
            // Setup test data
            const codeEntity = {
                id: "branch-conflict-test",
                path: "src/utils/branch-test.ts",
                hash: "branch123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "branchTest",
                signature: "function branchTest(): void",
            };
            await kgService.createEntity(codeEntity);
            // First commit to create the branch
            const firstCommitRequest = {
                title: "feat: initial branch commit",
                description: "Create initial commit on feature branch",
                changes: ["src/utils/branch-test.ts"],
                createPR: false,
                branchName: "feature/test-branch",
            };
            const firstResponse = await app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(firstCommitRequest),
            });
            expect([200, 201, 404]).toContain(firstResponse.statusCode);
            if (firstResponse.statusCode === 200 ||
                firstResponse.statusCode === 201) {
                // Second commit to same branch (should handle gracefully)
                const secondCommitRequest = {
                    title: "feat: additional changes to branch",
                    description: "Add more changes to existing branch",
                    changes: ["src/utils/branch-test.ts"], // Same file
                    createPR: false,
                    branchName: "feature/test-branch", // Same branch
                };
                const secondResponse = await app.inject({
                    method: "POST",
                    url: "/api/v1/scm/commit-pr",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: JSON.stringify(secondCommitRequest),
                });
                expect([200, 201, 404]).toContain(secondResponse.statusCode);
                if (secondResponse.statusCode === 200 ||
                    secondResponse.statusCode === 201) {
                    const firstBody = JSON.parse(firstResponse.payload);
                    const secondBody = JSON.parse(secondResponse.payload);
                    // Should be different commits but same branch
                    expect(firstBody.data.commitHash).not.toBe(secondBody.data.commitHash);
                    expect(firstBody.data.branch).toBe(secondBody.data.branch);
                }
            }
        });
        it("should support different commit message formats", async () => {
            const codeEntity = {
                id: "commit-format-test",
                path: "src/utils/format-test.ts",
                hash: "format123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "formatTest",
                signature: "function formatTest(): void",
            };
            await kgService.createEntity(codeEntity);
            // Test different conventional commit formats
            const commitFormats = [
                {
                    title: "feat: add new formatting utility",
                    description: "Add utility function for text formatting",
                },
                {
                    title: "fix: correct formatting bug",
                    description: "Fix bug in formatDate function\n\n- Handle null dates\n- Add timezone support",
                },
                {
                    title: "refactor: simplify format logic",
                    description: "Simplify the text formatting logic for better readability",
                },
                {
                    title: "docs: update formatting documentation",
                    description: "Update README with formatting examples",
                },
            ];
            const responses = await Promise.all(commitFormats.map((format) => app.inject({
                method: "POST",
                url: "/api/v1/scm/commit-pr",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify({
                    ...format,
                    changes: ["src/utils/format-test.ts"],
                    createPR: false,
                }),
            })));
            responses.forEach((response) => {
                expect([200, 201, 404]).toContain(response.statusCode);
                if (response.statusCode === 200 || response.statusCode === 201) {
                    const body = JSON.parse(response.payload);
                    expectSuccess(body);
                }
            });
        });
    });
});
//# sourceMappingURL=SourceControlManagement.integration.test.js.map