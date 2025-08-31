/**
 * FalkorDB Graph Database Operations Tests
 * Tests graph operations, node creation, relationships, and queries
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('FalkorDB Graph Database Operations', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    await dbService.setupDatabase(); // Ensure graph is ready
  }, 30000);

  afterAll(async () => {
    await dbService.close();
  }, 10000);

  describe('Basic Graph Operations', () => {
    it('should ping the database', async () => {
      const result = await dbService.falkordbCommand('PING');
      expect(result).toBe('PONG');
    });

    it('should create and query a simple graph', async () => {
      // Create a simple graph with one node
      const createQuery = `
        CREATE (n:TestNode {name: 'Hello World', type: 'greeting'})
        RETURN n
      `;

      const createResult = await dbService.falkordbQuery(createQuery);
      expect(createResult).toBeDefined();

      // Query the node
      const queryResult = await dbService.falkordbQuery('MATCH (n:TestNode) RETURN n');
      expect(queryResult.length).toBeGreaterThan(0);
      expect(queryResult[0].name).toBe('Hello World');
    });
  });

  describe('Node Operations', () => {
    const testNodes = [
      {
        label: 'File',
        properties: {
          id: 'file_1',
          name: 'DatabaseService.ts',
          path: 'src/services/DatabaseService.ts',
          language: 'typescript',
          size: 15420,
          lastModified: '2024-01-15T10:30:00Z'
        }
      },
      {
        label: 'Function',
        properties: {
          id: 'func_1',
          name: 'initialize',
          fileId: 'file_1',
          lineStart: 38,
          lineEnd: 87,
          parameters: ['config'],
          returnType: 'Promise<void>',
          complexity: 3
        }
      },
      {
        label: 'Class',
        properties: {
          id: 'class_1',
          name: 'DatabaseService',
          fileId: 'file_1',
          lineStart: 29,
          lineEnd: 418,
          extends: null,
          implements: []
        }
      }
    ];

    beforeEach(async () => {
      // Clean up test nodes
      await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_" DELETE n');
    });

    it('should create nodes with properties', async () => {
      for (const node of testNodes) {
        const createQuery = `
          CREATE (n:${node.label} $props)
          RETURN n
        `;

        const result = await dbService.falkordbQuery(createQuery, { props: node.properties });
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      }

      // Verify nodes were created
      const countResult = await dbService.falkordbQuery('MATCH (n) RETURN count(n) as total');
      expect(countResult[0].total).toBeGreaterThanOrEqual(3);
    });

    it('should retrieve nodes by label', async () => {
      // Create test nodes
      for (const node of testNodes) {
        await dbService.falkordbQuery(
          `CREATE (n:${node.label} $props)`,
          { props: node.properties }
        );
      }

      // Query by label
      const fileNodes = await dbService.falkordbQuery('MATCH (n:File) RETURN n');
      const functionNodes = await dbService.falkordbQuery('MATCH (n:Function) RETURN n');
      const classNodes = await dbService.falkordbQuery('MATCH (n:Class) RETURN n');

      expect(fileNodes.length).toBeGreaterThanOrEqual(1);
      expect(functionNodes.length).toBeGreaterThanOrEqual(1);
      expect(classNodes.length).toBeGreaterThanOrEqual(1);

      expect(fileNodes[0].name).toBe('DatabaseService.ts');
      expect(functionNodes[0].name).toBe('initialize');
      expect(classNodes[0].name).toBe('DatabaseService');
    });

    it('should update node properties', async () => {
      // Create a node
      await dbService.falkordbQuery(
        'CREATE (n:File {id: "update_test", name: "old_name.ts", size: 1000})'
      );

      // Update the node
      await dbService.falkordbQuery(
        'MATCH (n:File {id: "update_test"}) SET n.name = "updated_name.ts", n.size = 2000'
      );

      // Verify update
      const result = await dbService.falkordbQuery(
        'MATCH (n:File {id: "update_test"}) RETURN n.name, n.size'
      );

      expect(result[0].name).toBe('updated_name.ts');
      expect(result[0].size).toBe(2000);
    });

    it('should delete nodes', async () => {
      // Create nodes
      await dbService.falkordbQuery('CREATE (n:TestDelete {id: "delete_test"})');
      await dbService.falkordbQuery('CREATE (n:TestDelete {id: "keep_test"})');

      // Delete one node
      await dbService.falkordbQuery('MATCH (n:TestDelete {id: "delete_test"}) DELETE n');

      // Verify deletion
      const remaining = await dbService.falkordbQuery('MATCH (n:TestDelete) RETURN n.id');
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('keep_test');
    });
  });

  describe('Relationship Operations', () => {
    beforeEach(async () => {
      // Clean up test data
      await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "rel_" DELETE n');
    });

    it('should create relationships between nodes', async () => {
      // Create nodes
      await dbService.falkordbQuery(`
        CREATE (f:File {id: "rel_file", name: "Service.ts"}),
               (c:Class {id: "rel_class", name: "MyService"}),
               (m:Method {id: "rel_method", name: "processData"})
      `);

      // Create relationships
      await dbService.falkordbQuery(`
        MATCH (f:File {id: "rel_file"}), (c:Class {id: "rel_class"})
        CREATE (f)-[:CONTAINS]->(c)
      `);

      await dbService.falkordbQuery(`
        MATCH (c:Class {id: "rel_class"}), (m:Method {id: "rel_method"})
        CREATE (c)-[:HAS_METHOD]->(m)
      `);

      // Verify relationships
      const relationships = await dbService.falkordbQuery(`
        MATCH (f:File)-[r:CONTAINS]->(c:Class)-[r2:HAS_METHOD]->(m:Method)
        RETURN f.name, type(r), c.name, type(r2), m.name
      `);

      expect(relationships.length).toBeGreaterThanOrEqual(1);
      expect(relationships[0]['f.name']).toBe('Service.ts');
      expect(relationships[0]['c.name']).toBe('MyService');
      expect(relationships[0]['m.name']).toBe('processData');
    });

    it('should query nodes by relationship patterns', async () => {
      // Create a more complex graph structure
      await dbService.falkordbQuery(`
        CREATE (u:User {id: "rel_user", name: "John"}),
               (p1:Project {id: "rel_proj1", name: "Web App"}),
               (p2:Project {id: "rel_proj2", name: "API"}),
               (t1:Task {id: "rel_task1", title: "Setup DB"}),
               (t2:Task {id: "rel_task2", title: "Create API"})
      `);

      // Create relationships
      await dbService.falkordbQuery(`
        MATCH (u:User {id: "rel_user"}), (p1:Project {id: "rel_proj1"})
        CREATE (u)-[:WORKS_ON]->(p1)
      `);

      await dbService.falkordbQuery(`
        MATCH (u:User {id: "rel_user"}), (p2:Project {id: "rel_proj2"})
        CREATE (u)-[:WORKS_ON]->(p2)
      `);

      await dbService.falkordbQuery(`
        MATCH (p1:Project {id: "rel_proj1"}), (t1:Task {id: "rel_task1"})
        CREATE (p1)-[:HAS_TASK]->(t1)
      `);

      await dbService.falkordbQuery(`
        MATCH (p2:Project {id: "rel_proj2"}), (t2:Task {id: "rel_task2"})
        CREATE (p2)-[:HAS_TASK]->(t2)
      `);

      // Query: Find all tasks for projects a user works on
      const userTasks = await dbService.falkordbQuery(`
        MATCH (u:User {id: "rel_user"})-[:WORKS_ON]->(p:Project)-[:HAS_TASK]->(t:Task)
        RETURN u.name, p.name, t.title
      `);

      expect(userTasks.length).toBe(2);
      expect(userTasks.map(task => task['t.title'])).toEqual(
        expect.arrayContaining(['Setup DB', 'Create API'])
      );
    });

    it('should handle relationship properties', async () => {
      // Create nodes with relationship properties
      await dbService.falkordbQuery(`
        CREATE (dev:Developer {id: "rel_dev", name: "Alice"}),
               (tech1:Technology {id: "rel_tech1", name: "TypeScript"}),
               (tech2:Technology {id: "rel_tech2", name: "React"})
      `);

      // Create relationships with properties
      await dbService.falkordbQuery(`
        MATCH (dev:Developer {id: "rel_dev"}), (tech1:Technology {id: "rel_tech1"})
        CREATE (dev)-[:KNOWS {level: "expert", years: 3}]->(tech1)
      `);

      await dbService.falkordbQuery(`
        MATCH (dev:Developer {id: "rel_dev"}), (tech2:Technology {id: "rel_tech2"})
        CREATE (dev)-[:KNOWS {level: "intermediate", years: 1}]->(tech2)
      `);

      // Query relationships with properties
      const expertise = await dbService.falkordbQuery(`
        MATCH (dev:Developer {id: "rel_dev"})-[r:KNOWS]->(tech:Technology)
        RETURN tech.name, r.level, r.years
        ORDER BY r.years DESC
      `);

      expect(expertise.length).toBe(2);
      expect(expertise[0]['r.level']).toBe('expert');
      expect(expertise[0]['r.years']).toBe(3);
      expect(expertise[1]['r.level']).toBe('intermediate');
      expect(expertise[1]['r.years']).toBe(1);
    });
  });

  describe('Complex Graph Queries', () => {
    beforeEach(async () => {
      // Clean up
      await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "complex_" DELETE n');
    });

    it('should handle path queries', async () => {
      // Create a complex dependency graph
      await dbService.falkordbQuery(`
        CREATE (main:Module {id: "complex_main", name: "main.ts"}),
               (auth:Module {id: "complex_auth", name: "auth.ts"}),
               (db:Module {id: "complex_db", name: "database.ts"}),
               (utils:Module {id: "complex_utils", name: "utils.ts"}),
               (config:Module {id: "complex_config", name: "config.ts"})
      `);

      // Create dependency relationships
      await dbService.falkordbQuery(`
        CREATE (main)-[:IMPORTS]->(auth),
               (auth)-[:IMPORTS]->(db),
               (auth)-[:IMPORTS]->(utils),
               (db)-[:IMPORTS]->(config),
               (utils)-[:IMPORTS]->(config)
      `);

      // Find all modules that main.ts depends on (directly or indirectly)
      const dependencies = await dbService.falkordbQuery(`
        MATCH path = (main:Module {id: "complex_main"})-[:IMPORTS*]->(dep:Module)
        RETURN dep.name, length(path) as depth
        ORDER BY depth
      `);

      expect(dependencies.length).toBeGreaterThan(0);
      expect(dependencies.map(d => d['dep.name'])).toEqual(
        expect.arrayContaining(['auth.ts', 'database.ts', 'utils.ts', 'config.ts'])
      );
    });

    it('should aggregate and group data', async () => {
      // Create test data for aggregation
      await dbService.falkordbQuery(`
        CREATE (:Repository {id: "complex_repo1", name: "frontend", language: "typescript"}),
               (:Repository {id: "complex_repo2", name: "backend", language: "typescript"}),
               (:Repository {id: "complex_repo3", name: "mobile", language: "kotlin"}),
               (:Repository {id: "complex_repo4", name: "data", language: "python"})
      `);

      // Create contributors and their relationships
      await dbService.falkordbQuery(`
        MATCH (r1:Repository {id: "complex_repo1"})
        CREATE (:Contributor {id: "complex_dev1", name: "Alice"})-[:CONTRIBUTES_TO]->(r1)
      `);

      await dbService.falkordbQuery(`
        MATCH (r2:Repository {id: "complex_repo2"})
        CREATE (:Contributor {id: "complex_dev1"})-[:CONTRIBUTES_TO]->(r2),
               (:Contributor {id: "complex_dev2", name: "Bob"})-[:CONTRIBUTES_TO]->(r2)
      `);

      await dbService.falkordbQuery(`
        MATCH (r3:Repository {id: "complex_repo3"})
        CREATE (:Contributor {id: "complex_dev3", name: "Charlie"})-[:CONTRIBUTES_TO]->(r3)
      `);

      // Aggregate: Count repositories by language
      const languageStats = await dbService.falkordbQuery(`
        MATCH (r:Repository)
        RETURN r.language, count(r) as repo_count
        ORDER BY repo_count DESC
      `);

      expect(languageStats.length).toBeGreaterThan(0);
      const typescriptCount = languageStats.find(stat => stat['r.language'] === 'typescript');
      expect(typescriptCount['repo_count']).toBe(2);

      // Aggregate: Count contributions per developer
      const contributorStats = await dbService.falkordbQuery(`
        MATCH (c:Contributor)-[:CONTRIBUTES_TO]->(r:Repository)
        RETURN c.name, count(r) as contributions
        ORDER BY contributions DESC
      `);

      expect(contributorStats.length).toBeGreaterThan(0);
      expect(contributorStats[0].contributions).toBe(2); // Alice contributes to 2 repos
    });

    it('should handle graph algorithms - shortest path', async () => {
      // Create a simple graph for path finding
      await dbService.falkordbQuery(`
        CREATE (a:Node {id: "complex_a", name: "A"}),
               (b:Node {id: "complex_b", name: "B"}),
               (c:Node {id: "complex_c", name: "C"}),
               (d:Node {id: "complex_d", name: "D"})
      `);

      // Create connections
      await dbService.falkordbQuery(`
        CREATE (a)-[:CONNECTS_TO {weight: 1}]->(b),
               (a)-[:CONNECTS_TO {weight: 4}]->(c),
               (b)-[:CONNECTS_TO {weight: 2}]->(c),
               (b)-[:CONNECTS_TO {weight: 5}]->(d),
               (c)-[:CONNECTS_TO {weight: 1}]->(d)
      `);

      // Find shortest path from A to D
      const shortestPath = await dbService.falkordbQuery(`
        MATCH path = shortestPath((start:Node {id: "complex_a"})-[:CONNECTS_TO*]->(end:Node {id: "complex_d"}))
        RETURN path, reduce(totalWeight = 0, rel in relationships(path) | totalWeight + rel.weight) as total_weight
      `);

      expect(shortestPath.length).toBeGreaterThan(0);
      expect(shortestPath[0].total_weight).toBeDefined();
    });
  });

  describe('Index and Performance', () => {
    it('should create and use indexes', async () => {
      // Create test data
      await dbService.falkordbQuery(`
        CREATE (:PerformanceTest {id: "perf_1", category: "fast", value: 100}),
               (:PerformanceTest {id: "perf_2", category: "slow", value: 200}),
               (:PerformanceTest {id: "perf_3", category: "fast", value: 150})
      `);

      // Create index on category property
      await dbService.falkordbQuery('CREATE INDEX ON :PerformanceTest(category)');

      // Query using the indexed property
      const fastItems = await dbService.falkordbQuery(`
        MATCH (n:PerformanceTest {category: "fast"})
        RETURN n.id, n.value
        ORDER BY n.value
      `);

      expect(fastItems.length).toBe(2);
      expect(fastItems.map(item => item['n.value'])).toEqual([100, 150]);
    });

    it('should handle large datasets efficiently', async () => {
      // Create multiple nodes for performance testing
      const createStart = Date.now();

      for (let i = 0; i < 50; i++) {
        await dbService.falkordbQuery(`
          CREATE (:BulkTest {id: "bulk_${i}", index: ${i}, data: "test_data_${i}"})
        `);
      }

      const createEnd = Date.now();
      const createTime = createEnd - createStart;

      console.log(`Created 50 nodes in ${createTime}ms`);

      // Query performance
      const queryStart = Date.now();
      const results = await dbService.falkordbQuery(`
        MATCH (n:BulkTest)
        WHERE n.index >= 25 AND n.index <= 35
        RETURN count(n) as node_count
      `);
      const queryEnd = Date.now();
      const queryTime = queryEnd - queryStart;

      console.log(`Queried nodes in ${queryTime}ms`);

      expect(results[0].node_count).toBe(11); // nodes 25-35 inclusive
      expect(createTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(queryTime).toBeLessThan(1000); // Query should be fast
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid queries gracefully', async () => {
      try {
        await dbService.falkordbQuery('INVALID QUERY SYNTAX');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty results', async () => {
      const result = await dbService.falkordbQuery('MATCH (n:NonExistentLabel) RETURN n');
      expect(result).toEqual([]);
    });

    it('should handle concurrent operations', async () => {
      // Create multiple concurrent operations
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(
          dbService.falkordbQuery(`
            CREATE (:ConcurrentTest {id: "concurrent_${i}", timestamp: timestamp()})
            RETURN "created_${i}"
          `)
        );
      }

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      expect(results.length).toBe(10);
      results.forEach((result, index) => {
        expect(result[0]).toBe(`created_${index}`);
      });

      // Verify all nodes were created
      const countResult = await dbService.falkordbQuery('MATCH (n:ConcurrentTest) RETURN count(n) as total');
      expect(countResult[0].total).toBe(10);
    });
  });
});
