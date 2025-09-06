/**
 * Integration tests for FalkorDBService
 * Tests graph operations, Cypher queries, performance, and error handling with real database operations
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FalkorDBService } from '../../../src/services/database/FalkorDBService';
import { createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import { setupTestDatabase, cleanupTestDatabase, checkDatabaseHealth, } from '../../test-utils/database-helpers';
describe('FalkorDBService Integration', () => {
    let dbService;
    let falkorService;
    beforeAll(async () => {
        dbService = await setupTestDatabase();
        falkorService = new FalkorDBService(createTestDatabaseConfig().falkordb);
        // Ensure database is healthy
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error('Database health check failed - cannot run integration tests');
        }
        // Initialize FalkorDB service
        await falkorService.initialize();
        await falkorService.setupGraph();
    }, 30000);
    afterAll(async () => {
        if (falkorService && falkorService.isInitialized()) {
            await falkorService.close();
        }
        if (dbService && dbService.isInitialized()) {
            await cleanupTestDatabase(dbService);
        }
    }, 10000);
    beforeEach(async () => {
        if (falkorService && falkorService.isInitialized()) {
            // Clear graph data between tests
            try {
                await falkorService.command('GRAPH.QUERY', 'memento', 'MATCH (n) DETACH DELETE n');
            }
            catch (error) {
                // Graph might not exist yet, that's okay
            }
        }
    });
    describe('Service Lifecycle Integration', () => {
        it('should initialize and close service successfully', async () => {
            const newService = new FalkorDBService(createTestDatabaseConfig().falkordb);
            expect(newService.isInitialized()).toBe(false);
            await newService.initialize();
            expect(newService.isInitialized()).toBe(true);
            const client = newService.getClient();
            expect(client).toBeDefined();
            await newService.close();
            expect(newService.isInitialized()).toBe(false);
        });
        it('should perform health check correctly', async () => {
            const isHealthy = await falkorService.healthCheck();
            expect(isHealthy).toBe(true);
        });
        it('should handle multiple initialization calls gracefully', async () => {
            const newService = new FalkorDBService(createTestDatabaseConfig().falkordb);
            await newService.initialize();
            expect(newService.isInitialized()).toBe(true);
            // Second initialization should be a no-op
            await newService.initialize();
            expect(newService.isInitialized()).toBe(true);
            await newService.close();
        });
    });
    describe('Basic Graph Operations Integration', () => {
        it('should create nodes successfully', async () => {
            const createQuery = `
        CREATE (:Entity {
          id: 'test-node-1',
          type: 'file',
          path: 'test.ts',
          language: 'typescript',
          lastModified: '2024-01-01T00:00:00Z',
          created: '2024-01-01T00:00:00Z'
        })
      `;
            const result = await falkorService.query(createQuery);
            expect(result).toBeDefined();
            // Verify node was created
            const verifyQuery = 'MATCH (n:Entity {id: $id}) RETURN n';
            const verifyResult = await falkorService.query(verifyQuery, { id: 'test-node-1' });
            expect(verifyResult).toHaveLength(1);
            expect(verifyResult[0].n.id).toBe('test-node-1');
            expect(verifyResult[0].n.type).toBe('file');
            expect(verifyResult[0].n.language).toBe('typescript');
        });
        it('should create relationships between nodes', async () => {
            // Create two nodes
            const createNodesQuery = `
        CREATE (:Entity {
          id: 'source-node',
          type: 'function',
          path: 'source.ts',
          language: 'typescript'
        }),
        (:Entity {
          id: 'target-node',
          type: 'class',
          path: 'target.ts',
          language: 'typescript'
        })
      `;
            await falkorService.query(createNodesQuery);
            // Create relationship
            const createRelQuery = `
        MATCH (a:Entity {id: $sourceId}), (b:Entity {id: $targetId})
        CREATE (a)-[:DEPENDS_ON {strength: $strength}]->(b)
      `;
            const result = await falkorService.query(createRelQuery, {
                sourceId: 'source-node',
                targetId: 'target-node',
                strength: 0.8
            });
            expect(result).toBeDefined();
            // Verify relationship was created
            const verifyQuery = `
        MATCH (a:Entity {id: $sourceId})-[r:DEPENDS_ON]->(b:Entity {id: $targetId})
        RETURN r, a.id, b.id
      `;
            const verifyResult = await falkorService.query(verifyQuery, {
                sourceId: 'source-node',
                targetId: 'target-node'
            });
            expect(verifyResult).toHaveLength(1);
            expect(verifyResult[0].r.strength).toBe(0.8);
        });
        it('should update node properties', async () => {
            // Create node
            await falkorService.query(`
        CREATE (:Entity {
          id: 'update-test',
          type: 'file',
          path: 'test.ts',
          version: 1
        })
      `);
            // Update node
            const updateQuery = `
        MATCH (n:Entity {id: $id})
        SET n.version = $newVersion, n.lastModified = $timestamp
        RETURN n
      `;
            const result = await falkorService.query(updateQuery, {
                id: 'update-test',
                newVersion: 2,
                timestamp: new Date().toISOString()
            });
            expect(result).toHaveLength(1);
            // Verify update
            const verifyResult = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.version as version', { id: 'update-test' });
            expect(verifyResult[0].version).toBe(2);
        });
        it('should delete nodes and relationships', async () => {
            // Create nodes and relationship
            await falkorService.query(`
        CREATE (:Entity {id: 'delete-source', type: 'file'}),
               (:Entity {id: 'delete-target', type: 'class'}),
               (:Entity {id: 'delete-source'})-[:DEPENDS_ON]->(:Entity {id: 'delete-target'})
      `);
            // Verify they exist
            let countResult = await falkorService.query('MATCH (n:Entity) RETURN count(n) as count');
            expect(countResult[0].count).toBe(2);
            // Delete node
            await falkorService.query('MATCH (n:Entity {id: $id}) DETACH DELETE n', {
                id: 'delete-source'
            });
            // Verify deletion
            countResult = await falkorService.query('MATCH (n:Entity) RETURN count(n) as count');
            expect(countResult[0].count).toBe(1);
            // Delete remaining node
            await falkorService.query('MATCH (n:Entity {id: $id}) DETACH DELETE n', {
                id: 'delete-target'
            });
            countResult = await falkorService.query('MATCH (n:Entity) RETURN count(n) as count');
            expect(countResult[0].count).toBe(0);
        });
    });
    describe('Complex Query Operations Integration', () => {
        beforeEach(async () => {
            // Set up test data for complex queries
            const setupQueries = [
                // Create file entities
                `CREATE (:Entity {
          id: 'file-1',
          type: 'file',
          path: 'src/main.ts',
          language: 'typescript',
          lastModified: '2024-01-01T00:00:00Z'
        })`,
                `CREATE (:Entity {
          id: 'file-2',
          type: 'file',
          path: 'src/utils.ts',
          language: 'typescript',
          lastModified: '2024-01-02T00:00:00Z'
        })`,
                `CREATE (:Entity {
          id: 'file-3',
          type: 'file',
          path: 'src/index.js',
          language: 'javascript',
          lastModified: '2024-01-03T00:00:00Z'
        })`,
                // Create function entities
                `CREATE (:Entity {
          id: 'func-1',
          type: 'function',
          path: 'src/main.ts',
          name: 'main',
          language: 'typescript'
        })`,
                `CREATE (:Entity {
          id: 'func-2',
          type: 'function',
          path: 'src/utils.ts',
          name: 'helper',
          language: 'typescript'
        })`,
                // Create class entities
                `CREATE (:Entity {
          id: 'class-1',
          type: 'class',
          path: 'src/models.ts',
          name: 'User',
          language: 'typescript'
        })`
            ];
            for (const query of setupQueries) {
                await falkorService.query(query);
            }
            // Create relationships
            const relationshipQueries = [
                `MATCH (a:Entity {id: 'func-1'}), (b:Entity {id: 'func-2'})
         CREATE (a)-[:CALLS {line: 10}]->(b)`,
                `MATCH (a:Entity {id: 'func-1'}), (b:Entity {id: 'class-1'})
         CREATE (a)-[:USES {line: 15}]->(b)`,
                `MATCH (a:Entity {id: 'file-1'}), (b:Entity {id: 'func-1'})
         CREATE (a)-[:CONTAINS]->(b)`,
                `MATCH (a:Entity {id: 'file-2'}), (b:Entity {id: 'func-2'})
         CREATE (a)-[:CONTAINS]->(b)`
            ];
            for (const query of relationshipQueries) {
                await falkorService.query(query);
            }
        });
        it('should perform complex pattern matching queries', async () => {
            const query = `
        MATCH (f:Entity {type: 'file'})-[:CONTAINS]->(func:Entity {type: 'function'})
        WHERE f.language = $language
        RETURN f.path as filePath, func.name as functionName, func.language as language
        ORDER BY f.path
      `;
            const result = await falkorService.query(query, { language: 'typescript' });
            expect(result).toHaveLength(2);
            expect(result[0].filePath).toBe('src/main.ts');
            expect(result[0].functionName).toBe('main');
            expect(result[1].filePath).toBe('src/utils.ts');
            expect(result[1].functionName).toBe('helper');
        });
        it('should perform aggregation queries', async () => {
            const query = `
        MATCH (n:Entity)
        WHERE n.type IN ['file', 'function', 'class']
        RETURN n.type as entityType, count(n) as count
        ORDER BY n.type
      `;
            const result = await falkorService.query(query);
            const typeCounts = result.reduce((acc, row) => {
                acc[row.entityType] = row.count;
                return acc;
            }, {});
            expect(typeCounts.file).toBe(3);
            expect(typeCounts.function).toBe(2);
            expect(typeCounts.class).toBe(1);
        });
        it('should handle path queries with variable-length relationships', async () => {
            const query = `
        MATCH path = (file:Entity {type: 'file'})-[:CONTAINS*1..2]-(entity:Entity)
        WHERE file.language = $language
        RETURN file.path as filePath, length(path) as pathLength
        ORDER BY file.path
      `;
            const result = await falkorService.query(query, { language: 'typescript' });
            expect(result.length).toBeGreaterThan(0);
            result.forEach((row) => {
                expect(row.pathLength).toBeGreaterThanOrEqual(2);
                expect(row.filePath).toMatch(/\.ts$/);
            });
        });
        it('should perform conditional queries with WHERE clauses', async () => {
            const query = `
        MATCH (n:Entity)
        WHERE n.type = $type AND n.language = $language AND n.lastModified > $date
        RETURN n.id as id, n.path as path, n.lastModified as lastModified
        ORDER BY n.lastModified DESC
      `;
            const result = await falkorService.query(query, {
                type: 'file',
                language: 'typescript',
                date: '2024-01-01T12:00:00Z'
            });
            expect(result).toHaveLength(2);
            expect(result[0].path).toBe('src/utils.ts');
            expect(result[1].path).toBe('src/main.ts');
        });
        it('should handle UNION queries', async () => {
            const query = `
        MATCH (n:Entity {type: 'file'})
        WHERE n.language = 'typescript'
        RETURN n.path as path, 'file' as entityType
        UNION
        MATCH (n:Entity {type: 'function'})
        RETURN n.name as path, 'function' as entityType
      `;
            const result = await falkorService.query(query);
            expect(result.length).toBeGreaterThanOrEqual(3);
            const fileResults = result.filter((r) => r.entityType === 'file');
            const functionResults = result.filter((r) => r.entityType === 'function');
            expect(fileResults.length).toBe(2);
            expect(functionResults.length).toBe(2);
        });
    });
    describe('Parameter Handling Integration', () => {
        it('should handle string parameters correctly', async () => {
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: $type,
          path: $path,
          language: $language
        })
      `, {
                id: 'param-test-string',
                type: 'file',
                path: 'test.ts',
                language: 'typescript'
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n', { id: 'param-test-string' });
            expect(result).toHaveLength(1);
            expect(result[0].n.type).toBe('file');
            expect(result[0].n.language).toBe('typescript');
        });
        it('should handle numeric parameters correctly', async () => {
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'metric',
          value: $value,
          precision: $precision
        })
      `, {
                id: 'param-test-numeric',
                value: 42.5,
                precision: 2
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.value as value, n.precision as precision', { id: 'param-test-numeric' });
            expect(result).toHaveLength(1);
            expect(result[0].value).toBe(42.5);
            expect(result[0].precision).toBe(2);
        });
        it('should handle boolean parameters correctly', async () => {
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'flag',
          enabled: $enabled,
          active: $active
        })
      `, {
                id: 'param-test-boolean',
                enabled: true,
                active: false
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.enabled as enabled, n.active as active', { id: 'param-test-boolean' });
            expect(result).toHaveLength(1);
            expect(result[0].enabled).toBe(true);
            expect(result[0].active).toBe(false);
        });
        it('should handle array parameters correctly', async () => {
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'collection',
          tags: $tags,
          scores: $scores
        })
      `, {
                id: 'param-test-array',
                tags: ['typescript', 'react', 'node'],
                scores: [85, 92, 78]
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.tags as tags, n.scores as scores', { id: 'param-test-array' });
            expect(result).toHaveLength(1);
            expect(result[0].tags).toEqual(['typescript', 'react', 'node']);
            expect(result[0].scores).toEqual([85, 92, 78]);
        });
        it('should handle object parameters correctly', async () => {
            const metadata = {
                author: 'John Doe',
                version: '1.0.0',
                license: 'MIT'
            };
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'package',
          metadata: $metadata
        })
      `, {
                id: 'param-test-object',
                metadata
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.metadata as metadata', { id: 'param-test-object' });
            expect(result).toHaveLength(1);
            expect(result[0].metadata.author).toBe('John Doe');
            expect(result[0].metadata.version).toBe('1.0.0');
            expect(result[0].metadata.license).toBe('MIT');
        });
        it('should handle null and undefined parameters correctly', async () => {
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'test',
          nullable: $nullable,
          undefined: $undefined
        })
      `, {
                id: 'param-test-null',
                nullable: null,
                undefined: undefined
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.nullable as nullable, n.undefined as undefined', { id: 'param-test-null' });
            expect(result).toHaveLength(1);
            expect(result[0].nullable).toBeNull();
            expect(result[0].undefined).toBeNull(); // Cypher converts undefined to null
        });
        it('should reject invalid parameter names', async () => {
            await expect(falkorService.query('CREATE (:Entity {id: $invalid-param})', { 'invalid-param': 'test' })).rejects.toThrow('Invalid parameter name');
        });
    });
    describe('Performance and Load Testing', () => {
        it('should handle bulk node creation efficiently', async () => {
            const bulkSize = 100;
            const nodes = [];
            // Create bulk creation query
            for (let i = 0; i < bulkSize; i++) {
                nodes.push(`(:Entity {id: 'bulk-${i}', type: 'file', path: 'bulk${i}.ts'})`);
            }
            const bulkQuery = `CREATE ${nodes.join(', ')}`;
            const startTime = Date.now();
            await falkorService.query(bulkQuery);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max
            // Verify all nodes were created
            const countResult = await falkorService.query('MATCH (n:Entity) WHERE n.id STARTS WITH "bulk-" RETURN count(n) as count');
            expect(countResult[0].count).toBe(bulkSize);
        });
        it('should handle complex graph traversals efficiently', async () => {
            // Create a more complex graph structure
            const nodes = [];
            const relationships = [];
            for (let i = 0; i < 50; i++) {
                nodes.push(`(:Entity {id: 'complex-${i}', type: 'function', name: 'func${i}'})`);
                // Create relationships between functions
                if (i > 0) {
                    relationships.push(`(:Entity {id: 'complex-${i - 1}'})-[:CALLS]->(:Entity {id: 'complex-${i}'})`);
                }
            }
            const createQuery = `CREATE ${nodes.join(', ')}, ${relationships.join(', ')}`;
            await falkorService.query(createQuery);
            // Perform complex traversal
            const startTime = Date.now();
            const result = await falkorService.query(`
        MATCH path = (start:Entity {id: $startId})-[:CALLS*1..10]->(end:Entity)
        RETURN length(path) as depth, count(path) as paths
        ORDER BY depth DESC
        LIMIT 1
      `, { startId: 'complex-0' });
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(2000); // 2 seconds max
            expect(result.length).toBeGreaterThan(0);
        });
        it('should maintain query performance with increasing data size', async () => {
            const iterations = 5;
            const performanceResults = [];
            for (let i = 0; i < iterations; i++) {
                // Add more data each iteration
                const nodes = [];
                for (let j = 0; j < 20; j++) {
                    const nodeId = `perf-${i}-${j}`;
                    nodes.push(`(:Entity {id: '${nodeId}', type: 'file', iteration: ${i}})`);
                }
                await falkorService.query(`CREATE ${nodes.join(', ')}`);
                // Measure query performance
                const startTime = Date.now();
                const result = await falkorService.query('MATCH (n:Entity {type: $type}) WHERE n.iteration = $iteration RETURN count(n) as count', { type: 'file', iteration: i });
                const endTime = Date.now();
                performanceResults.push(endTime - startTime);
                expect(result[0].count).toBe(20);
            }
            // Performance should be relatively consistent
            const avgDuration = performanceResults.reduce((sum, d) => sum + d, 0) / performanceResults.length;
            const maxDuration = Math.max(...performanceResults);
            const minDuration = Math.min(...performanceResults);
            expect(avgDuration).toBeLessThan(500); // Average < 500ms
            expect(maxDuration - minDuration).toBeLessThan(avgDuration * 0.5); // Low variance
        });
    });
    describe('Index and Optimization Integration', () => {
        it('should utilize indexes for query optimization', async () => {
            // Create nodes with indexed properties
            const nodes = [];
            for (let i = 0; i < 100; i++) {
                nodes.push(`(:Entity {
          id: 'index-test-${i}',
          type: 'file',
          path: 'src/file${i}.ts',
          language: 'typescript',
          lastModified: '${new Date().toISOString()}'
        })`);
            }
            await falkorService.query(`CREATE ${nodes.join(', ')}`);
            // Query using indexed property (type)
            const startTime = Date.now();
            const result1 = await falkorService.query('MATCH (n:Entity {type: $type}) RETURN count(n) as count', { type: 'file' });
            const endTime = Date.now();
            expect(result1[0].count).toBe(100);
            expect(endTime - startTime).toBeLessThan(1000); // Should be fast with index
            // Query using indexed property (language)
            const startTime2 = Date.now();
            const result2 = await falkorService.query('MATCH (n:Entity {language: $language}) RETURN count(n) as count', { language: 'typescript' });
            const endTime2 = Date.now();
            expect(result2[0].count).toBe(100);
            expect(endTime2 - startTime2).toBeLessThan(1000); // Should be fast with index
        });
        it('should handle composite index queries efficiently', async () => {
            // Create nodes for composite index testing
            const nodes = [];
            for (let i = 0; i < 50; i++) {
                nodes.push(`(:Entity {
          id: 'composite-${i}',
          type: 'function',
          path: 'src/utils${i}.ts',
          language: 'typescript'
        })`);
            }
            await falkorService.query(`CREATE ${nodes.join(', ')}`);
            // Query using composite index (type + path pattern)
            const startTime = Date.now();
            const result = await falkorService.query(`
        MATCH (n:Entity)
        WHERE n.type = $type AND n.path STARTS WITH $pathPrefix
        RETURN count(n) as count
      `, {
                type: 'function',
                pathPrefix: 'src/utils'
            });
            const endTime = Date.now();
            expect(result[0].count).toBe(50);
            expect(endTime - startTime).toBeLessThan(1000); // Should be fast with composite index
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid Cypher syntax gracefully', async () => {
            await expect(falkorService.query('INVALID CYPHER SYNTAX !!!')).rejects.toThrow();
        });
        it('should handle connection errors during queries', async () => {
            const invalidService = new FalkorDBService({
                url: 'redis://invalid:1234',
                database: 1
            });
            await expect(invalidService.initialize()).rejects.toThrow();
        });
        it('should handle queries on non-existent graphs', async () => {
            const tempService = new FalkorDBService(createTestDatabaseConfig().falkordb);
            await tempService.initialize();
            // Query non-existent graph
            const result = await tempService.query('MATCH (n) RETURN count(n) as count');
            expect(result).toEqual([]);
            await tempService.close();
        });
        it('should handle large result sets', async () => {
            // Create many nodes
            const nodes = [];
            for (let i = 0; i < 1000; i++) {
                nodes.push(`(:Entity {id: 'large-${i}', type: 'data', index: ${i}})`);
            }
            await falkorService.query(`CREATE ${nodes.join(', ')}`);
            // Query large result set
            const startTime = Date.now();
            const result = await falkorService.query('MATCH (n:Entity {type: $type}) RETURN n.id as id, n.index as index ORDER BY n.index LIMIT 500', { type: 'data' });
            const endTime = Date.now();
            expect(result).toHaveLength(500);
            expect(result[0].index).toBe(0);
            expect(result[499].index).toBe(499);
            expect(endTime - startTime).toBeLessThan(2000); // Should handle large results efficiently
        });
        it('should handle concurrent operations safely', async () => {
            const concurrentOperations = 10;
            const operations = [];
            for (let i = 0; i < concurrentOperations; i++) {
                operations.push(falkorService.query(`
            CREATE (:Entity {
              id: $id,
              type: 'concurrent',
              index: $index,
              timestamp: $timestamp
            })
          `, {
                    id: `concurrent-${i}`,
                    index: i,
                    timestamp: new Date().toISOString()
                }));
            }
            const startTime = Date.now();
            const results = await Promise.all(operations);
            const endTime = Date.now();
            expect(results).toHaveLength(concurrentOperations);
            expect(endTime - startTime).toBeLessThan(3000); // Should handle concurrency well
            // Verify all operations succeeded
            const countResult = await falkorService.query('MATCH (n:Entity {type: $type}) RETURN count(n) as count', { type: 'concurrent' });
            expect(countResult[0].count).toBe(concurrentOperations);
        });
        it('should handle special characters in queries', async () => {
            const specialContent = 'Special content with émojis 🚀 and ümlauts';
            await falkorService.query(`
        CREATE (:Entity {
          id: $id,
          type: 'special',
          content: $content,
          symbols: $symbols
        })
      `, {
                id: 'special-chars-test',
                content: specialContent,
                symbols: ['α', 'β', 'γ', 'δ']
            });
            const result = await falkorService.query('MATCH (n:Entity {id: $id}) RETURN n.content as content, n.symbols as symbols', { id: 'special-chars-test' });
            expect(result).toHaveLength(1);
            expect(result[0].content).toBe(specialContent);
            expect(result[0].symbols).toEqual(['α', 'β', 'γ', 'δ']);
        });
    });
    describe('Command Operations Integration', () => {
        it('should execute raw commands successfully', async () => {
            // Use command method for direct Redis commands
            const result = await falkorService.command('PING');
            expect(result).toBe('PONG');
        });
        it('should handle graph-specific commands', async () => {
            // Create some test data first
            await falkorService.query(`
        CREATE (:Entity {id: 'cmd-test', type: 'file', path: 'test.ts'})
      `);
            // Use GRAPH.QUERY command directly
            const result = await falkorService.command('GRAPH.QUERY', 'memento', 'MATCH (n:Entity {id: $id}) RETURN n', { id: 'cmd-test' });
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(1); // Headers + data
        });
        it('should handle command errors gracefully', async () => {
            await expect(falkorService.command('INVALID_COMMAND')).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=FalkorDBService.integration.test.js.map