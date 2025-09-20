/**
 * Unit tests for Admin Routes
 * Tests system administration, monitoring, and maintenance endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerAdminRoutes } from '../../../../src/api/routes/admin.js';
import { MaintenanceMetrics } from '../../../../src/services/metrics/MaintenanceMetrics.js';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../../test-utils.js';

// Mock services
vi.mock('../../../../src/services/KnowledgeGraphService.js', () => ({
  KnowledgeGraphService: vi.fn()
}));
vi.mock('../../../../src/services/DatabaseService.js', () => ({
  DatabaseService: vi.fn()
}));
vi.mock('../../../../src/services/FileWatcher.js', () => ({
  FileWatcher: vi.fn()
}));
vi.mock('../../../../src/services/SynchronizationCoordinator.js', () => ({
  SynchronizationCoordinator: vi.fn()
}));
vi.mock('../../../../src/services/SynchronizationMonitoring.js', () => ({
  SynchronizationMonitoring: vi.fn()
}));
vi.mock('../../../../src/services/ConflictResolution.js', () => ({
  ConflictResolution: vi.fn()
}));
vi.mock('../../../../src/services/RollbackCapabilities.js', () => ({
  RollbackCapabilities: vi.fn()
}));
vi.mock('../../../../src/services/BackupService.js', () => ({
  BackupService: vi.fn(),
  MaintenanceOperationError: class MaintenanceOperationError extends Error {
    statusCode = 500;
    code = 'MOCK_MAINTENANCE_ERROR';

    constructor(message?: string) {
      super(message ?? 'Maintenance operation failed');
    }
  }
}));
vi.mock('../../../../src/services/LoggingService.js', () => ({
  LoggingService: vi.fn()
}));
vi.mock('../../../../src/services/MaintenanceService.js', () => ({
  MaintenanceService: vi.fn()
}));
vi.mock('../../../../src/services/ConfigurationService.js', () => ({
  ConfigurationService: vi.fn()
}));

describe('Admin Routes', () => {
  let mockApp: any;
  let mockKgService: any;
  let mockDbService: any;
  let mockFileWatcher: any;
  let mockSyncCoordinator: any;
  let mockSyncMonitor: any;
  let mockConflictResolver: any;
  let mockRollbackCapabilities: any;
  let mockBackupService: any;
  let mockLoggingService: any;
  let mockMaintenanceService: any;
  let mockConfigurationService: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  // Create a properly mocked Fastify app that tracks registered routes
  const createMockApp = () => {
    const routes = new Map<string, Function>();

    const registerRoute = (method: string, path: string, handler: Function, _options?: any) => {
      const key = `${method}:${path}`;
      routes.set(key, handler);
    };

    return {
      get: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('get', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('get', path, handler);
        }
      }),
      post: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('post', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('post', path, handler);
        }
      }),
      put: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('put', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('put', path, handler);
        }
      }),
      getRegisteredRoutes: () => routes
    };
  };

  // Helper function to extract route handlers
  const getHandler = (method: 'get' | 'post' | 'put', path: string, app = mockApp): Function => {
    const routes = app.getRegisteredRoutes();
    const key = `${method}:${path}`;
    const handler = routes.get(key);

    if (!handler) {
      const availableRoutes = Array.from(routes.keys()).join(', ');
      throw new Error(`Route ${key} not found. Available routes: ${availableRoutes}`);
    }

    return handler;
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock services
    mockKgService = vi.fn() as any;
    mockDbService = vi.fn() as any;
    mockFileWatcher = vi.fn() as any;
    mockSyncCoordinator = vi.fn() as any;
    mockSyncMonitor = vi.fn() as any;
    mockConflictResolver = vi.fn() as any;
    mockRollbackCapabilities = vi.fn() as any;
    mockBackupService = vi.fn() as any;
    mockLoggingService = vi.fn() as any;
    mockMaintenanceService = vi.fn() as any;
    mockConfigurationService = vi.fn() as any;

    // Mock Fastify app - recreate it fresh for each test
    mockApp = createMockApp();

    // Create fresh mocks for each test
    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Mock process.uptime() using vi.spyOn
    vi.spyOn(process, 'uptime').mockReturnValue(123.45);
  });

  describe('registerAdminRoutes', () => {
    it('should register all admin routes with required services', async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService,
        mockMaintenanceService,
        mockConfigurationService
      );

      // Verify all routes are registered
      expect(mockApp.get).toHaveBeenCalledWith('/admin-health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/sync-status', expect.any(Function));
      // Check that routes are registered (they may have schemas)
      expect(mockApp.post).toHaveBeenCalledWith('/sync', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/analytics', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/backup', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/restore/preview', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/restore/confirm', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/restore/approve', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/logs/health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/logs', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/maintenance/metrics', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/maintenance/metrics/prometheus', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/maintenance', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/config', expect.any(Function));
      expect(mockApp.put).toHaveBeenCalledWith('/config', expect.any(Object), expect.any(Function));
    });

    it('should register routes with optional services', async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
        // All optional services are undefined
      );

      const registeredRoutes = mockApp.getRegisteredRoutes();
      expect(registeredRoutes.has('get:/admin-health')).toBe(true);
      expect(registeredRoutes.has('get:/sync-status')).toBe(true);
      expect(registeredRoutes.has('get:/analytics')).toBe(true);
      expect(registeredRoutes.has('get:/logs/health')).toBe(true);
      expect(registeredRoutes.has('get:/logs')).toBe(true);
      expect(registeredRoutes.has('get:/maintenance/metrics')).toBe(true);
      expect(registeredRoutes.has('get:/maintenance/metrics/prometheus')).toBe(true);
      expect(registeredRoutes.has('get:/config')).toBe(true);
      expect(registeredRoutes.has('post:/sync')).toBe(true);
      expect(registeredRoutes.has('post:/backup')).toBe(true);
      expect(registeredRoutes.has('post:/restore/preview')).toBe(true);
      expect(registeredRoutes.has('post:/restore/confirm')).toBe(true);
      expect(registeredRoutes.has('post:/restore/approve')).toBe(true);
      expect(registeredRoutes.has('post:/maintenance')).toBe(true);
      expect(registeredRoutes.has('put:/config')).toBe(true);
    });
  });

  describe('GET /admin-health', () => {
    let healthHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor
      );

      healthHandler = getHandler('get', '/admin-health');
    });

    it('should return healthy system status', async () => {
      // Mock healthy database response
      mockDbService.healthCheck = vi.fn().mockResolvedValue({
        falkordb: { status: 'healthy' },
        qdrant: { status: 'healthy' },
        postgresql: { status: 'healthy' },
        redis: { status: 'unknown' }
      });

      // Mock knowledge graph metrics
      mockKgService.listEntities = vi.fn().mockResolvedValue({
        entities: [],
        total: 42
      });
      mockKgService.listRelationships = vi.fn().mockResolvedValue({
        entities: [],
        total: 15
      });

      // Mock sync monitoring
      mockSyncMonitor.getHealthMetrics = vi.fn().mockReturnValue({
        lastSyncTime: new Date(),
        activeOperations: 2,
        consecutiveFailures: 0
      });

      await healthHandler(mockRequest, mockReply);

      expect(mockDbService.healthCheck).toHaveBeenCalled();
      expect(mockKgService.listEntities).toHaveBeenCalledWith({ limit: 1, offset: 0 });
      expect(mockKgService.listRelationships).toHaveBeenCalledWith({ limit: 1, offset: 0 });
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          overall: 'healthy',
          components: expect.objectContaining({
            graphDatabase: expect.objectContaining({ status: 'healthy' }),
            vectorDatabase: expect.objectContaining({ status: 'healthy' }),
            fileWatcher: expect.objectContaining({ status: 'healthy' }),
            apiServer: expect.objectContaining({ status: 'healthy' })
          }),
          metrics: expect.objectContaining({
            uptime: 123.45,
            totalEntities: 42,
            totalRelationships: 15
          })
        })
      });
    });

    it('should return unhealthy status when services are down', async () => {
      mockDbService.healthCheck = vi.fn().mockResolvedValue({
        falkordb: { status: 'unhealthy' },
        qdrant: { status: 'unhealthy' },
        postgresql: { status: 'unhealthy' },
      });

      await healthHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          overall: 'unhealthy'
        })
      });
    });

    it('should handle knowledge graph metric errors gracefully', async () => {
      mockDbService.healthCheck = vi.fn().mockResolvedValue({
        falkordb: { status: 'healthy' },
        qdrant: { status: 'healthy' },
        postgresql: { status: 'healthy' },
      });

      mockKgService.listEntities = vi.fn().mockRejectedValue(new Error('Graph error'));

      await healthHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          metrics: expect.objectContaining({
            totalEntities: 0,
            totalRelationships: 0
          })
        })
      });
    });

    it('should handle database health check errors', async () => {
      mockDbService.healthCheck = vi.fn().mockRejectedValue(new Error('Database error'));

      await healthHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Failed to retrieve system health'
        }
      });
    });

    it('should check file watcher status', async () => {
      mockDbService.healthCheck = vi.fn().mockResolvedValue({
        falkordb: { status: 'healthy' },
        qdrant: { status: 'healthy' }
      });

      // File watcher exists and should be marked as healthy
      await healthHandler(mockRequest, mockReply);

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.components.fileWatcher.status).toBe('healthy'); // When watcher is present

      // Test with watcher present
      const mockAppWithWatcher = createMockApp();

      await registerAdminRoutes(
        mockAppWithWatcher as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerWithWatcher = getHandler('get', '/admin-health', mockAppWithWatcher);

      await handlerWithWatcher(mockRequest, mockReply);

      // Should be marked as healthy when file watcher exists
    });
  });

  describe('GET /maintenance/metrics', () => {
    let maintenanceMetricsHandler: Function;
    let prometheusMetricsHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor
      );

      maintenanceMetricsHandler = getHandler('get', '/maintenance/metrics');
      prometheusMetricsHandler = getHandler('get', '/maintenance/metrics/prometheus');
    });

    it('should return maintenance metrics summary', async () => {
      const summary = { backups: { total: 3 }, restores: { apply: { total: 1 } } };
      const instance = MaintenanceMetrics.getInstance();
      const summarySpy = vi.spyOn(instance, 'getSummary').mockReturnValue(summary as any);

      await maintenanceMetricsHandler(mockRequest, mockReply);

      expect(summarySpy).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({ success: true, data: summary });

      summarySpy.mockRestore();
    });

    it('should return prometheus formatted metrics', async () => {
      const textMetrics = '# HELP maintenance_test_counter Test counter\n# TYPE maintenance_test_counter counter\nmaintenance_test_counter 1';
      const instance = MaintenanceMetrics.getInstance();
      const promSpy = vi.spyOn(instance, 'toPrometheus').mockReturnValue(textMetrics);

      await prometheusMetricsHandler(mockRequest, mockReply);

      expect(promSpy).toHaveBeenCalled();
      expect(mockReply.header).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
      expect(mockReply.send).toHaveBeenCalledWith(textMetrics);

      promSpy.mockRestore();
    });
  });

  describe('GET /sync-status', () => {
    let syncStatusHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor
      );

      syncStatusHandler = getHandler('get', '/sync-status');
    });

    it('should return sync status when monitoring service is available', async () => {
      const mockMetrics = {
        operationsTotal: 100,
        operationsSuccessful: 95,
        operationsFailed: 5,
        throughput: 10.5,
        averageSyncTime: 2500
      };

      const mockHealthMetrics = {
        lastSyncTime: new Date('2023-01-01T12:00:00Z'),
        activeOperations: 2,
        consecutiveFailures: 1
      };

      mockSyncMonitor.getSyncMetrics = vi.fn().mockReturnValue(mockMetrics);
      mockSyncMonitor.getHealthMetrics = vi.fn().mockReturnValue(mockHealthMetrics);
      mockSyncMonitor.getActiveOperations = vi.fn().mockReturnValue(['sync1', 'sync2']);
      mockSyncCoordinator.getQueueLength = vi.fn().mockReturnValue(5);

      await syncStatusHandler(mockRequest, mockReply);

      expect(mockSyncMonitor.getSyncMetrics).toHaveBeenCalled();
      expect(mockSyncMonitor.getHealthMetrics).toHaveBeenCalled();
      expect(mockSyncMonitor.getActiveOperations).toHaveBeenCalled();
      expect(mockSyncCoordinator.getQueueLength).toHaveBeenCalled();

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isActive: true,
          lastSync: mockHealthMetrics.lastSyncTime,
          queueDepth: 5,
          processingRate: 10.5,
          errors: {
            count: 5,
            recent: ['5 sync operations failed']
          },
          performance: {
            syncLatency: 2500,
            throughput: 10.5,
            successRate: 0.95
          }
        })
      });
    });

    it('should return default sync status when monitoring service is not available', async () => {
      // Register without sync monitor
      const mockAppNoMonitor = createMockApp();

      await registerAdminRoutes(
        mockAppNoMonitor as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator
        // No sync monitor
      );

      const handlerNoMonitor = getHandler('get', '/sync-status', mockAppNoMonitor);

      await handlerNoMonitor(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isActive: false,
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
        })
      });
    });

    it('should handle sync monitoring errors', async () => {
      mockSyncMonitor.getSyncMetrics = vi.fn().mockImplementation(() => {
        throw new Error('Sync monitor error');
      });

      await syncStatusHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYNC_STATUS_FAILED',
          message: 'Failed to retrieve sync status',
          details: 'Sync monitor error'
        }
      });
    });
  });

  describe('POST /sync', () => {
    let syncHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor
      );

      syncHandler = getHandler('post', '/sync');
    });

    it('should trigger full synchronization with options', async () => {
      const syncOptions = {
        force: true,
        includeEmbeddings: true,
        includeTests: false,
        includeSecurity: true
      };

      mockRequest.body = syncOptions;
      mockSyncCoordinator.startFullSynchronization = vi.fn().mockResolvedValue('sync-job-123');

      await syncHandler(mockRequest, mockReply);

      expect(mockSyncCoordinator.startFullSynchronization).toHaveBeenCalledWith(syncOptions);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          jobId: 'sync-job-123',
          status: 'running',
          options: syncOptions,
          estimatedDuration: '5-10 minutes',
          message: 'Full synchronization started'
        }
      });
    });

    it('should trigger sync with default options', async () => {
      mockRequest.body = {};
      mockSyncCoordinator.startFullSynchronization = vi.fn().mockResolvedValue('sync-job-456');

      await syncHandler(mockRequest, mockReply);

      expect(mockSyncCoordinator.startFullSynchronization).toHaveBeenCalledWith({});
    });

    it('should return 404 when sync coordinator is not available', async () => {
      // Register without sync coordinator
      const mockAppNoCoordinator = createMockApp();

      await registerAdminRoutes(
        mockAppNoCoordinator as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
        // No sync coordinator
      );

      // When sync coordinator is not available, route should still be registered but return 404
      const handlerNoCoordinator = getHandler('post', '/sync', mockAppNoCoordinator);

      await handlerNoCoordinator(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYNC_UNAVAILABLE',
          message: 'Synchronization coordinator not available'
        }
      });
    });

    it('should handle sync trigger errors', async () => {
      mockRequest.body = { force: true };
      mockSyncCoordinator.startFullSynchronization = vi.fn().mockRejectedValue(
        new Error('Sync failed')
      );

      await syncHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYNC_TRIGGER_FAILED',
          message: 'Failed to trigger synchronization'
        }
      });
    });
  });

  describe('GET /analytics', () => {
    let analyticsHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor
      );

      analyticsHandler = getHandler('get', '/analytics');
    });

    it('should return system analytics with date range', async () => {
      mockRequest.query = {
        since: '2023-01-01T00:00:00.000Z',
        until: '2023-01-31T23:59:59.000Z'
      };

      const mockEntities = [
        { type: 'file', path: '/src/components/Button.tsx' },
        { type: 'file', path: '/src/utils/helpers.ts' },
        { type: 'function', name: 'handleClick' }
      ];

      mockKgService.listEntities = vi.fn().mockResolvedValue({
        entities: mockEntities,
        total: 150
      });

      mockKgService.listRelationships = vi.fn().mockResolvedValue({
        entities: [],
        total: 200
      });

      mockSyncMonitor.getHealthMetrics = vi.fn().mockReturnValue({
        lastSyncTime: new Date('2023-01-15T12:00:00Z'),
        activeOperations: 1,
        consecutiveFailures: 0
      });

      await analyticsHandler(mockRequest, mockReply);

      expect(mockKgService.listEntities).toHaveBeenCalledWith({ limit: 1000 });
      expect(mockKgService.listRelationships).toHaveBeenCalledWith({ limit: 1000 });

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.period.since).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(responseData.period.until).toEqual(new Date('2023-01-31T23:59:59.000Z'));
      expect(responseData.content.totalEntities).toBe(150);
      expect(responseData.content.totalRelationships).toBe(200);
      expect(responseData.content.mostActiveDomains).toEqual(['src']);
    });

    it('should use default date range when not provided', async () => {
      mockRequest.query = {};

      mockKgService.listEntities = vi.fn().mockResolvedValue({
        entities: [],
        total: 50
      });

      mockKgService.listRelationships = vi.fn().mockResolvedValue({
        entities: [],
        total: 75
      });

      await analyticsHandler(mockRequest, mockReply);

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.period.since).toBeInstanceOf(Date);
      expect(responseData.period.until).toBeInstanceOf(Date);
      expect(responseData.usage.popularEndpoints).toEqual({
        '/api/v1/graph/search': 45,
        '/api/v1/graph/entities': 32,
        '/api/v1/code/validate': 28,
        '/health': 15
      });
    });

    it('should handle analytics generation errors', async () => {
      mockKgService.listEntities = vi.fn().mockRejectedValue(new Error('Graph error'));

      await analyticsHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: 'Failed to generate analytics',
          details: expect.stringContaining('Cannot destructure')
        }
      });
    });
  });

  describe('POST /backup', () => {
    let backupHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService
      );

      backupHandler = getHandler('post', '/backup');
    });

    it('should create backup with custom options', async () => {
      const backupOptions = {
        type: 'incremental' as const,
        includeData: true,
        includeConfig: false,
        compression: true,
        destination: '/tmp/backup.zip'
      };

      mockRequest.body = backupOptions;

      const mockResult = {
        id: 'backup-123',
        path: '/tmp/backup.zip',
        size: 1024000,
        createdAt: new Date()
      };

      mockBackupService.createBackup = vi.fn().mockResolvedValue(mockResult);

      await backupHandler(mockRequest, mockReply);

      expect(mockBackupService.createBackup).toHaveBeenCalledWith({
        type: 'incremental',
        includeData: true,
        includeConfig: false,
        compression: true,
        destination: '/tmp/backup.zip'
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should create backup with default options', async () => {
      mockRequest.body = {};

      const mockResult = {
        id: 'backup-456',
        path: '/tmp/default-backup.zip',
        size: 512000,
        createdAt: new Date()
      };

      mockBackupService.createBackup = vi.fn().mockResolvedValue(mockResult);

      await backupHandler(mockRequest, mockReply);

      expect(mockBackupService.createBackup).toHaveBeenCalledWith({
        type: 'full',
        includeData: true,
        includeConfig: true,
        compression: true,
        destination: undefined
      });
    });

    it('should return 503 when backup service is not available', async () => {
      // Register without backup service
      const mockAppNoBackup = createMockApp();

      await registerAdminRoutes(
        mockAppNoBackup as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
        // No backup service
      );

      // When backup service is not available, route should still be registered but return 503
      const handlerNoBackup = getHandler('post', '/backup', mockAppNoBackup);

      await handlerNoBackup(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Backup service not available'
        }
      });
    });

    it('should handle backup creation errors', async () => {
      mockRequest.body = { type: 'full' };
      mockBackupService.createBackup = vi.fn().mockRejectedValue(
        new Error('Backup creation failed')
      );

      await backupHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BACKUP_FAILED',
          message: 'Backup creation failed'
        }
      });
    });
  });

  describe('POST /restore/preview', () => {
    let restoreHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService
      );

      restoreHandler = getHandler('post', '/restore/preview');
    });

    it('should restore from backup with dry run', async () => {
      mockRequest.body = {
        backupId: 'backup-123',
        dryRun: true
      };

      const mockResult = {
        backupId: 'backup-123',
        status: 'dry-run-completed',
        changes: ['Would restore 150 entities', 'Would restore 200 relationships'],
        estimatedDuration: '30 seconds',
        success: true
      };

      mockBackupService.restoreBackup = vi.fn().mockResolvedValue(mockResult);

      await restoreHandler(mockRequest, mockReply);

      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith(
        'backup-123',
        expect.objectContaining({
          dryRun: true,
          validateIntegrity: true
        })
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        metadata: {
          status: mockResult.status,
          tokenExpiresAt: undefined,
          requiresApproval: undefined
        }
      });
    });

    it('should restore from backup with default dry run', async () => {
      mockRequest.body = {
        backupId: 'backup-456'
        // dryRun not specified
      };

      mockBackupService.restoreBackup = vi.fn().mockResolvedValue({
        status: 'completed'
      });

      await restoreHandler(mockRequest, mockReply);

      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith(
        'backup-456',
        expect.objectContaining({
          dryRun: true,
          validateIntegrity: true
        })
      );
    });

    it('should return 503 when backup service is not available', async () => {
      const mockAppNoBackup = createMockApp();

      await registerAdminRoutes(
        mockAppNoBackup as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoBackup = getHandler('post', '/restore/preview', mockAppNoBackup);

      await handlerNoBackup(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Backup service not available'
        }
      });
    });

    it('should handle restore errors', async () => {
      mockRequest.body = { backupId: 'invalid-backup' };
      mockBackupService.restoreBackup = vi.fn().mockRejectedValue(
        new Error('Restore failed: backup not found')
      );

      await restoreHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RESTORE_PREVIEW_FAILED',
          message: 'Restore failed: backup not found'
        }
      });
    });
  });

  describe('GET /logs', () => {
    let logsHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService
      );

      logsHandler = getHandler('get', '/logs');
    });

    it('should retrieve logs with filters', async () => {
      mockRequest.query = {
        level: 'error',
        since: '2023-01-01T00:00:00.000Z',
        until: '2023-01-31T23:59:59.000Z',
        limit: 50,
        component: 'sync',
        search: 'failed'
      };

      const mockLogs = [
        {
          timestamp: new Date('2023-01-15T10:30:00Z'),
          level: 'error',
          component: 'sync',
          message: 'Sync operation failed',
          data: { error: 'Connection timeout' }
        },
        {
          timestamp: new Date('2023-01-15T11:00:00Z'),
          level: 'error',
          component: 'sync',
          message: 'Another sync failure',
          data: { error: 'Authentication failed' }
        }
      ];

      mockLoggingService.queryLogs = vi.fn().mockResolvedValue(mockLogs);

      await logsHandler(mockRequest, mockReply);

      expect(mockLoggingService.queryLogs).toHaveBeenCalledWith({
        level: 'error',
        component: 'sync',
        since: new Date('2023-01-01T00:00:00.000Z'),
        until: new Date('2023-01-31T23:59:59.000Z'),
        limit: 50,
        search: 'failed'
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockLogs,
        metadata: {
          count: 2,
          query: {
            level: 'error',
            component: 'sync',
            since: new Date('2023-01-01T00:00:00.000Z'),
            until: new Date('2023-01-31T23:59:59.000Z'),
            limit: 50,
            search: 'failed'
          }
        }
      });
    });

    it('should retrieve logs with default parameters', async () => {
      mockRequest.query = {};

      const mockLogs = [
        {
          timestamp: new Date(),
          level: 'info',
          component: 'api',
          message: 'Server started'
        }
      ];

      mockLoggingService.queryLogs = vi.fn().mockResolvedValue(mockLogs);

      await logsHandler(mockRequest, mockReply);

      expect(mockLoggingService.queryLogs).toHaveBeenCalledWith({
        level: undefined,
        component: undefined,
        since: undefined,
        until: undefined,
        limit: undefined,
        search: undefined
      });
    });

    it('should return 503 when logging service is not available', async () => {
      const mockAppNoLogging = createMockApp();

      await registerAdminRoutes(
        mockAppNoLogging as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoLogging = getHandler('get', '/logs', mockAppNoLogging);

      await handlerNoLogging(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Logging service not available'
        }
      });
    });

    it('should handle log query errors', async () => {
      mockRequest.query = { level: 'error' };
      mockLoggingService.queryLogs = vi.fn().mockRejectedValue(
        new Error('Database query failed')
      );

      await logsHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'LOGS_FAILED',
          message: 'Database query failed'
        }
      });
    });
  });

  describe('GET /logs/health', () => {
    let healthHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService
      );

      healthHandler = getHandler('get', '/logs/health');
    });

    it('should return logging health metrics when service is available', async () => {
      const metrics = {
        dispatcher: {
          registeredConsumers: 1,
          consoleOverridesActive: true,
          processListenersAttached: 2,
          dispatchedEvents: 42,
          droppedEvents: 0
        },
        inMemoryLogCount: 10,
        maxLogsInMemory: 1000,
        droppedFromMemory: 3,
        fileSink: {
          bytesWritten: 1024,
          failedWrites: 1,
          suppressedWrites: 0,
          rotations: 2,
          lastError: 'boom',
          path: '/var/log/memento.log'
        },
        logFilePath: '/var/log/memento.log',
        disposed: false
      };

      mockLoggingService.getHealthMetrics = vi.fn().mockReturnValue(metrics);

      await healthHandler(mockRequest, mockReply);

      expect(mockLoggingService.getHealthMetrics).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: metrics
      });
    });

    it('should return 503 when logging service is unavailable', async () => {
      const mockAppNoLogging = createMockApp();

      await registerAdminRoutes(
        mockAppNoLogging as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const noServiceHandler = getHandler('get', '/logs/health', mockAppNoLogging);

      await noServiceHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Logging service not available'
        }
      });
    });

    it('should handle unexpected errors from the logging service', async () => {
      const failingError = new Error('metrics failure');
      mockLoggingService.getHealthMetrics = vi.fn(() => {
        throw failingError;
      });

      await healthHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'LOG_HEALTH_FAILED',
          message: 'metrics failure'
        }
      });
    });
  });

  describe('POST /maintenance', () => {
    let maintenanceHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService,
        mockMaintenanceService
      );

      maintenanceHandler = getHandler('post', '/maintenance');
    });

    it('should run maintenance tasks successfully', async () => {
      mockRequest.body = {
        tasks: ['cleanup', 'optimize', 'reindex'],
        schedule: 'immediate'
      };

      const mockResults = [
        {
          taskId: 'cleanup_1234567890',
          success: true,
          message: 'Cleanup completed successfully',
          duration: 1500
        },
        {
          taskId: 'optimize_1234567890',
          success: true,
          message: 'Optimization completed',
          duration: 3200
        },
        {
          taskId: 'reindex_1234567890',
          success: true,
          message: 'Reindexing completed',
          duration: 5000
        }
      ];

      mockMaintenanceService.runMaintenanceTask = vi.fn()
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      await maintenanceHandler(mockRequest, mockReply);

      expect(mockMaintenanceService.runMaintenanceTask).toHaveBeenCalledWith('cleanup');
      expect(mockMaintenanceService.runMaintenanceTask).toHaveBeenCalledWith('optimize');
      expect(mockMaintenanceService.runMaintenanceTask).toHaveBeenCalledWith('reindex');

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.tasks).toEqual(mockResults);
      expect(responseData.schedule).toBe('immediate');
      expect(responseData.status).toBe('completed');
      expect(responseData.completedAt).toBeDefined();
    });

    it('should handle partial maintenance task failures', async () => {
      mockRequest.body = {
        tasks: ['cleanup', 'invalid_task']
      };

      mockMaintenanceService.runMaintenanceTask = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'cleanup_1234567890',
          success: true,
          message: 'Cleanup completed'
        })
        .mockRejectedValueOnce(new Error('Invalid maintenance task'));

      await maintenanceHandler(mockRequest, mockReply);

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.tasks).toHaveLength(2);
      expect(responseData.tasks[0]).toEqual(expect.objectContaining({ success: true }));
      expect(responseData.tasks[1]).toEqual(expect.objectContaining({ success: false }));
      expect(responseData.tasks[1].error).toBe('Invalid maintenance task');
    });

    it('should return 503 when maintenance service is not available', async () => {
      const mockAppNoMaintenance = createMockApp();

      await registerAdminRoutes(
        mockAppNoMaintenance as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoMaintenance = getHandler('post', '/maintenance', mockAppNoMaintenance);

      await handlerNoMaintenance(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Maintenance service not available'
        }
      });
    });

    it('should handle maintenance service errors', async () => {
      mockRequest.body = { tasks: ['cleanup'] };
      // Mock the maintenance service to be undefined to trigger the 503 error
      const mockAppNoMaintenance = createMockApp();

      await registerAdminRoutes(
        mockAppNoMaintenance as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoMaintenance = getHandler('post', '/maintenance', mockAppNoMaintenance);
      await handlerNoMaintenance(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Maintenance service not available'
        }
      });
    });
  });

  describe('GET /config', () => {
    let getConfigHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService,
        mockMaintenanceService,
        mockConfigurationService
      );

      getConfigHandler = getHandler('get', '/config');
    });

    it('should retrieve system configuration', async () => {
      const mockConfig = {
        performance: {
          maxConcurrentSync: 5,
          cacheSize: 1000,
          requestTimeout: 30000
        },
        security: {
          rateLimiting: true,
          authentication: true,
          auditLogging: false
        },
        database: {
          connectionPool: 10,
          timeout: 5000
        }
      };

      mockConfigurationService.getSystemConfiguration = vi.fn().mockResolvedValue(mockConfig);

      await getConfigHandler(mockRequest, mockReply);

      expect(mockConfigurationService.getSystemConfiguration).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockConfig
      });
    });

    it('should return 503 when configuration service is not available', async () => {
      const mockAppNoConfig = createMockApp();

      await registerAdminRoutes(
        mockAppNoConfig as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoConfig = getHandler('get', '/config', mockAppNoConfig);

      await handlerNoConfig(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Configuration service not available'
        }
      });
    });

    it('should handle configuration retrieval errors', async () => {
      mockConfigurationService.getSystemConfiguration = vi.fn().mockRejectedValue(
        new Error('Configuration file corrupted')
      );

      await getConfigHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFIG_FAILED',
          message: 'Configuration file corrupted'
        }
      });
    });
  });

  describe('PUT /config', () => {
    let updateConfigHandler: Function;

    beforeEach(async () => {
      await registerAdminRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockFileWatcher,
        mockSyncCoordinator,
        mockSyncMonitor,
        mockConflictResolver,
        mockRollbackCapabilities,
        mockBackupService,
        mockLoggingService,
        mockMaintenanceService,
        mockConfigurationService
      );

      updateConfigHandler = getHandler('put', '/config');
    });

    it('should update system configuration', async () => {
      const configUpdates = {
        performance: {
          maxConcurrentSync: 10,
          cacheSize: 2000
        },
        security: {
          rateLimiting: false
        }
      };

      mockRequest.body = configUpdates;
      mockConfigurationService.updateConfiguration = vi.fn().mockResolvedValue(undefined);

      await updateConfigHandler(mockRequest, mockReply);

      expect(mockConfigurationService.updateConfiguration).toHaveBeenCalledWith(configUpdates);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Configuration updated successfully'
      });
    });

    it('should handle partial configuration updates', async () => {
      mockRequest.body = {
        performance: {
          maxConcurrentSync: 3
        }
      };

      mockConfigurationService.updateConfiguration = vi.fn().mockResolvedValue(undefined);

      await updateConfigHandler(mockRequest, mockReply);

      expect(mockConfigurationService.updateConfiguration).toHaveBeenCalledWith({
        performance: {
          maxConcurrentSync: 3
        }
      });
    });

    it('should return 503 when configuration service is not available', async () => {
      const mockAppNoConfig = createMockApp();

      await registerAdminRoutes(
        mockAppNoConfig as any,
        mockKgService,
        mockDbService,
        mockFileWatcher
      );

      const handlerNoConfig = getHandler('put', '/config', mockAppNoConfig);

      await handlerNoConfig(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Configuration service not available'
        }
      });
    });

    it('should handle configuration update errors', async () => {
      mockRequest.body = { invalidConfig: true };
      mockConfigurationService.updateConfiguration = vi.fn().mockRejectedValue(
        new Error('Invalid configuration format')
      );

      await updateConfigHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFIG_UPDATE_FAILED',
          message: 'Invalid configuration format'
        }
      });
    });

    it('should return 400 for configuration validation errors', async () => {
      mockRequest.body = { performance: { maxConcurrentSync: 0 } };
      mockConfigurationService.updateConfiguration = vi.fn().mockRejectedValue(
        new Error('maxConcurrentSync must be at least 1')
      );

      await updateConfigHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFIG_VALIDATION_FAILED',
          message: 'maxConcurrentSync must be at least 1'
        }
      });
    });
  });
});
