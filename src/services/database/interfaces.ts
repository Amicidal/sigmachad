import { QdrantClient } from '@qdrant/js-client-rest';
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
} from '../../models/types.js';
import type { PerformanceRelationship } from '../../models/relationships.js';

export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface HealthComponentStatus {
  status: HealthStatus;
  details?: any;
}

export interface BackupProviderDefinition {
  type: "local" | "s3" | "gcs" | string;
  options?: Record<string, unknown>;
}

export interface BackupRetentionPolicyConfig {
  maxAgeDays?: number;
  maxEntries?: number;
  maxTotalSizeBytes?: number;
  deleteArtifacts?: boolean;
}

export interface BackupConfiguration {
  defaultProvider?: string;
  local?: {
    basePath?: string;
    allowCreate?: boolean;
  };
  providers?: Record<string, BackupProviderDefinition>;
  retention?: BackupRetentionPolicyConfig;
}

export interface DatabaseConfig {
  falkordb: {
    url: string;
    database?: number;
  };
  qdrant: {
    url: string;
    apiKey?: string;
  };
  postgresql: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  redis?: {
    url: string;
  };
  backups?: BackupConfiguration;
}

export interface IFalkorDBService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getClient(): any;
  query(
    query: string,
    params?: Record<string, any>,
    graphKey?: string
  ): Promise<any>;
  command(...args: any[]): Promise<any>;
  setupGraph(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IQdrantService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getClient(): QdrantClient;
  setupCollections(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IPostgreSQLService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getPool(): any;
  query(query: string, params?: any[], options?: { timeout?: number }): Promise<any>;
  transaction<T>(
    callback: (client: any) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T>;
  bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options?: { continueOnError?: boolean }
  ): Promise<any[]>;
  setupSchema(): Promise<void>;
  healthCheck(): Promise<boolean>;
  storeTestSuiteResult(suiteResult: any): Promise<void>;
  storeFlakyTestAnalyses(analyses: any[]): Promise<void>;
  getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
  getPerformanceMetricsHistory(
    entityId: string,
    options?: number | PerformanceHistoryOptions
  ): Promise<PerformanceHistoryRecord[]>;
  recordPerformanceMetricSnapshot(
    snapshot: PerformanceRelationship
  ): Promise<void>;
  getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
}

export interface IRedisService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  flushDb(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IDatabaseHealthCheck {
  falkordb: HealthComponentStatus;
  qdrant: HealthComponentStatus;
  postgresql: HealthComponentStatus;
  redis?: HealthComponentStatus;
}
