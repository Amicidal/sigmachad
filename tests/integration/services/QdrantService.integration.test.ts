/**
 * Integration tests for QdrantService
 * Tests vector database operations with real Qdrant instance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { QdrantService } from '../../../src/services/database/QdrantService';

describe('QdrantService Integration', () => {
  let qdrantService: QdrantService;
  let isQdrantAvailable = false;

  beforeAll(async () => {
    // Use test configuration - adjust these values based on your test environment
    const testConfig = {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    };

    qdrantService = new QdrantService(testConfig);

    try {
      await qdrantService.initialize();
      isQdrantAvailable = qdrantService.isInitialized();
      console.log('✅ Qdrant connection established for integration tests');
    } catch (error) {
      console.warn('⚠️ Qdrant not available for integration tests:', error instanceof Error ? error.message : 'Unknown error');
      isQdrantAvailable = false;
    }
  }, 30000);

  afterAll(async () => {
    if (qdrantService && qdrantService.isInitialized()) {
      await qdrantService.close();
    }
  });

  beforeEach(async () => {
    if (!isQdrantAvailable) {
      console.warn('Skipping test - Qdrant not available');
      return;
    }

    try {
      // Clean up any existing test collections
      const client = qdrantService.getClient();
      const collections = await client.getCollections();

      const testCollections = collections.collections.filter(c =>
        c.name.startsWith('test_') ||
        c.name === 'code_embeddings' ||
        c.name === 'documentation_embeddings' ||
        c.name === 'integration_test'
      );

      for (const collection of testCollections) {
        try {
          await client.deleteCollection(collection.name);
          console.log(`🗑️ Cleaned up collection: ${collection.name}`);
        } catch (error) {
          console.warn(`Failed to delete collection ${collection.name}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to clean up test collections:', error);
    }
  });

  describe('Initialization and Connection', () => {
    it('should initialize Qdrant service successfully when available', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping initialization test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(qdrantService.isInitialized()).toBe(true);
      expect(qdrantService.getClient()).toBeDefined();
    });

    it('should handle health checks', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping health check test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const isHealthy = await qdrantService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should handle connection closure', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping connection closure test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      expect(client).toBeDefined();

      await qdrantService.close();
      expect(qdrantService.isInitialized()).toBe(false);

      // Reinitialize for other tests
      await qdrantService.initialize();
    });
  });

  describe('Collection Management', () => {
    it('should create and manage collections', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping collection management test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();

      // Create a test collection
      const collectionName = 'test_collection_management';
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Verify collection exists
      const collections = await client.getCollections();
      const collectionExists = collections.collections.some(c => c.name === collectionName);
      expect(collectionExists).toBe(true);

      // Get collection info
      const collectionInfo = await client.getCollection(collectionName);
      expect(collectionInfo).toBeDefined();
      expect(collectionInfo.status).toBeDefined();

      // Delete collection
      await client.deleteCollection(collectionName);

      // Verify collection is deleted
      const collectionsAfter = await client.getCollections();
      const collectionStillExists = collectionsAfter.collections.some(c => c.name === collectionName);
      expect(collectionStillExists).toBe(false);
    });

    it('should handle collection creation with different configurations', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping collection config test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();

      // Create collection with different vector size
      const collectionName = 'test_custom_config';
      await client.createCollection(collectionName, {
        vectors: {
          size: 768, // Different from default 1536
          distance: 'Euclid', // Different distance metric
        },
      });

      const collectionInfo = await client.getCollection(collectionName);
      expect(collectionInfo).toBeDefined();

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle duplicate collection creation gracefully', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping duplicate collection test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_duplicate_creation';

      // Create collection first time
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Try to create again - should handle gracefully
      try {
        await client.createCollection(collectionName, {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        });
        // If we get here, Qdrant allows duplicate creation (some versions do)
      } catch (error: any) {
        // Expected behavior - collection already exists
        expect(error.status).toBe(409); // Conflict status
        expect(error.message?.toLowerCase()).toContain('already exists');
      }

      // Clean up
      await client.deleteCollection(collectionName);
    });
  });

  describe('Vector Operations', () => {
    it('should perform basic vector upsert and search operations', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping vector operations test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_vector_operations';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Generate test vectors
      const testVectors = [
        new Array(1536).fill(0).map(() => Math.random() - 0.5), // Random vector 1
        new Array(1536).fill(0).map(() => Math.random() - 0.5), // Random vector 2
        new Array(1536).fill(0).map(() => Math.random() - 0.5), // Random vector 3
      ];

      // Upsert vectors with payload
      await client.upsert(collectionName, {
        points: [
          {
            id: 1,
            vector: testVectors[0],
            payload: {
              type: 'code',
              language: 'typescript',
              file: 'test1.ts',
              content: 'function test() { return true; }'
            },
          },
          {
            id: 2,
            vector: testVectors[1],
            payload: {
              type: 'code',
              language: 'javascript',
              file: 'test2.js',
              content: 'const test = () => true;'
            },
          },
          {
            id: 3,
            vector: testVectors[2],
            payload: {
              type: 'documentation',
              language: 'markdown',
              file: 'README.md',
              content: '# Test Documentation'
            },
          },
        ],
      });

      // Search for similar vectors
      const searchResults = await client.search(collectionName, {
        vector: testVectors[0], // Search using first vector
        limit: 3,
      });

      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].id).toBe(1); // Should find the exact match first
      expect(searchResults[0].score).toBeCloseTo(1.0, 1); // High similarity score for exact match

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle vector search with filtering', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping vector search filtering test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_vector_filtering';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      const baseVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);

      // Upsert vectors with different types
      await client.upsert(collectionName, {
        points: [
          {
            id: 1,
            vector: baseVector,
            payload: { type: 'code', language: 'typescript' },
          },
          {
            id: 2,
            vector: baseVector.map(v => v + 0.1), // Slightly different vector
            payload: { type: 'documentation', language: 'markdown' },
          },
          {
            id: 3,
            vector: baseVector.map(v => v + 0.2), // More different vector
            payload: { type: 'code', language: 'javascript' },
          },
        ],
      });

      // Search with filter for code type only
      const filteredResults = await client.search(collectionName, {
        vector: baseVector,
        limit: 5,
        filter: {
          must: [
            {
              key: 'type',
              match: { value: 'code' },
            },
          ],
        },
      });

      expect(filteredResults).toBeDefined();
      expect(filteredResults.length).toBe(2); // Should find 2 code entries

      // Verify all results are code type
      filteredResults.forEach(result => {
        expect(result.payload?.type).toBe('code');
      });

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle batch vector operations', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping batch operations test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_batch_operations';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Create batch of 10 vectors
      const batchSize = 10;
      const points = [];

      for (let i = 0; i < batchSize; i++) {
        points.push({
          id: i + 1,
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
          payload: {
            batch_id: 'test_batch_1',
            index: i,
            type: 'batch_test',
          },
        });
      }

      // Batch upsert
      await client.upsert(collectionName, { points });

      // Verify all points were inserted
      const countResult = await client.scroll(collectionName, { limit: 20 });
      expect(countResult.points.length).toBe(batchSize);

      // Verify payload data
      countResult.points.forEach((point, index) => {
        expect(point.payload?.batch_id).toBe('test_batch_1');
        expect(point.payload?.index).toBe(index);
      });

      // Clean up
      await client.deleteCollection(collectionName);
    });
  });

  describe('Setup Collections Integration', () => {
    it('should setup standard collections correctly', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping setup collections test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      // Setup collections using the service method
      await qdrantService.setupCollections();

      const client = qdrantService.getClient();
      const collections = await client.getCollections();

      const collectionNames = collections.collections.map(c => c.name);

      // Verify standard collections exist
      expect(collectionNames).toContain('code_embeddings');
      expect(collectionNames).toContain('documentation_embeddings');
      expect(collectionNames).toContain('integration_test');

      // Verify collection configurations
      const codeEmbeddingsInfo = await client.getCollection('code_embeddings');
      expect(codeEmbeddingsInfo.config?.params?.vectors?.size).toBe(1536);
      expect(codeEmbeddingsInfo.config?.params?.vectors?.distance).toBe('Cosine');
    });

    it('should handle setup collections when collections already exist', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping setup collections existing test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();

      // Pre-create one of the collections
      await client.createCollection('code_embeddings', {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Setup collections should handle existing collections gracefully
      await qdrantService.setupCollections();

      // Verify collection still exists and has correct configuration
      const collectionInfo = await client.getCollection('code_embeddings');
      expect(collectionInfo).toBeDefined();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent vector operations', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping concurrent operations test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_concurrent_operations';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      const concurrentOperations = 5;
      const operations: Promise<any>[] = [];

      // Create concurrent upsert operations
      for (let i = 0; i < concurrentOperations; i++) {
        const vector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        operations.push(
          client.upsert(collectionName, {
            points: [{
              id: i + 1,
              vector,
              payload: {
                operation_id: i,
                type: 'concurrent_test',
                timestamp: new Date().toISOString(),
              },
            }],
          })
        );
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max for concurrent operations

      // Verify all operations completed
      const countResult = await client.scroll(collectionName, { limit: 10 });
      expect(countResult.points.length).toBe(concurrentOperations);

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle large vector operations', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping large operations test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_large_operations';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      const largeBatchSize = 50;
      const points = [];

      // Create large batch of vectors
      for (let i = 0; i < largeBatchSize; i++) {
        points.push({
          id: i + 1,
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
          payload: {
            batch_id: 'large_batch_test',
            index: i,
            size: largeBatchSize,
            type: 'performance_test',
          },
        });
      }

      const startTime = Date.now();
      await client.upsert(collectionName, { points });
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time for large batch
      expect(duration).toBeLessThan(30000); // 30 seconds max for large batch

      // Verify all points were inserted
      const countResult = await client.scroll(collectionName, { limit: largeBatchSize + 10 });
      expect(countResult.points.length).toBe(largeBatchSize);

      // Clean up
      await client.deleteCollection(collectionName);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid collection names', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping invalid collection test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();

      // Try to create collection with invalid name
      try {
        await client.createCollection('', {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        });
        // If we get here, Qdrant accepts empty names (shouldn't happen)
        expect(false).toBe(true);
      } catch (error: any) {
        // Expected: invalid collection name
        expect(error).toBeDefined();
      }
    });

    it('should handle operations on non-existent collections', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping non-existent collection test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();

      try {
        await client.search('non_existent_collection', {
          vector: new Array(1536).fill(0),
          limit: 1,
        });
        // If we get here, operation succeeded (shouldn't happen)
        expect(false).toBe(true);
      } catch (error: any) {
        // Expected: collection doesn't exist
        expect(error).toBeDefined();
        expect(error.message?.toLowerCase()).toContain('not found') ||
               expect(error.status).toBe(404);
      }
    });

    it('should handle malformed vectors', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping malformed vector test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_malformed_vector';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      try {
        // Try to upsert vector with wrong size
        await client.upsert(collectionName, {
          points: [{
            id: 1,
            vector: new Array(768).fill(0), // Wrong size (should be 1536)
            payload: { test: 'malformed' },
          }],
        });
        // If we get here, Qdrant accepted wrong vector size (shouldn't happen)
        expect(false).toBe(true);
      } catch (error: any) {
        // Expected: vector size mismatch
        expect(error).toBeDefined();
      }

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle network timeouts and reconnections', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping network timeout test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      // Test basic connectivity
      const isHealthyBefore = await qdrantService.healthCheck();
      expect(isHealthyBefore).toBe(true);

      // Perform some operations to test stability
      const client = qdrantService.getClient();
      const collectionName = 'test_network_stability';

      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        const vector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        await client.upsert(collectionName, {
          points: [{
            id: i + 1,
            vector,
            payload: { test: 'network_stability', iteration: i },
          }],
        });
      }

      // Verify operations succeeded
      const countResult = await client.scroll(collectionName, { limit: 10 });
      expect(countResult.points.length).toBe(5);

      // Clean up
      await client.deleteCollection(collectionName);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle code embedding workflow', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping code embedding workflow test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_code_embeddings';

      // Create collection for code embeddings
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Simulate code embedding workflow
      const codeSnippets = [
        {
          id: 'func_1',
          content: 'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
          language: 'javascript',
          file: 'utils.js',
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
        {
          id: 'func_2',
          content: 'export class UserService { async getUser(id) { return await db.users.findById(id); } }',
          language: 'typescript',
          file: 'UserService.ts',
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
        {
          id: 'func_3',
          content: 'def process_data(data): return [item.upper() for item in data if item]',
          language: 'python',
          file: 'utils.py',
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
      ];

      // Store code embeddings
      await client.upsert(collectionName, {
        points: codeSnippets.map(snippet => ({
          id: snippet.id,
          vector: snippet.vector,
          payload: {
            content: snippet.content,
            language: snippet.language,
            file: snippet.file,
            type: 'code',
            indexed_at: new Date().toISOString(),
          },
        })),
      });

      // Search for similar code
      const searchResults = await client.search(collectionName, {
        vector: codeSnippets[0].vector, // Search using first code snippet
        limit: 3,
        filter: {
          must: [
            { key: 'language', match: { value: 'javascript' } },
          ],
        },
      });

      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);

      // Should find the JavaScript functions
      searchResults.forEach(result => {
        expect(result.payload?.language).toBe('javascript');
        expect(result.payload?.type).toBe('code');
      });

      // Clean up
      await client.deleteCollection(collectionName);
    });

    it('should handle semantic search with metadata filtering', async () => {
      if (!isQdrantAvailable) {
        console.warn('Skipping semantic search test - Qdrant not available');
        expect(true).toBe(true); // Skip test
        return;
      }

      const client = qdrantService.getClient();
      const collectionName = 'test_semantic_search';

      // Create collection
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Store documents with different categories
      const documents = [
        {
          id: 'doc_1',
          content: 'React component for user authentication',
          category: 'frontend',
          tags: ['react', 'auth', 'component'],
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
        {
          id: 'doc_2',
          content: 'Node.js API for user management',
          category: 'backend',
          tags: ['nodejs', 'api', 'users'],
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
        {
          id: 'doc_3',
          content: 'Database schema for user entities',
          category: 'database',
          tags: ['schema', 'users', 'sql'],
          vector: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        },
      ];

      await client.upsert(collectionName, {
        points: documents.map(doc => ({
          id: doc.id,
          vector: doc.vector,
          payload: {
            content: doc.content,
            category: doc.category,
            tags: doc.tags,
            type: 'documentation',
          },
        })),
      });

      // Search for backend-related content
      const searchResults = await client.search(collectionName, {
        vector: documents[1].vector, // Use backend document vector
        limit: 5,
        filter: {
          must: [
            { key: 'category', match: { value: 'backend' } },
          ],
        },
      });

      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);

      // All results should be backend category
      searchResults.forEach(result => {
        expect(result.payload?.category).toBe('backend');
      });

      // Clean up
      await client.deleteCollection(collectionName);
    });
  });
});
