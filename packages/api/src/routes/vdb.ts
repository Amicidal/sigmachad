/**
 * Vector Database Operations Routes
 * Handles semantic search and vector similarity operations
 */

import { FastifyInstance } from 'fastify';
import type { VectorSearchRequest, VectorSearchResult } from '@memento/shared-types/core-types';
import { EmbeddingService as CoreEmbeddingService } from '@memento/core/utils/embedding';

export async function registerVDBRoutes(
  app: FastifyInstance,
  kgService: any,
  _dbService: any
): Promise<void> {
  // POST /api/vdb/vdb-search - Perform semantic search
  app.post(
    '/vdb-search',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            entityTypes: { type: 'array', items: { type: 'string' } },
            similarity: { type: 'number', minimum: 0, maximum: 1 },
            limit: { type: 'number', default: 10 },
            includeMetadata: { type: 'boolean', default: true },
            filters: {
              type: 'object',
              properties: {
                language: { type: 'string' },
                lastModified: {
                  type: 'object',
                  properties: {
                    since: { type: 'string', format: 'date-time' },
                    until: { type: 'string', format: 'date-time' },
                  },
                },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['query'],
        },
      },
    },
    async (request, reply) => {
      try {
        const params: VectorSearchRequest = request.body as VectorSearchRequest;
        const startTime = Date.now();

        // Perform semantic search via knowledge graph service (new API)
        const searchResults = await kgService.searchEntities({
          query: params.query,
          entityTypes: params.entityTypes as any,
          limit: params.limit || 10,
          searchType: 'semantic',
          filters: params.filters,
        });

        // Best-effort index size from embedding stats
        let indexSize = 0;
        try {
          const stats = await kgService.getStats();
          indexSize = stats?.embeddings?.indexed ?? 0;
        } catch (_) {
          indexSize = 0;
        }

        const results: VectorSearchResult = {
          results: searchResults.map((result: any) => ({
            entity: result.entity,
            similarity: result.score,
            context: result.context || '',
            highlights: result.highlights || [],
          })),
          metadata: {
            totalResults: searchResults.length,
            searchTime: Date.now() - startTime,
            indexSize,
          },
        };

        reply.send({
          success: true,
          data: results,
        });
      } catch (error) {
        console.error('Vector search error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'VECTOR_SEARCH_FAILED',
            message: 'Failed to perform semantic search',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // POST /api/vdb/embed - Generate embeddings for text
  app.post(
    '/embed',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            texts: {
              type: 'array',
              items: { type: 'string' },
            },
            model: { type: 'string', default: 'text-embedding-ada-002' },
            metadata: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          required: ['texts'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { texts, model, metadata } = request.body as {
          texts: string[];
          model?: string;
          metadata?: any[];
        };

        // Generate embeddings using core embedding utility (new API)
        const embeddingService = new CoreEmbeddingService({ model });
        const embeddings = await Promise.all(
          texts.map(async (text, index) => ({
            text,
            embedding: (await embeddingService.generateEmbedding(text)).embedding,
            model: model || 'text-embedding-3-small',
            metadata: metadata?.[index] || {},
          }))
        );

        reply.send({
          success: true,
          data: {
            embeddings,
            model: model || 'text-embedding-3-small',
            totalTokens: 0,
          },
        });
      } catch (error) {
        console.error('Embedding generation error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'EMBEDDING_FAILED',
            message: 'Failed to generate embeddings',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // POST /api/vdb/index - Index entities with embeddings
  app.post(
    '/index',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            entities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  type: { type: 'string' },
                  metadata: { type: 'object' },
                },
                required: ['id', 'content', 'type'],
              },
            },
            generateEmbeddings: { type: 'boolean', default: true },
          },
          required: ['entities'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entities, generateEmbeddings } = request.body as {
          entities: any[];
          generateEmbeddings?: boolean;
        };

        const startTime = Date.now();
        let indexedCount = 0;
        let failedCount = 0;

        for (const entity of entities) {
          try {
            // Create or update entity; embeddings generated unless skipped
            await kgService.createOrUpdateEntity(entity, {
              skipEmbedding: generateEmbeddings === false,
            });
            indexedCount++;
          } catch (entityError) {
            console.error(`Failed to index entity ${entity.id}:`, entityError);
            failedCount++;
          }
        }

        const result = {
          indexed: indexedCount,
          failed: failedCount,
          indexTime: Date.now() - startTime,
        };

        reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error('Indexing error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'INDEXING_FAILED',
            message: 'Failed to index entities',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // DELETE /api/vdb/entities/{entityId} - Remove entity from vector index
  app.delete(
    '/entities/:entityId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
          },
          required: ['entityId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };

        // Remove embedding vector for the entity (new API)
        await kgService.deleteEmbedding(entityId);

        reply.send({
          success: true,
          data: { removed: entityId },
        });
      } catch (error) {
        console.error('Entity removal error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'REMOVAL_FAILED',
            message: 'Failed to remove entity from index',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // GET /api/vdb/stats - Get vector database statistics
  app.get('/stats', async (request, reply) => {
    try {
      const overall = await kgService.getStats();
      const searchStats = await kgService.getSearchStats();

      // Metrics semantics:
      // - totalVectors/indexSize: count of entities with embeddings indexed
      // - totalEntities: total graph entities
      // - searchStats.totalSearches: number of searches since service start
      // - searchStats.averageResponseTime: rolling mean latency (ms) over recent queries
      const stats = {
        totalVectors: overall?.embeddings?.indexed ?? 0,
        totalEntities: overall?.entities?.total ?? 0,
        indexSize: overall?.embeddings?.indexed ?? 0,
        lastUpdated: new Date().toISOString(),
        searchStats,
      };

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Stats retrieval error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to retrieve vector database statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // POST /api/vdb/similarity - Find similar entities
  app.post(
    '/similarity',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
            limit: { type: 'number', default: 10 },
            threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
          },
          required: ['entityId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId, limit, threshold } = request.body as {
          entityId: string;
          limit?: number;
          threshold?: number;
        };

        const similarEntities = await kgService.findSimilar(entityId, {
          limit: limit || 10,
          minScore: threshold || 0.7,
        });

        const similar = {
          entityId,
          similarEntities: similarEntities.map((result: any) => ({
            entity: result.entity,
            similarity: result.score,
            relationship: (result as any).relationship,
          })),
          threshold: threshold || 0.7,
        };

        reply.send({
          success: true,
          data: similar,
        });
      } catch (error) {
        console.error('Similarity search error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'SIMILARITY_FAILED',
            message: 'Failed to find similar entities',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // POST /api/vdb/bulk-search - Perform bulk semantic searches
  app.post(
    '/bulk-search',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            queries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  query: { type: 'string' },
                  entityTypes: { type: 'array', items: { type: 'string' } },
                  limit: { type: 'number', default: 5 },
                },
                required: ['id', 'query'],
              },
            },
          },
          required: ['queries'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { queries } = request.body as {
          queries: Array<{
            id: string;
            query: string;
            entityTypes?: string[];
            limit?: number;
          }>;
        };

        const results = await Promise.all(
          queries.map(async (queryObj) => {
            try {
              const searchResults = await kgService.searchEntities({
                query: queryObj.query,
                entityTypes: queryObj.entityTypes as any,
                searchType: 'semantic',
                limit: queryObj.limit || 5,
              });

              return {
                id: queryObj.id,
                success: true,
                results: searchResults,
              };
            } catch (error) {
              return {
                id: queryObj.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );

        reply.send({
          success: true,
          data: { results },
        });
      } catch (error) {
        console.error('Bulk search error:', error);
        reply.status(500).send({
          success: false,
          error: {
            code: 'BULK_SEARCH_FAILED',
            message: 'Failed to perform bulk semantic search',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );
}
