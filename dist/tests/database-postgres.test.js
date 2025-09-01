/**
 * PostgreSQL Database Operations Tests
 * Tests CRUD operations and data management for PostgreSQL
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
describe('PostgreSQL Database Operations', () => {
    let dbService;
    beforeAll(async () => {
        const dbConfig = createDatabaseConfig();
        dbService = new DatabaseService(dbConfig);
        await dbService.initialize();
        await dbService.setupDatabase(); // Ensure schema is created
    }, 30000);
    afterAll(async () => {
        await dbService.close();
    }, 10000);
    describe('Documents Table Operations', () => {
        const testDocument = {
            type: 'test_document',
            content: {
                title: 'Test Document',
                description: 'A test document for database operations',
                tags: ['test', 'database', 'postgres'],
                metadata: {
                    version: '1.0',
                    author: 'Test Suite'
                }
            },
            metadata: {
                source: 'test',
                priority: 'high'
            }
        };
        beforeEach(async () => {
            // Clean up any existing test data
            await dbService.postgresQuery('DELETE FROM documents WHERE type = $1', ['test_document']);
        });
        it('should insert a document', async () => {
            const docId = uuidv4();
            const insertQuery = `
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id, type, content, metadata, created_at
      `;
            const result = await dbService.postgresQuery(insertQuery, [
                docId,
                testDocument.type,
                JSON.stringify(testDocument.content),
                JSON.stringify(testDocument.metadata)
            ]);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].id).toBe(docId);
            expect(result.rows[0].type).toBe(testDocument.type);
            expect(result.rows[0].content).toEqual(testDocument.content);
            expect(result.rows[0].metadata).toEqual(testDocument.metadata);
            expect(result.rows[0].created_at).toBeDefined();
        });
        it('should retrieve a document by ID', async () => {
            // First insert the document
            const insertResult = await dbService.postgresQuery('INSERT INTO documents (type, content, metadata) VALUES ($1, $2, $3) RETURNING id', [testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]);
            const docId = insertResult.rows[0].id;
            // Then retrieve it
            const result = await dbService.postgresQuery('SELECT id, type, content, metadata, created_at FROM documents WHERE id = $1', [docId]);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].id).toBe(docId);
            expect(result.rows[0].type).toBe(testDocument.type);
        });
        it('should update a document', async () => {
            const docId = uuidv4();
            // Insert initial document
            await dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [docId, testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]);
            // Update the document
            const updatedContent = {
                ...testDocument.content,
                title: 'Updated Test Document',
                version: '2.0'
            };
            await dbService.postgresQuery('UPDATE documents SET content = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updatedContent), docId]);
            // Verify the update
            const result = await dbService.postgresQuery('SELECT content FROM documents WHERE id = $1', [docId]);
            expect(result.rows[0].content).toEqual(updatedContent);
        });
        it('should delete a document', async () => {
            const docId = uuidv4();
            // Insert document
            await dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [docId, testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]);
            // Delete the document
            const deleteResult = await dbService.postgresQuery('DELETE FROM documents WHERE id = $1', [docId]);
            expect(deleteResult.rowCount).toBe(1);
            // Verify it's deleted
            const selectResult = await dbService.postgresQuery('SELECT id FROM documents WHERE id = $1', [docId]);
            expect(selectResult.rows).toHaveLength(0);
        });
        it('should query documents by type', async () => {
            // Insert multiple documents
            const docs = [
                { ...testDocument, id: uuidv4(), type: 'test_document' },
                { ...testDocument, id: uuidv4(), type: 'test_document' },
                { id: uuidv4(), type: 'other_type', content: { title: 'Other' }, metadata: {} }
            ];
            for (const doc of docs) {
                await dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [doc.id, doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]);
            }
            // Query by type
            const result = await dbService.postgresQuery('SELECT id, type FROM documents WHERE type = $1 ORDER BY created_at DESC', ['test_document']);
            expect(result.rows).toHaveLength(2);
            expect(result.rows.every((row) => row.type === 'test_document')).toBe(true);
        });
    });
    describe('Sessions Table Operations', () => {
        const testSession = {
            agent_type: 'test_agent',
            user_id: 'user123',
            status: 'active'
        };
        beforeEach(async () => {
            // Clean up existing test data
            await dbService.postgresQuery('DELETE FROM sessions WHERE agent_type = $1', ['test_agent']);
        });
        it('should create a session', async () => {
            const insertQuery = `
        INSERT INTO sessions (agent_type, user_id, status, start_time)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, agent_type, user_id, status, start_time
      `;
            const result = await dbService.postgresQuery(insertQuery, [
                testSession.agent_type,
                testSession.user_id,
                testSession.status
            ]);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].id).toBeDefined();
            expect(result.rows[0].agent_type).toBe(testSession.agent_type);
            expect(result.rows[0].user_id).toBe(testSession.user_id);
            expect(result.rows[0].status).toBe(testSession.status);
            expect(result.rows[0].start_time).toBeDefined();
        });
        it('should end a session', async () => {
            // Create session
            const createResult = await dbService.postgresQuery('INSERT INTO sessions (agent_type, user_id, status, start_time) VALUES ($1, $2, $3, NOW()) RETURNING id', [testSession.agent_type, testSession.user_id, testSession.status]);
            const sessionId = createResult.rows[0].id;
            // End the session
            await dbService.postgresQuery('UPDATE sessions SET status = $1, end_time = NOW() WHERE id = $2', ['completed', sessionId]);
            // Verify session ended
            const result = await dbService.postgresQuery('SELECT status, end_time FROM sessions WHERE id = $1', [sessionId]);
            expect(result.rows[0].status).toBe('completed');
            expect(result.rows[0].end_time).toBeDefined();
        });
    });
    describe('Test Results Table Operations', () => {
        const testResult = {
            test_id: 'test-123',
            test_suite: 'database-tests',
            test_name: 'postgresql-operations',
            status: 'passed',
            duration: 150,
            coverage: { lines: 85, branches: 90, functions: 95 }
        };
        beforeEach(async () => {
            // Clean up existing test data
            await dbService.postgresQuery('DELETE FROM test_results WHERE test_id = $1', ['test-123']);
        });
        it('should insert test results', async () => {
            const insertQuery = `
        INSERT INTO test_results (test_id, test_suite, test_name, status, duration, coverage)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING test_id, test_name, status, duration
      `;
            const result = await dbService.postgresQuery(insertQuery, [
                testResult.test_id,
                testResult.test_suite,
                testResult.test_name,
                testResult.status,
                testResult.duration,
                JSON.stringify(testResult.coverage)
            ]);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].test_id).toBe(testResult.test_id);
            expect(result.rows[0].status).toBe(testResult.status);
            expect(result.rows[0].duration).toBe(testResult.duration);
        });
        it('should query test results by status', async () => {
            // Insert multiple test results
            const results = [
                { ...testResult, test_id: 'test-1', status: 'passed' },
                { ...testResult, test_id: 'test-2', status: 'failed' },
                { ...testResult, test_id: 'test-3', status: 'passed' }
            ];
            for (const result of results) {
                await dbService.postgresQuery('INSERT INTO test_results (test_id, test_suite, test_name, status, duration, coverage) VALUES ($1, $2, $3, $4, $5, $6)', [result.test_id, result.test_suite, result.test_name, result.status, result.duration, JSON.stringify(result.coverage)]);
            }
            // Query passed tests
            const passedResults = await dbService.postgresQuery('SELECT test_id FROM test_results WHERE status = $1', ['passed']);
            expect(passedResults.rows.length).toBeGreaterThanOrEqual(2);
            // Query failed tests
            const failedResults = await dbService.postgresQuery('SELECT test_id FROM test_results WHERE status = $1', ['failed']);
            expect(failedResults.rows.length).toBeGreaterThanOrEqual(1);
        });
        it('should calculate average test duration', async () => {
            // Insert test results with different durations
            const durations = [100, 200, 150, 300];
            for (let i = 0; i < durations.length; i++) {
                await dbService.postgresQuery('INSERT INTO test_results (test_id, test_suite, test_name, status, duration) VALUES ($1, $2, $3, $4, $5)', [`test-duration-${i}`, 'performance-tests', `test-${i}`, 'passed', durations[i]]);
            }
            // Calculate average
            const avgResult = await dbService.postgresQuery('SELECT AVG(duration) as avg_duration FROM test_results WHERE test_suite = $1', ['performance-tests']);
            const expectedAvg = durations.reduce((a, b) => a + b, 0) / durations.length;
            expect(parseFloat(avgResult.rows[0].avg_duration)).toBe(expectedAvg);
        });
    });
    describe('Transaction Operations', () => {
        it('should handle transactions correctly', async () => {
            const transactionResult = await dbService.postgresTransaction(async (client) => {
                const txId1 = uuidv4();
                const txId2 = uuidv4();
                // Insert a document
                await client.query('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [txId1, 'transaction_test', JSON.stringify({ title: 'Transaction Test' }), JSON.stringify({})]);
                // Insert another document
                await client.query('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [txId2, 'transaction_test', JSON.stringify({ title: 'Transaction Test 2' }), JSON.stringify({})]);
                // Return count of inserted documents
                const result = await client.query('SELECT COUNT(*) as count FROM documents WHERE type = $1', ['transaction_test']);
                return result.rows[0].count;
            });
            expect(parseInt(transactionResult)).toBeGreaterThanOrEqual(2);
            // Verify both documents exist
            const verifyResult = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type = $1', ['transaction_test']);
            expect(parseInt(verifyResult.rows[0].count)).toBeGreaterThanOrEqual(2);
        });
        it('should rollback transaction on error', async () => {
            const rollbackId = uuidv4();
            try {
                await dbService.postgresTransaction(async (client) => {
                    // Insert first document
                    await client.query('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [rollbackId, 'rollback_test', JSON.stringify({ title: 'Rollback Test' }), JSON.stringify({})]);
                    // This will cause an error (duplicate key)
                    await client.query('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [rollbackId, 'rollback_test', JSON.stringify({ title: 'Duplicate' }), JSON.stringify({})]);
                });
            }
            catch (error) {
                // Expected error
            }
            // Verify no documents were inserted due to rollback
            const result = await dbService.postgresQuery('SELECT COUNT(*) as count FROM documents WHERE type = $1', ['rollback_test']);
            expect(parseInt(result.rows[0].count)).toBe(0);
        });
    });
    describe('JSON Operations', () => {
        beforeEach(async () => {
            await dbService.postgresQuery('DELETE FROM documents WHERE type = $1', ['json_test']);
        });
        it('should query JSON content', async () => {
            const jsonId = uuidv4();
            const jsonDoc = {
                id: jsonId,
                type: 'json_test',
                content: {
                    user: {
                        name: 'John Doe',
                        preferences: {
                            theme: 'dark',
                            notifications: true
                        }
                    },
                    metadata: {
                        tags: ['user', 'preferences'],
                        version: 1
                    }
                },
                metadata: {}
            };
            await dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [jsonDoc.id, jsonDoc.type, JSON.stringify(jsonDoc.content), JSON.stringify(jsonDoc.metadata)]);
            // Query by JSON path
            const result = await dbService.postgresQuery("SELECT content->'user'->>'name' as user_name FROM documents WHERE type = $1", ['json_test']);
            expect(result.rows[0].user_name).toBe('John Doe');
        });
        it('should search JSON content with GIN index', async () => {
            const searchId1 = uuidv4();
            const searchId2 = uuidv4();
            const docs = [
                {
                    id: searchId1,
                    type: 'json_test',
                    content: { title: 'Database Search', tags: ['database', 'search'] },
                    metadata: {}
                },
                {
                    id: searchId2,
                    type: 'json_test',
                    content: { title: 'Graph Search', tags: ['graph', 'search'] },
                    metadata: {}
                }
            ];
            for (const doc of docs) {
                await dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [doc.id, doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]);
            }
            // Search for documents containing 'database' in content
            const searchResult = await dbService.postgresQuery("SELECT id FROM documents WHERE content @> $1", [JSON.stringify({ tags: ['database'] })]);
            expect(searchResult.rows.length).toBeGreaterThanOrEqual(1);
            expect(searchResult.rows.some((row) => row.id === searchId1)).toBe(true);
        });
    });
});
//# sourceMappingURL=database-postgres.test.js.map