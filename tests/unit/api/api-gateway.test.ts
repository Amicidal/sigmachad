/**
 * Unit tests for API Gateway
 * Tests basic initialization and core functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { APIGateway, APIGatewayConfig } from '../../../src/api/APIGateway.js';

// Mock all external dependencies
vi.mock('../../../src/services/KnowledgeGraphService.js');
vi.mock('../../../src/services/DatabaseService.js');
vi.mock('../../../src/services/TestEngine.js');
vi.mock('../../../src/services/SecurityScanner.js');
vi.mock('../../../src/services/ASTParser.js');
vi.mock('../../../src/services/DocumentationParser.js');
vi.mock('../../../src/services/FileWatcher.js');
vi.mock('../../../src/services/SynchronizationCoordinator.js');
vi.mock('../../../src/services/SynchronizationMonitoring.js');
vi.mock('../../../src/services/ConflictResolution.js');
vi.mock('../../../src/services/RollbackCapabilities.js');
vi.mock('../../../src/services/BackupService.js');
vi.mock('../../../src/services/LoggingService.js');
vi.mock('../../../src/services/MaintenanceService.js');
vi.mock('../../../src/services/ConfigurationService.js');
vi.mock('../../../src/api/mcp-router.js');
vi.mock('../../../src/api/websocket-router.js');

// Import types after mocking
import type { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import type { DatabaseService } from '../../../src/services/DatabaseService.js';

describe('APIGateway', () => {
  let mockKgService: KnowledgeGraphService;
  let mockDbService: DatabaseService;

  beforeEach(() => {
    mockKgService = {
      createEntity: vi.fn().mockResolvedValue(undefined),
      updateEntity: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([]),
      getRelationships: vi.fn().mockResolvedValue([]),
      getEntity: vi.fn().mockResolvedValue(null),
      createRelationship: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockDbService = {
      healthCheck: vi.fn().mockResolvedValue({
        database: 'healthy',
        connection: 'connected',
        uptime: 3600
      }),
      postgresQuery: vi.fn().mockResolvedValue([]),
      initialize: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn().mockReturnValue({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'test',
        password: 'test'
      })
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create APIGateway instance with mocked setup methods', () => {
      // Mock the setup methods to avoid complex Fastify initialization
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const gateway = new APIGateway(mockKgService, mockDbService);
        expect(gateway).toBeInstanceOf(APIGateway);
        expect(gateway.getConfig()).toBeDefined();
      } finally {
        // Always restore original methods
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });

    it('should handle custom configuration with mocked setup methods', () => {
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const customConfig: Partial<APIGatewayConfig> = {
          port: 8080,
          host: '127.0.0.1'
        };

        const gateway = new APIGateway(mockKgService, mockDbService, undefined, undefined, undefined, undefined, customConfig);

        const config = gateway.getConfig();
        expect(config.port).toBe(8080);
        expect(config.host).toBe('127.0.0.1');
      } finally {
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });

    it('should generate unique request IDs with mocked setup methods', () => {
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const gateway = new APIGateway(mockKgService, mockDbService);

        const id1 = (gateway as any).generateRequestId();
        const id2 = (gateway as any).generateRequestId();

        expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
        expect(id1).not.toBe(id2);
      } finally {
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });

    it('should get error codes for different error types with mocked setup methods', () => {
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const gateway = new APIGateway(mockKgService, mockDbService);

        const getErrorCode = (gateway as any).getErrorCode.bind(gateway);

        expect(getErrorCode({ code: 'CUSTOM_ERROR' })).toBe('CUSTOM_ERROR');
        expect(getErrorCode({ name: 'ValidationError' })).toBe('VALIDATION_ERROR');
        expect(getErrorCode({ name: 'NotFoundError' })).toBe('NOT_FOUND');
        expect(getErrorCode(new Error('Generic error'))).toBe('INTERNAL_ERROR');
      } finally {
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });

    it('should handle default configuration values', () => {
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const gateway = new APIGateway(mockKgService, mockDbService);
        const config = gateway.getConfig();

        expect(config).toEqual({
          port: 3000,
          host: '0.0.0.0',
          cors: {
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true,
          },
          rateLimit: {
            max: 100,
            timeWindow: '1 minute',
          },
        });
      } finally {
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });

    it('should handle partial configuration overrides', () => {
      const originalSetupMiddleware = APIGateway.prototype.setupMiddleware;
      const originalSetupRoutes = APIGateway.prototype.setupRoutes;
      const originalSetupErrorHandling = APIGateway.prototype.setupErrorHandling;

      APIGateway.prototype.setupMiddleware = vi.fn();
      APIGateway.prototype.setupRoutes = vi.fn();
      APIGateway.prototype.setupErrorHandling = vi.fn();

      try {
        const partialConfig: Partial<APIGatewayConfig> = {
          port: 9999
          // Only override port, others should be defaults
        };

        const gateway = new APIGateway(mockKgService, mockDbService, undefined, undefined, undefined, undefined, partialConfig);
        const config = gateway.getConfig();

        expect(config.port).toBe(9999);
        expect(config.host).toBe('0.0.0.0'); // Default
        expect(config.cors.origin).toEqual(['http://localhost:3000', 'http://localhost:5173']); // Default
        expect(config.rateLimit.max).toBe(100); // Default
      } finally {
        APIGateway.prototype.setupMiddleware = originalSetupMiddleware;
        APIGateway.prototype.setupRoutes = originalSetupRoutes;
        APIGateway.prototype.setupErrorHandling = originalSetupErrorHandling;
      }
    });
  });
});