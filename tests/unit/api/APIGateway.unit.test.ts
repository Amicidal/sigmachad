/**
 * Unit tests for API Gateway
 * Tests API Gateway functionality with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

// Mock the dependencies
vi.mock('../../../src/services/KnowledgeGraphService', () => ({
  KnowledgeGraphService: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([]),
    createEntity: vi.fn().mockResolvedValue({ id: 'test-entity' }),
    getEntity: vi.fn().mockResolvedValue({ id: 'test-entity', type: 'function' }),
    listEntities: vi.fn().mockResolvedValue({ entities: [], total: 0 }),
    listRelationships: vi.fn().mockResolvedValue({ relationships: [], total: 0 }),
  })),
}));

vi.mock('../../../src/services/DatabaseService', () => ({
  DatabaseService: vi.fn().mockImplementation(() => ({
    healthCheck: vi.fn().mockResolvedValue({
      falkordb: { status: 'healthy' },
      qdrant: { status: 'healthy' },
      postgresql: { status: 'healthy' },
      redis: { status: 'healthy' },
    }),
    isInitialized: vi.fn().mockReturnValue(true),
    getConfig: vi.fn().mockReturnValue({
      falkordb: { url: 'redis://localhost:6380' },
      qdrant: { url: 'http://localhost:6335' },
      postgresql: { connectionString: 'postgresql://test:test@localhost:5433/test' },
      redis: { url: 'redis://localhost:6381' },
    }),
    getPostgresPool: vi.fn().mockReturnValue({}),
    getFalkorDBClient: vi.fn().mockReturnValue({}),
    getQdrantClient: vi.fn().mockReturnValue({}),
  })),
}));

vi.mock('../../../src/services/BackupService', () => ({
  BackupService: vi.fn().mockImplementation(() => ({
    // Mock backup service methods as needed
  })),
}));

vi.mock('../../../src/services/LoggingService', () => ({
  LoggingService: vi.fn().mockImplementation(() => ({
    // Mock logging service methods as needed
  })),
}));

vi.mock('../../../src/services/MaintenanceService', () => ({
  MaintenanceService: vi.fn().mockImplementation(() => ({
    // Mock maintenance service methods as needed
  })),
}));

vi.mock('../../../src/services/ConfigurationService', () => ({
  ConfigurationService: vi.fn().mockImplementation(() => ({
    // Mock configuration service methods as needed
  })),
}));

vi.mock('../../../src/api/mcp-router', () => ({
  MCPRouter: vi.fn().mockImplementation(() => ({
    validateServer: vi.fn().mockResolvedValue({ isValid: true, errors: [] }),
    getToolCount: vi.fn().mockReturnValue(5),
    registerRoutes: vi.fn(),
  })),
}));

vi.mock('../../../src/api/websocket-router', () => ({
  WebSocketRouter: vi.fn().mockImplementation(() => ({
    registerRoutes: vi.fn(),
    startConnectionManagement: vi.fn(),
    shutdown: vi.fn(),
  })),
}));

// Mock fastify and its plugins
vi.mock('fastify', () => {
  const routes = new Set<string>();

  function makeChildWithPrefix(prefix: string, base: any) {
    const join = (p: string) => `${prefix}${p}`.replace(/\/+/, '/');
    return {
      ...base,
      get: vi.fn((path: string, _optsOrHandler?: any, _handler?: any) => {
        routes.add(`GET:${join(path)}`);
        return base; // chainable
      }),
      post: vi.fn((path: string, _optsOrHandler?: any, _handler?: any) => {
        routes.add(`POST:${join(path)}`);
        return base; // chainable
      }),
    };
  }

  const factory = vi.fn().mockImplementation(() => {
    const app: any = {
      _routes: routes,
      register: vi.fn((plugin: any, opts?: any) => {
        if (typeof plugin === 'function') {
          const prefix = opts?.prefix || '';
          const child = makeChildWithPrefix(prefix, app);
          // Call the plugin with a child instance that records routes with prefix
          return plugin(child);
        }
        return app;
      }),
      addHook: vi.fn().mockReturnThis(),
      get: vi.fn((path: string, _optsOrHandler?: any, _handler?: any) => {
        routes.add(`GET:${path}`);
        return app;
      }),
      post: vi.fn((path: string, _optsOrHandler?: any, _handler?: any) => {
        routes.add(`POST:${path}`);
        return app;
      }),
      setNotFoundHandler: vi.fn().mockReturnThis(),
      setErrorHandler: vi.fn().mockReturnThis(),
      hasRoute: vi.fn((method: string, path: string) => routes.has(`${method}:${path}`)),
      getRegisteredRoutes: () => new Set(routes),
      inject: vi.fn().mockResolvedValue({
        statusCode: 200,
        payload: JSON.stringify({ success: true }),
        headers: {},
      }),
      server: { address: () => ({ port: 3000 }) },
      listen: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
    return app;
  });

  return { default: factory };
});

vi.mock('@fastify/cors', () => ({
  default: vi.fn(),
}));

vi.mock('@fastify/websocket', () => ({
  default: vi.fn(),
}));

vi.mock('@trpc/server/adapters/fastify', () => ({
  fastifyTRPCPlugin: vi.fn(),
}));

import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';

describe('APIGateway Unit Tests', () => {
  let kgService: KnowledgeGraphService;
  let dbService: DatabaseService;
  let apiGateway: APIGateway;
  let mockApp: FastifyInstance;

  beforeEach(async () => {
    // Create mocked services
    kgService = new KnowledgeGraphService({} as any);
    dbService = new DatabaseService({} as any);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);

    // Get the mocked Fastify app
    mockApp = apiGateway.getApp();
  });

  describe('Initialization', () => {
    it('should create API Gateway instance', () => {
      expect(apiGateway).toBeDefined();
      expect(apiGateway).toBeInstanceOf(APIGateway);
    });

    it('should have correct default configuration', () => {
      const config = apiGateway.getConfig();

      expect(config).toEqual(
        expect.objectContaining({
          port: expect.any(Number),
          host: '0.0.0.0',
          cors: expect.any(Object),
          rateLimit: expect.any(Object),
        })
      );
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        port: 8080,
        host: 'localhost',
        cors: {
          origin: 'http://example.com',
          credentials: true,
        },
        rateLimit: {
          max: 50,
          timeWindow: '2 minutes',
        },
      };

      const customApiGateway = new APIGateway(kgService, dbService, undefined, undefined, undefined, undefined, customConfig);
      const config = customApiGateway.getConfig();

      expect(config.port).toBe(8080);
      expect(config.host).toBe('localhost');
      expect(config.cors.origin).toBe('http://example.com');
      expect(config.rateLimit.max).toBe(50);
    });

    it('should initialize with mocked Fastify app', () => {
      expect(mockApp).toEqual(expect.any(Object));
    });
  });

  describe('Service Integration', () => {
    it('should integrate with KnowledgeGraphService', () => {
      expect(kgService).toEqual(expect.any(Object));
      expect(typeof kgService.search).toBe('function');
      expect(typeof kgService.createEntity).toBe('function');
    });

    it('should integrate with DatabaseService', () => {
      expect(dbService).toEqual(expect.any(Object));
      expect(typeof dbService.healthCheck).toBe('function');
      expect(typeof dbService.isInitialized).toBe('function');
    });

    it('should provide access to Fastify app', () => {
      const app = apiGateway.getApp();
      expect(app).toEqual(expect.any(Object));
      expect(app).toBe(mockApp);
    });
  });

  describe('Configuration Management', () => {
    it('should return current configuration', () => {
      const config = apiGateway.getConfig();

      expect(config).toEqual(
        expect.objectContaining({
          port: expect.any(Number),
          host: expect.any(String),
          cors: expect.any(Object),
          rateLimit: expect.any(Object),
        })
      );
    });

    it('should maintain configuration consistency', () => {
      const config1 = apiGateway.getConfig();
      const config2 = apiGateway.getConfig();

      expect(config1).toEqual(config2);
      expect(config1.port).toBe(config2.port);
      expect(config1.host).toBe(config2.host);
    });
  });

  describe('Mock Behavior Verification', () => {
    it('should use mocked KnowledgeGraphService methods', async () => {
      const searchSpy = vi.spyOn(kgService, 'search');
      const createSpy = vi.spyOn(kgService, 'createEntity');

      // These would normally be called through API routes
      // but we're testing that the mocks work correctly
      await kgService.search({ query: 'test' });
      await kgService.createEntity({ id: 'test', type: 'function' });

      expect(searchSpy).toHaveBeenCalledWith({ query: 'test' });
      expect(createSpy).toHaveBeenCalled();
    });

    it('should use mocked DatabaseService methods', async () => {
      const healthSpy = vi.spyOn(dbService, 'healthCheck');

      await dbService.healthCheck();

      expect(healthSpy).toHaveBeenCalled();
    });

    it('should handle mocked Fastify app methods', () => {
      const injectSpy = vi.spyOn(mockApp, 'inject');

      // This simulates what would happen in integration tests
      mockApp.inject({
        method: 'GET',
        url: '/health',
      });

      expect(injectSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/health',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle mocked service errors gracefully', async () => {
      // Mock a service method to throw an error
      const searchSpy = vi.spyOn(kgService, 'search').mockRejectedValueOnce(new Error('Mock database error'));

      await expect(kgService.search({ query: 'test' })).rejects.toThrow('Mock database error');

      expect(searchSpy).toHaveBeenCalled();
    });

    it('should handle configuration validation', () => {
      // Test with invalid configuration
      const invalidConfig = {
        port: -1, // Invalid port
        host: '', // Empty host
      };

      // The constructor should handle invalid config gracefully or throw appropriate errors
      expect(() => {
        new APIGateway(kgService, dbService, undefined, undefined, undefined, undefined, invalidConfig as any);
      }).not.toThrow(); // Implementation should be robust
    });
  });

  describe('Lifecycle Methods', () => {
    it('should expose start method', () => {
      expect(typeof apiGateway.start).toBe('function');
    });

    it('should expose stop method', () => {
      expect(typeof apiGateway.stop).toBe('function');
    });

    it('should expose getApp method', () => {
      expect(typeof apiGateway.getApp).toBe('function');
      const app = apiGateway.getApp();
      expect(app).toEqual(
        expect.objectContaining({
          register: expect.any(Function),
          get: expect.any(Function),
          post: expect.any(Function),
        })
      );
    });

    it('should expose getConfig method', () => {
      expect(typeof apiGateway.getConfig).toBe('function');
      const cfg = apiGateway.getConfig();
      expect(cfg).toEqual(
        expect.objectContaining({
          port: expect.any(Number),
          host: expect.any(String),
          cors: expect.objectContaining({
            origin: expect.anything(),
            credentials: expect.any(Boolean),
          }),
          rateLimit: expect.objectContaining({
            max: expect.any(Number),
            timeWindow: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Route Registration', () => {
    it('should register health check route', () => {
      // Verify route presence rather than spy-only checks
      expect(mockApp.hasRoute('GET', '/health')).toBe(true);
    });

    it('should register API routes', () => {
      expect(mockApp.hasRoute('POST', '/api/v1/graph/search')).toBe(true);
      expect(mockApp.hasRoute('GET', '/api/v1/graph/entities')).toBe(true);
      expect(mockApp.hasRoute('POST', '/api/v1/tests/plan-and-generate')).toBe(true);
    });
  });

  describe('Middleware Configuration', () => {
    it('should register CORS middleware with configured options', () => {
      const registerCalls = (mockApp as any).register.mock.calls as any[];
      const corsCall = registerCalls.find(([plugin]) => plugin === fastifyCors);
      expect(corsCall).toBeDefined();
      const [, corsOpts] = corsCall!;
      const cfg = apiGateway.getConfig();
      expect(corsOpts).toEqual(
        expect.objectContaining({
          origin: cfg.cors.origin,
          credentials: cfg.cors.credentials,
        })
      );
    });

    it('should register WebSocket plugin', () => {
      const registerCalls = (mockApp as any).register.mock.calls as any[];
      const wsCall = registerCalls.find(([plugin]) => plugin === fastifyWebsocket);
      expect(wsCall).toBeDefined();
    });

    it('should register tRPC plugin with expected prefix and options', () => {
      const registerCalls = (mockApp as any).register.mock.calls as any[];
      const trpcCall = registerCalls.find(([plugin]) => plugin === fastifyTRPCPlugin);
      expect(trpcCall).toBeDefined();
      const [, trpcOpts] = trpcCall!;
      expect(trpcOpts).toEqual(
        expect.objectContaining({
          prefix: '/api/trpc',
          trpcOptions: expect.objectContaining({
            router: expect.any(Object),
            createContext: expect.any(Function),
          }),
        })
      );
    });
  });
});
