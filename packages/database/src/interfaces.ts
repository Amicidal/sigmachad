import { QdrantClient } from '@qdrant/js-client-rest';
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
} from '@memento/shared-types';
import type { PerformanceRelationship } from '@memento/shared-types';
import type {
  HealthStatus,
  HealthComponentStatus,
  BackupProviderDefinition,
  BackupRetentionPolicyConfig,
  BackupConfiguration,
  BulkQueryTelemetryEntry,
  BulkQueryMetricsSnapshot,
  BulkQueryMetrics,
  BulkQueryInstrumentationConfig,
  DatabaseConfig,
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  INeo4jService,
  IRedisService,
} from '@memento/shared-types';

// Re-export types for use by other modules
export type {
  HealthStatus,
  HealthComponentStatus,
  BackupProviderDefinition,
  BackupRetentionPolicyConfig,
  BackupConfiguration,
  BulkQueryTelemetryEntry,
  BulkQueryMetricsSnapshot,
  BulkQueryMetrics,
  BulkQueryInstrumentationConfig,
  DatabaseConfig,
  IFalkorDBService,
  IQdrantService,
  IPostgreSQLService,
  INeo4jService,
  IRedisService,
};

// Database service interfaces are now imported from shared-types
// Additional database-specific interfaces can be added here as needed
