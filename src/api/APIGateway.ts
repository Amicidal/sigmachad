/**
 * API Gateway for Memento
 * Main entry point for all API interactions (REST, WebSocket, GraphQL)
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createTRPCContext, appRouter } from './trpc/router.js';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { FileWatcher } from '../services/FileWatcher.js';
import { ASTParser } from '../services/ASTParser.js';
import { DocumentationParser } from '../services/DocumentationParser.js';
import { SynchronizationCoordinator } from '../services/SynchronizationCoordinator.js';
import { ConflictResolution } from '../services/ConflictResolution.js';
import { SynchronizationMonitoring } from '../services/SynchronizationMonitoring.js';
import { RollbackCapabilities } from '../services/RollbackCapabilities.js';
import { TestEngine } from '../services/TestEngine.js';
import { SecurityScanner } from '../services/SecurityScanner.js';

// Import route handlers
import { registerDesignRoutes } from './routes/design.js';
import { registerTestRoutes } from './routes/tests.js';
import { registerGraphRoutes } from './routes/graph.js';
import { registerCodeRoutes } from './routes/code.js';
import { registerImpactRoutes } from './routes/impact.js';
// import { registerVDBRoutes } from './routes/vdb.js';
import { registerSCMRoutes } from './routes/scm.js';
import { registerDocsRoutes } from './routes/docs.js';
import { registerSecurityRoutes } from './routes/security.js';
import { registerAdminRoutes } from './routes/admin.js';
import { MCPRouter } from './mcp-router.js';
import { WebSocketRouter } from './websocket-router.js';
import { sanitizeInput } from './middleware/validation.js';
import { defaultRateLimit, searchRateLimit, adminRateLimit, startCleanupInterval } from './middleware/rate-limiting.js';

export interface APIGatewayConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    max: number;
    timeWindow: string;
  };
}

export interface SynchronizationServices {
  syncCoordinator?: SynchronizationCoordinator;
  syncMonitor?: SynchronizationMonitoring;
  conflictResolver?: ConflictResolution;
  rollbackCapabilities?: RollbackCapabilities;
}

export class APIGateway {
  private app: FastifyInstance;
  private config: APIGatewayConfig;
  private mcpRouter: MCPRouter;
  private wsRouter: WebSocketRouter;
  private testEngine: TestEngine;
  private securityScanner: SecurityScanner;
  private syncServices?: SynchronizationServices;

  constructor(
    private kgService: KnowledgeGraphService,
    private dbService: DatabaseService,
    private fileWatcher: FileWatcher,
    private astParser: ASTParser,
    private docParser: DocumentationParser,
    securityScanner: SecurityScanner,
    config: Partial<APIGatewayConfig> = {},
    syncServices?: SynchronizationServices
  ) {
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      cors: {
        origin: config.cors?.origin || ['http://localhost:3000', 'http://localhost:5173'],
        credentials: config.cors?.credentials ?? true,
      },
      rateLimit: {
        max: config.rateLimit?.max || 100,
        timeWindow: config.rateLimit?.timeWindow || '1 minute',
      },
    };

    this.syncServices = syncServices;

    this.app = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
      },
      disableRequestLogging: false,
      ignoreTrailingSlash: true,
    });

    // Initialize TestEngine
    this.testEngine = new TestEngine(this.kgService, this.dbService);

    // Use the provided SecurityScanner
    this.securityScanner = securityScanner;

    // Initialize MCP Router
    this.mcpRouter = new MCPRouter(this.kgService, this.dbService, this.astParser, this.testEngine, this.securityScanner);

    // Initialize WebSocket Router
    this.wsRouter = new WebSocketRouter(this.kgService, this.dbService, this.fileWatcher);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.register(fastifyCors, this.config.cors);

    // WebSocket support (handled by WebSocketRouter)
    this.app.register(fastifyWebsocket);

    // Global input sanitization
    this.app.addHook('onRequest', async (request, reply) => {
      await sanitizeInput()(request, reply);
    });

    // Global rate limiting
    this.app.addHook('onRequest', async (request, reply) => {
      await defaultRateLimit(request, reply);
    });

    // Specific rate limiting for search endpoints
    this.app.addHook('onRequest', async (request, reply) => {
      if (request.url.includes('/search')) {
        await searchRateLimit(request, reply);
      }
    });

    // Specific rate limiting for admin endpoints
    this.app.addHook('onRequest', async (request, reply) => {
      if (request.url.includes('/admin')) {
        await adminRateLimit(request, reply);
      }
    });

    // Request ID middleware
    this.app.addHook('onRequest', (request, reply, done) => {
      request.id = request.headers['x-request-id'] as string || this.generateRequestId();
      reply.header('x-request-id', request.id);
      done();
    });

    // Request logging middleware
    this.app.addHook('onRequest', (request, reply, done) => {
      request.log.info({
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
      done();
    });

    // Response logging middleware
    this.app.addHook('onResponse', (request, reply, done) => {
      request.log.info({
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      });
      done();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (request, reply) => {
      const dbHealth = await this.dbService.healthCheck();
      const mcpValidation = await this.mcpRouter.validateServer();

      const services = {
        ...dbHealth,
        mcp: mcpValidation.isValid,
      };

      const isHealthy = Object.values(services).every(status => status !== false);

      reply.status(isHealthy ? 200 : 503).send({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services,
        uptime: process.uptime(),
        mcp: {
          tools: this.mcpRouter.getToolCount(),
          validation: mcpValidation,
        },
      });
    });

    // OpenAPI documentation endpoint
    this.app.get('/docs', async (request, reply) => {
      const { openApiSpec } = await import('./trpc/openapi.js');
      reply.send(openApiSpec);
    });

    // Test route to verify registration is working
    this.app.get('/api/v1/test', async (request, reply) => {
      reply.send({ message: 'Route registration is working!', timestamp: new Date().toISOString() });
    });

    // API v1 routes
    this.app.register(
      async (app) => {
        try {
          // Register all route modules
          registerDesignRoutes(app, this.kgService, this.dbService);
          registerTestRoutes(app, this.kgService, this.dbService, this.testEngine);
          registerGraphRoutes(app, this.kgService, this.dbService);
          registerCodeRoutes(app, this.kgService, this.dbService, this.astParser);
          registerImpactRoutes(app, this.kgService, this.dbService);
          // registerVDBRoutes(app, this.kgService, this.dbService); // Commented out - file removed
          registerSCMRoutes(app, this.kgService, this.dbService);
          registerDocsRoutes(app, this.kgService, this.dbService, this.docParser);
          registerSecurityRoutes(app, this.kgService, this.dbService, this.securityScanner);
          registerAdminRoutes(
            app,
            this.kgService,
            this.dbService,
            this.fileWatcher,
            this.syncServices?.syncCoordinator,
            this.syncServices?.syncMonitor,
            this.syncServices?.conflictResolver,
            this.syncServices?.rollbackCapabilities
          );
          console.log('✅ All route modules registered successfully');
        } catch (error) {
          console.error('❌ Error registering routes:', error);
        }
      },
      { prefix: '/api/v1' }
    );

    // Register tRPC routes
    this.app.register(fastifyTRPCPlugin, {
      prefix: '/api/trpc',
      trpcOptions: {
        router: appRouter,
        createContext: () => createTRPCContext({
          kgService: this.kgService,
          dbService: this.dbService,
          astParser: this.astParser,
          fileWatcher: this.fileWatcher,
        }),
      },
    });

    // Register WebSocket routes
    this.wsRouter.registerRoutes(this.app);

    // GraphQL endpoint (placeholder for future implementation)
    this.app.get('/graphql', async (request, reply) => {
      reply.send({
        message: 'GraphQL endpoint not yet implemented',
        status: 'coming_soon',
      });
    });

    // Register MCP routes (for Claude integration)
    this.mcpRouter.registerRoutes(this.app);

    // 404 handler
    this.app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found`,
        requestId: request.id,
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.setErrorHandler((error, request, reply) => {
      const statusCode = error.statusCode || 500;
      const isServerError = statusCode >= 500;

      request.log.error({
        error: error.message,
        stack: error.stack,
        statusCode,
        url: request.url,
        method: request.method,
      });

      reply.status(statusCode).send({
        error: {
          code: this.getErrorCode(error),
          message: isServerError ? 'Internal Server Error' : error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        requestId: request.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }



  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'NotFoundError') return 'NOT_FOUND';
    return 'INTERNAL_ERROR';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateMCPServer(): Promise<void> {
    console.log('🔍 Validating MCP server configuration...');

    const validation = await this.mcpRouter.validateServer();

    if (!validation.isValid) {
      console.error('❌ MCP server validation failed:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('MCP server validation failed');
    }

    console.log('✅ MCP server validation passed');
  }

  async start(): Promise<void> {
    try {
      // Start rate limiting cleanup interval
      startCleanupInterval();

      // Validate MCP server before starting
      await this.validateMCPServer();

      // Start WebSocket connection management
      this.wsRouter.startConnectionManagement();

      await this.app.listen({
        port: this.config.port,
        host: this.config.host,
      });

      console.log(`🚀 Memento API Gateway listening on http://${this.config.host}:${this.config.port}`);
      console.log(`📊 Health check available at http://${this.config.host}:${this.config.port}/health`);
      console.log(`🔌 WebSocket available at ws://${this.config.host}:${this.config.port}/ws`);
      console.log(`🤖 MCP server available at http://${this.config.host}:${this.config.port}/mcp`);
      console.log(`📋 MCP tools: ${this.mcpRouter.getToolCount()} registered`);
      console.log(`🛡️  Rate limiting and validation middleware active`);
    } catch (error) {
      console.error('Failed to start API Gateway:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Stop WebSocket router first
    await this.wsRouter.shutdown();

    await this.app.close();
    console.log('🛑 API Gateway stopped');
  }

  getApp(): FastifyInstance {
    return this.app;
  }

  // Method to get current configuration
  getConfig(): APIGatewayConfig {
    return { ...this.config };
  }
}
