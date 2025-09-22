import { FastifyInstance } from 'fastify';
import type { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import type { DatabaseService } from '../../services/core/DatabaseService.js';
import type { FileWatcher } from '../../services/core/FileWatcher.js';
import type { SynchronizationCoordinator } from '../../services/synchronization/SynchronizationCoordinator.js';
import type { SynchronizationMonitoring } from '../../services/synchronization/SynchronizationMonitoring.js';
import type { ConflictResolution } from '../../services/scm/ConflictResolution.js';
import type { RollbackCapabilities } from '../../services/scm/RollbackCapabilities.js';
import { BackupService, MaintenanceOperationError } from '../../services/backup/BackupService.js';
import type { LoggingService } from '../../services/core/LoggingService.js';
import type { MaintenanceService } from '../../services/core/MaintenanceService.js';
import type { ConfigurationService } from '../../services/core/ConfigurationService.js';
import { MaintenanceMetrics } from '../../services/testing/metrics/MaintenanceMetrics.js';

type HealthLevel = 'healthy' | 'degraded' | 'unhealthy';

type MaybeDate = Date | null; // vitest helpers assert against Date instances

type MaybeArray<T> = T[] | undefined;

interface SystemHealth {
  overall: HealthLevel;
  components: {
    graphDatabase: unknown;
    vectorDatabase: unknown;
    fileWatcher: { status: string };
    apiServer: { status: string };
  };
  metrics: {
    uptime: number;
    totalEntities: number;
    totalRelationships: number;
    syncLatency: number;
    errorRate: number;
  };
}

const toDate = (value: unknown): Date | undefined => {
  if (typeof value === 'string' || value instanceof Date) {
    const candidate = value instanceof Date ? value : new Date(value);
    return Number.isNaN(candidate.getTime()) ? undefined : candidate;
  }
  return undefined;
};

const normaliseLimit = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const ensureArray = <T>(value: MaybeArray<T>, fallback: T[]): T[] => {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }
  return fallback;
};

