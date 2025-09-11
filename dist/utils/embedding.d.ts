/**
 * Embedding Service for Memento
 * Handles text embedding generation using OpenAI and provides batch processing
 */
import { Entity } from '../models/entities.js';
export interface EmbeddingConfig {
    openaiApiKey?: string;
    model?: string;
    dimensions?: number;
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export interface EmbeddingResult {
    embedding: number[];
    content: string;
    entityId?: string;
    model: string;
    usage?: {
        prompt_tokens: number;
        total_tokens: number;
    };
}
export interface BatchEmbeddingResult {
    results: EmbeddingResult[];
    totalTokens: number;
    totalCost: number;
    processingTime: number;
}
export declare class EmbeddingService {
    private config;
    private cache;
    private rateLimitDelay;
    private openai;
    constructor(config?: EmbeddingConfig);
    /**
     * Generate embedding for a single text input
     */
    generateEmbedding(content: string, entityId?: string): Promise<EmbeddingResult>;
    /**
     * Generate embeddings for multiple texts in batches
     */
    generateEmbeddingsBatch(inputs: Array<{
        content: string;
        entityId?: string;
    }>): Promise<BatchEmbeddingResult>;
    /**
     * Process a single batch of inputs
     */
    private processBatch;
    /**
     * Generate embeddings using OpenAI API
     */
    private generateOpenAIEmbedding;
    /**
     * Generate batch embeddings using OpenAI API
     */
    private generateBatchOpenAIEmbeddings;
    /**
     * Get cost per token for different models
     */
    private getCostPerToken;
    /**
     * Generate mock embedding for development/testing
     */
    private generateMockEmbedding;
    /**
     * Generate content for embedding from entity
     */
    generateEntityContent(entity: Entity): string;
    /**
     * Clear embedding cache
     */
    clearCache(): void;
    /**
     * Get cache size
     */
    getCacheSize(): number;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
        totalRequests: number;
    };
    /**
     * Generate cache key for content
     */
    private getCacheKey;
    /**
     * Simple hash function for cache keys
     */
    private simpleHash;
    /**
     * Utility delay function for rate limiting
     */
    private delay;
    /**
     * Retry wrapper with exponential backoff
     */
    private withRetry;
    /**
     * Check if real embeddings are available (OpenAI API key is configured)
     */
    hasRealEmbeddings(): boolean;
    /**
     * Validate embedding configuration
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get embedding statistics
     */
    getStats(): {
        hasRealEmbeddings: boolean;
        model: string;
        cacheSize: number;
        cacheHitRate: number;
        totalRequests: number;
    };
}
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=embedding.d.ts.map