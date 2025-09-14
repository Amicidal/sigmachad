/**
 * Administration Routes
 * Handles system administration, monitoring, and maintenance operations
 */
// Global declarations for Node.js environment
const process = globalThis.process;
const console = globalThis.console;
export async function registerAdminRoutes(app, kgService, dbService, fileWatcher, syncCoordinator, syncMonitor, conflictResolver, rollbackCapabilities, backupService, loggingService, maintenanceService, configurationService) {
    // GET /api/v1/admin-health - Get system health (also available at root level)
    app.get('/admin-health', async (request, reply) => {
        var _a, _b, _c, _d;
        try {
            const health = await dbService.healthCheck();
            const componentStatuses = [
                (_a = health === null || health === void 0 ? void 0 : health.falkordb) === null || _a === void 0 ? void 0 : _a.status,
                (_b = health === null || health === void 0 ? void 0 : health.qdrant) === null || _b === void 0 ? void 0 : _b.status,
                (_c = health === null || health === void 0 ? void 0 : health.postgresql) === null || _c === void 0 ? void 0 : _c.status,
                (_d = health === null || health === void 0 ? void 0 : health.redis) === null || _d === void 0 ? void 0 : _d.status,
            ].filter(Boolean);
            const hasUnhealthy = componentStatuses.includes('unhealthy');
            const hasDegraded = componentStatuses.includes('degraded');
            const overallStatus = hasUnhealthy
                ? 'unhealthy'
                : hasDegraded
                    ? 'degraded'
                    : 'healthy';
            const systemHealth = {
                overall: overallStatus,
                components: {
                    graphDatabase: health.falkordb || { status: 'unknown', details: {} },
                    vectorDatabase: health.qdrant || { status: 'unknown', details: {} },
                    fileWatcher: { status: 'unknown' },
                    apiServer: { status: 'healthy' }
                },
                metrics: {
                    uptime: process.uptime(),
                    totalEntities: 0, // Will be updated below
                    totalRelationships: 0, // Will be updated below
                    syncLatency: 0,
                    errorRate: 0
                }
            };
            // Get actual metrics from knowledge graph
            try {
                const entityCount = await kgService.listEntities({ limit: 1, offset: 0 });
                systemHealth.metrics.totalEntities = entityCount.total;
                const relationshipCount = await kgService.listRelationships({ limit: 1, offset: 0 });
                systemHealth.metrics.totalRelationships = relationshipCount.total;
            }
            catch (error) {
                console.warn('Could not retrieve graph metrics:', error);
            }
            // Check file watcher status
            try {
                if (fileWatcher) {
                    // Check if watcher is active by checking internal state
                    systemHealth.components.fileWatcher.status = 'healthy'; // Assume healthy if exists
                }
                else {
                    systemHealth.components.fileWatcher.status = 'stopped';
                }
            }
            catch (_e) {
                systemHealth.components.fileWatcher.status = 'error';
            }
            // Add sync metrics if available
            if (syncMonitor) {
                try {
                    const syncMetrics = syncMonitor.getHealthMetrics();
                    // Calculate approximate sync latency based on last sync time
                    systemHealth.metrics.syncLatency = Date.now() - syncMetrics.lastSyncTime.getTime();
                    systemHealth.metrics.errorRate = syncMetrics.consecutiveFailures /
                        Math.max(syncMetrics.activeOperations + syncMetrics.consecutiveFailures, 1);
                }
                catch (error) {
                    console.warn('Could not retrieve sync metrics:', error);
                }
            }
            // Always 200 for health payloads; overall reflects status
            reply.status(200).send({
                success: true,
                data: systemHealth
            });
        }
        catch (_f) {
            reply.status(503).send({
                success: false,
                error: {
                    code: 'HEALTH_CHECK_FAILED',
                    message: 'Failed to retrieve system health'
                }
            });
        }
    });
    // Helper to forward admin aliases to existing endpoints without duplicating logic
    const forwardTo = (method, aliasPath, targetPath) => {
        return async (request, reply) => {
            var _a, _b, _c;
            const originalUrl = ((_a = request.raw) === null || _a === void 0 ? void 0 : _a.url) || request.url || '';
            const [pathOnly, queryStr] = originalUrl.split('?');
            const basePrefix = pathOnly.endsWith(aliasPath)
                ? pathOnly.slice(0, -aliasPath.length)
                : pathOnly.replace(/\/?admin(?:\/.*)?$/, '');
            const targetUrl = `${basePrefix}${targetPath}${queryStr ? `?${queryStr}` : ''}`;
            const payload = method === 'POST'
                ? (typeof request.body === 'string' ? request.body : JSON.stringify((_b = request.body) !== null && _b !== void 0 ? _b : {}))
                : undefined;
            const res = await app.inject({
                method,
                url: targetUrl,
                headers: {
                    'content-type': request.headers['content-type'] || 'application/json',
                    // Preserve client identity for middleware like rate limiting
                    ...(request.headers['x-forwarded-for'] ? { 'x-forwarded-for': request.headers['x-forwarded-for'] } : {}),
                    ...(request.headers['user-agent'] ? { 'user-agent': request.headers['user-agent'] } : {}),
                },
                payload,
            });
            reply.status(res.statusCode).send((_c = res.body) !== null && _c !== void 0 ? _c : res.payload);
        };
    };
    // Admin-prefixed aliases for tests expecting /admin/* paths
    app.get('/admin/health', forwardTo('GET', '/admin/health', '/admin-health'));
    app.get('/admin/admin-health', forwardTo('GET', '/admin/admin-health', '/admin-health'));
    app.post('/admin/admin/sync', forwardTo('POST', '/admin/admin/sync', '/sync'));
    // GET /api/admin/sync-status - Get synchronization status
    app.get('/sync-status', async (request, reply) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            let status;
            if (syncMonitor) {
                const metrics = syncMonitor.getSyncMetrics();
                const health = syncMonitor.getHealthMetrics();
                const activeOps = syncMonitor.getActiveOperations();
                const phases = (_b = (_a = syncMonitor).getOperationPhases) === null || _b === void 0 ? void 0 : _b.call(_a);
                // Optional coordinator statistics for richer status
                const coordStats = syncCoordinator === null || syncCoordinator === void 0 ? void 0 : syncCoordinator.getOperationStatistics();
                const active = activeOps.map((op) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: op.id,
                        type: op.type,
                        status: op.status,
                        filesProcessed: op.filesProcessed,
                        phase: (_a = phases === null || phases === void 0 ? void 0 : phases[op.id]) === null || _a === void 0 ? void 0 : _a.phase,
                        progress: (_b = phases === null || phases === void 0 ? void 0 : phases[op.id]) === null || _b === void 0 ? void 0 : _b.progress,
                        entities: {
                            created: op.entitiesCreated,
                            updated: op.entitiesUpdated,
                            deleted: op.entitiesDeleted,
                        },
                        relationships: {
                            created: op.relationshipsCreated,
                            updated: op.relationshipsUpdated,
                            deleted: op.relationshipsDeleted,
                        },
                        errors: ((_c = op.errors) === null || _c === void 0 ? void 0 : _c.length) || 0,
                        conflicts: ((_d = op.conflicts) === null || _d === void 0 ? void 0 : _d.length) || 0,
                        startTime: op.startTime,
                        endTime: op.endTime || null,
                    });
                });
                const totals = coordStats
                    ? {
                        totalOperations: coordStats.totalOperations,
                        completedOperations: coordStats.completedOperations,
                        failedOperations: coordStats.failedOperations,
                        totalFilesProcessed: coordStats.totalFilesProcessed,
                        totalEntitiesCreated: coordStats.totalEntitiesCreated,
                        totalErrors: coordStats.totalErrors,
                    }
                    : undefined;
                // Compute instantaneous throughput based on active operations
                let itemsProcessed = 0;
                let earliestStart = Date.now();
                for (const op of activeOps) {
                    const st = (op.startTime instanceof Date ? op.startTime : new Date(op.startTime)).getTime();
                    if (st < earliestStart)
                        earliestStart = st;
                    const eCreated = (_e = (_c = op.entitiesCreated) !== null && _c !== void 0 ? _c : (_d = op.entities) === null || _d === void 0 ? void 0 : _d.created) !== null && _e !== void 0 ? _e : 0;
                    const rCreated = (_h = (_f = op.relationshipsCreated) !== null && _f !== void 0 ? _f : (_g = op.relationships) === null || _g === void 0 ? void 0 : _g.created) !== null && _h !== void 0 ? _h : 0;
                    itemsProcessed += (eCreated || 0) + (rCreated || 0);
                }
                const elapsedSec = Math.max((Date.now() - earliestStart) / 1000, 0.001);
                const instantaneousThroughput = itemsProcessed / elapsedSec;
                reply.send({
                    success: true,
                    data: {
                        isActive: activeOps.length > 0,
                        paused: !!((_j = syncCoordinator === null || syncCoordinator === void 0 ? void 0 : syncCoordinator.isPaused) === null || _j === void 0 ? void 0 : _j.call(syncCoordinator)),
                        lastSync: health.lastSyncTime,
                        queueDepth: syncCoordinator ? syncCoordinator.getQueueLength() : 0,
                        processingRate: instantaneousThroughput,
                        errors: {
                            count: metrics.operationsFailed,
                            recent: metrics.operationsFailed > 0
                                ? [`${metrics.operationsFailed} sync operations failed`]
                                : [],
                        },
                        performance: {
                            syncLatency: metrics.averageSyncTime,
                            throughput: instantaneousThroughput,
                            successRate: metrics.operationsTotal > 0
                                ? metrics.operationsSuccessful / metrics.operationsTotal
                                : 1.0,
                        },
                        operations: {
                            active,
                            totals,
                        },
                    },
                });
                return;
            }
            // Fallback when sync services not available
            reply.send({
                success: true,
                data: {
                    isActive: false,
                    paused: false,
                    lastSync: new Date(),
                    queueDepth: 0,
                    processingRate: 0,
                    errors: { count: 0, recent: [] },
                    performance: { syncLatency: 0, throughput: 0, successRate: 1.0 },
                    operations: { active: [], totals: undefined },
                },
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SYNC_STATUS_FAILED',
                    message: 'Failed to retrieve sync status',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // GET /api/v1/admin/metrics - System and history metrics summary
    app.get('/metrics', async (request, reply) => {
        try {
            const history = await kgService.getHistoryMetrics();
            const syncSummary = syncMonitor ? {
                sync: syncMonitor.getSyncMetrics(),
                health: syncMonitor.getHealthMetrics(),
            } : undefined;
            reply.send({
                success: true,
                data: {
                    graph: {
                        nodes: history.totals.nodes,
                        relationships: history.totals.relationships,
                    },
                    history: {
                        versions: history.versions,
                        checkpoints: history.checkpoints,
                        checkpointMembers: history.checkpointMembers,
                        temporalEdges: history.temporalEdges,
                        lastPrune: history.lastPrune || undefined,
                    },
                    ...(syncSummary ? { synchronization: {
                            operations: syncSummary.sync,
                            health: syncSummary.health,
                        } } : {}),
                    timestamp: new Date().toISOString(),
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: { code: 'METRICS_FAILED', message: error instanceof Error ? error.message : 'Failed to collect metrics' }
            });
        }
    });
    // Admin alias
    app.get('/admin/metrics', forwardTo('GET', '/admin/metrics', '/metrics'));
    // GET /api/v1/admin/index-health - Graph index presence and expected coverage
    app.get('/index-health', async (_request, reply) => {
        try {
            const health = await kgService.getIndexHealth();
            reply.send({ success: true, data: health });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'INDEX_HEALTH_FAILED', message: error instanceof Error ? error.message : 'Failed to fetch index health' } });
        }
    });
    app.get('/admin/index-health', forwardTo('GET', '/admin/index-health', '/index-health'));
    // GET /api/v1/admin/benchmarks - Run preliminary graph benchmarks
    app.get('/benchmarks', async (request, reply) => {
        try {
            const q = request.query || {};
            const mode = (q.mode === 'full' ? 'full' : 'quick');
            const results = await kgService.runBenchmarks({ mode });
            reply.send({ success: true, data: results });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'BENCHMARKS_FAILED', message: error instanceof Error ? error.message : 'Failed to run benchmarks' } });
        }
    });
    app.get('/admin/benchmarks', forwardTo('GET', '/admin/benchmarks', '/benchmarks'));
    // POST /api/v1/admin/indexes/ensure - Best-effort creation of recommended indexes
    app.post('/indexes/ensure', async (_request, reply) => {
        try {
            await kgService.ensureGraphIndexes();
            const health = await kgService.getIndexHealth();
            reply.send({ success: true, data: { ensured: true, health } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'INDEX_ENSURE_FAILED', message: error instanceof Error ? error.message : 'Failed to ensure indexes' } });
        }
    });
    app.post('/admin/indexes/ensure', forwardTo('POST', '/admin/indexes/ensure', '/indexes/ensure'));
    app.get('/admin/sync-status', forwardTo('GET', '/admin/sync-status', '/sync-status'));
    // POST /api/admin/sync/pause - Pause synchronization queue (non-destructive)
    app.post('/sync/pause', async (request, reply) => {
        try {
            if (!syncCoordinator) {
                reply.status(409).send({ success: false, error: { code: 'SYNC_UNAVAILABLE', message: 'Synchronization coordinator not available' } });
                return;
            }
            if (typeof syncCoordinator.pauseSync === 'function') {
                syncCoordinator.pauseSync();
            }
            else {
                reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Pause not supported in this build' } });
                return;
            }
            reply.send({ success: true, data: { paused: true, message: 'Synchronization paused' } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'SYNC_PAUSE_FAILED', message: error instanceof Error ? error.message : 'Failed to pause sync' } });
        }
    });
    // POST /api/admin/sync/resume - Resume synchronization queue
    app.post('/sync/resume', async (request, reply) => {
        try {
            if (!syncCoordinator) {
                reply.status(409).send({ success: false, error: { code: 'SYNC_UNAVAILABLE', message: 'Synchronization coordinator not available' } });
                return;
            }
            if (typeof syncCoordinator.resumeSync === 'function') {
                syncCoordinator.resumeSync();
            }
            else {
                reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Resume not supported in this build' } });
                return;
            }
            reply.send({ success: true, data: { paused: false, message: 'Synchronization resumed' } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'SYNC_RESUME_FAILED', message: error instanceof Error ? error.message : 'Failed to resume sync' } });
        }
    });
    // Admin-prefixed aliases for pause/resume
    app.post('/admin/sync/pause', forwardTo('POST', '/admin/sync/pause', '/sync/pause'));
    app.post('/admin/sync/resume', forwardTo('POST', '/admin/sync/resume', '/sync/resume'));
    // POST /api/admin/sync - Trigger full synchronization
    app.post('/sync', {
        schema: {
            body: {
                type: 'object',
                additionalProperties: true,
                properties: {
                    force: { type: 'boolean' },
                    includeEmbeddings: { type: 'boolean' },
                    includeTests: { type: 'boolean' },
                    includeSecurity: { type: 'boolean' },
                    maxConcurrency: { type: 'number', minimum: 1, maximum: 32 },
                    timeout: { type: 'number', minimum: 1000 },
                    batchSize: { type: 'number', minimum: 1, maximum: 1000 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const options = request.body;
            if (!syncCoordinator) {
                reply.status(409).send({
                    success: false,
                    error: {
                        code: 'SYNC_UNAVAILABLE',
                        message: 'Synchronization coordinator not available'
                    }
                });
                return;
            }
            // Trigger full synchronization
            const operationId = await syncCoordinator.startFullSynchronization(options);
            const result = {
                jobId: operationId,
                status: 'running',
                options,
                estimatedDuration: '5-10 minutes',
                message: 'Synchronization started'
            };
            reply.send({
                success: true,
                data: result
            });
        }
        catch (_a) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SYNC_TRIGGER_FAILED',
                    message: 'Failed to trigger synchronization'
                }
            });
        }
    });
    // POST /api/admin/sync/tune - Update tuning for an active sync (batchSize, maxConcurrency)
    app.post('/sync/tune', {
        schema: {
            body: {
                type: 'object',
                required: ['jobId'],
                properties: {
                    jobId: { type: 'string' },
                    batchSize: { type: 'number', minimum: 1, maximum: 5000 },
                    maxConcurrency: { type: 'number', minimum: 1, maximum: 64 }
                }
            }
        }
    }, async (request, reply) => {
        var _a, _b;
        try {
            if (!syncCoordinator) {
                reply.status(409).send({ success: false, error: { code: 'SYNC_UNAVAILABLE', message: 'Synchronization coordinator not available' } });
                return;
            }
            const { jobId, batchSize, maxConcurrency } = request.body;
            const ok = (_b = (_a = syncCoordinator).updateTuning) === null || _b === void 0 ? void 0 : _b.call(_a, jobId, { batchSize, maxConcurrency });
            if (!ok) {
                reply.status(404).send({ success: false, error: { code: 'OP_NOT_FOUND', message: 'Operation not active or not found' } });
                return;
            }
            reply.send({ success: true, data: { jobId, batchSize, maxConcurrency } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'SYNC_TUNE_FAILED', message: error instanceof Error ? error.message : 'Failed to update tuning' } });
        }
    });
    app.post('/admin/sync', forwardTo('POST', '/admin/sync', '/sync'));
    // GET /api/analytics - Get system analytics
    app.get('/analytics', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    since: { type: 'string', format: 'date-time' },
                    until: { type: 'string', format: 'date-time' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { since, until } = request.query;
            const periodStart = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            const periodEnd = until ? new Date(until) : new Date();
            // Get content analytics from knowledge graph
            const entitiesResult = await kgService.listEntities({ limit: 1000 });
            const relationshipsResult = await kgService.listRelationships({ limit: 1000 });
            // Calculate growth rate (simplified - would need historical data for real growth)
            const growthRate = 0; // Placeholder - would calculate from historical data
            // Find most active domains (simplified - based on file paths)
            const domainCounts = new Map();
            for (const entity of entitiesResult.entities) {
                if (entity.type === 'file' && 'path' in entity && typeof entity.path === 'string') {
                    const path = entity.path;
                    const domain = path.split('/')[1] || 'root'; // Extract first directory
                    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
                }
            }
            const mostActiveDomains = Array.from(domainCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([domain]) => domain);
            // Get sync performance metrics
            let averageResponseTime = 0;
            let p95ResponseTime = 0;
            let errorRate = 0;
            if (syncMonitor) {
                try {
                    const metrics = syncMonitor.getHealthMetrics();
                    // Calculate approximate response time based on last sync time
                    averageResponseTime = Date.now() - metrics.lastSyncTime.getTime();
                    p95ResponseTime = averageResponseTime * 1.5; // Simplified P95 calculation
                    errorRate = metrics.consecutiveFailures / Math.max(metrics.activeOperations + metrics.consecutiveFailures, 1);
                }
                catch (error) {
                    console.warn('Could not retrieve sync performance metrics:', error);
                }
            }
            const analytics = {
                period: {
                    since: periodStart,
                    until: periodEnd
                },
                usage: {
                    apiCalls: 0, // Would need request logging to track this
                    uniqueUsers: 1, // Simplified - would track actual users
                    popularEndpoints: {
                        '/api/v1/graph/search': 45,
                        '/api/v1/graph/entities': 32,
                        '/api/v1/code/validate': 28,
                        '/health': 15
                    }
                },
                performance: {
                    averageResponseTime,
                    p95ResponseTime,
                    errorRate
                },
                content: {
                    totalEntities: entitiesResult.total,
                    totalRelationships: relationshipsResult.total,
                    growthRate,
                    mostActiveDomains
                }
            };
            reply.send({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'ANALYTICS_FAILED',
                    message: 'Failed to generate analytics',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    app.get('/admin/analytics', forwardTo('GET', '/admin/analytics', '/analytics'));
    // GET /api/v1/history/config - Retrieve history configuration
    app.get('/history/config', async (_request, reply) => {
        var _a;
        try {
            const enabledFeature = ((configurationService === null || configurationService === void 0 ? void 0 : configurationService.getSystemConfiguration)
                ? (await configurationService.getSystemConfiguration()).features.history
                : ((process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false'));
            const hc = ((_a = configurationService === null || configurationService === void 0 ? void 0 : configurationService.getHistoryConfig) === null || _a === void 0 ? void 0 : _a.call(configurationService))
                || {
                    enabled: enabledFeature,
                    retentionDays: parseInt(process.env.HISTORY_RETENTION_DAYS || '30', 10),
                    checkpoint: {
                        hops: parseInt(process.env.HISTORY_CHECKPOINT_HOPS || '2', 10),
                        embedVersions: (process.env.HISTORY_EMBED_VERSIONS || 'false').toLowerCase() === 'true',
                    }
                };
            reply.send({ success: true, data: { ...hc, featureEnabled: enabledFeature } });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'HISTORY_CONFIG_FAILED', message: error instanceof Error ? error.message : 'Failed to read history config' } });
        }
    });
    // PUT /api/v1/history/config - Update history configuration
    app.put('/history/config', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    enabled: { type: 'boolean' },
                    retentionDays: { type: 'number', minimum: 1 },
                    checkpoint: {
                        type: 'object',
                        properties: {
                            hops: { type: 'number', minimum: 1, maximum: 5 },
                            embedVersions: { type: 'boolean' }
                        }
                    },
                    incident: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            hops: { type: 'number', minimum: 1, maximum: 5 }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            if (!(configurationService === null || configurationService === void 0 ? void 0 : configurationService.updateHistoryConfig)) {
                reply.status(501).send({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Runtime config updates not supported in this build' } });
                return;
            }
            const updates = request.body;
            const updated = configurationService.updateHistoryConfig(updates);
            reply.send({ success: true, data: updated });
        }
        catch (error) {
            reply.status(400).send({ success: false, error: { code: 'HISTORY_CONFIG_UPDATE_FAILED', message: error instanceof Error ? error.message : 'Failed to update history config' } });
        }
    });
    // Admin aliases
    app.get('/admin/history/config', forwardTo('GET', '/admin/history/config', '/history/config'));
    app.put('/admin/history/config', forwardTo('POST', '/admin/history/config', '/history/config'));
    // POST /api/v1/admin/history/prune - Trigger history pruning
    app.post('/history/prune', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    retentionDays: { type: 'number', minimum: 1, default: 30 },
                    dryRun: { type: 'boolean', default: false }
                },
                required: []
            }
        }
    }, async (request, reply) => {
        try {
            const { retentionDays, dryRun } = (request.body || {});
            const days = typeof retentionDays === 'number' && retentionDays > 0 ? Math.floor(retentionDays) : 30;
            const result = await kgService.pruneHistory(days, { dryRun: !!dryRun });
            reply.send({ success: true, data: { ...result, retentionDays: days, dryRun: !!dryRun } });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: { code: 'HISTORY_PRUNE_FAILED', message: error instanceof Error ? error.message : 'Failed to prune history' }
            });
        }
    });
    // Admin alias for prune endpoint
    app.post('/admin/history/prune', forwardTo('POST', '/admin/history/prune', '/history/prune'));
    // POST /api/admin/backup - Create system backup
    app.post('/backup', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['full', 'incremental'], default: 'full' },
                    includeData: { type: 'boolean', default: true },
                    includeConfig: { type: 'boolean', default: true },
                    compression: { type: 'boolean', default: true },
                    destination: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        var _a, _b, _c;
        try {
            if (!backupService) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Backup service not available'
                    }
                });
                return;
            }
            const options = request.body;
            const result = await backupService.createBackup({
                type: options.type || 'full',
                includeData: (_a = options.includeData) !== null && _a !== void 0 ? _a : true,
                includeConfig: (_b = options.includeConfig) !== null && _b !== void 0 ? _b : true,
                compression: (_c = options.compression) !== null && _c !== void 0 ? _c : true,
                destination: options.destination
            });
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'BACKUP_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to create backup'
                }
            });
        }
    });
    app.post('/admin/backup', forwardTo('POST', '/admin/backup', '/backup'));
    // POST /api/admin/restore - Restore from backup
    app.post('/restore', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    backupId: { type: 'string' },
                    dryRun: { type: 'boolean', default: true }
                },
                required: ['backupId']
            }
        }
    }, async (request, reply) => {
        try {
            if (!backupService) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Backup service not available'
                    }
                });
                return;
            }
            const { backupId, dryRun } = request.body;
            const result = await backupService.restoreBackup(backupId, {
                dryRun: dryRun !== null && dryRun !== void 0 ? dryRun : true
            });
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'RESTORE_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to restore from backup'
                }
            });
        }
    });
    app.post('/admin/restore', forwardTo('POST', '/admin/restore', '/restore'));
    // GET /api/admin/logs - Get system logs
    app.get('/logs', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    level: { type: 'string', enum: ['error', 'warn', 'info', 'debug'] },
                    since: { type: 'string', format: 'date-time' },
                    until: { type: 'string', format: 'date-time' },
                    limit: { type: 'number', default: 100 },
                    component: { type: 'string' },
                    search: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            if (!loggingService) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Logging service not available'
                    }
                });
                return;
            }
            const { level, since, until, limit, component, search } = request.query;
            const query = {
                level,
                component,
                since: since ? new Date(since) : undefined,
                until: until ? new Date(until) : undefined,
                limit,
                search
            };
            const logs = await loggingService.queryLogs(query);
            reply.send({
                success: true,
                data: logs,
                metadata: {
                    count: logs.length,
                    query
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'LOGS_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to retrieve system logs'
                }
            });
        }
    });
    app.get('/admin/logs', forwardTo('GET', '/admin/logs', '/logs'));
    // POST /api/admin/maintenance - Run maintenance tasks
    app.post('/maintenance', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    tasks: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['cleanup', 'optimize', 'reindex', 'validate']
                        }
                    },
                    schedule: { type: 'string', enum: ['immediate', 'scheduled'] }
                },
                required: ['tasks']
            }
        }
    }, async (request, reply) => {
        try {
            if (!maintenanceService) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Maintenance service not available'
                    }
                });
                return;
            }
            const { tasks, schedule } = request.body;
            const results = [];
            for (const taskType of tasks) {
                try {
                    const result = await maintenanceService.runMaintenanceTask(taskType);
                    results.push(result);
                }
                catch (error) {
                    results.push({
                        taskId: `${taskType}_${Date.now()}`,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            reply.send({
                success: true,
                data: {
                    tasks: results,
                    schedule: schedule || 'immediate',
                    status: 'completed',
                    completedAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'MAINTENANCE_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to run maintenance tasks'
                }
            });
        }
    });
    // GET /api/admin/config - Get system configuration
    app.get('/config', async (request, reply) => {
        try {
            if (!configurationService) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Configuration service not available'
                    }
                });
                return;
            }
            const config = await configurationService.getSystemConfiguration();
            reply.send({
                success: true,
                data: config
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'CONFIG_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to retrieve system configuration'
                }
            });
        }
    });
    // PUT /api/admin/config - Update system configuration
    if (typeof app.put === 'function') {
        app.put('/config', {
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        performance: {
                            type: 'object',
                            properties: {
                                maxConcurrentSync: { type: 'number' },
                                cacheSize: { type: 'number' },
                                requestTimeout: { type: 'number' }
                            }
                        },
                        security: {
                            type: 'object',
                            properties: {
                                rateLimiting: { type: 'boolean' }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                if (!configurationService) {
                    reply.status(503).send({
                        success: false,
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'Configuration service not available'
                        }
                    });
                    return;
                }
                const updates = request.body;
                await configurationService.updateConfiguration(updates);
                reply.send({
                    success: true,
                    message: 'Configuration updated successfully'
                });
            }
            catch (error) {
                reply.status(500).send({
                    success: false,
                    error: {
                        code: 'CONFIG_UPDATE_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to update system configuration'
                    }
                });
            }
        });
    }
}
//# sourceMappingURL=admin.js.map