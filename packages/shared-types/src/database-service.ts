import type { QdrantClient } from '@qdrant/js-client-rest';
import { GraphQueryResult, FalkorDBQueryResult } from './database-types.js';

export interface IDatabaseService {
  // Core graph database methods
  graphQuery(
    query: string,
    params?: Record<string, unknown>
  ): Promise<GraphQueryResult>;
  graphCommand(
    command: string,
    ...args: unknown[]
  ): Promise<GraphQueryResult>;
  getGraphService(): unknown; // Graph driver instance

  // Core relational database methods
  postgresQuery(query: string, params?: unknown[]): Promise<unknown>;

  // Vector database methods
  getQdrantClient(): QdrantClient;

  // Service status
  isInitialized(): boolean;

  // Deprecated: Legacy FalkorDB compatibility methods
  /** @deprecated Use graphQuery() instead */
  falkordbQuery(
    query: string,
    params?: Record<string, unknown>
  ): Promise<FalkorDBQueryResult>;
  /** @deprecated Use graphCommand() instead */
  falkordbCommand(
    command: string,
    ...args: unknown[]
  ): Promise<FalkorDBQueryResult>;
  /** @deprecated Use getGraphService() instead */
  getFalkorDBService(): unknown;
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
