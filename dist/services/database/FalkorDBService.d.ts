import { RedisClientType } from "redis";
import { IFalkorDBService } from "./interfaces.js";
export declare class FalkorDBService implements IFalkorDBService {
    private falkordbClient;
    private initialized;
    private config;
    constructor(config: {
        url: string;
        database?: number;
        graphKey?: string;
    });
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getClient(): RedisClientType;
    query(query: string, params?: Record<string, any>): Promise<any>;
    command(...args: any[]): Promise<any>;
    setupGraph(): Promise<void>;
    healthCheck(): Promise<boolean>;
    private sanitizeParameterValue;
    private parameterToCypherString;
    private objectToCypherProperties;
    private buildProcessedQuery;
    private decodeGraphValue;
}
//# sourceMappingURL=FalkorDBService.d.ts.map