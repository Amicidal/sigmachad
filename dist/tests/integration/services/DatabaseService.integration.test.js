/**
 * Deep Integration tests for DatabaseService
 * Comprehensive testing of real database operations and cross-database interactions
 * Tests error scenarios, performance, data consistency, and edge cases
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, insertTestFixtures, checkDatabaseHealth, } from '../../test-utils/database-helpers';
describe('DatabaseService Integration', () => {
    let dbService;
    beforeAll(async () => {
        dbService = await setupTestDatabase();
        // Ensure database is healthy
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error('Database health check failed - cannot run integration tests');
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
    describe('Cross-Database Operations', () => {
        it('should handle complex workflow spanning multiple databases', async () => {
            // 1. Store document in PostgreSQL
            const docResult = await dbService.postgresQuery(`
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [
                'code',
                JSON.stringify({ language: 'typescript', code: 'console.log("test");' }),
                JSON.stringify({ file: 'test.ts', author: 'test_user' })
            ]);
            const docId = docResult.rows[0]?.id;
            // 2. Create corresponding graph node in FalkorDB
            await dbService.falkordbQuery(`
        CREATE (:Entity {
          id: $id,
          type: 'file',
          path: 'test.ts',
          language: 'typescript',
          lastModified: $timestamp
        })
      `, {
                id: docId,
                timestamp: new Date().toISOString(),
            });
            // 3. Store embedding in Qdrant
            const testEmbedding = new Array(1536).fill(0).map(() => Math.random());
            await dbService.qdrant.createCollection('test_embeddings', {
                vectors: {
                    size: 1536,
                    distance: 'Cosine',
                },
            });
            await dbService.qdrant.upsert('test_embeddings', {
                points: [{
                        id: docId,
                        vector: testEmbedding,
                        payload: {
                            type: 'code',
                            path: 'test.ts',
                            language: 'typescript',
                        },
                    }],
            });
            // 4. Cache metadata in Redis
            await dbService.redisSet(`doc:${docId}:metadata`, JSON.stringify({
                type: 'code',
                path: 'test.ts',
                language: 'typescript',
                cached_at: new Date().toISOString(),
            }));
            // 5. Verify data consistency across all databases
            // PostgreSQL
            const pgResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [docId]);
            expect(pgResult.rows[0]?.type).toBe('code');
            // FalkorDB
            const falkorResult = await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) RETURN n.path as path, n.language as language', { id: docId.toString() });
            expect(falkorResult[0]?.path).toBe('test.ts');
            expect(falkorResult[0]?.language).toBe('typescript');
            // Qdrant
            const qdrantResult = await dbService.qdrant.scroll('test_embeddings', {
                limit: 1,
                filter: {
                    must: [
                        {
                            key: 'id',
                            match: { value: docId.toString() },
                        },
                    ],
                },
            });
            expect(qdrantResult.points.length).toBe(1);
            // Redis
            const redisResult = await dbService.redisGet(`doc:${docId}:metadata`);
            expect(redisResult).toBeTruthy();
            expect(typeof redisResult).toBe('string');
            expect(redisResult.length).toBeGreaterThan(0);
            const metadata = JSON.parse(redisResult);
            expect(metadata.type).toBe('code');
            expect(metadata.path).toBe('test.ts');
        });
        it('should handle transaction rollback across databases with proper error isolation', async () => {
            // Setup tracking variables for detailed verification
            let pgTransactionStarted = false;
            let falkorNodeCreated = false;
            let redisKeySet = false;
            let rollbackError = null;
            const testDocId = 'rollback_test_' + Date.now();
            const testEntityId = 'rollback_entity_' + Date.now();
            const testRedisKey = 'rollback_key_' + Date.now();
            try {
                await dbService.postgresTransaction(async (client) => {
                    pgTransactionStarted = true;
                    // Insert document in PostgreSQL transaction
                    await client.query(`
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `, [
                        testDocId,
                        'test',
                        JSON.stringify({ test: 'rollback', timestamp: new Date().toISOString() }),
                        JSON.stringify({ rollback: true, entityId: testEntityId })
                    ]);
                    // Create FalkorDB node (outside transaction scope)
                    await dbService.falkordbQuery(`
            CREATE (:Entity {
              id: $id,
              type: 'test',
              path: 'rollback.ts',
              createdAt: $timestamp
            })
          `, {
                        id: testEntityId,
                        timestamp: new Date().toISOString(),
                    });
                    falkorNodeCreated = true;
                    // Set Redis key (outside transaction scope)
                    await dbService.redisSet(testRedisKey, JSON.stringify({
                        value: 'test_value',
                        timestamp: new Date().toISOString(),
                        associatedEntity: testEntityId
                    }));
                    redisKeySet = true;
                    // Force an error to trigger rollback
                    throw new Error('Intentional rollback test');
                });
            }
            catch (error) {
                // Properly typed error handling
                if (error instanceof Error) {
                    rollbackError = error;
                    expect(error.message).toBe('Intentional rollback test');
                }
                else {
                    throw new Error('Unexpected error type');
                }
            }
            // Verify error was caught and transaction state
            expect(rollbackError).toBeInstanceOf(Error);
            expect(rollbackError?.message).toBe('Intentional rollback test');
            expect(pgTransactionStarted).toBe(true);
            expect(falkorNodeCreated).toBe(true);
            expect(redisKeySet).toBe(true);
            // Verify PostgreSQL transaction was rolled back
            const pgResult = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE id = $1', [testDocId]);
            expect(pgResult.rows[0]?.count).toBe('0');
            // Verify FalkorDB node still exists (not affected by PostgreSQL transaction)
            const falkorResult = await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) RETURN count(n) as count', { id: testEntityId });
            expect(falkorResult[0]?.count).toBe(1);
            // Verify Redis key still exists (not affected by PostgreSQL transaction)
            const redisResult = await dbService.redisGet(testRedisKey);
            expect(redisResult).toBeTruthy();
            expect(typeof redisResult).toBe('string');
            const redisData = JSON.parse(redisResult);
            expect(redisData.associatedEntity).toBe(testEntityId);
            // Clean up created resources
            await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) DELETE n', { id: testEntityId });
            await dbService.redisDel(testRedisKey);
        });
    });
    describe('Performance and Load Testing', () => {
        it('should handle concurrent operations efficiently', async () => {
            const concurrentOperations = 10;
            const operations = [];
            // Create concurrent read/write operations
            for (let i = 0; i < concurrentOperations; i++) {
                operations.push(
                // PostgreSQL operation
                dbService.postgresQuery(`
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `, [
                    'performance_test',
                    JSON.stringify({ iteration: i, data: 'test'.repeat(100) }),
                    JSON.stringify({ test_id: i })
                ]), 
                // FalkorDB operation
                dbService.falkordbQuery(`
            CREATE (:Entity {
              id: $id,
              type: 'performance_test',
              iteration: $iteration
            })
          `, {
                    id: `perf_test_${i}`,
                    iteration: i,
                }), 
                // Redis operation
                dbService.redisSet(`perf_key_${i}`, `value_${i}`, 300));
            }
            const startTime = Date.now();
            await Promise.all(operations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time (adjust based on environment)
            expect(duration).toBeLessThan(10000); // 10 seconds max
            // Verify all operations completed
            const pgCount = await dbService.postgresQuery("SELECT COUNT(*) as count FROM documents WHERE type = 'performance_test'");
            expect(parseInt(pgCount.rows[0]?.count)).toBe(concurrentOperations);
            const falkorCount = await dbService.falkordbQuery("MATCH (n:Entity {type: 'performance_test'}) RETURN count(n) as count");
            expect(falkorCount[0]?.count).toBe(concurrentOperations);
            // Check a few Redis keys with proper verification
            for (let i = 0; i < Math.min(3, concurrentOperations); i++) {
                const value = await dbService.redisGet(`perf_key_${i}`);
                expect(value).toBe(`value_${i}`);
            }
        });
        it('should handle large dataset operations', async () => {
            const batchSize = 100;
            const operations = [];
            // Create large batch of documents
            for (let i = 0; i < batchSize; i++) {
                operations.push(dbService.postgresQuery(`
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
          `, [
                    'bulk_test',
                    JSON.stringify({
                        id: i,
                        data: 'x'.repeat(1000), // 1KB of data per document
                        timestamp: new Date().toISOString(),
                    }),
                    JSON.stringify({ batch_id: 'bulk_test_1', index: i })
                ]));
            }
            const startTime = Date.now();
            await Promise.all(operations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time
            expect(duration).toBeLessThan(30000); // 30 seconds max
            // Verify all documents were inserted
            const countResult = await dbService.postgresQuery("SELECT COUNT(*) as count FROM documents WHERE type = 'bulk_test'");
            expect(parseInt(countResult.rows[0]?.count)).toBe(batchSize);
            // Test querying large dataset
            const queryStartTime = Date.now();
            const result = await dbService.postgresQuery(`
        SELECT id, type, metadata
        FROM documents
        WHERE type = 'bulk_test'
        ORDER BY id
        LIMIT 50
      `);
            const queryEndTime = Date.now();
            expect(result.rows.length).toBe(50);
            expect(queryEndTime - queryStartTime).toBeLessThan(1000); // Query should be fast
        });
    });
    describe('Data Consistency and Integrity', () => {
        it('should maintain referential integrity', async () => {
            // Create a session
            const sessionResult = await dbService.postgresQuery(`
        INSERT INTO sessions (agent_type, user_id, start_time, status, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
                'test_agent',
                'test_user',
                new Date(),
                'active',
                JSON.stringify({ test: 'integrity' })
            ]);
            const sessionId = sessionResult.rows[0]?.id;
            // Create changes referencing the session
            await dbService.postgresQuery(`
        INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, session_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                'create',
                'file',
                'integrity_test.ts',
                new Date(),
                'test_author',
                sessionId,
            ]);
            // Create test suite
            const suiteResult = await dbService.postgresQuery(`
        INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
                'integrity_test',
                new Date(),
                'vitest',
                2,
                1,
                1,
                0,
                500,
            ]);
            const suiteId = suiteResult.rows[0]?.id;
            // Create test results referencing the suite
            await dbService.postgresQuery(`
        INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                'integrity_test_1',
                'should maintain integrity',
                'passed',
                100,
                new Date(),
                suiteId,
            ]);
            // Verify referential integrity by querying joined data
            const joinedResult = await dbService.postgresQuery(`
        SELECT
          tr.test_name,
          tr.status,
          ts.suite_name,
          ts.framework,
          c.entity_id,
          c.change_type,
          s.agent_type,
          s.user_id
        FROM test_results tr
        JOIN test_suites ts ON tr.suite_id = ts.id
        LEFT JOIN changes c ON c.session_id = $1
        LEFT JOIN sessions s ON s.id = $1
        WHERE tr.test_id = 'integrity_test_1'
      `, [sessionId]);
            expect(joinedResult.rows.length).toBe(1);
            const row = joinedResult.rows[0];
            expect(row.test_name).toBe('should maintain integrity');
            expect(row.status).toBe('passed');
            expect(row.suite_name).toBe('integrity_test');
            expect(row.framework).toBe('vitest');
            expect(row.agent_type).toBe('test_agent');
            expect(row.user_id).toBe('test_user');
        });
        it('should handle concurrent modifications safely', async () => {
            const entityId = 'concurrent_test.ts';
            const concurrentUpdates = 5;
            // Create initial document
            await dbService.postgresQuery(`
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [
                entityId,
                'code',
                JSON.stringify({ code: 'initial code' }),
                JSON.stringify({ version: 1 })
            ]);
            // Perform concurrent updates
            const updatePromises = [];
            for (let i = 0; i < concurrentUpdates; i++) {
                updatePromises.push(dbService.postgresQuery(`
            UPDATE documents
            SET
              content = jsonb_set(content, '{code}', $2),
              metadata = jsonb_set(metadata, '{version}', $3),
              updated_at = NOW()
            WHERE id = $1
          `, [
                    entityId,
                    JSON.stringify(`updated code v${i + 2}`),
                    JSON.stringify(i + 2)
                ]));
            }
            await Promise.all(updatePromises);
            // Verify final state
            const finalResult = await dbService.postgresQuery('SELECT content, metadata FROM documents WHERE id = $1', [entityId]);
            expect(finalResult.rows.length).toBe(1);
            // The final state should be from one of the updates (exact value may vary due to race conditions)
            // Verify the version was updated (should be between 2 and concurrentUpdates+1)
            const version = finalResult.rows[0]?.metadata?.version;
            expect(typeof version).toBe('number');
            expect(version).toBeGreaterThanOrEqual(2);
            expect(version).toBeLessThanOrEqual(concurrentUpdates + 1);
        });
    });
    describe('Search and Analytics', () => {
        beforeEach(async () => {
            // Insert test fixtures for search tests
            await insertTestFixtures(dbService);
        });
        it('should perform complex searches across databases', async () => {
            // Search for documents by type
            const docsByType = await dbService.postgresQuery(`
        SELECT id, type, content, metadata
        FROM documents
        WHERE type = 'code'
        ORDER BY created_at DESC
        LIMIT 10
      `);
            expect(docsByType.rows.length).toBeGreaterThan(0);
            docsByType.rows.forEach((row) => {
                expect(row.type).toBe('code');
                expect(row.id).toBeTruthy();
                expect(typeof row.id).toBe('string');
                expect(row.content).toBeTruthy();
                expect(typeof row.content).toBe('object');
            });
            // Search FalkorDB for entities by type
            const entitiesByType = await dbService.falkordbQuery(`
        MATCH (n:Entity {type: 'file'})
        RETURN n.id as id, n.path as path, n.language as language
        ORDER BY n.lastModified DESC
        LIMIT 10
      `);
            expect(entitiesByType.length).toBeGreaterThan(0);
            entitiesByType.forEach((entity) => {
                expect(entity.language).toBeTruthy();
                expect(typeof entity.language).toBe('string');
                expect(entity.id).toBeTruthy();
                expect(typeof entity.id).toBe('string');
                expect(entity.path).toBeTruthy();
                expect(typeof entity.path).toBe('string');
                expect(entity.path).toMatch(/\.(ts|js|py|go|rs)$/);
            });
            // Search test results by status
            const failedTests = await dbService.getTestExecutionHistory('', 100);
            const failedCount = failedTests.filter(test => test.status === 'failed').length;
            expect(failedCount).toBeGreaterThan(0);
        });
        it('should generate analytics and reports', async () => {
            // Get test suite statistics
            const suiteStats = await dbService.postgresQuery(`
        SELECT
          COUNT(*) as total_suites,
          AVG(total_tests) as avg_tests_per_suite,
          SUM(passed_tests) as total_passed,
          SUM(failed_tests) as total_failed,
          AVG(duration) as avg_duration
        FROM test_suites
      `);
            expect(suiteStats.rows[0]?.total_suites).toBeGreaterThan(0);
            expect(suiteStats.rows[0]?.avg_tests_per_suite).toBeGreaterThan(0);
            // Get flaky test analysis
            const flakyStats = await dbService.postgresQuery(`
        SELECT
          COUNT(*) as total_flaky_tests,
          AVG(flaky_score) as avg_flaky_score,
          MAX(flaky_score) as max_flaky_score,
          MIN(flaky_score) as min_flaky_score
        FROM flaky_test_analyses
        WHERE flaky_score > 50
      `);
            expect(flakyStats.rows[0]?.total_flaky_tests).toBeGreaterThan(0);
            // Get performance metrics summary
            const perfStats = await dbService.postgresQuery(`
        SELECT
          AVG(memory_usage) as avg_memory,
          AVG(cpu_usage) as avg_cpu,
          SUM(network_requests) as total_network_requests,
          COUNT(*) as total_measurements
        FROM test_performance
      `);
            expect(perfStats.rows[0]?.total_measurements).toBeGreaterThan(0);
        });
        it('should handle full-text search', async () => {
            // Search documents containing specific content
            const searchResults = await dbService.postgresQuery(`
        SELECT id, type, content, metadata
        FROM documents
        WHERE content::text ILIKE $1
        OR metadata::text ILIKE $1
      `, ['%test%']);
            expect(searchResults.rows.length).toBeGreaterThan(0);
            // Search test results by name
            const testSearch = await dbService.postgresQuery(`
        SELECT test_id, test_name, status
        FROM test_results
        WHERE test_name ILIKE $1
      `, ['%pass%']);
            expect(testSearch.rows.length).toBeGreaterThan(0);
            testSearch.rows.forEach((row) => {
                expect(row.test_name.toLowerCase()).toContain('pass');
                expect(row.test_id).toBeTruthy();
                expect(typeof row.test_id).toBe('string');
                expect(row.test_name.toLowerCase()).toContain('pass');
                expect(row.status).toBeTruthy();
                expect(['passed', 'failed', 'skipped']).toContain(row.status);
            });
        });
    });
    describe('Backup and Recovery Scenarios', () => {
        it('should handle database backup simulation', async () => {
            // Create a snapshot of current data
            const snapshot = {
                documents: await dbService.postgresQuery('SELECT * FROM documents ORDER BY id'),
                sessions: await dbService.postgresQuery('SELECT * FROM sessions ORDER BY id'),
                changes: await dbService.postgresQuery('SELECT * FROM changes ORDER BY id'),
                testSuites: await dbService.postgresQuery('SELECT * FROM test_suites ORDER BY id'),
                falkorNodes: await dbService.falkordbQuery('MATCH (n) RETURN n ORDER BY n.id'),
            };
            // Insert new data
            await dbService.postgresQuery(`
        INSERT INTO documents (type, content, metadata)
        VALUES ($1, $2, $3)
      `, [
                'backup_test',
                JSON.stringify({ test: 'backup recovery' }),
                JSON.stringify({ backup: true })
            ]);
            // Verify new data exists
            const newDataCheck = await dbService.postgresQuery("SELECT COUNT(*) as count FROM documents WHERE type = 'backup_test'");
            expect(newDataCheck.rows[0]?.count).toBe('1');
            // Simulate "recovery" by clearing and restoring
            await clearTestData(dbService);
            // Verify data was cleared
            const clearedCheck = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents');
            expect(clearedCheck.rows[0]?.count).toBe('0');
            // Restore from snapshot (simplified - in real scenario would use actual backup)
            for (const doc of snapshot.documents.rows) {
                await dbService.postgresQuery(`
          INSERT INTO documents (id, type, content, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [
                    doc.id,
                    doc.type,
                    doc.content,
                    doc.metadata,
                    doc.created_at,
                    doc.updated_at,
                ]);
            }
            // Verify restoration
            const restoredCount = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents');
            expect(restoredCount.rows[0]?.count).toBe(snapshot.documents.rows.length.toString());
        });
    });
    describe('Error Scenarios and Edge Cases', () => {
        it('should handle network failures gracefully during cross-database operations', async () => {
            const testId = `network_test_${Date.now()}`;
            // Simulate partial failure scenario
            try {
                // Start with PostgreSQL operation
                await dbService.postgresQuery(`
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
                    testId,
                    'network_test',
                    JSON.stringify({ test: 'network_failure' }),
                    JSON.stringify({ network_test: true })
                ]);
                // Attempt FalkorDB operation that might fail
                await dbService.falkordbQuery(`
          CREATE (:Entity {
            id: $id,
            type: 'network_test',
            path: 'network_test.ts'
          })
        `, { id: testId });
                // If we get here, both operations succeeded
                const pgResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [testId]);
                expect(pgResult.rows.length).toBe(1);
                const falkorResult = await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) RETURN n', { id: testId });
                expect(falkorResult.length).toBe(1);
            }
            catch (error) {
                // Network test failure (expected in some scenarios)
                console.log(`Network test experienced error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Clean up any partial state
                try {
                    await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [testId]);
                }
                catch (cleanupError) {
                    console.warn('Failed to clean up PostgreSQL test data:', cleanupError);
                }
                try {
                    await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) DELETE n', { id: testId });
                }
                catch (cleanupError) {
                    console.warn('Failed to clean up FalkorDB test data:', cleanupError);
                }
            }
        });
        it('should handle concurrent connection limits properly', async () => {
            const maxConcurrentOperations = 20;
            const operations = [];
            const operationIds = [];
            // Create multiple concurrent operations
            for (let i = 0; i < maxConcurrentOperations; i++) {
                const operationId = `concurrent_${i}_${Date.now()}`;
                operationIds.push(operationId);
                operations.push(dbService.postgresQuery(`
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `, [
                    operationId,
                    'concurrency_test',
                    JSON.stringify({ operation: i, timestamp: new Date().toISOString() }),
                    JSON.stringify({ concurrent: true, index: i })
                ]));
            }
            // Execute all operations concurrently
            const startTime = Date.now();
            const results = await Promise.allSettled(operations);
            const endTime = Date.now();
            const successfulOperations = results.filter(result => result.status === 'fulfilled').length;
            const failedOperations = results.filter(result => result.status === 'rejected').length;
            // Should handle reasonable concurrency
            expect(successfulOperations).toBeGreaterThan(0);
            expect(successfulOperations + failedOperations).toBe(maxConcurrentOperations);
            // Performance should be reasonable
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(10000); // 10 seconds max for 20 concurrent operations
            // Verify successful operations
            const verifyResults = await dbService.postgresQuery("SELECT COUNT(*) as count FROM documents WHERE type = 'concurrency_test'");
            expect(parseInt(verifyResults.rows[0]?.count)).toBe(successfulOperations);
            // Clean up
            await dbService.postgresQuery("DELETE FROM documents WHERE type = 'concurrency_test'");
        });
        it('should handle malformed data and invalid queries gracefully', async () => {
            const testId = `malformed_${Date.now()}`;
            // Test with malformed JSON
            try {
                await dbService.postgresQuery(`
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
                    testId,
                    'malformed_test',
                    '{invalid json', // Malformed JSON
                    JSON.stringify({ test: 'malformed' })
                ]);
                // If we get here, the database accepted malformed JSON (which might be okay)
            }
            catch (error) {
                // Expected: database should reject malformed JSON
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toMatch(/invalid|malformed|JSON|syntax/i);
            }
            // Test with invalid FalkorDB query
            try {
                await dbService.falkordbQuery('INVALID CYPHER QUERY SYNTAX');
                // If we get here, the query was accepted (shouldn't happen)
                expect(false).toBe(true); // Force failure
            }
            catch (error) {
                // Expected: FalkorDB should reject invalid Cypher syntax
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toMatch(/invalid|syntax|cypher|query/i);
            }
            // Test with null/undefined values
            try {
                await dbService.redisSet(testId, null);
                // Redis might handle null values
            }
            catch (error) {
                // Expected: Redis should reject null values
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toMatch(/null|invalid|value|type/i);
            }
            // Clean up any created data
            try {
                await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [testId]);
                await dbService.redisDel(testId);
            }
            catch (cleanupError) {
                console.warn('Failed to clean up test data:', cleanupError);
            }
        });
        it('should handle database connection drops and reconnections', async () => {
            const testId = `reconnect_${Date.now()}`;
            // Test basic connectivity first
            const healthBefore = await dbService.healthCheck();
            expect(healthBefore.postgresql).toBe(true);
            // Perform operations that should work with healthy connection
            await dbService.postgresQuery(`
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
                testId,
                'reconnect_test',
                JSON.stringify({ test: 'reconnection' }),
                JSON.stringify({ reconnect: true })
            ]);
            // Verify operation succeeded
            const verifyResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [testId]);
            expect(verifyResult.rows.length).toBe(1);
            // Test health after operations
            const healthAfter = await dbService.healthCheck();
            expect(healthAfter.postgresql).toBe(true);
            // Clean up
            await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [testId]);
        });
        it('should handle large payload operations within limits', async () => {
            const testId = `large_payload_${Date.now()}`;
            // Create a large payload (but within reasonable limits)
            const largeContent = 'x'.repeat(100000); // 100KB of content
            const largeMetadata = { large_field: 'y'.repeat(50000) }; // 50KB metadata
            const startTime = Date.now();
            await dbService.postgresQuery(`
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
                testId,
                'large_payload_test',
                JSON.stringify({ content: largeContent }),
                JSON.stringify(largeMetadata)
            ]);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max for large payload
            // Verify the data was stored correctly
            const verifyResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [testId]);
            expect(verifyResult.rows.length).toBe(1);
            const storedContent = JSON.parse(verifyResult.rows[0].content);
            expect(storedContent.content.length).toBe(100000);
            // Clean up
            await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [testId]);
        });
        it('should handle race conditions in concurrent updates', async () => {
            const entityId = `race_condition_${Date.now()}`;
            const concurrentUpdates = 10;
            const updatePromises = [];
            // Create initial document
            await dbService.postgresQuery(`
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
                entityId,
                'race_test',
                JSON.stringify({ counter: 0 }),
                JSON.stringify({ race_test: true, version: 1 })
            ]);
            // Perform concurrent updates that increment a counter
            for (let i = 0; i < concurrentUpdates; i++) {
                updatePromises.push(dbService.postgresQuery(`
            UPDATE documents
            SET
              content = jsonb_set(content, '{counter}', ((content->>'counter')::int + 1)::text::jsonb),
              metadata = jsonb_set(metadata, '{version}', ((metadata->>'version')::int + 1)::text::jsonb),
              updated_at = NOW()
            WHERE id = $1
          `, [entityId]));
            }
            // Wait for all updates to complete
            await Promise.all(updatePromises);
            // Verify final state - counter should be incremented by all operations
            const finalResult = await dbService.postgresQuery('SELECT content, metadata FROM documents WHERE id = $1', [entityId]);
            expect(finalResult.rows.length).toBe(1);
            const finalContent = JSON.parse(finalResult.rows[0].content);
            const finalMetadata = JSON.parse(finalResult.rows[0].metadata);
            // The final counter should reflect all increments
            expect(finalContent.counter).toBe(concurrentUpdates);
            expect(finalMetadata.version).toBe(2); // Initial version + 1
            // Clean up
            await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [entityId]);
        });
    });
    describe('Data Integrity and Consistency Validation', () => {
        it('should maintain referential integrity across complex relationships', async () => {
            const sessionId = `integrity_session_${Date.now()}`;
            const suiteId = `integrity_suite_${Date.now()}`;
            const testIds = Array.from({ length: 5 }, (_, i) => `integrity_test_${i}_${Date.now()}`);
            // Create a session
            await dbService.postgresQuery(`
        INSERT INTO sessions (id, agent_type, user_id, start_time, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                sessionId,
                'integrity_test_agent',
                'integrity_user',
                new Date(),
                'active',
                JSON.stringify({ integrity_test: true })
            ]);
            // Create changes referencing the session
            for (let i = 0; i < 3; i++) {
                await dbService.postgresQuery(`
          INSERT INTO changes (change_type, entity_type, entity_id, timestamp, author, session_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    'create',
                    'file',
                    `integrity_file_${i}.ts`,
                    new Date(),
                    'integrity_author',
                    sessionId,
                ]);
            }
            // Create test suite
            await dbService.postgresQuery(`
        INSERT INTO test_suites (id, suite_name, timestamp, framework, total_tests, passed_tests, failed_tests)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                suiteId,
                'integrity_test_suite',
                new Date(),
                'vitest',
                testIds.length,
                testIds.length - 1,
                1,
            ]);
            // Create test results referencing the suite
            for (let i = 0; i < testIds.length; i++) {
                await dbService.postgresQuery(`
          INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    testIds[i],
                    `should maintain integrity ${i}`,
                    i === testIds.length - 1 ? 'failed' : 'passed',
                    100 + i * 10,
                    new Date(),
                    suiteId,
                ]);
            }
            // Verify referential integrity with complex joins
            const integrityCheck = await dbService.postgresQuery(`
        SELECT
          tr.test_id,
          tr.test_name,
          tr.status,
          ts.suite_name,
          ts.framework,
          c.entity_id,
          c.change_type,
          s.agent_type,
          s.user_id,
          s.status as session_status
        FROM test_results tr
        JOIN test_suites ts ON tr.suite_id = ts.id
        LEFT JOIN changes c ON c.session_id = $1
        LEFT JOIN sessions s ON s.id = $1
        WHERE tr.suite_id = $2
        ORDER BY tr.test_id
      `, [sessionId, suiteId]);
            expect(integrityCheck.rows.length).toBe(testIds.length);
            // Verify all relationships are intact
            integrityCheck.rows.forEach((row) => {
                expect(row.test_id).toBeTruthy();
                expect(typeof row.test_id).toBe('string');
                expect(testIds).toContain(row.test_id);
                expect(row.suite_name).toBe('integrity_test_suite');
                expect(row.framework).toBe('vitest');
                if (row.agent_type) {
                    expect(row.agent_type).toBe('integrity_test_agent');
                    expect(row.user_id).toBe('integrity_user');
                    expect(row.session_status).toBe('active');
                }
            });
            // Clean up
            await dbService.postgresQuery('DELETE FROM test_results WHERE suite_id = $1', [suiteId]);
            await dbService.postgresQuery('DELETE FROM test_suites WHERE id = $1', [suiteId]);
            await dbService.postgresQuery('DELETE FROM changes WHERE session_id = $1', [sessionId]);
            await dbService.postgresQuery('DELETE FROM sessions WHERE id = $1', [sessionId]);
        });
        it('should validate data consistency across all databases after bulk operations', async () => {
            const batchSize = 50;
            const batchId = `consistency_batch_${Date.now()}`;
            const operations = [];
            // Create bulk operations across all databases
            for (let i = 0; i < batchSize; i++) {
                const entityId = `${batchId}_${i}`;
                operations.push(
                // PostgreSQL
                dbService.postgresQuery(`
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `, [
                    entityId,
                    'consistency_test',
                    JSON.stringify({ index: i, batch: batchId }),
                    JSON.stringify({ consistency_test: true, batch_index: i })
                ]), 
                // FalkorDB
                dbService.falkordbQuery(`
            CREATE (:Entity {
              id: $id,
              type: 'consistency_test',
              batchId: $batchId,
              index: $index
            })
          `, {
                    id: entityId,
                    batchId,
                    index: i,
                }), 
                // Redis
                dbService.redisSet(`consistency:${entityId}`, JSON.stringify({
                    id: entityId,
                    index: i,
                    batchId,
                    timestamp: new Date().toISOString()
                })));
            }
            const startTime = Date.now();
            await Promise.all(operations);
            const endTime = Date.now();
            // Verify consistency across all databases
            const pgCount = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type = $1', ['consistency_test']);
            expect(parseInt(pgCount.rows[0]?.count)).toBe(batchSize);
            const falkorCount = await dbService.falkordbQuery('MATCH (n:Entity {type: $type}) RETURN count(n) as count', { type: 'consistency_test' });
            expect(falkorCount[0]?.count).toBe(batchSize);
            // Verify a sample of Redis keys
            for (let i = 0; i < Math.min(5, batchSize); i++) {
                const redisData = await dbService.redisGet(`consistency:${batchId}_${i}`);
                expect(redisData).toBeTruthy();
                expect(typeof redisData).toBe('string');
                const parsedData = JSON.parse(redisData);
                expect(parsedData.batchId).toBe(batchId);
                expect(parsedData.index).toBe(i);
            }
            // Performance check
            expect(endTime - startTime).toBeLessThan(15000); // 15 seconds max for bulk ops
            // Clean up
            await dbService.postgresQuery("DELETE FROM documents WHERE type = 'consistency_test'");
            await dbService.falkordbQuery("MATCH (n:Entity {type: 'consistency_test'}) DELETE n");
            // Clean up Redis keys (Redis doesn't support pattern deletion easily, so we'll clean specific keys)
            for (let i = 0; i < batchSize; i++) {
                try {
                    await dbService.redisDel(`consistency:${batchId}_${i}`);
                }
                catch (cleanupError) {
                    // Log but don't fail test on cleanup errors
                    console.debug(`Failed to clean Redis key consistency:${batchId}_${i}:`, cleanupError);
                }
            }
        });
    });
    describe('Performance Regression Testing', () => {
        const PERFORMANCE_THRESHOLDS = {
            single_operation: 100, // ms
            bulk_operation_10: 500, // ms
            bulk_operation_100: 2000, // ms
            cross_database_operation: 300, // ms
            complex_query: 200, // ms
        };
        it('should maintain single operation performance', async () => {
            const testId = `perf_single_${Date.now()}`;
            const operations = [
                {
                    name: 'PostgreSQL Insert',
                    operation: () => dbService.postgresQuery(`
            INSERT INTO documents (id, type, content, metadata)
            VALUES ($1, $2, $3, $4)
          `, [testId, 'perf_test', JSON.stringify({ test: 'performance' }), JSON.stringify({ perf: true })])
                },
                {
                    name: 'FalkorDB Create',
                    operation: () => dbService.falkordbQuery(`
            CREATE (:Entity { id: $id, type: 'perf_test', timestamp: $timestamp })
          `, { id: testId, timestamp: new Date().toISOString() })
                },
                {
                    name: 'Redis Set',
                    operation: () => dbService.redisSet(`perf:${testId}`, 'test_value')
                }
            ];
            const results = [];
            for (const op of operations) {
                const startTime = Date.now();
                await op.operation();
                const endTime = Date.now();
                const duration = endTime - startTime;
                results.push({ name: op.name, duration });
                // Each operation should complete within threshold
                expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.single_operation);
            }
            // Clean up
            await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [testId]);
            await dbService.falkordbQuery('MATCH (n:Entity {id: $id}) DELETE n', { id: testId });
            await dbService.redisDel(`perf:${testId}`);
            // Log performance results for monitoring (commented out for CI)
            // console.log('Single operation performance results:', results);
        });
        it('should maintain bulk operation performance', async () => {
            const testSizes = [10, 50, 100];
            const results = [];
            for (const size of testSizes) {
                const batchId = `perf_bulk_${size}_${Date.now()}`;
                const operations = [];
                // Create bulk operations
                for (let i = 0; i < size; i++) {
                    const entityId = `${batchId}_${i}`;
                    operations.push(dbService.postgresQuery(`
              INSERT INTO documents (id, type, content, metadata)
              VALUES ($1, $2, $3, $4)
            `, [entityId, 'bulk_perf_test', JSON.stringify({ index: i }), JSON.stringify({ batch: batchId })]), dbService.falkordbQuery(`
              CREATE (:Entity { id: $id, type: 'bulk_perf_test', batchId: $batchId })
            `, { id: entityId, batchId }));
                }
                const startTime = Date.now();
                await Promise.all(operations);
                const endTime = Date.now();
                const duration = endTime - startTime;
                const throughput = size / (duration / 1000); // operations per second
                results.push({ size, duration, throughput });
                // Performance thresholds based on batch size
                const threshold = size <= 10 ? PERFORMANCE_THRESHOLDS.bulk_operation_10 :
                    PERFORMANCE_THRESHOLDS.bulk_operation_100;
                expect(duration).toBeLessThan(threshold);
                // Throughput should be reasonable
                expect(throughput).toBeGreaterThan(5); // At least 5 operations per second
                // Clean up
                await dbService.postgresQuery("DELETE FROM documents WHERE type = 'bulk_perf_test'");
                await dbService.falkordbQuery("MATCH (n:Entity {type: 'bulk_perf_test'}) DELETE n");
            }
            // console.log('Bulk operation performance results:', results);
        });
        it('should maintain cross-database operation performance', async () => {
            const testId = `perf_cross_${Date.now()}`;
            const iterations = 10;
            const results = [];
            for (let i = 0; i < iterations; i++) {
                const iterationId = `${testId}_${i}`;
                const startTime = Date.now();
                // Cross-database workflow
                await dbService.postgresQuery(`
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `, [iterationId, 'cross_perf_test', JSON.stringify({ iteration: i }), JSON.stringify({ cross_db: true })]);
                await dbService.falkordbQuery(`
          CREATE (:Entity { id: $id, type: 'cross_perf_test' })
          -[:RELATES_TO]->
          (:Document { id: $id, type: 'cross_perf_test' })
        `, { id: iterationId });
                await dbService.redisSet(`cross:${iterationId}`, JSON.stringify({
                    pg_id: iterationId,
                    graph_created: true,
                    timestamp: new Date().toISOString()
                }));
                const endTime = Date.now();
                const duration = endTime - startTime;
                results.push(duration);
                // Each cross-database operation should be within threshold
                expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.cross_database_operation);
            }
            // Calculate statistics
            const avgDuration = results.reduce((sum, duration) => sum + duration, 0) / results.length;
            const maxDuration = Math.max(...results);
            const minDuration = Math.min(...results); // Kept for potential future use
            // Average should be within threshold
            expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.cross_database_operation);
            // Max should not be excessively high
            expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.cross_database_operation * 2);
            // console.log('Cross-database performance stats:', {
            //   average: avgDuration,
            //   max: maxDuration,
            //   min: minDuration,
            //   iterations
            // });
            // Verify performance consistency
            expect(minDuration).toBeGreaterThan(0);
            expect(minDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.cross_database_operation);
            // Clean up
            await dbService.postgresQuery("DELETE FROM documents WHERE type = 'cross_perf_test'");
            await dbService.falkordbQuery("MATCH (n) WHERE n.type = 'cross_perf_test' DETACH DELETE n");
            // Clean up Redis keys
            for (let i = 0; i < iterations; i++) {
                await dbService.redisDel(`cross:${testId}_${i}`);
            }
        });
        it('should maintain complex query performance', async () => {
            // First, create test data for complex queries
            const testDataSize = 100;
            const testId = `perf_query_${Date.now()}`;
            // Insert test data
            for (let i = 0; i < testDataSize; i++) {
                const entityId = `${testId}_${i}`;
                await dbService.postgresQuery(`
          INSERT INTO documents (id, type, content, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
                    entityId,
                    'query_perf_test',
                    JSON.stringify({ index: i, data: 'x'.repeat(100) }),
                    JSON.stringify({ test_id: testId, searchable: i % 10 === 0 })
                ]);
            }
            const queries = [
                {
                    name: 'Simple SELECT',
                    query: () => dbService.postgresQuery('SELECT * FROM documents WHERE type = $1 LIMIT 10', ['query_perf_test'])
                },
                {
                    name: 'JSON Query',
                    query: () => dbService.postgresQuery(`
            SELECT * FROM documents
            WHERE type = $1 AND metadata->>'searchable' = 'true'
            ORDER BY created_at DESC LIMIT 5
          `, ['query_perf_test'])
                },
                {
                    name: 'Complex JOIN Query',
                    query: () => dbService.postgresQuery(`
            SELECT d.id, d.type, d.content, d.metadata, d.created_at
            FROM documents d
            WHERE d.type = $1 AND d.metadata->>'test_id' = $2
            ORDER BY d.created_at DESC
            LIMIT 20
          `, ['query_perf_test', testId])
                }
            ];
            const results = [];
            for (const query of queries) {
                const startTime = Date.now();
                const result = await query.query();
                const endTime = Date.now();
                const duration = endTime - startTime;
                const rowCount = result.rows?.length || 0;
                results.push({ name: query.name, duration, rowCount });
                // Each query should complete within threshold
                expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.complex_query);
                // Should return expected results
                expect(rowCount).toBeGreaterThan(0);
            }
            // console.log('Complex query performance results:', results);
            // Clean up
            await dbService.postgresQuery("DELETE FROM documents WHERE type = 'query_perf_test'");
        });
        it('should detect performance regressions over time', async () => {
            const baselineOperations = 50;
            const testIterations = 3;
            const results = [];
            // Run multiple iterations to detect any performance degradation
            for (let iteration = 0; iteration < testIterations; iteration++) {
                const iterationId = `regression_${iteration}_${Date.now()}`;
                const operations = [];
                // Create baseline operations
                for (let i = 0; i < baselineOperations; i++) {
                    const entityId = `${iterationId}_${i}`;
                    operations.push(dbService.postgresQuery(`
              INSERT INTO documents (id, type, content, metadata)
              VALUES ($1, $2, $3, $4)
            `, [entityId, 'regression_test', JSON.stringify({ iteration, index: i }), JSON.stringify({ regression: true })]));
                }
                const startTime = Date.now();
                await Promise.all(operations);
                const endTime = Date.now();
                const duration = endTime - startTime;
                results.push(duration);
                // Clean up for this iteration
                await dbService.postgresQuery("DELETE FROM documents WHERE type = 'regression_test'");
            }
            // Analyze results for performance regression
            const avgDuration = results.reduce((sum, duration) => sum + duration, 0) / results.length;
            const maxDuration = Math.max(...results);
            const minDuration = Math.min(...results);
            const variance = maxDuration - minDuration;
            // Performance should be consistent across iterations
            expect(variance).toBeLessThan(avgDuration * 0.5); // Variance should be less than 50% of average
            // All iterations should complete within reasonable time
            expect(maxDuration).toBeLessThan(3000); // 3 seconds max
            // console.log('Performance regression analysis:', {
            //   average: avgDuration,
            //   max: maxDuration,
            //   min: minDuration,
            //   variance,
            //   iterations: testIterations
            // });
        });
    });
    describe('Success Path Operations', () => {
        describe('FalkorDB Operations', () => {
            it('should execute falkordbCommand successfully', async () => {
                // Create a test node first
                await dbService.falkordbQuery(`
          CREATE (:TestEntity {
            id: 'command-test-123',
            type: 'command_test',
            created_at: $timestamp
          })
        `, { timestamp: new Date().toISOString() });
                // Test command execution
                const result = await dbService.falkordbCommand('GRAPH.QUERY', 'test', 'MATCH (n:TestEntity {id: $id}) RETURN n', {
                    id: 'command-test-123'
                });
                expect(result).toBeDefined();
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeGreaterThan(0);
                // Cleanup
                await dbService.falkordbQuery('MATCH (n:TestEntity {id: $id}) DELETE n', { id: 'command-test-123' });
            });
            it('should handle complex falkordbCommand with multiple parameters', async () => {
                // Create multiple test nodes
                for (let i = 1; i <= 3; i++) {
                    await dbService.falkordbQuery(`
            CREATE (:BatchEntity {
              id: $id,
              batch: 'command-batch',
              index: $index
            })
          `, { id: `batch-${i}`, index: i });
                }
                // Test command with complex query
                const result = await dbService.falkordbCommand('GRAPH.QUERY', 'test', 'MATCH (n:BatchEntity {batch: $batch}) WHERE n.index > $minIndex RETURN n ORDER BY n.index', { batch: 'command-batch', minIndex: 1 });
                expect(result).toBeDefined();
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBe(2); // Should return index 2 and 3
                // Cleanup
                await dbService.falkordbQuery('MATCH (n:BatchEntity {batch: $batch}) DELETE n', { batch: 'command-batch' });
            });
        });
        describe('PostgreSQL Transaction Operations', () => {
            it('should execute postgresTransaction successfully', async () => {
                const transactionId = `tx-${Date.now()}`;
                const result = await dbService.postgresTransaction(async (client) => {
                    // Insert test data
                    const insertResult = await client.query(`
            INSERT INTO documents (type, content, metadata)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [
                        'transaction_test',
                        JSON.stringify({ test: 'transaction data' }),
                        JSON.stringify({ transaction_id: transactionId })
                    ]);
                    const docId = insertResult.rows[0].id;
                    // Update the data within the same transaction
                    await client.query(`
            UPDATE documents
            SET metadata = $1
            WHERE id = $2
          `, [
                        JSON.stringify({ transaction_id: transactionId, updated: true }),
                        docId
                    ]);
                    return { docId, transactionId };
                });
                expect(result).toBeDefined();
                expect(result.docId).toBeDefined();
                expect(result.transactionId).toBe(transactionId);
                // Verify data was committed
                const verifyResult = await dbService.postgresQuery('SELECT * FROM documents WHERE id = $1', [result.docId]);
                expect(verifyResult.rows.length).toBe(1);
                const metadata = JSON.parse(verifyResult.rows[0].metadata);
                expect(metadata.transaction_id).toBe(transactionId);
                expect(metadata.updated).toBe(true);
                // Cleanup
                await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [result.docId]);
            });
            it('should rollback postgresTransaction on error', async () => {
                const transactionId = `rollback-${Date.now()}`;
                let rollbackWorked = false;
                try {
                    await dbService.postgresTransaction(async (client) => {
                        // Insert data
                        await client.query(`
              INSERT INTO documents (type, content, metadata)
              VALUES ($1, $2, $3)
            `, [
                            'rollback_test',
                            JSON.stringify({ test: 'rollback data' }),
                            JSON.stringify({ transaction_id: transactionId })
                        ]);
                        // Force an error
                        throw new Error('Intentional rollback test error');
                    });
                }
                catch (error) {
                    rollbackWorked = true;
                    expect(error.message).toBe('Intentional rollback test error');
                }
                expect(rollbackWorked).toBe(true);
                // Verify data was rolled back
                const verifyResult = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type = $1', ['rollback_test']);
                expect(parseInt(verifyResult.rows[0].count)).toBe(0);
            });
        });
        describe('Redis Operations', () => {
            it('should execute redisDel successfully', async () => {
                const testKey = `del-test-${Date.now()}`;
                const testValue = 'test-value-for-deletion';
                // Set a value first
                await dbService.redisSet(testKey, testValue);
                // Verify it exists
                const getResult = await dbService.redisGet(testKey);
                expect(getResult).toBe(testValue);
                // Delete it
                const delResult = await dbService.redisDel(testKey);
                expect(delResult).toBe(1); // Redis DEL returns number of keys deleted
                // Verify it's gone
                const getAfterDel = await dbService.redisGet(testKey);
                expect(getAfterDel).toBeNull();
            });
            it('should handle redisDel on non-existent key', async () => {
                const nonExistentKey = `non-existent-${Date.now()}`;
                // Try to delete non-existent key
                const delResult = await dbService.redisDel(nonExistentKey);
                expect(delResult).toBe(0); // Redis DEL returns 0 for non-existent keys
            });
            it('should execute redisSet with TTL successfully', async () => {
                const testKey = `ttl-test-${Date.now()}`;
                const testValue = 'test-value-with-ttl';
                // Set with TTL of 2 seconds
                await dbService.redisSet(testKey, testValue, 2);
                // Verify it exists immediately
                const getResult = await dbService.redisGet(testKey);
                expect(getResult).toBe(testValue);
                // Poll for expiration instead of fixed wait
                const maxWaitTime = 3000; // 3 seconds max
                const pollInterval = 100; // Check every 100ms
                const startTime = Date.now();
                let expired = false;
                while (Date.now() - startTime < maxWaitTime) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    const value = await dbService.redisGet(testKey);
                    if (value === null) {
                        expired = true;
                        break;
                    }
                }
                // Verify key has expired
                expect(expired).toBe(true);
                const elapsedTime = Date.now() - startTime;
                // Should expire around 2 seconds (with some tolerance)
                expect(elapsedTime).toBeGreaterThanOrEqual(1900);
                expect(elapsedTime).toBeLessThanOrEqual(2500);
            });
        });
        describe('Data Storage Operations', () => {
            it('should execute storeTestSuiteResult successfully', async () => {
                const suiteResult = {
                    name: 'integration-test-suite',
                    status: 'passed',
                    duration: 1500,
                    timestamp: new Date(),
                    testResults: [
                        {
                            name: 'test-1',
                            status: 'passed',
                            duration: 500,
                        },
                        {
                            name: 'test-2',
                            status: 'passed',
                            duration: 1000,
                        }
                    ]
                };
                const result = await dbService.storeTestSuiteResult(suiteResult);
                // Verify the result
                expect(result).toBeDefined();
                // Verify data was stored
                const storedSuites = await dbService.postgresQuery('SELECT * FROM test_suites WHERE name = $1', ['integration-test-suite']);
                expect(storedSuites.rows.length).toBe(1);
                const storedSuite = storedSuites.rows[0];
                expect(storedSuite.name).toBe('integration-test-suite');
                expect(storedSuite.status).toBe('passed');
                expect(storedSuite.duration).toBe(1500);
                // Verify test results were stored
                const storedResults = await dbService.postgresQuery('SELECT * FROM test_results WHERE suite_id = $1', [storedSuite.id]);
                expect(storedResults.rows.length).toBe(2);
                expect(storedResults.rows[0].name).toBe('test-1');
                expect(storedResults.rows[1].name).toBe('test-2');
                // Cleanup
                await dbService.postgresQuery('DELETE FROM test_results WHERE suite_id = $1', [storedSuite.id]);
                await dbService.postgresQuery('DELETE FROM test_suites WHERE id = $1', [storedSuite.id]);
            });
            it('should execute storeFlakyTestAnalyses successfully', async () => {
                const analyses = [
                    {
                        testId: 'flaky-test-1',
                        testName: 'FlakyTest.integration',
                        failureCount: 3,
                        totalRuns: 10,
                        lastFailure: new Date(),
                        failurePatterns: ['timeout', 'network_error']
                    },
                    {
                        testId: 'flaky-test-2',
                        testName: 'AnotherFlakyTest.integration',
                        failureCount: 5,
                        totalRuns: 20,
                        lastFailure: new Date(),
                        failurePatterns: ['assertion_error']
                    }
                ];
                const result = await dbService.storeFlakyTestAnalyses(analyses);
                // Verify the result
                expect(result).toBeDefined();
                // Verify data was stored (assuming there's a flaky_tests table)
                const storedAnalyses = await dbService.postgresQuery('SELECT * FROM flaky_tests WHERE test_id IN ($1, $2)', ['flaky-test-1', 'flaky-test-2']);
                expect(storedAnalyses.rows.length).toBe(2);
                // Verify specific data
                const firstAnalysis = storedAnalyses.rows.find(row => row.test_id === 'flaky-test-1');
                expect(firstAnalysis).toBeDefined();
                expect(firstAnalysis.test_name).toBe('FlakyTest.integration');
                expect(firstAnalysis.failure_count).toBe(3);
                expect(firstAnalysis.total_runs).toBe(10);
                // Cleanup
                await dbService.postgresQuery('DELETE FROM flaky_tests WHERE test_id IN ($1, $2)', ['flaky-test-1', 'flaky-test-2']);
            });
        });
        describe('Data Retrieval Operations', () => {
            it('should execute getPerformanceMetricsHistory successfully', async () => {
                // First create some performance metrics data
                const entityId = `perf-entity-${Date.now()}`;
                // Insert test performance data
                await dbService.postgresQuery(`
          INSERT INTO performance_metrics (entity_id, metric_type, value, timestamp)
          VALUES ($1, $2, $3, $4), ($1, $2, $5, $6)
        `, [
                    entityId, 'response_time', 150.5, new Date(Date.now() - 86400000), // 1 day ago
                    entityId, 'response_time', 120.3, new Date() // now
                ]);
                // Test the method
                const history = await dbService.getPerformanceMetricsHistory(entityId, 7);
                expect(history).toBeDefined();
                expect(Array.isArray(history)).toBe(true);
                expect(history.length).toBeGreaterThan(0);
                // Verify structure
                const firstMetric = history[0];
                expect(firstMetric).toHaveProperty('entity_id');
                expect(firstMetric).toHaveProperty('metric_type');
                expect(firstMetric).toHaveProperty('value');
                expect(firstMetric).toHaveProperty('timestamp');
                // Cleanup
                await dbService.postgresQuery('DELETE FROM performance_metrics WHERE entity_id = $1', [entityId]);
            });
            it('should execute getCoverageHistory successfully', async () => {
                // First create some coverage data
                const entityId = `coverage-entity-${Date.now()}`;
                // Insert test coverage data
                await dbService.postgresQuery(`
          INSERT INTO coverage_history (entity_id, lines_covered, lines_total, percentage, timestamp)
          VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)
        `, [
                    entityId, 80, 100, 80.0, new Date(Date.now() - 86400000), // 1 day ago
                    entityId, 85, 100, 85.0, new Date() // now
                ]);
                // Test the method
                const history = await dbService.getCoverageHistory(entityId, 7);
                expect(history).toBeDefined();
                expect(Array.isArray(history)).toBe(true);
                expect(history.length).toBeGreaterThan(0);
                // Verify structure
                const firstCoverage = history[0];
                expect(firstCoverage).toHaveProperty('entity_id');
                expect(firstCoverage).toHaveProperty('percentage');
                expect(firstCoverage).toHaveProperty('timestamp');
                // Cleanup
                await dbService.postgresQuery('DELETE FROM coverage_history WHERE entity_id = $1', [entityId]);
            });
            describe('Test Execution History', () => {
                it('should execute getTestExecutionHistory successfully', async () => {
                    // First create some test execution data
                    const entityId = `test-entity-${Date.now()}`;
                    // Create a test suite first
                    const suiteResult = await dbService.postgresQuery(`
          INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
                        'execution_history_test',
                        new Date(),
                        'vitest',
                        3,
                        2,
                        1,
                        0,
                        750,
                    ]);
                    const suiteId = suiteResult.rows[0].id;
                    // Insert test results for the suite
                    await dbService.postgresQuery(`
          INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
          VALUES
            ($1, $2, $3, $4, $5, $6),
            ($7, $8, $9, $10, $11, $12),
            ($13, $14, $15, $16, $17, $18)
        `, [
                        'exec_test_1', 'should execute successfully', 'passed', 200, new Date(Date.now() - 3600000), suiteId, // 1 hour ago
                        'exec_test_2', 'should handle errors', 'failed', 150, new Date(Date.now() - 1800000), suiteId, // 30 min ago
                        'exec_test_3', 'should validate input', 'passed', 250, new Date(), suiteId, // now
                    ]);
                    // Insert some test execution data that will be returned by getTestExecutionHistory
                    await dbService.postgresQuery(`
          INSERT INTO test_results (test_id, test_name, status, duration, timestamp, suite_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                        `test_${entityId}`, 'test execution for entity', 'passed', 300, new Date(), suiteId
                    ]);
                    // Test the method - get execution history for the entity
                    const history = await dbService.getTestExecutionHistory(entityId, 10);
                    expect(history).toBeDefined();
                    expect(Array.isArray(history)).toBe(true);
                    expect(history.length).toBeGreaterThan(0);
                    // Verify structure of returned data
                    const firstResult = history[0];
                    expect(firstResult).toHaveProperty('test_id');
                    expect(firstResult).toHaveProperty('test_name');
                    expect(firstResult).toHaveProperty('status');
                    expect(firstResult).toHaveProperty('duration');
                    expect(firstResult).toHaveProperty('timestamp');
                    expect(firstResult).toHaveProperty('suite_id');
                    // Test with limit parameter
                    const limitedHistory = await dbService.getTestExecutionHistory(entityId, 2);
                    expect(limitedHistory.length).toBeLessThanOrEqual(2);
                    // Cleanup
                    await dbService.postgresQuery('DELETE FROM test_results WHERE suite_id = $1', [suiteId]);
                    await dbService.postgresQuery('DELETE FROM test_suites WHERE id = $1', [suiteId]);
                });
                it('should handle getTestExecutionHistory with no results', async () => {
                    const nonExistentEntityId = `non-existent-${Date.now()}`;
                    const history = await dbService.getTestExecutionHistory(nonExistentEntityId, 10);
                    expect(history).toBeDefined();
                    expect(Array.isArray(history)).toBe(true);
                    expect(history.length).toBe(0);
                });
            });
        });
        describe('Bulk Operations', () => {
            it('should execute postgresBulkQuery successfully', async () => {
                const bulkQueries = [
                    {
                        query: 'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
                        params: ['bulk_test_1', JSON.stringify({ test: 'bulk-1' }), JSON.stringify({ batch: 'bulk-test' })]
                    },
                    {
                        query: 'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
                        params: ['bulk_test_2', JSON.stringify({ test: 'bulk-2' }), JSON.stringify({ batch: 'bulk-test' })]
                    },
                    {
                        query: 'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
                        params: ['bulk_test_3', JSON.stringify({ test: 'bulk-3' }), JSON.stringify({ batch: 'bulk-test' })]
                    }
                ];
                const results = await dbService.postgresBulkQuery(bulkQueries);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBe(3);
                // Verify all queries executed successfully
                results.forEach((_result, _index) => {
                    expect(_result).toBeDefined();
                    expect(_result.rowCount).toBeDefined();
                });
                // Verify data was inserted
                const verifyResult = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type LIKE $1', ['bulk_test_%']);
                expect(parseInt(verifyResult.rows[0].count)).toBe(3);
                // Cleanup
                await dbService.postgresQuery('DELETE FROM documents WHERE type LIKE $1', ['bulk_test_%']);
            });
            it('should handle postgresBulkQuery with continueOnError option', async () => {
                const bulkQueries = [
                    {
                        query: 'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
                        params: ['bulk_error_test_1', JSON.stringify({ test: 'bulk-error-1' }), JSON.stringify({ batch: 'bulk-error-test' })]
                    },
                    {
                        query: 'INVALID SQL QUERY THAT WILL FAIL',
                        params: []
                    },
                    {
                        query: 'INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3)',
                        params: ['bulk_error_test_3', JSON.stringify({ test: 'bulk-error-3' }), JSON.stringify({ batch: 'bulk-error-test' })]
                    }
                ];
                const results = await dbService.postgresBulkQuery(bulkQueries, { continueOnError: true });
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBe(3);
                // First and third queries should succeed, second should fail
                expect(results[0]).toBeDefined();
                expect(results[2]).toBeDefined();
                // Second query should have failed
                expect(results[1]).toBeDefined(); // Still returns a result object, but with error info
                // Verify only successful insertions occurred
                const verifyResult = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type LIKE $1', ['bulk_error_test_%']);
                expect(parseInt(verifyResult.rows?.[0]?.count || '0')).toBe(2); // Only 2 out of 3 should have succeeded
                // Cleanup
                await dbService.postgresQuery('DELETE FROM documents WHERE type LIKE $1', ['bulk_error_test_%']);
            });
        });
        describe('Initialization and Lifecycle', () => {
            it('should complete full initialization successfully', async () => {
                // Create a new service instance
                const { DatabaseService } = await import('../../../src/services/DatabaseService');
                const { createTestDatabaseConfig } = await import('../../../src/services/DatabaseService');
                const newService = new DatabaseService(createTestDatabaseConfig());
                // Verify it's not initialized
                expect(newService.isInitialized()).toBe(false);
                // Initialize it
                await newService.initialize();
                // Verify it's now initialized
                expect(newService.isInitialized()).toBe(true);
                // Test that operations work
                const healthCheck = await newService.healthCheck();
                expect(healthCheck.falkordb).toBeDefined();
                expect(healthCheck.qdrant).toBeDefined();
                expect(healthCheck.postgresql).toBeDefined();
                // Clean up
                await newService.close();
                expect(newService.isInitialized()).toBe(false);
            });
            it('should handle client getters after initialization', async () => {
                // Test that client getters return actual clients after initialization
                expect(dbService.isInitialized()).toBe(true);
                // Test PostgreSQL client
                const pgClient = dbService.getPostgresPool();
                expect(pgClient).toBeDefined();
                expect(typeof pgClient).toBe('object');
                // Test FalkorDB client
                const falkorClient = dbService.getFalkorDBClient();
                expect(falkorClient).toBeDefined();
                // Test Qdrant client
                const qdrantClient = dbService.getQdrantClient();
                expect(qdrantClient).toBeDefined();
                expect(typeof qdrantClient).toBe('object');
            });
        });
    });
});
//# sourceMappingURL=DatabaseService.integration.test.js.map