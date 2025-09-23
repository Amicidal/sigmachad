/**
 * Embedding Service for Memento
 * Handles text embedding generation using OpenAI and provides batch processing
 */

import OpenAI from 'openai';
import { Entity } from '../types/entities.js';

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

export class EmbeddingService {
  private config: Required<EmbeddingConfig>;
  private cache: Map<string, EmbeddingResult> = new Map();
  private rateLimitDelay = 100; // ms between requests
  private openai: OpenAI | null = null;

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'text-embedding-3-small',
      dimensions: config.dimensions || 1536,
      batchSize: config.batchSize || 100,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    // Initialize OpenAI client if API key is available
    if (this.config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openaiApiKey,
      });
    }
  }

  /**
   * Generate embedding for a single text input
   */
  async generateEmbedding(content: string, entityId?: string): Promise<EmbeddingResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(content);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached, entityId };
    }

    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (!this.config.openaiApiKey) {
      // Fallback to mock embeddings for development
      return this.generateMockEmbedding(content, entityId);
    }

    try {
      const result = await this.generateOpenAIEmbedding(content, entityId);
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Fallback to mock embedding on failure
      return this.generateMockEmbedding(content, entityId);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateEmbeddingsBatch(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    // Process in batches to respect rate limits
    for (let i = 0; i < inputs.length; i += this.config.batchSize) {
      const batch = inputs.slice(i, i + this.config.batchSize);
      const batchResults = await this.processBatch(batch);

      results.push(...batchResults.results);
      totalTokens += batchResults.totalTokens;
      totalCost += batchResults.totalCost;

      // Rate limiting delay between batches
      if (i + this.config.batchSize < inputs.length) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      totalTokens,
      totalCost,
      processingTime,
    };
  }

  /**
   * Process a single batch of inputs
   */
  private async processBatch(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<{ results: EmbeddingResult[]; totalTokens: number; totalCost: number }> {
    const results: EmbeddingResult[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    // Filter out cached results
    const uncachedInputs = inputs.filter(input => {
      const cacheKey = this.getCacheKey(input.content);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        results.push({ ...cached, entityId: input.entityId });
        return false;
      }
      return true;
    });

    if (uncachedInputs.length === 0) {
      return { results, totalTokens, totalCost };
    }

    // Generate new embeddings
    const newResults = await this.generateBatchOpenAIEmbeddings(uncachedInputs);
    results.push(...newResults.results);
    totalTokens += newResults.totalTokens;
    totalCost += newResults.totalCost;

    // Cache new results
    newResults.results.forEach(result => {
      this.cache.set(this.getCacheKey(result.content), result);
    });

    return { results, totalTokens, totalCost };
  }

  /**
   * Generate embeddings using OpenAI API
   */
  private async generateOpenAIEmbedding(
    content: string,
    entityId?: string
  ): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide OPENAI_API_KEY.');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: content,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      const usage = response.usage;

      return {
        embedding,
        content,
        entityId,
        model: this.config.model,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          total_tokens: usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate batch embeddings using OpenAI API
   */
  private async generateBatchOpenAIEmbeddings(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<{ results: EmbeddingResult[]; totalTokens: number; totalCost: number }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide OPENAI_API_KEY.');
    }

    try {
      const contents = inputs.map(input => input.content);

      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: contents,
        encoding_format: 'float',
      });

      const results: EmbeddingResult[] = [];
      let totalTokens = 0;

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const embedding = response.data[i].embedding;

        results.push({
          embedding,
          content: input.content,
          entityId: input.entityId,
          model: this.config.model,
          usage: {
            prompt_tokens: Math.ceil(input.content.length / 4), // Rough estimate
            total_tokens: Math.ceil(input.content.length / 4),
          },
        });
      }

      // Use actual usage from response if available
      if (response.usage) {
        totalTokens = response.usage.total_tokens;
      } else {
        totalTokens = results.reduce((sum, result) => sum + (result.usage?.total_tokens || 0), 0);
      }

      // Calculate cost based on model (text-embedding-3-small pricing)
      const costPerToken = this.getCostPerToken(this.config.model);
      const totalCost = (totalTokens / 1000) * costPerToken;

      return { results, totalTokens, totalCost };
    } catch (error) {
      console.error('OpenAI batch API error:', error);
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cost per token for different models
   */
  private getCostPerToken(model: string): number {
    const pricing: Record<string, number> = {
      'text-embedding-3-small': 0.00002, // $0.02 per 1K tokens
      'text-embedding-3-large': 0.00013, // $0.13 per 1K tokens
      'text-embedding-ada-002': 0.0001,   // $0.10 per 1K tokens
    };

    return pricing[model] || 0.00002; // Default to smallest model pricing
  }

  /**
   * Generate mock embedding for development/testing
   */
  private generateMockEmbedding(content: string, entityId?: string): EmbeddingResult {
    // Create deterministic mock embedding based on content hash
    const hash = this.simpleHash(content);
    const embedding = Array.from({ length: this.config.dimensions }, (_, i) => {
      // Use hash to create pseudo-random but deterministic values
      const value = Math.sin(hash + i * 0.1) * 0.5;
      return Math.max(-1, Math.min(1, value)); // Clamp to [-1, 1]
    });

    return {
      embedding,
      content,
      entityId,
      model: this.config.model,
      usage: {
        prompt_tokens: Math.ceil(content.length / 4), // Rough token estimate
        total_tokens: Math.ceil(content.length / 4),
      },
    };
  }

  /**
   * Generate content for embedding from entity
   */
  generateEntityContent(entity: Entity): string {
    switch (entity.type) {
      case 'symbol':
        const symbolEntity = entity as any;
        if (symbolEntity.kind === 'function') {
          return `${symbolEntity.path || ''} ${symbolEntity.signature || ''} ${symbolEntity.documentation || ''}`.trim();
        } else if (symbolEntity.kind === 'class') {
          return `${symbolEntity.path || ''} ${symbolEntity.name || ''} ${symbolEntity.documentation || ''}`.trim();
        }
        return `${symbolEntity.path || ''} ${symbolEntity.signature || ''}`.trim();

      case 'file':
        const fileEntity = entity as any;
        return `${fileEntity.path || ''} ${fileEntity.extension || ''} ${fileEntity.language || ''}`.trim();

      case 'documentation':
        return `${(entity as any).title || ''} ${(entity as any).content || ''}`.trim();

      default:
        return `${(entity as any).path || entity.id} ${entity.type}`.trim();
    }
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; totalRequests: number } {
    // This would track actual usage in a production implementation
    return {
      size: this.cache.size,
      hitRate: 0,
      totalRequests: 0,
    };
  }

  /**
   * Generate cache key for content
   */
  private getCacheKey(content: string): string {
    if (!content) {
      throw new Error('Content cannot be empty');
    }
    return `${this.config.model}_${this.simpleHash(content)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Utility delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (i < retries) {
          const delay = this.config.retryDelay * Math.pow(2, i);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Check if real embeddings are available (OpenAI API key is configured)
   */
  hasRealEmbeddings(): boolean {
    return this.openai !== null && !!this.config.openaiApiKey;
  }

  /**
   * Validate embedding configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.openaiApiKey) {
      errors.push('OpenAI API key is required for production embeddings (currently using mock embeddings)');
    }

    if (!['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'].includes(this.config.model)) {
      errors.push('Invalid embedding model specified');
    }

    if (this.config.dimensions < 1) {
      errors.push('Dimensions must be positive');
    }

    if (this.config.batchSize < 1 || this.config.batchSize > 2048) {
      errors.push('Batch size must be between 1 and 2048');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get embedding statistics
   */
  getStats(): {
    hasRealEmbeddings: boolean;
    model: string;
    cacheSize: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    return {
      hasRealEmbeddings: this.hasRealEmbeddings(),
      model: this.config.model,
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to be tracked in production
      totalRequests: 0, // Would need to be tracked in production
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
