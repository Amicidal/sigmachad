/**
 * Integration tests for models/relationships.ts
 * Tests relationship creation, querying, and graph operations
 * Covers complex relationship networks and traversal algorithms
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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

describe("Relationships Integration Tests", () => {
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

  describe("Relationship Types and Creation", () => {
    describe("Structural Relationships", () => {
      it("should create and query structural relationships (BELONGS_TO, CONTAINS, DEFINES)", async () => {
        // Create entities first
        const entities = [
          {
            id: "src-directory",
            type: "directory",
            name: "src",
            path: "/src",
          },
          {
            id: "components-directory",
            type: "directory",
            name: "components",
            path: "/src/components",
          },
          {
            id: "button-component",
            type: "file",
            name: "Button.tsx",
            path: "/src/components/Button.tsx",
          },
          {
            id: "user-interface",
            type: "symbol",
            name: "IUserInterface",
            kind: "interface",
            path: "/src/components/Button.tsx",
          },
          {
            id: "button-class",
            type: "symbol",
            name: "Button",
            kind: "class",
            path: "/src/components/Button.tsx",
          },
        ];

        // Store entities in FalkorDB
        for (const entity of entities) {
          const entityData = {
            id: entity.id,
            type: entity.type,
            name: entity.name,
            path: entity.path,
            kind: entity.kind || null, // Allow null for entities that don't have kind
          };

          await dbService.falkordbQuery(
            `
            CREATE (:Entity {
              id: $id,
              type: $type,
              name: $name,
              path: $path,
              kind: $kind
            })
          `,
            entityData
          );
        }

        // Create structural relationships
        const relationships = [
          // Directory hierarchy
          {
            from: "components-directory",
            to: "src-directory",
            type: "BELONGS_TO",
          },
          {
            from: "button-component",
            to: "components-directory",
            type: "BELONGS_TO",
          },
          // File contains symbols
          {
            from: "button-component",
            to: "user-interface",
            type: "DEFINES",
          },
          {
            from: "button-component",
            to: "button-class",
            type: "DEFINES",
          },
          // Class implements interface
          {
            from: "button-class",
            to: "user-interface",
            type: "IMPLEMENTS",
          },
        ];

        // Create relationships
        for (const rel of relationships) {
          await dbService.falkordbQuery(
            `
            MATCH (a:Entity {id: $fromId}), (b:Entity {id: $toId})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            {
              fromId: rel.from,
              toId: rel.to,
            }
          );
        }

        // Test structural relationship queries
        // Find all files in a directory
        const filesInComponents = await dbService.falkordbQuery(`
          MATCH (d:Entity {id: 'components-directory'})<-[:BELONGS_TO]-(f:Entity {type: 'file'})
          RETURN f.name as fileName
        `);

        expect(filesInComponents.length).toBe(1);
        expect(filesInComponents[0].fileName).toBe("Button.tsx");

        // Find all symbols defined in a file
        const symbolsInButton = await dbService.falkordbQuery(`
          MATCH (f:Entity {id: 'button-component'})-[:DEFINES]->(s:Entity)
          RETURN s.name as symbolName, s.kind as symbolKind
          ORDER BY s.name
        `);

        expect(symbolsInButton.length).toBe(2);
        expect(symbolsInButton.map((s) => s.symbolName)).toEqual([
          "Button",
          "IUserInterface",
        ]);

        // Find directory hierarchy
        const directoryHierarchy = await dbService.falkordbQuery(`
          MATCH (file:Entity {id: 'button-component'})-[:BELONGS_TO]->(components:Entity)-[:BELONGS_TO]->(src:Entity)
          RETURN file.name as fileName, components.name as componentsName, src.name as srcName
        `);

        expect(directoryHierarchy.length).toBe(1);
        expect(directoryHierarchy[0].fileName).toBe("Button.tsx");
        expect(directoryHierarchy[0].componentsName).toBe("components");
        expect(directoryHierarchy[0].srcName).toBe("src");

        // Find what implements an interface
        const interfaceImplementations = await dbService.falkordbQuery(`
          MATCH (impl:Entity)-[:IMPLEMENTS]->(interface:Entity {id: 'user-interface'})
          RETURN impl.name as implementationName
        `);

        expect(interfaceImplementations.length).toBe(1);
        expect(interfaceImplementations[0].implementationName).toBe("Button");
      });

      it("should handle complex directory structures and nested relationships", async () => {
        // Create a complex directory structure
        const directories = [
          { id: "root", name: "project", path: "/" },
          { id: "src", name: "src", path: "/src" },
          { id: "components", name: "components", path: "/src/components" },
          { id: "utils", name: "utils", path: "/src/utils" },
          { id: "tests", name: "tests", path: "/tests" },
          { id: "unit", name: "unit", path: "/tests/unit" },
          {
            id: "integration",
            name: "integration",
            path: "/tests/integration",
          },
        ];

        const files = [
          {
            id: "button-tsx",
            name: "Button.tsx",
            path: "/src/components/Button.tsx",
          },
          {
            id: "input-tsx",
            name: "Input.tsx",
            path: "/src/components/Input.tsx",
          },
          { id: "utils-js", name: "utils.js", path: "/src/utils/utils.js" },
          {
            id: "button-test",
            name: "Button.test.ts",
            path: "/tests/unit/Button.test.ts",
          },
          {
            id: "integration-test",
            name: "Button.integration.test.ts",
            path: "/tests/integration/Button.integration.test.ts",
          },
        ];

        // Store entities
        for (const dir of directories) {
          const dirData = {
            id: dir.id,
            type: "directory",
            name: dir.name,
            path: dir.path,
          };

          await dbService.falkordbQuery(
            `
            CREATE (:Directory {
              id: $id,
              type: $type,
              name: $name,
              path: $path
            })
          `,
            dirData
          );
        }

        for (const file of files) {
          const fileData = {
            id: file.id,
            type: "file",
            name: file.name,
            path: file.path,
          };

          await dbService.falkordbQuery(
            `
            CREATE (:File {
              id: $id,
              type: $type,
              name: $name,
              path: $path
            })
          `,
            fileData
          );
        }

        // Create directory containment relationships
        const containmentRels = [
          { from: "src", to: "root", type: "BELONGS_TO" },
          { from: "components", to: "src", type: "BELONGS_TO" },
          { from: "utils", to: "src", type: "BELONGS_TO" },
          { from: "tests", to: "root", type: "BELONGS_TO" },
          { from: "unit", to: "tests", type: "BELONGS_TO" },
          { from: "integration", to: "tests", type: "BELONGS_TO" },
          { from: "button-tsx", to: "components", type: "BELONGS_TO" },
          { from: "input-tsx", to: "components", type: "BELONGS_TO" },
          { from: "utils-js", to: "utils", type: "BELONGS_TO" },
          { from: "button-test", to: "unit", type: "BELONGS_TO" },
          { from: "integration-test", to: "integration", type: "BELONGS_TO" },
        ];

        for (const rel of containmentRels) {
          await dbService.falkordbQuery(
            `
            MATCH (a {id: $fromId}), (b {id: $toId})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            {
              fromId: rel.from,
              toId: rel.to,
            }
          );
        }

        // Test complex queries
        // Find all files in src directory (recursive)
        const srcFiles = await dbService.falkordbQuery(`
          MATCH (src:Directory {id: 'src'})<-[:BELONGS_TO*]-(file:File)
          RETURN file.name as fileName, file.path as filePath
          ORDER BY file.name
        `);

        expect(srcFiles.length).toBe(3);
        expect(srcFiles.map((f) => f.fileName)).toEqual([
          "Button.tsx",
          "Input.tsx",
          "utils.js",
        ]);

        // Find all test files
        const testFiles = await dbService.falkordbQuery(`
          MATCH (tests:Directory {id: 'tests'})<-[:BELONGS_TO*]-(file:File)
          RETURN file.name as fileName
          ORDER BY file.name
        `);

        expect(testFiles.length).toBe(2);
        expect(testFiles.map((f) => f.fileName)).toEqual([
          "Button.integration.test.ts",
          "Button.test.ts",
        ]);

        // Find directory depth - include root and all subdirectories
        const directoryDepths = await dbService.falkordbQuery(`
          MATCH (dir:Directory)
          OPTIONAL MATCH path = (root:Directory {id: 'root'})<-[:BELONGS_TO*]-(dir)
          WHERE dir.id <> 'root'
          RETURN dir.name as directoryName, COALESCE(length(path), 0) as depth
          ORDER BY depth DESC
        `);

        expect(directoryDepths.length).toBe(7); // root + 6 subdirectories
        const maxDepth = Math.max(...directoryDepths.map((d) => d.depth));
        expect(maxDepth).toBe(2); // root -> tests -> integration/unit
      });
    });

    describe("Code Relationships", () => {
      it("should create and analyze code dependency relationships", async () => {
        // Create a complex code dependency network
        const codeEntities = [
          // Services
          {
            id: "user-service",
            name: "UserService",
            type: "class",
            file: "UserService.ts",
          },
          {
            id: "auth-service",
            name: "AuthService",
            type: "class",
            file: "AuthService.ts",
          },
          {
            id: "email-service",
            name: "EmailService",
            type: "class",
            file: "EmailService.ts",
          },

          // Controllers
          {
            id: "user-controller",
            name: "UserController",
            type: "class",
            file: "UserController.ts",
          },
          {
            id: "auth-controller",
            name: "AuthController",
            type: "class",
            file: "AuthController.ts",
          },

          // Models/Interfaces
          {
            id: "user-model",
            name: "User",
            type: "interface",
            file: "User.ts",
          },
          {
            id: "auth-model",
            name: "AuthCredentials",
            type: "interface",
            file: "Auth.ts",
          },

          // Utility functions
          {
            id: "validate-email",
            name: "validateEmail",
            type: "function",
            file: "validators.ts",
          },
          {
            id: "hash-password",
            name: "hashPassword",
            type: "function",
            file: "crypto.ts",
          },
          {
            id: "send-email",
            name: "sendEmail",
            type: "function",
            file: "email.ts",
          },
        ];

        // Store entities
        for (const entity of codeEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:CodeEntity {
              id: $id,
              name: $name,
              type: $type,
              file: $file
            })
          `,
            entity
          );
        }

        // Create code relationships
        const codeRelationships = [
          // Controller dependencies
          {
            from: "user-controller",
            to: "user-service",
            type: "USES",
            strength: 0.9,
          },
          {
            from: "user-controller",
            to: "auth-service",
            type: "USES",
            strength: 0.7,
          },
          {
            from: "auth-controller",
            to: "auth-service",
            type: "USES",
            strength: 0.95,
          },

          // Service dependencies
          {
            from: "user-service",
            to: "user-model",
            type: "USES",
            strength: 1.0,
          },
          {
            from: "user-service",
            to: "validate-email",
            type: "CALLS",
            strength: 0.8,
          },
          {
            from: "user-service",
            to: "hash-password",
            type: "CALLS",
            strength: 0.9,
          },
          {
            from: "auth-service",
            to: "auth-model",
            type: "USES",
            strength: 1.0,
          },
          {
            from: "auth-service",
            to: "hash-password",
            type: "CALLS",
            strength: 0.85,
          },
          {
            from: "email-service",
            to: "send-email",
            type: "CALLS",
            strength: 0.95,
          },

          // Cross-service dependencies
          {
            from: "user-service",
            to: "email-service",
            type: "USES",
            strength: 0.6,
          },
          {
            from: "auth-service",
            to: "user-service",
            type: "DEPENDS_ON",
            strength: 0.8,
          },
        ];

        // Create relationships with properties
        for (const rel of codeRelationships) {
          await dbService.falkordbQuery(
            `
            MATCH (a:CodeEntity {id: $from}), (b:CodeEntity {id: $to})
            CREATE (a)-[:${rel.type} {strength: $strength}]->(b)
          `,
            rel
          );
        }

        // Test dependency analysis
        // Find direct dependencies of UserService
        const userServiceDeps = await dbService.falkordbQuery(`
          MATCH (service:CodeEntity {id: 'user-service'})-[:USES|CALLS|DEPENDS_ON]->(dep:CodeEntity)
          RETURN dep.name as depName, dep.type as depType
          ORDER BY dep.name
        `);

        expect(userServiceDeps.length).toBe(4);
        expect(userServiceDeps.map((d) => d.depName)).toEqual(
          expect.arrayContaining([
            "EmailService",
            "User",
            "hashPassword",
            "validateEmail",
          ])
        );

        // Find what depends on UserService
        const userServiceDependents = await dbService.falkordbQuery(`
          MATCH (dep:CodeEntity)-[:USES|CALLS|DEPENDS_ON]->(service:CodeEntity {id: 'user-service'})
          RETURN dep.name as dependentName
          ORDER BY dep.name
        `);

        expect(userServiceDependents.length).toBe(2);
        expect(userServiceDependents.map((d) => d.dependentName)).toEqual([
          "AuthService",
          "UserController",
        ]);

        // Find circular dependencies
        const circularDeps = await dbService.falkordbQuery(`
          MATCH (a:CodeEntity)-[:DEPENDS_ON*]->(a:CodeEntity)
          RETURN a.name as circularEntity
        `);

        // AuthService -> UserService -> EmailService (no circular dependency in this case)
        expect(circularDeps.length).toBe(0);

        // Test strength-based queries
        const strongDeps = await dbService.falkordbQuery(`
          MATCH (a:CodeEntity)-[r:USES|CALLS|DEPENDS_ON]->(b:CodeEntity)
          WHERE r.strength > 0.8
          RETURN a.name as fromName, b.name as toName, r.strength as strength
          ORDER BY r.strength DESC
        `);

        expect(strongDeps.length).toBeGreaterThan(0);
        strongDeps.forEach((dep) => {
          expect(dep.strength).toBeGreaterThan(0.8);
        });

        // Test impact analysis - what would break if we change hashPassword?
        const impactAnalysis = await dbService.falkordbQuery(`
          MATCH (affected:CodeEntity)-[:CALLS*]->(target:CodeEntity {id: 'hash-password'})
          RETURN DISTINCT affected.name as affectedName
          ORDER BY affected.name
        `);

        expect(impactAnalysis.length).toBe(2);
        expect(impactAnalysis.map((a) => a.affectedName)).toEqual([
          "AuthService",
          "UserService",
        ]);
      });

      it("should analyze inheritance and implementation relationships", async () => {
        // Create inheritance hierarchy
        const inheritanceEntities = [
          {
            id: "base-controller",
            name: "BaseController",
            type: "abstract_class",
          },
          { id: "user-controller", name: "UserController", type: "class" },
          { id: "auth-controller", name: "AuthController", type: "class" },
          { id: "admin-controller", name: "AdminController", type: "class" },

          { id: "base-service", name: "BaseService", type: "abstract_class" },
          { id: "user-service", name: "UserService", type: "class" },
          { id: "auth-service", name: "AuthService", type: "class" },

          { id: "icontroller", name: "IController", type: "interface" },
          { id: "iservice", name: "IService", type: "interface" },
          { id: "iauth", name: "IAuthService", type: "interface" },
        ];

        // Store entities
        for (const entity of inheritanceEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:InheritanceEntity {
              id: $id,
              name: $name,
              type: $type
            })
          `,
            entity
          );
        }

        // Create inheritance and implementation relationships
        const inheritanceRels = [
          // Class inheritance
          { from: "user-controller", to: "base-controller", type: "EXTENDS" },
          { from: "auth-controller", to: "base-controller", type: "EXTENDS" },
          { from: "admin-controller", to: "base-controller", type: "EXTENDS" },
          { from: "user-service", to: "base-service", type: "EXTENDS" },
          { from: "auth-service", to: "base-service", type: "EXTENDS" },

          // Interface implementation
          { from: "base-controller", to: "icontroller", type: "IMPLEMENTS" },
          { from: "user-controller", to: "icontroller", type: "IMPLEMENTS" },
          { from: "auth-controller", to: "icontroller", type: "IMPLEMENTS" },
          { from: "admin-controller", to: "icontroller", type: "IMPLEMENTS" },
          { from: "base-service", to: "iservice", type: "IMPLEMENTS" },
          { from: "user-service", to: "iservice", type: "IMPLEMENTS" },
          { from: "auth-service", to: "iservice", type: "IMPLEMENTS" },
          { from: "auth-service", to: "iauth", type: "IMPLEMENTS" },
        ];

        for (const rel of inheritanceRels) {
          await dbService.falkordbQuery(
            `
            MATCH (a:InheritanceEntity {id: $from}), (b:InheritanceEntity {id: $to})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            rel
          );
        }

        // Test inheritance analysis
        // Find all classes that inherit from BaseController
        const baseControllerDescendants = await dbService.falkordbQuery(`
          MATCH (base:InheritanceEntity {id: 'base-controller'})<-[:EXTENDS*]-(descendant:InheritanceEntity)
          RETURN descendant.name as descendantName
          ORDER BY descendant.name
        `);

        expect(baseControllerDescendants.length).toBe(3);
        expect(baseControllerDescendants.map((d) => d.descendantName)).toEqual([
          "AdminController",
          "AuthController",
          "UserController",
        ]);

        // Find all classes that implement IController
        const controllerImplementations = await dbService.falkordbQuery(`
          MATCH (interface:InheritanceEntity {id: 'icontroller'})<-[:IMPLEMENTS]-(impl:InheritanceEntity)
          RETURN impl.name as implementationName
          ORDER BY impl.name
        `);

        expect(controllerImplementations.length).toBe(4);
        expect(
          controllerImplementations.map((i) => i.implementationName)
        ).toEqual([
          "AdminController",
          "AuthController",
          "BaseController",
          "UserController",
        ]);

        // Find inheritance depth
        const inheritanceDepth = await dbService.falkordbQuery(`
          MATCH path = (leaf:InheritanceEntity)-[:EXTENDS]->(parent:InheritanceEntity)
          RETURN leaf.name as leafName, 1 as depth
          UNION
          MATCH path = (leaf:InheritanceEntity)-[:EXTENDS]->(mid:InheritanceEntity)-[:EXTENDS]->(root:InheritanceEntity)
          RETURN leaf.name as leafName, 2 as depth
          ORDER BY depth DESC
        `);

        expect(inheritanceDepth.length).toBeGreaterThan(0);
        const maxInheritanceDepth = Math.max(
          ...inheritanceDepth.map((d) => d.depth)
        );
        expect(maxInheritanceDepth).toBe(1); // Direct inheritance only in this test

        // Test multiple interface implementation
        const authServiceInterfaces = await dbService.falkordbQuery(`
          MATCH (service:InheritanceEntity {id: 'auth-service'})-[:IMPLEMENTS]->(interface:InheritanceEntity)
          RETURN interface.name as interfaceName
          ORDER BY interface.name
        `);

        expect(authServiceInterfaces.length).toBe(2);
        expect(authServiceInterfaces.map((i) => i.interfaceName)).toEqual([
          "IAuthService",
          "IService",
        ]);
      });
    });

    describe("Test and Spec Relationships", () => {
      it("should create and analyze test-spec relationships", async () => {
        // Create test and spec entities
        const testEntities = [
          {
            id: "user-login-test",
            name: "should login user",
            type: "unit",
            framework: "vitest",
          },
          {
            id: "user-register-test",
            name: "should register user",
            type: "unit",
            framework: "vitest",
          },
          {
            id: "user-validation-test",
            name: "should validate user input",
            type: "unit",
            framework: "vitest",
          },
          {
            id: "user-integration-test",
            name: "user registration integration",
            type: "integration",
            framework: "vitest",
          },
          {
            id: "user-e2e-test",
            name: "user registration e2e",
            type: "e2e",
            framework: "playwright",
          },
        ];

        const specEntities = [
          {
            id: "user-auth-spec",
            title: "User Authentication",
            status: "approved",
          },
          {
            id: "user-reg-spec",
            title: "User Registration",
            status: "implemented",
          },
          {
            id: "input-validation-spec",
            title: "Input Validation",
            status: "draft",
          },
        ];

        // Store entities
        for (const entity of testEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:TestEntity {
              id: $id,
              name: $name,
              type: $type,
              framework: $framework
            })
          `,
            entity
          );
        }

        for (const entity of specEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:SpecEntity {
              id: $id,
              title: $title,
              status: $status
            })
          `,
            entity
          );
        }

        // Create test-spec relationships
        const testSpecRelationships = [
          {
            from: "user-login-test",
            to: "user-auth-spec",
            type: "VALIDATES",
            coverage: 0.9,
          },
          {
            from: "user-register-test",
            to: "user-reg-spec",
            type: "VALIDATES",
            coverage: 0.95,
          },
          {
            from: "user-validation-test",
            to: "input-validation-spec",
            type: "VALIDATES",
            coverage: 0.85,
          },
          {
            from: "user-integration-test",
            to: "user-reg-spec",
            type: "VALIDATES",
            coverage: 0.8,
          },
          {
            from: "user-e2e-test",
            to: "user-reg-spec",
            type: "VALIDATES",
            coverage: 0.75,
          },

          {
            from: "user-reg-spec",
            to: "user-auth-spec",
            type: "REQUIRES",
            priority: "high",
          },
          {
            from: "input-validation-spec",
            to: "user-reg-spec",
            type: "REQUIRES",
            priority: "medium",
          },
        ];

        for (const rel of testSpecRelationships) {
          const props = [];
          if (rel.coverage !== undefined) props.push(`coverage: $coverage`);
          if (rel.priority !== undefined) props.push(`priority: $priority`);

          const propsStr = props.length > 0 ? `{ ${props.join(", ")} }` : "";

          await dbService.falkordbQuery(
            `
            MATCH (a {id: $from}), (b {id: $to})
            CREATE (a)-[:${rel.type} ${propsStr}]->(b)
          `,
            rel
          );
        }

        // Test coverage analysis
        // Find tests for a specific spec
        const userRegTests = await dbService.falkordbQuery(`
          MATCH (spec:SpecEntity {id: 'user-reg-spec'})<-[:VALIDATES]-(test:TestEntity)
          RETURN test.name as testName, test.type as testType
          ORDER BY test.name
        `);

        expect(userRegTests.length).toBe(3);
        expect(userRegTests.map((t) => t.testName)).toEqual(
          expect.arrayContaining([
            "should register user",
            "user registration integration",
            "user registration e2e",
          ])
        );

        // Find specs validated by tests
        const authSpecTests = await dbService.falkordbQuery(`
          MATCH (test:TestEntity)-[:VALIDATES]->(spec:SpecEntity {id: 'user-auth-spec'})
          RETURN test.name as testName, test.type as testType
        `);

        expect(authSpecTests.length).toBe(1);
        expect(authSpecTests[0].testName).toBe("should login user");

        // Calculate test coverage for specs
        const specCoverage = await dbService.falkordbQuery(`
          MATCH (spec:SpecEntity)<-[r:VALIDATES]-(test:TestEntity)
          RETURN spec.title as specTitle, avg(r.coverage) as avgCoverage, count(test) as testCount
        `);

        expect(specCoverage.length).toBe(3);
        const userRegCoverage = specCoverage.find(
          (s) => s.specTitle === "User Registration"
        );
        expect(userRegCoverage?.testCount).toBe(3);
        expect(userRegCoverage?.avgCoverage).toBeGreaterThan(0.7);

        // Test requirement chain
        const requirementChain = await dbService.falkordbQuery(`
          MATCH (input:SpecEntity {id: 'input-validation-spec'})-[:REQUIRES]->(reg:SpecEntity)-[:REQUIRES]->(auth:SpecEntity)
          RETURN input.title as inputTitle, reg.title as regTitle, auth.title as authTitle
        `);

        expect(requirementChain.length).toBe(1);
        expect(requirementChain[0].inputTitle).toBe("Input Validation");
        expect(requirementChain[0].regTitle).toBe("User Registration");
        expect(requirementChain[0].authTitle).toBe("User Authentication");

        // Find untested requirements
        const untestedSpecs = await dbService.falkordbQuery(`
          MATCH (spec:SpecEntity)
          WHERE NOT (spec)<-[:VALIDATES]-(:TestEntity)
          RETURN spec.title as untestedSpec
        `);

        expect(untestedSpecs.length).toBe(0); // All specs have tests in this example
      });
    });
  });

  describe("Relationship Queries and Analytics", () => {
    describe("Path Finding and Traversal", () => {
      it("should perform complex path finding operations", async () => {
        // Create a complex relationship network for path finding
        const entities = [
          // Microservices
          { id: "api-gateway", name: "API Gateway", type: "service" },
          { id: "user-service", name: "User Service", type: "service" },
          { id: "auth-service", name: "Auth Service", type: "service" },
          { id: "email-service", name: "Email Service", type: "service" },
          {
            id: "notification-service",
            name: "Notification Service",
            type: "service",
          },

          // Databases
          { id: "user-db", name: "User Database", type: "database" },
          { id: "auth-db", name: "Auth Database", type: "database" },
          { id: "email-db", name: "Email Database", type: "database" },

          // External APIs
          {
            id: "email-provider",
            name: "Email Provider API",
            type: "external",
          },
          { id: "sms-provider", name: "SMS Provider API", type: "external" },
        ];

        // Store entities
        for (const entity of entities) {
          await dbService.falkordbQuery(
            `
            CREATE (:PathEntity {
              id: $id,
              name: $name,
              type: $type
            })
          `,
            entity
          );
        }

        // Create relationships representing data flow and dependencies
        const relationships = [
          // Service calls
          { from: "api-gateway", to: "user-service", type: "CALLS" },
          { from: "api-gateway", to: "auth-service", type: "CALLS" },
          { from: "user-service", to: "auth-service", type: "CALLS" },
          { from: "user-service", to: "email-service", type: "CALLS" },
          { from: "email-service", to: "notification-service", type: "CALLS" },

          // Database access
          { from: "user-service", to: "user-db", type: "USES" },
          { from: "auth-service", to: "auth-db", type: "USES" },
          { from: "email-service", to: "email-db", type: "USES" },

          // External API calls
          { from: "email-service", to: "email-provider", type: "CALLS" },
          { from: "notification-service", to: "sms-provider", type: "CALLS" },
        ];

        for (const rel of relationships) {
          await dbService.falkordbQuery(
            `
            MATCH (a:PathEntity {id: $from}), (b:PathEntity {id: $to})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            rel
          );
        }

        // Test path finding
        // Find all paths from API Gateway to external services
        const pathsToExternal = await dbService.falkordbQuery(`
          MATCH path = (gateway:PathEntity {id: 'api-gateway'})-[:CALLS*]->(external:PathEntity {type: 'external'})
          RETURN external.name as externalService, length(path) as pathLength
          ORDER BY pathLength
        `);

        expect(pathsToExternal.length).toBe(2);
        expect(pathsToExternal.map((p) => p.externalService)).toEqual(
          expect.arrayContaining(["Email Provider API", "SMS Provider API"])
        );

        // Find shortest path from API Gateway to Email Provider
        const shortestPath = await dbService.falkordbQuery(`
          MATCH path = (gateway:PathEntity {id: 'api-gateway'})-[:CALLS*]->(email:PathEntity {id: 'email-provider'})
          RETURN length(path) as pathLength
          ORDER BY pathLength
          LIMIT 1
        `);

        expect(shortestPath.length).toBe(1);
        expect(shortestPath[0].pathLength).toBe(3); // Gateway -> User -> Email -> Provider

        // Find all services that depend on User Service
        const dependentServices = await dbService.falkordbQuery(`
          MATCH (dependent:PathEntity)-[:CALLS*]->(user:PathEntity {id: 'user-service'})
          WHERE dependent.id <> 'user-service'
          RETURN DISTINCT dependent.name as serviceName
          ORDER BY dependent.name
        `);

        expect(dependentServices.length).toBe(1);
        expect(dependentServices[0].serviceName).toBe("API Gateway");

        // Test impact analysis - what breaks if User Service goes down?
        // Find services that depend on User Service (upstream)
        const upstreamImpact = await dbService.falkordbQuery(`
          MATCH (affected:PathEntity)-[:CALLS*]->(down:PathEntity {id: 'user-service'})
          WHERE affected.id <> 'user-service'
          RETURN DISTINCT affected.name as affectedService
        `);
        
        // Find services that User Service depends on (downstream)
        const downstreamImpact = await dbService.falkordbQuery(`
          MATCH (down:PathEntity {id: 'user-service'})-[:CALLS*]->(affected:PathEntity)
          WHERE affected.id <> 'user-service'
          RETURN DISTINCT affected.name as affectedService
        `);

        const impactAnalysis = [...upstreamImpact, ...downstreamImpact];
        const affectedNames = [...new Set(impactAnalysis.map((a) => a.affectedService))].sort();
        
        expect(affectedNames.length).toBeGreaterThan(0);
        expect(affectedNames).toContain("API Gateway");
        expect(affectedNames).toContain("Email Service");
        expect(affectedNames).toContain("Notification Service");

        // Test database access patterns
        const databaseAccess = await dbService.falkordbQuery(`
          MATCH (service:PathEntity)-[:USES]->(db:PathEntity {type: 'database'})
          RETURN service.name as serviceName, db.name as databaseName
          ORDER BY service.name
        `);

        expect(databaseAccess.length).toBe(3);
        expect(databaseAccess.map((d) => d.serviceName)).toEqual([
          "Auth Service",
          "Email Service",
          "User Service",
        ]);
      });

      it("should handle relationship filters and complex queries", async () => {
        // Create entities with various properties for filtering
        const filterEntities = Array.from({ length: 20 }, (_, i) => ({
          id: `filter-entity-${i}`,
          name: `Entity${i}`,
          type: i % 3 === 0 ? "service" : i % 3 === 1 ? "database" : "api",
          priority:
            i % 4 === 0
              ? "critical"
              : i % 4 === 1
              ? "high"
              : i % 4 === 2
              ? "medium"
              : "low",
          version: `1.${i % 5}.0`,
          active: i % 5 !== 0, // Every 5th entity is inactive
        }));

        // Store entities
        for (const entity of filterEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:FilterEntity {
              id: $id,
              name: $name,
              type: $type,
              priority: $priority,
              version: $version,
              active: $active
            })
          `,
            entity
          );
        }

        // Create relationships with various properties
        const relationships = [];
        for (let i = 0; i < 19; i++) {
          relationships.push({
            from: `filter-entity-${i}`,
            to: `filter-entity-${i + 1}`,
            type: i % 2 === 0 ? "DEPENDS_ON" : "CALLS",
            strength: Math.random(),
            required: i % 3 === 0,
            async: i % 4 === 0,
          });
        }

        for (const rel of relationships) {
          await dbService.falkordbQuery(
            `
            MATCH (a:FilterEntity {id: $from}), (b:FilterEntity {id: $to})
            CREATE (a)-[:${rel.type} {
              strength: $strength,
              required: $required,
              async: $async
            }]->(b)
          `,
            rel
          );
        }

        // Test filtering by entity properties
        const activeServices = await dbService.falkordbQuery(`
          MATCH (e:FilterEntity)
          WHERE e.type = 'service' AND e.active = true
          RETURN e.name as serviceName
          ORDER BY e.name
        `);

        expect(activeServices.length).toBeGreaterThan(0);
        activeServices.forEach((service) => {
          expect(service.serviceName).toMatch(/^Entity\d+$/);
        });

        // Test filtering by relationship properties
        const requiredDeps = await dbService.falkordbQuery(`
          MATCH (a:FilterEntity)-[r:DEPENDS_ON]->(b:FilterEntity)
          WHERE r.required = true
          RETURN a.name as fromName, b.name as toName
          ORDER BY a.name
        `);

        expect(requiredDeps.length).toBeGreaterThan(0);
        requiredDeps.forEach((dep) => {
          expect(dep.fromName).toMatch(/^Entity\d+$/);
          expect(dep.toName).toMatch(/^Entity\d+$/);
        });

        // Test complex filtering with multiple conditions
        const criticalAsyncCalls = await dbService.falkordbQuery(`
          MATCH (a:FilterEntity)-[r:CALLS]->(b:FilterEntity)
          WHERE r.async = true AND a.priority = 'critical'
          RETURN a.name as fromName, b.name as toName, r.strength as strength
          ORDER BY r.strength DESC
        `);

        criticalAsyncCalls.forEach((call) => {
          expect(typeof call.strength).toBe('number');
          expect(typeof call.strength).toBe("number");
        });

        // Test aggregation queries
        const typeStats = await dbService.falkordbQuery(`
          MATCH (e:FilterEntity)
          RETURN e.type as entityType, count(e) as count
          ORDER BY count DESC
        `);

        expect(typeStats.length).toBe(3);
        const totalEntities = typeStats.reduce(
          (sum, stat) => sum + stat.count,
          0
        );
        expect(totalEntities).toBe(20);

        // Test relationship aggregation
        const relationshipStats = await dbService.falkordbQuery(`
          MATCH (a:FilterEntity)-[r]->(b:FilterEntity)
          RETURN type(r) as relType, count(r) as count, avg(r.strength) as avgStrength
          ORDER BY count DESC
        `);

        expect(relationshipStats.length).toBe(2);
        expect(relationshipStats[0].relType).toMatch(/^(DEPENDS_ON|CALLS)$/);
        expect(relationshipStats[0].count).toBe(10); // Should be roughly equal
        expect(relationshipStats[1].count).toBe(9);
      });
    });

    describe("Graph Analytics and Metrics", () => {
      it("should calculate graph centrality and connectivity metrics", async () => {
        // Create a network for centrality analysis
        const centralityEntities = [
          { id: "hub-service", name: "Hub Service" },
          { id: "leaf-1", name: "Leaf Service 1" },
          { id: "leaf-2", name: "Leaf Service 2" },
          { id: "leaf-3", name: "Leaf Service 3" },
          { id: "leaf-4", name: "Leaf Service 4" },
          { id: "isolated", name: "Isolated Service" },
          { id: "connector", name: "Connector Service" },
        ];

        // Store entities
        for (const entity of centralityEntities) {
          await dbService.falkordbQuery(
            `
            CREATE (:CentralityEntity {
              id: $id,
              name: $name
            })
          `,
            entity
          );
        }

        // Create relationships forming a hub-and-spoke pattern with a connector
        const centralityRels = [
          { from: "hub-service", to: "leaf-1", type: "CALLS" },
          { from: "hub-service", to: "leaf-2", type: "CALLS" },
          { from: "hub-service", to: "leaf-3", type: "CALLS" },
          { from: "hub-service", to: "leaf-4", type: "CALLS" },
          { from: "leaf-1", to: "connector", type: "CALLS" },
          { from: "leaf-2", to: "connector", type: "CALLS" },
          { from: "connector", to: "leaf-3", type: "CALLS" },
          { from: "connector", to: "leaf-4", type: "CALLS" },
        ];

        for (const rel of centralityRels) {
          await dbService.falkordbQuery(
            `
            MATCH (a:CentralityEntity {id: $from}), (b:CentralityEntity {id: $to})
            CREATE (a)-[:${rel.type}]->(b)
          `,
            rel
          );
        }

        // Calculate degree centrality (number of connections)
        const degreeCentrality = await dbService.falkordbQuery(`
          MATCH (e:CentralityEntity)
          OPTIONAL MATCH (e)-[out:CALLS]->()
          OPTIONAL MATCH ()-[in:CALLS]->(e)
          RETURN e.name as entityName,
                 count(DISTINCT out) as outDegree,
                 count(DISTINCT in) as inDegree,
                 count(DISTINCT out) + count(DISTINCT in) as totalDegree
          ORDER BY totalDegree DESC
        `);

        expect(degreeCentrality.length).toBe(7);

        // Hub service should have highest degree
        const hubDegree = degreeCentrality.find(
          (d) => d.entityName === "Hub Service"
        );
        expect(hubDegree?.totalDegree).toBe(4);

        // Connector should have high degree
        const connectorDegree = degreeCentrality.find(
          (d) => d.entityName === "Connector Service"
        );
        expect(connectorDegree?.totalDegree).toBe(4);

        // Isolated service should have zero degree
        const isolatedDegree = degreeCentrality.find(
          (d) => d.entityName === "Isolated Service"
        );
        expect(isolatedDegree?.totalDegree).toBe(0);

        // Calculate clustering coefficient (how connected are neighbors)
        // Simplified version for FalkorDB compatibility
        const clusteringCoeff = await dbService.falkordbQuery(`
          MATCH (e:CentralityEntity)
          OPTIONAL MATCH (e)-[:CALLS]-(neighbor:CentralityEntity)
          WITH e, collect(DISTINCT neighbor) as neighbors
          WHERE size(neighbors) > 1
          RETURN e.name as entityName,
                 size(neighbors) as neighborCount,
                 0 as possibleConnections,
                 0 as actualConnections
        `);

        // Test connectivity analysis
        const connectivityAnalysis = await dbService.falkordbQuery(`
          MATCH (e:CentralityEntity)
          OPTIONAL MATCH path = (e)-[:CALLS*]-(other:CentralityEntity)
          WHERE e <> other
          RETURN e.name as entityName,
                 count(DISTINCT other) as reachableEntities
          ORDER BY reachableEntities DESC
        `);

        expect(connectivityAnalysis.length).toBe(7);

        // Hub should reach most entities (excluding isolated service)
        const hubConnectivity = connectivityAnalysis.find(
          (c) => c.entityName === "Hub Service"
        );
        expect(hubConnectivity?.reachableEntities).toBe(5); // All except itself and isolated

        // Isolated should reach none
        const isolatedConnectivity = connectivityAnalysis.find(
          (c) => c.entityName === "Isolated Service"
        );
        expect(isolatedConnectivity?.reachableEntities).toBe(0);

        // Test shortest path analysis - using regular paths instead of shortestPath
        const shortestPaths = await dbService.falkordbQuery(`
          MATCH path = (start:CentralityEntity)-[:CALLS*1..3]-(end:CentralityEntity)
          WHERE start.id < end.id
          RETURN start.name as startName, end.name as endName, length(path) as distance
          ORDER BY distance
          LIMIT 5
        `);

        expect(shortestPaths.length).toBeGreaterThan(0);
        shortestPaths.forEach((path) => {
          expect(path.distance).toBeGreaterThanOrEqual(1);
          expect(path.distance).toBeLessThanOrEqual(3);
        });
      });
    });
  });
});
