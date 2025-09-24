import { QdrantClient } from "@qdrant/js-client-rest";
import { IQdrantService } from "./interfaces.js";
export declare class QdrantService implements IQdrantService {
    private qdrantClient;
    private initialized;
    private config;
    constructor(config: {
        url: string;
        apiKey?: string;
    });
    initialize(): Promise<void>;
    close(): Promise<void>;
    isInitialized(): boolean;
    getClient(): QdrantClient;
    setupCollections(): Promise<void>;
    healthCheck(): Promise<boolean>;
    /**
     * Upsert points to a collection
     */
    upsert(collectionName: string, points: any): Promise<any>;
    /**
     * Scroll through points in a collection
     */
    scroll(collectionName: string, options: any): Promise<any>;
    /**
     * Create a collection
     */
    createCollection(collectionName: string, options: any): Promise<any>;
    /**
     * Delete a collection
     */
    deleteCollection(collectionName: string): Promise<any>;
    /**
     * Search for similar vectors
     */
    search(collectionName: string, options: any): Promise<any>;
}
//# sourceMappingURL=QdrantService.d.ts.map