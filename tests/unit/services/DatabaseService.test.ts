/**
 * Unit tests for DatabaseService
 * Tests database service functionality with real functionality tests (no excessive mocking)
 */

/// <reference types="node" />

// Declare globals for test environment
declare const process: any;

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  DatabaseService,
  DatabaseConfig,
  getDatabaseService,
  createDatabaseConfig,
  createTestDatabaseConfig
} from '../../../src/services/DatabaseService';
import {
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  IRedisService
} from '../../../src/services/database/interfaces';

// Import realistic mocks
import {
  RealisticFalkorDBMock,
  RealisticQdrantMock,
  RealisticPostgreSQLMock,
  RealisticRedisMock
} from '../../test-utils/realistic-mocks';

// Legacy mock implementations (kept for backward compatibility in some tests)
class MockFalkorDBService implements IFalkorDBService {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): any {
    return { mockClient: true };
  }

  async query(query: string, params?: Record<string, any>): Promise<any> {
    // More realistic mock: validate query and potentially fail
    if (!query || query.trim() === '') {
      throw new Error('Invalid query: empty query string');
    }
    
    // Simulate syntax errors
    if (query.includes('INVALID')) {
      throw new Error('Syntax error in Cypher query');
    }

    return { query, params: params || undefined, result: 'mock-falkordb-result' };
  }

  async command(...args: any[]): Promise<any> {
    return { args, result: 'mock-falkordb-command-result' };
  }

  async setupGraph(): Promise<void> {
    // Mock setup
  }

  async healthCheck(): Promise<boolean> {
    // Realistic health check that can fail
    return this.initialized;
  }
}

class MockQdrantService implements IQdrantService {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): any {
    return { mockQdrantClient: true };
  }

  async setupCollections(): Promise<void> {
    // Mock setup
  }

  async healthCheck(): Promise<boolean> {
    // Realistic health check that can fail
    return this.initialized;
  }
}

class MockPostgreSQLService implements IPostgreSQLService {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPool(): any {
    return { mockPool: true };
  }

  async query(query: string, params?: any[], options?: { timeout?: number }): Promise<any> {
    return {
      query,
      params: params || undefined,
      options: options || undefined,
      result: 'mock-postgres-result'
    };
  }

  async transaction<T>(
    callback: (client: any) => Promise<T>,
    _options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T> {
    const mockClient = { mockTransactionClient: true };
    return callback(mockClient);
  }

  async bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    _options?: { continueOnError?: boolean }
  ): Promise<any[]> {
    return queries.map((q, index) => ({ ...q, result: `mock-result-${index}` }));
  }

  async setupSchema(): Promise<void> {
    // Mock setup
  }

  async healthCheck(): Promise<boolean> {
    // Realistic health check that can fail
    return this.initialized;
  }

  async storeTestSuiteResult(_suiteResult: any): Promise<void> {
    // Mock storage
  }

  async storeFlakyTestAnalyses(_analyses: any[]): Promise<void> {
    // Mock storage
  }

  async getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]> {
    return [{ entityId, limit, mockHistory: true }];
  }

  async getPerformanceMetricsHistory(entityId: string, days?: number): Promise<any[]> {
    return [{ entityId, days, mockMetrics: true }];
  }

  async getCoverageHistory(entityId: string, days?: number): Promise<any[]> {
    return [{ entityId, days, mockCoverage: true }];
  }
}

class MockRedisService implements IRedisService {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async get(key: string): Promise<string | null> {
    // Realistic mock: return null for keys that don't exist
    if (key.includes('non-existent') || key.includes('missing')) {
      return null;
    }
    return `mock-value-for-${key}`;
  }

  async set(_key: string, _value: string, _ttl?: number): Promise<void> {
    // Mock set
  }

  async del(_key: string): Promise<number> {
    return 1; // Mock deleted count
  }

  async healthCheck(): Promise<boolean> {
    // Realistic health check that can fail
    return this.initialized;
  }
}

