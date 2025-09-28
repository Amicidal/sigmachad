import type { QdrantClient } from '@qdrant/js-client-rest';
import { FalkorDBQueryResult } from './database-types.js';

export interface IDatabaseService {
  // Core methods used in configuration and maintenance
  falkordbQuery(
    query: string,
    params?: Record<string, unknown>
  ): Promise<FalkorDBQueryResult>;
  postgresQuery(query: string, params?: unknown[]): Promise<unknown>;
  getQdrantClient(): QdrantClient;
  isInitialized(): boolean;

  // Health and status methods
  falkordbCommand(
    command: string,
    ...args: unknown[]
  ): Promise<FalkorDBQueryResult>;

  // For optimization and cleanup
  getFalkorDBService(): unknown; // FalkorDB driver instance
}

// Database service interfaces are already defined in database-types.ts
// Re-export them for convenience
export type {
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  INeo4jService,
  IRedisService,
} from './database-types.js';
