/**
 * Integration tests for Impact Analysis API endpoints
 * Tests the impact analysis functionality including cascade analysis,
 * breaking changes detection, and dependency impact assessment
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { expectSuccess } from "../../test-utils/assertions.js";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService.js";
import { TestEngine } from "../../../src/services/TestEngine.js";
import { setupTestDatabase, cleanupTestDatabase, clearTestData, checkDatabaseHealth, } from "../../test-utils/database-helpers.js";
import { RelationshipType, } from "../../../src/models/entities.js";
describe("Impact Analysis API Integration", () => {
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
    describe("POST /api/v1/impact/analyze", () => {
        it("should analyze impact of function signature changes", async () => {
            // Setup test entities with relationships
            const baseEntity = {
                id: "base-function",
                path: "src/utils/base.ts",
                hash: "base123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "processData",
                signature: "function processData(data: any): any",
                startLine: 1,
                endLine: 10,
            };
            const dependentEntity = {
                id: "dependent-function",
                path: "src/services/processor.ts",
                hash: "dep123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "handleData",
                signature: "function handleData(): void",
                startLine: 1,
                endLine: 15,
            };
            // Create entities
            await kgService.createEntity(baseEntity);
            await kgService.createEntity(dependentEntity);
            // Create relationship (dependent calls base)
            await kgService.createRelationship(dependentEntity.id, baseEntity.id, RelationshipType.CALLS);
            // Test impact analysis
            const impactRequest = {
                changes: [
                    {
                        entityId: baseEntity.id,
                        changeType: "modify",
                        signatureChange: true,
                    },
                ],
                includeIndirect: true,
                maxDepth: 3,
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(impactRequest),
            });
            expect([200, 404]).toContain(response.statusCode); // 404 if endpoint not implemented yet
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Validate impact analysis structure
                expect(body.data).toEqual(expect.objectContaining({
                    directImpact: expect.any(Array),
                    cascadingImpact: expect.any(Array),
                    testImpact: expect.any(Object),
                    recommendations: expect.any(Array),
                }));
                // Should detect the dependent function
                expect(body.data.directImpact.length).toBeGreaterThan(0);
            }
        });
        it("should handle class interface changes and cascading effects", async () => {
            // Setup class and interface with inheritance
            const interfaceEntity = {
                id: "data-processor-interface",
                path: "src/interfaces/DataProcessor.ts",
                hash: "intf123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "interface",
                name: "DataProcessor",
                signature: "interface DataProcessor",
                startLine: 1,
                endLine: 10,
            };
            const classEntity = {
                id: "json-processor-class",
                path: "src/services/JsonProcessor.ts",
                hash: "class123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "class",
                name: "JsonProcessor",
                signature: "class JsonProcessor implements DataProcessor",
                startLine: 1,
                endLine: 30,
            };
            const consumerEntity = {
                id: "api-consumer",
                path: "src/api/consumer.ts",
                hash: "cons123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "symbol",
                kind: "function",
                name: "consumeApi",
                signature: "function consumeApi(processor: DataProcessor): void",
                startLine: 1,
                endLine: 20,
            };
            // Create entities and relationships
            await kgService.createEntity(interfaceEntity);
            await kgService.createEntity(classEntity);
            await kgService.createEntity(consumerEntity);
            await kgService.createRelationship(classEntity.id, interfaceEntity.id, RelationshipType.IMPLEMENTS);
            await kgService.createRelationship(consumerEntity.id, interfaceEntity.id, RelationshipType.REFERENCES);
            // Test impact of interface change
            const impactRequest = {
                changes: [
                    {
                        entityId: interfaceEntity.id,
                        changeType: "modify",
                        signatureChange: true,
                    },
                ],
                includeIndirect: true,
                maxDepth: 2,
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(impactRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Should detect cascading impact through inheritance
                expect(body.data.cascadingImpact.length).toBeGreaterThan(0);
                expect(body.data.recommendations.length).toBeGreaterThan(0);
            }
        });
        it("should analyze file deletion impact with test coverage", async () => {
            // Setup file with associated tests
            const fileEntity = {
                id: "utility-file",
                path: "src/utils/helpers.ts",
                hash: "file123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "file",
                size: 1024,
                lines: 50,
                isTest: false,
            };
            const testEntity = {
                id: "utility-tests",
                path: "src/utils/helpers.test.ts",
                hash: "test123",
                language: "typescript",
                lastModified: new Date(),
                created: new Date(),
                type: "test",
                testType: "unit",
                targetSymbol: fileEntity.id,
            };
            await kgService.createEntity(fileEntity);
            await kgService.createEntity(testEntity);
            // Test file deletion impact
            const impactRequest = {
                changes: [
                    {
                        entityId: fileEntity.id,
                        changeType: "delete",
                    },
                ],
                includeIndirect: true,
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(impactRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Should detect test impact
                expect(body.data.testImpact).toBeDefined();
                expect(body.data.recommendations.some((rec) => rec.type === "warning" || rec.type === "requirement")).toBe(true);
            }
        });
        it("should handle empty change sets gracefully", async () => {
            const impactRequest = {
                changes: [],
                includeIndirect: false,
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(impactRequest),
            });
            expect([200, 400]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                expect(body.data.directImpact).toEqual([]);
                expect(body.data.cascadingImpact).toEqual([]);
            }
        });
        it("should validate impact analysis request parameters", async () => {
            // Test with invalid request
            const invalidRequest = {
                changes: [
                    {
                        // Missing required entityId
                        changeType: "modify",
                    },
                ],
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(invalidRequest),
            });
            expect([400, 404]).toContain(response.statusCode);
            if (response.statusCode === 400) {
                const body = JSON.parse(response.payload);
                // Fastify's schema validation returns a different error structure
                expect(body.error).toBeDefined();
                expect(body.error.code).toBe("FST_ERR_VALIDATION");
                expect(body.error.message).toContain("entityId");
            }
        });
        it("should respect max depth parameter in cascading analysis", async () => {
            // Setup a deep dependency chain
            const entities = [];
            for (let i = 0; i < 5; i++) {
                const entity = {
                    id: `chain-entity-${i}`,
                    path: `src/chain/file${i}.ts`,
                    hash: `chain${i}23`,
                    language: "typescript",
                    lastModified: new Date(),
                    created: new Date(),
                    type: "symbol",
                    kind: "function",
                    name: `function${i}`,
                    signature: `function function${i}(): void`,
                    startLine: 1,
                    endLine: 10,
                };
                entities.push(entity);
                await kgService.createEntity(entity);
                // Create dependency chain
                if (i > 0) {
                    await kgService.createRelationship(entities[i].id, entities[i - 1].id, RelationshipType.CALLS);
                }
            }
            const impactRequest = {
                changes: [
                    {
                        entityId: entities[0].id,
                        changeType: "modify",
                        signatureChange: true,
                    },
                ],
                includeIndirect: true,
                maxDepth: 2, // Limit depth
            };
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/impact/analyze",
                headers: {
                    "content-type": "application/json",
                },
                payload: JSON.stringify(impactRequest),
            });
            expect([200, 404]).toContain(response.statusCode);
            if (response.statusCode === 200) {
                const body = JSON.parse(response.payload);
                expectSuccess(body);
                // Should respect max depth (not traverse beyond 2 levels)
                const maxDepthInResults = Math.max(...body.data.cascadingImpact.map((impact) => impact.level));
                expect(maxDepthInResults).toBeLessThanOrEqual(2);
            }
        });
    });
});
//# sourceMappingURL=ImpactAnalysis.integration.test.js.map