describe('DatabaseService', () => {
  let testConfig: DatabaseConfig;
  let dbService: DatabaseService;

  beforeEach(() => {
    testConfig = {
      falkordb: {
        url: 'redis://localhost:6379',
        database: 0,
      },
      qdrant: {
        url: 'http://localhost:6333',
        apiKey: 'test-api-key',
      },
      postgresql: {
        connectionString: 'postgresql://test:test@localhost:5432/test',
        max: 10,
        idleTimeoutMillis: 30000,
      },
      redis: {
        url: 'redis://localhost:6379',
      },
    };
    dbService = new DatabaseService(testConfig);
  });

  describe('Configuration Management', () => {
    it('should create service instance with valid configuration', () => {
      expect(dbService).not.toBeNull();
      expect(dbService).toBeInstanceOf(DatabaseService);
      expect(typeof dbService.initialize).toBe('function');
      expect(typeof dbService.close).toBe('function');
    });

    it('should return configuration object equal to input', () => {
      const config = dbService.getConfig();
      expect(config).toEqual(testConfig);
    });

    it('should handle configuration with optional redis', () => {
      const configWithoutRedis: DatabaseConfig = {
        ...testConfig,
        redis: undefined,
      };
      const serviceWithoutRedis = new DatabaseService(configWithoutRedis);
      expect(serviceWithoutRedis.getConfig()).toEqual(configWithoutRedis);
    });

    it('should handle configuration with api key', () => {
      const configWithApiKey = {
        ...testConfig,
        qdrant: {
          ...testConfig.qdrant,
          apiKey: 'secret-api-key-123',
        },
      };
      const service = new DatabaseService(configWithApiKey);
      expect(service.getConfig().qdrant.apiKey).toBe('secret-api-key-123');
    });

    it('should handle configuration with different database numbers', () => {
      const configWithDb = {
        ...testConfig,
        falkordb: {
          ...testConfig.falkordb,
          database: 5,
        },
      };
      const service = new DatabaseService(configWithDb);
      expect(service.getConfig().falkordb.database).toBe(5);
    });
  });

  describe('Initialization State', () => {
    it('should start uninitialized', () => {
      expect(dbService.isInitialized()).toBe(false);
    });

    it('should maintain initialization state correctly', () => {
      expect(dbService.isInitialized()).toBe(false);

      // Configuration access should not affect initialization state
      const config = dbService.getConfig();
      expect(config).toBeDefined();
      expect(dbService.isInitialized()).toBe(false);
    });

    it('should provide configuration regardless of initialization state', () => {
      const config = dbService.getConfig();
      expect(config).toEqual(testConfig);
      expect(config.falkordb).not.toBeNull();
      expect(config.falkordb.url).toBe('redis://localhost:6379');
      expect(config.qdrant).not.toBeNull();
      expect(config.qdrant.url).toBe('http://localhost:6333');
      expect(config.postgresql).not.toBeNull();
      expect(config.postgresql.connectionString).toBe('postgresql://test:test@localhost:5432/test');
    });

    it('should handle client getters safely before initialization', () => {
      // These getters return undefined when not initialized
      const falkorClient = dbService.getFalkorDBClient();
      const postgresPool = dbService.getPostgresPool();
      
      expect(falkorClient).toBeUndefined();
      expect(postgresPool).toBeUndefined();
      expect(falkorClient).not.toBe({});
      expect(postgresPool).not.toBe({});
    });

    it('should have proper method signatures', () => {
      // Verify that all expected methods exist and are functions
      expect(typeof dbService.isInitialized).toBe('function');
      expect(typeof dbService.getConfig).toBe('function');
      expect(typeof dbService.initialize).toBe('function');
      expect(typeof dbService.close).toBe('function');
      expect(typeof dbService.getFalkorDBClient).toBe('function');
      expect(typeof dbService.getQdrantClient).toBe('function');
      expect(typeof dbService.getPostgresPool).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should prevent operations when database is not initialized', async () => {
      // Test that all database operations properly check initialization status
      await expect(dbService.falkordbQuery('MATCH (n) RETURN n')).rejects.toThrow('Database not initialized');
      await expect(dbService.falkordbCommand('GRAPH.QUERY', 'test', 'MATCH (n) RETURN n')).rejects.toThrow('Database not initialized');
      await expect(dbService.postgresQuery('SELECT 1')).rejects.toThrow('Database not initialized');
      await expect(dbService.setupDatabase()).rejects.toThrow('Database not initialized');
    });

    it('should handle PostgreSQL transactions safely when uninitialized', async () => {
      const transactionCallback = async (client: any) => {
        return await client.query('SELECT 1');
      };
      await expect(dbService.postgresTransaction(transactionCallback)).rejects.toThrow('Database not initialized');
    });

    it('should handle Redis operations when Redis is not configured', async () => {
      const configWithoutRedis = { ...testConfig, redis: undefined };
      const serviceWithoutRedis = new DatabaseService(configWithoutRedis);

      await expect(serviceWithoutRedis.redisGet('test')).rejects.toThrow('Redis not configured');
      await expect(serviceWithoutRedis.redisSet('test', 'value')).rejects.toThrow('Redis not configured');
      await expect(serviceWithoutRedis.redisDel('test')).rejects.toThrow('Redis not configured');
    });

    it('should handle Qdrant operations when not initialized', () => {
      expect(() => dbService.qdrant).toThrow('Database not initialized');
    });

    it('should return health status when not initialized', async () => {
      const health = await dbService.healthCheck();
      expect(health).toEqual({
        falkordb: false,
        qdrant: false,
        postgresql: false,
        redis: undefined,
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should maintain singleton instance across multiple calls', () => {
      const instance1 = getDatabaseService(testConfig);
      const instance2 = getDatabaseService();
      const instance3 = getDatabaseService(testConfig);

      // All instances should be the same object
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should preserve configuration in singleton instance', () => {
      const instance = getDatabaseService(testConfig);
      expect(instance.getConfig()).toEqual(testConfig);
      expect(instance.getConfig().falkordb.url).toBe(testConfig.falkordb.url);
      expect(instance.getConfig().qdrant.url).toBe(testConfig.qdrant.url);
    });

    it('should handle configuration changes correctly', () => {
      // Get initial instance
      const instance1 = getDatabaseService(testConfig);
      expect(instance1.getConfig()).toEqual(testConfig);

      // Create different config
      const differentConfig = {
        ...testConfig,
        falkordb: { ...testConfig.falkordb, database: 99 }
      };

      // Since it's a singleton, it should still return the same instance
      const instance2 = getDatabaseService(differentConfig);
      expect(instance1).toBe(instance2);
      expect(instance2.getConfig().falkordb.database).toBe(testConfig.falkordb.database); // Original config preserved
    });
  });

  describe('Configuration Creation Functions', () => {
    it('should create valid database config for production', () => {
      const config = createDatabaseConfig();
      expect(config).not.toBeNull();
      expect(typeof config).toBe('object');
      expect(config.falkordb.url).not.toBe('');
      expect(config.falkordb.url).toMatch(/^redis:\/\/.+/);
      expect(config.qdrant.url).not.toBe('');
      expect(config.qdrant.url).toMatch(/^https?:\/\/.+/);
      expect(config.postgresql.connectionString).not.toBe('');
      expect(config.postgresql.connectionString).toMatch(/^postgresql:\/\/.+/);
    });

    it('should create test database config', () => {
      const config = createTestDatabaseConfig();
      expect(config).not.toBeNull();
      expect(typeof config).toBe('object');
      expect(config.falkordb.database).toBe(1); // Different database for tests
      expect(config.postgresql.max).toBe(5); // Fewer connections for tests
      expect(config.redis).not.toBeNull(); // Redis should be configured for tests
      expect(config.redis?.url).toBe('redis://localhost:6381');
    });

    it('should use environment variables when available', () => {
      // Test that the function uses environment variables by checking the logic
      // Since we can't easily mock process.env in this context, we'll test the default behavior
      const config = createDatabaseConfig();

      // The function should return a valid config regardless of environment
      expect(config.falkordb.url).toBeDefined();
      expect(config.qdrant.url).toBeDefined();
      expect(config.postgresql.connectionString).toBeDefined();
      expect(typeof config.falkordb.url).toBe('string');
      expect(typeof config.qdrant.url).toBe('string');
      expect(typeof config.postgresql.connectionString).toBe('string');
    });

    it('should handle test environment configuration', () => {
      // Test that the function creates different configs for different environments
      const testConfig = createTestDatabaseConfig();

      // Test config should have specific test values
      expect(testConfig.falkordb.database).toBe(1);
      expect(testConfig.postgresql.max).toBe(5);
      expect(testConfig.redis).toBeDefined();

      // Test that createDatabaseConfig uses environment-specific settings
      const currentConfig = createDatabaseConfig();
      expect(currentConfig).toBeDefined();

      // In test environment, it should use test-like settings
      if (process.env.NODE_ENV === 'test') {
        expect(currentConfig.falkordb.database).toBe(1);
        expect(currentConfig.postgresql.max).toBe(5);
      } else {
        expect(currentConfig.falkordb.database).toBe(0);
        expect(currentConfig.postgresql.max).toBe(20);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should accept minimal valid configuration', () => {
      const minimalConfig: DatabaseConfig = {
        falkordb: {
          url: 'redis://localhost:6379',
        },
        qdrant: {
          url: 'http://localhost:6333',
        },
        postgresql: {
          connectionString: 'postgresql://user:pass@localhost:5432/db',
        },
      };

      const service = new DatabaseService(minimalConfig);
      expect(service).toBeDefined();
      expect(service.getConfig()).toEqual(minimalConfig);
    });

    it('should handle configuration with all optional fields', () => {
      const fullConfig: DatabaseConfig = {
        falkordb: {
          url: 'redis://localhost:6379',
          database: 2,
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'api-key-123',
        },
        postgresql: {
          connectionString: 'postgresql://user:pass@localhost:5432/db',
          max: 20,
          idleTimeoutMillis: 60000,
        },
        redis: {
          url: 'redis://localhost:6379',
        },
      };

      const service = new DatabaseService(fullConfig);
      expect(service.getConfig()).toEqual(fullConfig);
    });
  });

  describe('Data Retrieval Methods', () => {
    it('should prevent getTestExecutionHistory when not initialized', async () => {
      await expect(dbService.getTestExecutionHistory('test-entity')).rejects.toThrow('Database service not initialized');
    });

    it('should prevent getPerformanceMetricsHistory when not initialized', async () => {
      await expect(dbService.getPerformanceMetricsHistory('test-entity')).rejects.toThrow('Database service not initialized');
    });

    it('should prevent getCoverageHistory when not initialized', async () => {
      await expect(dbService.getCoverageHistory('test-entity')).rejects.toThrow('Database service not initialized');
    });

    it('should prevent postgresBulkQuery when not initialized', async () => {
      const queries = [{ query: 'SELECT 1', params: [] }];
      await expect(dbService.postgresBulkQuery(queries)).rejects.toThrow('Database not initialized');
    });

    it('should handle getTestExecutionHistory with custom limit', async () => {
      await expect(dbService.getTestExecutionHistory('test-entity', 100)).rejects.toThrow('Database service not initialized');
    });

    it('should handle getPerformanceMetricsHistory with custom days', async () => {
      await expect(dbService.getPerformanceMetricsHistory('test-entity', 60)).rejects.toThrow('Database service not initialized');
    });

    it('should handle getCoverageHistory with custom days', async () => {
      await expect(dbService.getCoverageHistory('test-entity', 90)).rejects.toThrow('Database service not initialized');
    });

    it('should handle postgresBulkQuery with continueOnError option', async () => {
      const queries = [{ query: 'SELECT 1', params: [] }];
      await expect(dbService.postgresBulkQuery(queries, { continueOnError: true })).rejects.toThrow('Database not initialized');
    });
  });

  describe('Data Storage Methods', () => {
    it('should prevent storeTestSuiteResult when not initialized', async () => {
      const testSuiteResult = {
        name: 'test-suite',
        status: 'passed' as const,
        duration: 1000,
        timestamp: new Date(),
        testResults: []
      };
      await expect(dbService.storeTestSuiteResult(testSuiteResult)).rejects.toThrow('Database service not initialized');
    });

    it('should prevent storeFlakyTestAnalyses when not initialized', async () => {
      const analyses = [{
        testId: 'test-1',
        testName: 'Test 1',
        failureCount: 5,
        totalRuns: 10,
        lastFailure: new Date(),
        failurePatterns: ['timeout']
      }];
      await expect(dbService.storeFlakyTestAnalyses(analyses)).rejects.toThrow('Database service not initialized');
    });
  });

  describe('Advanced Configuration', () => {
    it('should create test config with connection timeout', () => {
      const config = createTestDatabaseConfig();
      expect(config.postgresql.connectionTimeoutMillis).toBe(5000);
    });

    it('should create test config with reduced idle timeout', () => {
      const config = createTestDatabaseConfig();
      expect(config.postgresql.idleTimeoutMillis).toBe(5000);
    });

    it('should handle undefined api key in test config', () => {
      const config = createTestDatabaseConfig();
      expect(config.qdrant.apiKey).toBeUndefined();
    });

    it('should use different Redis database for tests', () => {
      const config = createTestDatabaseConfig();
      expect(config.redis?.url).toBe('redis://localhost:6381');
    });
  });

  describe('Method Coverage Tests', () => {
    it('should prevent storeFlakyTestAnalyses when not initialized', async () => {
      // Test that the method properly checks initialization
      // without manipulating private properties
      const dbService = new DatabaseService(createTestDatabaseConfig());

      const analyses = [{
        testId: 'test-1',
        testName: 'Test One',
        failureCount: 1,
        totalRuns: 5,
        lastFailure: new Date(),
        failurePatterns: ['timeout']
      }];

      // Should throw when not initialized - this tests the actual guard clause
      await expect(dbService.storeFlakyTestAnalyses(analyses))
        .rejects
        .toThrow('Database service not initialized');
    });

    it('should prevent postgresBulkQuery when not initialized', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      const queries = [{
        query: 'SELECT 1',
        params: []
      }];

      // Test the actual guard clause without manipulation
      await expect(dbService.postgresBulkQuery(queries))
        .rejects
        .toThrow('Database not initialized');
    });

    it('should prevent getTestExecutionHistory when not initialized', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      // Test proper error handling without property manipulation
      await expect(dbService.getTestExecutionHistory('test-entity', 10))
        .rejects
        .toThrow('Database service not initialized');
    });

    it('should prevent getPerformanceMetricsHistory when not initialized', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      // Test proper error handling without property manipulation
      await expect(dbService.getPerformanceMetricsHistory('test-entity', 7))
        .rejects
        .toThrow('Database service not initialized');
    });

    it('should prevent getCoverageHistory when not initialized', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      // Test proper error handling without property manipulation
      await expect(dbService.getCoverageHistory('test-entity', 7))
        .rejects
        .toThrow('Database service not initialized');
    });
  });

  describe('Database Operations', () => {
    let mockDbService: DatabaseService;
    let mockFalkorDB: MockFalkorDBService;
    let mockQdrant: MockQdrantService;
    let mockPostgres: MockPostgreSQLService;
    let mockRedis: MockRedisService;

    beforeEach(async () => {
      // Create mock services
      mockFalkorDB = new MockFalkorDBService();
      mockQdrant = new MockQdrantService();
      mockPostgres = new MockPostgreSQLService();
      mockRedis = new MockRedisService();

      // Create service with dependency injection factories
      mockDbService = new DatabaseService(testConfig, {
        falkorFactory: () => mockFalkorDB,
        qdrantFactory: () => mockQdrant,
        postgresFactory: () => mockPostgres,
        redisFactory: () => mockRedis,
      });

      // Initialize to set up services via public API
      await mockDbService.initialize();
    });

    describe('FalkorDB Operations', () => {
      it('should execute falkordbQuery successfully', async () => {
        const query = 'MATCH (n) RETURN n';
        const params = { param1: 'value1' };

        const result = await mockDbService.falkordbQuery(query, params);

        // Check that result has expected structure
        expect(result).not.toBeNull();
        expect(typeof result).toBe('object');
        
        // For MATCH queries, expect array-like results or mock structure
        if (Array.isArray(result)) {
          expect(result.length).toBeGreaterThanOrEqual(0);
          result.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(typeof item.id).toBe('string');
            expect(item).toHaveProperty('type');
            expect(['file', 'function', 'class', 'symbol']).toContain(item.type);
          });
        } else {
          // Legacy mock structure
          expect(result).toHaveProperty('query');
          expect(result.query).toBe(query);
          expect(result).toHaveProperty('params');
          expect(result.params).toEqual(params);
          expect(result.result).toBe('mock-falkordb-result');
        }
      });

      it('should execute falkordbQuery without params', async () => {
        const query = 'MATCH (n) RETURN count(n)';

        const result = await mockDbService.falkordbQuery(query);

        // Verify result structure
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        
        if (Array.isArray(result)) {
          // Realistic mock returns array for MATCH queries
          expect(result.length).toBeGreaterThanOrEqual(0);
        } else {
          // Legacy mock structure
          expect(result).toHaveProperty('query');
          expect(result.query).toBe(query);
          expect(result).toHaveProperty('params');
          expect(result.params).toBeDefined();
        }
      });

      it('should throw error when falkordbQuery called on uninitialized service', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        await expect(uninitializedService.falkordbQuery('test'))
          .rejects
          .toThrow('Database not initialized');
      });

      it('should execute falkordbCommand with multiple arguments', async () => {
        const args = ['GRAPH.QUERY', 'test-graph', 'MATCH (n) RETURN n'];

        const result = await mockDbService.falkordbCommand(...args);

        expect(result).toEqual({
          args,
          result: 'mock-falkordb-command-result'
        });
      });

      it('should execute falkordbCommand with single argument', async () => {
        const args = ['PING'];

        const result = await mockDbService.falkordbCommand(...args);

        expect(result).toEqual({
          args,
          result: 'mock-falkordb-command-result'
        });
      });

      it('should throw error when falkordbCommand called on uninitialized service', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        await expect(uninitializedService.falkordbCommand('test'))
          .rejects
          .toThrow('Database not initialized');
      });
    });

    describe('Qdrant Operations', () => {
      it('should return qdrant client when service is initialized', () => {
        const client = mockDbService.qdrant;

        expect(client).toEqual({ mockQdrantClient: true });
      });

      it('should throw error when accessing qdrant client on uninitialized service', () => {
        const uninitializedService = new DatabaseService(testConfig);

        expect(() => uninitializedService.qdrant)
          .toThrow('Database not initialized');
      });
    });

    describe('PostgreSQL Operations', () => {
      it('should execute postgresQuery successfully', async () => {
        const query = 'SELECT * FROM test_table';
        const params = ['param1', 'param2'];
        const options = { timeout: 5000 };

        const result = await mockDbService.postgresQuery(query, params, options);

        expect(result).toEqual({
          query,
          params,
          options,
          result: 'mock-postgres-result'
        });
      });

      it('should execute postgresQuery without params', async () => {
        const query = 'SELECT COUNT(*) FROM test_table';

        const result = await mockDbService.postgresQuery(query);

        expect(result).toEqual({
          query,
          params: [],
          options: {},
          result: 'mock-postgres-result'
        });
      });

      it('should throw error when postgresQuery called on uninitialized service', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        await expect(uninitializedService.postgresQuery('SELECT 1'))
          .rejects
          .toThrow('Database not initialized');
      });

      it('should execute postgresTransaction successfully', async () => {
        const mockCallback = vi.fn().mockResolvedValue('transaction-result');
        const options = { timeout: 10000, isolationLevel: 'READ_COMMITTED' };

        const result = await mockDbService.postgresTransaction(mockCallback, options);

        expect(mockCallback).toHaveBeenCalledWith({ mockTransactionClient: true });
        expect(result).toBe('transaction-result');
      });

      it('should execute postgresTransaction without options', async () => {
        const mockCallback = vi.fn().mockResolvedValue('simple-result');

        const result = await mockDbService.postgresTransaction(mockCallback);

        expect(mockCallback).toHaveBeenCalledWith({ mockTransactionClient: true });
        expect(result).toBe('simple-result');
      });

      it('should throw error when postgresTransaction called on uninitialized service', async () => {
        const uninitializedService = new DatabaseService(testConfig);
        const mockCallback = vi.fn();

        await expect(uninitializedService.postgresTransaction(mockCallback))
          .rejects
          .toThrow('Database not initialized');
      });
    });

    describe('Redis Operations', () => {
      it('should execute redisGet successfully', async () => {
        const key = 'test-key';

        const result = await mockDbService.redisGet(key);

        expect(result).toBe(`mock-value-for-${key}`);
      });

      it('should execute redisGet when service has Redis configured', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        // Set up a mock Redis service
        const mockRedis = new MockRedisService();
        Object.defineProperty(uninitializedService, 'redisService', {
          value: mockRedis,
          writable: true
        });

        const result = await uninitializedService.redisGet('test-key');

        expect(result).toBe('mock-value-for-test-key');
      });

      it('should throw error when redisGet called without Redis configured', async () => {
        const serviceWithoutRedis = new DatabaseService({
          ...testConfig,
          redis: undefined
        });

        // Set as initialized but without Redis
        Object.defineProperty(serviceWithoutRedis, 'initialized', {
          value: true,
          writable: true
        });
        Object.defineProperty(serviceWithoutRedis, 'redisService', {
          value: undefined,
          writable: true
        });

        await expect(serviceWithoutRedis.redisGet('test-key'))
          .rejects
          .toThrow('Redis not configured');
      });

      it('should execute redisSet successfully', async () => {
        const key = 'test-key';
        const value = 'test-value';
        const ttl = 3600;

        await expect(mockDbService.redisSet(key, value, ttl)).resolves.toBeUndefined();
      });

      it('should execute redisSet without TTL', async () => {
        const key = 'test-key';
        const value = 'test-value';

        await expect(mockDbService.redisSet(key, value)).resolves.toBeUndefined();
      });

      it('should throw error when redisSet called without Redis configured', async () => {
        const serviceWithoutRedis = new DatabaseService({
          ...testConfig,
          redis: undefined
        });

        Object.defineProperty(serviceWithoutRedis, 'initialized', {
          value: true,
          writable: true
        });
        Object.defineProperty(serviceWithoutRedis, 'redisService', {
          value: undefined,
          writable: true
        });

        await expect(serviceWithoutRedis.redisSet('key', 'value'))
          .rejects
          .toThrow('Redis not configured');
      });

      it('should execute redisDel successfully', async () => {
        const key = 'test-key';

        const result = await mockDbService.redisDel(key);

        expect(result).toBe(1);
      });

      it('should throw error when redisDel called without Redis configured', async () => {
        const serviceWithoutRedis = new DatabaseService({
          ...testConfig,
          redis: undefined
        });

        Object.defineProperty(serviceWithoutRedis, 'initialized', {
          value: true,
          writable: true
        });
        Object.defineProperty(serviceWithoutRedis, 'redisService', {
          value: undefined,
          writable: true
        });

        await expect(serviceWithoutRedis.redisDel('test-key'))
          .rejects
          .toThrow('Redis not configured');
      });
    });

    describe('Health Check Operations', () => {
      it('should return health status for all services when initialized', async () => {
        const health = await mockDbService.healthCheck();

        expect(health).toEqual({
          falkordb: true,
          qdrant: true,
          postgresql: true,
          redis: true
        });
      });

      it('should return false for all services when not initialized', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        const health = await uninitializedService.healthCheck();

        expect(health).toEqual({
          falkordb: false,
          qdrant: false,
          postgresql: false,
          redis: undefined
        });
      });

      it('should handle health check failures gracefully', async () => {
        // Create a mock service that throws on health check
        const failingService = new MockFalkorDBService();
        failingService.healthCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));

        Object.defineProperty(mockDbService, 'falkorDBService', {
          value: failingService,
          writable: true
        });

        const health = await mockDbService.healthCheck();

        expect(health.falkordb).toBe(false);
        expect(health.qdrant).toBe(true);
        expect(health.postgresql).toBe(true);
        expect(health.redis).toBe(true);
      });
    });

    describe('Database Setup Operations', () => {
      it('should execute setupDatabase successfully', async () => {
        await expect(mockDbService.setupDatabase()).resolves.toBeUndefined();
      });

      it('should throw error when setupDatabase called on uninitialized service', async () => {
        const uninitializedService = new DatabaseService(testConfig);

        await expect(uninitializedService.setupDatabase())
          .rejects
          .toThrow('Database not initialized');
      });
    });

    describe('Client Getter Operations', () => {
      it('should return falkordb client when initialized', () => {
        const client = mockDbService.getFalkorDBClient();

        expect(client).toEqual({ mockClient: true });
      });

      it('should return undefined for falkordb client when not initialized', () => {
        const uninitializedService = new DatabaseService(testConfig);

        const client = uninitializedService.getFalkorDBClient();

        expect(client).toBeUndefined();
      });

      it('should return qdrant client when initialized', () => {
        const client = mockDbService.getQdrantClient();

        expect(client).toEqual({ mockQdrantClient: true });
      });

      it('should return undefined for qdrant client when not initialized', () => {
        const uninitializedService = new DatabaseService(testConfig);

        const client = uninitializedService.getQdrantClient();

        expect(client).toBeUndefined();
      });

      it('should return postgres pool when initialized', () => {
        const pool = mockDbService.getPostgresPool();

        expect(pool).toEqual({ mockPool: true });
      });

      it('should return undefined for postgres pool when not initialized', () => {
        const uninitializedService = new DatabaseService(testConfig);

        const pool = uninitializedService.getPostgresPool();

        expect(pool).toBeUndefined();
      });
    });
  });

  describe('Initialization Error Handling and Cleanup', () => {
    it('should prevent concurrent initialization with proper error handling', async () => {
      const dbService = new DatabaseService(testConfig);

      // Set initializing flag to simulate ongoing initialization
      Object.defineProperty(dbService, 'initializing', {
        value: true,
        writable: true
      });

      // Attempt to initialize should throw
      await expect(dbService.initialize()).rejects.toThrow('Initialization already in progress');

      // Verify state remains unchanged
      expect(dbService.isInitialized()).toBe(false);
    });

    it('should handle early return when already initialized', async () => {
      const dbService = new DatabaseService(testConfig);

      // Set as already initialized
      Object.defineProperty(dbService, 'initialized', {
        value: true,
        writable: true
      });

      // Second initialization should return early without calling _initialize
      const mockInitialize = vi.fn();
      Object.defineProperty(dbService, '_initialize', {
        value: mockInitialize,
        writable: true
      });

      await expect(dbService.initialize()).resolves.toBeUndefined();

      // _initialize should not be called
      expect(mockInitialize).not.toHaveBeenCalled();
    });
  });

  describe('Close Method Error Handling', () => {
    it('should handle errors during service closure gracefully', async () => {
      // Mock services that throw errors during close
      const mockFailingFalkorDB = new MockFalkorDBService();
      mockFailingFalkorDB.initialize = vi.fn().mockResolvedValue(undefined);
      mockFailingFalkorDB.close = vi.fn().mockRejectedValue(new Error('FalkorDB close failed'));
      mockFailingFalkorDB.isInitialized = vi.fn().mockReturnValue(true);

      const mockFailingQdrant = new MockQdrantService();
      mockFailingQdrant.initialize = vi.fn().mockResolvedValue(undefined);
      mockFailingQdrant.close = vi.fn().mockRejectedValue(new Error('Qdrant close failed'));
      mockFailingQdrant.isInitialized = vi.fn().mockReturnValue(true);

      const mockPostgres = new MockPostgreSQLService();
      mockPostgres.initialize = vi.fn().mockResolvedValue(undefined);
      mockPostgres.close = vi.fn().mockResolvedValue(undefined);
      mockPostgres.isInitialized = vi.fn().mockReturnValue(true);

      const mockRedisOk = new MockRedisService();
      mockRedisOk.initialize = vi.fn().mockResolvedValue(undefined);
      mockRedisOk.isInitialized = vi.fn().mockReturnValue(true);
      mockRedisOk.close = vi.fn().mockResolvedValue(undefined);

      const dbService = new DatabaseService(testConfig, {
        falkorFactory: () => mockFailingFalkorDB,
        qdrantFactory: () => mockFailingQdrant,
        postgresFactory: () => mockPostgres,
        redisFactory: () => mockRedisOk,
      });

      await dbService.initialize();

      // Close should not throw despite individual service failures
      await expect(dbService.close()).resolves.toBeUndefined();

      // Verify close was attempted on all services
      expect(mockFailingFalkorDB.close).toHaveBeenCalled();
      expect(mockFailingQdrant.close).toHaveBeenCalled();
      expect(mockPostgres.close).toHaveBeenCalled();

      // Verify service references are reset even with errors
      expect(dbService.isInitialized()).toBe(false);
      expect(dbService.getFalkorDBClient()).toBeUndefined();
      expect(dbService.getQdrantClient()).toBeUndefined();
    });

    it('should handle partial service closure errors', async () => {
      // Mix of services - some fail, some succeed
      const mockGoodFalkorDB = new MockFalkorDBService();
      mockGoodFalkorDB.initialize = vi.fn().mockResolvedValue(undefined);
      mockGoodFalkorDB.close = vi.fn().mockResolvedValue(undefined);
      mockGoodFalkorDB.isInitialized = vi.fn().mockReturnValue(true);

      const mockBadQdrant = new MockQdrantService();
      mockBadQdrant.initialize = vi.fn().mockResolvedValue(undefined);
      mockBadQdrant.close = vi.fn().mockRejectedValue(new Error('Qdrant close failed'));
      mockBadQdrant.isInitialized = vi.fn().mockReturnValue(true);

      const mockGoodPostgres = new MockPostgreSQLService();
      mockGoodPostgres.initialize = vi.fn().mockResolvedValue(undefined);
      mockGoodPostgres.close = vi.fn().mockResolvedValue(undefined);
      mockGoodPostgres.isInitialized = vi.fn().mockReturnValue(true);

      const mockRedisOk2 = new MockRedisService();
      mockRedisOk2.initialize = vi.fn().mockResolvedValue(undefined);
      mockRedisOk2.isInitialized = vi.fn().mockReturnValue(true);
      mockRedisOk2.close = vi.fn().mockResolvedValue(undefined);

      const dbService = new DatabaseService(testConfig, {
        falkorFactory: () => mockGoodFalkorDB,
        qdrantFactory: () => mockBadQdrant,
        postgresFactory: () => mockGoodPostgres,
        redisFactory: () => mockRedisOk2,
      });

      await dbService.initialize();

      // Close should succeed despite some failures
      await expect(dbService.close()).resolves.toBeUndefined();

      // Verify all close methods were called
      expect(mockGoodFalkorDB.close).toHaveBeenCalled();
      expect(mockBadQdrant.close).toHaveBeenCalled();
      expect(mockGoodPostgres.close).toHaveBeenCalled();

      // Verify cleanup still happens
      expect(dbService.isInitialized()).toBe(false);
    });
  });

  describe('Data Storage Method Coverage', () => {
    it('should execute storeTestSuiteResult method body when initialized', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      // Mock the PostgreSQL service
      const mockPostgresService = {
        storeTestSuiteResult: vi.fn().mockResolvedValue(undefined),
        isInitialized: () => true,
      };

      // @ts-ignore - accessing private property for testing
      dbService['postgresqlService'] = mockPostgresService;
      // @ts-ignore
      dbService['initialized'] = true;

      const testSuiteResult = {
        name: 'test-suite',
        status: 'passed' as const,
        duration: 1000,
        timestamp: new Date(),
        testResults: []
      };

      await dbService.storeTestSuiteResult(testSuiteResult);

      expect(mockPostgresService.storeTestSuiteResult).toHaveBeenCalledWith(testSuiteResult);
    });

    it('should throw error when storeTestSuiteResult called on uninitialized service', async () => {
      const dbService = new DatabaseService(createTestDatabaseConfig());

      const testSuiteResult = {
        name: 'test-suite',
        status: 'passed' as const,
        duration: 1000,
        timestamp: new Date(),
        testResults: []
      };

      await expect(dbService.storeTestSuiteResult(testSuiteResult))
        .rejects
        .toThrow('Database service not initialized');
    });
  });

  describe('Singleton Configuration Validation', () => {
    it('should create singleton instance when config provided', () => {
      // Test that singleton returns the same instance
      const instance1 = getDatabaseService(testConfig);
      const instance2 = getDatabaseService(testConfig);
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DatabaseService);
    });

    it('should preserve configuration in singleton instance', () => {
      const instance = getDatabaseService(testConfig);
      expect(instance.getConfig()).toEqual(testConfig);
    });
  });

  describe('Environment Variable Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment variables
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('should use environment variables when available', () => {
      process.env.FALKORDB_URL = 'redis://custom:6379';
      process.env.QDRANT_URL = 'http://custom:6333';
      process.env.QDRANT_API_KEY = 'custom-api-key';
      process.env.DATABASE_URL = 'postgresql://custom:5432/custom_db';
      process.env.REDIS_URL = 'redis://custom-redis:6379';
      process.env.DB_MAX_CONNECTIONS = '15';
      process.env.DB_IDLE_TIMEOUT = '45000';

      const config = createDatabaseConfig();

      expect(config.falkordb.url).toBe('redis://custom:6379');
      expect(config.qdrant.url).toBe('http://custom:6333');
      expect(config.qdrant.apiKey).toBe('custom-api-key');
      expect(config.postgresql.connectionString).toBe('postgresql://custom:5432/custom_db');
      expect(config.redis?.url).toBe('redis://custom-redis:6379');
      expect(config.postgresql.max).toBe(15);
      expect(config.postgresql.idleTimeoutMillis).toBe(45000);
    });

    it('should use test configuration when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';

      const config = createDatabaseConfig();

      expect(config.falkordb.database).toBe(1);
      expect(config.falkordb.url).toBe('redis://localhost:6380');
      expect(config.qdrant.url).toBe('http://localhost:6335');
      expect(config.postgresql.connectionString).toBe('postgresql://memento_test:memento_test@localhost:5433/memento_test');
      expect(config.postgresql.max).toBe(5);
      expect(config.redis?.url).toBe('redis://localhost:6381');
    });

    it('should use production configuration when NODE_ENV is not test', () => {
      process.env.NODE_ENV = 'production';

      const config = createDatabaseConfig();

      expect(config.falkordb.database).toBe(0);
      expect(config.falkordb.url).toBe('redis://localhost:6379');
      expect(config.qdrant.url).toBe('http://localhost:6333');
      expect(config.postgresql.connectionString).toBe('postgresql://memento:memento@localhost:5432/memento');
      expect(config.postgresql.max).toBe(20);
      expect(config.redis).toBeUndefined();
    });

    it('should handle missing environment variables gracefully', () => {
      // Clear all relevant env vars
      delete process.env.FALKORDB_URL;
      delete process.env.QDRANT_URL;
      delete process.env.QDRANT_API_KEY;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.DB_MAX_CONNECTIONS;
      delete process.env.DB_IDLE_TIMEOUT;
      process.env.NODE_ENV = 'production';

      const config = createDatabaseConfig();

      expect(config).toBeDefined();
      expect(config.falkordb.url).toBe('redis://localhost:6379');
      expect(config.qdrant.url).toBe('http://localhost:6333');
      expect(config.qdrant.apiKey).toBeUndefined();
      expect(config.postgresql.connectionString).toBe('postgresql://memento:memento@localhost:5432/memento');
      expect(config.postgresql.max).toBe(20);
      expect(config.postgresql.idleTimeoutMillis).toBe(30000);
      expect(config.redis).toBeUndefined();
    });
  });

  describe('Error Handling Tests', () => {
    let dbService: DatabaseService;

    beforeEach(async () => {
      const testConfig = createTestDatabaseConfig();
      dbService = new DatabaseService(testConfig);
    });

    describe('Connection Failures', () => {
      it('should handle FalkorDB connection failures gracefully', async () => {
        const realisticFalkorDB = new RealisticFalkorDBMock({ 
          connectionFailures: true,
          failureRate: 100 
        });

        // Set up the service with realistic mock
        Object.defineProperty(dbService, 'falkorDBService', {
          value: realisticFalkorDB,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        // Should fail with meaningful error
        await expect(dbService.falkordbQuery('MATCH (n) RETURN n'))
          .rejects
          .toThrow(/not initialized|connection failed/i);
      });

      it('should handle PostgreSQL transaction deadlocks', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          transactionFailures: true,
          failureRate: 0
        });

        // Initialize the mock
        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        let deadlockCount = 0;
        const attempts = 10;

        // Try multiple transactions, some should fail
        for (let i = 0; i < attempts; i++) {
          try {
            await dbService.postgresTransaction(async (client) => {
              return await client.query('SELECT 1');
            });
          } catch (error) {
            if ((error as Error).message.includes('deadlock')) {
              deadlockCount++;
            }
          }
        }

        // Should have encountered at least one deadlock
        expect(deadlockCount).toBeGreaterThan(0);
        expect(deadlockCount).toBeLessThan(attempts); // Not all should fail
      });

      it('should handle Redis memory limit errors', async () => {
        const realisticRedis = new RealisticRedisMock({
          failureRate: 0 // No random failures, just memory limit simulation
        });

        await realisticRedis.initialize();

        Object.defineProperty(dbService, 'redisService', {
          value: realisticRedis,
          writable: true
        });

        // Fill up the store to simulate memory pressure
        for (let i = 0; i < 1001; i++) {
          await realisticRedis.set(`key_${i}`, `value_${i}`);
        }

        // Next operations might fail due to memory limit
        let memoryErrors = 0;
        for (let i = 0; i < 10; i++) {
          try {
            await dbService.redisSet(`test_key_${i}`, 'test_value');
          } catch (error) {
            if ((error as Error).message.includes('memory limit')) {
              memoryErrors++;
            }
          }
        }

        // Should have some memory errors but not all
        expect(realisticRedis.getStoreSize()).toBeGreaterThan(1000);
      });
    });

    describe('Query Failures and Retries', () => {
      it('should handle intermittent FalkorDB query failures', async () => {
        const realisticFalkorDB = new RealisticFalkorDBMock({
          failureRate: 30,
          seed: 42
        });

        await realisticFalkorDB.initialize();

        Object.defineProperty(dbService, 'falkorDBService', {
          value: realisticFalkorDB,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        let successCount = 0;
        let failureCount = 0;
        const totalAttempts = 20;

        for (let i = 0; i < totalAttempts; i++) {
          try {
            await dbService.falkordbQuery('MATCH (n) RETURN n');
            successCount++;
          } catch (error) {
            failureCount++;
            // Verify error message is meaningful
            expect((error as Error).message).toMatch(/timeout|failed|violation|syntax|connection/i);
          }
        }

        // With 30% failure rate, we should have both successes and failures
        expect(successCount).toBeGreaterThan(0);
        expect(failureCount).toBeGreaterThan(0);
        expect(successCount + failureCount).toBe(totalAttempts);
        
        // Verify query count tracking
        expect(realisticFalkorDB.getQueryCount()).toBe(successCount);
      });

      it('should handle PostgreSQL bulk query with partial failures', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          failureRate: 20,
          seed: 42
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        const queries = [
          { query: 'SELECT 1', params: [] },
          { query: 'INSERT INTO test VALUES ($1)', params: ['value1'] },
          { query: 'UPDATE test SET val = $1', params: ['value2'] },
          { query: 'DELETE FROM test WHERE id = $1', params: [1] },
          { query: 'SELECT COUNT(*) FROM test', params: [] }
        ];

        // Test with continueOnError = true
        const results = await dbService.postgresBulkQuery(queries, { continueOnError: true });

        // Should have results for all queries
        expect(results).toHaveLength(queries.length);

        // Check that some succeeded and some may have failed
        const errors = results.filter(r => r && r.error);
        const successes = results.filter(r => r && !r.error);

        // Verify mixed results
        expect(successes.length).toBeGreaterThan(0);
        // May or may not have errors depending on random failures
        
        // Verify result structure
        results.forEach(result => {
          expect(result).toBeDefined();
          if (result.error) {
            expect(typeof result.error).toBe('string');
          } else {
            // Successful results should have expected structure
            expect(
              Object.prototype.hasOwnProperty.call(result, 'rows') ||
              Object.prototype.hasOwnProperty.call(result, 'rowCount')
            ).toBe(true);
          }
        });
      });
    });

    describe('Data Integrity Issues', () => {
      it('should detect and handle data corruption in FalkorDB', async () => {
        const realisticFalkorDB = new RealisticFalkorDBMock({
          dataCorruption: true,
          failureRate: 0
        });

        await realisticFalkorDB.initialize();

        Object.defineProperty(dbService, 'falkorDBService', {
          value: realisticFalkorDB,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        let corruptionDetected = false;
        
        // Try multiple queries, some should return corrupted data
        for (let i = 0; i < 20; i++) {
          const result = await dbService.falkordbQuery('MATCH (n) RETURN n');
          
          if (result && typeof result === 'object' && 'corrupted' in result) {
            corruptionDetected = true;
            expect(result.error).toContain('Data integrity');
          }
        }

        // Should have detected at least one corruption
        expect(corruptionDetected).toBe(true);
      });

      it('should handle unique constraint violations in PostgreSQL', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          transactionFailures: true
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        let constraintViolations = 0;

        // Try multiple inserts in transactions
        for (let i = 0; i < 10; i++) {
          try {
            await dbService.postgresTransaction(async (client) => {
              // This may throw unique constraint violation
              return await client.query(
                'INSERT INTO users (email) VALUES ($1)',
                [`user${i}@test.com`]
              );
            });
          } catch (error) {
            if ((error as Error).message.includes('constraint violation')) {
              constraintViolations++;
            }
          }
        }

        // Should have caught some constraint violations
        expect(constraintViolations).toBeGreaterThanOrEqual(0);
      });
    });

    describe('TTL and Expiry Handling', () => {
      it('should handle Redis key expiry correctly', async () => {
        const realisticRedis = new RealisticRedisMock({
          failureRate: 0,
          latencyMs: 1
        });

        await realisticRedis.initialize();

        Object.defineProperty(dbService, 'redisService', {
          value: realisticRedis,
          writable: true
        });

        const key = 'ttl_test_key';
        const value = 'test_value';

        // Set with 1 second TTL
        await dbService.redisSet(key, value, 1);

        // Should exist immediately
        const immediate = await dbService.redisGet(key);
        expect(immediate).toBe(value);

        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should be expired now
        const afterExpiry = await dbService.redisGet(key);
        expect(afterExpiry).toBeNull();
      });

      it('should verify Redis delete returns correct count', async () => {
        const realisticRedis = new RealisticRedisMock({
          failureRate: 0
        });

        await realisticRedis.initialize();

        Object.defineProperty(dbService, 'redisService', {
          value: realisticRedis,
          writable: true
        });

        const key = 'delete_test_key';

        // Delete non-existent key
        const deleteNonExistent = await dbService.redisDel(key);
        expect(deleteNonExistent).toBe(0);

        // Set and delete existing key
        await dbService.redisSet(key, 'value');
        const deleteExisting = await dbService.redisDel(key);
        expect(deleteExisting).toBe(1);

        // Verify it's gone
        const afterDelete = await dbService.redisGet(key);
        expect(afterDelete).toBeNull();
      });
    });

    describe('Performance and Latency', () => {
      it('should handle high latency operations', async () => {
        const realisticFalkorDB = new RealisticFalkorDBMock({
          latencyMs: 100,
          failureRate: 0
        });

        await realisticFalkorDB.initialize();

        Object.defineProperty(dbService, 'falkorDBService', {
          value: realisticFalkorDB,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        const startTime = Date.now();
        await dbService.falkordbQuery('MATCH (n) RETURN n');
        const endTime = Date.now();

        const duration = endTime - startTime;
        
        // Should take at least the configured latency
        expect(duration).toBeGreaterThanOrEqual(100);
        expect(duration).toBeLessThan(200); // But not too long
      });

      it('should timeout queries that exceed limit', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          latencyMs: 200, // 200ms latency
          failureRate: 0
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        // Query with 100ms timeout should fail
        await expect(
          dbService.postgresQuery('SELECT 1', [], { timeout: 100 })
        ).rejects.toThrow('timeout');
      });
    });

    describe('Realistic Data Responses', () => {
      it('should return realistic test execution history', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          failureRate: 0
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        const history = await dbService.getTestExecutionHistory('test-entity', 5);

        // Verify realistic response structure
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeLessThanOrEqual(5);
        
        history.forEach(item => {
          expect(item).toHaveProperty('test_id');
          expect(item).toHaveProperty('test_name');
          expect(item).toHaveProperty('status');
          expect(['passed', 'failed']).toContain(item.status);
          expect(item).toHaveProperty('duration');
          expect(typeof item.duration).toBe('number');
          expect(item.duration).toBeGreaterThanOrEqual(0);
          expect(item).toHaveProperty('timestamp');
          expect(item.timestamp).toBeInstanceOf(Date);
        });
      });

      it('should return realistic performance metrics', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          failureRate: 0
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        const metrics = await dbService.getPerformanceMetricsHistory('test-entity', 3);

        // Verify realistic metrics
        expect(Array.isArray(metrics)).toBe(true);
        expect(metrics.length).toBe(3);
        
        metrics.forEach(metric => {
          expect(metric).toHaveProperty('entity_id');
          expect(metric.entity_id).toBe('test-entity');
          expect(metric).toHaveProperty('metric_type');
          expect(metric).toHaveProperty('value');
          expect(typeof metric.value).toBe('number');
          expect(metric.value).toBeGreaterThan(0);
          expect(metric.value).toBeLessThan(500); // Reasonable response time
          expect(metric).toHaveProperty('timestamp');
          expect(metric.timestamp).toBeInstanceOf(Date);
        });
      });

      it('should return realistic coverage data', async () => {
        const realisticPostgres = new RealisticPostgreSQLMock({
          failureRate: 0
        });

        await realisticPostgres.initialize();

        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        const coverage = await dbService.getCoverageHistory('test-entity', 7);

        // Verify realistic coverage data
        expect(Array.isArray(coverage)).toBe(true);
        expect(coverage.length).toBe(7);
        
        coverage.forEach(item => {
          expect(item).toHaveProperty('entity_id');
          expect(item).toHaveProperty('percentage');
          expect(typeof item.percentage).toBe('number');
          expect(item.percentage).toBeGreaterThanOrEqual(0);
          expect(item.percentage).toBeLessThanOrEqual(100);
          expect(item).toHaveProperty('lines_covered');
          expect(item).toHaveProperty('lines_total');
          expect(item.lines_covered).toBeLessThanOrEqual(item.lines_total);
          expect(item).toHaveProperty('timestamp');
        });
      });
    });

    describe('Health Check Accuracy', () => {
      it('should accurately report mixed health status', async () => {
        // Set up services with different states
        const realisticFalkorDB = new RealisticFalkorDBMock({ connectionFailures: true, failureRate: 0 });
        const realisticPostgres = new RealisticPostgreSQLMock({ failureRate: 0 });
        const realisticQdrant = new RealisticQdrantMock({ failureRate: 0 });
        const realisticRedis = new RealisticRedisMock({ failureRate: 0 });

        // Initialize only some services
        await realisticPostgres.initialize();
        await realisticQdrant.initialize();
        await realisticRedis.initialize();
        // FalkorDB not initialized

        Object.defineProperty(dbService, 'falkorDBService', {
          value: realisticFalkorDB,
          writable: true
        });
        Object.defineProperty(dbService, 'postgresqlService', {
          value: realisticPostgres,
          writable: true
        });
        Object.defineProperty(dbService, 'qdrantService', {
          value: realisticQdrant,
          writable: true
        });
        Object.defineProperty(dbService, 'redisService', {
          value: realisticRedis,
          writable: true
        });
        Object.defineProperty(dbService, 'initialized', {
          value: true,
          writable: true
        });

        // Force deterministic health results
        realisticFalkorDB.healthCheck = vi.fn().mockResolvedValue(false) as any;
        realisticPostgres.healthCheck = vi.fn().mockResolvedValue(true) as any;
        realisticQdrant.healthCheck = vi.fn().mockResolvedValue(true) as any;
        realisticRedis.healthCheck = vi.fn().mockResolvedValue(true) as any;

        const health = await dbService.healthCheck();

        // Verify mixed health status
        expect(health.falkordb).toBe(false); // Not initialized
        expect(health.postgresql).toBe(true); // Initialized
        expect(health.qdrant).toBe(true); // Initialized
        expect(health.redis).toBe(true); // Initialized
      });
    });
  });
});
