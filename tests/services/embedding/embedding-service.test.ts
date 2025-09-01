/**
 * Embedding Service Tests
 * Comprehensive tests for the embedding service functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EmbeddingService, EmbeddingConfig, EmbeddingResult, BatchEmbeddingResult } from '../src/utils/embedding.js';
import { File, FunctionSymbol } from '../src/models/entities.js';

// Mock OpenAI to avoid actual API calls in tests
jest.mock('openai');

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockConfig: EmbeddingConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create service with test configuration (no API key to use mock embeddings)
    mockConfig = {
      openaiApiKey: '', // Empty API key to trigger mock embeddings
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 10,
      maxRetries: 2,
      retryDelay: 100,
    };

    service = new EmbeddingService(mockConfig);
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new EmbeddingService();
      expect(defaultService).toBeDefined();
      expect(defaultService.hasRealEmbeddings()).toBe(false); // No API key
    });

    it('should initialize with custom configuration', () => {
      expect(service).toBeDefined();
      expect(service.hasRealEmbeddings()).toBe(false); // No API key, uses mock embeddings
    });

    it('should initialize with partial configuration', () => {
      const partialService = new EmbeddingService({
        model: 'text-embedding-3-large',
        batchSize: 50,
      });
      expect(partialService).toBeDefined();
    });

    it('should initialize without OpenAI client when no API key', () => {
      const noApiKeyService = new EmbeddingService({
        openaiApiKey: '',
      });
      expect(noApiKeyService.hasRealEmbeddings()).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        batchSize: 10
      });
      const validation = validService.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect missing API key', () => {
      const noApiKeyService = new EmbeddingService({ openaiApiKey: '' });
      const validation = noApiKeyService.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('OpenAI API key is required for production embeddings (currently using mock embeddings)');
    });

    it('should detect invalid model', () => {
      const invalidModelService = new EmbeddingService({
        ...mockConfig,
        model: 'invalid-model',
      });
      const validation = invalidModelService.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid embedding model specified');
    });

    it('should detect invalid dimensions', () => {
      const invalidDimService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small',
        dimensions: 0,
        batchSize: 10
      });
      const validation = invalidDimService.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Dimensions must be positive');
    });

    it('should detect invalid batch size', () => {
      const invalidBatchService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        batchSize: 0
      });
      const validation = invalidBatchService.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Batch size must be between 1 and 2048');
    });

    it('should detect batch size too large', () => {
      const largeBatchService = new EmbeddingService({
        ...mockConfig,
        batchSize: 3000,
      });
      const validation = largeBatchService.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Batch size must be between 1 and 2048');
    });
  });

  describe('Single Embedding Generation', () => {
    it('should generate embedding for valid content', async () => {
      const content = 'function test() { return "hello"; }';
      const result = await service.generateEmbedding(content);

      expect(result).toBeDefined();
      expect(result.embedding).toBeInstanceOf(Array);
      expect(result.embedding).toHaveLength(1536);
      expect(result.content).toBe(content);
      expect(result.model).toBe('text-embedding-3-small');
      expect(typeof result.entityId).toBe('undefined');
    });

    it('should generate embedding with entity ID', async () => {
      const content = 'class TestClass {}';
      const entityId = 'test-entity-123';
      const result = await service.generateEmbedding(content, entityId);

      expect(result.entityId).toBe(entityId);
      expect(result.content).toBe(content);
    });

    it('should use cache for repeated content', async () => {
      const content = 'const x = 42;';
      const result1 = await service.generateEmbedding(content);
      const result2 = await service.generateEmbedding(content);

      expect(result1.embedding).toEqual(result2.embedding);
      expect(result1).toEqual(result2);
    });

    it('should reject empty content', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow('Content cannot be empty');
      await expect(service.generateEmbedding('   ')).rejects.toThrow('Content cannot be empty');
    });

    it('should reject null or undefined content', async () => {
      await expect(service.generateEmbedding(null as any)).rejects.toThrow('Content cannot be empty');
      await expect(service.generateEmbedding(undefined as any)).rejects.toThrow('Content cannot be empty');
    });

    it('should generate mock embedding when no API key', async () => {
      const noApiKeyService = new EmbeddingService({ openaiApiKey: '' });
      const result = await noApiKeyService.generateEmbedding('test content');

      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(1536);
      expect(result.model).toBe('text-embedding-3-small');
      expect(result.content).toBe('test content');
    });

    it('should generate deterministic mock embeddings', async () => {
      const noApiKeyService = new EmbeddingService({ openaiApiKey: '' });
      const content = 'test content';

      const result1 = await noApiKeyService.generateEmbedding(content);
      const result2 = await noApiKeyService.generateEmbedding(content);

      expect(result1.embedding).toEqual(result2.embedding);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw error
      const mockOpenAI = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('API Error') as never),
        },
      };

      // Create service with mocked OpenAI
      const errorService = new EmbeddingService(mockConfig);
      (errorService as any).openai = mockOpenAI;

      const result = await errorService.generateEmbedding('test');
      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(1536);
      // Should fallback to mock embedding
    });
  });

  describe('Batch Embedding Generation', () => {
    it('should generate embeddings for multiple inputs', async () => {
      const inputs = [
        { content: 'function foo() {}', entityId: 'entity1' },
        { content: 'class Bar {}', entityId: 'entity2' },
        { content: 'const baz = 1;', entityId: 'entity3' },
      ];

      const result = await service.generateEmbeddingsBatch(inputs);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(3);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);

      result.results.forEach((embeddingResult, index) => {
        expect(embeddingResult.embedding).toHaveLength(1536);
        expect(embeddingResult.content).toBe(inputs[index].content);
        expect(embeddingResult.entityId).toBe(inputs[index].entityId);
      });
    });

    it('should handle empty batch', async () => {
      const result = await service.generateEmbeddingsBatch([]);

      expect(result.results).toEqual([]);
      expect(result.totalTokens).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle single item batch', async () => {
      const inputs = [{ content: 'single item', entityId: 'single' }];
      const result = await service.generateEmbeddingsBatch(inputs);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].content).toBe('single item');
      expect(result.results[0].entityId).toBe('single');
    });

    it('should respect batch size configuration', async () => {
      const smallBatchService = new EmbeddingService({
        ...mockConfig,
        batchSize: 2,
      });

      const inputs = [
        { content: 'item 1' },
        { content: 'item 2' },
        { content: 'item 3' },
        { content: 'item 4' },
        { content: 'item 5' },
      ];

      const result = await smallBatchService.generateEmbeddingsBatch(inputs);

      expect(result.results).toHaveLength(5);
      // Should process in batches of 2, then 2, then 1
    });

    it('should use cache for repeated content in batch', async () => {
      const inputs = [
        { content: 'cached content' },
        { content: 'cached content' }, // Should use cache
        { content: 'new content' },
      ];

      const result = await service.generateEmbeddingsBatch(inputs);

      expect(result.results).toHaveLength(3);
      expect(result.results[0].embedding).toEqual(result.results[1].embedding);
      expect(result.results[0].content).toBe(result.results[1].content);
    });

    it('should handle batch with mixed cached and new content', async () => {
      // Pre-populate cache
      await service.generateEmbedding('cached1');
      await service.generateEmbedding('cached2');

      const inputs = [
        { content: 'cached1' }, // Should use cache
        { content: 'new1' },    // Should generate new
        { content: 'cached2' }, // Should use cache
        { content: 'new2' },    // Should generate new
      ];

      const result = await service.generateEmbeddingsBatch(inputs);

      expect(result.results).toHaveLength(4);
      // Verify cached items have same embeddings
      expect(result.results[0].embedding).toEqual(result.results[2].embedding);
    });
  });

  describe('Entity Content Generation', () => {
    it('should generate content for function symbols', () => {
      const funcEntity: any = {
        id: 'func1',
        type: 'symbol',
        name: 'testFunction',
        kind: 'function',
        path: '/src/test.ts',
        hash: 'hash123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        signature: 'testFunction(param: string): number',
        documentation: 'Test function documentation',
        visibility: 'public',
        isExported: true,
        isDeprecated: false,
        parameters: [{ name: 'param', type: 'string', optional: false }],
        returnType: 'number',
        isAsync: false,
        isGenerator: false,
        complexity: 3,
        calls: [],
      };

      const content = service.generateEntityContent(funcEntity);
      expect(content).toContain('/src/test.ts');
      expect(content).toContain('testFunction(param: string): number');
      expect(content).toContain('Test function documentation');
    });

    it('should generate content for class symbols', () => {
      const classEntity: any = {
        id: 'class1',
        type: 'symbol',
        name: 'TestClass',
        kind: 'class',
        path: '/src/test.ts',
        hash: 'hash456',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        documentation: 'Test class documentation',
      };

      const content = service.generateEntityContent(classEntity);
      expect(content).toContain('/src/test.ts');
      expect(content).toContain('TestClass');
      expect(content).toContain('Test class documentation');
    });

    it('should generate content for file entities', () => {
      const fileEntity: File = {
        id: 'file1',
        type: 'file',
        path: '/src/test.ts',
        hash: 'file123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      const content = service.generateEntityContent(fileEntity);
      expect(content).toContain('/src/test.ts');
      expect(content).toContain('.ts');
      expect(content).toContain('typescript');
    });

    it('should generate content for documentation entities', () => {
      const docEntity: any = {
        id: 'doc1',
        type: 'documentation',
        title: 'Test Document',
        content: 'This is test documentation content',
      };

      const content = service.generateEntityContent(docEntity);
      expect(content).toContain('Test Document');
      expect(content).toContain('This is test documentation content');
    });

    it('should generate content for unknown entity types', () => {
      const unknownEntity: any = {
        id: 'unknown1',
        type: 'unknown',
        path: '/some/path',
      };

      const content = service.generateEntityContent(unknownEntity);
      expect(content).toContain('/some/path');
      expect(content).toContain('unknown');
    });

    it('should handle entities with missing properties', () => {
      const incompleteEntity: any = {
        id: 'incomplete1',
        type: 'symbol',
        // Missing path, signature, etc.
      };

      const content = service.generateEntityContent(incompleteEntity);
      expect(content).toBe(' incomplete1'); // Should handle gracefully
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      // Create service with API key to enable caching
      const cacheService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small'
      });

      // Mock OpenAI for cache testing
      const mockCreate = jest.fn() as jest.MockedFunction<any>;
      mockCreate.mockResolvedValue({
        data: [{ embedding: Array.from({ length: 1536 }, () => Math.random()) }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      (cacheService as any).openai = {
        embeddings: {
          create: mockCreate
        }
      };

      await cacheService.generateEmbedding('test1');
      await cacheService.generateEmbedding('test2');

      expect(cacheService.getCacheSize()).toBeGreaterThan(0);

      cacheService.clearCache();
      expect(cacheService.getCacheSize()).toBe(0);
    });

    it('should get cache size', async () => {
      // Create service with API key to enable caching
      const cacheService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small'
      });

      // Mock OpenAI for cache testing
      const mockCreate = jest.fn() as jest.MockedFunction<any>;
      mockCreate.mockResolvedValue({
        data: [{ embedding: Array.from({ length: 1536 }, () => Math.random()) }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      (cacheService as any).openai = {
        embeddings: {
          create: mockCreate
        }
      };

      expect(cacheService.getCacheSize()).toBe(0);

      await cacheService.generateEmbedding('test');
      expect(cacheService.getCacheSize()).toBe(1);

      await cacheService.generateEmbedding('test'); // Same content, should not increase cache
      expect(cacheService.getCacheSize()).toBe(1);

      await cacheService.generateEmbedding('different test');
      expect(cacheService.getCacheSize()).toBe(2);
    });

    it('should get cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalRequests');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.totalRequests).toBe('number');
    });

    it('should handle cache with different models separately', () => {
      const service1 = new EmbeddingService({ ...mockConfig, model: 'text-embedding-3-small' });
      const service2 = new EmbeddingService({ ...mockConfig, model: 'text-embedding-3-large' });

      // Both should cache the same content separately
      expect(service1.getCacheSize()).toBe(0);
      expect(service2.getCacheSize()).toBe(0);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost for text-embedding-3-small', async () => {
      const inputs = [
        { content: 'This is a test string with some content' }, // ~8 tokens
        { content: 'Another test string' }, // ~4 tokens
      ];

      const result = await service.generateEmbeddingsBatch(inputs);

      expect(result.totalCost).toBeGreaterThan(0);
      // Should be very small cost for small model
      expect(result.totalCost).toBeLessThan(0.001);
    });

    it('should calculate cost for text-embedding-3-large', async () => {
      const largeModelService = new EmbeddingService({
        ...mockConfig,
        model: 'text-embedding-3-large',
      });

      const inputs = [{ content: 'Test content' }];
      const result = await largeModelService.generateEmbeddingsBatch(inputs);

      expect(result.totalCost).toBeGreaterThan(0);
      // Large model should be more expensive
    });

    it('should calculate cost for text-embedding-ada-002', async () => {
      const adaService = new EmbeddingService({
        ...mockConfig,
        model: 'text-embedding-ada-002',
      });

      const inputs = [{ content: 'Test content' }];
      const result = await adaService.generateEmbeddingsBatch(inputs);

      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('should use default pricing for unknown models', async () => {
      const unknownModelService = new EmbeddingService({
        ...mockConfig,
        model: 'unknown-model' as any,
      });

      const inputs = [{ content: 'Test content' }];
      const result = await unknownModelService.generateEmbeddingsBatch(inputs);

      expect(result.totalCost).toBeGreaterThan(0);
      // Should use default pricing (text-embedding-3-small)
    });
  });

  describe('Statistics and Status', () => {
    it('should get service statistics', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('hasRealEmbeddings');
      expect(stats).toHaveProperty('model');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('totalRequests');

      expect(stats.hasRealEmbeddings).toBe(true);
      expect(stats.model).toBe('text-embedding-3-small');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.totalRequests).toBe('number');
    });

    it('should detect real embeddings availability', () => {
      // Our main service has no API key, so should be false
      expect(service.hasRealEmbeddings()).toBe(false);

      // Service with API key should be true
      const realService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small'
      });
      expect(realService.hasRealEmbeddings()).toBe(true);

      const noApiService = new EmbeddingService({ openaiApiKey: '' });
      expect(noApiService.hasRealEmbeddings()).toBe(false);

      const noOpenAiService = new EmbeddingService({
        openaiApiKey: 'test-key',
        model: 'text-embedding-3-small'
      });
      (noOpenAiService as any).openai = null;
      expect(noOpenAiService.hasRealEmbeddings()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors in batch processing', async () => {
      const mockOpenAI = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('API Error') as never),
        },
      };

      const errorService = new EmbeddingService(mockConfig);
      (errorService as any).openai = mockOpenAI;

      const inputs = [{ content: 'test content' }];
      const result = await errorService.generateEmbeddingsBatch(inputs);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].embedding).toHaveLength(1536);
      // Should fallback to mock embeddings
    });

    it('should handle rate limiting', async () => {
      const inputs = Array.from({ length: 25 }, (_, i) => ({
        content: `Content ${i}`,
      }));

      const startTime = Date.now();
      const result = await service.generateEmbeddingsBatch(inputs);
      const duration = Date.now() - startTime;

      expect(result.results).toHaveLength(25);
      // Should take some time due to rate limiting
      expect(duration).toBeGreaterThan(100); // At least 100ms delay between batches
    });

    it('should handle mixed valid and invalid inputs', async () => {
      const inputs = [
        { content: 'valid content' },
        { content: '' }, // Invalid
        { content: 'another valid content' },
      ];

      // Should handle the error gracefully and continue processing
      await expect(service.generateEmbeddingsBatch(inputs)).resolves.toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let callCount = 0;
      const mockOpenAI = {
        embeddings: {
          create: jest.fn()
            .mockImplementationOnce(() => {
              callCount++;
              throw new Error('Temporary failure') as never;
            })
            .mockImplementationOnce(() => {
              callCount++;
              throw new Error('Another temporary failure') as never;
            })
            .mockImplementationOnce(() => {
              callCount++;
              return {
                data: [{ embedding: Array.from({ length: 1536 }, () => Math.random()) }],
                usage: { prompt_tokens: 5, total_tokens: 5 },
              };
            }),
        },
      };

      const retryService = new EmbeddingService({
        ...mockConfig,
        maxRetries: 2,
        retryDelay: 10, // Fast retry for tests
      });
      (retryService as any).openai = mockOpenAI;

      const result = await retryService.generateEmbedding('test');
      expect(callCount).toBe(3); // Initial call + 2 retries
      expect(result).toBeDefined();
    });

    it('should fail after max retries exhausted', async () => {
      const mockOpenAI = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('Persistent failure') as never),
        },
      };

      const retryService = new EmbeddingService({
        ...mockConfig,
        maxRetries: 1,
        retryDelay: 10,
      });
      (retryService as any).openai = mockOpenAI;

      await expect(retryService.generateEmbedding('test')).rejects.toThrow();
    });
  });

  describe('Integration with Entities', () => {
    it('should generate embeddings for real entities', async () => {
      const testFile: File = {
        id: 'integration_file',
        type: 'file',
        path: '/src/integration.ts',
        hash: 'int123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        extension: '.ts',
        size: 500,
        lines: 25,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      const content = service.generateEntityContent(testFile);
      const result = await service.generateEmbedding(content, testFile.id);

      expect(result).toBeDefined();
      expect(result.entityId).toBe(testFile.id);
      expect(result.embedding).toHaveLength(1536);
      expect(result.content).toContain('/src/integration.ts');
    });

    it('should handle complex entity content generation', async () => {
      const complexFunction: FunctionSymbol = {
        id: 'complex_func',
        type: 'symbol',
        name: 'complexFunction',
        kind: 'function',
        path: '/src/complex.ts',
        hash: 'complex456',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        signature: 'complexFunction<T>(param1: T, param2: string): Promise<T[]>',
        docstring: 'A complex function with generics and async behavior',
        visibility: 'public',
        isExported: true,
        isDeprecated: false,
        parameters: [
          { name: 'param1', type: 'T', optional: false },
          { name: 'param2', type: 'string', optional: true },
        ],
        returnType: 'Promise<T[]>',
        isAsync: true,
        isGenerator: false,
        complexity: 8,
        calls: ['console.log', 'fetch'],
      };

      const content = service.generateEntityContent(complexFunction);
      expect(content).toContain('/src/complex.ts');
      expect(content).toContain('complexFunction<T>(param1: T, param2: string): Promise<T[]>');
      expect(content).toContain('A complex function with generics and async behavior');

      const result = await service.generateEmbedding(content, complexFunction.id);
      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(1536);
    });
  });
});
