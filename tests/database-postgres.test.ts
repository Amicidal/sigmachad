/**
 * PostgreSQL Database Operations Tests
 * Tests CRUD operations and data management for PostgreSQL
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('PostgreSQL Database Operations', () => {
  let dbService: DatabaseService;

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
      id: '550e8400-e29b-41d4-a716-446655440000',
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
      const insertQuery = `
        INSERT INTO documents (id, type, content, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id, type, content, metadata, created_at
      `;

      const result = await dbService.postgresQuery(insertQuery, [
        testDocument.id,
        testDocument.type,
        JSON.stringify(testDocument.content),
        JSON.stringify(testDocument.metadata)
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testDocument.id);
      expect(result.rows[0].type).toBe(testDocument.type);
      expect(result.rows[0].content).toEqual(testDocument.content);
      expect(result.rows[0].metadata).toEqual(testDocument.metadata);
      expect(result.rows[0].created_at).toBeDefined();
    });

    it('should retrieve a document by ID', async () => {
      // First insert the document
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [testDocument.id, testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]
      );

      // Then retrieve it
      const result = await dbService.postgresQuery(
        'SELECT id, type, content, metadata, created_at FROM documents WHERE id = $1',
        [testDocument.id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testDocument.id);
      expect(result.rows[0].type).toBe(testDocument.type);
    });

    it('should update a document', async () => {
      // Insert initial document
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [testDocument.id, testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]
      );

      // Update the document
      const updatedContent = {
        ...testDocument.content,
        title: 'Updated Test Document',
        version: '2.0'
      };

      await dbService.postgresQuery(
        'UPDATE documents SET content = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedContent), testDocument.id]
      );

      // Verify the update
      const result = await dbService.postgresQuery(
        'SELECT content FROM documents WHERE id = $1',
        [testDocument.id]
      );

      expect(result.rows[0].content).toEqual(updatedContent);
    });

    it('should delete a document', async () => {
      // Insert document
      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [testDocument.id, testDocument.type, JSON.stringify(testDocument.content), JSON.stringify(testDocument.metadata)]
      );

      // Delete the document
      const deleteResult = await dbService.postgresQuery(
        'DELETE FROM documents WHERE id = $1',
        [testDocument.id]
      );

      expect(deleteResult.rowCount).toBe(1);

      // Verify it's deleted
      const selectResult = await dbService.postgresQuery(
        'SELECT id FROM documents WHERE id = $1',
        [testDocument.id]
      );

      expect(selectResult.rows).toHaveLength(0);
    });

    it('should query documents by type', async () => {
      // Insert multiple documents
      const docs = [
        { ...testDocument, id: '550e8400-e29b-41d4-a716-446655440001', type: 'test_document' },
        { ...testDocument, id: '550e8400-e29b-41d4-a716-446655440002', type: 'test_document' },
        { id: '550e8400-e29b-41d4-a716-446655440003', type: 'other_type', content: { title: 'Other' }, metadata: {} }
      ];

      for (const doc of docs) {
        await dbService.postgresQuery(
          'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
          [doc.id, doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]
        );
      }

      // Query by type
      const result = await dbService.postgresQuery(
        'SELECT id, type FROM documents WHERE type = $1 ORDER BY created_at DESC',
        ['test_document']
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every(row => row.type === 'test_document')).toBe(true);
    });
  });

  describe('Sessions Table Operations', () => {
    const testSession = {
      id: '660e8400-e29b-41d4-a716-446655440000',
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
        INSERT INTO sessions (id, agent_type, user_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, agent_type, user_id, status, start_time
      `;

      const result = await dbService.postgresQuery(insertQuery, [
        testSession.id,
        testSession.agent_type,
        testSession.user_id,
        testSession.status
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testSession.id);
      expect(result.rows[0].agent_type).toBe(testSession.agent_type);
      expect(result.rows[0].user_id).toBe(testSession.user_id);
      expect(result.rows[0].status).toBe(testSession.status);
      expect(result.rows[0].start_time).toBeDefined();
    });

    it('should end a session', async () => {
      // Create session
      await dbService.postgresQuery(
        'INSERT INTO sessions (id, agent_type, user_id, status) VALUES ($1, $2, $3, $4)',
        [testSession.id, testSession.agent_type, testSession.user_id, testSession.status]
      );

      // End the session
      await dbService.postgresQuery(
        'UPDATE sessions SET status = $1, end_time = NOW() WHERE id = $2',
        ['completed', testSession.id]
      );

      // Verify session ended
      const result = await dbService.postgresQuery(
        'SELECT status, end_time FROM sessions WHERE id = $1',
        [testSession.id]
      );

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
        await dbService.postgresQuery(
          'INSERT INTO test_results (test_id, test_suite, test_name, status, duration, coverage) VALUES ($1, $2, $3, $4, $5, $6)',
          [result.test_id, result.test_suite, result.test_name, result.status, result.duration, JSON.stringify(result.coverage)]
        );
      }

      // Query passed tests
      const passedResults = await dbService.postgresQuery(
        'SELECT test_id FROM test_results WHERE status = $1',
        ['passed']
      );

      expect(passedResults.rows).toHaveLength(2);

      // Query failed tests
      const failedResults = await dbService.postgresQuery(
        'SELECT test_id FROM test_results WHERE status = $1',
        ['failed']
      );

      expect(failedResults.rows).toHaveLength(1);
    });

    it('should calculate average test duration', async () => {
      // Insert test results with different durations
      const durations = [100, 200, 150, 300];
      for (let i = 0; i < durations.length; i++) {
        await dbService.postgresQuery(
          'INSERT INTO test_results (test_id, test_suite, test_name, status, duration) VALUES ($1, $2, $3, $4, $5)',
          [`test-duration-${i}`, 'performance-tests', `test-${i}`, 'passed', durations[i]]
        );
      }

      // Calculate average
      const avgResult = await dbService.postgresQuery(
        'SELECT AVG(duration) as avg_duration FROM test_results WHERE test_suite = $1',
        ['performance-tests']
      );

      const expectedAvg = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgResult.rows[0].avg_duration).toBe(expectedAvg);
    });
  });

  describe('Transaction Operations', () => {
    it('should handle transactions correctly', async () => {
      const transactionResult = await dbService.postgresTransaction(async (client) => {
        // Insert a document
        await client.query(
          'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
          ['tx-test-1', 'transaction_test', JSON.stringify({ title: 'Transaction Test' }), JSON.stringify({})]
        );

        // Insert another document
        await client.query(
          'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
          ['tx-test-2', 'transaction_test', JSON.stringify({ title: 'Transaction Test 2' }), JSON.stringify({})]
        );

        // Return count of inserted documents
        const result = await client.query(
          'SELECT COUNT(*) as count FROM documents WHERE type = $1',
          ['transaction_test']
        );

        return result.rows[0].count;
      });

      expect(transactionResult).toBe(2);

      // Verify both documents exist
      const verifyResult = await dbService.postgresQuery(
        'SELECT COUNT(*) as count FROM documents WHERE type = $1',
        ['transaction_test']
      );

      expect(verifyResult.rows[0].count).toBe(2);
    });

    it('should rollback transaction on error', async () => {
      try {
        await dbService.postgresTransaction(async (client) => {
          // Insert first document
          await client.query(
            'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
            ['rollback-test-1', 'rollback_test', JSON.stringify({ title: 'Rollback Test' }), JSON.stringify({})]
          );

          // This will cause an error (duplicate key)
          await client.query(
            'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
            ['rollback-test-1', 'rollback_test', JSON.stringify({ title: 'Duplicate' }), JSON.stringify({})]
          );
        });
      } catch (error) {
        // Expected error
      }

      // Verify no documents were inserted due to rollback
      const result = await dbService.postgresQuery(
        'SELECT COUNT(*) as count FROM documents WHERE type = $1',
        ['rollback_test']
      );

      expect(result.rows[0].count).toBe(0);
    });
  });

  describe('JSON Operations', () => {
    beforeEach(async () => {
      await dbService.postgresQuery('DELETE FROM documents WHERE type = $1', ['json_test']);
    });

    it('should query JSON content', async () => {
      const jsonDoc = {
        id: 'json-test-1',
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

      await dbService.postgresQuery(
        'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
        [jsonDoc.id, jsonDoc.type, JSON.stringify(jsonDoc.content), JSON.stringify(jsonDoc.metadata)]
      );

      // Query by JSON path
      const result = await dbService.postgresQuery(
        "SELECT content->'user'->>'name' as user_name FROM documents WHERE type = $1",
        ['json_test']
      );

      expect(result.rows[0].user_name).toBe('John Doe');
    });

    it('should search JSON content with GIN index', async () => {
      const docs = [
        {
          id: 'search-test-1',
          type: 'json_test',
          content: { title: 'Database Search', tags: ['database', 'search'] },
          metadata: {}
        },
        {
          id: 'search-test-2',
          type: 'json_test',
          content: { title: 'Graph Search', tags: ['graph', 'search'] },
          metadata: {}
        }
      ];

      for (const doc of docs) {
        await dbService.postgresQuery(
          'INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)',
          [doc.id, doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]
        );
      }

      // Search for documents containing 'database' in content
      const searchResult = await dbService.postgresQuery(
        "SELECT id FROM documents WHERE content @> $1",
        [JSON.stringify({ tags: ['database'] })]
      );

      expect(searchResult.rows).toHaveLength(1);
      expect(searchResult.rows[0].id).toBe('search-test-1');
    });
  });
});
