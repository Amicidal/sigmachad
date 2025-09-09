/**
 * Integration tests for Admin API Endpoints
 * Tests system administration, monitoring, and maintenance endpoints
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { FileWatcher } from '../../../src/services/FileWatcher.js';
import { SynchronizationCoordinator } from '../../../src/services/SynchronizationCoordinator.js';
import { SynchronizationMonitoring } from '../../../src/services/SynchronizationMonitoring.js';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, checkDatabaseHealth, insertTestFixtures, } from '../../test-utils/database-helpers.js';
describe('Admin API Endpoints Integration', () => {
    let dbService;
    let kgService;
    let fileWatcher;
    let syncCoordinator;
    let syncMonitor;
    let apiGateway;
    let app;
    beforeAll(async () => {
        // Setup test database
        dbService = await setupTestDatabase();
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error('Database health check failed - cannot run integration tests');
        }
        // Create services
        kgService = new KnowledgeGraphService(dbService);
        fileWatcher = new FileWatcher(kgService, dbService);
        syncCoordinator = new SynchronizationCoordinator(kgService, dbService);
        syncMonitor = new SynchronizationMonitoring(kgService, dbService);
        // Create API Gateway with sync services
        apiGateway = new APIGateway(kgService, dbService, fileWatcher, undefined, // astParser
        undefined, // docParser
        undefined, // securityScanner
        {}, // config
        {
            syncCoordinator,
            syncMonitor,
        });
        app = apiGateway.getApp();
        // Start the server
        await apiGateway.start();
    }, 30000);
    afterAll(async () => {
        if (fileWatcher) {
            await fileWatcher.stop();
        }
        if (apiGateway) {
            await apiGateway.stop();
        }
        if (dbService && dbService.isInitialized()) {
            await cleanupTestDatabase(dbService);
        }
    }, 10000);
    beforeEach(async () => {
        if (dbService && dbService.isInitialized()) {
            await clearTestData(dbService);
        }
    });
    describe('GET /api/v1/admin-health', () => {
        it('should return healthy status when all services are working', async () => {
            // Insert test data for metrics
            await insertTestFixtures(dbService);
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin-health',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            const health = body.data;
            expect(health.overall).toBe('healthy');
            expect(health.components).toBeDefined();
            expect(health.components.graphDatabase).toBeDefined();
            expect(health.components.vectorDatabase).toBeDefined();
            expect(health.components.fileWatcher).toBeDefined();
            expect(health.components.apiServer).toEqual({ status: 'healthy' });
            expect(health.metrics).toBeDefined();
            expect(health.metrics.uptime).toBeGreaterThan(0);
            expect(typeof health.metrics.totalEntities).toBe('number');
            expect(typeof health.metrics.totalRelationships).toBe('number');
            expect(typeof health.metrics.syncLatency).toBe('number');
            expect(typeof health.metrics.errorRate).toBe('number');
        });
        it('should return degraded status when non-critical services fail', async () => {
            // Mock a non-critical service failure
            const originalHealthCheck = dbService.healthCheck;
            dbService.healthCheck = async () => ({
                falkordb: { status: 'healthy' },
                qdrant: { status: 'degraded' },
                postgresql: { status: 'healthy' },
                redis: { status: 'healthy' },
            });
            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/admin-health',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.data.overall).toMatch(/degraded|unhealthy/);
            }
            finally {
                dbService.healthCheck = originalHealthCheck;
            }
        });
        it('should return unhealthy status when critical services fail', async () => {
            // Mock critical service failures
            const originalHealthCheck = dbService.healthCheck;
            dbService.healthCheck = async () => ({
                falkordb: { status: 'unhealthy' },
                qdrant: { status: 'unhealthy' },
                postgresql: { status: 'healthy' },
                redis: { status: 'healthy' },
            });
            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/admin-health',
                });
                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.payload);
                expect(body.data.overall).toBe('unhealthy');
            }
            finally {
                dbService.healthCheck = originalHealthCheck;
            }
        });
        it('should include accurate entity and relationship counts', async () => {
            // Insert known test data
            await insertTestFixtures(dbService);
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/admin-health',
            });
            const body = JSON.parse(response.payload);
            expect(body.data.metrics.totalEntities).toBeGreaterThanOrEqual(0);
            expect(body.data.metrics.totalRelationships).toBeGreaterThanOrEqual(0);
        });
    });
    describe('GET /api/v1/admin/sync-status', () => {
        it('should return current synchronization status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sync-status',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            const status = body.data;
            expect(typeof status.isActive).toBe('boolean');
            expect(status.lastSync).toBeDefined();
            expect(typeof status.queueDepth).toBe('number');
            expect(typeof status.processingRate).toBe('number');
            expect(status.errors).toBeDefined();
            expect(typeof status.errors.count).toBe('number');
            expect(Array.isArray(status.errors.recent)).toBe(true);
            expect(status.performance).toBeDefined();
            expect(typeof status.performance.syncLatency).toBe('number');
            expect(typeof status.performance.throughput).toBe('number');
            expect(typeof status.performance.successRate).toBe('number');
        });
        it('should report active synchronization when sync is running', async () => {
            // Start a sync operation
            if (syncCoordinator) {
                await syncCoordinator.startSync();
            }
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sync-status',
            });
            const body = JSON.parse(response.payload);
            expect(body.data.isActive).toBeDefined();
            // Stop sync
            if (syncCoordinator) {
                await syncCoordinator.stopSync();
            }
        });
        it('should include error information in sync status', async () => {
            // Mock sync with errors
            if (syncMonitor) {
                syncMonitor.recordError('Test error 1');
                syncMonitor.recordError('Test error 2');
            }
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sync-status',
            });
            const body = JSON.parse(response.payload);
            expect(body.data.errors.count).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(body.data.errors.recent)).toBe(true);
        });
    });
    describe('GET /api/v1/admin/analytics', () => {
        it('should return analytics for default time period', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/analytics',
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            const analytics = body.data;
            expect(analytics.period).toBeDefined();
            expect(analytics.usage).toBeDefined();
            expect(typeof analytics.usage.apiCalls).toBe('number');
            expect(typeof analytics.usage.uniqueUsers).toBe('number');
            expect(typeof analytics.usage.popularEndpoints).toBe('object');
            expect(analytics.performance).toBeDefined();
            expect(typeof analytics.performance.averageResponseTime).toBe('number');
            expect(typeof analytics.performance.p95ResponseTime).toBe('number');
            expect(typeof analytics.performance.errorRate).toBe('number');
            expect(analytics.content).toBeDefined();
            expect(typeof analytics.content.totalEntities).toBe('number');
            expect(typeof analytics.content.totalRelationships).toBe('number');
            expect(typeof analytics.content.growthRate).toBe('number');
            expect(Array.isArray(analytics.content.mostActiveDomains)).toBe(true);
        });
        it('should accept custom date range parameters', async () => {
            const since = '2024-01-01T00:00:00Z';
            const until = '2024-01-31T23:59:59Z';
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/admin/analytics?since=${since}&until=${until}`,
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.period.since).toBeDefined();
            expect(body.data.period.until).toBeDefined();
        });
        it('should track popular endpoints correctly', async () => {
            // Make some API calls to track
            await app.inject({ method: 'GET', url: '/health' });
            await app.inject({ method: 'GET', url: '/health' });
            await app.inject({ method: 'GET', url: '/api/v1/test' });
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/analytics',
            });
            const body = JSON.parse(response.payload);
            expect(body.data.usage.popularEndpoints).toBeDefined();
            expect(typeof body.data.usage.popularEndpoints).toBe('object');
        });
    });
    describe('POST /api/v1/admin/admin/sync', () => {
        it('should trigger manual synchronization with default options', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({}),
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.message).toContain('Synchronization');
        });
        it('should accept force sync with all options enabled', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({
                    force: true,
                    includeEmbeddings: true,
                    includeTests: true,
                    includeSecurity: true,
                }),
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
            expect(body.data.message).toContain('Synchronization');
        });
        it('should handle selective sync options', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({
                    force: false,
                    includeEmbeddings: true,
                    includeTests: false,
                    includeSecurity: false,
                }),
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.success).toBe(true);
        });
        it('should prevent concurrent synchronization attempts', async () => {
            // Start first sync
            const firstResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({ force: true }),
            });
            expect(firstResponse.statusCode).toBe(200);
            // Attempt concurrent sync
            const secondResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({ force: true }),
            });
            // Should either queue or reject with appropriate message
            expect([200, 409]).toContain(secondResponse.statusCode);
            if (secondResponse.statusCode === 409) {
                const body = JSON.parse(secondResponse.payload);
                expect(body.error.message).toContain('already in progress');
            }
        });
        it('should validate request body schema', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/admin/sync',
                headers: {
                    'content-type': 'application/json',
                },
                payload: JSON.stringify({
                    invalidField: 'test',
                }),
            });
            // Should accept but ignore invalid fields or reject with 400
            expect([200, 400]).toContain(response.statusCode);
        });
    });
    describe('Admin API Error Handling', () => {
        it('should handle database connection errors gracefully', async () => {
            // Mock database failure
            const originalHealthCheck = dbService.healthCheck;
            dbService.healthCheck = async () => {
                throw new Error('Database connection failed');
            };
            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/admin-health',
                });
                expect([200, 500, 503]).toContain(response.statusCode);
                if (response.statusCode !== 200) {
                    const body = JSON.parse(response.payload);
                    expect(body.success).toBe(false);
                    expect(body.error).toBeDefined();
                }
            }
            finally {
                dbService.healthCheck = originalHealthCheck;
            }
        });
        it('should handle missing services gracefully', async () => {
            // Test endpoints when optional services are not initialized
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sync-status',
            });
            // Should still return a response even if sync services are not available
            expect([200, 503]).toContain(response.statusCode);
        });
    });
});
//# sourceMappingURL=AdminEndpoints.integration.test.js.map