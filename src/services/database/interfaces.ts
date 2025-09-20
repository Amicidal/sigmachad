import { QdrantClient } from '@qdrant/js-client-rest';
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
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

export interface BulkQueryTelemetryEntry {
  batchSize: number;
  continueOnError: boolean;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  queueDepth: number;
  mode: 'transaction' | 'independent';
  success: boolean;
  error?: string;
}

export interface BulkQueryMetricsSnapshot {
  activeBatches: number;
  maxConcurrentBatches: number;
  totalBatches: number;
  totalQueries: number;
  totalDurationMs: number;
  maxBatchSize: number;
  maxQueueDepth: number;
  maxDurationMs: number;
  averageDurationMs: number;
  lastBatch: BulkQueryTelemetryEntry | null;
}

export interface BulkQueryMetrics extends BulkQueryMetricsSnapshot {
  history: BulkQueryTelemetryEntry[];
  slowBatches: BulkQueryTelemetryEntry[];
}

export interface BulkQueryInstrumentationConfig {
  warnOnLargeBatchSize: number;
  slowBatchThresholdMs: number;
  queueDepthWarningThreshold: number;
  historyLimit: number;
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
  recordSCMCommit(commit: SCMCommitRecord): Promise<void>;
  getSCMCommitByHash?(commitHash: string): Promise<SCMCommitRecord | null>;
  listSCMCommits?(limit?: number): Promise<SCMCommitRecord[]>;
  getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
  getBulkWriterMetrics(): BulkQueryMetrics;
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
