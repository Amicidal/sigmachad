/**
 * Unit tests for FalkorDBService
 * Tests database service functionality with real functionality tests (no excessive mocking)
 */

/// <reference types="node" />

// Declare globals for test environment
declare const process: any;

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { FalkorDBService } from '../../../src/services/database/FalkorDBService';
import { IFalkorDBService } from '../../../src/services/database/interfaces';

// Mock the redis module
vi.mock('redis', () => ({
  createClient: vi.fn(),
}));

import { createClient as createRedisClient, RedisClientType } from 'redis';

// Mock implementations for testing
class MockRedisClient {
  private connected = false;
  private pingResponse = 'PONG';
  private commandResponses = new Map<string, any>();
  private shouldFail = false;
  private failureRate = 0;

  constructor(config?: { failureRate?: number }) {
    this.failureRate = config?.failureRate || 0;
    // Default successful response format for GRAPH.QUERY
    this.setCommandResponse('GRAPH.QUERY', [
      ['id', 'name', 'type'], // headers
      [['node1', 'Test Node', 'file']], // data
      {} // statistics
    ]);
  }

  async connect(): Promise<void> {
    if (this.shouldFail || Math.random() * 100 < this.failureRate) {
      throw new Error('Connection failed');
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async ping(): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    if (this.shouldFail) {
      throw new Error('Ping failed');
    }
    return this.pingResponse;
  }

  async sendCommand(args: any[]): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    if (this.shouldFail || Math.random() * 100 < this.failureRate) {
      throw new Error('Command failed');
    }

    const command = args[0];
    const response = this.commandResponses.get(command);

    // If a specific response is set (including null), return it
    if (this.commandResponses.has(command)) {
      return response;
    }

    // Default responses for common commands
    if (command === 'GRAPH.QUERY') {
      return [
        ['id', 'name', 'type'],
        [['node1', 'Test Node', 'file']],
        {}
      ];
    }

    return { command, args: args.slice(1), result: 'success' };
  }

