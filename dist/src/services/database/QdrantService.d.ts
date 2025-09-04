import { QdrantClient } from '@qdrant/js-client-rest';
import { IQdrantService } from './interfaces';
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
}
//# sourceMappingURL=QdrantService.d.ts.map