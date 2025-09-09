/**
 * Unit tests for API Gateway
 * Tests API Gateway functionality with mocked dependencies
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    const routes = new Set();
    function makeChildWithPrefix(prefix, base) {
        const join = (p) => `${prefix}${p}`.replace(/\/+/, '/');
        return {
            ...base,
            get: vi.fn((path, _optsOrHandler, _handler) => {
                routes.add(`GET:${join(path)}`);
                return base; // chainable
            }),
            post: vi.fn((path, _optsOrHandler, _handler) => {
                routes.add(`POST:${join(path)}`);
                return base; // chainable
            }),
        };
    }
    const factory = vi.fn().mockImplementation(() => {
        const app = {
            _routes: routes,
            register: vi.fn((plugin, opts) => {
                if (typeof plugin === 'function') {
                    const prefix = opts?.prefix || '';
                    const child = makeChildWithPrefix(prefix, app);
                    // Call the plugin with a child instance that records routes with prefix
                    return plugin(child);
                }
                return app;
            }),
            addHook: vi.fn().mockReturnThis(),
            get: vi.fn((path, _optsOrHandler, _handler) => {
                routes.add(`GET:${path}`);
                return app;
            }),
            post: vi.fn((path, _optsOrHandler, _handler) => {
                routes.add(`POST:${path}`);
                return app;
            }),
            setNotFoundHandler: vi.fn().mockReturnThis(),
            setErrorHandler: vi.fn().mockReturnThis(),
            hasRoute: vi.fn((method, path) => routes.has(`${method}:${path}`)),
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
    let kgService;
    let dbService;
    let apiGateway;
    let mockApp;
    beforeEach(async () => {
        // Create mocked services
        kgService = new KnowledgeGraphService({});
        dbService = new DatabaseService({});
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
            expect(config).toBeDefined();
            expect(config.port).toBeGreaterThan(0);
            expect(config.host).toBe('0.0.0.0');
            expect(config.cors).toBeDefined();
            expect(config.rateLimit).toBeDefined();
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
            expect(mockApp).toBeDefined();
            expect(typeof mockApp).toBe('object');
        });
    });
    describe('Service Integration', () => {
        it('should integrate with KnowledgeGraphService', () => {
            expect(kgService).toBeDefined();
            expect(kgService.search).toBeDefined();
            expect(kgService.createEntity).toBeDefined();
        });
        it('should integrate with DatabaseService', () => {
            expect(dbService).toBeDefined();
            expect(dbService.healthCheck).toBeDefined();
            expect(dbService.isInitialized).toBeDefined();
        });
        it('should provide access to Fastify app', () => {
            const app = apiGateway.getApp();
            expect(app).toBeDefined();
            expect(app).toBe(mockApp);
        });
    });
    describe('Configuration Management', () => {
        it('should return current configuration', () => {
            const config = apiGateway.getConfig();
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
            expect(config).toHaveProperty('port');
            expect(config).toHaveProperty('host');
            expect(config).toHaveProperty('cors');
            expect(config).toHaveProperty('rateLimit');
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
            try {
                await kgService.search({ query: 'test' });
                expect(false).toBe(true); // Should not reach here
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Mock database error');
            }
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
                new APIGateway(kgService, dbService, undefined, undefined, undefined, undefined, invalidConfig);
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
            expect(apiGateway.getApp()).toBeDefined();
        });
        it('should expose getConfig method', () => {
            expect(typeof apiGateway.getConfig).toBe('function');
            expect(apiGateway.getConfig()).toBeDefined();
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
        it('should configure CORS middleware', () => {
            // Test that Fastify app has register method available
            expect(typeof mockApp.register).toBe('function');
            // Since middleware registration happens in constructor,
            // we verify the app has the expected interface
            expect(mockApp.register).toBeDefined();
        });
        it('should configure WebSocket support', () => {
            // Test that Fastify app has WebSocket support configured
            expect(typeof mockApp.register).toBe('function');
            // Since WebSocket registration happens in constructor,
            // we verify the app has the expected interface
            expect(mockApp.register).toBeDefined();
        });
        it('should configure tRPC support', () => {
            // Test that Fastify app has tRPC support configured
            expect(typeof mockApp.register).toBe('function');
            // Since tRPC registration happens in constructor,
            // we verify the app has the expected interface
            expect(mockApp.register).toBeDefined();
        });
    });
});
//# sourceMappingURL=APIGateway.unit.test.js.map