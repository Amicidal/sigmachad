/**
 * SessionConfig Unit Tests
 *
 * Tests for session configuration management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionConfig,
  createSessionConfig,
  validateRedisConnection,
  getRedisConnectionString,
  ENVIRONMENT_VARIABLES
} from '../../../src/services/SessionConfig.js';

describe('SessionConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_SESSION_DB;
    delete process.env.SESSION_DEFAULT_TTL;
    delete process.env.SESSION_CHECKPOINT_INTERVAL;
    delete process.env.SESSION_MAX_EVENTS;
    delete process.env.SESSION_GRACE_TTL;
    delete process.env.SESSION_ENABLE_FAILURE_SNAPSHOTS;

    // Reset singleton instance
    (SessionConfig as any).instance = undefined;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Configuration Loading', () => {
    it('should load default configuration', () => {
      const config = SessionConfig.getInstance();
      const fullConfig = config.getConfig();

      expect(fullConfig.redis.host).toBe('localhost');
      expect(fullConfig.redis.port).toBe(6379);
      expect(fullConfig.redis.db).toBe(0);
      expect(fullConfig.defaultTTL).toBe(3600);
      expect(fullConfig.checkpointInterval).toBe(10);
      expect(fullConfig.maxEventsPerSession).toBe(1000);
      expect(fullConfig.graceTTL).toBe(300);
      expect(fullConfig.enableFailureSnapshots).toBe(false);
    });

    it('should load configuration from environment variables', () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret123';
      process.env.REDIS_SESSION_DB = '5';
      process.env.SESSION_DEFAULT_TTL = '7200';
      process.env.SESSION_CHECKPOINT_INTERVAL = '15';
      process.env.SESSION_MAX_EVENTS = '2000';
      process.env.SESSION_GRACE_TTL = '600';
      process.env.SESSION_ENABLE_FAILURE_SNAPSHOTS = 'true';

      const config = SessionConfig.getInstance();
      const fullConfig = config.getConfig();

      expect(fullConfig.redis.host).toBe('redis.example.com');
      expect(fullConfig.redis.port).toBe(6380);
      expect(fullConfig.redis.password).toBe('secret123');
      expect(fullConfig.redis.db).toBe(5);
      expect(fullConfig.defaultTTL).toBe(7200);
      expect(fullConfig.checkpointInterval).toBe(15);
      expect(fullConfig.maxEventsPerSession).toBe(2000);
      expect(fullConfig.graceTTL).toBe(600);
      expect(fullConfig.enableFailureSnapshots).toBe(true);
    });

    it('should prioritize REDIS_URL over individual settings', () => {
      process.env.REDIS_URL = 'redis://user:pass@redis.example.com:6380/3';
      process.env.REDIS_HOST = 'ignored.host';
      process.env.REDIS_PORT = '9999';

      const config = SessionConfig.getInstance();
      const redisConfig = config.getRedisConfig();

      expect(redisConfig.url).toBe('redis://user:pass@redis.example.com:6380/3');
      expect(redisConfig.host).toBe('ignored.host'); // Still present but URL takes priority
    });

    it('should parse boolean environment variables correctly', () => {
      process.env.SESSION_ENABLE_FAILURE_SNAPSHOTS = 'false';
      process.env.REDIS_LAZY_CONNECT = 'true';

      const config = SessionConfig.getInstance();
      const fullConfig = config.getConfig();

      expect(fullConfig.enableFailureSnapshots).toBe(false);
      expect(fullConfig.redis.lazyConnect).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const config1 = SessionConfig.getInstance();
      const config2 = SessionConfig.getInstance();

      expect(config1).toBe(config2);
    });

    it('should maintain configuration across getInstance calls', () => {
      process.env.REDIS_HOST = 'test.redis.com';

      const config1 = SessionConfig.getInstance();
      const config2 = SessionConfig.getInstance();

      expect(config1.getRedisConfig().host).toBe('test.redis.com');
      expect(config2.getRedisConfig().host).toBe('test.redis.com');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.SESSION_DEFAULT_TTL = '3600';

      const config = SessionConfig.getInstance();
      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing Redis configuration', () => {
      // Clear Redis settings
      const config = SessionConfig.getInstance();
      config.updateConfig({
        redis: {
          host: undefined,
          url: undefined,
        }
      });

      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Redis host or URL must be specified');
    });

    it('should validate Redis port range', () => {
      const config = SessionConfig.getInstance();
      config.updateConfig({
        redis: {
          host: 'localhost',
          port: 99999, // Invalid port
        }
      });

      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Redis port must be between 1 and 65535');
    });

    it('should validate Redis database number', () => {
      const config = SessionConfig.getInstance();
      config.updateConfig({
        redis: {
          host: 'localhost',
          db: 20, // Invalid database number
        }
      });

      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Redis database must be between 0 and 15');
    });

    it('should validate session configuration limits', () => {
      const config = SessionConfig.getInstance();
      config.updateConfig({
        defaultTTL: 30, // Too low
        checkpointInterval: 0, // Too low
        maxEventsPerSession: 5, // Too low
        graceTTL: 10, // Too low
      });

      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Default TTL must be at least 60 seconds');
      expect(validation.errors).toContain('Checkpoint interval must be at least 1 event');
      expect(validation.errors).toContain('Max events per session must be at least 10');
      expect(validation.errors).toContain('Grace TTL must be at least 30 seconds');
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';

      const config = SessionConfig.getInstance();

      expect(config.getEnvironment()).toBe('development');
      expect(config.isDevelopment()).toBe(true);
      expect(config.isProduction()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';

      const config = SessionConfig.getInstance();

      expect(config.getEnvironment()).toBe('production');
      expect(config.isProduction()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';

      const config = SessionConfig.getInstance();

      expect(config.getEnvironment()).toBe('test');
      expect(config.isTest()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isProduction()).toBe(false);
    });

    it('should default to development environment', () => {
      // NODE_ENV not set
      const config = SessionConfig.getInstance();

      expect(config.getEnvironment()).toBe('development');
      expect(config.isDevelopment()).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const config = SessionConfig.getInstance();

      config.updateConfig({
        defaultTTL: 7200,
        redis: {
          host: 'updated.redis.com',
          port: 6380,
        },
        pubSubChannels: {
          global: 'updated:global',
        }
      });

      const fullConfig = config.getConfig();

      expect(fullConfig.defaultTTL).toBe(7200);
      expect(fullConfig.redis.host).toBe('updated.redis.com');
      expect(fullConfig.redis.port).toBe(6380);
      expect(fullConfig.pubSubChannels.global).toBe('updated:global');
      expect(fullConfig.pubSubChannels.session).toBe('session:'); // Should retain original
    });
  });

  describe('Preset Configurations', () => {
    it('should provide development configuration', () => {
      const devConfig = SessionConfig.getDevelopmentConfig();

      expect(devConfig.redis.host).toBe('localhost');
      expect(devConfig.redis.port).toBe(6379);
      expect(devConfig.redis.db).toBe(0);
      expect(devConfig.defaultTTL).toBe(1800); // 30 minutes
      expect(devConfig.checkpointInterval).toBe(5);
      expect(devConfig.graceTTL).toBe(180); // 3 minutes
      expect(devConfig.enableFailureSnapshots).toBe(true);
      expect(devConfig.pubSubChannels?.global).toBe('dev:global:sessions');
    });

    it('should provide test configuration', () => {
      const testConfig = SessionConfig.getTestConfig();

      expect(testConfig.redis.host).toBe('localhost');
      expect(testConfig.redis.db).toBe(15); // Separate test database
      expect(testConfig.defaultTTL).toBe(300); // 5 minutes
      expect(testConfig.checkpointInterval).toBe(3);
      expect(testConfig.maxEventsPerSession).toBe(100);
      expect(testConfig.enableFailureSnapshots).toBe(false);
      expect(testConfig.pubSubChannels?.global).toBe('test:global:sessions');
    });

    it('should provide production configuration', () => {
      process.env.REDIS_URL = 'redis://prod.redis.com:6379';

      const prodConfig = SessionConfig.getProductionConfig();

      expect(prodConfig.redis.url).toBe('redis://prod.redis.com:6379');
      expect(prodConfig.defaultTTL).toBe(3600); // 1 hour
      expect(prodConfig.checkpointInterval).toBe(15);
      expect(prodConfig.maxEventsPerSession).toBe(2000);
      expect(prodConfig.graceTTL).toBe(600); // 10 minutes
      expect(prodConfig.enableFailureSnapshots).toBe(true);
      expect(prodConfig.pubSubChannels?.global).toBe('global:sessions');
    });
  });

  describe('Configuration Factory', () => {
    it('should create development config by default', () => {
      const config = createSessionConfig();
      const devConfig = SessionConfig.getDevelopmentConfig();

      expect(config).toEqual(devConfig);
    });

    it('should create test config for test environment', () => {
      const config = createSessionConfig('test');
      const testConfig = SessionConfig.getTestConfig();

      expect(config).toEqual(testConfig);
    });

    it('should create production config for production environment', () => {
      process.env.REDIS_URL = 'redis://prod.redis.com:6379';

      const config = createSessionConfig('production');
      const prodConfig = SessionConfig.getProductionConfig();

      expect(config).toEqual(prodConfig);
    });

    it('should read NODE_ENV when environment not specified', () => {
      process.env.NODE_ENV = 'test';

      const config = createSessionConfig();
      const testConfig = SessionConfig.getTestConfig();

      expect(config).toEqual(testConfig);
    });
  });

  describe('Redis Connection String', () => {
    it('should return URL when provided', () => {
      const config = {
        url: 'redis://user:pass@redis.example.com:6379/2',
        host: 'ignored',
        port: 9999,
      };

      const connectionString = getRedisConnectionString(config);

      expect(connectionString).toBe('redis://user:pass@redis.example.com:6379/2');
    });

    it('should construct connection string from components', () => {
      const config = {
        host: 'redis.example.com',
        port: 6380,
        password: 'secret123',
        db: 5,
      };

      const connectionString = getRedisConnectionString(config);

      expect(connectionString).toBe('redis://:secret123@redis.example.com:6380/5');
    });

    it('should construct connection string without password', () => {
      const config = {
        host: 'redis.example.com',
        port: 6379,
        db: 0,
      };

      const connectionString = getRedisConnectionString(config);

      expect(connectionString).toBe('redis://redis.example.com:6379/0');
    });

    it('should use defaults for missing values', () => {
      const config = {};

      const connectionString = getRedisConnectionString(config);

      expect(connectionString).toBe('redis://localhost:6379/0');
    });
  });

  describe('Environment Variables Documentation', () => {
    it('should have documentation for all environment variables', () => {
      const envVars = ENVIRONMENT_VARIABLES;

      expect(envVars.REDIS_URL).toBeTruthy();
      expect(envVars.REDIS_HOST).toBeTruthy();
      expect(envVars.REDIS_PORT).toBeTruthy();
      expect(envVars.SESSION_DEFAULT_TTL).toBeTruthy();
      expect(envVars.SESSION_CHECKPOINT_INTERVAL).toBeTruthy();
      expect(envVars.SESSION_ENABLE_FAILURE_SNAPSHOTS).toBeTruthy();

      // Ensure all documented variables are strings
      Object.values(envVars).forEach(description => {
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('validateRedisConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate successful Redis connection', async () => {
    // Mock Redis client
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    // Mock the require call
    vi.doMock('redis', () => ({
      createClient: mockCreateClient,
    }));

    const config = {
      host: 'localhost',
      port: 6379,
    };

    const isValid = await validateRedisConnection(config);

    expect(isValid).toBe(true);
    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.ping).toHaveBeenCalled();
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should handle connection failures', async () => {
    // Mock Redis client with connection failure
    const mockClient = {
      connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
      on: vi.fn(),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    vi.doMock('redis', () => ({
      createClient: mockCreateClient,
    }));

    const config = {
      host: 'invalid.host',
      port: 6379,
    };

    const isValid = await validateRedisConnection(config);

    expect(isValid).toBe(false);
  });

  it('should handle ping failures', async () => {
    // Mock Redis client with ping failure
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockRejectedValue(new Error('Ping failed')),
      quit: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    vi.doMock('redis', () => ({
      createClient: mockCreateClient,
    }));

    const config = {
      host: 'localhost',
      port: 6379,
    };

    const isValid = await validateRedisConnection(config);

    expect(isValid).toBe(false);
    expect(mockClient.quit).toHaveBeenCalled();
  });
});