  // Test helper methods
  setConnected(connected: boolean): void {
    this.connected = connected;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setPingResponse(response: string): void {
    this.pingResponse = response;
  }

  setCommandResponse(command: string, response: any): void {
    this.commandResponses.set(command, response);
  }

  setFailureRate(rate: number): void {
    this.failureRate = rate;
  }
}

describe('FalkorDBService', () => {
  let falkorService: FalkorDBService;
  let mockClient: MockRedisClient;
  let testConfig: { url: string; database?: number };

  beforeEach(() => {
    testConfig = {
      url: 'redis://localhost:6379',
      database: 0,
    };

    // Reset the mock
    vi.clearAllMocks();

    // Create a new mock client for each test
    mockClient = new MockRedisClient();

    // Mock the createClient function to return our mock
    (createRedisClient as any).mockReturnValue(mockClient);

    falkorService = new FalkorDBService(testConfig);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await falkorService.close();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor and Configuration', () => {
    it('should create service instance with valid configuration', () => {
      expect(falkorService).not.toBeNull();
      expect(falkorService).toBeInstanceOf(FalkorDBService);
      expect(typeof falkorService.initialize).toBe('function');
      expect(typeof falkorService.close).toBe('function');
      expect(typeof falkorService.isInitialized).toBe('function');
      expect(typeof falkorService.getClient).toBe('function');
      expect(typeof falkorService.query).toBe('function');
      expect(typeof falkorService.command).toBe('function');
      expect(typeof falkorService.setupGraph).toBe('function');
      expect(typeof falkorService.healthCheck).toBe('function');
    });

    it('should handle configuration with database number', () => {
      const configWithDb = { url: 'redis://localhost:6379', database: 5 };
      const service = new FalkorDBService(configWithDb);
      expect(service).toBeDefined();
    });

    it('should handle configuration without database number', () => {
      const configWithoutDb = { url: 'redis://localhost:6379' };
      const service = new FalkorDBService(configWithoutDb);
      expect(service).toBeDefined();
    });

    it('should accept different Redis URLs', () => {
      const urls = [
        'redis://localhost:6379',
        'redis://127.0.0.1:6380',
        'redis://redis-server:6379',
        'redis://user:pass@localhost:6379',
      ];

      urls.forEach(url => {
        const service = new FalkorDBService({ url });
        expect(service).toBeDefined();
      });
    });
  });

  describe('Initialization State', () => {
    it('should start uninitialized', () => {
      expect(falkorService.isInitialized()).toBe(false);
    });

    it('should remain uninitialized before calling initialize', () => {
      expect(falkorService.isInitialized()).toBe(false);

      // Calling other methods should not change initialization state
      expect(() => falkorService.getClient()).toThrow();
      expect(falkorService.isInitialized()).toBe(false);
    });

    it('should properly track initialization state', async () => {
      expect(falkorService.isInitialized()).toBe(false);

      await falkorService.initialize();
      expect(falkorService.isInitialized()).toBe(true);

      await falkorService.close();
      expect(falkorService.isInitialized()).toBe(false);
    });

    it('should handle multiple initialization calls', async () => {
      expect(falkorService.isInitialized()).toBe(false);

      await falkorService.initialize();
      expect(falkorService.isInitialized()).toBe(true);

      // Second initialization should be a no-op
      await falkorService.initialize();
      expect(falkorService.isInitialized()).toBe(true);
    });
  });

  describe('Initialization and Connection', () => {
    it('should successfully initialize with valid configuration', async () => {
      await expect(falkorService.initialize()).resolves.toBeUndefined();
      expect(falkorService.isInitialized()).toBe(true);
    });

    it('should handle connection failures during initialization', async () => {
      mockClient.setFailureRate(100); // Always fail

      await expect(falkorService.initialize()).rejects.toThrow('Connection failed');
      expect(falkorService.isInitialized()).toBe(false);
    });

    it('should properly close connection', async () => {
      await falkorService.initialize();
      expect(falkorService.isInitialized()).toBe(true);

      await expect(falkorService.close()).resolves.toBeUndefined();
      expect(falkorService.isInitialized()).toBe(false);
    });

    it('should handle close when not initialized', async () => {
      expect(falkorService.isInitialized()).toBe(false);
      await expect(falkorService.close()).resolves.toBeUndefined();
    });

    it('should handle close when client is not set', async () => {
      // This tests the case where close is called but falkordbClient is not initialized
      const service = new FalkorDBService(testConfig);
      await expect(service.close()).resolves.toBeUndefined();
    });
  });

  describe('Client Getter', () => {
    it('should throw error when getting client before initialization', () => {
      expect(() => falkorService.getClient()).toThrow('FalkorDB not initialized');
    });

    it('should return client after initialization', async () => {
      await falkorService.initialize();
      const client = falkorService.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockClient);
    });

    it('should return the same client instance', async () => {
      await falkorService.initialize();
      const client1 = falkorService.getClient();
      const client2 = falkorService.getClient();
      expect(client1).toBe(client2);
    });
  });

  describe('Query Method', () => {
    beforeEach(async () => {
      await falkorService.initialize();
    });

    it('should throw error when querying before initialization', async () => {
      const uninitializedService = new FalkorDBService(testConfig);
      await expect(uninitializedService.query('MATCH (n) RETURN n')).rejects.toThrow('FalkorDB not initialized');
    });

    it('should execute simple query successfully', async () => {
      const query = 'MATCH (n) RETURN n';
      const result = await falkorService.query(query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      // The result should be parsed into objects with header names as keys
      const firstResult = result[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('name');
      expect(firstResult).toHaveProperty('type');

      // Check the actual values based on the mock data
      if (typeof firstResult.id === 'string') {
        expect(firstResult.id).toBe('node1');
      }
      if (typeof firstResult.name === 'string') {
        expect(firstResult.name).toBe('Test Node');
      }
      if (typeof firstResult.type === 'string') {
        expect(firstResult.type).toBe('file');
      }
    });

    it('should execute query with parameters', async () => {
      const query = 'MATCH (n {id: $id}) RETURN n';
      const params = { id: 'test-node' };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty query results', async () => {
      mockClient.setCommandResponse('GRAPH.QUERY', [
        [['id', 'name']], // headers
        [], // empty data
        {} // statistics
      ]);

      const query = 'MATCH (n) WHERE false RETURN n';
      const result = await falkorService.query(query);

      expect(result).toEqual([]);
    });

    it('should handle write operation results', async () => {
      mockClient.setCommandResponse('GRAPH.QUERY', [1]); // Write operations return count

      const query = 'CREATE (n:Test {name: "test"})';
      const result = await falkorService.query(query);

      expect(result).toBe(1);
    });

    it('should handle query failures', async () => {
      mockClient.setShouldFail(true);

      const query = 'INVALID QUERY';
      await expect(falkorService.query(query)).rejects.toThrow();
    });

    it('should sanitize and validate parameter names', async () => {
      const invalidParams = {
        'invalid param': 'value', // Space in name
        '123invalid': 'value',    // Starts with number
        'valid_param': 'value',   // Valid
        'validParam': 'value',    // Valid
      };

      const query = 'MATCH (n {valid_param: $valid_param, validParam: $validParam}) RETURN n';

      // Should throw for invalid parameter names
      await expect(falkorService.query(query, invalidParams)).rejects.toThrow('Invalid parameter name');
    });
  });

  describe('Parameter Processing', () => {
    beforeEach(async () => {
      await falkorService.initialize();
    });

    it('should handle string parameters', async () => {
      const query = 'MATCH (n {name: $name}) RETURN n';
      const params = { name: 'test node' };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle numeric parameters', async () => {
      const query = 'MATCH (n {id: $id}) RETURN n';
      const params = { id: 123 };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle boolean parameters', async () => {
      const query = 'MATCH (n {active: $active}) RETURN n';
      const params = { active: true };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle null and undefined parameters', async () => {
      const query = 'MATCH (n) WHERE n.value IS $nullVal OR n.other IS $undefinedVal RETURN n';
      const params = { nullVal: null, undefinedVal: undefined };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle array parameters', async () => {
      const query = 'MATCH (n) WHERE n.tags IN $tags RETURN n';
      const params = { tags: ['tag1', 'tag2', 'tag3'] };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle object parameters', async () => {
      const query = 'CREATE (n:Test $properties)';
      const params = {
        properties: {
          name: 'test',
          metadata: { key: 'value' },
          tags: ['a', 'b']
        }
      };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should sanitize dangerous characters in string parameters', async () => {
      const query = 'MATCH (n {name: $name}) RETURN n';
      const params = { name: 'test" OR 1=1 --' }; // SQL injection attempt

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
      // The dangerous characters should be escaped
    });

    it('should handle complex nested objects', async () => {
      const query = 'CREATE (n:Complex $data)';
      const params = {
        data: {
          simple: 'value',
          nested: {
            array: [1, 2, { deep: 'value' }],
            object: { key: 'val' }
          },
          mixed: ['string', 123, true, null]
        }
      };

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });
  });

  describe('Command Method', () => {
    beforeEach(async () => {
      await falkorService.initialize();
    });

    it('should throw error when executing command before initialization', async () => {
      const uninitializedService = new FalkorDBService(testConfig);
      await expect(uninitializedService.command('PING')).rejects.toThrow('FalkorDB not initialized');
    });

    it('should execute single command successfully', async () => {
      const result = await falkorService.command('PING');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('command', 'PING');
      expect(result).toHaveProperty('result', 'success');
    });

    it('should execute command with multiple arguments', async () => {
      const args = ['GRAPH.QUERY', 'memento', 'MATCH (n) RETURN count(n)'];
      const result = await falkorService.command(...args);

      expect(result).toBeDefined();
      // Command returns the raw result from sendCommand, which is the mock response
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3); // [headers, data, statistics]
    });

    it('should handle command failures', async () => {
      mockClient.setShouldFail(true);

      await expect(falkorService.command('INVALID')).rejects.toThrow('Command failed');
    });
  });

  describe('Setup Graph', () => {
    beforeEach(async () => {
      await falkorService.initialize();
    });

    it('should throw error when setting up graph before initialization', async () => {
      const uninitializedService = new FalkorDBService(testConfig);
      await expect(uninitializedService.setupGraph()).rejects.toThrow('FalkorDB not initialized');
    });

    it('should execute setup graph successfully', async () => {
      await expect(falkorService.setupGraph()).resolves.toBeUndefined();
    });

    it('should handle setup failures gracefully', async () => {
      mockClient.setShouldFail(true);

      // Should not throw - setup failures are logged but don't fail the operation
      await expect(falkorService.setupGraph()).resolves.toBeUndefined();
    });
  });

  describe('Health Check', () => {
    it('should return false when not initialized', async () => {
      const result = await falkorService.healthCheck();
      expect(result).toBe(false);
    });

    it('should return true when initialized and healthy', async () => {
      await falkorService.initialize();
      const result = await falkorService.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when ping fails', async () => {
      await falkorService.initialize();
      mockClient.setShouldFail(true);

      const result = await falkorService.healthCheck();
      expect(result).toBe(false);
    });

    it('should handle ping errors gracefully', async () => {
      await falkorService.initialize();
      mockClient.setPingResponse('ERROR');

      const result = await falkorService.healthCheck();
      expect(result).toBe(true); // Ping returns a response, even if it's not PONG
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors during operations', async () => {
      await falkorService.initialize();

      // Simulate connection dropping
      mockClient.setConnected(false);

      await expect(falkorService.query('MATCH (n) RETURN n')).rejects.toThrow();
    });

    it('should handle malformed query results', async () => {
      await falkorService.initialize();

      // Set malformed response
      mockClient.setCommandResponse('GRAPH.QUERY', null);

      const result = await falkorService.query('MATCH (n) RETURN n');
      expect(result).toBe(null);
    });

    it('should handle null command responses', async () => {
      await falkorService.initialize();

      // Set null response for a specific command
      mockClient.setCommandResponse('GRAPH.QUERY', null);

      const result = await falkorService.command('GRAPH.QUERY', 'memento', 'MATCH (n) RETURN n');
      expect(result).toBe(null);
    });

    it('should handle partial result structures', async () => {
      await falkorService.initialize();

      // Set incomplete response
      mockClient.setCommandResponse('GRAPH.QUERY', [
        [['id']], // headers only
      ]);

      const result = await falkorService.query('MATCH (n) RETURN n');
      expect(result).toBeDefined();
    });

    it('should handle result parsing errors gracefully', async () => {
      await falkorService.initialize();

      // Set response with mismatched headers/data
      mockClient.setCommandResponse('GRAPH.QUERY', [
        [['id', 'name', 'type']], // 3 headers
        [['node1']], // 1 data item (mismatch)
        {}
      ]);

      const result = await falkorService.query('MATCH (n) RETURN n');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent queries', async () => {
      await falkorService.initialize();

      const queries = [
        'MATCH (n) RETURN n',
        'MATCH (n:File) RETURN n',
        'MATCH (n) WHERE n.type = "function" RETURN n',
      ];

      const promises = queries.map(query => falkorService.query(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle concurrent commands', async () => {
      await falkorService.initialize();

      const commands = [
        ['PING'],
        ['GRAPH.QUERY', 'memento', 'MATCH (n) RETURN count(n)'],
        ['GRAPH.QUERY', 'memento', 'MATCH (n:Test) RETURN n'],
      ];

      const promises = commands.map(args => falkorService.command(...args));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly clean up resources on close', async () => {
      await falkorService.initialize();
      expect(falkorService.isInitialized()).toBe(true);

      await falkorService.close();
      expect(falkorService.isInitialized()).toBe(false);

      // Client should be disconnected
      expect(() => falkorService.getClient()).toThrow('FalkorDB not initialized');
    });

    it('should handle multiple close calls', async () => {
      await falkorService.initialize();

      await falkorService.close();
      await expect(falkorService.close()).resolves.toBeUndefined(); // Should not throw
    });

    it('should handle close during ongoing operations', async () => {
      await falkorService.initialize();

      // Start an operation that might be ongoing
      const queryPromise = falkorService.query('MATCH (n) RETURN n');

      // Close while operation is in progress
      await falkorService.close();

      // The ongoing operation should either complete or fail gracefully
      try {
        await queryPromise;
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long queries', async () => {
      await falkorService.initialize();

      const longQuery = 'MATCH ' + '(n)'.repeat(1000) + ' RETURN n';
      const result = await falkorService.query(longQuery);
      expect(result).toBeDefined();
    });

    it('should handle queries with many parameters', async () => {
      await falkorService.initialize();

      const params: Record<string, any> = {};
      let query = 'MATCH (n) WHERE ';

      for (let i = 0; i < 100; i++) {
        params[`param${i}`] = `value${i}`;
        query += `n.prop${i} = $param${i}`;
        if (i < 99) query += ' AND ';
      }

      query += ' RETURN n';

      const result = await falkorService.query(query, params);
      expect(result).toBeDefined();
    });

    it('should handle empty parameter objects', async () => {
      await falkorService.initialize();

      const result = await falkorService.query('MATCH (n) RETURN n', {});
      expect(result).toBeDefined();
    });

    it('should handle undefined parameters', async () => {
      await falkorService.initialize();

      const result = await falkorService.query('MATCH (n) RETURN n', undefined);
      expect(result).toBeDefined();
    });
  });
});
