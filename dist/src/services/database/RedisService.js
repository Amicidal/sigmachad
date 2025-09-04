import { createClient as createRedisClient } from 'redis';
export class RedisService {
    redisClient;
    initialized = false;
    config;
    constructor(config) {
        this.config = config;
    }
    async initialize() {
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
        }
        catch (error) {
            console.error('❌ Redis initialization failed:', error);
            throw error;
        }
    }
    async close() {
        if (this.redisClient) {
            await this.redisClient.disconnect();
        }
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    async get(key) {
        if (!this.initialized) {
            throw new Error('Redis not configured');
        }
        return this.redisClient.get(key);
    }
    async set(key, value, ttl) {
        if (!this.initialized) {
            throw new Error('Redis not configured');
        }
        if (ttl) {
            await this.redisClient.setEx(key, ttl, value);
        }
        else {
            await this.redisClient.set(key, value);
        }
    }
    async del(key) {
        if (!this.initialized) {
            throw new Error('Redis not configured');
        }
        return this.redisClient.del(key);
    }
    async healthCheck() {
        try {
            await this.redisClient.ping();
            return true;
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
}
//# sourceMappingURL=RedisService.js.map