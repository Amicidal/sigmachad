/**
 * Qdrant Vector Database Operations Tests
 * Tests vector operations, similarity search, and collection management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('Qdrant Vector Database Operations', () => {
  let dbService: DatabaseService;
  const testCollection = 'test_embeddings';
  const codeCollection = 'test_code_embeddings';

  beforeAll(async () => {
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    await dbService.setupDatabase(); // Ensure collections are created
  }, 30000);

  afterAll(async () => {
    await dbService.close();
  }, 10000);

  describe('Collection Management', () => {
    it('should list existing collections', async () => {
      const collections = await dbService.qdrant.getCollections();
      expect(collections.collections).toBeDefined();
      expect(Array.isArray(collections.collections)).toBe(true);

      // Should have collections created during setup
      const collectionNames = collections.collections.map(c => c.name);
      expect(collectionNames).toContain('code_embeddings');
      expect(collectionNames).toContain('documentation_embeddings');
    });

    it('should create a test collection', async () => {
      // Clean up if collection exists
      try {
        await dbService.qdrant.deleteCollection(testCollection);
      } catch (error) {
        // Collection doesn't exist, that's fine
      }

      // Create new collection
      await dbService.qdrant.createCollection(testCollection, {
        vectors: {
          size: 1536, // OpenAI Ada-002 dimensions
          distance: 'Cosine',
        },
      });

      // Verify collection exists
      const collections = await dbService.qdrant.getCollections();
      const collectionNames = collections.collections.map(c => c.name);
      expect(collectionNames).toContain(testCollection);
    });

    it('should delete a collection', async () => {
      // First create collection
      await dbService.qdrant.createCollection('temp_collection', {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      // Verify it exists
      let collections = await dbService.qdrant.getCollections();
      let collectionNames = collections.collections.map(c => c.name);
      expect(collectionNames).toContain('temp_collection');

      // Delete collection
      await dbService.qdrant.deleteCollection('temp_collection');

      // Verify it's deleted
      collections = await dbService.qdrant.getCollections();
      collectionNames = collections.collections.map(c => c.name);
      expect(collectionNames).not.toContain('temp_collection');
    });
  });

  describe('Vector Operations', () => {
    const testVectors = [
      {
        id: 1,
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'function',
          name: 'calculateTotal',
          file_path: 'src/utils/math.ts',
          language: 'typescript',
          content: 'function calculateTotal(items: number[]): number { return items.reduce((sum, item) => sum + item, 0); }'
        }
      },
      {
        id: 2,
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'class',
          name: 'UserService',
          file_path: 'src/services/UserService.ts',
          language: 'typescript',
          content: 'class UserService { constructor() {} async getUser(id: string) { return null; } }'
        }
      },
      {
        id: 3,
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'function',
          name: 'validateEmail',
          file_path: 'src/utils/validation.ts',
          language: 'typescript',
          content: 'function validateEmail(email: string): boolean { return /^[^@]+@[^@]+\\.[^@]+$/.test(email); }'
        }
      }
    ];

    beforeEach(async () => {
      // Clean up existing points
      try {
        await dbService.qdrant.deleteCollection(testCollection);
      } catch (error) {
        // Collection doesn't exist
      }

      // Recreate collection
      await dbService.qdrant.createCollection(testCollection, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
    });

    it('should insert vectors with payload', async () => {
      const points = testVectors.map(v => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload
      }));

      const result = await dbService.qdrant.upsert(testCollection, {
        points: points
      });

      expect(result.status).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('should retrieve vectors by ID', async () => {
      // Insert vectors first
      const points = testVectors.slice(0, 2).map(v => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload
      }));

      await dbService.qdrant.upsert(testCollection, {
        points: points
      });

      // Retrieve specific vector
      const result = await dbService.qdrant.retrieve(testCollection, {
        ids: [1]
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
      expect(result[0].payload.name).toBe('calculateTotal');
    });

    it('should perform similarity search', async () => {
      // Insert all test vectors
      const points = testVectors.map(v => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload
      }));

      await dbService.qdrant.upsert(testCollection, {
        points: points
      });

      // Search using first vector as query
      const searchResult = await dbService.qdrant.search(testCollection, {
        vector: testVectors[0].vector,
        limit: 3,
        with_payload: true,
        with_vector: false
      });

      expect(searchResult.length).toBeGreaterThan(0);
      expect(searchResult[0].id).toBe(1); // Should find itself as most similar
      expect(searchResult[0].score).toBeDefined();
      expect(searchResult[0].payload).toBeDefined();
    });

    it('should filter search results', async () => {
      // Insert test vectors
      const points = testVectors.map(v => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload
      }));

      await dbService.qdrant.upsert(testCollection, {
        points: points
      });

      // Search with filter for functions only
      const searchResult = await dbService.qdrant.search(testCollection, {
        vector: testVectors[0].vector,
        limit: 5,
        filter: {
          must: [
            {
              key: 'type',
              match: {
                value: 'function'
              }
            }
          ]
        },
        with_payload: true
      });

      // Should only return functions, not classes
      expect(searchResult.length).toBeGreaterThan(0);
      searchResult.forEach(result => {
        expect(result.payload.type).toBe('function');
      });
    });

    it('should update vector payload', async () => {
      // Insert vector
      await dbService.qdrant.upsert(testCollection, {
        points: [{
          id: 1,
          vector: testVectors[0].vector,
          payload: testVectors[0].payload
        }]
      });

      // Update payload
      const updatedPayload = {
        ...testVectors[0].payload,
        name: 'updatedCalculateTotal',
        content: 'function updatedCalculateTotal(items: number[]): number { return items.reduce((sum, item) => sum + item, 0); }'
      };

      await dbService.qdrant.setPayload(testCollection, {
        payload: updatedPayload,
        points: [1]
      });

      // Verify update
      const result = await dbService.qdrant.retrieve(testCollection, {
        ids: [1]
      });

      expect(result[0].payload.name).toBe('updatedCalculateTotal');
    });

    it('should delete vectors', async () => {
      // Insert vectors
      const points = testVectors.slice(0, 2).map(v => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload
      }));

      await dbService.qdrant.upsert(testCollection, {
        points: points
      });

      // Delete one vector
      await dbService.qdrant.delete(testCollection, {
        points: [1]
      });

      // Verify deletion
      const remaining = await dbService.qdrant.retrieve(testCollection, {
        ids: [1, 2]
      });

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(2);
    });
  });

  describe('Batch Operations', () => {
    const batchVectors = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      vector: Array.from({ length: 1536 }, () => Math.random()),
      payload: {
        type: 'test_item',
        index: i,
        batch: Math.floor(i / 3) + 1
      }
    }));

    beforeEach(async () => {
      // Clean up and recreate collection
      try {
        await dbService.qdrant.deleteCollection('batch_test');
      } catch (error) {
        // Collection doesn't exist
      }

      await dbService.qdrant.createCollection('batch_test', {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
    });

    it('should handle batch vector insertion', async () => {
      const result = await dbService.qdrant.upsert('batch_test', {
        points: batchVectors
      });

      expect(result.status).toBe('completed');

      // Verify all vectors were inserted
      const count = await dbService.qdrant.count('batch_test');
      expect(count.count).toBe(10);
    });

    it('should perform batch search operations', async () => {
      // Insert batch vectors
      await dbService.qdrant.upsert('batch_test', {
        points: batchVectors
      });

      // Perform batch search
      const searchRequests = [
        {
          vector: batchVectors[0].vector,
          limit: 5,
          filter: {
            must: [
              {
                key: 'batch',
                match: {
                  value: 1
                }
              }
            ]
          }
        },
        {
          vector: batchVectors[5].vector,
          limit: 5,
          filter: {
            must: [
              {
                key: 'batch',
                match: {
                  value: 2
                }
              }
            ]
          }
        }
      ];

      const batchResults = await dbService.qdrant.searchBatch('batch_test', {
        searches: searchRequests
      });

      expect(batchResults.length).toBe(2);
      expect(batchResults[0].length).toBeGreaterThan(0);
      expect(batchResults[1].length).toBeGreaterThan(0);
    });

    it('should handle batch payload updates', async () => {
      // Insert batch vectors
      await dbService.qdrant.upsert('batch_test', {
        points: batchVectors
      });

      // Update payloads for specific points
      const updatePoints = [1, 3, 5];
      const updatedPayload = {
        type: 'updated_test_item',
        updated: true
      };

      await dbService.qdrant.setPayload('batch_test', {
        payload: updatedPayload,
        points: updatePoints
      });

      // Verify updates
      const retrieved = await dbService.qdrant.retrieve('batch_test', {
        ids: updatePoints
      });

      retrieved.forEach(point => {
        expect(point.payload.type).toBe('updated_test_item');
        expect(point.payload.updated).toBe(true);
      });
    });
  });

  describe('Code Embeddings Collection', () => {
    const codeEmbeddings = [
      {
        id: 'func_1',
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'function',
          name: 'parseTypeScript',
          file_path: 'src/services/ASTParser.ts',
          language: 'typescript',
          content: 'function parseTypeScript(code: string): ASTNode { /* implementation */ }',
          metadata: {
            complexity: 'medium',
            dependencies: ['typescript', 'ast-utils']
          }
        }
      },
      {
        id: 'class_1',
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'class',
          name: 'DatabaseService',
          file_path: 'src/services/DatabaseService.ts',
          language: 'typescript',
          content: 'class DatabaseService { constructor(config) { this.config = config; } }',
          metadata: {
            complexity: 'high',
            dependencies: ['pg', 'redis', '@qdrant/js-client-rest']
          }
        }
      }
    ];

    it('should store code embeddings with metadata', async () => {
      const result = await dbService.qdrant.upsert('code_embeddings', {
        points: codeEmbeddings
      });

      expect(result.status).toBe('completed');
    });

    it('should search code by functionality', async () => {
      // Insert code embeddings
      await dbService.qdrant.upsert('code_embeddings', {
        points: codeEmbeddings
      });

      // Search for parsing-related code
      const searchResult = await dbService.qdrant.search('code_embeddings', {
        vector: codeEmbeddings[0].vector, // Use first embedding as query
        limit: 5,
        filter: {
          should: [
            {
              key: 'name',
              match: {
                text: 'parse'
              }
            }
          ]
        },
        with_payload: true
      });

      expect(searchResult.length).toBeGreaterThan(0);
    });

    it('should filter code by language and file type', async () => {
      // Search for TypeScript functions
      const searchResult = await dbService.qdrant.search('code_embeddings', {
        vector: codeEmbeddings[0].vector,
        limit: 10,
        filter: {
          must: [
            {
              key: 'language',
              match: {
                value: 'typescript'
              }
            },
            {
              key: 'type',
              match: {
                value: 'function'
              }
            }
          ]
        },
        with_payload: true
      });

      searchResult.forEach(result => {
        expect(result.payload.language).toBe('typescript');
        expect(result.payload.type).toBe('function');
      });
    });
  });

  describe('Documentation Embeddings Collection', () => {
    const docEmbeddings = [
      {
        id: 'doc_1',
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'documentation',
          title: 'Database Connection Guide',
          content: 'This guide explains how to connect to various databases...',
          category: 'setup',
          tags: ['database', 'connection', 'guide'],
          metadata: {
            author: 'Dev Team',
            last_updated: '2024-01-15',
            version: '1.0'
          }
        }
      },
      {
        id: 'doc_2',
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          type: 'documentation',
          title: 'API Reference',
          content: 'Complete API reference for the Memento system...',
          category: 'reference',
          tags: ['api', 'reference', 'documentation'],
          metadata: {
            author: 'API Team',
            last_updated: '2024-01-20',
            version: '2.1'
          }
        }
      }
    ];

    it('should store documentation embeddings', async () => {
      const result = await dbService.qdrant.upsert('documentation_embeddings', {
        points: docEmbeddings
      });

      expect(result.status).toBe('completed');
    });

    it('should search documentation by category', async () => {
      // Insert documentation
      await dbService.qdrant.upsert('documentation_embeddings', {
        points: docEmbeddings
      });

      // Search for setup documentation
      const searchResult = await dbService.qdrant.search('documentation_embeddings', {
        vector: docEmbeddings[0].vector,
        limit: 5,
        filter: {
          must: [
            {
              key: 'category',
              match: {
                value: 'setup'
              }
            }
          ]
        },
        with_payload: true
      });

      searchResult.forEach(result => {
        expect(result.payload.category).toBe('setup');
      });
    });

    it('should find documentation by tags', async () => {
      // Search for API-related documentation
      const searchResult = await dbService.qdrant.search('documentation_embeddings', {
        vector: docEmbeddings[1].vector,
        limit: 5,
        filter: {
          must: [
            {
              key: 'tags',
              match: {
                value: 'api'
              }
            }
          ]
        },
        with_payload: true
      });

      searchResult.forEach(result => {
        expect(result.payload.tags).toContain('api');
      });
    });
  });
});
