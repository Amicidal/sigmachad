import { describe, it, expect, beforeEach } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('Search Operations E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;

  beforeEach(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;

    // Set up API key for authenticated requests
    const keyResponse = await client.post('/api/auth/api-keys', {
      name: 'Search Test Key',
      permissions: ['read', 'write'],
    });
    client.setApiKey(keyResponse.body.apiKey);
  });

  describe('Text Search', () => {
    it('should perform basic text search across entities', async () => {
      // First, populate knowledge graph with test data
      const testFiles = mockData.generateMultipleCodeFiles(5);

      for (const file of testFiles) {
        await client.post('/api/graph/parse', {
          filePath: file.path,
          content: file.content,
          language: file.language,
        });
      }

      // Wait for indexing to complete
      await mockData.delay(2000);

      // Search for function entities
      const searchResponse = await client.get('/api/graph/search', {
        query: 'function',
        type: 'text',
      });

      assertions.assertSuccessResponse(searchResponse);
      assertions.assertValidSearchResults(searchResponse.body, 'function');

      // Verify results contain function entities
      expect(searchResponse.body.items.length).toBeGreaterThan(0);
      expect(searchResponse.body.items.some((item: any) => item.type === 'function')).toBe(true);
    });

    it('should support advanced search with filters', async () => {
      // Populate with specific test data
      const serviceFile = mockData.generateCodeFile({
        path: 'src/services/UserService.ts',
        content: `
export class UserService {
  async getUser(id: string): Promise<User> {
    return await this.repository.findById(id);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return await this.repository.save(data);
  }
}`,
        language: 'typescript',
      });

      await client.post('/api/graph/parse', {
        filePath: serviceFile.path,
        content: serviceFile.content,
        language: serviceFile.language,
      });

      await mockData.delay(1000);

      // Search with multiple filters
      const searchResponse = await client.get('/api/graph/search', {
        query: 'user',
        type: 'text',
        filters: {
          entityType: 'class',
          filePath: 'src/services/*',
          language: 'typescript',
        },
        sortBy: 'relevance',
        sortOrder: 'desc',
      });

      assertions.assertSuccessResponse(searchResponse);
      assertions.assertValidSearchResults(searchResponse.body, 'user');

      // Verify filter application
      for (const item of searchResponse.body.items) {
        if (item.type === 'class') {
          expect(item.name).toMatch(/user/i);
          expect(item.filePath).toMatch(/^src\/services\//);
        }
      }
    });

    it('should handle pagination for large result sets', async () => {
      // Generate many test files
      const testFiles = mockData.generateMultipleCodeFiles(20);

      for (const file of testFiles) {
        await client.post('/api/graph/parse', {
          filePath: file.path,
          content: file.content,
          language: file.language,
        });
      }

      await mockData.delay(3000);

      // Test pagination
      const page1Response = await client.get('/api/graph/search', {
        query: 'export',
        type: 'text',
        page: 1,
        pageSize: 5,
      });

      assertions.assertSuccessResponse(page1Response);
      expect(page1Response.body.items).toHaveLength(5);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.pageSize).toBe(5);
      expect(page1Response.body.total).toBeGreaterThan(5);

      // Get second page
      const page2Response = await client.get('/api/graph/search', {
        query: 'export',
        type: 'text',
        page: 2,
        pageSize: 5,
      });

      assertions.assertSuccessResponse(page2Response);
      expect(page2Response.body.items).toHaveLength(5);
      expect(page2Response.body.page).toBe(2);

      // Verify no overlap between pages
      const page1Ids = page1Response.body.items.map((item: any) => item.id);
      const page2Ids = page2Response.body.items.map((item: any) => item.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  describe('Semantic Search', () => {
    it('should perform semantic search using vector embeddings', async () => {
      // Add code with semantic meaning
      const authFile = mockData.generateCodeFile({
        path: 'src/auth/AuthService.ts',
        content: `
export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await this.validateCredentials(credentials);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async validateCredentials(credentials: LoginCredentials): Promise<User | null> {
    // Validation logic
    return null;
  }
}`,
        language: 'typescript',
      });

      await client.post('/api/graph/parse', {
        filePath: authFile.path,
        content: authFile.content,
        language: authFile.language,
      });

      await mockData.delay(2000);

      // Semantic search for authentication-related concepts
      const searchResponse = await client.post('/api/graph/semantic-search', {
        query: 'user authentication and login functionality',
        threshold: 0.7,
        limit: 10,
      });

      assertions.assertSuccessResponse(searchResponse);
      assertions.assertSemanticSearchResults(searchResponse.body);

      // Verify semantic relevance
      const topResult = searchResponse.body.items[0];
      expect(topResult.score).toBeGreaterThan(0.7);
      expect(topResult.entity.name).toMatch(/auth|login|credential/i);
    });

    it('should handle multi-modal semantic search (code + docs)', async () => {
      // Add both code and documentation
      const codeFile = mockData.generateCodeFile({
        path: 'src/utils/cache.ts',
        content: `
/**
 * High-performance caching utility with TTL support
 * Provides in-memory caching with automatic expiration
 */
export class Cache<T> {
  private store = new Map<string, { value: T; expires: number }>();

  set(key: string, value: T, ttl: number): void {
    this.store.set(key, { value, expires: Date.now() + ttl });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
}`,
        language: 'typescript',
      });

      const docFile = mockData.generateCodeFile({
        path: 'docs/caching-strategy.md',
        content: `
# Caching Strategy

Our application uses a multi-layered caching approach:

1. **In-Memory Cache**: Fast access for frequently used data
2. **TTL-based Expiration**: Automatic cleanup of stale data
3. **Cache Miss Handling**: Graceful fallback to data sources

The Cache utility class provides a simple interface for managing cached data with automatic expiration.
`,
        language: 'markdown',
      });

      await Promise.all([
        client.post('/api/graph/parse', {
          filePath: codeFile.path,
          content: codeFile.content,
          language: codeFile.language,
        }),
        client.post('/api/docs/sync', {
          filePath: docFile.path,
          content: docFile.content,
        }),
      ]);

      await mockData.delay(2000);

      // Search for caching concepts
      const searchResponse = await client.post('/api/graph/semantic-search', {
        query: 'caching strategy with expiration and performance optimization',
        includeDocumentation: true,
        threshold: 0.6,
      });

      assertions.assertSuccessResponse(searchResponse);
      assertions.assertSemanticSearchResults(searchResponse.body);

      // Should include both code and documentation results
      const entityTypes = searchResponse.body.items.map((item: any) => item.entity.type);
      expect(entityTypes).toContain('class'); // Cache class
      expect(entityTypes).toContain('documentation'); // Markdown doc
    });

    it('should support semantic search with context filters', async () => {
      // Add related but different functionality
      const files = [
        {
          path: 'src/auth/TokenManager.ts',
          content: 'export class TokenManager { generateToken() {} validateToken() {} }',
          category: 'authentication',
        },
        {
          path: 'src/payment/TokenManager.ts',
          content: 'export class TokenManager { createPaymentToken() {} verifyPaymentToken() {} }',
          category: 'payment',
        },
      ];

      for (const file of files) {
        await client.post('/api/graph/parse', {
          filePath: file.path,
          content: file.content,
          language: 'typescript',
          metadata: { category: file.category },
        });
      }

      await mockData.delay(1500);

      // Search with context filter
      const authSearchResponse = await client.post('/api/graph/semantic-search', {
        query: 'token management',
        context: {
          category: 'authentication',
          filePath: 'src/auth/*',
        },
        threshold: 0.5,
      });

      assertions.assertSuccessResponse(authSearchResponse);
      assertions.assertSemanticSearchResults(authSearchResponse.body);

      // Should only return auth-related tokens
      for (const item of authSearchResponse.body.items) {
        if (item.entity.filePath) {
          expect(item.entity.filePath).toMatch(/^src\/auth\//);
        }
      }
    });
  });

  describe('Entity Search', () => {
    it('should search entities by type and relationships', async () => {
      // Create entities with relationships
      const classEntity = mockData.generateEntity({
        name: 'UserRepository',
        type: 'class',
      });

      const methodEntity = mockData.generateEntity({
        name: 'findByEmail',
        type: 'method',
      });

      // Create entities
      const classResponse = await client.post('/api/graph/entities', classEntity);
      const methodResponse = await client.post('/api/graph/entities', methodEntity);

      assertions.assertSuccessResponse(classResponse, 201);
      assertions.assertSuccessResponse(methodResponse, 201);

      // Create relationship
      await client.post('/api/graph/relationships', {
        fromId: classResponse.body.id,
        toId: methodResponse.body.id,
        type: 'CONTAINS',
      });

      // Search for classes that contain methods
      const searchResponse = await client.get('/api/graph/entities/search', {
        type: 'class',
        hasRelationship: 'CONTAINS',
        relationshipTarget: 'method',
      });

      assertions.assertSuccessResponse(searchResponse);
      expect(searchResponse.body.items.length).toBeGreaterThan(0);

      const foundClass = searchResponse.body.items.find((item: any) => item.id === classResponse.body.id);
      expect(foundClass).toBeDefined();
      assertions.assertEntityHasRelationships(foundClass, ['CONTAINS']);
    });

    it('should perform impact analysis search', async () => {
      // Create a dependency chain: A -> B -> C
      const entities = [
        mockData.generateEntity({ name: 'ServiceA', type: 'class' }),
        mockData.generateEntity({ name: 'ServiceB', type: 'class' }),
        mockData.generateEntity({ name: 'ServiceC', type: 'class' }),
      ];

      const entityResponses = await Promise.all(
        entities.map(entity => client.post('/api/graph/entities', entity))
      );

      // Create dependencies
      await Promise.all([
        client.post('/api/graph/relationships', {
          fromId: entityResponses[0].body.id,
          toId: entityResponses[1].body.id,
          type: 'DEPENDS_ON',
        }),
        client.post('/api/graph/relationships', {
          fromId: entityResponses[1].body.id,
          toId: entityResponses[2].body.id,
          type: 'DEPENDS_ON',
        }),
      ]);

      // Perform impact analysis
      const impactResponse = await client.get(`/api/graph/impact/${entityResponses[2].body.id}`, {
        direction: 'incoming',
        maxDepth: 3,
      });

      assertions.assertSuccessResponse(impactResponse);
      expect(impactResponse.body.affectedEntities).toBeInstanceOf(Array);
      expect(impactResponse.body.affectedEntities.length).toBeGreaterThanOrEqual(2); // A and B depend on C

      // Verify dependency chain
      const entityIds = impactResponse.body.affectedEntities.map((e: any) => e.id);
      expect(entityIds).toContain(entityResponses[0].body.id); // ServiceA
      expect(entityIds).toContain(entityResponses[1].body.id); // ServiceB
    });
  });

  describe('Search Performance', () => {
    it('should handle large-scale search operations efficiently', async () => {
      // Generate a large dataset
      const largeDataset = mockData.generateMultipleCodeFiles(50);

      // Batch upload for performance
      const batchSize = 10;
      for (let i = 0; i < largeDataset.length; i += batchSize) {
        const batch = largeDataset.slice(i, i + batchSize);
        const batchPromises = batch.map(file =>
          client.post('/api/graph/parse', {
            filePath: file.path,
            content: file.content,
            language: file.language,
          })
        );
        await Promise.all(batchPromises);
      }

      // Wait for indexing
      await mockData.delay(5000);

      // Perform search and measure performance
      const startTime = Date.now();
      const searchResponse = await client.get('/api/graph/search', {
        query: 'export',
        type: 'text',
        limit: 100,
      });

      assertions.assertSuccessResponse(searchResponse);
      assertions.assertResponseTime(startTime, 2000); // Should complete within 2 seconds

      // Verify large result set handling
      expect(searchResponse.body.total).toBeGreaterThan(50);
      expect(searchResponse.body.items.length).toBeLessThanOrEqual(100);
    });

    it('should support concurrent search operations', async () => {
      // Populate some test data
      const testFiles = mockData.generateMultipleCodeFiles(10);
      for (const file of testFiles) {
        await client.post('/api/graph/parse', {
          filePath: file.path,
          content: file.content,
          language: file.language,
        });
      }

      await mockData.delay(2000);

      // Perform concurrent searches
      const concurrentSearches = [
        client.get('/api/graph/search', { query: 'function', type: 'text' }),
        client.get('/api/graph/search', { query: 'class', type: 'text' }),
        client.get('/api/graph/search', { query: 'interface', type: 'text' }),
        client.post('/api/graph/semantic-search', { query: 'utility functions' }),
        client.get('/api/graph/entities/search', { type: 'function' }),
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentSearches);

      // All searches should complete successfully
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);

      // Concurrent execution should be faster than sequential
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all responses are valid
      const responses = results.map(r => (r as any).value);
      for (const response of responses) {
        assertions.assertSuccessResponse(response);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed search queries gracefully', async () => {
      const malformedQueries = [
        { query: '', type: 'text' },
        { query: '   ', type: 'text' },
        { query: 'test', type: 'invalid_type' },
        { query: 'test', filters: 'invalid_filters' },
      ];

      for (const queryParams of malformedQueries) {
        const response = await client.get('/api/graph/search', queryParams);
        assertions.assertValidationError(response);
      }
    });

    it('should handle search on empty knowledge graph', async () => {
      // Ensure clean database
      await globalThis.testEnvironment.resetDatabases();

      const searchResponse = await client.get('/api/graph/search', {
        query: 'nonexistent',
        type: 'text',
      });

      assertions.assertSuccessResponse(searchResponse);
      expect(searchResponse.body.items).toHaveLength(0);
      expect(searchResponse.body.total).toBe(0);
    });

    it('should handle search service unavailability', async () => {
      // This would require temporarily stopping the search service
      // For now, we'll test timeout handling
      const timeoutResponse = await client.get('/api/graph/search', {
        query: 'test',
        type: 'text',
        timeout: 1, // Very short timeout
      });

      // Should either succeed or return a timeout error
      expect([200, 408, 503]).toContain(timeoutResponse.statusCode);
    });
  });
});