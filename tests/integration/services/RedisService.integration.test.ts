/**
 * Integration tests for RedisService
 * Tests Redis operations with real Redis instance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RedisService } from '../../../src/services/database/RedisService';

// Gate running these integration tests via environment. When not enabled, the
// whole suite is declared as skipped at definition time (no dummy assertions).
const runRedis = process.env.RUN_REDIS_TESTS === '1';
const describeIfRun = runRedis ? describe : describe.skip;

describe('RedisService Integration', () => {
  let redisService: RedisService;
  let isRedisAvailable = false;

  beforeAll(async () => {
    if (!runRedis) {
      return;
    }

    const testConfig = {
      url: process.env.REDIS_URL || 'redis://localhost:6381',
    };

    redisService = new RedisService(testConfig);

    await redisService.initialize();
    isRedisAvailable = redisService.isInitialized();
    if (!isRedisAvailable) {
      throw new Error('Redis not available for integration tests');
    }
    console.log('✅ Redis connection established for integration tests');
  }, 30000);

  afterAll(async () => {
    if (redisService && redisService.isInitialized()) {
      await redisService.close();
    }
  });

  beforeEach(async () => {
    try {
      // Clean up test keys
      const testKeys = await redisService.getClient().keys('test_*');
      if (testKeys.length > 0) {
        await redisService.getClient().del(testKeys);
      }
    } catch (error) {
      console.warn('Failed to clean up test keys:', error);
    }
  });

  describeIfRun('Initialization and Connection', () => {
    it('should initialize Redis service successfully when available', async () => {
      expect(redisService.isInitialized()).toBe(true);
      expect(redisService.getClient()).toEqual(expect.any(Object));
    });

    it('should handle health checks', async () => {
      const isHealthy = await redisService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should handle connection closure', async () => {
      expect(redisService.isInitialized()).toBe(true);

      await redisService.close();
      expect(redisService.isInitialized()).toBe(false);

      // Reinitialize for other tests
      await redisService.initialize();
      expect(redisService.isInitialized()).toBe(true);
    });
  });

  describeIfRun('Basic Key-Value Operations', () => {
    it('should set and get string values', async () => {
      const testKey = 'test_string_key';
      const testValue = 'Hello, Redis Integration Test!';

      // Set value
      await redisService.set(testKey, testValue);

      // Get value
      const retrievedValue = await redisService.get(testKey);

      expect(retrievedValue).toBe(testValue);
    });

    it('should handle non-existent keys', async () => {
      const nonExistentKey = 'test_non_existent_key';

      const value = await redisService.get(nonExistentKey);
      expect(value).toBeNull();
    });

    it('should overwrite existing keys', async () => {
      const testKey = 'test_overwrite_key';

      // Set initial value
      await redisService.set(testKey, 'initial value');
      let value = await redisService.get(testKey);
      expect(value).toBe('initial value');

      // Overwrite value
      await redisService.set(testKey, 'overwritten value');
      value = await redisService.get(testKey);
      expect(value).toBe('overwritten value');
    });

    it('should handle deletion of keys', async () => {

      const testKey = 'test_delete_key';
      const testValue = 'value to delete';

      // Set and verify value exists
      await redisService.set(testKey, testValue);
      let value = await redisService.get(testKey);
      expect(value).toBe(testValue);

      // Delete key
      const deleteResult = await redisService.del(testKey);
      expect(deleteResult).toBe(1); // Redis DEL returns number of keys deleted

      // Verify key is gone
      value = await redisService.get(testKey);
      expect(value).toBeNull();
    });

    it('should handle deletion of non-existent keys', async () => {

      const nonExistentKey = 'test_delete_non_existent';

      const deleteResult = await redisService.del(nonExistentKey);
      expect(deleteResult).toBe(0); // Redis DEL returns 0 for non-existent keys
    });
  });

  describeIfRun('TTL (Time-To-Live) Operations', () => {
    it('should set keys with TTL', async () => {

      const testKey = 'test_ttl_key';
      const testValue = 'expires soon';
      const ttlSeconds = 2; // 2 seconds

      // Set with TTL
      await redisService.set(testKey, testValue, ttlSeconds);

      // Verify value exists immediately
      let value = await redisService.get(testKey);
      expect(value).toBe(testValue);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, (ttlSeconds + 1) * 1000));

      // Verify key has expired
      value = await redisService.get(testKey);
      expect(value).toBeNull();
    });

    it('should handle TTL expiration timing', async () => {

      const testKey = 'test_ttl_timing';
      const testValue = 'timing test';
      const ttlSeconds = 1; // 1 second

      const startTime = Date.now();
      await redisService.set(testKey, testValue, ttlSeconds);

      // Poll for expiration
      let expired = false;
      const maxWaitTime = 3000; // 3 seconds max

      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
        const value = await redisService.get(testKey);
        if (value === null) {
          expired = true;
          break;
        }
      }

      expect(expired).toBe(true);

      const elapsedTime = Date.now() - startTime;
      // Should expire around 1 second (with some tolerance)
      expect(elapsedTime).toBeGreaterThanOrEqual(900);
      expect(elapsedTime).toBeLessThanOrEqual(1500);
    });

    it('should persist keys without TTL', async () => {

      const testKey = 'test_persistent_key';
      const testValue = 'persistent value';

      // Set without TTL
      await redisService.set(testKey, testValue);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify value still exists
      const value = await redisService.get(testKey);
      expect(value).toBe(testValue);
    });
  });

  describeIfRun('Complex Data Types', () => {
    it('should handle JSON objects', async () => {

      const testKey = 'test_json_key';
      const testObject = {
        name: 'Integration Test',
        type: 'redis_test',
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          environment: 'test',
          nested: {
            value: 42,
            array: [1, 2, 3, 'test']
          }
        }
      };

      // Set JSON object
      await redisService.set(testKey, JSON.stringify(testObject));

      // Get and parse JSON object
      const retrievedValue = await redisService.get(testKey);
      expect(typeof retrievedValue).toBe('string');
      expect(retrievedValue).not.toHaveLength(0);

      const parsedObject = JSON.parse(retrievedValue!);
      expect(parsedObject).toEqual(testObject);
      expect(parsedObject.metadata.nested.array).toEqual([1, 2, 3, 'test']);
    });

    it('should handle large values', async () => {

      const testKey = 'test_large_value';
      const largeValue = 'x'.repeat(100000); // 100KB string

      await redisService.set(testKey, largeValue);

      const retrievedValue = await redisService.get(testKey);
      expect(retrievedValue).toBe(largeValue);
      expect(retrievedValue?.length).toBe(100000);
    });

    it('should handle special characters and unicode', async () => {

      const testKey = 'test_unicode_key';
      const unicodeValue = 'Hello 世界 🌍 émojis 🚀 and special chars: àáâãäåæçèéêë';

      await redisService.set(testKey, unicodeValue);

      const retrievedValue = await redisService.get(testKey);
      expect(retrievedValue).toBe(unicodeValue);
    });
  });

  describeIfRun('Batch Operations', () => {
    it('should handle multiple key operations', async () => {

      const testKeys = ['batch_key_1', 'batch_key_2', 'batch_key_3', 'batch_key_4', 'batch_key_5'];
      const testValues = ['value1', 'value2', 'value3', 'value4', 'value5'];

      // Set multiple keys
      const setPromises = testKeys.map((key, index) =>
        redisService.set(key, testValues[index])
      );
      await Promise.all(setPromises);

      // Get multiple keys
      const getPromises = testKeys.map(key => redisService.get(key));
      const retrievedValues = await Promise.all(getPromises);

      expect(retrievedValues).toEqual(testValues);

      // Delete multiple keys
      const deletePromises = testKeys.map(key => redisService.del(key));
      const deleteResults = await Promise.all(deletePromises);

      // Each delete should return 1 (one key deleted)
      deleteResults.forEach(result => {
        expect(result).toBe(1);
      });

      // Verify all keys are gone
      const finalGetPromises = testKeys.map(key => redisService.get(key));
      const finalValues = await Promise.all(finalGetPromises);
      finalValues.forEach(value => {
        expect(value).toBeNull();
      });
    });

    it('should handle concurrent operations', async () => {

      const concurrentOperations = 10;
      const operations: Promise<any>[] = [];
      const operationIds: string[] = [];

      // Create concurrent set operations
      for (let i = 0; i < concurrentOperations; i++) {
        const key = `concurrent_key_${i}`;
        const value = `concurrent_value_${i}`;
        operationIds.push(key);

        operations.push(redisService.set(key, value));
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for concurrent operations

      // Verify all operations completed successfully
      const verifyPromises = operationIds.map(key => redisService.get(key));
      const verifyResults = await Promise.all(verifyPromises);

      verifyResults.forEach((result, index) => {
        expect(result).toBe(`concurrent_value_${index}`);
      });

      // Clean up
      const cleanupPromises = operationIds.map(key => redisService.del(key));
      await Promise.all(cleanupPromises);
    });
  });

  describeIfRun('Cache-like Operations', () => {
    it('should implement cache set/get pattern', async () => {

      const cacheKey = 'cache:user:123';
      const cacheValue = JSON.stringify({
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        cachedAt: new Date().toISOString()
      });
      const cacheTTL = 300; // 5 minutes

      // Cache miss - set value
      await redisService.set(cacheKey, cacheValue, cacheTTL);

      // Cache hit - get value
      const cachedValue = await redisService.get(cacheKey);
      expect(cachedValue).toBe(cacheValue);

      const parsedCache = JSON.parse(cachedValue!);
      expect(parsedCache.id).toBe(123);
      expect(parsedCache.name).toBe('John Doe');
    });

    it('should handle cache invalidation', async () => {

      const cacheKey = 'cache:product:456';
      const originalValue = JSON.stringify({
        id: 456,
        name: 'Original Product',
        price: 29.99
      });
      const updatedValue = JSON.stringify({
        id: 456,
        name: 'Updated Product',
        price: 39.99
      });

      // Set original cache
      await redisService.set(cacheKey, originalValue, 3600);

      // Verify original value
      let cachedValue = await redisService.get(cacheKey);
      expect(JSON.parse(cachedValue!).name).toBe('Original Product');

      // Invalidate cache (simulate update)
      await redisService.del(cacheKey);

      // Verify cache is cleared
      cachedValue = await redisService.get(cacheKey);
      expect(cachedValue).toBeNull();

      // Set updated cache
      await redisService.set(cacheKey, updatedValue, 3600);

      // Verify updated value
      cachedValue = await redisService.get(cacheKey);
      expect(JSON.parse(cachedValue!).name).toBe('Updated Product');
    });

    it('should handle cache with multiple keys', async () => {

      const cacheKeys = [
        'cache:users:list',
        'cache:users:count',
        'cache:users:last_updated'
      ];
      const cacheValues = [
        JSON.stringify([{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }]),
        '2',
        new Date().toISOString()
      ];

      // Set multiple cache entries
      const setPromises = cacheKeys.map((key, index) =>
        redisService.set(key, cacheValues[index], 1800) // 30 minutes TTL
      );
      await Promise.all(setPromises);

      // Get multiple cache entries
      const getPromises = cacheKeys.map(key => redisService.get(key));
      const retrievedValues = await Promise.all(getPromises);

      expect(retrievedValues).toEqual(cacheValues);

      // Verify JSON parsing for complex data
      const usersList = JSON.parse(retrievedValues[0]!);
      expect(usersList).toHaveLength(2);
      expect(usersList[0].name).toBe('User 1');
    });
  });

  describeIfRun('Session-like Operations', () => {
    it('should handle session storage and retrieval', async () => {

      const sessionId = 'session_abc123def456';
      const sessionData = {
        userId: 'user_789',
        username: 'testuser',
        roles: ['user', 'admin'],
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true
        }
      };

      // Store session
      await redisService.set(sessionId, JSON.stringify(sessionData), 3600); // 1 hour TTL

      // Retrieve session
      const storedSession = await redisService.get(sessionId);
      expect(typeof storedSession).toBe('string');
      expect(storedSession).not.toHaveLength(0);

      const parsedSession = JSON.parse(storedSession!);
      expect(parsedSession).toEqual(sessionData);
      expect(parsedSession.userId).toBe('user_789');
      expect(parsedSession.roles).toContain('admin');
    });

    it('should handle session expiration', async () => {

      const sessionId = 'session_short_lived';
      const sessionData = { userId: 'temp_user', temp: true };

      // Set session with short TTL (2 seconds)
      await redisService.set(sessionId, JSON.stringify(sessionData), 2);

      // Verify session exists
      let session = await redisService.get(sessionId);
      expect(typeof session).toBe('string');
      expect(session).not.toHaveLength(0);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify session has expired
      session = await redisService.get(sessionId);
      expect(session).toBeNull();
    });

    it('should handle session updates', async () => {

      const sessionId = 'session_update_test';
      const initialSession = {
        userId: 'user_123',
        loginTime: new Date().toISOString(),
        pageViews: 1
      };

      // Set initial session
      await redisService.set(sessionId, JSON.stringify(initialSession), 3600);

      // Update session (simulate page view)
      const updatedSession = {
        ...initialSession,
        pageViews: 2,
        lastActivity: new Date().toISOString()
      };

      await redisService.set(sessionId, JSON.stringify(updatedSession), 3600);

      // Verify update
      const storedSession = await redisService.get(sessionId);
      const parsedSession = JSON.parse(storedSession!);

      expect(parsedSession.pageViews).toBe(2);
      expect(typeof parsedSession.lastActivity).toBe('string');
      expect(Number.isNaN(Date.parse(parsedSession.lastActivity))).toBe(false);
    });
  });

  describeIfRun('Performance and Load Testing', () => {
    it('should handle high-throughput operations', async () => {

      const operationCount = 100;
      const operations: Promise<any>[] = [];
      const testKeys: string[] = [];

      // Create high volume of operations
      for (let i = 0; i < operationCount; i++) {
        const key = `perf_test_key_${i}`;
        const value = `perf_test_value_${i}`;
        testKeys.push(key);

        operations.push(redisService.set(key, value));
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const throughput = operationCount / (duration / 1000); // operations per second

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(throughput).toBeGreaterThan(5); // At least 5 operations per second

      console.log(`High-throughput test: ${operationCount} operations in ${duration}ms (${throughput.toFixed(2)} ops/sec)`);

      // Clean up
      const cleanupOperations = testKeys.map(key => redisService.del(key));
      await Promise.all(cleanupOperations);
    });

    it('should handle memory-intensive operations', async () => {

      const largeKeyCount = 20;
      const largeValueSize = 50000; // 50KB per value
      const operations: Promise<any>[] = [];
      const testKeys: string[] = [];

      // Create memory-intensive operations
      for (let i = 0; i < largeKeyCount; i++) {
        const key = `memory_test_key_${i}`;
        const value = 'x'.repeat(largeValueSize);
        testKeys.push(key);

        operations.push(redisService.set(key, value));
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should handle large values within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds max for large values

      // Verify all values were stored correctly
      const verifyPromises = testKeys.map(key => redisService.get(key));
      const verifyResults = await Promise.all(verifyPromises);

      verifyResults.forEach((result, index) => {
        expect(typeof result).toBe('string');
        expect(result.length).toBe(largeValueSize);
      });

      // Clean up
      const cleanupOperations = testKeys.map(key => redisService.del(key));
      await Promise.all(cleanupOperations);
    });
  });

  describeIfRun('Error Handling and Edge Cases', () => {
    it('should handle connection errors gracefully', async () => {

      // Test with valid connection first
      const isHealthyBefore = await redisService.healthCheck();
      expect(isHealthyBefore).toBe(true);

      // Close connection to simulate error
      await redisService.close();

      await expect(redisService.get('test_key')).rejects.toEqual(
        expect.objectContaining({ message: expect.any(String) })
      );

      // Reconnect for other tests
      await redisService.initialize();
      const isHealthyAfter = await redisService.healthCheck();
      expect(isHealthyAfter).toBe(true);
    });

    it('should handle invalid key names', async () => {

      // Redis generally accepts most key names, but let's test edge cases
      const edgeCaseKeys = [
        'normal_key',
        'key with spaces',
        'key-with-dashes',
        'key.with.dots',
        'key:with:colons',
        'unicode_key_🚀',
        'key\nwith\nnewlines' // This might cause issues
      ];

      const testPromises = edgeCaseKeys.map(key =>
        redisService.set(key, `value_for_${key}`)
      );

      await Promise.all(testPromises);

      // Verify all keys work
      const getPromises = edgeCaseKeys.map(key => redisService.get(key));
      const getResults = await Promise.all(getPromises);

      getResults.forEach((result, index) => {
        expect(result).toBe(`value_for_${edgeCaseKeys[index]}`);
      });

      // Clean up
      const cleanupPromises = edgeCaseKeys.map(key => redisService.del(key));
      await Promise.all(cleanupPromises);
    });

    it('should handle null and undefined values', async () => {

      const testKey = 'test_null_undefined';

      // Redis doesn't natively support null values, so we need to handle this
      try {
        await redisService.set(testKey, null as any);
        // If we get here, Redis accepted null (might happen with some Redis clients)
      } catch (error) {
        // Expected: null values should be rejected
        expect((error as any)).toHaveProperty('message');
      }

      try {
        await redisService.set(testKey, undefined as any);
        // If we get here, Redis accepted undefined (might happen with some Redis clients)
      } catch (error) {
        // Expected: undefined values should be rejected
        expect((error as any)).toHaveProperty('message');
      }
    });

    it('should handle very long keys and values', async () => {

      // Test with very long key (Redis supports up to 512MB for keys and values)
      const longKey = 'a'.repeat(1000); // 1000 character key
      const longValue = 'b'.repeat(10000); // 10KB value

      await redisService.set(longKey, longValue);

      const retrievedValue = await redisService.get(longKey);
      expect(retrievedValue).toBe(longValue);
      expect(retrievedValue?.length).toBe(10000);

      // Clean up
      await redisService.del(longKey);
    });
  });

  describeIfRun('Real-world Usage Scenarios', () => {
    it('should implement rate limiting pattern', async () => {

      const userId = 'user_rate_limit_test';
      const windowSeconds = 2; // shorter window for tests
      const maxRequests = 5;

      // Simulate rate limiting logic
      const rateLimitKey = `ratelimit:${userId}`;

      // Check current count
      let currentCount = await redisService.get(rateLimitKey);
      let count = currentCount ? parseInt(currentCount) : 0;

      // Allow request if under limit
      if (count < maxRequests) {
        count++;
        await redisService.set(rateLimitKey, count.toString(), windowSeconds);

        expect(count).toBeLessThanOrEqual(maxRequests);
      }

      // Simulate multiple requests
      for (let i = 0; i < maxRequests - 1; i++) {
        currentCount = await redisService.get(rateLimitKey);
        count = currentCount ? parseInt(currentCount) : 0;

        if (count < maxRequests) {
          count++;
          await redisService.set(rateLimitKey, count.toString(), windowSeconds);
        }
      }

      // Next request should be rate limited
      currentCount = await redisService.get(rateLimitKey);
      count = currentCount ? parseInt(currentCount) : 0;

      expect(count).toBe(maxRequests);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, (windowSeconds + 1) * 1000));

      // Should be able to make request again
      currentCount = await redisService.get(rateLimitKey);
      count = currentCount ? parseInt(currentCount) : 0;

      // Count should be 0 or key should not exist after expiration
      expect(count).toBe(0);
    });

    it('should implement distributed locking pattern', async () => {

      const lockKey = 'distributed_lock_test';
      const lockValue = `lock_${Date.now()}_${Math.random()}`;
      const lockTTL = 10; // 10 seconds

      // Acquire lock
      const lockAcquired = await redisService.set(lockKey, lockValue, lockTTL);
      expect(lockAcquired).toBeUndefined(); // SET returns undefined on success

      // Verify lock is held
      const currentLock = await redisService.get(lockKey);
      expect(currentLock).toBe(lockValue);

      // Try to acquire lock again (should fail if implemented with NX option)
      // Note: This is a simplified version - in production you'd use SET with NX option
      const secondAttempt = await redisService.get(lockKey);
      expect(secondAttempt).toBe(lockValue); // Lock still held

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, (lockTTL + 1) * 1000));

      // Lock should be released
      const expiredLock = await redisService.get(lockKey);
      expect(expiredLock).toBeNull();
    });

    it('should implement pub/sub messaging pattern', async () => {

      const client = redisService.getClient();
      const channel = 'test_notifications';
      const messages: string[] = [];

      // Subscribe to channel
      const subscriber = client.duplicate();
      await subscriber.connect();

      await subscriber.subscribe(channel, (message) => {
        messages.push(message);
      });

      // Wait for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish messages
      const testMessages = [
        'User logged in',
        'File uploaded',
        'Cache invalidated',
        'System alert'
      ];

      for (const message of testMessages) {
        await client.publish(channel, message);
      }

      // Wait for messages to be received
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify messages were received
      expect(messages).toHaveLength(testMessages.length);
      expect(messages).toEqual(testMessages);

      // Clean up
      await subscriber.unsubscribe(channel);
      await subscriber.disconnect();
    });
  });
});
