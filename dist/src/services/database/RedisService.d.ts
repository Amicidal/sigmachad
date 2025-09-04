import { IRedisService } from './interfaces';
export declare class RedisService implements IRedisService {
    private redisClient;
    private initialized;
    private config;
    constructor(config: {
        url: string;
    });
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<number>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=RedisService.d.ts.map