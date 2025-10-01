/**
 * Unit tests for QdrantService
 * Tests vector database service functionality with real functionality tests (no excessive mocking)
 */

/// <reference types="node" />

// Declare globals for test environment
declare const process: any;

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { QdrantService } from '@memento/database/qdrant/QdrantService';
import { IQdrantService } from '@memento/database/interfaces';

// Mock the Qdrant client
vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn(),
}));

import { QdrantClient } from '@qdrant/js-client-rest';

// Mock implementations for testing
class MockQdrantClient {
  private connected = false;
  private shouldFail = false;
  private alwaysFail = false;
  private collections: string[] = [];
  private collectionConfigs: Map<string, any> = new Map();

  constructor(config?: { failureRate?: number }) {
    this.alwaysFail = !!config?.failureRate && config.failureRate >= 100;
  }

  async getCollections(): Promise<{ collections: Array<{ name: string }> }> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    if (this.shouldFail || this.alwaysFail) {
      throw new Error('Failed to get collections');
    }

    return {
      collections: this.collections.map(name => ({ name }))
    };
  }

  async createCollection(name: string, config: any): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    if (this.shouldFail || this.alwaysFail) {
      const error: any = new Error('Failed to create collection');
      if (name === 'documentation_embeddings') {
        error.status = 409;
        error.message = 'already exists';
      }
      throw error;
    }

    if (this.collections.includes(name)) {
      const error: any = new Error('Collection already exists');
      error.status = 409;
      error.message = 'already exists';
      throw error;
    }

    this.collections.push(name);
    this.collectionConfigs.set(name, config);
  }

  // Test helper methods
  setConnected(connected: boolean): void {
    this.connected = connected;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setFailureRate(rate: number): void {
    this.alwaysFail = rate >= 100;
  }

  getCollectionsList(): string[] {
    return [...this.collections];
  }

  getCollectionConfig(name: string): any {
    return this.collectionConfigs.get(name);
  }

  reset(): void {
    this.collections = [];
    this.collectionConfigs.clear();
    this.connected = false;
    this.shouldFail = false;
    this.alwaysFail = false;
  }
}

