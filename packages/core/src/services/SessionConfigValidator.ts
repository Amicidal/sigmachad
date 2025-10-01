/**
 * Session Configuration Validator
 *
 * Provides comprehensive validation for Redis session coordination configuration:
 * - Configuration schema validation
 * - Environment-specific validation
 * - Performance and security recommendations
 * - Runtime configuration validation
 */

import { z } from 'zod';
import type { RedisClientType } from 'redis';
import {
  SessionManagerConfig,
  RedisConfig,
  SessionCreationOptions,
} from './SessionTypes.js';
import type {
  ConfigValidationResult,
  ValidationError,
  ValidationWarning,
  Recommendation,
} from '@memento/shared-types';

export interface EnvironmentValidation {
  environment: 'development' | 'staging' | 'production';
  redisVersion: string;
  nodeVersion: string;
  memoryAvailable: number;
  recommendations: Recommendation[];
}

// Zod schemas for validation
const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.number().int().min(1).max(65535, 'Port must be between 1 and 65535'),
  password: z.string().optional(),
  db: z
    .number()
    .int()
    .min(0)
    .max(15, 'Redis database must be between 0 and 15')
    .optional(),
  url: z.string().url().optional(),
  tls: z.boolean().optional(),
  maxRetries: z.number().int().min(0).optional(),
  retryDelayOnFailover: z.number().int().min(0).optional(),
});

const PubSubChannelsSchema = z.object({
  global: z.string().min(1, 'Global pub/sub channel is required'),
  session: z.string().min(1, 'Session pub/sub channel prefix is required'),
});

const SessionManagerConfigSchema = z.object({
  redis: RedisConfigSchema,
  defaultTTL: z
    .number()
    .int()
    .min(60, 'Default TTL must be at least 60 seconds')
    .max(86400 * 7, 'Default TTL should not exceed 7 days'),
  checkpointInterval: z
    .number()
    .int()
    .min(1, 'Checkpoint interval must be at least 1')
    .max(1000, 'Checkpoint interval should not exceed 1000'),
  maxEventsPerSession: z
    .number()
    .int()
    .min(10, 'Max events per session must be at least 10')
    .max(100000, 'Max events per session should not exceed 100,000'),
  graceTTL: z
    .number()
    .int()
    .min(60, 'Grace TTL must be at least 60 seconds')
    .max(3600, 'Grace TTL should not exceed 1 hour'),
  enableFailureSnapshots: z.boolean(),
  pubSubChannels: PubSubChannelsSchema.optional(),
});

const SessionCreationOptionsSchema = z.object({
  ttl: z
    .number()
    .int()
    .min(60)
    .max(86400 * 7)
    .optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  tags: z.array(z.string()).optional(),
});

export class SessionConfigValidator {
  private redis?: RedisClientType;

  constructor(redis?: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Validate session manager configuration
   */
  async validateConfig(config: any): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {
      // Schema validation
      SessionManagerConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.valid = false;
        result.errors.push(...this.transformZodErrors(error));
      } else {
        result.valid = false;
        result.errors.push({
          field: 'config',
          message: 'Invalid configuration format',
          code: 'INVALID_FORMAT',
        });
      }
    }

    // Bail out early if schema validation failed
    if (!result.valid) {
      return result;
    }

    // Runtime validation
    await this.performRuntimeValidation(config, result);

    // Performance validation
    this.performPerformanceValidation(config, result);

    // Security validation
    this.performSecurityValidation(config, result);

    // Generate recommendations
    this.generateRecommendations(config, result);

