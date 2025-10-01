/**
 * Lean unit tests for APIGateway focusing on configuration and wiring.
 * Heavy Fastify and route wiring is covered by integration suites.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { KnowledgeGraphService } from '@memento/knowledge';
import type { DatabaseService } from '@memento/database/DatabaseService';

// --- Shared spies for constructor side effects --------------------------------
const fastifyStubs: Array<ReturnType<typeof createFastifyStub>> = [];
const createFastifyStub = () => {
  const routes = new Set<string>();
  const stub = {
    register: vi.fn().mockReturnThis(),
    addHook: vi.fn().mockReturnThis(),
    decorate: vi.fn().mockReturnThis(),
    setNotFoundHandler: vi.fn().mockReturnThis(),
    setErrorHandler: vi.fn().mockReturnThis(),
    get: vi.fn((path: string) => {
      routes.add(`GET:${path}`);
      return stub;
    }),
    post: vi.fn((path: string) => {
      routes.add(`POST:${path}`);
      return stub;
    }),
    hasRoute: vi.fn((method: string, path: string) =>
      routes.has(`${method.toUpperCase()}:${path}`)
    ),
    inject: vi.fn().mockResolvedValue({ statusCode: 200 }),
    server: { address: vi.fn(() => ({ port: 3000 })) },
    listen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  } as any;
  fastifyStubs.push(stub);
  return stub;
};

vi.mock('fastify', () => ({
  default: vi.fn(() => createFastifyStub()),
}));

const testEngineCtor = vi.fn();
vi.mock('@memento/testing/TestEngine', () => ({
  TestEngine: vi.fn().mockImplementation(function TestEngineMock(...args: unknown[]) {
    testEngineCtor(...args);
    return { executePlan: vi.fn() };
  }),
}));

const securityScannerCtor = vi.fn();
vi.mock('@memento/testing/security/scanner', () => ({
  SecurityScanner: vi.fn().mockImplementation(function SecurityScannerMock(...args: unknown[]) {
    securityScannerCtor(...args);
    return { scan: vi.fn() };
  }),
}));

const astParserCtor = vi.fn();
vi.mock('@memento/knowledge', () => ({
  ASTParser: vi.fn().mockImplementation(function ASTParserMock() {
    astParserCtor();
    return { initialize: vi.fn(), clearCache: vi.fn() };
  }),
}));

const documentationParserCtor = vi.fn();
vi.mock('@memento/knowledge', () => ({
  DocumentationParser: vi.fn().mockImplementation(function DocumentationParserMock(...args: unknown[]) {
    documentationParserCtor(...args);
    return { parse: vi.fn() };
  }),
}));

const backupServiceCtor = vi.fn();
vi.mock('@memento/backup/BackupService', () => ({
  BackupService: vi.fn().mockImplementation(function BackupServiceMock(...args: unknown[]) {
    backupServiceCtor(...args);
    return { createCheckpoint: vi.fn() };
  }),
}));

const loggingServiceCtor = vi.fn();
vi.mock('@memento/core/services/LoggingService', () => ({
  LoggingService: vi.fn().mockImplementation(function LoggingServiceMock(...args: unknown[]) {
    loggingServiceCtor(...args);
    return { log: vi.fn() };
  }),
}));

const maintenanceServiceCtor = vi.fn();
vi.mock('@memento/core/services/MaintenanceService', () => ({
  MaintenanceService: vi.fn().mockImplementation(function MaintenanceServiceMock(...args: unknown[]) {
    maintenanceServiceCtor(...args);
    return { runMaintenance: vi.fn() };
  }),
}));

const configurationServiceCtor = vi.fn();
vi.mock('@memento/core/services/ConfigurationService', () => ({
  ConfigurationService: vi.fn().mockImplementation(function ConfigurationServiceMock(...args: unknown[]) {
    configurationServiceCtor(...args);
    return { getSettings: vi.fn() };
  }),
}));

const mcpRouterCtor = vi.fn();
vi.mock('@memento/api/mcp-router', () => ({
  MCPRouter: vi.fn().mockImplementation(function MCPRouterMock(...args: unknown[]) {
    mcpRouterCtor(...args);
    return { registerRoutes: vi.fn(), getToolCount: vi.fn() };
  }),
}));

const wsRouterCtor = vi.fn();
vi.mock('@memento/api/websocket-router', () => ({
  WebSocketRouter: vi.fn().mockImplementation(function WebSocketRouterMock(...args: unknown[]) {
    wsRouterCtor(...args);
    return { registerRoutes: vi.fn(), shutdown: vi.fn() };
  }),
}));

vi.mock('@fastify/cors', () => ({ default: vi.fn() }));
vi.mock('@fastify/websocket', () => ({ default: vi.fn() }));
vi.mock('@trpc/server/adapters/fastify', () => ({ fastifyTRPCPlugin: vi.fn() }));
vi.mock('@fastify/static', () => ({ default: vi.fn() }));

import { APIGateway } from '@memento/api/APIGateway';

function makeServices(): {
  kg: KnowledgeGraphService;
  db: DatabaseService;
} {
  const kg = {
    search: vi.fn(),
    createEntity: vi.fn(),
    getEntity: vi.fn(),
  } as unknown as KnowledgeGraphService;

  const db = {
    healthCheck: vi.fn().mockResolvedValue({ ok: true }),
    getConfig: vi.fn().mockReturnValue({ fake: true }),
    initialize: vi.fn(),
  } as unknown as DatabaseService;

  return { kg, db };
}

describe('APIGateway (unit)', () => {
  let setupSpies: Array<vi.SpyInstance> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    setupSpies = [
      vi.spyOn(APIGateway.prototype as any, 'setupMiddleware').mockImplementation(() => {}),
      vi.spyOn(APIGateway.prototype as any, 'setupRoutes').mockImplementation(() => {}),
      vi.spyOn(APIGateway.prototype as any, 'setupErrorHandling').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    setupSpies.forEach(spy => spy.mockRestore());
    setupSpies = [];
    fastifyStubs.splice(0, fastifyStubs.length);
  });

  it.each([
    {
      name: 'defaults in test environment',
      input: {},
      expectConfig: {
        port: 0,
        host: '0.0.0.0',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:5173'],
          credentials: true,
        },
        rateLimit: { max: 100, timeWindow: '1 minute' },
      },
    },
    {
      name: 'custom host and port',
      input: { port: 8080, host: '127.0.0.1' },
      expectConfig: {
        port: 8080,
        host: '127.0.0.1',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:5173'],
          credentials: true,
        },
        rateLimit: { max: 100, timeWindow: '1 minute' },
      },
    },
    {
      name: 'custom cors options',
      input: { cors: { origin: 'https://example.com', credentials: false } },
      expectConfig: {
        port: 0,
        host: '0.0.0.0',
        cors: {
          origin: 'https://example.com',
          credentials: false,
        },
        rateLimit: { max: 100, timeWindow: '1 minute' },
      },
    },
    {
      name: 'custom rate limit',
      input: { rateLimit: { max: 10, timeWindow: '30 seconds' } },
      expectConfig: {
        port: 0,
        host: '0.0.0.0',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:5173'],
          credentials: true,
        },
        rateLimit: { max: 10, timeWindow: '30 seconds' },
      },
    },
  ])('merges configuration for $name', ({ input, expectConfig }) => {
    const { kg, db } = makeServices();
    const gateway = new APIGateway(kg, db, undefined, undefined, undefined, undefined, input);

    expect(gateway.getConfig()).toEqual(expectConfig);
    expect(testEngineCtor).toHaveBeenCalledWith(kg, db);
    expect(securityScannerCtor).toHaveBeenCalledWith(db, kg);
    expect(backupServiceCtor).toHaveBeenCalledWith(db, { fake: true });
    expect(configurationServiceCtor).toHaveBeenCalled();
    expect(mcpRouterCtor).toHaveBeenCalledWith(kg, db, expect.any(Object), expect.any(Object), expect.any(Object));
  });

  it('generates unique request identifiers', () => {
    const { kg, db } = makeServices();
    const gateway = new APIGateway(kg, db);
    const makeId = (gateway as any).generateRequestId.bind(gateway);

    const ids = new Set(Array.from({ length: 5 }, () => makeId()));
    expect(ids.size).toBe(5);
    for (const id of ids) {
      expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
    }
  });

  it('maps errors to stable error codes', () => {
    const { kg, db } = makeServices();
    const gateway = new APIGateway(kg, db);
    const getErrorCode = (gateway as any).getErrorCode.bind(gateway);

    expect(getErrorCode({ code: 'CUSTOM' })).toBe('CUSTOM');
    expect(getErrorCode({ name: 'ValidationError' })).toBe('VALIDATION_ERROR');
    expect(getErrorCode({ name: 'NotFoundError' })).toBe('NOT_FOUND');
    expect(getErrorCode({ name: 'AuthError' })).toBe('INTERNAL_ERROR');
    expect(getErrorCode(new Error('boom'))).toBe('INTERNAL_ERROR');
  });

  it('exposes Fastify instance via getApp without touching heavy wiring', () => {
    const { kg, db } = makeServices();
    const gateway = new APIGateway(kg, db);
    const app = gateway.getApp();

    expect(app).toBe(fastifyStubs.at(-1));
    expect(app.listen).toBeInstanceOf(Function);
    expect(app.close).toBeInstanceOf(Function);
  });
});