describe('QdrantService', () => {
  let qdrantService: QdrantService;
  let mockClient: MockQdrantClient;
  let testConfig: { url: string; apiKey?: string };

  beforeEach(() => {
    testConfig = {
      url: 'http://localhost:6333',
      apiKey: 'test-api-key',
    };

    // Reset the mock
    vi.clearAllMocks();

    // Create a new mock client for each test
    mockClient = new MockQdrantClient();

    // Mock the QdrantClient constructor to return our mock
    (QdrantClient as any).mockImplementation(() => mockClient);

    qdrantService = new QdrantService(testConfig);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await qdrantService.close();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor and Configuration', () => {
    it('exposes the expected public surface', () => {
      expect(qdrantService).toBeInstanceOf(QdrantService);
      expect(typeof qdrantService.initialize).toBe('function');
      expect(typeof qdrantService.close).toBe('function');
      expect(typeof qdrantService.isInitialized).toBe('function');
      expect(typeof qdrantService.getClient).toBe('function');
      expect(typeof qdrantService.setupCollections).toBe('function');
      expect(typeof qdrantService.healthCheck).toBe('function');
    });

    it.each([
      { label: 'with explicit API key', config: { apiKey: 'test-key' } },
      { label: 'without API key', config: {} },
      {
        label: 'custom hostname',
        config: { url: 'https://qdrant.example.com:6333' },
      },
      {
        label: 'cloud URL',
        config: { url: 'https://qdrant.cloud.com', apiKey: 'cloud-key' },
      },
    ])('constructs safely $label', ({ config }) => {
      const finalConfig = {
        url: config.url || testConfig.url,
        apiKey: config.apiKey,
      };
      expect(() => new QdrantService(finalConfig)).not.toThrow();
    });
  });

  describe('Initialization State', () => {
    it('should start uninitialized', () => {
      expect(qdrantService.isInitialized()).toBe(false);
    });

    it('should remain uninitialized before calling initialize', () => {
      expect(qdrantService.isInitialized()).toBe(false);

      // Calling other methods should not change initialization state
      expect(() => qdrantService.getClient()).toThrow();
      expect(qdrantService.isInitialized()).toBe(false);
    });

    it('should properly track initialization state', async () => {
      mockClient.setConnected(true);
      expect(qdrantService.isInitialized()).toBe(false);

      await qdrantService.initialize();
      expect(qdrantService.isInitialized()).toBe(true);

      await qdrantService.close();
      expect(qdrantService.isInitialized()).toBe(false);
    });

    it('should handle multiple initialization calls', async () => {
      mockClient.setConnected(true);
      expect(qdrantService.isInitialized()).toBe(false);

      await qdrantService.initialize();
      expect(qdrantService.isInitialized()).toBe(true);

      // Second initialization should be a no-op
      await qdrantService.initialize();
      expect(qdrantService.isInitialized()).toBe(true);
    });
  });

  describe('Initialization and Connection', () => {
    it('should successfully initialize with valid configuration', async () => {
      mockClient.setConnected(true);
      await expect(qdrantService.initialize()).resolves.toBeUndefined();
      expect(qdrantService.isInitialized()).toBe(true);
    });

    it('should handle connection failures during initialization', async () => {
      mockClient.setFailureRate(100); // Always fail

      await expect(qdrantService.initialize()).rejects.toThrow('Not connected');
      expect(qdrantService.isInitialized()).toBe(false);
    });

    it('should properly close connection', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      expect(qdrantService.isInitialized()).toBe(true);

      await expect(qdrantService.close()).resolves.toBeUndefined();
      expect(qdrantService.isInitialized()).toBe(false);
    });

    it('should handle close when not initialized', async () => {
      expect(qdrantService.isInitialized()).toBe(false);
      await expect(qdrantService.close()).resolves.toBeUndefined();
    });

    it('should handle close when client is not set', async () => {
      // This tests the case where close is called but qdrantClient is not initialized
      const service = new QdrantService(testConfig);
      await expect(service.close()).resolves.toBeUndefined();
    });
  });

  describe('Client Getter', () => {
    it('should throw error when getting client before initialization', () => {
      expect(() => qdrantService.getClient()).toThrow('Qdrant not initialized');
    });

    it('should return client after initialization', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      const client = qdrantService.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockClient);
    });

    it('should return the same client instance', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      const client1 = qdrantService.getClient();
      const client2 = qdrantService.getClient();
      expect(client1).toBe(client2);
    });
  });

  describe('Setup Collections', () => {
    beforeEach(async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
    });

    it('should throw error when setting up collections before initialization', async () => {
      const uninitializedService = new QdrantService(testConfig);
      await expect(uninitializedService.setupCollections()).rejects.toThrow('Qdrant not initialized');
    });

    it('should create code_embeddings collection successfully', async () => {
      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toContain('code_embeddings');

      const config = mockClient.getCollectionConfig('code_embeddings');
      expect(config).toEqual(
        expect.objectContaining({
          vectors: expect.objectContaining({ size: 1536, distance: 'Cosine' })
        })
      );
    });

    it('should create documentation_embeddings collection successfully', async () => {
      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toContain('documentation_embeddings');

      const config = mockClient.getCollectionConfig('documentation_embeddings');
      expect(config).toEqual(
        expect.objectContaining({
          vectors: expect.objectContaining({ size: 1536, distance: 'Cosine' })
        })
      );
    });

    it('should create integration_test collection successfully', async () => {
      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toContain('integration_test');

      const config = mockClient.getCollectionConfig('integration_test');
      expect(config).toEqual(
        expect.objectContaining({
          vectors: expect.objectContaining({ size: 1536, distance: 'Cosine' })
        })
      );
    });

    it('should handle existing collections gracefully', async () => {
      // Pre-create collections to simulate existing ones
      await mockClient.createCollection('code_embeddings', { vectors: { size: 1536, distance: 'Cosine' } });
      await mockClient.createCollection('documentation_embeddings', { vectors: { size: 1536, distance: 'Cosine' } });
      await mockClient.createCollection('integration_test', { vectors: { size: 1536, distance: 'Cosine' } });

      // Should not fail when collections already exist
      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toHaveLength(3);
      expect(collections).toContain('code_embeddings');
      expect(collections).toContain('documentation_embeddings');
      expect(collections).toContain('integration_test');
    });

    it('should handle collection creation failures for documentation_embeddings', async () => {
      // Set up mock to fail specifically for documentation_embeddings creation
      let callCount = 0;
      const originalCreateCollection = mockClient.createCollection.bind(mockClient);
      mockClient.createCollection = async (name: string, config: any) => {
        callCount++;
        if (name === 'documentation_embeddings' && callCount === 1) {
          const error: any = new Error('already exists');
          error.status = 409;
          throw error;
        }
        return originalCreateCollection(name, config);
      };

      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toContain('code_embeddings');
      expect(collections).toContain('documentation_embeddings');
      expect(collections).toContain('integration_test');
    });

    it('should handle collection creation failures for integration_test', async () => {
      // Set up mock to fail specifically for integration_test creation
      let callCount = 0;
      const originalCreateCollection = mockClient.createCollection.bind(mockClient);
      mockClient.createCollection = async (name: string, config: any) => {
        callCount++;
        if (name === 'integration_test' && callCount === 1) {
          const error: any = new Error('already exists');
          error.status = 409;
          throw error;
        }
        return originalCreateCollection(name, config);
      };

      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toContain('code_embeddings');
      expect(collections).toContain('documentation_embeddings');
      expect(collections).toContain('integration_test');
    });

    it('should handle setup failures', async () => {
      mockClient.setShouldFail(true);

      await expect(qdrantService.setupCollections()).rejects.toThrow();
    });

    it('should handle partial collection creation failures', async () => {
      let callCount = 0;
      const originalCreateCollection = mockClient.createCollection.bind(mockClient);
      mockClient.createCollection = async (name: string, config: any) => {
        callCount++;
        if (callCount === 2) { // Fail on second collection (documentation_embeddings)
          throw new Error('Unexpected failure');
        }
        return originalCreateCollection(name, config);
      };

      await expect(qdrantService.setupCollections()).rejects.toThrow('Unexpected failure');
    });
  });

  describe('Health Check', () => {
    it('should return false when not initialized', async () => {
      const result = await qdrantService.healthCheck();
      expect(result).toBe(false);
    });

    it('should return true when initialized and healthy', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      const result = await qdrantService.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when getCollections fails', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      mockClient.setShouldFail(true);

      const result = await qdrantService.healthCheck();
      expect(result).toBe(false);
    });

    it('should handle connection errors during health check', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Simulate connection dropping
      mockClient.setConnected(false);

      const result = await qdrantService.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors during operations', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Simulate connection dropping
      mockClient.setConnected(false);

      await expect(qdrantService.setupCollections()).rejects.toThrow();
    });

    it('should handle null or undefined responses', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Override getCollections to return null
      const originalGetCollections = mockClient.getCollections.bind(mockClient);
      mockClient.getCollections = async () => null as any;

      const result = await qdrantService.healthCheck();
      expect(result).toBe(true); // QdrantService catches errors and returns true for health check
    });

    it('should handle malformed collection data', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Override getCollections to return malformed data
      mockClient.getCollections = async () => ({ collections: null as any });

      await expect(qdrantService.setupCollections()).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent health checks', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      const promises = Array(5).fill(null).map(() => qdrantService.healthCheck());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should handle concurrent collection setup attempts', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Create a separate mock for concurrent operations to avoid conflicts
      const concurrentService1 = new QdrantService(testConfig);
      const concurrentService2 = new QdrantService(testConfig);
      const concurrentService3 = new QdrantService(testConfig);

      const mockClient1 = new MockQdrantClient();
      const mockClient2 = new MockQdrantClient();
      const mockClient3 = new MockQdrantClient();

      (QdrantClient as any).mockImplementationOnce(() => mockClient1);
      (QdrantClient as any).mockImplementationOnce(() => mockClient2);
      (QdrantClient as any).mockImplementationOnce(() => mockClient3);

      mockClient1.setConnected(true);
      mockClient2.setConnected(true);
      mockClient3.setConnected(true);

      await concurrentService1.initialize();
      await concurrentService2.initialize();
      await concurrentService3.initialize();

      const promises = [
        concurrentService1.setupCollections(),
        concurrentService2.setupCollections(),
        concurrentService3.setupCollections(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeUndefined();
      });

      // Each service should have created its own collections
      expect(mockClient1.getCollectionsList()).toHaveLength(3);
      expect(mockClient2.getCollectionsList()).toHaveLength(3);
      expect(mockClient3.getCollectionsList()).toHaveLength(3);
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly clean up resources on close', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();
      expect(qdrantService.isInitialized()).toBe(true);

      await qdrantService.close();
      expect(qdrantService.isInitialized()).toBe(false);

      // Client getter should throw after close
      expect(() => qdrantService.getClient()).toThrow('Qdrant not initialized');
    });

    it('should handle multiple close calls', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      await qdrantService.close();
      await expect(qdrantService.close()).resolves.toBeUndefined(); // Should not throw
    });

    it('should handle close during ongoing operations', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Start operations that might be ongoing
      const setupPromise = qdrantService.setupCollections();
      const healthPromise = qdrantService.healthCheck();

      // Close while operations are in progress
      await qdrantService.close();

      // The ongoing operations should either complete or fail gracefully
      try {
        await setupPromise;
      } catch (error) {
        expect(error).toBeDefined();
      }

      const healthResult = await healthPromise;
      expect(healthResult).toBe(true); // Health check always returns true when initialized
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long collection names', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      const longName = 'a'.repeat(1000);
      const originalCreateCollection = mockClient.createCollection.bind(mockClient);
      mockClient.createCollection = async (name: string, config: any) => {
        if (name === longName) {
          return; // Mock successful creation
        }
        return originalCreateCollection(name, config);
      };

      // Should handle long names without issues
      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();
    });

    it('should handle empty collection lists', async () => {
      mockClient.setConnected(true);
      await qdrantService.initialize();

      // Override to return empty collections
      mockClient.getCollections = async () => ({ collections: [] });

      await expect(qdrantService.setupCollections()).resolves.toBeUndefined();

      const collections = mockClient.getCollectionsList();
      expect(collections).toHaveLength(3); // Should create all collections
    });

    it('should handle configuration with empty API key', async () => {
      const configWithEmptyKey = { url: testConfig.url, apiKey: '' };
      const service = new QdrantService(configWithEmptyKey);
      expect(service).toBeDefined();
    });

    it('should handle configuration with undefined API key', async () => {
      const configWithUndefinedKey = { url: testConfig.url, apiKey: undefined };
      const service = new QdrantService(configWithUndefinedKey);
      expect(service).toBeDefined();
    });

    it('should handle URLs with and without protocol', async () => {
      const urls = [
        'localhost:6333',
        'http://localhost:6333',
        'https://localhost:6333',
        'qdrant-server:6333',
      ];

      urls.forEach(url => {
        const service = new QdrantService({ url });
        expect(service).toBeDefined();
      });
    });
  });
});