    return result;
  }

  /**
   * Validate session creation options
   */
  validateSessionOptions(options: any): ConfigValidationResult {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {
      SessionCreationOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.valid = false;
        result.errors.push(...this.transformZodErrors(error));
      }
    }

    return result;
  }

  /**
   * Validate environment setup
   */
  async validateEnvironment(
    environment: 'development' | 'staging' | 'production'
  ): Promise<EnvironmentValidation> {
    const recommendations: Recommendation[] = [];

    // Check Node.js version
    const nodeVersion = process.version;
    const nodeMajorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (nodeMajorVersion < 18) {
      recommendations.push({
        category: 'security',
        message:
          'Node.js version is outdated. Consider upgrading to Node.js 18 or later',
        priority: 'medium',
        action: 'Upgrade Node.js to the latest LTS version',
      });
    }

    // Check Redis version
    let redisVersion = 'unknown';
    if (this.redis) {
      try {
        const info = await this.redis.info('server');
        const versionMatch = info.match(/redis_version:([^\r\n]+)/);
        if (versionMatch) {
          redisVersion = versionMatch[1];
          const redisMajorVersion = parseInt(redisVersion.split('.')[0]);

          if (redisMajorVersion < 6) {
            recommendations.push({
              category: 'performance',
              message:
                'Redis version is outdated. Consider upgrading to Redis 6 or later for better performance',
              priority: 'medium',
              action: 'Upgrade Redis to version 6 or later',
            });
          }
        }
      } catch (error) {
        recommendations.push({
          category: 'reliability',
          message: 'Could not determine Redis version',
          priority: 'low',
          action: 'Ensure Redis is properly connected and accessible',
        });
      }
    }

    // Check memory availability
    const memoryUsage = process.memoryUsage();
    const memoryAvailable = memoryUsage.heapTotal;

    if (environment === 'production') {
      if (memoryAvailable < 512 * 1024 * 1024) {
        // 512MB
        recommendations.push({
          category: 'performance',
          message:
            'Available memory may be insufficient for production workloads',
          priority: 'high',
          action: 'Increase available memory to at least 1GB for production',
        });
      }

      // Production-specific recommendations
      recommendations.push(
        {
          category: 'security',
          message: 'Ensure Redis AUTH is enabled in production',
          priority: 'high',
          action: 'Configure Redis password authentication',
        },
        {
          category: 'reliability',
          message:
            'Enable Redis persistence (RDB and/or AOF) for data durability',
          priority: 'high',
          action: 'Configure Redis persistence settings',
        },
        {
          category: 'performance',
          message: 'Consider Redis clustering for high availability',
          priority: 'medium',
          action: 'Evaluate Redis Cluster or Redis Sentinel setup',
        }
      );
    } else if (environment === 'development') {
      recommendations.push({
        category: 'performance',
        message:
          'Consider using shorter TTLs in development to reduce memory usage',
        priority: 'low',
        action: 'Set defaultTTL to 300-600 seconds for development',
      });
    }

    return {
      environment,
      redisVersion,
      nodeVersion,
      memoryAvailable,
      recommendations,
    };
  }

  /**
   * Validate Redis connection
   */
  async validateRedisConnection(
    config: RedisConfig
  ): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {
      // Create temporary Redis client for testing
      const { createClient } = await import('redis');
      const testClient = createClient({
        url: config.url,
        socket: {
          host: config.host,
          port: config.port,
        },
        password: config.password,
        database: config.db || 0,
      });

      // Test connection
      await testClient.connect();

      // Test basic operations
      const testKey = `test:connection:${Date.now()}`;
      await testClient.set(testKey, 'test', { EX: 10 });
      const value = await testClient.get(testKey);
      await testClient.del(testKey);

      if (value !== 'test') {
        result.errors.push({
          field: 'redis.connection',
          message:
            'Redis connection test failed - could not read/write test data',
          code: 'CONNECTION_TEST_FAILED',
        });
        result.valid = false;
      }

      // Get Redis info for additional validation
      const info = await testClient.info();
      const memory = await testClient.info('memory');

      // Parse memory info
      const maxMemoryMatch = memory.match(/maxmemory:(\d+)/);
      const usedMemoryMatch = memory.match(/used_memory:(\d+)/);

      if (maxMemoryMatch && usedMemoryMatch) {
        const maxMemory = parseInt(maxMemoryMatch[1]);
        const usedMemory = parseInt(usedMemoryMatch[1]);

        if (maxMemory > 0) {
          const memoryUsagePercent = (usedMemory / maxMemory) * 100;
          if (memoryUsagePercent > 80) {
            result.warnings.push({
              field: 'redis.memory',
              message: `Redis memory usage is at ${memoryUsagePercent.toFixed(
                1
              )}%`,
              value: memoryUsagePercent,
              impact: 'high',
            });
          }
        }
      }

      // Check Redis configuration
      await this.validateRedisConfiguration(
        testClient as RedisClientType,
        result
      );

      await testClient.quit();
    } catch (error) {
      result.valid = false;
      result.errors.push({
        field: 'redis.connection',
        message: `Failed to connect to Redis: ${
          error instanceof Error ? error.message : String(error)
        }`,
        code: 'CONNECTION_FAILED',
      });
    }

    return result;
  }

  /**
   * Validate production readiness
   */
  async validateProductionReadiness(
    config: SessionManagerConfig
  ): Promise<ConfigValidationResult> {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Check TTL configuration
    const defaultTTL = config.defaultTTL;
    if (typeof defaultTTL === 'number' && defaultTTL < 3600) {
      // 1 hour
      result.warnings.push({
        field: 'defaultTTL',
        message: 'Default TTL is quite short for production use',
        value: defaultTTL,
        impact: 'medium',
      });
    }

    // Check checkpoint interval
    const checkpointInterval = config.checkpointInterval;
    if (typeof checkpointInterval === 'number' && checkpointInterval > 100) {
      result.warnings.push({
        field: 'checkpointInterval',
        message: 'Checkpoint interval is high, may impact recovery time',
        value: checkpointInterval,
        impact: 'medium',
      });
    }

    // Check max events per session
    const maxEventsPerSession = config.maxEventsPerSession;
    if (
      typeof maxEventsPerSession === 'number' &&
      maxEventsPerSession > 10000
    ) {
      result.warnings.push({
        field: 'maxEventsPerSession',
        message: 'High max events per session may impact memory usage',
        value: maxEventsPerSession,
        impact: 'medium',
      });
    }

    // Check failure snapshots
    if (!config.enableFailureSnapshots) {
      result.recommendations.push({
        category: 'reliability',
        message: 'Consider enabling failure snapshots for better debugging',
        priority: 'medium',
        action: 'Set enableFailureSnapshots to true',
      });
    }

    // Check Redis authentication
    if (!config.redis.password) {
      result.errors.push({
        field: 'redis.password',
        message: 'Redis password is required for production',
        code: 'MISSING_AUTH',
      });
      result.valid = false;
    }

    // Check TLS
    if (!config.redis.tls) {
      result.warnings.push({
        field: 'redis.tls',
        message: 'TLS is not enabled for Redis connection',
        impact: 'high',
      });
    }

    return result;
  }

  /**
   * Perform runtime validation
   */
  private async performRuntimeValidation(
    config: SessionManagerConfig,
    result: ConfigValidationResult
  ): Promise<void> {
    // Validate Redis connection if client is available
    if (this.redis) {
      try {
        await this.redis.ping();
      } catch (error) {
        result.errors.push({
          field: 'redis.runtime',
          message: 'Redis connection is not available',
          code: 'REDIS_UNAVAILABLE',
        });
        result.valid = false;
      }
    }

    // Validate memory constraints
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) {
      // 500MB
      result.warnings.push({
        field: 'system.memory',
        message: 'High memory usage detected',
        value: heapUsedMB,
        impact: 'medium',
      });
    }
  }

  /**
   * Perform performance validation
   */
  private performPerformanceValidation(
    config: SessionManagerConfig,
    result: ConfigValidationResult
  ): void {
    // TTL recommendations
    const defaultTTL = config.defaultTTL;
    if (typeof defaultTTL === 'number' && defaultTTL > 86400 * 3) {
      // 3 days
      result.warnings.push({
        field: 'defaultTTL',
        message: 'Very long default TTL may impact memory usage',
        value: defaultTTL,
        impact: 'medium',
      });
    }

    // Checkpoint interval recommendations
    const checkpointInterval = config.checkpointInterval;
    if (typeof checkpointInterval === 'number' && checkpointInterval < 5) {
      result.warnings.push({
        field: 'checkpointInterval',
        message: 'Very frequent checkpoints may impact performance',
        value: checkpointInterval,
        impact: 'medium',
      });
    }

    // Max events validation
    const maxEventsPerSession = config.maxEventsPerSession;
    if (
      typeof maxEventsPerSession === 'number' &&
      maxEventsPerSession > 50000
    ) {
      result.warnings.push({
        field: 'maxEventsPerSession',
        message: 'Very high max events may cause memory issues',
        value: maxEventsPerSession,
        impact: 'high',
      });
    }
  }

  /**
   * Perform security validation
   */
  private performSecurityValidation(
    config: SessionManagerConfig,
    result: ConfigValidationResult
  ): void {
    // Redis security checks
    if (config.redis.host === '0.0.0.0') {
      result.warnings.push({
        field: 'redis.host',
        message:
          'Redis host set to bind all interfaces, ensure firewall is configured',
        value: config.redis.host,
        impact: 'high',
      });
    }

    if (!config.redis.password) {
      result.warnings.push({
        field: 'redis.password',
        message: 'Redis authentication is not configured',
        impact: 'high',
      });
    }

    // Pub/sub channel security
    if (config.pubSubChannels?.global === 'global') {
      result.warnings.push({
        field: 'pubSubChannels.global',
        message: 'Generic pub/sub channel name may cause conflicts',
        value: config.pubSubChannels.global,
        impact: 'low',
      });
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    config: SessionManagerConfig,
    result: ConfigValidationResult
  ): void {
    // Performance recommendations
    const defaultTTL = config.defaultTTL;
    if (defaultTTL === undefined || defaultTTL < 1800) {
      result.recommendations.push({
        category: 'performance',
        message: 'Consider increasing default TTL to reduce Redis memory churn',
        priority: 'low',
        action: 'Set defaultTTL to at least 1800 seconds (30 minutes)',
      });
    }

    if (!config.enableFailureSnapshots) {
      result.recommendations.push({
        category: 'reliability',
        message: 'Enable failure snapshots for better debugging capabilities',
        priority: 'medium',
        action: 'Set enableFailureSnapshots to true',
      });
    }

    // Security recommendations
    result.recommendations.push({
      category: 'security',
      message: 'Regularly rotate Redis passwords and review access controls',
      priority: 'medium',
      action: 'Implement password rotation policy',
    });

    // Cost optimization
    const maxEventsPerSession = config.maxEventsPerSession;
    if (typeof maxEventsPerSession === 'number' && maxEventsPerSession > 1000) {
      result.recommendations.push({
        category: 'cost',
        message: 'High max events per session increases memory costs',
        priority: 'low',
        action: 'Consider reducing maxEventsPerSession if not needed',
      });
    }
  }

  /**
   * Validate Redis configuration
   */
  private async validateRedisConfiguration(
    client: RedisClientType,
    result: ConfigValidationResult
  ): Promise<void> {
    try {
      // Check Redis configuration
      const configs = await client.configGet('*');
      const configMap = new Map(Object.entries(configs));

      // Check maxmemory policy
      const maxMemoryPolicy = configMap.get('maxmemory-policy');
      if (maxMemoryPolicy === 'noeviction') {
        result.warnings.push({
          field: 'redis.maxmemory-policy',
          message:
            'Redis maxmemory-policy is set to noeviction, may cause out of memory errors',
          value: maxMemoryPolicy,
          impact: 'high',
        });
      }

      // Check save configuration
      const save = configMap.get('save');
      if (!save || save === '') {
        result.warnings.push({
          field: 'redis.save',
          message:
            'Redis persistence is disabled, data will be lost on restart',
          impact: 'high',
        });
      }
    } catch (error) {
      result.warnings.push({
        field: 'redis.config',
        message: 'Could not retrieve Redis configuration for validation',
        impact: 'low',
      });
    }
  }

  /**
   * Transform Zod errors to validation errors
   */
  private transformZodErrors(zodError: z.ZodError): ValidationError[] {
    return zodError.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
      value:
        error.code === 'invalid_type' ? (error as any).received : undefined,
      code: error.code.toUpperCase(),
    }));
  }

  /**
   * Generate configuration report
   */
  async generateConfigurationReport(config: SessionManagerConfig): Promise<{
    validation: ConfigValidationResult;
    environment: EnvironmentValidation;
    recommendations: Recommendation[];
  }> {
    const [validation, environment] = await Promise.all([
      this.validateConfig(config),
      this.validateEnvironment('production'), // Assume production for thorough validation
    ]);

    const allRecommendations = [
      ...validation.recommendations,
      ...environment.recommendations,
    ];

    return {
      validation,
      environment,
      recommendations: allRecommendations,
    };
  }
}
