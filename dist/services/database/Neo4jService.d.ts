import { Driver, Result } from "neo4j-driver";
import { INeo4jService } from "./interfaces.js";
export declare class Neo4jService implements INeo4jService {
    private driver;
    private initialized;
    private config;
    constructor(config: {
        uri: string;
        username: string;
        password: string;
        database?: string;
    });
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getDriver(): Driver;
    query(cypher: string, params?: Record<string, any>, options?: {
        database?: string;
    }): Promise<Result>;
    transaction<T>(callback: (tx: any) => Promise<T>, options?: {
        database?: string;
    }): Promise<T>;
    setupGraph(): Promise<void>;
    setupVectorIndexes(): Promise<void>;
    upsertVector(collection: string, id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    searchVector(collection: string, vector: number[], limit?: number, filter?: Record<string, any>): Promise<Array<{
        id: string;
        score: number;
        metadata?: any;
    }>>;
    deleteVector(collection: string, id: string): Promise<void>;
    scrollVectors(collection: string, limit?: number, offset?: number): Promise<{
        points: Array<{
            id: string;
            vector: number[];
            metadata?: any;
        }>;
        total: number;
    }>;
    healthCheck(): Promise<boolean>;
    command(...args: any[]): Promise<any>;
}
//# sourceMappingURL=Neo4jService.d.ts.map