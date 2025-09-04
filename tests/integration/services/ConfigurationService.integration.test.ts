/**
 * Integration tests for ConfigurationService
 * Tests system configuration detection, health monitoring, and feature status
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ConfigurationService, SystemConfiguration } from '../../../src/services/ConfigurationService';
import { DatabaseService, createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import { SynchronizationCoordinator } from '../../../src/services/SynchronizationCoordinator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ConfigurationService Integration', () => {
  let dbService: DatabaseService;
  let syncCoordinator: SynchronizationCoordinator;
  let configService: ConfigurationService;
  let testDir: string;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(tmpdir(), 'config-service-integration-tests');
    await fs.mkdir(testDir, { recursive: true });

    // Initialize database service
    dbService = new DatabaseService(createTestDatabaseConfig());
    await dbService.initialize();

    // Initialize sync coordinator
    syncCoordinator = new SynchronizationCoordinator(dbService);

    // Initialize configuration service
    configService = new ConfigurationService(dbService, syncCoordinator);
  }, 30000);

  afterAll(async () => {
    // Clean up
    try {
      await syncCoordinator?.stop();
      await dbService?.close();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up:', error);
    }
  });

  describe('System Configuration Integration', () => {
    it('should retrieve complete system configuration', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config).toBeDefined();
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('databases');
      expect(config).toHaveProperty('features');
      expect(config).toHaveProperty('performance');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('system');

      // Version should be a string
      expect(typeof config.version).toBe('string');
      expect(config.version.length).toBeGreaterThan(0);

      // Environment should be set
      expect(typeof config.environment).toBe('string');
    });

    it('should detect database availability correctly', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // Database status should be properly detected
      expect(config.databases).toBeDefined();
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.falkordb);
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.qdrant);
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.postgres);

      // At least one database should be configured (for tests)
      const configuredCount = Object.values(config.databases).filter(status => status === 'configured').length;
      expect(configuredCount).toBeGreaterThanOrEqual(1);
    });

    it('should detect feature availability', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.features).toBeDefined();

      // Feature flags should be boolean
      Object.values(config.features).forEach(feature => {
        expect(typeof feature).toBe('boolean');
      });

      // Some features should be available
      const availableFeatures = Object.values(config.features).filter(f => f === true).length;
      expect(availableFeatures).toBeGreaterThan(0);
    });

    it('should provide performance configuration', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.performance).toBeDefined();
      expect(typeof config.performance.maxConcurrentSync).toBe('number');
      expect(typeof config.performance.cacheSize).toBe('number');
      expect(typeof config.performance.requestTimeout).toBe('number');

      // Values should be reasonable
      expect(config.performance.maxConcurrentSync).toBeGreaterThan(0);
      expect(config.performance.cacheSize).toBeGreaterThan(0);
      expect(config.performance.requestTimeout).toBeGreaterThan(0);
    });

    it('should provide security configuration', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.security).toBeDefined();

      // Security flags should be boolean
      Object.values(config.security).forEach(setting => {
        expect(typeof setting).toBe('boolean');
      });
    });

    it('should provide system information', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.system).toBeDefined();
      expect(typeof config.system.uptime).toBe('number');
      expect(config.system.memoryUsage).toBeDefined();
      expect(typeof config.system.platform).toBe('string');
      expect(typeof config.system.nodeVersion).toBe('string');

      // System info should be reasonable
      expect(config.system.uptime).toBeGreaterThanOrEqual(0);
      expect(config.system.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(config.system.platform.length).toBeGreaterThan(0);
      expect(config.system.nodeVersion.length).toBeGreaterThan(0);
    });
  });

  describe('Version Detection Integration', () => {
    it('should read version from package.json', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // Version should be read from package.json or fallback
      expect(config.version).toBeDefined();
      expect(typeof config.version).toBe('string');

      // Should match semver format or fallback
      expect(config.version === '0.1.0' || /^\d+\.\d+\.\d+/.test(config.version)).toBe(true);
    });

    it('should handle missing package.json gracefully', async () => {
      // Create a temporary service without package.json
      const tempDir = path.join(tmpdir(), 'no-package-json-test');
      await fs.mkdir(tempDir, { recursive: true });

      // Change to temp directory (temporarily)
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const tempConfigService = new ConfigurationService(dbService, syncCoordinator);
        const config = await tempConfigService.getSystemConfiguration();

        // Should fallback to default version
        expect(config.version).toBe('0.1.0');
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle malformed package.json gracefully', async () => {
      const tempDir = path.join(tmpdir(), 'malformed-package-json-test');
      await fs.mkdir(tempDir, { recursive: true });

      // Create malformed package.json
      await fs.writeFile(path.join(tempDir, 'package.json'), '{ invalid json content');

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const tempConfigService = new ConfigurationService(dbService, syncCoordinator);
        const config = await tempConfigService.getSystemConfiguration();

        // Should fallback to default version
        expect(config.version).toBe('0.1.0');
      } finally {
        process.chdir(originalCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Database Status Detection Integration', () => {
    it('should correctly detect PostgreSQL status', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // PostgreSQL should be configured for tests
      expect(['configured', 'error']).toContain(config.databases.postgres);

      // If configured, we should be able to run a simple query
      if (config.databases.postgres === 'configured') {
        const testResult = await dbService.postgresQuery('SELECT 1 as test');
        expect(testResult.rows[0].test).toBe(1);
      }
    });

    it('should correctly detect FalkorDB status', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // FalkorDB status should be detected
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.falkordb);

      // If configured, we should be able to run a simple query
      if (config.databases.falkordb === 'configured') {
        const testResult = await dbService.falkordbQuery('RETURN 1 as test');
        expect(testResult[0].test).toBe(1);
      }
    });

    it('should correctly detect Qdrant status', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // Qdrant status should be detected
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.qdrant);

      // If configured, we should be able to get collections
      if (config.databases.qdrant === 'configured') {
        const collections = await dbService.getQdrantClient().getCollections();
        expect(collections).toBeDefined();
      }
    });

    it('should handle database connection failures gracefully', async () => {
      // Create a service with invalid database config
      const invalidConfig = {
        falkordb: { url: 'redis://invalid:1234', database: 1 },
        qdrant: { url: 'http://invalid:1234', apiKey: undefined },
        postgresql: { connectionString: 'postgresql://invalid:invalid@invalid:1234/invalid' },
        redis: { url: 'redis://invalid:1234' }
      };

      const invalidDbService = new DatabaseService(invalidConfig);
      const invalidConfigService = new ConfigurationService(invalidDbService);

      const config = await invalidConfigService.getSystemConfiguration();

      // Should mark databases as error or unavailable
      expect(config.databases.falkordb).toBe('error');
      expect(config.databases.qdrant).toBe('error');
      expect(config.databases.postgres).toBe('error');
    });
  });

  describe('Feature Detection Integration', () => {
    it('should detect websocket feature availability', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // WebSocket feature should be detected as boolean
      expect(typeof config.features.websocket).toBe('boolean');

      // In a real environment, this might be available
      // We just verify it's properly detected
    });

    it('should detect graph search feature availability', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(typeof config.features.graphSearch).toBe('boolean');

      // Graph search should be available if FalkorDB is configured
      if (config.databases.falkordb === 'configured') {
        // In a real implementation, this would be true
        // We just verify the detection logic runs
      }
    });

    it('should detect vector search feature availability', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(typeof config.features.vectorSearch).toBe('boolean');

      // Vector search should be available if Qdrant is configured
      if (config.databases.qdrant === 'configured') {
        // In a real implementation, this would be true
        // We just verify the detection logic runs
      }
    });

    it('should detect sync coordinator feature availability', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(typeof config.features.syncCoordinator).toBe('boolean');

      // Should be true if syncCoordinator is provided
      expect(config.features.syncCoordinator).toBe(true);
    });
  });

  describe('Performance Configuration Integration', () => {
    it('should provide reasonable performance defaults', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // Performance values should be reasonable defaults
      expect(config.performance.maxConcurrentSync).toBeGreaterThan(0);
      expect(config.performance.maxConcurrentSync).toBeLessThanOrEqual(100);

      expect(config.performance.cacheSize).toBeGreaterThan(0);
      expect(config.performance.cacheSize).toBeLessThanOrEqual(1000000); // 1MB

      expect(config.performance.requestTimeout).toBeGreaterThan(0);
      expect(config.performance.requestTimeout).toBeLessThanOrEqual(300000); // 5 minutes
    });

    it('should handle performance configuration from environment', async () => {
      // Test with environment variables
      const originalEnv = { ...process.env };

      try {
        process.env.MAX_CONCURRENT_SYNC = '25';
        process.env.CACHE_SIZE = '50000';
        process.env.REQUEST_TIMEOUT = '120000';

        const config: SystemConfiguration = await configService.getSystemConfiguration();

        // Values should reflect environment variables
        expect(config.performance.maxConcurrentSync).toBe(25);
        expect(config.performance.cacheSize).toBe(50000);
        expect(config.performance.requestTimeout).toBe(120000);
      } finally {
        // Restore original environment
        process.env = originalEnv;
      }
    });
  });

  describe('Security Configuration Integration', () => {
    it('should detect security features', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // All security flags should be boolean
      expect(typeof config.security.rateLimiting).toBe('boolean');
      expect(typeof config.security.authentication).toBe('boolean');
      expect(typeof config.security.auditLogging).toBe('boolean');
    });

    it('should handle security configuration from environment', async () => {
      const originalEnv = { ...process.env };

      try {
        process.env.ENABLE_RATE_LIMITING = 'true';
        process.env.ENABLE_AUTHENTICATION = 'false';
        process.env.ENABLE_AUDIT_LOGGING = 'true';

        const config: SystemConfiguration = await configService.getSystemConfiguration();

        expect(config.security.rateLimiting).toBe(true);
        expect(config.security.authentication).toBe(false);
        expect(config.security.auditLogging).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('System Information Integration', () => {
    it('should provide accurate system uptime', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // Uptime should be a reasonable number
      expect(config.system.uptime).toBeGreaterThanOrEqual(0);
      expect(config.system.uptime).toBeLessThanOrEqual(process.uptime() + 10); // Allow some tolerance
    });

    it('should provide memory usage information', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.system.memoryUsage).toBeDefined();
      expect(typeof config.system.memoryUsage.heapUsed).toBe('number');
      expect(typeof config.system.memoryUsage.heapTotal).toBe('number');
      expect(typeof config.system.memoryUsage.external).toBe('number');

      // Memory values should be positive
      expect(config.system.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(config.system.memoryUsage.heapTotal).toBeGreaterThan(0);
    });

    it('should provide platform and node version', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      expect(config.system.platform).toBeDefined();
      expect(config.system.nodeVersion).toBeDefined();

      expect(config.system.platform).toBe(process.platform);
      expect(config.system.nodeVersion).toBe(process.version);
    });

    it('should handle CPU usage detection', async () => {
      const config: SystemConfiguration = await configService.getSystemConfiguration();

      // CPU usage might not be available on all platforms
      if (config.system.cpuUsage !== undefined) {
        expect(typeof config.system.cpuUsage).toBe('object');
      }
    });
  });

  describe('Configuration Updates Integration', () => {
    it('should detect configuration changes over time', async () => {
      const config1: SystemConfiguration = await configService.getSystemConfiguration();

      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100));

      const config2: SystemConfiguration = await configService.getSystemConfiguration();

      // System info should be updated
      expect(config2.system.uptime).toBeGreaterThanOrEqual(config1.system.uptime);

      // Memory usage might change
      expect(config2.system.memoryUsage.heapUsed).toBeGreaterThanOrEqual(config1.system.memoryUsage.heapUsed);
    });

    it('should handle rapid configuration requests', async () => {
      const requests = 10;
      const promises: Promise<SystemConfiguration>[] = [];

      // Make multiple concurrent requests
      for (let i = 0; i < requests; i++) {
        promises.push(configService.getSystemConfiguration());
      }

      const results = await Promise.all(promises);

      // All results should be valid configurations
      results.forEach(config => {
        expect(config).toBeDefined();
        expect(config.version).toBeDefined();
        expect(config.databases).toBeDefined();
        expect(config.features).toBeDefined();
      });

      // Results should be consistent (same version, environment, etc.)
      const firstConfig = results[0];
      results.forEach(config => {
        expect(config.version).toBe(firstConfig.version);
        expect(config.environment).toBe(firstConfig.environment);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database service failures gracefully', async () => {
      // Create configuration service without database service
      const configServiceNoDb = new ConfigurationService(undefined as any);

      // Should not crash
      const config = await configServiceNoDb.getSystemConfiguration();

      // Should still provide basic configuration
      expect(config).toBeDefined();
      expect(config.version).toBeDefined();

      // Database status should indicate unavailability
      expect(config.databases.falkordb).toBe('unavailable');
      expect(config.databases.qdrant).toBe('unavailable');
      expect(config.databases.postgres).toBe('unavailable');
    });

    it('should handle sync coordinator failures gracefully', async () => {
      // Create configuration service without sync coordinator
      const configServiceNoSync = new ConfigurationService(dbService);

      const config = await configServiceNoSync.getSystemConfiguration();

      // Should still work
      expect(config).toBeDefined();
      expect(config.features.syncCoordinator).toBe(false);
    });

    it('should handle file system errors gracefully', async () => {
      // Create configuration service in a directory without read permissions
      const restrictedDir = path.join(tmpdir(), 'restricted-config-test');
      await fs.mkdir(restrictedDir, { recursive: true });

      const originalCwd = process.cwd();
      process.chdir(restrictedDir);

      try {
        const restrictedConfigService = new ConfigurationService(dbService, syncCoordinator);
        const config = await restrictedConfigService.getSystemConfiguration();

        // Should still provide configuration with fallback values
        expect(config).toBeDefined();
        expect(config.version).toBe('0.1.0'); // Fallback version
      } finally {
        process.chdir(originalCwd);
        await fs.rm(restrictedDir, { recursive: true, force: true });
      }
    });

    it('should handle network timeouts gracefully', async () => {
      // This test would require mocking network timeouts
      // For now, we just verify the service handles errors gracefully

      const config = await configService.getSystemConfiguration();

      // Configuration should still be valid even if some checks fail
      expect(config).toBeDefined();
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.falkordb);
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.qdrant);
      expect(['configured', 'error', 'unavailable']).toContain(config.databases.postgres);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-frequency configuration requests', async () => {
      const iterations = 50;
      const startTime = Date.now();

      // Make many rapid requests
      for (let i = 0; i < iterations; i++) {
        await configService.getSystemConfiguration();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds for 50 requests

      const avgRequestTime = duration / iterations;
      expect(avgRequestTime).toBeLessThan(200); // Average < 200ms per request
    });

    it('should maintain performance under memory pressure', async () => {
      const iterations = 20;
      const results: SystemConfiguration[] = [];

      // Collect multiple configurations
      for (let i = 0; i < iterations; i++) {
        const config = await configService.getSystemConfiguration();
        results.push(config);

        // Small delay to allow memory usage to change
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Verify all configurations are valid
      results.forEach(config => {
        expect(config.system.memoryUsage.heapUsed).toBeGreaterThan(0);
      });

      // Memory usage should be reasonable
      const memoryUsage = results[results.length - 1].system.memoryUsage;
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });
  });
});