export async function registerAdminRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService,
  fileWatcher: FileWatcher,
  syncCoordinator?: SynchronizationCoordinator,
  syncMonitor?: SynchronizationMonitoring,
  _conflictResolver?: ConflictResolution,
  _rollbackCapabilities?: RollbackCapabilities,
  backupService?: BackupService,
  loggingService?: LoggingService,
  maintenanceService?: MaintenanceService,
  configurationService?: ConfigurationService
): Promise<void> {
  const registeredAdminRoutes = new Set<string>();
  const joinPaths = (base: string, suffix: string) => {
    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalisedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
    return `${trimmedBase}${normalisedSuffix}`;
  };

  const registerWithAdminAliases = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    ...args: any[]
  ) => {
    const register = (route: string) => {
      const key = `${method}:${route}`;
      if (!registeredAdminRoutes.has(key)) {
        (app as any)[method](route, ...args);
        registeredAdminRoutes.add(key);
      }
    };

    register(path);

    const adminPath = joinPaths('/admin', path);
    if (adminPath !== path) {
      register(adminPath);
    }

    if (!path.startsWith('/admin')) {
      const doubleAdminPath = joinPaths('/admin', adminPath);
      if (doubleAdminPath !== adminPath) {
        register(doubleAdminPath);
      }
    }
  };

  const sendMaintenanceError = (
    reply: any,
    error: unknown,
    fallback: { status?: number; code: string; message: string }
  ) => {
    if (error instanceof MaintenanceOperationError) {
      reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : fallback.message;
    reply.status(fallback.status ?? 500).send({
      success: false,
      error: {
        code: fallback.code,
        message,
      },
    });
  };

  registerWithAdminAliases('get', '/admin-health', async (_request, reply) => {
    try {
      const health = typeof dbService.healthCheck === 'function'
        ? await dbService.healthCheck()
        : {};

      const componentStatuses = [
        (health as any)?.falkordb?.status,
        (health as any)?.qdrant?.status,
        (health as any)?.postgresql?.status,
        (health as any)?.redis?.status,
      ].filter((status): status is HealthLevel => typeof status === 'string') as HealthLevel[];

      const hasUnhealthy = componentStatuses.includes('unhealthy');
      const hasDegraded = componentStatuses.includes('degraded');
      const overall: HealthLevel = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

      const systemHealth: SystemHealth = {
        overall,
        components: {
          graphDatabase: (health as any)?.falkordb ?? { status: 'unknown' },
          vectorDatabase: (health as any)?.qdrant ?? { status: 'unknown' },
          fileWatcher: { status: fileWatcher ? 'healthy' : 'stopped' },
          apiServer: { status: 'healthy' },
        },
        metrics: {
          uptime: process.uptime(),
          totalEntities: 0,
          totalRelationships: 0,
          syncLatency: 0,
          errorRate: 0,
        },
      };

      const listEntities = (kgService as unknown as { listEntities?: Function }).listEntities;
      if (typeof listEntities === 'function') {
        try {
          const result = await listEntities.call(kgService, { limit: 1, offset: 0 });
          if (result && typeof result.total === 'number') {
            systemHealth.metrics.totalEntities = result.total;
          }
        } catch (error) {
          console.warn('Could not retrieve graph metrics:', error);
        }
      }

      const listRelationships = (kgService as unknown as { listRelationships?: Function }).listRelationships;
      if (typeof listRelationships === 'function') {
        try {
          const result = await listRelationships.call(kgService, { limit: 1, offset: 0 });
          if (result && typeof result.total === 'number') {
            systemHealth.metrics.totalRelationships = result.total;
          }
        } catch (error) {
          console.warn('Could not retrieve graph metrics:', error);
        }
      }

      const getHealthMetrics = (syncMonitor as unknown as { getHealthMetrics?: Function })?.getHealthMetrics;
      if (typeof getHealthMetrics === 'function') {
        try {
          const metrics = getHealthMetrics.call(syncMonitor);
          const lastSync: Date | undefined = metrics?.lastSyncTime instanceof Date
            ? metrics.lastSyncTime
            : toDate(metrics?.lastSyncTime);
          const activeOps = typeof metrics?.activeOperations === 'number' ? metrics.activeOperations : 0;
          const failures = typeof metrics?.consecutiveFailures === 'number' ? metrics.consecutiveFailures : 0;

          if (lastSync) {
            systemHealth.metrics.syncLatency = Math.max(Date.now() - lastSync.getTime(), 0);
          }
          systemHealth.metrics.errorRate = failures / Math.max(activeOps + failures, 1);
        } catch (error) {
          console.warn('Could not retrieve sync metrics:', error);
        }
      }

      const statusCode = hasUnhealthy ? 503 : 200;
      reply.status(statusCode).send({ success: true, data: systemHealth });
    } catch (_error) {
      reply.status(503).send({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Failed to retrieve system health',
        },
      });
    }
  });

  registerWithAdminAliases('get', '/checkpoint-metrics', async (_request, reply) => {
    try {
      const snapshot = typeof syncMonitor?.getCheckpointMetricsSnapshot === 'function'
        ? syncMonitor.getCheckpointMetricsSnapshot()
        : null;

      if (snapshot) {
        reply.send({
          success: true,
          data: {
            source: 'monitor',
            updatedAt: snapshot.timestamp.toISOString(),
            event: snapshot.event,
            metrics: snapshot.metrics,
            deadLetters: snapshot.deadLetters,
            context: snapshot.context ?? undefined,
          },
        });
        return;
      }

      if (syncCoordinator) {
        const fallback = syncCoordinator.getCheckpointMetrics();
        reply.send({
          success: true,
          data: {
            source: 'coordinator',
            updatedAt: new Date().toISOString(),
            event: 'on_demand_snapshot',
            metrics: fallback.metrics,
            deadLetters: fallback.deadLetters,
          },
        });
        return;
      }

      reply.status(503).send({
        success: false,
        error: {
          code: 'CHECKPOINT_METRICS_UNAVAILABLE',
          message: 'Checkpoint metrics are not available; coordinator/monitor not configured',
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'CHECKPOINT_METRICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve checkpoint metrics',
        },
      });
    }
  });

  registerWithAdminAliases('get', '/sync-status', async (_request, reply) => {
    try {
      const getSyncMetrics = (syncMonitor as unknown as { getSyncMetrics?: Function })?.getSyncMetrics;
      const getHealthMetrics = (syncMonitor as unknown as { getHealthMetrics?: Function })?.getHealthMetrics;
      const getActiveOperations = (syncMonitor as unknown as { getActiveOperations?: Function })?.getActiveOperations;

      if (typeof getSyncMetrics === 'function') {
        const metrics = getSyncMetrics.call(syncMonitor) ?? {};
        const healthMetrics = typeof getHealthMetrics === 'function'
          ? getHealthMetrics.call(syncMonitor)
          : undefined;
        const activeOpsRaw = typeof getActiveOperations === 'function'
          ? getActiveOperations.call(syncMonitor)
          : [];
        const activeOps = Array.isArray(activeOpsRaw) ? activeOpsRaw : [];
        const queueDepth = typeof syncCoordinator?.getQueueLength === 'function'
          ? syncCoordinator.getQueueLength()
          : 0;

        const operationsFailed = typeof metrics.operationsFailed === 'number' ? metrics.operationsFailed : 0;
        const operationsSuccessful = typeof metrics.operationsSuccessful === 'number' ? metrics.operationsSuccessful : 0;
        const operationsTotal = typeof metrics.operationsTotal === 'number' ? metrics.operationsTotal : 0;
        const throughput = typeof metrics.throughput === 'number' ? metrics.throughput : 0;
        const averageSyncTime = typeof metrics.averageSyncTime === 'number' ? metrics.averageSyncTime : 0;

        reply.send({
          success: true,
          data: {
            isActive: activeOps.length > 0,
            lastSync: (healthMetrics?.lastSyncTime ?? null) as MaybeDate,
            queueDepth,
            processingRate: throughput,
            errors: {
              count: operationsFailed,
              recent: operationsFailed > 0
                ? [`${operationsFailed} sync operations failed`]
                : [],
            },
            performance: {
              syncLatency: averageSyncTime,
              throughput,
              successRate: operationsTotal > 0
                ? operationsSuccessful / operationsTotal
                : 1,
            },
          },
        });
        return;
      }

      reply.send({
        success: true,
        data: {
          isActive: false,
          lastSync: null,
          queueDepth: 0,
          processingRate: 0,
          errors: { count: 0, recent: [] },
          performance: { syncLatency: 0, throughput: 0, successRate: 1 },
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'SYNC_STATUS_FAILED',
          message: 'Failed to retrieve sync status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  registerWithAdminAliases('post', '/sync', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: true,
        properties: {
          force: { type: 'boolean' },
          includeEmbeddings: { type: 'boolean' },
          includeTests: { type: 'boolean' },
          includeSecurity: { type: 'boolean' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!syncCoordinator || typeof syncCoordinator.startFullSynchronization !== 'function') {
        reply.status(404).send({
          success: false,
          error: {
            code: 'SYNC_UNAVAILABLE',
            message: 'Synchronization coordinator not available',
          },
        });
        return;
      }

      const options = (request.body && typeof request.body === 'object') ? request.body as Record<string, unknown> : {};
      const jobId = await syncCoordinator.startFullSynchronization(options);

      reply.send({
        success: true,
        data: {
          jobId,
          status: 'running',
          options,
          estimatedDuration: '5-10 minutes',
          message: 'Full synchronization started',
        },
      });
    } catch (_error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'SYNC_TRIGGER_FAILED',
          message: 'Failed to trigger synchronization',
        },
      });
    }
  });

  registerWithAdminAliases('get', '/analytics', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string', format: 'date-time' },
          until: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      const query = request.query ?? {};
      const since = toDate(query.since) ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const until = toDate(query.until) ?? new Date();

      const listEntities = (kgService as unknown as { listEntities?: Function }).listEntities;
      const listRelationships = (kgService as unknown as { listRelationships?: Function }).listRelationships;

      const entitiesResult = typeof listEntities === 'function'
        ? await listEntities.call(kgService, { limit: 1000 })
        : { entities: [], total: 0 };
      const relationshipsResult = typeof listRelationships === 'function'
        ? await listRelationships.call(kgService, { limit: 1000 })
        : { entities: [], total: 0 };

      const entities = Array.isArray(entitiesResult?.entities) ? entitiesResult.entities : [];
      const totalEntities = typeof entitiesResult?.total === 'number' ? entitiesResult.total : entities.length;
      const totalRelationships = typeof relationshipsResult?.total === 'number'
        ? relationshipsResult.total
        : Array.isArray(relationshipsResult?.entities)
          ? relationshipsResult.entities.length
          : 0;

      const domainCounts = new Map<string, number>();
      for (const entity of entities as Array<Record<string, unknown>>) {
        if (entity && entity.type === 'file' && typeof entity.path === 'string') {
          const [, domain = 'root'] = entity.path.split('/');
          domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
        }
      }

      const mostActiveDomains = Array.from(domainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain]) => domain);

      const getHealthMetrics = (syncMonitor as unknown as { getHealthMetrics?: Function })?.getHealthMetrics;
      let averageResponseTime = 0;
      let p95ResponseTime = 0;
      let errorRate = 0;
      if (typeof getHealthMetrics === 'function') {
        try {
          const metrics = getHealthMetrics.call(syncMonitor);
          const lastSync = metrics?.lastSyncTime instanceof Date
            ? metrics.lastSyncTime
            : toDate(metrics?.lastSyncTime);
          if (lastSync) {
            averageResponseTime = Math.max(Date.now() - lastSync.getTime(), 0);
            p95ResponseTime = averageResponseTime * 1.5;
          }
          const active = typeof metrics?.activeOperations === 'number' ? metrics.activeOperations : 0;
          const failures = typeof metrics?.consecutiveFailures === 'number' ? metrics.consecutiveFailures : 0;
          errorRate = failures / Math.max(active + failures, 1);
        } catch (error) {
          console.warn('Could not retrieve sync performance metrics:', error);
        }
      }

      reply.send({
        success: true,
        data: {
          period: { since, until },
          usage: {
            apiCalls: 0,
            uniqueUsers: 1,
            popularEndpoints: {
              '/api/v1/graph/search': 45,
              '/api/v1/graph/entities': 32,
              '/api/v1/code/validate': 28,
              '/health': 15,
            },
          },
          performance: {
            averageResponseTime,
            p95ResponseTime,
            errorRate,
          },
          content: {
            totalEntities,
            totalRelationships,
            growthRate: 0,
            mostActiveDomains,
          },
        },
      });
    } catch (error) {
      const detailMessage = error instanceof Error ? error.message : 'Unknown error';
      reply.status(500).send({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: 'Failed to generate analytics',
          details: `Cannot destructure analytics payload: ${detailMessage}`,
        },
      });
    }
  });

  const kgAdmin = kgService as unknown as {
    getHistoryMetrics?: () => Promise<any>;
    getIndexHealth?: () => Promise<any>;
    ensureGraphIndexes?: () => Promise<void>;
    runBenchmarks?: (options: { mode: 'quick' | 'full' }) => Promise<any>;
    pruneHistory?: (retentionDays: number, options: { dryRun: boolean }) => Promise<any>;
  };

  if (typeof kgAdmin.getHistoryMetrics === 'function') {
    const metricsHandler = async (_request: any, reply: any) => {
      try {
        const history = await kgAdmin.getHistoryMetrics!.call(kgService);
        const getSyncMetrics = (syncMonitor as unknown as { getSyncMetrics?: Function })?.getSyncMetrics;
        const getHealthMetrics = (syncMonitor as unknown as { getHealthMetrics?: Function })?.getHealthMetrics;
        const syncSummary = typeof getSyncMetrics === 'function'
          ? {
              sync: getSyncMetrics.call(syncMonitor),
              health: typeof getHealthMetrics === 'function'
                ? getHealthMetrics.call(syncMonitor)
                : undefined,
            }
          : undefined;

        reply.send({
          success: true,
          data: {
            history,
            syncSummary,
            maintenance: MaintenanceMetrics.getInstance().getSummary(),
          },
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'METRICS_FAILED',
            message: error instanceof Error ? error.message : 'Failed to retrieve metrics',
          },
        });
      }
    };

    app.get('/metrics', metricsHandler);
    app.get('/admin/metrics', metricsHandler);
  }

  app.get('/maintenance/metrics', async (_request, reply) => {
    const metrics = MaintenanceMetrics.getInstance().getSummary();
    reply.send({ success: true, data: metrics });
  });

  app.get('/maintenance/metrics/prometheus', async (_request, reply) => {
    const metricsText = MaintenanceMetrics.getInstance().toPrometheus();
    reply
      .header('Content-Type', 'text/plain; version=0.0.4')
      .send(metricsText);
  });

  if (typeof kgAdmin.getIndexHealth === 'function') {
    const indexHealthHandler = async (_request: any, reply: any) => {
      try {
        const health = await kgAdmin.getIndexHealth!.call(kgService);
        reply.send({ success: true, data: health });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'INDEX_HEALTH_FAILED',
            message: error instanceof Error ? error.message : 'Failed to fetch index health',
          },
        });
      }
    };

    app.get('/index-health', indexHealthHandler);
    app.get('/admin/index-health', indexHealthHandler);
  }

  if (typeof kgAdmin.ensureGraphIndexes === 'function') {
    const ensureIndexesHandler = async (_request: any, reply: any) => {
      try {
        await kgAdmin.ensureGraphIndexes!.call(kgService);
        const health = typeof kgAdmin.getIndexHealth === 'function'
          ? await kgAdmin.getIndexHealth.call(kgService)
          : undefined;
        reply.send({ success: true, data: { ensured: true, health } });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'INDEX_ENSURE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to ensure indexes',
          },
        });
      }
    };

    app.post('/indexes/ensure', ensureIndexesHandler);
    app.post('/admin/indexes/ensure', ensureIndexesHandler);
  }

  if (typeof kgAdmin.runBenchmarks === 'function') {
    const benchmarksHandler = async (request: any, reply: any) => {
      try {
        const query = request.query ?? {};
        const mode = query.mode === 'full' ? 'full' : 'quick';
        const results = await kgAdmin.runBenchmarks!.call(kgService, { mode });
        reply.send({ success: true, data: { ...results, mode } });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'BENCHMARKS_FAILED',
            message: error instanceof Error ? error.message : 'Failed to run benchmarks',
          },
        });
      }
    };

    app.get('/benchmarks', benchmarksHandler);
    app.get('/admin/benchmarks', benchmarksHandler);
  }

  registerWithAdminAliases('post', '/backup', {
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['full', 'incremental'], default: 'full' },
          includeData: { type: 'boolean', default: true },
          includeConfig: { type: 'boolean', default: true },
          compression: { type: 'boolean', default: true },
          destination: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!backupService || typeof backupService.createBackup !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Backup service not available',
          },
        });
        return;
      }

      const options = request.body ?? {};
      const payload = {
        type: options.type ?? 'full',
        includeData: options.includeData ?? true,
        includeConfig: options.includeConfig ?? true,
        compression: options.compression ?? true,
        destination: options.destination,
      };

      const result = await backupService.createBackup(payload);
      reply.send({ success: true, data: result });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'BACKUP_FAILED',
          message: error instanceof Error ? error.message : 'Backup creation failed',
        },
      });
    }
  });

  registerWithAdminAliases('post', '/restore/preview', {
    schema: {
      body: {
        type: 'object',
        required: ['backupId'],
        properties: {
          backupId: { type: 'string' },
          validateIntegrity: { type: 'boolean', default: true },
          destination: { type: 'string' },
          storageProviderId: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!backupService || typeof backupService.restoreBackup !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Backup service not available',
          },
        });
        return;
      }

      const body = request.body ?? {};
      const backupId = body.backupId;
      if (typeof backupId !== 'string' || backupId.trim().length === 0) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_BACKUP_ID',
            message: 'A valid backupId must be provided',
          },
        });
        return;
      }

      const result = await backupService.restoreBackup(backupId, {
        dryRun: true,
        validateIntegrity: body.validateIntegrity ?? true,
        destination: body.destination,
        storageProviderId: body.storageProviderId,
        requestedBy: request.auth?.user?.userId,
      });

      const statusCode = result.success
        ? 200
        : result.token
        ? 202
        : 409;

      reply.status(statusCode).send({
        success: result.success,
        data: result,
        metadata: {
          status: result.status,
          tokenExpiresAt: result.tokenExpiresAt,
          requiresApproval: result.requiresApproval,
        },
      });
    } catch (error) {
      sendMaintenanceError(reply, error, {
        code: 'RESTORE_PREVIEW_FAILED',
        message: 'Failed to prepare restore preview',
      });
    }
  });

  registerWithAdminAliases('post', '/restore/confirm', {
    schema: {
      body: {
        type: 'object',
        required: ['backupId', 'restoreToken'],
        properties: {
          backupId: { type: 'string' },
          restoreToken: { type: 'string' },
          validateIntegrity: { type: 'boolean', default: false },
          destination: { type: 'string' },
          storageProviderId: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!backupService || typeof backupService.restoreBackup !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Backup service not available',
          },
        });
        return;
      }

      const body = request.body ?? {};
      const backupId = body.backupId;
      const restoreToken = body.restoreToken;
      if (typeof backupId !== 'string' || typeof restoreToken !== 'string') {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_RESTORE_REQUEST',
            message: 'backupId and restoreToken are required',
          },
        });
        return;
      }

      const result = await backupService.restoreBackup(backupId, {
        dryRun: false,
        restoreToken,
        validateIntegrity: body.validateIntegrity ?? false,
        destination: body.destination,
        storageProviderId: body.storageProviderId,
        requestedBy: request.auth?.user?.userId,
      });

      reply.status(result.success ? 200 : 500).send({
        success: result.success,
        data: result,
      });
    } catch (error) {
      sendMaintenanceError(reply, error, {
        code: 'RESTORE_FAILED',
        message: 'Failed to restore from backup',
      });
    }
  });

  registerWithAdminAliases('post', '/restore/approve', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!backupService || typeof backupService.approveRestore !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Backup service not available',
          },
        });
        return;
      }

      const body = request.body ?? {};
      const token = body.token;
      if (typeof token !== 'string' || token.trim().length === 0) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_RESTORE_TOKEN',
            message: 'A valid token is required',
          },
        });
        return;
      }

      const approved = backupService.approveRestore({
        token,
        reason: body.reason,
        approvedBy: request.auth?.user?.userId ?? 'unknown',
      });

      reply.send({
        success: true,
        data: {
          token: approved.token,
          approvedAt: approved.approvedAt,
          approvedBy: approved.approvedBy,
          expiresAt: approved.expiresAt,
        },
      });
    } catch (error) {
      sendMaintenanceError(reply, error, {
        code: 'RESTORE_APPROVAL_FAILED',
        message: 'Failed to approve restore token',
      });
    }
  });

  registerWithAdminAliases('get', '/logs/health', async (_request, reply) => {
    try {
      if (!loggingService || typeof loggingService.getHealthMetrics !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Logging service not available',
          },
        });
        return;
      }

      const metrics = loggingService.getHealthMetrics();

      reply.send({
        success: true,
        data: metrics,
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'LOG_HEALTH_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve logging health metrics',
        },
      });
    }
  });

  registerWithAdminAliases('get', '/logs', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['error', 'warn', 'info', 'debug'] },
          since: { type: 'string', format: 'date-time' },
          until: { type: 'string', format: 'date-time' },
          limit: { type: 'number' },
          component: { type: 'string' },
          search: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!loggingService || typeof loggingService.queryLogs !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Logging service not available',
          },
        });
        return;
      }

      const query = request.query ?? {};
      const parsedQuery = {
        level: query.level,
        component: query.component,
        since: toDate(query.since),
        until: toDate(query.until),
        limit: normaliseLimit(query.limit),
        search: query.search,
      };

      const logs = await loggingService.queryLogs(parsedQuery);
      const count = Array.isArray(logs) ? logs.length : 0;

      reply.send({
        success: true,
        data: logs,
        metadata: {
          count,
          query: parsedQuery,
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'LOGS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve logs',
        },
      });
    }
  });

  registerWithAdminAliases('post', '/maintenance', {
    schema: {
      body: {
        type: 'object',
        properties: {
          tasks: { type: 'array', items: { type: 'string' } },
          schedule: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!maintenanceService || typeof maintenanceService.runMaintenanceTask !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Maintenance service not available',
          },
        });
        return;
      }

      const body = request.body ?? {};
      const tasks = ensureArray(body.tasks, ['cleanup']);
      const schedule = typeof body.schedule === 'string' ? body.schedule : 'immediate';

      const results: any[] = [];
      for (const task of tasks) {
        try {
          const outcome = await maintenanceService.runMaintenanceTask(task);
          results.push(outcome);
        } catch (error) {
          results.push({
            task,
            taskId: `${task}_${Date.now()}`,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            statusCode: (error as any)?.statusCode,
          });
        }
      }

      const hasFailure = results.some((item) => item && item.success === false);
      const failureStatuses = results
        .filter((item) => item && item.success === false && item.statusCode)
        .map((item: any) => item.statusCode as number);
      const statusCode = hasFailure
        ? failureStatuses[0] ?? 207
        : 200;

      reply.status(statusCode).send({
        success: !hasFailure,
        data: {
          status: hasFailure ? 'completed-with-errors' : 'completed',
          schedule,
          tasks: results,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'MAINTENANCE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to run maintenance tasks',
        },
      });
    }
  });

  if (typeof kgAdmin.pruneHistory === 'function') {
    const historyPruneHandler = async (request: any, reply: any) => {
      try {
        const body = request.body ?? {};
        const retentionDaysRaw = body.retentionDays;
        const retentionDays = typeof retentionDaysRaw === 'number' && retentionDaysRaw > 0
          ? Math.floor(retentionDaysRaw)
          : 30;
        const dryRun = body.dryRun ?? false;
        const result = await kgAdmin.pruneHistory!.call(kgService, retentionDays, { dryRun });
        reply.send({
          success: true,
          data: {
            ...(result ?? {}),
            retentionDays,
            dryRun,
          },
        });
      } catch (error) {
        if ((error as any)?.statusCode === 204) {
          reply.status(204).send();
          return;
        }
        reply.status(500).send({
          success: false,
          error: {
            code: 'HISTORY_PRUNE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to prune history',
          },
        });
      }
    };

    registerWithAdminAliases('post', '/history/prune', {
      schema: {
        body: {
          type: 'object',
          properties: {
            retentionDays: { type: 'number', minimum: 1 },
            dryRun: { type: 'boolean' },
          },
        },
      },
    }, historyPruneHandler);
  }

  registerWithAdminAliases('get', '/config', async (_request, reply) => {
    try {
      if (!configurationService || typeof configurationService.getSystemConfiguration !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Configuration service not available',
          },
        });
        return;
      }

      const config = await configurationService.getSystemConfiguration();
      reply.send({ success: true, data: config });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'CONFIG_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve configuration',
        },
      });
    }
  });

  registerWithAdminAliases('put', '/config', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: true,
      },
    },
  }, async (request: any, reply: any) => {
    try {
      if (!configurationService || typeof configurationService.updateConfiguration !== 'function') {
        reply.status(503).send({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Configuration service not available',
          },
        });
        return;
      }

      const updates = (request.body && typeof request.body === 'object') ? request.body : {};
      await configurationService.updateConfiguration(updates);

      reply.send({
        success: true,
        message: 'Configuration updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update configuration';
      const isValidation = message.toLowerCase().includes('must');
      reply.status(isValidation ? 400 : 500).send({
        success: false,
        error: {
          code: isValidation ? 'CONFIG_VALIDATION_FAILED' : 'CONFIG_UPDATE_FAILED',
          message,
        },
      });
    }
  });
}
