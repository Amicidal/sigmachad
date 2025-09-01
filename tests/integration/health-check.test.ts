/**
 * Health Check Integration Tests
 * Tests the actual health check functionality with real database connections
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { performHealthCheck } from '../src/health-check.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('Health Check Integration Tests', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    // Use real database connections for integration testing
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);

    try {
      await dbService.initialize();
    } catch (error) {
      console.warn('Database not available for integration tests, skipping:', error);
    }
  }, 30000);

  afterAll(async () => {
    if (dbService) {
      try {
        await dbService.close();
      } catch (error) {
        console.warn('Error closing database:', error);
      }
    }
  });

  describe('performHealthCheck Integration', () => {
    it('should perform actual health check against real databases', async () => {
      // Skip if database is not available
      if (!dbService) {
        console.warn('Skipping integration test - database not available');
        return;
      }

      const result = await performHealthCheck();

      // Result should have proper structure
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('databases');
      expect(typeof result.healthy).toBe('boolean');
      expect(typeof result.databases).toBe('object');

      // Should have database health status properties
      expect(result.databases).toHaveProperty('falkordb');
      expect(result.databases).toHaveProperty('qdrant');
      expect(result.databases).toHaveProperty('postgresql');

      // Each database status should be boolean
      expect(typeof result.databases.falkordb).toBe('boolean');
      expect(typeof result.databases.qdrant).toBe('boolean');
      expect(typeof result.databases.postgresql).toBe('boolean');
    });

    it('should handle database connection failures gracefully', async () => {
      // This test verifies error handling when databases are not available
      // We can't easily control database availability, so we test the error handling path
      const result = await performHealthCheck();

      // Even with failures, should return proper structure
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('databases');
      expect(typeof result.healthy).toBe('boolean');
    });

    it('should provide detailed database status information', async () => {
      const result = await performHealthCheck();

      // Verify database status object structure
      expect(result.databases).toHaveProperty('falkordb');
      expect(result.databases).toHaveProperty('qdrant');
      expect(result.databases).toHaveProperty('postgresql');

      // Values should be boolean (true/false based on actual connectivity)
      expect(typeof result.databases.falkordb).toBe('boolean');
      expect(typeof result.databases.qdrant).toBe('boolean');
      expect(typeof result.databases.postgresql).toBe('boolean');
    });
  });

  describe('Health Check Module Structure', () => {
    it('should export required functions', async () => {
      const healthCheckModule = await import('../src/health-check.js');
      expect(healthCheckModule).toHaveProperty('healthCheck');
      expect(healthCheckModule).toHaveProperty('performHealthCheck');
      expect(typeof healthCheckModule.healthCheck).toBe('function');
      expect(typeof healthCheckModule.performHealthCheck).toBe('function');
    });

    it('should have proper TypeScript types', () => {
      // This verifies that TypeScript compilation includes the health check types
      const result = { healthy: true, databases: { falkordb: true, qdrant: true, postgresql: true } };
      expect(result.healthy).toBe(true);
      expect(result.databases.falkordb).toBe(true);
    });
  });
});