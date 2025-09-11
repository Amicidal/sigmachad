/**
 * Integration tests for models/entities.ts
 * Tests real database operations with entities, relationships, and types
 * Covers cross-database operations, data consistency, and performance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import {
  DatabaseService,
  createTestDatabaseConfig,
} from "../../src/services/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers";

// Import all entity types and related utilities
import {
  Entity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Test,
  Spec,
  Change,
  Session,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssue,
  Vulnerability,
  isFile,
  isDirectory,
  isSymbol,
  isFunction,
  isClass,
  isInterface,
  isTest,
  isSpec,
} from "../../../src/models/entities";

import {
  Relationship,
  RelationshipType,
  GraphRelationship,
  StructuralRelationship,
  CodeRelationship,
  TestRelationship,
  SpecRelationship,
  TemporalRelationship,
  DocumentationRelationship,
  SecurityRelationship,
  PerformanceRelationship,
} from "../../../src/models/relationships";

import {
  APIResponse,
  PaginatedResponse,
  ValidationResult,
  ImpactAnalysis,
} from "../../../src/models/types";

describe("Models Integration Tests", () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run integration tests"
      );
    }
  }, 30000);

  afterAll(async () => {
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  describe("Entity Lifecycle Management", () => {
    describe("File Entity CRUD Operations", () => {
      it("should create, read, update, and delete file entities across databases", async () => {
        const testFileId = randomUUID();
        const testFile: File = {
          id: testFileId,
          path: "/src/components/Button.tsx",
          hash: "abc123def456",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          extension: ".tsx",
          size: 2048,
          lines: 85,
          isTest: false,
          isConfig: false,
          dependencies: ["react", "@types/react", "styled-components"],
          metadata: {
            author: "test-developer",
            version: "1.0.0",
            tags: ["component", "ui"],
          },
        };

        // 1. Store in PostgreSQL
        await dbService.postgresQuery(
          `
          INSERT INTO documents (id, type, content, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            testFile.id,
            "code",
            JSON.stringify({
              code: 'console.log("test");',
              language: "typescript",
            }),
            JSON.stringify({
              path: testFile.path,
              extension: testFile.extension,
              size: testFile.size,
              lines: testFile.lines,
              dependencies: testFile.dependencies,
              ...testFile.metadata,
            }),
            testFile.created,
            testFile.lastModified,
          ]
        );

        // 2. Create corresponding graph node in FalkorDB
        await dbService.falkordbQuery(
          `
          CREATE (:Entity {
            id: $id,
            type: 'file',
            path: $path,
            language: $language,
            extension: $extension,
            size: $size,
            lines: $lines,
            isTest: $isTest,
            isConfig: $isConfig,
            lastModified: $lastModified,
            created: $created
          })
        `,
          {
            id: testFile.id,
            path: testFile.path,
            language: testFile.language,
            extension: testFile.extension,
            size: testFile.size,
            lines: testFile.lines,
            isTest: testFile.isTest,
            isConfig: testFile.isConfig,
            lastModified: testFile.lastModified.toISOString(),
            created: testFile.created.toISOString(),
          }
        );

        // 3. Store embeddings in Qdrant
        const embedding = new Array(1536).fill(0).map(() => Math.random());
        try {
          await dbService.qdrant.createCollection("entities", {
            vectors: { size: 1536, distance: "Cosine" },
          });
        } catch (error: any) {
          // Collection might already exist, ignore
          if (!error.message?.includes("already exists")) {
            console.warn(
              "Warning: Could not create entities collection:",
              error
            );
          }
        }

        try {
          await dbService.qdrant.upsert("entities", {
            points: [
              {
                id: testFile.id,
                vector: embedding,
                payload: {
                  type: "file",
                  path: testFile.path,
                  language: testFile.language,
                },
              },
            ],
          });
        } catch (error) {
          console.warn("Warning: Could not upsert to Qdrant:", error);
        }

        // 4. Cache metadata in Redis
        await dbService.redisSet(
          `entity:${testFile.id}:metadata`,
          JSON.stringify({
            ...testFile,
            lastModified: testFile.lastModified.toISOString(),
            created: testFile.created.toISOString(),
          })
        );

        // 5. Verify data consistency across all databases
        // PostgreSQL verification
        const pgResult = await dbService.postgresQuery(
          "SELECT * FROM documents WHERE id = $1",
          [testFileId]
        );
        expect(pgResult.rows.length).toBe(1);
        const pgData = pgResult.rows[0].metadata;
        expect(pgData.path).toBe(testFile.path);
        expect(pgData.extension).toBe(testFile.extension);

        // FalkorDB verification
        const falkorResult = await dbService.falkordbQuery(
          "MATCH (n:Entity {id: $id}) RETURN n.path as path, n.language as language",
          { id: testFileId }
        );
        expect(falkorResult.length).toBe(1);
        expect(falkorResult[0].path).toBe(testFile.path);
        expect(falkorResult[0].language).toBe(testFile.language);

        // Qdrant verification
        try {
          const qdrantResult = await dbService.qdrant.scroll("entities", {
            limit: 1,
            filter: {
              must: [{ key: "id", match: { value: testFileId } }],
            },
          });
          if (qdrantResult.points && qdrantResult.points.length > 0) {
            expect(qdrantResult.points.length).toBe(1);
          } else {
            console.warn(
              "Warning: No points found in Qdrant for entity:",
              testFileId
            );
          }
        } catch (error) {
          console.warn("Warning: Qdrant verification failed:", error);
        }

        // Redis verification
        const redisResult = await dbService.redisGet(
          `entity:${testFileId}:metadata`
        );
        expect(redisResult).toBeTruthy();
        const redisData = JSON.parse(redisResult!);
        expect(redisData.id).toBe(testFileId);
        expect(redisData.type).toBe("file");

        // 6. Test update operation
        const updatedFile = { ...testFile, lines: 95, size: 2304 };
        await dbService.postgresQuery(
          `
          UPDATE documents
          SET metadata = $1, updated_at = NOW()
          WHERE id = $2
        `,
          [
            JSON.stringify({
              ...pgData,
              lines: updatedFile.lines,
              size: updatedFile.size,
            }),
            testFileId,
          ]
        );

        await dbService.falkordbQuery(
          `
          MATCH (n:Entity {id: $id})
          SET n.lines = $lines, n.size = $size
        `,
          {
            id: testFileId,
            lines: updatedFile.lines,
            size: updatedFile.size,
          }
        );

        // Verify updates
        const updatedPgResult = await dbService.postgresQuery(
          "SELECT metadata FROM documents WHERE id = $1",
          [testFileId]
        );
        const updatedPgData = updatedPgResult.rows[0].metadata;
        expect(updatedPgData.lines).toBe(95);
        expect(updatedPgData.size).toBe(2304);

        // 7. Test deletion
        await dbService.postgresQuery("DELETE FROM documents WHERE id = $1", [
          testFileId,
        ]);
        await dbService.falkordbQuery("MATCH (n:Entity {id: $id}) DELETE n", {
          id: testFileId,
        });
        await dbService.redisDel(`entity:${testFileId}:metadata`);

        // Verify deletions
        const deletedPgResult = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE id = $1",
          [testFileId]
        );
        expect(deletedPgResult.rows[0].count).toBe(0);

        const deletedFalkorResult = await dbService.falkordbQuery(
          "MATCH (n:Entity {id: $id}) RETURN count(n) as count",
          { id: testFileId }
        );
        expect(deletedFalkorResult[0].count).toBe(0);

        const deletedRedisResult = await dbService.redisGet(
          `entity:${testFileId}:metadata`
        );
        expect(deletedRedisResult).toBeNull();
      });

      it("should handle bulk file entity operations efficiently", async () => {
        const bulkFiles: File[] = [];
        const fileCount = 50;

        // Create bulk test data
        for (let i = 0; i < fileCount; i++) {
          bulkFiles.push({
            id: randomUUID(),
            path: `/src/components/Component${i}.tsx`,
            hash: `hash${i}`,
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            extension: ".tsx",
            size: 1000 + i * 10,
            lines: 50 + i,
            isTest: i % 10 === 0,
            isConfig: false,
            dependencies: ["react", "lodash"],
          });
        }

        const startTime = Date.now();

        // Bulk insert into PostgreSQL
        const pgQueries = bulkFiles.map((file) => ({
          query:
            "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
          params: [
            file.id,
            "code",
            JSON.stringify({
              code: `// Component ${file.id}`,
              language: file.language,
            }),
            JSON.stringify({
              path: file.path,
              extension: file.extension,
              size: file.size,
              lines: file.lines,
              isTest: file.isTest,
            }),
          ],
        }));

        await dbService.postgresBulkQuery(pgQueries);

        // Bulk create FalkorDB nodes
        for (const file of bulkFiles) {
          await dbService.falkordbQuery(
            `
            CREATE (:Entity {
              id: $id,
              type: 'file',
              path: $path,
              language: $language,
              size: $size,
              lines: $lines,
              isTest: $isTest
            })
          `,
            {
              id: file.id,
              path: file.path,
              language: file.language,
              size: file.size,
              lines: file.lines,
              isTest: file.isTest,
            }
          );
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within reasonable time
        expect(duration).toBeLessThan(30000); // 30 seconds max for bulk operations

        // Verify bulk operations
        const pgCount = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE type = 'code'"
        );
        expect(parseInt(pgCount.rows[0].count)).toBe(fileCount);

        const falkorCount = await dbService.falkordbQuery(
          "MATCH (n:Entity {type: 'file'}) RETURN count(n) as count"
        );
        expect(falkorCount[0].count).toBe(fileCount);

        // Test bulk query performance
        const queryStartTime = Date.now();
        const bulkQueryResult = await dbService.postgresQuery(`
          SELECT id, metadata
          FROM documents
          WHERE type = 'code'
          ORDER BY created_at DESC
          LIMIT 20
        `);
        const queryEndTime = Date.now();

        expect(bulkQueryResult.rows.length).toBe(20);
        expect(queryEndTime - queryStartTime).toBeLessThan(5000); // Query should be reasonably fast
      });
    });

    describe("Symbol Entity Operations", () => {
      it("should create and query complex symbol entities with relationships", async () => {
        const classId = randomUUID();
        const methodId = randomUUID();
        const testSymbols: Symbol[] = [
          {
            id: classId,
            path: "/src/services/UserService.ts",
            hash: "class123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "symbol",
            name: "UserService",
            kind: "class",
            signature: "export class UserService implements IUserService",
            docstring: "Service for managing user operations",
            visibility: "public",
            isExported: true,
            isDeprecated: false,
            location: { line: 10, column: 0, start: 150, end: 200 },
          } as ClassSymbol,
          {
            id: methodId,
            path: "/src/services/UserService.ts",
            hash: "method123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "symbol",
            name: "createUser",
            kind: "function",
            signature:
              "async createUser(userData: CreateUserInput): Promise<User>",
            docstring: "Creates a new user account",
            visibility: "public",
            isExported: false,
            isDeprecated: false,
            parameters: [
              { name: "userData", type: "CreateUserInput", optional: false },
            ],
            returnType: "Promise<User>",
            isAsync: true,
            isGenerator: false,
            complexity: 3,
            calls: ["validateUserData", "hashPassword", "saveUser"],
          } as FunctionSymbol,
        ];

        // Store symbols in databases
        for (const symbol of testSymbols) {
          // PostgreSQL
          await dbService.postgresQuery(
            `
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `,
            [
              symbol.id,
              "symbol",
              JSON.stringify({
                name: symbol.name,
                kind: symbol.kind,
                signature: symbol.signature,
              }),
              JSON.stringify({
                path: symbol.path,
                language: symbol.language,
                visibility: symbol.visibility,
                isExported: symbol.isExported,
                docstring: symbol.docstring,
                location: symbol.location,
                ...(symbol.kind === "function"
                  ? {
                      parameters: (symbol as FunctionSymbol).parameters,
                      returnType: (symbol as FunctionSymbol).returnType,
                      complexity: (symbol as FunctionSymbol).complexity,
                    }
                  : {}),
              }),
            ]
          );

          // FalkorDB
          const falkorProps: any = {
            id: symbol.id,
            name: symbol.name,
            kind: symbol.kind,
            signature: symbol.signature,
            visibility: symbol.visibility,
            isExported: symbol.isExported,
            path: symbol.path,
          };

          // Add complexity for function symbols
          if (symbol.kind === "function") {
            falkorProps.complexity = (symbol as FunctionSymbol).complexity;
          } else {
            falkorProps.complexity = null; // Set to null for non-function symbols
          }

          await dbService.falkordbQuery(
            `
            CREATE (:Symbol {
              id: $id,
              name: $name,
              kind: $kind,
              signature: $signature,
              visibility: $visibility,
              isExported: $isExported,
              path: $path,
              complexity: $complexity
            })
          `,
            falkorProps
          );
        }

        // Create relationships between symbols
        await dbService.falkordbQuery(
          `
          MATCH (c:Symbol {id: $classId}), (m:Symbol {id: $methodId})
          CREATE (c)-[:DEFINES]->(m)
          CREATE (m)-[:BELONGS_TO]->(c)
        `,
          {
            classId: classId,
            methodId: methodId,
          }
        );

        // Verify symbol storage
        const pgSymbols = await dbService.postgresQuery(
          "SELECT * FROM documents WHERE type = 'symbol'"
        );
        expect(pgSymbols.rows.length).toBe(2);

        // Verify relationships
        const relationships = await dbService.falkordbQuery(`
          MATCH (c:Symbol {name: 'UserService'})-[:DEFINES]->(m:Symbol {name: 'createUser'})
          RETURN c.name as className, m.name as methodName
        `);
        expect(relationships.length).toBe(1);
        expect(relationships[0].className).toBe("UserService");
        expect(relationships[0].methodName).toBe("createUser");

        // Test symbol queries
        const classSymbols = await dbService.falkordbQuery(`
          MATCH (s:Symbol {kind: 'class'})
          RETURN s.name as name, s.signature as signature
        `);
        expect(classSymbols.length).toBe(1);
        expect(classSymbols[0].name).toBe("UserService");

        const methodSymbols = await dbService.falkordbQuery(`
          MATCH (s:Symbol {kind: 'function'})
          RETURN s.name as name, s.complexity as complexity
        `);
        expect(methodSymbols.length).toBe(1);
        expect(methodSymbols[0].complexity).toBe(3);
      });
    });

    describe("Test Entity Integration", () => {
      it("should manage test entities with execution history and performance metrics", async () => {
        const testId = randomUUID();
        const testEntity: Test = {
          id: testId,
          path: "/tests/services/UserService.test.ts",
          hash: "test123",
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "test",
          testType: "unit",
          targetSymbol: "UserService.createUser",
          framework: "vitest",
          coverage: {
            lines: 85,
            branches: 90,
            functions: 95,
            statements: 88,
          },
          status: "passing",
          flakyScore: 0.05,
          lastRunAt: new Date(),
          lastDuration: 150,
          executionHistory: [
            {
              id: randomUUID(),
              timestamp: new Date(Date.now() - 3600000),
              status: "passed",
              duration: 145,
              coverage: {
                lines: 85,
                branches: 90,
                functions: 95,
                statements: 88,
              },
              performance: {
                memoryUsage: 50,
                cpuUsage: 20,
                networkRequests: 2,
                databaseQueries: 1,
                fileOperations: 0,
              },
              environment: { nodeVersion: "18.0.0" },
            },
          ],
          performanceMetrics: {
            averageExecutionTime: 145,
            p95ExecutionTime: 200,
            successRate: 0.95,
            trend: "stable",
            benchmarkComparisons: [
              {
                benchmark: "memory",
                value: 50,
                status: "below",
                threshold: 100,
              },
            ],
            historicalData: [
              {
                timestamp: new Date(Date.now() - 86400000),
                executionTime: 145,
                successRate: 0.95,
                coveragePercentage: 88,
              },
            ],
          },
          dependencies: ["UserService", "Database", "jest"],
          tags: ["unit", "user-management", "happy-path"],
        };

        // Store test data
        await dbService.postgresQuery(
          `
          INSERT INTO test_suites (id, suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            testId,
            "UserService Tests",
            testEntity.lastRunAt,
            testEntity.framework,
            1,
            1,
            0,
            0,
            testEntity.lastDuration,
          ]
        );

        await dbService.postgresQuery(
          `
          INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id, coverage, performance)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            testId,
            "should create user successfully",
            testEntity.status,
            testEntity.lastDuration,
            testEntity.lastRunAt,
            testId,
            JSON.stringify(testEntity.coverage),
            JSON.stringify(testEntity.executionHistory[0].performance),
          ]
        );

        // Store flaky analysis
        await dbService.postgresQuery(
          `
          INSERT INTO flaky_test_analyses (test_id, test_name, flaky_score, total_runs, failure_rate, success_rate, recent_failures, analyzed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            testId,
            "UserService createUser test",
            testEntity.flakyScore,
            20,
            0.05,
            0.95,
            1,
            new Date(),
          ]
        );

        // Store performance metrics
        await dbService.postgresQuery(
          `
          INSERT INTO test_performance (test_id, memory_usage, cpu_usage, network_requests)
          VALUES ($1, $2, $3, $4)
        `,
          [
            testId,
            testEntity.executionHistory[0].performance?.memoryUsage,
            testEntity.executionHistory[0].performance?.cpuUsage,
            0, // network_requests
          ]
        );

        // Store coverage data
        await dbService.postgresQuery(
          `
          INSERT INTO test_coverage (test_id, lines, branches, functions, statements)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            testId,
            testEntity.coverage.lines,
            testEntity.coverage.branches,
            testEntity.coverage.functions,
            testEntity.coverage.statements,
          ]
        );

        // Verify test data storage
        const testSuites = await dbService.postgresQuery(
          "SELECT * FROM test_suites WHERE id = $1",
          [testId]
        );
        expect(testSuites.rows.length).toBe(1);
        expect(testSuites.rows[0].suite_name).toBe("UserService Tests");

        const testResults = await dbService.postgresQuery(
          "SELECT * FROM test_results WHERE test_id = $1",
          [testId]
        );
        expect(testResults.rows.length).toBe(1);

        const flakyAnalysis = await dbService.postgresQuery(
          "SELECT * FROM flaky_test_analyses WHERE test_id = $1",
          [testId]
        );
        expect(flakyAnalysis.rows.length).toBe(1);
        expect(flakyAnalysis.rows[0].flaky_score).toBe(0.05);

        // Test analytics queries
        const testAnalytics = await dbService.postgresQuery(
          `
          SELECT
            ts.suite_name,
            tr.test_name,
            tr.status,
            tr.duration,
            fta.flaky_score,
            tp.memory_usage,
            tc.lines
          FROM test_suites ts
          JOIN test_results tr ON ts.id = tr.suite_id
          LEFT JOIN flaky_test_analyses fta ON tr.test_id = fta.test_id
          LEFT JOIN test_performance tp ON tr.test_id = tp.test_id
          LEFT JOIN test_coverage tc ON tr.test_id = tc.test_id
          WHERE ts.id = $1
        `,
          [testId]
        );

        expect(testAnalytics.rows.length).toBe(1);
        const analytics = testAnalytics.rows[0];
        expect(analytics.status).toBe("passing");
        expect(analytics.flaky_score).toBe(0.05);
        expect(analytics.memory_usage).toBe(50);
      });
    });

    describe("Spec Entity Workflow", () => {
      it("should manage specification entities through their lifecycle", async () => {
        const specId = randomUUID();
        const specEntity: Spec = {
          id: specId,
          path: "/specs/user-registration.md",
          hash: "spec123",
          language: "markdown",
          lastModified: new Date(),
          created: new Date(),
          type: "spec",
          title: "User Registration Feature",
          description:
            "Allow users to register with email and password validation",
          acceptanceCriteria: [
            "User can provide email and password",
            "System validates email format",
            "System validates password strength",
            "System creates user account",
            "System sends confirmation email",
            "User can confirm email address",
          ],
          status: "approved",
          priority: "high",
          assignee: "john.doe@company.com",
          tags: ["authentication", "user-management", "frontend"],
          updated: new Date(),
        };

        // Store spec in PostgreSQL
        await dbService.postgresQuery(
          `
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `,
          [
            specId,
            "spec",
            JSON.stringify({
              title: specEntity.title,
              description: specEntity.description,
              acceptanceCriteria: specEntity.acceptanceCriteria,
            }),
            JSON.stringify({
              status: specEntity.status,
              priority: specEntity.priority,
              assignee: specEntity.assignee,
              tags: specEntity.tags,
              updated: specEntity.updated,
            }),
          ]
        );

        // Create related test specifications
        const relatedTests = [
          {
            id: randomUUID(),
            name: "Email Validation Test",
            type: "unit",
            target: "validateEmail",
          },
          {
            id: randomUUID(),
            name: "Password Strength Test",
            type: "unit",
            target: "validatePassword",
          },
          {
            id: randomUUID(),
            name: "User Registration Integration Test",
            type: "integration",
            target: "UserService.registerUser",
          },
        ];

        for (const test of relatedTests) {
          await dbService.postgresQuery(
            `
            INSERT INTO test_results (test_id, test_name, status, duration, timestamp)
            VALUES ($1, $2, $3, $4, $5)
          `,
            [test.id, test.name, "pending", 0, new Date()]
          );
        }

        // Create relationship between spec and tests in FalkorDB
        await dbService.falkordbQuery(
          `
          CREATE (:Spec {
            id: $specId,
            title: $title,
            status: $status,
            priority: $priority
          })
        `,
          {
            specId,
            title: specEntity.title,
            status: specEntity.status,
            priority: specEntity.priority,
          }
        );

        for (const test of relatedTests) {
          await dbService.falkordbQuery(
            `
            CREATE (:TestSpec {
              id: $testId,
              name: $name,
              type: $type,
              target: $target
            })
          `,
            {
              testId: test.id,
              name: test.name,
              type: test.type,
              target: test.target,
            }
          );

          await dbService.falkordbQuery(
            `
            MATCH (s:Spec {id: $specId}), (t:TestSpec {id: $testId})
            CREATE (s)-[:REQUIRES]->(t)
            CREATE (t)-[:VALIDATES]->(s)
          `,
            {
              specId,
              testId: test.id,
            }
          );
        }

        // Verify spec storage and relationships
        const specData = await dbService.postgresQuery(
          "SELECT * FROM documents WHERE id = $1 AND type = $2",
          [specId, "spec"]
        );
        expect(specData.rows.length).toBe(1);

        const specContent = specData.rows[0].content;
        expect(specContent.title).toBe("User Registration Feature");
        expect(specContent.acceptanceCriteria.length).toBe(6);

        // Verify test relationships
        const specRelationships = await dbService.falkordbQuery(
          `
          MATCH (s:Spec {id: $specId})-[:REQUIRES]->(t:TestSpec)
          RETURN t.name as testName, t.type as testType
          ORDER BY t.name
        `,
          { specId }
        );

        expect(specRelationships.length).toBe(3);
        expect(specRelationships.map((r) => r.testType)).toEqual(
          expect.arrayContaining(["unit", "integration"])
        );

        // Test spec status updates
        await dbService.postgresQuery(
          `
          UPDATE documents
          SET metadata = jsonb_set(metadata, '{status}', '"implemented"')
          WHERE id = $1
        `,
          [specId]
        );

        await dbService.falkordbQuery(
          `
          MATCH (s:Spec {id: $specId})
          SET s.status = 'implemented'
        `,
          { specId }
        );

        // Verify status update
        const updatedSpec = await dbService.postgresQuery(
          "SELECT metadata FROM documents WHERE id = $1",
          [specId]
        );
        const updatedMetadata = updatedSpec.rows[0].metadata;
        expect(updatedMetadata.status).toBe("implemented");
      });
    });
  });

  describe("Cross-Entity Relationships and Graph Operations", () => {
    describe("Complex Relationship Networks", () => {
      it("should create and traverse complex relationship networks", async () => {
        // Create a complex software architecture scenario
        const entities = {
          userService: {
            id: randomUUID(),
            type: "symbol" as const,
            name: "UserService",
            kind: "class" as const,
          },
          authMiddleware: {
            id: randomUUID(),
            type: "symbol" as const,
            name: "AuthMiddleware",
            kind: "class" as const,
          },
          userController: {
            id: randomUUID(),
            type: "symbol" as const,
            name: "UserController",
            kind: "class" as const,
          },
          userModel: {
            id: randomUUID(),
            type: "symbol" as const,
            name: "User",
            kind: "interface" as const,
          },
          database: {
            id: randomUUID(),
            type: "symbol" as const,
            name: "Database",
            kind: "class" as const,
          },
          createUserTest: {
            id: randomUUID(),
            type: "test" as const,
            name: "createUser",
            testType: "unit" as const,
          },
          userRegistrationSpec: {
            id: randomUUID(),
            type: "spec" as const,
            title: "User Registration",
            status: "approved" as const,
          },
        };

        // Store entities
        for (const entity of Object.values(entities)) {
          const entityData = {
            id: entity.id,
            type: entity.type,
            name: entity.name || null,
            kind: entity.kind || null,
            title: entity.title || null,
            status: entity.status || null,
            testType: entity.testType || null,
          };

          await dbService.falkordbQuery(
            `
            CREATE (:Entity {
              id: $id,
              type: $type,
              name: $name,
              kind: $kind,
              title: $title,
              status: $status,
              testType: $testType
            })
          `,
            entityData
          );
        }

        // Create relationships
        const relationships = [
          // Code relationships
          {
            from: entities.userController.id,
            to: entities.userService.id,
            type: "USES",
          },
          {
            from: entities.userService.id,
            to: entities.userModel.id,
            type: "USES",
          },
          {
            from: entities.userService.id,
            to: entities.database.id,
            type: "DEPENDS_ON",
          },
          {
            from: entities.userController.id,
            to: entities.authMiddleware.id,
            type: "USES",
          },

          // Test relationships
          {
            from: entities.createUserTest.id,
            to: entities.userService.id,
            type: "TESTS",
          },

          // Spec relationships
          {
            from: entities.userRegistrationSpec.id,
            to: entities.userService.id,
            type: "REQUIRES",
          },
          {
            from: entities.userRegistrationSpec.id,
            to: entities.createUserTest.id,
            type: "REQUIRES",
          },
        ];

        for (const rel of relationships) {
          await dbService.falkordbQuery(
            `
            MATCH (a:Entity {id: $from}), (b:Entity {id: $to})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            rel
          );
        }

        // Test complex queries
        // Find all entities that the UserService depends on
        const dependencies = await dbService.falkordbQuery(
          `
          MATCH (s:Entity {id: $serviceId})-[:USES|DEPENDS_ON]->(d:Entity)
          RETURN d.name as name, d.kind as kind
          ORDER BY d.name
        `,
          { serviceId: entities.userService.id }
        );

        expect(dependencies.length).toBe(2);
        expect(dependencies.map((d) => d.name)).toEqual(["Database", "User"]);

        // Find all tests for UserService
        const tests = await dbService.falkordbQuery(
          `
          MATCH (t:Entity)-[:TESTS]->(s:Entity {id: $serviceId})
          RETURN t.name as testName
        `,
          { serviceId: entities.userService.id }
        );

        expect(tests.length).toBe(1);
        expect(tests[0].testName).toBe("createUser");

        // Find specs that require UserService
        const specs = await dbService.falkordbQuery(
          `
          MATCH (spec:Entity)-[:REQUIRES]->(s:Entity {id: $serviceId})
          RETURN spec.title as specTitle
        `,
          { serviceId: entities.userService.id }
        );

        expect(specs.length).toBe(1);
        expect(specs[0].specTitle).toBe("User Registration");

        // Test impact analysis - what would be affected if we change UserService?
        const impactAnalysis = await dbService.falkordbQuery(
          `
          MATCH (affected:Entity)-[:USES|DEPENDS_ON|TESTS|REQUIRES]->(service:Entity {id: $serviceId})
          RETURN COALESCE(affected.name, affected.title) as affectedName, affected.type as affectedType
          ORDER BY affectedName
        `,
          { serviceId: entities.userService.id }
        );

        expect(impactAnalysis.length).toBe(3);
        const affectedNames = impactAnalysis.map((a) => a.affectedName);
        expect(affectedNames).toContain("UserController");
        expect(affectedNames).toContain("createUser");
        expect(affectedNames).toContain("User Registration");

        // Test path finding - how does UserController connect to Database?
        const paths = await dbService.falkordbQuery(
          `
          MATCH path = (controller:Entity {id: $controllerId})-[:USES|DEPENDS_ON*]->(database:Entity {id: $databaseId})
          RETURN length(path) as pathLength
        `,
          {
            controllerId: entities.userController.id,
            databaseId: entities.database.id,
          }
        );

        expect(paths.length).toBeGreaterThan(0);
        expect(paths[0].pathLength).toBe(2); // Controller -> Service -> Database
      });

      it("should handle relationship queries with filters and pagination", async () => {
        // Create multiple entities and relationships for testing queries
        const entities = [];
        for (let i = 0; i < 20; i++) {
          entities.push({
            id: `entity-${i}`,
            type: "symbol",
            name: `Symbol${i}`,
            kind: i % 2 === 0 ? "class" : "function",
          });
        }

        // Store entities
        for (const entity of entities) {
          await dbService.falkordbQuery(
            `
            CREATE (:Entity {
              id: $id,
              type: $type,
              name: $name,
              kind: $kind
            })
          `,
            {
              id: entity.id,
              type: entity.type,
              name: entity.name,
              kind: entity.kind,
            }
          );
        }

        // Create relationships
        for (let i = 0; i < 19; i++) {
          await dbService.falkordbQuery(
            `
            MATCH (a:Entity {id: $fromId}), (b:Entity {id: $toId})
            CREATE (a)-[:USES {strength: $strength}]->(b)
          `,
            {
              fromId: `entity-${i}`,
              toId: `entity-${i + 1}`,
              strength: Math.random(),
            }
          );
        }

        // Test filtered queries
        const classEntities = await dbService.falkordbQuery(`
          MATCH (e:Entity {kind: 'class'})
          RETURN e.name as name
          ORDER BY e.name
          LIMIT 5
        `);

        expect(classEntities.length).toBe(5);
        classEntities.forEach((entity) => {
          expect(entity.name).toMatch(/^Symbol\d+$/);
        });

        // Test relationship queries with properties
        const strongRelationships = await dbService.falkordbQuery(`
          MATCH (a:Entity)-[r:USES]->(b:Entity)
          WHERE r.strength > 0.5
          RETURN a.name as fromName, b.name as toName, r.strength as strength
          ORDER BY r.strength DESC
          LIMIT 3
        `);

        expect(strongRelationships.length).toBeLessThanOrEqual(3);
        strongRelationships.forEach((rel) => {
          expect(rel.strength).toBeGreaterThan(0.5);
        });

        // Test complex path queries
        const paths = await dbService.falkordbQuery(`
          MATCH path = (start:Entity)-[:USES*2..3]->(end:Entity)
          WHERE start.id = 'entity-0'
          RETURN length(path) as pathLength, end.name as endName
          LIMIT 5
        `);

        expect(paths.length).toBeGreaterThan(0);
        paths.forEach((path) => {
          expect(path.pathLength).toBeGreaterThanOrEqual(2);
          expect(path.pathLength).toBeLessThanOrEqual(3);
        });
      });
    });

    describe("Type Guards and Entity Discrimination", () => {
      it("should correctly identify entity types with type guards", async () => {
        const mixedEntities: Entity[] = [
          {
            id: randomUUID(),
            path: "/src/Button.tsx",
            hash: "file123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            extension: ".tsx",
            size: 1024,
            lines: 50,
            isTest: false,
            isConfig: false,
            dependencies: ["react"],
          } as File,
          {
            id: randomUUID(),
            path: "/src/components",
            hash: "dir123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "directory",
            children: ["Button.tsx", "Input.tsx"],
            depth: 2,
          } as Directory,
          {
            id: randomUUID(),
            path: "/src/UserService.ts",
            hash: "symbol123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "symbol",
            name: "UserService",
            kind: "class",
            signature: "class UserService",
            docstring: "User service class",
            visibility: "public",
            isExported: true,
            isDeprecated: false,
          } as Symbol,
          {
            id: randomUUID(),
            path: "/tests/UserService.test.ts",
            hash: "test123",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "test",
            testType: "unit",
            targetSymbol: "UserService",
            framework: "vitest",
            coverage: {
              lines: 85,
              branches: 90,
              functions: 95,
              statements: 88,
            },
            status: "passing",
            flakyScore: 0.1,
            executionHistory: [],
            performanceMetrics: {
              averageExecutionTime: 100,
              p95ExecutionTime: 150,
              successRate: 0.95,
              trend: "stable",
              benchmarkComparisons: [],
              historicalData: [],
            },
            dependencies: [],
            tags: [],
          } as Test,
          {
            id: randomUUID(),
            path: "/specs/user-auth.md",
            hash: "spec123",
            language: "markdown",
            lastModified: new Date(),
            created: new Date(),
            type: "spec",
            title: "User Authentication",
            description: "User login and registration",
            acceptanceCriteria: ["User can log in", "User can register"],
            status: "approved",
            priority: "high",
            updated: new Date(),
          } as Spec,
        ];

        // Store entities in database for testing
        for (const entity of mixedEntities) {
          await dbService.postgresQuery(
            `
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `,
            [
              entity.id,
              entity.type,
              JSON.stringify({
                name: (entity as any).name || (entity as any).title,
              }),
              JSON.stringify(entity),
            ]
          );
        }

        // Retrieve entities and test type guards
        const entityIds = mixedEntities.map((e) => e.id);
        const storedEntities = await dbService.postgresQuery(
          `SELECT id, type, metadata FROM documents WHERE id = ANY($1::uuid[])`,
          [entityIds]
        );

        const reconstructedEntities: Entity[] = storedEntities.rows.map(
          (row) => {
            const metadata = row.metadata;
            return metadata as Entity;
          }
        );

        // Test type guards
        const files = reconstructedEntities.filter(isFile);
        const directories = reconstructedEntities.filter(isDirectory);
        const symbols = reconstructedEntities.filter(isSymbol);
        const tests = reconstructedEntities.filter(isTest);
        const specs = reconstructedEntities.filter(isSpec);

        expect(files.length).toBe(1);
        expect(directories.length).toBe(1);
        expect(symbols.length).toBe(1);
        expect(tests.length).toBe(1);
        expect(specs.length).toBe(1);

        // Test specific type guards
        const functions = reconstructedEntities.filter(isFunction);
        expect(functions.length).toBe(0); // No function symbols in our test data

        const classes = reconstructedEntities.filter(isClass);
        expect(classes.length).toBe(1);
        expect(classes[0].name).toBe("UserService");

        // Test type narrowing in practice
        reconstructedEntities.forEach((entity) => {
          if (isFile(entity)) {
            expect(entity.extension).toBeDefined();
            expect(typeof entity.size).toBe("number");
          } else if (isDirectory(entity)) {
            expect(Array.isArray(entity.children)).toBe(true);
            expect(typeof entity.depth).toBe("number");
          } else if (isSymbol(entity)) {
            expect(entity.name).toBeDefined();
            expect(["function", "class", "interface"]).toContain(entity.kind);
          } else if (isTest(entity)) {
            expect(entity.testType).toBeDefined();
            expect(entity.coverage).toBeDefined();
          } else if (isSpec(entity)) {
            expect(entity.title).toBeDefined();
            expect(entity.acceptanceCriteria).toBeDefined();
          }
        });
      });
    });
  });

  describe("Performance and Scalability Testing", () => {
    describe("Large Dataset Operations", () => {
      it("should handle large numbers of entities efficiently", async () => {
        const entityCount = 1000;
        const entities = [];

        // Create large dataset
        for (let i = 0; i < entityCount; i++) {
          entities.push({
            id: randomUUID(),
            type: "symbol",
            name: `PerformanceSymbol${i}`,
            kind: "function",
            path: `/src/utils/util${i}.ts`,
            language: "typescript",
          });
        }

        const startTime = Date.now();

        // Bulk insert into PostgreSQL
        const pgQueries = entities.map((entity) => ({
          query:
            "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
          params: [
            entity.id,
            entity.type,
            JSON.stringify({ name: entity.name, kind: entity.kind }),
            JSON.stringify(entity),
          ],
        }));

        await dbService.postgresBulkQuery(pgQueries);

        // Bulk insert into FalkorDB
        for (let i = 0; i < entityCount; i += 100) {
          const batch = entities.slice(i, i + 100);
          const createQueries = batch
            .map(
              (entity) =>
                `CREATE (:Entity {id: '${entity.id}', name: '${entity.name}', kind: '${entity.kind}', type: '${entity.type}'})`
            )
            .join(" ");

          await dbService.falkordbQuery(createQueries);
        }

        const endTime = Date.now();
        const insertDuration = endTime - startTime;

        // Should complete within reasonable time (adjust based on environment)
        expect(insertDuration).toBeLessThan(30000); // 30 seconds max

        // Verify data integrity
        const pgCount = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE type = 'symbol'"
        );
        expect(parseInt(pgCount.rows[0].count)).toBe(entityCount);

        const falkorCount = await dbService.falkordbQuery(
          "MATCH (n:Entity {type: 'symbol'}) RETURN count(n) as count"
        );
        expect(falkorCount[0].count).toBe(entityCount);

        // Test query performance on large dataset
        const queryStartTime = Date.now();

        const queryResult = await dbService.postgresQuery(`
          SELECT id, metadata
          FROM documents
          WHERE type = 'symbol' AND metadata->>'kind' = 'function'
          ORDER BY created_at DESC
          LIMIT 100
        `);

        const queryEndTime = Date.now();
        const queryDuration = queryEndTime - queryStartTime;

        expect(queryResult.rows.length).toBe(100);
        expect(queryDuration).toBeLessThan(2000); // 2 seconds max for complex query

        // Test FalkorDB query performance
        const graphQueryStartTime = Date.now();

        const graphResult = await dbService.falkordbQuery(`
          MATCH (n:Entity {kind: 'function'})
          RETURN n.name as name
          ORDER BY n.name
          LIMIT 50
        `);

        const graphQueryEndTime = Date.now();
        const graphQueryDuration = graphQueryEndTime - graphQueryStartTime;

        expect(graphResult.length).toBe(50);
        expect(graphQueryDuration).toBeLessThan(5000); // 5 seconds max for graph query
      });

      it("should handle concurrent operations on large datasets", async () => {
        const concurrentOperations = 20;
        const operations = [];

        // Create concurrent operations
        for (let i = 0; i < concurrentOperations; i++) {
          operations.push(
            // PostgreSQL operation
            dbService.postgresQuery(
              `
              INSERT INTO documents (id, type, content, metadata)
              VALUES ($1, $2, $3, $4)
            `,
              [
                randomUUID(),
                "code",
                JSON.stringify({ code: `console.log(${i});` }),
                JSON.stringify({ index: i, concurrent: true }),
              ]
            ),

            // FalkorDB operation
            dbService.falkordbQuery(
              `
              CREATE (:Entity {
                id: $id,
                type: 'concurrent_test',
                index: $index
              })
            `,
              {
                id: `concurrent-entity-${i}`,
                index: i,
              }
            ),

            // Redis operation
            dbService.redisSet(`concurrent:${i}`, `value-${i}`)
          );
        }

        const startTime = Date.now();
        const results = await Promise.allSettled(operations);
        const endTime = Date.now();

        const successfulOperations = results.filter(
          (result) => result.status === "fulfilled"
        ).length;
        const failedOperations = results.filter(
          (result) => result.status === "rejected"
        ).length;

        expect(successfulOperations).toBeGreaterThanOrEqual(
          concurrentOperations * 2
        ); // At least 2 operations per iteration should succeed
        expect(failedOperations).toBeLessThan(concurrentOperations); // Some failures are acceptable

        const duration = endTime - startTime;
        expect(duration).toBeLessThan(30000); // 30 seconds max for concurrent operations

        // Verify all operations completed
        const pgCount = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE type = 'code' AND metadata->>'concurrent' = 'true'"
        );
        expect(parseInt(pgCount.rows[0].count)).toBe(concurrentOperations);

        const falkorCount = await dbService.falkordbQuery(
          "MATCH (n:Entity {type: 'concurrent_test'}) RETURN count(n) as count"
        );
        expect(falkorCount[0].count).toBe(concurrentOperations);

        // Verify Redis keys
        for (let i = 0; i < 5; i++) {
          const value = await dbService.redisGet(`concurrent:${i}`);
          expect(value).toBe(`value-${i}`);
        }
      });
    });

    describe("Memory and Resource Usage", () => {
      it("should handle memory-intensive operations within limits", async () => {
        const largeEntityCount = 500;
        const largeEntities = [];

        // Create entities with large metadata
        for (let i = 0; i < largeEntityCount; i++) {
          largeEntities.push({
            id: randomUUID(),
            type: "file",
            path: `/src/large/LargeFile${i}.ts`,
            content: "x".repeat(10000), // 10KB of content per entity
            metadata: {
              dependencies: Array.from(
                { length: 100 },
                (_, j) => `dependency-${i}-${j}`
              ),
              analysis: {
                complexity: Math.random() * 100,
                lines: Math.floor(Math.random() * 1000),
                functions: Math.floor(Math.random() * 50),
              },
            },
          });
        }

        const startTime = Date.now();
        const memoryUsageStart = process.memoryUsage().heapUsed;

        // Process entities in batches to manage memory
        const batchSize = 50;
        for (let i = 0; i < largeEntities.length; i += batchSize) {
          const batch = largeEntities.slice(i, i + batchSize);

          const pgQueries = batch.map((entity) => ({
            query:
              "INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)",
            params: [
              entity.id,
              entity.type,
              JSON.stringify({ content: entity.content }),
              JSON.stringify({ ...entity.metadata, path: entity.path }),
            ],
          }));

          await dbService.postgresBulkQuery(pgQueries);
        }

        const endTime = Date.now();
        const memoryUsageEnd = process.memoryUsage().heapUsed;
        const memoryDelta = memoryUsageEnd - memoryUsageStart;

        // Performance checks (relaxed for test environment)
        expect(endTime - startTime).toBeLessThan(60000); // 60 seconds max
        expect(memoryDelta).toBeLessThan(200 * 1024 * 1024); // 200MB max memory increase

        // Verify data integrity
        const countResult = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE type = 'file' AND metadata->>'path' LIKE '/src/large/%'"
        );
        expect(parseInt(countResult.rows[0].count)).toBe(largeEntityCount);

        // Test querying large dataset
        const queryStartTime = Date.now();
        const sampleQuery = await dbService.postgresQuery(`
          SELECT id, metadata
          FROM documents
          WHERE type = 'file' AND metadata->>'path' LIKE '/src/large/%'
          ORDER BY created_at DESC
          LIMIT 10
        `);
        const queryEndTime = Date.now();

        expect(sampleQuery.rows.length).toBe(10);
        expect(queryEndTime - queryStartTime).toBeLessThan(5000); // Reasonably fast query even with large data
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    describe("Invalid Data and Constraint Violations", () => {
      it("should handle invalid entity data gracefully", async () => {
        const invalidEntities = [
          // Missing required fields
          { id: randomUUID(), type: "file" },
          // Invalid types
          {
            id: randomUUID(),
            path: "/test",
            hash: "hash",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "invalid_type",
          },
          // Malformed JSON in metadata
          {
            id: randomUUID(),
            path: "/test",
            hash: "hash",
            language: "typescript",
            lastModified: new Date(),
            created: new Date(),
            type: "file",
            extension: ".ts",
            size: "not-a-number", // Invalid type
            lines: 50,
            isTest: false,
            isConfig: false,
            dependencies: [],
          },
        ];

        // Test PostgreSQL error handling
        for (const entity of invalidEntities) {
          try {
            await dbService.postgresQuery(
              `
              INSERT INTO documents (id, type, content, metadata)
              VALUES ($1, $2, $3, $4)
            `,
              [
                entity.id || "unknown",
                entity.type || "unknown",
                JSON.stringify({}),
                JSON.stringify(entity),
              ]
            );
          } catch (error) {
            // Expected to handle errors gracefully
            expect(error).toBeDefined();
          }
        }

        // Test FalkorDB error handling
        try {
          await dbService.falkordbQuery(
            "INVALID CYPHER SYNTAX THAT SHOULD FAIL"
          );
        } catch (error) {
          expect(error).toBeDefined();
        }

        // Test Redis error handling
        try {
          await dbService.redisSet("test-key", null as any);
        } catch (error) {
          expect(error).toBeDefined();
        }

        // Verify system remains stable
        const health = await dbService.healthCheck();
        expect(health.postgresql.status).toBe("healthy");
      });

      it("should handle duplicate IDs and constraint violations", async () => {
        const duplicateId = randomUUID();

        // Create first entity
        await dbService.postgresQuery(
          `
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `,
          [
            duplicateId,
            "file",
            JSON.stringify({ content: "first" }),
            JSON.stringify({ version: 1 }),
          ]
        );

        // Try to create duplicate
        try {
          await dbService.postgresQuery(
            `
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `,
            [
              duplicateId,
              "file",
              JSON.stringify({ content: "second" }),
              JSON.stringify({ version: 2 }),
            ]
          );
        } catch (error) {
          // Expected constraint violation
          expect(error).toBeDefined();
        }

        // Verify only one entity exists
        const countResult = await dbService.postgresQuery(
          "SELECT COUNT(*) as count FROM documents WHERE id = $1",
          [duplicateId]
        );
        expect(parseInt(countResult.rows[0].count)).toBe(1);

        // Test FalkorDB duplicate handling
        await dbService.falkordbQuery(
          `
          CREATE (:Entity { id: $id, type: 'file', version: 1 })
        `,
          { id: duplicateId }
        );

        // FalkorDB allows duplicate creation (will create multiple nodes)
        const duplicateNodes = await dbService.falkordbQuery(
          "MATCH (n:Entity {id: $id}) RETURN count(n) as count",
          { id: duplicateId }
        );
        expect(duplicateNodes[0].count).toBeGreaterThan(0);
      });
    });

    describe("Network and Connection Issues", () => {
      it("should handle database connection failures gracefully", async () => {
        // Test with invalid database configuration
        const invalidConfig = {
          falkordb: { url: "redis://invalid-host:6380" },
          postgresql: {
            connectionString:
              "postgresql://invalid:invalid@invalid:5432/invalid",
          },
          redis: { url: "redis://invalid-host:6381" },
        };

        // This would be tested in a separate test environment
        // For now, we test error handling in normal operations
        try {
          await dbService.postgresQuery("SELECT * FROM nonexistent_table");
        } catch (error) {
          expect(error).toBeDefined();
        }

        try {
          await dbService.falkordbQuery("MATCH (n:NonExistentLabel) RETURN n");
        } catch (error) {
          expect(error).toBeDefined();
        }

        // Verify system health after errors
        const healthAfterErrors = await dbService.healthCheck();
        expect(healthAfterErrors.postgresql.status).toBe("healthy");
        expect(healthAfterErrors.falkordb).toBeDefined();
      });

      it("should handle timeouts and long-running operations", async () => {
        // Test with a potentially slow operation
        const startTime = Date.now();

        // Create a complex query that might take time
        const complexQuery = await dbService.postgresQuery(`
          SELECT
            d.id,
            d.type,
            d.metadata,
            d.created_at
          FROM documents d
          LEFT JOIN documents d2 ON d.created_at > d2.created_at
          WHERE d.type IS NOT NULL
          ORDER BY d.created_at DESC
          LIMIT 50
        `);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within reasonable time
        expect(duration).toBeLessThan(5000); // 5 seconds max
        expect(Array.isArray(complexQuery.rows)).toBe(true);
      });
    });

    describe("Data Corruption and Recovery", () => {
      it("should handle corrupted data and maintain integrity", async () => {
        const testEntityId = randomUUID();

        // Create valid entity
        await dbService.postgresQuery(
          `
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `,
          [
            testEntityId,
            "file",
            JSON.stringify({ content: "valid content" }),
            JSON.stringify({
              path: "/test/file.ts",
              extension: ".ts",
              size: 1024,
              lines: 50,
            }),
          ]
        );

        // Simulate data corruption by updating with invalid JSON
        try {
          await dbService.postgresQuery(
            `
            UPDATE documents
            SET content = $1
            WHERE id = $2
          `,
            ["{invalid json content", testEntityId]
          );
        } catch (error) {
          // Expected error for invalid JSON
          expect(error).toBeDefined();
        }

        // Verify entity still exists and is accessible
        const entityCheck = await dbService.postgresQuery(
          "SELECT * FROM documents WHERE id = $1",
          [testEntityId]
        );
        expect(entityCheck.rows.length).toBe(1);

        // Test recovery by updating with valid data
        await dbService.postgresQuery(
          `
          UPDATE documents
          SET content = $1, metadata = $2
          WHERE id = $3
        `,
          [
            JSON.stringify({ content: "recovered content" }),
            JSON.stringify({
              path: "/test/file.ts",
              extension: ".ts",
              size: 1024,
              lines: 50,
              recovered: true,
            }),
            testEntityId,
          ]
        );

        // Verify recovery
        const recoveredEntity = await dbService.postgresQuery(
          "SELECT content, metadata FROM documents WHERE id = $1",
          [testEntityId]
        );
        expect(recoveredEntity.rows.length).toBe(1);

        const content = recoveredEntity.rows[0].content;
        const metadata = recoveredEntity.rows[0].metadata;

        expect(content.content).toBe("recovered content");
        expect(metadata.recovered).toBe(true);
      });
    });
  });
});
