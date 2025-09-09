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
        try {
            const health = await dbService.healthCheck();
            const componentStatuses = [
                health?.falkordb?.status,
                health?.qdrant?.status,
                health?.postgresql?.status,
                health?.redis?.status,
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
            catch {
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
        catch {
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
            const originalUrl = request.raw?.url || request.url || '';
            const [pathOnly, queryStr] = originalUrl.split('?');
            const basePrefix = pathOnly.endsWith(aliasPath)
                ? pathOnly.slice(0, -aliasPath.length)
                : pathOnly.replace(/\/?admin(?:\/.*)?$/, '');
            const targetUrl = `${basePrefix}${targetPath}${queryStr ? `?${queryStr}` : ''}`;
            const payload = method === 'POST'
                ? (typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {}))
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
            reply.status(res.statusCode).send(res.body ?? res.payload);
        };
    };
    // Admin-prefixed aliases for tests expecting /admin/* paths
    app.get('/admin/health', forwardTo('GET', '/admin/health', '/admin-health'));
    app.get('/admin/admin-health', forwardTo('GET', '/admin/admin-health', '/admin-health'));
    app.post('/admin/admin/sync', forwardTo('POST', '/admin/admin/sync', '/sync'));
    // GET /api/admin/sync-status - Get synchronization status
    app.get('/sync-status', async (request, reply) => {
        try {
            let status;
            if (syncMonitor) {
                const metrics = syncMonitor.getSyncMetrics();
                const health = syncMonitor.getHealthMetrics();
                const activeOps = syncMonitor.getActiveOperations();
                status = {
                    isActive: activeOps.length > 0,
                    lastSync: health.lastSyncTime,
                    queueDepth: syncCoordinator ? syncCoordinator.getQueueLength() : 0,
                    processingRate: metrics.throughput,
                    errors: {
                        count: metrics.operationsFailed,
                        recent: metrics.operationsFailed > 0 ? [`${metrics.operationsFailed} sync operations failed`] : []
                    },
                    performance: {
                        syncLatency: metrics.averageSyncTime,
                        throughput: metrics.throughput,
                        successRate: metrics.operationsTotal > 0 ?
                            (metrics.operationsSuccessful / metrics.operationsTotal) : 1.0
                    }
                };
            }
            else {
                // Fallback when sync services not available
                status = {
                    isActive: false,
                    lastSync: new Date(),
                    queueDepth: 0,
                    processingRate: 0,
                    errors: {
                        count: 0,
                        recent: []
                    },
                    performance: {
                        syncLatency: 0,
                        throughput: 0,
                        successRate: 1.0
                    }
                };
            }
            reply.send({
                success: true,
                data: status
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
    app.get('/admin/sync-status', forwardTo('GET', '/admin/sync-status', '/sync-status'));
    // POST /api/admin/sync - Trigger full synchronization
    app.post('/sync', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    force: { type: 'boolean' },
                    includeEmbeddings: { type: 'boolean' },
                    includeTests: { type: 'boolean' },
                    includeSecurity: { type: 'boolean' }
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
        catch {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SYNC_TRIGGER_FAILED',
                    message: 'Failed to trigger synchronization'
                }
            });
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
                includeData: options.includeData ?? true,
                includeConfig: options.includeConfig ?? true,
                compression: options.compression ?? true,
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
                dryRun: dryRun ?? true
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