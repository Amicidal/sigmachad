/**
 * tRPC Admin Router Tests
 * Tests the admin router procedures with actual functionality
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { adminRouter } from '../src/api/trpc/routes/admin.js';
import { SynchronizationMonitoring } from '../src/services/SynchronizationMonitoring.js';
import { SynchronizationCoordinator } from '../src/services/SynchronizationCoordinator.js';
import { RollbackCapabilities } from '../src/services/RollbackCapabilities.js';
import { DatabaseService } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import * as fs from 'fs/promises';
// Mock services
jest.mock('../src/services/SynchronizationMonitoring.js');
jest.mock('../src/services/SynchronizationCoordinator.js');
jest.mock('../src/services/RollbackCapabilities.js');
jest.mock('../src/services/DatabaseService.js');
jest.mock('../src/services/KnowledgeGraphService.js');
describe('Admin tRPC Router', () => {
    let caller;
    let mockSyncMonitor;
    let mockSyncCoordinator;
    let mockRollback;
    let mockDbService;
    let mockKgService;
    beforeEach(() => {
        // Create mock instances with required constructor arguments
        const mockConfig = {
            falkordb: { url: 'redis://localhost:6379' },
            qdrant: { url: 'http://localhost:6333' },
            postgresql: { connectionString: 'postgresql://localhost:5432/test' }
        };
        mockDbService = new DatabaseService(mockConfig);
        mockKgService = new KnowledgeGraphService(mockDbService);
        mockSyncMonitor = new SynchronizationMonitoring();
        mockSyncCoordinator = new SynchronizationCoordinator(mockKgService, mockDbService, mockSyncMonitor);
        mockRollback = new RollbackCapabilities(mockKgService, mockDbService);
        // Setup mock implementations
        mockSyncMonitor.getMetrics = jest.fn().mockReturnValue({
            totalOperations: 100,
            successfulOperations: 95,
            failedOperations: 5,
            averageDuration: 250,
            conflicts: { total: 3, resolved: 2 }
        });
        mockSyncMonitor.getPerformanceStats = jest.fn().mockReturnValue({
            averageDuration: 250,
            minDuration: 50,
            maxDuration: 1000,
            percentile95: 450
        });
        mockSyncCoordinator.synchronizeFileChanges = jest.fn().mockResolvedValue('sync-123');
        mockSyncCoordinator.getOperationStatus = jest.fn().mockReturnValue({
            id: 'sync-123',
            status: 'completed',
            progress: 100
        });
        mockRollback.listRollbackPoints = jest.fn().mockReturnValue([
            { id: 'rp-1', name: 'before-refactor', timestamp: new Date(), description: 'Before major refactoring' },
            { id: 'rp-2', name: 'stable-v1', timestamp: new Date(), description: 'Stable version 1.0' }
        ]);
        mockRollback.createRollbackPoint = jest.fn().mockResolvedValue('rp-3');
        mockRollback.rollbackToPoint = jest.fn().mockResolvedValue({ success: true });
        // Create a mock caller for the admin router
        const ctx = {
            syncMonitor: mockSyncMonitor,
            syncCoordinator: mockSyncCoordinator,
            rollback: mockRollback,
            dbService: mockDbService,
            kgService: mockKgService
        };
        // Create a callable test client
        caller = adminRouter.createCaller(ctx);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('getLogs', () => {
        it('should return recent log entries', async () => {
            // Mock fs.readFile to return log content
            jest.spyOn(fs, 'readFile').mockResolvedValue('2024-01-01 10:00:00 INFO: Application started\n' +
                '2024-01-01 10:00:01 DEBUG: Database connected\n' +
                '2024-01-01 10:00:02 ERROR: Failed to load config\n');
            const result = await caller.getLogs({ limit: 10 });
            expect(result).toBeDefined();
            expect(result.logs).toBeInstanceOf(Array);
            expect(result.logs.length).toBeGreaterThan(0);
            expect(result.logs[0]).toHaveProperty('timestamp');
            expect(result.logs[0]).toHaveProperty('level');
            expect(result.logs[0]).toHaveProperty('message');
        });
        it('should filter logs by level', async () => {
            jest.spyOn(fs, 'readFile').mockResolvedValue('2024-01-01 10:00:00 INFO: Info message\n' +
                '2024-01-01 10:00:01 ERROR: Error message\n' +
                '2024-01-01 10:00:02 DEBUG: Debug message\n');
            const result = await caller.getLogs({ level: 'error', limit: 10 });
            expect(result.logs).toBeDefined();
            expect(result.logs.every((log) => log.level === 'ERROR')).toBe(true);
        });
        it('should handle missing log file gracefully', async () => {
            jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT: no such file'));
            const result = await caller.getLogs({ limit: 10 });
            expect(result).toBeDefined();
            expect(result.logs).toEqual([]);
            expect(result.error).toContain('Log file not found');
        });
    });
    describe('getMetrics', () => {
        it('should return system metrics', async () => {
            const result = await caller.getMetrics();
            expect(result).toBeDefined();
            expect(result.synchronization).toBeDefined();
            expect(result.synchronization.totalOperations).toBe(100);
            expect(result.synchronization.successfulOperations).toBe(95);
            expect(result.synchronization.failedOperations).toBe(5);
            expect(result.performance).toBeDefined();
            expect(result.performance.averageDuration).toBe(250);
        });
        it('should include system resource metrics', async () => {
            const result = await caller.getMetrics();
            expect(result.system).toBeDefined();
            expect(result.system).toHaveProperty('memory');
            expect(result.system).toHaveProperty('cpu');
            expect(result.system).toHaveProperty('uptime');
            expect(result.system.memory).toHaveProperty('used');
            expect(result.system.memory).toHaveProperty('total');
        });
    });
    describe('syncFilesystem', () => {
        it('should trigger filesystem synchronization', async () => {
            const result = await caller.syncFilesystem({
                paths: ['/src', '/tests'],
                force: false
            });
            expect(result).toBeDefined();
            expect(result.operationId).toBe('sync-123');
            expect(result.status).toBe('completed');
            expect(mockSyncCoordinator.synchronizeFileChanges).toHaveBeenCalled();
        });
        it('should handle sync with force option', async () => {
            const result = await caller.syncFilesystem({
                paths: ['/src'],
                force: true
            });
            expect(result.operationId).toBeDefined();
            expect(mockSyncCoordinator.synchronizeFileChanges).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ force: true })
            ]));
        });
        it('should handle synchronization errors', async () => {
            mockSyncCoordinator.synchronizeFileChanges.mockRejectedValue(new Error('Sync failed: Network error'));
            await expect(caller.syncFilesystem({ paths: ['/src'] }))
                .rejects.toThrow('Sync failed');
        });
    });
    describe('clearCache', () => {
        it('should clear specified cache types', async () => {
            const result = await caller.clearCache({
                types: ['ast', 'embeddings']
            });
            expect(result).toBeDefined();
            expect(result.cleared).toContain('ast');
            expect(result.cleared).toContain('embeddings');
            expect(result.success).toBe(true);
        });
        it('should clear all caches when no types specified', async () => {
            const result = await caller.clearCache({});
            expect(result.cleared).toContain('ast');
            expect(result.cleared).toContain('embeddings');
            expect(result.cleared).toContain('queries');
            expect(result.cleared).toContain('documents');
            expect(result.success).toBe(true);
        });
        it('should report cache sizes cleared', async () => {
            const result = await caller.clearCache({
                types: ['queries']
            });
            expect(result.freedSpace).toBeDefined();
            expect(typeof result.freedSpace).toBe('number');
            expect(result.freedSpace).toBeGreaterThanOrEqual(0);
        });
    });
    describe('getConfig', () => {
        it('should return current configuration', async () => {
            const result = await caller.getConfig();
            expect(result).toBeDefined();
            expect(result.database).toBeDefined();
            expect(result.synchronization).toBeDefined();
            expect(result.rollback).toBeDefined();
            expect(result.monitoring).toBeDefined();
        });
        it('should include environment-specific settings', async () => {
            process.env.NODE_ENV = 'production';
            const result = await caller.getConfig();
            expect(result.environment).toBe('production');
            expect(result.debug).toBe(false);
            process.env.NODE_ENV = 'test';
        });
        it('should mask sensitive configuration values', async () => {
            const result = await caller.getConfig();
            // Database passwords should be masked
            if (result.database?.postgresql?.password) {
                expect(result.database.postgresql.password).toBe('***');
            }
            if (result.database?.falkordb?.password) {
                expect(result.database.falkordb.password).toBe('***');
            }
        });
    });
    describe('updateConfig', () => {
        it('should update configuration settings', async () => {
            const updates = {
                monitoring: { interval: 30000 },
                synchronization: { batchSize: 50 }
            };
            const result = await caller.updateConfig({ updates });
            expect(result).toBeDefined();
            expect(result.updated).toContain('monitoring.interval');
            expect(result.updated).toContain('synchronization.batchSize');
            expect(result.success).toBe(true);
        });
        it('should validate configuration updates', async () => {
            const invalidUpdates = {
                monitoring: { interval: -1000 } // Invalid negative interval
            };
            await expect(caller.updateConfig({ updates: invalidUpdates }))
                .rejects.toThrow('Invalid configuration');
        });
        it('should restart affected services after config update', async () => {
            const updates = {
                database: { poolSize: 20 }
            };
            const result = await caller.updateConfig({
                updates,
                restartServices: true
            });
            expect(result.restartedServices).toBeDefined();
            expect(result.restartedServices).toContain('database');
        });
    });
    describe('getRollbackPoints', () => {
        it('should list available rollback points', async () => {
            const result = await caller.getRollbackPoints();
            expect(result).toBeDefined();
            expect(result.points).toBeInstanceOf(Array);
            expect(result.points.length).toBe(2);
            expect(result.points[0]).toHaveProperty('id');
            expect(result.points[0]).toHaveProperty('name');
            expect(result.points[0]).toHaveProperty('timestamp');
            expect(result.points[0]).toHaveProperty('description');
        });
        it('should sort rollback points by timestamp', async () => {
            const result = await caller.getRollbackPoints();
            const timestamps = result.points.map((p) => p.timestamp);
            const sorted = [...timestamps].sort((a, b) => b - a);
            expect(timestamps).toEqual(sorted);
        });
    });
    describe('createRollbackPoint', () => {
        it('should create a new rollback point', async () => {
            const result = await caller.createRollbackPoint({
                name: 'before-deploy',
                description: 'Before production deployment'
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('rp-3');
            expect(result.success).toBe(true);
            expect(mockRollback.createRollbackPoint).toHaveBeenCalledWith('before-deploy', 'Before production deployment');
        });
        it('should validate rollback point name', async () => {
            await expect(caller.createRollbackPoint({
                name: '',
                description: 'Invalid empty name'
            })).rejects.toThrow('Name is required');
        });
    });
    describe('performRollback', () => {
        it('should rollback to specified point', async () => {
            const result = await caller.performRollback({
                pointId: 'rp-1'
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(mockRollback.rollbackToPoint).toHaveBeenCalledWith('rp-1');
        });
        it('should handle rollback failures', async () => {
            mockRollback.rollbackToPoint.mockRejectedValue(new Error('Rollback failed: State mismatch'));
            await expect(caller.performRollback({ pointId: 'rp-invalid' }))
                .rejects.toThrow('Rollback failed');
        });
        it('should confirm before destructive rollback', async () => {
            const result = await caller.performRollback({
                pointId: 'rp-1',
                confirm: true
            });
            expect(result.success).toBe(true);
            expect(result.warning).toBeUndefined();
        });
    });
});
//# sourceMappingURL=trpc-admin.test.js.map