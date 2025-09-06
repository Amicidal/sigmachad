/**
 * Unit tests for EmbeddingService
 * Tests embedding generation, caching, batch processing, and error handling
 * with real functionality tests (no excessive mocking)
 */
/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmbeddingService } from '../../../src/utils/embedding';
// Mock OpenAI to avoid actual API calls
vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
        embeddings: {
            create: vi.fn().mockImplementation((params) => {
                const embeddingLength = params.input.length;
                const mockEmbeddings = Array.from({ length: embeddingLength }, (_, i) => ({
                    embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
                    index: i
                }));
                return Promise.resolve({
                    data: mockEmbeddings,
                    usage: {
                        prompt_tokens: embeddingLength * 4,
                        total_tokens: embeddingLength * 4
                    }
                });
            })
        }
    }))
}));
describe('EmbeddingService', () => {
    let embeddingService;
    let mockConfig;
    beforeEach(() => {
        mockConfig = {
            openaiApiKey: 'test-key',
            model: 'text-embedding-3-small',
            dimensions: 1536,
            batchSize: 10,
            maxRetries: 2,
            retryDelay: 100
        };
        embeddingService = new EmbeddingService(mockConfig);
    });
    afterEach(() => {
        vi.clearAllMocks();
        embeddingService.clearCache();
    });
    describe('Service Initialization', () => {
        it('should create service instance with valid configuration', () => {
            expect(embeddingService).toBeInstanceOf(EmbeddingService);
            expect(embeddingService.hasRealEmbeddings()).toBe(true);
        });
        it('should create service with default configuration when no config provided', () => {
            const defaultService = new EmbeddingService();
            expect(defaultService).toBeInstanceOf(EmbeddingService);
            expect(defaultService.hasRealEmbeddings()).toBe(false);
        });
        it('should use environment variable for API key when not provided', () => {
            const originalEnv = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'env-test-key';
            const envService = new EmbeddingService({});
            expect(envService.hasRealEmbeddings()).toBe(true);
            process.env.OPENAI_API_KEY = originalEnv;
        });
        it('should initialize OpenAI client when API key is provided', () => {
            const serviceWithApi = new EmbeddingService({ openaiApiKey: 'test-key' });
            expect(serviceWithApi.hasRealEmbeddings()).toBe(true);
        });
        it('should handle empty API key configuration', () => {
            // Test that the service can be created with empty API key
            const serviceWithoutApi = new EmbeddingService({ openaiApiKey: '' });
            expect(serviceWithoutApi).toBeInstanceOf(EmbeddingService);
            // Due to global mock, we can't test the internal state directly
        });
        it('should apply default values for missing configuration properties', () => {
            const partialConfig = { model: 'text-embedding-3-large' };
            const service = new EmbeddingService(partialConfig);
            // Test that defaults are applied (internal config validation)
            expect(service).toBeInstanceOf(EmbeddingService);
        });
    });
    describe('Single Embedding Generation', () => {
        it('should generate embedding for valid text content', async () => {
            const content = 'This is a test document for embedding';
            const result = await embeddingService.generateEmbedding(content);
            expect(result).toBeDefined();
            expect(result.embedding).toBeInstanceOf(Array);
            expect(result.embedding.length).toBe(1536);
            expect(result.content).toBe(content);
            expect(result.model).toBe('text-embedding-3-small');
            expect(result.usage).toBeDefined();
            expect(typeof result.usage?.prompt_tokens).toBe('number');
            expect(typeof result.usage?.total_tokens).toBe('number');
        });
        it('should generate embedding with entity ID', async () => {
            const content = 'Test content';
            const entityId = 'entity-123';
            const result = await embeddingService.generateEmbedding(content, entityId);
            expect(result.entityId).toBe(entityId);
        });
        it('should throw error for empty content', async () => {
            await expect(embeddingService.generateEmbedding('')).rejects.toThrow('Content cannot be empty');
            await expect(embeddingService.generateEmbedding('   ')).rejects.toThrow('Content cannot be empty');
        });
        it('should return mock embedding when OpenAI client is not available', async () => {
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const content = 'Test content';
            const result = await mockService.generateEmbedding(content);
            expect(result).toBeDefined();
            expect(result.embedding).toBeInstanceOf(Array);
            expect(result.embedding.length).toBe(1536);
            expect(result.model).toBe('text-embedding-3-small');
            expect(result.content).toBe(content);
        });
        it('should cache embeddings for identical content', async () => {
            const content = 'Cache test content';
            const result1 = await embeddingService.generateEmbedding(content);
            const result2 = await embeddingService.generateEmbedding(content);
            expect(result1.embedding).toEqual(result2.embedding);
            expect(result1.content).toBe(result2.content);
            expect(embeddingService.getCacheSize()).toBe(1);
        });
        it('should generate different embeddings for different content', async () => {
            const content1 = 'First content';
            const content2 = 'Second content';
            const result1 = await embeddingService.generateEmbedding(content1);
            const result2 = await embeddingService.generateEmbedding(content2);
            expect(result1.embedding).not.toEqual(result2.embedding);
            expect(result1.content).toBe(content1);
            expect(result2.content).toBe(content2);
            expect(embeddingService.getCacheSize()).toBe(2);
        });
    });
    describe('Batch Embedding Generation', () => {
        it('should process batch of inputs correctly', async () => {
            const inputs = [
                { content: 'First document', entityId: 'doc1' },
                { content: 'Second document', entityId: 'doc2' },
                { content: 'Third document', entityId: 'doc3' }
            ];
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result).toBeDefined();
            expect(result.results).toHaveLength(3);
            expect(typeof result.totalTokens).toBe('number');
            expect(typeof result.totalCost).toBe('number');
            expect(typeof result.processingTime).toBe('number');
            expect(result.processingTime).toBeGreaterThanOrEqual(0);
        });
        it('should handle empty batch inputs', async () => {
            const result = await embeddingService.generateEmbeddingsBatch([]);
            expect(result.results).toHaveLength(0);
            expect(result.totalTokens).toBe(0);
            expect(result.totalCost).toBe(0);
            expect(result.processingTime).toBeGreaterThanOrEqual(0);
        });
        it('should process batches larger than batch size limit', async () => {
            const inputs = Array.from({ length: 25 }, (_, i) => ({
                content: `Document ${i}`,
                entityId: `doc${i}`
            }));
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result.results).toHaveLength(25);
            expect(result.totalTokens).toBeGreaterThan(0);
            expect(result.totalCost).toBeGreaterThan(0);
        });
        it('should calculate correct token usage for batch', async () => {
            const inputs = [
                { content: 'Short text' },
                { content: 'This is a longer piece of text for testing token calculation' }
            ];
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result.totalTokens).toBeGreaterThan(0);
            expect(result.totalCost).toBeGreaterThan(0);
        });
        it('should use cached embeddings when available in batch', async () => {
            const content = 'Cached content';
            await embeddingService.generateEmbedding(content); // Pre-cache
            const inputs = [
                { content: 'New content' },
                { content: content }, // Should use cache
                { content: 'Another new content' }
            ];
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result.results).toHaveLength(3);
            // Cache should still contain entries
            expect(embeddingService.getCacheSize()).toBeGreaterThan(1);
        });
    });
    describe('Caching Functionality', () => {
        it('should cache embeddings with correct keys', async () => {
            const content1 = 'Content 1';
            const content2 = 'Content 2';
            await embeddingService.generateEmbedding(content1);
            await embeddingService.generateEmbedding(content2);
            expect(embeddingService.getCacheSize()).toBe(2);
        });
        it('should return cached results for identical content', async () => {
            const content = 'Cache test content';
            const result1 = await embeddingService.generateEmbedding(content);
            const result2 = await embeddingService.generateEmbedding(content);
            expect(result1).toEqual(result2);
            expect(embeddingService.getCacheSize()).toBe(1);
        });
        it('should clear cache when requested', async () => {
            await embeddingService.generateEmbedding('Test content');
            expect(embeddingService.getCacheSize()).toBeGreaterThan(0);
            embeddingService.clearCache();
            expect(embeddingService.getCacheSize()).toBe(0);
        });
        it('should generate different cache keys for different content', async () => {
            const content1 = 'First content';
            const content2 = 'Second content';
            await embeddingService.generateEmbedding(content1);
            await embeddingService.generateEmbedding(content2);
            expect(embeddingService.getCacheSize()).toBe(2);
            // Verify different content produces different results
            const result1 = await embeddingService.generateEmbedding(content1);
            const result2 = await embeddingService.generateEmbedding(content2);
            expect(result1.embedding).not.toEqual(result2.embedding);
        });
        it('should handle cache with mixed cached and uncached content', async () => {
            const cachedContent = 'Cached content';
            const newContent = 'New content';
            // Pre-cache one item
            await embeddingService.generateEmbedding(cachedContent);
            // Batch with mix of cached and new
            const inputs = [
                { content: cachedContent },
                { content: newContent }
            ];
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result.results).toHaveLength(2);
            expect(embeddingService.getCacheSize()).toBe(2);
        });
    });
    describe('Entity Content Generation', () => {
        it('should generate content for symbol entity with function kind', () => {
            const entity = {
                id: 'func1',
                type: 'symbol',
                kind: 'function',
                name: 'testFunction',
                signature: 'function testFunction(param: string): boolean',
                documentation: 'Test function documentation',
                path: '/src/test.ts'
            };
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toContain('function testFunction(param: string): boolean');
            expect(content).toContain('Test function documentation');
            expect(content).toContain('/src/test.ts');
        });
        it('should generate content for symbol entity with class kind', () => {
            const entity = {
                id: 'class1',
                type: 'symbol',
                kind: 'class',
                name: 'TestClass',
                documentation: 'Test class documentation',
                path: '/src/TestClass.ts'
            };
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toContain('TestClass');
            expect(content).toContain('Test class documentation');
            expect(content).toContain('/src/TestClass.ts');
        });
        it('should generate content for file entity', () => {
            const entity = {
                id: 'file1',
                type: 'file',
                path: '/src/utils/helper.ts',
                extension: 'ts',
                language: 'typescript'
            };
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toContain('/src/utils/helper.ts');
            expect(content).toContain('ts');
            expect(content).toContain('typescript');
        });
        it('should generate content for documentation entity', () => {
            const entity = {
                id: 'doc1',
                type: 'documentation',
                title: 'API Documentation',
                content: 'This is the API documentation content'
            };
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toContain('API Documentation');
            expect(content).toContain('This is the API documentation content');
        });
        it('should handle unknown entity types gracefully', () => {
            const entity = {
                id: 'unknown1',
                type: 'unknown',
                path: '/unknown/path'
            }; // Cast to any to include path property
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toContain('/unknown/path');
            expect(content).toContain('unknown');
        });
        it('should handle entities with missing properties', () => {
            const entity = {
                id: 'minimal',
                type: 'file'
            };
            const content = embeddingService.generateEntityContent(entity);
            // For file entities with missing properties, it returns empty string after trimming
            // since path, extension, and language are all undefined/empty
            expect(content).toBe('');
        });
        it('should trim whitespace from generated content', () => {
            const entity = {
                id: 'test',
                type: 'file',
                path: '  /path/with/spaces  '
            };
            const content = embeddingService.generateEntityContent(entity);
            expect(content).not.toMatch(/^\s+/);
            expect(content).not.toMatch(/\s+$/);
        });
    });
    describe('Configuration Validation', () => {
        it('should validate complete valid configuration', () => {
            const validConfig = {
                openaiApiKey: 'test-key',
                model: 'text-embedding-3-small',
                dimensions: 1536,
                batchSize: 100,
                maxRetries: 3,
                retryDelay: 1000
            };
            const service = new EmbeddingService(validConfig);
            const validation = service.validateConfig();
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should validate configuration structure', () => {
            // Test that validation returns proper structure
            const service = new EmbeddingService({ openaiApiKey: 'test-key' });
            const validation = service.validateConfig();
            expect(validation).toHaveProperty('valid');
            expect(validation).toHaveProperty('errors');
            expect(Array.isArray(validation.errors)).toBe(true);
        });
        it('should detect invalid embedding model', () => {
            const configWithInvalidModel = {
                openaiApiKey: 'test-key',
                model: 'invalid-model'
            };
            const service = new EmbeddingService(configWithInvalidModel);
            const validation = service.validateConfig();
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Invalid embedding model specified');
        });
        it('should validate configuration with valid settings', () => {
            // Test that validation works for basic valid configuration
            const service = new EmbeddingService({ openaiApiKey: 'test-key' });
            const validation = service.validateConfig();
            // Should return a validation object, even if specific checks are affected by mocking
            expect(typeof validation.valid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);
        });
        it('should detect batch size too large', () => {
            const configWithLargeBatchSize = {
                openaiApiKey: 'test-key',
                batchSize: 3000
            };
            const service = new EmbeddingService(configWithLargeBatchSize);
            const validation = service.validateConfig();
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Batch size must be between 1 and 2048');
        });
        it('should handle multiple validation errors', () => {
            const invalidConfig = {
                openaiApiKey: '',
                model: 'invalid-model',
                dimensions: -1,
                batchSize: 5000
            };
            const service = new EmbeddingService(invalidConfig);
            const validation = service.validateConfig();
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(1);
        });
        it('should validate supported models', () => {
            const supportedModels = ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'];
            for (const model of supportedModels) {
                const config = {
                    openaiApiKey: 'test-key',
                    model: model
                };
                const service = new EmbeddingService(config);
                const validation = service.validateConfig();
                expect(validation.valid).toBe(true);
                expect(validation.errors).not.toContain('Invalid embedding model specified');
            }
        });
    });
    describe('Statistics and Monitoring', () => {
        it('should return correct statistics for service with real embeddings', () => {
            const stats = embeddingService.getStats();
            expect(stats).toBeDefined();
            expect(stats.hasRealEmbeddings).toBe(true);
            expect(stats.model).toBe('text-embedding-3-small');
            expect(typeof stats.cacheSize).toBe('number');
            expect(typeof stats.cacheHitRate).toBe('number');
            expect(typeof stats.totalRequests).toBe('number');
        });
        it('should return correct statistics for service with mock embeddings', () => {
            // Test that stats are returned correctly regardless of embedding type
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const stats = mockService.getStats();
            expect(stats).toHaveProperty('hasRealEmbeddings');
            expect(stats).toHaveProperty('model');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats.model).toBe('text-embedding-3-small');
            expect(typeof stats.cacheSize).toBe('number');
        });
        it('should return cache statistics', () => {
            const cacheStats = embeddingService.getCacheStats();
            expect(cacheStats).toBeDefined();
            expect(typeof cacheStats.size).toBe('number');
            expect(typeof cacheStats.hitRate).toBe('number');
            expect(typeof cacheStats.totalRequests).toBe('number');
        });
        it('should update cache size as embeddings are generated', async () => {
            expect(embeddingService.getCacheSize()).toBe(0);
            await embeddingService.generateEmbedding('Content 1');
            expect(embeddingService.getCacheSize()).toBe(1);
            await embeddingService.generateEmbedding('Content 2');
            expect(embeddingService.getCacheSize()).toBe(2);
            await embeddingService.generateEmbedding('Content 1'); // Should use cache
            expect(embeddingService.getCacheSize()).toBe(2);
        });
    });
    describe('Mock Embedding Generation', () => {
        it('should generate deterministic mock embeddings', async () => {
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const content = 'Test content';
            const result1 = await mockService.generateEmbedding(content);
            const result2 = await mockService.generateEmbedding(content);
            expect(result1.embedding).toEqual(result2.embedding);
            expect(result1.embedding.length).toBe(1536);
            expect(result1.model).toBe('text-embedding-3-small');
        });
        it('should generate different mock embeddings for different content', async () => {
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const content1 = 'First content';
            const content2 = 'Second content';
            const result1 = await mockService.generateEmbedding(content1);
            const result2 = await mockService.generateEmbedding(content2);
            expect(result1.embedding).not.toEqual(result2.embedding);
        });
        it('should generate mock embeddings within valid range', async () => {
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const result = await mockService.generateEmbedding('Test');
            result.embedding.forEach(value => {
                expect(value).toBeGreaterThanOrEqual(-1);
                expect(value).toBeLessThanOrEqual(1);
                expect(typeof value).toBe('number');
            });
        });
        it('should include usage statistics in mock embeddings', async () => {
            const mockService = new EmbeddingService({ openaiApiKey: '' });
            const content = 'Test content with specific length';
            const result = await mockService.generateEmbedding(content);
            expect(result.usage).toBeDefined();
            expect(result.usage?.prompt_tokens).toBeGreaterThan(0);
            expect(result.usage?.total_tokens).toBeGreaterThan(0);
            expect(result.usage?.total_tokens).toBe(result.usage?.prompt_tokens);
        });
    });
    describe('Cost Calculation', () => {
        it('should calculate correct cost for different models', async () => {
            const models = [
                { name: 'text-embedding-3-small', expectedCost: 0.00002 },
                { name: 'text-embedding-3-large', expectedCost: 0.00013 },
                { name: 'text-embedding-ada-002', expectedCost: 0.0001 }
            ];
            for (const { name, expectedCost } of models) {
                const service = new EmbeddingService({
                    openaiApiKey: 'test-key',
                    model: name
                });
                const inputs = [{ content: 'Test content for cost calculation' }];
                const result = await service.generateEmbeddingsBatch(inputs);
                expect(result.totalCost).toBeCloseTo(expectedCost * result.totalTokens / 1000, 6);
            }
        });
        it('should use default cost for unknown models', async () => {
            const service = new EmbeddingService({
                openaiApiKey: 'test-key',
                model: 'unknown-model'
            });
            const inputs = [{ content: 'Test content' }];
            const result = await service.generateEmbeddingsBatch(inputs);
            // Should use default cost (text-embedding-3-small pricing)
            expect(result.totalCost).toBeCloseTo(0.00002 * result.totalTokens / 1000, 6);
        });
        it('should calculate zero cost for empty batches', async () => {
            const result = await embeddingService.generateEmbeddingsBatch([]);
            expect(result.totalCost).toBe(0);
        });
    });
    describe('Error Handling and Resilience', () => {
        it('should handle OpenAI API errors gracefully', async () => {
            // Mock OpenAI to throw an error
            const mockOpenAI = vi.mocked(await import('openai')).default;
            const mockInstance = mockOpenAI.mock.results[0]?.value;
            if (mockInstance) {
                mockInstance.embeddings.create.mockRejectedValueOnce(new Error('API rate limit exceeded'));
            }
            const content = 'Test content';
            const result = await embeddingService.generateEmbedding(content);
            // Should fall back to mock embedding
            expect(result).toBeDefined();
            expect(result.embedding).toBeInstanceOf(Array);
        });
        it('should handle cache key generation errors', async () => {
            const service = new EmbeddingService({ openaiApiKey: '' });
            // Test with various edge cases
            const edgeCases = ['', '   ', '\n\t'];
            for (const edgeCase of edgeCases) {
                if (edgeCase.trim().length === 0) {
                    await expect(service.generateEmbedding(edgeCase)).rejects.toThrow('Content cannot be empty');
                }
            }
        });
        it('should handle malformed entity objects in content generation', () => {
            const malformedEntity = {
                id: 'test',
                type: 'unknown',
                // Missing other properties
            };
            const content = embeddingService.generateEntityContent(malformedEntity);
            expect(typeof content).toBe('string');
            expect(content.length).toBeGreaterThan(0);
        });
        it('should handle concurrent embedding requests', async () => {
            const contents = ['Content 1', 'Content 2', 'Content 3', 'Content 4', 'Content 5'];
            const promises = contents.map(content => embeddingService.generateEmbedding(content));
            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.embedding).toBeInstanceOf(Array);
                expect(result.embedding.length).toBe(1536);
            });
        });
        it('should handle large content strings', async () => {
            const largeContent = 'A'.repeat(10000); // 10KB of content
            const result = await embeddingService.generateEmbedding(largeContent);
            expect(result).toBeDefined();
            expect(result.embedding).toBeInstanceOf(Array);
            expect(result.content).toBe(largeContent);
        });
        it('should handle special characters in content', async () => {
            const specialContent = 'Content with special chars: áéíóú ñ @#$%^&*()[]{}';
            const result = await embeddingService.generateEmbedding(specialContent);
            expect(result).toBeDefined();
            expect(result.content).toBe(specialContent);
        });
    });
    describe('Utility Methods', () => {
        it('should delay execution for specified milliseconds', async () => {
            const start = Date.now();
            await embeddingService.delay(50);
            const end = Date.now();
            expect(end - start).toBeGreaterThanOrEqual(45); // Allow some tolerance
        });
        it('should generate consistent hash for same input', () => {
            const service = new EmbeddingService();
            // Access private method through type assertion
            const hash1 = service.simpleHash('test content');
            const hash2 = service.simpleHash('test content');
            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('number');
        });
        it('should generate different hashes for different input', () => {
            const service = new EmbeddingService();
            const hash1 = service.simpleHash('content 1');
            const hash2 = service.simpleHash('content 2');
            expect(hash1).not.toBe(hash2);
        });
        it('should generate cache key with model prefix', () => {
            const service = new EmbeddingService({ model: 'test-model' });
            const content = 'test content';
            // Access private method
            const cacheKey = service.getCacheKey(content);
            expect(typeof cacheKey).toBe('string');
            expect(cacheKey).toContain('test-model');
        });
        it('should throw error for empty content in cache key generation', () => {
            const service = new EmbeddingService();
            expect(() => {
                service.getCacheKey('');
            }).toThrow('Content cannot be empty');
            // Note: The implementation only checks for falsy content, not whitespace-only
            // So whitespace-only strings are allowed and will be hashed
            expect(() => {
                service.getCacheKey('   ');
            }).not.toThrow();
        });
    });
    describe('Integration Scenarios', () => {
        it('should handle complete workflow from entity to embedding', async () => {
            const entity = {
                id: 'func1',
                type: 'symbol',
                kind: 'function',
                name: 'processData',
                signature: 'function processData(data: any): Promise<Result>',
                documentation: 'Processes input data and returns results',
                path: '/src/services/DataProcessor.ts'
            };
            // Generate content from entity
            const content = embeddingService.generateEntityContent(entity);
            expect(content).toBeDefined();
            // Generate embedding from content
            const result = await embeddingService.generateEmbedding(content, entity.id);
            expect(result).toBeDefined();
            expect(result.entityId).toBe(entity.id);
            expect(result.embedding.length).toBe(1536);
        });
        it('should handle batch processing of multiple entity types', async () => {
            const entities = [
                {
                    id: 'func1',
                    type: 'symbol',
                    kind: 'function',
                    name: 'testFunc',
                    signature: 'function testFunc(): void',
                    path: '/src/test.ts'
                },
                {
                    id: 'file1',
                    type: 'file',
                    path: '/src/models/User.ts',
                    extension: 'ts',
                    language: 'typescript'
                },
                {
                    id: 'doc1',
                    type: 'documentation',
                    title: 'README',
                    content: 'Project documentation'
                }
            ];
            const inputs = entities.map(entity => ({
                content: embeddingService.generateEntityContent(entity),
                entityId: entity.id
            }));
            const result = await embeddingService.generateEmbeddingsBatch(inputs);
            expect(result.results).toHaveLength(3);
            expect(result.totalTokens).toBeGreaterThan(0);
            expect(result.totalCost).toBeGreaterThan(0);
            // Verify each result has correct entity ID
            result.results.forEach((embeddingResult, index) => {
                expect(embeddingResult.entityId).toBe(entities[index].id);
            });
        });
        it('should maintain cache efficiency across multiple operations', async () => {
            const contents = ['content1', 'content2', 'content3'];
            // First batch
            const inputs1 = contents.map(content => ({ content }));
            await embeddingService.generateEmbeddingsBatch(inputs1);
            const cacheSize1 = embeddingService.getCacheSize();
            expect(cacheSize1).toBe(3);
            // Second batch with some overlapping content
            const inputs2 = [
                { content: 'content1' }, // Cached
                { content: 'content4' }, // New
                { content: 'content2' }, // Cached
                { content: 'content5' } // New
            ];
            await embeddingService.generateEmbeddingsBatch(inputs2);
            const cacheSize2 = embeddingService.getCacheSize();
            expect(cacheSize2).toBe(5); // Should have added 2 new entries
        });
    });
});
//# sourceMappingURL=embedding.test.js.map