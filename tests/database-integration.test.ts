/**
 * Database Integration Tests
 * Tests all databases working together as a unified system
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('Database Integration Tests', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    await dbService.setupDatabase();
  }, 60000);

  afterAll(async () => {
    await dbService.close();
  }, 10000);

  describe('Cross-Database Operations', () => {
    const integrationId = 'integration_test_' + Date.now();

    beforeEach(async () => {
      // Clean up any existing test data
      await dbService.postgresQuery('DELETE FROM documents WHERE type = $1', ['integration_test']);
      await dbService.postgresQuery('DELETE FROM sessions WHERE agent_type = $1', ['integration_test']);
      await dbService.falkordbQuery(`MATCH (n) WHERE n.integration_id = "${integrationId}" DELETE n`);

      // Clean up Qdrant collections
      try {
        await dbService.qdrant.deleteCollection('integration_test');
      } catch (error) {
        // Collection doesn't exist
      }
      await dbService.qdrant.createCollection('integration_test', {
        vectors: { size: 1536, distance: 'Cosine' }
      });
    });

    it('should synchronize data across all databases', async () => {
      // 1. Create a code entity in PostgreSQL
      const codeEntity = {
        id: `code_${integrationId}`,
        type: 'integration_test',
        content: {
          name: 'UserService',
          type: 'class',
          language: 'typescript',
          content: 'class UserService { async getUser(id: string) { return { id, name: "Test" }; } }'
        },
        metadata: {
          source: 'test',
          complexity: 'medium',
          integration_id: integrationId
        }
      };

      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [codeEntity.id, codeEntity.type, JSON.stringify(codeEntity.content), JSON.stringify(codeEntity.metadata)]
      );

      // 2. Create corresponding vector embedding in Qdrant
      const vector = Array.from({ length: 1536 }, () => Math.random());
      await dbService.qdrant.upsert('integration_test', {
        points: [{
          id: 1,
          vector: vector,
          payload: {
            entity_id: codeEntity.id,
            type: 'code_embedding',
            name: codeEntity.content.name,
            language: codeEntity.content.language
          }
        }]
      });

      // 3. Create graph nodes in FalkorDB
      await dbService.falkordbQuery(`
        CREATE (c:CodeEntity {
          id: "${codeEntity.id}",
          name: "${codeEntity.content.name}",
          type: "${codeEntity.content.type}",
          language: "${codeEntity.content.language}",
          integration_id: "${integrationId}"
        })
      `);

      // 4. Create a session tracking this integration
      await dbService.postgresQuery(
        'INSERT INTO sessions (id, agent_type, user_id, status) VALUES ($1, $2, $3, $4)',
        [`session_${integrationId}`, 'integration_test', 'test_user', 'active']
      );

      // 5. Verify data exists across all databases
      // PostgreSQL check
      const postgresResult = await dbService.postgresQuery(
        'SELECT id, type FROM documents WHERE id = $1',
        [codeEntity.id]
      );
      expect(postgresResult.rows[0].id).toBe(codeEntity.id);

      // Qdrant check
      const qdrantResult = await dbService.qdrant.retrieve('integration_test', { ids: [1] });
      expect(qdrantResult[0].payload.entity_id).toBe(codeEntity.id);

      // FalkorDB check
      const falkorResult = await dbService.falkordbQuery(
        `MATCH (c:CodeEntity {id: "${codeEntity.id}"}) RETURN c.name, c.type`
      );
      expect(falkorResult[0].name).toBe(codeEntity.content.name);

      // Session check
      const sessionResult = await dbService.postgresQuery(
        'SELECT status FROM sessions WHERE id = $1',
        [`session_${integrationId}`]
      );
      expect(sessionResult.rows[0].status).toBe('active');
    });

    it('should handle code analysis workflow across databases', async () => {
      // Simulate a complete code analysis workflow

      // 1. Store source code in PostgreSQL
      const sourceCode = {
        id: `source_${integrationId}`,
        type: 'source_code',
        content: {
          file_path: 'src/services/UserService.ts',
          language: 'typescript',
          code: `
            interface User {
              id: string;
              name: string;
              email: string;
            }

            class UserService {
              private users: Map<string, User> = new Map();

              async createUser(userData: Omit<User, 'id'>): Promise<User> {
                const id = 'user_' + Date.now();
                const user = { id, ...userData };
                this.users.set(id, user);
                return user;
              }

              async getUser(id: string): Promise<User | null> {
                return this.users.get(id) || null;
              }
            }
          `
        },
        metadata: {
          analysis_status: 'pending',
          integration_id: integrationId
        }
      };

      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [sourceCode.id, sourceCode.type, JSON.stringify(sourceCode.content), JSON.stringify(sourceCode.metadata)]
      );

      // 2. Extract and store code entities in graph
      await dbService.falkordbQuery(`
        CREATE (f:File {
          id: "${sourceCode.id}",
          path: "${sourceCode.content.file_path}",
          language: "${sourceCode.content.language}",
          integration_id: "${integrationId}"
        }),
        (i:Interface {
          id: "interface_user_${integrationId}",
          name: "User",
          file_id: "${sourceCode.id}"
        }),
        (c:Class {
          id: "class_userservice_${integrationId}",
          name: "UserService",
          file_id: "${sourceCode.id}"
        })
      `);

      // 3. Create relationships in graph
      await dbService.falkordbQuery(`
        MATCH (f:File {id: "${sourceCode.id}"}), (i:Interface {id: "interface_user_${integrationId}"})
        CREATE (f)-[:CONTAINS]->(i)
      `);

      await dbService.falkordbQuery(`
        MATCH (f:File {id: "${sourceCode.id}"}), (c:Class {id: "class_userservice_${integrationId}"})
        CREATE (f)-[:CONTAINS]->(c)
      `);

      // 4. Store embeddings for semantic search
      const embeddings = [
        { id: 1, name: 'UserService', type: 'class' },
        { id: 2, name: 'User', type: 'interface' },
        { id: 3, name: 'createUser', type: 'method' }
      ];

      const embeddingPoints = embeddings.map((emb, index) => ({
        id: index + 1,
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          entity_id: `${emb.type}_${emb.name}_${integrationId}`,
          name: emb.name,
          type: emb.type,
          file_id: sourceCode.id,
          integration_id: integrationId
        }
      }));

      await dbService.qdrant.upsert('integration_test', { points: embeddingPoints });

      // 5. Update analysis status
      await dbService.postgresQuery(
        'UPDATE documents SET metadata = jsonb_set(metadata, \'{analysis_status}\', \'"completed"\') WHERE id = $1',
        [sourceCode.id]
      );

      // 6. Verify the complete workflow
      // Check source code status
      const sourceResult = await dbService.postgresQuery(
        'SELECT metadata->>\'analysis_status\' as status FROM documents WHERE id = $1',
        [sourceCode.id]
      );
      expect(sourceResult.rows[0].status).toBe('completed');

      // Check graph structure
      const graphResult = await dbService.falkordbQuery(`
        MATCH (f:File {id: "${sourceCode.id}"})-[:CONTAINS]->(entity)
        RETURN labels(entity), entity.name
      `);
      expect(graphResult.length).toBe(2);

      // Check embeddings
      const embeddingCount = await dbService.qdrant.count('integration_test');
      expect(embeddingCount.count).toBe(3);
    });

    it('should perform cross-database queries and correlations', async () => {
      // Create correlated data across all databases

      // 1. Create a user session in PostgreSQL
      const sessionId = `session_${integrationId}`;
      await dbService.postgresQuery(
        'INSERT INTO sessions (id, agent_type, user_id, status) VALUES ($1, $2, $3, $4)',
        [sessionId, 'code_analysis', 'test_user', 'active']
      );

      // 2. Create code analysis results in PostgreSQL
      const analysisResults = [
        {
          id: `analysis_1_${integrationId}`,
          type: 'analysis_result',
          content: { function_name: 'parseCode', complexity: 3, lines: 25 },
          metadata: { session_id: sessionId, analysis_type: 'complexity' }
        },
        {
          id: `analysis_2_${integrationId}`,
          type: 'analysis_result',
          content: { function_name: 'validateSyntax', complexity: 2, lines: 15 },
          metadata: { session_id: sessionId, analysis_type: 'syntax' }
        }
      ];

      for (const result of analysisResults) {
        await dbService.postgresQuery(
          'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
          [result.id, result.type, JSON.stringify(result.content), JSON.stringify(result.metadata)]
        );
      }

      // 3. Create function nodes in graph with relationships
      await dbService.falkordbQuery(`
        CREATE (s:Session {id: "${sessionId}", user_id: "test_user"}),
               (f1:Function {id: "func_1_${integrationId}", name: "parseCode", complexity: 3}),
               (f2:Function {id: "func_2_${integrationId}", name: "validateSyntax", complexity: 2})
      `);

      // 4. Create relationships
      await dbService.falkordbQuery(`
        MATCH (s:Session {id: "${sessionId}"}), (f1:Function {id: "func_1_${integrationId}"})
        CREATE (s)-[:ANALYZED]->(f1)
      `);

      await dbService.falkordbQuery(`
        MATCH (s:Session {id: "${sessionId}"}), (f2:Function {id: "func_2_${integrationId}"})
        CREATE (s)-[:ANALYZED]->(f2)
      `);

      // 5. Store function embeddings
      const functionEmbeddings = [
        {
          id: 10,
          vector: Array.from({ length: 1536 }, () => Math.random()),
          payload: {
            function_id: `func_1_${integrationId}`,
            name: 'parseCode',
            complexity: 3,
            session_id: sessionId
          }
        },
        {
          id: 11,
          vector: Array.from({ length: 1536 }, () => Math.random()),
          payload: {
            function_id: `func_2_${integrationId}`,
            name: 'validateSyntax',
            complexity: 2,
            session_id: sessionId
          }
        }
      ];

      await dbService.qdrant.upsert('integration_test', { points: functionEmbeddings });

      // 6. Perform cross-database correlation queries
      // Query: Find all functions analyzed in a session with their complexity scores
      const sessionFunctions = await dbService.postgresQuery(`
        SELECT
          d.content->>'function_name' as function_name,
          d.content->>'complexity' as complexity,
          d.metadata->>'analysis_type' as analysis_type
        FROM documents d
        WHERE d.type = 'analysis_result'
        AND d.metadata->>'session_id' = $1
        ORDER BY (d.content->>'complexity')::int DESC
      `, [sessionId]);

      expect(sessionFunctions.rows.length).toBe(2);
      expect(sessionFunctions.rows[0].function_name).toBe('parseCode');
      expect(sessionFunctions.rows[0].complexity).toBe('3');

      // Query: Find functions by complexity using vector search
      const complexFunctions = await dbService.qdrant.search('integration_test', {
        vector: functionEmbeddings[0].vector,
        limit: 5,
        filter: {
          must: [
            { key: 'complexity', match: { value: 3 } }
          ]
        },
        with_payload: true
      });

      expect(complexFunctions.length).toBe(1);
      expect(complexFunctions[0].payload.name).toBe('parseCode');

      // Query: Get session analysis summary from graph
      const sessionSummary = await dbService.falkordbQuery(`
        MATCH (s:Session {id: "${sessionId}"})-[:ANALYZED]->(f:Function)
        RETURN s.id, count(f) as functions_analyzed, avg(f.complexity) as avg_complexity
      `);

      expect(sessionSummary[0].functions_analyzed).toBe(2);
      expect(sessionSummary[0].avg_complexity).toBe(2.5);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle concurrent multi-database operations', async () => {
      const operationCount = 20;
      const operations = [];

      // Create concurrent operations across all databases
      for (let i = 0; i < operationCount; i++) {
        operations.push(
          // PostgreSQL operation
          dbService.postgresQuery(
            'INSERT INTO documents (id, type, content) VALUES ($1, $2, $3)',
            [`concurrent_${i}_${Date.now()}`, 'performance_test', JSON.stringify({ index: i })]
          ),

          // FalkorDB operation
          dbService.falkordbQuery(`
            CREATE (:PerformanceNode {id: "perf_${i}_${Date.now()}", index: ${i}})
          `),

          // Qdrant operation (batch)
          dbService.qdrant.upsert('integration_test', {
            points: [{
              id: 100 + i,
              vector: Array.from({ length: 1536 }, () => Math.random()),
              payload: { test_id: `perf_${i}`, index: i }
            }]
          })
        );
      }

      const startTime = Date.now();
      await Promise.all(operations.flat());
      const endTime = Date.now();

      console.log(`Completed ${operationCount * 3} operations in ${endTime - startTime}ms`);

      // Verify all operations completed
      const postgresCount = await dbService.postgresQuery(
        'SELECT COUNT(*) as count FROM documents WHERE type = $1',
        ['performance_test']
      );

      expect(postgresCount.rows[0].count).toBe(operationCount);

      const graphCount = await dbService.falkordbQuery(
        'MATCH (n:PerformanceNode) RETURN count(n) as total'
      );

      expect(graphCount[0].total).toBe(operationCount);

      const vectorCount = await dbService.qdrant.count('integration_test');
      expect(vectorCount.count).toBeGreaterThanOrEqual(operationCount);

      // Performance assertion
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should maintain data consistency across databases', async () => {
      const entityId = `consistency_${Date.now()}`;

      // Create an entity that should exist in all databases
      const entity = {
        id: entityId,
        name: 'ConsistencyTest',
        type: 'test_entity',
        version: 1
      };

      // Store in PostgreSQL
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content) VALUES ($1, $2, $3)',
        [entity.id, entity.type, JSON.stringify(entity)]
      );

      // Store in FalkorDB
      await dbService.falkordbQuery(`
        CREATE (e:Entity {
          id: "${entity.id}",
          name: "${entity.name}",
          type: "${entity.type}",
          version: ${entity.version}
        })
      `);

      // Store in Qdrant
      await dbService.qdrant.upsert('integration_test', {
        points: [{
          id: 999,
          vector: Array.from({ length: 1536 }, () => Math.random()),
          payload: entity
        }]
      });

      // Verify consistency by checking all databases have the same data
      const postgresData = await dbService.postgresQuery(
        'SELECT content FROM documents WHERE id = $1',
        [entity.id]
      );

      const graphData = await dbService.falkordbQuery(
        `MATCH (e:Entity {id: "${entity.id}"}) RETURN e.name, e.type, e.version`
      );

      const vectorData = await dbService.qdrant.retrieve('integration_test', { ids: [999] });

      // All databases should have consistent data
      expect(JSON.parse(postgresData.rows[0].content).name).toBe(entity.name);
      expect(graphData[0].name).toBe(entity.name);
      expect(vectorData[0].payload.name).toBe(entity.name);

      expect(JSON.parse(postgresData.rows[0].content).version).toBe(entity.version);
      expect(graphData[0].version).toBe(entity.version);
      expect(vectorData[0].payload.version).toBe(entity.version);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial failures gracefully', async () => {
      // Create a scenario where one database operation fails but others succeed
      const testId = `error_test_${Date.now()}`;

      // PostgreSQL operation (should succeed)
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content) VALUES ($1, $2, $3)',
        [`${testId}_postgres`, 'error_test', JSON.stringify({ status: 'success' })]
      );

      // FalkorDB operation (should succeed)
      await dbService.falkordbQuery(`
        CREATE (:ErrorTest {id: "${testId}_graph", status: "success"})
      `);

      // Qdrant operation with invalid data (should handle gracefully)
      try {
        await dbService.qdrant.upsert('nonexistent_collection', {
          points: [{ id: 1, vector: [], payload: {} }]
        });
      } catch (error) {
        // Expected error for nonexistent collection
        expect(error).toBeDefined();
      }

      // Verify successful operations still worked
      const postgresCheck = await dbService.postgresQuery(
        'SELECT id FROM documents WHERE id = $1',
        [`${testId}_postgres`]
      );
      expect(postgresCheck.rows.length).toBe(1);

      const graphCheck = await dbService.falkordbQuery(
        `MATCH (n:ErrorTest {id: "${testId}_graph"}) RETURN n.status`
      );
      expect(graphCheck[0].status).toBe('success');
    });

    it('should recover from connection issues', async () => {
      // Test that operations can recover after temporary issues
      const testId = `recovery_${Date.now()}`;

      // Perform successful operations
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content) VALUES ($1, $2, $3)',
        [`${testId}_1`, 'recovery_test', JSON.stringify({ step: 1 })]
      );

      await dbService.falkordbQuery(`
        CREATE (:RecoveryTest {id: "${testId}_graph", step: 1})
      `);

      // Simulate some delay (like network issues)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Continue with more operations
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content) VALUES ($1, $2, $3)',
        [`${testId}_2`, 'recovery_test', JSON.stringify({ step: 2 })]
      );

      await dbService.falkordbQuery(`
        CREATE (:RecoveryTest {id: "${testId}_graph2", step: 2})
      `);

      // Verify all operations completed successfully
      const postgresCount = await dbService.postgresQuery(
        'SELECT COUNT(*) as count FROM documents WHERE type = $1',
        ['recovery_test']
      );
      expect(postgresCount.rows[0].count).toBe(2);

      const graphCount = await dbService.falkordbQuery(
        'MATCH (n:RecoveryTest) RETURN count(n) as total'
      );
      expect(graphCount[0].total).toBe(2);
    });
  });
});
