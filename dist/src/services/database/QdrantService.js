import { QdrantClient } from '@qdrant/js-client-rest';
export class QdrantService {
    qdrantClient;
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
            this.qdrantClient = new QdrantClient({
                url: this.config.url,
                apiKey: this.config.apiKey,
            });
            // Test Qdrant connection
            await this.qdrantClient.getCollections();
            this.initialized = true;
            console.log('✅ Qdrant connection established');
        }
        catch (error) {
            console.error('❌ Qdrant initialization failed:', error);
            throw error;
        }
    }
    async close() {
        // Qdrant client doesn't have a close method, but we can mark as not initialized
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    getClient() {
        if (!this.initialized) {
            throw new Error('Qdrant not initialized');
        }
        return this.qdrantClient;
    }
    async setupCollections() {
        if (!this.initialized) {
            throw new Error('Qdrant not initialized');
        }
        try {
            // Create collections if they don't exist
            const collections = await this.qdrantClient.getCollections();
            const existingCollections = collections.collections.map(c => c.name);
            if (!existingCollections.includes('code_embeddings')) {
                await this.qdrantClient.createCollection('code_embeddings', {
                    vectors: {
                        size: 1536, // OpenAI Ada-002 dimensions
                        distance: 'Cosine',
                    },
                });
            }
            // Create documentation_embeddings collection
            if (!existingCollections.includes('documentation_embeddings')) {
                try {
                    await this.qdrantClient.createCollection('documentation_embeddings', {
                        vectors: {
                            size: 1536,
                            distance: 'Cosine',
                        },
                    });
                }
                catch (error) {
                    if (error.status === 409 || error.message?.includes('already exists')) {
                        console.log('📊 documentation_embeddings collection already exists, skipping creation');
                    }
                    else {
                        throw error;
                    }
                }
            }
            // Create integration_test collection
            if (!existingCollections.includes('integration_test')) {
                try {
                    await this.qdrantClient.createCollection('integration_test', {
                        vectors: {
                            size: 1536,
                            distance: 'Cosine',
                        },
                    });
                }
                catch (error) {
                    if (error.status === 409 || error.message?.includes('already exists')) {
                        console.log('📊 integration_test collection already exists, skipping creation');
                    }
                    else {
                        throw error;
                    }
                }
            }
            console.log('✅ Qdrant collections setup complete');
        }
        catch (error) {
            console.error('❌ Qdrant setup failed:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Check if Qdrant is accessible by attempting to get collection info
            await this.qdrantClient.getCollections();
            return true;
        }
        catch (error) {
            console.error('Qdrant health check failed:', error);
            return false;
        }
    }
}
//# sourceMappingURL=QdrantService.js.map