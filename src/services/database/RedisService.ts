import { createClient as createRedisClient, RedisClientType } from 'redis';
import { IRedisService } from './interfaces.js';

export class RedisService implements IRedisService {
  private redisClient!: RedisClientType;
  private initialized = false;
  private config: { url: string };

  constructor(config: { url: string }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.redisClient = createRedisClient({
        url: this.config.url,
      });

      await this.redisClient.connect();
      this.initialized = true;
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): RedisClientType {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }

    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.del(key);
  }

  async flushDb(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    await this.redisClient.flushDb();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}
