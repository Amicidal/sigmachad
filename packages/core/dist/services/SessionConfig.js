/**
 * Session Configuration
 *
 * Configuration management for Redis session coordination
 * Provides environment-based configuration with sensible defaults
 */
export class SessionConfig {
    constructor() {
        this.config = this.loadConfiguration();
    }
    static getInstance() {
        if (!SessionConfig.instance) {
            SessionConfig.instance = new SessionConfig();
        }
        return SessionConfig.instance;
    }
    getConfig() {
        return { ...this.config };
    }
    getRedisConfig() {
        return { ...this.config.redis };
    }
    loadConfiguration() {
        // Load Redis configuration from environment
        const redisConfig = {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_SESSION_DB || '0', 10),
            maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
            retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
            lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
        };
        // Load session manager configuration
        const sessionConfig = {
            redis: redisConfig,
            defaultTTL: parseInt(process.env.SESSION_DEFAULT_TTL || '3600', 10), // 1 hour
            checkpointInterval: parseInt(process.env.SESSION_CHECKPOINT_INTERVAL || '10', 10),
            maxEventsPerSession: parseInt(process.env.SESSION_MAX_EVENTS || '1000', 10),
            graceTTL: parseInt(process.env.SESSION_GRACE_TTL || '300', 10), // 5 minutes
            enableFailureSnapshots: process.env.SESSION_ENABLE_FAILURE_SNAPSHOTS === 'true',
            pubSubChannels: {
                global: process.env.SESSION_GLOBAL_CHANNEL || 'global:sessions',
                session: process.env.SESSION_CHANNEL_PREFIX || 'session:',
            },
        };
        console.log('[SessionConfig] Loaded configuration:', {
            redis: {
                host: redisConfig.host,
                port: redisConfig.port,
                db: redisConfig.db,
                hasPassword: !!redisConfig.password,
                hasUrl: !!redisConfig.url,
            },
            session: {
                defaultTTL: sessionConfig.defaultTTL,
                checkpointInterval: sessionConfig.checkpointInterval,
                enableFailureSnapshots: sessionConfig.enableFailureSnapshots,
            },
        });
        return sessionConfig;
    }
    // ========== Configuration Validation ==========
    validateConfiguration() {
        const errors = [];
        // Validate Redis configuration
        if (!this.config.redis.url && !this.config.redis.host) {
            errors.push('Redis host or URL must be specified');
        }
        if (this.config.redis.port && (this.config.redis.port < 1 || this.config.redis.port > 65535)) {
            errors.push('Redis port must be between 1 and 65535');
        }
        if (this.config.redis.db && (this.config.redis.db < 0 || this.config.redis.db > 15)) {
            errors.push('Redis database must be between 0 and 15');
        }
        // Validate session configuration
        if (this.config.defaultTTL < 60) {
            errors.push('Default TTL must be at least 60 seconds');
        }
        if (this.config.checkpointInterval < 1) {
            errors.push('Checkpoint interval must be at least 1 event');
        }
        if (this.config.maxEventsPerSession < 10) {
            errors.push('Max events per session must be at least 10');
        }
        if (this.config.graceTTL < 30) {
            errors.push('Grace TTL must be at least 30 seconds');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    // ========== Environment Detection ==========
    getEnvironment() {
        var _a;
        const env = (_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (env === 'test')
            return 'test';
        if (env === 'production')
            return 'production';
        return 'development';
    }
    isDevelopment() {
        return this.getEnvironment() === 'development';
    }
    isProduction() {
        return this.getEnvironment() === 'production';
    }
    isTest() {
        return this.getEnvironment() === 'test';
    }
    // ========== Configuration Updates ==========
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates,
            redis: {
                ...this.config.redis,
                ...updates.redis,
            },
            pubSubChannels: {
                ...this.config.pubSubChannels,
                ...updates.pubSubChannels,
            },
        };
        console.log('[SessionConfig] Configuration updated');
    }
    // ========== Preset Configurations ==========
    static getDevelopmentConfig() {
        return {
            redis: {
                host: 'localhost',
                port: 6379,
                db: 0,
                lazyConnect: true,
            },
            defaultTTL: 1800, // 30 minutes for development
            checkpointInterval: 5, // More frequent checkpoints
            maxEventsPerSession: 500,
            graceTTL: 180, // 3 minutes
            enableFailureSnapshots: true,
            pubSubChannels: {
                global: 'dev:global:sessions',
                session: 'dev:session:',
            },
        };
    }
    static getTestConfig() {
        return {
            redis: {
                host: 'localhost',
                port: 6379,
                db: 15, // Use separate DB for tests
                lazyConnect: true,
            },
            defaultTTL: 300, // 5 minutes for tests
            checkpointInterval: 3,
            maxEventsPerSession: 100,
            graceTTL: 60,
            enableFailureSnapshots: false,
            pubSubChannels: {
                global: 'test:global:sessions',
                session: 'test:session:',
            },
        };
    }
    static getProductionConfig() {
        return {
            redis: {
                url: process.env.REDIS_URL,
                maxRetriesPerRequest: 5,
                retryDelayOnFailover: 200,
                lazyConnect: false,
            },
            defaultTTL: 3600, // 1 hour
            checkpointInterval: 15, // Less frequent in production
            maxEventsPerSession: 2000,
            graceTTL: 600, // 10 minutes
            enableFailureSnapshots: true,
            pubSubChannels: {
                global: 'global:sessions',
                session: 'session:',
            },
        };
    }
}
// ========== Configuration Factory ==========
export function createSessionConfig(environment) {
    var _a;
    const env = environment || ((_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'development';
    switch (env) {
        case 'test':
            return SessionConfig.getTestConfig();
        case 'production':
            return SessionConfig.getProductionConfig();
        case 'development':
        default:
            return SessionConfig.getDevelopmentConfig();
    }
}
// ========== Configuration Utilities ==========
export function validateRedisConnection(config) {
    return new Promise((resolve) => {
        const Redis = require('redis');
        const client = Redis.createClient({
            url: config.url,
            socket: {
                host: config.host,
                port: config.port,
                connectTimeout: 5000,
            },
            password: config.password,
            database: config.db,
        });
        client.on('error', () => {
            resolve(false);
        });
        client.connect()
            .then(() => {
            client.ping()
                .then(() => {
                client.quit();
                resolve(true);
            })
                .catch(() => {
                client.quit();
                resolve(false);
            });
        })
            .catch(() => {
            resolve(false);
        });
    });
}
export function getRedisConnectionString(config) {
    if (config.url) {
        return config.url;
    }
    const auth = config.password ? `:${config.password}@` : '';
    const host = config.host || 'localhost';
    const port = config.port || 6379;
    const db = config.db || 0;
    return `redis://${auth}${host}:${port}/${db}`;
}
// ========== Environment Variables Documentation ==========
export const ENVIRONMENT_VARIABLES = {
    // Redis Configuration
    REDIS_URL: 'Complete Redis connection URL (overrides individual settings)',
    REDIS_HOST: 'Redis server hostname (default: localhost)',
    REDIS_PORT: 'Redis server port (default: 6379)',
    REDIS_PASSWORD: 'Redis server password (optional)',
    REDIS_SESSION_DB: 'Redis database number for sessions (default: 0)',
    REDIS_MAX_RETRIES: 'Maximum retry attempts (default: 3)',
    REDIS_RETRY_DELAY: 'Retry delay in milliseconds (default: 100)',
    REDIS_LAZY_CONNECT: 'Enable lazy connection (default: false)',
    // Session Configuration
    SESSION_DEFAULT_TTL: 'Default session TTL in seconds (default: 3600)',
    SESSION_CHECKPOINT_INTERVAL: 'Events between auto-checkpoints (default: 10)',
    SESSION_MAX_EVENTS: 'Maximum events per session (default: 1000)',
    SESSION_GRACE_TTL: 'Grace period before cleanup in seconds (default: 300)',
    SESSION_ENABLE_FAILURE_SNAPSHOTS: 'Enable failure snapshots (default: false)',
    SESSION_GLOBAL_CHANNEL: 'Global pub/sub channel (default: global:sessions)',
    SESSION_CHANNEL_PREFIX: 'Session channel prefix (default: session:)',
};
//# sourceMappingURL=SessionConfig.js.map