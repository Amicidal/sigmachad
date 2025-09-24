/**
 * Unit tests for TRPC Admin Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { adminRouter } from '../src/routes/trpc-admin.js';
import { createTestContext } from '../src/trpc/base.js';

describe('TRPC Admin Router', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createTestContext({
      kgService: {
        getHistoryMetrics: vi.fn(),
        ensureGraphIndexes: vi.fn(),
        getIndexHealth: vi.fn(),
        runBenchmarks: vi.fn(),
      },
      dbService: {
        getConfig: vi.fn(),
      },
      authContext: {
        scopes: ['admin'],
        tokenType: 'jwt',
        user: { userId: 'admin', role: 'admin', scopes: ['admin'] },
      },
    });
  });

  describe('getLogs procedure', () => {
    it('should return filtered logs', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.getLogs({
        level: 'error',
        component: 'api',
        limit: 10,
      });

      expect(result).toMatchObject({
        logs: expect.any(Array),
        total: expect.any(Number),
        filters: {
          level: 'error',
          component: 'api',
        },
        timestamp: expect.any(String),
      });

      expect(result.logs).toHaveLength(10);
      result.logs.forEach(log => {
        expect(log).toMatchObject({
          id: expect.any(String),
          timestamp: expect.any(String),
          level: 'error',
          component: 'api',
          message: expect.any(String),
          metadata: expect.any(Object),
        });
      });
    });

    it('should handle since date filter', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const result = await caller.getLogs({
        since,
        limit: 5,
      });

      expect(result.logs).toHaveLength(5);
      expect(result.filters.since).toBe(since);
    });

    it('should limit results correctly', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.getLogs({ limit: 3 });

      expect(result.logs).toHaveLength(3);
    });
  });

  describe('getMetrics procedure', () => {
    it('should return system metrics', async () => {
      const mockHistoryMetrics = {
        totals: { entities: 1000, relationships: 2000 },
        versions: 50,
        checkpoints: 10,
        checkpointMembers: 500,
        temporalEdges: 300,
        lastPrune: new Date().toISOString(),
      };

      mockContext.kgService.getHistoryMetrics.mockResolvedValue(mockHistoryMetrics);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.getMetrics();

      expect(result).toMatchObject({
        graph: mockHistoryMetrics.totals,
        history: {
          versions: 50,
          checkpoints: 10,
          checkpointMembers: 500,
          temporalEdges: 300,
          lastPrune: expect.any(String),
        },
        process: {
          uptime: expect.any(Number),
          memory: expect.any(Object),
        },
        timestamp: expect.any(String),
      });

      expect(mockContext.kgService.getHistoryMetrics).toHaveBeenCalled();
    });
  });

  describe('syncFilesystem procedure', () => {
    it('should sync filesystem successfully', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.syncFilesystem({
        paths: ['/test/path'],
        force: true,
      });

      expect(result).toMatchObject({
        success: true,
        summary: {
          totalPaths: 1,
          successfulPaths: 1,
          totalFilesProcessed: expect.any(Number),
          totalEntitiesCreated: expect.any(Number),
          totalEntitiesUpdated: expect.any(Number),
          totalRelationshipsCreated: expect.any(Number),
          totalErrors: 0,
          totalDuration: expect.any(Number),
        },
        results: expect.arrayContaining([
          expect.objectContaining({
            path: '/test/path',
            status: 'synced',
            errors: 0,
          }),
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should use default paths when none provided', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.syncFilesystem({});

      expect(result.summary.totalPaths).toBe(1);
      expect(result.results[0].path).toBe(process.cwd());
    });

    it('should handle sync errors', async () => {
      // Mock to simulate error handling
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.syncFilesystem({
        paths: ['/invalid/path'],
        force: false,
      });

      // Should still return success but may have errors in individual results
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });
  });

  describe('clearCache procedure', () => {
    it('should clear all caches', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.clearCache({ type: 'all' });

      expect(result).toMatchObject({
        success: true,
        type: 'all',
        caches: expect.arrayContaining([
          expect.objectContaining({ type: 'entities' }),
          expect.objectContaining({ type: 'relationships' }),
          expect.objectContaining({ type: 'search' }),
        ]),
        summary: {
          totalItemsCleared: expect.any(Number),
          totalSizeFreed: expect.any(Number),
          duration: expect.any(Number),
        },
        timestamp: expect.any(String),
      });

      expect(result.caches).toHaveLength(3);
    });

    it('should clear specific cache type', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.clearCache({ type: 'entities' });

      expect(result.type).toBe('entities');
      expect(result.caches).toHaveLength(1);
      expect(result.caches[0].type).toBe('entities');
    });

    it('should clear search cache only', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.clearCache({ type: 'search' });

      expect(result.caches).toHaveLength(1);
      expect(result.caches[0].type).toBe('search');
    });
  });

  describe('getConfig procedure', () => {
    it('should return system configuration', async () => {
      mockContext.dbService.getConfig.mockReturnValue({
        version: '1.0.0',
      });

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.getConfig();

      expect(result).toMatchObject({
        version: '1.0.0',
        environment: expect.any(String),
        features: {
          websocket: true,
          graphSearch: true,
          history: expect.any(Boolean),
        },
      });
    });

    it('should handle missing config gracefully', async () => {
      mockContext.dbService.getConfig.mockReturnValue(null);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.getConfig();

      expect(result.version).toBe('unknown');
      expect(result.features).toBeDefined();
    });
  });

  describe('updateConfig procedure', () => {
    it('should update boolean feature flags', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.updateConfig({
        key: 'features.websocket',
        value: false,
      });

      expect(result).toMatchObject({
        success: true,
        key: 'features.websocket',
        previousValue: true,
        newValue: false,
        appliedAt: expect.any(String),
        requiresRestart: false,
        timestamp: expect.any(String),
      });
    });

    it('should update numeric performance settings', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.updateConfig({
        key: 'performance.cacheSize',
        value: 2000,
      });

      expect(result).toMatchObject({
        success: true,
        key: 'performance.cacheSize',
        newValue: 2000,
        requiresRestart: true,
      });
    });

    it('should validate logging level values', async () => {
      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.updateConfig({
        key: 'logging.level',
        value: 'debug',
      });

      expect(result.success).toBe(true);
      expect(result.newValue).toBe('debug');
    });

    it('should reject invalid configuration keys', async () => {
      const caller = adminRouter.createCaller(mockContext);

      await expect(caller.updateConfig({
        key: 'invalid.key',
        value: 'test',
      })).rejects.toThrow(TRPCError);
    });

    it('should reject invalid feature flag values', async () => {
      const caller = adminRouter.createCaller(mockContext);

      await expect(caller.updateConfig({
        key: 'features.websocket',
        value: 'invalid',
      })).rejects.toThrow(TRPCError);
    });

    it('should reject invalid logging levels', async () => {
      const caller = adminRouter.createCaller(mockContext);

      await expect(caller.updateConfig({
        key: 'logging.level',
        value: 'invalid',
      })).rejects.toThrow(TRPCError);
    });
  });

  describe('indexHealth procedure', () => {
    it('should return index health status', async () => {
      const mockHealth = {
        status: 'healthy',
        indexes: ['entity_id', 'relationship_type'],
        performance: { queryTime: 50 },
      };

      mockContext.kgService.getIndexHealth.mockResolvedValue(mockHealth);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.indexHealth();

      expect(result).toEqual(mockHealth);
      expect(mockContext.kgService.getIndexHealth).toHaveBeenCalled();
    });
  });

  describe('ensureIndexes procedure', () => {
    it('should ensure indexes and return health', async () => {
      const mockHealth = {
        status: 'healthy',
        indexes: ['entity_id', 'relationship_type'],
      };

      mockContext.kgService.ensureGraphIndexes.mockResolvedValue(undefined);
      mockContext.kgService.getIndexHealth.mockResolvedValue(mockHealth);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.ensureIndexes();

      expect(result).toMatchObject({
        ensured: true,
        health: mockHealth,
      });

      expect(mockContext.kgService.ensureGraphIndexes).toHaveBeenCalled();
      expect(mockContext.kgService.getIndexHealth).toHaveBeenCalled();
    });
  });

  describe('runBenchmarks procedure', () => {
    it('should run quick benchmarks by default', async () => {
      const mockBenchmarks = {
        mode: 'quick',
        results: { queryTime: 100, throughput: 500 },
      };

      mockContext.kgService.runBenchmarks.mockResolvedValue(mockBenchmarks);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.runBenchmarks();

      expect(result).toEqual(mockBenchmarks);
      expect(mockContext.kgService.runBenchmarks).toHaveBeenCalledWith({ mode: 'quick' });
    });

    it('should run full benchmarks when specified', async () => {
      const mockBenchmarks = {
        mode: 'full',
        results: { queryTime: 150, throughput: 400, coverage: 95 },
      };

      mockContext.kgService.runBenchmarks.mockResolvedValue(mockBenchmarks);

      const caller = adminRouter.createCaller(mockContext);
      const result = await caller.runBenchmarks({ mode: 'full' });

      expect(result).toEqual(mockBenchmarks);
      expect(mockContext.kgService.runBenchmarks).toHaveBeenCalledWith({ mode: 'full' });
    });
  });
});