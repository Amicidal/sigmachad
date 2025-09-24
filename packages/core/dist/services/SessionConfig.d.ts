/**
 * Session Configuration
 *
 * Configuration management for Redis session coordination
 * Provides environment-based configuration with sensible defaults
 */
import { RedisConfig, SessionManagerConfig } from './SessionTypes.js';
export declare class SessionConfig {
    private static instance;
    private config;
    private constructor();
    static getInstance(): SessionConfig;
    getConfig(): Required<SessionManagerConfig>;
    getRedisConfig(): RedisConfig;
    private loadConfiguration;
    validateConfiguration(): {
        valid: boolean;
        errors: string[];
    };
    getEnvironment(): 'development' | 'test' | 'production';
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
    updateConfig(updates: Partial<SessionManagerConfig>): void;
    static getDevelopmentConfig(): SessionManagerConfig;
    static getTestConfig(): SessionManagerConfig;
    static getProductionConfig(): SessionManagerConfig;
}
export declare function createSessionConfig(environment?: string): SessionManagerConfig;
export declare function validateRedisConnection(config: RedisConfig): Promise<boolean>;
export declare function getRedisConnectionString(config: RedisConfig): string;
export declare const ENVIRONMENT_VARIABLES: {
    readonly REDIS_URL: "Complete Redis connection URL (overrides individual settings)";
    readonly REDIS_HOST: "Redis server hostname (default: localhost)";
    readonly REDIS_PORT: "Redis server port (default: 6379)";
    readonly REDIS_PASSWORD: "Redis server password (optional)";
    readonly REDIS_SESSION_DB: "Redis database number for sessions (default: 0)";
    readonly REDIS_MAX_RETRIES: "Maximum retry attempts (default: 3)";
    readonly REDIS_RETRY_DELAY: "Retry delay in milliseconds (default: 100)";
    readonly REDIS_LAZY_CONNECT: "Enable lazy connection (default: false)";
    readonly SESSION_DEFAULT_TTL: "Default session TTL in seconds (default: 3600)";
    readonly SESSION_CHECKPOINT_INTERVAL: "Events between auto-checkpoints (default: 10)";
    readonly SESSION_MAX_EVENTS: "Maximum events per session (default: 1000)";
    readonly SESSION_GRACE_TTL: "Grace period before cleanup in seconds (default: 300)";
    readonly SESSION_ENABLE_FAILURE_SNAPSHOTS: "Enable failure snapshots (default: false)";
    readonly SESSION_GLOBAL_CHANNEL: "Global pub/sub channel (default: global:sessions)";
    readonly SESSION_CHANNEL_PREFIX: "Session channel prefix (default: session:)";
};
//# sourceMappingURL=SessionConfig.d.ts.map